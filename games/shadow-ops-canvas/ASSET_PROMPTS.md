# Asset Prompts

These prompts document the Higgsfield Nano Banana 2 pass and the next recommended asset pass. Keep all art original to LottoMind and do not copy commercial game art, names, logos, sprites, or layouts.

## Generated In This Pass

### Level 1 Background

Original wide 2D side-scrolling cyber-jungle vault background layer, deep indigo forest silhouettes, violet mist, black-metal ruins traced with thin gold circuitry, sparse magenta energy, open readable gameplay space, no characters, no enemies, no collectibles, no HUD, no text, no logos, seamless/croppable landscape. Match the provided LottoMind concept screenshot: glossy premium toy-like 2D arcade art, black metal, gold circuit trim, neon purple and magenta energy, crisp readable side-scroller silhouettes, high contrast.

### Level 2 Background

Original wide 2D side-scrolling golden circuit foundry background layer, black-metal underground forge, glowing gold machinery, violet molten energy channels, conveyors, sparks, steam, casino-chip vault technology motifs, open readable gameplay space, no characters, no enemies, no collectibles, no HUD, no text, no logos, seamless/croppable landscape.

### Level 3 Background

Original wide 2D side-scrolling astral vault core background layer for a browser run-and-gun. Cosmic black sky, purple nebula mist, floating gold circuit platforms far in the distance, giant heart-core reactor glow, premium arcade game art, open readable gameplay space. No characters, no enemies, no collectibles, no HUD. Absolutely no readable text, no words, no letters, no digits, no signage, no logos; use only abstract tiny circuit dashes and unreadable holographic glyph-glow.

### Bosses

- Canopy Drone Queen: hovering black-and-purple vault drone queen, gold circuit wings, amber visor eye, magenta energy emitter, cute premium toy proportions but threatening, isolated full body.
- Jackpot Forge Titan: large black-metal mech with slot-machine vault-core chest, gold circuit armor, violet exhaust, heavy arms for ground slams, premium toy-like game art, isolated full body.
- Midas Heartcore Overlord: giant crowned black-and-gold AI guardian core, purple heart reactor, floating drone arms, gold circuitry, magenta halo, dramatic final-boss silhouette, isolated full body.

### Character Enemy Sprites

Base prompt: Production-ready 2D side-scrolling browser game enemy sprite for LottoMind Vault Run. Use the attached concept screenshot and hero as style reference: glossy black tech armor, gold circuit tracery, violet neon trim, amber visor/energy core, cute but combat-ready arcade proportions, crisp high-detail game art readable at small size. Single isolated subject on transparent PNG alpha. No scenery, no text, no labels, no UI, no floor, no shadow, no border, full body centered with generous padding.

- Low Crawler: compact low silhouette, four small articulated legs, side view facing left, body fits a 74x54 px hitbox.
- Hover Drone: round compact body, two small rotor pods with violet glow, dangling emitter, side view/front three-quarter facing left, body fits a 78x54 px hitbox.
- Shield Guard: humanoid cyber guard with black/gold armor, violet energy shield on front arm, side view facing left, full body upright, fits a 78x104 px hitbox.
- Turret: compact mounted cannon module with circular violet core and short barrel facing left, fits an 82x68 px hitbox.

Higgsfield returned opaque checkerboard previews for the first pass, so each sprite was passed through Higgsfield background removal, cropped to alpha bounds, and resized to a lightweight runtime PNG.

### Mission Motion And Branded Background Pass

Because local disk space was extremely low, this pass used compact local sprite construction rather than another high-resolution AI batch. The generated runtime sheets are transparent PNGs with original LottoMind M marks, gold circuitry, violet/cyan glow, and no third-party art:

- `mission_collectibles_sheet.png`: 8-frame rows for shards, keycards, health hearts, and overdrive medallions.
- `extraction_portal_sheet.png`: 8-frame extraction ring with gold, cyan, and magenta motion.
- `vault_gate_sheet.png`: 4-frame branded vault gate column with M lock plate and pulse states.
- `branded_background_props_sheet.png`: 3x2 prop sheet for medallions, terminals, relays, plaques, and signal cores placed behind platforms.

### UI

- Transparent gold sci-fi circuit frame for level title cards.
- Wide gold and purple boss health bar frame.
- LottoMind vault victory badge with gold circuit medallion and purple heart energy.

## Recommended Next Pass

### Player Sprite Sheet

Transparent PNG sprite sheet, 8 frames per row, bottom-center anchor consistent across all frames. Cute LottoMind cyber mascot hero, black cap with gold M emblem, purple hair/circuit face accents, black and gold tech jacket, compact heart blaster. Rows: idle, run right, run left, jump, crouch, crouch-shot, aim up, dash. Bright magenta heart-energy muzzle flashes, clean silhouette, no scenery, no labels.

### Enemy Animation Sheet

Future animation expansion: transparent PNG sprite sheet, original cyber vault enemy set. Rows: small ground crawler, hovering drone with purple rotors, shield guard with angular neon shield, wall turret with charge frame, hit flash, destroyed parts. Black graphite armor, gold circuit lines, purple/pink weapon energy, readable at small game scale.

### Clean Modular Tiles

Generate one tile sheet per level with no checkerboard preview background. Use a single flat chroma key color outside the art if true alpha is unavailable. Include straight pieces, end caps, corners, walls, moving-platform tile, conveyor tile, and hazard trim.

## World Prompt Audit - Better Fit For The Game

### Audit Findings

