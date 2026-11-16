const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
let playwright;try{playwright=require('playwright');}catch(_){playwright=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');}
const {chromium}=playwright;
(async()=>{
 const browser=await chromium.launch({...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH} : {}),headless:true,args:['--no-sandbox']});
 try{
 const ctx=await browser.newContext({locale:'ko-KR'});
 const fixture='<!doctype html><html lang="ko"><meta charset="utf-8"><div id="home"><div class="homeBox"><p class="homeFoot">토닥</p></div></div><script>window.liveItems=[];addEventListener("todak-personal-imported",()=>liveItems=JSON.parse(localStorage.getItem("mullebang.v1")).items);</script><script src="/migration/transfer-core.js"></script><script src="/migration/domain-transfer.js"></script>';
 await ctx.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.origin==='https://todak.sosohanlab.com'){
   if(u.pathname==='/')return route.fulfill({contentType:'text/html',body:fixture});
   if(u.pathname.startsWith('/migration/'))return route.fulfill({contentType:'application/javascript; charset=utf-8',body:fs.readFileSync(path.join(process.cwd(),u.pathname))});
  }
  if(u.origin==='https://sosohanlab.github.io') return route.fulfill({contentType:'text/html',body:fs.readFileSync('migration/index.html')});
  return route.abort();
 });
 const old=await ctx.newPage();await old.goto('https://sosohanlab.github.io/todak-transfer/');
 await old.evaluate(async()=>{
  localStorage.setItem('mullebang.v1',JSON.stringify({items:[{id:'old',name:'예전 작품',thumb:'data:image/png;base64,abc',topPaint:'top',bottomCarve:'carve'}],best:{cup:88}}));
  await new Promise((resolve,reject)=>{const r=indexedDB.open('todak-fragments',1);r.onupgradeneeded=()=>r.result.createObjectStore('pieces',{keyPath:'id'});r.onsuccess=()=>{const db=r.result,tx=db.transaction('pieces','readwrite');tx.objectStore('pieces').put({id:'fragment',thumb:'data:image/png;base64,xyz'});tx.oncomplete=()=>{db.close();resolve();};tx.onerror=reject;};});
 });
 const page=await ctx.newPage();await page.goto('https://todak.sosohanlab.com/');
 await page.evaluate(()=>localStorage.setItem('mullebang.v1',JSON.stringify({items:[{id:'new',name:'새 작품'}],best:{cup:65}})));
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mullebang.v1')).items.length),1);
 // Some browsers partition iframe storage. The old first-party page supplies
 // an explicit availability-only return link in that case, without artwork in its URL.
 await page.waitForTimeout(150);
 if(!await page.locator('#importLegacyWorks').isVisible()){
  await old.reload();const destination=await old.locator('a').getAttribute('href');
  assert(destination.includes('legacy_works=1'));await page.goto(destination);
 }
 await page.locator('#importLegacyWorks').click();
 let popup;
 try{[popup]=await Promise.all([page.waitForEvent('popup',{timeout:10000}),page.getByRole('button',{name:'기존 진열장 연결하기'}).click({timeout:10000})]);}
 catch(error){console.error('Transfer state',JSON.stringify(await page.evaluate(()=>({url:location.href,dialog:document.querySelector('dialog')?.outerHTML,status:document.querySelector('[role=status]')?.textContent}))));throw error;}
 await popup.waitForLoadState();
 // A forged same-page message cannot transfer data.
 await page.evaluate(()=>window.postMessage({type:'todak-transfer-data',token:'fake',payload:{}},location.origin));
 await popup.getByRole('button',{name:'작품 가져오기',exact:true}).click();
 await page.getByRole('button',{name:'새 진열장 확인하기'}).waitFor();
 const saved=await page.evaluate(()=>({personal:JSON.parse(localStorage.getItem('mullebang.v1')),shards:JSON.parse(localStorage.getItem('todak.shards.v1')),live:liveItems.length}));
 assert.equal(saved.personal.items.length,2);assert.equal(saved.personal.best.cup,88);assert.equal(saved.personal.items[1].bottomCarve,'carve');assert.equal(saved.shards.length,1);assert.equal(saved.live,2);
 assert.equal(await old.evaluate(()=>JSON.parse(localStorage.getItem('mullebang.v1')).items.length),1);
 await page.getByRole('button',{name:'새 진열장 확인하기'}).click();await page.waitForLoadState();
 assert.equal(await page.locator('#importLegacyWorks').count(),0,'completed import hides the entry on reload');
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mullebang.v1')).items.length),2,'hiding the entry retains current and imported works');
 console.log('PASS two origins, old work detection, popup/IDB import, merged live shelf, reload and completed entry hidden without losing works.');
 await ctx.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
