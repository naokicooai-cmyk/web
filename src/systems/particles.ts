import type { GameState } from '../state';

export function spawnBurst(
  state: GameState,
  x: number,
  y: number,
  color: string,
  count: number,
  speed = 160,
  size = 3,
  ttl = 0.45,
): void {
  for (let i = 0; i < count; i++) {
    const p = state.particlePool.obtain();
    const ang = state.rng.range(0, Math.PI * 2);
    const sp = state.rng.range(speed * 0.3, speed);
    p.pos.x = x;
    p.pos.y = y;
    p.vel.x = Math.cos(ang) * sp;
    p.vel.y = Math.sin(ang) * sp;
    p.color = color;
    p.size = size * state.rng.range(0.6, 1.3);
    p.ttl = ttl * state.rng.range(0.6, 1.2);
    p.maxTtl = p.ttl;
    p.kind = 'dot';
    p.alive = true;
    state.particles.push(p);
  }
}

export function spawnRing(state: GameState, x: number, y: number, color: string, size: number): void {
  const p = state.particlePool.obtain();
  p.pos.x = x;
  p.pos.y = y;
  p.vel.x = 0;
  p.vel.y = 0;
  p.color = color;
  p.size = size;
  p.ttl = 0.35;
  p.maxTtl = 0.35;
  p.kind = 'ring';
  p.alive = true;
  state.particles.push(p);
}

/** チェインボルト等の稲妻線 */
export function spawnLine(
  state: GameState,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
): void {
  const p = state.particlePool.obtain();
  p.pos.x = x1;
  p.pos.y = y1;
  p.toX = x2;
  p.toY = y2;
  p.vel.x = 0;
  p.vel.y = 0;
  p.color = color;
  p.size = 2.5;
  p.ttl = 0.16;
  p.maxTtl = 0.16;
  p.kind = 'line';
  p.alive = true;
  state.particles.push(p);
}

export function updateParticles(state: GameState, dt: number): void {
  for (const p of state.particles) {
    p.ttl -= dt;
    if (p.ttl <= 0) {
      p.alive = false;
      continue;
    }
    p.pos.x += p.vel.x * dt;
    p.pos.y += p.vel.y * dt;
    p.vel.x *= 0.92;
    p.vel.y *= 0.92;
  }
}

export function spawnDamageNumber(
  state: GameState,
  x: number,
  y: number,
  value: number,
  crit = false,
  heal = false,
): void {
  // 同時表示は60個まで（視認性とコスト）
  if (state.damageNumbers.length > 60) return;
  state.damageNumbers.push({
    x: x + state.rng.range(-8, 8),
    y: y - 10,
    value: Math.round(value),
    ttl: 0.7,
    crit,
    heal,
    alive: true,
  });
}

export function updateDamageNumbers(state: GameState, dt: number): void {
  for (const d of state.damageNumbers) {
    d.ttl -= dt;
    d.y -= 42 * dt;
    if (d.ttl <= 0) d.alive = false;
  }
  // DamageNumber はプール不使用の軽量オブジェクトなので filter でよい
  if (state.damageNumbers.some((d) => !d.alive)) {
    state.damageNumbers = state.damageNumbers.filter((d) => d.alive);
  }
}
