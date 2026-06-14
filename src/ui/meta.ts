import { audio } from '../core/audio';
import { t } from '../data/i18n';
import {
  RESEARCH,
  UNLOCKS,
  aberrationSlots,
  loadoutSlots,
  unlockedStartWeapons,
  weaponGeneSockets,
} from '../data/progression';
import { AFFIXES, relicIcon, relicPower, relicRarity, salvageValue } from '../data/relics';
import { SKILL_GENES } from '../data/skillGenes';
import { ABERRATIONS } from '../data/aberrations';
import { WEAPONS } from '../data/weapons';
import type { Relic, WeaponId } from '../types';
import {
  assignWeaponGene,
  buyResearch,
  buyUnlock,
  equipAberration,
  equipGene,
  isEquipped,
  isUnlocked,
  loadProfile,
  nextResearchCost,
  researchLevel,
  salvageRelic,
  saveProfile,
  unequipUid,
  type ProfileData,
} from '../systems/profile';

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

/** 研究所（ステ強化＋アンロック）と倉庫・装備（3系統ロードアウト）の画面 */
export class MetaScreens {
  onClose: () => void = () => {};
  private profile: ProfileData = loadProfile();

  init(): void {
    el('lab-back').addEventListener('click', () => this.close());
    el('stash-back').addEventListener('click', () => this.close());
  }

  private close(): void {
    audio.play('select');
    el('lab-screen').classList.add('hidden');
    el('stash-screen').classList.add('hidden');
    this.onClose();
  }

  openLab(): void {
    this.profile = loadProfile();
    this.renderLab();
    el('lab-screen').classList.remove('hidden');
  }

  openStash(): void {
    this.profile = loadProfile();
    this.renderStash();
    el('stash-screen').classList.remove('hidden');
  }

  // ---- 研究所 ----
  private renderLab(): void {
    const p = this.profile;
    el('lab-essence').textContent = String(Math.floor(p.essence));

    const res = el('lab-research');
    res.innerHTML = '';
    for (const def of RESEARCH) {
      const lv = researchLevel(p, def.id);
      const cost = nextResearchCost(p, def.id);
      const maxed = cost === null;
      const card = document.createElement('div');
      card.className = 'meta-card' + (lv > 0 ? ' owned' : '');
      card.innerHTML = `
        <div class="mc-icon">${def.icon}</div>
        <div class="mc-name">${t(def.nameKey)}</div>
        <div class="mc-desc">${t(def.descKey)}</div>
        <div class="mc-lvl">Lv ${lv} / ${def.maxLevel}</div>`;
      const btn = document.createElement('button');
      btn.className = 'mc-buy';
      btn.textContent = maxed ? t('maxed') : `💰 ${cost}`;
      btn.disabled = maxed || (cost !== null && p.essence < cost);
      btn.addEventListener('click', () => {
        if (buyResearch(p, def.id)) {
          audio.play('levelup');
          this.renderLab();
        }
      });
      card.appendChild(btn);
      res.appendChild(card);
    }

    const un = el('lab-unlocks');
    un.innerHTML = '';
    for (const def of UNLOCKS) {
      const owned = isUnlocked(p, def.id);
      const card = document.createElement('div');
      card.className = 'meta-card' + (owned ? ' owned' : '');
      card.innerHTML = `
        <div class="mc-icon">${def.icon}</div>
        <div class="mc-name">${t(def.nameKey)}</div>
        <div class="mc-desc">${t(def.descKey)}</div>`;
      const btn = document.createElement('button');
      btn.className = 'mc-buy';
      btn.textContent = owned ? t('owned') : `💰 ${def.cost}`;
      btn.disabled = owned || p.essence < def.cost;
      btn.addEventListener('click', () => {
        if (buyUnlock(p, def.id)) {
          audio.play('levelup');
          this.renderLab();
        }
      });
      card.appendChild(btn);
      un.appendChild(card);
    }
  }

  // ---- 倉庫・装備 ----
  private renderStash(): void {
    const p = this.profile;
    el('stash-essence').textContent = String(Math.floor(p.essence));
    this.renderStartWeapons();
    this.renderGeneSlots();
    this.renderAberrSlots();
    this.renderWeaponGenes();
    this.renderStashList();
  }

