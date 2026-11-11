const assert=require('assert'),fs=require('fs'),{JSDOM}=require('jsdom'),{createCanvas,Image}=require('@napi-rs/canvas');
const root=require('path').resolve(__dirname,'..')+'/';
// The WebGL driver is mocked; real Three.js geometry/materials and native Canvas are exercised.
const dom=new JSDOM(fs.readFileSync(root+'index.html','utf8'),{url:'http://localhost:8765/',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;
const errors=[];w.addEventListener('error',e=>errors.push(e.error));Object.defineProperty(w.navigator,'language',{value:'ko-KR'});w.matchMedia=(query)=>({matches:process.argv.includes('--mobile')&&query.includes('pointer:coarse'),addEventListener(){},removeEventListener(){}});w.requestAnimationFrame=()=>1;w.cancelAnimationFrame=()=>{};w.Image=Image;
Object.defineProperty(w.HTMLElement.prototype,'clientWidth',{get(){return this.id==='stage'?(process.argv.includes('--mobile')?390:1280):360}});Object.defineProperty(w.HTMLElement.prototype,'clientHeight',{get(){return this.id==='stage'?(process.argv.includes('--mobile')?844:900):430}});
w.HTMLCanvasElement.prototype.getContext=function(type){if(type!=='2d')return null;if(!this._native)this._native=createCanvas(this.width||300,this.height||150);this._native.width=this.width;this._native.height=this.height;const c=this._native.getContext('2d');if(!c._wrapped){const draw=c.drawImage.bind(c);c.drawImage=(im,...a)=>draw(im._native||im,...a);c._wrapped=true;}return c;};
for(const dimension of ['width','height']){const original=Object.getOwnPropertyDescriptor(w.HTMLCanvasElement.prototype,dimension);Object.defineProperty(w.HTMLCanvasElement.prototype,dimension,{get:original.get,set:function(value){original.set.call(this,value);if(this._native)this._native[dimension]=original.get.call(this);},configurable:true});}
w.HTMLCanvasElement.prototype.toDataURL=function(...a){return this._native?this._native.toDataURL(...a):''};w.HTMLCanvasElement.prototype.toBlob=function(cb){cb(new w.Blob([this._native.toBuffer('image/png')],{type:'image/png'}))};w.HTMLCanvasElement.prototype.setPointerCapture=function(){};
w.Path2D=require('@napi-rs/canvas').Path2D;w.Path2D=require('@napi-rs/canvas').Path2D;w.eval(fs.readFileSync(root+'vendor/three.min.js','utf8'));
let lastScene,renderCount=0;
class Renderer{constructor(){this.domElement=w.document.createElement('canvas');this.shadowMap={};}setPixelRatio(){}setClearColor(){}setSize(x,y){this.domElement.width=x;this.domElement.height=y;this.domElement.getContext('2d');}render(scene){lastScene=scene;renderCount++;} }
w.THREE.WebGLRenderer=Renderer;w.THREE.PMREMGenerator=class{fromEquirectangular(){return {texture:new w.THREE.Texture()}}dispose(){}};
w.eval(fs.readFileSync(root+'pottery-renderer.js','utf8'));w.eval(fs.readFileSync(root+'config.js','utf8'));w.TODAK_CONFIG.searchEndpoint='https://test-project.supabase.co/functions/v1/image-search';
let main=[...fs.readFileSync(root+'index.html','utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(t=>t.includes('var st={'));
main=main.replace('if(hot&&hot.ready){hot.ready(start);}',`window.qa={st:st,preset:applyPreset,N:N,targets:TARGETS,parts:scoreBreakdown,score:score,rough:roughPts,section:drawSection,sectionData:sectionProfile,sec:setSec,draw:draw,card:renderCard,tool:function(t){tool=t;},touch:touchClay,ptr:ptr,view:function(){return {CX:CX,BASE:BASE,SV:SV};},inner:innerAt,markReveal:function(){revealPending=true;},free:startFree,stage:setStage,photo:drawPhoto,data:photoData,step:function(){return fstep;},finish:function(){fT=performance.now()-10000;fireTick();},open:openKilnNow,build:buildResult,frame:frame,store:store,save:shelfAddCurrent};if(hot&&hot.ready){hot.ready(start);}`);
w.eval(main);const q=w.qa;
q.free();
function ideal(id){const T=q.targets[id];q.st.target=id;q.st.height=T.h;q.st.floor=id==='goblet'||id==='highstem'?T.h*.6:.8;q.st.radii=Array.from({length:q.N},(_,i)=>T.f(i/(q.N-1)));q.st.inner=q.st.radii.map(r=>Math.max(.3,r-.8));}
function setGesture(x,y){Object.assign(q.ptr,{sx:x,sy:y,x:x,y:y,w0:null,mode:null,floor0:null,smoothSide:null,invalidThickness:false,contact:false,maxD:0});}
const doc=w.document;w.innerWidth=390;q.stage('throw');
function outsideEvent(type,x,y,target=doc.body){const e=new w.Event(type,{bubbles:true});Object.assign(e,{pointerId:99,clientX:x,clientY:y});target.dispatchEvent(e);}
outsideEvent('pointerdown',20,200,doc.getElementById('sectionView'));outsideEvent('pointerup',20,200,doc.getElementById('sectionView'));assert(!doc.getElementById('sheet').classList.contains('open'),'mobile outside tap collapses tools');
q.stage('throw');outsideEvent('pointerdown',20,200);outsideEvent('pointerup',20,240);assert(doc.getElementById('sheet').classList.contains('open'),'dragging must not collapse tools');
outsideEvent('pointerdown',20,200,doc.getElementById('sheetBody'));outsideEvent('pointerup',20,200,doc.getElementById('sheetBody'));assert(doc.getElementById('sheet').classList.contains('open'),'inside selection keeps tools open');
w.innerWidth=1280;outsideEvent('pointerdown',20,200);outsideEvent('pointerup',20,200);assert(doc.getElementById('sheet').classList.contains('open'),'desktop tools remain open');
const checks=[];
for(const id of Object.keys(q.targets)){
 ideal(id);const clean=q.score();assert(clean>=97,id+' ideal '+clean);
 const original=q.st.radii.slice(),height=q.st.height,floor=q.st.floor;
 q.tool('thick');const v=q.view(),t=.78,startR=q.inner(t);setGesture(v.CX+startR*v.SV,v.BASE-height*t*v.SV);
 q.ptr.x+=.3*v.SV;for(let i=0;i<24;i++)q.touch(16);
 const after=q.inner(t);assert(after>startR+.12,id+' inner wall must react to first fast drag');assert.deepEqual(q.st.radii,original);assert.equal(q.st.height,height);assert.equal(q.st.floor,floor);
 // Floor drag is anchored at pointer-down; never changes external dimensions.
 const floorR=q.inner(q.st.floor/height);setGesture(v.CX+floorR*.3*v.SV,v.BASE-q.st.floor*v.SV);q.ptr.y+=.2*v.SV;for(let i=0;i<24;i++)q.touch(16);assert(q.st.floor<floor-.12,id+' floor drag');assert.deepEqual(q.st.radii,original);
 // Empty space does not accidentally modify the wall.
 const untouched=q.st.inner.slice();setGesture(v.CX+(Math.max(...q.st.radii)+5)*v.SV,v.BASE-height*.7*v.SV);q.ptr.x+=v.SV;q.touch(16);assert.deepEqual(q.st.inner,untouched,id+' empty-space drag');
 // No projected ellipses in the cutaway. Its floor uses the exact same world height.
 const g=q.sectionData();assert(Math.abs(g.floorY-(g.bottomY-q.st.floor*v.SV))<1e-8);assert(Math.abs(g.inner[0][1]-g.floorY)<1e-8);for(const row of g.inner)assert(row[2]>=.119999);
 q.section();checks.push(id);
}
// Shape changes width in either direction and on either side, without digging.
for(const preset of ['lump','bowl','cup','vase'])for(const side of [-1,1])for(const direction of [-1,1]){
 q.preset(preset);q.tool('shape');const v=q.view(),h=q.st.height,floor=q.st.floor,row=32,t=row/(q.N-1),original=q.st.radii.slice();
 setGesture(v.CX+side*original[row]*v.SV,v.BASE-h*t*v.SV);q.ptr.x+=side*direction*.45*v.SV;for(let i=0;i<30;i++)q.touch(16);
 assert(direction*(q.st.radii[row]-original[row])>.3,preset+' shape must both widen and narrow');assert.equal(q.st.floor,floor);assert.equal(q.st.height,h);
}
// A continuous shaping stroke follows the finger vertically, preserving each passed region.
for(const side of [-1,1])for(const direction of [-1,1]){
 q.preset('cup');q.tool('shape');const v=q.view(),outside=q.st.radii.slice(),height=q.st.height,floor=q.st.floor;
 const heldContour=q.data().rAt(.22)+direction*.7;const startRow=Math.round(q.N*.22);setGesture(v.CX+side*outside[startRow]*v.SV,v.BASE-height*.22*v.SV);q.ptr.x+=side*direction*.7*v.SV;
 for(let step=0;step<=70;step++){const t=.22+step/70*.58;q.ptr.y=v.BASE-height*t*v.SV;for(let frame=0;frame<4;frame++)q.touch(16);}
 for(const t of [.3,.5,.72]){const j=Math.round(t*(q.N-1));assert(Math.abs(q.st.radii[j]-heldContour)<.18,'shaping must carry the held contour along the full upward drag path');}
 assert.equal(q.st.floor,floor);assert.equal(q.st.height,height);
}
// A fast upward stroke must fill skipped pointer samples and settle along its whole path.
q.preset('cup');q.tool('shape');{
 const v=q.view(),h=q.st.height,outer=q.st.radii.slice(),j0=Math.round(.2*(q.N-1));
 setGesture(v.CX+outer[j0]*v.SV,v.BASE-h*.2*v.SV);q.ptr.x+=v.SV;q.touch(16);
 q.ptr.y=v.BASE-h*.85*v.SV;q.touch(16);
 for(let i=0;i<20;i++)q.touch(16);
 for(const t of [.3,.5,.7]){const j=Math.round(t*(q.N-1));assert(Math.abs(q.st.radii[j]-(outer[j0]+1))<.05,'fast upward stroke must stay continuous');}
}
// Holding a wide lower contour and dragging straight upward must also widen the neck.
for(const side of [-1,1]){
 q.preset('vase');q.tool('shape');const v=q.view(),outer=q.st.radii.slice(),floor=q.st.floor,h=q.st.height,start=.3,j0=Math.round(start*(q.N-1));
 setGesture(v.CX+side*outer[j0]*v.SV,v.BASE-h*start*v.SV);
 for(let step=0;step<=60;step++){q.ptr.y=v.BASE-h*(start+step/60*.55)*v.SV;for(let frame=0;frame<4;frame++)q.touch(16);}
 const neck=Math.round(.78*(q.N-1));assert(q.st.radii[neck]>outer[neck]+.5,'straight upward dragging must carry the held contour');assert.equal(q.st.floor,floor);
}
q.preset('lump');q.tool('shape');let vv=q.view(),f0=q.st.floor;setGesture(vv.CX+.4*vv.SV,vv.BASE-q.st.height*.9*vv.SV);q.ptr.y+=3*vv.SV;for(let i=0;i<20;i++)q.touch(16);assert.equal(q.st.floor,f0,'shape vertical dragging must not dig');
// The same inside/thickness tool can dig solid clay and refill it without changing the outside.
q.tool('thick');const fixedOutside=q.st.radii.slice(),fixedHeight=q.st.height;setGesture(vv.CX,vv.BASE-q.st.height*vv.SV);q.ptr.y+=3*vv.SV;for(let i=0;i<30;i++)q.touch(16);assert(q.st.floor<f0-2.8,'inside tool must dig solid clay');assert.deepEqual(q.st.radii,fixedOutside);assert.equal(q.st.height,fixedHeight);
const dugFloor=q.st.floor;setGesture(vv.CX,vv.BASE-dugFloor*vv.SV);q.ptr.y-=2*vv.SV;for(let i=0;i<30;i++)q.touch(16);assert(q.st.floor>dugFloor+1.8,'inside tool must refill upward');assert.deepEqual(q.st.radii,fixedOutside);assert.equal(q.st.height,fixedHeight);
setGesture(vv.CX,vv.BASE-q.st.floor*vv.SV);q.ptr.y-=fixedHeight*vv.SV;for(let i=0;i<40;i++)q.touch(16);assert.equal(q.st.floor,fixedHeight,'inside can refill completely');assert.deepEqual(q.st.radii,fixedOutside);
for(const preset of ['bowl','cup','vase']){
 q.preset(preset);q.tool('thick');const v=q.view(),outer=q.st.radii.slice(),height=q.st.height,t=.8;
 setGesture(v.CX+q.inner(t)*v.SV,v.BASE-height*t*v.SV);q.ptr.x+=20*v.SV;for(let i=0;i<30;i++)q.touch(16);assert.deepEqual(q.st.radii,outer,preset+' wall drag must not widen the outside');assert.equal(q.st.height,height);
}
assert.equal(w.document.querySelector('[data-t=hollow]'),null);assert(w.document.querySelector('[data-t=thick]').textContent.includes('속·두께'));
q.tool('shape');
for(const name of ['lump','bowl','cup','vase']){q.preset(name);const g=q.sectionData();assert.equal(g.hollow,name!=='lump');q.section();}
ideal('cup');const good=q.score();q.st.radii=q.st.radii.map(r=>r*1.1);assert(q.score()<=good-20,'10% shape drift must cost points');
ideal('cup');for(let j=5;j<q.N-2;j++)q.st.inner[j]+=(j%2?.18:-.18);assert(q.score()<=85,'deep interior ripples cannot score 90+');
const before=q.st.inner.slice(),outside=q.st.radii.slice(),floor=q.st.floor;const v=q.view(),j=35,t=j/(q.N-1);q.tool('sponge');setGesture(v.CX+q.inner(t)*v.SV,v.BASE-q.st.height*t*v.SV);for(let i=0;i<50;i++)q.touch(16);assert(Math.abs(q.st.inner[j]-(q.st.inner[j-1]+q.st.inner[j+1])/2)<Math.abs(before[j]-(before[j-1]+before[j+1])/2));assert.deepEqual(q.st.radii,outside);assert.equal(q.st.floor,floor);
ideal('cup');q.st.floor=q.st.height;assert(q.score()<=59,'unhollowed clay cannot get a high score');
const bright=w.TodakBackdrop([245,243,235],'studio').rgb,dark=w.TodakBackdrop([25,45,80],'studio').rgb;assert(bright[0]<dark[0]-35,'white pottery needs a darker backdrop');
q.st.kiln={type:'plain',seed:1,fire:'mid'};q.stage('done');q.st.name='나의 첫 그릇';q.st.purpose='아침 요거트 볼';
const card=w.document.getElementById('card'),context=card.getContext('2d'),texts=[],fill=context.fillText.bind(context);context.fillText=(text,...rest)=>{texts.push(text);fill(text,...rest);};q.card();assert.deepEqual(texts,['나의 첫 그릇','아침 요거트 볼']);
let prompt,delay;const realTimer=w.setTimeout;w.setTimeout=(fn,time)=>{if(time===12000){prompt=fn;delay=time;return 9999;}return realTimer(fn,time);};q.ptr.down=false;q.markReveal();q.stage('done');assert.equal(delay,12000);let paidCalls=0;w.fetch=async()=>{paidCalls++;throw Error('must not search automatically');};prompt();assert.equal(w.document.getElementById('searchDlg').hidden,false);assert.equal(paidCalls,0);w.document.getElementById('closeSearch').click();assert.equal(w.document.getElementById('searchDlg').hidden,true);
assert.equal(errors.length,0);console.log('PASS review: '+checks.length+' targets + 4 presets, wall/floor dragging, empty-space hit tests, cutaway coordinates, strict scoring, inner smoothing, white contrast, title/purpose card, 12s opt-in search popup');dom.window.close();
