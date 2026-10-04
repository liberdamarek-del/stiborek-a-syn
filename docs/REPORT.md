# Závěrečný report – nový web Řeznictví Stiborek a syn

Datum: **4. 10. 2026** · Výstup: `stiborek-web/` a `stiborek-web.zip` · Podrobný inventář: [`RESEARCH-INVENTORY.md`](RESEARCH-INVENTORY.md)

**Stav: READY FOR PRODUCTION – technicky.** Před zveřejněním je nutné, aby majitel
potvrdil tři body z kapitoly 11: doménu, otevírací dobu a fotografie.

---

## 1. VERIFIED INFORMATION – ověřené údaje

| Údaj | Hodnota | Zdroj (ověřeno 4. 10. 2026) |
|---|---|---|
| Obchodní firma | Řeznictví Miroslav Stiborek a syn s.r.o. | ARES / veřejný rejstřík |
| Název provozovny | Řeznictví Stiborek a syn | Facebook (název stránky), Firmy.cz |
| IČO / DIČ | 11965517 / CZ11965517 (plátce DPH) | ARES (subjekt aktivní, aktualizace 25. 5. 2026) |
| Sídlo i prodejna | Horní 210, 744 01 Frenštát pod Radhoštěm | ARES, Firmy.cz, Mapy.com |
| GPS | 49.5461011, 18.2155131 | Firmy.cz / Mapy.com (POI 13680365) |
| Zápis v OR | C 87362, Krajský soud v Ostravě, od 22. 10. 2021 | ARES – veřejný rejstřík |
| Obor | Řeznictví a uzenářství | rejstřík (předmět podnikání), logo, Firmy.cz |
| Telefon | +420 556 836 210 | Firmy.cz (aktuální), shodně všechny ostatní zdroje |
| Popis činnosti | „Zabýváme se maloobchodním prodejem masa a masných výrobků.“ | Firmy.cz |
| Facebook | https://www.facebook.com/reznictvi/ (stránka „Řeznictví Stiborek a syn“, ID 124860174940, 488 sledujících) | veřejný Facebook Page Plugin |
| Logo | oválný odznak „Miroslav Stiborek & syn – řeznictví a uzenářství“ | profilový obrázek oficiální FB stránky |
| Otevírací doba (aktuální zdroj) | Po–Pá 7:00–17:00, So 7:00–11:30, Ne zavřeno | Firmy.cz – viz kapitola 3 |

Ověřené odkazy (HTTP 200): Mapy.com detail firmy, navigace Mapy.com, Google Mapy (vyhledání i trasa), Facebook stránka.

## 2. HISTORICAL INFORMATION – historické údaje

Na webu **nejsou** prezentovány jako aktuální.

- **Web reznictvistiborek.cz** – existoval nejméně do 24. 5. 2022 (snímek v archive.org).
  Dnes doména **neexistuje** (DNS NXDOMAIN; CZ.NIC: „Doména nenalezena … Registrovat tuto doménu?“).
- **E-mail frenstat@reznictvistiborek.cz** – nefunkční (doména neexistuje). Na webu není.
- **Otevírací doba Po–Pá 7:00–18:00, So 7:00–11:30** – starý web a starší katalogy.
- **Prodejna v Novém Jičíně, Masarykovo nám. 15/10** – starý web / katalogy.
- **Výrobky:** Frenštátská uzená slanina, Frenštátské uzené žebro, Frenštátská uzená krkovice,
  šunkový salám, klobásy, pivní salám, sekaná, anglická slanina, grilovací speciality;
  druhy masa kuřecí, krůtí, vepřové, hovězí. V `content.json` jsou připravené jako
  **skryté** (`"show": false`) – zobrazí se až po potvrzení majitelem.
- **Texty starého webu:** „rodinná řeznická tradice“, „rodinné receptury předávané přes šedesát let“,
  „bez konzervantů“, „z vlastní porážky“, „tradiční řezník pochoutek“ – nepoužito.
- **IČO 10617124** – uvedeno ve starším záznamu Firmy.cz; v ARES nenalezeno.

## 3. CONFLICTING INFORMATION – rozpory mezi zdroji

| Téma | Zdroj A | Zdroj B | Řešení na webu |
|---|---|---|---|
| Otevírací doba Po–Pá | 7:00–**17:00** (Firmy.cz, aktuální záznam s novým IČO) | 7:00–**18:00** (starý web, ≤ 2022) | Zobrazeno 17:00 (aktuálnější a opatrnější varianta – zákazník nepřijde k zavřenému obchodu). Označeno `REQUIRES OWNER CONFIRMATION`. |
| Facebook URL | `facebook.com/reznictvi-stiborek` (text na Firmy.cz) | `facebook.com/reznictvi/` (odkaz na Firmy.cz) | První adresa vrací chybu 400 (neplatné jméno). Druhá ověřena jako stránka „Řeznictví Stiborek a syn“ → použita. |
| IČO | 10617124 (starý záznam Firmy.cz) | 11965517 (ARES, aktuální Firmy.cz) | Použito 11965517. |

