const STORAGE_KEY = "gothtechnology.keymap.v2";

const DEFAULT_KEYMAP = Object.freeze({
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
  Slash: "p2.lightPunch",
  Period: "p2.heavyPunch",
  Semicolon: "p2.lightKick",
  Quote: "p2.heavyKick",
  BracketRight: "p2.special",
  Backslash: "p2.super",
  Comma: "p2.throw",
  Minus: "p2.assist1",
  Equal: "p2.assist2",
  BracketLeft: "p2.taunt",
  ShiftRight: "p2.dash",
  Enter: "ui.confirm",
  Space: "ui.confirm",
  Escape: "ui.back",
  KeyP: "ui.pause",
  KeyC: "ui.cpu",
  KeyT: "ui.training",
  KeyB: "ui.debug",
  KeyG: "ui.mute",
  KeyR: "ui.reset",
  KeyV: "ui.dummy",
  KeyF: "ui.record",
  KeyE: "ui.playback",
  KeyX: "ui.frameData"
});

const isEditableTarget = (target) => {
  const tag = target?.tagName?.toLowerCase?.();
  return Boolean(target?.isContentEditable || ["button", "input", "select", "textarea"].includes(tag));
};

const buttonPressed = (pad, index) => Boolean(pad?.buttons?.[index]?.pressed || (pad?.buttons?.[index]?.value ?? 0) > 0.55);

export class InputManager {
  constructor(target = window) {
    this.target = target;
    this.down = new Set();
    this.pressed = new Set();
    this.released = new Set();
    this.gamepadHeld = new Set();
    this.touchPointers = new Map();
    this.touchBindings = [];
    this.lastTap = new Map();
    this.dashWindow = 0.24;
    this.keymap = this.loadKeymap();

    this.keydownHandler = (event) => this.onKey(event, true);
    this.keyupHandler = (event) => this.onKey(event, false);
    this.blurHandler = () => this.clear();
    this.visibilityHandler = () => {
      if (document.hidden) this.clear();
    };
    this.pointerUpHandler = (event) => this.releaseTouchPointer(event.pointerId);
    this.pointerCancelHandler = (event) => this.releaseTouchPointer(event.pointerId);

    target.addEventListener("keydown", this.keydownHandler, { passive: false });
    target.addEventListener("keyup", this.keyupHandler, { passive: false });
    target.addEventListener("blur", this.blurHandler);
    document.addEventListener("visibilitychange", this.visibilityHandler);
    window.addEventListener("pointerup", this.pointerUpHandler);
    window.addEventListener("pointercancel", this.pointerCancelHandler);
    this.bindTouchControls();
  }

  loadKeymap() {
    try {
      const saved = JSON.parse(window.localStorage?.getItem(STORAGE_KEY) || "null");
      if (saved && typeof saved === "object") return { ...DEFAULT_KEYMAP, ...saved };
    } catch {
      // Invalid or blocked storage falls back to the built-in bindings.
    }
    return { ...DEFAULT_KEYMAP };
  }

