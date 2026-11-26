// Preview build: every chapter, night and Custom Night open on a fresh save; a room keeps its turn when you come back
const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  const page = await browser.newPage(); const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.setViewport({ width: 1280, height: 720 });
  await page.evaluateOnNewDocument(() => { localStorage.clear(); window.__AS_NOCALL = true; });
  await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.getElementById('load-go').style.visibility === 'visible', { timeout: 60000 });
  await page.evaluate(() => document.getElementById('load-go').click()); await sleep(600); await page.evaluate(() => document.getElementById('warn-go').click()); await sleep(800);
  console.log('custom enabled:', await page.evaluate(() => !document.getElementById('m-custom').disabled));
  await page.evaluate(() => document.getElementById('m-nights').click()); await sleep(400);
  console.log('night buttons enabled:', await page.evaluate(() => { const b = [...document.querySelectorAll('#scr-nights button')].filter(x => /^\d+$/.test(x.textContent.trim()) || x.dataset.n); return b.filter(x => !x.disabled).length + '/' + b.length; }));
  await page.screenshot({ path: '/tmp/unlock.png' });
  // Chapter 2: turn in the sala, walk out to the hall and back
  await page.evaluate(() => { window.__AS_UI.save.pro.c2 = true; window.__AS_UI.startNight(0, 2); }); await sleep(800);
  await page.evaluate(() => document.getElementById('intro-go').click()); await sleep(2500);
  const r = await page.evaluate(async () => {
    const U = window.__AS_UI, g = U.game, out = [];
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    g.p.room = 'living'; g.p.travel = null; await wait(300); U.pan.t = 0.9; await wait(600); out.push('living turned ' + U.pan.x.toFixed(2));
    g.p.room = 'hall'; await wait(400); g.p.room = 'kitchen'; await wait(400); U.pan.t = 0.1; await wait(600); out.push('kitchen turned ' + U.pan.x.toFixed(2));
    g.p.room = 'hall'; await wait(400); g.p.room = 'living'; await wait(500); out.push('back in sala ' + U.pan.x.toFixed(2));
    g.p.room = 'hall'; await wait(400); g.p.room = 'kitchen'; await wait(500); out.push('back in kitchen ' + U.pan.x.toFixed(2));
    return out.join(' | ');
  });
  console.log(r);
  console.log('ERRORS:', errors.join('\n') || 'none'); await browser.close();
})();
