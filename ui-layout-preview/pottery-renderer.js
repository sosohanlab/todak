/* 토닥 완성작 전용 PBR renderer. Three.js r160, MIT. No generated replacement images. */
(function(){
'use strict';
// Keep light pottery separated from the backdrop in every render/export.
window.TodakBackdrop=function(color,mode){
  var light=(.2126*color[0]+.7152*color[1]+.0722*color[2])/255,t=Math.max(0,Math.min(1,(light-.69)/.22));t=t*t*(3-2*t);
  var normal={studio:[224,216,206],warm:[233,220,198],dark:[65,74,67]},contrast={studio:[163,151,137],warm:[184,160,130],dark:[65,74,67]},key=normal[mode]?mode:'studio';
  return {rgb:normal[key].map(function(v,i){return Math.round(v+(contrast[key][i]-v)*t);}),woodTint:1-t*.12};
};
var T=window.THREE;
if(!T){window.TodakPhoto={available:false};return;}
var renderer,scene,camera,pot,floor,environment,signature='',materials=[],textures=[],lost=false;
var woodTexture,room,keyLight,cyclorama,glossEnvironment;
var low=matchMedia('(pointer:coarse)').matches;
function canvas(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function noise(x,y){var n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);}
function tex(c,color){var slot=textureByCanvas.get(c),t=slot&&slot[color?'color':'data'];if(!t||t.userData.todakDisposed){t=new T.CanvasTexture(c);if(color)t.colorSpace=T.SRGBColorSpace;t.anisotropy=low?2:8;if(!slot){slot={};textureByCanvas.set(c,slot);}slot[color?'color':'data']=t;}textureOwners.set(t,(textureOwners.get(t)||0)+1);textures.push(t);return t;}

function makeEnvironment(){
  // One periodic HDR studio shared by every glaze and both viewing modes.
  var w=512,h=256,data=new Float32Array(w*h*4);
  function panel(u,v,cx,cy,sx,sy){var dx=u-cx;dx-=Math.floor(dx+.5);return Math.exp(-Math.pow(dx/sx,4)-Math.pow((v-cy)/sy,4));}
  for(var y=0;y<h;y++)for(var x=0;x<w;x++){var u=x/w,v=y/h,base=.16+.22*Math.sin(Math.PI*v),key=8*panel(u,v,.70,.50,.026,.44),fill=.85*panel(u,v,.86,.53,.075,.26),rim=1.5*panel(u,v,.26,.48,.07,.19),top=2.5*panel(u,v,.58,.78,.10,.065)+5.5*panel(u,v,.70,.18,.028,.12),i=(y*w+x)*4;data[i]=base+key+fill*.98+rim+top;data[i+1]=base+key*.995+fill+rim*.99+top;data[i+2]=base+key*.98+fill+rim*.98+top;data[i+3]=1;}
  var raw=new T.DataTexture(data,w,h,T.RGBAFormat,T.FloatType);raw.mapping=T.EquirectangularReflectionMapping;raw.needsUpdate=true;var pm=new T.PMREMGenerator(renderer);environment=pm.fromEquirectangular(raw);glossEnvironment=environment;scene.environment=environment.texture;raw.dispose();pm.dispose();
}
function init(){
  if(renderer)return !lost;
  try{
    renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:low?'low-power':'high-performance'});
    renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.VSMShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
    renderer.domElement.addEventListener('webglcontextlost',function(e){e.preventDefault();lost=true;});
    renderer.domElement.addEventListener('webglcontextrestored',function(){lost=false;signature='';});
    scene=new T.Scene();camera=new T.PerspectiveCamera(32,1,.1,500);pot=new T.Group();scene.add(pot);
    scene.add(new T.HemisphereLight(0xf7f5ef,0x9a9991,.28));
    var key=keyLight=new T.DirectionalLight(0xfff7ed,1.9);key.position.set(-12,25,16);key.castShadow=true;key.shadow.blurSamples=12;
    key.shadow.mapSize.set(low?1024:2048,low?1024:2048);Object.assign(key.shadow.camera,{left:-30,right:30,top:35,bottom:-30,near:1,far:100});key.shadow.normalBias=.025;key.shadow.bias=-.00015;key.shadow.radius=5;scene.add(key);
    var fill=new T.DirectionalLight(0xf0f4ff,.50);fill.position.set(12,17,-14);scene.add(fill);
    floor=new T.Mesh(new T.PlaneGeometry(2000,2000),new T.MeshStandardMaterial({color:0xe4d9ca,roughness:.92}));floor.rotation.x=-Math.PI/2;floor.position.y=-.025;floor.receiveShadow=false;scene.add(floor);
    var receiver=new T.Mesh(new T.PlaneGeometry(2000,2000),new T.ShadowMaterial({opacity:.11}));receiver.rotation.x=-Math.PI/2;receiver.position.y=-.018;receiver.receiveShadow=true;scene.add(receiver);
    var c=canvas(128,128),g=c.getContext('2d'),grad=g.createRadialGradient(64,64,0,64,64,64);grad.addColorStop(0,'rgba(30,24,17,.42)');grad.addColorStop(.55,'rgba(30,24,17,.17)');grad.addColorStop(.78,'rgba(30,24,17,.10)');grad.addColorStop(1,'rgba(30,24,17,0)');g.fillStyle=grad;g.fillRect(0,0,128,128);
    var contact=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false,opacity:.8}));contact.name='contact';contact.rotation.x=-Math.PI/2;contact.position.y=-.012;scene.add(contact);
    var wood=canvas(512,512),wx=wood.getContext('2d'),wi=wx.createImageData(512,512);
    for(var yy=0;yy<512;yy++)for(var xx=0;xx<512;xx++){var ii=(yy*512+xx)*4,v=3*Math.sin(yy*.22+Math.sin(xx*.013)*2)+(noise(xx,yy)-.5)*5;wi.data[ii]=204+v;wi.data[ii+1]=180+v;wi.data[ii+2]=147+v;wi.data[ii+3]=255;}wx.putImageData(wi,0,0);
    woodTexture=new T.CanvasTexture(wood);woodTexture.colorSpace=T.SRGBColorSpace;woodTexture.wrapS=woodTexture.wrapT=T.RepeatWrapping;woodTexture.repeat.set(40,40);
    room=new T.Group();scene.add(room);
    function box(w,h,z,x,y,depth,color){var m=new T.Mesh(new T.BoxGeometry(w,h,z),new T.MeshStandardMaterial({color:color,roughness:.86}));m.position.set(x,y,depth);m.castShadow=true;m.receiveShadow=true;room.add(m);return m;}
    var wall=box(240,100,1,0,50,-36,0xd6cbbb);wall.name='wall';
    var plaster=canvas(256,256),px=plaster.getContext('2d'),pi=px.createImageData(256,256);
    for(var j=0;j<256*256;j++){var tone=238+noise(j%256,j/256|0)*15;pi.data[j*4]=pi.data[j*4+1]=pi.data[j*4+2]=tone;pi.data[j*4+3]=255;}px.putImageData(pi,0,0);
    var plasterMap=new T.CanvasTexture(plaster);plasterMap.wrapS=plasterMap.wrapT=T.RepeatWrapping;plasterMap.repeat.set(6,3);wall.material.map=plasterMap;wall.material.bumpMap=plasterMap;wall.material.bumpScale=.03;
    // Window remains off to the side; it frames the light rather than dominating the photo.
    var windowFrame=new T.Group();windowFrame.name='window';room.add(windowFrame);
    function windowBar(w,h,x,y){var m=new T.Mesh(new T.BoxGeometry(w,h,.6),new T.MeshStandardMaterial({color:0xd6ccba,roughness:.9}));m.position.set(x,y,-34);m.castShadow=false;windowFrame.add(m);}
    var pane=new T.Mesh(new T.PlaneGeometry(12,21),new T.MeshBasicMaterial({color:0xeee8da}));pane.position.set(-22,14,-34.5);windowFrame.add(pane);
    windowBar(.35,22,-28,14);windowBar(.35,22,-16,14);windowBar(12,.35,-22,14);windowBar(14,.6,-22,3);
    // A shallow niche and its ledge, not an oversized empty picture frame.
    var niche=box(8,10,.5,19,10,-34,0x7b8576);niche.name='niche';
    var ledge=box(10,.45,2,19,4.8,-32.5,0xb8aa93);ledge.name='ledge';
    var profile=[[100,-.04],[-8,-.04]];
    for(var step=1;step<=40;step++){var theta=step/40*Math.PI/2;profile.push([-8-12*Math.sin(theta),12-12*Math.cos(theta)-.04]);}profile.push([-20,100]);
    var vertices=[],triangles=[];profile.forEach(function(p){vertices.push(-180,p[1],p[0],180,p[1],p[0]);});for(var row=0;row<profile.length-1;row++){var a=row*2;triangles.push(a,a+1,a+2,a+1,a+3,a+2);}
    var cove=new T.BufferGeometry();cove.setAttribute('position',new T.Float32BufferAttribute(vertices,3));cove.setIndex(triangles);cove.computeVertexNormals();cyclorama=new T.Mesh(cove,new T.MeshStandardMaterial({color:0xbab0a2,roughness:1,side:T.DoubleSide}));scene.add(cyclorama);
    makeEnvironment();return true;
  }catch(e){console.warn('토닥: 3D를 사용할 수 없어 기본 보기로 표시합니다.',e);window.TodakPhoto.available=false;return false;}
}
function disposePot(){while(pot.children.length){var m=pot.children[0];m.geometry.dispose();pot.remove(m);}materials.forEach(function(m){m.dispose();});textures.forEach(function(t){t.dispose();});materials=[];textures=[];}

