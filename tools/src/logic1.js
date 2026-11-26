// Chapter 1 — Lola's bedroom. Pure rules, no DOM. The player never leaves the room.
// Spots: center, door, window, cabinet, bed (under the bed). Entities: Kumot (door), Silip (curtain), Barang (aparador).
var C1 = (function () {
  var HOUR = 70;                                    // 6 hours x 70 s = a 7-minute night
  // AI levels (0-20) per night for [12-2 AM, 2-4 AM, 4-6 AM]; null = not active
  var NIGHTS = [
    // chance per check that it moves (k: door, s: window, b: aparador) and that the e-fan switches itself off
    { k: [1], P: { k: 0.50, fan: 0.82 } },
    { k: [1], s: [1], P: { k: 0.35, s: 0.40, fan: 0.84 } },
    { s: [1], b: [1], P: { s: 0.35, b: 0.40, fan: 0.85 } },   // night 3: window and aparador only, no door
    { k: [1], s: [1], b: [1], P: { k: 0.30, s: 0.42, b: 0.25, fan: 0.86 } },
    { k: [1], s: [1], b: [1], P: { k: 0.45, s: 0.30, b: 0.25, fan: 0.84 }, blackout: 4 }
  ];
  var MOVE = { center: { door: 0.45, window: 0.45, cabinet: 0.5, bed: 0.55 } };
  // walking inside Lola's room: the length of each walking clip, at a brisk pace (x0.8). The bed is a crawl, not a walk.
  var WALK1 = {"cabinet-center": 2.87, "cabinet-door": 1.25, "cabinet-window": 1.7, "center-cabinet": 2.52, "center-door": 2.23, "center-window": 2.03, "door-cabinet": 1.21, "door-center": 3.04, "door-window": 1.9, "window-cabinet": 1.86, "window-center": 2.27, "window-door": 1.52};
  function moveTime(a, b) { if (a === b) return 0; var w = WALK1[a + '-' + b]; if (w) return Math.max(0.7, w * 0.4); if (a === 'center') return MOVE.center[b]; if (b === 'center') return MOVE.center[a]; return MOVE.center[a] + MOVE.center[b] - 0.1; }
  function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }

  function create(nightIdx, opt) {
    opt = opt || {};
    var N = opt.custom || NIGHTS[nightIdx];
    var seed = (opt.seed || (Date.now() & 0xffff)) >>> 0;
    var rng = opt.rng || function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    var g = {
      chapter: 1, night: nightIdx + 1, hourSec: opt.hourSec || HOUR, time: 0, over: false, result: null, events: [], quiet: false,
      p: { pos: 'center', travel: null, holdDoor: false, holdCurtain: false, light: false, holdBreath: false, battery: 100, breath: 18, breathMax: 18, peek: 0, energy: 100 },
      house: { curtain: false, power: true, fan: false },
      k: { on: !!N.k, st: 0, t: 6, win: 0, held: 0, grace: 0, search: 0, lifted: false, warned: false, slip: 0 },
      s: { on: !!N.s, st: 0, t: 8, phase: '', grace: 0, held: 0, t3: 0 },
      b: { on: !!N.b, st: 0, t: 9, flash: 0, atk: 0 },
      gust: N.gust ? rng() * (N.gust[1] - N.gust[0]) + N.gust[0] : 0,
      blackoutAt: N.blackout || 0, N: N
    };
    function emit(type, data) { g.events.push({ type: type, data: data || {} }); }
    g.emit = emit;
    var EASE = 0.4;   // story difficulty (easier): tense but fair (custom nights are not eased)
    function level(who) { var L = N[who]; if (!L) return 0; var h = g.hour(); return Math.round(L[h < 2 ? 0 : h < 4 ? 1 : 2] * EASE); }
    function diff(who) { return N.P ? (N.P[who] || 0) * 0.6 : level(who) / 20; }
    function roll(who, mul) { return N.P ? rng() < Math.min(0.95, (N.P[who] || 0) * (mul || 1)) : rng() * 20 < level(who); }
    // fairness: on the early nights only one thing comes for you at a time; later, at most two
    function critical(except) {
      var n = (except !== 'k' && g.k.st >= 3 ? 1 : 0) + (except !== 's' && g.s.st >= 3 ? 1 : 0) + (except !== 'b' && g.b.st >= 4 ? 1 : 0);
      return n >= (g.night >= 3 ? 2 : 1);
    }
    g.hour = function () { return Math.min(5, Math.floor(g.time / g.hourSec)); };
    g.clock = function () { var h = g.hour(); var m = Math.floor((g.time - h * g.hourSec) / g.hourSec * 60); return { h: h === 0 ? 12 : h, m: m }; };
    g.level = function (who) { return level(who); };
    g.at = function (pos) { return !g.p.travel && g.p.pos === pos; };
    // ENERGY: staying awake. It drains slowly all night (more slowly in a blackout, when the fan can't run); the fan
    // brings it back. At zero you drop asleep where you stand, and Kumot sits on you: bangungot.
    // SANITY and the e-fan (like the music box in FNAF 2): it runs all night but now and then switches itself off (rarely on
    // nights 1-2, sometimes on 3-5). Switch it back on (one tap, no holding). Running: sanity slowly comes back. Off: it drains;
    // at zero you faint and Kumot gives you bangungot. A blackout stops it until the power is back.
    var tier = g.night <= 2 ? 0 : g.night <= 5 ? 1 : 2;
    var GAP = [[150, 240], [70, 115], [36, 60]][tier];
    function gap() { return GAP[0] + rng() * (GAP[1] - GAP[0]); }
    g.house.fan = true; g.fanNext = { fan: N.P ? 20 : 18 + rng() * 20 + gap() * 0.6 };
    var S_UP = 2.5, S_DRAIN = 100 / 65;
    function energy(dt) {
      var p = g.p, e0 = p.energy, H = g.house;
      if (g.time >= g.fanNext.fan) { g.fanNext.fan = g.time + (N.P ? 45 : gap()); if (H.fan && H.power && (!N.P || rng() < (N.P.fan || 0))) { H.fan = false; emit('fan', { on: false, which: 'fan', auto: true }); } }   // every 24 s a chance it goes off
      if (H.fan && H.power) p.energy = Math.min(100, p.energy + dt * S_UP);
      else p.energy = Math.max(0, p.energy - dt * S_DRAIN * (H.power ? 1 : 0.3));
      if (e0 > 30 && p.energy <= 30) emit('tired', { lvl: 1 });
      if (e0 > 12 && p.energy <= 12) emit('tired', { lvl: 2 });
      if (e0 <= 30 && p.energy > 30) emit('tired', { lvl: 0 });
      if (p.energy <= 0) { die('bangungot'); return true; }
      return false;
    }
    function die(who) { if (g.over) return; g.over = true; g.result = 'death'; emit('death', { who: who }); }

    // ------------------------------------------------------------------ player
    g.act = function (a, arg) {
      if (g.over) return false;
      var p = g.p;
      if (g.k.st === 4 && p.pos === 'bed' && g.k.search > 0 && a !== 'none') { die('kumot'); return false; } // any movement while she searches
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
        case 'fan':   // the stand fan in the corner: on, it gives you back your strength (but its hum covers small sounds)
          if (p.pos !== 'center') return false;
          if (!g.house.power) { emit('fan_nopower'); return false; }
          if (g.house.fan) return false;
          g.house.fan = true; g.fanNext.fan = g.time + (N.P ? 45 : gap()); emit('fan', { on: true, which: 'fan' }); return true;
        case 'curtain':
          if (p.pos !== 'window') return false;
          if (g.house.curtain) { g.house.curtain = false; emit('curtain_close'); if (g.s.phase === 'seen') { g.s.phase = ''; emit('silip_grip'); } }
          else { g.house.curtain = true; emit('curtain_open'); if (g.s.st === 3) seen(); }
          return true;
        case 'peek':   // flashlight down the hall through the gap: on until you switch it off (double-tap again)
          if (p.pos !== 'door') return false;
          if (p.peek > 0) { p.peek = 0; emit('peek_off'); return true; }
          if (p.holdDoor || p.battery <= 0) return false;
          p.peek = 1; p.peekSt = g.k.on ? Math.min(3, g.k.st) : 0; p.battery = Math.max(0, p.battery - 1); emit('peek', { st: p.peekSt });
          if (g.k.on && g.k.st >= 1 && g.k.st <= 2) { g.k.flashN = (g.k.flashN || 0) + 1; if (g.k.flashN >= 2) { g.k.flashN = 0; g.k.st = 0; g.k.t = 9; emit('kumot_back'); } }   // light her up twice in the hall: she goes back
          if (g.k.st === 3) { g.k.win = Math.min(g.k.win, 1.1); emit('kumot_startled'); }   // she was right there: she shoves
          return true;
      }
      return false;
    };
    function releaseAll() { var p = g.p; if (p.peek > 0) { p.peek = 0; emit('peek_off'); } if (p.holdDoor) { p.holdDoor = false; emit('door_release'); } p.holdCurtain = false; p.holdBreath = false; if (p.light) { p.light = false; emit('light', { on: false }); } }
    g.hold = function (what, on) {
      var p = g.p; if (g.over || p.travel) { if (!on) { p.holdDoor = p.holdCurtain = p.holdBreath = false; p.light = false; } return; }
      if (what === 'door') {
        var v = !!on && p.pos === 'door';
        if (v && !p.holdDoor) { emit('door_shut'); p.peek = 0; }
        if (!v && p.holdDoor) emit('door_release');
        p.holdDoor = v;
      } else if (what === 'curtain') p.holdCurtain = !!on && p.pos === 'window' && !g.house.curtain;
      else if (what === 'breath') { var b = !!on && p.pos === 'bed' && p.breath > 0.05; if (b && !p.holdBreath) emit('breath_in'); p.holdBreath = b; }
      else if (what === 'light') { var l = !!on && p.battery > 0 && p.pos !== 'bed'; if (l !== p.light) emit('light', { on: l }); p.light = l; }
    };

    // ------------------------------------------------------------------ Kumot: footsteps in the hall, breathing at the door
    function updK(dt) {
      var k = g.k, p = g.p; if (!k.on) return;
      var holding = p.holdDoor && p.pos === 'door' && !p.travel;
      if (k.st >= 2 && k.st < 4 && holding) {          // shut in her face: about five seconds and she gives up
        k.held += dt;
        if (k.held > 0.8 && !k.rattled) { k.rattled = true; emit('cue', { id: 'handle_rattle', room: 'door', vol: 0.9 }); }
        if (k.held >= lerp(4.5, 6, diff('k'))) { k.st = 0; k.t = 8; k.held = 0; k.rattled = false; emit('kumot_leave'); return; }
      }
      if (k.st < 3) {
        k.t -= dt;
        if (k.t <= 0) {
          k.t = 5.5;   // balance: she is the hardest to notice (sound and a far shadow only)
          if (!(k.st === 2 && (holding || critical('k'))) && roll('k')) {
            k.st++;
            k.flashN = 0;
            if (k.st === 1) emit('cue', { id: 'scuffs_far', room: 'hall', vol: 0.55 });
            else if (k.st === 2) emit('cue', { id: 'scuffs_near', room: 'hall', vol: 0.85 });
            else { k.win = lerp(10, 6, diff('k')); emit('kumot_door'); }
          }
        }
      } else if (k.st === 3) {
        if (!holding) k.win -= dt;                        // she cannot push in while you hold it
        if (k.win <= 0) { k.st = 4; k.rattled = false; k.grace = 2.4; k.search = 0; k.lifted = false; k.warned = false; k.slip = 0; k.held = 0; emit('kumot_enter', { open: true }); }
      } else if (k.st === 4) {
        if (p.pos === 'bed' && !p.travel) {
          if (!k.search) { k.search = 15; emit('kumot_search'); }
          k.search -= dt;
          if (!k.warned) { k.warned = true; emit('lift_warn'); }
          if (k.search < 13.6 && k.search > 0.4) {        // she is listening by the bed: keep holding your breath
            if (!k.lifted) { k.lifted = true; emit('lift'); }
            if (!p.holdBreath) { k.slip += dt; if (k.slip > 0.45) { emit('gasp'); die('kumot'); return; } } else k.slip = Math.max(0, k.slip - dt * 0.5);
          }
          if (k.search <= 0) { k.st = 0; k.t = 10; k.search = 0; emit('kumot_leave', { inside: true }); }
        } else if (!(p.travel && p.travel.to === 'bed')) {
          k.grace -= dt; if (k.grace <= 0) die('kumot');
        }
      }
    }
    // ------------------------------------------------------------------ Silip: crickets stop, wings, she comes to the window
    function seen() { var s = g.s; s.phase = 'seen'; s.grace = lerp(1.9, 1.4, diff('s')); emit('silip_seen'); }
    function updS(dt) {
      var s = g.s, p = g.p; if (!s.on) return;
      var holding = p.holdCurtain && p.pos === 'window' && !g.house.curtain && !p.travel;
      if (s.phase === 'seen') { s.grace -= dt; if (s.grace <= 0) die('silip'); return; }
      if (s.st >= 2 && holding) {                         // hold the curtain shut until she flies off
        s.held += dt;
        if (s.held >= 5) { s.st = 0; s.t = 10; s.held = 0; emit('silip_leave', { fought: true }); return; }
      }
      var watching = p.pos === 'window' && !p.travel && g.house.curtain && s.st >= 1 && s.st < 3;
      if (watching) { s.stare = (s.stare || 0) + dt; if (s.stare >= 6) { s.stare = 0; s.st--; s.t = 8; if (s.st === 0) emit('silip_leave', { fought: true }); else emit('silip_near', { st: s.st }); return; } }
      else s.stare = Math.max(0, (s.stare || 0) - dt * 0.5);
      if (s.st < 3) {
        s.t -= dt;
        if (s.t <= 0) {
          s.t = 6;
          if (!watching && !(s.st === 2 && (holding || critical('s'))) && roll('s', g.house.curtain && p.pos !== 'window' ? 1.5 : 1)) {
            s.st++;
            if (s.st < 3) emit('silip_near', { st: s.st });
            else { s.t3 = lerp(17, 12, diff('s')); emit('silip_scratch'); if (g.house.curtain) seen(); }
          }
        }
      } else {
        if (!holding) { s.t3 -= dt; if (s.t3 <= 0) { emit('silip_tear'); die('silip'); } }
      }
    }
    function updWind() {}
    // ------------------------------------------------------------------ Barang: the aparador door creeps open; light drives it back
    function updB(dt) {
      var b = g.b, p = g.p; if (!b.on) return;
      var lit = p.light && p.pos === 'cabinet' && !p.travel;
      if (lit && !b.wasLit && b.st > 0) { b.flashN = (b.flashN || 0) + 1; if (b.flashN >= 2) { b.flashN = 0; b.st--; b.flash = 0; b.t = 8; b.atk = 0; emit('barang_back', { st: b.st }); } }
      b.wasLit = lit;
      if (lit && b.st > 0) {
        b.flash += dt;
        if (b.flash >= 1.4) { b.st--; b.flash = 0; b.t = 8; b.atk = 0; emit('barang_back', { st: b.st }); }
      } else b.flash = Math.max(0, b.flash - dt * 0.5);
      if (b.st < 4) {
        b.t -= dt;
        if (b.t <= 0) {
          b.t = 9;   // balance: seen from anywhere in the room, but the last step gives you little time
          if (!lit && roll('b') && !(b.st === 3 && critical('b'))) { b.st++; emit('barang_step', { st: b.st }); if (b.st === 4) b.atk = 2.2; }   // fully open: about two seconds to get your light on her
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
      if (p.light) { p.battery -= dt * (g.house.power ? 0.6 : 0.5); if (p.battery <= 0) { p.battery = 0; p.light = false; emit('light', { on: false }); emit('battery_dead'); } }
      if (p.peek > 0) {   // the light is on down the hall: it drains, and shows her wherever she moves to
        p.battery -= dt * 0.7;
        if (p.battery <= 0) { p.battery = 0; p.peek = 0; emit('peek_off'); emit('battery_dead'); }
        else { var ps = g.k.on ? Math.min(3, g.k.st) : 0; if (ps !== p.peekSt) { p.peekSt = ps; emit('peek', { st: ps, moved: true }); } }
      }
      if (p.holdBreath) { p.breath -= dt; if (p.breath <= 0) { p.breath = 0; p.holdBreath = false; emit('gasp'); } }
      else p.breath = Math.min(p.breathMax, p.breath + dt * 2.2);
      if (g.blackoutAt && g.house.power && g.hour() >= g.blackoutAt) { g.house.power = false; emit('blackout'); }
      if (!g.quiet && energy(dt)) return;
      if (!g.quiet) {
        updK(dt); if (g.over) return;
        updS(dt); if (g.over) return;
        updWind(dt);
        updB(dt); if (g.over) return;
      }
      var danger = g.k.st >= 3 || g.s.st >= 3 || g.b.st >= 4;
      if (danger !== g._danger) { g._danger = danger; emit('heartbeat', { on: danger }); }
    };
    emit('start', { night: g.night });
    return g;
  }
  return { create: create, NIGHTS: NIGHTS, HOUR: HOUR };
})();
if (typeof module !== 'undefined') module.exports = C1;
