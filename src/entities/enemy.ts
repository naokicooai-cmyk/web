import { audio } from '../core/audio';
import { circlesHit, clamp, dirTo } from '../core/vec2';
import { ENEMIES, WORM_SEGMENTS } from '../data/enemies';
import type { Enemy, EnemyTypeId } from '../types';
import { WORLD_H, WORLD_W, type GameState } from '../state';
import { enemyDamageScale, enemyHpScale } from '../data/waves';
import { spawnGem } from './gem';
import { spawnBullet } from './bullet';
import { damagePlayer, healPlayer } from './player';
import { spawnBurst, spawnDamageNumber, spawnRing } from '../systems/particles';
import { spawnPickup } from './pickup';
import { generateRelic, rollRarity } from '../data/relics';
import { nextRelicSeq } from '../systems/profile';

const tmpDir = { x: 0, y: 0 };

/** 指定座標に遺物ピックアップを落とす（luck が高いほど高レア） */
function dropRelic(state: GameState, x: number, y: number, luck: number): void {
  const rarity = rollRarity(state.rng, luck);
  const relic = generateRelic(state.rng, rarity, nextRelicSeq(state.profile));
  spawnPickup(state, x + state.rng.range(-12, 12), y + state.rng.range(-12, 12), 'relic', relic);
}

export function spawnEnemy(state: GameState, type: EnemyTypeId, x: number, y: number): Enemy {
  const def = ENEMIES[type];
  const e = state.enemyPool.obtain();
  const hpMul = type === 'minion' ? 1 : enemyHpScale(state.time) * state.diffHpMul;
  const dmgMul = type === 'minion' ? 1 : enemyDamageScale(state.time) * state.diffDmgMul;
  e.pos.x = clamp(x, 20, WORLD_W - 20);
  e.pos.y = clamp(y, 20, WORLD_H - 20);
  e.vel.x = 0;
  e.vel.y = 0;
  e.type = type;
  e.hp = Math.round(def.hp * hpMul);
  e.maxHp = e.hp;
  e.damage = Math.round(def.damage * dmgMul);
  e.speed = def.speed;
  e.radius = def.radius;
  e.xpValue = def.xp;
  e.scoreValue = def.score;
  e.behavior = def.behavior;
  e.stateTimer = 0;
  e.state = 0;
  e.facing.x = 1;
  e.facing.y = 0;
  e.flash = 0;
  e.poison = 0;
  e.poisonTtl = 0;
  e.poisonAccum = 0;
  e.poisonNumTimer = 0;
  e.segIndex = 0;
  e.spriteScale = 0.15; // ぽんっと膨らんで出現する
  e.alive = true;
  if (type === 'minion') {
    state.minions.push(e);
  } else {
    state.enemies.push(e);
  }
  return e;
}

/** マザーワーム：head + 節を連結して生成 */
export function spawnMotherWorm(state: GameState, x: number, y: number): void {
  state.wormChain = [];
  const head = spawnEnemy(state, 'worm_head', x, y);
  head.segIndex = 0;
  state.wormChain.push(head);
  for (let i = 1; i <= WORM_SEGMENTS; i++) {
    const seg = spawnEnemy(state, 'worm_body', x - i * 40, y);
    seg.segIndex = i;
    state.wormChain.push(seg);
  }
}

export interface DamageOpts {
  crit?: boolean;
  poison?: number;
  leech?: number;
  silent?: boolean;
}

/**
 * 敵への与ダメージ。シールド甲虫の正面判定のため攻撃元座標を渡す。
 * 死亡したら true。
 */
export function damageEnemy(
  state: GameState,
  e: Enemy,
  rawDamage: number,
  srcX: number,
  srcY: number,
  opts: DamageOpts = {},
): boolean {
  if (!e.alive) return false;
  let dmg = rawDamage;
  const crit = opts.crit ?? state.rng.chance(state.player.mods.critChance);
  if (crit) dmg *= 2.2;
  // シールド甲虫：正面からの攻撃をほぼ無効化（背後を取らせる教育役）
  if (e.behavior === 'shield') {
    dirTo(tmpDir, e.pos.x, e.pos.y, srcX, srcY);
    const dot = tmpDir.x * e.facing.x + tmpDir.y * e.facing.y;
    if (dot > 0.25) dmg *= 0.12;
  }
  dmg = Math.max(1, Math.round(dmg));
  e.hp -= dmg;
  e.flash = 0.12;
  if (!opts.silent) {
    spawnDamageNumber(state, e.pos.x, e.pos.y - e.radius, dmg, crit);
    audio.play('hit');
  }
  if (opts.poison && opts.poison > 0) {
    e.poison = Math.max(e.poison, opts.poison);
    e.poisonTtl = 3;
  }
  if (opts.leech && opts.leech > 0) {
    healPlayer(state.player, dmg * opts.leech);
  }
  if (e.hp <= 0) {
    killEnemy(state, e);
    return true;
  }
  return false;
}

