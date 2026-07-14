import type { GameCheckpoint } from '../types/game';

const KEY = 'lottomind.jackpotMaze.checkpoint.v1';

export function loadCheckpoint(storage: Pick<Storage, 'getItem'> = localStorage): GameCheckpoint | null {
  try {
    const value = JSON.parse(storage.getItem(KEY) ?? 'null') as GameCheckpoint | null;
    return value?.version === 1 && value.world >= 0 && value.world < 10 ? value : null;
  } catch { return null; }
}

export function saveCheckpoint(checkpoint: GameCheckpoint, storage: Pick<Storage, 'setItem'> = localStorage): GameCheckpoint {
  storage.setItem(KEY, JSON.stringify(checkpoint));
  return checkpoint;
}

export function clearCheckpoint(storage: Pick<Storage, 'removeItem'> = localStorage): void {
  storage.removeItem(KEY);
}
