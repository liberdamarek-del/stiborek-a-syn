# Řeznictví Stiborek a syn – nový web

Statický web pro **Řeznictví Stiborek a syn**, Horní 210, Frenštát pod Radhoštěm.
Bez backendu, bez cookies a trackerů, obsah se upravuje v jediném souboru `content.json`.

| | |
|---|---|
| **Web k nasazení** | [`stiborek-web/`](stiborek-web/) (stejný obsah je v [`stiborek-web.zip`](stiborek-web.zip)) |
| **Návod pro majitele** | [`stiborek-web/README.md`](stiborek-web/README.md) |
| **Závěrečný report** | [`docs/REPORT.md`](docs/REPORT.md) |
| **Research a inventář údajů** | [`docs/RESEARCH-INVENTORY.md`](docs/RESEARCH-INVENTORY.md) |
| **Nástroje** | [`tools/`](tools/) – build, lokální server, testy, optimalizace fotek, generování ikon |

## Před spuštěním (vyžaduje majitele)

1. Zaregistrovat doménu – `reznictvistiborek.cz` je k 4. 10. 2026 **volná**.
2. Potvrdit otevírací dobu (zdroje se liší: do 17:00 vs. do 18:00).
3. Dodat fotografie (z Facebooku je nebylo možné bez přihlášení stáhnout).

## Vývoj

```bash
npm install
node tools/build.mjs          # content.json → index.html, 404.html, sitemap.xml, robots.txt, manifest
node tools/serve.mjs 8080     # náhled s produkčními bezpečnostními hlavičkami
npm test                      # HTML, a11y (axe), CSP, SEO, výkon, logika otevírací doby, galerie
```
