from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MISSION = ROOT / "assets" / "mission"
HERO = ROOT / "assets" / "hero"
MASCOT = ROOT / "assets" / "mascot"
REPORT = ROOT / "docs" / "higgsfield-photo-assets-report.json"

CELL = 256


def alpha_bbox(image: Image.Image):
    return image.convert("RGBA").getchannel("A").getbbox()


def key_green(image: Image.Image, aggressive: bool = False) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = []
    for r, g, b, a in rgba.getdata():
        chroma = g > 142 and r < 120 and b < 130 and g > r * 1.35 and g > b * 1.28
        hot_chroma = g > 205 and r < 165 and b < 175 and g > max(r, b) + 35
        fringe = aggressive and g > 28 and g > r * 1.03 and g > b * 1.02 and g > max(r, b) + 3
        if chroma or hot_chroma or fringe:
            pixels.append((0, 0, 0, 0))
            continue
        if aggressive and g > max(r, b) + 5 and g > 42:
            g = max(r, b)
        if g > max(r, b) + 42 and r < 150 and b < 170:
            g = max(r, b) + 18
        pixels.append((r, g, b, a))
    out = Image.new("RGBA", rgba.size)
    out.putdata(pixels)
    return out


def source_cell(image: Image.Image, index: int, cols: int, rows: int, inset: int) -> Image.Image:
    col = index % cols
    row = index // cols
    w, h = image.size
    x0 = round(col * w / cols) + inset
    y0 = round(row * h / rows) + inset
    x1 = round((col + 1) * w / cols) - inset
    y1 = round((row + 1) * h / rows) - inset
    return image.crop((x0, y0, x1, y1))


