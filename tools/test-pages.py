#!/usr/bin/env python3
"""
Kontrola kopie webu pro GitHub Pages (výstup `node tools/build.mjs --out ...`).

    python3 tools/test-pages.py _site https://liberdamarek-del.github.io/stiborek-a-syn/

Web se spustí na lokálním serveru, který se chová jako GitHub Pages
(web v podsložce, neexistující adresa → 404.html se stavem 404, žádné vlastní
hlavičky), a otevře se v Chromiu v mobilním rozlišení. Ověří se, že se načte
úvodní stránka i stránka 404 se styly, logem a skriptem, bez chyb v konzoli,
bez porušení CSP a bez nefunkčních odkazů na soubory webu.

Vyžaduje: pip install playwright  &&  python3 -m playwright install chromium
"""
import mimetypes
import re
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

from playwright.sync_api import sync_playwright

if len(sys.argv) != 3:
    sys.exit(__doc__)

SITE = Path(sys.argv[1]).resolve()
PUBLIC = sys.argv[2]
PREFIX = urlsplit(PUBLIC).path  # např. /stiborek-a-syn/
if not PREFIX.endswith("/"):
    sys.exit("Adresa webu musí končit lomítkem.")

for ext, typ in {
    ".webmanifest": "application/manifest+json",
    ".avif": "image/avif",
    ".webp": "image/webp",
    ".woff2": "font/woff2",
    ".json": "application/json",
}.items():
    mimetypes.add_type(typ, ext)

passed = failed = 0


def ok(cond, name, detail=""):
    global passed, failed
    if cond:
        passed += 1
        print(f"  ✔ {name}")
    else:
        failed += 1
        print(f"  ✖ {name}" + (f"\n      {detail}" if detail else ""))


def section(title):
    print(f"\n■ {title}")


class PagesLikeHandler(BaseHTTPRequestHandler):
    """Stejné chování jako GitHub Pages pro projektový web v podsložce."""

    def log_message(self, *args):
        pass

    def do_GET(self):
        self.serve(send_body=True)

    def do_HEAD(self):
        self.serve(send_body=False)

    def serve(self, send_body):
        path = unquote(urlsplit(self.path).path)
        if path == PREFIX.rstrip("/"):
            self.send_response(301)
            self.send_header("Location", PREFIX)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        target = None
        if path.startswith(PREFIX):
            candidate = (SITE / path[len(PREFIX):]).resolve()
            if candidate.is_dir():
                candidate = candidate / "index.html"
            if candidate.is_file() and SITE in candidate.parents:
                target = candidate
        status = 200
        if target is None:
            status, target = 404, SITE / "404.html"
        body = target.read_bytes()
        self.send_response(status)
        self.send_header("Content-Type", mimetypes.guess_type(target.name)[0] or "application/octet-stream")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if send_body:
            self.wfile.write(body)


# ---------------------------------------------------------------------------
section("Soubory v kopii webu")
for name in ("index.html", "404.html", "styles.css", "script.js", "content.json", "manifest.webmanifest"):
    ok((SITE / name).is_file(), f"{name} existuje")
internal = [p for p in SITE.rglob("*") if p.name.startswith(".") or p.name in ("README.md", "_headers") or p.name == "security"]
ok(not internal, "žádné interní soubory (README, _headers, .htaccess, security/, skryté soubory)",
   ", ".join(str(p.relative_to(SITE)) for p in internal))

html = {name: (SITE / name).read_text(encoding="utf-8") for name in ("index.html", "404.html")}
for name, text in html.items():
    urls = re.findall(r'\s(?:src|href)="([^"]*)"', text)
    urls += [u.strip().split(" ")[0] for s in re.findall(r'\ssrcset="([^"]*)"', text) for u in s.split(",")]
    outside = [u for u in urls if u.startswith("/") and not u.startswith("//") and not u.startswith(PREFIX)]
    ok(not outside, f"{name}: všechny cesty od kořene vedou do {PREFIX}", ", ".join(sorted(set(outside))))
    ok('http-equiv="Content-Security-Policy"' in text and "frame-ancestors" not in text, f"{name}: CSP jako <meta> (bez frame-ancestors)")