export function killEnemy(state: GameState, e: Enemy, withDrops = true): void {
  if (!e.alive) return;
  e.alive = false;
  const def = ENEMIES[e.type];
  spawnBurst(state, e.pos.x, e.pos.y, def.color, Math.min(14, 4 + Math.floor(e.radius / 4)), 180);
  audio.play('kill');

  if (!withDrops) return;
  state.player.kills++;
  state.player.score += e.scoreValue;
  // ライフスティール（寄生系）
  if (state.player.mods.lifesteal > 0) {
    healPlayer(state.player, e.maxHp * state.player.mods.lifesteal * 0.1 + 1);
  }
  // ジェムドロップ（大物は複数に分割）
  if (e.xpValue > 0) {
    const pieces = e.xpValue > 6 ? Math.min(6, Math.ceil(e.xpValue / 5)) : 1;
    const per = Math.max(1, Math.round(e.xpValue / pieces));
    for (let i = 0; i < pieces; i++) spawnGem(state, e.pos.x, e.pos.y, per);
  }
  // ハクスラ：通常敵もごく低確率で遺物を落とす
  if (e.type !== 'worm_body' && state.rng.chance(0.006 * (1 + state.diffLuck))) {
    dropRelic(state, e.pos.x, e.pos.y, 0.2 + state.diffLuck);
  }
  switch (e.type) {
    case 'ameba':
      // 分裂アメーバ：倒すと2体に
      for (let i = 0; i < 2; i++) {
        spawnEnemy(state, 'ameba_small', e.pos.x + state.rng.range(-15, 15), e.pos.y + state.rng.range(-15, 15));
      }
      break;
    case 'elite':
      spawnPickup(state, e.pos.x, e.pos.y, 'chest');
      if (state.rng.chance(0.55)) dropRelic(state, e.pos.x, e.pos.y, 0.5 + state.diffLuck);
      state.hitStop = Math.max(state.hitStop, 0.12);
      state.camera.shake(10);
      break;
    case 'worm_head':
      state.hitStop = Math.max(state.hitStop, 0.18);
      state.camera.shake(20);
      audio.play('explosion');
      spawnRing(state, e.pos.x, e.pos.y, '#ff5470', 120);
      // 頭を落とせば残りの節も死ぬ（ご褒美のジェム雨）
      for (const seg of state.wormChain) {
        if (seg !== e && seg.alive) {
          spawnGem(state, seg.pos.x, seg.pos.y, seg.xpValue);
          killEnemy(state, seg, false);
        }
      }
      state.wormChain = [];
      // ボス確定ドロップ
      dropRelic(state, e.pos.x, e.pos.y, 1.2 + state.diffLuck);
      break;
    case 'colossus':
      state.hitStop = Math.max(state.hitStop, 0.25);
      state.camera.shake(28);
      audio.play('explosion');
      spawnRing(state, e.pos.x, e.pos.y, '#c47dff', 200);
      spawnBurst(state, e.pos.x, e.pos.y, '#c47dff', 40, 350, 5, 0.9);
      // 最終ボス：高レア確定で複数ドロップ
      dropRelic(state, e.pos.x, e.pos.y, 2.0 + state.diffLuck);
      dropRelic(state, e.pos.x, e.pos.y, 1.5 + state.diffLuck);
      break;
    default:
      break;
  }
}

function moveToward(e: Enemy, tx: number, ty: number, speed: number, dt: number): void {
  dirTo(tmpDir, e.pos.x, e.pos.y, tx, ty);
  e.vel.x = tmpDir.x * speed;
  e.vel.y = tmpDir.y * speed;
  e.pos.x += e.vel.x * dt;
  e.pos.y += e.vel.y * dt;
  if (tmpDir.x !== 0 || tmpDir.y !== 0) {
    e.facing.x = tmpDir.x;
    e.facing.y = tmpDir.y;
  }
}

