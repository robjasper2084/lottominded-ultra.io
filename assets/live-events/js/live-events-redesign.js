(() => {
  const root = document.querySelector(".lm-live-page");
  if (!root) return;

  const liveStart = Date.now() - (12 * 60 + 45) * 1000;
  const started = document.querySelector(".started");
  const padButtons = document.querySelectorAll(".lm-category-grid button, .lm-interactions button, .lm-synth-tabs button");

  function two(value) {
    return String(value).padStart(2, "0");
  }

  function tickLiveTimer() {
    if (!started) return;
    const elapsed = Math.floor((Date.now() - liveStart) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    started.innerHTML = `<span></span> Started ${two(hours)}:${two(minutes)}:${two(seconds)} ago`;
  }

  function playUiTone(seed = 0) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const freq = [261.63, 293.66, 329.63, 392, 440, 523.25][seed % 6];

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.24);
    window.setTimeout(() => ctx.close?.(), 300);
  }

  padButtons.forEach((button, index) => {
    button.addEventListener("click", () => playUiTone(index));
  });

  tickLiveTimer();
  window.setInterval(tickLiveTimer, 1000);
})();
