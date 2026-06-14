import { audio } from '../core/audio';
import { circlesHit } from '../core/vec2';
import { WEAPONS } from '../data/weapons';
import type { Enemy, WeaponId, WeaponInstance, WeaponMutator, WeaponMutatorKind } from '../types';
import type { GameState } from '../state';
import { spawnBullet } from '../entities/bullet';
import { damageEnemy } from '../entities/enemy';
import { spawnBurst, spawnLine, spawnRing } from '../systems/particles';
import { weaponMutatorsFor } from '../systems/profile';

function mutSum(w: WeaponInstance, kind: WeaponMutatorKind): number {
  let v = 0;
  for (const x of w.mutators) if (x.kind === kind) v += x.value;
  return v;
}
function mutHas(w: WeaponInstance, kind: WeaponMutatorKind): boolean {
  return w.mutators.some((x) => x.kind === kind);
}

/** Skill Gene の triggerOnKill を RunEffects に登録する（武器追加時に呼ぶ） */
function registerWeaponTriggers(state: GameState, mutators: WeaponMutator[]): void {
  for (const mut of mutators) {
    if (mut.kind !== 'triggerOnKill') continue;
    const dmg = mut.value;
    state.effects.onKill.push((s, e) => {
      spawnRing(s, e.pos.x, e.pos.y, '#ffcf6a', 64);
      for (const o of s.enemies) {
        if (o.alive && o !== e && circlesHit(o.pos, o.radius, e.pos, 64)) {
          damageEnemy(s, o, dmg, e.pos.x, e.pos.y, { tag: 'mine' });
        }
      }
    });
  }
}

export function addWeapon(state: GameState, id: WeaponId): void {
  const mutators = weaponMutatorsFor(state.profile, id);
  state.player.weapons.push({ defId: id, level: 1, timer: 0.2, angle: 0, mutators });
  registerWeaponTriggers(state, mutators);
}

/** ベース武器を超進化武器へ置換する（変異は引き継ぐ） */
export function superEvolve(state: GameState, baseId: WeaponId, superId: WeaponId): void {
  const w = state.player.weapons.find((x) => x.defId === baseId);
  if (!w) return;
  // 既存の周回刃・霧などは消す（新形態が張り直す）
  for (const b of state.bullets) {
    if (b.weaponId === baseId) b.alive = false;
  }
  w.defId = superId;
  w.level = 1;
  w.timer = 0;
}

