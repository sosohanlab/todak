/* Isolated browser review: real clicks, fixture work only, no external submissions. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/pppoi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.argv.includes('--live')?'https://todak.sosohanlab.com':'http://127.0.0.1:8771';
const fixture=`window.buttonMatrixQA={prepare:function(mode,stage){mode==='free'?startFree():startChallenge('bowl');closeOverlays();$('chRules').hidden=true;st.height=12;st.floor=1;st.radii=Array.from({length:N},function(_,i){return 5+1.6*Math.sin(Math.PI*i/(N-1))+(i%2?.05:-.05);});st.inner=st.radii.map(function(r){return r-1;});st.trimReady=true;if(stage==='done')st.kiln={type:'plain',seed:42,fire:'mid'};setStage(stage);syncControls();updateReadout();TodakLayoutPreview.sync();TodakResponsive.refresh();dirty=true;},point:function(){var l=TodakWheel.top()?TodakWheel.layout():TodakWheel.bottom()?TodakWheel.bottomLayout():null,r=cv.getBoundingClientRect();return{x:r.left+(l?l.x:CX)*r.width/W,y:r.top+(l?l.y:BASE-st.height*.6*SV)*r.height/HC};}};`;
const widthArg=process.argv.find(a=>a.startsWith('--width='));
const onlyArg=process.argv.find(a=>a.startsWith('--only='));
const sizes=(process.argv.includes('--quick')?[[390,844],[1440,900]]:[[320,568],[390,844],[768,1024],[844,390],[1440,900]]).filter(s=>!widthArg||s[0]===Number(widthArg.split('=')[1]));
const report={startedAt:new Date().toISOString(),clicks:0,inputs:0,states:0,buttons:{},scenarios:[],failures:[],errors:[],externalSubmissions:0};
fs.mkdirSync('output/button-review',{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
for(const [width,height]of sizes){
 const context=await browser.newContext({viewport:{width,height},locale:'ko-KR',acceptDownloads:true}),p=await context.newPage();p.setDefaultTimeout(15000);let mode='',stage='',trace=[];
 p.on('pageerror',e=>report.errors.push({width,mode,stage,error:e.message}));p.on('dialog',d=>d.dismiss());p.on('download',d=>d.cancel());
 await p.route('**/*',route=>{const q=route.request();if(q.url().includes('clarity.ms'))return route.fulfill({body:''});if(!['GET','HEAD','OPTIONS'].includes(q.method()))return route.fulfill({status:503,contentType:'application/json',body:'{"error":"isolated UI review; no submission"}'});return route.continue();});
 const html=base.startsWith('https')?await (await p.request.get(base+'/?button_matrix_source=1')).text():fs.readFileSync('release-site/index.html','utf8');
 await p.route(base+'/?button_matrix=1',r=>r.fulfill({contentType:'text/html',body:html.replace('if(hot&&hot.ready){hot.ready(start);}',fixture+'\nif(hot&&hot.ready){hot.ready(start);}')}));
 await p.goto(base+'/?button_matrix=1',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.buttonMatrixQA);await p.addStyleTag({content:'*,*::before,*::after{transition-duration:0s!important;animation-duration:0s!important}'});
 async function settle(){await p.waitForTimeout(20);}
 async function check(label){await settle();report.states++;const issues=await p.evaluate(()=>{
  const issues=[],visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&!e.closest('[hidden]');};
  if(document.documentElement.scrollWidth>innerWidth+1)issues.push('page horizontal overflow');
  const sheet=document.getElementById('sheet'),r=sheet.getBoundingClientRect();if(r.left<-.5||r.right>innerWidth+1||r.top<0||r.bottom>innerHeight+1)issues.push('sheet outside viewport');
  const panel=[...document.querySelectorAll('#sheetBody>.panel')].find(visible);if(panel){const pr=panel.getBoundingClientRect(),s=getComputedStyle(panel);if(s.display==='grid'&&s.gridTemplateColumns.split(/\s+/).length!==1)issues.push('panel split into columns');for(const child of panel.children)if(visible(child)){const b=child.getBoundingClientRect();if(b.left<pr.left-1||b.right>pr.right+1)issues.push('panel overflow '+child.id);}}
  for(const group of document.querySelectorAll('#sheet #tools,#sheet #dtools,#sheet #rackGlaze'))if(visible(group)){const buttons=[...group.querySelectorAll('button')].filter(visible);for(const b of buttons){const r=b.getBoundingClientRect();if(r.width<40||r.height<32||r.height>140)issues.push('compressed tool '+(b.id||b.dataset.t||b.dataset.d));}}
  const header=document.querySelector('.ui-header');if(visible(header))for(const e of header.querySelectorAll('button,#steps li'))if(visible(e)){const r=e.getBoundingClientRect(),h=header.getBoundingClientRect();if(e.closest('#ui-more-panel'))continue;if(r.left<0||r.right>innerWidth+1||r.top<h.top-1||r.bottom>h.bottom+1)issues.push('header clipping '+e.id);}
  for(const e of document.querySelectorAll('#sheet .swatch,#sheet .dot'))if(visible(e)){const r=e.getBoundingClientRect();if(Math.abs(r.width-r.height)>1)issues.push('oval colour '+e.dataset.g);}
  return [...new Set(issues)];
 });if(issues.length){const item={width,height,mode,stage,label,issues,trace:trace.slice(-8)};report.failures.push(item);if(report.failures.length<=12)await p.screenshot({timeout:20000,path:'output/button-review/failure-'+report.failures.length+'.png'});}}
 async function openSheet(){if(await p.evaluate(()=>[...document.querySelectorAll('.overlay,.drawer,dialog[open]')].some(e=>!e.hidden&&e.getBoundingClientRect().width&&e.getBoundingClientRect().height)))return;if(await p.locator('#sheetToggle').isVisible()&&!await p.locator('#sheet').evaluate(e=>e.classList.contains('open')))await p.locator('#sheetToggle').click();}
 async function click(target,optional=false){const b=typeof target==='string'?p.locator(target).first():target;
  if(await b.count()&&await b.evaluate(e=>!!e.closest('#sheetBody,#ui-tool-footer')))await openSheet();
  if(!await b.count()||!await b.isVisible()){if(optional)return false;throw Error('Missing visible control '+target);}
  if(await b.evaluate(e=>!!e.closest('#sheetBody,#ui-tool-footer')))await openSheet();
  if(!await b.isEnabled())return false;
  const key=await b.evaluate(e=>e.id?'#'+e.id:(e.parentElement.id?'#'+e.parentElement.id:'button')+JSON.stringify({...e.dataset})+' '+e.textContent.trim().slice(0,25));
  await b.click();report.clicks++;report.buttons[key]=(report.buttons[key]||0)+1;trace.push(key);await check(key);return true;
 }
 async function group(selector){await openSheet();for(const b of await p.locator(selector).all())if(await b.isVisible())await click(b);}
 async function ranges(selector){await openSheet();for(const b of await p.locator(selector).all())if(await b.isVisible()){await b.focus();for(const key of ['Home','End','ArrowLeft']){await p.keyboard.press(key);report.inputs++;await check('range '+await b.getAttribute('id')+' '+key);}}}
 async function help(){await click('#stageHelpButton');await click('#stageBriefClose',true)||await click('#stageBriefHelp button');}
 async function prepare(m,s){mode=m;stage=s;trace=[];await p.evaluate(({m,s})=>buttonMatrixQA.prepare(m,s),{m,s});await p.waitForTimeout(60);await openSheet();await check('prepare');}
 async function scenario(name,fn){if(onlyArg&&!name.includes(onlyArg.split('=')[1]))return;const clicks=report.clicks,states=report.states;p.setDefaultTimeout(name.includes('completion')?20000:15000);console.log('Checking '+width+' '+name);try{await fn();report.scenarios.push({width,height,mode,stage,name,clicks:report.clicks-clicks,states:report.states-states,pass:true});console.log('Checked '+width+' '+name+' / '+(report.clicks-clicks)+' clicks');}catch(e){report.failures.push({width,height,mode,stage,name,error:e.message,trace:trace.slice(-8)});if(report.failures.length<=12)await p.screenshot({timeout:20000,path:'output/button-review/failure-'+report.failures.length+'.png'});console.log('FAIL '+width+' '+name+': '+e.message.split('\n')[0]);}fs.writeFileSync('output/button-review/progress-'+width+'.json',JSON.stringify({width,mode,stage,clicks:report.clicks,states:report.states,failures:report.failures,errors:report.errors},null,2));}
 for(const m of ['free','challenge']){
  await scenario(m+' throwing tool × view × size × help × sheet',async()=>{await prepare(m,'throw');
   for(const tool of ['shape','thick','sponge'])for(const view of ['solidView','sectionView']){
    await click('#tools [data-t='+tool+']');await click('#'+view);
    await group('.ui-size-choices button');await group('#ui-smooth-surface button');await help();
    if(await p.locator('#sheetToggle').isVisible()){await click('#sheetToggle');await click('#sheetToggle');}
    if(m==='challenge'){await click('#ui-goal-switch input');await click('#ui-goal-switch input');}
   }
   await ranges('#cavityDepth:visible');await click('#ui-undo',true);await click('#ui-redo',true);
   await click('#ui-more-button',true);await click('#sound');await click('#sound');if(await p.locator('#ui-more-panel').isVisible())await p.keyboard.press('Escape');
  });
  await scenario(m+' decorating tool × side/top/bottom × colour/stamp/carving/ring',async()=>{await prepare(m,'deco');
   for(const tool of ['brush','carve','stamp','erase'])for(const view of ['Side','Top','Bottom']){
    await click('#dtools [data-d='+tool+']');await click('#wheel'+view+'-deco');
    await group('#pigs button:visible');await group('#carveMode button:visible');await group('#stamps button:visible');await group('#ring button:visible');
    await ranges('#paintOpacity:visible,#dsize:visible');await click('#rotL');await click('#rotR');
   }await help();await click('#dClear');await click('#ui-undo',true);await click('#ui-redo',true);
   await click('#backThrow');assert.equal(await p.locator('body').getAttribute('data-ui-stage'),'throw');await click('#nextBtn');assert.equal(await p.locator('body').getAttribute('data-ui-stage'),'deco');
  });
  await scenario(m+' glaze tool × view × base colour/finish and dip/effect',async()=>{await prepare(m,'glaze');
   for(const view of ['Side','Top','Bottom']){
    await click('#rackGlazeBase');await click('#wheel'+view+'-glaze');await openSheet();
    for(const color of await p.locator('#swatches button:visible').all()){await click(color);await group('#finish [data-f]');}
    const more=p.locator('#glazeBaseSettings > details.fold:not([hidden])>summary').last();if(await more.count()&&!await more.evaluate(e=>e.parentElement.open))await click(more);
    for(const dip of await p.locator('#dip button:visible').all()){await click(dip);await group('#fx button:visible');await group('#dots button:visible');await ranges('#dipDepth:visible');}
    await click('#lucky');await click('#ui-undo',true);await click('#ui-redo',true);
    await click('#rackGlazeBrush');await group('#glazeBrushSwatches button:visible');await click('#glazeFree',true);await ranges('#glazeOpacity:visible,#glazeBrushSize:visible');
   }await help();await click('#backDeco');assert.equal(await p.locator('body').getAttribute('data-ui-stage'),'deco');await click('#nextBtn');assert.equal(await p.locator('body').getAttribute('data-ui-stage'),'glaze');
  });
  await scenario(m+' firing intensity and help',async()=>{await prepare(m,'fire');await group('#fire button');await help();});
  await scenario(m+' completion background × size × inspection and card',async()=>{await prepare(m,'done');
   for(const scene of ['studio','warm','gallery']){await openSheet();await p.locator('#realPhotoScene').selectOption(scene);report.inputs++;await check('background '+scene);await click('#photoSizeLess');await click('#photoSizeMore');await click('#ui-result-360');await click('#rotL',true);await click('#rotR',true);await click('#ui-orbit-left',true);await click('#ui-orbit-right',true);await click('#ui-result-360');await click('#resetPhoto');}
   await help();await click('#openCard');await group('#cardModes button');await p.locator('#title').fill('버튼 조합 검사용 작품');await p.locator('#purpose').fill('검사');report.inputs+=2;await click('#cardClose');
   await click('#openSearch');await click('#closeSearch');await click('#publishCurrent');await click('#nextBtn');
  });
  console.log('Reviewed '+width+' '+m+'; '+report.clicks+' clicks / '+report.states+' checked states');
 }
 await scenario('home, challenge choices, overlays and tutorial resume',async()=>{
  if(await p.locator('#home').isHidden())await click('#homeBtn');await click('#goShelf');await click('#drawerClose');
  await click('#homeFeedback');await p.locator('#feedbackMessage').fill('로컬 UI 검사');report.inputs++;await click('#feedbackClose');
  await click('#goMarket');await click('#goChallenge');const options=await p.locator('#chGrid .chCard').count();
  for(let i=0;i<options;i++){await click(p.locator('#chGrid .chCard').nth(i));await click('#crGo',true);await help();await click('#homeBtn');await click('#goChallenge');}
  await group('#tmode button');await click('#chBack');await click('#goTutorial');await click('#tutorialSkip');await click('#goTutorial');await click('#tutorialSkip');await click('#restartTutorial');await click('#tutorialSkip');await click('#goFree');await click('#homeBtn');
 });
 await p.screenshot({timeout:20000,path:'output/button-review/end-'+width+'.png'});await context.close();
 console.log('PASS completed '+width+'x'+height+' button matrix');
}
report.finishedAt=new Date().toISOString();report.uniqueButtons=Object.keys(report.buttons).length;const out='output/button-review/combinations-'+(base.startsWith('https')?'live-':'local-')+(widthArg?widthArg.split('=')[1]:process.argv.includes('--quick')?'quick':'all')+(onlyArg?'-'+onlyArg.split('=')[1]:'')+'.json';fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify({clicks:report.clicks,inputs:report.inputs,states:report.states,uniqueButtons:report.uniqueButtons,scenarios:report.scenarios.length,failures:report.failures.slice(0,8),errors:report.errors}));assert.deepEqual(report.errors,[]);assert.deepEqual(report.failures,[]);
}finally{await browser.close();}})().catch(e=>{console.error(e.message);process.exitCode=1});
