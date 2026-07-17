import hashlib
import importlib.util
import json
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
RAW_ROOT = ROOT / "assets" / "sprite-production" / "boerboel" / "raw"
OUTPUT_ROOT = ROOT / "assets" / "user-effects"
PREVIEW_ROOT = ROOT / "output"
MOTIONS = ("SUMMON", "RUN", "ATTACK", "RECOVER")
CELL_SIZE = 192


def load_packer():
    path = ROOT / "scripts" / "pack-higgsfield-v2.py"
    spec = importlib.util.spec_from_file_location("higgsfield_packer", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def alpha_hash(image: Image.Image) -> str:
    return hashlib.sha1(image.tobytes()).hexdigest()


def normalize_all(packer, keyed: dict[str, list[Image.Image]]) -> dict[str, list[Image.Image]]:
    boxes = {
        motion: [packer.alpha_bbox(frame) for frame in frames]
        for motion, frames in keyed.items()
    }
    widths = [box[2] - box[0] for motion_boxes in boxes.values() for box in motion_boxes]
    heights = [box[3] - box[1] for motion_boxes in boxes.values() for box in motion_boxes]
    shared_scale = min(184 / max(widths), 176 / max(heights))
    normalized = {}

    for motion, frames in keyed.items():
        normalized[motion] = []
        for frame, box in zip(frames, boxes[motion], strict=True):
            cropped = frame.crop(box)
            size = (
                max(1, round(cropped.width * shared_scale)),
                max(1, round(cropped.height * shared_scale)),
            )
            resized = cropped.resize(size, Image.Resampling.LANCZOS)
            canvas = Image.new("RGBA", (CELL_SIZE, CELL_SIZE), (0, 0, 0, 0))
            x = (CELL_SIZE - resized.width) // 2
            y = CELL_SIZE - resized.height - 4
            canvas.alpha_composite(resized, (x, y))
            alpha = canvas.getchannel("A")
            alpha.paste(0, (0, 0, CELL_SIZE, 8))
            alpha.paste(0, (0, CELL_SIZE - 8, CELL_SIZE, CELL_SIZE))
            alpha.paste(0, (0, 0, 8, CELL_SIZE))
            alpha.paste(0, (CELL_SIZE - 8, 0, CELL_SIZE, CELL_SIZE))
            canvas.putalpha(alpha)
            normalized[motion].append(canvas)
    return normalized


def main() -> None:
    packer = load_packer()
    keyed = {}
    source_counts = {}

    for motion in MOTIONS:
        path = RAW_ROOT / f"{motion.lower()}.png"
        counts = packer.source_figure_counts(path)
        if counts != [packer.SOURCE_COLUMNS, packer.SOURCE_COLUMNS]:
            raise ValueError(f"BOERBOEL/{motion} must contain exactly 3 poses per row; found {counts}")
        source_counts[motion] = counts
        frames = packer.split_sheet(path)
        for index, frame in enumerate(frames, start=1):
            packer.validate_transparency(frame, f"BOERBOEL/{motion}/frame-{index}")
        keyed[motion] = frames

    normalized = normalize_all(packer, keyed)
    unique_frames = {}
    for motion, frames in normalized.items():
        for index, frame in enumerate(frames, start=1):
            packer.validate_internal_splits(frame, f"BOERBOEL/{motion}/frame-{index}")
        unique_frames[motion] = len({alpha_hash(frame) for frame in frames})
        if unique_frames[motion] < 5:
            raise ValueError(f"BOERBOEL/{motion} has fewer than five unique normalized frames")

    atlas = Image.new("RGBA", (CELL_SIZE * 6, CELL_SIZE * len(MOTIONS)), (0, 0, 0, 0))
    preview = Image.new("RGBA", atlas.size, (16, 16, 18, 255))
    draw = ImageDraw.Draw(preview)
    manifest = {
        "version": 1,
        "cellWidth": CELL_SIZE,
        "cellHeight": CELL_SIZE,
        "columns": 6,
        "rows": len(MOTIONS),
        "frameCount": 24,
        "anchor": "bottom-center",
        "motions": {},
    }

    for row, motion in enumerate(MOTIONS):
        frames = normalized[motion]
        for column, frame in enumerate(frames):
            point = (column * CELL_SIZE, row * CELL_SIZE)
            atlas.alpha_composite(frame, point)
            preview.alpha_composite(frame, point)
        draw.text((8, row * CELL_SIZE + 8), motion, fill=(255, 214, 109, 255))
        manifest["motions"][motion] = {
            "row": row,
            "frames": len(frames),
            "frameRate": 14 if motion == "RUN" else 12,
            "uniqueFrames": unique_frames[motion],
            "sourceFigureCounts": source_counts[motion],
        }

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    PREVIEW_ROOT.mkdir(parents=True, exist_ok=True)
    atlas_path = OUTPUT_ROOT / "detroit-boerboel-atlas.webp"
    manifest_path = OUTPUT_ROOT / "detroit-boerboel-atlas.json"
    atlas.save(atlas_path, "WEBP", quality=92, method=6, exact=True)
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    preview.save(PREVIEW_ROOT / "detroit-boerboel-preview.webp", "WEBP", quality=92, method=6)
    print(f"Packed {manifest['frameCount']} frames into {atlas_path} ({atlas_path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
