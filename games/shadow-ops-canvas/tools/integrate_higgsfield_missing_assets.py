from __future__ import annotations

import json
import math
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"

SOURCE = ASSETS / "mission" / "higgsfield_missing_assets_source_20260623.jpeg"
ALPHA_SOURCE = ASSETS / "mission" / "higgsfield_missing_assets_alpha_20260623.png"
WORLD_RUNTIME = ASSETS / "mission" / "higgsfield_missing_world_props_runtime_v1.png"
FX_RUNTIME = ASSETS / "mission" / "higgsfield_missing_fx_sheet_runtime_v1.png"
REPORT = ROOT / "docs" / "higgsfield-missing-assets-report.json"

CELL = 256

BOXES = {
    "wall_vertical": (276, 18, 520, 172),
    "wall_circuit": (568, 18, 815, 172),
    "wall_cross": (865, 18, 1114, 172),
    "platform_short": (296, 198, 458, 292),
    "platform_bridge": (512, 198, 822, 292),
    "platform_core": (890, 198, 1110, 292),
    "vault_eye": (300, 308, 514, 504),
    "vault_gold": (590, 308, 792, 504),
    "vault_bar": (880, 308, 1088, 504),
    "heart_idle": (98, 508, 194, 612),
    "heart_dash_1": (318, 500, 472, 616),
    "heart_dash_2": (545, 494, 720, 620),
    "heart_dash_3": (732, 482, 914, 620),
    "shield_orb": (965, 506, 1086, 620),
    "shield_badge": (1152, 488, 1262, 632),
    "shard_single": (100, 638, 192, 752),
    "shard_pair": (318, 630, 426, 752),
    "spark_pink": (540, 618, 690, 764),
    "spark_gold": (722, 618, 872, 764),
    "muzzle_short": (945, 630, 1118, 752),
    "muzzle_long": (1128, 630, 1300, 752),
}

WORLD_CELLS = [
    "wall_vertical",
    "wall_circuit",
    "wall_cross",
    "platform_short",
    "platform_bridge",
    "platform_core",
    "vault_eye",
    "vault_gold",
    "vault_bar",
    "heart_idle",
    "shield_orb",
    "shield_badge",
    "shard_single",
    "shard_pair",
    "spark_pink",
    "spark_gold",
]

FX_ROWS = [
    ["heart_idle", "heart_dash_1", "heart_dash_2", "heart_dash_3", "heart_dash_2"],
    ["spark_pink", "spark_gold", "shield_orb", "shard_pair", "shard_single"],
    ["shield_badge", "vault_eye", "vault_gold", "vault_bar", "shield_orb"],
    ["muzzle_short", "muzzle_long", "heart_dash_3", "heart_dash_2", "spark_gold"],
]

INTERNAL_CHECKER_CLEAN = {
    "shield_orb",
    "shard_single",
    "shard_pair",
    "spark_pink",
    "spark_gold",
    "muzzle_short",
    "muzzle_long",
}


def ensure_rgba(image: Image.Image) -> Image.Image:
    return image.copy() if image.mode == "RGBA" else image.convert("RGBA")


def looks_like_checker_background(pixel) -> bool:
    r, g, b, a = pixel
    if a < 8:
        return True
    avg = (r + g + b) / 3
    spread = max(r, g, b) - min(r, g, b)
    return 76 <= avg <= 215 and spread <= 18


def looks_like_tinted_checker(pixel) -> bool:
    r, g, b, a = pixel
    if a < 8:
        return True
    avg = (r + g + b) / 3
    spread = max(r, g, b) - min(r, g, b)
    if not (78 <= avg <= 215 and spread <= 88):
        return False
    # Keep saturated glows, bright specular highlights, black outlines, and gold sparks.
    if max(r, g, b) > 226 or min(r, g, b) < 52:
        return False
    if r > 190 and b > 185 and g < 150:
        return False
    if r > 205 and g > 160 and b < 130:
        return False
    return True


