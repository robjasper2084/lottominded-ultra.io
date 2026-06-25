# 2084 Static WAV WebGL Browser Build

Style formula: LottoMind-presented static-war neon with black-space depth, cyan signal grids, violet static wells, magenta threats, warm-gold interface accents, parallax horizon layers, atlas-backed sprites, additive bloom, and high-contrast readable silhouettes.

The game is a same-screen local co-op top-down survival shooter for one to four pilots on desktop and mobile browsers. The gameplay simulation, authored level progression, controls, team lives, bombs, multiplier, spawning, collision, pickups, gravity wells, and audio behavior are preserved from the previous local 4-player build.

Renderer choice: browser WebGL, the OpenGL ES path available to `index.html`. The DOM remains responsible for HUD/menu/touch controls; the playfield, parallax, sprites, grid, bullets, particles, wells, enemies, players, and bomb pulses are drawn through shader programs and WebGL buffers. The actor/weapon/hazard sprites use generated normal maps in a lit sprite shader with dynamic lights from players, bullets, wells, and bomb pulses.

Primary verbs: move, aim/fire, bomb, pause/restart. Player one supports keyboard, mouse, and touch; player two supports a second keyboard cluster; gamepads map onto pilots one through four. Levels advance through authored wave pressure: each sector has a quota, enemy mix, spawn cadence, and optional gravity wells that pull actors and spawn threats until destroyed.

Core loop: choose one to four pilots, enter the signal, clear the current sector quota and wells, collect multiplier shards, survive contact as a team, spend shared bombs under pressure, advance to the next harder sector, and restart after signal loss.

Implementation: one static WebGL canvas page with DOM HUD/menu, relative local assets under `assets/2084/`, fixed-step simulation, deterministic seeded random structure inherited from the existing build, capped DPR, selective additive bloom for gameplay signals, CSS menu/mobile polish, score popups in a DOM FX layer, and a disabled-by-default dev overlay via `?dev=1`.
