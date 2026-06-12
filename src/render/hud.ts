import { CLASSES } from '../data/classes';
import { t } from '../data/i18n';
import { PASSIVES } from '../data/passives';
import { WEAPONS } from '../data/weapons';
import { MATCH_DURATION } from '../data/waves';
import { WORLD_H, WORLD_W, type GameState } from '../state';

const HINT_KEYS = ['hint1', 'hint2', 'hint3', 'hint4', 'hint5'];

export function renderHud(state: GameState, ctx: CanvasRenderingContext2D): void {
  const cam = state.camera;
  const w = cam.viewW;
  const h = cam.viewH;
  const p = state.player;

  ctx.textBaseline = 'alphabetic';

  // ---- 残り時間（上中央） ----
  const remain = Math.max(0, MATCH_DURATION - state.time);
  const mm = Math.floor(remain / 60);
  const ss = Math.floor(remain % 60);
  ctx.textAlign = 'center';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillStyle = remain < 90 ? '#ff5470' : '#e8ecff';
  ctx.fillText(`${mm}:${String(ss).padStart(2, '0')}`, w / 2, 42);

  // ---- スコア・撃破（左上） ----
  ctx.textAlign = 'left';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#ffd24d';
  ctx.fillText(`${t('statScore')}: ${p.score}`, 16, 30);
  ctx.fillStyle = '#e8ecff';
  ctx.fillText(`${t('statKills')}: ${p.kills}`, 16, 52);

  drawMinimap(state, ctx, w - 156, 16, 140);
  drawBars(state, ctx, w, h);
  drawSlots(state, ctx, h);
  drawSkill(state, ctx, w, h);
  drawAnnouncements(state, ctx, w, h);
  drawHints(state, ctx, w, h);
}

function drawMinimap(
  state: GameState,
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
): void {
  const sx = size / WORLD_W;
  const sy = size / WORLD_H;
  ctx.fillStyle = 'rgba(10, 12, 26, 0.75)';
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = 'rgba(125, 249, 255, 0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, size, size);

  // 霧（収縮開始後のみ）
  if (state.fogAnnounced) {
    ctx.strokeStyle = 'rgba(196, 125, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, state.fogRadius * sx, 0, Math.PI * 2);
    ctx.stroke();
  }

  // エリート/ボス
  for (const e of state.enemies) {
    if (!e.alive) continue;
    if (e.type === 'elite') {
      ctx.fillStyle = '#ffd24d';
      ctx.fillRect(x + e.pos.x * sx - 2, y + e.pos.y * sy - 2, 4, 4);
    } else if (e.type === 'worm_head' || e.type === 'colossus') {
      ctx.fillStyle = '#c47dff';
      ctx.fillRect(x + e.pos.x * sx - 3, y + e.pos.y * sy - 3, 6, 6);
    }
  }
  // ボット（赤い点＝デカい脅威）
  const bot = state.bot;
  if (bot.alive && bot.spawned && bot.respawnTimer <= 0) {
    ctx.fillStyle = '#ff5470';
    ctx.beginPath();
    ctx.arc(x + bot.pos.x * sx, y + bot.pos.y * sy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // 自分
  ctx.fillStyle = '#7df9ff';
  ctx.beginPath();
  ctx.arc(x + state.player.pos.x * sx, y + state.player.pos.y * sy, 3, 0, Math.PI * 2);
  ctx.fill();
}

function roundedBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ratio: number,
  from: string,
  to: string,
): void {
  ctx.fillStyle = 'rgba(4, 6, 16, 0.75)';
  ctx.beginPath();
  ctx.roundRect(x - 1, y - 1, w + 2, h + 2, h / 2 + 1);
  ctx.fill();
  if (ratio > 0.01) {
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, from);
    grad.addColorStop(1, to);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, w * Math.min(1, ratio), h, h / 2);
    ctx.fill();
    // 上面ハイライト
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 1, Math.max(0, w * Math.min(1, ratio) - 4), h * 0.32, h * 0.16);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x - 1, y - 1, w + 2, h + 2, h / 2 + 1);
  ctx.stroke();
}

function drawBars(state: GameState, ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const p = state.player;
  const bw = Math.min(420, w - 240);
  const x = (w - bw) / 2;

  // XPバー
  roundedBar(ctx, x, h - 30, bw, 8, p.xp / p.xpNext, '#aefcff', '#36a8c4');

  // HPバー
  const hpRatio = p.hp / p.maxHp;
  const hpColors: [string, string] =
    hpRatio > 0.5 ? ['#8cffb4', '#1fa85a'] : hpRatio > 0.25 ? ['#ffe28c', '#c49a1f'] : ['#ff8ca0', '#c41f3e'];
  roundedBar(ctx, x, h - 48, bw, 14, hpRatio, hpColors[0], hpColors[1]);

  ctx.textAlign = 'center';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = '#0a0a14';
  ctx.fillText(`${Math.ceil(p.hp)} / ${p.maxHp}`, x + bw / 2, h - 37);

  // レベルとクラス
  ctx.textAlign = 'left';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#e8ecff';
  ctx.fillText(`${t('lvLabel')} ${p.level}`, x + bw + 12, h - 36);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = CLASSES[p.classId].color;
  ctx.fillText(t(`class.${p.classId}.name`), x + bw + 12, h - 20);
}

