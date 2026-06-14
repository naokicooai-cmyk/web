import { audio } from '../core/audio';
import { circlesHit, distSq } from '../core/vec2';
import type { GameState } from '../state';
import { gainXp } from './player';
import { spawnBurst } from '../systems/particles';

const GEM_CAP = 380;
const MAGNET_SPEED = 620;

export function spawnGem(state: GameState, x: number, y: number, value: number): void {
  // 上限超過時は新規生成せず、既存ジェムに価値を吸わせる（VS式マージ）
  if (state.gems.length >= GEM_CAP) {
    const g = state.gems[state.rng.int(0, state.gems.length - 1)];
    g.value += value;
    return;
  }
  const g = state.gemPool.obtain();
  g.pos.x = x + state.rng.range(-10, 10);
  g.pos.y = y + state.rng.range(-10, 10);
  g.vel.x = state.rng.range(-60, 60);
  g.vel.y = state.rng.range(-60, 60);
  g.value = value;
  g.radius = 6;
  g.magnet = 0;
  g.ttl = 70;
  g.alive = true;
  state.gems.push(g);
}

/** プレイヤー撃破級のXP爆散（ジャックポット） */
export function burstGems(state: GameState, x: number, y: number, totalValue: number): void {
  let remain = Math.round(totalValue);
  while (remain > 0) {
    const v = Math.min(remain, Math.max(2, Math.round(totalValue / 24)));
    remain -= v;
    const ang = state.rng.range(0, Math.PI * 2);
    const dist = state.rng.range(10, 130);
    spawnGem(state, x + Math.cos(ang) * dist, y + Math.sin(ang) * dist, v);
  }
}

export function updateGems(state: GameState, dt: number): void {
  const p = state.player;
  const bot = state.bot;
  const botActive = bot.alive && bot.respawnTimer <= 0;
  for (const g of state.gems) {
    g.ttl -= dt;
    if (g.ttl <= 0) {
      g.alive = false;
      continue;
    }
    // 磁石判定（プレイヤー優先、ボットも喰い合いに参加する）
    if (g.magnet === 0) {
      if (
        !p.mods.noGemPickup &&
        p.alive &&
        distSq(g.pos.x, g.pos.y, p.pos.x, p.pos.y) < p.pickupRange * p.pickupRange
      ) {
        g.magnet = 1;
      } else if (botActive && distSq(g.pos.x, g.pos.y, bot.pos.x, bot.pos.y) < 70 * 70) {
        g.magnet = 2;
      }
    }
    if (g.magnet === 1 && p.alive) {
      const dx = p.pos.x - g.pos.x;
      const dy = p.pos.y - g.pos.y;
      const d = Math.hypot(dx, dy) || 1;
      g.vel.x = (dx / d) * MAGNET_SPEED;
      g.vel.y = (dy / d) * MAGNET_SPEED;
    } else if (g.magnet === 2 && botActive) {
      const dx = bot.pos.x - g.pos.x;
      const dy = bot.pos.y - g.pos.y;
      const d = Math.hypot(dx, dy) || 1;
      g.vel.x = (dx / d) * MAGNET_SPEED * 0.8;
      g.vel.y = (dy / d) * MAGNET_SPEED * 0.8;
    } else {
      g.vel.x *= 0.9;
      g.vel.y *= 0.9;
    }
    g.pos.x += g.vel.x * dt;
    g.pos.y += g.vel.y * dt;

    // 吸収（逆流する胃袋の間はプレイヤーは拾わない）
    if (!p.mods.noGemPickup && p.alive && circlesHit(g.pos, g.radius, p.pos, p.radius + 4)) {
      g.alive = false;
      gainXp(state, g.value);
      audio.play('gem');
      spawnBurst(state, g.pos.x, g.pos.y, '#7df9ff', 3, 80, 2, 0.25);
    } else if (botActive && circlesHit(g.pos, g.radius, bot.pos, bot.radius + 4)) {
      g.alive = false;
      bot.xp += g.value;
    }
  }
}

/** 全ジェム吸引（マグネットアイテム） */
export function magnetAllGems(state: GameState): void {
  for (const g of state.gems) g.magnet = 1;
}