- The world prompts were too broad. Asking for parallax backgrounds, platforms, props, fog, UI-like holograms, and boss objects in one asset pass makes the generated art feel like a showcase sheet instead of a readable run-and-gun level.
- The new environment pack belongs on the startup/title screen only. Gameplay level backgrounds should stay on the original level art unless a prompt explicitly says it is replacing a specific level background.
- Gameplay world props must never create semi-transparent boxes, blue glass panels, or floating preview rectangles in front of the player lane. Those read as collision or blocked space.
- The game looks best when the background is darker and quieter, platforms have crisp bright collision edges, and collectible/enemy silhouettes remain the loudest objects in the gameplay lane.
- Future world prompts should generate fewer, cleaner pieces per request. Separate background layers, platform tiles, interactive props, foreground overlays, and boss arena set pieces.

### Prompt Boundaries

- Startup/title world: cinematic 3D cyber-vault atmosphere, interactive camera feel, drones, fog, platform depth, heart reactor, grid floor, no HUD and no gameplay collision promises.
- Gameplay background: wide 2D parallax-only art with open readable space, no foreground props, no pickups, no enemies, no doors in the player path, no UI, no text.
- Platform tiles: opaque black-gold metal with purple underglow, moss/vines only on edges, crisp flat top collision ledge, transparent background.
- World props: small decorative cutouts only, true alpha, no baked checkerboard, no translucent bounding rectangles, no giant objects that block the hero.
- Foreground overlays: fog, leaves, cables, glow blooms, sparks, and particles only. Keep opacity subtle and never place large opaque shapes over the playfield.

### Ready Prompt - Startup Title World Only

Create a premium interactive 3D title-screen background for Shadow Ops Canvas / KLNM WITH KNDNSS. Use the uploaded cyber-jungle vault reference as style guide: deep purple nebula sky, black-gold cyber-vault architecture, gold circuit walls, floating platforms, subtle drones, distant heart-core reactor glow, neon purple fog, grid floor depth, and cinematic parallax. This is only for the startup/title screen, not gameplay. Keep the left-center area readable for the title menu. No HUD, no text, no mascot unless separately requested, no foreground clutter, no semi-transparent preview boxes, no flat UI panels floating in front of the world. High-end glossy game art, dark background, magenta/purple accents, gold circuit trim, clean depth layers.

### Ready Prompt - Gameplay Background Layer

Create a wide 2D side-scrolling gameplay background layer for Shadow Ops Canvas. Cyber-jungle vault world with dark indigo forest silhouettes, distant black-gold circuit towers, purple fog, small unreadable holographic glows, and subtle vault machinery far behind the play lane. Keep the middle 45 percent of the image open and low contrast so enemies, bullets, pickups, and platforms stay readable. No characters, no enemies, no pickups, no doors blocking the route, no HUD, no text, no logos, no foreground props, no translucent boxes. Seamless/croppable landscape, premium arcade side-scroller style, dark black metal, gold circuit trim, purple/magenta atmosphere.

### Ready Prompt - Modular Gameplay Platforms

Create a transparent PNG asset sheet of modular side-scrolling platform tiles for Shadow Ops Canvas. Black-gold sci-fi metal platforms with purple underglow, thin gold circuit lines, moss and vines hanging only from edges, crisp readable top collision edge, and consistent scale. Include left cap, middle tile, right cap, short ledge, wide bridge, broken ledge, elevator pad, hatch platform, and boss arena platform. Each asset must be fully contained inside its cell with generous padding. No background, no checkerboard baked into pixels, no text, no UI, no characters, no translucent bounding boxes.

### Ready Prompt - Small World Props

Create a transparent PNG asset sheet of small optional world props for Shadow Ops Canvas. Include compact locked vault crate, hatch console, checkpoint pad, reward crate, energy battery, purple crystal, gold circuit switch, warning beacon, small hologram terminal, vine-wrapped wall plate, and tiny amber circuit lamp. Use black metal, gold circuits, purple/magenta glow, moss, and vines. Props must be decorative and small enough to sit behind or beside platforms without looking like blockers. True alpha background only. No large glass rectangles, no semi-transparent boxes, no labels, no readable text, no characters, no HUD.

### Ready Prompt - Foreground And Atmosphere

Create transparent foreground and overlay assets for Shadow Ops Canvas: dark jungle leaves, hanging vines, moss strands, roots, cables, low purple fog, smoke ribbons, magenta glow blooms, amber circuit glows, tiny sparks, and platform underglow strips. Separated assets, subtle opacity, no large panels, no square backgrounds, no text, no characters. These overlays must support gameplay readability and should never cover the player, enemies, projectiles, or collectibles.

### Negative Prompt For World Assets

No mascot, no hero, no microphone, no UI, no HUD, no readable text, no logos, no score panels, no blue transparent rectangles, no semi-transparent bounding boxes, no checkerboard background baked into the art, no cropped cells, no cut-off glows, no props that look like collision gates unless explicitly requested, no bright clutter in the gameplay lane, no oversized collectibles, no full-scene illustration when an asset sheet is requested.

### QA Rules Before Using New World Assets

- Preview every sheet on a dark background and a checkerboard background.
- Reject any cell with visible rectangular alpha haze or preview-box remnants.
- Reject any gameplay prop wider than the hero unless it is a platform or boss arena object.
- Keep decorative props behind gameplay actors, never in the collision lane.
- If a world asset is meant for startup/title only, do not wire it into `drawBackground()` or gameplay scenery.