function drawSlots(state: GameState, ctx: CanvasRenderingContext2D, h: number): void {
  const p = state.player;
  const cell = 34;
  const x0 = 16;
  const y0 = h - 2 * (cell + 6) - 14;
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 武器6枠（上段）
  for (let i = 0; i < 6; i++) {
    const x = x0 + i * (cell + 6);
    ctx.fillStyle = 'rgba(10, 12, 26, 0.7)';
    ctx.fillRect(x, y0, cell, cell);
    ctx.strokeStyle = 'rgba(125, 249, 255, 0.3)';
    ctx.strokeRect(x, y0, cell, cell);
    const w = p.weapons[i];
    if (w) {
      ctx.fillText(WEAPONS[w.defId].icon, x + cell / 2, y0 + cell / 2);
      if (!WEAPONS[w.defId].isSuper) {
        ctx.fillStyle = '#7df9ff';
        ctx.fillRect(x + 2, y0 + cell - 4, (cell - 4) * (w.level / WEAPONS[w.defId].maxLevel), 2);
      } else {
        ctx.fillStyle = '#ffd24d';
        ctx.fillRect(x + 2, y0 + cell - 4, cell - 4, 2);
      }
    }
  }
  // パッシブ6枠（下段）
  const passives = Object.entries(p.passives);
  for (let i = 0; i < 6; i++) {
    const x = x0 + i * (cell + 6);
    const y = y0 + cell + 6;
    ctx.fillStyle = 'rgba(10, 12, 26, 0.7)';
    ctx.fillRect(x, y, cell, cell);
    ctx.strokeStyle = 'rgba(196, 125, 255, 0.3)';
    ctx.strokeRect(x, y, cell, cell);
    const entry = passives[i];
    if (entry) {
      ctx.fillText(PASSIVES[entry[0] as keyof typeof PASSIVES].icon, x + cell / 2, y + cell / 2);
      ctx.fillStyle = '#c47dff';
      ctx.fillRect(x + 2, y + cell - 4, (cell - 4) * ((entry[1] ?? 0) / 5), 2);
    }
  }
  ctx.textBaseline = 'alphabetic';
}

function drawSkill(state: GameState, ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const p = state.player;
  const cls = CLASSES[p.classId];
  const x = w - 64;
  const y = h - 64;
  const r = 26;
  ctx.fillStyle = 'rgba(10, 12, 26, 0.7)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  const ratio = p.skillCooldown > 0 ? p.skillTimer / (p.skillCooldown * p.mods.cooldownMul) : 0;
  if (ratio > 0) {
    ctx.fillStyle = 'rgba(125, 249, 255, 0.25)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + (1 - ratio) * Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  } else {
    // 発動可能：パルスする光で「押せ」と伝える
    const pulse = 0.3 + (Math.sin(state.time * 5) * 0.5 + 0.5) * 0.2;
    ctx.fillStyle = `rgba(125, 249, 255, ${pulse})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = ratio > 0 ? 'rgba(255,255,255,0.3)' : '#7df9ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '20px sans-serif';
  ctx.fillText(cls.icon, x, y);
  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#9aa3cc';
  ctx.fillText(t(`skill.${cls.skill}.name`), x, y + r + 12);
  ctx.textBaseline = 'alphabetic';
}

function drawAnnouncements(state: GameState, ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.textAlign = 'center';
  let y = h * 0.3;
  for (const a of state.announcements) {
    const alpha = Math.min(1, a.ttl / 0.5) * Math.min(1, (a.maxTtl - a.ttl) * 4 + 0.2);
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.font = a.big ? 'bold 30px sans-serif' : 'bold 18px sans-serif';
    ctx.fillStyle = a.big ? '#ffd24d' : '#e8ecff';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 4;
    ctx.strokeText(a.text, w / 2, y);
    ctx.fillText(a.text, w / 2, y);
    y += a.big ? 42 : 28;
  }
  ctx.globalAlpha = 1;
}

/** 開始直後のチュートリアル5行を1行ずつ */
function drawHints(state: GameState, ctx: CanvasRenderingContext2D, w: number, h: number): void {
  if (state.hintIndex >= HINT_KEYS.length) return;
  const alpha = Math.min(1, state.hintTimer) * Math.min(1, 6 - state.hintTimer);
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.textAlign = 'center';
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#9ae8ff';
  ctx.fillText(t(HINT_KEYS[state.hintIndex]), w / 2, h * 0.72);
  ctx.globalAlpha = 1;
}
