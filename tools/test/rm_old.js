// Reduce motion: record what is on screen during moves (picture key, black cover) to catch flashes of the wrong place
const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  const page = await browser.newPage(); const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.setViewport({ width: 1280, height: 720 });
  await page.evaluateOnNewDocument(() => { localStorage.clear(); window.__AS_NOCALL = true; });
  await page.goto('http://127.0.0.1:8766/index.html', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.getElementById('load-go').style.visibility === 'visible', { timeout: 60000 });
  const click = (sel) => page.evaluate((s) => document.querySelector(s).click(), sel);
  await click('#load-go'); await sleep(600); await click('#warn-go'); await sleep(800);
  await page.evaluate(() => { const U = window.__AS_UI; U.save.set.motion = true; U.save.pro.c1 = true; U.save.pro.c2 = true; });
  await page.evaluate(() => {
    window.__rec = []; const vis = () => { const out = []; ['bgA', 'bgB', 'litImg', 'ovl', 'fx', 'walkv'].forEach(id => { const e = document.getElementById(id); if (!e) return; const cs = getComputedStyle(e); if (+cs.opacity > 0.05 && cs.display !== 'none' && cs.visibility !== 'hidden') out.push(id + ':' + (e.getAttribute('data-k') || (id === 'fx' ? e.children.length : '')) + '@' + (+cs.opacity).toFixed(2)); }); return out.join(' ') + ' | black ' + (+getComputedStyle(document.getElementById('black')).opacity).toFixed(2); };
    window.__recOn = false; let last = '';
    (function loop() { if (window.__recOn) { const v = vis(); if (v !== last) { window.__rec.push(Math.round(performance.now() - window.__t0) + 'ms ' + v); last = v; } } requestAnimationFrame(loop); })();
  });
  const rec = async (label, fn, ms) => { await page.evaluate(() => { window.__rec = []; window.__t0 = performance.now(); window.__recOn = true; }); await page.evaluate(fn); await sleep(ms); const r = await page.evaluate(() => { window.__recOn = false; return window.__rec; }); console.log('== ' + label); r.forEach(x => console.log('  ' + x)); };
  await page.evaluate(() => window.__AS_UI.startNight(0, 1)); await sleep(800); await click('#intro-go'); await sleep(2500);
  await rec('c1 center -> window', () => window.__AS_UI.game.act('go', 'window'), 2500);
  await rec('c1 window -> center', () => window.__AS_UI.game.act('go', 'center'), 2500);
  await rec('c1 center -> door', () => window.__AS_UI.game.act('go', 'door'), 2500);
  await rec('c1 door -> center', () => window.__AS_UI.game.act('go', 'center'), 2500);
  await rec('c1 center -> cabinet', () => window.__AS_UI.game.act('go', 'cabinet'), 2500);
  await rec('c1 cabinet -> center', () => window.__AS_UI.game.act('go', 'center'), 2500);
  await rec('c1 hide bed', () => window.__AS_UI.game.act('hide'), 2500);
  await rec('c1 unhide', () => window.__AS_UI.game.act('unhide'), 2500);
  await page.evaluate(() => window.__AS_UI.startNight(1, 2)); await sleep(800); await click('#intro-go'); await sleep(2500);
  await rec('c2 hall -> living', () => window.__AS_UI.game.act('go', 'living'), 4000);
  await rec('c2 hide sofa', () => window.__AS_UI.game.act('hide'), 2000);
  await rec('c2 unhide', () => window.__AS_UI.game.act('hide'), 2000);
  await rec('c2 living -> kitchen', () => window.__AS_UI.game.act('go', 'kitchen'), 5000);
  await rec('c2 tv on/off', () => { window.__AS_UI.game.act('go', 'living'); }, 5000);
  await rec('c2 tv', () => window.__AS_UI.game.act('tv'), 2000);
  console.log('ERRORS:', errors.join('\n') || 'none'); await browser.close();
})();
