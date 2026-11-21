// Guard behaviour for The Lantern Thief.
// One clear job: patrol, see, suspect, chase, and give up — the whole
// detection system lives here, driven by vision cones and line of sight.
import {
  TILE,
  GUARD_SPEED,
  GUARD_CHASE_SPEED,
  CONE_LENGTH,
  CONE_HALF_ANGLE,
  DETECT_PER_SECOND_LIT,
  DETECT_PER_SECOND_SHADOW,
  DETECT_DECAY_PER_SECOND,
  SUSPICIOUS_AT,
  ALARM_AT,
  LOSE_SIGHT_SECONDS,
  NOISE_WALK_RADIUS,
} from './config.js';
import { isWallTile, isBushTile, isShadowTile } from './levels.js';

export function createGuard(def, tiles) {
  const start = def.path[0];
  return {
    x: (start[0] + 0.5) * TILE,
    y: (start[1] + 0.5) * TILE,
    angle: 0,
    path: def.path,
    waypoint: 1 % def.path.length,
    pauseLeft: 0,
    pause: def.pause,
    state: 'patrol', // patrol | suspicious | chase | return
    detection: 0,
    lastSeen: null,
    loseSight: 0,
    tiles,
  };
}

export function tileCenter(tx, ty) {
  return { x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE };
}

// True when no wall blocks the straight line between two points.
export function hasLineOfSight(tiles, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / (TILE / 4)));
  for (let i = 1; i < steps; i += 1) {
    const tx = Math.floor((x0 + (dx * i) / steps) / TILE);
    const ty = Math.floor((y0 + (dy * i) / steps) / TILE);
    if (isWallTile(tiles, tx, ty)) return false;
  }
  return true;
}

export function canGuardSee(guard, player) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CONE_LENGTH) return false;
  let diff = Math.atan2(dy, dx) - guard.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > CONE_HALF_ANGLE) return false;
  if (!hasLineOfSight(guard.tiles, guard.x, guard.y, player.x, player.y)) return false;
  // A player crouched in a bush cannot be seen at all.
  const ptx = Math.floor(player.x / TILE);
  const pty = Math.floor(player.y / TILE);
  if (isBushTile(guard.tiles, ptx, pty)) return false;
  return true;
}

function moveToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  guard.angle = Math.atan2(dy, dx);
  return dist - step < 2;
}

export function updateGuard(guard, player, dt, events) {
  const sees = canGuardSee(guard, player);
  const ptx = Math.floor(player.x / TILE);
  const pty = Math.floor(player.y / TILE);
  const inShadow = isShadowTile(guard.tiles, ptx, pty);

  if (sees) {
    const rate = inShadow ? DETECT_PER_SECOND_SHADOW : DETECT_PER_SECOND_LIT;
    const before = guard.detection;
    guard.detection = Math.min(ALARM_AT, guard.detection + rate * dt);
    guard.lastSeen = { x: player.x, y: player.y };
    guard.loseSight = 0;
    if (before < SUSPICIOUS_AT && guard.detection >= SUSPICIOUS_AT) {
      guard.state = 'suspicious';
      events.push({ type: 'suspicious', guard });
    }
    if (guard.detection >= ALARM_AT && guard.state !== 'chase') {
      guard.state = 'chase';
      events.push({ type: 'alarm', guard });
    }
  } else {
    guard.detection = Math.max(0, guard.detection - DETECT_DECAY_PER_SECOND * dt);
    if (guard.state === 'chase') {
      guard.loseSight += dt;
      if (guard.loseSight >= LOSE_SIGHT_SECONDS) {
        guard.state = 'return';
        guard.detection = 0;
      }
    } else if (guard.state === 'suspicious' && guard.detection < SUSPICIOUS_AT) {
      guard.state = 'return';
    }
  }

  // Hearing: a walking (not sneaking) player nearby draws a patrol guard.
  if (guard.state === 'patrol' && player.noiseRadius > 0) {
    const dist = Math.hypot(player.x - guard.x, player.y - guard.y);
    if (dist < Math.max(player.noiseRadius, NOISE_WALK_RADIUS * 0.6)) {
      guard.state = 'suspicious';
      guard.lastSeen = { x: player.x, y: player.y };
      events.push({ type: 'heard', guard });
    }
  }

  if (guard.state === 'patrol') {
    const target = tileCenter(guard.path[guard.waypoint][0], guard.path[guard.waypoint][1]);
    if (guard.pauseLeft > 0) {
      guard.pauseLeft -= dt;
    } else if (moveToward(guard, target.x, target.y, GUARD_SPEED, dt)) {
      guard.waypoint = (guard.waypoint + 1) % guard.path.length;
      guard.pauseLeft = guard.pause;
    }
  } else if (guard.state === 'suspicious') {
    if (guard.lastSeen) {
      if (moveToward(guard, guard.lastSeen.x, guard.lastSeen.y, GUARD_SPEED * 1.25, dt)) {
        guard.state = 'return';
      }
    } else {
      guard.state = 'return';
    }
  } else if (guard.state === 'chase') {
    moveToward(guard, player.x, player.y, GUARD_CHASE_SPEED, dt);
  } else if (guard.state === 'return') {
    const home = tileCenter(guard.path[0][0], guard.path[0][1]);
    if (moveToward(guard, home.x, home.y, GUARD_SPEED * 1.4, dt)) {
      guard.state = 'patrol';
      guard.waypoint = 1 % guard.path.length;
    }
  }
}
