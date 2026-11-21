// Deterministic screenshot states for The Lantern Thief.
// One clear job: put the game into a fixed, readable pose for each
// screenshot (?shot=...), using only the game's own code and state —
// the screenshots are real renders of the game, never composited.
import { TILE } from './config.js';
import { LEVELS } from './levels.js';

function placePlayer(game, tx, ty, facing) {
  game.player.x = (tx + 0.5) * TILE;
  game.player.y = (ty + 0.5) * TILE;
  game.player.facing = facing;
}

function placeGuard(game, i, tx, ty, angle, state, detection) {
  const guard = game.guards[i];
  guard.x = (tx + 0.5) * TILE;
  guard.y = (ty + 0.5) * TILE;
  guard.angle = angle;
  guard.state = state;
  guard.detection = detection;
}

export function applyShot(shot, game, helpers) {
  if (shot === 'title') {
    game.screen = 'title';
    return;
  }
  if (shot === 'cover') {
    // Level 1 mid-heist: the thief hides in a bush while one guard grows
    // suspicious and the other patrols past a stolen lantern.
    helpers.loadLevel(0);
    game.screen = 'playing';
    game.lanterns[0].taken = true;
    placePlayer(game, 3, 3, 0.6);
    placeGuard(game, 0, 13, 3, Math.PI, 'suspicious', 0.55);
    placeGuard(game, 1, 9, 11, -Math.PI / 2, 'patrol', 0);
    game.score = 0;
    return;
  }
  if (shot === 'level2') {
    // Level 2: the thief crosses the lit rose maze, two cones sweeping.
    helpers.loadLevel(1);
    game.screen = 'playing';
    game.lanterns[0].taken = true;
    game.lanterns[1].taken = true;
    placePlayer(game, 11, 7, -0.4);
    placeGuard(game, 0, 7, 2, Math.PI / 2, 'patrol', 0);
    placeGuard(game, 1, 16, 5, Math.PI, 'suspicious', 0.4);
    placeGuard(game, 2, 7, 11, 0, 'patrol', 0);
    game.score = 1240;
    return;
  }
  if (shot === 'win') {
    // The vault garden cleared: every lantern stolen, the exit open.
    helpers.loadLevel(2);
    game.screen = 'win';
    for (const lantern of game.lanterns) lantern.taken = true;
    game.exitOpen = true;
    placePlayer(game, 19, 13, Math.PI);
    placeGuard(game, 0, 9, 3, Math.PI / 2, 'patrol', 0);
    placeGuard(game, 3, 17, 12, -Math.PI / 2, 'patrol', 0);
    game.score = 4860;
    game.totalTime = 317;
    return;
  }
  // Unknown ?shot=: leave the game on its title screen.
  game.screen = 'title';
}
