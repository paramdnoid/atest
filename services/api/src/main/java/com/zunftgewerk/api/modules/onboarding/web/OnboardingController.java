package com.zunftgewerk.api.modules.onboarding.web;

import com.zunftgewerk.api.modules.identity.entity.UserEntity;
import com.zunftgewerk.api.modules.identity.repository.UserRepository;
import com.zunftgewerk.api.modules.identity.service.RefreshTokenService;
import com.zunftgewerk.api.modules.identity.web.AuthCookieService;
import com.zunftgewerk.api.modules.plan.entity.SubscriptionEntity;
import com.zunftgewerk.api.modules.plan.repository.SubscriptionRepository;
import com.zunftgewerk.api.modules.tenant.entity.MembershipEntity;
import com.zunftgewerk.api.modules.tenant.repository.MembershipRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/v1/onboarding")
public class OnboardingController {

    private final RefreshTokenService refreshTokenService;
    private final UserRepository userRepository;
    private final MembershipRepository membershipRepository;
    private final SubscriptionRepository subscriptionRepository;

    public OnboardingController(
        RefreshTokenService refreshTokenService,
        UserRepository userRepository,
        MembershipRepository membershipRepository,
        SubscriptionRepository subscriptionRepository
    ) {
        this.refreshTokenService = refreshTokenService;
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
        this.subscriptionRepository = subscriptionRepository;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        HttpServletRequest servletRequest
    ) {
        String rawRefreshToken = cookieHeader != null
            ? extractCookie(cookieHeader, AuthCookieService.REFRESH_COOKIE)
            : null;

        Optional<RefreshTokenService.PeekedSession> session = refreshTokenService.peekUser(rawRefreshToken);

        if (session.isEmpty()) {
            return ResponseEntity.ok(unauthenticatedStatus());
        }

        UUID userId = session.get().userId();
        UUID tenantId = session.get().tenantId();

        UserEntity user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getDisabledAt() != null) {
            return ResponseEntity.ok(unauthenticatedStatus());
        }

        List<MembershipEntity> memberships = membershipRepository.findByTenantIdAndUserId(tenantId, userId);
        String role = memberships.stream().map(MembershipEntity::getRoleKey).findFirst().orElse(null);
        boolean canManageBilling = memberships.stream()
            .map(MembershipEntity::getRoleKey)
            .anyMatch(r -> r.equals("owner") || r.equals("admin"));

        boolean emailVerified = user.getEmailVerifiedAt() != null;

        Optional<SubscriptionEntity> subscriptionOpt = subscriptionRepository.findByTenantId(tenantId);
        Map<String, Object> subscriptionMap = null;
        String billingState = "none";

        if (subscriptionOpt.isPresent()) {
            SubscriptionEntity sub = subscriptionOpt.get();
            String status = sub.getStatus();
            boolean hasStripeCustomer = sub.getStripeCustomerId() != null && !sub.getStripeCustomerId().isBlank();
            boolean hasStripeSubscription = sub.getStripeSubscriptionId() != null && !sub.getStripeSubscriptionId().isBlank();
            String billingInterval = normalizeBillingCycle(sub.getBillingCycle());

            subscriptionMap = Map.of(
                "planCode", sub.getPlanId(),
                "status", status,
                "billingInterval", billingInterval,
                "hasStripeCustomer", hasStripeCustomer,
                "hasStripeSubscription", hasStripeSubscription
            );
            billingState = deriveBillingState(status, sub.getPlanId(), hasStripeSubscription);
        }

        String nextStep = deriveNextStep(emailVerified, billingState);

        Map<String, Object> result = new HashMap<>();
        result.put("authenticated", true);
        result.put("userId", userId.toString());
        result.put("email", user.getEmail());
        result.put("isEmailVerified", emailVerified);
        result.put("workspaceId", tenantId.toString());
        result.put("role", role);
        result.put("canManageBilling", canManageBilling);
        result.put("subscription", subscriptionMap);
        result.put("billingProfile", null);
        result.put("billingState", billingState);
        result.put("nextStep", nextStep);
        return ResponseEntity.ok(result);
    }

    private Map<String, Object> unauthenticatedStatus() {
        Map<String, Object> result = new HashMap<>();
        result.put("authenticated", false);
        result.put("userId", null);
        result.put("email", null);
        result.put("isEmailVerified", false);
        result.put("workspaceId", null);
        result.put("role", null);
        result.put("canManageBilling", false);
        result.put("subscription", null);
        result.put("billingProfile", null);
        result.put("billingState", "none");
        result.put("nextStep", "plan");
        return result;
    }

    private String deriveBillingState(String subscriptionStatus, String planId, boolean hasStripeSubscription) {
        if (subscriptionStatus == null) return "none";
        return switch (subscriptionStatus.toLowerCase()) {
            case "active" -> hasStripeSubscription ? "active" : "free";
            case "trialing" -> "active";
            case "past_due", "unpaid", "incomplete" -> "issue";
            case "canceled" -> "canceled";
            default -> "none";
        };
    }

    private String normalizeBillingCycle(String billingCycle) {
        if (billingCycle == null) return "month";
        return billingCycle.toLowerCase().startsWith("year") ? "year" : "month";
    }

    private String deriveNextStep(boolean emailVerified, String billingState) {
        if (!emailVerified) return "verify";
        return switch (billingState) {
            case "active", "free" -> "complete";
            default -> "billing";
        };
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
