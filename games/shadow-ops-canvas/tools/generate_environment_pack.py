from __future__ import annotations

import argparse
import json
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


PALETTE = {
    "void": (4, 4, 10, 255),
    "midnight": (10, 12, 30, 255),
    "deep_purple": (39, 12, 70, 255),
    "purple": (116, 32, 210, 255),
    "magenta": (224, 37, 220, 255),
    "gold": (255, 205, 92, 255),
    "amber": (244, 148, 46, 255),
    "metal": (20, 21, 29, 255),
    "metal_hi": (52, 49, 62, 255),
    "moss": (61, 89, 46, 255),
    "cyan": (83, 219, 255, 255),
}


def ensure_dirs(root: Path) -> dict[str, Path]:
    dirs = {
        "root": root,
        "layers": root / "layers",
        "platforms": root / "platforms",
        "props": root / "props",
        "overlays": root / "overlays",
        "preview": root / "preview",
    }
    for path in dirs.values():
        path.mkdir(parents=True, exist_ok=True)
    return dirs


def rgba(size, color=(0, 0, 0, 0)):
    return Image.new("RGBA", size, color)


def rounded(draw: ImageDraw.ImageDraw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def add_glow(base: Image.Image, mask: Image.Image, color, blur=18, alpha=150):
    glow = Image.new("RGBA", base.size, (*color[:3], 0))
    glow.putalpha(mask.filter(ImageFilter.GaussianBlur(blur)).point(lambda p: min(alpha, p)))
    base.alpha_composite(glow)


def line_glow(img: Image.Image, xy, fill, width=3, blur=8):
    mask = Image.new("L", img.size, 0)
    md = ImageDraw.Draw(mask)
    md.line(xy, fill=220, width=width)
    add_glow(img, mask, fill, blur=blur, alpha=120)
    ImageDraw.Draw(img).line(xy, fill=fill, width=width)


def gradient_bg(size, top, bottom):
    w, h = size
    strip = Image.new("RGBA", (1, h))
    px = strip.load()
    for y in range(h):
        t = y / max(1, h - 1)
        col = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(4))
        px[0, y] = col
    return strip.resize((w, h), Image.Resampling.BILINEAR)


def draw_circuit_lines(draw, x, y, w, h, alpha=170):
    gold = (*PALETTE["gold"][:3], alpha)
    for i in range(7):
        yy = y + 20 + i * h / 8
        xx = x + (i % 3) * 18
        draw.line([(xx, yy), (x + w * 0.55, yy), (x + w * 0.55, yy + 24), (x + w - 18, yy + 24)], fill=gold, width=3)
        draw.ellipse((x + w - 25, yy + 17, x + w - 11, yy + 31), outline=gold, width=2)


def draw_vines(draw, x, y, length, count=4, alpha=190):
    rng = random.Random(int(x * 17 + y * 7 + length))
    for i in range(count):
        sx = x + rng.randint(-20, 20) + i * 18
        pts = []
        for j in range(7):
            pts.append((sx + math.sin(j * 0.9 + i) * rng.randint(4, 12), y + j * length / 6))
        draw.line(pts, fill=(*PALETTE["moss"][:3], alpha), width=rng.randint(3, 6))
        for px, py in pts[1::2]:
            draw.ellipse((px - 5, py - 3, px + 8, py + 5), fill=(47, 90, 51, alpha))


def save_asset(img: Image.Image, path: Path):
    if img.mode == "RGBA":
        img = img.copy()
        alpha = img.getchannel("A").point(lambda p: 0 if p < 3 else p)
        img.putalpha(alpha)
    img.save(path)


def make_far_sky(path: Path):
    w, h = 4096, 2304
    img = gradient_bg((w, h), (2, 2, 8, 255), (29, 10, 58, 255))
    draw = ImageDraw.Draw(img, "RGBA")
    rng = random.Random(88)
    for _ in range(950):
        x, y = rng.randrange(w), rng.randrange(int(h * 0.72))
        a = rng.randrange(26, 115)
        r = rng.choice([1, 1, 1, 2])
        draw.ellipse((x - r, y - r, x + r, y + r), fill=(198, 171, 255, a))
    fog = rgba((w, h))
    fd = ImageDraw.Draw(fog, "RGBA")
    for _ in range(34):
        x = rng.randrange(-600, w)
        y = rng.randrange(120, h)
        rx = rng.randrange(440, 1100)
        ry = rng.randrange(160, 430)
        fd.ellipse((x, y, x + rx, y + ry), fill=(145, 36, 224, rng.randrange(24, 70)))
    fog = fog.filter(ImageFilter.GaussianBlur(70))
    img.alpha_composite(fog)
    for x in range(-200, w + 200, 450):
        line_glow(img, [(x, 120), (x + rng.randrange(-80, 80), h - 260)], (126, 38, 255, 80), width=8, blur=34)
    save_asset(img, path)
    return path


