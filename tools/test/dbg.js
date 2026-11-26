const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  const page = await browser.newPage(); const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.setViewport({ width: 1280, height: 720 });
  await page.evaluateOnNewDocument(() => { localStorage.clear(); });
  await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.getElementById('load-go').style.visibility === 'visible', { timeout: 60000 });
  await page.click('#load-go'); await sleep(600); await page.click('#warn-go'); await sleep(800);
  await page.click('#m-new'); await sleep(2000); await page.click('#pp-ans'); await sleep(1500);
  console.log(await page.evaluate(() => { const e = document.getElementById('pp-end'); const r = e.getBoundingClientRect(); const t = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return JSON.stringify([r.x, r.y, r.width, r.height, getComputedStyle(e).display, t && (t.id || t.className)]); }));
  console.log('ERRORS:', errors.join('\n') || 'none'); await browser.close();
})();
