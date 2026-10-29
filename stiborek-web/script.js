/*
 * Řeznictví Stiborek a syn – skript webu
 * ---------------------------------------------------------------
 * Veškerý obsah (texty, telefon, otevírací doba, sortiment, fotky)
 * se upravuje v souboru content.json. Tento soubor běžně NEUPRAVUJTE.
 *
 * Jak to funguje:
 *  1. index.html obsahuje předgenerovaný obsah (rychlé načtení, SEO,
 *     funguje i bez JavaScriptu). Generuje ho tools/build.mjs.
 *  2. Po načtení stránky skript stáhne content.json. Pokud se od
 *     posledního buildu změnil, obsah stránky se podle něj překreslí –
 *     úprava content.json se tak na webu projeví i bez buildu.
 *  3. Skript dopočítá „Otevřeno / Zavřeno“ podle času v Praze,
 *     ovládá menu, galerii (lightbox) a jemné animace.
 *
 * Ikony: tvary podle Feather Icons (MIT License, feathericons.com).
 */

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_NAMES = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];
const DAY_SHORT = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
const DAY_IN = ['v pondělí', 'v úterý', 've středu', 've čtvrtek', 'v pátek', 'v sobotu', 'v neděli'];
const SCHEMA_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_ZONE = 'Europe/Prague';
const EXCEPTION_WINDOW_DAYS = 45;
const LOGO_BASE = 'images/brand/logo-stiborek';

/* ---------- Pomocné funkce ---------- */

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[ch]);
}

