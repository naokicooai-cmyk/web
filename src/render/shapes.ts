import type { BodyShape } from '../data/classes';
import { ENEMIES } from '../data/enemies';
import type { EnemyTypeId } from '../types';

/**
 * 敵タイプ別のオフスクリーンスプライトキャッシュ。
 * 毎フレームのパス描画を drawImage 1回に置き換える。
 */
const spriteCache = new Map<EnemyTypeId, HTMLCanvasElement>();

export function getEnemySprite(type: EnemyTypeId): HTMLCanvasElement {
  let c = spriteCache.get(type);
  if (c) return c;
  const def = ENEMIES[type];
  const r = def.radius;
  const margin = 8;
  const size = (r + margin) * 2;
  c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.translate(size / 2, size / 2);

  // トゲ（外周）
  if (def.spikes > 0) {
    ctx.fillStyle = def.color2;
    for (let i = 0; i < def.spikes; i++) {
      const ang = (i / def.spikes) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang - 0.22) * r * 0.85, Math.sin(ang - 0.22) * r * 0.85);
      ctx.lineTo(Math.cos(ang) * (r + 6), Math.sin(ang) * (r + 6));
      ctx.lineTo(Math.cos(ang + 0.22) * r * 0.85, Math.sin(ang + 0.22) * r * 0.85);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 本体
  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r);
  grad.addColorStop(0, def.color);
  grad.addColorStop(1, def.color2);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // シールド甲虫は正面の装甲を描く（弱点が背後だと伝える）
  if (type === 'beetle') {
    ctx.fillStyle = '#e8e8f4';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.95, -Math.PI * 0.42, Math.PI * 0.42);
    ctx.arc(0, 0, r * 0.55, Math.PI * 0.42, -Math.PI * 0.42, true);
    ctx.closePath();
    ctx.fill();
  }

  // 目（進行方向＝+x を向く）
  const eyeR = Math.max(2, r * 0.16);
  ctx.fillStyle = '#0a0a14';
  ctx.beginPath();
  ctx.arc(r * 0.45, -r * 0.25, eyeR, 0, Math.PI * 2);
  ctx.arc(r * 0.45, r * 0.25, eyeR, 0, Math.PI * 2);
  ctx.fill();

  spriteCache.set(type, c);
  return c;
}

export interface CreatureLook {
  color: string;
  color2: string;
  shape: BodyShape;
}

/**
 * プレイヤー/ボットの手続き描画。進化するほど派手になる。
 * facing 方向を向き、wobble でぷるぷる動く。
 */
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
  const wobble = 1 + Math.sin(time * 7) * 0.035;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(wobble, 2 - wobble);

  // 進化段階に応じた装飾
  if (look.shape === 'spiky' || look.shape === 'crown') {
    const spikes = 6 + tier / 5;
    ctx.fillStyle = look.color2;
    for (let i = 0; i < spikes; i++) {
      const a = (i / spikes) * Math.PI * 2 + time * 0.6;
      const sr = r + 7 + (look.shape === 'crown' ? 4 : 0);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - 0.2) * r * 0.85, Math.sin(a - 0.2) * r * 0.85);
      ctx.lineTo(Math.cos(a) * sr, Math.sin(a) * sr);
      ctx.lineTo(Math.cos(a + 0.2) * r * 0.85, Math.sin(a + 0.2) * r * 0.85);
      ctx.closePath();
      ctx.fill();
    }
  }
  if (look.shape === 'turret') {
    // 砲身
    ctx.fillStyle = look.color2;
    ctx.fillRect(0, -r * 0.28, r * 1.7, r * 0.56);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, -r * 0.28, r * 1.7, r * 0.56);
  }

  // 本体
  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.15, 0, 0, r);
  grad.addColorStop(0, look.color);
  grad.addColorStop(1, look.color2);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (look.shape === 'swarm') {
    // 周囲を回る分体
    ctx.fillStyle = look.color;
    for (let i = 0; i < 3 + tier / 10; i++) {
      const a = time * 3 + (i * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (r + 10), Math.sin(a) * (r + 10), r * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (look.shape === 'crown') {
    ctx.fillStyle = '#ffd24d';
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, -r - 2);
    ctx.lineTo(-r * 0.2, -r - 10);
    ctx.lineTo(0, -r - 3);
    ctx.lineTo(r * 0.2, -r - 11);
    ctx.lineTo(r * 0.4, -r - 2);
    ctx.closePath();
    ctx.fill();
  }

  // 口と目（捕食者らしく）
  ctx.fillStyle = '#0a0a14';
  const eyeR = Math.max(2.5, r * 0.14);
  ctx.beginPath();
  ctx.arc(r * 0.45, -r * 0.3, eyeR, 0, Math.PI * 2);
  ctx.arc(r * 0.45, r * 0.3, eyeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0a0a14';
  ctx.lineWidth = Math.max(2, r * 0.1);
  ctx.beginPath();
  ctx.arc(r * 0.45, 0, r * 0.42, -0.5, 0.5);
  ctx.stroke();

  ctx.restore();
}
