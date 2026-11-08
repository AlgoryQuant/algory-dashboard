"""Convert generated Algory brand JPGs to transparent PNGs under public/brand/."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ASSETS = Path(r"C:\Users\Uzivatel\.cursor\projects\c-Users-Uzivatel-algory-dashboard\assets")
OUT = Path(r"C:\Users\Uzivatel\algory-dashboard\public\brand")


def knock_out_bg(img: Image.Image, mode: str, threshold: int = 28) -> Image.Image:
    """Remove near-black (dark) or near-white (light) backgrounds to alpha."""
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if mode == "dark":
                lum = (r + g + b) / 3
                is_emerald = g > r + 15 and g > b + 8 and g > 50
                if is_emerald:
                    continue
                if lum < threshold:
                    px[x, y] = (r, g, b, 0)
                elif lum < threshold * 2.5:
                    alpha = int(255 * (lum - threshold) / max(threshold * 1.5, 1))
                    px[x, y] = (r, g, b, min(a, max(0, alpha)))
            else:
                is_emerald = g > r + 15 and g > b + 8 and g > 50
                if is_emerald:
                    continue
                if r > 255 - threshold and g > 255 - threshold and b > 255 - threshold:
                    px[x, y] = (r, g, b, 0)
                elif (
                    r > 255 - threshold * 2.5
                    and g > 255 - threshold * 2.5
                    and b > 255 - threshold * 2.5
                ):
                    how_white = min(r, g, b)
                    alpha = int(255 * (255 - how_white) / max(threshold * 1.5, 1))
                    px[x, y] = (r, g, b, min(a, max(0, alpha)))
    return rgba


def soften_watermark(img: Image.Image, alpha_scale: float = 0.72) -> Image.Image:
    """Keep geometry; slightly reduce alpha so overlays sit quieter at default opacity."""
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            px[x, y] = (r, g, b, max(0, min(255, int(a * alpha_scale))))
    return rgba


def trim_transparent(img: Image.Image, pad: int = 24) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    l, t, r, b = bbox
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(img.width, r + pad)
    b = min(img.height, b + pad)
    return img.crop((l, t, r, b))


def make_square(img: Image.Image) -> Image.Image:
    side = max(img.width, img.height)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    ox = (side - img.width) // 2
    oy = (side - img.height) // 2
    canvas.paste(img, (ox, oy), img)
    return canvas


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    jobs = [
        # src, dst, knockout mode, square?, watermark soften?
        ("algory-symbol.jpg", "algory-symbol.png", "dark", True, False),
        ("algory-symbol-light.jpg", "algory-symbol-light.png", "light", True, False),
        ("algory-wordmark.jpg", "algory-wordmark.png", "dark", False, False),
        ("algory-watermark.jpg", "algory-watermark.png", "dark", False, True),
    ]

    for src_name, dst_name, mode, square, soft in jobs:
        src = ASSETS / src_name
        if not src.exists():
            print(f"SKIP missing {src}")
            continue
        out = knock_out_bg(Image.open(src), mode=mode, threshold=22 if mode == "dark" else 18)
        if soft:
            out = soften_watermark(out)
        out = trim_transparent(out, pad=56 if square else 48)
        if square:
            out = make_square(out)
        dest = OUT / dst_name
        out.save(dest, "PNG", optimize=True)
        print(f"Wrote {dest} size={out.size} mode={out.mode}")

    print("Done")


if __name__ == "__main__":
    main()
