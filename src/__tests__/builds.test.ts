import { describe, expect, it } from 'vitest';
import { RNG } from '../core/rng';
import { STRINGS } from '../data/i18n';
import { WEAPONS } from '../data/weapons';
import { SKILL_GENES, SKILL_GENE_IDS } from '../data/skillGenes';
import { ABERRATIONS, ABERRATION_IDS } from '../data/aberrations';
import {
  applyRelic,
  applyRelicEffects,
  generateAberration,
  generateDrop,
  generateSkillGene,
} from '../data/relics';
import { emptyEffects } from '../systems/effects';
import {
  buildRunEffects,
  defaultProfile,
  normalizeLoadout,
  weaponMutatorsFor,
} from '../systems/profile';
import { defaultMods } from '../entities/player';
import type { GameState } from '../state';
import type { Relic } from '../types';

describe('ダメージタグ', () => {
  it('タグ特化アフィックスが tagMul を上げる', () => {
    const m = defaultMods();
    expect(m.tagMul.projectile).toBe(1);
    applyRelic(m, { uid: 'g', type: 'gene', baseId: 'fang', rarity: 2, affixes: [{ id: 'projectileDmg', value: 20 }] });
    expect(m.tagMul.projectile).toBeCloseTo(1.2, 5);
  });
});

describe('Skill Gene（武器変異）', () => {
  it('全ジーンが実在の武器と mutator を持ち、i18nもある', () => {
    for (const id of SKILL_GENE_IDS) {
      const g = SKILL_GENES[id];
      expect(WEAPONS[g.weaponId], g.weaponId).toBeDefined();
      expect(g.mutator.kind).toBeTruthy();
      expect(STRINGS[g.nameKey], g.nameKey).toBeDefined();
      expect(STRINGS[g.descKey], g.descKey).toBeDefined();
    }
  });

  it('武器に割り当てた Skill Gene の mutator が取得できる', () => {
    const p = defaultProfile();
    const relic: Relic = { uid: 's1', type: 'skill', baseId: 'scatter', rarity: 2, affixes: [] };
    p.stash = [relic];
    p.loadout.weaponGenes = { spine: ['s1'] };
    const muts = weaponMutatorsFor(p, 'spine');
    expect(muts).toHaveLength(1);
    expect(muts[0]).toEqual({ kind: 'addProjectile', value: 2 });
    expect(weaponMutatorsFor(p, 'mine')).toHaveLength(0);
  });
});

describe('Aberration（呪いユニーク）', () => {
  it('全 Aberration が apply か hooks を持ち、i18nもある', () => {
    for (const id of ABERRATION_IDS) {
      const a = ABERRATIONS[id];
      expect(a.apply || a.hooks, id).toBeTruthy();
      expect(STRINGS[a.nameKey], a.nameKey).toBeDefined();
      expect(STRINGS[a.descKey], a.descKey).toBeDefined();
    }
  });

  it('飽食の心臓：半径ペナルティ2倍＋mass火力スケーラ', () => {
    const relic: Relic = { uid: 'a1', type: 'aberration', baseId: 'gluttonHeart', rarity: 4, affixes: [] };
    const m = defaultMods();
    applyRelic(m, relic);
    expect(m.massRadiusMul).toBe(2);
    const eff = emptyEffects();
    applyRelicEffects(eff, relic);
    expect(eff.damageScalers.length).toBe(1);
    // mass=100 → 1 + sqrt(100)*0.05 = 1.5
    const scale = eff.damageScalers[0]({ player: { mass: 100 } } as unknown as GameState);
    expect(scale).toBeCloseTo(1.5, 5);
  });

  it('断食の輪：回復不可＋火力up', () => {
    const m = defaultMods();
    applyRelic(m, { uid: 'a2', type: 'aberration', baseId: 'fastingRing', rarity: 4, affixes: [] });
    expect(m.noHeal).toBe(true);
    expect(m.damageMul).toBeCloseTo(1.6, 5);
  });

  it('反転の殻：被弾フックと火力スケーラを登録', () => {
    const eff = emptyEffects();
    applyRelicEffects(eff, { uid: 'a3', type: 'aberration', baseId: 'invertedShell', rarity: 4, affixes: [] });
    expect(eff.onHurt.length).toBe(1);
    expect(eff.damageScalers.length).toBe(1);
  });
});

describe('条件付きアフィックス', () => {
  it('瀕死火力は低HP時のみ倍率がかかる', () => {
    const eff = emptyEffects();
    applyRelicEffects(eff, {
      uid: 'g2', type: 'gene', baseId: 'core', rarity: 3,
      affixes: [{ id: 'lowHpDamage', value: 30 }],
    });
    expect(eff.damageScalers.length).toBe(1);
    const f = eff.damageScalers[0];
    const low = { player: { hp: 10, maxHp: 100 } } as unknown as GameState;
    const high = { player: { hp: 90, maxHp: 100 } } as unknown as GameState;
    expect(f(low)).toBeCloseTo(1.3, 5);
    expect(f(high)).toBe(1);
  });
});

describe('ドロップ抽選（種類）', () => {
  it('高レアでは gene/skill/aberration が出る', () => {
    const rng = new RNG(7);
    const types = new Set<string>();
    for (let i = 0; i < 400; i++) types.add(generateDrop(rng, 4, i).type);
    expect(types.has('gene')).toBe(true);
    expect(types.has('skill')).toBe(true);
    expect(types.has('aberration')).toBe(true);
  });

  it('低レアでは aberration は出ない', () => {
    const rng = new RNG(3);
    for (let i = 0; i < 400; i++) {
      expect(generateDrop(rng, 0, i).type).not.toBe('aberration');
    }
  });

  it('専用ジェネレータは正しい type を返す', () => {
    expect(generateSkillGene(new RNG(1), 1).type).toBe('skill');
    expect(generateAberration(new RNG(1), 1).type).toBe('aberration');
  });
});

describe('ロードアウト正規化', () => {
  it('スロット数に丸め、倉庫に無い uid を外す', () => {
    const p = defaultProfile();
    p.stash = [{ uid: 'g1', type: 'gene', baseId: 'fang', rarity: 1, affixes: [] }];
    p.loadout.geneMods = ['g1', 'ghost', 'extra']; // slotは1枠のみ
    normalizeLoadout(p);
    expect(p.loadout.geneMods).toEqual(['g1']); // 1枠＋存在しないuid除去
  });
});

describe('装備の RunEffects 構築', () => {
  it('装備した aberration の効果が RunEffects に入る', () => {
    const p = defaultProfile();
    p.stash = [{ uid: 'a1', type: 'aberration', baseId: 'invertedShell', rarity: 4, affixes: [] }];
    p.loadout.aberrations = ['a1'];
    const eff = buildRunEffects(p);
    expect(eff.onHurt.length).toBe(1);
    expect(eff.damageScalers.length).toBe(1);
  });
});
