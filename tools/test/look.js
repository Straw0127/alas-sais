// Screenshots of every screen for a visual check
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
  await page.screenshot({ path: '/tmp/s_load.png' });
  await page.click('#load-go'); await sleep(600); await page.screenshot({ path: '/tmp/s_warn.png' });
  await page.click('#warn-go'); await sleep(1200); await page.screenshot({ path: '/tmp/s_menu.png' });
  await page.evaluate(() => window.__AS_UI.show('scr-settings')); await sleep(300); await page.screenshot({ path: '/tmp/s_set.png' });
  await page.evaluate(() => window.__AS_UI.show('scr-credits')); await sleep(300); await page.screenshot({ path: '/tmp/s_cred.png' });
  await page.evaluate(() => { window.__AS_UI.show('scr-menu'); }); await page.click('#m-nights'); await sleep(400); await page.screenshot({ path: '/tmp/s_nights.png' });
  await page.evaluate(() => window.__AS_UI.show('scr-menu')); await page.click('#m-new'); await sleep(2000);
  await page.click('#pp-ans'); await sleep(3500); await page.screenshot({ path: '/tmp/s_pp.png' });
  await page.click('#pp-end'); await sleep(1500); await page.screenshot({ path: '/tmp/s_intro.png' });
  console.log('state', await page.evaluate(() => [...document.querySelectorAll('.scr.show')].map(e => e.id).join(',')));
  const go = await page.$('#intro-go'); if (go) { await go.click(); await sleep(3000); }
  await page.screenshot({ path: '/tmp/s_game.png' });
  console.log('ERRORS:', errors.join('\n') || 'none'); await browser.close();
})();
