// Each hiding place / place has its own jumpscare background
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
  await click('#load-go'); await sleep(600); await click('#warn-go'); await sleep(800);
  const cases = [
    ['kumotu (C3 under bed)', 3, 0, `g.p.room='bedroom'; g.act('hide'); g.k.st=4; g.k.t=3; g.p.holdBreath=false;`],
    ['malikh (C2 sofa)', 2, 1, `g.p.room='living'; g.act('hide'); g.m.st=2; g.m.t=15; g.house.lights=true; g.m.lock=2.9;`],
    ['kalh (C2 cupboard)', 2, 1, `g.p.room='kitchen'; g.act('hide'); g.c.st=3; g.c.t=10; g.act('none');`],
    ['silipc (C2 curtain)', 2, 3, `g.p.room='curtain'; g.house.curtain=true; g.s.st=4; g.s.t=5; g.s.grace=0;`],
    ['malikmata (C2 living)', 2, 1, `g.p.room='living'; g.m.st=2; g.m.t=15; g.m.exposed=3.9;`],
    ['away malik (C2 kitchen)', 2, 1, `g.p.room='kitchen'; g.m.st=2; g.m.t=15; g.m.hunt=7; g.m.exposed=4.4;`],
    ['away kumot (C3 living)', 3, 0, `g.p.room='living'; g.k.st=4; g.k.away=8.95;`],
    ['away kal (C2 hall)', 2, 1, `g.p.room='hall'; g.c.st=3; g.c.t=10; g.c.away=8.95;`],
    ['kumot (C1 door)', 1, 0, `g.k.on=true; g.k.st=4; g.k.grace=0.05;`],
    ['kumotu (C1 bed)', 1, 0, `g.p.pos='bed'; g.k.on=true; g.k.st=4; g.k.search=10; g.k.slip=0.44; g.p.holdBreath=false;`],
  ];
  for (const [name, ch, n, code] of cases) {
    await page.evaluate((ch, n) => { const U = window.__AS_UI; U.save.pro.c1 = U.save.pro.c2 = U.save.pro.c3 = true; U.startNight(n, ch); }, ch, n); await sleep(800); await click('#intro-go'); await sleep(2200);
    await page.evaluate(new Function('const g = window.__AS_UI.game; ' + code)); await sleep(name.startsWith('away') ? 2600 : 1400);
    log.push(name + ' -> ' + await page.evaluate(() => (document.getElementById('scare-img').src || '').split('/').pop()));
    await sleep(3500); log.push('   tips: ' + await page.evaluate(() => document.getElementById('over-hint').innerText.replace(/\n/g, ' | ').slice(0, 160)));
    await page.screenshot({ path: '/tmp/over_' + name.split(' ')[0] + '.png' }); await page.evaluate(() => { const b = document.querySelector('#scr-over.show [data-act="menu"], #over-menu'); if (b) b.click(); }); await sleep(800);
  }
  console.log(log.join('\n')); console.log('ERRORS:', errors.join('\n') || 'none'); await browser.close();
})();
