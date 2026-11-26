// The prologue call and the in-game call: phone screens drawn on canvas, the timer steady.
const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  const page = await browser.newPage(); const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push('HTTP ' + r.status() + ' ' + r.url()); });
  await page.setViewport({ width: 1280, height: 720 });
  await page.evaluateOnNewDocument(() => { localStorage.clear(); });
  await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.getElementById('load-go').style.visibility === 'visible', { timeout: 60000 });
  await page.click('#load-go'); await sleep(600); await page.click('#warn-go'); await sleep(700);
  await page.click('#m-new').catch(e => errors.push('m-new ' + e.message)); await sleep(2500);
  await page.screenshot({ path: '/tmp/ph1.png' });
  await page.evaluate(() => { const b = document.querySelector('.pp-btns button:last-child') || document.getElementById('pp-ans'); b && b.click(); });
  await sleep(4200); await page.screenshot({ path: '/tmp/ph2.png' });
  console.log(await page.evaluate(() => { const p = document.getElementById('pp-phone'); return p && [p.className, p._st, p._t].join(' '); }));
  console.log('ERRORS:', errors.join('\n') || 'none'); await browser.close();
})();
