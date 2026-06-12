import { CLASSES } from '../data/classes';
import { FOG_START } from '../data/waves';
import { WORLD_H, WORLD_W, type GameState } from '../state';
import { drawCreature, drawGlow, getEnemySprite, rgba } from './shapes';

/** タイトル画面用：ゆっくり流れるアンビエント背景だけを描く */
export function renderAmbient(state: GameState, ctx: CanvasRenderingContext2D): void {
  const cam = state.camera;
  drawBackground(state, ctx, cam.viewW, cam.viewH);
  drawVignette(ctx, cam.viewW, cam.viewH);
}

export function renderWorld(state: GameState, ctx: CanvasRenderingContext2D): void {
  const cam = state.camera;
  const w = cam.viewW;
  const h = cam.viewH;

  drawBackground(state, ctx, w, h);
  drawZonesAndMines(state, ctx);
  drawWormLinks(state, ctx);
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
  drawVignette(ctx, w, h);

  // 被弾フラッシュ（赤ビネット）
  if (state.player.hurtFlash > 0) {
    ctx.fillStyle = `rgba(255, 60, 80, ${state.player.hurtFlash * 0.8})`;
    ctx.fillRect(0, 0, w, h);
  }
  // 低HPの鼓動警告
  const hpRatio = state.player.hp / state.player.maxHp;
  if (state.player.alive && hpRatio < 0.3) {
    const pulse = (Math.sin(state.time * 6) * 0.5 + 0.5) * (1 - hpRatio / 0.3);
    ctx.fillStyle = `rgba(255, 40, 60, ${pulse * 0.16})`;
    ctx.fillRect(0, 0, w, h);
  }
}

// ---------------------------------------------------------------------------
// 背景：深海バイオネビュラ＋パララックス塵＋ソフトグリッド
// ---------------------------------------------------------------------------

/** 決定的な擬似乱数（タイル座標→0..1）。状態を持たない */
function hash2(ix: number, iy: number): number {
  let n = ix * 374761393 + iy * 668265263;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967296;
}

// ワールド固定のネビュラ（色とりどりの淡い光だまり）
const NEBULAE: { x: number; y: number; r: number; color: string; a: number }[] = [
  { x: 300, y: 400, r: 520, color: '#16306e', a: 0.55 },
  { x: 1600, y: 300, r: 460, color: '#3a1660', a: 0.5 },
  { x: 1000, y: 1100, r: 600, color: '#0e3a52', a: 0.5 },
  { x: 400, y: 1650, r: 480, color: '#10403a', a: 0.45 },
  { x: 1700, y: 1600, r: 540, color: '#401a4e', a: 0.5 },
];

function drawBackground(state: GameState, ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cam = state.camera;

  // ベース：縦方向の深度グラデーション
  const base = ctx.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, '#0b0d1c');
  base.addColorStop(1, '#06070f');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // ネビュラ（パララックス0.35：ゆっくり流れる遠景）
  for (const nb of NEBULAE) {
    const sx = nb.x - cam.x * 0.35 + w * 0.3;
    const sy = nb.y - cam.y * 0.35 + h * 0.3;
    drawGlow(ctx, sx, sy, nb.r, nb.color, nb.a);
  }

  // 浮遊塵 2層（奥：小さく暗い / 手前：大きく明るい）
  drawDustLayer(state, ctx, w, h, 0.5, 230, 1.4, 0.22);
  drawDustLayer(state, ctx, w, h, 0.78, 170, 2.2, 0.4);

  // ソフトグリッド（交点にだけ淡い点）
  const grid = 100;
  const x0 = Math.floor(cam.toWorldX(0) / grid) * grid;
  const y0 = Math.floor(cam.toWorldY(0) / grid) * grid;
  ctx.fillStyle = 'rgba(90, 110, 180, 0.13)';
  for (let gx = x0; gx <= cam.toWorldX(w) + grid; gx += grid) {
    for (let gy = y0; gy <= cam.toWorldY(h) + grid; gy += grid) {
      if (gx < 0 || gx > WORLD_W || gy < 0 || gy > WORLD_H) continue;
      ctx.fillRect(cam.toScreenX(gx) - 1.5, cam.toScreenY(gy) - 1.5, 3, 3);
    }
  }
  // 極薄のライン
  ctx.strokeStyle = 'rgba(70, 85, 150, 0.07)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = x0; gx <= cam.toWorldX(w) + grid; gx += grid) {
    ctx.moveTo(cam.toScreenX(gx), 0);
    ctx.lineTo(cam.toScreenX(gx), h);
  }
  for (let gy = y0; gy <= cam.toWorldY(h) + grid; gy += grid) {
    ctx.moveTo(0, cam.toScreenY(gy));
    ctx.lineTo(w, cam.toScreenY(gy));
  }
  ctx.stroke();

  // ワールド境界：光る壁
  const bx = cam.toScreenX(0);
  const by = cam.toScreenY(0);
  ctx.strokeStyle = 'rgba(125, 249, 255, 0.18)';
  ctx.lineWidth = 10;
  ctx.strokeRect(bx, by, WORLD_W, WORLD_H);
  ctx.strokeStyle = 'rgba(125, 249, 255, 0.7)';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(bx, by, WORLD_W, WORLD_H);
}

