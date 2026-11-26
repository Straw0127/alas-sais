const puppeteer=require('puppeteer-core');
(async()=>{const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
for (const [w,h,n] of [[412,915,'port'],[915,412,'land']]){
const p=await b.newPage(); await p.setViewport({width:w,height:h,isMobile:true,hasTouch:true,deviceScaleFactor:1});
await p.goto('http://localhost:8765/index.html'); await p.waitForSelector('#load-go',{visible:true,timeout:60000}); await new Promise(r=>setTimeout(r,500));
await p.tap('#load-go'); await new Promise(r=>setTimeout(r,800)); await p.screenshot({path:'/tmp/w_'+n+'.png'});
await p.tap('#warn-go'); await new Promise(r=>setTimeout(r,1500)); await p.screenshot({path:'/tmp/m_'+n+'.png'});}
await b.close();})();
