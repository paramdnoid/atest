package com.zunftgewerk.api.modules.identity.service;

import io.micrometer.core.instrument.MeterRegistry;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

/**
 * Delivers transactional emails via SMTP using JavaMailSender.
 *
 * Falls back to console logging when {@code spring.mail.host} is not
 * configured (development / CI environments).
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired
    private MeterRegistry meterRegistry;

    @Value("${spring.mail.host:localhost}")
    private String smtpHost;

    @Value("${zunftgewerk.email.from:noreply@localhost}")
    private String fromAddress;

    @Value("${zunftgewerk.email.from-name:ZunftGewerk}")
    private String fromName;

    @Value("${zunftgewerk.email.api-base-url:http://localhost:8080}")
    private String apiBaseUrl;

    @Value("${zunftgewerk.email.landing-base-url:http://localhost:3000}")
    private String landingBaseUrl;

    private boolean isDevMode() {
        return mailSender == null || "localhost".equals(smtpHost) || smtpHost.isBlank();
    }

    /**
     * Sends the email-verification link to a newly registered user.
     *
     * @param toEmail  recipient address
     * @param rawToken the plain-text verification token to embed in the URL
     */
    public void sendVerificationEmail(String toEmail, String rawToken) {
        String link = apiBaseUrl + "/v1/auth/verify-email?token=" + rawToken;
        if (isDevMode()) {
            log.info("[EMAIL] Verification → {} | from={} | link={}", toEmail, fromAddress, link);
            return;
        }
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, false, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject("Bitte bestätige deine E-Mail-Adresse");
            helper.setText(buildVerificationHtml(link), true);
            mailSender.send(msg);
            log.debug("[EMAIL] Verification sent → {}", toEmail);
        } catch (Exception ex) {
            meterRegistry.counter("email_send_failures_total", "type", "verification").increment();
            log.error("[EMAIL] Failed to send verification email to {}", toEmail, ex);
        }
    }

    /**
     * Sends the password-reset code to the user.
     *
     * @param toEmail  recipient address
     * @param rawToken the plain-text reset code to display in the email
     */
    public void sendPasswordResetEmail(String toEmail, String rawToken) {
        if (isDevMode()) {
            log.info("[EMAIL] Password reset → {} | from={} | code={}", toEmail, fromAddress, rawToken);
            return;
        }
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, false, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject("Dein Passwort-Reset-Code");
            helper.setText(buildPasswordResetHtml(rawToken), true);
            mailSender.send(msg);
            log.debug("[EMAIL] Password reset sent → {}", toEmail);
        } catch (Exception ex) {
            meterRegistry.counter("email_send_failures_total", "type", "password_reset").increment();
            log.error("[EMAIL] Failed to send password reset email to {}", toEmail, ex);
        }
    }

    private String buildVerificationHtml(String link) {
        return "<!DOCTYPE html>" +
            "<html lang=\"de\"><head><meta charset=\"UTF-8\"></head>" +
            "<body style=\"font-family:sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto;padding:32px 16px;\">" +
            "<h2 style=\"margin-top:0;\">E-Mail-Adresse bestätigen</h2>" +
            "<p>Klicke auf den Button, um deine E-Mail-Adresse zu bestätigen und dein Konto bei ZunftGewerk zu aktivieren.</p>" +
            "<p><a href=\"" + link + "\" style=\"display:inline-block;background:#1a1a1a;color:#ffffff;padding:12px 24px;" +
            "text-decoration:none;border-radius:6px;font-weight:600;\">E-Mail bestätigen</a></p>" +
            "<p style=\"color:#666;font-size:14px;\">Der Link ist 24&nbsp;Stunden gültig. " +
            "Falls du dich nicht registriert hast, kannst du diese E-Mail ignorieren.</p>" +
            "<p style=\"color:#999;font-size:12px;word-break:break-all;\">Oder kopiere diesen Link: " + link + "</p>" +
            "</body></html>";
    }

    private String buildPasswordResetHtml(String code) {
        return "<!DOCTYPE html>" +
            "<html lang=\"de\"><head><meta charset=\"UTF-8\"></head>" +
            "<body style=\"font-family:sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto;padding:32px 16px;\">" +
            "<h2 style=\"margin-top:0;\">Passwort zurücksetzen</h2>" +
            "<p>Dein Reset-Code lautet:</p>" +
            "<p style=\"font-size:28px;font-weight:700;letter-spacing:4px;background:#f5f5f5;" +
            "display:inline-block;padding:12px 20px;border-radius:6px;\">" + code + "</p>" +
            "<p style=\"color:#666;font-size:14px;\">Der Code ist 1&nbsp;Stunde gültig. " +
            "Gib ihn auf der Passwort-zurücksetzen-Seite ein.</p>" +
            "<p style=\"color:#666;font-size:14px;\">Falls du kein Passwort-Reset angefordert hast, " +
            "kannst du diese E-Mail ignorieren.</p>" +
            "</body></html>";
    }

    /**
     * Sends a team-invite email to a prospective member.
     *
     * @param toEmail     recipient address
     * @param rawToken    the plain-text invite token to embed in the URL
     * @param inviterName display name of the person who sent the invite
     * @param tenantName  name of the tenant / organisation
     */
    public void sendInviteEmail(String toEmail, String rawToken, String inviterName, String tenantName) {
        String link = landingBaseUrl + "/invite/accept?token=" + rawToken;
        if (isDevMode()) {
            log.info("[EMAIL] Invite → {} | from={} | inviter={} | tenant={} | link={}",
                toEmail, fromAddress, inviterName, tenantName, link);
            return;
        }
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, false, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject("Einladung zu " + tenantName);
            helper.setText(buildInviteHtml(link, inviterName, tenantName), true);
            mailSender.send(msg);
            log.debug("[EMAIL] Invite sent → {}", toEmail);
        } catch (Exception ex) {
            meterRegistry.counter("email_send_failures_total", "type", "invite").increment();
            log.error("[EMAIL] Failed to send invite email to {}", toEmail, ex);
        }
    }

    /**
     * Sends a 6-digit MFA login code to the user.
     *
     * @param toEmail recipient address
     * @param code    the 6-digit code to display in the email
     */
    public void sendMfaEmailCode(String toEmail, String code) {
        if (isDevMode()) {
            log.info("[EMAIL] MFA code → {} | from={} | code={}", toEmail, fromAddress, code);
            return;
        }
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, false, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject("Dein Anmelde-Code");
            helper.setText(buildMfaEmailCodeHtml(code), true);
            mailSender.send(msg);
            log.debug("[EMAIL] MFA code sent → {}", toEmail);
        } catch (Exception ex) {
            meterRegistry.counter("email_send_failures_total", "type", "mfa_code").increment();
            log.error("[EMAIL] Failed to send MFA code email to {}", toEmail, ex);
        }
    }

    private String buildMfaEmailCodeHtml(String code) {
        return "<!DOCTYPE html>" +
            "<html lang=\"de\"><head><meta charset=\"UTF-8\"></head>" +
            "<body style=\"font-family:sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto;padding:32px 16px;\">" +
            "<h2 style=\"margin-top:0;\">Dein Anmelde-Code</h2>" +
            "<p>Verwende den folgenden Code, um deine Anmeldung abzuschlie\u00DFen:</p>" +
            "<p style=\"font-size:32px;font-weight:700;letter-spacing:6px;background:#f5f5f5;" +
            "display:inline-block;padding:14px 24px;border-radius:6px;\">" + code + "</p>" +
            "<p style=\"color:#666;font-size:14px;\">Der Code ist 5&nbsp;Minuten g\u00FCltig.</p>" +
            "<p style=\"color:#666;font-size:14px;\">Falls du dich nicht angemeldet hast, " +
            "kannst du diese E-Mail ignorieren.</p>" +
            "</body></html>";
    }

    private String buildInviteHtml(String link, String inviterName, String tenantName) {
        return "<!DOCTYPE html>" +
            "<html lang=\"de\"><head><meta charset=\"UTF-8\"></head>" +
            "<body style=\"font-family:sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto;padding:32px 16px;\">" +
            "<h2 style=\"margin-top:0;\">Einladung zu " + tenantName + "</h2>" +
            "<p>" + inviterName + " hat dich eingeladen, dem Team <strong>" + tenantName + "</strong> " +
            "auf ZunftGewerk beizutreten.</p>" +
            "<p><a href=\"" + link + "\" style=\"display:inline-block;background:#1a1a1a;color:#ffffff;padding:12px 24px;" +
            "text-decoration:none;border-radius:6px;font-weight:600;\">Einladung annehmen</a></p>" +
            "<p style=\"color:#666;font-size:14px;\">Die Einladung ist 7&nbsp;Tage g\u00FCltig. " +
            "Falls du nicht erwartet hast, diese Einladung zu erhalten, kannst du diese E-Mail ignorieren.</p>" +
            "<p style=\"color:#999;font-size:12px;word-break:break-all;\">Oder kopiere diesen Link: " + link + "</p>" +
            "</body></html>";
    }
}
