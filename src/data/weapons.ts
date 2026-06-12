import type { PassiveId, WeaponId } from '../types';

export interface WeaponStats {
  damage: number;
  cooldown: number; // 秒
  count: number; // 同時発射数 / 刃の数
  speed: number; // 弾速 px/s
  area: number; // 弾・ゾーン半径 px
  ttl: number; // 弾の寿命 秒
  pierce: number; // 貫通数
}

export interface WeaponDef {
  id: WeaponId;
  icon: string;
  maxLevel: number;
  /** 超進化のレシピ（base武器のみ）。Lv8 + 対応パッシブ所持で superId が3択に出る */
  superId?: WeaponId;
  superPassive?: PassiveId;
  isSuper: boolean;
  stats: (level: number) => WeaponStats;
}

const lv = (level: number) => level - 1;

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  orbit: {
    id: 'orbit',
    icon: '🪓',
    maxLevel: 8,
    superId: 'guillotine',
    superPassive: 'cdr',
    isSuper: false,
    stats: (l) => ({
      damage: 10 + lv(l) * 4,
      cooldown: 3.4 - lv(l) * 0.15,
      count: 2 + Math.floor(lv(l) / 2),
      speed: 3.2 + lv(l) * 0.25, // 回転 rad/s
      area: 13 + lv(l) * 1.5,
      ttl: 2.0 + lv(l) * 0.12,
      pierce: 999,
    }),
  },
  spine: {
    id: 'spine',
    icon: '🦷',
    maxLevel: 8,
    superId: 'railspine',
    superPassive: 'speed',
    isSuper: false,
    stats: (l) => ({
      damage: 12 + lv(l) * 5,
      cooldown: 0.95 - lv(l) * 0.06,
      count: 1 + Math.floor(lv(l) / 3),
      speed: 480,
      area: 6 + lv(l) * 0.6,
      ttl: 1.4,
      pierce: lv(l) >= 5 ? 2 : 1,
    }),
  },
  mist: {
    id: 'mist',
    icon: '☁️',
    maxLevel: 8,
    superId: 'miasma',
    superPassive: 'pickup',
    isSuper: false,
    stats: (l) => ({
      damage: 5 + lv(l) * 2.2, // ゾーンのDPS
      cooldown: 0.55 - lv(l) * 0.025,
      count: 1,
      speed: 0,
      area: 42 + lv(l) * 6,
      ttl: 2.2 + lv(l) * 0.25,
      pierce: 999,
    }),
  },
  chain: {
    id: 'chain',
    icon: '⚡',
    maxLevel: 8,
    isSuper: false,
    stats: (l) => ({
      damage: 14 + lv(l) * 6,
      cooldown: 1.7 - lv(l) * 0.1,
      count: 3 + lv(l), // 連鎖回数
      speed: 0,
      area: 260, // 初撃の索敵半径
      ttl: 0,
      pierce: 0,
    }),
  },
  ricochet: {
    id: 'ricochet',
    icon: '🎱',
    maxLevel: 8,
    isSuper: false,
    stats: (l) => ({
      damage: 11 + lv(l) * 4.5,
      cooldown: 1.3 - lv(l) * 0.07,
      count: 1 + Math.floor(lv(l) / 2),
      speed: 380,
      area: 8 + lv(l) * 0.5,
      ttl: 3.2,
      pierce: 3 + lv(l), // 跳ね回数
    }),
  },
  leech: {
    id: 'leech',
    icon: '🩸',
    maxLevel: 8,
    isSuper: false,
    stats: (l) => ({
      damage: 9 + lv(l) * 3.6,
      cooldown: 1.5 - lv(l) * 0.08,
      count: 1 + Math.floor(lv(l) / 4),
      speed: 320,
      area: 7 + lv(l) * 0.5,
      ttl: 2.0,
      pierce: 1,
    }),
  },
  mine: {
    id: 'mine',
    icon: '🥚',
    maxLevel: 8,
    isSuper: false,
    stats: (l) => ({
      damage: 26 + lv(l) * 11,
      cooldown: 2.2 - lv(l) * 0.12,
      count: 1 + Math.floor(lv(l) / 3),
      speed: 0,
      area: 60 + lv(l) * 7, // 爆発半径
      ttl: 12,
      pierce: 999,
    }),
  },
  // ---- 超進化武器（Lv1固定、ベース武器を置換する） ----
  guillotine: {
    id: 'guillotine',
    icon: '🪚',
    maxLevel: 1,
    isSuper: true,
    stats: () => ({
      damage: 55,
      cooldown: 0, // 常時展開
      count: 6,
      speed: 6.5,
      area: 22,
      ttl: 0,
      pierce: 999,
    }),
  },
  miasma: {
    id: 'miasma',
    icon: '☣️',
    maxLevel: 1,
    isSuper: true,
    stats: () => ({
      damage: 38, // 自分中心オーラのDPS
      cooldown: 0,
      count: 1,
      speed: 0,
      area: 150,
      ttl: 0,
      pierce: 999,
    }),
  },
  railspine: {
    id: 'railspine',
    icon: '🗡️',
    maxLevel: 1,
    isSuper: true,
    stats: () => ({
      damage: 95,
      cooldown: 0.9,
      count: 1,
      speed: 1400,
      area: 10,
      ttl: 1.6,
      pierce: 999,
    }),
  },
};

/** ドラフトに出るベース武器のプール */
export const BASE_WEAPONS: WeaponId[] = ['orbit', 'spine', 'mist', 'chain', 'ricochet', 'leech', 'mine'];

export const MAX_WEAPON_SLOTS = 6;
