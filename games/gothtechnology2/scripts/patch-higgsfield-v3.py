import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

from PIL import Image, ImageDraw

from stabilize_motion_atlases import stabilize_manifest


ROOT = Path(__file__).resolve().parents[1]
PRODUCTION_ROOT = ROOT / "assets" / "sprite-production" / "higgsfield-v2"
JOBS_PATH = PRODUCTION_ROOT / "jobs.json"
ATLAS_ROOT = ROOT / "assets" / "motion-atlases"
MANIFEST_PATH = ATLAS_ROOT / "motion-atlas-manifest.json"
PREVIEW_ROOT = ROOT / "output" / "motion-v3-previews"
KALYX_AERIAL_MOTIONS = {
    "JUMP_START",
    "JUMP_RISE",
    "JUMP_PEAK",
    "JUMP_FALL",
    "LANDING",
    "AIR_ATTACK",
}


def load_packer():
    path = ROOT / "scripts" / "pack-higgsfield-v2.py"
    spec = importlib.util.spec_from_file_location("higgsfield_packer", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def alpha_hash(image: Image.Image) -> str:
    return hashlib.sha1(image.tobytes()).hexdigest()


def motion_frames(packer, path: Path, label: str) -> list[Image.Image]:
    keyed = packer.split_sheet(path)
    for index, frame in enumerate(keyed, start=1):
        packer.validate_transparency(frame, f"{label}/frame-{index}")
    frames = packer.normalize_frames(keyed)
    for index, frame in enumerate(frames, start=1):
        packer.validate_internal_splits(frame, f"{label}/frame-{index}")
    if len({alpha_hash(frame) for frame in frames}) < 5:
        raise ValueError(f"{label} has fewer than five unique normalized frames")
    return frames


def save_preview(character: str, patches: dict[str, list[Image.Image]]) -> None:
    cell = 192
    label_width = 172
    preview = Image.new("RGBA", (label_width + cell * 6, cell * len(patches)), (16, 16, 18, 255))
    draw = ImageDraw.Draw(preview)
    for row, (motion, frames) in enumerate(patches.items()):
        draw.text((10, row * cell + 12), motion, fill=(255, 214, 109, 255))
        for column, frame in enumerate(frames):
            preview.alpha_composite(frame, (label_width + column * cell, row * cell))
    PREVIEW_ROOT.mkdir(parents=True, exist_ok=True)
    preview.save(PREVIEW_ROOT / f"{character.lower().replace('_', '-')}.webp", "WEBP", quality=92, method=6)


def update_full_preview(packer, character: str, patches: dict[str, list[Image.Image]]) -> None:
    slug = character.lower().replace("_", "-")
    preview_path = PRODUCTION_ROOT / "previews" / f"{slug}-all-motions.webp"
    if not preview_path.exists():
        return
    preview = Image.open(preview_path).convert("RGBA")
    motions = [motion for group in packer.CATEGORIES.values() for motion in group]
    columns = 9
    for motion, frames in patches.items():
        base = motions.index(motion) * 3
        for offset, frame_index in enumerate((0, 2, 5)):
            cursor = base + offset
            x = (cursor % columns) * packer.CELL_SIZE
            y = (cursor // columns) * packer.CELL_SIZE
            preview.paste((22, 22, 24, 255), (x, y, x + packer.CELL_SIZE, y + packer.CELL_SIZE))
            preview.alpha_composite(frames[frame_index], (x, y))
    preview.save(preview_path, "WEBP", quality=88, method=6)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--character", choices=("KALYX", "MASTER_EZRA", "DETROIT_LENS"), required=True)
    parser.add_argument("--motion", action="append", required=True)
    args = parser.parse_args()

    packer = load_packer()
    jobs = json.loads(JOBS_PATH.read_text(encoding="utf-8"))
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    job_motions = jobs["characters"][args.character]["motions"]
    manifest_character = "DETROIT_LENS_NOIR" if args.character == "DETROIT_LENS" else args.character
    manifest_motions = manifest["characters"][manifest_character]["motions"]
    slug = args.character.lower().replace("_", "-")
    raw_root = PRODUCTION_ROOT / "raw" / slug
    patches = {}

    for motion in dict.fromkeys(args.motion):
        if motion not in job_motions or motion not in manifest_motions:
            raise SystemExit(f"Unknown motion for {args.character}: {motion}")
        raw_path = raw_root / f"{motion.lower()}.png"
        if args.character == "DETROIT_LENS" or (args.character == "KALYX" and motion in KALYX_AERIAL_MOTIONS):
            counts = packer.source_figure_counts(raw_path)
            valid_grid = all(3 <= count <= 6 for count in counts) if args.character == "DETROIT_LENS" else counts == [3, 3]
            if not valid_grid:
                raise ValueError(f"{args.character}/{motion} has an invalid pose grid: {counts}")
        patches[motion] = motion_frames(packer, raw_path, f"{args.character}/{motion}")

    atlases = {}
    for motion, frames in patches.items():
        motion_data = manifest_motions[motion]
        sheet_path = ROOT / motion_data["sheet"]
        atlas = atlases.setdefault(sheet_path, Image.open(sheet_path).convert("RGBA"))
        for frame, target in zip(frames, motion_data["frames"], strict=True):
            atlas.paste((0, 0, 0, 0), (target["x"], target["y"], target["x"] + target["w"], target["y"] + target["h"]))
            atlas.alpha_composite(frame, (target["x"], target["y"]))
        motion_data["uniqueFrames"] = len({alpha_hash(frame) for frame in frames})
        motion_data["source"] = "higgsfield-v4-body-only"
        motion_data["higgsfieldJobId"] = job_motions[motion]["jobId"]

    for sheet_path, atlas in atlases.items():
        atlas.save(sheet_path, "WEBP", quality=92, method=6, exact=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    stabilize_manifest(ROOT, MANIFEST_PATH)
    save_preview(args.character, patches)
    update_full_preview(packer, args.character, patches)
    print(f"Patched {len(patches)} motions for {args.character}")


if __name__ == "__main__":
    main()
