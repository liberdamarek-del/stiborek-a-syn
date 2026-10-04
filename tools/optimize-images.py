#!/usr/bin/env python3
"""
Připraví fotografie pro web: zmenšené varianty ve formátech AVIF, WebP a JPEG.

  python3 tools/optimize-images.py stiborek-web/images/gallery/prodejna.jpg
  python3 tools/optimize-images.py stiborek-web/images/gallery/          (všechny fotky ve složce)
  python3 tools/optimize-images.py foto.jpg --widths 640,1280 --alt "Pult s uzeninami"

Co nástroj dělá:
  • otočí fotku podle EXIF (fotky z mobilu),
  • ODSTRANÍ metadata (GPS polohu, model telefonu…) – ochrana soukromí,
  • vytvoří varianty nazev-640.jpg/.webp/.avif, nazev-1280…, nazev-1920… (nikdy nezvětšuje),
  • vypíše řádek, který stačí vložit do content.json.

Fotografie se pouze zmenšují a převádějí – neořezávají se ani jinak neupravují.
Vyžaduje: pip install pillow   (AVIF: Pillow 11.3+ nebo pip install pillow-avif-plugin)
"""
import argparse
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps, features

try:  # starší Pillow bez vestavěného AVIF
    import pillow_avif  # noqa: F401
except ImportError:
    pass

VARIANT = re.compile(r"-(\d+)\.(jpe?g|png|webp|avif)$", re.I)


def optimize(path: Path, widths, alt: str):
    im = Image.open(path)
    im = ImageOps.exif_transpose(im)
    if im.mode not in ("RGB", "L"):
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.convert("RGBA").split()[-1])
        im = bg
    im = im.convert("RGB")
    W, H = im.size
    usable = sorted({w for w in widths if w < W} | {min(max(widths), W)})
    has_avif = features.check("avif")
    base = path.with_suffix("")
    for w in usable:
        h = round(H * w / W)
        r = im.resize((w, h), Image.LANCZOS) if w != W else im.copy()
        # uložení bez metadat (EXIF/GPS se nepřenáší)
        r.save(f"{base}-{w}.jpg", "JPEG", quality=82, optimize=True, progressive=True)
        r.save(f"{base}-{w}.webp", "WEBP", quality=80, method=6)
        if has_avif:
            r.save(f"{base}-{w}.avif", "AVIF", quality=60)
    top = usable[-1]
    # cesta pro content.json = od složky „images/“ (funguje, ať je web uložen kdekoli)
    parts = path.resolve().parts
    rel = "/".join(parts[len(parts) - 1 - parts[::-1].index("images"):]) if "images" in parts else path.name
    entry = {
        "src": re.sub(r"\.(png|jpeg)$", ".jpg", rel, flags=re.I),
        "alt": alt or "DOPLŇTE POPIS FOTOGRAFIE",
        "width": top,
        "height": round(H * top / W),
        "widths": usable,
        "formats": ["avif", "webp"] if has_avif else ["webp"],
    }
    return entry


def is_variant(name: str, widths) -> bool:
    """Soubor vytvořený tímto nástrojem (např. prodejna-1280.jpg) se znovu nezpracovává."""
    m = VARIANT.search(name)
    return bool(m) and int(m.group(1)) in set(widths) | {640, 1280, 1920}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("paths", nargs="+")
    ap.add_argument("--widths", default="640,1280,1920")
    ap.add_argument("--alt", default="")
    a = ap.parse_args()
    widths = [int(x) for x in a.widths.split(",") if x.strip()]
    files = []
    for p in map(Path, a.paths):
        if p.is_dir():
            files += [f for f in sorted(p.iterdir()) if f.suffix.lower() in (".jpg", ".jpeg", ".png") and not is_variant(f.name, widths)]
        elif p.exists():
            files.append(p)
        else:
            print(f"Soubor nenalezen: {p}", file=sys.stderr)
    if not features.check("avif"):
        print("Upozornění: tato verze Pillow neumí AVIF – vytvoří se jen WebP a JPEG.", file=sys.stderr)
    for f in files:
        entry = optimize(f, widths, a.alt)
        print(f"\n✔ {f.name} – vložte do content.json:")
        print(json.dumps(entry, ensure_ascii=False))
    if not files:
        print("Nenalezeny žádné fotografie (.jpg, .jpeg, .png).", file=sys.stderr)
    if files:
        print("\nPůvodní soubory můžete z webové složky odstranit (zálohu si nechte jinde) – web používá jen vytvořené varianty.")


if __name__ == "__main__":
    main()
