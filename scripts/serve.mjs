#!/usr/bin/env node
/**
 * Local preview server for dist/ (no dependencies). Mirrors GitHub Pages:
 * directory URLs serve index.html and unknown paths get 404.html with a 404.
 *   PORT=8080 node scripts/serve.mjs
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT) || 8080;
const host = process.env.HOST || '127.0.0.1';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

if (!existsSync(root)) {
  console.error('dist/ not found: run `npm run build` first');
  process.exit(1);
}

createServer((req, res) => {
  let path;
  try {
    path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }
  let file = normalize(join(root, path));
  if (!file.startsWith(root.endsWith(sep) ? root : root + sep) && file !== root.replace(/[\\/]$/, '')) {
    res.writeHead(403).end();
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  let status = 200;
  if (!existsSync(file)) {
    status = 404;
    file = join(root, '404.html');
  }
  res.writeHead(status, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
  createReadStream(file).pipe(res);
}).listen(port, host, () => console.log(`serving dist/ at http://${host}:${port}/`));
