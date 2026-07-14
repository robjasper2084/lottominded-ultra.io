from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
DOCS = ROOT / "docs"
REPORT = DOCS / "asset-polish-report.json"
PREVIEW = DOCS / "asset-polish-preview.png"


TASKS = [
    {
        "key": "droneMotion",
        "src": "assets/characters/higgsfield_drone_motion_strip_runtime_v2.png",
        "out": "assets/characters/higgsfield_drone_motion_strip_runtime_v3.png",
        "cols": 8,
        "rows": 1,
        "cell": (384, 256),
        "mode": "aggressive",
    },
    {
        "key": "droneFx",
        "src": "assets/mission/chatgpt_drone_fx_strip_runtime_v3.png",
        "out": "assets/mission/chatgpt_drone_fx_strip_runtime_v4.png",
        "cols": 8,
        "rows": 1,
        "cell": (320, 180),
        "mode": "aggressive",
    },
    {
        "key": "droneLaserOverlay",
        "src": "assets/characters/chatgpt_drone_laser_overlay_strip_runtime_clean.png",
        "out": "assets/characters/chatgpt_drone_laser_overlay_strip_runtime_v2.png",
        "cols": 8,
        "rows": 1,
        "cell": (512, 128),
        "mode": "aggressive",
    },
    {
        "key": "bossCanopyMotion",
        "src": "assets/bosses/canopy_drone_queen_motion_sheet.png",
        "out": "assets/bosses/canopy_drone_queen_motion_sheet_runtime_384.png",
        "cols": 6,
        "rows": 1,
        "cell": (384, 384),
        "mode": "soft",
    },
    {
        "key": "bossForgeMotion",
        "src": "assets/bosses/jackpot_forge_titan_motion_sheet.png",
        "out": "assets/bosses/jackpot_forge_titan_motion_sheet_runtime_384.png",
        "cols": 6,
        "rows": 1,
        "cell": (384, 384),
        "mode": "soft",
    },
    {
        "key": "bossMidasMotion",
        "src": "assets/bosses/midas_heartcore_overlord_motion_sheet.png",
        "out": "assets/bosses/midas_heartcore_overlord_motion_sheet_runtime_384.png",
        "cols": 6,
        "rows": 1,
        "cell": (384, 384),
        "mode": "soft",
    },
    {
        "key": "shieldRobotMotion",
        "src": "assets/characters/chatgpt_shield_robot_mission_strip_runtime_v4.png",
        "out": "assets/characters/chatgpt_shield_robot_mission_strip_runtime_v5.png",
        "cols": 8,
        "rows": 1,
        "cell": (384, 320),
        "mode": "aggressive",
    },
    {
        "key": "cannonTurretMotion",
        "src": "assets/characters/higgsfield_cannon_turret_motion_strip_runtime_v2.png",
        "out": "assets/characters/higgsfield_cannon_turret_motion_strip_runtime_v3.png",
        "cols": 8,
        "rows": 1,
        "cell": (384, 256),
        "mode": "aggressive",
    },
    {
        "key": "fxSheet",
        "src": "assets/mission/higgsfield_separate_fx_repair_runtime_v3.png",
        "out": "assets/mission/higgsfield_separate_fx_repair_runtime_v4.png",
        "cols": 5,
        "rows": 4,
        "cell": (256, 256),
        "mode": "aggressive",
    },
    {
        "key": "missionProps",
        "src": "assets/mission/higgsfield_missing_world_props_runtime_v1.png",
        "out": "assets/mission/higgsfield_missing_world_props_runtime_v2.png",
        "cols": 4,
        "rows": 4,
        "cell": (256, 256),
        "mode": "conservative",
    },
    {
        "key": "missionBatchWorld",
        "src": "assets/mission/higgsfield_photo_world_retry_runtime_v1.png",
        "out": "assets/mission/higgsfield_photo_world_retry_runtime_v2.png",
        "cols": 5,
        "rows": 4,
        "cell": (256, 256),
        "mode": "conservative",
    },
    {
        "key": "missionBatchProps",
        "src": "assets/mission/higgsfield_batch_props_runtime_v1.png",
        "out": "assets/mission/higgsfield_batch_props_runtime_v2.png",
        "cols": 5,
        "rows": 4,
        "cell": (256, 256),
        "mode": "conservative",
    },
    {
        "key": "missionBatchFx",
        "src": "assets/mission/higgsfield_batch_fx_retry_runtime_v1.png",
        "out": "assets/mission/higgsfield_batch_fx_retry_runtime_v2.png",
        "cols": 5,
        "rows": 4,
        "cell": (256, 256),
        "mode": "aggressive",
    },
]


CONTACT_ORDER = [
    "droneMotion",
    "droneFx",
    "droneLaserOverlay",
    "bossCanopyMotion",
    "bossForgeMotion",
    "bossMidasMotion",
    "shieldRobotMotion",
    "cannonTurretMotion",
    "fxSheet",
    "missionProps",
    "missionBatchWorld",
    "missionBatchProps",
]


def is_greenish(r: int, g: int, b: int) -> bool:
    return g > 80 and g > r * 1.06 and g > b * 1.06


def alpha_bbox(img: Image.Image) -> tuple[int, int, int, int] | None:
    return img.getchannel("A").point(lambda p: 255 if p > 12 else 0).getbbox()