var geometryCache=new Map(),materialCache=new Map(),glazeCache=new Map(),textureOwners=new Map(),textureByCanvas=new WeakMap();
var frameCache=new Map(),lastPreview=null,composite=null,compositeKey='',interactionUntil=0,settleTimer=0;
var mapWorker=null,workerFailed=false,activeMapJob=null,queuedMapJob=null,mapJobId=0,mapPromises=new Map(),cacheGeneration=0,activeGeometryKey='',shadowSceneKey='';
function revivePixels(p){if(!p)return null;var c=canvas(p.width,p.height);c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(p.data),p.width,p.height),0,0);return c;}
function acceptMaps(p){return {color:revivePixels(p.color),bump:revivePixels(p.bump),surface:p.surface?{color:revivePixels(p.surface.color),height:revivePixels(p.surface.height),roughness:revivePixels(p.surface.roughness)}:null};}
function rememberMaps(key,value){glazeCache.set(key,value);while(glazeCache.size>2)glazeCache.delete(glazeCache.keys().next().value);}
function finishMapJob(job,maps){if(maps&&job.generation===cacheGeneration)rememberMaps(job.key,maps);mapPromises.delete(job.key);job.resolve(!!maps);window.dispatchEvent(new Event('todak-photo-resources-ready'));}
function startMapJob(job){activeMapJob=job;mapWorker.postMessage(job.data,job.transfer);}
function prepareMaps(d){var key=textureSignature(d);if(glazeCache.has(key)||materialCache.has(materialSignature(d)))return Promise.resolve(true);if((!geometryCache.size&&d.surface!=='crackle')||workerFailed||!window.Worker||!window.OffscreenCanvas)return Promise.resolve(false);if(mapPromises.has(key))return mapPromises.get(key);try{
 if(!mapWorker){mapWorker=new Worker(new URL('photo-texture-worker.js',document.baseURI));mapWorker.onmessage=function(event){var job=activeMapJob;if(!job||job.id!==event.data.id)return;if(event.data.error){workerFailed=true;finishMapJob(job,null);}else finishMapJob(job,acceptMaps(event.data));activeMapJob=null;if(queuedMapJob){var next=queuedMapJob;queuedMapJob=null;startMapJob(next);}};mapWorker.onerror=function(){workerFailed=true;if(activeMapJob)finishMapJob(activeMapJob,null);if(queuedMapJob)finishMapJob(queuedMapJob,null);activeMapJob=queuedMapJob=null;mapWorker.terminate();mapWorker=null;};}
 var job={id:++mapJobId,key:key,generation:cacheGeneration,transfer:[],data:{id:mapJobId,low:low,color:d.color.slice(),glazeId:d.glazeId,surface:d.surface}},promise=new Promise(function(resolve){job.resolve=resolve;});mapPromises.set(key,promise);if(activeMapJob){if(queuedMapJob)finishMapJob(queuedMapJob,null);queuedMapJob=job;}else startMapJob(job);return promise;
 }catch(e){workerFailed=true;return Promise.resolve(false);}}
