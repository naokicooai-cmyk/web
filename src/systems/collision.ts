import { audio } from '../core/audio';
import { circlesHit } from '../core/vec2';
import type { Bullet } from '../types';
import type { GameState } from '../state';
import { damageEnemy } from '../entities/enemy';
import { damagePlayer } from '../entities/player';
import { damageBot } from '../entities/bot';
import { spawnBurst, spawnRing } from './particles';

const ZONE_TICK = 0.25;

/** 空間ハッシュを再構築し、全衝突ペアを解決する */
export function resolveCollisions(state: GameState, dt: number): void {
  const hash = state.enemyHash;
  hash.clear();
  for (const e of state.enemies) {
    if (e.alive) hash.insert(e);
  }

  const p = state.player;
  const botActive = state.bot.alive && state.bot.respawnTimer <= 0 && state.bot.spawned;

  // ---- 弾 ----
  for (const b of state.bullets) {
    if (!b.alive) continue;
    if (b.fromPlayer) {
      resolvePlayerBullet(state, b);
      // 対ボット（疑似PvP）：直撃系のみ
      if (
        botActive &&
        b.alive &&
        b.kind !== 'zone' &&
        b.kind !== 'mine' &&
        b.hitTimer <= 0 &&
        circlesHit(b.pos, b.radius, state.bot.pos, state.bot.radius)
      ) {
        damageBot(state, b.damage);
        b.hitTimer = 0.3;
        if (b.kind !== 'orbit' && b.kind !== 'rail' && --b.pierce < 0) b.alive = false;
      }
    } else {
      // 敵弾 vs プレイヤー
      if (p.alive && circlesHit(b.pos, b.radius, p.pos, p.radius)) {
        state.lastDamageCause = 'deathByEnemy';
        damagePlayer(state, b.damage);
        b.alive = false;
      }
    }
  }

  // ---- 敵 vs プレイヤー（接触） ----
  if (p.alive) {
    const near = hash.query(p.pos.x, p.pos.y, p.radius + 60);
    for (const e of near) {
      if (!e.alive || !circlesHit(e.pos, e.radius, p.pos, p.radius)) continue;
      state.lastDamageCause = 'deathByEnemy';
      damagePlayer(state, e.damage);
    }
  }

  // ---- 接触ダメージ＆毒オーラ（0.45秒tick） ----
  p.auraTimer -= dt;
  if (p.auraTimer <= 0 && p.alive) {
    p.auraTimer = 0.45;
    const m = p.mods;
    if (m.contactDamage > 0) {
      const near = hash.query(p.pos.x, p.pos.y, p.radius + 30);
      for (const e of near) {
        if (e.alive && circlesHit(e.pos, e.radius, p.pos, p.radius + 6)) {
          damageEnemy(state, e, m.contactDamage * m.damageMul, p.pos.x, p.pos.y, {
            poison: m.poisonOnHit,
          });
        }
      }
    }
    if (m.auraPoison > 0) {
      const r = p.radius + 120;
      const near = hash.query(p.pos.x, p.pos.y, r);
      for (const e of near) {
        if (e.alive && circlesHit(e.pos, e.radius, p.pos, r)) {
          damageEnemy(state, e, m.auraPoison * 0.45, p.pos.x, p.pos.y, {
            poison: m.auraPoison,
            silent: true,
          });
        }
      }
    }
  }
}

function resolvePlayerBullet(state: GameState, b: Bullet): void {
  const hash = state.enemyHash;
  switch (b.kind) {
    case 'zone': {
      if (b.hitTimer > 0) break;
      b.hitTimer = ZONE_TICK;
      const near = hash.query(b.pos.x, b.pos.y, b.radius);
      for (const e of near) {
        if (e.alive && circlesHit(e.pos, e.radius, b.pos, b.radius)) {
          // zone の damage は DPS。tick分に換算して適用
          damageEnemy(state, e, b.damage * ZONE_TICK, b.pos.x, b.pos.y, {
            poison: b.poison,
            silent: true,
          });
        }
      }
      break;
    }
    case 'mine': {
      if (b.armTimer > 0) break;
      const near = hash.query(b.pos.x, b.pos.y, b.radius + 20);
      let triggered = false;
      for (const e of near) {
        if (e.alive && circlesHit(e.pos, e.radius, b.pos, b.radius + 6)) {
          triggered = true;
          break;
        }
      }
      if (triggered) {
        b.alive = false;
        audio.play('explosion');
        state.camera.shake(6);
        spawnRing(state, b.pos.x, b.pos.y, '#ffd24d', b.orbitDist);
        spawnBurst(state, b.pos.x, b.pos.y, '#ffb84d', 12, 240);
        const blast = hash.query(b.pos.x, b.pos.y, b.orbitDist);
        for (const e of blast) {
          if (e.alive && circlesHit(e.pos, e.radius, b.pos, b.orbitDist)) {
            damageEnemy(state, e, b.damage, b.pos.x, b.pos.y, { poison: b.poison });
          }
        }
      }
      break;
    }
    case 'orbit': {
      if (b.hitTimer > 0) break;
      const near = hash.query(b.pos.x, b.pos.y, b.radius);
      for (const e of near) {
        if (e.alive && circlesHit(e.pos, e.radius, b.pos, b.radius)) {
          damageEnemy(state, e, b.damage, b.pos.x, b.pos.y, { poison: b.poison, leech: b.leech });
          b.hitTimer = 0.33;
          break;
        }
      }
      break;
    }
    default: {
      // straight / rail / homing
      if (b.hitTimer > 0) break;
      const near = hash.query(b.pos.x, b.pos.y, b.radius);
      for (const e of near) {
        if (!e.alive || !circlesHit(e.pos, e.radius, b.pos, b.radius)) continue;
        damageEnemy(state, e, b.damage, b.pos.x, b.pos.y, { poison: b.poison, leech: b.leech });
        if (b.kind === 'rail') {
          // 全貫通：当たり続けないよう短い不応期だけ置く
          b.hitTimer = 0.05;
          break;
        }
        if (b.weaponId === 'ricochet') {
          // 敵に当たるとランダム方向へ跳ねる
          const speed = Math.hypot(b.vel.x, b.vel.y);
          const ang = state.rng.range(0, Math.PI * 2);
          b.vel.x = Math.cos(ang) * speed;
          b.vel.y = Math.sin(ang) * speed;
          b.hitTimer = 0.1;
        }
        if (--b.pierce < 0) {
          b.alive = false;
          break;
        }
      }
      break;
    }
  }
}
