# LottoMind Vault Run

A static HTML5 Canvas run-and-gun campaign with original LottoMind black/gold/purple arcade art. The player clears three vault sectors, collects each level's three keys, defeats a unique boss, and escapes through the final heartcore portal.

## Campaign Loop

1. Start at the title screen.
2. Play Level 1: Neon Jungle Vault, collect keys, and defeat Canopy Drone Queen.
3. Transition to Level 2: Golden Circuit Foundry, time conveyors/lasers, and defeat Jackpot Forge Titan.
4. Transition to Level 3: Astral Vault Core, cross floating platforms, and defeat Midas Heartcore Overlord.
5. View final results with score, time, kills, accuracy, damage, max combo, rank, best score, fastest clear, and saved unlock progress.

## Controls

- Move: `A/D` or arrow keys
- Jump: `W`, `Space`, or Up
- Crouch: `S` or Down
- Fire: `J` or `Z`
- Dash: `K`, `X`, or Shift
- Overdrive: `E`, `C`, `Q`, `L`, or `O`
- Pause: `P` or Escape
- Start/confirm: Enter

Gamepad and touch controls are supported. Touch controls can be hidden in Settings.


## Underground Sectors

Each campaign level now has one optional-but-required underground sector before the boss gate opens:

- Level 1: Rootline Underworks below Neon Jungle Vault.
- Level 2: Furnace Service Depths below Golden Circuit Foundry.
- Level 3: Astral Catacombs below Astral Vault Core.

After collecting the three surface keys, enter the underground portal with `S`/Down or the touch `DOWN` button. Recover all three power cells, return to the surface through the exit portal, then open the boss gate. Bosses and lottery terminals stay on the surface; projectiles and hazards are cleared during the sector transition.
## Local Run

Serve the parent website folder and open:

`http://127.0.0.1:8150/games/shadow-ops-canvas/index.html?bg=soul-location-1`

Add `&debug=1` to show QA jump buttons for keys, Level 2, Level 3, underground door/enter/cells/clear/surface, boss, defeat, terminal, and victory.

## Files

- `index.html`: semantic game shell, overlays, HUD, touch controls
- `style.css`: responsive game UI styling
- `src/game.js`: fixed-timestep simulation, data-driven levels, boss states, rendering, audio, saves
- `design/assets.csv`: Higgsfield asset contract
- `assets/levels/`: Nano Banana 2 backgrounds and platform tile source sheets
- `assets/bosses/`: Nano Banana 2 boss cutouts
- `assets/ui/`: Nano Banana 2 level frame, boss frame, victory badge
- `docs/higgsfield-generated-assets.json`: generated job IDs and local file inventory

## Save Data

Best score, fastest final victory clear, highest unlocked level, and settings are stored in `localStorage` under versioned LottoMind keys.
