from __future__ import annotations

import json
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
REPORT = DOCS / "ghost-artifact-clean-report.json"
PREVIEW = DOCS / "ghost-artifact-clean-preview.png"


TASKS = [
    {
        "key": "gameplayFx",
        "src": "assets/mission/chatgpt_gameplay_fx_sheet_runtime_clean.png",
        "out": "assets/mission/chatgpt_gameplay_fx_sheet_runtime_v2.png",
        "cols": 5,
        "rows": 4,
        "mode": "fx",
    },
    {
        "key": "missionProps",
        "src": "assets/mission/higgsfield_missing_world_props_runtime_v2.png",
        "out": "assets/mission/higgsfield_missing_world_props_runtime_v3.png",
        "cols": 4,
        "rows": 4,
        "mode": "prop",
    },
    {
        "key": "missionBatchProps",
        "src": "assets/mission/higgsfield_batch_props_runtime_v2.png",
        "out": "assets/mission/higgsfield_batch_props_runtime_v3.png",
        "cols": 5,
        "rows": 4,
        "mode": "prop",
    },
    {
        "key": "missionBatchWorld",
        "src": "assets/mission/higgsfield_photo_world_retry_runtime_v2.png",
        "out": "assets/mission/higgsfield_photo_world_retry_runtime_v3.png",
        "cols": 5,
        "rows": 4,
        "mode": "prop",
    },
    {
        "key": "missionBatchFx",
        "src": "assets/mission/higgsfield_batch_fx_retry_runtime_v2.png",
        "out": "assets/mission/higgsfield_batch_fx_retry_runtime_v3.png",
        "cols": 5,
        "rows": 4,
        "mode": "fx",
    },
]


def alpha_bbox(img: Image.Image) -> tuple[int, int, int, int] | None:
    return img.getchannel("A").point(lambda p: 255 if p > 12 else 0).getbbox()


def is_greenish(r: int, g: int, b: int) -> bool:
    return g > 76 and g > r * 1.06 and g > b * 1.06


def is_border_artifact(pixel: tuple[int, int, int, int], mode: str) -> bool:
    r, g, b, a = pixel
    if a == 0:
        return True
    if a <= 16:
        return True
    if is_greenish(r, g, b) and a < 246:
        return True

    bright = (r + g + b) / 3
    sat = max(r, g, b) - min(r, g, b)

    if mode == "fx":
        return a <= 70 and sat < 58 and bright < 178

    if a <= 138 and sat < 66 and bright < 188:
        return True
    if a <= 92 and bright < 210:
        return True
    return False


def ghost_plate_count(img: Image.Image) -> int:
    rgba = img.convert("RGBA")
    count = 0
    for r, g, b, a in rgba.getdata():
        if a <= 0:
            continue
        bright = (r + g + b) / 3
        sat = max(r, g, b) - min(r, g, b)
        if a <= 138 and sat < 66 and bright < 188:
            count += 1
    return count


def remove_border_ghosts(cell: Image.Image, mode: str) -> tuple[Image.Image, int]:
    rgba = cell.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()
    visited = bytearray(w * h)
    queue: deque[tuple[int, int]] = deque()

    def push(x: int, y: int) -> None:
        idx = y * w + x
        if visited[idx]:
            return
        visited[idx] = 1
        if is_border_artifact(px[x, y], mode):
            queue.append((x, y))

    for x in range(w):
        push(x, 0)
        push(x, h - 1)
    for y in range(h):
        push(0, y)
        push(w - 1, y)

    removed = 0
    while queue:
        x, y = queue.popleft()
        r, g, b, a = px[x, y]
        if a:
            px[x, y] = (0, 0, 0, 0)
            removed += 1
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if nx < 0 or ny < 0 or nx >= w or ny >= h:
                continue
            idx = ny * w + nx
            if visited[idx]:
                continue
            visited[idx] = 1
            if is_border_artifact(px[nx, ny], mode):
                queue.append((nx, ny))

    return rgba, removed


