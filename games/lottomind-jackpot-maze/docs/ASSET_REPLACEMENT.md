# Asset replacement guide

## Runtime assets

- `public/assets/mascot/mascot-atlas.webp`: 8 columns × 6 rows, frame size 181 × 181
- `public/assets/villains/villains-atlas.webp`: 4 columns × 3 rows, frame size 362 × 362
- `public/assets/villains/envy-crew-strip.webp`: 6 columns × 1 row, frame size 362 × 724
- `public/assets/villains/jackpot-patrol-strip.webp`: 6 columns × 1 row, frame size 362 × 724
- `public/assets/ui/icons/`: isolated 256 × 256 collectible and power-up icons
- `public/assets/ui/detroit-street-sign-blank.webp`: reusable generated reflective Detroit street-sign plate with live Phaser text layered above it
- `public/assets/environments/*.webp`: compressed 16:9 world plates

Keep frame dimensions, row order, transparent padding, and bottom-center anchors unchanged unless you also update `src/game/GameRuntime.ts`.

## Source assets

`source-assets/chroma/` preserves every generated flat-background master. `source-assets/processed/` preserves the full collectible and boss atlases. `source-assets/environments/` preserves full-resolution PNG world plates. `source-assets/production-originals/` holds the large PNG and audio masters that are intentionally excluded from the shipped game.

To regenerate cropped icons, PWA icons, and compressed environment plates:

```powershell
& "C:\Users\digit\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" scripts\process_assets.py
npm run validate:assets
```

The production pipeline uses one whole-strip generation pass per character family to reduce frame drift. Avoid independent frame-by-frame generation unless visual inconsistency is acceptable.
