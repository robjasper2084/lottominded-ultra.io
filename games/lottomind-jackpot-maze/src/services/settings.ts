import type { ControlBindings, ControlPreset } from '../types/game';

export interface GameSettings {
  reducedMotion: boolean;
  highContrast: boolean;
  screenShake: boolean;
  gameSpeed: number;
  muted: boolean;
  musicVolume: number;
  effectsVolume: number;
  p1Controls: ControlPreset;
  p2Controls: ControlPreset;
  tutorialSeen: boolean;
  haptics: boolean;
  p1Bindings: ControlBindings;
  p2Bindings: ControlBindings;
  hudScale: number;
}

const KEY = 'lottomind.jackpotMaze.settings.v1';
export const defaultSettings: GameSettings = {
  reducedMotion: false, highContrast: false, screenShake: true, gameSpeed: 1, muted: false,
  musicVolume: 0.42, effectsVolume: 0.72, p1Controls: 'wasd', p2Controls: 'arrows', tutorialSeen: false, haptics: true,
  p1Bindings: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', power: 'Space' },
  p2Bindings: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', power: 'Enter' },
  hudScale: 1
};

export function loadSettings(): GameSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<GameSettings>;
    return { ...defaultSettings, ...saved, p1Bindings: { ...defaultSettings.p1Bindings, ...saved.p1Bindings }, p2Bindings: { ...defaultSettings.p2Bindings, ...saved.p2Bindings } };
  }
  catch { return defaultSettings; }
}

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(KEY, JSON.stringify(settings));
}