export function nearestEnemy(state: GameState, x: number, y: number, maxDist: number): Enemy | null {
  let best: Enemy | null = null;
  let bestD = maxDist * maxDist;
  for (const e of state.enemies) {
    if (!e.alive) continue;
    const dx = e.pos.x - x;
    const dy = e.pos.y - y;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  return best;
}

/** 射程内で最大HPの敵（多眼照準など targetMaxHp 用） */
function strongestEnemy(state: GameState, x: number, y: number, maxDist: number): Enemy | null {
  let best: Enemy | null = null;
  let bestHp = -1;
  const r2 = maxDist * maxDist;
  for (const e of state.enemies) {
    if (!e.alive) continue;
    const dx = e.pos.x - x;
    const dy = e.pos.y - y;
    if (dx * dx + dy * dy > r2) continue;
    if (e.hp > bestHp) {
      bestHp = e.hp;
      best = e;
    }
  }
  return best;
}

function pickTarget(state: GameState, w: WeaponInstance, range: number): Enemy | null {
  const p = state.player;
  const r = range * p.mods.targetRangeMul;
  return mutHas(w, 'targetMaxHp')
    ? strongestEnemy(state, p.pos.x, p.pos.y, r)
    : nearestEnemy(state, p.pos.x, p.pos.y, r);
}

function aliveBulletsOf(state: GameState, id: WeaponId): number {
  let n = 0;
  for (const b of state.bullets) {
    if (b.alive && b.weaponId === id) n++;
  }
  return n;
}

export function updateWeapons(state: GameState, dt: number): void {
  const p = state.player;
  const m = p.mods;
  for (const w of p.weapons) {
    const def = WEAPONS[w.defId];
    const s = def.stats(w.level);
    const damage = s.damage * m.damageMul;
    const cooldown = Math.max(0.1, s.cooldown * m.cooldownMul);
    const area = s.area * m.areaMul;
    const poison = Math.max(m.poisonOnHit, mutSum(w, 'convertPoison'));
    const extraCount = mutSum(w, 'addProjectile');
    const extraPierce = mutSum(w, 'addPierce');
    w.timer -= dt;

    switch (w.defId) {
      case 'orbit':
      case 'guillotine': {
        // 常時展開：欠けた刃を補充し続け、常に count 枚が回り続ける
        const count = s.count + extraCount;
        const have = aliveBulletsOf(state, w.defId);
        const dist = p.radius + 30 + area;
        for (let i = have; i < count; i++) {
          spawnBullet(state, {
            x: p.pos.x,
            y: p.pos.y,
            kind: 'orbit',
            fromPlayer: true,
            damage,
            pierce: 999,
            ttl: 9999,
            radius: area,
            weaponId: w.defId,
            angle: (i / count) * Math.PI * 2,
            orbitDist: dist,
            rotSpeed: s.speed,
            poison,
          });
        }
        break;
      }
      case 'spine':
      case 'leech': {
        if (w.timer > 0) break;
        const target = pickTarget(state, w, 560);
        if (!target) break;
        w.timer = cooldown;
        const count = s.count + m.extraProjectiles + extraCount;
        const baseAng = Math.atan2(target.pos.y - p.pos.y, target.pos.x - p.pos.x);
        for (let i = 0; i < count; i++) {
          const spread = (i - (count - 1) / 2) * 0.16;
          spawnBullet(state, {
            x: p.pos.x,
            y: p.pos.y,
            vx: Math.cos(baseAng + spread) * s.speed,
            vy: Math.sin(baseAng + spread) * s.speed,
            kind: 'straight',
            fromPlayer: true,
            damage,
            pierce: s.pierce + extraPierce,
            ttl: s.ttl,
            radius: area,
            weaponId: w.defId,
            leech: w.defId === 'leech' ? 0.35 : 0,
            poison,
          });
        }
        audio.play('shoot');
        break;
      }
      case 'railspine': {
        if (w.timer > 0) break;
        const target = pickTarget(state, w, 900);
        if (!target) break;
        w.timer = cooldown;
        const ang = Math.atan2(target.pos.y - p.pos.y, target.pos.x - p.pos.x);
        spawnBullet(state, {
          x: p.pos.x,
          y: p.pos.y,
          vx: Math.cos(ang) * s.speed,
          vy: Math.sin(ang) * s.speed,
          kind: 'rail',
          fromPlayer: true,
          damage,
          pierce: 999,
          ttl: s.ttl,
          radius: area,
          weaponId: 'railspine',
          angle: ang,
          poison,
        });
        audio.play('shoot');
        state.camera.shake(3);
        break;
      }
      case 'mist': {
        if (w.timer > 0) break;
        w.timer = cooldown;
        spawnBullet(state, {
          x: p.pos.x,
          y: p.pos.y,
          kind: 'zone',
          fromPlayer: true,
          damage, // zoneはDPS扱い（collisionで0.25秒tick）
          pierce: 999,
          ttl: s.ttl,
          radius: area,
          weaponId: 'mist',
          poison,
        });
        break;
      }
      case 'miasma': {
        if (aliveBulletsOf(state, 'miasma') > 0) break;
        spawnBullet(state, {
          x: p.pos.x,
          y: p.pos.y,
          kind: 'zone',
          fromPlayer: true,
          damage,
          pierce: 999,
          ttl: 9999,
          radius: area,
          weaponId: 'miasma',
          poison: Math.max(4, poison),
        });
        break;
      }
      case 'chain': {
        if (w.timer > 0) break;
        const first = nearestEnemy(state, p.pos.x, p.pos.y, area * m.targetRangeMul);
        if (!first) break;
        w.timer = cooldown;
        audio.play('shoot');
        // 敵から敵へ連鎖する雷（即時ヒットスキャン）
        const jumps = s.count + mutSum(w, 'addChain');
        const hit: Enemy[] = [first];
        let from: { x: number; y: number } = p.pos;
        let current: Enemy | null = first;
        for (let jump = 0; jump < jumps && current; jump++) {
          spawnLine(state, from.x, from.y, current.pos.x, current.pos.y, '#9ae8ff');
          spawnBurst(state, current.pos.x, current.pos.y, '#9ae8ff', 4, 120, 2, 0.2);
          damageEnemy(state, current, damage, from.x, from.y, { poison, tag: 'chain' });
          from = current.pos;
          let next: Enemy | null = null;
          let bestD = 200 * 200;
          for (const e of state.enemies) {
            if (!e.alive || hit.includes(e)) continue;
            const dx = e.pos.x - from.x;
            const dy = e.pos.y - from.y;
            const d = dx * dx + dy * dy;
            if (d < bestD) {
              bestD = d;
              next = e;
            }
          }
          if (next) hit.push(next);
          current = next;
        }
        break;
      }
      case 'ricochet': {
        if (w.timer > 0) break;
        w.timer = cooldown;
        const count = s.count + m.extraProjectiles + extraCount;
        for (let i = 0; i < count; i++) {
          const ang = state.rng.range(0, Math.PI * 2);
          spawnBullet(state, {
            x: p.pos.x,
            y: p.pos.y,
            vx: Math.cos(ang) * s.speed,
            vy: Math.sin(ang) * s.speed,
            kind: 'straight',
            fromPlayer: true,
            damage,
            pierce: s.pierce + extraPierce,
            ttl: s.ttl,
            radius: area,
            weaponId: 'ricochet',
            poison,
          });
        }
        audio.play('shoot');
        break;
      }
      case 'mine': {
        if (w.timer > 0) break;
        w.timer = cooldown;
        const count = s.count + extraCount;
        for (let i = 0; i < count; i++) {
          spawnBullet(state, {
            x: p.pos.x + state.rng.range(-20, 20),
            y: p.pos.y + state.rng.range(-20, 20),
            kind: 'mine',
            fromPlayer: true,
            damage,
            pierce: 999,
            ttl: s.ttl,
            radius: 9,
            weaponId: 'mine',
            armTimer: 0.5,
            orbitDist: area, // 爆発半径として使う
            poison,
          });
        }
        break;
      }
    }
  }

  // ヘルストーム固有：全方位弾
  if (m.radialShots > 0) {
    p.radialTimer -= dt;
    if (p.radialTimer <= 0) {
      p.radialTimer = 2.4 * m.cooldownMul;
      audio.play('shoot');
      for (let i = 0; i < m.radialShots; i++) {
        const ang = (i / m.radialShots) * Math.PI * 2 + state.time;
        spawnBullet(state, {
          x: p.pos.x,
          y: p.pos.y,
          vx: Math.cos(ang) * 360,
          vy: Math.sin(ang) * 360,
          kind: 'straight',
          fromPlayer: true,
          damage: 16 * m.damageMul,
          pierce: 1,
          ttl: 1.4,
          radius: 7,
          weaponId: null,
          poison: m.poisonOnHit,
        });
      }
    }
  }
}

/** Lvアップ時に既存の周回刃を張り直す（半径・威力が変わるため） */
export function refreshOrbitals(state: GameState, weaponId: WeaponId): void {
  for (const b of state.bullets) {
    if (b.weaponId === weaponId && b.kind === 'orbit') b.alive = false;
  }
  const w = state.player.weapons.find((x) => x.defId === weaponId);
  if (w) w.timer = 0;
}
