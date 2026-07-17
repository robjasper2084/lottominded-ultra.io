import type { DetroitMissionProgress, LevelMissionStats } from '../types/game';

type MissionStat = keyof LevelMissionStats;

interface MissionDefinition {
  stat: MissionStat;
  label: string;
  target: number;
  reward: number;
}

const ROTATIONS: ReadonlyArray<ReadonlyArray<MissionStat>> = [
  ['hearts', 'portals', 'bestStreak'],
  ['hearts', 'villains', 'bonuses'],
  ['portals', 'bestStreak', 'villains'],
  ['hearts', 'bonuses', 'bestStreak'],
  ['portals', 'villains', 'bonuses'],
  ['hearts', 'bestStreak', 'villains'],
  ['portals', 'bonuses', 'bestStreak'],
  ['hearts', 'villains', 'portals'],
  ['bonuses', 'bestStreak', 'villains'],
  ['hearts', 'portals', 'villains']
];

export const EMPTY_MISSION_STATS: LevelMissionStats = { hearts: 0, portals: 0, bonuses: 0, villains: 0, bestStreak: 1 };

export function missionDefinitions(level: number): MissionDefinition[] {
  const normalized = ((Math.trunc(level) % ROTATIONS.length) + ROTATIONS.length) % ROTATIONS.length;
  return ROTATIONS[normalized].map(stat => {
    if (stat === 'hearts') return { stat, label: 'LOVE IN THE STREETS', target: 12 + normalized, reward: 500 };
    if (stat === 'portals') return { stat, label: 'PORTAL EXPRESS', target: normalized >= 4 ? 2 : 1, reward: 650 };
    if (stat === 'bonuses') return { stat, label: 'BONUS HUNTER', target: 1, reward: 750 };
    if (stat === 'villains') return { stat, label: 'VILLAIN SWEEP', target: normalized >= 5 ? 2 : 1, reward: 800 };
    return { stat, label: 'HEART STREAK', target: Math.min(7, 4 + Math.floor(normalized / 2)), reward: 600 };
  });
}

export function evaluateDetroitMissions(level: number, stats: LevelMissionStats): DetroitMissionProgress[] {
  return missionDefinitions(level).map(definition => ({
    id: `l${level + 1}-${definition.stat}`,
    label: definition.label,
    current: Math.min(definition.target, stats[definition.stat]),
    target: definition.target,
    complete: stats[definition.stat] >= definition.target,
    reward: definition.reward
  }));
}
