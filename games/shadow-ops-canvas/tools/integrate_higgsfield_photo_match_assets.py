from __future__ import annotations

import json
from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"

WORLD_SOURCE = ASSETS / "mission" / "higgsfield_world_props_source_20260623.jpeg"
FX_SOURCE = ASSETS / "mission" / "higgsfield_heart_fx_source_20260623.png"
ENEMY_SOURCE = ASSETS / "characters" / "higgsfield_enemy_anim_source_20260623.jpeg"

WORLD_ALPHA = ASSETS / "mission" / "higgsfield_world_props_alpha_20260623.png"
WORLD_RUNTIME = ASSETS / "mission" / "higgsfield_world_props_runtime_v2.png"
FX_RUNTIME = ASSETS / "mission" / "higgsfield_heart_fx_sheet_runtime_v2.png"
DRONE_RUNTIME = ASSETS / "characters" / "higgsfield_drone_motion_strip_runtime_v2.png"
DOG_RUNTIME = ASSETS / "characters" / "higgsfield_robot_dog_walk_strip_runtime_v2.png"
TURRET_RUNTIME = ASSETS / "characters" / "higgsfield_cannon_turret_motion_strip_runtime_v2.png"
REPORT = ROOT / "docs" / "higgsfield-photo-match-assets-report.json"


def ensure_rgba(image: Image.Image) -> Image.Image:
    return image.copy() if image.mode == "RGBA" else image.convert("RGBA")


def chroma_key_green(image: Image.Image) -> Image.Image:
    source = ensure_rgba(image)
    pixels = []
    for r, g, b, a in source.getdata():
        saturated_green = g > 130 and g > r * 1.12 and g > b * 1.12
        key_green = g > 185 and r < 120 and b < 150
        if saturated_green or key_green:
            pixels.append((0, 0, 0, 0))
        else:
            pixels.append((r, min(g, max(r, b) + 36), b, a))
    out = Image.new("RGBA", source.size)
    out.putdata(pixels)
    return out


def despill_green_fringe(image: Image.Image) -> Image.Image:
    rgba = ensure_rgba(image)
    pixels = []
    for r, g, b, a in rgba.getdata():
        if a and g > 42 and g > r * 1.12 and g > b * 1.12:
            if r < 78 and b < 104:
                pixels.append((0, 0, 0, 0))
            else:
                pixels.append((r, min(g, max(r, b) + 24), b, a))
        else:
            pixels.append((r, g, b, a))
    out = Image.new("RGBA", rgba.size)
    out.putdata(pixels)
    return out


def erase_grid_lines(image: Image.Image) -> Image.Image:
    rgba = ensure_rgba(image)
    px = rgba.load()
    w, h = rgba.size
    vertical = []
    horizontal = []
    for x in range(w):
        dark = 0
        for y in range(h):
            r, g, b, a = px[x, y]
            if a > 0 and r < 60 and g < 60 and b < 60:
                dark += 1
        if dark > h * 0.28:
            vertical.append(x)
    for y in range(h):
        dark = 0
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 0 and r < 60 and g < 60 and b < 60:
                dark += 1
        if dark > w * 0.28:
            horizontal.append(y)
    for x in vertical:
        for dx in range(-3, 4):
            nx = x + dx
            if 0 <= nx < w:
                for y in range(h):
                    r, g, b, a = px[nx, y]
                    if a > 0 and r < 90 and g < 90 and b < 90:
                        px[nx, y] = (0, 0, 0, 0)
    for y in horizontal:
        for dy in range(-3, 4):
            ny = y + dy
            if 0 <= ny < h:
                for x in range(w):
                    r, g, b, a = px[x, ny]
                    if a > 0 and r < 90 and g < 90 and b < 90:
                        px[x, ny] = (0, 0, 0, 0)
    return rgba


def alpha_bbox(image: Image.Image):
    return ensure_rgba(image).getchannel("A").getbbox()


