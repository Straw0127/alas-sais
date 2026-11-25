// Balance sim for Chapter 1 (bedroom). Bots react to what a player could hear or see.
const C1 = require('../src/logic1.js');
const DT = 1 / 30;
function bot(g, skill, st) {
  const p = g.p, k = g.k, s = g.s, b = g.b;
  st.cool -= DT; if (st.cool > 0) return; st.cool = skill.react;
  const go = (pos) => { if (p.pos === pos) return true; if (p.pos === 'bed') { g.act('unhide'); return false; } g.act('go', pos); return false; };
  const relAll = () => { g.hold('door', false); g.hold('curtain', false); g.hold('light', false); };
  if (p.travel) return;
  // 1 Kumot inside
  if (k.st === 4) { if (p.pos === 'bed') { g.hold('breath', k.warned && k.search < 5.2); return; } relAll(); if (go('center')) g.act('hide'); return; }
  if (p.pos === 'bed') { g.hold('breath', false); g.act('unhide'); return; }
  // 2 Silip at an open window / gripping
  if (s.phase === 'seen' || s.phase === 'grip') { relAll(); if (go('window')) { if (g.house.curtain) g.act('curtain'); else g.hold('curtain', true); } return; }
  // 3 Barang about to come out
  if (b.st >= 4 || (b.st >= skill.barang && !(k.st === 3 && p.pos === 'door'))) { if (p.pos !== 'cabinet') relAll(); if (go('cabinet')) g.hold('light', true); return; }
  if (p.pos === 'cabinet' && p.light && b.st > 0) return; else g.hold('light', false);
  // 4 Kumot at the door / near
  if (k.st === 3 && p.pos === 'door') { g.hold('door', true); return; }
  if (k.st >= skill.door) { if (go('door')) g.hold('door', k.st === 3); return; }
  g.hold('door', false);
  // 5 curtain blown open
  if (g.house.curtain) { if (go('window')) g.act('curtain'); return; }
  // 6 sometimes the average player wanders / checks late
  if (skill.lazy && Math.random() < 0.02) { go(['door', 'window', 'cabinet'][Math.floor(Math.random() * 3)]); return; }
  go('center');
}
function run(n, skill) {
  const res = { win: 0, deaths: {} };
  for (let i = 0; i < 80; i++) {
    const g = C1.create(n, { seed: 1000 + i * 7 }); const st = { cool: 0 };
    while (!g.over) { if (skill) bot(g, skill, st); g.update(DT); g.events = []; }
    if (g.result === 'win') res.win++; else { const w = (g.lastDeath || 'x'); }
  }
  return res;
}
const SK = { expert: { react: 0.35, barang: 2, door: 2 }, average: { react: 0.9, barang: 3, door: 2, lazy: true } };
for (let n = 0; n < 5; n++) {
  for (const [name, sk] of [['idle', null], ['expert', SK.expert], ['average', SK.average]]) {
    const deaths = {}; let win = 0;
    for (let i = 0; i < 80; i++) {
      const g = C1.create(n, { seed: 1000 + i * 7 }); const st = { cool: 0 }; let who = null;
      while (!g.over) { if (sk) bot(g, sk, st); g.update(DT); for (const e of g.events) if (e.type === 'death') who = e.data.who; g.events = []; }
      if (g.result === 'win') win++; else deaths[who] = (deaths[who] || 0) + 1;
    }
    console.log(`Night ${n + 1} ${name.padEnd(7)}: win ${Math.round(win / 80 * 100)}%  deaths ${JSON.stringify(deaths)}`);
  }
}
