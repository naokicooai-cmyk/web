import { audio } from '../core/audio';
import { CLASSES } from '../data/classes';
import { getLang, setLang, t, type Lang } from '../data/i18n';
import { DIFFICULTIES } from '../data/progression';
import { relicIcon, relicRarity } from '../data/relics';
import type { ClassId, Relic } from '../types';
import type { ResultInfo } from '../state';
import type { DraftCard } from '../systems/levelUp';
import { loadRanking } from '../systems/meta';
import { loadProfile, maxSelectableDifficulty } from '../systems/profile';

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

export class UIOverlays {
  onPlay: (difficulty: number) => void = () => {};
  onCardPick: (index: number) => void = () => {};
  onEvolvePick: (id: ClassId) => void = () => {};
  onRetry: () => void = () => {};
  onToTitle: () => void = () => {};
  onOpenLab: () => void = () => {};
  onOpenStash: () => void = () => {};

  private currentCards: DraftCard[] = [];
  private currentEvolutions: ClassId[] = [];
  private retryTimer: number | null = null;
  private diffIndex = 0;

  init(): void {
    el('play-btn').addEventListener('click', () => {
      audio.unlock();
      audio.play('select');
      this.onPlay(this.diffIndex);
    });
    el('lab-btn').addEventListener('click', () => {
      audio.play('select');
      el('title-screen').classList.add('hidden');
      this.onOpenLab();
    });
    el('stash-btn').addEventListener('click', () => {
      audio.play('select');
      el('title-screen').classList.add('hidden');
      this.onOpenStash();
    });
    el('diff-prev').addEventListener('click', () => this.changeDiff(-1));
    el('diff-next').addEventListener('click', () => this.changeDiff(1));
    el('retry-btn').addEventListener('click', () => {
      if ((el('retry-btn') as HTMLButtonElement).disabled) return;
      audio.play('select');
      this.onRetry();
    });
    el('to-title-btn').addEventListener('click', () => this.onToTitle());
    el('lang-ja').addEventListener('click', () => this.switchLang('ja'));
    el('lang-en').addEventListener('click', () => this.switchLang('en'));
    el('mute-btn').addEventListener('click', () => {
      audio.unlock();
      audio.muted = !audio.muted;
      el('mute-btn').textContent = audio.muted ? '🔇' : '🔊';
    });

    // 1/2/3 キーでカード選択
    window.addEventListener('keydown', (e) => {
      const idx = ['Digit1', 'Digit2', 'Digit3'].indexOf(e.code);
      if (idx < 0) return;
      if (!el('levelup-screen').classList.contains('hidden')) {
        if (idx < this.currentCards.length) {
          audio.play('select');
          this.onCardPick(idx);
        }
      } else if (!el('evolution-screen').classList.contains('hidden')) {
        if (idx < this.currentEvolutions.length) {
          audio.play('select');
          this.onEvolvePick(this.currentEvolutions[idx]);
        }
      }
    });

    this.applyLang();
  }

  private switchLang(lang: Lang): void {
    setLang(lang);
    this.applyLang();
  }

  applyLang(): void {
    document.documentElement.lang = getLang();
    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((node) => {
      node.textContent = t(node.dataset.i18n!);
    });
    el('title-help').innerHTML = [t('helpLine1'), t('helpLine2'), t('helpLine3')].join('<br>');
    el('lang-ja').classList.toggle('active', getLang() === 'ja');
    el('lang-en').classList.toggle('active', getLang() === 'en');
    this.renderRanking();
    this.refreshTitleMeta();
  }

  /** タイトルのエッセンス残高と難易度セレクタを最新化 */
  private refreshTitleMeta(): void {
    const profile = loadProfile();
    el('essence-amount').textContent = String(Math.floor(profile.essence));
    const max = maxSelectableDifficulty(profile);
    this.diffIndex = Math.max(0, Math.min(max, this.diffIndex));
    this.updateDiffLabel(max);
  }

  private updateDiffLabel(max: number): void {
    const diff = DIFFICULTIES[this.diffIndex];
    const label = el('diff-label');
    label.textContent = `${t('difficulty')}: ${t(diff.nameKey)}`;
    label.style.color = diff.color;
    (el('diff-prev') as HTMLButtonElement).disabled = this.diffIndex <= 0;
    (el('diff-next') as HTMLButtonElement).disabled = this.diffIndex >= max;
  }

  private changeDiff(dir: number): void {
    const max = maxSelectableDifficulty(loadProfile());
    const next = Math.max(0, Math.min(max, this.diffIndex + dir));
    if (next === this.diffIndex) return;
    this.diffIndex = next;
    audio.play('select');
    this.updateDiffLabel(max);
  }

  private renderRanking(): void {
    const list = loadRanking();
    const box = el('ranking-list');
    if (list.length === 0) {
      box.textContent = t('noRecords');
      return;
    }
    box.innerHTML = list
      .map((r, i) => {
        const mm = Math.floor(r.time / 60);
        const ss = String(Math.floor(r.time % 60)).padStart(2, '0');
        const cls = CLASSES[r.classId as ClassId] ? t(`class.${r.classId}.name`) : r.classId;
        return `<div class="rank-row"><span>#${i + 1}</span><span>${r.score}</span><span>${mm}:${ss}</span><span>Lv${r.level}</span><span>${cls}</span></div>`;
      })
      .join('');
  }

