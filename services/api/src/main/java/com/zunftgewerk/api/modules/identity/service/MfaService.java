package com.zunftgewerk.api.modules.identity.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.eatthepath.otp.TimeBasedOneTimePasswordGenerator;
import com.zunftgewerk.api.modules.identity.entity.MfaSecretEntity;
import com.zunftgewerk.api.modules.identity.repository.MfaSecretRepository;
import org.apache.commons.codec.binary.Base32;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class MfaService {

    private final MfaSecretRepository mfaSecretRepository;
    private final TokenHashService tokenHashService;
    private final ObjectMapper objectMapper;
    private final byte[] encryptionKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public MfaService(
        MfaSecretRepository mfaSecretRepository,
        TokenHashService tokenHashService,
        ObjectMapper objectMapper,
        @Value("${zunftgewerk.security.mfa-encryption-key}") String encryptionKeySeed
    ) {
        this.mfaSecretRepository = mfaSecretRepository;
        this.tokenHashService = tokenHashService;
        this.objectMapper = objectMapper;
        this.encryptionKey = deriveKey(encryptionKeySeed);
    }

    public Enrollment enroll(UUID userId, String email) {
        byte[] secretBytes = new byte[20];
        secureRandom.nextBytes(secretBytes);

        Base32 base32 = new Base32();
        String secretBase32 = base32.encodeToString(secretBytes).replace("=", "");

        List<String> backupCodes = generateBackupCodes();
        List<String> hashedBackupCodes = backupCodes.stream().map(tokenHashService::hash).toList();

        MfaSecretEntity entity = new MfaSecretEntity();
        entity.setUserId(userId);
        entity.setTotpSecretEncrypted(encrypt(secretBase32));
        entity.setEnabled(true);
        entity.setBackupCodesHashes(writeJson(hashedBackupCodes));
        entity.setCreatedAt(OffsetDateTime.now());
        entity.setUpdatedAt(OffsetDateTime.now());
        mfaSecretRepository.save(entity);

        String provisioningUri = "otpauth://totp/Zunftgewerk:" + email
            + "?secret=" + secretBase32
            + "&issuer=Zunftgewerk&algorithm=SHA1&digits=6&period=30";

        return new Enrollment(secretBase32, provisioningUri, backupCodes);
    }

    public boolean verify(UUID userId, String code, String backupCode) {
        MfaSecretEntity entity = mfaSecretRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("MFA secret not configured"));

        if (backupCode != null && !backupCode.isBlank()) {
            return consumeBackupCode(entity, backupCode);
        }

        if (code == null || code.isBlank()) {
            return false;
        }

        String secret = decrypt(entity.getTotpSecretEncrypted());
        Base32 base32 = new Base32();
        byte[] secretBytes = base32.decode(secret);

        try {
            TimeBasedOneTimePasswordGenerator totp = new TimeBasedOneTimePasswordGenerator(Duration.ofSeconds(30), 6);
            SecretKeySpec key = new SecretKeySpec(secretBytes, totp.getAlgorithm());
            Instant now = Instant.now();

            for (int i = -1; i <= 1; i++) {
                int expected = totp.generateOneTimePassword(key, now.plusSeconds(i * 30));
                if (String.format("%06d", expected).equals(code)) {
                    return true;
                }
            }
            return false;
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to verify TOTP", ex);
        }
    }

    private boolean consumeBackupCode(MfaSecretEntity entity, String backupCode) {
        List<String> hashes = readJson(entity.getBackupCodesHashes());
        String targetHash = tokenHashService.hash(backupCode.trim());
        if (!hashes.contains(targetHash)) {
            return false;
        }

        List<String> updated = new ArrayList<>(hashes);
        updated.remove(targetHash);
        entity.setBackupCodesHashes(writeJson(updated));
        entity.setUpdatedAt(OffsetDateTime.now());
        mfaSecretRepository.save(entity);
        return true;
    }

    private List<String> generateBackupCodes() {
        List<String> codes = new ArrayList<>();
        for (int i = 0; i < 8; i++) {
            byte[] bytes = new byte[5];
            secureRandom.nextBytes(bytes);
            codes.add(Base64.getUrlEncoder().withoutPadding().encodeToString(bytes));
        }
        return codes;
    }

    private byte[] deriveKey(String seed) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return digest.digest(seed.getBytes(StandardCharsets.UTF_8));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to derive MFA key", ex);
        }
    }

    private String encrypt(String plaintext) {
        try {
            byte[] iv = new byte[12];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            SecretKeySpec key = new SecretKeySpec(encryptionKey, 0, 16, "AES");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));

            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            byte[] combined = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(ciphertext, 0, combined, iv.length, ciphertext.length);
            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to encrypt MFA secret", ex);
        }
    }

    private String decrypt(String encoded) {
        try {
            byte[] combined = Base64.getDecoder().decode(encoded);
            byte[] iv = new byte[12];
            byte[] ciphertext = new byte[combined.length - 12];
            System.arraycopy(combined, 0, iv, 0, 12);
            System.arraycopy(combined, 12, ciphertext, 0, ciphertext.length);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            SecretKeySpec key = new SecretKeySpec(encryptionKey, 0, 16, "AES");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, iv));

            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to decrypt MFA secret", ex);
        }
    }

    private String writeJson(List<String> values) {
        try {
            return objectMapper.writeValueAsString(values);
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to encode backup codes", ex);
        }
    }

    private List<String> readJson(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to decode backup codes", ex);
        }
    }

    public record Enrollment(String secret, String provisioningUri, List<String> backupCodes) {
    }
}
