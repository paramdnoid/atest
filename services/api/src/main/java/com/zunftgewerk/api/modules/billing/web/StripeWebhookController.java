package com.zunftgewerk.api.modules.billing.web;

import com.zunftgewerk.api.modules.billing.service.StripeBillingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/webhooks/stripe")
public class StripeWebhookController {

    private final StripeBillingService stripeBillingService;

    public StripeWebhookController(StripeBillingService stripeBillingService) {
        this.stripeBillingService = stripeBillingService;
    }

    @PostMapping
    public ResponseEntity<String> handleWebhook(
        @RequestBody String payload,
        @RequestHeader(value = "Stripe-Signature", required = false) String signatureHeader
    ) {
        try {
            stripeBillingService.processWebhook(payload, signatureHeader == null ? "" : signatureHeader);
            return ResponseEntity.ok("ok");
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("invalid signature");
        }
    }
}
