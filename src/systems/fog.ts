import { t } from '../data/i18n';
import { FOG_END, FOG_MIN_RADIUS, FOG_START } from '../data/waves';
import { announce, WORLD_H, WORLD_W, type GameState } from '../state';
import { damageBot } from '../entities/bot';
import { distSq } from '../core/vec2';

const FOG_MAX_RADIUS = Math.hypot(WORLD_W, WORLD_H) / 2 + 100;

export function fogRadiusAt(time: number): number {
  if (time <= FOG_START) return FOG_MAX_RADIUS;
  const k = Math.min(1, (time - FOG_START) / (FOG_END - FOG_START));
  return FOG_MAX_RADIUS + (FOG_MIN_RADIUS - FOG_MAX_RADIUS) * k;
}

export function updateFog(state: GameState, dt: number): void {
  state.fogRadius = fogRadiusAt(state.time);
  if (state.time < FOG_START) return;

  if (!state.fogAnnounced) {
    state.fogAnnounced = true;
    announce(state, t('warnFog'), true, 4);
  }

  const cx = WORLD_W / 2;
  const cy = WORLD_H / 2;
  const r2 = state.fogRadius * state.fogRadius;
  const dps = 12 + (state.time - FOG_START) * 0.3;
  const p = state.player;
  // 霧の外は継続ダメージ（喰らい霧）。無敵時間や防御を貫通する
  if (p.alive && distSq(p.pos.x, p.pos.y, cx, cy) > r2) {
    state.lastDamageCause = 'deathByFog';
    p.hp -= dps * dt;
    p.hurtFlash = Math.max(p.hurtFlash, 0.1);
    if (p.hp <= 0) {
      p.hp = 0;
      p.alive = false;
    }
  }
  const bot = state.bot;
  if (bot.alive && bot.respawnTimer <= 0 && bot.spawned) {
    if (distSq(bot.pos.x, bot.pos.y, cx, cy) > r2) {
      damageBot(state, dps * dt);
    }
  }
}