def paste_fit(canvas: Image.Image, sprite: Image.Image, box, padding=20, bottom_anchor=False):
    x, y, w, h = box
    bbox = alpha_bbox(sprite)
    if not bbox:
        return False
    crop = sprite.crop(bbox)
    max_w = max(1, w - padding * 2)
    max_h = max(1, h - padding * 2)
    scale = min(max_w / crop.width, max_h / crop.height)
    new_size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
    crop = crop.resize(new_size, Image.Resampling.LANCZOS)
    px = x + (w - crop.width) // 2
    py = y + h - padding - crop.height if bottom_anchor else y + (h - crop.height) // 2
    canvas.alpha_composite(crop, (px, py))
    return True


def source_cell(image: Image.Image, cols: int, rows: int, col: int, row: int, inset=3) -> Image.Image:
    w, h = image.size
    x0 = round(col * w / cols) + inset
    y0 = round(row * h / rows) + inset
    x1 = round((col + 1) * w / cols) - inset
    y1 = round((row + 1) * h / rows) - inset
    return image.crop((x0, y0, x1, y1))


def repack_fx_sheet():
    source = erase_grid_lines(chroma_key_green(Image.open(FX_SOURCE)))
    source_cols = 5
    source_rows = 4
    cell = 256
    out = Image.new("RGBA", (cell * 5, cell * 4), (0, 0, 0, 0))
    mapping = [
        [(0, 0), (4, 0), (3, 0), (0, 1), (0, 0)],
        [(0, 2), (1, 2), (2, 2), (1, 3), (4, 3)],
        [(3, 2), (4, 2), (0, 3), (2, 3), (3, 3)],
        [(1, 1), (2, 1), (3, 1), (4, 1), (2, 1)],
    ]
    for row, cells in enumerate(mapping):
        for col, (src_col, src_row) in enumerate(cells):
            sprite = source_cell(source, source_cols, source_rows, src_col, src_row, inset=12)
            paste_fit(out, sprite, (col * cell, row * cell, cell, cell), padding=18)
    out = despill_green_fringe(out)
    out.save(FX_RUNTIME)


def components(image: Image.Image):
    rgba = ensure_rgba(image)
    alpha = rgba.getchannel("A")
    w, h = rgba.size
    apx = alpha.load()
    seen = bytearray(w * h)
    found = []
    for y in range(h):
        for x in range(w):
            idx = y * w + x
            if seen[idx] or apx[x, y] < 18:
                continue
            queue = deque([(x, y)])
            seen[idx] = 1
            coords = []
            while queue:
                cx, cy = queue.popleft()
                coords.append((cx, cy))
                for nx in (cx - 1, cx, cx + 1):
                    for ny in (cy - 1, cy, cy + 1):
                        if nx == cx and ny == cy:
                            continue
                        if nx < 0 or ny < 0 or nx >= w or ny >= h:
                            continue
                        nidx = ny * w + nx
                        if seen[nidx] or apx[nx, ny] < 18:
                            continue
                        seen[nidx] = 1
                        queue.append((nx, ny))
            if len(coords) < 450:
                continue
            xs = [p[0] for p in coords]
            ys = [p[1] for p in coords]
            bbox = (min(xs), min(ys), max(xs) + 1, max(ys) + 1)
            bw = bbox[2] - bbox[0]
            bh = bbox[3] - bbox[1]
            if bw < 20 or bh < 20:
                continue
            if (bw > w * 0.88 or bh > h * 0.88) and len(coords) / max(1, bw * bh) < 0.16:
                continue
            found.append({"bbox": bbox, "area": len(coords)})
    return found


def isolate_component(image: Image.Image, bbox) -> Image.Image:
    crop = image.crop(bbox)
    alpha = crop.getchannel("A")
    mask = alpha.point(lambda p: 255 if p > 18 else 0).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.25))
    out = crop.copy()
    out.putalpha(ImageChops.multiply(alpha, mask))
    return out


