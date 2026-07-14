from __future__ import annotations

import json
import math
import shutil
from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"

GENERATED_WORLD_SOURCE = Path(
    r"C:\Users\digit\.codex\generated_images\019eed4b-0703-7d93-afa9-fe59b16ca221\ig_00e056fa27cffc88016a3af84b241481909550fccacf8cde9a.png"
)
SHIELD_ROBOT_GREEN = Path(
    r"C:\Users\digit\.codex\generated_images\019eed4b-0703-7d93-afa9-fe59b16ca221\ig_06dc218f4c47dd95016a3b01a77bd88196b02532ad3f55cc6b.png"
)
FX_GREEN = Path(
    r"C:\Users\digit\AppData\Local\Temp\codex-clipboard-ce285afd-728e-44f8-a3af-626ac4a3847b.png"
)


def ensure_rgba(image: Image.Image) -> Image.Image:
    if image.mode == "RGBA":
        return image.copy()
    return image.convert("RGBA")


def chroma_key_green(image: Image.Image) -> Image.Image:
    source = ensure_rgba(image)
    out = Image.new("RGBA", source.size)
    pixels = []
    for r, g, b, a in source.getdata():
        greenish = g > 150 and g > r * 1.18 and g > b * 1.18
        near_key = g > 215 and r < 80 and b < 80
        if greenish or near_key:
            pixels.append((0, 0, 0, 0))
        else:
            # Despill edges that picked up chroma green.
            r2 = r
            b2 = b
            g2 = min(g, max(r, b) + 42)
            pixels.append((r2, g2, b2, a))
    out.putdata(pixels)
    return out


def remove_green_pixels(image: Image.Image) -> Image.Image:
    rgba = ensure_rgba(image)
    pixels = []
    for r, g, b, a in rgba.getdata():
        if a > 0 and g > 130 and g > r * 1.04 and g > b * 1.04:
            pixels.append((0, 0, 0, 0))
        else:
            pixels.append((r, g, b, a))
    rgba.putdata(pixels)
    return rgba


def alpha_bbox(image: Image.Image):
    return ensure_rgba(image).getchannel("A").getbbox()


def paste_fit(canvas: Image.Image, crop: Image.Image, box, padding=18, bottom_anchor=True):
    x, y, w, h = box
    bbox = alpha_bbox(crop)
    if not bbox:
        return
    sprite = crop.crop(bbox)
    max_w = max(1, w - padding * 2)
    max_h = max(1, h - padding * 2)
    ratio = min(max_w / sprite.width, max_h / sprite.height)
    new_size = (max(1, int(sprite.width * ratio)), max(1, int(sprite.height * ratio)))
    sprite = sprite.resize(new_size, Image.Resampling.LANCZOS)
    px = x + (w - sprite.width) // 2
    py = y + h - padding - sprite.height if bottom_anchor else y + (h - sprite.height) // 2
    canvas.alpha_composite(sprite, (px, py))


def normalize_strip_from_equal_slots(source_path: Path, out_path: Path, frames: int, cell_size, key_green=False, padding=22):
    source = Image.open(source_path)
    source = chroma_key_green(source) if key_green else ensure_rgba(source)
    cell_w, cell_h = cell_size
    slots = []
    for i in range(frames):
        sx0 = round(i * source.width / frames)
        sx1 = round((i + 1) * source.width / frames)
        slots.append(source.crop((sx0, 0, sx1, source.height)))

    # Shared scale keeps animation size stable across every frame.
    bboxes = [alpha_bbox(slot) for slot in slots]
    max_w = max((bbox[2] - bbox[0] for bbox in bboxes if bbox), default=1)
    max_h = max((bbox[3] - bbox[1] for bbox in bboxes if bbox), default=1)
    scale = min((cell_w - padding * 2) / max_w, (cell_h - padding * 2) / max_h)

    out = Image.new("RGBA", (cell_w * frames, cell_h), (0, 0, 0, 0))
    for i, slot in enumerate(slots):
        bbox = alpha_bbox(slot)
        if not bbox:
            continue
        sprite = slot.crop(bbox)
        size = (max(1, int(sprite.width * scale)), max(1, int(sprite.height * scale)))
        sprite = sprite.resize(size, Image.Resampling.LANCZOS)
        px = i * cell_w + (cell_w - sprite.width) // 2
        py = cell_h - padding - sprite.height
        out.alpha_composite(sprite, (px, py))
    out.save(out_path)
    return out_path


