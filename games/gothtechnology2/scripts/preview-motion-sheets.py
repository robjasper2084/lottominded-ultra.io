import argparse
import importlib.util
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
PRODUCTION_ROOT = ROOT / "assets" / "sprite-production" / "higgsfield-v2"
OUTPUT_ROOT = ROOT / "output"


def load_packer():
    path = ROOT / "scripts" / "pack-higgsfield-v2.py"
    spec = importlib.util.spec_from_file_location("higgsfield_packer", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--character", required=True)
    parser.add_argument("--motion", action="append", required=True)
    parser.add_argument("--output")
    args = parser.parse_args()

    packer = load_packer()
    slug = args.character.lower().replace("_", "-")
    raw_root = PRODUCTION_ROOT / "raw" / slug
    label_width = 168
    cell = packer.CELL_SIZE
    preview = Image.new("RGBA", (label_width + cell * 6, cell * len(args.motion)), (16, 16, 18, 255))
    draw = ImageDraw.Draw(preview)
    amara_sources = {}
    if args.character == "AMARA_VALENTINE":
        expected = {motion for motions in packer.CATEGORIES.values() for motion in motions}
        amara_sources = {
            motion: packer.split_horizontal_strip(raw_root / f"{motion.lower()}.png")
            for motion in expected
        }

    for row, motion in enumerate(dict.fromkeys(args.motion)):
        raw_path = raw_root / f"{motion.lower()}.png"
        counts = packer.source_figure_counts(raw_path)
        source_frames = amara_sources.get(motion) or packer.split_sheet(raw_path)
        if args.character == "AMARA_VALENTINE":
            source_frames = packer.repair_amara_aerial_frames(motion, source_frames, amara_sources)
        frames = packer.normalize_frames(source_frames)
        draw.text((10, row * cell + 12), motion, fill=(255, 214, 109, 255))
        draw.text((10, row * cell + 34), f"figures {counts}", fill=(210, 210, 214, 255))
        for column, frame in enumerate(frames):
            preview.alpha_composite(frame, (label_width + column * cell, row * cell))
        print(f"{motion}: figures={counts}")

    output = Path(args.output) if args.output else OUTPUT_ROOT / f"{slug}-source-preview.webp"
    if not output.is_absolute():
        output = ROOT / output
    output.parent.mkdir(parents=True, exist_ok=True)
    preview.save(output, "WEBP", quality=92, method=6)
    print(output)


if __name__ == "__main__":
    main()
