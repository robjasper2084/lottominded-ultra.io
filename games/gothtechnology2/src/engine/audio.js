export class WebAudioBus {
  constructor(musicUrl = "", fightMusicUrl = musicUrl) {
    this.ctx = null;
    this.muted = false;
    this.musicUrls = {
      menu: musicUrl,
      fight: fightMusicUrl || musicUrl
    };
    this.music = null;
    this.musicTracks = {};
    this.musicStarted = false;
    this.musicMode = "silent";
    this.pendingMode = "menu";
    this.unlocked = false;
    this.noiseBuffer = null;
    this.musicVolume = 0.72;
    this.sfxVolume = 0.9;
    this.vibrationEnabled = true;
  }

  setMusicVolume(value) {
    this.musicVolume = Math.max(0, Math.min(1, Number(value) || 0));
    for (const [mode, track] of Object.entries(this.musicTracks)) {
      track.volume = (mode === "fight" ? 0.74 : 0.5) * this.musicVolume;
    }
  }

  setSfxVolume(value) {
    this.sfxVolume = Math.max(0, Math.min(1, Number(value) || 0));
  }

  setVibrationEnabled(enabled) {
    this.vibrationEnabled = Boolean(enabled);
  }

  ensure() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
    this.unlocked = true;
    if (this.ctx?.state === "suspended") this.ctx.resume?.();
    this.preloadMusic(this.pendingMode === "fight" ? "fight" : "menu");
    if (this.pendingMode !== "silent") this.startMusic(this.pendingMode);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (!this.muted) this.ensure();
    for (const track of Object.values(this.musicTracks)) {
      track.muted = this.muted;
      if (this.muted) track.pause();
      else if (this.pendingMode !== "silent") this.startMusic(this.pendingMode);
    }
  }

  preloadMusic(mode = "menu") {
    const normalized = mode === "fight" ? "fight" : "menu";
    const url = this.musicUrls[normalized];
    if (!url || !this.unlocked) return null;
    if (!this.musicTracks[normalized]) {
      const track = new Audio(url);
      track.loop = true;
      track.preload = "metadata";
      track.volume = (normalized === "fight" ? 0.74 : 0.5) * this.musicVolume;
      track.muted = this.muted;
      track.addEventListener("ended", () => {
        if (this.music === track) this.musicStarted = false;
        if (!this.muted && this.pendingMode === normalized) {
          this.startMusic(normalized, { restart: true });
        }
      });
      track.load?.();
      this.musicTracks[normalized] = track;
    }
    return this.musicTracks[normalized];
  }

  startMusic(mode = "menu", options = {}) {
    const normalized = mode === "fight" ? "fight" : "menu";
    this.pendingMode = normalized;
    if (this.muted || !this.unlocked) return;
    const nextTrack = this.preloadMusic(normalized);
    if (!nextTrack) return;
    if (this.music && this.music !== nextTrack) {
      this.music.pause();
      try {
        this.music.currentTime = 0;
      } catch (error) {
        // Some browsers reject currentTime changes before metadata arrives.
      }
    }
    this.music = nextTrack;
    if (this.music.ended) {
      options = { ...options, restart: true };
    }
    const restart = Boolean(options.restart);
    if (restart) {
      try {
        this.music.currentTime = 0;
      } catch (error) {
        // Some browsers reject currentTime changes before metadata arrives.
      }
    }
    this.music.volume = (normalized === "fight" ? 0.74 : 0.5) * this.musicVolume;
    if (this.musicStarted && !this.music.paused && this.musicMode === normalized && !restart) return;
    this.musicMode = normalized;
    this.musicStarted = true;
    this.music.play().catch(() => {
      this.musicStarted = false;
    });
  }

  stopMusic(options = {}) {
    this.pendingMode = "silent";
    for (const track of Object.values(this.musicTracks)) {
      track.pause();
      if (options.reset) {
        try {
          track.currentTime = 0;
        } catch (error) {
          // Ignore metadata timing on mobile browsers.
        }
      }
    }
    this.musicStarted = false;
    this.musicMode = "silent";
  }

  beep(type = "hit") {
    if (this.muted || this.sfxVolume <= 0) return;
    this.ensure();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const master = this.ctx.createGain();
    const compressor = this.ctx.createDynamicsCompressor();
    master.gain.setValueAtTime(0.9 * this.sfxVolume, now);
    master.connect(compressor);
    compressor.connect(this.ctx.destination);
    const settings = {
      hit: { tones: [[105, 58, 0.095, "square", 0.12], [270, 92, 0.055, "triangle", 0.055]], noise: [0.085, 0.1, 1150] },
      block: { tones: [[460, 230, 0.12, "triangle", 0.07], [910, 520, 0.06, "sine", 0.035]], noise: [0.05, 0.05, 2600] },
      select: { tones: [[520, 760, 0.085, "sine", 0.045]] },
      dash: { tones: [[170, 88, 0.11, "triangle", 0.04]], noise: [0.1, 0.055, 780] },
      jump: { tones: [[440, 820, 0.11, "sine", 0.04]], noise: [0.055, 0.025, 1300] },
      special: { tones: [[96, 280, 0.3, "sawtooth", 0.07], [540, 180, 0.22, "sine", 0.035]], noise: [0.22, 0.055, 720] },
      projectile: { tones: [[180, 72, 0.2, "sawtooth", 0.06], [720, 210, 0.1, "triangle", 0.03]], noise: [0.16, 0.045, 980] },
      super: { tones: [[58, 34, 0.48, "sawtooth", 0.1], [310, 74, 0.38, "triangle", 0.06]], noise: [0.36, 0.075, 520] },
      ko: { tones: [[92, 36, 0.82, "triangle", 0.12], [180, 42, 0.64, "sawtooth", 0.055]], noise: [0.3, 0.05, 430] }
    }[type] ?? { tones: [[240, 320, 0.1, "sine", 0.05]] };

    for (const [start, end, duration, wave, volume] of settings.tones) {
      const oscillator = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      oscillator.type = wave;
      oscillator.frequency.setValueAtTime(start, now);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, end), now + duration);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(now);
      oscillator.stop(now + duration);
    }

    if (settings.noise) {
      const [duration, volume, frequency] = settings.noise;
      if (!this.noiseBuffer) {
        this.noiseBuffer = this.ctx.createBuffer(1, Math.ceil(this.ctx.sampleRate * 0.5), this.ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
      }
      const source = this.ctx.createBufferSource();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      source.buffer = this.noiseBuffer;
      filter.type = "bandpass";
      filter.frequency.value = frequency;
      filter.Q.value = 0.7;
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      source.start(now);
      source.stop(now + duration);
    }

    const vibration = { hit: 18, block: 10, special: 24, super: 45, ko: 55 }[type];
    if (vibration && this.vibrationEnabled) navigator.vibrate?.(vibration);
  }
}
