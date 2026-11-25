// Chapter 2 touch test: hallway hub, bedroom off-limits, TV/salt/curtain, power cut + breaker memory puzzle.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const OUT = __dirname + '/shots5'; fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  const page = await browser.newPage(); const errors = []; const log = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_TUNNEL/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push('HTTP ' + r.status() + ' ' + r.url()); });
  await page.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument(() => { localStorage.clear(); window.__AS_NOCALL = false; });
  await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.getElementById('load-go').style.visibility === 'visible', { timeout: 60000 });
  const cdp = await page.target().createCDPSession();
  const touch = async (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  const tapXY = async (x, y) => { await touch('touchStart', x, y); await sleep(40); await touch('touchEnd'); };
  const center = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
  const tapSel = async (sel) => { const p = await center(sel); if (!p) { log.push('MISSING ' + sel + ' ' + JSON.stringify(await st())); return; } await tapXY(p.x, p.y); };
  const spot = (id) => '#hot [data-spot="' + id + '"]';
  const st = () => page.evaluate(() => { const g = window.__AS_UI.game; if (!g) return null; return { ch: g.chapter, room: g.p.room, tr: !!g.p.travel, power: g.house.power, tv: g.house.tv, salt: g.p.salt, t: +g.time.toFixed(1), img: document.querySelector('#bgA').style.opacity === '1' ? document.querySelector('#bgA').getAttribute('data-k') : document.querySelector('#bgB').getAttribute('data-k'), spots: [...document.querySelectorAll('#hot .spot')].map(s => s.getAttribute('data-spot')).join(',') }; });
  const shot = (n) => page.screenshot({ path: OUT + '/' + n + '.png' });
  const waitRoom = (r) => page.waitForFunction((r) => { const g = window.__AS_UI.game; return g && !g.p.travel && g.p.room === r; }, { timeout: 15000 }, r);
  try {
    await tapSel('#load-go'); await sleep(1000);
    await page.evaluate(() => { const s = window.__AS_UI.save; s.prog.c1 = 5; s.prog.c2 = 4; window.__AS_UI.startNight(3, 2); });
    await sleep(800); await shot('b01_intro'); log.push('intro: ' + await page.evaluate(() => document.getElementById('intro-name').textContent));
    await tapSel('#intro-go'); await sleep(1500); await shot('b02_ring');
    log.push('call: ' + await page.evaluate(() => window.__AS_UI.call && window.__AS_UI.call.n));
    await tapSel('#ph-ans'); await sleep(3000); await page.evaluate(() => window.__AS_UI.hang()); await sleep(600);
    await page.evaluate(() => { const g = window.__AS_UI.game; g._lv = g.level; g.m.cool = g.c.cool = g.s.cool = 9999; });   // functional test: keep the entities away
    log.push('hall: ' + JSON.stringify(await st())); await shot('b03_hall');
    await tapSel(spot('bedroom')); await sleep(400); log.push('bedroom blocked: ' + (await st()).room + ' hint=' + await page.evaluate(() => document.getElementById('hint').textContent));
    await tapSel(spot('living')); await waitRoom('living'); await sleep(400); await shot('b04_living'); log.push('living: ' + JSON.stringify(await st()));
    await tapSel(spot('exit')); await waitRoom('hall'); await tapSel(spot('kitchen')); await waitRoom('kitchen'); await sleep(400); await shot('b05_kitchen'); log.push('kitchen: ' + JSON.stringify(await st()));
    // the power is cut
    await page.evaluate(() => { const g = window.__AS_UI.game; g.blackoutAt = [g.time + 0.05]; }); await sleep(600);
    log.push('cut: ' + JSON.stringify(await st())); await shot('b06_cut');
    await tapSel(spot('breaker')); await sleep(300);
    log.push('puzzle open: ' + await page.evaluate(() => document.getElementById('puzzle').classList.contains('show')));
    // a wrong answer first
    await page.waitForFunction(() => window.__AS_UI.pz && window.__AS_UI.pz.input, { timeout: 10000 }); await shot('b07_puzzle');
    let seq = await page.evaluate(() => window.__AS_UI.pz.seq.slice());
    const wrong = [0, 1, 2, 3, 4, 5, 6, 7, 8].find(i => i !== seq[0]);
    await tapSel('#pz-grid .pzc:nth-child(' + (wrong + 1) + ')'); await sleep(300); log.push('wrong msg: ' + await page.evaluate(() => document.getElementById('pz-msg').textContent));
    await page.waitForFunction(() => window.__AS_UI.pz && window.__AS_UI.pz.input, { timeout: 12000 });
    seq = await page.evaluate(() => window.__AS_UI.pz.seq.slice()); log.push('pattern length ' + seq.length);
    for (const i of seq) { await tapSel('#pz-grid .pzc:nth-child(' + (i + 1) + ')'); await sleep(200); }
    await sleep(800); log.push('over? ' + await page.evaluate(() => { const g = window.__AS_UI.game; return g ? g.over + ' ' + g.dead : 'no game'; }));
    log.push('restored: ' + JSON.stringify(await st()) + ' puzzle shown=' + await page.evaluate(() => document.getElementById('puzzle').classList.contains('show')));
    await shot('b08_restored');
    await tapSel(spot('exit')); await waitRoom('hall'); await tapSel(spot('curtain')); await waitRoom('curtain'); await sleep(400); await shot('b09_curtain'); log.push('curtain: ' + JSON.stringify(await st()));
  } catch (e) { errors.push('TEST ' + e.message); }
  console.log(log.join('\n')); console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})();
