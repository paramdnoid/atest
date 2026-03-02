package com.zunftgewerk.api.modules.identity.service;

import com.zunftgewerk.api.config.FeatureFlagProperties;
import com.zunftgewerk.api.modules.audit.service.AuditService;
import com.zunftgewerk.api.modules.identity.entity.EmailVerificationTokenEntity;
import com.zunftgewerk.api.modules.identity.entity.PasswordResetTokenEntity;
import com.zunftgewerk.api.modules.identity.entity.UserEntity;
import com.zunftgewerk.api.modules.identity.model.LoginResult;
import com.zunftgewerk.api.modules.identity.model.MfaEnrollmentResult;
import com.zunftgewerk.api.modules.identity.model.MfaVerifyResult;
import com.zunftgewerk.api.modules.identity.model.PasskeyBeginResult;
import com.zunftgewerk.api.modules.identity.model.RefreshResult;
import com.zunftgewerk.api.modules.identity.model.RegisterResult;
import com.zunftgewerk.api.modules.identity.repository.EmailVerificationTokenRepository;
import com.zunftgewerk.api.modules.identity.repository.PasswordResetTokenRepository;
import com.zunftgewerk.api.modules.identity.repository.UserRepository;
import com.zunftgewerk.api.modules.tenant.entity.MembershipEntity;
import com.zunftgewerk.api.modules.tenant.repository.MembershipRepository;
import com.zunftgewerk.api.modules.tenant.service.TenantService;
import com.zunftgewerk.api.proto.v1.PasskeyMode;
import com.zunftgewerk.api.shared.audit.AuditEventType;
import com.zunftgewerk.api.shared.security.JwtPrincipal;
import com.zunftgewerk.api.shared.security.JwtService;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class IdentityService {

    private static final List<String> ADMIN_ROLES = List.of("owner", "admin");
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final MembershipRepository membershipRepository;
    private final TenantService tenantService;
    private final PasswordHasher passwordHasher;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final MfaService mfaService;
    private final PasskeyService passkeyService;
    private final AuditService auditService;
    private final MeterRegistry meterRegistry;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final TokenHashService tokenHashService;
    private final EmailService emailService;
    private final FeatureFlagProperties featureFlagProperties;

    @Value("${zunftgewerk.email-verification.ttl-seconds:86400}")
    private long emailVerificationTtlSeconds;

    @Value("${zunftgewerk.password-reset.ttl-seconds:3600}")
    private long passwordResetTtlSeconds;

    public IdentityService(
        UserRepository userRepository,
        MembershipRepository membershipRepository,
        TenantService tenantService,
        PasswordHasher passwordHasher,
        JwtService jwtService,
        RefreshTokenService refreshTokenService,
        MfaService mfaService,
        PasskeyService passkeyService,
        AuditService auditService,
        MeterRegistry meterRegistry,
        EmailVerificationTokenRepository emailVerificationTokenRepository,
        PasswordResetTokenRepository passwordResetTokenRepository,
        TokenHashService tokenHashService,
        EmailService emailService,
        FeatureFlagProperties featureFlagProperties
    ) {
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
        this.tenantService = tenantService;
        this.passwordHasher = passwordHasher;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.mfaService = mfaService;
        this.passkeyService = passkeyService;
        this.auditService = auditService;
        this.meterRegistry = meterRegistry;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.tokenHashService = tokenHashService;
        this.emailService = emailService;
        this.featureFlagProperties = featureFlagProperties;
    }

    @Transactional
    public RegisterResult register(String email, String password, String tenantName) {
        String normalizedEmail = email.toLowerCase();
        userRepository.findByEmail(normalizedEmail).ifPresent(existing -> {
            throw new IllegalArgumentException("User already exists");
        });

        UserEntity user = new UserEntity();
        user.setId(UUID.randomUUID());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordHasher.hash(password));
        user.setPasswordAlgo("argon2id");
        user.setMfaEnabled(false);
        user.setCreatedAt(OffsetDateTime.now());
        userRepository.save(user);

        UUID tenantId = tenantService.createTenant(tenantName, user.getId());
        auditService.record(tenantId, user.getId(), AuditEventType.USER_REGISTERED, "{\"email\":\"" + normalizedEmail + "\"}");

        return new RegisterResult(user.getId(), tenantId);
    }

    @Transactional
    public LoginResult login(String email, String password) {
        String normalizedEmail = email.toLowerCase();

        UserEntity user = userRepository.findByEmail(normalizedEmail)
            .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (user.getDisabledAt() != null) {
            throw new IllegalArgumentException("User is disabled");
        }

        if (!passwordHasher.verify(user.getPasswordHash(), password)) {
            auditFailure(user.getId());
            throw new IllegalArgumentException("Invalid credentials");
        }

        SessionContext sessionContext = loadSessionContext(user.getId());
        if (user.isMfaEnabled() && requiresAdminMfa(sessionContext.roles())) {
            String mfaToken = jwtService.issueMfaToken(user.getId(), sessionContext.tenantId(), sessionContext.roles());
            return new LoginResult(
                true,
                "",
                "",
                mfaToken,
                user.getId(),
                sessionContext.tenantId(),
                sessionContext.roles(),
                null
            );
        }

        return issueAuthenticatedLogin(user, sessionContext, false, List.of("pwd"));
    }

    public PasskeyBeginResult beginPasskey(String email, PasskeyMode mode) {
        return passkeyService.begin(email, mode);
    }

    @Transactional
    public LoginResult verifyPasskey(String email, String challengeId, String credentialJson, PasskeyMode mode) {
        PasskeyService.VerifiedPasskey verified = passkeyService.verify(email, challengeId, credentialJson, mode);
        UserEntity user = userRepository.findById(verified.userId())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        SessionContext sessionContext = loadSessionContext(user.getId());

        if (mode == PasskeyMode.REGISTER) {
            auditService.record(sessionContext.tenantId(), user.getId(), AuditEventType.PASSKEY_REGISTERED, "{}");
        }

        if (user.isMfaEnabled() && requiresAdminMfa(sessionContext.roles())) {
            String mfaToken = jwtService.issueMfaToken(user.getId(), sessionContext.tenantId(), sessionContext.roles());
            return new LoginResult(
                true,
                "",
                "",
                mfaToken,
                user.getId(),
                sessionContext.tenantId(),
                sessionContext.roles(),
                null
            );
        }

        return issueAuthenticatedLogin(user, sessionContext, false, List.of("passkey"));
    }

    @Transactional
    public MfaEnrollmentResult enableMfa(UUID userId) {
        UserEntity user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        MfaService.Enrollment enrollment = mfaService.enroll(userId, user.getEmail());

        user.setMfaEnabled(true);
        userRepository.save(user);

        SessionContext sessionContext = loadSessionContext(userId);
        auditService.record(sessionContext.tenantId(), userId, AuditEventType.MFA_ENABLED, "{}");

        return new MfaEnrollmentResult(enrollment.secret(), enrollment.provisioningUri(), enrollment.backupCodes());
    }

    public boolean getMfaStatus(UUID userId) {
        return userRepository.findById(userId)
            .map(UserEntity::isMfaEnabled)
            .orElse(false);
    }

    @Transactional
    public void disableMfa(UUID userId, String code, String backupCode) {
        mfaService.disable(userId, code, backupCode);
        UserEntity user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Benutzer nicht gefunden"));
        user.setMfaEnabled(false);
        userRepository.save(user);
        SessionContext sessionContext = loadSessionContext(userId);
        auditService.record(sessionContext.tenantId(), userId, AuditEventType.MFA_DISABLED, "{}");
    }

    @Transactional
    public MfaVerifyResult verifyMfa(UUID userId, String mfaToken, String code, String backupCode) {
        JwtPrincipal principal = jwtService.verifyMfaToken(mfaToken);
        if (!principal.userId().equals(userId)) {
            throw new IllegalArgumentException("MFA token user mismatch");
        }

        boolean verified = mfaService.verify(userId, code, backupCode);
        if (!verified) {
            throw new IllegalArgumentException("Invalid MFA code");
        }

        UserEntity user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        SessionContext sessionContext = loadSessionContext(userId);
        LoginResult loginResult = issueAuthenticatedLogin(user, sessionContext, true, List.of("pwd", "mfa"));

        auditService.record(sessionContext.tenantId(), userId, AuditEventType.MFA_VERIFIED, "{}");

        return new MfaVerifyResult(true, loginResult.accessToken(), loginResult.refreshToken(), loginResult.accessTokenExpiresAt());
    }

    @Transactional
    public RefreshResult refreshToken(String rawRefreshToken) {
        try {
            RefreshTokenService.RotationResult rotation = refreshTokenService.rotate(rawRefreshToken);
            SessionContext sessionContext = loadSessionContext(rotation.userId());

            JwtService.AccessToken accessToken = jwtService.issueAccessToken(
                rotation.userId(),
                rotation.tenantId(),
                sessionContext.roles(),
                true,
                List.of("refresh")
            );

            return new RefreshResult(accessToken.token(), rotation.rawToken(), accessToken.expiresAt());
        } catch (RefreshTokenService.RefreshTokenReuseDetectedException ex) {
            refreshTokenService.revokeFamily(ex.getFamilyId());
            auditService.record(ex.getTenantId(), ex.getUserId(), AuditEventType.REFRESH_REUSE_DETECTED, "{}");
            auditService.record(ex.getTenantId(), ex.getUserId(), AuditEventType.SESSION_REVOKED, "{}");
            meterRegistry.counter("auth_refresh_reuse_detected_total").increment();
            throw ex;
        }
    }

    @Transactional
    public boolean logout(String rawRefreshToken) {
        RefreshTokenService.FamilyRevocationResult revocation = refreshTokenService.revokeFamilyByRawToken(rawRefreshToken);
        if (!revocation.found()) {
            return false;
        }

        auditService.record(revocation.tenantId(), revocation.userId(), AuditEventType.SESSION_REVOKED, "{\"source\":\"logout\"}");
        return true;
    }

    @Transactional
    public boolean revokeTokenFamily(String rawRefreshToken) {
        RefreshTokenService.FamilyRevocationResult revocation = refreshTokenService.revokeFamilyByRawToken(rawRefreshToken);
        if (!revocation.found()) {
            return false;
        }

        auditService.record(revocation.tenantId(), revocation.userId(), AuditEventType.SESSION_REVOKED, "{\"source\":\"revoke_family\"}");
        return true;
    }

    @Transactional
    public RegisterResult signUp(
        String email,
        String password,
        String fullName,
        String workspaceName,
        String tradeSlug,
        String addressJson,
        String planCode
    ) {
        String normalizedEmail = email.toLowerCase();
        userRepository.findByEmail(normalizedEmail).ifPresent(existing -> {
            throw new IllegalArgumentException("User already exists");
        });

        UserEntity user = new UserEntity();
        user.setId(UUID.randomUUID());
        user.setEmail(normalizedEmail);
        user.setFullName(fullName);
        user.setPasswordHash(passwordHasher.hash(password));
        user.setPasswordAlgo("argon2id");
        user.setMfaEnabled(false);
        user.setCreatedAt(OffsetDateTime.now());
        userRepository.save(user);

        UUID tenantId = tenantService.createTenant(workspaceName, user.getId(), tradeSlug, addressJson);
        auditService.record(tenantId, user.getId(), AuditEventType.USER_REGISTERED, "{\"email\":\"" + normalizedEmail + "\"}");

        String rawToken = generateSecureToken(32);
        EmailVerificationTokenEntity verificationToken = new EmailVerificationTokenEntity();
        verificationToken.setId(UUID.randomUUID());
        verificationToken.setUserId(user.getId());
        verificationToken.setTokenHash(tokenHashService.hash(rawToken));
        verificationToken.setExpiresAt(OffsetDateTime.now().plusSeconds(emailVerificationTtlSeconds));
        verificationToken.setCreatedAt(OffsetDateTime.now());
        emailVerificationTokenRepository.save(verificationToken);

        emailService.sendVerificationEmail(normalizedEmail, rawToken);

        return new RegisterResult(user.getId(), tenantId);
    }

    @Transactional
    public void verifyEmail(String rawToken) {
        String tokenHash = tokenHashService.hash(rawToken);
        EmailVerificationTokenEntity token = emailVerificationTokenRepository.findByTokenHash(tokenHash)
            .orElseThrow(() -> new IllegalArgumentException("Invalid or expired verification token"));

        if (token.getUsedAt() != null) {
            throw new IllegalArgumentException("Verification token already used");
        }
        if (token.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new IllegalArgumentException("Verification token expired");
        }

        token.setUsedAt(OffsetDateTime.now());
        emailVerificationTokenRepository.save(token);

        UserEntity user = userRepository.findById(token.getUserId())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setEmailVerifiedAt(OffsetDateTime.now());
        userRepository.save(user);

        membershipRepository.findByUserId(user.getId()).stream().findFirst().ifPresent(membership ->
            auditService.record(membership.getTenantId(), user.getId(), AuditEventType.EMAIL_VERIFIED, "{}")
        );
    }

    @Transactional
    public void requestPasswordReset(String email) {
        // Always respond successfully to avoid user enumeration.
        userRepository.findByEmail(email.toLowerCase()).ifPresent(user -> {
            String rawToken = generateShortCode();
            PasswordResetTokenEntity token = new PasswordResetTokenEntity();
            token.setId(UUID.randomUUID());
            token.setUserId(user.getId());
            token.setTokenHash(tokenHashService.hash(rawToken));
            token.setExpiresAt(OffsetDateTime.now().plusSeconds(passwordResetTtlSeconds));
            token.setCreatedAt(OffsetDateTime.now());
            passwordResetTokenRepository.save(token);

            emailService.sendPasswordResetEmail(user.getEmail(), rawToken);

            membershipRepository.findByUserId(user.getId()).stream().findFirst().ifPresent(membership ->
                auditService.record(membership.getTenantId(), user.getId(), AuditEventType.PASSWORD_RESET_REQUESTED, "{}")
            );
        });
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        String tokenHash = tokenHashService.hash(rawToken);
        PasswordResetTokenEntity token = passwordResetTokenRepository.findByTokenHash(tokenHash)
            .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset code"));

        if (token.getUsedAt() != null) {
            throw new IllegalArgumentException("Reset code already used");
        }
        if (token.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new IllegalArgumentException("Reset code expired");
        }

        token.setUsedAt(OffsetDateTime.now());
        passwordResetTokenRepository.save(token);

        UserEntity user = userRepository.findById(token.getUserId())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setPasswordHash(passwordHasher.hash(newPassword));
        userRepository.save(user);

        membershipRepository.findByUserId(user.getId()).stream().findFirst().ifPresent(membership ->
            auditService.record(membership.getTenantId(), user.getId(), AuditEventType.PASSWORD_RESET_COMPLETED, "{}")
        );
    }

    private String generateSecureToken(int bytes) {
        byte[] random = new byte[bytes];
        SECURE_RANDOM.nextBytes(random);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(random);
    }

    /** Generates an 8-character alphanumeric code suitable for manual entry. */
    private String generateShortCode() {
        String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            sb.append(alphabet.charAt(SECURE_RANDOM.nextInt(alphabet.length())));
        }
        return sb.toString();
    }

    private LoginResult issueAuthenticatedLogin(UserEntity user, SessionContext sessionContext, boolean mfa, List<String> amr) {
        JwtService.AccessToken accessToken = jwtService.issueAccessToken(
            user.getId(),
            sessionContext.tenantId(),
            sessionContext.roles(),
            mfa,
            amr
        );
        RefreshTokenService.IssuedRefreshToken refreshToken = refreshTokenService.issue(user.getId(), sessionContext.tenantId());

        user.setLastLoginAt(OffsetDateTime.now());
        userRepository.save(user);

        auditService.record(sessionContext.tenantId(), user.getId(), AuditEventType.AUTH_LOGIN_SUCCESS, "{}");

        return new LoginResult(
            false,
            accessToken.token(),
            refreshToken.rawToken(),
            "",
            user.getId(),
            sessionContext.tenantId(),
            sessionContext.roles(),
            accessToken.expiresAt()
        );
    }

    private void auditFailure(UUID userId) {
        membershipRepository.findByUserId(userId).stream().findFirst().ifPresent(membership ->
            auditService.record(membership.getTenantId(), userId, AuditEventType.AUTH_LOGIN_FAILED, "{}")
        );
    }

    private SessionContext loadSessionContext(UUID userId) {
        List<MembershipEntity> memberships = membershipRepository.findByUserId(userId);
        MembershipEntity primaryMembership = memberships.stream()
            .min(Comparator.comparing(MembershipEntity::getCreatedAt))
            .orElseThrow(() -> new IllegalArgumentException("User is not assigned to a tenant"));

        UUID tenantId = primaryMembership.getTenantId();
        List<String> roles = membershipRepository.findByTenantIdAndUserId(tenantId, userId).stream()
            .map(MembershipEntity::getRoleKey)
            .distinct()
            .toList();

        return new SessionContext(tenantId, roles);
    }

    private boolean requiresAdminMfa(List<String> roles) {
        if (!featureFlagProperties.isMfaEnforcementAdmin()) {
            return false;
        }
        return roles.stream().anyMatch(ADMIN_ROLES::contains);
    }

    private record SessionContext(UUID tenantId, List<String> roles) {
    }
}
