/* Screen-only tool footprints: use the same physical sizes as the painting tools. */
(function(){
 'use strict';
 var ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),path=document.createElementNS(ns,'path'),stamp=document.createElementNS(ns,'path'),point=null,held=null,timer=0,preview=false;
 svg.id='toolSizePreview';svg.setAttribute('aria-hidden','true');svg.style.cssText='position:absolute;inset:0;width:100%;height:100%;overflow:hidden;pointer-events:none;z-index:17;display:none';
 [path,stamp].forEach(function(p){p.setAttribute('stroke','#2449b9');p.setAttribute('fill','#3155b61a');p.setAttribute('stroke-width','1.6');p.setAttribute('vector-effect','non-scaling-stroke');svg.appendChild(p);});path.setAttribute('stroke-dasharray','5 4');stageEl.appendChild(svg);
 function kind(){return st.stage==='deco'&&dTool!=='move'?dTool:st.stage==='glaze'&&$('glazeBrush').checked?'glaze':st.stage==='throw'?tool:null;}
 function radius(k){return k==='glaze'?Number($('glazeBrushSize').value):['shape','thick','sponge'].includes(k)?TOOLS[k].f*(k==='thick'?2.2:1):k==='trim'?Number($('trimWidth').value)/20:curSize();}
 function clear(){svg.style.display='none';held=null;point=null;preview=false;clearTimeout(timer);}
 function ellipse(cx,cy,rx,ry){return 'M'+(cx-rx)+' '+cy+'a'+rx+' '+ry+' 0 1 0 '+(2*rx)+' 0a'+rx+' '+ry+' 0 1 0 '+(-2*rx)+' 0';}
 function render(){
  var k=kind();if(!k||!$('home').hidden||!$('cardDlg').hidden||(!preview&&(!point||st.stage==='throw'&&k!=='sponge'))||window.TodakBottomTrim?.active()){svg.style.display='none';return;}
  var b=cv.getBoundingClientRect(),host=stageEl.getBoundingClientRect(),s=b.width/W,sy=b.height/HC,size=radius(k),l=st.stage!=='throw'&&(TodakWheel.bottom()?TodakWheel.bottomLayout():TodakWheel.top()?TodakWheel.layout():null),px,py,rx,ry,hit;
  if(l){var q=point||{x:l.x+l.r*.2,y:l.y+l.r*.15},physical=l.cm/(l.fraction||1);if(Math.hypot(q.x-l.x,q.y-l.y)>l.r*(l.fraction||1)){svg.style.display='none';return;}px=q.x;py=q.y;rx=ry=size*l.r/physical;}
  else{var t=.58,x=CX+rAt(t)*SV*.2,y=BASE-st.height*t*SV+TILT*Math.sqrt(Math.max(0,Math.pow(rAt(t)*SV,2)-Math.pow(x-CX,2))),q=point||{x:x,y:y};hit=st.stage==='throw'?null:hitSurface(q.x,q.y);if(st.stage!=='throw'&&!hit){svg.style.display='none';return;}px=q.x;py=q.y;var v=hit?hit.v:clamp((BASE-py)/(st.height*SV),0,1),r=rAt(v)*SV;rx=size*SV*(st.stage==='throw'?1:Math.sqrt(Math.max(.025,1-Math.pow((px-CX)/Math.max(1,r),2))));ry=size*SV;
   if(dRing&&st.stage==='deco'&&k!=='stamp'){px=CX;py=BASE-v*st.height*SV;rx=r;ry=Math.max(size*SV,TILT*r);}
  }
  var cx=b.left-host.left+px*s,cy=b.top-host.top+py*sy;rx=Math.max(.7,rx*s);ry=Math.max(.7,ry*sy);svg.dataset.tool=k;svg.dataset.radiusCm=size;svg.dataset.radiusX=rx;svg.dataset.radiusY=ry;svg.style.display='block';path.setAttribute('d',ellipse(cx,cy,rx,ry));
  stamp.setAttribute('d',k==='stamp'?(STAMP_PATHS[dStamp]||STAMP_PATHS.flower):'');stamp.setAttribute('transform','translate('+cx+' '+cy+') scale('+(rx/20)+' '+(ry/20)+')');
 }
 function locate(e){var b=cv.getBoundingClientRect();point={x:(e.clientX-b.left)*W/b.width,y:(e.clientY-b.top)*HC/b.height};}
 cv.addEventListener('pointerdown',function(e){held=e.pointerId;preview=false;clearTimeout(timer);locate(e);render();});
 cv.addEventListener('pointermove',function(e){if(e.pointerType==='touch'&&held!==e.pointerId)return;preview=false;clearTimeout(timer);locate(e);render();});
 ['pointerup','pointercancel'].forEach(function(type){document.addEventListener(type,clear,true);});cv.addEventListener('pointerleave',clear);window.addEventListener('blur',clear);
 document.addEventListener('input',function(e){if(!['dsize','glazeBrushSize','hsize','trimWidth'].includes(e.target.id))return;point=null;preview=true;render();clearTimeout(timer);timer=setTimeout(clear,2200);});
 document.addEventListener('click',function(e){if(e.target.closest('#tools,#dtools,#ui-touch-deco,#ui-touch-glaze,#sheetViewBar,#homeBtn'))clear();});
 var baseDraw=draw;draw=function(){var result=baseDraw.apply(this,arguments);if(svg.style.display!=='none')render();return result;};
 var stage=setStage;setStage=function(){clear();return stage.apply(this,arguments);};var home=showHome;showHome=function(){clear();return home.apply(this,arguments);};var fresh=freshClay;freshClay=function(){clear();return fresh.apply(this,arguments);};
 window.TodakToolSizePreview={clear:clear,state:function(){return{visible:svg.style.display!=='none',tool:svg.dataset.tool,radiusCm:Number(svg.dataset.radiusCm),rx:Number(svg.dataset.radiusX),ry:Number(svg.dataset.radiusY)};}};
})();
