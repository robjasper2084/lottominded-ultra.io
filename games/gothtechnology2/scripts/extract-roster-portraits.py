from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ATLAS_ROOT = ROOT / "assets" / "motion-atlases"
OUTPUT_ROOT = ROOT / "assets" / "user-roster"
MANIFEST_PATH = ATLAS_ROOT / "motion-atlas-manifest.json"
CHARACTERS = {
    "KALYX": "kalyx-idle.webp",
    "MASTER_EZRA": "master-ezra-idle.webp",
    "DETROIT_LENS_NOIR": "detroit-lens-noir-idle.webp",
    "AMARA_VALENTINE": "amara-valentine-idle.webp",
}


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    for character_id, filename in CHARACTERS.items():
        frame = manifest["characters"][character_id]["motions"]["IDLE"]["frames"][0]
        content = frame["content"]
        atlas = Image.open(ROOT / manifest["characters"][character_id]["motions"]["IDLE"]["sheet"]).convert("RGBA")
        left = frame["x"] + content["x"]
        top = frame["y"] + content["y"]
        figure = atlas.crop((left, top, left + content["w"], top + content["h"]))
        alpha_bounds = figure.getbbox()
        if alpha_bounds:
            figure = figure.crop(alpha_bounds)
        scale = min(220 / figure.width, 236 / figure.height)
        figure = figure.resize(
            (max(1, round(figure.width * scale)), max(1, round(figure.height * scale))),
            Image.Resampling.LANCZOS,
        )
        portrait = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
        portrait.alpha_composite(figure, ((256 - figure.width) // 2, 250 - figure.height))
        output = OUTPUT_ROOT / filename
        portrait.save(output, "WEBP", quality=92, method=6, exact=True)
        print(f"Prepared {output.relative_to(ROOT)}: {output.stat().st_size} bytes")


if __name__ == "__main__":
    main()
