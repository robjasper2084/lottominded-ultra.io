const KEYMAP = {
  KeyA: "p1.left",
  KeyD: "p1.right",
  KeyW: "p1.up",
  KeyS: "p1.down",
  KeyJ: "p1.lightPunch",
  KeyU: "p1.heavyPunch",
  KeyK: "p1.lightKick",
  KeyI: "p1.heavyKick",
  KeyL: "p1.special",
  KeyO: "p1.super",
  KeyH: "p1.throw",
  KeyN: "p1.assist1",
  KeyM: "p1.assist2",
  KeyY: "p1.taunt",
  ShiftLeft: "p1.dash",
  ArrowLeft: "p2.left",
  ArrowRight: "p2.right",
  ArrowUp: "p2.up",
  ArrowDown: "p2.down",
  Numpad1: "p2.lightPunch",
  Numpad4: "p2.heavyPunch",
  Numpad2: "p2.lightKick",
  Numpad5: "p2.heavyKick",
  Numpad3: "p2.special",
  Numpad6: "p2.super",
  Numpad0: "p2.throw",
  Numpad7: "p2.assist1",
  Numpad8: "p2.assist2",
  Numpad9: "p2.taunt",
  ShiftRight: "p2.dash",
  Enter: "ui.confirm",
  Space: "ui.confirm",
  Escape: "ui.back",
  KeyP: "ui.pause",
  KeyC: "ui.cpu",
  KeyT: "ui.training",
  KeyB: "ui.debug",
  KeyG: "ui.mute",
  KeyR: "ui.reset"
};

export class InputManager {
  constructor(target = window) {
    this.down = new Set();
    this.pressed = new Set();
    this.released = new Set();
    this.touchHeld = new Set();
    this.touchPointers = new Map();
    this.lastTap = new Map();
    this.dashWindow = 0.24;

    target.addEventListener("keydown", (event) => this.onKey(event, true), { passive: false });
    target.addEventListener("keyup", (event) => this.onKey(event, false), { passive: false });
    target.addEventListener("blur", () => this.clear());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.clear();
    });
    this.bindTouchControls();
  }

  onKey(event, isDown) {
    const action = KEYMAP[event.code];
    if (!action) return;
    event.preventDefault();
    if (isDown) this.press(action);
    else this.release(action);
  }

  bindTouchControls() {
    document.querySelectorAll("[data-touch]").forEach((button) => {
      const action = button.getAttribute("data-touch");
      const hold = (event) => {
        event.preventDefault();
        try {
          button.setPointerCapture?.(event.pointerId);
        } catch {
          // Pointer capture is best-effort; touch release guards below still clean up.
        }
        this.touchPointers.set(event.pointerId, action);
        button.dataset.held = "true";
        this.press(action);
      };
      const release = (event) => {
        event.preventDefault();
        try {
          if (button.hasPointerCapture?.(event.pointerId)) button.releasePointerCapture(event.pointerId);
        } catch {
          // Some mobile browsers throw if capture was already released.
        }
        this.touchPointers.delete(event.pointerId);
        button.dataset.held = "false";
        this.release(action);
      };
      button.addEventListener("pointerdown", hold);
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("pointerleave", release);
      button.addEventListener("lostpointercapture", release);
      button.addEventListener("contextmenu", (event) => event.preventDefault());
    });
    window.addEventListener("pointerup", (event) => this.releaseTouchPointer(event.pointerId));
    window.addEventListener("pointercancel", (event) => this.releaseTouchPointer(event.pointerId));
  }

  press(action) {
    if (!this.down.has(action)) {
      this.pressed.add(action);
      if (action.endsWith(".left") || action.endsWith(".right")) {
        const now = performance.now() / 1000;
        const last = this.lastTap.get(action) ?? -10;
        if (now - last < this.dashWindow) this.pressed.add(action.replace(/\.(left|right)$/, ".dashTap"));
        this.lastTap.set(action, now);
      }
    }
    this.down.add(action);
  }

  release(action) {
    if (this.down.has(action)) this.released.add(action);
    this.down.delete(action);
  }

  clear() {
    this.down.clear();
    this.pressed.clear();
    this.released.clear();
    this.releaseTouchButtons();
  }

  releaseTouchButtons() {
    this.touchPointers.clear();
    document.querySelectorAll("[data-touch]").forEach((button) => {
      button.dataset.held = "false";
      const action = button.getAttribute("data-touch");
      if (action) this.down.delete(action);
    });
  }

  releaseTouchPointer(pointerId) {
    const action = this.touchPointers.get(pointerId);
    if (!action) return;
    this.touchPointers.delete(pointerId);
    this.release(action);
    document.querySelectorAll(`[data-touch="${action}"]`).forEach((button) => {
      button.dataset.held = "false";
    });
  }

  isDown(action) {
    return this.down.has(action);
  }

  wasPressed(action) {
    return this.pressed.has(action);
  }

  consume(action) {
    const hit = this.pressed.has(action);
    this.pressed.delete(action);
    return hit;
  }

  actions(player) {
    const p = `p${player}`;
    return {
      left: this.down.has(`${p}.left`),
      right: this.down.has(`${p}.right`),
      up: this.down.has(`${p}.up`),
      down: this.down.has(`${p}.down`),
      lightPunch: this.consume(`${p}.lightPunch`),
      heavyPunch: this.consume(`${p}.heavyPunch`),
      lightKick: this.consume(`${p}.lightKick`),
      heavyKick: this.consume(`${p}.heavyKick`),
      special: this.consume(`${p}.special`),
      super: this.consume(`${p}.super`),
      throw: this.consume(`${p}.throw`),
      assist1: this.consume(`${p}.assist1`),
      assist2: this.consume(`${p}.assist2`),
      taunt: this.consume(`${p}.taunt`),
      dash: this.consume(`${p}.dash`) || this.consume(`${p}.dashTap`)
    };
  }

  endFrame() {
    this.pressed.clear();
    this.released.clear();
  }
}
