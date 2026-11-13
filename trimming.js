/* Optional leather-hard trimming. Removes real profile material; never moves the cavity. */
(function(){
 var dryingTimer=0,shavings=[],drying=false;
 TOOLS.trim={f:.30,sm:0};
 TIPS.trim='<b>좁은 날을 안쪽으로 넣어 흙을 덜어내요.</b> 넣은 깊이까지만 깎이고, 위아래로 움직이면 홈·기둥·굽을 만들어요. 바깥으로 빼면 멈추며 흙이 늘어나지 않아요.';
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
  syncDepth();TOOLS.trim.f=.16+Number($('hsize').value)/100*.32;handControlUI();var active=tool==='trim';controls.hidden=!active;
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
    ptr.w0=st.radii.slice();ptr.trimLastRow=startT*(N-1);ptr.trimRemoved=0;ptr.trimLastStartX=ptr.sx;ptr.trimLastStartY=ptr.sy;ptr.trimInvalid=Math.abs(startD-rAt(startT))>Math.max(.65,15/SV);ptr.trimSide=ptr.sx<CX?-1:1;
  }
  if(ptr.trimInvalid)return 0;
  var toolRadius=(ptr.x-CX)*ptr.trimSide/SV,surface=rAt(clamp(t,0,1));if(toolRadius>surface+.65||toolRadius<-.1)return 0;
  var blade=Math.max(.10,toolRadius),width=Math.max(TOOLS.trim.f,rowH*.85),speed=1-Math.exp(-Math.min(dt,80)/40),moved=0,blocked=false,removed=0,row=clamp(t,0,1)*(N-1),lastRow=ptr.trimLastRow==null?row:ptr.trimLastRow;
  for(var j=1;j<N;j++){
    var y=j*rowH,nearest=clamp(j,Math.min(row,lastRow),Math.max(row,lastRow)),dist=Math.abs(j-nearest)*rowH;if(dist>width)continue;
    // A narrow, nearly flat blade leaves a defined groove, not a broad finger-shaped dent.
    var weight=Math.pow(Math.max(0,1-dist/width),.35),before=st.radii[j],minimum=.10;
    if(y>=st.floor&&st.height-st.floor>.05){var a=Math.max(0,j-1),b=Math.min(N-1,j+1),slope=(st.radii[b]-st.radii[a])/Math.max(rowH,(b-a)*rowH);minimum=Math.max(minimum,st.inner[j]+.08*Math.sqrt(1+slope*slope));}
    var target=ptr.w0[j]+(blade-ptr.w0[j])*weight,next=Math.min(before,Math.max(minimum,before+(target-before)*speed)),cut=before-next;
    if(cut>.000001){st.radii[j]=next;moved+=cut;removed+=Math.PI*(before*before-next*next)*rowH;grooves[j]=Math.max(0,grooves[j]-cut);ptr.contact=true;ptr.maxD=Math.max(ptr.maxD,cut);}
    else if(target<minimum-.01&&weight>.5)blocked=true;
  }
  ptr.trimLastRow=row;ptr.trimRemoved=(ptr.trimRemoved||0)+removed;
  if(moved>.0001){
   $('trimStatus').textContent='흙을 덜어내고 있어요 · 이번 손길 '+ptr.trimRemoved.toFixed(1)+'cm³ · 바깥으로 빼면 멈춰요.';
   if(shavings.length<48){for(var curl=0;curl<2;curl++)shavings.push({x:CX+ptr.trimSide*surface*SV,y:ptr.y+curl*4,vx:ptr.trimSide*(.8+Math.random()*1.2),vy:.3+Math.random(),life:1,turn:Math.random()*6.28});}
  }else if(!blocked&&toolRadius>=surface-.015){$('trimStatus').textContent='날을 안쪽으로 조금 넣으면 그 깊이까지만 깎여요. 바깥으로 빼면 멈춰요.';}
  if(blocked&&!ptr.trimWarned){$('trimStatus').textContent='안쪽 공간에 닿았어요. 속 깊이를 줄여 기둥을 채우면 더 깎을 수 있어요.';ptr.trimWarned=true;}
  if(moved>.0001)window.dispatchEvent(new CustomEvent('todak-trimmed'));
  return moved;
 }
 var oldTouch=touchClay;touchClay=function(dt){if(tool!=='trim')return oldTouch(dt);ptr.trimBefore=st.radii.slice();return trim(dt);};
 var oldSculpt=sculptStep;sculptStep=function(dt,ts){oldSculpt(dt,ts);if(tool==='trim'){wet=0;wob=0;}for(var i=shavings.length-1;i>=0;i--){var p=shavings[i];p.x+=p.vx*dt*.07;p.y+=p.vy*dt*.07;p.vy+=dt*.005;p.life-=dt/1500;if(p.life<=0||p.y>BASE+40)shavings.splice(i,1);}};
 var oldStress=stressStep,oldThin=freeThinStep;stressStep=function(dt){if(tool==='trim'&&st.trimReady){stressNow=stressT=0;return;}oldStress(dt);};freeThinStep=function(dt){if(tool==='trim'&&st.trimReady){stressNow=stressT=0;return;}oldThin(dt);};
 var oldDraw=draw;draw=function(){oldDraw();if(st.stage!=='throw'||tool!=='trim')return;ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.lineCap='round';
  shavings.forEach(function(p){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.turn);ctx.globalAlpha=p.life;ctx.strokeStyle='#d0b89b';ctx.lineWidth=3.2;ctx.beginPath();ctx.moveTo(-9,1);ctx.bezierCurveTo(-1,-7,8,-6,6,0);ctx.bezierCurveTo(4,5,-3,3,0,-1);ctx.stroke();ctx.restore();});
  if(st.trimReady&&ptr.down&&!ptr.trimInvalid){
   var side=ptr.trimSide||1,x=ptr.x,y=ptr.y;
   if(ptr.contact){ctx.save();ctx.setLineDash([5,5]);ctx.beginPath();ctx.ellipse(CX,y,Math.max(1,Math.abs(x-CX)),Math.max(1,Math.abs(x-CX)*TILT),0,0,TWO);ctx.strokeStyle='rgba(244,214,162,.65)';ctx.lineWidth=1.2;ctx.stroke();ctx.restore();}
   ctx.strokeStyle='#977047';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(x+side*92,y-28);ctx.lineTo(x+side*42,y-9);ctx.stroke();
   ctx.strokeStyle='#cead7f';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x+side*90,y-30);ctx.lineTo(x+side*43,y-12);ctx.stroke();
   ctx.strokeStyle='#666b65';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x+side*43,y-10);ctx.lineTo(x+side*8,y);ctx.stroke();
   ctx.strokeStyle='#eee9da';ctx.lineWidth=2.6;ctx.beginPath();ctx.ellipse(x,y,8,Math.max(3,TOOLS.trim.f*SV),-side*.23,0,TWO);ctx.stroke();
  }
  ctx.restore();};
 cv.addEventListener('pointerdown',function(){ptr.trimWarned=false;ptr.trimLastStartX=null;ptr.trimLastStartY=null;});
 // Preserve optional dry state on reload without changing any existing shape records.
 window.TodakTrimming={dry:dry,ready:function(){return !!st.trimReady;},drying:function(){return drying;}};
 sync();
})();
