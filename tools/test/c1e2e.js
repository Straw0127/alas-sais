// Plays all five Chapter 1 nights through the UI with the sim bot at 8x, then checks every menu state.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const OUT = __dirname + '/shots4'; fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const BOT = fs.readFileSync(__dirname + '/sim1.js', 'utf8').split('function run(')[0].replace("const C1 = require('../src/logic1.js');", '').replace('const DT = 1 / 30;', 'var DT = 1 / 30;');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  const page = await browser.newPage(); const errors = []; const log = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_TUNNEL/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push('HTTP ' + r.status() + ' ' + r.url()); });
  await page.setViewport({ width: 1280, height: 720 });
  await page.evaluateOnNewDocument(() => { localStorage.clear(); window.__AS_NOCALL = true; });
  await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.getElementById('load-go').style.visibility === 'visible', { timeout: 60000 });
  await page.click('#load-go'); await sleep(800);
  await page.evaluate(BOT + '; window.__bot = bot;');
  try {
    for (let n = 0; n < 5; n++) {
      await page.evaluate((n) => { window.__AS_SPEED = 8; window.__AS_UI.startNight(n, 1); }, n);
      await sleep(300); await page.click('#intro-go'); await sleep(600);
      await page.evaluate(() => { const st = { cool: 0 }; const sk = { react: 0.3, barang: 2, door: 2, curtain: 2, holdAt: 2 }; clearInterval(window.__bi); window.__bi = setInterval(() => { const g = window.__AS_UI.game; if (g && !g.over) window.__bot(g, sk, st); }, 20); });
      await sleep(9000); await page.screenshot({ path: OUT + '/n' + (n + 1) + '_mid.png' });
      const res = await page.waitForFunction(() => ['scr-win', 'scr-over', 'scr-end'].find(id => document.getElementById(id).classList.contains('show')), { timeout: 120000, polling: 300 }).then(h => h.jsonValue()).catch(() => 'timeout');
      await page.evaluate(() => clearInterval(window.__bi));
      await sleep(400); await page.screenshot({ path: OUT + '/n' + (n + 1) + '_end.png' });
      log.push('night ' + (n + 1) + ': ' + res + ' save ' + JSON.stringify(await page.evaluate(() => window.__AS_UI.save.prog)));
    }
    // menu states by progress
    for (const [name, prog] of [['blink', { c1: 2, c2: 0, c3: 0 }], ['torch', { c1: 4, c2: 0, c3: 0 }], ['day', { c1: 5, c2: 5, c3: 7 }]]) {
      await page.evaluate((p) => { Object.assign(window.__AS_UI.save.prog, p); window.__AS_UI.toMenu(); }, prog);
      await sleep(2500); await page.screenshot({ path: OUT + '/menu_' + name + '.png' });
      log.push('menu ' + name + ': ' + await page.evaluate(() => [document.getElementById('mbg-on').src.split('/').pop(), document.getElementById('mbg-lit').style.opacity].join(' ')));
    }
    await page.click('#m-nights'); await sleep(500); await page.screenshot({ path: OUT + '/chapters.png' });
    await page.click('#c-back').catch(() => {}); await page.evaluate(() => window.__AS_UI.show('scr-credits')); await sleep(300); await page.screenshot({ path: OUT + '/credits.png' });
  } catch (e) { log.push('CRASH ' + e.message); }
  console.log(log.join('\n')); console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})();
