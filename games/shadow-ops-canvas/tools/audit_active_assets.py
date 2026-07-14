from __future__ import annotations

import json
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src" / "game.js"
REPORT = ROOT / "docs" / "active-asset-audit-report.json"
PREVIEW = ROOT / "docs" / "active-asset-audit-preview.png"

SHEET_LAYOUTS = {
    "player": (8, 6),
    "bossCanopyMotion": (6, 1),
    "bossForgeMotion": (6, 1),
    "bossMidasMotion": (6, 1),
    "crawlerWalk": (8, 1),
    "cannonTurretMotion": (8, 1),
    "droneMotion": (8, 1),
    "droneLaserOverlay": (8, 1),
    "droneFx": (8, 1),
    "shieldRobotMotion": (8, 1),
    "enemyMotion": (4, 3),
    "missionCollectibles": (8, 4),
    "missionPortal": (8, 1),
    "missionGate": (4, 1),
    "missionBrandProps": (3, 2),
    "missionProps": (4, 4),
    "fxSheet": (5, 4),
    "gameplayFx": (5, 4),
    "missionBatchProps": (5, 4),
    "missionBatchWorld": (5, 4),
    "missionBatchFx": (5, 4),
}

SPRITE_SHEET_KEYS = {
    "player",
    "bossCanopyMotion",
    "bossForgeMotion",
    "bossMidasMotion",
    "crawlerWalk",
    "cannonTurretMotion",
    "droneMotion",
    "droneLaserOverlay",
    "droneFx",
    "shieldRobotMotion",
    "enemyMotion",
    "fxSheet",
    "gameplayFx",
}

CONTACT_KEYS = [
    "player",
    "crawlerWalk",
    "cannonTurretMotion",
    "droneMotion",
    "droneLaserOverlay",
    "droneFx",
    "shieldRobotMotion",
    "fxSheet",
    "gameplayFx",
    "missionProps",
    "missionBatchProps",
    "missionBatchWorld",
    "missionBatchFx",
]

CONTACT_SAMPLE_FRAMES = {
    "gameplayFx": 3,
    "fxSheet": 2,
    "missionProps": 9,
    "missionBatchProps": 6,
    "missionBatchWorld": 5,
    "missionBatchFx": 3,
}


def active_assets() -> dict[str, str]:
    text = SRC.read_text(encoding="utf-8")
    match = re.search(r"const ASSETS = \{(?P<body>.*?)\n  \};", text, re.S)
    if not match:
        raise RuntimeError("Could not locate ASSETS block")
    assets = {}
    for key, value in re.findall(r"\s*(\w+):\s*\"([^\"]+)\"", match.group("body")):
        assets[key] = value.replace("./", "")
    return assets


def alpha_bbox(img: Image.Image) -> tuple[int, int, int, int] | None:
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    return img.getchannel("A").point(lambda p: 255 if p > 14 else 0).getbbox()


def green_spill_count(img: Image.Image) -> int:
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    count = 0
    for r, g, b, a in img.getdata():
        if a > 20 and g > 80 and g > r * 1.06 and g > b * 1.06:
            count += 1
    return count


def inspect_cell(cell: Image.Image, edge: int = 3) -> dict:
    rgba = cell.convert("RGBA")
    bbox = alpha_bbox(rgba)
    if not bbox:
        return {
            "empty": True,
            "bbox": None,
            "touches_edge": False,
            "green_spill_pixels": 0,
        }
    w, h = rgba.size
    touches = bbox[0] <= edge or bbox[1] <= edge or bbox[2] >= w - edge or bbox[3] >= h - edge
    green = green_spill_count(rgba)
    return {
        "empty": False,
        "bbox": list(bbox),
        "touches_edge": touches,
        "green_spill_pixels": green,
    }


