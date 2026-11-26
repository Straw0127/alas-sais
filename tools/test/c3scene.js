// Chapter 3 touch test: bedroom in the one house, door, look-out, overlays, the hallway; night 6 by candlelight.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const OUT = __dirname + '/shots6'; fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  const page = await browser.newPage(); const errors = []; const log = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_TUNNEL/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400 && !/voice\/c3n/.test(r.url())) errors.push('HTTP ' + r.status() + ' ' + r.url()); });
  await page.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument(() => { localStorage.clear(); });
  await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.getElementById('load-go').style.visibility === 'visible', { timeout: 60000 });
  const cdp = await page.target().createCDPSession();
  const touch = async (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  const tapXY = async (x, y) => { await touch('touchStart', x, y); await sleep(40); await touch('touchEnd'); };
  const center = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
  const tapSel = async (sel) => { const p = await center(sel); if (!p) { log.push('MISSING ' + sel + ' ' + JSON.stringify(await st())); return; } await tapXY(p.x, p.y); };
  const spot = (id) => '#hot [data-spot="' + id + '"]';
  const st = () => page.evaluate(() => { const g = window.__AS_UI.game; if (!g) return null; const a = document.querySelector('#bgA'), b = document.querySelector('#bgB'); return { ch: g.chapter, n: g.night, room: g.p.room, door: g.house.door, power: g.house.power, dark: !!g.dark, b: g.b.st, k: g.k.st, img: (a.style.opacity === '1' ? a : b).getAttribute('data-k'), ovl: [...document.querySelectorAll('#ovl img')].map(i => i.src.split('/').pop()).join(','), spots: [...document.querySelectorAll('#hot .spot')].map(s => s.getAttribute('data-spot')).join(',') }; });
  const shot = (n) => page.screenshot({ path: OUT + '/' + n + '.png' });
  const waitRoom = (r) => page.waitForFunction((r) => { const g = window.__AS_UI.game; return g && !g.p.travel && g.p.room === r; }, { timeout: 15000 }, r);
  const calm = () => page.evaluate(() => { const g = window.__AS_UI.game; g.level = () => 0; g.m.cool = g.c.cool = g.s.cool = g.k.cool = 9999; });
  try {
    await tapSel('#load-go'); await sleep(700); await tapSel('#warn-go'); await sleep(800);
    await page.evaluate(() => { const s = window.__AS_UI.save; s.prog.c1 = 5; s.prog.c2 = 5; window.__AS_NOCALL = true; window.__AS_UI.startNight(0, 3); });
    await sleep(700); log.push('intro: ' + await page.evaluate(() => document.getElementById('intro-name').textContent)); await shot('c01_intro');
    await tapSel('#intro-go'); await sleep(1800); await calm();
    log.push('bedroom: ' + JSON.stringify(await st())); await shot('c02_bed');
    await tapSel(spot('door')); await sleep(900); log.push('at door: ' + (await st()).img + ' ' + (await st()).spots); await shot('c03_look');
    await tapXY(640, 300); await sleep(60); await tapXY(640, 300); await sleep(500); log.push('door light (lit night): ' + (await st()).img);
    await tapSel(spot('back')); await sleep(900); log.push('back: ' + (await st()).img);
    await tapSel(spot('door')); await sleep(700); log.push('door shut: ' + JSON.stringify(await st())); await shot('c04_closed');
    await page.evaluate(() => { const g = window.__AS_UI.game; g.b.st = 3; }); await sleep(400); log.push('barang overlay: ' + (await st()).ovl); await shot('c05_barang');
    await tapSel(spot('door')); await sleep(30); await tapSel(spot('door')); await sleep(800);
    await page.evaluate(() => { const g = window.__AS_UI.game; g.b.st = 0; g.k.st = 3; g.k.t = 99; }); await sleep(400); log.push('kumot at door overlay: ' + JSON.stringify(await st()));
    await page.evaluate(() => { const g = window.__AS_UI.game; g.k.st = 0; });
    await tapSel(spot('exit')); await waitRoom('hall'); await sleep(400); log.push('hall: ' + JSON.stringify(await st())); await shot('c06_hall');
    // night 6: brownout + candles
    await page.evaluate(() => window.__AS_UI.startNight(5, 3)); await sleep(700); log.push('intro6: ' + await page.evaluate(() => document.getElementById('intro-name').textContent));
    await tapSel('#intro-go'); await sleep(1800); await calm();
    log.push('n6 bedroom: ' + JSON.stringify(await st())); await shot('c07_bed_candle');
    await tapSel(spot('door')); await sleep(900); await tapXY(640, 300); await sleep(60); await tapXY(640, 300); await sleep(500); log.push('n6 door + flashlight: ' + (await st()).img); await shot('c06_door_light');
    await tapSel(spot('back')); await sleep(900);
    await tapSel(spot('exit')); await waitRoom('hall'); await sleep(300); log.push('n6 hall: ' + (await st()).img);
    await tapSel(spot('kitchen')); await waitRoom('kitchen'); await sleep(300); log.push('n6 kitchen: ' + JSON.stringify(await st())); await shot('c08_kitchen_candle');
    await tapSel(spot('exit')); await waitRoom('hall'); await tapSel(spot('curtain')); await waitRoom('curtain'); await sleep(300); log.push('n6 curtain: ' + (await st()).img);
  } catch (e) { errors.push('TEST ' + e.message); }
  console.log(log.join('\n')); console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})();
