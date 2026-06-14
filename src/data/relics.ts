import type { RNG } from '../core/rng';
import type { AffixRoll, Relic, StatMods } from '../types';

/** レアリティ定義（0:コモン 〜 4:レジェンダリ） */
export interface RarityDef {
  id: number;
  key: string; // i18n: rarity.<key>
  color: string;
  affixes: number; // 付与されるアフィックス数
  salvage: number; // 分解で得るエッセンス
}

export const RARITIES: RarityDef[] = [
  { id: 0, key: 'common', color: '#b8c0d8', affixes: 1, salvage: 5 },
  { id: 1, key: 'uncommon', color: '#5aff8c', affixes: 2, salvage: 12 },
  { id: 2, key: 'rare', color: '#5ab8ff', affixes: 3, salvage: 28 },
  { id: 3, key: 'epic', color: '#c47dff', affixes: 4, salvage: 65 },
  { id: 4, key: 'legendary', color: '#ffd24d', affixes: 5, salvage: 150 },
];

/** 遺物の見た目テーマ（アイコン＋名前。効果はアフィックスで決まる） */
export const RELIC_BASES: { id: string; icon: string }[] = [
  { id: 'fang', icon: '🦷' },
  { id: 'scale', icon: '🐊' },
  { id: 'core', icon: '🔮' },
  { id: 'tentacle', icon: '🐙' },
  { id: 'eye', icon: '👁️' },
  { id: 'carapace', icon: '🐚' },
  { id: 'gland', icon: '🧪' },
  { id: 'spine', icon: '🌵' },
];

export interface AffixDef {
  id: string;
  icon: string;
  nameKey: string; // i18n: affix.<id>
  min: number; // レアリティ0での最小ロール
  max: number; // レアリティ0での最大ロール
  rarityScale: number; // レアリティ1段ごとの増分倍率
  apply: (m: StatMods, v: number) => void;
  /** 表示用：ロール値→文言 */
  format: (v: number) => string;
}

export const AFFIXES: Record<string, AffixDef> = {
  hp: {
    id: 'hp', icon: '❤️', nameKey: 'affix.hp', min: 6, max: 14, rarityScale: 0.4,
    apply: (m, v) => (m.maxHpMul *= 1 + v / 100), format: (v) => `+${v}% HP`,
  },
  dmg: {
    id: 'dmg', icon: '⚔️', nameKey: 'affix.dmg', min: 5, max: 12, rarityScale: 0.4,
    apply: (m, v) => (m.damageMul *= 1 + v / 100), format: (v) => `+${v}% DMG`,
  },
  spd: {
    id: 'spd', icon: '💨', nameKey: 'affix.spd', min: 3, max: 8, rarityScale: 0.4,
    apply: (m, v) => (m.speedMul *= 1 + v / 100), format: (v) => `+${v}% SPD`,
  },
  xp: {
    id: 'xp', icon: '💠', nameKey: 'affix.xp', min: 6, max: 15, rarityScale: 0.4,
    apply: (m, v) => (m.xpMul *= 1 + v / 100), format: (v) => `+${v}% XP`,
  },
  pickup: {
    id: 'pickup', icon: '🧲', nameKey: 'affix.pickup', min: 8, max: 20, rarityScale: 0.4,
    apply: (m, v) => (m.pickupMul *= 1 + v / 100), format: (v) => `+${v}% 回収`,
  },
  armor: {
    id: 'armor', icon: '🛡️', nameKey: 'affix.armor', min: 1, max: 3, rarityScale: 0.5,
    apply: (m, v) => (m.armor += v), format: (v) => `+${v} 防御`,
  },
  crit: {
    id: 'crit', icon: '🎯', nameKey: 'affix.crit', min: 2, max: 6, rarityScale: 0.45,
    apply: (m, v) => (m.critChance += v / 100), format: (v) => `+${v}% CRIT`,
  },
  cdr: {
    id: 'cdr', icon: '⏱️', nameKey: 'affix.cdr', min: 3, max: 8, rarityScale: 0.35,
    apply: (m, v) => (m.cooldownMul *= 1 - v / 100), format: (v) => `-${v}% CT`,
  },
  poison: {
    id: 'poison', icon: '☠️', nameKey: 'affix.poison', min: 2, max: 6, rarityScale: 0.5,
    apply: (m, v) => (m.poisonOnHit += v), format: (v) => `+${v} 毒`,
  },
  contact: {
    id: 'contact', icon: '🔥', nameKey: 'affix.contact', min: 3, max: 8, rarityScale: 0.5,
    apply: (m, v) => (m.contactDamage += v), format: (v) => `+${v} 接触`,
  },
};

const AFFIX_IDS = Object.keys(AFFIXES);

function rollAffix(rng: RNG, id: string, rarity: number): AffixRoll {
  const def = AFFIXES[id];
  const base = def.min + rng.next() * (def.max - def.min);
  const scaled = base * (1 + rarity * def.rarityScale);
  return { id, value: Math.max(1, Math.round(scaled)) };
}

/** レアリティを指定して遺物を1つ生成する（rng はシード可能） */
export function generateRelic(rng: RNG, rarity: number, seq: number): Relic {
  const r = Math.max(0, Math.min(RARITIES.length - 1, rarity));
  const base = rng.pick(RELIC_BASES);
  const n = RARITIES[r].affixes;
  // 重複しないアフィックスを n 個選ぶ
  const pool = [...AFFIX_IDS];
  const chosen: AffixRoll[] = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = Math.floor(rng.next() * pool.length);
    const id = pool.splice(idx, 1)[0];
    chosen.push(rollAffix(rng, id, r));
  }
  return { uid: `r${seq}`, baseId: base.id, rarity: r, affixes: chosen };
}

/** ドロップ時のレアリティ抽選。luck が高いほど上位が出やすい */
export function rollRarity(rng: RNG, luck: number): number {
  // 基本重み（コモン寄り）。luck で上位へシフト
  const weights = [
    Math.max(0.5, 10 - luck * 3),
    6 + luck,
    3 + luck * 1.5,
    1 + luck * 1.2,
    0.2 + luck * 0.8,
  ];
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng.next() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return i;
  }
  return 0;
}

export function relicIcon(relic: Relic): string {
  return RELIC_BASES.find((b) => b.id === relic.baseId)?.icon ?? '🔮';
}

export function relicRarity(relic: Relic): RarityDef {
  return RARITIES[relic.rarity] ?? RARITIES[0];
}

export function salvageValue(relic: Relic): number {
  return relicRarity(relic).salvage;
}

/** 遺物の補正を StatMods に適用する */
export function applyRelic(m: StatMods, relic: Relic): void {
  for (const a of relic.affixes) {
    AFFIXES[a.id]?.apply(m, a.value);
  }
}

/** 並べ替え・厳選用のざっくり強さスコア */
export function relicPower(relic: Relic): number {
  return relic.rarity * 100 + relic.affixes.reduce((s, a) => s + a.value, 0);
}
