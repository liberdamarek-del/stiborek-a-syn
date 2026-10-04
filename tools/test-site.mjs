#!/usr/bin/env node
/**
 * Automatické testy webu Řeznictví Stiborek a syn.
 *   npm test        (nejdřív: npm install)
 *
 * Testuje: build, HTML validitu, odkazy, přístupnost (axe, WCAG 2.2 AA),
 * klávesnici a fokus, funkčnost bez JS, CSP a hlavičky, externí požadavky,
 * SEO, obrázky, výkonový rozpočet, logiku otevírací doby, galerii (lightbox)
 * a živé načtení změn z content.json.
 */
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, existsSync, mkdtempSync, cpSync, writeFileSync, statSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { HtmlValidate } from 'html-validate';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WEB = join(ROOT, 'stiborek-web');
let failed = 0;
let passed = 0;
const ok = (cond, name, detail = '') => {
  if (cond) { passed++; console.log(`  ✔ ${name}`); }
  else { failed++; console.log(`  ✖ ${name}${detail ? `\n      ${String(detail).split('\n').join('\n      ')}` : ''}`); }
};
const section = (t) => console.log(`\n■ ${t}`);

function startServer(root, port) {
  const p = spawn(process.execPath, [join(ROOT, 'tools/serve.mjs'), String(port)], { env: { ...process.env, SITE_ROOT: root }, stdio: ['ignore', 'pipe', 'inherit'] });
  return new Promise((res) => p.stdout.once('data', () => res(p)));
}

/* ------------------------------------------------------------------ */
section('Build');
try {
  execFileSync(process.execPath, [join(ROOT, 'tools/build.mjs'), '--check'], { stdio: 'pipe' });
  ok(true, 'index.html, 404.html, sitemap, robots a manifest odpovídají content.json');
} catch (e) { ok(false, 'build --check', e.stdout?.toString() + e.stderr?.toString()); }

/* ------------------------------------------------------------------ */
section('HTML validace (html-validate)');
const htmlvalidate = new HtmlValidate({
  extends: ['html-validate:recommended'],
  rules: {
    'no-inline-style': 'error',
    'require-sri': 'off', // žádné externí zdroje
    'no-trailing-whitespace': 'off',
    'attribute-boolean-style': 'off',
    'doctype-style': 'off',
    'void-style': 'off',
    'long-title': 'off',
    'no-redundant-role': 'error',
    // „Zeptat se po telefonu“ je text odkazu, ne telefonní číslo
    'tel-non-breaking': ['error', { ignoreClasses: ['link-arrow'] }],
  },
});
for (const f of ['index.html', '404.html']) {
  const report = await htmlvalidate.validateFile(join(WEB, f));
  const msgs = report.results.flatMap((r) => r.messages.map((m) => `${f}:${m.line}:${m.column} ${m.ruleId} – ${m.message}`));
  ok(report.valid, `${f} je validní`, msgs.join('\n'));
}

