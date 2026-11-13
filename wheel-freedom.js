/* Free wheel throwing: axisymmetric profiles and a separate, planar inner surface. */
(function(){
 var top=false,glazeBrush=false,active=null,last=null,history=[],topLayer=mk(768,768),strokeBase=mk(768,768),strokeInk=mk(768,768),loaded=null,topVersion=0,changed=false;
 var forms={};
 // Free throwing always starts with one lump; existing saved profiles remain valid.
 Array.from($('presets').querySelectorAll('button')).forEach(function(b){if(b.dataset.p!=='lump')b.remove();});
 $('f-presets').hidden=true;
 function resetProfile(){}
 function block(id,parent,html){var e=document.createElement('div');e.id=id;e.className='wheelFreedom';e.innerHTML=html;$(parent).appendChild(e);return e;}
 ['deco','glaze'].forEach(function(stage){block('wheelView-'+stage,'p-'+stage,'<div class="chips"><button type="button" class="chip" id="wheelSide-'+stage+'" aria-pressed="true">側面</button><button type="button" class="chip" id="wheelTop-'+stage+'" aria-pressed="false">위에서 꾸미기</button><button type="button" class="ghost" id="topUndo-'+stage+'">되돌리기</button></div><p class="wheelViewHint">만든 도자기의 입구와 안쪽을 위에서 꾸며요. 바깥쪽은 옆면에서 꾸며요.</p>');$('wheelSide-'+stage).textContent='옆면 보기';$('p-'+stage).insertBefore($('wheelView-'+stage),$('p-'+stage).firstChild);$('wheelTop-'+stage).onclick=function(){if(st.height-st.floor<.05){toast('속·두께 조절로 안쪽을 먼저 파 주세요.');return;}top=true;refresh();dirty=true;};$('wheelSide-'+stage).onclick=function(){top=false;refresh();dirty=true;};});
 block('freeGlaze','p-glaze','<label><input type="checkbox" id="glazeBrush"> 붓으로 유약 바르기</label><p>선택한 붓 색으로 자유롭게 칠해요. 옆면과 접시 안쪽을 각각 꾸밀 수 있어요.</p><label>붓 유약 색<select id="glazeBrushColor"></select></label><label>유약 불투명도 <output id="glazeOpacityValue">100%</output><input id="glazeOpacity" type="range" min="0" max="100" step="1" value="100"></label><label>붓 굵기<input type="range" id="glazeBrushSize" min="0.1" max="2" step="0.05" value="0.45"></label><div class="chips"><button class="chip" type="button" id="glazeFree">자유롭게</button><button class="chip" type="button" id="glazeChecks">체크무늬 칸 채우기</button><button class="ghost" type="button" id="wheelUndo">되돌리기</button></div><p id="glazePaintHint">체크무늬는 원하는 칸을 누르거나 쓸어서 채워요. 다른 색을 골라 이어서 칠해 보세요.</p>');
 $('p-glaze').insertBefore($('freeGlaze'),$('wheelView-glaze').nextSibling);
 GLAZES.filter(function(g){return g.id!=='custom';}).forEach(function(g){var o=document.createElement('option');o.value=g.id;o.textContent=g.n||g.name||g.id;$('glazeBrushColor').appendChild(o);});
 $('glazeBrushColor').value='cobalt';var checks=false;
 $('glazeOpacity').oninput=function(){$('glazeOpacityValue').textContent=this.value+'%';};
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
  var materialTop=false;
  if(st.stage==='glaze'){
   if(!window.TodakPhoto&&window.TodakLoad3D&&!window.todakTopLoading){window.todakTopLoading=true;TodakLoad3D().then(function(){dirty=true;}).catch(function(){});}
   if(window.TodakPhoto&&TodakPhoto.available){var data=photoData(),edge=Math.max(1,Math.round(l.r*2));data=Object.assign({},data,{key:data.key+'|overhead',overhead:true,transparent:true,width:edge,canvasHeight:edge,viewWidth:edge,viewHeight:edge,pixelWidth:edge*dpr,pixelHeight:edge*dpr,rotation:0});var rendered=TodakPhoto.render(data);if(rendered){ctx.drawImage(rendered,l.x-l.r,l.y-l.r,l.r*2,l.r*2);materialTop=true;}}
  }
  if(!materialTop){
  // Every ring uses the height of the surface visible along the viewing ray.
  for(var i=rows.length-1;i>=0;i--){var hit=rows[i];if(!hit)continue;var outer=(i+1)/rows.length*l.r,inner=i/rows.length*l.r,depth=(st.height-hit.y)/Math.max(.1,st.height-st.floor),shade=hit.inside?.60+.37*(1-depth):.74+.25*hit.y/st.height;
   ctx.beginPath();ctx.arc(l.x,l.y,outer,0,TWO);ctx.arc(l.x,l.y,inner,0,TWO,true);ctx.fillStyle=css(base,shade);ctx.fill('evenodd');
  }
  ctx.save();ctx.beginPath();for(var k=0;k<rows.length;k++){if(!rows[k]||!rows[k].inside)continue;ctx.moveTo(l.x+(k+1)/rows.length*l.r,l.y);ctx.arc(l.x,l.y,(k+1)/rows.length*l.r,0,TWO);ctx.arc(l.x,l.y,k/rows.length*l.r,0,TWO,true);}ctx.clip('evenodd');ctx.drawImage(topLayer.c,l.x-l.r,l.y-l.r,2*l.r,2*l.r);
  if(st.stage==='glaze'){ctx.globalCompositeOperation='multiply';var shade=ctx.createRadialGradient(l.x-l.r*.2,l.y-l.r*.25,l.r*.1,l.x,l.y,l.r);shade.addColorStop(0,'#fffdf8');shade.addColorStop(.7,'#d2cbb9');shade.addColorStop(1,'#a8a18f');ctx.fillStyle=shade;ctx.fillRect(l.x-l.r,l.y-l.r,l.r*2,l.r*2);ctx.globalCompositeOperation='source-over';}
  if(checks&&st.stage==='glaze'&&glazeBrush){ctx.strokeStyle='rgba(90,70,55,.22)';ctx.lineWidth=1;for(var a=-1;a<=1.001;a+=.2){ctx.beginPath();ctx.moveTo(l.x+a*l.r,l.y-l.r);ctx.lineTo(l.x+a*l.r,l.y+l.r);ctx.stroke();ctx.beginPath();ctx.moveTo(l.x-l.r,l.y+a*l.r);ctx.lineTo(l.x+l.r,l.y+a*l.r);ctx.stroke();}}ctx.restore();}
 ctx.restore();ctx.fillStyle='#29334e';ctx.font='15px sans-serif';ctx.textAlign='center';ctx.fillText('내 도자기 · 위에서 꾸미기',l.x,Math.max(55,l.y-l.r-24));};
 function remember(){history.push({url:st.topPaint||null,top:topLayer.x.getImageData(0,0,768,768),p:paint.x.getImageData(0,0,TW,TH),hp:hasPaint});if(history.length>6)history.shift();}
 function undoBrush(){var h=history.pop();if(!h)return;topLayer.x.putImageData(h.top,0,0);paint.x.putImageData(h.p,0,0);hasPaint=h.hp;st.topPaint=h.url;loaded=h.url;topVersion++;texVer++;dirty=cardDirty=true;}
 $('wheelUndo').onclick=undoBrush;$('topUndo-deco').onclick=undoBrush;$('topUndo-glaze').onclick=undoBrush;
 function brushColor(){return st.stage==='glaze'?byId(GLAZES,$('glazeBrushColor').value).c:pigColor();}
 var visited={};
 function paintTop(p,first){var h=inTop(p);if(!h){last=null;return;}var erase=st.stage==='deco'&&dTool==='erase',c=erase?topLayer.x:strokeInk.x,l=topLayout(),size=(st.stage==='glaze'?Number($('glazeBrushSize').value):curSize())/l.cm*384,erase=st.stage==='deco'&&dTool==='erase';c.save();c.globalCompositeOperation=erase?'destination-out':'source-over';c.fillStyle=c.strokeStyle=css(brushColor());c.lineCap=c.lineJoin='round';c.lineWidth=size*2;
 if(st.stage==='glaze'&&checks){var cell=76.8,col=Math.floor(h.x/cell),row=Math.floor(h.y/cell),key=col+','+row;if(!visited[key]){c.fillRect(col*cell,row*cell,cell+.5,cell+.5);visited[key]=true;}}
 else if(st.stage==='deco'&&dTool==='stamp'){if(first){c.translate(h.x,h.y);c.scale(size/20,size/20);c.lineWidth=2.6;c.stroke(new Path2D(STAMP_PATHS[dStamp]||STAMP_PATHS.flower));}}
 else if(st.stage==='deco'&&dRing){var radius=Math.hypot(h.x-384,h.y-384);c.beginPath();c.arc(384,384,radius,0,TWO);c.stroke();}
 else {c.beginPath();c.moveTo(last?last.x:h.x,last?last.y:h.y);c.lineTo(h.x,h.y);c.stroke();c.beginPath();c.arc(h.x,h.y,size,0,TWO);c.fill();}
 c.restore();if(!erase){topLayer.x.clearRect(0,0,768,768);topLayer.x.drawImage(strokeBase.c,0,0);topLayer.x.save();topLayer.x.globalAlpha=st.stage==='glaze'?Number($('glazeOpacity').value)/100:dOpacity;topLayer.x.drawImage(strokeInk.c,0,0);topLayer.x.restore();}changed=true;last=h;topVersion++;texVer++;dirty=true;}
 function paintSide(p,first){var hit=hitSurface(p.x,p.y);if(!hit){ptr.last=null;return;}var saved={t:dTool,p:dPig,c:dColor,s:dSizeV.brush,o:dOpacity,r:dRing};dTool='brush';dPig='custom';dColor=brushColor();dOpacity=Number($('glazeOpacity').value)/100;dRing=false;dSizeV.brush=Math.log(Number($('glazeBrushSize').value)/RANGE.brush[0])/Math.log(RANGE.brush[1]/RANGE.brush[0]);if(checks){var col=Math.floor(hit.u*16),row=Math.floor((1-hit.v)*12),key=col+','+row;if(!visited[key]){paint.x.save();paint.x.globalAlpha=dOpacity;paint.x.fillStyle=css(dColor);paint.x.fillRect(col*TW/16,row*TH/12,TW/16+.5,TH/12+.5);paint.x.restore();visited[key]=true;hasPaint=true;texVer++;dirty=true;}}else applyDeco(hit,first||!ptr.last);dTool=saved.t;dPig=saved.p;dColor=saved.c;dSizeV.brush=saved.s;dOpacity=saved.o;dRing=saved.r;}
 function handles(){return st.stage==='deco'&&top||st.stage==='glaze'&&glazeBrush;}
 cv.addEventListener('pointerdown',function(e){if(!handles()||e.button>0)return;e.preventDefault();e.stopImmediatePropagation();if(st.stage==='deco'&&(dTool==='carve'||dTool==='move')){toast('윗면은 붓·도장·지우개로 꾸며요. 새김과 회전은 옆면 보기에서 해 주세요.');return;}if(active!==null)return;loadTop();active=e.pointerId;changed=false;last=null;ptr.last=null;visited={};remember();strokeBase.x.clearRect(0,0,768,768);strokeBase.x.drawImage(topLayer.c,0,0);strokeInk.x.clearRect(0,0,768,768);cv.setPointerCapture(e.pointerId);pos(e);var p={x:ptr.x,y:ptr.y};if(top)paintTop(p,true);else paintSide(p,true);},true);
 cv.addEventListener('pointermove',function(e){if(active!==e.pointerId)return;e.preventDefault();e.stopImmediatePropagation();pos(e);var p={x:ptr.x,y:ptr.y};if(top)paintTop(p,false);else paintSide(p,false);},true);
 function end(e){if(active!==e.pointerId)return;e.preventDefault();e.stopImmediatePropagation();active=null;last=null;ptr.last=null;if(top&&changed)commitTop();else if(top){history.pop();}else {texVer++;dirty=cardDirty=true;}}
 cv.addEventListener('pointerup',end,true);cv.addEventListener('pointercancel',end,true);cv.addEventListener('lostpointercapture',end,true);
 // Keep the kiln action on the actual door, outside the tool sheet.
 stageEl.appendChild($('openKiln'));
 var drawWithTop=draw;draw=function(){drawWithTop();if(st.stage!=='fire'||$('openKiln').hidden)return;var g=kilnGeo(),box=cv.getBoundingClientRect(),stageBox=stageEl.getBoundingClientRect(),sheetBox=$('sheet').getBoundingClientRect(),x=box.left-stageBox.left+(g.x0+g.cw)/W*box.width,y=box.top-stageBox.top+(g.top+g.bot)/2/HC*box.height,limit=sheetBox.top>box.top?Math.min(box.bottom,sheetBox.top):box.bottom;
  $('openKiln').style.left=Math.max(85,Math.min(stageBox.width-85,x))+'px';$('openKiln').style.top=Math.max(box.top-stageBox.top+70,Math.min(limit-stageBox.top-35,y))+'px';
 };

 var rack=document.createElement('nav');rack.id='potteryToolRack';rack.setAttribute('aria-label','도구통');rack.hidden=true;rack.innerHTML='<small>도구통</small><div id="rackDeco"></div><div id="rackGlaze"></div>';stageEl.appendChild(rack);
 var dtools=$('dtools');$('rackDeco').appendChild(dtools);dtools.parentElement.setAttribute('aria-label','꾸미기 도구');
 var oldToolField=$('p-deco').querySelector('.field');if(oldToolField){var label=oldToolField.querySelector('.label');if(label)label.remove();}
 var symbols={
 brush:'<path fill="#c69559" d="M16 40h8l2 108q-6 5-12 0z"/><path fill="#d8c7a6" d="M14 30h12v17H14z"/><path fill="#9f7040" d="M14 31C9 18 12 7 20 2c8 5 11 16 6 29z"/><path fill="none" d="M18 8v20M22 10v18"/>',
 carve:'<path fill="#c99760" d="M15 47h11l1 98q-6 8-13 0z"/><path fill="#a3a59d" d="M18 49V29c-20-15-7-28 3-24 16 5 13 22-1 24M14 28h15"/>',
 stamp:'<path fill="#bc8d54" d="M15 32h10v98H15z"/><path fill="#d8b582" d="M8 10q12-12 24 0v24H8z"/><path fill="#ac7948" d="M11 3h18v10H11z"/>',
 erase:'<path fill="#c69966" d="M17 47h7v100h-7z"/><path fill="#e0c5a1" d="M8 10h24v40H8z"/><path fill="#c1a17b" d="M8 38h24v12H8z"/>',
 glaze:'<path fill="#c99a5c" d="M17 46h8l2 102q-7 6-13 0z"/><path fill="#e8d3a7" d="M9 23c0-27 25-27 25 0 0 17-25 24-25 0z"/>'
 };
 $('p-deco').appendChild($('dUndo'));$('dUndo').hidden=true;$('topUndo-deco').onclick=function(){if(top)undoBrush();else undoDeco();};$('wheelUndo').hidden=true;$('dToolTip').hidden=true;
 Array.from(dtools.querySelectorAll('[data-d]')).forEach(function(button){var name=button.textContent;button.classList.add('rackTool');button.innerHTML='<svg viewBox="0 0 40 154" aria-hidden="true">'+symbols[button.dataset.d]+'</svg><span>'+name+'</span>';});
 function glazeTool(id,label,icon,action){var b=document.createElement('button');b.id=id;b.type='button';b.className='rackTool';b.innerHTML='<svg viewBox="0 0 40 154" aria-hidden="true">'+icon+'</svg><span>'+label+'</span>';b.onclick=function(){action();rackSync();};$('rackGlaze').appendChild(b);return b;}
 glazeTool('rackGlazeBase','바탕 유약',symbols.glaze,function(){glazeBrush=false;$('glazeBrush').checked=false;refresh();});
 glazeTool('rackGlazeBrush','붓칠',symbols.brush,function(){$('glazeBrush').checked=true;glazeBrush=true;checks=false;refresh();});

 var toolName=document.createElement('output');toolName.id='rackToolName';toolName.setAttribute('aria-live','polite');toolName.setAttribute('role','tooltip');document.body.appendChild(toolName);
 function currentName(){return st.stage==='glaze'?(glazeBrush?'붓칠':'바탕 유약'):({brush:'붓',carve:'조각칼',stamp:'도장',erase:'지우개'}[dTool]||'도구통');}
 function showToolName(name,button){toolName.textContent=name;toolName.hidden=rack.hidden;var anchor=(button||rack).getBoundingClientRect(),size=toolName.getBoundingClientRect(),vw=window.innerWidth||390;toolName.style.left=Math.max(8,Math.min(vw-size.width-8,anchor.left+anchor.width/2-size.width/2))+'px';toolName.style.top=Math.max(8,anchor.top-size.height-12)+'px';}
 rack.querySelectorAll('.rackTool').forEach(function(button){var name=button.querySelector('span').textContent;button.setAttribute('aria-label',name);button.title=name;button.addEventListener('mouseenter',function(){showToolName(name,button);});button.addEventListener('focus',function(){showToolName(name,button);});button.addEventListener('mouseleave',function(){showToolName(currentName());});button.addEventListener('click',function(){showToolName(name,button);});});showToolName(currentName());
 $('glazeBrush').closest('label').hidden=true;$('glazeFree').remove();$('glazeChecks').remove();$('wheelUndo').textContent='되돌리기';
 $('glazePaintHint').textContent='도자기 뒤쪽 도구통에서 바탕 유약·붓칠을 직접 골라 주세요.';
 function rackSync(){if(toolName)showToolName(currentName());rack.hidden=st.stage!=='deco'&&st.stage!=='glaze';$('rackDeco').hidden=st.stage!=='deco';$('rackGlaze').hidden=st.stage!=='glaze';$('rackGlazeBase').setAttribute('aria-pressed',String(!glazeBrush));$('rackGlazeBrush').setAttribute('aria-pressed',String(glazeBrush&&!checks));var sh=$('sheet').getBoundingClientRect();rack.style.bottom='auto';toolName.hidden=rack.hidden;}
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
 window.TodakWheel={forms:forms,top:function(){return top;},layout:topLayout,layer:topLayer,refresh:refresh,surface:function(){return topSurface(topLayout());}};
})();
