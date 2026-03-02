package com.zunftgewerk.api.shared.security;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class JwtService {

    private final String issuer;
    private final String audience;
    private final String kid;
    private final Duration accessTtl;

    private final RSAPrivateKey privateKey;
    private final RSAPublicKey publicKey;

    public JwtService(
        @Value("${zunftgewerk.security.jwt-issuer}") String issuer,
        @Value("${zunftgewerk.security.jwt-audience}") String audience,
        @Value("${zunftgewerk.security.jwt-kid}") String kid,
        @Value("${zunftgewerk.security.jwt-access-ttl-seconds}") long accessTtlSeconds,
        @Value("${zunftgewerk.security.jwt-private-key-pem:}") String privateKeyPem,
        @Value("${zunftgewerk.security.jwt-public-key-pem:}") String publicKeyPem
    ) {
        this.issuer = issuer;
        this.audience = audience;
        this.kid = kid;
        this.accessTtl = Duration.ofSeconds(accessTtlSeconds);

        try {
            if (!privateKeyPem.isBlank() && !publicKeyPem.isBlank()) {
                this.privateKey = (RSAPrivateKey) parsePrivateKey(privateKeyPem);
                this.publicKey = (RSAPublicKey) parsePublicKey(publicKeyPem);
            } else {
                KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
                generator.initialize(2048);
                KeyPair keyPair = generator.generateKeyPair();
                this.privateKey = (RSAPrivateKey) keyPair.getPrivate();
                this.publicKey = (RSAPublicKey) keyPair.getPublic();
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to initialize JWT keys", ex);
        }
    }

    public AccessToken issueAccessToken(UUID userId, UUID tenantId, List<String> roles, boolean mfa, List<String> amr) {
        Instant now = Instant.now();
        Instant exp = now.plus(accessTtl);

        JWTClaimsSet claims = new JWTClaimsSet.Builder()
            .issuer(issuer)
            .audience(audience)
            .subject(userId.toString())
            .claim("tid", tenantId.toString())
            .claim("roles", roles)
            .claim("mfa", mfa)
            .claim("amr", amr)
            .issueTime(Date.from(now))
            .expirationTime(Date.from(exp))
            .jwtID(UUID.randomUUID().toString())
            .build();

        return new AccessToken(sign(claims), OffsetDateTime.ofInstant(exp, ZoneOffset.UTC));
    }

    public String issueMfaToken(UUID userId, UUID tenantId, List<String> roles) {
        Instant now = Instant.now();
        Instant exp = now.plus(Duration.ofMinutes(5));

        JWTClaimsSet claims = new JWTClaimsSet.Builder()
            .issuer(issuer)
            .audience(audience)
            .subject(userId.toString())
            .claim("tid", tenantId.toString())
            .claim("roles", roles)
            .claim("token_type", "mfa")
            .issueTime(Date.from(now))
            .expirationTime(Date.from(exp))
            .jwtID(UUID.randomUUID().toString())
            .build();

        return sign(claims);
    }

    public JwtPrincipal verifyAccessToken(String token) {
        JWTClaimsSet claims = verify(token);
        boolean mfa = getBooleanClaim(claims, "mfa");

        return new JwtPrincipal(
            UUID.fromString(claims.getSubject()),
            UUID.fromString(String.valueOf(claims.getClaim("tid"))),
            getStringListClaim(claims, "roles"),
            mfa,
            getStringListClaim(claims, "amr")
        );
    }

    public JwtPrincipal verifyMfaToken(String token) {
        JWTClaimsSet claims = verify(token);
        String tokenType = String.valueOf(claims.getClaim("token_type"));
        if (!"mfa".equals(tokenType)) {
            throw new IllegalArgumentException("Invalid MFA token");
        }

        return new JwtPrincipal(
            UUID.fromString(claims.getSubject()),
            UUID.fromString(String.valueOf(claims.getClaim("tid"))),
            getStringListClaim(claims, "roles"),
            false,
            List.of("pwd")
        );
    }

    public Map<String, Object> getJwks() {
        RSAKey rsaKey = new RSAKey.Builder(publicKey)
            .algorithm(JWSAlgorithm.RS256)
            .keyID(kid)
            .build();
        return new JWKSet(rsaKey).toJSONObject();
    }

    private String sign(JWTClaimsSet claims) {
        try {
            SignedJWT signedJWT = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.RS256)
                    .type(JOSEObjectType.JWT)
                    .keyID(kid)
                    .build(),
                claims
            );
            signedJWT.sign(new RSASSASigner(privateKey));
            return signedJWT.serialize();
        } catch (JOSEException ex) {
            throw new IllegalStateException("Unable to sign JWT", ex);
        }
    }

    private JWTClaimsSet verify(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWSVerifier verifier = new RSASSAVerifier(publicKey);
            if (!signedJWT.verify(verifier)) {
                throw new IllegalArgumentException("Invalid JWT signature");
            }

            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();
            if (!issuer.equals(claims.getIssuer())) {
                throw new IllegalArgumentException("Invalid JWT issuer");
            }
            if (claims.getAudience() == null || !claims.getAudience().contains(audience)) {
                throw new IllegalArgumentException("Invalid JWT audience");
            }
            if (claims.getExpirationTime() == null || claims.getExpirationTime().before(new Date())) {
                throw new IllegalArgumentException("JWT expired");
            }

            return claims;
        } catch (Exception ex) {
            if (ex instanceof IllegalArgumentException) {
                throw (IllegalArgumentException) ex;
            }
            throw new IllegalArgumentException("JWT verification failed", ex);
        }
    }

    private boolean getBooleanClaim(JWTClaimsSet claims, String key) {
        Object value = claims.getClaim(key);
        return value instanceof Boolean && (Boolean) value;
    }

    @SuppressWarnings("unchecked")
    private List<String> getStringListClaim(JWTClaimsSet claims, String key) {
        Object value = claims.getClaim(key);
        if (value instanceof List<?>) {
            return ((List<?>) value).stream().map(String::valueOf).toList();
        }
        return List.of();
    }

    private PrivateKey parsePrivateKey(String pem) throws Exception {
        String sanitized = pem
            .replace("-----BEGIN PRIVATE KEY-----", "")
            .replace("-----END PRIVATE KEY-----", "")
            .replaceAll("\\s", "");
        byte[] decoded = Base64.getDecoder().decode(sanitized);
        PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(decoded);
        return KeyFactory.getInstance("RSA").generatePrivate(keySpec);
    }

    private PublicKey parsePublicKey(String pem) throws Exception {
        String sanitized = pem
            .replace("-----BEGIN PUBLIC KEY-----", "")
            .replace("-----END PUBLIC KEY-----", "")
            .replaceAll("\\s", "");
        byte[] decoded = Base64.getDecoder().decode(sanitized);
        X509EncodedKeySpec keySpec = new X509EncodedKeySpec(decoded);
        return KeyFactory.getInstance("RSA").generatePublic(keySpec);
    }

    public record AccessToken(String token, OffsetDateTime expiresAt) {
    }
}
