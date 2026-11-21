// Level definitions for The Lantern Thief.
// One clear job: the three maps, guard patrols and lamp positions.
// Legend: '#' wall, '.' floor, ',' shadow floor, 'B' bush (hides the
// player), 'L' moon-lantern to steal, 'E' exit, 'P' player start.
// Guard patrols are lists of tile coordinates; lamps are lit tiles that
// make detection fill faster. Every map is validated by a script run
// during development (row lengths, border walls, reachability).
export const LEVELS = [
  {
    name: 'Level 1 — Courtyard of House Varra',
    hint: 'Sneak (hold Shift) to move silently. Bushes hide you. Steal all 4 lanterns, then reach the green door.',
    map: [
      '########################',
      '#P.....,,......#.......#',
      '#......,,......#...L...#',
      '#..BB..,,..#####....#..#',
      '#..BB..,,......#....#..#',
      '#......,,..L...#.......#',
      '#..####.....,,,,,,,....#',
      '#......,,..,,,,,,,...E.#',
      '#..L...,,......#.......#',
      '#......,,..#####...#...#',
      '#..BB......,,..#...#...#',
      '#..BB..L...,,..#.......#',
      '#..........,,.....#....#',
      '#......................#',
      '########################',
    ],
    guards: [
      { path: [[10, 2], [17, 2], [17, 5], [10, 5]], pause: 1.2 },
      { path: [[5, 10], [13, 10], [13, 13], [5, 13]], pause: 1.0 },
    ],
    lamps: [[12, 1], [7, 8], [17, 9]],
  },
  {
    name: 'Level 2 — The Rose Maze',
    hint: 'Three guards now, and the maze has no long sightlines. Use the rose bushes and the dark paths between the lamps.',
    map: [
      '########################',
      '#P....#......,,....L...#',
      '#.....#..BB..,,..###...#',
      '#.###...BB...,,....#...#',
      '#.....#......,,.L..#...#',
      '#..L..#.#####,,....#...#',
      '#.....#.....#,,,,,,,...#',
      '#.#####..B..#,,,,,,,.E.#',
      '#.....#..B..#....#.....#',
      '#.L...#.....#.##.#.###.#',
      '#.....#..BB.#....#...L.#',
      '#.###....BB.#..###.....#',
      '#.....#.....#....#.....#',
      '#...........,,,,.......#',
      '########################',
    ],
    guards: [
      { path: [[5, 1], [5, 4], [9, 4], [9, 1]], pause: 1.0 },
      { path: [[14, 3], [18, 3], [18, 6], [14, 6]], pause: 1.2 },
      { path: [[5, 9], [9, 9], [9, 12], [5, 12]], pause: 1.0 },
    ],
    lamps: [[11, 2], [7, 7], [16, 10]],
  },
  {
    name: 'Level 3 — The Vault Garden',
    hint: 'Four guards, six lanterns, one vault door. Patience wins: learn the patrols before you cross the lit lawn.',
    map: [
      '########################',
      '#P..,,....#....BB....L.#',
      '#...,,.L..#....BB..###.#',
      '#.###,,...#.####....#..#',
      '#.....#...#....#..L....#',
      '#.#####.###.######.###.#',
      '#.....#.....#....#.....#',
      '#.L...#.###.#.##.#..B..#',
      '#.....#...#.#....#.BB..#',
      '#.###.#####.#.####.....#',
      '#.....#...L.#....#..L..#',
      '#..B..#.....#.##.#.....#',
      '#..B..#.#####....#.###.#',
      '#.....#......,,.....E..#',
      '########################',
    ],
    guards: [
      { path: [[7, 1], [7, 5], [11, 5], [11, 1]], pause: 0.9 },
      { path: [[16, 3], [19, 3], [19, 6], [16, 6]], pause: 1.0 },
      { path: [[4, 8], [8, 8], [8, 10], [4, 10]], pause: 1.1 },
      { path: [[15, 10], [19, 10], [19, 13], [15, 13]], pause: 0.9 },
    ],
    lamps: [[6, 2], [11, 7], [18, 11]],
  },
];

// Parse one level map into the pieces the game loop needs.
export function parseLevel(def) {
  const tiles = def.map.map((row) => row.split(''));
  const lanterns = [];
  let playerStart = null;
  let exit = null;
  for (let y = 0; y < tiles.length; y += 1) {
    for (let x = 0; x < tiles[y].length; x += 1) {
      const ch = tiles[y][x];
      if (ch === 'P') playerStart = { x, y };
      if (ch === 'L') lanterns.push({ x, y, taken: false });
      if (ch === 'E') exit = { x, y };
    }
  }
  return { tiles, lanterns, playerStart, exit };
}

export function isWallTile(tiles, tx, ty) {
  if (ty < 0 || ty >= tiles.length || tx < 0 || tx >= tiles[0].length) return true;
  return tiles[ty][tx] === '#';
}

export function isBushTile(tiles, tx, ty) {
  if (ty < 0 || ty >= tiles.length || tx < 0 || tx >= tiles[0].length) return false;
  return tiles[ty][tx] === 'B';
}

export function isShadowTile(tiles, tx, ty) {
  if (ty < 0 || ty >= tiles.length || tx < 0 || tx >= tiles[0].length) return false;
  return tiles[ty][tx] === ',';
}

export function isWalkableTile(tiles, tx, ty) {
  return !isWallTile(tiles, tx, ty);
}