  saveKeymap() {
    try {
      window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(this.keymap));
    } catch {
      // Remapping still works for the current session when storage is unavailable.
    }
    window.dispatchEvent(new CustomEvent("gothtechnology:keymap-changed"));
  }

  getBinding(action) {
    return Object.entries(this.keymap).find(([, mappedAction]) => mappedAction === action)?.[0] || "Unbound";
  }

  rebind(action, code) {
    if (!action || !code) return false;
    for (const [mappedCode, mappedAction] of Object.entries(this.keymap)) {
      if (mappedAction === action || mappedCode === code) delete this.keymap[mappedCode];
    }
    this.keymap[code] = action;
    this.saveKeymap();
    return true;
  }

  resetBindings() {
    this.keymap = { ...DEFAULT_KEYMAP };
    this.saveKeymap();
  }

  onKey(event, isDown) {
    if (isEditableTarget(event.target)) return;
    const action = this.keymap[event.code];
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
          // Pointer capture is best-effort; release guards still clean up.
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
      const blockContextMenu = (event) => event.preventDefault();
      for (const eventName of ["pointerdown"]) button.addEventListener(eventName, hold);
      for (const eventName of ["pointerup", "pointercancel", "pointerleave", "lostpointercapture"]) {
        button.addEventListener(eventName, release);
      }
      button.addEventListener("contextmenu", blockContextMenu);
      this.touchBindings.push({ button, hold, release, blockContextMenu });
    });
  }

  pollGamepads() {
    const pads = Array.from(navigator.getGamepads?.() || []).filter(Boolean).slice(0, 2);
    const nextHeld = new Set();
    pads.forEach((pad, index) => {
      const player = index + 1;
      const prefix = `p${player}`;
      const axisX = pad.axes?.[0] ?? 0;
      const axisY = pad.axes?.[1] ?? 0;
      const add = (active, action) => {
        if (active) nextHeld.add(action);
      };
      add(axisX < -0.45 || buttonPressed(pad, 14), `${prefix}.left`);
      add(axisX > 0.45 || buttonPressed(pad, 15), `${prefix}.right`);
      add(axisY < -0.5 || buttonPressed(pad, 12), `${prefix}.up`);
      add(axisY > 0.5 || buttonPressed(pad, 13), `${prefix}.down`);
      add(buttonPressed(pad, 0), `${prefix}.lightPunch`);
      add(buttonPressed(pad, 1), `${prefix}.lightKick`);
      add(buttonPressed(pad, 2), `${prefix}.heavyPunch`);
      add(buttonPressed(pad, 3), `${prefix}.heavyKick`);
      add(buttonPressed(pad, 4), `${prefix}.assist1`);
      add(buttonPressed(pad, 5), `${prefix}.assist2`);
      add(buttonPressed(pad, 6), `${prefix}.throw`);
      add(buttonPressed(pad, 7), `${prefix}.special`);
      add(buttonPressed(pad, 8), `${prefix}.super`);
      add(buttonPressed(pad, 9), "ui.pause");
      add(buttonPressed(pad, 10), `${prefix}.dash`);
      add(buttonPressed(pad, 11), `${prefix}.taunt`);
    });

    for (const action of nextHeld) {
      if (!this.gamepadHeld.has(action)) this.pressed.add(action);
    }
    for (const action of this.gamepadHeld) {
      if (!nextHeld.has(action)) this.released.add(action);
    }
    this.gamepadHeld = nextHeld;
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
    this.gamepadHeld.clear();
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
    return this.down.has(action) || this.gamepadHeld.has(action);
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
    const modifier = this.isDown(`${p}.modifier`);
    const lightPunch = this.consume(`${p}.lightPunch`);
    const heavyPunch = this.consume(`${p}.heavyPunch`);
    const lightKick = this.consume(`${p}.lightKick`);
    const heavyKick = this.consume(`${p}.heavyKick`);
    const special = this.consume(`${p}.special`);
    return {
      left: this.isDown(`${p}.left`),
      right: this.isDown(`${p}.right`),
      up: this.isDown(`${p}.up`),
      down: this.isDown(`${p}.down`),
      lightPunch: !modifier && lightPunch,
      heavyPunch: !modifier && heavyPunch,
      lightKick: !modifier && lightKick,
      heavyKick: !modifier && heavyKick,
      special: !modifier && special,
      super: this.consume(`${p}.super`) || (modifier && heavyPunch),
      throw: this.consume(`${p}.throw`) || (modifier && lightPunch),
      assist1: this.consume(`${p}.assist1`) || (modifier && lightKick),
      assist2: this.consume(`${p}.assist2`) || (modifier && heavyKick),
      taunt: this.consume(`${p}.taunt`) || (modifier && special),
      dash: this.consume(`${p}.dash`) || this.consume(`${p}.dashTap`)
    };
  }

  endFrame() {
    this.pressed.clear();
    this.released.clear();
  }

  destroy() {
    this.clear();
    this.target.removeEventListener("keydown", this.keydownHandler);
    this.target.removeEventListener("keyup", this.keyupHandler);
    this.target.removeEventListener("blur", this.blurHandler);
    document.removeEventListener("visibilitychange", this.visibilityHandler);
    window.removeEventListener("pointerup", this.pointerUpHandler);
    window.removeEventListener("pointercancel", this.pointerCancelHandler);
    for (const { button, hold, release, blockContextMenu } of this.touchBindings) {
      button.removeEventListener("pointerdown", hold);
      for (const eventName of ["pointerup", "pointercancel", "pointerleave", "lostpointercapture"]) {
        button.removeEventListener(eventName, release);
      }
      button.removeEventListener("contextmenu", blockContextMenu);
    }
    this.touchBindings = [];
  }
}
