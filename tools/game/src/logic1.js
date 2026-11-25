// Chapter 1 — Lola's bedroom. Pure rules, no DOM. The player never leaves the room.
// Spots: center, door, window, cabinet, bed (under the bed). Entities: Kumot (door), Silip (curtain), Barang (aparador).
var C1 = (function () {
  var HOUR = 40;                                    // 6 hours x 40 s = a 4-minute night
  // AI levels (0-20) per night for [12-2 AM, 2-4 AM, 4-6 AM]; null = not active
  var NIGHTS = [
    { k: [4, 5, 6], s: null, b: null, gust: null },
    { k: [4, 5, 6], s: [4, 5, 7], b: null, gust: [32, 52] },
    { k: [6, 7, 9], s: null, b: [8, 10, 12], gust: null },
    { k: [12, 13, 15], s: [12, 13, 15], b: [12, 13, 15], gust: [18, 30] },
    { k: [18, 19, 20], s: [18, 19, 20], b: [18, 19, 20], gust: [12, 20], blackout: 4 }
  ];
  var MOVE = { center: { door: 0.45, window: 0.45, cabinet: 0.5, bed: 0.55 } };
  function moveTime(a, b) { if (a === b) return 0; if (a === 'center') return MOVE.center[b]; if (b === 'center') return MOVE.center[a]; return MOVE.center[a] + MOVE.center[b] - 0.1; }
  function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }

  function create(nightIdx, opt) {
    opt = opt || {};
    var N = opt.custom || NIGHTS[nightIdx];
    var seed = (opt.seed || (Date.now() & 0xffff)) >>> 0;
    var rng = opt.rng || function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    var g = {
      chapter: 1, night: nightIdx + 1, hourSec: opt.hourSec || HOUR, time: 0, over: false, result: null, events: [], quiet: false,
      p: { pos: 'center', travel: null, holdDoor: false, holdCurtain: false, light: false, holdBreath: false, battery: 100, breath: 8 },
      house: { curtain: false, power: true },
      k: { on: !!N.k, st: 0, t: 6, win: 0, held: 0, grace: 0, search: 0, lifted: false, warned: false, out: 0 },
      s: { on: !!N.s, st: 0, t: 8, phase: '', grace: 0, grip: 0, gripT: 0, linger: 0 },
      b: { on: !!N.b, st: 0, t: 9, flash: 0, atk: 0 },
      gust: N.gust ? rng() * (N.gust[1] - N.gust[0]) + N.gust[0] : 0,
      blackoutAt: N.blackout || 0, N: N
    };
    function emit(type, data) { g.events.push({ type: type, data: data || {} }); }
    g.emit = emit;
    function level(who) { var L = N[who]; if (!L) return 0; var h = g.hour(); return L[h < 2 ? 0 : h < 4 ? 1 : 2]; }
    function diff(who) { return level(who) / 20; }
    function roll(who) { return rng() * 20 < level(who); }
    function critical(except) {
      return (except !== 'k' && g.k.st >= 3) || (except !== 's' && g.s.st >= 3 && g.s.phase !== 'linger') || (except !== 'b' && g.b.st >= 4);
    }
    g.hour = function () { return Math.min(5, Math.floor(g.time / g.hourSec)); };
    g.clock = function () { var h = g.hour(); var m = Math.floor((g.time - h * g.hourSec) / g.hourSec * 60); return { h: h === 0 ? 12 : h, m: m }; };
    g.level = function (who) { return level(who); };
    g.at = function (pos) { return !g.p.travel && g.p.pos === pos; };
    function die(who) { if (g.over) return; g.over = true; g.result = 'death'; emit('death', { who: who }); }

    // ------------------------------------------------------------------ player
    g.act = function (a, arg) {
      if (g.over) return false;
      var p = g.p;
      if (g.k.st === 4 && p.pos === 'bed' && a !== 'none') { die('kumot'); return false; } // any movement while she searches
      if (p.travel) return false;
      switch (a) {
        case 'go':
          if (arg === p.pos || ['center', 'door', 'window', 'cabinet'].indexOf(arg) < 0) return false;
          if (p.pos === 'bed') return false;
          releaseAll();
          p.travel = { from: p.pos, to: arg, t: moveTime(p.pos, arg) }; p.travel.left = p.travel.t;
          emit('travel', { from: p.pos, to: arg, t: p.travel.t }); return true;
        case 'hide':
          if (p.pos !== 'center') return false;
          releaseAll(); p.travel = { from: 'center', to: 'bed', t: MOVE.center.bed, left: MOVE.center.bed };
          emit('travel', { from: 'center', to: 'bed', t: MOVE.center.bed, hide: true }); return true;
        case 'unhide':
          if (p.pos !== 'bed') return false;
          releaseAll(); p.travel = { from: 'bed', to: 'center', t: MOVE.center.bed, left: MOVE.center.bed };
          emit('travel', { from: 'bed', to: 'center', t: MOVE.center.bed, unhide: true }); return true;
        case 'curtain':
          if (p.pos !== 'window') return false;
          if (g.house.curtain) { g.house.curtain = false; emit('curtain_close'); if (g.s.phase === 'seen') { g.s.phase = 'grip'; g.s.grip = 0; g.s.gripT = lerp(5.5, 4.2, diff('s')); emit('silip_grip'); } }
          else { g.house.curtain = true; emit('curtain_open'); if (g.s.st === 3) seen(); }
          return true;
      }
      return false;
    };
    function releaseAll() { var p = g.p; if (p.holdDoor) { p.holdDoor = false; emit('door_release'); } p.holdCurtain = false; p.holdBreath = false; if (p.light) { p.light = false; emit('light', { on: false }); } }
    g.hold = function (what, on) {
      var p = g.p; if (g.over || p.travel) { if (!on) { p.holdDoor = p.holdCurtain = p.holdBreath = false; p.light = false; } return; }
      if (what === 'door') {
        var v = !!on && p.pos === 'door';
        if (v && !p.holdDoor) { emit('door_shut'); if (g.k.st === 2 && g.k.t > 1.2) g.k.t = 1.2; }   // the slam is heard down the hall
        if (!v && p.holdDoor) emit('door_release');
        p.holdDoor = v;
      } else if (what === 'curtain') p.holdCurtain = !!on && p.pos === 'window' && !g.house.curtain;
      else if (what === 'breath') { var b = !!on && p.pos === 'bed' && p.breath > 0.2; if (b && !p.holdBreath) emit('breath_in'); p.holdBreath = b; }
      else if (what === 'light') { var l = !!on && p.battery > 0 && p.pos !== 'bed'; if (l !== p.light) emit('light', { on: l }); p.light = l; }
    };

    // ------------------------------------------------------------------ Kumot: footsteps in the hall, breathing at the door
    function updK(dt) {
      var k = g.k, p = g.p; if (!k.on) return;
      if (k.st < 3) {
        k.t -= dt;
        if (k.t <= 0) {
          k.t = 5;
          if (roll('k') && !(k.st === 2 && critical('k'))) {
            k.st++;
            if (k.st === 1) emit('cue', { id: 'scuffs_far', room: 'hall', vol: 0.55 });
            else if (k.st === 2) emit('cue', { id: 'scuffs_near', room: 'hall', vol: 0.85 });
            else { k.win = lerp(9.5, 4.6, diff('k')); k.held = 0; emit('kumot_door'); }
          }
        }
      } else if (k.st === 3) {
        if (p.holdDoor) { k.held += dt; if (k.held > 0.6 && !k.rattled) { k.rattled = true; emit('cue', { id: 'handle_rattle', room: 'door', vol: 0.9 }); } }
        if (k.held >= 2.6) { k.st = g.N.k[2] >= 18 ? 1 : 0; k.t = g.N.k[2] >= 18 ? 6 : 9; k.rattled = false; emit('kumot_leave'); return; }
        k.win -= dt;
        if (k.win <= 0) { k.st = 4; k.rattled = false; k.grace = 2.3; k.search = 0; k.lifted = false; k.warned = false; emit('kumot_enter', { open: !p.holdDoor }); if (p.holdDoor) { p.holdDoor = false; emit('door_release'); } }
      } else if (k.st === 4) {
        if (p.pos === 'bed' && !p.travel) {
          if (!k.search) { k.search = 7.5; emit('kumot_search'); }
          k.search -= dt;
          if (k.search < 5.8 && !k.warned) { k.warned = true; emit('lift_warn'); }
          if (k.search < 4.4 && k.search > 1.6) { if (!k.lifted) { k.lifted = true; emit('lift'); } if (!p.holdBreath) { emit('gasp'); die('kumot'); return; } }
          if (k.search <= 0) { k.st = 0; k.t = 10; k.search = 0; emit('kumot_leave', { inside: true }); }
        } else if (!(p.travel && p.travel.to === 'bed')) {
          k.grace -= dt; if (k.grace <= 0) die('kumot');
        }
      }
    }
    // ------------------------------------------------------------------ Silip: crickets stop, wings, she comes to the window
    function seen() { var s = g.s; s.phase = 'seen'; s.grace = lerp(2.9, 2.3, diff('s')); emit('silip_seen'); }
    function updS(dt) {
      var s = g.s, p = g.p; if (!s.on) return;
      if (s.st < 3) {
        s.t -= dt;
        if (s.t <= 0) {
          s.t = 6;
          if (roll('s') && !(s.st === 2 && critical('s'))) {
            s.st++;
            if (s.st === 1) emit('silip_near', { st: 1 });
            else if (s.st === 2) emit('silip_near', { st: 2 });
            else { if (g.house.curtain) seen(); else { s.phase = 'linger'; s.linger = 6; emit('silip_scratch'); } }
          }
        }
      } else if (s.phase === 'linger') {
        s.linger -= dt;
        if (g.house.curtain) seen();
        else if (s.linger <= 0) { s.st = 0; s.t = 10; s.phase = ''; emit('silip_leave'); }
      } else if (s.phase === 'seen') {
        s.grace -= dt; if (s.grace <= 0) die('silip');
      } else if (s.phase === 'grip') {
        if (p.holdCurtain) s.grip += dt;
        s.gripT -= dt;
        if (s.grip >= 2.0) { s.st = 0; s.t = 12; s.phase = ''; emit('silip_leave', { fought: true }); }
        else if (s.gripT <= 0) die('silip');
      }
    }
    // the wind throws the curtain open now and then (never while it is held)
    function updWind(dt) {
      if (!N.gust || !g.s.on) return;
      g.gust -= dt;
      if (g.gust <= 0) {
        g.gust = rng() * (N.gust[1] - N.gust[0]) + N.gust[0];
        emit('cue', { id: 'wind_gust', room: 'window', vol: 0.7 });
        if (!g.house.curtain && !g.p.holdCurtain) { g.house.curtain = true; emit('curtain_blown'); if (g.s.st === 3) seen(); }
      }
    }
    // ------------------------------------------------------------------ Barang: the aparador door creeps open; light drives it back
    function updB(dt) {
      var b = g.b, p = g.p; if (!b.on) return;
      var lit = p.light && p.pos === 'cabinet' && !p.travel;
      if (lit && b.st > 0) {
        b.flash += dt;
        if (b.flash >= 1.4) { b.st--; b.flash = 0; b.t = 8; b.atk = 0; emit('barang_back', { st: b.st }); }
      } else b.flash = Math.max(0, b.flash - dt * 0.5);
      if (b.st < 4) {
        b.t -= dt;
        if (b.t <= 0) {
          b.t = 7;
          if (!lit && roll('b') && !(b.st === 3 && critical('b'))) { b.st++; emit('barang_step', { st: b.st }); if (b.st === 4) b.atk = lerp(7.5, 4.2, diff('b')); }
        }
      } else if (!lit) { b.atk -= dt; if (b.atk <= 0) die('barang'); }
    }

    g.update = function (dt) {
      if (g.over) return;
      var p = g.p, h0 = g.hour();
      g.time += dt;
      if (g.hour() !== h0) emit('hour', { h: g.hour() });
      if (g.time >= g.hourSec * 6) { g.over = true; g.result = 'win'; emit('win'); return; }
      if (p.travel) {
        p.travel.left -= dt;
        if (p.travel.left <= 0) { var to = p.travel.to, fr = p.travel.from; p.travel = null; p.pos = to; emit('arrive', { to: to, from: fr }); if (to === 'bed') emit('hide'); if (fr === 'bed') emit('unhide'); }
      }
      if (p.light) { p.battery -= dt * (g.house.power ? 2.0 : 1.6); if (p.battery <= 0) { p.battery = 0; p.light = false; emit('light', { on: false }); emit('battery_dead'); } }
      if (p.holdBreath) { p.breath -= dt; if (p.breath <= 0) { p.breath = 0; p.holdBreath = false; emit('gasp'); if (g.k.st === 4 && g.k.lifted && g.k.search > 1.6) { die('kumot'); return; } } }
      else p.breath = Math.min(8, p.breath + dt * 1.6);
      if (g.blackoutAt && g.house.power && g.hour() >= g.blackoutAt) { g.house.power = false; emit('blackout'); }
      if (!g.quiet) {
        updK(dt); if (g.over) return;
        updS(dt); if (g.over) return;
        updWind(dt);
        updB(dt); if (g.over) return;
      }
      var danger = g.k.st >= 3 || (g.s.st >= 3 && g.s.phase !== 'linger') || g.b.st >= 4;
      if (danger !== g._danger) { g._danger = danger; emit('heartbeat', { on: danger }); }
    };
    emit('start', { night: g.night });
    return g;
  }
  return { create: create, NIGHTS: NIGHTS, HOUR: HOUR };
})();
if (typeof module !== 'undefined') module.exports = C1;
