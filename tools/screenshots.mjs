#!/usr/bin/env node
/**
 * Snímky obrazovky ve všech testovaných rozlišeních + kontrola konzole,
 * CSP, chybějících souborů a vodorovného přetečení.
 *   node tools/screenshots.mjs http://localhost:8080/ výstupní-složka [light|dark] [reduce]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:8080/';
const OUT = process.argv[3] || 'screenshots';
const SCHEME = process.argv[4] || 'light';
const MOTION = process.argv[5] === 'reduce' ? 'reduce' : 'no-preference';
const VIEWPORTS = [[320, 568], [375, 812], [390, 844], [414, 896], [768, 1024], [1024, 768], [1280, 720], [1440, 900], [1920, 1080]];
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
let problems = 0;
for (const [w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: SCHEME, reducedMotion: MOTION, locale: 'cs-CZ', timezoneId: 'Europe/Prague', deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const issues = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) issues.push(`console.${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => issues.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => issues.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('/nenalezeno')) issues.push(`HTTP ${r.status()}: ${r.url()}`); });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  // projet stránku, aby se spustily animace při scrollování
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo({ top: 0, behavior: 'instant' }); });
  await page.waitForTimeout(1200);
  const overflow = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const wide = [...document.querySelectorAll('body *')].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > vw + 1 || r.left < -1) && getComputedStyle(el).position !== 'fixed'; })
      .filter((el) => !el.closest('.hero::before'))
      .slice(0, 5).map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} right=${Math.round(el.getBoundingClientRect().right)}`);
    return { scrollW: document.documentElement.scrollWidth, vw, wide };
  });
  if (overflow.scrollW > overflow.vw) issues.push(`horizontal overflow: scrollWidth ${overflow.scrollW} > ${overflow.vw} ${overflow.wide.join(', ')}`);
  await page.screenshot({ path: `${OUT}/${w}x${h}-${SCHEME}-top.png` });
  await page.screenshot({ path: `${OUT}/${w}x${h}-${SCHEME}-full.png`, fullPage: true });
  console.log(`${w}x${h} ${SCHEME}: ${issues.length ? issues.length + ' problémů' : 'OK'}`);
  issues.forEach((i) => console.log('   ' + i));
  problems += issues.length;
  await ctx.close();
}
await browser.close();
process.exit(problems ? 1 : 0);