  private renderStartWeapons(): void {
    const p = this.profile;
    const wrow = el('stash-weapons');
    wrow.innerHTML = '';
    for (const id of unlockedStartWeapons(p.unlocks)) {
      const def = WEAPONS[id as WeaponId];
      const chip = document.createElement('div');
      chip.className = 'wpn-chip' + (p.startWeapon === id ? ' selected' : '');
      chip.innerHTML = `<span>${def?.icon ?? '🦷'}</span><span>${t(`weapon.${id}.name`)}</span>`;
      chip.addEventListener('click', () => {
        p.startWeapon = id;
        saveProfile(p);
        audio.play('select');
        this.renderStash();
      });
      wrow.appendChild(chip);
    }
  }

  private slotCard(uid: string | null, onClear: () => void): HTMLElement {
    const p = this.profile;
    const relic = uid ? p.stash.find((r) => r.uid === uid) : undefined;
    const slot = document.createElement('div');
    slot.className = 'slot-card' + (relic ? ' filled' : '');
    if (relic) {
      const rar = relicRarity(relic);
      slot.style.borderColor = rar.color;
      slot.innerHTML = `<div class="rc-icon">${relicIcon(relic)}</div>
        <div class="mc-name" style="color:${rar.color}">${this.relicName(relic)}</div>
        <div class="sc-empty">${t('clickUnequip')}</div>`;
      slot.addEventListener('click', () => {
        onClear();
        audio.play('select');
        this.renderStash();
      });
    } else {
      slot.innerHTML = `<div class="rc-icon">➕</div><div class="sc-empty">${t('emptySlot')}</div>`;
    }
    return slot;
  }

  private renderGeneSlots(): void {
    const p = this.profile;
    const row = el('stash-genes');
    row.innerHTML = '';
    const n = loadoutSlots(p.unlocks);
    for (let i = 0; i < n; i++) {
      const uid = p.loadout.geneMods[i] ?? null;
      row.appendChild(this.slotCard(uid, () => uid && unequipUid(p, uid)));
    }
  }

  private renderAberrSlots(): void {
    const p = this.profile;
    const row = el('stash-aberr');
    row.innerHTML = '';
    const n = aberrationSlots(p.unlocks);
    for (let i = 0; i < n; i++) {
      const uid = p.loadout.aberrations[i] ?? null;
      row.appendChild(this.slotCard(uid, () => uid && unequipUid(p, uid)));
    }
  }

  private renderWeaponGenes(): void {
    const p = this.profile;
    const row = el('stash-weapongenes');
    row.innerHTML = '';
    const entries = Object.entries(p.loadout.weaponGenes).filter(([, arr]) =>
      arr.some((u) => u),
    );
    if (entries.length === 0) {
      row.innerHTML = `<div class="mc-desc">${t('weaponGeneHint')}</div>`;
      return;
    }
    for (const [wid, arr] of entries) {
      const def = WEAPONS[wid as WeaponId];
      const chip = document.createElement('div');
      chip.className = 'wpn-chip';
      const genes = arr
        .map((uid) => {
          const r = uid ? p.stash.find((x) => x.uid === uid) : undefined;
          return r ? relicIcon(r) : '';
        })
        .join('');
      chip.innerHTML = `<span>${def?.icon ?? '🔧'}</span><span>${t(`weapon.${wid}.name`)}</span><span>${genes}</span><span class="sc-empty">✕</span>`;
      chip.addEventListener('click', () => {
        for (const uid of arr) if (uid) unequipUid(p, uid);
        audio.play('select');
        this.renderStash();
      });
      row.appendChild(chip);
    }
  }

  private renderStashList(): void {
    const p = this.profile;
    const list = el('stash-list');
    list.innerHTML = '';
    const sorted = [...p.stash].sort((a, b) => order(b) - order(a));
    if (sorted.length === 0) {
      list.innerHTML = `<div class="mc-desc">${t('stashEmpty')}</div>`;
      return;
    }
    for (const relic of sorted) list.appendChild(this.relicCard(relic));
  }

