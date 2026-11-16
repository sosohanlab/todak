const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('C:/Users/pppoi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.argv.includes('--live')?'https://todak.sosohanlab.com':'http://127.0.0.1:8771';
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});const report=[];
 try{
  for(const width of [280,320,360,390,412,432,600,768,960,1200]){
   const page=await browser.newPage({viewport:{width,height:844},locale:'ko-KR',hasTouch:width<600,isMobile:width<600});const errors=[];
   page.on('pageerror',e=>errors.push(e.message));await page.route('**/*clarity.ms/**',r=>r.fulfill({body:'',contentType:'application/javascript'}));
   await page.addInitScript(()=>localStorage.setItem('todak.tutorial.v1','complete'));
   await page.goto(base+'/?work_bar_check=1',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.TodakLayoutPreview);
   await page.locator('#goChallenge').click();await page.locator('#chGrid .chCard').filter({has:page.locator('b',{hasText:'달항아리'})}).click();
   await page.waitForFunction(()=>document.body.dataset.uiStage==='throw');
   if(await page.locator('#chRules').isVisible())await page.locator('#chRules button').last().click();
   await page.locator('#tools [data-t=thick]').click();
   await page.locator('#cavityDepth').evaluate(e=>{e.value=String(Number(e.max)/2);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});
   await page.locator('#tools [data-t=shape]').click();await page.locator('#solidView').click();
   for(const stage of ['throw','deco','glaze']){
    await page.waitForTimeout(120);
    const result=await page.evaluate(()=>{
     const info=document.querySelector('#ui-work-info'),heading=info.querySelector('.ui-work-heading'),title=document.querySelector('#modeChip'),views=document.querySelector('#ui-work-views');
     const a=heading.getBoundingClientRect(),b=views.getBoundingClientRect(),p=getComputedStyle(info),range=document.createRange();range.selectNodeContents(title);
     return{children:[...views.children].map(e=>({id:e.id,cls:e.className,width:e.getBoundingClientRect().width,display:getComputedStyle(e).display,html:e.outerHTML.slice(0,150)})),heading:{x:a.x,width:a.width},views:{x:b.x,width:b.width},columns:p.gridTemplateColumns,infoWidth:info.clientWidth,overlap:a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1,overflow:info.scrollWidth>info.clientWidth+1,titleFits:title.scrollWidth<=title.clientWidth+1,titleLines:new Set([...range.getClientRects()].map(r=>Math.round(r.top))).size,padding:[p.paddingTop,p.paddingRight,p.paddingBottom,p.paddingLeft],sameBar:info.contains(views)};
    });
    assert.equal(result.overlap,false,width+' '+stage+' title/control overlap '+JSON.stringify(result));
    if(stage!=='throw'||width>=360&&width<1200)assert.equal(result.overflow,false,width+' '+stage+' status overflow '+JSON.stringify(result));
    if(stage!=='throw'){
     assert(result.sameBar);assert.equal(result.titleLines,1,width+' '+stage+' title line count');
     if(width>=360)assert(result.titleFits,width+' '+stage+' complete title');
     assert.equal(new Set(result.padding).size,1,width+' equal card padding');
     const group=page.locator('#wheelView-'+stage+' .chips');
     const widths=await group.locator('button:not([hidden])').evaluateAll(nodes=>nodes.map(e=>e.getBoundingClientRect().width));
     assert.equal(widths.length,3);assert(Math.max(...widths)-Math.min(...widths)<1,width+' equal segment widths');
     for(const view of ['Side','Top','Bottom']){
      const button=page.locator('#wheel'+view+'-'+stage);await button.click();await page.waitForFunction(id=>document.getElementById(id).getAttribute('aria-pressed')==='true','wheel'+view+'-'+stage,{timeout:3000});
      assert.equal(await group.locator('button[aria-pressed=true]:not([hidden])').count(),1);
     }
     await page.locator('#wheelSide-'+stage).click();
    }
    assert(await page.locator('#ui-rough-locate').isHidden());
    if([320,390,432].includes(width))await page.screenshot({path:'ui-layout-preview/work-bar-'+(base.startsWith('https')?'live':'local')+'-'+width+'-'+stage+'.png'});
    report.push({width,stage,...result});
    if(stage!=='glaze'){if(!await page.locator('#nextBtn').isVisible())await page.locator('#sheetToggle').click();await page.locator('#nextBtn').click();await page.waitForFunction(s=>document.body.dataset.uiStage===s,stage==='throw'?'deco':'glaze');}
   }
   assert.deepEqual(errors,[]);await page.close();console.log('PASS '+width+' challenge, decoration and glaze bars');
  }
  fs.writeFileSync('ui-layout-preview/work-bar-'+(base.startsWith('https')?'live':'local')+'-checks.json',JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
