from __future__ import annotations

import colorsys
import hashlib
import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ATLAS_ROOT = ROOT / "assets" / "motion-atlases"
MANIFEST_PATH = ATLAS_ROOT / "motion-atlas-manifest.json"
EXPECTED_SOURCE_HASHES = {
    "kalyx-locomotion.webp": "3ffa88a63aeb501a5c2b7c31be288b39b5bf55639f21c9d8d8455f5292d689cb",
    "kalyx-combat.webp": "d320660457dd596ccb8d291dc4c156b7ae92f8f84b3924bb699ce18d03c5b5c0",
    "kalyx-reaction.webp": "3148620cfee39434d71d84a9b4005c1f737a9d93d12013da0b5eb99d1c2d052c",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def recolor_pixel(pixel: tuple[int, int, int, int], preserve_face: bool) -> tuple[int, int, int, int]:
    r, g, b, a = pixel
    if a <= 8 or preserve_face:
        return pixel

    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    if (h <= 0.16 or h >= 0.96) and s >= 0.22 and 0.07 <= v <= 0.42:
        rr, gg, bb = colorsys.hsv_to_rgb(0.985, min(1.0, s * 1.35), v)
        strength = 0.78
        return (
            round(r * (1 - strength) + rr * 255 * strength),
            round(g * (1 - strength) + gg * 255 * strength),
            round(b * (1 - strength) + bb * 255 * strength),
            a,
        )

    if v <= 0.23 and s <= 0.28:
        target = (
            min(255, round(v * 255)),
            round(v * 255 * 0.18),
            round(v * 255 * 0.24),
        )
        strength = 0.18
        return (
            round(r * (1 - strength) + target[0] * strength),
            round(g * (1 - strength) + target[1] * strength),
            round(b * (1 - strength) + target[2] * strength),
            a,
        )

    return pixel


def recolor_atlas(path: Path, motions: dict[str, dict]) -> None:
    expected_hash = EXPECTED_SOURCE_HASHES[path.name]
    actual_hash = sha256(path)
    if actual_hash != expected_hash:
        raise RuntimeError(
            f"{path.name} does not match the approved source hash; "
            "the black-and-red palette may already be applied"
        )

    image = Image.open(path).convert("RGBA")
    pixels = image.load()
    touched: set[tuple[int, int]] = set()

    for motion in motions.values():
        if Path(motion["sheet"]).name != path.name:
            continue
        for frame in motion["frames"]:
            content = frame["content"]
            origin_x = frame["x"] + content["x"]
            origin_y = frame["y"] + content["y"]
            for local_y in range(content["h"]):
                normalized_y = local_y / max(1, content["h"] - 1)
                for local_x in range(content["w"]):
                    x = origin_x + local_x
                    y = origin_y + local_y
                    if (x, y) in touched:
                        continue
                    touched.add((x, y))
                    normalized_x = local_x / max(1, content["w"] - 1)
                    preserve_face = 0.32 <= normalized_x <= 0.69 and normalized_y <= 0.31
                    pixels[x, y] = recolor_pixel(pixels[x, y], preserve_face)

    temporary = path.with_suffix(".palette.tmp.webp")
    image.save(temporary, "WEBP", quality=92, method=6, exact=True)
    temporary.replace(path)
    print(f"Recolored {path.name}: {path.stat().st_size} bytes")


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    motions = manifest["characters"]["KALYX"]["motions"]
    for filename in EXPECTED_SOURCE_HASHES:
        recolor_atlas(ATLAS_ROOT / filename, motions)


if __name__ == "__main__":
    main()
