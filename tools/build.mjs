#!/usr/bin/env node
/**
 * Build webu Řeznictví Stiborek a syn
 * ------------------------------------
 * Načte stiborek-web/content.json, zkontroluje ho a předgeneruje obsah do
 * index.html a 404.html (rychlé načtení, SEO, funkčnost bez JavaScriptu).
 * Zároveň vytvoří sitemap.xml, robots.txt a manifest.webmanifest.
 *
 * Použití:
 *   node tools/build.mjs           – sestaví web
 *   node tools/build.mjs --check   – jen ověří, že vygenerované soubory odpovídají content.json (CI)
 *
 * Nevyžaduje žádné balíčky (stačí Node.js 20+).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WEB = join(ROOT, 'stiborek-web');
const CHECK = process.argv.includes('--check');

const site = await import(pathToFileURL(join(WEB, 'script.js')).href);
const { esc, renderRegion, jsonLd, contentHash, parseHours, absolutize } = site;

const errors = [];
const warnings = [];

/* ---------- Načtení a kontrola content.json ---------- */

const raw = readFileSync(join(WEB, 'content.json'), 'utf8');
let content;
try {
  content = JSON.parse(raw.replace(/^﻿/, ''));
} catch (e) {
  const m = String(e.message).match(/position (\d+)/);
  let where = '';
  if (m) {
    const pos = Number(m[1]);
    const before = raw.slice(0, pos);
    const line = before.split('\n').length;
    where = ` (řádek ${line}, sloupec ${pos - before.lastIndexOf('\n')})`;
  }
  console.error(`\n✖ content.json není platný JSON${where}:\n  ${e.message}\n  Tip: zkontrolujte čárky mezi položkami a uvozovky kolem textů.\n`);
  process.exit(1);
}

