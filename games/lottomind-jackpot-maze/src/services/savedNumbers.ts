import type { SavedResult } from '../types/game';

const STORAGE_KEY = 'lottomind.jackpotMaze.savedResults.v1';

export function loadSavedResults(storage: Pick<Storage, 'getItem'> = localStorage): SavedResult[] {
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveResult(result: SavedResult, storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage): SavedResult[] {
  const next = [result, ...loadSavedResults(storage)].slice(0, 50);
  storage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function makeResultId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `result-${Date.now()}`;
}
