import { audio } from '../core/audio';
import { CLASSES } from '../data/classes';
import { getLang, setLang, t, type Lang } from '../data/i18n';
import type { ClassId } from '../types';
import type { ResultInfo } from '../state';
import type { DraftCard } from '../systems/levelUp';
import { loadRanking } from '../systems/meta';

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

export class UIOverlays {
  onPlay: () => void = () => {};
  onCardPick: (index: number) => void = () => {};
  onEvolvePick: (id: ClassId) => void = () => {};
  onRetry: () => void = () => {};
  onToTitle: () => void = () => {};

  private currentCards: DraftCard[] = [];
  private currentEvolutions: ClassId[] = [];
  private retryTimer: number | null = null;

  init(): void {
    el('play-btn').addEventListener('click', () => {
      audio.unlock();
      audio.play('select');
      this.onPlay();
    });
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
    for (const id of ['title-screen', 'levelup-screen', 'evolution-screen', 'result-screen']) {
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
        <div class="desc">⚡ ${t(`skill.${cls.skill}.name`)} — ${t(`skill.${cls.skill}.desc`)}</div>`;
      div.addEventListener('click', () => {
        audio.play('evolve');
        this.onEvolvePick(id);
      });
      box.appendChild(div);
    });
    el('evolution-screen').classList.remove('hidden');
  }

  showResult(info: ResultInfo): void {
    this.hideAll();
    el('result-title').textContent = info.survived ? t('resultSurvived') : t('resultDead');
    (el('result-title') as HTMLElement).style.color = info.survived ? '#5aff8c' : '#ff5470';
    el('death-cause').textContent = info.survived ? '' : t(info.causeKey);

    const mm = Math.floor(info.time / 60);
    const ss = String(Math.floor(info.time % 60)).padStart(2, '0');
    const rows: [string, string][] = [
      [t('statScore'), String(info.score)],
      [t('statTime'), `${mm}:${ss}`],
      [t('statKills'), String(info.kills)],
      [t('statLevel'), `Lv ${info.level}`],
      [t('statClass'), t(`class.${info.classId}.name`)],
    ];
    el('result-stats').innerHTML =
      rows.map(([k, v]) => `<div class="stat-row"><span>${k}</span><span>${v}</span></div>`).join('') +
      (info.newRecord ? `<div class="stat-row" style="color:#ffd24d">${t('newRecord')}</div>` : '');

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
