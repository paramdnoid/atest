package com.zunftgewerk.api.modules.identity.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Delivers transactional emails.
 *
 * Currently logs to console. To enable real delivery add
 * spring-boot-starter-mail to the build, configure spring.mail.* properties,
 * and replace the log statements with JavaMailSender calls.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Value("${zunftgewerk.email.from:noreply@localhost}")
    private String fromAddress;

    @Value("${zunftgewerk.email.landing-base-url:http://localhost:3000}")
    private String landingBaseUrl;

    /**
     * Sends the email-verification link to a newly registered user.
     *
     * @param toEmail  recipient address
     * @param rawToken the plain-text verification token to embed in the URL
     */
    public void sendVerificationEmail(String toEmail, String rawToken) {
        String link = landingBaseUrl + "/onboarding/verified?token=" + rawToken;
        log.info(
            "[EMAIL] Verification → {} | from={} | link={}",
            toEmail, fromAddress, link
        );
        // TODO: replace with actual mail delivery, e.g.:
        // MimeMessage msg = mailSender.createMimeMessage();
        // ... set from/to/subject/body using the link above ...
        // mailSender.send(msg);
    }

    /**
     * Sends the password-reset code to the user.
     *
     * The reset form expects the user to type the code manually, so we send the
     * plain token string (not a URL).
     *
     * @param toEmail  recipient address
     * @param rawToken the plain-text reset code to display in the email
     */
    public void sendPasswordResetEmail(String toEmail, String rawToken) {
        log.info(
            "[EMAIL] Password reset → {} | from={} | code={}",
            toEmail, fromAddress, rawToken
        );
        // TODO: replace with actual mail delivery
    }
}
