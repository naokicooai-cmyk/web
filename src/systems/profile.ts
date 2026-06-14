import type { Relic, StatMods } from '../types';
import { applyRelic } from '../data/relics';
import {
  DIFFICULTIES,
  RESEARCH,
  UNLOCKS,
  loadoutSlots,
  researchCost,
} from '../data/progression';

/** 永続プロフィール（localStorage）。エッセンス・研究・解放・倉庫・装備を保持 */
export interface ProfileData {
  essence: number;
  research: Record<string, number>; // researchId -> level
  unlocks: string[]; // 解放済み unlock id
  stash: Relic[]; // 所持遺物
  loadout: (string | null)[]; // 装着中の遺物 uid（slot順）
  startWeapon: string; // 選択中の開始武器
  difficultyCleared: number; // 生存クリアした最高難易度 index
  relicSeq: number; // 遺物 uid 採番カウンタ
}

const KEY = 'evolvore.profile.v1';

export function defaultProfile(): ProfileData {
  return {
    essence: 0,
    research: {},
    unlocks: [],
    stash: [],
    loadout: [null],
    startWeapon: 'spine',
    difficultyCleared: 0,
    relicSeq: 1,
  };
}

export function loadProfile(): ProfileData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultProfile();
    const p = { ...defaultProfile(), ...(JSON.parse(raw) as Partial<ProfileData>) };
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

/** 装備スロット数に合わせて loadout 配列長をそろえる */
export function normalizeLoadout(p: ProfileData): void {
  const slots = loadoutSlots(p.unlocks);
  const next: (string | null)[] = [];
  for (let i = 0; i < slots; i++) next.push(p.loadout[i] ?? null);
  // 倉庫に存在しない uid は外す
  const owned = new Set(p.stash.map((r) => r.uid));
  p.loadout = next.map((uid) => (uid && owned.has(uid) ? uid : null));
}

// ---- 研究所 ----

export function researchLevel(p: ProfileData, id: string): number {
  return p.research[id] ?? 0;
}

/** 次レベルの費用（最大なら null） */
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

// ---- 倉庫・ロードアウト ----

export function addRelic(p: ProfileData, relic: Relic): void {
  p.stash.push(relic);
  saveProfile(p);
}

/** 一意IDを採番して返す（採番カウンタを進める） */
export function nextRelicSeq(p: ProfileData): number {
  return p.relicSeq++;
}

export function relicById(p: ProfileData, uid: string | null): Relic | undefined {
  if (!uid) return undefined;
  return p.stash.find((r) => r.uid === uid);
}

export function equippedRelics(p: ProfileData): Relic[] {
  const out: Relic[] = [];
  for (const uid of p.loadout) {
    const r = relicById(p, uid);
    if (r) out.push(r);
  }
  return out;
}

export function equipRelic(p: ProfileData, uid: string, slot: number): void {
  if (slot < 0 || slot >= p.loadout.length) return;
  if (!relicById(p, uid)) return;
  // 既に他スロットに装着済みなら外す
  for (let i = 0; i < p.loadout.length; i++) if (p.loadout[i] === uid) p.loadout[i] = null;
  p.loadout[slot] = uid;
  saveProfile(p);
}

export function unequipSlot(p: ProfileData, slot: number): void {
  if (slot < 0 || slot >= p.loadout.length) return;
  p.loadout[slot] = null;
  saveProfile(p);
}

/** 装着中スロットを探す（未装着は -1） */
export function equippedSlotOf(p: ProfileData, uid: string): number {
  return p.loadout.indexOf(uid);
}

export function salvageRelic(p: ProfileData, uid: string, value: number): void {
  const i = p.stash.findIndex((r) => r.uid === uid);
  if (i < 0) return;
  p.stash.splice(i, 1);
  for (let s = 0; s < p.loadout.length; s++) if (p.loadout[s] === uid) p.loadout[s] = null;
  p.essence += value;
  saveProfile(p);
}

// ---- 出撃時に効く補正 ----

/** 研究＋装備レリックを StatMods に畳み込む適用関数の列を返す */
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

/** fortune 研究によるエッセンス獲得倍率 */
export function essenceMultOf(p: ProfileData): number {
  return 1 + 0.15 * researchLevel(p, 'fortune');
}

/** ラン結果からエッセンス獲得量を算出 */
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

/** 選択可能な最高難易度（cleared+1 まで、配列内に収める） */
export function maxSelectableDifficulty(p: ProfileData): number {
  return Math.min(DIFFICULTIES.length - 1, p.difficultyCleared);
}
