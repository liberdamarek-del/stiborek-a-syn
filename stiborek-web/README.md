# Web Řeznictví Stiborek a syn – návod pro správu

Tento návod je pro člověka, který **není programátor**. Na běžné úpravy webu
(texty, telefon, otevírací doba, sortiment, fotografie) stačí upravit jediný soubor:
**`content.json`**. JavaScript ani HTML upravovat nemusíte.

---

## ⚠ Než web spustíte

1. **Zaregistrujte doménu.** Historická doména `reznictvistiborek.cz` k 4. 10. 2026
   **není registrována** (je volná). Zaregistrujte ji co nejdříve u libovolného
   registrátora (Wedos, Forpsi, Active24 …), aby ji nezabral někdo jiný.
   Pokud zvolíte jinou doménu, změňte ji v `content.json` (viz „Jak změnit doménu“).
2. **Potvrďte otevírací dobu.** Na webu je otevírací doba z katalogu Firmy.cz
   (Po–Pá 7:00–17:00, So 7:00–11:30). Starý web uváděl Po–Pá do 18:00.
   Zkontrolujte ji a případně opravte (viz níže).
3. **Dodejte fotografie** prodejny, výrobků a týmu (viz „Jak přidat fotografii“).

---

## Co je ve složce

| Soubor / složka | K čemu slouží | Upravujete? |
|---|---|---|
| `content.json` | **všechny texty a údaje webu** | **ANO** |
| `images/` | fotografie (`hero/`, `products/`, `gallery/`, `about/`) a logo (`brand/`) | ANO – přidáváte fotky |
| `index.html` | hlavní stránka (předgenerovaná z content.json) | ne |
| `404.html` | stránka „nenalezeno“ | ne |
| `styles.css`, `script.js` | vzhled a funkce webu | ne |
| `fonts/` | písmo nadpisů (Fraunces, licence OFL) | ne |
| `.htaccess`, `_headers`, `security/` | bezpečnost a nastavení serveru | ne |
| `favicon.*`, `icon-*.png`, `apple-touch-icon.png`, `manifest.webmanifest` | ikony webu | ne |
| `robots.txt`, `sitemap.xml` | pro vyhledávače | ne |

> Soubor `.htaccess` začíná tečkou, a proto ho některé programy skrývají.
> Při nahrávání na hosting ho **nevynechejte**.

---

## Jak upravovat `content.json`

1. Otevřete `content.json` v textovém editoru – stačí **Poznámkový blok** (Windows),
   **TextEdit** v režimu prostého textu (Mac) nebo zdarma **Visual Studio Code**.
   Nepoužívejte Word.
2. Měňte **jen text v uvozovkách za dvojtečkou**. Příklad:
   ```json
   "phone": "+420 556 836 210",
   ```
   Měníte jen `+420 556 836 210`, uvozovky a čárka na konci zůstávají.
3. Soubor uložte v kódování **UTF-8** (Poznámkový blok: Uložit jako → Kódování UTF-8).
4. Nahrajte `content.json` na hosting (přepište starý). Změna se projeví hned
   po obnovení stránky.

**Tři pravidla, která nesmíte porušit:**
- každý text je v **rovných uvozovkách** `"…"` (ne „…“),
- mezi položkami je **čárka**, za poslední položkou v závorce čárka **není**,
- uvnitř textu nepište rovné uvozovky `"` – použijte české „takto“.

Položky začínající podtržítkem (`_napoveda`, `_stav`) jsou jen poznámky pro vás,
na webu se nezobrazují.

