#!/usr/bin/env python3
"""
Vygeneruje grafické podklady značky z originálního loga (profilový obrázek
oficiální Facebook stránky Řeznictví Stiborek a syn).

Výstupy (do stiborek-web/):
  images/brand/logo-stiborek-{120,240,480}.{avif,webp,png}  – logo s průhledným pozadím
  favicon.ico, favicon.svg, apple-touch-icon.png, icon-192.png, icon-512.png,
  icon-maskable-512.png, images/brand/og-image.jpg

Obsah loga se nemění – pouze se bílé pozadí kolem oválného odznaku nahradí
průhledností (eliptická maska) a obrázek se zmenší.

Použití:  python3 tools/make-brand-assets.py
Vyžaduje: pip install pillow fonttools brotli
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "docs/source-assets/facebook-profile-logo-604.jpg"
WEB = ROOT / "stiborek-web"
BRAND = WEB / "images/brand"
FONT = WEB / "fonts/fraunces-latin.woff2"

PAPER = (246, 241, 232)
RED = (163, 25, 27)
RED_DEEP = (110, 15, 17)
INK = (31, 26, 23)
GOLD = (201, 154, 46)

SS = 4  # supersampling pro hladký okraj masky


def logo_rgba() -> Image.Image:
    im = Image.open(SRC).convert("RGB")
    w, h = im.size
    # Ohraničení odznaku (pixely tmavší než bílé pozadí)
    px = im.load()
    xs, ys = [], []
    for y in range(h):
        for x in range(w):
            if min(px[x, y]) < 235:
                xs.append(x)
                ys.append(y)
    x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
    # Eliptická maska, o 1 px dovnitř, aby nezůstal bílý lem
    mask = Image.new("L", (w * SS, h * SS), 0)
    ImageDraw.Draw(mask).ellipse(
        ((x0 + 1) * SS, (y0 + 1) * SS, (x1 - 0) * SS, (y1 - 0) * SS), fill=255
    )
    mask = mask.resize((w, h), Image.LANCZOS)
    out = im.convert("RGBA")
    out.putalpha(mask)
    return out.crop((x0 - 1, y0 - 1, x1 + 2, y1 + 2))


def save_png(img: Image.Image, path, colors=256):
    """PNG s paletou (jako pngquant) – výrazně menší soubor, vizuálně shodný."""
    q = img.quantize(colors=colors, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)
    q.save(path, optimize=True)


def save_variants(img: Image.Image, base: Path, heights):
    sizes = []
    for hgt in heights:
        wdt = round(img.width * hgt / img.height)
        r = img.resize((wdt, hgt), Image.LANCZOS)
        save_png(r, f"{base}-{hgt}.png")
        r.save(f"{base}-{hgt}.webp", quality=88, method=6)
        r.save(f"{base}-{hgt}.avif", quality=70)
        sizes.append((wdt, hgt))
    return sizes


def square_icon(logo: Image.Image, size: int, bg, scale: float) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), bg)
    hgt = round(size * scale)
    wdt = round(logo.width * hgt / logo.height)
    r = logo.resize((wdt, hgt), Image.LANCZOS)
    canvas.alpha_composite(r, ((size - wdt) // 2, (size - hgt) // 2))
    return canvas


def favicon_svg() -> str:
    """Zjednodušený monogram pro malé velikosti: červený ovál se zlatým „S“
    (tvar písmene z fontu Fraunces). Nejde o překreslení loga."""
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont

    font = instantiateVariableFont(TTFont(FONT), {"wght": 900})
    gs = font.getGlyphSet()
    name = font.getBestCmap()[ord("S")]
    glyph = gs[name]
    upm = font["head"].unitsPerEm
    # bounding box glyfu
    from fontTools.pens.boundsPen import BoundsPen

    bp = BoundsPen(gs)
    glyph.draw(bp)
    gx0, gy0, gx1, gy1 = bp.bounds
    target_h = 36.0
    s = target_h / (gy1 - gy0)
    gw = (gx1 - gx0) * s
    tx = 32 - gw / 2 - gx0 * s
    ty = 32 + target_h / 2 + gy0 * s
    pen = SVGPathPen(gs, ntos=lambda v: f"{v:.1f}".rstrip("0").rstrip("."))
    glyph.draw(TransformPen(pen, (s, 0, 0, -s, tx, ty)))
    d = pen.getCommands()
    del upm
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
        '<ellipse cx="32" cy="32" rx="22" ry="30.5" fill="#c0c4c8"/>'
        '<ellipse cx="32" cy="32" rx="19.5" ry="28" fill="#a3191b"/>'
        f'<path d="{d}" fill="#d9a63a"/>'
        "</svg>\n"
    )


def og_image(logo: Image.Image):
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)
    # červený pás vpravo s logem
    d.rectangle((W - 470, 0, W, H), fill=RED)
    lh = 500
    lw = round(logo.width * lh / logo.height)
    lr = logo.resize((lw, lh), Image.LANCZOS)
    img.paste(lr, (W - 235 - lw // 2, (H - lh) // 2), lr)

    def font(size, wght):
        from fontTools.ttLib import TTFont
        from fontTools.varLib.instancer import instantiateVariableFont
        import io

        f = instantiateVariableFont(TTFont(FONT), {"wght": wght})
        f.flavor = None
        buf = io.BytesIO()
        f.save(buf)
        buf.seek(0)
        return ImageFont.truetype(buf, size)

    # Fraunces latin subset neobsahuje č/ř/š… → titulek bez háčků není přijatelný,
    # proto se pro diakritiku skládá latin + latin-ext do jednoho fontu.
    ext = WEB / "fonts/fraunces-latin-ext.woff2"

    def merged(size, wght):
        from fontTools.ttLib import TTFont
        from fontTools.varLib.instancer import instantiateVariableFont
        from fontTools.merge import Merger
        import io, tempfile, os

        paths = []
        for p in (FONT, ext):
            f = instantiateVariableFont(TTFont(p), {"wght": wght})
            f.flavor = None
            # Merger vyžaduje shodné unitsPerEm a nepovoluje fvar/gvar
            for t in ("STAT",):
                if t in f:
                    del f[t]
            tmp = tempfile.NamedTemporaryFile(suffix=".ttf", delete=False)
            f.save(tmp.name)
            paths.append(tmp.name)
        m = Merger().merge(paths)
        buf = io.BytesIO()
        m.save(buf)
        buf.seek(0)
        for p in paths:
            os.unlink(p)
        return ImageFont.truetype(buf, size)

    try:
        title = merged(80, 700)
        small = merged(34, 500)
    except Exception as e:  # záložně bez sloučení
        print("Font merge failed:", e)
        title = font(80, 700)
        small = font(34, 500)

    x = 72
    d.text((x, 92), "ŘEZNICTVÍ A UZENÁŘSTVÍ", font=small, fill=RED)
    d.text((x, 176), "Řeznictví", font=title, fill=INK)
    d.text((x, 266), "Stiborek a syn", font=title, fill=INK)
    d.line((x, 400, x + 120, 400), fill=GOLD, width=4)
    d.text((x, 450), "Horní 210, Frenštát pod Radhoštěm", font=small, fill=INK)
    d.text((x, 500), "+420 556 836 210", font=small, fill=INK)
    img.save(BRAND / "og-image.jpg", quality=86, optimize=True, progressive=True)


def main():
    BRAND.mkdir(parents=True, exist_ok=True)
    logo = logo_rgba()
    print("logo crop", logo.size)
    print("variants", save_variants(logo, BRAND / "logo-stiborek", (120, 240, 480)))

    save_png(square_icon(logo, 180, PAPER + (255,), 0.86).convert("RGB"), WEB / "apple-touch-icon.png")
    save_png(square_icon(logo, 192, (0, 0, 0, 0), 0.94), WEB / "icon-192.png")
    save_png(square_icon(logo, 512, (0, 0, 0, 0), 0.94), WEB / "icon-512.png")
    # maskable: bezpečná zóna = kruh 80 % → logo max ~70 % výšky
    save_png(square_icon(logo, 512, PAPER + (255,), 0.70).convert("RGB"), WEB / "icon-maskable-512.png")
    ico = square_icon(logo, 64, (0, 0, 0, 0), 0.98)
    ico.save(WEB / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    (WEB / "favicon.svg").write_text(favicon_svg(), encoding="utf-8")
    og_image(logo)
    print("done")


if __name__ == "__main__":
    main()
