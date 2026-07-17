import { tileKey, validDirections, type GridPoint, type MazeDefinition } from './MazeGrid';

export interface PortalPair {
  entry: GridPoint;
  exit: GridPoint;
}

export interface PortalNetwork {
  portals: GridPoint[];
  pairs: PortalPair[];
  links: Map<string, GridPoint>;
}

export const PORTAL_COUNTS_BY_LEVEL = [2, 2, 4, 2, 4, 2, 4, 4, 2, 4] as const;

export function tunnelPortalPair(maze: MazeDefinition): PortalPair {
  return {
    entry: { x: 0, y: maze.tunnelRow },
    exit: { x: maze.width - 1, y: maze.tunnelRow }
  };
}

export function portalCountForLevel(level: number): 2 | 4 {
  const index = ((Math.trunc(level) % PORTAL_COUNTS_BY_LEVEL.length) + PORTAL_COUNTS_BY_LEVEL.length) % PORTAL_COUNTS_BY_LEVEL.length;
  return PORTAL_COUNTS_BY_LEVEL[index];
}

function waveRandom(seed: number, wave: number, salt: number): number {
  return createRandom((seed ^ Math.imul(wave + 1, 0x9e3779b9) ^ salt) >>> 0)();
}

export function portalPairForWave(pairCount: number, seed: number, wave: number, previousPair = -1): number {
  if (pairCount <= 0) return -1;
  if (pairCount === 1) return 0;
  if (previousPair < 0) return Math.floor(waveRandom(seed, wave, 0x3130aa55) * pairCount);
  const offset = 1 + Math.floor(waveRandom(seed, wave, 0x77c0ffee) * (pairCount - 1));
  return (previousPair + offset) % pairCount;
}

export function portalGateDurationMs(seed: number, wave: number, phase: 'closed' | 'open'): number {
  const minimum = phase === 'open' ? 7_000 : 3_500;
  const range = phase === 'open' ? 4_001 : 3_001;
  return minimum + Math.floor(waveRandom(seed, wave, phase === 'open' ? 0x0f3a911 : 0x0c105ed) * range);
}

function distance(a: GridPoint, b: GridPoint): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function createRandom(seed: number): () => number {
  let state = (seed >>> 0) || 0x313313;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x1_0000_0000;
  };
}

function shuffled<T>(items: T[], seed: number): T[] {
  const random = createRandom(seed);
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

export function createPortalNetwork(maze: MazeDefinition, level: number, seed: number): PortalNetwork {
  const desiredCount = portalCountForLevel(level);
  const tunnelPair = tunnelPortalPair(maze);
  const protectedTiles = [maze.playerSpawn, maze.player2Spawn, maze.house, ...maze.villainSpawns, ...maze.powerTiles, tunnelPair.entry, tunnelPair.exit];
  const candidates: GridPoint[] = [];

  for (let y = 1; y < maze.height - 1; y += 1) {
    for (let x = 1; x < maze.width - 1; x += 1) {
      const point = { x, y };
      if (maze.rows[y][x] !== '.' || validDirections(maze, point).length < 2) continue;
      if (protectedTiles.some(tile => distance(point, tile) < 3)) continue;
      candidates.push(point);
    }
  }

  const pool = shuffled(candidates, seed ^ ((level + 1) * 0x9e3779b9));
  const selected: GridPoint[] = [];
  if (pool.length) selected.push(pool.shift()!);

  while (selected.length < desiredCount && pool.length) {
    let bestIndex = 0;
    let bestDistance = -1;
    pool.forEach((candidate, index) => {
      const nearest = Math.min(...selected.map(portal => distance(candidate, portal)));
      if (nearest > bestDistance) { bestDistance = nearest; bestIndex = index; }
    });
    selected.push(pool.splice(bestIndex, 1)[0]);
  }

  const unpaired = [...selected];
  const pairs: PortalPair[] = [];
  while (unpaired.length >= 2) {
    const entry = unpaired.shift()!;
    let exitIndex = 0;
    let exitDistance = -1;
    unpaired.forEach((candidate, index) => {
      const candidateDistance = distance(entry, candidate);
      if (candidateDistance > exitDistance) { exitDistance = candidateDistance; exitIndex = index; }
    });
    pairs.push({ entry, exit: unpaired.splice(exitIndex, 1)[0] });
  }

  const links = new Map<string, GridPoint>();
  pairs.forEach(({ entry, exit }) => {
    links.set(tileKey(entry), { ...exit });
    links.set(tileKey(exit), { ...entry });
  });

  return { portals: pairs.flatMap(pair => [{ ...pair.entry }, { ...pair.exit }]), pairs, links };
}
