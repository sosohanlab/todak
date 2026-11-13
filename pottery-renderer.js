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
function tex(c,color){var t=new T.CanvasTexture(c);if(color)t.colorSpace=T.SRGBColorSpace;t.anisotropy=low?2:8;textures.push(t);return t;}
function makeEnvironment(){
  var w=512,h=256,data=new Float32Array(w*h*4);
  for(var y=0;y<h;y++)for(var x=0;x<w;x++){
    var sky=.35+.48*Math.sin(Math.PI*y/h),a=(x/w-.32)/.13,b=(y/h-.37)/.24;
    var soft=3.2*Math.exp(-a*a*2-b*b*2);
    var rim=.7*Math.exp(-Math.pow((x/w-.79)/.035,8)-Math.pow((y/h-.42)/.21,8));
    var i=(y*w+x)*4;data[i]=sky*.98+soft+rim;data[i+1]=sky*.95+soft*.97+rim;data[i+2]=sky*.89+soft*.9+rim*.96;data[i+3]=1;
  }
  var raw=new T.DataTexture(data,w,h,T.RGBAFormat,T.FloatType);raw.mapping=T.EquirectangularReflectionMapping;raw.needsUpdate=true;
  var pm=new T.PMREMGenerator(renderer);environment=pm.fromEquirectangular(raw);scene.environment=environment.texture;
  // Camera faces +Z: visible frontal reflections are at longitude U=.75.
  // Preserve the original environment for matte clay and the shaded interior.
  var glossy=new Float32Array(data);
  for(var gy=0;gy<h;gy++)for(var gx=0;gx<w;gx++){
    var u=gx/w,v=gy/h,panel=7.5*Math.exp(-Math.pow((u-.705)/.032,8)-Math.pow((v-.585)/.19,8)),fillPanel=2.1*Math.exp(-Math.pow((u-.855)/.018,8)-Math.pow((v-.56)/.17,8)),at=(gy*w+gx)*4;
    for(var channel=0;channel<3;channel++)glossy[at+channel]=data[at+channel]*.65+panel*.65+fillPanel*.7;
  }
  var reflection=new T.DataTexture(glossy,w,h,T.RGBAFormat,T.FloatType);reflection.mapping=T.EquirectangularReflectionMapping;reflection.needsUpdate=true;glossEnvironment=pm.fromEquirectangular(reflection);raw.dispose();reflection.dispose();pm.dispose();
}
function init(){
  if(renderer)return !lost;
  try{
    renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:low?'low-power':'high-performance'});
    renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.VSMShadowMap;
    renderer.domElement.addEventListener('webglcontextlost',function(e){e.preventDefault();lost=true;});
    renderer.domElement.addEventListener('webglcontextrestored',function(){lost=false;signature='';});
    scene=new T.Scene();camera=new T.PerspectiveCamera(32,1,.1,500);pot=new T.Group();scene.add(pot);
    scene.add(new T.HemisphereLight(0xfff5df,0x918274,.65));
    var key=keyLight=new T.DirectionalLight(0xfff2de,2.1);key.position.set(-10,32,12);key.castShadow=true;key.shadow.blurSamples=12;
    key.shadow.mapSize.set(low?1024:2048,low?1024:2048);Object.assign(key.shadow.camera,{left:-30,right:30,top:35,bottom:-30,near:1,far:100});key.shadow.normalBias=.025;key.shadow.bias=-.00015;key.shadow.radius=5;scene.add(key);
    var fill=new T.DirectionalLight(0xe4edff,.35);fill.position.set(18,12,-9);scene.add(fill);
    floor=new T.Mesh(new T.PlaneGeometry(2000,2000),new T.MeshStandardMaterial({color:0xe4d9ca,roughness:.92}));floor.rotation.x=-Math.PI/2;floor.position.y=-.025;floor.receiveShadow=false;scene.add(floor);
    var receiver=new T.Mesh(new T.PlaneGeometry(2000,2000),new T.ShadowMaterial({opacity:.10}));receiver.rotation.x=-Math.PI/2;receiver.position.y=-.018;receiver.receiveShadow=true;scene.add(receiver);
    var c=canvas(128,128),g=c.getContext('2d'),grad=g.createRadialGradient(64,64,0,64,64,64);grad.addColorStop(0,'rgba(30,24,17,.42)');grad.addColorStop(.45,'rgba(30,24,17,.14)');grad.addColorStop(1,'rgba(30,24,17,0)');g.fillStyle=grad;g.fillRect(0,0,128,128);
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
function rebuild(d){
  disposePot();var size=low?512:1024,c=canvas(size,size),g=c.getContext('2d'),base=d.color;
  g.fillStyle='rgb('+base.join(',')+')';g.fillRect(0,0,size,size);
  var pix=g.getImageData(0,0,size,size);
  for(var y=0;y<size;y++)for(var x=0;x<size;x++){
    var angle=x/size*Math.PI*2,i=(y*size+x)*4,n=noise(x,y),cloud=Math.sin(angle*3+Math.sin(y*.023)*2)*Math.sin(y*.017+Math.sin(angle*2)*1.3),depth=d.glazeId==='cobalt'?12:(d.glazeId==='cheongja'||d.glazeId==='mint'?5:1.8),v=(n-.5)*3+Math.sin(y*.031+Math.sin(angle*3))*.8+cloud*depth;
    var edgeFade=Math.min(1,y/10,(size-1-y)/10);v*=Math.max(0,edgeFade);if(n>.998)v-=15*Math.max(0,edgeFade);
    for(var k=0;k<3;k++)pix.data[i+k]=Math.max(0,Math.min(255,base[k]+v));
  }g.putImageData(pix,0,0);
  var surface=d.surface==='crackle'&&window.TodakCeramicSurface?TodakCeramicSurface.create(low?512:1024,d.surface):null;
  if(surface){g.save();g.globalCompositeOperation='multiply';g.drawImage(surface.color,0,0,size,size);g.restore();}
  if(d.overlay)g.drawImage(d.overlay,0,0,size,size);
  // The underside receives the selected base glaze and the same finish as the outside.
  var bump=canvas(512,512),bg=bump.getContext('2d'),im=bg.createImageData(512,512);
  for(var j=0;j<512*512;j++){var xx=j%512,yy=j/512|0,edge=Math.max(0,Math.min(1,yy/12,(511-yy)/12)),vv=128+((noise(xx,yy)-.5)*12+Math.sin(yy*.65)*1.5)*edge;im.data[j*4]=im.data[j*4+1]=im.data[j*4+2]=vv;im.data[j*4+3]=255;}bg.putImageData(im,0,0);
  // Micro texture stays separate from the true carved geometry.
  if(surface){bg.globalAlpha=1;bg.drawImage(surface.height,0,0,512,512);}
  var map=tex(c,true),micro=tex(bump,false),gloss=d.finish==='gloss';
  var outer=new T.MeshPhysicalMaterial({map:map,metalness:0,roughness:gloss?.2:.78,clearcoat:gloss?1:.04,clearcoatRoughness:gloss?.065:.6,ior:1.46,bumpMap:micro,bumpScale:gloss?.003:.012,envMap:gloss?glossEnvironment.texture:null,envMapIntensity:gloss?1.15:.45});
  if(surface){outer.bumpScale=.025;outer.roughnessMap=tex(surface.roughness,false);outer.roughness=gloss?.48:.95;}
  var inside=outer.clone(),innerCanvas=canvas(64,256),ix=innerCanvas.getContext('2d');
  // Occlusion increases below the opening, including the inside floor.
  for(var iy=0;iy<256;iy++){
    var level=1-iy/255,depth=Math.max(0,Math.min(1,(1-level)*d.height/Math.max(.05,d.height-d.floor))),shade=.94-.2*Math.pow(depth,.8),innerColor=d.dipDepth&&iy<256*d.dipDepth?d.dipColor:d.inside;
    ix.fillStyle='rgb('+innerColor.map(function(channel){return Math.round(channel*shade);}).join(',')+')';ix.fillRect(0,iy,64,1);
  }
  if(surface){
    var shaded=innerCanvas,innerSurface=canvas(512,512),isx=innerSurface.getContext('2d');isx.drawImage(shaded,0,0,512,512);isx.globalCompositeOperation='multiply';isx.drawImage(surface.color,0,0,512,512);isx.globalCompositeOperation='source-over';innerCanvas=innerSurface;ix=isx;
  }
  if(d.topOverlay){
    innerCanvas=canvas(768,768);ix=innerCanvas.getContext('2d');
    ix.fillStyle='rgb('+d.inside.join(',')+')';ix.fillRect(0,0,768,768);
    if(surface){ix.globalCompositeOperation='multiply';ix.drawImage(surface.color,0,0,768,768);ix.globalCompositeOperation='source-over';}
    ix.drawImage(d.topOverlay,0,0,768,768);
  }
  if(d.topOverlay){
    inside.onBeforeCompile=function(shader){
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying float todakInnerLevel;').replace('#include <begin_vertex>','#include <begin_vertex>\ntodakInnerLevel = position.y / '+Number(d.height).toFixed(5)+';');
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float todakInnerLevel;').replace('#include <opaque_fragment>','outgoingLight *= .87 - .43 * pow(clamp((1.0 - todakInnerLevel) * '+Number(d.height/Math.max(.05,d.height-d.floor)).toFixed(5)+', 0.0, 1.0), .7);\n#include <opaque_fragment>');
    };
  }
  inside.map=tex(innerCanvas,true);inside.envMap=gloss?glossEnvironment.texture:null;inside.clearcoatRoughness=gloss?.09:.6;inside.roughness=gloss?.23:.86;inside.envMapIntensity=gloss?.65:.24;inside.clearcoat=gloss?.85:.04;

  var underside=outer.clone();underside.map=null;underside.color.setRGB(d.color[0]/255,d.color[1]/255,d.color[2]/255,T.SRGBColorSpace);materials.push(outer,inside,underside);
  var carving=!!d.carve,n=carving?(low?224:320):128,H=d.height,ro=d.rAt(1),ri=d.innerAt(1),hollow=H-d.floor>.05;
  // Tiny rounded edges avoid a grazing, razor-sharp material seam at rim and foot.
  var footBevel=Math.min(.045,H*.004,d.rAt(0)*.02),rimBevel=hollow?Math.max(.001,Math.min(.045+(d.rimSoftness||0)*.16,(ro-ri)*.45,H*.018)):.02;
  var points=[new T.Vector2(0,0),new T.Vector2(Math.max(0,d.rAt(0)-footBevel),0)],outerStart=1;
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
  var geo=new T.LatheGeometry(points,carving?(low?320:512):(low?160:256)),uv=geo.attributes.uv,pos=geo.attributes.position;
  for(var z=0;z<uv.count;z++){
    uv.setY(z,Math.max(0,Math.min(1,pos.getY(z)/H)));
    if(d.topOverlay&&z%points.length>outerEnd){var topR=d.topRadius||d.rAt(1);uv.setXY(z,.5+pos.getX(z)/(2*topR),.5+pos.getZ(z)/(2*topR));}
  }
  geo.clearGroups();var segs=carving?(low?320:512):(low?160:256),rows=points.length-1,indices=[[],[],[]],old=geo.index.array;
  for(var s=0;s<segs;s++)for(var row=0;row<rows;row++){
    var material=row<outerStart?2:(row<outerEnd?0:1),offset=(s*rows+row)*6;
    for(var q=0;q<6;q++)indices[material].push(old[offset+q]);
  }
  var reordered=[],start=0;
  indices.forEach(function(group,index){geo.addGroup(start,group.length,index);start+=group.length;for(var j=0;j<group.length;j++)reordered.push(group[j]);});geo.setIndex(reordered);
  // Incisions change the actual outer shell, including its silhouette and normals.
  var incisionStats={vertices:0,maxDepth:0,raisedVertices:0,maxRaise:0};
  if(carving){
    var mask=canvas(1024,1024),mx=mask.getContext('2d');mx.filter='blur(1.2px)';mx.drawImage(d.carve,0,0,1024,1024);
    var alpha=mx.getImageData(0,0,1024,1024).data,normal=geo.attributes.normal;
    function cutAt(u,v){var x=((u%1+1)%1)*1024,y=Math.max(0,Math.min(1023,(1-v)*1023)),xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;
      function a(xx,yy){var i=(yy*1024+(xx%1024))*4;return alpha[i+3]/255*(d.carveMode==='raised'?-1:(alpha[i]>127?-1:1));}
      return (a(xi,yi)*(1-xf)+a(xi+1,yi)*xf)*(1-yf)+(a(xi,Math.min(1023,yi+1))*(1-xf)+a(xi+1,Math.min(1023,yi+1))*xf)*yf;
    }
    for(var vi=0;vi<pos.count;vi++){
      var profileRow=vi%points.length;if(profileRow<outerStart||profileRow>outerEnd)continue;
      var py=pos.getY(vi),level=Math.max(0,Math.min(1,py/H)),r=Math.hypot(pos.getX(vi),pos.getZ(vi)),wall=py>d.floor?Math.max(.025,r-d.innerAt(level)):Math.max(.025,r),amount=cutAt(uv.getX(vi),uv.getY(vi));
      var edge=Math.min(1,py/.12,(H-py)/.12),depth=amount*(amount<0?(d.carveDepth||.12):Math.min(d.carveDepth||.12,wall*.32))*Math.max(0,edge);
      if(Math.abs(depth)>.00001){pos.setXYZ(vi,pos.getX(vi)-normal.getX(vi)*depth,py-normal.getY(vi)*depth,pos.getZ(vi)-normal.getZ(vi)*depth);incisionStats.vertices++;incisionStats.maxDepth=Math.max(incisionStats.maxDepth,depth);if(depth<0){incisionStats.raisedVertices++;incisionStats.maxRaise=Math.max(incisionStats.maxRaise,-depth);}}
    }
    pos.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingSphere();
  }
  var mesh=new T.Mesh(geo,materials);mesh.castShadow=true;mesh.receiveShadow=false;mesh.userData.incision=incisionStats;pot.add(mesh);
  var contact=scene.getObjectByName('contact'),r=d.rAt(0);contact.scale.set(r*2.8,r*2.8,1);
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
  pot.rotation.set(0,-d.rotation,0);
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
  if(photoBG){scene.background=null;renderer.setClearColor(0,0);floor.visible=false;cyclorama.visible=false;room.visible=false;}
  renderer.setSize(width,height,false);var activeCamera=camera;if(d.overhead){var rr=d.topRadius||0;for(var ri=0;ri<=64;ri++)rr=Math.max(rr,d.rAt(ri/64));activeCamera=new T.OrthographicCamera(-rr,rr,rr,-rr,.01,1000);activeCamera.up.set(0,0,-1);activeCamera.position.set(0,d.height+100,0);activeCamera.lookAt(0,0,0);}renderer.render(scene,activeCamera);
}
window.TodakPhoto={available:true,render:function(d){if(!init()||lost)return null;try{if(signature!==d.key){rebuild(d);signature=d.key;}configure(d,d.pixelWidth,d.pixelHeight);if(!d.transparent&&window.TodakBackgrounds&&TodakBackgrounds.ready(d.background)){var out=canvas(renderer.domElement.width,renderer.domElement.height),cx=out.getContext('2d');if(window.TodakRealPhoto&&TodakRealPhoto.drawBackground)TodakRealPhoto.drawBackground(cx,out.width,out.height,d.background,d.backgroundZoom,d.backgroundPanX,d.backgroundPanY);else TodakBackgrounds.draw(cx,out.width,out.height,d.background);cx.drawImage(renderer.domElement,0,0);return out;}return renderer.domElement;}catch(e){console.warn('토닥 렌더링 오류',e);return null;}},export:function(d,size,aspect){if(!init())return null;var r=0;for(var i=0;i<=64;i++)r=Math.max(r,d.rAt(i/64));var ratio=aspect||1,w=Math.round(size*Math.min(1,ratio)),h=Math.round(size/Math.max(1,ratio)),sc=Math.min(h/(d.height*1.5),w/(r*2.8));return this.render(Object.assign({},d,{viewWidth:w,viewHeight:h,zoom:1,panX:0,panY:0,width:w,canvasHeight:h,pixelWidth:w,pixelHeight:h,scale:sc,cx:w/2,base:h/2+d.height*.45*sc,rotation:d.rotation}));}};
/* Break the actual lathed shell; outer glaze UVs and inner wall stay on each shard. */
window.TodakPhoto.createFracture=function(d,seed){
 if(!init()||lost)return null;
 var randomState=seed||1731;function rnd(){randomState=(Math.imul(randomState,1664525)+1013904223)|0;return (randomState>>>0)/4294967296;}
 rebuild(d);signature='';var source=pot.children[0],original=source.geometry.clone(),ownedTextures=[],mats=source.material.map(function(base){var m=base.clone();m.onBeforeCompile=base.onBeforeCompile;m.customProgramCacheKey=base.customProgramCacheKey;Object.keys(m).forEach(function(k){if(k!=='envMap'&&m[k]&&m[k].isTexture){m[k]=m[k].clone();m[k].needsUpdate=true;ownedTextures.push(m[k]);}});return m;});
 mats.push(new T.MeshStandardMaterial({color:0xd6c8b5,roughness:.96,side:T.DoubleSide}));
 var world=new T.Scene();world.environment=environment.texture;world.add(new T.HemisphereLight(0xfff5e7,0x9e9389,.9));var light=new T.DirectionalLight(0xfff5e8,2.4);light.position.set(-15,28,20);world.add(light);var fill=new T.DirectionalLight(0xe3eaff,.45);fill.position.set(18,10,-8);world.add(fill);
 var root=new T.Group();root.rotation.y=-(d.rotation||0);world.add(root);var whole=new T.Mesh(original,mats.slice(0,3));root.add(whole);var broken=new T.Group();root.add(broken);broken.visible=false;
 var g=original,pa=g.attributes.position,na=g.attributes.normal,uv=g.attributes.uv,idx=g.index.array,seeds=[],radius=0;for(var si=0;si<pa.count;si++)radius=Math.max(radius,Math.hypot(pa.getX(si),pa.getZ(si)));
 for(var row=0;row<3;row++)for(var col=0;col<6;col++)seeds.push({a:(col+.5+(rnd()-.5)*.65)/6*Math.PI*2,y:(row+.5+(rnd()-.5)*.6)/3*d.height});
 var buckets=seeds.map(function(){return [[],[],[],[]];}),edges=new Map(),group=0,triangles=0;
 function vertex(i){return {p:[pa.getX(i),pa.getY(i),pa.getZ(i)],n:[na.getX(i),na.getY(i),na.getZ(i)],u:[uv.getX(i),uv.getY(i)]};}
 function key(v){return v.p.map(function(x){return Math.round(x*10000);}).join(',');}
 function owner(a,b,c){var x=(a.p[0]+b.p[0]+c.p[0])/3,y=(a.p[1]+b.p[1]+c.p[1])/3,z=(a.p[2]+b.p[2]+c.p[2])/3,angle=Math.atan2(x,z),best=Infinity,at=0;seeds.forEach(function(s,i){var delta=Math.atan2(Math.sin(angle-s.a),Math.cos(angle-s.a))*Math.max(radius*.65,.5),distance=delta*delta+Math.pow((y-s.y)*1.05,2);if(distance<best){best=distance;at=i;}});return at;}
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

 function render(width,height,t,cameraOverride){if(disposed)return null;pose(t);var active=cameraOverride||cam;active.aspect=width/height;if(active.isPerspectiveCamera)active.updateProjectionMatrix();var shadows=renderer.shadowMap.enabled;renderer.shadowMap.enabled=false;renderer.setClearColor(0,0);renderer.setSize(width,height,false);try{renderer.render(world,active);}finally{renderer.shadowMap.enabled=shadows;}return renderer.domElement;}
 function pileImage(){var pc=new T.OrthographicCamera(-radius*2.2,radius*2.2,radius*1.5,-radius*1.5,.1,Math.max(200,d.height*20));pc.position.set(0,radius*4+5,radius*4+5);pc.lookAt(0,.1,0);var out=canvas(180,120),cx=out.getContext('2d');cx.drawImage(render(180,120,1,pc),0,0);pose(null);return out.toDataURL('image/png');}
 return {render:render,pileImage:pileImage,parts:parts,stats:{sourceTriangles:triangles,shards:parts.length},dispose:function(){if(disposed)return;disposed=true;original.dispose();parts.forEach(function(p){p.mesh.geometry.dispose();});mats.forEach(function(m){m.dispose();});ownedTextures.forEach(function(t){t.dispose();});}};
};
})();
