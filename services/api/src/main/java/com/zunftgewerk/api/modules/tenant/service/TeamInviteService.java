package com.zunftgewerk.api.modules.tenant.service;

import com.zunftgewerk.api.modules.audit.service.AuditService;
import com.zunftgewerk.api.modules.identity.entity.UserEntity;
import com.zunftgewerk.api.modules.identity.repository.UserRepository;
import com.zunftgewerk.api.modules.identity.service.EmailService;
import com.zunftgewerk.api.modules.identity.service.TokenHashService;
import com.zunftgewerk.api.modules.license.service.SeatLicenseManagementService;
import com.zunftgewerk.api.modules.tenant.entity.MembershipEntity;
import com.zunftgewerk.api.modules.tenant.entity.TeamInviteTokenEntity;
import com.zunftgewerk.api.modules.tenant.entity.TenantEntity;
import com.zunftgewerk.api.modules.tenant.repository.MembershipRepository;
import com.zunftgewerk.api.modules.tenant.repository.TeamInviteTokenRepository;
import com.zunftgewerk.api.modules.tenant.repository.TenantRepository;
import com.zunftgewerk.api.shared.audit.AuditEventType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Orchestrates the team-invite lifecycle: creating invite tokens, sending
 * invitation emails, and accepting invites to create memberships.
 */
@Service
public class TeamInviteService {

    private static final Logger log = LoggerFactory.getLogger(TeamInviteService.class);
    private static final int TOKEN_BYTES = 32;

    private final TeamInviteTokenRepository inviteTokenRepository;
    private final TokenHashService tokenHashService;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final MembershipRepository membershipRepository;
    private final TenantRepository tenantRepository;
    private final AuditService auditService;
    private final SeatLicenseManagementService seatLicenseManagementService;

    @Value("${zunftgewerk.invite.ttl-seconds:604800}")
    private long inviteTtlSeconds;

    public TeamInviteService(
        TeamInviteTokenRepository inviteTokenRepository,
        TokenHashService tokenHashService,
        EmailService emailService,
        UserRepository userRepository,
        MembershipRepository membershipRepository,
        TenantRepository tenantRepository,
        AuditService auditService,
        SeatLicenseManagementService seatLicenseManagementService
    ) {
        this.inviteTokenRepository = inviteTokenRepository;
        this.tokenHashService = tokenHashService;
        this.emailService = emailService;
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
        this.tenantRepository = tenantRepository;
        this.auditService = auditService;
        this.seatLicenseManagementService = seatLicenseManagementService;
    }

