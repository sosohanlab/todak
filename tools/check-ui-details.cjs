const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('C:/Users/pppoi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true}),report=[],errors=[];try{
for(const [width,height]of [[320,568],[390,844],[768,1024],[844,390],[1440,900]]){
 const p=await browser.newPage({viewport:{width,height},locale:'ko-KR'});p.on('pageerror',e=>errors.push(e.message));
 async function open(scene){await p.goto('http://127.0.0.1:8771/'+(scene?'?screen='+scene:''),{waitUntil:'domcontentloaded'});await p.waitForFunction(s=>s?window.TodakLayoutPreview?.readyScene===s:!!window.TodakTutorialPresentation,scene);await p.evaluate(()=>document.fonts.ready);}
 async function inspect(name,selector){await p.waitForTimeout(100);const result=await p.locator(selector).evaluate(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,scroll:e.scrollHeight>e.clientHeight};});assert(result.x>=-1&&result.y>=-1&&result.right<=width+1&&result.bottom<=height+1,width+' '+name+' bounds '+JSON.stringify(result));await p.screenshot({path:'output/ui-review/'+width+'-'+name+'.png'});report.push({width,height,name,...result});}
 await open();await p.locator('#homeFeedback').click();await inspect('feedback','#siteFeedback');await p.locator('#feedbackClose').click();await p.locator('#goChallenge').click();await inspect('challenges','#chSel .chBox');
 await open();await p.locator('#goShelf').click();await inspect('shelf','#drawer .drawerIn');
 await open('01');
 await p.locator('#stageHelpButton').click();await inspect('help','#stageBriefHelp');
 await open('11');await p.locator('#openCard').click();await inspect('card','#cardDlg .drawerIn');
 assert(await p.locator('#title').isVisible());await p.locator('#title').fill('내 작품');await p.locator('#cardClose').click();assert(await p.locator('#cardDlg').isHidden());await p.close();console.log('PASS '+width+' dialogs, editable card and unobstructed close');
}assert.deepEqual(errors,[]);fs.writeFileSync('output/ui-review/dialog-checks.json',JSON.stringify({report,errors},null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
