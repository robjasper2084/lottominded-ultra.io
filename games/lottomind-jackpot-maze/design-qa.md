# LottoMind Jackpot Maze — Design QA

## Detroit sign and character-cleanup pass — 2026-07-13

- Source visual truth: the user annotations identify the blank Level 4 wall blocks; the existing compact green Detroit signs establish the required size and municipal sign treatment.
- Initial source capture: `design-qa-source.png`.
- Filled-sign capture: `design-qa-implementation.png`.
- Side-by-side evidence: `design-qa-comparison.png`.
- Verification viewport: 1280 x 720.

### Visible results

- Every eligible wall block now carries a Detroit street name; the previous 12-sign cap no longer leaves the lower blocks blank.
- Sign dimensions were returned to the original compact size after the enlarged treatment was rejected.
- Sign boxes retain their original compact dimensions; lettering uses a 9 px minimum, lighter keyline, and 4x text resolution for readable names without widening the maze blocks.
- Every label is now width-fitted to the inner sign face with an 8 px inset on both sides, preventing long street names from crossing the white border.
- Floating P1/P2 and villain letter boxes were removed from above the characters.
- Maze geometry, road openings, collision behavior, portals, hearts, and character sizes are unchanged.

### Verification

- Full maze comparison: passed.
- Character-head cleanup: passed in live Level 1 gameplay.
- Browser console: passed with no errors.
- Asset validation: passed (15 production assets).
- Unit tests: passed (20 tests across 5 files).
- Production build: passed.

### Comparison history

- Pass 1: five lower Level 4 blocks were blank because generated signs were capped at 12.
- Pass 2: every block was labeled, but the enlarged signs were too dominant.
- Pass 3: original sign dimensions restored, text raster sharpness increased, and character letter badges removed.

Final result: passed.

## Comparison target

- Source visual truth: `qa-evidence/source-desktop.png` and `qa-evidence/source-mobile.png`
- Final implementation: `qa-evidence/implementation-desktop-final2.png` and `qa-evidence/implementation-mobile-final.png`
- Full-view comparisons: `qa-evidence/comparison-desktop-final.png` and `qa-evidence/comparison-mobile-final.png`
- Focused comparison: `qa-evidence/comparison-focused-final.png`
- Desktop viewport: 1280 x 720
- Mobile viewport: 390 x 844
- Desktop state: Level 1 READY state
- Mobile state: active Level 1 gameplay

## Findings

- No actionable P0, P1, or P2 fidelity issues remain.
- The black portrait field, centered score header, maze scale, royal-blue double walls, pink pellets, four large power pellets, side tunnels, center villain house, READY treatment, lower life/status row, and menu controls align with the reference composition.
- The LottoMind mascot, five custom villains, lottery-number slots, larger/sparser pellet cadence, power control, and extra pause control are intentional product substitutions requested by the user.

## Required fidelity surfaces

- Fonts and typography: the white monospaced arcade hierarchy, compact line height, centered score values, yellow READY label, and small lower labels match the source hierarchy. The system monospace is a close substitute for the reference's custom pixel font; this is accepted as P3 polish to avoid shipping the reference font.
- Spacing and layout rhythm: the 520 px portrait frame, score-to-maze spacing, maze height, center pen, lower status strip, and menu placement are aligned at desktop and mobile. The mobile touch controls intentionally occupy the otherwise empty lower screen region.
- Colors and visual tokens: black background, deep royal-blue outer lines, brighter blue inner lines, pale pink pellets, white score text, and yellow READY text match the reference palette.
- Image quality and asset fidelity: all player, villain, police, life, and lottery graphics use the existing LottoMind raster assets. No reference character art is shipped. Sprites remain sharp and readable at the smaller arcade scale.
- Copy and content: source arcade labels are retained where generic (1UP, HIGH SCORE, READY, MENU), while LottoMind level, lottery, power-up, and character content remains original.

## Comparison history

### Pass 1 — blocked

- P1: the previous 650 px HUD felt like a modern dashboard and changed the composition.
- P1: cyan single-outline rectangular islands did not resemble the reference wall language.
- P1: the maze topology was too simple and the player spawned too close to the bottom edge.
- P2: lives, lottery slots, and controls were not arranged like the arcade lower strip.

### Fixes made

- Replaced the dashboard with the centered 1UP/HIGH SCORE header.
- Rebuilt the playfield at 520 x 540 with a black arcade field.
- Added double royal-blue rounded walls, side-tunnel breaks, T/L wall structures, and the centered villain pen.
- Repositioned the player to the lower-middle start lane and placed the lead villain above the pen.
- Added the lower life/status strip and arcade-style Pause/Menu controls.
- Preserved the requested larger, less numerous pellets and all five LottoMind villains.

### Post-fix evidence

- Desktop comparison: `qa-evidence/comparison-desktop-final.png`
- Mobile comparison: `qa-evidence/comparison-mobile-final.png`
- Focused typography, maze, sprite, and footer comparison: `qa-evidence/comparison-focused-final.png`

## Interaction verification

- Start game: passed
- Keyboard movement and pellet scoring: passed
- Mobile directional control and pellet scoring: passed
- Pause and resume: passed
- Responsive desktop and 390 x 844 layouts: passed

## Follow-up polish

- P3: a licensed open pixel font could tighten letterform fidelity further.
- P3: the required fifth villain and lottery slots create slightly greater visual density than the four-enemy reference.

## Final result

final result: passed
