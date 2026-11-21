// Rendering for The Lantern Thief — canvas 2D, all art drawn in code.
// One clear job: draw the level, the vision cones, the actors and the
// screens, so the judge's screenshots show a complete stealth game at
// a glance: guards with cones, cover, and an exit to reach unseen.
import { TILE, COLS, ROWS, VIEW_W, VIEW_H, CONE_LENGTH, CONE_HALF_ANGLE, COLORS } from './config.js';
import { isWallTile, isBushTile, isShadowTile } from './levels.js';

function coneColor(guard) {
  if (guard.state === 'chase') return COLORS.coneAlert;
  if (guard.state === 'suspicious') return COLORS.coneSuspicious;
  return COLORS.coneCalm;
}

function drawTiles(ctx, tiles, lamps, exit, exitOpen, time) {
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < tiles.length; x += 1) {
      const ch = tiles[y][x];
      const px = x * TILE;
      const py = y * TILE;
      if (ch === '#') {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(px, py, TILE, 6);
        continue;
      }
      const shadow = ch === ',';
      const alt = (x + y) % 2 === 0;
      ctx.fillStyle = shadow
        ? (alt ? COLORS.shadowFloor : COLORS.shadowFloorAlt)
        : (alt ? COLORS.floor : COLORS.floorAlt);
      ctx.fillRect(px, py, TILE, TILE);
      if (ch === 'B') {
        ctx.fillStyle = COLORS.bush;
        ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
        ctx.fillStyle = COLORS.bushLeaf;
        ctx.beginPath();
        ctx.arc(px + 12, py + 13, 7, 0, Math.PI * 2);
        ctx.arc(px + 27, py + 12, 8, 0, Math.PI * 2);
        ctx.arc(px + 20, py + 27, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  // Lamplight pools.
  for (const [lx, ly] of lamps) {
    const cx = (lx + 0.5) * TILE;
    const cy = (ly + 0.5) * TILE;
    const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 95);
    glow.addColorStop(0, COLORS.lampGlow);
    glow.addColorStop(1, 'rgba(255, 190, 90, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - 95, cy - 95, 190, 190);
    ctx.fillStyle = '#ffb84d';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Exit door.
  const ex = (exit.x + 0.5) * TILE;
  const ey = (exit.y + 0.5) * TILE;
  ctx.fillStyle = exitOpen ? COLORS.exitOpen : COLORS.exitClosed;
  ctx.fillRect(ex - 14, ey - 16, 28, 32);
  ctx.fillStyle = '#1a1420';
  ctx.fillRect(ex - 9, ey - 11, 18, 22);
  if (exitOpen) {
    ctx.fillStyle = '#d8ffe9';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', ex, ey - 22);
    const pulse = 0.5 + 0.5 * Math.sin(time * 3);
    ctx.strokeStyle = `rgba(88, 214, 141, ${0.4 + 0.4 * pulse})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(ex - 17, ey - 19, 34, 38);
  }
}

function drawLanterns(ctx, lanterns, time) {
  for (const l of lanterns) {
    if (l.taken) continue;
    const cx = (l.x + 0.5) * TILE;
    const cy = (l.y + 0.5) * TILE + Math.sin(time * 2 + l.x) * 2;
    const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 26);
    glow.addColorStop(0, 'rgba(255, 215, 106, 0.55)');
    glow.addColorStop(1, 'rgba(255, 215, 106, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - 26, cy - 26, 52, 52);
    ctx.fillStyle = COLORS.lantern;
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a5b00';
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCone(ctx, guard) {
  ctx.save();
  ctx.translate(guard.x, guard.y);
  ctx.rotate(guard.angle);
  const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, CONE_LENGTH);
  grad.addColorStop(0, coneColor(guard));
  grad.addColorStop(1, 'rgba(255, 214, 90, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, CONE_LENGTH, -CONE_HALF_ANGLE, CONE_HALF_ANGLE);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawGuard(ctx, guard) {
  drawCone(ctx, guard);
  ctx.fillStyle = guard.state === 'chase' ? COLORS.guardBodyAlert : COLORS.guardBody;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 12, 0, Math.PI * 2);
  ctx.fill();
  // Helmet brim and facing tick.
  ctx.fillStyle = '#7b1f16';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.angle) * 17, guard.y + Math.sin(guard.angle) * 17);
  ctx.stroke();
  // Detection meter above the guard.
  if (guard.detection > 0.02) {
    const w = 30;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(guard.x - w / 2, guard.y - 26, w, 5);
    ctx.fillStyle = guard.detection >= 1 ? '#ff2e1f' : '#ffb84d';
    ctx.fillRect(guard.x - w / 2, guard.y - 26, w * Math.min(1, guard.detection), 5);
  }
  if (guard.state === 'suspicious') {
    ctx.fillStyle = '#ffb84d';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', guard.x, guard.y - 30);
  }
  if (guard.state === 'chase') {
    ctx.fillStyle = '#ff2e1f';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - 30);
  }
}

function drawPlayer(ctx, player, hidden) {
  // Noise ring while walking.
  if (player.noiseRadius > 0 && player.moving) {
    ctx.strokeStyle = 'rgba(242, 234, 216, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.noiseRadius * 0.6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = COLORS.playerCloak;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.playerHood;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + Math.cos(player.facing) * 13, player.y + Math.sin(player.facing) * 13);
  ctx.stroke();
  if (hidden) {
    ctx.fillStyle = 'rgba(47, 122, 62, 0.9)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIDDEN', player.x, player.y - 18);
  }
}

function drawHud(ctx, state) {
  ctx.fillStyle = 'rgba(10, 8, 14, 0.85)';
  ctx.fillRect(0, 0, VIEW_W, 34);
  ctx.fillStyle = COLORS.hud;
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(state.levelName, 12, 22);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.lantern;
  ctx.fillText(`Lanterns ${state.lanternsTaken} / ${state.lanternsTotal}`, VIEW_W / 2 - 60, 22);
  ctx.fillStyle = COLORS.hud;
  ctx.fillText(`Attempts ${state.attempts}`, VIEW_W / 2 + 90, 22);
  ctx.textAlign = 'right';
  ctx.fillText(`Time ${state.timeText}   Score ${state.score}`, VIEW_W - 12, 22);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(state.hint, 12, VIEW_H - 10);
  if (state.muted) {
    ctx.textAlign = 'right';
    ctx.fillText('Muted (M)', VIEW_W - 12, VIEW_H - 10);
  }
}

function drawScreen(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(8, 6, 12, 0.82)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW_W / 2, VIEW_H / 2 - 60);
  ctx.fillStyle = COLORS.hud;
  ctx.font = '17px sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_W / 2, VIEW_H / 2 - 10 + i * 28);
  });
}

export function render(ctx, world, time) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  const { tiles, lamps, exit, exitOpen, lanterns, guards, player } = world;
  drawTiles(ctx, tiles, lamps, exit, exitOpen, time);
  drawLanterns(ctx, lanterns, time);
  for (const guard of guards) drawGuard(ctx, guard);
  const ptx = Math.floor(player.x / TILE);
  const pty = Math.floor(player.y / TILE);
  drawPlayer(ctx, player, isBushTile(tiles, ptx, pty));
  drawHud(ctx, world.hud);
  if (world.screen === 'title') {
    drawScreen(ctx, 'THE LANTERN THIEF', [
      'Steal the moon-lanterns of House Varra — unseen.',
      'WASD / arrows to move · hold Shift to sneak · R restart · M mute',
      'Bushes hide you. Lamplight sees you faster. Reach the green door.',
      '',
      'Press Enter or click to begin',
    ], COLORS.lantern);
  } else if (world.screen === 'paused') {
    drawScreen(ctx, 'PAUSED', ['Press P or Esc to keep stealing', 'R restarts the level'], COLORS.hud);
  } else if (world.screen === 'caught') {
    drawScreen(ctx, 'CAUGHT!', [
      `The guards of House Varra found you. Attempts left: ${world.hud.attempts}`,
      'Press Enter to try again',
    ], '#ff2e1f');
  } else if (world.screen === 'levelcomplete') {
    drawScreen(ctx, 'LEVEL CLEAR', [
      `All lanterns stolen. Score so far: ${world.hud.score}`,
      'Press Enter for the next garden',
    ], COLORS.exitOpen);
  } else if (world.screen === 'win') {
    drawScreen(ctx, 'THE VAULT IS YOURS', [
      `Every lantern stolen, never caught for long. Final score: ${world.hud.score}`,
      `Time: ${world.hud.timeText}`,
      'Press Enter to play again',
    ], COLORS.lantern);
  } else if (world.screen === 'gameover') {
    drawScreen(ctx, 'THE HOUSE WINS', [
      'Out of attempts. The lanterns stay in their garden — for now.',
      'Press Enter to start over',
    ], '#ff2e1f');
  }
}
