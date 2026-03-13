package com.zunftgewerk.api.shared.security;

import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;

class FieldEncryptionServiceTest {

    @Test
    void shouldEncryptAndDecryptWithAad() {
        String base64Key = Base64.getEncoder().encodeToString("12345678901234567890123456789012".getBytes());
        FieldEncryptionService service = new FieldEncryptionService(base64Key, "v1", true);

        String encrypted = service.encrypt("geheim@example.com", "tenant-1:ops_kunden:email");
        String decrypted = service.decrypt(encrypted, "tenant-1:ops_kunden:email");

        assertThat(encrypted).startsWith("encv1:v1:");
        assertThat(decrypted).isEqualTo("geheim@example.com");
    }

    @Test
    void shouldReturnPassThroughWhenDisabled() {
        FieldEncryptionService service = new FieldEncryptionService("", "v1", false);
        String value = "offen";
        assertThat(service.encrypt(value, "aad")).isEqualTo(value);
        assertThat(service.decrypt(value, "aad")).isEqualTo(value);
        assertThat(service.blindIndex(value, "aad")).isNull();
    }

    @Test
    void shouldCreateDeterministicBlindIndex() {
        String base64Key = Base64.getEncoder().encodeToString("12345678901234567890123456789012".getBytes());
        FieldEncryptionService service = new FieldEncryptionService(base64Key, "v1", true);

        String first = service.blindIndex("Muster@Example.com", "tenant-1:ops_kunden:email");
        String second = service.blindIndex("muster@example.com", "tenant-1:ops_kunden:email");
        String third = service.blindIndex("other@example.com", "tenant-1:ops_kunden:email");

        assertThat(first).isEqualTo(second);
        assertThat(first).isNotEqualTo(third);
        assertThat(first).hasSize(64);
    }
}
