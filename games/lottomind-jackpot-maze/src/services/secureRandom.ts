import { assertRule, LOTTERY_RULES } from '../config/lotteryRules';
import type { LotteryDraw, LotteryMode, LotteryRule } from '../types/game';

export function secureInt(min: number, max: number, cryptoSource: Crypto = globalThis.crypto): number {
  if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) throw new Error('secureInt range is invalid');
  if (!cryptoSource?.getRandomValues) throw new Error('Secure random number generation is unavailable');
  const span = max - min + 1;
  if (span > 0x100000000) throw new Error('secureInt range is too large');
  const limit = Math.floor(0x100000000 / span) * span;
  const buffer = new Uint32Array(1);
  do cryptoSource.getRandomValues(buffer); while (buffer[0] >= limit);
  return min + (buffer[0] % span);
}

export function generateFromRule(rule: LotteryRule, cryptoSource: Crypto = globalThis.crypto): LotteryDraw {
  assertRule(rule);
  const values: number[] = [];
  while (values.length < rule.mainCount) {
    const candidate = secureInt(rule.mainMin, rule.mainMax, cryptoSource);
    if (!rule.uniqueMain || !values.includes(candidate)) values.push(candidate);
  }
  if (rule.sortMain) values.sort((a, b) => a - b);
  return {
    mode: rule.id,
    main: values,
    special: rule.special ? secureInt(rule.special.min, rule.special.max, cryptoSource) : undefined
  };
}

export function generateLotteryDraw(mode: LotteryMode, cryptoSource: Crypto = globalThis.crypto): LotteryDraw {
  return generateFromRule(LOTTERY_RULES[mode], cryptoSource);
}
