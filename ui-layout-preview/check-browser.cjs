const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/pppoi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1200,height:880}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const sectionOnly=process.argv.includes('--section');
  for(const scene of sectionOnly?['section']:['01','04','05','06','07','08','09','10','11']){
   await page.goto('http://127.0.0.1:8770/?screen='+scene,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(s=>window.TodakLayoutPreview?.readyScene===s,scene);await page.waitForTimeout(300);
   assert(await page.locator('#chRules').isHidden(),scene+': unexpected start modal');
   for(const id of ['homeBtn','menuBtn','shelfBtn','sound']){
    const b=await page.locator('#'+id).boundingBox();assert(b&&b.y<60,scene+': header '+id);
   }
   const boxes=await page.locator('.ui-header #steps li,.ui-header #shelfBtn,.ui-header #sound').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {id:e.id||e.textContent,l:r.left,r:r.right,t:r.top,b:r.bottom}}));
   for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
    const a=boxes[i],b=boxes[j];assert(!(a.l<b.r&&a.r>b.l&&a.t<b.b&&a.b>b.t),scene+': overlapping header '+a.id+'/'+b.id);
   }
   if(scene==='01')assert(await page.locator('#undo').isHidden(),'duplicate undo');
   if(scene==='section'){
    const on=await page.locator('#cv').evaluate(e=>e.toDataURL());await page.locator('#ui-goal-switch input').uncheck();await page.waitForTimeout(120);const off=await page.locator('#cv').evaluate(e=>e.toDataURL());assert.notEqual(on,off,'section guide must respond to the switch');await page.locator('#ui-goal-switch input').check();await page.waitForTimeout(120);
   }
   assert(await page.locator('#ui-guidance').isHidden(),'guidance bubble');
   if(['01','04','05','06','07','08'].includes(scene))assert(await page.locator('#potteryToolRack').isVisible(),scene+': tool holder missing');
   if(scene==='11'){
    assert(await page.locator('#nextAlt').isHidden());
    assert(await page.locator('#reGlaze').isHidden());assert.equal(await page.locator('#resetPhoto').evaluate(e=>e.parentElement.className),'resultViewDock');
    await page.locator('#openFinished360').click();await page.waitForTimeout(700);assert(!(await page.locator('#finished360').evaluate(e=>e.open)),'unexpected 360 popup');assert(await page.locator('#finished360Canvas').isVisible());
    await page.waitForFunction(()=>window.TodakPhoto?.available);const before=await page.evaluate(()=>TodakFinished360.state().yaw);const orbit=await page.locator('#finished360Canvas').boundingBox();await page.mouse.move(orbit.x+orbit.width*.45,orbit.y+orbit.height*.5);await page.mouse.down();await page.mouse.move(orbit.x+orbit.width*.6,orbit.y+orbit.height*.52,{steps:6});await page.mouse.up();assert.notEqual(await page.evaluate(()=>TodakFinished360.state().yaw),before,'inline rotation');await page.screenshot({path:__dirname+'/screen-inline-360.png'});
    await page.locator('#finishedPhoto').click();assert(await page.locator('#finished360Canvas').isHidden());
   }
   if(scene==='01'){
    assert(await page.locator('#ui-goal-switch').innerText()==='안내선');
    const toggle=page.locator('#ui-goal-switch input');assert.equal(await toggle.getAttribute('role'),'switch');await toggle.uncheck();assert(!(await toggle.isChecked()));await toggle.check();
    assert(await page.locator('#rackThrow').isHidden());assert(await page.locator('#tools [data-t=trim]').isVisible());await page.locator('#tools [data-t=trim]').click();await page.waitForTimeout(1000);assert(await page.locator('#trimStatus').innerText().then(t=>t.includes('준비가')));await page.locator('#tools [data-t=sponge]').click();await page.locator('[data-smooth=inner]').click();assert.equal(await page.locator('#sectionView').getAttribute('aria-pressed'),'true');await page.locator('[data-smooth=outer]').click();await page.locator('#tools [data-t=shape]').click();
   }
   if(scene==='04'||scene==='07'){
    if(scene==='07')await page.locator('#rackGlazeBrush').click();
    const chips=page.locator(scene==='04'?'#pigs .dot:not([hidden])':'#glazeBrushSwatches .swatch');
    for(const b of await chips.all()){const r=await b.boundingBox();if(r)assert(Math.abs(r.width-r.height)<1,'oval colour chip');}
    if(scene==='07'){assert((await page.locator('#glazeBrushSwatches').innerText()).trim()==='','visible colour labels');await page.locator('#rackGlazeBase').click();}
   }
   await page.screenshot({path:__dirname+'/screen-'+scene+'.png'});
  }
  for(const width of sectionOnly?[]:[1000,1440,390]){
   await page.setViewportSize({width,height:880});await page.goto('http://127.0.0.1:8770/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.TodakLayoutPreview?.readyScene==='01');await page.waitForTimeout(200);
   assert(await page.locator('#chRules').isHidden());assert.equal(await page.locator('body').getAttribute('data-ui-stage'),'throw');
   if(width===390){const info=await page.locator('#ui-work-info').boundingBox(),views=await page.locator('#ui-work-views').boundingBox();assert(info.y+info.height<=views.y,'mobile info/view overlap');}
   const boxes=await page.locator('.ui-header #steps li,.ui-header #shelfBtn,.ui-header #sound').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {id:e.id||e.textContent,l:r.left,r:r.right,t:r.top,b:r.bottom}}));
   for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert(!(a.l<b.r&&a.r>b.l&&a.t<b.b&&a.b>b.t),width+': overlapping header '+a.id+'/'+b.id);}
   await page.screenshot({path:__dirname+'/screen-width-'+width+'.png'});
  }
  assert.deepEqual(errors,[]);console.log(sectionOnly?'PASS real browser: section inner-wall guide and toggle; screenshot saved':'PASS real browser: first entry, no blocking modal, header bounds at four sizes, nine stage layouts; screenshots saved');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
