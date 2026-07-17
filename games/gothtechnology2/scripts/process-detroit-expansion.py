from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / "assets" / "sprite-production" / "higgsfield-v2" / "expansion-sources"
STAGE_ROOT = ROOT / "assets" / "user-stage"


def process_stage(source_name: str, output_name: str) -> None:
    STAGE_ROOT.mkdir(parents=True, exist_ok=True)
    with Image.open(SOURCE_ROOT / source_name) as source:
        frame = ImageOps.fit(source.convert("RGB"), (1600, 900), method=Image.Resampling.LANCZOS)
        frame.save(STAGE_ROOT / output_name, "WEBP", quality=88, method=6)


def main() -> None:
    stages = (
        ("detroit-riverfront.png", "detroit-riverfront.webp"),
        ("eastern-market-after-dark.png", "eastern-market-after-dark.webp"),
        ("michigan-central-concourse.png", "michigan-central-concourse.webp"),
    )
    for source_name, output_name in stages:
        process_stage(source_name, output_name)
    print(f"Processed {len(stages)} Detroit stages at 1600x900")


if __name__ == "__main__":
    main()
