#!/usr/bin/env node
/**
 * Lokální náhled webu se stejnými bezpečnostními hlavičkami jako na hostingu
 * (čte pravidla ze souboru stiborek-web/_headers).
 *
 *   node tools/serve.mjs [port]      → http://localhost:8080
 *   SITE_ROOT=/jina/slozka node tools/serve.mjs   (náhled jiné kopie webu)
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB = process.env.SITE_ROOT || join(dirname(fileURLToPath(import.meta.url)), '..', 'stiborek-web');
const PORT = Number(process.argv[2] || process.env.PORT || 8080);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
};

/* _headers: bloky „/cesta“ + odsazené řádky „Název: hodnota“ */
function parseHeaders() {
  const rules = [];
  let cur = null;
  for (const line of readFileSync(join(WEB, '_headers'), 'utf8').split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) { cur = { pattern: line.trim(), headers: [] }; rules.push(cur); continue; }
    const i = line.indexOf(':');
    if (cur && i > 0) cur.headers.push([line.slice(0, i).trim(), line.slice(i + 1).trim()]);
  }
  return rules.map((r) => ({
    ...r,
    re: new RegExp('^' + r.pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'),
  }));
}
const RULES = parseHeaders();

const BLOCKED = /^\/(README\.md|_headers|security\/.*|\..*)$/;

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let path = decodeURIComponent(url.pathname);
  let status = 200;
  let file = normalize(join(WEB, path));
  if (!file.startsWith(WEB) || BLOCKED.test(path)) file = null;
  try {
    if (file && (await stat(file)).isDirectory()) { file = join(file, 'index.html'); path = path.replace(/\/?$/, '/'); }
    if (file) await stat(file);
  } catch { file = null; }
  if (!file) { status = 404; file = join(WEB, '404.html'); }
  for (const r of RULES) if (r.re.test(path)) for (const [k, v] of r.headers) res.setHeader(k, v);
  if (status === 404) res.setHeader('Cache-Control', 'no-cache');
  const body = await readFile(file);
  res.writeHead(status, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
  res.end(req.method === 'HEAD' ? undefined : body);
}).listen(PORT, () => console.log(`Náhled webu: http://localhost:${PORT}/`));
