package com.zunftgewerk.api.modules.identity.service;

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

    @Value("${zunftgewerk.email.from:noreply@localhost}")
    private String fromAddress;

    @Value("${zunftgewerk.email.from-name:ZunftGewerk}")
    private String fromName;

    @Value("${zunftgewerk.email.api-base-url:http://localhost:8080}")
    private String apiBaseUrl;

    /**
     * Sends the email-verification link to a newly registered user.
     *
     * @param toEmail  recipient address
     * @param rawToken the plain-text verification token to embed in the URL
     */
    public void sendVerificationEmail(String toEmail, String rawToken) {
        String link = apiBaseUrl + "/v1/auth/verify-email?token=" + rawToken;
        if (mailSender == null) {
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
        } catch (MessagingException | UnsupportedEncodingException ex) {
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
        if (mailSender == null) {
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
        } catch (MessagingException | UnsupportedEncodingException ex) {
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
}