def paste_fit(
    canvas: Image.Image,
    sprite: Image.Image,
    index: int,
    cols: int,
    padding: int,
    cell_size: int = CELL,
    anchor: str = "center",
) -> bool:
    bbox = alpha_bbox(sprite)
    if not bbox:
        return False
    crop = sprite.crop(bbox)
    max_w = cell_size - padding * 2
    max_h = cell_size - padding * 2
    scale = min(max_w / crop.width, max_h / crop.height)
    size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
    crop = crop.resize(size, Image.Resampling.LANCZOS)
    x = (index % cols) * cell_size + (cell_size - crop.width) // 2
    if anchor == "bottom":
        y = (index // cols) * cell_size + cell_size - crop.height - padding
    else:
        y = (index // cols) * cell_size + (cell_size - crop.height) // 2
    canvas.alpha_composite(crop, (x, y))
    return True


def audit_sheet(path: Path, cols: int, rows: int, name: str, cell_size: int = CELL) -> dict:
    image = Image.open(path).convert("RGBA")
    empty = []
    clipped = []
    green_pixels = 0
    for index in range(cols * rows):
        x = (index % cols) * cell_size
        y = (index // cols) * cell_size
        cell = image.crop((x, y, x + cell_size, y + cell_size))
        bbox = alpha_bbox(cell)
        if not bbox:
            empty.append(index + 1)
            continue
        margin = min(bbox[0], bbox[1], cell_size - bbox[2], cell_size - bbox[3])
        if margin < 2:
            clipped.append({"frame": index + 1, "margin": margin, "bbox": bbox})
        green_pixels += sum(
            1
            for r, g, b, a in cell.getdata()
            if a > 0 and g > 155 and r < 118 and b < 128 and g > r * 1.35 and g > b * 1.25
        )
    return {
        "name": name,
        "path": str(path.relative_to(ROOT)),
        "size": list(image.size),
        "empty": empty,
        "clipped": clipped,
        "green_pixels": green_pixels,
    }


def build_sheet(
    name: str,
    source: Path,
    alpha: Path,
    runtime: Path,
    source_cols: int,
    source_rows: int,
    output_cols: int,
    output_rows: int,
    padding: int = 18,
    inset: int = 20,
    cell_size: int = CELL,
    anchor: str = "center",
    frame_map: list[int] | None = None,
) -> dict | None:
    if not source.exists():
        return None
    cleaned = key_green(Image.open(source), cell_size < 256)
    cleaned.save(alpha)
    frame_map = frame_map or list(range(output_cols * output_rows))
    out = Image.new("RGBA", (cell_size * output_cols, cell_size * output_rows), (0, 0, 0, 0))
    for target_index, source_index in enumerate(frame_map[: output_cols * output_rows]):
        if source_index >= source_cols * source_rows:
            continue
        paste_fit(
            out,
            source_cell(cleaned, source_index, source_cols, source_rows, inset),
            target_index,
            output_cols,
            padding,
            cell_size,
            anchor,
        )
    out.save(runtime)
    return audit_sheet(runtime, output_cols, output_rows, name, cell_size)


def build_hero_base() -> dict | None:
    source = HERO / "lottomind_hero_base_higgsfield_source_20260624.png"
    alpha = HERO / "lottomind_hero_base_higgsfield_alpha_20260624.png"
    preview = HERO / "lottomind_hero_base_higgsfield_runtime_512.png"
    if not source.exists():
        return None
    cleaned = key_green(Image.open(source), True)
    cleaned.save(alpha)
    bbox = alpha_bbox(cleaned)
    if not bbox:
        return {"name": "hero_base", "path": str(alpha.relative_to(ROOT)), "empty": True}
    crop = cleaned.crop(bbox)
    canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    scale = min(460 / crop.width, 492 / crop.height)
    size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
    crop = crop.resize(size, Image.Resampling.LANCZOS)
    canvas.alpha_composite(crop, ((512 - crop.width) // 2, 512 - crop.height - 8))
    canvas.save(preview)
    return {
        "name": "hero_base",
        "source": str(source.relative_to(ROOT)),
        "alpha": str(alpha.relative_to(ROOT)),
        "runtime": str(preview.relative_to(ROOT)),
        "size": list(canvas.size),
        "empty": False,
    }


def main():
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    outputs = {}
    audits = []
    specs = [
        {
            "name": "photo_world",
            "source": MISSION / "higgsfield_photo_world_source_20260624.jpeg",
            "alpha": MISSION / "higgsfield_photo_world_alpha_20260624.png",
            "runtime": MISSION / "higgsfield_photo_world_runtime_v1.png",
            "source_cols": 5,
            "source_rows": 4,
            "output_cols": 5,
            "output_rows": 4,
            "padding": 20,
        },
        {
            "name": "photo_fx",
            "source": MISSION / "higgsfield_photo_fx_source_20260624.png",
            "alpha": MISSION / "higgsfield_photo_fx_alpha_20260624.png",
            "runtime": MISSION / "higgsfield_photo_fx_runtime_v1.png",
            "source_cols": 5,
            "source_rows": 5,
            "output_cols": 5,
            "output_rows": 4,
            "padding": 22,
            "frame_map": list(range(20)),
        },
        {
            "name": "photo_world_retry",
            "source": MISSION / "higgsfield_photo_world_retry_source_20260624.png",
            "alpha": MISSION / "higgsfield_photo_world_retry_alpha_20260624.png",
            "runtime": MISSION / "higgsfield_photo_world_retry_runtime_v1.png",
            "source_cols": 5,
            "source_rows": 4,
            "output_cols": 5,
            "output_rows": 4,
            "padding": 22,
            "inset": 18,
        },
        {
            "name": "hero_photo_atlas",
            "source": MASCOT / "lottomind_hero_photo_atlas_source_20260624.png",
            "alpha": MASCOT / "lottomind_hero_photo_atlas_alpha_20260624.png",
            "runtime": MASCOT / "lottomind_hero_photo_atlas_runtime_v1.png",
            "source_cols": 9,
            "source_rows": 6,
            "output_cols": 8,
            "output_rows": 6,
            "padding": 8,
            "inset": 8,
            "cell_size": 192,
            "anchor": "bottom",
            "frame_map": [row * 9 + col for row in range(6) for col in range(8)],
        },
        {
            "name": "hero_photo_dash",
            "source": MASCOT / "lottomind_hero_photo_dash_source_20260624.png",
            "alpha": MASCOT / "lottomind_hero_photo_dash_alpha_20260624.png",
            "runtime": MASCOT / "lottomind_hero_photo_dash_runtime_v1.png",
            "source_cols": 4,
            "source_rows": 2,
            "output_cols": 8,
            "output_rows": 1,
            "padding": 8,
            "inset": 10,
            "cell_size": 192,
            "anchor": "bottom",
            "frame_map": list(range(8)),
        },
        {
            "name": "userref_world",
            "source": MISSION / "higgsfield_userref_world_source_20260624.png",
            "alpha": MISSION / "higgsfield_userref_world_alpha_20260624.png",
            "runtime": MISSION / "higgsfield_userref_world_runtime_v1.png",
            "source_cols": 5,
            "source_rows": 4,
            "output_cols": 5,
            "output_rows": 4,
            "padding": 22,
            "inset": 12,
        },
        {
            "name": "userref_fx",
            "source": MISSION / "higgsfield_userref_fx_source_20260624.png",
            "alpha": MISSION / "higgsfield_userref_fx_alpha_20260624.png",
            "runtime": MISSION / "higgsfield_userref_fx_runtime_v1.png",
            "source_cols": 5,
            "source_rows": 4,
            "output_cols": 5,
            "output_rows": 4,
            "padding": 22,
            "inset": 12,
        },
    ]
    for spec in specs:
        audit = build_sheet(**spec)
        if audit:
            audits.append(audit)
            outputs[spec["name"]] = {
                "source": str(spec["source"].relative_to(ROOT)),
                "alpha": str(spec["alpha"].relative_to(ROOT)),
                "runtime": str(spec["runtime"].relative_to(ROOT)),
            }
    hero_report = build_hero_base()
    if hero_report:
        audits.append(hero_report)
        outputs["hero_base"] = {
            "source": hero_report.get("source"),
            "alpha": hero_report.get("alpha"),
            "runtime": hero_report.get("runtime"),
        }
    report = {"outputs": outputs, "audits": audits}
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
