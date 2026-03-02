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
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = StripeWebhookOpsController.class)
@Import(SecurityConfig.class)
class StripeWebhookOpsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private StripeWebhookRetryWorker retryWorker;

    @Test
    void shouldRejectUnauthenticatedRecoveryRequests() throws Exception {
        mockMvc.perform(post("/internal/billing/stripe-webhooks/dead-letter/recover")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"limit\":10}"))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "ops-user")
    void shouldAllowAuthenticatedRecoveryRequests() throws Exception {
        when(retryWorker.recoverDeadLettersManually(eq(null), eq(10)))
            .thenReturn(new StripeWebhookRetryWorker.RecoveryResult(1, 0, List.of("evt_1")));

        mockMvc.perform(post("/internal/billing/stripe-webhooks/dead-letter/recover")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"limit\":10}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.requeuedCount").value(1))
            .andExpect(jsonPath("$.skippedCount").value(0))
            .andExpect(jsonPath("$.eventIds[0]").value("evt_1"));
    }
}
