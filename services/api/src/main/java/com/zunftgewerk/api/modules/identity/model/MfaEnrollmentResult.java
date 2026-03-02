package com.zunftgewerk.api.modules.identity.model;

import java.util.List;

public record MfaEnrollmentResult(String secret, String provisioningUri, List<String> backupCodes) {
}
