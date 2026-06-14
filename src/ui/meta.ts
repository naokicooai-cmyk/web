import { audio } from '../core/audio';
import { t } from '../data/i18n';
import { RESEARCH, UNLOCKS, loadoutSlots, unlockedStartWeapons } from '../data/progression';
import { AFFIXES, relicIcon, relicRarity, relicPower, salvageValue } from '../data/relics';
import { WEAPONS } from '../data/weapons';
import type { Relic, WeaponId } from '../types';
import {
  buyResearch,
  buyUnlock,
  equipRelic,
  equippedSlotOf,
  isUnlocked,
  loadProfile,
  nextResearchCost,
  researchLevel,
  salvageRelic,
  saveProfile,
  unequipSlot,
  type ProfileData,
} from '../systems/profile';

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

/** 研究所（ステ強化＋アンロック）と倉庫・装備（ロードアウト）の画面 */
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
      const btnLabel = maxed ? t('maxed') : `💰 ${cost}`;
      card.innerHTML = `
        <div class="mc-icon">${def.icon}</div>
        <div class="mc-name">${t(def.nameKey)}</div>
        <div class="mc-desc">${t(def.descKey)}</div>
        <div class="mc-lvl">Lv ${lv} / ${def.maxLevel}</div>`;
      const btn = document.createElement('button');
      btn.className = 'mc-buy';
      btn.textContent = btnLabel;
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

    // 開始武器の選択
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

    // 装備中（ロードアウト）スロット
    const lrow = el('stash-loadout');
    lrow.innerHTML = '';
    const slots = loadoutSlots(p.unlocks);
    for (let i = 0; i < slots; i++) {
      const uid = p.loadout[i];
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
          unequipSlot(p, i);
          audio.play('select');
          this.renderStash();
        });
      } else {
        slot.innerHTML = `<div class="rc-icon">➕</div><div class="sc-empty">${t('emptySlot')}</div>`;
      }
      lrow.appendChild(slot);
    }

    // 倉庫一覧
    const list = el('stash-list');
    list.innerHTML = '';
    const sorted = [...p.stash].sort((a, b) => relicPower(b) - relicPower(a));
    if (sorted.length === 0) {
      list.innerHTML = `<div class="mc-desc">${t('stashEmpty')}</div>`;
      return;
    }
    for (const relic of sorted) {
      list.appendChild(this.relicCard(relic));
    }
  }

  private relicCard(relic: Relic): HTMLElement {
    const p = this.profile;
    const rar = relicRarity(relic);
    const card = document.createElement('div');
    card.className = 'relic-card';
    card.style.borderColor = rar.color;
    const affixHtml = relic.affixes
      .map((a) => `<div>${AFFIXES[a.id]?.icon ?? ''} ${AFFIXES[a.id]?.format(a.value) ?? ''}</div>`)
      .join('');
    card.innerHTML = `
      <div class="rc-icon">${relicIcon(relic)}</div>
      <div class="rc-name" style="color:${rar.color}">${this.relicName(relic)}</div>
      <div class="rc-affixes">${affixHtml}</div>`;
    const btns = document.createElement('div');
    btns.className = 'rc-btns';
    const equipped = equippedSlotOf(p, relic.uid) >= 0;
    const eq = document.createElement('button');
    eq.textContent = equipped ? t('equipped') : t('equip');
    if (equipped) eq.className = 'equipped';
    eq.addEventListener('click', () => {
      if (equipped) {
        unequipSlot(p, equippedSlotOf(p, relic.uid));
      } else {
        const slots = loadoutSlots(p.unlocks);
        let target = p.loadout.findIndex((u) => !u);
        if (target < 0) target = 0; // 空きが無ければ先頭を入れ替え
        if (target < slots) equipRelic(p, relic.uid, target);
      }
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

  private relicName(relic: Relic): string {
    return `${t(`rarity.${relicRarity(relic).key}`)} ${t(`relic.${relic.baseId}`)}`;
  }
}
