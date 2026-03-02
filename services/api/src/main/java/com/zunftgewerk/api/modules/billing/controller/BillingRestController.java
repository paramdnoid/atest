package com.zunftgewerk.api.modules.billing.controller;

import com.zunftgewerk.api.modules.billing.entity.BillingAuditLogEntity;
import com.zunftgewerk.api.modules.billing.repository.BillingAuditLogRepository;
import com.zunftgewerk.api.modules.identity.service.RefreshTokenService;
import com.zunftgewerk.api.modules.identity.web.AuthCookieService;
import com.zunftgewerk.api.modules.license.repository.DeviceRepository;
import com.zunftgewerk.api.modules.plan.entity.SubscriptionEntity;
import com.zunftgewerk.api.modules.plan.repository.SubscriptionRepository;
import com.zunftgewerk.api.modules.plan.service.PlanCatalog;
import com.zunftgewerk.api.modules.tenant.repository.MembershipRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/billing")
public class BillingRestController {

    private final RefreshTokenService refreshTokenService;
    private final SubscriptionRepository subscriptionRepository;
    private final MembershipRepository membershipRepository;
    private final DeviceRepository deviceRepository;
    private final BillingAuditLogRepository billingAuditLogRepository;

    public BillingRestController(
        RefreshTokenService refreshTokenService,
        SubscriptionRepository subscriptionRepository,
        MembershipRepository membershipRepository,
        DeviceRepository deviceRepository,
        BillingAuditLogRepository billingAuditLogRepository
    ) {
        this.refreshTokenService = refreshTokenService;
        this.subscriptionRepository = subscriptionRepository;
        this.membershipRepository = membershipRepository;
        this.deviceRepository = deviceRepository;
        this.billingAuditLogRepository = billingAuditLogRepository;
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        HttpServletRequest request
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        UUID tenantId = session.tenantId();

        SubscriptionEntity sub = subscriptionRepository.findByTenantId(tenantId).orElse(null);

        // Resolve plan info from catalog
        String planCode = sub != null ? sub.getPlanId() : "free";
        PlanCatalog.PlanDefinition planDef = PlanCatalog.plans().stream()
            .filter(p -> p.planId().equals(planCode))
            .findFirst()
            .orElse(new PlanCatalog.PlanDefinition("free", "Free", 5, "monthly", 0));

        Map<String, Object> planMap = new HashMap<>();
        planMap.put("code", planDef.planId());
        planMap.put("name", planDef.displayName());
        planMap.put("priceMonthlyCents", planDef.amountCents());

        Map<String, Object> subscriptionMap = null;
        if (sub != null) {
            subscriptionMap = new HashMap<>();
            subscriptionMap.put("status", sub.getStatus());
            subscriptionMap.put("billingInterval", normalizeBillingCycle(sub.getBillingCycle()));
            subscriptionMap.put("currentPeriodEnd", sub.getCurrentPeriodEnd());
            subscriptionMap.put("stripeSubscriptionId", sub.getStripeSubscriptionId());
        }

        long memberCount = membershipRepository.findByTenantId(tenantId).size();
        long licensedCount = deviceRepository.countLicensedByTenantId(tenantId);

        // Recent billing events from audit log
        List<Map<String, Object>> recentEvents = billingAuditLogRepository
            .findAll(PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt")))
            .getContent()
            .stream()
            .filter(e -> tenantId.equals(e.getTenantId()))
            .limit(5)
            .map(e -> {
                Map<String, Object> ev = new HashMap<>();
                ev.put("type", e.getEventType());
                ev.put("description", e.getDetailsJson());
                ev.put("createdAt", e.getCreatedAt());
                return ev;
            })
            .toList();

        Map<String, Object> response = new HashMap<>();
        response.put("plan", planMap);
        response.put("subscription", subscriptionMap);
        response.put("memberCount", memberCount);
        response.put("licensedCount", licensedCount);
        response.put("recentEvents", recentEvents);
        return ResponseEntity.ok(response);
    }

    private RefreshTokenService.PeekedSession resolveSession(String cookieHeader) {
        String rawRefreshToken = cookieHeader != null
            ? extractCookie(cookieHeader, AuthCookieService.REFRESH_COOKIE)
            : null;
        return refreshTokenService.peekUser(rawRefreshToken).orElse(null);
    }

    private String normalizeBillingCycle(String cycle) {
        if (cycle == null) return "month";
        return cycle.toLowerCase().startsWith("year") ? "year" : "month";
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
