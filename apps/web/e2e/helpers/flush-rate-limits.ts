import { execSync } from 'node:child_process';

export function flushRateLimits(): void {
  const commands = [
    // CI: redis-cli available directly on localhost
    `redis-cli -h localhost -p 6379 KEYS 'zg:auth:ratelimit:*' | xargs -r redis-cli -h localhost -p 6379 DEL`,
    // Local: via Docker container
    `docker exec zunftgewerk-redis redis-cli KEYS 'zg:auth:ratelimit:*' | xargs -r docker exec -i zunftgewerk-redis redis-cli DEL`,
  ];

  for (const cmd of commands) {
    try {
      execSync(cmd, { stdio: 'pipe', timeout: 5_000 });
      return;
    } catch {
      // Try next command
    }
  }
}
