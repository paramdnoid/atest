import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ENV_FILES = ['.env.e2e', '.env.e2e.local'] as const;
let loaded = false;

function stripWrappingQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function parseLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return null;
  }

  const equalIndex = trimmed.indexOf('=');
  if (equalIndex <= 0) {
    return null;
  }

  const key = trimmed.slice(0, equalIndex).trim();
  if (!key) {
    return null;
  }

  const rawValue = trimmed.slice(equalIndex + 1).trim();
  return [key, stripWrappingQuotes(rawValue)];
}

export function loadE2EEnvFiles(cwd = process.cwd()): void {
  if (loaded) {
    return;
  }

  for (const file of ENV_FILES) {
    const path = resolve(cwd, file);
    if (!existsSync(path)) {
      continue;
    }

    const content = readFileSync(path, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const entry = parseLine(line);
      if (!entry) {
        continue;
      }
      const [key, value] = entry;
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }

  loaded = true;
}
