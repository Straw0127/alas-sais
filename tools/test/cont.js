const p=require('puppeteer-core');(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--mute-audio']});const g=await b.newPage();
await g.goto('http://localhost:8765/');await g.evaluate(()=>{localStorage.setItem('alassais',JSON.stringify({prog:{c1:5,c2:3,c3:0},cur:{ch:2,n:4},custom:{},pro:{c1:true},set:{lang:'fil'}}));window.__AS_NOCALL=1});
await g.reload();await new Promise(r=>setTimeout(r,1500));await g.evaluate(()=>window.__AS_NOCALL=1);
console.log('before:',await g.$eval('#m-cont small',e=>e.textContent));
await g.evaluate(()=>document.getElementById('m-new').click());await new Promise(r=>setTimeout(r,1500));
console.log('saved:',await g.evaluate(()=>localStorage.getItem('alassais').match(/"cur":\{[^}]*\}/)[0]));
await g.reload();await new Promise(r=>setTimeout(r,1500));
console.log('after:',await g.$eval('#m-cont small',e=>e.textContent));await b.close();})();
