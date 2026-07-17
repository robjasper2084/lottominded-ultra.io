import { describe, expect, it } from 'vitest';
import { createMazeDefinition, tileKey, validDirections } from '../game/MazeGrid';
import { createPortalNetwork, portalCountForLevel, portalGateDurationMs, portalPairForWave, tunnelPortalPair } from '../game/PortalNetwork';

describe('randomized portal networks', () => {
  it('keeps a visible side-tunnel portal pair separate from randomized portals', () => {
    const maze = createMazeDefinition(0);
    const sidePair = tunnelPortalPair(maze);
    const network = createPortalNetwork(maze, 0, 313_777);
    const distanceFrom = (portal: { x: number; y: number }, side: { x: number; y: number }) => Math.abs(portal.x - side.x) + Math.abs(portal.y - side.y);

    expect(sidePair).toEqual({ entry: { x: 0, y: maze.tunnelRow }, exit: { x: maze.width - 1, y: maze.tunnelRow } });
    expect(network.portals.every(portal => distanceFrom(portal, sidePair.entry) >= 3 && distanceFrom(portal, sidePair.exit) >= 3)).toBe(true);
  });

  it('creates two or four safe, linked portals for every map', () => {
    const counts = new Set<number>();
    for (let level = 0; level < 10; level += 1) {
      const maze = createMazeDefinition(level);
      const network = createPortalNetwork(maze, level, 313_777);
      counts.add(network.portals.length);
      expect(network.portals).toHaveLength(portalCountForLevel(level));
      expect(new Set(network.portals.map(tileKey)).size).toBe(network.portals.length);

      for (const portal of network.portals) {
        expect(maze.rows[portal.y][portal.x]).toBe('.');
        expect(validDirections(maze, portal).length).toBeGreaterThanOrEqual(2);
        const destination = network.links.get(tileKey(portal));
        expect(destination).toBeDefined();
        expect(network.links.get(tileKey(destination!))).toEqual(portal);
      }
    }
    expect(counts).toEqual(new Set([2, 4]));
  });

  it('stays stable for a run seed and changes for a new run', () => {
    const maze = createMazeDefinition(6);
    const first = createPortalNetwork(maze, 6, 313).portals.map(tileKey);
    expect(createPortalNetwork(maze, 6, 313).portals.map(tileKey)).toEqual(first);
    expect(createPortalNetwork(maze, 6, 777).portals.map(tileKey)).not.toEqual(first);
  });

  it('opens a random portal pair without repeating the previous pair', () => {
    let previous = -1;
    for (let wave = 0; wave < 16; wave += 1) {
      const current = portalPairForWave(2, 313_777, wave, previous);
      expect(current).toBeGreaterThanOrEqual(0);
      expect(current).toBeLessThan(2);
      if (previous >= 0) expect(current).not.toBe(previous);
      previous = current;
    }
    expect(portalPairForWave(1, 313_777, 8, 0)).toBe(0);
    expect(portalPairForWave(0, 313_777, 8, 0)).toBe(-1);
  });

  it('keeps randomized closed and open windows inside playable ranges', () => {
    for (let wave = 0; wave < 20; wave += 1) {
      const closed = portalGateDurationMs(313_777, wave, 'closed');
      const open = portalGateDurationMs(313_777, wave, 'open');
      expect(closed).toBeGreaterThanOrEqual(3_500);
      expect(closed).toBeLessThanOrEqual(6_500);
      expect(open).toBeGreaterThanOrEqual(7_000);
      expect(open).toBeLessThanOrEqual(11_000);
      expect(portalGateDurationMs(313_777, wave, 'closed')).toBe(closed);
      expect(portalGateDurationMs(313_777, wave, 'open')).toBe(open);
    }
  });
});