def make_distant_silhouette(path: Path):
    w, h = 4096, 2304
    img = rgba((w, h))
    draw = ImageDraw.Draw(img, "RGBA")
    rng = random.Random(22)
    for i, x in enumerate(range(-120, w + 240, 160)):
        tw = rng.randrange(72, 210)
        th = rng.randrange(520, 1720)
        y = h - th - rng.randrange(40, 280)
        fill = (7, 8, 18, rng.randrange(175, 225))
        draw.rectangle((x, y, x + tw, h + 100), fill=fill)
        if i % 3 == 0:
            draw.rectangle((x + tw * 0.3, y - 90, x + tw * 0.65, y + 20), fill=fill)
        if i % 2 == 0:
            line_glow(img, [(x + tw * 0.25, y + 50), (x + tw * 0.25, h - 120)], PALETTE["gold"], width=4, blur=12)
        if i % 4 == 0:
            line_glow(img, [(x + tw * 0.72, y + 120), (x + tw * 0.72, y + th * 0.55)], PALETTE["purple"], width=5, blur=14)
        draw_vines(draw, x + tw * 0.5, y + 180, rng.randrange(320, 780), count=2, alpha=95)
    haze = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    hd = ImageDraw.Draw(haze, "RGBA")
    hd.rectangle((0, int(h * 0.62), w, h), fill=(83, 25, 140, 70))
    img.alpha_composite(haze.filter(ImageFilter.GaussianBlur(55)))
    save_asset(img, path)
    return path


def make_circuit_wall(path: Path):
    w, h = 4096, 2304
    img = gradient_bg((w, h), (8, 9, 16, 255), (16, 13, 24, 255))
    draw = ImageDraw.Draw(img, "RGBA")
    for x in range(0, w, 384):
        draw.rectangle((x, 0, x + 300, h), fill=(12, 13, 19, 215), outline=(64, 54, 38, 120), width=3)
        draw_circuit_lines(draw, x + 36, 90, 235, h - 160, alpha=150)
        if x % 768 == 0:
            line_glow(img, [(x + 270, 0), (x + 270, h)], PALETTE["purple"], width=8, blur=22)
        draw_vines(draw, x + 270, 0, 700, count=5, alpha=130)
    for y in range(220, h, 360):
        line_glow(img, [(0, y), (w, y + 20)], (83, 219, 255, 30), width=3, blur=18)
    save_asset(img, path)
    return path


def make_hologram_fog(path: Path):
    w, h = 4096, 2304
    img = rgba((w, h))
    draw = ImageDraw.Draw(img, "RGBA")
    rng = random.Random(42)
    for _ in range(19):
        x, y = rng.randrange(0, w - 520), rng.randrange(210, h - 360)
        ww, hh = rng.randrange(260, 650), rng.randrange(90, 230)
        draw.rounded_rectangle((x, y, x + ww, y + hh), radius=12, outline=(99, 221, 255, 55), width=2, fill=(38, 164, 255, 9))
        for i in range(rng.randrange(3, 7)):
            yy = y + 24 + i * 24
            draw.line((x + 28, yy, x + rng.randrange(90, ww - 24), yy), fill=(230, 190, 255, 50), width=2)
    for _ in range(28):
        x = rng.randrange(-300, w)
        y = rng.randrange(520, h - 120)
        draw.ellipse((x, y, x + rng.randrange(700, 1350), y + rng.randrange(140, 360)), fill=(172, 52, 240, rng.randrange(24, 60)))
    img = img.filter(ImageFilter.GaussianBlur(1.2))
    save_asset(img, path)
    return path