/** Povolené odkazy: https:, mailto:, tel:, kotvy (#) a relativní cesty. */
export function safeUrl(value) {
  const u = String(value ?? '').trim();
  if (!u) return '#';
  if (/^(https:|mailto:|tel:|#)/i.test(u)) return esc(u);
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return '#'; // javascript:, data:, http: …
  return esc(u);
}

export function telHref(phone) {
  return 'tel:' + String(phone ?? '').replace(/[^\d+]/g, '');
}

/** „+420 556 836 210“ → { prefix: '+420', local: '556 836 210' } */
function splitPhone(phone) {
  const m = String(phone ?? '').trim().match(/^(\+\d{3})\s*(.*)$/);
  return m ? { prefix: m[1], local: m[2] } : { prefix: '', local: String(phone ?? '') };
}

/** Telefon v textu – nezalomitelné mezery, aby se číslo nerozdělilo na dva řádky. */
const phoneHtml = (value) => esc(value).replace(/ /g, '&nbsp;');

const pad = (n) => String(n).padStart(2, '0');
const visible = (list) => (Array.isArray(list) ? list : []).filter((x) => x && x.show !== false);
const paragraphs = (text, cls = '') => (Array.isArray(text) ? text : [text])
  .filter((t) => typeof t === 'string' && t.trim())
  .map((t) => `<p${cls ? ` class="${cls}"` : ''}>${esc(t)}</p>`).join('');

/** Kontrolní součet obsahu (FNV-1a) – pozná, zda se content.json od buildu změnil. */
export function contentHash(text) {
  const s = String(text).replace(/^﻿/, '');
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/* ---------- Ikony ---------- */

const svg = (body, cls = '') => `<svg class="icon${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
export const ICON = {
  phone: svg('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>'),
  pin: svg('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'),
  clock: svg('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
  nav: svg('<path d="M3 11 22 2l-9 19-2-8-8-2z"/>'),
  arrowDown: svg('<path d="M12 5v14M19 12l-7 7-7-7"/>'),
  external: svg('<path d="M7 17 17 7M7 7h10v10"/>'),
  facebook: svg('<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>'),
  mail: svg('<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="m22 6-10 7L2 6"/>'),
  zoom: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/>'),
  up: svg('<path d="M12 19V5M5 12l7-7 7 7"/>'),
  truck: svg('<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>'),
};

/* ---------- Otevírací doba ---------- */

/** "07:00-12:00, 13:00-17:00" → [[420,720],[780,1020]]; "zavřeno" → []; chyba → null */
export function parseHours(value) {
  if (value == null) return null;
  const s = String(value).trim().toLowerCase();
  if (!s || /^(zavřeno|zavreno|closed|-|–|—)$/.test(s)) return [];
  const out = [];
  for (const part of s.split(/[,;]/)) {
    const m = part.trim().match(/^(\d{1,2})[:.](\d{2})\s*[-–—]\s*(\d{1,2})[:.](\d{2})$/);
    if (!m) return null;
    const a = Number(m[1]) * 60 + Number(m[2]);
    const b = Number(m[3]) * 60 + Number(m[4]);
    if (Number(m[2]) > 59 || Number(m[4]) > 59 || a >= b || b > 24 * 60) return null;
    out.push([a, b]);
  }
  return out.sort((x, y) => x[0] - y[0]);
}

export const fmtTime = (min) => `${Math.floor(min / 60)}:${pad(min % 60)}`;
const isoTime = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

export function fmtIntervals(intervals, raw = '') {
  if (intervals === null) return String(raw ?? '');
  if (!intervals.length) return 'Zavřeno';
  return intervals.map(([a, b]) => `${fmtTime(a)}–${fmtTime(b)}`).join(', ');
}

export function weekly(content) {
  const oh = content.openingHours || {};
  return DAYS.map((key, i) => ({
    index: i, key, name: DAY_NAMES[i], short: DAY_SHORT[i], raw: oh[key],
    intervals: parseHours(oh[key]),
  }));
}

/** Seskupí stejné po sobě jdoucí dny: [{from:'Po',to:'Pá',text:'7:00–17:00'}, …] */
export function hoursGroups(content) {
  const groups = [];
  for (const d of weekly(content)) {
    const text = fmtIntervals(d.intervals, d.raw);
    const last = groups[groups.length - 1];
    if (last && last.text === text) { last.to = d.short; last.days.push(d.index); }
    else groups.push({ from: d.short, to: d.short, text, days: [d.index], intervals: d.intervals });
  }
  return groups;
}

export function hoursSummary(content) {
  return hoursGroups(content)
    .map((g) => `${g.from === g.to ? g.from : `${g.from}–${g.to}`} ${g.text.toLowerCase() === 'zavřeno' ? 'zavřeno' : g.text}`)
    .join(' · ');
}

/** Dny, kdy je otevřeno, zkráceně: „Po–So“ */
function openDaysLabel(content) {
  const open = weekly(content).filter((d) => d.intervals && d.intervals.length).map((d) => d.index);
  if (!open.length) return '';
  const ranges = [];
  for (const i of open) {
    const r = ranges[ranges.length - 1];
    if (r && r[1] === i - 1) r[1] = i; else ranges.push([i, i]);
  }
  return ranges.map(([a, b]) => (a === b ? DAY_SHORT[a] : `${DAY_SHORT[a]}–${DAY_SHORT[b]}`)).join(', ');
}

/** Datum a čas v Praze bez ohledu na časové pásmo návštěvníka. */
export function pragueParts(date = new Date()) {
  const f = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]));
  const y = Number(p.year), m = Number(p.month), d = Number(p.day);
  return { y, m, d, dow: (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7, minutes: (Number(p.hour) % 24) * 60 + Number(p.minute) };
}

function addDays({ y, m, d }, n) {
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), dow: (t.getUTCDay() + 6) % 7 };
}

const isoDate = ({ y, m, d }) => `${y}-${pad(m)}-${pad(d)}`;

function exceptionFor(content, day) {
  const list = (content.openingHours && content.openingHours.exceptions) || [];
  return list.find((e) => e && e.date === isoDate(day));
}

function intervalsFor(content, day) {
  const ex = exceptionFor(content, day);
  if (ex) return parseHours(ex.hours);
  return parseHours((content.openingHours || {})[DAYS[day.dow]]);
}

export function openStatus(content, now = new Date()) {
  const t = pragueParts(now);
  const today = intervalsFor(content, t);
  if (today === null) return null;
  for (const [a, b] of today) {
    if (t.minutes >= a && t.minutes < b) return { open: true, closesAt: b, minutesLeft: b - t.minutes, today, dow: t.dow };
  }
  for (let i = 0; i <= 7; i++) {
    const day = i === 0 ? t : addDays(t, i);
    const iv = intervalsFor(content, day);
    if (!iv) continue;
    const next = iv.find(([a]) => i > 0 || a > t.minutes);
    if (next) return { open: false, opensAt: next[0], inDays: i, opensDow: day.dow, today, dow: t.dow };
  }
  return { open: false, today, dow: t.dow };
}

export function statusText(s, short = false) {
  if (!s) return '';
  if (s.open) {
    return s.minutesLeft <= 60
      ? `Otevřeno · zavíráme za ${s.minutesLeft} min`
      : `Otevřeno · do ${fmtTime(s.closesAt)}`;
  }
  if (s.opensAt == null) return 'Zavřeno';
  const when = s.inDays === 0 ? 'dnes' : s.inDays === 1 ? 'zítra' : DAY_IN[s.opensDow];
  // když je dnes celý den zavřeno a vedle už je napsáno „Zavřeno“, stačí kratší text
  if (short && !s.today.length) return `Otevíráme ${when} v ${fmtTime(s.opensAt)}`;
  return `Zavřeno · otevíráme ${when} v ${fmtTime(s.opensAt)}`;
}

function upcomingExceptions(content, now) {
  const t = pragueParts(now);
  const from = isoDate(t);
  const to = isoDate(addDays(t, EXCEPTION_WINDOW_DAYS));
  return ((content.openingHours && content.openingHours.exceptions) || [])
    .filter((e) => e && typeof e.date === 'string' && e.date >= from && e.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date));
}

const czDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d}. ${m}. ${y}`;
};

/* ---------- Obrázky ---------- */

/**
 * Obrázek z content.json. Stačí { "src": "...", "alt": "..." }.
 * Volitelně: width, height (poměr stran), widths: [640, 1280, 1920] a formats: ["avif","webp"]
 * – pak se použijí zmenšené varianty vytvořené nástrojem tools/optimize-images.py.
 */
function imageInfo(img) {
  const o = typeof img === 'string' ? { src: img } : (img || {});
  if (!o.src) return null;
  const src = String(o.src);
  const widths = (Array.isArray(o.widths) ? o.widths : []).map(Number).filter((n) => n > 0).sort((a, b) => a - b);
  const base = src.replace(/\.(jpe?g|png|webp|avif)$/i, '');
  const ext = ((src.match(/\.(jpe?g|png)$/i) || [])[1] || 'jpg').toLowerCase();
  const formats = Array.isArray(o.formats) ? o.formats : ['avif', 'webp'];
  return {
    src, widths, base, ext, formats,
    width: Number(o.width) || 1600, height: Number(o.height) || 1200,
    alt: o.alt ?? '', caption: o.caption ?? '',
    full: widths.length ? `${base}-${widths[widths.length - 1]}.${ext}` : src,
  };
}

export function picture(img, { sizes = '100vw', eager = false, cls = '', alt } = {}) {
  const o = imageInfo(img);
  if (!o) return '';
  const set = (fmt) => o.widths.map((w) => `${safeUrl(`${o.base}-${w}.${fmt}`)} ${w}w`).join(', ');
  let sources = '';
  let attrs = `src="${safeUrl(o.src)}"`;
  if (o.widths.length) {
    for (const fmt of o.formats) {
      if (/^(avif|webp)$/.test(fmt)) sources += `<source type="image/${fmt}" srcset="${set(fmt)}" sizes="${esc(sizes)}">`;
    }
    attrs = `src="${safeUrl(o.full)}" srcset="${set(o.ext)}" sizes="${esc(sizes)}"`;
  }
  const load = eager ? 'fetchpriority="high"' : 'loading="lazy"';
  return `<picture${cls ? ` class="${cls}"` : ''}>${sources}<img ${attrs} alt="${esc(alt ?? o.alt)}" width="${o.width}" height="${o.height}" ${load} decoding="async"></picture>`;
}

/** Logo (průhledné pozadí) ve formátech AVIF/WebP/PNG. */
export function logo({ sizes = '200px', load = 'lazy', alt = '', cls = '' } = {}) {
  const variants = [[120, 77], [240, 155], [480, 309]];
  const set = (fmt) => variants.map(([h, w]) => `${LOGO_BASE}-${h}.${fmt} ${w}w`).join(', ');
  const loading = load === 'high' ? 'fetchpriority="high"' : load === 'eager' ? '' : 'loading="lazy"';
  return `<picture${cls ? ` class="${cls}"` : ''}>`
    + `<source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">`
    + `<source type="image/webp" srcset="${set('webp')}" sizes="${sizes}">`
    + `<img src="${LOGO_BASE}-240.png" srcset="${set('png')}" sizes="${sizes}" alt="${esc(alt)}" width="309" height="480" ${loading} decoding="async"></picture>`;
}

/* ---------- Vykreslení jednotlivých částí stránky ---------- */

function addressLine(c) {
  const a = c.company.address || {};
  return `${a.street}, ${a.postalCode} ${a.city}`;
}

function statusSlot(extra = '', variant = '') {
  return `<span class="status is-pending${extra ? ' ' + extra : ''}" data-status${variant ? `="${variant}"` : ''}><span class="status__dot" aria-hidden="true"></span><span class="status__text">Otevírací doba</span></span>`;
}

const hasDelivery = (c) => Boolean(c.delivery && String(c.delivery.title || '').trim());

function navItems(c) {
  const g = c.gallery || {};
  return [
    ['#sortiment', (c.products && c.products.title) || 'Sortiment'],
    hasDelivery(c) ? ['#rozvoz', 'Rozvoz'] : null,
    ['#o-nas', (c.about && c.about.title) || 'O nás'],
    (Array.isArray(g.items) && g.items.length) ? ['#fotogalerie', g.title || 'Fotogalerie'] : null,
    ['#oteviraci-doba', (c.visit && c.visit.hoursTitle) || 'Otevírací doba'],
    ['#kde-nas-najdete', (c.visit && c.visit.locationTitle) || 'Kde nás najdete'],
    ['#kontakt', (c.contact && c.contact.title) || 'Kontakt'],
  ].filter(Boolean).map(([href, label]) => `<li><a href="${href}">${esc(label)}</a></li>`).join('');
}

const regions = {
  'header-brand'(c) {
    const co = c.company;
    return `<a class="brand" href="./#top">${logo({ sizes: '31px', load: 'eager' })}<span class="brand__text"><span class="brand__name">${esc(co.shortName || co.name)}</span><span class="brand__trade">${esc(co.trade)}</span></span></a>`;
  },

  'nav-desktop'(c) {
    return `<ul>${navItems(c)}</ul>`;
  },

  'nav-mobile'(c) {
    return `<ul class="container">${navItems(c)}</ul>`;
  },

  announcement(c) {
    const a = c.announcement || {};
    if (!a.text || !String(a.text).trim()) return '';
    const text = esc(a.text);
    return `<div class="announcement"><p class="container">${a.link ? `<a href="${safeUrl(a.link)}">${text}</a>` : text}</p></div>`;
  },

  'header-phone'(c) {
    const p = splitPhone(c.company.phone);
    return `<a class="btn btn--primary btn--sm header__call" href="${telHref(c.company.phone)}">${ICON.phone}<span class="visually-hidden">Zavolat:&nbsp;</span><span class="header__call-text">${phoneHtml(p.local)}</span></a>`;
  },

  hero(c) {
    const h = c.hero || {};
    const title = esc(h.title);
    const hl = h.titleHighlight && String(h.title).includes(h.titleHighlight)
      ? title.replace(esc(h.titleHighlight), () => `<span class="hero__title-main">${esc(h.titleHighlight)}</span>`)
      : `<span class="hero__title-main">${title}</span>`;
    const first = h.titleHighlight ? hl.replace(/^([^<]+)</, (m, pre) => `<span class="hero__title-pre">${pre}</span><`) : hl;
    const photo = h.image ? picture(h.image, { sizes: '(min-width: 64em) 44vw, 100vw', eager: true, cls: 'hero__photo' }) : '';
    const cta = (b, cls, icon) => (b && b.label ? `<a class="btn ${cls}" href="${safeUrl(b.href)}">${esc(b.label)}${icon}</a>` : '');
    return `<div class="container hero__inner">
  <div class="hero__text">
    <p class="eyebrow hero__eyebrow">${esc(h.eyebrow)}</p>
    <h1 class="hero__title" id="hero-title">${first}</h1>
    <p class="hero__subtitle">${esc(h.subtitle)}</p>
    <div class="hero__actions">${cta(h.primaryCta, 'btn--primary btn--lg', ICON.arrowDown)}${cta(h.secondaryCta, 'btn--ghost btn--lg', ICON.pin)}</div>
  </div>
  ${regions.quick(c)}
  <div class="hero__visual${photo ? ' has-photo' : ''}">
    ${photo}
    <div class="hero__badge">${logo({ sizes: '(min-width: 56em) 300px, 240px', load: photo ? 'eager' : 'high', alt: 'Logo: Miroslav Stiborek & syn – řeznictví a uzenářství' })}</div>
  </div>
</div>`;
  },

  quick(c) {
    const p = splitPhone(c.company.phone);
    return `<ul class="quick">
  <li class="quick__item">${ICON.pin}<span class="quick__body"><span class="quick__label">Adresa</span><a class="quick__value" href="#kde-nas-najdete">${esc(c.company.address.street)}, ${esc(c.company.address.city)}</a></span></li>
  <li class="quick__item">${ICON.clock}<span class="quick__body"><span class="quick__label" data-today-label>Otevírací doba</span><span class="quick__value" data-today-hours>${esc(hoursSummary(c))}</span>${statusSlot('status--inline', 'short')}</span></li>
  <li class="quick__item">${ICON.phone}<span class="quick__body"><span class="quick__label">Telefon</span><a class="quick__value" href="${telHref(c.company.phone)}">${phoneHtml(`${p.prefix} ${p.local}`.trim())}</a></span></li>
</ul>`;
  },

  intro(c) {
    const i = c.intro || {};
    return `<div class="container intro__inner" data-reveal>
  <h2 class="intro__title" id="intro-title">${esc(i.title)}</h2>
  <div class="intro__text">${paragraphs(i.text)}</div>
</div>`;
  },

  products(c) {
    const p = c.products || {};
    const items = visible(p.items);
    const cards = items.map((it, n) => {
      const img = it.image ? picture(it.image, { sizes: '(min-width: 64em) 30vw, (min-width: 40em) 45vw, 100vw', cls: 'product__media', alt: (it.image && it.image.alt) || '' }) : '';
      return `<li class="product${img ? ' has-image' : ''}" data-reveal>
    ${img}
    <div class="product__body">
      <span class="product__num" aria-hidden="true">${pad(n + 1)}</span>
      <h3 class="product__name">${esc(it.name)}</h3>
      ${it.description ? `<p class="product__desc">${esc(it.description)}</p>` : ''}
    </div>
  </li>`;
    }).join('\n  ');
    return `<div class="container split">
  <header class="split__head" data-reveal>
    <p class="eyebrow">${esc(p.title)}</p>
    <h2 id="sortiment-title" class="section-title">${esc(p.lead)}</h2>
    ${p.note ? `<p class="split__note">${esc(p.note)}</p>` : ''}
    <a class="link-arrow" href="${telHref(c.company.phone)}">${ICON.phone}Zeptat se po telefonu</a>
  </header>
  <ol class="products" aria-labelledby="sortiment-title">
  ${cards}
  </ol>
</div>`;
  },

  delivery(c) {
    if (!hasDelivery(c)) return '';
    const d = c.delivery;
    const terms = (Array.isArray(d.terms) ? d.terms : [])
      .filter((t) => t && t.label && t.value)
      .map((t) => `<div class="delivery__term"><dt>${esc(t.label)}</dt><dd>${esc(t.value)}</dd></div>`).join('');
    return `<div class="container">
  <article class="card delivery__card" aria-labelledby="rozvoz-title" data-reveal>
    <div class="delivery__intro">
      <p class="eyebrow">${ICON.truck}${esc(d.title)}</p>
      <h2 id="rozvoz-title" class="card__title">${esc(d.lead || d.title)}</h2>
      ${d.text ? `<p class="delivery__text">${esc(d.text)}</p>` : ''}
      ${d.cta ? `<a class="btn btn--primary delivery__call" href="${telHref(c.company.phone)}">${ICON.phone}${esc(d.cta)}</a>` : ''}
    </div>
    ${terms ? `<dl class="delivery__terms">${terms}</dl>` : ''}
  </article>
</div>`;
  },

  about(c) {
    const a = c.about || {};
    const days = openDaysLabel(c);
    const facts = [
      ['Obor', c.company.trade],
      ['Prodejna', addressLine(c)],
      days ? ['Otevřeno', days] : null,
    ].filter(Boolean).map(([k, v]) => `<div class="facts__row"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
    const media = a.image
      ? picture(a.image, { sizes: '(min-width: 64em) 40vw, 100vw', cls: 'about__photo' })
      : `<div class="about__badge">${logo({ sizes: '(min-width: 56em) 260px, 160px', alt: 'Logo Řeznictví Stiborek a syn' })}</div>`;
    return `<div class="container about__inner">
  <div class="about__media" data-reveal>${media}</div>
  <div class="about__body" data-reveal>
    <p class="eyebrow">${esc(a.title)}</p>
    <h2 id="o-nas-title" class="section-title">${esc(a.lead)}</h2>
    ${paragraphs(a.text, 'about__text')}
    ${paragraphs(a.story, 'about__text')}
    <dl class="facts">${facts}</dl>
  </div>
</div>`;
  },

  gallery(c) {
    const g = c.gallery || {};
    const items = (Array.isArray(g.items) ? g.items : []).map(imageInfo).filter(Boolean);
    const head = `<header class="gallery__head" data-reveal>
    <p class="eyebrow">${esc(g.title)}</p>
    <h2 id="fotogalerie-title" class="section-title">${esc(g.lead)}</h2>
  </header>`;
    if (!items.length) {
      const fb = c.company.facebook;
      return `<div class="container">
  ${head}
  <div class="gallery-empty" data-reveal>
    <p class="gallery-empty__text">${esc(g.emptyText)}</p>
    ${fb ? `<a class="btn btn--primary" href="${safeUrl(fb)}">${ICON.facebook}Facebook – ${esc(c.company.name)}</a>` : ''}
  </div>
</div>`;
    }
    const tiles = items.map((o, i) => `<li class="gallery__item" data-reveal>
    <a class="gallery__link" href="${safeUrl(o.full)}" data-gallery-index="${i}" data-full="${safeUrl(o.full)}" data-w="${o.width}" data-h="${o.height}" data-caption="${esc(o.caption)}" data-alt="${esc(o.alt)}">
      ${picture(items[i], { sizes: '(min-width: 64em) 33vw, (min-width: 40em) 50vw, 100vw', cls: 'gallery__media' })}
      <span class="gallery__zoom">${ICON.zoom}<span class="visually-hidden">Zvětšit fotografii</span></span>
    </a>
    ${o.caption ? `<p class="gallery__caption">${esc(o.caption)}</p>` : ''}
  </li>`).join('\n  ');
    return `<div class="container">
  ${head}
  <ul class="gallery" aria-labelledby="fotogalerie-title">
  ${tiles}
  </ul>
</div>`;
  },

  visit(c, now) {
    const v = c.visit || {};
    const oh = c.openingHours || {};
    const rows = weekly(c).map((d) => `<tr data-day="${d.index}"><th scope="row">${d.name}</th><td>${esc(fmtIntervals(d.intervals, d.raw))}</td></tr>`).join('');
    const ex = upcomingExceptions(c, now);
    const exHtml = ex.length
      ? `<div class="hours__exceptions"><h3 class="hours__ex-title">Mimořádná otevírací doba</h3><ul>${ex.map((e) => `<li><span>${esc(czDate(e.date))}${e.label ? ` (${esc(e.label)})` : ''}</span><span>${esc(fmtIntervals(parseHours(e.hours), e.hours))}</span></li>`).join('')}</ul></div>`
      : '';
    const m = c.company.maps || {};
    const g = c.company.geo || {};
    const a = c.company.address;
    return `<div class="container visit__grid">
  <article class="card card--hours" id="oteviraci-doba" aria-labelledby="hours-title" data-reveal>
    <header class="card__head">
      <p class="eyebrow">${ICON.clock}Kdy máme otevřeno</p>
      <h2 id="hours-title" class="card__title">${esc(v.hoursTitle)}</h2>
      ${statusSlot('status--lg')}
    </header>
    <table class="hours">
      <caption class="visually-hidden">Otevírací doba prodejny podle dnů v týdnu</caption>
      <tbody>${rows}</tbody>
    </table>
    ${exHtml}
    ${oh.note ? `<p class="hours__note">${esc(oh.note)}</p>` : ''}
  </article>
  <article class="card card--location" id="kde-nas-najdete" aria-labelledby="location-title" data-reveal>
    <header class="card__head">
      <p class="eyebrow">${ICON.pin}Adresa prodejny</p>
      <h2 id="location-title" class="card__title">${esc(v.locationTitle)}</h2>
    </header>
    <address class="location__address"><span class="location__street">${esc(a.street)}</span><span>${esc(a.postalCode)} ${esc(a.city)}</span></address>
    ${v.locationText ? `<p class="location__text">${esc(v.locationText)}</p>` : ''}
    <div class="location__actions">
      ${m.navigate ? `<a class="btn btn--primary" href="${safeUrl(m.navigate)}">${ICON.nav}Navigovat k nám</a>` : ''}
      ${m.google ? `<a class="btn btn--ghost" href="${safeUrl(m.google)}">Google Mapy${ICON.external}</a>` : ''}
    </div>
    ${m.mapyCz ? `<a class="link-arrow location__map" href="${safeUrl(m.mapyCz)}">Zobrazit na Mapy.com${ICON.external}</a>` : ''}
    ${g.lat && g.lng ? `<p class="location__geo">GPS ${Number(g.lat).toFixed(5)}° N, ${Number(g.lng).toFixed(5)}° E</p>` : ''}
  </article>
</div>`;
  },

  contact(c) {
    const k = c.contact || {};
    const co = c.company;
    const p = splitPhone(co.phone);
    const list = [
      `<li>${ICON.pin}<a href="#kde-nas-najdete">${esc(addressLine(c))}</a></li>`,
      co.email ? `<li>${ICON.mail}<a href="mailto:${esc(co.email)}">${esc(co.email)}</a></li>` : '',
      co.facebook ? `<li>${ICON.facebook}<a href="${safeUrl(co.facebook)}">Facebook – ${esc(co.name)}</a></li>` : '',
      co.instagram ? `<li>${ICON.external}<a href="${safeUrl(co.instagram)}">Instagram</a></li>` : '',
    ].join('');
    return `<div class="container contact__inner" data-reveal>
  <p class="eyebrow">${esc(k.title)}</p>
  <h2 id="kontakt-title" class="section-title contact__title">${esc(k.lead)}</h2>
  <p class="contact__phone">${p.prefix ? `<span class="contact__prefix">${esc(p.prefix)}</span> ` : ''}<a class="contact__number" href="${telHref(co.phone)}">${phoneHtml(p.local)}</a></p>
  ${k.text ? `<p class="contact__text">${esc(k.text)}</p>` : ''}
  <ul class="contact__list">${list}</ul>
</div>`;
  },

  footer(c) {
    const co = c.company;
    const updated = c.site && c.site.lastUpdated ? czDate(c.site.lastUpdated) : '';
    return `<div class="container footer__inner">
  <div class="footer__brand">
    ${logo({ sizes: '47px', cls: 'footer__logo' })}
    <p class="footer__name">${esc(co.name)}</p>
    <p>${esc(co.trade)}<br>${esc(addressLine(c))}</p>
    <p><a href="${telHref(co.phone)}">${phoneHtml(co.phone)}</a></p>
  </div>
  <div class="footer__legal">
    <h2 class="footer__heading">Provozovatel</h2>
    <p>${esc(co.legalName)}<br>IČO ${esc(co.ico)}${co.dic ? ` · DIČ ${esc(co.dic)}` : ''}<br>Sídlo: ${esc(addressLine(c))}</p>
    ${co.registry ? `<p class="footer__small">${esc(co.registry)}</p>` : ''}
  </div>
  <div class="footer__meta">
    <h2 class="footer__heading">Soukromí</h2>
    <p class="footer__small">${esc((c.footer && c.footer.privacy) || '')}</p>
    ${updated ? `<p class="footer__small">Údaje aktualizovány ${esc(updated)}</p>` : ''}
    <a class="link-arrow footer__top" href="#top">${ICON.up}Zpět nahoru</a>
  </div>
</div>`;
  },

  actionbar(c) {
    const m = c.company.maps || {};
    return `<a class="actionbar__btn actionbar__btn--call" href="${telHref(c.company.phone)}">${ICON.phone}Zavolat</a>${m.navigate ? `<a class="actionbar__btn" href="${safeUrl(m.navigate)}">${ICON.nav}Navigovat</a>` : ''}`;
  },

  'notfound-contact'(c) {
    return `<p>Pokud hledáte otevírací dobu nebo kontakt, najdete je na <a href="./#oteviraci-doba">úvodní stránce</a>, případně nám zavolejte na <a href="${telHref(c.company.phone)}">${phoneHtml(c.company.phone)}</a>.</p>`;
  },
};

export const REGION_NAMES = Object.keys(regions);

/** Relativní cesty → od kořene webu (stránka 404 se zobrazuje na libovolné adrese). */
export function absolutize(html) {
  const fix = (u) => (/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(u) ? u : `/${u.replace(/^\.\//, '')}`);
  return html
    .replace(/(\s(?:src|href)=")([^"]*)"/gi, (m, a, u) => `${a}${fix(u)}"`)
    .replace(/(\ssrcset=")([^"]*)"/gi, (m, a, list) => `${a}${list.split(',').map((c) => c.trim()).map((c) => fix(c)).join(', ')}"`);
}

export function renderRegion(name, content, now = new Date()) {
  const fn = regions[name];
  return fn ? fn(content, now) : '';
}

/* ---------- Strukturovaná data (Schema.org) ---------- */

export function jsonLd(c) {
  const co = c.company;
  const base = (c.site && c.site.url) || '/';
  const abs = (p) => new URL(p, base).href;
  const spec = [];
  for (const g of hoursGroups(c)) {
    if (!g.intervals || !g.intervals.length) continue;
    for (const [a, b] of g.intervals) {
      spec.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: g.days.map((d) => SCHEMA_DAYS[d]), opens: isoTime(a), closes: isoTime(b) });
    }
  }
  const special = ((c.openingHours && c.openingHours.exceptions) || []).filter((e) => e && e.date).map((e) => {
    const iv = parseHours(e.hours) || [];
    return iv.length
      ? iv.map(([a, b]) => ({ '@type': 'OpeningHoursSpecification', validFrom: e.date, validThrough: e.date, opens: isoTime(a), closes: isoTime(b) }))
      : [{ '@type': 'OpeningHoursSpecification', validFrom: e.date, validThrough: e.date, opens: '00:00', closes: '00:00' }];
  }).flat();
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${base}#prodejna`,
    name: co.name,
    legalName: co.legalName,
    description: c.site && c.site.description,
    url: base,
    telephone: String(co.phone).replace(/\s+/g, ''),
    image: abs((c.site && c.site.ogImage) || `${LOGO_BASE}-480.png`),
    logo: abs(`${LOGO_BASE}-480.png`),
    address: {
      '@type': 'PostalAddress',
      streetAddress: co.address.street,
      postalCode: co.address.postalCode,
      addressLocality: co.address.city,
      addressCountry: co.address.country || 'CZ',
    },
    openingHoursSpecification: spec,
    vatID: co.dic || undefined,
    identifier: co.ico ? { '@type': 'PropertyValue', propertyID: 'IČO', value: co.ico } : undefined,
    sameAs: [co.facebook, co.instagram].filter(Boolean),
  };
  if (co.geo && co.geo.lat && co.geo.lng) data.geo = { '@type': 'GeoCoordinates', latitude: co.geo.lat, longitude: co.geo.lng };
  if (co.maps && co.maps.mapyCz) data.hasMap = co.maps.mapyCz;
  if (co.email) data.email = co.email;
  if (Array.isArray(co.awards) && co.awards.length) data.award = co.awards.map(String);
  if (Array.isArray(co.areaServed) && co.areaServed.length) data.areaServed = co.areaServed.map((name) => ({ '@type': 'City', name: String(name) }));
  if (special.length) data.specialOpeningHoursSpecification = special;
  return JSON.stringify(data, null, 2).replace(/</g, '\\u003c');
}

/* =================================================================
 * Prohlížeč
 * ================================================================= */

let policy = null;
function setHTML(el, html) {
  if (!policy && typeof window !== 'undefined' && window.trustedTypes) {
    // Veškeré HTML vzniká v tomto souboru z escapovaných hodnot (funkce esc/safeUrl).
    policy = window.trustedTypes.createPolicy('stiborek', { createHTML: (s) => s, createScript: (s) => s });
  }
  el.innerHTML = policy ? policy.createHTML(html) : html;
}

function setScriptText(el, text) {
  el.textContent = policy ? policy.createScript(text) : text;
}

function renderAll(content) {
  const now = new Date();
  const is404 = document.body.dataset.page === '404';
  document.querySelectorAll('[data-region]').forEach((el) => {
    const html = renderRegion(el.dataset.region, content, now);
    setHTML(el, is404 ? absolutize(html) : html);
    if (el.dataset.region === 'announcement' || el.dataset.region === 'gallery') el.hidden = false;
  });
  const ld = document.getElementById('schema-localbusiness');
  if (ld) setScriptText(ld, jsonLd(content));
  if (content.site) {
    if (content.site.title && document.body.dataset.page === 'home') document.title = content.site.title;
    const d = document.querySelector('meta[name="description"]');
    if (d && content.site.description && document.body.dataset.page === 'home') d.setAttribute('content', content.site.description);
  }
}

/* Otevřeno / zavřeno + zvýraznění dnešního dne */
function setupStatus(content) {
  const update = () => {
    const s = openStatus(content);
    document.querySelectorAll('[data-status]').forEach((el) => {
      if (!s) { el.hidden = true; return; }
      el.classList.remove('is-pending');
      el.classList.toggle('is-open', s.open);
      el.classList.toggle('is-closed', !s.open);
      el.querySelector('.status__text').textContent = statusText(s, el.dataset.status === 'short');
    });
    if (!s) return;
    const label = document.querySelector('[data-today-label]');
    const val = document.querySelector('[data-today-hours]');
    if (label && val) {
      label.textContent = `Dnes, ${DAY_NAMES[s.dow].toLowerCase()}`;
      val.textContent = fmtIntervals(s.today);
    }
    document.querySelectorAll('.hours tr[data-day]').forEach((tr) => {
      const today = Number(tr.dataset.day) === s.dow;
      tr.classList.toggle('is-today', today);
      if (today) tr.setAttribute('aria-current', 'date'); else tr.removeAttribute('aria-current');
    });
  };
  update();
  // přepočítat vždy na začátku další minuty
  const tick = () => { update(); setTimeout(tick, 60000 - (Date.now() % 60000) + 50); };
  setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
}

/* Mobilní menu (<details>) – zavření po výběru odkazu, klávesou Esc a klikem mimo */
function setupMenu() {
  const menu = document.querySelector('[data-menu]');
  if (!menu) return;
  const summary = menu.querySelector('summary');
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) menu.open = false; });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.open) { menu.open = false; summary.focus(); }
  });
  document.addEventListener('click', (e) => { if (menu.open && !menu.contains(e.target)) menu.open = false; });
  const mq = window.matchMedia('(min-width: 70em)');
  mq.addEventListener('change', () => { if (mq.matches) menu.open = false; });
}

