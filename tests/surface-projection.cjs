const assert=require('assert'),fs=require('fs'),{JSDOM}=require('jsdom'),{createCanvas,Image}=require('@napi-rs/canvas');
const root=require('path').resolve(__dirname,'..')+'/';
// The WebGL driver is mocked; real Three.js geometry/materials and native Canvas are exercised.
const dom=new JSDOM(fs.readFileSync(root+'index.html','utf8'),{url:'http://localhost:8765/',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
const errors=[];w.addEventListener('error',e=>errors.push(e.error));Object.defineProperty(w.navigator,'language',{value:'ko-KR'});w.matchMedia=(query)=>({matches:process.argv.includes('--mobile')&&query.includes('pointer:coarse'),addEventListener(){},removeEventListener(){}});w.requestAnimationFrame=()=>1;w.cancelAnimationFrame=()=>{};w.Image=Image;
Object.defineProperty(w.HTMLElement.prototype,'clientWidth',{get(){return this.id==='stage'?(process.argv.includes('--mobile')?390:1280):360}});Object.defineProperty(w.HTMLElement.prototype,'clientHeight',{get(){return this.id==='stage'?(process.argv.includes('--mobile')?844:900):430}});
w.HTMLCanvasElement.prototype.getContext=function(type){if(type!=='2d')return null;if(!this._native)this._native=createCanvas(this.width||300,this.height||150);this._native.width=this.width;this._native.height=this.height;const c=this._native.getContext('2d');if(!c._wrapped){const draw=c.drawImage.bind(c);c.drawImage=(im,...a)=>draw(im._native||im,...a);c._wrapped=true;}return c;};
for(const dimension of ['width','height']){const original=Object.getOwnPropertyDescriptor(w.HTMLCanvasElement.prototype,dimension);Object.defineProperty(w.HTMLCanvasElement.prototype,dimension,{get:original.get,set:function(value){original.set.call(this,value);if(this._native)this._native[dimension]=original.get.call(this);},configurable:true});}
w.HTMLCanvasElement.prototype.toDataURL=function(...a){return this._native?this._native.toDataURL(...a):''};w.HTMLCanvasElement.prototype.toBlob=function(cb){cb(new w.Blob([this._native.toBuffer('image/png')],{type:'image/png'}))};w.HTMLCanvasElement.prototype.setPointerCapture=function(){};
w.Path2D=require('@napi-rs/canvas').Path2D;w.Path2D=require('@napi-rs/canvas').Path2D;w.eval(fs.readFileSync(root+'vendor/three.min.js','utf8'));
let lastScene,lastCamera,renderCount=0;
class Renderer{constructor(){this.domElement=w.document.createElement('canvas');this.shadowMap={};}setPixelRatio(){}setClearColor(){}setSize(x,y){this.domElement.width=x;this.domElement.height=y;this.domElement.getContext('2d');}render(scene,camera){lastCamera=camera;lastScene=scene;renderCount++;} }
w.THREE.WebGLRenderer=Renderer;w.THREE.PMREMGenerator=class{fromEquirectangular(){return {texture:new w.THREE.Texture()}}dispose(){}};
w.eval(fs.readFileSync(root+'tool-images.js','utf8'));w.eval(fs.readFileSync(root+'gallery-3d.js','utf8'));w.eval(fs.readFileSync(root+'pottery-renderer.js','utf8'));w.eval(fs.readFileSync(root+'config.js','utf8'));w.TODAK_CONFIG.searchEndpoint='https://test-project.supabase.co/functions/v1/image-search';
let main=[...fs.readFileSync(root+'index.html','utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(t=>t.includes('var st={'));
main=main.replace('if(hot&&hot.ready){hot.ready(start);}',`window.qa={pixel:function(x,y){return Array.from(ctx.getImageData(Math.round(x*dpr),Math.round(y*dpr),1,1).data);},prepare:prepareInterior,limit:innerLimitAt,normal:wallNormalThickness,paint:paint,deco:function(op,first,hit){dTool="brush";dOpacity=op;applyDeco(hit||{u:.5,v:.5},first);},clear:clearDeco,hit:hitSurface,look:currentLook,st:st,preset:applyPreset,N:N,targets:TARGETS,parts:scoreBreakdown,score:score,rough:roughPts,section:drawSection,sectionData:sectionProfile,sec:setSec,draw:draw,card:renderCard,tool:function(t){tool=t;},touch:touchClay,ptr:ptr,view:function(){return {CX:CX,BASE:BASE,SV:SV,W:W,HC:HC,TILT:TILT};},inner:innerAt,markReveal:function(){revealPending=true;},free:startFree,stage:setStage,photo:drawPhoto,data:photoData,step:function(){return fstep;},finish:function(){fT=performance.now()-10000;fireTick();},open:openKilnNow,build:buildResult,frame:frame,store:store,push:pushHist,thin:freeThinCause,thinStep:freeThinStep,fall:freeThinFall,fields:itemFields,start:start,save:shelfAddCurrent};if(hot&&hot.ready){hot.ready(start);}`);
w.localStorage.setItem('todak.tutorial.v1','complete');w.eval(main);const q=w.qa;

const doc=w.document,cv=doc.getElementById('cv');q.free();q.preset('bowl');
cv.getBoundingClientRect=()=>({left:0,top:0,width:q.view().W,height:q.view().HC});
function pointer(type,x,y){const e=new w.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:73,clientX:x,clientY:y,button:0,pointerType:'mouse'});cv.dispatchEvent(e);}
// The visible bottom ellipse lies below BASE; it is still clay, not the wheel.
let v=q.view(),r=q.st.radii[0],x=v.CX+r*v.SV*.5,y=v.BASE+r*v.SV*q.view().TILT*Math.sqrt(.75); // exact tilt is injected below
let hit=q.hit(x,y);assert(hit&&hit.v<.02,'visible foot resolves to bottom, not an upper row');
const before=q.st.radii[0];pointer('pointerdown',x,y);pointer('pointermove',x-8,y);for(let n=0;n<5;n++)q.touch(40);pointer('pointerup',x-8,y);assert(q.st.radii[0]<before,'bottom-row shaping responds to the visible foot');
assert.equal(q.hit(v.CX,v.BASE+r*v.SV*q.view().TILT+40),null,'wheel below foot is not paintable');
// A narrow-necked vessel exposes its outer shoulder in the overhead view.
q.st.height=12;q.st.floor=.5;q.st.radii=q.st.radii.map((_,i)=>2+4*Math.sin(Math.PI*i/(q.N-1)));q.st.inner=q.st.radii.map(r=>Math.max(.4,r-.4));q.stage('deco');
const look=q.look();assert.deepEqual(Array.from(look.c),[186,170,152]);doc.getElementById('wheelTop-deco').click();q.draw();let l=w.TodakWheel.layout();
const base=q.pixel(l.x+l.r*.65,l.y);assert(base[0]<200&&base[0]>base[2]+10,'overhead clay keeps the same warm dry-clay colour');
q.deco(1,true,{u:.25,v:.82});q.deco(1,false,{u:.30,v:.72});q.draw();
function blueCount(){const d=cv._native.getContext('2d').getImageData(Math.round((l.x-l.r)),Math.round((l.y-l.r)),Math.round(l.r*2),Math.round(l.r*2)).data;let count=0;for(let i=0;i<d.length;i+=4)if(d[i+2]>d[i]+15&&d[i+2]>d[i+1]+5)count++;return count;}
assert(blueCount()>3,'side brush marks project onto the visible shoulder from above');
q.clear();q.draw();doc.querySelector('[data-d="stamp"]').click();doc.querySelector('#stamps [data-s="leaf"]').click();
pointer('pointerdown',l.x+l.r*.70,l.y);pointer('pointerup',l.x+l.r*.70,l.y);
const painted=q.paint.x.getImageData(0,0,1024,1024).data;let ink=0;for(let i=3;i<painted.length;i+=4)if(painted[i])ink++;assert(ink>10,'top shoulder stamp is committed to the shared side texture');q.draw();assert(blueCount()>3,'stamp remains visible after releasing');
doc.getElementById('topUndo-deco').click();assert(!q.st.topPaint,'one undo restores the whole top stamp');assert(!q.st.used.blue||!q.st.topPaint);
// Broad flat rims have planar artwork; cylindrical UVs must not stretch toward the opening.
q.clear();q.st.inner=q.st.inner.map(r=>r*.25);q.deco(1,true,{u:.25,v:1});q.draw();l=w.TodakWheel.layout();const rimPixel=q.pixel(l.x+l.r*.2,l.y);assert(!(rimPixel[2]>rimPixel[0]+15),'side ink does not stretch as a radial spoke across a flat rim');
doc.querySelector('[data-d="stamp"]').click();pointer('pointerdown',l.x+l.r*.2,l.y);pointer('pointerup',l.x+l.r*.2,l.y);const rimInk=w.TodakWheel.layer.x.getImageData(0,0,768,768).data;assert(rimInk.some((v,i)=>i%4===3&&v>0),'rim stamps remain in the planar layer');
assert.equal(errors.length,0,errors.map(String).join('\n'));console.log('PASS visible foot hit/shaping, wheel exclusion, matching clay colour, side marks visible overhead, shoulder stamps persist to shared texture and undo');dom.window.close();
