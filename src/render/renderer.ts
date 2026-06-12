import { CLASSES } from '../data/classes';
import { FOG_START } from '../data/waves';
import { WORLD_H, WORLD_W, type GameState } from '../state';
import { drawCreature, getEnemySprite } from './shapes';

export function renderWorld(state: GameState, ctx: CanvasRenderingContext2D): void {
  const cam = state.camera;
  const w = cam.viewW;
  const h = cam.viewH;

  // 背景
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(0, 0, w, h);

  // グリッド（見えている範囲だけ）
  const grid = 100;
  ctx.strokeStyle = 'rgba(60, 70, 120, 0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  const x0 = Math.floor(cam.toWorldX(0) / grid) * grid;
  const y0 = Math.floor(cam.toWorldY(0) / grid) * grid;
  for (let gx = x0; gx <= cam.toWorldX(w); gx += grid) {
    ctx.moveTo(cam.toScreenX(gx), 0);
    ctx.lineTo(cam.toScreenX(gx), h);
  }
  for (let gy = y0; gy <= cam.toWorldY(h); gy += grid) {
    ctx.moveTo(0, cam.toScreenY(gy));
    ctx.lineTo(w, cam.toScreenY(gy));
  }
  ctx.stroke();

  // ワールド境界
  ctx.strokeStyle = 'rgba(125, 249, 255, 0.5)';
  ctx.lineWidth = 4;
  ctx.strokeRect(cam.toScreenX(0), cam.toScreenY(0), WORLD_W, WORLD_H);

  drawZonesAndMines(state, ctx);
  drawGems(state, ctx);
  drawPickups(state, ctx);
  drawEnemies(state, ctx);
  drawMinions(state, ctx);
  drawBot(state, ctx);
  drawPlayer(state, ctx);
  drawBullets(state, ctx);
  drawParticles(state, ctx);
  drawDamageNumbers(state, ctx);
  drawFog(state, ctx);

  // 被弾フラッシュ（赤ビネット）
  if (state.player.hurtFlash > 0) {
    ctx.fillStyle = `rgba(255, 60, 80, ${state.player.hurtFlash * 0.9})`;
    ctx.fillRect(0, 0, w, h);
  }
}

