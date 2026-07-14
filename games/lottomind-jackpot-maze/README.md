# LottoMind: Jackpot Maze

An original React + TypeScript + Phaser 3 maze-chase browser game. It uses secure random lottery-number generation for entertainment-only reveals and never claims to predict lottery results.

## Run locally

```powershell
npm install
npm run dev
```

Open the Vite URL ending in `/games/lottomind-jackpot-maze/`.

## Verify and build

```powershell
npm run validate:assets
npm test
npm run build
npm run preview
```

The deployable PWA is written to `dist/`. The source is standalone and does not overwrite another game.

## What is included

- Pick 3, Pick 4, Mega Millions, and Powerball rule configurations
- Rejection-sampled `crypto.getRandomValues` generation
- Three original, compact arcade mazes with continuous neon walls, spaced jumbo pellets, side tunnels, power orbs, and a vault progression loop
- Five villain types: Tax Man, Grim Reaper, Chaos Ex, Envy Crew, and the Jackpot Patrol police robot
- Generated mascot, enemy, boss, collectible, power-up, and environment art
- Keyboard and touch controls, pause, mute, reduced motion, high contrast, game speed, and screen-shake settings
- Local saved-number wallet and PWA offline precache
- Vitest coverage and CircleCI build/test/asset validation

The maze-chase rules use familiar arcade conventions, while the code, Detroit environments, lottery systems, characters, villains, UI, and artwork are original LottoMind material.

## Documentation

- [Controls](docs/CONTROLS.md)
- [Asset replacement](docs/ASSET_REPLACEMENT.md)
- [Lottery rules](docs/LOTTERY_RULES.md)
- [Embedding](docs/EMBEDDING.md)
- [Asset-generation prompts](docs/ASSET_PROMPTS.md)

## Disclaimer

For entertainment purposes only. LottoMind does not predict or guarantee lottery results. Play responsibly.
