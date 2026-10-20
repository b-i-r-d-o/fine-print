"""Draws the Fine Print app icons: a folded-corner document with text lines
and one highlighted line, on a sage background. Run: python3 tools/make-icons.py"""
from PIL import Image, ImageDraw

BG = (124, 139, 111)      # sage (Linen accent)
PAPER = (251, 248, 243)
FOLD = (226, 215, 200)
LINE = (190, 178, 163)
MARK = (242, 201, 76)     # highlighter yellow
INK = (59, 52, 46)

def icon(size, maskable=False):
    s = size * 4  # draw large, then shrink for smooth edges
    im = Image.new("RGB", (s, s), BG)
    d = ImageDraw.Draw(im)
    pad = int(s * (0.24 if maskable else 0.18))
    x0, y0, x1, y1 = pad + int(s * 0.04), pad, s - pad - int(s * 0.04), s - pad
    fold = int((x1 - x0) * 0.28)
    r = int(s * 0.035)
    d.rounded_rectangle([x0, y0, x1, y1], radius=r, fill=PAPER)
    d.polygon([(x1 - fold, y0), (x1, y0 + fold), (x1 + 1, y0 - 1)], fill=BG)
    d.polygon([(x1 - fold, y0), (x1 - fold, y0 + fold), (x1, y0 + fold)], fill=FOLD)
    lx0, lx1 = x0 + int((x1 - x0) * 0.16), x1 - int((x1 - x0) * 0.16)
    lh = int(s * 0.028)
    ys = [y0 + int((y1 - y0) * f) for f in (0.36, 0.50, 0.64, 0.78)]
    for i, y in enumerate(ys):
        end = lx1 if i != 3 else lx0 + int((lx1 - lx0) * 0.55)
        if i == 2:
            d.rounded_rectangle([lx0 - int(lh * .6), y - lh, lx1 + int(lh * .6), y + lh * 2], radius=lh, fill=MARK)
            d.rounded_rectangle([lx0, y, end, y + lh], radius=lh // 2, fill=INK)
        else:
            d.rounded_rectangle([lx0, y, end, y + lh], radius=lh // 2, fill=LINE)
    return im.resize((size, size), Image.LANCZOS)

icon(192).save("public/icons/icon-192.png")
icon(512).save("public/icons/icon-512.png")
icon(512, maskable=True).save("public/icons/icon-maskable-512.png")
icon(180).save("public/icons/apple-touch-icon.png")
print("icons written")
