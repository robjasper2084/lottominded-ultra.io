from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"

SOURCE = ASSETS / "mission" / "higgsfield_fx_repair_source_20260624.jpeg"
ALPHA_SOURCE = ASSETS / "mission" / "higgsfield_fx_repair_alpha_20260624.png"
RUNTIME = ASSETS / "mission" / "higgsfield_fx_repair_runtime_v1.png"
REPORT = ROOT / "docs" / "higgsfield-fx-repair-report.json"

COLS = 5
ROWS = 4
CELL = 256


def key_green(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = []
    for r, g, b, a in rgba.getdata():
        green = (
            (g > 145 and g > r * 1.32 and g > b * 1.32)
            or (g > 70 and r < 80 and b < 80 and g > r * 1.08 and g > b * 1.08)
            or (g > 34 and r < 8 and b < 8)
        )
        black_grid = r < 18 and g < 26 and b < 18
        if green or black_grid:
            pixels.append((0, 0, 0, 0))
        else:
            # Nudge away tiny spill without damaging yellow/magenta glows.
            if g > max(r, b) + 28 and g > 80:
                g = max(r, b) + 18
            pixels.append((r, g, b, a))
    out = Image.new("RGBA", rgba.size)
    out.putdata(pixels)
    return out


def remove_green_spill(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = []
    for r, g, b, a in rgba.getdata():
        if a == 0:
            pixels.append((r, g, b, a))
            continue
        hard_green = (
            g > 96
            and g > r * 1.18
            and g > b * 1.18
            and r < 150
            and b < 150
        )
        dark_green = g > 42 and r < 20 and b < 20
        if hard_green or dark_green:
            pixels.append((0, 0, 0, 0))
            continue
        if g > max(r, b) + 34 and r < 170 and b < 190:
            g = max(r, b) + 20
        pixels.append((r, g, b, a))
    out = Image.new("RGBA", rgba.size)
    out.putdata(pixels)
    return out


def alpha_bbox(image: Image.Image):
    return image.convert("RGBA").getchannel("A").getbbox()


def paste_fit(canvas: Image.Image, sprite: Image.Image, index: int, padding: int = 18) -> bool:
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


def source_cell(image: Image.Image, index: int) -> Image.Image:
    col = index % COLS
    row = index // COLS
    w, h = image.size
    inset = 8
    x0 = round(col * w / COLS) + inset
    y0 = round(row * h / ROWS) + inset
    x1 = round((col + 1) * w / COLS) - inset
    y1 = round((row + 1) * h / ROWS) - inset
    return image.crop((x0, y0, x1, y1))


def build_runtime(source: Image.Image) -> Image.Image:
    cleaned = key_green(source)
    cleaned.save(ALPHA_SOURCE)
    out = Image.new("RGBA", (CELL * COLS, CELL * ROWS), (0, 0, 0, 0))
    for index in range(COLS * ROWS):
        cell = source_cell(cleaned, index)
        # Keep beams and muzzle flashes slightly wider.
        padding = 12 if index in {15, 16, 17, 18} else 18
        paste_fit(out, cell, index, padding=padding)
    repair_frames(out)
    return remove_green_spill(out)


def clear_cell(sheet: Image.Image, index: int) -> None:
    x = (index % COLS) * CELL
    y = (index // COLS) * CELL
    sheet.paste((0, 0, 0, 0), (x, y, x + CELL, y + CELL))


def put_cell(sheet: Image.Image, index: int, cell: Image.Image) -> None:
    x = (index % COLS) * CELL
    y = (index // COLS) * CELL
    sheet.alpha_composite(cell, (x, y))


def heart_points(cx: float, cy: float, scale: float):
    points = []
    for step in range(144):
        t = (math.pi * 2 * step) / 144
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        points.append((cx + x * scale, cy - y * scale))
    return points


def draw_heart(draw: ImageDraw.ImageDraw, cx: int, cy: int, scale: float) -> None:
    pts = heart_points(cx, cy, scale)
    draw.line(pts + [pts[0]], fill=(20, 10, 28, 255), width=max(6, round(scale * 3)), joint="curve")
    draw.line(pts + [pts[0]], fill=(255, 214, 109, 255), width=max(3, round(scale * 1.35)), joint="curve")
    draw.polygon(pts, fill=(255, 65, 150, 255))
    draw.line(pts + [pts[0]], fill=(255, 232, 246, 205), width=max(1, round(scale * 0.8)), joint="curve")
    draw.ellipse((cx - scale * 3.8, cy - scale * 4.8, cx + scale * 1.2, cy - scale * 1.2), fill=(255, 239, 249, 135))


def make_heart_projectile(frame: int) -> Image.Image:
    cell = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    d = ImageDraw.Draw(cell)
    specs = {
        2: {"heart": (150, 130, 2.42), "tail": 78, "wide": 22},
        3: {"heart": (164, 128, 2.92), "tail": 112, "wide": 30},
        4: {"heart": (162, 128, 3.02), "tail": 104, "wide": 28},
        5: {"heart": (142, 130, 2.28), "tail": 56, "wide": 18},
    }[frame]
    cx, cy, scale = specs["heart"]
    tail = specs["tail"]
    wide = specs["wide"]
    start = max(24, cx - tail)
    end = cx - round(scale * 3.6)
    glow = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for offset, color in enumerate([(166, 34, 255, 115), (255, 67, 166, 145), (255, 214, 109, 70)]):
        gd.polygon([(start + offset * 5, cy), (end, cy - 7 - offset), (end, cy + 7 + offset), (start + offset * 5, cy)], fill=color)
    glow = glow.filter(ImageFilter.GaussianBlur(8))
    cell.alpha_composite(glow)
    d = ImageDraw.Draw(cell)
    d.polygon([(start, cy), (end, cy - 8), (end, cy + 8)], fill=(166, 34, 255, 180))
    d.polygon([(start + 14, cy), (end - 4, cy - 4), (end - 4, cy + 4)], fill=(255, 80, 180, 210))
    for i in range(5):
        px = start + 16 + i * max(10, tail // 6)
        py = cy + (-1 if i % 2 else 1) * (wide * 0.48 + i % 3)
        d.ellipse((px - 3, py - 3, px + 3, py + 3), fill=(255, 227, 125, 170))
    halo = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    hd.ellipse((cx - scale * 12, cy - scale * 11, cx + scale * 12, cy + scale * 11), fill=(255, 57, 162, 70))
    halo = halo.filter(ImageFilter.GaussianBlur(9))
    cell.alpha_composite(halo)
    draw_heart(ImageDraw.Draw(cell), cx, cy, scale)
    return cell


def repair_frames(sheet: Image.Image) -> None:
    # User-called frames are 1-indexed; replace 2-5 with contained,
    # centered heart projectile cells so the trail never crosses frame bounds.
    for frame_number in (2, 3, 4, 5):
        index = frame_number - 1
        clear_cell(sheet, index)
        put_cell(sheet, index, make_heart_projectile(frame_number))


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
        green_pixels += sum(1 for r, g, b, a in cell.getdata() if a > 0 and g > 145 and g > r * 1.28 and g > b * 1.28)
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
