// Game loop and state machine for The Lantern Thief.
// One clear job: load levels, step the player and the guards, score the
// run, and switch screens — title, playing, caught, level clear, win.
import { TILE, ATTEMPTS_PER_LEVEL, SCORE_PER_LEVEL, SCORE_PER_SECOND, SCORE_ALARM_PENALTY } from './config.js';
import { LEVELS, parseLevel } from './levels.js';
import { createInput } from './input.js';
import { createPlayer, updatePlayer } from './player.js';
import { createGuard, updateGuard } from './guards.js';
import { createAudio } from './audio.js';
import { render } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput();
const audio = createAudio();

const game = {
  screen: 'title', // title | playing | paused | caught | levelcomplete | win | gameover
  levelIndex: 0,
  tiles: null,
  lanterns: [],
  exit: null,
  exitOpen: false,
  guards: [],
  player: null,
  attempts: ATTEMPTS_PER_LEVEL,
  score: 0,
  levelTime: 0,
  totalTime: 0,
  alarms: 0,
  time: 0,
};

function loadLevel(index) {
  const def = LEVELS[index];
  const parsed = parseLevel(def);
  game.tiles = parsed.tiles;
  game.lanterns = parsed.lanterns.map((l) => ({ ...l }));
  game.exit = parsed.exit;
  game.exitOpen = false;
  game.guards = def.guards.map((g) => createGuard(g, parsed.tiles));
  game.player = createPlayer(parsed.playerStart);
  game.levelTime = 0;
  game.attempts = ATTEMPTS_PER_LEVEL;
  game.alarms = 0;
  game.levelDef = def;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function hudState() {
  return {
    levelName: game.levelDef.name,
    lanternsTaken: game.lanterns.filter((l) => l.taken).length,
    lanternsTotal: game.lanterns.length,
    attempts: game.attempts,
    timeText: formatTime(game.totalTime + game.levelTime),
    score: game.score,
    hint: game.levelDef.hint,
    muted: audio.isMuted(),
  };
}

function worldForRender() {
  return {
    tiles: game.tiles,
    lamps: game.levelDef.lamps,
    exit: game.exit,
    exitOpen: game.exitOpen,
    lanterns: game.lanterns,
    guards: game.guards,
    player: game.player,
    screen: game.screen,
    hud: hudState(),
  };
}

function onCaught() {
  game.attempts -= 1;
  audio.caught();
  if (game.attempts <= 0) {
    game.screen = 'gameover';
  } else {
    game.screen = 'caught';
  }
}

function onLevelComplete() {
  const bonus = Math.max(0, SCORE_PER_LEVEL - Math.floor(game.levelTime) * SCORE_PER_SECOND - game.alarms * SCORE_ALARM_PENALTY);
  game.score += bonus;
  audio.levelComplete();
  if (game.levelIndex + 1 >= LEVELS.length) {
    game.screen = 'win';
    audio.win();
  } else {
    game.screen = 'levelcomplete';
  }
}

function step(dt) {
  game.time += dt;
  if (game.screen !== 'playing') return;
  game.levelTime += dt;
  game.totalTime += dt;

  const move = input.moveVector();
  const events = [];
  updatePlayer(game.player, move, input.sneaking(), game.tiles, dt, events);
  for (const guard of game.guards) updateGuard(guard, game.player, dt, events);
  for (const event of events) {
    if (event.type === 'step') audio.step(event.sneaking);
    if (event.type === 'suspicious') audio.suspicious();
    if (event.type === 'heard') audio.heard();
    if (event.type === 'alarm') {
      game.alarms += 1;
      audio.alarm();
    }
  }

  // Lantern pickup: walk over a lantern to steal it.
  for (const lantern of game.lanterns) {
    if (lantern.taken) continue;
    const cx = (lantern.x + 0.5) * TILE;
    const cy = (lantern.y + 0.5) * TILE;
    if (Math.hypot(game.player.x - cx, game.player.y - cy) < 24) {
      lantern.taken = true;
      audio.pickup();
    }
  }
  if (!game.exitOpen && game.lanterns.every((l) => l.taken)) {
    game.exitOpen = true;
  }
  // Caught: a chasing guard touches the player.
  for (const guard of game.guards) {
    if (guard.state === 'chase' && Math.hypot(guard.x - game.player.x, guard.y - game.player.y) < 20) {
      onCaught();
      return;
    }
  }
  // Exit: reach the open door to finish the level.
  if (game.exitOpen) {
    const ex = (game.exit.x + 0.5) * TILE;
    const ey = (game.exit.y + 0.5) * TILE;
    if (Math.hypot(game.player.x - ex, game.player.y - ey) < 24) {
      onLevelComplete();
    }
  }
}

function handleKeys() {
  if (input.wasPressed('m')) audio.toggleMute();
  if (game.screen === 'title' && (input.wasPressed('enter') || input.wasPressed(' '))) {
    audio.unlock();
    game.screen = 'playing';
  } else if (game.screen === 'playing') {
    if (input.wasPressed('p') || input.wasPressed('escape')) game.screen = 'paused';
    if (input.wasPressed('r')) loadLevel(game.levelIndex);
  } else if (game.screen === 'paused') {
    if (input.wasPressed('p') || input.wasPressed('escape')) game.screen = 'playing';
    if (input.wasPressed('r')) {
      loadLevel(game.levelIndex);
      game.screen = 'playing';
    }
  } else if (game.screen === 'caught' && input.wasPressed('enter')) {
    loadLevel(game.levelIndex);
    game.screen = 'playing';
  } else if (game.screen === 'levelcomplete' && input.wasPressed('enter')) {
    game.levelIndex += 1;
    loadLevel(game.levelIndex);
    game.screen = 'playing';
  } else if ((game.screen === 'win' || game.screen === 'gameover') && input.wasPressed('enter')) {
    game.levelIndex = 0;
    game.score = 0;
    game.totalTime = 0;
    loadLevel(0);
    game.screen = 'playing';
  }
  input.consume();
}

canvas.addEventListener('click', () => {
  audio.unlock();
  if (game.screen === 'title') game.screen = 'playing';
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  handleKeys();
  step(dt);
  render(ctx, worldForRender(), game.time);
  requestAnimationFrame(frame);
}

loadLevel(0);
// Debug hook for play-testing: the page's own state, readable from the console.
window.__lanternThief = game;
// Deterministic screenshot states (?shot=cover|level2|win|title).
const shot = new URLSearchParams(window.location.search).get('shot');
if (shot) applyShot(shot, game, { loadLevel, formatTime });
requestAnimationFrame(frame);