  showTitle(): void {
    this.hideAll();
    this.applyLang();
    el('title-screen').classList.remove('hidden');
  }

  hideAll(): void {
    for (const id of [
      'title-screen',
      'levelup-screen',
      'evolution-screen',
      'result-screen',
      'lab-screen',
      'stash-screen',
    ]) {
      el(id).classList.add('hidden');
    }
    if (this.retryTimer !== null) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
  }

  showLevelUp(cards: DraftCard[]): void {
    this.currentCards = cards;
    el('levelup-title').textContent = t('levelupTitle');
    const box = el('levelup-cards');
    box.innerHTML = '';
    cards.forEach((card, i) => {
      const div = document.createElement('div');
      div.className = card.kind === 'super' ? 'card super' : 'card';
      div.innerHTML = `
        <div class="key">${i + 1}</div>
        <div class="icon">${card.icon}</div>
        <div class="kind">${t(card.kindKey)}</div>
        <div class="name">${t(card.nameKey)}</div>
        <div class="desc">${t(card.descKey)}</div>
        <div class="kind">${card.levelLabel}</div>`;
      div.addEventListener('click', () => {
        audio.play('select');
        this.onCardPick(i);
      });
      box.appendChild(div);
    });
    el('levelup-screen').classList.remove('hidden');
  }

  showEvolution(choices: ClassId[]): void {
    this.currentEvolutions = choices;
    el('evolution-title').textContent = t('evolutionTitle');
    const box = el('evolution-cards');
    box.innerHTML = '';
    choices.forEach((id, i) => {
      const cls = CLASSES[id];
      const div = document.createElement('div');
      div.className = 'card super';
      div.style.borderColor = cls.color;
      div.innerHTML = `
        <div class="key">${i + 1}</div>
        <div class="icon">${cls.icon}</div>
        <div class="kind" style="color:${cls.color}">Lv${cls.tier}</div>
        <div class="name">${t(`class.${id}.name`)}</div>
        <div class="desc">${t(`class.${id}.desc`)}</div>
        <div class="skill-box" style="border-color:${cls.color}55">
          <div class="skill-head" style="color:${cls.color}">
            <span>⚡ ${t('skillLabel')}：${t(`skill.${cls.skill}.name`)}</span>
            <span class="ct">CT ${cls.skillCooldown}s</span>
          </div>
          <div class="skill-desc">${t(`skill.${cls.skill}.desc`)}</div>
        </div>`;
      div.addEventListener('click', () => {
        audio.play('evolve');
        this.onEvolvePick(id);
      });
      box.appendChild(div);
    });
    el('evolution-screen').classList.remove('hidden');
  }

  private relicTitle(r: Relic): string {
    return `${t(`rarity.${relicRarity(r).key}`)} ${t(`relic.${r.baseId}`)}`;
  }

  showResult(info: ResultInfo): void {
    this.hideAll();
    el('result-title').textContent = info.survived ? t('resultSurvived') : t('resultDead');
    (el('result-title') as HTMLElement).style.color = info.survived ? '#5aff8c' : '#ff5470';
    el('death-cause').textContent = info.survived ? '' : t(info.causeKey);

    const mm = Math.floor(info.time / 60);
    const ss = String(Math.floor(info.time % 60)).padStart(2, '0');
    const diff = DIFFICULTIES[info.difficultyIndex] ?? DIFFICULTIES[0];
    const rows: [string, string][] = [
      [t('statDifficulty'), t(diff.nameKey)],
      [t('statScore'), String(info.score)],
      [t('statTime'), `${mm}:${ss}`],
      [t('statKills'), String(info.kills)],
      [t('statLevel'), `Lv ${info.level}`],
      [t('statClass'), t(`class.${info.classId}.name`)],
      [t('resultEssence'), `+${info.essence} 💰`],
    ];
    el('result-stats').innerHTML =
      rows.map(([k, v]) => `<div class="stat-row"><span>${k}</span><span>${v}</span></div>`).join('') +
      (info.newRecord ? `<div class="stat-row" style="color:#ffd24d">${t('newRecord')}</div>` : '');

    // 難易度解放バナー
    el('result-unlock').textContent = info.unlockedNextDifficulty ? t('diffCleared') : '';

    // 発見した遺物
    const relicsBox = el('result-relics');
    if (info.relicsFound.length > 0) {
      relicsBox.innerHTML =
        `<div class="meta-section-title">${t('resultRelics')} ×${info.relicsFound.length}</div>` +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">' +
        info.relicsFound
          .map(
            (r) =>
              `<span class="res-relic" title="${this.relicTitle(r)}" style="filter:drop-shadow(0 0 6px ${relicRarity(r).color})">${relicIcon(r)}</span>`,
          )
          .join('') +
        '</div>';
    } else {
      relicsBox.innerHTML = '';
    }

    // 3秒で再出撃（離脱の意思決定をさせる隙を与えない）
    const btn = el<HTMLButtonElement>('retry-btn');
    btn.disabled = true;
    let count = 3;
    btn.textContent = t('retryIn', { n: count });
    this.retryTimer = window.setInterval(() => {
      count--;
      if (count <= 0) {
        btn.disabled = false;
        btn.textContent = t('retry');
        if (this.retryTimer !== null) {
          clearInterval(this.retryTimer);
          this.retryTimer = null;
        }
      } else {
        btn.textContent = t('retryIn', { n: count });
      }
    }, 1000);

    el('result-screen').classList.remove('hidden');
  }
}
