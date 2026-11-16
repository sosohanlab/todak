/* Runs inside the existing tutorial: action validation and saved progress remain authoritative. */
(function(){
 'use strict';
 var stages=['throw','deco','glaze','fire','done'],names=['빚기','꾸미기','유약','굽기','완성'];
 var ns='http://www.w3.org/2000/svg',rendering=false,lastCanvasStep='',focusKind='',focusTarget=null,focusBox=null,geometryKey='',lastGeometry=null;
 var top=coach.querySelector('.tutorialTop'),badge=document.createElement('span');badge.className='tutorialBadge';badge.textContent='처음 빚기';top.prepend(badge);
 var stageList=document.createElement('ol');stageList.id='tutorialStages';stageList.setAttribute('aria-label','튜토리얼 진행');
 stages.forEach(function(stage,i){var li=document.createElement('li');li.dataset.stage=stage;li.innerHTML='<span class="tutorialMeter"><i></i></span><span>'+names[i]+'</span>';stageList.appendChild(li);});
 var footer=document.createElement('div');footer.className='tutorialCurrent';footer.append($('tutorialTitle'),$('tutorialStatus'));
 var oldText=$('tutorialText');coach.append(stageList,footer);oldText.remove();
 $('tutorialStatus').removeAttribute('role');$('tutorialStatus').setAttribute('aria-hidden','true');
 var action=document.createElement('aside');action.id='tutorialAction';action.hidden=true;action.setAttribute('aria-live','polite');action.setAttribute('aria-atomic','true');action.innerHTML='<b id="tutorialActionTitle"></b>';action.appendChild(oldText);document.body.appendChild(action);
 var veil=document.createElementNS(ns,'svg');veil.id='tutorialVeil';veil.setAttribute('aria-hidden','true');veil.setAttribute('focusable','false');veil.style.display='none';
 veil.innerHTML='<defs><mask id="tutorialFocusMask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" style="mask-type:luminance"><rect id="tutorialMaskBase" fill="white"/><path id="tutorialVesselCutout" fill="black"/><rect id="tutorialControlCutout" fill="black" rx="10"/></mask></defs><rect id="tutorialDim" width="100%" height="100%" mask="url(#tutorialFocusMask)"/><path id="tutorialVesselOutline" fill="none"/><rect id="tutorialControlOutline" fill="none" rx="10"/>';
 document.body.appendChild(veil);var cut=veil.querySelector('#tutorialVesselCutout'),outline=veil.querySelector('#tutorialVesselOutline'),control=veil.querySelector('#tutorialControlCutout'),controlOutline=veil.querySelector('#tutorialControlOutline');
 document.body.classList.add('tutorialPresentationReady');
 function setText(node,text){if(node.textContent!==text)node.textContent=text;}
 function guideTop(){var header=document.querySelector('.ui-header'),info=$('ui-work-info'),views=$('ui-work-views');return Math.max(header?header.getBoundingClientRect().bottom:0,info&&info.getClientRects().length?info.getBoundingClientRect().bottom:0,views&&views.getClientRects().length?views.getBoundingClientRect().bottom:0)+10;}
 function rect(left,top,width,height){return{left:left,top:top,right:left+width,bottom:top+height,width:width,height:height};}
 function intersection(a,b){return Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));}
 function limitedRect(target,pad){var r=target.getBoundingClientRect(),owner=target.closest('#sheetBody,.drawerIn'),clip=owner&&owner.getBoundingClientRect(),left=Math.max(4,r.left-pad,clip?clip.left:4),right=Math.min(innerWidth-4,r.right+pad,clip?clip.right:innerWidth-4),top=Math.max(4,r.top-pad,clip?clip.top:4),bottom=Math.min(innerHeight-4,r.bottom+pad,clip?clip.bottom:innerHeight-4);return rect(left,top,Math.max(0,right-left),Math.max(0,bottom-top));}
 function circleGeometry(l,box){var sx=box.width/Math.max(1,W),sy=box.height/Math.max(1,HC),x=box.left+l.x*sx,y=box.top+l.y*sy,rx=l.r*sx,ry=l.r*sy;return{path:'M'+(x-rx)+' '+y+'a'+rx+' '+ry+' 0 1 0 '+(rx*2)+' 0a'+rx+' '+ry+' 0 1 0 '+(-rx*2)+' 0Z',box:rect(x-rx,y-ry,rx*2,ry*2)};}
 function vesselGeometry(){
  var box=cv.getBoundingClientRect();if(box.width<1||box.height<1)return null;
  var wheel=window.TodakWheel;if(wheel&&(wheel.top()||wheel.bottom())&&['deco','glaze'].indexOf(st.stage)>=0)return circleGeometry(wheel.bottom()?wheel.bottomLayout():wheel.layout(),box);
  var px=CX,base=BASE,scale=SV;if(st.stage==='fire'&&typeof pieceView==='function'){var pv=pieceView();px+=pv.x;base+=pv.y;scale*=pv.s;}
  var sway=st.stage==='throw'&&!reduce?wob*scale*Math.sin(spin*1.4):0;
  var key=[st.stage,st.height,scale,px,base,sway,box.left,box.top,box.width,box.height,st.radii.join(',')].join('|');if(key===geometryKey&&lastGeometry)return lastGeometry;
  var sx=box.width/Math.max(1,W),sy=box.height/Math.max(1,HC),discs=[],low=Infinity,high=-Infinity;
  // Match the ellipses used to draw the clay, rather than the canvas or a bounding box.
  for(var i=0;i<=80;i++){var t=i/80,r=Math.max(.01,rAt(t)*scale),cy=base-st.height*scale*t,ry=Math.max(.01,r*TILT);discs.push({x:px+sway*t,y:cy,r:r,ry:ry});low=Math.min(low,cy-ry);high=Math.max(high,cy+ry);}
  var left=[],right=[],rows=Math.max(64,Math.min(220,Math.ceil((high-low)*sy/2))),minX=Infinity,maxX=-Infinity;
  for(var row=0;row<=rows;row++){var y=low+(high-low)*(row+.001)/(rows+.002),lo=Infinity,hi=-Infinity;for(var j=0;j<discs.length;j++){var d=discs[j],v=(y-d.y)/d.ry;if(Math.abs(v)>1)continue;var dx=d.r*Math.sqrt(Math.max(0,1-v*v));lo=Math.min(lo,d.x-dx);hi=Math.max(hi,d.x+dx);}if(!isFinite(lo))continue;var yy=box.top+y*sy,lx=box.left+lo*sx,rx=box.left+hi*sx;left.push([lx,yy]);right.push([rx,yy]);minX=Math.min(minX,lx);maxX=Math.max(maxX,rx);}
  var points=left.concat(right.reverse());if(points.length<4)return null;var path=points.map(function(p,i){return(i?'L':'M')+p[0].toFixed(2)+' '+p[1].toFixed(2);}).join('')+'Z';
  geometryKey=key;lastGeometry={path:path,box:rect(minX,box.top+low*sy,maxX-minX,(high-low)*sy)};return lastGeometry;
 }
 function sizeVeil(){veil.setAttribute('viewBox','0 0 '+innerWidth+' '+innerHeight);veil.setAttribute('width',innerWidth);veil.setAttribute('height',innerHeight);var base=veil.querySelector('#tutorialMaskBase');base.setAttribute('width',innerWidth);base.setAttribute('height',innerHeight);}
 function updateFocus(){
  if(focusKind==='vessel'){var geo=vesselGeometry();if(!geo)return;focusBox=geo.box;cut.setAttribute('d',geo.path);outline.setAttribute('d',geo.path);control.setAttribute('width','0');controlOutline.setAttribute('width','0');veil.dataset.focus='vessel';}
  else if(focusKind==='control'&&focusTarget){focusBox=limitedRect(focusTarget,4);cut.setAttribute('d','');outline.setAttribute('d','');[control,controlOutline].forEach(function(node){node.setAttribute('x',focusBox.left);node.setAttribute('y',focusBox.top);node.setAttribute('width',focusBox.width);node.setAttribute('height',focusBox.height);});veil.dataset.focus='control';}
  else{cut.setAttribute('d','');outline.setAttribute('d','');control.setAttribute('width','0');controlOutline.setAttribute('width','0');veil.dataset.focus='none';}
 }
 var copy={
  shape:['옆면을 좌우로 끌어 보세요','끌면 굴곡이 생겨요.','↔ 끌기'],inside:['오른쪽 안쪽 벽을 끌어 보세요','벽 두께를 조절할 수 있어요.','↔ 끌기'],trim:['바깥 벽을 조금씩 깎아 보세요','도구를 안쪽으로 천천히 밀어요.','↔ 끌기'],smooth:['겉면을 가볍게 문질러 보세요','작은 굴곡과 물레 자국을 정리해요.','문지르기'],smoothInner:['오른쪽 안쪽 벽을 문질러 보세요','안쪽 표면을 매끈하게 다듬어요.','문지르기'],
  brush:['작품 위에 선을 그려 보세요','원하는 무늬를 자유롭게 그려요.','그리기'],brushRing:['작품 위에 띠를 그려 보세요','같은 높이로 한 바퀴 이어져요.','↔ 끌기'],stamp:['도자기를 눌러 도장을 찍어 보세요','고른 모양이 작품에 찍혀요.','누르기'],carve:['작품 위에 무늬를 새겨 보세요','문지른 자리에 홈이 생겨요.','↔ 끌기'],raised:['도자기에 선을 그려 보세요','흙 위로 솟은 무늬가 생겨요.','그리기'],carveRing:['작품 위를 끌어 띠를 새겨 보세요','둘레를 따라 홈이 이어져요.','↔ 끌기'],glazePaint:['원하는 부분에 유약을 칠해 보세요','칠한 뒤 손을 떼면 이어집니다.','그리기'],load:['작품을 눌러 가마에 넣어 주세요','가마 문을 닫으면 굽기가 시작돼요.','누르기'],
  smoothSection:['단면을 눌러 보세요','안쪽 벽의 두께를 볼 수 있어요.'],solid:['전체를 눌러 보세요','다듬은 전체 모양을 확인해요.'],stampChoice:['도장을 골라 보세요','꽃·잎 등 원하는 모양을 찍을 수 있어요.'],rotate:['화살표를 눌러 돌려 보세요','반대편도 꾸밀 수 있어요.'],glazeBase:['바탕 유약을 선택해 주세요','작품 전체에 입힐 유약을 골라요.'],color:['원하는 유약 색을 골라 보세요','직접 색상과 코드를 고를 수도 있어요.'],finish:['반짝임을 골라 보세요','유광과 무광의 느낌을 비교해요.'],glazeBrush:['붓칠을 선택해 주세요','원하는 부분에 유약을 칠할 수 있어요.'],glazeOpacity:['불투명도를 움직여 보세요','낮출수록 바탕이 비쳐 보여요.'],glazeBaseReturn:['바탕 유약으로 돌아가 주세요','칠한 무늬는 그대로 유지돼요.'],dip:['담그는 깊이를 움직여 보세요','입구만 또는 절반까지 덧입혀요.'],effect:['표면 무늬를 골라 보세요','원하는 질감을 선택하면 이어져요.'],heat:['불 세기를 골라 보세요','선택한 불로 작품을 구워요.'],open:['가마 문을 열어 주세요','식은 작품을 꺼내 볼 수 있어요.'],photo:['완성 사진을 확인해 보세요','스위치를 켜면 360도로 감상할 수 있어요.'],inspect360:['작품을 직접 돌려 보세요','끌거나 회전 화살표를 눌러요.'],size:['사진 속 작품 크기를 바꿔 보세요','슬라이더나 − / ＋ 버튼을 사용해요.'],background:['완성 사진 배경을 골라 보세요','작품에 어울리는 배경을 찾아요.'],title:['작품 이름을 적어 주세요','한글 입력을 마치면 이어집니다.'],purpose:['어디에 쓸 작품인가요?','찻잔·반지 보관함처럼 적어 보세요.'],save:['작품 카드를 저장해 보세요','이미지로 저장하거나 공유할 수 있어요.'],closeCard:['닫기를 눌러 작품으로 돌아가세요','작품은 내 진열장에도 남아 있어요.'],search:['내 작품 이미지로 찾기를 눌러 보세요','이때 작품 사진이 검색 서비스로 전송돼요.'],closeSearch:['닫기를 눌러 작품으로 돌아가세요','검색이 연결되지 않아도 이어갈 수 있어요.'],home:['홈으로 돌아가 볼까요?','첫 빚기를 마치면 다른 메뉴도 열려요.']
 };
 function describe(target,clip){
  var step=current(),info=(copy[step.id]||[step.title.replace(/^\d+\.\s*/,''),'표시된 곳을 직접 조작해 보세요.']).slice();
  if(target===$('sheetToggle'))return['도구창을 열어 주세요','다음 도구를 여기서 골라요.','누르기'];
  if(clip)return[clip.direction==='up'?'도구창을 위로 스크롤해 주세요':'도구창을 아래로 스크롤해 주세요','표시된 도구나 입력칸을 찾아요.',clip.direction==='up'?'↑ 스크롤':'↓ 스크롤'];
  if(done){if(lastInStage()&&['done','fire'].indexOf(step.stage)<0)return[$('nextBtn').textContent.replace(/\s*→/, '')+'를 눌러 주세요','지금 만든 작품을 다음 단계로 이어가요.','누르기'];return['잘했어요!','다음 안내로 이어집니다.',''];}
  if(step.id==='open'&&fstep!=='ready')return['가마가 식는 중이에요','100℃ 이하로 식으면 문을 열 수 있어요.',''];
  if(target!==cv){
   if(gestureReady())return info;
   var tools={shape:['모양 잡기를 골라 주세요','옆면을 밀고 당겨 모양을 바꿔요.'],inside:['속·두께를 골라 주세요','다음에는 오른쪽 안쪽 벽을 다듬어요.'],trim:['깎기를 골라 주세요','흙이 조금 마르면 깎을 수 있어요.'],smooth:['매끈하게를 골라 주세요','겉면의 작은 굴곡을 정리해요.'],smoothInner:['안쪽벽을 골라 주세요','오른쪽 단면의 안쪽을 다듬어요.'],brush:['붓을 골라 주세요','작품 위에 자유롭게 그릴 수 있어요.'],stamp:['도장을 골라 주세요','작품을 눌러 무늬를 찍어요.'],carve:['조각칼을 골라 주세요','작품에 홈을 새길 수 있어요.']};
   if(tools[step.id])info=tools[step.id].concat('누르기');
   if(step.id==='stampChoice')info=dTool==='stamp'?['찍을 모양을 골라 주세요','꽃·잎 등 원하는 도장을 골라요.','누르기']:['도장을 눌러 보세요','모양을 고른 뒤 작품에 찍을 수 있어요.','누르기'];
  }
  return info;
 }
 function updateProgress(){
  var step=current(),number=index+1;setText($('tutorialCount'),number+' / '+steps.length);setText($('tutorialTitle'),step.title.replace(/^\d+\.\s*/,''));setText($('tutorialStatus'),done?'완료':step.id==='open'&&fstep!=='ready'?'기다리는 중':'진행 중');
  coach.dataset.stage=step.stage;coach.dataset.done=String(done);stageList.querySelectorAll('li').forEach(function(li){var list=steps.filter(function(s){return s.stage===li.dataset.stage;}),finished=steps.slice(0,index+(done?1:0)).filter(function(s){return s.stage===li.dataset.stage;}).length;li.querySelector('i').style.width=(Math.min(1,finished/list.length)*100)+'%';li.classList.toggle('is-current',step.stage===li.dataset.stage);li.classList.toggle('is-complete',finished>=list.length);if(step.stage===li.dataset.stage)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});
 }
 function positionProgress(){var mobile=innerWidth<600,short=innerHeight<560,width=mobile?Math.min(180,Math.floor((innerWidth-36)*.48)):short?180:220;coach.style.cssText='';coach.classList.remove('tutorialDocked','tutorialModal');if(coach.parentNode!==document.body)document.body.appendChild(coach);coach.style.width=width+'px';coach.style.left='12px';coach.style.top=Math.min(guideTop(),Math.max(8,innerHeight-110))+'px';return coach.getBoundingClientRect();}
 function positionAction(anchor,progress,canvasTarget){
  var mobile=innerWidth<600,width=mobile?Math.min(230,innerWidth-24):226;action.dataset.side='none';
  if(mobile&&canvasTarget){var x=progress.right+10;width=Math.max(128,innerWidth-12-x);action.style.width=width+'px';action.style.left=x+'px';action.style.top=progress.top+'px';action.dataset.side='bottom';action.style.setProperty('--tutorial-arrow','24px');return;}
  action.style.width=width+'px';var h=action.getBoundingClientRect().height||76,gap=16,header=document.querySelector('.ui-header'),headerBox=header&&header.getBoundingClientRect(),infoBox=$('ui-work-info').getBoundingClientRect();
  var candidates=[{left:anchor.left-gap-width,top:anchor.top+(anchor.height-h)/2,side:'right'},{left:anchor.right+gap,top:anchor.top+(anchor.height-h)/2,side:'left'},{left:anchor.left+(anchor.width-width)/2,top:anchor.top-gap-h,side:'bottom'},{left:anchor.left+(anchor.width-width)/2,top:anchor.bottom+gap,side:'top'}];
  if(mobile)candidates.push({left:12,top:progress.bottom+8,side:'bottom'});
  var best=null,bestScore=Infinity;candidates.forEach(function(c){var l=clamp(c.left,12,Math.max(12,innerWidth-width-12)),t=clamp(c.top,8,Math.max(8,innerHeight-h-8)),r=rect(l,t,width,h),score=intersection(r,anchor)*20+intersection(r,progress)*30+intersection(r,infoBox)*8+(headerBox?intersection(r,headerBox)*8:0)+Math.abs(l-c.left)*10+Math.abs(t-c.top)*5;if(score<bestScore){bestScore=score;best={left:l,top:t,side:c.side};}});
  action.style.left=best.left+'px';action.style.top=best.top+'px';action.dataset.side=best.side;action.style.setProperty('--tutorial-arrow',clamp(best.side==='left'||best.side==='right'?anchor.top+anchor.height/2-best.top:anchor.left+anchor.width/2-best.left,18,(best.side==='left'||best.side==='right'?h:width)-18)+'px');
 }
 function positionHand(target,clip,info){
  if(done||engaged||ptr.down||target===$('fireTitle')){hand.hidden=true;return;}
  var r=target.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,kind='tap';
  if(clip){r=clip.owner.getBoundingClientRect();x=r.right-38;y=(Math.max(r.top,0)+Math.min(r.bottom,innerHeight))/2;kind=clip.direction==='up'?'scrollUp':'scrollDown';hand.setAttribute('data-scroll-label',clip.direction==='up'?'↑ 위로 스크롤':'↓ 아래로 스크롤');}
  else if(target===cv){var t=.55,radius=['inside','smoothInner'].indexOf(current().id)>=0?innerAt(t):rAt(t)*.9,px=CX+radius*SV,py=BASE-st.height*t*SV,wheel=window.TodakWheel;
   if(['brush','brushRing','stamp','carve','raised','carveRing','glazePaint'].indexOf(current().id)>=0)px=CX+rAt(t)*SV*.15;
   if(wheel&&(wheel.top()||wheel.bottom())&&st.stage!=='throw'){var l=wheel.bottom()?wheel.bottomLayout():wheel.layout();px=l.x+l.r*.2;py=l.y+l.r*.15;}
   if(current().id==='load'){var pv=pieceView();px=CX+pv.x;py=BASE+pv.y-st.height*SV*pv.s*.5;}
   x=r.left+px*r.width/Math.max(1,W);y=r.top+py*r.height/Math.max(1,HC);kind=['stamp','load'].indexOf(current().id)>=0?'tap':['smooth','smoothInner'].indexOf(current().id)>=0?'rub':['brush','glazePaint','raised'].indexOf(current().id)>=0?'circle':current().id==='shape'?'shape':'drag';
  }
  hand.hidden=false;hand.dataset.motion=kind;hand.dataset.action=info[2]||'누르기';hand.style.left=clamp(x-8,8,innerWidth-48)+'px';hand.style.top=clamp(y-8,8,innerHeight-84)+'px';
 }
 function hidePresentation(){veil.style.display='none';action.hidden=true;focusKind='';focusTarget=null;focusBox=null;document.body.classList.remove('tutorial-guided');}
 positionHints=function(){};
 function present(){
  if(rendering)return;if(!active||!current()||!$('home').hidden){hidePresentation();return;}rendering=true;
  try{
   var target=intendedTarget();if(!target)return;if(engaged&&gestureReady())target=cv;
   if(target.closest('#sheet')&&!$('sheet').classList.contains('open')&&target!==$('sheetToggle'))target=$('sheetToggle');
   var clip=clippedTarget(target),canvasTarget=target===cv,step=current();
   // Free the mobile workspace once per hands-on step, before the gesture begins.
   if(canvasTarget&&innerWidth<600&&lastCanvasStep!==step.id&&!ptr.down){lastCanvasStep=step.id;var closingStep=step.id;setTimeout(function(){if(active&&current()&&current().id===closingStep&&gestureReady()&&!ptr.down){setSheet(false);resize();V=fitV();SV=S0*V*Z;dirty=true;route();}},0);}
   coach.hidden=false;coach.setAttribute('aria-label','처음 빚기 진행');document.body.classList.add('tutorial-guided');var header=document.querySelector('.ui-header');if(header)document.body.style.setProperty('--tutorial-header-bottom',(header.getBoundingClientRect().bottom-stageEl.getBoundingClientRect().top)+'px');updateProgress();var progress=positionProgress(),info=describe(target,clip);
   setText($('tutorialActionTitle'),info[0]);setText(oldText,info[1]);action.hidden=engaged||ptr.down;
   focusTarget=clip?clip.owner:target;focusKind=canvasTarget?'vessel':target===$('fireTitle')?'none':'control';sizeVeil();updateFocus();veil.style.display=focusKind==='none'?'none':'block';
   var anchor=focusBox||limitedRect(target,0);if(!action.hidden)positionAction(anchor,progress,canvasTarget);positionHand(target,clip,info);
  }finally{rendering=false;}
 }
 var originalRoute=route;route=function(){if(rendering)return;originalRoute();present();};
 var originalTarget=intendedTarget;intendedTarget=function(){if(current()&&current().id==='home'&&!$('menuBtn').getClientRects().length)return $('homeBtn');return originalTarget();};
 $('homeBtn').addEventListener('click',function(){if(active&&current()&&current().id==='home')mark('home');});
 var originalHide=hideGuide;hideGuide=function(){originalHide();hidePresentation();};
 var originalFinish=finish;finish=function(skipped){hidePresentation();return originalFinish(skipped);};
 var originalDraw=draw;draw=function(){var result=originalDraw.apply(this,arguments);if(active&&focusKind==='vessel'&&$('home').hidden)updateFocus();return result;};
 var originalFit=fitV;fitV=function(){var value=originalFit();if(!active||!$('home').hidden||innerWidth>=600&&innerHeight>=560||!current()||st.stage==='done'||st.stage==='fire')return value;var box=cv.getBoundingClientRect();if(!box.width)return value;var unit=W/box.width,safe=(guideTop()+100-box.top)*unit,radius=Math.max.apply(null,st.radii),room=Math.max(40,BASE0-safe);return Math.max(.08,Math.min(value,room/Math.max(1,(st.height+radius*TILT)*S0)));};
 window.TodakTutorialPresentation={state:function(){return{visible:veil.style.display!=='none',focus:focusKind,target:focusTarget?focusTarget.id||focusTarget.dataset.t||focusTarget.dataset.d:null,path:cut.getAttribute('d'),bounds:focusBox,step:current()?current().id:null};}};
})();
