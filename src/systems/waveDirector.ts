import { audio } from '../core/audio';
import { t } from '../data/i18n';
import {
  BOSS_COLOSSUS_AT,
  BOSS_WORM_AT,
  ELITE_FIRST,
  ELITE_INTERVAL,
  ENEMY_CAP,
  PICKUP_INTERVAL,
  phaseAt,
} from '../data/waves';
import type { PickupKind } from '../types';
import { announce, WORLD_H, WORLD_W, type GameState } from '../state';
import { spawnEnemy, spawnMotherWorm } from '../entities/enemy';
import { spawnPickup } from '../entities/pickup';
import { clamp } from '../core/vec2';

/** 画面のすぐ外（リング状）に湧かせる */
function spawnPosAroundPlayer(state: GameState, out: { x: number; y: number }): void {
  const cam = state.camera;
  const dist = Math.max(cam.viewW, cam.viewH) * 0.62 + state.rng.range(0, 160);
  const ang = state.rng.range(0, Math.PI * 2);
  out.x = clamp(state.player.pos.x + Math.cos(ang) * dist, 30, WORLD_W - 30);
  out.y = clamp(state.player.pos.y + Math.sin(ang) * dist, 30, WORLD_H - 30);
}

const tmpPos = { x: 0, y: 0 };

export function updateWaveDirector(state: GameState, dt: number): void {
  const time = state.time;
  const phase = phaseAt(time);

  // ---- 通常湧き ----
  state.waveTimer -= dt;
  if (state.waveTimer <= 0) {
    state.waveTimer = phase.interval;
    if (state.enemies.length < ENEMY_CAP) {
      // 出る杭ヘイト：プレイヤーが育つほど湧きが増える
      const hate = Math.floor(state.player.level / 8);
      const batch = phase.batch + hate;
      for (let i = 0; i < batch; i++) {
        spawnPosAroundPlayer(state, tmpPos);
        spawnEnemy(state, state.rng.pick(phase.types), tmpPos.x, tmpPos.y);
      }
    }
  }

  // ---- エリート（金色個体） ----
  state.eliteTimer -= dt;
  if (time >= ELITE_FIRST && state.eliteTimer <= 0) {
    state.eliteTimer = ELITE_INTERVAL;
    spawnPosAroundPlayer(state, tmpPos);
    spawnEnemy(state, 'elite', tmpPos.x, tmpPos.y);
  }

  // ---- 補給ピックアップ ----
  state.pickupTimer -= dt;
  if (state.pickupTimer <= 0) {
    state.pickupTimer = PICKUP_INTERVAL;
    const roll = state.rng.next();
    const kind: PickupKind = roll < 0.45 ? 'heal' : roll < 0.7 ? 'magnet' : 'bomb';
    spawnPickup(
      state,
      clamp(state.player.pos.x + state.rng.range(-500, 500), 40, WORLD_W - 40),
      clamp(state.player.pos.y + state.rng.range(-500, 500), 40, WORLD_H - 40),
      kind,
    );
  }

  // ---- ボス ----
  if (!state.wormSpawned && time >= BOSS_WORM_AT) {
    state.wormSpawned = true;
    spawnPosAroundPlayer(state, tmpPos);
    spawnMotherWorm(state, tmpPos.x, tmpPos.y);
    announce(state, t('warnBoss'), true, 4);
    audio.play('boss');
    state.camera.shake(12);
  }
  if (!state.colossusSpawned && time >= BOSS_COLOSSUS_AT) {
    state.colossusSpawned = true;
    // 終盤の収束地点＝マップ中央側に出す
    const cx = (state.player.pos.x + WORLD_W / 2) / 2;
    const cy = (state.player.pos.y + WORLD_H / 2) / 2;
    spawnEnemy(state, 'colossus', cx, cy - 350);
    announce(state, t('warnColossus'), true, 5);
    audio.play('boss');
    state.camera.shake(24);
  }
}
