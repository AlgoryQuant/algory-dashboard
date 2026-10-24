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
                is_emerald = g > r + 20 and g > b + 10
                if is_emerald:
                    continue
                if lum < threshold:
                    px[x, y] = (r, g, b, 0)
                elif lum < threshold * 2:
                    alpha = int(255 * (lum - threshold) / max(threshold, 1))
                    px[x, y] = (r, g, b, min(a, alpha))
            else:
                is_emerald = g > r + 20 and g > b + 10
                if is_emerald:
                    continue
                if r > 255 - threshold and g > 255 - threshold and b > 255 - threshold:
                    px[x, y] = (r, g, b, 0)
                elif (
                    r > 255 - threshold * 2
                    and g > 255 - threshold * 2
                    and b > 255 - threshold * 2
                ):
                    how_white = min(r, g, b)
                    alpha = int(255 * (255 - how_white) / max(threshold, 1))
                    px[x, y] = (r, g, b, min(a, max(0, alpha)))
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


def render_tick_a(size: int = 1024, light: bool = False, scale: int = 4) -> Image.Image:
    """
    Crisp vector-faithful Tick A mark (matches app/brand/AlgoryMark.tsx viewBox).
    Drawn oversized then downsampled for clean antialiased strokes.
    """
    from PIL import ImageDraw

    big = size * scale
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Scale from 32x32 viewBox
    s = big / 32.0
    stroke = max(2, int(round(2.4 * s)))
    leg = (17, 17, 17, 255) if light else (255, 255, 255, 255)
    tick = (16, 185, 129, 255)  # emerald-500

    def pt(x: float, y: float) -> tuple[float, float]:
        return (x * s, y * s)

    # A silhouette — left / right legs (M5.5 27 L16 3.5 L26.5 27)
    draw.line([pt(5.5, 27), pt(16, 3.5), pt(26.5, 27)], fill=leg, width=stroke, joint="miter")

    # Rising tick as crossbar (M9.5 18.5 H15 L18.75 13.25 L22 16.25)
    draw.line(
        [pt(9.5, 18.5), pt(15, 18.5), pt(18.75, 13.25), pt(22, 16.25)],
        fill=tick,
        width=stroke,
        joint="miter",
    )
    # Corner tick (M19.75 16.25 H22 V13.75)
    draw.line(
        [pt(19.75, 16.25), pt(22, 16.25), pt(22, 13.75)],
        fill=tick,
        width=stroke,
        joint="miter",
    )

    return img.resize((size, size), Image.Resampling.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    jobs = [
        ("algory-mark.jpg", "algory-mark.png", "dark", True),
        ("algory-wordmark.jpg", "algory-wordmark.png", "dark", False),
        ("algory-watermark.jpg", "algory-watermark.png", "dark", False),
        ("algory-wordmark-light.jpg", "algory-wordmark-light.png", "light", False),
    ]

    for src_name, dst_name, mode, square in jobs:
        src = ASSETS / src_name
        if not src.exists():
            print(f"SKIP missing {src}")
            continue
        out = knock_out_bg(Image.open(src), mode=mode, threshold=30 if mode == "dark" else 24)
        out = trim_transparent(out, pad=40 if square else 32)
        if square:
            out = make_square(out)
        dest = OUT / dst_name
        out.save(dest, "PNG", optimize=True)
        print(f"Wrote {dest} size={out.size}")

    # Crisp geometric symbol PNGs matching the in-app Tick A SVG
    for light, name in ((False, "algory-symbol.png"), (True, "algory-symbol-light.png")):
        sym = render_tick_a(1024, light=light)
        dest = OUT / name
        sym.save(dest, "PNG", optimize=True)
        print(f"Wrote {dest} size={sym.size}")

    print("Done")


if __name__ == "__main__":
    main()
