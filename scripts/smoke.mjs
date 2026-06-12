// 実機スモークテスト：起動 → PLAY → 数秒プレイ → スクリーンショット
// 使い方: node scripts/smoke.mjs（事前に vite preview --port 4173 を起動しておく）
import chromium from '@sparticuz/chromium';
import { chromium as pw } from 'playwright-core';

const errors = [];
const browser = await pw.launch({
  executablePath: await chromium.executablePath(),
  args: chromium.args,
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
});
// ソフトウェアレンダリングではスクショが時々固まるため非致命扱い
const shot = async (path) => {
  try {
    await page.screenshot({ path, timeout: 20000 });
    console.log('shot ok:', path);
  } catch {
    console.log(`(screenshot skipped: ${path})`);
  }
};

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await shot('scripts/shot-title.png');

// タイトル表示の検証
const logo = await page.textContent('.logo');
console.log('logo:', logo);

// PLAY
await page.click('#play-btn');
await page.waitForTimeout(4000);
await shot('scripts/shot-play-4s.png');

// スキル発動＋移動（マウスを動かす）
await page.mouse.move(900, 300);
await page.keyboard.press('Space');
await page.waitForTimeout(4000);
await page.mouse.move(400, 600);
await page.waitForTimeout(4000);
await shot('scripts/shot-play-12s.png');

// レベルアップモーダルが出ていたら 1 を押して進める（最大5回）
for (let i = 0; i < 5; i++) {
  const visible = await page.evaluate(
    () => !document.getElementById('levelup-screen').classList.contains('hidden'),
  );
  if (visible) {
    await page.keyboard.press('Digit1');
    await page.waitForTimeout(1500);
  } else {
    await page.waitForTimeout(1500);
  }
}
await shot('scripts/shot-play-20s.png');

// ゲーム内状態をのぞく（HUD描画が動いているかは目視用スクショで）
const overlayState = await page.evaluate(() => ({
  title: document.getElementById('title-screen').classList.contains('hidden'),
  levelup: document.getElementById('levelup-screen').classList.contains('hidden'),
  result: document.getElementById('result-screen').classList.contains('hidden'),
}));
console.log('overlays hidden:', overlayState);

await browser.close();
if (errors.length > 0) {
  console.error('ERRORS:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('smoke OK');
