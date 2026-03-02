#!/usr/bin/env bash
# e2e-seed-ci.sh — seeds the E2E test user in CI using psql directly (not docker exec)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

: "${E2E_ADMIN_EMAIL:?Missing E2E_ADMIN_EMAIL}"
: "${E2E_ADMIN_PASSWORD:?Missing E2E_ADMIN_PASSWORD}"
: "${E2E_ADMIN_TOTP_SECRET:?Missing E2E_ADMIN_TOTP_SECRET}"
: "${MFA_ENCRYPTION_KEY:=dev-dev-dev-dev-dev-dev-dev-dev}"

DB_HOST="${PGHOST:-localhost}"
DB_USER="${PGUSER:-zunftgewerk}"
DB_NAME="${PGDATABASE:-zunftgewerk}"
export PGPASSWORD="${PGPASSWORD:-zunftgewerk}"

# Hash password with Argon2 (requires Gradle testClasses to have been run first)
ARGON2_JVM_JAR="$(find "$HOME/.gradle/caches/modules-2/files-2.1/de.mkammerer/argon2-jvm" -name '*.jar' 2>/dev/null | head -n 1)"
ARGON2_NOLIBS_JAR="$(find "$HOME/.gradle/caches/modules-2/files-2.1/de.mkammerer/argon2-jvm-nolibs" -name '*.jar' 2>/dev/null | head -n 1)"
JNA_JAR="$(find "$HOME/.gradle/caches/modules-2/files-2.1/net.java.dev.jna/jna" -name '*.jar' 2>/dev/null | head -n 1)"

if [[ -z "$ARGON2_JVM_JAR" || -z "$ARGON2_NOLIBS_JAR" || -z "$JNA_JAR" ]]; then
  echo "Missing Argon2/JNA jars. Run 'cd services/api && gradle testClasses' first."
  exit 1
fi

ARGON_HASH="$(
  jshell --class-path "${ARGON2_NOLIBS_JAR}:${ARGON2_JVM_JAR}:${JNA_JAR}" <<EOF | tr -d '\r' | sed -n 's/.*\(\$argon2[^[:space:]]*\).*/\1/p' | tail -n 1
import de.mkammerer.argon2.*;
var a = Argon2Factory.create();
System.out.println(a.hash(3, 65536, 1, "${E2E_ADMIN_PASSWORD}".toCharArray()));
/exit
EOF
)"

if [[ -z "$ARGON_HASH" ]]; then
  echo "Failed to generate Argon2 hash."
  exit 1
fi

ENC_TOTP_SECRET="$(
  MFA_KEY="$MFA_ENCRYPTION_KEY" E2E_ADMIN_TOTP_SECRET="$E2E_ADMIN_TOTP_SECRET" node <<'NODE'
const crypto = require('crypto');
const key = crypto.createHash('sha256').update(process.env.MFA_KEY, 'utf8').digest().subarray(0, 16);
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-128-gcm', key, iv);
const ciphertext = Buffer.concat([cipher.update(process.env.E2E_ADMIN_TOTP_SECRET, 'utf8'), cipher.final()]);
const tag = cipher.getAuthTag();
process.stdout.write(Buffer.concat([iv, ciphertext, tag]).toString('base64'));
NODE
)"

if [[ -z "$ENC_TOTP_SECRET" ]]; then
  echo "Failed to encrypt TOTP secret."
  exit 1
fi

USER_ID="$(uuidgen | tr '[:upper:]' '[:lower:]')"
TENANT_ID="$(uuidgen | tr '[:upper:]' '[:lower:]')"
MEMBERSHIP_ID="$(uuidgen | tr '[:upper:]' '[:lower:]')"

EMAIL_ESCAPED="${E2E_ADMIN_EMAIL//\'/\'\'}"
HASH_ESCAPED="${ARGON_HASH//\'/\'\'}"
SECRET_ESCAPED="${ENC_TOTP_SECRET//\'/\'\'}"

psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" <<SQL
BEGIN;
DELETE FROM users WHERE email = '${EMAIL_ESCAPED}';

INSERT INTO tenants (id, name, created_at)
VALUES ('${TENANT_ID}', 'E2E Tenant', NOW());

INSERT INTO users (id, email, password_hash, mfa_enabled, created_at, password_algo)
VALUES ('${USER_ID}', '${EMAIL_ESCAPED}', '${HASH_ESCAPED}', TRUE, NOW(), 'argon2id');

INSERT INTO memberships (id, tenant_id, user_id, role_key, created_at)
VALUES ('${MEMBERSHIP_ID}', '${TENANT_ID}', '${USER_ID}', 'owner', NOW());

INSERT INTO mfa_secrets (user_id, totp_secret_encrypted, enabled, backup_codes_hashes, created_at, updated_at)
VALUES ('${USER_ID}', '${SECRET_ESCAPED}', TRUE, '[]', NOW(), NOW());
COMMIT;
SQL

echo "Seeded E2E user '${E2E_ADMIN_EMAIL}' (owner role, MFA enabled) into ${DB_HOST}/${DB_NAME}."
