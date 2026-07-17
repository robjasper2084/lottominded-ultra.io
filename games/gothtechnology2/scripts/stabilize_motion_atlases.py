import json
from pathlib import Path
from statistics import median

import numpy as np
from PIL import Image


ALPHA_THRESHOLD = 24
CONTENT_PADDING = 2
MAX_RENDER_WIDTH = 184
DEFAULT_HEIGHT_RATIO = 0.98

STABLE_HEIGHT_MOTIONS = {
    "IDLE",
    "READY_STANCE",
    "WALK_FORWARD",
    "WALK_BACK",
    "RUN_FORWARD",
    "RUN_BACK",
    "DASH_FORWARD",
    "DASH_BACK",
    "CROUCH_IDLE",
    "CROUCH_WALK",
    "BLOCK_HIGH",
    "BLOCK_LOW",
    "LIGHT_PUNCH",
    "HEAVY_PUNCH",
    "LIGHT_KICK",
    "HEAVY_KICK",
    "COMBO_1",
    "COMBO_2",
    "THROW_GRAB",
    "THROW_FINISH",
    "HURT_LIGHT",
    "TAUNT",
    "VICTORY",
}

HEIGHT_RATIOS = {
    "IDLE": 1.0,
    "READY_STANCE": 1.0,
    "WALK_FORWARD": 0.98,
    "WALK_BACK": 0.98,
    "RUN_FORWARD": 0.90,
    "RUN_BACK": 0.90,
    "DASH_FORWARD": 0.88,
    "DASH_BACK": 0.88,
    "CROUCH_IDLE": 0.72,
    "CROUCH_WALK": 0.72,
    "BLOCK_LOW": 0.72,
    "CROUCH_ATTACK": 0.72,
    "JUMP_START": 1.0,
    "LANDING": 1.0,
    "JUMP_RISE": 1.0,
    "JUMP_PEAK": 1.0,
    "JUMP_FALL": 1.0,
    "AIR_ATTACK": 1.0,
    "KNOCKDOWN": 1.0,
    "GET_UP": 1.0,
    "DEFEAT": 1.0,
}


def alpha_bounds(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.where(alpha > ALPHA_THRESHOLD)
    if not len(xs):
        raise ValueError("Packed frame contains no visible pixels")
    return int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)


def frame_bounds(root: Path, sheet_cache: dict[str, Image.Image], motion: dict) -> list[tuple[int, int, int, int]]:
    sheet_url = motion["sheet"]
    sheet = sheet_cache.setdefault(sheet_url, Image.open(root / sheet_url).convert("RGBA"))
    output = []
    for frame in motion["frames"]:
        crop = sheet.crop((frame["x"], frame["y"], frame["x"] + frame["w"], frame["y"] + frame["h"]))
        output.append(alpha_bounds(crop))
    return output


def stabilize_manifest(root: Path, manifest_path: Path) -> None:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["stabilizationVersion"] = 1
    manifest["stabilization"] = {
        "alphaThreshold": ALPHA_THRESHOLD,
        "contentPadding": CONTENT_PADDING,
        "maxRenderWidth": MAX_RENDER_WIDTH,
        "anchor": "bottom-center",
    }

    sheet_cache: dict[str, Image.Image] = {}
    for character_id, character in manifest["characters"].items():
        motions = character["motions"]
        bounds_by_motion = {
            motion_name: frame_bounds(root, sheet_cache, motion)
            for motion_name, motion in motions.items()
        }
        idle_heights = [bottom - top for _, top, _, bottom in bounds_by_motion["IDLE"]]
        canonical_height = float(median(idle_heights))
        character["stabilization"] = {
            "canonicalHeight": canonical_height,
            "stableHeightMotions": sorted(STABLE_HEIGHT_MOTIONS),
        }

        for motion_name, motion in motions.items():
            bounds = bounds_by_motion[motion_name]
            target_height = canonical_height * HEIGHT_RATIOS.get(motion_name, DEFAULT_HEIGHT_RATIO)
            widths = [right - left for left, _, right, _ in bounds]
            heights = [bottom - top for _, top, _, bottom in bounds]
            uniform_scale = min(target_height / max(heights), MAX_RENDER_WIDTH / max(widths))
            stable_height = motion_name in STABLE_HEIGHT_MOTIONS

            for frame, (left, top, right, bottom), visible_width, visible_height in zip(
                motion["frames"], bounds, widths, heights, strict=True
            ):
                scale = uniform_scale
                if stable_height:
                    scale = min(target_height / visible_height, MAX_RENDER_WIDTH / visible_width)
                crop_left = max(0, left - CONTENT_PADDING)
                crop_top = max(0, top - CONTENT_PADDING)
                crop_right = min(frame["w"], right + CONTENT_PADDING)
                crop_bottom = min(frame["h"], bottom + CONTENT_PADDING)
                frame["content"] = {
                    "x": crop_left,
                    "y": crop_top,
                    "w": crop_right - crop_left,
                    "h": crop_bottom - crop_top,
                    "visibleW": visible_width,
                    "visibleH": visible_height,
                    "scale": round(scale, 6),
                }

            motion["stableHeight"] = stable_height
            motion["targetVisibleHeight"] = round(target_height, 3)

    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    manifest_path = root / "assets" / "motion-atlases" / "motion-atlas-manifest.json"
    stabilize_manifest(root, manifest_path)
    print(f"Stabilized motion metadata: {manifest_path}")


if __name__ == "__main__":
    main()
