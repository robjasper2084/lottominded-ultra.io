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
  }

  ensure() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
    if (this.ctx?.state === "suspended") this.ctx.resume?.();
    this.preloadMusic(this.pendingMode === "fight" ? "fight" : "menu");
    if (this.pendingMode !== "silent") this.startMusic(this.pendingMode);
  }

  toggleMute() {
    this.muted = !this.muted;
    for (const track of Object.values(this.musicTracks)) {
      track.muted = this.muted;
      if (this.muted) track.pause();
      else if (this.pendingMode !== "silent") this.startMusic(this.pendingMode);
    }
  }

  preloadMusic(mode = "menu") {
    const normalized = mode === "fight" ? "fight" : "menu";
    const url = this.musicUrls[normalized];
    if (!url) return null;
    if (!this.musicTracks[normalized]) {
      const track = new Audio(url);
      track.loop = true;
      track.preload = "auto";
      track.volume = normalized === "fight" ? 0.74 : 0.5;
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
    if (this.muted) return;
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
    this.music.volume = normalized === "fight" ? 0.74 : 0.5;
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
    if (this.muted) return;
    this.ensure();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const settings = {
      hit: [190, 0.12, "square", 0.08],
      block: [320, 0.1, "triangle", 0.05],
      select: [520, 0.08, "sine", 0.04],
      dash: [420, 0.07, "triangle", 0.035],
      jump: [680, 0.07, "sine", 0.035],
      special: [120, 0.26, "sawtooth", 0.07],
      projectile: [150, 0.16, "sawtooth", 0.055],
      super: [75, 0.42, "sawtooth", 0.09],
      ko: [55, 0.8, "triangle", 0.11]
    }[type] ?? [240, 0.1, "sine", 0.05];
    osc.type = settings[2];
    osc.frequency.setValueAtTime(settings[0], now);
    osc.frequency.exponentialRampToValueAtTime(settings[0] * 2.4, now + settings[1]);
    gain.gain.setValueAtTime(settings[3], now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + settings[1]);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + settings[1]);
  }
}