def clean_green(img: Image.Image, mode: str) -> tuple[Image.Image, int]:
    rgba = img.convert("RGBA")
    px = rgba.load()
    removed = 0
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = px[x, y]
            if a == 0:
                px[x, y] = (0, 0, 0, 0)
                continue

            green = is_greenish(r, g, b)
            if mode == "conservative":
                if green and a < 218:
                    px[x, y] = (0, 0, 0, 0)
                    removed += 1
                elif green and a < 244:
                    px[x, y] = (r, max(r, b), b, a)
            elif mode == "soft":
                if green and a < 200:
                    px[x, y] = (0, 0, 0, 0)
                    removed += 1
                elif green:
                    px[x, y] = (r, max(r, b), b, a)
            else:
                if green:
                    px[x, y] = (0, 0, 0, 0)
                    removed += 1

    return rgba, removed


def fit_cell(cell: Image.Image, out_size: tuple[int, int]) -> Image.Image:
    out_w, out_h = out_size
    bbox = alpha_bbox(cell)
    if not bbox:
        return Image.new("RGBA", out_size, (0, 0, 0, 0))
    crop = cell.crop(bbox)
    pad = max(10, round(min(out_w, out_h) * 0.055))
    scale = min((out_w - pad * 2) / crop.width, (out_h - pad * 2) / crop.height, 1.0)
    new_w = max(1, round(crop.width * scale))
    new_h = max(1, round(crop.height * scale))
    resized = crop.resize((new_w, new_h), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", out_size, (0, 0, 0, 0))
    out.alpha_composite(resized, ((out_w - new_w) // 2, (out_h - new_h) // 2))
    return out


def process_task(task: dict) -> dict:
    src = ROOT / task["src"]
    out = ROOT / task["out"]
    cols = task["cols"]
    rows = task["rows"]
    cell_w, cell_h = task["cell"]
    img = Image.open(src).convert("RGBA")
    in_cell_w = img.width // cols
    in_cell_h = img.height // rows
    result = Image.new("RGBA", (cols * cell_w, rows * cell_h), (0, 0, 0, 0))
    removed_total = 0
    touched_frames = []

    for frame in range(cols * rows):
        x = (frame % cols) * in_cell_w
        y = (frame // cols) * in_cell_h
        cell = img.crop((x, y, x + in_cell_w, y + in_cell_h))
        cleaned, removed = clean_green(cell, task["mode"])
        removed_total += removed
        fitted = fit_cell(cleaned, (cell_w, cell_h))
        bbox = alpha_bbox(fitted)
        if bbox and (bbox[0] <= 2 or bbox[1] <= 2 or bbox[2] >= cell_w - 2 or bbox[3] >= cell_h - 2):
            touched_frames.append(frame + 1)
        result.alpha_composite(fitted, ((frame % cols) * cell_w, (frame // cols) * cell_h))

    out.parent.mkdir(parents=True, exist_ok=True)
    result.save(out)
    return {
        "key": task["key"],
        "source": task["src"],
        "output": task["out"],
        "source_size": [img.width, img.height],
        "output_size": [result.width, result.height],
        "cell_size": [cell_w, cell_h],
        "green_pixels_removed": removed_total,
        "edge_touch_frames": touched_frames,
    }


def preview_thumb(path: Path, cols: int, rows: int, frame: int = 0) -> Image.Image:
    img = Image.open(path).convert("RGBA")
    cell_w = img.width // cols
    cell_h = img.height // rows
    frame = min(cols * rows - 1, frame)
    x = (frame % cols) * cell_w
    y = (frame // cols) * cell_h
    cell = img.crop((x, y, x + cell_w, y + cell_h))
    bbox = alpha_bbox(cell) or (0, 0, cell.width, cell.height)
    return cell.crop(bbox)


def make_preview(results: list[dict]) -> None:
    task_by_key = {task["key"]: task for task in TASKS}
    result_by_key = {item["key"]: item for item in results}
    tile_w, tile_h = 238, 178
    cols = 4
    rows = (len(CONTACT_ORDER) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * tile_w + 20, rows * tile_h + 44), (17, 16, 23, 255))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("arial.ttf", 13)
    except Exception:
        font = ImageFont.load_default()
    draw.text((16, 14), "Asset Polish Preview", fill=(255, 214, 109, 255), font=font)
    for idx, key in enumerate(CONTACT_ORDER):
        task = task_by_key[key]
        result = result_by_key[key]
        frame = 1 if key == "droneFx" else 2 if key == "fxSheet" else 0
        thumb = preview_thumb(ROOT / result["output"], task["cols"], task["rows"], frame)
        max_w, max_h = 182, 118
        scale = min(max_w / thumb.width, max_h / thumb.height, 1.0)
        thumb = thumb.resize((max(1, round(thumb.width * scale)), max(1, round(thumb.height * scale))), Image.Resampling.LANCZOS)
        col = idx % cols
        row = idx // cols
        x = 12 + col * tile_w
        y = 42 + row * tile_h
        draw.rounded_rectangle((x, y, x + tile_w - 12, y + tile_h - 12), radius=8, fill=(25, 22, 32, 255), outline=(74, 58, 98, 255))
        draw.text((x + 10, y + 10), key, fill=(230, 224, 205, 255), font=font)
        draw.text((x + 10, y + tile_h - 34), f"{result['output_size'][0]}x{result['output_size'][1]}", fill=(151, 221, 255, 255), font=font)
        sheet.alpha_composite(thumb, (x + (tile_w - 12 - thumb.width) // 2, y + 34 + (tile_h - 68 - thumb.height) // 2))
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
