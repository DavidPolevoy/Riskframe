import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(rootDir, 'dist');
const workerPath = join(rootDir, 'dist', 'server', 'index.js');

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
]);

function contentTypeFor(pathname) {
  const extension = pathname.slice(pathname.lastIndexOf('.'));
  return contentTypes.get(extension) ?? 'application/octet-stream';
}

function collectStaticAssets(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'server' || entry.name === '.openai') return [];
      return collectStaticAssets(entryPath);
    }

    if (!entry.isFile()) return [];

    const assetPath = `/${relative(distDir, entryPath).split(sep).join('/')}`;
    const body = readFileSync(entryPath, 'utf8');
    const immutable = assetPath.startsWith('/assets/');

    return [
      [
        assetPath,
        {
          body,
          headers: {
            'content-type': contentTypeFor(assetPath),
            'cache-control': immutable
              ? 'public, max-age=31536000, immutable'
              : 'public, max-age=0, must-revalidate',
          },
        },
      ],
    ];
  });
}

statSync(join(distDir, 'index.html'));
mkdirSync(dirname(workerPath), { recursive: true });

const assets = Object.fromEntries(collectStaticAssets(distDir));

writeFileSync(
  workerPath,
  `export default {
  async fetch(request) {
    const assets = new Map(Object.entries(${JSON.stringify(assets)}));
    const url = new URL(request.url);
    const asset = assets.get(url.pathname) ?? assets.get('/index.html');

    if (!asset || (request.method !== 'GET' && request.method !== 'HEAD')) {
      return new Response(null, { status: 404 });
    }

    return new Response(request.method === 'HEAD' ? null : asset.body, {
      headers: asset.headers,
    });
  },
};
`,
);