## 4. UNVERIFIED INFORMATION – neověřené údaje (nepoužito)

- Rok založení 1993 (edb.cz – stránka nedostupná, HTTP 403).
- 2. místo v 18. ročníku soutěže o nejlepší klobásu (pouze shrnutí vyhledávače k článku
  Valašského deníku; článek vrací HTTP 503, datum ani kategorie nejsou známy). **Vhodné
  k doložení majitelem** – pokud se potvrdí, může být na webu.
- Počet zaměstnanců 26–100 a obrat 3–5 mil. Kč (vzájemně nekonzistentní katalogové údaje).
- Aktuální sortiment v detailu (konkrétní výrobky) – Facebook bez přihlášení nezobrazuje příspěvky.
- Aktuálnost příspěvků na Facebooku.
- Datová schránka p9qn8ei (Firmy.cz; neověřeno v ISDS, na webu není).
- Vlastní výroba a vlastní porážka – podle oboru „řeznictví a uzenářství“ pravděpodobné,
  ale současný stav nebyl doložen → web to netvrdí.

## 5. PHOTOGRAPHS USED – použité fotografie

| ID | Soubor(y) na webu | Původ | Úpravy |
|---|---|---|---|
| F01 | `images/brand/logo-stiborek-{120,240,480}.{avif,webp,png}`, favicony, `apple-touch-icon.png`, `icon-*.png`, `og-image.jpg` | Profilový obrázek oficiální FB stránky Řeznictví Stiborek a syn (604 × 604 px), originál v `docs/source-assets/` | Bílé pozadí nahrazeno průhledností (eliptická maska podle obrysu odznaku), zmenšení. Obsah loga nezměněn. |
| — | `favicon.svg` | Zjednodušený monogram (červený ovál, zlaté „S“ z písma Fraunces) pro velikost 16–32 px | Nejde o překreslení loga – **ke schválení majitelem**. |

**Jiné fotografie nebyly použity.** Facebook bez přihlášení nezobrazí příspěvky ani alba
(ověřeno přímým přístupem, mobilní verzí i veřejným pluginem v Chromiu – vždy přesměrování
na přihlášení). Jediná fotografie na Firmy.cz je panorama fasády od Seznamu (nepoužitelné).
**Žádné AI ani stock fotografie** – web je navržen tak, aby bez fotografií vypadal hotově
(typografie, barvy a logo) a fotografie se doplnily pouhým zápisem do `content.json`.

## 6. SOURCES – zdroje

- ARES (REST API): https://ares.gov.cz/ – IČO 11965517, veřejný rejstřík
- Firmy.cz: https://www.firmy.cz/detail/13680365-reznictvi-stiborek-a-syn-frenstat-pod-radhostem.html
- Mapy.com: https://mapy.com/cs/?source=firm&id=13680365
- Facebook: https://www.facebook.com/reznictvi/ (+ Page Plugin, graph.facebook.com/124860174940/picture)
- CZ.NIC whois: https://www.nic.cz/whois/domain/reznictvistiborek.cz/ · DNS: cloudflare-dns.com (NXDOMAIN)
- archive.org Availability API (snímek 2022-05-24; obsah z web.archive.org nebyl z prostředí dostupný)
- Kurzy.cz rejstřík: https://rejstrik-firem.kurzy.cz/11965517/reznictvi-miroslav-stiborek-a-syn-sro/
- Frenštát shopping: https://frenstat.infoshopping.cz/o/122/reznictvi-stiborek-frenstat
- Výsledky vyhledávače (Google/Bing-like) pro dotazy ze zadání: Stiborek a syn, Řeznictví Stiborek,
  …Frenštát, Miroslav Stiborek, reznictvistiborek.cz – včetně snippetů starého webu
- Nedostupné z prostředí: frenstatpr.cz (TIC), edb.cz (403), info-morava.cz, ekatalog.cz (403),
  valassky.denik.cz (503), web.archive.org, archive.ph

## 7. SECURITY – zabezpečení

- **Statický web bez backendu** – žádná databáze, PHP, WordPress, Node server ani přihlašování.
  Útočná plocha je minimální.
- **Bez formuláře** – kontaktní formulář by nepřinesl hodnotu navíc oproti telefonu
  a znamenal by backend, ochranu proti spamu a zpracování osobních údajů.
