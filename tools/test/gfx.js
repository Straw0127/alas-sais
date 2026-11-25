// Settings: graphics levels, reduce motion, save code round trip; screenshots of each.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const OUT = __dirname + '/shots7'; fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  const page = await browser.newPage(); const errors = []; const log = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push('HTTP ' + r.status() + ' ' + r.url()); });
  await page.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument(() => { if (!sessionStorage.getItem('x')) { localStorage.clear(); sessionStorage.setItem('x', '1'); } window.__AS_NOCALL = true; });
  await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.getElementById('load-go').style.visibility === 'visible', { timeout: 60000 });
  const click = (sel) => page.evaluate((s) => document.querySelector(s).click(), sel);
  await click('#load-go'); await sleep(800);
  await click('#m-settings'); await sleep(500); await page.screenshot({ path: OUT + '/settings.png' });
  for (const g of ['low', 'high', 'medium']) {
    await click('[data-gfx="' + g + '"]'); await sleep(200);
    log.push(g + ': ' + JSON.stringify(await page.evaluate(() => ({ grain: document.getElementById('grain').style.opacity, vig: document.getElementById('vig').style.display, dust: document.getElementById('dust').style.display }))));
  }
  await click('#t-mot'); await sleep(100); log.push('motion: ' + await page.evaluate(() => document.getElementById('t-mot').textContent));
  // save code: fake progress, copy code, wipe, load it back
  const code = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('alassais')); return document.getElementById('s-code').value; });
  log.push('code: ' + code.slice(0, 16) + '…');
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('alassais')); s.prog = { c1: 5, c2: 2, c3: 0 }; localStorage.setItem('alassais', JSON.stringify(s)); });
  await page.reload({ waitUntil: 'networkidle0' }); await page.waitForFunction(() => document.getElementById('load-go').style.visibility === 'visible');
  await click('#load-go'); await sleep(600);
  log.push('after reload (autosaved progress kept): ' + JSON.stringify(JSON.parse(await page.evaluate(() => localStorage.getItem('alassais'))).prog));
  await click('#m-settings'); await sleep(300);
  const code2 = await page.evaluate(() => document.getElementById('s-code').value);
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('alassais')); s.prog = { c1: 0, c2: 0, c3: 0 }; localStorage.setItem('alassais', JSON.stringify(s)); });
  await page.evaluate((c) => { document.getElementById('s-code').value = c; document.getElementById('s-load').click(); }, code2); await sleep(200);
  log.push('loaded code: ' + await page.evaluate(() => document.getElementById('s-code-msg').textContent) + ' ' + JSON.stringify(JSON.parse(await page.evaluate(() => localStorage.getItem('alassais'))).prog));
  await page.evaluate(() => { document.getElementById('s-code').value = 'garbage'; document.getElementById('s-load').click(); }); log.push('bad code: ' + await page.evaluate(() => document.getElementById('s-code-msg').textContent));
  // low graphics in game: pictures from the half-size folder
  await click('[data-gfx="low"]'); await click('#t-mot');
  await page.evaluate(() => window.__AS_UI.startNight ? window.__AS_UI.startNight(0, 1) : null); await sleep(300);
  await click('#s-back'); await sleep(300);
  await page.evaluate(() => document.querySelector('#night-list') && 0);
  await click('#m-nights'); await sleep(300); await page.evaluate(() => document.querySelector('.chcard button').click()); await sleep(1500);
  await page.evaluate(() => { const b = document.querySelector('#scr-intro .cta, #intro-go'); if (b) b.click(); }); await sleep(1500);
  log.push('low bg: ' + await page.evaluate(() => (document.getElementById('bgA').src + ' | ' + document.getElementById('bgB').src).replace(/http:\/\/127.0.0.1:8765\//g, '')));
  await page.screenshot({ path: OUT + '/low_game.png' });
  console.log(log.join('\n')); console.log('ERRORS: ' + (errors.length ? errors.join('\n') : 'none'));
  await browser.close();
})();
