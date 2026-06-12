// ビジュアル確認用：濃い戦闘シーンを作ってスクリーンショットを撮る
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

import { writeFileSync } from 'node:fs';
// コンポジタを介さず canvas から直接画像を抜く（ヘッドレスで確実）
const shot = async (path) => {
  const dataUrl = await page.evaluate(
    () => document.getElementById('game').toDataURL('image/png'),
  );
  writeFileSync(path, Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log('shot ok:', path);
};

const clearModals = async () => {
  for (let i = 0; i < 30; i++) {
    const visible = await page.evaluate(
      () =>
        !document.getElementById('levelup-screen').classList.contains('hidden') ||
        !document.getElementById('evolution-screen').classList.contains('hidden'),
    );
    if (!visible) return;
    await page.keyboard.press('Digit1');
    await page.waitForTimeout(250);
  }
};

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.click('#play-btn');
await page.waitForTimeout(500);

// 中盤の強ビルド：捕食種＋ギロチン＋ミスト＋チェイン＋リコシェ
await page.evaluate(() => {
  const s = window.__evolvore.state;
  s.time = 400;
  s.player.level = 22;
  s.player.classId = 'venom';
  s.player.mass = 60;
  s.player.maxHp = 99999;
  s.player.hp = 99999;
  s.player.weapons = [
    { defId: 'guillotine', level: 1, timer: 0, angle: 0 },
    { defId: 'mist', level: 6, timer: 0, angle: 0 },
    { defId: 'chain', level: 5, timer: 0, angle: 0 },
    { defId: 'ricochet', level: 5, timer: 0, angle: 0 },
    { defId: 'spine', level: 6, timer: 0, angle: 0 },
  ];
});
await page.waitForTimeout(5000);
await clearModals();
await page.mouse.move(820, 320);
await page.waitForTimeout(1200);
await clearModals();
await shot('scripts/shot-combat.png');

// 進化モーダル
await page.evaluate(() => {
  window.__evolvore.state.pendingEvolution = true;
});
await page.waitForTimeout(800);
await shot('scripts/shot-evolution.png');
await clearModals();

// 終盤：霧＋コロッサス
await page.evaluate(() => {
  const s = window.__evolvore.state;
  s.time = 582;
  s.player.hp = 99999;
});
await page.waitForTimeout(4000);
await clearModals();
await shot('scripts/shot-endgame.png');

await browser.close();
if (errors.length > 0) {
  console.error('ERRORS:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('capture done');
