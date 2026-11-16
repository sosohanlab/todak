const fs=require('fs'),assert=require('assert'),{chromium}=require('C:/Users/pppoi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  for(const width of (process.argv.includes('--mobile')?[390]:process.argv.includes('--assert')?[1200,390]:[1200])){
   const p=await b.newPage({viewport:{width,height:880},locale:'ko-KR',hasTouch:width<600,isMobile:width<600});p.setDefaultTimeout(12000);
   p.on('pageerror',e=>console.error('page:',e.message));p.on('console',m=>{if(m.type()==='warning'||m.type()==='error')console.log(m.text().slice(0,220))});
   await p.route('http://127.0.0.1:8770/?screen=11',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(__dirname+'/index.html','utf8').replace('if(hot&&hot.ready){hot.ready(start);}',"window.finishedQA={st:st,data:photoData,refresh:function(){dirty=true;pvKey='';}};if(hot&&hot.ready){hot.ready(start);}")}));
   await p.goto('http://127.0.0.1:8770/?screen=11',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.TodakLayoutPreview?.readyScene==='11');await p.waitForFunction(()=>window.TodakPhoto?.available);
   if(process.argv.includes('--ribbed'))await p.evaluate(()=>{const s=finishedQA.st;s.height=8;s.floor=3;s.radii=s.radii.map((_,i,a)=>{let t=i/(a.length-1);return 6+2*Math.sin(Math.PI*t*.85)+.10*Math.sin(i*2.8)});s.inner=s.radii.map(r=>r-2.4);finishedQA.refresh()});
   await p.waitForTimeout(200);await p.screenshot({path:__dirname+'/finished-'+width+'-photo.png'});
   await p.locator('#ui-result-360').check();const c=p.locator('#finished360Canvas'),r=await c.boundingBox();const before=await p.evaluate(()=>TodakFinished360.state());
   await p.mouse.move(r.x+r.width*.5,r.y+r.height*.5);await p.mouse.down();await p.mouse.move(r.x+r.width*.5+85,r.y+r.height*.5+25,{steps:8});await p.mouse.up();
   const after=await p.evaluate(()=>TodakFinished360.state());assert.notEqual(after.yaw,before.yaw);assert.notEqual(after.pitch,before.pitch);
   if(width<600){const cd=await p.context().newCDPSession(p),old=await p.evaluate(()=>TodakFinished360.state());await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width*.5,y:r.y+r.height*.4}]});await cd.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:r.x+r.width*.5+50,y:r.y+r.height*.4+20}]});await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.notEqual((await p.evaluate(()=>TodakFinished360.state())).yaw,old.yaw,'touch must rotate');await cd.detach();}
   await p.locator(width<600?'#ui-orbit-right':'#rotR').click();assert((await p.evaluate(()=>TodakFinished360.state())).yaw>after.yaw,'arrow must rotate inline work');
   await p.screenshot({path:__dirname+'/finished-'+width+'-360.png'});
   await p.locator('#ui-result-360').uncheck();assert(await c.isHidden());
   await p.evaluate(async()=>{const d=finishedQA.data();const sample=t=>d.rAt(t),inside=t=>d.innerAt(t);const n=56;window.savedFixture={id:'orbit-test',name:'회전 시험',c:d.color,shape:{h:d.height,r:Array.from({length:14},(_,i)=>sample(i/13))},full2:{radii:Array.from({length:n},(_,i)=>sample(i/(n-1))),inner:Array.from({length:n},(_,i)=>inside(i/(n-1))),floor:d.floor}};await TodakFinished360.openSaved(savedFixture)});
   assert(await c.isVisible(),'saved viewer must restore canvas after leaving inline view');const sr=await c.boundingBox(),sb=await p.evaluate(()=>TodakFinished360.state());await p.mouse.move(sr.x+sr.width*.5,sr.y+sr.height*.5);await p.mouse.down();await p.mouse.move(sr.x+sr.width*.5+65,sr.y+sr.height*.5+15,{steps:5});await p.mouse.up();assert.notEqual((await p.evaluate(()=>TodakFinished360.state())).yaw,sb.yaw);
   await p.locator('#closeFinished360').click();console.log('PASS '+width+' drag, arrows, photo return, saved-work drag after inline exit');await p.close();
  }
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});