const need = (cond, msg) => { if (!cond) errors.push(msg); };
const c = content;
need(c.site && /^https:\/\/[^/]+\/$/.test(c.site.url || ''), 'site.url musí být adresa webu ve tvaru https://www.domena.cz/ (s lomítkem na konci).');
need(c.site && c.site.title, 'Chybí site.title (titulek stránky).');
need(c.site && c.site.description, 'Chybí site.description (popis pro vyhledávače).');
need(c.company && c.company.name, 'Chybí company.name.');
need(c.company && /^\+?[\d\s]{9,}$/.test(c.company.phone || ''), 'company.phone musí být telefonní číslo, např. +420 556 836 210.');
need(c.company && c.company.address && c.company.address.street && c.company.address.city, 'Chybí adresa (company.address).');
for (const [key, label] of [['monday', 'pondělí'], ['tuesday', 'úterý'], ['wednesday', 'středu'], ['thursday', 'čtvrtek'], ['friday', 'pátek'], ['saturday', 'sobotu'], ['sunday', 'neděli']]) {
  const v = c.openingHours && c.openingHours[key];
  need(parseHours(v) !== null, `Otevírací doba pro ${label} („${v}“) má neplatný formát. Použijte např. 07:00-17:00, 07:00-12:00, 13:00-17:00 nebo zavřeno.`);
}
for (const ex of (c.openingHours && c.openingHours.exceptions) || []) {
  need(/^\d{4}-\d{2}-\d{2}$/.test(ex.date || ''), `Výjimka v otevírací době má neplatné datum „${ex.date}“ (správně např. 2026-12-24).`);
  need(parseHours(ex.hours) !== null, `Výjimka ${ex.date}: neplatný čas „${ex.hours}“.`);
}
for (const [path, url] of [
  ['company.facebook', c.company && c.company.facebook],
  ['company.instagram', c.company && c.company.instagram],
  ['company.maps.navigate', c.company && c.company.maps && c.company.maps.navigate],
  ['company.maps.mapyCz', c.company && c.company.maps && c.company.maps.mapyCz],
  ['company.maps.google', c.company && c.company.maps && c.company.maps.google],
]) {
  if (url) need(/^https:\/\//.test(url), `${path} musí začínat https://`);
}

/* obrázky – existují soubory? */
function checkImage(where, img) {
  if (!img) return;
  const o = typeof img === 'string' ? { src: img } : img;
  if (!o.src) { errors.push(`${where}: chybí "src".`); return; }
  if (typeof img === 'object' && !o.alt && o.alt !== '') warnings.push(`${where}: chybí popis "alt" (důležité pro nevidomé a vyhledávače).`);
  const widths = Array.isArray(o.widths) ? o.widths : [];
  const base = o.src.replace(/\.(jpe?g|png|webp|avif)$/i, '');
  const ext = ((o.src.match(/\.(jpe?g|png)$/i) || [])[1] || 'jpg').toLowerCase();
  const files = widths.length
    ? widths.flatMap((w) => [ext, ...(o.formats || ['avif', 'webp'])].map((f) => `${base}-${w}.${f}`))
    : [o.src];
  for (const f of files) if (!existsSync(join(WEB, f))) errors.push(`${where}: soubor ${f} neexistuje.`);
}
checkImage('hero.image', c.hero && c.hero.image);
checkImage('about.image', c.about && c.about.image);
((c.products && c.products.items) || []).forEach((p, i) => checkImage(`products.items[${i}] (${p.name})`, p.image));
((c.gallery && c.gallery.items) || []).forEach((g, i) => checkImage(`gallery.items[${i}]`, g));

/* připomínky k potvrzení majitelem */
(function walk(o, path) {
  if (o && typeof o === 'object') {
    for (const [k, v] of Object.entries(o)) {
      if (k.startsWith('_') && typeof v === 'string' && /REQUIRES OWNER CONFIRMATION/.test(v)) warnings.push(`K potvrzení majitelem – ${path || 'content'}: ${v}`);
      else walk(v, path ? `${path}.${k}` : k);
    }
  }
})(c, '');

if (errors.length) {
  console.error('\n✖ V content.json jsou chyby:\n' + errors.map((e) => '  • ' + e).join('\n') + '\n');
  process.exit(1);
}

/* ---------- Generování ---------- */

const now = new Date();
const hash = contentHash(raw);
const base = c.site.url;
const abs = (p) => new URL(p, base).href;
const fileHash = (f) => createHash('sha256').update(readFileSync(join(WEB, f))).digest('hex').slice(0, 10);
const versions = { 'styles.css': fileHash('styles.css'), 'script.js': fileHash('script.js') };

function fillRegions(html, transform = (x) => x) {
  return html.replace(/<!--region:([\w-]+)-->[\s\S]*?<!--\/region:\1-->/g, (m, name) => {
    const out = transform(renderRegion(name, c, now));
    return `<!--region:${name}-->\n${out}\n<!--/region:${name}-->`;
  });
}

function setVersions(html, prefix = '') {
  return html
    .replace(new RegExp(`href="${prefix}styles\\.css(?:\\?v=[\\w]+)?"`), `href="${prefix}styles.css?v=${versions['styles.css']}"`)
    .replace(new RegExp(`src="${prefix}script\\.js(?:\\?v=[\\w]+)?"`), `src="${prefix}script.js?v=${versions['script.js']}"`);
}

const lcFirst = (t) => String(t || '').charAt(0).toLowerCase() + String(t || '').slice(1);
const ogAlt = `${c.company.name} – ${lcFirst(c.company.trade)}, ${c.company.address.city}`;
const headIndex = [
  `<title>${esc(c.site.title)}</title>`,
  `<meta name="description" content="${esc(c.site.description)}">`,
  `<link rel="canonical" href="${esc(base)}">`,
  `<meta property="og:type" content="website">`,
  `<meta property="og:locale" content="cs_CZ">`,
  `<meta property="og:site_name" content="${esc(c.company.name)}">`,
  `<meta property="og:title" content="${esc(c.site.title)}">`,
  `<meta property="og:description" content="${esc(c.site.description)}">`,
  `<meta property="og:url" content="${esc(base)}">`,
  `<meta property="og:image" content="${esc(abs(c.site.ogImage))}">`,
  `<meta property="og:image:width" content="1200">`,
  `<meta property="og:image:height" content="630">`,
  `<meta property="og:image:alt" content="${esc(ogAlt)}">`,
  `<meta name="twitter:card" content="summary_large_image">`,
  `<meta name="twitter:title" content="${esc(c.site.title)}">`,
  `<meta name="twitter:description" content="${esc(c.site.description)}">`,
  `<meta name="twitter:image" content="${esc(abs(c.site.ogImage))}">`,
  `<meta name="twitter:image:alt" content="${esc(ogAlt)}">`,
  `<script type="application/ld+json" id="schema-localbusiness">\n${jsonLd(c)}\n</script>`,
].join('\n');

const head404 = `<title>Stránka nenalezena | ${esc(c.company.name)}</title>`;

function buildPage(file, headMarker, head, opts = {}) {
  let html = readFileSync(join(WEB, file), 'utf8');
  html = html.replace(new RegExp(`<!--build:${headMarker}-->[\\s\\S]*?<!--\\/build:${headMarker}-->`), `<!--build:${headMarker}-->\n${head}\n<!--/build:${headMarker}-->`);
  html = fillRegions(html, opts.transform);
  html = html.replace(/data-content-hash="[^"]*"/, `data-content-hash="${hash}"`);
  html = setVersions(html, opts.prefix || '');
  return html;
}

const outputs = {
  'index.html': buildPage('index.html', 'head', headIndex),
  '404.html': buildPage('404.html', 'head404', head404, { transform: absolutize, prefix: '/' }),
  'sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${esc(base)}</loc>
    <lastmod>${esc(c.site.lastUpdated || now.toISOString().slice(0, 10))}</lastmod>
  </url>
</urlset>
`,
  'robots.txt': `# ${c.company.name}
User-agent: *
Allow: /

Sitemap: ${abs('sitemap.xml')}
`,
  'manifest.webmanifest': JSON.stringify({
    name: c.company.name,
    short_name: c.company.shortName || c.company.name,
    description: c.site.description,
    lang: 'cs',
    start_url: './',
    scope: './',
    display: 'browser',
    background_color: '#f6f1e8',
    theme_color: '#a3191b',
    icons: [
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  }, null, 2) + '\n',
};

let changed = [];
for (const [file, out] of Object.entries(outputs)) {
  const path = join(WEB, file);
  const before = existsSync(path) ? readFileSync(path, 'utf8') : '';
  if (before !== out) {
    changed.push(file);
    if (!CHECK) writeFileSync(path, out);
  }
}

if (warnings.length) console.warn('\n⚠ Upozornění:\n' + warnings.map((w) => '  • ' + w).join('\n'));

if (CHECK) {
  if (changed.length) {
    console.error(`\n✖ Vygenerované soubory neodpovídají content.json: ${changed.join(', ')}\n  Spusťte: node tools/build.mjs\n`);
    process.exit(1);
  }
  console.log('\n✔ Vygenerované soubory odpovídají content.json.');
} else {
  console.log(`\n✔ Hotovo. ${changed.length ? 'Aktualizováno: ' + changed.join(', ') : 'Beze změn.'}  (obsah ${hash}, css ${versions['styles.css']}, js ${versions['script.js']})`);
}
