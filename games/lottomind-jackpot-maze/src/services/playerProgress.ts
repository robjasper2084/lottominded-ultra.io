import type { CosmeticId, RunVariant, SavedResult } from '../types/game';

export interface CosmeticDefinition {
  id: CosmeticId;
  label: string;
  description: string;
  heroTint: number;
  dogTint: number;
  portalBoost: number;
}

export interface PlayerProgress {
  version: 1;
  totalScore: number;
  completedRuns: number;
  missionsCompleted: number;
  dailyBest: Record<string, number>;
  unlocked: CosmeticId[];
  selected: CosmeticId;
}

const KEY = 'lottomind.jackpotMaze.playerProgress.v1';

export const COSMETICS: CosmeticDefinition[] = [
  { id: 'classic', label: 'Detroit Classic', description: 'Original mascot and portal colors.', heroTint: 0xffffff, dogTint: 0xffffff, portalBoost: 0x000000 },
  { id: 'motorGold', label: 'Motor City Gold', description: 'Unlock at 25,000 lifetime points.', heroTint: 0xffe09a, dogTint: 0xffc76c, portalBoost: 0xffd45d },
  { id: 'riverIce', label: 'Riverfront Ice', description: 'Unlock after completing one full run.', heroTint: 0xbbeeff, dogTint: 0x9bdcff, portalBoost: 0x55dfff },
  { id: 'purple313', label: '313 Purple', description: 'Unlock after completing 10 missions.', heroTint: 0xe0bbff, dogTint: 0xd498ff, portalBoost: 0xb574ff },
  { id: 'jackpotChrome', label: 'Jackpot Chrome', description: 'Unlock by finishing a Daily Detroit run.', heroTint: 0xf4fbff, dogTint: 0xe3ecff, portalBoost: 0xffffff }
];

export const defaultPlayerProgress: PlayerProgress = { version: 1, totalScore: 0, completedRuns: 0, missionsCompleted: 0, dailyBest: {}, unlocked: ['classic'], selected: 'classic' };

export function dailyChallengeKey(date = new Date()): string { return date.toISOString().slice(0, 10); }

export function loadPlayerProgress(storage: Pick<Storage, 'getItem'> = localStorage): PlayerProgress {
  try {
    const saved = JSON.parse(storage.getItem(KEY) ?? '{}') as Partial<PlayerProgress>;
    const unlocked: CosmeticId[] = Array.isArray(saved.unlocked) ? saved.unlocked.filter((id): id is CosmeticId => COSMETICS.some(item => item.id === id)) : ['classic'];
    const selected = unlocked.includes(saved.selected ?? 'classic') ? saved.selected ?? 'classic' : 'classic';
    return { ...defaultPlayerProgress, ...saved, version: 1, unlocked: unlocked.length ? unlocked : ['classic'], selected, dailyBest: saved.dailyBest ?? {} };
  } catch { return { ...defaultPlayerProgress }; }
}

export function savePlayerProgress(progress: PlayerProgress, storage: Pick<Storage, 'setItem'> = localStorage): PlayerProgress {
  storage.setItem(KEY, JSON.stringify(progress)); return progress;
}

export function recordCompletedRun(result: SavedResult, storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage): { progress: PlayerProgress; newUnlocks: CosmeticId[] } {
  const current = loadPlayerProgress(storage);
  const next: PlayerProgress = {
    ...current,
    totalScore: current.totalScore + result.score,
    completedRuns: current.completedRuns + 1,
    missionsCompleted: current.missionsCompleted + (result.missionsCompleted ?? 0),
    dailyBest: { ...current.dailyBest }
  };
  if (result.runVariant === 'daily' || result.daily) {
    const key = dailyChallengeKey(new Date(result.createdAt));
    next.dailyBest[key] = Math.max(next.dailyBest[key] ?? 0, result.score);
  }
  const eligible: CosmeticId[] = ['classic'];
  if (next.totalScore >= 25_000) eligible.push('motorGold');
  if (next.completedRuns >= 1) eligible.push('riverIce');
  if (next.missionsCompleted >= 10) eligible.push('purple313');
  if (Object.keys(next.dailyBest).length > 0) eligible.push('jackpotChrome');
  const newUnlocks = eligible.filter(id => !current.unlocked.includes(id));
  next.unlocked = [...new Set([...current.unlocked, ...eligible])];
  savePlayerProgress(next, storage);
  return { progress: next, newUnlocks };
}

export function selectCosmetic(id: CosmeticId, storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage): PlayerProgress {
  const current = loadPlayerProgress(storage);
  if (!current.unlocked.includes(id)) return current;
  return savePlayerProgress({ ...current, selected: id }, storage);
}

export function runVariantLabel(variant: RunVariant): string {
  return variant === 'timeAttack' ? 'TIME ATTACK' : variant === 'daily' ? 'DAILY DETROIT' : 'CLASSIC RUN';
}