function ensureMaps(d){var key=textureSignature(d);if(glazeCache.has(key)||materialCache.has(materialSignature(d))||(!geometryCache.size&&d.surface!=='crackle')||workerFailed||!window.Worker||!window.OffscreenCanvas)return true;prepareMaps(d);return false;}
function lru(map,key,make,dispose,limit){if(map.has(key)){var value=map.get(key);map.delete(key);map.set(key,value);return value;}var value=make();map.set(key,value);while(map.size>limit){var first=map.keys().next().value,old=map.get(first);map.delete(first);dispose(old);}return value;}
function releaseTextures(bundle){bundle.materials.forEach(function(m){m.dispose();});bundle.textures.forEach(function(t){var count=textureOwners.get(t)-1;if(count>0)textureOwners.set(t,count);else{textureOwners.delete(t);t.dispose();t.userData.todakDisposed=true;}});}
function releaseCanvas(c){c.width=c.height=1;}
function textureSignature(d){return [d.glazeId,d.surface,d.color.join(',')].join('|');}
function geometrySignature(d){return [d.geometryKey||d.key,!!d.fracturePreview,!!d.carve,!!d.bottomCarve,!!d.topCarve,d.carveDepth||.12,d.carveMode||'',d.bottomTrim?d.bottomTrim.join(','):''].join('|');}
function materialSignature(d){return [d.materialKey||d.key,d.geometryKey||d.key,d.height,d.floor,d.dipAngle||0,d.dipFrom||'top',!!d.topOverlay,!!d.topCarve,!!d.bottomOverlay,!!d.overhead].join('|');}
function glazeMaps(d){return lru(glazeCache,textureSignature(d),function(){d=Object.assign({},d,{overlay:null});
var size=low?512:1024,c=canvas(size,size),g=c.getContext('2d'),base=d.color;
  g.fillStyle='rgb('+base.join(',')+')';g.fillRect(0,0,size,size);
  var pix=g.getImageData(0,0,size,size);
  var angles=new Float64Array(size),sin2=new Float64Array(size),sin3=new Float64Array(size);for(var xx=0;xx<size;xx++){var a=xx/size*Math.PI*2;angles[xx]=a*3;sin2[xx]=Math.sin(a*2);sin3[xx]=Math.sin(a*3);}var depth=d.glazeId==='cobalt'?12:(d.glazeId==='cheongja'||d.glazeId==='mint'?5:1.8);
  for(var y=0;y<size;y++){var row23=Math.sin(y*.023)*2,fade=Math.max(0,Math.min(1,y/10,(size-1-y)/10));for(var x=0;x<size;x++){var i=(y*size+x)*4,n=noise(x,y),cloud=Math.sin(angles[x]+row23)*Math.sin(y*.017+sin2[x]*1.3),v=(n-.5)*3+Math.sin(y*.031+sin3[x])*.8+cloud*depth;v*=fade;if(n>.998)v-=15*fade;for(var k=0;k<3;k++)pix.data[i+k]=Math.max(0,Math.min(255,base[k]+v));}}
  g.putImageData(pix,0,0);
  var surface=d.surface==='crackle'&&window.TodakCeramicSurface?(TodakCeramicSurface.createStudio||TodakCeramicSurface.create)(low?512:1024,d.surface):null;
  
  if(d.overlay)g.drawImage(d.overlay,0,0,size,size);
  // The underside receives the selected base glaze and the same finish as the outside.
  var bump=canvas(512,512),bg=bump.getContext('2d'),im=bg.createImageData(512,512);
  for(var j=0;j<512*512;j++){var xx=j%512,yy=j/512|0,edge=Math.max(0,Math.min(1,yy/12,(511-yy)/12)),vv=128+((noise(xx,yy)-.5)*12+Math.sin(yy*.65)*1.5)*edge;im.data[j*4]=im.data[j*4+1]=im.data[j*4+2]=vv;im.data[j*4+3]=255;}bg.putImageData(im,0,0);
  // Micro texture stays separate from the true carved geometry.
  
  return {color:c,bump:bump,surface:surface};

},function(m){/* Materials may still reference these canvases until their own LRU eviction. */},2);}
var studioRoughnessCanvas=null;
function studioRoughness(){if(studioRoughnessCanvas)return studioRoughnessCanvas;var c=studioRoughnessCanvas=canvas(128,128),x=c.getContext('2d'),p=x.createImageData(128,128);for(var y=0;y<128;y++)for(var i=0;i<128;i++){var at=(y*128+i)*4,v=246+(noise(i,y)-.5)*8;p.data[at]=p.data[at+1]=p.data[at+2]=v;p.data[at+3]=255;}x.putImageData(p,0,0);return c;}
function buildMaterials(d){
  textures=[];materials=[];var angled=!!d.dipDepth&&(Math.abs(Number(d.dipAngle)||0)>.0001||d.dipFrom==='bottom');var maps=glazeMaps(d),surface=maps.surface,color=maps.color;if(d.overlay){color=canvas(maps.color.width,maps.color.height);var colorContext=color.getContext('2d');colorContext.drawImage(maps.color,0,0);colorContext.drawImage(d.overlay,0,0,color.width,color.height);}var map=tex(color,true),micro=tex(maps.bump,false),gloss=d.finish==='gloss';
  var outer=new T.MeshPhysicalMaterial({map:map,metalness:0,roughness:gloss?.16:.74,roughnessMap:tex(studioRoughness(),false),clearcoat:gloss?1:.035,clearcoatRoughness:gloss?.045:.55,ior:1.47,bumpMap:micro,bumpScale:gloss?.003:.009,envMap:glossEnvironment.texture,envMapIntensity:gloss?1.05:.40});
  if(surface){outer.bumpScale=.010;outer.roughness=gloss?.20:.86;}
  var inside=outer.clone(),innerCanvas=canvas(64,256),ix=innerCanvas.getContext('2d');
  // Occlusion increases below the opening, including the inside floor.
  for(var iy=0;iy<256;iy++){
    var level=1-iy/255,depth=Math.max(0,Math.min(1,(1-level)*d.height/Math.max(.05,d.height-d.floor))),shade=1-.13*Math.pow(depth,.85),innerColor=!angled&&d.dipDepth&&iy<256*d.dipDepth?d.dipColor:d.inside;
    ix.fillStyle='rgb('+innerColor.map(function(channel){return Math.round(channel*shade);}).join(',')+')';ix.fillRect(0,iy,64,1);
  }
  if(surface){

  }
  if(d.topOverlay||d.topCarve){
    innerCanvas=canvas(768,768);ix=innerCanvas.getContext('2d');
    ix.fillStyle='rgb('+d.inside.join(',')+')';ix.fillRect(0,0,768,768);

    ix.save();ix.globalAlpha=d.topOpacity==null?.64:d.topOpacity;if(d.topOverlay&&!angled)ix.drawImage(d.topOverlay,0,0,768,768);ix.restore();
  }
  if(d.topOverlay||d.topCarve){
    inside.onBeforeCompile=function(shader){
      if(d.topCarve&&!d.topOverlay&&!angled){shader.uniforms.todakDipDepth={value:d.dipDepth||0};var base=new T.Color('rgb('+d.inside.join(',')+')'),dip=new T.Color('rgb('+d.dipColor.join(',')+')');shader.uniforms.todakDipRatio={value:new T.Vector3(dip.r/Math.max(.0001,base.r),dip.g/Math.max(.0001,base.g),dip.b/Math.max(.0001,base.b))};}
      shader.uniforms.todakVesselHeight={value:d.height};shader.uniforms.todakInteriorDepth={value:d.height/Math.max(.05,d.height-d.floor)};
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float todakVesselHeight;\nvarying float todakInnerLevel;').replace('#include <begin_vertex>','#include <begin_vertex>\ntodakInnerLevel = position.y / todakVesselHeight;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float todakInteriorDepth;\nvarying float todakInnerLevel;').replace('#include <opaque_fragment>','outgoingLight *= 1.0 - .12 * pow(clamp((1.0 - todakInnerLevel) * todakInteriorDepth, 0.0, 1.0), .9);\n#include <opaque_fragment>');
    if(d.topCarve&&!d.topOverlay&&!angled)shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float todakDipDepth;\nuniform vec3 todakDipRatio;').replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb*=mix(vec3(1.),todakDipRatio,step(1.-todakDipDepth,todakInnerLevel)*step(.00001,todakDipDepth));');
    };inside.customProgramCacheKey=function(){return 'todak-studio-inner-v1';};
  }
  inside.map=tex(innerCanvas,true);inside.envMap=glossEnvironment.texture;inside.clearcoatRoughness=gloss?.055:.55;inside.roughness=surface?(gloss?.22:.90):(gloss?.19:.79);inside.envMapIntensity=gloss?1:.40;inside.clearcoat=gloss?1:.035;

  if(d.topCarve){var cutCanvas=canvas(512,512),cutContext=cutCanvas.getContext('2d'),cutMask=canvas(512,512);cutMask.getContext('2d').drawImage(d.topCarve,0,0,512,512);var pixels=cutMask.getContext('2d').getImageData(0,0,512,512),heights=cutContext.createImageData(512,512);for(var i=0;i<pixels.data.length;i+=4){var h=128+(pixels.data[i]>127?1:-1)*pixels.data[i+3]/255*80;heights.data[i]=heights.data[i+1]=heights.data[i+2]=h;heights.data[i+3]=255;}cutMask.getContext('2d').putImageData(heights,0,0);cutContext.filter='blur(1.5px)';cutContext.drawImage(cutMask,0,0);inside.bumpMap=tex(cutCanvas,false);inside.bumpScale=.065;}
  if(angled){
    var priorDip=inside.onBeforeCompile,topPaint=d.topOverlay?tex(d.topOverlay,true):null;
    inside.onBeforeCompile=function(shader){priorDip.call(this,shader);shader.uniforms.todakTiltPlane={value:new T.Vector3(d.height*(d.dipFrom==='bottom'?d.dipDepth:1-d.dipDepth),Math.tan((d.dipAngle||0)*Math.PI/180),d.height)};shader.uniforms.todakDipSign={value:d.dipFrom==='bottom'?-1:1};shader.uniforms.todakTiltFloor={value:d.floor};shader.uniforms.todakTiltColor={value:new T.Color().setRGB(d.dipColor[0]/255,d.dipColor[1]/255,d.dipColor[2]/255,T.SRGBColorSpace)};
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform vec3 todakTiltPlane;\nvarying vec3 todakDipPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\ntodakDipPosition=position;');
      var declarations='\nuniform vec3 todakTiltPlane;\nuniform float todakDipSign;\nuniform float todakTiltFloor;\nuniform vec3 todakTiltColor;\nvarying vec3 todakDipPosition;';
      var dipCode='\nfloat todakDipCoverage=smoothstep(-.015,.015,(todakDipPosition.y-todakTiltPlane.x-todakTiltPlane.y*todakDipPosition.x)*todakDipSign);\n';
      dipCode+=(d.topOverlay||d.topCarve)?'diffuseColor.rgb=mix(diffuseColor.rgb,todakTiltColor,todakDipCoverage);':'float todakDipShade=1.-.13*pow(clamp((1.-todakDipPosition.y/todakTiltPlane.z)*todakTiltPlane.z/max(.05,todakTiltPlane.z-todakTiltFloor),0.,1.),.85);diffuseColor.rgb=mix(diffuseColor.rgb,todakTiltColor*todakDipShade,todakDipCoverage);';
      if(topPaint){shader.uniforms.todakTiltPaint={value:topPaint};shader.uniforms.todakTiltPaintOpacity={value:d.topOpacity==null?.64:d.topOpacity};declarations+='\nuniform sampler2D todakTiltPaint;\nuniform float todakTiltPaintOpacity;';dipCode+='\nvec4 todakTopPigment=texture2D(todakTiltPaint,vMapUv);diffuseColor.rgb=mix(diffuseColor.rgb,todakTopPigment.rgb,todakTopPigment.a*todakTiltPaintOpacity);';}
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>'+declarations).replace('#include <map_fragment>','#include <map_fragment>'+dipCode);
    };
  }
  // Project only the generated glaze network in local 3D space. Original paint
  // UVs and all vertex buffers remain unchanged, including the interior floor.
  if(surface){
    var crackleColor=tex(surface.color,true),crackleRoughness=tex(surface.roughness,false);
    crackleColor.wrapS=crackleColor.wrapT=crackleRoughness.wrapS=crackleRoughness.wrapT=T.RepeatWrapping;
    function projectCrackle(material){var prior=material.onBeforeCompile;material.onBeforeCompile=function(shader){
      prior.call(this,shader);shader.uniforms.todakCrackleColor={value:crackleColor};shader.uniforms.todakCrackleRoughness={value:crackleRoughness};
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 todakGlazePosition;\nvarying vec3 todakGlazeNormal;').replace('#include <begin_vertex>','#include <begin_vertex>\ntodakGlazePosition=position;\ntodakGlazeNormal=normal;');
      var declarations='\nvarying vec3 todakGlazePosition;\nvarying vec3 todakGlazeNormal;\nuniform sampler2D todakCrackleColor;\nuniform sampler2D todakCrackleRoughness;\nvec4 todakGlazeSample(sampler2D glaze){vec3 p=todakGlazePosition*.12;vec3 w=pow(abs(normalize(todakGlazeNormal)),vec3(4.));w/=max(.0001,w.x+w.y+w.z);return texture2D(glaze,p.yz)*w.x+texture2D(glaze,p.xz)*w.y+texture2D(glaze,p.xy)*w.z;}\n';
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>'+declarations).replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb*=todakGlazeSample(todakCrackleColor).rgb;').replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor*=todakGlazeSample(todakCrackleRoughness).g;');
    };}
    projectCrackle(outer);projectCrackle(inside);
  }

  // The flat lip/sole should use its actual face normal; interpolating the
  // adjacent inner/outer-wall normals creates dark alternating edge samples.
  function studioEdge(material,inner){var prior=material.onBeforeCompile;material.onBeforeCompile=function(shader){prior.call(this,shader);shader.uniforms.todakEdgeHeight={value:d.height};shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float todakEdgeHeight;\nvarying float todakEdgeLevel;').replace('#include <begin_vertex>','#include <begin_vertex>\ntodakEdgeLevel=position.y/todakEdgeHeight;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float todakEdgeLevel;').replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\nvec3 todakFaceNormal=normalize(cross(dFdx(vViewPosition),dFdy(vViewPosition)));\nif(todakEdgeLevel>.9998||todakEdgeLevel<.0002){normal=todakFaceNormal;nonPerturbedNormal=normal;}');};material.customProgramCacheKey=function(){return 'todak-studio-edge-v2-'+(inner&&(d.topOverlay||d.topCarve)?'painted-inner':'plain')+(inner&&d.topCarve&&!d.topOverlay?'-top-cut-dip':'')+(angled?'-dip-tilt-v1'+(d.topOverlay?'-paint':''):'')+(surface?'-crackle-v3':'');};}
  studioEdge(outer,false);studioEdge(inside,true);
  // Closely spaced throwing ridges otherwise reflect the sharp studio panels as
  // broken, near-black rings. Broaden only those reflections, preserving every
  // profile sample, painted layer, carving and the gloss on smooth vessels.
  if(gloss){
    var outerBend=0,innerBend=0;
    for(var sample=1;sample<64;sample++){
      var level=sample/64,step=1/64;
      outerBend+=Math.abs(d.rAt(level-step)-2*d.rAt(level)+d.rAt(level+step));
      if(level*d.height>d.floor+step*d.height)innerBend+=Math.abs(d.innerAt(level-step)-2*d.innerAt(level)+d.innerAt(level+step));
    }
    var softenOuter=Math.max(0,Math.min(1,(outerBend/63-.015)/.045));
    var softenInner=Math.max(0,Math.min(1,(innerBend/63-.015)/.045));
    outer.roughness+=Math.max(0,.23-outer.roughness)*softenOuter;
    outer.clearcoat+=(.85-outer.clearcoat)*softenOuter;
    outer.clearcoatRoughness+=(.10-outer.clearcoatRoughness)*softenOuter;
    outer.envMapIntensity+=(.85-outer.envMapIntensity)*softenOuter;
    inside.roughness+=Math.max(0,.25-inside.roughness)*softenInner;
    inside.clearcoat+=(.85-inside.clearcoat)*softenInner;
    inside.clearcoatRoughness+=(.11-inside.clearcoatRoughness)*softenInner;
    inside.envMapIntensity+=(.85-inside.envMapIntensity)*softenInner;
  }
  var underside=outer.clone();underside.bumpMap=null;underside.bumpScale=0;underside.map=null;var baseColor=d.dipFrom==='bottom'&&d.dipDepth&&!d.dipAngle?d.dipColor:d.color;underside.color.setRGB(baseColor[0]/255,baseColor[1]/255,baseColor[2]/255,T.SRGBColorSpace);if(d.bottomOverlay){var bc=canvas(768,768),bx=bc.getContext('2d');bx.fillStyle='rgb('+baseColor.join(',')+')';bx.fillRect(0,0,768,768);bx.globalAlpha=d.bottomOpacity==null?.8:d.bottomOpacity;bx.drawImage(d.bottomOverlay,0,0,768,768);underside.map=tex(bc,true);underside.color.setHex(0xffffff);}
if(angled){
 var solePaint=d.bottomOverlay?tex(d.bottomOverlay,true):null;
 underside.onBeforeCompile=function(shader){
  shader.uniforms.todakSolePlane={value:new T.Vector2(d.height*(d.dipFrom==='bottom'?d.dipDepth:1-d.dipDepth),Math.tan((d.dipAngle||0)*Math.PI/180))};
  shader.uniforms.todakSoleSign={value:d.dipFrom==='bottom'?-1:1};
  shader.uniforms.todakSoleBase={value:new T.Color().setRGB(d.color[0]/255,d.color[1]/255,d.color[2]/255,T.SRGBColorSpace)};
  shader.uniforms.todakSoleDip={value:new T.Color().setRGB(d.dipColor[0]/255,d.dipColor[1]/255,d.dipColor[2]/255,T.SRGBColorSpace)};
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 todakSolePosition;').replace('#include <begin_vertex>','#include <begin_vertex>\ntodakSolePosition=position;');
  var decl='\nvarying vec3 todakSolePosition;\nuniform vec2 todakSolePlane;\nuniform float todakSoleSign;\nuniform vec3 todakSoleBase;\nuniform vec3 todakSoleDip;',code='\nfloat soleCoverage=smoothstep(-.015,.015,(todakSolePosition.y-todakSolePlane.x-todakSolePlane.y*todakSolePosition.x)*todakSoleSign);diffuseColor.rgb=mix(todakSoleBase,todakSoleDip,soleCoverage);';
  if(solePaint){shader.uniforms.todakSolePaint={value:solePaint};shader.uniforms.todakSoleOpacity={value:d.bottomOpacity==null?.8:d.bottomOpacity};decl+='\nuniform sampler2D todakSolePaint;\nuniform float todakSoleOpacity;';code+='\nvec4 solePigment=texture2D(todakSolePaint,vMapUv);diffuseColor.rgb=mix(diffuseColor.rgb,solePigment.rgb,solePigment.a*todakSoleOpacity);';}
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>'+decl).replace('#include <map_fragment>','#include <map_fragment>'+code);
 };
 underside.customProgramCacheKey=function(){return 'todak-sole-dip-v1'+(solePaint?'-paint':'');};
}
materials.push(outer,inside,underside);
  return {materials:materials,textures:textures};

}
function buildGeometry(d){
  var carving=!!d.carve,fracture=!!d.fracturePreview,n=fracture?(carving?64:48):carving?(low?224:320):128,H=d.height,ro=d.rAt(1),ri=d.innerAt(1),hollow=H-d.floor>.05;
  // Tiny rounded edges avoid a grazing, razor-sharp material seam at rim and foot.
  var footBevel=Math.min(.045,H*.004,d.rAt(0)*.02),rimBevel=d.profileRounded?Math.max(.001,Math.min(.025,(ro-ri)*.25,H*.004)):hollow?Math.max(.001,Math.min(.045+(d.rimSoftness||0)*.16,(ro-ri)*.45,H*.018)):.02;
  function underside(t){var a=d.bottomTrim;if(!Array.isArray(a)||a.length<2)return 0;var p=Math.max(0,Math.min(1,t))*(a.length-1),i=Math.min(a.length-2,Math.floor(p));return Math.max(0,a[i]+(a[i+1]-a[i])*(p-i));}
  var points=[new T.Vector2(0,underside(0))],baseR=Math.max(0,d.rAt(0)-footBevel),baseRows=(d.bottomCarve||d.bottomTrim)?(fracture?12:low?80:128):1;for(var br=1;br<=baseRows;br++)points.push(new T.Vector2(baseR*br/baseRows,underside(baseR*br/baseRows/Math.max(.001,d.rAt(0)))));var outerStart=points.length-1;
  points.push(new T.Vector2(d.rAt(0)-footBevel*.25,footBevel*.25));
  points.push(new T.Vector2(d.rAt(footBevel/H),footBevel));
  for(var a=1;a<n;a++){var outerY=H*a/n;if(outerY>footBevel&&outerY<H-rimBevel)points.push(new T.Vector2(d.rAt(a/n),outerY));}
  for(var lip=0;lip<=6;lip++){var angle=lip/6*Math.PI/2;points.push(new T.Vector2(ro-rimBevel+rimBevel*Math.cos(angle),H-rimBevel+rimBevel*Math.sin(angle)));}
  var outerEnd=points.length-1;
  if(hollow){
    for(var lip=0;lip<=6;lip++){var angle=Math.PI/2+lip/6*Math.PI/2;points.push(new T.Vector2(ri+rimBevel+rimBevel*Math.cos(angle),H-rimBevel+rimBevel*Math.sin(angle)));}
    for(var b=n-1;b>=0;b--){var yy=d.floor+(H-d.floor)*b/n;if(yy<H-rimBevel)points.push(new T.Vector2(d.innerAt(yy/H),yy));}
    points.push(new T.Vector2(0,d.floor));
  }else points.push(new T.Vector2(0,H));
  var segments=fracture?96:carving?(low?320:512):(low?160:256),geo=new T.LatheGeometry(points,segments),uv=geo.attributes.uv,pos=geo.attributes.position;
  for(var z=0;z<uv.count;z++){
    uv.setY(z,Math.max(0,Math.min(1,pos.getY(z)/H)));
    if((d.bottomOverlay||d.bottomCarve)&&z%points.length<=outerStart)uv.setXY(z,.5+pos.getX(z)/(2*d.rAt(0)),.5+pos.getZ(z)/(2*d.rAt(0)));
    if((d.topOverlay||d.topCarve)&&z%points.length>outerEnd){var topR=d.topRadius||d.rAt(1);uv.setXY(z,.5+pos.getX(z)/(2*topR),.5+pos.getZ(z)/(2*topR));}
  }
  geo.clearGroups();var segs=segments,rows=points.length-1,indices=[[],[],[]],old=geo.index.array;
  for(var s=0;s<segs;s++)for(var row=0;row<rows;row++){
    var material=row<outerStart?2:(row<outerEnd?0:1),offset=(s*rows+row)*6;
    for(var q=0;q<6;q++)indices[material].push(old[offset+q]);
  }
  var reordered=[],start=0;
  indices.forEach(function(group,index){geo.addGroup(start,group.length,index);start+=group.length;for(var j=0;j<group.length;j++)reordered.push(group[j]);});geo.setIndex(reordered);
  // Incisions change the actual outer shell, including its silhouette and normals.
  var incisionStats={vertices:0,maxDepth:0,raisedVertices:0,maxRaise:0};
  if(carving){
    var mask=canvas(1024,1024),mx=mask.getContext('2d');mx.filter='blur(5px)';mx.drawImage(d.carve,0,0,1024,1024);
    var alpha=mx.getImageData(0,0,1024,1024).data,normal=geo.attributes.normal;
    function cutAt(u,v){var x=((u%1+1)%1)*1024,y=Math.max(0,Math.min(1023,(1-v)*1023)),xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;
      function a(xx,yy){var i=(yy*1024+(xx%1024))*4;return alpha[i+3]/255*(d.carveMode==='raised'?-1:(alpha[i]>127?-1:1));}
      return (a(xi,yi)*(1-xf)+a(xi+1,yi)*xf)*(1-yf)+(a(xi,Math.min(1023,yi+1))*(1-xf)+a(xi+1,Math.min(1023,yi+1))*xf)*yf;
    }
    for(var vi=0;vi<pos.count;vi++){
      var profileRow=vi%points.length;if(profileRow<outerStart||profileRow>outerEnd)continue;
      var py=pos.getY(vi),level=Math.max(0,Math.min(1,py/H)),r=Math.hypot(pos.getX(vi),pos.getZ(vi)),wall=py>d.floor?Math.max(.025,r-d.innerAt(level)):Math.max(.025,r),amount=cutAt(uv.getX(vi),uv.getY(vi));
      var fade=Math.min(.35,H*.04),edge=Math.max(0,Math.min(1,py/fade,(H-py)/fade));edge=edge*edge*(3-2*edge);var depth=amount*(amount<0?(d.carveDepth||.12):Math.min(d.carveDepth||.12,wall*.32))*Math.max(0,edge);
      if(Math.abs(depth)>.00001){var ratio=Math.max(.01,r-depth)/Math.max(.001,r);pos.setXYZ(vi,pos.getX(vi)*ratio,py,pos.getZ(vi)*ratio);incisionStats.vertices++;incisionStats.maxDepth=Math.max(incisionStats.maxDepth,depth);if(depth<0){incisionStats.raisedVertices++;incisionStats.maxRaise=Math.max(incisionStats.maxRaise,-depth);}}
    }
    pos.needsUpdate=true;geo.computeVertexNormals();
    // The first and last angular columns coincide; keep their normals identical.
    var normals=geo.attributes.normal;for(var row=0;row<points.length;row++){var first=row,last=segs*points.length+row,nx=normals.getX(first)+normals.getX(last),ny=normals.getY(first)+normals.getY(last),nz=normals.getZ(first)+normals.getZ(last),len=Math.hypot(nx,ny,nz)||1;normals.setXYZ(first,nx/len,ny/len,nz/len);normals.setXYZ(last,nx/len,ny/len,nz/len);}normals.needsUpdate=true;geo.computeBoundingSphere();
  }
  for(var baseNormal=0;baseNormal<pos.count;baseNormal++){if(baseNormal%points.length<=outerStart)geo.attributes.normal.setXYZ(baseNormal,0,-1,0);}
  if(d.bottomCarve){var preservedNormals=geo.attributes.normal.array.slice();var bm=canvas(768,768),bmx=bm.getContext('2d');bmx.drawImage(d.bottomCarve,0,0,768,768);var bd=bmx.getImageData(0,0,768,768).data;for(var bv=0;bv<pos.count;bv++){if(bv%points.length>outerStart)continue;var bx=Math.max(0,Math.min(767,Math.round(uv.getX(bv)*767))),by=Math.max(0,Math.min(767,Math.round((1-uv.getY(bv))*767))),bi=(by*768+bx)*4,amount=(bd[bi]>127?-1:1)*bd[bi+3]/255,rad=Math.hypot(pos.getX(bv),pos.getZ(bv)),fade=Math.max(0,Math.min(1,(baseR-rad)/Math.max(.03,baseR*.04)));pos.setY(bv,amount*Math.min(.10,Math.max(.01,d.floor*.25))*fade);}pos.needsUpdate=true;geo.computeVertexNormals();for(var normalIndex=0;normalIndex<pos.count;normalIndex++){if(normalIndex%points.length>=outerStart||(Math.abs(pos.getY(normalIndex))<1e-8&&Math.hypot(pos.getX(normalIndex),pos.getZ(normalIndex))>baseR*.95)){geo.attributes.normal.setXYZ(normalIndex,preservedNormals[normalIndex*3],preservedNormals[normalIndex*3+1],preservedNormals[normalIndex*3+2]);}}geo.attributes.normal.needsUpdate=true;geo.computeBoundingSphere();}
  return {geometry:geo,incision:incisionStats};

}
function rebuild(d){
 var g=lru(geometryCache,geometrySignature(d),function(){return buildGeometry(d);},function(v){v.geometry.dispose();},2);
 var m=lru(materialCache,materialSignature(d),function(){return buildMaterials(d);},releaseTextures,2);
 while(pot.children.length)pot.remove(pot.children[0]);materials=m.materials;textures=m.textures;
 var mesh=new T.Mesh(g.geometry,materials);mesh.castShadow=true;mesh.receiveShadow=false;mesh.userData.incision=g.incision;pot.add(mesh);
 var contact=scene.getObjectByName('contact'),r=d.rAt(0);contact.scale.set(r*2.45,r*2.45,1);if(activeGeometryKey!==geometrySignature(d))renderer.shadowMap.needsUpdate=true;activeGeometryKey=geometrySignature(d);
}
function configure(d,width,height){
  var scale=d.scale,W=d.width,HC=d.canvasHeight; if(d.framed!==false){var radius=0;for(var f=0;f<=32;f++)radius=Math.max(radius,d.rAt(f/32));var VW=d.viewWidth||W,VH=d.viewHeight||HC;scale=Math.min(VH/(d.height*1.85),VW/(radius*3.8))*(d.zoom||1)*(d.objectScale||1);d=Object.assign({},d,{scale:scale,cx:VW*.5+(d.panX||0),base:VH*.52+d.height*scale*.43+(d.panY||0)});} var pitch=d.elevation==null?.32:Math.sin(d.elevation),cos=Math.sqrt(1-pitch*pitch),aim=(d.base-HC/2)/(scale*cos),x=(W/2-d.cx)/scale;
  camera.aspect=W/HC;camera.near=.1;camera.far=1000;
  var distance=(HC/scale/2)/Math.tan(16*Math.PI/180);
  // Shift the framing through the lens instead of moving the camera sideways.
  // Off-axis viewing made a centered, upright rim appear slanted beside the tool panel.
  camera.setViewOffset(W,HC,W/2-d.cx,0,W,HC);
  camera.up.set(0,1,0);camera.position.set(0,aim+distance*pitch,distance*cos);camera.lookAt(0,aim,0);camera.updateProjectionMatrix();
  if(d.inspection){aim=d.height*.5;camera.setViewOffset(W,HC,0,0,W,HC);camera.position.set(0,aim+distance*pitch,distance*cos);camera.lookAt(0,aim,0);camera.updateProjectionMatrix();}
  if(d.inspection&&Array.isArray(d.inspectionOrientation)&&d.inspectionOrientation.length===4&&d.inspectionOrientation.every(Number.isFinite)){var orientation=new T.Quaternion().fromArray(d.inspectionOrientation).normalize(),center=new T.Vector3(0,d.height*.5,0);camera.position.set(0,0,distance).applyQuaternion(orientation).add(center);camera.up.set(0,1,0).applyQuaternion(orientation);camera.lookAt(center);camera.updateProjectionMatrix();}
  if(pot.rotation.y!==-d.rotation)renderer.shadowMap.needsUpdate=true;pot.rotation.set(0,-d.rotation,0);
  var backdrop=window.TodakBackdrop(d.color,d.background);scene.background=new T.Color().setRGB(backdrop.rgb[0]/255,backdrop.rgb[1]/255,backdrop.rgb[2]/255,T.SRGBColorSpace);floor.material.color.copy(scene.background);
  var map=d.background==='warm'?woodTexture:null;if(floor.material.map!==map){floor.material.map=map;floor.material.needsUpdate=true;}if(map)floor.material.color.setRGB(backdrop.woodTint,backdrop.woodTint,backdrop.woodTint);
  room.visible=!d.transparent;
  // Keep background architecture proportional to the actual vessel, including tiny pieces.
  var roomScale=Math.max(.45,Math.min(1.6,d.height/12));room.scale.set(roomScale,roomScale,roomScale);room.children.forEach(function(o){o.visible=o.name==='wall'&&d.background!=='studio'||d.background==='warm'&&o.name==='window'||d.background==='dark'&&(o.name==='niche'||o.name==='ledge');});
  room.getObjectByName('wall').material.color.set(d.background==='dark'?0x778071:(d.background==='warm'?0xd6cbbb:0xbab0a2));
  keyLight.shadow.radius=8;
  cyclorama.visible=!d.transparent&&d.background==='studio';cyclorama.material.color.copy(scene.background);floor.visible=!d.transparent&&d.background!=='studio';
  scene.getObjectByName('contact').visible=!d.transparent;
  scene.children.forEach(function(o){if(o.material&&o.material.type==='ShadowMaterial')o.visible=!d.transparent;});
  if(d.transparent){scene.background=null;renderer.setClearColor(0x000000,0);}
  var photoBG=!d.transparent&&window.TodakBackgrounds&&TodakBackgrounds.ready(d.background);
  var nextShadowScene=d.transparent?'transparent':photoBG?'photo':d.background;if(nextShadowScene!==shadowSceneKey){shadowSceneKey=nextShadowScene;renderer.shadowMap.needsUpdate=true;}if(photoBG){scene.background=null;renderer.setClearColor(0,0);floor.visible=false;cyclorama.visible=false;room.visible=false;}
  var ratio=Math.max(1,Math.min(low?1.5:2,Math.sqrt((low?2000000:4000000)/(width*height))));if(renderer.getPixelRatio()!==ratio)renderer.setPixelRatio(ratio);var currentSize=renderer.getSize(new T.Vector2());if(currentSize.x!==width||currentSize.y!==height)renderer.setSize(width,height,false);var activeCamera=camera;if(d.overhead){var rr=d.topRadius||0;for(var ri=0;ri<=64;ri++)rr=Math.max(rr,d.rAt(ri/64));activeCamera=new T.OrthographicCamera(-rr,rr,rr,-rr,.01,1000);activeCamera.up.set(0,0,-1);activeCamera.position.set(0,d.height+100,0);activeCamera.lookAt(0,0,0);}renderer.render(scene,activeCamera);
}

function framing(d){var r=0;for(var i=0;i<=32;i++)r=Math.max(r,d.rAt(i/32));var vw=d.viewWidth||d.width,vh=d.viewHeight||d.canvasHeight,scale=Math.min(vh/(d.height*1.85),vw/(r*3.8))*(d.zoom||1)*(d.objectScale||1);return {scale:scale,cx:vw*.5+(d.panX||0),base:vh*.52+d.height*scale*.43+(d.panY||0),radius:r};}
function layerKey(d){var photo=!d.transparent&&window.TodakBackgrounds&&TodakBackgrounds.ready(d.background);return [geometrySignature(d),materialSignature(d),d.pixelWidth,d.pixelHeight,d.width,d.canvasHeight,d.viewWidth,d.viewHeight,d.scale,d.cx,d.base,d.rotation,d.zoom,d.objectScale,d.panX,d.panY,d.elevation,d.inspection&&d.inspectionOrientation?d.inspectionOrientation.join(','):'',!!d.inspection,!!d.overhead,d.topRadius,!!d.transparent,photo?'photo':d.background].join('|');}
function layer(d){var key=layerKey(d);return lru(frameCache,key,function(){var sig=geometrySignature(d)+'|'+materialSignature(d);if(signature!==sig){rebuild(d);signature=sig;}configure(d,d.pixelWidth,d.pixelHeight);var c=canvas(renderer.domElement.width,renderer.domElement.height);c.getContext('2d').drawImage(renderer.domElement,0,0);return {canvas:c,key:key,geometry:geometrySignature(d),material:materialSignature(d),frame:framing(d),data:Object.assign({},d),ratio:renderer.getPixelRatio()};},function(v){releaseCanvas(v.canvas);},2);}
function compositeLayer(d,entry,transform){var src=entry.canvas,photo=!d.transparent&&window.TodakBackgrounds&&TodakBackgrounds.ready(d.background);if(!photo&&!transform)return src;var key=[entry.key,d.background,d.backgroundZoom,d.backgroundPanX,d.backgroundPanY,transform&&JSON.stringify(transform)].join('|');if(compositeKey===key&&composite)return composite;if(!composite)composite=canvas(src.width,src.height);if(composite.width!==src.width)composite.width=src.width;if(composite.height!==src.height)composite.height=src.height;var x=composite.getContext('2d');x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,composite.width,composite.height);if(photo){if(window.TodakRealPhoto&&TodakRealPhoto.drawBackground)TodakRealPhoto.drawBackground(x,composite.width,composite.height,d.background,d.backgroundZoom,d.backgroundPanX,d.backgroundPanY);else TodakBackgrounds.draw(x,composite.width,composite.height,d.background);}x.save();if(transform){var sx=src.width/d.width,sy=src.height/d.canvasHeight;x.translate(transform.cx*sx,transform.base*sy);x.scale(transform.scale,transform.scale);x.translate(-entry.frame.cx*sx,-entry.frame.base*sy);}x.drawImage(src,0,0);x.restore();compositeKey=key;return composite;}
function render(d){if(!init()||lost)return null;try{return compositeLayer(d,layer(d));}catch(e){console.warn('토닥 렌더링 오류',e);return null;}}
function preview(d){if(!init()||lost)return null;if(!ensureMaps(d))return null;var candidate=lastPreview,now=performance.now(),photo=!d.transparent&&window.TodakBackgrounds&&TodakBackgrounds.ready(d.background);if(now<interactionUntil&&photo&&candidate&&frameCache.get(candidate.key)===candidate&&candidate.geometry===geometrySignature(d)&&candidate.material===materialSignature(d)&&candidate.data.rotation===d.rotation&&candidate.data.pixelWidth===d.pixelWidth&&candidate.data.pixelHeight===d.pixelHeight){var f=framing(d),before=candidate.frame,ratio=f.scale/before.scale,margin=before.radius*before.scale*1.8,valid=before.cx-margin>0&&before.cx+margin<d.width&&before.base-d.height*before.scale-margin*.25>0&&before.base+margin*.3<d.canvasHeight;if(valid&&ratio<=Math.max(1.1,candidate.ratio)&&ratio>=.5)return compositeLayer(d,candidate,{scale:ratio,cx:f.cx,base:f.base});}var entry=layer(d);lastPreview=entry;return compositeLayer(d,entry);}
window.TodakPhoto={available:true,render:render,preview:preview,ready:prepareMaps,isReady:function(d){return glazeCache.has(textureSignature(d))||materialCache.has(materialSignature(d))||(!geometryCache.size&&d.surface!=='crackle')||workerFailed||!window.Worker||!window.OffscreenCanvas;},interact:function(){interactionUntil=performance.now()+140;clearTimeout(settleTimer);settleTimer=setTimeout(function(){interactionUntil=0;window.dispatchEvent(new Event('todak-photo-settled'));},145);},stats:function(){return {memory:renderer?Object.assign({},renderer.info.memory):null,programs:renderer?renderer.info.programs.length:0,geometryEntries:geometryCache.size,materialEntries:materialCache.size,glazeEntries:glazeCache.size,frameEntries:frameCache.size,textureReferences:textureOwners.size,workerJobs:mapPromises.size,workerFailed:workerFailed,frameBytes:Array.from(frameCache.values()).reduce(function(s,v){return s+v.canvas.width*v.canvas.height*4;},0)+(composite?composite.width*composite.height*4:0)};},clearCache:function(){cacheGeneration++;if(queuedMapJob){finishMapJob(queuedMapJob,null);queuedMapJob=null;}while(pot&&pot.children.length)pot.remove(pot.children[0]);geometryCache.forEach(function(v){v.geometry.dispose();});geometryCache.clear();materialCache.forEach(releaseTextures);materialCache.clear();glazeCache.forEach(function(v){releaseCanvas(v.color);releaseCanvas(v.bump);});glazeCache.clear();frameCache.forEach(function(v){releaseCanvas(v.canvas);});frameCache.clear();if(composite)releaseCanvas(composite);composite=null;lastPreview=null;materials=[];textures=[];activeGeometryKey='';compositeKey=signature='';},export:function(d,size,aspect){if(!init())return null;var r=0;for(var i=0;i<=64;i++)r=Math.max(r,d.rAt(i/64));var ratio=aspect||1,w=Math.round(size*Math.min(1,ratio)),h=Math.round(size/Math.max(1,ratio)),sc=Math.min(h/(d.height*1.5),w/(r*2.8));return this.render(Object.assign({},d,{viewWidth:w,viewHeight:h,zoom:1,panX:(d.panX||0)*w/Math.max(1,d.viewWidth||d.width),panY:(d.panY||0)*h/Math.max(1,d.viewHeight||d.canvasHeight),width:w,canvasHeight:h,pixelWidth:w,pixelHeight:h,scale:sc,cx:w/2,base:h/2+d.height*.45*sc,rotation:d.rotation}));}};
/* Break the actual lathed shell; outer glaze UVs and inner wall stay on each shard. */
window.TodakPhoto.createFracture=function(d,seed){
 if(!init()||lost)return null;
 var randomState=seed||1731;function rnd(){randomState=(Math.imul(randomState,1664525)+1013904223)|0;return (randomState>>>0)/4294967296;}
 rebuild(Object.assign({},d,{fracturePreview:true}));signature='';var source=pot.children[0],original=source.geometry.clone(),ownedTextures=[],mats=source.material.map(function(base){var m=base.clone();m.onBeforeCompile=base.onBeforeCompile;m.customProgramCacheKey=base.customProgramCacheKey;Object.keys(m).forEach(function(k){if(k!=='envMap'&&m[k]&&m[k].isTexture){m[k]=m[k].clone();m[k].needsUpdate=true;ownedTextures.push(m[k]);}});return m;});
 mats.push(new T.MeshStandardMaterial({color:0xd6c8b5,roughness:.96,side:T.DoubleSide}));
 var world=new T.Scene();world.environment=environment.texture;world.add(new T.HemisphereLight(0xfff5e7,0x9e9389,.9));var light=new T.DirectionalLight(0xfff5e8,2.4);light.position.set(-15,28,20);world.add(light);var fill=new T.DirectionalLight(0xe3eaff,.45);fill.position.set(18,10,-8);world.add(fill);
 var root=new T.Group();root.rotation.y=-(d.rotation||0);world.add(root);var whole=new T.Mesh(original,mats.slice(0,3));root.add(whole);var broken=new T.Group();root.add(broken);broken.visible=false;
 var g=original,pa=g.attributes.position,na=g.attributes.normal,uv=g.attributes.uv,idx=g.index.array,seeds=[],radius=0;for(var si=0;si<pa.count;si++)radius=Math.max(radius,Math.hypot(pa.getX(si),pa.getZ(si)));
 for(var row=0;row<3;row++)for(var col=0;col<6;col++)seeds.push({a:(col+.5+(rnd()-.5)*.65)/6*Math.PI*2,y:(row+.5+(rnd()-.5)*.6)/3*d.height});
 var buckets=seeds.map(function(){return [[],[],[],[]];}),edges=new Map(),group=0,triangles=0;
 function vertex(i){return {p:[pa.getX(i),pa.getY(i),pa.getZ(i)],n:[na.getX(i),na.getY(i),na.getZ(i)],u:[uv.getX(i),uv.getY(i)]};}
 function key(v){return v.p.map(function(x){return Math.round(x*10000);}).join(',');}
 function owner(a,b,c){var x=(a.p[0]+b.p[0]+c.p[0])/3,y=(a.p[1]+b.p[1]+c.p[1])/3,z=(a.p[2]+b.p[2]+c.p[2])/3,angle=Math.atan2(x,z),best=Infinity,at=0,scale=Math.max(radius*.65,.5);for(var i=0;i<seeds.length;i++){var s=seeds[i],delta=angle-s.a;if(delta>Math.PI)delta-=Math.PI*2;else if(delta<-Math.PI)delta+=Math.PI*2;delta*=scale;var dy=(y-s.y)*1.05,distance=delta*delta+dy*dy;if(distance<best){best=distance;at=i;}}return at;}
 for(var i=0;i<idx.length;i+=3){while(group<g.groups.length-1&&i>=g.groups[group].start+g.groups[group].count)group++;var mat=g.groups[group].materialIndex,a=vertex(idx[i]),b=vertex(idx[i+1]),cc=vertex(idx[i+2]),o=owner(a,b,cc);buckets[o][mat].push(a,b,cc);triangles++;
  if(mat===0)[[a,b],[b,cc],[cc,a]].forEach(function(pair){var ka=key(pair[0]),kb=key(pair[1]),k=ka<kb?ka+'|'+kb:kb+'|'+ka;if(!edges.has(k))edges.set(k,{a:pair[0],b:pair[1],owners:[]});var e=edges.get(k);if(e.owners.indexOf(o)<0)e.owners.push(o);});
 }
 function inner(v){var p=v.p,r=Math.hypot(p[0],p[2]),ir=p[1]>=d.floor?d.innerAt(Math.max(0,Math.min(1,p[1]/d.height))):0;ir=Math.min(ir,Math.max(0,r-.04));return {p:[r?p[0]*ir/r:0,p[1],r?p[2]*ir/r:0],n:[0,0,0],u:[0,0]};}
 function cut(a,b,c){var n=new T.Vector3().subVectors(new T.Vector3().fromArray(b.p),new T.Vector3().fromArray(a.p)).cross(new T.Vector3().subVectors(new T.Vector3().fromArray(c.p),new T.Vector3().fromArray(a.p))).normalize().toArray();return [a,b,c].map(function(v){return {p:v.p,n:n,u:[0,0]};});}
 edges.forEach(function(e){if(e.owners.length<2)return;var a=e.a,b=e.b,ai=inner(a),bi=inner(b);e.owners.forEach(function(o,j){var p=j?[b,a,ai,bi]:[a,b,bi,ai];buckets[o][3].push.apply(buckets[o][3],cut(p[0],p[1],p[2]).concat(cut(p[0],p[2],p[3])));});});
 var parts=[];buckets.forEach(function(groups){var all=[].concat.apply([],groups);if(!all.length)return;var box=new T.Box3();all.forEach(function(v){box.expandByPoint(new T.Vector3().fromArray(v.p));});var center=box.getCenter(new T.Vector3()),p=[],n=[],u=[],geometry=new T.BufferGeometry(),offset=0;groups.forEach(function(vertices,material){if(vertices.length)geometry.addGroup(offset,vertices.length,material);vertices.forEach(function(v){p.push(v.p[0]-center.x,v.p[1]-center.y,v.p[2]-center.z);n.push.apply(n,v.n);u.push.apply(u,v.u);});offset+=vertices.length;});geometry.setAttribute('position',new T.Float32BufferAttribute(p,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(n,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(u,2));geometry.computeBoundingBox();var mesh=new T.Mesh(geometry,mats);mesh.position.copy(center);broken.add(mesh);var a=Math.atan2(center.x,center.z)+(rnd()-.5)*.5;parts.push({mesh:mesh,center:center,velocity:new T.Vector3(Math.sin(a)*radius*(.35+rnd()*.55),d.height*(.03+rnd()*.08),Math.cos(a)*radius*(.35+rnd()*.55)),spin:new T.Vector3((rnd()-.5)*3,(rnd()-.5)*4,(rnd()-.5)*3)});});
 var cam=new T.PerspectiveCamera(35,640/450,.1,Math.max(1000,d.height*30)),span=Math.max(d.height*1.22,radius*3.6),distance=span/(2*Math.tan(17.5*Math.PI/180)),aim=d.height*.42;cam.position.set(0,aim+distance*.32,distance*.948);cam.lookAt(0,aim,0);var bounds=new T.Box3(),disposed=false;
 // Precompute short ballistic flights with floor collision, bounce and friction.
 var steps=126,dt=2.1/steps;parts.forEach(function(p){var pos=p.center.clone(),vel=p.velocity.clone().multiplyScalar(2),rot=new T.Vector3(),spin=p.spin.clone();p.frames=[];for(var step=0;step<=steps;step++){p.mesh.position.copy(pos);p.mesh.rotation.set(rot.x,rot.y,rot.z);p.mesh.updateMatrixWorld(true);bounds.setFromObject(p.mesh);if(bounds.min.y<.02){pos.y+=.02-bounds.min.y;if(vel.y<0)vel.y=-vel.y*.27;vel.x*=.76;vel.z*=.76;spin.multiplyScalar(.72);if(Math.abs(vel.y)<d.height*.045)vel.y=0;}p.frames.push({pos:pos.clone(),rot:rot.clone()});vel.y-=d.height*2.1*dt;pos.addScaledVector(vel,dt);rot.addScaledVector(spin,dt);}});
 function pose(t){whole.visible=t==null;broken.visible=t!=null;if(t==null)return;t=Math.max(0,Math.min(1,t));var at=Math.min(steps,Math.floor(t*steps));parts.forEach(function(p){var state=p.frames[at];p.mesh.position.copy(state.pos);p.mesh.rotation.set(state.rot.x,state.rot.y,state.rot.z);});}

 var renderSize=new T.Vector2();
 function render(width,height,t,cameraOverride){if(disposed)return null;pose(t);var active=cameraOverride||cam;active.aspect=width/height;if(active.isPerspectiveCamera)active.updateProjectionMatrix();var shadows=renderer.shadowMap.enabled;renderer.shadowMap.enabled=false;renderer.setClearColor(0,0);if(renderer.getPixelRatio()!==1)renderer.setPixelRatio(1);renderer.getSize(renderSize);if(renderSize.x!==width||renderSize.y!==height)renderer.setSize(width,height,false);try{renderer.render(world,active);}finally{renderer.shadowMap.enabled=shadows;}return renderer.domElement;}
 function pileImage(){var pc=new T.OrthographicCamera(-radius*2.2,radius*2.2,radius*1.5,-radius*1.5,.1,Math.max(200,d.height*20));pc.position.set(0,radius*4+5,radius*4+5);pc.lookAt(0,.1,0);var out=canvas(180,120),cx=out.getContext('2d');cx.drawImage(render(180,120,1,pc),0,0);pose(null);return out.toDataURL('image/png');}
 return {render:render,pileImage:pileImage,parts:parts,stats:{sourceTriangles:triangles,shards:parts.length},dispose:function(){if(disposed)return;disposed=true;original.dispose();parts.forEach(function(p){p.mesh.geometry.dispose();});mats.forEach(function(m){m.dispose();});ownedTextures.forEach(function(t){t.dispose();});}};
};
})();
