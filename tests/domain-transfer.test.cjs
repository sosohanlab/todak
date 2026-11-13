const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const box={};vm.runInNewContext(fs.readFileSync('migration/transfer-core.js','utf8'),box);
const core=box.TodakTransferCore;
function storage(values={}){const map=new Map(Object.entries(values));return{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};}
const key='mullebang.v1';
const item=(id,name)=>({id,name,thumb:'data:image/png;base64,test',full2:{radii:[1,2,3]},bottomPaint:'paint'});
const personal=(items,best={})=>JSON.stringify({items,best});
function payload(items,best={}){return core.collect(storage({[key]:personal(items,best)}));}
test('merge works, shapes and all painted surfaces without losing new work; repeat is idempotent',()=>{
 const s=storage({[key]:personal([item('new','새 작품')],{cup:80})}),p=payload([item('old','옛 작품')],{cup:90});
 assert.equal(core.apply(s,core.plan(s,p)).added,1);assert.equal(core.apply(s,core.plan(s,p)).added,0);
 const data=JSON.parse(s.getItem(key));assert.equal(data.items.length,2);assert.equal(data.items[1].bottomPaint,'paint');assert.equal(data.best.cup,90);
});
test('conflicting IDs preserve both versions and do not duplicate on retry',()=>{
 const s=storage({[key]:personal([item('same','new')])}),p=payload([item('same','old')]);
 core.apply(s,core.plan(s,p));core.apply(s,core.plan(s,p));const data=JSON.parse(s.getItem(key));assert.equal(data.items.length,2);assert.notEqual(data.items[0].id,data.items[1].id);
});
test('empty source does not erase destination or report success',()=>{
 const s=storage({[key]:personal([item('new','new')])}),before=s.getItem(key);const r=core.plan(s,core.collect(storage()));assert.equal(r.found,false);core.apply(s,r);assert.equal(s.getItem(key),before);
});
test('legacy fallback works, but does not resurrect data when primary exists',()=>{
 const s=storage(),p=core.collect(storage({'todak.market-preview.personal.v1':personal([item('old','old')])}));core.apply(s,core.plan(s,p));assert.equal(JSON.parse(s.getItem(key)).items.length,1);
 p.values[key]=personal([]);assert.equal(core.plan(storage(),p).added,0);
});
test('quota error rolls back earlier writes, preserving every destination value',()=>{
 const s=storage({[key]:personal([item('new','new')]),'todak.lang':'ko'}),before=s.getItem(key),p=payload([item('old','old')]);p.values['todak.market-preview.v1']=JSON.stringify({works:[]});
 const set=s.setItem;s.setItem=(k,v)=>{if(k==='todak.market-preview.v1')throw Error('quota');set(k,v);};
 assert.throws(()=>core.apply(s,core.plan(s,p)),/저장 공간/);assert.equal(s.getItem(key),before);assert.equal(s.getItem('todak.lang'),'ko');assert.equal(s.getItem('todak.market-preview.v1'),null);
});
test('invalid payload/malformed existing data aborts before writes; unrelated origin keys ignored',()=>{
 const s=storage({[key]:'broken'});assert.throws(()=>core.plan(s,payload([])));assert.equal(s.getItem(key),'broken');assert.throws(()=>core.plan(storage(),{...payload([]),source:'https://evil.example'}));
 const p=payload([]);p.values.unrelated='secret';const dest=storage();core.apply(dest,core.plan(dest,p));assert.equal(dest.getItem('unrelated'),null);
 p.values[key]='{"items":[],"best":{"__proto__":{}}}';assert.throws(()=>core.plan(storage(),p));
});
test('IDB fragments and local fallback combine; settings keep destination preferences',()=>{
 const p=payload([]);p.fragments=[{id:'shard',thumb:'data:one'}];p.values['todak.shards.v1']=JSON.stringify([{id:'local',thumb:'data:two'}]);p.values['todak.lang']='en';
 const s=storage({'todak.lang':'ko'});core.apply(s,core.plan(s,p));assert.equal(JSON.parse(s.getItem('todak.shards.v1')).length,2);assert.equal(s.getItem('todak.lang'),'ko');
});
test('wallet merges owned/earned without doubling points or resetting current decor',()=>{
 const p=payload([]),mk=(points,owned,earned,background)=>JSON.stringify({works:[],wallet:{points,owned,earned,background}});
 p.values['todak.market-preview.v1']=mk(150,['shelf:glass'],['old'],'studio');const s=storage({'todak.market-preview.v1':mk(30,['background:warm'],['new'],'warm')});
 core.apply(s,core.plan(s,p));const w=JSON.parse(s.getItem('todak.market-preview.v1')).wallet;assert.equal(w.points,150);assert.equal(w.background,'warm');assert.equal(w.owned.length,2);assert.equal(w.earned.length,2);
});
test('standalone bridge matches maintained core and enforces exact origins and window identity',()=>{
 const bridge=fs.readFileSync('migration/index.html','utf8');assert(bridge.includes(fs.readFileSync('migration/transfer-core.js','utf8')));assert(bridge.includes('e.source!==window.opener'));assert(bridge.includes('window.parent!==window'));assert(bridge.includes('e.origin!==target'));
 const ui=fs.readFileSync('migration/domain-transfer.js','utf8');assert(ui.includes('e.source !== popup'));assert(ui.includes('e.data.token !== token'));assert(ui.includes('e.origin !== OLD'));
 assert(!fs.readFileSync('index.html','utf8').includes('while(store.items.length>40)'));
});
