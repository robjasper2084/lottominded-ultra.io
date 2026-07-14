from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
MISSION = ROOT / "assets" / "mission"
CELL_DIR = MISSION / "separate_fx_repair_cells"
SOURCE = MISSION / "higgsfield_fx_repair_runtime_v1.png"
OUTPUT = MISSION / "higgsfield_separate_fx_repair_runtime_v2.png"
REPORT = ROOT / "docs" / "separate-fx-repair-report.json"

CELL = 256
COLS = 5
ROWS = 4
REPAIRED_FRAMES = [2, 3, 4, 5, 6, 17, 18, 19]


def heart_points(cx: float, cy: float, size: float, samples: int = 160) -> list[tuple[float, float]]:
    pts = []
    for i in range(samples):
        t = math.pi - (math.tau * i / samples)
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((cx + x * size, cy - y * size))
    return pts


def add_glow(base: Image.Image, shape: Image.Image, color: tuple[int, int, int], blur: int, alpha: int) -> None:
    glow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    mask = shape.getchannel("A").filter(ImageFilter.GaussianBlur(blur))
    glow.putalpha(mask.point(lambda p: min(alpha, p)))
    tint = Image.new("RGBA", base.size, (*color, 0))
    tint.putalpha(glow.getchannel("A"))
    base.alpha_composite(tint)


def draw_heart(draw: ImageDraw.ImageDraw, cx: float, cy: float, size: float, outline=(42, 28, 40, 255)) -> Image.Image:
    shape = Image.new("RGBA", (CELL * 4, CELL * 4), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shape)
    scale = 4
    pts = [(x * scale, y * scale) for x, y in heart_points(cx, cy, size)]
    for width, color in [(18, outline), (12, (232, 188, 102, 255)), (7, (74, 36, 70, 255))]:
        sd.line(pts + [pts[0]], fill=color, width=width, joint="curve")
    sd.polygon(pts, fill=(255, 58, 164, 255))
    shine_box = [
        (cx - size * 4.4) * scale,
        (cy - size * 6.4) * scale,
        (cx - size * 1.2) * scale,
        (cy - size * 4.0) * scale,
    ]
    sd.ellipse(shine_box, fill=(255, 219, 245, 170))
    sd.ellipse(
        [
            (cx + size * 3.0) * scale,
            (cy - size * 5.6) * scale,
            (cx + size * 5.0) * scale,
            (cy - size * 3.6) * scale,
        ],
        fill=(255, 205, 239, 150),
    )
    return shape.resize((CELL, CELL), Image.Resampling.LANCZOS)


