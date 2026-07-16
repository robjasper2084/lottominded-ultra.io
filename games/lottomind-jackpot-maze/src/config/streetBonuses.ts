import type { BonusTier, StreetBonusKind } from '../types/game';

export interface StreetBonusDefinition {
  kind: StreetBonusKind;
  label: string;
  pickupLabel: string;
  effect: string;
  texture: string;
  durationMs: number;
  score: number;
  color: number;
}

export const STREET_BONUS_ORDER: StreetBonusKind[] = ['cash', 'ticket', 'scratch'];
export const STREET_BONUS_SPAWN_INTERVAL_MS = 30_000;
export const STREET_BONUS_SPEED_TILES_PER_SECOND = 1.65;

export const BONUS_TIERS: Record<BonusTier, { label: string; scoreMultiplier: number; durationMultiplier: number; color: number; colorCss: string }> = {
  bronze: { label: 'BRONZE', scoreMultiplier: 1, durationMultiplier: 1, color: 0xc9854d, colorCss: '#c9854d' },
  silver: { label: 'SILVER', scoreMultiplier: 1.5, durationMultiplier: 1.25, color: 0xd9f3ff, colorCss: '#d9f3ff' },
  gold: { label: 'GOLD', scoreMultiplier: 2.5, durationMultiplier: 1.6, color: 0xffdf59, colorCss: '#ffdf59' }
};

export function bonusTierForSpawn(level: number, spawnIndex: number, runSeed: number): BonusTier {
  let value = (runSeed ^ Math.imul(level + 1, 0x9e3779b9) ^ Math.imul(spawnIndex + 1, 0x45d9f3b)) >>> 0;
  value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
  const roll = (value >>> 0) % 100;
  const goldChance = Math.min(22, 8 + Math.max(0, level));
  if (roll < goldChance) return 'gold';
  if (roll < goldChance + 30) return 'silver';
  return 'bronze';
}

export const STREET_BONUSES: Record<StreetBonusKind, StreetBonusDefinition> = {
  cash: {
    kind: 'cash',
    label: 'CASH STACK',
    pickupLabel: 'CASH X2',
    effect: 'DOUBLE HEART POINTS',
    texture: 'bonusCash',
    durationMs: 8000,
    score: 1000,
    color: 0xffd45d
  },
  ticket: {
    kind: 'ticket',
    label: 'LUCKY TICKET',
    pickupLabel: 'TICKET RUSH',
    effect: 'SPEED BOOST',
    texture: 'bonusTicket',
    durationMs: 8000,
    score: 500,
    color: 0x43dcff
  },
  scratch: {
    kind: 'scratch',
    label: 'SCRATCH SHIELD',
    pickupLabel: 'SCRATCH SHIELD',
    effect: 'FORCE FIELD',
    texture: 'bonusScratch',
    durationMs: 12000,
    score: 300,
    color: 0xff5dcb
  }
};
