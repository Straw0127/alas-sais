// Balance sim for Chapter 1 (bedroom). Bots react to what a player could hear or see.
const C1 = require('../src/logic1.js');
const DT = 1 / 30;
function bot(g, skill, st) {
  const p = g.p, k = g.k, s = g.s, b = g.b;
  st.cool -= DT; if (st.cool > 0) return; st.cool = skill.react;
  if (skill.lapse && Math.random() < skill.lapse) { st.cool = 2.0; return; }   // a human looks away, hesitates, mis-hears
  const go = (pos) => { if (p.pos === pos) return true; if (p.pos === 'bed') { g.act('unhide'); return false; } g.act('go', pos); return false; };
  const relAll = () => { g.hold('door', false); g.hold('curtain', false); g.hold('light', false); };
  if (p.travel) return;
  // 1 Kumot inside: hide and hold your breath until she leaves
  if (k.st === 4) { if (p.pos === 'bed') { g.hold('breath', true); return; } relAll(); if (go('center')) g.act('hide'); return; }
  if (p.pos === 'bed') { g.hold('breath', false); g.act('unhide'); return; }
  if (s.phase === 'seen') { relAll(); if (go('window') && g.house.curtain) g.act('curtain'); return; }
  // the most urgent of: Kumot at the door, Silip at the window, Barang out of the aparador
  const kUrg = k.st === 3 ? k.win : (k.st >= skill.door ? 30 : 99);
  const sUrg = s.st === 3 ? s.t3 : (s.st >= skill.curtain ? 40 : 99);
  const bUrg = b.st >= 4 ? b.atk : (b.st >= skill.barang ? 25 : 99);
  const m = Math.min(kUrg, sUrg, bUrg);
  if (m >= 99) { relAll(); go('center'); return; }
  if (m === bUrg) { if (p.pos !== 'cabinet') relAll(); if (go('cabinet')) g.hold('light', true); return; }
  if (m === kUrg) { if (p.pos !== 'door') relAll(); if (go('door')) g.hold('door', k.st >= skill.holdAt); return; }
  if (p.pos !== 'window') relAll(); if (go('window')) { if (g.house.curtain) g.act('curtain'); else g.hold('curtain', true); }
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
const SK = { expert: { react: 0.35, barang: 2, door: 2, curtain: 2, holdAt: 2 }, average: { react: 1.1, barang: 3, door: 2, curtain: 3, holdAt: 3, lapse: 0.06 } };
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
