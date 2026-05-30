# Automation

Automation in LottoMind Stem Studio stores track-based parameter movement as local project metadata and applies it to browser-safe controls.

## Lane Targets

Automation can target:

- track volume and pan
- mixer channel volume and pan
- EQ low, mid, and high
- filter cutoff
- effect parameters
- synth parameters
- send amounts
- crossfader
- tempo metadata

## Points And Curves

Each lane contains points with beat, value, and curve mode. MVP curve modes are:

- linear
- hold
- smooth

## Modulation Sources

Computer-controlled modulation source metadata includes:

- LFO
- envelope
- step modulator
- random modulator
- sidechain follower placeholder

Sidechain follower support is a future hook unless a local browser-safe analyzer/modulator is implemented.
