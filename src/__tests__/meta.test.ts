import { describe, expect, it } from 'vitest';
import { RNG } from '../core/rng';
import { STRINGS } from '../data/i18n';
import {
  AFFIXES,
  RARITIES,
  RELIC_BASES,
  applyRelic,
  generateRelic,
  relicPower,
  rollRarity,
  salvageValue,
} from '../data/relics';
import {
  DIFFICULTIES,
  RESEARCH,
  UNLOCKS,
  loadoutSlots,
  researchCost,
  unlockedStartWeapons,
} from '../data/progression';
import {
  buildMetaApplicators,
  computeRunEssence,
  defaultProfile,
} from '../systems/profile';
import { defaultMods } from '../entities/player';
import type { Relic } from '../types';

describe('遺物（レリック）生成', () => {
  it('レアリティに応じたアフィックス数を持つ', () => {
    const rng = new RNG(1);
    for (let r = 0; r < RARITIES.length; r++) {
      const relic = generateRelic(rng, r, 1);
      expect(relic.rarity).toBe(r);
      expect(relic.affixes.length).toBe(RARITIES[r].affixes);
    }
  });

  it('レアリティはクランプされる', () => {
    const rng = new RNG(2);
    expect(generateRelic(rng, 99, 1).rarity).toBe(RARITIES.length - 1);
    expect(generateRelic(rng, -5, 1).rarity).toBe(0);
  });

  it('同じシードなら同じ遺物（決定的）', () => {
    const a = generateRelic(new RNG(42), 3, 7);
    const b = generateRelic(new RNG(42), 3, 7);
    expect(a).toEqual(b);
  });

  it('アフィックスは重複しない', () => {
    const relic = generateRelic(new RNG(9), 4, 1);
    const ids = relic.affixes.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('rollRarity は常に有効レンジを返す', () => {
    const rng = new RNG(5);
    for (let i = 0; i < 500; i++) {
      const r = rollRarity(rng, rng.range(0, 3));
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(RARITIES.length);
    }
  });

  it('applyRelic が StatMods を正しく変える', () => {
    const relic: Relic = {
      uid: 'r1', type: 'gene', baseId: 'core', rarity: 2,
      affixes: [{ id: 'hp', value: 10 }, { id: 'armor', value: 3 }],
    };
    const m = defaultMods();
    applyRelic(m, relic);
    expect(m.maxHpMul).toBeCloseTo(1.1, 5);
    expect(m.armor).toBe(3);
  });

  it('レア度が高いほど分解額・強さスコアが大きい', () => {
    const low = generateRelic(new RNG(11), 0, 1);
    const high = generateRelic(new RNG(11), 4, 2);
    expect(salvageValue(high)).toBeGreaterThan(salvageValue(low));
    expect(relicPower(high)).toBeGreaterThan(relicPower(low));
  });
});

describe('永続強化（研究所・アンロック・難易度）', () => {
  it('研究コストは単調増加', () => {
    for (const def of RESEARCH) {
      for (let l = 1; l < def.maxLevel; l++) {
        expect(researchCost(def, l)).toBeGreaterThan(researchCost(def, l - 1));
      }
    }
  });

  it('装備スロット数はアンロックで増える', () => {
    expect(loadoutSlots([])).toBe(1);
    expect(loadoutSlots(['slot_2'])).toBe(2);
    expect(loadoutSlots(['slot_2', 'slot_3', 'slot_4'])).toBe(4);
  });

  it('開始武器は spine が常時、アンロックで追加', () => {
    expect(unlockedStartWeapons([])).toEqual(['spine']);
    expect(unlockedStartWeapons(['weapon_orbit', 'slot_2'])).toContain('orbit');
    expect(unlockedStartWeapons(['weapon_orbit'])).toContain('spine');
  });

  it('難易度は index 昇順で強くなる', () => {
    for (let i = 1; i < DIFFICULTIES.length; i++) {
      expect(DIFFICULTIES[i].enemyHp).toBeGreaterThan(DIFFICULTIES[i - 1].enemyHp);
      expect(DIFFICULTIES[i].essenceMul).toBeGreaterThan(DIFFICULTIES[i - 1].essenceMul);
    }
  });
});

describe('プロフィール由来の補正・報酬', () => {
  it('研究と装備レリックが mods に畳み込まれる', () => {
    const p = defaultProfile();
    p.research.vitality = 5;
    p.stash = [{ uid: 'r1', type: 'gene', baseId: 'fang', rarity: 4, affixes: [{ id: 'dmg', value: 20 }] }];
    p.loadout.geneMods = ['r1'];
    const apps = buildMetaApplicators(p);
    const m = defaultMods();
    for (const a of apps) a(m);
    expect(m.maxHpMul).toBeGreaterThan(1); // vitality
    expect(m.damageMul).toBeCloseTo(1.2, 5); // 装備レリック
  });

  it('エッセンスは生存・難易度で増える', () => {
    const p = defaultProfile();
    const base = { score: 10000, kills: 200, level: 20 };
    const dead0 = computeRunEssence(p, { ...base, survived: false }, 0);
    const survived0 = computeRunEssence(p, { ...base, survived: true }, 0);
    const survived2 = computeRunEssence(p, { ...base, survived: true }, 2);
    expect(survived0).toBeGreaterThan(dead0);
    expect(survived2).toBeGreaterThan(survived0);
    expect(dead0).toBeGreaterThan(0);
  });

  it('幸運(fortune)研究でエッセンスが増える', () => {
    const poor = defaultProfile();
    const rich = defaultProfile();
    rich.research.fortune = 5;
    const stats = { score: 5000, kills: 100, level: 15, survived: true };
    expect(computeRunEssence(rich, stats, 0)).toBeGreaterThan(computeRunEssence(poor, stats, 0));
  });
});

describe('i18n：メタ進行のキーが揃っている', () => {
  it('レアリティ・難易度・遺物・研究・アンロックの表示キーが存在', () => {
    for (const r of RARITIES) expect(STRINGS[`rarity.${r.key}`], r.key).toBeDefined();
    for (const d of DIFFICULTIES) expect(STRINGS[d.nameKey], d.nameKey).toBeDefined();
    for (const b of RELIC_BASES) expect(STRINGS[`relic.${b.id}`], b.id).toBeDefined();
    for (const def of RESEARCH) {
      expect(STRINGS[def.nameKey], def.nameKey).toBeDefined();
      expect(STRINGS[def.descKey], def.descKey).toBeDefined();
    }
    for (const def of UNLOCKS) expect(STRINGS[def.nameKey], def.nameKey).toBeDefined();
  });

  it('アフィックスは全部 format できる', () => {
    for (const id of Object.keys(AFFIXES)) {
      expect(typeof AFFIXES[id].format(5)).toBe('string');
    }
  });
});
