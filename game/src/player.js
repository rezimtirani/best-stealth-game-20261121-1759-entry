// Player movement and collision for The Lantern Thief.
// One clear job: turn input into motion, slide along walls, and report
// noise so guards can hear a careless thief.
import { TILE, PLAYER_RADIUS, WALK_SPEED, SNEAK_SPEED, NOISE_WALK_RADIUS, NOISE_SNEAK_RADIUS, STEP_EVERY_SECONDS } from './config.js';
import { isWallTile } from './levels.js';

export function createPlayer(start) {
  return {
    x: (start.x + 0.5) * TILE,
    y: (start.y + 0.5) * TILE,
    facing: 0,
    sneaking: false,
    moving: false,
    noiseRadius: 0,
    stepTimer: 0,
  };
}

function blocked(tiles, x, y) {
  const r = PLAYER_RADIUS;
  const points = [
    [x - r, y - r], [x + r, y - r],
    [x - r, y + r], [x + r, y + r],
    [x, y - r], [x, y + r], [x - r, y], [x + r, y],
  ];
  for (const [px, py] of points) {
    if (isWallTile(tiles, Math.floor(px / TILE), Math.floor(py / TILE))) return true;
  }
  return false;
}

export function updatePlayer(player, move, sneaking, tiles, dt, events) {
  player.sneaking = sneaking;
  player.moving = move !== null;
  if (!move) {
    player.noiseRadius = 0;
    return;
  }
  const speed = sneaking ? SNEAK_SPEED : WALK_SPEED;
  const nx = player.x + move.x * speed * dt;
  const ny = player.y + move.y * speed * dt;
  player.facing = Math.atan2(move.y, move.x);
  // Slide along walls: try the full step, then each axis alone.
  if (!blocked(tiles, nx, ny)) {
    player.x = nx;
    player.y = ny;
  } else if (!blocked(tiles, nx, player.y)) {
    player.x = nx;
  } else if (!blocked(tiles, player.x, ny)) {
    player.y = ny;
  }
  player.noiseRadius = sneaking ? NOISE_SNEAK_RADIUS : NOISE_WALK_RADIUS;
  player.stepTimer -= dt;
  if (player.stepTimer <= 0) {
    player.stepTimer = STEP_EVERY_SECONDS;
    events.push({ type: 'step', sneaking });
  }
}
