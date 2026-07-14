from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "user-title" / "gothtechnology-cover-start-bg.webp"
OUTPUT = ROOT / "assets" / "sprite-production" / "higgsfield-v2" / "references"


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with Image.open(SOURCE).convert("RGB") as image:
        crops = {
            "kalyx-title-reference.jpg": (0, 45, 650, 720),
            "ezra-title-reference.jpg": (640, 45, 1280, 720),
        }
        for name, box in crops.items():
            crop = image.crop(box)
            crop.save(OUTPUT / name, quality=96, subsampling=0)


if __name__ == "__main__":
    main()