def platform_piece(size, variant):
    w, h = size
    img = rgba(size)
    draw = ImageDraw.Draw(img, "RGBA")
    shadow = Image.new("L", size, 0)
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((16, 40, w - 16, h - 38), radius=16, fill=190)
    add_glow(img, shadow, PALETTE["purple"], blur=20, alpha=95)
    rounded(draw, (18, 24, w - 18, h - 44), 12, PALETTE["metal"], (*PALETTE["gold"][:3], 210), 4)
    draw.rectangle((28, h - 66, w - 28, h - 48), fill=(133, 32, 210, 160))
    line_glow(img, [(34, h - 64), (w - 34, h - 64)], PALETTE["purple"], width=5, blur=12)
    for x in range(62, w - 80, 120):
        draw.line((x, 38, x + 42, 38, x + 42, 58, x + 88, 58), fill=(*PALETTE["gold"][:3], 205), width=3)
    if variant in {"left", "right"}:
        cap_x = 18 if variant == "left" else w - 78
        draw.polygon([(cap_x, 24), (cap_x + 60, 24), (cap_x + 40, h - 44), (cap_x + 4, h - 44)], fill=(33, 31, 40, 255), outline=PALETTE["gold"])
    if variant == "broken":
        draw.polygon([(w - 120, 24), (w - 18, 24), (w - 18, h - 44), (w - 190, h - 44), (w - 145, h - 82)], fill=(0, 0, 0, 0))
        draw.line((w - 190, h - 44, w - 145, h - 82, w - 120, 24), fill=(*PALETTE["gold"][:3], 190), width=3)
    if variant in {"hatch", "boss"}:
        cx = w // 2
        rounded(draw, (cx - 86, 42, cx + 86, h - 60), 10, (28, 23, 31, 255), (*PALETTE["gold"][:3], 215), 4)
        draw.ellipse((cx - 30, 62, cx + 30, 122), outline=PALETTE["gold"], width=5)
        line_glow(img, [(cx - 58, h - 76), (cx + 58, h - 76)], PALETTE["magenta"], width=5, blur=14)
    if variant == "elevator":
        rounded(draw, (w * 0.18, 42, w * 0.82, h - 58), 20, (34, 30, 42, 255), (*PALETTE["cyan"][:3], 180), 4)
        for i in range(4):
            draw.line((w * 0.26 + i * 52, 60, w * 0.26 + i * 52, h - 82), fill=(*PALETTE["purple"][:3], 160), width=4)
    draw_vines(draw, w * 0.18, h - 50, 90, count=3, alpha=190)
    draw_vines(draw, w * 0.72, h - 50, 120, count=3, alpha=190)
    return img


def make_platform_sheet(path: Path):
    names = [
        ("left_cap", "left", (512, 256)),
        ("middle_tile", "middle", (512, 256)),
        ("right_cap", "right", (512, 256)),
        ("small_ledge", "small", (512, 256)),
        ("wide_bridge", "wide", (1024, 256)),
        ("broken_ledge", "broken", (512, 256)),
        ("elevator_pad", "elevator", (512, 256)),
        ("hatch_platform", "hatch", (512, 256)),
        ("boss_arena_platform", "boss", (1024, 256)),
    ]
    sheet = rgba((2048, 1280))
    meta = []
    x = y = 0
    row_h = 256
    for name, variant, size in names:
        if x + size[0] > sheet.width:
            x = 0
            y += row_h
        sprite = platform_piece(size, variant)
        sheet.alpha_composite(sprite, (x, y))
        meta.append({"name": name, "x": x, "y": y, "w": size[0], "h": size[1], "collision": [24, 40, size[0] - 48, 96]})
        save_asset(sprite, path.parent / f"{name}.png")
        x += size[0]
    save_asset(sheet, path)
    return meta


