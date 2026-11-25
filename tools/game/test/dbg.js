const AS=require('../src/logic.js');const fs=require('fs');
const src=fs.readFileSync('test/sim.js','utf8');
eval(src.split('function run(')[0].replace("const AS = require('../src/logic.js');",''));
const DT=1/30; let out={};
for(let sd=1;sd<=40;sd++){const g=AS.create(4,{seed:sd*31});const mem={};let log=[];
 while(!g.over){bot(g,mem,{react:0.35,miss:0,check:12});g.update(DT);
  for(const e of g.events){ if(['silip_glass','silip_back','crickets_off','death','kumot_door','malik_static','kal_near'].includes(e.type)) log.push(e.t.toFixed(1)+':'+e.type+(e.data.stage!==undefined?e.data.stage:'')+'@'+g.p.room+(g.house.curtain?'(open)':''));}
  g.events.length=0;}
 if(g.dead==='silip'){const key=`st${g.s.st} held${g.s.held.toFixed(1)} room ${g.p.room} curtain ${g.house.curtain} k${g.k.st} m${g.m.st} c${g.c.st}`;out[key]=(out[key]||0)+1; if(sd<4) console.log(log.slice(-8).join(' | '));}}
console.log(out);
