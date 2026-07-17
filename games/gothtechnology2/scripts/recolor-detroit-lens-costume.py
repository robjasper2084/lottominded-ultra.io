from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ATLAS_ROOT = ROOT / "assets" / "motion-atlases"
MANIFEST_PATH = ATLAS_ROOT / "motion-atlas-manifest.json"
PREVIEW_ROOT = ROOT / "output" / "qa-detroit-lens-white"
EXPECTED_SOURCE_HASHES = {
    "detroit-lens-locomotion.webp": "9af08e11f5dc1c2cfb83a756388012952fcb387dbb395699bc1b27e10c7dff7a",
    "detroit-lens-combat.webp": "11d8da0d8dca98c7a0d6be97397fab7e838eee0bb426d737f153ea7846a0ac5d",
    "detroit-lens-reaction.webp": "3d52b1f279f547991c72b6f0b938c7a4be8073c0da3bbf2984a6a9cc32993f65",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def transform_atlas(source: Path, destination: Path, motions: dict[str, dict]) -> None:
    actual_hash = sha256(source)
    if actual_hash != EXPECTED_SOURCE_HASHES[source.name]:
        raise RuntimeError(
            f"{source.name} does not match the approved source hash; "
            "the white costume may already be applied"
        )

    image = Image.open(source).convert("RGBA")
    pixels = np.array(image)

    for motion in motions.values():
        if Path(motion["sheet"]).name != source.name:
            continue
        for frame in motion["frames"]:
            content = frame["content"]
            origin_x = frame["x"] + content["x"]
            origin_y = frame["y"] + content["y"]
            height = content["h"]
            width = content["w"]
            view = pixels[origin_y:origin_y + height, origin_x:origin_x + width]
            normalized_y, normalized_x = np.ogrid[0:1:complex(height), 0:1:complex(width)]
            face = (normalized_x >= 0.24) & (normalized_x <= 0.76) & (normalized_y >= 0.17) & (normalized_y <= 0.34)
            shirt = (normalized_x >= 0.47) & (normalized_x <= 0.53) & (normalized_y >= 0.29) & (normalized_y <= 0.58)
            shoes = normalized_y >= 0.91
            hat = (normalized_x >= 0.22) & (normalized_x <= 0.78) & (normalized_y <= 0.18)
            region = hat | ((normalized_y >= 0.25) & ~face & ~shirt & ~shoes)

            rgb = view[:, :, :3].astype(np.float32) / 255
            maximum = rgb.max(axis=2)
            minimum = rgb.min(axis=2)
            delta = maximum - minimum
            saturation = np.divide(delta, maximum, out=np.zeros_like(delta), where=maximum > 0)
            hue = np.zeros_like(maximum)
            nonzero = delta > 0
            red_max = nonzero & (rgb[:, :, 0] == maximum)
            green_max = nonzero & (rgb[:, :, 1] == maximum)
            blue_max = nonzero & (rgb[:, :, 2] == maximum)
            hue[red_max] = np.mod((rgb[:, :, 1][red_max] - rgb[:, :, 2][red_max]) / delta[red_max], 6)
            hue[green_max] = (rgb[:, :, 2][green_max] - rgb[:, :, 0][green_max]) / delta[green_max] + 2
            hue[blue_max] = (rgb[:, :, 0][blue_max] - rgb[:, :, 1][blue_max]) / delta[blue_max] + 4
            hue /= 6
            warm = ((hue <= 0.15) | (hue >= 0.96)) & (saturation >= 0.22) & (maximum >= 0.1)
            mask = (view[:, :, 3] > 8) & region & (maximum <= 0.62) & ~warm

            texture = np.minimum(1, maximum / 0.62)
            white_value = 0.62 + texture * 0.34
            target = np.stack((white_value * 255, white_value * 252, white_value * 246), axis=2)
            recolored = rgb * 255
            recolored[mask] = recolored[mask] * 0.1 + target[mask] * 0.9
            view[:, :, :3] = np.rint(recolored).astype(np.uint8)

    destination.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(pixels, "RGBA").save(destination, "WEBP", quality=92, method=6, exact=True)


def build_preview(motions: dict[str, dict], transformed_root: Path) -> None:
    selected = [
        "IDLE",
        "WALK_FORWARD",
        "RUN_FORWARD",
        "JUMP_RISE",
        "LIGHT_PUNCH",
        "HEAVY_KICK",
        "HURT_HEAVY",
        "VICTORY",
    ]
    cell_w = 138
    cell_h = 196
    label_w = 150
    preview = Image.new("RGBA", (label_w + cell_w * 6, cell_h * len(selected) * 2), (13, 14, 16, 255))
    draw = ImageDraw.Draw(preview)

    for motion_index, motion_name in enumerate(selected):
        motion = motions[motion_name]
        source_path = ATLAS_ROOT / Path(motion["sheet"]).name
        transformed_path = transformed_root / source_path.name
        original = Image.open(source_path).convert("RGBA")
        transformed = Image.open(transformed_path).convert("RGBA")
        for variant_index, (label, atlas) in enumerate((("ORIGINAL", original), ("WHITE", transformed))):
            row = motion_index * 2 + variant_index
            draw.text((10, row * cell_h + 12), motion_name, fill=(245, 245, 242, 255))
            draw.text((10, row * cell_h + 34), label, fill=(210, 58, 68, 255) if variant_index else (180, 180, 184, 255))
            for frame_index, frame in enumerate(motion["frames"]):
                crop = atlas.crop((frame["x"], frame["y"], frame["x"] + frame["w"], frame["y"] + frame["h"]))
                crop.thumbnail((cell_w - 8, cell_h - 8), Image.Resampling.LANCZOS)
                x = label_w + frame_index * cell_w + (cell_w - crop.width) // 2
                y = row * cell_h + cell_h - crop.height
                preview.alpha_composite(crop, (x, y))

    preview.save(PREVIEW_ROOT / "comparison.png")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Replace the production atlases after preview approval")
    parser.add_argument("--preview-only", action="store_true", help="Build the montage from existing preview atlases")
    args = parser.parse_args()
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    motions = manifest["characters"]["DETROIT_LENS"]["motions"]
    destination_root = ATLAS_ROOT if args.apply else PREVIEW_ROOT

    if not args.preview_only:
        for filename in EXPECTED_SOURCE_HASHES:
            source = ATLAS_ROOT / filename
            destination = destination_root / filename
            temporary = destination.with_suffix(".white.tmp.webp") if args.apply else destination
            transform_atlas(source, temporary, motions)
            if args.apply:
                temporary.replace(destination)
            print(f"Prepared {destination.name}: {destination.stat().st_size} bytes")

    if not args.apply:
        build_preview(motions, destination_root)
        print(PREVIEW_ROOT / "comparison.png")


if __name__ == "__main__":
    main()