def edge_key_checker(image: Image.Image) -> Image.Image:
    rgba = ensure_rgba(image)
    w, h = rgba.size
    pixels = rgba.load()
    alpha = rgba.getchannel("A")
    queue = deque()
    seen = set()

    def seed(x: int, y: int) -> None:
      if (x, y) not in seen and looks_like_checker_background(pixels[x, y]):
          seen.add((x, y))
          queue.append((x, y))

    for x in range(w):
        seed(x, 0)
        seed(x, h - 1)
    for y in range(h):
        seed(0, y)
        seed(w - 1, y)

    while queue:
        x, y = queue.popleft()
        alpha.putpixel((x, y), 0)
        for nx in (x - 1, x, x + 1):
            for ny in (y - 1, y, y + 1):
                if nx < 0 or ny < 0 or nx >= w or ny >= h or (nx, ny) in seen:
                    continue
                if looks_like_checker_background(pixels[nx, ny]):
                    seen.add((nx, ny))
                    queue.append((nx, ny))

    # Knock out the soft JPEG checker fringe that clings to transparent edges.
    transparent = alpha.point(lambda p: 255 if p < 8 else 0).filter(ImageFilter.MaxFilter(5))
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if transparent.getpixel((x, y)) and looks_like_checker_background((r, g, b, a)):
                alpha.putpixel((x, y), 0)

    rgba.putalpha(alpha)
    return rgba


def remove_internal_checker(image: Image.Image) -> Image.Image:
    rgba = ensure_rgba(image)
    pixels = rgba.load()
    alpha = rgba.getchannel("A")
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a > 0 and (looks_like_checker_background((r, g, b, a)) or looks_like_tinted_checker((r, g, b, a))):
                alpha.putpixel((x, y), 0)
    rgba.putalpha(alpha)
    return rgba


def alpha_bbox(image: Image.Image):
    return ensure_rgba(image).getchannel("A").getbbox()


def paste_fit(canvas: Image.Image, sprite: Image.Image, cell_index: int, cols: int, padding: int = 18, bottom_anchor: bool = False) -> bool:
    bbox = alpha_bbox(sprite)
    if not bbox:
        return False
    crop = sprite.crop(bbox)
    row = cell_index // cols
    col = cell_index % cols
    max_w = CELL - padding * 2
    max_h = CELL - padding * 2
    scale = min(max_w / crop.width, max_h / crop.height)
    size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
    crop = crop.resize(size, Image.Resampling.LANCZOS)
    x = col * CELL + (CELL - crop.width) // 2
    y = row * CELL + CELL - padding - crop.height if bottom_anchor else row * CELL + (CELL - crop.height) // 2
    canvas.alpha_composite(crop, (x, y))
    return True


def sprite(source: Image.Image, name: str) -> Image.Image:
    cutout = edge_key_checker(source.crop(BOXES[name]))
    if name in INTERNAL_CHECKER_CLEAN:
        cutout = remove_internal_checker(cutout)
    return cutout


def build_alpha_source(source: Image.Image) -> Image.Image:
    out = Image.new("RGBA", source.size, (0, 0, 0, 0))
    for name, box in BOXES.items():
        cutout = sprite(source, name)
        out.alpha_composite(cutout, (box[0], box[1]))
    return out


def build_world_sheet(source: Image.Image) -> Image.Image:
    out = Image.new("RGBA", (CELL * 4, CELL * 4), (0, 0, 0, 0))
    for index, name in enumerate(WORLD_CELLS):
        paste_fit(out, sprite(source, name), index, 4, padding=18, bottom_anchor=name.startswith("platform"))
    return out


def build_fx_sheet(source: Image.Image) -> Image.Image:
    out = Image.new("RGBA", (CELL * 5, CELL * 4), (0, 0, 0, 0))
    for row, names in enumerate(FX_ROWS):
        for col, name in enumerate(names):
            paste_fit(out, sprite(source, name), row * 5 + col, 5, padding=18)
    repair_fx_cells(out)
    return out