def normalize_strip_from_boxes(source_path: Path, out_path: Path, boxes, cell_size, key_green=False, padding=22):
    source = Image.open(source_path)
    source = chroma_key_green(source) if key_green else ensure_rgba(source)
    cell_w, cell_h = cell_size
    slots = [source.crop(box) for box in boxes]

    bboxes = [alpha_bbox(slot) for slot in slots]
    max_w = max((bbox[2] - bbox[0] for bbox in bboxes if bbox), default=1)
    max_h = max((bbox[3] - bbox[1] for bbox in bboxes if bbox), default=1)
    scale = min((cell_w - padding * 2) / max_w, (cell_h - padding * 2) / max_h)

    out = Image.new("RGBA", (cell_w * len(slots), cell_h), (0, 0, 0, 0))
    for i, slot in enumerate(slots):
        bbox = alpha_bbox(slot)
        if not bbox:
            continue
        sprite = slot.crop(bbox)
        size = (max(1, int(sprite.width * scale)), max(1, int(sprite.height * scale)))
        sprite = sprite.resize(size, Image.Resampling.LANCZOS)
        px = i * cell_w + (cell_w - sprite.width) // 2
        py = cell_h - padding - sprite.height
        out.alpha_composite(sprite, (px, py))
    out.save(out_path)
    return out_path


def crop_to_cell(source: Image.Image, box, cell_size, scale, padding=22):
    cell_w, cell_h = cell_size
    crop = source.crop(box)
    bbox = alpha_bbox(crop)
    cell = Image.new("RGBA", (cell_w, cell_h), (0, 0, 0, 0))
    if not bbox:
        return cell
    sprite = crop.crop(bbox)
    size = (max(1, int(sprite.width * scale)), max(1, int(sprite.height * scale)))
    sprite = sprite.resize(size, Image.Resampling.LANCZOS)
    px = (cell_w - sprite.width) // 2
    py = cell_h - padding - sprite.height
    cell.alpha_composite(sprite, (px, py))
    return cell


def isolate_largest_component(image: Image.Image, threshold=20):
    rgba = ensure_rgba(image)
    mask = rgba.getchannel("A").point(lambda p: 255 if p > threshold else 0)
    w, h = mask.size
    px = mask.load()
    seen = bytearray(w * h)
    best = []
    best_area = 0

    for y in range(h):
        for x in range(w):
            index = y * w + x
            if seen[index] or px[x, y] == 0:
                continue
            queue = deque([(x, y)])
            seen[index] = 1
            coords = []
            while queue:
                cx, cy = queue.popleft()
                coords.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if nx < 0 or ny < 0 or nx >= w or ny >= h:
                        continue
                    nindex = ny * w + nx
                    if seen[nindex] or px[nx, ny] == 0:
                        continue
                    seen[nindex] = 1
                    queue.append((nx, ny))
            if len(coords) > best_area:
                best_area = len(coords)
                best = coords

    if not best:
        return rgba
    keep = Image.new("L", (w, h), 0)
    kpx = keep.load()
    for x, y in best:
        kpx[x, y] = 255
    keep = keep.filter(ImageFilter.MaxFilter(3))
    keep = keep.filter(ImageFilter.GaussianBlur(0.35))
    out = rgba.copy()
    out.putalpha(ImageChops.multiply(rgba.getchannel("A"), keep))
    return out


