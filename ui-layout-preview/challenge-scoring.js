/* Shared, deterministic scoring. No DOM, random numbers, colour or kiln effects. */
(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TodakChallengeScoring=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 var VERSION=3,WEIGHTS=Object.freeze({outline:40,height:20,depth:15,surface:15,moves:10}),targets=new WeakMap();
 function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
 function linear(a,t){var p=clamp(t,0,1)*(a.length-1),i=Math.min(a.length-2,Math.floor(p));return a[i]+(a[i+1]-a[i])*(p-i);}
 function cubic(a,t){var p=clamp(t,0,1)*(a.length-1),i=Math.min(a.length-1,Math.floor(p)),f=p-i,p0=a[Math.max(0,i-1)],p1=a[i],p2=a[Math.min(i+1,a.length-1)],p3=a[Math.min(i+2,a.length-1)];return Math.max(.025,.5*(2*p1+(-p0+p2)*f+(2*p0-5*p1+4*p2-p3)*f*f+(-p0+3*p1-3*p2+p3)*f*f*f));}
 function geometry(s){
  function rim(t){var softness=s.rimSoftness||0;if(!softness)return 0;var outer=s.radii[s.radii.length-1],inner=s.height-s.floor>.05?Math.min(s.inner[s.inner.length-1],outer-.12):0,r=Math.min(.34*softness,(outer-inner)*.45,s.height*.035),dy=s.height*(1-clamp(t,0,1));return r<=0||dy>=r?0:r-Math.sqrt(Math.max(0,r*r-(r-dy)*(r-dy)));}
  function outer(t){return Math.max(.025,cubic(s.radii,t)-rim(t));}
  function inner(t){return Math.max(0,Math.min(linear(s.inner,t)+rim(t),outer(t)-.02));}
  return{outer:outer,inner:inner};
 }
 function inset(radii,height,t,thickness){
  var y=t*height,step=height/(radii.length-1),limit=cubic(radii,t)-thickness;
  for(var i=0;i<radii.length-1;i++){var ya=i*step,yb=ya+step,lo=Math.max(ya,y-thickness),hi=Math.min(yb,y+thickness);if(lo>hi)continue;var slope=(radii[i+1]-radii[i])/step,at=clamp(y-slope*thickness/Math.sqrt(1+slope*slope),lo,hi),candidate=radii[i]+slope*(at-ya)-Math.sqrt(Math.max(0,thickness*thickness-(at-y)*(at-y)));limit=Math.min(limit,candidate);}return Math.max(0,limit);
 }
 function reference(T,n){
  var old=targets.get(T);if(old&&old.n===n)return old;
  var radii=Array.from({length:n},function(_,i){return T.f(i/(n-1));}),profile=T.scoreProfile,inner=profile&&Array.isArray(profile.inner)?Array.from({length:n},function(_,i){return linear(profile.inner,i/(n-1));}):radii.map(function(_,i){return inset(radii,T.h,i/(n-1),.6);});
  var ref={n:n,radii:radii,inner:inner,surfaceInners:{},geometry:geometry({radii:radii,inner:inner,height:T.h,floor:profile?profile.floor:.5,rimSoftness:profile?profile.rimSoftness||0:0})};targets.set(T,ref);return ref;
 }
 function noise(values,expected,start){var sum=0,count=0,last=null;for(var i=Math.max(1,start);i<values.length-1;i++){var residual=values[i]-(values[i-1]+values[i+1])/2-(expected[i]-(expected[i-1]+expected[i+1])/2);if(last!==null&&last*residual<0)sum+=Math.sqrt(-last*residual);last=residual;count++;}return count?sum/count:0;}
 function wallDistance(s,r,y){var result=Infinity,step=s.height/(s.radii.length-1);for(var i=0;i<s.radii.length-1;i++){var ax=s.radii[i],ay=i*step,dx=s.radii[i+1]-ax,dy=step,u=clamp(((r-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy),0,1);result=Math.min(result,Math.hypot(r-ax-u*dx,y-ay-u*dy));}return result;}
 function movePoints(limit,used){var free=Math.min(2,Math.max(0,limit-1)),remaining=Math.max(0,limit-used);return Math.round(10*clamp(remaining/Math.max(1,limit-free),0,1));}
 function invalid(){return{version:VERSION,valid:false,outline:0,height:0,depth:0,surface:0,moves:0,roughPenalty:0,solid:true,total:0,quality:0,used:0,limit:0,remaining:0};}
 function evaluate(s,T){
  if(!s||!T||typeof T.f!=='function'||!Number.isFinite(T.h)||T.h<=0||!Number.isInteger(T.n)||T.n<1||!Number.isFinite(s.height)||s.height<=0||!Number.isFinite(s.floor)||s.floor<0||s.floor>s.height||!Array.isArray(s.radii)||s.radii.length<4||s.radii.length>256||!Array.isArray(s.inner)||s.inner.length!==s.radii.length||!s.radii.every(function(v){return Number.isFinite(v)&&v>0;})||!s.inner.every(function(v){return Number.isFinite(v)&&v>=0;}))return invalid();
  var used=s.touches==null?0:s.touches;if(!Number.isInteger(used)||used<0)return invalid();
  var ref=reference(T,s.radii.length);if(!ref.radii.every(function(v){return Number.isFinite(v)&&v>0;})||!ref.inner.every(function(v){return Number.isFinite(v)&&v>=0;}))return invalid();
  var g=geometry(s),mean=0,squared=0,maximum=0,scale=0;
  for(var j=0;j<=100;j++){var t=j/100,r=ref.geometry.outer(t),delta=Math.max(0,Math.abs(g.outer(t)-r)-Math.max(.03,r*.01));mean+=delta;squared+=delta*delta;maximum=Math.max(maximum,delta);scale+=r;}
  mean/=101;scale/=101;var rms=Math.sqrt(squared/101),outline=Math.round(40*clamp(1-(2.5*mean+1.25*rms+.5*maximum)/scale,0,1)),height=Math.round(20*clamp(1-4*Math.max(0,Math.abs(s.height-T.h)-Math.max(.05,T.h*.005))/T.h,0,1));
  var needs={plate:.45,goblet:.35,highstem:.28,lamp:.2},need=T.depthNeed!=null?clamp(T.depthNeed,0,1):(needs[s.target]||.7),requiresHollow=need>.005,accessible=0,openVolume=0,referenceVolume=0,wall=0,count=0,wallSamples=[],cavityVolume=0,outerVolume=0,step=1/96,nominalDepth=clamp((s.height-s.floor)/s.height,0,1),blocked=false;
  for(var k=0;k<=96;k++){
   var level=1-k*step,ri=level*s.height>=s.floor?g.inner(level):0,ro=g.outer(level),expected=ref.geometry.inner(level),threshold=Math.max(.05,Math.min(.2,ref.geometry.inner(1)*.05));
   cavityVolume+=ri*ri;outerVolume+=ro*ro;
   if(!blocked&&ri>threshold&&level*s.height>s.floor)accessible=Math.min(nominalDepth,(k+1)*step);else blocked=true;
   if(k*step<=need){referenceVolume+=expected*expected;openVolume+=blocked?0:Math.min(ri*ri,expected*expected);var thickness=wallDistance(s,ri,level*s.height);wall+=clamp(thickness/.4,0,1);if(ri>threshold)wallSamples.push(thickness);count++;}
  }
  var openness=referenceVolume>1e-8?clamp(openVolume/referenceVolume,0,1):0,depthFactor=need>0?clamp(accessible/need,0,1):1,integrity=Math.min(count?wall/count:1,clamp(s.floor/.4,0,1)),solid=requiresHollow&&(accessible<=.05/s.height||openness<.04),inside=requiresHollow?Math.round(15*Math.min(depthFactor,clamp(openness/.75,0,1),integrity)):Math.round(15*clamp(1-cavityVolume/Math.max(1e-8,outerVolume),0,1));
  // Thickness changes the natural inner curvature, especially on shallow plates.
  // Compare finish against the same wall thickness rather than penalising it as noise.
  var surfaceInner=ref.inner;if(!T.scoreProfile&&wallSamples.length){wallSamples.sort(function(a,b){return a-b;});var normalThickness=Math.round(clamp(wallSamples[Math.floor(wallSamples.length/2)],.1,3)*20)/20;if(!ref.surfaceInners[normalThickness])ref.surfaceInners[normalThickness]=ref.radii.map(function(_,i){return inset(ref.radii,T.h,i/(ref.n-1),normalThickness);});surfaceInner=ref.surfaceInners[normalThickness];}
  var innerStart=Math.ceil(s.floor/s.height*(s.inner.length-1))+1,roughSignal=Math.max(noise(s.radii,ref.radii,1),requiresHollow&&!solid?noise(s.inner,surfaceInner,innerStart):0),roughPenalty=Math.round(clamp((roughSignal-.003)*240,0,15)),surface=15-roughPenalty,moves=movePoints(T.n,used),quality=outline+height+inside+surface,total=Math.min(solid?59:100,quality+moves);
  return Object.freeze({version:VERSION,valid:true,outline:outline,height:height,depth:inside,surface:surface,moves:moves,quality:quality,total:total,solid:solid,roughPenalty:roughPenalty,used:used,limit:T.n,remaining:Math.max(0,T.n-used),metrics:Object.freeze({meanError:mean,rmsError:rms,maxError:maximum,depthRatio:accessible,openness:openness,integrity:integrity})});
 }
 return Object.freeze({version:VERSION,weights:WEIGHTS,evaluate:evaluate,movePoints:movePoints,geometry:geometry});
});
