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

  function travelTime(from, to, run) {
    if (from === to) return 0;
    var t = (from === 'hall' || to === 'hall') ? LEG[from] + LEG[to] : LEG[from] + LEG[to];
    t = Math.max(0.7, t * 0.6);
    return run ? t * 0.6 : t;
  }

  function create(nightIdx, opts) {
    opts = opts || {};
    var N = NIGHTS[Math.min(nightIdx, 4)];
    var custom = opts.custom; // {kumot:lv,...} for Panata night
    var rnd = opts.rng || rngFrom(opts.seed || (Date.now() & 0xffffff));
    var nightNo = nightIdx + 1;
    var diff = Math.min(nightIdx, 4) / 4; // 0..1 across nights

    var g = {
      night: nightNo, time: 0, hourSec: N.hourSec, over: false, won: false, dead: null, deathRoom: null,
      events: [],
      p: { room: 'bedroom', travel: null, run: false, hidden: null, holdDoor: false, holdBreath: false, holdCurtain: false,
           light: false, battery: 100, breath: 8, salt: 2, lastActT: -99 },
      house: { door: false /* closed? */, tv: false, lights: false, curtain: false, power: true, cricketsOff: 0 },
      noise: 0,
      k: { st: 0, t: 0, tick: 0, cool: 3, held: 0, win: lerp(10, 5, diff), lift: false, grace: 0, rattle: 0, away: 0 },
      m: { st: 0, t: 0, tick: 0, cool: 6, lock: 0, exposed: 0, hunt: 0, giggle: 0, win: lerp(8, 4, diff), darkT: 0 },
      c: { st: 0, t: 0, tick: 0, cool: 8, grace: 0, win: lerp(6, 3, diff), sniff: 0 },
      s: { st: 0, t: 0, tick: 0, cool: 10, flash: 0, held: 0, win: lerp(9, 6.5, diff), openT: 0, tap: 0 },
      blackoutAt: [], heartbeat: false, msgs: []
    };
    // blackout schedule
    for (var b = 0; b < N.blackouts; b++) g.blackoutAt.push(N.hourSec * (1.4 + b * 1.4 + rnd() * 0.8));
    if (nightNo === 5) g.blackoutAt.push(N.hourSec * 5.0);

    function emit(type, data) { g.events.push({ type: type, data: data || {}, t: g.time }); }
    g.emit = emit;

    g.hour = function () { return Math.min(6, Math.floor(g.time / g.hourSec)); };
    g.clock = function () { var h = g.hour(); var m = Math.floor((g.time % g.hourSec) / g.hourSec * 60); if (h >= 6) { h = 6; m = 0; } return { h: h === 0 ? 12 : h, m: m }; };

    function level(name) {
      if (custom) return custom[name] || 0;
      var r = N.lv[name]; if (!r[1]) return 0;
      var h = g.hour(); var step = h >= 4 ? 1 : h >= 3 ? 0.66 : h >= 2 ? 0.33 : 0;
      var lv = Math.round(lerp(r[0], r[1], step));
      if (nightNo === 5 && h >= 5) lv += 2;
      return lv;
    }
    g.level = level;
    function roll(lv) { return lv > 0 && (rnd() * 20 + 1) <= lv; }

    function fatalCount() {
      var n = 0;
      if (g.k.st >= 3) n++; if (g.m.st >= 1) n++; if (g.c.st >= 2) n++; if (g.s.st >= 4) n++;
      return n;
    }
    var cap = nightNo <= 3 ? 1 : 2;
    if (nightNo === 5) cap = 2;
    function canEscalate() { return fatalCount() < cap; }

    function here(room) { return !g.p.travel && g.p.room === room; }
    function kill(who) { if (g.over) return; g.over = true; g.dead = who; g.deathRoom = g.p.room; emit('death', { who: who }); }

    // ---------------------------------------------------------------- player actions
    g.act = function (a, arg) {
      if (g.over) return false;
      var p = g.p, H = g.house;
      if (a === 'go') {
        if (p.travel || p.hidden || arg === p.room) return false;
        var tt = travelTime(p.room, arg, p.run);
        p.travel = { from: p.room, to: arg, t: tt, total: tt };
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
      if (a === 'breaker' && room === 'kitchen' && !p.hidden) {
        if (H.power) return false;
        H.power = true; emit('breaker'); g.noise = clamp(g.noise + 15, 0, 100); return true;
      }
      return false;
    };
    g.hold = function (what, on) {
      var p = g.p;
      if (g.over || p.travel) { p.holdDoor = p.holdBreath = p.holdCurtain = p.light = false; return; }
      if (what === 'door') p.holdDoor = !!on && p.room === 'bedroom' && g.house.door && !p.hidden;
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
        if (p.travel.t <= 0) { p.room = p.travel.to; p.travel = null; emit('arrive', { room: p.room }); onArrive(); }
      }
      // breath / battery / noise
      if (p.holdBreath) { p.breath -= dt; if (p.breath <= 0) { p.breath = 0; p.holdBreath = false; emit('gasp'); g.noise = clamp(g.noise + 25, 0, 100); g._gasp = g.time; } }
      else p.breath = Math.min(8, p.breath + dt * 1.6);
      if (p.light) { p.battery -= dt * 1.4; if (p.battery <= 0) { p.battery = 0; p.light = false; emit('battery_dead'); } }
      g.noise = Math.max(0, g.noise - dt * 6);

      // blackouts
      for (var i = 0; i < g.blackoutAt.length; i++) {
        if (g.blackoutAt[i] && g.time >= g.blackoutAt[i]) {
          g.blackoutAt[i] = 0;
          if (H.power) { H.power = false; H.lights = false; if (H.tv && g.m.st < 2) { H.tv = false; if (g.m.st === 1) { g.m.st = 0; g.m.cool = 5; } } emit('blackout'); }
        }
      }
      if (H.cricketsOff > 0) H.cricketsOff -= dt;

      if (!g.quiet) { // quiet = the tutorial call on night 1: the house waits until Tita Cora hangs up
        updateKumot(dt); if (g.over) return;
        updateMalik(dt); if (g.over) return;
        updateKal(dt); if (g.over) return;
        updateSilip(dt); if (g.over) return;
      }

      var danger = (g.k.st >= 3 && (here('bedroom') || p.room === 'hall')) || (g.m.st === 2) || (g.c.st === 3 && here('kitchen')) || (g.s.st >= 4 && here('curtain'));
      if (danger !== g.heartbeat) { g.heartbeat = danger; emit('heartbeat', { on: danger }); }
    };

    function onArrive() {
      var p = g.p;
      if (p.room === 'bedroom' && g.k.st === 4) g.k.grace = 1.6;
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
          else { k.st = 4; k.t = 7; k.lift = false; k.warned = false; H.door = false; k.grace = 1.6; k.away = 0; emit('kumot_enter'); emit('door_open', { forced: true }); emit('cue', { id: 'lullaby_hum', room: 'bedroom', cap: 'cap_hum' }); }
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
          if (H.power && m.cool <= 0 && roll(lv + bonus) && canEscalate()) {
            m.st = 1; m.t = m.win; H.tv = true;
            emit('malik_static'); emit('cue', { id: 'static_swell', room: 'living', cap: 'cap_static', dur: m.win });
            emit('cue', { id: 'baby_cry', room: 'living', cap: 'cap_cry' });
          }
        }
        return;
      }
      if (m.st === 1) {
        m.t -= dt;
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

  return { create: create, NIGHTS: NIGHTS, ROOMS: ROOMS, ROOM_X: ROOM_X, travelTime: travelTime, rngFrom: rngFrom };
})();
if (typeof module !== 'undefined') module.exports = AS;