  private relicCard(relic: Relic): HTMLElement {
    const p = this.profile;
    const rar = relicRarity(relic);
    const card = document.createElement('div');
    card.className = 'relic-card' + (relic.type === 'aberration' ? ' aberration' : '');
    card.style.borderColor = relic.type === 'aberration' ? '#ff5470' : rar.color;
    card.innerHTML = `
      <div class="rc-icon">${relicIcon(relic)}</div>
      <div class="rc-name" style="color:${relic.type === 'aberration' ? '#ff5470' : rar.color}">${this.relicName(relic)}</div>
      <div class="rc-kind">${t(`relictype.${relic.type}`)}</div>
      <div class="rc-affixes">${this.relicBody(relic)}</div>`;
    const btns = document.createElement('div');
    btns.className = 'rc-btns';
    const equipped = isEquipped(p, relic.uid);
    const eq = document.createElement('button');
    eq.textContent = equipped ? t('equipped') : t('equip');
    if (equipped) eq.className = 'equipped';
    eq.addEventListener('click', () => {
      if (equipped) unequipUid(p, relic.uid);
      else this.equipByType(relic);
      audio.play('select');
      this.renderStash();
    });
    const sal = document.createElement('button');
    sal.textContent = `${t('salvage')} 💰${salvageValue(relic)}`;
    sal.addEventListener('click', () => {
      salvageRelic(p, relic.uid, salvageValue(relic));
      audio.play('hit');
      this.renderStash();
    });
    btns.appendChild(eq);
    btns.appendChild(sal);
    card.appendChild(btns);
    return card;
  }

  /** 種類に応じて自動で空きスロットへ装着 */
  private equipByType(relic: Relic): void {
    const p = this.profile;
    if (relic.type === 'gene') {
      const slots = loadoutSlots(p.unlocks);
      let i = p.loadout.geneMods.findIndex((u) => !u);
      if (i < 0 || i >= slots) i = 0;
      equipGene(p, relic.uid, i);
    } else if (relic.type === 'aberration') {
      const slots = aberrationSlots(p.unlocks);
      let i = p.loadout.aberrations.findIndex((u) => !u);
      if (i < 0 || i >= slots) i = 0;
      equipAberration(p, relic.uid, i);
    } else {
      // skill gene → 対象武器の空きソケットへ
      const gene = SKILL_GENES[relic.baseId];
      if (!gene) return;
      const sockets = weaponGeneSockets(p.unlocks);
      const arr = p.loadout.weaponGenes[gene.weaponId] ?? [];
      let i = arr.findIndex((u) => !u);
      if (i < 0 || i >= sockets) i = 0;
      assignWeaponGene(p, relic.uid, gene.weaponId, i);
    }
  }

  private relicBody(relic: Relic): string {
    if (relic.type === 'gene') {
      return relic.affixes
        .map((a) => `<div>${AFFIXES[a.id]?.icon ?? ''} ${AFFIXES[a.id]?.format(a.value) ?? ''}</div>`)
        .join('');
    }
    if (relic.type === 'skill') {
      const g = SKILL_GENES[relic.baseId];
      const w = g ? t(`weapon.${g.weaponId}.name`) : '';
      return `<div>${g ? t(g.descKey) : ''}</div><div class="sc-empty">→ ${w}</div>`;
    }
    const a = ABERRATIONS[relic.baseId];
    return `<div>${a ? t(a.descKey) : ''}</div>`;
  }

  private relicName(relic: Relic): string {
    if (relic.type === 'skill') return t(SKILL_GENES[relic.baseId]?.nameKey ?? '');
    if (relic.type === 'aberration') return t(ABERRATIONS[relic.baseId]?.nameKey ?? '');
    return `${t(`rarity.${relicRarity(relic).key}`)} ${t(`relic.${relic.baseId}`)}`;
  }
}

/** 並び順：Aberration → Skill → Gene の順、その中で強さ降順 */
function order(r: Relic): number {
  const typeRank = r.type === 'aberration' ? 2000 : r.type === 'skill' ? 1000 : 0;
  return typeRank + relicPower(r);
}
