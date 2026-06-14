import type { Relic, StatMods, WeaponId, WeaponMutator } from '../types';
import { applyRelic, applyRelicEffects } from '../data/relics';
import { SKILL_GENES } from '../data/skillGenes';
import { emptyEffects, type RunEffects } from './effects';
import {
  DIFFICULTIES,
  RESEARCH,
  UNLOCKS,
  aberrationSlots,
  loadoutSlots,
  researchCost,
  weaponGeneSockets,
} from '../data/progression';

/** カテゴリ別のロードアウト */
export interface Loadout {
  geneMods: (string | null)[]; // Gene-Mod 装備スロット
  aberrations: (string | null)[]; // Aberration 枠
  weaponGenes: Record<string, (string | null)[]>; // weaponId -> Skill Gene ソケット
}

/** 永続プロフィール（localStorage）。エッセンス・研究・解放・倉庫・装備を保持 */
export interface ProfileData {
  essence: number;
  research: Record<string, number>;
  unlocks: string[];
  stash: Relic[];
  loadout: Loadout;
  startWeapon: string;
  difficultyCleared: number;
  relicSeq: number;
}

const KEY = 'evolvore.profile.v1';

export function defaultProfile(): ProfileData {
  return {
    essence: 0,
    research: {},
    unlocks: [],
    stash: [],
    loadout: { geneMods: [null], aberrations: [null], weaponGenes: {} },
    startWeapon: 'spine',
    difficultyCleared: 0,
    relicSeq: 1,
  };
}

export function loadProfile(): ProfileData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultProfile();
    const parsed = JSON.parse(raw) as Partial<ProfileData> & { loadout?: unknown };
    const p = { ...defaultProfile(), ...parsed } as ProfileData;
    // 旧形式（loadout が配列）からの移行
    if (Array.isArray(parsed.loadout)) {
      p.loadout = {
        geneMods: parsed.loadout as (string | null)[],
        aberrations: [null],
        weaponGenes: {},
      };
    } else if (!parsed.loadout || typeof parsed.loadout !== 'object') {
      p.loadout = { geneMods: [null], aberrations: [null], weaponGenes: {} };
    } else {
      const lo = parsed.loadout as Partial<Loadout>;
      p.loadout = {
        geneMods: lo.geneMods ?? [null],
        aberrations: lo.aberrations ?? [null],
        weaponGenes: lo.weaponGenes ?? {},
      };
    }
    normalizeLoadout(p);
    return p;
  } catch {
    return defaultProfile();
  }
}

export function saveProfile(p: ProfileData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* 保存不可環境では無視 */
  }
}

function fitSlots(arr: (string | null)[], n: number, owned: Set<string>): (string | null)[] {
  const out: (string | null)[] = [];
  for (let i = 0; i < n; i++) {
    const uid = arr[i] ?? null;
    out.push(uid && owned.has(uid) ? uid : null);
  }
  return out;
}

/** スロット数に合わせて loadout をそろえ、倉庫に無い uid を外す */
export function normalizeLoadout(p: ProfileData): void {
  const owned = new Set(p.stash.map((r) => r.uid));
  const lo = p.loadout;
  lo.geneMods = fitSlots(lo.geneMods, loadoutSlots(p.unlocks), owned);
  lo.aberrations = fitSlots(lo.aberrations, aberrationSlots(p.unlocks), owned);
  const sockets = weaponGeneSockets(p.unlocks);
  const next: Record<string, (string | null)[]> = {};
  for (const [wid, arr] of Object.entries(lo.weaponGenes)) {
    next[wid] = fitSlots(arr, sockets, owned);
  }
  lo.weaponGenes = next;
}

// ---- 研究所 ----

export function researchLevel(p: ProfileData, id: string): number {
  return p.research[id] ?? 0;
}

export function nextResearchCost(p: ProfileData, id: string): number | null {
  const def = RESEARCH.find((r) => r.id === id);
  if (!def) return null;
  const lv = researchLevel(p, id);
  if (lv >= def.maxLevel) return null;
  return researchCost(def, lv);
}

export function buyResearch(p: ProfileData, id: string): boolean {
  const cost = nextResearchCost(p, id);
  if (cost === null || p.essence < cost) return false;
  p.essence -= cost;
  p.research[id] = researchLevel(p, id) + 1;
  saveProfile(p);
  return true;
}

// ---- アンロック ----

export function isUnlocked(p: ProfileData, id: string): boolean {
  return p.unlocks.includes(id);
}

export function buyUnlock(p: ProfileData, id: string): boolean {
  const def = UNLOCKS.find((u) => u.id === id);
  if (!def || isUnlocked(p, id) || p.essence < def.cost) return false;
  p.essence -= def.cost;
  p.unlocks.push(id);
  normalizeLoadout(p);
  saveProfile(p);
  return true;
}

// ---- 倉庫 ----

export function addRelic(p: ProfileData, relic: Relic): void {
  p.stash.push(relic);
  saveProfile(p);
}

export function nextRelicSeq(p: ProfileData): number {
  return p.relicSeq++;
}

export function relicById(p: ProfileData, uid: string | null): Relic | undefined {
  if (!uid) return undefined;
  return p.stash.find((r) => r.uid === uid);
}

