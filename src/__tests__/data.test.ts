import { describe, expect, it } from 'vitest';
import { CLASSES, EVOLUTION_LEVELS } from '../data/classes';
import { ENEMIES } from '../data/enemies';
import { STRINGS } from '../data/i18n';
import { ALL_PASSIVES, PASSIVES } from '../data/passives';
import { BASE_WEAPONS, WEAPONS } from '../data/weapons';
import {
  ENEMY_CAP,
  MATCH_DURATION,
  WAVE_PHASES,
  enemyDamageScale,
  enemyHpScale,
  phaseAt,
} from '../data/waves';
import { defaultMods, xpNextFor } from '../entities/player';

describe('i18n', () => {
  it('全エントリに ja / en の両方がある', () => {
    for (const [key, entry] of Object.entries(STRINGS)) {
      expect(entry.ja, `${key}.ja`).toBeTruthy();
      expect(entry.en, `${key}.en`).toBeTruthy();
    }
  });

  it('武器・パッシブ・クラス・スキルの表示キーが揃っている', () => {
    for (const id of Object.keys(WEAPONS)) {
      expect(STRINGS[`weapon.${id}.name`], `weapon.${id}.name`).toBeDefined();
      expect(STRINGS[`weapon.${id}.desc`], `weapon.${id}.desc`).toBeDefined();
    }
    for (const id of Object.keys(PASSIVES)) {
      expect(STRINGS[`passive.${id}.name`], `passive.${id}.name`).toBeDefined();
      expect(STRINGS[`passive.${id}.desc`], `passive.${id}.desc`).toBeDefined();
    }
    for (const [id, cls] of Object.entries(CLASSES)) {
      expect(STRINGS[`class.${id}.name`], `class.${id}.name`).toBeDefined();
      expect(STRINGS[`class.${id}.desc`], `class.${id}.desc`).toBeDefined();
      expect(STRINGS[`skill.${cls.skill}.name`], `skill.${cls.skill}.name`).toBeDefined();
      expect(STRINGS[`skill.${cls.skill}.desc`], `skill.${cls.skill}.desc`).toBeDefined();
    }
  });
});

describe('weapons', () => {
  it('超進化のレシピ参照が正しい', () => {
    for (const id of BASE_WEAPONS) {
      const def = WEAPONS[id];
      expect(def.isSuper).toBe(false);
      if (def.superId) {
        expect(WEAPONS[def.superId].isSuper).toBe(true);
        expect(def.superPassive && PASSIVES[def.superPassive]).toBeDefined();
      }
    }
  });

  it('レベル1〜maxLevel で cooldown が正であり damage が単調非減少', () => {
    for (const def of Object.values(WEAPONS)) {
      let prev = 0;
      for (let l = 1; l <= def.maxLevel; l++) {
        const s = def.stats(l);
        expect(s.cooldown, `${def.id} L${l} cooldown`).toBeGreaterThanOrEqual(0);
        expect(s.damage, `${def.id} L${l} damage`).toBeGreaterThanOrEqual(prev);
        expect(s.count).toBeGreaterThan(0);
        prev = s.damage;
      }
    }
  });
});

describe('classes（進化ツリー）', () => {
  it('原生体から Lv10/20/30 の3段で全クラスへ到達できる', () => {
    const reached = new Set<string>(['protoform']);
    let frontier = ['protoform'];
    for (const lv of EVOLUTION_LEVELS) {
      const next: string[] = [];
      for (const id of frontier) {
        for (const child of CLASSES[id as keyof typeof CLASSES].children) {
          expect(CLASSES[child], `missing class ${child}`).toBeDefined();
          expect(CLASSES[child].tier, `${child} tier at lv${lv}`).toBe(lv);
          reached.add(child);
          next.push(child);
        }
      }
      frontier = next;
    }
    expect(reached.size).toBe(Object.keys(CLASSES).length);
  });

  it('apply は defaultMods を破綻させない（正の倍率）', () => {
    for (const cls of Object.values(CLASSES)) {
      const m = defaultMods();
      cls.apply(m);
      expect(m.damageMul).toBeGreaterThan(0);
      expect(m.speedMul).toBeGreaterThan(0);
      expect(m.maxHpMul).toBeGreaterThan(0);
      expect(m.cooldownMul).toBeGreaterThan(0);
    }
  });
});

describe('waves', () => {
  it('フェーズは隙間なく 0 → MATCH_DURATION を覆う', () => {
    let cursor = 0;
    for (const p of WAVE_PHASES) {
      expect(p.from).toBe(cursor);
      expect(p.to).toBeGreaterThan(p.from);
      cursor = p.to;
    }
    expect(cursor).toBe(MATCH_DURATION);
  });

  it('湧きテーブルの敵タイプはすべて定義済み', () => {
    for (const p of WAVE_PHASES) {
      for (const type of p.types) {
        expect(ENEMIES[type], `enemy ${type}`).toBeDefined();
      }
    }
  });

  it('phaseAt は範囲外でも最後のフェーズを返す', () => {
    expect(phaseAt(0)).toBe(WAVE_PHASES[0]);
    expect(phaseAt(9999)).toBe(WAVE_PHASES[WAVE_PHASES.length - 1]);
  });

  it('敵スケーリングは時間に対して単調増加', () => {
    let prevHp = 0;
    let prevDmg = 0;
    for (let t = 0; t <= MATCH_DURATION; t += 60) {
      expect(enemyHpScale(t)).toBeGreaterThan(prevHp);
      expect(enemyDamageScale(t)).toBeGreaterThanOrEqual(prevDmg);
      prevHp = enemyHpScale(t);
      prevDmg = enemyDamageScale(t);
    }
    expect(ENEMY_CAP).toBeGreaterThan(100);
  });
});

describe('XPカーブ', () => {
  it('単調増加で、Lv30到達に必要な総XPが現実的（10分で稼げる範囲）', () => {
    let total = 0;
    let prev = 0;
    for (let lv = 1; lv < 30; lv++) {
      const need = xpNextFor(lv);
      expect(need).toBeGreaterThan(prev * 0.8); // ほぼ単調
      expect(need).toBeGreaterThan(0);
      total += need;
      prev = need;
    }
    // 平均ジェム2XP・10分で2000〜4000キル想定のオーダー感
    expect(total).toBeGreaterThan(500);
    expect(total).toBeLessThan(20000);
  });

  it('ALL_PASSIVES と PASSIVES が一致', () => {
    expect(new Set(ALL_PASSIVES)).toEqual(new Set(Object.keys(PASSIVES)));
  });
});
