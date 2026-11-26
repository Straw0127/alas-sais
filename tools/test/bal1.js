// Each Chapter 1 entity alone at the same odds: how fast it comes, and how long you have once you can notice it
const C1 = require('../src/logic1.js'); const DT = 1 / 30;
const P = +(process.argv[2] || 0.35);
for (const who of ['k', 's', 'b']) {
  const N = { [who]: [1], P: { [who]: P, fan: 0 } };
  const T = { 1: [], 2: [], 3: [], 4: [], d: [] }; let wins = 0;
  for (let i = 0; i < 200; i++) {
    const g = C1.create(0, { seed: 77 + i * 13, custom: N }); const e = g[who]; let last = 0, seen = {};
    while (!g.over && g.time < 400) { g.update(DT); g.events = []; if (e.st > last) { if (!seen[e.st]) { seen[e.st] = 1; T[e.st] && T[e.st].push(g.time); } } last = e.st; }
    if (g.result === 'death') T.d.push(g.time); else wins++;
  }
  const avg = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(0) : '-';
  console.log(who, 'st1', avg(T[1]), 'st2', avg(T[2]), 'st3', avg(T[3]), 'st4', avg(T[4]), 'kill', avg(T.d), 'survived(idle)', wins);
}
