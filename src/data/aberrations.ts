import type { StatMods } from '../types';
import type { RunEffects } from '../systems/effects';
import { spawnBullet } from '../entities/bullet';
import type { GameState } from '../state';

/** Aberration：ルールを書き換える呪いユニーク（強力＋代償） */
export interface AberrationDef {
  id: string;
  icon: string;
  nameKey: string;
  descKey: string;
  apply?: (m: StatMods) => void;
  hooks?: (eff: RunEffects) => void;
}

/** 無音の巣：定期的に自分中心へ毒沼を放出 */
function poisonNova(s: GameState): void {
  spawnBullet(s, {
    x: s.player.pos.x,
    y: s.player.pos.y,
    kind: 'zone',
    fromPlayer: true,
    damage: 36, // DPS
    pierce: 999,
    ttl: 2.6,
    radius: 130,
    weaponId: null,
    poison: 14,
  });
}

export const ABERRATIONS: Record<string, AberrationDef> = {
  gluttonHeart: {
    id: 'gluttonHeart', icon: '🫀', nameKey: 'aberr.gluttonHeart.name', descKey: 'aberr.gluttonHeart.desc',
    apply: (m) => {
      m.massRadiusMul *= 2; // 半径ペナルティ2倍
    },
    hooks: (eff) => {
      eff.damageScalers.push((s) => 1 + Math.sqrt(s.player.mass) * 0.05); // massで火力↑
    },
  },
  fastingRing: {
    id: 'fastingRing', icon: '⭕', nameKey: 'aberr.fastingRing.name', descKey: 'aberr.fastingRing.desc',
    apply: (m) => {
      m.noHeal = true;
      m.damageMul *= 1.6;
    },
  },
  blindCrown: {
    id: 'blindCrown', icon: '👑', nameKey: 'aberr.blindCrown.name', descKey: 'aberr.blindCrown.desc',
    apply: (m) => {
      m.targetRangeMul *= 2.2; // 画面外まで攻撃が届く
      m.speedMul *= 0.9;
    },
  },
  refluxStomach: {
    id: 'refluxStomach', icon: '🌀', nameKey: 'aberr.refluxStomach.name', descKey: 'aberr.refluxStomach.desc',
    apply: (m) => {
      m.noGemPickup = true;
      m.devourXpMul *= 5; // 丸呑みXP5倍
    },
  },
  invertedShell: {
    id: 'invertedShell', icon: '🐚', nameKey: 'aberr.invertedShell.name', descKey: 'aberr.invertedShell.desc',
    hooks: (eff) => {
      eff.onHurt.push((s) => {
        const p = s.player;
        p.rageStacks = Math.min(10, p.rageStacks + 1);
        p.rageTimer = 4;
      });
      eff.damageScalers.push((s) => 1 + s.player.rageStacks * 0.08);
    },
  },
  silentNest: {
    id: 'silentNest', icon: '🕸️', nameKey: 'aberr.silentNest.name', descKey: 'aberr.silentNest.desc',
    apply: (m) => {
      m.minionsPassive = true;
      m.minionCount += 3;
    },
    hooks: (eff) => {
      eff.periodic.push({ timer: 3, every: 3, fn: poisonNova });
    },
  },
};

export const ABERRATION_IDS = Object.keys(ABERRATIONS);
