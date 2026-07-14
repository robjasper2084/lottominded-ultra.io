import type { LotteryMode, LotteryRule } from '../types/game';

export const LOTTERY_RULES: Record<LotteryMode, LotteryRule> = {
  pick3: {
    id: 'pick3', label: 'Pick 3', mainCount: 3, mainMin: 0, mainMax: 9,
    uniqueMain: false, sortMain: false
  },
  pick4: {
    id: 'pick4', label: 'Pick 4', mainCount: 4, mainMin: 0, mainMax: 9,
    uniqueMain: false, sortMain: false
  },
  megaMillions: {
    id: 'megaMillions', label: 'Mega Millions', mainCount: 5, mainMin: 1, mainMax: 70,
    uniqueMain: true, sortMain: true,
    special: { label: 'Mega Ball', min: 1, max: 24, color: 'gold' }
  },
  powerball: {
    id: 'powerball', label: 'Powerball', mainCount: 5, mainMin: 1, mainMax: 69,
    uniqueMain: true, sortMain: true,
    special: { label: 'Powerball', min: 1, max: 26, color: 'red' }
  }
};

export function assertRule(rule: LotteryRule): void {
  if (!Number.isInteger(rule.mainCount) || rule.mainCount <= 0) throw new Error('mainCount must be a positive integer');
  if (!Number.isInteger(rule.mainMin) || !Number.isInteger(rule.mainMax) || rule.mainMin > rule.mainMax) {
    throw new Error('main number range is invalid');
  }
  if (rule.uniqueMain && rule.mainMax - rule.mainMin + 1 < rule.mainCount) {
    throw new Error('unique main number range is smaller than mainCount');
  }
  if (rule.special && (!Number.isInteger(rule.special.min) || !Number.isInteger(rule.special.max) || rule.special.min > rule.special.max)) {
    throw new Error('special ball range is invalid');
  }
}
