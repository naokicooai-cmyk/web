// 終盤スモーク：時間を飛ばしてボス・霧・コロッサス・リザルトを検証する
import chromium from '@sparticuz/chromium';
import { chromium as pw } from 'playwright-core';

const errors = [];
const browser = await pw.launch({
  executablePath: await chromium.executablePath(),
  args: chromium.args,
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
// ソフトウェアレンダリングではアニメ中canvasのスクショが時々固まるため非致命扱い
const shot = async (path) => {
  try {
    await page.screenshot({ path, timeout: 20000 });
  } catch {
    console.log(`(screenshot skipped: ${path})`);
  }
};
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
});

const fps = () =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        let c = 0;
        const t0 = performance.now();
        function f() {
          c++;
          if (performance.now() - t0 < 1000) requestAnimationFrame(f);
          else resolve(c);
        }
        requestAnimationFrame(f);
      }),
  );

const stats = () =>
  page.evaluate(() => {
    const s = window.__evolvore.state;
    return {
      mode: s.mode,
      time: Math.round(s.time),
      enemies: s.enemies.length,
      bullets: s.bullets.length,
      gems: s.gems.length,
      particles: s.particles.length,
      level: s.player.level,
      hp: Math.round(s.player.hp),
    };
  });

// モーダルが完全に消えるまで 1 を押し続ける（blur付きオーバーレイは
// ソフトウェアレンダリングのスクリーンショットを固まらせるため）
const skipModals = async (max = 30) => {
  for (let i = 0; i < max; i++) {
    const visible = await page.evaluate(
      () =>
        !document.getElementById('levelup-screen').classList.contains('hidden') ||
        !document.getElementById('evolution-screen').classList.contains('hidden'),
    );
    if (!visible) return;
    await page.keyboard.press('Digit1');
    await page.waitForTimeout(300);
  }
};

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.click('#play-btn');
await page.waitForTimeout(1000);

// プレイヤーを強化して 4:55 へ（マザーワーム直前）
await page.evaluate(() => {
  const g = window.__evolvore;
  const s = g.state;
  s.time = 295;
  s.player.level = 12;
  s.player.classId = 'devourer';
  s.player.weapons.push({ defId: 'orbit', level: 5, timer: 0, angle: 0 });
  s.player.weapons.push({ defId: 'chain', level: 4, timer: 0, angle: 0 });
});
await page.waitForTimeout(6000);
await skipModals();
console.log('worm-time stats:', await stats(), 'fps:', await fps());
const worm = await page.evaluate(() => {
  const s = window.__evolvore.state;
  return { spawned: s.wormSpawned, chain: s.wormChain.length };
});
console.log('worm:', worm);
await shot('scripts/shot-worm.png');

// 8:40 へ：霧収縮
await page.evaluate(() => {
  window.__evolvore.state.time = 520;
  // 検証用：終盤の地獄でも死なないよう耐久を盛る
  window.__evolvore.state.player.maxHp = 99999;
  window.__evolvore.state.player.hp = 99999;
});
await page.waitForTimeout(3000);
await skipModals();
console.log('fog stats:', await stats(), 'fps:', await fps());
await shot('scripts/shot-fog.png');

// 9:41 へ：コロッサス
await page.evaluate(() => {
  window.__evolvore.state.time = 581;
  window.__evolvore.state.player.hp = 99999;
});
await page.waitForTimeout(3000);
console.log('colossus stats:', await stats(), 'fps:', await fps());
const late = await page.evaluate(() => {
  const s = window.__evolvore.state;
  return { colossus: s.colossusSpawned, fog: Math.round(s.fogRadius), botSpawned: s.bot.spawned };
});
console.log('late:', late);
await shot('scripts/shot-colossus.png');

// 10:00 超え → リザルト
await page.evaluate(() => {
  window.__evolvore.state.time = 600;
  window.__evolvore.state.player.hp = 99999;
});
await page.waitForTimeout(2000);
const resultVisible = await page.evaluate(
  () => !document.getElementById('result-screen').classList.contains('hidden'),
);
console.log('result visible:', resultVisible);
await shot('scripts/shot-result.png');

await browser.close();
if (errors.length > 0) {
  console.error('ERRORS:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('lategame smoke OK');