function drawDustLayer(
  state: GameState,
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  parallax: number,
  tile: number,
  size: number,
  alpha: number,
): void {
  const cam = state.camera;
  const ox = cam.x * parallax;
  const oy = cam.y * parallax;
  const ix0 = Math.floor(ox / tile) - 1;
  const iy0 = Math.floor(oy / tile) - 1;
  const cols = Math.ceil(w / tile) + 2;
  const rows = Math.ceil(h / tile) + 2;
  ctx.fillStyle = `rgba(150, 190, 255, ${alpha})`;
  for (let i = 0; i <= cols; i++) {
    for (let j = 0; j <= rows; j++) {
      const ix = ix0 + i;
      const iy = iy0 + j;
      const r1 = hash2(ix, iy);
      if (r1 > 0.7) continue; // タイルの3割は空
      const r2 = hash2(ix + 7919, iy + 104729);
      const px = ix * tile + r1 * tile - ox;
      const py = iy * tile + r2 * tile - oy;
      const drift = Math.sin(state.time * 0.7 + r1 * 12) * 6;
      const s = size * (0.5 + r2);
      ctx.globalAlpha = alpha * (0.4 + 0.6 * Math.sin(state.time * 0.9 + r2 * 9) ** 2);
      ctx.fillRect(px + drift, py - drift * 0.6, s, s);
    }
  }
  ctx.globalAlpha = 1;
}

