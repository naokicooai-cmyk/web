import type { PassiveId, StatMods } from '../types';

export interface PassiveDef {
  id: PassiveId;
  icon: string;
  maxLevel: number;
  apply: (mods: StatMods, level: number) => void;
}

export const PASSIVES: Record<PassiveId, PassiveDef> = {
  pickup: {
    id: 'pickup',
    icon: '🧲',
    maxLevel: 5,
    apply: (m, l) => (m.pickupMul *= 1 + 0.3 * l),
  },
  speed: {
    id: 'speed',
    icon: '💨',
    maxLevel: 5,
    apply: (m, l) => (m.speedMul *= 1 + 0.08 * l),
  },
  cdr: {
    id: 'cdr',
    icon: '⏱️',
    maxLevel: 5,
    apply: (m, l) => (m.cooldownMul *= Math.pow(0.92, l)),
  },
  armor: {
    id: 'armor',
    icon: '🛡️',
    maxLevel: 5,
    apply: (m, l) => (m.armor += 2 * l),
  },
  maxhp: {
    id: 'maxhp',
    icon: '❤️',
    maxLevel: 5,
    apply: (m, l) => (m.maxHpMul *= 1 + 0.25 * l),
  },
  shrink: {
    id: 'shrink',
    icon: '🔬',
    maxLevel: 3,
    apply: (m, l) => (m.shrinkMul *= Math.pow(0.88, l)),
  },
};

export const ALL_PASSIVES: PassiveId[] = ['pickup', 'speed', 'cdr', 'armor', 'maxhp', 'shrink'];

export const MAX_PASSIVE_SLOTS = 6;