**Udělali jste chybu?** Web se nerozbije – dokud chybu neopravíte, zobrazuje
se poslední funkční verze obsahu. Správnost souboru ověříte např. na
[jsonlint.com](https://jsonlint.com) (vložte obsah souboru a klikněte na *Validate JSON*).

---

## Jak změnit text

Všechny texty jsou v `content.json` pojmenované podle části webu:

| Část webu | Klíč v content.json |
|---|---|
| Úvod (velký nadpis, podtitulek, tlačítka) | `hero` |
| Krátké představení | `intro` |
| Sortiment | `products` |
| O nás | `about` |
| Fotogalerie | `gallery` |
| Otevírací doba a adresa (nadpisy) | `visit` |
| Kontakt | `contact` |
| Titulek a popis pro Google/Seznam | `site.title`, `site.description` |
| Oznámení nahoře na webu | `announcement` |

Odstavce jsou zapsané jako seznam:
```json
"text": [
  "První odstavec.",
  "Druhý odstavec."
]
```

**Příběh firmy:** do `about.story` můžete doplnit historii (od kdy firma funguje,
kdo ji založil …). Uvádějte prosím jen skutečné údaje.

## Jak přidat oznámení (dovolená, změna otevírací doby)

```json
"announcement": {
  "text": "Od 20. do 24. 7. máme dovolenou. Děkujeme za pochopení.",
  "link": ""
},
```
Oznámení odstraníte tak, že text smažete: `"text": ""`.

---

## Jak změnit telefon

V části `company`:
```json
"phone": "+420 556 836 210",
```
Telefon se automaticky změní na všech místech webu (hlavička, úvod, kontakt,
patička, tlačítko „Zavolat“ na mobilu i údaje pro Google).

## Jak doplnit e-mail

E-mail ze starého webu (`frenstat@reznictvistiborek.cz`) nefunguje. Máte-li funkční
e-mail, doplňte ho:
```json
"email": "info@vasedomena.cz",
```
Prázdné `""` = e-mail se nezobrazuje.

---

## Jak změnit otevírací dobu

V části `openingHours`:
```json
"monday": "07:00-17:00",
"saturday": "07:00-11:30",
"sunday": "zavřeno",
```
- čas pište ve tvaru `07:00-17:00`,
- polední pauza: `"07:00-12:00, 13:00-17:00"`,
- zavřený den: `"zavřeno"`.

Stav **Otevřeno / Zavřeno** a zvýraznění dnešního dne se počítá automaticky
podle českého času. Otevírací dobu zapisujete **jen na tomto jednom místě**.

**Svátky a dovolená** (mimořádná otevírací doba) – do `exceptions`:
```json
"exceptions": [
  { "date": "2026-12-24", "hours": "07:00-11:00", "label": "Štědrý den" },
  { "date": "2026-12-25", "hours": "zavřeno", "label": "1. svátek vánoční" }
]
```
Datum se píše ve tvaru rok-měsíc-den. Výjimka se na webu zobrazí 45 dní předem
a v daný den se podle ní řídí i stav „Otevřeno / Zavřeno“. Staré výjimky můžete
smazat, ale nemusíte.

---

## Jak přidat produkt

V `products.items` zkopírujte celý blok jedné položky (od `{` po `}`), vložte ho
za poslední položku a oddělte čárkou:
```json
{
  "name": "Domácí škvarky",
  "description": "Krátký popis.",
  "image": null,
  "show": true
}
```

## Jak odstranit (skrýt) produkt

Nejjednodušší je položku skrýt: `"show": false`. Zpět ji zobrazíte `"show": true`.
Položku můžete také celou smazat (pozor na čárky).

> V souboru jsou připravené, ale **skryté** výrobky ze starého webu
> (Frenštátská uzená slanina, žebro, krkovice, grilovací speciality).
> Pokud je stále prodáváte, stačí jim nastavit `"show": true`.

**Ceny na webu nejsou** – zobrazujte je jen tehdy, pokud je budete pravidelně aktualizovat.

---

## Jak přidat fotografii

1. Fotografii (JPG) uložte do správné složky:
   `images/gallery/` (galerie), `images/products/` (sortiment),
   `images/hero/` (velká fotka v úvodu), `images/about/` (O nás).
   Název souboru pište **bez diakritiky a mezer**, např. `pult-s-uzeninami.jpg`.
2. Fotku před nahráním zmenšete na šířku cca **1920 px** (stačí v telefonu nebo
   v programu Malování → Změnit velikost). Ideální velikost souboru je pod 400 kB.
3. Do `content.json` přidejte záznam, např. do galerie:
   ```json
   "items": [
     { "src": "images/gallery/pult-s-uzeninami.jpg", "alt": "Pult s uzeninami v prodejně", "width": 1920, "height": 1280, "caption": "Naše prodejna" }
   ]
   ```
   - `alt` = krátký popis, co je na fotce (čtou ho nevidomí a vyhledávače),
   - `width` a `height` = rozměry fotky v pixelech (zjistíte ve vlastnostech souboru),
   - `caption` = nepovinný popisek pod fotkou.

   Fotka k produktu: `"image": { "src": "images/products/maso.jpg", "alt": "Čerstvé vepřové maso", "width": 1600, "height": 1200 }`
   Fotka do úvodu: `"hero"` → `"image": { "src": "images/hero/prodejna.jpg", "alt": "…", "width": 1920, "height": 1280 }`
4. Galerie se na webu (i v menu) objeví automaticky, jakmile v ní je alespoň jedna fotka.
   Kliknutím se fotka zvětší; ovládá se šipkami, klávesou Esc a na mobilu přejetím prstem.

**Používejte jen vlastní fotografie** nebo fotografie, ke kterým máte práva
(např. z vaší facebookové stránky). Fotografie stažené z Google nepoužívejte.

### Nejrychlejší web (volitelné, pro technika)

Nástroj `tools/optimize-images.py` (ve zdrojovém repozitáři) vytvoří z fotky
zmenšené varianty v moderních formátech AVIF a WebP, **odstraní z fotky GPS
polohu a další metadata** a vypíše řádek pro `content.json`:
```
python3 tools/optimize-images.py stiborek-web/images/gallery/
```

## Jak změnit fotografii

Novou fotku nahrajte **pod novým názvem** (např. `prodejna-2027.jpg`) a změňte
název v `content.json`. Prohlížeče si obrázky pamatují až 7 dní – se stejným
názvem by někteří návštěvníci ještě chvíli viděli starou fotku.

---

## Jak změnit Facebook

```json
"facebook": "https://www.facebook.com/reznictvi/",
```
Odkaz zkopírujte z adresního řádku prohlížeče na vaší stránce. Musí začínat `https://`.
Prázdné `""` = odkaz se nezobrazí. Stejně můžete doplnit `"instagram"`.

## Jak změnit adresu

V `company.address` upravte ulici, PSČ a město. Pokud se prodejna přestěhuje,
upravte také:
- `company.geo` – GPS souřadnice (na [mapy.com](https://mapy.com) klikněte pravým
  tlačítkem na místo → zkopírujte souřadnice),
- `company.maps` – odkazy na mapy (`navigate` = navigace, `mapyCz` = detail na Mapy.com,
  `google` = Google Mapy).

## Jak změnit doménu

V `site.url` napište novou adresu webu ve tvaru `https://www.domena.cz/`
(s lomítkem na konci). Doména je uvedena také v souborech `robots.txt` a
`sitemap.xml` – buď je opravte ručně (najít a nahradit), nebo požádejte technika
o spuštění buildu (viz níže), který je přegeneruje automaticky.

---

## Jak web nahrát na hosting

Web je **statický** – nepotřebuje databázi, PHP ani WordPress. Funguje na
každém běžném webhostingu.

1. U hostingu (Wedos, Forpsi, Active24 …) si zjistěte **FTP přístup**
   (server, uživatel, heslo).
2. Nainstalujte zdarma program **FileZilla** (filezilla-project.org).
3. Připojte se k hostingu a otevřete složku pro web (obvykle `www`, `public_html`
   nebo `htdocs`).
4. Nahrajte **celý obsah** složky `stiborek-web` (ne složku samotnou) – včetně
   souboru `.htaccess` (ve FileZille: Server → Vynutit zobrazení skrytých souborů).
5. Otevřete web v prohlížeči a zkontrolujte ho.

Hosting typu Netlify nebo Cloudflare Pages: stačí nahrát složku `stiborek-web`
(použije se soubor `_headers`). Server nginx: ukázka je v `security/nginx.conf`.

## Jak zapnout HTTPS

1. V administraci hostingu zapněte **SSL certifikát Let's Encrypt** (bývá zdarma,
   často jedním kliknutím u domény).
2. Počkejte, až bude web dostupný na `https://…`.
3. Hotovo – soubor `.htaccess` automaticky přesměruje všechny návštěvníky
   z `http://` na `https://` a zapne zabezpečení HSTS.
4. Po zprovoznění domény můžete v `.htaccess` zapnout přesměrování na adresu
   s `www.` (návod je přímo v souboru).

> HTTPS zapněte **dříve**, než na web pošlete návštěvníky. Bez certifikátu
> by se web kvůli přesměrování na HTTPS nezobrazil.

## Jak aktualizovat web

- **Běžné změny** (texty, telefon, otevírací doba, produkty, fotky): upravte
  `content.json`, případně přidejte fotky do `images/`, a nahrajte změněné soubory
  na hosting. Nic dalšího není potřeba.
- **Doporučení:** jednou za čas (nebo po větších změnách) požádejte technika o
  spuštění buildu – obsah se pak předgeneruje přímo do `index.html`, což je
  nejlepší pro vyhledávače a pro návštěvníky s vypnutým JavaScriptem.
- Před každou úpravou si uložte **zálohu** `content.json`.

### Když se změna neprojeví

1. Obnovte stránku (Ctrl + F5, na mobilu zavřete a znovu otevřete prohlížeč).
2. Zkontrolujte `content.json` na [jsonlint.com](https://jsonlint.com) – chyba
   v čárkách nebo uvozovkách způsobí, že se zobrazuje předchozí verze.
3. Zkontrolujte, že jste nahráli soubor do správné složky na hostingu.

---

## Soukromí a cookies

Web **nepoužívá cookies, analytiku ani sledovací nástroje** a nenačítá nic
z cizích serverů (ani Google Fonts). Proto **nepotřebuje cookie lištu**.
Pokud byste v budoucnu přidali analytiku (např. Google Analytics), je nutné
doplnit souhlas návštěvníka (cookie lištu) a upravit bezpečnostní nastavení
v `.htaccess` – požádejte technika.

Web nemá kontaktní formulář ani žádné přihlašování – neshromažďuje žádné
osobní údaje návštěvníků.

---

## Pro technika

Zdrojový repozitář obsahuje vedle složky `stiborek-web/` také nástroje (Node.js 20+, Python 3):

```bash
npm install                    # jen pro testy (Playwright, axe-core, html-validate)
node tools/build.mjs           # content.json → index.html, 404.html, sitemap, robots, manifest
node tools/build.mjs --check   # kontrola, že vygenerované soubory odpovídají content.json
node tools/serve.mjs 8080      # lokální náhled se stejnými bezpečnostními hlavičkami jako hosting
npm test                       # automatické testy (HTML, přístupnost, CSP, SEO, výkon, logika)
python3 tools/optimize-images.py stiborek-web/images/gallery/   # AVIF/WebP/JPEG varianty, bez metadat
python3 tools/make-brand-assets.py  # logo, favicony, OG obrázek z originálního loga
python3 tools/make-zip.py           # stiborek-web.zip k nahrání na hosting
```

Architektura: statický web bez backendu. `script.js` je ES modul – stejné
vykreslovací funkce používá build (předgenerování) i prohlížeč (živé načtení
změn z `content.json` podle kontrolního součtu). CSP bez `unsafe-inline`,
s vynucenými Trusted Types.
