export type GridDirection = 'up' | 'down' | 'left' | 'right' | 'none';
export type CardinalDirection = Exclude<GridDirection, 'none'>;
export interface GridPoint { x: number; y: number }
export interface WallBlock { x: number; y: number; width: number; height: number }

export interface MazeDefinition {
  width: number;
  height: number;
  tunnelRow: number;
  rows: string[];
  playerSpawn: GridPoint;
  player2Spawn: GridPoint;
  house: GridPoint;
  villainSpawns: GridPoint[];
  powerTiles: GridPoint[];
  wallBlocks: WallBlock[];
}

export const OPPOSITE: Record<CardinalDirection, CardinalDirection> = { up: 'down', down: 'up', left: 'right', right: 'left' };
export const DIRECTION_VECTOR: Record<CardinalDirection, GridPoint> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };

const LEVEL_WALLS: ReadonlyArray<ReadonlyArray<[number, number, number, number]>> = [
  [[2,2,3,2],[6,2,3,2],[12,2,3,2],[16,2,3,2],[2,5,3,1],[7,5,1,4],[9,5,3,1],[10,6,1,2],[13,5,1,4],[16,5,3,1],[2,8,4,2],[15,8,4,2],[4,12,2,3],[15,12,2,3],[2,16,3,1],[4,16,1,3],[7,15,2,3],[9,15,1,1],[11,15,1,1],[12,15,2,3],[16,16,1,3],[16,16,3,1],[2,20,4,2],[7,20,2,1],[12,20,2,1],[15,20,4,2],[8,22,5,1]],
  [[2,2,4,2],[8,2,2,3],[11,2,2,3],[15,2,4,2],[3,6,2,3],[7,6,2,1],[12,6,2,1],[16,6,2,3],[1,10,4,2],[16,10,4,2],[3,14,2,3],[16,14,2,3],[6,15,2,3],[13,15,2,3],[2,19,4,1],[8,19,2,2],[11,19,2,2],[15,19,4,1],[4,22,3,1],[14,22,3,1]],
  [[2,2,2,4],[5,2,4,2],[12,2,4,2],[18,2,1,4],[4,7,3,2],[9,5,3,2],[14,7,3,2],[1,10,4,2],[16,10,4,2],[2,14,3,2],[5,16,2,3],[14,16,2,3],[16,14,3,2],[2,20,2,3],[5,21,4,1],[12,21,4,1],[18,20,1,3],[8,23,5,1]],
  [[2,2,5,1],[9,2,3,3],[14,2,5,1],[3,5,2,4],[7,6,2,2],[12,6,2,2],[16,5,2,4],[1,10,5,1],[15,10,5,1],[2,14,4,1],[5,16,2,4],[7,17,2,2],[12,17,2,2],[14,16,2,4],[15,14,4,1],[2,21,5,2],[9,20,3,1],[14,21,5,2]],
  [[2,2,3,3],[7,2,2,4],[12,2,2,4],[16,2,3,3],[1,7,4,1],[14,8,2,2],[16,7,4,1],[2,11,3,2],[16,11,3,2],[3,15,2,4],[6,15,3,1],[12,15,3,1],[16,15,2,4],[2,21,4,1],[7,19,2,3],[12,19,2,3],[15,21,4,1]],
  [[2,2,2,3],[5,3,4,1],[12,3,4,1],[18,2,1,3],[2,6,5,2],[9,5,3,2],[14,6,5,2],[1,10,4,2],[16,10,4,2],[2,14,5,2],[14,14,5,2],[4,17,2,4],[7,18,3,1],[11,18,3,1],[15,17,2,4],[2,22,5,1],[9,20,3,3],[14,22,5,1]],
  [[2,2,4,1],[7,2,2,3],[12,2,2,3],[15,2,4,1],[3,5,2,4],[6,7,3,1],[12,7,3,1],[16,5,2,4],[1,10,5,2],[15,10,5,2],[2,15,4,2],[7,15,2,4],[12,15,2,4],[15,15,4,2],[3,20,2,3],[6,21,3,1],[12,21,3,1],[16,20,2,3],[8,23,5,1]],
  [[2,2,3,2],[6,2,2,4],[9,3,3,1],[13,2,2,4],[16,2,3,2],[2,7,4,2],[8,6,2,2],[11,6,2,2],[15,7,4,2],[1,11,4,1],[16,11,4,1],[3,14,2,4],[6,15,3,2],[12,15,3,2],[16,14,2,4],[2,20,4,2],[7,19,2,4],[12,19,2,4],[15,20,4,2]],
  [[2,2,5,2],[8,2,2,3],[11,2,2,3],[14,2,5,2],[2,6,2,3],[5,6,4,1],[12,6,4,1],[17,6,2,3],[1,10,5,2],[15,10,5,2],[2,14,2,3],[5,16,4,1],[12,16,4,1],[17,14,2,3],[3,19,4,2],[7,20,2,3],[12,20,2,3],[14,19,4,2],[7,23,7,1]],
  [[2,2,2,4],[5,2,5,1],[11,2,5,1],[18,2,1,4],[3,7,4,2],[8,5,2,3],[11,5,2,3],[14,7,4,2],[1,10,5,2],[15,10,5,2],[2,15,5,2],[7,15,2,4],[12,15,2,4],[14,15,5,2],[3,20,2,3],[6,21,4,1],[11,21,4,1],[16,20,2,3],[7,23,7,1]]
];

