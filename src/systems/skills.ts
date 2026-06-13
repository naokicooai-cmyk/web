import { audio } from '../core/audio';
import { CLASSES } from '../data/classes';
import type { GameState } from '../state';
import { spawnBullet } from '../entities/bullet';
import { damageEnemy, killEnemy } from '../entities/enemy';
import { gainXp, healPlayer } from '../entities/player';
import { spawnBurst, spawnRing } from './particles';

/** アクティブスキル発動（CT中なら何もしない） */
export function tryActiveSkill(state: GameState): void {
  const p = state.player;
  if (!p.alive || p.skillTimer > 0) return;
  const cls = CLASSES[p.classId];
  p.skillTimer = p.skillCooldown * p.mods.cooldownMul;

  switch (cls.skill) {
    case 'dash': {
      p.dashTimer = 0.8;
      spawnBurst(state, p.pos.x, p.pos.y, '#7df9ff', 10, 200, 3, 0.3);
      audio.play('select');
      break;
    }
    case 'devour': {
      // 前方の敵を吸い込んで即吸収。瀕死の敵は丸呑み（即死＋XP）
      const range = 240 + p.radius;
      const cosLimit = Math.cos(0.95);
      audio.play('devour');
      state.camera.shake(8);
      state.hitStop = Math.max(state.hitStop, 0.07);
      spawnRing(state, p.pos.x + p.facing.x * 60, p.pos.y + p.facing.y * 60, '#ff8c5a', 90);
      for (const e of state.enemies) {
        if (!e.alive) continue;
        const dx = e.pos.x - p.pos.x;
        const dy = e.pos.y - p.pos.y;
        const d = Math.hypot(dx, dy);
        if (d > range || d < 1) continue;
        const dot = (dx / d) * p.facing.x + (dy / d) * p.facing.y;
        if (dot < cosLimit) continue;
        const dmg = (45 + p.level * 2) * p.mods.damageMul;
        if (e.hp - dmg < e.maxHp * 0.3 && e.type !== 'colossus' && e.type !== 'worm_head') {
          // 丸呑み：ジェムを介さず直接吸収
          gainXp(state, e.xpValue);
          p.kills++;
          p.score += e.scoreValue;
          healPlayer(p, 2);
          killEnemy(state, e, false);
          spawnBurst(state, e.pos.x, e.pos.y, '#ff8c5a', 6, 220);
        } else {
          damageEnemy(state, e, dmg, p.pos.x, p.pos.y, { poison: p.mods.poisonOnHit });
          // 吸引
          e.pos.x -= dx * 0.45;
          e.pos.y -= dy * 0.45;
        }
      }
      break;
    }
    case 'aimcannon': {
      // 手動エイム：カーソル方向への貫通砲
      const wx = state.camera.toWorldX(state.input.mouseX);
      const wy = state.camera.toWorldY(state.input.mouseY);
      const ang = Math.atan2(wy - p.pos.y, wx - p.pos.x);
      spawnBullet(state, {
        x: p.pos.x,
        y: p.pos.y,
        vx: Math.cos(ang) * 1500,
        vy: Math.sin(ang) * 1500,
        kind: 'rail',
        fromPlayer: true,
        damage: (75 + p.level * 3) * p.mods.damageMul,
        pierce: 999,
        ttl: 0.95,
        radius: 24, // 大きな貫通弾。全敵を貫く
        weaponId: null,
        angle: ang,
        poison: p.mods.poisonOnHit,
      });
      audio.play('shoot');
      state.camera.shake(7);
      spawnBurst(state, p.pos.x + Math.cos(ang) * 30, p.pos.y + Math.sin(ang) * 30, '#7d9bff', 8, 250);
      break;
    }
    case 'swarmburst': {
      // 追尾ミニオン弾の一斉放出
      const n = 8 + p.mods.minionCount;
      audio.play('shoot');
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2;
        spawnBullet(state, {
          x: p.pos.x,
          y: p.pos.y,
          vx: Math.cos(ang) * 340,
          vy: Math.sin(ang) * 340,
          kind: 'homing',
          fromPlayer: true,
          damage: (22 + p.level * 1.5) * p.mods.damageMul,
          pierce: 1,
          ttl: 2.6,
          radius: 7,
          weaponId: null,
          poison: p.mods.poisonOnHit,
        });
      }
      break;
    }
  }
}
