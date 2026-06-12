import { audio } from '../core/audio';
import { circlesHit, clamp, distSq } from '../core/vec2';
import { t } from '../data/i18n';
import type { BotState } from '../types';
import { announce, WORLD_H, WORLD_W, type GameState } from '../state';
import { burstGems } from './gem';
import { killEnemy } from './enemy';
import { damagePlayer } from './player';
import { xpNextFor } from './player';
import { spawnBurst, spawnDamageNumber, spawnRing } from '../systems/particles';

export const BOT_SPAWN_AT = 150; // 2:30 に登場
const BOT_RESPAWN_DELAY = 45;

export function createBot(): BotState {
  return {
    pos: { x: 0, y: 0 },
    vel: { x: 0, y: 0 },
    radius: 15,
    alive: false,
    hp: 1,
    maxHp: 1,
    level: 1,
    xp: 0,
    speed: 210,
    state: 'farm',
    targetX: 0,
    targetY: 0,
    thinkTimer: 0,
    attackTimer: 0,
    respawnTimer: 0,
    flash: 0,
    spawned: false,
  };
}

function botStats(bot: BotState): void {
  bot.maxHp = 70 + bot.level * 24;
  bot.radius = clamp(14 + bot.level * 0.9, 14, 56);
  bot.speed = clamp(225 - bot.radius * 0.6, 175, 225);
}

function placeBotFarFromPlayer(state: GameState): void {
  const bot = state.bot;
  for (let i = 0; i < 10; i++) {
    const x = state.rng.range(100, WORLD_W - 100);
    const y = state.rng.range(100, WORLD_H - 100);
    if (distSq(x, y, state.player.pos.x, state.player.pos.y) > 700 * 700 || i === 9) {
      bot.pos.x = x;
      bot.pos.y = y;
      return;
    }
  }
}

export function damageBot(state: GameState, dmg: number): void {
  const bot = state.bot;
  if (!bot.alive || bot.respawnTimer > 0) return;
  const v = Math.max(1, Math.round(dmg));
  bot.hp -= v;
  bot.flash = 0.12;
  spawnDamageNumber(state, bot.pos.x, bot.pos.y - bot.radius, v);
  audio.play('hit');
  if (bot.hp <= 0) {
    bot.alive = false;
    bot.respawnTimer = BOT_RESPAWN_DELAY;
    // ジャックポット：保有XPの70%が爆散する
    const jackpot = Math.max(30, bot.xp * 0.7);
    burstGems(state, bot.pos.x, bot.pos.y, jackpot);
    state.player.score += 1500 + bot.level * 60;
    state.player.kills++;
    announce(state, t('jackpot'), true);
    audio.play('explosion');
    state.camera.shake(20);
    state.hitStop = Math.max(state.hitStop, 0.2);
    spawnRing(state, bot.pos.x, bot.pos.y, '#ff5470', 150);
    spawnBurst(state, bot.pos.x, bot.pos.y, '#ff5470', 30, 320, 4, 0.8);
  }
}