export const MAZE_LEVEL_COUNT = LEVEL_WALLS.length;

export function createMazeDefinition(level = 0): MazeDefinition {
  const width = 21; const height = 25; const tunnelRow = 12;
  const grid: string[][] = Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => (x === 0 || y === 0 || x === width - 1 || y === height - 1 ? '#' : '.')));
  const wallBlocks: WallBlock[] = [];
  const wall = (x: number, y: number, w: number, h: number) => {
    wallBlocks.push({ x, y, width: w, height: h });
    for (let row = y; row < y + h; row += 1) for (let column = x; column < x + w; column += 1) grid[row][column] = '#';
  };

  LEVEL_WALLS[((level % MAZE_LEVEL_COUNT) + MAZE_LEVEL_COUNT) % MAZE_LEVEL_COUNT].forEach(([x, y, w, h]) => wall(x, y, w, h));

  for (let x = 7; x <= 13; x += 1) { if (x !== 10) grid[9][x] = '#'; grid[13][x] = '#'; }
  for (let y = 10; y <= 12; y += 1) { grid[y][7] = '#'; grid[y][13] = '#'; }
  for (let y = 10; y <= 12; y += 1) for (let x = 8; x <= 12; x += 1) grid[y][x] = ' ';
  grid[9][10] = '.';
  grid[tunnelRow][0] = '.'; grid[tunnelRow][width - 1] = '.';

  const playerSpawn = { x: 10, y: 19 };
  const player2Spawn = [{ x: 11, y: 19 }, { x: 9, y: 19 }, { x: 10, y: 20 }, { x: 10, y: 18 }]
    .find(point => grid[point.y]?.[point.x] !== '#') ?? { x: 10, y: 19 };
  const powerTiles = [{ x: 1, y: 1 }, { x: width - 2, y: 1 }, { x: 1, y: height - 2 }, { x: width - 2, y: height - 2 }];
  grid[playerSpawn.y][playerSpawn.x] = ' ';
  grid[player2Spawn.y][player2Spawn.x] = ' ';
  for (const tile of powerTiles) grid[tile.y][tile.x] = 'o';

  return {
    width, height, tunnelRow, rows: grid.map(row => row.join('')), playerSpawn, player2Spawn, house: { x: 10, y: 11 }, powerTiles, wallBlocks,
    villainSpawns: [{ x: 10, y: 8 }, { x: 9, y: 11 }, { x: 11, y: 11 }, { x: 9, y: 12 }, { x: 11, y: 12 }]
  };
}

export function tileKey(point: GridPoint): string { return `${point.x},${point.y}`; }
export function sameTile(a: GridPoint, b: GridPoint): boolean { return a.x === b.x && a.y === b.y; }
export function isWalkable(maze: MazeDefinition, point: GridPoint): boolean {
  if (point.y === maze.tunnelRow && (point.x < 0 || point.x >= maze.width)) return true;
  return point.x >= 0 && point.y >= 0 && point.x < maze.width && point.y < maze.height && maze.rows[point.y][point.x] !== '#';
}

export function stepTile(maze: MazeDefinition, point: GridPoint, direction: CardinalDirection): GridPoint | null {
  const vector = DIRECTION_VECTOR[direction]; let next = { x: point.x + vector.x, y: point.y + vector.y };
  if (next.y === maze.tunnelRow && next.x < 0) next = { x: maze.width - 1, y: next.y };
  if (next.y === maze.tunnelRow && next.x >= maze.width) next = { x: 0, y: next.y };
  return isWalkable(maze, next) ? next : null;
}