- **Content-Security-Policy** (konkrétní, bez `unsafe-inline`/`unsafe-eval`/`*`):
  `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self';
  connect-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none';
  frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests;
  require-trusted-types-for 'script'; trusted-types stiborek`
- **Trusted Types** vynucené – jediná politika `stiborek`; veškeré HTML se skládá
  z escapovaných hodnot (`esc()`), odkazy jen `https:`, `tel:`, `mailto:`, kotvy a relativní cesty (`safeUrl()`).
- **Hlavičky:** HSTS (1 rok, includeSubDomains), X-Content-Type-Options, X-Frame-Options DENY,
  Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy (vše vypnuto),
  COOP same-origin, CORP same-origin.
- Konfigurace pro **Apache** (`.htaccess`, vč. přesměrování na HTTPS, zákazu výpisu adresářů,
  blokace README/skrytých souborů), **Netlify/Cloudflare** (`_headers`) a **nginx** (`security/`).
  Test hlídá, že CSP je ve všech třech shodná.
- Žádné inline skripty, styly ani obsluhy událostí; JSON-LD je datový blok (nespouští se).
- `optimize-images.py` odstraňuje z fotografií EXIF/GPS metadata.
- Nevyřešeno (vyžaduje funkční e-mail majitele): `/.well-known/security.txt`.

## 8. PERFORMANCE – výkon

Naměřeno v Chromiu na lokálním serveru (testy `npm test`):

| Metrika | Hodnota |
|---|---|
| Celková velikost první návštěvy | **157 kB** (nekomprimovaně; HTML, CSS, JS, JSON, písmo, logo) |
| Počet požadavků | **8**, z toho **0 na cizí servery** |
| JavaScript | 37 kB nekomprimovaně (jeden ES modul, bez knihoven a frameworků) |
| CSS | 31 kB nekomprimovaně |
| Písmo | 2 soubory woff2 (24,6 + 6,9 kB) – Fraunces podmnožina jen s českými znaky, variabilní tloušťka, preload, `font-display: swap` |
| LCP | ~150 ms lokálně (text nadpisu je v HTML předgenerovaný; logo `fetchpriority="high"`) |
| CLS | 0,002 (všechny obrázky mají `width`/`height`, místo pro stav otevřeno je rezervované) |
| Logo | AVIF 4–22 kB podle velikosti, WebP a PNG jako záloha, `srcset` + `sizes` |

- Obsah je předgenerovaný do HTML (rychlé vykreslení, funguje bez JS, dobré pro Seznam i Google);
  `content.json` se načte asynchronně a stránka se překreslí jen při změně (kontrolní součet).
- Obrázky mimo první obrazovku `loading="lazy"`, dekódování `async`.
- Cache: HTML a `content.json` vždy revalidace; CSS/JS s verzí `?v=hash` 30 dní; písma 1 rok; obrázky 7 dní.
- Komprese (Brotli/Gzip) v `.htaccess` i nginx.
- Animace jen přes `transform`/`opacity`/`clip-path`; parallax čistě v CSS (scroll-driven animations) jako progresivní vylepšení.

## 9. ACCESSIBILITY – přístupnost (cíl WCAG 2.2 AA)

- **axe-core: 0 porušení** (WCAG 2.0/2.1/2.2 A+AA + best practices) – světlý i tmavý režim, mobil i desktop, i s otevřenou galerií.
- Sémantické HTML: `header`/`nav`/`main`/`section`/`article`/`footer`/`address`/`table`; jeden `h1`, hierarchie nadpisů bez skoků; `lang="cs"`.
- Odkaz **„Přeskočit na obsah“** (první Tab).
- **Viditelný fokus** (3px modrý obrys, kontrast 5,7 : 1).
- **Kontrast** všech barevných kombinací ≥ 5,1 : 1 (ověřeno výpočtem, viz tokeny v `styles.css`).
- **Menu** jako `<details>/<summary>` – funguje i bez JS; Esc zavře a vrátí fokus.
- **Lightbox** na `<dialog>` (modální, fokus uvnitř, Esc, šipky, swipe, návrat fokusu, popisky tlačítek).
- Otevírací doba jako tabulka s `th scope="row"`, dnešní den `aria-current="date"`.
- Tlačítka, menu a samostatné odkazy mají výšku ≥ 44 px; všechny ovládací prvky splňují minimum WCAG 2.2 (24 × 24 px) – testováno.
- `prefers-reduced-motion` – žádné animace ani parallax, obsah okamžitě viditelný.
- Alt texty u všech obrázků; dekorativní logo vedle textového názvu má prázdný alt.
- Tmavý režim podle systému (`prefers-color-scheme`).

