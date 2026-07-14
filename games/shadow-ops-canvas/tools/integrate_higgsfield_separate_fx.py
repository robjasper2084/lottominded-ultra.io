from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
MISSION = ROOT / "assets" / "mission"
SOURCE_DIR = MISSION / "higgsfield_separate_cell_sources"
CELL_DIR = MISSION / "higgsfield_separate_fx_cells"
BASE_SHEET = MISSION / "higgsfield_separate_fx_repair_runtime_v2.png"
OUTPUT_SHEET = MISSION / "higgsfield_separate_fx_repair_runtime_v3.png"
PREVIEW = ROOT / "docs" / "higgsfield-separate-fx-v3-preview.png"
REPORT = ROOT / "docs" / "higgsfield-separate-fx-v3-report.json"

CELL = 256
COLS = 5
ROWS = 4
TARGET_FRAMES = (2, 3, 4, 5, 6, 17, 18, 19)
PADDING = 22


def key_green(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            is_green = g > 80 and g > r * 1.06 and g > b * 1.06
            near_green = g > 145 and r < 105 and b < 125
            if is_green or near_green:
                pixels[x, y] = (r, g, b, 0)
            elif g > r * 1.12 and g > b * 1.12:
                pixels[x, y] = (r, max(r, b), b, a)

    alpha = rgba.getchannel("A")
    alpha = alpha.filter(ImageFilter.MedianFilter(3))
    alpha = alpha.point(lambda p: 0 if p < 24 else min(255, int(p * 1.08)))
    rgba.putalpha(alpha)
    pixels = rgba.load()
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                pixels[x, y] = (0, 0, 0, 0)
            elif a < 210 and g > r * 1.05 and g > b * 1.05:
                pixels[x, y] = (r, max(r, b), b, 0)
    return rgba


def alpha_bbox(img: Image.Image) -> tuple[int, int, int, int] | None:
    alpha = img.getchannel("A")
    return alpha.point(lambda p: 255 if p > 12 else 0).getbbox()


def centered_cell(source: Image.Image, frame: int) -> tuple[Image.Image, dict]:
    keyed = key_green(source)
    bbox = alpha_bbox(keyed)
    if not bbox:
        raise ValueError(f"frame {frame:02d} has no alpha content after keying")

    cropped = keyed.crop(bbox)
    max_w = CELL - PADDING * 2
    max_h = CELL - PADDING * 2
    scale = min(max_w / cropped.width, max_h / cropped.height, 1.0)
    out_w = max(1, round(cropped.width * scale))
    out_h = max(1, round(cropped.height * scale))
    resized = cropped.resize((out_w, out_h), Image.Resampling.LANCZOS)
    px = resized.load()
    for y in range(resized.height):
        for x in range(resized.width):
            r, g, b, a = px[x, y]
            if a == 0:
                px[x, y] = (0, 0, 0, 0)
            elif a < 220 and g > r * 1.05 and g > b * 1.05:
                px[x, y] = (r, max(r, b), b, 0)

    cell = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    x = (CELL - out_w) // 2
    y = (CELL - out_h) // 2
    cell.alpha_composite(resized, (x, y))

    touches_source_edge = bbox[0] <= 2 or bbox[1] <= 2 or bbox[2] >= source.width - 2 or bbox[3] >= source.height - 2
    return cell, {
        "frame": frame,
        "source_size": [source.width, source.height],
        "bbox": list(bbox),
        "cell_content_size": [out_w, out_h],
        "touches_source_edge": touches_source_edge,
    }


def source_for_frame(frame: int) -> Path:
    path = SOURCE_DIR / f"frame_{frame:02d}_source_higgsfield_20260624.jpeg"
    if not path.exists():
        raise FileNotFoundError(path)
    return path


def paste_cell(sheet: Image.Image, frame: int, cell: Image.Image) -> None:
    idx = frame - 1
    x = (idx % COLS) * CELL
    y = (idx // COLS) * CELL
    sheet.paste((0, 0, 0, 0), (x, y, x + CELL, y + CELL))
    sheet.alpha_composite(cell, (x, y))


def build_preview(sheet: Image.Image) -> Image.Image:
    checker = Image.new("RGBA", sheet.size, (18, 18, 24, 255))
    px = checker.load()
    block = 32
    for y in range(sheet.height):
        for x in range(sheet.width):
            if ((x // block) + (y // block)) % 2 == 0:
                px[x, y] = (34, 31, 42, 255)
    checker.alpha_composite(sheet)
    return checker


def build() -> dict:
    CELL_DIR.mkdir(parents=True, exist_ok=True)
    REPORT.parent.mkdir(parents=True, exist_ok=True)

    sheet = Image.open(BASE_SHEET).convert("RGBA")
    if sheet.size != (COLS * CELL, ROWS * CELL):
        sheet = sheet.resize((COLS * CELL, ROWS * CELL), Image.Resampling.LANCZOS)

    frames = []
    for frame in TARGET_FRAMES:
        source_path = source_for_frame(frame)
        source = Image.open(source_path).convert("RGBA")
        cell, info = centered_cell(source, frame)
        out_cell = CELL_DIR / f"frame_{frame:02d}.png"
        cell.save(out_cell)
        paste_cell(sheet, frame, cell)
        info["source"] = str(source_path.relative_to(ROOT))
        info["output"] = str(out_cell.relative_to(ROOT))
        frames.append(info)

    sheet.save(OUTPUT_SHEET)
    preview = build_preview(sheet)
    preview.save(PREVIEW)

    report = {
        "base_sheet": str(BASE_SHEET.relative_to(ROOT)),
        "output_sheet": str(OUTPUT_SHEET.relative_to(ROOT)),
        "preview": str(PREVIEW.relative_to(ROOT)),
        "frames": frames,
    }
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


if __name__ == "__main__":
    print(json.dumps(build(), indent=2))
