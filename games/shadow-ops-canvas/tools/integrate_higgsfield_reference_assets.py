from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"

SOURCE = ASSETS / "mission" / "higgsfield_reference_assets_source_20260624.png"
ALPHA_SOURCE = ASSETS / "mission" / "higgsfield_reference_assets_alpha_20260624.png"
RUNTIME = ASSETS / "mission" / "higgsfield_reference_assets_runtime_v1.png"
REPORT = ROOT / "docs" / "higgsfield-reference-assets-report.json"

COLS = 5
ROWS = 4
CELL = 256


def alpha_bbox(image: Image.Image):
    return image.convert("RGBA").getchannel("A").getbbox()


def key_background(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = []
    for r, g, b, a in rgba.getdata():
        bright_key_green = g > 150 and r < 115 and b < 120 and g > r * 1.35 and g > b * 1.25
        dark_grid = r < 24 and g < 42 and b < 28
        if bright_key_green or dark_grid:
            pixels.append((0, 0, 0, 0))
            continue
        if g > max(r, b) + 38 and r < 160 and b < 180:
            g = max(r, b) + 22
        pixels.append((r, g, b, a))
    out = Image.new("RGBA", rgba.size)
    out.putdata(pixels)
    return out


def source_cell(image: Image.Image, index: int) -> Image.Image:
    col = index % COLS
    row = index // COLS
    w, h = image.size
    inset = 16
    x0 = round(col * w / COLS) + inset
    y0 = round(row * h / ROWS) + inset
    x1 = round((col + 1) * w / COLS) - inset
    y1 = round((row + 1) * h / ROWS) - inset
    return image.crop((x0, y0, x1, y1))


def paste_fit(canvas: Image.Image, sprite: Image.Image, index: int, padding: int = 20) -> bool:
    bbox = alpha_bbox(sprite)
    if not bbox:
        return False
    crop = sprite.crop(bbox)
    max_w = CELL - padding * 2
    max_h = CELL - padding * 2
    scale = min(max_w / crop.width, max_h / crop.height)
    size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
    crop = crop.resize(size, Image.Resampling.LANCZOS)
    x = (index % COLS) * CELL + (CELL - crop.width) // 2
    y = (index // COLS) * CELL + (CELL - crop.height) // 2
    canvas.alpha_composite(crop, (x, y))
    return True


def clean_runtime_spill(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = []
    for offset, (r, g, b, a) in enumerate(rgba.getdata()):
        if a == 0:
            pixels.append((r, g, b, a))
            continue
        x = offset % rgba.width
        y = offset // rgba.width
        col = x // CELL
        row = y // CELL
        index = row * COLS + col
        preserve_green_crystal = index == 13
        green_spill = g > 82 and g > r * 1.12 and g > b * 1.12 and r < 180 and b < 190
        if green_spill and not preserve_green_crystal:
            pixels.append((0, 0, 0, 0))
            continue
        if green_spill and preserve_green_crystal and r < 42 and b < 80:
            pixels.append((0, 0, 0, 0))
            continue
        if g > max(r, b) + 34 and not preserve_green_crystal:
            g = max(r, b) + 18
        pixels.append((r, g, b, a))
    out = Image.new("RGBA", rgba.size)
    out.putdata(pixels)
    return out


def build_runtime(source: Image.Image) -> Image.Image:
    cleaned = key_background(source)
    cleaned.save(ALPHA_SOURCE)
    out = Image.new("RGBA", (CELL * COLS, CELL * ROWS), (0, 0, 0, 0))
    for index in range(COLS * ROWS):
        cell = source_cell(cleaned, index)
        padding = 14 if index in {5, 6, 7, 8, 9, 18} else 20
        paste_fit(out, cell, index, padding=padding)
    return clean_runtime_spill(out)


def audit_sheet(path: Path):
    image = Image.open(path).convert("RGBA")
    clipped = []
    empty = []
    green_pixels = 0
    for index in range(COLS * ROWS):
        x = (index % COLS) * CELL
        y = (index // COLS) * CELL
        cell = image.crop((x, y, x + CELL, y + CELL))
        bbox = alpha_bbox(cell)
        if not bbox:
            empty.append(index + 1)
            continue
        margin = min(bbox[0], bbox[1], CELL - bbox[2], CELL - bbox[3])
        if margin < 2:
            clipped.append({"frame": index + 1, "margin": margin, "bbox": bbox})
        green_pixels += sum(
            1
            for r, g, b, a in cell.getdata()
            if a > 0 and g > 150 and r < 115 and b < 120 and g > r * 1.28 and g > b * 1.2
        )
    return {
        "path": str(path.relative_to(ROOT)),
        "size": list(image.size),
        "empty": empty,
        "clipped": clipped,
        "green_pixels": green_pixels,
    }


def main():
    RUNTIME.parent.mkdir(parents=True, exist_ok=True)
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    runtime = build_runtime(Image.open(SOURCE))
    runtime.save(RUNTIME)
    report = {
        "source": str(SOURCE.relative_to(ROOT)),
        "outputs": {
            "alpha": str(ALPHA_SOURCE.relative_to(ROOT)),
            "runtime": str(RUNTIME.relative_to(ROOT)),
        },
        "audit": audit_sheet(RUNTIME),
    }
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
