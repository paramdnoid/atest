package com.zunftgewerk.api.modules.billing;

import com.zunftgewerk.api.config.SecurityConfig;
import com.zunftgewerk.api.modules.billing.service.StripeWebhookRetryWorker;
import com.zunftgewerk.api.modules.billing.web.StripeWebhookOpsController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = StripeWebhookOpsController.class,
    properties = "zunftgewerk.stripe.ops.recovery-token=test-token"
)
@Import(SecurityConfig.class)
class StripeWebhookOpsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private StripeWebhookRetryWorker retryWorker;

    @Test
    void shouldRejectRequestsWithoutOpsToken() throws Exception {
        mockMvc.perform(post("/internal/billing/stripe-webhooks/dead-letter/recover")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"limit\":10}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldAllowRequestsWithValidOpsToken() throws Exception {
        when(retryWorker.recoverDeadLettersManually(eq(null), eq(10)))
            .thenReturn(new StripeWebhookRetryWorker.RecoveryResult(1, 0, List.of("evt_1")));

        mockMvc.perform(post("/internal/billing/stripe-webhooks/dead-letter/recover")
                .header("X-Stripe-Ops-Token", "test-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"limit\":10}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.requeuedCount").value(1))
            .andExpect(jsonPath("$.skippedCount").value(0))
            .andExpect(jsonPath("$.eventIds[0]").value("evt_1"));
    }
}