export function validDirections(maze: MazeDefinition, point: GridPoint): CardinalDirection[] {
  return (Object.keys(DIRECTION_VECTOR) as CardinalDirection[]).filter(direction => stepTile(maze, point, direction));
}

export function chooseForgivingDirection(
  maze: MazeDefinition,
  point: GridPoint,
  queued: GridDirection,
  current: GridDirection
): CardinalDirection | null {
  if (queued !== 'none' && stepTile(maze, point, queued)) return queued;
  if (current !== 'none' && stepTile(maze, point, current)) return current;
  if (queued === 'none' && current === 'none') return null;

  const slideOrder: CardinalDirection[] = queued === 'left' || queued === 'right'
    ? ['up', 'down']
    : queued === 'up' || queued === 'down'
      ? ['left', 'right']
      : ['up', 'left', 'right', 'down'];
  return slideOrder.find(direction => stepTile(maze, point, direction)) ?? validDirections(maze, point)[0] ?? null;
}

/**
 * Classic maze games let a player turn a little after crossing an intersection.
 * This keeps fast characters from feeling stuck on a corner while preserving the
 * tile grid as the source of truth.
 */
export function shouldSnapLateTurn(
  maze: MazeDefinition,
  point: GridPoint,
  queued: CardinalDirection,
  current: GridDirection,
  progress: number,
  window = 0.34
): boolean {
  if (current === 'none' || queued === current || queued === OPPOSITE[current]) return false;
  if (progress <= 0 || progress > window) return false;
  const currentIsHorizontal = current === 'left' || current === 'right';
  const queuedIsHorizontal = queued === 'left' || queued === 'right';
  return currentIsHorizontal !== queuedIsHorizontal && Boolean(stepTile(maze, point, queued));
}

export function projectTile(maze: MazeDefinition, point: GridPoint, direction: GridDirection, distance: number): GridPoint {
  let current = { ...point };
  if (direction === 'none') return current;
  for (let index = 0; index < distance; index += 1) { const next = stepTile(maze, current, direction); if (!next) break; current = next; }
  return current;
}

export function shortestDirection(maze: MazeDefinition, start: GridPoint, target: GridPoint, current: GridDirection): CardinalDirection {
  let starts = validDirections(maze, start);
  if (current !== 'none' && starts.length > 1) starts = starts.filter(direction => direction !== OPPOSITE[current]);
  const queue: Array<{ point: GridPoint; first: CardinalDirection }> = [];
  const visited = new Set<string>([tileKey(start)]);
  for (const direction of starts) { const point = stepTile(maze, start, direction); if (point) { queue.push({ point, first: direction }); visited.add(tileKey(point)); } }
  while (queue.length) {
    const entry = queue.shift()!;
    if (sameTile(entry.point, target)) return entry.first;
    for (const direction of validDirections(maze, entry.point)) {
      const point = stepTile(maze, entry.point, direction); const key = point && tileKey(point);
      if (point && key && !visited.has(key)) { visited.add(key); queue.push({ point, first: entry.first }); }
    }
  }
  return starts[0] ?? 'left';
}

export function validateMaze(maze: MazeDefinition): string[] {
  const errors: string[] = [];
  if (maze.rows.some(row => row.length !== maze.width)) errors.push('row width mismatch');
  const queue = [{ ...maze.playerSpawn }]; const visited = new Set<string>([tileKey(maze.playerSpawn)]);
  while (queue.length) {
    const current = queue.shift()!;
    for (const direction of validDirections(maze, current)) {
      const point = stepTile(maze, current, direction);
      if (point && !visited.has(tileKey(point))) { visited.add(tileKey(point)); queue.push(point); }
    }
  }
  const walkable: GridPoint[] = [];
  for (let y = 0; y < maze.height; y += 1) for (let x = 0; x < maze.width; x += 1) if (isWalkable(maze, { x, y })) walkable.push({ x, y });
  const unreachable = walkable.filter(point => !visited.has(tileKey(point)));
  if (unreachable.length) errors.push(`maze has unreachable floor tiles (${unreachable.slice(0, 6).map(tileKey).join(' ')})`);
  return errors;
}
