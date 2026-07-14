from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
UI = ROOT / 'public' / 'assets' / 'ui'
ICONS = UI / 'icons'
ICONS.mkdir(parents=True, exist_ok=True)

names = [
    'number-orb', 'mega-ball', 'powerball', 'gold-coin',
    'lucky-clover', 'gold-mind-shield', 'tax-refund', 'karma-mirror',
    '777-rush', 'dream-oracle', 'clarity-heart', 'soul-ticket',
    'lottery-ticket', 'checkpoint', 'hazard-trap', 'vault-key'
]

atlas = Image.open(ROOT / 'source-assets' / 'processed' / 'collectibles-atlas.png').convert('RGBA')
cell_w, cell_h = atlas.width / 4, atlas.height / 4
for index, name in enumerate(names):
    col, row = index % 4, index // 4
    pad_x, pad_y = int(cell_w * .045), int(cell_h * .045)
    crop = atlas.crop((int(col * cell_w) + pad_x, int(row * cell_h) + pad_y, int((col + 1) * cell_w) - pad_x, int((row + 1) * cell_h) - pad_y))
    crop.thumbnail((224, 224), Image.Resampling.LANCZOS)
    out = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
    out.alpha_composite(crop, ((256 - crop.width) // 2, (256 - crop.height) // 2))
    out.save(ICONS / f'{name}.png', optimize=True)

reference = Image.open(ROOT / 'source-assets' / 'production-originals' / 'visual' / 'mascot-reference.png').convert('RGB')
side = min(reference.width, reference.height)
left = (reference.width - side) // 2
avatar = reference.crop((left, 0, left + side, side))
for size in (192, 512):
    avatar.resize((size, size), Image.Resampling.LANCZOS).save(UI / f'icon-{size}.png', optimize=True)

sign = Image.open(ROOT / 'source-assets' / 'processed' / 'detroit-street-sign-blank.png').convert('RGBA')
sign = sign.crop(sign.getbbox())
sign.thumbnail((512, 160), Image.Resampling.LANCZOS)
sign.save(UI / 'detroit-street-sign-blank.webp', 'WEBP', lossless=True, method=6)

source_environments = ROOT / 'source-assets' / 'environments'
runtime_environments = ROOT / 'public' / 'assets' / 'environments'
for source in source_environments.glob('*.png'):
    image = Image.open(source).convert('RGB')
    image.thumbnail((1600, 900), Image.Resampling.LANCZOS)
    image.save(runtime_environments / f'{source.stem}.webp', 'WEBP', quality=82, method=6)

print(f'Created {len(names)} game icons, a street-sign plate, two PWA icons, and compressed world plates.')
