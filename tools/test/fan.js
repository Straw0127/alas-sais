// The e-fan / energy mechanic (Chapter 1 bedroom, Chapter 2 sala) and the Chapter 3 door view
const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  const page = await browser.newPage(); const errors = [], log = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push('HTTP ' + r.status() + ' ' + r.url().split('/').pop()); });
  await page.setViewport({ width: 1280, height: 720 });
  await page.evaluateOnNewDocument(() => { localStorage.clear(); window.__AS_NOCALL = true; });
  await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.getElementById('load-go').style.visibility === 'visible', { timeout: 60000 });
  const click = (sel) => page.evaluate((s) => document.querySelector(s).click(), sel);
  const spotClick = (id) => page.evaluate((id) => { const e = document.querySelector('[data-spot="' + id + '"]'); if (!e) return 'no ' + id; const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, id);
  const tapSpot = async (id) => { const p = await spotClick(id); if (typeof p === 'string') { log.push(p); return; } await page.mouse.click(p[0], p[1]); };
  await click('#load-go'); await sleep(600); await click('#warn-go'); await sleep(800);
  // ---- Chapter 1: turn right, switch the fan on
  await page.evaluate(() => { window.__AS_UI.save.pro.c1 = true; window.__AS_UI.startNight(0, 1); }); await sleep(800); await click('#intro-go'); await sleep(2500);
  await page.screenshot({ path: '/tmp/f_intro_skip.png' });
  await page.evaluate(() => { window.__AS_UI.pan.t = 1; }); await sleep(900);
  log.push('c1 starts on: ' + await page.evaluate(() => window.__AS_UI.game.house.fan) + ' spot while on: ' + await page.evaluate(() => document.querySelectorAll('[data-spot="fan"]').length));
  await page.evaluate(() => { const g = window.__AS_UI.game; g.p.energy = 60; g.fanNext.fan = 0; }); await sleep(3000);
  log.push('auto off: ' + !(await page.evaluate(() => window.__AS_UI.game.house.fan)) + ' sanity 60 -> ' + (await page.evaluate(() => window.__AS_UI.game.p.energy)).toFixed(1) + ' warn: ' + await page.evaluate(() => document.getElementById('sn-w').textContent));
  await page.screenshot({ path: '/tmp/f_c1_off.png' });
  await tapSpot('fan'); await sleep(2500);
  log.push('fan on again: ' + await page.evaluate(() => window.__AS_UI.game.house.fan) + ' sanity ' + (await page.evaluate(() => window.__AS_UI.game.p.energy)).toFixed(1));
  await page.screenshot({ path: '/tmp/f_c1_fan.png' });
  await page.evaluate(() => { window.__AS_UI.game.house.fan = false; window.__AS_UI.game.fanNext.fan = 1e9; });
  await page.evaluate(() => { window.__AS_UI.game.p.energy = 8; }); await sleep(2500); await page.screenshot({ path: '/tmp/f_c1_tired.png' });
  await page.evaluate(() => { window.__AS_UI.game.p.energy = 0.05; }); await sleep(3000); await page.screenshot({ path: '/tmp/f_bang1.png' });
  await sleep(2900); await page.screenshot({ path: '/tmp/f_bang2.png' }); await sleep(2500);
  log.push('after death: ' + await page.evaluate(() => [...document.querySelectorAll('.scr.show')].map(e => e.id).join(',') + ' | ' + document.getElementById('over-who').textContent));
  await page.screenshot({ path: '/tmp/f_over.png' });
  // ---- Chapter 2: the sala fan
  await page.evaluate(() => { window.__AS_UI.save.pro.c2 = true; window.__AS_UI.startNight(0, 2); }); await sleep(800); await click('#intro-go'); await sleep(2500);
  await page.evaluate(() => { const g = window.__AS_UI.game; g.p.room = 'living'; window.__AS_UI.pan.t = 0.3; }); await sleep(1200);
  await page.evaluate(() => { window.__AS_UI.game.fanNext.fan = 0; }); await sleep(1500);
  await tapSpot('fan'); await sleep(2500); log.push('sala fan: ' + await page.evaluate(() => window.__AS_UI.game.house.fan));
  await page.screenshot({ path: '/tmp/f_c2_fan.png' });
  // ---- Chapter 3: the door view
  await page.evaluate(() => { window.__AS_UI.save.pro.c3 = true; window.__AS_UI.startNight(0, 3); }); await sleep(800); await click('#intro-go'); await sleep(2500);
  await page.screenshot({ path: '/tmp/f_c3_bed.png' });
  await page.evaluate(() => { const g = window.__AS_UI.game; g.p.energy = 50; g.fanNext.fanB = 0; }); await sleep(2000);
  log.push('c3 one off: ' + (await page.evaluate(() => window.__AS_UI.game.p.energy)).toFixed(1) + ' warn: ' + await page.evaluate(() => document.getElementById('sn-w').textContent));
  await page.evaluate(() => { const g = window.__AS_UI.game; g.fanNext.fan = 0; }); await sleep(2000);
  log.push('c3 both off: ' + (await page.evaluate(() => window.__AS_UI.game.p.energy)).toFixed(1) + ' warn: ' + await page.evaluate(() => document.getElementById('sn-w').textContent));
  await page.screenshot({ path: '/tmp/f_c3_off.png' });
  await page.evaluate(() => { const g = window.__AS_UI.game; g.fanNext.fan = g.fanNext.fanB = 1e9; g.p.energy = 100; });
  await tapSpot('door'); await sleep(1200); await page.screenshot({ path: '/tmp/f_c3_door.png' });
  log.push('door view spots: ' + await page.evaluate(() => [...document.querySelectorAll('#hot .spot')].map(e => e.getAttribute('data-spot')).join(',')));
  await page.mouse.move(640, 300); await page.mouse.down(); await sleep(1300); await page.screenshot({ path: '/tmp/f_c3_held.png' });
  log.push('held: door=' + await page.evaluate(() => window.__AS_UI.game.house.door + ' hold=' + window.__AS_UI.game.p.holdDoor));
  await page.mouse.up(); await sleep(900); log.push('released: door=' + await page.evaluate(() => window.__AS_UI.game.house.door));
  await tapSpot('back'); await sleep(900); log.push('back: ' + await page.evaluate(() => window.__AS_UI.game.p.room + ' ' + document.querySelectorAll('[data-spot="fan"]').length));
  console.log(log.join('\n')); console.log('ERRORS:', errors.join('\n') || 'none'); await browser.close();
})();