def repack_world_props():
    source = erase_grid_lines(chroma_key_green(Image.open(WORLD_SOURCE)))
    WORLD_ALPHA.parent.mkdir(parents=True, exist_ok=True)
    source.save(WORLD_ALPHA)
    comps = components(source)
    comps = sorted(comps, key=lambda c: (-c["area"], c["bbox"][1], c["bbox"][0]))[:16]
    comps = sorted(comps, key=lambda c: (c["bbox"][1] // 150, c["bbox"][0]))
    cell = 256
    out = Image.new("RGBA", (cell * 4, cell * 4), (0, 0, 0, 0))
    for i, comp in enumerate(comps):
        sprite = isolate_component(source, comp["bbox"])
        row = i // 4
        col = i % 4
        paste_fit(out, sprite, (col * cell, row * cell, cell, cell), padding=16, bottom_anchor=comp["bbox"][3] > source.height * 0.72)
    out = despill_green_fringe(out)
    out.save(WORLD_RUNTIME)
    return comps


def repack_enemy_strips():
    source = chroma_key_green(Image.open(ENEMY_SOURCE))

    def strip(row: int, frame_sequence: list[int], out_path: Path, cell_w: int, cell_h: int, padding=18):
        out = Image.new("RGBA", (cell_w * len(frame_sequence), cell_h), (0, 0, 0, 0))
        for i, src_col in enumerate(frame_sequence):
            sprite = source_cell(source, 4, 3, src_col, row, inset=0)
            paste_fit(out, sprite, (i * cell_w, 0, cell_w, cell_h), padding=padding, bottom_anchor=True)
        out = despill_green_fringe(out)
        out.save(out_path)

    strip(0, [0, 1, 2, 3, 2, 1, 0, 1], DRONE_RUNTIME, 384, 256, padding=18)
    strip(1, [0, 1, 2, 3, 2, 1, 0, 1], DOG_RUNTIME, 320, 240, padding=12)
    strip(2, [0, 1, 2, 3, 2, 1, 0, 1], TURRET_RUNTIME, 384, 256, padding=18)


def audit_sheet(path: Path, cols: int, rows: int):
    image = Image.open(path).convert("RGBA")
    cell_w = image.width / cols
    cell_h = image.height / rows
    clipped = []
    empty = []
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
    green = sum(1 for r, g, b, a in image.getdata() if a > 0 and g > 130 and g > r * 1.1 and g > b * 1.1)
    return {"path": str(path.relative_to(ROOT)), "size": list(image.size), "empty": empty, "clipped": clipped, "greenish_pixels": green}


def main():
    repack_fx_sheet()
    world_components = repack_world_props()
    repack_enemy_strips()
    report = {
        "sources": {
            "world": str(WORLD_SOURCE.relative_to(ROOT)),
            "fx": str(FX_SOURCE.relative_to(ROOT)),
            "enemy": str(ENEMY_SOURCE.relative_to(ROOT)),
        },
        "outputs": {
            "worldProps": str(WORLD_RUNTIME.relative_to(ROOT)),
            "fxSheet": str(FX_RUNTIME.relative_to(ROOT)),
            "droneMotion": str(DRONE_RUNTIME.relative_to(ROOT)),
            "crawlerWalk": str(DOG_RUNTIME.relative_to(ROOT)),
            "cannonTurretMotion": str(TURRET_RUNTIME.relative_to(ROOT)),
        },
        "world_component_count": len(world_components),
        "audits": [
            audit_sheet(WORLD_RUNTIME, 4, 4),
            audit_sheet(FX_RUNTIME, 5, 4),
            audit_sheet(DRONE_RUNTIME, 4, 1),
            audit_sheet(DOG_RUNTIME, 8, 1),
            audit_sheet(TURRET_RUNTIME, 8, 1),
        ],
    }
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
