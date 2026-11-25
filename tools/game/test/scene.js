// Touch test of the in-scene controls on a phone-sized landscape screen, with screenshots mid-animation.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const OUT = __dirname + '/shots2'; fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  const page = await browser.newPage(); const errors = []; const log = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('fonts')) errors.push('console: ' + m.text()); });
  await page.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.getElementById('load-go').style.visibility === 'visible', { timeout: 30000 });
  const cdp = await page.target().createCDPSession();
  const touch = async (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  const tapXY = async (x, y) => { await touch('touchStart', x, y); await sleep(40); await touch('touchEnd'); };
  const spot = (id) => page.evaluate((id) => { const e = document.querySelector('#hot [data-spot="' + id + '"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, id);
  const tap = async (id) => { const p = await spot(id); if (!p) { log.push('MISSING spot ' + id); return false; } await tapXY(p.x, p.y); return true; };
  const st = () => page.evaluate(() => { const g = window.__AS_UI.game; if (!g) return null; return { room: g.p.room, travel: !!g.p.travel, hidden: g.p.hidden, door: g.house.door, hd: g.p.holdDoor, hb: g.p.holdBreath, hc: g.p.holdCurtain, light: g.p.light, curtain: g.house.curtain, tv: g.house.tv, lights: g.house.lights, quiet: !!g.quiet, t: +g.time.toFixed(1), spots: [...document.querySelectorAll('#hot .spot')].map(s => s.getAttribute('data-spot')).join(',') }; });
  const shot = (n) => page.screenshot({ path: OUT + '/' + n + '.png' });
  const tapBtn = async (sel) => { const p = await page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel); await tapXY(p.x, p.y); };

  await tapBtn('#load-go'); await sleep(500); await tapBtn('#m-new'); await sleep(400); await tapBtn('#intro-go'); await sleep(1500);
  await shot('s01_ringing'); log.push('ringing: ' + JSON.stringify(await page.evaluate(() => window.__AS_UI.call && window.__AS_UI.call.state)) + ' time ' + (await st()).t);
  await tapBtn('#ph-ans'); await sleep(4000); await shot('s02_call_sub');
  log.push('call: ' + JSON.stringify(await page.evaluate(() => { const c = window.__AS_UI.call; return c && { state: c.state, i: c.i, speaking: c.speaking }; })) + ' quiet ' + (await st()).quiet);
  await page.waitForFunction(() => { const c = window.__AS_UI.call; return c && c.i >= 2; }, { timeout: 30000 }).catch(() => log.push('call did not reach line 3'));
  await sleep(600); await shot('s03_call_focus_door');
  await page.evaluate(() => window.__AS_UI.hang()); await sleep(1200);
  log.push('after hang: ' + JSON.stringify(await st()));
  // close the door by tapping it
  await tap('door'); await sleep(180); await shot('s04_door_swing'); await sleep(600); await shot('s05_door_closed');
  log.push('door after tap: ' + (await st()).door);
  // hold the door
  let p = await spot('door'); await touch('touchStart', p.x, p.y); await sleep(700); await shot('s06_hold_door'); log.push('holding: ' + (await st()).hd);
  await touch('touchEnd'); await sleep(200); log.push('released: ' + !(await st()).hd);
  // double tap to open
  p = await spot('door'); await tapXY(p.x, p.y); await sleep(120); await tapXY(p.x, p.y); await sleep(350); await shot('s07_door_opening'); await sleep(900);
  log.push('door after dbl: ' + (await st()).door);
  // hide under the bed
  await tap('bed'); await sleep(300); await shot('s08_crouch'); await sleep(900); await shot('s09_under_bed'); log.push('hidden: ' + (await st()).hidden);
  await touch('touchStart', 420, 150); await sleep(800); await shot('s10_hold_breath'); log.push('breath: ' + (await st()).hb); await touch('touchEnd'); await sleep(200);
  await tap('exit'); await sleep(1300); log.push('unhidden: ' + JSON.stringify(await st()));
  // walk to the hallway
  await tap('exit'); await sleep(350); await shot('s11_walking'); await sleep(1200); await shot('s12_hallway'); log.push('hall: ' + JSON.stringify(await st()));
  await touch('touchStart', 300, 330); await sleep(150); await touch('touchMove', 380, 300); await sleep(500); await shot('s13_flashlight'); log.push('light: ' + (await st()).light); await touch('touchEnd'); await sleep(200);
  await tap('living'); await sleep(300); await shot('s14_walk_living'); await sleep(1600); await shot('s15_living'); log.push('living: ' + JSON.stringify(await st()));
  await tap('switch'); await sleep(250); await shot('s16_lights'); await sleep(600);
  await tap('sofa'); await sleep(1300); await shot('s17_sofa'); log.push('sofa: ' + (await st()).hidden); await tap('exit'); await sleep(1200);
  await tap('exit'); await sleep(1700); await tap('kitchen'); await sleep(2200); await shot('s18_kitchen'); log.push('kitchen: ' + JSON.stringify(await st()));
  await tap('cabinet'); await sleep(1300); await shot('s19_cabinet'); await tap('exit'); await sleep(1300);
  await tap('exit'); await sleep(1700); await tap('curtain'); await sleep(2200); await shot('s20_curtain'); log.push('curtain: ' + JSON.stringify(await st()));
  p = await spot('curtain'); await tapXY(p.x, p.y); await sleep(120); await tapXY(p.x, p.y); await sleep(300); await shot('s21_curtain_opening'); await sleep(700); await shot('s22_curtain_open');
  log.push('curtain open: ' + (await st()).curtain);
  await touch('touchStart', 430, 170); await sleep(600); await shot('s23_flash_window'); await touch('touchEnd'); await sleep(200);
  await tap('cl'); await sleep(260); await shot('s24_curtain_closing'); await sleep(700); log.push('curtain closed: ' + !(await st()).curtain);
  // FIL subtitles
  await page.evaluate(() => { window.__AS_UI.startNight(1); }); await sleep(300);
  await page.evaluate(() => { document.querySelector('.langbtn[data-lang="fil"]') && document.querySelector('.langbtn[data-lang="fil"]').click(); });
  await tapBtn('#intro-go'); await sleep(1200); await tapBtn('#ph-ans'); await sleep(3000); await shot('s25_call_fil');
  console.log(log.join('\n')); console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})();
