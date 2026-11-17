'use strict';
function replace(s,a,b){if(!s.includes(a))throw Error('Missing free inspection hook: '+a.slice(0,90));return s.replace(a,b);}
exports.html=function(html){
 if(html.includes('function orbitMultiply('))return html;
 html=replace(html,"var orbitCanvas=$('finished360Canvas'),yaw=0,pitch=.32,zoom=1,orbitPointer=null;",`var orbitCanvas=$('finished360Canvas'),yaw=0,pitch=.32,zoom=1,orbitPointer=null;
 // A virtual trackball rotates the viewing frame without changing any saved work.
 var orbitOrientation=[Math.sin(-.16),0,0,Math.cos(.16)],orbitBaseYaw=0,orbitFrame=0,twist=0;
 function orbitMultiply(a,b){var q=[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]],n=Math.hypot.apply(Math,q)||1;return q.map(function(v){return v/n;});}
 function orbitReset(rotation){orbitBaseYaw=rotation;yaw=rotation;pitch=.32;orbitOrientation=[Math.sin(-.16),0,0,Math.cos(.16)];fingers.clear();pinch=twist=0;}
 function orbitPoint(p){var r=orbitCanvas.getBoundingClientRect(),scale=Math.max(1,Math.min(r.width,r.height)*.5),x=(p.x-r.left-r.width*.5)/scale,y=(r.top+r.height*.5-p.y)/scale,l=x*x+y*y;if(l>1){var n=Math.sqrt(l);return [x/n,y/n,0];}return [x,y,Math.sqrt(1-l)];}
 function orbitDrag(previous,next){var a=orbitPoint(previous),b=orbitPoint(next),w=1+a[0]*b[0]+a[1]*b[1]+a[2]*b[2],q;if(w<1e-8){q=Math.abs(a[0])>Math.abs(a[2])?[-a[1],a[0],0,0]:[0,-a[2],a[1],0];}else q=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0],w];var n=Math.hypot.apply(Math,q)||1;q=q.map(function(v){return v/n;});orbitOrientation=orbitMultiply(orbitOrientation,[-q[0],-q[1],-q[2],q[3]]);yaw+=(next.x-previous.x)*.012;pitch+=(next.y-previous.y)*.008;}
 function orbitQueue(){if(orbitFrame)return;orbitFrame=requestAnimationFrame(function(){orbitFrame=0;renderOrbit();});}
 function orbitPair(){var p=Array.from(fingers.values());pinch=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);twist=Math.atan2(p[1].y-p[0].y,p[1].x-p[0].x);}
 orbitCanvas.style.touchAction='none';`);
 html=replace(html,'rotation:yaw,elevation:pitch,zoom:zoom,','rotation:orbitBaseYaw,elevation:.32,inspectionOrientation:orbitOrientation.slice(),zoom:zoom,');
 html=replace(html,'yaw=rot;pitch=.32;zoom=1;renderOrbit();','orbitReset(rot);zoom=1;renderOrbit();');
 html=replace(html,"yaw=0;pitch=.32;zoom=1.22;viewer.querySelector", "orbitReset(0);zoom=1.22;viewer.querySelector");
 const start=html.indexOf(" var fingers=new Map(),pinch=0;orbitCanvas.addEventListener('pointerdown'"),end=html.indexOf('\n window.TodakFinished360=',start);
 if(start<0||end<0)throw Error('Missing inspection input region');
 html=html.slice(0,start)+` var fingers=new Map(),pinch=0;
 orbitCanvas.addEventListener('pointerdown',function(e){e.preventDefault();fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});orbitPointer={id:e.pointerId,x:e.clientX,y:e.clientY};orbitCanvas.setPointerCapture(e.pointerId);if(fingers.size===2)orbitPair();});
 orbitCanvas.addEventListener('pointermove',function(e){if(!fingers.has(e.pointerId))return;e.preventDefault();var previous=fingers.get(e.pointerId),nextPoint={x:e.clientX,y:e.clientY};fingers.set(e.pointerId,nextPoint);if(fingers.size===2){var points=Array.from(fingers.values()),next=Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y),angle=Math.atan2(points[1].y-points[0].y,points[1].x-points[0].x);if(pinch>0&&next>1){zoom=clamp(zoom*next/pinch,.5,2.5);var delta=Math.atan2(Math.sin(angle-twist),Math.cos(angle-twist));orbitOrientation=orbitMultiply(orbitOrientation,[0,0,Math.sin(delta*.5),Math.cos(delta*.5)]);}pinch=next;twist=angle;}else if(fingers.size===1)orbitDrag(previous,nextPoint);orbitQueue();window.dispatchEvent(new Event('todak-inspection-rotated'));});
 ['pointerup','pointercancel','lostpointercapture'].forEach(function(event){orbitCanvas.addEventListener(event,function(e){fingers.delete(e.pointerId);pinch=twist=0;if(fingers.size===2)orbitPair();});});
 orbitCanvas.addEventListener('wheel',function(e){e.preventDefault();zoom=clamp(zoom*Math.exp(-e.deltaY*.001),.5,2.5);orbitQueue();},{passive:false});
`+html.slice(end);
 html=replace(html,"savedOrbitData=null;fingers.clear();dirty=true;});","savedOrbitData=null;fingers.clear();cancelAnimationFrame(orbitFrame);orbitFrame=0;dirty=true;});");
 html=replace(html,'turn:function(delta){yaw+=delta;renderOrbit();','turn:function(delta){yaw+=delta;orbitOrientation=orbitMultiply(orbitOrientation,[0,Math.sin(delta*.5),0,Math.cos(delta*.5)]);orbitQueue();');
 html=replace(html,'return {yaw:yaw,pitch:pitch,zoom:zoom};','return {yaw:yaw,pitch:pitch,zoom:zoom,orientation:orbitOrientation.slice()};');
 html=html.replaceAll('좌우로 돌리고 위아래로 기울여 안쪽과 바닥까지 살펴보세요.','원하는 방향으로 돌리고 뒤집어 안쪽과 바닥까지 살펴보세요.').replaceAll('드래그로 회전 · 휠 또는 두 손가락으로 확대','끌어서 자유 회전 · 두 손가락으로 확대·비틀기').replaceAll('드래그로 회전 · 휠로 확대','끌어서 자유 회전 · 휠로 확대');
 return html;
};
exports.renderer=function(s){
 if(s.includes('d.inspectionOrientation'))return s;
 s=replace(s,"  if(pot.rotation.y!==-d.rotation)",`  if(d.inspection&&Array.isArray(d.inspectionOrientation)&&d.inspectionOrientation.length===4&&d.inspectionOrientation.every(Number.isFinite)){var orientation=new T.Quaternion().fromArray(d.inspectionOrientation).normalize(),center=new T.Vector3(0,d.height*.5,0);camera.position.set(0,0,distance).applyQuaternion(orientation).add(center);camera.up.set(0,1,0).applyQuaternion(orientation);camera.lookAt(center);camera.updateProjectionMatrix();}
  if(pot.rotation.y!==-d.rotation)`);
 s=replace(s,"d.elevation,!!d.inspection,!!d.overhead", "d.elevation,d.inspection&&d.inspectionOrientation?d.inspectionOrientation.join(','):'',!!d.inspection,!!d.overhead");
 return s;
};
