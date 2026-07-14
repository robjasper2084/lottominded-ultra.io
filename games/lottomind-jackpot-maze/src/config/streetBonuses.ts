import type { StreetBonusKind } from '../types/game';

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
