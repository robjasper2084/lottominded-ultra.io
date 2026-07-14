(() => {
  const SETTINGS_KEY = "lottomind-vault-run-settings-v1";
  const forceTouch = new URLSearchParams(window.location.search).has("touch");
  const isTouchDevice =
    forceTouch ||
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0 ||
    window.matchMedia?.("(any-pointer: coarse)").matches;

  if (!isTouchDevice) return;

  const setTouchPreference = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") || {};
      saved.touch = true;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(saved));
    } catch {
      // Storage can be unavailable in private browsing; CSS fallbacks still apply.
    }
  };

  const updateOrientation = () => {
    const portrait = window.innerHeight >= window.innerWidth;
    document.body?.classList.toggle("touch-portrait", portrait);
    document.body?.classList.toggle("touch-landscape", !portrait);
  };

  const markTouch = () => {
    document.body?.classList.add("touch-forced");
    document.body?.classList.remove("touch-hidden");
    updateOrientation();
  };

  const injectTouchCss = () => {
    if (document.getElementById("mobileTouchCss")) return;
    const style = document.createElement("style");
    style.id = "mobileTouchCss";
    style.textContent = `
      html, body {
        width: 100%;
        min-height: 100%;
        overflow: hidden;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        overscroll-behavior: none;
        touch-action: none;
      }
      body.touch-forced .game-shell {
        width: 100vw;
        height: 100vh;
        height: 100dvh;
        padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
        box-sizing: border-box;
      }
      body.touch-forced #game {
        width: min(100vw, 177.78dvh) !important;
        height: min(56.25vw, 100dvh) !important;
        max-width: 100vw !important;
        max-height: 100dvh !important;
      }
      .game-shell,
      #game,
      .touchbar,
      .touch-cluster button {
        touch-action: none;
        -webkit-tap-highlight-color: transparent;
      }
      body.touch-forced .touchbar {
        --touch-size: clamp(56px, 8vw, 74px);
        --stick-size: clamp(112px, 17vw, 154px);
        inset: auto max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left)) !important;
        width: calc(100vw - max(12px, env(safe-area-inset-left)) - max(12px, env(safe-area-inset-right)));
        max-width: 1120px;
        gap: clamp(8px, 2vw, 16px);
        align-items: end;
        justify-content: space-between;
      }
      body.touch-forced:not(.is-playing-mode) .touchbar {
        display: none !important;
      }
      body.touch-forced.is-playing-mode .touchbar {
        display: flex;
      }
      body.touch-forced .touchbar.has-joysticks {
        pointer-events: none;
      }
      body.touch-forced .touchbar.has-joysticks > .touch-cluster {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        overflow: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
      body.touch-forced .joystick-layer {
        width: 100%;
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: clamp(10px, 2vw, 18px);
        pointer-events: none;
      }
      body.touch-forced .virtual-stick {
        position: relative;
        width: var(--stick-size);
        height: var(--stick-size);
        border: 2px solid rgba(255, 214, 109, 0.76);
        border-radius: 50%;
        background:
          radial-gradient(circle at 50% 50%, rgba(56, 219, 255, 0.18), transparent 34%),
          radial-gradient(circle at 50% 50%, rgba(255, 79, 154, 0.18), transparent 62%),
          rgba(5, 4, 8, 0.68);
        box-shadow:
          0 16px 40px rgba(0, 0, 0, 0.48),
          inset 0 0 0 1px rgba(255, 239, 180, 0.14),
          0 0 24px rgba(143, 55, 255, 0.22);
        pointer-events: auto;
        touch-action: none;
      }
      body.touch-forced .virtual-stick::before {
        content: "";
        position: absolute;
        inset: 22%;
        border: 1px solid rgba(56, 219, 255, 0.42);
        border-radius: 50%;
      }
      body.touch-forced .virtual-stick__knob {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 42%;
        height: 42%;
        border: 2px solid rgba(255, 247, 207, 0.88);
        border-radius: 50%;
        background: radial-gradient(circle at 36% 28%, #fff7cf, #ff4f9a 36%, #8f37ff 72%, #18081f);
        box-shadow: 0 0 24px rgba(255, 79, 154, 0.48);
        transform: translate(-50%, -50%);
        transition: transform 44ms linear;
        pointer-events: none;
      }
      body.touch-forced .virtual-stick--fire .virtual-stick__knob {
        width: 46%;
        height: 46%;
        transition: transform 28ms linear;
      }
      body.touch-forced .virtual-stick__label {
        position: absolute;
        left: 50%;
        bottom: -22px;
        transform: translateX(-50%);
        color: #ffeab1;
        font-size: 0.62rem;
        font-weight: 900;
        letter-spacing: 0;
        text-transform: uppercase;
        white-space: nowrap;
        text-shadow: 0 2px 12px rgba(0, 0, 0, 0.85);
      }
      body.touch-forced .virtual-stick.is-active {
        border-color: rgba(56, 219, 255, 0.95);
        box-shadow:
          0 16px 40px rgba(0, 0, 0, 0.5),
          0 0 0 3px rgba(56, 219, 255, 0.15),
          0 0 32px rgba(255, 79, 154, 0.34);
      }
      body.touch-forced .virtual-stick--fire.is-active {
        border-color: rgba(255, 79, 154, 0.98);
        box-shadow:
          0 16px 40px rgba(0, 0, 0, 0.5),
          0 0 0 4px rgba(255, 79, 154, 0.14),
          0 0 38px rgba(255, 79, 154, 0.42),
          0 0 30px rgba(56, 219, 255, 0.18);
      }
      body.touch-forced .touch-quick {
        display: grid;
        grid-template-columns: repeat(2, clamp(56px, 7.5vw, 70px));
        gap: 8px;
        pointer-events: auto;
      }
      body.touch-forced .touch-quick button {
        height: clamp(50px, 6.8vw, 62px);
        min-height: 50px;
        padding: 0 8px;
        border-width: 2px;
        background: linear-gradient(180deg, rgba(18, 12, 22, 0.88), rgba(5, 4, 7, 0.8));
        color: var(--gold);
        font-size: clamp(0.52rem, 1.2vw, 0.66rem);
        -webkit-tap-highlight-color: transparent;
        touch-action: none;
        user-select: none;
      }
      body.touch-forced .touch-quick button.is-touching,
      body.touch-forced .touch-quick button:active {
        transform: translateY(2px) scale(0.98);
        border-color: rgba(56, 219, 255, 0.95);
        color: #fff7cf;
      }
      body.touch-forced .touch-quick .touch-quick-dash {
        border-color: rgba(255, 214, 109, 0.92);
        background:
          linear-gradient(180deg, rgba(255, 214, 109, 0.2), rgba(5, 4, 7, 0.78)),
          rgba(18, 12, 22, 0.88);
        color: #fff0b8;
      }
      body.touch-forced .touch-quick .touch-quick-dash::after {
        content: "tap";
        display: block;
        margin-top: 2px;
        color: rgba(255, 247, 207, 0.68);
        font-size: 0.48rem;
        line-height: 1;
        text-transform: uppercase;
      }
      body.touch-forced .touch-quick-use.is-hidden {
        display: none;
      }
      body.touch-forced .touch-cluster {
        grid-template-columns: repeat(5, var(--touch-size)) !important;
        gap: clamp(6px, 1.2vw, 10px) !important;
      }
      body.touch-forced .touch-cluster--move {
        grid-template-columns: repeat(4, var(--touch-size)) !important;
      }
      body.touch-forced .touch-cluster button {
        width: var(--touch-size) !important;
        min-width: var(--touch-size) !important;
        height: var(--touch-size) !important;
        min-height: var(--touch-size) !important;
        border-width: 2px;
        font-size: clamp(0.52rem, 1.55vw, 0.72rem) !important;
        user-select: none;
      }
      body.touch-forced .touch-cluster button:active,
      body.touch-forced .touch-cluster button.is-touching {
        transform: translateY(2px) scale(0.98);
        border-color: rgba(56, 219, 255, 0.95);
        color: #fff7cf;
        box-shadow:
          0 0 0 2px rgba(56, 219, 255, 0.18),
          0 0 24px rgba(255, 79, 154, 0.34),
          inset 0 0 0 1px rgba(255, 239, 180, 0.28);
      }
      body.touch-forced.touch-landscape.compact-play #game,
      body.touch-forced.touch-landscape #game {
        margin-top: 0 !important;
      }
      body.touch-forced.touch-landscape .touchbar {
        --touch-size: clamp(46px, 8.5vh, 64px);
        --stick-size: clamp(106px, 19vh, 146px);
      }
      body.touch-forced.touch-portrait .game-shell {
        place-items: start center !important;
      }
      body.touch-forced.touch-portrait #game {
        width: min(190vw, 1520px) !important;
        max-width: none !important;
        height: min(106.875vw, calc(100dvh - 300px)) !important;
        max-height: calc(100dvh - 300px) !important;
        margin-top: clamp(116px, 14dvh, 154px) !important;
      }
      body.touch-forced.touch-portrait .touchbar {
        --touch-size: clamp(48px, 13vw, 62px);
        --stick-size: clamp(96px, 25vw, 122px);
        width: calc(100vw - max(10px, env(safe-area-inset-left)) - max(10px, env(safe-area-inset-right)));
        inset: auto max(10px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left)) !important;
        flex-wrap: wrap;
        row-gap: 8px;
        align-content: end;
      }
      body.touch-forced.touch-portrait .joystick-layer {
        align-items: end;
        gap: 8px;
      }
      body.touch-forced.touch-portrait .touch-quick {
        grid-template-columns: repeat(2, clamp(48px, 13vw, 58px));
        gap: 6px;
      }
      body.touch-forced.touch-portrait .touch-quick button {
        height: clamp(44px, 11.5vw, 52px);
        min-height: 44px;
        font-size: 0.54rem;
      }
      body.touch-forced.touch-portrait .touch-cluster {
        grid-template-columns: repeat(5, var(--touch-size)) !important;
      }
      body.touch-forced.touch-portrait .touch-cluster--move {
        grid-template-columns: repeat(4, var(--touch-size)) !important;
      }
      body.touch-forced.touch-portrait .hud {
        transform: scale(0.9);
        transform-origin: top center;
        width: calc(111.111vw - 18px);
      }
      body.touch-forced.touch-portrait .objective-chip {
        top: clamp(104px, 15dvh, 148px) !important;
      }
      @media (max-width: 580px) {
        body.touch-forced .touchbar {
          --touch-size: clamp(50px, 12vw, 58px);
        }
        body.touch-forced.touch-portrait .touchbar {
          --touch-size: clamp(44px, 12vw, 52px);
          --stick-size: clamp(86px, 24vw, 106px);
        }
      }
      @media (orientation: landscape) and (max-height: 520px) {
        body.touch-forced.touch-landscape .touchbar {
          --touch-size: clamp(42px, 12vh, 58px);
          --stick-size: clamp(96px, 24vh, 132px);
          bottom: max(8px, env(safe-area-inset-bottom)) !important;
        }
        body.touch-forced .touch-quick {
          grid-template-columns: repeat(2, clamp(48px, 12vh, 62px));
          gap: 6px;
        }
        body.touch-forced .touch-quick button {
          height: clamp(42px, 10vh, 54px);
          min-height: 42px;
        }
      }
      @media (max-width: 380px) {
        body.touch-forced.touch-portrait .touchbar {
          --touch-size: clamp(40px, 11.5vw, 48px);
          --stick-size: clamp(78px, 23vw, 96px);
        }
        body.touch-forced.touch-portrait .touch-cluster {
          gap: 5px !important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const bindButtonFeedback = () => {
    document.querySelectorAll("[data-touch]").forEach((button) => {
      if (button.dataset.mobileTouchBound) return;
      button.dataset.mobileTouchBound = "true";

      const setActive = () => button.classList.add("is-touching");
      const clearActive = () => button.classList.remove("is-touching");

      button.addEventListener("pointerdown", setActive, { passive: true });
      button.addEventListener("pointerup", clearActive, { passive: true });
      button.addEventListener("pointercancel", clearActive, { passive: true });
      button.addEventListener("pointerleave", clearActive, { passive: true });
      button.addEventListener("lostpointercapture", clearActive, { passive: true });
    });
  };

  const actionButtons = () => new Map(
    [...document.querySelectorAll("[data-touch]")].map((button) => [button.dataset.touch, button])
  );

  const heldVirtualActions = new Set();

  const setVirtualAction = (action, down) => {
    if (!action) return;
    const alreadyDown = heldVirtualActions.has(action);
    if (down === alreadyDown) return;

    const button = actionButtons().get(action);
    if (!button) return;

    if (down) {
      heldVirtualActions.add(action);
      button.classList.add("is-touching");
      button.dispatchEvent(new Event("pointerdown", { bubbles: true, cancelable: true }));
    } else {
      heldVirtualActions.delete(action);
      button.classList.remove("is-touching");
      button.dispatchEvent(new Event("pointerup", { bubbles: true, cancelable: true }));
    }
  };

  const releaseVirtualActions = (actions) => {
    actions.forEach((action) => setVirtualAction(action, false));
  };

  const buildVirtualControls = () => {
    const touchbar = document.getElementById("touchControls");
    if (!touchbar || touchbar.querySelector(".joystick-layer")) return;

    touchbar.classList.add("has-joysticks");

    const layer = document.createElement("div");
    layer.className = "joystick-layer";
    layer.innerHTML = `
      <div class="virtual-stick virtual-stick--move" data-stick="move" aria-label="Move joystick" role="group">
        <span class="virtual-stick__knob"></span>
        <span class="virtual-stick__label">Move</span>
      </div>
      <div class="touch-quick" aria-label="Quick actions">
        <button type="button" class="touch-quick-dash" data-virtual-action="dash">Dash</button>
        <button type="button" data-virtual-action="overdrive">OD</button>
        <button type="button" class="touch-quick-use is-hidden" data-virtual-action="interact">Use</button>
        <button type="button" data-virtual-action="pause">Pause</button>
      </div>
      <div class="virtual-stick virtual-stick--fire" data-stick="fire" aria-label="Fire joystick" role="group">
        <span class="virtual-stick__knob"></span>
        <span class="virtual-stick__label">Aim / Fire</span>
      </div>
    `;
    touchbar.appendChild(layer);

    bindStick(layer.querySelector('[data-stick="move"]'), {
      actions: ["left", "right", "jump", "down"],
      update: ({ x, y }) => {
        setVirtualAction("left", x < -0.3);
        setVirtualAction("right", x > 0.3);
        setVirtualAction("jump", y < -0.42);
        setVirtualAction("down", y > 0.55);
      }
    });

    bindStick(layer.querySelector('[data-stick="fire"]'), {
      actions: ["fire"],
      activation: 0.12,
      deadZone: 0.14,
      knobTravel: 42,
      smoothing: 0.58,
      activeOnHold: true,
      update: ({ x, y, active, distance }) => {
        setVirtualAction("fire", active);
        dispatchVirtualAim(x, y, distance, active);
      }
    });

    layer.querySelectorAll("[data-virtual-action]").forEach((button) => {
      const action = button.dataset.virtualAction;
      const down = (event) => {
        event.preventDefault();
        button.classList.add("is-touching");
        setVirtualAction(action, true);
      };
      const up = (event) => {
        event.preventDefault();
        button.classList.remove("is-touching");
        setVirtualAction(action, false);
      };
      button.addEventListener("pointerdown", down);
      button.addEventListener("pointerup", up);
      button.addEventListener("pointercancel", up);
      button.addEventListener("pointerleave", up);
    });

    const syncUse = () => {
      const nativeUse = document.getElementById("touchUseButton");
      const quickUse = layer.querySelector(".touch-quick-use");
      quickUse?.classList.toggle("is-hidden", nativeUse?.classList.contains("is-hidden") ?? true);
    };
    syncUse();
    const nativeUse = document.getElementById("touchUseButton");
    if (nativeUse) new MutationObserver(syncUse).observe(nativeUse, { attributes: true, attributeFilter: ["class"] });
  };

  const bindStick = (stick, config) => {
    if (!stick) return;
    const knob = stick.querySelector(".virtual-stick__knob");
    let pointerId = null;
    let visualX = 0;
    let visualY = 0;

    const reset = () => {
      pointerId = null;
      visualX = 0;
      visualY = 0;
      stick.classList.remove("is-active");
      if (knob) knob.style.transform = "translate(-50%, -50%)";
      releaseVirtualActions(config.actions);
      config.update?.({ x: 0, y: 0, distance: 0, rawDistance: 0, active: false });
    };

    const update = (event) => {
      if (pointerId !== null && event.pointerId !== pointerId) return;
      event.preventDefault();

      const rect = stick.getBoundingClientRect();
      const radius = Math.max(1, rect.width / 2);
      const centerX = rect.left + radius;
      const centerY = rect.top + radius;
      const rawX = (event.clientX - centerX) / radius;
      const rawY = (event.clientY - centerY) / radius;
      const rawDistance = Math.hypot(rawX, rawY);
      const deadZone = config.deadZone ?? 0.12;
      const clampedDistance = Math.min(1, rawDistance);
      const distance = clampedDistance <= deadZone ? 0 : (clampedDistance - deadZone) / (1 - deadZone);
      const angle = Math.atan2(rawY, rawX);
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const active = config.activeOnHold || rawDistance > (config.activation ?? 0.18);
      const travel = config.knobTravel ?? Math.min(46, radius * 0.5);
      const smoothing = config.smoothing ?? 1;
      visualX += (x - visualX) * smoothing;
      visualY += (y - visualY) * smoothing;

      if (knob) {
        knob.style.transform = `translate(calc(-50% + ${visualX * travel}px), calc(-50% + ${visualY * travel}px))`;
      }
      config.update({ x, y, distance, rawDistance, active });
    };

    stick.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      pointerId = event.pointerId;
      stick.classList.add("is-active");
      if (stick.setPointerCapture) stick.setPointerCapture(event.pointerId);
      update(event);
    });
    stick.addEventListener("pointermove", update);
    stick.addEventListener("pointerup", reset);
    stick.addEventListener("pointercancel", reset);
    stick.addEventListener("lostpointercapture", reset);
  };

  const dispatchVirtualAim = (x, y, distance, active) => {
    window.dispatchEvent(new CustomEvent("lottomind:virtual-aim", {
      detail: {
        x,
        y,
        distance,
        active
      }
    }));
  };

  const preventGameGesture = (event) => {
    if (event.target?.closest?.(".game-shell")) event.preventDefault();
  };

  const boot = () => {
    setTouchPreference();
    markTouch();
    injectTouchCss();
    bindButtonFeedback();
    buildVirtualControls();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  document.addEventListener("gesturestart", preventGameGesture, { passive: false });
  document.addEventListener("gesturechange", preventGameGesture, { passive: false });
  document.addEventListener("touchmove", preventGameGesture, { passive: false });
  window.addEventListener("resize", updateOrientation, { passive: true });
  window.addEventListener("orientationchange", () => setTimeout(updateOrientation, 80), { passive: true });
})();
