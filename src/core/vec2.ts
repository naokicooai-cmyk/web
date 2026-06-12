import type { Vec2 } from '../types';

export function distSq(ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  return dx * dx + dy * dy;
}

/** 円同士の衝突。平方根を取らない */
export function circlesHit(a: Vec2, ra: number, b: Vec2, rb: number): boolean {
  const r = ra + rb;
  return distSq(a.x, a.y, b.x, b.y) < r * r;
}

export function len(x: number, y: number): number {
  return Math.hypot(x, y);
}

/** out に a→b 方向の単位ベクトルを書く。ゼロ距離は (0,0) */
export function dirTo(out: Vec2, ax: number, ay: number, bx: number, by: number): Vec2 {
  const dx = bx - ax;
  const dy = by - ay;
  const d = Math.hypot(dx, dy);
  if (d < 1e-6) {
    out.x = 0;
    out.y = 0;
  } else {
    out.x = dx / d;
    out.y = dy / d;
  }
  return out;
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
