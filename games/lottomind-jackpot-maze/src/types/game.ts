export type LotteryMode = 'pick3' | 'pick4' | 'megaMillions' | 'powerball';
export type PlayerCount = 1 | 2;
export type PlayStyle = 'solo' | 'alternating' | 'coop';
export type ControlPreset = 'wasd' | 'arrows' | 'ijkl';
export type ControlAction = 'up' | 'down' | 'left' | 'right' | 'power';
export type StreetBonusKind = 'cash' | 'ticket' | 'scratch';
export type CompassDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export interface ControlBindings {
  up: string;
  down: string;
  left: string;
  right: string;
  power: string;
}

export interface LotteryRule {
  id: LotteryMode;
  label: string;
  mainCount: number;
  mainMin: number;
  mainMax: number;
  uniqueMain: boolean;
  sortMain: boolean;
  special?: { label: string; min: number; max: number; color: 'gold' | 'red' };
}

export interface LotteryDraw {
  mode: LotteryMode;
  main: number[];
  special?: number;
}

export interface GameSnapshot {
  world: number;
  score: number;
  activePlayer: 0 | 1;
  playerCount: PlayerCount;
  playerScores: [number, number];
  playerLives: [number, number];
  playerShields: [boolean, boolean];
  downedPlayers: [boolean, boolean];
  reviveProgress: [number, number];
  coins: number;
  remainingHearts: number;
  lives: number;
  combo: number;
  revealed: Array<number | null>;
  totalSlots: number;
  specialIndex?: number;
  warning?: string;
  powerUp: string;
  hasMoved: boolean;
  usedPortal: boolean;
  powerUpsUsed: number;
  villainEncounters: number;
  revivesCompleted: number;
  bossHealth: number;
  bossMaxHealth: number;
  mechanic: string;
  bonusEffect?: StreetBonusKind;
  bonusesCollected: number;
  bestCombo: number;
  teamCombo: number;
  heartsCollected: number;
  levelHeartsTotal: number;
  bonusSeconds: number;
  bonusActive: boolean;
  bonusDirection?: CompassDirection;
  syncGateReady: boolean;
  teammateDirections?: [CompassDirection, CompassDirection];
  eventName?: string;
  eventSeconds: number;
  eventsCompleted: number;
  missedBonuses: number;
}

export interface GameCheckpoint {
  version: 1;
  savedAt: string;
  world: number;
  draw: LotteryDraw;
  playStyle: PlayStyle;
  score: number;
  activePlayer: 0 | 1;
  playerScores: [number, number];
  playerLives: [number, number];
  playerShields: [boolean, boolean];
  lives: number;
  shielded: boolean;
  revealed: Array<number | null>;
  nextReveal: number;
  pellets: number;
  villainEncounters: number;
  powerUpsUsed: number;
  bonusesCollected?: number;
  remainingHeartKeys?: string[];
  remainingPowerKeys?: string[];
  worldCollected?: number;
  bossHealth?: number;
  bestCombo?: number;
  eventsCompleted?: number;
  missedBonuses?: number;
  levelGrades?: Array<'S' | 'A' | 'B' | 'C'>;
}

export interface SavedResult extends LotteryDraw {
  id: string;
  createdAt: string;
  level: number;
  score: number;
  villainEncounters: number;
  powerUpsUsed: number;
  playerCount?: PlayerCount;
  playStyle?: PlayStyle;
  playerScores?: [number, number];
  grade?: 'S' | 'A' | 'B' | 'C';
  achievements?: string[];
  daily?: boolean;
  heartsCollected?: number;
  bonusesCollected?: number;
  bestCombo?: number;
  missedBonuses?: number;
  eventsCompleted?: number;
  levelGrades?: Array<'S' | 'A' | 'B' | 'C'>;
}