/** uid がロードアウトのどこかに装着済みか */
export function isEquipped(p: ProfileData, uid: string): boolean {
  const lo = p.loadout;
  if (lo.geneMods.includes(uid) || lo.aberrations.includes(uid)) return true;
  for (const arr of Object.values(lo.weaponGenes)) if (arr.includes(uid)) return true;
  return false;
}

function clearUid(p: ProfileData, uid: string): void {
  const lo = p.loadout;
  lo.geneMods = lo.geneMods.map((u) => (u === uid ? null : u));
  lo.aberrations = lo.aberrations.map((u) => (u === uid ? null : u));
  for (const wid of Object.keys(lo.weaponGenes)) {
    lo.weaponGenes[wid] = lo.weaponGenes[wid].map((u) => (u === uid ? null : u));
  }
}

// ---- 装備（Gene-Mod / Aberration / Skill Gene）----

export function equipGene(p: ProfileData, uid: string, slot: number): void {
  const r = relicById(p, uid);
  if (!r || r.type !== 'gene') return;
  if (slot < 0 || slot >= p.loadout.geneMods.length) return;
  clearUid(p, uid);
  p.loadout.geneMods[slot] = uid;
  saveProfile(p);
}

export function equipAberration(p: ProfileData, uid: string, slot: number): void {
  const r = relicById(p, uid);
  if (!r || r.type !== 'aberration') return;
  if (slot < 0 || slot >= p.loadout.aberrations.length) return;
  clearUid(p, uid);
  p.loadout.aberrations[slot] = uid;
  saveProfile(p);
}

export function assignWeaponGene(
  p: ProfileData,
  uid: string,
  weaponId: WeaponId,
  socket: number,
): void {
  const r = relicById(p, uid);
  if (!r || r.type !== 'skill') return;
  const sockets = weaponGeneSockets(p.unlocks);
  if (socket < 0 || socket >= sockets) return;
  if (!p.loadout.weaponGenes[weaponId]) {
    p.loadout.weaponGenes[weaponId] = Array(sockets).fill(null);
  }
  clearUid(p, uid);
  p.loadout.weaponGenes[weaponId][socket] = uid;
  saveProfile(p);
}

export function unequipUid(p: ProfileData, uid: string): void {
  clearUid(p, uid);
  saveProfile(p);
}

export function salvageRelic(p: ProfileData, uid: string, value: number): void {
  const i = p.stash.findIndex((r) => r.uid === uid);
  if (i < 0) return;
  p.stash.splice(i, 1);
  clearUid(p, uid);
  p.essence += value;
  saveProfile(p);
}

/** StatMods/Effects 用：装備中の gene + aberration 遺物 */
export function equippedRelics(p: ProfileData): Relic[] {
  const out: Relic[] = [];
  for (const uid of [...p.loadout.geneMods, ...p.loadout.aberrations]) {
    const r = relicById(p, uid);
    if (r) out.push(r);
  }
  return out;
}

/** 指定武器に割り当てられた Skill Gene の変異 */
export function weaponMutatorsFor(p: ProfileData, weaponId: string): WeaponMutator[] {
  const arr = p.loadout.weaponGenes[weaponId];
  if (!arr) return [];
  const out: WeaponMutator[] = [];
  for (const uid of arr) {
    const r = relicById(p, uid);
    if (r && r.type === 'skill') {
      const gene = SKILL_GENES[r.baseId];
      if (gene) out.push(gene.mutator);
    }
  }
  return out;
}

// ---- 出撃時に効く補正 ----

/** 研究＋装備（gene/aberration）の静的 StatMods 補正 */
export function buildMetaApplicators(p: ProfileData): ((m: StatMods) => void)[] {
  const apps: ((m: StatMods) => void)[] = [];
  for (const def of RESEARCH) {
    const lv = researchLevel(p, def.id);
    if (lv > 0 && def.apply) apps.push((m) => def.apply!(m, lv));
  }
  for (const relic of equippedRelics(p)) {
    apps.push((m) => applyRelic(m, relic));
  }
  return apps;
}

/** 装備（gene/aberration）の動的/トリガー効果を集めた RunEffects */
export function buildRunEffects(p: ProfileData): RunEffects {
  const eff = emptyEffects();
  for (const relic of equippedRelics(p)) {
    applyRelicEffects(eff, relic);
  }
  return eff;
}

export function essenceMultOf(p: ProfileData): number {
  return 1 + 0.15 * researchLevel(p, 'fortune');
}

export function computeRunEssence(
  p: ProfileData,
  stats: { score: number; kills: number; level: number; survived: boolean },
  difficultyIndex: number,
): number {
  const diff = DIFFICULTIES[difficultyIndex] ?? DIFFICULTIES[0];
  let base = stats.score * 0.03 + stats.kills * 0.5 + stats.level * 5;
  if (stats.survived) base += 200;
  return Math.max(1, Math.round(base * diff.essenceMul * essenceMultOf(p)));
}

export function maxSelectableDifficulty(p: ProfileData): number {
  return Math.min(DIFFICULTIES.length - 1, p.difficultyCleared);
}
