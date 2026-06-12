import { audio } from '../core/audio';
import { circlesHit } from '../core/vec2';
import { t } from '../data/i18n';
import type { PickupKind } from '../types';
import { announce, type GameState } from '../state';
import { magnetAllGems } from './gem';
import { damageEnemy } from './enemy';
import { healPlayer } from './player';
import { spawnRing } from '../systems/particles';

export function spawnPickup(state: GameState, x: number, y: number, kind: PickupKind): void {
  const item = state.pickupPool.obtain();
  item.pos.x = x;
  item.pos.y = y;
  item.vel.x = state.rng.range(0, Math.PI * 2); // 浮遊アニメの位相として使う
  item.vel.y = 0;
  item.radius = 14;
  item.kind = kind;
  item.alive = true;
  state.pickups.push(item);
}

export function updatePickups(state: GameState, dt: number): void {
  const p = state.player;
  for (const item of state.pickups) {
    item.vel.x += dt * 3;
    if (!p.alive || !circlesHit(item.pos, item.radius, p.pos, p.radius + 6)) continue;
    item.alive = false;
    audio.play('pickup');
    spawnRing(state, item.pos.x, item.pos.y, '#ffd24d', 40);
    switch (item.kind) {
      case 'heal':
        healPlayer(p, p.maxHp * 0.35);
        break;
      case 'magnet':
        magnetAllGems(state);
        break;
      case 'bomb': {
        // 画面内の敵に大ダメージ
        state.camera.shake(16);
        state.hitStop = Math.max(state.hitStop, 0.1);
        audio.play('explosion');
        for (const e of state.enemies) {
          if (e.alive && state.camera.isVisible(e.pos.x, e.pos.y, e.radius)) {
            damageEnemy(state, e, 220, item.pos.x, item.pos.y);
          }
        }
        break;
      }
      case 'chest':
        // エリートの宝箱＝無料ドラフト1回
        state.pendingDrafts++;
        announce(state, t('eliteDown'));
        break;
    }
  }
}