def inspect_asset(key: str, rel_path: str) -> dict:
    path = ROOT / rel_path
    item = {"key": key, "path": rel_path, "exists": path.exists(), "issues": []}
    if not path.exists():
        item["issues"].append("missing file")
        return item

    try:
        img = Image.open(path)
        item["size"] = [img.width, img.height]
        item["mode"] = img.mode
    except Exception as exc:
        item["issues"].append(f"cannot open image: {exc}")
        return item

    if img.width > 4096 or img.height > 4096:
        item["issues"].append("large texture dimension over 4096 risk")

    if img.mode in ("RGBA", "LA") or "transparency" in img.info:
        whole_green = green_spill_count(img.convert("RGBA"))
        item["green_spill_pixels"] = whole_green
        if whole_green > max(80, img.width * img.height * 0.0007):
            item["issues"].append("possible green-key spill")

    layout = SHEET_LAYOUTS.get(key)
    if layout:
        cols, rows = layout
        item["layout"] = [cols, rows]
        if img.width % cols != 0 or img.height % rows != 0:
            item["issues"].append("sheet size is not evenly divisible by declared cells")
        cell_w = img.width // cols
        cell_h = img.height // rows
        item["cell_size"] = [cell_w, cell_h]
        cells = []
        edge_touches = []
        green_cells = []
        for i in range(cols * rows):
            x = (i % cols) * cell_w
            y = (i // cols) * cell_h
            cell = img.crop((x, y, x + cell_w, y + cell_h))
            info = inspect_cell(cell)
            info["frame"] = i + 1
            cells.append(info)
            if info["touches_edge"] and key in SPRITE_SHEET_KEYS:
                edge_touches.append(i + 1)
            if info["green_spill_pixels"] > max(24, cell_w * cell_h * 0.001):
                green_cells.append(i + 1)
        item["cells"] = cells
        if edge_touches:
            item["issues"].append(f"possible clipped cell edges: {edge_touches}")
        if green_cells and key in SPRITE_SHEET_KEYS:
            item["issues"].append(f"possible green spill in cells: {green_cells}")

    return item


def make_contact_sheet(assets: dict[str, str], audit: list[dict]) -> None:
    tiles = []
    for key in CONTACT_KEYS:
        rel = assets.get(key)
        if not rel:
            continue
        path = ROOT / rel
        if not path.exists():
            continue
        img = Image.open(path).convert("RGBA")
        layout = SHEET_LAYOUTS.get(key)
        if layout:
            cols, rows = layout
            cell_w = img.width // cols
            cell_h = img.height // rows
            frame = CONTACT_SAMPLE_FRAMES.get(key, 0)
            x = (frame % cols) * cell_w
            y = (frame // cols) * cell_h
            crop = img.crop((x, y, x + cell_w, y + cell_h))
        else:
            crop = img
        bbox = alpha_bbox(crop) or crop.getbbox() or (0, 0, crop.width, crop.height)
        crop = crop.crop(bbox)
        if crop.width == 0 or crop.height == 0:
            continue
        max_w, max_h = 180, 124
        scale = min(max_w / crop.width, max_h / crop.height, 1.0)
        crop = crop.resize((max(1, round(crop.width * scale)), max(1, round(crop.height * scale))), Image.Resampling.LANCZOS)
        tiles.append((key, crop))

    width = 980
    tile_w = 236
    tile_h = 176
    rows = max(1, (len(tiles) + 3) // 4)
    sheet = Image.new("RGBA", (width, rows * tile_h + 36), (17, 16, 23, 255))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("arial.ttf", 13)
    except Exception:
        font = ImageFont.load_default()
    draw.text((18, 12), "Active Asset Audit Preview", fill=(255, 214, 109, 255), font=font)
    for i, (key, crop) in enumerate(tiles):
        col = i % 4
        row = i // 4
        x = 16 + col * tile_w
        y = 42 + row * tile_h
        draw.rounded_rectangle((x, y, x + tile_w - 12, y + tile_h - 14), radius=8, fill=(25, 22, 32, 255), outline=(72, 57, 96, 255), width=1)
        draw.text((x + 10, y + 10), key, fill=(230, 224, 205, 255), font=font)
        px = x + (tile_w - 12 - crop.width) // 2
        py = y + 36 + (tile_h - 56 - crop.height) // 2
        sheet.alpha_composite(crop, (px, py))
    PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(PREVIEW)


def main() -> None:
    assets = active_assets()
    audit = [inspect_asset(key, rel) for key, rel in assets.items()]
    high = [item for item in audit if item["issues"]]
    report = {
        "active_asset_count": len(audit),
        "issue_count": len(high),
        "active_assets": audit,
        "issue_summary": [
            {
                "key": item["key"],
                "path": item["path"],
                "issues": item["issues"],
                "size": item.get("size"),
                "cell_size": item.get("cell_size"),
            }
            for item in high
        ],
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    make_contact_sheet(assets, audit)
    print(json.dumps(report["issue_summary"], indent=2))
    print(f"report={REPORT}")
    print(f"preview={PREVIEW}")


if __name__ == "__main__":
    main()
