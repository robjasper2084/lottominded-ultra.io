from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "mission" / "chatgpt_drone_fx_strip_runtime_v3.png"
PREVIEW = ROOT / "docs" / "drone-fx-v3-preview.png"
REPORT = ROOT / "docs" / "drone-fx-v3-report.json"

CELL_W = 320
CELL_H = 180
FRAMES = 8


def glow(base: Image.Image, layer: Image.Image, color: tuple[int, int, int], blur: int, alpha: int) -> None:
    mask = layer.getchannel("A").filter(ImageFilter.GaussianBlur(blur))
    tint = Image.new("RGBA", base.size, (*color, 0))
    tint.putalpha(mask.point(lambda p: min(alpha, p)))
    base.alpha_composite(tint)


def star_points(cx: float, cy: float, r1: float, r2: float, points: int = 18) -> list[tuple[float, float]]:
    pts = []
    for i in range(points * 2):
        r = r1 if i % 2 == 0 else r2
        a = -math.pi / 2 + i * math.pi / points
        pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
    return pts


def draw_orb(size: int, ring: bool = False) -> Image.Image:
    img = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = CELL_W // 2, CELL_H // 2
    aura = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ad = ImageDraw.Draw(aura)
    ad.ellipse((cx - size, cy - size, cx + size, cy + size), fill=(210, 42, 255, 180))
    glow(img, aura, (180, 48, 255), 18, 180)
    if ring:
        d.ellipse((cx - size, cy - size, cx + size, cy + size), outline=(255, 238, 180, 220), width=4)
        d.ellipse((cx - size + 12, cy - size + 12, cx + size - 12, cy + size - 12), outline=(244, 61, 255, 255), width=5)
        for i in range(12):
            a = i * math.tau / 12
            x1 = cx + math.cos(a) * (size + 4)
            y1 = cy + math.sin(a) * (size + 4)
            x2 = cx + math.cos(a) * (size + 16)
            y2 = cy + math.sin(a) * (size + 16)
            d.line((x1, y1, x2, y2), fill=(56, 219, 255, 150), width=2)
    d.ellipse((cx - size * 0.46, cy - size * 0.46, cx + size * 0.46, cy + size * 0.46), fill=(255, 64, 216, 235))
    d.ellipse((cx - size * 0.22, cy - size * 0.22, cx + size * 0.22, cy + size * 0.22), fill=(255, 246, 255, 245))
    return img


def draw_spark(big: bool = False) -> Image.Image:
    img = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = CELL_W // 2, CELL_H // 2
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ld.polygon(star_points(cx, cy, 54 if big else 38, 14 if big else 10, 16), fill=(255, 62, 202, 230))
    glow(img, layer, (255, 46, 204), 14, 180)
    img.alpha_composite(layer)
    d.polygon(star_points(cx, cy, 34 if big else 24, 8 if big else 6, 14), fill=(255, 234, 139, 230))
    d.ellipse((cx - 10, cy - 10, cx + 10, cy + 10), fill=(255, 247, 255, 250))
    return img


def draw_bolt() -> Image.Image:
    img = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pts = [(76, 74), (198, 64), (238, 90), (198, 116), (76, 106), (112, 90)]
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ld.polygon(pts, fill=(224, 42, 255, 210))
    glow(img, layer, (255, 37, 208), 16, 170)
    img.alpha_composite(layer)
    d.polygon([(94, 82), (196, 78), (222, 90), (196, 102), (94, 98), (124, 90)], fill=(255, 232, 255, 245))
    d.line((78, 72, 48, 58), fill=(255, 218, 112, 170), width=3)
    d.line((80, 108, 50, 124), fill=(56, 219, 255, 130), width=3)
    return img


def draw_beam(endcap: bool = False) -> Image.Image:
    img = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    y = CELL_H // 2
    x0, x1 = 42, 260
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ld.rounded_rectangle((x0, y - 18, x1, y + 18), radius=12, fill=(206, 36, 255, 190))
    glow(img, layer, (255, 37, 208), 14, 185)
    img.alpha_composite(layer)
    d.rounded_rectangle((x0, y - 10, x1, y + 10), radius=8, fill=(255, 66, 219, 235))
    d.rounded_rectangle((x0 + 8, y - 4, x1 - 8, y + 4), radius=4, fill=(255, 241, 255, 245))
    for x in (96, 150, 206):
        d.line((x, y - 12, x + 22, y - 20), fill=(255, 225, 112, 155), width=3)
        d.line((x, y + 12, x + 25, y + 20), fill=(56, 219, 255, 120), width=3)
    if endcap:
        d.ellipse((x1 - 12, y - 18, x1 + 24, y + 18), fill=(255, 79, 154, 230), outline=(255, 218, 112, 210), width=3)
    return img


def draw_burst() -> Image.Image:
    img = draw_spark(True)
    d = ImageDraw.Draw(img)
    cx, cy = CELL_W // 2, CELL_H // 2
    for i in range(22):
        a = i * math.tau / 22
        r = 52 + (i % 3) * 8
        x = cx + math.cos(a) * r
        y = cy + math.sin(a) * r
        d.polygon(star_points(x, y, 5, 2, 4), fill=(180, 48, 255, 170))
    return img


def draw_particles() -> Image.Image:
    img = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = CELL_W // 2, CELL_H // 2
    for i in range(36):
        a = i * math.tau / 36
        r = 18 + (i * 17 % 82)
        x = cx + math.cos(a) * r
        y = cy + math.sin(a) * r * 0.72
        color = (56, 219, 255, 140) if i % 3 == 0 else (255, 79, 154, 155) if i % 3 == 1 else (255, 218, 112, 135)
        s = 2 + (i % 4)
        d.ellipse((x - s, y - s, x + s, y + s), fill=color)
    return img.filter(ImageFilter.GaussianBlur(0.25))


def build() -> dict:
    frames = [
        draw_orb(25, False),
        draw_orb(48, True),
        draw_spark(False),
        draw_bolt(),
        draw_beam(False),
        draw_spark(True),
        draw_burst(),
        draw_particles(),
    ]
    strip = Image.new("RGBA", (CELL_W * FRAMES, CELL_H), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        strip.alpha_composite(frame, (i * CELL_W, 0))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    strip.save(OUT)

    checker = Image.new("RGBA", strip.size, (20, 18, 28, 255))
    px = checker.load()
    for y in range(checker.height):
        for x in range(checker.width):
            if ((x // 24) + (y // 24)) % 2 == 0:
                px[x, y] = (32, 28, 42, 255)
    checker.alpha_composite(strip)
    PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    checker.save(PREVIEW)
    report = {
        "output": str(OUT.relative_to(ROOT)),
        "preview": str(PREVIEW.relative_to(ROOT)),
        "size": [strip.width, strip.height],
        "cell_size": [CELL_W, CELL_H],
        "frames": FRAMES,
    }
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


if __name__ == "__main__":
    print(json.dumps(build(), indent=2))
