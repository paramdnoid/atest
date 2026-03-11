package com.zunftgewerk.api.modules.billing.controller;

import com.zunftgewerk.api.modules.billing.entity.BillingAuditLogEntity;
import com.zunftgewerk.api.modules.billing.repository.BillingAuditLogRepository;
import com.zunftgewerk.api.modules.identity.repository.UserRepository;
import com.zunftgewerk.api.modules.identity.service.RefreshTokenService;
import com.zunftgewerk.api.modules.identity.web.AuthCookieService;
import com.zunftgewerk.api.modules.license.repository.DeviceRepository;
import com.zunftgewerk.api.modules.plan.entity.SubscriptionEntity;
import com.zunftgewerk.api.modules.plan.repository.SubscriptionRepository;
import com.zunftgewerk.api.modules.plan.service.PlanCatalog;
import com.zunftgewerk.api.modules.tenant.repository.MembershipRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
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
    private final UserRepository userRepository;

    @Value("${zunftgewerk.app.landing-url:http://localhost:3000}")
    private String landingUrl;

    @Value("${zunftgewerk.stripe.price.starter-monthly:}")
    private String priceStarterMonthly;

    @Value("${zunftgewerk.stripe.price.starter-yearly:}")
    private String priceStarterYearly;

    @Value("${zunftgewerk.stripe.price.professional-monthly:}")
    private String priceProfessionalMonthly;

    @Value("${zunftgewerk.stripe.price.professional-yearly:}")
    private String priceProfessionalYearly;

    public BillingRestController(
        RefreshTokenService refreshTokenService,
        SubscriptionRepository subscriptionRepository,
        MembershipRepository membershipRepository,
        DeviceRepository deviceRepository,
        BillingAuditLogRepository billingAuditLogRepository,
        UserRepository userRepository
    ) {
        this.refreshTokenService = refreshTokenService;
        this.subscriptionRepository = subscriptionRepository;
        this.membershipRepository = membershipRepository;
        this.deviceRepository = deviceRepository;
        this.billingAuditLogRepository = billingAuditLogRepository;
        this.userRepository = userRepository;
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

        Map<String, Object> planMap = null;
        if (sub != null) {
            PlanCatalog.PlanDefinition planDef = PlanCatalog.plans().stream()
                .filter(p -> p.planId().equalsIgnoreCase(sub.getPlanId()))
                .findFirst()
                .orElse(null);

            if (planDef != null) {
                planMap = new HashMap<>();
                planMap.put("code", planDef.planId());
                planMap.put("name", planDef.displayName());
                planMap.put("priceMonthlyCents", planDef.amountCents());
            }
        }

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

        List<Map<String, Object>> recentEvents = billingAuditLogRepository
            .findByTenantIdOrderByCreatedAtDesc(tenantId, PageRequest.of(0, 5))
            .stream()
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

    @GetMapping("/events")
    public ResponseEntity<?> getEvents(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @RequestParam(defaultValue = "10") int limit,
        @RequestParam(defaultValue = "0") int offset
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        int page = limit > 0 ? offset / limit : 0;
        List<BillingAuditLogEntity> events = billingAuditLogRepository
            .findByTenantIdOrderByCreatedAtDesc(
                session.tenantId(),
                PageRequest.of(page, Math.max(limit, 1), Sort.by(Sort.Direction.DESC, "createdAt"))
            );

        List<Map<String, Object>> result = events.stream().map(e -> {
            Map<String, Object> ev = new HashMap<>();
            ev.put("id", e.getId());
            ev.put("type", e.getEventType());
            ev.put("description", e.getDetailsJson());
            ev.put("createdAt", e.getCreatedAt());
            return ev;
        }).toList();

        return ResponseEntity.ok(Map.of("events", result));
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> createCheckoutSession(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @RequestBody Map<String, String> body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String planId = body.getOrDefault("planId", "starter");
        String billingCycle = body.getOrDefault("billingCycle", "monthly");

        PlanCatalog.PlanDefinition plan = PlanCatalog.plans().stream()
            .filter(p -> p.planId().equals(planId))
            .findFirst()
            .orElse(null);

        if (plan == null || plan.amountCents() == 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ungültiger Plan"));
        }

        try {
            boolean yearly = billingCycle.toLowerCase().startsWith("year");
            com.stripe.param.checkout.SessionCreateParams params =
                com.stripe.param.checkout.SessionCreateParams.builder()
                    .setMode(com.stripe.param.checkout.SessionCreateParams.Mode.SUBSCRIPTION)
                    .setClientReferenceId(session.tenantId().toString())
                    .setSuccessUrl(landingUrl + "/dashboard/billing?session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl(landingUrl + "/dashboard/billing")
                    .addLineItem(
                        com.stripe.param.checkout.SessionCreateParams.LineItem.builder()
                            .setQuantity(1L)
                            .setPriceData(
                                com.stripe.param.checkout.SessionCreateParams.LineItem.PriceData.builder()
                                    .setCurrency("eur")
                                    .setUnitAmount((long) plan.amountCents())
                                    .setProductData(
                                        com.stripe.param.checkout.SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                            .setName(plan.displayName())
                                            .build()
                                    )
                                    .setRecurring(
                                        com.stripe.param.checkout.SessionCreateParams.LineItem.PriceData.Recurring.builder()
                                            .setInterval(
                                                yearly
                                                    ? com.stripe.param.checkout.SessionCreateParams.LineItem.PriceData.Recurring.Interval.YEAR
                                                    : com.stripe.param.checkout.SessionCreateParams.LineItem.PriceData.Recurring.Interval.MONTH
                                            )
                                            .build()
                                    )
                                    .build()
                            )
                            .build()
                    )
                    .build();

            com.stripe.model.checkout.Session stripeSession =
                com.stripe.model.checkout.Session.create(params);

            return ResponseEntity.ok(Map.of(
                "url", stripeSession.getUrl(),
                "sessionId", stripeSession.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Stripe-Fehler: " + e.getMessage()));
        }
    }

    @PostMapping("/portal")
    public ResponseEntity<?> createPortalSession(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @RequestBody Map<String, String> body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        SubscriptionEntity sub = subscriptionRepository.findByTenantId(session.tenantId()).orElse(null);
        if (sub == null || sub.getStripeCustomerId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Kein aktives Abonnement mit Stripe-Kundenkonto"));
        }

        String returnPath = body.getOrDefault("returnPath", "/dashboard/billing");

        try {
            com.stripe.param.billingportal.SessionCreateParams params =
                com.stripe.param.billingportal.SessionCreateParams.builder()
                    .setCustomer(sub.getStripeCustomerId())
                    .setReturnUrl(landingUrl + returnPath)
                    .build();

            com.stripe.model.billingportal.Session portalSession =
                com.stripe.model.billingportal.Session.create(params);

            return ResponseEntity.ok(Map.of("url", portalSession.getUrl()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Stripe-Fehler: " + e.getMessage()));
        }
    }

    @PostMapping("/create-subscription")
    public ResponseEntity<?> createSubscription(
        @RequestHeader(value = "Cookie", required = false) String cookieHeader,
        @RequestBody Map<String, String> body
    ) {
        var session = resolveSession(cookieHeader);
        if (session == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String planId = body.getOrDefault("planId", "starter");
        String billingCycle = body.getOrDefault("billingCycle", "monthly");
        boolean yearly = billingCycle.toLowerCase().startsWith("year");
        PlanCatalog.PlanDefinition plan = PlanCatalog.plans().stream()
            .filter(p -> p.planId().equalsIgnoreCase(planId))
            .findFirst()
            .orElse(null);
        if (plan == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ungültiger Plan"));
        }

        String stripePriceId = resolveStripePriceId(planId, yearly);
        if (stripePriceId == null || stripePriceId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Kein Stripe-Preis für diesen Plan konfiguriert"));
        }

        try {
            UUID tenantId = session.tenantId();
            UUID userId = session.userId();

            // Idempotency: if an INCOMPLETE subscription already exists, return its clientSecret
            SubscriptionEntity existingSub = subscriptionRepository.findByTenantId(tenantId).orElse(null);
            if (existingSub != null
                && "incomplete".equalsIgnoreCase(existingSub.getStatus())
                && existingSub.getStripeSubscriptionId() != null) {
                com.stripe.model.Subscription stripeSub =
                    com.stripe.model.Subscription.retrieve(
                        existingSub.getStripeSubscriptionId(),
                        com.stripe.param.SubscriptionRetrieveParams.builder()
                            .addExpand("latest_invoice.confirmation_secret")
                            .build(),
                        com.stripe.net.RequestOptions.builder().build()
                    );
                String clientSecret = stripeSub.getLatestInvoiceObject()
                    .getConfirmationSecret().getClientSecret();
                return ResponseEntity.ok(Map.of(
                    "clientSecret", clientSecret,
                    "subscriptionId", existingSub.getStripeSubscriptionId()
                ));
            }

            // Resolve or create Stripe Customer
            String stripeCustomerId = existingSub != null ? existingSub.getStripeCustomerId() : null;
            if (stripeCustomerId == null || stripeCustomerId.isBlank()) {
                String email = userRepository.findById(userId)
                    .map(u -> u.getEmail())
                    .orElse(null);

                com.stripe.param.CustomerCreateParams customerParams =
                    com.stripe.param.CustomerCreateParams.builder()
                        .setEmail(email)
                        .putMetadata("tenantId", tenantId.toString())
                        .putMetadata("userId", userId.toString())
                        .build();
                com.stripe.model.Customer customer =
                    com.stripe.model.Customer.create(customerParams);
                stripeCustomerId = customer.getId();
            }

            // Create Stripe Subscription with incomplete payment behavior
            com.stripe.param.SubscriptionCreateParams subParams =
                com.stripe.param.SubscriptionCreateParams.builder()
                    .setCustomer(stripeCustomerId)
                    .addItem(
                        com.stripe.param.SubscriptionCreateParams.Item.builder()
                            .setPrice(stripePriceId)
                            .build()
                    )
                    .setPaymentBehavior(
                        com.stripe.param.SubscriptionCreateParams.PaymentBehavior.DEFAULT_INCOMPLETE
                    )
                    .addExpand("latest_invoice.payment_intent")
                    .build();

            com.stripe.model.Subscription stripeSub =
                com.stripe.model.Subscription.create(subParams);

            String clientSecret = stripeSub.getLatestInvoiceObject()
                .getConfirmationSecret().getClientSecret();

            // Save or update SubscriptionEntity
            OffsetDateTime now = OffsetDateTime.now();
            if (existingSub == null) {
                existingSub = new SubscriptionEntity();
                existingSub.setId(UUID.randomUUID());
                existingSub.setTenantId(tenantId);
                existingSub.setCreatedAt(now);
            }
            existingSub.setPlanId(planId);
            existingSub.setBillingCycle(yearly ? "yearly" : "monthly");
            existingSub.setStripeCustomerId(stripeCustomerId);
            existingSub.setStripeSubscriptionId(stripeSub.getId());
            existingSub.setStatus("incomplete");
            existingSub.setUpdatedAt(now);
            subscriptionRepository.save(existingSub);

            return ResponseEntity.ok(Map.of(
                "clientSecret", clientSecret,
                "subscriptionId", stripeSub.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Stripe-Fehler: " + e.getMessage()));
        }
    }

    private String resolveStripePriceId(String planId, boolean yearly) {
        return switch (planId.toLowerCase()) {
            case "starter" -> yearly ? priceStarterYearly : priceStarterMonthly;
            case "professional" -> yearly ? priceProfessionalYearly : priceProfessionalMonthly;
            default -> null;
        };
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
