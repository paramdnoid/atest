import { createHmac } from 'node:crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function isHex(input: string): boolean {
  return /^[0-9a-fA-F]+$/.test(input) && input.length % 2 === 0;
}

function decodeSecret(input: string): Buffer {
  const trimmed = input.trim().replace(/\s+/g, '');

  // Auto-detect hex-encoded secrets (contain 0, 1, 8, 9, or a-f)
  if (isHex(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }

  // Otherwise decode as base32
  const normalized = trimmed.toUpperCase().replace(/=+$/g, '');
  let bits = '';

  for (const char of normalized) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) {
      throw new Error(
        `Invalid base32 character in TOTP secret: "${char}". ` +
        `If your secret is hex-encoded, ensure it only contains 0-9a-f characters.`
      );
    }
    bits += idx.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }

  return Buffer.from(bytes);
}

function counterBuffer(counter: number): Buffer {
  const buffer = Buffer.alloc(8);
  const high = Math.floor(counter / 0x1_0000_0000);
  const low = counter >>> 0;
  buffer.writeUInt32BE(high, 0);
  buffer.writeUInt32BE(low, 4);
  return buffer;
}

export function generateTotpCode(secretBase32: string, now = Date.now()): string {
  const key = decodeSecret(secretBase32);
  const counter = Math.floor(now / 1000 / 30);
  const hmac = createHmac('sha1', key).update(counterBuffer(counter)).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(binary % 1_000_000).padStart(6, '0');
}

export async function generateStableTotpCode(secretBase32: string): Promise<string> {
  const nowMs = Date.now();
  const secondsInWindow = Math.floor(nowMs / 1000) % 30;
  const remaining = 30 - secondsInWindow;

  if (remaining <= 3) {
    // Avoid near-boundary codes that can expire before verification reaches the API.
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), (remaining + 1) * 1000);
    });
  }

  return generateTotpCode(secretBase32, Date.now());
}
