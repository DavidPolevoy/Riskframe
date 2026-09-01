import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Sites worker generation', () => {
  it('falls back SPA document requests to index.html', () => {
    const script = readFileSync(resolve('scripts/build-sites-worker.mjs'), 'utf8');

    expect(script).toContain("new URL('/index.html', url)");
  });
});
