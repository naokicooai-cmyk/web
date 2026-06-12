import { audio } from '../core/audio';
import { clamp } from '../core/vec2';
import { CLASSES } from '../data/classes';
import { PASSIVES } from '../data/passives';
import type { ClassId, PassiveId, PlayerState, StatMods } from '../types';
import { WORLD_H, WORLD_W, type GameState } from '../state';

export function defaultMods(): StatMods {
  return {
    damageMul: 1,
    cooldownMul: 1,
    speedMul: 1,
    maxHpMul: 1,
    areaMul: 1,
    pickupMul: 1,
    armor: 0,
    shrinkMul: 1,
    contactDamage: 0,
    poisonOnHit: 0,
    critChance: 0,
    extraProjectiles: 0,
    radialShots: 0,
    minionCount: 0,
    lifesteal: 0,
    auraPoison: 0,
  };
}

export const BASE_HP = 100;
const BASE_SPEED = 235;
const BASE_RADIUS = 16;
const BASE_PICKUP = 75;

export function xpNextFor(level: number): number {
  return Math.floor(6 + (level - 1) * 4 + Math.pow(level - 1, 1.7));
}

export function createPlayer(): PlayerState {
  const p: PlayerState = {
    pos: { x: WORLD_W / 2, y: WORLD_H / 2 },
    vel: { x: 0, y: 0 },
    radius: BASE_RADIUS,
    alive: true,
    hp: BASE_HP,
    maxHp: BASE_HP,
    level: 1,
    xp: 0,
    xpNext: xpNextFor(1),
    mass: 0,
    baseRadius: BASE_RADIUS,
    baseSpeed: BASE_SPEED,
    pickupRange: BASE_PICKUP,
    weapons: [],
    passives: {},
    classId: 'protoform',
    skillTimer: 0,
    skillCooldown: CLASSES.protoform.skillCooldown,
    dashTimer: 0,
    invuln: 0,
    hurtFlash: 0,
    facing: { x: 1, y: 0 },
    mods: defaultMods(),
    auraTimer: 0,
    radialTimer: 0,
    score: 0,
    kills: 0,
  };
  return p;
}

/** クラス＋パッシブから補正を再集計し、派生ステータスへ反映する */
export function recomputeMods(p: PlayerState): void {
  const prevMaxHp = p.maxHp;
  const m = defaultMods();
  CLASSES[p.classId].apply(m);
  for (const [id, level] of Object.entries(p.passives) as [PassiveId, number][]) {
    PASSIVES[id].apply(m, level);
  }
  p.mods = m;
  p.maxHp = Math.round(BASE_HP * m.maxHpMul * (1 + (p.level - 1) * 0.03));
  if (p.maxHp !== prevMaxHp && prevMaxHp > 0) {
    p.hp = clamp((p.hp / prevMaxHp) * p.maxHp, 1, p.maxHp);
  }
  p.pickupRange = BASE_PICKUP * m.pickupMul;
  p.skillCooldown = CLASSES[p.classId].skillCooldown;
  updateBodySize(p);
}

/** mass → 体格。デカいほど強そうに見え、わずかに鈍る（Agar要素） */
export function updateBodySize(p: PlayerState): void {
  p.radius = clamp(p.baseRadius * (1 + Math.sqrt(p.mass) * 0.045) * p.mods.shrinkMul, 10, 64);
}

export function playerSpeed(p: PlayerState): number {
  const sizePenalty = 1 - clamp((p.radius - BASE_RADIUS) / 170, 0, 0.25);
  const dashBoost = p.dashTimer > 0 ? 2.2 : 1;
  return p.baseSpeed * p.mods.speedMul * sizePenalty * dashBoost;
}

/** XP加算。レベルアップ分のドラフト/進化を state のキューに積む */
export function gainXp(state: GameState, amount: number): void {
  const p = state.player;
  p.xp += amount;
  p.mass += amount * 0.6;
  p.score += Math.round(amount * 5);
  updateBodySize(p);
  while (p.xp >= p.xpNext) {
    p.xp -= p.xpNext;
    p.level++;
    p.xpNext = xpNextFor(p.level);
    p.maxHp = Math.round(p.maxHp * 1.02 + 2);
    p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.1); // レベルアップで少し回復
    if (p.level === 10 || p.level === 20 || p.level === 30) {
      state.pendingEvolution = true;
    } else {
      state.pendingDrafts++;
    }
    audio.play('levelup');
  }
}

export function evolveTo(state: GameState, classId: ClassId): void {
  const p = state.player;
  p.classId = classId;
  p.skillTimer = 0;
  recomputeMods(p);
  p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.35); // 進化のご褒美回復
  audio.play('evolve');
}

/** 被ダメージ処理。死亡したら true */
export function damagePlayer(state: GameState, raw: number): boolean {
  const p = state.player;
  if (!p.alive || p.invuln > 0) return false;
  const dmg = Math.max(1, raw - p.mods.armor);
  p.hp -= dmg;
  p.invuln = 0.45;
  p.hurtFlash = 0.25;
  state.camera.shake(Math.min(14, 4 + dmg * 0.35));
  state.hitStop = Math.max(state.hitStop, 0.05);
  audio.play('hurt');
  if (p.hp <= 0) {
    p.hp = 0;
    p.alive = false;
    audio.play('death');
    return true;
  }
  return false;
}

export function healPlayer(p: PlayerState, amount: number): void {
  p.hp = clamp(p.hp + amount, 0, p.maxHp);
}

/** 入力 → 移動。マウス追従が基本、WASD優先 */
export function updatePlayerMovement(state: GameState, dt: number): void {
  const p = state.player;
  const input = state.input;
  const speed = playerSpeed(p);

  const wasd = input.wasdDir();
  let dirX = 0;
  let dirY = 0;
  if (wasd) {
    dirX = wasd.x;
    dirY = wasd.y;
  } else {
    const wx = state.camera.toWorldX(input.mouseX);
    const wy = state.camera.toWorldY(input.mouseY);
    const dx = wx - p.pos.x;
    const dy = wy - p.pos.y;
    const dist = Math.hypot(dx, dy);
    // カーソル直下では停止できる（デッドゾーン）
    if (dist > 14) {
      const ease = Math.min(1, (dist - 14) / 60);
      dirX = (dx / dist) * ease;
      dirY = (dy / dist) * ease;
    }
  }

  p.vel.x = dirX * speed;
  p.vel.y = dirY * speed;
  p.pos.x = clamp(p.pos.x + p.vel.x * dt, p.radius, WORLD_W - p.radius);
  p.pos.y = clamp(p.pos.y + p.vel.y * dt, p.radius, WORLD_H - p.radius);

  if (Math.hypot(p.vel.x, p.vel.y) > 10) {
    const d = Math.hypot(p.vel.x, p.vel.y);
    p.facing.x = p.vel.x / d;
    p.facing.y = p.vel.y / d;
  }

  p.invuln = Math.max(0, p.invuln - dt);
  p.hurtFlash = Math.max(0, p.hurtFlash - dt);
  p.dashTimer = Math.max(0, p.dashTimer - dt);
  p.skillTimer = Math.max(0, p.skillTimer - dt);
}
