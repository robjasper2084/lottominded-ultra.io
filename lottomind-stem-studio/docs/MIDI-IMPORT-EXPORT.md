# MIDI Import And Export

MIDI file import/export is handled locally in the browser and does not require Web MIDI hardware permission.

## Import

The current parser reads Standard MIDI File chunks and extracts the practical MVP event set:

- `MThd` header
- `MTrk` track chunks
- tempo meta events
- time-signature meta events when present
- note on/off events

Imported notes are converted into browser DAW patterns, notes, and clips.

## Export

The exporter writes a simple Standard MIDI File from the current selected pattern or song note data. It is intended for moving sketches into other DAWs and should be treated as an MVP writer rather than a complete MIDI workstation.

## Web MIDI

Web MIDI is optional and permission-based. Supported browsers can connect controllers for note input, controller mapping, MIDI learn, and MIDI thru. Browsers without Web MIDI still support MIDI file import/export.

