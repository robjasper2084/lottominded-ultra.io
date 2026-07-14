# LottoMind Vault Run

## Direction

LottoMind Vault Run is an original 2D browser run-and-gun built from the classic side-scrolling action fantasy: sprint, jump, duck, shoot, survive pressure, and push toward a vault objective. The reference point is the feel of old-school Contra-style browser action, not its IP, characters, logo, enemies, or level layouts.

The main hero identity is the supplied LottoMind mascot artwork now saved at `assets/hero/lottomind-hero-main.png`. The first concept pass is saved at `docs/lottomind-vault-run-concept.png`.

## Repo Reference

The `chrisDaniel/contra-2000` repo frames its experiment as an online multiplayer Contra-like JavaScript browser game with a MelonJS client and a Spring/Reactor server. Its useful ideas for this project are:

- Keep the client fast and arcade-readable.
- Treat "same level, multiple players, bullets need to feel right" as a future multiplayer target.
- Keep survivor mode as the first shippable single-player loop.

This project keeps the browser game local and static for the first slice, then leaves a path to add session/multiplayer services later.

## Current Playable Slice

The existing `shadow-ops-canvas` slice already has:

- 1280x720 canvas playfield.
- Keyboard and touch controls.
- Title, play, win, and loss states.
- Side-view movement, jump, crouch, fire, and slash actions.
- Player projectile, enemy projectile, hit bursts, pickups, score, combo, and HP.
- Generated LottoMind mascot player atlas, three Higgsfield level backgrounds, three boss sprites, and four standard enemy sprites.
- Cyber-jungle, foundry, and astral vault stages from the current Lottomind game universe.
- Authored reinforcement waves that trigger mid-level pressure without replacing the current hero art.

## Core Loop

1. Start at the title screen with the mascot hero and a clear call to begin.
2. Spawn into a side-scrolling vault lane with simple directional controls.
3. Read threats: ground rushers, air drones, shield units, and turret gates.
4. Shoot from range, duck under fire, jump gaps, slash close threats, and collect signal hearts.
5. Build combo by clearing enemies without taking damage.
6. Spend or bank pickups for power state: spread hearts, pierce shot, shield pulse, or vault key charge.
7. Reach a checkpoint or mini-boss gate.
8. Win the run by cracking the vault objective; lose when HP reaches zero.
9. Restart quickly with score, combo, time, and pickups as the run improvement hooks.

## Session Shape

- First playable target: 3 to 5 minute survivor run.
- Full level target: 8 to 12 minute stage with three encounter beats and one boss.
- Failure recovery: instant restart from title or checkpoint.
- Skill arc: movement safety first, then aim timing, then combo routing.

## Player Verbs

- Move left/right.
- Jump.
- Duck.
- Fire heart rounds.
- Slash at close range.
- Collect hearts/keys.
- Trigger vault burst when charged.

## Encounter Beats

- Beat 1: low ground rushers teach shooting and spacing.
- Beat 2: drones teach vertical reading and jump timing.
- Beat 3: shield units teach slash/pierce decisions.
- Gate: turret lock blocks scroll until enough enemies are cleared.
- Boss: "Signal Warden" uses three readable patterns: sweep beam, drone call, shield dash.

## Systems

- Simulation state owns HP, score, combo, enemy spawn timers, projectile data, pickup state, and run state.
- Canvas renderer owns sprite frame selection, camera/scroll, particles, background layers, and HUD drawing.
- Input maps keyboard/touch into actions: left, right, jump, duck, fire, slash, start.
- Assets are referenced through stable manifest keys, not scattered filenames.
- Future multiplayer should keep server authority over positions, projectiles, hit events, and score.

## Controls

- Move: ArrowLeft/ArrowRight or A/D.
- Jump: ArrowUp, W, or Space.
- Duck: ArrowDown or S.
- Fire: Z or J.
- Slash: X or K.
- Start/restart: Enter.
- Touch controls: on-screen direction and action buttons.

## Art Direction

- Cute cyber mascot hero with black cap, gold/purple circuit wardrobe, and high silhouette readability.
- Dark cyber-jungle vault corridor.
- Gold circuit paths and Lottomind vault motifs.
- Purple signal fog, teal glints, pink heart-fire rounds.
- Original enemy silhouettes: shadow-tech runners, drones, shield crawlers, vault turrets.
- HUD is code-native, but portrait/icon art can be generated.

## Asset Workflow

Use Higgsfield AI Nano Banana 2 for the production art pass where available. Use one complete strip per animation whenever possible, then normalize into fixed-size frames before wiring into the game.

Recommended frame size:

- Player/enemy animation cells: 256x256 source, normalized from strip.
- Runtime draw scale: 0.78 to 0.96 depending on silhouette.
- Background layers: 2048x720 or wider.
- Tiles/platforms: 512x128 modular strips plus 256x256 props.
- FX sheets: 256x256 cells, 8 frames per effect.

Quality gates:

- Same character proportions across every frame.
- Bottom-center anchor alignment.
- Transparent or clean chroma-key background for sprites.
- No labels, no scenery, no UI inside sprite sheets.
- No Contra logo, copied characters, third-party brands, casino imagery, real lottery tickets, or watermarks.

## Implementation Roadmap

1. Hero title pass: done.
2. Mascot runtime atlas pass: done.
3. Design doc and asset prompt manifest: done.
4. Replace remaining code-drawn FX/pickups with generated sheets.
5. Add platform collision and short authored level chunks.
6. Add authored encounter director: done. Enemy animation sheets remain a future art pass.
7. Add checkpoint/vault gate objective.
8. Add mobile layout polish and pause/settings.
9. Add score summary and restart flow.
10. Optional: add networked arena mode inspired by the repo reference.