/* Hlavička – stín po odscrollování; spodní lišta po opuštění úvodu */
function setupScrollState() {
  const header = document.querySelector('.header');
  const sentinel = document.querySelector('[data-scroll-sentinel]');
  const hero = document.querySelector('.hero');
  const bar = document.querySelector('[data-actionbar]');
  if (!('IntersectionObserver' in window)) return;
  if (header && sentinel) {
    new IntersectionObserver(([e]) => header.classList.toggle('is-scrolled', !e.isIntersecting)).observe(sentinel);
  }
  if (bar && hero) {
    bar.classList.add('is-managed');
    new IntersectionObserver(([e]) => bar.classList.toggle('is-visible', !e.isIntersecting), { rootMargin: '0px 0px -40% 0px' }).observe(hero);
  }
}

/* Postupné zobrazení obsahu při scrollování (jen pokud uživatel nepreferuje omezení pohybu) */
function setupReveal() {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const els = [...document.querySelectorAll('[data-reveal]')];
  if (reduce || !('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-visible')); return; }
  const vh = window.innerHeight;
  els.forEach((el) => { if (el.getBoundingClientRect().top < vh) el.classList.add('is-visible'); });
  root.classList.add('motion-ok');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });
  els.filter((el) => !el.classList.contains('is-visible')).forEach((el) => io.observe(el));
  // pojistka: tisk / přeskočení – zobrazit vše
  window.addEventListener('beforeprint', () => els.forEach((el) => el.classList.add('is-visible')));
}

