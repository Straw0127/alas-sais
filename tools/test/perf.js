// Frame times while turning the bedroom by swiping, on a phone-sized screen with the CPU slowed 4x
const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--mute-audio', '--enable-gpu-rasterization'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument(() => { localStorage.clear(); window.__AS_NOCALL = true; });
  await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.getElementById('load-go').style.visibility === 'visible', { timeout: 60000 });
  const cdp = await page.target().createCDPSession();
  const touch = async (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await page.evaluate(() => document.getElementById('load-go').click()); await sleep(700); await page.evaluate(() => document.getElementById('warn-go').click()); await sleep(800);
  await page.evaluate(() => { window.__AS_UI.save.pro.c1 = true; window.__AS_UI.startNight(0, 1); }); await sleep(800); await page.evaluate(() => document.getElementById('intro-go').click()); await sleep(2500);
  if (process.env.PRE) await page.evaluate(process.env.PRE);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.evaluate(() => { window.__ft = []; let l = performance.now(); (function f(n) { window.__ft.push(n - l); l = n; if (window.__ft.length < 400) requestAnimationFrame(f); })(l); });
  for (let r = 0; r < 3; r++) {
    await touch('touchStart', 700, 200); for (let k = 1; k <= 30; k++) { await touch('touchMove', 700 - k * 18, 200); await sleep(16); } await touch('touchEnd'); await sleep(300);
    await touch('touchStart', 150, 200); for (let k = 1; k <= 30; k++) { await touch('touchMove', 150 + k * 18, 200); await sleep(16); } await touch('touchEnd'); await sleep(300);
  }
  const ft = await page.evaluate(() => window.__ft.slice(5));
  ft.sort((a, b) => a - b); const p = (q) => ft[Math.floor(ft.length * q)].toFixed(1);
  console.log('frames', ft.length, 'median', p(0.5), 'p90', p(0.9), 'p99', p(0.99), 'pan', await page.evaluate(() => window.__AS_UI.pan.x.toFixed(2)));
  await browser.close();
})();
