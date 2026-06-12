import { audio } from './core/audio';
import { detectLang, setLang } from './data/i18n';
import { Game } from './game';

setLang(detectLang());

const canvas = document.getElementById('game') as HTMLCanvasElement;
const game = new Game(canvas);
game.toTitle();

// デバッグ/スモークテスト用フック（コンソールから時間を飛ばせる）
(window as unknown as { __evolvore?: Game }).__evolvore = game;

// ブラウザの自動再生制限：最初の操作で AudioContext を起こす
const unlock = () => {
  audio.unlock();
  window.removeEventListener('pointerdown', unlock);
  window.removeEventListener('keydown', unlock);
};
window.addEventListener('pointerdown', unlock);
window.addEventListener('keydown', unlock);

// 固定タイムステップ（60Hz）＋ accumulator。描画は毎フレーム
const STEP = 1 / 60;
let acc = 0;
let last = performance.now();

function frame(now: number): void {
  acc += Math.min((now - last) / 1000, 0.25); // タブ復帰時の暴走防止
  last = now;
  while (acc >= STEP) {
    game.update(STEP);
    acc -= STEP;
  }
  game.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
