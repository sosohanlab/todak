const assert=require('assert'),fs=require('fs'),{JSDOM}=require('jsdom'),{createCanvas,Image}=require('@napi-rs/canvas');
const root=require('path').resolve(__dirname,'..')+'/';
(async()=>{for(const pointerType of ['mouse','touch']){
 const dom=new JSDOM('<div id="shelfGrid"></div>',{url:'https://test.local',runScripts:'outside-only'}),w=dom.window;let now=100,queue=[],renders=[],pileDraws=0,removed=[];
 Object.defineProperty(w.performance,'now',{value:()=>now});w.requestAnimationFrame=fn=>(queue.push(fn),queue.length);w.cancelAnimationFrame=()=>{queue=[]};w.Image=Image;
 const thumb=createCanvas(10,10).toDataURL('image/png');
 w.HTMLCanvasElement.prototype.getContext=function(){if(!this.native)this.native=createCanvas(this.width,this.height);const ctx=this.native.getContext('2d');if(!ctx.wrapped){const draw=ctx.drawImage.bind(ctx);ctx.drawImage=(im,...args)=>{if(im.width===224)pileDraws++;draw(im.native||im,...args)};ctx.wrapped=true;}return ctx;};
 w.HTMLCanvasElement.prototype.setPointerCapture=function(){};w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
 w.eval('var $=id=>document.getElementById(id),store={items:[]},st={},shelfSel=null,shelfArm=false,renderShelf=function(){},lsSave=function(){},dbDel=function(id){window.removed.push(id)}');w.removed=removed;
 w.TodakPhoto={createFracture:()=>({render:(x,y,p)=>(renders.push(p),null),pileImage:()=>thumb,dispose(){}})};
 w.eval(fs.readFileSync(root+'shelf-break.js','utf8'));await w.TodakBreakage.ready;
 const item={id:'one',shape:{h:12,r:[3,4,4,3]},c:[230,225,220]};w.store.items=[item];await w.TodakBreakage.open(item);
 const c=w.document.getElementById('breakCanvas');c.getBoundingClientRect=()=>({left:0,top:0,width:640,height:450});
 function pointer(type,x,y){const e=new w.Event(type,{cancelable:true});Object.assign(e,{pointerId:1,clientX:x,clientY:y,pointerType,button:0});c.dispatchEvent(e)}
 async function frame(ms){now+=ms;const batch=queue;queue=[];batch.forEach(fn=>fn(now));await new Promise(r=>setImmediate(r));}
 pointer('pointerdown',320,260);pointer('pointerup',320,260);await frame(16);assert.equal(w.store.items.length,1,'tap preserves pottery');
 pointer('pointerdown',320,260);now+=500;pointer('pointermove',320,220);pointer('pointerup',320,220);assert.equal(w.store.items.length,1,'slow drag preserves pottery');
 pointer('pointerdown',320,260);now+=30;pointer('pointermove',330,210);now+=30;pointer('pointermove',340,140);pointer('pointerup',340,140);
 await frame(100);assert.equal(w.store.items.length,1,'release does not shatter immediately');assert(renders.every(p=>p===null));
 for(let i=0;i<30;i++)await frame(32);assert.equal(w.store.items.length,0,'collision deletes only intended work');assert.equal(w.TodakBreakage.records().length,1);assert.equal(pileDraws,0,'new fragments never fly to pile during current opening');
 for(let i=0;i<80;i++)await frame(32);assert(renders.includes(1),'fragments settle over time');assert(!w.document.getElementById('breakClose').disabled);
 w.document.getElementById('breakClose').click();const next={...item,id:'two'};w.store.items=[next];await w.TodakBreakage.open(next);await new Promise(r=>setTimeout(r,40));assert(pileDraws>0,'previous fragments appear in next opening');
 pointer('pointerdown',320,260);now+=30;pointer('pointermove',320,120);pointer('pointerup',320,120);w.document.getElementById('breakClose').click();await frame(1000);assert.equal(w.store.items.length,1,'close before impact preserves pottery');assert.equal(removed.length,1);
 await w.TodakBreakage.open(next);const originalSet=w.Storage.prototype.setItem;w.Storage.prototype.setItem=function(k,v){if(k==='todak.shards.v1')throw Error('quota');return originalSet.call(this,k,v)};
 pointer('pointerdown',320,260);now+=30;pointer('pointermove',320,120);pointer('pointerup',320,120);for(let i=0;i<35;i++)await frame(32);assert.equal(w.store.items.length,1,'storage failure preserves original work');assert.equal(w.TodakBreakage.records().length,1);w.Storage.prototype.setItem=originalSet;
 dom.window.close();
}console.log('PASS: mouse/touch throw, no tap/slow-drag break, delayed wall impact, persistent deletion, floor settling, pile only next visit, close before impact preserves work.');})().catch(e=>{console.error(e);process.exitCode=1});
