// End-to-end test in headless Chrome: menus, a full night played by a bot through the real UI, a death, settings, mobile layout.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const BOT = fs.readFileSync(__dirname + '/sim.js', 'utf8').split('function run(')[0].replace("const AS = require('../src/logic.js');", '').replace('const DT = 1 / 30;', 'var DT = 1 / 30;');
const URL = process.argv[2] || 'http://127.0.0.1:8765/index.html';
const OUT = __dirname + '/shots';
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--mute-audio'] });
  const errors = [];
  const page = await browser.newPage();
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('requestfailed', r => { if (!r.url().includes('fonts.g')) errors.push('requestfailed: ' + r.url()); }); page.on('response', r => { if (r.status() >= 400) errors.push('HTTP ' + r.status() + ' ' + r.url()); });
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.getElementById('load-go').style.visibility === 'visible', { timeout: 30000 });
  await page.screenshot({ path: OUT + '/01_load.png' });
  await page.evaluate(() => { window.__AS_NOCALL = true; }); await page.click('#load-go'); await sleep(600);
  await page.screenshot({ path: OUT + '/02_menu.png' });
  await page.click('#m-settings'); await sleep(300); await page.screenshot({ path: OUT + '/03_settings.png' });
  await page.click('#s-back'); await sleep(200);
  // switch to Filipino and back
  await page.click('.lang .langbtn[data-lang="fil"]'); await sleep(200); await page.screenshot({ path: OUT + '/04_menu_fil.png' });
  await page.click('.lang .langbtn[data-lang="en"]'); await sleep(200);
  await page.click('#m-new'); await sleep(400); await page.screenshot({ path: OUT + '/05_intro.png' });
  await page.click('#intro-go'); await sleep(1500); await page.screenshot({ path: OUT + '/06_night1.png' });

  // play nights 1..3 with the bot through the UI layer at 8x speed
  await page.evaluate(BOT);
  async function playNight(label, skill, speed) {
    await page.evaluate((skill, speed) => {
      window.__AS_SPEED = speed;
      const ui = window.__AS_UI; const mem = {};
      // route the bot through the UI so every handler runs
      window.__botTimer = setInterval(() => {
        const g = ui.game; if (!g || g.over) return;
        const proxy = Object.create(g);
        proxy.act = (a, arg) => ui.act(a, arg);
        proxy.hold = (w, on) => ui.hold(w, on);
        try { bot(proxy, mem, skill); } catch (e) { console.error('bot ' + e.message); }
      }, 1000 / 30 / speed * 4);
    }, skill, speed);
    const res = await page.waitForFunction(() => {
      const s = ['scr-win', 'scr-over', 'scr-end'].find(id => document.getElementById(id).classList.contains('show'));
      return s || false;
    }, { timeout: 240000, polling: 500 }).then(h => h.jsonValue());
    await page.evaluate(() => clearInterval(window.__botTimer));
    await page.screenshot({ path: OUT + '/' + label + '_' + res + '.png' });
    return res;
  }
  const results = [];
  // mid-night screenshots of interesting states
  results.push(await playNight('n1', { react: 0.35, miss: 0, check: 12 }, 8));
  for (let n = 2; n <= 5; n++) {
    if (results[results.length - 1] === 'scr-win') { await page.click('#w-next'); } else { await page.click('#o-retry'); }
    await sleep(400); await page.click('#intro-go'); await sleep(1200);
    await page.screenshot({ path: OUT + '/n' + n + '_start.png' });
    results.push(await playNight('n' + n, { react: 0.35, miss: 0, check: 12 }, 8));
  }
  console.log('night results', results);

  // death screen: idle on night 2
  await page.evaluate(() => { window.__AS_SPEED = 12; window.__AS_UI.startNight(1); });
  await sleep(300); await page.click('#intro-go');
  const died = await page.waitForFunction(() => document.getElementById('scr-over').classList.contains('show'), { timeout: 180000, polling: 300 }).then(() => true).catch(() => false);
  await sleep(300); await page.screenshot({ path: OUT + '/90_gameover.png' });
  console.log('idle player died:', died);
  // scare frame mid-animation
  await page.evaluate(() => { window.__AS_SPEED = 1; window.__AS_UI.startNight(0); });
  await sleep(300); await page.click('#intro-go'); await sleep(800);
  // pause
  await page.click('#pauseBtn'); await sleep(300); await page.screenshot({ path: OUT + '/91_pause.png' });
  await page.click('#p-resume'); await sleep(300);
  // visit every room and toggle things
  for (const r of ['hall', 'living', 'kitchen', 'curtain', 'bedroom']) {
    await page.evaluate(r => window.__AS_UI.act('go', r), r);
    await sleep(2600);
    await page.screenshot({ path: OUT + '/92_room_' + r + '.png' });
  }
  // mobile landscape
  const m = await browser.newPage();
  m.on('pageerror', e => errors.push('mobile pageerror: ' + e.message));
  await m.emulate({ viewport: { width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: true }, userAgent: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Mobile Safari/537.36' });
  await m.goto(URL, { waitUntil: 'networkidle0' });
  await m.waitForFunction(() => document.getElementById('load-go').style.visibility === 'visible', { timeout: 30000 });
  await m.tap('#load-go'); await sleep(500); await m.tap('#m-new'); await sleep(400); await m.tap('#intro-go'); await sleep(1500); await m.tap('#ph-dec'); await sleep(1200);
  await m.screenshot({ path: OUT + '/95_mobile_game.png' });
  // touch-hold the door button with a real touch
  await m.evaluate(() => window.__AS_UI.act('door'));
  await sleep(600);
  const box = await m.evaluate(() => { const b = [...document.querySelectorAll('#hot .spot.hold')][0]; if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  const cdp = await m.target().createCDPSession();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x, y: box.y }] });
  await sleep(400);
  const holding = await m.evaluate(() => window.__AS_UI.game.p.holdDoor);
  await m.screenshot({ path: OUT + '/96_mobile_door.png' });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(300);
  const released = !(await m.evaluate(() => window.__AS_UI.game.p.holdDoor));
  console.log('touch hold works:', holding, 'released:', released);
  // portrait prompt
  await m.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await sleep(500); await m.screenshot({ path: OUT + '/97_mobile_portrait.png' });

  // ending path: jump to the end of night 5
  await page.bringToFront();
  await page.evaluate(() => { window.__AS_SPEED = 1; window.__AS_UI.startNight(4); });
  await sleep(300); await page.click('#intro-go'); await sleep(800);
  await page.evaluate(() => { const g = window.__AS_UI.game; g.time = g.hourSec * 6 - 0.5; });
  const ended = await page.waitForFunction(() => document.getElementById('scr-end').classList.contains('show'), { timeout: 10000, polling: 200 }).then(() => true).catch(() => false);
  await page.screenshot({ path: OUT + '/98_ending.png' });
  console.log('ending screen:', ended);
  await page.click('#e-menu'); await sleep(300); await page.screenshot({ path: OUT + '/99_credits.png' });
  console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})().catch(e => { console.error('TEST CRASH', e); process.exit(1); });
