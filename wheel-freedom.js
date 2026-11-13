/* Free wheel throwing: axisymmetric profiles and a separate, planar inner surface. */
(function(){
 var top=false,glazeBrush=false,glazeMode=null,active=null,last=null,history=[],topLayer=mk(768,768),strokeBase=mk(768,768),strokeInk=mk(768,768),loaded=null,topVersion=0,changed=false;
 var forms={},topBrushPaths=[],pendingTop=null,topSurfaceKey="",topSurfaceRows=null,topBaseKey="",topBase=null,topClip=null,insideClip=null;
 // Free throwing always starts with one lump; existing saved profiles remain valid.
 Array.from($('presets').querySelectorAll('button')).forEach(function(b){if(b.dataset.p!=='lump')b.remove();});
 $('f-presets').hidden=true;
 function resetProfile(){}
 function block(id,parent,html){var e=document.createElement('div');e.id=id;e.className='wheelFreedom';e.innerHTML=html;$(parent).appendChild(e);return e;}
 ['deco','glaze'].forEach(function(stage){block('wheelView-'+stage,'p-'+stage,'<div class="chips"><button type="button" class="chip" id="wheelSide-'+stage+'" aria-pressed="true">側面</button><button type="button" class="chip" id="wheelTop-'+stage+'" aria-pressed="false">위에서 꾸미기</button><button type="button" class="ghost" id="topUndo-'+stage+'">되돌리기</button></div><p class="wheelViewHint">옆면·윗면·밑바닥을 바꿔 가며 꾸며요. 밑바닥에서도 붓·도장·조각칼·지우개를 쓸 수 있어요.</p>');$('wheelSide-'+stage).textContent='옆면 보기';$('p-'+stage).insertBefore($('wheelView-'+stage),$('p-'+stage).firstChild);$('wheelTop-'+stage).onclick=function(){if(st.height-st.floor<.05){toast('속·두께 조절로 안쪽을 먼저 파 주세요.');return;}bottom=false;top=true;refresh();dirty=true;};$('wheelSide-'+stage).onclick=function(){bottom=false;top=false;refresh();dirty=true;};});
 block('freeGlaze','p-glaze','<label><input type="checkbox" id="glazeBrush"> 붓으로 유약 바르기</label><p>선택한 붓 색으로 자유롭게 칠해요. 옆면과 접시 안쪽을 각각 꾸밀 수 있어요.</p><label>붓 유약 색<select id="glazeBrushColor"></select></label><label>유약 불투명도 <output id="glazeOpacityValue">100%</output><input id="glazeOpacity" type="range" min="0" max="100" step="1" value="100"></label><label>붓 굵기<input type="range" id="glazeBrushSize" min="0.1" max="2" step="0.05" value="0.45"></label><div class="chips"><button class="chip" type="button" id="glazeFree">자유롭게</button><button class="chip" type="button" id="glazeChecks">체크무늬 칸 채우기</button><button class="ghost" type="button" id="wheelUndo">되돌리기</button></div><p id="glazePaintHint">체크무늬는 원하는 칸을 누르거나 쓸어서 채워요. 다른 색을 골라 이어서 칠해 보세요.</p>');
 $('p-glaze').insertBefore($('freeGlaze'),$('wheelView-glaze').nextSibling);
 GLAZES.filter(function(g){return g.id!=='custom';}).forEach(function(g){var o=document.createElement('option');o.value=g.id;o.textContent=g.n||g.name||g.id;$('glazeBrushColor').appendChild(o);});
 $('glazeBrushColor').value='cobalt';var checks=false;
 $('glazeOpacity').oninput=function(){$('glazeOpacityValue').textContent=this.value+'%';};
 $('glazeBrush').onchange=function(){glazeBrush=this.checked;glazeMode=glazeBrush?'brush':null;if(!glazeBrush)top=false;refresh();};
 $('glazeFree').onclick=function(){checks=false;refresh();};$('glazeChecks').onclick=function(){checks=true;glazeBrush=true;$('glazeBrush').checked=true;refresh();};
 function refresh(){['deco','glaze'].forEach(function(s){if(!$('wheelTop-'+s))return;$('wheelTop-'+s).setAttribute('aria-pressed',String(top));$('wheelSide-'+s).setAttribute('aria-pressed',String(!top&&!bottom));});if($('glazeChecks')){$('glazeChecks').setAttribute('aria-pressed',String(checks));$('glazeFree').setAttribute('aria-pressed',String(!checks));}if($('sheetViewBar')){$('sheetViewBar').hidden=st.stage!=='deco'&&st.stage!=='glaze';['deco','glaze'].forEach(function(s){$('wheelView-'+s).hidden=st.stage!==s;});}['deco','glaze'].forEach(function(s){if($('wheelBottom-'+s))$('wheelBottom-'+s).setAttribute('aria-pressed',String(bottom));});resetProfile();}
 function loadTop(){if(loaded===st.topPaint)return;loaded=st.topPaint||null;topLayer.x.clearRect(0,0,768,768);if(loaded){var expected=loaded;loadTex(loaded,topLayer,function(){if(st.topPaint===expected){topVersion++;dirty=true;}});}}
 function commitTop(){st.topPaint=topLayer.c.toDataURL();loaded=st.topPaint;topVersion++;texVer++;dirty=cardDirty=true;}
 var oldClear=clearDeco;clearDeco=function(){oldClear();st.topPaint=null;loaded=null;topLayer.x.clearRect(0,0,768,768);history=[];topVersion++;bottom=false;bottomHistory=[];st.bottomPaint=st.bottomCarve=null;loadBottom();};
 var oldStage=setStage;setStage=function(s){active=null;pendingTop=null;bottom=false;bottomActive=null;bottomPending=null;if($('wheelBottom-done')){$('wheelBottom-done').textContent='밑바닥 보기';$('wheelBottom-done').setAttribute('aria-pressed','false');}top=false;glazeBrush=false;glazeMode=null;if($('glazeBrush'))$('glazeBrush').checked=false;oldStage(s);loadTop();refresh();};
 var oldFields=itemFields;itemFields=function(it){it=oldFields(it);if(st.topPaint){it.topPaint=st.topPaint;if(it.communityVisual)it.communityVisual.topPaint=st.topPaint;}['bottomPaint','bottomCarve'].forEach(function(key){it[key]=st[key]||null;if(it.communityVisual)it.communityVisual[key]=it[key];});return it;};
 var oldData=photoData;photoData=function(){loadTop();var d=oldData();if(st.topPaint){d.topOverlay=topLayer.c;d.topOpacity=pigmentOpacity();d.topRadius=Math.max.apply(null,st.radii);d.key+='|top:'+topVersion;}loadBottom();d.bottomOverlay=st.bottomPaint?bottomPaint.c:null;d.bottomCarve=st.bottomCarve?bottomCarve.c:null;d.bottomOpacity=pigmentOpacity();d.key+='|bottom:'+bottomVersion;return d;};
 function topLayout(){var unit=W/Math.max(1,stageEl.clientWidth),wide=stageEl.clientWidth>=760,right=wide?Math.min(W*.45,530*unit):0;var available=Math.max(W*.35,W-right),r=Math.min(available*.42,HC*.32),cy=HC*.55;if(!wide){var toolbar=stageEl.querySelector('.stageToolbar'),box=cv.getBoundingClientRect(),nav=toolbar&&toolbar.getBoundingClientRect(),safe=nav&&nav.height?Math.max(80*unit,(nav.bottom-box.top+38)*unit):80*unit;r=Math.min(available*.42,Math.max(60*unit,HC-safe-18*unit)*.46);cy=safe+r;}return {x:available/2,y:cy,r:r,cm:Math.max.apply(null,st.radii),opening:innerAt(1)};}
 // Orthographic overhead visibility from the actual outer and inner profiles.
 function topSurface(l){var key=[st.height,st.floor,st.radii.join(','),st.inner.join(',')].join('|');if(key===topSurfaceKey&&topSurfaceRows)return topSurfaceRows;var count=240,rows=new Array(count),dr=l.cm/count;
  function put(radius,y,inside){var k=Math.max(0,Math.min(count-1,Math.floor(radius/dr)));if(!rows[k]||y>=rows[k].y)rows[k]={y:y,inside:inside};}
  function segment(r0,y0,r1,y1,inside){var steps=Math.max(2,Math.ceil(Math.abs(r1-r0)/dr*2));for(var j=0;j<=steps;j++){var t=j/steps;put(r0+(r1-r0)*t,y0+(y1-y0)*t,inside);}}
  for(var i=1;i<=240;i++){var t0=(i-1)/240,t1=i/240,y0=t0*st.height,y1=t1*st.height;segment(rAt(t0),y0,rAt(t1),y1,false);if(y1>=st.floor){var iy=Math.max(y0,st.floor);segment(innerAt(iy/st.height),iy,innerAt(t1),y1,true);}}
  segment(0,st.floor,innerAt(st.floor/st.height),st.floor,true);
  segment(innerAt(1),st.height,rAt(1),st.height,false);
  for(var k=0;k<count;k++){var radius=(k+.5)*dr;if(radius>=innerAt(1)&&radius<rAt(1)&&rows[k]&&rows[k].y>=st.height-.0001)rows[k].planar=true;}
  topSurfaceKey=key;topSurfaceRows=rows;return rows;
 }
 function inTop(p){var l=topLayout(),dx=(p.x-l.x)/l.r,dy=(p.y-l.y)/l.r,r=Math.hypot(dx,dy),rows=topSurface(l),hit=rows[Math.min(rows.length-1,Math.floor(r*rows.length))];if(r>1||!hit)return null;return {x:(dx+1)*384,y:(dy+1)*384};}
 function topArtwork(l,rows){
  // Exclude wet top paint from the material key: only rebuild the vessel when its appearance changes.
  var key=[topSurfaceKey,rot.toFixed(5),st.stage,st.glaze,st.glaze2,st.dip,st.dipDepth,st.fx,st.finish,st.customC,st.rimSoftness,texVer,!!(window.TodakPhoto&&TodakPhoto.available)].join('|');
  if(key===topBaseKey&&topBase)return;
  topBaseKey=key;topBase=topBase||mk(768,768);var c=topBase.x;c.clearRect(0,0,768,768);
  insideClip=new Path2D();topClip=new Path2D();topClip.arc(384,384,384,0,TWO);
  // Merge adjacent inside rings, preventing hundreds of anti-aliased seams and expensive clip contours.
  for(var i=0;i<rows.length;){if(!rows[i]||!(rows[i].inside||rows[i].planar)){i++;continue;}var start=i;while(i<rows.length&&rows[i]&&(rows[i].inside||rows[i].planar))i++;var outer=i/rows.length*384,inner=start/rows.length*384;insideClip.moveTo(384+outer,384);insideClip.arc(384,384,outer,0,TWO);if(inner){insideClip.moveTo(384+inner,384);insideClip.arc(384,384,inner,0,TWO,true);}}
  var material=false;
  if(st.stage==='glaze'){
   if(!window.TodakPhoto&&window.TodakLoad3D&&!window.todakTopLoading){window.todakTopLoading=true;TodakLoad3D().then(function(){topBaseKey='';dirty=true;}).catch(function(){});}
   if(window.TodakPhoto&&TodakPhoto.available){var d=oldData(),look=currentLook();d=Object.assign({},d,{color:look.c,inside:look.c,dipColor:stageColor(byId(GLAZES,st.glaze2).c),key:d.key+'|clean-overhead|'+st.stage,topOverlay:null,overhead:true,transparent:true,width:768,canvasHeight:768,viewWidth:768,viewHeight:768,pixelWidth:768,pixelHeight:768,rotation:rot});var rendered=TodakPhoto.render(d);if(rendered){c.drawImage(rendered,0,0,768,768);material=true;}}
  }
  if(!material){var im=c.createImageData(768,768),look=currentLook();compose();var fd=finalData;
   for(var y=0;y<768;y++)for(var x=0;x<768;x++){
    var dx=(x-383.5)/384,dy=(y-383.5)/384,radius=Math.hypot(dx,dy);if(radius>1)continue;
    var row=rows[Math.min(rows.length-1,Math.floor(radius*rows.length))];if(!row)continue;
    var depth=(st.height-row.y)/Math.max(.1,st.height-st.floor),shade=(row.inside?.86-.30*depth:.92)*(1-.055*dx-.065*dy),base=row.inside?look.ci:look.c,at=(y*768+x)*4;
    var u=(Math.atan2(dx,dy)+rot)/TWO;u-=Math.floor(u);var tx=Math.min(TW-1,Math.floor(u*TW)),ty=Math.min(TH-1,Math.floor((1-row.y/st.height)*TH)),src=(ty*TW+tx)*4,alpha=!row.inside&&!row.planar&&fd?fd[src+3]/255:0;
    for(var channel=0;channel<3;channel++)im.data[at+channel]=(base[channel]*(1-alpha)+(fd?fd[src+channel]:0)*alpha)*shade;
    im.data[at+3]=Math.min(255,(1-radius)*768*255);
   }
   c.putImageData(im,0,0);
  }

 }
 var oldDraw=draw;draw=function(){if(bottom&&['deco','glaze','done'].indexOf(st.stage)>=0){drawBottom();return;}if(!top||['deco','glaze'].indexOf(st.stage)<0){oldDraw();return;}if(pendingTop){var pending=pendingTop;pendingTop=null;paintTop(pending,false);}loadTop();var l=topLayout(),rows=topSurface(l);topArtwork(l,rows);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,HC);drawScene();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.drawImage(topBase.c,l.x-l.r,l.y-l.r,l.r*2,l.r*2);
 ctx.save();ctx.translate(l.x-l.r,l.y-l.r);ctx.scale(l.r/384,l.r/384);ctx.clip(topClip,'evenodd');ctx.globalAlpha=pigmentOpacity();ctx.drawImage(topLayer.c,0,0);ctx.restore();
 ctx.fillStyle='#29334e';ctx.font='15px sans-serif';ctx.textAlign='center';ctx.fillText('내 도자기 · 위에서 꾸미기',l.x,Math.max(55,l.y-l.r-24));};
 function commitOuterTop(){
  var l=topLayout(),rows=topSurface(l),ink=strokeInk.x.getImageData(0,0,768,768).data,out=null,erase=st.stage==='deco'&&dTool==='erase',opacity=st.stage==='glaze'?Number($('glazeOpacity').value)/100:dOpacity,any=false;
  var outerInk=false;for(var at=3;at<ink.length;at+=4){if(!ink[at])continue;var pixel=(at-3)/4,rx=pixel%768-383.5,ry=Math.floor(pixel/768)-383.5,visible=rows[Math.floor(Math.hypot(rx,ry)/384*rows.length)];if(visible&&!visible.inside&&!visible.planar){outerInk=true;break;}}
  if(outerInk){out=paint.x.getImageData(0,0,TW,TH);
  var sin=new Float32Array(TW),cos=new Float32Array(TW);for(var x=0;x<TW;x++){var angle=(x+.5)/TW*TWO-rot;sin[x]=Math.sin(angle);cos[x]=Math.cos(angle);}
  for(var y=0;y<TH;y++){
   var level=1-(y+.5)/TH,radius=rAt(level),row=rows[Math.min(rows.length-1,Math.floor(radius/l.cm*rows.length))];
   if(!row||row.inside||row.planar||Math.abs(row.y-level*st.height)>Math.max(st.height/TH*2,st.height/240*1.6))continue;
   var scale=radius/l.cm*384;
   for(var x=0;x<TW;x++){
    var px=Math.max(0,Math.min(767,Math.round(383.5+sin[x]*scale))),py=Math.max(0,Math.min(767,Math.round(383.5+cos[x]*scale))),src=(py*768+px)*4,a=ink[src+3]/255*opacity;if(!a)continue;
    var dst=(y*TW+x)*4,previous=out.data[dst+3]/255;any=true;
    if(erase){out.data[dst+3]=Math.round(previous*(1-a)*255);continue;}
    var combined=a+previous*(1-a);for(var c=0;c<3;c++)out.data[dst+c]=(ink[src+c]*a+out.data[dst+c]*previous*(1-a))/combined;out.data[dst+3]=Math.round(combined*255);
   }
  }
  }
  if(any){paint.x.putImageData(out,0,0);hasPaint=true;if(!erase)markUsed();}
  // Only inside marks remain in the planar layer; outer marks now belong to the shared shell.
  var retained=mk(768,768);retained.x.save();var clip=new Path2D();for(var i=0;i<rows.length;){if(!rows[i]||!(rows[i].inside||rows[i].planar)){i++;continue;}var start=i;while(i<rows.length&&rows[i]&&(rows[i].inside||rows[i].planar))i++;var outer=i/rows.length*384,inner=start/rows.length*384;clip.moveTo(384+outer,384);clip.arc(384,384,outer,0,TWO);if(inner){clip.moveTo(384+inner,384);clip.arc(384,384,inner,0,TWO,true);}}retained.x.clip(clip,'evenodd');retained.x.drawImage(topLayer.c,0,0);retained.x.restore();topLayer.x.clearRect(0,0,768,768);topLayer.x.drawImage(retained.c,0,0);
 }
 function remember(){history.push({url:st.topPaint||null,top:topLayer.x.getImageData(0,0,768,768),p:paint.x.getImageData(0,0,TW,TH),hp:hasPaint});if(history.length>6)history.shift();}
 function undoBrush(){if(bottom){bottomUndo();return;}var h=history.pop();if(!h)return;topLayer.x.putImageData(h.top,0,0);paint.x.putImageData(h.p,0,0);hasPaint=h.hp;st.topPaint=h.url;loaded=h.url;topVersion++;texVer++;dirty=cardDirty=true;}
 $('wheelUndo').onclick=undoBrush;$('topUndo-deco').onclick=undoBrush;$('topUndo-glaze').onclick=undoBrush;
 function brushColor(){return st.stage==='glaze'?byId(GLAZES,$('glazeBrushColor').value).c:pigColor();}
 var visited={};
 function paintTop(p,first){var h=inTop(p);if(!h){last=null;return;}var erase=st.stage==='deco'&&dTool==='erase',c=erase?topLayer.x:strokeInk.x,l=topLayout(),size=(st.stage==='glaze'?Number($('glazeBrushSize').value):curSize())/l.cm*384,erase=st.stage==='deco'&&dTool==='erase';c.save();c.globalCompositeOperation=erase?'destination-out':'source-over';c.fillStyle=c.strokeStyle=css(brushColor());c.lineCap=c.lineJoin='round';c.lineWidth=size*2;
 if(st.stage==='glaze'&&checks){var cell=76.8,col=Math.floor(h.x/cell),row=Math.floor(h.y/cell),key=col+','+row;if(!visited[key]){c.fillRect(col*cell,row*cell,cell+.5,cell+.5);visited[key]=true;}}
 else if(st.stage==='deco'&&dTool==='stamp'){if(first){c.translate(h.x,h.y);c.scale(size/20,size/20);c.lineWidth=2.6;c.stroke(new Path2D(STAMP_PATHS[dStamp]||STAMP_PATHS.flower));}}
 else if(st.stage==='deco'&&dRing){var radius=Math.hypot(h.x-384,h.y-384);c.beginPath();c.arc(384,384,radius,0,TWO);c.stroke();}
 else if(!erase){if(first)topBrushPaths=[];if(!last||!topBrushPaths.length)topBrushPaths.push([]);var path=topBrushPaths[topBrushPaths.length-1];var point=brushPoint(h.x,h.y,size,size,ptr.brushPressure),tail=path[path.length-1];if(tail&&Math.hypot(tail.x-h.x,tail.y-h.y)<1)path[path.length-1]=point;else path.push(point);if(path.length>512){path=path.filter(function(_,i){return i%2===0||i===path.length-1;});topBrushPaths[topBrushPaths.length-1]=path;}c.clearRect(0,0,768,768);topBrushPaths.forEach(function(points){brushStroke(c,points);});}
 else {c.beginPath();c.moveTo(last?last.x:h.x,last?last.y:h.y);c.lineTo(h.x,h.y);c.stroke();c.beginPath();c.arc(h.x,h.y,size,0,TWO);c.fill();var ec=strokeInk.x;ec.strokeStyle=ec.fillStyle='#fff';ec.lineWidth=size*2;ec.lineCap='round';ec.beginPath();ec.moveTo(last?last.x:h.x,last?last.y:h.y);ec.lineTo(h.x,h.y);ec.stroke();ec.beginPath();ec.arc(h.x,h.y,size,0,TWO);ec.fill();}
 c.restore();if(!erase){topLayer.x.clearRect(0,0,768,768);topLayer.x.drawImage(strokeBase.c,0,0);topLayer.x.save();topLayer.x.globalAlpha=st.stage==='glaze'?Number($('glazeOpacity').value)/100:dOpacity;topLayer.x.drawImage(strokeInk.c,0,0);topLayer.x.restore();}changed=true;last=h;topVersion++;dirty=true;}
 function paintSide(p,first){var hit=hitSurface(p.x,p.y);if(!hit){ptr.last=null;return;}if(Number($('glazeOpacity').value)>0)changed=true;var saved={t:dTool,p:dPig,c:dColor,s:dSizeV.brush,o:dOpacity,r:dRing};dTool='brush';dPig='custom';dColor=brushColor();dOpacity=Number($('glazeOpacity').value)/100;dRing=false;dSizeV.brush=Math.log(Number($('glazeBrushSize').value)/RANGE.brush[0])/Math.log(RANGE.brush[1]/RANGE.brush[0]);if(checks){var col=Math.floor(hit.u*16),row=Math.floor((1-hit.v)*12),key=col+','+row;if(!visited[key]){paint.x.save();paint.x.globalAlpha=dOpacity;paint.x.fillStyle=css(dColor);paint.x.fillRect(col*TW/16,row*TH/12,TW/16+.5,TH/12+.5);paint.x.restore();visited[key]=true;hasPaint=true;texVer++;dirty=true;}}else applyDeco(hit,first||!ptr.last);dTool=saved.t;dPig=saved.p;dColor=saved.c;dSizeV.brush=saved.s;dOpacity=saved.o;dRing=saved.r;}
  // Underside decoration has its own paint and signed relief, independent of the inner floor.
 var bottom=false,bottomPaint=mk(768,768),bottomCarve=mk(768,768),bottomInk=mk(768,768),bottomStart=mk(768,768),bottomCutStart=mk(768,768),bottomHistory=[],bottomVersion=0,bottomReliefVersion=0,bottomKey='',bottomBase=null,bottomActive=null,bottomPending=null,bottomLast=null,bottomPaths=[],bottomChanged=false,bottomLoaded={};
 function bottomLayout(){var l=topLayout();l.cm=Math.max(.1,rAt(0));return l;}
 function loadBottom(){['bottomPaint','bottomCarve'].forEach(function(key){var url=st[key]||null,target=key==='bottomPaint'?bottomPaint:bottomCarve;if(bottomLoaded[key]===url)return;bottomLoaded[key]=url;target.x.clearRect(0,0,768,768);if(url){var im=new Image();im.onload=function(){if(st[key]!==url)return;target.x.clearRect(0,0,768,768);target.x.drawImage(im,0,0,768,768);bottomVersion++;bottomReliefVersion++;dirty=true;};im.src=url;}bottomVersion++;bottomReliefVersion++;});}
 function bottomCommit(){function saved(layer){var a=layer.x.getImageData(0,0,768,768).data;for(var i=3;i<a.length;i+=4)if(a[i])return layer.c.toDataURL();return null;}st.bottomPaint=saved(bottomPaint);st.bottomCarve=saved(bottomCarve);bottomLoaded.bottomPaint=st.bottomPaint;bottomLoaded.bottomCarve=st.bottomCarve;bottomVersion++;texVer++;dirty=cardDirty=true;}
 function bottomRemember(){bottomHistory.push({paint:bottomPaint.x.getImageData(0,0,768,768),carve:bottomCarve.x.getImageData(0,0,768,768),p:st.bottomPaint||null,c:st.bottomCarve||null});if(bottomHistory.length>6)bottomHistory.shift();}
 function bottomUndo(){var h=bottomHistory.pop();if(!h)return;bottomPaint.x.putImageData(h.paint,0,0);bottomCarve.x.putImageData(h.carve,0,0);st.bottomPaint=h.p;st.bottomCarve=h.c;bottomLoaded.bottomPaint=h.p;bottomLoaded.bottomCarve=h.c;bottomReliefVersion++;bottomVersion++;texVer++;dirty=cardDirty=true;}
 function bottomHit(p){var l=bottomLayout(),x=(p.x-l.x)/l.r*384+384,y=(p.y-l.y)/l.r*384+384;return Math.hypot(x-384,y-384)<=384?{x:x,y:y}:null;}
 function bottomStroke(p,first){var h=bottomHit(p);if(!h){bottomLast=null;return;}var dt=st.stage==='glaze'?'brush':dTool;if(dt==='move')return;var size=dt==='brush'&&st.stage==='glaze'?Number($('glazeBrushSize').value):curSize(),radius=size/bottomLayout().cm*384,c=bottomInk.x;
  c.save();c.fillStyle=c.strokeStyle=dt==='carve'?(dCarveMode==='raised'?'#fff':'#000'):dt==='erase'?'#fff':css(brushColor());c.lineCap=c.lineJoin='round';c.lineWidth=radius*2;
  if(dt==='stamp'){if(first){c.translate(h.x,h.y);c.scale(radius/20,radius/20);c.lineWidth=2.6;c.stroke(new Path2D(STAMP_PATHS[dStamp]||STAMP_PATHS.flower));}}
  else if(st.stage==='deco'&&dRing&&dt!=='erase'){c.clearRect(0,0,768,768);c.beginPath();c.arc(384,384,Math.hypot(h.x-384,h.y-384),0,TWO);c.stroke();}
  else if(dt==='brush'){if(!bottomLast||!bottomPaths.length)bottomPaths.push([]);var points=bottomPaths[bottomPaths.length-1];points.push(brushPoint(h.x,h.y,radius,radius,ptr.brushPressure));if(points.length>512)bottomPaths[bottomPaths.length-1]=points.filter(function(_,i){return i%2===0||i===points.length-1;});c.clearRect(0,0,768,768);bottomPaths.forEach(function(path){brushStroke(c,path);});}
  else {c.beginPath();c.moveTo(bottomLast?bottomLast.x:h.x,bottomLast?bottomLast.y:h.y);c.lineTo(h.x,h.y);c.stroke();c.beginPath();c.arc(h.x,h.y,radius,0,TWO);c.fill();}
  c.restore();var target=dt==='carve'?bottomCarve:bottomPaint,base=dt==='carve'?bottomCutStart:bottomStart;target.x.clearRect(0,0,768,768);target.x.drawImage(base.c,0,0);target.x.save();target.x.globalCompositeOperation=dt==='erase'?'destination-out':'source-over';target.x.globalAlpha=dt==='carve'||dt==='erase'?1:st.stage==='glaze'?Number($('glazeOpacity').value)/100:dOpacity;target.x.drawImage(bottomInk.c,0,0);target.x.restore();
  if(dt==='erase'){bottomCarve.x.clearRect(0,0,768,768);bottomCarve.x.drawImage(bottomCutStart.c,0,0);bottomCarve.x.save();bottomCarve.x.globalCompositeOperation='destination-out';bottomCarve.x.drawImage(bottomInk.c,0,0);bottomCarve.x.restore();}
  if(dt==='carve'||dt==='erase')bottomReliefVersion++;bottomChanged=true;bottomLast=h;bottomVersion++;dirty=true;
 }
 function bottomImage(){loadBottom();var look=currentLook(),key=[look.c.join(','),bottomReliefVersion,st.stage].join('|');if(key!==bottomKey){bottomKey=key;bottomBase=bottomBase||mk(768,768);var out=bottomBase.x.createImageData(768,768),mask=bottomCarve.x.getImageData(0,0,768,768).data;
  function relief(x,y){var a=(Math.max(0,Math.min(767,y))*768+Math.max(0,Math.min(767,x)))*4;return (mask[a]>127?1:-1)*mask[a+3]/255;}
  for(var y=0;y<768;y++)for(var x=0;x<768;x++){var dx=(x-383.5)/384,dy=(y-383.5)/384,r=Math.hypot(dx,dy);if(r>1)continue;var slope=(relief(x+2,y)-relief(x-2,y)+relief(x,y+2)-relief(x,y-2))*.16,shade=.96-.04*dx-.055*dy+slope,at=(y*768+x)*4;for(var j=0;j<3;j++)out.data[at+j]=look.c[j]*shade;out.data[at+3]=Math.min(255,(1-r)*768*255);}bottomBase.x.putImageData(out,0,0);}
  return bottomBase.c;
 }
 function drawBottom(){if(bottomPending){var p=bottomPending;bottomPending=null;bottomStroke(p,false);}var l=bottomLayout();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,HC);drawScene();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.drawImage(bottomImage(),l.x-l.r,l.y-l.r,l.r*2,l.r*2);ctx.save();ctx.beginPath();ctx.arc(l.x,l.y,l.r,0,TWO);ctx.clip();ctx.globalAlpha=pigmentOpacity();ctx.drawImage(bottomPaint.c,l.x-l.r,l.y-l.r,l.r*2,l.r*2);ctx.restore();ctx.fillStyle='#29334e';ctx.font='15px sans-serif';ctx.textAlign='center';ctx.fillText('내 도자기 · 밑바닥 '+(st.stage==='done'?'보기':'꾸미기'),l.x,Math.max(55,l.y-l.r-24));}
 cv.addEventListener('pointerdown',function(e){if(!bottom||['deco','glaze','done'].indexOf(st.stage)<0||e.button>0)return;e.preventDefault();e.stopImmediatePropagation();if(st.stage==='done')return;if(st.stage==='glaze'&&!glazeBrush){toast('도구통에서 붓칠 도구를 골라 주세요.');return;}if(bottomActive!==null)return;pos(e);if(!bottomHit(ptr))return;loadBottom();bottomActive=e.pointerId;bottomChanged=false;bottomPending=null;bottomLast=null;bottomPaths=[];bottomRemember();bottomStart.x.clearRect(0,0,768,768);bottomStart.x.drawImage(bottomPaint.c,0,0);bottomCutStart.x.clearRect(0,0,768,768);bottomCutStart.x.drawImage(bottomCarve.c,0,0);bottomInk.x.clearRect(0,0,768,768);cv.setPointerCapture(e.pointerId);toolPreview(e);bottomStroke(ptr,true);},true);
 cv.addEventListener('pointermove',function(e){if(bottomActive!==e.pointerId)return;e.preventDefault();e.stopImmediatePropagation();pos(e);toolPreview(e);bottomPending={x:ptr.x,y:ptr.y};dirty=true;},true);
 function bottomEnd(e){if(bottomActive!==e.pointerId)return;e.preventDefault();e.stopImmediatePropagation();if(bottomPending){bottomStroke(bottomPending,false);bottomPending=null;}bottomActive=null;bottomLast=null;activeCursor.hidden=true;if(bottomChanged){bottomCommit();if(st.stage==='deco'&&dTool!=='erase'&&dTool!=='carve')markUsed();}else bottomHistory.pop();}
 ['pointerup','pointercancel','lostpointercapture'].forEach(function(name){cv.addEventListener(name,bottomEnd,true);});
 ['deco','glaze'].forEach(function(s){var b=document.createElement('button');b.id='wheelBottom-'+s;b.type='button';b.className='chip';b.textContent='밑바닥 꾸미기';b.setAttribute('aria-pressed','false');$('wheelView-'+s).querySelector('.chips').insertBefore(b,$('topUndo-'+s));b.onclick=function(){bottom=true;top=false;loadBottom();refresh();dirty=true;};});
 var bottomDone=document.createElement('button');bottomDone.id='wheelBottom-done';bottomDone.type='button';bottomDone.className='ghost';bottomDone.textContent='밑바닥 보기';$('p-done').appendChild(bottomDone);bottomDone.onclick=function(){bottom=!bottom;top=false;loadBottom();bottomDone.textContent=bottom?'작품 보기':'밑바닥 보기';bottomDone.setAttribute('aria-pressed',String(bottom));dirty=true;};

 function handles(){if(bottom)return false;return st.stage==='deco'&&top||st.stage==='glaze'&&glazeBrush;}
 cv.addEventListener('pointerdown',function(e){if(!handles()||e.button>0)return;toolPreview(e);e.preventDefault();e.stopImmediatePropagation();if(st.stage==='deco'&&(dTool==='carve'||dTool==='move')){toast('윗면은 붓·도장·지우개로 꾸며요. 새김과 회전은 옆면 보기에서 해 주세요.');return;}if(active!==null)return;loadTop();active=e.pointerId;pendingTop=null;changed=false;last=null;ptr.last=null;visited={};remember();strokeBase.x.clearRect(0,0,768,768);strokeBase.x.drawImage(topLayer.c,0,0);strokeInk.x.clearRect(0,0,768,768);cv.setPointerCapture(e.pointerId);pos(e);var p={x:ptr.x,y:ptr.y};if(top)paintTop(p,true);else paintSide(p,true);},true);
 cv.addEventListener('pointermove',function(e){if(active!==e.pointerId)return;e.preventDefault();e.stopImmediatePropagation();toolPreview(e);pos(e);var p={x:ptr.x,y:ptr.y};if(top){pendingTop=p;dirty=true;}else paintSide(p,false);},true);
 function end(e){if(active!==e.pointerId)return;e.preventDefault();e.stopImmediatePropagation();if(pendingTop){var pending=pendingTop;pendingTop=null;paintTop(pending,false);}active=null;activeCursor.hidden=true;last=null;ptr.last=null;if(st.stage==='glaze'&&changed&&Number($('glazeOpacity').value)>0)window.dispatchEvent(new CustomEvent('todak-glaze-painted'));if(top&&changed){commitOuterTop();commitTop();}else if(top){history.pop();}else {texVer++;dirty=cardDirty=true;}}
 cv.addEventListener('pointerup',end,true);cv.addEventListener('pointercancel',end,true);cv.addEventListener('lostpointercapture',end,true);
 // Keep the kiln action on the actual door, outside the tool sheet.
 stageEl.appendChild($('openKiln'));
 var drawWithTop=draw;draw=function(){drawWithTop();if(st.stage!=='fire'||$('openKiln').hidden)return;var g=kilnGeo(),box=cv.getBoundingClientRect(),stageBox=stageEl.getBoundingClientRect(),x=box.left-stageBox.left+(g.x0+g.cw)/W*box.width,y=box.top-stageBox.top+(g.top+g.bot)/2/HC*box.height;
  $('openKiln').style.left=x+'px';$('openKiln').style.top=y+'px';
 };

 var viewBar=document.createElement('div');viewBar.id='sheetViewBar';viewBar.hidden=true;$('sheet').insertBefore(viewBar,document.querySelector('.sheetHead').nextSibling);
 ['deco','glaze'].forEach(function(s){var view=$('wheelView-'+s),hint=view.querySelector('.wheelViewHint');if(hint)$('p-'+s).appendChild(hint);viewBar.appendChild(view);});
 var rack=document.createElement('nav');rack.id='potteryToolRack';rack.setAttribute('aria-label','도구통');rack.hidden=true;rack.innerHTML='<div id="rackThrow" aria-label="빚기 도구"></div><div id="rackDeco"></div><div id="rackGlaze"></div>';stageEl.appendChild(rack);
 function toolMarkup(key){return window.TodakToolImages?TodakToolImages.markup(key):'<svg viewBox="0 0 40 154" aria-hidden="true">'+(symbols[key]||symbols.brush)+'</svg>';}
 var dtools=$('dtools');$('rackDeco').appendChild(dtools);dtools.parentElement.setAttribute('aria-label','꾸미기 도구');
 var oldToolField=$('p-deco').querySelector('.field');if(oldToolField){var label=oldToolField.querySelector('.label');if(label)label.remove();}
 var symbols={
 brush:'<path fill="#c69559" d="M16 40h8l2 108q-6 5-12 0z"/><path fill="#d8c7a6" d="M14 30h12v17H14z"/><path fill="#9f7040" d="M14 31C9 18 12 7 20 2c8 5 11 16 6 29z"/><path fill="none" d="M18 8v20M22 10v18"/>',
 carve:'<path fill="#c99760" d="M15 47h11l1 98q-6 8-13 0z"/><path fill="#a3a59d" d="M18 49V29c-20-15-7-28 3-24 16 5 13 22-1 24M14 28h15"/>',
 stamp:'<path fill="#bc8d54" d="M15 32h10v98H15z"/><path fill="#d8b582" d="M8 10q12-12 24 0v24H8z"/><path fill="#ac7948" d="M11 3h18v10H11z"/>',
 erase:'<path fill="#c69966" d="M17 47h7v100h-7z"/><path fill="#e0c5a1" d="M8 10h24v40H8z"/><path fill="#c1a17b" d="M8 38h24v12H8z"/>',
 glaze:'<path fill="#c99a5c" d="M17 46h8l2 102q-7 6-13 0z"/><path fill="#e8d3a7" d="M9 23c0-27 25-27 25 0 0 17-25 24-25 0z"/>'
 };
 $('p-deco').appendChild($('dUndo'));$('dUndo').hidden=true;$('topUndo-deco').onclick=function(){if(top||bottom)undoBrush();else undoDeco();};$('wheelUndo').hidden=true;$('dToolTip').hidden=true;
 Array.from(dtools.querySelectorAll('[data-d]')).forEach(function(button){var name=button.textContent;button.classList.add('rackTool');button.dataset.slot=button.dataset.d;button.innerHTML=toolMarkup(button.dataset.d)+'<span>'+name+'</span>';});
 function glazeTool(id,label,icon,action){var b=document.createElement('button');b.id=id;b.type='button';b.className='rackTool';b.dataset.tool=id==='rackGlazeBase'?'glaze':'glazeBrush';b.dataset.slot=b.dataset.tool;b.innerHTML=toolMarkup(b.dataset.tool)+'<span>'+label+'</span>';b.onclick=function(){action();rackSync();};$('rackGlaze').appendChild(b);return b;}
 glazeTool('rackGlazeBase','바탕 유약',symbols.glaze,function(){glazeMode=glazeMode==='base'?null:'base';glazeBrush=false;$('glazeBrush').checked=false;refresh();});
 glazeTool('rackGlazeBrush','붓칠',symbols.brush,function(){glazeMode=glazeMode==='brush'?null:'brush';glazeBrush=glazeMode==='brush';$('glazeBrush').checked=glazeBrush;checks=false;refresh();});

 function shapeTool(key,label){var b=document.createElement('button');b.id='rack-'+key;b.type='button';b.className='rackTool';b.dataset.slot=key;b.dataset.tool=key;b.setAttribute('aria-pressed','false');b.innerHTML=toolMarkup(key)+'<span>'+label+'</span>';b.onclick=function(){var original=$('tools').querySelector('[data-t="'+key+'"]');if(original)original.click();rackSync();};$('rackThrow').appendChild(b);}
 shapeTool('trim','깎아 만들기');shapeTool('sponge','매끈하게');
 // Physical tool preview follows contact only; shaping never draws a hand.
 var activeCursor=document.createElement('div');activeCursor.id='activeToolCursor';activeCursor.hidden=true;activeCursor.setAttribute('aria-hidden','true');document.body.appendChild(activeCursor);
 function toolPreview(e){var chosen=st.stage==='deco'?dTool:st.stage==='glaze'&&glazeBrush?'glazeBrush':st.stage==='throw'&&tool==='sponge'?'sponge':null;if(!chosen||(!symbols[chosen]&&chosen!=='glazeBrush'&&chosen!=='sponge')){activeCursor.hidden=true;return;}if(activeCursor.dataset.tool!==chosen){activeCursor.dataset.tool=chosen;activeCursor.innerHTML=toolMarkup(chosen);}activeCursor.hidden=false;activeCursor.style.left=e.clientX+'px';activeCursor.style.top=e.clientY+'px';}
 cv.addEventListener('pointerdown',toolPreview,true);cv.addEventListener('pointermove',function(e){if(e.buttons)toolPreview(e);else activeCursor.hidden=true;},true);
 ['pointerup','pointercancel','pointerleave','lostpointercapture'].forEach(function(event){cv.addEventListener(event,function(){activeCursor.hidden=true;},true);});
 var toolName=document.createElement('output');toolName.id='rackToolName';toolName.setAttribute('aria-live','polite');toolName.setAttribute('role','tooltip');document.body.appendChild(toolName);document.addEventListener('scroll',function(){toolName.hidden=true;},true);
 function currentName(){if(st.stage==='throw')return tool==='trim'?'깎아 만들기':tool==='sponge'?'매끈하게':'';return st.stage==='glaze'?(glazeMode==='brush'?'붓칠':glazeMode==='base'?'바탕 유약':''):({brush:'붓',carve:'조각칼',stamp:'도장',erase:'지우개'}[dTool]||'도구통');}
 function showToolName(name,button){toolName.textContent=name;toolName.hidden=rack.hidden||!name;var anchor=(button||rack).getBoundingClientRect(),size=toolName.getBoundingClientRect(),vw=window.innerWidth||390;toolName.style.left=Math.max(8,Math.min(vw-size.width-8,anchor.left+anchor.width/2-size.width/2))+'px';toolName.style.top=Math.max(8,anchor.top-size.height-12)+'px';}
 rack.querySelectorAll('.rackTool').forEach(function(button){var name=button.querySelector('span').textContent;button.setAttribute('aria-label',name);button.title=name;button.addEventListener('mouseenter',function(){showToolName(name,button);});button.addEventListener('focus',function(){showToolName(name,button);});button.addEventListener('mouseleave',function(){showToolName(currentName());});button.addEventListener('click',function(){showToolName(name,button);});});showToolName(currentName());
 $('glazeBrush').closest('label').hidden=true;$('glazeFree').remove();$('glazeChecks').remove();$('wheelUndo').textContent='되돌리기';
 $('glazePaintHint').hidden=true;

 // Tool-specific controls: entering glaze does not implicitly select a tool.
 var baseSettings=document.createElement('div');baseSettings.id='glazeBaseSettings';
 $('p-glaze').insertBefore(baseSettings,$('swatches').closest('.field'));
 [$('swatches').closest('.field'),$('finish').closest('.field'),$('dip').closest('details')].forEach(function(el){baseSettings.appendChild(el);});
 var fireSettings=$('fire').closest('.field');fireSettings.id='fireSettings';$('p-fire').insertBefore(fireSettings,$('p-fire').firstChild);
 var firePanelUI=fireUI;fireUI=function(){firePanelUI();fireSettings.hidden=fstep!=='prep'&&fstep!=='pick';};
 // Keep the existing colour value as the brush engine's independent input.
 var brushSelect=$('glazeBrushColor');brushSelect.closest('label').hidden=true;
 var brushPalette=document.createElement('div');brushPalette.className='field';brushPalette.id='glazeBrushPalette';brushPalette.innerHTML='<span class="label">붓 유약 색</span><div class="swatches" id="glazeBrushSwatches"></div><details class="fold"><summary>색 더 보기</summary><div class="in"><div class="swatches" id="glazeBrushSwatchesMore"></div></div></details>';
 $('freeGlaze').insertBefore(brushPalette,brushSelect.closest('label'));
 GLAZES.filter(function(g){return g.id!=='custom';}).forEach(function(g){var b=document.createElement('button'),dot=document.createElement('i');b.type='button';b.className='swatch';b.dataset.brushGlaze=g.id;dot.style.background=css(g.c);b.appendChild(dot);b.appendChild(document.createTextNode(g.name));b.onclick=function(){brushSelect.value=g.id;syncBrushPalette();};$(TOP.indexOf(g.id)>=0?'glazeBrushSwatches':'glazeBrushSwatchesMore').appendChild(b);});
 function syncBrushPalette(){brushPalette.querySelectorAll('[data-brush-glaze]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.brushGlaze===brushSelect.value));});}
 brushSelect.addEventListener('change',syncBrushPalette);syncBrushPalette();
 function syncGlazePanels(){baseSettings.hidden=glazeMode!=='base';$('freeGlaze').hidden=glazeMode!=='brush';}
 var rackHome=showHome;showHome=function(canClose){rackHome(canClose);activeCursor.hidden=true;rackSync();};
 $('homeClose').addEventListener('click',function(){rackSync();});
 var rackOverlays=closeOverlays;closeOverlays=function(){rackOverlays();rackSync();};
 var rackChallenge=showChSel;showChSel=function(){rackChallenge();activeCursor.hidden=true;rackSync();};
 function rackSync(){syncGlazePanels();rack.hidden=!$('home').hidden||!$('chSel').hidden||['throw','deco','glaze'].indexOf(st.stage)<0;$('rackThrow').hidden=st.stage!=='throw';$('rackDeco').hidden=st.stage!=='deco';$('rackGlaze').hidden=st.stage!=='glaze';['trim','sponge'].forEach(function(key){$('rack-'+key).setAttribute('aria-pressed',String(tool===key));});$('rackGlazeBase').setAttribute('aria-pressed',String(glazeMode==='base'));$('rackGlazeBrush').setAttribute('aria-pressed',String(glazeMode==='brush'));var compact=window.innerWidth<=1440,host=compact?$('p-'+st.stage):stageEl;if(host&&rack.parentNode!==host){if(compact)host.insertBefore(rack,host.firstChild);else host.appendChild(rack);}rack.classList.toggle('rackDocked',compact);rack.style.bottom='auto';if(toolName){toolName.hidden=rack.hidden||!currentName();if(!rack.hidden)showToolName(currentName());}}
 $('tools').addEventListener('click',function(){rackSync();});

 var rackRefresh=refresh;refresh=function(){rackRefresh();rackSync();};var rackStage=setStage;setStage=function(stage){rackStage(stage);rackSync();};var rackSheet=setSheet;setSheet=function(open){var result=rackSheet(open);rackSync();setTimeout(rackSync,300);return result;};window.addEventListener('resize',rackSync);rackSync();
 // A separate 3D inspection camera; dragging rotates the object instead of moving the photo.
 var viewer=document.createElement('dialog');viewer.id='finished360';viewer.innerHTML='<button type="button" id="closeFinished360">닫기 ×</button><h2>완성 작품 · 360° 감상</h2><p>좌우로 돌리고 위아래로 기울여 안쪽과 바닥까지 살펴보세요.</p><canvas id="finished360Canvas" width="600" height="540" aria-label="도자기 360도 감상"></canvas><small id="finished360Status">드래그로 회전 · 휠 또는 두 손가락으로 확대</small>';document.body.appendChild(viewer);
 var inspect=document.createElement('button');inspect.id='openFinished360';inspect.type='button';inspect.className='corner';inspect.textContent='360° 감상';document.querySelector('.resultViewDock').appendChild(inspect);
 var orbitCanvas=$('finished360Canvas'),yaw=0,pitch=.32,zoom=1,orbitPointer=null;
 function renderOrbit(){if(!viewer.open||!window.TodakPhoto)return;var data=photoData();Object.assign(data,{width:600,canvasHeight:540,viewWidth:600,viewHeight:540,pixelWidth:600,pixelHeight:540,rotation:yaw,elevation:pitch,zoom:zoom,objectScale:1,panX:0,panY:0,background:'studio',transparent:true,inspection:true});var out=TodakPhoto.render(data);if(out){var x=orbitCanvas.getContext('2d');x.fillStyle='#e8e1d3';x.fillRect(0,0,600,540);x.drawImage(out,0,0,600,540);}}
 inspect.onclick=function(){viewer.showModal();yaw=rot;pitch=.32;zoom=1;renderOrbit();if(!window.TodakPhoto&&window.TodakLoad3D){$('finished360Status').textContent='3D 작품을 불러오는 중…';TodakLoad3D().then(function(){$('finished360Status').textContent='드래그로 회전 · 휠로 확대';renderOrbit();}).catch(function(){$('finished360Status').textContent='3D 감상을 열 수 없어요. 잠시 후 다시 시도해 주세요.';});}};
 $('closeFinished360').onclick=function(){viewer.close();dirty=true;};
 var fingers=new Map(),pinch=0;orbitCanvas.addEventListener('pointerdown',function(e){fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});orbitPointer={id:e.pointerId,x:e.clientX,y:e.clientY};orbitCanvas.setPointerCapture(e.pointerId);if(fingers.size===2){var p=Array.from(fingers.values());pinch=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);}});
 orbitCanvas.addEventListener('pointermove',function(e){if(!fingers.has(e.pointerId))return;var previous=fingers.get(e.pointerId);fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(fingers.size===2){var p=Array.from(fingers.values()),next=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(pinch>0)zoom=clamp(zoom*next/pinch,.5,2.5);pinch=next;}else{yaw+=(e.clientX-previous.x)*.012;pitch=clamp(pitch+(e.clientY-previous.y)*.008,-1.45,1.5);}renderOrbit();});
 ['pointerup','pointercancel','lostpointercapture'].forEach(function(event){orbitCanvas.addEventListener(event,function(e){fingers.delete(e.pointerId);pinch=0;});});orbitCanvas.addEventListener('wheel',function(e){e.preventDefault();zoom=clamp(zoom*Math.exp(-e.deltaY*.001),.5,2.5);renderOrbit();},{passive:false});
 window.TodakFinished360={render:renderOrbit,state:function(){return {yaw:yaw,pitch:pitch,zoom:zoom};}};
 window.TodakWheel={forms:forms,brushing:function(){return glazeBrush;},top:function(){return top;},layout:topLayout,bottom:function(){return bottom;},bottomLayout:bottomLayout,bottomLayer:bottomPaint,bottomRelief:bottomCarve,layer:topLayer,refresh:refresh,surface:function(){return topSurface(topLayout());}};
})();
