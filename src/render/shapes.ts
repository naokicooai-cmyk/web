import type { BodyShape } from '../data/classes';
import { ENEMIES } from '../data/enemies';
import type { EnemyTypeId } from '../types';

// ---------------------------------------------------------------------------
// カラーユーティリティ
// ---------------------------------------------------------------------------

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ---------------------------------------------------------------------------
// グロースプライト（加算合成用の放射グラデーションをキャッシュ）
// ctx.shadowBlur は遅いので、事前描画した光暈を drawImage する
// ---------------------------------------------------------------------------

const GLOW_SIZE = 64;
const glowCache = new Map<string, HTMLCanvasElement>();

export function getGlow(color: string): HTMLCanvasElement {
  let c = glowCache.get(color);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = GLOW_SIZE;
  c.height = GLOW_SIZE;
  const ctx = c.getContext('2d')!;
  const half = GLOW_SIZE / 2;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, rgba(color, 0.55));
  grad.addColorStop(0.35, rgba(color, 0.22));
  grad.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, GLOW_SIZE, GLOW_SIZE);
  glowCache.set(color, c);
  return c;
}

/** 加算合成で光暈を落とす。呼び出し側で composite を戻す必要はない */
export function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  alpha = 1,
): void {
  const prev = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha;
  ctx.drawImage(getGlow(color), x - radius, y - radius, radius * 2, radius * 2);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = prev;
}

// ---------------------------------------------------------------------------
// 敵スプライトキャッシュ（リムライト・ハイライト・模様で立体感を出す）
// ---------------------------------------------------------------------------

const spriteCache = new Map<EnemyTypeId, HTMLCanvasElement>();