def prop_icon(size, kind, state=0):
    w, h = size
    img = rgba(size)
    draw = ImageDraw.Draw(img, "RGBA")
    cx, cy = w // 2, h // 2
    glow_color = PALETTE["magenta"] if state in (1, 3) else PALETTE["purple"]
    mask = Image.new("L", size, 0)
    md = ImageDraw.Draw(mask)
    md.ellipse((cx - w * 0.32, cy - h * 0.32, cx + w * 0.32, cy + h * 0.32), fill=180)
    add_glow(img, mask, glow_color, blur=24, alpha=115)
    if kind == "door":
        rounded(draw, (54, 28, w - 54, h - 20), 22, (18, 18, 25, 255), PALETTE["gold"], 5)
        draw.rectangle((86, 58, w - 86, h - 52), fill=(35, 29, 45, 255), outline=PALETTE["purple"], width=5)
        draw.ellipse((cx - 34, cy - 34, cx + 34, cy + 34), outline=PALETTE["gold"], width=6)
    elif kind == "portal":
        draw.ellipse((48, 28, w - 48, h - 28), outline=PALETTE["gold"], width=8)
        draw.ellipse((78, 58, w - 78, h - 58), outline=PALETTE["magenta"], width=8)
        line_glow(img, [(cx, 48), (cx, h - 48)], PALETTE["purple"], width=6, blur=18)
    elif kind == "crate":
        rounded(draw, (42, 78, w - 42, h - 58), 14, (35, 31, 38, 255), PALETTE["gold"], 5)
        draw.line((42, cy, w - 42, cy), fill=PALETTE["gold"], width=4)
        draw.rectangle((cx - 42, cy - 36, cx + 42, cy + 36), outline=PALETTE["purple"], width=5)
    elif kind == "terminal":
        rounded(draw, (62, 56, w - 62, h - 48), 18, (20, 21, 30, 255), PALETTE["gold"], 5)
        draw.rectangle((88, 84, w - 88, cy + 12), fill=(31, 18, 52, 255), outline=PALETTE["cyan"], width=3)
        for i in range(4):
            draw.line((104, cy + 48 + i * 22, w - 112, cy + 48 + i * 22), fill=(*PALETTE["gold"][:3], 160), width=3)
    elif kind == "crystal":
        draw.polygon([(cx, 22), (cx + 72, cy - 18), (cx + 42, h - 42), (cx - 50, h - 28), (cx - 86, cy - 8)], fill=(153, 55, 230, 220), outline=PALETTE["magenta"])
        line_glow(img, [(cx - 36, cy - 40), (cx + 38, h - 60)], PALETTE["magenta"], width=4, blur=12)
    elif kind == "switch":
        rounded(draw, (46, 86, w - 46, h - 70), 18, (29, 26, 32, 255), PALETTE["gold"], 5)
        draw.line((cx - 54, cy + 10, cx + 46, cy - 44), fill=PALETTE["gold"], width=9)
        draw.ellipse((cx + 26, cy - 66, cx + 76, cy - 16), fill=PALETTE["magenta"])
    else:
        rounded(draw, (52, 54, w - 52, h - 48), 20, (22, 22, 30, 255), PALETTE["gold"], 5)
        draw.ellipse((cx - 52, cy - 52, cx + 52, cy + 52), outline=PALETTE["purple"], width=7)
        draw.ellipse((cx - 18, cy - 18, cx + 18, cy + 18), fill=PALETTE["gold"])
    if state == 2:
        alpha = img.getchannel("A")
        dim = rgba(size, (0, 0, 0, 60))
        dim.putalpha(alpha.point(lambda p: min(60, p)))
        img.alpha_composite(dim)
    if state == 3:
        line_glow(img, [(36, h - 42), (w - 36, h - 42)], PALETTE["magenta"], width=7, blur=18)
    return img


def make_props_sheet(path: Path):
    props = [
        ("locked_vault_door", "door"),
        ("unlockable_hatch", "door"),
        ("elevator_terminal", "terminal"),
        ("checkpoint_pad", "terminal"),
        ("security_console", "terminal"),
        ("reward_crate", "crate"),
        ("energy_battery", "battery"),
        ("purple_crystal", "crystal"),
        ("gold_circuit_switch", "switch"),
        ("hologram_terminal", "terminal"),
        ("warning_beacon", "beacon"),
        ("boss_portal_frame", "portal"),
    ]
    sheet = rgba((2048, 1536))
    meta = []
    cell = 256
    for idx, (name, kind) in enumerate(props):
        col = idx % 4
        row = idx // 4
        sprite = prop_icon((cell, cell), kind, state=idx % 4)
        x, y = col * cell, row * cell
        sheet.alpha_composite(sprite, (x, y))
        save_asset(sprite, path.parent / f"{name}.png")
        meta.append({"name": name, "x": x, "y": y, "w": cell, "h": cell})
    save_asset(sheet, path)
    return meta


