import type { ClassId, SkillId, StatMods } from '../types';

export type BodyShape = 'blob' | 'spiky' | 'turret' | 'swarm' | 'crown';

export interface ClassDef {
  id: ClassId;
  tier: 0 | 10 | 20 | 30;
  children: ClassId[];
  icon: string;
  color: string;
  color2: string;
  shape: BodyShape;
  skill: SkillId;
  skillCooldown: number;
  /** クラス固有補正（このクラスである間、丸ごと適用される絶対値） */
  apply: (m: StatMods) => void;
}

export const CLASSES: Record<ClassId, ClassDef> = {
  protoform: {
    id: 'protoform',
    tier: 0,
    children: ['devourer', 'artillery', 'swarm'],
    icon: '🦠',
    color: '#7df9ff',
    color2: '#3b9fc7',
    shape: 'blob',
    skill: 'dash',
    skillCooldown: 6,
    apply: () => {},
  },
  // ---- Lv10 ----
  devourer: {
    id: 'devourer',
    tier: 10,
    children: ['charger', 'venom'],
    icon: '👄',
    color: '#ff8c5a',
    color2: '#c4502a',
    shape: 'spiky',
    skill: 'devour',
    skillCooldown: 8,
    apply: (m) => {
      m.maxHpMul *= 1.2;
      m.damageMul *= 1.1;
      m.contactDamage = 10;
    },
  },
  artillery: {
    id: 'artillery',
    tier: 10,
    children: ['sniper', 'barrage'],
    icon: '💠',
    color: '#7d9bff',
    color2: '#4159c4',
    shape: 'turret',
    skill: 'aimcannon',
    skillCooldown: 5,
    apply: (m) => {
      m.damageMul *= 1.25;
      m.speedMul *= 0.95;
    },
  },
  swarm: {
    id: 'swarm',
    tier: 10,
    children: ['splitter', 'parasite'],
    icon: '🐝',
    color: '#b8ff5a',
    color2: '#6fa72e',
    shape: 'swarm',
    skill: 'swarmburst',
    skillCooldown: 7,
    apply: (m) => {
      m.minionCount = 2;
    },
  },
  // ---- Lv20 ----
  charger: {
    id: 'charger',
    tier: 20,
    children: ['juggernaut'],
    icon: '🐗',
    color: '#ff6a3d',
    color2: '#a3300f',
    shape: 'spiky',
    skill: 'devour',
    skillCooldown: 7,
    apply: (m) => {
      m.maxHpMul *= 1.35;
      m.damageMul *= 1.15;
      m.contactDamage = 22;
      m.speedMul *= 1.1;
    },
  },
  venom: {
    id: 'venom',
    tier: 20,
    children: ['venomlord'],
    icon: '🐍',
    color: '#a85aff',
    color2: '#5e1fa8',
    shape: 'spiky',
    skill: 'devour',
    skillCooldown: 7,
    apply: (m) => {
      m.maxHpMul *= 1.25;
      m.contactDamage = 8;
      m.poisonOnHit = 7;
    },
  },
  sniper: {
    id: 'sniper',
    tier: 20,
    children: ['deadeye'],
    icon: '🎯',
    color: '#5ad7ff',
    color2: '#1f6fa8',
    shape: 'turret',
    skill: 'aimcannon',
    skillCooldown: 4.5,
    apply: (m) => {
      m.damageMul *= 1.65;
      m.cooldownMul *= 1.1;
      m.critChance = 0.18;
    },
  },
  barrage: {
    id: 'barrage',
    tier: 20,
    children: ['hellstorm'],
    icon: '🎆',
    color: '#ff5ad7',
    color2: '#a81f7a',
    shape: 'turret',
    skill: 'aimcannon',
    skillCooldown: 4.5,
    apply: (m) => {
      m.damageMul *= 1.05;
      m.cooldownMul *= 0.88;
      m.extraProjectiles = 1;
    },
  },
  splitter: {
    id: 'splitter',
    tier: 20,
    children: ['legion'],
    icon: '🧫',
    color: '#d4ff5a',
    color2: '#7da82e',
    shape: 'swarm',
    skill: 'swarmburst',
    skillCooldown: 6,
    apply: (m) => {
      m.minionCount = 4;
      m.speedMul *= 1.05;
    },
  },
  parasite: {
    id: 'parasite',
    tier: 20,
    children: ['hivequeen'],
    icon: '🪱',
    color: '#5affb8',
    color2: '#1fa86f',
    shape: 'swarm',
    skill: 'swarmburst',
    skillCooldown: 6,
    apply: (m) => {
      m.minionCount = 3;
      m.lifesteal = 0.05;
    },
  },
  // ---- Lv30 ----
  juggernaut: {
    id: 'juggernaut',
    tier: 30,
    children: [],
    icon: '🦏',
    color: '#ff4d1f',
    color2: '#801a00',
    shape: 'spiky',
    skill: 'devour',
    skillCooldown: 6,
    apply: (m) => {
      m.maxHpMul *= 1.7;
      m.damageMul *= 1.3;
      m.contactDamage = 45;
      m.speedMul *= 1.15;
    },
  },
  venomlord: {
    id: 'venomlord',
    tier: 30,
    children: [],
    icon: '👑',
    color: '#c45aff',
    color2: '#6a0fa8',
    shape: 'crown',
    skill: 'devour',
    skillCooldown: 6,
    apply: (m) => {
      m.maxHpMul *= 1.45;
      m.contactDamage = 14;
      m.poisonOnHit = 14;
      m.auraPoison = 16;
    },
  },
  deadeye: {
    id: 'deadeye',
    tier: 30,
    children: [],
    icon: '🔭',
    color: '#5affff',
    color2: '#0f7aa8',
    shape: 'turret',
    skill: 'aimcannon',
    skillCooldown: 3.5,
    apply: (m) => {
      m.damageMul *= 2.3;
      m.critChance = 0.35;
    },
  },
  hellstorm: {
    id: 'hellstorm',
    tier: 30,
    children: [],
    icon: '🌪️',
    color: '#ff5a8c',
    color2: '#a80f4a',
    shape: 'turret',
    skill: 'aimcannon',
    skillCooldown: 3.5,
    apply: (m) => {
      m.damageMul *= 1.15;
      m.cooldownMul *= 0.78;
      m.extraProjectiles = 2;
      m.radialShots = 8;
    },
  },
  legion: {
    id: 'legion',
    tier: 30,
    children: [],
    icon: '🐜',
    color: '#eaff5a',
    color2: '#94a80f',
    shape: 'swarm',
    skill: 'swarmburst',
    skillCooldown: 5,
    apply: (m) => {
      m.minionCount = 8;
      m.speedMul *= 1.12;
    },
  },
  hivequeen: {
    id: 'hivequeen',
    tier: 30,
    children: [],
    icon: '🐉',
    color: '#5aff8c',
    color2: '#0fa84a',
    shape: 'crown',
    skill: 'swarmburst',
    skillCooldown: 5,
    apply: (m) => {
      m.minionCount = 6;
      m.lifesteal = 0.09;
      m.damageMul *= 1.25;
      m.maxHpMul *= 1.3;
    },
  },
};

/** 進化が発生するレベル */
export const EVOLUTION_LEVELS = [10, 20, 30] as const;
