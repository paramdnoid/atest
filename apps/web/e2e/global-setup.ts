import { flushRateLimits } from './helpers/flush-rate-limits';

export default function globalSetup(): void {
  flushRateLimits();
}
