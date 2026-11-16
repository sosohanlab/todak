const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/pppoi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {createCanvas,loadImage}=require('../ui-layout-preview/node_modules/@napi-rs/canvas');
const out='output/ui-review';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true}),report=[],errors=[];try{
for(const [width,height]of [[320,568],[390,844],[540,720],[768,1024],[844,390],[1440,900]]){
 const p=await browser.newPage({viewport:{width,height},locale:'ko-KR'});p.on('pageerror',e=>errors.push(e.message));
 const scenes=['home','01','02','section','04','05','06','07','08','09','10','11'];
 const scale=width>900?.45:width>600?.55:.7,cellW=Math.ceil(width*scale),cellH=Math.ceil(height*scale)+26,montage=createCanvas(cellW*4,cellH*3),ctx=montage.getContext('2d');ctx.fillStyle='#ddd';ctx.fillRect(0,0,montage.width,montage.height);
 for(let i=0;i<scenes.length;i++){
  const scene=scenes[i];await p.goto('http://127.0.0.1:8771/'+(scene==='home'?'':'?screen='+scene),{waitUntil:'domcontentloaded'});
  await p.waitForFunction(s=>s==='home'?!!window.TodakTutorialPresentation:window.TodakLayoutPreview?.readyScene===s,scene);await p.waitForTimeout(scene==='11'?2800:150);
  const issues=await p.evaluate(()=>{
   const result=[],visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width&&r.height&&s.visibility!=='hidden'&&s.display!=='none'&&!e.closest('[hidden]');};
   for(const e of document.querySelectorAll('#home .homeMenus button,#sheet button,#sheet input,#sheet select,.ui-header button,#ui-work-info button')){
    if(!visible(e))continue;const r=e.getBoundingClientRect(),s=getComputedStyle(e),id=e.id||e.dataset.t||e.dataset.d||e.textContent.trim().slice(0,20);
    if(r.width<16||r.height<16)result.push({id,type:'compressed control',w:r.width,h:r.height});
    if(e.scrollWidth>e.clientWidth+2&&s.overflowX!=='hidden')result.push({id,type:'content overflow',w:r.width,content:e.scrollWidth});
    if(e.matches('button')){const range=document.createRange();for(const n of e.childNodes)if(n.nodeType===3&&n.textContent.trim()){range.selectNodeContents(n);for(const b of range.getClientRects())if(b.left<r.left-1||b.right>r.right+1||b.top<r.top-1||b.bottom>r.bottom+1)result.push({id,type:'text outside button'});}}
   }
   const body=document.getElementById('sheetBody');
   if(document.getElementById('home').hidden&&document.body.dataset.uiLayout==='sheet'&&['throw','deco','glaze'].includes(document.body.dataset.uiStage)){
    const buttons=[...document.querySelectorAll('#tools .chip,#dtools .rackTool,#rackGlaze .rackTool')].filter(visible),r=body.getBoundingClientRect();
    for(const e of buttons){const b=e.getBoundingClientRect();if(b.top<r.top-1||b.bottom>r.bottom+1)result.push({id:e.id||e.dataset.t||e.dataset.d,type:'initial tool row clipped'});if(b.height<(document.body.dataset.uiStage==='throw'?48:58)||getComputedStyle(e).borderTopLeftRadius!=='14px')result.push({id:e.id||e.dataset.t||e.dataset.d,type:'unequal tool shape'});}
   }
   if(!document.getElementById('home').hidden)for(const e of document.querySelectorAll('#home .homeMenus>.bigBtn b')){if(!visible(e))continue;const range=document.createRange();const tops=[];for(const n of e.childNodes)if(n.nodeType===3&&n.textContent.trim()){range.selectNodeContents(n);tops.push(...[...range.getClientRects()].map(b=>Math.round(b.top)));}if(new Set(tops).size>1)result.push({id:e.parentElement.id,type:'home heading wraps'});}
   return result;
  });report.push({width,height,scene,issues});
  const file=out+'/'+width+'-'+scene+'.png';await p.screenshot({path:file});const img=await loadImage(file);const x=(i%4)*cellW,y=Math.floor(i/4)*cellH;ctx.fillStyle='#111';ctx.font='16px sans-serif';ctx.fillText(width+' / '+scene,x+6,y+19);ctx.drawImage(img,x,y+26,cellW,cellH-26);
 }fs.writeFileSync(out+'/overview-'+width+'.png',montage.toBuffer('image/png'));await p.close();console.log('Reviewed '+width+'x'+height);
}fs.writeFileSync(out+'/shape-review.json',JSON.stringify({report,errors},null,2));const failures=report.filter(x=>x.issues.length);console.log(JSON.stringify(failures));assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);console.log('PASS '+report.length+' visual/control geometry checks');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
