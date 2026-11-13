/* Free wheel throwing: axisymmetric profiles and a separate, planar inner surface. */
(function(){
 var top=false,glazeBrush=false,active=null,last=null,history=[],topLayer=mk(768,768),loaded=null,topVersion=0,changed=false;
 var forms={};
 // Free throwing always starts with one lump; existing saved profiles remain valid.
 Array.from($('presets').querySelectorAll('button')).forEach(function(b){if(b.dataset.p!=='lump')b.remove();});
 $('f-presets').hidden=true;
 function resetProfile(){}
 function block(id,parent,html){var e=document.createElement('div');e.id=id;e.className='wheelFreedom';e.innerHTML=html;$(parent).appendChild(e);return e;}
 ['deco','glaze'].forEach(function(stage){block('wheelView-'+stage,'p-'+stage,'<div class="chips"><button type="button" class="chip" id="wheelSide-'+stage+'" aria-pressed="true">側面</button><button type="button" class="chip" id="wheelTop-'+stage+'" aria-pressed="false">위에서 꾸미기</button><button type="button" class="ghost" id="topUndo-'+stage+'">안쪽 붓칠 되돌리기</button></div><p class="wheelViewHint">만든 도자기의 입구와 안쪽을 위에서 꾸며요. 바깥쪽은 옆면에서 꾸며요.</p>');$('wheelSide-'+stage).textContent='옆면 보기';$('p-'+stage).insertBefore($('wheelView-'+stage),$('p-'+stage).firstChild);$('wheelTop-'+stage).onclick=function(){if(st.height-st.floor<.05){toast('속·두께 조절로 안쪽을 먼저 파 주세요.');return;}top=true;if(stage==='glaze'){glazeBrush=true;$('glazeBrush').checked=true;}refresh();dirty=true;};$('wheelSide-'+stage).onclick=function(){top=false;refresh();dirty=true;};});
 block('freeGlaze','p-glaze','<label><input type="checkbox" id="glazeBrush"> 붓으로 유약 바르기</label><p>선택한 붓 색으로 자유롭게 칠해요. 옆면과 접시 안쪽을 각각 꾸밀 수 있어요.</p><label>붓 유약 색<select id="glazeBrushColor"></select></label><label>붓 굵기<input type="range" id="glazeBrushSize" min="0.1" max="2" step="0.05" value="0.45"></label><div class="chips"><button class="chip" type="button" id="glazeFree">자유롭게</button><button class="chip" type="button" id="glazeChecks">체크무늬 칸 채우기</button><button class="ghost" type="button" id="wheelUndo">붓칠 되돌리기</button></div><p id="glazePaintHint">체크무늬는 원하는 칸을 누르거나 쓸어서 채워요. 다른 색을 골라 이어서 칠해 보세요.</p>');
 $('p-glaze').insertBefore($('freeGlaze'),$('wheelView-glaze').nextSibling);
 GLAZES.filter(function(g){return g.id!=='custom';}).forEach(function(g){var o=document.createElement('option');o.value=g.id;o.textContent=g.n||g.name||g.id;$('glazeBrushColor').appendChild(o);});
 $('glazeBrushColor').value='cobalt';var checks=false;
 $('glazeBrush').onchange=function(){glazeBrush=this.checked;if(!glazeBrush)top=false;refresh();};
 $('glazeFree').onclick=function(){checks=false;refresh();};$('glazeChecks').onclick=function(){checks=true;glazeBrush=true;$('glazeBrush').checked=true;refresh();};
 function refresh(){['deco','glaze'].forEach(function(s){if(!$('wheelTop-'+s))return;$('wheelTop-'+s).setAttribute('aria-pressed',String(top));$('wheelSide-'+s).setAttribute('aria-pressed',String(!top));});if($('glazeChecks')){$('glazeChecks').setAttribute('aria-pressed',String(checks));$('glazeFree').setAttribute('aria-pressed',String(!checks));}resetProfile();}
 function loadTop(){if(loaded===st.topPaint)return;loaded=st.topPaint||null;topLayer.x.clearRect(0,0,768,768);if(loaded){var expected=loaded;loadTex(loaded,topLayer,function(){if(st.topPaint===expected){topVersion++;dirty=true;}});}}
 function commitTop(){st.topPaint=topLayer.c.toDataURL();loaded=st.topPaint;topVersion++;texVer++;dirty=cardDirty=true;}
 var oldClear=clearDeco;clearDeco=function(){oldClear();st.topPaint=null;loaded=null;topLayer.x.clearRect(0,0,768,768);history=[];topVersion++;};
 var oldStage=setStage;setStage=function(s){active=null;top=false;glazeBrush=false;if($('glazeBrush'))$('glazeBrush').checked=false;oldStage(s);loadTop();refresh();};
 var oldFields=itemFields;itemFields=function(it){it=oldFields(it);if(st.topPaint){it.topPaint=st.topPaint;if(it.communityVisual)it.communityVisual.topPaint=st.topPaint;}return it;};
 var oldData=photoData;photoData=function(){loadTop();var d=oldData();if(st.topPaint){d.topOverlay=topLayer.c;d.topRadius=Math.max.apply(null,st.radii);d.key+='|top:'+topVersion;}return d;};
 function topLayout(){var unit=W/Math.max(1,stageEl.clientWidth),wide=stageEl.clientWidth>=760,right=wide?Math.min(W*.45,530*unit):0;var available=Math.max(W*.35,W-right),r=Math.min(available*.42,HC*.32),cy=HC*.55;return {x:available/2,y:cy,r:r,cm:Math.max.apply(null,st.radii),opening:innerAt(1)};}
 // Orthographic overhead visibility from the actual outer and inner profiles.
 function topSurface(l){var count=240,rows=new Array(count),dr=l.cm/count;
  function put(radius,y,inside){var k=Math.max(0,Math.min(count-1,Math.floor(radius/dr)));if(!rows[k]||y>=rows[k].y)rows[k]={y:y,inside:inside};}
  function segment(r0,y0,r1,y1,inside){var steps=Math.max(2,Math.ceil(Math.abs(r1-r0)/dr*2));for(var j=0;j<=steps;j++){var t=j/steps;put(r0+(r1-r0)*t,y0+(y1-y0)*t,inside);}}
  for(var i=1;i<=240;i++){var t0=(i-1)/240,t1=i/240,y0=t0*st.height,y1=t1*st.height;segment(rAt(t0),y0,rAt(t1),y1,false);if(y1>=st.floor){var iy=Math.max(y0,st.floor);segment(innerAt(iy/st.height),iy,innerAt(t1),y1,true);}}
  segment(0,st.floor,innerAt(st.floor/st.height),st.floor,true);
  segment(innerAt(1),st.height,rAt(1),st.height,false);
  return rows;
 }
 function inTop(p){var l=topLayout(),dx=(p.x-l.x)/l.r,dy=(p.y-l.y)/l.r,r=Math.hypot(dx,dy),rows=topSurface(l),hit=rows[Math.min(rows.length-1,Math.floor(r*rows.length))];if(r>1||!hit||!hit.inside)return null;return {x:(dx+1)*384,y:(dy+1)*384};}
 var oldDraw=draw;draw=function(){if(!top||['deco','glaze'].indexOf(st.stage)<0){oldDraw();return;}loadTop();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,HC);drawScene();ctx.setTransform(dpr,0,0,dpr,0,0);var l=topLayout(),rows=topSurface(l),base=st.stage==='deco'?RAW:glaze().c;ctx.save();
  // Every ring uses the height of the surface visible along the viewing ray.
  for(var i=rows.length-1;i>=0;i--){var hit=rows[i];if(!hit)continue;var outer=(i+1)/rows.length*l.r,inner=i/rows.length*l.r,depth=(st.height-hit.y)/Math.max(.1,st.height-st.floor),shade=hit.inside?.60+.37*(1-depth):.74+.25*hit.y/st.height;
   ctx.beginPath();ctx.arc(l.x,l.y,outer,0,TWO);ctx.arc(l.x,l.y,inner,0,TWO,true);ctx.fillStyle=css(base,shade);ctx.fill('evenodd');
  }
  ctx.save();ctx.beginPath();for(var k=0;k<rows.length;k++){if(!rows[k]||!rows[k].inside)continue;ctx.moveTo(l.x+(k+1)/rows.length*l.r,l.y);ctx.arc(l.x,l.y,(k+1)/rows.length*l.r,0,TWO);ctx.arc(l.x,l.y,k/rows.length*l.r,0,TWO,true);}ctx.clip('evenodd');ctx.drawImage(topLayer.c,l.x-l.r,l.y-l.r,2*l.r,2*l.r);
  if(checks&&st.stage==='glaze'&&glazeBrush){ctx.strokeStyle='rgba(90,70,55,.22)';ctx.lineWidth=1;for(var a=-1;a<=1.001;a+=.2){ctx.beginPath();ctx.moveTo(l.x+a*l.r,l.y-l.r);ctx.lineTo(l.x+a*l.r,l.y+l.r);ctx.stroke();ctx.beginPath();ctx.moveTo(l.x-l.r,l.y+a*l.r);ctx.lineTo(l.x+l.r,l.y+a*l.r);ctx.stroke();}}ctx.restore();ctx.restore();ctx.fillStyle='#29334e';ctx.font='15px sans-serif';ctx.textAlign='center';ctx.fillText('내 도자기 · 위에서 꾸미기',l.x,Math.max(55,l.y-l.r-24));};
 function remember(){history.push({url:st.topPaint||null,top:topLayer.x.getImageData(0,0,768,768),p:paint.x.getImageData(0,0,TW,TH),hp:hasPaint});if(history.length>6)history.shift();}
 function undoBrush(){var h=history.pop();if(!h)return;topLayer.x.putImageData(h.top,0,0);paint.x.putImageData(h.p,0,0);hasPaint=h.hp;st.topPaint=h.url;loaded=h.url;topVersion++;texVer++;dirty=cardDirty=true;}
 $('wheelUndo').onclick=undoBrush;$('topUndo-deco').onclick=undoBrush;$('topUndo-glaze').onclick=undoBrush;
 function brushColor(){return st.stage==='glaze'?byId(GLAZES,$('glazeBrushColor').value).c:pigColor();}
 var visited={};
 function paintTop(p,first){var h=inTop(p);if(!h){last=null;return;}var c=topLayer.x,l=topLayout(),size=(st.stage==='glaze'?Number($('glazeBrushSize').value):curSize())/l.cm*384,erase=st.stage==='deco'&&dTool==='erase';c.save();c.globalCompositeOperation=erase?'destination-out':'source-over';c.fillStyle=c.strokeStyle=css(brushColor());c.lineCap=c.lineJoin='round';c.lineWidth=size*2;
 if(st.stage==='glaze'&&checks){var cell=76.8,col=Math.floor(h.x/cell),row=Math.floor(h.y/cell),key=col+','+row;if(!visited[key]){c.fillRect(col*cell,row*cell,cell+.5,cell+.5);visited[key]=true;}}
 else if(st.stage==='deco'&&dTool==='stamp'){if(first){c.translate(h.x,h.y);c.scale(size/20,size/20);c.lineWidth=2.6;c.stroke(new Path2D(STAMP_PATHS[dStamp]||STAMP_PATHS.flower));}}
 else if(st.stage==='deco'&&dRing){var radius=Math.hypot(h.x-384,h.y-384);c.beginPath();c.arc(384,384,radius,0,TWO);c.stroke();}
 else {c.beginPath();c.moveTo(last?last.x:h.x,last?last.y:h.y);c.lineTo(h.x,h.y);c.stroke();c.beginPath();c.arc(h.x,h.y,size,0,TWO);c.fill();}
 c.restore();changed=true;last=h;topVersion++;texVer++;dirty=true;}
 function paintSide(p,first){var hit=hitSurface(p.x,p.y);if(!hit){ptr.last=null;return;}var saved={t:dTool,p:dPig,c:dColor,s:dSizeV.brush,o:dOpacity,r:dRing};dTool='brush';dPig='custom';dColor=brushColor();dOpacity=1;dRing=false;dSizeV.brush=Math.log(Number($('glazeBrushSize').value)/RANGE.brush[0])/Math.log(RANGE.brush[1]/RANGE.brush[0]);if(checks){var col=Math.floor(hit.u*16),row=Math.floor((1-hit.v)*12),key=col+','+row;if(!visited[key]){paint.x.fillStyle=css(dColor);paint.x.fillRect(col*TW/16,row*TH/12,TW/16+.5,TH/12+.5);visited[key]=true;hasPaint=true;texVer++;dirty=true;}}else applyDeco(hit,first||!ptr.last);dTool=saved.t;dPig=saved.p;dColor=saved.c;dSizeV.brush=saved.s;dOpacity=saved.o;dRing=saved.r;}
 function handles(){return st.stage==='deco'&&top||st.stage==='glaze'&&glazeBrush;}
 cv.addEventListener('pointerdown',function(e){if(!handles()||e.button>0)return;e.preventDefault();e.stopImmediatePropagation();if(st.stage==='deco'&&(dTool==='carve'||dTool==='move')){toast('윗면은 붓·도장·지우개로 꾸며요. 새김과 회전은 옆면 보기에서 해 주세요.');return;}if(active!==null)return;loadTop();active=e.pointerId;changed=false;last=null;ptr.last=null;visited={};remember();cv.setPointerCapture(e.pointerId);pos(e);var p={x:ptr.x,y:ptr.y};if(top)paintTop(p,true);else paintSide(p,true);},true);
 cv.addEventListener('pointermove',function(e){if(active!==e.pointerId)return;e.preventDefault();e.stopImmediatePropagation();pos(e);var p={x:ptr.x,y:ptr.y};if(top)paintTop(p,false);else paintSide(p,false);},true);
 function end(e){if(active!==e.pointerId)return;e.preventDefault();e.stopImmediatePropagation();active=null;last=null;ptr.last=null;if(top&&changed)commitTop();else if(top){history.pop();}else {texVer++;dirty=cardDirty=true;}}
 cv.addEventListener('pointerup',end,true);cv.addEventListener('pointercancel',end,true);cv.addEventListener('lostpointercapture',end,true);
 // Keep the kiln action on the actual door, outside the tool sheet.
 stageEl.appendChild($('openKiln'));
 var drawWithTop=draw;draw=function(){drawWithTop();if(st.stage!=='fire'||$('openKiln').hidden)return;var g=kilnGeo(),box=cv.getBoundingClientRect(),stageBox=stageEl.getBoundingClientRect(),sheetBox=$('sheet').getBoundingClientRect(),x=box.left-stageBox.left+(g.x0+g.cw)/W*box.width,y=box.top-stageBox.top+(g.top+g.bot)/2/HC*box.height,limit=sheetBox.top>box.top?Math.min(box.bottom,sheetBox.top):box.bottom;
  $('openKiln').style.left=Math.max(85,Math.min(stageBox.width-85,x))+'px';$('openKiln').style.top=Math.max(box.top-stageBox.top+70,Math.min(limit-stageBox.top-35,y))+'px';
 };
 window.TodakWheel={forms:forms,top:function(){return top;},layout:topLayout,layer:topLayer,refresh:refresh,surface:function(){return topSurface(topLayout());}};
})();