def flame_tail(canvas: Image.Image, points: list[tuple[int, int]], colors: list[tuple[int, int, int, int]]) -> None:
    for offset, color in enumerate(colors):
        layer = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        shrink = offset * 7
        pts = [(x + shrink if x < 128 else x - shrink // 2, y) for x, y in points]
        d.polygon(pts, fill=color)
        if offset == 0:
            layer = layer.filter(ImageFilter.GaussianBlur(10))
        canvas.alpha_composite(layer)


def draw_starburst(canvas: Image.Image, cx: int, cy: int, radius: int, color=(255, 45, 174, 255)) -> None:
    d = ImageDraw.Draw(canvas)
    glow = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    pts = []
    for i in range(32):
        r = radius if i % 2 == 0 else radius * 0.32
        a = -math.pi / 2 + i * math.tau / 32
        pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
    gd.polygon(pts, fill=color)
    add_glow(canvas, glow, (255, 49, 192), 16, 150)
    canvas.alpha_composite(glow)
    d.ellipse((cx - 20, cy - 20, cx + 20, cy + 20), fill=(255, 235, 250, 245))
    for i in range(12):
        a = i * math.tau / 12
        x1 = cx + math.cos(a) * (radius * 0.62)
        y1 = cy + math.sin(a) * (radius * 0.62)
        x2 = cx + math.cos(a) * (radius * 0.98)
        y2 = cy + math.sin(a) * (radius * 0.98)
        d.line((x1, y1, x2, y2), fill=(255, 219, 96, 220), width=4)


def draw_projectile(frame: int, size: float, long_tail: bool, small: bool = False) -> Image.Image:
    canvas = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    heart_x = 165 if small else 178
    if long_tail:
        heart_x = 184
    heart_y = 126
    tail_left = 24 if long_tail else 46
    tail = [
        (tail_left, heart_y - 24),
        (heart_x - 28, heart_y - 30),
        (heart_x - 16, heart_y - 10),
        (heart_x - 34, heart_y),
        (heart_x - 14, heart_y + 16),
        (heart_x - 30, heart_y + 34),
        (tail_left, heart_y + 22),
    ]
    flame_tail(
        canvas,
        tail,
        [
            (165, 32, 255, 95),
            (244, 76, 211, 185),
            (255, 156, 214, 210),
            (255, 218, 112, 165),
        ],
    )
    d = ImageDraw.Draw(canvas)
    for i in range(9):
        x = tail_left + i * ((heart_x - tail_left) / 9)
        y = heart_y + math.sin(i) * 10
        d.ellipse((x - 2, y - 2, x + 2, y + 2), fill=(255, 232, 140, 170))
    heart = draw_heart(d, heart_x, heart_y, size)
    add_glow(canvas, heart, (255, 35, 183), 10, 150)
    canvas.alpha_composite(heart)
    CELL_DIR.mkdir(parents=True, exist_ok=True)
    canvas.save(CELL_DIR / f"frame_{frame:02d}.png")
    return canvas


def draw_muzzle(frame: int, big: bool = False) -> Image.Image:
    canvas = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)
    barrel = (28, 108, 94, 148)
    d.rounded_rectangle(barrel, radius=12, fill=(31, 29, 40, 255), outline=(214, 166, 86, 255), width=4)
    d.rounded_rectangle((18, 116, 52, 140), radius=8, fill=(42, 40, 55, 255), outline=(112, 73, 172, 255), width=3)
    d.rounded_rectangle((88, 112, 112, 144), radius=8, fill=(78, 54, 76, 255), outline=(246, 197, 93, 255), width=3)
    cx = 120
    cy = 128
    radius = 62 if big else 50
    glow = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    pts = []
    for i in range(28):
        r = radius if i % 2 == 0 else radius * 0.36
        a = i * math.tau / 28
        pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
    gd.polygon(pts, fill=(255, 55, 180, 220))
    add_glow(canvas, glow, (255, 33, 194), 12, 120)
    canvas.alpha_composite(glow)
    d.polygon([(98, 106), (190, 82), (232, 128), (190, 174), (98, 150)], fill=(255, 183, 58, 170))
    d.polygon([(106, 114), (206, 102), (238, 128), (206, 154), (106, 142)], fill=(255, 82, 214, 220))
    d.polygon([(114, 120), (194, 112), (222, 128), (194, 144), (114, 136)], fill=(255, 244, 176, 245))
    d.line((116, 102, 178, 88), fill=(255, 230, 102, 180), width=4)
    d.line((120, 154, 184, 170), fill=(169, 57, 255, 170), width=4)
    canvas.save(CELL_DIR / f"frame_{frame:02d}.png")
    return canvas


def draw_beam(frame: int, endcap: bool = False) -> Image.Image:
    canvas = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)
    y = 128
    x0 = 34
    x1 = 210 if endcap else 228
    glow = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.rounded_rectangle((x0, y - 18, x1, y + 18), radius=14, fill=(255, 37, 203, 185))
    add_glow(canvas, glow, (255, 34, 206), 18, 170)
    canvas.alpha_composite(glow)
    d.rounded_rectangle((x0, y - 13, x1, y + 13), radius=12, fill=(207, 42, 255, 230))
    d.rounded_rectangle((x0 + 8, y - 6, x1 - 8, y + 6), radius=6, fill=(255, 224, 255, 245))
    if endcap:
        d.ellipse((x1 - 20, y - 23, x1 + 26, y + 23), fill=(255, 66, 205, 235), outline=(255, 218, 112, 220), width=4)
        d.ellipse((x1 - 8, y - 11, x1 + 12, y + 11), fill=(255, 242, 255, 245))
    for x in (64, 104, 148, 188):
        d.line((x, y - 12, x + 22, y - 20), fill=(255, 226, 112, 120), width=3)
        d.line((x, y + 12, x + 26, y + 21), fill=(164, 55, 255, 140), width=3)
    canvas.save(CELL_DIR / f"frame_{frame:02d}.png")
    return canvas


def build() -> dict:
    CELL_DIR.mkdir(parents=True, exist_ok=True)
    base = Image.open(SOURCE).convert("RGBA")
    if base.size != (COLS * CELL, ROWS * CELL):
        base = base.resize((COLS * CELL, ROWS * CELL), Image.Resampling.LANCZOS)

    replacements = {}
    for frame in [2, 3, 4, 5, 6, 18, 19]:
        idx = frame - 1
        x = (idx % COLS) * CELL
        y = (idx // COLS) * CELL
        cell = base.crop((x, y, x + CELL, y + CELL))
        cell.save(CELL_DIR / f"frame_{frame:02d}.png")
        replacements[frame] = cell
    replacements[17] = draw_muzzle(17, True)

    for frame, cell in replacements.items():
        idx = frame - 1
        x = (idx % COLS) * CELL
        y = (idx // COLS) * CELL
        base.alpha_composite(Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0)), (x, y))
        base.paste((0, 0, 0, 0), (x, y, x + CELL, y + CELL))
        base.alpha_composite(cell, (x, y))

    base.save(OUTPUT)
    report = {
        "source": str(SOURCE.relative_to(ROOT)),
        "output": str(OUTPUT.relative_to(ROOT)),
        "separate_cells": [str((CELL_DIR / f"frame_{n:02d}.png").relative_to(ROOT)) for n in REPAIRED_FRAMES],
        "frames": REPAIRED_FRAMES,
        "sheet_size": list(base.size),
    }
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


if __name__ == "__main__":
    print(json.dumps(build(), indent=2))