def cell_origin(index: int, cols: int = 5) -> tuple[int, int]:
    return (index % cols) * CELL, (index // cols) * CELL


def alpha_composite_cell(sheet: Image.Image, index: int, cell: Image.Image, cols: int = 5) -> None:
    x, y = cell_origin(index, cols)
    sheet.alpha_composite(cell, (x, y))


def heart_points(cx: float, cy: float, scale: float):
    points = []
    for step in range(144):
        t = (math.pi * 2 * step) / 144
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        points.append((cx + x * scale, cy - y * scale))
    return points


def draw_heart(draw: ImageDraw.ImageDraw, cx: int, cy: int, scale: float, fill=(255, 74, 154, 255), outline=True):
    pts = heart_points(cx, cy, scale)
    if outline:
        draw.line(pts + [pts[0]], fill=(8, 7, 12, 255), width=max(5, round(scale * 3.2)), joint="curve")
        draw.line(pts + [pts[0]], fill=(255, 214, 109, 255), width=max(3, round(scale * 1.35)), joint="curve")
    draw.polygon(pts, fill=fill)
    draw.line(pts + [pts[0]], fill=(255, 238, 210, 210), width=max(1, round(scale * 0.75)), joint="curve")
    draw.ellipse((cx - scale * 2.8, cy - scale * 4.8, cx + scale * 2.2, cy - scale * 1.6), fill=(255, 221, 246, 120))


def draw_trail(draw: ImageDraw.ImageDraw, intensity: float, end_x: int, end_y: int, length: int):
    for i, color in enumerate([(255, 82, 166, 190), (164, 34, 255, 150), (255, 214, 109, 115)]):
        spread = 16 + i * 9
        draw.polygon(
            [
                (end_x - length, end_y - spread),
                (end_x - 8, end_y - 7 - i * 3),
                (end_x - 8, end_y + 7 + i * 3),
                (end_x - length, end_y + spread),
            ],
            fill=color,
        )
    for p in range(max(3, round(8 * intensity))):
        px = end_x - length + 18 + p * max(10, length // 8)
        py = end_y + (-1 if p % 2 else 1) * (12 + (p % 3) * 7)
        draw.ellipse((px - 3, py - 3, px + 3, py + 3), fill=(255, 226, 122, 190))


def make_heart_projectile(frame: int) -> Image.Image:
    cell = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    glow = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    d = ImageDraw.Draw(cell)
    specs = [
        (128, 132, 5.2, 0, 0.0),
        (148, 134, 3.2, 58, 0.55),
        (154, 132, 2.65, 92, 0.72),
        (166, 130, 3.55, 118, 1.0),
        (150, 134, 2.9, 80, 0.68),
    ]
    cx, cy, scale, trail, intensity = specs[frame]
    if trail:
        draw_trail(gd, intensity, cx - round(scale * 4), cy, trail)
        glow = glow.filter(ImageFilter.GaussianBlur(8))
        cell.alpha_composite(glow)
        draw_trail(d, intensity, cx - round(scale * 4), cy, trail)
    halo = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    hd.ellipse((cx - scale * 12, cy - scale * 11, cx + scale * 12, cy + scale * 11), fill=(255, 68, 165, 72))
    halo = halo.filter(ImageFilter.GaussianBlur(9))
    cell.alpha_composite(halo)
    draw_heart(ImageDraw.Draw(cell), cx, cy, scale)
    return cell


def star_points(cx: int, cy: int, outer: int, inner: int, points: int = 12, rotation: float = 0.0):
    pts = []
    for i in range(points * 2):
        radius = outer if i % 2 == 0 else inner
        angle = rotation + (math.pi * i) / points
        pts.append((cx + math.cos(angle) * radius, cy + math.sin(angle) * radius))
    return pts


def make_spark(frame: int, gold: bool = False) -> Image.Image:
    cell = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    cx = 128
    cy = 128
    outer = [70, 82, 66, 76, 50][frame % 5]
    inner = [18, 24, 14, 20, 12][frame % 5]
    main = (255, 222, 94, 255) if gold else (255, 55, 184, 255)
    edge = (255, 245, 180, 220) if gold else (174, 48, 255, 225)
    glow = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.polygon(star_points(cx, cy, outer, inner, 14, frame * 0.12), fill=(*main[:3], 120))
    glow = glow.filter(ImageFilter.GaussianBlur(12))
    cell.alpha_composite(glow)
    d = ImageDraw.Draw(cell)
    d.polygon(star_points(cx, cy, outer, inner, 14, frame * 0.12), fill=main)
    d.polygon(star_points(cx, cy, round(outer * 0.66), round(inner * 0.55), 14, frame * 0.12 + 0.12), fill=edge)
    d.ellipse((cx - 10, cy - 10, cx + 10, cy + 10), fill=(255, 255, 255, 230))
    for i in range(10):
        angle = i * math.pi * 0.2 + frame * 0.1
        px = cx + math.cos(angle) * (outer + 8)
        py = cy + math.sin(angle) * (outer + 8)
        d.ellipse((px - 3, py - 3, px + 3, py + 3), fill=edge)
    return cell


def make_vault_eye() -> Image.Image:
    cell = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    d = ImageDraw.Draw(cell)
    d.rounded_rectangle((36, 34, 220, 222), radius=20, fill=(16, 12, 20, 255), outline=(255, 214, 109, 255), width=5)
    d.rounded_rectangle((50, 48, 206, 208), radius=16, outline=(166, 34, 255, 220), width=4)
    d.ellipse((74, 70, 182, 178), fill=(116, 34, 180, 255), outline=(255, 214, 109, 255), width=5)
    d.ellipse((92, 88, 164, 160), fill=(255, 214, 109, 255))
    d.ellipse((110, 102, 152, 144), fill=(74, 24, 110, 255))
    d.ellipse((120, 110, 136, 126), fill=(255, 244, 225, 235))
    for offset in (-38, 38):
        d.line((128 + offset, 52, 128 + offset, 30), fill=(255, 214, 109, 230), width=4)
        d.line((128 + offset, 204, 128 + offset, 226), fill=(255, 214, 109, 230), width=4)
    return cell


def make_shield_orb() -> Image.Image:
    cell = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    glow = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((48, 48, 208, 208), fill=(166, 34, 255, 120))
    glow = glow.filter(ImageFilter.GaussianBlur(14))
    cell.alpha_composite(glow)
    d = ImageDraw.Draw(cell)
    d.ellipse((54, 54, 202, 202), fill=(128, 45, 190, 80), outline=(199, 91, 255, 255), width=8)
    d.arc((72, 72, 184, 184), 204, 326, fill=(255, 226, 255, 190), width=7)
    d.arc((66, 66, 190, 190), 30, 126, fill=(255, 214, 109, 170), width=4)
    return cell


def make_shard(cluster: bool = False) -> Image.Image:
    cell = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    d = ImageDraw.Draw(cell)
    shards = [(128, 128, 66, 0)]
    if cluster:
        shards = [(112, 140, 54, -0.2), (150, 116, 72, 0.14), (152, 166, 38, 0.42)]
    for cx, cy, size, rot in shards:
        pts = [
            (cx + math.cos(rot - 0.22) * size * 0.35, cy - size * 0.85),
            (cx + math.cos(rot + 1.1) * size * 0.34, cy),
            (cx + math.cos(rot + 2.9) * size * 0.18, cy + size * 0.88),
            (cx + math.cos(rot + 4.2) * size * 0.36, cy + size * 0.05),
        ]
        d.polygon(pts, fill=(203, 62, 255, 245), outline=(255, 214, 109, 220))
        d.line((cx - size * 0.12, cy - size * 0.46, cx + size * 0.18, cy + size * 0.42), fill=(255, 229, 255, 190), width=4)
    return cell


def make_muzzle(frame: int) -> Image.Image:
    cell = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    d = ImageDraw.Draw(cell)
    d.rounded_rectangle((18, 108, 78, 148), radius=10, fill=(16, 14, 20, 255), outline=(135, 90, 190, 255), width=4)
    d.rectangle((66, 116, 94, 140), fill=(38, 32, 44, 255), outline=(255, 214, 109, 180))
    length = [78, 112, 142, 98, 46][frame]
    outer = [(92, 80), (92 + length, 128), (92, 176)]
    mid = [(90, 98), (92 + length * 0.78, 128), (90, 158)]
    inner = [(92, 114), (92 + length * 0.54, 128), (92, 142)]
    glow = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.polygon(outer, fill=(166, 34, 255, 120))
    glow = glow.filter(ImageFilter.GaussianBlur(10))
    cell.alpha_composite(glow)
    d = ImageDraw.Draw(cell)
    d.polygon(outer, fill=(166, 34, 255, 200))
    d.polygon(mid, fill=(255, 67, 166, 230))
    d.polygon(inner, fill=(255, 244, 178, 255))
    return cell


def make_beam(frame: int) -> Image.Image:
    if frame < 2:
        return make_muzzle(frame)
    cell = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    d = ImageDraw.Draw(cell)
    if frame == 4:
        return make_spark(1, gold=True)
    x0, x1 = 32, 224
    y = 128
    glow = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.rounded_rectangle((x0, y - 22, x1, y + 22), radius=16, fill=(255, 66, 166, 125))
    glow = glow.filter(ImageFilter.GaussianBlur(10))
    cell.alpha_composite(glow)
    d.rounded_rectangle((x0, y - 13, x1, y + 13), radius=10, fill=(255, 63, 166, 230))
    d.rounded_rectangle((x0 + 10, y - 5, x1 - 8, y + 5), radius=4, fill=(255, 243, 226, 255))
    d.polygon([(x1 - 4, y - 18), (238, y), (x1 - 4, y + 18)], fill=(255, 214, 109, 220))
    return cell


def repair_fx_cells(sheet: Image.Image) -> None:
    # 1-indexed frames repaired here: 2, 3, 4, 5, 6, 12, 16, 18, 20.
    for frame in range(5):
        x, y = cell_origin(frame)
        sheet.paste((0, 0, 0, 0), (x, y, x + CELL, y + CELL))
        alpha_composite_cell(sheet, frame, make_heart_projectile(frame))
    for frame in range(5):
        index = 5 + frame
        x, y = cell_origin(index)
        sheet.paste((0, 0, 0, 0), (x, y, x + CELL, y + CELL))
        if frame == 2:
            alpha_composite_cell(sheet, index, make_shield_orb())
        elif frame == 3:
            alpha_composite_cell(sheet, index, make_shard(True))
        elif frame == 4:
            alpha_composite_cell(sheet, index, make_shard(False))
        else:
            alpha_composite_cell(sheet, index, make_spark(frame, gold=frame == 1))
    x, y = cell_origin(11)
    sheet.paste((0, 0, 0, 0), (x, y, x + CELL, y + CELL))
    alpha_composite_cell(sheet, 11, make_vault_eye())
    for frame in range(5):
        index = 15 + frame
        x, y = cell_origin(index)
        sheet.paste((0, 0, 0, 0), (x, y, x + CELL, y + CELL))
        alpha_composite_cell(sheet, index, make_beam(frame))


def audit_sheet(path: Path, cols: int, rows: int):
    image = Image.open(path).convert("RGBA")
    cell_w = image.width / cols
    cell_h = image.height / rows
    clipped = []
    empty = []
    checker_pixels = 0
    for row in range(rows):
        for col in range(cols):
            cell = image.crop((round(col * cell_w), round(row * cell_h), round((col + 1) * cell_w), round((row + 1) * cell_h)))
            bbox = alpha_bbox(cell)
            index = row * cols + col
            if not bbox:
                empty.append(index)
                continue
            margin = min(bbox[0], bbox[1], cell.width - bbox[2], cell.height - bbox[3])
            if margin < 2:
                clipped.append({"cell": index, "margin": margin, "bbox": bbox})
            checker_pixels += sum(1 for pixel in cell.getdata() if pixel[3] > 0 and looks_like_checker_background(pixel))
    return {"path": str(path.relative_to(ROOT)), "size": list(image.size), "empty": empty, "clipped": clipped, "checker_like_pixels": checker_pixels}


def main():
    source = Image.open(SOURCE).convert("RGBA")
    ALPHA_SOURCE.parent.mkdir(parents=True, exist_ok=True)
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    build_alpha_source(source).save(ALPHA_SOURCE)
    build_world_sheet(source).save(WORLD_RUNTIME)
    build_fx_sheet(source).save(FX_RUNTIME)
    report = {
        "source": str(SOURCE.relative_to(ROOT)),
        "outputs": {
            "alpha": str(ALPHA_SOURCE.relative_to(ROOT)),
            "worldProps": str(WORLD_RUNTIME.relative_to(ROOT)),
            "fxSheet": str(FX_RUNTIME.relative_to(ROOT)),
        },
        "cells": {"world": WORLD_CELLS, "fxRows": FX_ROWS},
        "audits": [
            audit_sheet(WORLD_RUNTIME, 4, 4),
            audit_sheet(FX_RUNTIME, 5, 4),
        ],
    }
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
