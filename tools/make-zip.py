#!/usr/bin/env python3
"""Zabalí složku stiborek-web/ do stiborek-web.zip (připraveno k nahrání na hosting).
Zahrnuje i skrytý .htaccess a prázdné složky pro fotografie; vynechává .gitkeep a .DS_Store.

  python3 tools/make-zip.py
"""
import os
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STAMP = (2026, 10, 4, 12, 0, 0)  # pevné datum = stejný obsah → stejný zip

os.chdir(ROOT)
with zipfile.ZipFile("stiborek-web.zip", "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for dp, dn, fn in os.walk("stiborek-web"):
        dn.sort()
        files = [f for f in sorted(fn) if f not in (".DS_Store", ".gitkeep")]
        if not files and not dn:
            zi = zipfile.ZipInfo(dp.rstrip("/") + "/", STAMP)
            zi.external_attr = 0o40755 << 16
            z.writestr(zi, "")
        for f in files:
            p = os.path.join(dp, f)
            zi = zipfile.ZipInfo.from_file(p, p)
            zi.date_time = STAMP
            zi.compress_type = zipfile.ZIP_DEFLATED
            z.writestr(zi, Path(p).read_bytes())
print(f"✔ stiborek-web.zip ({os.path.getsize('stiborek-web.zip') // 1024} kB)")