function drawZonesAndMines(state: GameState, ctx: CanvasRenderingContext2D): void {
  const cam = state.camera;
  for (const b of state.bullets) {
    if (!b.alive) continue;
    if (b.kind === 'zone') {
      if (!cam.isVisible(b.pos.x, b.pos.y, b.radius)) continue;
      const x = cam.toScreenX(b.pos.x);
      const y = cam.toScreenY(b.pos.y);
      const isMiasma = b.weaponId === 'miasma';
      const pulse = 1 + Math.sin(state.time * 5 + b.angle) * 0.06;
      ctx.fillStyle = isMiasma ? 'rgba(164, 90, 255, 0.16)' : 'rgba(110, 220, 90, 0.16)';
      ctx.beginPath();
      ctx.arc(x, y, b.radius * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isMiasma ? 'rgba(164, 90, 255, 0.5)' : 'rgba(110, 220, 90, 0.45)';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (b.kind === 'mine') {
      if (!cam.isVisible(b.pos.x, b.pos.y, 20)) continue;
      const x = cam.toScreenX(b.pos.x);
      const y = cam.toScreenY(b.pos.y);
      const armed = b.armTimer <= 0;
      const blink = armed && Math.sin(state.time * 10) > 0;
      ctx.fillStyle = blink ? '#ffd24d' : '#c4a44d';
      ctx.beginPath();
      ctx.ellipse(x, y, 8, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}

function drawGems(state: GameState, ctx: CanvasRenderingContext2D): void {
  const cam = state.camera;
  for (const g of state.gems) {
    if (!g.alive || !cam.isVisible(g.pos.x, g.pos.y, 12)) continue;
    const x = cam.toScreenX(g.pos.x);
    const y = cam.toScreenY(g.pos.y);
    const big = g.value >= 8;
    const huge = g.value >= 25;
    const s = huge ? 10 : big ? 8 : 5.5;
    ctx.fillStyle = huge ? '#ff5470' : big ? '#ffd24d' : '#7df9ff';
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s * 0.7, y);
    ctx.lineTo(x, y + s);
    ctx.lineTo(x - s * 0.7, y);
    ctx.closePath();
    ctx.fill();
  }
}

const PICKUP_ICONS: Record<string, string> = {
  heal: '🍖',
  magnet: '🧲',
  bomb: '💣',
  chest: '🎁',
};

function drawPickups(state: GameState, ctx: CanvasRenderingContext2D): void {
  const cam = state.camera;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '20px sans-serif';
  for (const item of state.pickups) {
    if (!item.alive || !cam.isVisible(item.pos.x, item.pos.y, 24)) continue;
    const x = cam.toScreenX(item.pos.x);
    const y = cam.toScreenY(item.pos.y) + Math.sin(item.vel.x) * 5;
    ctx.fillStyle = 'rgba(255, 210, 77, 0.18)';
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 210, 77, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillText(PICKUP_ICONS[item.kind], x, y + 1);
  }
}

function drawEnemies(state: GameState, ctx: CanvasRenderingContext2D): void {
  const cam = state.camera;
  for (const e of state.enemies) {
    if (!e.alive || !cam.isVisible(e.pos.x, e.pos.y, e.radius + 16)) continue;
    const x = cam.toScreenX(e.pos.x);
    const y = cam.toScreenY(e.pos.y);
    const sprite = getEnemySprite(e.type);
    const scale = e.spriteScale;
    const sw = sprite.width * scale;
    ctx.save();
    ctx.translate(x, y);
    // 進行方向を向くタイプだけ回転
    if (e.behavior === 'shield' || e.behavior === 'dash' || e.type === 'worm_head') {
      ctx.rotate(Math.atan2(e.facing.y, e.facing.x));
    }
    ctx.drawImage(sprite, -sw / 2, -sw / 2, sw, sw);
    if (e.flash > 0) {
      ctx.globalAlpha = e.flash * 6;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, e.radius * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (e.poisonTtl > 0) {
      ctx.strokeStyle = 'rgba(110, 220, 90, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius * scale + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // 大物はHPバーを出す
    if ((e.maxHp >= 300 || e.type === 'elite') && e.hp < e.maxHp) {
      const bw = e.radius * 2;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(x - bw / 2, y - e.radius - 12, bw, 5);
      ctx.fillStyle = e.type === 'elite' ? '#ffd24d' : '#ff5470';
      ctx.fillRect(x - bw / 2, y - e.radius - 12, bw * (e.hp / e.maxHp), 5);
    }
  }
}

function drawMinions(state: GameState, ctx: CanvasRenderingContext2D): void {
  const cam = state.camera;
  for (const m of state.minions) {
    if (!m.alive || !cam.isVisible(m.pos.x, m.pos.y, 14)) continue;
    const x = cam.toScreenX(m.pos.x);
    const y = cam.toScreenY(m.pos.y);
    const ang = Math.atan2(m.facing.y, m.facing.x);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.fillStyle = '#b8ff5a';
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-6, -6);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawBullets(state: GameState, ctx: CanvasRenderingContext2D): void {
  const cam = state.camera;
  for (const b of state.bullets) {
    if (!b.alive || b.kind === 'zone' || b.kind === 'mine') continue;
    if (!cam.isVisible(b.pos.x, b.pos.y, b.radius + 30)) continue;
    const x = cam.toScreenX(b.pos.x);
    const y = cam.toScreenY(b.pos.y);
    if (b.kind === 'orbit') {
      // 回転ノコ刃
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(b.angle * 3);
      ctx.fillStyle = b.weaponId === 'guillotine' ? '#ffd24d' : '#e8ecff';
      const r = b.radius;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const rr = i % 2 === 0 ? r : r * 0.55;
        if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (b.kind === 'rail') {
      // 貫通杭：進行方向に伸びる光条
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(b.angle);
      const grad = ctx.createLinearGradient(-90, 0, 14, 0);
      grad.addColorStop(0, 'rgba(125, 155, 255, 0)');
      grad.addColorStop(1, '#bcd0ff');
      ctx.fillStyle = grad;
      ctx.fillRect(-90, -b.radius * 0.5, 104, b.radius);
      ctx.restore();
    } else if (b.kind === 'enemy') {
      ctx.fillStyle = '#ff5470';
      ctx.beginPath();
      ctx.arc(x, y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.fillStyle = b.kind === 'homing' ? '#b8ff5a' : b.weaponId === 'leech' ? '#ff7a9a' : '#9ae8ff';
      ctx.beginPath();
      ctx.arc(x, y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawPlayer(state: GameState, ctx: CanvasRenderingContext2D): void {
  const p = state.player;
  if (!p.alive) return;
  const cam = state.camera;
  const x = cam.toScreenX(p.pos.x);
  const y = cam.toScreenY(p.pos.y);
  const cls = CLASSES[p.classId];

  // 毒オーラ可視化
  if (p.mods.auraPoison > 0) {
    ctx.fillStyle = 'rgba(164, 90, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(x, y, p.radius + 120, 0, Math.PI * 2);
    ctx.fill();
  }
  // 回収範囲（薄く）
  ctx.strokeStyle = 'rgba(125, 249, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, p.pickupRange, 0, Math.PI * 2);
  ctx.stroke();

  // 無敵中は点滅
  if (p.invuln > 0 && Math.sin(state.time * 40) > 0) ctx.globalAlpha = 0.5;
  drawCreature(ctx, x, y, p.radius, cls, p.facing.x, p.facing.y, state.time, cls.tier);
  ctx.globalAlpha = 1;
}

function drawBot(state: GameState, ctx: CanvasRenderingContext2D): void {
  const bot = state.bot;
  if (!bot.alive || bot.respawnTimer > 0 || !bot.spawned) return;
  const cam = state.camera;
  if (!cam.isVisible(bot.pos.x, bot.pos.y, bot.radius + 30)) return;
  const x = cam.toScreenX(bot.pos.x);
  const y = cam.toScreenY(bot.pos.y);
  drawCreature(
    ctx,
    x,
    y,
    bot.radius,
    { color: '#ff5470', color2: '#8c1a30', shape: 'spiky' },
    bot.vel.x,
    bot.vel.y,
    state.time,
    20,
  );
  if (bot.flash > 0) {
    ctx.globalAlpha = bot.flash * 6;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, bot.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // ネームタグとHP
  ctx.textAlign = 'center';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = '#ff8ca0';
  ctx.fillText(`VORE Lv${bot.level}`, x, y - bot.radius - 16);
  const bw = bot.radius * 2;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x - bw / 2, y - bot.radius - 11, bw, 4);
  ctx.fillStyle = '#ff5470';
  ctx.fillRect(x - bw / 2, y - bot.radius - 11, bw * (bot.hp / bot.maxHp), 4);
}

function drawParticles(state: GameState, ctx: CanvasRenderingContext2D): void {
  const cam = state.camera;
  for (const p of state.particles) {
    if (!p.alive) continue;
    const a = p.ttl / p.maxTtl;
    const x = cam.toScreenX(p.pos.x);
    const y = cam.toScreenY(p.pos.y);
    ctx.globalAlpha = a;
    if (p.kind === 'ring') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, p.size * (1.6 - a * 0.6), 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.kind === 'line') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(cam.toScreenX(p.toX), cam.toScreenY(p.toY));
      ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(x - p.size / 2, y - p.size / 2, p.size, p.size);
    }
  }
  ctx.globalAlpha = 1;
}

function drawDamageNumbers(state: GameState, ctx: CanvasRenderingContext2D): void {
  const cam = state.camera;
  ctx.textAlign = 'center';
  for (const d of state.damageNumbers) {
    if (!d.alive) continue;
    ctx.globalAlpha = Math.min(1, d.ttl * 2.5);
    ctx.font = d.crit ? 'bold 18px sans-serif' : 'bold 13px sans-serif';
    ctx.fillStyle = d.heal ? '#5aff8c' : d.crit ? '#ffd24d' : '#ffffff';
    ctx.fillText(String(d.value), cam.toScreenX(d.x), cam.toScreenY(d.y));
  }
  ctx.globalAlpha = 1;
}

function drawFog(state: GameState, ctx: CanvasRenderingContext2D): void {
  if (state.time < FOG_START - 5) return;
  const cam = state.camera;
  const cx = cam.toScreenX(WORLD_W / 2);
  const cy = cam.toScreenY(WORLD_H / 2);
  ctx.fillStyle = 'rgba(90, 20, 110, 0.45)';
  ctx.beginPath();
  ctx.rect(0, 0, cam.viewW, cam.viewH);
  ctx.arc(cx, cy, state.fogRadius, 0, Math.PI * 2, true);
  ctx.fill();
  ctx.strokeStyle = 'rgba(196, 125, 255, 0.8)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, state.fogRadius, 0, Math.PI * 2);
  ctx.stroke();
}