def process_task(task: dict) -> dict:
    src = ROOT / task["src"]
    out = ROOT / task["out"]
    cols = task["cols"]
    rows = task["rows"]
    img = Image.open(src).convert("RGBA")
    cell_w = img.width // cols
    cell_h = img.height // rows
    cleaned_sheet = Image.new("RGBA", img.size, (0, 0, 0, 0))
    frames = []
    removed_total = 0
    before_total = 0
    after_total = 0

    for frame in range(cols * rows):
        x = (frame % cols) * cell_w
        y = (frame // cols) * cell_h
        cell = img.crop((x, y, x + cell_w, y + cell_h))
        before = ghost_plate_count(cell)
        cleaned, removed = remove_border_ghosts(cell, task["mode"])
        after = ghost_plate_count(cleaned)
        cleaned_sheet.alpha_composite(cleaned, (x, y))
        removed_total += removed
        before_total += before
        after_total += after
        frames.append(
            {
                "frame": frame + 1,
                "ghost_plate_pixels_before": before,
                "ghost_plate_pixels_after": after,
                "border_pixels_removed": removed,
                "bbox": list(alpha_bbox(cleaned) or []),
            }
        )

    out.parent.mkdir(parents=True, exist_ok=True)
    cleaned_sheet.save(out)
    return {
        "key": task["key"],
        "source": task["src"],
        "output": task["out"],
        "size": [img.width, img.height],
        "layout": [cols, rows],
        "ghost_plate_pixels_before": before_total,
        "ghost_plate_pixels_after": after_total,
        "border_pixels_removed": removed_total,
        "frames": frames,
    }


def preview_cell(path: Path, cols: int, rows: int, frame: int) -> Image.Image:
    img = Image.open(path).convert("RGBA")
    cell_w = img.width // cols
    cell_h = img.height // rows
    idx = max(0, min(cols * rows - 1, frame))
    x = (idx % cols) * cell_w
    y = (idx // cols) * cell_h
    cell = img.crop((x, y, x + cell_w, y + cell_h))
    bbox = alpha_bbox(cell) or (0, 0, cell.width, cell.height)
    return cell.crop(bbox)


def make_preview(results: list[dict]) -> None:
    tile_w, tile_h = 236, 178
    cols = 3
    width = cols * tile_w + 20
    rows = len(results)
    sheet = Image.new("RGBA", (width, rows * tile_h + 44), (17, 16, 23, 255))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("arial.ttf", 13)
    except Exception:
        font = ImageFont.load_default()
    draw.text((16, 14), "Ghost Artifact Cleanup Preview", fill=(255, 214, 109, 255), font=font)

    for row, result in enumerate(results):
        task = next(item for item in TASKS if item["key"] == result["key"])
        sample_frame = 3 if result["key"] == "gameplayFx" else 10 if result["key"] == "missionProps" else 6
        thumbs = [
            ("before", preview_cell(ROOT / result["source"], task["cols"], task["rows"], sample_frame)),
            ("after", preview_cell(ROOT / result["output"], task["cols"], task["rows"], sample_frame)),
            ("removed", None),
        ]
        before = Image.open(ROOT / result["source"]).convert("RGBA")
        after = Image.open(ROOT / result["output"]).convert("RGBA")
        cw = before.width // task["cols"]
        ch = before.height // task["rows"]
        idx = min(task["cols"] * task["rows"] - 1, sample_frame)
        x0 = (idx % task["cols"]) * cw
        y0 = (idx // task["cols"]) * ch
        bcell = before.crop((x0, y0, x0 + cw, y0 + ch))
        acell = after.crop((x0, y0, x0 + cw, y0 + ch))
        removed = Image.new("RGBA", bcell.size, (0, 0, 0, 0))
        bp = bcell.load()
        ap = acell.load()
        rp = removed.load()
        for y in range(ch):
            for x in range(cw):
                if bp[x, y][3] > 0 and ap[x, y][3] == 0:
                    rp[x, y] = (255, 78, 154, 220)
        thumbs[2] = ("removed", removed.crop(alpha_bbox(removed) or (0, 0, removed.width, removed.height)))

        for col, (label, thumb) in enumerate(thumbs):
            x = 12 + col * tile_w
            y = 42 + row * tile_h
            draw.rounded_rectangle((x, y, x + tile_w - 12, y + tile_h - 12), radius=8, fill=(25, 22, 32, 255), outline=(74, 58, 98, 255))
            draw.text((x + 10, y + 10), f"{result['key']} {label}", fill=(230, 224, 205, 255), font=font)
            if thumb.width and thumb.height:
                scale = min(182 / thumb.width, 118 / thumb.height, 1.0)
                thumb = thumb.resize((max(1, round(thumb.width * scale)), max(1, round(thumb.height * scale))), Image.Resampling.LANCZOS)
                sheet.alpha_composite(thumb, (x + (tile_w - 12 - thumb.width) // 2, y + 36 + (tile_h - 66 - thumb.height) // 2))

    PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(PREVIEW)


def main() -> None:
    results = [process_task(task) for task in TASKS]
    make_preview(results)
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps({"assets": results, "preview": str(PREVIEW.relative_to(ROOT))}, indent=2), encoding="utf-8")
    print(json.dumps(results, indent=2))
    print(f"preview={PREVIEW}")


if __name__ == "__main__":
    main()