    /**
     * Creates a new invite, persists it, sends the invitation email, and
     * records an audit event.
     *
     * @param tenantId  the tenant that the invitee will join
     * @param inviterId the user who is sending the invite (must be admin/owner)
     * @param email     the email address of the person being invited
     * @param roleKey   the role to assign upon acceptance (e.g. {@code "member"})
     * @return the persisted invite token entity
     */
    @Transactional
    public TeamInviteTokenEntity invite(UUID tenantId, UUID inviterId, String email, String roleKey) {
        var summary = seatLicenseManagementService.summary(tenantId);
        if (summary.availableSeats() <= 0) {
            throw new TeamInvitePolicyException(
                "NO_AVAILABLE_SEAT",
                "Keine freie Benutzerlizenz verfuegbar. Bitte Plan upgraden oder Sitz freigeben."
            );
        }

        // Generate raw token (32 bytes, Base64 URL-encoded, no padding)
        byte[] randomBytes = new byte[TOKEN_BYTES];
        new SecureRandom().nextBytes(randomBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        String tokenHash = tokenHashService.hash(rawToken);

        // Build and persist entity
        TeamInviteTokenEntity invite = new TeamInviteTokenEntity();
        invite.setId(UUID.randomUUID());
        invite.setTenantId(tenantId);
        invite.setInvitedEmail(email);
        invite.setRoleKey(roleKey);
        invite.setTokenHash(tokenHash);
        invite.setInvitedBy(inviterId);
        invite.setExpiresAt(OffsetDateTime.now().plusSeconds(inviteTtlSeconds));
        invite.setCreatedAt(OffsetDateTime.now());

        inviteTokenRepository.save(invite);

        // Look up inviter name + tenant name for the email
        String inviterName = userRepository.findById(inviterId)
            .map(UserEntity::getFullName)
            .orElse("Ein Teammitglied");
        String tenantName = tenantRepository.findById(tenantId)
            .map(TenantEntity::getName)
            .orElse("ZunftGewerk");

        // Send email
        emailService.sendInviteEmail(email, rawToken, inviterName, tenantName);

        // Audit
        auditService.record(tenantId, inviterId, AuditEventType.MEMBER_INVITED,
            "{\"email\":\"" + email + "\",\"role\":\"" + roleKey + "\"}");

        log.info("[INVITE] Created invite for {} to tenant {} with role {}", email, tenantId, roleKey);
        return invite;
    }

    /**
     * Accepts an invite by resolving the raw token, validating expiry, and
     * creating a membership for the invited user.
     *
     * @param rawToken the plain-text token from the invite link
     * @return the acceptance result
     */
    @Transactional
    public AcceptInviteResult acceptInvite(String rawToken) {
        String tokenHash = tokenHashService.hash(rawToken);

        Optional<TeamInviteTokenEntity> inviteOpt = inviteTokenRepository.findByTokenHash(tokenHash);
        if (inviteOpt.isEmpty()) {
            return new AcceptInviteResult(false, "INVITE_NOT_FOUND", "Einladung nicht gefunden oder ungueltig.", null);
        }

        TeamInviteTokenEntity invite = inviteOpt.get();

        if (invite.getAcceptedAt() != null) {
            return new AcceptInviteResult(false, "INVITE_ALREADY_ACCEPTED", "Diese Einladung wurde bereits angenommen.", null);
        }

        if (invite.getExpiresAt().isBefore(OffsetDateTime.now())) {
            return new AcceptInviteResult(false, "INVITE_EXPIRED", "Diese Einladung ist abgelaufen.", null);
        }

        // Look up the user by invited email — they must already have an account
        Optional<UserEntity> userOpt = userRepository.findByEmail(invite.getInvitedEmail());
        if (userOpt.isEmpty()) {
            return new AcceptInviteResult(false,
                "INVITED_USER_NOT_FOUND",
                "Kein Konto mit dieser E-Mail-Adresse gefunden. Bitte registriere dich zuerst.", null);
        }

        UserEntity user = userOpt.get();

        // Check if user is already a member of this tenant
        List<MembershipEntity> existing = membershipRepository
            .findByTenantIdAndUserId(invite.getTenantId(), user.getId());
        if (!existing.isEmpty()) {
            // Mark invite as accepted even if already a member
            invite.setAcceptedAt(OffsetDateTime.now());
            inviteTokenRepository.save(invite);
            return new AcceptInviteResult(false, "ALREADY_MEMBER", "Du bist bereits Mitglied dieses Teams.", null);
        }

        var seatSummary = seatLicenseManagementService.summary(invite.getTenantId());
        if (seatSummary.availableSeats() <= 0) {
            return new AcceptInviteResult(
                false,
                "NO_AVAILABLE_SEAT",
                "Keine freie Benutzerlizenz verfuegbar. Bitte Admin kontaktieren.",
                null
            );
        }

        seatLicenseManagementService.assignSeat(invite.getTenantId(), user.getId());

        // Create membership
        MembershipEntity membership = new MembershipEntity();
        membership.setId(UUID.randomUUID());
        membership.setTenantId(invite.getTenantId());
        membership.setUserId(user.getId());
        membership.setRoleKey(invite.getRoleKey());
        membership.setCreatedAt(OffsetDateTime.now());
        membershipRepository.save(membership);

        // Mark invite as accepted
        invite.setAcceptedAt(OffsetDateTime.now());
        inviteTokenRepository.save(invite);

        log.info("[INVITE] Accepted invite for {} to tenant {}", invite.getInvitedEmail(), invite.getTenantId());
        return new AcceptInviteResult(true, null, null, membership.getId());
    }

    /**
     * Result of accepting a team invite.
     *
     * @param success      whether the acceptance succeeded
     * @param code         machine-readable error code, {@code null} on success
     * @param error        human-readable error message (German), {@code null} on success
     * @param membershipId the newly created membership ID, {@code null} on failure
     */
    public record AcceptInviteResult(boolean success, String code, String error, UUID membershipId) {}

    public static final class TeamInvitePolicyException extends RuntimeException {
        private final String code;

        public TeamInvitePolicyException(String code, String message) {
            super(message);
            this.code = code;
        }

        public String code() {
            return code;
        }
    }
}
