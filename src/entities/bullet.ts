import type { Bullet, BulletKind, WeaponId } from '../types';
import { WORLD_H, WORLD_W, type GameState } from '../state';

export interface BulletInit {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  kind: BulletKind;
  fromPlayer: boolean;
  damage: number;
  pierce?: number;
  ttl: number;
  radius: number;
  weaponId?: WeaponId | null;
  angle?: number;
  orbitDist?: number;
  rotSpeed?: number; // orbit用：vel.x に格納
  leech?: number;
  armTimer?: number;
  poison?: number;
}

export function spawnBullet(state: GameState, init: BulletInit): Bullet {
  const b = state.bulletPool.obtain();
  b.pos.x = init.x;
  b.pos.y = init.y;
  b.vel.x = init.rotSpeed ?? init.vx ?? 0;
  b.vel.y = init.vy ?? 0;
  b.kind = init.kind;
  b.fromPlayer = init.fromPlayer;
  b.damage = init.damage;
  b.pierce = init.pierce ?? 0;
  b.ttl = init.ttl;
  b.radius = init.radius;
  b.weaponId = init.weaponId ?? null;
  b.hitTimer = 0;
  b.angle = init.angle ?? 0;
  b.orbitDist = init.orbitDist ?? 0;
  b.bounces = 0;
  b.leech = init.leech ?? 0;
  b.armTimer = init.armTimer ?? 0;
  b.poison = init.poison ?? 0;
  b.alive = true;
  state.bullets.push(b);
  return b;
}

export function updateBullets(state: GameState, dt: number): void {
  const p = state.player;
  for (const b of state.bullets) {
    b.ttl -= dt;
    b.hitTimer = Math.max(0, b.hitTimer - dt);
    b.armTimer = Math.max(0, b.armTimer - dt);
    if (b.ttl <= 0) {
      b.alive = false;
      continue;
    }
    switch (b.kind) {
      case 'orbit': {
        // 周回刃：プレイヤー中心を回る。vel.x を回転速度として使う
        b.angle += b.vel.x * dt;
        b.pos.x = p.pos.x + Math.cos(b.angle) * b.orbitDist;
        b.pos.y = p.pos.y + Math.sin(b.angle) * b.orbitDist;
        break;
      }
      case 'zone': {
        // 瘴気領域だけはプレイヤーに追従、ポイズンミストは置き霧
        if (b.weaponId === 'miasma') {
          b.pos.x = p.pos.x;
          b.pos.y = p.pos.y;
        }
        break;
      }
      case 'mine':
        break; // 静止
      case 'homing': {
        // 最寄りの敵へ旋回する
        let bestD = Infinity;
        let tx = 0;
        let ty = 0;
        for (const e of state.enemies) {
          if (!e.alive || e.behavior === 'minion') continue;
          const dx = e.pos.x - b.pos.x;
          const dy = e.pos.y - b.pos.y;
          const d = dx * dx + dy * dy;
          if (d < bestD) {
            bestD = d;
            tx = dx;
            ty = dy;
          }
        }
        if (bestD < Infinity) {
          const d = Math.sqrt(bestD) || 1;
          const speed = Math.hypot(b.vel.x, b.vel.y) || 300;
          const steer = 7 * dt;
          b.vel.x += ((tx / d) * speed - b.vel.x) * steer;
          b.vel.y += ((ty / d) * speed - b.vel.y) * steer;
          const ns = Math.hypot(b.vel.x, b.vel.y) || 1;
          b.vel.x = (b.vel.x / ns) * speed;
          b.vel.y = (b.vel.y / ns) * speed;
        }
        b.pos.x += b.vel.x * dt;
        b.pos.y += b.vel.y * dt;
        break;
      }
      default: {
        b.pos.x += b.vel.x * dt;
        b.pos.y += b.vel.y * dt;
        // リコシェ弾は壁で反射、それ以外は場外で消える
        if (b.weaponId === 'ricochet') {
          if (b.pos.x < 0 || b.pos.x > WORLD_W) b.vel.x *= -1;
          if (b.pos.y < 0 || b.pos.y > WORLD_H) b.vel.y *= -1;
        } else if (
          b.kind !== 'rail' &&
          (b.pos.x < -50 || b.pos.x > WORLD_W + 50 || b.pos.y < -50 || b.pos.y > WORLD_H + 50)
        ) {
          b.alive = false;
        }
        break;
      }
    }
  }
}