def add_shield_blast(cell: Image.Image):
    effect = Image.new("RGBA", cell.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(effect, "RGBA")
    cx, cy = 102, 174
    for i in range(6):
        alpha = 38 - i * 4
        tip_x = 36 + i * 3
        d.polygon(
            [(cx - 4, cy - 34), (tip_x, cy - 76 - i * 2), (48 + i * 2, cy - 8)],
            fill=(255, 79, 154, max(0, alpha)),
        )
    d.rounded_rectangle((26, cy - 21, cx + 16, cy + 21), radius=14, fill=(255, 79, 154, 170), outline=(255, 245, 255, 230), width=3)
    d.line((40, cy, cx + 8, cy), fill=(255, 255, 255, 245), width=6)
    for i in range(16):
        a = i * math.tau / 16
        d.line((cx, cy, cx + math.cos(a) * 46, cy + math.sin(a) * 46), fill=(255, 214, 109, 160), width=2)
    d.ellipse((cx - 25, cy - 25, cx + 25, cy + 25), fill=(255, 245, 255, 210), outline=(165, 34, 255, 240), width=3)
    glow = effect.filter(ImageFilter.GaussianBlur(10))
    cell.alpha_composite(glow)
    cell.alpha_composite(effect)
    clear_alpha_border(cell, 8)
    return cell


def clear_alpha_border(image: Image.Image, pad=6):
    alpha = image.getchannel("A")
    mask = Image.new("L", image.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rectangle((pad, pad, image.width - pad - 1, image.height - pad - 1), fill=255)
    image.putalpha(ImageChops.multiply(alpha, mask))
    return image


def add_recoil_sparks(cell: Image.Image, heavy=False):
    if heavy:
        cell = ImageEnhance.Brightness(cell).enhance(1.15)
        cell = ImageEnhance.Color(cell).enhance(1.08)
    effect = Image.new("RGBA", cell.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(effect, "RGBA")
    cx, cy = (226, 154) if heavy else (214, 148)
    radius = 58 if heavy else 42
    for i in range(18 if heavy else 11):
        a = i * math.tau / (18 if heavy else 11) + (0.15 if heavy else 0)
        length = radius * (0.6 + (i % 3) * 0.2)
        color = (255, 79, 154, 210) if i % 2 else (56, 219, 255, 165)
        d.line((cx, cy, cx + math.cos(a) * length, cy + math.sin(a) * length), fill=color, width=3)
    if heavy:
        d.ellipse((cx - 30, cy - 30, cx + 30, cy + 30), fill=(255, 79, 154, 170), outline=(255, 245, 255, 230), width=4)
        d.ellipse((cx - 14, cy - 14, cx + 14, cy + 14), fill=(255, 245, 255, 235))
    else:
        d.ellipse((cx - 18, cy - 18, cx + 18, cy + 18), fill=(165, 34, 255, 120), outline=(255, 245, 255, 190), width=3)
    glow = effect.filter(ImageFilter.GaussianBlur(7 if heavy else 5))
    cell.alpha_composite(glow)
    cell.alpha_composite(effect)
    return cell


def build_shield_robot_mission_strip(source_path: Path, out_path: Path):
    source = chroma_key_green(Image.open(source_path))
    cell_size = (384, 320)
    padding = 26
    frame_boxes = [
        (12, 150, 272, 560),
        (262, 150, 562, 560),
        (552, 160, 820, 560),
        (788, 150, 1058, 560),
        (928, 118, 1430, 560),
        (1418, 118, 1664, 560),
        (1610, 96, 1848, 560),
        (1848, 220, 2160, 590),
    ]
    crops = []
    for index, box in enumerate(frame_boxes):
        crop = source.crop(box)
        if index == 6:
            crop = isolate_largest_component(crop, threshold=70)
        if 3 <= index <= 6:
            crop = isolate_largest_component(crop)
        crops.append(crop)

    bboxes = [alpha_bbox(crop) for crop in crops]
    max_w = max((bbox[2] - bbox[0] for bbox in bboxes if bbox), default=1)
    max_h = max((bbox[3] - bbox[1] for bbox in bboxes if bbox), default=1)
    scale = min((cell_size[0] - padding * 2) / max_w, (cell_size[1] - padding * 2) / max_h)

    cells = []
    for crop in crops:
        bbox = alpha_bbox(crop)
        cell = Image.new("RGBA", cell_size, (0, 0, 0, 0))
        if bbox:
            sprite = crop.crop(bbox)
            size = (max(1, int(sprite.width * scale)), max(1, int(sprite.height * scale)))
            sprite = sprite.resize(size, Image.Resampling.LANCZOS)
            px = (cell_size[0] - sprite.width) // 2
            py = cell_size[1] - padding - sprite.height
            cell.alpha_composite(sprite, (px, py))
        cells.append(cell)

    # The final hit/downed poses often contain tiny detached generation scraps.
    # Keep the main silhouette so those frames read cleanly in motion.
    cells[6] = isolate_largest_component(cells[6], threshold=20)
    cells[7] = isolate_largest_component(cells[7], threshold=20)

    out = Image.new("RGBA", (cell_size[0] * 8, cell_size[1]), (0, 0, 0, 0))
    for i, cell in enumerate(cells):
        out.alpha_composite(cell, (i * cell_size[0], 0))
    out = remove_green_pixels(out)
    out.save(out_path)
    return out_path


def normalize_grid(source_path: Path, out_path: Path, cols: int, rows: int, cell_size=256, padding=22):
    source = ensure_rgba(Image.open(source_path))
    out = Image.new("RGBA", (cols * cell_size, rows * cell_size), (0, 0, 0, 0))
    for row in range(rows):
        for col in range(cols):
            sx0 = round(col * source.width / cols)
            sx1 = round((col + 1) * source.width / cols)
            sy0 = round(row * source.height / rows)
            sy1 = round((row + 1) * source.height / rows)
            crop = source.crop((sx0, sy0, sx1, sy1))
            paste_fit(out, crop, (col * cell_size, row * cell_size, cell_size, cell_size), padding, False)
    out.save(out_path)
    return out_path


def connected_components_from_alpha(image: Image.Image, min_area=28):
    mask = image.getchannel("A")
    small = mask.resize((max(1, mask.width // 4), max(1, mask.height // 4)), Image.Resampling.BILINEAR)
    small = small.filter(ImageFilter.MaxFilter(9))
    data = small.point(lambda p: 255 if p > 20 else 0)
    w, h = data.size
    seen = bytearray(w * h)
    px = data.load()
    boxes = []
    for y in range(h):
        for x in range(w):
            idx = y * w + x
            if seen[idx] or px[x, y] == 0:
                continue
            q = deque([(x, y)])
            seen[idx] = 1
            min_x = max_x = x
            min_y = max_y = y
            area = 0
            while q:
                cx, cy = q.popleft()
                area += 1
                min_x = min(min_x, cx)
                max_x = max(max_x, cx)
                min_y = min(min_y, cy)
                max_y = max(max_y, cy)
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if nx < 0 or ny < 0 or nx >= w or ny >= h:
                        continue
                    nidx = ny * w + nx
                    if seen[nidx] or px[nx, ny] == 0:
                        continue
                    seen[nidx] = 1
                    q.append((nx, ny))
            if area >= min_area:
                scale_x = image.width / w
                scale_y = image.height / h
                boxes.append(
                    (
                        max(0, int(min_x * scale_x) - 10),
                        max(0, int(min_y * scale_y) - 10),
                        min(image.width, int((max_x + 1) * scale_x) + 10),
                        min(image.height, int((max_y + 1) * scale_y) + 10),
                    )
                )
    boxes.sort(key=lambda b: ((b[1] // 120), b[0]))
    return boxes


def build_world_elements_sheet(source_path: Path, alpha_path: Path, out_path: Path):
    source = Image.open(source_path)
    alpha = chroma_key_green(source)
    alpha.save(alpha_path)
    boxes = connected_components_from_alpha(alpha, min_area=24)
    # Prefer readable props and modules, skip tiny sparks.
    boxes = [b for b in boxes if (b[2] - b[0]) * (b[3] - b[1]) > 4200]
    boxes = boxes[:16]
    out = Image.new("RGBA", (4 * 256, 4 * 256), (0, 0, 0, 0))
    for i, box in enumerate(boxes):
        crop = alpha.crop(box)
        paste_fit(out, crop, ((i % 4) * 256, (i // 4) * 256, 256, 256), 16, False)
    out.save(out_path)
    return out_path, len(boxes)


def glow_layer(size, center, radius, color, rings=8):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")
    for i in range(rings, 0, -1):
        rr = radius * i / rings
        alpha = int(color[3] * (i / rings) ** 2 * 0.22)
        draw.ellipse((center[0] - rr, center[1] - rr, center[0] + rr, center[1] + rr), fill=(*color[:3], alpha))
    return layer


def draw_neon_ring(draw, cx, cy, r, color, width=5):
    for offset, alpha in ((8, 50), (4, 90), (0, 220)):
        draw.ellipse((cx - r - offset, cy - r - offset, cx + r + offset, cy + r + offset), outline=(*color[:3], alpha), width=width)


def build_gameplay_fx(out_path: Path):
    cell = 256
    out = Image.new("RGBA", (5 * cell, 4 * cell), (0, 0, 0, 0))

    pink = (255, 79, 154, 255)
    purple = (165, 34, 255, 255)
    cyan = (56, 219, 255, 255)
    gold = (255, 214, 109, 255)
    orange = (244, 168, 47, 255)

    labels = [
        "spread",
        "rapid",
        "beam",
        "shield",
        "overdrive",
        "cone",
        "reticle",
        "lock",
        "core",
        "phase",
        "muzzle",
        "fan",
        "slash",
        "burst",
        "lowhp",
        "terminal",
        "gate",
        "portal",
        "key",
        "combo",
    ]
    for idx, name in enumerate(labels):
        x = (idx % 5) * cell
        y = (idx // 5) * cell
        layer = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
        layer.alpha_composite(glow_layer((cell, cell), (128, 128), 96, purple if idx % 3 else pink))
        d = ImageDraw.Draw(layer, "RGBA")
        if name in {"spread", "fan"}:
            for a in (-0.36, -0.16, 0, 0.16, 0.36):
                d.polygon([(46, 128), (194, 116 + int(a * 80)), (194, 140 + int(a * 80))], fill=(255, 79, 154, 150))
            d.ellipse((28, 96, 88, 156), fill=(255, 245, 255, 230), outline=pink, width=4)
        elif name in {"rapid", "muzzle"}:
            for i in range(4):
                d.ellipse((58 + i * 34, 112, 86 + i * 34, 140), fill=cyan, outline=(255, 255, 255, 220), width=3)
        elif name in {"beam", "slash"}:
            d.rounded_rectangle((38, 105, 218, 151), radius=18, fill=(255, 79, 154, 170), outline=(255, 245, 255, 240), width=4)
            d.line((54, 128, 204, 128), fill=(255, 255, 255, 245), width=6)
        elif name == "shield":
            d.rounded_rectangle((72, 44, 184, 204), radius=28, fill=(116, 44, 220, 120), outline=purple, width=7)
            d.rounded_rectangle((94, 72, 162, 176), radius=16, outline=(255, 245, 255, 185), width=3)
        elif name == "overdrive":
            d.polygon([(132, 34), (92, 132), (130, 132), (112, 222), (178, 104), (138, 104)], fill=(165, 34, 255, 210), outline=cyan)
        elif name == "cone":
            d.polygon([(40, 128), (214, 62), (214, 194)], fill=(255, 214, 109, 72), outline=gold)
        elif name == "reticle":
            draw_neon_ring(d, 128, 128, 58, pink, 4)
            d.line((128, 42, 128, 78), fill=gold, width=4)
            d.line((128, 178, 128, 214), fill=gold, width=4)
            d.line((42, 128, 78, 128), fill=gold, width=4)
            d.line((178, 128, 214, 128), fill=gold, width=4)
        elif name in {"lock", "key"}:
            d.rounded_rectangle((76, 100, 180, 190), radius=16, fill=(16, 12, 20, 220), outline=gold, width=6)
            d.arc((92, 54, 164, 134), 190, 350, fill=gold, width=8)
            d.ellipse((118, 132, 138, 152), fill=gold)
        elif name in {"core", "phase", "portal"}:
            draw_neon_ring(d, 128, 128, 70, purple, 5)
            draw_neon_ring(d, 128, 128, 42, pink, 4)
            d.ellipse((108, 108, 148, 148), fill=(255, 245, 255, 245))
        elif name == "burst":
            for i in range(16):
                a = i * math.tau / 16
                d.line((128, 128, 128 + math.cos(a) * 92, 128 + math.sin(a) * 92), fill=pink if i % 2 else gold, width=5)
            d.ellipse((82, 82, 174, 174), fill=(255, 245, 255, 225))
        elif name == "lowhp":
            d.polygon([(128, 48), (218, 200), (38, 200)], fill=(255, 79, 154, 170), outline=(255, 245, 255, 220))
            d.rectangle((120, 92, 136, 154), fill=(255, 245, 255, 240))
            d.ellipse((118, 168, 138, 188), fill=(255, 245, 255, 240))
        elif name == "terminal":
            d.rounded_rectangle((48, 62, 208, 184), radius=18, fill=(12, 10, 16, 230), outline=gold, width=5)
            d.rectangle((72, 86, 184, 142), fill=(165, 34, 255, 150), outline=cyan, width=3)
            d.line((84, 162, 172, 162), fill=gold, width=5)
        elif name == "gate":
            for i in range(4):
                d.rounded_rectangle((56 + i * 38, 50, 82 + i * 38, 206), radius=8, fill=(13, 10, 16, 210), outline=gold, width=4)
            d.line((44, 128, 212, 128), fill=pink, width=5)
        else:
            d.polygon([(128, 36), (190, 128), (128, 220), (66, 128)], fill=(255, 79, 154, 190), outline=(255, 245, 255, 230))
        out.alpha_composite(layer, (x, y))
    out.save(out_path)
    return out_path


def build_mission_fx(out_path: Path):
    cell = 256
    out = Image.new("RGBA", (5 * cell, 4 * cell), (0, 0, 0, 0))
    colors = [(255, 79, 154, 255), (165, 34, 255, 255), (56, 219, 255, 255), (255, 214, 109, 255)]
    for row in range(4):
        for frame in range(5):
            layer = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
            color = colors[row]
            layer.alpha_composite(glow_layer((cell, cell), (128, 128), 70 + frame * 8, color))
            d = ImageDraw.Draw(layer, "RGBA")
            if row == 0:
                # Heart shot frames.
                s = 28 + frame * 5
                d.ellipse((128 - s, 80 - s // 2, 128, 80 + s // 2), fill=(255, 79, 154, 220))
                d.ellipse((128, 80 - s // 2, 128 + s, 80 + s // 2), fill=(255, 79, 154, 220))
                d.polygon([(128 - s, 88), (128 + s, 88), (128, 176 + frame * 3)], fill=(255, 79, 154, 220))
                d.line((36, 128, 88, 128), fill=(255, 245, 255, 160), width=5)
            elif row == 1:
                for i in range(10 + frame * 3):
                    a = (i / (10 + frame * 3)) * math.tau
                    r = 34 + frame * 12
                    d.line((128, 128, 128 + math.cos(a) * r, 128 + math.sin(a) * r), fill=(255, 245, 255, 210), width=3)
                d.ellipse((104, 104, 152, 152), fill=color)
            elif row == 2:
                draw_neon_ring(d, 128, 128, 34 + frame * 10, color, 4)
                d.rectangle((94, 118, 162, 138), fill=(255, 245, 255, 180))
            else:
                d.rounded_rectangle((32, 106, 224, 150), radius=20, fill=(255, 79, 154, 150 + frame * 18), outline=(255, 245, 255, 220), width=3)
                d.line((54, 128, 202, 128), fill=(255, 255, 255, 245), width=5)
            out.alpha_composite(layer, (frame * cell, row * cell))
    out.save(out_path)
    return out_path


def build_collectibles(out_path: Path):
    cell = 96
    out = Image.new("RGBA", (8 * cell, 4 * cell), (0, 0, 0, 0))
    for row in range(4):
        for frame in range(8):
            layer = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
            d = ImageDraw.Draw(layer, "RGBA")
            pulse = 1 + math.sin(frame / 8 * math.tau) * 0.08
            cx = cy = cell // 2
            if row == 0:
                size = int(25 * pulse)
                d.polygon([(cx, cy - size), (cx + size, cy), (cx, cy + size), (cx - size, cy)], fill=(255, 79, 154, 230), outline=(255, 245, 255, 220))
            elif row == 1:
                d.ellipse((22, 28, 48, 54), outline=(255, 214, 109, 245), width=5)
                d.rectangle((44, 38, 74, 46), fill=(255, 214, 109, 245))
                d.rectangle((66, 46, 74, 58), fill=(255, 214, 109, 245))
            elif row == 2:
                d.ellipse((24, 26, 48, 50), fill=(255, 79, 154, 230))
                d.ellipse((48, 26, 72, 50), fill=(255, 79, 154, 230))
                d.polygon([(24, 42), (72, 42), (48, 74)], fill=(255, 79, 154, 230))
            else:
                d.polygon([(52, 16), (34, 48), (50, 48), (42, 80), (66, 40), (50, 40)], fill=(165, 34, 255, 230), outline=(56, 219, 255, 210))
            glow = layer.filter(ImageFilter.GaussianBlur(6))
            out.alpha_composite(glow, (frame * cell, row * cell))
            out.alpha_composite(layer, (frame * cell, row * cell))
    out.save(out_path)
    return out_path


def build_drone_fx_from_green(source_path: Path, out_path: Path):
    return normalize_strip_from_equal_slots(source_path, out_path, 8, (320, 180), key_green=True, padding=12)


def build_drone_laser_overlay(out_path: Path):
    cell_w, cell_h = 640, 128
    out = Image.new("RGBA", (cell_w * 8, cell_h), (0, 0, 0, 0))
    for frame in range(8):
        layer = Image.new("RGBA", (cell_w, cell_h), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer, "RGBA")
        length = 210 + (frame % 4) * 18
        x0 = 64
        y = cell_h // 2
        glow = Image.new("RGBA", (cell_w, cell_h), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow, "RGBA")
        gd.rounded_rectangle((x0, y - 22, x0 + length, y + 22), radius=18, fill=(255, 79, 154, 120))
        glow = glow.filter(ImageFilter.GaussianBlur(12))
        layer.alpha_composite(glow)
        d.rounded_rectangle((x0, y - 13, x0 + length, y + 13), radius=12, fill=(255, 79, 154, 205), outline=(255, 245, 255, 230), width=3)
        d.line((x0 + 18, y, x0 + length - 14, y), fill=(255, 255, 255, 245), width=5)
        tip = x0 + length
        for i in range(10):
            a = i * math.tau / 10 + frame * 0.2
            d.line((tip, y, tip + math.cos(a) * 28, y + math.sin(a) * 28), fill=(255, 214, 109, 185), width=2)
        d.ellipse((x0 - 18, y - 18, x0 + 18, y + 18), fill=(255, 245, 255, 235), outline=(165, 34, 255, 220), width=3)
        out.alpha_composite(layer, (frame * cell_w, 0))
    out.save(out_path)
    return out_path


def audit_cells(path: Path, cols: int, rows: int):
    image = ensure_rgba(Image.open(path))
    clipped = []
    empty = []
    for row in range(rows):
        for col in range(cols):
            x0 = round(col * image.width / cols)
            x1 = round((col + 1) * image.width / cols)
            y0 = round(row * image.height / rows)
            y1 = round((row + 1) * image.height / rows)
            bbox = alpha_bbox(image.crop((x0, y0, x1, y1)))
            index = row * cols + col + 1
            if not bbox:
                empty.append(index)
                continue
            l, t, r, b = bbox
            margins = (l, t, x1 - x0 - r, y1 - y0 - b)
            if min(margins) <= 2:
                clipped.append({"cell": index, "margins": margins})
    return {"path": str(path.relative_to(ROOT)), "size": image.size, "empty": empty, "clipped": clipped}


def main():
    char_dir = ASSETS / "characters"
    mission_dir = ASSETS / "mission"
    docs_dir = ROOT / "docs"
    char_dir.mkdir(parents=True, exist_ok=True)
    mission_dir.mkdir(parents=True, exist_ok=True)
    docs_dir.mkdir(parents=True, exist_ok=True)

    source_copy = mission_dir / "chatgpt_world_elements_sheet_source.png"
    shutil.copy2(GENERATED_WORLD_SOURCE, source_copy)

    outputs = {}
    outputs["world"] = str(
        build_world_elements_sheet(
            source_copy,
            mission_dir / "chatgpt_world_elements_sheet_alpha.png",
            mission_dir / "chatgpt_world_elements_sheet_runtime.png",
        )[0]
    )
    outputs["shield_robot"] = str(
        build_shield_robot_mission_strip(
            SHIELD_ROBOT_GREEN,
            char_dir / "chatgpt_shield_robot_mission_strip_runtime_v4.png",
        )
    )
    outputs["drone_fx"] = str(build_drone_fx_from_green(FX_GREEN, mission_dir / "chatgpt_drone_fx_strip_runtime_clean.png"))
    outputs["drone_laser"] = str(build_drone_laser_overlay(char_dir / "chatgpt_drone_laser_overlay_strip_runtime_clean.png"))
    outputs["gameplay_fx"] = str(build_gameplay_fx(mission_dir / "chatgpt_gameplay_fx_sheet_runtime_clean.png"))
    outputs["mission_fx"] = str(build_mission_fx(mission_dir / "chatgpt_mission_fx_sheet_runtime_clean.png"))
    outputs["collectibles"] = str(build_collectibles(mission_dir / "mission_collectibles_sheet_clean.png"))

    report = {
        "source": {
            "imagegen_world_sheet": str(GENERATED_WORLD_SOURCE),
            "shield_robot_green": str(SHIELD_ROBOT_GREEN),
            "fx_green": str(FX_GREEN),
        },
        "outputs": outputs,
        "audit": [
            audit_cells(char_dir / "chatgpt_shield_robot_mission_strip_runtime_v4.png", 8, 1),
            audit_cells(mission_dir / "chatgpt_drone_fx_strip_runtime_clean.png", 8, 1),
            audit_cells(char_dir / "chatgpt_drone_laser_overlay_strip_runtime_clean.png", 8, 1),
            audit_cells(mission_dir / "chatgpt_gameplay_fx_sheet_runtime_clean.png", 5, 4),
            audit_cells(mission_dir / "chatgpt_mission_fx_sheet_runtime_clean.png", 5, 4),
            audit_cells(mission_dir / "mission_collectibles_sheet_clean.png", 8, 4),
            audit_cells(mission_dir / "chatgpt_world_elements_sheet_runtime.png", 4, 4),
        ],
    }
    (docs_dir / "mission-asset-repair-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
