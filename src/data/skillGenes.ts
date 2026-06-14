import type { WeaponId, WeaponMutator } from '../types';

/** Skill Gene：武器タイプに割り当てて挙動を変える遺伝子 */
export interface SkillGeneDef {
  id: string;
  icon: string;
  nameKey: string;
  descKey: string;
  weaponId: WeaponId; // 装着対象の武器タイプ
  mutator: WeaponMutator;
}

export const SKILL_GENES: Record<string, SkillGeneDef> = {
  manyeye: {
    id: 'manyeye', icon: '👁️', nameKey: 'gene.manyeye.name', descKey: 'gene.manyeye.desc',
    weaponId: 'spine', mutator: { kind: 'targetMaxHp', value: 1 },
  },
  scatter: {
    id: 'scatter', icon: '🔱', nameKey: 'gene.scatter.name', descKey: 'gene.scatter.desc',
    weaponId: 'spine', mutator: { kind: 'addProjectile', value: 2 },
  },
  piercer: {
    id: 'piercer', icon: '➰', nameKey: 'gene.piercer.name', descKey: 'gene.piercer.desc',
    weaponId: 'spine', mutator: { kind: 'addPierce', value: 3 },
  },
  overchain: {
    id: 'overchain', icon: '⚡', nameKey: 'gene.overchain.name', descKey: 'gene.overchain.desc',
    weaponId: 'chain', mutator: { kind: 'addChain', value: 4 },
  },
  venomtip: {
    id: 'venomtip', icon: '☠️', nameKey: 'gene.venomtip.name', descKey: 'gene.venomtip.desc',
    weaponId: 'ricochet', mutator: { kind: 'convertPoison', value: 8 },
  },
  nestmine: {
    id: 'nestmine', icon: '🥚', nameKey: 'gene.nestmine.name', descKey: 'gene.nestmine.desc',
    weaponId: 'mine', mutator: { kind: 'triggerOnKill', value: 45 },
  },
  bounceplus: {
    id: 'bounceplus', icon: '🎱', nameKey: 'gene.bounceplus.name', descKey: 'gene.bounceplus.desc',
    weaponId: 'ricochet', mutator: { kind: 'addPierce', value: 4 },
  },
};

export const SKILL_GENE_IDS = Object.keys(SKILL_GENES);
