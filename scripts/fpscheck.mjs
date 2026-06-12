import chromium from '@sparticuz/chromium';
import { chromium as pw } from 'playwright-core';
const browser = await pw.launch({ executablePath: await chromium.executablePath(), args: chromium.args, headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.click('#play-btn');
await page.waitForTimeout(500);
const fps = () => page.evaluate(() => new Promise((res) => {
  let c = 0; const t0 = performance.now();
  const f = () => { c++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(c / 2); };
  requestAnimationFrame(f);
}));
console.log('early fps:', await fps());
await page.evaluate(() => {
  const s = window.__evolvore.state;
  s.time = 400; s.player.level = 22; s.player.classId = 'venom';
  s.player.maxHp = 99999; s.player.hp = 99999;
  s.player.weapons = [
    { defId: 'guillotine', level: 1, timer: 0, angle: 0 },
    { defId: 'mist', level: 6, timer: 0, angle: 0 },
    { defId: 'chain', level: 5, timer: 0, angle: 0 },
    { defId: 'ricochet', level: 5, timer: 0, angle: 0 },
    { defId: 'spine', level: 6, timer: 0, angle: 0 },
  ];
});
await page.waitForTimeout(6000);
for (let i = 0; i < 20; i++) {
  const v = await page.evaluate(() =>
    !document.getElementById('levelup-screen').classList.contains('hidden') ||
    !document.getElementById('evolution-screen').classList.contains('hidden'));
  if (!v) break;
  await page.keyboard.press('Digit1');
  await page.waitForTimeout(200);
}
const stats = await page.evaluate(() => {
  const s = window.__evolvore.state;
  return { enemies: s.enemies.length, bullets: s.bullets.length, gems: s.gems.length, particles: s.particles.length };
});
console.log('combat stats:', stats, 'combat fps:', await fps());
await browser.close();
