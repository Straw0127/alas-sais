/* ALAS-SAIS — UI, audio, input and screens */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  // preload only what Chapter 1 and the menu need (the house rooms load when Chapter 2 opens)
  var IMG = ['hero_kumot', 'hero_silip', 'menu_bed_off', 'menu_bed_off_lit', 'menu_morning'];
  var SFX = ['amb_house', 'amb_garden', 'amb_menu', 'rain_heavy', 'heartbeat', 'bell_6am', 'rooster_dawn', 'tuko_gecko', 'dog_howl', 'tricycle_far', 'distant_scream',
    'fluorescent_hum', 'scuffs_far', 'scuffs_near', 'wheeze', 'lullaby_hum', 'handle_rattle', 'static_swell', 'vhs_glitch', 'giggle', 'baby_cry', 'clinks', 'sniff', 'knife_taps',
    'nail_taps', 'steps_walk_wood', 'steps_run_wood', 'steps_walk_cement', 'breath_hold_gasp', 'door_creak', 'door_slam', 'cabinet_open', 'cabinet_close', 'curtain_rings',
    'plastic_crinkle', 'kulambo_rustle', 'light_switch', 'flashlight_click', 'tv_static', 'power_down', 'breaker', 'phone_text',
    'jumpscare_kumot', 'jumpscare_malikmata', 'jumpscare_kalansing', 'jumpscare_barang', 'jumpscare_silip',
    'door_open_slow', 'door_close_shut', 'door_push_strain', 'curtain_open_pull', 'curtain_close_pull', 'curtain_grip', 'hide_bed', 'unhide_bed',
    'hide_cabinet', 'hide_sofa', 'turn_whoosh', 'run_pant', 'nervous_breath', 'floor_creak', 'steps_run_cement', 'flashlight_on', 'salt_throw', 'tv_click_off',
    'ringtone', 'phone_pickup', 'phone_hangup', 'line_static',
    'wing_flap', 'wing_flap_far', 'wind_gust', 'beetles', 'beetle_scatter', 'aparador_creak', 'kumot_breath', 'theme_menu',
    'step_w1', 'step_w2', 'step_w3', 'step_c1', 'step_c2', 'step_c3'];
  IMG.push('c1_door_k3', 'c1_win_shadow2', 'c1_door_sw80', 'c1_door_sw62', 'c1_door_sw46', 'c1_door_sw32', 'c1_door_sw18', 'c1_hub', 'c1_hub_open', 'c1_hub_kumot', 'c1_hub_lit', 'c1_door_ajar', 'c1_peek_0', 'c1_peek_2', 'c1_peek_3', 'c1_door_closed', 'c1_win_closed', 'c1_win_shadow', 'c1_win_open',
    'c1_win_s1', 'c1_win_s2', 'c1_win_s3', 'hero_barang', 'c1_under', 'c1_under_kumot');
  for (var _i = 0; _i < 5; _i++) IMG.push('c1_cab_' + _i, 'c1_cab_' + _i + '_lit');
  var VOICE = [];
  function pad2(i) { return (i < 10 ? '0' : '') + i; }
  if (typeof CALLS !== 'undefined') Object.keys(CALLS).forEach(function (n) { CALLS[n].forEach(function (_, i) { VOICE.push(n + '_' + pad2(i)); }); });
  if (typeof PROLOGUE !== 'undefined') Object.keys(PROLOGUE).forEach(function (n) { PROLOGUE[n].forEach(function (_, i) { VOICE.push('pro_' + n + '_' + pad2(i)); }); });
  var WHO_IMG = { kumot: 'js_kumot_7', malik: 'js_malikmata_7', kal: 'js_kalansing_7', silip: 'js_silip_7', barang: 'js_barang_7' };
  var WHO_SFX = { kumot: 'jumpscare_kumot', malik: 'jumpscare_malikmata', kal: 'jumpscare_kalansing', silip: 'jumpscare_silip', barang: 'jumpscare_barang' };
  var WORDS = ['cont', 'new_game', 'chapters', 'custom_night', 'settings', 'credits', 'quit', 'resume', 'restart', 'main_menu'];
  var lightLatch = false;   // a flashlight switched on by double-tap stays on after the finger lifts
  var JS = { kumot: 'kumot', malik: 'malikmata', kal: 'kalansing', silip: 'silip', barang: 'barang' }, scareTimers = [];
  function preloadScares() { Object.keys(JS).forEach(function (w) { for (var f = 0; f < 8; f++) { var k = 'js_' + JS[w] + '_' + f; if (!imgs[k + IMGDIR()]) { var i = new Image(); i.src = IMGDIR() + k + '.jpg'; imgs[k + IMGDIR()] = i; } } }); }
  var HERO = { kumot: 'hero_kumot', malik: 'hero_malikmata', kal: 'hero_kalansing', silip: 'hero_silip', barang: 'hero_barang' };
  var C1_RULES = { 1: ['kumot'], 2: ['silip'], 3: ['barang'], 4: [], 5: [] };
  var C2_RULES = { 1: ['malik', 'silip'], 2: ['kal'], 3: [], 4: [], 5: [] };
  var C3_RULES = { 1: ['kumot', 'malik', 'barang'], 2: ['kal', 'silip'], 3: [], 4: [], 5: [], 6: [], 7: [] };

  // ------------------------------------------------------------ save / settings
  var DEF = { lang: 'en', gfx: 'medium', vol: { master: 0.9, sfx: 1, amb: 0.8, music: 0.6 }, captions: true, reduced: false, motion: undefined };
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
  function IMGDIR() { return save.set.gfx === 'low' ? 'assets/img_lo/' : 'assets/img/'; }
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
  function fit() {
    var w = window.innerWidth, h = window.innerHeight, s = Math.min(w / 1280, h / 720); stageScale = s;
    var st = $('stage'); st.style.transform = 'scale(' + s + ')';
    st.style.left = ((w - 1280 * s) / 2) + 'px'; st.style.top = ((h - 720 * s) / 2) + 'px';
    var portrait = h > w * 1.1;
    $('rotate').style.display = (portrait && game && !rotateDismissed) ? 'flex' : 'none';
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
    ['hubx_k3', 'hubx_s2c', 'hubx_s3c', 'hubx_s2o', 'hubx_s3o', 'hubx_b2', 'hubx_b3', 'hubx_b4'].forEach(function (k) { var i = new Image(); i.src = IMGDIR() + k + '.webp'; imgs[k] = i; });
    IMG.forEach(function (k) { jobs.push(new Promise(function (res) { var i = new Image(); i.onload = i.onerror = function () { tick(); res(); }; i.src = IMGDIR() + k + '.jpg'; imgs[k] = i; })); });
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
  function show(id) { ['scr-load', 'scr-menu', 'scr-settings', 'scr-nights', 'scr-custom', 'scr-credits', 'scr-phone', 'scr-intro', 'scr-pause', 'scr-win', 'scr-over', 'scr-end', 'scr-exit'].forEach(function (s) { $(s).classList.toggle('show', s === id); }); }
  var settingsFrom = 'scr-menu';

  function renderTexts() {
    document.documentElement.lang = save.set.lang === 'fil' ? 'fil' : 'en';
    document.querySelectorAll('[data-t]').forEach(function (el) { el.textContent = T(el.getAttribute('data-t')); });
    // menu words are Blender-rendered lettering (the text stays as the image's alt for screen readers)
    document.querySelectorAll('.mi [data-t], .mi[data-t]').forEach(function (el) {
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
    $('m-custom').querySelector('small').textContent = save.custom.unlocked ? '' : T('locked');
    $('m-custom').disabled = !save.custom.unlocked;
    document.querySelectorAll('.langbtn').forEach(function (b) { b.classList.toggle('cur', b.getAttribute('data-lang') === save.set.lang); });
    renderSettings(); renderNights();
  }
  function renderSettings() {
    var s = save.set;
    document.querySelectorAll('[data-gfx]').forEach(function (b) { b.classList.toggle('cur', b.getAttribute('data-gfx') === s.gfx); b.textContent = T(b.getAttribute('data-gfx')); });
    ['master', 'sfx', 'amb', 'music'].forEach(function (k) { $('v-' + k).value = Math.round(s.vol[k] * 100); $('vl-' + k).textContent = Math.round(s.vol[k] * 100); });
    $('t-red').textContent = s.reduced ? T('on') : T('off');
    $('t-mot').textContent = s.motion ? T('on') : T('off');
    $('s-code').value = saveCode();
    applyGfx();
  }
  var CH_NIGHTS = { 1: 5, 2: 5, 3: 7 }, CH_READY = { 1: true, 2: true, 3: true };
  function chUnlocked(ch) { return ch === 1 || (ch === 2 && save.prog.c1 >= 5) || (ch === 3 && save.prog.c1 >= 5 && save.prog.c2 >= 5); }
  function renderNights() {
    var box = $('night-list'); box.innerHTML = '';
    [1, 2, 3].forEach(function (ch) {
      var card = document.createElement('div'); card.className = 'chcard' + (chUnlocked(ch) && CH_READY[ch] ? '' : ' locked');
      var h = document.createElement('h3'); h.textContent = T('ch_n', ch).toUpperCase() + ' · ' + T('ch_names')[ch];
      var p = document.createElement('p'); p.textContent = T('ch_desc')[ch];
      var row = document.createElement('div'); row.className = 'chnights';
      card.appendChild(h); card.appendChild(p);
      if (!CH_READY[ch]) { var sm = document.createElement('p'); sm.textContent = chUnlocked(ch) ? T('soon') : T('locked'); sm.style.color = '#e0a24a'; card.appendChild(sm); }
      else {
        var cleared = save.prog['c' + ch];
        for (var i = 1; i <= CH_NIGHTS[ch]; i++) {
          var b = document.createElement('button'); b.type = 'button'; b.textContent = i;
          b.disabled = !chUnlocked(ch) || i > cleared + 1; if (i <= cleared) b.className = 'done';
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
    if (curCh === 3 && idx >= 2) { var f3 = document.createElement('p'); f3.className = 'sub'; f3.textContent = T(idx <= 4 ? 'c3_cut' : idx === 5 ? 'c3_dark' : 'c3_final'); rules.appendChild(f3); }
    else if (idx >= 3) { var f = document.createElement('p'); f.className = 'sub'; f.textContent = curCh === 1 ? (idx === 3 ? T('c1_all') : T('c1_final')) : curCh === 2 ? T(idx === 3 ? 'c2_n4' : 'c2_n5') : T('final_night'); rules.appendChild(f); }
    show('scr-intro');
    play('dog_howl', { bus: 'amb', vol: 0.5 });
  }
  var C2_IMG = ['hallway_empty', 'hallway_salatv', 'living_tvoff', 'living_empty', 'living_lights', 'living_lights_off_tv', 'living_malik', 'kitchen_empty', 'kitchen_kal',
    'cabinet_empty', 'cabinet_kal', 'curtain_closed', 'curtain_shadow', 'curtain_open', 'curtain_s1', 'curtain_s2', 'curtain_silip', 'curtain_glass'];
  var C3_LIT = ['c3_bed_c', 'c3_bed_closed_c', 'c3_bed_kumot_c', 'hallway_empty_c', 'hallway_kumot_c', 'living_tvoff_c', 'living_malik_c', 'kitchen_empty_c', 'kitchen_kal_c',
    'curtain_closed_c', 'curtain_shadow_c', 'curtain_open_c', 'curtain_s1_c', 'curtain_s2_c', 'curtain_silip_c', 'curtain_glass_c'];
  var C3_IMG = ['c3_bed', 'c3_bed_closed', 'c3_bed_kumot', 'hallway_kumot', 'c3_look', 'c3_look_tv', 'c3_look_k2', 'c3_look_k3', 'c3_bed_c', 'c3_bed_closed_c', 'c3_bed_kumot_c',
    'hallway_empty_c', 'hallway_kumot_c', 'living_tvoff_c', 'living_malik_c', 'kitchen_empty_c', 'kitchen_kal_c', 'cabinet_empty_c', 'cabinet_kal_c', 'curtain_closed_c', 'curtain_shadow_c',
    'curtain_open_c', 'curtain_s1_c', 'curtain_s2_c', 'curtain_silip_c', 'curtain_glass_c', 'c1_under', 'c1_under_kumot', 'c1_peek_0', 'c1_peek_2', 'c1_peek_3', 'hero_barang'];
  function beginNight() {
    if (curCh === 3) C2_IMG.concat(C3_IMG, C3_LIT.map(function (k) { return k + 'l'; })).forEach(function (k) { if (!imgs[k]) { var i = new Image(); i.src = IMGDIR() + k + '.jpg'; imgs[k] = i; } });
    if (curCh === 2) C2_IMG.forEach(function (k) { if (!imgs[k]) { var i = new Image(); i.src = IMGDIR() + k + '.jpg'; imgs[k] = i; } });
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
    setView(false); renderHUD();
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
        case 'cue': play(d.id, { room: d.room, vol: d.vol || 1, delay: d.delay || 0 }); if (d.cap) cap(d.cap); break;
        case 'travel': onTravel(d); break;
        case 'arrive': onArrive(d); break;
        case 'door_open':
          if (d.forced) { play('door_slam', { room: 'bedroom' }); play('door_creak', { room: 'bedroom', vol: 0.6, delay: 0.1 }); cap('kumot_enter'); if (here('bedroom')) doorAnim(false, 260); jolt(); }
          else { play('door_open_slow', { room: 'bedroom' }); if (here('bedroom')) doorAnim(false, 950); }
          break;
        case 'door_close': play('door_close_shut', { room: 'bedroom', vol: 0.9 }); if (here('bedroom')) doorAnim(true, 420); break;
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
  function onTravel(d) {
    var run = d.run, ms = d.t * 1000 / speed();
    var surf = d.to === 'kitchen' || d.to === 'living' || d.from === 'kitchen' || d.from === 'living';
    play('turn_whoosh', { vol: 0.5 });
    steps(Math.max(2, Math.round(ms / (run ? 230 : 330))), ms, surf ? 'cement' : 'wood', run);
    if (run) { if (runH) stop(runH, 0.1); runH = play('run_pant', { vol: 0.5 }); }
    releaseHolds(); buildHot();
    if (lowFx()) { black(1, Math.min(250, ms * 0.5)); return; }
    var n = Math.max(2, Math.round(ms / (run ? 230 : 330)));
    camAnim(bobFrames(n, run ? 2.5 : 2.0, run ? 14 : 9, run ? 1.1 : 0.6), ms, walkPt, 'linear');
    black(1, Math.min(260, ms * 0.35), Math.max(0, ms * 0.62));
  }
  function onArrive() {
    if (runH) { stop(runH, 1.2); runH = null; }
    camClear(); setView(true, true); buildHot();
    if (Math.random() < 0.35) play('floor_creak', { vol: 0.4 });
    black(0, 320);
    if (lowFx()) return;
    camAnim(bobFrames(2, 1, 7, 0.4, 1.28), 620, [50, 55], 'ease-out');
    if (game && game.p.room === 'hall' && game.night === 1 && !onArrive._hallHint) { onArrive._hallHint = 1; hint(T('h_light'), 4); }
  }
  // swing the bedroom door: a cut-out of the closed door rotating on its hinge
  var DOOR = { x: 516, y: 198, w: 169, h: 374 }, DOOR3 = { x: 402, y: 236, w: 158, h: 300 };
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
    leaf.style.cssText = 'left:' + R.x + 'px;top:' + R.y + 'px;width:' + R.w + 'px;height:' + R.h + 'px;background-image:url(assets/img/' + (c3 ? 'c3_bed_closed' + sfx : 'bedroom_closed') + '.jpg);background-position:-' + R.x + 'px -' + R.y + 'px';
    fx.appendChild(leaf);
    var open = 'rotateY(-78deg)', shut = 'rotateY(0deg)';
    // the room behind the leaf is the "open" picture during the swing
    viewLock = { key: closing ? (c3 ? 'c3_bed' + sfx : 'bedroom_empty') : viewKeyRaw(), until: performance.now() + ms };
    setView(true, true);
    var a = leaf.animate([{ transform: closing ? open : shut }, { transform: closing ? shut : open }], { duration: ms, easing: closing ? 'cubic-bezier(.5,0,.9,.6)' : 'cubic-bezier(.2,.6,.3,1)', fill: 'forwards' });
    a.onfinish = function () { viewLock = null; setView(true, true); fx.innerHTML = ''; if (closing) jolt(); };
    if (closing) camAnim([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], ms + 250, [47, 55]);
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
  function onHide(spot, inside) {
    var snd = { bed: inside ? 'hide_bed' : 'unhide_bed', cabinet: inside ? 'hide_cabinet' : 'cabinet_open', sofa: 'hide_sofa' }[spot];
    play(snd, { vol: 0.9 });
    releaseHolds();
    if (lowFx()) { setView(true, true); buildHot(); return; }
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
  function tvOffAnim() {
    if (!here('living') || lowFx()) return;
    var fx = $('fx'), c = document.createElement('div'); c.className = 'crt';
    c.style.cssText = 'left:494px;top:350px;width:174px;height:150px'; fx.appendChild(c);
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
  function viewKeyRaw() {
    if (isC1()) return c1Key();
    var g = game, p = g.p, H = g.house;
    if (p.travel) return lastKey || 'hallway_empty';
    if (g.chapter === 3) return c3Key();
    switch (p.room) {
      case 'bedroom':
        if (p.hidden === 'bed') return g.k.st === 4 ? 'under_kumot' : 'under_empty';
        if (!H.power && (g.k.st >= 3 && !H.door)) return 'bedroom_blackout';
        if (g.k.st === 4 || (g.k.st === 3 && !H.door)) return 'bedroom_kumot';
        return H.door ? 'bedroom_closed' : 'bedroom_empty';
      case 'hall': if (g.k.st === 2) return 'hallway_kumot'; return H.tv && H.power ? 'hallway_salatv' : 'hallway_empty';   // the TV's glow spills out of the living room door
      case 'living':
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
        if (p.hidden === 'bed') return g.k.st === 4 ? 'c1_under_kumot' : 'c1_under';
        if (g.k.st === 4) return 'c3_bed_kumot' + c;
        return (H.door ? 'c3_bed_closed' : 'c3_bed') + c;
      case 'hall': if (g.k.st === 2) return 'hallway_kumot' + c; return !g.dark && H.tv && H.power ? 'hallway_salatv' : 'hallway_empty' + c;
      case 'living':
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
    if (p.room === 'bedroom' && !p.travel && !p.hidden && g.k.st !== 4 && !(viewLock && performance.now() < viewLock.until)) {
      if (g.k.st === 3 && !H.door) keys.push('hubx_k3' + (g.dark ? 'n' : 'l'));
      if (g.b.st >= 2) keys.push('hubx_b' + Math.min(4, g.b.st) + n);
    }
    var sig = keys.join(','); if (sig === ovlSig) return; ovlSig = sig;
    var box = $('ovl'); box.innerHTML = '';
    keys.forEach(function (key) { var im = document.createElement('img'); im.className = 'bg'; im.alt = ''; im.src = IMGDIR() + key + '.webp'; box.appendChild(im); });
  }
  function viewKey() { if (viewLock && performance.now() < viewLock.until) return viewLock.key; return viewKeyRaw(); }
  function setView(force, instant) {
    var g = game; if (!g) return;
    var key = viewKey();
    var dark = !g.house.power && !g.dark && g.p.room !== 'curtain' && !(g.chapter === 1 && g.p.pos === 'window');
    var sofa = g.p.hidden === 'sofa' && !(viewLock && performance.now() < viewLock.until);
    var sig = key + '|' + dark + '|' + sofa;
    if (sig !== lastView || force) {
      var back = front === 'bgA' ? 'bgB' : 'bgA';
      var b = $(back), f = $(front);
      b.classList.toggle('now', !!instant); f.classList.toggle('now', !!instant);
      if (b.getAttribute('data-k') !== key) { b.src = IMGDIR() + key + '.jpg'; b.setAttribute('data-k', key); }
      b.style.filter = dark && key.indexOf('menu_') !== 0 ? 'brightness(.32) saturate(.6)' : (sofa ? 'brightness(.55)' : 'brightness(1.05)');
      b.style.transform = sofa ? 'scale(1.35) translateY(-6%)' : 'none';
      b.style.opacity = 1; f.style.opacity = 0; front = back; lastView = sig; lastKey = key;
    }
    // the beam reveals the flashlight-lit render underneath the finger
    var lk = isC1() ? c1LitKey() : null, li = $('litImg');
    // brownout nights: the torch brightens whatever is under the beam (the candle renders are too dark to just "reveal")
    var torch3 = !isC1() && g.p.light && (g.dark || !g.house.power) && !g.p.travel;
    var litOK = torch3 && g.dark && /_c$/.test(key) && key.indexOf('cabinet') < 0;
    if (torch3) lk = litOK ? key + 'l' : key;   // candle nights: the same view lit by the torch (rendered), revealed under the beam
    li.style.filter = torch3 && g.dark && !litOK ? 'brightness(4.2) saturate(.75) contrast(1.05)' : '';
    if (lk) {
      if (li.getAttribute('data-k') !== lk) { li.src = IMGDIR() + lk + '.jpg'; li.setAttribute('data-k', lk); }
      var m = 'radial-gradient(circle at ' + beam[0] + 'px ' + beam[1] + 'px, #000 0, #000 120px, rgba(0,0,0,.6) 190px, transparent 280px)';
      li.style.webkitMaskImage = li.style.maskImage = m; li.style.opacity = 1;
    } else li.style.opacity = 0;
    if (pz && (!game || game.over || game.p.room !== 'kitchen' || game.p.travel || game.house.power)) puzzleClose();
    if (isC1()) c1Overlays(); else if (game.chapter === 3) c3Overlays(); else if (ovlSig) { ovlSig = ''; $('ovl').innerHTML = ''; }
    // flashlight beam follows the finger
    var dk = $('dark'), lit = g.p.light;
    var needDark = dark || (g.p.room === 'curtain' && g.house.curtain) || g.p.room === 'hall' && !g.house.power || (isC1() && g.p.pos === 'cabinet');
    var bx = beam[0], by = beam[1];
    if (needDark) {
      dk.style.opacity = 1;
      dk.style.background = lit ? 'radial-gradient(circle at ' + bx + 'px ' + by + 'px, rgba(255,244,220,.06) 0, rgba(0,0,0,0) 170px, rgba(0,0,0,.45) 280px, rgba(0,0,0,.9) 470px)' : (dark ? 'rgba(0,0,0,.62)' : 'rgba(0,0,0,.35)');
    } else if (lit) { dk.style.opacity = 1; dk.style.background = 'radial-gradient(circle at ' + bx + 'px ' + by + 'px, rgba(255,240,210,.16) 0, rgba(255,240,210,.06) 170px, rgba(0,0,0,.25) 420px)'; }
    else dk.style.opacity = 0;
    $('fog').style.opacity = (!isC1() && g.p.room === 'curtain' && !g.house.curtain && g.s.st === 4 && !g.p.travel) ? 1 : 0;
    $('grain').style.backgroundPosition = (Math.random() * 160 | 0) + 'px ' + (Math.random() * 160 | 0) + 'px';
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
    $('batt-i').style.width = Math.max(0, g.p.battery) + '%';
    $('salt').style.display = !isC1() && g.night >= 3 ? 'flex' : 'none';
    $('salt-n').textContent = g.p.salt || 0;
    var rb = $('runBtn'), rt = g.p.run ? T('run_on') : T('run_off'); if (rb.textContent !== rt) rb.textContent = rt; rb.classList.toggle('cur', g.p.run);
    var bm = $('breathMeter');
    if (g.p.holdBreath) { bm.style.opacity = 1; var pct = g.p.breath / (g.p.breathMax || 8) * 100; bm.style.background = 'conic-gradient(#e9dfcb ' + pct + '%, rgba(255,255,255,.08) 0)'; bm.style.mask = bm.style.webkitMask = 'radial-gradient(circle, transparent 50px, #000 52px)'; }
    else bm.style.opacity = 0;
  }

  // ------------------------------------------------------------ hotspots: tap things in the room itself
  function doHold(name, on) {
    if (!game) return;
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
  function act(a, arg) { if (!game || game.over || paused || (call && call.state === 'ring')) return; game.act(a, arg); handleEvents(); renderHUD(); }
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
  function spots() {
    if (isC1()) return c1Spots();
    var g = game, p = g.p, H = g.house, r = p.room, S = [];
    var exit = { id: 'exit', x: 28, y: 86, w: 44, h: 14, cls: 'exit', label: '▼  ' + T('go_hall').toUpperCase(), tap: function () { go('hall', [50, 100]); } };
    var out = { id: 'exit', x: 28, y: 86, w: 44, h: 14, cls: 'exit', label: '▲  ' + T('a_unhide').toUpperCase(), tap: function () { act('hide'); } };
    if (r === 'bedroom' && g.chapter === 3) {
      if (p.hidden) S.push(out);
      else {
        if (H.door) S.push({ id: 'door', x: 30, y: 33, w: 14, h: 46, cls: 'hold', label: T('a_hold_door'), hold: 'door', dbl: function () { act('door'); }, hintTap: 'h_door' });
        else {
          S.push({ id: 'door', x: 30, y: 33, w: 14, h: 46, label: T('a_door_close'), tap: function () { act('door'); } });
          S.push({ id: 'look', x: 30, y: 12, w: 14, h: 20, label: T('a_look'), tap: function () { c3Look(); } });
        }
        S.push({ id: 'bed', x: 0, y: 66, w: 25, h: 34, label: T('a_hide_bed'), tap: function () { act('hide'); } });
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
        if (H.tv) S.push({ id: 'tv', x: 37, y: 46, w: 19, h: 27, label: T('a_tv'), tap: function () { act('tv'); } });
        S.push({ id: 'switch', x: 55, y: 34, w: 11, h: 20, cls: H.power ? '' : 'off', label: T(H.lights ? 'a_lights_off' : 'a_lights_on'), tap: function () { act('lights'); } });
        S.push({ id: 'sofa', x: 0, y: 70, w: 27, h: 30, label: T('a_hide_sofa'), tap: function () { act('hide'); } });
        S.push(exit);
      }
    } else if (r === 'kitchen') {
      if (p.hidden) {
        if (g.saltOK && p.salt > 0) S.push({ id: 'salt', x: 38, y: 30, w: 24, h: 30, label: T('a_salt', p.salt), tap: function () { act('salt'); } });
        S.push(out);
      } else {
        S.push({ id: 'cabinet', x: g.chapter >= 2 ? 0 : 9, y: g.chapter >= 2 ? 24 : 60, w: g.chapter >= 2 ? 9 : 46, h: g.chapter >= 2 ? 62 : 25, label: T('a_hide_cab'), tap: function () { act('hide'); } });
        if (g.saltOK) S.push({ id: 'salt', x: 24, y: 42, w: 11, h: 16, cls: p.salt > 0 ? '' : 'off', label: T('a_salt', p.salt), tap: function () { act('salt'); } });
        if (!H.power && !g.dark) S.push({ id: 'breaker', x: 84, y: 20, w: 15, h: 20, cls: 'urgent', label: T('a_breaker'), tap: function () { if (g.chapter >= 2) puzzleOpen(); else act('breaker'); } });
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
  function toStage(e) { var r = $('stage').getBoundingClientRect(); return [(e.clientX - r.left) / stageScale, (e.clientY - r.top) / stageScale]; }
  function bindSpot(el, s) {
    var down = false, held = false, timer = 0;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault(); e.stopPropagation(); try { el.setPointerCapture(e.pointerId); } catch (x) {}
      down = true; held = false; el.classList.add('press');
      if (s.gesture) beam = toStage(e);
      if (s.hold) timer = setTimeout(function () { if (down) { held = true; el.classList.add('down'); if (s.preHold) s.preHold(); doHold(s.hold, true); } }, s.gesture ? 210 : 130);
    });
    var up = function () {
      el.classList.remove('press');
      if (!down) return; down = false; clearTimeout(timer);
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
    var sig = (p.room || p.pos) + p.hidden + S.map(function (s) { return s.id + s.label + (s.cls || ''); }).join('|') + lightAllowed();
    if (sig === hotSig) return;
    hotSig = sig; releaseHolds(); box.innerHTML = '';
    box.classList.toggle('c1', isC1());   // Chapter 1 teaches the controls: its names and hints stay visible
    box.classList.add('reveal'); clearTimeout(box._rv); box._rv = setTimeout(function () { box.classList.remove('reveal'); }, 1400);
    box.classList.toggle('dim', g.night >= 3);
    // background: hold for flashlight (dark places) or breath (under the bed)
    var bg = document.createElement('div'); bg.id = 'hotbg'; box.appendChild(bg);
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
      bindSpot(el, s); box.appendChild(el);
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
  var C1PT = { door: [37, 55], window: [81, 45], cabinet: [62, 55], bed: [12, 86] };   // where each spot sits in the hub picture (%)
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
      case 'bed': return k.st === 4 && k.search > 0 ? 'c1_under_kumot' : 'c1_under';
    }
    if (k.st === 4) return 'c1_hub_kumot';
    if (!H.power && !H.curtain) return 'menu_bed_off';   // brownout: only the moon through the curtain
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
    var sig = keys.join(','); if (sig === ovlSig) return; ovlSig = sig;
    var box = $('ovl'); box.innerHTML = '';
    keys.forEach(function (key) { var im = document.createElement('img'); im.className = 'bg'; im.alt = ''; im.src = IMGDIR() + key + '.webp'; box.appendChild(im); });
  }
  function c1LitKey() {   // the flashlight-lit render that the beam reveals
    var p = game.p; if (!p.light || p.travel) return null;
    if (p.pos === 'cabinet') return 'c1_cab_' + game.b.st + '_lit';
    if (p.pos === 'center' && !game.house.curtain && game.k.st !== 4) return game.house.power ? 'c1_hub_lit' : 'menu_bed_off_lit';
    return null;
  }
  function c1Spots() {
    var g = game, p = g.p, H = g.house, S = [];
    var back = { id: 'back', x: 36, y: 86, w: 28, h: 14, cls: 'exit', label: T('s_back').toUpperCase(), tap: function () { c1Go('center'); } };
    var lightToggle = function () { if (!game) return; var on = !game.p.light; doHold('light', on); lightLatch = on && game.p.light; };
    switch (p.pos) {
      case 'center':
        S.push({ id: 'door', x: 31, y: 35, w: 12, h: 42, label: T('s_door'), tap: function () { c1Go('door'); } });
        S.push({ id: 'cabinet', x: 55, y: 34, w: 11, h: 46, label: T('s_cabinet'), tap: function () { c1Go('cabinet'); } });
        S.push({ id: 'curtain', x: 68, y: 16, w: 27, h: 62, label: T('s_window'), tap: function () { c1Go('window'); } });
        S.push({ id: 'bed', x: 0, y: 66, w: 25, h: 34, label: T('s_bed'), tap: function () { act('hide'); } });
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
    var ms = d.t * 1000 / speed();
    releaseHolds(); buildHot();
    if (d.hide || d.unhide) { onHide('bed', !!d.hide); return; }
    var n = Math.max(1, Math.round(ms / 300)); steps(n, ms, 'wood', false);
    if (lowFx()) { black(1, Math.min(180, ms * 0.5)); return; }
    if (d.from === 'center') {   // walk toward the spot in the hub picture
      camAnim(bobFrames(n, 1.9, 8, 0.5), ms, C1PT[d.to], 'ease-in');
      black(0.85, Math.min(200, ms * 0.4), ms * 0.6);
    } else {                     // step back from the spot: the spot view slides back and darkens
      camAnim([{ transform: 'scale(1) translateY(0)' }, { transform: 'scale(1.06) translateY(10px)', offset: 0.5 }, { transform: 'scale(0.98) translateY(4px)' }], ms, [50, 60], 'ease-in');
      black(0.85, Math.min(200, ms * 0.4), ms * 0.55);
    }
  }
  function c1Arrive(d) {
    camClear(); setView(true, true); buildHot(); black(0, 260);
    if (lowFx()) return;
    if (d.to === 'center' && C1PT[d.from]) camAnim([{ transform: 'scale(1.7)' }, { transform: 'scale(1.0)' }], 520, C1PT[d.from], 'cubic-bezier(.2,.7,.3,1)');   // pulled back out of that corner
    else camAnim(bobFrames(1, 1, 5, 0.3, 1.18), 480, [50, 55], 'ease-out');
    if (Math.random() < 0.25) play('floor_creak', { vol: 0.3 });
  }
  function c1Events(e) {
    var d = e.data;
    switch (e.type) {
      case 'cue': play(d.id, { room: d.room, vol: d.vol || 1, delay: d.delay || 0 }); break;
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
    // her breathing: only audible when you are at the door (that is the listening mechanic)
    if (g.k.on && !amb.kbreath) amb.kbreath = play('kumot_breath', { bus: 'amb', loop: true, vol: 0 });
    if (amb.kbreath) setLoopVol(amb.kbreath, g.k.st === 3 && pos === 'door' && !p.travel ? (p.holdDoor ? 0.6 : 0.9) : 0);
  }
  // the door swinging shut (or back open) in three pre-rendered frames, then the held/ajar view
  var swing = null;
  function c1Swing(close) {
    var all = ['c1_door_sw80', 'c1_door_sw62', 'c1_door_sw46', 'c1_door_sw32', 'c1_door_sw18'], seq = close ? all : all.slice().reverse(), start = 0;
    if (swing) { clearTimeout(swing.to); var cur = swing.seq[swing.i]; start = Math.max(0, seq.indexOf(cur)); }
    swing = { seq: seq, i: start, close: close };
    play(close ? 'door_creak' : 'door_creak', { vol: close ? 0.4 : 0.3 });
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
    var ph = $('phone'); ph.className = 'pe show ring';
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
    var ph = $('phone'); ph.className = 'pe show talk'; $('ph-state').textContent = T('ph_live'); $('ph-dec').textContent = T('ph_mute');
    lastT = performance.now(); hotSig = ''; buildHot();
  }
  function endCall(silent) {
    if (!call) return;
    var c = call; call = null;
    if (c.ring) stop(c.ring, 0.05); if (c.static) stop(c.static, 0.2); if (c.voice) stop(c.voice, 0.08);
    if (!silent) play('phone_hangup', { vol: 0.6 });
    $('sub').classList.remove('show');
    var ph = $('phone'); $('ph-state').textContent = T('ph_ended');
    setTimeout(function () { ph.className = 'pe'; }, silent ? 0 : 900);
    if (game) { game.quiet = false; }
    lastT = performance.now(); hotSig = ''; buildHot();
    document.querySelectorAll('.spot.focus').forEach(function (s) { s.classList.remove('focus'); });
  }
  function callTick(dt) {
    if (!call || call.state !== 'talk') return;
    call.t += dt; var s = Math.floor(call.t); $('ph-time').textContent = '0' + Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
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
  function cleanupScene() { endCall(true); releaseHolds(); camClear(); viewLock = null; $('fx').innerHTML = ''; $('hot').innerHTML = ''; hotSig = 'none'; black(0, 10); if (runH) { stop(runH); runH = null; } }
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
    // the jumpscare: frames 0-1 it is simply there, 2-7 it lunges (the scream lands with frame 2), then it shudders in your face
    var sc = $('scare'), im = $('scare-img'), base = IMGDIR() + 'js_' + JS[who] + '_';
    if (!sc.querySelector('.redout')) { var ro = document.createElement('div'); ro.className = 'redout'; sc.appendChild(ro); }
    var soft = !!save.set.reduced, still = lowFx();
    sc.style.display = 'block'; sc.className = 'anim'; im.src = base + '0.jpg';
    play(WHO_SFX[who], { vol: soft ? 0.45 : 1 });
    var T0 = [0, 170, 350, 395, 440, 485, 530, 575];
    scareTimers.forEach(clearTimeout); scareTimers = [];
    T0.forEach(function (t, f) { scareTimers.push(setTimeout(function () { im.src = base + f + '.jpg'; }, t)); });
    scareTimers.push(setTimeout(function () {
      if (!soft) {
        if (!still) sc.classList.add('hit'); if (save.set.gfx !== 'low') sc.classList.add('split');
        var fl = $('flash'); fl.style.transition = 'none'; fl.style.opacity = 0.8; setTimeout(function () { fl.style.transition = 'opacity .35s'; fl.style.opacity = 0; }, 60);
        if (navigator.vibrate) try { navigator.vibrate([90, 30, 140, 30, 220]); } catch (e) {}
      }
    }, 350));
    for (var tj = 640, alt = 0; tj < 1500; tj += 70, alt++) (function (t, a) { scareTimers.push(setTimeout(function () { im.src = base + (a % 2 ? 7 : 6) + '.jpg'; }, t)); })(tj, alt);
    scareTimers.push(setTimeout(function () { im.src = base + '7.jpg'; sc.classList.remove('hit'); }, 1500));
    $('over-who').textContent = T('who')[who];
    $('over-hint').textContent = (isC1() ? T('c1_hint') : T('hint'))[who] || T('c1_hint')[who] || '';
    if (who === 'barang') play('beetle_scatter', { vol: 1 });
    var c = game.clock(); $('over-time').textContent = (isC1() ? T('ch_n', 1) + ' · ' : '') + T('night_n', game.night) + ' · ' + c.h + ':' + (c.m < 10 ? '0' : '') + c.m + ' AM';
    $('over-bg').src = IMGDIR() + 'js_' + JS[who] + '_7.jpg';
    game = null;
    setTimeout(function () { sc.style.display = 'none'; sc.className = ''; show('scr-over'); play('amb_menu', { bus: 'music', loop: true, vol: 0.5 }); }, 1800);
  }

  // ------------------------------------------------------------ main menu: the room you have reached, its light failing
  var menuRaf = 0, menuMusic = null, menuAmb = null, menuMode = null;
  function menuScene() {
    var P = save.prog;
    if (P.c1 >= 5 && P.c2 >= 5 && P.c3 >= 7) return { on: 'menu_morning', mode: 'day' };
    if (P.c1 < 5) return P.c1 + 1 === 5 ? { on: 'menu_bed_off', lit: 'menu_bed_off_lit', mode: 'torch' } : { on: 'c1_hub', off: 'menu_bed_off', mode: 'blink' };
    if (P.c2 < 5) return P.c2 + 1 === 5 ? { on: 'menu_hall_off', lit: 'menu_hall_off_lit', mode: 'torch' } : { on: 'hallway_empty', off: 'menu_hall_off', mode: 'blink' };
    return P.c3 + 1 >= 5 ? { on: 'living_tvoff', lit: 'menu_living_off_lit', mode: 'torch' } : { on: 'living_lights_off_tv', off: 'living_tvoff', mode: 'blink' };
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
      $('pp-bg').src = IMGDIR() + (key === 'c1' ? 'c1_hub' : 'hallway_empty') + '.jpg';
      $('pp-phone').className = 'pp-phone ring'; $('pp-state').textContent = T('ph_calling'); $('pp-time').textContent = '';
      $('pp-sub').style.opacity = 0; $('pp-sub').innerHTML = '';
      show('scr-phone');
      pp.ring = play('ringtone', { loop: true, vol: 0.3 });
      pp.room = play('amb_house', { bus: 'amb', loop: true, vol: 0.35 });
      var last = performance.now();
      (function tick(now) {
        if (!pp) return; pp.raf = requestAnimationFrame(tick);
        var dt = Math.min(0.1, (now - last) / 1000); last = now;
        if (!pp.talking) return;
        pp.t += dt; var s = Math.floor(pp.t); $('pp-time').textContent = '0' + Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
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
    $('pp-phone').className = 'pp-phone talking'; $('pp-state').textContent = T('ph_live');
  }
  function ppEnd(skipped) {
    if (!pp) return; var p_ = pp; pp = null;
    cancelAnimationFrame(p_.raf); stop(p_.ring, 0.05); stop(p_.static, 0.2); stop(p_.voice, 0.1); stop(p_.room, 0.5);
    if (!skipped) { play('static_swell', { vol: 0.5 }); play('phone_hangup', { vol: 0.6, delay: 0.6 }); $('pp-state').textContent = T('ph_ended'); }
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
    on('load-go', function () { initAudio().then(function () { goFull(); toMenu(); }); });
    on('m-new', function () { save.pro.c1 = false; startNight(0, 1); });
    on('m-cont', function () { var c = save.cur; if (CH_READY[c.ch]) startNight(c.n - 1, c.ch); else show('scr-nights'); });
    on('m-custom', function () { customOpen(); });
    on('cu-back', function () { show('scr-menu'); });
    on('cu-go', function () { customStart(); });
    on('pp-ans', function () { ppAnswer(); });
    on('pp-skip', function () { ppEnd(true); });
    on('m-nights', function () { show('scr-nights'); });
    on('m-settings', function () { settingsFrom = 'scr-menu'; show('scr-settings'); });
    on('m-credits', function () { show('scr-credits'); });
    on('m-quit', function () { stopAll(); try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {} show('scr-exit'); });
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
    on('t-mot', function () { save.set.motion = !save.set.motion; renderSettings(); store(); });
    on('s-copy', function () {
      var c = $('s-code'); c.value = saveCode(); c.select();
      var done = function () { $('s-code-msg').textContent = T('code_copied'); };
      try { if (navigator.clipboard) navigator.clipboard.writeText(c.value).then(done, function () { document.execCommand('copy'); done(); }); else { document.execCommand('copy'); done(); } } catch (e) {}
    });
    on('s-load', function () { var ok = loadCode($('s-code').value); $('s-code-msg').textContent = T(ok ? 'code_ok' : 'code_bad'); if (ok) renderTexts(); });
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
    window.__AS_UI = { get game() { return game; }, get call() { return call; }, get pp() { return pp; }, get pz() { return pz; }, toMenu: toMenu, save: save, startNight: startNight, beginNight: beginNight, act: act, go: go, hold: doHold, show: show, answer: answerCall, hang: endCall };
  });
})();