ok(f'<link rel="canonical" href="{PUBLIC}">' in html["index.html"], f"kanonická adresa je {PUBLIC}")
og = re.search(r'<meta property="og:image" content="([^"]+)"', html["index.html"])
ok(og and og.group(1).startswith(PUBLIC) and (SITE / og.group(1)[len(PUBLIC):]).is_file(),
   "náhledový obrázek pro sdílení odkazu (og:image) existuje na adrese webu", og and og.group(1))

# ---------------------------------------------------------------------------
server = ThreadingHTTPServer(("localhost", 0), PagesLikeHandler)
threading.Thread(target=server.serve_forever, daemon=True).start()
ORIGIN = f"http://localhost:{server.server_address[1]}"


def visit(browser, url, expected_status, label):
    section(label)
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    errors, broken = [], []
    # Stav 404 samotné stránky 404 hlásí Chromium do konzole – to je očekávané, ne chyba.
    page.on("console", lambda m: m.type == "error" and not (m.location.get("url") == url and expected_status == 404) and errors.append(m.text))
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("requestfailed", lambda r: broken.append(f"{r.url} ({r.failure})"))
    page.on("response", lambda r: r.url.startswith(ORIGIN) and r.url != url and r.status >= 400 and broken.append(f"{r.url} → {r.status}"))
    response = page.goto(url, wait_until="networkidle")
    ok(response.status == expected_status, f"stav odpovědi {expected_status}", f"vráceno {response.status}")
    ok(not errors, "žádné chyby v konzoli ani porušení CSP", "\n      ".join(errors))
    ok(not broken, "všechny soubory webu se načetly", "\n      ".join(broken))
    ok(page.evaluate("document.documentElement.classList.contains('js')"), "skript se spustil")
    rules = page.evaluate("""() => [...document.styleSheets]
        .filter(s => s.href && s.href.includes('styles.css'))
        .reduce((n, s) => n + s.cssRules.length, 0)""")
    ok(rules > 50, "styly se načetly", f"{rules} pravidel")
    logos = page.evaluate("""() => [...document.images]
        .filter(i => i.currentSrc.includes('logo-stiborek'))
        .map(i => i.complete && i.naturalWidth > 0)""")
    ok(logos and all(logos), "logo se zobrazilo", str(logos))
    page.wait_for_function("document.fonts.status === 'loaded'")
    fonts_ok = page.evaluate("[...document.fonts].filter(f => f.family.includes('Fraunces')).some(f => f.status === 'loaded')")
    ok(fonts_ok, "písmo Fraunces se načetlo")
    home = page.evaluate("""() => [...document.querySelectorAll('a[href]')]
        .map(a => new URL(a.href)).filter(u => u.origin === location.origin).map(u => u.pathname)""")
    ok(home and all(p.startswith(PREFIX) for p in home), f"interní odkazy vedou do {PREFIX}",
       ", ".join(sorted({p for p in home if not p.startswith(PREFIX)})))
    page.close()


with sync_playwright() as p:
    browser = p.chromium.launch()
    visit(browser, ORIGIN + PREFIX, 200, f"Úvodní stránka {PREFIX}")
    visit(browser, ORIGIN + PREFIX + "neexistuje/hluboko/", 404, "Stránka 404 (neexistující adresa v podsložce)")
    section("Adresa bez lomítka na konci")
    page = browser.new_page()
    response = page.goto(ORIGIN + PREFIX.rstrip("/"), wait_until="load")
    ok(response.status == 200 and page.url == ORIGIN + PREFIX, "přesměruje na úvodní stránku", page.url)
    browser.close()

server.shutdown()
print(f"\n{passed} v pořádku, {failed} chyb")
sys.exit(1 if failed else 0)
