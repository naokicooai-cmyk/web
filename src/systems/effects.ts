import type { Enemy } from '../types';
import type { GameState } from '../state';

/**
 * ラン専用のトリガー/動的効果レジストリ。
 * Gene-Mod の条件付きアフィックス、Skill Gene の triggerOn、Aberration から構築する。
 * 戦闘のチョークポイント（damageEnemy / killEnemy / damagePlayer ...）から発火する。
 */
export interface RunEffects {
  onHit: ((s: GameState, e: Enemy, dmg: number, crit: boolean) => void)[];
  onCrit: ((s: GameState, e: Enemy, dmg: number) => void)[];
  onKill: ((s: GameState, e: Enemy) => void)[];
  onHurt: ((s: GameState, dmg: number) => void)[];
  onDevour: ((s: GameState, e: Enemy) => void)[];
  onLevel: ((s: GameState) => void)[];
  periodic: { timer: number; every: number; fn: (s: GameState) => void }[];
  /** 出力ダメージに掛かる動的倍率（mass比例・低HP比例など） */
  damageScalers: ((s: GameState) => number)[];
}

export function emptyEffects(): RunEffects {
  return {
    onHit: [],
    onCrit: [],
    onKill: [],
    onHurt: [],
    onDevour: [],
    onLevel: [],
    periodic: [],
    damageScalers: [],
  };
}

/** 全 damageScalers を合成した倍率 */
export function totalDamageScale(s: GameState): number {
  let mult = 1;
  for (const f of s.effects.damageScalers) mult *= f(s);
  return mult;
}

/** periodic 効果のtick（毎フレーム呼ぶ） */
export function tickPeriodic(s: GameState, dt: number): void {
  for (const p of s.effects.periodic) {
    p.timer -= dt;
    if (p.timer <= 0) {
      p.timer = p.every;
      p.fn(s);
    }
  }
}
