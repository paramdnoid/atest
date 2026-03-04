import { execSync } from 'node:child_process';

export function flushRateLimits(): void {
  try {
    execSync(
      `docker exec zunftgewerk-redis redis-cli --no-auth-warning KEYS 'zg:auth:ratelimit:*' | xargs -r docker exec -i zunftgewerk-redis redis-cli DEL`,
      { stdio: 'pipe', timeout: 5_000 }
    );
  } catch {
    // Redis not available or no keys — continue
  }
}
