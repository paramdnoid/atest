package com.zunftgewerk.api.shared.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class FieldEncryptionService {

    private static final String AES_ALGORITHM = "AES";
    private static final String AES_GCM_TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_SIZE = 12;
    private static final int GCM_TAG_BITS = 128;
    private static final int KEY_BITS = 256;
    private static final String FORMAT_PREFIX = "encv1:";

    private final SecretKey key;
    private final String keyVersion;
    private final SecretKey blindIndexKey;
    private final SecureRandom secureRandom;
    private final boolean enabled;

    public FieldEncryptionService(
        @Value("${zunftgewerk.security.field-encryption-key:}") String configuredKeyBase64,
        @Value("${zunftgewerk.security.field-encryption-key-version:v1}") String keyVersion,
        @Value("${zunftgewerk.security.field-encryption-enabled:false}") boolean enabled
    ) {
        this.keyVersion = keyVersion;
        this.secureRandom = new SecureRandom();
        this.enabled = enabled;
        if (!enabled) {
            this.key = null;
            this.blindIndexKey = null;
            return;
        }
        this.key = parseOrGenerateKey(configuredKeyBase64);
        this.blindIndexKey = deriveBlindIndexKey(this.key);
    }

    public boolean isEnabled() {
        return enabled;
    }

    public String keyVersion() {
        return keyVersion;
    }

    public String encrypt(String plaintext, String aad) {
        if (!enabled || plaintext == null || plaintext.isBlank()) {
            return plaintext;
        }
        try {
            byte[] iv = new byte[GCM_IV_SIZE];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(AES_GCM_TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, iv));
            if (aad != null && !aad.isBlank()) {
                cipher.updateAAD(aad.getBytes(StandardCharsets.UTF_8));
            }

            byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            byte[] packed = ByteBuffer.allocate(iv.length + encrypted.length).put(iv).put(encrypted).array();
            return FORMAT_PREFIX + keyVersion + ":" + Base64.getUrlEncoder().withoutPadding().encodeToString(packed);
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Field encryption failed", ex);
        }
    }

    public String decrypt(String encryptedValue, String aad) {
        if (!enabled || encryptedValue == null || encryptedValue.isBlank()) {
            return encryptedValue;
        }
        if (!encryptedValue.startsWith(FORMAT_PREFIX)) {
            return encryptedValue;
        }
        String[] parts = encryptedValue.split(":", 3);
        if (parts.length != 3) {
            throw new IllegalArgumentException("Encrypted value format invalid");
        }
        String valueKeyVersion = parts[1];
        if (valueKeyVersion == null || valueKeyVersion.isBlank()) {
            throw new IllegalArgumentException("Encrypted value key version missing");
        }
        if (!keyVersion.equals(valueKeyVersion)) {
            throw new IllegalStateException("Encrypted value key version '" + valueKeyVersion + "' is not supported");
        }

        byte[] packed;
        try {
            packed = Base64.getUrlDecoder().decode(parts[2]);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Encrypted value payload invalid", ex);
        }
        if (packed.length <= GCM_IV_SIZE) {
            throw new IllegalArgumentException("Encrypted value payload too short");
        }
        try {
            byte[] iv = new byte[GCM_IV_SIZE];
            byte[] encrypted = new byte[packed.length - GCM_IV_SIZE];
            System.arraycopy(packed, 0, iv, 0, GCM_IV_SIZE);
            System.arraycopy(packed, GCM_IV_SIZE, encrypted, 0, encrypted.length);

            Cipher cipher = Cipher.getInstance(AES_GCM_TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, iv));
            if (aad != null && !aad.isBlank()) {
                cipher.updateAAD(aad.getBytes(StandardCharsets.UTF_8));
            }

            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Field decryption failed", ex);
        }
    }

    public String roundTrip(String value, String aad) {
        if (value == null) {
            return null;
        }
        return decrypt(encrypt(value, aad), aad);
    }

    public String blindIndex(String value, String aad) {
        if (!enabled || value == null || value.isBlank()) {
            return null;
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digest.update(blindIndexKey.getEncoded());
            if (aad != null && !aad.isBlank()) {
                digest.update(aad.getBytes(StandardCharsets.UTF_8));
            }
            digest.update(value.toLowerCase().trim().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest.digest());
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Blind index generation failed", ex);
        }
    }

    private SecretKey parseOrGenerateKey(String configuredKeyBase64) {
        if (configuredKeyBase64 == null || configuredKeyBase64.isBlank()) {
            return generateRandomKey();
        }
        byte[] decoded = Base64.getDecoder().decode(configuredKeyBase64.trim());
        if (decoded.length != 32) {
            throw new IllegalArgumentException("field-encryption-key must decode to 32 bytes");
        }
        return new SecretKeySpec(decoded, AES_ALGORITHM);
    }

    private SecretKey generateRandomKey() {
        try {
            KeyGenerator keyGenerator = KeyGenerator.getInstance(AES_ALGORITHM);
            keyGenerator.init(KEY_BITS);
            return keyGenerator.generateKey();
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Could not generate field encryption key", ex);
        }
    }

    private SecretKey deriveBlindIndexKey(SecretKey baseKey) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digest.update(baseKey.getEncoded());
            digest.update("blind-index".getBytes(StandardCharsets.UTF_8));
            return new SecretKeySpec(digest.digest(), AES_ALGORITHM);
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Could not derive blind index key", ex);
        }
    }
}
