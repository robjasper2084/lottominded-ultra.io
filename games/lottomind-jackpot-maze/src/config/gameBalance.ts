export const DETROIT_LEVELS = [
  { name: 'Eastside Grid', landmark: 'Gratiot + Mack • Eastside', tagline: 'Own the eastside streets.', mechanic: 'Training Grid', wash: 0x1a8fb8 },
  { name: 'Gratiot Crossways', landmark: 'Gratiot Avenue • Eastern Market', tagline: 'Beat the diagonal rush.', mechanic: 'Crossway Rush', wash: 0xd58c2d },
  { name: 'Jefferson Riverfront', landmark: 'Detroit River • Jefferson', tagline: 'Ride the riverfront lights.', mechanic: 'River Fog', wash: 0x267cd7 },
  { name: 'Warren Run', landmark: 'East Warren • Neighborhood Row', tagline: 'Thread the neighborhood blocks.', mechanic: 'Traffic Pulse', wash: 0xc44c6f },
  { name: 'Westside Grid', landmark: 'Livernois + Grand River • Westside', tagline: 'Own the westside streets.', mechanic: 'Westside Shift', wash: 0xe0b32d },
  { name: 'Livernois Switchback', landmark: 'Livernois • Avenue of Fashion', tagline: 'Cut clean through the westside axis.', mechanic: 'Fashion Lights', wash: 0xe45b33 },
  { name: 'Grand River Loop', landmark: 'Grand River • Northwest Detroit', tagline: 'Ride the long diagonal home.', mechanic: 'River Flow', wash: 0x2aa36b },
  { name: 'Dexter Cut', landmark: 'Dexter + Davison • Russell Woods', tagline: 'Outrun the tight neighborhood cuts.', mechanic: 'Patrol Surge', wash: 0x3dbbc7 },
  { name: 'Joy Road Spiral', landmark: 'Joy Road + Tireman • West Detroit', tagline: 'Keep the winning engine turning.', mechanic: 'Neon Storm', wash: 0xa252da },
  { name: 'Westside Vault', landmark: 'Grand River + Greenfield • Detroit', tagline: 'Open the westside final vault.', mechanic: 'Finale Overdrive', wash: 0xe6c344 }
] as const;

export const GAME_BALANCE = {
  startingLives: 3,
  playerSpeed: 210,
  slowedSpeed: 125,
  luckyRushSpeed: 310,
  hitCooldownMs: 1400,
  worldNames: ['Eastside Grid', 'Gratiot Crossways', 'Jefferson Riverfront', 'Warren Run', 'Westside Grid', 'Livernois Switchback', 'Grand River Loop', 'Dexter Cut', 'Joy Road Spiral', 'Westside Vault'] as const,
  villainWarnings: {
    tax: 'AUDIT — Jackpot income detected!',
    reaper: 'Your number’s time has come. Recover the Soul Ticket!',
    chaos: 'We need to talk! Slot display scrambled.',
    envy: 'Envy wave incoming! They want your shine!',
    police: 'JACKPOT PATROL — Speed trap detected!'
  }
};

// A classic maze-chase rhythm: villains patrol their corners, then switch to
// their individual chase personalities. The final chase lasts until the round
// resets, while Mind Coin frightened time pauses this clock in the runtime.
export const VILLAIN_WAVES = [
  { tactic: 'scatter', durationMs: 7000 },
  { tactic: 'chase', durationMs: 20000 },
  { tactic: 'scatter', durationMs: 7000 },
  { tactic: 'chase', durationMs: 20000 },
  { tactic: 'scatter', durationMs: 5000 },
  { tactic: 'chase', durationMs: 20000 },
  { tactic: 'scatter', durationMs: 5000 },
  { tactic: 'chase', durationMs: Number.POSITIVE_INFINITY }
] as const;

// Medium hearts appear every three walkable tiles. This keeps the route easy
// to read while making collection feel steady instead of empty or cluttered.
export const HEART_GRID_SPACING = 3;
export const HEART_SIZE = 18;

// The first two levels teach the four core personalities. Jackpot Patrol joins
// on level three, after the player has learned movement and Mind Coins.
export function villainCountForLevel(levelIndex: number): number {
  return levelIndex < 2 ? 4 : 5;
}

// Early maps give new players a longer Mind Coin window. Later maps tighten the
// timer gradually, but defeated villains always spend several seconds recovering
// in the house before they can chase again.
export const MIND_COIN_FRIGHTENED_MS = [9500, 9300, 9100, 8900, 8700, 8500, 8300, 8100, 7900, 7700] as const;
export const VILLAIN_RECOVERY_MS = [6800, 6600, 6400, 6200, 6000, 5800, 5700, 5600, 5500, 5400] as const;
export const BOSS_RECOVERY_MS = 5200;