export function updateEnemies(state: GameState, dt: number): void {
  const p = state.player;
  for (const e of state.enemies) {
    if (!e.alive) continue;
    e.flash = Math.max(0, e.flash - dt);

    // 出現スケールイン（自爆の膨張中は除く）
    if (e.spriteScale < 1 && !(e.behavior === 'explode' && e.state === 1)) {
      e.spriteScale = Math.min(1, e.spriteScale + dt * 5);
    }

    // 毒DoT：削りつつ、溜まった毒ダメージを0.5秒ごとに数字表示
    if (e.poisonTtl > 0) {
      e.poisonTtl -= dt;
      const tick = e.poison * dt;
      e.hp -= tick;
      e.poisonAccum += tick;
      e.flash = Math.max(e.flash, 0.06); // 毒の脈動フラッシュ
      e.poisonNumTimer -= dt;
      if (e.poisonNumTimer <= 0 && e.poisonAccum >= 1) {
        spawnDamageNumber(state, e.pos.x, e.pos.y - e.radius, e.poisonAccum, false, false, true);
        e.poisonAccum = 0;
        e.poisonNumTimer = 0.5;
      }
      if (e.hp <= 0) {
        if (e.poisonAccum >= 1) {
          spawnDamageNumber(state, e.pos.x, e.pos.y - e.radius, e.poisonAccum, false, false, true);
        }
        killEnemy(state, e);
        continue;
      }
    }

    switch (e.behavior) {
      case 'chase':
      case 'split':
        moveToward(e, p.pos.x, p.pos.y, e.speed, dt);
        break;
      case 'shield':
        moveToward(e, p.pos.x, p.pos.y, e.speed, dt);
        break;
      case 'dash': {
        // 接近 → 溜め → 4倍速突進
        e.stateTimer -= dt;
        if (e.state === 0) {
          moveToward(e, p.pos.x, p.pos.y, e.speed, dt);
          const dx = p.pos.x - e.pos.x;
          const dy = p.pos.y - e.pos.y;
          if (dx * dx + dy * dy < 240 * 240) {
            e.state = 1;
            e.stateTimer = 0.55;
            dirTo(tmpDir, e.pos.x, e.pos.y, p.pos.x, p.pos.y);
            e.facing.x = tmpDir.x;
            e.facing.y = tmpDir.y;
          }
        } else if (e.state === 1) {
          if (e.stateTimer <= 0) {
            e.state = 2;
            e.stateTimer = 0.5;
          }
        } else {
          e.pos.x += e.facing.x * e.speed * 4 * dt;
          e.pos.y += e.facing.y * e.speed * 4 * dt;
          if (e.stateTimer <= 0) e.state = 0;
        }
        break;
      }
      case 'shoot': {
        // 距離を保ちつつ射撃
        const dx = p.pos.x - e.pos.x;
        const dy = p.pos.y - e.pos.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > 320 * 320) moveToward(e, p.pos.x, p.pos.y, e.speed, dt);
        else if (d2 < 200 * 200) moveToward(e, 2 * e.pos.x - p.pos.x, 2 * e.pos.y - p.pos.y, e.speed * 0.8, dt);
        e.stateTimer -= dt;
        if (e.stateTimer <= 0 && d2 < 480 * 480) {
          e.stateTimer = 2.3;
          dirTo(tmpDir, e.pos.x, e.pos.y, p.pos.x, p.pos.y);
          spawnBullet(state, {
            x: e.pos.x,
            y: e.pos.y,
            vx: tmpDir.x * 190,
            vy: tmpDir.y * 190,
            kind: 'enemy',
            fromPlayer: false,
            damage: e.damage,
            ttl: 4,
            radius: 6,
          });
        }
        break;
      }
      case 'explode': {
        if (e.state === 0) {
          moveToward(e, p.pos.x, p.pos.y, e.speed, dt);
          const dx = p.pos.x - e.pos.x;
          const dy = p.pos.y - e.pos.y;
          if (dx * dx + dy * dy < 70 * 70) {
            e.state = 1;
            e.stateTimer = 0.7;
          }
        } else {
          // 膨らんで自爆
          e.stateTimer -= dt;
          e.spriteScale = 1 + (0.7 - e.stateTimer) * 1.1;
          if (e.stateTimer <= 0) {
            spawnBurst(state, e.pos.x, e.pos.y, '#ff7ab8', 16, 260);
            spawnRing(state, e.pos.x, e.pos.y, '#ff7ab8', 85);
            audio.play('explosion');
            const dx = p.pos.x - e.pos.x;
            const dy = p.pos.y - e.pos.y;
            if (dx * dx + dy * dy < 95 * 95) damagePlayer(state, e.damage);
            killEnemy(state, e, false);
          }
        }
        break;
      }
      case 'worm': {
        if (e.segIndex !== 0) break; // 節は後段の chain 更新で動かす
        // 頭：サイン波で蛇行しながらプレイヤーへ
        e.stateTimer += dt;
        dirTo(tmpDir, e.pos.x, e.pos.y, p.pos.x, p.pos.y);
        const wiggle = Math.sin(e.stateTimer * 3.2) * 0.7;
        const cos = Math.cos(wiggle);
        const sin = Math.sin(wiggle);
        const wx = tmpDir.x * cos - tmpDir.y * sin;
        const wy = tmpDir.x * sin + tmpDir.y * cos;
        e.pos.x += wx * e.speed * dt;
        e.pos.y += wy * e.speed * dt;
        e.facing.x = wx;
        e.facing.y = wy;
        break;
      }
      case 'colossus': {
        moveToward(e, p.pos.x, p.pos.y, e.speed, dt);
        e.stateTimer -= dt;
        if (e.stateTimer <= 0) {
          e.stateTimer = 2.6;
          e.state++;
          audio.play('boss');
          // 全方位弾
          const n = 14;
          const base = state.rng.range(0, Math.PI * 2);
          for (let i = 0; i < n; i++) {
            const ang = base + (i / n) * Math.PI * 2;
            spawnBullet(state, {
              x: e.pos.x,
              y: e.pos.y,
              vx: Math.cos(ang) * 160,
              vy: Math.sin(ang) * 160,
              kind: 'enemy',
              fromPlayer: false,
              damage: Math.round(e.damage * 0.55),
              ttl: 5,
              radius: 8,
            });
          }
        }
        break;
      }
      case 'minion':
        break; // updateMinions で処理
    }

    // マップ外に出さない
    e.pos.x = clamp(e.pos.x, e.radius, WORLD_W - e.radius);
    e.pos.y = clamp(e.pos.y, e.radius, WORLD_H - e.radius);
  }

  updateWormChain(state, dt);
}

