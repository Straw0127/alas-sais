/* ALAS-SAIS — core game logic. Pure: no DOM. Shared by the game and the headless tests. */
var AS = (function () {
  'use strict';

  var NIGHTS = [
    { hourSec: 45, lv: { kumot: [3, 6], malik: [0, 0], kal: [0, 0], silip: [0, 0] }, blackouts: 0 },
    { hourSec: 50, lv: { kumot: [5, 8], malik: [4, 7], kal: [0, 0], silip: [0, 0] }, blackouts: 0 },
    { hourSec: 55, lv: { kumot: [6, 9], malik: [5, 8], kal: [3, 6], silip: [0, 0] }, blackouts: 1 },
    { hourSec: 58, lv: { kumot: [7, 10], malik: [6, 9], kal: [5, 8], silip: [3, 6] }, blackouts: 2 },
    { hourSec: 60, lv: { kumot: [10, 14], malik: [9, 13], kal: [8, 12], silip: [6, 11] }, blackouts: 3 }
  ];
  // Chapter 2: the bedroom is off-limits; Malikmata (living room), Kalansing (kitchen) and Silip (the hall curtain).
  // ~4-minute nights. Nights 4-5: someone cuts the power from the living room side (fixed at the breaker with a memory puzzle).
  var NIGHTS2 = [
    { hourSec: 40, lv: { kumot: [0, 0], malik: [4, 7], kal: [0, 0], silip: [3, 5] }, blackouts: 0 },
    { hourSec: 40, lv: { kumot: [0, 0], malik: [5, 8], kal: [4, 7], silip: [4, 6] }, blackouts: 0 },
    { hourSec: 40, lv: { kumot: [0, 0], malik: [7, 10], kal: [6, 9], silip: [6, 9] }, blackouts: 0 },
    { hourSec: 40, lv: { kumot: [0, 0], malik: [7, 10], kal: [6, 9], silip: [6, 9] }, blackouts: 1 },
    { hourSec: 40, lv: { kumot: [0, 0], malik: [9, 13], kal: [8, 12], silip: [8, 12] }, blackouts: 2 }
  ];
  // Chapter 3: the whole house, five entities, 7 nights. Nights 3-5: the power is cut (breaker puzzle).
  // Nights 6-7: a real brownout all night, three candles, the flashlight is all you have; the nightmare versions.
  var NIGHTS3 = [
    { hourSec: 40, lv: { kumot: [4, 6], malik: [3, 5], kal: [0, 0], silip: [0, 0], barang: [3, 5] }, blackouts: 0 },
    { hourSec: 40, lv: { kumot: [5, 7], malik: [4, 6], kal: [2, 4], silip: [2, 4], barang: [4, 6] }, blackouts: 0 },
    { hourSec: 40, lv: { kumot: [5, 7], malik: [4, 6], kal: [3, 6], silip: [3, 6], barang: [4, 6] }, blackouts: 1 },
    { hourSec: 40, lv: { kumot: [6, 8], malik: [5, 7], kal: [4, 7], silip: [4, 7], barang: [5, 7] }, blackouts: 1 },
    { hourSec: 40, lv: { kumot: [7, 9], malik: [6, 8], kal: [5, 8], silip: [5, 8], barang: [6, 8] }, blackouts: 2 },
    { hourSec: 42, lv: { kumot: [6, 9], malik: [6, 9], kal: [6, 9], silip: [6, 9], barang: [6, 9] }, dark: true },
    { hourSec: 45, lv: { kumot: [7, 10], malik: [7, 10], kal: [7, 10], silip: [7, 10], barang: [7, 10] }, dark: true }
  ];
  var ROOMS = ['bedroom', 'hall', 'living', 'kitchen', 'curtain'];
  // seconds to walk between a room and the hallway (running is 0.6x)
  var LEG = { bedroom: 1.2, hall: 0, living: 1.5, kitchen: 2.0, curtain: 1.8 };
  var ROOM_X = { kitchen: -1, living: -0.9, curtain: -0.2, hall: 0.3, bedroom: 1 };

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function rngFrom(seed) {
    var s = seed >>> 0 || 1;
    return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 100000) / 100000; };
  }

  // seconds to walk each way through the house (the length of the walking clip: turn round, walk the real distance,
  // turn to face the room); running takes a little over half as long, but the floor is loud and you are out of breath
  var WALKT = {"bedroom-curtain": 4.06, "bedroom-hall": 4.06, "bedroom-kitchen": 7.04, "bedroom-living": 5.46, "curtain-bedroom": 4.19, "curtain-hall": 1.35, "curtain-kitchen": 5.68, "curtain-living": 4.1, "hall-bedroom": 4.09, "hall-curtain": 1.25, "hall-kitchen": 5.57, "hall-living": 4.0, "kitchen-bedroom": 7.12, "kitchen-curtain": 5.63, "kitchen-hall": 5.62, "kitchen-living": 5.75, "living-bedroom": 5.68, "living-curtain": 4.18, "living-hall": 4.18, "living-kitchen": 5.89};
  function travelTime(from, to, run) {
    if (from === to) return 0;
    var t = WALKT[from + '-' + to] || Math.max(0.7, (LEG[from] + LEG[to]) * 0.6);
    return run ? t / 1.8 : t;
  }

  function create(nightIdx, opts) {
    opts = opts || {};
    var CH2 = opts.chapter === 2, CH3 = opts.chapter === 3;
    var N = CH3 ? NIGHTS3[Math.min(nightIdx, 6)] : (CH2 ? NIGHTS2 : NIGHTS)[Math.min(nightIdx, 4)];
    var custom = opts.custom; // {kumot:lv,...} for Panata night
    var rnd = opts.rng || rngFrom(opts.seed || (Date.now() & 0xffffff));
    var nightNo = nightIdx + 1;
    var diff = CH3 ? Math.min(nightIdx, 6) / 6 : Math.min(nightIdx, 4) / 4; // 0..1 across nights

    var g = {
      night: nightNo, time: 0, hourSec: N.hourSec, over: false, won: false, dead: null, deathRoom: null,
      events: [],
      p: { room: 'bedroom', travel: null, run: false, hidden: null, holdDoor: false, holdBreath: false, holdCurtain: false,
           light: false, battery: 100, breath: 8, salt: 2, lastActT: -99, energy: 100 },
      house: { door: false /* closed? */, tv: false, lights: false, curtain: false, power: true, cricketsOff: 0, fan: false, fanB: false },
      noise: 0,
      k: { st: 0, t: 0, tick: 0, cool: 3, held: 0, win: lerp(16, 10, diff), lift: false, grace: 0, rattle: 0, away: 0 },
      m: { st: 0, t: 0, tick: 0, cool: 6, lock: 0, exposed: 0, hunt: 0, giggle: 0, win: lerp(14, 9, diff), darkT: 0 },
      c: { st: 0, t: 0, tick: 0, cool: 8, grace: 0, win: lerp(13, 9, diff), sniff: 0 },
      s: { st: 0, t: 0, tick: 0, cool: 10, flash: 0, held: 0, win: lerp(15, 11, diff), openT: 0, tap: 0 },
      b: { st: 0, tick: 0, flash: 0, atk: 0 },
      blackoutAt: [], heartbeat: false, msgs: []
    };
    if (CH2) { g.chapter = 2; g.p.room = 'hall'; g.saltOK = N.lv.kal[1] > 0; } else g.saltOK = nightNo >= 3;
    if (CH3) { g.chapter = 3; g.saltOK = custom ? (custom.kal || 0) > 0 : N.lv.kal[1] > 0; if (N.dark || opts.dark) { g.dark = true; g.house.power = false; } if (custom) g.blackoutAt = []; }
    // blackout schedule
    for (var b = 0; b < N.blackouts; b++) g.blackoutAt.push(N.hourSec * (1.4 + b * 1.4 + rnd() * 0.8));
    if (nightNo === 5 && !CH2 && !CH3) g.blackoutAt.push(N.hourSec * 5.0);

    function emit(type, data) { g.events.push({ type: type, data: data || {}, t: g.time }); }
    g.emit = emit;

    g.hour = function () { return Math.min(6, Math.floor(g.time / g.hourSec)); };
    g.clock = function () { var h = g.hour(); var m = Math.floor((g.time % g.hourSec) / g.hourSec * 60); if (h >= 6) { h = 6; m = 0; } return { h: h === 0 ? 12 : h, m: m }; };

    function level(name) {
      if (custom) return custom[name] || 0;
      var r = N.lv[name]; if (!r || !r[1]) return 0;
      var h = g.hour(); var step = h >= 4 ? 1 : h >= 3 ? 0.66 : h >= 2 ? 0.33 : 0;
      var lv = Math.round(lerp(r[0], r[1], step) * (g.dark ? 0.45 : (CH3 ? 0.48 : 0.56)));   // story difficulty: tense but fair (candle nights gentler: you can barely see)
      if ((nightNo === 5 || (CH3 && nightNo === 7)) && h >= 5) lv += 2;
      return lv;
    }
    g.level = level;
    function roll(lv) { return lv > 0 && (rnd() * 20 + 1) <= lv; }

    function fatalCount() {
      var n = 0;
      if (g.k.st >= 3) n++; if (g.m.st >= 1) n++; if (g.c.st >= 2) n++; if (g.s.st >= 4) n++; if (g.b.st >= 3) n++;
      return n;
    }
    var cap = nightNo <= 3 ? 1 : 2;
    if (CH3 && nightNo >= 6) cap = 2;
    if (nightNo === 5) cap = 2;
    function canEscalate() { return fatalCount() < cap; }

    function here(room) { return !g.p.travel && g.p.room === room; }
    // SANITY and the e-fans (like the music box in FNAF 2). The fans run all night, but now and then one switches itself off:
    // rarely on nights 1-2, sometimes on 3-5, often on 6-7. Switch it back on (one tap, no holding).
    // Every fan running: sanity slowly comes back. Only some: it comes back slower. None: it drains, and at zero you faint and
    // Kumot gives you bangungot. On the candle nights the fans are the rechargeable kind, so they still run without power.
    function fanHere() { var r = g.p.room; return r === 'living' ? 'fan' : (r === 'bedroom' && CH3) ? 'fanB' : null; }
    g.fanHere = fanHere;
    var FANS = CH3 ? ['fan', 'fanB'] : ['fan'];
    var avgLv = 0; if (custom) { var ks = Object.keys(custom).filter(function (k) { return typeof custom[k] === 'number'; }); ks.forEach(function (k) { avgLv += custom[k]; }); avgLv /= Math.max(1, ks.length); }
    var tier = custom ? (avgLv >= 12 ? 2 : avgLv >= 6 ? 1 : 0) : nightNo <= 2 ? 0 : nightNo <= 5 ? 1 : 2;
    var GAP = [[150, 240], [70, 115], [36, 60]][tier], gapMul = FANS.length > 1 ? 1.4 : 1;
    function gap() { return (GAP[0] + rnd() * (GAP[1] - GAP[0])) * gapMul; }
    g.fanNext = {}; FANS.forEach(function (f) { g.house[f] = true; g.fanNext[f] = 18 + rnd() * 20 + gap() * 0.6; });
    function fanRuns(f) { return !!g.house[f] && (g.house.power || !!g.dark); }
    g.fanRuns = fanRuns;
    g.fans = FANS;
    var S_UP = 2.5, S_SOME = 1.0, S_DRAIN = (100 / 65) * (tier === 2 ? 1.1 : 1);
    function energy(dt) {
      var p = g.p, H = g.house, e0 = p.energy;
      FANS.forEach(function (f) {
        if (g.time < g.fanNext[f]) return;
        g.fanNext[f] = g.time + gap();
        if (H[f] && (H.power || g.dark)) { H[f] = false; emit('fan', { on: false, which: f, auto: true }); }
      });
      var n = 0; FANS.forEach(function (f) { if (fanRuns(f)) n++; });
      if (n === FANS.length) p.energy = Math.min(100, p.energy + dt * S_UP);
      else if (n > 0) p.energy = Math.min(100, p.energy + dt * S_SOME);
      else p.energy = Math.max(0, p.energy - dt * S_DRAIN * (H.power || g.dark ? 1 : 0.5));
      if (e0 > 30 && p.energy <= 30) emit('tired', { lvl: 1 });
      if (e0 > 12 && p.energy <= 12) emit('tired', { lvl: 2 });
      if (e0 <= 30 && p.energy > 30) emit('tired', { lvl: 0 });
      if (p.energy <= 0) { kill('bangungot'); return true; }
      return false;
    }
    function kill(who) { if (g.over) return; g.over = true; g.dead = who; g.deathRoom = g.p.room; emit('death', { who: who }); }

    // ---------------------------------------------------------------- player actions
    g.act = function (a, arg) {
      if (a === 'fan') {
        var f = fanHere(); if (!f || g.p.hidden || g.p.travel || g.over || g.house[f]) return false;
        if (!g.house.power && !g.dark) { emit('fan_nopower'); return false; }
        g.house[f] = true; g.fanNext[f] = g.time + gap(); emit('fan', { on: true, which: f }); return true;
      }
      if (g.over) return false;
      var p = g.p, H = g.house;
      if (a === 'go') {
        if (p.travel || p.hidden || arg === p.room) return false;
        if (CH2 && arg === 'bedroom') { emit('forbidden'); return false; }
        var tt = travelTime(p.room, arg, p.run);
        p.travel = { from: p.room, to: arg, t: tt, total: tt, run: p.run };
        p.light = false; p.holdDoor = p.holdBreath = p.holdCurtain = false;
        g.noise = clamp(g.noise + (p.run ? 35 : (arg === 'kitchen' ? 8 : 3)), 0, 100);
        emit('travel', { from: p.room, to: arg, run: p.run, t: tt });
        return true;
      }
      if (p.travel) return false;
      p.lastActT = g.time;
      var room = p.room;
      if (a === 'run') { p.run = !p.run; return true; }
      if (a === 'door' && room === 'bedroom' && !p.hidden) {
        H.door = !H.door; p.holdDoor = false;
        emit(H.door ? 'door_close' : 'door_open');
        if (H.door && g.k.st === 3) g.noise = clamp(g.noise + 10, 0, 100);
        return true;
      }
      if (a === 'hide') {
        var spot = { bedroom: 'bed', kitchen: 'cabinet', living: 'sofa' }[room];
        if (!spot) return false;
        if (p.hidden) { p.hidden = null; p.holdBreath = false; emit('unhide', { spot: spot }); }
        else { p.hidden = spot; p.light = false; emit('hide', { spot: spot }); }
        if (spot === 'cabinet') g.noise = clamp(g.noise + 5, 0, 100);
        if (spot === 'sofa') emit('crinkle');
        return true;
      }
      if (a === 'tv' && room === 'living' && !p.hidden) {
        if (!H.tv) return false;
        H.tv = false; emit('tv_off');
        if (g.m.st === 1) { g.m.st = 0; g.m.cool = 6; emit('malik_sleep'); }
        return true;
      }
      if (a === 'lights' && room === 'living' && !p.hidden) {
        if (!H.power) { emit('no_power'); return false; }
        H.lights = !H.lights; emit('light_switch'); return true;
      }
      if (a === 'curtain' && room === 'curtain') {
        H.curtain = !H.curtain; p.holdCurtain = false; p.light = p.light && H.curtain;
        emit(H.curtain ? 'curtain_open' : 'curtain_close');
        if (H.curtain && g.s.st >= 4 && !(g.s.grace > 0)) { kill('silip'); }
        return true;
      }
      if (a === 'salt' && room === 'kitchen') {
        if (p.salt <= 0) return false;
        p.salt--; g.noise = clamp(g.noise + 5, 0, 100); emit('salt');
        if (g.c.st >= 2) { g.c.st = 0; g.c.cool = 12; g.c.t = 0; emit('kal_retreat'); }
        return true;
      }
      if (a === 'breaker_fail' && room === 'kitchen') { g.noise = clamp(g.noise + 20, 0, 100); emit('breaker_fail'); return true; }
      if (a === 'breaker' && room === 'kitchen' && !p.hidden) {
        if (H.power || g.dark) return false;   // nights 6-7: the whole street is out, the breaker can't help
        H.power = true; emit('breaker'); g.noise = clamp(g.noise + 15, 0, 100); return true;
      }
      return false;
    };
    g.hold = function (what, on) {
      var p = g.p;
      if (g.over || p.travel) { p.holdDoor = p.holdBreath = p.holdCurtain = p.light = false; return; }
      if (what === 'door') {
        if (g.doorView) {   // Chapter 3 at the door (as in Chapter 1): holding pulls it shut and keeps it shut; let go and it swings back open
          var hv = !!on && p.room === 'bedroom' && !p.hidden;
          if (hv && !g.house.door) { g.house.door = true; emit('door_close', { held: true }); }
          if (!hv && g.house.door && p.holdDoor) { g.house.door = false; emit('door_open', { held: true }); }
          p.holdDoor = hv;
        } else p.holdDoor = !!on && p.room === 'bedroom' && g.house.door && !p.hidden;
      }
      if (what === 'breath') { if (on && p.breath < 1.5) return; p.holdBreath = !!on && !!p.hidden; if (!on && p.breath < 8) {} }
      if (what === 'curtain') p.holdCurtain = !!on && p.room === 'curtain' && !g.house.curtain;
      if (what === 'light') p.light = !!on && p.battery > 0 && !p.hidden;
    };

    // ---------------------------------------------------------------- per-frame update
    g.update = function (dt) {
      if (g.over) return;
      dt = Math.min(dt, 0.25);
      g.time += dt;
      var p = g.p, H = g.house;

      // clock / win
      if (g.time >= g.hourSec * 6) { g.over = true; g.won = true; emit('win'); return; }
      var hourNow = g.hour();
      if (hourNow !== g._lastHour) { g._lastHour = hourNow; emit('hour', { h: hourNow }); }

      // travel
      if (p.travel) {
        p.travel.t -= dt;
        if (p.travel.t <= 0) { var wasRun = p.travel.run; p.room = p.travel.to; p.travel = null; emit('arrive', { room: p.room }); if (wasRun) { p.puff = Math.min(1, (p.puff || 0) + 0.45); emit('pant', { v: p.puff }); } onArrive(); }
      }
      // breath / battery / noise
      // after a run you are panting: you cannot hold your breath as long until you get it back
      p.puff = Math.max(0, (p.puff || 0) - dt * 0.12);
      var bmax = 8 * (1 - 0.55 * p.puff);
      if (p.holdBreath) { p.breath -= dt * (1 + p.puff); if (p.breath <= 0) { p.breath = 0; p.holdBreath = false; emit('gasp'); g.noise = clamp(g.noise + 25, 0, 100); g._gasp = g.time; } }
      else p.breath = Math.min(bmax, p.breath + dt * 1.6 * (1 - 0.5 * p.puff));
      if (p.light) { p.battery -= dt * (g.dark ? 0.45 : 0.55); if (p.battery <= 0) { p.battery = 0; p.light = false; emit('battery_dead'); } }
      g.noise = Math.max(0, g.noise - dt * 6);

      // blackouts
      for (var i = 0; i < g.blackoutAt.length; i++) {
        if (g.blackoutAt[i] && g.time >= g.blackoutAt[i]) {
          g.blackoutAt[i] = 0;
          if (H.power) { H.power = false; H.lights = false; if (H.tv && g.m.st < 2) { H.tv = false; if (g.m.st === 1) { g.m.st = 0; g.m.cool = 5; } } emit('blackout', { cut: CH2 }); }
        }
      }
      if (H.cricketsOff > 0) H.cricketsOff -= dt;
      if (!g.quiet && energy(dt)) return;

      if (!g.quiet) { // quiet = the tutorial call on night 1: the house waits until Tita Cora hangs up
        updateKumot(dt); if (g.over) return;
        updateMalik(dt); if (g.over) return;
        updateKal(dt); if (g.over) return;
        updateSilip(dt); if (g.over) return;
        if (CH3) { updateBarang(dt); if (g.over) return; }
      }

      var danger = (g.k.st >= 3 && (here('bedroom') || p.room === 'hall')) || (g.m.st === 2) || (g.c.st === 3 && here('kitchen')) || (g.s.st >= 4 && here('curtain')) || (g.b.st >= 3 && here('bedroom'));
      if (danger !== g.heartbeat) { g.heartbeat = danger; emit('heartbeat', { on: danger }); }
    };

    function onArrive() {
      var p = g.p;
      if (p.room === 'bedroom' && g.k.st === 4) g.k.grace = 2.2;
      if (p.room === 'kitchen' && g.c.st === 3) g.c.grace = 1.8;
      if (p.room === 'living' && g.m.st === 2) g.m.exposed = Math.max(g.m.exposed, 0);
    }

    // -------- KUMOT (Batibat): bedroom door, bed, breath
    function updateKumot(dt) {
      var k = g.k, p = g.p, H = g.house, lv = level('kumot');
      if (!lv && k.st === 0) return;
      if (k.cool > 0) k.cool -= dt;
      if (k.st < 3) {
        k.tick += dt;
        if (k.tick >= 4.5) {
          k.tick = 0;
          if (k.cool <= 0 && roll(lv) && (k.st < 2 || canEscalate())) {
            k.st++;
            if (k.st === 1) emit('cue', { id: 'scuffs_far', room: 'hall', cap: 'cap_scuffs_far' });
            if (k.st === 2) { emit('cue', { id: 'scuffs_near', room: 'hall', cap: 'cap_scuffs_near' }); emit('cue', { id: 'wheeze', room: 'hall', cap: 'cap_wheeze', delay: 2 }); }
            if (k.st === 3) { k.t = k.win; k.held = 0; k.rattle = 0; emit('kumot_door'); emit('cue', { id: 'wheeze', room: 'bedroom', cap: 'cap_wheeze' }); }
          }
        }
        return;
      }
      if (k.st === 3) {
        k.t -= dt;
        if (H.door) {
          k.rattle -= dt;
          if (k.rattle <= 0) { k.rattle = 1.7; emit('cue', { id: 'handle_rattle', room: 'bedroom', cap: 'cap_rattle' }); }
          if (p.holdDoor && here('bedroom')) k.held += dt;
          if (k.held >= k.win * 0.5) { k.st = 0; k.cool = lerp(10, 6, diff); emit('kumot_leave'); emit('cue', { id: 'scuffs_far', room: 'hall', cap: 'cap_scuffs_leave' }); return; }
        }
        if (k.t <= 0) {
          if (H.door && k.held >= k.win * 0.5) { k.st = 0; k.cool = lerp(10, 6, diff); emit('kumot_leave'); emit('cue', { id: 'scuffs_far', room: 'hall', cap: 'cap_scuffs_leave' }); }
          else { k.st = 4; k.t = 7; k.lift = false; k.warned = false; H.door = false; k.grace = 2.2; k.away = 0; emit('kumot_enter'); emit('door_open', { forced: true }); emit('cue', { id: 'lullaby_hum', room: 'bedroom', cap: 'cap_hum' }); }
        }
        return;
      }
      // st 4: inside the bedroom
      if (here('bedroom')) {
        if (p.hidden === 'bed') {
          k.t -= dt;
          if (k.t < 5.6 && !k.warned) { k.warned = true; emit('lift_warn'); emit('cue', { id: 'kulambo_rustle', room: 'bedroom', cap: 'cap_lift' }); }
          var lifting = k.t < 4.2 && k.t > 1.6;
          if (lifting && !k.lift) { k.lift = true; emit('lift'); }
          if (lifting && !p.holdBreath) { kill('kumot'); return; }
          if (lifting && g._gasp && g.time - g._gasp < 0.3) { kill('kumot'); return; }
          if (k.t <= 0) { k.st = 0; k.cool = lerp(12, 7, diff); emit('kumot_leave'); emit('cue', { id: 'scuffs_far', room: 'hall', cap: 'cap_scuffs_leave' }); }
        } else {
          k.grace -= dt;
          if (k.grace <= 0) kill('kumot');
        }
      } else {
        k.away += dt;
        if (k.away > 14) { k.st = 0; k.cool = 8; emit('kumot_leave'); }
      }
    }

    // -------- MALIKMATA (Tiyanak): TV, lights, sofa
    function updateMalik(dt) {
      var m = g.m, p = g.p, H = g.house, lv = level('malik');
      if (!lv && m.st === 0) return;
      if (m.cool > 0) m.cool -= dt;
      if (m.st === 0) {
        if (!H.lights && !H.tv) m.darkT += dt; else m.darkT = 0;
        m.tick += dt;
        if (m.tick >= 5) {
          m.tick = 0;
          var bonus = m.darkT > 40 ? 3 : 0;
          if ((H.power || g.dark) && m.cool <= 0 && roll(lv + bonus) && canEscalate()) {
            m.st = 1; m.t = m.win; H.tv = !!H.power;
            emit('malik_static'); emit('cue', { id: 'static_swell', room: 'living', cap: 'cap_static', dur: m.win });
            emit('cue', { id: 'baby_cry', room: 'living', cap: 'cap_cry' });
          }
        }
        return;
      }
      if (m.st === 1) {
        m.t -= dt;
        if (g.dark && here('living') && p.light) { m.lock += dt; if (m.lock >= 2) { m.lock = 0; m.st = 0; m.cool = 6; emit('malik_sleep'); return; } }
        if (m.t <= 0) { m.st = 2; m.t = 15; m.lock = 0; m.exposed = 0; m.hunt = 0; m.giggle = 0; emit('malik_out'); emit('cue', { id: 'vhs_glitch', room: 'living', cap: 'cap_vhs' }); }
        return;
      }
      // st 2: out
      m.t -= dt; m.giggle -= dt;
      if (m.giggle <= 0) { m.giggle = 3.2; emit('cue', { id: 'giggle', room: here('living') ? 'living' : p.room, cap: 'cap_giggle', near: true }); }
      if (here('living')) {
        if (H.lights) { m.lock += dt; if (m.lock >= 3) { kill('malik'); return; } } else m.lock = Math.max(0, m.lock - dt);
        if (p.hidden !== 'sofa') { m.exposed += dt; if (m.exposed >= 4) { kill('malik'); return; } }
      } else if (!p.travel) {
        m.hunt += dt;
        if (m.hunt > 6 && !p.hidden) { m.exposed += dt; if (m.exposed >= 4.5) { kill('malik'); return; } }
      }
      if (m.t <= 0) { m.st = 0; m.cool = lerp(10, 6, diff); H.tv = false; emit('malik_return'); }
    }

    // -------- BARANG (Chapter 3): the aparador in the bedroom opens a little more each time; light pushes her back
    function updateBarang(dt) {
      var b = g.b, p = g.p, lv = level('barang');
      if (!lv && b.st === 0) return;
      b.tick += dt;
      if (b.st < 4 && b.tick >= 7) {
        b.tick = 0;
        if (roll(lv) && (b.st < 2 || canEscalate())) { b.st++; emit('barang_step', { st: b.st }); if (b.st === 4) { b.atk = lerp(7.5, 4.2, diff); emit('barang_out'); } }
      }
      if (here('bedroom') && p.light && !p.hidden && b.st >= 1) {
        b.flash += dt;
        if (b.flash >= 1.4) { b.flash = 0; b.st--; b.tick = 0; emit('barang_back', { st: b.st }); }
      } else b.flash = Math.max(0, b.flash - dt);
      if (b.st === 4) { b.atk -= dt; if (b.atk <= 0) kill('barang'); }
    }

    // -------- KALANSING (Aswang): noise, cabinet, asin
    function updateKal(dt) {
      var c = g.c, p = g.p, lv = level('kal');
      if (!lv && c.st === 0) return;
      if (c.cool > 0) c.cool -= dt;
      if (c.st < 2) {
        c.tick += dt;
        if (c.tick >= 4) {
          c.tick = 0;
          var lvx = lv + g.noise / 12;
          if (c.cool <= 0 && roll(lvx) && (c.st < 1 || canEscalate())) {
            c.st++;
            if (c.st === 1) emit('cue', { id: 'clinks', room: 'kitchen', cap: 'cap_clinks_far', vol: 0.5 });
            if (c.st === 2) { c.t = c.win; emit('kal_near'); emit('cue', { id: 'clinks', room: 'kitchen', cap: 'cap_clinks_near' }); emit('cue', { id: 'sniff', room: 'kitchen', cap: 'cap_sniff', delay: 1.5 }); }
          }
        }
        return;
      }
      if (c.st === 2) {
        c.t -= dt;
        if (c.t <= 0) { c.st = 3; c.t = 10; c.grace = 1.8; emit('kal_in'); if (here('kitchen')) emit('cue', { id: 'clinks', room: 'kitchen', cap: 'cap_kal_in' }); }
        return;
      }
      // st 3: in the kitchen
      c.t -= dt;
      if (here('kitchen')) {
        if (p.hidden === 'cabinet') {
          c.sniff -= dt;
          if (c.sniff <= 0) { c.sniff = 2.4; emit('cue', { id: 'knife_taps', room: 'kitchen', cap: 'cap_taps' }); }
        } else {
          c.grace -= dt;
          if (c.grace <= 0) { kill('kal'); return; }
        }
      }
      if (c.t <= 0) { c.st = 0; c.cool = lerp(12, 7, diff); emit('kal_leave'); }
    }
    // any tap while hidden in the cabinet with her there counts as moving
    var _act = g.act;
    g.act = function (a, arg) {
      if (!g.over && g.c.st === 3 && here('kitchen') && g.p.hidden === 'cabinet' && a !== 'salt') { g.p.lastActT = g.time; kill('kal'); return false; }
      return _act(a, arg);
    };

    // -------- SILIP (Manananggal): stages, curtain, flashlight
    function updateSilip(dt) {
      var s = g.s, p = g.p, H = g.house, lv = level('silip');
      if (!lv && s.st === 0) return;
      if (s.cool > 0) s.cool -= dt;
      var lookingOut = here('curtain') && H.curtain;
      if (lookingOut && !p.light) s.openT += dt; else s.openT = 0;
      if (s.st < 4) {
        s.tick += dt * (s.openT > 6 ? 2 : 1);
        var every = lerp(7, 5.5, diff);
        if (s.tick >= every) {
          s.tick = 0;
          if (s.cool <= 0 && roll(lv) && (s.st < 3 || canEscalate())) {
            s.st++; H.cricketsOff = 5; emit('crickets_off', { stage: s.st });
            if (s.st === 4) { s.t = s.win; s.held = 0; s.tap = 0; s.grace = 1.2; emit('silip_glass'); }
          }
        }
        // flashlight pushes her back
        if (lookingOut && p.light && s.st >= 1 && s.st <= 3) {
          s.flash += dt;
          if (s.flash >= 2) { s.flash = 0; s.st--; s.cool = 3; emit('silip_back', { stage: s.st }); }
        } else s.flash = Math.max(0, s.flash - dt);
        return;
      }
      if (s.st === 4) {
        s.t -= dt; s.tap -= dt;
        if (s.tap <= 0) { s.tap = 1.8; emit('cue', { id: 'nail_taps', room: 'curtain', cap: 'cap_nails' }); }
        if (s.grace > 0) s.grace -= dt;
        if (lookingOut && s.grace <= 0) { kill('silip'); return; }
        if (here('curtain') && p.holdCurtain && !H.curtain) s.held += dt;
        if (s.held >= s.win * 0.4) { s.st = 1; s.cool = lerp(10, 6, diff); emit('silip_back', { stage: 1 }); return; }
        if (s.t <= 0) {
          if (s.held >= s.win * 0.4) { s.st = 1; s.cool = lerp(10, 6, diff); emit('silip_back', { stage: 1 }); }
          else { s.st = 5; kill('silip'); }
        }
      }
    }

    emit('start', { night: nightNo });
    return g;
  }

  return { create: create, NIGHTS: NIGHTS, NIGHTS2: NIGHTS2, NIGHTS3: NIGHTS3, ROOMS: ROOMS, ROOM_X: ROOM_X, travelTime: travelTime, rngFrom: rngFrom };
})();
if (typeof module !== 'undefined') module.exports = AS;
