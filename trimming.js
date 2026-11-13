/* Optional leather-hard trimming. Removes real profile material; never moves the cavity. */
(function(){
 var dryingTimer=0,shavings=[],drying=false;
 TOOLS.trim={f:.62,sm:0};
 TIPS.trim='<b>겉면에 도구를 대고 안쪽으로 조금 밀거나, 위아래로 움직여 깎아요.</b> 가만히 대면 그 높이가 한 바퀴씩 깎여요. 안쪽 공간과 바닥 높이는 유지돼요.';
 var toolButton=document.createElement('button');toolButton.type='button';toolButton.className='chip';toolButton.dataset.t='trim';toolButton.setAttribute('aria-pressed','false');toolButton.textContent='깎아 만들기';$('tools').insertBefore(toolButton,document.querySelector('#tools [data-t="sponge"]'));
 var quickButton=document.createElement('button');quickButton.type='button';quickButton.dataset.quick='trim';quickButton.setAttribute('aria-pressed','false');quickButton.textContent='3 깎기';document.querySelector('.quick-tools').insertBefore(quickButton,document.querySelector('[data-quick="sponge"]'));quickButton.onclick=function(){toolButton.click();};
 document.querySelector('[data-quick="sponge"]').textContent='4 매끈하게';
 var controls=document.createElement('div');controls.id='trimControls';controls.className='trim-controls';controls.hidden=true;controls.innerHTML='<strong id="trimStatus" role="status" aria-live="polite"></strong><p>젖은 흙을 잠깐 말린 뒤, 겉면·줄기·굽을 깎아 원하는 모양을 만들어요. 다른 도구를 고르면 다시 손으로 빚을 수 있어요.</p><button type="button" class="ghost" id="trimDry">살짝 말리고 깎기</button>';$('toolTip').after(controls);
 var depth=document.createElement('div');depth.id='cavityDepthControls';depth.className='trim-controls';depth.hidden=true;depth.innerHTML='<label for="cavityDepth"><b>속 깊이</b> <output id="cavityDepthValue"></output></label><input id="cavityDepth" type="range" min="0" max="12" step="0.1"><p>깊이를 줄이면 아래부터 흙이 채워져요. 와인잔은 윗잔만 비우고 기둥과 받침은 채워 두세요. 바깥 모양은 바뀌지 않아요.</p>';$('toolTip').after(depth);
 var depthGesture=false;
 $('cavityDepth').addEventListener('pointerdown',function(){pushHist();depthGesture=true;});
 $('cavityDepth').addEventListener('keydown',function(e){if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(e.key)&&!e.repeat){pushHist();depthGesture=true;}});
 $('cavityDepth').addEventListener('input',function(){if(!depthGesture){pushHist();depthGesture=true;}var wanted=clamp(Number(this.value),0,Math.max(0,st.height-.1));st.floor=st.height-wanted;markPreset(null);ptr.w0=null;dirty=true;updateReadout();syncDepth();});
 ['change','pointerup','pointercancel','keyup'].forEach(function(event){$('cavityDepth').addEventListener(event,function(){depthGesture=false;});});
 function syncDepth(){depth.hidden=tool!=='thick';$('cavityDepth').max=Math.max(0,st.height-.1).toFixed(1);$('cavityDepth').value=Math.max(0,st.height-st.floor).toFixed(1);$('cavityDepthValue').textContent=Math.max(0,st.height-st.floor).toFixed(1)+'cm · 아래 '+st.floor.toFixed(1)+'cm는 채운 흙';}
 var previousReadout=updateReadout;updateReadout=function(){previousReadout();syncDepth();};
 function sync(){
  syncDepth();var active=tool==='trim';controls.hidden=!active;
  $('trimStatus').textContent=drying?'살짝 말리는 중…':st.trimReady?'깎을 준비가 됐어요 · 얇은 흙 띠가 떨어져요.':'깎기 전에 흙을 잠깐 말려요.';
  $('trimDry').hidden=!!st.trimReady;$('trimDry').disabled=drying;
  var h=document.querySelector('.quick-tool-hint');if(active&&h)h.textContent=drying?'살짝 말리는 중…':st.trimReady?'겉면에 도구를 대고 천천히 깎아요 · 안쪽과 바닥은 그대로예요.':'깎기를 다시 선택하면 흙을 살짝 말려요.';
 }
 function cancel(){clearTimeout(dryingTimer);dryingTimer=0;drying=false;}
 function dry(){if(st.trimReady||drying){sync();return;}drying=true;sync();dryingTimer=setTimeout(function(){drying=false;if(tool!=='trim'||st.stage!=='throw')return;st.trimReady=true;wet=0;wob=0;dirty=true;sync();},900);}
 $('trimDry').onclick=dry;
 var previousTips=showTips;showTips=function(){previousTips();sync();};
 $('tools').addEventListener('click',function(e){var b=e.target.closest('[data-t]');if(!b)return;if(b.dataset.t==='trim'){dry();}else{cancel();st.trimReady=false;shavings=[];dirty=true;sync();}});
 var previousFresh=freshClay;freshClay=function(){cancel();st.trimReady=false;shavings=[];previousFresh();sync();};
 var previousStage=setStage;setStage=function(s){if(s!=='throw')cancel();previousStage(s);sync();};
 function trim(dt){
  ptr.contact=false;ptr.maxD=0;if(!st.trimReady||drying)return 0;
  var t=(BASE-ptr.y)/(st.height*SV),rowH=st.height/(N-1);if(t<.005||t>1.01)return 0;
  if(ptr.trimLastStartX!==ptr.sx||ptr.trimLastStartY!==ptr.sy||ptr.w0==null){
    var startT=clamp((BASE-ptr.sy)/(st.height*SV),0,1),startD=Math.abs(ptr.sx-CX)/SV;
    ptr.w0=st.radii.slice();ptr.trimLastStartX=ptr.sx;ptr.trimLastStartY=ptr.sy;ptr.trimInvalid=Math.abs(startD-rAt(startT))>Math.max(.65,15/SV);ptr.trimSide=ptr.sx<CX?-1:1;
  }
  if(ptr.trimInvalid)return 0;
  var toolRadius=(ptr.x-CX)*ptr.trimSide/SV,surface=rAt(clamp(t,0,1));if(toolRadius>surface+.65||toolRadius<-.1)return 0;
  var penetration=clamp(surface-toolRadius,-.05,.9),rate=clamp(.035+penetration*.4,0,.42)*Math.min(dt,80)/42,moved=0,blocked=false;
  var baseline=[];if(st.height-st.floor>.05){for(var z=1;z<N;z++)baseline[z]=wallNormalThickness(st.inner[z],z*rowH);}
  for(var j=1;j<N;j++){
    var y=j*rowH,dist=y-t*st.height;if(Math.abs(dist)>TOOLS.trim.f*2.1)continue;
    var weight=Math.exp(-dist*dist/(TOOLS.trim.f*TOOLS.trim.f)),before=st.radii[j],minimum=st.target?.26:.10;
    if(y>=st.floor&&st.height-st.floor>.05){var a=Math.max(0,j-1),b=Math.min(N-1,j+1),slope=(st.radii[b]-st.radii[a])/Math.max(rowH,(b-a)*rowH);minimum=Math.max(minimum,st.inner[j]+(st.target?.52:.08)*Math.sqrt(1+slope*slope));}
    var next=Math.min(before,Math.max(minimum,before-rate*weight)),cut=before-next;
    if(cut>.000001){st.radii[j]=next;moved+=cut;grooves[j]=Math.max(0,grooves[j]-cut*.6);ptr.contact=true;ptr.maxD=Math.max(ptr.maxD,cut);}else if(weight>.5)blocked=true;
  }
  // A pass can expose a nearby sloped wall: validate true normal clearance, not just radial distance.
  if(st.target&&st.height-st.floor>.05){for(var jj=1;jj<N;jj++){if(jj*rowH>=st.floor&&st.inner[jj]>.01&&wallNormalThickness(st.inner[jj],jj*rowH)<Math.min(.505,baseline[jj])-.00001){st.radii=ptr.trimBefore.slice();moved=0;ptr.contact=false;blocked=true;break;}}}
  if(moved>.0001&&shavings.length<48){shavings.push({x:CX+ptr.trimSide*surface*SV,y:ptr.y,vx:ptr.trimSide*(.4+Math.random()*.6),vy:.5+Math.random(),life:1,turn:Math.random()*6.28});}
  if(blocked&&!ptr.trimWarned){$('trimStatus').textContent=st.target?'도전 모드에서는 벽 두께를 남겨 둬요.':'안쪽 공간에 닿았어요. 속·두께 조절에서 속 깊이를 줄이면 기둥을 채우고 더 깎을 수 있어요.';ptr.trimWarned=true;}
  if(moved>.0001)window.dispatchEvent(new CustomEvent('todak-trimmed'));
  return moved;
 }
 var oldTouch=touchClay;touchClay=function(dt){if(tool!=='trim')return oldTouch(dt);ptr.trimBefore=st.radii.slice();return trim(dt);};
 var oldSculpt=sculptStep;sculptStep=function(dt,ts){oldSculpt(dt,ts);if(tool==='trim'){wet=0;wob=0;}for(var i=shavings.length-1;i>=0;i--){var p=shavings[i];p.x+=p.vx*dt*.07;p.y+=p.vy*dt*.07;p.vy+=dt*.005;p.life-=dt/1500;if(p.life<=0||p.y>BASE+40)shavings.splice(i,1);}};
 var oldStress=stressStep,oldThin=freeThinStep;stressStep=function(dt){if(tool==='trim'&&st.trimReady){stressNow=stressT=0;return;}oldStress(dt);};freeThinStep=function(dt){if(tool==='trim'&&st.trimReady){stressNow=stressT=0;return;}oldThin(dt);};
 var oldDraw=draw;draw=function(){oldDraw();if(st.stage!=='throw'||tool!=='trim')return;ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.lineCap='round';
  shavings.forEach(function(p){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.turn);ctx.globalAlpha=p.life;ctx.strokeStyle='#d0b89b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-6,1);ctx.bezierCurveTo(-1,-7,8,-6,6,0);ctx.bezierCurveTo(4,5,-3,3,0,-1);ctx.stroke();ctx.restore();});
  if(st.trimReady&&ptr.down&&ptr.contact){var side=ptr.trimSide||1,x=CX+side*rAt(clamp((BASE-ptr.y)/(st.height*SV),0,1))*SV,y=ptr.y;ctx.strokeStyle='#5f6260';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x+side*44,y-14);ctx.lineTo(x+side*7,y+1);ctx.stroke();ctx.strokeStyle='#ecece5';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,7,4,-side*.3,0,TWO);ctx.stroke();}
  ctx.restore();};
 cv.addEventListener('pointerdown',function(){ptr.trimWarned=false;ptr.trimLastStartX=null;ptr.trimLastStartY=null;});
 // Preserve optional dry state on reload without changing any existing shape records.
 window.TodakTrimming={dry:dry,ready:function(){return !!st.trimReady;},drying:function(){return drying;}};
 sync();
})();
