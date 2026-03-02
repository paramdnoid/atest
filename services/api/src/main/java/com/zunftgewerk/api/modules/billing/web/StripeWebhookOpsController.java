package com.zunftgewerk.api.modules.billing.web;

import com.zunftgewerk.api.modules.billing.service.StripeWebhookRetryWorker;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/internal/billing/stripe-webhooks/dead-letter")
public class StripeWebhookOpsController {

    private final StripeWebhookRetryWorker retryWorker;

    @Value("${zunftgewerk.stripe.ops.recovery-token:}")
    private String recoveryToken;

    public StripeWebhookOpsController(StripeWebhookRetryWorker retryWorker) {
        this.retryWorker = retryWorker;
    }

    @PostMapping("/recover")
    public ResponseEntity<?> recoverDeadLetters(
        @Valid @RequestBody(required = false) RecoverDeadLetterRequest request,
        @RequestHeader(value = "X-Stripe-Ops-Token", required = false) String suppliedToken
    ) {
        if (recoveryToken == null || recoveryToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new ErrorResponse("Stripe ops recovery token is not configured"));
        }
        if (!recoveryToken.equals(suppliedToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("Invalid ops token"));
        }

        String eventId = request == null ? null : request.eventId();
        Integer limit = request == null ? null : request.limit();

        StripeWebhookRetryWorker.RecoveryResult result = retryWorker.recoverDeadLettersManually(eventId, limit);
        RecoverDeadLetterResponse response = new RecoverDeadLetterResponse(
            result.requeuedCount(),
            result.skippedCount(),
            result.eventIds()
        );

        return ResponseEntity.ok(response);
    }

    public record RecoverDeadLetterRequest(
        String eventId,
        @Min(1) @Max(200) Integer limit
    ) {
    }

    public record RecoverDeadLetterResponse(
        int requeuedCount,
        int skippedCount,
        List<String> eventIds
    ) {
    }

    public record ErrorResponse(String error) {
    }
}
