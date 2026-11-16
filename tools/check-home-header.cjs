const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/pppoi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.argv.includes('--live')?'https://todak.sosohanlab.com':'http://127.0.0.1:8771';
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
  for(const width of [320,390,768,1200]) {
   const page=await browser.newPage({viewport:{width,height:844},locale:'ko-KR',hasTouch:width<600,isMobile:width<600});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*clarity.ms/**',r=>r.fulfill({body:'',contentType:'application/javascript'}));
   await page.goto(base+'/?home_header_check=2',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!window.TodakLayoutPreview);
   const header=page.locator('.ui-header');
   assert(await page.locator('#home').isVisible());
   assert(await header.isHidden(),'first-visit home must hide studio header at '+width);
   await page.evaluate(()=>localStorage.setItem('todak.tutorial.v1','complete'));
   await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.TodakLayoutPreview);
   assert(await header.isHidden(),'returning home must hide studio header');
   await page.locator('#goChallenge').click();assert(await page.locator('#chSel').isVisible());assert(await header.isHidden(),'challenge selection must hide studio header');
   await page.locator('#chBack').click();assert(await page.locator('#home').isVisible());assert(await header.isHidden());
   if(width===390)await page.screenshot({path:'ui-layout-preview/home-header-'+(base.startsWith('https')?'live':'local')+'.png'});
   await page.locator('#goFree').click();await page.waitForFunction(()=>document.body.dataset.uiStage==='throw');
   assert(await header.isVisible(),'editing must show studio header');assert(await page.locator('#tools [data-t=shape]').isVisible());
   await page.locator('#homeBtn').click();assert(await page.locator('#home').isVisible());assert(await header.isHidden(),'returning to home must hide studio header');
   await page.locator('#homeClose').click();assert(await page.locator('#home').isHidden());assert(await header.isVisible(),'resuming must restore studio header');
   assert.deepEqual(errors,[]);console.log('PASS '+width+' first/returning home, challenge selection, start and resume');await page.close();
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
