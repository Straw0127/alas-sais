const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--mute-audio'] });
  const page = await browser.newPage(); const errors = []; const log = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_TUNNEL|Failed to load/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument(() => { localStorage.clear(); });
  await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.getElementById('load-go').style.visibility === 'visible', { timeout: 60000 });
  try {
    await page.click('#load-go'); await sleep(600); await page.click('#warn-go'); await sleep(700);
    await page.evaluate(() => { const s = window.__AS_UI.save; s.prog = { c1: 5, c2: 5, c3: 7 }; s.custom.unlocked = true; window.__AS_UI.toMenu(); }); await sleep(600);
    log.push('custom enabled: ' + await page.evaluate(() => !document.getElementById('m-custom').disabled));
    await page.evaluate(() => document.getElementById('m-custom').click()); await sleep(500);
    log.push('modes: ' + await page.evaluate(() => document.querySelectorAll('#cu-modes .cumode').length) + ' sliders: ' + await page.evaluate(() => document.querySelectorAll('#cu-ai .cuent').length));
    await page.screenshot({ path: __dirname + '/shots6/cu1.png' });
    await page.evaluate(() => document.querySelectorAll('#cu-modes .cumode')[7].click()); await sleep(200);
    await page.evaluate(() => document.querySelectorAll('#cu-ai .cuent button')[1].click()); await sleep(200);
    log.push('kumot lv after +: ' + await page.evaluate(() => document.querySelector('#cu-ai .cuent .lv').textContent) + ' rec: ' + await page.evaluate(() => document.getElementById('cu-rec').textContent));
    await page.click('#cu-go'); await sleep(500); log.push('intro: ' + await page.evaluate(() => document.getElementById('intro-name').textContent));
    await page.evaluate(() => { window.__AS_NOCALL = true; }); await page.click('#intro-go'); await sleep(1800);
    log.push('game: ' + await page.evaluate(() => { const g = window.__AS_UI.game; return JSON.stringify({ ch: g.chapter, dark: !!g.dark, lv: g.level('kumot'), b: g.level('barang') }); }));
    await page.evaluate(() => { const g = window.__AS_UI.game; g.time = g.hourSec * 6 - 0.05; }); await sleep(1200);
    log.push('win: ' + await page.evaluate(() => document.getElementById('scr-win').classList.contains('show') + ' ' + document.getElementById('win-time').textContent + ' records ' + JSON.stringify(window.__AS_UI.save.custom.records)));
  } catch (e) { errors.push('TEST ' + e.message); }
  console.log(log.join('\n')); console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})();
