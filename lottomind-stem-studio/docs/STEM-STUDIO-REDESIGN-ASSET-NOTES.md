# Stem Studio Hardware Redesign Asset Notes

## ChatGPT Image 2 Static Asset Prompts

Use these prompts to generate replacement PNG/WebP assets for `assets/brand/generated-ui/`. Keep all app labels and controls code-native; generated images should be background, panel, texture, logo, and module art only.

1. `LOTTOMINDED ULTRA Stem Studio premium browser music workstation hero background, black glass hardware console, cyan violet magenta gold neon light passes, central waveform spectrum, mixer bridge, drum pads, synth keyboard, no readable UI text, cinematic product render, 16:9.`
2. `Hardware component sheet for a futuristic music production web app: rotary knobs, fader caps, LED buttons, transport buttons, VU meters, waveform screens, drum pad textures, piano key strips, black glass and metallic gold/cyan accents, transparent or dark background.`
3. `LOTTOMINDED ULTRA Stem Studio module card art set: Mix Assistant, Beat2Lotto+, Sound Vault, Master Suite, Waveform Studio, Drum Pads, DJ Decks, cohesive black neon cyber studio style, no fake app copy.`
4. `Premium logo lockup for LOTTOMINDED ULTRA Stem Studio, neon cyan violet gold on black, hardware instrument badge, favicon orb variant, transparent background option.`

## Higgsfield AI Motion Prompts

Use these only for optional video loops. The page must still work with the current static images and CSS animation.

1. `Slow cinematic pass over a dark futuristic music workstation, glowing waveform meters and synth keys pulsing gently, cyan violet magenta gold lights, seamless 8 second loop, no text.`
2. `Abstract ray-trace signal beams moving across a black glass audio console, subtle particles, premium cyber studio mood, seamless background loop, reduced brightness behind UI.`
3. `Close-up of neon mixer faders, drum pads, and spectrum analyzer breathing with music energy, smooth macro camera movement, no readable text, loopable 6 seconds.`

## Integration Notes

- Store generated static assets under `assets/brand/generated-ui/`.
- Use compressed WebP/PNG for GitHub Pages performance.
- If video loops are added, place them under `assets/brand/generated-motion/` and keep a static image fallback.
- Respect `prefers-reduced-motion`; do not autoplay heavy motion when the user requests reduced motion.
- Do not upload audio or user files. Existing Stem Studio browser-local workflow remains the default.
