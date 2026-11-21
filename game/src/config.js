// Shared constants for The Lantern Thief: a top-down stealth game.
// One clear job: every number the game tunes lives here, so the other
// files read like rules instead of magic numbers.
export const TILE = 40;
export const COLS = 24;
export const ROWS = 15;
export const VIEW_W = COLS * TILE; // 960
export const VIEW_H = ROWS * TILE; // 600

export const PLAYER_RADIUS = 11;
export const WALK_SPEED = 135; // px per second
export const SNEAK_SPEED = 72; // px per second, silent
export const GUARD_SPEED = 58; // patrol
export const GUARD_CHASE_SPEED = 118;
export const GUARD_RADIUS = 12;

export const CONE_LENGTH = 175;
export const CONE_HALF_ANGLE = 0.56; // radians, about 32 degrees
export const DETECT_PER_SECOND_LIT = 1.5; // detection fills this fast in lamplight
export const DETECT_PER_SECOND_SHADOW = 0.75; // and this fast in shadow
export const DETECT_DECAY_PER_SECOND = 0.45;
export const SUSPICIOUS_AT = 0.35; // guard investigates
export const ALARM_AT = 1.0; // guard chases
export const LOSE_SIGHT_SECONDS = 4; // alerted guard gives up after this long
export const NOISE_WALK_RADIUS = 75; // guards hear walking inside this radius
export const NOISE_SNEAK_RADIUS = 0; // sneaking is silent
export const STEP_EVERY_SECONDS = 0.42; // footstep tick while moving

export const ATTEMPTS_PER_LEVEL = 3;
export const SCORE_PER_LEVEL = 1000;
export const SCORE_PER_SECOND = 10;
export const SCORE_ALARM_PENALTY = 150;

export const COLORS = {
  floor: '#2e2a33',
  floorAlt: '#322e38',
  shadowFloor: '#211d2b',
  shadowFloorAlt: '#241f2f',
  wall: '#4d4258',
  wallTop: '#6a5c7d',
  bush: '#1e4d2a',
  bushLeaf: '#2f7a3e',
  lampGlow: 'rgba(255, 190, 90, 0.20)',
  lantern: '#ffd76a',
  exitClosed: '#5a4a6a',
  exitOpen: '#58d68d',
  guardBody: '#c0392b',
  guardBodyAlert: '#ff2e1f',
  playerCloak: '#2c3e50',
  playerHood: '#e8dcc0',
  coneCalm: 'rgba(255, 214, 90, 0.28)',
  coneSuspicious: 'rgba(255, 150, 40, 0.42)',
  coneAlert: 'rgba(255, 46, 31, 0.48)',
  hud: '#f2ead8',
  hudDim: '#b8ab8f',
};
