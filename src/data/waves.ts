import type { EnemyTypeId } from '../types';

/**
 * 時間→湧きテーブル。難度曲線「3分我慢→5分加速→7分無双→9分恐怖」。
 * from/to は秒。interval ごとに batch 体を画面外周に湧かせる。
 */
export interface WavePhase {
  from: number;
  to: number;
  interval: number;
  batch: number;
  types: EnemyTypeId[];
}

export const MATCH_DURATION = 600; // 10分

export const WAVE_PHASES: WavePhase[] = [
  { from: 0, to: 60, interval: 1.3, batch: 3, types: ['slime'] },
  { from: 60, to: 150, interval: 1.1, batch: 4, types: ['slime', 'slime', 'runner'] },
  { from: 150, to: 240, interval: 0.95, batch: 5, types: ['slime', 'runner', 'spore'] },
  { from: 240, to: 330, interval: 0.85, batch: 6, types: ['slime', 'runner', 'spore', 'frog'] },
  { from: 330, to: 420, interval: 0.75, batch: 7, types: ['runner', 'spore', 'frog', 'beetle', 'ameba'] },
  { from: 420, to: 510, interval: 0.62, batch: 8, types: ['slime', 'runner', 'spore', 'frog', 'beetle', 'ameba'] },
  { from: 510, to: 600, interval: 0.5, batch: 10, types: ['runner', 'spore', 'frog', 'beetle', 'ameba'] },
];

/** 同時存在数の上限（パフォーマンス保護） */
export const ENEMY_CAP = 320;

/** エリート（金色個体）の湧き：初回と間隔 */
export const ELITE_FIRST = 90;
export const ELITE_INTERVAL = 75;

/** ボス出現時刻 */
export const BOSS_WORM_AT = 300; // 5:00 マザーワーム
export const BOSS_COLOSSUS_AT = 580; // 9:40 ザ・コロッサス

/** 霧収縮の開始・終了 */
export const FOG_START = 510; // 8:30
export const FOG_END = 600;
export const FOG_MIN_RADIUS = 360;

/** 補給ピックアップの出現間隔 */
export const PICKUP_INTERVAL = 45;

/** 時間に応じた敵の強化倍率 */
export function enemyHpScale(time: number): number {
  return 1 + (time / 60) * 0.25 + Math.pow(time / 600, 2) * 1.6;
}

export function enemyDamageScale(time: number): number {
  return 1 + (time / 600) * 0.9;
}

/** 現在時刻のフェーズを返す（範囲外は最後のフェーズ） */
export function phaseAt(time: number): WavePhase {
  for (const p of WAVE_PHASES) {
    if (time >= p.from && time < p.to) return p;
  }
  return WAVE_PHASES[WAVE_PHASES.length - 1];
}