/* ------------------------------------------------------------------ */
section('Hlavičky a CSP');
const headersFile = readFileSync(join(WEB, '_headers'), 'utf8');
const htaccess = readFileSync(join(WEB, '.htaccess'), 'utf8');
const cspA = (headersFile.match(/Content-Security-Policy: (.+)/) || [])[1];
const cspB = (htaccess.match(/Content-Security-Policy "([^"]+)"/) || [])[1];
const nginx = readFileSync(join(WEB, 'security/nginx-security-headers.conf'), 'utf8');
const cspC = (nginx.match(/Content-Security-Policy "([^"]+)"/) || [])[1];
ok(cspA && cspA === cspB && cspA === cspC, 'CSP v _headers, .htaccess a nginx je shodná', `${cspA}\n${cspB}\n${cspC}`);
ok(cspA && !/unsafe-inline|unsafe-eval|\*|data:|http:/.test(cspA), 'CSP neobsahuje unsafe-inline, unsafe-eval, *, data: ani http:');
ok(/default-src 'none'/.test(cspA) && /frame-ancestors 'none'/.test(cspA) && /require-trusted-types-for 'script'/.test(cspA), 'CSP: default-src none, frame-ancestors none, Trusted Types');
for (const h of ['Strict-Transport-Security', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy', 'X-Frame-Options']) {
  ok(headersFile.includes(h + ':') && htaccess.includes(h + ' '), `${h} nastaveno (_headers i .htaccess)`);
}
const htmlAll = ['index.html', '404.html'].map((f) => readFileSync(join(WEB, f), 'utf8')).join('\n');
ok(!/<script(?![^>]*(type="module" src=|type="application\/ld\+json"))/i.test(htmlAll), 'žádné inline skripty (kromě JSON-LD dat)');
ok(!/\sstyle="/i.test(htmlAll) && !/<style/i.test(htmlAll), 'žádné inline styly');
ok(!/\son[a-z]+="/i.test(htmlAll), 'žádné inline obsluhy událostí (onclick…)');
ok(!/https?:\/\/(?!www\.reznictvistiborek\.cz|schema\.org|www\.sitemaps\.org)[^"'\s]*\.(js|css)/i.test(htmlAll), 'žádné externí skripty ani styly');
ok(!/google-analytics|googletagmanager|gtag\(|fbq\(|facebook\.net|hotjar|clarity\.ms/i.test(htmlAll + readFileSync(join(WEB, 'script.js'), 'utf8')), 'žádné sledovací nástroje');

/* ------------------------------------------------------------------ */
section('Logika otevírací doby');
const site = await import(pathToFileURL(join(WEB, 'script.js')).href);
const content = JSON.parse(readFileSync(join(WEB, 'content.json'), 'utf8'));
const st = (iso, c = content) => site.statusText(site.openStatus(c, new Date(iso)));
ok(JSON.stringify(site.parseHours('07:00-12:00, 13:00-17:00')) === '[[420,720],[780,1020]]', 'parseHours: polední pauza');
ok(JSON.stringify(site.parseHours('7.00 – 17.30')) === '[[420,1050]]', 'parseHours: tečky a pomlčka');
ok(JSON.stringify(site.parseHours('zavřeno')) === '[]', 'parseHours: zavřeno');
ok(site.parseHours('od rána') === null && site.parseHours('17:00-07:00') === null && site.parseHours('25:00-26:00') === null, 'parseHours: neplatné vstupy → null');
const custom = { openingHours: { monday: '07:00-17:00', tuesday: '07:00-17:00', wednesday: '07:00-17:00', thursday: '07:00-17:00', friday: '07:00-17:00', saturday: '07:00-11:30', sunday: 'zavřeno', exceptions: [{ date: '2026-12-24', hours: '07:00-11:00' }, { date: '2026-12-25', hours: 'zavřeno' }] } };
const cases = [
  ['2026-10-05T04:59:00Z', 'Zavřeno · otevíráme dnes v 7:00', 'pondělí 6:59 (letní čas)'],
  ['2026-10-05T05:00:00Z', 'Otevřeno · do 17:00', 'pondělí 7:00'],
  ['2026-10-05T14:30:00Z', 'Otevřeno · zavíráme za 30 min', 'pondělí 16:30'],
  ['2026-10-05T15:00:00Z', 'Zavřeno · otevíráme zítra v 7:00', 'pondělí 17:00'],
  ['2026-10-10T09:29:00Z', 'Otevřeno · zavíráme za 1 min', 'sobota 11:29'],
  ['2026-10-10T09:30:00Z', 'Zavřeno · otevíráme v pondělí v 7:00', 'sobota 11:30'],
  ['2026-10-11T10:00:00Z', 'Zavřeno · otevíráme zítra v 7:00', 'neděle'],
  ['2026-11-02T06:00:00Z', 'Otevřeno · do 17:00', 'pondělí 7:00 (zimní čas)'],
  ['2026-11-02T05:59:00Z', 'Zavřeno · otevíráme dnes v 7:00', 'pondělí 6:59 (zimní čas)'],
  ['2026-12-24T11:00:00Z', 'Zavřeno · otevíráme v sobotu v 7:00', 'Štědrý den (čt) 12:00 – výjimka 7–11, 25. 12. (pá) zavřeno → sobota 26. 12.'],
  ['2026-12-24T09:30:00Z', 'Otevřeno · zavíráme za 30 min', 'Štědrý den 10:30 – výjimka 7–11'],
];
for (const [iso, expect, label] of cases) {
  const got = st(iso, custom);
  ok(got === expect, `${label}: „${expect}“`, `dostali jsme „${got}“`);
}
const tzOut = execFileSync(process.execPath, ['--input-type=module', '-e', `import('${pathToFileURL(join(WEB, 'script.js')).href}').then(m=>console.log(JSON.stringify(m.pragueParts(new Date('2026-10-05T22:30:00Z')))))`], { env: { ...process.env, TZ: 'America/Los_Angeles' } }).toString();
ok(/"d":6/.test(tzOut) && /"minutes":30/.test(tzOut), 'čas se počítá v Praze i u návštěvníka z jiného časového pásma', tzOut);

/* ------------------------------------------------------------------ */
section('Prohlížeč – hlavní stránka');
const server = await startServer(WEB, 8091);
const BASE = 'http://localhost:8091/';
const browser = await chromium.launch();

async function openPage(opts = {}, url = BASE) {
  const ctx = await browser.newContext({ locale: 'cs-CZ', timezoneId: 'Europe/Prague', ...opts });
  const page = await ctx.newPage();
  const log = { errors: [], requests: [], bytes: 0, byType: {} };
  page.on('console', (m) => {
    // stránka 404 záměrně vrací HTTP 404 – tuto hlášku prohlížeče nepočítáme jako chybu
    if (/status of 404/.test(m.text()) && /\/stranka$/.test(m.location().url || '')) return;
    if (['error', 'warning'].includes(m.type())) log.errors.push(`${m.type()}: ${m.text()} ${m.location().url || ''}`);
  });
  page.on('pageerror', (e) => log.errors.push(`pageerror: ${e.message}`));
  page.on('response', async (r) => {
    log.requests.push({ url: r.url(), status: r.status(), type: r.request().resourceType() });
    try { const b = (await r.body()).length; log.bytes += b; log.byType[r.request().resourceType()] = (log.byType[r.request().resourceType()] || 0) + b; } catch {}
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  return { ctx, page, log };
}

{
  const { ctx, page, log } = await openPage({ viewport: { width: 1280, height: 800 } });
  ok(log.errors.length === 0, 'žádné chyby v konzoli ani porušení CSP / Trusted Types', log.errors.join('\n'));
  const foreign = log.requests.filter((r) => !r.url.startsWith(BASE));
  ok(foreign.length === 0, 'žádné požadavky na cizí servery (0 třetích stran)', foreign.map((r) => r.url).join('\n'));
  const bad = log.requests.filter((r) => r.status >= 400);
  ok(bad.length === 0, 'všechny načtené soubory existují (žádné 4xx/5xx)', bad.map((r) => `${r.status} ${r.url}`).join('\n'));

  // SEO
  const seo = await page.evaluate(() => ({
    title: document.title,
    desc: document.querySelector('meta[name=description]')?.content || '',
    canonical: document.querySelector('link[rel=canonical]')?.href,
    og: ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'].every((p) => document.querySelector(`meta[property="${p}"]`)),
    tw: !!document.querySelector('meta[name="twitter:card"]'),
    lang: document.documentElement.lang,
    h1: document.querySelectorAll('h1').length,
    ld: document.getElementById('schema-localbusiness')?.textContent,
    headings: [...document.querySelectorAll('h1,h2,h3')].map((h) => Number(h.tagName[1])),
  }));
  ok(seo.title.length >= 20 && seo.title.length <= 65, `title (${seo.title.length} znaků)`, seo.title);
  ok(seo.desc.length >= 70 && seo.desc.length <= 165, `meta description (${seo.desc.length} znaků)`);
  ok(/^https:\/\//.test(seo.canonical || ''), 'canonical');
  ok(seo.og && seo.tw, 'Open Graph a Twitter/X karta');
  ok(seo.lang === 'cs', 'lang="cs"');
  ok(seo.h1 === 1, 'právě jeden nadpis h1');
  let skip = false;
  for (let i = 1; i < seo.headings.length; i++) if (seo.headings[i] > seo.headings[i - 1] + 1) skip = true;
  ok(!skip, 'hierarchie nadpisů bez přeskakování úrovní', seo.headings.join(' '));
  let ld = null;
  try { ld = JSON.parse(seo.ld); } catch {}
  ok(ld && ld['@type'] === 'Store' && ld.address && ld.telephone && ld.openingHoursSpecification?.length && ld.geo, 'Schema.org LocalBusiness (Store) s adresou, telefonem, GPS a otevírací dobou');
  ok(existsSync(join(WEB, 'sitemap.xml')) && /<loc>https:\/\//.test(readFileSync(join(WEB, 'sitemap.xml'), 'utf8')), 'sitemap.xml');
  ok(/Sitemap: https:\/\//.test(readFileSync(join(WEB, 'robots.txt'), 'utf8')), 'robots.txt odkazuje na sitemap');

  // Obrázky
  const imgs = await page.evaluate(() => [...document.images].map((i) => ({ src: i.currentSrc || i.src, alt: i.getAttribute('alt'), w: i.getAttribute('width'), h: i.getAttribute('height'), loading: i.getAttribute('loading'), top: i.getBoundingClientRect().top + scrollY, ok: i.complete && i.naturalWidth > 0, inPicture: i.parentElement.tagName === 'PICTURE' })));
  ok(imgs.every((i) => i.alt !== null), 'všechny obrázky mají atribut alt');
  ok(imgs.every((i) => i.w && i.h), 'všechny obrázky mají width a height (žádné posuny layoutu)');
  ok(imgs.filter((i) => i.top > 1200).every((i) => i.loading === 'lazy'), 'obrázky mimo první obrazovku se načítají líně (lazy)');
  ok(imgs.every((i) => i.inPicture), 'obrázky používají <picture> (AVIF / WebP / fallback)');
  ok(imgs.filter((i) => i.top < 800).every((i) => i.ok), 'obrázky v první obrazovce se načetly');
  const anyAvif = imgs.some((i) => /\.avif$/.test(i.src));
  ok(anyAvif, 'prohlížeč s podporou AVIF dostává AVIF');

  // Výkon
  const kb = (b) => Math.round(b / 1024);
  const js = statSync(join(WEB, 'script.js')).size;
  const css = statSync(join(WEB, 'styles.css')).size;
  ok(js < 40 * 1024, `JavaScript ${kb(js)} kB (limit 40 kB, nekomprimovaně)`);
  ok(css < 50 * 1024, `CSS ${kb(css)} kB (limit 50 kB, nekomprimovaně)`);
  ok(log.bytes < 400 * 1024, `celková velikost první návštěvy ${kb(log.bytes)} kB (limit 400 kB)`, JSON.stringify(log.byType));
  ok(log.requests.length <= 20, `počet požadavků: ${log.requests.length} (limit 20)`);
  const perf = await page.evaluate(() => new Promise((res) => {
    let lcp = 0; let cls = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => res({ lcp, cls }), 500);
  }));
  ok(perf.cls < 0.05, `CLS ${perf.cls.toFixed(3)} (limit 0,05)`);
  ok(perf.lcp > 0 && perf.lcp < 1500, `LCP ${Math.round(perf.lcp)} ms na lokálním serveru (limit 1500 ms)`);

  // Odkazy
  const links = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')));
  const anchors = links.filter((h) => h.startsWith('#') && h.length > 1);
  const missing = [];
  for (const a of anchors) if (!(await page.$(`[id="${a.slice(1)}"]`))) missing.push(a);
  ok(missing.length === 0, `všechny kotvy (#…) existují (${anchors.length})`, missing.join(', '));
  ok(links.filter((h) => h.startsWith('tel:')).every((h) => h === 'tel:+420556836210'), 'odkazy tel: mají správný formát');
  ok(await page.evaluate(() => document.querySelectorAll('a[href^="tel:"]').length >= 4), 'telefon je na stránce dostupný na více místech (hlavička, úvod, kontakt, patička)');
  const external = [...new Set(links.filter((h) => /^https?:/.test(h)))];
  ok(external.every((h) => h.startsWith('https://')), 'všechny externí odkazy jsou HTTPS', external.join('\n'));
  console.log('    externí odkazy (ověřeny ručně, viz report):\n      ' + external.join('\n      '));
  await ctx.close();
}

/* ------------------------------------------------------------------ */
section('Přístupnost – axe-core (WCAG 2.0/2.1/2.2 A + AA)');
for (const [scheme, w, h] of [['light', 390, 844], ['dark', 390, 844], ['light', 1440, 900], ['dark', 1440, 900]]) {
  const { ctx, page } = await openPage({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: 'reduce' });
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
  const v = res.violations.map((x) => `${x.id} (${x.impact}): ${x.help}\n  ${x.nodes.slice(0, 3).map((n) => n.target.join(' ') + ' – ' + (n.failureSummary || '').split('\n')[1]).join('\n  ')}`);
  ok(res.violations.length === 0, `${scheme} ${w}×${h}: 0 porušení (${res.passes.length} pravidel splněno)`, v.join('\n'));
  await ctx.close();
}

/* ------------------------------------------------------------------ */
section('Klávesnice, fokus, menu');
{
  const { ctx, page } = await openPage({ viewport: { width: 390, height: 844 } });
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => ({ text: document.activeElement.textContent.trim(), visible: document.activeElement.getBoundingClientRect().top >= 0 }));
  ok(first.text === 'Přeskočit na obsah' && first.visible, 'první Tab = viditelný odkaz „Přeskočit na obsah“');
  await page.keyboard.press('Enter');
  ok(await page.evaluate(() => document.activeElement.id === 'obsah'), 'odkaz přeskočí na hlavní obsah');
  const outline = await page.evaluate(() => { const a = document.querySelector('.hero .btn'); a.focus({ focusVisible: true }); const s = getComputedStyle(a); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2; });
  ok(outline, 'viditelný fokus (outline ≥ 2 px)');
  const summary = page.locator('[data-menu] summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  ok(await page.evaluate(() => document.querySelector('[data-menu]').open), 'menu se otevře klávesou Enter');
  await page.keyboard.press('Escape');
  ok(await page.evaluate(() => !document.querySelector('[data-menu]').open && document.activeElement.tagName === 'SUMMARY'), 'Esc menu zavře a vrátí fokus na tlačítko');
  await summary.click();
  await page.locator('.menu__panel a[href="#kontakt"]').click();
  await page.waitForTimeout(800);
  ok(await page.evaluate(() => !document.querySelector('[data-menu]').open && location.hash === '#kontakt'), 'klik na položku menu zavře menu a přesune na sekci');
  const targets = await page.evaluate(() => [...document.querySelectorAll('a, button, summary')].filter((el) => el.offsetParent && !el.closest('.visually-hidden') && !el.closest('p, li, dd, address, .facts')).map((el) => { const r = el.getBoundingClientRect(); return { t: el.textContent.trim().slice(0, 30), w: r.width, h: r.height }; }).filter((r) => r.w < 24 || r.h < 24));
  ok(targets.length === 0, 'ovládací prvky mají min. 24 × 24 px (WCAG 2.5.8)', JSON.stringify(targets));
  await ctx.close();
}

/* ------------------------------------------------------------------ */
section('Omezení pohybu a bez JavaScriptu');
{
  const { ctx, page } = await openPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const hidden = await page.evaluate(() => [...document.querySelectorAll('[data-reveal]')].filter((el) => getComputedStyle(el).opacity !== '1').length);
  ok(hidden === 0, 'prefers-reduced-motion: veškerý obsah je hned viditelný');
  const anim = await page.evaluate(() => getComputedStyle(document.querySelector('.hero__badge')).animationName);
  ok(anim === 'none' || anim === 'badge-in', 'prefers-reduced-motion: bez parallaxu');
  await ctx.close();
}
{
  const { ctx, page, log } = await openPage({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  const txt = await page.evaluate(() => document.body.innerText.replace(/\u00a0/g, ' '));
  ok(/556 836 210/.test(txt) && /Horní 210/.test(txt) && /7:00–17:00/.test(txt) && /Čerstvé maso/.test(txt), 'bez JS: telefon, adresa, otevírací doba i sortiment jsou zobrazeny');
  const menuLinks = await page.evaluate(() => document.querySelectorAll('[data-menu] a').length);
  ok(menuLinks >= 5, 'bez JS: mobilní menu funguje (details/summary)');
  ok(log.errors.length === 0, 'bez JS: žádné chyby', log.errors.join('\n'));
  await ctx.close();
}

/* ------------------------------------------------------------------ */
section('Stránka 404');
{
  const { ctx, page, log } = await openPage({ viewport: { width: 390, height: 844 } }, BASE + 'neexistuje/hluboko/stranka');
  const r = log.requests.find((x) => x.url.endsWith('/stranka'));
  ok(r && r.status === 404, 'neexistující adresa vrací HTTP 404');
  ok(await page.evaluate(() => /nenašli/.test(document.querySelector('h1').textContent)), '404 má vlastní stránku v designu webu');
  const bad = log.requests.filter((x) => x.status >= 400 && !x.url.endsWith('/stranka'));
  ok(bad.length === 0 && log.errors.length === 0, '404: styly, skripty i logo se načtou i v hluboké cestě', bad.map((b) => b.url).join('\n') + log.errors.join('\n'));
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  ok(await page.evaluate(() => document.activeElement.id === 'obsah' && location.pathname.endsWith('/stranka')), '404: odkaz „Přeskočit na obsah“ zůstane na stránce');
  await ctx.close();
}
server.kill();

/* ------------------------------------------------------------------ */
section('Galerie (lightbox) a živé změny content.json – dočasná kopie webu');
{
  const tmp = mkdtempSync(join(tmpdir(), 'stiborek-test-'));
  cpSync(WEB, tmp, { recursive: true });
  // testovací obrázky (jen pro test, nejsou součástí webu)
  execFileSync('python3', ['-c', `
from PIL import Image, ImageDraw
for i,c in enumerate([(160,40,40),(60,90,60),(40,60,120)]):
    im=Image.new('RGB',(2400,1600),c); d=ImageDraw.Draw(im); d.text((100,100),f'TEST {i+1}',fill=(255,255,255)); im.save(r'${tmp}/images/gallery/test-%d.jpg'%(i+1), quality=80)
`]);
  execFileSync('python3', [join(ROOT, 'tools/optimize-images.py'), join(tmp, 'images/gallery')], { stdio: 'pipe' });
  const c2 = JSON.parse(readFileSync(join(tmp, 'content.json'), 'utf8'));
  c2.gallery.items = [1, 2, 3].map((i) => ({ src: `images/gallery/test-${i}.jpg`, alt: `Testovací fotografie ${i}`, width: 1920, height: 1280, widths: [640, 1280, 1920], formats: ['avif', 'webp'], caption: i === 1 ? 'Popisek 1' : '' }));
  c2.company.phone = '+420 111 222 333';
  c2.openingHours.exceptions = [{ date: new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10), hours: '08:00-10:00', label: 'Test' }];
  writeFileSync(join(tmp, 'content.json'), JSON.stringify(c2, null, 2));
  ok(readdirSync(join(tmp, 'images/gallery')).filter((f) => /test-1-\d+\.(jpg|webp|avif)$/.test(f)).length === 9, 'optimize-images.py vytvoří 3 velikosti × 3 formáty');
  const s2 = await startServer(tmp, 8092);
  const { ctx, page, log } = await openPage({ viewport: { width: 390, height: 844 }, hasTouch: true }, 'http://localhost:8092/');
  ok(await page.evaluate(() => /111 222 333/.test(document.body.innerText.replace(/\u00a0/g, ' ')) && !/556 836 210/.test(document.body.innerText.replace(/\u00a0/g, ' '))), 'změna v content.json se projeví i bez buildu (telefon)');
  ok(await page.evaluate(() => /Mimořádná otevírací doba/.test(document.body.innerText.replace(/\u00a0/g, ' ')) && /\(Test\)/.test(document.body.innerText.replace(/\u00a0/g, ' '))), 'výjimka v otevírací době se zobrazí');
  ok(await page.evaluate(() => [...document.querySelectorAll('.nav--desktop a, .menu__panel a')].some((a) => a.getAttribute('href') === '#fotogalerie')), 's fotkami se v menu objeví „Fotogalerie“');
  const link = page.locator('[data-gallery-index="0"]');
  await link.scrollIntoViewIfNeeded();
  await link.click();
  ok(await page.evaluate(() => document.querySelector('[data-lightbox]').open), 'klik na fotku otevře lightbox');
  ok(await page.evaluate(() => document.activeElement.matches('[data-lightbox-close]')), 'fokus je na tlačítku Zavřít');
  ok(await page.evaluate(() => document.querySelector('.lightbox__counter').textContent === '1 / 3' && document.querySelector('.lightbox__img').alt === 'Testovací fotografie 1'), 'počítadlo 1 / 3 a alt text');
  await page.keyboard.press('ArrowRight');
  ok(await page.evaluate(() => document.querySelector('.lightbox__counter').textContent === '2 / 3'), 'šipka → další fotka');
  await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft');
  ok(await page.evaluate(() => document.querySelector('.lightbox__counter').textContent === '3 / 3'), 'šipka ← z první fotky přejde na poslední');
  // swipe
  const box = await page.locator('.lightbox__figure').boundingBox();
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.8, y); await page.mouse.down(); await page.mouse.move(box.x + box.width * 0.2, y, { steps: 5 }); await page.mouse.up();
  ok(await page.evaluate(() => document.querySelector('.lightbox__counter').textContent === '1 / 3'), 'swipe doleva → další fotka');
  // Tab zůstává v dialogu
  for (let i = 0; i < 5; i++) await page.keyboard.press('Tab');
  ok(await page.evaluate(() => document.querySelector('[data-lightbox]').contains(document.activeElement) || document.activeElement === document.body), 'Tab zůstává uvnitř lightboxu');
  await page.keyboard.press('Escape');
  ok(await page.evaluate(() => !document.querySelector('[data-lightbox]').open && document.activeElement.matches('[data-gallery-index]')), 'Esc zavře lightbox a vrátí fokus na fotku');
  // počkat na doběhnutí animací (axe jinak měří barvy v průběhu prolínání)
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 300) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 40)); } });
  await page.waitForTimeout(1500);
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  ok(res.violations.length === 0, 'axe: galerie bez porušení', res.violations.map((v) => v.id + ': ' + v.help + '\n  ' + v.nodes.map((n) => n.target.join(' ') + ' – ' + n.failureSummary).join('\n  ')).join('\n'));
  ok(log.errors.length === 0, 'žádné chyby v konzoli (překreslení obsahu přes Trusted Types)', log.errors.join('\n'));
  await page.screenshot({ path: join(tmp, 'gallery-test.png'), fullPage: false });
  // vadný JSON → web dál funguje s předgenerovaným obsahem
  writeFileSync(join(tmp, 'content.json'), '{ "site": { "title": "chyba" ');
  const p2 = await ctx.newPage();
  await p2.goto('http://localhost:8092/', { waitUntil: 'networkidle' });
  ok(await p2.evaluate(() => /556 836 210/.test(document.body.innerText.replace(/\u00a0/g, ' '))), 'chyba v content.json web nerozbije (zobrazí se poslední vygenerovaný obsah)');
  await ctx.close();
  s2.kill();
  console.log(`    (testovací kopie: ${tmp})`);
}

await browser.close();
console.log(`\n${failed ? '✖' : '✔'} Výsledek: ${passed} testů prošlo, ${failed} selhalo.\n`);
process.exit(failed ? 1 : 0);
