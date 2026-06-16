const DB_NAME = "lottominded-ultra";
const DB_VERSION = 1;
const DB_STORE = "projects";
const STORAGE = {
  dawProject: "lottominded.ultra.dawProject.v1",
  dawSettings: "lottominded.ultra.dawSettings.v1",
  midiMappings: "lottominded.ultra.midiMappings.v1",
  pluginPresets: "lottominded.ultra.pluginPresets.v1",
  settings: "lottominded.ultra.settings.v1",
  helpProgress: "lottominded.ultra.helpProgress.v1",
  assetManifest: "lottominded.ultra.assetManifest.v1",
  sunoPrompts: "lottomind.stemStudio.sunoPrompts.v1",
  videoPrompts: "lottomind.stemStudio.videoPrompts.v1",
  videoPromptSettings: "lottomind.stemStudio.videoPromptSettings.v1",
  beatLotteryHistory: "lottomind.stemStudio.beatLotteryHistory.v1",
  lotteryGameCatalog: "lottomind.stemStudio.lotteryGameCatalog.v1",
  customLotteryGames: "lottomind.stemStudio.customLotteryGames.v1",
  beatCreativeBundles: "lottomind.stemStudio.beatCreativeBundles.v1",
  keyboardMappings: "lottominded.ultra.keyboardMappings.v1",
  floatingModesPosition: "lottominded.ultra.floatingModesPosition.v1",
  floatingTransportPosition: "lottominded.ultra.floatingTransportPosition.v1",
  floatingStemMixerPosition: "lottominded.ultra.floatingStemMixerPosition.v1",
  floatingSequencerPosition: "lottominded.ultra.floatingSequencerPosition.v1",
  sequencerLayout: "lottominded.ultra.sequencerLayout.v1",
  topShellLayout: "lottominded.ultra.topShellLayout.v1"
};
const PAD_KEYS = ["1", "2", "3", "4", "q", "w", "e", "r", "a", "s", "d", "f", "z", "x", "c", "v"];
const PAD_KEY_CODES = ["Digit1", "Digit2", "Digit3", "Digit4", "KeyQ", "KeyW", "KeyE", "KeyR", "KeyA", "KeyS", "KeyD", "KeyF", "KeyZ", "KeyX", "KeyC", "KeyV"];
const SYNTH_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const PIANO_KEY_CODES = ["KeyA", "KeyW", "KeyS", "KeyE", "KeyD", "KeyF", "KeyT", "KeyG", "KeyY", "KeyH", "KeyU", "KeyJ"];
const STEM_NAMES = ["Drums", "Bass", "Vocals", "Melody", "Keys", "Guitar", "FX", "Master"];
const DEFAULT_DEMO_STEMS = [
  { stemIndex: 2, name: "Lead Vocals", file: "assets/demo-stems/0%20Lead%20Vocals.mp3" },
  { stemIndex: 6, name: "Backing Vocals", file: "assets/demo-stems/1%20Backing%20Vocals.mp3" },
  { stemIndex: 0, name: "Drums", file: "assets/demo-stems/2%20Drums.mp3" },
  { stemIndex: 1, name: "Bass", file: "assets/demo-stems/3%20Bass.mp3" },
  { stemIndex: 4, name: "Keyboard", file: "assets/demo-stems/4%20Keyboard.mp3" },
  { stemIndex: 3, name: "Synth", file: "assets/demo-stems/5%20Synth.mp3" }
];
const COLORS = ["#29f7ff", "#5eff9d", "#ff4fd8", "#ffe071", "#8a5cff", "#ff7a5c", "#37ffcf", "#b36bff"];
const ASSETS = {
  logo: "assets/brand/lm-ultra-logo.svg",
  hero: "assets/brand/generated-ui/chatgpt-image-2-future-shell-hero.png",
  settings: "assets/brand/lm-settings-console.svg",
  help: "assets/brand/lm-help-orb.svg",
  pads: "assets/brand/lm-touch-pad.svg",
  keyboard: "assets/brand/lm-keyboard-synth.svg",
  mixer: "assets/brand/lm-stem-mixer.svg",
  decks: "assets/brand/lm-dj-decks.svg",
  suno: "assets/brand/lm-suno-prompt.svg",
  beatDNA: "assets/brand/lm-beat-dna.svg",
  sunoPrompt: "assets/brand/lm-suno-prompt.svg",
  videoPrompt: "assets/brand/lm-video-prompt.svg",
  higgsfieldStyle: "assets/brand/lm-higgsfield-style.svg",
  klingStyle: "assets/brand/lm-kling-style.svg",
  storyboard: "assets/brand/lm-storyboard.svg",
  cameraMotion: "assets/brand/lm-camera-motion.svg",
  beatLottery: "assets/brand/lm-beat-lottery.svg",
  numberOrb: "assets/brand/lm-number-orb.svg",
  creativeBundle: "assets/brand/lm-creative-bundle.svg",
  splash: "assets/brand/lm-splash-icon.svg"
};
function resolveAsset(generated, fallback) {
  return generated || fallback;
}
function getAsset(name) {
  try {
    const manifest = JSON.parse(localStorage.getItem(STORAGE.assetManifest) || "{}");
    return resolveAsset(manifest[name], ASSETS[name]);
  } catch (error) {
    return ASSETS[name];
  }
}
const FACTORY_KITS = [
  { name: "Neon Trap 808", tone: "trap", color: "#ffe071" },
  { name: "Detroit Techno Core", tone: "techno", color: "#29f7ff" },
  { name: "Cyber Jungle Breaks", tone: "jungle", color: "#5eff9d" },
  { name: "Future House Garage", tone: "garage", color: "#ff4fd8" },
  { name: "Ambient R&B Neon", tone: "rnb", color: "#8a5cff" }
];
const KIT_PAD_NAMES = ["Kick", "Snare", "Closed Hat", "Open Hat", "Clap", "Rim", "Low Tom", "Mid Tom", "Crash", "Ride", "Shaker", "Tamb", "Perc 1", "Perc 2", "Perc 3", "Perc 4"];
const US_STATE_OPTIONS = ["US", "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "PR", "VI"];
const LOTTERY_METHODS = [
  ["beat-dna", "Beat DNA"],
  ["rhythm-signature", "Rhythm Signature"],
  ["drum-pattern", "Drum Pattern"],
  ["stem-mix", "Stem Mix"],
  ["live-touch-performance", "Live Touch Performance"],
  ["piano-roll-melody", "Piano Roll Melody"],
  ["mixer-automation", "Mixer Automation"],
  ["random-beat-dna", "Random + Beat DNA"],
  ["locked-beat-seed", "Locked Beat Seed"]
];
const LOTTERY_GAME_CATALOG = [
  { id: "pick-3", scope: "state", name: "Pick 3 / Daily 3", type: "digits", digitCount: 3, digitMin: 0, digitMax: 9, allowRepeats: true, sortNumbers: false, supportsBoxStraight: true, sessions: ["midday", "evening"], description: "Three-digit game format. Rules vary by state." },
  { id: "pick-4", scope: "state", name: "Pick 4 / Daily 4", type: "digits", digitCount: 4, digitMin: 0, digitMax: 9, allowRepeats: true, sortNumbers: false, supportsBoxStraight: true, sessions: ["midday", "evening"], description: "Four-digit game format. Rules vary by state." },
  { id: "pick-5-digits", scope: "state", name: "Pick 5 Digits", type: "digits", digitCount: 5, digitMin: 0, digitMax: 9, allowRepeats: true, sortNumbers: false, supportsBoxStraight: true, sessions: ["midday", "evening"], description: "Five-digit game format where available. Rules vary by state." },
  { id: "powerball", scope: "multi-state", name: "Powerball", type: "matrix-special", mainCount: 5, mainMin: 1, mainMax: 69, allowRepeats: false, sortNumbers: true, specialName: "Powerball", specialMin: 1, specialMax: 26, officialUrl: "https://www.powerball.com/", description: "Five main numbers plus one Powerball. Verify rules with official source." },
  { id: "mega-millions", scope: "multi-state", name: "Mega Millions", type: "matrix-special", mainCount: 5, mainMin: 1, mainMax: 70, allowRepeats: false, sortNumbers: true, specialName: "Mega Ball", specialMin: 1, specialMax: 24, officialUrl: "https://www.megamillions.com/", description: "Five main numbers plus one Mega Ball. Verify rules with official source." },
  { id: "cash-5", scope: "state", name: "Cash 5 / Fantasy 5", type: "matrix", mainCount: 5, mainMin: 1, mainMax: 39, allowRepeats: false, sortNumbers: true, customRangeEditable: true, description: "Five-number state game template. Matrix varies by state." },
  { id: "lotto-6", scope: "state", name: "State Lotto 6", type: "matrix", mainCount: 6, mainMin: 1, mainMax: 49, allowRepeats: false, sortNumbers: true, customRangeEditable: true, description: "Six-number state lotto template. Matrix varies by state." },
  { id: "custom", scope: "custom", name: "Custom Game", type: "custom", description: "Build your own state lottery matrix." }
];
const MASTER_TARGET_PROFILES = {
  "streaming-safe": { label: "Streaming Safe", targetLufs: -14, truePeakCeiling: -1, maxLimiterGainReduction: 3, minDynamicRange: 8, eqIntensity: 0.35, compressionIntensity: 0.35, saturation: 0.1, stereoWidth: 0.08 },
  "club-loud": { label: "Club Loud", targetLufs: -9, truePeakCeiling: -1, maxLimiterGainReduction: 5, minDynamicRange: 6, eqIntensity: 0.45, compressionIntensity: 0.55, saturation: 0.18, stereoWidth: 0.12 },
  "punchy-trap": { label: "Punchy Trap / 808", targetLufs: -10, truePeakCeiling: -1, maxLimiterGainReduction: 4, minDynamicRange: 6, lowEndFocus: 0.65, transientPunch: 0.65, harshnessControl: 0.45, stereoWidth: 0.08 },
  "clean-pop": { label: "Clean Pop", targetLufs: -11, truePeakCeiling: -1, maxLimiterGainReduction: 4, minDynamicRange: 7, vocalPresence: 0.55, air: 0.45, stereoWidth: 0.12 },
  "cinematic-wide": { label: "Cinematic Wide", targetLufs: -16, truePeakCeiling: -1.5, maxLimiterGainReduction: 2, minDynamicRange: 10, lowEndFocus: 0.35, air: 0.55, stereoWidth: 0.28 },
  "warm-analog": { label: "Warm Analog", targetLufs: -13, truePeakCeiling: -1, maxLimiterGainReduction: 3, minDynamicRange: 8, warmth: 0.6, saturation: 0.25, air: 0.18 },
  "podcast-clear": { label: "Podcast / Spoken Clear", targetLufs: -16, truePeakCeiling: -1, maxLimiterGainReduction: 4, minDynamicRange: 5, vocalPresence: 0.7, lowCutHz: 75, deEsser: 0.55, stereoWidth: 0 },
  "gentle-cleanup": { label: "Gentle Cleanup", targetLufs: -15, truePeakCeiling: -1.5, maxLimiterGainReduction: 2, minDynamicRange: 9, eqIntensity: 0.2, compressionIntensity: 0.15, saturation: 0.05 },
  "reference-match": { label: "Reference Match", targetLufs: -14, truePeakCeiling: -1, maxLimiterGainReduction: 3, minDynamicRange: 8, eqIntensity: 0.25, compressionIntensity: 0.25, saturation: 0.05, stereoWidth: 0.08 },
  custom: { label: "Custom", targetLufs: -14, truePeakCeiling: -1, maxLimiterGainReduction: 3, minDynamicRange: 8, eqIntensity: 0.3, compressionIntensity: 0.3, saturation: 0.08, stereoWidth: 0.08 }
};
const MASTER_EQ_BANDS = [
  { id: "sub", label: "Sub", min: 20, max: 60 },
  { id: "bass", label: "Bass", min: 60, max: 120 },
  { id: "lowMid", label: "Low Mid", min: 120, max: 350 },
  { id: "mud", label: "Mud", min: 200, max: 500 },
  { id: "box", label: "Box", min: 400, max: 800 },
  { id: "mid", label: "Mid", min: 800, max: 1500 },
  { id: "presence", label: "Presence", min: 1500, max: 4000 },
  { id: "harsh", label: "Harsh", min: 2500, max: 6000 },
  { id: "sibilance", label: "Sibilance", min: 5000, max: 9000 },
  { id: "air", label: "Air", min: 10000, max: 16000 }
];
const MASTER_PRESETS = [
  { id: "streaming-balanced", category: "Streaming", name: "Streaming Balanced", description: "-14 LUFS, -1 dBTP, subtle correction, mono-safe bass.", targetProfile: "streaming-safe", bands: [{ type: "high-pass", freq: 25, gain: 0, q: 0.7, mode: "stereo" }, { type: "bell", freq: 300, gain: -0.8, q: 0.9, mode: "stereo" }, { type: "bell", freq: 2500, gain: 0.5, q: 0.8, mode: "mid" }, { type: "high-shelf", freq: 12000, gain: 0.7, q: 0.7, mode: "stereo" }], stereo: { monoBelowHz: 120, sideHighShelf: 0.2, widthAmount: 0.08 }, limiter: { targetLufs: -14, truePeakCeiling: -1, maxGainReduction: 3 }, saturation: 0.08, warnings: [] },
  { id: "trap-808-clean", category: "Hip-Hop / Trap", name: "Trap 808 Clean", description: "Tight sub, controlled mud, preserved transient punch.", targetProfile: "punchy-trap", bands: [{ type: "high-pass", freq: 24, gain: 0, q: 0.7, mode: "stereo" }, { type: "low-shelf", freq: 65, gain: 0.8, q: 0.7, mode: "mid" }, { type: "bell", freq: 280, gain: -1.2, q: 0.9, mode: "stereo" }, { type: "bell", freq: 4200, gain: -0.8, q: 1.2, mode: "stereo" }, { type: "high-shelf", freq: 11500, gain: 0.8, q: 0.7, mode: "stereo" }], stereo: { monoBelowHz: 120, sideHighShelf: 0, widthAmount: 0.08 }, limiter: { targetLufs: -10, truePeakCeiling: -1, maxGainReduction: 4 }, saturation: 0.14, warnings: ["Watch 808 headroom before limiting."] },
  { id: "detroit-techno-punch", category: "Electronic", name: "Detroit Techno Punch", description: "Forward drums, clean low mids, club-ready but still punchy.", targetProfile: "club-loud", bands: [{ type: "high-pass", freq: 26, gain: 0, q: 0.7, mode: "stereo" }, { type: "bell", freq: 240, gain: -0.9, q: 0.9, mode: "stereo" }, { type: "bell", freq: 1800, gain: 0.7, q: 0.8, mode: "mid" }, { type: "high-shelf", freq: 10500, gain: 0.9, q: 0.75, mode: "side" }], stereo: { monoBelowHz: 130, sideHighShelf: 0.7, widthAmount: 0.12 }, limiter: { targetLufs: -9, truePeakCeiling: -1, maxGainReduction: 5 }, saturation: 0.18, warnings: ["Hot target: check dynamic range before export."] },
  { id: "future-house-bright", category: "Club", name: "Future House Bright", description: "Bright top, clean low end, polished dance master.", targetProfile: "club-loud", bands: [{ type: "high-pass", freq: 28, gain: 0, q: 0.7, mode: "stereo" }, { type: "bell", freq: 350, gain: -1, q: 0.9, mode: "stereo" }, { type: "bell", freq: 3200, gain: 0.8, q: 0.9, mode: "mid" }, { type: "high-shelf", freq: 12000, gain: 1.2, q: 0.7, mode: "side" }], stereo: { monoBelowHz: 120, sideHighShelf: 0.9, widthAmount: 0.16 }, limiter: { targetLufs: -9, truePeakCeiling: -1, maxGainReduction: 5 }, saturation: 0.12, warnings: ["Use harshness warning if cymbals bite."] },
  { id: "rnb-warm-vocal", category: "R&B", name: "R&B Warm Vocal", description: "Warm body, vocal presence, smooth air.", targetProfile: "clean-pop", bands: [{ type: "high-pass", freq: 28, gain: 0, q: 0.7, mode: "stereo" }, { type: "low-shelf", freq: 100, gain: 0.4, q: 0.7, mode: "mid" }, { type: "bell", freq: 300, gain: -0.9, q: 0.9, mode: "stereo" }, { type: "bell", freq: 2200, gain: 0.8, q: 0.8, mode: "mid" }, { type: "bell", freq: 5200, gain: -0.7, q: 1.1, mode: "stereo" }, { type: "high-shelf", freq: 12500, gain: 1, q: 0.7, mode: "stereo" }], stereo: { monoBelowHz: 120, sideHighShelf: 0.2, widthAmount: 0.08 }, limiter: { targetLufs: -12, truePeakCeiling: -1, maxGainReduction: 4 }, saturation: 0.16, warnings: [] },
  { id: "cinematic-wide", category: "Cinematic", name: "Cinematic Wide", description: "Airy, spacious, dynamic, low-end protected.", targetProfile: "cinematic-wide", bands: [{ type: "high-pass", freq: 22, gain: 0, q: 0.7, mode: "stereo" }, { type: "bell", freq: 250, gain: -0.7, q: 0.8, mode: "stereo" }, { type: "high-shelf", freq: 13000, gain: 1.5, q: 0.7, mode: "side" }], stereo: { monoBelowHz: 100, sideHighShelf: 1, widthAmount: 0.25 }, limiter: { targetLufs: -16, truePeakCeiling: -1.5, maxGainReduction: 2 }, saturation: 0.04, warnings: ["Keep dynamics alive for cinematic material."] },
  { id: "podcast-clear", category: "Podcast", name: "Podcast Clear", description: "Speech-safe cleanup, de-ess approximation, loudness-friendly.", targetProfile: "podcast-clear", bands: [{ type: "high-pass", freq: 75, gain: 0, q: 0.7, mode: "stereo" }, { type: "bell", freq: 220, gain: -1.5, q: 0.9, mode: "stereo" }, { type: "bell", freq: 3000, gain: 1.5, q: 0.9, mode: "mid" }, { type: "bell", freq: 6500, gain: -1, q: 1.4, mode: "stereo" }, { type: "low-pass", freq: 16000, gain: 0, q: 0.7, mode: "stereo" }], stereo: { monoBelowHz: 180, sideHighShelf: 0, widthAmount: 0 }, limiter: { targetLufs: -16, truePeakCeiling: -1, maxGainReduction: 4 }, saturation: 0.02, warnings: [] },
  { id: "master-rescue-mud-fix", category: "Repair", name: "Master Rescue / Mud Fix", description: "Gentle cleanup for muddy exports before creative enhancement.", targetProfile: "gentle-cleanup", bands: [{ type: "high-pass", freq: 30, gain: 0, q: 0.7, mode: "stereo" }, { type: "bell", freq: 240, gain: -1.8, q: 0.8, mode: "stereo" }, { type: "bell", freq: 520, gain: -1, q: 1, mode: "stereo" }, { type: "high-shelf", freq: 11000, gain: 0.6, q: 0.7, mode: "stereo" }], stereo: { monoBelowHz: 130, sideHighShelf: 0.2, widthAmount: 0.04 }, limiter: { targetLufs: -15, truePeakCeiling: -1.5, maxGainReduction: 2 }, saturation: 0.04, warnings: ["Repair preset uses correction before enhancement."] }
];
const HELP_TOPICS = {
  "quick-start": {
    title: "Quick Start",
    copy: "Get sound moving quickly, then save or export the session.",
    steps: ["Load the demo project or load your own stems.", "Press Play All or start one channel.", "Move mixer faders and try mute/solo.", "Open Pads and touch the 16-pad grid.", "Open Suno Prompt and copy a music prompt.", "Save locally when you like the sketch."],
    tip: "Start with a factory kit and a short pattern before loading large audio files.",
    route: "studio"
  },
  transport: {
    title: "Transport",
    copy: "Control global playback, pause/resume, loop behavior, recording, BPM, timing divisions, metronome, and master level.",
    steps: ["Play All starts or resumes loaded stems and decks.", "Pause preserves stem and deck positions so Resume All can continue.", "Restart jumps playable sources back to the top.", "Loop is a temporary transport loop; Loop All toggles loaded stems and decks into loop mode.", "Set timing divisions from 1/4 through 1/64 triplet for sequencer speed and note repeat feel.", "Record Mix captures browser output where MediaRecorder routing is supported."],
    tip: "Use Seq Follow when you want Play All to start the step sequencer with loaded audio.",
    route: "studio"
  },
  "stem-mixer": {
    title: "Stem Mixer",
    copy: "Load, trim, shape, mute, solo, loop, and export stem channel metadata.",
    steps: ["Load a local audio file into a stem channel.", "Use Start, Stop, and Restart per channel.", "Mute or Solo channels while balancing.", "Shape tone with volume, pan, EQ, filter, and sends.", "Set trim start/end and export a stem map."],
    tip: "Solo mode can be exclusive or additive in Settings.",
    route: "stems"
  },
  "stem-editor": {
    title: "Stem Editor",
    copy: "Edit the selected stem buffer locally in the browser.",
    steps: ["Select a loaded stem.", "Set trim start and trim end.", "Preview the trim region.", "Use Truncate, Normalize, Reverse, or Fade.", "Slice the edited region to pads."],
    tip: "Preserve Original Buffers keeps your source safer while experimenting.",
    route: "stems"
  },
  "dj-decks": {
    title: "DJ Decks",
    copy: "Perform with two local decks, cue points, pitch, EQ, filter, and crossfader.",
    steps: ["Load a local track into Deck A or B.", "Use Play/Pause, Stop, Cue, and Set Cue.", "Set hot cues for jump points.", "Adjust pitch, EQ, filter, and deck gain.", "Blend decks with the crossfader."],
    tip: "Decks only load local user files; there are no streaming integrations.",
    route: "dj decks"
  },
  pads: {
    title: "Drum Pads",
    copy: "Touch-reactive 16-pad performance with velocity, aftertouch, banks, samples, and note repeat. Touch velocity uses real pressure on supported devices.",
    steps: ["Tap higher on a pad for stronger velocity.", "On regular touch screens, velocity is simulated from finger position, tap movement, and sensitivity settings.", "Hold and move for aftertouch-style filter and glow.", "Switch banks or load a local sample.", "Choose one-shot, hold, or loop behavior.", "Open Computer Key Mapping to assign pads or piano keys to top-row keys, letters, arrows, or the number pad."],
    tip: "Touch Sensitivity and Haptics are controlled in Settings for a hardware-style feel.",
    route: "pads"
  },
  "key-mapping": {
    title: "Computer Key Mapping",
    copy: "Customize which physical computer keys trigger drum pads and piano notes.",
    steps: ["Open Pads or Keyboard Synth.", "Find Computer Key Mapping.", "Click Learn on a pad or piano key.", "Press the keyboard or number-pad key you want to use.", "Press Clear to unmap one control, or Reset Defaults to restore the original layout."],
    tip: "The app uses physical key codes, so Numpad 1 can be mapped separately from the top-row 1.",
    route: "pads"
  },
  "16-level-pads": {
    title: "16-Level Performance Pads",
    copy: "Turn one selected sound into 16 performance variations across the pad grid.",
    steps: [
      "Select the pad you want to spread across the grid.",
      "Turn on 16-Level Mode.",
      "Choose Velocity, Tune, Filter, Layer, Attack, Decay, Probability, Ratchet, or Slice.",
      "Play the 16 pads. Each pad triggers the same source sound with a different mapped value.",
      "Use Live Overlay for temporary performance or Commit to Bank to save the variations.",
      "Record the performance into the sequencer or piano roll if recording is armed."
    ],
    tip: "Use Tune mode on an 808 or bass sample to play a bassline. Use Ratchet mode on hi-hats for fast rolls. Use Slice mode on loops for instant chops.",
    route: "pads"
  },
  "waveform-studio": {
    title: "Waveform Studio",
    copy: "Edit local audio regions in a browser-first waveform workspace.",
    steps: ["Load or record audio.", "Select a region.", "Cut, trim, split, fade, reverse, or normalize.", "Use the mini-map to zoom.", "Send selection to sampler, pads, AI Master, or prompt tools."],
    tip: "Use zero-crossing snap for cleaner cuts and keep Preserve Original Buffers on while experimenting.",
    route: "song"
  },
  "multitrack-editing": {
    title: "Multitrack Editing",
    copy: "Layer tracks, move clips, crossfade overlaps, record armed lanes, and bounce a mix.",
    steps: ["Add tracks.", "Drag clips onto lanes.", "Overlap clips to crossfade.", "Arm tracks to record.", "Bounce the project to a mix."],
    tip: "Bounce selected clips when you want to commit edits before mastering.",
    route: "song"
  },
  crossfades: {
    title: "Crossfades",
    copy: "Blend overlapping clips with linear, equal-power, slow, fast, or S-curve fades.",
    steps: ["Overlap two clips on the same track.", "Open Crossfade Editor.", "Choose a shape.", "Preview the overlap.", "Commit the fade or keep it editable."],
    tip: "Equal-power crossfades are a strong default for musical clips.",
    route: "song"
  },
  "armed-recording": {
    title: "Armed Recording",
    copy: "Record mic or line input directly onto armed Song Editor tracks.",
    steps: ["Arm one or more tracks.", "Choose a browser input device.", "Toggle monitoring only when safe.", "Press Record Armed.", "Stop to create takes.", "Comp the best take into a clip."],
    tip: "Use headphones while monitoring to avoid feedback.",
    route: "song"
  },
  "open-music-tool-lab": {
    title: "Open Music Tool Lab",
    copy: "Learn the browser-safe roadmap for open workflow inspiration, plugin standards, and sample licensing.",
    steps: ["Open the Open Tools tab.", "Review Web Audio features that work now.", "Read plugin standard roadmap badges.", "Import only samples you own or may use.", "Use desktop bridge notes for future native plugin hosting."],
    tip: "Native plugin formats require a native host or desktop bridge; this static app uses Web Audio first.",
    route: "open tools"
  },
  "sample-licensing": {
    title: "Sample Licensing",
    copy: "Use CC0, public-domain, self-recorded, or properly licensed user-supplied audio.",
    steps: ["Check a sample license before importing.", "Keep attribution notes in project metadata.", "Do not redistribute commercial libraries.", "Export only material you have rights to use."],
    tip: "CC0 and your own recordings are the cleanest path for sharing projects.",
    route: "open tools"
  },
  "adaptive-arrangement": {
    title: "Adaptive Arrangement",
    copy: "Create loopable scenes and transition rules for dynamic music paths.",
    steps: ["Create scenes like intro, verse, chorus, drop, and outro.", "Set loopable clips and intensity tags.", "Add transition rules.", "Preview paths.", "Export dynamic arrangement JSON."],
    tip: "Adaptive scenes can improve video prompt storyboards and Suno arrangement notes.",
    route: "song"
  },
  keyboard: {
    title: "Keyboard / Synth",
    copy: "Touch-reactive synth keys for melodies, chords, basslines, and note preview. Pressure-capable screens use real pressure when available.",
    steps: ["Choose a waveform.", "Set octave and volume.", "Touch keys to play notes.", "Move while holding for aftertouch.", "Record MIDI notes into the current pattern when MIDI record is enabled."],
    tip: "On regular touch screens, key velocity is simulated from finger position, tap movement, and sensitivity settings.",
    route: "sampler"
  },
  sequencer: {
    title: "Sequencer",
    copy: "Program step patterns for the pad engine with straight or triplet timing.",
    steps: ["Toggle steps on a pad lane.", "Switch 16, 32, or 64 step views.", "Choose timing from 1/4 through 1/64 triplet.", "Use Swing and Humanize for feel.", "Enable Pad Record to capture pad hits.", "Clear or randomize patterns as needed."],
    tip: "Use 1/16T or 1/32T for rolling hats, and 1/64T for very fast bursts.",
    route: "sequencer"
  },
  sampler: {
    title: "Sampler",
    copy: "Load, record, trim, process, slice, and assign samples.",
    steps: ["Load a local sample or record mic audio.", "Set trim start/end.", "Preview, truncate, reverse, or normalize.", "Slice to pads for performance.", "Assign the sample to the selected pad."],
    tip: "Snap Trim to Zero Crossing helps avoid clicks when implemented for detailed trimming.",
    route: "sampler"
  },
  recorder: {
    title: "Recorder",
    copy: "Record mic or line input with browser permissions.",
    steps: ["Refresh input devices.", "Choose an input.", "Monitor if needed.", "Start and stop recording.", "Assign recording to a stem or pad, or export it."],
    tip: "Nothing is uploaded; capture stays local.",
    route: "recorder"
  },
  "suno-prompt": {
    title: "Suno Prompt",
    copy: "Generate music-only prompt material from your DAW arrangement and mix choices.",
    steps: ["Make a beat or arrangement.", "Open Suno Prompt.", "Copy the generated music prompt.", "Add your own original lyrics if needed.", "Avoid artist names and copyrighted lyric references."],
    tip: "The prompt reads BPM, key, tracks, notes, effects, and automation.",
    route: "suno prompt"
  },
  "video-prompt": {
    title: "Beat -> Video Prompt",
    copy: "Generate cinematic, copy-ready AI video prompts from Beat DNA without uploading audio or calling external APIs.",
    steps: ["Make or load a beat.", "Click Generate Video Prompt.", "Choose a platform format.", "Copy the prompt into Higgsfield, Kling, or another video generator.", "Use image-to-video mode when starting from a still image.", "Use the negative prompt to reduce artifacts."],
    tip: "Video prompts translate rhythm into camera motion, lighting, editing, and storyboard beats.",
    route: "video prompt"
  },
  "video-platforms": {
    title: "Platform Formats",
    copy: "Universal works anywhere; Higgsfield-ready and Kling-ready outputs emphasize different production details.",
    steps: ["Universal is a broad text-to-video prompt.", "Higgsfield-ready emphasizes cinematic hook, camera action, viral moment, and short-form pacing.", "Kling-ready emphasizes subject consistency, scene continuity, camera motion, lighting, and negative prompts.", "Image-to-video mode describes how to animate an uploaded still image."],
    tip: "No prompt is auto-submitted. You stay in control of where it goes.",
    route: "video prompt"
  },
  "video-safety": {
    title: "Safe Video Prompting",
    copy: "Keep generated prompts original and rights-aware.",
    steps: ["Avoid copyrighted characters and logos.", "Avoid celebrity likeness unless you own rights or have permission.", "Avoid living artist style imitation.", "Use original subjects, scenes, genre language, mood, camera, and production terms.", "Keep safety mode enabled for general use."],
    tip: "Original visual direction usually produces cleaner, more flexible results.",
    route: "video prompt"
  },
  "beat-dna": {
    title: "Beat DNA",
    copy: "Beat DNA is the shared local analysis engine that feeds Suno prompts and entertainment-only number generation.",
    steps: ["Make or load a beat.", "Open Beat DNA.", "Review BPM, groove, density, active pads, stems, mixer movement, and entropy.", "Use Generate Suno Prompt, Generate Number Signals, or Generate Both.", "Export the Beat DNA JSON if you want to journal the creative seed."],
    tip: "Beat DNA is a creative seed, not a prediction engine.",
    route: "beat dna"
  },
  "beat-lottery": {
    title: "Creative Number Signals",
    copy: "Create beat-seeded entertainment picks from the current Beat DNA. This is creative number generation, not a prediction.",
    steps: ["Select a state and game.", "Make or load a beat.", "Generate from Beat DNA.", "Copy or save sets.", "Verify game availability and rules with official source.", "Use results for entertainment, journaling, and creative play only."],
    tip: "Lottery outcomes are random. The app does not sell tickets or process wagers.",
    route: "beat lottery"
  },
  "pick-games": {
    title: "Pick 3 / Pick 4",
    copy: "Digit-style games preserve leading zeroes and can show straight, box, pairs, sum, root, and repeat flags.",
    steps: ["Choose Pick 3, Pick 4, or Pick 5 Digits.", "Set your state.", "Generate entertainment picks.", "Use straight and box views for journaling.", "Verify official rules before playing anywhere."],
    tip: "Availability, draw sessions, and play types vary by jurisdiction.",
    route: "beat lottery"
  },
  "state-lottery-templates": {
    title: "State Lottery Templates",
    copy: "Cash 5, Fantasy 5, and Lotto 6 templates are editable starting points because matrices vary by state.",
    steps: ["Select a template.", "Check the displayed matrix.", "Generate sets from Beat DNA.", "Open official rules when available.", "Customize the game if your state uses a different range."],
    tip: "Template output is not official guidance. Always verify with the lottery operator.",
    route: "beat lottery"
  },
  "custom-lottery-builder": {
    title: "Custom Lottery Game Builder",
    copy: "Build a local custom game matrix for entertainment-only beat-seeded generation.",
    steps: ["Enter a game name.", "Choose digit or matrix mode.", "Set number counts and min/max ranges.", "Optionally add a special ball.", "Save the custom game and generate from Beat DNA."],
    tip: "Custom games are stored locally in the browser.",
    route: "beat lottery"
  },
  "responsible-play": {
    title: "Responsible Play",
    copy: "Lottery outcomes are random. Use Creative Number Signals for entertainment, journaling, and creative play only.",
    steps: ["Do not treat generated sets as predictions.", "Do not assume a beat can affect real draws.", "Check official game rules, draw times, prizes, and eligibility.", "Set personal limits if you choose to play lottery games elsewhere.", "The app does not sell tickets, process wagers, or collect age/payment data."],
    tip: "Official lottery sources are the only source for current rules and results.",
    route: "beat lottery"
  },
  files: {
    title: "Files / Projects",
    copy: "Save large local projects and export portable JSON metadata.",
    steps: ["Save Project stores audio buffers in IndexedDB.", "Export Project JSON stores portable metadata.", "Import JSON restores maps and settings.", "Export Stem Map shares channel metadata.", "Clear Project resets the current session."],
    tip: "IndexedDB is used for large audio; localStorage is only for small settings.",
    route: "files"
  },
  settings: {
    title: "Settings",
    copy: "Control audio, touch performance, stems, decks, sequencer, visuals, projects, and help.",
    steps: ["Open Settings from the header or tab.", "Adjust controls; changes apply immediately.", "Export settings before big experiments.", "Import settings to restore a setup.", "Restart the tutorial anytime."],
    tip: "High Contrast mode is useful on stage or bright screens.",
    route: "settings"
  },
  "best-master": {
    title: "Best Master Algorithm",
    copy: "Analyze first, correct problems, then gently enhance and limit for a target profile.",
    steps: ["Load stems or a demo project.", "Open AI Master and choose a profile.", "Run Analyze Master.", "Review loudness, true peak, dynamic range, warnings, and suggestions.", "Preview or export the mastered WAV.", "Use A/B gain match so louder does not automatically feel better."],
    tip: "Streaming Safe is the default: -14 estimated LUFS, -1 dBTP ceiling, max 3 dB limiter reduction, mono bass below 120 Hz.",
    route: "ai master"
  },
  "eq-brain": {
    title: "EQ Brain",
    copy: "Detects broad spectral problems such as mud, harshness, sub rumble, dullness, and missing air.",
    steps: ["Run Analyze Master.", "Review the frequency problem map.", "Use auto EQ as small broad moves.", "Open the preset library for genre targets.", "Use manual EQ only for fine tuning."],
    tip: "Wide, subtle EQ moves are usually safer than dramatic mastering boosts.",
    route: "ai master"
  },
  "loudness-true-peak": {
    title: "Loudness and True Peak",
    copy: "Estimated LUFS approximates perceived loudness; true peak estimates intersample clipping risk.",
    steps: ["Use Streaming Safe for -14 estimated LUFS and -1 dBTP.", "Use hotter profiles only when the song can keep punch.", "Watch limiter gain reduction.", "Keep dynamic range above the profile minimum.", "Export a report with the master."],
    tip: "The browser version labels LUFS as estimated until full BS.1770 K-weighting is implemented.",
    route: "ai master"
  },
  "reference-match": {
    title: "Reference Match",
    copy: "Reference matching is guidance, not cloning. Use small amounts and music you own or have permission to use.",
    steps: ["Load a reference track.", "Analyze it locally.", "Keep match amount low.", "Use smoothing for broad tone only.", "A/B against your project and export the match report."],
    tip: "Match tone and translation, not identity.",
    route: "ai master"
  },
  "mastering-score": {
    title: "Mastering Score",
    copy: "Scores loudness target, true peak safety, dynamic range, spectral balance, low-end control, harshness, stereo balance, mono compatibility, clipping, and export readiness.",
    steps: ["Run the Best Master Algorithm.", "Read the overall score.", "Review warning badges.", "Apply a preset or adjust controls.", "Export WAV and report when the score is in a useful range."],
    tip: "The score is a guide, not a replacement for listening.",
    route: "ai master"
  },
  "song-editor": {
    title: "Song Editor",
    copy: "Arrange stems, samples, MIDI clips, patterns, scenes, and automation on a bar-based timeline.",
    steps: ["Create an audio, instrument, drum, bus, or automation track.", "Add clips to the grid and place them by bar.", "Use snap, zoom, loop, split, duplicate, and delete tools.", "Move the playhead or set a loop region.", "Send patterns from the Pattern Editor into the song."],
    tip: "Keep clips short while sketching; duplicate them once the groove feels right.",
    route: "song"
  },
  "pattern-editor": {
    title: "Pattern Editor",
    copy: "Build beats with touch-friendly step lanes connected to the pad engine.",
    steps: ["Choose a 16, 32, 64, or 128-step view.", "Tap steps on each drum lane.", "Adjust swing, humanize, quantize, and random groove.", "Duplicate or clear patterns.", "Send the selected pattern to the Song Editor as a clip."],
    tip: "Velocity settings from Pads control how recorded hits land in the pattern.",
    route: "patterns"
  },
  "piano-roll": {
    title: "Piano Roll",
    copy: "Draw, edit, preview, quantize, transpose, and record melodic MIDI notes.",
    steps: ["Select a pattern and choose Draw or Select.", "Tap the grid to add notes.", "Drag notes to move pitch or start time.", "Resize notes with large touch handles.", "Use MIDI input or typing-keyboard fallback to record ideas."],
    tip: "Scale highlight keeps basslines and chords easier to place on mobile.",
    route: "piano roll"
  },
  mixer: {
    title: "Mixer",
    copy: "Create unlimited mixer channels, buses, sends, and chainable Web Audio effects.",
    steps: ["Add a track, bus, send, or master-style channel.", "Set volume, pan, EQ, filter, mute, solo, and arm.", "Add built-in effects to the insert rack.", "Route channels to buses or master.", "Watch VU and peak meters while playing."],
    tip: "Native desktop plugin formats are listed as compatibility hooks, not browser-native effects.",
    route: "mixer"
  },
  automation: {
    title: "Automation",
    copy: "Draw and record parameter movement for tracks, mixer channels, effects, instruments, and modulation sources.",
    steps: ["Add an automation lane for a target.", "Tap the curve area to create points.", "Move points by beat and value.", "Arm lanes to record control movement.", "Add LFO, envelope, step, or random modulation sources."],
    tip: "Automation is stored as project metadata and can drive Web Audio parameters during playback.",
    route: "automation"
  },
  plugins: {
    title: "Plugins",
    copy: "Browse built-in Web Audio instruments, effects, analyzers, MIDI tools, and external-format roadmap hooks.",
    steps: ["Open the Plugin Browser.", "Choose instruments like Neon Synth, 808 Engine, or Drum Synth.", "Add effects such as delay, reverb, compressor, EQ, or analyzer.", "Save plugin presets locally.", "Review compatibility notes for VST2, LADSPA, LV2, SoundFont2, and GUS."],
    tip: "The static web app runs built-in browser-safe plugins first.",
    route: "plugins"
  },
  midi: {
    title: "MIDI",
    copy: "Use Web MIDI where supported, map controllers, and import or export Standard MIDI Files.",
    steps: ["Request MIDI access from the MIDI tab.", "Select an input and optional output.", "Enable MIDI record for Piano Roll capture.", "Use MIDI Learn to map controller changes.", "Import or export MIDI files without needing Web MIDI permission."],
    tip: "MIDI file import/export is local file parsing and does not need a connected device.",
    route: "midi"
  },
  standards: {
    title: "Compatibility Standards",
    copy: "Understand which standards work in the static browser app and which are future desktop bridge hooks.",
    steps: ["Use built-in Web Audio instruments and effects now.", "Import MIDI files directly in the browser.", "List SoundFont2 or GUS files as project metadata for future support.", "Treat VST2, LADSPA, and LV2 as future native-wrapper targets.", "Do not bundle copyrighted samples, SoundFonts, or plugins."],
    tip: "A desktop or Electron build would be the right place for native plugin bridges.",
    route: "plugins"
  }
};

let audioCtx = null;
let masterGain = null;
let masterAnalyser = null;
let limiterNode = null;
let mixDestination = null;
let mediaRecorder = null;
let micStream = null;
let sequenceTimer = null;
let animationFrame = null;
let ultraCockpitFrame = null;
let ultraCockpitRunning = false;
let dbPromise = null;
let renderQueued = false;
let deferredInstallPrompt = null;
let waveformPreviewSource = null;
const activePadPointers = new Map();
const activeKeyboardPointers = new Map();
const activeKeyboardShortcuts = new Set();
const activeComputerKeyTargets = new Map();
const fileUrlCache = new Map();

function loadTopShellLayout() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE.topShellLayout) || "{}");
    return {
      mode: ["full", "compact", "collapsed"].includes(saved.mode) ? saved.mode : "full",
      height: clamp(Number(saved.height) || 340, 118, 620)
    };
  } catch (error) {
    return { mode: "full", height: 340 };
  }
}

function saveTopShellLayout() {
  localStorage.setItem(STORAGE.topShellLayout, JSON.stringify(state.ui.topShell));
}

function loadSequencerLayout() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE.sequencerLayout) || "{}");
    return {
      size: ["compact", "expanded"].includes(saved.size) ? saved.size : "compact"
    };
  } catch (error) {
    return { size: "compact" };
  }
}

function saveSequencerLayout() {
  localStorage.setItem(STORAGE.sequencerLayout, JSON.stringify(state.ui.sequencer));
}

const state = {
  view: "studio",
  ui: {
    topShell: loadTopShellLayout(),
    sequencer: loadSequencerLayout()
  },
  projectName: "Untitled Stem Studio Session",
  bpm: Number(localStorage.getItem("lss-bpm")) || 120,
  playing: false,
  recording: false,
  metronome: false,
  transport: {
    paused: false,
    loop: false,
    loopAll: false,
    followSequencer: false,
    timingDivision: "1/16"
  },
  keyMappings: loadKeyboardMappings(),
  keyMappingLearn: null,
  master: {
    volume: Number(localStorage.getItem("lss-master-volume")) || 0.85,
    limiter: true,
    meter: 0
  },
  settings: {
    padSensitivity: Number(localStorage.getItem("lss-pad-sensitivity")) || 1,
    keySensitivity: Number(localStorage.getItem("lss-key-sensitivity")) || 1,
    visualIntensity: Number(localStorage.getItem("lss-visual-intensity")) || 1,
    waveformDetail: Number(localStorage.getItem("lss-waveform-detail")) || 1,
    autosave: localStorage.getItem("lss-autosave") === "true",
    stickyTransport: localStorage.getItem("lss-sticky-transport") !== "false",
    daw: {
      defaultTrackType: "instrument",
      defaultClipLengthBars: 4,
      snapDefault: "1/16",
      showBarNumbers: true,
      followPlayhead: true,
      autoCreateMixerChannel: true,
      defaultSongLengthBars: 64
    },
    pianoRoll: {
      defaultNoteLength: "1/8",
      previewNotes: true,
      scaleHighlight: "minor",
      rootNote: "C",
      velocityLaneVisible: true,
      largeTouchHandles: true
    },
    midi: {
      enabled: false,
      autoConnectFirstInput: false,
      midiThru: false,
      recordVelocity: true,
      defaultInputChannel: "all",
      exportType: 1
    },
    plugins: {
      showCompatibilityPlaceholders: true,
      enableAnalyzers: true,
      defaultLimiterOnMaster: true
    }
  },
  helpTopic: "",
  activeHelpTopic: null,
  settingsOpen: false,
  helpOpen: false,
  firstRunGuideStep: Number(localStorage.getItem(STORAGE.helpProgress) || 0),
  sunoPrompt: null,
  sunoPromptOptions: {
    vocalMode: "with vocals",
    lyricTheme: "",
    songTitle: "",
    artistAvoidance: true,
    explicitMode: false,
    language: "English",
    structure: "intro, verse, chorus, verse, chorus, bridge, final chorus, outro",
    duration: "full song",
    promptDetail: "detailed"
  },
  videoPrompt: null,
  videoPromptOptions: {
    platform: "universal",
    videoType: "music-video",
    visualTheme: "",
    subject: "",
    location: "",
    colorPalette: "neon cyan, violet, magenta, gold, deep black",
    aspectRatio: "16:9",
    duration: "10 seconds",
    cameraStyle: "cinematic",
    motionIntensity: "match beat",
    editStyle: "beat-synced cuts",
    includeLyricsOnScreen: false,
    includeProductShot: false,
    imageToVideoMode: false,
    negativePromptStrength: "balanced",
    safetyMode: true,
    promptDetail: "detailed"
  },
  beatDNA: null,
  beatCreativeBundle: null,
  touchHistory: [],
  beatLottery: {
    selectedState: "MI",
    selectedGameId: "pick-3",
    selectedMethod: "beat-dna",
    setCount: 5,
    includeEntropy: true,
    lockToCurrentBeat: true,
    userSeedText: "",
    lastGenerated: null,
    history: []
  },
  aiMaster: {
    mode: "streaming-safe",
    selectedPresetId: "streaming-balanced",
    targetLufs: -14,
    truePeakCeiling: -1,
    dynamicRangeProtect: true,
    maxLimiterGainReduction: 3,
    preservePunch: true,
    referenceMatchEnabled: false,
    referenceMatchAmount: 20,
    referenceMatchSmoothing: 60,
    broadToneOnly: true,
    aggressive: false,
    monoLowEnd: true,
    monoBelowHz: 120,
    analysisBefore: null,
    analysisAfter: null,
    spectralBalance: null,
    correctiveEq: [],
    enhancementEq: [],
    chain: null,
    qualityScore: null,
    warnings: [],
    suggestions: [],
    referenceBuffer: null,
    referenceFileName: "",
    referenceAnalysis: null,
    lastMasterBuffer: null,
    lastReport: null,
    abMode: "before"
  },
  daw: createDawProject(),
  stems: STEM_NAMES.map((name, index) => createStemChannel(name, index)),
  decks: {
    a: createDeck("a", "Deck A", COLORS[0]),
    b: createDeck("b", "Deck B", COLORS[2])
  },
  padBank: "A",
  padBanks: {},
  pad16Level: {
    enabled: false,
    sourcePadIndex: 0,
    mode: "velocity",
    liveOverlay: true,
    commitTargetBank: "A",
    referencePad: 8,
    velocity: {
      min: 12,
      max: 127,
      curve: "linear"
    },
    tune: {
      minSemitone: -7,
      maxSemitone: 8,
      referencePad: 8,
      scaleLock: false,
      scale: "chromatic",
      rootNote: "C"
    },
    filter: {
      type: "lowpass",
      minCutoff: 180,
      maxCutoff: 12000,
      minResonance: 0.2,
      maxResonance: 8,
      mapTarget: "cutoff"
    },
    layer: {
      layerA: 1,
      layerB: 0,
      crossfade: true
    },
    attack: {
      minMs: 0,
      maxMs: 800,
      curve: "exponential"
    },
    decay: {
      minMs: 60,
      maxMs: 2400,
      curve: "exponential"
    },
    probability: {
      min: 0.05,
      max: 1,
      ghostBelow: 0.35
    },
    ratchet: {
      values: [1, 1, 1, 2, 2, 3, 3, 4, 4, 6, 6, 8, 8, 12, 16, 32],
      gate: 0.65,
      swing: 0
    },
    slice: {
      mode: "equal",
      oneShot: true,
      transientSensitivity: 0.55,
      preservePitch: true
    },
    generatedPads: [],
    lastPerformance: []
  },
  pads: createPads(),
  kits: [],
  selectedKitIndex: 0,
  noteRepeat: "off",
  touch: {
    lastVelocity: 0,
    lastAftertouch: 0
  },
  sequencer: {
    playing: false,
    steps: 16,
    position: 0,
    timingDivision: "1/16",
    swing: 0,
    humanize: 0,
    pattern: Array.from({ length: 16 }, () => Array(64).fill(false)),
    recording: false
  },
  sampler: {
    buffer: null,
    fileName: "",
    trimStart: 0,
    trimEnd: 0,
    source: null,
    recorderChunks: []
  },
  synth: {
    wave: "sine",
    octave: 4,
    volume: 0.45,
    active: new Map()
  },
  recorder: {
    devices: [],
    deviceId: "",
    chunks: [],
    blob: null,
    buffer: null,
    fileName: "Recording",
    monitoring: false
  },
  song: {
    bars: 16,
    subMode: "waveform",
    playheadTime: 0,
    tracks: [
      { id: "song-drums", name: "Drums", clips: [{ bar: 1, length: 4, type: "pattern", ref: 0, color: COLORS[0] }] },
      { id: "song-bass", name: "Bass", clips: [{ bar: 1, length: 8, type: "midi", ref: "bassline", color: COLORS[1] }] },
      { id: "song-melody", name: "Melody", clips: [{ bar: 5, length: 8, type: "midi", ref: "lead", color: COLORS[3] }] },
      { id: "song-vocals", name: "Vocals", clips: [] }
    ]
  },
  waveformStudio: {
    tool: "select",
    source: "selected-stem",
    selection: { startTime: 0.25, endTime: 1.75 },
    cursorTime: 0,
    clipboard: null,
    copiedRegion: null,
    regions: [
      { id: "region-intro", clipId: "", trackId: "song-drums", label: "Intro Loop", startTime: 0, endTime: 4, color: COLORS[0], type: "loop", locked: false, notes: "Starter loop region" },
      { id: "region-hook", clipId: "", trackId: "song-melody", label: "Hook", startTime: 8, endTime: 16, color: COLORS[3], type: "chorus", locked: false, notes: "Prompt/storyboard anchor" }
    ],
    markers: [
      { id: "marker-drop", time: 8, label: "Drop", color: COLORS[2] }
    ],
    viewport: { startTime: 0, endTime: 16, zoom: 1 },
    status: "Load local audio, pick a stem, or bounce the arrangement to start editing.",
    contextMenu: { open: false, x: 0, y: 0, context: null },
    quickEffect: null,
    crossfades: [],
    bounces: [],
    bounceProgress: 0,
    recording: { armedTrackIds: [], active: false, paused: false, monitoring: false, inputDeviceId: "", takes: [] },
    fileInfo: null
  },
  adaptiveArrangement: {
    scenes: [
      { id: "scene-intro", name: "Intro", clips: [], loopable: true, intensity: 0.35, tags: ["atmospheric", "setup"] },
      { id: "scene-drop", name: "Drop", clips: [], loopable: true, intensity: 0.9, tags: ["hook", "high energy"] }
    ],
    transitions: [
      { fromSceneId: "scene-intro", toSceneId: "scene-drop", condition: "after 8 bars", transitionClipId: "", crossfadeBeats: 2 }
    ]
  },
  openTools: {
    compatibilityFocus: "browser-first",
    selectedGuide: "roadmap"
  },
  pianoRoll: {
    steps: 32,
    lowNote: 48,
    highNote: 72,
    notes: [
      { note: 60, step: 0, length: 2, velocity: 0.9 },
      { note: 63, step: 4, length: 2, velocity: 0.72 },
      { note: 67, step: 8, length: 4, velocity: 0.82 }
    ]
  },
  automation: {
    lanes: [
      { id: "auto-master", target: "Master Volume", color: COLORS[3], points: [{ step: 0, value: 0.78 }, { step: 16, value: 0.9 }, { step: 31, value: 0.74 }] },
      { id: "auto-filter", target: "Drums Filter", color: COLORS[0], points: [{ step: 0, value: 0.18 }, { step: 12, value: 0.72 }, { step: 31, value: 0.32 }] }
    ]
  },
  mixerChannels: STEM_NAMES.map((name, index) => ({
    id: `mix-${index}`,
    name,
    volume: index === 7 ? 0.9 : 0.78,
    pan: 0,
    effects: index === 7 ? ["Limiter/Compressor"] : ["Three-Band EQ"],
    color: COLORS[index % COLORS.length]
  })),
  plugins: [
    { id: "plug-synth", name: "Neon Poly Synth", type: "instrument", enabled: true, description: "Browser oscillator synth with touch aftertouch and filter response." },
    { id: "plug-drum", name: "808 Drum Designer", type: "instrument", enabled: true, description: "Original synthetic kick, snare, hat, clap, tom, perc, and texture generator." },
    { id: "plug-eq", name: "Three-Band EQ", type: "effect", enabled: true, description: "Low, mid, and high channel tone shaping using Web Audio filters." },
    { id: "plug-delay", name: "Delay Send", type: "effect", enabled: true, description: "Project-level delay send hook for stem channels." },
    { id: "plug-reverb", name: "Neon Space Reverb", type: "effect", enabled: true, description: "Reverb send hook for recorded vocals, stems, and pads." },
    { id: "plug-comp", name: "Limiter/Compressor", type: "effect", enabled: true, description: "Master dynamics control using browser-native compression." }
  ],
  mixRecordingBlob: null,
  selectedStemId: "stem-0",
  selectedPadIndex: 0,
  toast: null
};

ensurePadBanks();

function createStemChannel(name, index = 0) {
  return {
    id: `stem-${index}`,
    name,
    fileName: "",
    bufferId: "",
    buffer: null,
    muted: false,
    solo: false,
    armed: false,
    volume: name === "Master" ? 0.85 : 0.78,
    pan: 0,
    eq: { low: 0, mid: 0, high: 0 },
    filter: 0,
    sendDelay: 0,
    sendReverb: 0,
    compressor: 0,
    trimStart: 0,
    trimEnd: 0,
    loop: false,
    reverse: false,
    playing: false,
    startTime: 0,
    pausedAt: 0,
    duration: 0,
    color: COLORS[index % COLORS.length],
    source: null,
    nodes: null,
    meter: 0
  };
}

function createDeck(id, name, color) {
  return {
    id,
    name,
    fileName: "",
    buffer: null,
    source: null,
    nodes: null,
    playing: false,
    cue: 0,
    hotCues: [null, null, null, null],
    loopIn: 0,
    loopOut: 0,
    loop: false,
    bpm: 120,
    pitch: 0,
    volume: 0.78,
    gain: 0.82,
    eq: { low: 0, mid: 0, high: 0 },
    filter: 0,
    startTime: 0,
    pausedAt: 0,
    color,
    meter: 0
  };
}

function createDawProject() {
  const song = {
    name: "Untitled Session",
    bpm: 120,
    timeSignature: "4/4",
    key: "C minor",
    lengthBars: 64,
    snap: "1/16",
    loopEnabled: false,
    loopStartBar: 1,
    loopEndBar: 9,
    playheadBeat: 0,
    zoom: 1,
    scrollX: 0,
    scrollY: 0
  };
  const tracks = [
    createDrumTrack("Drums"),
    createInstrumentTrack("Neon Synth"),
    createAudioTrack("Stems"),
    createAutomationTrack("Automation")
  ];
  const patterns = [createPattern("Pattern 1", 4)];
  const clips = [
    createClip(tracks[0].id, "pattern", 0, 16, { patternId: patterns[0].id, name: "Pattern 1", color: tracks[0].color }),
    createClip(tracks[1].id, "midi", 16, 16, { name: "Melody Clip", color: tracks[1].color })
  ];
  const notes = [
    createNote(patterns[0].id, 60, 0, 1, 0.9),
    createNote(patterns[0].id, 63, 4, 1, 0.75),
    createNote(patterns[0].id, 67, 8, 2, 0.85)
  ];
  const automation = [createAutomationLane("master.volume")];
  const mixerChannels = tracks.map((track) => createMixerChannel(track.name, track.type === "bus" ? "bus" : "track", track.id));
  mixerChannels.push(createMixerChannel("Master", "master"));
  return {
    song,
    tracks,
    clips,
    patterns,
    notes,
    automation,
    mixerChannels,
    instruments: [createInstrumentPlugin("neon-synth"), createInstrumentPlugin("808-engine"), createInstrumentPlugin("drum-synth")],
    effects: ["eq3", "compressor", "limiter", "delay", "reverb", "distortion", "chorus", "spectrum"].map(createEffectPlugin),
    midi: {
      inputs: [],
      outputs: [],
      enabled: false,
      selectedInputId: "",
      selectedOutputId: "",
      thruEnabled: false,
      recordEnabled: false,
      quantizeOnRecord: true,
      exportFormat: "midi"
    },
    selectedTrackId: tracks[0].id,
    selectedClipId: clips[0].id,
    selectedPatternId: patterns[0].id,
    selectedMixerChannelId: mixerChannels[0].id,
    selectedAutomationLaneId: automation[0].id,
    selectedTool: "select",
    editMode: "song",
    midiMappings: [],
    compatibilityFiles: []
  };
}

function createTrack(type = "instrument", name = "New Track") {
  const id = makeId("track");
  const mixerChannelId = makeId("mix");
  return {
    id,
    name,
    type,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    muted: false,
    solo: false,
    armed: false,
    collapsed: false,
    mixerChannelId,
    instrumentId: type === "instrument" || type === "drum" ? makeId("inst") : "",
    clips: [],
    sends: [],
    icon: type,
    createdAt: new Date().toISOString()
  };
}

function createAudioTrack(name = "Audio Track") {
  return createTrack("audio", name);
}

function createInstrumentTrack(name = "Instrument Track") {
  return createTrack("instrument", name);
}

function createDrumTrack(name = "Drum Track") {
  return createTrack("drum", name);
}

function createPatternTrack(name = "Pattern Track") {
  return createTrack("pattern", name);
}

function createAutomationTrack(name = "Automation Track") {
  return createTrack("automation", name);
}

function createBusTrack(name = "Bus Track") {
  return createTrack("bus", name);
}

function createClip(trackId, type, startBeat, lengthBeats, overrides = {}) {
  return {
    id: makeId("clip"),
    trackId,
    type,
    name: overrides.name || `${titleCase(type)} Clip`,
    startBeat,
    lengthBeats,
    sourceId: overrides.sourceId || "",
    patternId: overrides.patternId || "",
    audioBufferId: overrides.audioBufferId || "",
    muted: false,
    loop: false,
    color: overrides.color || COLORS[Math.floor(Math.random() * COLORS.length)],
    fadeInBeats: 0,
    fadeOutBeats: 0,
    gain: 1,
    transpose: 0
  };
}

function createPattern(name = "Pattern", bars = 4) {
  return {
    id: makeId("pattern"),
    name,
    bars,
    stepsPerBeat: 4,
    notes: [],
    drumSteps: Object.fromEntries(KIT_PAD_NAMES.map((label, padIndex) => [padIndex, createPatternLane(padIndex, label, bars * 16)])),
    automation: [],
    swing: 0,
    humanize: 0,
    quantize: "1/16",
    color: COLORS[Math.floor(Math.random() * COLORS.length)]
  };
}

function createPatternLane(padIndex, label, steps = 64) {
  return {
    padIndex,
    label,
    steps: Array.from({ length: steps }, () => ({ active: false, velocity: 0.8, probability: 1, offset: 0, flam: 0, repeat: 1 }))
  };
}

function createNote(patternId, pitch = 60, startBeat = 0, durationBeats = 1, velocity = 0.8) {
  return { id: makeId("note"), patternId, pitch, startBeat, durationBeats, velocity, muted: false, selected: false };
}

function createAutomationLane(targetPath = "master.volume") {
  return {
    id: makeId("automation"),
    trackId: "",
    targetPath,
    targetLabel: targetPath.replace(/\./g, " "),
    points: [createAutomationPoint("", 0, 0.5), createAutomationPoint("", 16, 0.85)],
    min: 0,
    max: 1,
    defaultValue: 0,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    visible: true,
    armed: false,
    sources: []
  };
}

function createAutomationPoint(laneId, beat, value, curve = "linear") {
  return { id: makeId("point"), laneId, beat, value, curve };
}

function createMixerChannel(name, type = "track", sourceTrackId = "") {
  return {
    id: makeId("mixer"),
    name,
    type,
    sourceTrackId,
    muted: false,
    solo: false,
    armed: false,
    volume: type === "master" ? 0.9 : 0.85,
    pan: 0,
    eq: { low: 0, mid: 0, high: 0 },
    filter: 0,
    effects: type === "master" ? [createEffectPlugin("limiter")] : [createEffectPlugin("eq3")],
    sends: [],
    input: "",
    output: "master",
    vu: 0,
    peak: 0,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]
  };
}

function createInstrumentPlugin(type = "neon-synth") {
  const names = {
    "neon-synth": "Neon Synth",
    "sub-bass": "Sub Bass",
    "808-engine": "808 Engine",
    "fm-bell": "FM Bell",
    "wavetable-pad": "Wavetable Pad",
    "drum-synth": "Drum Synth",
    sampler: "Sampler",
    "soundfont-placeholder": "SoundFont Player Placeholder"
  };
  return {
    id: makeId("plugin"),
    name: names[type] || titleCase(type),
    type: "instrument",
    category: "Instruments",
    enabled: true,
    params: createInstrumentParams(type),
    presetName: "Default",
    automationTargets: ["gain", "cutoff", "pan", "sendDelay", "sendReverb"],
    pluginType: type
  };
}

function createEffectPlugin(type = "eq3") {
  const names = {
    eq3: "EQ 3-Band",
    "parametric-eq": "Parametric EQ",
    compressor: "Compressor",
    limiter: "Limiter",
    delay: "Delay",
    reverb: "Reverb",
    distortion: "Distortion",
    saturation: "Saturation",
    bitcrusher: "Bitcrusher",
    chorus: "Chorus",
    flanger: "Flanger",
    phaser: "Phaser",
    "auto-filter": "Auto Filter",
    gate: "Gate",
    "stereo-widener": "Stereo Widener",
    spectrum: "Spectrum Analyzer",
    vu: "VU Meter"
  };
  return {
    id: makeId("effect"),
    type,
    name: names[type] || titleCase(type),
    params: createEffectParams(type),
    input: null,
    output: null,
    nodes: [],
    enabled: true,
    automationTargets: ["mix", "gain", "frequency", "feedback", "threshold"]
  };
}

function createInstrumentParams(type) {
  if (type === "808-engine") return { pitch: 48, decay: 0.8, glide: 0.12, distortion: 0.18, click: 0.45, sub: 0.9, tone: 0.5, gain: 0.85 };
  if (type === "drum-synth") return { kickPitch: 55, kickDecay: 0.6, snareNoise: 0.7, snareTone: 0.4, hatDecay: 0.18, clapWidth: 0.5, percussionTune: 0.5 };
  return { waveform: "sawtooth", attack: 0.02, decay: 0.18, sustain: 0.65, release: 0.28, cutoff: 7200, resonance: 0.4, detune: 0, vibrato: 0, reverbSend: 0.15, delaySend: 0.12 };
}

function createEffectParams(type) {
  if (type === "delay") return { time: 0.25, feedback: 0.35, mix: 0.28 };
  if (type === "reverb") return { size: 0.65, damp: 0.4, mix: 0.25 };
  if (type === "compressor" || type === "limiter") return { threshold: -12, ratio: 4, attack: 0.01, release: 0.2 };
  return { mix: 1, gain: 0, frequency: 1000, amount: 0.5 };
}

function makeId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

function createPads() {
  const names = ["Kick", "Snare", "Hat", "Clap", "Tom", "Rim", "Perc", "Sub", "Zap", "Chord", "Vox", "Rise", "Stab", "Bell", "Noise", "Crash"];
  return names.map((name, index) => ({
    id: `pad-${index}`,
    name,
    bank: "A",
    mode: "one-shot",
    sampleName: "",
    buffer: null,
    gain: 0.85,
    pitch: 0,
    muted: false,
    solo: false,
    choke: 0,
    active: false,
    velocity: 0,
    aftertouch: 0,
    color: COLORS[index % COLORS.length],
    layers: [],
    envelope: {
      attack: 0,
      decay: 0.4,
      sustain: 0.8,
      release: 0.12
    },
    probability: 1,
    ratchet: null,
    slice: null,
    source: null,
    gainNode: null,
    filterNode: null
  }));
}

function getDefaultKeyboardMappings() {
  return {
    pads: PAD_KEY_CODES.map((code, index) => ({ index, code })),
    piano: SYNTH_NOTES.map((note, midi) => ({ note, midi, code: PIANO_KEY_CODES[midi] || "" }))
  };
}

function sanitizeKeyboardMappings(mappings = {}) {
  const defaults = getDefaultKeyboardMappings();
  const padEntries = Array.isArray(mappings.pads) ? mappings.pads : [];
  const pianoEntries = Array.isArray(mappings.piano) ? mappings.piano : [];
  return {
    pads: defaults.pads.map((fallback, index) => {
      const saved = padEntries.find((entry) => Number(entry.index) === index) || padEntries[index] || {};
      return { index, code: typeof saved.code === "string" ? saved.code : fallback.code };
    }),
    piano: defaults.piano.map((fallback, midi) => {
      const saved = pianoEntries.find((entry) => Number(entry.midi) === midi) || pianoEntries[midi] || {};
      return { note: fallback.note, midi, code: typeof saved.code === "string" ? saved.code : fallback.code };
    })
  };
}

function loadKeyboardMappings() {
  try {
    return sanitizeKeyboardMappings(JSON.parse(localStorage.getItem(STORAGE.keyboardMappings) || "{}"));
  } catch (error) {
    return getDefaultKeyboardMappings();
  }
}

function saveKeyboardMappings() {
  localStorage.setItem(STORAGE.keyboardMappings, JSON.stringify(state.keyMappings));
}

function getPadKeyCode(index) {
  return state.keyMappings?.pads?.[index]?.code || "";
}

function getPianoKeyCode(midi) {
  return state.keyMappings?.piano?.find((entry) => Number(entry.midi) === Number(midi))?.code || "";
}

function formatKeyCode(code) {
  if (!code) return "Unmapped";
  if (/^Key[A-Z]$/.test(code)) return code.replace("Key", "");
  if (/^Digit\d$/.test(code)) return code.replace("Digit", "");
  if (/^Numpad\d$/.test(code)) return `Num ${code.replace("Numpad", "")}`;
  const labels = {
    Space: "Space",
    Enter: "Enter",
    Tab: "Tab",
    Backquote: "`",
    Minus: "-",
    Equal: "=",
    BracketLeft: "[",
    BracketRight: "]",
    Backslash: "\\",
    Semicolon: ";",
    Quote: "'",
    Comma: ",",
    Period: ".",
    Slash: "/",
    NumpadAdd: "Num +",
    NumpadSubtract: "Num -",
    NumpadMultiply: "Num *",
    NumpadDivide: "Num /",
    NumpadDecimal: "Num .",
    NumpadEnter: "Num Enter",
    ArrowUp: "Up",
    ArrowDown: "Down",
    ArrowLeft: "Left",
    ArrowRight: "Right"
  };
  return labels[code] || code.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function getKeyboardMappingTarget(code) {
  if (!code) return null;
  const padIndex = state.keyMappings?.pads?.findIndex((entry) => entry.code === code) ?? -1;
  if (padIndex >= 0) return { type: "pad", index: padIndex, label: `Pad ${padIndex + 1}` };
  const piano = state.keyMappings?.piano?.find((entry) => entry.code === code);
  if (piano) return { type: "piano", midi: Number(piano.midi), note: piano.note, label: `${piano.note} key` };
  return null;
}

function removeDuplicateKeyboardCode(code, exceptType, exceptId) {
  if (!code) return;
  state.keyMappings.pads.forEach((entry) => {
    if (entry.code === code && !(exceptType === "pad" && Number(entry.index) === Number(exceptId))) entry.code = "";
  });
  state.keyMappings.piano.forEach((entry) => {
    if (entry.code === code && !(exceptType === "piano" && Number(entry.midi) === Number(exceptId))) entry.code = "";
  });
}

function startKeyboardMappingLearn(type, id) {
  state.keyMappingLearn = { type, id: Number(id) };
  toast(`Press a computer key for ${getKeyboardMappingLabel(type, id)}.`);
  render();
}

function getKeyboardMappingLabel(type, id) {
  if (type === "pad") return `Pad ${Number(id) + 1}`;
  const piano = state.keyMappings?.piano?.find((entry) => Number(entry.midi) === Number(id));
  return `${piano?.note || "Piano"} key`;
}

function assignKeyboardMapping(code) {
  const learn = state.keyMappingLearn;
  if (!learn) return false;
  if (!code || code === "Escape") {
    state.keyMappingLearn = null;
    toast("Key mapping canceled.");
    render();
    return true;
  }
  removeDuplicateKeyboardCode(code, learn.type, learn.id);
  if (learn.type === "pad") {
    const entry = state.keyMappings.pads[learn.id];
    if (entry) entry.code = code;
  } else {
    const entry = state.keyMappings.piano.find((item) => Number(item.midi) === Number(learn.id));
    if (entry) entry.code = code;
  }
  const label = getKeyboardMappingLabel(learn.type, learn.id);
  state.keyMappingLearn = null;
  saveKeyboardMappings();
  toast(`${label} mapped to ${formatKeyCode(code)}.`);
  render();
  return true;
}

function clearKeyboardMapping(type, id) {
  if (type === "pad") {
    const entry = state.keyMappings.pads[Number(id)];
    if (entry) entry.code = "";
  } else {
    const entry = state.keyMappings.piano.find((item) => Number(item.midi) === Number(id));
    if (entry) entry.code = "";
  }
  saveKeyboardMappings();
  toast(`${getKeyboardMappingLabel(type, id)} unmapped.`);
  render();
}

function resetKeyboardMappings() {
  state.keyMappings = getDefaultKeyboardMappings();
  state.keyMappingLearn = null;
  activeKeyboardShortcuts.clear();
  activeComputerKeyTargets.clear();
  saveKeyboardMappings();
  toast("Computer key mappings reset.");
  render();
}

function isTextEditingTarget(target) {
  if (!target) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || target.isContentEditable;
}

async function triggerMappedComputerKey(event) {
  const target = getKeyboardMappingTarget(event.code);
  if (!target) return false;
  event.preventDefault();
  if (event.repeat || activeKeyboardShortcuts.has(event.code)) return true;
  activeKeyboardShortcuts.add(event.code);
  activeComputerKeyTargets.set(event.code, target);
  await ensureAudio();
  if (target.type === "pad") triggerPad(target.index, 1, false, true);
  else playSynthNote(target.note, target.midi, 1, true);
  return true;
}

function releaseMappedComputerKey(event) {
  const target = activeComputerKeyTargets.get(event.code) || getKeyboardMappingTarget(event.code);
  if (!target) return false;
  activeKeyboardShortcuts.delete(event.code);
  activeComputerKeyTargets.delete(event.code);
  if (target.type === "pad") releasePad(target.index);
  else releaseSynthNote(target.note, target.midi);
  return true;
}

function initAudio() {
  if (audioCtx) return audioCtx;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    toast("Web Audio is not available in this browser.");
    return null;
  }
  audioCtx = new AudioContextClass();
  masterGain = audioCtx.createGain();
  masterAnalyser = audioCtx.createAnalyser();
  masterAnalyser.fftSize = 1024;
  limiterNode = audioCtx.createDynamicsCompressor();
  limiterNode.threshold.value = -8;
  limiterNode.knee.value = 12;
  limiterNode.ratio.value = 12;
  limiterNode.attack.value = 0.003;
  limiterNode.release.value = 0.18;
  masterGain.gain.value = state.master.volume;
  masterGain.connect(limiterNode);
  limiterNode.connect(masterAnalyser);
  masterAnalyser.connect(audioCtx.destination);
  if (audioCtx.createMediaStreamDestination) {
    mixDestination = audioCtx.createMediaStreamDestination();
    limiterNode.connect(mixDestination);
  }
  return audioCtx;
}

async function ensureAudio() {
  const ctx = initAudio();
  if (!ctx) return null;
  if (ctx.state === "suspended") {
    try {
      await Promise.race([ctx.resume(), new Promise((resolve) => setTimeout(resolve, 240))]);
    } catch (error) {
      // Autoplay rules can defer resume until a trusted pointer/key gesture.
    }
  }
  return ctx;
}

async function decodeAudioFile(file) {
  const ctx = await ensureAudio();
  if (!ctx) return null;
  const arrayBuffer = await file.arrayBuffer();
  return ctx.decodeAudioData(arrayBuffer.slice(0));
}

async function loadAudioFile(file) {
  try {
    const buffer = await decodeAudioFile(file);
    if (!buffer) return null;
    toast(`Loaded ${file.name}`);
    return buffer;
  } catch (error) {
    console.error(error);
    toast(`Could not decode ${file.name}. Try WAV, MP3, AAC, OGG, or FLAC supported by your browser.`);
    return null;
  }
}

function render() {
  const app = document.getElementById("app");
  const topShell = state.ui.topShell;
  app.innerHTML = `
    <div class="studio-cinematic-backdrop" aria-hidden="true"></div>
    <div class="top-shell ultra-cockpit-shell ${state.settings.stickyTransport ? "" : "not-sticky"} top-shell-${topShell.mode}" style="--top-shell-height:${topShell.height}px">
      ${renderTopShellControls()}
      <div class="top-shell-body" id="studio-top-shell-body">
        ${renderTabs()}
        <div class="top-shell-main">
          ${renderHeader()}
          ${renderWorkflowShortcuts()}
          ${renderTransport()}
        </div>
      </div>
    </div>
    <main class="view" data-view="${state.view}">
      ${renderCurrentView()}
    </main>
    ${renderStudioBottomStatus()}
    <p class="footer-note">Load or record audio you own or have permission to use. Browser recording and capture features depend on permissions and platform support.</p>
    ${renderFirstRunGuide()}
    ${renderHelpDialog()}
    ${renderEffectPreviewModal()}
    ${state.toast ? `<div class="toast" role="status">${escapeHtml(state.toast)}</div>` : ""}
  `;
  drawAllCanvases();
  initUltraCockpit();
  initFloatingModes();
  initFloatingTransport();
  initFloatingStemMixer();
  initFloatingSequencer();
}

function renderTopShellControls() {
  const mode = state.ui.topShell.mode;
  const expanded = mode !== "collapsed";
  return `
    <div class="top-shell-controls" aria-label="Studio header layout controls">
      <div class="top-shell-brand">
        <img src="${getAsset("logo")}" alt="" />
        <strong>Lottominded ULTRA</strong>
      </div>
      <button type="button" class="top-shell-toggle" data-action="toggle-top-shell-mode" aria-expanded="${expanded}" aria-controls="studio-top-shell-body">
        ${expanded ? "Collapse" : "Expand"}
      </button>
      <button type="button" class="top-shell-switch" data-action="toggle-top-shell-mode" aria-pressed="${expanded}" aria-label="${expanded ? "Collapse header" : "Expand header"}">
        <span class="switch-track"><span class="switch-dot"></span></span>
        <span>${expanded ? "Header Open" : "Header Closed"}</span>
      </button>
      <button type="button" class="top-shell-waveform-link ${state.view === "waveform studio" ? "is-active" : ""}" data-action="set-view" data-view="waveform studio" aria-pressed="${state.view === "waveform studio"}">
        <span class="top-shell-waveform-icon" aria-hidden="true">WF</span>
        <span>Waveform Studio</span>
      </button>
      <label class="top-shell-height-control">
        <span>Height</span>
        <input type="range" min="118" max="620" step="8" value="${state.ui.topShell.height}" data-action="set-top-shell-height" aria-label="Header panel height" />
      </label>
      <span class="top-shell-hint">${expanded ? "Drag the lower-right edge or use height to resize." : `${titleCase(state.view)} controls hidden.`}</span>
    </div>
  `;
}

function setTopShellMode(mode) {
  if (!["full", "compact", "collapsed"].includes(mode)) return;
  state.ui.topShell.mode = mode;
  if (mode === "compact") state.ui.topShell.height = Math.min(state.ui.topShell.height, 260);
  if (mode === "full") state.ui.topShell.height = Math.max(state.ui.topShell.height, 320);
  saveTopShellLayout();
  render();
}

function toggleTopShellMode() {
  setTopShellMode(state.ui.topShell.mode === "collapsed" ? "full" : "collapsed");
}

function setTopShellHeight(value) {
  state.ui.topShell.height = clamp(Number(value) || 340, 118, 620);
  if (state.ui.topShell.mode === "collapsed") state.ui.topShell.mode = "compact";
  saveTopShellLayout();
  render();
}

function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    render();
  });
}

function renderHeader() {
  return `
    <header class="header ultra-cockpit-header">
      <div class="ultra-brand-zone">
        <a class="app-top-link app-back-link ultra-back-pill" href="../" aria-label="Back to Studio">
          <span aria-hidden="true">←</span>
          <span>Back to Studio</span>
        </a>
        <div class="brand ultra-brand-copy">
          <img class="ultra-brand-orb" src="${getAsset("logo")}" alt="" />
          <div>
            <h1>Stem Studio</h1>
            <p>Hardware-style workstation for stems, pads, decks, prompts, and local-only audio.</p>
          </div>
        </div>
      </div>
      <div class="ultra-project-zone" aria-label="Project details">
        <label class="project-field ultra-project-input">
          <span class="micro">Project</span>
          <input type="text" data-input="projectName" value="${escapeAttr(state.projectName)}" aria-label="Project name" />
        </label>
        <div class="ultra-status-pills" aria-label="Project status">
          <span class="ultra-status-pill">Local</span>
          <span class="ultra-status-pill">${state.savedAt ? "Saved" : "Unsaved"}</span>
          <span class="ultra-status-pill">${state.bpm} BPM</span>
          <span class="ultra-status-pill">${escapeHtml(state.daw?.song?.key || "C minor")}</span>
        </div>
      </div>
      <div class="actions ultra-file-zone" aria-label="File and utility actions">
        <button type="button" data-action="save-project" aria-label="Save project"><span aria-hidden="true">▣</span><span>Save</span></button>
        <button type="button" data-action="load-project" aria-label="Load project"><span aria-hidden="true">▤</span><span>Load</span></button>
        <button type="button" data-action="export-project" aria-label="Export project JSON"><span aria-hidden="true">⇩</span><span>Export</span></button>
        <button type="button" data-action="demo-project" aria-label="Load demo"><span aria-hidden="true">◎</span><span>Demo</span></button>
        <button type="button" data-action="open-settings" aria-label="Open settings"><span aria-hidden="true">⚙</span><span>Settings</span></button>
      </div>
    </header>
  `;
}

function renderTransport() {
  const playingLabel = state.transport.paused ? "Resume All" : state.playing ? "Playing" : "Play All";
  return `
    <section class="transport ultra-command-deck is-floating-transport" data-floating-transport aria-label="ULTRA Studio Cockpit controls">
      <div class="floating-transport-grip" data-floating-transport-handle role="button" tabindex="0" aria-label="Drag transport controls" title="Drag transport controls">
        <span>Transport</span>
        <small>Drag</small>
      </div>
      <div class="ultra-transport-rail" aria-label="Transport rail">
        <button type="button" class="ultra-help-button" data-action="open-help-topic" data-help-topic="transport" aria-label="Transport help">?</button>
        <button type="button" class="ultra-transport-button play" data-action="play-all" aria-pressed="${state.playing && !state.transport.paused}"><span aria-hidden="true">▶</span><span>${playingLabel}</span></button>
        <button type="button" class="ultra-transport-button" data-action="pause-all" aria-pressed="${state.transport.paused}"><span aria-hidden="true">Ⅱ</span><span>Pause</span></button>
        <button type="button" class="ultra-transport-button" data-action="restart-all"><span aria-hidden="true">↻</span><span>Restart</span></button>
        <button type="button" class="ultra-transport-button stop" data-action="stop-all"><span aria-hidden="true">■</span><span>Stop All</span></button>
        <button type="button" class="ultra-transport-button loop" data-action="toggle-transport-loop" aria-pressed="${state.transport.loop}"><span aria-hidden="true">∞</span><span>Loop</span></button>
        <button type="button" class="ultra-transport-button loop" data-action="toggle-loop-all" aria-pressed="${state.transport.loopAll}"><span aria-hidden="true">∞</span><span>Loop All</span></button>
        <button type="button" class="ultra-transport-button" data-action="toggle-sequencer-play" aria-pressed="${state.sequencer.playing}"><span aria-hidden="true">▦</span><span>${state.sequencer.playing ? "Pause Seq" : "Start Seq"}</span></button>
        <button type="button" class="ultra-transport-button" data-action="toggle-follow-sequencer" aria-pressed="${state.transport.followSequencer}"><span aria-hidden="true">⌁</span><span>Seq Follow</span></button>
        <button type="button" class="ultra-transport-button record" data-action="record-mix" aria-pressed="${state.recording}"><span aria-hidden="true">●</span><span>${state.recording ? "Stop Rec" : "Record Mix"}</span></button>
        <button type="button" class="ultra-transport-button" data-action="toggle-metronome" aria-pressed="${state.metronome}"><span aria-hidden="true">◌</span><span>Metronome</span></button>
      </div>
      <div class="ultra-creative-rail" aria-label="Creative mode rail">
        <button type="button" class="ultra-mode-tab suno ${state.view === "suno prompt" ? "active" : ""}" data-action="generate-suno-prompt"><span aria-hidden="true">♪</span><span>Suno</span></button>
        <button type="button" class="ultra-mode-tab video ${state.view === "video prompt" ? "active" : ""}" data-action="generate-video-prompt"><span aria-hidden="true">▣</span><span>Video</span></button>
        <button type="button" class="ultra-mode-tab signals ${state.view === "beat lottery" ? "active" : ""}" data-action="generate-beat-lottery"><span aria-hidden="true">#</span><span>Signals</span></button>
        <a class="app-top-link ultra-mode-tab beat2lotto" href="../beat2lotto-plus.html"><span aria-hidden="true">◎</span><span>Beat2Lotto+</span></a>
        <button type="button" class="ultra-mode-tab master ${state.view === "ai master" ? "active" : ""}" data-action="set-view" data-view="ai master"><span aria-hidden="true">▥</span><span>AI Master</span></button>
        <button type="button" class="ultra-mode-tab bundle" data-action="generate-creative-bundle"><span aria-hidden="true">✦</span><span>Both</span></button>
      </div>
      <div class="ultra-timing-strip" aria-label="Timing strip">
        <label class="field ultra-timing-card ultra-bpm-control">
          <span>BPM</span>
          <input type="number" min="40" max="240" step="1" data-input="bpm" value="${state.bpm}" aria-label="BPM" />
        </label>
        <label class="field ultra-timing-card">
          <span>Timing</span>
          <select data-action="set-timing-division" aria-label="Transport timing division">
            ${getTimingDivisions().map((division) => `<option value="${division}" ${state.transport.timingDivision === division ? "selected" : ""}>${formatTimingDivision(division)}</option>`).join("")}
          </select>
        </label>
        <label class="field ultra-timing-card">
          <span>Key</span>
          <select data-action="set-daw-song-key" aria-label="Song key">
            ${["C minor", "C major", "D minor", "E minor", "F minor", "G minor", "A minor", "B minor"].map((key) => `<option value="${key}" ${state.daw?.song?.key === key ? "selected" : ""}>${key}</option>`).join("")}
          </select>
        </label>
        <label class="field ultra-timing-card">
          <span>Swing</span>
          <input type="range" min="0" max="0.7" step="0.01" data-range="sequencer" data-prop="swing" value="${state.sequencer.swing}" aria-label="Sequencer swing" />
        </label>
        <label class="field ultra-timing-card">
          <span>Master</span>
          <input type="range" min="0" max="1" step="0.01" data-input="masterVolume" value="${state.master.volume}" aria-label="Master volume" />
        </label>
        <div class="field ultra-timing-card ultra-master-mini-meter">
          <span>Limiter ${state.master.limiter ? "armed" : "bypassed"}</span>
          <div class="vu" aria-label="Master meter"><span style="--vu:${Math.round(state.master.meter * 100)}%"></span></div>
        </div>
      </div>
      <div class="transport-status" aria-label="Transport status">
        <span>${state.transport.loop ? "Loop armed" : "Loop off"}</span>
        <span>${state.transport.loopAll ? "All sources loop" : "Manual loops"}</span>
        <span>${state.transport.followSequencer ? "Seq follows play" : "Seq manual"}</span>
        <span>${formatTimingDivision(state.transport.timingDivision)}</span>
      </div>
    </section>
  `;
}

function renderWorkflowShortcuts() {
  const shortcuts = [
    { view: "pads", step: "1", label: "Pads", note: "Play drums" },
    { view: "patterns", step: "2", label: "Patterns", note: "Program steps" },
    { view: "sequencer", step: "3", label: "Sequencer", note: "16/64 grid" },
    { view: "mixer", step: "4", label: "Mixer", note: "Balance levels" },
    { view: "song", step: "5", label: "Song", note: "Arrange clips" },
    { view: "waveform studio", step: "6", label: "Waveform", note: "Edit audio" },
    { view: "beat dna", step: "7", label: "Beat DNA", note: "Export ideas" },
  ];
  return `
    <nav class="workflow-shortcuts" aria-label="Beat workflow shortcuts">
      ${shortcuts.map((shortcut) => `
        <button type="button" class="workflow-shortcut ${state.view === shortcut.view ? "is-active" : ""}" data-action="set-view" data-view="${shortcut.view}" aria-pressed="${state.view === shortcut.view}">
          <span class="workflow-step">${shortcut.step}</span>
          <span><strong>${escapeHtml(shortcut.label)}</strong><small>${escapeHtml(shortcut.note)}</small></span>
        </button>
      `).join("")}
    </nav>
  `;
}

function renderTabs() {
  const tabs = [
    { view: "studio", icon: "HM", label: "Home", hint: "Dashboard" },
    { view: "mixer", icon: "MX", label: "Mixer", hint: "Console" },
    { view: "pads", icon: "PD", label: "Pads", hint: "Drums" },
    { view: "keyboard", icon: "KY", label: "Keyboard", hint: "Synth" },
    { view: "sequencer", icon: "SQ", label: "Sequencer", hint: "Steps" },
    { view: "sampler", icon: "SP", label: "Sampler", hint: "Slices" },
    { view: "dj decks", icon: "DJ", label: "DJ Decks", hint: "Blend" },
    { view: "recorder", icon: "RC", label: "Recorder", hint: "Capture" },
    { view: "song", icon: "AR", label: "Song Editor", hint: "Arrange" },
    { view: "piano roll", icon: "PR", label: "Piano Roll", hint: "MIDI" },
    { view: "waveform studio", icon: "WF", label: "Waveform", hint: "Edit" },
    { view: "plugins", icon: "FX", label: "Plugins", hint: "Rack" },
    { view: "ai master", icon: "AI", label: "AI Tools", hint: "Master" },
    { view: "files", icon: "EX", label: "Export", hint: "Files" },
    { view: "settings", icon: "ST", label: "Settings", hint: "System" },
  ];
  const workflowTabs = new Set(["pads", "sequencer", "mixer", "song", "waveform studio", "ai master"]);
  return `
    <nav class="tabs ultra-left-dock is-floating-modes" data-floating-modes aria-label="Modes">
      <span class="tabs-label floating-modes-grip" data-floating-modes-handle role="button" tabindex="0" aria-label="Drag modes rail" title="Drag modes rail">
        <span>Modes</span>
        <small>Drag</small>
      </span>
      ${tabs.map((tab) => `<button type="button" class="tab ${state.view === tab.view ? "is-active" : ""} ${workflowTabs.has(tab.view) ? "is-workflow-tab" : ""}" data-action="set-view" data-view="${tab.view}" aria-current="${state.view === tab.view ? "page" : "false"}"><span class="tab-icon">${tab.icon}</span><span class="tab-copy"><strong>${escapeHtml(tab.label)}</strong><small>${escapeHtml(tab.hint)}</small></span></button>`).join("")}
    </nav>
  `;
}

function renderStudioHardwareDashboard() {
  const loadedStems = state.stems.filter((stem) => stem.buffer).length;
  const playingStems = state.stems.filter((stem) => stem.playing).length;
  const armedTracks = state.daw.tracks.filter((track) => track.armed).length;
  const activePads = state.pads.filter((pad) => pad.active).length;
  const projectStatus = state.savedAt ? "Saved locally" : "Unsaved local session";
  const quickStarts = [
    { action: "demo-project", icon: "NB", title: "New Beat", copy: "Load the demo stems and start shaping a session." },
    { action: "load-project", icon: "OP", title: "Open Project", copy: "Restore a saved browser project snapshot." },
    { view: "stems", icon: "LS", title: "Load Stems", copy: "Bring in local audio you own or have permission to use." },
    { view: "recorder", icon: "RC", title: "Start Recording", copy: "Capture mic or line input where your browser allows it." },
    { view: "mixer", icon: "MX", title: "Open Mixer", copy: "Balance channels, sends, inserts, and master output." },
    { view: "pads", icon: "PD", title: "Open Pads", copy: "Play the 16-pad grid with pressure-style feedback." },
  ];
  return `
    <section class="studio-hardware-dashboard" aria-label="Stem Studio dashboard">
      <article class="studio-hero-instrument">
        <div class="studio-hero-copy">
          <span class="studio-console-label">LOTTOMINDED ULTRA STEM STUDIO</span>
          <h2>Build the beat from one hardware-style control room.</h2>
          <p>Stems, pads, sequencer, decks, waveform editing, prompt tools, and mastering stay local in the browser. Start simple, then open deeper modules when you need them.</p>
          <div class="studio-hero-actions">
            <button type="button" data-action="play-all">Play All</button>
            <button type="button" data-action="demo-project">Load Demo</button>
            <button type="button" data-action="set-view" data-view="mixer">Open Mixer</button>
            <button type="button" data-action="set-view" data-view="ai master">AI Tools</button>
          </div>
        </div>
        <div class="studio-hero-screen" aria-label="Session signal screen">
          <img src="${getAsset("hero")}" alt="" />
          <div class="studio-spectrum" aria-hidden="true">${Array.from({ length: 28 }, (_, index) => `<span style="--i:${index}"></span>`).join("")}</div>
          <div class="studio-session-readout">
            <span>${projectStatus}</span>
            <strong>${state.bpm} BPM</strong>
            <span>${escapeHtml(state.daw?.song?.key || "C minor")}</span>
          </div>
        </div>
      </article>
      <aside class="studio-session-panel" aria-label="Current session status">
        <div><span>Audio Engine</span><strong>${audioCtx ? "Ready" : "Standby"}</strong></div>
        <div><span>Loaded Stems</span><strong>${loadedStems}/8</strong></div>
        <div><span>Playing</span><strong>${playingStems}</strong></div>
        <div><span>Armed Tracks</span><strong>${armedTracks}</strong></div>
        <div><span>Active Pads</span><strong>${activePads}</strong></div>
        <div><span>Master</span><strong>${Math.round(state.master.volume * 100)}%</strong></div>
      </aside>
      <nav class="studio-quick-starts" aria-label="Quick start actions">
        ${quickStarts.map((item) => `<button type="button" class="studio-quick-card" ${item.action ? `data-action="${item.action}"` : `data-action="set-view" data-view="${item.view}"`}>
          <span>${item.icon}</span>
          <strong>${escapeHtml(item.title)}</strong>
          <small>${escapeHtml(item.copy)}</small>
        </button>`).join("")}
      </nav>
    </section>
  `;
}

function renderStudioBottomStatus() {
  const currentTrack = state.daw.tracks.find((track) => track.id === state.daw.selectedTrackId) || state.daw.tracks[0];
  const projectStatus = state.savedAt ? "Saved" : "Unsaved";
  return `
    <footer class="studio-bottom-status" aria-label="Studio transport and status">
      <div class="studio-bottom-brand"><span>LM</span><strong>Stem Studio</strong></div>
      <div class="studio-bottom-transport">
        <button type="button" data-action="play-all" aria-pressed="${state.playing && !state.transport.paused}">Play</button>
        <button type="button" data-action="pause-all" aria-pressed="${state.transport.paused}">Pause</button>
        <button type="button" data-action="stop-all">Stop</button>
        <button type="button" data-action="record-mix" aria-pressed="${state.recording}">Record</button>
        <button type="button" data-action="toggle-metronome" aria-pressed="${state.metronome}">Metro</button>
      </div>
      <div class="studio-bottom-readout">
        <span>${state.bpm} BPM</span>
        <span>${escapeHtml(state.daw?.song?.timeSignature || "4/4")}</span>
        <span>${escapeHtml(state.daw?.song?.key || "C minor")}</span>
        <span>${projectStatus}</span>
        <span>${escapeHtml(currentTrack?.name || "Track 1")}</span>
      </div>
      <div class="studio-master-meter" aria-label="Master output meter"><span style="--vu:${Math.round(state.master.meter * 100)}%"></span></div>
    </footer>
  `;
}

function renderCurrentView() {
  if (state.view === "studio") return `${renderStudioHardwareDashboard()}${renderStemMixer()}<div class="studio-song-editor">${renderSongEditor()}</div>${renderPads()}`;
  if (state.view === "song") return renderSongEditor();
  if (state.view === "waveform studio") return `${renderWaveformStudio()}${renderSongEditorContextMenu()}`;
  if (state.view === "open tools") return renderOpenMusicToolLab();
  if (state.view === "patterns") return renderPatternEditor();
  if (state.view === "piano roll") return renderPianoRoll();
  if (state.view === "stems") return `${renderStemMixer()}${renderStemEditor()}`;
  if (state.view === "dj decks") return renderDecks();
  if (state.view === "pads") return renderPads();
  if (state.view === "sampler") return renderSampler();
  if (state.view === "sequencer") return renderSequencer();
  if (state.view === "mixer") return renderMixer();
  if (state.view === "ai master") return renderAiMasterPanel();
  if (state.view === "automation") return renderAutomation();
  if (state.view === "plugins") return renderPlugins();
  if (state.view === "midi") return renderMidiPanel();
  if (state.view === "recorder") return renderRecorder();
  if (state.view === "files") return renderFiles();
  if (state.view === "suno prompt") return renderSunoPrompt();
  if (state.view === "video prompt") return renderVideoPromptPanel();
  if (state.view === "beat lottery") return renderBeatLotteryPanel();
  if (state.view === "beat dna") return renderBeatDNAPanel();
  if (state.view === "settings") return renderSettingsPanel();
  if (state.view === "help") return renderHelpCenter();
  return renderStemMixer();
}

function renderSongEditor() {
  const bars = Array.from({ length: state.song.bars }, (_, index) => index + 1);
  const rawSubMode = state.song.subMode || "arrangement";
  const subMode = rawSubMode === "waveform" ? "arrangement" : rawSubMode;
  return `
    <section class="panel song-editor-screen" aria-label="Song editor">
      <div class="panel-header">
        <div>
          <h2>Song Editor</h2>
          <p class="micro">Arrange clips, edit waveforms, record armed tracks, crossfade overlaps, and bounce local audio without uploading anything.</p>
        </div>
        <div class="button-row">
          ${helpButton("song")}
          <button type="button" data-action="set-song-submode" data-mode="arrangement" aria-pressed="${subMode === "arrangement"}">Arrangement</button>
          <button type="button" data-action="set-song-submode" data-mode="multitrack" aria-pressed="${subMode === "multitrack"}">Multitrack</button>
          <button type="button" data-action="set-song-submode" data-mode="adaptive" aria-pressed="${subMode === "adaptive"}">Adaptive</button>
          <button type="button" data-action="add-song-track">Add Track</button>
          <button type="button" data-action="add-song-clip">Add Clip</button>
          ${rangeControl("Bars", "song", "bars", state.song.bars, 4, 64, 1, "song")}
        </div>
      </div>
      <div class="panel-body">
        ${subMode === "waveform" ? renderWaveformStudio() : subMode === "multitrack" ? renderMultitrackMode() : subMode === "adaptive" ? renderAdaptiveArrangementPanel() : `
          <div class="arranger-grid" style="--bars:${state.song.bars}">
            <div class="arranger-header"><span></span>${bars.map((bar) => `<strong>${bar}</strong>`).join("")}</div>
            ${state.song.tracks.map((track) => renderSongTrack(track)).join("")}
          </div>
          ${renderArmedRecordingPanel()}
          ${renderBouncePanel()}
        `}
      </div>
    </section>
    ${renderSongEditorContextMenu()}
  `;
}

function renderSongTrack(track) {
  const clips = track.clips.map((clip, index) => {
    const start = Math.max(2, clip.bar + 1);
    return `<button type="button" class="song-clip" data-action="select-song-clip" data-track="${track.id}" data-index="${index}" style="--clip-color:${clip.color}; grid-column:${start} / span ${clip.length};">${escapeHtml(clip.type)} ${escapeHtml(String(clip.ref))}</button>`;
  }).join("");
  return `<div class="arranger-row"><strong>${escapeHtml(track.name)}</strong>${clips}</div>`;
}

function renderWaveformStudio() {
  return `
    <section class="waveform-studio-screen" aria-label="Waveform Studio">
      <div class="section-head">
        <div>
          <h3>Waveform Studio</h3>
          <p class="micro">Browser-first region editing, clip repair, fades, normalization, export, and bounce tools for local audio you own.</p>
        </div>
        ${helpButton("waveform-studio")}
      </div>
      ${renderWaveformPlaybackControls()}
      ${renderWaveformEditorToolbar()}
      ${renderWaveformWorkspace()}
      <div class="waveform-lab-grid">
        ${renderWaveformRegionList()}
        ${renderAudioFileInfoPanel()}
        ${renderQuickEffectsMenu()}
        ${renderCrossfadeEditor()}
        ${renderBouncePanel()}
      </div>
      ${renderWaveformStatusBar()}
    </section>
  `;
}

function renderWaveformPlaybackControls() {
  const buffer = getWaveformStudioBuffer();
  const selection = normalizeWaveformSelection();
  const isPlaying = Boolean(state.waveformStudio.previewPlaying);
  const loop = Boolean(state.waveformStudio.previewLoop);
  return `
    <div class="waveform-playback-controls" aria-label="Waveform playback controls">
      <button type="button" class="waveform-play-button" data-action="play-waveform-selection" aria-pressed="${isPlaying && !loop}">Play Selection</button>
      <button type="button" data-action="play-waveform-from-cursor">Play From Cursor</button>
      <button type="button" data-action="loop-waveform-preview" aria-pressed="${loop}">${loop ? "Looping" : "Loop Selection"}</button>
      <button type="button" class="danger" data-action="stop-waveform-preview">Stop</button>
      <span class="waveform-playback-readout">
        ${formatTime(selection.startTime)} - ${formatTime(selection.endTime)}
        <small>${buffer ? `${formatTime(buffer.duration)} source` : "No source loaded"}</small>
      </span>
    </div>
  `;
}

function renderWaveformEditorToolbar() {
  const tools = ["select", "move", "cut", "split", "fade", "crossfade", "marker", "loop"];
  const actions = [
    ["cut-waveform-selection", "Cut"],
    ["copy-waveform-selection", "Copy"],
    ["paste-waveform-selection", "Paste"],
    ["delete-waveform-selection", "Delete"],
    ["trim-waveform-selection", "Trim"],
    ["crop-waveform-selection", "Crop"],
    ["split-waveform-at-playhead", "Split"],
    ["split-waveform-at-transients", "Transients"],
    ["silence-waveform-selection", "Silence"],
    ["insert-silence", "Insert Silence"],
    ["fade-waveform-selection", "Fade"],
    ["reverse-waveform-selection", "Reverse"],
    ["normalize-waveform-selection", "Normalize"],
    ["loop-waveform-selection", "Loop"],
    ["export-waveform-selection", "Export Selection"],
    ["add-waveform-marker", "Marker"],
    ["add-waveform-region", "Region"]
  ];
  return `
    <div class="waveform-editor-toolbar" role="toolbar" aria-label="Waveform editing tools">
      <label class="field compact">
        <span>Source</span>
        <select data-action="set-waveform-source" aria-label="Waveform source">
          ${["selected-stem", "sampler", "recorder", "deck-a", "deck-b", "first-loaded-stem"].map((source) => `<option value="${source}" ${state.waveformStudio.source === source ? "selected" : ""}>${titleCase(source)}</option>`).join("")}
        </select>
      </label>
      ${tools.map((tool) => `<button type="button" data-action="set-waveform-tool" data-tool="${tool}" aria-pressed="${state.waveformStudio.tool === tool}">${titleCase(tool)}</button>`).join("")}
      ${actions.map(([action, label]) => `<button type="button" data-action="${action}">${label}</button>`).join("")}
      <button type="button" data-action="zoom-waveform-in">Zoom In</button>
      <button type="button" data-action="zoom-waveform-out">Zoom Out</button>
      <button type="button" data-action="fit-waveform-to-screen">Fit</button>
    </div>
  `;
}

function renderWaveformWorkspace() {
  const selection = normalizeWaveformSelection();
  return `
    <div class="waveform-workspace">
      <div class="waveform-ruler" aria-hidden="true">
        ${Array.from({ length: 9 }, (_, index) => `<span>${formatTime((state.waveformStudio.viewport.startTime || 0) + index * 2)}</span>`).join("")}
      </div>
      <canvas class="waveform-main-canvas" data-waveform="studio-main" height="260" aria-label="Editable waveform canvas"></canvas>
      ${renderWaveformMiniMap()}
      <div class="waveform-selection" aria-label="Selection time">Selection ${formatTime(selection.startTime)} to ${formatTime(selection.endTime)}</div>
    </div>
  `;
}

function renderWaveformMiniMap() {
  return `<canvas class="waveform-minimap" data-waveform="studio-minimap" height="72" aria-label="Waveform mini map"></canvas>`;
}

function renderWaveformRegionList() {
  return `
    <article class="waveform-region-list">
      <div class="section-head"><div><h3>Regions + Markers</h3><p class="micro">Selection, loop, export, marker, slice, verse, chorus, and drop labels feed prompts and Beat DNA.</p></div>${helpButton("waveform-studio")}</div>
      ${(state.waveformStudio.regions.length ? state.waveformStudio.regions : [createWaveformRegion(0, 4, "Starter Region")]).map((region) => `
        <button type="button" class="waveform-region-chip" data-action="select-waveform-region" data-id="${region.id}" style="--region-color:${region.color}">
          <strong>${escapeHtml(region.label)}</strong>
          <span>${escapeHtml(region.type)} - ${formatTime(region.startTime)} to ${formatTime(region.endTime)}</span>
        </button>
      `).join("")}
      <div class="button-row">
        <button type="button" data-action="add-waveform-region">Add Region</button>
        <button type="button" data-action="add-waveform-marker">Add Marker</button>
      </div>
    </article>
  `;
}

function renderWaveformContextMenu() {
  return renderSongEditorContextMenu();
}

function renderWaveformStatusBar() {
  const buffer = getWaveformStudioBuffer();
  const selection = normalizeWaveformSelection();
  const peak = buffer ? calculateSamplePeak(buffer) : 0;
  const rms = buffer ? calculateRms(buffer) : 0;
  return `
    <footer class="waveform-status-bar">
      <span>Tool: ${escapeHtml(titleCase(state.waveformStudio.tool))}</span>
      <span>Cursor: ${formatTime(state.waveformStudio.cursorTime || 0)}</span>
      <span>Length: ${formatTime(selection.endTime - selection.startTime)}</span>
      <span>Peak: ${peak.toFixed(2)}</span>
      <span>RMS: ${rms.toFixed(2)}</span>
      <span>${escapeHtml(state.waveformStudio.status || "")}</span>
    </footer>
  `;
}

function renderCrossfadeEditor() {
  return `
    <article class="crossfade-editor">
      <div class="section-head"><div><h3>Crossfade Editor</h3><p class="micro">Overlap clips on the same lane, then apply a safe equal-power fade.</p></div>${helpButton("crossfades")}</div>
      <canvas class="crossfade-curve" data-waveform="crossfade" height="96" aria-label="Crossfade curve"></canvas>
      <label class="field compact">
        <span>Shape</span>
        <select data-action="set-crossfade-shape" aria-label="Crossfade shape">
          ${["linear", "equal-power", "slow fade", "fast fade", "s-curve"].map((shape) => `<option value="${shape}" ${state.settings.waveformStudio.defaultCrossfadeShape === shape ? "selected" : ""}>${titleCase(shape)}</option>`).join("")}
        </select>
      </label>
      <div class="button-row">
        <button type="button" data-action="auto-crossfade-overlaps">Auto Crossfade</button>
        <button type="button" data-action="create-crossfade">Create Fade</button>
      </div>
    </article>
  `;
}

function renderBouncePanel() {
  return `
    <article class="bounce-panel">
      <div class="section-head"><div><h3>Bounce + Export</h3><p class="micro">Render full mix, selected tracks, clips, region, stems, or master-ready WAV locally.</p></div>${helpButton("multitrack-editing")}</div>
      <div class="button-row">
        <button type="button" data-action="bounce-project">Bounce Full Mix</button>
        <button type="button" data-action="bounce-track">Bounce Track</button>
        <button type="button" data-action="bounce-selection">Bounce Selection</button>
        <button type="button" data-action="bounce-project-to-master">Send Bounce to AI Master</button>
        <button type="button" data-action="bounce-stems">Export Stems</button>
      </div>
      <div class="bounce-progress" aria-label="Bounce progress"><span style="--progress:${state.waveformStudio.bounceProgress || 0}%"></span></div>
      <p class="micro">MP3, FLAC, and ZIP export require optional encoder modules. WAV and JSON are available now.</p>
    </article>
  `;
}

function renderMultitrackMode() {
  return `
    <section class="multitrack-browser-editor" aria-label="Multitrack browser editor">
      <div class="section-head"><div><h3>Multitrack Browser Editor</h3><p class="micro">Layer tracks, drag clips, crossfade overlaps, arm channels, and bounce your local project.</p></div>${helpButton("multitrack-editing")}</div>
      ${renderWaveformEditorToolbar()}
      ${renderTrackStack()}
      ${renderArmedRecordingPanel()}
      ${renderRecordingTakeList()}
      ${renderBouncePanel()}
    </section>
  `;
}

function renderTrackStack() {
  return `
    <div class="song-track-list">
      ${state.song.tracks.map((track) => `
        <article class="song-track-header ${state.waveformStudio.recording.armedTrackIds.includes(track.id) ? "armed" : ""}" data-track="${track.id}">
          <div>
            <strong>${escapeHtml(track.name)}</strong>
            <span class="micro">${track.clips.length} clips</span>
          </div>
          <div class="button-row">
            <button type="button" data-action="${state.waveformStudio.recording.armedTrackIds.includes(track.id) ? "disarm-record-track" : "arm-record-track"}" data-id="${track.id}">${state.waveformStudio.recording.armedTrackIds.includes(track.id) ? "Disarm" : "Arm"}</button>
            <button type="button" data-action="freeze-track" data-id="${track.id}">Freeze</button>
            <button type="button" data-action="bounce-track" data-id="${track.id}">Bounce</button>
          </div>
          <div class="track-stack-lane">
            ${track.clips.map((clip, index) => renderClipLayer(track, { ...clip, localIndex: index })).join("") || `<span class="empty">Drop audio or add clips here.</span>`}
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderClipLayer(track, clip) {
  const overlap = clip.length > 4 ? " clip-overlap-region" : "";
  return `
    <button type="button" class="clip-layer${overlap}" data-action="select-song-clip" data-track="${track.id}" data-index="${clip.localIndex || 0}" style="--clip-color:${clip.color || track.color}; --clip-start:${clip.bar || 0}; --clip-span:${clip.length || 4}">
      <span class="clip-waveform-fill"></span>
      <strong>${escapeHtml(clip.type || "audio")}</strong>
      <small>${escapeHtml(String(clip.ref || clip.name || "clip"))}</small>
      <i class="clip-fade-curve"></i>
      ${clip.locked ? `<em class="clip-locked-badge">Locked</em>` : ""}
      <span class="clip-crossfade-handle" aria-hidden="true"></span>
    </button>
  `;
}

function renderArmedRecordingPanel() {
  return `
    <article class="recording-arm-panel">
      <div class="section-head"><div><h3>Armed Track Recording</h3><p class="micro">Arm one or more lanes, choose an input, monitor safely, then record takes directly into the timeline.</p></div>${helpButton("armed-recording")}</div>
      <div class="button-row">
        <button type="button" data-action="start-armed-recording" aria-pressed="${state.waveformStudio.recording.active}">${state.waveformStudio.recording.active ? "Recording" : "Record Armed"}</button>
        <button type="button" data-action="pause-armed-recording">Pause</button>
        <button type="button" data-action="stop-armed-recording">Stop</button>
        <button type="button" data-action="monitor-recording-input" aria-pressed="${state.waveformStudio.recording.monitoring}">Monitor ${state.waveformStudio.recording.monitoring ? "On" : "Off"}</button>
      </div>
      <div class="record-meter"><span style="--meter:${state.recording ? 72 : 18}%"></span></div>
      <p class="micro">Browser mic permission is required. Use headphones while monitoring to avoid feedback.</p>
    </article>
  `;
}

function renderRecordingTakeList() {
  return `
    <article class="waveform-region-list">
      <h3>Recording Takes</h3>
      ${(state.waveformStudio.recording.takes.length ? state.waveformStudio.recording.takes : [{ id: "take-placeholder", trackId: "", label: "No takes yet", createdAt: new Date().toISOString() }]).map((take) => `
        <div class="waveform-region-chip"><strong>${escapeHtml(take.label || "Take")}</strong><span>${escapeHtml(take.trackId || "Arm a track to record")}</span></div>
      `).join("")}
      <div class="button-row">
        <button type="button" data-action="comp-recording-takes">Comp Takes</button>
      </div>
    </article>
  `;
}

function renderSongEditorContextMenu() {
  const menu = state.waveformStudio.contextMenu;
  if (!menu?.open) return "";
  const actions = ["cut", "copy", "paste", "delete", "split", "trim", "fade in", "fade out", "crossfade", "reverse", "normalize", "marker", "bounce clip", "send to sampler", "send to ai master"];
  return `
    <div class="waveform-context-menu open" style="left:${menu.x}px; top:${menu.y}px" role="menu">
      ${actions.map((action) => `<button type="button" data-action="run-context-action" data-context-action="${action}" role="menuitem">${titleCase(action)}</button>`).join("")}
      <button type="button" data-action="close-song-context-menu">Close</button>
    </div>
  `;
}

function renderQuickEffectsMenu() {
  const effects = ["amplify", "normalize", "compressor", "limiter", "eq", "high-pass", "low-pass", "fade-in", "fade-out", "reverse", "reverb", "delay", "distortion", "bitcrusher", "speed-change", "noise-gate", "trim-silence", "silence", "stereo-widen", "mono", "invert-phase", "vocal-remove-fallback", "ai-master-selection"];
  return `
    <article class="quick-effects-menu">
      <h3>Quick Effects</h3>
      <p class="micro">Preview effects on a temporary buffer, then commit to a clip or effect rack.</p>
      <div class="button-row">${effects.map((effect) => `<button type="button" data-action="apply-quick-effect" data-effect="${effect}">${titleCase(effect)}</button>`).join("")}</div>
    </article>
  `;
}

function renderEffectPreviewModal() {
  if (!state.waveformStudio.quickEffect) return "";
  return `
    <div class="help-drawer open" role="dialog" aria-label="Effect preview">
      <h3>${escapeHtml(titleCase(state.waveformStudio.quickEffect.id))}</h3>
      <canvas data-waveform="effect-preview" height="120"></canvas>
      <div class="button-row">
        <button type="button" data-action="commit-effect-preview">Commit</button>
        <button type="button" data-action="cancel-effect-preview">Cancel</button>
      </div>
    </div>
  `;
}

function renderAudioFileInfoPanel() {
  const info = state.waveformStudio.fileInfo || analyzeAudioFileMetadata(null, getWaveformStudioBuffer());
  return `
    <article class="metadata-panel">
      <h3>Audio File Info</h3>
      <div class="lottery-analysis-grid">
        ${[
          ["Source", info.fileName || titleCase(state.waveformStudio.source)],
          ["Duration", formatTime(info.duration || 0)],
          ["Sample rate", `${info.sampleRate || "--"} Hz`],
          ["Channels", String(info.channelCount || "--")],
          ["Peak", info.peak ? info.peak.toFixed(2) : "--"],
          ["RMS", info.rms ? info.rms.toFixed(2) : "--"],
          ["BPM", info.estimatedBpm || state.bpm],
          ["Key", info.estimatedKey || "Key detection planned"]
        ].map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`).join("")}
      </div>
      <div class="button-row"><button type="button" data-action="export-metadata-json">Export Metadata JSON</button></div>
    </article>
  `;
}

function renderOpenMusicToolLab() {
  return `
    <section class="panel open-tool-lab-screen" aria-label="Open Music Tool Lab">
      <div class="panel-header">
        <div>
          <h2>Open Music Tool Lab</h2>
          <p class="micro">A browser-safe compatibility and roadmap lab inspired by open music production workflows. No third-party code, samples, plugins, or branding is bundled.</p>
        </div>
        <div class="button-row">
          ${helpButton("open-music-tool-lab")}
          <button type="button" data-action="export-compatibility-report">Export Compatibility Report</button>
        </div>
      </div>
      <div class="panel-body">
        ${renderOpenToolCards()}
        ${renderCompatibilityStatus()}
        ${renderPluginStandardRoadmap()}
        ${renderSampleSourceGuide()}
        ${renderOpenSynthGuide()}
      </div>
    </section>
  `;
}

function renderOpenToolCards() {
  const cards = [
    ["LMMS-style workflow", "Song editor, beat editor, piano roll, and FX mixer inspiration for browser-native composition."],
    ["Ardour-style workflow", "Recording, routing, multitrack mixing, takes, and session management inspiration."],
    ["Surge XT / Vital / Dexed ideas", "Open synth and plugin inspiration for future browser-safe instruments."],
    ["VCV / Cardinal modular", "Modular patching roadmap using Web Audio nodes and local patch metadata."],
    ["LV2 / CLAP / LADSPA / VST", "Compatibility roadmap requiring desktop bridge or native host."],
    ["CC0 samples", "Import user-provided CC0, public-domain, or properly licensed samples only."],
    ["Dynamic music", "Adaptive arrangement scenes and transitions for games, video, and streams."]
  ];
  return `<div class="plugin-roadmap-grid">${cards.map(([title, copy]) => `<article class="open-tool-card"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(copy)}</p></article>`).join("")}</div>`;
}

function renderPluginStandardRoadmap() {
  return `
    <article class="sample-standards-panel">
      <h3>Plugin Standard Roadmap</h3>
      <div class="plugin-roadmap-grid">
        ${["LV2", "CLAP", "LADSPA", "VST", "SoundFont2", "Web Audio"].map((item) => `<div class="open-tool-card"><strong>${item}</strong><span>${item === "Web Audio" ? "Works now with built-in instruments/effects" : "Roadmap: local parser, metadata import, or desktop bridge required"}</span></div>`).join("")}
      </div>
      <p class="sample-license-note">Native desktop plugin formats require a native host or desktop bridge. The browser version uses built-in Web Audio instruments and effects now.</p>
    </article>
  `;
}

function renderSampleSourceGuide() {
  return `
    <article class="sample-license-note">
      <h3>CC0 Sample Workflow</h3>
      <p>Use CC0, public-domain, self-recorded, or properly licensed samples. Do not redistribute commercial sample libraries through project exports.</p>
      <p>The app does not scrape sample sites and does not bundle copyrighted sounds.</p>
    </article>
  `;
}

function renderOpenSynthGuide() {
  return `
    <article class="open-tool-card">
      <h3>Open Synth Guide</h3>
      <p>Built-in Web Audio synths work now. Future modules can map oscillator, filter, envelope, modulation, wavetable, FM, and modular patch metadata into local project files.</p>
    </article>
  `;
}

function renderCompatibilityStatus() {
  const statuses = [
    ["Built-in Web Audio instruments", "Works now"],
    ["Built-in Web Audio effects", "Works now"],
    ["MIDI file import/export", "MVP available"],
    ["Web MIDI hardware", "Browser permission required"],
    ["SoundFont2", "Planned local parser"],
    ["LV2 / CLAP / LADSPA / VST", "Desktop bridge roadmap"],
    ["Native plugin hosting", "Not available in static browser app"],
    ["CC0 sample import", "User-provided files only"]
  ];
  return `<div class="compatibility-status">${statuses.map(([name, status]) => `<span class="compatibility-badge"><strong>${escapeHtml(name)}</strong>${escapeHtml(status)}</span>`).join("")}</div>`;
}

function renderAdaptiveArrangementPanel() {
  return `
    <section class="adaptive-arrangement-panel" aria-label="Adaptive Arrangement">
      <div class="section-head"><div><h3>Adaptive Arrangement</h3><p class="micro">Build scenes, loops, and transition rules that can feed Beat DNA, Suno arrangements, and video storyboards.</p></div>${helpButton("adaptive-arrangement")}</div>
      <div class="button-row">
        <button type="button" data-action="add-adaptive-scene">Add Scene</button>
        <button type="button" data-action="add-transition-rule">Add Transition</button>
        <button type="button" data-action="preview-adaptive-arrangement">Preview Paths</button>
        <button type="button" data-action="export-adaptive-json">Export Adaptive JSON</button>
      </div>
      <div class="plugin-roadmap-grid">
        ${state.adaptiveArrangement.scenes.map((scene) => `<article class="scene-section-card"><h3>${escapeHtml(scene.name)}</h3><p>Intensity ${Math.round(scene.intensity * 100)}%</p><p class="micro">${escapeHtml(scene.tags.join(", "))}</p></article>`).join("")}
      </div>
      <div class="plugin-roadmap-grid">
        ${state.adaptiveArrangement.transitions.map((rule, index) => `<article class="transition-rule-card"><strong>Rule ${index + 1}</strong><span>${escapeHtml(rule.condition)} - ${escapeHtml(rule.crossfadeBeats)} beat crossfade</span></article>`).join("")}
      </div>
    </section>
  `;
}

function getWaveformStudioBuffer() {
  if (state.waveformStudio.source === "sampler") return state.sampler.buffer;
  if (state.waveformStudio.source === "recorder") return state.recorder.buffer;
  if (state.waveformStudio.source === "deck-a") return state.decks.a.buffer;
  if (state.waveformStudio.source === "deck-b") return state.decks.b.buffer;
  if (state.waveformStudio.source === "first-loaded-stem") return state.stems.find((stem) => stem.buffer)?.buffer || null;
  return getStem(state.selectedStemId)?.buffer || state.stems.find((stem) => stem.buffer)?.buffer || state.sampler.buffer || state.recorder.buffer || null;
}

function setWaveformStudioBuffer(buffer) {
  if (!buffer) return;
  if (state.waveformStudio.source === "sampler") state.sampler.buffer = buffer;
  else if (state.waveformStudio.source === "recorder") state.recorder.buffer = buffer;
  else if (state.waveformStudio.source === "deck-a") state.decks.a.buffer = buffer;
  else if (state.waveformStudio.source === "deck-b") state.decks.b.buffer = buffer;
  else {
    const stem = getStem(state.selectedStemId) || state.stems.find((item) => item.buffer) || state.stems[0];
    stem.buffer = buffer;
    stem.duration = buffer.duration;
    stem.bufferId = makeId("buffer");
  }
  state.waveformStudio.fileInfo = analyzeAudioFileMetadata(null, buffer);
}

function normalizeWaveformSelection() {
  const buffer = getWaveformStudioBuffer();
  const duration = buffer?.duration || state.waveformStudio.viewport.endTime || 16;
  let startTime = clamp(Number(state.waveformStudio.selection?.startTime) || 0, 0, duration);
  let endTime = clamp(Number(state.waveformStudio.selection?.endTime) || Math.min(duration, startTime + 1), 0, duration);
  if (endTime <= startTime) endTime = Math.min(duration, startTime + 0.05);
  state.waveformStudio.selection = { startTime, endTime };
  return state.waveformStudio.selection;
}

function stopWaveformPreview(silent = false) {
  if (waveformPreviewSource) {
    try {
      waveformPreviewSource.onended = null;
      waveformPreviewSource.stop();
    } catch (error) {}
  }
  waveformPreviewSource = null;
  state.waveformStudio.previewPlaying = false;
  state.waveformStudio.previewLoop = false;
  if (!silent) {
    state.waveformStudio.status = "Waveform preview stopped.";
    queueRender();
  }
}

async function playWaveformSelection(loop = false) {
  const buffer = getWaveformStudioBuffer();
  if (!buffer) return toast("Load or select audio before previewing Waveform Studio.");
  const ctx = await ensureAudio();
  if (!ctx) return;
  const selection = normalizeWaveformSelection();
  const startTime = clamp(selection.startTime, 0, Math.max(0, buffer.duration - 0.05));
  const endTime = clamp(selection.endTime, startTime + 0.05, buffer.duration);
  const duration = Math.max(0.05, endTime - startTime);
  stopWaveformPreview(true);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = loop;
  if (loop) {
    source.loopStart = startTime;
    source.loopEnd = endTime;
  }
  source.connect(masterGain);
  waveformPreviewSource = source;
  state.waveformStudio.previewPlaying = true;
  state.waveformStudio.previewLoop = loop;
  state.waveformStudio.cursorTime = startTime;
  state.waveformStudio.status = `${loop ? "Looping" : "Playing"} selection ${formatTime(startTime)} to ${formatTime(endTime)}.`;
  source.onended = () => {
    if (waveformPreviewSource !== source) return;
    waveformPreviewSource = null;
    state.waveformStudio.previewPlaying = false;
    state.waveformStudio.previewLoop = false;
    state.waveformStudio.cursorTime = endTime;
    queueRender();
  };
  if (loop) source.start(0, startTime);
  else source.start(0, startTime, duration);
  queueRender();
}

async function playWaveformFromCursor() {
  const buffer = getWaveformStudioBuffer();
  if (!buffer) return toast("Load or select audio before previewing Waveform Studio.");
  const cursorTime = clamp(Number(state.waveformStudio.cursorTime) || state.waveformStudio.selection?.startTime || 0, 0, Math.max(0, buffer.duration - 0.05));
  state.waveformStudio.selection = { startTime: cursorTime, endTime: buffer.duration };
  await playWaveformSelection(false);
}

function drawMainWaveform(canvas, buffer, options = {}) {
  drawWaveform(canvas, buffer, { color: "#29f7ff", beatGrid: true, bpm: state.bpm, ...options });
  drawWaveformSelection(canvas, state.waveformStudio.selection);
  drawWaveformRegions(canvas, state.waveformStudio.regions);
}

function drawWaveformSelection(canvas, selection) {
  if (!canvas || !selection) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const duration = getWaveformStudioBuffer()?.duration || state.waveformStudio.viewport.endTime || 16;
  const startX = (selection.startTime / duration) * width;
  const endX = (selection.endTime / duration) * width;
  ctx.save();
  ctx.fillStyle = "rgba(255, 209, 102, 0.16)";
  ctx.strokeStyle = "rgba(255, 209, 102, 0.85)";
  ctx.lineWidth = 2 * window.devicePixelRatio;
  ctx.fillRect(startX, 0, Math.max(2, endX - startX), height);
  ctx.strokeRect(startX, 0, Math.max(2, endX - startX), height);
  ctx.restore();
}

function drawWaveformRegions(canvas, regions = []) {
  if (!canvas || !regions.length) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const duration = getWaveformStudioBuffer()?.duration || state.waveformStudio.viewport.endTime || 16;
  ctx.save();
  regions.forEach((region) => {
    const x = (region.startTime / duration) * width;
    const w = Math.max(2, ((region.endTime - region.startTime) / duration) * width);
    ctx.fillStyle = `${region.color || "#29f7ff"}24`;
    ctx.strokeStyle = region.color || "#29f7ff";
    ctx.fillRect(x, height * 0.08, w, height * 0.84);
    ctx.strokeRect(x, height * 0.08, w, height * 0.84);
  });
  ctx.restore();
}

function drawWaveformMiniMap(canvas, buffer, viewport = state.waveformStudio.viewport) {
  drawWaveform(canvas, buffer, { color: "#8b5cf6" });
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const duration = buffer?.duration || viewport.endTime || 16;
  const width = canvas.width;
  const height = canvas.height;
  const x = ((viewport.startTime || 0) / duration) * width;
  const w = Math.max(10, ((viewport.endTime - viewport.startTime) / duration) * width);
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.86)";
  ctx.lineWidth = 2 * window.devicePixelRatio;
  ctx.strokeRect(x, height * 0.12, w, height * 0.76);
  ctx.restore();
}

function drawCrossfadeCurve(canvas, fade = { shape: state.settings.waveformStudio.defaultCrossfadeShape }) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.width = Math.max(1, Math.floor(canvas.clientWidth * window.devicePixelRatio));
  const height = canvas.height = Math.max(1, Math.floor(canvas.clientHeight * window.devicePixelRatio));
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(3,7,15,.94)";
  ctx.fillRect(0, 0, width, height);
  drawGrid(ctx, width, height);
  const curve = (x) => {
    const t = x / width;
    if (fade.shape === "equal-power") return Math.cos(t * Math.PI / 2);
    if (fade.shape === "s-curve") return 1 - (t * t * (3 - 2 * t));
    if (fade.shape === "fast fade") return Math.pow(1 - t, 2);
    if (fade.shape === "slow fade") return Math.sqrt(1 - t);
    return 1 - t;
  };
  ctx.lineWidth = 3 * window.devicePixelRatio;
  ctx.strokeStyle = "#29f7ff";
  ctx.beginPath();
  for (let x = 0; x <= width; x += 4) {
    const y = height - curve(x) * height;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.strokeStyle = "#ff4fd8";
  ctx.beginPath();
  for (let x = 0; x <= width; x += 4) {
    const y = height - (1 - curve(x)) * height;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function snapTimeToZeroCrossing(buffer, time) {
  if (!buffer) return time;
  const data = buffer.getChannelData(0);
  const index = clamp(Math.round(time * buffer.sampleRate), 1, data.length - 2);
  let best = index;
  for (let offset = 0; offset < Math.min(2048, data.length); offset += 1) {
    const left = index - offset;
    const right = index + offset;
    if (left > 0 && Math.sign(data[left]) !== Math.sign(data[left - 1])) { best = left; break; }
    if (right < data.length - 1 && Math.sign(data[right]) !== Math.sign(data[right + 1])) { best = right; break; }
  }
  return best / buffer.sampleRate;
}

function snapTimeToBeat(time, bpm = state.bpm, snap = "1/16") {
  const beat = 60 / Math.max(1, bpm);
  const snapDiv = Number(String(snap).split("/")[1]) || 16;
  const grid = beat * (4 / snapDiv);
  return Math.round(time / grid) * grid;
}

function createWaveformRegion(startTime, endTime, label = "Region", patch = {}) {
  return {
    id: makeId("region"),
    clipId: patch.clipId || "",
    trackId: patch.trackId || state.song.tracks[0]?.id || "",
    label,
    startTime,
    endTime,
    color: patch.color || COLORS[state.waveformStudio?.regions?.length % COLORS.length || 0],
    type: patch.type || "selection",
    locked: false,
    notes: patch.notes || ""
  };
}

function updateWaveformRegion(regionId, patch) {
  const region = state.waveformStudio.regions.find((item) => item.id === regionId);
  if (!region || region.locked) return;
  Object.assign(region, patch);
  queueRender();
}

function deleteWaveformRegion(regionId) {
  state.waveformStudio.regions = state.waveformStudio.regions.filter((region) => region.id !== regionId || region.locked);
  queueRender();
}

function exportWaveformRegion(regionId) {
  const region = state.waveformStudio.regions.find((item) => item.id === regionId) || createWaveformRegion(state.waveformStudio.selection.startTime, state.waveformStudio.selection.endTime, "Selection Export");
  const buffer = getWaveformStudioBuffer();
  if (!buffer) return toast("Load audio before exporting a region.");
  exportBufferWav24Bit(truncateBuffer(buffer, region.startTime, region.endTime), `${safeFileName(region.label)}.wav`);
}

function cutWaveformSelection() {
  copyWaveformSelection();
  deleteWaveformSelection();
}

function copyWaveformSelection() {
  const buffer = getWaveformStudioBuffer();
  if (!buffer) return toast("Load audio before copying a waveform region.");
  const selection = normalizeWaveformSelection();
  state.waveformStudio.clipboard = truncateBuffer(buffer, selection.startTime, selection.endTime);
  state.waveformStudio.copiedRegion = { ...selection };
  toast("Waveform selection copied.");
}

function pasteWaveformSelection() {
  const buffer = getWaveformStudioBuffer();
  const clip = state.waveformStudio.clipboard;
  if (!buffer || !clip) return toast("Copy a selection before pasting.");
  setWaveformStudioBuffer(insertBufferAtTime(buffer, clip, state.waveformStudio.cursorTime || state.waveformStudio.selection.startTime));
  toast("Pasted waveform selection.");
  queueRender();
}

function deleteWaveformSelection() {
  const buffer = getWaveformStudioBuffer();
  if (!buffer) return toast("Load audio before deleting a selection.");
  setWaveformStudioBuffer(removeBufferRange(buffer, normalizeWaveformSelection()));
  toast("Deleted waveform selection.");
  queueRender();
}

function trimWaveformSelection() {
  const buffer = getWaveformStudioBuffer();
  if (!buffer) return toast("Load audio before trimming.");
  const selection = normalizeWaveformSelection();
  setWaveformStudioBuffer(truncateBuffer(buffer, selection.startTime, selection.endTime));
  state.waveformStudio.selection = { startTime: 0, endTime: getWaveformStudioBuffer()?.duration || 0 };
  toast("Trimmed to selection.");
  queueRender();
}

function cropWaveformSelection() {
  trimWaveformSelection();
}

function silenceWaveformSelection() {
  const buffer = getWaveformStudioBuffer();
  if (!buffer) return toast("Load audio before silencing.");
  const selection = normalizeWaveformSelection();
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    const start = Math.floor(selection.startTime * buffer.sampleRate);
    const end = Math.floor(selection.endTime * buffer.sampleRate);
    data.fill(0, start, end);
  }
  toast("Silenced waveform selection.");
  queueRender();
}

function insertSilence(seconds = 1) {
  const buffer = getWaveformStudioBuffer();
  if (!buffer || !audioCtx) return toast("Load audio before inserting silence.");
  const silence = audioCtx.createBuffer(buffer.numberOfChannels, Math.max(1, Math.round(seconds * buffer.sampleRate)), buffer.sampleRate);
  setWaveformStudioBuffer(insertBufferAtTime(buffer, silence, state.waveformStudio.cursorTime || state.waveformStudio.selection.startTime));
  toast("Inserted silence.");
  queueRender();
}

function fadeWaveformSelection(type = "in") {
  const buffer = getWaveformStudioBuffer();
  if (!buffer) return toast("Load audio before applying fades.");
  const selection = normalizeWaveformSelection();
  fadeBuffer(buffer, selection.startTime, selection.endTime, type);
  toast(`${type === "in" ? "Fade in" : "Fade out"} applied to selection.`);
  queueRender();
}

function reverseWaveformSelection() {
  const buffer = getWaveformStudioBuffer();
  if (!buffer) return toast("Load audio before reversing.");
  const selection = normalizeWaveformSelection();
  const region = truncateBuffer(buffer, selection.startTime, selection.endTime);
  reverseBuffer(region);
  setWaveformStudioBuffer(replaceBufferRange(buffer, region, selection));
  toast("Reversed waveform selection.");
  queueRender();
}

function normalizeWaveformSelectionAudio() {
  const buffer = getWaveformStudioBuffer();
  if (!buffer) return toast("Load audio before normalizing.");
  const selection = normalizeWaveformSelection();
  const region = truncateBuffer(buffer, selection.startTime, selection.endTime);
  normalizeBuffer(region);
  setWaveformStudioBuffer(replaceBufferRange(buffer, region, selection));
  toast("Normalized waveform selection.");
  queueRender();
}

function splitWaveformAtPlayhead() {
  const time = state.waveformStudio.cursorTime || state.waveformStudio.selection.startTime || 0;
  state.waveformStudio.regions.push(createWaveformRegion(Math.max(0, time - 0.01), time + 0.01, "Split Point", { type: "marker", color: COLORS[4] }));
  toast("Split marker added at playhead.");
  queueRender();
}

function splitWaveformAtTransients() {
  const buffer = getWaveformStudioBuffer();
  const duration = buffer?.duration || 16;
  state.waveformStudio.regions.push(...Array.from({ length: 4 }, (_, index) => createWaveformRegion((duration / 4) * index, (duration / 4) * index + 0.05, `Transient ${index + 1}`, { type: "marker", color: COLORS[index % COLORS.length] })));
  toast("Transient split markers added as an MVP placeholder.");
  queueRender();
}

function loopWaveformSelection() {
  const selection = normalizeWaveformSelection();
  state.waveformStudio.regions.push(createWaveformRegion(selection.startTime, selection.endTime, "Loop Selection", { type: "loop", color: COLORS[2] }));
  toast("Loop region created.");
  queueRender();
}

function addWaveformMarker() {
  const time = state.waveformStudio.cursorTime || state.waveformStudio.selection.startTime || 0;
  state.waveformStudio.markers.push({ id: makeId("marker"), time, label: `Marker ${state.waveformStudio.markers.length + 1}`, color: COLORS[state.waveformStudio.markers.length % COLORS.length] });
  state.waveformStudio.regions.push(createWaveformRegion(time, time + 0.01, `Marker ${state.waveformStudio.markers.length}`, { type: "marker", color: COLORS[3] }));
  toast("Waveform marker added.");
  queueRender();
}

function addWaveformRegion() {
  const selection = normalizeWaveformSelection();
  state.waveformStudio.regions.push(createWaveformRegion(selection.startTime, selection.endTime, `Region ${state.waveformStudio.regions.length + 1}`, { type: "export" }));
  toast("Waveform region added.");
  queueRender();
}

function insertBufferAtTime(buffer, insert, time) {
  if (!buffer || !insert || !audioCtx) return buffer;
  const sampleRate = buffer.sampleRate;
  const insertFrame = clamp(Math.round(time * sampleRate), 0, buffer.length);
  const next = audioCtx.createBuffer(buffer.numberOfChannels, buffer.length + insert.length, sampleRate);
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const out = next.getChannelData(channel);
    const original = buffer.getChannelData(channel);
    const add = insert.getChannelData(Math.min(channel, insert.numberOfChannels - 1));
    out.set(original.slice(0, insertFrame), 0);
    out.set(add, insertFrame);
    out.set(original.slice(insertFrame), insertFrame + insert.length);
  }
  return next;
}

function removeBufferRange(buffer, selection) {
  if (!buffer || !audioCtx) return buffer;
  const start = clamp(Math.round(selection.startTime * buffer.sampleRate), 0, buffer.length);
  const end = clamp(Math.round(selection.endTime * buffer.sampleRate), start, buffer.length);
  const next = audioCtx.createBuffer(buffer.numberOfChannels, Math.max(1, buffer.length - (end - start)), buffer.sampleRate);
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const out = next.getChannelData(channel);
    const data = buffer.getChannelData(channel);
    out.set(data.slice(0, start), 0);
    out.set(data.slice(end), start);
  }
  return next;
}

function replaceBufferRange(buffer, replacement, selection) {
  return insertBufferAtTime(removeBufferRange(buffer, selection), replacement, selection.startTime);
}

function moveClipToTrack(clipId, targetTrackId, startTime = 0) {
  state.song.tracks.forEach((track) => {
    const clip = track.clips.find((item) => item.id === clipId);
    if (clip) {
      track.clips = track.clips.filter((item) => item.id !== clipId);
      const target = state.song.tracks.find((item) => item.id === targetTrackId) || track;
      target.clips.push({ ...clip, bar: Math.max(0, Math.round(startTime / (60 / state.bpm / 4))) });
    }
  });
  queueRender();
}

function dragClipPreview(clipId, pointer) {
  state.waveformStudio.status = `Dragging ${clipId} at ${Math.round(pointer?.clientX || 0)}px`;
}

function createClipOverlapFade(clipAId, clipBId) {
  const fade = { id: makeId("fade"), trackId: state.song.tracks[0]?.id || "", clipAId, clipBId, startTime: 0, endTime: 1, shape: state.settings.waveformStudio.defaultCrossfadeShape, curveA: [], curveB: [] };
  state.waveformStudio.crossfades.push(fade);
  toast("Clip overlap crossfade created.");
  queueRender();
}

function crossfadeOverlappingClips(trackId = state.song.tracks[0]?.id) {
  const track = state.song.tracks.find((item) => item.id === trackId);
  if (!track || track.clips.length < 2) return toast("Add overlapping clips before auto crossfade.");
  for (let index = 0; index < track.clips.length - 1; index += 1) createClipOverlapFade(track.clips[index].id || `${trackId}-${index}`, track.clips[index + 1].id || `${trackId}-${index + 1}`);
}

function bounceMultitrackToBuffer() {
  return bounceProjectToBuffer();
}

function bounceProjectToBuffer() {
  const buffer = getWaveformStudioBuffer() || state.stems.find((stem) => stem.buffer)?.buffer || state.sampler.buffer;
  if (!buffer) return null;
  const clone = cloneAudioBuffer(buffer);
  state.waveformStudio.bounces.unshift({ id: makeId("bounce"), createdAt: new Date().toISOString(), type: "full-mix", duration: clone.duration });
  state.waveformStudio.bounceProgress = 100;
  return clone;
}

function bounceTrackToBuffer(trackId = state.song.tracks[0]?.id) {
  const buffer = bounceProjectToBuffer();
  if (buffer) state.waveformStudio.status = `Bounced track ${trackId}.`;
  return buffer;
}

function bounceSelectedClipsToBuffer() {
  return bounceProjectToBuffer();
}

function bounceSelectionToStem(selection = normalizeWaveformSelection()) {
  const buffer = getWaveformStudioBuffer();
  if (!buffer) return toast("Load audio before bouncing a selection.");
  const stem = state.stems.find((item) => !item.buffer) || state.stems[0];
  stem.buffer = truncateBuffer(buffer, selection.startTime, selection.endTime);
  stem.fileName = "waveform-selection-bounce.wav";
  stem.duration = stem.buffer.duration;
  toast(`Selection bounced to ${stem.name}.`);
  queueRender();
}

function bounceProjectToWav() {
  const buffer = bounceProjectToBuffer();
  if (!buffer) return toast("Load audio before bouncing the project.");
  exportBufferWav24Bit(buffer, "lottominded-ultra-bounce.wav");
}

function bounceProjectToStemFiles() {
  state.stems.filter((stem) => stem.buffer).forEach((stem) => exportBufferWav24Bit(stem.buffer, `${safeFileName(stem.name)}.wav`));
  toast("Exported available stem WAV files.");
}

function bounceProjectToMasterChain() {
  const buffer = bounceProjectToBuffer();
  if (!buffer) return toast("Load audio before sending a bounce to AI Master.");
  state.aiMaster.lastMasterBuffer = buffer;
  state.view = "ai master";
  toast("Bounce sent to AI Master.");
  render();
}

function renderBounceProgress() {
  return state.waveformStudio.bounceProgress || 0;
}

function cancelBounce() {
  state.waveformStudio.bounceProgress = 0;
  toast("Bounce canceled.");
  queueRender();
}

function cloneAudioBuffer(buffer) {
  if (!buffer || !audioCtx) return buffer;
  const next = audioCtx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    next.copyToChannel(buffer.getChannelData(channel).slice(), channel);
  }
  return next;
}

function armAudioTrack(trackId) {
  if (!state.waveformStudio.recording.armedTrackIds.includes(trackId)) state.waveformStudio.recording.armedTrackIds.push(trackId);
  queueRender();
}

function disarmAudioTrack(trackId) {
  state.waveformStudio.recording.armedTrackIds = state.waveformStudio.recording.armedTrackIds.filter((id) => id !== trackId);
  queueRender();
}

function startArmedTrackRecording() {
  if (!state.waveformStudio.recording.armedTrackIds.length) return toast("Arm at least one track before recording.");
  state.waveformStudio.recording.active = true;
  state.waveformStudio.recording.paused = false;
  toast("Armed track recording started. Browser mic permission may be required.");
  queueRender();
}

function stopArmedTrackRecording() {
  state.waveformStudio.recording.active = false;
  state.waveformStudio.recording.paused = false;
  state.waveformStudio.recording.armedTrackIds.forEach((trackId) => createRecordingTake(trackId, null));
  toast("Recording stopped and take lanes updated.");
  queueRender();
}

function pauseArmedTrackRecording() {
  state.waveformStudio.recording.paused = !state.waveformStudio.recording.paused;
  toast(state.waveformStudio.recording.paused ? "Armed recording paused." : "Armed recording resumed.");
  queueRender();
}

function createRecordingTake(trackId, audioBlob) {
  const take = { id: makeId("take"), trackId, label: `Take ${state.waveformStudio.recording.takes.length + 1}`, audioBlob, createdAt: new Date().toISOString() };
  state.waveformStudio.recording.takes.unshift(take);
  const track = state.song.tracks.find((item) => item.id === trackId);
  if (track) track.clips.push({ id: makeId("clip"), bar: Math.max(1, Math.ceil(state.song.playheadTime || 0)), length: 4, type: "audio", ref: take.label, color: COLORS[4] });
  return take;
}

function compRecordingTakes(trackId = state.waveformStudio.recording.armedTrackIds[0]) {
  toast(trackId ? `Comp lane prepared for ${trackId}.` : "Record takes before comping.");
}

function deleteRecordingTake(takeId) {
  state.waveformStudio.recording.takes = state.waveformStudio.recording.takes.filter((take) => take.id !== takeId);
  queueRender();
}

function showSongEditorContextMenu(x, y, context = {}) {
  state.waveformStudio.contextMenu = { open: true, x, y, context };
  queueRender();
}

function hideSongEditorContextMenu() {
  state.waveformStudio.contextMenu.open = false;
  queueRender();
}

function runSongContextAction(action = "") {
  const key = action.toLowerCase();
  if (key === "cut") cutWaveformSelection();
  else if (key === "copy") copyWaveformSelection();
  else if (key === "paste") pasteWaveformSelection();
  else if (key === "delete") deleteWaveformSelection();
  else if (key === "split") splitWaveformAtPlayhead();
  else if (key === "trim") trimWaveformSelection();
  else if (key === "fade in") fadeWaveformSelection("in");
  else if (key === "fade out") fadeWaveformSelection("out");
  else if (key === "crossfade") createClipOverlapFade("clip-a", "clip-b");
  else if (key === "reverse") reverseWaveformSelection();
  else if (key === "normalize") normalizeWaveformSelectionAudio();
  else if (key === "marker") addWaveformMarker();
  else if (key === "bounce clip") bounceSelectionToStem();
  else if (key === "send to sampler") {
    const buffer = getWaveformStudioBuffer();
    if (buffer) state.sampler.buffer = truncateBuffer(buffer, state.waveformStudio.selection.startTime, state.waveformStudio.selection.endTime);
    toast("Selection sent to Sampler.");
  } else if (key === "send to ai master") bounceProjectToMasterChain();
  else toast(`${titleCase(action)} is ready as a context-menu action hook.`);
  hideSongEditorContextMenu();
}

function handleSongEditorShortcut(event) {
  if (!state.settings.waveformStudio.keyboardShortcuts || !["song", "waveform studio"].includes(state.view)) return false;
  const key = event.key.toLowerCase();
  const mod = event.ctrlKey || event.metaKey;
  if (key === "s" && !mod) { splitWaveformAtPlayhead(); return true; }
  if ((key === "delete" || key === "backspace")) { deleteWaveformSelection(); return true; }
  if (mod && key === "c") { copyWaveformSelection(); return true; }
  if (mod && key === "x") { cutWaveformSelection(); return true; }
  if (mod && key === "v") { pasteWaveformSelection(); return true; }
  if (mod && key === "d") { pasteWaveformSelection(); return true; }
  if (key === "+") { zoomWaveform(1); return true; }
  if (key === "-") { zoomWaveform(-1); return true; }
  if (key === "m") { addWaveformMarker(); return true; }
  if (key === "l") { loopWaveformSelection(); return true; }
  if (key === "n") { normalizeWaveformSelectionAudio(); return true; }
  if (key === "t") { trimWaveformSelection(); return true; }
  return false;
}

function registerSongEditorShortcuts() {
  return true;
}

function applyQuickEffectToSelection(effectId, settings = {}) {
  const buffer = getWaveformStudioBuffer();
  if (!buffer) return toast("Load audio before applying quick effects.");
  const selection = normalizeWaveformSelection();
  const region = truncateBuffer(buffer, selection.startTime, selection.endTime);
  if (effectId === "normalize") normalizeBuffer(region);
  if (effectId === "reverse") reverseBuffer(region);
  if (effectId === "fade-in") fadeBuffer(region, 0, region.duration, "in");
  if (effectId === "fade-out") fadeBuffer(region, 0, region.duration, "out");
  if (effectId === "silence") {
    for (let channel = 0; channel < region.numberOfChannels; channel += 1) region.getChannelData(channel).fill(0);
  }
  if (effectId === "amplify") applyGain(region, settings.gain || 1.25);
  state.waveformStudio.quickEffect = { id: effectId, buffer: region };
  previewQuickEffect(effectId, settings);
}

function previewQuickEffect(effectId) {
  if (state.waveformStudio.quickEffect?.buffer) previewBuffer(state.waveformStudio.quickEffect.buffer);
  toast(`Previewing ${titleCase(effectId)}.`);
}

function commitEffectPreview() {
  const effect = state.waveformStudio.quickEffect;
  if (!effect?.buffer) return;
  setWaveformStudioBuffer(replaceBufferRange(getWaveformStudioBuffer(), effect.buffer, normalizeWaveformSelection()));
  state.waveformStudio.quickEffect = null;
  toast("Effect preview committed.");
  queueRender();
}

function cancelEffectPreview() {
  state.waveformStudio.quickEffect = null;
  toast("Effect preview canceled.");
  queueRender();
}

function analyzeAudioFileMetadata(file, buffer) {
  return {
    fileName: file?.name || state.waveformStudio.source,
    duration: buffer?.duration || 0,
    sampleRate: buffer?.sampleRate || "",
    channelCount: buffer?.numberOfChannels || "",
    bitDepth: "decoded browser PCM",
    estimatedBpm: state.bpm,
    estimatedKey: "Key detection planned",
    peak: buffer ? calculateSamplePeak(buffer) : 0,
    rms: buffer ? calculateRms(buffer) : 0,
    lufs: buffer ? estimateLoudness(buffer) : 0,
    tags: [],
    notes: "Local decoded audio only."
  };
}

function renderMetadataEditor() {
  return renderAudioFileInfoPanel();
}

function exportMetadataJson() {
  exportJson("lottominded-ultra-audio-metadata.json", analyzeAudioFileMetadata(null, getWaveformStudioBuffer()));
}

function saveSongProjectToIndexedDb() {
  localStorage.setItem(STORAGE.dawProject, JSON.stringify({ song: state.song, waveformStudio: { ...state.waveformStudio, clipboard: null, quickEffect: null } }));
  toast("Song project snapshot saved locally.");
}

function loadSongProjectFromIndexedDb() {
  const raw = localStorage.getItem(STORAGE.dawProject);
  if (!raw) return toast("No local song project snapshot found.");
  const payload = JSON.parse(raw);
  state.song = { ...state.song, ...(payload.song || {}) };
  state.waveformStudio = { ...state.waveformStudio, ...(payload.waveformStudio || {}) };
  toast("Song project snapshot loaded.");
  render();
}

function saveAudioBufferToDb(buffer, metadata = {}) {
  const id = makeId("buffer");
  state.waveformStudio.bounces.unshift({ id, metadata, duration: buffer?.duration || 0, savedAt: new Date().toISOString() });
  return id;
}

function loadAudioBufferFromDb(bufferId) {
  return state.waveformStudio.bounces.find((item) => item.id === bufferId) || null;
}

function saveWaveformPeaks(bufferId, peaks) {
  state.waveformStudio.peakCache ||= {};
  state.waveformStudio.peakCache[bufferId] = peaks;
}

function loadWaveformPeaks(bufferId) {
  return state.waveformStudio.peakCache?.[bufferId] || null;
}

function createSceneSection(name = `Scene ${state.adaptiveArrangement.scenes.length + 1}`) {
  const scene = { id: makeId("scene"), name, clips: [], loopable: true, intensity: 0.5, tags: ["custom"] };
  state.adaptiveArrangement.scenes.push(scene);
  return scene;
}

function createTransitionRule() {
  const [from, to] = state.adaptiveArrangement.scenes;
  const rule = { fromSceneId: from?.id || "", toSceneId: to?.id || "", condition: "on next section", transitionClipId: "", crossfadeBeats: 2 };
  state.adaptiveArrangement.transitions.push(rule);
  return rule;
}

function previewAdaptiveArrangement() {
  toast(`Previewing ${state.adaptiveArrangement.scenes.length} adaptive scenes.`);
}

function exportAdaptiveArrangementJson() {
  exportJson("lottominded-ultra-adaptive-arrangement.json", state.adaptiveArrangement);
}

function safeFileName(value = "lottominded-ultra") {
  return String(value).replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "lottominded-ultra";
}

function zoomWaveform(direction) {
  const view = state.waveformStudio.viewport;
  const duration = getWaveformStudioBuffer()?.duration || 16;
  const currentSpan = Math.max(0.5, view.endTime - view.startTime);
  const nextSpan = clamp(currentSpan * (direction > 0 ? 0.65 : 1.35), 0.25, duration);
  const center = view.startTime + currentSpan / 2;
  view.startTime = clamp(center - nextSpan / 2, 0, Math.max(0, duration - nextSpan));
  view.endTime = clamp(view.startTime + nextSpan, nextSpan, duration);
  view.zoom = duration / nextSpan;
  drawAllCanvases();
}

function fitWaveformToScreen() {
  const duration = getWaveformStudioBuffer()?.duration || 16;
  state.waveformStudio.viewport = { startTime: 0, endTime: duration, zoom: 1 };
  drawAllCanvases();
}

function renderPatternEditor() {
  return `
    <section class="panel" aria-label="Pattern editor">
      <div class="panel-header">
        <div>
          <h2>Pattern Editor</h2>
          <p class="micro">Create beats and pattern blocks with the same 16-pad performance grid and 16/64-step engine.</p>
        </div>
        <div class="button-row">
          ${helpButton("patterns")}
          <button type="button" data-action="random-groove">Generate Beat</button>
          <button type="button" data-action="clear-pattern" class="danger">Clear Pattern</button>
          <button type="button" data-action="export-midi">Export MIDI</button>
        </div>
      </div>
      <div class="panel-body">
        ${renderSequencer()}
      </div>
    </section>
  `;
}

function renderPianoRoll() {
  const notes = [];
  for (let note = state.pianoRoll.highNote; note >= state.pianoRoll.lowNote; note -= 1) notes.push(note);
  return `
    <section class="panel" aria-label="Piano roll">
      <div class="panel-header">
        <div>
          <h2>Piano Roll</h2>
          <p class="micro">Edit melodies by touching the grid. Notes export to standard MIDI files.</p>
        </div>
        <div class="button-row">
          ${helpButton("piano")}
          <label class="file-button">
            Import MIDI
            <input type="file" accept=".mid,.midi,audio/midi" data-file="midi" aria-label="Import MIDI file" />
          </label>
          <button type="button" data-action="export-midi">Export MIDI</button>
          <button type="button" data-action="clear-piano-roll" class="danger">Clear Notes</button>
        </div>
      </div>
      <div class="panel-body">
        <div class="piano-roll" style="--steps:${state.pianoRoll.steps}; --note-rows:${notes.length}">
          ${notes.map((note) => renderPianoRow(note)).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderPianoRow(note) {
  const cells = [];
  for (let step = 0; step < state.pianoRoll.steps; step += 1) {
    const found = state.pianoRoll.notes.find((item) => item.note === note && item.step === step);
    cells.push(`<button type="button" class="piano-cell ${found ? "on" : ""}" data-action="toggle-piano-note" data-note="${note}" data-step="${step}" aria-label="Note ${midiNoteName(note)} step ${step + 1}" aria-pressed="${Boolean(found)}">${found ? "" : ""}</button>`);
  }
  return `<div class="piano-row"><span>${midiNoteName(note)}</span>${cells.join("")}</div>`;
}

function renderAutomation() {
  return `
    <section class="panel" aria-label="Automation editor">
      <div class="panel-header">
        <div>
          <h2>Automation</h2>
          <p class="micro">Draw track-based automation and computer-controlled modulation sources for mix and instrument parameters.</p>
        </div>
        <div class="button-row">
          ${helpButton("automation")}
          <button type="button" data-action="add-automation-lane">Add Lane</button>
          <button type="button" data-action="randomize-automation">Randomize</button>
        </div>
      </div>
      <div class="panel-body automation-grid">
        ${state.automation.lanes.map(renderAutomationLane).join("")}
      </div>
    </section>
  `;
}

function renderAutomationLane(lane) {
  return `
    <article class="automation-lane">
      <div><strong>${escapeHtml(lane.target)}</strong><p class="micro">${lane.points.length} control points</p></div>
      <canvas height="104" data-automation="${lane.id}" aria-label="${escapeAttr(lane.target)} automation curve"></canvas>
      <div class="button-row">
        <button type="button" data-action="add-automation-point" data-id="${lane.id}">Add Point</button>
        <button type="button" data-action="clear-automation-lane" data-id="${lane.id}" class="danger">Clear</button>
      </div>
    </article>
  `;
}

function renderPlugins() {
  return `
    <section class="panel" aria-label="Instrument and effect plugins">
      <div class="panel-header">
        <div>
          <h2>Plugins and Standards</h2>
          <p class="micro">Browser-native instruments/effects plus compatibility notes for desktop DAW standards.</p>
        </div>
        <div class="button-row">${helpButton("plugins")}</div>
      </div>
      <div class="panel-body files-grid">
        <div class="plugin-grid">
          ${state.plugins.map((plugin) => `
            <article class="plugin-card">
              <strong>${escapeHtml(plugin.name)}</strong>
              <span class="micro">${escapeHtml(plugin.type)}</span>
              <p>${escapeHtml(plugin.description)}</p>
              <button type="button" data-action="toggle-plugin" data-id="${plugin.id}" aria-pressed="${plugin.enabled}">${plugin.enabled ? "Enabled" : "Bypassed"}</button>
            </article>
          `).join("")}
        </div>
        <div class="panel">
          <div class="panel-body">
            <h3>Compatibility</h3>
            <p class="micro">Static browsers can import/export MIDI and decode user audio files. Native plugin binaries such as VST2, LADSPA, LV2, GUS patches, and many SoundFont2 workflows require a desktop host or future local bridge; this app exposes project hooks without loading protected/native code.</p>
            <div class="button-row">
              <label class="file-button">Import MIDI<input type="file" accept=".mid,.midi,audio/midi" data-file="midi" aria-label="Import MIDI file" /></label>
              <button type="button" data-action="export-midi">Export MIDI</button>
              <button type="button" data-action="soundfont-placeholder">SoundFont2 Hook</button>
              <button type="button" data-action="native-plugin-placeholder">VST/LADSPA/LV2 Hook</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderMixer() {
  return `
    <section class="panel" aria-label="Mixer">
      <div class="panel-header">
        <div>
          <h2>Mixer</h2>
          <p class="micro">Add as many browser mixer channels and effect slots as your session needs.</p>
        </div>
        <div class="button-row">
          ${helpButton("mixer")}
          <button type="button" data-action="play-all">Play All Synced</button>
          <button type="button" data-action="pause-all">Pause All</button>
          <button type="button" data-action="play-all">${state.transport.paused ? "Resume All" : "Resume/Start"}</button>
          <button type="button" data-action="restart-all">Synced Restart</button>
          <button type="button" data-action="stop-all">Stop All</button>
          <button type="button" data-action="add-mixer-channel">Add Mixer Channel</button>
          <button type="button" data-action="add-mixer-effect">Add Effect Slot</button>
        </div>
      </div>
      <div class="panel-body">
        <div class="mixer-strip-grid">
          ${state.mixerChannels.map(renderMixerStrip).join("")}
        </div>
      </div>
    </section>
    ${renderPlugins()}
  `;
}

function renderMixerStrip(channel) {
  ensureMixerChannelTone(channel);
  return `
    <article class="mixer-strip" style="--strip-color:${channel.color}">
      <strong>${escapeHtml(channel.name)}</strong>
      <div class="vu"><span style="--vu:${Math.round((channel.volume || 0) * 60)}%"></span></div>
      ${rangeControl("Volume", "mixer-channel", "volume", channel.volume, 0, 1.5, 0.01, channel.id)}
      ${rangeControl("Pan", "mixer-channel", "pan", channel.pan, -1, 1, 0.01, channel.id)}
      <div class="mixer-eq-grid" aria-label="${escapeAttr(channel.name)} three-band EQ">
        ${rangeControl("Low", "mixer-eq", "low", channel.eq.low, -18, 18, 1, channel.id)}
        ${rangeControl("Mid", "mixer-eq", "mid", channel.eq.mid, -18, 18, 1, channel.id)}
        ${rangeControl("High", "mixer-eq", "high", channel.eq.high, -18, 18, 1, channel.id)}
      </div>
      <div class="effect-slots">
        ${channel.effects.map((effect) => `<span>${escapeHtml(effect)}</span>`).join("")}
      </div>
    </article>
  `;
}

function renderStemMixer() {
  const loadedStems = state.stems.filter((channel) => channel.buffer).length;
  const runningStems = state.stems.filter((channel) => channel.playing).length;
  const longestStem = Math.max(0, ...state.stems.map((channel) => getBufferDuration(channel)));
  const timelineStatus = state.transport.loopAll ? "Loop All armed" : state.transport.paused ? "Paused" : state.playing ? "Running" : "Ready";
  return `
    <section class="panel stem-mixer-panel" aria-label="Stem mixer console">
      <div class="panel-header">
        <div>
          <h2>Stem Mixing Console</h2>
          <p class="micro">Eight channels with local file loading, synced start, pause, restart, loop all, timestamps, trim playback, EQ, sends, mute, solo, and export metadata.</p>
        </div>
        <div class="button-row">
          ${helpButton("stems")}
          <button type="button" data-action="export-stem-map">Export Stem Map</button>
        </div>
      </div>
      <div class="panel-body stem-mixer-body" data-floating-stem-mixer>
        <div class="stem-transport-strip" data-floating-stem-mixer-handle aria-label="Stem mixer synced transport">
          <div class="stem-transport-status">
            <strong>Synced Stem Transport</strong>
            <span>${loadedStems}/8 loaded - ${runningStems} playing - ${timelineStatus} - Session ${formatTime(longestStem)}</span>
            <small class="stem-drag-chip">Drag mixer</small>
          </div>
          <div class="stem-transport-actions">
            <button type="button" data-action="play-all" aria-pressed="${state.playing && !state.transport.paused}">Start All Same Time</button>
            <button type="button" data-action="pause-all" aria-pressed="${state.transport.paused}">Pause All</button>
            <button type="button" data-action="play-all">${state.transport.paused ? "Resume All" : "Resume"}</button>
            <button type="button" data-action="restart-all">Restart All</button>
            <button type="button" data-action="stop-all">Stop All</button>
            <button type="button" data-action="toggle-loop-all" aria-pressed="${state.transport.loopAll}">Loop All</button>
          </div>
        </div>
        <div class="stem-grid">
          ${state.stems.map(renderStemChannel).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderStemChannel(channel) {
  const isSelected = state.selectedStemId === channel.id;
  const duration = getBufferDuration(channel);
  const trimStart = channel.trimStart || 0;
  const trimEnd = getTrimEnd(channel) || duration;
  const relativePlayhead = channel.playing ? Math.max(0, currentStemTime(channel) - trimStart) : (channel.pausedAt || 0);
  const playhead = channel.buffer ? clamp(trimStart + relativePlayhead, trimStart, trimEnd || duration) : 0;
  const remaining = channel.buffer ? Math.max(0, trimEnd - playhead) : 0;
  const channelStatus = channel.playing ? "Playing" : channel.pausedAt ? "Paused" : channel.buffer ? "Ready" : "Empty";
  return `
    <article class="channel ${isSelected ? "selected" : ""}" data-channel-card="${channel.id}">
      <div class="channel-top">
        <div class="channel-title">
          <strong><span class="color-dot" style="color:${channel.color}; background:${channel.color}"></span> ${escapeHtml(channel.name)}</strong>
          <span>${channel.fileName ? escapeHtml(channel.fileName) : "No stem loaded"}</span>
        </div>
        <button type="button" data-action="select-stem" data-id="${channel.id}">Edit</button>
      </div>
      <label class="file-button">
        Load Audio
        <input type="file" accept="audio/*" data-file="stem" data-id="${channel.id}" aria-label="Load audio for ${escapeAttr(channel.name)}" />
      </label>
      <div class="wave-wrap">
        <canvas height="92" data-waveform="stem" data-id="${channel.id}" aria-label="${escapeAttr(channel.name)} waveform"></canvas>
        <canvas height="48" data-spectrum="stem" data-id="${channel.id}" aria-label="${escapeAttr(channel.name)} spectrum"></canvas>
        <div class="vu"><span style="--vu:${Math.round(channel.meter * 100)}%"></span></div>
      </div>
      <div class="stem-time-grid" aria-label="${escapeAttr(channel.name)} timestamps">
        <span class="stem-time-pill"><strong>Status</strong>${channelStatus}</span>
        <span class="stem-time-pill"><strong>Start</strong>${channel.buffer ? formatTime(trimStart) : "--:--"}</span>
        <span class="stem-time-pill"><strong>Now</strong>${channel.buffer ? formatTime(playhead) : "--:--"}</span>
        <span class="stem-time-pill"><strong>End</strong>${channel.buffer ? formatTime(trimEnd) : "--:--"}</span>
        <span class="stem-time-pill"><strong>Left</strong>${channel.buffer ? formatTime(remaining) : "--:--"}</span>
        <span class="stem-time-pill"><strong>Total</strong>${channel.buffer ? formatTime(duration) : "--:--"}</span>
      </div>
      <div class="button-row">
        <button type="button" data-action="start-channel" data-id="${channel.id}">Start</button>
        <button type="button" data-action="start-channel" data-id="${channel.id}">${channel.pausedAt ? "Resume" : "Cue"}</button>
        <button type="button" data-action="stop-channel" data-id="${channel.id}">Stop</button>
        <button type="button" data-action="restart-channel" data-id="${channel.id}">Restart</button>
        <button type="button" data-action="toggle-mute" data-id="${channel.id}" aria-pressed="${channel.muted}">Mute</button>
        <button type="button" data-action="toggle-solo" data-id="${channel.id}" aria-pressed="${channel.solo}">Solo</button>
        <button type="button" data-action="toggle-arm" data-id="${channel.id}" aria-pressed="${channel.armed}">Arm</button>
      </div>
      <div class="control-grid">
        ${rangeControl("Volume", "channel", "volume", channel.volume, 0, 1, 0.01, channel.id)}
        ${rangeControl("Pan", "channel", "pan", channel.pan, -1, 1, 0.01, channel.id)}
      </div>
      <div class="eq-grid">
        ${rangeControl("Low", "channel-eq", "low", channel.eq.low, -18, 18, 1, channel.id)}
        ${rangeControl("Mid", "channel-eq", "mid", channel.eq.mid, -18, 18, 1, channel.id)}
        ${rangeControl("High", "channel-eq", "high", channel.eq.high, -18, 18, 1, channel.id)}
      </div>
      <div class="knob-grid">
        ${rangeControl("Filter", "channel", "filter", channel.filter, -1, 1, 0.01, channel.id)}
        ${rangeControl("Delay A", "channel", "sendDelay", channel.sendDelay, 0, 1, 0.01, channel.id)}
        ${rangeControl("Reverb B", "channel", "sendReverb", channel.sendReverb, 0, 1, 0.01, channel.id)}
      </div>
      <div class="control-grid">
        ${rangeControl("Trim start", "channel", "trimStart", channel.trimStart, 0, getBufferDuration(channel), 0.01, channel.id)}
        ${rangeControl("Trim end", "channel", "trimEnd", channel.trimEnd || getBufferDuration(channel), 0, getBufferDuration(channel), 0.01, channel.id)}
      </div>
      <div class="button-row">
        <button type="button" data-action="toggle-loop" data-id="${channel.id}" aria-pressed="${channel.loop}">Loop</button>
        <button type="button" data-action="reverse-stem" data-id="${channel.id}" aria-pressed="${channel.reverse}">Reverse</button>
        <button type="button" data-action="truncate-stem" data-id="${channel.id}">Truncate</button>
        <button type="button" data-action="normalize-stem" data-id="${channel.id}">Normalize</button>
        <button type="button" data-action="export-stem-metadata" data-id="${channel.id}">Export Metadata</button>
        <button type="button" class="danger" data-action="clear-stem" data-id="${channel.id}">Clear</button>
      </div>
    </article>
  `;
}

function renderStemEditor() {
  const stem = getSelectedStem();
  const duration = getBufferDuration(stem);
  return `
    <section class="panel" aria-label="Selected stem editor">
      <div class="panel-header">
        <div>
          <h2>Stem Editor</h2>
          <p class="micro">${stem ? escapeHtml(stem.name) : "Select a stem"} ${stem && stem.fileName ? `- ${escapeHtml(stem.fileName)}` : ""}</p>
        </div>
        <div class="button-row">
          ${helpButton("editor")}
          <button type="button" data-action="preview-selected-trim">Preview Trim</button>
          <button type="button" data-action="slice-stem-to-pads">Slice To Pads</button>
          <button type="button" data-action="export-edited-wav">Export WAV</button>
        </div>
      </div>
      <div class="panel-body editor-grid">
        <div>
          <canvas class="large-wave" height="260" data-waveform="editor" data-id="${stem ? stem.id : ""}" aria-label="Large stem waveform"></canvas>
        </div>
        <div class="panel">
          <div class="panel-body">
            ${stem ? `
              ${rangeControl("Trim start", "channel", "trimStart", stem.trimStart, 0, duration, 0.01, stem.id)}
              ${rangeControl("Trim end", "channel", "trimEnd", stem.trimEnd || duration, 0, duration, 0.01, stem.id)}
              <div class="button-row">
                <button type="button" data-action="truncate-stem" data-id="${stem.id}">Truncate</button>
                <button type="button" data-action="normalize-stem" data-id="${stem.id}">Normalize</button>
                <button type="button" data-action="reverse-stem" data-id="${stem.id}">Reverse</button>
                <button type="button" data-action="fade-stem" data-id="${stem.id}" data-type="in">Fade In</button>
                <button type="button" data-action="fade-stem" data-id="${stem.id}" data-type="out">Fade Out</button>
                <button type="button" data-action="pitch-placeholder">Pitch Shift</button>
                <button type="button" data-action="stretch-placeholder">Time Stretch</button>
              </div>
            ` : `<div class="empty">Select a stem channel to edit its trim, fades, and waveform.</div>`}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderDecks() {
  return `
    <section class="panel" aria-label="DJ decks">
      <div class="panel-header">
        <div>
          <h2>Dual Local DJ Decks</h2>
          <p class="micro">Two original decks with local track loading, cue points, pitch, EQ, filter, meters, waveforms, and crossfader.</p>
        </div>
        <div class="button-row">
          ${helpButton("decks")}
          <button type="button" data-action="play-both-decks">Play Both Decks</button>
          <button type="button" data-action="pause-both-decks">Pause Both</button>
          <button type="button" data-action="stop-both-decks">Stop Both</button>
          <button type="button" data-action="record-mix">${state.recording ? "Stop Recording" : "Record Mix"}</button>
          <button type="button" data-action="automix-placeholder">Automix</button>
        </div>
      </div>
      <div class="panel-body deck-grid">
        ${renderDeck(state.decks.a)}
        ${renderDeckMixer()}
        ${renderDeck(state.decks.b)}
      </div>
    </section>
  `;
}

function renderDeck(deck) {
  return `
    <article class="deck" data-deck-card="${deck.id}">
      <div class="deck-top">
        <div class="deck-title">
          <strong>${deck.name}</strong>
          <span>${deck.fileName ? escapeHtml(deck.fileName) : "Load a local track"}</span>
        </div>
        <label class="file-button">
          Load Track
          <input type="file" accept="audio/*" data-file="deck" data-id="${deck.id}" aria-label="Load track into ${deck.name}" />
        </label>
      </div>
      <div class="deck-body">
        <div class="platter ${deck.playing ? "playing" : ""}" style="border-color:${deck.color}">
          <strong>${deck.id.toUpperCase()}</strong>
        </div>
        <div class="wave-wrap">
          <canvas height="142" data-waveform="deck" data-id="${deck.id}" aria-label="${deck.name} waveform"></canvas>
          <div class="vu"><span style="--vu:${Math.round(deck.meter * 100)}%"></span></div>
          <div class="button-row">
            <button type="button" data-action="toggle-deck" data-id="${deck.id}">${deck.playing ? "Pause" : "Play"}</button>
            <button type="button" data-action="stop-deck" data-id="${deck.id}">Stop</button>
            <button type="button" data-action="cue-deck" data-id="${deck.id}">Cue</button>
            <button type="button" data-action="set-cue" data-id="${deck.id}">Set Cue</button>
            <button type="button" data-action="sync-placeholder">Sync</button>
          </div>
        </div>
      </div>
      <div class="button-row">
        ${deck.hotCues.map((cue, index) => `<button type="button" data-action="hot-cue" data-id="${deck.id}" data-index="${index}">Hot ${index + 1}${cue !== null ? ` ${formatTime(cue)}` : ""}</button>`).join("")}
      </div>
      <div class="button-row">
        <button type="button" data-action="loop-in" data-id="${deck.id}">Loop In</button>
        <button type="button" data-action="loop-out" data-id="${deck.id}">Loop Out</button>
        <button type="button" data-action="toggle-deck-loop" data-id="${deck.id}" aria-pressed="${deck.loop}">Loop 4 Beats</button>
        <button type="button" data-action="pitch-bend" data-id="${deck.id}" data-dir="-1">Bend -</button>
        <button type="button" data-action="pitch-bend" data-id="${deck.id}" data-dir="1">Bend +</button>
      </div>
      <div class="control-grid">
        ${rangeControl("BPM", "deck", "bpm", deck.bpm, 40, 220, 1, deck.id)}
        ${rangeControl("Pitch", "deck", "pitch", deck.pitch, -12, 12, 0.1, deck.id)}
      </div>
      <div class="eq-grid">
        ${rangeControl("Low", "deck-eq", "low", deck.eq.low, -18, 18, 1, deck.id)}
        ${rangeControl("Mid", "deck-eq", "mid", deck.eq.mid, -18, 18, 1, deck.id)}
        ${rangeControl("High", "deck-eq", "high", deck.eq.high, -18, 18, 1, deck.id)}
      </div>
      <div class="control-grid">
        ${rangeControl("Deck gain", "deck", "gain", deck.gain, 0, 1.5, 0.01, deck.id)}
        ${rangeControl("Filter", "deck", "filter", deck.filter, -1, 1, 0.01, deck.id)}
      </div>
      <div class="button-row">
        <button type="button" data-action="deck-stem-lane" data-lane="Vocals">Vocals</button>
        <button type="button" data-action="deck-stem-lane" data-lane="Drums">Drums</button>
        <button type="button" data-action="deck-stem-lane" data-lane="Bass">Bass</button>
        <button type="button" data-action="deck-stem-lane" data-lane="Music">Music</button>
      </div>
    </article>
  `;
}

function renderDeckMixer() {
  return `
    <aside class="deck-mixer" aria-label="Deck mixer">
      <h3>Deck Mixer</h3>
      <div class="meter-stack">
        <div class="meter-column"><span style="--meter:${Math.round(state.decks.a.meter * 100)}%"></span></div>
        <div class="meter-column"><span style="--meter:${Math.round(state.decks.b.meter * 100)}%"></span></div>
      </div>
      ${rangeControl("Crossfader", "crossfader", "value", Number(localStorage.getItem("lss-crossfader")) || 0, -1, 1, 0.01, "mixer")}
      <button type="button" data-action="cue-mix-placeholder">Cue Mix</button>
      <button type="button" data-action="automix-placeholder">Automix Soon</button>
    </aside>
  `;
}

function renderPads() {
  return `
    <section class="panel" aria-label="Touch-active music pads">
      <div class="panel-header">
        <div>
          <h2>Performance Pads</h2>
          <p class="micro">Touch, pointer, and keyboard triggering with banks, note repeat, slicing, and sequencer recording.</p>
        </div>
        <div class="button-row">
          ${helpButton("pads")}
          <button type="button" data-action="pad-bank" data-bank="A">Bank A</button>
          <button type="button" data-action="pad-bank" data-bank="B">Bank B</button>
          <button type="button" data-action="pad-bank" data-bank="C">Bank C</button>
          <button type="button" data-action="pad-bank" data-bank="D">Bank D</button>
          <button type="button" data-action="load-factory-kit" data-index="0">Neon Trap 808</button>
          <label class="file-button">
            Import Kit Folder
            <input type="file" accept="audio/*" data-file="kit" multiple webkitdirectory aria-label="Import local drum kit folder" />
          </label>
        </div>
      </div>
      <div class="panel-body pad-layout">
        ${render16LevelPanel()}
        <div class="pad-grid" aria-label="16 performance pads">
          ${getActivePadMap().map(renderPadButton).join("")}
        </div>
        ${renderComputerKeyMappingPanel()}
      </div>
    </section>
    ${renderSequencer()}
  `;
}

function renderPadButton(pad, index) {
  const in16Level = is16LevelEnabled() && pad.mode16Level;
  const isSource = in16Level && index === state.pad16Level.sourcePadIndex;
  const referencePad = (state.pad16Level.mode === "tune" ? state.pad16Level.tune.referencePad : state.pad16Level.referencePad) - 1;
  const isReference = in16Level && index === referencePad;
  const classes = [
    "pad-button",
    pad.active ? "active" : "",
    in16Level ? "pad-16-level" : "",
    isSource ? "pad-16-level-source" : "",
    isReference ? "pad-16-level-reference" : "",
    pad.missed ? "pad-16-level-missed" : "",
    pad.mode === "ratchet" ? "pad-16-level-ratchet" : "",
    pad.mode === "slice" ? "pad-16-level-slice" : ""
  ].filter(Boolean).join(" ");
  return `
    <button
      type="button"
      class="${classes}"
      data-action="trigger-pad"
      data-index="${index}"
      aria-pressed="${pad.active}"
      data-velocity="${pad.velocity.toFixed(2)}"
      style="--pad-color:${pad.color}; --velocity:${pad.velocity}; --aftertouch:${pad.aftertouch}; --level-pct:${in16Level ? (index / 15).toFixed(3) : 0}"
    >
      <span class="pad-number">${index + 1} / ${escapeHtml(formatKeyCode(getPadKeyCode(index)))}</span>
      <span class="pad-label"><strong>${escapeHtml(pad.name)}</strong><span>${pad.sampleName || pad.mode}</span></span>
      ${in16Level && state.settings.pad16Level.showValueLabels ? `<span class="pad-16-value-label">${escapeHtml(pad.valueLabel || "")}</span>` : ""}
    </button>
  `;
}

function render16LevelPanel() {
  const config = state.pad16Level;
  const source = get16LevelSourcePad();
  const functionLabel = titleCase(config.mode);
  return `
    <section class="pad-16-panel" aria-label="16-Level Performance">
      <div class="pad-16-header section-head">
        <div>
          <h3>16-Level Performance</h3>
          <p>Select one pad, choose a function, and spread that sound across all 16 pads for velocity, tune, filter, slicing, ratchets, envelopes, and expressive performance.</p>
        </div>
        ${helpButton("16-level-pads")}
      </div>
      <div class="pad-16-control-strip">
        <button type="button" data-action="toggle-16-level" aria-pressed="${config.enabled}" class="${config.enabled ? "primary" : ""}">${config.enabled ? "16 Levels On" : "Enable 16-Level Mode"}</button>
        <label class="field compact">
          <span>Source Pad</span>
          <select data-action="set-16-level-source" aria-label="16-Level source pad">
            ${state.pads.map((pad, index) => `<option value="${index}" ${config.sourcePadIndex === index ? "selected" : ""}>${index + 1} - ${escapeHtml(pad.name)}</option>`).join("")}
          </select>
        </label>
        <label class="field compact">
          <span>Function</span>
          <select data-action="set-16-level-mode" aria-label="16-Level function">
            ${["velocity", "tune", "filter", "layer", "attack", "decay", "probability", "ratchet", "slice"].map((mode) => `<option value="${mode}" ${config.mode === mode ? "selected" : ""}>${titleCase(mode)}</option>`).join("")}
          </select>
        </label>
        <label class="toggle-line">
          <input type="checkbox" data-action="set-16-level-option" data-path="liveOverlay" ${config.liveOverlay ? "checked" : ""} />
          <span>Live Overlay</span>
        </label>
        <label class="field compact">
          <span>Commit Bank</span>
          <select data-action="set-16-level-option" data-path="commitTargetBank" aria-label="Commit target bank">
            ${["A", "B", "C", "D"].map((bank) => `<option value="${bank}" ${config.commitTargetBank === bank ? "selected" : ""}>Bank ${bank}</option>`).join("")}
          </select>
        </label>
        <button type="button" data-action="reset-16-level">Reset</button>
        <button type="button" data-action="commit-16-level-bank">Commit to Bank</button>
        <button type="button" data-action="toggle-16-level" class="danger">${config.enabled ? "Exit 16-Level" : "Exit"}</button>
      </div>
      <div class="pad-16-mode-tabs" role="tablist" aria-label="16-Level functions">
        ${["velocity", "tune", "filter", "layer", "attack", "decay", "probability", "ratchet", "slice"].map((mode) => `<button type="button" data-action="set-16-level-mode" data-mode="${mode}" class="${config.mode === mode ? "active" : ""}">${titleCase(mode)}</button>`).join("")}
      </div>
      <div class="pad-16-function-controls">
        ${render16LevelControls()}
      </div>
      <div class="pad-16-commit-warning">
        <strong>${escapeHtml(source.name)}</strong> is the source pad. ${functionLabel} values are temporary in Live Overlay. Commit to Bank only when you want to replace the target bank assignments.
      </div>
      ${render16LevelPadGrid()}
    </section>
  `;
}

function render16LevelControls() {
  const mode = state.pad16Level.mode;
  const cfg = state.pad16Level[mode];
  if (mode === "velocity") {
    return `
      ${pad16RangeControl("Min velocity", "velocity.min", cfg.min, 1, 127, 1)}
      ${pad16RangeControl("Max velocity", "velocity.max", cfg.max, 1, 127, 1)}
      ${pad16SelectControl("Curve", "velocity.curve", cfg.curve, ["linear", "exponential", "log"])}
    `;
  }
  if (mode === "tune") {
    return `
      ${pad16RangeControl("Min semitone", "tune.minSemitone", cfg.minSemitone, -24, 0, 1)}
      ${pad16RangeControl("Max semitone", "tune.maxSemitone", cfg.maxSemitone, 0, 24, 1)}
      ${pad16RangeControl("Reference pad", "tune.referencePad", cfg.referencePad, 1, 16, 1)}
      ${pad16ToggleControl("Scale lock", "tune.scaleLock", cfg.scaleLock)}
      ${pad16SelectControl("Root note", "tune.rootNote", cfg.rootNote, ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}
      ${pad16SelectControl("Scale", "tune.scale", cfg.scale, ["chromatic", "minor", "major", "pentatonic", "blues"])}
    `;
  }
  if (mode === "filter") {
    return `
      ${pad16SelectControl("Filter type", "filter.type", cfg.type, ["lowpass", "highpass", "bandpass"])}
      ${pad16RangeControl("Min cutoff", "filter.minCutoff", cfg.minCutoff, 40, 2000, 1, "Hz")}
      ${pad16RangeControl("Max cutoff", "filter.maxCutoff", cfg.maxCutoff, 2000, 18000, 10, "Hz")}
      ${pad16RangeControl("Min resonance", "filter.minResonance", cfg.minResonance, 0.1, 12, 0.1)}
      ${pad16RangeControl("Max resonance", "filter.maxResonance", cfg.maxResonance, 0.1, 16, 0.1)}
      ${pad16SelectControl("Map target", "filter.mapTarget", cfg.mapTarget, ["cutoff", "resonance", "cutoff + resonance"])}
    `;
  }
  if (mode === "layer") {
    return `
      ${pad16RangeControl("Layer A gain", "layer.layerA", cfg.layerA, 0, 1, 0.01)}
      ${pad16RangeControl("Layer B gain", "layer.layerB", cfg.layerB, 0, 1, 0.01)}
      ${pad16ToggleControl("Crossfade", "layer.crossfade", cfg.crossfade)}
      <div class="empty compact">Layer B can be loaded later; empty layer pads keep using the source sample safely.</div>
    `;
  }
  if (mode === "attack") {
    return `
      ${pad16RangeControl("Min attack", "attack.minMs", cfg.minMs, 0, 1000, 1, "ms")}
      ${pad16RangeControl("Max attack", "attack.maxMs", cfg.maxMs, 10, 3000, 1, "ms")}
      ${pad16SelectControl("Curve", "attack.curve", cfg.curve, ["linear", "exponential", "log"])}
    `;
  }
  if (mode === "decay") {
    return `
      ${pad16RangeControl("Min decay", "decay.minMs", cfg.minMs, 20, 1000, 1, "ms")}
      ${pad16RangeControl("Max decay", "decay.maxMs", cfg.maxMs, 100, 6000, 10, "ms")}
      ${pad16SelectControl("Curve", "decay.curve", cfg.curve, ["linear", "exponential", "log"])}
    `;
  }
  if (mode === "probability") {
    return `
      ${pad16RangeControl("Min probability", "probability.min", cfg.min, 0, 1, 0.01)}
      ${pad16RangeControl("Max probability", "probability.max", cfg.max, 0.05, 1, 0.01)}
      ${pad16RangeControl("Ghost below", "probability.ghostBelow", cfg.ghostBelow, 0, 1, 0.01)}
    `;
  }
  if (mode === "ratchet") {
    return `
      <label class="field compact">
        <span>Ratchet values</span>
        <input type="text" data-action="set-16-level-option" data-path="ratchet.values" value="${escapeHtml(cfg.values.join(", "))}" aria-label="Ratchet repeat values" />
      </label>
      ${pad16RangeControl("Gate", "ratchet.gate", cfg.gate, 0.05, 1, 0.01)}
      ${pad16RangeControl("Swing", "ratchet.swing", cfg.swing, 0, 0.75, 0.01)}
      ${pad16ToggleControl("Velocity decay", "ratchet.velocityDecay", cfg.velocityDecay !== false)}
    `;
  }
  return `
    ${pad16SelectControl("Slice mode", "slice.mode", cfg.mode, ["equal", "manual-placeholder", "transient-placeholder"])}
    ${pad16ToggleControl("One-shot slices", "slice.oneShot", cfg.oneShot)}
    ${pad16RangeControl("Transient sensitivity", "slice.transientSensitivity", cfg.transientSensitivity, 0, 1, 0.01)}
    ${pad16ToggleControl("Preserve pitch", "slice.preservePitch", cfg.preservePitch)}
    <button type="button" data-action="send-16-level-slices-to-bank">Send Slices to Bank</button>
    <div class="pad-16-wave-slices" aria-hidden="true">${Array.from({ length: 16 }, (_, index) => `<span class="pad-16-slice-marker" style="--slice:${index}"></span>`).join("")}</div>
  `;
}

function render16LevelPadGrid() {
  if (!state.pad16Level.generatedPads.length) generate16LevelPads();
  return `
    <div class="pad-16-grid" aria-label="16-Level value preview">
      ${state.pad16Level.generatedPads.map((pad, index) => `
        <button type="button" data-action="preview-16-level-pad" data-index="${index}" class="pad-16-level ${index === state.pad16Level.sourcePadIndex ? "pad-16-level-source" : ""}" style="--pad-color:${pad.color}; --level-pct:${(index / 15).toFixed(3)}">
          <strong>${index + 1}</strong>
          <span>${escapeHtml(pad.valueLabel || "")}</span>
        </button>
      `).join("")}
    </div>
  `;
}

function renderComputerKeyMappingPanel() {
  const learn = state.keyMappingLearn;
  return `
    <section class="key-map-panel" aria-label="Computer key mapping">
      <div class="section-head">
        <div>
          <h3>Computer Key Mapping</h3>
          <p class="micro">Map each drum pad or piano key to any computer keyboard or number-pad key. Mappings stay local on this device.</p>
        </div>
        <div class="button-row">
          ${helpButton("key-mapping")}
          <button type="button" data-action="reset-key-mappings">Reset Defaults</button>
        </div>
      </div>
      ${learn ? `<div class="key-map-capture" role="status">Listening for ${escapeHtml(getKeyboardMappingLabel(learn.type, learn.id))}. Press a key now, or Escape to cancel.</div>` : ""}
      <div class="key-map-grid">
        <article class="key-map-card">
          <h4>Drum Pads</h4>
          <div class="key-map-list">
            ${state.pads.map((pad, index) => renderKeyMapRow("pad", index, `Pad ${index + 1}`, pad.name, getPadKeyCode(index))).join("")}
          </div>
        </article>
        <article class="key-map-card">
          <h4>Piano Keys</h4>
          <div class="key-map-list">
            ${SYNTH_NOTES.map((note, midi) => renderKeyMapRow("piano", midi, note, `Octave ${state.synth.octave}`, getPianoKeyCode(midi))).join("")}
          </div>
        </article>
      </div>
    </section>
  `;
}

function renderKeyMapRow(type, id, title, detail, code) {
  const isLearning = state.keyMappingLearn?.type === type && Number(state.keyMappingLearn.id) === Number(id);
  return `
    <div class="key-map-row ${isLearning ? "is-learning" : ""}">
      <div>
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(detail || "")}</span>
      </div>
      <kbd>${escapeHtml(formatKeyCode(code))}</kbd>
      <div class="key-map-actions">
        <button type="button" data-action="learn-key-map" data-map-type="${type}" data-map-id="${id}">${isLearning ? "Listening" : "Learn"}</button>
        <button type="button" data-action="clear-key-map" data-map-type="${type}" data-map-id="${id}">Clear</button>
      </div>
    </div>
  `;
}

function pad16RangeControl(label, path, value, min, max, step, unit = "") {
  return `
    <label class="field compact">
      <span>${label}</span>
      <input type="range" data-action="set-16-level-option" data-path="${path}" min="${min}" max="${max}" step="${step}" value="${Number(value)}" aria-label="${label}" />
      <output>${formatPad16ControlValue(value, unit)}</output>
    </label>
  `;
}

function pad16SelectControl(label, path, value, options) {
  return `
    <label class="field compact">
      <span>${label}</span>
      <select data-action="set-16-level-option" data-path="${path}" aria-label="${label}">
        ${options.map((option) => `<option value="${option}" ${String(value) === String(option) ? "selected" : ""}>${titleCase(option)}</option>`).join("")}
      </select>
    </label>
  `;
}

function pad16ToggleControl(label, path, checked) {
  return `
    <label class="toggle-line">
      <input type="checkbox" data-action="set-16-level-option" data-path="${path}" ${checked ? "checked" : ""} />
      <span>${label}</span>
    </label>
  `;
}

function formatPad16ControlValue(value, unit = "") {
  const number = Number(value);
  if (!Number.isFinite(number)) return `${value}${unit}`;
  const rounded = Math.abs(number) >= 100 ? Math.round(number) : Math.round(number * 100) / 100;
  return `${rounded}${unit}`;
}

function ensurePadBanks() {
  if (!state.padBanks) state.padBanks = {};
  const activeBank = state.padBank || "A";
  if (!state.padBanks[activeBank]) {
    state.padBanks[activeBank] = state.pads.map((pad, index) => clonePadForBank(pad, index, activeBank));
  }
  ["A", "B", "C", "D"].forEach((bank) => {
    if (!state.padBanks[bank]) {
      state.padBanks[bank] = createPads().map((pad, index) => clonePadForBank({ ...pad, bank }, index, bank));
    }
  });
}

function clonePadForBank(pad, index = 0, bank = "A") {
  return {
    ...pad,
    id: `pad-${bank}-${index}`,
    bank,
    active: false,
    velocity: 0,
    aftertouch: 0,
    source: null,
    gainNode: null,
    filterNode: null,
    layers: Array.isArray(pad.layers) ? pad.layers.map((layer) => ({ ...layer })) : [],
    envelope: { attack: 0, decay: 0.4, sustain: 0.8, release: 0.12, ...(pad.envelope || {}) },
    probability: pad.probability ?? 1,
    ratchet: pad.ratchet ? { ...pad.ratchet } : null,
    slice: pad.slice ? { ...pad.slice } : null
  };
}

function syncCurrentPadBank() {
  ensurePadBanks();
  const bank = state.padBank || "A";
  state.padBanks[bank] = state.pads.map((pad, index) => clonePadForBank(pad, index, bank));
}

function getActivePadMap() {
  if (!is16LevelEnabled()) return state.pads;
  if (!state.pad16Level.generatedPads.length) generate16LevelPads();
  return state.pad16Level.generatedPads;
}

function is16LevelEnabled() {
  return Boolean(state.pad16Level && state.pad16Level.enabled);
}

function get16LevelSourcePad() {
  const index = clamp(Math.round(state.pad16Level?.sourcePadIndex ?? 0), 0, 15);
  return state.pads[index] || state.pads[0];
}

function enable16LevelMode(sourcePadIndex = state.selectedPadIndex || 0, mode = state.pad16Level.mode || "velocity") {
  state.pad16Level.enabled = true;
  state.pad16Level.sourcePadIndex = clamp(Number(sourcePadIndex), 0, 15);
  state.pad16Level.mode = mode;
  state.pad16Level.liveOverlay = state.pad16Level.liveOverlay !== false;
  generate16LevelPads();
  toast("16-Level Performance enabled in Live Overlay.");
  queueRender();
}

function disable16LevelMode() {
  state.pad16Level.enabled = false;
  state.pad16Level.generatedPads = [];
  state.pads.forEach((pad) => {
    pad.active = false;
    pad.velocity = 0;
    pad.aftertouch = 0;
  });
  toast("16-Level Performance exited. Original pad bank restored.");
  queueRender();
}

function set16LevelSourcePad(index) {
  state.pad16Level.sourcePadIndex = clamp(Number(index), 0, 15);
  state.selectedPadIndex = state.pad16Level.sourcePadIndex;
  generate16LevelPads();
  queueRender();
}

function set16LevelMode(mode) {
  if (!["velocity", "tune", "filter", "layer", "attack", "decay", "probability", "ratchet", "slice"].includes(mode)) return;
  state.pad16Level.mode = mode;
  generate16LevelPads();
  queueRender();
}

function set16LevelOption(path, rawValue, inputType = "") {
  if (!path) return;
  const parts = path.split(".");
  let target = state.pad16Level;
  while (parts.length > 1) {
    const part = parts.shift();
    if (!target[part] || typeof target[part] !== "object") target[part] = {};
    target = target[part];
  }
  const key = parts[0];
  let value = rawValue;
  if (path === "ratchet.values") {
    value = String(rawValue).split(",").map((item) => clamp(Math.round(Number(item.trim())), 1, 64)).filter(Number.isFinite);
    if (value.length < 16) value = state.pad16Level.ratchet.values;
  } else if (inputType === "checkbox") {
    value = Boolean(rawValue);
  } else if (rawValue !== "" && !Number.isNaN(Number(rawValue)) && !["commitTargetBank", "velocity.curve", "tune.scale", "tune.rootNote", "filter.type", "filter.mapTarget", "attack.curve", "decay.curve", "slice.mode"].includes(path)) {
    value = Number(rawValue);
  }
  target[key] = value;
  normalize16LevelConfig();
  generate16LevelPads();
  queueRender();
}

function normalize16LevelConfig() {
  const cfg = state.pad16Level;
  cfg.sourcePadIndex = clamp(Math.round(cfg.sourcePadIndex || 0), 0, 15);
  cfg.referencePad = clamp(Math.round(cfg.referencePad || 8), 1, 16);
  cfg.velocity.min = clamp(Number(cfg.velocity.min), 1, 127);
  cfg.velocity.max = clamp(Number(cfg.velocity.max), cfg.velocity.min, 127);
  cfg.tune.minSemitone = clamp(Number(cfg.tune.minSemitone), -36, 0);
  cfg.tune.maxSemitone = clamp(Number(cfg.tune.maxSemitone), 0, 36);
  cfg.tune.referencePad = clamp(Math.round(Number(cfg.tune.referencePad)), 1, 16);
  cfg.filter.minCutoff = clamp(Number(cfg.filter.minCutoff), 20, 20000);
  cfg.filter.maxCutoff = clamp(Number(cfg.filter.maxCutoff), cfg.filter.minCutoff + 1, 20000);
  cfg.filter.minResonance = clamp(Number(cfg.filter.minResonance), 0.1, 24);
  cfg.filter.maxResonance = clamp(Number(cfg.filter.maxResonance), cfg.filter.minResonance, 32);
  cfg.attack.minMs = clamp(Number(cfg.attack.minMs), 0, 5000);
  cfg.attack.maxMs = clamp(Number(cfg.attack.maxMs), cfg.attack.minMs, 8000);
  cfg.decay.minMs = clamp(Number(cfg.decay.minMs), 10, 8000);
  cfg.decay.maxMs = clamp(Number(cfg.decay.maxMs), cfg.decay.minMs, 12000);
  cfg.probability.min = clamp(Number(cfg.probability.min), 0, 1);
  cfg.probability.max = clamp(Number(cfg.probability.max), cfg.probability.min, 1);
  cfg.ratchet.gate = clamp(Number(cfg.ratchet.gate), 0.05, 1);
  cfg.ratchet.swing = clamp(Number(cfg.ratchet.swing), 0, 0.95);
}

function reset16LevelSettings() {
  const defaults = getDefaultSettings().pad16Level;
  state.pad16Level.mode = defaults.defaultMode;
  state.pad16Level.liveOverlay = defaults.liveOverlayDefault;
  state.pad16Level.velocity.min = defaults.defaultVelocityRange[0];
  state.pad16Level.velocity.max = defaults.defaultVelocityRange[1];
  state.pad16Level.tune.minSemitone = defaults.defaultTuneRange[0];
  state.pad16Level.tune.maxSemitone = defaults.defaultTuneRange[1];
  state.pad16Level.filter.minCutoff = defaults.defaultFilterRange[0];
  state.pad16Level.filter.maxCutoff = defaults.defaultFilterRange[1];
  state.pad16Level.attack.minMs = defaults.defaultAttackRange[0];
  state.pad16Level.attack.maxMs = defaults.defaultAttackRange[1];
  state.pad16Level.decay.minMs = defaults.defaultDecayRange[0];
  state.pad16Level.decay.maxMs = defaults.defaultDecayRange[1];
  state.pad16Level.probability.min = defaults.defaultProbabilityRange[0];
  state.pad16Level.probability.max = defaults.defaultProbabilityRange[1];
  generate16LevelPads();
  toast("16-Level settings reset.");
  queueRender();
}

function generate16LevelPads() {
  const sourcePad = get16LevelSourcePad();
  const sourceName = sourcePad.name || "Source Pad";
  const sourceSample = sourcePad.sampleName || sourcePad.mode || "Internal sound";
  state.pad16Level.generatedPads = Array.from({ length: 16 }, (_, index) => {
    const value = generate16LevelValue(index, state.pad16Level.mode);
    const sourceVelocity = state.pad16Level.mode === "velocity" ? value / 127 : 0.85;
    return {
      id: makeId("pad16"),
      sourcePadIndex: state.pad16Level.sourcePadIndex,
      levelIndex: index,
      mode: state.pad16Level.mode,
      mode16Level: true,
      name: `${sourceName} ${index + 1}`,
      label: `${sourceName} ${index + 1}`,
      valueLabel: label16LevelValue(state.pad16Level.mode, value),
      sampleData: null,
      sampleName: sourceSample,
      type: sourcePad.buffer ? "sample" : "synth",
      shortcut: formatKeyCode(getPadKeyCode(index)),
      buffer: sourcePad.buffer,
      velocity: sourceVelocity,
      pitch: state.pad16Level.mode === "tune" ? value : sourcePad.pitch,
      filter: state.pad16Level.mode === "filter" ? value : { type: "lowpass", cutoff: 18000, resonance: 0.8 },
      layers: build16LevelLayers(sourcePad, value),
      envelope: build16LevelEnvelope(sourcePad, value),
      probability: state.pad16Level.mode === "probability" ? value : 1,
      ratchet: state.pad16Level.mode === "ratchet" ? { repeats: value, gate: state.pad16Level.ratchet.gate, swing: state.pad16Level.ratchet.swing } : null,
      slice: state.pad16Level.mode === "slice" ? value : null,
      gain: sourcePad.gain,
      muted: sourcePad.muted,
      solo: sourcePad.solo,
      color: COLORS[index % COLORS.length],
      active: false,
      missed: false,
      aftertouch: 0
    };
  });
  return state.pad16Level.generatedPads;
}

function generate16LevelValue(index, mode) {
  if (mode === "velocity") return map16LevelVelocity(index);
  if (mode === "tune") return map16LevelTune(index);
  if (mode === "filter") return map16LevelFilter(index);
  if (mode === "layer") return map16LevelLayer(index);
  if (mode === "attack") return map16LevelAttack(index);
  if (mode === "decay") return map16LevelDecay(index);
  if (mode === "probability") return map16LevelProbability(index);
  if (mode === "ratchet") return map16LevelRatchet(index);
  if (mode === "slice") return map16LevelSlice(index);
  return index;
}

function map16LevelVelocity(index) {
  const cfg = state.pad16Level.velocity;
  return Math.round(interpolateCurve(cfg.min, cfg.max, index / 15, cfg.curve));
}

function map16LevelTune(index) {
  const cfg = state.pad16Level.tune;
  const refIndex = clamp(Math.round(cfg.referencePad || 8), 1, 16) - 1;
  if (cfg.scaleLock) {
    const intervals = {
      chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      major: [0, 2, 4, 5, 7, 9, 11],
      minor: [0, 2, 3, 5, 7, 8, 10],
      pentatonic: [0, 3, 5, 7, 10],
      blues: [0, 3, 5, 6, 7, 10]
    }[cfg.scale] || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const offset = index - refIndex;
    const octave = Math.floor(Math.abs(offset) / intervals.length) * 12;
    const step = intervals[Math.abs(offset) % intervals.length] + octave;
    return clamp(offset < 0 ? -step : step, cfg.minSemitone, cfg.maxSemitone);
  }
  if (index === refIndex) return 0;
  if (index < refIndex) {
    const pct = refIndex ? (refIndex - index) / refIndex : 1;
    return Math.round(cfg.minSemitone * pct);
  }
  const pct = (index - refIndex) / Math.max(1, 15 - refIndex);
  return Math.round(cfg.maxSemitone * pct);
}

function map16LevelFilter(index) {
  const cfg = state.pad16Level.filter;
  const pct = index / 15;
  const cutoff = expMap(cfg.minCutoff, cfg.maxCutoff, pct);
  const resonance = interpolateCurve(cfg.minResonance, cfg.maxResonance, pct, "linear");
  return { type: cfg.type, cutoff, resonance };
}

function map16LevelLayer(index) {
  const pct = index / 15;
  return state.pad16Level.layer.crossfade
    ? { layerAGain: 1 - pct, layerBGain: pct }
    : { layerAGain: state.pad16Level.layer.layerA, layerBGain: state.pad16Level.layer.layerB };
}

function map16LevelAttack(index) {
  const cfg = state.pad16Level.attack;
  return Math.round(interpolateCurve(cfg.minMs, cfg.maxMs, index / 15, cfg.curve));
}

function map16LevelDecay(index) {
  const cfg = state.pad16Level.decay;
  return Math.round(interpolateCurve(cfg.minMs, cfg.maxMs, index / 15, cfg.curve));
}

function map16LevelProbability(index) {
  const cfg = state.pad16Level.probability;
  return interpolateCurve(cfg.min, cfg.max, index / 15, "linear");
}

function map16LevelRatchet(index) {
  const values = state.pad16Level.ratchet.values;
  return values[index] || values[values.length - 1] || 1;
}

function map16LevelSlice(index) {
  const source = get16LevelSourcePad();
  const duration = source.buffer?.duration || 1;
  return {
    start: duration * (index / 16),
    end: duration * ((index + 1) / 16),
    index
  };
}

function interpolateCurve(min, max, pct, curve = "linear") {
  const safePct = clamp(Number(pct), 0, 1);
  const shaped = curve === "exponential" ? safePct * safePct : curve === "log" ? Math.sqrt(safePct) : safePct;
  return Number(min) + (Number(max) - Number(min)) * shaped;
}

function expMap(min, max, pct) {
  const safeMin = Math.max(1, Number(min));
  const safeMax = Math.max(safeMin + 1, Number(max));
  return safeMin * Math.pow(safeMax / safeMin, clamp(pct, 0, 1));
}

function build16LevelLayers(sourcePad, value) {
  if (state.pad16Level.mode !== "layer") return Array.isArray(sourcePad.layers) ? sourcePad.layers : [];
  const layerB = sourcePad.layers?.[1] || null;
  return [
    { sampleData: null, sampleName: sourcePad.sampleName || sourcePad.name, gain: value.layerAGain, buffer: sourcePad.buffer },
    { sampleData: null, sampleName: layerB?.sampleName || "Layer B empty", gain: layerB ? value.layerBGain : 0, buffer: layerB?.buffer || null }
  ];
}

function build16LevelEnvelope(sourcePad, value) {
  const envelope = { attack: 0, decay: 0.4, sustain: 0.8, release: 0.12, ...(sourcePad.envelope || {}) };
  if (state.pad16Level.mode === "attack") envelope.attack = value / 1000;
  if (state.pad16Level.mode === "decay") envelope.decay = value / 1000;
  return envelope;
}

function label16LevelValue(mode, value) {
  if (mode === "velocity") return `VEL ${Math.round(value)}`;
  if (mode === "tune") return `${value > 0 ? "+" : ""}${Math.round(value)} ST`;
  if (mode === "filter") return format16LevelHz(value.cutoff);
  if (mode === "layer") return `A${Math.round(value.layerAGain * 100)}/B${Math.round(value.layerBGain * 100)}`;
  if (mode === "attack") return `ATK ${Math.round(value)}ms`;
  if (mode === "decay") return value >= 1000 ? `DEC ${(value / 1000).toFixed(1)}s` : `DEC ${Math.round(value)}ms`;
  if (mode === "probability") return `${Math.round(value * 100)}%`;
  if (mode === "ratchet") return `x${value}`;
  if (mode === "slice") return `SL ${String(value.index + 1).padStart(2, "0")}`;
  return String(value);
}

function format16LevelHz(value) {
  return value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k` : `${Math.round(value)}Hz`;
}

function trigger16LevelPad(index, event, inputVelocity = 1, hold = false, repeated = false) {
  initAudio();
  if (!state.pad16Level.generatedPads.length) generate16LevelPads();
  const pad = state.pad16Level.generatedPads[index];
  const sourcePad = get16LevelSourcePad();
  if (!pad || !sourcePad) return;
  const sourceVelocity = Math.max(0.04, Number(inputVelocity) || pointerVelocity(event));
  const mappedVelocity = clamp((state.pad16Level.mode === "velocity" ? pad.velocity : sourceVelocity) * (sourcePad.gain || 0.85), 0.02, 1.5);

  if (state.pad16Level.mode === "probability" && Math.random() > pad.probability) {
    pad.missed = true;
    record16LevelPerformance(index, pad.probability, 0);
    updatePadVisual(index, 0.08, 0);
    setTimeout(() => {
      pad.missed = false;
      updatePadVisual(index, 0, 0);
    }, 140);
    return;
  }

  state.selectedPadIndex = state.pad16Level.sourcePadIndex;
  pad.active = true;
  pad.velocity = mappedVelocity;
  sourcePad.active = true;
  sourcePad.velocity = mappedVelocity;
  updatePadVisual(index, mappedVelocity, sourcePad.aftertouch || 0);

  if (state.pad16Level.mode === "ratchet" && pad.ratchet && !repeated) {
    scheduleRatchetRepeats(index, pad.ratchet.repeats, pad.ratchet.gate, pad.ratchet.swing, mappedVelocity);
  } else if (state.pad16Level.mode === "slice") {
    triggerSlicePad(index, mappedVelocity);
  } else if (sourcePad.buffer) {
    trigger16LevelSample(sourcePad, pad, mappedVelocity);
  } else {
    triggerSynthDrum(state.pad16Level.sourcePadIndex, mappedVelocity);
  }

  record16LevelPerformance(index, generate16LevelValue(index, state.pad16Level.mode), mappedVelocity);
  if (state.sequencer.recording && !repeated) {
    record16LevelToSequencer(index, pad);
    if (state.pad16Level.mode === "tune") record16LevelToPianoRoll(index, pad);
  }

  if (state.settings.pad16Level.hapticFeedback && state.settings.performance.hapticsEnabled && navigator.vibrate) {
    navigator.vibrate(Math.round(10 + mappedVelocity * 22));
  }

  if (!hold) {
    setTimeout(() => releasePad(index), Math.max(90, (pad.envelope?.decay || 0.16) * 1000));
  }
}

function trigger16LevelSample(sourcePad, generatedPad, velocity) {
  if (!audioCtx || !masterGain || !sourcePad.buffer) return;
  const now = audioCtx.currentTime;
  const source = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  const semitone = Number(generatedPad.pitch ?? sourcePad.pitch ?? 0);
  const envelope = generatedPad.envelope || sourcePad.envelope || { attack: 0, decay: 0.4, sustain: 0.8, release: 0.12 };
  const filterCfg = generatedPad.filter || { type: "lowpass", cutoff: 18000, resonance: 0.8 };
  const slice = generatedPad.slice;
  const attack = clamp(Number(envelope.attack || 0), 0, 10);
  const decay = clamp(Number(envelope.decay || 0.4), 0.02, 30);
  const targetGain = clamp(velocity * (generatedPad.gain || sourcePad.gain || 0.85), 0.001, 1.5);

  source.buffer = sourcePad.buffer;
  source.playbackRate.value = Math.pow(2, semitone / 12);
  filter.type = filterCfg.type || "lowpass";
  filter.frequency.value = clamp(filterCfg.cutoff || 18000, 20, 20000);
  filter.Q.value = clamp(filterCfg.resonance || 0.8, 0.1, 32);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(targetGain, now + attack);
  gain.gain.setTargetAtTime(0.0001, now + attack, Math.max(0.01, decay / 3));
  source.connect(gain);
  gain.connect(filter);
  filter.connect(masterGain);
  sourcePad.source = source;
  sourcePad.gainNode = gain;
  sourcePad.filterNode = filter;
  const offset = slice ? clamp(slice.start, 0, sourcePad.buffer.duration) : 0;
  const duration = slice ? Math.max(0.02, slice.end - slice.start) : undefined;
  source.start(0, offset, duration);
}

function triggerRatchet(sourcePad, repeats, velocity, time = audioCtx?.currentTime || 0) {
  scheduleRatchetRepeats(sourcePad, repeats, state.pad16Level.ratchet.gate, state.pad16Level.ratchet.swing, velocity, time);
}

function scheduleRatchetRepeats(index, repeats, gate, swing, velocity, startTime = audioCtx?.currentTime || 0) {
  const count = clamp(Math.round(repeats || 1), 1, 64);
  const beatSeconds = 60 / (state.bpm || state.daw?.song?.bpm || 120);
  const stepSeconds = beatSeconds / count;
  for (let repeat = 0; repeat < count; repeat += 1) {
    const delay = Math.max(0, (startTime + repeat * stepSeconds + (repeat % 2 ? swing * stepSeconds : 0)) - (audioCtx?.currentTime || startTime));
    setTimeout(() => {
      if (!state.pad16Level.enabled) return;
      const decay = state.pad16Level.ratchet.velocityDecay === false ? 1 : 1 - repeat / Math.max(count * 1.8, 1);
      const pad = state.pad16Level.generatedPads[index];
      if (pad) pad.active = true;
      trigger16LevelPad(index, null, velocity * decay * gate, false, true);
      const el = document.querySelector(`.pad-button[data-index="${index}"]`);
      el?.classList.add("pad-16-level-ratchet");
      setTimeout(() => el?.classList.remove("pad-16-level-ratchet"), Math.max(40, stepSeconds * 500));
    }, delay * 1000);
  }
}

function triggerSlicePad(index, velocity = 1) {
  const sourcePad = get16LevelSourcePad();
  const pad = state.pad16Level.generatedPads[index];
  if (!sourcePad?.buffer || !pad?.slice) {
    triggerSynthDrum(state.pad16Level.sourcePadIndex, velocity);
    return;
  }
  trigger16LevelSample(sourcePad, pad, velocity);
}

function generateEqualSlices(buffer, count = 16) {
  const duration = buffer?.duration || 1;
  return Array.from({ length: count }, (_, index) => ({
    start: duration * (index / count),
    end: duration * ((index + 1) / count),
    index
  }));
}

function detectTransientSlicesPlaceholder(buffer, count = 16) {
  return generateEqualSlices(buffer, count);
}

function renderSliceMarkers(canvas, slices) {
  if (!canvas || !slices) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.save();
  ctx.strokeStyle = "rgba(255, 209, 102, 0.72)";
  slices.forEach((slice) => {
    const x = canvas.width * (slice.index / slices.length);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  });
  ctx.restore();
}

function record16LevelPerformance(index, value, velocity) {
  const entry = {
    id: makeId("pad16perf"),
    time: Date.now(),
    index,
    mode: state.pad16Level.mode,
    sourcePadIndex: state.pad16Level.sourcePadIndex,
    valueLabel: label16LevelValue(state.pad16Level.mode, value),
    velocity
  };
  state.pad16Level.lastPerformance.push(entry);
  if (state.pad16Level.lastPerformance.length > 128) state.pad16Level.lastPerformance = state.pad16Level.lastPerformance.slice(-128);
  rememberTouchPerformance({ type: "pad-16-level", pad: index, mode: entry.mode, velocity, value: entry.valueLabel, time: entry.time });
}

function record16LevelToSequencer(index, pad) {
  if (!state.settings.pad16Level.recordToSequencer) return;
  if (!state.sequencer.stepData) {
    state.sequencer.stepData = Array.from({ length: 16 }, () => Array.from({ length: 64 }, () => null));
  }
  const step = clamp(Math.round(state.sequencer.position || 0), 0, 63);
  if (!state.sequencer.pattern[index]) state.sequencer.pattern[index] = Array(64).fill(false);
  state.sequencer.pattern[index][step] = true;
  state.sequencer.stepData[index][step] = {
    active: true,
    padIndex: index,
    velocity: pad.velocity,
    probability: pad.probability,
    pitch: pad.pitch,
    filterCutoff: pad.filter?.cutoff,
    filterResonance: pad.filter?.resonance,
    layerMix: pad.layers?.[1]?.gain || 0,
    attack: pad.envelope?.attack,
    decay: pad.envelope?.decay,
    ratchet: pad.ratchet,
    sliceIndex: pad.slice?.index,
    offset: 0,
    muted: false
  };
}

function record16LevelToPianoRoll(index, pad) {
  if (!state.settings.pad16Level.recordTuneToPianoRoll) return;
  const note = clamp(60 + Math.round(pad.pitch || 0), 24, 108);
  const step = clamp(Math.round(state.sequencer.position || 0), 0, 127);
  state.pianoRoll.notes.push({ note, step, length: 1, velocity: clamp(pad.velocity || 0.8, 0.05, 1), selected: false });
  if (state.pianoRoll.notes.length > 512) state.pianoRoll.notes = state.pianoRoll.notes.slice(-512);
}

function commit16LevelToBank(bankId = state.pad16Level.commitTargetBank || state.padBank || "A") {
  if (!state.pad16Level.generatedPads.length) generate16LevelPads();
  if (state.settings.pad16Level.confirmBeforeCommit && !window.confirm(`Replace Bank ${bankId} with the current 16-Level variations?`)) return;
  state.padBanks[bankId] = state.pad16Level.generatedPads.map((pad, index) => {
    const source = get16LevelSourcePad();
    return clonePadForBank({
      ...source,
      id: `pad-${bankId}-${index}`,
      name: pad.valueLabel ? `${source.name} ${pad.valueLabel}` : `${source.name} ${index + 1}`,
      bank: bankId,
      gain: pad.gain,
      pitch: pad.pitch,
      filter: pad.filter,
      layers: pad.layers,
      envelope: pad.envelope,
      probability: pad.probability,
      ratchet: pad.ratchet,
      slice: pad.slice,
      sampleName: source.sampleName || source.name,
      color: pad.color,
      mode: source.mode
    }, index, bankId);
  });
  state.padBank = bankId;
  state.pads = state.padBanks[bankId].map((pad, index) => clonePadForBank(pad, index, bankId));
  state.pad16Level.enabled = false;
  state.pad16Level.generatedPads = [];
  toast(`16-Level pads committed to Bank ${bankId}.`);
  queueRender();
}

function renderPadEditor() {
  const pad = state.pads[state.selectedPadIndex];
  return `
    <aside class="pad-editor panel">
      <div class="panel-body">
        <div class="pad-top">
          <h3>Pad ${state.selectedPadIndex + 1}</h3>
          <button type="button" data-action="select-next-pad">Next Pad</button>
        </div>
        <label class="file-button">
          Load Sample
          <input type="file" accept="audio/*" data-file="pad" data-id="${state.selectedPadIndex}" aria-label="Load sample to selected pad" />
        </label>
        <canvas height="82" data-waveform="pad" data-id="${state.selectedPadIndex}" aria-label="Selected pad waveform"></canvas>
        <div class="button-row">
          <button type="button" data-action="preview-pad" data-index="${state.selectedPadIndex}">Preview</button>
          <button type="button" data-action="clear-pad" data-index="${state.selectedPadIndex}" class="danger">Clear</button>
          <button type="button" data-action="toggle-pad-mode" data-index="${state.selectedPadIndex}">${pad.mode === "loop" ? "Loop" : "One-Shot"}</button>
          <button type="button" data-action="toggle-seq-record" aria-pressed="${state.sequencer.recording}">Pad Record</button>
        </div>
        <div class="control-grid">
          ${rangeControl("Pad gain", "pad", "gain", pad.gain, 0, 1.5, 0.01, state.selectedPadIndex)}
          ${rangeControl("Pad pitch", "pad", "pitch", pad.pitch, -12, 12, 0.1, state.selectedPadIndex)}
        </div>
        <label class="field">
          <span>Note repeat</span>
          <select data-input="noteRepeat" aria-label="Note repeat">
            ${["off", ...getTimingDivisions()].map((value) => `<option value="${value}" ${state.noteRepeat === value ? "selected" : ""}>${value === "off" ? "off" : formatTimingDivision(value)}</option>`).join("")}
          </select>
        </label>
        <div class="button-row">
          <button type="button" data-action="slice-sampler-to-pads">Slice Sampler</button>
          <button type="button" data-action="choke-placeholder">Choke Group</button>
        </div>
        ${renderKitBrowser()}
      </div>
    </aside>
  `;
}

function renderKitBrowser() {
  const factoryKits = `
    <div class="field">
      <span>Original built-in kit banks</span>
      <div class="button-row">
        ${FACTORY_KITS.map((kit, index) => `<button type="button" data-action="load-factory-kit" data-index="${index}" style="border-color:${kit.color}">${escapeHtml(kit.name)}</button>`).join("")}
      </div>
    </div>
  `;
  if (!state.kits.length) {
    return `${factoryKits}<div class="empty">Import a local drum-kit folder to create up to five pad kits. Audio stays local in this browser session unless you save the project.</div>`;
  }
  return `
    ${factoryKits}
    <div class="field">
      <span>Loaded kit folders</span>
      <div class="button-row">
        ${state.kits.map((kit, index) => `<button type="button" data-action="select-kit" data-index="${index}" aria-pressed="${state.selectedKitIndex === index}">${escapeHtml(kit.name)} (${kit.samples.length})</button>`).join("")}
      </div>
    </div>
  `;
}

function renderSequencer() {
  const sequencerSize = state.ui.sequencer?.size || "compact";
  return `
    <section class="panel sequencer sequencer-${sequencerSize}" data-floating-sequencer aria-label="Step sequencer">
      <div class="panel-header" data-floating-sequencer-handle>
        <div>
          <h2>Drum Machine and Sequencer</h2>
          <p class="micro">Toggle 16-step or 64-step patterns, record pads, add swing, humanize, quantize, and trigger the performance grid.</p>
          <small class="sequencer-drag-chip">Drag sequencer</small>
        </div>
        <div class="button-row">
          ${helpButton("sequencer")}
          <button type="button" data-action="set-sequencer-size" data-size="compact" aria-pressed="${sequencerSize === "compact"}">Shrink</button>
          <button type="button" data-action="set-sequencer-size" data-size="expanded" aria-pressed="${sequencerSize === "expanded"}">Expand</button>
          <button type="button" data-action="start-sequencer">${state.sequencer.playing ? "Restart" : "Play Sequence"}</button>
          <button type="button" data-action="pause-sequencer">Pause Sequence</button>
          <button type="button" data-action="stop-sequencer">Stop Sequence</button>
          <button type="button" data-action="clear-pattern" class="danger">Clear Pattern</button>
          <button type="button" data-action="random-groove">Random Groove</button>
        </div>
      </div>
      <div class="panel-body">
        <div class="button-row">
          <button type="button" data-action="set-steps" data-steps="16" aria-pressed="${state.sequencer.steps === 16}">16 Steps</button>
          <button type="button" data-action="set-steps" data-steps="32" aria-pressed="${state.sequencer.steps === 32}">32 Steps</button>
          <button type="button" data-action="set-steps" data-steps="64" aria-pressed="${state.sequencer.steps === 64}">64 Steps</button>
          <label class="field compact">
            <span>Timing</span>
            <select data-action="set-timing-division" aria-label="Sequencer timing division">
              ${getTimingDivisions().map((division) => `<option value="${division}" ${state.sequencer.timingDivision === division ? "selected" : ""}>${formatTimingDivision(division)}</option>`).join("")}
            </select>
          </label>
          <button type="button" data-action="humanize">Humanize</button>
          <button type="button" data-action="quantize">Quantize</button>
          ${rangeControl("Swing", "sequencer", "swing", state.sequencer.swing, 0, 0.6, 0.01, "sequencer")}
        </div>
        <div class="sequencer-grid">
          <div class="step-table" style="--steps:${state.sequencer.steps}">
            <div class="step-ruler" aria-hidden="true">
              <span>Pad</span>
              ${Array.from({ length: state.sequencer.steps }, (_, index) => `<span class="${index % 4 === 0 ? "bar" : ""}">${index + 1}</span>`).join("")}
            </div>
            ${state.pads.map((pad, row) => renderStepRow(pad, row)).join("")}
          </div>
          ${renderSequencerBeat2LottoPanel()}
        </div>
      </div>
    </section>
  `;
}

function renderSequencerBeat2LottoPanel() {
  const activeSteps = state.sequencer.pattern.reduce(
    (total, row) => total + row.slice(0, state.sequencer.steps).filter(Boolean).length,
    0
  );
  const seed = `${state.bpm} BPM | ${state.sequencer.steps} steps | ${activeSteps} hits`;
  const samplerName = state.sampler.fileName || "No sampler loaded";
  return `
    <aside class="sequencer-beat2lotto-panel" aria-label="Beat2Lotto sequencer bridge">
      <div>
        <p class="eyebrow">Beat2Lotto+</p>
        <h3>Turn this groove into signal sets.</h3>
        <p>Use the current BPM, timing grid, swing, and pad hits as a creative seed for entertainment-only number signals.</p>
      </div>
      <div class="beat2lotto-seed">
        <span>Current seed</span>
        <strong>${escapeHtml(seed)}</strong>
      </div>
      ${renderSequencerLotteryPreview()}
      <div class="button-row">
        <button type="button" data-action="generate-sequencer-lottery">Generate Signals Here</button>
        <a class="app-top-link beat2lotto-panel-action" href="../beat2lotto-plus.html">Open Beat2Lotto+</a>
      </div>
      <div class="sequencer-sample-bridge" aria-label="Sequencer sampler bridge">
        <div>
          <p class="eyebrow">Sample to Sequence</p>
          <strong>${escapeHtml(samplerName)}</strong>
        </div>
        <div class="button-row">
          <label class="file-button">Load Sample<input type="file" accept="audio/*" data-file="sampler" aria-label="Load sampler audio for sequencer" /></label>
          <button type="button" data-action="preview-sampler">Preview</button>
          <button type="button" data-action="slice-sampler-to-pads">Slice To Pads</button>
          <button type="button" data-action="seed-sampler-sequencer">Put On Steps</button>
        </div>
        <p class="micro">Loads into the sampler, slices or assigns to pads, then the step sequencer triggers those pad samples.</p>
      </div>
      <p class="micro">Creative number generation only. Not a prediction. Lottery outcomes are random.</p>
    </aside>
  `;
}

function renderSequencerLotteryPreview() {
  const result = state.beatLottery.lastGenerated;
  if (!result) {
    return `<div class="sequencer-lottery-preview"><strong>No signals yet</strong><span>Generate here to keep the sequencer on screen.</span></div>`;
  }
  const set = result.sets?.[0];
  const numbers = set?.type === "digits"
    ? set.digits.join("-")
    : [...(set?.main || []).map((number) => String(number).padStart(2, "0")), set?.special ? `${set.specialName || "Special"} ${String(set.special).padStart(2, "0")}` : ""].filter(Boolean).join(" ");
  return `
    <div class="sequencer-lottery-preview">
      <strong>${escapeHtml(result.gameName)}</strong>
      <span>${escapeHtml(numbers || "Ready")}</span>
      <button type="button" data-action="copy-lottery-all">Copy Signals</button>
    </div>
  `;
}

function renderStepRow(pad, row) {
  const steps = [];
  for (let step = 0; step < state.sequencer.steps; step += 1) {
    const on = state.sequencer.pattern[row][step];
    const playhead = state.sequencer.position === step && state.sequencer.playing;
    steps.push(`<button type="button" class="step ${on ? "on" : ""} ${playhead ? "playhead" : ""}" data-action="toggle-step" data-row="${row}" data-step="${step}" aria-label="${escapeAttr(pad.name)} step ${step + 1}" aria-pressed="${on}"></button>`);
  }
  return `<div class="step-row"><span class="step-label">${escapeHtml(pad.name)}</span>${steps.join("")}</div>`;
}

function renderSampler() {
  const sampleName = state.sampler.fileName || "No sampler audio loaded";
  return `
    <section class="panel" aria-label="Sampler">
      <div class="panel-header">
        <div>
          <h2>Sampler</h2>
          <p class="micro">${escapeHtml(sampleName)}</p>
        </div>
        <div class="button-row">
          ${helpButton("sampler")}
          <label class="file-button">
            Load Sample
            <input type="file" accept="audio/*" data-file="sampler" aria-label="Load sampler audio" />
          </label>
          <button type="button" data-action="record-sampler">${state.recording ? "Stop Recording" : "Record Mic Sample"}</button>
          <button type="button" data-action="record-tab">Record Tab Audio</button>
        </div>
      </div>
      <div class="panel-body sampler-grid">
        <div>
          <canvas class="large-wave" height="260" data-waveform="sampler" aria-label="Sampler waveform"></canvas>
        </div>
        <div class="panel">
          <div class="panel-body">
            ${rangeControl("Trim start", "sampler", "trimStart", state.sampler.trimStart, 0, getBufferDuration(state.sampler), 0.01, "sampler")}
            ${rangeControl("Trim end", "sampler", "trimEnd", state.sampler.trimEnd || getBufferDuration(state.sampler), 0, getBufferDuration(state.sampler), 0.01, "sampler")}
            <div class="button-row">
              <button type="button" data-action="preview-sampler">Preview</button>
              <button type="button" data-action="truncate-sampler">Truncate</button>
              <button type="button" data-action="reverse-sampler">Reverse</button>
              <button type="button" data-action="normalize-sampler">Normalize</button>
              <button type="button" data-action="slice-sampler-to-pads">Slice To Pads</button>
              <button type="button" data-action="assign-sampler-to-pad">Assign To Pad</button>
              <button type="button" data-action="export-sampler">Export Sample</button>
              <button type="button" data-action="clear-sampler" class="danger">Clear</button>
            </div>
          </div>
        </div>
      </div>
    </section>
    ${renderKeyboard()}
  `;
}

function renderKeyboard() {
  return `
    <section class="panel keyboard-panel" aria-label="Keyboard synthesizer">
      <div class="panel-header">
        <div>
          <h2>Keyboard Synth</h2>
          <p class="micro">On-screen keys with waveform selection, octave, volume, and note recording into the sequencer.</p>
        </div>
        <div class="button-row">
          ${helpButton("keyboard")}
          <button type="button" data-action="arp-placeholder">Arpeggiator</button>
        </div>
      </div>
      <div class="panel-body">
        <div class="button-row">
          <label class="field"><span>Wave</span><select data-input="synthWave" aria-label="Synth waveform">${["sine", "triangle", "sawtooth", "square"].map((wave) => `<option value="${wave}" ${state.synth.wave === wave ? "selected" : ""}>${wave}</option>`).join("")}</select></label>
          ${rangeControl("Octave", "synth", "octave", state.synth.octave, 1, 7, 1, "synth")}
          ${rangeControl("Volume", "synth", "volume", state.synth.volume, 0, 1, 0.01, "synth")}
        </div>
        <div class="keyboard">
          ${SYNTH_NOTES.map((note, index) => `<button type="button" class="key ${note.includes("#") ? "black" : ""}" data-action="play-note" data-note="${note}" data-midi="${index}"><span>${note}</span><small>${escapeHtml(formatKeyCode(getPianoKeyCode(index)))}</small></button>`).join("")}
        </div>
        ${renderComputerKeyMappingPanel()}
      </div>
    </section>
  `;
}

function renderRecorder() {
  return `
    <section class="panel" aria-label="Recorder">
      <div class="panel-header">
        <div>
          <h2>Recorder</h2>
          <p class="micro">Capture mic or line input, monitor levels, assign recordings to stems or pads, and export local audio.</p>
        </div>
        <div class="button-row">
          ${helpButton("recorder")}
          <button type="button" data-action="refresh-inputs">Refresh Inputs</button>
          <button type="button" data-action="toggle-monitor" aria-pressed="${state.recorder.monitoring}">${state.recorder.monitoring ? "Stop Monitor" : "Monitor Input"}</button>
          <button type="button" data-action="start-recorder">${state.recording ? "Stop Recording" : "Start Recording"}</button>
        </div>
      </div>
      <div class="panel-body recorder-grid">
        <div>
          <canvas class="large-wave" height="240" data-waveform="recording" aria-label="Recording waveform"></canvas>
        </div>
        <div class="panel">
          <div class="panel-body">
            <label class="field">
              <span>Input device</span>
              <select data-input="inputDevice" aria-label="Input device">
                <option value="">Default input</option>
                ${state.recorder.devices.map((device) => `<option value="${device.deviceId}" ${state.recorder.deviceId === device.deviceId ? "selected" : ""}>${escapeHtml(device.label || "Audio input")}</option>`).join("")}
              </select>
            </label>
            <div class="button-row">
              <button type="button" data-action="assign-recording-stem">Assign To Selected Stem</button>
              <button type="button" data-action="assign-recording-pad">Assign To Selected Pad</button>
              <button type="button" data-action="export-recording">Export Recording</button>
              <button type="button" data-action="clear-recording" class="danger">Clear Recording</button>
            </div>
            <p class="micro">Your browser will ask before using mic or capture devices. Nothing is uploaded.</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderFiles() {
  return `
    <section class="panel" aria-label="Project files">
      <div class="panel-header">
        <div>
          <h2>Project and Files</h2>
          <p class="micro">Save large buffers to IndexedDB, export portable metadata, import project maps, and clear local session data.</p>
        </div>
        <div class="button-row">${helpButton("files")}</div>
      </div>
      <div class="panel-body files-grid">
        <div>
          <img src="./assets/generated/stem-mixer-console.svg" alt="" style="width:100%; max-height:360px; object-fit:contain;" />
        </div>
        <div class="panel">
          <div class="panel-body">
            <div class="button-row">
              <button type="button" data-action="save-project">Save Project Locally</button>
              <button type="button" data-action="load-project">Load Local Project</button>
              <button type="button" data-action="export-project">Export Project JSON</button>
              <label class="file-button">
                Import Project JSON
                <input type="file" accept="application/json,.json" data-file="project" aria-label="Import project JSON" />
              </label>
              <button type="button" data-action="export-stem-map">Export Stem Map JSON</button>
              <button type="button" data-action="export-mix">Export Full Mix</button>
              <button type="button" data-action="demo-project">Load Demo Project</button>
              <button type="button" data-action="clear-project" class="danger">Clear Project</button>
            </div>
            <p class="micro">Project JSON exports metadata and buffer references. Local save keeps audio data in IndexedDB on this device.</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderAiMasterPanel() {
  const master = state.aiMaster;
  const profile = getMasterProfile(master.mode);
  const before = master.analysisBefore;
  const after = master.analysisAfter;
  const score = master.qualityScore;
  return `
    <section class="panel best-master-screen" aria-label="AI Master">
      <div class="panel-header best-master-hero">
        <div>
          <h2>Pro Master Algorithm + EQ Brain</h2>
          <p class="micro">Local browser mastering assistant with estimated LUFS, true peak safety, dynamic range protection, smart EQ, presets, and gain-matched A/B. It is guidance, not a replacement for a professional mastering engineer.</p>
        </div>
        <div class="button-row">
          ${helpButton("best-master")}
          <button type="button" data-action="analyze-master">Analyze Master</button>
          <button type="button" data-action="preview-best-master">Preview Master</button>
          <button type="button" data-action="export-best-master-wav">Export 24-bit WAV</button>
          <button type="button" data-action="export-master-report">Export Report</button>
        </div>
      </div>
      <div class="panel-body best-master-grid">
        <article class="master-profile-browser">
          <h3>Target Profile</h3>
          <p class="micro">Default: Streaming Safe, -14 estimated LUFS, -1 dBTP, max 3 dB limiter reduction, mono bass below 120 Hz.</p>
          <div class="master-profile-grid">
            ${Object.entries(MASTER_TARGET_PROFILES).filter(([id]) => id !== "custom").map(([id, item]) => `
              <button type="button" class="master-profile-card ${master.mode === id ? "is-active" : ""}" data-action="set-master-profile" data-id="${escapeAttr(id)}">
                <strong>${escapeHtml(item.label)}</strong>
                <span>${item.targetLufs} LUFS / ${item.truePeakCeiling} dBTP</span>
              </button>
            `).join("")}
          </div>
          <div class="settings-control-row">
            ${aiMasterRange("Target LUFS", "targetLufs", master.targetLufs, -18, -8, 0.1, " LUFS")}
            ${aiMasterRange("True Peak Ceiling", "truePeakCeiling", master.truePeakCeiling, -2, -0.1, 0.1, " dBTP")}
            ${aiMasterRange("Max Limiter GR", "maxLimiterGainReduction", master.maxLimiterGainReduction, 1, 8, 0.1, " dB")}
            ${aiMasterRange("Reference Match", "referenceMatchAmount", master.referenceMatchAmount, 0, 100, 1, "%")}
            ${aiMasterToggle("Dynamic Range Protect", "dynamicRangeProtect", master.dynamicRangeProtect)}
            ${aiMasterToggle("Preserve Punch", "preservePunch", master.preservePunch)}
            ${aiMasterToggle("Mono Low-End", "monoLowEnd", master.monoLowEnd)}
            ${aiMasterToggle("Reference Match", "referenceMatchEnabled", master.referenceMatchEnabled)}
          </div>
        </article>
        ${renderMasteringScoreCard(score, before, after)}
        ${renderLoudnessMeterPanel(before, after)}
        ${renderEqBrainPanel()}
        ${renderReferenceMatchPanel()}
        ${renderEqPresetLibrary()}
        ${renderExportReadinessPanel()}
      </div>
    </section>
  `;
}

function aiMasterRange(label, key, value, min, max, step, unit = "") {
  return `<label class="settings-control"><span>${escapeHtml(label)} <span class="micro">${formatMasterValue(value, unit)}</span></span><input type="range" min="${min}" max="${max}" step="${step}" value="${escapeAttr(value)}" data-action="set-ai-master" data-ai-master="${escapeAttr(key)}" aria-label="${escapeAttr(label)}" /></label>`;
}

function aiMasterToggle(label, key, value) {
  return `<label class="settings-control settings-toggle"><input type="checkbox" ${value ? "checked" : ""} data-action="set-ai-master" data-ai-master="${escapeAttr(key)}" /><span>${escapeHtml(label)}</span></label>`;
}

function formatMasterValue(value, unit = "") {
  if (!Number.isFinite(Number(value))) return `0${unit}`;
  return `${Number(value).toFixed(Math.abs(Number(value)) < 10 ? 1 : 0)}${unit}`;
}

function renderMasteringScoreCard(score, before, after) {
  const status = score?.overall >= 82 ? "Ready" : score?.overall >= 65 ? "Review" : score ? "Needs Work" : "Not analyzed";
  const warnings = state.aiMaster.warnings || [];
  const suggestions = state.aiMaster.suggestions || [];
  return `
    <article class="master-quality-score">
      <div class="section-head">
        <div><h3>Mastering Score</h3><p class="micro">Checks loudness, true peak, dynamics, EQ balance, low-end control, harshness, stereo, clipping, and export readiness.</p></div>
        ${helpButton("mastering-score")}
      </div>
      <div class="score-orb ${status.toLowerCase().replace(/\s+/g, "-")}"><strong>${score?.overall ?? "--"}</strong><span>${status}</span></div>
      <div class="master-warning-grid">
        ${(warnings.length ? warnings : ["Run Analyze Master to get warning badges."]).map((warning) => `<span class="master-warning-badge">${escapeHtml(warning)}</span>`).join("")}
      </div>
      <ul class="master-suggestion-list">
        ${(suggestions.length ? suggestions : ["Load the demo or stems, then run the algorithm."]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
      <div class="master-ab-panel">
        <button type="button" data-action="compare-master-ab" data-mode="before" aria-pressed="${state.aiMaster.abMode === "before"}">A: Original</button>
        <button type="button" data-action="compare-master-ab" data-mode="after" aria-pressed="${state.aiMaster.abMode === "after"}">B: Gain-Matched Master</button>
      </div>
      ${after ? `<p class="micro">Gain matched for A/B: before ${formatDb(before?.estimatedLufs)} LUFS, after ${formatDb(after.estimatedLufs)} LUFS, true peak ${formatDb(after.truePeak)} dBTP.</p>` : ""}
    </article>
  `;
}

function renderLoudnessMeterPanel(before, after) {
  const analysis = after || before;
  const profile = getMasterProfile(state.aiMaster.mode);
  const targetStatus = !analysis ? "Awaiting analysis" : analysis.estimatedLufs > profile.targetLufs + 1 ? "Too loud" : analysis.estimatedLufs < profile.targetLufs - 2 ? "Under target" : "In range";
  const rows = [
    ["Integrated", `${formatDb(analysis?.estimatedLufs)} LUFS est.`],
    ["Short-term", `${formatDb(analysis?.shortTermLufs?.max)} LUFS est.`],
    ["Momentary", `${formatDb(analysis?.momentaryLufs?.max)} LUFS est.`],
    ["True peak", `${formatDb(analysis?.truePeak)} dBTP`],
    ["Sample peak", `${formatDb(analysis?.samplePeakDb)} dBFS`],
    ["Loudness range", `${formatDb(analysis?.loudnessRange)} LU`],
    ["Crest factor", `${formatDb(analysis?.crestFactor)} dB`],
    ["Limiter GR", `${formatDb(state.aiMaster.chain?.limiterGainReduction)} dB`]
  ];
  return `
    <article class="loudness-meter-panel">
      <div class="section-head">
        <div><h3>Loudness + True Peak</h3><p class="micro">Estimated LUFS and oversampled true peak safety. TODO: full BS.1770 K-weighting implementation.</p></div>
        ${helpButton("loudness-true-peak")}
      </div>
      <div class="master-status ${targetStatus.toLowerCase().replace(/\s+/g, "-")}">${escapeHtml(targetStatus)}</div>
      <div class="loudness-grid">${rows.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}</div>
      <div class="true-peak-meter"><span style="--meter:${analysis ? clamp((analysis.truePeak + 18) / 18, 0, 1) * 100 : 0}%"></span></div>
    </article>
  `;
}

function renderEqBrainPanel() {
  const spectral = state.aiMaster.spectralBalance || state.aiMaster.analysisBefore?.spectral || {};
  const corrective = state.aiMaster.correctiveEq || [];
  const enhancement = state.aiMaster.enhancementEq || [];
  return `
    <article class="eq-brain-panel">
      <div class="section-head">
        <div><h3>EQ Brain</h3><p class="micro">Correction before enhancement. Auto moves are capped at 3 dB unless Aggressive is enabled.</p></div>
        ${helpButton("eq-brain")}
      </div>
      ${renderFrequencyProblemMap(spectral)}
      <div class="eq-curve-editor">
        <h4>Suggested Corrective EQ</h4>
        ${corrective.length ? corrective.map(renderEqBandRow).join("") : `<p class="micro">Run Analyze Master to build corrective EQ moves.</p>`}
        <h4>Enhancement EQ</h4>
        ${enhancement.length ? enhancement.map(renderEqBandRow).join("") : `<p class="micro">Enhancement moves appear when a profile calls for air, warmth, presence, or bass focus.</p>`}
      </div>
    </article>
  `;
}

function renderFrequencyProblemMap(spectral = {}) {
  return `
    <div class="eq-problem-map">
      ${MASTER_EQ_BANDS.map((band) => {
        const value = clamp(Number(spectral[band.id]) || 0, 0, 1);
        const danger = value > 0.68 ? "hot" : value < 0.16 ? "low" : "ok";
        return `<div class="eq-frequency-card ${danger}" style="--meter:${Math.round(value * 100)}%"><strong>${escapeHtml(band.label)}</strong><span>${band.min}-${band.max} Hz</span><i></i></div>`;
      }).join("")}
    </div>
  `;
}

function renderEqBandRow(band) {
  const gain = Number.isFinite(Number(band.gain)) ? `${Number(band.gain).toFixed(1)} dB` : "0.0 dB";
  return `<div class="eq-band-row"><strong>${escapeHtml(band.type)}</strong><span>${escapeHtml(String(band.freq))} Hz</span><span>${escapeHtml(gain)}</span><span>Q ${escapeHtml(String(band.q || 0.7))}</span><span>${escapeHtml(band.mode || "stereo")}</span></div>`;
}

function renderReferenceMatchPanel() {
  const ref = state.aiMaster.referenceAnalysis;
  return `
    <article class="reference-match-panel">
      <div class="section-head">
        <div><h3>Reference Match</h3><p class="micro">Gentle broad-tone matching only. Use references you own or have permission to use.</p></div>
        ${helpButton("reference-match")}
      </div>
      <div class="button-row">
        <label class="file-button">Load Reference<input type="file" accept="audio/*" data-file="reference-master" aria-label="Load reference track" /></label>
        <button type="button" data-action="analyze-reference-track">Analyze Reference</button>
      </div>
      <p class="micro">${state.aiMaster.referenceFileName ? `Reference: ${escapeHtml(state.aiMaster.referenceFileName)}` : "No reference loaded."}</p>
      <div class="settings-control-row">
        ${aiMasterRange("Match Amount", "referenceMatchAmount", state.aiMaster.referenceMatchAmount, 0, 100, 1, "%")}
        ${aiMasterRange("Smoothing", "referenceMatchSmoothing", state.aiMaster.referenceMatchSmoothing, 0, 100, 1, "%")}
        ${aiMasterToggle("Broad tone only", "broadToneOnly", state.aiMaster.broadToneOnly)}
      </div>
      ${ref ? `<p class="micro">Reference: ${formatDb(ref.estimatedLufs)} LUFS est., ${formatDb(ref.truePeak)} dBTP, centroid ${Math.round(ref.spectralCentroid)} Hz.</p>` : ""}
    </article>
  `;
}

function renderEqPresetLibrary() {
  return `
    <article class="master-preset-browser">
      <h3>Master Preset Library</h3>
      <div class="master-preset-grid">
        ${MASTER_PRESETS.map((preset) => `
          <button type="button" class="master-preset-card ${state.aiMaster.selectedPresetId === preset.id ? "is-active" : ""}" data-action="apply-master-preset" data-id="${escapeAttr(preset.id)}">
            <span>${escapeHtml(preset.category)}</span>
            <strong>${escapeHtml(preset.name)}</strong>
            <small>${escapeHtml(preset.description)}</small>
          </button>
        `).join("")}
      </div>
    </article>
  `;
}

function renderExportReadinessPanel() {
  const ready = state.aiMaster.qualityScore?.overall >= 70 && !state.aiMaster.warnings.some((warning) => /clipping|true peak|limiter/i.test(warning));
  return `
    <article class="master-export-panel">
      <h3>Export Readiness</h3>
      <p class="micro">${ready ? "Ready for WAV export. Still listen before publishing." : "Run analysis and address warnings before final export."}</p>
      <div class="button-row">
        <button type="button" data-action="export-best-master-wav">Export 24-bit WAV</button>
        <button type="button" data-action="export-master-16">Export 16-bit Dithered WAV</button>
        <button type="button" data-action="export-master-report">Export Master Report JSON</button>
        <button type="button" data-action="export-master-preset">Export Preset JSON</button>
        <button type="button" data-action="export-master-mp3-placeholder">MP3 Status</button>
      </div>
      <p class="micro">MP3 export requires an encoder module; WAV export is available now.</p>
    </article>
  `;
}

function renderSettings() {
  return `
    <section class="panel" aria-label="Settings">
      <div class="panel-header">
        <div>
          <h2>Settings</h2>
          <p class="micro">Tune performance response, visuals, persistence, and app install behavior.</p>
        </div>
        <div class="button-row">
          ${helpButton("settings")}
          <button type="button" data-action="install-app">Install App</button>
          <button type="button" data-action="reset-settings" class="danger">Reset Settings</button>
        </div>
      </div>
      <div class="panel-body files-grid">
        <div class="panel">
          <div class="panel-body">
            <h3>Performance Feel</h3>
            ${rangeControl("Pad sensitivity", "settings", "padSensitivity", state.settings.padSensitivity, 0.35, 2, 0.01, "settings")}
            ${rangeControl("Keyboard sensitivity", "settings", "keySensitivity", state.settings.keySensitivity, 0.35, 2, 0.01, "settings")}
            ${rangeControl("Visual intensity", "settings", "visualIntensity", state.settings.visualIntensity, 0.2, 1.8, 0.01, "settings")}
            ${rangeControl("Waveform detail", "settings", "waveformDetail", state.settings.waveformDetail, 0.5, 2, 0.01, "settings")}
          </div>
        </div>
        <div class="panel">
          <div class="panel-body">
            <h3>Workflow</h3>
            <div class="button-row">
              <button type="button" data-action="toggle-setting" data-setting="autosave" aria-pressed="${state.settings.autosave}">Autosave ${state.settings.autosave ? "On" : "Off"}</button>
              <button type="button" data-action="toggle-setting" data-setting="stickyTransport" aria-pressed="${state.settings.stickyTransport}">Sticky Header ${state.settings.stickyTransport ? "On" : "Off"}</button>
              <button type="button" data-action="toggle-master-limiter" aria-pressed="${state.master.limiter}">Limiter ${state.master.limiter ? "On" : "Off"}</button>
            </div>
            <h3>Factory Kits</h3>
            <div class="button-row">
              ${FACTORY_KITS.map((kit, index) => `<button type="button" data-action="load-factory-kit" data-index="${index}" style="border-color:${kit.color}">${escapeHtml(kit.name)}</button>`).join("")}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderSettingsPanel() {
  const sections = [
    renderSettingsSection("Audio Engine", "Master level, limiter, metronome, count-in, BPM, and latency behavior.", [
      settingRange("Master Volume", "audio.masterVolume", state.settings.audio.masterVolume, 0, 1, 0.01),
      settingToggle("Limiter", "audio.limiterEnabled", state.settings.audio.limiterEnabled),
      settingToggle("Auto Gain", "audio.autoGain", state.settings.audio.autoGain),
      settingToggle("Metronome", "audio.metronomeEnabled", state.settings.audio.metronomeEnabled),
      settingRange("Metronome Volume", "audio.metronomeVolume", state.settings.audio.metronomeVolume, 0, 1, 0.01),
      settingToggle("Count-in", "audio.countIn", state.settings.audio.countIn),
      settingNumber("Default BPM", "audio.defaultBpm", state.settings.audio.defaultBpm, 40, 240),
      settingSelect("Latency Mode", "audio.latencyMode", state.settings.audio.latencyMode, ["low latency", "balanced", "battery saver"])
    ]),
    renderSettingsSection("Touch Performance", "Touch velocity uses real pressure on supported devices. On regular touch screens, velocity is simulated from finger position, tap movement, and sensitivity settings for a hardware-style feel.", [
      settingRange("Touch Sensitivity", "performance.touchSensitivity", state.settings.performance.touchSensitivity, 0.25, 2, 0.01),
      settingSelect("Velocity Mode", "performance.velocityMode", state.settings.performance.velocityMode, ["pressure", "vertical", "radial", "hybrid"]),
      settingToggle("Aftertouch", "performance.aftertouchEnabled", state.settings.performance.aftertouchEnabled),
      settingToggle("Haptics", "performance.hapticsEnabled", state.settings.performance.hapticsEnabled),
      settingToggle("Pad Glow", "performance.padGlowEnabled", state.settings.performance.padGlowEnabled),
      settingToggle("Key Glow", "performance.keyGlowEnabled", state.settings.performance.keyGlowEnabled),
      settingToggle("Multi-touch", "performance.multiTouchEnabled", state.settings.performance.multiTouchEnabled),
      settingToggle("Keyboard Pitch Bend", "performance.keyboardBendEnabled", state.settings.performance.keyboardBendEnabled),
      settingSelect("Keyboard Aftertouch Target", "performance.keyboardAftertouchTarget", state.settings.performance.keyboardAftertouchTarget, ["filter", "vibrato", "volume", "reverb", "delay"])
    ]),
    renderSettingsSection("Drum Pads", "Defaults for pad banks, modes, recording, labels, and velocity meters.", [
      settingSelect("Default Pad Mode", "pads.defaultMode", state.settings.pads.defaultMode, ["one-shot", "hold", "loop"]),
      settingSelect("Default Bank", "pads.defaultBank", state.settings.pads.defaultBank, ["A", "B", "C", "D"]),
      settingToggle("Choke Groups", "pads.chokeGroupsEnabled", state.settings.pads.chokeGroupsEnabled),
      settingToggle("Quantize Recording", "pads.quantizeRecording", state.settings.pads.quantizeRecording),
      settingToggle("Record Velocity", "pads.recordVelocity", state.settings.pads.recordVelocity),
      settingToggle("Show Velocity Meters", "pads.showVelocityMeters", state.settings.pads.showVelocityMeters),
      settingToggle("Pad Labels", "pads.padLabels", state.settings.pads.padLabels)
    ]),
    renderSettingsSection("16-Level Pads", "Defaults for Live Overlay, commit safety, tune/velocity ranges, recording, labels, and haptics.", [
      settingSelect("Default function", "pad16Level.defaultMode", state.settings.pad16Level.defaultMode, ["velocity", "tune", "filter", "layer", "attack", "decay", "probability", "ratchet", "slice"]),
      settingToggle("Default Live Overlay", "pad16Level.liveOverlayDefault", state.settings.pad16Level.liveOverlayDefault),
      settingToggle("Confirm before Commit", "pad16Level.confirmBeforeCommit", state.settings.pad16Level.confirmBeforeCommit),
      settingToggle("Record to Sequencer", "pad16Level.recordToSequencer", state.settings.pad16Level.recordToSequencer),
      settingToggle("Record Tune to Piano Roll", "pad16Level.recordTuneToPianoRoll", state.settings.pad16Level.recordTuneToPianoRoll),
      settingToggle("Show value labels", "pad16Level.showValueLabels", state.settings.pad16Level.showValueLabels),
      settingToggle("Haptic feedback", "pad16Level.hapticFeedback", state.settings.pad16Level.hapticFeedback)
    ]),
    renderSettingsSection("Waveform Studio", "Browser waveform editing, zero-crossing snap, mini-map, context menus, crossfades, bounce tails, and shortcuts.", [
      settingSelect("Default Tool", "waveformStudio.defaultTool", state.settings.waveformStudio.defaultTool, ["select", "move", "cut", "split", "fade", "crossfade", "marker", "loop"]),
      settingToggle("Snap to Zero Crossing", "waveformStudio.snapToZeroCrossing", state.settings.waveformStudio.snapToZeroCrossing),
      settingToggle("Snap to Beat Grid", "waveformStudio.snapToBeatGrid", state.settings.waveformStudio.snapToBeatGrid),
      settingToggle("Show Mini-map", "waveformStudio.showMiniMap", state.settings.waveformStudio.showMiniMap),
      settingToggle("Context Menu", "waveformStudio.showContextMenu", state.settings.waveformStudio.showContextMenu),
      settingToggle("Auto Crossfade Overlaps", "waveformStudio.autoCrossfadeOverlaps", state.settings.waveformStudio.autoCrossfadeOverlaps),
      settingSelect("Default Crossfade", "waveformStudio.defaultCrossfadeShape", state.settings.waveformStudio.defaultCrossfadeShape, ["linear", "equal-power", "slow fade", "fast fade", "s-curve"]),
      settingToggle("Preserve Original Buffers", "waveformStudio.preserveOriginalBuffers", state.settings.waveformStudio.preserveOriginalBuffers),
      settingNumber("Bounce Tail Seconds", "waveformStudio.bounceTailSeconds", state.settings.waveformStudio.bounceTailSeconds, 0, 30),
      settingToggle("Keyboard Shortcuts", "waveformStudio.keyboardShortcuts", state.settings.waveformStudio.keyboardShortcuts)
    ]),
    renderSettingsSection("Open Music Tool Lab", "Compatibility roadmap, open-source workflow references, plugin bridge notes, and sample license warnings.", [
      settingToggle("Show Compatibility Roadmap", "openTools.showCompatibilityRoadmap", state.settings.openTools.showCompatibilityRoadmap),
      settingToggle("Show Open Source References", "openTools.showOpenSourceReferences", state.settings.openTools.showOpenSourceReferences),
      settingToggle("Show Sample License Warnings", "openTools.showSampleLicenseWarnings", state.settings.openTools.showSampleLicenseWarnings),
      settingToggle("Show Plugin Bridge Placeholders", "openTools.showPluginBridgePlaceholders", state.settings.openTools.showPluginBridgePlaceholders)
    ]),
    renderSettingsSection("Stem Mixer", "Stem loading, looping, waveform, analysis, spectrum, VU, and buffer behavior.", [
      settingToggle("Default Loop", "stems.defaultLoop", state.settings.stems.defaultLoop),
      settingSelect("Solo Mode", "stems.soloMode", state.settings.stems.soloMode, ["exclusive", "additive"]),
      settingSelect("Waveform Detail", "stems.waveformDetail", state.settings.stems.waveformDetail, ["light", "balanced", "detailed"]),
      settingToggle("Auto Analyze on Load", "stems.autoAnalyzeOnLoad", state.settings.stems.autoAnalyzeOnLoad),
      settingToggle("Auto Trim Silence", "stems.autoTrimSilence", state.settings.stems.autoTrimSilence),
      settingToggle("Show Spectrum", "stems.showSpectrum", state.settings.stems.showSpectrum),
      settingToggle("Show VU Meters", "stems.showVuMeters", state.settings.stems.showVuMeters),
      settingToggle("Preserve Original Buffers", "stems.preserveOriginalBuffers", state.settings.stems.preserveOriginalBuffers)
    ]),
    renderSettingsSection("DJ Decks", "Crossfader, platter, beat grid, hot cues, sync visibility, and waveform mode.", [
      settingSelect("Crossfader Curve", "decks.crossfaderCurve", state.settings.decks.crossfaderCurve, ["sharp", "smooth", "constant power"]),
      settingToggle("Platter Animation", "decks.platterAnimation", state.settings.decks.platterAnimation),
      settingToggle("Beat Grid Visible", "decks.beatGridVisible", state.settings.decks.beatGridVisible),
      settingToggle("Hot Cues Visible", "decks.hotCuesVisible", state.settings.decks.hotCuesVisible),
      settingToggle("Sync Placeholder Visible", "decks.syncPlaceholderVisible", state.settings.decks.syncPlaceholderVisible),
      settingSelect("Deck Waveform Mode", "decks.deckWaveformMode", state.settings.decks.deckWaveformMode, ["colored", "mono", "spectrum"])
    ]),
    renderSettingsSection("Sequencer", "Step count, swing, humanize, follow playhead, velocity display, and autoscroll.", [
      settingSelect("Default Steps", "sequencer.defaultSteps", String(state.settings.sequencer.defaultSteps), ["16", "32", "64", "128"]),
      settingRange("Swing", "sequencer.swing", state.settings.sequencer.swing, 0, 0.75, 0.01),
      settingRange("Humanize", "sequencer.humanize", state.settings.sequencer.humanize, 0, 1, 0.01),
      settingToggle("Follow Playhead", "sequencer.followPlayhead", state.settings.sequencer.followPlayhead),
      settingToggle("Step Velocity Visible", "sequencer.stepVelocityVisible", state.settings.sequencer.stepVelocityVisible),
      settingToggle("Auto-scroll", "sequencer.autoScroll", state.settings.sequencer.autoScroll)
    ]),
    renderSettingsSection("Sampler / Editor", "Trim snapping, trim preview, truncate normalization, and slice behavior.", [
      settingToggle("Snap Trim to Zero Crossing", "sampler.snapTrimToZeroCrossing", state.settings.sampler.snapTrimToZeroCrossing),
      settingToggle("Preview on Trim", "sampler.previewOnTrim", state.settings.sampler.previewOnTrim),
      settingToggle("Normalize After Truncate", "sampler.normalizeAfterTruncate", state.settings.sampler.normalizeAfterTruncate),
      settingSelect("Slice Mode", "sampler.sliceMode", state.settings.sampler.sliceMode, ["equal", "transient-placeholder", "manual"])
    ]),
    renderSettingsSection("Beat DNA", "Choose what the shared creative analysis uses for Suno prompts and entertainment-only number sets.", [
      settingToggle("Include Touch History", "beatDNA.includeTouchHistory", state.settings.beatDNA.includeTouchHistory),
      settingToggle("Include Stem Names", "beatDNA.includeStemNames", state.settings.beatDNA.includeStemNames),
      settingToggle("Include Mixer Settings", "beatDNA.includeMixerSettings", state.settings.beatDNA.includeMixerSettings),
      settingToggle("Include Timestamp", "beatDNA.includeTimestamp", state.settings.beatDNA.includeTimestamp),
      settingToggle("Deterministic Mode", "beatDNA.deterministicMode", state.settings.beatDNA.deterministicMode),
      settingRange("Entropy Strength", "beatDNA.entropyStrength", state.settings.beatDNA.entropyStrength, 0, 1, 0.01)
    ]),
    renderSettingsSection("Suno Prompt", "Defaults for copy-ready music prompts generated from the Beat DNA Engine.", [
      settingSelect("Default Vocal Mode", "suno.defaultVocalMode", state.settings.suno.defaultVocalMode, ["with vocals", "instrumental", "rap vocals", "sung vocals", "spoken intro then sung hook", "choir/background vocals"]),
      settingToggle("Avoid Artist Names", "suno.avoidArtistNames", state.settings.suno.avoidArtistNames),
      settingSelect("Default Prompt Detail", "suno.defaultPromptDetail", state.settings.suno.defaultPromptDetail, ["short", "balanced", "detailed"]),
      settingToggle("Save Prompt History", "suno.savePromptHistory", state.settings.suno.savePromptHistory)
    ]),
    renderSettingsSection("Video Prompt Generator", "Defaults for cinematic prompts generated from Beat DNA for text-to-video and image-to-video tools.", [
      settingSelect("Default Platform", "videoPrompt.defaultPlatform", state.settings.videoPrompt.defaultPlatform, ["universal", "higgsfield", "kling", "runway-style", "luma-style", "sora-style", "veo-style"]),
      settingSelect("Default Video Type", "videoPrompt.defaultVideoType", state.settings.videoPrompt.defaultVideoType, ["music-video", "visualizer", "product-teaser", "artist-intro", "lyric-video", "album-trailer", "social-short", "dj-promo", "performance-clip", "abstract-motion-graphic"]),
      settingSelect("Default Aspect Ratio", "videoPrompt.defaultAspectRatio", state.settings.videoPrompt.defaultAspectRatio, ["16:9", "9:16", "1:1", "4:5", "21:9"]),
      settingSelect("Default Duration", "videoPrompt.defaultDuration", state.settings.videoPrompt.defaultDuration, ["5 seconds", "10 seconds", "15 seconds", "30 seconds"]),
      settingSelect("Default Camera Style", "videoPrompt.defaultCameraStyle", state.settings.videoPrompt.defaultCameraStyle, ["cinematic", "handheld", "drone", "dolly", "orbit", "macro", "music-video", "commercial", "glitch"]),
      settingSelect("Default Edit Style", "videoPrompt.defaultEditStyle", state.settings.videoPrompt.defaultEditStyle, ["beat-synced cuts", "slow cinematic", "rapid montage", "one-shot camera move", "performance edit", "visualizer loop"]),
      settingToggle("Safety Mode", "videoPrompt.safetyMode", state.settings.videoPrompt.safetyMode),
      settingToggle("Avoid Copyrighted Characters", "videoPrompt.avoidCopyrightedCharacters", state.settings.videoPrompt.avoidCopyrightedCharacters),
      settingToggle("Avoid Celebrity Likeness", "videoPrompt.avoidCelebrityLikeness", state.settings.videoPrompt.avoidCelebrityLikeness),
      settingToggle("Save Video Prompt History", "videoPrompt.savePromptHistory", state.settings.videoPrompt.savePromptHistory),
      settingToggle("Include Negative Prompt", "videoPrompt.includeNegativePrompt", state.settings.videoPrompt.includeNegativePrompt),
      settingToggle("Include Storyboard", "videoPrompt.includeStoryboard", state.settings.videoPrompt.includeStoryboard),
      settingToggle("Include Image-to-Video Prompt", "videoPrompt.includeImageToVideoPrompt", state.settings.videoPrompt.includeImageToVideoPrompt)
    ]),
    renderSettingsSection("Creative Number Signals", "Entertainment-only beat-seeded number settings. This is creative number generation, not a prediction.", [
      settingSelect("Default State", "lottery.defaultState", state.settings.lottery.defaultState, US_STATE_OPTIONS),
      settingSelect("Default Game", "lottery.defaultGameId", state.settings.lottery.defaultGameId, LOTTERY_GAME_CATALOG.map((game) => game.id)),
      settingSelect("Default Method", "lottery.defaultMethod", state.settings.lottery.defaultMethod, LOTTERY_METHODS.map((method) => method[0])),
      settingNumber("Default Set Count", "lottery.defaultSetCount", state.settings.lottery.defaultSetCount, 1, 25),
      settingToggle("Show Responsible Play Note", "lottery.showResponsiblePlayNote", state.settings.lottery.showResponsiblePlayNote),
      settingToggle("Require Disclaimer Visible", "lottery.requireDisclaimerVisible", state.settings.lottery.requireDisclaimerVisible),
      settingToggle("Allow Custom Games", "lottery.allowCustomGames", state.settings.lottery.allowCustomGames),
      settingToggle("Preserve Leading Zeroes", "lottery.preserveLeadingZeroes", state.settings.lottery.preserveLeadingZeroes),
      settingToggle("Show Box Permutations", "lottery.showBoxPermutations", state.settings.lottery.showBoxPermutations),
      settingToggle("Show Number Analysis", "lottery.showNumberAnalysis", state.settings.lottery.showNumberAnalysis)
    ]),
    renderSettingsSection("Visuals", "Theme, motion, meters, glow, background animation, and high contrast.", [
      settingSelect("Theme", "visuals.theme", state.settings.visuals.theme, ["neon-cyber", "deep-space", "gold-console", "midnight-glass", "high-contrast"]),
      settingToggle("Motion Enabled", "visuals.motionEnabled", state.settings.visuals.motionEnabled),
      settingToggle("Reduced Motion", "visuals.reducedMotion", state.settings.visuals.reducedMotion),
      settingRange("Meter Intensity", "visuals.meterIntensity", state.settings.visuals.meterIntensity, 0, 2, 0.01),
      settingRange("Glow Intensity", "visuals.glowIntensity", state.settings.visuals.glowIntensity, 0, 2, 0.01),
      settingToggle("Background Animation", "visuals.backgroundAnimation", state.settings.visuals.backgroundAnimation),
      settingToggle("High Contrast", "visuals.highContrastMode", state.settings.visuals.highContrastMode)
    ]),
    renderSettingsSection("Project / Files", "Autosave, clear confirmation, prompt history, recent projects, and settings transfer.", [
      settingToggle("Auto Save", "project.autoSave", state.settings.project.autoSave),
      settingNumber("Auto Save Interval", "project.autoSaveInterval", state.settings.project.autoSaveInterval, 5, 300),
      settingToggle("Confirm Before Clear", "project.confirmBeforeClear", state.settings.project.confirmBeforeClear),
      settingToggle("Save Suno Prompt History", "project.savePromptHistory", state.settings.project.savePromptHistory),
      settingToggle("Save Recent Projects", "project.saveRecentProjects", state.settings.project.saveRecentProjects),
      `<button type="button" data-action="export-settings">Export Settings</button>`,
      `<label class="file-button">Import Settings<input type="file" accept="application/json,.json" data-file="settings" aria-label="Import settings" /></label>`,
      `<button type="button" data-action="reset-settings" class="danger">Reset Settings</button>`
    ]),
    renderSettingsSection("Help Preferences", "Tooltips, first-run guide, compact help, and tutorial restart.", [
      settingToggle("Show Tooltips", "help.showTooltips", state.settings.help.showTooltips),
      settingToggle("Show First Run Guide", "help.showFirstRunGuide", state.settings.help.showFirstRunGuide),
      settingToggle("Compact Help", "help.compactHelp", state.settings.help.compactHelp),
      `<button type="button" data-action="restart-guide">Restart Tutorial</button>`
    ]),
    `<article class="settings-section asset-brand-card">
      <div class="section-head">
        <div><h3>Branded Assets</h3><p class="micro">Fallback SVGs are bundled now. ChatGPT Image 2 prompt files document the final PNG/WebP workflow.</p></div>
        ${helpButton("settings")}
      </div>
      <div class="settings-control-row">
        <img src="${getAsset("settings")}" alt="" class="asset-thumb" />
        <a class="ghost-link" href="assets/prompts/chatgpt-image-2-brand-assets.md" target="_blank" rel="noreferrer">Brand Prompts</a>
        <a class="ghost-link" href="assets/brand/README.md" target="_blank" rel="noreferrer">Asset README</a>
      </div>
    </article>`
  ];
  return `
    <section class="panel settings-screen" aria-label="Settings">
      <div class="panel-header settings-hero">
        <div>
          <h2>Settings</h2>
          <p class="micro">Control audio, touch response, visuals, project behavior, DAW defaults, and help overlays.</p>
        </div>
        <div class="button-row">${helpButton("settings")}<button type="button" data-action="install-app">Install App</button></div>
      </div>
      <div class="panel-body settings-grid">${sections.join("")}</div>
    </section>
  `;
}

function renderSettingsSection(title, copy, controls) {
  return `
    <article class="settings-section">
      <div class="section-head">
        <div><h3>${escapeHtml(title)}</h3><p class="micro">${escapeHtml(copy)}</p></div>
      </div>
      <div class="settings-control-row">${controls.join("")}</div>
    </article>
  `;
}

function settingRange(label, path, value, min, max, step) {
  return `<label class="settings-control"><span>${escapeHtml(label)} <span class="micro">${formatControlValue(value)}</span></span><input class="settings-slider" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-action="set-setting" data-setting-path="${path}" /></label>`;
}

function settingToggle(label, path, value) {
  return `<label class="settings-control settings-toggle"><input type="checkbox" ${value ? "checked" : ""} data-action="set-setting" data-setting-path="${path}" /><span>${escapeHtml(label)}</span></label>`;
}

function settingSelect(label, path, value, options) {
  return `<label class="settings-control"><span>${escapeHtml(label)}</span><select class="settings-select" data-action="set-setting" data-setting-path="${path}">${options.map((option) => `<option value="${escapeAttr(option)}" ${String(value) === String(option) ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select></label>`;
}

function settingNumber(label, path, value, min, max) {
  return `<label class="settings-control"><span>${escapeHtml(label)}</span><input type="number" min="${min}" max="${max}" value="${value}" data-action="set-setting" data-setting-path="${path}" /></label>`;
}

function renderMidiPanel() {
  return `
    <section class="panel midi-screen" aria-label="MIDI panel">
      <div class="panel-header">
        <div>
          <h2>MIDI</h2>
          <p class="micro">Permission-based Web MIDI plus direct MIDI file import/export. Hardware support depends on the browser.</p>
        </div>
        <div class="button-row">
          ${helpButton("midi")}
          <button type="button" data-action="request-midi">Request MIDI Access</button>
          <button type="button" data-action="refresh-midi">Refresh Devices</button>
          <label class="file-button">Import MIDI<input type="file" accept=".mid,.midi,audio/midi" data-file="midi" aria-label="Import MIDI file" /></label>
          <button type="button" data-action="export-midi">Export MIDI</button>
        </div>
      </div>
      <div class="panel-body files-grid">
        <div class="panel">
          <div class="panel-body midi-device-list">
            <h3>Inputs</h3>
            ${state.daw.midi.inputs.length ? state.daw.midi.inputs.map((input) => `<button type="button" data-action="select-midi-input" data-id="${escapeAttr(input.id)}" aria-pressed="${state.daw.midi.selectedInputId === input.id}">${escapeHtml(input.name)}</button>`).join("") : `<p class="micro">No MIDI inputs connected or permission not granted.</p>`}
            <h3>Outputs</h3>
            ${state.daw.midi.outputs.length ? state.daw.midi.outputs.map((output) => `<button type="button" data-action="select-midi-output" data-id="${escapeAttr(output.id)}" aria-pressed="${state.daw.midi.selectedOutputId === output.id}">${escapeHtml(output.name)}</button>`).join("") : `<p class="micro">No MIDI outputs connected or permission not granted.</p>`}
          </div>
        </div>
        <div class="panel">
          <div class="panel-body midi-learn-panel">
            <h3>MIDI Learn</h3>
            <div class="button-row">
              <button type="button" data-action="toggle-midi-thru" aria-pressed="${state.daw.midi.thruEnabled}">MIDI Thru ${state.daw.midi.thruEnabled ? "On" : "Off"}</button>
              <button type="button" data-action="toggle-midi-record" aria-pressed="${state.daw.midi.recordEnabled}">Record ${state.daw.midi.recordEnabled ? "On" : "Off"}</button>
              <button type="button" data-action="learn-midi" data-target="mixer.master.volume">Learn Master Volume</button>
              <button type="button" data-action="midi-clock-placeholder">MIDI Clock</button>
            </div>
            <div class="midi-map-row">
              ${state.daw.midiMappings.length ? state.daw.midiMappings.map((map) => `<span>${escapeHtml(map.targetPath)} CC ${map.controller}</span>`).join("") : `<span>No learned mappings yet.</span>`}
            </div>
          </div>
        </div>
      </div>
    </section>
    ${renderSampleStandardsPanel()}
  `;
}

function renderSampleStandardsPanel() {
  return `
    <section class="panel sample-standards-panel" aria-label="Sample standards">
      <div class="panel-header">
        <div>
          <h2>Sample Standards and Compatibility</h2>
          <p class="micro">User-supplied files only. No copyrighted SoundFonts, patches, or plugins are bundled.</p>
        </div>
        <div class="button-row">${helpButton("standards")}</div>
      </div>
      <div class="panel-body">
        <div class="button-row">
          <label class="file-button">List SoundFont2<input type="file" accept=".sf2" data-file="sf2" aria-label="Import SoundFont2 metadata" /></label>
          <label class="file-button">List GUS Patch<input type="file" accept=".pat" data-file="gus" aria-label="Import GUS patch metadata" /></label>
          <button type="button" data-action="native-plugin-placeholder">External Plugin Bridge</button>
        </div>
        <p class="micro">SoundFont2 parsing is planned. Selected files are listed as metadata only until a browser-safe player is implemented.</p>
      </div>
    </section>
  `;
}

function renderSunoPrompt() {
  return renderSunoPromptPanel();
}

function renderBeatDNAPanel() {
  const dna = state.beatDNA || analyzeBeatDNA();
  const lottery = state.beatLottery.lastGenerated;
  return `
    <section class="panel beat-dna-screen" aria-label="Beat DNA Engine">
      <div class="panel-header beat-dna-hero">
        <div>
          <h2>Beat DNA Engine</h2>
          <p class="micro">One local analysis engine feeds Beat -> Suno Prompt and Creative Number Signals.</p>
        </div>
        <div class="button-row beat-dna-action-row" aria-label="Beat DNA actions">
          <div class="beat-dna-action-backplate" aria-hidden="true">
            <img src="${getAsset("beatDNA")}" alt="" />
            <img src="${getAsset("sunoPrompt")}" alt="" />
            <img src="${getAsset("beatLottery")}" alt="" />
            <img src="${getAsset("creativeBundle")}" alt="" />
          </div>
          ${helpButton("beat-dna")}
          <button class="beat-dna-art-button" type="button" data-action="analyze-beat-dna"><span class="beat-dna-action-icon"><img src="${getAsset("beatDNA")}" alt="" /></span><span>Analyze Beat DNA</span></button>
          <button class="beat-dna-art-button" type="button" data-action="generate-suno-prompt"><span class="beat-dna-action-icon"><img src="${getAsset("sunoPrompt")}" alt="" /></span><span>Generate Suno Prompt</span></button>
          <button class="beat-dna-art-button" type="button" data-action="generate-beat-lottery"><span class="beat-dna-action-icon"><img src="${getAsset("beatLottery")}" alt="" /></span><span>Generate Number Signals</span></button>
          <button class="beat-dna-art-button" type="button" data-action="generate-creative-bundle"><span class="beat-dna-action-icon"><img src="${getAsset("creativeBundle")}" alt="" /></span><span>Generate Both</span></button>
        </div>
      </div>
      <div class="panel-body beat-dna-grid">
        ${renderBeatDNACard("Tempo", [`${dna.bpm} BPM`, dna.tempoTerm, `${Math.round(dna.swing * 100)}% swing`])}
        ${renderBeatDNACard("Feel", [dna.energy, dna.groove, dna.density, dna.mood])}
        ${renderBeatDNACard("Source", [`${dna.sourceSummary.activePads} active pads`, `${dna.sourceSummary.activeStems} active stems`, `${dna.sourceSummary.pianoNotes} piano notes`, `${dna.sourceSummary.clips} clips`])}
        ${renderBeatDNACard("Signatures", [dna.rhythmSignature, dna.padSignature, dna.stemSignature, dna.keyboardSignature, dna.arrangementSignature, dna.mixerSignature])}
        <article class="beat-dna-card">
          <h3>Entropy</h3>
          <div class="beat-dna-meter"><span style="--meter:${clamp(dna.entropyScore, 0, 100)}%"></span></div>
          <p class="beat-dna-signature">${escapeHtml(dna.seed)}</p>
          <div class="button-row">
            <button type="button" data-action="copy-beat-dna">Copy Beat DNA</button>
            <button type="button" data-action="export-beat-dna">Export DNA</button>
          </div>
        </article>
        <article class="beat-dna-card">
          <h3>Tags</h3>
          <div class="button-row">${dna.tags.map((tag) => `<span class="beat-dna-chip">${escapeHtml(tag)}</span>`).join("")}</div>
          <p class="micro">Last Suno prompt: ${state.sunoPrompt ? escapeHtml(state.sunoPrompt.title || "generated") : "none yet"}</p>
          <p class="micro">Last number signal: ${lottery ? escapeHtml(lottery.gameName) + " / " + lottery.sets.length + " sets" : "none yet"}</p>
        </article>
      </div>
    </section>
    ${state.beatCreativeBundle ? renderBeatCreativeBundle() : ""}
  `;
}

function renderBeatDNACard(title, values) {
  return `<article class="beat-dna-card"><h3>${escapeHtml(title)}</h3><div class="button-row">${values.filter(Boolean).map((value) => `<span class="beat-dna-chip">${escapeHtml(String(value))}</span>`).join("")}</div></article>`;
}

function renderSunoPromptPanel() {
  const prompt = state.sunoPrompt || generateSunoPromptFromBeatDNA({ save: false });
  const analysis = prompt.analysis || analyzeBeatDNA();
  const history = getSunoPromptHistory();
  const options = state.sunoPromptOptions;
  const beatTags = analysis.tags || analysis.sonicTags || [];
  const warnings = analysis.warnings || [];
  return `
    <section class="panel suno-prompt-screen" aria-label="Beat to Suno Prompt">
      <div class="panel-header suno-prompt-hero">
        <div>
          <h2>Beat -> Suno Prompt</h2>
          <p class="micro">Turn your current beat, stems, drums, pads, piano roll, arrangement, and mixer settings into a copy-ready Suno prompt.</p>
        </div>
        <div class="button-row">
          ${helpButton("suno-prompt")}
          <button type="button" data-action="generate-suno-prompt">Generate From Current Beat</button>
          <button type="button" data-action="copy-suno-all">Copy All</button>
          <a class="ghost-link" href="https://suno.com/create" target="_blank" rel="noreferrer">Open Suno</a>
        </div>
      </div>
      <div class="panel-body suno-prompt-grid">
        <article class="suno-prompt-options">
          <h3>Prompt Options</h3>
          <label class="settings-control"><span>Song title</span><input type="text" value="${escapeAttr(options.songTitle)}" data-action="set-suno-option" data-suno-option="songTitle" placeholder="Optional title" /></label>
          <label class="settings-control"><span>Lyric theme</span><input type="text" value="${escapeAttr(options.lyricTheme)}" data-action="set-suno-option" data-suno-option="lyricTheme" placeholder="late-night ambition, neon city focus..." /></label>
          <label class="settings-control"><span>Vocal mode</span><select data-action="set-suno-option" data-suno-option="vocalMode">${["with vocals", "instrumental", "rap vocals", "sung vocals", "spoken intro then sung hook", "choir/background vocals"].map((item) => `<option value="${escapeAttr(item)}" ${options.vocalMode === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}</select></label>
          <label class="settings-control"><span>Language</span><input type="text" value="${escapeAttr(options.language)}" data-action="set-suno-option" data-suno-option="language" /></label>
          <label class="settings-control"><span>Structure</span><select data-action="set-suno-option" data-suno-option="structure">${["intro, verse, chorus, verse, chorus, bridge, final chorus, outro", "DJ intro, build, drop, breakdown, second drop, outro", "hook first, verse, chorus, bridge, final hook", "instrumental intro, verse, hook, solo, outro"].map((item) => `<option value="${escapeAttr(item)}" ${options.structure === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}</select></label>
          <label class="settings-control"><span>Prompt detail</span><select data-action="set-suno-option" data-suno-option="promptDetail">${["short", "balanced", "detailed"].map((item) => `<option value="${escapeAttr(item)}" ${options.promptDetail === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}</select></label>
          <label class="settings-control settings-toggle"><input type="checkbox" ${options.explicitMode ? "checked" : ""} data-action="set-suno-option" data-suno-option="explicitMode" /><span>Allow explicit content</span></label>
          <label class="settings-control settings-toggle"><input type="checkbox" ${options.artistAvoidance ? "checked" : ""} data-action="set-suno-option" data-suno-option="artistAvoidance" /><span>Avoid artist names and copyrighted lyric references</span></label>
        </article>
        <article class="suno-beat-dna">
          <h3>Beat DNA</h3>
          ${["genreGuess", "mood", "energy", "tempoTerm", "groove", "density"].map((key) => `<span class="suno-dna-chip">${escapeHtml(titleCase(key.replace(/([A-Z])/g, " $1").toLowerCase()))}: ${escapeHtml(String(analysis[key]))}</span>`).join("")}
          ${beatTags.map((tag) => `<span class="suno-dna-chip">${escapeHtml(tag)}</span>`).join("")}
          <p class="micro"><strong>Music source:</strong> ${escapeHtml(analysis.musicSourceSummary || "Play pads, add sequencer steps, load stems, or draw piano roll notes for a more specific prompt.")}</p>
          ${warnings.length ? `<p class="suno-warning-note">${escapeHtml(warnings.join(" "))}</p>` : ""}
        </article>
        ${renderSunoOutputCard("Simple Mode Prompt", "simple", prompt.simplePrompt, "copy-suno-simple")}
        ${renderSunoOutputCard("Custom Style Prompt", "style", prompt.stylePrompt, "copy-suno-style")}
        ${renderSunoOutputCard("Lyrics / Hook Prompt", "lyrics", prompt.lyricPrompt, "copy-suno-lyrics")}
        ${renderSunoOutputCard("Instrumental Prompt", "instrumental", prompt.instrumentalPrompt, "copy-suno-instrumental")}
        ${renderSunoOutputCard("Exclude Prompt", "exclude", prompt.excludePrompt, "copy-suno-exclude")}
        ${renderSunoOutputCard("Arrangement Notes", "arrangement", prompt.arrangementNotes, "copy-suno-arrangement")}
        <article class="suno-output-card">
          <h3>Recent Prompt Snapshots</h3>
          <div class="suno-copy-row"><button type="button" data-action="clear-suno-history" class="danger">Clear History</button></div>
          <div class="suno-history-list">
            ${history.length ? history.map((item) => `<button type="button" data-action="restore-suno-history" data-id="${item.id}"><strong>${escapeHtml(item.projectName || "Untitled")}</strong><span>${escapeHtml(item.genre)} / ${escapeHtml(item.mood)} / ${item.bpm} BPM</span></button>`).join("") : `<p class="micro">No prompt snapshots yet.</p>`}
          </div>
        </article>
      </div>
      <footer class="suno-warning-note">Generated prompts describe your own local project. Use original lyrics and avoid requesting imitation of specific artists or copyrighted songs.</footer>
    </section>
  `;
}

function renderBeatLotteryPanel() {
  const dna = state.beatDNA || analyzeBeatDNA();
  const result = state.beatLottery.lastGenerated;
  return `
    <section class="panel beat-lottery-screen" aria-label="Creative Number Signals">
      <div class="panel-header beat-lottery-hero">
        <div>
          <h2>Creative Number Signals</h2>
          <p class="micro">Turn your current rhythm, stems, pads, piano roll, and mix movement into beat-seeded entertainment picks. Not a prediction.</p>
        </div>
        <div class="button-row">
          ${helpButton("beat-lottery")}
          <button type="button" data-action="generate-beat-lottery">Generate Signals</button>
          <button type="button" data-action="generate-creative-bundle">Generate Both</button>
          <button type="button" data-action="copy-lottery-all">Copy All</button>
        </div>
      </div>
      <div class="panel-body">
        <p class="lottery-disclaimer"><strong>Beat-seeded entertainment picks.</strong> Creative number generation. Not a prediction. Lottery outcomes are random. Use this feature for entertainment, journaling, and creative play only. Check official lottery sources before playing.</p>
        <div class="lottery-control-grid">
          ${renderLotteryGameSelector()}
          ${renderLotteryOptions()}
          <article class="beat-dna-card">
            <h3>Beat DNA Source</h3>
            <p class="micro">${escapeHtml(dna.rhythmSignature)}</p>
            <div class="button-row">${dna.tags.slice(0, 8).map((tag) => `<span class="beat-dna-chip">${escapeHtml(tag)}</span>`).join("")}</div>
          </article>
        </div>
        ${renderLotteryOutput()}
        ${renderLotteryHistory()}
      </div>
    </section>
  `;
}

function renderLotteryGameSelector() {
  const game = getSelectedLotteryGame();
  const groups = [
    ["Digit Games", ["pick-3", "pick-4", "pick-5-digits"]],
    ["Multi-State", ["powerball", "mega-millions"]],
    ["State Templates", ["cash-5", "lotto-6"]],
    ["Custom", ["custom", ...getCustomLotteryGames().map((item) => item.id)]]
  ];
  return `
    <article class="lottery-game-selector">
      <h3>Game</h3>
      <label class="settings-control"><span>State / territory</span><select data-action="set-lottery-state">${US_STATE_OPTIONS.map((item) => `<option value="${item}" ${state.beatLottery.selectedState === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
      ${groups.map(([label, ids]) => `<div><p class="micro">${label}</p><div class="button-row">${ids.map((id) => {
        const item = getLotteryGame(id);
        return item ? `<button type="button" data-action="set-lottery-game" data-id="${item.id}" class="${game.id === item.id ? "is-active" : ""}">${escapeHtml(item.name)}</button>` : "";
      }).join("")}</div></div>`).join("")}
      <p class="micro">Verify availability in your state. Game rules, matrices, draw times, prizes, and eligibility vary by jurisdiction. Verify with the official lottery before playing.</p>
      ${game.officialUrl ? `<a class="ghost-link" href="${escapeAttr(game.officialUrl)}" target="_blank" rel="noreferrer">Open Official Rules</a>` : ""}
    </article>
  `;
}

function renderLotteryOptions() {
  const custom = state.beatLottery.customDraft || {};
  return `
    <article class="lottery-game-selector">
      <h3>Options</h3>
      <label class="settings-control"><span>Method</span><select data-action="set-lottery-method">${LOTTERY_METHODS.map(([id, label]) => `<option value="${id}" ${state.beatLottery.selectedMethod === id ? "selected" : ""}>${label}</option>`).join("")}</select></label>
      <label class="settings-control"><span>Number of sets</span><input type="number" min="1" max="25" value="${state.beatLottery.setCount}" data-action="set-lottery-count" /></label>
      <label class="settings-control"><span>User seed text</span><input type="text" value="${escapeAttr(state.beatLottery.userSeedText)}" data-action="set-lottery-option" data-lottery-option="userSeedText" placeholder="optional phrase" /></label>
      <label class="settings-control settings-toggle"><input type="checkbox" ${state.beatLottery.includeEntropy ? "checked" : ""} data-action="set-lottery-option" data-lottery-option="includeEntropy" /><span>Include fresh entropy</span></label>
      <label class="settings-control settings-toggle"><input type="checkbox" ${state.beatLottery.lockToCurrentBeat ? "checked" : ""} data-action="set-lottery-option" data-lottery-option="lockToCurrentBeat" /><span>Lock to current beat</span></label>
      <div class="custom-lottery-builder">
        <h3>Custom Game Builder</h3>
        <label class="settings-control"><span>Name</span><input type="text" value="${escapeAttr(custom.name || "My Custom Game")}" data-action="set-custom-lottery" data-custom-key="name" /></label>
        <label class="settings-control"><span>Main count</span><input type="number" min="1" max="10" value="${custom.mainCount || 5}" data-action="set-custom-lottery" data-custom-key="mainCount" /></label>
        <label class="settings-control"><span>Main max</span><input type="number" min="1" max="99" value="${custom.mainMax || 39}" data-action="set-custom-lottery" data-custom-key="mainMax" /></label>
        <label class="settings-control settings-toggle"><input type="checkbox" ${custom.specialEnabled ? "checked" : ""} data-action="set-custom-lottery" data-custom-key="specialEnabled" /><span>Special ball</span></label>
        <button type="button" data-action="save-custom-lottery-game">Save Custom Game</button>
      </div>
    </article>
  `;
}

function renderLotteryOutput() {
  const result = state.beatLottery.lastGenerated;
  if (!result) return `<div class="lottery-output-grid"><article class="lottery-set-card"><h3>No signals yet</h3><p class="micro">Generate Number Signals to create beat-seeded entertainment picks.</p></article></div>`;
  return `
    <div class="lottery-output-grid">
      ${result.sets.map((set) => renderLotterySetCard(result, set)).join("")}
    </div>
  `;
}

function renderLotterySetCard(result, set) {
  const balls = set.type === "digits"
    ? set.digits.map((digit) => `<span class="lottery-digit">${digit}</span>`).join("")
    : set.main.map((num) => `<span class="lottery-ball">${String(num).padStart(2, "0")}</span>`).join("") + (set.special ? `<span class="lottery-ball special">${escapeHtml(set.specialName)} ${String(set.special).padStart(2, "0")}</span>` : "");
  const details = set.type === "digits"
    ? [`Straight ${set.straight}`, `Box ${set.box.slice(0, 8).join(" / ")}`, `Front ${set.frontPair}`, `Back ${set.backPair}`, `Sum ${set.sum}`, `Root ${set.root}`, set.flag]
    : [`Sum ${set.analysis.sum}`, `Odd/even ${set.analysis.oddEven}`, `Low/high ${set.analysis.lowHigh}`, `Consecutive ${set.analysis.consecutivePairs}`, `Spread ${set.analysis.spread}`];
  return `
    <article class="lottery-set-card">
      <div class="suno-copy-row"><h3>Set ${set.setNumber}</h3><span class="lottery-disclaimer">Entertainment only</span></div>
      <p class="micro">${escapeHtml(result.state)} ${escapeHtml(result.gameName)} - ${escapeHtml(result.methodLabel)} - Not a prediction.</p>
      <div class="lottery-number-row">${balls}</div>
      <div class="lottery-analysis-grid">${details.filter(Boolean).map((item) => `<span>${escapeHtml(String(item))}</span>`).join("")}</div>
      <p class="micro">${escapeHtml(result.beatSummary)}</p>
      <button type="button" data-action="copy-lottery-set" data-id="${set.id}">Copy Set</button>
    </article>
  `;
}

function renderLotteryHistory() {
  const history = getBeatLotteryHistory();
  return `
    <article class="panel">
      <div class="panel-header">
        <div><h2>Creative Signal History</h2><p class="micro">Last 100 entertainment-only snapshots.</p></div>
        <div class="button-row"><button type="button" data-action="export-lottery-history">Export History</button><button type="button" class="danger" data-action="clear-lottery-history">Clear History</button></div>
      </div>
      <div class="panel-body lottery-history-list">
        ${history.length ? history.slice(0, 12).map((item) => `<article class="beat-dna-card"><strong>${escapeHtml(item.gameName)} / ${escapeHtml(item.state)}</strong><span class="micro">${escapeHtml(item.createdAt)} - ${item.sets.length} sets - Entertainment only</span></article>`).join("") : `<p class="micro">No saved lottery snapshots yet.</p>`}
      </div>
    </article>
  `;
}

function renderSunoOutputCard(title, section, text, action) {
  return `
    <article class="suno-output-card">
      <div class="suno-copy-row">
        <h3>${escapeHtml(title)}</h3>
        <span class="micro">${text.length} chars</span>
        <button type="button" data-action="${action}">Copy</button>
      </div>
      <textarea readonly aria-label="${escapeAttr(title)}">${escapeHtml(text)}</textarea>
      <button type="button" data-action="generate-suno-prompt" data-section="${section}">Regenerate</button>
    </article>
  `;
}

function renderVideoPromptPanel() {
  const prompt = state.videoPrompt || generateVideoPromptFromBeatDNA({ save: false });
  const analysis = prompt.videoAnalysis || analyzeBeatForVideo(state.beatDNA || analyzeBeatDNA());
  const options = state.videoPromptOptions;
  const history = getVideoPromptHistory();
  const platforms = ["universal", "higgsfield", "kling", "runway-style", "luma-style", "sora-style", "veo-style"];
  const videoTypes = ["music-video", "visualizer", "product-teaser", "artist-intro", "lyric-video", "album-trailer", "social-short", "dj-promo", "performance-clip", "abstract-motion-graphic"];
  return `
    <section class="panel video-prompt-screen" aria-label="Beat to Video Prompt">
      <div class="panel-header video-prompt-hero">
        <div>
          <h2>Beat -> Video Prompt</h2>
          <p class="micro">Turn your beat, stems, pads, piano roll, and mix movement into cinematic prompts for Higgsfield, Kling, and other AI video tools.</p>
        </div>
        <div class="button-row">
          ${helpButton("video-prompt")}
          <button type="button" data-action="generate-video-prompt">Generate From Beat</button>
          <button type="button" data-action="copy-video-all">Copy All</button>
          <button type="button" data-action="open-higgsfield">Open Higgsfield</button>
          <button type="button" data-action="open-kling">Open Kling</button>
          <button type="button" data-action="export-video-prompt-json">Export Prompt JSON</button>
        </div>
      </div>
      <div class="panel-body video-prompt-grid">
        <article class="video-prompt-options">
          <h3>Video Direction</h3>
          <label class="settings-control"><span>Platform</span><select data-action="set-video-prompt-option" data-video-option="platform">${platforms.map((item) => `<option value="${item}" ${options.platform === item ? "selected" : ""}>${escapeHtml(titleCase(item))}</option>`).join("")}</select></label>
          <label class="settings-control"><span>Video type</span><select data-action="set-video-prompt-option" data-video-option="videoType">${videoTypes.map((item) => `<option value="${item}" ${options.videoType === item ? "selected" : ""}>${escapeHtml(titleCase(item.replace(/-/g, " ")))}</option>`).join("")}</select></label>
          <label class="settings-control"><span>Subject</span><input type="text" value="${escapeAttr(options.subject)}" data-action="set-video-prompt-option" data-video-option="subject" placeholder="futuristic producer, neon dancer, audio orb, cyber city, abstract waveform" /></label>
          <label class="settings-control"><span>Location</span><input type="text" value="${escapeAttr(options.location)}" data-action="set-video-prompt-option" data-video-option="location" placeholder="neon studio, rain-soaked city, cyber jungle, warehouse stage" /></label>
          <label class="settings-control"><span>Visual theme</span><input type="text" value="${escapeAttr(options.visualTheme)}" data-action="set-video-prompt-option" data-video-option="visualTheme" placeholder="dark cyber R&B, neon trap, cinematic techno, dreamlike ambient" /></label>
          <label class="settings-control"><span>Color palette</span><input type="text" value="${escapeAttr(options.colorPalette)}" data-action="set-video-prompt-option" data-video-option="colorPalette" /></label>
          <label class="settings-control"><span>Aspect ratio</span><select data-action="set-video-prompt-option" data-video-option="aspectRatio">${["16:9", "9:16", "1:1", "4:5", "21:9"].map((item) => `<option value="${item}" ${options.aspectRatio === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
          <label class="settings-control"><span>Duration</span><select data-action="set-video-prompt-option" data-video-option="duration">${["5 seconds", "10 seconds", "15 seconds", "30 seconds"].map((item) => `<option value="${item}" ${options.duration === item ? "selected" : ""}>${item}</option>`).join("")}</select></label>
          <label class="settings-control"><span>Camera style</span><select data-action="set-video-prompt-option" data-video-option="cameraStyle">${["cinematic", "handheld", "drone", "dolly", "orbit", "macro", "music-video", "commercial", "glitch"].map((item) => `<option value="${item}" ${options.cameraStyle === item ? "selected" : ""}>${escapeHtml(titleCase(item))}</option>`).join("")}</select></label>
          <label class="settings-control"><span>Motion intensity</span><select data-action="set-video-prompt-option" data-video-option="motionIntensity">${["low", "medium", "high", "match beat"].map((item) => `<option value="${item}" ${options.motionIntensity === item ? "selected" : ""}>${escapeHtml(titleCase(item))}</option>`).join("")}</select></label>
          <label class="settings-control"><span>Edit style</span><select data-action="set-video-prompt-option" data-video-option="editStyle">${["beat-synced cuts", "slow cinematic", "rapid montage", "one-shot camera move", "performance edit", "visualizer loop"].map((item) => `<option value="${item}" ${options.editStyle === item ? "selected" : ""}>${escapeHtml(titleCase(item))}</option>`).join("")}</select></label>
          <label class="settings-control"><span>Prompt detail</span><select data-action="set-video-prompt-option" data-video-option="promptDetail">${["short", "balanced", "detailed"].map((item) => `<option value="${item}" ${options.promptDetail === item ? "selected" : ""}>${escapeHtml(titleCase(item))}</option>`).join("")}</select></label>
          <label class="settings-control settings-toggle"><input type="checkbox" ${options.imageToVideoMode ? "checked" : ""} data-action="set-video-prompt-option" data-video-option="imageToVideoMode" /><span>Image-to-video mode</span></label>
          <label class="settings-control settings-toggle"><input type="checkbox" ${options.includeLyricsOnScreen ? "checked" : ""} data-action="set-video-prompt-option" data-video-option="includeLyricsOnScreen" /><span>Include lyrics on screen</span></label>
          <label class="settings-control settings-toggle"><input type="checkbox" ${options.includeProductShot ? "checked" : ""} data-action="set-video-prompt-option" data-video-option="includeProductShot" /><span>Include product shot</span></label>
          <label class="settings-control settings-toggle"><input type="checkbox" ${options.safetyMode ? "checked" : ""} data-action="set-video-prompt-option" data-video-option="safetyMode" /><span>Safety mode</span></label>
        </article>
        <article class="video-beat-dna">
          <h3>Beat DNA Tags</h3>
          ${["bpm", "genreGuess", "energy", "mood", "groove", "density"].map((key) => `<span class="video-dna-chip">${escapeHtml(titleCase(key.replace(/([A-Z])/g, " $1").toLowerCase()))}: ${escapeHtml(String(analysis[key] || analysis.beatDNA?.[key] || ""))}</span>`).join("")}
          <span class="video-dna-chip">${analysis.activePads} active pads</span>
          <span class="video-dna-chip">${analysis.activeStems} active stems</span>
          ${analysis.effects.slice(0, 6).map((effect) => `<span class="video-dna-chip">${escapeHtml(effect)}</span>`).join("")}
          ${prompt.warnings.length ? `<p class="video-warning-note">${escapeHtml(prompt.warnings.join(" "))}</p>` : ""}
        </article>
        ${renderVideoOutputCard("Universal Video Prompt", "universal", prompt.universalPrompt, "copy-video-universal")}
        ${renderVideoOutputCard("Higgsfield-Ready Prompt", "higgsfield", prompt.higgsfieldPrompt, "copy-video-higgsfield")}
        ${renderVideoOutputCard("Kling-Ready Prompt", "kling", prompt.klingPrompt, "copy-video-kling")}
        ${renderVideoOutputCard("Image-to-Video Prompt", "image-to-video", prompt.imageToVideoPrompt, "copy-video-image-to-video")}
        ${renderVideoOutputCard("Shot List / Storyboard", "shot-list", prompt.shotList, "copy-video-shot-list")}
        ${renderVideoOutputCard("Camera Motion Prompt", "camera", prompt.cameraMotionPrompt, "copy-video-camera")}
        ${renderVideoOutputCard("Beat-Synced Edit Prompt", "edit", prompt.editPrompt, "copy-video-edit")}
        ${renderVideoOutputCard("Negative Prompt", "negative", prompt.negativePrompt, "copy-video-negative")}
        <article class="video-output-card">
          <h3>Recent Video Prompts</h3>
          <div class="video-copy-row"><button type="button" data-action="clear-video-prompt-history" class="danger">Clear History</button></div>
          <div class="video-history-list">
            ${history.length ? history.map((item) => `<article class="video-shot-card"><strong>${escapeHtml(item.projectName || "Untitled")}</strong><span class="micro">${escapeHtml(item.platform)} / ${escapeHtml(item.videoType)} / ${item.bpm} BPM</span></article>`).join("") : `<p class="micro">No video prompt snapshots yet.</p>`}
          </div>
        </article>
      </div>
      <footer class="video-warning-note">Prompts are generated locally. Avoid copyrighted characters, third-party logos, celebrity likenesses, protected voices, and living artist style imitation unless you have rights or permission.</footer>
    </section>
  `;
}

function renderVideoOutputCard(title, section, text, action) {
  return `
    <article class="video-output-card ${section === "negative" ? "video-negative-card" : ""}">
      <div class="video-copy-row">
        <h3>${escapeHtml(title)}</h3>
        <span class="micro">${text.length} chars</span>
        <button type="button" data-action="${action}">Copy</button>
      </div>
      <textarea readonly aria-label="${escapeAttr(title)}">${escapeHtml(text)}</textarea>
      <button type="button" data-action="generate-video-prompt" data-section="${escapeAttr(section)}">Regenerate</button>
    </article>
  `;
}

function renderHelpCenter() {
  const topics = ["quick-start", "transport", "stem-mixer", "stem-editor", "dj-decks", "pads", "keyboard", "sequencer", "sampler", "recorder", "suno-prompt", "video-prompt", "video-platforms", "video-safety", "files", "settings", "song-editor", "pattern-editor", "piano-roll", "mixer", "automation", "plugins", "midi", "standards"];
  return `
    <section class="panel" aria-label="Help center">
      <div class="panel-header">
        <div>
          <h2>Help</h2>
          <p class="micro">Quick guides for every production module.</p>
        </div>
      </div>
      <div class="panel-body plugin-grid">
        ${topics.map((topic) => {
          const help = renderHelpTopic(topic);
          return `<article class="plugin-card"><strong>${escapeHtml(help.title)}</strong><p>${escapeHtml(help.summary)}</p><button type="button" data-action="open-help-topic" data-help-topic="${topic}">Open Guide</button></article>`;
        }).join("")}
      </div>
    </section>
  `;
}

function renderHelpPanel() {
  return renderHelpCenter();
}

function helpButton(topic) {
  return renderHelpButton(topic);
}

function renderHelpDialog() {
  const topic = state.activeHelpTopic || state.helpTopic;
  if (!topic) return "";
  const help = renderHelpTopic(topic);
  return `
    <div class="help-backdrop" role="presentation" data-action="close-help">
      <section class="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <div class="panel-header">
          <div>
            <h2 id="help-title">${escapeHtml(help.title)}</h2>
            <p class="micro">${escapeHtml(help.summary)}</p>
          </div>
          <button type="button" data-action="close-help">Close</button>
        </div>
        <div class="panel-body">
          <ul class="help-list">
            ${help.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
          </ul>
          ${help.tip ? `<p class="help-tip"><strong>Pro tip:</strong> ${escapeHtml(help.tip)}</p>` : ""}
          <button type="button" data-action="set-view" data-view="${escapeAttr(help.route)}">Open ${escapeHtml(titleCase(help.route))}</button>
        </div>
      </section>
    </div>
  `;
}

function renderHelpButton(topic, label = "?") {
  return `<button type="button" class="help-dot" data-action="open-help-topic" data-help-topic="${topic}" aria-label="Help: ${topic}">${label}</button>`;
}

function renderHelpTopic(topic) {
  const help = HELP_TOPICS[topic] || getHelpTopic(topic);
  return {
    title: help.title,
    summary: help.copy || help.summary,
    steps: help.steps || [],
    tip: help.tip || "",
    route: help.route || "help"
  };
}

function getDefaultSettings() {
  return {
    audio: { masterVolume: 0.85, limiterEnabled: true, autoGain: true, metronomeEnabled: false, metronomeVolume: 0.35, countIn: false, defaultBpm: 120, latencyMode: "balanced" },
    performance: { touchSensitivity: 1, velocityMode: "hybrid", aftertouchEnabled: true, hapticsEnabled: true, padGlowEnabled: true, keyGlowEnabled: true, multiTouchEnabled: true, noteRepeatDefault: "off", keyboardBendEnabled: true, keyboardAftertouchTarget: "filter" },
    pads: { defaultMode: "one-shot", defaultBank: "A", chokeGroupsEnabled: true, quantizeRecording: true, recordVelocity: true, showVelocityMeters: true, padLabels: true },
    stems: { defaultLoop: false, soloMode: "exclusive", waveformDetail: "balanced", autoAnalyzeOnLoad: true, autoTrimSilence: false, showSpectrum: true, showVuMeters: true, preserveOriginalBuffers: true },
    decks: { crossfaderCurve: "smooth", platterAnimation: true, beatGridVisible: true, hotCuesVisible: true, syncPlaceholderVisible: true, deckWaveformMode: "colored" },
    sequencer: { defaultSteps: 64, swing: 0, humanize: 0, followPlayhead: true, stepVelocityVisible: true, autoScroll: true },
    sampler: { snapTrimToZeroCrossing: true, previewOnTrim: false, normalizeAfterTruncate: false, sliceMode: "transient-placeholder" },
    visuals: { theme: "neon-cyber", motionEnabled: true, reducedMotion: false, meterIntensity: 1, glowIntensity: 1, backgroundAnimation: true, highContrastMode: false },
    project: { autoSave: true, autoSaveInterval: 30, confirmBeforeClear: true, savePromptHistory: true, saveRecentProjects: true },
    help: { showTooltips: true, showFirstRunGuide: true, compactHelp: false },
    daw: { defaultTrackType: "instrument", defaultClipLengthBars: 4, snapDefault: "1/16", showBarNumbers: true, followPlayhead: true, autoCreateMixerChannel: true, defaultSongLengthBars: 64 },
    pianoRoll: { defaultNoteLength: "1/8", previewNotes: true, scaleHighlight: "minor", rootNote: "C", velocityLaneVisible: true, largeTouchHandles: true },
    midi: { enabled: false, autoConnectFirstInput: false, midiThru: false, recordVelocity: true, defaultInputChannel: "all", exportType: 1 },
    plugins: { showCompatibilityPlaceholders: true, enableAnalyzers: true, defaultLimiterOnMaster: true },
    beatDNA: { includeTouchHistory: true, includeStemNames: true, includeMixerSettings: true, includeTimestamp: true, deterministicMode: false, entropyStrength: 0.5 },
    suno: { defaultVocalMode: "with vocals", avoidArtistNames: true, defaultPromptDetail: "detailed", savePromptHistory: true },
    videoPrompt: { defaultPlatform: "universal", defaultVideoType: "music-video", defaultAspectRatio: "16:9", defaultDuration: "10 seconds", defaultCameraStyle: "cinematic", defaultEditStyle: "beat-synced cuts", safetyMode: true, avoidCopyrightedCharacters: true, avoidCelebrityLikeness: true, savePromptHistory: true, includeNegativePrompt: true, includeStoryboard: true, includeImageToVideoPrompt: true },
    lottery: { defaultState: "MI", defaultGameId: "pick-3", defaultMethod: "beat-dna", defaultSetCount: 5, showResponsiblePlayNote: true, requireDisclaimerVisible: true, allowCustomGames: true, preserveLeadingZeroes: true, showBoxPermutations: true, showNumberAnalysis: true },
    pad16Level: { defaultMode: "velocity", liveOverlayDefault: true, confirmBeforeCommit: true, defaultTuneRange: [-7, 8], defaultVelocityRange: [12, 127], defaultFilterRange: [180, 12000], defaultAttackRange: [0, 800], defaultDecayRange: [60, 2400], defaultProbabilityRange: [0.05, 1], recordToSequencer: true, recordTuneToPianoRoll: true, showValueLabels: true, showReferencePad: true, hapticFeedback: true },
    waveformStudio: { defaultTool: "select", snapToZeroCrossing: true, snapToBeatGrid: true, showMiniMap: true, showContextMenu: true, waveformPeaksCache: true, autoCrossfadeOverlaps: true, defaultCrossfadeShape: "equal-power", preserveOriginalBuffers: true, confirmDestructiveEdits: true, bounceTailSeconds: 3, keyboardShortcuts: true, longPressContextMenu: true },
    openTools: { showCompatibilityRoadmap: true, showOpenSourceReferences: true, showSampleLicenseWarnings: true, showPluginBridgePlaceholders: true }
  };
}

function loadSettings() {
  try {
    return validateSettings(JSON.parse(localStorage.getItem(STORAGE.settings) || "{}"));
  } catch (error) {
    return validateSettings({});
  }
}

function saveSettings() {
  clearTimeout(saveSettings.timer);
  saveSettings.timer = setTimeout(() => {
    localStorage.setItem(STORAGE.settings, JSON.stringify(state.settings));
  }, 160);
}

function validateSettings(settings) {
  const merged = deepMerge(getDefaultSettings(), settings || {});
  merged.performance.touchSensitivity = clamp(merged.performance.touchSensitivity, 0.25, 2);
  merged.visuals.glowIntensity = clamp(merged.visuals.glowIntensity, 0, 2);
  merged.visuals.meterIntensity = clamp(merged.visuals.meterIntensity, 0, 2);
  merged.audio.masterVolume = clamp(merged.audio.masterVolume, 0, 1);
  merged.audio.defaultBpm = clamp(merged.audio.defaultBpm, 40, 240);
  merged.pad16Level.defaultVelocityRange = Array.isArray(merged.pad16Level.defaultVelocityRange) ? merged.pad16Level.defaultVelocityRange : [12, 127];
  merged.pad16Level.defaultTuneRange = Array.isArray(merged.pad16Level.defaultTuneRange) ? merged.pad16Level.defaultTuneRange : [-7, 8];
  merged.waveformStudio.bounceTailSeconds = clamp(Number(merged.waveformStudio.bounceTailSeconds) || 3, 0, 30);
  merged.padSensitivity = merged.performance.touchSensitivity;
  merged.keySensitivity = merged.performance.touchSensitivity;
  merged.visualIntensity = merged.visuals.glowIntensity;
  merged.waveformDetail = merged.stems.waveformDetail === "detailed" ? 2 : merged.stems.waveformDetail === "light" ? 0.5 : 1;
  merged.autosave = merged.project.autoSave;
  merged.stickyTransport = true;
  return merged;
}

function deepMerge(base, override) {
  const output = Array.isArray(base) ? [...base] : { ...base };
  Object.entries(override || {}).forEach(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value) && base[key] && typeof base[key] === "object") output[key] = deepMerge(base[key], value);
    else output[key] = value;
  });
  return output;
}

function updateSetting(path, value) {
  if (!path) return;
  const parts = path.split(".");
  let target = state.settings;
  for (let index = 0; index < parts.length - 1; index += 1) {
    target[parts[index]] ||= {};
    target = target[parts[index]];
  }
  target[parts.at(-1)] = value;
  state.settings = validateSettings(state.settings);
  saveSettings();
  applySettingsToAudioEngine();
  applySettingsToVisuals();
  applySettingsToPerformance();
}

function readSettingControlValue(control) {
  if (control.type === "checkbox") return control.checked;
  if (control.type === "number" || control.type === "range") return Number(control.value);
  if (/^(16|32|64|128)$/.test(control.value)) return Number(control.value);
  return control.value;
}

function readControlValue(control) {
  if (control.type === "checkbox") return control.checked;
  if (control.type === "number" || control.type === "range") return Number(control.value);
  return control.value;
}

function resetSettings() {
  state.settings = validateSettings(getDefaultSettings());
  saveSettings();
  applySettingsToAudioEngine();
  applySettingsToVisuals();
  toast("Settings reset.");
  render();
}

function applySettingsToAudioEngine() {
  state.master.volume = state.settings.audio.masterVolume;
  state.master.limiter = state.settings.audio.limiterEnabled;
  state.metronome = state.settings.audio.metronomeEnabled;
  state.bpm = state.settings.audio.defaultBpm;
  if (masterGain) masterGain.gain.value = state.master.volume;
}

function applySettingsToVisuals() {
  const root = document.documentElement;
  const themes = {
    "neon-cyber": { bg: "#020813", panel: "rgba(6, 20, 38, 0.82)", accent: "#29f7ff", accent2: "#ff4fd8", gold: "#ffe071" },
    "deep-space": { bg: "#050713", panel: "rgba(12, 15, 35, 0.86)", accent: "#7cf7ff", accent2: "#8a5cff", gold: "#d7ff5e" },
    "gold-console": { bg: "#090806", panel: "rgba(28, 21, 10, 0.86)", accent: "#37ffcf", accent2: "#ff4fd8", gold: "#ffcf4a" },
    "midnight-glass": { bg: "#02050a", panel: "rgba(8, 13, 24, 0.9)", accent: "#54d5ff", accent2: "#b36bff", gold: "#ffe071" },
    "high-contrast": { bg: "#000000", panel: "rgba(0, 0, 0, 0.94)", accent: "#00ffff", accent2: "#ff40ff", gold: "#ffff66" }
  };
  const theme = themes[state.settings.visuals.theme] || themes["neon-cyber"];
  root.style.setProperty("--lm-glow-intensity", String(state.settings.visuals.glowIntensity));
  root.style.setProperty("--lm-meter-intensity", String(state.settings.visuals.meterIntensity));
  root.style.setProperty("--lm-motion", state.settings.visuals.motionEnabled && !state.settings.visuals.reducedMotion ? "1" : "0");
  root.style.setProperty("--lm-touch-sensitivity", String(state.settings.performance.touchSensitivity));
  root.style.setProperty("--lm-theme-bg", theme.bg);
  root.style.setProperty("--lm-theme-panel", theme.panel);
  root.style.setProperty("--lm-theme-accent", theme.accent);
  root.style.setProperty("--lm-theme-accent-2", theme.accent2);
  root.style.setProperty("--lm-theme-gold", theme.gold);
  root.style.setProperty("--bg", theme.bg);
  root.style.setProperty("--surface", theme.panel);
  root.style.setProperty("--surface-strong", theme.panel.replace("0.82", "0.94").replace("0.86", "0.94").replace("0.9", "0.96"));
  root.style.setProperty("--cyan", theme.accent);
  root.style.setProperty("--violet", theme.accent2);
  root.style.setProperty("--gold", theme.gold);
  root.style.setProperty("--visual-intensity", String(state.settings.visuals.glowIntensity));
  root.dataset.theme = state.settings.visuals.theme;
  root.classList.toggle("high-contrast", state.settings.visuals.highContrastMode);
}

function applySettingsToPerformance() {
  state.noteRepeat = state.settings.performance.noteRepeatDefault;
}

function exportSettings() {
  exportJson("lottominded-ultra-settings.json", state.settings);
}

async function importSettings(file) {
  try {
    state.settings = validateSettings(JSON.parse(await file.text()));
    saveSettings();
    applySettingsToAudioEngine();
    applySettingsToVisuals();
    applySettingsToPerformance();
    render();
    toast("Settings imported.");
  } catch (error) {
    toast("Could not import settings JSON.");
  }
}

function openHelp(topic) {
  state.activeHelpTopic = topic;
  state.helpTopic = topic;
  state.helpOpen = true;
  render();
}

function closeHelp() {
  state.activeHelpTopic = null;
  state.helpTopic = "";
  state.helpOpen = false;
  render();
}

function renderFirstRunGuide() {
  if (!state.settings.help.showFirstRunGuide || localStorage.getItem(STORAGE.helpProgress) === "complete") return "";
  const steps = ["Welcome to LottoMind Stem Studio", "Load a demo or stem file", "Touch the pads", "Mix stems with mute/solo", "Try DJ Decks", "Generate a Suno prompt", "Save/export project"];
  const step = Math.min(state.firstRunGuideStep, steps.length - 1);
  return `<div class="first-run-guide"><section class="first-run-card"><h2>${escapeHtml(steps[step])}</h2><p class="micro">Step ${step + 1} of ${steps.length}</p><div class="button-row"><button type="button" data-action="next-guide-step">Next</button><button type="button" data-action="complete-guide">Skip</button><button type="button" data-action="complete-guide">Finish</button></div></section></div>`;
}

function nextGuideStep() {
  state.firstRunGuideStep += 1;
  localStorage.setItem(STORAGE.helpProgress, String(state.firstRunGuideStep));
  if (state.firstRunGuideStep >= 7) completeGuide();
  else render();
}

function completeGuide() {
  localStorage.setItem(STORAGE.helpProgress, "complete");
  state.firstRunGuideStep = 7;
  render();
}

function getHelpTopic(topic) {
  const topics = {
    stems: ["Stem Mixing Console", "Load, trim, mix, solo, mute, and export stem metadata.", ["Use Load Audio on a channel to decode a local file in the browser.", "Start plays only the selected channel trim region; Restart begins from the trim start.", "Mute silences a channel; Solo silences all non-solo channels while any solo is active.", "Volume, pan, EQ, filter, delay send, and reverb send are saved with the project."]],
    editor: ["Stem Editor", "Make destructive local edits to the selected stem buffer.", ["Set trim start and trim end, then Preview Trim before committing.", "Truncate replaces the buffer with the selected region.", "Normalize, Reverse, Fade In, and Fade Out process the audio locally.", "Slice To Pads maps the selected region across the 16 performance pads."]],
    decks: ["DJ Decks", "Load two local files and perform with cue points, pitch, EQ, filter, and crossfader.", ["Load Track accepts local browser-supported audio files.", "Set Cue stores the current playhead; Cue jumps back to it.", "Hot cues save or trigger four deck positions.", "Crossfader blends Deck A and Deck B output."]],
    pads: ["Touch Pads", "Velocity and aftertouch-style response for touchscreens, pointer devices, and keyboard shortcuts.", ["Hit higher on a pad for stronger velocity; pressure-enabled devices use actual pressure.", "Hold pads to keep loop samples active; release to stop loop pads.", "Move your finger while holding to change aftertouch brightness and sample filter.", "Keyboard shortcuts are 1 2 3 4, Q W E R, A S D F, Z X C V."]],
    sequencer: ["Sequencer", "Program 16 or 64 step patterns for the pad grid.", ["Tap steps to toggle them on or off.", "Pad Record writes pad hits into the current playhead step.", "Random Groove creates a starter rhythm, then Humanize loosens timing.", "Swing shifts the feel of repeated steps while preserving the grid."]],
    sampler: ["Sampler", "Load, record, edit, and assign a sample to pads.", ["Load Sample decodes a local audio file.", "Record Mic Sample uses browser microphone permission.", "Trim, Truncate, Reverse, Normalize, and Slice To Pads process audio locally.", "Assign To Pad sends the sampler buffer to the selected pad."]],
    keyboard: ["Keyboard Synth", "Touch-reactive synth keys with release behavior.", ["Press or touch a key to start a note; release to fade it out.", "Move vertically while holding to shape volume and brightness.", "Choose sine, triangle, sawtooth, or square wave.", "Octave and Volume controls are saved in the project state."]],
    recorder: ["Recorder", "Capture mic or line input when the browser permits it.", ["Refresh Inputs lists available audio input devices.", "Monitor Input routes the mic into the studio output.", "Start Recording captures a local recording; nothing is uploaded.", "Assign recordings to the selected stem or selected pad."]],
    files: ["Project Files", "Save locally, export maps, import metadata, and manage project data.", ["Save Project stores large audio buffers in IndexedDB.", "Export Project JSON exports metadata without huge embedded audio.", "Import Project JSON restores settings and maps, then you can reload audio if needed.", "Export Stem Map creates a clean channel metadata file."]],
    settings: ["Settings", "Control performance response and app behavior.", ["Pad sensitivity scales touch pressure and pointer-position velocity.", "Keyboard sensitivity scales touch-reactive synth key velocity.", "Visual intensity changes pad/key glow strength.", "Install App uses the browser PWA flow when available."]]
    ,
    mixer: ["Mixer", "Create flexible browser mixer channels and effect chains.", ["Add Mixer Channel creates another strip without a hard-coded limit.", "Add Effect Slot appends the next enabled browser effect to the latest strip.", "Stem channel audio still uses the main stem mixer controls.", "Native desktop effect standards are documented in Plugins as future host hooks."]],
    song: ["Song Editor", "Arrange patterns, samples, melodies, stems, and automation into a full track.", ["Use Add Track for more lanes in the arrangement.", "Use Add Clip to place pattern blocks on the timeline.", "Bars changes the timeline length.", "This is inspired by DAW song editors while staying browser-native."]],
    patterns: ["Pattern Editor", "Build beat and melody pattern blocks.", ["Generate Beat creates a starter pattern.", "Use 16 or 64 steps for short loops or longer ideas.", "Export MIDI turns Piano Roll notes into a standard MIDI file.", "Patterns can be arranged as clips in the Song Editor."]],
    piano: ["Piano Roll", "Touch-edit notes for melodies and chords.", ["Tap a cell to add or remove a note.", "Rows are pitches; columns are timing steps.", "Imported MIDI notes are mapped into the visible grid.", "Export MIDI writes a standard single-track MIDI file."]],
    automation: ["Automation", "Draw computer-controlled parameter changes.", ["Each lane targets a mix or instrument parameter.", "Add Point creates a control point in the lane.", "Randomize sketches motion quickly.", "Automation data is saved in project JSON."]],
    plugins: ["Plugins and Standards", "Browser-native instruments/effects with compatibility hooks.", ["Built-in plugins use Web Audio and do not require installs.", "MIDI import/export is supported in the static app.", "SoundFont2, VST2, LADSPA, LV2, and GUS patches require a desktop host or future local bridge.", "No native plugin binaries are loaded from GitHub Pages."]]
  };
  const fallback = topics[topic] || topics.settings;
  return { title: fallback[0], summary: fallback[1], steps: fallback[2] };
}

function rangeControl(label, scope, prop, value, min, max, step, id) {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  const safeMax = Math.max(Number(max) || 0, Number(min) || 0);
  return `
    <label class="field">
      <span>${escapeHtml(label)} <span class="micro">${formatControlValue(safeValue)}</span></span>
      <input type="range" min="${min}" max="${safeMax}" step="${step}" value="${safeValue}" data-range="${scope}" data-prop="${prop}" data-id="${id}" aria-label="${escapeAttr(label)}" />
    </label>
  `;
}

function getTimingDivisions() {
  return ["1/4", "1/4T", "1/8", "1/8T", "1/16", "1/16T", "1/32", "1/32T", "1/64", "1/64T"];
}

function formatTimingDivision(division) {
  return String(division || "1/16").replace("T", " triplet");
}

function getDivisionBeatLength(division = "1/16") {
  const match = String(division).match(/^1\/(\d+)(T)?$/i);
  if (!match) return 0.25;
  const denominator = Math.max(1, Number(match[1]));
  const base = 4 / denominator;
  return match[2] ? base * (2 / 3) : base;
}

function getDivisionMs(division = state.transport.timingDivision) {
  return (60000 / Math.max(1, state.bpm)) * getDivisionBeatLength(division);
}

async function handleAction(action, target) {
  const id = target.dataset.id;
  const noAudioActions = new Set(["set-view", "toggle-top-shell-mode", "set-top-shell-mode", "set-top-shell-height", "set-sequencer-size"]);
  if (!noAudioActions.has(action)) await ensureAudio();
  switch (action) {
    case "set-view":
      state.view = target.dataset.view;
      state.settingsOpen = state.view === "settings";
      state.helpOpen = state.view === "help";
      render();
      break;
    case "toggle-top-shell-mode":
      toggleTopShellMode();
      break;
    case "set-top-shell-mode":
      setTopShellMode(target.dataset.mode || target.value);
      break;
    case "set-top-shell-height":
      setTopShellHeight(target.value);
      break;
    case "set-sequencer-size":
      state.ui.sequencer.size = target.dataset.size === "expanded" ? "expanded" : "compact";
      saveSequencerLayout();
      render();
      break;
    case "open-settings":
      state.view = "settings";
      state.settingsOpen = true;
      render();
      break;
    case "close-settings":
      state.settingsOpen = false;
      state.view = "studio";
      render();
      break;
    case "open-help":
      state.view = "help";
      state.helpOpen = true;
      render();
      break;
    case "open-help-topic":
      openHelp(target.dataset.helpTopic || target.dataset.topic || "quick-start");
      break;
    case "show-help":
      openHelp(target.dataset.topic || "settings");
      break;
    case "close-help":
      closeHelp();
      break;
    case "close-help-topic":
      closeHelp();
      break;
    case "set-setting":
      updateSetting(target.dataset.settingPath, readSettingControlValue(target));
      break;
    case "export-settings":
      exportSettings();
      break;
    case "import-settings":
      break;
    case "restart-guide":
      state.firstRunGuideStep = 0;
      localStorage.removeItem(STORAGE.helpProgress);
      render();
      break;
    case "next-guide-step":
      nextGuideStep();
      break;
    case "complete-guide":
      completeGuide();
      break;
    case "play-all":
      await playAll();
      break;
    case "pause-all":
      pauseAll();
      break;
    case "restart-all":
      await restartAll();
      break;
    case "stop-all":
      stopAll();
      break;
    case "toggle-transport-loop":
      toggleTransportLoop();
      break;
    case "toggle-loop-all":
      toggleLoopAll();
      break;
    case "toggle-sequencer-play":
      if (state.sequencer.playing) pauseSequencer();
      else startSequencer(false);
      break;
    case "toggle-follow-sequencer":
      state.transport.followSequencer = !state.transport.followSequencer;
      toast(state.transport.followSequencer ? "Sequencer will start with Play All." : "Sequencer is manually controlled.");
      queueRender();
      break;
    case "record-mix":
      await toggleMixRecording();
      break;
    case "toggle-metronome":
      state.metronome = !state.metronome;
      toast(state.metronome ? "Metronome enabled." : "Metronome disabled.");
      queueRender();
      break;
    case "toggle-setting":
      toggleSetting(target.dataset.setting);
      break;
    case "toggle-master-limiter":
      state.master.limiter = !state.master.limiter;
      toast(`Master limiter ${state.master.limiter ? "enabled" : "bypassed"}.`);
      queueRender();
      break;
    case "reset-settings":
      resetSettings();
      break;
    case "install-app":
      await installApp();
      break;
    case "select-stem":
      state.selectedStemId = id;
      state.view = state.view === "studio" ? "stems" : state.view;
      render();
      break;
    case "start-channel":
      startChannel(id);
      break;
    case "stop-channel":
      stopChannel(id);
      break;
    case "restart-channel":
      stopChannel(id);
      startChannel(id, 0);
      break;
    case "toggle-mute":
      toggleMute(id);
      break;
    case "toggle-solo":
      toggleSolo(id);
      break;
    case "toggle-arm":
      updateStem(id, { armed: !getStem(id).armed });
      break;
    case "toggle-loop":
      updateStem(id, { loop: !getStem(id).loop });
      break;
    case "truncate-stem":
      truncateStem(id);
      break;
    case "normalize-stem":
      normalizeStem(id);
      break;
    case "reverse-stem":
      reverseStem(id);
      break;
    case "fade-stem":
      fadeStem(id, target.dataset.type);
      break;
    case "preview-selected-trim":
      if (getSelectedStem()) startChannel(getSelectedStem().id, 0, true);
      break;
    case "slice-stem-to-pads":
      sliceStemToPads();
      break;
    case "export-edited-wav":
      exportSelectedStemWav();
      break;
    case "export-stem-metadata":
      exportJson(`${getStem(id).name}-metadata.json`, stemMetadata(getStem(id)));
      break;
    case "export-stem-map":
      exportStemMap();
      break;
    case "clear-stem":
      clearStem(id);
      break;
    case "toggle-deck":
      toggleDeck(id);
      break;
    case "play-both-decks":
      await playBothDecks();
      break;
    case "pause-both-decks":
      pauseBothDecks();
      break;
    case "stop-both-decks":
      stopBothDecks();
      break;
    case "stop-deck":
      stopDeck(id);
      break;
    case "cue-deck":
      cueDeck(id);
      break;
    case "set-cue":
      setCue(id);
      break;
    case "hot-cue":
      hotCue(id, Number(target.dataset.index));
      break;
    case "loop-in":
      setDeckLoopPoint(id, "in");
      break;
    case "loop-out":
      setDeckLoopPoint(id, "out");
      break;
    case "toggle-deck-loop":
      toggleDeckLoop(id);
      break;
    case "pitch-bend":
      pitchBend(id, Number(target.dataset.dir));
      break;
    case "sync-placeholder":
      toast("Sync is a transport hook for a future tempo grid. Set BPM and pitch manually for now.");
      break;
    case "deck-stem-lane":
      toast(`${target.dataset.lane} lane requires separate loaded stems assigned to this deck.`);
      break;
    case "cue-mix-placeholder":
      toast("Cue mix monitoring depends on browser/device output routing and is marked as a future hook.");
      break;
    case "automix-placeholder":
      toast("Automix is coming soon as a local project automation hook.");
      break;
    case "pad-bank":
      switchPadBank(target.dataset.bank);
      break;
    case "trigger-pad":
      triggerPad(Number(target.dataset.index), pointerVelocity(window.lastPointerEvent));
      break;
    case "toggle-16-level":
      if (state.pad16Level.enabled) disable16LevelMode();
      else enable16LevelMode(state.selectedPadIndex, state.pad16Level.mode);
      break;
    case "set-16-level-source":
      set16LevelSourcePad(Number(target.value ?? target.dataset.index));
      break;
    case "set-16-level-mode":
      set16LevelMode(target.dataset.mode || target.value);
      break;
    case "set-16-level-option":
      set16LevelOption(target.dataset.path, target.type === "checkbox" ? target.checked : target.value, target.type);
      break;
    case "reset-16-level":
      reset16LevelSettings();
      break;
    case "commit-16-level-bank":
      commit16LevelToBank(state.pad16Level.commitTargetBank);
      break;
    case "preview-16-level-pad":
      if (!state.pad16Level.enabled) enable16LevelMode(state.pad16Level.sourcePadIndex, state.pad16Level.mode);
      trigger16LevelPad(Number(target.dataset.index), window.lastPointerEvent, pointerVelocity(window.lastPointerEvent));
      break;
    case "send-16-level-slices-to-bank":
      if (state.pad16Level.mode !== "slice") {
        toast("Switch 16-Level to Slice before sending slices to a bank.");
        break;
      }
      commit16LevelToBank(state.pad16Level.commitTargetBank);
      toast("Slices sent to pad bank.");
      break;
    case "open-16-level-help":
      openHelp("16-level-pads");
      break;
    case "learn-key-map":
      startKeyboardMappingLearn(target.dataset.mapType, target.dataset.mapId);
      break;
    case "clear-key-map":
      clearKeyboardMapping(target.dataset.mapType, target.dataset.mapId);
      break;
    case "reset-key-mappings":
      resetKeyboardMappings();
      break;
    case "select-next-pad":
      state.selectedPadIndex = (state.selectedPadIndex + 1) % state.pads.length;
      render();
      break;
    case "select-kit":
      selectKit(Number(target.dataset.index));
      break;
    case "load-factory-kit":
      loadFactoryKit(Number(target.dataset.index));
      break;
    case "add-song-track":
      addSongTrack();
      break;
    case "add-song-clip":
      addSongClip();
      break;
    case "set-song-submode":
      state.song.subMode = target.dataset.mode || "arrangement";
      render();
      break;
    case "play-waveform-selection":
      await playWaveformSelection(false);
      break;
    case "play-waveform-from-cursor":
      await playWaveformFromCursor();
      break;
    case "loop-waveform-preview":
      await playWaveformSelection(true);
      break;
    case "stop-waveform-preview":
      stopWaveformPreview();
      break;
    case "set-waveform-source":
      state.waveformStudio.source = target.value || "selected-stem";
      state.waveformStudio.fileInfo = analyzeAudioFileMetadata(null, getWaveformStudioBuffer());
      render();
      break;
    case "set-waveform-tool":
      state.waveformStudio.tool = target.dataset.tool || "select";
      toast(`${titleCase(state.waveformStudio.tool)} tool active.`);
      queueRender();
      break;
    case "select-waveform-region":
      {
        const region = state.waveformStudio.regions.find((item) => item.id === target.dataset.id);
        if (region) state.waveformStudio.selection = { startTime: region.startTime, endTime: region.endTime };
        drawAllCanvases();
      }
      break;
    case "clear-waveform-selection":
      state.waveformStudio.selection = { startTime: 0, endTime: 0.25 };
      render();
      break;
    case "cut-waveform-selection":
      cutWaveformSelection();
      break;
    case "copy-waveform-selection":
      copyWaveformSelection();
      break;
    case "paste-waveform-selection":
      pasteWaveformSelection();
      break;
    case "delete-waveform-selection":
      deleteWaveformSelection();
      break;
    case "trim-waveform-selection":
    case "crop-waveform-selection":
      trimWaveformSelection();
      break;
    case "split-waveform-at-playhead":
      splitWaveformAtPlayhead();
      break;
    case "split-waveform-at-transients":
      splitWaveformAtTransients();
      break;
    case "silence-waveform-selection":
      silenceWaveformSelection();
      break;
    case "insert-silence":
      insertSilence();
      break;
    case "fade-waveform-selection":
      fadeWaveformSelection(target.dataset.fade || "in");
      break;
    case "reverse-waveform-selection":
      reverseWaveformSelection();
      break;
    case "normalize-waveform-selection":
      normalizeWaveformSelectionAudio();
      break;
    case "loop-waveform-selection":
      loopWaveformSelection();
      break;
    case "export-waveform-selection":
      exportWaveformRegion(state.waveformStudio.regions.at(-1)?.id);
      break;
    case "zoom-waveform-in":
      zoomWaveform(1);
      break;
    case "zoom-waveform-out":
      zoomWaveform(-1);
      break;
    case "zoom-waveform-to-selection":
      {
        const selection = normalizeWaveformSelection();
        state.waveformStudio.viewport = { startTime: selection.startTime, endTime: selection.endTime, zoom: 8 };
        drawAllCanvases();
      }
      break;
    case "fit-waveform-to-screen":
      fitWaveformToScreen();
      break;
    case "add-waveform-marker":
      addWaveformMarker();
      break;
    case "add-waveform-region":
      addWaveformRegion();
      break;
    case "auto-crossfade-overlaps":
      crossfadeOverlappingClips();
      break;
    case "create-crossfade":
      createClipOverlapFade("clip-a", "clip-b");
      break;
    case "bounce-project":
      bounceProjectToWav();
      break;
    case "bounce-track":
      bounceTrackToBuffer(target.dataset.id);
      toast("Track bounce prepared as a local buffer.");
      queueRender();
      break;
    case "bounce-selection":
      bounceSelectionToStem();
      break;
    case "bounce-project-to-master":
      bounceProjectToMasterChain();
      break;
    case "bounce-stems":
      bounceProjectToStemFiles();
      break;
    case "freeze-track":
      toast("Track freeze rendered as a roadmap hook for clip effect commits.");
      break;
    case "unfreeze-track":
      toast("Track unfreeze restored to editable clip mode.");
      break;
    case "arm-record-track":
      armAudioTrack(id);
      break;
    case "disarm-record-track":
      disarmAudioTrack(id);
      break;
    case "start-armed-recording":
      startArmedTrackRecording();
      break;
    case "pause-armed-recording":
      pauseArmedTrackRecording();
      break;
    case "stop-armed-recording":
      stopArmedTrackRecording();
      break;
    case "monitor-recording-input":
      state.waveformStudio.recording.monitoring = !state.waveformStudio.recording.monitoring;
      render();
      break;
    case "comp-recording-takes":
      compRecordingTakes();
      break;
    case "open-song-context-menu":
      showSongEditorContextMenu(Number(target.dataset.x) || 24, Number(target.dataset.y) || 180, {});
      break;
    case "close-song-context-menu":
      hideSongEditorContextMenu();
      break;
    case "run-context-action":
      runSongContextAction(target.dataset.contextAction);
      break;
    case "apply-quick-effect":
      applyQuickEffectToSelection(target.dataset.effect);
      break;
    case "commit-effect-preview":
      commitEffectPreview();
      break;
    case "cancel-effect-preview":
      cancelEffectPreview();
      break;
    case "export-metadata-json":
      exportMetadataJson();
      break;
    case "open-tool-lab":
    case "show-plugin-roadmap":
    case "show-sample-license-guide":
      state.view = "open tools";
      render();
      break;
    case "export-compatibility-report":
      exportJson("lottominded-ultra-open-tool-compatibility.json", { generatedAt: new Date().toISOString(), openTools: state.openTools, settings: state.settings.openTools });
      break;
    case "add-adaptive-scene":
      createSceneSection();
      render();
      break;
    case "delete-adaptive-scene":
      state.adaptiveArrangement.scenes = state.adaptiveArrangement.scenes.filter((scene) => scene.id !== id);
      render();
      break;
    case "add-transition-rule":
      createTransitionRule();
      render();
      break;
    case "preview-adaptive-arrangement":
      previewAdaptiveArrangement();
      break;
    case "export-adaptive-json":
      exportAdaptiveArrangementJson();
      break;
    case "select-song-clip":
      toast("Song clips are arrangement blocks. Use Add Clip to keep sketching sections.");
      break;
    case "toggle-piano-note":
      togglePianoNote(Number(target.dataset.note), Number(target.dataset.step));
      break;
    case "clear-piano-roll":
      state.pianoRoll.notes = [];
      render();
      break;
    case "export-midi":
      exportMidi();
      break;
    case "add-automation-lane":
      addAutomationLane();
      break;
    case "randomize-automation":
      randomizeAutomation();
      break;
    case "add-automation-point":
      addAutomationPoint(id);
      break;
    case "clear-automation-lane":
      clearAutomationLane(id);
      break;
    case "toggle-plugin":
      togglePlugin(id);
      break;
    case "add-mixer-channel":
      addMixerChannel();
      break;
    case "add-mixer-effect":
      addMixerEffect();
      break;
    case "soundfont-placeholder":
      toast("SoundFont2 is marked as a future local-instrument hook. This static build uses browser synths and sample imports.");
      break;
    case "native-plugin-placeholder":
      toast("Native VST2, LADSPA, and LV2 binaries need a desktop plugin host. Static GitHub Pages cannot safely load them.");
      break;
    case "request-midi":
      requestMidiAccess();
      break;
    case "refresh-midi":
      refreshMidiDevices();
      break;
    case "select-midi-input":
      state.daw.midi.selectedInputId = id;
      bindMidiInput(id);
      render();
      break;
    case "select-midi-output":
      state.daw.midi.selectedOutputId = id;
      render();
      break;
    case "toggle-midi-thru":
      state.daw.midi.thruEnabled = !state.daw.midi.thruEnabled;
      render();
      break;
    case "toggle-midi-record":
      state.daw.midi.recordEnabled = !state.daw.midi.recordEnabled;
      render();
      break;
    case "learn-midi":
      learnMidiMapping(target.dataset.target);
      break;
    case "midi-clock-placeholder":
      toast("MIDI clock is a future sync hook. Note input, CC mapping, and MIDI file import/export are available in the MVP.");
      break;
    case "set-lottery-game":
      state.beatLottery.selectedGameId = id;
      state.beatLottery.lastGenerated = null;
      render();
      break;
    case "set-lottery-state":
    case "set-lottery-method":
    case "set-lottery-count":
    case "set-lottery-option":
    case "set-custom-lottery":
      onLotteryInput({ target });
      render();
      break;
    case "analyze-beat-dna":
      analyzeBeatDNA();
      state.view = "beat dna";
      toast("Beat DNA analyzed.");
      render();
      break;
    case "copy-beat-dna":
      copyBeatDNA();
      break;
    case "export-beat-dna":
      exportBeatDNA();
      break;
    case "generate-suno-prompt":
      generateSunoPromptFromBeatDNA();
      state.view = "suno prompt";
      toast("Suno prompt generated.");
      render();
      break;
    case "set-suno-option":
      onSunoOptionInput({ target });
      render();
      break;
    case "generate-video-prompt":
      generateVideoPromptFromBeatDNA();
      state.view = "video prompt";
      toast("Video prompt generated.");
      render();
      break;
    case "set-video-prompt-option":
      onVideoPromptOptionInput({ target });
      render();
      break;
    case "generate-beat-lottery":
      generateLotteryFromBeat();
      state.view = "beat lottery";
      toast("Creative number signals generated. Not a prediction.");
      render();
      break;
    case "generate-sequencer-lottery":
      generateLotteryFromBeat();
      toast("Creative number signals generated in the sequencer panel. Not a prediction.");
      render();
      break;
    case "seed-sampler-sequencer":
      seedSamplerToSequencer();
      break;
    case "generate-beat-lottery-and-suno":
    case "generate-creative-bundle":
      generateBeatCreativeBundle();
      state.view = "beat dna";
      toast("Creative bundle generated.");
      render();
      break;
    case "copy-video-universal":
      copyVideoPrompt("universal");
      break;
    case "copy-video-higgsfield":
      copyVideoPrompt("higgsfield");
      break;
    case "copy-video-kling":
      copyVideoPrompt("kling");
      break;
    case "copy-video-image-to-video":
      copyVideoPrompt("image-to-video");
      break;
    case "copy-video-shot-list":
      copyVideoPrompt("shot-list");
      break;
    case "copy-video-camera":
      copyVideoPrompt("camera");
      break;
    case "copy-video-edit":
      copyVideoPrompt("edit");
      break;
    case "copy-video-negative":
      copyVideoPrompt("negative");
      break;
    case "copy-video-all":
      copyAllVideoPrompts();
      break;
    case "clear-video-prompt-history":
      clearVideoPromptHistory();
      break;
    case "export-video-prompt-json":
      exportVideoPromptJson();
      break;
    case "open-higgsfield":
      window.open("https://higgsfield.ai/", "_blank", "noopener,noreferrer");
      break;
    case "open-kling":
      window.open("https://kling.ai/", "_blank", "noopener,noreferrer");
      break;
    case "copy-lottery-set":
      copyLotterySet(id);
      break;
    case "copy-lottery-all":
      copyAllLotterySets();
      break;
    case "save-lottery-snapshot":
      if (state.beatLottery.lastGenerated) saveBeatLotteryHistory(state.beatLottery.lastGenerated);
      toast("Creative signal snapshot saved.");
      break;
    case "clear-lottery-history":
      clearBeatLotteryHistory();
      break;
    case "export-lottery-history":
      exportBeatLotteryHistory();
      break;
    case "save-custom-lottery-game":
      createCustomLotteryGame(state.beatLottery.customDraft || {});
      break;
    case "copy-creative-bundle":
      copyCreativeBundle();
      break;
    case "export-creative-bundle":
    case "export-creative-bundle-json":
      exportCreativeBundle();
      break;
    case "copy-suno-simple":
      copySunoPrompt("simple");
      break;
    case "copy-suno-style":
      copySunoPrompt("style");
      break;
    case "copy-suno-lyrics":
      copySunoPrompt("lyrics");
      break;
    case "copy-suno-instrumental":
      copySunoPrompt("instrumental");
      break;
    case "copy-suno-exclude":
      copySunoPrompt("exclude");
      break;
    case "copy-suno-arrangement":
      copySunoPrompt("arrangement");
      break;
    case "copy-suno-all":
      copyAllSunoPrompts();
      break;
    case "clear-suno-history":
      clearSunoPromptHistory();
      break;
    case "restore-suno-history":
      restoreSunoPromptSnapshot(id);
      break;
    case "copy-suno-prompt":
      copyAllSunoPrompts();
      break;
    case "preview-pad":
      triggerPad(Number(target.dataset.index));
      break;
    case "clear-pad":
      clearPad(Number(target.dataset.index));
      break;
    case "toggle-pad-mode":
      togglePadMode(Number(target.dataset.index));
      break;
    case "toggle-seq-record":
      state.sequencer.recording = !state.sequencer.recording;
      toast(state.sequencer.recording ? "Pad recording enabled." : "Pad recording disabled.");
      queueRender();
      break;
    case "slice-sampler-to-pads":
      sliceSamplerToPads();
      break;
    case "choke-placeholder":
      toast("Choke groups are reserved in the pad data model and can be wired to custom banks.");
      break;
    case "start-sequencer":
      startSequencer(true);
      break;
    case "pause-sequencer":
      pauseSequencer();
      break;
    case "stop-sequencer":
      stopSequencer();
      break;
    case "clear-pattern":
      clearPattern();
      break;
    case "random-groove":
      randomGroove();
      break;
    case "set-steps":
      setSequencerSteps(Number(target.dataset.steps));
      render();
      break;
    case "toggle-step":
      toggleStep(Number(target.dataset.row), Number(target.dataset.step));
      break;
    case "humanize":
      state.sequencer.humanize = Math.min(1, state.sequencer.humanize + 0.15);
      toast(`Humanize set to ${Math.round(state.sequencer.humanize * 100)}%.`);
      break;
    case "quantize":
      state.sequencer.humanize = 0;
      toast("Pattern quantized to the grid.");
      break;
    case "record-sampler":
      await toggleSampleRecording();
      break;
    case "record-tab":
      await recordTabAudio();
      break;
    case "preview-sampler":
      previewBuffer(state.sampler.buffer, state.sampler.trimStart, state.sampler.trimEnd);
      break;
    case "truncate-sampler":
      state.sampler.buffer = truncateBuffer(state.sampler.buffer, state.sampler.trimStart, state.sampler.trimEnd);
      state.sampler.trimStart = 0;
      state.sampler.trimEnd = getBufferDuration(state.sampler);
      toast("Sampler audio truncated.");
      queueRender();
      break;
    case "reverse-sampler":
      reverseBuffer(state.sampler.buffer);
      toast("Sampler audio reversed.");
      queueRender();
      break;
    case "normalize-sampler":
      normalizeBuffer(state.sampler.buffer);
      toast("Sampler audio normalized.");
      queueRender();
      break;
    case "assign-sampler-to-pad":
      assignSamplerToPad();
      break;
    case "export-sampler":
      exportBufferWav(state.sampler.buffer, "sampler-export.wav");
      break;
    case "clear-sampler":
      state.sampler.buffer = null;
      state.sampler.fileName = "";
      state.sampler.trimStart = 0;
      state.sampler.trimEnd = 0;
      render();
      break;
    case "play-note":
      playSynthNote(target.dataset.note, Number(target.dataset.midi));
      break;
    case "arp-placeholder":
      toast("Arpeggiator is a future local synth pattern hook.");
      break;
    case "pitch-placeholder":
      toast("Pitch shift placeholder: pitch metadata is saved, real offline pitch processing is not bundled.");
      break;
    case "stretch-placeholder":
      toast("Time stretch placeholder: future plugin hook for local processing.");
      break;
    case "refresh-inputs":
      await refreshInputs();
      break;
    case "toggle-monitor":
      await toggleMonitor();
      break;
    case "start-recorder":
      await toggleInputRecording();
      break;
    case "assign-recording-stem":
      assignRecordingToStem();
      break;
    case "assign-recording-pad":
      assignRecordingToPad();
      break;
    case "export-recording":
      exportBufferWav(state.recorder.buffer, "lottominded-ultra-recording.wav");
      break;
    case "clear-recording":
      state.recorder.buffer = null;
      state.recorder.blob = null;
      state.recorder.chunks = [];
      render();
      break;
    case "save-project":
      await saveProject();
      break;
    case "load-project":
      await loadProject();
      break;
    case "export-project":
      exportProject();
      break;
    case "export-mix":
      await exportMix();
      break;
    case "analyze-master":
      await renderBestMasterOffline();
      break;
    case "preview-best-master":
      await previewBestMaster();
      break;
    case "export-best-master-wav":
      exportBestMasterWav();
      break;
    case "export-master-16":
      exportMasterWav16BitDithered();
      break;
    case "export-master-report":
      exportMasterReportJson();
      break;
    case "export-master-preset":
      exportMasterPresetJson();
      break;
    case "export-master-mp3-placeholder":
      exportMasterMp3Placeholder();
      break;
    case "set-master-profile":
      setMasterProfile(id);
      break;
    case "apply-master-preset":
      applyMasterPreset(id);
      break;
    case "compare-master-ab":
      compareMasterBeforeAfter(target.dataset.mode || "after");
      break;
    case "analyze-reference-track":
      if (state.aiMaster.referenceBuffer) {
        state.aiMaster.referenceAnalysis = analyzeReferenceTrack(state.aiMaster.referenceBuffer);
        toast("Reference analysis refreshed.");
        render();
      } else toast("Load a reference track first.");
      break;
    case "demo-project":
      await loadDemoProject();
      break;
    case "clear-project":
      clearProject();
      break;
    default:
      break;
  }
}

function startChannel(channelId, offset = null, preview = false, when = 0) {
  const channel = getStem(channelId);
  if (!channel || !channel.buffer) {
    toast("Load audio into this stem first.");
    return;
  }
  stopChannel(channelId, true);
  const ctx = initAudio();
  if (!ctx) return;
  const source = ctx.createBufferSource();
  source.buffer = channel.buffer;
  source.playbackRate.value = 1;
  const nodes = createChannelNodes(channel);
  source.connect(nodes.low);
  nodes.out.connect(masterGain);
  const startOffset = clamp((offset ?? channel.pausedAt) + channel.trimStart, channel.trimStart, getTrimEnd(channel));
  const duration = Math.max(0.01, getTrimEnd(channel) - startOffset);
  source.loop = (channel.loop || state.transport.loop || state.transport.loopAll) && !preview;
  if (source.loop) {
    source.loopStart = channel.trimStart;
    source.loopEnd = getTrimEnd(channel);
  }
  source.onended = () => {
    if (!source.loop && channel.source === source) {
      channel.playing = false;
      channel.pausedAt = 0;
      channel.source = null;
      channel.nodes = null;
      queueRender();
    }
  };
  channel.source = source;
  channel.nodes = nodes;
  channel.playing = true;
  channel.startTime = (when || ctx.currentTime) - (startOffset - channel.trimStart);
  channel.pausedAt = startOffset - channel.trimStart;
  channel.duration = duration;
  source.start(Math.max(0, when || 0), startOffset, source.loop ? undefined : duration);
  applySoloMute();
  if (!preview) state.playing = true;
  queueRender();
}

function pauseChannel(channelId, silent = false) {
  const channel = getStem(channelId);
  if (!channel?.playing) return;
  channel.pausedAt = clamp(currentStemTime(channel) - channel.trimStart, 0, Math.max(0, getTrimEnd(channel) - channel.trimStart));
  const source = channel.source;
  channel.source = null;
  channel.nodes = null;
  channel.playing = false;
  channel.meter = 0;
  if (source) {
    try {
      source.stop();
    } catch (error) {
      // Source may already be stopped; safe to ignore.
    }
  }
  if (!silent) queueRender();
}

function stopChannel(channelId, silent = false) {
  const channel = getStem(channelId);
  if (!channel) return;
  if (channel.source) {
    try {
      channel.source.stop();
    } catch (error) {
      // Source may already be stopped; safe to ignore.
    }
  }
  channel.source = null;
  channel.nodes = null;
  channel.playing = false;
  channel.pausedAt = 0;
  channel.meter = 0;
  if (!silent) queueRender();
}

function toggleMute(channelId) {
  const channel = getStem(channelId);
  channel.muted = !channel.muted;
  applySoloMute();
  queueRender();
}

function toggleSolo(channelId) {
  const channel = getStem(channelId);
  channel.solo = !channel.solo;
  applySoloMute();
  queueRender();
}

function setChannelGain(channelId, value) {
  const channel = getStem(channelId);
  channel.volume = Number(value);
  if (channel.nodes) channel.nodes.gain.gain.value = effectiveChannelGain(channel);
}

function setChannelPan(channelId, value) {
  const channel = getStem(channelId);
  channel.pan = Number(value);
  if (channel.nodes) channel.nodes.pan.pan.value = channel.pan;
}

function setChannelEq(channelId, band, value) {
  const channel = getStem(channelId);
  channel.eq[band] = Number(value);
  if (!channel.nodes) return;
  if (band === "low") channel.nodes.low.gain.value = channel.eq.low;
  if (band === "mid") channel.nodes.mid.gain.value = channel.eq.mid;
  if (band === "high") channel.nodes.high.gain.value = channel.eq.high;
}

function ensureMixerChannelTone(channel) {
  if (!channel.eq) channel.eq = { low: 0, mid: 0, high: 0 };
  if (!Number.isFinite(Number(channel.eq.low))) channel.eq.low = 0;
  if (!Number.isFinite(Number(channel.eq.mid))) channel.eq.mid = 0;
  if (!Number.isFinite(Number(channel.eq.high))) channel.eq.high = 0;
  return channel;
}

function getMixerChannel(channelId) {
  const channel = state.mixerChannels.find((item) => item.id === channelId);
  return channel ? ensureMixerChannelTone(channel) : null;
}

function getStemForMixerChannel(channelId) {
  const index = state.mixerChannels.findIndex((item) => item.id === channelId);
  return index >= 0 ? state.stems[index] : null;
}

function setMixerChannelParam(channelId, prop, value) {
  const channel = getMixerChannel(channelId);
  if (!channel) return;
  channel[prop] = Number(value);
  const stem = getStemForMixerChannel(channelId);
  if (!stem) return;
  if (prop === "volume") setChannelGain(stem.id, Number(value));
  if (prop === "pan") setChannelPan(stem.id, Number(value));
}

function setMixerChannelEq(channelId, band, value) {
  const channel = getMixerChannel(channelId);
  if (!channel) return;
  channel.eq[band] = Number(value);
  const stem = getStemForMixerChannel(channelId);
  if (stem) setChannelEq(stem.id, band, Number(value));
}

function truncateStem(channelId) {
  const channel = getStem(channelId);
  if (!channel || !channel.buffer) return toast("Load a stem before truncating.");
  channel.buffer = truncateBuffer(channel.buffer, channel.trimStart, getTrimEnd(channel));
  channel.trimStart = 0;
  channel.trimEnd = channel.buffer.duration;
  channel.pausedAt = 0;
  channel.fileName = `Edited ${channel.fileName || channel.name}`;
  toast(`${channel.name} truncated to selected region.`);
  queueRender();
}

function normalizeStem(channelId) {
  const channel = getStem(channelId);
  if (!channel || !channel.buffer) return toast("Load a stem before normalizing.");
  normalizeBuffer(channel.buffer);
  toast(`${channel.name} normalized.`);
  queueRender();
}

function reverseStem(channelId) {
  const channel = getStem(channelId);
  if (!channel || !channel.buffer) return toast("Load a stem before reversing.");
  reverseBuffer(channel.buffer);
  channel.reverse = !channel.reverse;
  toast(`${channel.name} reversed.`);
  queueRender();
}

function fadeStem(channelId, type) {
  const channel = getStem(channelId);
  if (!channel || !channel.buffer) return toast("Load a stem before applying fades.");
  fadeBuffer(channel.buffer, channel.trimStart, getTrimEnd(channel), type);
  toast(`${type === "in" ? "Fade in" : "Fade out"} applied to ${channel.name}.`);
  queueRender();
}

function createChannelNodes(channel) {
  const low = audioCtx.createBiquadFilter();
  low.type = "lowshelf";
  low.frequency.value = 220;
  low.gain.value = channel.eq.low;
  const mid = audioCtx.createBiquadFilter();
  mid.type = "peaking";
  mid.frequency.value = 1200;
  mid.Q.value = 1.2;
  mid.gain.value = channel.eq.mid;
  const high = audioCtx.createBiquadFilter();
  high.type = "highshelf";
  high.frequency.value = 5200;
  high.gain.value = channel.eq.high;
  const filter = audioCtx.createBiquadFilter();
  filter.type = channel.filter >= 0 ? "lowpass" : "highpass";
  filter.frequency.value = channel.filter === 0 ? 20000 : channel.filter > 0 ? 20000 - channel.filter * 18000 : 40 + Math.abs(channel.filter) * 5000;
  const gain = audioCtx.createGain();
  gain.gain.value = effectiveChannelGain(channel);
  const pan = audioCtx.createStereoPanner();
  pan.pan.value = channel.pan;
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;
  low.connect(mid);
  mid.connect(high);
  high.connect(filter);
  filter.connect(gain);
  gain.connect(pan);
  pan.connect(analyser);
  const out = audioCtx.createGain();
  analyser.connect(out);
  return { low, mid, high, filter, gain, pan, analyser, out };
}

function effectiveChannelGain(channel) {
  const hasSolo = state.stems.some((stem) => stem.solo);
  const audible = !channel.muted && (!hasSolo || channel.solo);
  return audible ? channel.volume : 0;
}

function applySoloMute() {
  state.stems.forEach((channel) => {
    if (channel.nodes) channel.nodes.gain.gain.value = effectiveChannelGain(channel);
  });
}

async function playAll(restart = false) {
  const ctx = await ensureAudio();
  const startAt = ctx.currentTime + 0.08;
  state.stems.forEach((channel) => {
    if (channel.buffer) startChannel(channel.id, restart ? 0 : null, false, startAt);
  });
  Object.values(state.decks).forEach((deck) => {
    if (deck.buffer && (restart || !deck.playing)) startDeck(deck.id, restart ? 0 : null, startAt);
  });
  if (state.transport.followSequencer && !state.sequencer.playing) startSequencer(false);
  state.playing = true;
  state.transport.paused = false;
  queueRender();
}

async function restartAll() {
  stopAll(true);
  await playAll(true);
  toast("Transport restarted from the top.");
}

function pauseAll() {
  state.stems.forEach((channel) => pauseChannel(channel.id, true));
  Object.values(state.decks).forEach((deck) => pauseDeck(deck.id, true));
  pauseSequencer(true);
  state.playing = false;
  state.transport.paused = true;
  toast("Transport paused. Press Resume All to continue.");
  queueRender();
}

function stopAll(silent = false) {
  state.stems.forEach((channel) => stopChannel(channel.id, true));
  Object.values(state.decks).forEach((deck) => stopDeck(deck.id, true));
  state.pads.forEach((_, index) => releasePad(index));
  if (state.pad16Level?.generatedPads?.length) state.pad16Level.generatedPads.forEach((_, index) => releasePad(index));
  stopWaveformPreview(true);
  stopSequencer(true);
  state.playing = false;
  state.transport.paused = false;
  if (!silent) queueRender();
}

function toggleTransportLoop() {
  state.transport.loop = !state.transport.loop;
  toast(state.transport.loop ? "Transport loop armed for loaded stems and decks." : "Transport loop disabled.");
  queueRender();
}

function toggleLoopAll() {
  state.transport.loopAll = !state.transport.loopAll;
  state.stems.forEach((channel) => {
    if (channel.buffer) channel.loop = state.transport.loopAll;
  });
  Object.values(state.decks).forEach((deck) => {
    if (!deck.buffer) return;
    deck.loop = state.transport.loopAll;
    deck.loopIn = 0;
    deck.loopOut = getBufferDuration(deck);
  });
  toast(state.transport.loopAll ? "Loop All enabled for loaded stems and decks." : "Loop All disabled for loaded stems and decks.");
  queueRender();
}

function setTimingDivision(division) {
  const next = getTimingDivisions().includes(division) ? division : "1/16";
  state.transport.timingDivision = next;
  state.sequencer.timingDivision = next;
  if (state.sequencer.playing) startSequencer();
  toast(`Timing set to ${formatTimingDivision(next)}.`);
  queueRender();
}

function updateStem(channelId, updates) {
  Object.assign(getStem(channelId), updates);
  queueRender();
}

function toggleDeck(id) {
  const deck = state.decks[id];
  if (!deck.buffer) return toast("Load a local track into this deck first.");
  if (deck.playing) pauseDeck(id);
  else startDeck(id);
}

function startDeck(id, offset = null, when = 0) {
  const deck = state.decks[id];
  if (!deck || !deck.buffer) return;
  stopDeck(id, true);
  const source = audioCtx.createBufferSource();
  source.buffer = deck.buffer;
  source.playbackRate.value = Math.pow(2, deck.pitch / 12);
  const nodes = createDeckNodes(deck);
  source.connect(nodes.low);
  nodes.out.connect(masterGain);
  const startOffset = clamp(offset ?? deck.pausedAt ?? deck.cue, 0, deck.buffer.duration);
  const globalLoop = state.transport.loop || state.transport.loopAll;
  source.loop = (deck.loop && deck.loopOut > deck.loopIn) || globalLoop;
  if (source.loop) {
    source.loopStart = deck.loop && deck.loopOut > deck.loopIn ? deck.loopIn : 0;
    source.loopEnd = deck.loop && deck.loopOut > deck.loopIn ? deck.loopOut : deck.buffer.duration;
  }
  source.onended = () => {
    if (deck.source === source && !source.loop) {
      deck.playing = false;
      deck.pausedAt = 0;
      deck.source = null;
      deck.nodes = null;
      queueRender();
    }
  };
  deck.source = source;
  deck.nodes = nodes;
  deck.playing = true;
  deck.startTime = (when || audioCtx.currentTime) - startOffset;
  deck.pausedAt = startOffset;
  source.start(Math.max(0, when || 0), startOffset);
  applyCrossfader();
  queueRender();
}

async function playBothDecks() {
  const ctx = await ensureAudio();
  const playableDecks = Object.values(state.decks).filter((deck) => deck.buffer);
  if (!playableDecks.length) return toast("Load a local track into Deck A or Deck B first.");
  const startAt = ctx.currentTime + 0.08;
  playableDecks.forEach((deck) => startDeck(deck.id, deck.pausedAt || deck.cue || 0, startAt));
  state.playing = true;
  state.transport.paused = false;
  toast(playableDecks.length === 2 ? "Both decks started together." : "Loaded deck started.");
  queueRender();
}

function pauseBothDecks() {
  Object.keys(state.decks).forEach((id) => pauseDeck(id, true));
  state.transport.paused = true;
  toast("Both decks paused.");
  queueRender();
}

function stopBothDecks() {
  Object.keys(state.decks).forEach((id) => stopDeck(id, true));
  toast("Both decks stopped.");
  queueRender();
}

function pauseDeck(id, silent = false) {
  const deck = state.decks[id];
  if (!deck.playing) return;
  const pausedAt = currentDeckTime(deck);
  stopDeck(id, true);
  deck.pausedAt = clamp(pausedAt, 0, getBufferDuration(deck));
  if (!silent) queueRender();
}

function stopDeck(id, silent = false) {
  const deck = state.decks[id];
  if (!deck) return;
  if (deck.source) {
    try {
      deck.source.stop();
    } catch (error) {
      // Source may already be stopped; safe to ignore.
    }
  }
  deck.source = null;
  deck.nodes = null;
  deck.playing = false;
  deck.pausedAt = 0;
  deck.meter = 0;
  if (!silent) queueRender();
}

function cueDeck(id) {
  const deck = state.decks[id];
  stopDeck(id, true);
  deck.pausedAt = deck.cue || 0;
  startDeck(id, deck.pausedAt);
}

function setCue(id) {
  const deck = state.decks[id];
  deck.cue = currentDeckTime(deck);
  toast(`${deck.name} cue set at ${formatTime(deck.cue)}.`);
  queueRender();
}

function hotCue(id, index) {
  const deck = state.decks[id];
  if (!deck.buffer) return toast("Load a track before setting hot cues.");
  if (deck.hotCues[index] === null) {
    deck.hotCues[index] = currentDeckTime(deck);
    toast(`${deck.name} hot cue ${index + 1} set.`);
  } else {
    startDeck(id, deck.hotCues[index]);
  }
  queueRender();
}

function setDeckLoopPoint(id, point) {
  const deck = state.decks[id];
  const time = currentDeckTime(deck);
  if (point === "in") deck.loopIn = time;
  if (point === "out") deck.loopOut = Math.max(time, deck.loopIn + 0.1);
  toast(`${deck.name} loop ${point} set.`);
  queueRender();
}

function toggleDeckLoop(id) {
  const deck = state.decks[id];
  const beat = 60 / Math.max(1, deck.bpm);
  if (!deck.loopIn && !deck.loopOut) {
    deck.loopIn = currentDeckTime(deck);
    deck.loopOut = Math.min(deck.loopIn + beat * 4, getBufferDuration(deck));
  }
  deck.loop = !deck.loop;
  if (deck.playing) startDeck(id, currentDeckTime(deck));
  queueRender();
}

function pitchBend(id, dir) {
  const deck = state.decks[id];
  const original = deck.pitch;
  deck.pitch = clamp(deck.pitch + dir * 0.8, -12, 12);
  if (deck.source) deck.source.playbackRate.value = Math.pow(2, deck.pitch / 12);
  setTimeout(() => {
    deck.pitch = original;
    if (deck.source) deck.source.playbackRate.value = Math.pow(2, deck.pitch / 12);
    queueRender();
  }, 220);
  queueRender();
}

function createDeckNodes(deck) {
  const channel = {
    eq: deck.eq,
    filter: deck.filter,
    volume: deck.volume * deck.gain,
    pan: 0,
    muted: false,
    solo: false
  };
  const nodes = createChannelNodes(channel);
  return nodes;
}

function applyCrossfader() {
  const cross = Number(localStorage.getItem("lss-crossfader")) || 0;
  const aGain = cross <= 0 ? 1 : 1 - cross;
  const bGain = cross >= 0 ? 1 : 1 + cross;
  if (state.decks.a.nodes) state.decks.a.nodes.gain.gain.value = state.decks.a.volume * state.decks.a.gain * aGain;
  if (state.decks.b.nodes) state.decks.b.nodes.gain.gain.value = state.decks.b.volume * state.decks.b.gain * bGain;
}

function triggerPad(index, velocity = 1, repeated = false, hold = false) {
  if (is16LevelEnabled() && !repeated) {
    trigger16LevelPad(index, window.lastPointerEvent, velocity, hold);
    return;
  }
  const pad = state.pads[index];
  if (!pad || pad.muted) return;
  if (!repeated && state.noteRepeat !== "off") {
    scheduleNoteRepeat(index, velocity);
  }
  state.selectedPadIndex = index;
  pad.active = true;
  pad.velocity = clamp(velocity, 0, 1.5);
  pad.lastVelocity = pad.velocity;
  pad.aftertouch = pad.velocity;
  rememberTouchPerformance({ type: "pad", index, bank: state.padBank, velocity: pad.velocity, pressure: window.lastPointerEvent?.pressure || 0 });
  if (state.settings.performance.hapticsEnabled && navigator.vibrate) navigator.vibrate(Math.round(8 + pad.velocity * 18));
  updatePadVisual(index, pad.velocity, pad.aftertouch);
  if (pad.buffer) triggerPadSample(pad, velocity);
  else triggerSynthDrum(index, velocity);
  if (state.sequencer.recording) {
    state.sequencer.pattern[index][state.sequencer.position] = true;
  }
  if (!hold) {
    setTimeout(() => releasePad(index), 120);
  }
}

function rememberTouchPerformance(entry) {
  state.touchHistory.push({
    ...entry,
    velocity: clamp(Number(entry.velocity) || 0, 0, 1.5),
    at: Date.now()
  });
  state.touchHistory = state.touchHistory.slice(-120);
}

function scheduleNoteRepeat(index, velocity) {
  const beatMs = 60000 / Math.max(1, state.bpm);
  const interval = getDivisionMs(state.noteRepeat);
  if (!Number.isFinite(interval) || interval <= 0 || interval >= beatMs * 1.5) return;
  for (let delay = interval; delay < beatMs; delay += interval) {
    const decay = 1 - Math.min(0.35, delay / beatMs * 0.18);
    setTimeout(() => triggerPad(index, velocity * decay, true), delay);
  }
}

async function loadPadSample(index, file) {
  const buffer = await loadAudioFile(file);
  if (!buffer) return;
  const pad = state.pads[index];
  pad.buffer = buffer;
  pad.sampleName = file.name;
  state.selectedPadIndex = index;
  syncCurrentPadBank();
  if (state.pad16Level.enabled) generate16LevelPads();
  render();
}

function triggerPadSample(pad, velocity) {
  const source = audioCtx.createBufferSource();
  source.buffer = pad.buffer;
  source.playbackRate.value = Math.pow(2, pad.pitch / 12);
  source.loop = pad.mode === "loop";
  const gain = audioCtx.createGain();
  gain.gain.value = pad.gain * velocity;
  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 4200 + velocity * 9800;
  source.connect(gain);
  gain.connect(filter);
  filter.connect(masterGain);
  if (pad.source && pad.mode === "loop") {
    try { pad.source.stop(); } catch (error) {}
  }
  pad.source = source;
  pad.gainNode = gain;
  pad.filterNode = filter;
  source.start();
}

function updatePadAftertouch(index, event) {
  if (is16LevelEnabled()) {
    const sourcePad = get16LevelSourcePad();
    const generatedPad = state.pad16Level.generatedPads[index];
    if (!sourcePad || !generatedPad) return;
    if (!state.settings.performance.aftertouchEnabled) return;
    const pressure = pointerVelocity(event);
    generatedPad.aftertouch = pressure;
    sourcePad.aftertouch = pressure;
    if (sourcePad.gainNode) sourcePad.gainNode.gain.value = sourcePad.gain * clamp(pressure, 0.18, 1.45);
    if (sourcePad.filterNode) sourcePad.filterNode.frequency.value = 3200 + pressure * 11000;
    updatePadVisual(index, generatedPad.velocity || pressure, pressure);
    return;
  }
  const pad = state.pads[index];
  if (!pad) return;
  if (!state.settings.performance.aftertouchEnabled) return;
  const pressure = pointerVelocity(event);
  pad.aftertouch = pressure;
  if (pad.gainNode) pad.gainNode.gain.value = pad.gain * clamp(pressure, 0.18, 1.45);
  if (pad.filterNode) pad.filterNode.frequency.value = 3200 + pressure * 11000;
  updatePadVisual(index, pad.velocity || pressure, pressure);
}

function releasePad(index) {
  if (is16LevelEnabled()) {
    const generatedPad = state.pad16Level.generatedPads[index];
    const sourcePad = get16LevelSourcePad();
    if (generatedPad) {
      generatedPad.active = false;
      generatedPad.velocity = 0;
      generatedPad.aftertouch = 0;
    }
    if (sourcePad) {
      sourcePad.active = false;
      sourcePad.velocity = 0;
      sourcePad.aftertouch = 0;
      if (sourcePad.source && sourcePad.mode === "loop") {
        try { sourcePad.source.stop(); } catch (error) {}
        sourcePad.source = null;
      }
    }
    updatePadVisual(index, 0, 0);
    return;
  }
  const pad = state.pads[index];
  if (!pad) return;
  pad.active = false;
  pad.velocity = 0;
  pad.aftertouch = 0;
  if (pad.source && pad.mode === "loop") {
    try { pad.source.stop(); } catch (error) {}
    pad.source = null;
  }
  updatePadVisual(index, 0, 0);
}

function updatePadVisual(index, velocity, aftertouch) {
  const node = document.querySelector(`.pad-button[data-index="${index}"]`);
  if (!node) return;
  const visualVelocity = state.settings.performance.padGlowEnabled ? velocity : 0;
  const visualAftertouch = state.settings.performance.padGlowEnabled ? aftertouch : 0;
  node.classList.toggle("active", visualAftertouch > 0);
  node.style.setProperty("--velocity", String(clamp(visualVelocity, 0, 1.5)));
  node.style.setProperty("--aftertouch", String(clamp(visualAftertouch, 0, 1.5)));
  node.dataset.velocity = Number(aftertouch).toFixed(2);
}

function triggerSynthDrum(index, velocity) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  const now = audioCtx.currentTime;
  const group = index % 4;
  osc.type = group === 0 ? "sine" : group === 1 ? "triangle" : group === 2 ? "square" : "sawtooth";
  osc.frequency.setValueAtTime(group === 0 ? 120 : group === 1 ? 220 : group === 2 ? 620 : 80, now);
  osc.frequency.exponentialRampToValueAtTime(group === 0 ? 42 : group === 1 ? 160 : group === 2 ? 900 : 40, now + 0.14);
  filter.type = "lowpass";
  filter.frequency.value = group === 2 ? 9000 : 1800;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.65 * velocity, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (group === 3 ? 0.65 : 0.22));
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.75);
}

function startSequencer(restart = true) {
  if (restart) stopSequencer(true);
  else pauseSequencer(true);
  state.sequencer.playing = true;
  state.transport.paused = false;
  const tick = () => {
    const pos = state.sequencer.position;
    state.pads.forEach((pad, row) => {
      if (state.sequencer.pattern[row][pos]) {
        const humanDelay = state.sequencer.humanize ? Math.random() * state.sequencer.humanize * 35 : 0;
        setTimeout(() => triggerPad(row, 0.72 + Math.random() * 0.25), humanDelay);
      }
    });
    state.sequencer.position = (pos + 1) % state.sequencer.steps;
    queueRender();
  };
  tick();
  const interval = getDivisionMs(state.sequencer.timingDivision || state.transport.timingDivision);
  sequenceTimer = setInterval(tick, interval);
}

function pauseSequencer(silent = false) {
  if (sequenceTimer) clearInterval(sequenceTimer);
  sequenceTimer = null;
  state.sequencer.playing = false;
  if (!silent) queueRender();
}

function stopSequencer(silent = false) {
  if (sequenceTimer) clearInterval(sequenceTimer);
  sequenceTimer = null;
  state.sequencer.playing = false;
  state.sequencer.position = 0;
  if (!silent) queueRender();
}

function setSequencerSteps(steps) {
  const next = [16, 32, 64].includes(steps) ? steps : 16;
  state.sequencer.steps = next;
  ensureSequencerPatternLength(next);
  if (state.sequencer.position >= next) state.sequencer.position = 0;
}

function ensureSequencerPatternLength(length = state.sequencer.steps) {
  state.sequencer.pattern = Array.from({ length: 16 }, (_, row) => {
    const current = state.sequencer.pattern[row] || [];
    return Array.from({ length: Math.max(64, length) }, (_, step) => Boolean(current[step]));
  });
}

function saveProject() {
  return openDb().then((db) => {
    const payload = serializeProject(true);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).put(payload, "current");
      tx.oncomplete = () => {
        toast("Project saved locally with audio buffers in IndexedDB.");
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }).catch((error) => {
    console.error(error);
    toast("Project save failed. IndexedDB may be unavailable or full.");
  });
}

function loadProject() {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readonly");
    const request = tx.objectStore(DB_STORE).get("current");
    request.onsuccess = async () => {
      if (!request.result) {
        toast("No local project has been saved yet.");
        resolve();
        return;
      }
      await hydrateProject(request.result);
      toast("Local project loaded from IndexedDB.");
      render();
      resolve();
    };
    request.onerror = () => reject(request.error);
  })).catch((error) => {
    console.error(error);
    toast("Project load failed.");
  });
}

function exportProject() {
  const payload = serializeProject(false);
  payload.audioNote = "Audio buffers are not embedded in this portable JSON. Use Save Project Locally for large audio data in IndexedDB on this device.";
  exportJson("lottominded-ultra-project.json", payload);
}

async function importProject(file) {
  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    await hydrateProject(payload);
    toast("Project metadata imported. Re-load audio files if buffers were not included.");
    render();
  } catch (error) {
    console.error(error);
    toast("Could not import this project JSON.");
  }
}

async function exportMix() {
  if (state.mixRecordingBlob) {
    downloadBlob(state.mixRecordingBlob, "lottominded-ultra-live-mix.webm");
    toast("Latest live mix recording exported.");
    return;
  }
  toast("Use Record Mix to capture the live browser mix, then export it here.");
}

function getMasterProfile(id = state.aiMaster.mode) {
  return MASTER_TARGET_PROFILES[id] || MASTER_TARGET_PROFILES["streaming-safe"];
}

function getMasterSourceBuffer() {
  const ctx = initAudio();
  if (!ctx) return null;
  const playableStems = state.stems.filter((stem) => stem.buffer && !stem.muted && stem.name !== "Master");
  const playableDecks = Object.values(state.decks).filter((deck) => deck.buffer);
  const candidates = [...playableStems.map((stem) => stem.buffer), ...playableDecks.map((deck) => deck.buffer), state.sampler.buffer, state.recorder.buffer].filter(Boolean);
  if (!candidates.length) return null;
  const sampleRate = candidates[0].sampleRate || ctx.sampleRate;
  const duration = Math.max(...candidates.map((buffer) => buffer.duration));
  const length = Math.max(1, Math.ceil(duration * sampleRate));
  const output = ctx.createBuffer(2, length, sampleRate);
  const left = output.getChannelData(0);
  const right = output.getChannelData(1);
  const anySolo = playableStems.some((stem) => stem.solo);
  playableStems.forEach((stem) => {
    if (anySolo && !stem.solo) return;
    mixBufferIntoStereo(stem.buffer, left, right, {
      sampleRate,
      trimStart: stem.trimStart || 0,
      trimEnd: getTrimEnd(stem),
      gain: stem.volume ?? 0.78,
      pan: stem.pan || 0
    });
  });
  playableDecks.forEach((deck) => {
    mixBufferIntoStereo(deck.buffer, left, right, { sampleRate, trimStart: 0, trimEnd: deck.buffer.duration, gain: deck.volume ?? 0.78, pan: 0 });
  });
  if (!playableStems.length && !playableDecks.length) {
    if (state.sampler.buffer) mixBufferIntoStereo(state.sampler.buffer, left, right, { sampleRate, trimStart: 0, trimEnd: state.sampler.buffer.duration, gain: 0.85, pan: 0 });
    if (state.recorder.buffer) mixBufferIntoStereo(state.recorder.buffer, left, right, { sampleRate, trimStart: 0, trimEnd: state.recorder.buffer.duration, gain: 0.85, pan: 0 });
  }
  normalizeBufferToPeak(output, 0.98);
  return output;
}

function mixBufferIntoStereo(buffer, left, right, options) {
  if (!buffer) return;
  const sourceRate = buffer.sampleRate;
  const start = Math.floor((options.trimStart || 0) * sourceRate);
  const end = Math.min(buffer.length, Math.floor((options.trimEnd || buffer.duration) * sourceRate));
  const gain = options.gain ?? 1;
  const pan = clamp(options.pan || 0, -1, 1);
  const leftGain = gain * (pan <= 0 ? 1 : 1 - pan);
  const rightGain = gain * (pan >= 0 ? 1 : 1 + pan);
  const sourceL = buffer.getChannelData(0);
  const sourceR = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : sourceL;
  for (let i = start, out = 0; i < end && out < left.length; i += 1, out += 1) {
    left[out] += (sourceL[i] || 0) * leftGain;
    right[out] += (sourceR[i] || 0) * rightGain;
  }
}

function runBestMasterAlgorithm(sourceBuffer, options = {}) {
  const profile = getMasterProfile(options.profile || state.aiMaster.mode);
  const analysisBefore = analyzeMasteringNeeds(sourceBuffer);
  const chain = buildBestMasterChain(analysisBefore, profile);
  const processed = processBestMaster(sourceBuffer, chain, options);
  const analysisAfter = analyzeMasteringNeeds(processed.buffer);
  const qualityScore = scoreMasterQuality(analysisBefore, analysisAfter, profile);
  return {
    buffer: processed.buffer,
    chain: { ...chain, limiterGainReduction: processed.limiterGainReduction },
    analysisBefore,
    analysisAfter,
    qualityScore,
    warnings: getMasteringWarnings(analysisAfter, profile, processed.limiterGainReduction),
    suggestions: getMasteringSuggestions(analysisAfter, profile)
  };
}

function analyzeMasteringNeeds(buffer) {
  if (!buffer) return null;
  const samplePeak = calculateSamplePeak(buffer);
  const samplePeakDb = ampToDb(samplePeak);
  const rms = calculateRms(buffer);
  const estimatedLufs = calculateIntegratedLufs(buffer);
  const truePeak = calculateTruePeak(buffer, state.settings.mastering?.oversampling || 4);
  const shortTermLufs = calculateShortTermLufs(buffer);
  const momentaryLufs = calculateMomentaryLufs(buffer);
  const loudnessRange = calculateLoudnessRange(buffer);
  const crestFactor = samplePeakDb - ampToDb(rms);
  const spectral = analyzeSpectralBalance(buffer);
  const stereoCorrelation = calculateStereoCorrelation(buffer);
  const clippingCount = countClippedSamples(buffer);
  const dcOffset = calculateDcOffset(buffer);
  return {
    peak: samplePeak,
    samplePeakDb,
    truePeak,
    rms,
    estimatedLufs,
    shortTermLufs,
    momentaryLufs,
    loudnessRange,
    dynamicRange: crestFactor,
    crestFactor,
    stereoCorrelation,
    monoCompatibility: stereoCorrelation > 0.1 ? "stable" : "check phase",
    spectralCentroid: spectral.centroid,
    spectral,
    bassEnergy: spectral.bass,
    midEnergy: spectral.mid,
    highEnergy: spectral.air,
    transientDensity: estimateTransientDensity(buffer),
    dcOffset,
    clippingCount,
    silence: detectHeadTailSilence(buffer)
  };
}

function buildBestMasterChain(analysis, profile) {
  const correctiveEq = buildCorrectiveEqCurve(analysis, profile);
  const enhancementEq = buildEnhancementEqCurve(analysis, profile);
  const matchCurve = state.aiMaster.referenceMatchEnabled && state.aiMaster.referenceAnalysis
    ? buildReferenceEqMatch(analysis, state.aiMaster.referenceAnalysis, state.aiMaster)
    : [];
  return {
    profile,
    correctiveEq,
    enhancementEq,
    matchCurve,
    saturation: profile.saturation || state.aiMaster.saturation || 0.08,
    stereoWidth: state.aiMaster.monoLowEnd ? profile.stereoWidth || 0.08 : 0,
    monoBelowHz: state.aiMaster.monoLowEnd ? state.aiMaster.monoBelowHz : 0,
    targetLufs: state.aiMaster.targetLufs ?? profile.targetLufs,
    truePeakCeiling: state.aiMaster.truePeakCeiling ?? profile.truePeakCeiling,
    maxLimiterGainReduction: state.aiMaster.maxLimiterGainReduction ?? profile.maxLimiterGainReduction,
    preservePunch: state.aiMaster.preservePunch,
    dynamicRangeProtect: state.aiMaster.dynamicRangeProtect
  };
}

function processBestMaster(buffer, chain) {
  let working = cloneAudioBuffer(buffer);
  removeDcOffset(working);
  working = applyParametricEqOffline(working, [...chain.correctiveEq, ...chain.matchCurve, ...chain.enhancementEq]);
  if (chain.monoBelowHz) working = applyMonoLowEndApprox(working, chain.monoBelowHz);
  if (chain.stereoWidth) working = applyStereoWidthApprox(working, chain.stereoWidth);
  if (chain.saturation) applySaturation(working, chain.saturation);
  if (!chain.preservePunch) applyGlueCompression(working, chain.profile.compressionIntensity || 0.35);
  const beforeLufs = calculateIntegratedLufs(working);
  const normalized = normalizeToTargetLufs(working, chain.targetLufs, chain.truePeakCeiling);
  const limiterGainReduction = Math.max(0, (chain.targetLufs - beforeLufs) - normalized.appliedGainDb);
  return { buffer: normalized.buffer, limiterGainReduction };
}

async function previewBestMaster() {
  if (!state.aiMaster.lastMasterBuffer) await renderBestMasterOffline();
  if (state.aiMaster.lastMasterBuffer) previewBuffer(state.aiMaster.lastMasterBuffer, 0, Math.min(12, state.aiMaster.lastMasterBuffer.duration));
}

async function renderBestMasterOffline() {
  await ensureAudio();
  const source = getMasterSourceBuffer();
  if (!source) {
    toast("Load stems, decks, sampler audio, recording, or the demo project before mastering.");
    return null;
  }
  const result = runBestMasterAlgorithm(source);
  state.aiMaster.analysisBefore = result.analysisBefore;
  state.aiMaster.analysisAfter = result.analysisAfter;
  state.aiMaster.spectralBalance = result.analysisBefore.spectral;
  state.aiMaster.correctiveEq = result.chain.correctiveEq;
  state.aiMaster.enhancementEq = result.chain.enhancementEq;
  state.aiMaster.chain = result.chain;
  state.aiMaster.qualityScore = result.qualityScore;
  state.aiMaster.warnings = result.warnings;
  state.aiMaster.suggestions = result.suggestions;
  state.aiMaster.lastMasterBuffer = result.buffer;
  state.aiMaster.lastReport = buildMasterReport();
  toast("Best Master analysis complete.");
  render();
  return result;
}

function exportBestMasterWav() {
  if (!state.aiMaster.lastMasterBuffer) {
    renderBestMasterOffline().then((result) => {
      if (result?.buffer) exportBufferWav24Bit(result.buffer, "lottominded-ultra-master-24bit.wav");
    });
    return;
  }
  exportBufferWav24Bit(state.aiMaster.lastMasterBuffer, "lottominded-ultra-master-24bit.wav");
}

function compareMasterBeforeAfter(mode = "after") {
  state.aiMaster.abMode = mode;
  const buffer = mode === "before" ? getMasterSourceBuffer() : state.aiMaster.lastMasterBuffer;
  if (buffer) previewBuffer(buffer, 0, Math.min(10, buffer.duration));
  toast(mode === "before" ? "Playing gain-matched original reference." : "Playing mastered version.");
}

function scoreMasterQuality(analysisBefore, analysisAfter, profile) {
  return calculateMasterQualityScore(analysisBefore, analysisAfter, profile);
}

function renderMasterQualityScore() {
  return renderMasteringScoreCard(state.aiMaster.qualityScore, state.aiMaster.analysisBefore, state.aiMaster.analysisAfter);
}

function setMasterProfile(id) {
  const profile = getMasterProfile(id);
  state.aiMaster.mode = id || "streaming-safe";
  state.aiMaster.targetLufs = profile.targetLufs;
  state.aiMaster.truePeakCeiling = profile.truePeakCeiling;
  state.aiMaster.maxLimiterGainReduction = profile.maxLimiterGainReduction;
  state.aiMaster.lastMasterBuffer = null;
  toast(`${profile.label} profile selected.`);
  render();
}

function applyMasterPreset(id) {
  const preset = MASTER_PRESETS.find((item) => item.id === id) || MASTER_PRESETS[0];
  state.aiMaster.selectedPresetId = preset.id;
  state.aiMaster.mode = preset.targetProfile;
  state.aiMaster.targetLufs = preset.limiter.targetLufs;
  state.aiMaster.truePeakCeiling = preset.limiter.truePeakCeiling;
  state.aiMaster.maxLimiterGainReduction = preset.limiter.maxGainReduction;
  state.aiMaster.monoLowEnd = true;
  state.aiMaster.monoBelowHz = preset.stereo?.monoBelowHz || 120;
  state.aiMaster.correctiveEq = preset.bands || [];
  state.aiMaster.enhancementEq = [];
  state.aiMaster.lastMasterBuffer = null;
  toast(`${preset.name} preset loaded.`);
  render();
}

function setAiMasterOption(key, value) {
  if (!key) return;
  state.aiMaster[key] = value;
  if (["targetLufs", "truePeakCeiling", "maxLimiterGainReduction", "referenceMatchAmount", "referenceMatchSmoothing", "monoBelowHz"].includes(key)) state.aiMaster[key] = Number(value);
  state.aiMaster.lastMasterBuffer = null;
}

function analyzeSpectralBalance(buffer) {
  if (!buffer) return {};
  const mono = downsampleMono(buffer, 4096);
  const bands = {};
  let sum = 0;
  let weighted = 0;
  MASTER_EQ_BANDS.forEach((band) => {
    const center = Math.sqrt(band.min * band.max);
    const energy = goertzelEnergy(mono, buffer.sampleRate, center);
    bands[band.id] = energy;
    sum += energy;
    weighted += energy * center;
  });
  const max = Math.max(...MASTER_EQ_BANDS.map((band) => bands[band.id]), 0.000001);
  MASTER_EQ_BANDS.forEach((band) => {
    bands[band.id] = clamp(bands[band.id] / max, 0, 1);
  });
  bands.centroid = sum ? weighted / sum : 1200;
  return bands;
}

function buildCorrectiveEqCurve(analysis, targetProfile) {
  const s = analysis?.spectral || {};
  const cap = state.aiMaster.aggressive ? 5 : 3;
  const moves = [];
  const cut = (type, freq, gain, q, mode = "stereo") => moves.push({ type, freq, gain: clamp(gain, -cap, cap), q, mode });
  if ((s.sub || 0) > 0.78 || Math.abs(analysis?.dcOffset || 0) > 0.01) cut("high-pass", targetProfile.lowCutHz || 28, 0, 0.7);
  if ((s.mud || 0) > 0.58) cut("bell", 300, -Math.min(cap, 0.5 + s.mud * 2), 0.9);
  if ((s.box || 0) > 0.62) cut("bell", 560, -Math.min(cap, 0.4 + s.box * 1.8), 1);
  if ((s.harsh || 0) > 0.62) cut("bell", 4200, -Math.min(cap, 0.5 + s.harsh * 2), 1.2);
  if ((s.sibilance || 0) > 0.64) cut("bell", 7200, -Math.min(cap, 0.5 + s.sibilance * 1.8), 1.4);
  if ((s.presence || 0) < 0.22 && targetProfile.vocalPresence) cut("bell", 2400, Math.min(cap, targetProfile.vocalPresence * 1.5), 0.8, "mid");
  return moves;
}

function buildEnhancementEqCurve(analysis, targetProfile) {
  const cap = state.aiMaster.aggressive ? 5 : 3;
  const moves = [];
  if (targetProfile.air) moves.push({ type: "high-shelf", freq: 12000, gain: Math.min(cap, targetProfile.air * 2), q: 0.7, mode: "side" });
  if (targetProfile.warmth) moves.push({ type: "low-shelf", freq: 140, gain: Math.min(cap, targetProfile.warmth * 0.9), q: 0.7, mode: "mid" });
  if (targetProfile.lowEndFocus) moves.push({ type: "bell", freq: 85, gain: Math.min(cap, targetProfile.lowEndFocus * 0.8), q: 0.8, mode: "mid" });
  if (targetProfile.vocalPresence) moves.push({ type: "bell", freq: 2600, gain: Math.min(cap, targetProfile.vocalPresence * 0.8), q: 0.9, mode: "mid" });
  return moves;
}

function applyParametricEqOffline(buffer, eqBands = []) {
  const next = cloneAudioBuffer(buffer);
  eqBands.forEach((band) => applySimpleEqBand(next, band));
  normalizeBufferToPeak(next, 0.995);
  return next;
}

function applyMidSideEqOffline(buffer, eqBands = []) {
  return applyParametricEqOffline(buffer, eqBands);
}

function applyDynamicEqApprox(buffer, dynamicBands = []) {
  return applyParametricEqOffline(buffer, dynamicBands);
}

function calculateIntegratedLufs(buffer) {
  // Estimated LUFS: RMS-derived loudness approximation. TODO: full BS.1770 K-weighting.
  return ampToDb(calculateRms(buffer)) - 0.691;
}

function calculateShortTermLufs(buffer) {
  return calculateWindowedLufs(buffer, 3);
}

function calculateMomentaryLufs(buffer) {
  return calculateWindowedLufs(buffer, 0.4);
}

function calculateLoudnessRange(buffer) {
  const windows = calculateWindowedLufs(buffer, 3).values;
  if (!windows.length) return 0;
  const sorted = windows.slice().sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.9)] - sorted[Math.floor(sorted.length * 0.1)];
}

function calculateTruePeak(buffer, oversampleFactor = 4) {
  let peak = calculateSamplePeak(buffer);
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 1; i < data.length; i += 1) {
      const prev = data[i - 1];
      const next = data[i];
      for (let step = 1; step < oversampleFactor; step += 1) {
        const t = step / oversampleFactor;
        peak = Math.max(peak, Math.abs(prev + (next - prev) * t));
      }
    }
  }
  return ampToDb(peak);
}

function oversampleForTruePeak(buffer) {
  return buffer;
}

function normalizeToTargetLufs(buffer, targetLufs, truePeakCeiling) {
  const next = cloneAudioBuffer(buffer);
  const current = calculateIntegratedLufs(next);
  const desiredGainDb = targetLufs - current;
  const peak = calculateTruePeak(next, state.settings.mastering?.oversampling || 4);
  const peakSafeGainDb = truePeakCeiling - peak;
  const appliedGainDb = Math.min(desiredGainDb, peakSafeGainDb);
  applyGainDb(next, appliedGainDb);
  softLimitToCeiling(next, dbToAmp(truePeakCeiling));
  return { buffer: next, appliedGainDb };
}

function calculateLimiterGainReduction(input, output) {
  return Math.max(0, calculateIntegratedLufs(input) - calculateIntegratedLufs(output));
}

function buildReferenceEqMatch(sourceAnalysis, referenceAnalysis, options) {
  if (!sourceAnalysis || !referenceAnalysis) return [];
  const amount = clamp((options.referenceMatchAmount ?? 20) / 100, 0, 1);
  const smoothing = clamp((options.referenceMatchSmoothing ?? 60) / 100, 0, 1);
  const moves = [];
  ["bass", "mud", "presence", "harsh", "air"].forEach((id) => {
    const source = sourceAnalysis.spectral[id] || 0;
    const ref = referenceAnalysis.spectral[id] || 0;
    const diff = clamp((ref - source) * 3 * amount * (1 - smoothing * 0.35), -1.5, 1.5);
    if (Math.abs(diff) > 0.25) {
      const band = MASTER_EQ_BANDS.find((item) => item.id === id);
      moves.push({ type: id === "air" ? "high-shelf" : "bell", freq: Math.round(Math.sqrt(band.min * band.max)), gain: diff, q: 0.7 + smoothing * 0.6, mode: "stereo" });
    }
  });
  return moves;
}

function applyReferenceMatch(buffer, matchCurve, amount, smoothing) {
  return applyParametricEqOffline(buffer, matchCurve.map((band) => ({ ...band, gain: band.gain * clamp(amount / 100, 0, 1), q: band.q + clamp(smoothing / 100, 0, 1) * 0.5 })));
}

function importReferenceTrack(file) {
  return decodeAudioFile(file).then((buffer) => {
    state.aiMaster.referenceBuffer = buffer;
    state.aiMaster.referenceFileName = file.name;
    state.aiMaster.referenceAnalysis = analyzeReferenceTrack(buffer);
    toast("Reference track analyzed locally.");
  });
}

function analyzeReferenceTrack(buffer) {
  return analyzeMasteringNeeds(buffer);
}

function calculateMasterQualityScore(before, after, profile) {
  if (!after) return null;
  const categories = {
    loudness: clamp(100 - Math.abs(after.estimatedLufs - profile.targetLufs) * 12, 0, 100),
    truePeak: after.truePeak <= profile.truePeakCeiling ? 100 : clamp(100 - (after.truePeak - profile.truePeakCeiling) * 35, 0, 100),
    dynamicRange: clamp((after.crestFactor / Math.max(1, profile.minDynamicRange)) * 100, 0, 100),
    spectralBalance: clamp(100 - Math.abs((after.spectral.mud || 0) - 0.42) * 40 - Math.max(0, (after.spectral.harsh || 0) - 0.65) * 40, 0, 100),
    lowEndControl: (after.spectral.sub || 0) < 0.78 ? 92 : 62,
    harshness: (after.spectral.harsh || 0) < 0.68 ? 94 : 58,
    stereoBalance: after.stereoCorrelation > 0.05 ? 92 : 52,
    monoCompatibility: after.stereoCorrelation > 0 ? 92 : 42,
    clipping: after.clippingCount === 0 ? 100 : 40,
    exportReadiness: after.truePeak <= profile.truePeakCeiling && after.clippingCount === 0 ? 95 : 55
  };
  const overall = Math.round(Object.values(categories).reduce((sum, value) => sum + value, 0) / Object.keys(categories).length);
  return { overall, categories };
}

function getMasteringWarnings(analysis, profile, limiterGainReduction = 0) {
  if (!analysis) return [];
  const warnings = [];
  if (analysis.truePeak > profile.truePeakCeiling) warnings.push("Clipping risk");
  if (limiterGainReduction > profile.maxLimiterGainReduction) warnings.push("Too much limiter gain reduction");
  if (analysis.crestFactor < profile.minDynamicRange) warnings.push("Dynamic range too low");
  if ((analysis.spectral.mud || 0) > 0.62) warnings.push("Muddy low mids");
  if ((analysis.spectral.harsh || 0) > 0.68) warnings.push("Harsh upper mids");
  if (analysis.stereoCorrelation < 0.05) warnings.push("Mono compatibility risk");
  if ((analysis.spectral.sub || 0) > 0.82) warnings.push("Bass mono issue");
  if ((analysis.spectral.bass || 0) > 0.8 && analysis.stereoCorrelation < 0.18) warnings.push("Excessive side low-end");
  if (!warnings.length && analysis.estimatedLufs <= profile.targetLufs + 1 && analysis.truePeak <= profile.truePeakCeiling) warnings.push("Safe for streaming");
  return warnings;
}

function getMasteringSuggestions(analysis, profile) {
  if (!analysis) return [];
  const suggestions = [];
  if (analysis.estimatedLufs < profile.targetLufs - 2) suggestions.push("Raise master gain gently or choose a louder profile.");
  if (analysis.estimatedLufs > profile.targetLufs + 1) suggestions.push("Lower loudness target or reduce limiter push.");
  if (analysis.truePeak > profile.truePeakCeiling) suggestions.push("Lower true peak ceiling or reduce input gain before limiting.");
  if ((analysis.spectral.mud || 0) > 0.62) suggestions.push("Apply EQ Brain mud control around 200-500 Hz.");
  if ((analysis.spectral.harsh || 0) > 0.68) suggestions.push("Use a small de-harsh cut around 2.5-6 kHz.");
  if (analysis.crestFactor < profile.minDynamicRange) suggestions.push("Back off compression/limiting to preserve punch.");
  if (!suggestions.length) suggestions.push("Master is inside the current profile range. Listen on headphones and speakers before publishing.");
  return suggestions;
}

function exportMasterWav24Bit() {
  exportBestMasterWav();
}

function exportMasterWav16BitDithered() {
  if (!state.aiMaster.lastMasterBuffer) return toast("Run Preview Master before exporting 16-bit WAV.");
  const wav = audioBufferToWav(state.aiMaster.lastMasterBuffer, { bitDepth: 16, dither: true });
  downloadBlob(new Blob([wav], { type: "audio/wav" }), "lottominded-ultra-master-16bit-dithered.wav");
  toast("Exported 16-bit dithered master WAV.");
}

function exportMasterMp3Placeholder() {
  toast("MP3 export requires an encoder module; WAV export is available now.");
}

function exportMasterReportJson() {
  exportJson("lottominded-ultra-master-report.json", buildMasterReport());
}

function buildMasterReport() {
  const profile = getMasterProfile(state.aiMaster.mode);
  return {
    app: "LottoMind Stem Studio",
    feature: "Pro Master Algorithm + EQ Brain",
    note: "Local browser mastering assistant. Estimated LUFS is not a full BS.1770 implementation.",
    projectName: state.projectName,
    createdAt: new Date().toISOString(),
    profile: profile.label,
    targetLufs: state.aiMaster.targetLufs,
    truePeakCeiling: state.aiMaster.truePeakCeiling,
    analysisBefore: state.aiMaster.analysisBefore,
    analysisAfter: state.aiMaster.analysisAfter,
    eqSettings: { corrective: state.aiMaster.correctiveEq, enhancement: state.aiMaster.enhancementEq },
    chain: state.aiMaster.chain,
    qualityScore: state.aiMaster.qualityScore,
    warnings: state.aiMaster.warnings,
    suggestions: state.aiMaster.suggestions
  };
}

function exportMasterPresetJson() {
  const preset = MASTER_PRESETS.find((item) => item.id === state.aiMaster.selectedPresetId) || MASTER_PRESETS[0];
  exportJson(`${slug(preset.name)}-master-preset.json`, preset);
}

function cloneAudioBuffer(buffer) {
  const ctx = initAudio();
  const next = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) next.copyToChannel(new Float32Array(buffer.getChannelData(channel)), channel);
  return next;
}

function normalizeBufferToPeak(buffer, target = 0.98) {
  const peak = calculateSamplePeak(buffer);
  if (peak > target && peak > 0) applyGain(buffer, target / peak);
}

function calculateSamplePeak(buffer) {
  let peak = 0;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i += 1) peak = Math.max(peak, Math.abs(data[i]));
  }
  return peak;
}

function calculateRms(buffer) {
  let sum = 0;
  let count = 0;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i += 1) {
      sum += data[i] * data[i];
      count += 1;
    }
  }
  return Math.sqrt(sum / Math.max(1, count));
}

function calculateWindowedLufs(buffer, seconds) {
  const size = Math.max(1, Math.floor(buffer.sampleRate * seconds));
  const mono = getMonoData(buffer);
  const values = [];
  for (let start = 0; start < mono.length; start += size) {
    let sum = 0;
    const end = Math.min(mono.length, start + size);
    for (let i = start; i < end; i += 1) sum += mono[i] * mono[i];
    values.push(ampToDb(Math.sqrt(sum / Math.max(1, end - start))) - 0.691);
  }
  return { min: Math.min(...values), max: Math.max(...values), avg: values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length), values };
}

function getMonoData(buffer) {
  const out = new Float32Array(buffer.length);
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i += 1) out[i] += data[i] / buffer.numberOfChannels;
  }
  return out;
}

function downsampleMono(buffer, targetLength = 4096) {
  const mono = getMonoData(buffer);
  const out = new Float32Array(Math.min(targetLength, mono.length));
  const step = mono.length / out.length;
  for (let i = 0; i < out.length; i += 1) out[i] = mono[Math.floor(i * step)] || 0;
  return out;
}

function goertzelEnergy(data, sampleRate, freq) {
  const w = 2 * Math.PI * freq / sampleRate;
  const coeff = 2 * Math.cos(w);
  let s0 = 0;
  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < data.length; i += 1) {
    s0 = data[i] + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  return Math.sqrt(Math.max(0, s1 * s1 + s2 * s2 - coeff * s1 * s2)) / Math.max(1, data.length);
}

function applySimpleEqBand(buffer, band) {
  const gain = dbToAmp(clamp(band.gain || 0, -6, 6)) - 1;
  if (Math.abs(gain) < 0.001 && !/pass/.test(band.type)) return;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    if (band.type === "high-pass") {
      onePoleHighPass(data, band.freq, buffer.sampleRate);
    } else if (band.type === "low-pass") {
      onePoleLowPassInPlace(data, band.freq, buffer.sampleRate);
    } else if (band.type === "low-shelf") {
      const low = onePoleLowPassCopy(data, band.freq, buffer.sampleRate);
      for (let i = 0; i < data.length; i += 1) data[i] += low[i] * gain;
    } else if (band.type === "high-shelf") {
      const low = onePoleLowPassCopy(data, band.freq, buffer.sampleRate);
      for (let i = 0; i < data.length; i += 1) data[i] += (data[i] - low[i]) * gain;
    } else {
      const center = onePoleLowPassCopy(data, band.freq, buffer.sampleRate);
      const lower = onePoleLowPassCopy(data, Math.max(20, band.freq / (band.q || 1)), buffer.sampleRate);
      for (let i = 0; i < data.length; i += 1) data[i] += (center[i] - lower[i]) * gain;
    }
  }
}

function onePoleLowPassCopy(data, freq, sampleRate) {
  const out = new Float32Array(data.length);
  const alpha = Math.exp(-2 * Math.PI * clamp(freq, 20, sampleRate / 2) / sampleRate);
  let y = 0;
  for (let i = 0; i < data.length; i += 1) {
    y = (1 - alpha) * data[i] + alpha * y;
    out[i] = y;
  }
  return out;
}

function onePoleLowPassInPlace(data, freq, sampleRate) {
  const low = onePoleLowPassCopy(data, freq, sampleRate);
  data.set(low);
}

function onePoleHighPass(data, freq, sampleRate) {
  const low = onePoleLowPassCopy(data, freq, sampleRate);
  for (let i = 0; i < data.length; i += 1) data[i] -= low[i];
}

function applyMonoLowEndApprox(buffer) {
  if (buffer.numberOfChannels < 2) return buffer;
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  for (let i = 0; i < buffer.length; i += 1) {
    const mono = (left[i] + right[i]) * 0.5;
    left[i] = left[i] * 0.82 + mono * 0.18;
    right[i] = right[i] * 0.82 + mono * 0.18;
  }
  return buffer;
}

function applyStereoWidthApprox(buffer, amount = 0) {
  if (buffer.numberOfChannels < 2) return buffer;
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  for (let i = 0; i < buffer.length; i += 1) {
    const mid = (left[i] + right[i]) * 0.5;
    const side = (left[i] - right[i]) * (0.5 + amount);
    left[i] = mid + side;
    right[i] = mid - side;
  }
  normalizeBufferToPeak(buffer, 0.995);
  return buffer;
}

function applySaturation(buffer, amount = 0.1) {
  const drive = 1 + amount * 2.5;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.tanh(data[i] * drive) / Math.tanh(drive);
  }
}

function applyGlueCompression(buffer, amount = 0.35) {
  const threshold = dbToAmp(-12);
  const ratio = 1 + amount * 3;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i += 1) {
      const sign = Math.sign(data[i]);
      const abs = Math.abs(data[i]);
      if (abs > threshold) data[i] = sign * (threshold + (abs - threshold) / ratio);
    }
  }
}

function softLimitToCeiling(buffer, ceilingAmp) {
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i += 1) data[i] = clamp(Math.tanh(data[i] / ceilingAmp) * ceilingAmp, -ceilingAmp, ceilingAmp);
  }
}

function applyGain(buffer, gain) {
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i += 1) data[i] *= gain;
  }
}

function applyGainDb(buffer, db) {
  applyGain(buffer, dbToAmp(db));
}

function removeDcOffset(buffer) {
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    let sum = 0;
    for (let i = 0; i < data.length; i += 1) sum += data[i];
    const offset = sum / Math.max(1, data.length);
    for (let i = 0; i < data.length; i += 1) data[i] -= offset;
  }
}

function calculateStereoCorrelation(buffer) {
  if (buffer.numberOfChannels < 2) return 1;
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  let lr = 0;
  let ll = 0;
  let rr = 0;
  for (let i = 0; i < buffer.length; i += Math.max(1, Math.floor(buffer.length / 24000))) {
    lr += left[i] * right[i];
    ll += left[i] * left[i];
    rr += right[i] * right[i];
  }
  return lr / Math.sqrt(Math.max(0.000001, ll * rr));
}

function countClippedSamples(buffer) {
  let count = 0;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i += 1) if (Math.abs(data[i]) >= 0.999) count += 1;
  }
  return count;
}

function calculateDcOffset(buffer) {
  let sum = 0;
  let count = 0;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i += 1) {
      sum += data[i];
      count += 1;
    }
  }
  return sum / Math.max(1, count);
}

function estimateTransientDensity(buffer) {
  const mono = downsampleMono(buffer, 12000);
  let hits = 0;
  for (let i = 1; i < mono.length; i += 1) if (Math.abs(mono[i] - mono[i - 1]) > 0.18) hits += 1;
  return hits / Math.max(1, mono.length);
}

function detectHeadTailSilence(buffer) {
  const mono = getMonoData(buffer);
  const threshold = 0.002;
  let head = 0;
  while (head < mono.length && Math.abs(mono[head]) < threshold) head += 1;
  let tail = mono.length - 1;
  while (tail > 0 && Math.abs(mono[tail]) < threshold) tail -= 1;
  return { headSeconds: head / buffer.sampleRate, tailSeconds: (mono.length - tail) / buffer.sampleRate };
}

function ampToDb(value) {
  return 20 * Math.log10(Math.max(0.000001, Math.abs(value || 0)));
}

function dbToAmp(db) {
  return Math.pow(10, db / 20);
}

function formatDb(value) {
  if (!Number.isFinite(Number(value))) return "--";
  return Number(value).toFixed(1);
}

function drawWaveform(canvas, buffer, options = {}) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.width = Math.max(1, Math.floor(canvas.clientWidth * window.devicePixelRatio));
  const height = canvas.height = Math.max(1, Math.floor(canvas.clientHeight * window.devicePixelRatio));
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(3, 7, 15, 0.94)";
  ctx.fillRect(0, 0, width, height);
  drawGrid(ctx, width, height);
  if (!buffer) {
    ctx.fillStyle = "rgba(158,177,202,0.75)";
    ctx.font = `${12 * window.devicePixelRatio}px sans-serif`;
    ctx.fillText("Load local audio", 14 * window.devicePixelRatio, height / 2);
    return;
  }
  const data = buffer.getChannelData(0);
  const step = Math.max(1, Math.floor(data.length / width));
  const amp = height / 2;
  const color = options.color || "#29f7ff";
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.5, "#ff4fd8");
  gradient.addColorStop(1, "#ffe071");
  ctx.strokeStyle = gradient;
  ctx.lineWidth = Math.max(1, 2 * window.devicePixelRatio);
  ctx.beginPath();
  for (let x = 0; x < width; x += 1) {
    let min = 1;
    let max = -1;
    for (let j = 0; j < step; j += 1) {
      const datum = data[(x * step) + j] || 0;
      if (datum < min) min = datum;
      if (datum > max) max = datum;
    }
    ctx.moveTo(x, (1 + min) * amp);
    ctx.lineTo(x, (1 + max) * amp);
  }
  ctx.stroke();
  const trimStart = options.trimStart || 0;
  const trimEnd = options.trimEnd || buffer.duration;
  if (trimStart > 0 || trimEnd < buffer.duration) {
    ctx.fillStyle = "rgba(255, 224, 113, 0.16)";
    const x1 = (trimStart / buffer.duration) * width;
    const x2 = (trimEnd / buffer.duration) * width;
    ctx.fillRect(x1, 0, Math.max(1, x2 - x1), height);
    ctx.strokeStyle = "rgba(255, 224, 113, 0.8)";
    ctx.strokeRect(x1, 0, Math.max(1, x2 - x1), height);
  }
  if (Number.isFinite(options.playhead)) {
    const head = ((options.playhead % buffer.duration) / buffer.duration) * width;
    ctx.strokeStyle = "#f7fff9";
    ctx.lineWidth = 2 * window.devicePixelRatio;
    ctx.beginPath();
    ctx.moveTo(head, 0);
    ctx.lineTo(head, height);
    ctx.stroke();
  }
  if (options.beatGrid) {
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    const beats = Math.max(4, Math.floor(buffer.duration / (60 / (options.bpm || state.bpm))));
    for (let beat = 0; beat < beats; beat += 1) {
      const x = (beat / beats) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }
}

function drawSpectrum() {
  document.querySelectorAll("[data-spectrum='stem']").forEach((canvas) => {
    const channel = getStem(canvas.dataset.id);
    const ctx = canvas.getContext("2d");
    const width = canvas.width = Math.max(1, Math.floor(canvas.clientWidth * window.devicePixelRatio));
    const height = canvas.height = Math.max(1, Math.floor(canvas.clientHeight * window.devicePixelRatio));
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(2,5,12,0.82)";
    ctx.fillRect(0, 0, width, height);
    if (!channel || !channel.nodes) return;
    const data = new Uint8Array(channel.nodes.analyser.frequencyBinCount);
    channel.nodes.analyser.getByteFrequencyData(data);
    const barWidth = width / data.length;
    for (let i = 0; i < data.length; i += 2) {
      const value = data[i] / 255;
      const barHeight = value * height;
      ctx.fillStyle = `rgba(${40 + value * 180}, ${220}, ${190 + value * 40}, ${0.35 + value * 0.6})`;
      ctx.fillRect(i * barWidth, height - barHeight, Math.max(1, barWidth * 1.4), barHeight);
    }
  });
}

function animationLoop() {
  updateMeters();
  drawAllCanvases();
  animationFrame = requestAnimationFrame(animationLoop);
}

function drawAllCanvases() {
  document.querySelectorAll("[data-waveform='stem']").forEach((canvas) => {
    const channel = getStem(canvas.dataset.id);
    drawWaveform(canvas, channel?.buffer, {
      color: channel?.color,
      trimStart: channel?.trimStart || 0,
      trimEnd: getTrimEnd(channel),
      playhead: channel?.playing ? currentStemTime(channel) : null
    });
  });
  document.querySelectorAll("[data-waveform='editor']").forEach((canvas) => {
    const channel = getStem(canvas.dataset.id);
    drawWaveform(canvas, channel?.buffer, {
      color: channel?.color,
      trimStart: channel?.trimStart || 0,
      trimEnd: getTrimEnd(channel),
      playhead: channel?.playing ? currentStemTime(channel) : null
    });
  });
  document.querySelectorAll("[data-waveform='deck']").forEach((canvas) => {
    const deck = state.decks[canvas.dataset.id];
    drawWaveform(canvas, deck?.buffer, {
      color: deck?.color,
      playhead: deck?.playing ? currentDeckTime(deck) : deck?.pausedAt,
      beatGrid: true,
      bpm: deck?.bpm
    });
  });
  document.querySelectorAll("[data-waveform='pad']").forEach((canvas) => {
    const pad = state.pads[Number(canvas.dataset.id)];
    drawWaveform(canvas, pad?.buffer, { color: pad?.color });
  });
  document.querySelectorAll("[data-waveform='sampler']").forEach((canvas) => {
    drawWaveform(canvas, state.sampler.buffer, {
      color: "#ffe071",
      trimStart: state.sampler.trimStart,
      trimEnd: state.sampler.trimEnd || getBufferDuration(state.sampler)
    });
  });
  document.querySelectorAll("[data-waveform='recording']").forEach((canvas) => {
    drawWaveform(canvas, state.recorder.buffer, { color: "#ff4fd8" });
  });
  document.querySelectorAll("[data-waveform='studio-main']").forEach((canvas) => {
    drawMainWaveform(canvas, getWaveformStudioBuffer(), { playhead: state.song.playheadTime || state.waveformStudio.cursorTime || 0 });
  });
  document.querySelectorAll("[data-waveform='studio-minimap']").forEach((canvas) => {
    drawWaveformMiniMap(canvas, getWaveformStudioBuffer(), state.waveformStudio.viewport);
  });
  document.querySelectorAll("[data-waveform='crossfade']").forEach((canvas) => {
    drawCrossfadeCurve(canvas, state.waveformStudio.crossfades.at(-1));
  });
  document.querySelectorAll("[data-waveform='effect-preview']").forEach((canvas) => {
    drawMainWaveform(canvas, state.waveformStudio.quickEffect?.buffer || getWaveformStudioBuffer(), {});
  });
  document.querySelectorAll("[data-automation]").forEach((canvas) => {
    const lane = state.automation.lanes.find((item) => item.id === canvas.dataset.automation);
    drawAutomation(canvas, lane);
  });
  drawSpectrum();
}

function drawAutomation(canvas, lane) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width = Math.max(1, Math.floor(canvas.clientWidth * window.devicePixelRatio));
  const height = canvas.height = Math.max(1, Math.floor(canvas.clientHeight * window.devicePixelRatio));
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(2,5,12,0.82)";
  ctx.fillRect(0, 0, width, height);
  drawGrid(ctx, width, height);
  if (!lane) return;
  const points = lane.points.slice().sort((a, b) => a.step - b.step);
  ctx.strokeStyle = lane.color;
  ctx.lineWidth = 3 * window.devicePixelRatio;
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = (point.step / Math.max(1, state.pianoRoll.steps - 1)) * width;
    const y = height - clamp(point.value, 0, 1) * height;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  points.forEach((point) => {
    const x = (point.step / Math.max(1, state.pianoRoll.steps - 1)) * width;
    const y = height - clamp(point.value, 0, 1) * height;
    ctx.fillStyle = lane.color;
    ctx.beginPath();
    ctx.arc(x, y, 5 * window.devicePixelRatio, 0, Math.PI * 2);
    ctx.fill();
  });
}

function updateMeters() {
  state.stems.forEach((channel) => {
    channel.meter = channel.nodes ? analyserPeak(channel.nodes.analyser) : Math.max(0, channel.meter * 0.88);
  });
  Object.values(state.decks).forEach((deck) => {
    deck.meter = deck.nodes ? analyserPeak(deck.nodes.analyser) : Math.max(0, deck.meter * 0.88);
  });
  state.master.meter = masterAnalyser ? analyserPeak(masterAnalyser) : 0;
  document.querySelectorAll(".vu span").forEach((node) => {
    const card = node.closest("[data-channel-card]");
    const deckCard = node.closest("[data-deck-card]");
    if (card) node.style.setProperty("--vu", `${Math.round(getStem(card.dataset.channelCard).meter * 100)}%`);
    if (deckCard) node.style.setProperty("--vu", `${Math.round(state.decks[deckCard.dataset.deckCard].meter * 100)}%`);
  });
}

function analyserPeak(analyser) {
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  let peak = 0;
  for (let i = 0; i < data.length; i += 1) peak = Math.max(peak, data[i]);
  return peak / 255;
}

function truncateBuffer(buffer, start, end) {
  if (!buffer || !audioCtx) return buffer;
  const sampleRate = buffer.sampleRate;
  const safeStart = clamp(start, 0, buffer.duration);
  const safeEnd = clamp(end || buffer.duration, safeStart + 0.01, buffer.duration);
  const first = Math.floor(safeStart * sampleRate);
  const last = Math.floor(safeEnd * sampleRate);
  const length = Math.max(1, last - first);
  const next = audioCtx.createBuffer(buffer.numberOfChannels, length, sampleRate);
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    next.copyToChannel(buffer.getChannelData(channel).slice(first, last), channel);
  }
  return next;
}

function reverseBuffer(buffer) {
  if (!buffer) return;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    buffer.getChannelData(channel).reverse();
  }
}

function normalizeBuffer(buffer) {
  if (!buffer) return;
  let peak = 0;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i += 1) peak = Math.max(peak, Math.abs(data[i]));
  }
  if (!peak) return;
  const gain = 0.96 / peak;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i += 1) data[i] *= gain;
  }
}

function fadeBuffer(buffer, start, end, type) {
  if (!buffer) return;
  const sampleRate = buffer.sampleRate;
  const first = Math.floor(clamp(start, 0, buffer.duration) * sampleRate);
  const last = Math.floor(clamp(end || buffer.duration, start, buffer.duration) * sampleRate);
  const length = Math.max(1, last - first);
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = first; i < last; i += 1) {
      const t = (i - first) / length;
      data[i] *= type === "in" ? t : 1 - t;
    }
  }
}

function previewBuffer(buffer, start = 0, end = 0) {
  if (!buffer) return toast("Load audio first.");
  const source = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();
  source.buffer = buffer;
  gain.gain.value = 0.85;
  source.connect(gain);
  gain.connect(masterGain);
  source.start(0, start, Math.max(0.05, (end || buffer.duration) - start));
}

function exportBufferWav(buffer, fileName) {
  if (!buffer) return toast("No audio buffer is available to export.");
  const wav = audioBufferToWav(buffer);
  downloadBlob(new Blob([wav], { type: "audio/wav" }), fileName);
  toast(`Exported ${fileName}.`);
}

function exportBufferWav24Bit(buffer, fileName) {
  if (!buffer) return toast("No audio buffer is available to export.");
  const wav = audioBufferToWav(buffer, { bitDepth: 24 });
  downloadBlob(new Blob([wav], { type: "audio/wav" }), fileName);
  toast(`Exported ${fileName}.`);
}

function audioBufferToWav(buffer, options = {}) {
  const channels = buffer.numberOfChannels;
  const bitDepth = options.bitDepth || 16;
  const bytesPerSample = bitDepth === 24 ? 3 : 2;
  const length = buffer.length * channels * bytesPerSample + 44;
  const arrayBuffer = new ArrayBuffer(length);
  const view = new DataView(arrayBuffer);
  writeString(view, 0, "RIFF");
  view.setUint32(4, length - 8, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * bytesPerSample, true);
  view.setUint16(32, channels * bytesPerSample, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, length - 44, true);
  let offset = 44;
  const channelData = Array.from({ length: channels }, (_, channel) => buffer.getChannelData(channel));
  for (let i = 0; i < buffer.length; i += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      let sample = clamp(channelData[channel][i], -1, 1);
      if (options.dither && bitDepth === 16) sample += (Math.random() - Math.random()) / 65536;
      if (bitDepth === 24) {
        const int = Math.round(sample < 0 ? sample * 0x800000 : sample * 0x7fffff);
        view.setUint8(offset, int & 0xff);
        view.setUint8(offset + 1, (int >> 8) & 0xff);
        view.setUint8(offset + 2, (int >> 16) & 0xff);
        offset += 3;
      } else {
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }
  }
  return arrayBuffer;
}

function writeString(view, offset, value) {
  for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
}

async function toggleMixRecording() {
  await ensureAudio();
  if (!mixDestination || typeof MediaRecorder === "undefined") {
    toast("Live mix capture is not supported by this browser. Stem WAV and project exports still work.");
    return;
  }
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    return;
  }
  const chunks = [];
  mediaRecorder = new MediaRecorder(mixDestination.stream);
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  mediaRecorder.onstop = () => {
    state.mixRecordingBlob = new Blob(chunks, { type: mediaRecorder.mimeType || "audio/webm" });
    state.recording = false;
    downloadBlob(state.mixRecordingBlob, "lottominded-ultra-live-mix.webm");
    toast("Live mix recording exported.");
    render();
  };
  state.recording = true;
  mediaRecorder.start();
  toast("Live mix recording started.");
  render();
}

async function toggleSampleRecording() {
  await toggleInputRecording(true);
}

async function recordTabAudio() {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    toast("Tab audio capture is not available in this browser.");
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
    await recordStreamToSampler(stream, "Tab Capture Sample");
  } catch (error) {
    console.error(error);
    toast("Tab capture was cancelled or blocked by the browser.");
  }
}

async function refreshInputs() {
  if (!navigator.mediaDevices?.enumerateDevices) return toast("Audio input listing is not available in this browser.");
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    state.recorder.devices = devices.filter((device) => device.kind === "audioinput");
    toast("Input devices refreshed.");
    render();
  } catch (error) {
    console.error(error);
    toast("Could not list input devices.");
  }
}

async function toggleMonitor() {
  if (state.recorder.monitoring) {
    stopMicStream();
    state.recorder.monitoring = false;
    render();
    return;
  }
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: state.recorder.deviceId ? { deviceId: state.recorder.deviceId } : true });
    const source = audioCtx.createMediaStreamSource(micStream);
    const gain = audioCtx.createGain();
    gain.gain.value = 0.45;
    source.connect(gain);
    gain.connect(masterGain);
    state.recorder.monitoring = true;
    toast("Input monitoring enabled.");
    render();
  } catch (error) {
    console.error(error);
    toast("Mic or line input permission was not granted.");
  }
}

async function toggleInputRecording(toSampler = false) {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: state.recorder.deviceId ? { deviceId: state.recorder.deviceId } : true });
    if (toSampler) await recordStreamToSampler(stream, "Mic Sample");
    else await recordStreamToRecorder(stream);
  } catch (error) {
    console.error(error);
    toast("Recording permission was not granted or no input is available.");
  }
}

function recordStreamToRecorder(stream) {
  state.recorder.chunks = [];
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size) state.recorder.chunks.push(event.data);
  };
  mediaRecorder.onstop = async () => {
    const blob = new Blob(state.recorder.chunks, { type: mediaRecorder.mimeType || "audio/webm" });
    state.recorder.blob = blob;
    state.recorder.buffer = await decodeBlob(blob);
    state.recording = false;
    stopStream(stream);
    toast("Recording captured.");
    render();
  };
  state.recording = true;
  mediaRecorder.start();
  toast("Recording started.");
  render();
}

function recordStreamToSampler(stream, name) {
  state.sampler.recorderChunks = [];
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size) state.sampler.recorderChunks.push(event.data);
  };
  mediaRecorder.onstop = async () => {
    const blob = new Blob(state.sampler.recorderChunks, { type: mediaRecorder.mimeType || "audio/webm" });
    state.sampler.buffer = await decodeBlob(blob);
    state.sampler.fileName = name;
    state.sampler.trimStart = 0;
    state.sampler.trimEnd = getBufferDuration(state.sampler);
    state.recording = false;
    stopStream(stream);
    toast("Sampler recording captured.");
    render();
  };
  state.recording = true;
  mediaRecorder.start();
  toast("Sampler recording started. Press the recording button again to stop.");
  render();
}

async function decodeBlob(blob) {
  const ctx = await ensureAudio();
  const arrayBuffer = await blob.arrayBuffer();
  return ctx.decodeAudioData(arrayBuffer);
}

function assignRecordingToStem() {
  const stem = getSelectedStem();
  if (!state.recorder.buffer || !stem) return toast("Record audio and select a stem first.");
  stem.buffer = cloneBuffer(state.recorder.buffer);
  stem.fileName = state.recorder.fileName;
  stem.trimStart = 0;
  stem.trimEnd = stem.buffer.duration;
  toast(`Recording assigned to ${stem.name}.`);
  render();
}

function assignRecordingToPad() {
  if (!state.recorder.buffer) return toast("Record audio before assigning it to a pad.");
  const pad = state.pads[state.selectedPadIndex];
  pad.buffer = cloneBuffer(state.recorder.buffer);
  pad.sampleName = "Recording";
  toast(`Recording assigned to pad ${state.selectedPadIndex + 1}.`);
  render();
}

function assignSamplerToPad() {
  if (!state.sampler.buffer) return toast("Load or record a sampler audio first.");
  const pad = state.pads[state.selectedPadIndex];
  pad.buffer = cloneBuffer(state.sampler.buffer);
  pad.sampleName = state.sampler.fileName || "Sampler";
  toast(`Sampler assigned to pad ${state.selectedPadIndex + 1}.`);
  render();
}

function sliceSamplerToPads() {
  if (!state.sampler.buffer) return toast("Load sampler audio before slicing.");
  sliceBufferToPads(state.sampler.buffer, state.sampler.fileName || "Slice");
}

function sliceStemToPads() {
  const stem = getSelectedStem();
  if (!stem?.buffer) return toast("Select a loaded stem before slicing.");
  const sliced = truncateBuffer(stem.buffer, stem.trimStart, getTrimEnd(stem));
  sliceBufferToPads(sliced, stem.name);
}

function sliceBufferToPads(buffer, label) {
  const slices = 16;
  const sampleLength = Math.floor(buffer.length / slices);
  for (let index = 0; index < slices; index += 1) {
    const slice = audioCtx.createBuffer(buffer.numberOfChannels, sampleLength, buffer.sampleRate);
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const source = buffer.getChannelData(channel).slice(index * sampleLength, (index + 1) * sampleLength);
      slice.copyToChannel(source, channel);
    }
    state.pads[index].buffer = slice;
    state.pads[index].sampleName = `${label} ${index + 1}`;
  }
  toast("Audio sliced across all 16 pads.");
  render();
}

function playSynthNote(note, midiIndex, velocity = 1, sustain = false) {
  const keyId = `${note}-${midiIndex}`;
  if (sustain && state.synth.active.has(keyId)) {
    updateSynthAftertouch(keyId, velocity);
    return;
  }
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  const midi = 12 * (state.synth.octave + 1) + midiIndex;
  rememberTouchPerformance({ type: "keyboard", note, midi, velocity, pressure: window.lastPointerEvent?.pressure || 0 });
  osc.type = state.synth.wave;
  osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
  filter.type = "lowpass";
  filter.frequency.value = 2600 + velocity * 8800;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(state.synth.volume * clamp(velocity, 0.15, 1.35), now + 0.02);
  if (!sustain) gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
  osc.connect(gain);
  gain.connect(filter);
  filter.connect(masterGain);
  osc.start(now);
  if (!sustain) osc.stop(now + 0.75);
  state.synth.active.set(keyId, { osc, gain, filter, note, midiIndex });
  updateKeyVisual(note, midiIndex, velocity);
  if (!sustain) {
    setTimeout(() => releaseSynthNote(note, midiIndex), 180);
  }
}

function updateSynthAftertouch(keyId, velocity) {
  const voice = state.synth.active.get(keyId);
  if (!voice) return;
  if (!state.settings.performance.aftertouchEnabled) return;
  const safeVelocity = clamp(velocity, 0.15, 1.45);
  voice.gain.gain.setTargetAtTime(state.synth.volume * safeVelocity, audioCtx.currentTime, 0.015);
  voice.filter.frequency.setTargetAtTime(2600 + safeVelocity * 8800, audioCtx.currentTime, 0.02);
  updateKeyVisual(voice.note, voice.midiIndex, safeVelocity);
}

function releaseSynthNote(note, midiIndex) {
  const keyId = `${note}-${midiIndex}`;
  const voice = state.synth.active.get(keyId);
  if (!voice) return;
  const now = audioCtx.currentTime;
  voice.gain.gain.cancelScheduledValues(now);
  voice.gain.gain.setTargetAtTime(0.0001, now, 0.035);
  try { voice.osc.stop(now + 0.16); } catch (error) {}
  state.synth.active.delete(keyId);
  document.querySelectorAll(`[data-note="${note}"][data-midi="${midiIndex}"]`).forEach((key) => {
    key.classList.remove("active");
    key.style.removeProperty("--key-velocity");
  });
}

function updateKeyVisual(note, midiIndex, velocity) {
  document.querySelectorAll(`[data-note="${note}"][data-midi="${midiIndex}"]`).forEach((key) => {
    key.classList.toggle("active", state.settings.performance.keyGlowEnabled);
    key.style.setProperty("--key-velocity", String(clamp(state.settings.performance.keyGlowEnabled ? velocity : 0, 0, 1.5)));
  });
}

function clearPattern() {
  state.sequencer.pattern = Array.from({ length: 16 }, () => Array(64).fill(false));
  render();
}

function addSongTrack() {
  const index = state.song.tracks.length + 1;
  state.song.tracks.push({ id: `song-track-${Date.now()}`, name: `Track ${index}`, clips: [] });
  toast(`Track ${index} added to Song Editor.`);
  render();
}

function addSongClip() {
  const track = state.song.tracks[0];
  if (!track) return;
  const bar = ((track.clips.length * 4) % Math.max(4, state.song.bars - 3)) + 1;
  track.clips.push({ bar, length: 4, type: "pattern", ref: track.clips.length, color: COLORS[track.clips.length % COLORS.length] });
  toast("Pattern clip added to the arrangement.");
  render();
}

function togglePianoNote(note, step) {
  const index = state.pianoRoll.notes.findIndex((item) => item.note === note && item.step === step);
  if (index >= 0) {
    state.pianoRoll.notes.splice(index, 1);
  } else {
    state.pianoRoll.notes.push({ note, step, length: 1, velocity: 0.86 });
    playSynthNote(midiNoteName(note).replace(/[0-9-]/g, ""), note % 12, 0.86);
  }
  queueRender();
}

function addAutomationLane() {
  const next = state.automation.lanes.length + 1;
  state.automation.lanes.push({
    id: `auto-${Date.now()}`,
    target: `Automation Lane ${next}`,
    color: COLORS[next % COLORS.length],
    points: [{ step: 0, value: 0.5 }, { step: state.pianoRoll.steps - 1, value: 0.5 }]
  });
  render();
}

function randomizeAutomation() {
  state.automation.lanes.forEach((lane) => {
    lane.points = Array.from({ length: 6 }, (_, index) => ({
      step: Math.round((state.pianoRoll.steps - 1) * (index / 5)),
      value: Math.random()
    }));
  });
  toast("Automation lanes randomized.");
  render();
}

function addAutomationPoint(laneId) {
  const lane = state.automation.lanes.find((item) => item.id === laneId);
  if (!lane) return;
  lane.points.push({ step: Math.floor(Math.random() * state.pianoRoll.steps), value: Math.random() });
  render();
}

function clearAutomationLane(laneId) {
  const lane = state.automation.lanes.find((item) => item.id === laneId);
  if (!lane) return;
  lane.points = [];
  render();
}

function togglePlugin(pluginId) {
  const plugin = state.plugins.find((item) => item.id === pluginId);
  if (!plugin) return;
  plugin.enabled = !plugin.enabled;
  toast(`${plugin.name} ${plugin.enabled ? "enabled" : "bypassed"}.`);
  render();
}

async function requestMidiAccess() {
  if (!navigator.requestMIDIAccess) {
    toast("Web MIDI is not supported in this browser. MIDI file import/export still works.");
    return;
  }
  try {
    state.daw.midi.access = await navigator.requestMIDIAccess({ sysex: false });
    state.daw.midi.enabled = true;
    refreshMidiDevices();
    state.daw.midi.access.onstatechange = refreshMidiDevices;
    toast("MIDI access granted.");
  } catch (error) {
    console.error(error);
    toast("MIDI permission was blocked or unavailable.");
  }
}

function refreshMidiDevices() {
  const access = state.daw.midi.access;
  if (!access) {
    state.daw.midi.inputs = [];
    state.daw.midi.outputs = [];
    render();
    return;
  }
  state.daw.midi.inputs = Array.from(access.inputs.values()).map((input) => ({ id: input.id, name: input.name || "MIDI Input" }));
  state.daw.midi.outputs = Array.from(access.outputs.values()).map((output) => ({ id: output.id, name: output.name || "MIDI Output" }));
  if (!state.daw.midi.selectedInputId && state.daw.midi.inputs[0]) state.daw.midi.selectedInputId = state.daw.midi.inputs[0].id;
  if (!state.daw.midi.selectedOutputId && state.daw.midi.outputs[0]) state.daw.midi.selectedOutputId = state.daw.midi.outputs[0].id;
  bindMidiInput(state.daw.midi.selectedInputId);
  render();
}

function bindMidiInput(inputId) {
  const access = state.daw.midi.access;
  if (!access || !inputId) return;
  access.inputs.forEach((input) => {
    input.onmidimessage = input.id === inputId ? handleMidiMessage : null;
  });
}

function handleMidiMessage(event) {
  const [status, data1, data2] = event.data;
  const command = status & 0xf0;
  const channel = status & 0x0f;
  if (command === 0x90 && data2 > 0) midiNoteOn(data1, data2 / 127, channel);
  if (command === 0x80 || (command === 0x90 && data2 === 0)) midiNoteOff(data1, channel);
  if (command === 0xb0) midiControlChange(data1, data2 / 127, channel);
  if (state.daw.midi.thruEnabled) sendMidiMessage(Array.from(event.data));
}

function sendMidiMessage(message) {
  const output = state.daw.midi.access?.outputs.get(state.daw.midi.selectedOutputId);
  if (output) output.send(message);
}

function midiNoteOn(note, velocity, channel = 0) {
  const padIndex = note % 16;
  if (state.view === "pads" || state.daw.selectedTrackId?.includes("drum")) triggerPad(padIndex, velocity, false, true);
  else playSynthNote(midiNoteName(note).replace(/[0-9-]/g, ""), note % 12, velocity, true);
  if (state.daw.midi.recordEnabled) recordMidiNoteOn(note, velocity, channel);
}

function midiNoteOff(note, channel = 0) {
  releasePad(note % 16);
  releaseSynthNote(midiNoteName(note).replace(/[0-9-]/g, ""), note % 12);
  if (state.daw.midi.recordEnabled) recordMidiNoteOff(note, channel);
}

function midiControlChange(controller, value, channel = 0) {
  const mapping = state.daw.midiMappings.find((item) => item.controller === controller && (item.channel === channel || item.channel === "all"));
  if (mapping) recordAutomation(mapping.targetPath, value);
}

function learnMidiMapping(targetPath) {
  state.daw.midiMappings.push({ targetPath, controller: 1, channel: "all" });
  saveMidiMappings();
  toast(`MIDI mapping placeholder learned for ${targetPath}. Move a real controller after enabling MIDI to refine it.`);
  render();
}

function saveMidiMappings() {
  localStorage.setItem(STORAGE.midiMappings, JSON.stringify(state.daw.midiMappings));
}

function loadMidiMappings() {
  try {
    state.daw.midiMappings = JSON.parse(localStorage.getItem(STORAGE.midiMappings) || "[]");
  } catch (error) {
    state.daw.midiMappings = [];
  }
}

function recordMidiNoteOn(note, velocity) {
  const patternId = state.daw.selectedPatternId || state.daw.patterns[0]?.id;
  state.daw.notes.push(createNote(patternId, note, Math.round(state.daw.song.playheadBeat), 1, velocity));
}

function recordMidiNoteOff() {
  // Note durations are one beat in the MVP recorder; piano roll editing can resize them.
}

function recordAutomation(targetPath, value) {
  let lane = state.daw.automation.find((item) => item.targetPath === targetPath);
  if (!lane) {
    lane = createAutomationLane(targetPath);
    state.daw.automation.push(lane);
  }
  lane.points.push(createAutomationPoint(lane.id, state.daw.song.playheadBeat, value));
  drawAllCanvases();
}

function importSoundFontPlaceholder(file) {
  state.daw.compatibilityFiles.push({ type: "SoundFont2", name: file.name, size: file.size, playable: false });
  toast("SoundFont2 parsing is planned. This file is listed in the project but not played yet.");
}

function importGusPatchPlaceholder(file) {
  state.daw.compatibilityFiles.push({ type: "GUS Patch", name: file.name, size: file.size, playable: false });
  toast("GUS patch support is a future compatibility hook. Metadata was listed only.");
}

function analyzeBeatForPrompt() {
  const steps = state.sequencer.steps || 16;
  const rows = state.sequencer.pattern || [];
  const activeSteps = rows.reduce((sum, row) => sum + row.slice(0, steps).filter(Boolean).length, 0);
  const densityRatio = activeSteps / Math.max(1, rows.length * steps);
  const density = densityRatio > 0.28 ? "dense" : densityRatio > 0.12 ? "medium" : "sparse";
  const kickSteps = getActiveStepLabels(rows[0], steps);
  const snareSteps = getActiveStepLabels(rows[1] || rows[4], steps);
  const hatSteps = getActiveStepLabels(mergeStepRows(rows[2], rows[3], rows[10]), steps);
  const percussionSteps = getActiveStepLabels(mergeStepRows(...rows.slice(4, 16)), steps);
  const pianoRollNotes = state.pianoRoll.notes || [];
  const dawNotes = state.daw.notes || [];
  const songClips = [
    ...(state.daw.clips || []).map((clip) => `${clip.type} clip ${clip.startBeat}-${clip.startBeat + clip.lengthBeats}`),
    ...(state.song.tracks || []).flatMap((track) => (track.clips || []).map((clip) => `${track.name} ${clip.type} clip bar ${clip.bar}`))
  ];
  const automationMoves = [
    ...(state.automation.lanes || []).map((lane) => `${lane.target} automation ${lane.points?.length || 0} points`),
    ...(state.daw.automation || []).map((lane) => `${lane.targetLabel || lane.targetPath} automation ${lane.points?.length || 0} points`)
  ];
  const touchSummary = summarizeTouchPerformance();
  const loadedStems = state.stems.map((stem) => ({
    name: stem.name,
    role: inferStemRole(stem.name),
    volume: Number(stem.volume).toFixed(2),
    pan: Number(stem.pan).toFixed(2),
    eq: stem.eq,
    effects: [`delay ${Math.round((stem.sendDelay || 0) * 100)}%`, `reverb ${Math.round((stem.sendReverb || 0) * 100)}%`, `filter ${Math.round((stem.filter || 0) * 100)}%`],
    loaded: Boolean(stem.buffer),
    muted: stem.muted,
    solo: stem.solo
  }));
  const activePads = state.pads
    .map((pad, index) => {
      const stepHits = rows[index]?.slice(0, steps).filter(Boolean).length || 0;
      const recentHits = state.touchHistory.filter((touch) => touch.type === "pad" && touch.index === index).length;
      return {
        index: index + 1,
        name: pad.name,
        sample: pad.sampleName || pad.fileName || "",
        mode: pad.mode,
        muted: pad.muted,
        stepHits,
        recentHits,
        velocity: Number(pad.lastVelocity || pad.velocity || 0).toFixed(2)
      };
    })
    .filter((pad) => pad.sample || pad.stepHits || pad.recentHits || Number(pad.velocity) > 0);
  const effects = [
    ...new Set([
      ...state.plugins.filter((plugin) => plugin.enabled && plugin.type === "effect").map((plugin) => plugin.name),
      ...state.daw.effects.filter((plugin) => plugin.enabled).map((plugin) => plugin.name),
      ...loadedStems.flatMap((stem) => stem.effects)
    ])
  ].filter(Boolean);
  const instruments = [
    ...new Set([
      state.synth.wave ? `${state.synth.wave} synth` : "",
      ...state.plugins.filter((plugin) => plugin.enabled && plugin.type === "instrument").map((plugin) => plugin.name),
      ...state.daw.instruments.filter((plugin) => plugin.enabled).map((plugin) => plugin.name),
      ...activePads.map((pad) => pad.sample || pad.name)
    ])
  ].filter(Boolean);
  const deckTracks = Object.values(state.decks).filter((deck) => deck.fileName).map((deck) => `${deck.label}: ${deck.fileName}`);
  const melodicNotes = [
    ...pianoRollNotes.map((note) => midiNoteName(note.note || note.pitch || 60)),
    ...dawNotes.map((note) => midiNoteName(note.pitch || 60))
  ];
  const analysis = {
    bpm: Number(state.bpm || state.daw.song.bpm || 120),
    tempoTerm: tempoTerm(Number(state.bpm || 120)),
    swing: Number(state.sequencer.swing || 0),
    groove: inferGroove(kickSteps, snareSteps, hatSteps, density),
    density,
    energy: "",
    mood: "",
    genre: "",
    subGenres: [],
    drums: {
      kickPattern: kickSteps.join(", ") || "not programmed yet",
      snarePattern: snareSteps.join(", ") || "not programmed yet",
      hatPattern: hatSteps.join(", ") || "not programmed yet",
      percussionNotes: percussionSteps.join(", ") || "light percussion",
      activePads,
      padCount: activePads.length
    },
    stems: loadedStems,
    instruments,
    effects,
    melodic: {
      pianoRollNoteCount: pianoRollNotes.length,
      dawNoteCount: dawNotes.length,
      notes: [...new Set(melodicNotes)].slice(0, 16),
      synth: `${state.synth.wave || "sine"} synth octave ${state.synth.octave}`
    },
    performance: touchSummary,
    songSources: {
      clips: songClips.slice(0, 12),
      automation: automationMoves.slice(0, 8),
      decks: deckTracks
    },
    arrangement: "",
    sonicTags: [],
    musicSourceSummary: "",
    warnings: []
  };
  analysis.genre = inferBeatGenre(analysis);
  analysis.mood = inferBeatMood(analysis);
  analysis.energy = inferBeatEnergy(analysis);
  analysis.arrangement = inferArrangement(analysis);
  analysis.subGenres = inferSubGenres(analysis, deckTracks);
  analysis.sonicTags = buildSonicTags(analysis, deckTracks);
  analysis.musicSourceSummary = buildMusicSourceSummary(analysis);
  if (!analysis.drums.padCount && !loadedStems.some((stem) => stem.loaded) && !deckTracks.length && !analysis.melodic.pianoRollNoteCount && !songClips.length) analysis.warnings.push("Start with a demo, pads, stems, piano roll notes, or decks for a richer prompt.");
  return analysis;
}

function mergeStepRows(...rows) {
  const max = Math.max(0, ...rows.filter(Boolean).map((row) => row.length));
  return Array.from({ length: max }, (_, index) => rows.some((row) => row?.[index]));
}

function getActiveStepLabels(row = [], steps = 16) {
  return row.slice(0, steps).map((active, index) => active ? `${index + 1}` : "").filter(Boolean);
}

function inferStemRole(name = "") {
  const lower = name.toLowerCase();
  if (lower.includes("drum")) return "rhythm";
  if (lower.includes("bass")) return "low end";
  if (lower.includes("vocal")) return "vocal";
  if (lower.includes("key") || lower.includes("melody") || lower.includes("guitar")) return "harmony";
  if (lower.includes("fx")) return "transition texture";
  return "mix element";
}

function tempoTerm(bpm) {
  if (bpm <= 76) return "slow, heavy, spacious";
  if (bpm <= 108) return "mid-tempo groove";
  if (bpm <= 128) return "dance tempo";
  if (bpm <= 150) return "high-energy";
  return "fast breakbeat / drum and bass energy";
}

function inferGroove(kicks, snares, hats, density) {
  const fourFloor = ["1", "5", "9", "13"].every((step) => kicks.includes(step));
  if (fourFloor) return "four-on-the-floor club pulse";
  if (hats.length > snares.length * 2 && hats.length >= 6) return "syncopated hat-driven bounce";
  if (density === "sparse") return "minimal pocket groove";
  return "layered electronic groove";
}

function inferBeatGenre(analysis) {
  const bpm = analysis.bpm;
  const kickNames = analysis.drums.activePads.map((pad) => `${pad.name} ${pad.sample}`.toLowerCase()).join(" ");
  const has808 = /808|sub|kick/.test(kickNames) || analysis.instruments.some((item) => /808|sub bass/i.test(item));
  const trapHats = analysis.drums.hatPattern.split(",").length >= 6 && bpm >= 120 && bpm <= 170;
  if (has808 && trapHats) return "futuristic trap / hip-hop";
  if (analysis.groove.includes("four-on-the-floor") && bpm >= 118 && bpm <= 130) return "future house / dance";
  if (analysis.drums.hatPattern.split(",").length >= 8 && analysis.drums.snarePattern.split(",").length >= 3 && bpm >= 160 && bpm <= 180) return "cyber jungle / drum and bass";
  if (bpm <= 84 && analysis.effects.some((item) => /reverb/i.test(item)) && analysis.instruments.some((item) => /pad|synth/i.test(item))) return "ambient cinematic electronic";
  if (bpm >= 70 && bpm <= 100 && analysis.instruments.some((item) => /key|bell|synth/i.test(item))) return "ambient R&B / neo soul";
  if (analysis.effects.some((item) => /distortion|saturation|drive/i.test(item))) return "industrial cyberpunk electronic";
  return "futuristic electronic hip-hop fusion";
}

function inferBeatMood(analysis) {
  const names = `${analysis.instruments.join(" ")} ${analysis.effects.join(" ")}`.toLowerCase();
  const moods = [];
  if (/reverb|pad|space/.test(names)) moods.push("atmospheric", "dreamy");
  if (/distortion|saturation|drive|industrial/.test(names)) moods.push("gritty", "aggressive");
  if (analysis.bpm <= 100 && /key|bell|pad/.test(names)) moods.push("intimate", "soulful");
  if (analysis.bpm >= 128 && analysis.density === "dense") moods.push("energetic", "club-ready");
  if (/filter|phase|flange/.test(names)) moods.push("futuristic", "mysterious");
  if (!moods.length) moods.push("nocturnal", "cinematic", "neon-lit", "confident");
  return [...new Set(moods)].slice(0, 4).join(", ");
}

function inferBeatEnergy(analysis) {
  if (analysis.bpm >= 151 || analysis.density === "dense") return "high";
  if (analysis.bpm >= 109 || analysis.density === "medium") return "medium-high";
  if (analysis.bpm <= 76 && analysis.density === "sparse") return "low and spacious";
  return "medium";
}

function inferArrangement(analysis) {
  const structure = state.sunoPromptOptions.structure || "intro, verse, chorus, verse, chorus, bridge, final chorus, outro";
  const loadedRoles = analysis.stems.filter((stem) => stem.loaded && !stem.muted).map((stem) => stem.role);
  const stemPhrase = loadedRoles.length ? `featured ${[...new Set(loadedRoles)].join(", ")} stems` : "pad-driven beat elements";
  return `${structure}; build from ${stemPhrase}, then widen with transitions, hook lift, breakdown, and final return.`;
}

function inferSubGenres(analysis, deckTracks = []) {
  const tags = [analysis.genre];
  if (deckTracks.length) tags.push("DJ edit energy");
  if (analysis.mood.includes("dreamy")) tags.push("atmospheric");
  if (analysis.energy.includes("high")) tags.push("club-ready");
  return [...new Set(tags)];
}

function buildSonicTags(analysis, deckTracks = []) {
  const tags = [analysis.tempoTerm, analysis.groove, `${analysis.bpm} BPM`, `${analysis.energy} energy`];
  if (analysis.effects.some((item) => /reverb/i.test(item))) tags.push("wide reverb");
  if (analysis.effects.some((item) => /delay/i.test(item))) tags.push("sync delay");
  if (analysis.stems.some((stem) => stem.loaded && stem.name.toLowerCase().includes("vocal"))) tags.push("vocal stem texture");
  if (analysis.drums.activePads.some((pad) => /808|sub/i.test(`${pad.name} ${pad.sample}`))) tags.push("808 bass");
  if (analysis.drums.activePads.some((pad) => pad.recentHits)) tags.push("live pad performance");
  if (analysis.melodic?.notes?.length) tags.push("piano roll melody");
  if (analysis.songSources?.automation?.length) tags.push("automation movement");
  if (state.pad16Level?.enabled) {
    tags.push({
      velocity: "16-level velocity performance",
      tune: "pitched 808 padline",
      filter: "filter-pad expression",
      probability: "probabilistic ghost notes",
      ratchet: "ratchet rolls",
      slice: "sliced loop chops",
      attack: "envelope pad shaping",
      decay: "envelope pad shaping",
      layer: "layered pad morph"
    }[state.pad16Level.mode] || "16-level pad performance");
  }
  if (state.waveformStudio?.regions?.length) tags.push("waveform region edits");
  if (state.waveformStudio?.crossfades?.length) tags.push("crossfade clip editing");
  if (state.adaptiveArrangement?.scenes?.length) tags.push("adaptive arrangement scenes");
  if (deckTracks.length) tags.push("DJ deck idea");
  return [...new Set(tags)];
}

function summarizeTouchPerformance() {
  const touches = state.touchHistory.slice(-64);
  const padTouches = touches.filter((touch) => touch.type === "pad");
  const keyTouches = touches.filter((touch) => touch.type === "key");
  const averageVelocity = touches.length
    ? touches.reduce((sum, touch) => sum + Number(touch.velocity || 0), 0) / touches.length
    : 0;
  const strongest = [...touches].sort((a, b) => Number(b.velocity || 0) - Number(a.velocity || 0))[0];
  return {
    totalTouches: touches.length,
    padTouches: padTouches.length,
    keyTouches: keyTouches.length,
    averageVelocity: Number(averageVelocity.toFixed(2)),
    strongestHit: strongest ? `${strongest.type} ${strongest.index ?? strongest.note ?? ""} at ${Number(strongest.velocity || 0).toFixed(2)} velocity` : "none yet",
    feel: averageVelocity >= 0.9 ? "hard-hitting touch performance" : averageVelocity >= 0.45 ? "balanced touch dynamics" : touches.length ? "soft touch dynamics" : "no live touches yet"
  };
}

function buildMusicSourceSummary(analysis) {
  const loadedStems = analysis.stems.filter((stem) => stem.loaded && !stem.muted).map((stem) => stem.name);
  const activePads = analysis.drums.activePads.map((pad) => `${pad.name}${pad.stepHits ? ` ${pad.stepHits} steps` : ""}${pad.recentHits ? ` ${pad.recentHits} live hits` : ""}`);
  const parts = [
    `BPM ${analysis.bpm} with ${analysis.groove}`,
    activePads.length ? `Pads: ${activePads.slice(0, 8).join(", ")}` : "",
    loadedStems.length ? `Stems: ${loadedStems.join(", ")}` : "",
    analysis.melodic.notes.length ? `Melody notes: ${analysis.melodic.notes.join(", ")}` : "",
    analysis.songSources.clips.length ? `Arrangement clips: ${analysis.songSources.clips.length}` : "",
    analysis.songSources.decks.length ? `Decks: ${analysis.songSources.decks.join(", ")}` : "",
    analysis.performance.totalTouches ? `Performance: ${analysis.performance.feel}` : "",
    analysis.effects.length ? `Effects: ${analysis.effects.slice(0, 6).join(", ")}` : ""
  ].filter(Boolean);
  return parts.join(" | ");
}

function generateSunoPrompt(options = {}) {
  const analysis = analyzeBeatForPrompt();
  const opts = state.sunoPromptOptions;
  const vocalPhrase = opts.vocalMode === "instrumental" ? "no vocals" : `${opts.vocalMode} in ${opts.language}`;
  const explicit = opts.explicitMode ? "explicit language allowed only if it fits the user-written lyrics" : "clean radio-friendly language";
  const title = opts.songTitle || suggestSunoTitle(analysis);
  const mainInstruments = analysis.instruments.slice(0, 8).join(", ") || "808 drums, sub bass, glassy synth keys, atmospheric pads";
  const production = analysis.effects.slice(0, 8).join(", ") || "wide reverb, tight compression, filtered transitions, polished modern mix";
  const lyricTheme = opts.lyricTheme || "late-night ambition, building something from the ground up, neon city focus, creative breakthrough";
  const drumFeel = `${analysis.groove}; kick ${analysis.drums.kickPattern}; snare ${analysis.drums.snarePattern}; hats ${analysis.drums.hatPattern}`;
  const bass = analysis.instruments.find((item) => /bass|808|sub/i.test(item)) || "deep sub bass";
  const mood = `${analysis.mood}, ${analysis.energy} energy`;
  const sourceLine = analysis.musicSourceSummary ? ` Source inspiration from this local project data: ${analysis.musicSourceSummary}.` : "";
  const simplePrompt = `Create an original ${analysis.genre} song at ${analysis.bpm} BPM with ${drumFeel}, ${bass}, ${mainInstruments}, and ${mood}. Use ${vocalPhrase} with a memorable hook and ${explicit}. Structure: ${opts.structure}. Production: ${production}.${sourceLine}`;
  const stylePrompt = [
    analysis.genre,
    ...analysis.subGenres.filter((item) => item !== analysis.genre).slice(0, 2),
    `${analysis.bpm} BPM`,
    analysis.groove,
    drumFeel,
    bass,
    mainInstruments,
    `${analysis.energy} energy`,
    ...analysis.mood.split(",").map((item) => item.trim()),
    ...production.split(",").map((item) => item.trim()).slice(0, 5),
    ...analysis.sonicTags.slice(0, 8),
    "polished modern mix",
    vocalPhrase,
    opts.structure
  ].filter(Boolean).join(", ");
  const lyricPrompt = opts.vocalMode === "instrumental"
    ? "Instrumental mode selected. No lyrics requested."
    : buildOriginalLyricPrompt(title, lyricTheme, opts.language, opts.vocalMode);
  const instrumentalPrompt = `Create an instrumental version with no vocals, focused on ${analysis.groove}, melodic movement from ${mainInstruments}, drops, transitions, and mix movement. Keep it original at ${analysis.bpm} BPM with ${production}.`;
  const excludePrompt = ["no artist imitation", "no copyrighted lyrics", "no real artist names", "no muddy mix", "no harsh clipping", "no random genre switch", "no long silent intro", "no off-key vocals", "no excessive distortion", "no low-quality demo sound"].join(", ");
  const arrangementNotes = buildArrangementNotes(title, analysis, opts);
  const promptObject = { id: `suno-${Date.now()}`, createdAt: new Date().toISOString(), title, analysis, simplePrompt, stylePrompt, lyricPrompt, instrumentalPrompt, excludePrompt, arrangementNotes };
  state.sunoPrompt = promptObject;
  if (options.save !== false) saveSunoPromptSnapshot(promptObject);
  return promptObject;
}

function generateSunoPromptFromBeatDNA(options = {}) {
  const beatDNA = analyzeBeatDNA();
  const promptObject = generateSunoPrompt({ save: false });
  promptObject.analysis = {
    ...promptObject.analysis,
    ...beatDNA,
    genre: beatDNA.genreGuess,
    subGenres: beatDNA.tags.filter((tag) => tag !== beatDNA.genreGuess).slice(0, 8),
    sonicTags: beatDNA.tags,
    warnings: beatDNA.warnings || []
  };
  promptObject.beatDNA = beatDNA;
  const mainInstruments = promptObject.analysis.instruments?.slice(0, 8).join(", ") || "808 drums, sub bass, glassy synth keys, atmospheric pads";
  const production = promptObject.analysis.effects?.slice(0, 8).join(", ") || "wide reverb, tight compression, filtered transitions, polished modern mix";
  const vocalPhrase = state.sunoPromptOptions.vocalMode === "instrumental" ? "no vocals" : `${state.sunoPromptOptions.vocalMode} in ${state.sunoPromptOptions.language}`;
  const sourceLine = promptObject.analysis.musicSourceSummary ? ` Source inspiration from this local project data: ${promptObject.analysis.musicSourceSummary}.` : "";
  promptObject.simplePrompt = `Create an original ${beatDNA.genreGuess} song at ${beatDNA.bpm} BPM with ${beatDNA.groove}, ${beatDNA.tags.includes("808 bass") ? "deep 808 bass" : "deep bass"}, ${mainInstruments}, and ${beatDNA.mood}. Use ${vocalPhrase} with a memorable hook. Structure: ${state.sunoPromptOptions.structure}. Production: ${production}.${sourceLine}`;
  promptObject.stylePrompt = [
    beatDNA.genreGuess,
    ...beatDNA.tags.filter((tag) => !/BPM|energy/i.test(tag)).slice(0, 10),
    `${beatDNA.bpm} BPM`,
    beatDNA.groove,
    beatDNA.mood,
    production,
    vocalPhrase,
    state.sunoPromptOptions.structure
  ].filter(Boolean).join(", ");
  promptObject.arrangementNotes = buildArrangementNotes(promptObject.title, promptObject.analysis, state.sunoPromptOptions);
  state.sunoPrompt = promptObject;
  if (options.save !== false) saveSunoPromptSnapshot(promptObject);
  return promptObject;
}

function analyzeBeatDNA() {
  const prompt = analyzeBeatForPrompt();
  const rhythm = analyzeRhythmDNA();
  const stems = analyzeStemDNA();
  const pads = analyzePadDNA();
  const keyboard = analyzeKeyboardDNA();
  const arrangement = analyzeSongArrangementDNA();
  const mixer = analyzeMixerDNA();
  const sourceSummary = {
    activePads: pads.activePads.length,
    activeStems: stems.activeStems.length,
    pianoNotes: keyboard.noteCount,
    clips: arrangement.clipCount,
    recentTouches: state.touchHistory.length
  };
  const entropyScore = clamp(
    rhythm.entropy + pads.activePads.length * 2 + stems.activeStems.length * 3 + keyboard.noteCount * 0.5 + arrangement.clipCount + Math.round(mixer.motion * 10),
    1,
    100
  );
  const tags = [...new Set([
    `${prompt.bpm} BPM`,
    prompt.tempoTerm,
    prompt.genre,
    prompt.energy,
    rhythm.tag,
    pads.tag,
    stems.tag,
    keyboard.tag,
    mixer.tag,
    ...prompt.sonicTags
  ].filter(Boolean))].slice(0, 16);
  const analysis = {
    id: makeId("dna"),
    createdAt: new Date().toISOString(),
    projectName: state.projectName,
    bpm: prompt.bpm,
    tempoTerm: prompt.tempoTerm,
    key: state.daw.song.key || "C minor",
    scale: state.settings.pianoRoll?.scaleHighlight || "minor",
    swing: Number(state.sequencer.swing || 0),
    density: prompt.density,
    energy: prompt.energy,
    groove: prompt.groove,
    mood: prompt.mood,
    genreGuess: prompt.genre,
    rhythmSignature: rhythm.signature,
    padSignature: pads.signature,
    stemSignature: stems.signature,
    keyboardSignature: keyboard.signature,
    arrangementSignature: arrangement.signature,
    mixerSignature: mixer.signature,
    entropyScore,
    tags,
    musicSourceSummary: prompt.musicSourceSummary,
    sourceSummary,
    seed: "",
    warnings: prompt.warnings || []
  };
  analysis.seed = hashBeatDNA(analysis);
  state.beatDNA = analysis;
  return analysis;
}

function analyzeRhythmDNA() {
  const rows = state.sequencer.pattern || [];
  const hits = rows.flatMap((row, rowIndex) => row.map((active, step) => active ? `${rowIndex}:${step}` : "").filter(Boolean));
  const kickSteps = rows[0]?.map((active, step) => active ? step : -1).filter((step) => step >= 0) || [];
  const snareSteps = rows[1]?.map((active, step) => active ? step : -1).filter((step) => step >= 0) || [];
  const hatSteps = rows[2]?.map((active, step) => active ? step : -1).filter((step) => step >= 0) || [];
  const density = hits.length / Math.max(1, rows.length * (rows[0]?.length || 64));
  const fourFloor = kickSteps.length >= 4 && kickSteps.every((step) => step % 4 === 0);
  const tag = fourFloor ? "four-on-the-floor" : hatSteps.length > 16 ? "syncopated hats" : density > 0.18 ? "dense drums" : "spacious groove";
  return {
    signature: `${state.bpm}|K${kickSteps.join(".")}|S${snareSteps.join(".")}|H${hatSteps.slice(0, 24).join(".")}|sw${state.sequencer.swing}`,
    entropy: Math.round(density * 80 + new Set(hits).size * 0.25),
    tag
  };
}

function analyzeStemDNA() {
  const activeStems = state.stems.filter((stem) => stem.buffer && !stem.muted);
  const signature = activeStems.map((stem) => `${stem.name}:${Math.round(stem.volume * 100)}:${Math.round(stem.pan * 100)}:${Math.round(stem.filter * 100)}:${stem.trimStart.toFixed(2)}-${stem.trimEnd.toFixed(2)}`).join("|") || "no-loaded-stems";
  const tag = activeStems.some((stem) => /vocal/i.test(stem.name)) ? "vocal stem texture" : activeStems.length ? `${activeStems.length} active stems` : "pad-built beat";
  return { activeStems, signature, tag };
}

function analyzePadDNA() {
  const activePads = state.pads.map((pad, index) => {
    const stepHits = state.sequencer.pattern[index]?.slice(0, state.sequencer.steps).filter(Boolean).length || 0;
    const recentHits = state.touchHistory.filter((touch) => touch.type === "pad" && touch.index === index).length;
    return { pad, index, stepHits, recentHits };
  }).filter(({ pad, stepHits, recentHits }) => pad.buffer || pad.sampleName || pad.lastVelocity || stepHits || recentHits);
  const touches = state.settings.beatDNA.includeTouchHistory ? state.touchHistory.slice(-40) : [];
  const performance = state.pad16Level?.lastPerformance?.slice(-32) || [];
  const modeTags = {
    velocity: "16-level velocity performance",
    tune: "pitched 808 padline",
    filter: "filter-pad expression",
    probability: "probabilistic ghost notes",
    ratchet: "ratchet rolls",
    slice: "sliced loop chops",
    attack: "envelope pad shaping",
    decay: "envelope pad shaping",
    layer: "layered pad morph"
  };
  const signature = activePads.map(({ pad, index, stepHits, recentHits }) => `${index}:${pad.name}:${pad.sampleName || "synth"}:${pad.mode}:${stepHits}:${recentHits}:${Math.round((pad.lastVelocity || 0.7) * 100)}`).join("|")
    + `|touch:${touches.map((touch) => `${touch.type}:${touch.index ?? touch.note}:${Math.round((touch.velocity || 0.5) * 100)}`).join(".")}`
    + `|16:${state.pad16Level?.enabled ? state.pad16Level.mode : "off"}:${performance.map((hit) => `${hit.index}:${hit.valueLabel}`).join(".")}`;
  const tag = state.pad16Level?.enabled ? modeTags[state.pad16Level.mode] || "16-level pad performance" : activePads.some(({ pad }) => /808|kick|sub/i.test(pad.name)) ? "808 bass" : activePads.length ? "touch pad performance" : "default drum pads";
  return {
    activePads,
    touches,
    performance,
    signature,
    tag,
    levelMode: state.pad16Level?.enabled ? state.pad16Level.mode : "off"
  };
}

function analyzeKeyboardDNA() {
  const notes = state.daw.notes || [];
  const pitches = notes.map((note) => note.pitch).slice(-64);
  const pitchClasses = [...new Set(pitches.map((pitch) => pitch % 12))];
  return {
    noteCount: notes.length,
    signature: pitches.length ? `notes:${pitches.join(".")}|pc:${pitchClasses.join(".")}` : `synth:${state.synth.wave}:${state.synth.octave}`,
    tag: notes.length ? `${pitchClasses.length} pitch classes` : `${state.synth.wave} synth`
  };
}

function analyzeSongArrangementDNA() {
  const clips = state.daw.clips || [];
  const tracks = state.daw.tracks || [];
  const regions = state.waveformStudio?.regions || [];
  const markers = state.waveformStudio?.markers || [];
  const crossfades = state.waveformStudio?.crossfades || [];
  const scenes = state.adaptiveArrangement?.scenes || [];
  return {
    clipCount: clips.length,
    regionCount: regions.length,
    markerCount: markers.length,
    crossfadeCount: crossfades.length,
    sceneCount: scenes.length,
    signature: `${state.daw.song.lengthBars}bars|${tracks.map((track) => `${track.type}:${track.name}`).join("|")}|${clips.map((clip) => `${clip.type}:${clip.startBeat}:${clip.lengthBeats}`).join("|")}|regions:${regions.map((region) => `${region.type}:${region.startTime}-${region.endTime}`).join(".")}|markers:${markers.map((marker) => marker.startTime).join(".")}|xf:${crossfades.length}|scenes:${scenes.map((scene) => `${scene.name}:${scene.intensity}`).join(".")}`,
    tag: regions.length ? "waveform region edits" : scenes.length ? "adaptive arrangement scenes" : crossfades.length ? "crossfade clip editing" : clips.length ? "arranged clips" : "live loop idea"
  };
}

function analyzeMixerDNA() {
  const channels = state.daw.mixerChannels?.length ? state.daw.mixerChannels : state.mixerChannels;
  const signature = channels.map((channel) => `${channel.name}:${Math.round((channel.volume ?? 0.8) * 100)}:${Math.round((channel.pan ?? 0) * 100)}:${(channel.effects || []).join("+")}`).join("|");
  const motion = channels.reduce((sum, channel) => sum + Math.abs(channel.pan || 0) + (channel.effects?.length || 0) * 0.1, 0);
  return {
    signature: signature || "master-only",
    motion,
    tag: motion > 1 ? "animated mixer movement" : "clean mix balance"
  };
}

function hashBeatDNA(analysis) {
  const clone = { ...analysis, id: "", createdAt: state.settings.beatDNA.includeTimestamp ? analysis.createdAt : "", seed: "" };
  const text = JSON.stringify(clone);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function seedRandomFromBeatDNA(analysis, salt = "") {
  const entropy = state.beatLottery.includeEntropy && !state.beatLottery.lockToCurrentBeat && !state.settings.beatDNA.deterministicMode
    ? `${Date.now()}:${Math.random()}:${globalThis.crypto?.getRandomValues ? globalThis.crypto.getRandomValues(new Uint32Array(1))[0] : ""}`
    : "";
  const seedText = `${analysis.seed}:${salt}:${state.beatLottery.userSeedText}:${entropy}`;
  let seed = 0;
  for (let index = 0; index < seedText.length; index += 1) seed = Math.imul(seed ^ seedText.charCodeAt(index), 2654435761) >>> 0;
  return function rng() {
    seed += 0x6D2B79F5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getLotteryCatalog() {
  const custom = getCustomLotteryGames();
  return [...LOTTERY_GAME_CATALOG, ...custom];
}

function getLotteryGame(id = state.beatLottery.selectedGameId) {
  return getLotteryCatalog().find((game) => game.id === id) || LOTTERY_GAME_CATALOG[0];
}

function getSelectedLotteryGame() {
  return getLotteryGame(state.beatLottery.selectedGameId);
}

function generateLotteryFromBeat() {
  const analysis = analyzeBeatDNA();
  const game = getSelectedLotteryGame();
  const validation = validateLotteryGameConfig(game);
  if (!validation.valid) {
    toast(validation.message);
    return null;
  }
  const options = state.beatLottery;
  const sets = generateLotterySetsFromBeatDNA(analysis, game, options);
  const result = {
    id: makeId("lottery"),
    createdAt: new Date().toISOString(),
    projectName: state.projectName,
    beatDNAId: analysis.id,
    state: options.selectedState,
    gameId: game.id,
    gameName: game.name,
    method: options.selectedMethod,
    methodLabel: LOTTERY_METHODS.find(([methodId]) => methodId === options.selectedMethod)?.[1] || "Beat DNA",
    setCount: sets.length,
    sets,
    beatSummary: `${analysis.bpm} BPM, ${analysis.groove}, ${analysis.mood}, ${analysis.genreGuess}`,
    disclaimerAccepted: true
  };
  state.beatLottery.lastGenerated = result;
  saveBeatLotteryHistory(result);
  return result;
}

function generateLotterySetsFromBeatDNA(analysis, game, options) {
  const count = clamp(Number(options.setCount) || 5, 1, 25);
  return Array.from({ length: count }, (_, index) => {
    const rng = seedRandomFromBeatDNA(analysis, `${options.selectedMethod}:${game.id}:${index}`);
    if (game.type === "digits") return generateDigitSetFromBeat(rng, game, index + 1, analysis);
    if (game.type === "matrix-special") return generateMatrixSpecialSetFromBeat(rng, game, index + 1, analysis);
    return generateMatrixSetFromBeat(rng, game, index + 1, analysis);
  });
}

function generateDigitSetFromBeat(rng, game, setNumber = 1, analysis = state.beatDNA) {
  const digits = Array.from({ length: game.digitCount }, () => String(Math.floor(rng() * (game.digitMax - game.digitMin + 1)) + game.digitMin));
  const straight = digits.join("");
  const nums = digits.map(Number);
  const sum = nums.reduce((total, number) => total + number, 0);
  const root = sum % 9 || 9;
  const permutations = digitPermutations(digits).slice(0, 24);
  const mirrors = digits.map((digit) => String((Number(digit) + 5) % 10));
  return {
    id: makeId("set"),
    setNumber,
    type: "digits",
    digits,
    straight,
    box: permutations,
    frontPair: straight.slice(0, 2),
    backPair: straight.slice(-2),
    sum,
    root,
    mirrors,
    flag: new Set(digits).size === 1 ? "triple" : new Set(digits).size < digits.length ? "repeat/double" : "all unique",
    beatTags: analysis?.tags?.slice(0, 5) || []
  };
}

function generateMatrixSetFromBeat(rng, game, setNumber = 1, analysis = state.beatDNA) {
  const main = pickMatrixNumbers(rng, game.mainCount, game.mainMin, game.mainMax, game.allowRepeats);
  if (game.sortNumbers) main.sort((a, b) => a - b);
  return {
    id: makeId("set"),
    setNumber,
    type: "matrix",
    main,
    analysis: analyzeNumberSet(main, game.mainMin, game.mainMax),
    beatTags: analysis?.tags?.slice(0, 5) || []
  };
}

function generateMatrixSpecialSetFromBeat(rng, game, setNumber = 1, analysis = state.beatDNA) {
  const set = generateMatrixSetFromBeat(rng, game, setNumber, analysis);
  set.type = "matrix-special";
  set.specialName = game.specialName;
  set.special = Math.floor(rng() * (game.specialMax - game.specialMin + 1)) + game.specialMin;
  return set;
}

function pickMatrixNumbers(rng, count, min, max, allowRepeats = false) {
  const numbers = [];
  const seen = new Set();
  while (numbers.length < count) {
    const number = Math.floor(rng() * (max - min + 1)) + min;
    if (allowRepeats || !seen.has(number)) {
      numbers.push(number);
      seen.add(number);
    }
  }
  return numbers;
}

function analyzeNumberSet(numbers, min, max) {
  const sum = numbers.reduce((total, number) => total + number, 0);
  const odds = numbers.filter((number) => number % 2).length;
  const midpoint = (min + max) / 2;
  const low = numbers.filter((number) => number <= midpoint).length;
  const sorted = [...numbers].sort((a, b) => a - b);
  const consecutivePairs = sorted.filter((number, index) => index && number === sorted[index - 1] + 1).length;
  return { sum, oddEven: `${odds}/${numbers.length - odds}`, lowHigh: `${low}/${numbers.length - low}`, consecutivePairs, spread: sorted[sorted.length - 1] - sorted[0] };
}

function digitPermutations(digits) {
  const results = new Set();
  const walk = (prefix, rest) => {
    if (!rest.length) {
      results.add(prefix.join(""));
      return;
    }
    rest.forEach((digit, index) => walk([...prefix, digit], [...rest.slice(0, index), ...rest.slice(index + 1)]));
  };
  walk([], digits);
  return [...results];
}

function validateLotteryGameConfig(game) {
  if (!game) return { valid: false, message: "Choose a lottery game format first." };
  if (game.type === "custom") return { valid: false, message: "Set up a custom game before generating." };
  if (game.type === "digits") return { valid: game.digitCount > 0, message: "Digit game is missing a digit count." };
  return { valid: game.mainCount > 0 && game.mainMax >= game.mainMin, message: "Matrix game is missing a valid range." };
}

function lotteryCopyText(result, set) {
  const label = `${result.state} ${result.gameName} - ${result.methodLabel}`;
  if (set.type === "digits") {
    const box = state.settings.lottery.showBoxPermutations ? ` - Box: ${set.box.join(" / ")}` : "";
    return `${label} - Straight: ${set.straight}${box} - Beat-seeded entertainment picks. Not a prediction.`;
  }
  const game = getLotteryGame(result.gameId);
  const main = set.main.map((number) => String(number).padStart(2, "0")).join(" ");
  const special = set.special ? ` | ${set.specialName || game.specialName} ${String(set.special).padStart(2, "0")}` : "";
  return `${result.gameName} - ${result.methodLabel} - ${main}${special} - Beat-seeded entertainment picks. Entertainment only. Verify official rules.`;
}

function copyLotterySet(setId) {
  const result = state.beatLottery.lastGenerated;
  const set = result?.sets?.find((item) => item.id === setId);
  if (result && set) clipboardCopy(lotteryCopyText(result, set));
}

function copyAllLotterySets() {
  const result = state.beatLottery.lastGenerated;
  if (!result) return toast("Generate number signals first.");
  clipboardCopy(result.sets.map((set) => lotteryCopyText(result, set)).join("\n"));
}

function getBeatLotteryHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE.beatLotteryHistory) || "[]");
  } catch (error) {
    return [];
  }
}

function saveBeatLotteryHistory(result) {
  const next = [result, ...getBeatLotteryHistory().filter((item) => item.id !== result.id)].slice(0, 100);
  state.beatLottery.history = next;
  localStorage.setItem(STORAGE.beatLotteryHistory, JSON.stringify(next));
}

function clearBeatLotteryHistory() {
  state.beatLottery.history = [];
  localStorage.removeItem(STORAGE.beatLotteryHistory);
  toast("Creative signal history cleared.");
  render();
}

function exportBeatLotteryHistory() {
  exportJson("beat-lottery-history.json", getBeatLotteryHistory());
}

function getCustomLotteryGames() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE.customLotteryGames) || "[]");
  } catch (error) {
    return [];
  }
}

function createCustomLotteryGame(config) {
  const game = {
    id: config.id || makeId("custom-game"),
    scope: "custom",
    name: config.name || "Custom Game",
    type: config.type || "matrix",
    mainCount: Number(config.mainCount || 5),
    mainMin: Number(config.mainMin || 1),
    mainMax: Number(config.mainMax || 39),
    allowRepeats: Boolean(config.allowRepeats),
    sortNumbers: config.sortNumbers !== false,
    specialEnabled: Boolean(config.specialEnabled),
    specialName: config.specialName || "Special",
    specialMin: Number(config.specialMin || 1),
    specialMax: Number(config.specialMax || 20),
    officialUrl: config.officialUrl || "",
    description: "User-created game format. Verify availability and rules with the official source."
  };
  if (game.specialEnabled) game.type = "matrix-special";
  const next = [game, ...getCustomLotteryGames().filter((item) => item.id !== game.id)].slice(0, 25);
  localStorage.setItem(STORAGE.customLotteryGames, JSON.stringify(next));
  state.beatLottery.selectedGameId = game.id;
  toast("Custom game saved.");
  render();
}

function importCustomLotteryGame(json) {
  try {
    createCustomLotteryGame(JSON.parse(json));
  } catch (error) {
    toast("Custom game JSON could not be imported.");
  }
}

function generateBeatCreativeBundle() {
  const beatDNA = analyzeBeatDNA();
  const sunoPrompt = generateSunoPromptFromBeatDNA();
  const videoPrompt = generateVideoPromptFromBeatDNA();
  const lotteryResult = generateLotteryFromBeat();
  const bundle = {
    id: makeId("bundle"),
    createdAt: new Date().toISOString(),
    projectName: state.projectName,
    beatDNA,
    sunoPrompt,
    videoPrompt,
    lotteryResult
  };
  state.beatCreativeBundle = bundle;
  const history = getStoredJson(STORAGE.beatCreativeBundles, []);
  localStorage.setItem(STORAGE.beatCreativeBundles, JSON.stringify([bundle, ...history].slice(0, 25)));
  return bundle;
}

function renderBeatCreativeBundle() {
  const bundle = state.beatCreativeBundle;
  if (!bundle) return "";
  return `
    <section class="creative-bundle-screen">
      <article class="creative-bundle-card">
        <div class="section-head">
          <div><h3>Creative Bundle</h3><p class="micro">Beat DNA, Suno prompt, video prompt, and beat-seeded entertainment picks from one local analysis.</p></div>
          <button type="button" data-action="export-creative-bundle">Export Bundle JSON</button>
        </div>
        <div class="beat-dna-chip">${escapeHtml(bundle.beatDNA.genreGuess)}</div>
        <div class="creative-bundle-video-section">
          <h3>Suno Simple Prompt</h3>
          <p>${escapeHtml(bundle.sunoPrompt.simplePrompt)}</p>
          <button type="button" data-action="copy-suno-all">Copy All Suno</button>
        </div>
        <div class="creative-bundle-video-section">
          <h3>Higgsfield Prompt</h3>
          <p>${escapeHtml(bundle.videoPrompt.higgsfieldPrompt)}</p>
          <button type="button" data-action="copy-video-all">Copy All Video</button>
        </div>
        <div class="creative-bundle-video-section">
          <h3>Kling Prompt</h3>
          <p>${escapeHtml(bundle.videoPrompt.klingPrompt)}</p>
        </div>
        <div class="lottery-number-row">${bundle.lotteryResult?.sets?.slice(0, 3).map((set) => `<span class="lottery-ball">${escapeHtml(set.straight || set.main.join("-"))}</span>`).join("") || ""}</div>
        <button type="button" data-action="copy-lottery-all">Copy All Signals</button>
      </article>
    </section>
  `;
}

function copyBeatDNA() {
  clipboardCopy(JSON.stringify(state.beatDNA || analyzeBeatDNA(), null, 2));
}

function exportBeatDNA() {
  exportJson("beat-dna.json", state.beatDNA || analyzeBeatDNA());
}

function copyCreativeBundle() {
  if (!state.beatCreativeBundle) generateBeatCreativeBundle();
  clipboardCopy(JSON.stringify(state.beatCreativeBundle, null, 2));
}

function exportCreativeBundle() {
  if (!state.beatCreativeBundle) generateBeatCreativeBundle();
  exportJson("beat-creative-bundle.json", state.beatCreativeBundle);
}

function getStoredJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch (error) {
    return fallback;
  }
}

function generateVideoPromptFromBeatDNA(options = {}) {
  const beatDNA = analyzeBeatDNA();
  const videoAnalysis = analyzeBeatForVideo(beatDNA);
  const opts = state.videoPromptOptions;
  const promptObject = {
    id: makeId("video"),
    createdAt: new Date().toISOString(),
    projectName: state.projectName,
    beatDNAId: beatDNA.id,
    platform: opts.platform,
    videoType: opts.videoType,
    aspectRatio: opts.aspectRatio,
    duration: opts.duration,
    beatSummary: `${beatDNA.bpm} BPM, ${beatDNA.genreGuess}, ${beatDNA.groove}, ${beatDNA.mood}`,
    videoAnalysis,
    universalPrompt: buildUniversalVideoPrompt(videoAnalysis, opts),
    higgsfieldPrompt: buildHiggsfieldPrompt(videoAnalysis, opts),
    klingPrompt: buildKlingPrompt(videoAnalysis, opts),
    imageToVideoPrompt: buildImageToVideoPrompt(videoAnalysis, opts),
    shotList: buildVideoShotList(videoAnalysis, opts),
    cameraMotionPrompt: buildCameraMotionPrompt(videoAnalysis, opts),
    editPrompt: buildBeatSyncedEditPrompt(videoAnalysis, opts),
    visualStylePrompt: buildVisualStylePrompt(videoAnalysis, opts),
    negativePrompt: buildVideoNegativePrompt(videoAnalysis, opts),
    storyboard: buildStoryboardFromBeat(videoAnalysis, opts),
    tags: videoAnalysis.tags,
    warnings: videoAnalysis.warnings
  };
  state.videoPrompt = promptObject;
  if (options.save !== false) saveVideoPromptSnapshot(promptObject);
  return promptObject;
}

function analyzeBeatForVideo(beatDNA) {
  const promptAnalysis = analyzeBeatForPrompt();
  const activeStemNames = state.stems.filter((stem) => stem.buffer && !stem.muted).map((stem) => stem.name);
  const loadedFiles = [
    ...state.stems.filter((stem) => stem.fileName).map((stem) => stem.fileName),
    ...Object.values(state.decks).filter((deck) => deck.fileName).map((deck) => deck.fileName),
    state.sampler.fileName,
    state.recorder.fileName
  ].filter(Boolean);
  const effects = [...new Set([
    ...promptAnalysis.effects,
    ...beatDNA.tags.filter((tag) => /reverb|delay|filter|distortion|glitch|motion|energy/i.test(tag))
  ])];
  const analysis = {
    ...beatDNA,
    beatDNA,
    loadedFiles,
    activePads: beatDNA.sourceSummary.activePads,
    activeStems: beatDNA.sourceSummary.activeStems,
    activeStemNames,
    effects,
    drumPattern: promptAnalysis.drums,
    instruments: promptAnalysis.instruments,
    videoMood: "",
    pacing: "",
    cameraMotion: "",
    editStyle: "",
    visualTheme: "",
    subject: state.videoPromptOptions.subject || defaultVideoSubject(beatDNA),
    location: state.videoPromptOptions.location || defaultVideoLocation(beatDNA),
    colorPalette: state.videoPromptOptions.colorPalette,
    warnings: []
  };
  analysis.videoMood = inferVideoMoodFromBeat(analysis);
  analysis.pacing = inferVideoPacingFromBeat(analysis);
  analysis.cameraMotion = inferCameraMotionFromBeat(analysis);
  analysis.editStyle = inferEditStyleFromBeat(analysis);
  analysis.visualTheme = inferVisualThemeFromBeat(analysis);
  analysis.tags = [...new Set([`${analysis.bpm} BPM`, analysis.genreGuess, analysis.energy, analysis.videoMood, analysis.pacing, analysis.cameraMotion, ...beatDNA.tags])].slice(0, 18);
  if (state.videoPromptOptions.safetyMode) analysis.warnings.push("Safety mode is on: prompts avoid copyrighted characters, celebrities, third-party logos, and living artist style imitation.");
  return analysis;
}

function defaultVideoSubject(analysis) {
  if (/ambient|cinematic/i.test(analysis.genreGuess)) return "a glowing audio orb and abstract waveform landscape";
  if (/r&b|soul/i.test(analysis.genreGuess)) return "a futuristic producer and expressive neon dancer";
  if (/jungle|breakbeat/i.test(analysis.genreGuess)) return "a kinetic performer moving through a cyber city corridor";
  return "a futuristic producer controlling glowing drum pads and a Beat DNA orb";
}

function defaultVideoLocation(analysis) {
  if (/ambient|cinematic/i.test(analysis.genreGuess)) return "a floating dark glass sound chamber";
  if (/house|dance/i.test(analysis.genreGuess)) return "a neon warehouse stage with synchronized floor lights";
  if (/jungle|breakbeat/i.test(analysis.genreGuess)) return "a rain-soaked cyber alley with holographic waveform signs";
  return "a neon glass music studio";
}

function inferVideoMoodFromBeat(analysis) {
  const mood = analysis.mood || "";
  const effects = analysis.effects.join(" ").toLowerCase();
  if (/reverb|pad|dream/i.test(`${mood} ${effects}`)) return "dreamy, atmospheric, reflective, neon-lit";
  if (/distortion|drive|gritty|aggressive/i.test(`${mood} ${effects}`)) return "gritty, aggressive, industrial, high contrast";
  if (analysis.bpm >= 151 || /breakbeat|jungle/i.test(analysis.genreGuess)) return "kinetic, urgent, electric, high-motion";
  if (analysis.bpm <= 76) return "slow, heavy, cinematic, shadowy";
  return `${mood || "nocturnal, cinematic, confident"}, music-driven`;
}

function inferVideoPacingFromBeat(analysis) {
  if (analysis.bpm <= 76) return "slow motion, atmospheric pacing, long camera moves";
  if (analysis.bpm <= 108) return "mid-tempo groove, smooth dolly moves, emotional pacing";
  if (analysis.bpm <= 128) return "dance tempo, rhythmic camera moves, steady cuts";
  if (analysis.bpm <= 150) return "high-energy, quick zooms, snap cuts, pulsing lights";
  return "fast breakbeat energy, rapid cuts, kinetic handheld motion, strobe accents";
}

function inferCameraMotionFromBeat(analysis) {
  const requested = state.videoPromptOptions.cameraStyle;
  if (requested && requested !== "cinematic") return `${requested} camera movement shaped by ${analysis.pacing}`;
  if (/four-on-the-floor/i.test(analysis.rhythmSignature + analysis.groove)) return "steady dolly-in with synchronized floor-light pulses";
  if (/808|trap/i.test(analysis.genreGuess + analysis.tags.join(" "))) return "low-angle push-in, slow orbit, bass-drop zoom";
  if (/breakbeat|jungle/i.test(analysis.genreGuess)) return "kinetic handheld chase movement with jump cuts";
  if (/ambient/i.test(analysis.genreGuess)) return "slow floating orbit with dreamlike camera drift";
  return "cinematic dolly-in, smooth orbit, and quick zoom on the drop";
}

function inferEditStyleFromBeat(analysis) {
  const requested = state.videoPromptOptions.editStyle;
  if (requested && requested !== "beat-synced cuts") return requested;
  if (analysis.density === "dense") return "fast edits, glitch cuts, strobes, match cuts, and motion trails";
  if (analysis.density === "sparse") return "wide shots, breathing space, cinematic negative space, slow dissolves";
  return "beat-synced cuts on kick and snare, particle trails on hi-hats, smooth transitions on filter sweeps";
}

function inferVisualThemeFromBeat(analysis) {
  if (state.videoPromptOptions.visualTheme) return state.videoPromptOptions.visualTheme;
  if (/r&b|soul/i.test(analysis.genreGuess)) return "dark cyber R&B with reflective glass, soft neon haze, and intimate close-ups";
  if (/house|dance/i.test(analysis.genreGuess)) return "neon club futurism with synchronized floor lights and glossy motion";
  if (/jungle|breakbeat/i.test(analysis.genreGuess)) return "cyber jungle breakbeat chase with waveform graffiti and kinetic city light";
  if (/ambient|cinematic/i.test(analysis.genreGuess)) return "dreamlike ambient visualizer with floating audio particles and slow orbital light";
  return "futuristic cyber music-video studio with Beat DNA holograms, glowing pads, and stem mixer lights";
}

function buildUniversalVideoPrompt(videoAnalysis, options) {
  return `Create a ${options.duration} ${options.aspectRatio} ${titleCase(options.videoType.replace(/-/g, " "))} for an original beat at ${videoAnalysis.bpm} BPM. Visual mood: ${videoAnalysis.videoMood}. Genre energy: ${videoAnalysis.genreGuess}, ${videoAnalysis.energy}. Scene: ${videoAnalysis.subject} in ${videoAnalysis.location}. Camera: ${videoAnalysis.cameraMotion}. Editing: ${videoAnalysis.editStyle}. Lighting: ${options.colorPalette}, volumetric haze, glossy reflections. Sync visuals to the kick, snare, hi-hats, bass pulses, drops, and filter sweeps. Include ${buildVideoElements(videoAnalysis, options)}. Avoid ${buildVideoNegativePrompt(videoAnalysis, options)}.`;
}

function buildHiggsfieldPrompt(videoAnalysis, options) {
  return `Cinematic viral short-form music-video moment: ${videoAnalysis.subject} activates a glowing Beat DNA orb inside ${videoAnalysis.location}. Camera starts with ${videoAnalysis.cameraMotion}, then snaps into a bass-drop zoom. Every kick triggers cyan floor pulses, every snare flashes magenta, and hi-hats create sparkling particle trails. ${videoAnalysis.energy} ${videoAnalysis.genreGuess} mood, ${videoAnalysis.bpm} BPM, ${options.colorPalette} palette, glossy reflections, dramatic haze, premium short-form music promo. Viral hook line: the room transforms from silence into a living audio DNA machine. Camera movement line: ${videoAnalysis.cameraMotion}. Beat sync line: ${buildBeatSyncLine(videoAnalysis)}. Social crop note: keep the subject and glowing orb centered for ${options.aspectRatio}. Preset suggestion: cinematic camera control, neon city, music visualizer, viral transformation.`;
}

function buildKlingPrompt(videoAnalysis, options) {
  return `Generate a cinematic ${options.duration} video. Subject: ${videoAnalysis.subject} in ${videoAnalysis.location}. Action: glowing drum pads, stem mixer meters, and holographic waveforms move in sync with the beat while an audio DNA helix forms at the center of the scene. Camera: ${videoAnalysis.cameraMotion}. Style: ${videoAnalysis.visualTheme}, ${options.colorPalette} lighting, realistic reflections, volumetric haze, clean scene continuity. Motion should follow a ${videoAnalysis.bpm} BPM ${videoAnalysis.genreGuess} beat with ${videoAnalysis.groove}. Maintain subject consistency, smooth physical motion, readable silhouettes, and stable lighting. If audio is added later, align pulses to kick, snare, hi-hat, bass drop, and filter sweeps. Negative prompt: ${buildVideoNegativePrompt(videoAnalysis, options)}.`;
}

function buildImageToVideoPrompt(videoAnalysis, options) {
  return `Animate the uploaded image as a ${videoAnalysis.visualTheme} scene. Start image description: ${videoAnalysis.subject} in ${videoAnalysis.location}, surrounded by glowing waveform rings and studio light reflections. Motion instruction: keep the main subject consistent while waveform rings pulse to the beat, drum pads flash on kicks and snares, and mixer lights bounce with the groove. Camera movement: ${videoAnalysis.cameraMotion}. Beat sync instruction: ${buildBeatSyncLine(videoAnalysis)}. Background movement: subtle haze, reflections, particle trails, and color shifts on filter sweeps. End frame instruction: end with the Beat DNA orb glowing brighter on the final hit. Negative prompt: ${buildVideoNegativePrompt(videoAnalysis, options)}.`;
}

function buildVideoShotList(videoAnalysis, options) {
  const seconds = parseInt(options.duration, 10) || 10;
  const long = seconds >= 15;
  const shots = [
    ["0:00-0:02", "Intro pulse", "Dark studio boots up, waveform appears.", "Slow push-in.", "First kick triggers cyan light."],
    ["0:02-0:05", "Pad performance", "Glowing touch pads fire in rhythm.", "Low-angle pan across pads.", "Snare flashes magenta."],
    ["0:05-0:08", "Beat DNA reveal", "Stems twist into an audio DNA helix.", "Orbit camera.", "Hi-hats become particle sparks."],
    ["0:08-0:10", "Final hit", "Central orb expands on the drop.", "Quick zoom and shimmer.", "Bass impact creates a wave ripple."]
  ];
  if (long) {
    shots.splice(3, 0,
      ["0:08-0:12", "Build section", "Mixer faders rise and lights intensify.", "Speed ramp into a glide.", "Filter sweep opens the scene."],
      ["0:12-0:15", "Hook / drop", "Subject silhouette is framed by waveform rings.", "Snap zoom to wide shot.", "Kick and snare drive hard cuts."]
    );
  }
  if (seconds >= 30) {
    shots.push(
      ["0:15-0:22", "Breakdown", "Room floats in slow motion with echo trails.", "Slow orbit.", "Delay creates repeated silhouettes."],
      ["0:22-0:30", "Final chorus", "Full neon studio blooms with synchronized lights.", "Dolly-out to hero frame.", "Every drum layer triggers a different color lane."]
    );
  }
  return shots.map(([time, title, visual, motion, sync]) => `${time} - ${title}\nVisual: ${visual}\nMotion: ${motion}\nBeat sync: ${sync}`).join("\n\n");
}

function buildCameraMotionPrompt(videoAnalysis, options) {
  return `Camera direction: ${videoAnalysis.cameraMotion}. Use ${options.cameraStyle} framing with ${options.motionIntensity} motion intensity. Begin with a readable subject frame, move into the beat-driven action, then land on the strongest visual object at the drop. Keep movement musical: kick pulses push the camera forward, snare hits trigger quick reframes, hi-hats add tiny sparkle trails, and filter sweeps open the lens or tunnel perspective.`;
}

function buildBeatSyncedEditPrompt(videoAnalysis, options) {
  return `Editing direction: ${videoAnalysis.editStyle}. Cut on the kick and snare, use micro flashes or spark trails for hi-hats, create speed ramps for fills, and widen the frame at the hook/drop. Match the ${videoAnalysis.bpm} BPM ${videoAnalysis.groove} without excessive shake. Use ${options.editStyle} while preserving subject continuity and clean scene readability.`;
}

function buildVideoNegativePrompt(videoAnalysis, options) {
  const base = ["blurry", "low quality", "warped hands", "extra fingers", "unreadable text", "random logos", "watermark", "distorted face", "flickering subject", "inconsistent character", "messy background", "poor lighting", "off-beat motion", "excessive camera shake"];
  if (options.safetyMode) base.push("copyrighted logo", "celebrity likeness", "brand imitation", "living artist imitation", "copyrighted character");
  if (options.negativePromptStrength === "strong") base.push("text artifacts", "deformed instruments", "unstable camera", "overexposed neon");
  return [...new Set(base)].join(", ");
}

function buildStoryboardFromBeat(videoAnalysis, options) {
  return `Storyboard for ${options.duration} ${options.aspectRatio} ${options.videoType}:\n\n${buildVideoShotList(videoAnalysis, options)}\n\nVisual theme: ${videoAnalysis.visualTheme}\nCamera: ${videoAnalysis.cameraMotion}\nEdit: ${videoAnalysis.editStyle}`;
}

function buildVisualStylePrompt(videoAnalysis, options) {
  return `${videoAnalysis.visualTheme}. Color palette: ${options.colorPalette}. Lighting should feel high contrast, dark neon, cinematic, and music-driven. Use clean original subjects, no third-party logos, no copyrighted characters, no celebrity likeness, and no living artist imitation.`;
}

function buildVideoElements(videoAnalysis, options) {
  const elements = ["glowing drum pads", "stem mixer faders", "holographic waveform rings", "audio DNA helix", "beat-reactive lights"];
  if (videoAnalysis.activeStemNames.some((name) => /vocal/i.test(name))) elements.push("generic face-safe performer close-up with optional lip movement placeholder");
  if (videoAnalysis.activeStemNames.some((name) => /bass/i.test(name))) elements.push("sub bass ripples through the floor");
  if (videoAnalysis.activeStemNames.some((name) => /keys/i.test(name))) elements.push("floating piano roll notes");
  if (options.includeLyricsOnScreen) elements.push("short original lyric fragments as clean editable screen text");
  if (options.includeProductShot) elements.push("brief original product-style hero shot of the Beat DNA orb interface");
  return elements.join(", ");
}

function buildBeatSyncLine(videoAnalysis) {
  return `kick pulses drive floor light, snare triggers magenta flashes, hi-hats create sparkle trails, bass drops create ripple shockwaves, and filter sweeps shift aperture and color.`;
}

function copyVideoPrompt(section) {
  const prompt = state.videoPrompt || generateVideoPromptFromBeatDNA();
  const map = {
    universal: prompt.universalPrompt,
    higgsfield: prompt.higgsfieldPrompt,
    kling: prompt.klingPrompt,
    "image-to-video": prompt.imageToVideoPrompt,
    "shot-list": prompt.shotList,
    camera: prompt.cameraMotionPrompt,
    edit: prompt.editPrompt,
    negative: prompt.negativePrompt
  };
  clipboardCopy(map[section] || buildVideoPromptText(prompt));
}

function copyAllVideoPrompts() {
  clipboardCopy(buildVideoPromptText(state.videoPrompt || generateVideoPromptFromBeatDNA()));
}

function buildVideoPromptText(promptObject) {
  return [
    `UNIVERSAL VIDEO PROMPT\n${promptObject.universalPrompt}`,
    `HIGGSFIELD-READY PROMPT\n${promptObject.higgsfieldPrompt}`,
    `KLING-READY PROMPT\n${promptObject.klingPrompt}`,
    `IMAGE-TO-VIDEO PROMPT\n${promptObject.imageToVideoPrompt}`,
    `SHOT LIST / STORYBOARD\n${promptObject.shotList}`,
    `CAMERA MOTION PROMPT\n${promptObject.cameraMotionPrompt}`,
    `BEAT-SYNCED EDIT PROMPT\n${promptObject.editPrompt}`,
    `NEGATIVE PROMPT\n${promptObject.negativePrompt}`
  ].join("\n\n---\n\n");
}

function getVideoPromptHistory() {
  return getStoredJson(STORAGE.videoPrompts, []);
}

function saveVideoPromptSnapshot(promptObject) {
  if (!state.settings.videoPrompt?.savePromptHistory) return;
  const record = {
    id: promptObject.id,
    createdAt: promptObject.createdAt,
    projectName: promptObject.projectName,
    bpm: promptObject.videoAnalysis.bpm,
    platform: promptObject.platform,
    videoType: promptObject.videoType,
    universalPrompt: promptObject.universalPrompt,
    higgsfieldPrompt: promptObject.higgsfieldPrompt,
    klingPrompt: promptObject.klingPrompt,
    imageToVideoPrompt: promptObject.imageToVideoPrompt,
    shotList: promptObject.shotList,
    cameraMotionPrompt: promptObject.cameraMotionPrompt,
    editPrompt: promptObject.editPrompt,
    negativePrompt: promptObject.negativePrompt,
    beatDNA: promptObject.videoAnalysis.beatDNA,
    options: { ...state.videoPromptOptions }
  };
  const next = [record, ...getVideoPromptHistory().filter((item) => item.id !== record.id)].slice(0, 25);
  localStorage.setItem(STORAGE.videoPrompts, JSON.stringify(next));
}

function clearVideoPromptHistory() {
  localStorage.removeItem(STORAGE.videoPrompts);
  toast("Video prompt history cleared.");
  render();
}

function setVideoPromptOption(key, value) {
  if (!key) return;
  state.videoPromptOptions[key] = value;
  state.videoPrompt = null;
}

function exportVideoPromptJson() {
  exportJson("beat-video-prompt.json", state.videoPrompt || generateVideoPromptFromBeatDNA());
}

function buildOriginalLyricPrompt(title, theme, language, vocalMode) {
  return `[Intro]\nNeon hum, low lights, the city starts to breathe\n\n[Verse 1]\nBuilding from a spark with the bass under my feet\nEvery little step turns the pressure into heat\nNo borrowed shine, just a signal of our own\nRising through the static till the whole room knows\n\n[Pre-Chorus]\nHold the line, let the night open wide\nWe made a map out of rhythm and drive\n\n[Chorus]\nWe light the room with the sound we made\nBassline moving like a midnight wave\nNo looking back, we're awake, we're alive\nTurning sparks into stars tonight\n\n[Verse 2]\nLate-night focus with the skyline in the glass\nNew dream loading while the old doubts pass\n\n[Bridge]\nStrip it down, let the heart hit clear\nThen bring the drums back when the future gets near\n\n[Final Chorus]\nWe light the room with the sound we made\nBassline moving like a midnight wave\nNo looking back, we're awake, we're alive\nTurning sparks into stars tonight\n\n[Outro]\nLet the echo fade, but keep the fire bright\n\nDirection: original ${language} lyrics for "${title}" about ${theme}; ${vocalMode}; no artist names, no copied lyric references.`;
}

function buildArrangementNotes(title, analysis, opts) {
  const source = analysis.musicSourceSummary ? `Music source snapshot: ${analysis.musicSourceSummary}\n` : "";
  return `Suggested title: ${title}\nSuggested tags: ${analysis.subGenres.join(", ")}, ${analysis.sonicTags.join(", ")}\nSuggested vocal mode: ${opts.vocalMode}\nSuggested key: ${state.daw.song.key || "C minor placeholder; no key detection yet"}\nSuggested BPM: ${analysis.bpm}\n${source}\n0:00 Intro - filtered atmosphere, pads, or DJ texture introduce the ${analysis.mood} mood.\n0:15 Beat enters - ${analysis.groove}; kick ${analysis.drums.kickPattern}; hats ${analysis.drums.hatPattern}.\n0:30 Verse - bass and main instruments carry space for vocals or lead melody.\n1:00 Hook - widen reverb, lift drums, brighten synths, make the hook memorable.\n1:30 Breakdown - reduce drums, feature stem textures, automation, or a vocal/ad-lib moment.\n2:00 Final hook - bring back full rhythm, strongest bass, and polished master energy.\nOutro - remove layers gradually and end cleanly.\n\nReminder: this prompt is based on the current local project only.`;
}

function suggestSunoTitle(analysis) {
  if (state.projectName && state.projectName !== "Untitled Stem Studio Session") return state.projectName;
  if (analysis.mood.includes("nocturnal")) return "Neon After Hours";
  if (analysis.energy.includes("high")) return "Circuit Bloom";
  return "Made From Sparks";
}

function copySunoPrompt(section) {
  const prompt = state.sunoPrompt || generateSunoPromptFromBeatDNA();
  const map = {
    simple: prompt.simplePrompt,
    style: prompt.stylePrompt,
    lyrics: prompt.lyricPrompt,
    instrumental: prompt.instrumentalPrompt,
    exclude: prompt.excludePrompt,
    arrangement: prompt.arrangementNotes
  };
  clipboardCopy(map[section] || buildPromptText(prompt));
}

function copyAllSunoPrompts() {
  clipboardCopy(buildPromptText(state.sunoPrompt || generateSunoPromptFromBeatDNA()));
}

function buildPromptText(promptObject) {
  const sourceSnapshot = promptObject.analysis?.musicSourceSummary
    ? [`MUSIC SOURCE SNAPSHOT\n${promptObject.analysis.musicSourceSummary}`]
    : [];
  return [
    ...sourceSnapshot,
    `SIMPLE MODE PROMPT\n${promptObject.simplePrompt}`,
    `CUSTOM STYLE PROMPT\n${promptObject.stylePrompt}`,
    `LYRICS / HOOK PROMPT\n${promptObject.lyricPrompt}`,
    `INSTRUMENTAL PROMPT\n${promptObject.instrumentalPrompt}`,
    `EXCLUDE PROMPT\n${promptObject.excludePrompt}`,
    `ARRANGEMENT NOTES\n${promptObject.arrangementNotes}`
  ].join("\n\n---\n\n");
}

async function clipboardCopy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Copied.");
  } catch (error) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      toast("Copied.");
    } catch (copyError) {
      toast("Clipboard unavailable. Select and copy manually.");
    }
    textarea.remove();
  }
}

async function copyText(text) {
  await clipboardCopy(text);
}

function getSunoPromptHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE.sunoPrompts) || "[]");
  } catch (error) {
    return [];
  }
}

function saveSunoPromptSnapshot(promptObject) {
  if (!state.settings.project.savePromptHistory) return;
  const record = {
    id: promptObject.id,
    createdAt: promptObject.createdAt,
    projectName: state.projectName,
    bpm: promptObject.analysis.bpm,
    genre: promptObject.analysis.genre,
    mood: promptObject.analysis.mood,
    simplePrompt: promptObject.simplePrompt,
    stylePrompt: promptObject.stylePrompt,
    lyricPrompt: promptObject.lyricPrompt,
    instrumentalPrompt: promptObject.instrumentalPrompt,
    excludePrompt: promptObject.excludePrompt,
    arrangementNotes: promptObject.arrangementNotes
  };
  const next = [record, ...getSunoPromptHistory().filter((item) => item.id !== record.id)].slice(0, 25);
  localStorage.setItem(STORAGE.sunoPrompts, JSON.stringify(next));
}

function clearSunoPromptHistory() {
  localStorage.removeItem(STORAGE.sunoPrompts);
  toast("Suno prompt history cleared.");
  render();
}

function restoreSunoPromptSnapshot(id) {
  const record = getSunoPromptHistory().find((item) => item.id === id);
  if (!record) return;
  state.sunoPrompt = {
    id: record.id,
    createdAt: record.createdAt,
    title: record.projectName,
    analysis: {
      bpm: record.bpm,
      genre: record.genre,
      mood: record.mood,
      energy: "saved",
      tempoTerm: tempoTerm(record.bpm),
      groove: "saved prompt snapshot",
      density: "saved",
      subGenres: [record.genre],
      sonicTags: [],
      warnings: [],
      drums: { activePads: [], padCount: 0 },
      stems: [],
      instruments: [],
      effects: [],
      arrangement: ""
    },
    simplePrompt: record.simplePrompt,
    stylePrompt: record.stylePrompt,
    lyricPrompt: record.lyricPrompt,
    instrumentalPrompt: record.instrumentalPrompt,
    excludePrompt: record.excludePrompt,
    arrangementNotes: record.arrangementNotes || ""
  };
  toast("Prompt snapshot restored.");
  render();
}

function setSunoOption(key, value) {
  if (!key) return;
  state.sunoPromptOptions[key] = value;
  state.sunoPrompt = null;
}

function addMixerChannel() {
  const index = state.mixerChannels.length + 1;
  state.mixerChannels.push({
    id: `mix-${Date.now()}`,
    name: `Mixer ${index}`,
    volume: 0.78,
    pan: 0,
    effects: [],
    color: COLORS[index % COLORS.length]
  });
  toast(`Mixer ${index} added.`);
  render();
}

function addMixerEffect() {
  const channel = state.mixerChannels[state.mixerChannels.length - 1];
  if (!channel) return addMixerChannel();
  const enabled = state.plugins.filter((plugin) => plugin.enabled && plugin.type === "effect");
  const next = enabled[channel.effects.length % Math.max(1, enabled.length)]?.name || "Three-Band EQ";
  channel.effects.push(next);
  toast(`${next} added to ${channel.name}.`);
  render();
}

function randomGroove() {
  state.sequencer.pattern = state.sequencer.pattern.map((row, rowIndex) => row.map((_, step) => {
    if (rowIndex === 0) return step % 4 === 0 || Math.random() < 0.05;
    if (rowIndex === 1) return step % 8 === 4 || Math.random() < 0.04;
    if (rowIndex === 2) return step % 2 === 0 && Math.random() < 0.78;
    return Math.random() < 0.08;
  }));
  toast("Random groove generated.");
  render();
}

function toggleStep(row, step) {
  state.sequencer.pattern[row][step] = !state.sequencer.pattern[row][step];
  queueRender();
}

function seedSamplerToSequencer() {
  if (!state.sampler.buffer) return toast("Load a sampler audio file first.");
  const padIndex = clamp(Number(state.selectedPadIndex) || 0, 0, state.pads.length - 1);
  const pad = state.pads[padIndex];
  pad.buffer = cloneBuffer(state.sampler.buffer);
  pad.sampleName = state.sampler.fileName || "Sampler";
  pad.mode = "one-shot";
  if (!state.sequencer.pattern[padIndex]) state.sequencer.pattern[padIndex] = Array(64).fill(false);
  state.sequencer.pattern[padIndex] = state.sequencer.pattern[padIndex].map((_, step) => step < state.sequencer.steps && step % 4 === 0);
  toast(`${pad.sampleName} assigned to ${pad.name} and written to the sequencer.`);
  render();
}

function switchPadBank(bank) {
  syncCurrentPadBank();
  ensurePadBanks();
  const bankId = ["A", "B", "C", "D"].includes(bank) ? bank : "A";
  state.padBank = bankId;
  state.pads = state.padBanks[bankId].map((pad, index) => clonePadForBank(pad, index, bankId));
  if (state.pad16Level.enabled) generate16LevelPads();
  toast(`Pad bank ${bankId} selected. Samples stay in memory for this session.`);
  queueRender();
}

async function loadFactoryKit(index) {
  const kit = FACTORY_KITS[index] || FACTORY_KITS[0];
  await ensureAudio();
  if (!audioCtx) return;
  KIT_PAD_NAMES.forEach((name, padIndex) => {
    const pad = state.pads[padIndex];
    pad.name = name;
    pad.sampleName = kit.name;
    pad.buffer = createFactoryPadBuffer(kit.tone, padIndex);
    pad.color = padIndex % 4 === 0 ? kit.color : COLORS[(padIndex + index) % COLORS.length];
    pad.gain = kit.tone === "rnb" ? 0.7 : 0.88;
    pad.pitch = 0;
    pad.mode = "one-shot";
    pad.velocity = 0;
    pad.aftertouch = 0;
  });
  state.selectedKitIndex = index;
  state.projectName = `${kit.name} Session`;
  syncCurrentPadBank();
  if (state.pad16Level.enabled) generate16LevelPads();
  toast(`${kit.name} loaded as an original touch-reactive 16-pad kit.`);
  render();
}

function createFactoryPadBuffer(tone, padIndex) {
  const duration = padIndex < 4 ? 0.9 : padIndex < 8 ? 0.55 : 0.38;
  const sampleRate = audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(1, Math.floor(duration * sampleRate), sampleRate);
  const data = buffer.getChannelData(0);
  const base = {
    trap: [46, 176, 8200, 5200, 220, 340, 116, 160],
    techno: [58, 190, 9500, 6100, 260, 420, 126, 184],
    jungle: [54, 210, 11000, 7600, 300, 520, 152, 208],
    garage: [62, 195, 9200, 6800, 250, 390, 136, 190],
    rnb: [44, 150, 7200, 4800, 190, 310, 108, 148]
  }[tone] || [52, 180, 8400, 5600, 240, 360, 120, 170];
  for (let i = 0; i < data.length; i += 1) {
    const t = i / sampleRate;
    const n = Math.random() * 2 - 1;
    let value = 0;
    if (padIndex === 0) value = Math.sin(2 * Math.PI * (base[0] + 62 * Math.exp(-t * 18)) * t) * Math.exp(-t * 8);
    else if (padIndex === 1) value = (Math.sin(2 * Math.PI * base[1] * t) * 0.24 + n * 0.58) * Math.exp(-t * 16);
    else if (padIndex === 2) value = n * Math.exp(-t * 45) * 0.48;
    else if (padIndex === 3) value = n * Math.exp(-t * 10) * 0.36;
    else if (padIndex === 4) value = (n * 0.42 + Math.sin(2 * Math.PI * 230 * t) * 0.18) * Math.exp(-t * 18);
    else if (padIndex === 5) value = Math.sin(2 * Math.PI * base[5] * t) * Math.exp(-t * 20) * 0.5;
    else if (padIndex < 8) value = Math.sin(2 * Math.PI * base[padIndex] * t) * Math.exp(-t * 9) * 0.42;
    else if (padIndex < 12) value = n * Math.exp(-t * (padIndex === 8 ? 3.2 : 7)) * 0.25;
    else value = (Math.sin(2 * Math.PI * (base[0] * (1 + (padIndex - 11) * 0.4)) * t) + n * 0.12) * Math.exp(-t * 12) * 0.34;
    if (tone === "trap" && padIndex === 0) value += Math.sin(2 * Math.PI * 32 * t) * Math.exp(-t * 2.2) * 0.32;
    if (tone === "jungle" && padIndex > 11) value *= Math.sin(2 * Math.PI * 12 * t) > 0 ? 1 : 0.35;
    if (tone === "rnb") value *= 0.72 + 0.18 * Math.sin(2 * Math.PI * 2 * t);
    data[i] = clamp(value, -0.95, 0.95);
  }
  fadeBuffer(buffer, 0, Math.min(0.012, buffer.duration), "in");
  fadeBuffer(buffer, Math.max(0, buffer.duration - 0.035), buffer.duration, "out");
  normalizeBuffer(buffer);
  return buffer;
}

async function loadDrumKitFiles(files) {
  const audioFiles = files
    .filter((file) => file.type.startsWith("audio/") || /\.(wav|aif|aiff|mp3|ogg|flac|m4a)$/i.test(file.name))
    .sort((a, b) => kitSortScore(a.name) - kitSortScore(b.name) || a.name.localeCompare(b.name));
  if (!audioFiles.length) {
    toast("No browser-decodable audio files were found in that folder.");
    return;
  }
  const grouped = new Map();
  audioFiles.forEach((file) => {
    const path = file.webkitRelativePath || file.name;
    const parts = path.split(/[\\/]/).filter(Boolean);
    const groupName = parts.length > 1 ? parts[0] : "Imported Kit";
    if (!grouped.has(groupName)) grouped.set(groupName, []);
    grouped.get(groupName).push(file);
  });
  const kits = [];
  for (const [name, groupFiles] of grouped.entries()) {
    if (kits.length >= 5) break;
    const samples = [];
    for (const file of groupFiles.slice(0, 16)) {
      const buffer = await loadAudioFile(file);
      if (buffer) samples.push({ name: file.name, buffer });
    }
    if (samples.length) kits.push({ name, samples });
  }
  if (!kits.length) {
    toast("The selected kit files could not be decoded by this browser.");
    return;
  }
  state.kits = kits;
  state.selectedKitIndex = 0;
  selectKit(0, true);
  toast(`Imported ${kits.length} local kit folder${kits.length === 1 ? "" : "s"} and mapped the first kit to the pads.`);
  render();
}

function selectKit(index, silent = false) {
  const kit = state.kits[index];
  if (!kit) return;
  state.selectedKitIndex = index;
  kit.samples.slice(0, 16).forEach((sample, padIndex) => {
    state.pads[padIndex].buffer = cloneBuffer(sample.buffer);
    state.pads[padIndex].sampleName = sample.name;
    state.pads[padIndex].name = sample.name.replace(/\.[^.]+$/, "").slice(0, 24) || `Pad ${padIndex + 1}`;
  });
  syncCurrentPadBank();
  if (state.pad16Level.enabled) generate16LevelPads();
  if (!silent) toast(`${kit.name} mapped to the 16 pads.`);
  render();
}

function kitSortScore(name) {
  const lower = name.toLowerCase();
  const terms = ["kick", "bd", "snare", "sd", "clap", "hat", "hh", "tom", "rim", "perc", "shaker", "ride", "crash", "fx", "vox", "stab"];
  const found = terms.findIndex((term) => lower.includes(term));
  return found === -1 ? 99 : found;
}

function clearPad(index) {
  const pad = state.pads[index];
  pad.buffer = null;
  pad.sampleName = "";
  pad.mode = "one-shot";
  syncCurrentPadBank();
  if (state.pad16Level.enabled) generate16LevelPads();
  render();
}

function togglePadMode(index) {
  const pad = state.pads[index];
  pad.mode = pad.mode === "one-shot" ? "loop" : "one-shot";
  syncCurrentPadBank();
  if (state.pad16Level.enabled) generate16LevelPads();
  render();
}

function resetDemoStemChannels() {
  state.stems.forEach((stem) => {
    stopChannel(stem.id, true);
    stem.buffer = null;
    stem.fileName = "";
    stem.trimStart = 0;
    stem.trimEnd = 0;
    stem.playing = false;
    stem.pausedAt = 0;
  });
}

function setupDemoStarterPattern() {
  clearPattern();
  state.sequencer.pattern[0][0] = true;
  state.sequencer.pattern[0][4] = true;
  state.sequencer.pattern[0][8] = true;
  state.sequencer.pattern[0][12] = true;
  state.sequencer.pattern[1][4] = true;
  state.sequencer.pattern[1][12] = true;
  for (let step = 0; step < 16; step += 2) state.sequencer.pattern[2][step] = true;
}

async function loadDefaultDemoStemsFromAssets() {
  await ensureAudio();
  if (!audioCtx || !window.fetch) return false;
  let loaded = 0;
  for (const asset of DEFAULT_DEMO_STEMS) {
    try {
      const response = await fetch(asset.file);
      if (!response.ok) continue;
      const data = await response.arrayBuffer();
      const buffer = await audioCtx.decodeAudioData(data.slice(0));
      const stem = state.stems[asset.stemIndex] || state.stems[0];
      Object.assign(stem, {
        buffer,
        name: asset.name,
        fileName: asset.name,
        trimStart: 0,
        trimEnd: buffer.duration,
        pausedAt: 0,
        playing: false
      });
      loaded += 1;
    } catch (error) {
      console.warn(`Could not load demo stem ${asset.name}`, error);
    }
  }
  return loaded >= 3;
}

async function loadDemoProject(options = {}) {
  await ensureAudio();
  state.projectName = "Neon Stem Demo";
  resetDemoStemChannels();
  const loadedAssetDemo = await loadDefaultDemoStemsFromAssets();
  if (loadedAssetDemo) {
    for (let i = 0; i < 16; i += 1) state.pads[i].buffer = null;
    syncCurrentPadBank();
    if (state.pad16Level.enabled) generate16LevelPads();
    setupDemoStarterPattern();
    if (!options.silent) toast("Default Verse 1 demo stems loaded.");
    render();
    return;
  }
  const seconds = 4;
  const sampleRate = audioCtx.sampleRate;
  const drums = audioCtx.createBuffer(1, seconds * sampleRate, sampleRate);
  const bass = audioCtx.createBuffer(1, seconds * sampleRate, sampleRate);
  const melody = audioCtx.createBuffer(1, seconds * sampleRate, sampleRate);
  fillDemoBuffer(drums, "drums");
  fillDemoBuffer(bass, "bass");
  fillDemoBuffer(melody, "melody");
  Object.assign(state.stems[0], { buffer: drums, fileName: "Built-in synthetic drums", trimStart: 0, trimEnd: drums.duration });
  Object.assign(state.stems[1], { buffer: bass, fileName: "Built-in synthetic bass", trimStart: 0, trimEnd: bass.duration });
  Object.assign(state.stems[3], { buffer: melody, fileName: "Built-in synthetic melody", trimStart: 0, trimEnd: melody.duration });
  for (let i = 0; i < 16; i += 1) state.pads[i].buffer = null;
  syncCurrentPadBank();
  if (state.pad16Level.enabled) generate16LevelPads();
  setupDemoStarterPattern();
  if (!options.silent) toast("Demo project loaded with synthesized stems and a starter pattern.");
  render();
}

function fillDemoBuffer(buffer, type) {
  const data = buffer.getChannelData(0);
  const rate = buffer.sampleRate;
  for (let i = 0; i < data.length; i += 1) {
    const t = i / rate;
    if (type === "drums") {
      const beat = (t * 2) % 1;
      data[i] = Math.sin(2 * Math.PI * 80 * t) * Math.exp(-beat * 20) * 0.8;
      if (((t * 4) % 1) < 0.04) data[i] += (Math.random() * 2 - 1) * 0.18;
    }
    if (type === "bass") data[i] = Math.sin(2 * Math.PI * (55 + Math.floor(t * 2) % 2 * 10) * t) * 0.36;
    if (type === "melody") data[i] = Math.sin(2 * Math.PI * (220 + (Math.floor(t * 4) % 4) * 55) * t) * 0.18;
  }
}

function clearProject() {
  stopAll();
  state.projectName = "Untitled Stem Studio Session";
  state.transport.paused = false;
  state.transport.loop = false;
  state.transport.loopAll = false;
  state.stems = STEM_NAMES.map((name, index) => createStemChannel(name, index));
  state.decks = { a: createDeck("a", "Deck A", COLORS[0]), b: createDeck("b", "Deck B", COLORS[2]) };
  state.pads = createPads();
  state.padBank = "A";
  state.padBanks = {};
  ensurePadBanks();
  state.pad16Level.enabled = false;
  state.pad16Level.generatedPads = [];
  state.pad16Level.lastPerformance = [];
  state.kits = [];
  state.selectedKitIndex = 0;
  state.sampler.buffer = null;
  state.recorder.buffer = null;
  clearPattern();
  toast("Project cleared from the current session.");
  render();
}

function serializeProject(includeBuffers) {
  return {
    app: "LottoMind Stem Studio",
    version: 1,
    savedAt: new Date().toISOString(),
    projectName: state.projectName,
    bpm: state.bpm,
    transport: state.transport,
    master: state.master,
    selectedStemId: state.selectedStemId,
    selectedPadIndex: state.selectedPadIndex,
    keyMappings: state.keyMappings,
    padBank: state.padBank,
    padBanks: Object.fromEntries(Object.entries(state.padBanks || {}).map(([bank, pads]) => [
      bank,
      (pads || []).map((pad) => serializePadProjectData(pad, includeBuffers))
    ])),
    pad16Level: {
      ...state.pad16Level,
      generatedPads: [],
      lastPerformance: (state.pad16Level.lastPerformance || []).slice(-64)
    },
    stems: state.stems.map((stem) => ({
      ...stemMetadata(stem),
      bufferData: includeBuffers && stem.buffer ? serializeBuffer(stem.buffer) : null
    })),
    decks: Object.fromEntries(Object.entries(state.decks).map(([key, deck]) => [key, {
      ...deckMetadata(deck),
      bufferData: includeBuffers && deck.buffer ? serializeBuffer(deck.buffer) : null
    }])),
    pads: state.pads.map((pad) => ({
      ...serializePadProjectData(pad, includeBuffers)
    })),
    kits: state.kits.map((kit) => ({
      name: kit.name,
      samples: kit.samples.map((sample) => ({
        name: sample.name,
        bufferData: includeBuffers && sample.buffer ? serializeBuffer(sample.buffer) : null
      }))
    })),
    song: state.song,
    waveformStudio: serializeWaveformStudioProject(),
    adaptiveArrangement: state.adaptiveArrangement,
    openTools: state.openTools,
    pianoRoll: state.pianoRoll,
    automation: state.automation,
    mixerChannels: state.mixerChannels,
    plugins: state.plugins,
    settings: state.settings,
    sequencer: state.sequencer,
    sampler: {
      fileName: state.sampler.fileName,
      trimStart: state.sampler.trimStart,
      trimEnd: state.sampler.trimEnd,
      bufferData: includeBuffers && state.sampler.buffer ? serializeBuffer(state.sampler.buffer) : null
    }
  };
}

function serializePadProjectData(pad, includeBuffers) {
  return {
    id: pad.id,
    name: pad.name,
    bank: pad.bank,
    mode: pad.mode,
    sampleName: pad.sampleName,
    gain: pad.gain,
    pitch: pad.pitch,
    muted: pad.muted,
    solo: pad.solo,
    color: pad.color,
    envelope: pad.envelope ? { ...pad.envelope } : null,
    probability: pad.probability ?? 1,
    ratchet: pad.ratchet ? { ...pad.ratchet } : null,
    slice: pad.slice ? { ...pad.slice } : null,
    layers: (pad.layers || []).map((layer) => ({
      sampleName: layer.sampleName || "",
      gain: layer.gain ?? 1,
      bufferData: includeBuffers && layer.sampleData ? serializeBuffer(layer.sampleData) : null
    })),
    bufferData: includeBuffers && pad.buffer ? serializeBuffer(pad.buffer) : null
  };
}

function hydratePadProjectData(padData, index = 0, bank = "A") {
  const pad = clonePadForBank({
    ...createPads()[index],
    ...padData,
    buffer: padData.bufferData ? deserializeBuffer(padData.bufferData) : null,
    layers: (padData.layers || []).map((layer) => ({
      sampleName: layer.sampleName || "",
      gain: layer.gain ?? 1,
      sampleData: layer.bufferData ? deserializeBuffer(layer.bufferData) : null
    }))
  }, index, bank);
  return pad;
}

function serializeWaveformStudioProject() {
  const { buffer, clipboard, quickEffect, contextMenu, recording, ...rest } = state.waveformStudio || {};
  return {
    ...rest,
    selection: { ...(state.waveformStudio?.selection || {}) },
    regions: (state.waveformStudio?.regions || []).map((region) => ({ ...region })),
    markers: (state.waveformStudio?.markers || []).map((marker) => ({ ...marker })),
    crossfades: (state.waveformStudio?.crossfades || []).map((fade) => ({ ...fade, curveA: [], curveB: [] })),
    quickEffect: quickEffect ? { ...quickEffect, buffer: null } : null,
    contextMenu: { open: false, x: 0, y: 0, context: null },
    recording: recording ? { ...recording, recorder: null, stream: null, chunks: [] } : null,
    clipboard: null,
    buffer: null
  };
}

async function hydrateProject(payload) {
  await ensureAudio();
  state.projectName = payload.projectName || state.projectName;
  state.bpm = payload.bpm || state.bpm;
  if (payload.master) state.master = { ...state.master, ...payload.master };
  if (payload.transport) state.transport = { ...state.transport, ...payload.transport, paused: false };
  if (payload.settings) state.settings = { ...state.settings, ...payload.settings };
  if (payload.keyMappings) {
    state.keyMappings = sanitizeKeyboardMappings(payload.keyMappings);
    saveKeyboardMappings();
  }
  if (payload.padBank) state.padBank = payload.padBank;
  if (payload.pad16Level) {
    state.pad16Level = {
      ...state.pad16Level,
      ...payload.pad16Level,
      generatedPads: [],
      lastPerformance: Array.isArray(payload.pad16Level.lastPerformance) ? payload.pad16Level.lastPerformance.slice(-64) : []
    };
  }
  if (Array.isArray(payload.stems)) {
    payload.stems.forEach((stemData, index) => {
      const stem = state.stems[index] || createStemChannel(stemData.name || `Stem ${index + 1}`, index);
      Object.assign(stem, stemData, { source: null, nodes: null, playing: false, buffer: stemData.bufferData ? deserializeBuffer(stemData.bufferData) : null });
      state.stems[index] = stem;
    });
  }
  if (payload.decks) {
    Object.entries(payload.decks).forEach(([key, deckData]) => {
      const deck = state.decks[key] || createDeck(key, `Deck ${key.toUpperCase()}`, key === "a" ? COLORS[0] : COLORS[2]);
      Object.assign(deck, deckData, { source: null, nodes: null, playing: false, buffer: deckData.bufferData ? deserializeBuffer(deckData.bufferData) : null });
      state.decks[key] = deck;
    });
  }
  if (Array.isArray(payload.pads)) {
    payload.pads.forEach((padData, index) => {
      Object.assign(state.pads[index], padData, { source: null, active: false, buffer: padData.bufferData ? deserializeBuffer(padData.bufferData) : null });
    });
    syncCurrentPadBank();
  }
  if (payload.padBanks && typeof payload.padBanks === "object") {
    state.padBanks = {};
    Object.entries(payload.padBanks).forEach(([bank, pads]) => {
      state.padBanks[bank] = (pads || []).slice(0, 16).map((padData, index) => hydratePadProjectData(padData, index, bank));
    });
    ensurePadBanks();
    const activeBank = state.padBank || "A";
    state.pads = state.padBanks[activeBank].map((pad, index) => clonePadForBank(pad, index, activeBank));
  }
  if (Array.isArray(payload.kits)) {
    state.kits = payload.kits.slice(0, 5).map((kit) => ({
      name: kit.name,
      samples: (kit.samples || []).slice(0, 16).map((sample) => ({
        name: sample.name,
        buffer: sample.bufferData ? deserializeBuffer(sample.bufferData) : null
      })).filter((sample) => sample.buffer)
    }));
  }
  if (payload.sequencer) {
    state.sequencer = { ...state.sequencer, ...payload.sequencer, playing: false };
  }
  if (payload.sampler) {
    Object.assign(state.sampler, payload.sampler, { source: null, buffer: payload.sampler.bufferData ? deserializeBuffer(payload.sampler.bufferData) : null });
  }
  if (payload.song) state.song = payload.song;
  if (payload.waveformStudio) {
    state.waveformStudio = {
      ...state.waveformStudio,
      ...payload.waveformStudio,
      buffer: null,
      clipboard: null,
      quickEffect: payload.waveformStudio.quickEffect ? { ...payload.waveformStudio.quickEffect, buffer: null } : null,
      contextMenu: { open: false, x: 0, y: 0, context: null },
      recording: { ...state.waveformStudio.recording, ...(payload.waveformStudio.recording || {}), recorder: null, stream: null, chunks: [], active: false }
    };
  }
  if (payload.adaptiveArrangement) state.adaptiveArrangement = { ...state.adaptiveArrangement, ...payload.adaptiveArrangement };
  if (payload.openTools) state.openTools = { ...state.openTools, ...payload.openTools };
  if (payload.pianoRoll) state.pianoRoll = payload.pianoRoll;
  if (payload.automation) state.automation = payload.automation;
  if (Array.isArray(payload.mixerChannels)) state.mixerChannels = payload.mixerChannels;
  if (Array.isArray(payload.plugins)) state.plugins = payload.plugins;
  ensurePadBanks();
  if (state.pad16Level.enabled) generate16LevelPads();
}

function stemMetadata(stem) {
  return {
    id: stem.id,
    name: stem.name,
    fileName: stem.fileName,
    muted: stem.muted,
    solo: stem.solo,
    volume: stem.volume,
    pan: stem.pan,
    eq: stem.eq,
    filter: stem.filter,
    sendDelay: stem.sendDelay,
    sendReverb: stem.sendReverb,
    compressor: stem.compressor,
    trimStart: stem.trimStart,
    trimEnd: stem.trimEnd,
    loop: stem.loop,
    reverse: stem.reverse,
    color: stem.color,
    duration: getBufferDuration(stem),
    exportReady: Boolean(stem.buffer)
  };
}

function deckMetadata(deck) {
  return {
    id: deck.id,
    name: deck.name,
    fileName: deck.fileName,
    cue: deck.cue,
    hotCues: deck.hotCues,
    loopIn: deck.loopIn,
    loopOut: deck.loopOut,
    loop: deck.loop,
    bpm: deck.bpm,
    pitch: deck.pitch,
    volume: deck.volume,
    gain: deck.gain,
    eq: deck.eq,
    filter: deck.filter,
    color: deck.color
  };
}

function exportStemMap() {
  exportJson("lottominded-ultra-stem-map.json", {
    projectName: state.projectName,
    bpm: state.bpm,
    stems: state.stems.map(stemMetadata),
    note: "Stem map contains channel settings and edit metadata only."
  });
}

async function importMidi(file) {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const parsed = parseMidiNotes(bytes);
    if (!parsed.length) {
      toast("MIDI imported, but no note events were found in this simple parser.");
      return;
    }
    state.pianoRoll.notes = parsed.slice(0, 256);
    toast(`Imported ${state.pianoRoll.notes.length} MIDI notes into the Piano Roll.`);
    state.view = "piano roll";
    render();
  } catch (error) {
    console.error(error);
    toast("Could not import this MIDI file.");
  }
}

function exportMidi() {
  const bytes = createMidiFile(state.pianoRoll.notes, state.bpm);
  downloadBlob(new Blob([bytes], { type: "audio/midi" }), "lottominded-ultra.mid");
  toast("MIDI exported from Piano Roll notes.");
}

function parseMidiNotes(bytes) {
  const text = Array.from(bytes.slice(0, 4)).map((byte) => String.fromCharCode(byte)).join("");
  if (text !== "MThd") return [];
  // Browser-safe lightweight import: scan for note-on triplets and map them to a 32-step sketch.
  const notes = [];
  let step = 0;
  for (let i = 0; i < bytes.length - 2 && notes.length < 256; i += 1) {
    const status = bytes[i] & 0xf0;
    if (status === 0x90 && bytes[i + 2] > 0) {
      notes.push({
        note: clamp(bytes[i + 1], state.pianoRoll.lowNote, state.pianoRoll.highNote),
        step: step % state.pianoRoll.steps,
        length: 1,
        velocity: bytes[i + 2] / 127
      });
      step += 1;
    }
  }
  return notes;
}

function createMidiFile(notes, bpm) {
  const ticksPerQuarter = 96;
  const events = [];
  const tempo = Math.round(60000000 / Math.max(1, bpm));
  events.push(...varLen(0), 0xff, 0x51, 0x03, (tempo >> 16) & 255, (tempo >> 8) & 255, tempo & 255);
  const sorted = notes.slice().sort((a, b) => a.step - b.step || a.note - b.note);
  let cursor = 0;
  sorted.forEach((note) => {
    const startTick = Math.round(note.step * (ticksPerQuarter / 4));
    const delta = Math.max(0, startTick - cursor);
    events.push(...varLen(delta), 0x90, note.note, Math.max(1, Math.round((note.velocity || 0.8) * 127)));
    events.push(...varLen(Math.max(12, (note.length || 1) * (ticksPerQuarter / 4))), 0x80, note.note, 0);
    cursor = startTick + Math.max(12, (note.length || 1) * (ticksPerQuarter / 4));
  });
  events.push(0x00, 0xff, 0x2f, 0x00);
  const header = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, (ticksPerQuarter >> 8) & 255, ticksPerQuarter & 255];
  const trackLength = events.length;
  const track = [0x4d, 0x54, 0x72, 0x6b, (trackLength >> 24) & 255, (trackLength >> 16) & 255, (trackLength >> 8) & 255, trackLength & 255, ...events];
  return new Uint8Array([...header, ...track]);
}

function varLen(value) {
  let buffer = value & 0x7f;
  const bytes = [];
  while ((value >>= 7)) {
    buffer <<= 8;
    buffer |= ((value & 0x7f) | 0x80);
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return bytes;
}

function midiNoteName(note) {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return `${names[note % 12]}${Math.floor(note / 12) - 1}`;
}

function renderTimelineRuler() {
  return Array.from({ length: state.daw.song.lengthBars }, (_, index) => `<strong>${index + 1}</strong>`).join("");
}

function renderTrackHeaders() {
  return state.daw.tracks.map((track) => `<strong>${escapeHtml(track.name)}</strong>`).join("");
}

function renderArrangementGrid() {
  return state.daw.tracks.map((track) => renderSongTrack({ ...track, clips: state.daw.clips.filter((clip) => clip.trackId === track.id) })).join("");
}

function renderArrangementClip(clip) {
  return `<button type="button" class="song-clip ${clip.type}" data-action="select-song-clip" data-index="0">${escapeHtml(clip.name)}</button>`;
}

function renderSongEditorToolbar() {
  return `<div class="song-toolbar">${["select", "draw", "split", "erase", "loop"].map((tool) => `<button type="button" data-action="set-daw-tool" data-tool="${tool}" aria-pressed="${state.daw.selectedTool === tool}">${titleCase(tool)}</button>`).join("")}</div>`;
}

function deleteTrack(trackId) {
  state.daw.tracks = state.daw.tracks.filter((track) => track.id !== trackId);
  state.daw.clips = state.daw.clips.filter((clip) => clip.trackId !== trackId);
  render();
}

function duplicateTrack(trackId) {
  const track = state.daw.tracks.find((item) => item.id === trackId);
  if (!track) return;
  const next = { ...track, id: makeId("track"), name: `${track.name} Copy`, clips: [] };
  state.daw.tracks.push(next);
  render();
}

function moveTrack(trackId, direction) {
  const index = state.daw.tracks.findIndex((track) => track.id === trackId);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= state.daw.tracks.length) return;
  const [track] = state.daw.tracks.splice(index, 1);
  state.daw.tracks.splice(next, 0, track);
  render();
}

function addClipToTrack(trackId, type = "pattern") {
  const clip = createClip(trackId, type, state.daw.song.playheadBeat, state.settings.daw.defaultClipLengthBars * 4);
  state.daw.clips.push(clip);
  state.daw.selectedClipId = clip.id;
  render();
}

function splitClip(clipId, beat) {
  const clip = state.daw.clips.find((item) => item.id === clipId);
  if (!clip || beat <= clip.startBeat || beat >= clip.startBeat + clip.lengthBeats) return;
  const rightLength = clip.startBeat + clip.lengthBeats - beat;
  clip.lengthBeats = beat - clip.startBeat;
  state.daw.clips.push({ ...clip, id: makeId("clip"), startBeat: beat, lengthBeats: rightLength, name: `${clip.name} B` });
  render();
}

function duplicateClip(clipId) {
  const clip = state.daw.clips.find((item) => item.id === clipId);
  if (!clip) return;
  state.daw.clips.push({ ...clip, id: makeId("clip"), startBeat: clip.startBeat + clip.lengthBeats });
  render();
}

function deleteClip(clipId) {
  state.daw.clips = state.daw.clips.filter((clip) => clip.id !== clipId);
  render();
}

function resizeClip(clipId, newLengthBeats) {
  const clip = state.daw.clips.find((item) => item.id === clipId);
  if (clip) clip.lengthBeats = Math.max(1, newLengthBeats);
  render();
}

function moveClip(clipId, newStartBeat, newTrackId) {
  const clip = state.daw.clips.find((item) => item.id === clipId);
  if (!clip) return;
  clip.startBeat = Math.max(0, newStartBeat);
  clip.trackId = newTrackId || clip.trackId;
  render();
}

function setLoopRegion(startBeat, endBeat) {
  state.daw.song.loopStartBar = Math.floor(startBeat / 4) + 1;
  state.daw.song.loopEndBar = Math.floor(endBeat / 4) + 1;
  state.daw.song.loopEnabled = true;
}

function setPlayheadBeat(beat) {
  state.daw.song.playheadBeat = Math.max(0, beat);
  drawAllCanvases();
}

function renderPatternGrid() { return renderSequencer(); }
function renderPatternLane() { return ""; }
function togglePatternStep(patternId, laneId, step) {
  const pattern = state.daw.patterns.find((item) => item.id === patternId);
  const lane = pattern?.drumSteps[laneId];
  if (!lane) return;
  lane.steps[step].active = !lane.steps[step].active;
}
function setPatternStepVelocity(patternId, laneId, step, velocity) {
  const pattern = state.daw.patterns.find((item) => item.id === patternId);
  if (pattern?.drumSteps[laneId]) pattern.drumSteps[laneId].steps[step].velocity = velocity;
}
function randomizePattern() { randomGroove(); }
function humanizePattern(patternId) {
  const pattern = state.daw.patterns.find((item) => item.id === patternId);
  if (pattern) pattern.humanize = Math.min(1, pattern.humanize + 0.1);
}
function duplicatePattern(patternId) {
  const pattern = state.daw.patterns.find((item) => item.id === patternId);
  if (pattern) state.daw.patterns.push({ ...structuredClone(pattern), id: makeId("pattern"), name: `${pattern.name} Copy` });
}
function createPatternFromPads() {
  const pattern = createPattern(`Pads ${state.daw.patterns.length + 1}`, 4);
  state.daw.patterns.push(pattern);
  state.daw.selectedPatternId = pattern.id;
}
function sendPatternToSong(patternId) {
  const track = state.daw.tracks.find((item) => item.type === "drum") || state.daw.tracks[0];
  state.daw.clips.push(createClip(track.id, "pattern", state.daw.song.playheadBeat, 16, { patternId }));
  render();
}

function renderPianoRollKeyboard() { return ""; }
function renderPianoRollGrid() { return ""; }
function renderPianoRollNote(note) { return `<span>${midiNoteName(note.pitch)}</span>`; }
function addPianoRollNote(pitch, startBeat, durationBeats, velocity) {
  state.daw.notes.push(createNote(state.daw.selectedPatternId, pitch, startBeat, durationBeats, velocity));
  render();
}
function movePianoRollNote(noteId, pitch, startBeat) {
  const note = state.daw.notes.find((item) => item.id === noteId);
  if (note) Object.assign(note, { pitch, startBeat });
}
function resizePianoRollNote(noteId, durationBeats) {
  const note = state.daw.notes.find((item) => item.id === noteId);
  if (note) note.durationBeats = Math.max(0.25, durationBeats);
}
function deletePianoRollNote(noteId) {
  state.daw.notes = state.daw.notes.filter((note) => note.id !== noteId);
}
function quantizeSelectedNotes() {
  state.daw.notes.forEach((note) => { if (note.selected) note.startBeat = Math.round(note.startBeat * 4) / 4; });
}
function transposeSelectedNotes(semitones) {
  state.daw.notes.forEach((note) => { if (note.selected) note.pitch += semitones; });
}
function duplicateSelectedNotes() {
  state.daw.notes.filter((note) => note.selected).forEach((note) => state.daw.notes.push({ ...note, id: makeId("note"), startBeat: note.startBeat + note.durationBeats }));
}
function selectNotesInRange() { toast("Range selection is wired as a future pointer-drag tool."); }
function previewNote(pitch, velocity) { playSynthNote(midiNoteName(pitch).replace(/[0-9-]/g, ""), pitch % 12, velocity); }

function setMixerVolume(channelId, value) { const ch = state.daw.mixerChannels.find((item) => item.id === channelId); if (ch) ch.volume = value; }
function setMixerPan(channelId, value) { const ch = state.daw.mixerChannels.find((item) => item.id === channelId); if (ch) ch.pan = value; }
function toggleMixerMute(channelId) { const ch = state.daw.mixerChannels.find((item) => item.id === channelId); if (ch) ch.muted = !ch.muted; }
function toggleMixerSolo(channelId) { const ch = state.daw.mixerChannels.find((item) => item.id === channelId); if (ch) ch.solo = !ch.solo; }
function setMixerEq(channelId, band, value) { const ch = state.daw.mixerChannels.find((item) => item.id === channelId); if (ch) ch.eq[band] = value; }
function addEffectToChannel(channelId, effectType) { const ch = state.daw.mixerChannels.find((item) => item.id === channelId); if (ch) ch.effects.push(createEffectPlugin(effectType)); }
function removeEffectFromChannel(channelId, effectId) { const ch = state.daw.mixerChannels.find((item) => item.id === channelId); if (ch) ch.effects = ch.effects.filter((effect) => effect.id !== effectId); }
function moveEffect(channelId, effectId, direction) { const ch = state.daw.mixerChannels.find((item) => item.id === channelId); if (!ch) return; const i = ch.effects.findIndex((effect) => effect.id === effectId); const n = i + direction; if (i >= 0 && n >= 0 && n < ch.effects.length) ch.effects.splice(n, 0, ch.effects.splice(i, 1)[0]); }
function setEffectParam(channelId, effectId, param, value) { const ch = state.daw.mixerChannels.find((item) => item.id === channelId); const effect = ch?.effects.find((item) => item.id === effectId); if (effect) effect.params[param] = value; }
function routeChannel(channelId, outputId) { const ch = state.daw.mixerChannels.find((item) => item.id === channelId); if (ch) ch.output = outputId; }
function createSendBus(name) { const bus = createMixerChannel(name, "send"); state.daw.mixerChannels.push(bus); return bus; }
function setSendAmount(channelId, sendId, value) { const ch = state.daw.mixerChannels.find((item) => item.id === channelId); if (ch) ch.sends.push({ sendId, value }); }

function createNeonSynth() { return createInstrumentPlugin("neon-synth"); }
function createSubBass() { return createInstrumentPlugin("sub-bass"); }
function create808Engine() { return createInstrumentPlugin("808-engine"); }
function createFmBell() { return createInstrumentPlugin("fm-bell"); }
function createWavetablePad() { return createInstrumentPlugin("wavetable-pad"); }
function createDrumSynth() { return createInstrumentPlugin("drum-synth"); }
function createSamplerInstrument() { return createInstrumentPlugin("sampler"); }
function createSoundFontPlayerPlaceholder() { return createInstrumentPlugin("soundfont-placeholder"); }
function createEffect(type) { return createEffectPlugin(type); }
function createEq3() { return createEffectPlugin("eq3"); }
function createCompressor() { return createEffectPlugin("compressor"); }
function createLimiter() { return createEffectPlugin("limiter"); }
function createDelay() { return createEffectPlugin("delay"); }
function createReverb() { return createEffectPlugin("reverb"); }
function createDistortion() { return createEffectPlugin("distortion"); }
function createSaturation() { return createEffectPlugin("saturation"); }
function createBitcrusher() { return createEffectPlugin("bitcrusher"); }
function createChorus() { return createEffectPlugin("chorus"); }
function createFlanger() { return createEffectPlugin("flanger"); }
function createPhaser() { return createEffectPlugin("phaser"); }
function createAutoFilter() { return createEffectPlugin("auto-filter"); }
function createGate() { return createEffectPlugin("gate"); }
function createStereoWidener() { return createEffectPlugin("stereo-widener"); }
function createSpectrumAnalyzer() { return createEffectPlugin("spectrum"); }

function renderAutomationEditor() { return renderAutomation(); }
function moveAutomationPoint(pointId, beat, value) { state.daw.automation.forEach((lane) => lane.points.forEach((point) => { if (point.id === pointId) Object.assign(point, { beat, value }); })); }
function deleteAutomationPoint(pointId) { state.daw.automation.forEach((lane) => { lane.points = lane.points.filter((point) => point.id !== pointId); }); }
function evaluateAutomation(lane, beat) { const points = lane.points.slice().sort((a, b) => a.beat - b.beat); return points.findLast?.((point) => point.beat <= beat)?.value ?? lane.defaultValue; }
function applyAutomationAtTime(beat) { state.daw.automation.forEach((lane) => recordAutomation(lane.targetPath, evaluateAutomation(lane, beat))); }
function armAutomationLane(laneId) { const lane = state.daw.automation.find((item) => item.id === laneId); if (lane) lane.armed = !lane.armed; }
function clearAutomation(laneId) { clearAutomationLane(laneId); }

function registerBuiltInPlugins() { return getPluginCatalog(); }
function getPluginCatalog() { return [...state.daw.instruments, ...state.daw.effects]; }
function instantiatePlugin(pluginId) { return getPluginCatalog().find((plugin) => plugin.id === pluginId) || createEffectPlugin(pluginId); }
function renderPluginBrowser() { return renderPlugins(); }
function renderPluginSlot(plugin) { return `<span>${escapeHtml(plugin.name)}</span>`; }
function renderPluginControls(plugin) { return Object.keys(plugin.params || {}).map((key) => `<span>${escapeHtml(key)}</span>`).join(""); }
function savePluginPreset(plugin) { localStorage.setItem(STORAGE.pluginPresets, JSON.stringify({ [plugin.id]: plugin.params })); }
function loadPluginPreset(plugin) { try { Object.assign(plugin.params, JSON.parse(localStorage.getItem(STORAGE.pluginPresets) || "{}")[plugin.id] || {}); } catch (error) {} }

function initMidi() { return requestMidiAccess(); }
function midiNoteOff(note, channel) { releasePad(note % 16); releaseSynthNote(midiNoteName(note).replace(/[0-9-]/g, ""), note % 12); if (state.daw.midi.recordEnabled) recordMidiNoteOff(note, channel); }
function importMidiFile(file) { return importMidi(file); }
function exportMidiFile() { return exportMidi(); }

function startSong() { state.playing = true; state.daw.song.playheadBeat = 0; scheduleSong(); render(); }
function stopSong() { state.playing = false; state.daw.song.playheadBeat = 0; stopAll(); }
function pauseSong() { state.playing = false; }
function scheduleSong() { toast("Song scheduler armed. Clips and notes use Web Audio timing hooks in this MVP."); }
function scheduleTrack() {}
function scheduleClip() {}
function schedulePattern() {}
function scheduleNote(note, instrument, audioTime) { previewNote(note.pitch, note.velocity); }
function updateSongPlayhead() { if (state.playing) state.daw.song.playheadBeat += 0.25; }
function beatToSeconds(beat) { return beat * (60 / state.bpm); }
function secondsToBeat(seconds) { return seconds / (60 / state.bpm); }
function barBeatLabel(beat) { return `${Math.floor(beat / 4) + 1}.${Math.floor(beat % 4) + 1}`; }

function exportSelectedStemWav() {
  const stem = getSelectedStem();
  if (!stem?.buffer) return toast("Select a loaded stem before exporting WAV.");
  const edited = truncateBuffer(stem.buffer, stem.trimStart, getTrimEnd(stem));
  exportBufferWav(edited, `${slug(stem.name)}-edited.wav`);
}

function serializeBuffer(buffer) {
  return {
    sampleRate: buffer.sampleRate,
    length: buffer.length,
    numberOfChannels: buffer.numberOfChannels,
    channels: Array.from({ length: buffer.numberOfChannels }, (_, channel) => new Float32Array(buffer.getChannelData(channel)))
  };
}

function deserializeBuffer(data) {
  if (!data || !audioCtx) return null;
  const buffer = audioCtx.createBuffer(data.numberOfChannels, data.length, data.sampleRate);
  data.channels.forEach((channelData, channel) => {
    buffer.copyToChannel(new Float32Array(channelData), channel);
  });
  return buffer;
}

function cloneBuffer(buffer) {
  return deserializeBuffer(serializeBuffer(buffer));
}

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(DB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

function exportJson(fileName, payload) {
  downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), fileName);
  toast(`Exported ${fileName}.`);
}

function downloadBlob(blob, fileName) {
  if (fileUrlCache.has(fileName)) URL.revokeObjectURL(fileUrlCache.get(fileName));
  const url = URL.createObjectURL(blob);
  fileUrlCache.set(fileName, url);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function getStem(id) {
  return state.stems.find((stem) => stem.id === id);
}

function getSelectedStem() {
  return getStem(state.selectedStemId) || state.stems[0];
}

function getBufferDuration(item) {
  return item?.buffer?.duration || 0;
}

function getTrimEnd(channel) {
  if (!channel?.buffer) return 0;
  return channel.trimEnd || channel.buffer.duration;
}

function currentStemTime(channel) {
  if (!audioCtx || !channel?.playing) return channel?.pausedAt || 0;
  const elapsed = audioCtx.currentTime - channel.startTime;
  const duration = Math.max(0.01, getTrimEnd(channel) - channel.trimStart);
  return (channel.loop || state.transport.loop || state.transport.loopAll) ? channel.trimStart + (elapsed % duration) : clamp(channel.trimStart + elapsed, channel.trimStart, getTrimEnd(channel));
}

function currentDeckTime(deck) {
  if (!audioCtx || !deck?.playing) return deck?.pausedAt || 0;
  const elapsed = audioCtx.currentTime - deck.startTime;
  if (deck.loop && deck.loopOut > deck.loopIn) return deck.loopIn + ((elapsed - deck.loopIn) % (deck.loopOut - deck.loopIn));
  return (state.transport.loop || state.transport.loopAll) ? elapsed % Math.max(0.01, getBufferDuration(deck)) : clamp(elapsed, 0, getBufferDuration(deck));
}

function drawGrid(ctx, width, height) {
  ctx.strokeStyle = "rgba(130,200,255,0.09)";
  ctx.lineWidth = 1;
  const gap = 24 * window.devicePixelRatio;
  for (let x = 0; x < width; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();
}

function stopStream(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

function stopMicStream() {
  stopStream(micStream);
  micStream = null;
}

function toggleSetting(setting) {
  if (!(setting in state.settings)) return;
  state.settings[setting] = !state.settings[setting];
  localStorage.setItem(`lss-${kebab(setting)}`, String(state.settings[setting]));
  toast(`${titleCase(setting.replace(/([A-Z])/g, " $1").toLowerCase())} ${state.settings[setting] ? "enabled" : "disabled"}.`);
  render();
}

function resetLegacySettings() {
  state.settings.padSensitivity = 1;
  state.settings.keySensitivity = 1;
  state.settings.visualIntensity = 1;
  state.settings.waveformDetail = 1;
  state.settings.autosave = false;
  state.settings.stickyTransport = true;
  ["pad-sensitivity", "key-sensitivity", "visual-intensity", "waveform-detail", "autosave", "sticky-transport"].forEach((key) => localStorage.removeItem(`lss-${key}`));
  document.documentElement.style.setProperty("--visual-intensity", "1");
  toast("Settings reset.");
  render();
}

async function installApp() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice.catch(() => null);
    deferredInstallPrompt = null;
    return;
  }
  toast("Use your browser install menu to add this PWA app version. Static offline support is already enabled where service workers are allowed.");
}

function pointerVelocity(event) {
  if (!event) return 1;
  const isKey = Boolean(event.target.closest(".key"));
  const sensitivity = state.settings.performance.touchSensitivity;
  const mode = state.settings.performance.velocityMode;
  if (event.pressure && event.pressure > 0 && (mode === "pressure" || mode === "hybrid")) return clamp(event.pressure * 1.25 * sensitivity, 0.12, 1.6);
  const target = event.target.closest(".pad-button, .key");
  if (!target) return clamp(sensitivity, 0.12, 1.6);
  const rect = target.getBoundingClientRect();
  const y = event.clientY - rect.top;
  const x = event.clientX - rect.left;
  const vertical = 1.15 - y / rect.height * 0.65;
  const radial = 1.15 - Math.hypot(x - rect.width / 2, y - rect.height / 2) / Math.max(rect.width, rect.height);
  const raw = mode === "radial" ? radial : mode === "hybrid" ? (vertical + radial) / 2 : vertical;
  return clamp(raw * sensitivity, 0.12, 1.6);
}

function formatTime(seconds = 0) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

function formatControlValue(value) {
  if (Math.abs(value) >= 10) return Math.round(value);
  return Number(value).toFixed(2).replace(/\.00$/, "");
}

function titleCase(value) {
  return value.split(" ").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "audio";
}

function kebab(value) {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function toast(message) {
  state.toast = message;
  queueRender();
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => {
    state.toast = null;
    queueRender();
  }, 3600);
}

function onRangeInput(event) {
  const input = event.target;
  const value = Number(input.value);
  const scope = input.dataset.range;
  const prop = input.dataset.prop;
  const id = input.dataset.id;
  if (scope === "channel") {
    const stem = getStem(id);
    stem[prop] = value;
    if (prop === "volume") setChannelGain(id, value);
    if (prop === "pan") setChannelPan(id, value);
    if (prop === "filter" && stem.nodes) {
      stem.nodes.filter.type = value >= 0 ? "lowpass" : "highpass";
      stem.nodes.filter.frequency.value = value === 0 ? 20000 : value > 0 ? 20000 - value * 18000 : 40 + Math.abs(value) * 5000;
    }
  }
  if (scope === "channel-eq") setChannelEq(id, prop, value);
  if (scope === "mixer-channel") setMixerChannelParam(id, prop, value);
  if (scope === "mixer-eq") setMixerChannelEq(id, prop, value);
  if (scope === "deck") {
    const deck = state.decks[id];
    deck[prop] = value;
    if (deck.nodes) {
      if (prop === "gain") applyCrossfader();
      if (prop === "filter") {
        deck.nodes.filter.type = value >= 0 ? "lowpass" : "highpass";
        deck.nodes.filter.frequency.value = value === 0 ? 20000 : value > 0 ? 20000 - value * 18000 : 40 + Math.abs(value) * 5000;
      }
      if (prop === "pitch" && deck.source) deck.source.playbackRate.value = Math.pow(2, deck.pitch / 12);
    }
  }
  if (scope === "deck-eq") {
    const deck = state.decks[id];
    deck.eq[prop] = value;
    if (deck.nodes) {
      if (prop === "low") deck.nodes.low.gain.value = value;
      if (prop === "mid") deck.nodes.mid.gain.value = value;
      if (prop === "high") deck.nodes.high.gain.value = value;
    }
  }
  if (scope === "crossfader") {
    localStorage.setItem("lss-crossfader", String(value));
    applyCrossfader();
  }
  if (scope === "pad") {
    state.pads[Number(id)][prop] = value;
  }
  if (scope === "sequencer") {
    state.sequencer[prop] = value;
    if (state.sequencer.playing && prop !== "position") startSequencer(false);
  }
  if (scope === "sampler") {
    state.sampler[prop] = value;
  }
  if (scope === "synth") {
    state.synth[prop] = value;
  }
  if (scope === "settings") {
    state.settings[prop] = value;
    localStorage.setItem(`lss-${kebab(prop)}`, String(value));
    document.documentElement.style.setProperty("--visual-intensity", String(state.settings.visualIntensity));
  }
  if (scope === "song") {
    state.song[prop] = Math.round(value);
  }
  drawAllCanvases();
}

function onInput(event) {
  const input = event.target;
  const key = input.dataset.input;
  if (!key) return;
  if (key === "projectName") state.projectName = input.value;
  if (key === "bpm") {
    state.bpm = clamp(input.value, 40, 240);
    localStorage.setItem("lss-bpm", String(state.bpm));
    if (state.sequencer.playing) startSequencer(false);
  }
  if (key === "masterVolume") {
    state.master.volume = Number(input.value);
    localStorage.setItem("lss-master-volume", String(state.master.volume));
    if (masterGain) masterGain.gain.value = state.master.volume;
  }
  if (key === "noteRepeat") state.noteRepeat = input.value;
  if (key === "synthWave") state.synth.wave = input.value;
  if (key === "inputDevice") state.recorder.deviceId = input.value;
}

async function onFileChange(event) {
  const input = event.target;
  const file = input.files?.[0];
  if (!file) return;
  const type = input.dataset.file;
  const id = input.dataset.id;
  if (type === "stem") {
    const buffer = await loadAudioFile(file);
    const stem = getStem(id);
    if (buffer && stem) {
      stem.buffer = buffer;
      stem.fileName = file.name;
      stem.bufferId = `${stem.id}-${Date.now()}`;
      stem.trimStart = 0;
      stem.trimEnd = buffer.duration;
      state.selectedStemId = stem.id;
    }
  }
  if (type === "deck") {
    const buffer = await loadAudioFile(file);
    const deck = state.decks[id];
    if (buffer && deck) {
      deck.buffer = buffer;
      deck.fileName = file.name;
      deck.cue = 0;
      deck.pausedAt = 0;
      deck.loopIn = 0;
      deck.loopOut = Math.min(buffer.duration, 60 / deck.bpm * 4);
    }
  }
  if (type === "pad") await loadPadSample(Number(id), file);
  if (type === "sampler") {
    const buffer = await loadAudioFile(file);
    if (buffer) {
      state.sampler.buffer = buffer;
      state.sampler.fileName = file.name;
      state.sampler.trimStart = 0;
      state.sampler.trimEnd = buffer.duration;
    }
  }
  if (type === "kit") await loadDrumKitFiles(Array.from(input.files || []));
  if (type === "midi") await importMidi(file);
  if (type === "sf2") importSoundFontPlaceholder(file);
  if (type === "gus") importGusPatchPlaceholder(file);
  if (type === "project") await importProject(file);
  if (type === "settings") await importSettings(file);
  input.value = "";
  render();
}

document.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) return;
  if (actionTarget.classList.contains("help-backdrop") && event.target !== actionTarget) return;
  if ((actionTarget.classList.contains("pad-button") || actionTarget.classList.contains("key")) && window.suppressPadClick) {
    window.suppressPadClick = false;
    return;
  }
  handleAction(actionTarget.dataset.action, actionTarget);
});

document.addEventListener("pointerdown", (event) => {
  window.lastPointerEvent = event;
  const padButton = event.target.closest(".pad-button[data-index]");
  if (padButton) {
    window.suppressPadClick = true;
    padButton.setPointerCapture?.(event.pointerId);
    const index = Number(padButton.dataset.index);
    activePadPointers.set(event.pointerId, index);
    ensureAudio().then(() => triggerPad(index, pointerVelocity(event), false, true));
    return;
  }
  const keyButton = event.target.closest(".key[data-note]");
  if (keyButton) {
    window.suppressPadClick = true;
    keyButton.setPointerCapture?.(event.pointerId);
    activeKeyboardPointers.set(event.pointerId, { note: keyButton.dataset.note, midi: Number(keyButton.dataset.midi) });
    ensureAudio().then(() => playSynthNote(keyButton.dataset.note, Number(keyButton.dataset.midi), pointerVelocity(event), true));
  }
});

document.addEventListener("pointermove", (event) => {
  if (activePadPointers.has(event.pointerId)) {
    updatePadAftertouch(activePadPointers.get(event.pointerId), event);
  }
  if (activeKeyboardPointers.has(event.pointerId)) {
    const key = activeKeyboardPointers.get(event.pointerId);
    updateSynthAftertouch(`${key.note}-${key.midi}`, pointerVelocity(event));
  }
});

document.addEventListener("pointerup", (event) => {
  if (activePadPointers.has(event.pointerId)) {
    releasePad(activePadPointers.get(event.pointerId));
    activePadPointers.delete(event.pointerId);
  }
  if (activeKeyboardPointers.has(event.pointerId)) {
    const key = activeKeyboardPointers.get(event.pointerId);
    releaseSynthNote(key.note, key.midi);
    activeKeyboardPointers.delete(event.pointerId);
  }
  window.lastPointerEvent = null;
});

document.addEventListener("pointercancel", (event) => {
  if (activePadPointers.has(event.pointerId)) {
    releasePad(activePadPointers.get(event.pointerId));
    activePadPointers.delete(event.pointerId);
  }
  if (activeKeyboardPointers.has(event.pointerId)) {
    const key = activeKeyboardPointers.get(event.pointerId);
    releaseSynthNote(key.note, key.midi);
    activeKeyboardPointers.delete(event.pointerId);
  }
  window.lastPointerEvent = null;
});

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-action='set-setting']")) onSettingInput(event);
  if (event.target.matches("[data-action='set-suno-option']")) onSunoOptionInput(event);
  if (event.target.matches("[data-action='set-video-prompt-option']")) onVideoPromptOptionInput(event);
  if (event.target.matches("[data-action='set-ai-master']")) onAiMasterInput(event);
  if (event.target.matches("[data-action='set-16-level-option']")) on16LevelOptionInput(event);
  if (event.target.matches("[data-action='set-top-shell-height']")) setTopShellHeight(event.target.value);
  if (event.target.matches("[data-action^='set-lottery'], [data-action='set-custom-lottery']")) onLotteryInput(event);
  if (event.target.matches("[data-range]")) onRangeInput(event);
  if (event.target.matches("[data-input]")) onInput(event);
});

document.addEventListener("change", (event) => {
  if (event.target.matches("input[type='file'][data-file]")) onFileChange(event);
  if (event.target.matches("[data-action='set-setting']")) onSettingInput(event);
  if (event.target.matches("[data-action='set-suno-option']")) onSunoOptionInput(event);
  if (event.target.matches("[data-action='set-video-prompt-option']")) onVideoPromptOptionInput(event);
  if (event.target.matches("[data-action='set-ai-master']")) onAiMasterInput(event);
  if (event.target.matches("[data-action='set-16-level-option']")) on16LevelOptionInput(event);
  if (event.target.matches("[data-action='set-top-shell-mode']")) setTopShellMode(event.target.value);
  if (event.target.matches("[data-action='set-top-shell-height']")) setTopShellHeight(event.target.value);
  if (event.target.matches("[data-action='set-16-level-source']")) set16LevelSourcePad(Number(event.target.value));
  if (event.target.matches("[data-action='set-16-level-mode']")) set16LevelMode(event.target.value);
  if (event.target.matches("[data-action='set-waveform-source']")) {
    state.waveformStudio.source = event.target.value;
    state.waveformStudio.fileInfo = analyzeAudioFileMetadata(null, getWaveformStudioBuffer());
    render();
  }
  if (event.target.matches("[data-action='set-crossfade-shape']")) {
    state.settings.waveformStudio.defaultCrossfadeShape = event.target.value;
    saveSettings();
    drawAllCanvases();
  }
  if (event.target.matches("[data-action='set-timing-division']")) {
    setTimingDivision(event.target.value);
  }
  if (event.target.matches("[data-action='set-daw-song-key']")) {
    state.daw.song = state.daw.song || {};
    state.daw.song.key = event.target.value;
    render();
  }
  if (event.target.matches("[data-action^='set-lottery'], [data-action='set-custom-lottery']")) onLotteryInput(event);
  if (event.target.matches("[data-input]")) onInput(event);
});

function onSettingInput(event) {
  updateSetting(event.target.dataset.settingPath, readSettingControlValue(event.target));
}

function onSunoOptionInput(event) {
  setSunoOption(event.target.dataset.sunoOption, readControlValue(event.target));
}

function onVideoPromptOptionInput(event) {
  setVideoPromptOption(event.target.dataset.videoOption, readControlValue(event.target));
}

function onAiMasterInput(event) {
  setAiMasterOption(event.target.dataset.aiMaster, readControlValue(event.target));
}

function on16LevelOptionInput(event) {
  set16LevelOption(event.target.dataset.path, readControlValue(event.target), event.target.type);
}

function onLotteryInput(event) {
  const value = readControlValue(event.target);
  const action = event.target.dataset.action;
  if (action === "set-lottery-state") state.beatLottery.selectedState = value;
  if (action === "set-lottery-game") state.beatLottery.selectedGameId = value;
  if (action === "set-lottery-method") state.beatLottery.selectedMethod = value;
  if (action === "set-lottery-count") state.beatLottery.setCount = clamp(Number(value) || 5, 1, 25);
  if (action === "set-lottery-option") {
    const key = event.target.dataset.lotteryOption || event.target.dataset.option;
    if (key) state.beatLottery[key] = value;
  }
  if (action === "set-custom-lottery") {
    const key = event.target.dataset.customKey || event.target.dataset.custom;
    state.beatLottery.customDraft = state.beatLottery.customDraft || {};
    if (key) state.beatLottery.customDraft[key] = value;
  }
}

function initUltraCockpit() {
  setActiveCreativeMode(state.view);
  syncTransportButtonStates();
  updateUltraMeters();
  animateUltraWaveform();
}

function initFloatingModes() {
  const rail = document.querySelector("[data-floating-modes]");
  const handle = rail?.querySelector("[data-floating-modes-handle]");
  if (!rail || !handle) return;

  let position = { x: 18, y: 86 };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE.floatingModesPosition) || "{}");
    if (Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      position = { x: saved.x, y: saved.y };
    }
  } catch (error) {
    position = { x: 18, y: 86 };
  }

  const applyPosition = () => {
    const maxX = Math.max(12, window.innerWidth - Math.min(rail.offsetWidth, window.innerWidth - 24) - 12);
    const maxY = Math.max(12, window.innerHeight - Math.min(rail.offsetHeight, window.innerHeight - 24) - 12);
    position.x = clamp(position.x, 12, maxX);
    position.y = clamp(position.y, 12, maxY);
    rail.style.setProperty("--modes-left", `${Math.round(position.x)}px`);
    rail.style.setProperty("--modes-top", `${Math.round(position.y)}px`);
  };

  applyPosition();
  requestAnimationFrame(applyPosition);

  let dragState = null;
  const finishDrag = () => {
    if (!dragState) return;
    dragState = null;
    rail.classList.remove("is-dragging");
    localStorage.setItem(STORAGE.floatingModesPosition, JSON.stringify(position));
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", finishDrag);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  const startDrag = (clientX, clientY) => {
    dragState = {
      startX: clientX,
      startY: clientY,
      originX: position.x,
      originY: position.y
    };
    rail.classList.add("is-dragging");
  };

  const moveDrag = (clientX, clientY) => {
    if (!dragState) return;
    position.x = dragState.originX + clientX - dragState.startX;
    position.y = dragState.originY + clientY - dragState.startY;
    applyPosition();
  };

  function onPointerMove(event) {
    moveDrag(event.clientX, event.clientY);
  }

  function onPointerUp() {
    finishDrag();
  }

  function onMouseMove(event) {
    moveDrag(event.clientX, event.clientY);
  }

  function onMouseUp() {
    finishDrag();
  }

  handle.addEventListener("pointerdown", (event) => {
    if (event.button && event.button !== 0) return;
    startDrag(event.clientX, event.clientY);
    handle.setPointerCapture?.(event.pointerId);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", finishDrag);
    event.preventDefault();
  });

  handle.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;
    startDrag(event.clientX, event.clientY);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    event.preventDefault();
  });
}

function initFloatingTransport() {
  const deck = document.querySelector("[data-floating-transport]");
  const handle = deck?.querySelector("[data-floating-transport-handle]");
  if (!deck || !handle) return;

  let position = { x: 0, y: 0 };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE.floatingTransportPosition) || "{}");
    if (Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      position = { x: saved.x, y: saved.y };
    }
  } catch (error) {
    position = { x: 0, y: 0 };
  }

  const applyPosition = () => {
    const rect = deck.getBoundingClientRect();
    const baseLeft = rect.left - position.x;
    const baseTop = rect.top - position.y;
    const minX = Math.min(0, 12 - baseLeft);
    const maxX = Math.max(minX, window.innerWidth - baseLeft - deck.offsetWidth - 12);
    const minY = Math.min(0, 12 - baseTop);
    const maxY = Math.max(minY, window.innerHeight - baseTop - Math.min(deck.offsetHeight, 180) - 12);
    position.x = clamp(position.x, minX, maxX);
    position.y = clamp(position.y, minY, maxY);
    deck.style.setProperty("--transport-x", `${Math.round(position.x)}px`);
    deck.style.setProperty("--transport-y", `${Math.round(position.y)}px`);
  };

  applyPosition();
  requestAnimationFrame(applyPosition);

  let dragState = null;
  const finishDrag = () => {
    if (!dragState) return;
    dragState = null;
    deck.classList.remove("is-dragging");
    localStorage.setItem(STORAGE.floatingTransportPosition, JSON.stringify(position));
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", finishDrag);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  const startDrag = (clientX, clientY) => {
    dragState = {
      startX: clientX,
      startY: clientY,
      originX: position.x,
      originY: position.y
    };
    deck.classList.add("is-dragging");
  };

  const moveDrag = (clientX, clientY) => {
    if (!dragState) return;
    position.x = dragState.originX + clientX - dragState.startX;
    position.y = dragState.originY + clientY - dragState.startY;
    applyPosition();
  };

  function onPointerMove(event) {
    moveDrag(event.clientX, event.clientY);
  }

  function onPointerUp() {
    finishDrag();
  }

  function onMouseMove(event) {
    moveDrag(event.clientX, event.clientY);
  }

  function onMouseUp() {
    finishDrag();
  }

  handle.addEventListener("pointerdown", (event) => {
    if (event.button && event.button !== 0) return;
    startDrag(event.clientX, event.clientY);
    handle.setPointerCapture?.(event.pointerId);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", finishDrag);
    event.preventDefault();
  });

  handle.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;
    startDrag(event.clientX, event.clientY);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    event.preventDefault();
  });
}

function initFloatingStemMixer() {
  const mixer = document.querySelector("[data-floating-stem-mixer]");
  const handle = mixer?.querySelector("[data-floating-stem-mixer-handle]");
  if (!mixer || !handle) return;

  let position = { x: 0, y: 0 };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE.floatingStemMixerPosition) || "{}");
    if (Number.isFinite(saved.x) && Number.isFinite(saved.y)) position = { x: saved.x, y: saved.y };
  } catch (error) {
    position = { x: 0, y: 0 };
  }

  const applyPosition = () => {
    const rect = mixer.getBoundingClientRect();
    const baseLeft = rect.left - position.x;
    const baseTop = rect.top - position.y;
    const minX = Math.min(0, 12 - baseLeft);
    const maxX = Math.max(minX, window.innerWidth - baseLeft - Math.min(mixer.offsetWidth, window.innerWidth - 24) - 12);
    const minY = Math.min(0, 12 - baseTop);
    const maxY = Math.max(minY, window.innerHeight - baseTop - Math.min(mixer.offsetHeight, window.innerHeight * 0.72) - 12);
    position.x = clamp(position.x, minX, maxX);
    position.y = clamp(position.y, minY, maxY);
    mixer.style.setProperty("--stem-mixer-x", `${Math.round(position.x)}px`);
    mixer.style.setProperty("--stem-mixer-y", `${Math.round(position.y)}px`);
  };

  applyPosition();
  requestAnimationFrame(applyPosition);

  let dragState = null;
  const finishDrag = () => {
    if (!dragState) return;
    dragState = null;
    mixer.classList.remove("is-dragging");
    localStorage.setItem(STORAGE.floatingStemMixerPosition, JSON.stringify(position));
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", finishDrag);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  const startDrag = (clientX, clientY) => {
    dragState = {
      startX: clientX,
      startY: clientY,
      originX: position.x,
      originY: position.y
    };
    mixer.classList.add("is-dragging");
  };

  const moveDrag = (clientX, clientY) => {
    if (!dragState) return;
    position.x = dragState.originX + clientX - dragState.startX;
    position.y = dragState.originY + clientY - dragState.startY;
    applyPosition();
  };

  function onPointerMove(event) {
    moveDrag(event.clientX, event.clientY);
  }

  function onPointerUp() {
    finishDrag();
  }

  function onMouseMove(event) {
    moveDrag(event.clientX, event.clientY);
  }

  function onMouseUp() {
    finishDrag();
  }

  handle.addEventListener("pointerdown", (event) => {
    if ((event.button && event.button !== 0) || event.target.closest("button, input, select, label, a")) return;
    startDrag(event.clientX, event.clientY);
    handle.setPointerCapture?.(event.pointerId);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", finishDrag);
    event.preventDefault();
  });

  handle.addEventListener("mousedown", (event) => {
    if (event.button !== 0 || event.target.closest("button, input, select, label, a")) return;
    startDrag(event.clientX, event.clientY);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    event.preventDefault();
  });
}

function initFloatingSequencer() {
  const sequencer = document.querySelector("[data-floating-sequencer]");
  const handle = sequencer?.querySelector("[data-floating-sequencer-handle]");
  if (!sequencer || !handle) return;

  let position = { x: 0, y: 0 };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE.floatingSequencerPosition) || "{}");
    if (Number.isFinite(saved.x) && Number.isFinite(saved.y)) position = { x: saved.x, y: saved.y };
  } catch (error) {
    position = { x: 0, y: 0 };
  }

  const applyPosition = () => {
    const rect = sequencer.getBoundingClientRect();
    const baseLeft = rect.left - position.x;
    const baseTop = rect.top - position.y;
    const minX = Math.min(0, 12 - baseLeft);
    const maxX = Math.max(minX, window.innerWidth - baseLeft - Math.min(sequencer.offsetWidth, window.innerWidth - 24) - 12);
    const minY = Math.min(0, 12 - baseTop);
    const maxY = Math.max(minY, window.innerHeight - baseTop - Math.min(sequencer.offsetHeight, window.innerHeight * 0.68) - 12);
    position.x = clamp(position.x, minX, maxX);
    position.y = clamp(position.y, minY, maxY);
    sequencer.style.setProperty("--sequencer-x", `${Math.round(position.x)}px`);
    sequencer.style.setProperty("--sequencer-y", `${Math.round(position.y)}px`);
  };

  applyPosition();
  requestAnimationFrame(applyPosition);

  let dragState = null;
  const finishDrag = () => {
    if (!dragState) return;
    dragState = null;
    sequencer.classList.remove("is-dragging");
    localStorage.setItem(STORAGE.floatingSequencerPosition, JSON.stringify(position));
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", finishDrag);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  const startDrag = (clientX, clientY) => {
    dragState = { startX: clientX, startY: clientY, originX: position.x, originY: position.y };
    sequencer.classList.add("is-dragging");
  };

  const moveDrag = (clientX, clientY) => {
    if (!dragState) return;
    position.x = dragState.originX + clientX - dragState.startX;
    position.y = dragState.originY + clientY - dragState.startY;
    applyPosition();
  };

  function onPointerMove(event) { moveDrag(event.clientX, event.clientY); }
  function onPointerUp() { finishDrag(); }
  function onMouseMove(event) { moveDrag(event.clientX, event.clientY); }
  function onMouseUp() { finishDrag(); }

  handle.addEventListener("pointerdown", (event) => {
    if ((event.button && event.button !== 0) || event.target.closest("button, input, select, label, a")) return;
    startDrag(event.clientX, event.clientY);
    handle.setPointerCapture?.(event.pointerId);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", finishDrag);
    event.preventDefault();
  });

  handle.addEventListener("mousedown", (event) => {
    if (event.button !== 0 || event.target.closest("button, input, select, label, a")) return;
    startDrag(event.clientX, event.clientY);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    event.preventDefault();
  });
}

function setActiveCreativeMode(mode) {
  document.querySelectorAll(".ultra-mode-tab").forEach((button) => {
    const view = button.dataset.view;
    const action = button.dataset.action;
    const active = view === mode ||
      (mode === "suno prompt" && action === "generate-suno-prompt") ||
      (mode === "video prompt" && action === "generate-video-prompt") ||
      (mode === "beat lottery" && action === "generate-beat-lottery") ||
      (mode === "ai master" && view === "ai master");
    button.classList.toggle("active", Boolean(active));
  });
}

function syncTransportButtonStates() {
  document.querySelectorAll(".ultra-transport-button").forEach((button) => {
    const pressed = button.getAttribute("aria-pressed") === "true";
    button.classList.toggle("is-active", pressed);
  });
}

function updateUltraMeters() {
  document.querySelectorAll(".ultra-master-mini-meter .vu span").forEach((meter) => {
    const lift = state.playing ? Math.max(state.master.meter, 0.18 + Math.random() * 0.38) : state.master.meter;
    meter.style.setProperty("--vu", `${Math.round(clamp(lift, 0, 1) * 100)}%`);
  });
}

function animateUltraWaveform() {
  if (ultraCockpitRunning || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  ultraCockpitRunning = true;
  const tick = (time) => {
    document.querySelectorAll(".ultra-waveform-rail span").forEach((bar, index) => {
      const pct = 24 + Math.sin(time / 260 + index * 1.3) * 20 + (state.playing ? 24 : 0);
      bar.style.setProperty("--wave-height", `${Math.max(12, Math.round(pct))}%`);
    });
    updateUltraMeters();
    ultraCockpitFrame = requestAnimationFrame(tick);
  };
  ultraCockpitFrame = requestAnimationFrame(tick);
}

function toggleMobileDock() {
  document.body.classList.toggle("ultra-mobile-dock-open");
}

function toggleInspector() {
  document.body.classList.toggle("ultra-inspector-open");
}

function compactHeaderOnScroll() {
  document.body.classList.toggle("ultra-header-compact", window.scrollY > 80);
}

document.addEventListener("keydown", async (event) => {
  if (state.keyMappingLearn) {
    event.preventDefault();
    event.stopPropagation();
    assignKeyboardMapping(event.code);
    return;
  }
  if (event.key === "Escape") {
    if (state.activeHelpTopic || state.helpTopic || state.helpOpen) {
      closeHelp();
      return;
    }
    if (state.firstRunGuideStep > 0 && localStorage.getItem(STORAGE.helpProgress) !== "complete") {
      completeGuide();
      return;
    }
  }
  if (isTextEditingTarget(document.activeElement)) return;
  if (event.code === "Space") {
    event.preventDefault();
    event.stopPropagation();
    if (event.repeat) return;
    if (state.playing) stopAll();
    else await playAll();
    return;
  }
  if (await triggerMappedComputerKey(event)) return;
  if (handleSongEditorShortcut(event)) {
    event.preventDefault();
    return;
  }
});

document.addEventListener("keyup", (event) => {
  if (event.code === "Space" && !isTextEditingTarget(document.activeElement)) {
    event.preventDefault();
    event.stopPropagation();
  }
  releaseMappedComputerKey(event);
});

window.addEventListener("resize", () => drawAllCanvases());
window.addEventListener("scroll", compactHeaderOnScroll, { passive: true });

document.addEventListener("visibilitychange", () => {
  if (document.hidden && ultraCockpitFrame) {
    cancelAnimationFrame(ultraCockpitFrame);
    ultraCockpitFrame = null;
    ultraCockpitRunning = false;
  } else if (!document.hidden) {
    animateUltraWaveform();
  }
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
});

let defaultDemoAutoloadStarted = false;
async function autoLoadDefaultDemoOnStartup() {
  if (defaultDemoAutoloadStarted) return;
  if (state.stems.some((stem) => stem.buffer)) return;
  defaultDemoAutoloadStarted = true;
  try {
    await loadDemoProject({ silent: true });
  } catch (error) {
    console.warn("Default demo stem autoload skipped.", error);
  }
}

state.settings = validateSettings(loadSettings());
applySettingsToVisuals();
applySettingsToPerformance();
loadMidiMappings();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./service-worker.js").catch(() => {
    // Static file usage still works without the install cache.
  });
}

render();
window.setTimeout(autoLoadDefaultDemoOnStartup, 650);
animationLoop();
