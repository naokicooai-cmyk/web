import type { StatMods } from '../types';

/** 研究所ノード：エッセンスで永久に底上げするステータス。 */
export interface ResearchDef {
  id: string;
  icon: string;
  nameKey: string;
  descKey: string;
  maxLevel: number;
  baseCost: number;
  costGrowth: number;
  /** 戦闘補正（fortune のようなメタ系は未定義） */
  apply?: (m: StatMods, level: number) => void;
}

export const RESEARCH: ResearchDef[] = [
  {
    id: 'vitality', icon: '❤️', nameKey: 'res.vitality.name', descKey: 'res.vitality.desc',
    maxLevel: 10, baseCost: 50, costGrowth: 1.55,
    apply: (m, l) => (m.maxHpMul *= 1 + 0.08 * l),
  },
  {
    id: 'ferocity', icon: '⚔️', nameKey: 'res.ferocity.name', descKey: 'res.ferocity.desc',
    maxLevel: 10, baseCost: 60, costGrowth: 1.6,
    apply: (m, l) => (m.damageMul *= 1 + 0.06 * l),
  },
  {
    id: 'swiftness', icon: '💨', nameKey: 'res.swiftness.name', descKey: 'res.swiftness.desc',
    maxLevel: 8, baseCost: 45, costGrowth: 1.55,
    apply: (m, l) => (m.speedMul *= 1 + 0.04 * l),
  },
  {
    id: 'metabolism', icon: '💠', nameKey: 'res.metabolism.name', descKey: 'res.metabolism.desc',
    maxLevel: 8, baseCost: 55, costGrowth: 1.6,
    apply: (m, l) => (m.xpMul *= 1 + 0.1 * l),
  },
  {
    id: 'greed', icon: '🧲', nameKey: 'res.greed.name', descKey: 'res.greed.desc',
    maxLevel: 6, baseCost: 40, costGrowth: 1.5,
    apply: (m, l) => (m.pickupMul *= 1 + 0.15 * l),
  },
  {
    id: 'carapace', icon: '🛡️', nameKey: 'res.carapace.name', descKey: 'res.carapace.desc',
    maxLevel: 8, baseCost: 50, costGrowth: 1.55,
    apply: (m, l) => (m.armor += l),
  },
  {
    id: 'precision', icon: '🎯', nameKey: 'res.precision.name', descKey: 'res.precision.desc',
    maxLevel: 6, baseCost: 70, costGrowth: 1.6,
    apply: (m, l) => (m.critChance += 0.03 * l),
  },
  {
    id: 'fortune', icon: '💰', nameKey: 'res.fortune.name', descKey: 'res.fortune.desc',
    maxLevel: 5, baseCost: 80, costGrowth: 1.7,
    // メタ系：エッセンス獲得量に効く（profileEssenceMult で参照）
  },
];

export function researchCost(def: ResearchDef, currentLevel: number): number {
  return Math.round(def.baseCost * Math.pow(def.costGrowth, currentLevel));
}

/** アンロック：装備スロット拡張・開始武器の解放など */
export interface UnlockDef {
  id: string;
  icon: string;
  nameKey: string;
  descKey: string;
  cost: number;
}

export const UNLOCKS: UnlockDef[] = [
  { id: 'slot_2', icon: '➕', nameKey: 'unlock.slot2.name', descKey: 'unlock.slot.desc', cost: 120 },
  { id: 'slot_3', icon: '➕', nameKey: 'unlock.slot3.name', descKey: 'unlock.slot.desc', cost: 400 },
  { id: 'slot_4', icon: '➕', nameKey: 'unlock.slot4.name', descKey: 'unlock.slot.desc', cost: 1000 },
  { id: 'weapon_orbit', icon: '🪓', nameKey: 'unlock.orbit.name', descKey: 'unlock.weapon.desc', cost: 150 },
  { id: 'weapon_mist', icon: '☁️', nameKey: 'unlock.mist.name', descKey: 'unlock.weapon.desc', cost: 150 },
  { id: 'weapon_chain', icon: '⚡', nameKey: 'unlock.chain.name', descKey: 'unlock.weapon.desc', cost: 200 },
  { id: 'weapon_ricochet', icon: '🎱', nameKey: 'unlock.ricochet.name', descKey: 'unlock.weapon.desc', cost: 200 },
  { id: 'weapon_leech', icon: '🩸', nameKey: 'unlock.leech.name', descKey: 'unlock.weapon.desc', cost: 250 },
  { id: 'weapon_mine', icon: '🥚', nameKey: 'unlock.mine.name', descKey: 'unlock.weapon.desc', cost: 250 },
];

/** ロードアウトの装備スロット数（基本1＋アンロック分） */
export function loadoutSlots(unlocks: string[]): number {
  let n = 1;
  if (unlocks.includes('slot_2')) n++;
  if (unlocks.includes('slot_3')) n++;
  if (unlocks.includes('slot_4')) n++;
  return n;
}

/** アンロック済みの開始武器ID（spine は常時、他は weapon_<id> 解放で追加） */
export function unlockedStartWeapons(unlocks: string[]): string[] {
  const list = ['spine'];
  for (const u of unlocks) {
    if (u.startsWith('weapon_')) list.push(u.slice('weapon_'.length));
  }
  return list;
}

/** 難易度（アセンション）。クリア（生存）で次が解放される */
export interface DifficultyDef {
  index: number;
  nameKey: string;
  color: string;
  enemyHp: number;
  enemyDmg: number;
  essenceMul: number;
  luck: number; // 戦利品レアリティの底上げ
}

export const DIFFICULTIES: DifficultyDef[] = [
  { index: 0, nameKey: 'diff.0', color: '#7df9ff', enemyHp: 1, enemyDmg: 1, essenceMul: 1, luck: 0 },
  { index: 1, nameKey: 'diff.1', color: '#5aff8c', enemyHp: 1.4, enemyDmg: 1.2, essenceMul: 1.4, luck: 0.6 },
  { index: 2, nameKey: 'diff.2', color: '#ffd24d', enemyHp: 1.9, enemyDmg: 1.45, essenceMul: 1.9, luck: 1.2 },
  { index: 3, nameKey: 'diff.3', color: '#ff8c5a', enemyHp: 2.6, enemyDmg: 1.75, essenceMul: 2.5, luck: 1.9 },
  { index: 4, nameKey: 'diff.4', color: '#ff5470', enemyHp: 3.5, enemyDmg: 2.1, essenceMul: 3.2, luck: 2.6 },
];