/* Galerie – přístupný lightbox: Esc, šipky, swipe, fokus */
function setupGallery() {
  const dialog = document.querySelector('[data-lightbox]');
  const links = [...document.querySelectorAll('[data-gallery-index]')];
  if (!dialog || !links.length || typeof dialog.showModal !== 'function') return;
  const figure = dialog.querySelector('.lightbox__figure');
  const caption = dialog.querySelector('.lightbox__caption');
  const counter = dialog.querySelector('.lightbox__counter');
  const prev = dialog.querySelector('[data-lightbox-prev]');
  const next = dialog.querySelector('[data-lightbox-next]');
  const close = dialog.querySelector('[data-lightbox-close]');
  let index = 0;
  let opener = null;

  const preload = (i) => { const l = links[(i + links.length) % links.length]; const im = new Image(); im.src = l.dataset.full; };
  const show = (i) => {
    index = (i + links.length) % links.length;
    const l = links[index];
    const img = document.createElement('img');
    img.className = 'lightbox__img';
    img.src = l.dataset.full;
    img.alt = l.dataset.alt || '';
    img.width = Number(l.dataset.w) || 1600;
    img.height = Number(l.dataset.h) || 1200;
    img.decoding = 'async';
    figure.querySelector('.lightbox__img')?.remove();
    figure.prepend(img);
    caption.textContent = l.dataset.caption || '';
    caption.hidden = !l.dataset.caption;
    counter.textContent = `${index + 1} / ${links.length}`;
    const single = links.length < 2;
    prev.hidden = single; next.hidden = single;
    if (!single) { preload(index + 1); preload(index - 1); }
  };

  links.forEach((l, i) => l.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    opener = l;
    show(i);
    dialog.showModal();
    document.documentElement.classList.add('has-modal');
    close.focus();
  }));
  prev.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('has-modal');
    if (opener) opener.focus();
  });
  // klik na tmavé pozadí zavře
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
  });
  // swipe na dotykových zařízeních
  let startX = null; let startY = null;
  figure.addEventListener('pointerdown', (e) => { startX = e.clientX; startY = e.clientY; });
  figure.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX; const dy = e.clientY - startY;
    startX = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(index + (dx < 0 ? 1 : -1));
  });
  figure.addEventListener('pointercancel', () => { startX = null; });
}

async function init() {
  const root = document.documentElement;
  root.classList.add('js');
  setupMenu();
  setupScrollState();
  let content = null;
  try {
    const res = await fetch(new URL('content.json', import.meta.url), { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    content = JSON.parse(text.replace(/^﻿/, ''));
    if (contentHash(text) !== root.dataset.contentHash) renderAll(content);
  } catch (err) {
    console.warn('[web] content.json se nepodařilo načíst nebo obsahuje chybu – zobrazuje se poslední vygenerovaný obsah.', err);
  }
  if (content) setupStatus(content);
  setupReveal();
  setupGallery();
}

if (typeof document !== 'undefined') init();
