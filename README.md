# Řeznictví Stiborek a syn – nový web

Statický web pro **Řeznictví Stiborek a syn**, Horní 210, Frenštát pod Radhoštěm.
Bez backendu, bez cookies a trackerů, obsah se upravuje v jediném souboru `content.json`.

| | |
|---|---|
| **Veřejná adresa (GitHub Pages)** | <https://liberdamarek-del.github.io/stiborek-a-syn/> |
| **Web k nasazení** | [`stiborek-web/`](stiborek-web/) (stejný obsah je v [`stiborek-web.zip`](stiborek-web.zip)) |
| **Návod pro majitele** | [`stiborek-web/README.md`](stiborek-web/README.md) |
| **Závěrečný report** | [`docs/REPORT.md`](docs/REPORT.md) |
| **Research a inventář údajů** | [`docs/RESEARCH-INVENTORY.md`](docs/RESEARCH-INVENTORY.md) |
| **Nástroje** | [`tools/`](tools/) – build, lokální server, testy, optimalizace fotek, generování ikon |

## Před spuštěním (vyžaduje majitele)

1. Zaregistrovat doménu – `reznictvistiborek.cz` je k 4. 10. 2026 **volná**.
2. ~~Potvrdit otevírací dobu~~ – potvrzeno 29. 10. 2026 (Po–Pá 7:00–17:00, So 7:00–11:30).
3. Dodat fotografie (z Facebooku je nebylo možné bez přihlášení stáhnout).

## Zveřejnění na GitHub Pages

Workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) po každé změně ve výchozí větvi
(i po úpravě `content.json` přímo na GitHubu) web sestaví pro adresu GitHub Pages, zkontroluje ho
v prohlížeči a zveřejní – změna je venku zhruba do 2–3 minut.

- Jednorázové nastavení: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
- Sestavuje se kopie do `_site/` (`node tools/build.mjs --out _site --site-url …`); složka `stiborek-web/`
  zůstává pro klasický hosting beze změny. Kanonická adresa, sitemap a náhled pro sdílení odkazu míří
  na adresu GitHub Pages, cesty na stránce 404 vedou do podsložky `/stiborek-a-syn/`.
- GitHub Pages neumí vlastní HTTP hlavičky. CSP a Referrer-Policy se proto vkládají jako `<meta>`;
  `frame-ancestors`, `X-Frame-Options`, HSTS a další hlavičky z `_headers` na GitHub Pages neplatí.
- Po registraci domény ji lze nastavit v Settings → Pages → Custom domain; workflow pak použije ji.

## Vývoj

```bash
npm install
node tools/build.mjs          # content.json → index.html, 404.html, sitemap.xml, robots.txt, manifest
node tools/serve.mjs 8080     # náhled s produkčními bezpečnostními hlavičkami
npm test                      # HTML, a11y (axe), CSP, SEO, výkon, logika otevírací doby, galerie

# kopie pro GitHub Pages a její kontrola (pip install playwright && python3 -m playwright install chromium)
node tools/build.mjs --out _site --site-url https://liberdamarek-del.github.io/stiborek-a-syn/
python3 tools/test-pages.py _site https://liberdamarek-del.github.io/stiborek-a-syn/
```