## 10. EDITING GUIDE – úpravy webu

Podrobně v [`stiborek-web/README.md`](../stiborek-web/README.md) (pro neprogramátora). Ve zkratce:

- **Vše se mění v `content.json`** – texty, telefon, adresa, otevírací doba (jediné místo!),
  výjimky o svátcích, oznámení, produkty (`show: true/false`), fotografie, Facebook, titulky, popisy.
- Fotografie: soubor do `images/…`, záznam do `content.json` (src, alt, width, height).
- Změna se na webu projeví ihned po nahrání `content.json` – bez buildu a bez úprav JS/HTML.
- Chybný `content.json` web nerozbije (zobrazí se poslední funkční obsah).
- Technik: `node tools/build.mjs` (předgenerování + sitemap/robots/manifest), `npm test`.

## 11. OWNER INPUT REQUIRED – co musí dodat majitel

1. **Doména (urgentní):** `reznictvistiborek.cz` je volná – zaregistrovat, nebo určit jinou
   a uvést ji v `site.url`. Poté zapnout HTTPS (Let's Encrypt). `REQUIRES OWNER CONFIRMATION`
2. **Otevírací doba:** potvrdit Po–Pá 7:00–17:00, So 7:00–11:30 (starý web: do 18:00)
   a případně svátky/dovolené. `REQUIRES OWNER CONFIRMATION`
3. **Fotografie:** prodejna (exteriér, interiér, pult), výrobky, případně tým – v plném rozlišení
   (ideálně originály, ne kopie z Facebooku). Zadavatel má oprávnění k fotografiím
   z Facebooku, ale ty nebylo možné bez přihlášení stáhnout.
4. **Sortiment:** potvrdit, které výrobky ze starého webu se stále prodávají (stačí `show: true`),
   případně doplnit další typické výrobky.
5. **Příběh firmy** (`about.story`): od kdy firma funguje, kdo ji založil – jen ověřitelné údaje.
6. **E-mail** (volitelné) – funkční adresa pro kontakt a `security.txt`.
7. **Ocenění** (volitelné) – doklad o umístění v soutěži (článek Valašského deníku), pokud ho chcete uvádět.
8. **Schválení** zjednodušené ikony `favicon.svg` a textů webu.
9. **Nový Jičín:** potvrdit, že druhá prodejna již neexistuje (na webu není uvedena).

---

## Self-audit (kapitola 40 zadání)

| Otázka | Odpověď |
|---|---|
| Pozná zákazník okamžitě, co firma nabízí? | Ano – „Řeznictví a uzenářství“, „Maso, uzeniny a masné výrobky“ hned v úvodu. |
| Najde telefon do pěti sekund? | Ano – tlačítko v hlavičce (vždy viditelné), karta v úvodu, na mobilu spodní lišta „Zavolat“, velké číslo v kontaktu. |
| Najde otevírací dobu? | Ano – v úvodu (dnešní hodiny + stav Otevřeno/Zavřeno) a v samostatné sekci. |
| Najde adresu? | Ano – v úvodu, v sekci „Kde nás najdete“ s navigací, v kontaktu a patičce. |
| Vypadá web jako skutečná firma? | Ano – skutečné logo a barvy značky, skutečné údaje, žádné smyšlené slogany ani stock fotky. |
| Funguje na mobilu? | Ano – testováno 320–1920 px, světlý/tmavý režim, bez vodorovného přetečení. |
| Lze obsah upravit bez znalosti JS? | Ano – `content.json` + návod. |
| Je na webu zbytečný tracker? | Ne – 0 externích požadavků, žádné cookies. |
| Existuje zbytečný backend? | Ne – čistě statický web. |

## Automatické testy (výsledek)

`npm test` → **96 testů prošlo, 0 selhalo.** Testuje se: build vs. `content.json`, HTML validita
(html-validate), CSP a hlavičky, žádné inline skripty/styly, žádné trackery, logika otevírací doby
(letní/zimní čas, výjimky, jiné časové pásmo návštěvníka), konzole bez chyb a porušení CSP/Trusted Types,
0 požadavků na cizí servery, SEO (title, description, canonical, OG, Twitter, Schema.org, sitemap, robots),
obrázky (alt, rozměry, lazy, AVIF), výkonový rozpočet, LCP/CLS, kotvy a odkazy, axe-core,
klávesnice/fokus/menu, reduced motion, funkčnost bez JS, stránka 404 v hluboké cestě, galerie
(lightbox, šipky, swipe, Esc, fokus), živé načtení změn z `content.json` a odolnost proti chybnému JSON.
Snímky obrazovky: 9 rozlišení × světlý/tmavý režim + reduced motion – bez chyb a bez přetečení.
