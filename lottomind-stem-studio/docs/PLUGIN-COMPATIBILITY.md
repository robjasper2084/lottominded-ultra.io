# Plugin Compatibility

The static web version supports built-in Web Audio plugins now and keeps compatibility hooks for future desktop builds.

## Supported Now

- Built-in Web Audio instruments
- Built-in Web Audio effects
- Built-in analyzers
- MIDI tools implemented in JavaScript

## Compatibility Roadmap

Native desktop plugin formats require a native wrapper or desktop bridge. This browser app does not claim to run these formats directly:

- VST2 Bridge Placeholder
- LADSPA Bridge Placeholder
- LV2 Bridge Placeholder
- SoundFont2 Player Placeholder
- GUS Patch Loader Placeholder

SoundFont2 and GUS files can be listed as user-provided project metadata until a permissively licensed local parser/player is added.

## Copyright And Safety

Do not bundle proprietary plugins, copyrighted SoundFonts, or third-party sample libraries. Users are responsible for loading files they own or are licensed to use.

