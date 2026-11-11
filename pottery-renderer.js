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
var woodTexture,room,keyLight;
var low=matchMedia('(pointer:coarse)').matches;
function canvas(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function noise(x,y){var n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);}
function tex(c,color){var t=new T.CanvasTexture(c);if(color)t.colorSpace=T.SRGBColorSpace;t.anisotropy=low?2:8;textures.push(t);return t;}
function makeEnvironment(){
  var w=512,h=256,data=new Float32Array(w*h*4);
  for(var y=0;y<h;y++)for(var x=0;x<w;x++){
    var sky=.35+.48*Math.sin(Math.PI*y/h),a=(x/w-.32)/.065,b=(y/h-.37)/.18;
    var soft=5.5*Math.exp(-Math.pow(a,8)-Math.pow(b,8));
    var rim=2*Math.exp(-Math.pow((x/w-.79)/.035,8)-Math.pow((y/h-.42)/.21,8));
    var i=(y*w+x)*4;data[i]=sky*.98+soft+rim;data[i+1]=sky*.95+soft*.97+rim;data[i+2]=sky*.89+soft*.9+rim*.96;data[i+3]=1;
  }
  var raw=new T.DataTexture(data,w,h,T.RGBAFormat,T.FloatType);raw.mapping=T.EquirectangularReflectionMapping;raw.needsUpdate=true;
  var pm=new T.PMREMGenerator(renderer);environment=pm.fromEquirectangular(raw);scene.environment=environment.texture;raw.dispose();pm.dispose();
}
function init(){
  if(renderer)return !lost;
  try{
    renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:low?'low-power':'high-performance'});
    renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
    renderer.domElement.addEventListener('webglcontextlost',function(e){e.preventDefault();lost=true;});
    renderer.domElement.addEventListener('webglcontextrestored',function(){lost=false;signature='';});
    scene=new T.Scene();camera=new T.OrthographicCamera();pot=new T.Group();scene.add(pot);
    scene.add(new T.HemisphereLight(0xfff5df,0x918274,1.5));
    var key=keyLight=new T.DirectionalLight(0xfff2de,2.1);key.position.set(-10,32,12);key.castShadow=true;
    key.shadow.mapSize.set(low?1024:2048,low?1024:2048);Object.assign(key.shadow.camera,{left:-30,right:30,top:35,bottom:-30,near:1,far:100});key.shadow.normalBias=.025;key.shadow.bias=-.00015;key.shadow.radius=8;scene.add(key);
    var fill=new T.DirectionalLight(0xe4edff,.8);fill.position.set(18,12,-9);scene.add(fill);
    floor=new T.Mesh(new T.PlaneGeometry(2000,2000),new T.MeshStandardMaterial({color:0xe4d9ca,roughness:.92}));floor.rotation.x=-Math.PI/2;floor.position.y=-.025;floor.receiveShadow=false;scene.add(floor);
    var receiver=new T.Mesh(new T.PlaneGeometry(2000,2000),new T.ShadowMaterial({opacity:.10}));receiver.rotation.x=-Math.PI/2;receiver.position.y=-.018;receiver.receiveShadow=true;scene.add(receiver);
    var c=canvas(128,128),g=c.getContext('2d'),grad=g.createRadialGradient(64,64,0,64,64,64);grad.addColorStop(0,'rgba(30,24,17,.42)');grad.addColorStop(.45,'rgba(30,24,17,.14)');grad.addColorStop(1,'rgba(30,24,17,0)');g.fillStyle=grad;g.fillRect(0,0,128,128);
    var contact=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false,opacity:.8}));contact.name='contact';contact.rotation.x=-Math.PI/2;contact.position.y=.002;scene.add(contact);
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
    makeEnvironment();return true;
  }catch(e){console.warn('토닥: 3D를 사용할 수 없어 기본 보기로 표시합니다.',e);window.TodakPhoto.available=false;return false;}
}
function disposePot(){while(pot.children.length){var m=pot.children[0];m.geometry.dispose();pot.remove(m);}materials.forEach(function(m){m.dispose();});textures.forEach(function(t){t.dispose();});materials=[];textures=[];}
function rebuild(d){
  disposePot();var size=low?512:1024,c=canvas(size,size),g=c.getContext('2d'),base=d.color;
  g.fillStyle='rgb('+base.join(',')+')';g.fillRect(0,0,size,size);
  var pix=g.getImageData(0,0,size,size);
  for(var y=0;y<size;y++)for(var x=0;x<size;x++){
    var angle=x/size*Math.PI*2,i=(y*size+x)*4,n=noise(x,y),cloud=Math.sin(angle*3+Math.sin(y*.023)*2)*Math.sin(y*.017+Math.sin(angle*2)*1.3),depth=d.glazeId==='cobalt'?12:(d.glazeId==='cheongja'||d.glazeId==='mint'?5:1.8),v=(n-.5)*3+Math.sin(y*.63)*.65+Math.sin(y*.044+Math.sin(angle)*2)*1.2+cloud*depth;
    if(n>.998)v-=15;
    for(var k=0;k<3;k++)pix.data[i+k]=Math.max(0,Math.min(255,base[k]+v));
  }g.putImageData(pix,0,0);
  if(d.overlay)g.drawImage(d.overlay,0,0,size,size);
  // Bare clay only at the foot; preserve painted/carved decorations everywhere else.
  g.fillStyle='#bba081';g.fillRect(0,size-6,size,6);
  var bump=canvas(512,512),bg=bump.getContext('2d'),im=bg.createImageData(512,512);
  for(var j=0;j<512*512;j++){var xx=j%512,yy=j/512|0,vv=128+(noise(xx,yy)-.5)*30+Math.sin(yy*.65)*1.5;im.data[j*4]=im.data[j*4+1]=im.data[j*4+2]=vv;im.data[j*4+3]=255;}bg.putImageData(im,0,0);
  if(d.carve){bg.globalAlpha=.38;bg.drawImage(d.carve,0,0,512,512);}
  var map=tex(c,true),micro=tex(bump,false),gloss=d.finish==='gloss';
  var outer=new T.MeshPhysicalMaterial({map:map,metalness:0,roughness:gloss?.36:.76,clearcoat:gloss?.48:.08,clearcoatRoughness:gloss?.32:.5,ior:1.46,bumpMap:micro,bumpScale:gloss?.014:.025,envMapIntensity:gloss?.8:.45});
  var inside=outer.clone(),innerCanvas=canvas(64,256),ix=innerCanvas.getContext('2d');ix.fillStyle='rgb('+d.inside.join(',')+')';ix.fillRect(0,0,64,256);if(d.dipDepth&&d.dipColor){ix.fillStyle='rgb('+d.dipColor.join(',')+')';ix.fillRect(0,0,64,256*d.dipDepth);}inside.map=tex(innerCanvas,true);inside.roughness+=.08;
  var clay=new T.MeshStandardMaterial({color:0xbda185,roughness:.95,bumpMap:micro,bumpScale:.02});materials.push(outer,inside,clay);
  var points=[new T.Vector2(0,0)],n=128,H=d.height,outerStart=1;
  for(var a=0;a<=n;a++)points.push(new T.Vector2(d.rAt(a/n),H*a/n));
  var outerEnd=points.length-1,ro=d.rAt(1),ri=d.innerAt(1),hollow=H-d.floor>.05;
  if(hollow){
    points.push(new T.Vector2(ro-.015,H+.018));points.push(new T.Vector2(ri+.015,H+.018));
    for(var b=n;b>=0;b--){var yy=d.floor+(H-d.floor)*b/n;points.push(new T.Vector2(d.innerAt(yy/H),yy));}
    points.push(new T.Vector2(0,d.floor));
  }else points.push(new T.Vector2(0,H));
  var geo=new T.LatheGeometry(points,low?128:192),uv=geo.attributes.uv,pos=geo.attributes.position;
  for(var z=0;z<uv.count;z++)uv.setY(z,Math.max(0,Math.min(1,pos.getY(z)/H)));
  geo.clearGroups();var segs=low?128:192,rows=points.length-1,indices=[[],[],[]],old=geo.index.array;
  for(var s=0;s<segs;s++)for(var row=0;row<rows;row++){
    var material=row<outerStart?2:(row<outerEnd?0:1),offset=(s*rows+row)*6;
    for(var q=0;q<6;q++)indices[material].push(old[offset+q]);
  }
  var reordered=[],start=0;
  indices.forEach(function(group,index){geo.addGroup(start,group.length,index);start+=group.length;for(var j=0;j<group.length;j++)reordered.push(group[j]);});geo.setIndex(reordered);
  var mesh=new T.Mesh(geo,materials);mesh.castShadow=true;mesh.receiveShadow=true;pot.add(mesh);
  var contact=scene.getObjectByName('contact'),r=d.rAt(0);contact.scale.set(r*2.8,r*2.8,1);
}
function configure(d,width,height){
  var scale=d.scale,W=d.width,HC=d.canvasHeight; if(d.framed!==false){var radius=0;for(var f=0;f<=32;f++)radius=Math.max(radius,d.rAt(f/32));var VW=d.viewWidth||W,VH=d.viewHeight||HC;scale=Math.min(VH/(d.height*1.85),VW/(radius*3.8))*(d.zoom||1);d=Object.assign({},d,{scale:scale,cx:VW*.5+(d.panX||0),base:VH*.52+d.height*scale*.43+(d.panY||0)});} var cos=Math.sqrt(1-.32*.32),aim=(d.base-HC/2)/(scale*cos),x=(W/2-d.cx)/scale;
  camera.left=-W/scale/2;camera.right=W/scale/2;camera.top=HC/scale/2;camera.bottom=-HC/scale/2;camera.near=.1;camera.far=500;
  camera.position.set(x,aim+60*.32,60*cos);camera.lookAt(x,aim,0);camera.updateProjectionMatrix();
  pot.rotation.y=-d.rotation;
  var backdrop=window.TodakBackdrop(d.color,d.background);scene.background=new T.Color().setRGB(backdrop.rgb[0]/255,backdrop.rgb[1]/255,backdrop.rgb[2]/255,T.SRGBColorSpace);floor.material.color.copy(scene.background);
  var map=d.background==='warm'?woodTexture:null;if(floor.material.map!==map){floor.material.map=map;floor.material.needsUpdate=true;}if(map)floor.material.color.setRGB(backdrop.woodTint,backdrop.woodTint,backdrop.woodTint);
  room.visible=!d.transparent;
  // Keep background architecture proportional to the actual vessel, including tiny pieces.
  var roomScale=Math.max(.45,Math.min(1.6,d.height/12));room.scale.set(roomScale,roomScale,roomScale);room.children.forEach(function(o){o.visible=o.name==='wall'||d.background==='warm'&&o.name==='window'||d.background==='dark'&&(o.name==='niche'||o.name==='ledge');});
  room.getObjectByName('wall').material.color.set(d.background==='dark'?0x778071:(d.background==='warm'?0xd6cbbb:0xbab0a2));
  keyLight.shadow.radius=8;
  floor.visible=!d.transparent;
  scene.getObjectByName('contact').visible=!d.transparent;
  scene.children.forEach(function(o){if(o.material&&o.material.type==='ShadowMaterial')o.visible=!d.transparent;});
  if(d.transparent){scene.background=null;renderer.setClearColor(0x000000,0);}
  renderer.setSize(width,height,false);renderer.render(scene,camera);
}
window.TodakPhoto={available:true,render:function(d){if(!init()||lost)return null;try{if(signature!==d.key){rebuild(d);signature=d.key;}configure(d,d.pixelWidth,d.pixelHeight);return renderer.domElement;}catch(e){console.warn('토닥 렌더링 오류',e);return null;}},export:function(d,size,aspect){if(!init())return null;var r=0;for(var i=0;i<=64;i++)r=Math.max(r,d.rAt(i/64));var ratio=aspect||1,w=Math.round(size*Math.min(1,ratio)),h=Math.round(size/Math.max(1,ratio)),sc=Math.min(h/(d.height*1.5),w/(r*2.8));return this.render(Object.assign({},d,{viewWidth:w,viewHeight:h,zoom:1,panX:0,panY:0,width:w,canvasHeight:h,pixelWidth:w,pixelHeight:h,scale:sc,cx:w/2,base:h/2+d.height*.45*sc,rotation:d.rotation}));}};
})();