export function updateBot(state: GameState, dt: number): void {
  const bot = state.bot;
  const p = state.player;

  // 初登場
  if (!bot.spawned) {
    if (state.time >= BOT_SPAWN_AT) {
      bot.spawned = true;
      bot.alive = true;
      bot.level = Math.max(3, p.level - 1);
      bot.xp = 40;
      botStats(bot);
      bot.hp = bot.maxHp;
      placeBotFarFromPlayer(state);
      announce(state, t('warnBot'));
      audio.play('boss');
    }
    return;
  }

  // リスポーン待ち
  if (bot.respawnTimer > 0) {
    bot.respawnTimer -= dt;
    if (bot.respawnTimer <= 0) {
      bot.alive = true;
      bot.level = Math.max(p.level + 2, bot.level + 3); // 倒すたびに強く戻ってくる
      bot.xp = bot.level * 18;
      botStats(bot);
      bot.hp = bot.maxHp;
      placeBotFarFromPlayer(state);
      announce(state, t('warnBot'));
    }
    return;
  }
  if (!bot.alive) return;

  bot.flash = Math.max(0, bot.flash - dt);
  bot.hp = Math.min(bot.maxHp, bot.hp + 2 * dt); // 自然回復

  // ジェム取得でレベルアップ（updateGems が xp を加算してくる）
  while (bot.xp >= xpNextFor(bot.level)) {
    bot.xp -= xpNextFor(bot.level);
    bot.level++;
    botStats(bot);
  }

  // ---- 思考（0.4秒間隔） ----
  bot.thinkTimer -= dt;
  if (bot.thinkTimer <= 0) {
    bot.thinkTimer = 0.4;
    const dToPlayer = Math.hypot(p.pos.x - bot.pos.x, p.pos.y - bot.pos.y);
    if (p.alive && bot.level > p.level * 1.2 && dToPlayer < 750) {
      bot.state = 'hunt';
    } else if (p.alive && p.level > bot.level * 1.2 && dToPlayer < 420) {
      bot.state = 'flee';
    } else {
      bot.state = 'farm';
    }

    if (bot.state === 'hunt') {
      bot.targetX = p.pos.x;
      bot.targetY = p.pos.y;
    } else if (bot.state === 'flee') {
      bot.targetX = clamp(bot.pos.x + (bot.pos.x - p.pos.x) * 3, 60, WORLD_W - 60);
      bot.targetY = clamp(bot.pos.y + (bot.pos.y - p.pos.y) * 3, 60, WORLD_H - 60);
    } else {
      // farm：近くのジェム、なければ徘徊。霧収縮中は中央寄り
      let best = -1;
      let bestD = 650 * 650;
      for (let i = 0; i < state.gems.length; i++) {
        const g = state.gems[i];
        if (!g.alive) continue;
        const d = distSq(g.pos.x, g.pos.y, bot.pos.x, bot.pos.y);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      if (best >= 0) {
        bot.targetX = state.gems[best].pos.x;
        bot.targetY = state.gems[best].pos.y;
      } else if (distSq(bot.pos.x, bot.pos.y, bot.targetX, bot.targetY) < 80 * 80) {
        bot.targetX = state.rng.range(150, WORLD_W - 150);
        bot.targetY = state.rng.range(150, WORLD_H - 150);
      }
      if (state.fogRadius < 1500) {
        // 霧が迫ったら中央へ
        bot.targetX = (bot.targetX + WORLD_W / 2) / 2;
        bot.targetY = (bot.targetY + WORLD_H / 2) / 2;
      }
    }
  }

  // ---- 移動 ----
  const dx = bot.targetX - bot.pos.x;
  const dy = bot.targetY - bot.pos.y;
  const d = Math.hypot(dx, dy);
  if (d > 4) {
    bot.vel.x = (dx / d) * bot.speed;
    bot.vel.y = (dy / d) * bot.speed;
    bot.pos.x = clamp(bot.pos.x + bot.vel.x * dt, bot.radius, WORLD_W - bot.radius);
    bot.pos.y = clamp(bot.pos.y + bot.vel.y * dt, bot.radius, WORLD_H - bot.radius);
  }

  // ---- 自動攻撃：近くの敵を削って成長する ----
  bot.attackTimer -= dt;
  if (bot.attackTimer <= 0) {
    bot.attackTimer = 0.55;
    for (const e of state.enemies) {
      if (!e.alive || e.type === 'colossus' || e.type === 'worm_head') continue;
      if (distSq(e.pos.x, e.pos.y, bot.pos.x, bot.pos.y) < 130 * 130) {
        e.hp -= 14 + bot.level * 2;
        e.flash = 0.1;
        spawnBurst(state, e.pos.x, e.pos.y, '#ff5470', 3, 100, 2, 0.2);
        if (e.hp <= 0) {
          bot.xp += e.xpValue;
          killEnemy(state, e, false); // プレイヤーの取り分にはしない
        }
        break; // 1回の攻撃で1体
      }
    }
  }

  // ---- プレイヤーとの接触（捕食） ----
  if (p.alive && circlesHit(bot.pos, bot.radius, p.pos, p.radius)) {
    if (bot.level >= p.level) {
      state.lastDamageCause = 'deathByBot';
      damagePlayer(state, 14 + bot.level * 1.5);
    }
    if (p.mods.contactDamage > 0) {
      damageBot(state, p.mods.contactDamage * p.mods.damageMul * 0.5);
    }
  }
}
