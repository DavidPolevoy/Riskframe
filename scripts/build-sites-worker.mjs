import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const workerPath = join(rootDir, 'dist', 'server', 'index.js');

mkdirSync(dirname(workerPath), { recursive: true });
writeFileSync(
  workerPath,
  `export default {
  async fetch(request, env) {
    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) return assetResponse;
    if (request.method !== 'GET' && request.method !== 'HEAD') return assetResponse;

    const url = new URL(request.url);
    return env.ASSETS.fetch(new Request(new URL('/', url), request));
  },
};
`,
);
