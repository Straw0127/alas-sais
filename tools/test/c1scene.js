// Chapter 1 touch test on a phone-sized landscape screen, screenshots of each step.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const OUT = __dirname + '/shots3'; fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  const page = await browser.newPage(); const errors = []; const log = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_TUNNEL/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push('HTTP ' + r.status() + ' ' + r.url()); });
  await page.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument(() => localStorage.clear());
  await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.getElementById('load-go').style.visibility === 'visible', { timeout: 60000 });
  const cdp = await page.target().createCDPSession();
  const touch = async (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  const tapXY = async (x, y) => { await touch('touchStart', x, y); await sleep(40); await touch('touchEnd'); };
  const center = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
  const dblXY = async (x, y) => { await tapXY(x, y); await sleep(120); await tapXY(x, y); };
  const tapSel = async (sel) => { const p = await center(sel); if (!p) { log.push('MISSING ' + sel + ' state ' + JSON.stringify(await st())); return; } await tapXY(p.x, p.y); };
  const spot = (id) => '#hot [data-spot="' + id + '"]';
  const st = () => page.evaluate(() => { const g = window.__AS_UI.game; if (!g) return null; return { pos: g.p.pos, tr: !!g.p.travel, hd: g.p.holdDoor, hc: g.p.holdCurtain, light: g.p.light, hb: g.p.holdBreath, curtain: g.house.curtain, t: +g.time.toFixed(1), quiet: g.quiet, spots: [...document.querySelectorAll('#hot .spot')].map(s => s.getAttribute('data-spot')).join(',') }; });
  const shot = (n) => page.screenshot({ path: OUT + '/' + n + '.png' });
  try {
  await tapSel('#load-go'); await sleep(1200); await shot('a01_menu');
  log.push('menu img: ' + await page.evaluate(() => document.getElementById('mbg-on').src.split('/').pop()));
  await tapSel('#m-new'); await sleep(1500); await shot('a02_prologue_ring');
  await tapSel('#pp-ans'); await sleep(5000); await shot('a03_prologue_talk');
  log.push('prologue: ' + JSON.stringify(await page.evaluate(() => { const p = window.__AS_UI.pp; return p && { i: p.i, speaking: p.speaking }; })));
  await tapSel('#pp-skip'); await sleep(800); await shot('a04_intro');
  await tapSel('#intro-go'); await sleep(1500); await shot('a05_call_ring');
  await tapSel('#ph-ans'); await sleep(3500); await shot('a06_call_talk');
  await page.evaluate(() => window.__AS_UI.hang()); await sleep(800);
  log.push('hub: ' + JSON.stringify(await st()));
  await shot('a07_hub');
  await tapSel(spot('door')); await sleep(250); await shot('a08_walk_door'); await sleep(700); await shot('a09_door');
  log.push('door: ' + JSON.stringify(await st()));
  await dblXY(420, 170); await sleep(300); await shot('a09b_peek'); log.push('peek: ' + await page.evaluate(() => window.__AS_UI.game.p.peek.toFixed(2)) + ' img ' + await page.evaluate(() => document.querySelector('#bgA').style.opacity === '1' ? document.querySelector('#bgA').getAttribute('data-k') : document.querySelector('#bgB').getAttribute('data-k'))); await sleep(1200);
  await dblXY(420, 170); await sleep(200); log.push('peek off: ' + (await st()).light + ' ' + await page.evaluate(() => window.__AS_UI.game.p.peek));
  let p = await center(spot('door')); await touch('touchStart', p.x, p.y);
  { const seen = []; for (let k = 0; k < 14; k++) { seen.push(await page.evaluate(() => { const a = document.querySelector('#bgA'), b = document.querySelector('#bgB'); return (a.style.opacity === '1' ? a : b).getAttribute('data-k'); })); await sleep(35); } log.push('swing: ' + [...new Set(seen)].join(' > ')); }
  await sleep(100); log.push('holding door: ' + (await st()).hd); await shot('a10_hold_door'); await touch('touchEnd'); await sleep(300);
  await tapSel(spot('back')); await sleep(250); await shot('a11_walk_back'); await sleep(700); await shot('a12_hub_back');
  await tapSel(spot('curtain')); await sleep(1000); await shot('a13_window'); log.push('window: ' + JSON.stringify(await st()));
  p = await center(spot('curtain')); if (!p) throw new Error('no curtain spot ' + JSON.stringify(await st())); await touch('touchStart', p.x, p.y); await sleep(700); log.push('holding curtain: ' + (await st()).hc); await touch('touchEnd'); await sleep(300);
  await dblXY(420, 170); await sleep(700); await shot('a14_window_open'); log.push('curtain open: ' + (await st()).curtain);
  await touch('touchStart', 420, 170); await sleep(700); log.push('hold from open -> closed+held: ' + (!(await st()).curtain) + ' ' + (await st()).hc); await touch('touchEnd'); await sleep(300);
  await tapSel(spot('back')); await sleep(1000); await tapSel(spot('cabinet')); await sleep(1000); await shot('a15_cabinet');
  await page.evaluate(() => { const g = window.__AS_UI.game; g.b.on = true; g.b.st = 3; }); await sleep(300); await shot('a16_cabinet_st3');
  await dblXY(420, 170); await sleep(1700); await shot('a17_flashlight'); log.push('light: ' + (await st()).light + ' barang st ' + await page.evaluate(() => window.__AS_UI.game.b.st));
  await dblXY(420, 170); await sleep(200); log.push('light off: ' + !(await st()).light);
  await tapSel(spot('back')); await sleep(1000); await tapSel(spot('bed')); await sleep(350); await shot('a18_crouch'); await sleep(1000); await shot('a19_under_bed'); log.push('bed: ' + JSON.stringify(await st()));
  await touch('touchStart', 420, 150); await sleep(700); log.push('breath: ' + (await st()).hb); await shot('a20_breath'); await touch('touchEnd'); await sleep(300);
  await tapSel(spot('out')); await sleep(1300); log.push('out: ' + JSON.stringify(await st()));
  // entity states for visuals
  await page.evaluate(() => { const g = window.__AS_UI.game; g.house.curtain = true; g.s.on = true; g.s.st = 2; }); await tapSel(spot('curtain')); await sleep(1100); await shot('a21_window_silip2');
  await page.evaluate(() => { const g = window.__AS_UI.game; g.k.on = true; g.k.st = 4; g.k.grace = 99; }); await tapSel(spot('back')); await sleep(1100); await shot('a22_hub_kumot');
  // death screen
  await page.evaluate(() => { const g = window.__AS_UI.game; g.k.grace = 0.05; });
  { const seen = []; const t0 = Date.now(); for (let k = 0; k < 40; k++) { const v = await page.evaluate(() => { const s = document.getElementById('scare'); return s.style.display === 'block' ? (document.getElementById('scare-img').src.split('/').pop() + (s.classList.contains('hit') ? '*' : '')) : '-'; }); seen.push(v); if (k === 14) await shot('a22b_scare'); await sleep(40); }
    log.push('scare: ' + seen.filter((v, i) => i === 0 || v !== seen[i - 1]).join(' > ')); }
  await sleep(900); await shot('a23_death');
  log.push('over shown: ' + await page.evaluate(() => document.getElementById('scr-over').classList.contains('show')));
  } catch (e) { log.push('CRASH ' + e.message); }
  console.log(log.join('\n')); console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})();
