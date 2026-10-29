#!/usr/bin/env python3
"""
Úprava fotografií z Facebooku stránky Řeznictví Stiborek a syn pro web.

  python3 tools/edit-photos.py <složka s originály> <výstupní složka>

Originály jsou snímky obrazovky z prohlížeče fotek na Facebooku. Skript:
  1. odstraní ovládací prvky prohlížeče (bílé šipky ‹ ›, počítadlo „N z 84“) –
     ořezem; jen u diplomu (hladký papír) se plocha šipky dopočítá z okolí,
  2. ořízne fotku na kompozici pro dané místo na webu,
  3. provede běžné fotografické úpravy: vyvážení bílé (jen mírně, teplé tóny
     zůstávají), úrovně, lokální kontrast, sytost, odšumění a doostření.

Na fotkách se nic nepřidává ani nemění (žádné retuše výrobků) – úpravy odpovídají
tomu, co dělá fotograf při běžném zpracování snímku.
"""
import sys
from pathlib import Path

import cv2
import numpy as np

# Ovládací prvky prohlížeče: šipky jsou bílé kruhy 67 × 67 px na x = 28 a x = 1123
# (svisle uprostřed), počítadlo je nahoře uprostřed (y do ~45 px). Ořezy je vynechávají
# s rezervou na rozmazané okraje JPEG.
PHOTOS = {
    # název: (originál, ořez x0, y0, x1, y1, [šipky k dopočítání (x, y, š, v)], profil úprav)
    "hero-klobasy": ("e8aac924-image.jpg", (100, 0, 1115, 1445), [], "food"),
    "prodejna-stanek": ("7602768e-image.jpg", (128, 30, 1118, 828), [], "food"),
    "klobasy-detail": ("30b364b9-image.jpg", (100, 250, 1115, 1011), [], "food"),
    "frenstatsky-salam": ("d549412a-image.jpg", (224, 64, 996, 643), [], "food"),
    "uzene-maso": ("81656147-image.jpg", (30, 110, 1059, 882), [], "food"),
    "jitrnice": ("657295e0-image.jpg", (190, 0, 957, 575), [], "food"),
    "udirna-klobasy": ("1e923dc2-image.jpg", (100, 180, 1118, 1700), [], "food"),
    "udirna-vozik": ("ef5c9908-image.jpg", (100, 60, 1118, 1640), [], "food"),
    "frenstatske-salamy": ("d8170d32-image.jpg", (100, 0, 1115, 1360), [], "food"),
    "jitrnice-klobasy": ("edf4d331-image.jpg", (100, 36, 1115, 824), [], "food"),
    "uzene-kusy": ("feca8959-image.jpg", (0, 0, 1020, 565), [], "food"),
    "diplom-tlacenka-2018": ("e38c1b68-image.jpg", (14, 0, 1118, 803), [(28, 355, 67, 68)], "document"),
}


def inpaint(img, boxes, pad=28):
    """Šipka i s jejím stínem (posunutým dolů a doprava) se dopočítá z okolního papíru."""
    if not boxes:
        return img
    mask = np.zeros(img.shape[:2], np.uint8)
    for x, y, w, h in boxes:
        cv2.circle(mask, (x + w // 2 + 5, y + h // 2 + 7), max(w, h) // 2 + pad, 255, -1)
    return cv2.inpaint(img, mask, 15, cv2.INPAINT_TELEA)


def lift_shadows(f, amount):
    """Jemné projasnění stínů a středních tónů (světla se nemění)."""
    x = f / 255
    return np.clip((x + amount * x * (1 - x) ** 2) * 255, 0, 255)


def white_balance(img, strength):
    """Šedý svět na středních tónech; strength 0–1 (0 = beze změny)."""
    f = img.astype(np.float32)
    lum = f.mean(axis=2)
    sel = (lum > np.percentile(lum, 20)) & (lum < np.percentile(lum, 95))
    means = f[sel].mean(axis=0)
    gain = means.mean() / np.maximum(means, 1)
    gain = 1 + (gain - 1) * strength
    return np.clip(f * gain, 0, 255)


def levels(f, lo_pct=0.4, hi_pct=99.6, max_gain=1.25):
    lum = f.mean(axis=2)
    lo, hi = np.percentile(lum, lo_pct), np.percentile(lum, hi_pct)
    lo = min(lo, 30)                     # černý bod jen mírně
    gain = min(255 / max(hi - lo, 1), max_gain)
    return np.clip((f - lo) * gain, 0, 255)


def local_contrast(img8, clip, blend):
    lab = cv2.cvtColor(img8, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    l2 = cv2.createCLAHE(clipLimit=clip, tileGridSize=(8, 8)).apply(l)
    l = cv2.addWeighted(l2, blend, l, 1 - blend, 0)
    return cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2BGR)


def vibrance(img8, amount):
    hsv = cv2.cvtColor(img8, cv2.COLOR_BGR2HSV).astype(np.float32)
    s = hsv[..., 1] / 255
    hsv[..., 1] = np.clip((s + amount * s * (1 - s)) * 255, 0, 255)  # méně syté barvy víc
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)


def sharpen(img8, sigma, amount):
    blur = cv2.GaussianBlur(img8, (0, 0), sigma)
    return cv2.addWeighted(img8, 1 + amount, blur, -amount, 0)


def edit(img, profile):
    if profile == "document":
        f = white_balance(img, 0.9)
        f = levels(f, 1.0, 99.0, 1.35)
        out = f.astype(np.uint8)
        out = cv2.fastNlMeansDenoisingColored(out, None, 4, 4, 7, 21)
        return sharpen(out, 1.0, 0.6)
    f = white_balance(img, 0.35)          # teplé světlo u masa zůstává
    f = levels(f)
    f = lift_shadows(f, 0.35)
    out = f.astype(np.uint8)
    out = cv2.fastNlMeansDenoisingColored(out, None, 3, 3, 7, 21)  # artefakty JPEG z Facebooku
    out = local_contrast(out, 1.6, 0.45)
    out = vibrance(out, 0.18)
    return sharpen(out, 1.1, 0.55)


def main(src_dir, out_dir):
    src, out = Path(src_dir), Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    for name, (file, (x0, y0, x1, y1), boxes, profile) in PHOTOS.items():
        img = cv2.imread(str(src / file))
        if img is None:
            sys.exit(f"Nenalezeno: {src / file}")
        img = inpaint(img, boxes)
        img = img[y0:y1, x0:x1]
        res = edit(img, profile)
        cv2.imwrite(str(out / f"{name}.jpg"), res, [cv2.IMWRITE_JPEG_QUALITY, 93])
        print(f"✔ {name}.jpg  {res.shape[1]}×{res.shape[0]}  (z {file})")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
