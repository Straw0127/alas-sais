// Headless balance + bug test: runs every night with an idle player and a skilled bot.
const AS = require('../src/logic.js');
const DT = 1 / 30;

function bot(g, mem, skill) {
  const p = g.p, H = g.house, k = g.k, m = g.m, c = g.c, s = g.s;
  if (p.travel) return;
  mem.react = (mem.react || 0) - DT;
  if (mem.react > 0) return;
  // a human notices a new cue after a delay, and sometimes not at all
  const b = g.b;
  const sig = [k.st, m.st, c.st, s.st, H.power, b.st].join();
  if (sig !== mem.sig) { mem.sig = sig; mem.react = skill.react * (0.6 + Math.random() * 0.8); if (Math.random() < skill.miss) mem.react += 3; return; }
  const go = (r) => { if (p.room !== r) { if (p.hidden) g.act('hide'); g.act('go', r); mem.react = 0.4; return true; } return false; };
  const holdOnly = (what) => { ['door', 'breath', 'curtain', 'light'].forEach(w => g.hold(w, w === what)); };

  // 1. immediate dangers in the current room
  if (p.room === 'kitchen' && c.st === 3) { if (p.salt > 0) { g.act('salt'); return; } if (p.hidden !== 'cabinet') { g.act('hide'); } holdOnly(null); return; }
  if (p.room === 'bedroom' && k.st === 4) { if (p.hidden !== 'bed') { g.act('hide'); return; } holdOnly(k.t < 5.0 ? 'breath' : null); return; }
  if (m.st === 2) {
    if (p.room === 'living') { if (H.lights) { g.act('lights'); return; } if (p.hidden !== 'sofa') { g.act('hide'); return; } holdOnly(null); return; }
    if (['bedroom', 'kitchen'].includes(p.room) && !(p.room === 'kitchen' && c.st === 3)) { if (!p.hidden) g.act('hide'); holdOnly(null); return; }
    if (!p.hidden) { go('bedroom'); return; }
    return;
  }
  if (p.hidden && !(p.room === 'kitchen' && c.st === 3)) { g.act('hide'); return; }
  if (s.st === 4 && s.held < s.win * 0.4 + 0.3) { if (go('curtain')) return; if (H.curtain) { g.act('curtain'); return; } holdOnly('curtain'); return; }
  if (k.st === 3 && k.held < k.win * 0.5 + 0.3) { if (go('bedroom')) return; if (!H.door) { g.act('door'); return; } holdOnly('door'); return; }
  if (b.st >= 3 && p.battery > 3) { if (go('bedroom')) return; holdOnly('light'); return; }
  const pw = H.power || g.dark;
  if (pw && !H.fan && !H.fanB && p.energy < 35) { const r = p.room === 'living' || p.room === 'kitchen' ? 'living' : 'bedroom'; if (go(r)) return; g.act('fan'); return; }
  if (m.st === 1) { if (go('living')) return; if (g.dark) { holdOnly('light'); return; } g.act('tv'); mem.react = 0.3; return; }
  if (c.st === 2 && p.salt > 0) { if (go('kitchen')) return; g.act('salt'); return; }
  if (!H.power && !g.dark) { if (go('kitchen')) return; mem.puz = (mem.puz || 0) + DT; if (mem.puz > skill.puzzle) { mem.puz = 0; if (Math.random() < skill.puzzleOk) g.act('breaker'); else g.act('breaker_fail'); } return; }
  // 2. maintenance: check the curtain every ~12 s or when the crickets stop
  mem.lastCheck = mem.lastCheck || 0;
  if (g.level('silip') > 0 && (H.cricketsOff > 0 || g.time - mem.lastCheck > skill.check)) {
    if (go('curtain')) return;
    if (!H.curtain) { g.act('curtain'); mem.react = 0.5; return; }
    if (s.st >= 1 && s.st <= 3) { holdOnly('light'); return; }
    holdOnly(null); g.act('curtain'); mem.lastCheck = g.time; return;
  }
  // sanity: the sala fan switched itself off and sanity is not full: go switch it back on
  if (pw && !H.fan && p.energy < 75) { if (go('living')) return; g.act('fan'); return; }
  // 3. rest in the bedroom with the door closed, the bedroom fan running while you need it
  if (go('bedroom')) return;
  if (!H.door) { g.act('door'); return; }
  if (pw && !H.fanB) { g.act('fan'); return; }
  if (b.st >= 2 && p.battery > 8) { holdOnly('light'); return; }
  holdOnly(null);
}

function run(night, seed, skill) {
  const useBot = !!skill;
  const g = AS.create(night, { seed, chapter: 3 });
  const mem = {};
  let steps = 0;
  try {
    while (!g.over && steps < 60 * 60 * 30) {
      if (useBot) bot(g, mem, skill);
      g.update(DT); g.events.length = 0; steps++;
    }
  } catch (e) { return { err: e.stack }; }
  return { won: g.won, dead: g.dead, t: g.time };
}

let fail = false;
for (let n = 0; n < 7; n++) {
  for (const [label, skill] of [['idle', null], ['expert', { react: 0.35, miss: 0.0, check: 12, puzzle: 4, puzzleOk: 0.9 }], ['average', { react: 1.0, miss: 0.08, check: 16, puzzle: 6, puzzleOk: 0.65 }]]) {
    let wins = 0; const deaths = {}; const SEEDS = 80;
    for (let sd = 1; sd <= SEEDS; sd++) {
      const r = run(n, sd * 7919 + n, skill);
      if (r.err) { console.log('ERROR', r.err); fail = true; break; }
      if (r.won) wins++; else deaths[r.dead] = (deaths[r.dead] || 0) + 1;
    }
    console.log(`Ch3 Night ${n + 1} ${label.padEnd(7)}: win ${(wins / SEEDS * 100).toFixed(0)}%  deaths ${JSON.stringify(deaths)}`);
  }
}
process.exit(fail ? 1 : 0);
