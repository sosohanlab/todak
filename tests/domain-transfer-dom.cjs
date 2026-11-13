const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
const core=fs.readFileSync('migration/transfer-core.js','utf8'),ui=fs.readFileSync('migration/domain-transfer.js','utf8');
const tick=()=>new Promise(r=>setTimeout(r,20));
test('actual bridge and destination UI transfer via validated messages, retaining old and new works',async()=>{
 const main=new JSDOM('<div id="home"><div class="homeBox"><p class="homeFoot"></p></div></div>',{url:'https://todak.sosohanlab.com/',runScripts:'outside-only'});
 const w=main.window;let old;
 try {
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  w.eval(core);w.localStorage.setItem('mullebang.v1',JSON.stringify({items:[{id:'new',name:'새 작품'}],best:{}}));
  let updated=false;w.addEventListener('todak-personal-imported',()=>updated=true);
  w.open=(url)=>{
   old=new JSDOM(fs.readFileSync('migration/index.html','utf8'),{url,runScripts:'outside-only'});
   const o=old.window;Object.defineProperty(o,'opener',{value:w});o.eval(core);o.TodakTransferCore.fragmentsFromDB=async()=>[{id:'fragment',thumb:'data:fragment'}];
   o.localStorage.setItem('mullebang.v1',JSON.stringify({items:[{id:'old',name:'옛 작품',bottomPaint:'bottom'}],best:{}}));
   w.postMessage=(data,target)=>{assert.equal(target,w.location.origin);queueMicrotask(()=>w.dispatchEvent(new w.MessageEvent('message',{origin:o.location.origin,source:o,data}))); };
   o.postMessage=(data,target)=>{assert.equal(target,o.location.origin);queueMicrotask(()=>o.dispatchEvent(new o.MessageEvent('message',{origin:w.location.origin,source:w,data}))); };
   o.eval(o.document.scripts[1].textContent);return o;
  };
  w.eval(fs.readFileSync('home-layout.js','utf8'));
  w.eval(ui);const entry=w.document.querySelector('.homeBox button'),probe=w.document.querySelector('iframe');assert.equal(entry.hidden,true);
  w.dispatchEvent(new w.MessageEvent('message',{origin:'https://evil.example',source:probe.contentWindow,data:{type:'todak-bridge-ready'}}));assert.equal(entry.hidden,true);
  w.dispatchEvent(new w.MessageEvent('message',{origin:'https://sosohanlab.github.io',source:probe.contentWindow,data:{type:'todak-bridge-ready'}}));assert.equal(entry.hidden,false);
  entry.click();const dialog=w.document.querySelector('dialog');assert.equal(dialog.open,true);dialog.querySelector('[data-open]').click();
  const token=new URLSearchParams(old.window.location.hash.slice(1)).get('token'),incoming=old.window.TodakTransferCore.collect(old.window.localStorage);
  for(const [origin,source,t] of [['https://evil.example',old.window,token],['https://sosohanlab.github.io',w,token],['https://sosohanlab.github.io',old.window,'bad']])w.dispatchEvent(new w.MessageEvent('message',{origin,source,data:{type:'todak-transfer-data',token:t,payload:incoming}}));
  assert.equal(JSON.parse(w.localStorage.getItem('mullebang.v1')).items.length,1);
  old.window.document.querySelector('#transfer').click();await tick();
  const saved=JSON.parse(w.localStorage.getItem('mullebang.v1'));assert.equal(saved.items.length,2);assert.equal(saved.items[1].bottomPaint,'bottom');assert.equal(JSON.parse(w.localStorage.getItem('todak.shards.v1')).length,1);assert(updated);
  assert.equal(w.localStorage.getItem('todak.domain-transfer.v1'),'complete');assert.equal(dialog.querySelector('[data-close]').hidden,true);assert(dialog.querySelector('[data-open]').textContent.includes('진열장 확인'));
  assert(old.window.document.querySelector('#status').textContent.includes('저장했어요'));assert.equal(JSON.parse(old.window.localStorage.getItem('mullebang.v1')).items.length,1);
  old.window.document.querySelector('#transfer').click();await tick();assert.equal(JSON.parse(w.localStorage.getItem('mullebang.v1')).items.length,2);
 }finally{if(old)old.window.close();w.close();}
});
