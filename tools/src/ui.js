/* ALAS-SAIS — UI, audio, input and screens */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  // preload only what Chapter 1 and the menu need (the house rooms load when Chapter 2 opens)
  var IMG = ['hero_kumot', 'hero_silip', 'menu_bed', 'menu_bed_off', 'menu_bed_off_lit', 'menu_morning', 'menu_living_on', 'menu_living_tvoff', 'c1_hub_off', 'c1_hub_off_lit'];
  var SFX = ['amb_house', 'amb_garden', 'amb_menu', 'rain_heavy', 'heartbeat', 'bell_6am', 'rooster_dawn', 'tuko_gecko', 'dog_howl', 'tricycle_far', 'distant_scream',
    'fluorescent_hum', 'scuffs_far', 'scuffs_near', 'wheeze', 'lullaby_hum', 'handle_rattle', 'static_swell', 'vhs_glitch', 'giggle', 'baby_cry', 'clinks', 'sniff', 'knife_taps',
    'nail_taps', 'steps_walk_wood', 'steps_run_wood', 'steps_walk_cement', 'breath_hold_gasp', 'door_creak', 'door_slam', 'cabinet_open', 'cabinet_close', 'curtain_rings',
    'plastic_crinkle', 'kulambo_rustle', 'light_switch', 'flashlight_click', 'tv_static', 'power_down', 'breaker', 'phone_text',
    'jumpscare_kumot', 'jumpscare_malikmata', 'jumpscare_kalansing', 'jumpscare_barang', 'jumpscare_silip',
    'door_open_slow', 'door_close_shut', 'door_push_strain', 'curtain_open_pull', 'curtain_close_pull', 'curtain_grip', 'hide_bed', 'unhide_bed',
    'hide_cabinet', 'hide_sofa', 'turn_whoosh', 'run_pant', 'nervous_breath', 'floor_creak', 'steps_run_cement', 'flashlight_on', 'salt_throw', 'tv_click_off',
    'ringtone', 'phone_pickup', 'phone_hangup', 'line_static',
    'wing_flap', 'wing_flap_far', 'wind_gust', 'beetles', 'beetle_scatter', 'aparador_creak', 'kumot_breath', 'theme_menu',
    'step_w1', 'step_w2', 'step_w3', 'step_c1', 'step_c2', 'step_c3', 'bulb_flicker', 'efan', 'efan_click', 'yawn'];
  IMG.push('c1_door_k3', 'c1_win_shadow2', 'c1_door_sw80', 'c1_door_sw62', 'c1_door_sw46', 'c1_door_sw32', 'c1_door_sw18', 'c1_hub', 'c1_hub_open', 'c1_hub_kumot', 'c1_hub_lit', 'c1_door_ajar', 'c1_peek_0', 'c1_peek_2', 'c1_peek_3', 'c1_door_closed', 'c1_win_closed', 'c1_win_shadow', 'c1_win_open',
    'c1_win_s1', 'c1_win_s2', 'c1_win_s3', 'hero_barang', 'c1_under', 'c1_under_kumot', 'c1_under_kin', 'c1_under_klift');
  for (var _i = 0; _i < 5; _i++) IMG.push('c1_cab_' + _i, 'c1_cab_' + _i + '_lit');
  var VOICE = [];
  function pad2(i) { return (i < 10 ? '0' : '') + i; }
  if (typeof CALLS !== 'undefined') Object.keys(CALLS).forEach(function (n) { CALLS[n].forEach(function (_, i) { VOICE.push(n + '_' + pad2(i)); }); });
  if (typeof PROLOGUE !== 'undefined') Object.keys(PROLOGUE).forEach(function (n) { PROLOGUE[n].forEach(function (_, i) { VOICE.push('pro_' + n + '_' + pad2(i)); }); });
  var WHO_IMG = { kumot: 'js_kumot_7', malik: 'js_malikmata_7', kal: 'js_kalansing_7', silip: 'js_silip_7', barang: 'js_barang_7', bangungot: 'js_bangungot_7' };
  var WHO_SFX = { kumot: 'jumpscare_kumot', malik: 'jumpscare_malikmata', kal: 'jumpscare_kalansing', silip: 'jumpscare_silip', barang: 'jumpscare_barang', bangungot: 'jumpscare_kumot' };
  // the phone is a Blender-rendered handset with its call screen drawn in Python (render/phone_ui.py): pick the picture
  // The phones are one canvas each: the drawn call screen, the live call timer counted onto it in fixed-width
  // digits, then the handset's real glass (reflections, smudges, the crack) screened over everything.
  var PHI = {};
  function phSrc(src) { if (!PHI[src]) { var i = new Image(); i.onload = function () { ['phone', 'pp-phone'].forEach(function (id) { var e = $(id); if (e) phoneDraw(e, true); }); }; i.src = src; PHI[src] = i; } return PHI[src]; }
  function phoneDraw(el, force) {
    var c = el.querySelector('canvas.phc');
    if (!c) { c = document.createElement('canvas'); c.className = 'phc'; c.width = 600; c.height = 1200; el.insertBefore(c, el.firstChild); }
    var lang = save.set.lang === 'fil' ? 'fil' : 'en', st = el._st || 'ring', t = st === 'talk' || st === 'end' ? (el._t || '') : '';
    var key = st + '|' + lang + '|' + t; if (c._k === key && !force) return;
    var base = phSrc('assets/ui/phone_' + st + '_' + lang + '.webp'), gl = phSrc('assets/ui/phone_glass.webp'), dg = phSrc('assets/ui/phone_digits.webp');
    if (!base.naturalWidth) return;
    c._k = key; var x = c.getContext('2d'); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, 600, 1200); x.drawImage(base, 0, 0, 600, 1200);
    if (t && dg.naturalWidth) {
      var CW = 30, CC = 15, CH = 58, tw = 0; t.split('').forEach(function (ch) { tw += ch === ':' ? CC : CW; });
      var px = Math.round(300 - tw / 2), y = 605; x.globalCompositeOperation = 'lighter';
      t.split('').forEach(function (ch) { var k = ch === ':' ? 10 : +ch, w = k === 10 ? CC : CW; x.drawImage(dg, k * CW, 0, w, CH, px, y, w, CH); px += w; });
    }
    if (gl.naturalWidth) { x.globalCompositeOperation = 'screen'; x.drawImage(gl, 0, 0, 600, 1200); }
    x.globalCompositeOperation = 'source-over';
  }
  function phoneImg(el) {
    var c = el.classList, pro = el.id === 'pp-phone';
    el._st = c.contains('ended') ? 'end' : (c.contains('talk') || c.contains('talking')) ? 'talk' : (pro ? 'ringA' : 'ring');
    if (el._st !== 'talk' && el._st !== 'end') el._t = '';
    el.style.backgroundImage = 'none'; phoneDraw(el);
  }
  function clockImg(el, str) { var ph = el.closest('#phone,.pp-phone'); if (!ph || ph._t === str) return; ph._t = str; el.setAttribute('aria-label', str); phoneDraw(ph); }
  var WORDS = ['cont', 'new_game', 'chapters', 'custom_night', 'settings', 'credits', 'quit', 'resume', 'restart', 'main_menu'];
  var lightLatch = false;   // a flashlight switched on by double-tap stays on after the finger lifts
  var JS = { kumot: 'kumot', malik: 'malikmata', kal: 'kalansing', silip: 'silip', barang: 'barang', bangungot: 'bangungot' }, scareTimers = [];
  var JSDIR = 'assets/img/';   // jumpscare frames are full size on every graphics setting (seen for a second; no small copies)
  function preloadScares() { Object.keys(JS).map(function (w) { return JS[w]; }).concat(['kumotu', 'malikh', 'kalh', 'silipc']).forEach(function (n) { for (var f = 0; f < 8; f++) { var k = 'js_' + n + '_' + f; if (!imgs[k + JSDIR]) { var i = new Image(); i.src = JSDIR + k + '.jpg'; imgs[k + JSDIR] = i; } } }); }
  var HERO = { kumot: 'hero_kumot', malik: 'hero_malikmata', kal: 'hero_kalansing', silip: 'hero_silip', barang: 'hero_barang' };
  var C1_RULES = { 1: ['kumot'], 2: ['silip'], 3: ['barang'], 4: [], 5: [] };
  var C2_RULES = { 1: ['malik', 'silip'], 2: ['kal'], 3: [], 4: [], 5: [] };
  var C3_RULES = { 1: ['kumot', 'malik', 'barang'], 2: ['kal', 'silip'], 3: [], 4: [], 5: [], 6: [], 7: [] };

  // ------------------------------------------------------------ save / settings
  var DEF = { lang: 'en', gfx: 'medium', vol: { master: 0.9, sfx: 1, amb: 0.8, music: 0.6 }, captions: true, reduced: false, motion: undefined, sens: 1 };
  var save = { prog: { c1: 0, c2: 0, c3: 0 }, cur: { ch: 1, n: 1 }, custom: { unlocked: false, records: {} }, pro: {}, set: JSON.parse(JSON.stringify(DEF)) };
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem('alassais') || 'null');
      if (s && s.set) { save.set = s.set; save.set.vol = Object.assign({}, DEF.vol, s.set.vol); }
      if (s && s.prog) { save.prog = Object.assign(save.prog, s.prog); save.cur = s.cur || save.cur; save.custom = s.custom || save.custom; save.pro = s.pro || {}; }
    } catch (e) {}
  }
  function store() { try { localStorage.setItem('alassais', JSON.stringify(save)); } catch (e) {} }
  load();
  if (save.set.motion === undefined) { try { save.set.motion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { save.set.motion = false; } }
  // ask the browser to keep this save even when space runs low (Chrome grants it for sites you return to)
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  // Low graphics uses half-size copies, except for pictures only seen for a moment (door swings, entity cut-outs, jumpscares)
  var NOLO = /^(hubx_|js_|sofa_|c1_under)|_sw\d+$/;
  function IMGDIR(k) { return save.set.gfx === 'low' && !(k && NOLO.test(k)) ? 'assets/img_lo/' : 'assets/img/'; }
  // save code: the whole save as text, to carry progress to another browser or phone
  function saveCode() { return 'AS1-' + btoa(unescape(encodeURIComponent(JSON.stringify({ prog: save.prog, cur: save.cur, custom: save.custom, pro: save.pro })))); }
  function loadCode(code) {
    try {
      var s = JSON.parse(decodeURIComponent(escape(atob(String(code).trim().replace(/^AS1-/, '')))));
      if (!s || !s.prog) return false;
      save.prog = Object.assign({ c1: 0, c2: 0, c3: 0 }, s.prog); save.cur = s.cur || save.cur; save.custom = s.custom || save.custom; save.pro = s.pro || {};
      store(); return true;
    } catch (e) { return false; }
  }
  function L() { return STR[save.set.lang] || STR.en; }
  function T(key, n) { var v = L()[key]; if (v === undefined) v = STR.en[key]; return typeof v === 'string' && n !== undefined ? v.replace('{n}', n) : v; }

  // ------------------------------------------------------------ scaling
  // portrait phones (or an app that keeps the page upright) get the stage turned sideways to fill the screen:
  // turn the phone and it reads as landscape. Upright landscape windows just letterbox.
  var stageRot = false, stageOx = 0, stageOy = 0;
  function fit() {
    var w = window.innerWidth, h = window.innerHeight, st = $('stage');
    stageRot = h > w * 1.1;
    var s = stageRot ? Math.min(h / 1280, w / 720) : Math.min(w / 1280, h / 720); stageScale = s;
    if (stageRot) { stageOx = (w + 720 * s) / 2; stageOy = (h - 1280 * s) / 2; st.style.transform = 'rotate(90deg) scale(' + s + ')'; }
    else { stageOx = (w - 1280 * s) / 2; stageOy = (h - 720 * s) / 2; st.style.transform = 'scale(' + s + ')'; }
    st.style.left = stageOx + 'px'; st.style.top = stageOy + 'px';
    document.body.classList.toggle('rot', stageRot);
    $('rotate').style.display = 'none';
  }
  var rotateDismissed = false;
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', function () { setTimeout(fit, 200); });

  // ------------------------------------------------------------ assets
  var imgs = {};
  var AC = null, BUS = {}, BUF = {}, rawAudio = {};
  function loadAll(onProgress) {
    var total = IMG.length + SFX.length + VOICE.length, done = 0;
    function tick() { done++; onProgress(done / total); }
    var jobs = [];
    ['hubx_k3', 'hubx_s2c', 'hubx_s3c', 'hubx_s2o', 'hubx_s3o', 'hubx_b2', 'hubx_b3', 'hubx_b4'].forEach(function (k) { var i = new Image(); i.src = IMGDIR(k) + k + '.webp'; imgs[k] = i; });
    IMG.forEach(function (k) { jobs.push(new Promise(function (res) { var i = new Image(); i.onload = i.onerror = function () { tick(); res(); }; i.src = IMGDIR(k) + k + '.jpg'; imgs[k] = i; })); });
    SFX.forEach(function (k) { jobs.push(fetch('assets/sfx/' + k + '.mp3').then(function (r) { return r.ok ? r.arrayBuffer() : null; }).then(function (b) { rawAudio[k] = b; tick(); }).catch(function () { tick(); })); });
    VOICE.forEach(function (k) { jobs.push(fetch('assets/voice/' + k + '.mp3').then(function (r) { return r.ok ? r.arrayBuffer() : null; }).then(function (b) { rawAudio['v_' + k] = b; tick(); }).catch(function () { tick(); })); });
    return Promise.all(jobs);
  }
  function initAudio() {
    if (AC) { if (AC.state === 'suspended') AC.resume(); return Promise.resolve(); }
    var C = window.AudioContext || window.webkitAudioContext;
    if (!C) return Promise.resolve();
    AC = new C();
    BUS.master = AC.createGain(); BUS.master.connect(AC.destination);
    ['sfx', 'amb', 'music', 'voice'].forEach(function (b) { BUS[b] = AC.createGain(); BUS[b].connect(BUS.master); });
    applyVolumes();
    var jobs = Object.keys(rawAudio).map(function (k) {
      var ab = rawAudio[k]; if (!ab) return Promise.resolve();
      return new Promise(function (res) { try { AC.decodeAudioData(ab.slice(0), function (b) { BUF[k] = b; res(); }, function () { res(); }); } catch (e) { res(); } });
    });
    return Promise.all(jobs);
  }
  function applyVolumes() { if (!AC) return; var v = save.set.vol; BUS.master.gain.value = v.master; BUS.sfx.gain.value = v.sfx; BUS.amb.gain.value = v.amb; BUS.music.gain.value = v.music; }

  // spatial: volume / filter / pan by where the sound is vs where the player is
  function spatial(room) {
    if (!room || !game) return { vol: 1, cut: 20000, pan: 0 };
    if (game.chapter === 1) return c1Spatial(room);
    var pr = game.p.travel ? 'hall' : game.p.room;
    var X = AS.ROOM_X; var pan = Math.max(-0.8, Math.min(0.8, (X[room] - X[pr]) * 0.7));
    if (room === pr) return { vol: 1, cut: 20000, pan: 0 };
    if (room === 'hall' || pr === 'hall') return { vol: 0.6, cut: 2600, pan: pan };
    return { vol: 0.32, cut: 1100, pan: pan };
  }
  function play(id, o) {
    o = o || {};
    if (!AC || !BUF[id]) return null;
    var src = AC.createBufferSource(); src.buffer = BUF[id]; src.loop = !!o.loop;
    var g = AC.createGain(); var sp = o.room ? spatial(o.room) : { vol: 1, cut: 20000, pan: 0 };
    g.gain.value = (o.vol === undefined ? 1 : o.vol) * sp.vol;
    var f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = sp.cut;
    var node = src; node.connect(f); f.connect(g);
    var out = g;
    if (AC.createStereoPanner) { var p = AC.createStereoPanner(); p.pan.value = sp.pan; g.connect(p); out = p; }
    out.connect(BUS[o.bus || 'sfx']);
    try { src.start(AC.currentTime + (o.delay || 0), o.offset || 0); } catch (e) {}
    var h = { src: src, gain: g, filter: f, room: o.room, base: (o.vol === undefined ? 1 : o.vol) };
    if (o.loop) loops.push(h);
    src.onended = function () { var i = loops.indexOf(h); if (i >= 0) loops.splice(i, 1); };
    return h;
  }
  var loops = [];
  function stop(h, fade) { if (!h) return; try { if (fade && AC) { h.gain.gain.setTargetAtTime(0, AC.currentTime, fade / 3); h.src.stop(AC.currentTime + fade); } else h.src.stop(); } catch (e) {} }
  function stopAll() { loops.slice().forEach(function (h) { stop(h); }); loops = []; amb = {}; }
  function setLoopVol(h, v, room) { if (!h || !AC) return; var sp = room ? spatial(room) : { vol: 1, cut: 20000 }; h.gain.gain.setTargetAtTime(v * sp.vol, AC.currentTime, 0.25); h.filter.frequency.setTargetAtTime(sp.cut, AC.currentTime, 0.2); }
  var amb = {};

  // ------------------------------------------------------------ screens
  var game = null, raf = 0, lastT = 0, paused = false, nightIdx = 0, nightStart = 0, msgQ = [], msgT = 0, capT = 0, deathTimer = 0, introShown = false;
  function show(id) { ['scr-load', 'scr-menu', 'scr-settings', 'scr-nights', 'scr-custom', 'scr-credits', 'scr-phone', 'scr-intro', 'scr-pause', 'scr-win', 'scr-over', 'scr-end', 'scr-exit', 'scr-warn'].forEach(function (s) { $(s).classList.toggle('show', s === id); }); }
  var settingsFrom = 'scr-menu';

  function renderTexts() {
    document.documentElement.lang = save.set.lang === 'fil' ? 'fil' : 'en';
    document.querySelectorAll('[data-t]').forEach(function (el) { el.textContent = T(el.getAttribute('data-t')); });
    // menu words are Blender-rendered lettering (the text stays as the image's alt for screen readers)
    document.querySelectorAll('.mi [data-t], .mi[data-t], .dossier h2[data-t]').forEach(function (el) {
      var k = el.getAttribute('data-t'); if (WORDS.indexOf(k) < 0) return;
      var im = document.createElement('img'); im.className = 'wm'; im.alt = T(k); im.src = 'assets/ui/w_' + (save.set.lang === 'fil' ? 'fil' : 'en') + '_' + k + '.webp';
      im.onerror = function () { el.textContent = T(k); };
      el.textContent = ''; el.appendChild(im);
    });
    $('m-sub').textContent = T('title_sub');
    var cur = save.cur;
    $('m-cont').querySelector('small').textContent = T('ch_n', cur.ch) + ' · ' + T('night_n', cur.n);
    $('m-cont').disabled = save.prog.c1 === 0 && !save.pro.c1;
    $('m-nights').querySelector('small').textContent = (save.prog.c1 + save.prog.c2 + save.prog.c3) + ' / 17';
    var cuOpen = save.custom.unlocked || PREVIEW_ALL;
    $('m-custom').querySelector('small').textContent = cuOpen ? '' : T('locked');
    $('m-custom').disabled = !cuOpen;
    document.querySelectorAll('.langbtn').forEach(function (b) { b.classList.toggle('cur', b.getAttribute('data-lang') === save.set.lang); });
    renderSettings(); renderNights();
  }
  function renderSettings() {
    var s = save.set;
    document.querySelectorAll('[data-gfx]').forEach(function (b) { b.classList.toggle('cur', b.getAttribute('data-gfx') === s.gfx); b.textContent = T(b.getAttribute('data-gfx')); });
    ['master', 'sfx', 'amb', 'music'].forEach(function (k) { $('v-' + k).value = Math.round(s.vol[k] * 100); $('vl-' + k).textContent = Math.round(s.vol[k] * 100); });
    [['t-red', s.reduced], ['t-mot', s.motion]].forEach(function (x) { var b = $(x[0]); b.classList.toggle('on', !!x[1]); b.setAttribute('aria-checked', x[1] ? 'true' : 'false'); b.textContent = x[1] ? T('on') : T('off'); });
    $('gfx-note').textContent = T('gfx_' + s.gfx);
    if (s.sens === undefined) s.sens = 1; $('v-sens').value = Math.round(s.sens * 100); $('vl-sens').textContent = Math.round(s.sens * 100) + '%';
    applyGfx();
  }
  var CH_NIGHTS = { 1: 5, 2: 5, 3: 7 }, CH_READY = { 1: true, 2: true, 3: true };
  // PREVIEW: everything open so the whole game can be checked. Set to false to bring the normal unlocks back.
  var PREVIEW_ALL = true;
  function chUnlocked(ch) { return PREVIEW_ALL || ch === 1 || (ch === 2 && save.prog.c1 >= 5) || (ch === 3 && save.prog.c1 >= 5 && save.prog.c2 >= 5); }
  function renderNights() {
    var box = $('night-list'); box.innerHTML = '';
    [1, 2, 3].forEach(function (ch) {
      var card = document.createElement('div'); card.className = 'chcard' + (chUnlocked(ch) && CH_READY[ch] ? '' : ' locked');
      card.style.backgroundImage = 'linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.88) 62%),url(' + IMGDIR() + { 1: 'menu_bed', 2: 'hallway_empty', 3: 'menu_living_on' }[ch] + '.jpg)';
      var num = document.createElement('div'); num.className = 'chnum'; num.textContent = ch; card.appendChild(num);
      if (!chUnlocked(ch)) { var lk = document.createElement('div'); lk.className = 'chlock'; lk.textContent = T('locked'); card.appendChild(lk); }
      var h = document.createElement('h3'); h.textContent = T('ch_names')[ch];
      var p = document.createElement('p'); p.textContent = T('ch_desc')[ch];
      var row = document.createElement('div'); row.className = 'chnights';
      card.appendChild(h); card.appendChild(p);
      if (!CH_READY[ch]) { var sm = document.createElement('p'); sm.textContent = chUnlocked(ch) ? T('soon') : T('locked'); sm.style.color = '#e0a24a'; card.appendChild(sm); }
      else {
        var cleared = save.prog['c' + ch];
        for (var i = 1; i <= CH_NIGHTS[ch]; i++) {
          var b = document.createElement('button'); b.type = 'button'; b.textContent = i;
          b.disabled = !chUnlocked(ch) || (!PREVIEW_ALL && i > cleared + 1); if (i <= cleared) b.className = 'done';
          (function (n) { b.addEventListener('click', function () { startNight(n - 1, ch); }); })(i);
          row.appendChild(b);
        }
        card.appendChild(row);
      }
      box.appendChild(card);
    });
  }
  function applyGfx() {
    var g = save.set.gfx;
    $('grain').style.opacity = g === 'low' ? 0 : g === 'medium' ? 0.22 : 0.32;
    $('vig').style.display = g === 'low' ? 'none' : 'block';
    $('vig').classList.toggle('breathe', g === 'high' && !save.set.motion);
    $('cam').classList.toggle('hi', g === 'high');
    if (g === 'high') startDust(); else stopDust();
  }
  // High graphics: dust drifting through the light (a few dozen soft specks on one canvas)
  var dustRaf = 0, dustP = [];
  function startDust() {
    var c = $('dust'); if (!c || dustRaf) return; c.style.display = 'block'; c.width = 640; c.height = 360; var x = c.getContext('2d');
    dustP = []; for (var i = 0; i < 46; i++) dustP.push({ x: Math.random() * 640, y: Math.random() * 360, r: 0.4 + Math.random() * 1.3, vx: (Math.random() - 0.5) * 6, vy: -1 - Math.random() * 4, a: 0.05 + Math.random() * 0.2, ph: Math.random() * 6 });
    var last = performance.now();
    (function frame(now) {
      dustRaf = requestAnimationFrame(frame); var dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!game || paused) { x.clearRect(0, 0, 640, 360); return; }
      x.clearRect(0, 0, 640, 360);
      dustP.forEach(function (p) {
        p.ph += dt; p.x += (p.vx + Math.sin(p.ph) * 3) * dt; p.y += p.vy * dt;
        if (p.y < -4) { p.y = 364; p.x = Math.random() * 640; } if (p.x < -4) p.x = 644; if (p.x > 644) p.x = -4;
        x.fillStyle = 'rgba(255,236,200,' + (p.a * (0.6 + 0.4 * Math.sin(p.ph * 2))).toFixed(3) + ')'; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.283); x.fill();
      });
    })(last);
  }
  function stopDust() { if (dustRaf) cancelAnimationFrame(dustRaf); dustRaf = 0; var c = $('dust'); if (c) { c.style.display = 'none'; } }

  // grain: one small noise tile, moved around (cheap on low-end phones)
  function makeGrain() {
    var c = document.createElement('canvas'); c.width = c.height = 160; var x = c.getContext('2d'); var d = x.createImageData(160, 160);
    for (var i = 0; i < d.data.length; i += 4) { var v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0);
    $('grain').style.backgroundImage = 'url(' + c.toDataURL() + ')';
  }

  // ------------------------------------------------------------ night flow
  var curCh = 1;
  function startNight(idx, ch) {
    preloadScares();
    customRun = null;
    curCh = ch || curCh || 1;
    if (curCh === 1 && idx === 0 && !save.pro.c1 && !window.__AS_NOCALL) { return prologue('c1', function () { save.pro.c1 = true; store(); startNight(0, 1); }); }
    stopMenu();
    nightIdx = idx; if (call) endCall(true); stopAll();
    if (raf) cancelAnimationFrame(raf);
    game = null; paused = false;
    var n = idx + 1;
    $('intro-n').textContent = T('night_n', n);
    $('intro-name').textContent = curCh <= 3 ? T('ch_n', curCh) + ' · ' + T('c' + curCh + '_night_names')[idx] : T('night_names')[idx];
    var rules = $('intro-rules'); rules.innerHTML = '';
    var list = curCh === 1 ? C1_RULES[n] : curCh === 2 ? C2_RULES[n] : curCh === 3 ? C3_RULES[n] : (idx === 4 ? [] : (STR.en.intro_rules[n] || []));
    // remind earlier threats briefly on later nights
    list.forEach(function (w) {
      var d = document.createElement('div'); d.className = 'rule';
      var im = document.createElement('img'); im.src = IMGDIR() + HERO[w] + '.jpg'; im.alt = '';
      var tx = document.createElement('div'); var b = document.createElement('b'); b.textContent = T('new_threat') + ': ' + T('who')[w];
      var p = document.createElement('div'); p.textContent = curCh === 1 ? T('c1_hint')[w] : (T('hint')[w] || T('c1_hint')[w]); p.style.marginTop = '6px'; p.style.fontSize = '16px'; p.style.lineHeight = '1.45';
      tx.appendChild(b); tx.appendChild(p); d.appendChild(im); d.appendChild(tx); rules.appendChild(d);
    });
    if (curCh <= 3) {   // the e-fan / sanity rule, every night
      var fr = document.createElement('div'); fr.className = 'rule';
      var fim = document.createElement('img'); fim.src = IMGDIR() + (curCh === 2 ? 'menu_living_on' : 'menu_bed') + '.jpg'; fim.alt = '';
      var ftx = document.createElement('div'); var fb = document.createElement('b'); fb.textContent = T('fan_rule_t');
      var fp = document.createElement('div'); fp.textContent = T('fan_rule_c' + curCh) + ' ' + T(idx <= 1 ? 'fan_rule_n12' : idx <= 4 ? 'fan_rule_n35' : 'fan_rule_n67') + (curCh === 3 && idx >= 5 ? ' ' + T('fan_rule_dark') : ''); fp.style.marginTop = '6px'; fp.style.fontSize = '16px'; fp.style.lineHeight = '1.45';
      ftx.appendChild(fb); ftx.appendChild(fp); fr.appendChild(fim); fr.appendChild(ftx); rules.insertBefore(fr, rules.firstChild);
    }
    rules.classList.toggle('many', rules.children.length >= 3);
    if (curCh === 3 && idx >= 2) { var f3 = document.createElement('p'); f3.className = 'sub'; f3.textContent = T(idx <= 4 ? 'c3_cut' : idx === 5 ? 'c3_dark' : 'c3_final'); rules.appendChild(f3); }
    else if (idx >= 3) { var f = document.createElement('p'); f.className = 'sub'; f.textContent = curCh === 1 ? (idx === 3 ? T('c1_all') : T('c1_final')) : curCh === 2 ? T(idx === 3 ? 'c2_n4' : 'c2_n5') : T('final_night'); rules.appendChild(f); }
    show('scr-intro');
    play('dog_howl', { bus: 'amb', vol: 0.5 });
  }
  var C2_IMG = ['hallway_empty', 'hallway_salatv', 'living_tvoff', 'living_empty', 'living_lights', 'living_lights_off_tv', 'living_malik', 'kitchen_empty', 'kitchen_kal',
    'cabinet_empty', 'cabinet_kal', 'curtain_closed', 'curtain_shadow', 'curtain_open', 'curtain_s1', 'curtain_s2', 'curtain_silip', 'curtain_glass', 'sofa_tvoff', 'sofa_tv', 'sofa_lights', 'sofa_lights_tv', 'sofa_malik'];
  var C3_LIT = ['c3_bed_c', 'c3_bed_closed_c', 'c3_bed_kumot_c', 'hallway_empty_c', 'hallway_kumot_c', 'living_tvoff_c', 'living_malik_c', 'kitchen_empty_c', 'kitchen_kal_c',
    'curtain_closed_c', 'curtain_shadow_c', 'curtain_open_c', 'curtain_s1_c', 'curtain_s2_c', 'curtain_silip_c', 'curtain_glass_c'];
  var C3_IMG = ['c3_bed', 'c3_bed_closed', 'c3_bed_kumot', 'hallway_kumot', 'c3_look', 'c3_look_tv', 'c3_look_k2', 'c3_look_k3', 'c3_bed_c', 'c3_bed_closed_c', 'c3_bed_kumot_c',
    'hallway_empty_c', 'hallway_kumot_c', 'living_tvoff_c', 'living_malik_c', 'kitchen_empty_c', 'kitchen_kal_c', 'cabinet_empty_c', 'cabinet_kal_c', 'curtain_closed_c', 'curtain_shadow_c',
    'curtain_open_c', 'curtain_s1_c', 'curtain_s2_c', 'curtain_silip_c', 'curtain_glass_c', 'c1_under', 'c1_under_kumot', 'c1_under_kin', 'c1_under_klift', 'c1_peek_0', 'c1_peek_2', 'c1_peek_3', 'hero_barang', 'sofa_tvoff_c', 'sofa_malik_c'];
  function beginNight() {
    pan.mem = {}; pan.place = ''; pan.fv = 0; pan.v = 0; c3d.on = false; c3d.light = false; walkPreload(curCh === 1 ? 1 : 2);   // each night starts facing the door; within a night every room remembers where you left the view
    if (curCh === 3) C2_IMG.concat(C3_IMG, C3_LIT.map(function (k) { return k + 'l'; })).forEach(function (k) { if (!imgs[k]) { var i = new Image(); i.src = IMGDIR(k) + k + '.jpg'; imgs[k] = i; } });
    if (curCh === 2) C2_IMG.forEach(function (k) { if (!imgs[k]) { var i = new Image(); i.src = IMGDIR(k) + k + '.jpg'; imgs[k] = i; } });
    initAudio().then(function () {
      show(null); fit();
      game = curCh === 1 ? C1.create(nightIdx, { seed: (Date.now() & 0xffffff) }) : AS.create(nightIdx, { seed: (Date.now() & 0xffffff), chapter: curCh === 2 || curCh === 3 ? curCh : 0, custom: customRun ? customRun.lv : null, dark: customRun && customRun.lv.dark });
      nightStart = performance.now(); paused = false; deathTimer = 0;
      lastView = ''; hotSig = ''; viewLock = null; camClear(); black(0, 10); $('fx').innerHTML = '';
      setView(true, true); renderHUD();
      amb.house = play('amb_house', { bus: 'amb', loop: true, vol: 0.55 });
      amb.garden = play('amb_garden', { bus: 'amb', loop: true, vol: 0.5, room: curCh === 1 ? 'window' : 'curtain' });
      if (nightIdx === 4 && curCh === 3) amb.rain = play('rain_heavy', { bus: 'amb', loop: true, vol: 0.55 });
      msgQ = []; msgT = 1.2;
      if (!window.__AS_NOCALL && !customRun) startCall(curCh <= 3 ? 'c' + curCh + 'n' + game.night : game.night);
      buildHot();
      if (game.night === 1) setTimeout(function () { if (game && call && call.state === 'ring') hint(T('ph_answer') + ' ☎', 4); }, 2500);
      lastT = performance.now(); raf = requestAnimationFrame(loop);
      scheduleRandomAmb();
    });
  }
  var ambTimer = 0;
  function scheduleRandomAmb() { ambTimer = 18 + Math.random() * 25; }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    var dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    if (!game || paused) return;
    if (game.over) { handleEvents(); return; }

    if (!(call && call.state === 'ring')) game.update(dt * (window.__AS_SPEED || 1));
    callTick(dt);
    handleEvents();
    if (!game) return;
    // messages
    if (msgQ.length) { msgT -= dt; if (msgT <= 0) { showMsg(msgQ.shift()); msgT = 5.5; } }
    if (capT > 0) { capT -= dt; if (capT <= 0) $('cap').style.opacity = 0; }
    ambTimer -= dt; if (ambTimer <= 0 && isC1()) { play(['tuko_gecko', 'tricycle_far', 'dog_howl'][Math.floor(Math.random() * 3)], { bus: 'amb', vol: 0.35, room: 'window' }); scheduleRandomAmb(); }
    if (ambTimer <= 0) { var pick = ['tuko_gecko', 'tricycle_far', 'tuko_gecko', 'distant_scream'][Math.floor(Math.random() * (game.night >= 3 ? 4 : 3))]; play(pick, { bus: 'amb', vol: 0.45, room: 'curtain' }); scheduleRandomAmb(); }
    // ambience loops follow the player
    if (isC1()) c1Ambience(); else {
    setLoopVol(amb.garden, game.house.cricketsOff > 0 ? 0.0 : 0.5, 'curtain');
    if (game.house.tv && !amb.tv) { amb.tv = play('tv_static', { bus: 'amb', loop: true, vol: 0.5, room: 'living' }); }
    if (!game.house.tv && amb.tv) { stop(amb.tv, 0.3); amb.tv = null; }
    if (amb.tv) setLoopVol(amb.tv, 0.5, 'living');
    if (game.house.lights && !amb.hum) amb.hum = play('fluorescent_hum', { bus: 'amb', loop: true, vol: 0.4, room: 'living' });
    if (!game.house.lights && amb.hum) { stop(amb.hum, 0.2); amb.hum = null; }
    if (amb.hum) setLoopVol(amb.hum, 0.4, 'living');
    }
    if (c3d.light && game && !isC1()) { game.p.battery = Math.max(0, game.p.battery - dt * 0.6); if (game.p.battery <= 0 || !c3d.on) c3DoorLight(false); }
    if (c3d.on && game && (game.p.room !== 'bedroom' || game.p.hidden)) { c3d.on = false; c3d.light = false; game.doorView = false; }
    setView(false); panTick(dt); fanTick(dt); fanAudio(); tiredTick(); renderHUD();
    var H = game.house, P = game.p;
    var st = isC1() ? [P.pos, !!P.travel, H.curtain, H.power, !!call].join() : [P.room, !!P.travel, P.hidden, H.door, H.tv, H.lights, H.power, H.curtain, P.salt, !!call].join();
    if (st !== loop._st) { loop._st = st; buildHot(); }
    holdCam();
  }

  // ------------------------------------------------------------ events -> sound, captions, visuals
  function cap(key) { return; var c = L().cap[key] || STR.en.cap[key]; if (!c) return; $('cap').textContent = c; $('cap').style.opacity = 1; capT = 3.6; }
  function showMsg(text) { $('msg-text').textContent = text; $('msg').classList.add('show'); play('phone_text', { vol: 0.7 }); clearTimeout(showMsg._t); showMsg._t = setTimeout(function () { $('msg').classList.remove('show'); }, 5000); }
  var breathH = null, holdH = null, holdHName = '', runH = null;
  function handleEvents() {
    var ev = game.events; game.events = [];
    for (var i = 0; i < ev.length; i++) {
      var e = ev[i], d = e.data;
      if (game && game.chapter === 1) { c1Events(e); if (!game) return; continue; }
      switch (e.type) {
        case 'cue': play(d.id, { room: d.room, vol: (d.vol || 1) * fanMask(), delay: d.delay || 0 }); if (d.cap) cap(d.cap); break;
        case 'travel': onTravel(d); break;
        case 'arrive': onArrive(d); break;
        case 'door_open':
          if (d.forced) {   // she pushes it open: if you were at the door you are thrown back into the room
            play('door_slam', { room: 'bedroom' }); play('door_creak', { room: 'bedroom', vol: 0.6, delay: 0.1 }); cap('kumot_enter');
            if (c3d.on) { c3d.on = false; c3d.light = false; game.doorView = false; swing = null; setView(true, true); buildHot(); } else if (here('bedroom')) doorAnim(false, 260);
            jolt();
          }
          else if (c3d.on) c1Swing(false);
          else { play('door_open_slow', { room: 'bedroom' }); if (here('bedroom')) doorAnim(false, 950); }
          break;
        case 'door_close': if (c3d.on) c1Swing(true); else { play('door_close_shut', { room: 'bedroom', vol: 0.9 }); if (here('bedroom')) doorAnim(true, 420); } break;
        case 'hide': onHide(d.spot, true); break;
        case 'unhide': onHide(d.spot, false); break;
        case 'crinkle': break;
        case 'tv_off': play('tv_click_off', { vol: 0.8 }); tvOffAnim(); break;
        case 'light_switch': play('light_switch'); lightAnim(game.house.lights); break;
        case 'curtain_open': play('curtain_open_pull', { room: 'curtain' }); if (here('curtain')) curtainAnim(true); break;
        case 'curtain_close': play('curtain_close_pull', { room: 'curtain', vol: 0.9 }); if (here('curtain')) curtainAnim(false); break;
        case 'salt': play('salt_throw', { vol: 0.9 }); saltAnim(); break;
        case 'kal_retreat': play('sniff', { room: 'kitchen' }); cap('kal_retreat'); break;
        case 'breaker': play('breaker'); cap('breaker'); flashWhite(); jolt(); break;
        case 'blackout': play('power_down'); cap('blackout'); jolt(); if (e.data && e.data.cut) { play('light_switch', { vol: 0.9, room: 'living' }); hint(T('c2_cut'), 4); } break;
        case 'breaker_fail': play('door_slam', { vol: 0.5 }); jolt(); break;
        case 'barang_step': play('aparador_creak', { room: 'bedroom', vol: 0.5 + e.data.st * 0.12 }); if (e.data.st >= 3) play('beetles', { room: 'bedroom', vol: 0.6 }); if (e.data.st === 3 && here('bedroom')) hint(T('c3_barang'), 3); break;
        case 'barang_out': play('beetle_scatter', { room: 'bedroom', vol: 1 }); break;
        case 'barang_back': play('cabinet_close', { room: 'bedroom', vol: 0.6 }); break;
        case 'no_power': cap('no_power'); hint(T('cap').no_power || ''); break;
        case 'crickets_off': cap('crickets'); break;
        case 'silip_back': cap('silip_back'); break;
        case 'malik_return': cap('malik_return'); break;
        case 'gasp': play('breath_hold_gasp', { offset: 8.0, vol: 1 }); cap('gasp'); stopBreath(); jolt(); break;
        case 'fan': fanEvent(d); break;
        case 'fan_nopower': hint(T('fan_nopower'), 3); break;
        case 'tired': if (d.lvl === 1) { play('yawn', { vol: 0.7 }); hint(T('tired1'), 4); } else if (d.lvl === 2) { play('yawn', { vol: 0.9 }); hint(T('tired2'), 4); } break;
        case 'pant': play('run_pant', { vol: 0.35 + 0.3 * d.v }); if (!save.seenPant) { save.seenPant = 1; hint(T('pant_hint'), 3.5); } break;
        case 'battery_dead': cap('battery_dead'); break;
        case 'heartbeat': if (d.on && !amb.heart) amb.heart = play('heartbeat', { loop: true, vol: 0.55 }); else if (!d.on && amb.heart) { stop(amb.heart, 0.6); amb.heart = null; } break;
        case 'win': onWin(); break;
        case 'death': onDeath(d.who); break;
      }
    }
  }
  function here(r) { return game && !game.p.travel && game.p.room === r; }
  function lowFx() { return save.set.gfx === 'low' || !!save.set.motion; }
  function jolt() { if (lowFx()) return; var s = $('view'); s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake'); }
  function stopBreath() { if (breathH) { stop(breathH, 0.2); breathH = null; } }
  function hint(t, sec) { var h = $('hint'); if (!t) return; h.textContent = t; h.style.opacity = 1; clearTimeout(hint._t); hint._t = setTimeout(function () { h.style.opacity = 0; }, (sec || 3) * 1000); }
  function speed() { return window.__AS_SPEED || 1; }

  // ------------------------------------------------------------ camera rig (first-person moves, all from the still renders)
  var cam = null, camA = null, busyUntil = 0, viewLock = null, walkPt = [50, 60];
  function camAnim(frames, ms, origin, easing) {
    cam = cam || $('cam');
    if (camA) { try { camA.cancel(); } catch (e) {} camA = null; }
    if (!cam.animate) return null;
    cam.style.transformOrigin = origin ? origin[0] + '% ' + origin[1] + '%' : '50% 50%';
    camA = cam.animate(frames, { duration: Math.max(60, ms), easing: easing || 'ease-in-out', fill: 'forwards' });
    busyUntil = performance.now() + ms;
    // hotspot marks would sit in the wrong place while the picture moves: hide them until the camera settles
    var hb = $('hot'); hb.classList.add('moving'); clearTimeout(hb._mv); hb._mv = setTimeout(function () { hb.classList.remove('moving'); }, ms + 80);
    return camA;
  }
  function camClear() { if (camA) { try { camA.cancel(); } catch (e) {} camA = null; } }
  function black(op, ms, delay) { var b = $('black'); b.style.transition = 'opacity ' + (ms || 200) + 'ms ease ' + (delay || 0) + 'ms'; b.style.opacity = op; }
  // footsteps: n steps of head bob while pushing toward a point
  function bobFrames(n, zoomTo, amp, roll, zoomFrom) {
    var f = [], steps = n * 2;
    for (var i = 0; i <= steps; i++) {
      var k = i / steps, z = (zoomFrom || 1) + (zoomTo - (zoomFrom || 1)) * (k * k * 0.6 + k * 0.4);
      var y = (i % 2 ? amp : -amp * 0.4), r = (i % 4 === 1 ? roll : i % 4 === 3 ? -roll : 0);
      if (i === 0 || i === steps) { y = 0; r = 0; }
      f.push({ transform: 'scale(' + z.toFixed(3) + ') translateY(' + y + 'px) rotate(' + r + 'deg)', offset: k });
    }
    return f;
  }
  // MOVING between places (quick, frame by frame on the pictures): you push into the view you are leaving with a head bob,
  // a short dip to dark at the halfway point, then the place you are going to comes up and settles as you step in.
  // Running: faster steps, more sway. Reduce motion: only the dip to dark.
  var travT = [], travAnim = false;
  function travClear() { travT.forEach(clearTimeout); travT = []; travAnim = false; var c_ = $('cam'); if (c_) c_.style.filter = ''; var ir = $('iris'); if (ir) ir.style.opacity = 0; var bk = $('black'); if (bk) bk.classList.remove('static'); }
  function destKey(to) {   // the picture you will see on arriving (state as it is now)
    var g = game, p = g.p, tr = p.travel, k;
    if (isC1()) { var pp = p.pos; p.travel = null; p.pos = to; k = c1Key(); p.pos = pp; p.travel = tr; }
    else { var r = p.room; p.travel = null; p.room = to; k = viewKeyRaw(); p.room = r; p.travel = tr; }
    return k;
  }
  // dark blue-black static (made once), shown in the dark between two places
  var noiseURL = null;
  function noiseTex() {
    if (noiseURL) return noiseURL;
    var c = document.createElement('canvas'); c.width = c.height = 256; var x = c.getContext('2d'), im = x.createImageData(256, 256);
    for (var i = 0; i < im.data.length; i += 4) { var v = Math.random() * 46; im.data[i] = v * 0.55; im.data[i + 1] = v * 0.62; im.data[i + 2] = v; im.data[i + 3] = 255; }
    x.putImageData(im, 0, 0); noiseURL = c.toDataURL(); document.documentElement.style.setProperty('--noise', 'url(' + noiseURL + ')'); return noiseURL;
  }
  function irisRun(pt, ms) {   // a dark ring closing in on the point you walk to
    var el = $('iris'), t0 = performance.now(); if (!el) return;
    (function step() {
      var k = Math.min(1, (performance.now() - t0) / ms); if (!travAnim) { el.style.opacity = 0; return; }
      var r0 = 95 - 80 * k * k, r1 = r0 + 22;
      el.style.background = 'radial-gradient(circle at ' + pt[0] + '% ' + pt[1] + '%, rgba(0,0,0,0) ' + r0.toFixed(1) + '%, rgba(0,0,0,.97) ' + r1.toFixed(1) + '%)';
      el.style.opacity = 1;
      if (k < 1) requestAnimationFrame(step);
    })();
  }
  function staticRun(ms) {   // the static crawls while it is dark
    var b = $('black'), t0 = performance.now(); noiseTex(); b.classList.add('static');
    (function step() {
      if (performance.now() - t0 > ms || !travAnim) { b.classList.remove('static'); b.style.backgroundPosition = ''; return; }
      if (!save.set.motion) b.style.backgroundPosition = ((Math.random() * 256) | 0) + 'px ' + ((Math.random() * 256) | 0) + 'px';
      requestAnimationFrame(step);
    })();
  }
  function travelAnim(to, ms, run, outPt, inPt, place) {
    // FNAF4: you lean into the point you are going to while the view closes round it, a moment of dark static, then the
    // new place comes up out of the dark and settles. Running is the same, only quicker.
    travClear(); travAnim = true;
    var A = ms * 0.42, S = ms * 0.2, B = ms - A - S, c_ = $('cam'), pt = outPt || walkPt;
    var swap = function () {
      if (!game || !game.p.travel) return;
      if (place) { pan.x = pan.t = pan.mem[place] !== undefined ? pan.mem[place] : (PAN_HOME[place] || 0.5); }
      viewLock = { key: destKey(to), until: performance.now() + B + 600 }; setView(true, true); buildHot();
      $('iris').style.opacity = 0; c_.style.filter = '';
      if (!lowFx()) camAnim([{ transform: 'scale(1.1)' }, { transform: 'scale(1)' }], B, inPt || (isC1() && to === 'center' && C1PT[game.p.travel.from] ? panToView(C1PT[game.p.travel.from]) : [50, 55]), 'cubic-bezier(.2,.7,.3,1)');
      black(0, B * 0.8);
    };
    if (lowFx()) {   // reduce motion: no zoom or ring, just the dark (with still static) and the new place
      black(1, Math.min(220, A)); travT.push(setTimeout(function () { staticRun(S); }, A)); travT.push(setTimeout(swap, A + S)); return;
    }
    camAnim([{ transform: 'scale(1)' }, { transform: 'scale(' + (run ? 1.75 : 1.55) + ')' }], A, pt, 'cubic-bezier(.5,0,.85,.4)');
    c_.style.filter = run ? 'blur(1.2px)' : '';
    irisRun(pt, A);
    black(1, A * 0.25, A * 0.8);
    travT.push(setTimeout(function () { staticRun(S + B * 0.3); }, A));
    travT.push(setTimeout(swap, A + S));
  }
  function onTravel(d) {
    $('hint').style.opacity = 0;
    var run = d.run, ms = d.t * 1000 / speed();
    var surf = d.to === 'kitchen' || d.to === 'living' || d.from === 'kitchen' || d.from === 'living';
    play('turn_whoosh', { vol: 0.5 });
    steps(Math.max(2, Math.round(ms / (run ? 200 : 300))), ms, surf ? 'cement' : 'wood', run);
    if (run) { if (runH) stop(runH, 0.1); runH = play('run_pant', { vol: 0.5 }); play('floor_creak', { vol: 0.7 }); }
    releaseHolds(); buildHot();
    if (walkStart(d.from, d.to, d.t / speed())) return;
    travelAnim(d.to, ms, run, walkPt, [50, 55], ({ bedroom: 1, living: 1, kitchen: 1 })[d.to] ? d.to : '');
  }
  function onArrive() {
    if (runH) { stop(runH, 1.2); runH = null; }
    var ours = travAnim; travClear(); viewLock = null;
    if (!ours) camClear();
    setView(true, true); panTick(0); buildHot();
    if (Math.random() < 0.35) play('floor_creak', { vol: 0.4 });
    black(0, 200); var c_ = $('cam'); if (c_) c_.style.filter = '';
    walkEnd();
    if (game && game.p.room === 'hall' && game.night === 1 && !onArrive._hallHint) { onArrive._hallHint = 1; hint(T('h_light'), 4); }
  }
  // swing the bedroom door: a cut-out of the closed door rotating on its hinge
  var DOOR = { x: 516, y: 198, w: 169, h: 374 }, DOOR3 = { x: 402, y: 236, w: 158, h: 300 }, DOOR3P = { x: 0.366, y: 0.255, w: 0.086, h: 0.595 };   // the bedroom door's box in the bedroom panorama
  function c3Look() {
    if (!game || game.p.travel || game.house.door) return;
    if (game.dark) { if (game.p.battery <= 0) return; game.p.battery = Math.max(0, game.p.battery - 3); play('flashlight_on', { vol: 0.5 }); }
    play('door_creak', { vol: 0.3 });
    viewLock = { key: c3LookKey(), until: performance.now() + 1500 }; setView(true, true);
    if (game.k.st === 3) { play('wheeze', { vol: 0.9 }); jolt(); }
    setTimeout(function () { viewLock = null; if (game) setView(true, true); }, 1520);
  }
  function doorAnim(closing, ms) {
    var fx = $('fx'); fx.innerHTML = '';
    if (lowFx()) { setView(true, true); return; }
    var c3 = game && game.chapter === 3, R = c3 ? DOOR3 : DOOR, sfx = c3 && game.dark ? '_c' : '';
    var leaf = document.createElement('div'); leaf.className = 'leaf';
    var lk_ = c3 ? 'c3_bed_closed' + sfx : 'bedroom_closed', K_ = kOf(lk_);
    if (K_ > 1.01) {   // turnable bedroom: the door's place in the panorama, where the panorama sits right now
      var W_ = K_ * 1280, o_ = -pan.x * (K_ - 1) * 1280, P_ = DOOR3P;
      leaf.style.cssText = 'left:' + (P_.x * W_ + o_) + 'px;top:' + P_.y * 720 + 'px;width:' + P_.w * W_ + 'px;height:' + P_.h * 720 + 'px;background-image:url(' + IMGDIR() + lk_ + '.jpg);background-size:' + W_ + 'px 720px;background-position:-' + P_.x * W_ + 'px -' + P_.y * 720 + 'px;transform-origin:0 50%';
    } else
    leaf.style.cssText = 'left:' + R.x + 'px;top:' + R.y + 'px;width:' + R.w + 'px;height:' + R.h + 'px;background-image:url(assets/img/' + lk_ + '.jpg);background-position:-' + R.x + 'px -' + R.y + 'px';
    fx.appendChild(leaf);
    var open = K_ > 1.01 ? 'perspective(900px) rotateY(-78deg)' : 'rotateY(-78deg)', shut = K_ > 1.01 ? 'perspective(900px) rotateY(0deg)' : 'rotateY(0deg)';   // the real door hangs on its left jamb
    // the room behind the leaf is the "open" picture during the swing
    viewLock = { key: closing ? (c3 ? 'c3_bed' + sfx : 'bedroom_empty') : viewKeyRaw(), until: performance.now() + ms };
    setView(true, true);
    var a = leaf.animate([{ transform: closing ? open : shut }, { transform: closing ? shut : open }], { duration: ms, easing: closing ? 'cubic-bezier(.5,0,.9,.6)' : 'cubic-bezier(.2,.6,.3,1)', fill: 'forwards' });
    a.onfinish = function () { viewLock = null; setView(true, true); fx.innerHTML = ''; if (closing) jolt(); };
    if (closing) camAnim([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], ms + 250, panToView([39.9, 55]));
  }
  // red curtains slide apart / together (two halves of the closed-curtain render)
  function curtainAnim(opening) {
    var fx = $('fx'); fx.innerHTML = '';
    if (lowFx()) { setView(true, true); return; }
    var L = document.createElement('div'), R = document.createElement('div');
    L.className = R.className = 'half';
    if (game && game.chapter >= 2) {   // the one house: only the cloth inside the back-door frame slides apart
      var ck = 'curtain_closed' + (game.dark ? '_c' : ''), X0 = 384, XM = 627, X1 = 870;
      L.style.cssText = 'left:' + X0 + 'px;width:' + (XM - X0) + 'px;background-image:url(assets/img/' + ck + '.jpg);background-position:-' + X0 + 'px 0;transform-origin:0 50%';
      R.style.cssText = 'left:' + XM + 'px;width:' + (X1 - XM) + 'px;background-image:url(assets/img/' + ck + '.jpg);background-position:-' + XM + 'px 0;transform-origin:100% 50%';
    } else {
    L.style.cssText = 'left:0;background-image:url(assets/img/curtain_closed.jpg);background-position:0 0;transform-origin:0 50%';
    R.style.cssText = 'right:0;background-image:url(assets/img/curtain_closed.jpg);background-position:-640px 0;transform-origin:100% 50%';
    }
    fx.appendChild(L); fx.appendChild(R);
    var ms = opening ? 700 : 520;
    var shutL = 'translateX(0) scaleX(1)', openL = 'translateX(0) scaleX(.3)', shutR = shutL, openR = openL;
    viewLock = { key: opening ? viewKeyRaw() : lastKey, until: performance.now() + ms };
    setView(true, true);
    var ease = opening ? 'cubic-bezier(.3,.7,.3,1)' : 'cubic-bezier(.6,0,.8,.5)';
    L.animate([{ transform: opening ? shutL : openL }, { transform: opening ? openL : shutL }], { duration: ms, easing: ease, fill: 'forwards' });
    var a = R.animate([{ transform: opening ? shutR : openR }, { transform: opening ? openR : shutR }], { duration: ms, easing: ease, fill: 'forwards' });
    a.onfinish = function () { viewLock = null; setView(true, true); fx.innerHTML = ''; };
  }
  // crouch / crawl into hiding spots
  var HIDE_PT = { bed: [14, 86], cabinet: [32, 74], sofa: [14, 96] };
  function onHide(spot, inside, travelMs) {
    var snd = { bed: inside ? 'hide_bed' : 'unhide_bed', cabinet: inside ? 'hide_cabinet' : 'cabinet_open', sofa: 'hide_sofa' }[spot];
    play(snd, { vol: 0.9 });
    releaseHolds();
    if (lowFx()) {   // reduce motion: a short dip to black, and the new view only once you are really there
      var wait = Math.max(200, travelMs || 0) + 30;
      viewLock = { key: lastKey, until: performance.now() + wait }; black(1, 150);
      setTimeout(function () { viewLock = null; if (!game) return; setView(true, true); buildHot(); black(0, 260); }, wait);
      return;
    }
    var ms = spot === 'sofa' ? 380 : 520;
    var key = lastKey;
    viewLock = { key: key, until: performance.now() + ms };
    var down = inside ? (spot === 'bed' ? 'scale(1.7) translateY(60px) rotate(-7deg)' : spot === 'cabinet' ? 'scale(2.3) translateY(20px)' : 'scale(1.3) translateY(70px) rotate(-3deg)')
      : 'scale(1.25) translateY(-50px) rotate(4deg)';
    camAnim([{ transform: 'scale(1)' }, { transform: down }], ms, inside ? HIDE_PT[spot] : [50, 30], 'cubic-bezier(.5,0,.8,.6)');
    black(spot === 'sofa' ? 0.5 : 1, ms * 0.45, ms * 0.55);
    setTimeout(function () {
      viewLock = null; camClear(); setView(true, true); buildHot(); black(0, 380);
      var from = inside ? (spot === 'bed' ? 'scale(1.3) translateY(-40px) rotate(5deg)' : 'scale(1.2)') : 'scale(1.2) translateY(60px) rotate(-3deg)';
      camAnim([{ transform: from }, { transform: 'scale(1)' }], 600, [50, 50], 'ease-out');
      if (inside && spot === 'bed' && game && game.night <= 2) hint(T('h_breath'), 4);
    }, ms);
  }
  var TV_SCREEN = { x: 70.4, y: 59.0, w: 5.4, h: 24.7 };   // the CRT's glass in the sala panorama (%)
  function tvOffAnim() {
    if (!here('living')) return;
    lastAct = performance.now(); setView(true, true);   // the dark-TV picture is in place the same frame the glow starts to collapse
    if (lowFx()) return;
    var K = panK(), r = K > 1.01 ? { l: (TV_SCREEN.x / 100 * K - pan.x * (K - 1)) * 1280, t: TV_SCREEN.y / 100 * 720, w: TV_SCREEN.w / 100 * K * 1280, h: TV_SCREEN.h / 100 * 720 } : { l: 494, t: 350, w: 174, h: 150 };
    var fx = $('fx'), c = document.createElement('div'); c.className = 'crt';
    c.style.cssText = 'left:' + r.l.toFixed(1) + 'px;top:' + r.t.toFixed(1) + 'px;width:' + r.w.toFixed(1) + 'px;height:' + r.h.toFixed(1) + 'px;transform-origin:50% 50%'; fx.appendChild(c);
    var a = c.animate([{ transform: 'scale(1,1)', opacity: 0.9 }, { transform: 'scale(1,.03)', opacity: 1, offset: 0.45 }, { transform: 'scale(.02,.02)', opacity: 0 }], { duration: 300, easing: 'ease-in' });
    a.onfinish = function () { c.remove(); };
  }
  function lightAnim(on) {
    if (!here('living') || lowFx()) return;
    var im = $(front);
    if (on && im.animate) im.animate([{ filter: 'brightness(.3)' }, { filter: 'brightness(1.4)', offset: 0.15 }, { filter: 'brightness(.4)', offset: 0.3 }, { filter: 'brightness(1.2)', offset: 0.45 }, { filter: 'brightness(.6)', offset: 0.6 }, { filter: 'brightness(1.05)' }], { duration: 700 });
  }
  function saltAnim() {
    if (lowFx()) return;
    var fx = $('fx');
    for (var i = 0; i < 26; i++) {
      var g = document.createElement('div'); g.className = 'grainS'; g.style.left = (560 + Math.random() * 160) + 'px'; g.style.top = '700px'; fx.appendChild(g);
      var dx = (Math.random() - 0.5) * 900, dy = -300 - Math.random() * 380;
      (function (el) { var a = el.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.4)', opacity: 0 }], { duration: 500 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.4,1)' }); a.onfinish = function () { el.remove(); }; })(g);
    }
    jolt();
  }
  function flashWhite() { var f = $('black'); f.style.transition = 'none'; f.style.background = '#fff'; f.style.opacity = 0.7; setTimeout(function () { f.style.transition = 'opacity .4s'; f.style.opacity = 0; setTimeout(function () { f.style.background = '#000'; }, 420); }, 70); }

  // ------------------------------------------------------------ view (which pre-rendered image)
  var lastView = '', lastKey = '', front = 'bgA';
  // Hiding. Under the bed: Kumot comes in (you see her from the waist down), stands beside the bed, then gets down on the
  // floor and lifts the blanket (her face at the gap). Behind the sofa: lying on the floor, the TV straight ahead; when
  // Malikmata is out, half of it shows past the end of the sofa.
  function underKey(stage) { return ['c1_under_kin', 'c1_under_kumot', 'c1_under_klift'][stage] || 'c1_under'; }
  function sofaKey(g, H) {
    if (g.dark) return g.m.st === 2 ? 'sofa_malik_c' : 'sofa_tvoff_c';
    if (g.m.st === 2) return 'sofa_malik';
    return H.tv ? (H.lights ? 'sofa_lights_tv' : 'sofa_tv') : (H.lights ? 'sofa_lights' : 'sofa_tvoff');
  }
  function viewKeyRaw() {
    if (isC1()) return c1Key();
    var g = game, p = g.p, H = g.house;
    if (p.travel) return lastKey || 'hallway_empty';
    if (c3d.on && p.room === 'bedroom' && !p.hidden && g.k.st !== 4) return c3DoorKey();
    if (g.chapter === 3) return c3Key();
    switch (p.room) {
      case 'bedroom':
        if (p.hidden === 'bed') return g.k.st === 4 ? 'under_kumot' : 'under_empty';
        if (!H.power && (g.k.st >= 3 && !H.door)) return 'bedroom_blackout';
        if (g.k.st === 4 || (g.k.st === 3 && !H.door)) return 'bedroom_kumot';
        return H.door ? 'bedroom_closed' : 'bedroom_empty';
      case 'hall': if (g.k.st === 2) return 'hallway_kumot'; return H.tv && H.power ? 'hallway_salatv' : 'hallway_empty';   // the TV's glow spills out of the living room door
      case 'living':
        if (p.hidden === 'sofa') return sofaKey(g, H);
        if (g.m.st === 2) return 'living_malik';
        if (H.tv) return H.lights ? 'living_lights' : 'living_empty';
        return H.lights ? 'living_lights_off_tv' : 'living_tvoff';
      case 'kitchen':
        if (p.hidden === 'cabinet') return g.c.st === 3 ? 'cabinet_kal' : 'cabinet_empty';
        return g.c.st >= 2 ? 'kitchen_kal' : 'kitchen_empty';
      case 'curtain':
        if (!H.curtain) return g.s.st >= 4 ? 'curtain_shadow' : 'curtain_closed';   // her shape through the cloth
        return ['curtain_open', 'curtain_s1', 'curtain_s2', 'curtain_silip', 'curtain_glass', 'curtain_glass'][g.s.st];
    }
    return 'hallway_empty';
  }
  // Chapter 3: every view comes from the one house; nights 6-7 use the candle-lit renders (suffix _c)
  function c3Key() {
    var g = game, p = g.p, H = g.house, c = g.dark ? '_c' : '';
    switch (p.room) {
      case 'bedroom':
        if (p.hidden === 'bed') return underKey(g.k.st === 4 ? (g.k.t > 5.6 ? 0 : g.k.t > 4.2 ? 1 : g.k.t > 1.6 ? 2 : 0) : -1);
        if (g.k.st === 4) return 'c3_bed_kumot' + c;
        return (H.door ? 'c3_bed_closed' : 'c3_bed') + c;
      case 'hall': if (g.k.st === 2) return 'hallway_kumot' + c; return !g.dark && H.tv && H.power ? 'hallway_salatv' : 'hallway_empty' + c;
      case 'living':
        if (p.hidden === 'sofa') return sofaKey(g, H);
        if (g.dark) return g.m.st === 2 ? 'living_malik_c' : 'living_tvoff_c';
        if (g.m.st === 2) return 'living_malik';
        if (H.tv) return H.lights ? 'living_lights' : 'living_empty';
        return H.lights ? 'living_lights_off_tv' : 'living_tvoff';
      case 'kitchen':
        if (p.hidden === 'cabinet') return (g.c.st === 3 ? 'cabinet_kal' : 'cabinet_empty') + c;
        return (g.c.st >= 2 ? 'kitchen_kal' : 'kitchen_empty') + c;
      case 'curtain':
        if (!H.curtain) return (g.s.st >= 4 ? 'curtain_shadow' : 'curtain_closed') + c;
        return ['curtain_open', 'curtain_s1', 'curtain_s2', 'curtain_silip', 'curtain_glass', 'curtain_glass'][g.s.st] + c;
    }
    return 'hallway_empty' + c;
  }
  function c3LookKey() {   // leaning out of the bedroom door: the lit house on nights 1-5, only the flashlight on 6-7
    var g = game, k = g.k.st;
    if (g.dark || !g.house.power) return 'c1_peek_' + (k === 2 || k === 3 ? k : 0);
    if (k === 2 || k === 3) return 'c3_look_k' + k;
    return g.house.tv ? 'c3_look_tv' : 'c3_look';
  }
  function c3Overlays() {
    var g = game, p = g.p, H = g.house, keys = [], n = g.dark ? 'n' : '';
    if (p.room === 'bedroom' && !p.travel && !p.hidden && !c3d.on && g.k.st !== 4 && !(viewLock && performance.now() < viewLock.until)) {
      if (g.k.st === 3 && !H.door) keys.push('hubx_k3' + (g.dark ? 'n' : 'l'));
      if (g.b.st >= 2) keys.push('hubx_b' + Math.min(4, g.b.st) + n);
    }
    ovlSwap(keys);
  }

  // ============================================================ turning: the bedroom, sala and kitchen are panoramas you
  // slide left / right in (FNAF4). PANO lists every picture wider than the 16:9 screen (filled in by the build).
  var PANO = /*PANO*/{};
  // pan.t is where you are turning to, pan.x where the view is (it eases after the finger, then coasts on a fling)
  var pan = { x: 0, t: 0, place: '', v: 0, mem: {}, fv: 0 }, PAN_HOME = { c1hub: 0, bedroom: 0, living: 0.5, kitchen: 0.5 };
  function kOf(key) { var a = key && PANO[key]; return a ? Math.max(1, a / (16 / 9)) : 1; }
  function panK() { return kOf(lastKey); }
  function panPlace() {
    if (!game) return '';
    if (isC1()) return game.p.pos === 'center' ? 'c1hub' : '';
    return game.p.hidden || c3d.on ? '' : game.p.room;
  }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function panSet(place, x) { pan.mem[place] = clamp01(x); if (pan.place === place) pan.x = pan.t = pan.mem[place]; }
  function panTick(dt) {
    var pl = panPlace();
    if (!pl && pan.place) pan.place = '';   // hiding / leaning out: the view is fixed (where you were is kept in pan.mem)
    if (pl && pl !== pan.place) { pan.place = pl; pan.x = pan.t = pan.mem[pl] !== undefined ? pan.mem[pl] : (PAN_HOME[pl] || 0.5); pan.fv = 0; }
    var K = panK(), span = Math.max(0.3, K - 1);
    if (pan.place && !pg) {
      if (pan.v) pan.t = clamp01(pan.t + pan.v * dt * (save.set.sens || 1) / span);
      if (pan.fv) { pan.t = clamp01(pan.t + pan.fv * dt); pan.fv *= Math.exp(-dt * 5); if (Math.abs(pan.fv) < 0.01 || pan.t <= 0 || pan.t >= 1) pan.fv = 0; }
    }
    var k = 1 - Math.exp(-dt * (pg ? 22 : 12)); pan.x += (pan.t - pan.x) * k;
    if (Math.abs(pan.t - pan.x) < 0.0004) pan.x = pan.t;
    if (pan.place) pan.mem[pan.place] = pan.t;
    panLayout();
  }
  // each layer is sized once for its picture, then only moved with a GPU transform (no layout while turning)
  function panPlaceEl(el, k) {
    if (!el) return;
    var w = (k * 100).toFixed(2); if (el._pw !== w) { el._pw = w; el.style.width = w + '%'; el.style.left = '0'; el.style.right = 'auto'; }
    var px = -pan.x * (k - 1) * 1280, tr = 'translate3d(' + px.toFixed(1) + 'px,0,0)' + (el._extra ? ' ' + el._extra : '');
    if (el._tr !== tr) { el._tr = tr; el.style.transform = tr; el.style.transformOrigin = el._extra ? (640 - px).toFixed(1) + 'px 50%' : ''; }   // zoom about the middle of the screen
  }
  function panLayout() {
    ['bgA', 'bgB', 'litImg'].forEach(function (id) { var el = $(id); panPlaceEl(el, kOf(el.getAttribute('data-k'))); });
    var K = panK(); panPlaceEl($('ovl'), K); panPlaceEl($('hotp'), K); panPlaceEl($('panx'), K);
    var can = K > 1.01 && !!pan.place && !(game && (game.p.travel || game.over)), pl = $('pan-l'), pr = $('pan-r');
    if (pl) { pl.classList.toggle('on', can && pan.t > 0.02); pr.classList.toggle('on', can && pan.t < 0.98); }
  }
  // a point in the panorama (in %) -> where it is on screen right now (in %), for camera moves toward a spot
  function panToView(pt) { var K = panK(); return K > 1.01 ? [(pt[0] / 100 * K - pan.x * (K - 1)) * 100, pt[1]] : pt; }
  // drag to turn: a horizontal slide anywhere turns the view; a tap or a hold still works on whatever is under the finger
  var pg = null, panDrag = false;
  function panWire() {
    var hot = $('hot');
    hot.addEventListener('pointerdown', function (e) { if (panK() <= 1.01 || !pan.place) { pg = null; return; } var p = toStage(e); pan.fv = 0; pg = { id: e.pointerId, x: p[0], y: p[1], t0: pan.t, moved: false, lx: p[0], lt: performance.now(), vel: 0 }; }, true);
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'mouse' && !e.buttons && panK() > 1.01 && pan.place && !paused) {   // desktop: rest the mouse near an edge to turn
        var q = toStage(e); pan.v = q[0] < 70 ? -0.9 : q[0] > 1210 ? 0.9 : (heldKeys.panL ? -1 : heldKeys.panR ? 1 : 0);
      }
      if (!pg || e.pointerId !== pg.id) return;
      var p = toStage(e), dx = p[0] - pg.x, now = performance.now();
      if (!pg.moved && Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(p[1] - pg.y) * 1.1) { pg.moved = true; panDrag = true; ['door', 'curtain', 'breath'].forEach(function (h) { if (game) game.hold(h, false); }); if (holdH) { stop(holdH, 0.2); holdH = null; } document.querySelectorAll('.spot.down,.spot.press').forEach(function (b) { b.classList.remove('down', 'press'); }); }
      if (pg.moved) {
        var K = panK(), per = (save.set.sens || 1) / (1280 * Math.max(0.3, K - 1));
        pan.t = clamp01(pg.t0 - dx * per);
        var dtm = Math.max(1, now - pg.lt); pg.vel = pg.vel * 0.6 + (-(p[0] - pg.lx) * per / (dtm / 1000)) * 0.4; pg.lx = p[0]; pg.lt = now;
      }
    }, true);
    var end = function (e) {
      if (!pg || e.pointerId !== pg.id) return;
      if (pg.moved && performance.now() - pg.lt < 80) pan.fv = Math.max(-2.5, Math.min(2.5, pg.vel * 0.5));   // a flick keeps turning a little
      pg = null; if (panDrag) setTimeout(function () { panDrag = false; }, 0);
    };
    window.addEventListener('pointerup', end, true); window.addEventListener('pointercancel', end, true);
    window.addEventListener('mouseleave', function () { pan.v = 0; });
    // the edge arrows: hold to turn (touch), they also show which way there is more to see
    [['pan-l', -1], ['pan-r', 1]].forEach(function (a) {
      var el = $(a[0]); if (!el) return;
      el.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); try { el.setPointerCapture(e.pointerId); } catch (x) {} pan.v = a[1] * 0.8; });
      var off = function () { pan.v = 0; }; el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('lostpointercapture', off);
    });
    window.addEventListener('keydown', function (e) { if (!game || paused) return; if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { heldKeys.panL = true; pan.v = -1; } if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { heldKeys.panR = true; pan.v = 1; } });
    window.addEventListener('keyup', function (e) { if (/^(ArrowLeft|a|A)$/.test(e.key)) heldKeys.panL = false; if (/^(ArrowRight|d|D)$/.test(e.key)) heldKeys.panR = false; if (!heldKeys.panL && !heldKeys.panR) pan.v = 0; });
  }

  // ============================================================ the stand fans (energy). The fan bodies are in the renders; the
  // blades are drawn here and really spin: they speed up when switched on and coast to a stop when switched off.
  var FANPOS = { bed: { x: 82.9, y: 57.6, w: 4.6, h: 39.6 }, sala: { x: 33.0, y: 49.0, w: 4.8, h: 23.6 } };
  var fanSpin = { fan: { a: 0, v: 0 }, fanB: { a: 0, v: 0 } };
  function fanWhere(key) {   // which fan this picture shows, and which switch drives it
    if (!key || !PANO[key]) return null;
    if (/^(c1_hub|c3_bed)/.test(key)) return { pos: FANPOS.bed, which: isC1() ? 'fan' : 'fanB' };
    if (/^living_/.test(key)) return { pos: FANPOS.sala, which: 'fan' };
    return null;
  }
  function fanOn(which) { return !!(game && game.house[which] && (game.house.power || game.dark)); }
  var FAN_SVG = '<svg viewBox="-50 -50 100 100" preserveAspectRatio="none"><defs><radialGradient id="fblur"><stop offset="0" stop-color="#4a4f55" stop-opacity=".6"/><stop offset=".25" stop-color="#3d4247" stop-opacity=".42"/><stop offset=".92" stop-color="#30343a" stop-opacity=".26"/><stop offset="1" stop-color="#30343a" stop-opacity="0"/></radialGradient></defs>' +
    '<circle class="fdisc" r="44" fill="url(#fblur)"/><g class="fbl">' +
    [0, 120, 240].map(function (r) { return '<path transform="rotate(' + r + ')" d="M0,-6 C10,-14 30,-40 14,-44 C2,-46 -8,-30 -6,-8 Z" fill="#3a3e43" fill-opacity=".92" stroke="#1f2226" stroke-width="1.2"/>'; }).join('') +
    '</g><circle r="7" fill="#2a3036"/><circle r="3" fill="#6d7780"/></svg>';
  function fanTick(dt) {
    var px = $('panx'); if (!px) return;
    ['fan', 'fanB'].forEach(function (w) {
      var f = fanSpin[w], on = fanOn(w);
      f.v += ((on ? 1 : 0) - f.v) * Math.min(1, dt * (on ? 0.9 : 0.45));
      if (f.v < 0.003 && !on) f.v = 0;
      f.a = (f.a + f.v * dt * 2100) % 360;
    });
    var fw = game && !game.p.travel ? fanWhere(lastKey) : null;
    if (!fw) { if (px._fan) { px.innerHTML = ''; px._fan = null; } return; }
    if (px._fan !== fw.pos) { px.innerHTML = '<div class="efan">' + FAN_SVG + '</div>'; px._fan = fw.pos; var e = px.firstChild; e.style.left = fw.pos.x + '%'; e.style.top = fw.pos.y + '%'; e.style.width = fw.pos.w + '%'; e.style.height = fw.pos.h + '%'; }
    var f = fanSpin[fw.which], el = px.firstChild;
    el.querySelector('.fbl').setAttribute('transform', 'rotate(' + f.a.toFixed(1) + ')');
    el.querySelector('.fbl').setAttribute('opacity', (1 - 0.75 * Math.min(1, f.v * 1.4)).toFixed(2));
    el.querySelector('.fdisc').setAttribute('opacity', Math.min(1, f.v * 1.3).toFixed(2));
    css(el, 'filter', game.house.power || game.dark ? '' : 'brightness(.55)');
  }
  // fan sound: the one in your room loud, the other faint through the walls; while it runs it covers small sounds
  function fanAudio() {
    var g = game; if (!g) return;
    var fw = isC1() ? (g.p.pos === 'center' || g.p.pos === 'bed' ? 1 : 0.5) : null;
    ['fan', 'fanB'].forEach(function (w) {
      var v = fanSpin[w].v, key = 'efan_' + w;
      if (v > 0.02 && !amb[key]) amb[key] = play('efan', { bus: 'amb', loop: true, vol: 0 });
      if (v <= 0.02 && amb[key]) { stop(amb[key], 0.3); amb[key] = null; }
      if (amb[key]) setLoopVol(amb[key], 0.5 * v * (isC1() ? fw : 1), isC1() ? null : (w === 'fan' ? 'living' : 'bedroom'));
    });
  }
  function fanMask() {   // 1 = you hear everything; less while a fan runs where you are
    var g = game; if (!g) return 1;
    if (isC1()) return fanSpin.fan.v > 0.3 ? 0.7 : 1;
    var w = g.fanHere && g.fanHere(); return w && fanSpin[w].v > 0.3 ? 0.7 : 1;
  }
  // a fan switched on (by you) or off (by itself): the click, and the first time each, a hint
  function fanEvent(d) {
    var room = isC1() ? null : (d.which === 'fanB' ? 'bedroom' : 'living');
    play('efan_click', room ? { vol: 0.8, room: room } : { vol: d.auto && game && game.p.pos !== 'center' && game.p.pos !== 'bed' ? 0.5 : 0.8 });
    hotSig = 'none'; buildHot();
    if (d.auto && !save.seenFanOff) { save.seenFanOff = 1; hint(T('fan_off_hint'), 4.5); }
    else if (d.on && !save.seenFan) { save.seenFan = 1; hint(T('fan_on_hint'), 4); }
  }
  // the sanity ring (see the logic): full ring = sane. Turns amber, then red; the warning names the fan that went off
  function sanityHUD(g) {
    var en = $('energy'); if (!en) return;
    var e = Math.max(0, Math.min(100, g.p.energy === undefined ? 100 : g.p.energy)), q = Math.round(e * 2) / 2;
    if (en._lang !== T('sanity')) { en._lang = T('sanity'); $('sn-l').textContent = T('sanity'); en.setAttribute('aria-label', T('sanity')); }
    if (en._q !== q) { en._q = q; var fg = en.querySelector('.sn-fg'); fg.setAttribute('stroke-dasharray', q + ' 100'); fg.style.stroke = e > 55 ? '#e9dfcb' : e > 28 ? '#e0a24a' : '#c0392b'; }
    var fans = g.fans || ['fan'], off = fans.filter(function (f) { return !(g.fanRuns ? g.fanRuns(f) : (g.house[f] && g.house.power)); });
    var w = off.length ? (off.length === fans.length && fans.length > 1 ? T('fan_off_all') : T('fan_off_' + (isC1() ? 'c1' : off[0]))) : '';
    if (en._w !== w) { en._w = w; $('sn-w').textContent = w ? '⚠ ' + w : ''; }
    en.classList.toggle('warn', !!w); en.classList.toggle('drain', off.length === fans.length); en.classList.toggle('low', e < 20);
    var v = Math.max(fanSpin.fan.v, fanSpin.fanB.v); en._a = ((en._a || 0) + v * 14) % 360;
    var fg2 = en.querySelector('.sn-fan g'); if (fg2) fg2.setAttribute('transform', 'rotate(' + en._a.toFixed(0) + ')');
  }
  // tiredness: the edges close in below a third of your energy, and your eyes start to drop near the end
  function tiredTick() {
    var g = game, t = $('tired'); if (!g || !t) return;
    var e = g.p.energy === undefined ? 100 : g.p.energy, k = e >= 32 ? 0 : (32 - e) / 32;
    css(t, 'opacity', (k * 0.85).toFixed(2)); t.classList.toggle('heavy', e < 14 && !save.set.reduced);
  }

  // ============================================================ WALKING AS VIDEO. Every move between rooms (and between the
  // spots in Lola's room) plays a pre-rendered first-person clip: you turn round, walk (or run) the real distance and turn
  // to face the room. The clips are fetched once into memory so they start instantly.
  var WALKV = /*WALKV*/{};
  var walkBlob = {}, walkNow = null;
  function walkName(from, to) { return isC1() ? 'walk_c1' + from + '_c1' + to : 'walk_' + from + '_' + to; }
  function walkPreload(chapter) {
    Object.keys(WALKV).forEach(function (n) {
      if ((chapter === 1) !== /^walk_c1/.test(n) || walkBlob[n]) return;
      walkBlob[n] = 'pending';
      fetch('assets/walk/' + n + '.mp4').then(function (r) { return r.ok ? r.blob() : null; })
        .then(function (b) { walkBlob[n] = b ? URL.createObjectURL(b) : null; }).catch(function () { walkBlob[n] = null; });
    });
  }
  function walkStart(from, to, t) {
    var n = walkName(from, to); if (!WALKV[n] || save.set.motion || walkBlob[n] === null) return false;   // no clip (or it failed to load): the old step animation
    var v = $('walkv'); if (!v) return false;
    var url = walkBlob[n] && walkBlob[n] !== 'pending' ? walkBlob[n] : 'assets/walk/' + n + '.mp4';
    if (v._src !== url) { v.src = url; v._src = url; }
    try { v.currentTime = 0; } catch (e) {}
    v.playbackRate = Math.max(0.5, Math.min(3, WALKV[n] / Math.max(0.2, t)));
    var g = game, dim = isC1() ? !g.house.power : (g.dark || !g.house.power);
    v.style.filter = dim ? 'brightness(.4) saturate(.7)' : '';
    v.style.transition = 'opacity .14s'; v.style.opacity = 1;
    var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
    walkNow = { n: n }; $('hot').classList.add('moving');
    return true;
  }
  function walkEnd() {
    if (!walkNow) return false;
    walkNow = null; var v = $('walkv');
    v.style.transition = 'opacity .3s'; v.style.opacity = 0;
    setTimeout(function () { if (!walkNow) try { v.pause(); } catch (e) {} }, 340);
    $('hot').classList.remove('moving'); return true;
  }
  function viewKey() { if (viewLock && performance.now() < viewLock.until) return viewLock.key; return viewKeyRaw(); }
  // Something appeared or left without you doing anything: the bulb stutters first and the change happens in the dark,
  // so nobody is seen to pop in or out (the house's lights are old; she moves when they blink).
  var lastAct = 0, flkPlace = '', flkUntil = 0;
  function flkWhere() { var p = game.p; return isC1() ? p.pos + '|' + !!p.travel : p.room + '|' + p.hidden + '|' + !!p.travel + '|' + c3d.on; }
  function flkOK() {
    if (!game || game.over || paused || game.p.travel || viewLock || swing) return false;
    var now = performance.now(); return now - lastAct > 700 && now > flkUntil && flkPlace === flkWhere();
  }
  function flicker() {
    var now = performance.now(); flkUntil = now + 450;
    play('bulb_flicker', { vol: 0.5 });
    if (save.set.reduced) return;   // softer scares: no dark dips, just the sound
    var b = $('black'), seq = save.set.motion ? [[0, 0.85, 0], [120, 0, 320]] : [[0, 0.93, 0], [90, 0, 60], [170, 0.78, 0], [235, 0, 150]];   // reduce motion: one soft dip, no strobing
    seq.forEach(function (st) { setTimeout(function () { if (paused) return; b.style.transition = st[2] ? 'opacity ' + st[2] + 'ms ease' : 'none'; b.style.opacity = st[1]; }, st[0]); });
  }
  function css(el, prop, v) { var k = '_c_' + prop; if (el[k] === v) return; el[k] = v; el.style[prop] = v; }
  var viewTok = 0;
  function setView(force, instant) {
    var g = game; if (!g) return;
    var key = viewKey();
    var dark = !g.house.power && !g.dark && g.p.room !== 'curtain' && !(g.chapter === 1 && g.p.pos === 'window');
    var sofa = g.p.hidden === 'sofa' && !(viewLock && performance.now() < viewLock.until);
    var sig = key + '|' + dark + '|' + sofa;
    if (sig !== lastView && lastView && flkOK()) { flicker(); instant = true; }
    if (sig !== lastView || force) {
      var back = front === 'bgA' ? 'bgB' : 'bgA';
      var b = $(back), f = $(front);
      b.classList.toggle('now', !!instant); f.classList.toggle('now', !!instant);
      if (b.getAttribute('data-k') !== key) { b.src = IMGDIR(key) + key + '.jpg'; b.setAttribute('data-k', key); }
      b.style.filter = dark && key.indexOf('menu_') !== 0 ? 'brightness(.32) saturate(.6)' : 'brightness(1.05)';

      // never show a picture before it is decoded: the hidden layer still holds the last place it showed (the door, say),
      // and on a phone that old picture would flash for a frame or two before the new one appears
      var tok = ++viewTok, show = function () { if (tok !== viewTok) return; b.style.opacity = 1; f.style.opacity = 0; };
      if (b.complete && b.naturalWidth && b._dk === key) show();
      else (b.decode ? b.decode() : Promise.resolve()).then(function () { b._dk = key; show(); }, show);
      front = back; lastView = sig; lastKey = key;
    }
    // the beam reveals the flashlight-lit render underneath the finger
    var lk = isC1() ? c1LitKey() : null, li = $('litImg');
    // brownout nights: the torch brightens whatever is under the beam (the candle renders are too dark to just "reveal")
    var torch3 = !isC1() && g.p.light && (g.dark || !g.house.power) && !g.p.travel;
    var litOK = torch3 && g.dark && /_c$/.test(key) && key.indexOf('cabinet') < 0;
    if (torch3) lk = litOK ? key + 'l' : key;   // candle nights: the same view lit by the torch (rendered), revealed under the beam
    css(li, 'filter', torch3 && g.dark && !litOK ? 'brightness(4.2) saturate(.75) contrast(1.05)' : '');
    if (lk) {
      if (li.getAttribute('data-k') !== lk) { li.src = IMGDIR(lk) + lk + '.jpg'; li.setAttribute('data-k', lk); li._ok = false; css(li, 'opacity', '0'); (li.decode ? li.decode() : Promise.resolve()).then(function () { if (li.getAttribute('data-k') === lk) li._ok = true; }, function () { li._ok = true; }); }
      var lkK = kOf(lk), bxo = beam[0] + pan.x * (lkK - 1) * 1280;
      var m = 'radial-gradient(circle at ' + bxo + 'px ' + beam[1] + 'px, #000 0, #000 120px, rgba(0,0,0,.6) 190px, transparent 280px)';
      if (li._m !== m) { li._m = m; li.style.webkitMaskImage = li.style.maskImage = m; } css(li, 'opacity', li._ok === false ? '0' : '1');
    } else css(li, 'opacity', '0');
    if (pz && (!game || game.over || game.p.room !== 'kitchen' || game.p.travel || game.house.power)) puzzleClose();
    if (isC1()) c1Overlays(); else if (game.chapter === 3) c3Overlays(); else if (ovlSig || ovlWant) { ovlSig = ovlWant = ''; $('ovl').innerHTML = ''; }
    // flashlight beam follows the finger
    var dk = $('dark'), lit = g.p.light;
    var needDark = dark || (g.p.room === 'curtain' && g.house.curtain) || g.p.room === 'hall' && !g.house.power || (isC1() && g.p.pos === 'cabinet');
    var bx = beam[0], by = beam[1];
    if (needDark) {
      css(dk, 'opacity', '1');
      css(dk, 'background', lit ? 'radial-gradient(circle at ' + bx + 'px ' + by + 'px, rgba(255,244,220,.06) 0, rgba(0,0,0,0) 170px, rgba(0,0,0,.45) 280px, rgba(0,0,0,.9) 470px)' : (dark ? 'rgba(0,0,0,.62)' : 'rgba(0,0,0,.35)'));
    } else if (lit) { css(dk, 'opacity', '1'); css(dk, 'background', 'radial-gradient(circle at ' + bx + 'px ' + by + 'px, rgba(255,240,210,.16) 0, rgba(255,240,210,.06) 170px, rgba(0,0,0,.25) 420px)'); }
    else css(dk, 'opacity', '0');
    css($('fog'), 'opacity', (!isC1() && g.p.room === 'curtain' && !g.house.curtain && g.s.st === 4 && !g.p.travel) ? '1' : '0');
    var nowG = performance.now(); if (!(nowG < setView._g)) { setView._g = nowG + 85; $('grain').style.backgroundPosition = (Math.random() * 160 | 0) + 'px ' + (Math.random() * 160 | 0) + 'px'; }
    flkPlace = flkWhere();
  }
  var beam = [660, 340];

  // ------------------------------------------------------------ HUD
  function renderHUD() {
    var g = game, c = g.clock();
    var mm = c.m < 10 ? '0' + c.m : '' + c.m;
    $('clock-t').textContent = c.h + ':' + mm + ' AM';
    var where = isC1() ? T('pos')[g.p.travel ? g.p.travel.to : g.p.pos] : T('rooms')[g.p.travel ? g.p.travel.to : g.p.room];
    $('clock-n').textContent = (g.chapter ? T('ch_n', g.chapter) + ' · ' : '') + T('night_n', g.night).toUpperCase() + ' · ' + String(where).toUpperCase();
    $('runBtn').style.display = isC1() ? 'none' : '';
    // the phone's battery: five bars (its flashlight is the phone's own)
    var bars = Math.max(0, Math.min(5, Math.ceil(g.p.battery / 20 - 1e-6))), bi = $('batt-img');
    if (bi.getAttribute('data-n') !== String(bars)) { bi.src = 'assets/ui/bat_' + bars + '.webp'; bi.setAttribute('data-n', bars); bi.alt = bars + ' / 5'; }
    bi.classList.toggle('low', bars <= 1);
    sanityHUD(g);
    $('salt').style.display = !isC1() && g.night >= 3 ? 'flex' : 'none';
    $('salt-n').textContent = g.p.salt || 0;
    var rb = $('runBtn'), rt = g.p.run ? T('run_on') : T('run_off'); if (rb.textContent !== rt) rb.textContent = rt; rb.classList.toggle('cur', g.p.run);
    var bm = $('breathMeter');
    if (g.p.holdBreath) { bm.style.opacity = 1; var pct = g.p.breath / (g.p.breathMax || 8) * 100; bm.style.background = 'conic-gradient(#e9dfcb ' + pct + '%, rgba(255,255,255,.08) 0)'; bm.style.mask = bm.style.webkitMask = 'radial-gradient(circle, transparent 50px, #000 52px)'; }
    else bm.style.opacity = 0;
  }

  // ------------------------------------------------------------ hotspots: tap things in the room itself
  function doHold(name, on) {
    if (!game) return; lastAct = performance.now();
    var was = name === 'light' ? game.p.light : name === 'door' ? game.p.holdDoor : name === 'curtain' ? game.p.holdCurtain : game.p.holdBreath;
    game.hold(name, on);
    var now = name === 'light' ? game.p.light : name === 'door' ? game.p.holdDoor : name === 'curtain' ? game.p.holdCurtain : game.p.holdBreath;
    if (name === 'breath') { if (now && !breathH) breathH = play('breath_hold_gasp', { vol: 0.8 }); if (!on) stopBreath(); }
    if (name === 'light' && now !== was) play(now ? 'flashlight_on' : 'flashlight_click', { vol: 0.45 });
    if (name === 'door' || name === 'curtain') {
      if (now && !holdH) { holdH = play(name === 'door' ? 'door_push_strain' : 'curtain_grip', { loop: true, vol: 0.7 }); holdHName = name; }
      if (!now && holdH && holdHName === name) { stop(holdH, 0.25); holdH = null; }
    }
  }
  function act(a, arg) { if (!game || game.over || paused || (call && call.state === 'ring')) return; lastAct = performance.now(); game.act(a, arg); handleEvents(); renderHUD(); }
  function go(room, pt) { if (!game || game.p.travel || game.p.hidden) return; walkPt = pt || [50, 60]; act('go', room); }
  var heldKeys = {};
  var hotSig = '';
  function releaseHolds() {
    lightLatch = false;
    if (game) ['door', 'breath', 'curtain', 'light'].forEach(function (h) { game.hold(h, false); });
    stopBreath(); if (holdH) { stop(holdH, 0.2); holdH = null; }
    document.querySelectorAll('.spot.down').forEach(function (b) { b.classList.remove('down'); });
  }
  function lightAllowed() { if (isC1()) return c1LightAllowed(); var g = game, H = g.house, r = g.p.room; return !g.p.hidden && ((r === 'curtain' && H.curtain) || !H.power || r === 'hall' || (g.chapter === 3 && r === 'bedroom') || (g.dark && r === 'living')); }
  // CHAPTER 3 / CUSTOM: the bedroom door works as in Chapter 1. Tap the door to go up to it; there, double-tap = your
  // flashlight down the hall, HOLD = pull the door shut and keep it shut, Back = into the room, Hallway = go out.
  var c3d = { on: false, light: false };
  function c3DoorGo(on) {
    if (!game || game.p.travel || game.p.hidden) return;
    lastAct = performance.now();
    if (!on) { c3DoorLight(false); doHold('door', false); }
    c3d.on = on; game.doorView = on;
    play('step_c1', { vol: 0.5 });
    if (!lowFx()) camAnim(on ? [{ transform: 'scale(1)' }, { transform: 'scale(1.5)' }] : [{ transform: 'scale(1.5)' }, { transform: 'scale(1)' }], 260, panToView([41, 55]), 'ease-in');
    setTimeout(function () { setView(true, true); buildHot(); }, lowFx() ? 0 : 200);
  }
  function c3DoorLight(v) {
    var g = game; if (!g) return;
    if (v === undefined) v = !c3d.light;
    if (v && !g.dark && g.house.power) { hint(T('c3_hall_lit'), 2.5); return; }
    if (v && g.p.battery <= 0) { hint(T('battery_dead_hint') || '', 2); return; }
    if (v === c3d.light) return;
    c3d.light = v; lastAct = performance.now(); play(v ? 'flashlight_on' : 'flashlight_off', { vol: 0.5 });
    if (v && g.k.st === 3) { play('wheeze', { vol: 0.9 }); jolt(); }
    setView(true, true);
  }
  function c3DoorKey() {
    var g = game, k = g.k.st, lit = !g.dark && g.house.power;
    if (swing) return (lit ? 'c3_door_' : 'c1_door_') + swing.seq[swing.i].split('_door_')[1];
    if (g.house.door) return 'c1_door_closed';
    if (lit) return c3LookKey();   // the hall light is on: you simply see down it
    if (c3d.light) return 'c1_peek_' + (k === 2 || k === 3 ? k : 0);
    return k === 3 ? 'c1_door_k3' : 'c1_door_ajar';
  }
  function spots() {
    if (isC1()) return c1Spots();
    var g = game, p = g.p, H = g.house, r = p.room, S = [];
    if (c3d.on && r === 'bedroom' && !p.hidden && !p.travel) {
      S.push({ id: 'door', x: 0, y: 0, w: 100, h: 85, cls: 'gesture', gesture: true, label: T('s_door_use'), hold: 'door', dbl: function () { c3DoorLight(); } });
      S.push({ id: 'back', x: 12, y: 86, w: 30, h: 14, cls: 'exit', label: T('s_back').toUpperCase(), tap: function () { c3DoorGo(false); } });
      S.push({ id: 'exit', x: 58, y: 86, w: 30, h: 14, cls: 'exit', label: T('go_hall').toUpperCase() + '  ▶', tap: function () { c3DoorGo(false); go('hall', [50, 100]); } });
      return S;
    }
    var PK = kOf(viewKey()) > 1.01, R = function (pano, flat) { return PK ? pano : flat; };   // panorama or flat-picture coordinates
    var exit = { id: 'exit', x: 28, y: 86, w: 44, h: 14, cls: 'exit', label: '▼  ' + T('go_hall').toUpperCase(), tap: function () { go('hall', [50, 100]); } };
    var out = { id: 'exit', x: 28, y: 86, w: 44, h: 14, cls: 'exit', label: '▲  ' + T('a_unhide').toUpperCase(), tap: function () { act('hide'); } };
    if (r === 'bedroom' && g.chapter === 3) {
      if (p.hidden) S.push(out);
      else {
        var dr = R([36.5, 26, 9, 58], [30, 33, 14, 46]), lk = R([36.5, 8, 9, 17], [30, 12, 14, 20]), bd = R([2, 66, 28, 34], [0, 66, 25, 34]);
        S.push({ id: 'door', x: dr[0], y: dr[1], w: dr[2], h: dr[3], label: T('s_door'), tap: function () { c3DoorGo(true); } });
        S.push({ id: 'bed', x: bd[0], y: bd[1], w: bd[2], h: bd[3], label: T('a_hide_bed'), tap: function () { act('hide'); } });
        if (PK && !H.fanB) S.push({ id: 'fan', x: 81.5, y: 55, w: 7.5, h: 44, label: T('s_fan'), tap: function () { act('fan'); } });
        S.push(exit);
      }
    } else if (r === 'bedroom') {
      if (p.hidden) S.push(out);
      else {
        if (H.door) S.push({ id: 'door', x: 39, y: 26, w: 16, h: 56, cls: 'hold', label: T('a_hold_door'), hold: 'door', dbl: function () { act('door'); }, hintTap: 'h_door' });
        else S.push({ id: 'door', x: 39, y: 26, w: 16, h: 56, label: T('a_door_close'), tap: function () { act('door'); } });
        S.push({ id: 'bed', x: 0, y: 60, w: 30, h: 40, label: T('a_hide_bed'), tap: function () { act('hide'); } });
        S.push(exit);
      }
    } else if (r === 'hall') {
      if (g.chapter === 2) S.push({ id: 'bedroom', x: 17, y: 12, w: 14, h: 72, cls: 'off', label: '✕ ' + T('rooms').bedroom, tap: function () { hint(T('c2_forbidden'), 3); } });
      else S.push({ id: 'bedroom', x: 17, y: 12, w: 14, h: 72, label: '◀ ' + T('rooms').bedroom, tap: function () { go('bedroom', [24, 55]); } });
      S.push({ id: 'kitchen', x: 43, y: 34, w: 14, h: 44, label: T('rooms').kitchen, tap: function () { go('kitchen', [50, 55]); } });
      S.push({ id: 'living', x: 58, y: 24, w: 11, h: 56, label: T('rooms').living + ' ▶', tap: function () { go('living', [62, 52]); } });
      S.push({ id: 'curtain', x: 80, y: 22, w: 19, h: 62, label: T('rooms').curtain + ' ▶', tap: function () { go('curtain', [88, 55]); } });
    } else if (r === 'living') {
      if (p.hidden) S.push(out);
      else {
        var tv = R([69.5, 55, 12.5, 30], [37, 46, 19, 27]), swc = R([87, 44, 6, 16], [55, 34, 11, 20]), so = R([0, 72, 30, 28], [0, 70, 27, 30]);
        if (H.tv) S.push({ id: 'tv', x: tv[0], y: tv[1], w: tv[2], h: tv[3], label: T('a_tv'), tap: function () { act('tv'); } });
        S.push({ id: 'switch', x: swc[0], y: swc[1], w: swc[2], h: swc[3], cls: H.power ? '' : 'off', label: T(H.lights ? 'a_lights_off' : 'a_lights_on'), tap: function () { act('lights'); } });
        if (PK && !H.fan) S.push({ id: 'fan', x: 30.3, y: 44, w: 7.6, h: 28, label: T('s_fan'), tap: function () { act('fan'); } });
        S.push({ id: 'sofa', x: so[0], y: so[1], w: so[2], h: so[3], label: T('a_hide_sofa'), tap: function () { act('hide'); } });
        S.push(exit);
      }
    } else if (r === 'kitchen') {
      if (p.hidden) {
        if (g.saltOK && p.salt > 0) S.push({ id: 'salt', x: 38, y: 30, w: 24, h: 30, label: T('a_salt', p.salt), tap: function () { act('salt'); } });
        S.push(out);
      } else {
        var kc = R([15.5, 24, 13, 70], g.chapter >= 2 ? [0, 24, 9, 62] : [9, 60, 46, 25]), ks = R([34, 46, 6, 13], [24, 42, 11, 16]), kb = R([70.5, 24, 7, 18], [84, 20, 15, 20]);
        S.push({ id: 'cabinet', x: kc[0], y: kc[1], w: kc[2], h: kc[3], label: T('a_hide_cab'), tap: function () { act('hide'); } });
        if (g.saltOK) S.push({ id: 'salt', x: ks[0], y: ks[1], w: ks[2], h: ks[3], cls: p.salt > 0 ? '' : 'off', label: T('a_salt', p.salt), tap: function () { act('salt'); } });
        if (!H.power && !g.dark) S.push({ id: 'breaker', x: kb[0], y: kb[1], w: kb[2], h: kb[3], cls: 'urgent', label: T('a_breaker'), tap: function () { if (g.chapter >= 2) puzzleOpen(); else act('breaker'); } });
        S.push(exit);
      }
    } else if (r === 'curtain') {
      if (!H.curtain) S.push({ id: 'curtain', x: g.chapter >= 2 ? 20 : 10, y: 6, w: g.chapter >= 2 ? 52 : 80, h: 76, cls: 'hold', label: T('a_hold_curtain'), hold: 'curtain', dbl: function () { act('curtain'); }, hintTap: 'h_curtain' });
      else {
        S.push({ id: 'cl', x: g.chapter >= 2 ? 6 : 0, y: 0, w: 15, h: 84, label: T('a_close_short'), tap: function () { act('curtain'); } });
        S.push({ id: 'cr', x: g.chapter >= 2 ? 70 : 83, y: 0, w: 15, h: 84, label: T('a_close_short'), tap: function () { act('curtain'); } });
      }
      S.push(exit);
    }
    return S;
  }
  var stageScale = 1;
  function toStage(e) { return stageRot ? [(e.clientY - stageOy) / stageScale, (stageOx - e.clientX) / stageScale] : [(e.clientX - stageOx) / stageScale, (e.clientY - stageOy) / stageScale]; }
  function bindSpot(el, s) {
    var down = false, held = false, timer = 0;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault(); e.stopPropagation(); try { el.setPointerCapture(e.pointerId); } catch (x) {}
      down = true; held = false; el.classList.add('press');
      if (s.gesture) beam = toStage(e);
      if (s.hold) timer = setTimeout(function () { if (down && !panDrag) { held = true; el.classList.add('down'); if (s.preHold) s.preHold(); doHold(s.hold, true); } }, s.gesture ? 210 : 130);
    });
    var up = function () {
      el.classList.remove('press');
      if (!down) return; down = false; clearTimeout(timer);
      if (panDrag) { if (held) { held = false; el.classList.remove('down'); doHold(s.hold, false); } return; }
      if (held) { held = false; el.classList.remove('down'); doHold(s.hold, false); return; }
      if (s.tap) { s.tap(); return; }
      if (s.dbl) { var now = performance.now(); if (now - (el._last || 0) < 400) { el._last = 0; s.dbl(); } else { el._last = now; if (s.hintTap) hint(T(s.hintTap)); } }
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
  }
  function buildHot() {
    var box = $('hot'), g = game;
    if (!g || g.p.travel || g.over || (call && call.state === 'ring')) { if (hotSig !== 'none') { box.innerHTML = ''; hotSig = 'none'; } return; }
    var S = spots(), p = g.p;
    var PK = kOf(viewKey()) > 1.01;
    var sig = (p.room || p.pos) + p.hidden + PK + S.map(function (s) { return s.id + s.label + (s.cls || ''); }).join('|') + lightAllowed();
    if (sig === hotSig) return;
    hotSig = sig; releaseHolds(); box.innerHTML = ''; 
    box.classList.toggle('c1', isC1());   // Chapter 1 teaches the controls: its names and hints stay visible
    box.classList.add('reveal'); clearTimeout(box._rv); box._rv = setTimeout(function () { box.classList.remove('reveal'); }, 1400);
    box.classList.toggle('dim', g.night >= 3);
    // background: hold for flashlight (dark places) or breath (under the bed)
    var bg = document.createElement('div'); bg.id = 'hotbg'; box.appendChild(bg);
    var hp = document.createElement('div'); hp.id = 'hotp'; hp.className = 'layer'; hp.style.pointerEvents = 'none'; box.appendChild(hp); hp._pw = hp._pl = null;
    var bgHold = (p.hidden === 'bed' || p.pos === 'bed') ? 'breath' : (lightAllowed() ? 'light' : null);
    if (bgHold) {
      var on = function (e) { e.preventDefault(); try { bg.setPointerCapture(e.pointerId); } catch (x) {} beam = toStage(e); doHold(bgHold, true); };
      var mv = function (e) { if (game && game.p.light) beam = toStage(e); };
      var off = function () { doHold(bgHold, false); };
      bg.addEventListener('pointerdown', on); bg.addEventListener('pointermove', mv);
      bg.addEventListener('pointerup', off); bg.addEventListener('pointercancel', off); bg.addEventListener('lostpointercapture', off);
    }
    S.forEach(function (s) {
      var dir = /^\s*◀/.test(s.label || '') ? ' left' : /▶\s*$/.test(s.label || '') ? ' right' : /^\s*▼/.test(s.label || '') ? ' downarrow' : '';
      var el = document.createElement('div'); el.className = 'spot ' + (s.cls || '') + dir; el.setAttribute('data-spot', s.id); el.setAttribute('aria-label', (s.label || '').replace(/[◀▶▼▲]/g, '').trim());
      el.style.left = s.x + '%'; el.style.top = s.y + '%'; el.style.width = s.w + '%'; el.style.height = s.h + '%';
      el.innerHTML = '<i class="dot"></i><span class="lbl"></span>'; el.querySelector('.lbl').textContent = s.label;
      if (call && call.focus === s.id) el.classList.add('focus');
      var fixed = /exit/.test(s.cls || '') || s.id === 'exit' || s.id === 'back' || s.id === 'out' || s.cls === 'gesture' || /gesture/.test(s.cls || '');
      bindSpot(el, s); if (PK && !fixed) { el.style.pointerEvents = 'auto'; hp.appendChild(el); } else box.appendChild(el);
    });
  }
  // keep the camera alive while holding things
  function holdCam() {
    if (!game || lowFx() || (camA && performance.now() < busyUntil)) return;
    if (camA && performance.now() >= busyUntil) camClear();
    cam = cam || $('cam');
    if (isC1()) { c1Hold(); return; }
    var p = game.p, t = performance.now() / 1000, tr = '';
    if (p.holdDoor) { var j = game.k.st === 3 ? 4 : 1.2; cam.style.transformOrigin = '47% 54%'; tr = 'scale(1.14) translate(' + (Math.sin(t * 37) * j).toFixed(1) + 'px,' + (Math.cos(t * 29) * j).toFixed(1) + 'px)'; }
    else if (p.holdCurtain) { var k = game.s.st >= 4 ? 3.5 : 1; cam.style.transformOrigin = '50% 45%'; tr = 'scale(1.08) translate(' + (Math.sin(t * 33) * k).toFixed(1) + 'px,' + (Math.cos(t * 41) * k).toFixed(1) + 'px)'; }
    else if (p.holdBreath) { cam.style.transformOrigin = '50% 60%'; tr = 'scale(' + (1.04 + Math.sin(t * 1.4) * 0.01).toFixed(3) + ')'; }
    else if (!p.travel) { tr = 'translate(' + (Math.sin(t * 0.35) * 3).toFixed(1) + 'px,' + (Math.sin(t * 0.5) * 2).toFixed(1) + 'px) scale(1.01)'; } // idle breathing sway
    cam.style.transform = tr;
  }

  // ============================================================ CHAPTER 1 — Lola's bedroom (FNAF4-style: center, door, window, aparador, bed)
  var C1PT = { door: [41, 55], window: [70, 42], cabinet: [60, 55], bed: [15, 86] };   // where each spot sits in the hub panorama (%)   // where each spot sits in the hub picture (%)
  function isC1() { return game && game.chapter === 1; }
  function c1Spatial(src) {
    var pos = game.p.travel ? game.p.travel.to : game.p.pos;
    var PAN = { hall: -0.25, door: -0.25, window: 0.6, cabinet: 0.35 };
    if (src === 'hall') return pos === 'door' ? { vol: 1, cut: 20000, pan: 0 } : { vol: 0.55, cut: 1800, pan: PAN.hall };
    if (src === pos) return { vol: 1, cut: 20000, pan: 0 };
    if (pos === 'bed') return { vol: 0.45, cut: 1300, pan: PAN[src] || 0 };
    return { vol: 0.6, cut: 3200, pan: PAN[src] || 0 };
  }
  function c1Key() {
    var g = game, p = g.p, H = g.house, k = g.k, s = g.s, b = g.b;
    if (p.travel) {   // walking away from the door: the door has swung back open, so leave from the ajar view
      if (swing) { clearTimeout(swing.to); swing = null; }
      if (lastKey && /^c1_door_(sw|closed)/.test(lastKey)) lastKey = 'c1_door_ajar';
      return lastKey || 'c1_hub';
    }
    switch (p.pos) {
      case 'door':
        if (swing) return swing.seq[swing.i];
        if (p.holdDoor) return 'c1_door_closed';
        if (p.peek > 0) return 'c1_peek_' + peekSt;                           // the flashlight shows exactly where she is
        return k.on && k.st === 3 ? 'c1_door_k3' : 'c1_door_ajar';   // without it: only a dim shape once she is right at the door
      case 'window':
        if (!H.curtain) return s.st >= 3 ? 'c1_win_shadow' : (s.st === 2 ? 'c1_win_shadow2' : 'c1_win_closed');
        return s.st >= 1 ? 'c1_win_s' + Math.min(3, s.st) : 'c1_win_open';
      case 'cabinet': return 'c1_cab_' + b.st;
      case 'bed': return underKey(k.st === 4 && k.search > 0 ? (k.search > 13.6 ? 0 : k.search > 7 ? 1 : k.search > 0.4 ? 2 : 0) : -1);
    }
    if (k.st === 4) return 'c1_hub_kumot';
    if (!H.power && !H.curtain) return 'c1_hub_off';   // brownout: only the moon through the curtain
    return H.curtain ? 'c1_hub_open' : 'c1_hub';
  }
  var peekSt = 0;
  // what the room shows from the middle, one cut-out per entity: Kumot at the doorway, Silip at the window, Barang's aparador
  var ovlSig = '';
  function c1Overlays() {
    var g = game, p = g.p, H = g.house, k = g.k, s = g.s, b = g.b, keys = [];
    if (g.chapter === 1 && p.pos === 'center' && !p.travel && !p.hidden && H.power && k.st !== 4) {
      if (k.on && k.st === 3) keys.push('hubx_k3');
      if (s.on && s.st >= 2) keys.push('hubx_s' + Math.min(3, s.st) + (H.curtain ? 'o' : 'c'));
      if (b.on && b.st >= 2) keys.push('hubx_b' + Math.min(4, b.st));
    }
    ovlSwap(keys);
  }
  // put the entity cut-outs in place: decoded first, then swapped (in the dark of a flicker when nothing you did caused it)
  var ovlWant = '';
  function ovlSwap(keys) {
    var sig = keys.join(','); if (sig === ovlWant) return; ovlWant = sig; if (sig === ovlSig) return;
    var ims = keys.map(function (key) { var im = document.createElement('img'); im.className = 'bg'; im.alt = ''; im.src = IMGDIR(key) + key + '.webp'; return im; });
    Promise.all(ims.map(function (im) { return im.decode ? im.decode().catch(function () {}) : null; })).then(function () {
      if (ovlWant !== sig) return;
      var hadSome = ovlSig !== '' || sig !== '';
      if (hadSome && flkOK()) flicker();
      ovlSig = sig; var box = $('ovl'); box.innerHTML = ''; box._pw = box._pl = null; ims.forEach(function (im) { box.appendChild(im); }); panLayout();
    });
  }
  function c1LitKey() {   // the flashlight-lit render that the beam reveals
    var p = game.p; if (!p.light || p.travel) return null;
    if (p.pos === 'cabinet') return 'c1_cab_' + game.b.st + '_lit';
    if (p.pos === 'center' && !game.house.curtain && game.k.st !== 4) return game.house.power ? 'c1_hub_lit' : 'c1_hub_off_lit';
    return null;
  }
  function c1Spots() {
    var g = game, p = g.p, H = g.house, S = [];
    var back = { id: 'back', x: 36, y: 86, w: 28, h: 14, cls: 'exit', label: T('s_back').toUpperCase(), tap: function () { c1Go('center'); } };
    var lightToggle = function () { if (!game) return; var on = !game.p.light; doHold('light', on); lightLatch = on && game.p.light; };
    switch (p.pos) {
      case 'center':
        var PK1 = kOf(viewKey()) > 1.01, Q = function (a, b) { return PK1 ? a : b; }, d1 = Q([36.5, 26, 9, 58], [31, 35, 12, 42]), c1_ = Q([55, 27, 10, 60], [55, 34, 11, 46]), w1 = Q([64, 12, 13, 60], [68, 16, 27, 62]), b1 = Q([2, 66, 28, 34], [0, 66, 25, 34]);
        S.push({ id: 'door', x: d1[0], y: d1[1], w: d1[2], h: d1[3], label: T('s_door'), tap: function () { c1Go('door'); } });
        S.push({ id: 'cabinet', x: c1_[0], y: c1_[1], w: c1_[2], h: c1_[3], label: T('s_cabinet'), tap: function () { c1Go('cabinet'); } });
        S.push({ id: 'curtain', x: w1[0], y: w1[1], w: w1[2], h: w1[3], label: T('s_window'), tap: function () { c1Go('window'); } });
        S.push({ id: 'bed', x: b1[0], y: b1[1], w: b1[2], h: b1[3], label: T('s_bed'), tap: function () { act('hide'); } });
        if (PK1 && !game.house.fan) S.push({ id: 'fan', x: 81.5, y: 55, w: 7.5, h: 44, label: T('s_fan'), tap: function () { act('fan'); } });
        break;
      case 'door':     // anywhere: double-tap = flashlight down the hall (again = off), hold = shut the door and keep it shut
        S.push({ id: 'door', x: 0, y: 0, w: 100, h: 85, cls: 'gesture', gesture: true, label: T('s_door_use'), hold: 'door', dbl: function () { act('peek'); } });
        S.push(back); break;
      case 'window':   // double-tap = open / close the curtain to look, hold = pull it shut and hold it
        S.push({ id: 'curtain', x: 0, y: 0, w: 100, h: 85, cls: 'gesture', gesture: true, label: T('s_curtain_use'), hold: 'curtain', preHold: function () { if (game && game.house.curtain) act('curtain'); }, dbl: function () { act('curtain'); } });
        S.push(back); break;
      case 'cabinet':  // double-tap = flashlight on the aparador (again = off)
        S.push({ id: 'cabinet', x: 0, y: 0, w: 100, h: 85, cls: 'gesture', gesture: true, label: T('s_cab_use'), dbl: lightToggle });
        S.push(back); break;
      case 'bed':
        S.push({ id: 'out', x: 36, y: 86, w: 28, h: 14, cls: 'exit up', label: T('s_out').toUpperCase(), tap: function () { act('unhide'); } });
        break;
    }
    return S;
  }
  function c1LightAllowed() { var p = game.p; return p.pos !== 'bed' && (p.pos === 'cabinet' || !game.house.power); }
  function c1Go(pos) { if (!game || game.p.travel) return; act('go', pos); }
  // synced footsteps: one short step per head-bob down, wood floor, small room reverb
  function steps(n, ms, surface, run) {
    var ids = surface === 'cement' ? ['step_c1', 'step_c2', 'step_c3'] : ['step_w1', 'step_w2', 'step_w3'];
    for (var i = 0; i < n; i++) play(ids[i % 3], { vol: run ? 0.5 : 0.38, delay: (i + 0.55) * ms / n / 1000 });
  }
  function c1Travel(d) {
    var ms = d.t * 1000 / speed(); $('hint').style.opacity = 0;
    releaseHolds(); buildHot();
    if (d.hide || d.unhide) { onHide('bed', !!d.hide, ms); return; }
    var n = Math.max(1, Math.round(ms / 280)); steps(n, ms, 'wood', false);
    if (walkStart(d.from, d.to, d.t / speed())) return;
    // toward a spot: push into it in the hub picture; back to the middle: the hub comes up from that corner
    travelAnim(d.to, ms, false, d.from === 'center' ? panToView(C1PT[d.to]) : [50, 60], d.to === 'center' && C1PT[d.from] ? null : [50, 55], d.to === 'center' ? 'c1hub' : '');
  }
  function c1Arrive(d) {
    var ours = travAnim; travClear(); viewLock = null;
    if (!ours) camClear();
    setView(true, true); panTick(0); buildHot(); black(0, 200); var c_ = $('cam'); if (c_) c_.style.filter = '';
    walkEnd();
    if (Math.random() < 0.25) play('floor_creak', { vol: 0.3 });
  }
  function c1Events(e) {
    var d = e.data;
    switch (e.type) {
      case 'cue': play(d.id, { room: d.room, vol: (d.vol || 1) * fanMask(), delay: d.delay || 0 }); break;
      case 'travel': c1Travel(d); break;
      case 'arrive': if (d.to !== 'bed' && d.from !== 'bed') c1Arrive(d); break;
      case 'door_shut': if (isC1()) { c1Swing(true); break; } play('door_close_shut', { vol: 0.85 }); setView(true, true); jolt(); break;
      case 'peek':   /* Chapter 1 has two sightings: down the hall (2) and at the door (3); the light stays on until switched off */
        peekSt = d.st >= 2 ? d.st : 0;
        if (!d.moved) { play('flashlight_on', { vol: 0.5 }); play('door_creak', { vol: 0.3 }); }
        setView(true, !d.moved);
        if (d.st === 3) { play('wheeze', { vol: 1 }); jolt(); flashRed(); }
        break;
      case 'peek_off': play('flashlight_click', { vol: 0.45 }); setView(true, true); break;
      case 'kumot_startled': play('door_slam', { vol: 0.5, delay: 0.3 }); break;
      case 'silip_tear': play('curtain_open_pull', { vol: 1 }); break;
      case 'door_release': if (isC1()) { c1Swing(false); break; } play('door_creak', { vol: 0.35 }); setView(true, true); break;
      case 'kumot_leave': if (d.inside) play('door_creak', { vol: 0.6 }); play('scuffs_far', { room: 'hall', vol: 0.45 }); break;
      case 'kumot_enter': play('door_slam', { vol: 1 }); play('door_creak', { vol: 0.6, delay: 0.15 }); jolt(); flashRed(); setView(true, true); break;
      case 'kumot_search': play('lullaby_hum', { vol: 0.55 }); break;
      case 'lift_warn': play('kulambo_rustle', { vol: 0.9 }); break;
      case 'lift': play('wheeze', { vol: 0.9 }); jolt(); break;
      case 'silip_near': play(d.st === 1 ? 'wing_flap_far' : 'wing_flap', { room: 'window', vol: d.st === 1 ? 0.45 : 0.7 }); break;
      case 'silip_scratch': play('nail_taps', { room: 'window', vol: 0.9 }); play('wing_flap', { room: 'window', vol: 0.5 }); break;
      case 'silip_seen': play('static_swell', { room: 'window', vol: 0.7 }); play('wing_flap', { room: 'window', vol: 1 }); jolt(); break;
      case 'silip_grip': play('curtain_grip', { room: 'window', vol: 1 }); jolt(); break;
      case 'silip_leave': play('wing_flap_far', { room: 'window', vol: 0.55 }); break;
      case 'curtain_open': play('curtain_open_pull', { room: 'window', vol: 0.9 }); clothSwish(); break;
      case 'curtain_close': play('curtain_close_pull', { room: 'window', vol: 0.9 }); clothSwish(); break;
      case 'curtain_blown': clothSwish(); break;
      case 'barang_step': play('aparador_creak', { room: 'cabinet', vol: 0.4 + d.st * 0.12 }); break;
      case 'barang_back': play('beetle_scatter', { room: 'cabinet', vol: 0.8 }); setView(true); break;
      case 'light': play(d.on ? 'flashlight_on' : 'flashlight_click', { vol: 0.45 }); break;
      case 'breath_in': break;
      case 'fan': fanEvent(d); break;
      case 'fan_nopower': hint(T('fan_nopower'), 3); break;
      case 'tired': if (d.lvl === 1) { play('yawn', { vol: 0.7 }); hint(T('tired1'), 4); } else if (d.lvl === 2) { play('yawn', { vol: 0.9 }); hint(T('tired2'), 4); } break;
      case 'blackout': play('power_down'); jolt(); break;
      case 'gasp': play('breath_hold_gasp', { offset: 8.0, vol: 1 }); stopBreath(); jolt(); break;
      case 'heartbeat': if (d.on && !amb.heart) amb.heart = play('heartbeat', { loop: true, vol: 0.5 }); else if (!d.on && amb.heart) { stop(amb.heart, 0.6); amb.heart = null; } break;
      case 'win': onWin(); break;
      case 'death': onDeath(d.who); break;
    }
  }
  function clothSwish() { if (lowFx()) { setView(true); return; } var im = $(front); if (im.animate) im.animate([{ filter: 'blur(0px)' }, { filter: 'blur(3px)', offset: 0.4 }, { filter: 'blur(0px)' }], { duration: 380 }); camAnim([{ transform: 'translateX(0)' }, { transform: 'translateX(-10px)', offset: 0.4 }, { transform: 'translateX(0)' }], 380, [50, 50]); setView(true); }
  function flashRed() { if (save.set.reduced) return; var f = $('flash'); f.style.transition = 'none'; f.style.opacity = 0.35; setTimeout(function () { f.style.transition = 'opacity .6s'; f.style.opacity = 0; }, 80); }
  function c1Ambience() {
    var g = game, p = g.p, pos = p.travel ? p.travel.to : p.pos;
    // crickets go quiet while Silip is out; louder at the window
    setLoopVol(amb.garden, g.s.st >= 1 ? 0 : (pos === 'window' ? 0.55 : 0.25));
    // beetles inside the aparador, louder the further the door has opened
    if (g.b.on && !amb.beetles) amb.beetles = play('beetles', { bus: 'amb', loop: true, vol: 0 });
    if (amb.beetles) setLoopVol(amb.beetles, [0, 0.12, 0.25, 0.4, 0.6][g.b.st] * (pos === 'cabinet' ? 1.4 : 0.6));
    // her breathing: you hear her coming. Faint down the hall, plain from anywhere in the room once she is at the door
    // (no need to shine the light then), loudest with your ear at the gap, and right over you once she is inside.
    if (g.k.on && !amb.kbreath) amb.kbreath = play('kumot_breath', { bus: 'sfx', loop: true, vol: 0 });
    if (amb.kbreath) {
      var kb = 0, st = g.k.st;
      if (st === 2) kb = pos === 'door' ? 0.4 : 0.14;
      else if (st === 3) kb = pos === 'door' ? (p.holdDoor ? 0.85 : 1.0) : pos === 'center' ? 0.6 : 0.42;
      else if (st === 4) kb = pos === 'bed' ? 0.95 : 0.8;
      setLoopVol(amb.kbreath, kb * fanMask());
    }
  }
  // the door swinging shut (or back open) in three pre-rendered frames, then the held/ajar view
  var swing = null;
  function c1Swing(close) {
    var all = ['c1_door_sw80', 'c1_door_sw62', 'c1_door_sw46', 'c1_door_sw32', 'c1_door_sw18'], seq = close ? all : all.slice().reverse(), start = 0;
    if (swing) { clearTimeout(swing.to); var cur = swing.seq[swing.i]; start = Math.max(0, seq.indexOf(cur)); }
    swing = { seq: seq, i: start, close: close };
    play(close ? 'door_creak' : 'door_creak', { vol: close ? 0.4 : 0.3 });
    if (close && !lowFx()) camAnim([{ transform: 'scale(1)' }, { transform: 'scale(1.045) translateX(-1.2%)' }, { transform: 'scale(1.015)' }, { transform: 'scale(1)' }], 520, [32, 55], 'ease-out');   // you lean into it as you pull it shut
    (function step() {
      setView(true, true);
      if (!swing) return;   // walked away mid-swing
      swing.to = setTimeout(function () {
        if (!swing) return;
        swing.i++;
        if (swing.i >= swing.seq.length) {
          var c = swing.close; swing = null; setView(true, true);
          if (c) { play('door_close_shut', { vol: 0.85 }); jolt(); }
        } else step();
      }, close ? 70 : 80);
    })();
  }
  function c1Hold() {
    var p = game.p, t = performance.now() / 1000, tr = '';
    if (p.holdDoor) { var j = game.k.st === 3 ? 3.5 : 1; cam.style.transformOrigin = '50% 50%'; tr = 'scale(1.06) translate(' + (Math.sin(t * 37) * j).toFixed(1) + 'px,' + (Math.cos(t * 29) * j).toFixed(1) + 'px)'; }
    else if (p.holdCurtain) { var k = game.s.phase === 'grip' ? 4 : 1; cam.style.transformOrigin = '50% 45%'; tr = 'scale(1.05) translate(' + (Math.sin(t * 33) * k).toFixed(1) + 'px,' + (Math.cos(t * 41) * k).toFixed(1) + 'px)'; }
    else if (p.holdBreath) { cam.style.transformOrigin = '50% 60%'; tr = 'scale(' + (1.04 + Math.sin(t * 1.4) * 0.01).toFixed(3) + ')'; }
    else if (!p.travel) tr = 'translate(' + (Math.sin(t * 0.35) * 3).toFixed(1) + 'px,' + (Math.sin(t * 0.5) * 2).toFixed(1) + 'px) scale(1.01)';
    cam.style.transform = tr;
  }

  // ------------------------------------------------------------ Chapter 2 breaker: 3x3 memory puzzle (pattern shown once, then repeat)
  var pz = null;
  function puzzleOpen() {
    if (!game || game.house.power) return;
    var box = $('puzzle'); box.classList.add('show'); $('pz-title').textContent = T('pz_title'); $('pz-leave').textContent = T('pz_leave');
    var grid = $('pz-grid'); grid.innerHTML = '';
    for (var i = 0; i < 9; i++) (function (i) {
      var b = document.createElement('button'); b.className = 'pzc'; b.setAttribute('data-i', i);
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); puzzleTap(i, b); });
      grid.appendChild(b);
    })(i);
    puzzleNew();
  }
  function puzzleNew() {
    var n = game.night >= 5 ? 4 : 3, seq = [];
    while (seq.length < n) { var r = Math.floor(Math.random() * 9); if (seq[seq.length - 1] !== r && seq.indexOf(r) < 0) seq.push(r); }
    pz = { seq: seq, i: 0, input: false, timers: [] };
    $('pz-msg').textContent = T('pz_watch');
    var cells = $('pz-grid').children, at = 600;
    seq.forEach(function (c) {
      pz.timers.push(setTimeout(function () { cells[c].classList.add('lit'); play('light_switch', { vol: 0.35 }); }, at));
      pz.timers.push(setTimeout(function () { cells[c].classList.remove('lit'); }, at + 520));
      at += 720;
    });
    pz.timers.push(setTimeout(function () { if (pz) { pz.input = true; $('pz-msg').textContent = T('pz_go'); } }, at));
  }
  function puzzleTap(i, b) {
    if (!pz || !pz.input || !game) return;
    b.classList.add('lit'); setTimeout(function () { b.classList.remove('lit'); }, 180);
    if (pz.seq[pz.i] === i) {
      pz.i++; play('flashlight_click', { vol: 0.5 });
      if (pz.i >= pz.seq.length) { $('pz-msg').textContent = T('pz_ok'); pz.input = false; setTimeout(function () { puzzleClose(); act('breaker'); }, 350); }
    } else {
      pz.input = false; $('pz-msg').textContent = T('pz_wrong'); $('puzzle').classList.add('bad'); act('breaker_fail');
      setTimeout(function () { $('puzzle').classList.remove('bad'); if (pz) puzzleNew(); }, 1100);
    }
  }
  function puzzleClose() { if (pz) pz.timers.forEach(clearTimeout); pz = null; $('puzzle').classList.remove('show'); }

  // ------------------------------------------------------------ Tita Cora's phone call (voice in Tagalog, subtitles in the chosen language)
  var call = null;
  function startCall(n) {
    var lines = (typeof CALLS !== 'undefined') && CALLS[n];
    if (!lines) { call = null; return false; }
    call = { n: n, lines: lines, i: -1, state: 'ring', wait: 0, t: 0, focus: null };
    call.ring = play('ringtone', { loop: true, vol: 0.32 });
    var ph = $('phone'); ph.className = 'pe show ring'; phoneImg(ph);
    $('ph-state').textContent = T('ph_calling'); $('ph-time').textContent = ''; $('ph-who').textContent = T('ph_who');
    $('ph-ans').textContent = T('ph_answer'); $('ph-dec').textContent = T('ph_decline');
    if ((n === 1 || n === 'c1n1') && game) game.quiet = true;
    buildHot();
    return true;
  }
  function answerCall() {
    if (!call || call.state !== 'ring') return;
    stop(call.ring, 0.05); play('phone_pickup', { vol: 0.8 });
    call.state = 'talk'; call.wait = 0.7; call.static = play('line_static', { loop: true, vol: 0.18 });
    var ph = $('phone'); ph.className = 'pe show talk'; phoneImg(ph); $('ph-state').textContent = T('ph_live'); $('ph-dec').textContent = T('ph_mute');
    lastT = performance.now(); hotSig = ''; buildHot();
  }
  function endCall(silent) {
    if (!call) return;
    var c = call; call = null;
    if (c.ring) stop(c.ring, 0.05); if (c.static) stop(c.static, 0.2); if (c.voice) stop(c.voice, 0.08);
    if (!silent) play('phone_hangup', { vol: 0.6 });
    $('sub').classList.remove('show');
    var ph = $('phone'); $('ph-state').textContent = T('ph_ended'); ph.classList.add('ended'); phoneImg(ph);
    setTimeout(function () { ph.className = 'pe'; }, silent ? 0 : 900);
    if (game) { game.quiet = false; }
    lastT = performance.now(); hotSig = ''; buildHot();
    document.querySelectorAll('.spot.focus').forEach(function (s) { s.classList.remove('focus'); });
  }
  function callTick(dt) {
    if (!call || call.state !== 'talk') return;
    call.t += dt; var s = Math.floor(call.t); clockImg($('ph-time'), '0' + Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60));
    if (call.speaking) return;
    call.wait -= dt; if (call.wait > 0) return;
    call.i++;
    if (call.i >= call.lines.length) { endCall(); return; }
    var ln = call.lines[call.i], id = 'v_' + call.n + '_' + pad2(call.i);
    var txt = save.set.lang === 'fil' ? ln.fil : ln.en;
    $('sub-t').textContent = txt; $('sub').classList.add('show');
    call.focus = ln.focus || null;
    document.querySelectorAll('.spot').forEach(function (el) { el.classList.toggle('focus', el.getAttribute('data-spot') === call.focus || (call.focus === 'curtain' && /^(cl|cr|curtain)$/.test(el.getAttribute('data-spot')))); });
    if (BUF[id]) {
      call.speaking = true; var me = call;
      call.voice = play(id, { vol: 1.35, bus: 'voice' });
      if (call.voice) call.voice.src.onended = function () { if (call === me) { me.speaking = false; me.wait = 0.45; } };
      else { call.speaking = false; call.wait = 1.0 + txt.length * 0.06; }
    } else { call.wait = 1.0 + txt.length * 0.062; }
  }

  // ------------------------------------------------------------ Custom Night: 8 modes, each entity 0-20, records
  var CU_ENT = ['kumot', 'malik', 'kal', 'silip', 'barang'];
  var CU_MODES = [
    { kumot: 5, malik: 5, kal: 5, silip: 5, barang: 5 }, { kumot: 10, malik: 10, kal: 10, silip: 10, barang: 10 }, { kumot: 15, malik: 15, kal: 15, silip: 15, barang: 15 },
    { kumot: 20, malik: 20, kal: 20, silip: 20, barang: 20 }, { kumot: 20, malik: 0, kal: 0, silip: 0, barang: 0 }, { kumot: 0, malik: 0, kal: 0, silip: 20, barang: 20 },
    { kumot: 0, malik: 15, kal: 15, silip: 0, barang: 0 }, { kumot: 10, malik: 10, kal: 10, silip: 10, barang: 10, dark: true }];
  var cuSel = { mode: 1, lv: JSON.parse(JSON.stringify(CU_MODES[1])) }, customRun = null;
  function cuPoints(lv) { return CU_ENT.reduce(function (a, k) { return a + (lv[k] || 0); }, 0) * 10 * (lv.dark ? 2 : 1); }
  function customRender() {
    var m = $('cu-modes'); m.innerHTML = '';
    T('cu_modes').forEach(function (md, i) {
      var b = document.createElement('button'); b.className = 'cumode' + (cuSel.mode === i ? ' on' : ''); b.type = 'button';
      b.innerHTML = '<span></span><small></small>'; b.firstChild.textContent = md[0]; b.lastChild.textContent = md[1];
      b.addEventListener('click', function () { cuSel.mode = i; cuSel.lv = JSON.parse(JSON.stringify(CU_MODES[i])); customRender(); });
      m.appendChild(b);
    });
    var a = $('cu-ai'); a.innerHTML = '';
    CU_ENT.forEach(function (k) {
      var d = document.createElement('div'); d.className = 'cuent';
      var im = document.createElement('img'); im.src = IMGDIR() + HERO[k] + '.jpg'; im.alt = '';
      var nm = document.createElement('b'); nm.textContent = T('who')[k];
      var lv = document.createElement('div'); lv.className = 'lv'; lv.textContent = cuSel.lv[k] || 0;
      var mi = document.createElement('button'); mi.type = 'button'; mi.textContent = '−'; var pl = document.createElement('button'); pl.type = 'button'; pl.textContent = '+';
      var set = function (dv) { cuSel.lv[k] = Math.max(0, Math.min(20, (cuSel.lv[k] || 0) + dv)); cuSel.mode = -1; customRender(); };
      mi.addEventListener('click', function () { set(-1); }); pl.addEventListener('click', function () { set(1); });
      d.appendChild(im); d.appendChild(nm); d.appendChild(lv); d.appendChild(mi); d.appendChild(pl); a.appendChild(d);
    });
    var key = cuSel.mode >= 0 ? 'm' + cuSel.mode : 'free', r = save.custom.records[key];
    $('cu-rec').textContent = (r ? T('cu_rec', r + ' pts') : T('cu_none')) + ' · ' + cuPoints(cuSel.lv) + ' pts';
  }
  function customOpen() { stopMenu(); customRender(); show('scr-custom'); }
  function customStart() {
    customRun = { lv: JSON.parse(JSON.stringify(cuSel.lv)), key: cuSel.mode >= 0 ? 'm' + cuSel.mode : 'free' };
    curCh = 3; nightIdx = 0; stopAll();
    $('intro-n').textContent = T('custom_night'); $('intro-name').textContent = cuSel.mode >= 0 ? T('cu_modes')[cuSel.mode][0] : cuPoints(customRun.lv) + ' pts';
    $('intro-rules').innerHTML = ''; show('scr-intro');
  }

  // ------------------------------------------------------------ win / death
  function cleanupScene() { travClear(); walkEnd(); var td = $('tired'); if (td) { css(td, 'opacity', '0'); td.classList.remove('heavy'); } ['efan_fan', 'efan_fanB'].forEach(function (k) { if (amb[k]) { stop(amb[k], 0.2); amb[k] = null; } }); fanSpin.fan.v = fanSpin.fanB.v = 0; endCall(true); releaseHolds(); camClear(); viewLock = null; $('fx').innerHTML = ''; $('hot').innerHTML = ''; hotSig = 'none'; black(0, 10); if (runH) { stop(runH); runH = null; } }
  function onWin() {
    cleanupScene(); stopBreath(); stopAll(); play('bell_6am', { bus: 'music', vol: 0.9 }); play('rooster_dawn', { bus: 'amb', vol: 0.6, delay: 2 });
    var secs = Math.round((performance.now() - nightStart) / 1000);
    $('win-n').textContent = (curCh === 1 ? T('ch_n', 1) + ' · ' : '') + T('night_n', game.night);
    $('win-time').textContent = T('time_survived') + ': ' + Math.floor(secs / 60) + 'm ' + (secs % 60) + 's';
    if (customRun) {
      var pts = cuPoints(customRun.lv), rk = customRun.key;
      save.custom.records[rk] = Math.max(save.custom.records[rk] || 0, pts); store();
      $('win-n').textContent = T('custom_night'); $('win-time').textContent = T('cu_won', pts);
      game = null; setTimeout(function () { show('scr-win'); }, 300); return;
    }
    var key = 'c' + curCh, n = game.night, last = n >= CH_NIGHTS[curCh];
    save.prog[key] = Math.max(save.prog[key] || 0, n);
    if (!last) save.cur = { ch: curCh, n: n + 1 }; else if (curCh < 3) save.cur = { ch: curCh + 1, n: 1 };
    if (save.prog.c1 >= 5 && save.prog.c2 >= 5 && save.prog.c3 >= 7) save.custom.unlocked = true;
    store(); renderTexts();
    game = null;
    if (last) { $('end-title').textContent = T('ch_n', curCh).toUpperCase() + ' · ' + T('end_title'); $('end-text').textContent = T('c' + curCh + '_end') || T('end_text'); }
    setTimeout(function () { show(last ? 'scr-end' : 'scr-win'); }, 300);
  }
  function onDeath(who) {
    cleanupScene(); stopBreath(); stopAll();
    var ck = game.clock(), ch1 = isC1(), night = game.night;
    var hid = game.p.hidden || (ch1 && game.p.pos === 'bed' ? 'bed' : null);
    // FNAF4: where it got you is the background. Hiding places have their own; Silip comes through the back door after Chapter 1
    var jsn = who === 'kumot' && hid === 'bed' ? 'kumotu' : who === 'malik' && hid === 'sofa' ? 'malikh' : who === 'kal' && hid === 'cabinet' ? 'kalh' : who === 'silip' && !ch1 ? 'silipc' : null;
    game = null;
    if (who !== 'bangungot') return scareRun(who, ck, ch1, night, false, jsn);
    // BANGUNGOT: your strength gives out. Your eyes close (slowly), the room goes; then you are lying in Lola's bed and
    // cannot move, and she is at the foot of it. She climbs onto you.
    var bl = $('black'); bl.style.transition = 'opacity 1.6s ease-in'; bl.style.opacity = 1;
    play('yawn', { vol: 0.8 }); play('heartbeat', { vol: 0.6 });
    var sc = $('scare'), im = $('scare-img'), base = JSDIR + 'js_bangungot_';
    scareTimers.forEach(clearTimeout); scareTimers = [];
    scareTimers.push(setTimeout(function () {
      im.src = base + '0.jpg'; sc.className = 'anim'; sc.style.display = 'block'; sc.style.opacity = 0; sc.style.transition = 'opacity 1.4s ease';
      bl.style.transition = 'opacity .8s'; bl.style.opacity = 0;
      requestAnimationFrame(function () { sc.style.opacity = 1; });
      play('wheeze', { vol: 0.9 }); play('lullaby_hum', { vol: 0.6 }); cap('bangungot');
    }, 2000));
    scareTimers.push(setTimeout(function () { im.src = base + '1.jpg'; play('kulambo_rustle', { vol: 0.8 }); }, 3900));
    scareTimers.push(setTimeout(function () { sc.style.transition = ''; sc.style.opacity = ''; scareRun('bangungot', ck, ch1, night, true); }, 5200));
  }
  function scareRun(who, ck, ch1, night, keep, jsn) {
    // the jumpscare: frames 0-1 it is simply there, 2-7 it lunges (the scream lands with frame 2), then it shudders in your face
    var sc = $('scare'), im = $('scare-img'), base = JSDIR + 'js_' + (jsn || JS[who]) + '_';
    if (!sc.querySelector('.redout')) { var ro = document.createElement('div'); ro.className = 'redout'; sc.appendChild(ro); }
    var soft = !!save.set.reduced, still = lowFx();
    sc.style.display = 'block'; sc.className = 'anim'; if (!keep) im.src = base + '0.jpg';
    play(WHO_SFX[who], { vol: soft ? 0.45 : 1 });
    var T0 = keep ? [0, 0, 120, 165, 210, 255, 300, 345] : [0, 170, 350, 395, 440, 485, 530, 575], HIT = keep ? 120 : 350;
    if (!keep) { scareTimers.forEach(clearTimeout); scareTimers = []; }
    T0.forEach(function (t, f) { scareTimers.push(setTimeout(function () { im.src = base + f + '.jpg'; }, t)); });
    scareTimers.push(setTimeout(function () {
      if (!soft) {
        if (!still) sc.classList.add('hit'); if (save.set.gfx !== 'low') sc.classList.add('split');
        var fl = $('flash'); fl.style.transition = 'none'; fl.style.opacity = 0.8; setTimeout(function () { fl.style.transition = 'opacity .35s'; fl.style.opacity = 0; }, 60);
        if (navigator.vibrate) try { navigator.vibrate([90, 30, 140, 30, 220]); } catch (e) {}
      }
    }, HIT));
    for (var tj = 640, alt = 0; tj < 1500; tj += 70, alt++) (function (t, a) { scareTimers.push(setTimeout(function () { im.src = base + (a % 2 ? 7 : 6) + '.jpg'; }, t)); })(tj, alt);
    scareTimers.push(setTimeout(function () { im.src = base + '7.jpg'; sc.classList.remove('hit'); }, 1500));
    $('over-who').textContent = T('who')[who];
    $('over-hint').textContent = who === 'bangungot' ? T('hint_bangungot') : (ch1 ? T('c1_hint') : T('hint'))[who] || T('c1_hint')[who] || '';
    if (who === 'barang') play('beetle_scatter', { vol: 1 });
    var c = ck; $('over-time').textContent = (ch1 ? T('ch_n', 1) + ' · ' : '') + T('night_n', night) + ' · ' + c.h + ':' + (c.m < 10 ? '0' : '') + c.m + ' AM';
    $('over-bg').src = JSDIR + 'js_' + (jsn || JS[who]) + '_7.jpg';
    game = null;
    setTimeout(function () { sc.style.display = 'none'; sc.className = ''; show('scr-over'); play('amb_menu', { bus: 'music', loop: true, vol: 0.5 }); }, 1800);
  }

  // ------------------------------------------------------------ main menu: the room you have reached, its light failing
  var menuRaf = 0, menuMusic = null, menuAmb = null, menuMode = null;
  function menuScene() {
    var P = save.prog;
    if (P.c1 >= 5 && P.c2 >= 5 && P.c3 >= 7) return { on: 'menu_morning', mode: 'day' };
    if (P.c1 < 5) return P.c1 + 1 === 5 ? { on: 'menu_bed_off', lit: 'menu_bed_off_lit', mode: 'torch' } : { on: 'menu_bed', off: 'menu_bed_off', mode: 'blink' };
    if (P.c2 < 5) return P.c2 + 1 === 5 ? { on: 'menu_hall_off', lit: 'menu_hall_off_lit', mode: 'torch' } : { on: 'hallway_empty', off: 'menu_hall_off', mode: 'blink' };
    return P.c3 + 1 >= 5 ? { on: 'menu_living_tvoff', lit: 'menu_living_off_lit', mode: 'torch' } : { on: 'menu_living_on', off: 'menu_living_tvoff', mode: 'blink' };
  }
  function toMenu() {
    stopMenu(); show('scr-menu'); renderTexts();
    var sc = menuScene(); menuMode = sc;
    var on = $('mbg-on'), off = $('mbg-off'), lit = $('mbg-lit');
    on.src = IMGDIR() + sc.on + '.jpg'; on.style.opacity = 1;
    off.style.opacity = 0; lit.style.opacity = 0;
    if (sc.off) off.src = IMGDIR() + sc.off + '.jpg';
    if (sc.lit) { lit.src = IMGDIR() + sc.lit + '.jpg'; lit.style.opacity = 1; on.style.filter = 'brightness(.7)'; } else on.style.filter = '';
    if (sc.mode === 'day') on.style.filter = 'brightness(1.05)';
    menuMusic = play('theme_menu', { bus: 'music', loop: true, vol: sc.mode === 'day' ? 0.3 : 0.55 });
    menuAmb = play(sc.mode === 'day' ? 'rooster_dawn' : 'amb_menu', { bus: 'amb', loop: sc.mode !== 'day', vol: 0.35 });
    var nextBlink = 1.5 + Math.random() * 3, seq = [], t0 = performance.now(), last = t0;
    function frame(now) {
      menuRaf = requestAnimationFrame(frame);
      var dt = (now - last) / 1000, t = (now - t0) / 1000; last = now;
      if (sc.mode === 'blink') {
        nextBlink -= dt;
        if (nextBlink <= 0 && !seq.length) {
          // a failing bulb: a few fast flickers, sometimes a long dark gap
          var n = 2 + Math.floor(Math.random() * 4), at = 0;
          for (var i = 0; i < n; i++) { seq.push({ at: at, off: true }); at += 0.05 + Math.random() * 0.09; seq.push({ at: at, off: false }); at += 0.04 + Math.random() * 0.12; }
          if (Math.random() < 0.35) { seq.push({ at: at, off: true }); seq.push({ at: at + 0.8 + Math.random() * 1.6, off: false }); }
          seq.forEach(function (s_) { s_.at += t; });
          nextBlink = 3 + Math.random() * 6;
          play('light_switch', { bus: 'amb', vol: 0.12 });
        }
        while (seq.length && seq[0].at <= t) { off.style.opacity = seq.shift().off ? 1 : 0; }
      } else if (sc.mode === 'torch') {
        // someone's flashlight sweeping slowly across the dark room
        var x = 640 + Math.sin(t * 0.37) * 360 + Math.sin(t * 1.1) * 40, y = 360 + Math.sin(t * 0.53 + 1) * 120 + Math.cos(t * 1.7) * 18;
        var fl = (Math.random() < 0.015) ? 0.4 : 1;
        var m = 'radial-gradient(circle at ' + x + 'px ' + y + 'px, rgba(0,0,0,' + fl + ') 0, rgba(0,0,0,' + fl + ') 110px, rgba(0,0,0,' + (fl * 0.5) + ') 180px, transparent 260px)';
        lit.style.webkitMaskImage = lit.style.maskImage = m;
      }
    }
    menuRaf = requestAnimationFrame(frame);
  }
  function stopMenu() { if (menuRaf) cancelAnimationFrame(menuRaf); menuRaf = 0; if (menuMusic) { stop(menuMusic, 0.6); menuMusic = null; } if (menuAmb) { stop(menuAmb, 0.6); menuAmb = null; } }

  // ------------------------------------------------------------ prologue: Tita Cora's call before the chapter starts (outside the game)
  var pp = null;
  function prologue(key, done) {
    stopMenu(); stopAll();
    var lines = (typeof PROLOGUE !== 'undefined') && PROLOGUE[key];
    if (!lines) { done(); return; }
    initAudio().then(function () {
      pp = { key: key, lines: lines, i: -1, done: done, t: 0, wait: 0, speaking: false };
      $('pp-bg').src = IMGDIR() + (key === 'c1' ? 'menu_bed' : 'hallway_empty') + '.jpg';
      $('pp-phone').className = 'pp-phone ring'; phoneImg($('pp-phone')); $('pp-state').textContent = T('ph_calling'); $('pp-time').textContent = '';
      $('pp-sub').style.opacity = 0; $('pp-sub').innerHTML = '';
      show('scr-phone');
      pp.ring = play('ringtone', { loop: true, vol: 0.3 });
      pp.room = play('amb_house', { bus: 'amb', loop: true, vol: 0.35 });
      var last = performance.now();
      (function tick(now) {
        if (!pp) return; pp.raf = requestAnimationFrame(tick);
        var dt = Math.min(0.1, (now - last) / 1000); last = now;
        if (!pp.talking) return;
        pp.t += dt; var s = Math.floor(pp.t); clockImg($('pp-time'), '0' + Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60));
        if (pp.speaking) return;
        pp.wait -= dt; if (pp.wait > 0) return;
        pp.i++;
        if (pp.i >= pp.lines.length) { ppEnd(false); return; }
        var ln = pp.lines[pp.i], txt = save.set.lang === 'fil' ? ln.fil : ln.en, id = 'v_pro_' + pp.key + '_' + pad2(pp.i);
        $('pp-sub').innerHTML = '<b>TITA CORA</b>'; $('pp-sub').appendChild(document.createTextNode(txt)); $('pp-sub').style.opacity = 1;
        if (BUF[id]) { pp.speaking = true; var me = pp; pp.voice = play(id, { bus: 'voice', vol: 1.35 }); if (pp.voice) pp.voice.src.onended = function () { if (pp === me) { me.speaking = false; me.wait = 0.55; } }; else { pp.speaking = false; pp.wait = 1.2 + txt.length * 0.06; } }
        else pp.wait = 1.2 + txt.length * 0.062;
      })(last);
    });
  }
  function ppAnswer() {
    if (!pp || pp.talking) return;
    stop(pp.ring, 0.05); play('phone_pickup', { vol: 0.7 });
    pp.talking = true; pp.wait = 0.8; pp.static = play('line_static', { loop: true, vol: 0.12 });
    $('pp-phone').className = 'pp-phone talking'; phoneImg($('pp-phone')); $('pp-state').textContent = T('ph_live');
  }
  // the player hangs up on her: the line clicks off, the phone shows the call ended, the night begins
  function ppHangUp() {
    if (!pp || !pp.talking) return; var p_ = pp; pp = null;
    cancelAnimationFrame(p_.raf); stop(p_.ring, 0.05); stop(p_.static, 0.1); stop(p_.voice, 0.08); stop(p_.room, 0.6);
    play('phone_hangup', { vol: 0.7 }); $('pp-phone').classList.add('ended'); phoneImg($('pp-phone')); $('pp-sub').style.opacity = 0;
    setTimeout(function () { p_.done(); }, 900);
  }
  function ppEnd(skipped) {
    if (!pp) return; var p_ = pp; pp = null;
    cancelAnimationFrame(p_.raf); stop(p_.ring, 0.05); stop(p_.static, 0.2); stop(p_.voice, 0.1); stop(p_.room, 0.5);
    if (!skipped) { play('static_swell', { vol: 0.5 }); play('phone_hangup', { vol: 0.6, delay: 0.6 }); $('pp-state').textContent = T('ph_ended'); $('pp-phone').classList.add('ended'); phoneImg($('pp-phone')); }
    setTimeout(function () { $('pp-sub').style.opacity = 0; p_.done(); }, skipped ? 50 : 1800);
  }

  // ------------------------------------------------------------ pause
  function pause(on) {
    if (!game) return;
    paused = on;
    if (on) { if (AC) AC.suspend(); releaseHolds(); show('scr-pause'); }
    else { show(null); lastT = performance.now(); if (AC) AC.resume(); }
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden && game && !paused) pause(true); });

  // ------------------------------------------------------------ fullscreen
  function goFull() {
    var d = document.documentElement, f = d.requestFullscreen || d.webkitRequestFullscreen;
    try { if (f && !document.fullscreenElement) { var r = f.call(d); if (r && r.then) r.then(function () { try { screen.orientation.lock('landscape').catch(function () {}); } catch (e) {} }).catch(function () {}); } } catch (e) {}
  }

  // ------------------------------------------------------------ wiring
  function on(id, fn) { var el = $(id); if (el) el.addEventListener('click', function (e) { e.preventDefault(); play('flashlight_click', { vol: 0.3, bus: 'sfx' }); fn(e); }); }
  function wire() {
    panWire();
    on('load-go', function () { initAudio().then(function () { goFull(); show('scr-warn'); }); });
    on('warn-go', function () { toMenu(); });
    on('m-new', function () { save.pro.c1 = false; startNight(0, 1); });
    on('m-cont', function () { var c = save.cur; if (CH_READY[c.ch]) startNight(c.n - 1, c.ch); else show('scr-nights'); });
    on('m-custom', function () { customOpen(); });
    on('cu-back', function () { show('scr-menu'); });
    on('cu-go', function () { customStart(); });
    on('pp-ans', function () { ppAnswer(); });
    on('pp-skip', function () { ppEnd(true); });
    on('pp-end', function () { ppHangUp(); });
    on('m-nights', function () { renderNights(); show('scr-nights'); });
    on('m-settings', function () { settingsFrom = 'scr-menu'; show('scr-settings'); });
    on('m-credits', function () { show('scr-credits'); });
    on('m-quit', function () {   // Exit Game: really leave. A browser tab cannot be closed by a page, so: close if allowed, else drop back out of the game
      store(); stopMenu(); stopAll(); try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
      try { window.close(); } catch (e) {}
      setTimeout(function () {
        if (window.closed) return;
        try { if (/itch\.(zone|io)|hwcdn/.test(location.hostname) && window.top !== window) { window.top.location.href = 'https://straw0127.itch.io/alas-sais'; return; } } catch (e) {}
        $('load-go').style.visibility = 'visible'; show('scr-load');   // back to the PLAY screen, nothing running
      }, 150);
    });
    on('exit-back', function () { toMenu(); });
    on('n-back', function () { show('scr-menu'); });
    on('c-back', function () { show('scr-menu'); });
    on('s-back', function () { store(); show(settingsFrom); });
    on('intro-go', function () { stopAll(); goFull(); beginNight(); });
    on('pauseBtn', function () { pause(true); });
    on('p-resume', function () { pause(false); });
    on('p-restart', function () { paused = false; if (AC) AC.resume(); startNight(nightIdx, curCh); });
    on('p-settings', function () { settingsFrom = 'scr-pause'; show('scr-settings'); });
    on('p-menu', function () { cleanupScene(); paused = false; if (AC) AC.resume(); stopAll(); game = null; if (raf) cancelAnimationFrame(raf); toMenu(); });
    on('pz-leave', function () { puzzleClose(); });
    on('w-next', function () { if (customRun) { customOpen(); return; } startNight(Math.min(CH_NIGHTS[curCh] - 1, nightIdx + 1), curCh); });
    on('w-menu', function () { toMenu(); });
    on('o-retry', function () { if (customRun) { customStart(); return; } startNight(nightIdx, curCh); });
    on('o-menu', function () { stopAll(); toMenu(); });
    on('e-menu', function () { toMenu(); });
    on('s-full', function () { if (document.fullscreenElement) { try { document.exitFullscreen(); } catch (e) {} } else goFull(); });
    on('t-red', function () { save.set.reduced = !save.set.reduced; renderSettings(); store(); });
    $('v-sens').addEventListener('input', function (e) { save.set.sens = e.target.value / 100; $('vl-sens').textContent = e.target.value + '%'; }); $('v-sens').addEventListener('change', function () { store(); });
    on('t-mot', function () { save.set.motion = !save.set.motion; renderSettings(); store(); });
    on('rot-ok', function () { rotateDismissed = true; fit(); });
    document.querySelectorAll('.langbtn').forEach(function (b) { b.addEventListener('click', function () { save.set.lang = b.getAttribute('data-lang'); store(); renderTexts(); if (game) { hotSig = ''; buildHot(); } }); });
    document.querySelectorAll('[data-gfx]').forEach(function (b) { b.addEventListener('click', function () { save.set.gfx = b.getAttribute('data-gfx'); store(); renderSettings(); if (game) { lastView = ''; setView(true, true); } if ($('scr-menu').classList.contains('on')) toMenu(); }); });
    ['master', 'sfx', 'amb', 'music'].forEach(function (k) { $('v-' + k).addEventListener('input', function (e) { save.set.vol[k] = e.target.value / 100; $('vl-' + k).textContent = e.target.value; applyVolumes(); }); $('v-' + k).addEventListener('change', store); });
    // room map
    $('ph-ans').addEventListener('click', function (e) { e.preventDefault(); answerCall(); });
    $('ph-dec').addEventListener('click', function (e) { e.preventDefault(); endCall(); });
    $('runBtn').addEventListener('click', function (e) { e.preventDefault(); act('run'); });
    // keyboard
    var keyRoom = { '1': 'bedroom', '2': 'hall', '3': 'living', '4': 'kitchen', '5': 'curtain' };
    window.addEventListener('keydown', function (e) {
      if (e.repeat) return;
      if (e.key === 'Escape') { if (game) pause(!paused); return; }
      if (!game || paused) return;
      if (call && call.state === 'ring') { if (e.key === 'Enter' || e.key === ' ') answerCall(); return; }
      var k = e.key.toLowerCase();
      if (isC1()) {
        var P = game.p;
        if (e.key === '1') c1Go('door'); if (e.key === '2') c1Go('window'); if (e.key === '3') c1Go('cabinet');
        if (k === 's') { if (P.pos === 'bed') act('unhide'); else c1Go('center'); }
        if (k === 'h') act(P.pos === 'bed' ? 'unhide' : 'hide');
        if (k === 'e' && P.pos === 'window') act('curtain');
        if (k === 'f') { heldKeys.f = true; doHold('light', true); }
        if (k === ' ') { e.preventDefault(); var h1 = P.pos === 'door' ? 'door' : P.pos === 'window' && !game.house.curtain ? 'curtain' : P.pos === 'bed' ? 'breath' : P.pos === 'cabinet' ? 'light' : null; if (h1) doHold(h1, true); heldKeys.space = h1; }
        return;
      }
      if (keyRoom[e.key]) go(keyRoom[e.key]);
      if (k === 'r') act('run'); if (k === 'h') act('hide'); if (k === 'e') primary();
      if (k === 't') act('tv'); if (k === 'l') act('lights'); if (k === 'q') act('salt'); if (k === 'b') act('breaker');
      if (k === 'f') { heldKeys.f = true; doHold('light', true); }
      if (k === ' ') { e.preventDefault(); var hn = holdName(); if (hn) doHold(hn, true); heldKeys.space = hn; }
    });
    window.addEventListener('keyup', function (e) {
      if (!game) return; var k = e.key.toLowerCase();
      if (k === 'f') { heldKeys.f = false; doHold('light', false); }
      if (k === ' ' && heldKeys.space) { doHold(heldKeys.space, false); heldKeys.space = null; }
    });
    // stop all holds if the finger leaves the screen anywhere
    var fingers = 0;
    window.addEventListener('pointerdown', function () { fingers++; }, true);
    var up = function () { fingers = Math.max(0, fingers - 1); if (fingers === 0 && game && !heldKeys.space) { var any = game.p.holdDoor || game.p.holdBreath || game.p.holdCurtain || (game.p.light && !heldKeys.f && !lightLatch); if (any) { releaseHolds(); document.querySelectorAll('.btn.down').forEach(function (b) { b.classList.remove('down'); }); } } };
    window.addEventListener('pointerup', up, true); window.addEventListener('pointercancel', up, true);
    window.addEventListener('blur', function () { if (game) ['door', 'breath', 'curtain', 'light'].forEach(function (h) { game.hold(h, false); }); stopBreath(); });
  }
  function primary() { var g = game, r = g.p.room; if (r === 'bedroom') act('door'); else if (r === 'living') act(g.house.tv ? 'tv' : 'lights'); else if (r === 'curtain') act('curtain'); else if (r === 'kitchen') act(g.house.power ? 'hide' : 'breaker'); }
  function holdName() { var g = game, r = g.p.room; if (g.p.hidden === 'bed') return 'breath'; if (r === 'bedroom' && g.house.door) return 'door'; if (r === 'curtain' && !g.house.curtain) return 'curtain'; return null; }

  // ------------------------------------------------------------ boot
  window.addEventListener('DOMContentLoaded', function () {
    fit(); makeGrain(); wire(); renderTexts(); show('scr-load');
    loadAll(function (p) { $('load-i').style.width = Math.round(p * 100) + '%'; }).then(function () {
      $('load-go').style.visibility = 'visible'; $('load-msg').textContent = T('tap_start');
    });
    window.__AS_UI = { get game() { return game; }, get call() { return call; }, get pp() { return pp; }, get pz() { return pz; }, toMenu: toMenu, save: save, startNight: startNight, beginNight: beginNight, act: act, go: go, hold: doHold, show: show, answer: answerCall, hang: endCall, pan: pan };
  });
})();
