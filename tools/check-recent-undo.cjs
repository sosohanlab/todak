const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/pppoi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.argv.includes('--live')?'https://todak.sosohanlab.com':'http://127.0.0.1:8771',reproduce=process.argv.includes('--reproduce');
const fixture=`window.recentUndoQA={free:startFree,stage:setStage,challenge:function(){startChallenge('bowl');closeOverlays();$('chRules').hidden=true;},rough:function(on){st.target='bowl';st.height=7.5;st.floor=1;st.radii=Array.from({length:N},function(_,i){return TARGETS.bowl.f(i/(N-1))+(on?(i%2?.13:-.13):0);});st.inner=st.radii.map(function(r){return r-.8;});syncControls();updateReadout();TodakLayoutPreview.sync();TodakResponsive.refresh();dirty=true;},point:function(){var l=TodakWheel.top()?TodakWheel.layout():TodakWheel.bottom()?TodakWheel.bottomLayout():null;var r=cv.getBoundingClientRect();return{x:r.left+(l?l.x:CX+rAt(.6)*SV*.25)*r.width/W,y:r.top+(l?l.y:BASE-st.height*.6*SV)*r.height/HC};},state:function(){return{r:st.radii.slice(),touches:st.touches,stage:st.stage,rough:roughPts()};},hash:function(){return [paint,carve,TodakWheel.layer,TodakWheel.bottomLayer,TodakWheel.bottomRelief].map(function(l){var a=l.x.getImageData(0,0,l.c.width,l.c.height).data,h=2166136261;for(var i=0;i<a.length;i++){h^=a[i];h=Math.imul(h,16777619);}return h>>>0;});}};`;
fs.mkdirSync('output/recent-undo',{recursive:true});
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),report=[];try{
for(const [width,height]of reproduce?[[390,844]]:[[320,568],[390,844],[768,1024],[844,390],[1440,900]]){
 const p=await b.newPage({viewport:{width,height},locale:'ko-KR'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*clarity.ms/**',r=>r.fulfill({body:''}));const html=process.argv.includes('--live')?await (await p.request.get(base+'/?undo_asset=1')).text():fs.readFileSync('release-site/index.html','utf8');
 await p.route(base+'/?recent_undo=1',r=>r.fulfill({contentType:'text/html',body:html.replace('if(hot&&hot.ready){hot.ready(start);}',fixture+'\nif(hot&&hot.ready){hot.ready(start);}')}));
 await p.goto(base+'/?recent_undo=1',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.recentUndoQA);await p.locator('#goFree').click();
 for(const rough of [true,false,true]){
  await p.evaluate(on=>recentUndoQA.rough(on),rough);await p.waitForTimeout(150);if(width<600)await p.locator('#sheetGrab').focus().then(()=>p.keyboard.press('Home'));await p.waitForTimeout(80);
  const layout=await p.evaluate(()=>{const panel=document.getElementById('p-throw'),s=getComputedStyle(panel),pr=panel.getBoundingClientRect(),buttons=[...document.querySelectorAll('#tools button')].filter(e=>e.getClientRects().length);return{rough:recentUndoQA.state().rough,columns:s.gridTemplateColumns,children:[...panel.children].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return{id:e.id,left:r.left,width:r.width,right:r.right};}),panel:{left:pr.left,right:pr.right},tools:buttons.map(e=>{const r=e.getBoundingClientRect();return{w:r.width,h:r.height};})};});
  if(!reproduce){assert.equal(layout.columns.trim().split(/\s+/).length,1,'one tool-panel column '+JSON.stringify(layout));for(const c of layout.children)assert(c.left>=layout.panel.left-1&&c.right<=layout.panel.right+1,'panel child width');assert(layout.tools.every(r=>r.w>50&&r.h<130),'readable tool shapes');if(rough)assert(layout.rough>0);}
  report.push({width,height,rough,layout});
 }await p.screenshot({path:'output/recent-undo/'+(reproduce?'before-':'after-')+width+'.png'});
 if(reproduce){console.log(JSON.stringify(report));await p.close();continue;}
 if(width===390||width===1440){
  // Continuous contact should undo only its latest segment, then redo exactly.
  for(const stage of ['throw','deco','challenge']){
   await p.evaluate(s=>{if(s==='challenge')recentUndoQA.challenge();else{recentUndoQA.free();recentUndoQA.stage(s);}},stage);await p.waitForTimeout(150);
   if(width<600&&await p.locator('#sheet').evaluate(e=>e.classList.contains('open')))await p.locator('#sheetToggle').click();
   const read=()=>p.evaluate(s=>s!=='deco'?recentUndoQA.state().r:recentUndoQA.hash(),stage),initial=await read(),pt=await p.evaluate(()=>recentUndoQA.point());
   await p.mouse.move(pt.x,pt.y);await p.mouse.down();
   for(let i=1;i<=18;i++){await p.mouse.move(pt.x+i*1.8,pt.y+Math.sin(i/3)*8);await p.waitForTimeout(65);}
   await p.mouse.up();await p.waitForTimeout(70);const final=await read(),h=await p.evaluate(()=>TodakLayoutPreview.history());assert.notDeepEqual(final,initial,stage+' real edit');assert(h.undo>=2,stage+' long drag has intermediate undo points');
   if(width<600)await p.locator('#sheetToggle').click();await p.locator('#ui-undo').click();const recent=await read();assert.notDeepEqual(recent,initial,stage+' first undo keeps earlier part of drag');assert.notDeepEqual(recent,final,stage+' first undo changes last part');if(stage==='challenge')assert.equal((await p.evaluate(()=>recentUndoQA.state())).touches,1,'partial undo keeps one contact cost');await p.locator('#ui-redo').click();assert.deepEqual(await read(),final,stage+' exact redo');
   for(let i=0;i<h.undo;i++)await p.locator('#ui-undo').click();assert.deepEqual(await read(),initial,stage+' all segments restore original');if(stage==='challenge')assert.equal((await p.evaluate(()=>recentUndoQA.state())).touches,0,'full gesture undo refunds its contact');
   for(let i=0;i<h.undo;i++)await p.locator('#ui-redo').click();assert.deepEqual(await read(),final,stage+' full redo');if(stage==='challenge')assert.equal((await p.evaluate(()=>recentUndoQA.state())).touches,1,'redo counts one contact, not each checkpoint');
   await p.evaluate(()=>recentUndoQA.free());assert.equal((await p.evaluate(()=>TodakLayoutPreview.history())).undo,0,'new work clears earlier work history');
   console.log('PASS '+width+' '+stage+' recent undo, complete undo/redo and new-work reset');
  }
 }
 assert.deepEqual(errors,[]);await p.close();console.log('PASS '+width+' roughness row toggles without splitting the tool panel');
}fs.writeFileSync('output/recent-undo/'+(reproduce?'reproduction':base.startsWith('https')?'live-checks':'local-checks')+'.json',JSON.stringify(report,null,2));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
