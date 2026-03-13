package com.zunftgewerk.api.modules.opsworkflow.web;

import com.zunftgewerk.api.modules.identity.service.RefreshTokenService;
import com.zunftgewerk.api.modules.identity.web.AuthCookieService;
import com.zunftgewerk.api.modules.opsworkflow.service.OpsWorkflowService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/v1/ops/workflow")
public class OpsWorkflowController {

    private final RefreshTokenService refreshTokenService;
    private final OpsWorkflowService opsWorkflowService;

    public OpsWorkflowController(RefreshTokenService refreshTokenService, OpsWorkflowService opsWorkflowService) {
        this.refreshTokenService = refreshTokenService;
        this.opsWorkflowService = opsWorkflowService;
    }

    @GetMapping("/overview")
    public ResponseEntity<?> overview(@RequestHeader(value = "Cookie", required = false) String cookieHeader) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        return ResponseEntity.ok(Map.of("overview", opsWorkflowService.workflowOverview(session.tenantId())));
    }

    private RefreshTokenService.PeekedSession resolveSession(String cookieHeader) {
        String rawRefreshToken = cookieHeader != null
            ? extractCookie(cookieHeader, AuthCookieService.REFRESH_COOKIE)
            : null;
        return refreshTokenService.peekUser(rawRefreshToken).orElse(null);
    }

    private String extractCookie(String cookieHeader, String cookieName) {
        for (String part : cookieHeader.split(";")) {
            String trimmed = part.trim();
            if (trimmed.startsWith(cookieName + "=")) {
                return trimmed.substring(cookieName.length() + 1);
            }
        }
        return null;
    }
}
