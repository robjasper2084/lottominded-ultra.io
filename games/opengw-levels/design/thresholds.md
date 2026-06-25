# Thresholds

World size: 1280 by 720 logical units.

Frame budget: 60 fps target, fixed simulation step at 60 Hz, WebGL renderer, device pixel ratio capped at 1.5.

Players: one to four pilots, speed 310 units per second, collision radius 15, respawn invulnerability 2.1 seconds.

Weapons: base fire cooldown 0.115 seconds, bullet speed 760 units per second, bullet lifetime 1.15 seconds.

Progression: 12 authored sector profiles, score multiplier capped at 9, extra shared bomb every 65000 points, extra shared life every 125000 points.

Team economy: starting lives = 2 + selected pilot count, starting bombs = 1 + selected pilot count.

Touch: left half controls movement, right half controls aim/fire, bomb button is reachable at the lower center edge.

Visual assets: 2084 Static WAV branding, parallax, UI skins, VFX, and sprite atlas live under `assets/2084/` and load with relative paths.

Lighting/post: normal-map sprite lighting uses at most 8 dynamic lights per frame. Bloom remains selective and additive on gameplay signals only; DOM HUD/menu text stays outside the post-effect path.

Audio: ambient and gravity hum loops are quiet; one-shot effects are capped in code to avoid stacking too loudly.
