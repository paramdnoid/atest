package com.zunftgewerk.api.modules.identity.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yubico.webauthn.AssertionRequest;
import com.yubico.webauthn.CredentialRepository;
import com.yubico.webauthn.FinishAssertionOptions;
import com.yubico.webauthn.FinishRegistrationOptions;
import com.yubico.webauthn.RegisteredCredential;
import com.yubico.webauthn.RelyingParty;
import com.yubico.webauthn.StartAssertionOptions;
import com.yubico.webauthn.StartRegistrationOptions;
import com.yubico.webauthn.data.ByteArray;
import com.yubico.webauthn.data.ClientAssertionExtensionOutputs;
import com.yubico.webauthn.data.ClientRegistrationExtensionOutputs;
import com.yubico.webauthn.data.AuthenticatorAssertionResponse;
import com.yubico.webauthn.data.AuthenticatorAttestationResponse;
import com.yubico.webauthn.data.PublicKeyCredential;
import com.yubico.webauthn.data.PublicKeyCredentialCreationOptions;
import com.yubico.webauthn.data.PublicKeyCredentialDescriptor;
import com.yubico.webauthn.data.PublicKeyCredentialType;
import com.yubico.webauthn.data.RelyingPartyIdentity;
import com.yubico.webauthn.data.UserIdentity;
import com.yubico.webauthn.exception.AssertionFailedException;
import com.yubico.webauthn.exception.RegistrationFailedException;
import com.zunftgewerk.api.modules.identity.entity.AuthChallengeEntity;
import com.zunftgewerk.api.modules.identity.entity.PasskeyCredentialEntity;
import com.zunftgewerk.api.modules.identity.entity.UserEntity;
import com.zunftgewerk.api.modules.identity.model.AuthChallengeKind;
import com.zunftgewerk.api.modules.identity.model.PasskeyBeginResult;
import com.zunftgewerk.api.modules.identity.repository.AuthChallengeRepository;
import com.zunftgewerk.api.modules.identity.repository.PasskeyCredentialRepository;
import com.zunftgewerk.api.modules.identity.repository.UserRepository;
import com.zunftgewerk.api.proto.v1.PasskeyMode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class PasskeyService {

    private final UserRepository userRepository;
    private final AuthChallengeRepository authChallengeRepository;
    private final PasskeyCredentialRepository passkeyCredentialRepository;
    private final ObjectMapper objectMapper;
    private final RelyingParty relyingParty;

    public PasskeyService(
        UserRepository userRepository,
        AuthChallengeRepository authChallengeRepository,
        PasskeyCredentialRepository passkeyCredentialRepository,
        ObjectMapper objectMapper,
        @Value("${zunftgewerk.passkey.rp-id}") String rpId,
        @Value("${zunftgewerk.passkey.rp-name}") String rpName,
        @Value("${zunftgewerk.passkey.origin}") String origin
    ) {
        this.userRepository = userRepository;
        this.authChallengeRepository = authChallengeRepository;
        this.passkeyCredentialRepository = passkeyCredentialRepository;
        this.objectMapper = objectMapper;
        this.relyingParty = RelyingParty.builder()
            .identity(RelyingPartyIdentity.builder().id(rpId).name(rpName).build())
            .credentialRepository(new JpaCredentialRepository())
            .origins(Set.of(origin))
            .build();
    }

    @Transactional
    public PasskeyBeginResult begin(String email, PasskeyMode mode) {
        UserEntity user = userRepository.findByEmail(email.toLowerCase())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        UUID challengeId = UUID.randomUUID();

        String optionsJson;
        String requestJson;
        String challenge;
        AuthChallengeKind kind;

        if (mode == PasskeyMode.REGISTER) {
            PublicKeyCredentialCreationOptions request = relyingParty.startRegistration(StartRegistrationOptions.builder()
                .user(userIdentity(user))
                .build());
            optionsJson = toCredentialsCreateJson(request);
            requestJson = toRequestJson(request);
            challenge = request.getChallenge().getBase64Url();
            kind = AuthChallengeKind.PASSKEY_REG;
        } else {
            AssertionRequest request = relyingParty.startAssertion(StartAssertionOptions.builder()
                .username(user.getEmail())
                .build());
            optionsJson = toCredentialsGetJson(request);
            requestJson = toRequestJson(request);
            challenge = request.getPublicKeyCredentialRequestOptions().getChallenge().getBase64Url();
            kind = AuthChallengeKind.PASSKEY_AUTH;
        }

        AuthChallengeEntity challengeEntity = new AuthChallengeEntity();
        challengeEntity.setId(challengeId);
        challengeEntity.setUserId(user.getId());
        challengeEntity.setTenantId(null);
        challengeEntity.setKind(kind.name());
        challengeEntity.setChallengePayload(toJson(new StoredPasskeyChallenge(mode.name(), requestJson)));
        challengeEntity.setCreatedAt(OffsetDateTime.now());
        challengeEntity.setExpiresAt(OffsetDateTime.now().plusMinutes(5));
        authChallengeRepository.save(challengeEntity);

        return new PasskeyBeginResult(challenge, challengeId.toString(), optionsJson, mode);
    }

    @Transactional
    public VerifiedPasskey verify(String email, String challengeId, String credentialJson, PasskeyMode mode) {
        UserEntity user = userRepository.findByEmail(email.toLowerCase())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        AuthChallengeEntity challenge = authChallengeRepository.findByIdAndUsedAtIsNull(UUID.fromString(challengeId))
            .orElseThrow(() -> new IllegalArgumentException("Unknown passkey challenge"));

        if (!user.getId().equals(challenge.getUserId())) {
            throw new IllegalArgumentException("Passkey challenge user mismatch");
        }
        if (challenge.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new IllegalArgumentException("Passkey challenge expired");
        }

        StoredPasskeyChallenge stored = parseChallenge(challenge.getChallengePayload());
        if (!stored.mode().equals(mode.name())) {
            throw new IllegalArgumentException("Passkey mode mismatch");
        }

        if (mode == PasskeyMode.REGISTER) {
            finishRegistration(user.getId(), stored.requestJson(), credentialJson);
        } else {
            finishAssertion(user.getId(), stored.requestJson(), credentialJson);
        }

        challenge.setUsedAt(OffsetDateTime.now());
        authChallengeRepository.save(challenge);
        return new VerifiedPasskey(user.getId());
    }

    private void finishRegistration(UUID userId, String requestJson, String credentialJson) {
        try {
            PublicKeyCredentialCreationOptions request = PublicKeyCredentialCreationOptions.fromJson(requestJson);
            PublicKeyCredential<AuthenticatorAttestationResponse, ClientRegistrationExtensionOutputs> response =
                PublicKeyCredential.parseRegistrationResponseJson(credentialJson);

            var result = relyingParty.finishRegistration(FinishRegistrationOptions.builder()
                .request(request)
                .response(response)
                .build());

            String credentialId = result.getKeyId().getId().getBase64Url();
            PasskeyCredentialEntity passkey = passkeyCredentialRepository.findByUserIdAndCredentialId(userId, credentialId)
                .orElseGet(PasskeyCredentialEntity::new);

            if (passkey.getId() == null) {
                passkey.setId(UUID.randomUUID());
                passkey.setCreatedAt(OffsetDateTime.now());
            }
            passkey.setUserId(userId);
            passkey.setCredentialId(credentialId);
            passkey.setPublicKeyCose(result.getPublicKeyCose().getBase64Url());
            passkey.setSignCount(result.getSignatureCount());
            passkey.setAaguid(result.getAaguid().getHex());
            passkeyCredentialRepository.save(passkey);
        } catch (IOException ex) {
            throw new IllegalArgumentException("Invalid passkey registration payload", ex);
        } catch (RegistrationFailedException ex) {
            throw new IllegalArgumentException("Passkey registration verification failed", ex);
        }
    }

    private void finishAssertion(UUID userId, String requestJson, String credentialJson) {
        try {
            AssertionRequest request = AssertionRequest.fromJson(requestJson);
            PublicKeyCredential<AuthenticatorAssertionResponse, ClientAssertionExtensionOutputs> response =
                PublicKeyCredential.parseAssertionResponseJson(credentialJson);

            var result = relyingParty.finishAssertion(FinishAssertionOptions.builder()
                .request(request)
                .response(response)
                .build());

            if (!result.isSuccess()) {
                throw new IllegalArgumentException("Passkey assertion failed");
            }

            String credentialId = response.getId().getBase64Url();
            PasskeyCredentialEntity passkey = passkeyCredentialRepository.findByUserIdAndCredentialId(userId, credentialId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown passkey credential"));
            passkey.setSignCount(result.getSignatureCount());
            passkeyCredentialRepository.save(passkey);
        } catch (IOException ex) {
            throw new IllegalArgumentException("Invalid passkey assertion payload", ex);
        } catch (AssertionFailedException ex) {
            throw new IllegalArgumentException("Passkey assertion verification failed", ex);
        }
    }

    private String toRequestJson(PublicKeyCredentialCreationOptions request) {
        try {
            return request.toJson();
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to serialize passkey registration request", ex);
        }
    }

    private String toCredentialsCreateJson(PublicKeyCredentialCreationOptions request) {
        try {
            return request.toCredentialsCreateJson();
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to serialize passkey registration options", ex);
        }
    }

    private String toRequestJson(AssertionRequest request) {
        try {
            return request.toJson();
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to serialize passkey assertion request", ex);
        }
    }

    private String toCredentialsGetJson(AssertionRequest request) {
        try {
            return request.toCredentialsGetJson();
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to serialize passkey assertion options", ex);
        }
    }

    private UserIdentity userIdentity(UserEntity user) {
        return UserIdentity.builder()
            .name(user.getEmail())
            .displayName(user.getEmail())
            .id(userHandle(user.getId()))
            .build();
    }

    private ByteArray userHandle(UUID userId) {
        return new ByteArray(userId.toString().getBytes(StandardCharsets.UTF_8));
    }

    private UUID userIdFromHandle(ByteArray userHandle) {
        return UUID.fromString(new String(userHandle.getBytes(), StandardCharsets.UTF_8));
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to serialize passkey payload", ex);
        }
    }

    private StoredPasskeyChallenge parseChallenge(String value) {
        try {
            JsonNode root = objectMapper.readTree(value);
            return new StoredPasskeyChallenge(root.path("mode").asText(""), root.path("requestJson").asText(""));
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid passkey challenge payload", ex);
        }
    }

    public record VerifiedPasskey(UUID userId) {
    }

    private record StoredPasskeyChallenge(String mode, String requestJson) {
    }

    private class JpaCredentialRepository implements CredentialRepository {

        @Override
        public Set<PublicKeyCredentialDescriptor> getCredentialIdsForUsername(String username) {
            Optional<UserEntity> user = userRepository.findByEmail(username.toLowerCase());
            if (user.isEmpty()) {
                return Set.of();
            }
            Set<PublicKeyCredentialDescriptor> descriptors = new HashSet<>();
            for (PasskeyCredentialEntity entity : passkeyCredentialRepository.findByUserId(user.get().getId())) {
                ByteArray credentialId = decodeBase64Url(entity.getCredentialId());
                if (credentialId == null) {
                    continue;
                }
                descriptors.add(PublicKeyCredentialDescriptor.builder()
                    .id(credentialId)
                    .type(PublicKeyCredentialType.PUBLIC_KEY)
                    .build());
            }
            return descriptors;
        }

        @Override
        public Optional<ByteArray> getUserHandleForUsername(String username) {
            return userRepository.findByEmail(username.toLowerCase())
                .map(UserEntity::getId)
                .map(PasskeyService.this::userHandle);
        }

        @Override
        public Optional<String> getUsernameForUserHandle(ByteArray userHandle) {
            try {
                UUID userId = userIdFromHandle(userHandle);
                return userRepository.findById(userId).map(UserEntity::getEmail);
            } catch (Exception ex) {
                return Optional.empty();
            }
        }

        @Override
        public Optional<RegisteredCredential> lookup(ByteArray credentialId, ByteArray userHandle) {
            try {
                UUID userId = userIdFromHandle(userHandle);
                return passkeyCredentialRepository.findByUserIdAndCredentialId(userId, credentialId.getBase64Url())
                    .flatMap(entity -> buildRegisteredCredential(entity, userId));
            } catch (Exception ex) {
                return Optional.empty();
            }
        }

        @Override
        public Set<RegisteredCredential> lookupAll(ByteArray credentialId) {
            List<PasskeyCredentialEntity> credentials = passkeyCredentialRepository.findByCredentialId(credentialId.getBase64Url());
            Set<RegisteredCredential> registered = new HashSet<>();
            for (PasskeyCredentialEntity credential : credentials) {
                buildRegisteredCredential(credential, credential.getUserId()).ifPresent(registered::add);
            }
            return registered;
        }

        private Optional<RegisteredCredential> buildRegisteredCredential(PasskeyCredentialEntity entity, UUID userId) {
            ByteArray credentialId = decodeBase64Url(entity.getCredentialId());
            ByteArray publicKeyCose = decodeBase64Url(entity.getPublicKeyCose());
            if (credentialId == null || publicKeyCose == null) {
                return Optional.empty();
            }
            return Optional.of(RegisteredCredential.builder()
                .credentialId(credentialId)
                .userHandle(userHandle(userId))
                .publicKeyCose(publicKeyCose)
                .signatureCount(entity.getSignCount())
                .build());
        }
    }

    private ByteArray decodeBase64Url(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return ByteArray.fromBase64Url(value);
        } catch (Exception ex) {
            return null;
        }
    }
}
