// Screenshots through a move (FNAF4-style transition)
const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  const page = await browser.newPage(); const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.setViewport({ width: 640, height: 360 });
  await page.evaluateOnNewDocument(() => { localStorage.clear(); window.__AS_NOCALL = true; });
  await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.getElementById('load-go').style.visibility === 'visible', { timeout: 60000 });
  const click = (sel) => page.evaluate((s) => document.querySelector(s).click(), sel);
  await click('#load-go'); await sleep(600); await click('#warn-go'); await sleep(800);
  const shots = async (tag, n, gap) => { for (let i = 0; i < n; i++) { await page.screenshot({ path: `/tmp/mv/${tag}_${String(i).padStart(2, '0')}.png` }); await sleep(gap); } };
  await page.evaluate(() => { const U = window.__AS_UI; U.save.pro.c1 = U.save.pro.c2 = true; U.startNight(0, 1); }); await sleep(800); await click('#intro-go'); await sleep(2500);
  await page.evaluate(() => window.__AS_UI.game.act('go', 'door')); await shots('a', 12, 70);
  await sleep(500);
  await page.evaluate(() => window.__AS_UI.startNight(1, 2)); await sleep(800); await click('#intro-go'); await sleep(2500);
  await page.evaluate(() => window.__AS_UI.game.act('go', 'kitchen')); await shots('b', 14, 110);
  console.log('ERRORS:', errors.join('\n') || 'none'); await browser.close();
})();