def make_overlay_sheet(path: Path):
    sheet = rgba((2048, 1024))
    draw = ImageDraw.Draw(sheet, "RGBA")
    meta = []
    rng = random.Random(7)
    cells = [
        ("fog_bank", (0, 0, 512, 256)),
        ("smoke_ribbon", (512, 0, 512, 256)),
        ("magenta_glow", (1024, 0, 512, 256)),
        ("amber_circuit_glow", (1536, 0, 512, 256)),
        ("jungle_leaves", (0, 256, 512, 256)),
        ("hanging_vines", (512, 256, 512, 256)),
        ("purple_mushrooms", (1024, 256, 512, 256)),
        ("particle_sparks", (1536, 256, 512, 256)),
    ]
    for name, box in cells:
        x, y, w, h = box
        cell = rgba((w, h))
        cd = ImageDraw.Draw(cell, "RGBA")
        if "fog" in name or "smoke" in name:
            for _ in range(9):
                x0 = rng.randrange(-80, w - 60)
                y0 = rng.randrange(28, h - 48)
                x1 = x0 + rng.randrange(220, 720)
                y1 = y0 + rng.randrange(70, 210)
                cd.ellipse((x0, y0, x1, y1), fill=(147, 48, 220, rng.randrange(20, 58)))
            cell = cell.filter(ImageFilter.GaussianBlur(22))
        elif "glow" in name:
            m = Image.new("L", (w, h), 0)
            md = ImageDraw.Draw(m)
            if "amber" in name:
                md.line((40, h // 2, w - 40, h // 2), fill=210, width=9)
                add_glow(cell, m, PALETTE["gold"], blur=22, alpha=145)
                cd.line((40, h // 2, w - 40, h // 2), fill=PALETTE["gold"], width=4)
            else:
                md.ellipse((w // 2 - 70, h // 2 - 70, w // 2 + 70, h // 2 + 70), fill=220)
                add_glow(cell, m, PALETTE["magenta"], blur=40, alpha=185)
        elif "leaves" in name:
            for i in range(13):
                px = rng.randrange(20, w - 40)
                py = rng.randrange(50, h - 20)
                cd.ellipse((px - 34, py - 12, px + 62, py + 14), fill=(24, 43, 27, 220), outline=(69, 103, 57, 190), width=2)
        elif "vines" in name:
            for i in range(11):
                draw_vines(cd, 45 + i * 42, 0, rng.randrange(120, 230), count=1, alpha=205)
        elif "mushrooms" in name:
            for i in range(6):
                px, py = 55 + i * 75, h - rng.randrange(35, 70)
                cd.line((px, py, px, py - 44), fill=(93, 62, 110, 210), width=8)
                cd.ellipse((px - 34, py - 70, px + 42, py - 30), fill=(132, 44, 190, 210))
                line_glow(cell, [(px - 25, py - 52), (px + 32, py - 52)], PALETTE["purple"], width=3, blur=12)
        else:
            for _ in range(70):
                px, py = rng.randrange(24, w - 24), rng.randrange(24, h - 24)
                cd.rectangle((px, py, px + rng.randrange(2, 7), py + rng.randrange(2, 7)), fill=(*rng.choice([PALETTE["gold"], PALETTE["magenta"], PALETTE["cyan"]])[:3], rng.randrange(95, 210)))
        sheet.alpha_composite(cell, (x, y))
        save_asset(cell, path.parent / f"{name}.png")
        meta.append({"name": name, "x": x, "y": y, "w": w, "h": h})
    save_asset(sheet, path)
    return meta


def make_heart_core_sheet(path: Path):
    sheet = rgba((2048, 512))
    meta = []
    states = ["dormant", "activated", "damaged", "overloaded", "defeated"]
    for idx, state in enumerate(states):
        cell = rgba((384, 512))
        draw = ImageDraw.Draw(cell, "RGBA")
        cx, cy = 192, 240
        energy_alpha = [60, 180, 140, 230, 38][idx]
        m = Image.new("L", cell.size, 0)
        md = ImageDraw.Draw(m)
        md.ellipse((40, 50, 344, 354), fill=energy_alpha)
        add_glow(cell, m, PALETTE["magenta"], blur=38, alpha=min(220, energy_alpha + 40))
        draw.pieslice((64, 70, 204, 235), 180, 360, fill=(35, 33, 45, 245), outline=PALETTE["gold"], width=5)
        draw.pieslice((180, 70, 320, 235), 180, 360, fill=(35, 33, 45, 245), outline=PALETTE["gold"], width=5)
        draw.polygon([(72, 170), (312, 170), (192, 420)], fill=(30, 28, 40, 250), outline=PALETTE["gold"])
        draw.line((102, 166, 192, 390, 282, 166), fill=PALETTE["purple"], width=8)
        draw.ellipse((cx - 42, cy - 42, cx + 42, cy + 42), fill=(236, 61, 216, energy_alpha), outline=PALETTE["gold"], width=4)
        if state == "damaged":
            for n in range(5):
                draw.line((80 + n * 45, 128 + n * 12, 150 + n * 34, 205 + n * 8), fill=(94, 244, 255, 190), width=3)
        if state == "overloaded":
            for n in range(18):
                ang = n * math.tau / 18
                line_glow(cell, [(cx, cy), (cx + math.cos(ang) * 190, cy + math.sin(ang) * 150)], PALETTE["magenta"], width=3, blur=9)
        if state == "defeated":
            cell = cell.point(lambda p: int(p * 0.55))
        x = idx * 384
        sheet.alpha_composite(cell, (x, 0))
        save_asset(cell, path.parent / f"heart_core_{state}.png")
        meta.append({"name": f"heart_core_{state}", "x": x, "y": 0, "w": 384, "h": 512})
    save_asset(sheet, path)
    return meta


def make_preview(root: Path, output: Path):
    preview = Image.new("RGBA", (4096, 4096), (7, 7, 12, 255))
    y = 0
    for rel in [
        "layers/far-purple-nebula-sky.png",
        "layers/distant-cyber-vault-silhouettes.png",
        "layers/mid-circuit-wall.png",
        "layers/hologram-fog-overlay.png",
        "platforms/platform-modules-sheet.png",
        "props/interactive-cyber-vault-props-sheet.png",
        "overlays/foreground-overlay-sheet.png",
        "props/heart-core-reactor-states-sheet.png",
    ]:
        img = Image.open(root / rel).convert("RGBA")
        scale = min(4096 / img.width, 480 / img.height)
        thumb = img.resize((int(img.width * scale), int(img.height * scale)), Image.Resampling.LANCZOS)
        preview.alpha_composite(thumb, (0, y))
        y += thumb.height + 32
    preview.save(output)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--reference", type=Path)
    args = parser.parse_args()

    dirs = ensure_dirs(args.out)
    generated = {}
    generated["parallax_layers"] = [
        str(make_far_sky(dirs["layers"] / "far-purple-nebula-sky.png").relative_to(args.out)),
        str(make_distant_silhouette(dirs["layers"] / "distant-cyber-vault-silhouettes.png").relative_to(args.out)),
        str(make_circuit_wall(dirs["layers"] / "mid-circuit-wall.png").relative_to(args.out)),
        str(make_hologram_fog(dirs["layers"] / "hologram-fog-overlay.png").relative_to(args.out)),
    ]
    platform_meta = make_platform_sheet(dirs["platforms"] / "platform-modules-sheet.png")
    props_meta = make_props_sheet(dirs["props"] / "interactive-cyber-vault-props-sheet.png")
    overlay_meta = make_overlay_sheet(dirs["overlays"] / "foreground-overlay-sheet.png")
    heart_meta = make_heart_core_sheet(dirs["props"] / "heart-core-reactor-states-sheet.png")
    make_preview(args.out, dirs["preview"] / "shadow-ops-environment-pack-preview.png")

    manifest = {
        "id": "cyber-vault-v1",
        "name": "Shadow Ops Cyber Vault Parallax Pack",
        "styleReference": str(args.reference) if args.reference else "",
        "activation": "Add ?envpack=cyber-vault-v1 to the game URL.",
        "layers": [
            {"key": "envFarSky", "file": "layers/far-purple-nebula-sky.png", "parallax": 0.018, "alpha": 1.0, "role": "far sky"},
            {"key": "envDistantSilhouette", "file": "layers/distant-cyber-vault-silhouettes.png", "parallax": 0.038, "alpha": 0.9, "role": "distant towers"},
            {"key": "envCircuitWall", "file": "layers/mid-circuit-wall.png", "parallax": 0.075, "alpha": 0.74, "role": "mid architecture"},
            {"key": "envHologramFog", "file": "layers/hologram-fog-overlay.png", "parallax": 0.11, "alpha": 0.44, "role": "hologram fog overlay"},
        ],
        "sheets": {
            "platforms": {"file": "platforms/platform-modules-sheet.png", "sprites": platform_meta},
            "props": {"file": "props/interactive-cyber-vault-props-sheet.png", "sprites": props_meta},
            "overlays": {"file": "overlays/foreground-overlay-sheet.png", "sprites": overlay_meta},
            "heartCore": {"file": "props/heart-core-reactor-states-sheet.png", "sprites": heart_meta},
        },
        "constraints": {
            "noCharacters": True,
            "noReadableText": True,
            "transparentSprites": True,
            "canvasReady": True,
            "rollback": "Remove envpack query parameter.",
        },
    }
    with (args.out / "environment-pack-manifest.json").open("w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(json.dumps({"out": str(args.out), "preview": str(dirs["preview"] / "shadow-ops-environment-pack-preview.png")}, indent=2))


if __name__ == "__main__":
    main()
