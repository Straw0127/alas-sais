// Hiding behind the sofa: you face the TV, whatever way you were looking
const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  const page = await browser.newPage(); const errors = [], log = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.setViewport({ width: 1280, height: 720 });
  await page.evaluateOnNewDocument(() => { localStorage.clear(); window.__AS_NOCALL = true; });
  await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.getElementById('load-go').style.visibility === 'visible', { timeout: 60000 });
  const click = (sel) => page.evaluate((s) => document.querySelector(s).click(), sel);
  await click('#load-go'); await sleep(600); await click('#warn-go'); await sleep(800);
  await page.evaluate(() => { window.__AS_UI.save.pro.c2 = true; window.__AS_UI.startNight(1, 2); }); await sleep(800); await click('#intro-go'); await sleep(2500);
  await page.evaluate(() => { const g = window.__AS_UI.game; g.p.room = 'living'; window.__AS_UI.pan.t = 0; }); await sleep(1500);
  await page.screenshot({ path: '/tmp/s_before.png' });
  await page.evaluate(() => window.__AS_UI.game.act('hide')); await sleep(1800);
  log.push('hidden: ' + await page.evaluate(() => window.__AS_UI.game.p.hidden + ' pan ' + window.__AS_UI.pan.x.toFixed(2)));
  await page.screenshot({ path: '/tmp/s_hidden.png' });
  await page.mouse.move(900, 360); await page.mouse.down(); await page.mouse.move(300, 360, { steps: 8 }); await page.mouse.up(); await sleep(600);
  log.push('after drag pan ' + await page.evaluate(() => window.__AS_UI.pan.x.toFixed(2)));
  await page.evaluate(() => window.__AS_UI.game.act('hide')); await sleep(1800);
  log.push('unhid: ' + await page.evaluate(() => window.__AS_UI.game.p.hidden + ' pan ' + window.__AS_UI.pan.x.toFixed(2)));
  console.log(log.join('\n')); console.log('ERRORS:', errors.join('\n') || 'none'); await browser.close();
})();