export function getEnemySprite(type: EnemyTypeId): HTMLCanvasElement {
  let c = spriteCache.get(type);
  if (c) return c;
  const def = ENEMIES[type];
  const r = def.radius;
  const margin = 10;
  const size = (r + margin) * 2;
  c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.translate(size / 2, size / 2);

  // トゲ（外周）：グラデーションで根元を暗く
  if (def.spikes > 0) {
    for (let i = 0; i < def.spikes; i++) {
      const ang = (i / def.spikes) * Math.PI * 2;
      const grad = ctx.createLinearGradient(
        Math.cos(ang) * r * 0.7,
        Math.sin(ang) * r * 0.7,
        Math.cos(ang) * (r + 7),
        Math.sin(ang) * (r + 7),
      );
      grad.addColorStop(0, def.color2);
      grad.addColorStop(1, def.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang - 0.22) * r * 0.85, Math.sin(ang - 0.22) * r * 0.85);
      ctx.lineTo(Math.cos(ang) * (r + 7), Math.sin(ang) * (r + 7));
      ctx.lineTo(Math.cos(ang + 0.22) * r * 0.85, Math.sin(ang + 0.22) * r * 0.85);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 本体：上方ハイライト＋下方シェード
  const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r * 1.05);
  grad.addColorStop(0, lighten(def.color, 0.35));
  grad.addColorStop(0.55, def.color);
  grad.addColorStop(1, def.color2);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // リムライト（縁の反射）
  ctx.strokeStyle = rgba('#ffffff', 0.35);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, r - 1, -Math.PI * 0.85, -Math.PI * 0.15);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  // 体内の核（半透明の内臓っぽさ）
  ctx.fillStyle = rgba(def.color2, 0.5);
  ctx.beginPath();
  ctx.arc(r * 0.1, r * 0.15, r * 0.42, 0, Math.PI * 2);
  ctx.fill();

  // シールド甲虫は正面の装甲（弱点が背後だと伝える）
  if (type === 'beetle') {
    const armor = ctx.createLinearGradient(0, -r, 0, r);
    armor.addColorStop(0, '#f4f4fc');
    armor.addColorStop(1, '#b0b0c8');
    ctx.fillStyle = armor;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.97, -Math.PI * 0.42, Math.PI * 0.42);
    ctx.arc(0, 0, r * 0.5, Math.PI * 0.42, -Math.PI * 0.42, true);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,40,60,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // エリートは金のオーラリング
  if (type === 'elite') {
    ctx.strokeStyle = rgba('#ffd24d', 0.9);
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 目（進行方向＝+x）：白目＋瞳でキャラ性を出す
  const eyeR = Math.max(2.5, r * 0.2);
  for (const sy of [-r * 0.3, r * 0.3]) {
    ctx.fillStyle = '#f4f6ff';
    ctx.beginPath();
    ctx.arc(r * 0.42, sy, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0a14';
    ctx.beginPath();
    ctx.arc(r * 0.42 + eyeR * 0.35, sy, eyeR * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }

  spriteCache.set(type, c);
  return c;
}

function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${Math.min(255, r + 255 * amount)},${Math.min(255, g + 255 * amount)},${Math.min(255, b + 255 * amount)})`;
}

// ---------------------------------------------------------------------------
// プレイヤー / ボットの手続き描画
// 「生きた細胞」：サイン波で揺れるメンブレン＋核＋進化段階オーラ
// ---------------------------------------------------------------------------

export interface CreatureLook {
  color: string;
  color2: string;
  shape: BodyShape;
}

const MEMBRANE_POINTS = 14;

export function drawCreature(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  look: CreatureLook,
  facingX: number,
  facingY: number,
  time: number,
  tier: number,
): void {
  const ang = Math.atan2(facingY, facingX);

  // 進化段階のオーラ（Lv10以降）
  if (tier >= 10) {
    drawGlow(ctx, x, y, r * (2.2 + tier * 0.02), look.color, 0.5 + tier * 0.012);
  } else {
    drawGlow(ctx, x, y, r * 2, look.color, 0.35);
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);

  // トゲ装飾（捕食系/王冠系）
  if (look.shape === 'spiky' || look.shape === 'crown') {
    const spikes = 7 + Math.floor(tier / 8);
    for (let i = 0; i < spikes; i++) {
      const a = (i / spikes) * Math.PI * 2 + time * 0.6;
      const pulse = 1 + Math.sin(time * 5 + i * 1.7) * 0.12;
      const sr = (r + 8 + (look.shape === 'crown' ? 4 : 0)) * pulse;
      const grad = ctx.createLinearGradient(
        Math.cos(a) * r * 0.8,
        Math.sin(a) * r * 0.8,
        Math.cos(a) * sr,
        Math.sin(a) * sr,
      );
      grad.addColorStop(0, look.color2);
      grad.addColorStop(1, look.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - 0.18) * r * 0.85, Math.sin(a - 0.18) * r * 0.85);
      ctx.lineTo(Math.cos(a) * sr, Math.sin(a) * sr);
      ctx.lineTo(Math.cos(a + 0.18) * r * 0.85, Math.sin(a + 0.18) * r * 0.85);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 砲身（砲撃系）：二重バレル＋マズル
  if (look.shape === 'turret') {
    const bl = r * 1.75;
    const grad = ctx.createLinearGradient(0, -r * 0.3, 0, r * 0.3);
    grad.addColorStop(0, lighten(look.color2, 0.25));
    grad.addColorStop(0.5, look.color2);
    grad.addColorStop(1, 'rgba(10,10,20,0.9)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, -r * 0.26, bl, r * 0.52);
    ctx.fillStyle = look.color;
    ctx.fillRect(bl - r * 0.22, -r * 0.34, r * 0.22, r * 0.68);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, -r * 0.26, bl, r * 0.52);
  }

  // ---- メンブレン本体：揺れる細胞膜 ----
  ctx.beginPath();
  for (let i = 0; i <= MEMBRANE_POINTS; i++) {
    const a = (i / MEMBRANE_POINTS) * Math.PI * 2;
    const wob =
      1 +
      Math.sin(a * 3 + time * 6) * 0.045 +
      Math.sin(a * 5 - time * 4.2) * 0.03;
    const px = Math.cos(a) * r * wob;
    const py = Math.sin(a) * r * wob;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r * 1.1);
  grad.addColorStop(0, lighten(look.color, 0.4));
  grad.addColorStop(0.5, look.color);
  grad.addColorStop(1, look.color2);
  ctx.fillStyle = grad;
  ctx.fill();
  // 膜の縁
  ctx.strokeStyle = rgba('#ffffff', 0.3);
  ctx.lineWidth = 2;
  ctx.stroke();

  // 半透明の核（呼吸するように脈動）
  const nucleus = r * (0.4 + Math.sin(time * 3) * 0.04);
  ctx.fillStyle = rgba(look.color2, 0.55);
  ctx.beginPath();
  ctx.arc(-r * 0.05, r * 0.05, nucleus, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba('#ffffff', 0.18);
  ctx.beginPath();
  ctx.arc(-r * 0.18, -r * 0.12, nucleus * 0.5, 0, Math.PI * 2);
  ctx.fill();

  // 分体（群体系）
  if (look.shape === 'swarm') {
    for (let i = 0; i < 3 + Math.floor(tier / 10); i++) {
      const a = time * 3 + (i * Math.PI * 2) / (3 + Math.floor(tier / 10));
      const ox = Math.cos(a) * (r + 11);
      const oy = Math.sin(a) * (r + 11);
      ctx.fillStyle = look.color;
      ctx.beginPath();
      ctx.arc(ox, oy, r * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba('#ffffff', 0.5);
      ctx.beginPath();
      ctx.arc(ox - 1, oy - 1, r * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 王冠（Lv30王種）
  if (look.shape === 'crown') {
    ctx.fillStyle = '#ffd24d';
    ctx.beginPath();
    ctx.moveTo(-r * 0.42, -r - 2);
    ctx.lineTo(-r * 0.22, -r - 11);
    ctx.lineTo(0, -r - 4);
    ctx.lineTo(r * 0.22, -r - 12);
    ctx.lineTo(r * 0.42, -r - 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,80,0,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 目と口：白目＋瞳（進行方向を見る）
  const eyeR = Math.max(3, r * 0.17);
  for (const sy of [-r * 0.32, r * 0.32]) {
    ctx.fillStyle = '#f4f6ff';
    ctx.beginPath();
    ctx.arc(r * 0.42, sy, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0a14';
    ctx.beginPath();
    ctx.arc(r * 0.42 + eyeR * 0.3, sy, eyeR * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba('#ffffff', 0.9);
    ctx.beginPath();
    ctx.arc(r * 0.42 + eyeR * 0.1, sy - eyeR * 0.25, eyeR * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }
  // 口（捕食者のニヤリ）
  ctx.strokeStyle = '#0a0a14';
  ctx.lineWidth = Math.max(2, r * 0.09);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(r * 0.4, 0, r * 0.45, -0.55, 0.55);
  ctx.stroke();
  ctx.lineCap = 'butt';

  ctx.restore();
}
