import { CLASSES } from '../data/classes';
import { ALL_PASSIVES, MAX_PASSIVE_SLOTS, PASSIVES } from '../data/passives';
import { BASE_WEAPONS, MAX_WEAPON_SLOTS, WEAPONS } from '../data/weapons';
import type { ClassId, PassiveId, WeaponId } from '../types';
import type { GameState } from '../state';
import { healPlayer, recomputeMods } from '../entities/player';
import { addWeapon, refreshOrbitals, superEvolve } from './weaponSystem';

export type CardKind = 'weapon' | 'upgrade' | 'passive' | 'passiveUp' | 'super' | 'heal' | 'score';

export interface DraftCard {
  kind: CardKind;
  weaponId?: WeaponId;
  passiveId?: PassiveId;
  icon: string;
  nameKey: string;
  descKey: string;
  kindKey: string;
  levelLabel: string; // "Lv 3" 等。固定文字列なので i18n 不要
  weight: number;
  /** 重複排除用の一意キー */
  uid: string;
}

/** 現在のビルドから3択候補プールを作る */
export function buildCardPool(state: GameState): DraftCard[] {
  const p = state.player;
  const pool: DraftCard[] = [];

  for (const w of p.weapons) {
    const def = WEAPONS[w.defId];
    // 超進化：Lv最大＋対応パッシブ所持で出現（最優先）
    if (
      !def.isSuper &&
      w.level >= def.maxLevel &&
      def.superId &&
      def.superPassive &&
      p.passives[def.superPassive] !== undefined
    ) {
      const superDef = WEAPONS[def.superId];
      pool.push({
        kind: 'super',
        weaponId: w.defId,
        icon: superDef.icon,
        nameKey: `weapon.${def.superId}.name`,
        descKey: `weapon.${def.superId}.desc`,
        kindKey: 'kindSuper',
        levelLabel: '',
        weight: 100,
        uid: `super:${def.superId}`,
      });
    } else if (w.level < def.maxLevel) {
      pool.push({
        kind: 'upgrade',
        weaponId: w.defId,
        icon: def.icon,
        nameKey: `weapon.${w.defId}.name`,
        descKey: `weapon.${w.defId}.desc`,
        kindKey: 'kindUpgrade',
        levelLabel: `Lv ${w.level} → ${w.level + 1}`,
        weight: 3,
        uid: `up:${w.defId}`,
      });
    }
  }

  if (p.weapons.length < MAX_WEAPON_SLOTS) {
    for (const id of BASE_WEAPONS) {
      if (p.weapons.some((w) => w.defId === id)) continue;
      pool.push({
        kind: 'weapon',
        weaponId: id,
        icon: WEAPONS[id].icon,
        nameKey: `weapon.${id}.name`,
        descKey: `weapon.${id}.desc`,
        kindKey: 'kindNewWeapon',
        levelLabel: 'Lv 1',
        weight: 2,
        uid: `new:${id}`,
      });
    }
  }

  for (const id of ALL_PASSIVES) {
    const owned = p.passives[id];
    if (owned === undefined) {
      if (Object.keys(p.passives).length >= MAX_PASSIVE_SLOTS) continue;
      pool.push({
        kind: 'passive',
        passiveId: id,
        icon: PASSIVES[id].icon,
        nameKey: `passive.${id}.name`,
        descKey: `passive.${id}.desc`,
        kindKey: 'kindPassive',
        levelLabel: 'Lv 1',
        weight: 2,
        uid: `p:${id}`,
      });
    } else if (owned < PASSIVES[id].maxLevel) {
      pool.push({
        kind: 'passiveUp',
        passiveId: id,
        icon: PASSIVES[id].icon,
        nameKey: `passive.${id}.name`,
        descKey: `passive.${id}.desc`,
        kindKey: 'kindPassive',
        levelLabel: `Lv ${owned} → ${owned + 1}`,
        weight: 2,
        uid: `pu:${id}`,
      });
    }
  }

  return pool;
}

/** 3枚引く。スーパーは確定で混ざる。プールが薄いときは回復/スコアで埋める */
export function generateDraft(state: GameState): DraftCard[] {
  const pool = buildCardPool(state);
  const picked: DraftCard[] = [];

  const supers = pool.filter((c) => c.kind === 'super');
  if (supers.length > 0) picked.push(supers[0]);

  const rest = pool.filter((c) => !picked.includes(c));
  while (picked.length < 3 && rest.length > 0) {
    const total = rest.reduce((s, c) => s + c.weight, 0);
    let roll = state.rng.next() * total;
    let idx = 0;
    for (let i = 0; i < rest.length; i++) {
      roll -= rest[i].weight;
      if (roll <= 0) {
        idx = i;
        break;
      }
    }
    picked.push(rest.splice(idx, 1)[0]);
  }

  const fillers: DraftCard[] = [
    {
      kind: 'heal',
      icon: '🍖',
      nameKey: 'cardHeal',
      descKey: 'cardHealDesc',
      kindKey: 'kindHeal',
      levelLabel: '',
      weight: 1,
      uid: 'heal',
    },
    {
      kind: 'score',
      icon: '💰',
      nameKey: 'cardScore',
      descKey: 'cardScoreDesc',
      kindKey: 'kindScore',
      levelLabel: '',
      weight: 1,
      uid: 'score',
    },
  ];
  for (const f of fillers) {
    if (picked.length < 3) picked.push(f);
  }
  return picked;
}

export function applyCard(state: GameState, card: DraftCard): void {
  const p = state.player;
  switch (card.kind) {
    case 'weapon':
      addWeapon(state, card.weaponId!);
      break;
    case 'upgrade': {
      const w = p.weapons.find((x) => x.defId === card.weaponId);
      if (w) {
        w.level++;
        if (card.weaponId === 'orbit') refreshOrbitals(state, 'orbit');
      }
      break;
    }
    case 'super': {
      const def = WEAPONS[card.weaponId!];
      if (def.superId) superEvolve(state, card.weaponId!, def.superId);
      break;
    }
    case 'passive':
      p.passives[card.passiveId!] = 1;
      break;
    case 'passiveUp':
      p.passives[card.passiveId!] = (p.passives[card.passiveId!] ?? 0) + 1;
      break;
    case 'heal':
      healPlayer(p, p.maxHp * 0.5);
      break;
    case 'score':
      p.score += 500;
      break;
  }
  recomputeMods(p);
}

/** Lv10/20/30 の進化先候補 */
export function evolutionChoices(state: GameState): ClassId[] {
  return CLASSES[state.player.classId].children;
}
