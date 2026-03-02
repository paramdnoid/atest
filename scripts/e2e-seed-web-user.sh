#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="apps/web/.env.e2e"
ENV_LOCAL_FILE="apps/web/.env.e2e.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Copy apps/web/.env.e2e.example first."
  exit 1
fi

set -a
source "$ENV_FILE"
if [[ -f "$ENV_LOCAL_FILE" ]]; then
  source "$ENV_LOCAL_FILE"
fi
set +a

required_vars=("E2E_ADMIN_EMAIL" "E2E_ADMIN_PASSWORD" "E2E_ADMIN_TOTP_SECRET")
for name in "${required_vars[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required env var: $name (from $ENV_FILE or $ENV_LOCAL_FILE)"
    exit 1
  fi
done

if ! docker ps --format '{{.Names}}' | grep -q '^zunftgewerk-postgres$'; then
  echo "Postgres container 'zunftgewerk-postgres' is not running."
  exit 1
fi

ARGON2_JVM_JAR="$(find "$HOME/.gradle/caches/modules-2/files-2.1/de.mkammerer/argon2-jvm" -name '*.jar' | head -n 1)"
ARGON2_NOLIBS_JAR="$(find "$HOME/.gradle/caches/modules-2/files-2.1/de.mkammerer/argon2-jvm-nolibs" -name '*.jar' | head -n 1)"
JNA_JAR="$(find "$HOME/.gradle/caches/modules-2/files-2.1/net.java.dev.jna/jna" -name '*.jar' | head -n 1)"

if [[ -z "$ARGON2_JVM_JAR" || -z "$ARGON2_NOLIBS_JAR" || -z "$JNA_JAR" ]]; then
  echo "Missing Argon2/JNA jars in ~/.gradle cache."
  echo "Run 'cd services/api && gradle testClasses' once, then retry."
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

MFA_KEY="${MFA_ENCRYPTION_KEY:-dev-dev-dev-dev-dev-dev-dev-dev}"
ENC_TOTP_SECRET="$(
  MFA_KEY="$MFA_KEY" E2E_ADMIN_TOTP_SECRET="$E2E_ADMIN_TOTP_SECRET" node <<'NODE'
const crypto = require('crypto');

const seed = process.env.MFA_KEY;
const secret = process.env.E2E_ADMIN_TOTP_SECRET;
if (!seed || !secret) {
  process.exit(1);
}

const key = crypto.createHash('sha256').update(seed, 'utf8').digest().subarray(0, 16);
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-128-gcm', key, iv);
const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
const tag = cipher.getAuthTag();
process.stdout.write(Buffer.concat([iv, ciphertext, tag]).toString('base64'));
NODE
)"

if [[ -z "$ENC_TOTP_SECRET" ]]; then
  echo "Failed to encrypt MFA secret."
  exit 1
fi

USER_ID="$(uuidgen | tr '[:upper:]' '[:lower:]')"
TENANT_ID="$(uuidgen | tr '[:upper:]' '[:lower:]')"
MEMBERSHIP_ID="$(uuidgen | tr '[:upper:]' '[:lower:]')"

EMAIL_ESCAPED="${E2E_ADMIN_EMAIL//\'/\'\'}"
HASH_ESCAPED="${ARGON_HASH//\'/\'\'}"
SECRET_ESCAPED="${ENC_TOTP_SECRET//\'/\'\'}"

docker exec -i zunftgewerk-postgres psql -U zunftgewerk -d zunftgewerk <<SQL
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

echo "Seeded E2E user '${E2E_ADMIN_EMAIL}' (owner role, MFA enabled)."