/** ワームの節は直前の生存節を追従する */
function updateWormChain(state: GameState, dt: number): void {
  const chain = state.wormChain;
  for (let i = 1; i < chain.length; i++) {
    const seg = chain[i];
    if (!seg.alive) continue;
    let prev: Enemy | null = null;
    for (let j = i - 1; j >= 0; j--) {
      if (chain[j].alive) {
        prev = chain[j];
        break;
      }
    }
    if (!prev) continue;
    const gap = (prev.radius + seg.radius) * 0.75;
    const dx = prev.pos.x - seg.pos.x;
    const dy = prev.pos.y - seg.pos.y;
    const d = Math.hypot(dx, dy);
    if (d > gap) {
      const pull = (d - gap) * 10 * dt;
      seg.pos.x += (dx / d) * Math.min(pull, d - gap);
      seg.pos.y += (dy / d) * Math.min(pull, d - gap);
      seg.facing.x = dx / d;
      seg.facing.y = dy / d;
    }
    seg.flash = Math.max(0, seg.flash - dt);
  }
}

/** プレイヤー配下ミニオン（群体種）の維持とAI */
export function updateMinions(state: GameState, dt: number): void {
  const p = state.player;
  const want = p.alive ? p.mods.minionCount : 0;
  // 不足分を補充
  while (state.minions.filter((m) => m.alive).length < want) {
    const m = spawnEnemy(
      state,
      'minion',
      p.pos.x + state.rng.range(-40, 40),
      p.pos.y + state.rng.range(-40, 40),
    );
    m.segIndex = state.rng.int(0, 999); // 周回位相に使う
  }
  let aliveIdx = 0;
  for (const m of state.minions) {
    if (!m.alive) continue;
    aliveIdx++;
    if (aliveIdx > want) {
      m.alive = false; // クラス変更等で減った分は退場
      continue;
    }
    m.flash = Math.max(0, m.flash - dt);
    m.stateTimer = Math.max(0, m.stateTimer - dt);

    // 索敵：プレイヤー周辺の敵
    let target: Enemy | null = null;
    let bestD = 420 * 420;
    for (const e of state.enemies) {
      if (!e.alive) continue;
      const dx = e.pos.x - p.pos.x;
      const dy = e.pos.y - p.pos.y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        target = e;
      }
    }
    if (target) {
      moveToward(m, target.pos.x, target.pos.y, m.speed, dt);
      if (m.stateTimer <= 0 && circlesHit(m.pos, m.radius + 4, target.pos, target.radius)) {
        m.stateTimer = 0.55;
        const dmg = (10 + p.level * 1.2) * p.mods.damageMul;
        damageEnemy(state, target, dmg, m.pos.x, m.pos.y, { poison: p.mods.poisonOnHit });
      }
    } else {
      // 待機中はプレイヤー周囲を回る
      const ang = state.time * 2 + m.segIndex;
      const tx = p.pos.x + Math.cos(ang) * (p.radius + 38);
      const ty = p.pos.y + Math.sin(ang) * (p.radius + 38);
      moveToward(m, tx, ty, m.speed, dt);
    }
  }
}
