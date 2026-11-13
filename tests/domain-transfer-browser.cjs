const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
let playwright;try{playwright=require('playwright');}catch(_){playwright=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');}
const {chromium}=playwright;
(async()=>{
 const browser=await chromium.launch({...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH} : {}),headless:true,args:['--no-sandbox']});
 try{
 const ctx=await browser.newContext();
 const fixture='<!doctype html><html lang="ko"><div id="home"><div class="homeBox"><p class="homeFoot">토닥</p></div></div><script>window.liveItems=[];addEventListener("todak-personal-imported",()=>liveItems=JSON.parse(localStorage.getItem("mullebang.v1")).items);</script><script src="/migration/transfer-core.js"></script><script src="/migration/domain-transfer.js"></script>';
 await ctx.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.origin==='https://todak.sosohanlab.com'){
   if(u.pathname==='/')return route.fulfill({contentType:'text/html',body:fixture});
   if(u.pathname.startsWith('/migration/'))return route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(process.cwd(),u.pathname))});
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
 await page.getByRole('button',{name:/기존 작품 가져오기/}).click();
 const popupEvent=page.waitForEvent('popup');await page.getByRole('button',{name:'기존 진열장 연결하기'}).click();const popup=await popupEvent;await popup.waitForLoadState();
 // A forged same-page message cannot transfer data.
 await page.evaluate(()=>window.postMessage({type:'todak-transfer-data',token:'fake',payload:{}},location.origin));
 await popup.getByRole('button',{name:'작품 가져오기',exact:true}).click();
 await page.getByRole('button',{name:'새 진열장 확인하기'}).waitFor();
 const saved=await page.evaluate(()=>({personal:JSON.parse(localStorage.getItem('mullebang.v1')),shards:JSON.parse(localStorage.getItem('todak.shards.v1')),live:liveItems.length}));
 assert.equal(saved.personal.items.length,2);assert.equal(saved.personal.best.cup,88);assert.equal(saved.personal.items[1].bottomCarve,'carve');assert.equal(saved.shards.length,1);assert.equal(saved.live,2);
 assert.equal(await old.evaluate(()=>JSON.parse(localStorage.getItem('mullebang.v1')).items.length),1);
 await page.getByRole('button',{name:'새 진열장 확인하기'}).click();await page.waitForLoadState();
 await page.getByRole('button',{name:'이전 주소 작품 가져오기',exact:true}).click();
 const againEvent=page.waitForEvent('popup');await popup.close();await page.getByRole('button',{name:'기존 진열장 연결하기'}).click();const again=await againEvent;await again.waitForLoadState();await again.getByRole('button',{name:'작품 가져오기',exact:true}).click();await page.getByRole('button',{name:'새 진열장 확인하기'}).waitFor();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mullebang.v1')).items.length),2);
 console.log('PASS: two isolated origins, readiness probe, top-level popup, IDB shards, postMessage import, live store refresh, reload, repeat import, old data retained.');
 await ctx.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