// 画面サイズに合わせてキャッシュするビネット
let vignetteCanvas: HTMLCanvasElement | null = null;

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  if (!vignetteCanvas || vignetteCanvas.width !== w || vignetteCanvas.height !== h) {
    vignetteCanvas = document.createElement('canvas');
    vignetteCanvas.width = w;
    vignetteCanvas.height = h;
    const vctx = vignetteCanvas.getContext('2d')!;
    const grad = vctx.createRadialGradient(
      w / 2,
      h / 2,
      Math.min(w, h) * 0.45,
      w / 2,
      h / 2,
      Math.hypot(w, h) * 0.62,
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(2,3,10,0.55)');
    vctx.fillStyle = grad;
    vctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(vignetteCanvas, 0, 0);
}

// ---------------------------------------------------------------------------
// エンティティ描画
// ---------------------------------------------------------------------------

function drawZonesAndMines(state: GameState, ctx: CanvasRenderingContext2D): void {
  const cam = state.camera;
  for (const b of state.bullets) {
    if (!b.alive) continue;
    if (b.kind === 'zone') {
      if (!cam.isVisible(b.pos.x, b.pos.y, b.radius)) continue;
      const x = cam.toScreenX(b.pos.x);
      const y = cam.toScreenY(b.pos.y);
      const isMiasma = b.weaponId === 'miasma';
      const color = isMiasma ? '#a45aff' : '#6edc5a';
      const pulse = 1 + Math.sin(state.time * 5 + b.angle + b.pos.x * 0.01) * 0.06;
      const r = b.radius * pulse;
      // 多層の霧（中心ほど濃い）
      drawGlow(ctx, x, y, r * 1.15, color, 0.5);
      ctx.fillStyle = rgba(color, 0.13);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      // 渦巻く粒
      ctx.fillStyle = rgba(color, 0.5);
      for (let i = 0; i < 5; i++) {
        const a = state.time * (1.2 + i * 0.13) + i * 2.5 + b.angle;
        const rr = r * (0.35 + 0.55 * ((i * 137) % 100) / 100);
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = rgba(color, 0.4);
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 10]);
      ctx.beginPath();
      ctx.arc(x, y, r, state.time * 0.5, state.time * 0.5 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (b.kind === 'mine') {
      if (!cam.isVisible(b.pos.x, b.pos.y, 24)) continue;
      const x = cam.toScreenX(b.pos.x);
      const y = cam.toScreenY(b.pos.y);
      const armed = b.armTimer <= 0;
      const blink = armed && Math.sin(state.time * 10) > 0;
      if (blink) drawGlow(ctx, x, y, 22, '#ffd24d', 0.8);
      const grad = ctx.createRadialGradient(x - 3, y - 4, 1, x, y, 11);
      grad.addColorStop(0, blink ? '#fff3c4' : '#e8d49a');
      grad.addColorStop(1, blink ? '#d4a017' : '#8a7434');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(x, y, 8, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}

/** マザーワームの節を太い体節チューブでつなぐ */
function drawWormLinks(state: GameState, ctx: CanvasRenderingContext2D): void {
  const chain = state.wormChain;
  if (chain.length < 2) return;
  const cam = state.camera;
  ctx.lineCap = 'round';
  for (let i = 1; i < chain.length; i++) {
    const a = chain[i - 1];
    const b = chain[i];
    if (!a.alive || !b.alive) continue;
    if (!cam.isVisible(a.pos.x, a.pos.y, 120) && !cam.isVisible(b.pos.x, b.pos.y, 120)) continue;
    ctx.strokeStyle = 'rgba(140, 26, 48, 0.85)';
    ctx.lineWidth = Math.min(a.radius, b.radius) * 1.5;
    ctx.beginPath();
    ctx.moveTo(cam.toScreenX(a.pos.x), cam.toScreenY(a.pos.y));
    ctx.lineTo(cam.toScreenX(b.pos.x), cam.toScreenY(b.pos.y));
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
}

function drawGems(state: GameState, ctx: CanvasRenderingContext2D): void {
  const cam = state.camera;
  for (const g of state.gems) {
    if (!g.alive || !cam.isVisible(g.pos.x, g.pos.y, 16)) continue;
    const x = cam.toScreenX(g.pos.x);
    const y = cam.toScreenY(g.pos.y);
    const big = g.value >= 8;
    const huge = g.value >= 25;
    const color = huge ? '#ff5470' : big ? '#ffd24d' : '#7df9ff';
    const pulse = 1 + Math.sin(state.time * 6 + g.pos.x * 0.05 + g.pos.y * 0.03) * 0.15;
    const s = (huge ? 10 : big ? 8 : 5.5) * pulse;
    drawGlow(ctx, x, y, s * 2.6, color, huge ? 0.9 : 0.55);
    // ダイヤ本体（縦グラデで宝石感）
    const grad = ctx.createLinearGradient(x, y - s, x, y + s);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, color);
    grad.addColorStop(1, rgba(color, 0.6));
    ctx.fillStyle = grad;
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
    if (!item.alive || !cam.isVisible(item.pos.x, item.pos.y, 28)) continue;
    const x = cam.toScreenX(item.pos.x);
    const y = cam.toScreenY(item.pos.y) + Math.sin(item.vel.x) * 5;
    drawGlow(ctx, x, y, 30, '#ffd24d', 0.5 + Math.sin(state.time * 4) * 0.15);
    ctx.fillStyle = 'rgba(255, 210, 77, 0.14)';
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 210, 77, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(x, y, 17, state.time * 1.5, state.time * 1.5 + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText(PICKUP_ICONS[item.kind], x, y + 1);
  }
}

function drawEnemies(state: GameState, ctx: CanvasRenderingContext2D): void {
  const cam = state.camera;
  for (const e of state.enemies) {
    if (!e.alive || !cam.isVisible(e.pos.x, e.pos.y, e.radius + 20)) continue;
    const x = cam.toScreenX(e.pos.x);
    const y = cam.toScreenY(e.pos.y);
    const sprite = getEnemySprite(e.type);
    const scale = e.spriteScale;
    const sw = sprite.width * scale;

    // ボス級とエリートには常時オーラ
    if (e.type === 'elite') drawGlow(ctx, x, y, e.radius * 2.4, '#ffd24d', 0.55);
    else if (e.type === 'worm_head') drawGlow(ctx, x, y, e.radius * 2.6, '#ff5470', 0.6);
    else if (e.type === 'colossus')
      drawGlow(ctx, x, y, e.radius * 2.1, '#c47dff', 0.65 + Math.sin(state.time * 2) * 0.1);

    ctx.save();
    ctx.translate(x, y);
    if (e.behavior === 'shield' || e.behavior === 'dash' || e.type === 'worm_head') {
      ctx.rotate(Math.atan2(e.facing.y, e.facing.x));
    }
    // 移動方向にスクワッシュ＆ストレッチ（ぷにぷに感）
    const squish = 1 + Math.sin(state.time * 8 + e.pos.x * 0.02) * 0.05;
    ctx.scale(squish, 2 - squish);
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
      ctx.strokeStyle = rgba('#6edc5a', 0.8);
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, e.radius * scale + 4, state.time * 3, state.time * 3 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();

    // 大物はHPバー
    if ((e.maxHp >= 300 || e.type === 'elite') && e.hp < e.maxHp) {
      const bw = e.radius * 2;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(x - bw / 2, y - e.radius - 13, bw, 5);
      ctx.fillStyle = e.type === 'elite' ? '#ffd24d' : '#ff5470';
      ctx.fillRect(x - bw / 2, y - e.radius - 13, bw * (e.hp / e.maxHp), 5);
    }
  }
}

function drawMinions(state: GameState, ctx: CanvasRenderingContext2D): void {
  const cam = state.camera;
  for (const m of state.minions) {
    if (!m.alive || !cam.isVisible(m.pos.x, m.pos.y, 16)) continue;
    const x = cam.toScreenX(m.pos.x);
    const y = cam.toScreenY(m.pos.y);
    drawGlow(ctx, x, y, 14, '#b8ff5a', 0.5);
    const ang = Math.atan2(m.facing.y, m.facing.x);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    const grad = ctx.createLinearGradient(-6, 0, 9, 0);
    grad.addColorStop(0, '#6fa72e');
    grad.addColorStop(1, '#e2ff9a');
    ctx.fillStyle = grad;
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
    if (!cam.isVisible(b.pos.x, b.pos.y, b.radius + 40)) continue;
    const x = cam.toScreenX(b.pos.x);
    const y = cam.toScreenY(b.pos.y);
    if (b.kind === 'orbit') {
      const isSuper = b.weaponId === 'guillotine';
      const color = isSuper ? '#ffd24d' : '#cfe2ff';
      drawGlow(ctx, x, y, b.radius * 2, color, isSuper ? 0.8 : 0.5);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(b.angle * 3);
      const r = b.radius;
      const grad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const rr = i % 2 === 0 ? r : r * 0.55;
        if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(10,10,20,0.7)';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (b.kind === 'rail') {
      const color = '#bcd0ff';
      drawGlow(ctx, x, y, b.radius * 3, color, 0.9);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(b.angle);
      const grad = ctx.createLinearGradient(-130, 0, 16, 0);
      grad.addColorStop(0, 'rgba(125, 155, 255, 0)');
      grad.addColorStop(0.8, rgba(color, 0.7));
      grad.addColorStop(1, '#ffffff');
      ctx.fillStyle = grad;
      ctx.fillRect(-130, -b.radius * 0.55, 146, b.radius * 1.1);
      ctx.restore();
    } else {
      // straight / homing / enemy：トレイル＋グローコア
      const color =
        b.kind === 'enemy'
          ? '#ff5470'
          : b.kind === 'homing'
            ? '#b8ff5a'
            : b.weaponId === 'leech'
              ? '#ff7a9a'
              : '#9ae8ff';
      // トレイル：毎フレームのグラデーション生成は高くつくので2段ストロークで近似
      const speed = Math.hypot(b.vel.x, b.vel.y) || 1;
      const dx = b.vel.x / speed;
      const dy = b.vel.y / speed;
      ctx.lineCap = 'round';
      ctx.strokeStyle = rgba(color, 0.18);
      ctx.lineWidth = b.radius * 1.4;
      ctx.beginPath();
      ctx.moveTo(x - dx * b.radius * 6, y - dy * b.radius * 6);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.strokeStyle = rgba(color, 0.55);
      ctx.lineWidth = b.radius;
      ctx.beginPath();
      ctx.moveTo(x - dx * b.radius * 3, y - dy * b.radius * 3);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.lineCap = 'butt';
      drawGlow(ctx, x, y, b.radius * 2.4, color, 0.7);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(x - dx * b.radius * 0.2, y - dy * b.radius * 0.2, b.radius * 0.45, 0, Math.PI * 2);
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
    drawGlow(ctx, x, y, p.radius + 130, '#a45aff', 0.45);
    ctx.strokeStyle = rgba('#a45aff', 0.35);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.arc(x, y, p.radius + 120, state.time, state.time + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // 回収範囲（極薄）
  ctx.strokeStyle = 'rgba(125, 249, 255, 0.07)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, p.pickupRange, 0, Math.PI * 2);
  ctx.stroke();

  // ダッシュ残像
  if (p.dashTimer > 0) {
    const speed = Math.hypot(p.vel.x, p.vel.y) || 1;
    for (let i = 1; i <= 3; i++) {
      const gx = x - (p.vel.x / speed) * i * 14;
      const gy = y - (p.vel.y / speed) * i * 14;
      ctx.globalAlpha = 0.22 / i;
      ctx.fillStyle = cls.color;
      ctx.beginPath();
      ctx.arc(gx, gy, p.radius * (1 - i * 0.12), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  if (p.invuln > 0 && Math.sin(state.time * 40) > 0) ctx.globalAlpha = 0.5;
  drawCreature(ctx, x, y, p.radius, cls, p.facing.x, p.facing.y, state.time, cls.tier);
  ctx.globalAlpha = 1;
}

function drawBot(state: GameState, ctx: CanvasRenderingContext2D): void {
  const bot = state.bot;
  if (!bot.alive || bot.respawnTimer > 0 || !bot.spawned) return;
  const cam = state.camera;
  if (!cam.isVisible(bot.pos.x, bot.pos.y, bot.radius + 40)) return;
  const x = cam.toScreenX(bot.pos.x);
  const y = cam.toScreenY(bot.pos.y);
  // 狩りモードでは赤い殺気が濃くなる
  drawGlow(ctx, x, y, bot.radius * 2.6, '#ff5470', bot.state === 'hunt' ? 0.85 : 0.45);
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
  ctx.textAlign = 'center';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = '#ff8ca0';
  ctx.fillText(`VORE Lv${bot.level}`, x, y - bot.radius - 18);
  const bw = bot.radius * 2;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x - bw / 2, y - bot.radius - 13, bw, 4);
  ctx.fillStyle = '#ff5470';
  ctx.fillRect(x - bw / 2, y - bot.radius - 13, bw * (bot.hp / bot.maxHp), 4);
}

function drawParticles(state: GameState, ctx: CanvasRenderingContext2D): void {
  const cam = state.camera;
  const prev = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighter';
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
      ctx.arc(x, y, p.size * (1.8 - a * 0.8), 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.kind === 'line') {
      // 稲妻：ギザギザの2連線
      const x2 = cam.toScreenX(p.toX);
      const y2 = cam.toScreenY(p.toY);
      const mx = (x + x2) / 2 + (hash2(p.toX | 0, p.toY | 0) - 0.5) * 28;
      const my = (y + y2) / 2 + (hash2(p.toY | 0, p.toX | 0) - 0.5) * 28;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = p.size * 1.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(mx, my);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size * 0.7;
      ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(x - p.size / 2, y - p.size / 2, p.size, p.size);
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = prev;
}

function drawDamageNumbers(state: GameState, ctx: CanvasRenderingContext2D): void {
  const cam = state.camera;
  ctx.textAlign = 'center';
  for (const d of state.damageNumbers) {
    if (!d.alive) continue;
    ctx.globalAlpha = Math.min(1, d.ttl * 2.5);
    ctx.font = d.crit ? 'bold 19px sans-serif' : 'bold 13px sans-serif';
    const x = cam.toScreenX(d.x);
    const y = cam.toScreenY(d.y);
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 3;
    ctx.strokeText(String(d.value), x, y);
    ctx.fillStyle = d.heal ? '#5aff8c' : d.crit ? '#ffd24d' : '#ffffff';
    ctx.fillText(String(d.value), x, y);
  }
  ctx.globalAlpha = 1;
}

function drawFog(state: GameState, ctx: CanvasRenderingContext2D): void {
  if (state.time < FOG_START - 5) return;
  const cam = state.camera;
  const cx = cam.toScreenX(WORLD_W / 2);
  const cy = cam.toScreenY(WORLD_H / 2);
  const r = state.fogRadius;
  // 外側の喰らい霧
  ctx.fillStyle = 'rgba(70, 14, 92, 0.5)';
  ctx.beginPath();
  ctx.rect(0, 0, cam.viewW, cam.viewH);
  ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
  ctx.fill();
  // 内向きに薄まるグラデーションの縁
  const edge = ctx.createRadialGradient(cx, cy, Math.max(0, r - 70), cx, cy, r);
  edge.addColorStop(0, 'rgba(196, 125, 255, 0)');
  edge.addColorStop(1, 'rgba(196, 125, 255, 0.3)');
  ctx.fillStyle = edge;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // 脈動する境界線（2重）
  const pulse = Math.sin(state.time * 4) * 3;
  ctx.strokeStyle = 'rgba(196, 125, 255, 0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r + pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(cx, cy, r + pulse, 0, Math.PI * 2);
  ctx.stroke();
}
