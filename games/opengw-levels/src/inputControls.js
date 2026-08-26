const GAMEPAD_DEADZONE = 0.18;

export function readStandardGamepad(pad) {
  if (!pad?.connected) return null;
  const dpadX = Number(isPressed(pad, 15)) - Number(isPressed(pad, 14));
  const dpadY = Number(isPressed(pad, 13)) - Number(isPressed(pad, 12));
  const move = normalizedAxis((pad.axes?.[0] ?? 0) + dpadX, (pad.axes?.[1] ?? 0) + dpadY);
  const aim = normalizedAxis(pad.axes?.[2] ?? 0, pad.axes?.[3] ?? 0);
  const trigger = Math.max(buttonValue(pad, 7), buttonValue(pad, 5));
  return {
    move: move ?? { x: 0, y: 0 },
    aim,
    fire: Boolean(isPressed(pad, 0) || isPressed(pad, 5) || trigger > 0.2),
    bomb: Boolean(isPressed(pad, 1) || isPressed(pad, 2) || isPressed(pad, 4)),
    pause: isPressed(pad, 9),
    confirm: isPressed(pad, 0)
  };
}

function isPressed(pad, index) {
  return Boolean(pad.buttons?.[index]?.pressed);
}

function buttonValue(pad, index) {
  return Number(pad.buttons?.[index]?.value ?? 0);
}

function normalizedAxis(x, y) {
  const dx = applyDeadzone(x);
  const dy = applyDeadzone(y);
  const length = Math.hypot(dx, dy);
  return length > 0 ? { x: dx / length, y: dy / length } : null;
}

function applyDeadzone(value) {
  const amount = Number(value) || 0;
  if (Math.abs(amount) < GAMEPAD_DEADZONE) return 0;
  return Math.max(-1, Math.min(1, amount));
}
