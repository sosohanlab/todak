const fs=require('fs'),assert=require('node:assert/strict'),{chromium}=require('C:/Users/pppoi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 for(const width of [390,1200])for(const scene of ['04','05','06']){
  const p=await b.newPage({viewport:{width,height:900},locale:'ko-KR'});p.setDefaultTimeout(12000);const errors=[];p.on('pageerror',e=>errors.push(e.message));
  const url='http://127.0.0.1:8770/?screen='+scene;
  await p.route(url,r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(__dirname+'/index.html','utf8').replace('if(hot&&hot.ready){hot.ready(start);}',"window.strokeQA={point:function(){var w=TodakWheel,l=w.top()?w.layout():w.bottom()?w.bottomLayout():null;return l?{x:l.x+l.r*.1,y:l.y+l.r*.1}:{x:CX+rAt(.6)*SV*.1,y:BASE-st.height*.6*SV};},view:function(){return {W:W,HC:HC};},hashes:function(){return [paint,carve,TodakWheel.layer,TodakWheel.bottomLayer,TodakWheel.bottomRelief].map(function(l){var a=l.x.getImageData(0,0,l.c.width,l.c.height).data,h=2166136261;for(var i=0;i<a.length;i++){h^=a[i];h=Math.imul(h,16777619);}return h>>>0;});}};if(hot&&hot.ready){hot.ready(start);}")}));
  await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForFunction(s=>window.TodakLayoutPreview?.readyScene===s,scene);await p.waitForTimeout(120);
  const before=await p.evaluate(()=>strokeQA.hashes()),point=await p.evaluate(()=>{const q=strokeQA.point(),v=strokeQA.view(),r=document.getElementById('cv').getBoundingClientRect();return{x:r.left+q.x*r.width/v.W,y:r.top+q.y*r.height/v.HC}});
  await p.mouse.move(point.x,point.y);const started=Date.now();await p.mouse.down();await p.mouse.move(point.x+24,point.y+16,{steps:3});await p.mouse.up();const elapsed=Date.now()-started;await p.waitForTimeout(120);
  const after=await p.evaluate(()=>strokeQA.hashes()),parts=(await p.evaluate(()=>TodakLayoutPreview.history())).undo;assert.notDeepEqual(after,before,'stroke must change the actual decoration');assert(parts>=1);if(elapsed<350)assert.equal(parts,1,'a short drag is one step');
  if(!(await p.locator('#sheet').getAttribute('class')).includes('open'))await p.locator('#sheetToggle').click();
  for(let i=0;i<parts;i++)await p.locator('#ui-undo').click();assert.deepEqual(await p.evaluate(()=>strokeQA.hashes()),before,'exact image undo across all 400ms checkpoints');for(let i=0;i<parts;i++)await p.locator('#ui-redo').click();assert.deepEqual(await p.evaluate(()=>strokeQA.hashes()),after,'exact image redo');assert.deepEqual(errors,[]);
  console.log('PASS '+width+' scene '+scene+' single-drag history and all-layer undo/redo');await p.close();
 }
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
