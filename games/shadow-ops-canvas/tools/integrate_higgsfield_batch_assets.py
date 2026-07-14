from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "mission"
REPORT = ROOT / "docs" / "higgsfield-batch-assets-report.json"

COLS = 5
ROWS = 4
CELL = 256

SHEETS = [
    {
        "name": "batch_props",
        "source": ASSETS / "higgsfield_batch_props_source_20260624.jpeg",
        "alpha": ASSETS / "higgsfield_batch_props_alpha_20260624.png",
        "runtime": ASSETS / "higgsfield_batch_props_runtime_v1.png",
        "crop_label_band": 0,
        "padding": 18,
    },
    {
        "name": "batch_fx",
        "source": ASSETS / "higgsfield_batch_fx_retry_source_20260624.jpeg",
        "alpha": ASSETS / "higgsfield_batch_fx_retry_alpha_20260624.png",
        "runtime": ASSETS / "higgsfield_batch_fx_retry_runtime_v1.png",
        "crop_label_band": 0,
        "padding": 18,
    },
    {
        "name": "batch_world",
        "source": ASSETS / "higgsfield_batch_world_source_20260624.png",
        "alpha": ASSETS / "higgsfield_batch_world_alpha_20260624.png",
        "runtime": ASSETS / "higgsfield_batch_world_runtime_v1.png",
        "crop_label_band": 0,
        "padding": 18,
    },
]


def alpha_bbox(image: Image.Image):
    return image.convert("RGBA").getchannel("A").getbbox()


def key_green(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = []
    for r, g, b, a in rgba.getdata():
        key_green = g > 128 and r < 118 and b < 126 and g > r * 1.25 and g > b * 1.18
        dark_grid = r < 24 and g < 38 and b < 26
        if key_green or dark_grid:
            pixels.append((0, 0, 0, 0))
            continue
        if g > max(r, b) + 34 and r < 170 and b < 190:
            g = max(r, b) + 18
        pixels.append((r, g, b, a))
    out = Image.new("RGBA", rgba.size)
    out.putdata(pixels)
    return out


def remove_text_band(cell: Image.Image, band_height: int) -> Image.Image:
    if band_height <= 0:
        return cell
    w, h = cell.size
    keep_h = max(1, h - band_height)
    return cell.crop((0, 0, w, keep_h))


def source_cell(image: Image.Image, index: int, crop_label_band: int) -> Image.Image:
    col = index % COLS
    row = index // COLS
    w, h = image.size
    inset = 14
    x0 = round(col * w / COLS) + inset
    y0 = round(row * h / ROWS) + inset
    x1 = round((col + 1) * w / COLS) - inset
    y1 = round((row + 1) * h / ROWS) - inset
    return remove_text_band(image.crop((x0, y0, x1, y1)), crop_label_band)


def paste_fit(canvas: Image.Image, sprite: Image.Image, index: int, padding: int) -> bool:
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


def build_sheet(spec: dict) -> dict | None:
    source = spec["source"]
    if not source.exists():
        return None
    cleaned = key_green(Image.open(source))
    cleaned.save(spec["alpha"])
    out = Image.new("RGBA", (CELL * COLS, CELL * ROWS), (0, 0, 0, 0))
    for index in range(COLS * ROWS):
        cell = source_cell(cleaned, index, spec["crop_label_band"])
        paste_fit(out, cell, index, spec["padding"])
    out.save(spec["runtime"])
    return audit_sheet(spec["runtime"], spec["name"])


def audit_sheet(path: Path, name: str) -> dict:
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
            if a > 0 and g > 145 and r < 125 and b < 130 and g > r * 1.22 and g > b * 1.16
        )
    return {
        "name": name,
        "path": str(path.relative_to(ROOT)),
        "size": list(image.size),
        "empty": empty,
        "clipped": clipped,
        "green_pixels": green_pixels,
    }


def main():
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    audits = []
    outputs = {}
    for spec in SHEETS:
        audit = build_sheet(spec)
        if audit:
            audits.append(audit)
            outputs[spec["name"]] = {
                "source": str(spec["source"].relative_to(ROOT)),
                "alpha": str(spec["alpha"].relative_to(ROOT)),
                "runtime": str(spec["runtime"].relative_to(ROOT)),
            }
    report = {"outputs": outputs, "audits": audits}
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
