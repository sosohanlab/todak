/* Runs inside the existing tutorial: action validation and saved progress remain authoritative. */
(function(){
 'use strict';
 var stages=['throw','deco','glaze','fire','done'],names=['빚기','꾸미기','유약','굽기','완성'];
 var ns='http://www.w3.org/2000/svg',rendering=false,lastLessonKey='',lastFittedKey='',scrolledKey='',focusKind='',focusTarget=null,focusBox=null,geometryKey='',lastGeometry=null,vesselPreview=false,previewBox=null,actionPlacementKey='',actionPlacementTarget=null;
 var top=coach.querySelector('.tutorialTop'),badge=document.createElement('span');badge.className='tutorialBadge';badge.textContent='컵 만들기';top.prepend(badge);
 var stageList=document.createElement('ol');stageList.id='tutorialStages';stageList.setAttribute('aria-label','튜토리얼 진행');
 stages.forEach(function(stage,i){var li=document.createElement('li');li.dataset.stage=stage;li.innerHTML='<span class="tutorialMeter"><i></i></span><span>'+names[i]+'</span>';stageList.appendChild(li);});
 var footer=document.createElement('div');footer.className='tutorialCurrent';var taskLabel=document.createElement('span');taskLabel.className='tutorialTaskLabel';taskLabel.textContent='지금 할 일';footer.append(taskLabel,$('tutorialTitle'),$('tutorialStatus'));
 var oldText=$('tutorialText');coach.append(stageList,footer);oldText.remove();
 // Selections continue without another click; practice stays until the player is ready.
 var heldPointers=new Set(),heldRangeKeys=new Set();
 document.addEventListener('pointerdown',function(e){heldPointers.add(e.pointerId);},true);
 ['pointerup','pointercancel'].forEach(function(type){document.addEventListener(type,function(e){heldPointers.delete(e.pointerId);},true);});
 document.addEventListener('keydown',function(e){if(e.target.matches('input[type=range]')&&/^(Arrow|Page|Home|End)/.test(e.key))heldRangeKeys.add(e.key);},true);
 document.addEventListener('keyup',function(e){heldRangeKeys.delete(e.key);},true);
 window.addEventListener('blur',function(){heldPointers.clear();heldRangeKeys.clear();});
 scheduleAdvance=function(){
  cancelAdvance();if(active&&current()&&current().id==='home'&&done){finish();return;}if(!ptr.down)engaged=false;route();
  if(!active||!current()||!done||tutorialGuidance.manual()||lastInStage()&&['throw','deco','glaze'].indexOf(current().stage)>=0)return;
  var at=index;function proceed(){advanceTimer=null;if(!active||index!==at||!done)return;if(!$('home').hidden){hideGuide();return;}if(ptr.down||heldPointers.size||heldRangeKeys.size){advanceTimer=setTimeout(proceed,80);return;}if(index===steps.length-1)finish();else advance();}
  advanceTimer=setTimeout(proceed,220);
 };
 ['pointerup','pointercancel'].forEach(function(type){document.addEventListener(type,function(){setTimeout(function(){if(active&&!ptr.down){engaged=false;route();}},0);},true);});
 $('tutorialStatus').removeAttribute('role');$('tutorialStatus').setAttribute('aria-hidden','true');
 var action=document.createElement('aside');action.id='tutorialAction';action.hidden=true;action.setAttribute('aria-live','polite');action.setAttribute('aria-atomic','true');action.innerHTML='<div id="tutorialActionContext" hidden><small id="tutorialActionProgress"></small></div><b id="tutorialActionTitle"></b>';action.append(oldText);coach.appendChild(action);
 var veil=document.createElementNS(ns,'svg');veil.id='tutorialVeil';veil.setAttribute('aria-hidden','true');veil.setAttribute('focusable','false');veil.style.display='none';
 veil.innerHTML='<defs><clipPath id="tutorialControlClip" clipPathUnits="userSpaceOnUse"><rect id="tutorialControlClipBox"/></clipPath><mask id="tutorialFocusMask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" style="mask-type:luminance"><rect id="tutorialMaskBase" fill="white"/><path id="tutorialVesselCutout" fill="black"/><path id="tutorialControlCutout" fill="black" clip-path="url(#tutorialControlClip)"/></mask></defs><rect id="tutorialDim" width="100%" height="100%" mask="url(#tutorialFocusMask)"/><path id="tutorialVesselOutline" fill="none"/><path id="tutorialControlOutline" fill="none" clip-path="url(#tutorialControlClip)"/>';
 veil.insertAdjacentHTML('afterbegin','<defs><marker id="tutorialArrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#243fa9"/></marker></defs>');var leader=document.createElementNS(ns,'path');leader.id='tutorialLeader';leader.setAttribute('fill','none');leader.setAttribute('marker-end','url(#tutorialArrowhead)');veil.appendChild(leader);
 document.body.appendChild(veil);var cut=veil.querySelector('#tutorialVesselCutout'),outline=veil.querySelector('#tutorialVesselOutline'),control=veil.querySelector('#tutorialControlCutout'),controlOutline=veil.querySelector('#tutorialControlOutline'),controlClip=veil.querySelector('#tutorialControlClipBox'),controlGeometry=null;
 document.body.classList.add('tutorialPresentationReady');
 function setText(node,text){if(node.textContent!==text)node.textContent=text;}
 function guideTop(){var header=document.querySelector('.ui-header'),info=$('ui-work-info'),views=$('ui-work-views');return Math.max(header?header.getBoundingClientRect().bottom:0,info&&info.getClientRects().length?info.getBoundingClientRect().bottom:0,views&&views.getClientRects().length?views.getBoundingClientRect().bottom:0)+10;}
 function rect(left,top,width,height){return{left:left,top:top,right:left+width,bottom:top+height,width:width,height:height};}
 function intersection(a,b){return Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));}
 function limitedRect(target,pad){var r=target.getBoundingClientRect(),owner=target.closest('#sheetBody,.drawerIn'),clip=owner&&owner.getBoundingClientRect(),left=Math.max(4,r.left-pad,clip?clip.left:4),right=Math.min(innerWidth-4,r.right+pad,clip?clip.right:innerWidth-4),top=Math.max(4,r.top-pad,clip?clip.top:4),bottom=Math.min(innerHeight-4,r.bottom+pad,clip?clip.bottom:innerHeight-4);return rect(left,top,Math.max(0,right-left),Math.max(0,bottom-top));}
 function roundedPath(box,radii,inset){
  var x=box.left+inset,y=box.top+inset,w=Math.max(0,box.width-inset*2),h=Math.max(0,box.height-inset*2),r=radii.map(function(p){return[Math.max(0,p[0]-inset),Math.max(0,p[1]-inset)];});
  var factor=Math.min(1,w/Math.max(1,r[0][0]+r[1][0]),w/Math.max(1,r[3][0]+r[2][0]),h/Math.max(1,r[0][1]+r[3][1]),h/Math.max(1,r[1][1]+r[2][1]));r=r.map(function(p){return[p[0]*factor,p[1]*factor];});
  function arc(p,toX,toY){return p[0]&&p[1]?'A'+p[0]+' '+p[1]+' 0 0 1 '+toX+' '+toY:'L'+toX+' '+toY;}
  return'M'+(x+r[0][0])+' '+y+'H'+(x+w-r[1][0])+arc(r[1],x+w,y+r[1][1])+'V'+(y+h-r[2][1])+arc(r[2],x+w-r[2][0],y+h)+'H'+(x+r[3][0])+arc(r[3],x,y+h-r[3][1])+'V'+(y+r[0][1])+arc(r[0],x+r[0][0],y)+'Z';
 }
 function controlShape(target){
  var box=target.getBoundingClientRect(),range=target.matches('input[type=range]'),label=range&&target.previousElementSibling;if(label&&label.matches('label,.rangehead,.label')){var b=label.getBoundingClientRect(),left=Math.min(box.left,b.left),top=Math.min(box.top,b.top),right=Math.max(box.right,b.right),bottom=Math.max(box.bottom,b.bottom);box=rect(left-6,top-5,right-left+12,bottom-top+10);}
  var style=getComputedStyle(target),sx=box.width/(target.offsetWidth||box.width||1),sy=box.height/(target.offsetHeight||box.height||1);
  var radii=['borderTopLeftRadius','borderTopRightRadius','borderBottomRightRadius','borderBottomLeftRadius'].map(function(key){var p=style[key].trim().split(/\s+/),a=p[0]||'0',b=p[1]||a;return[a.indexOf('%')>=0?parseFloat(a)*box.width/100:(parseFloat(a)||0)*sx,b.indexOf('%')>=0?parseFloat(b)*box.height/100:(parseFloat(b)||0)*sy];});
  var factor=Math.min(1,box.width/Math.max(1,radii[0][0]+radii[1][0]),box.width/Math.max(1,radii[3][0]+radii[2][0]),box.height/Math.max(1,radii[0][1]+radii[3][1]),box.height/Math.max(1,radii[1][1]+radii[2][1]));radii=radii.map(function(p){return[p[0]*factor,p[1]*factor];});
  if(range)radii=[[10,10],[10,10],[10,10],[10,10]];var owner=target.closest('#sheetBody,.drawerIn'),clip=owner&&owner.getBoundingClientRect(),x=Math.max(4,box.left,clip?clip.left:4),y=Math.max(4,box.top,clip?clip.top:4),r=Math.min(innerWidth-4,box.right,clip?clip.right:innerWidth-4),b=Math.min(innerHeight-4,box.bottom,clip?clip.bottom:innerHeight-4);
  return{box:rect(box.left,box.top,box.width,box.height),visible:rect(x,y,Math.max(0,r-x),Math.max(0,b-y)),radii:radii,path:roundedPath(box,radii,0),outline:roundedPath(box,radii,1)};
 }
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
  if(focusKind==='vessel'){var geo=vesselGeometry();if(!geo)return;focusBox=geo.box;cut.setAttribute('d',geo.path);outline.setAttribute('d',geo.path);control.setAttribute('d','');controlOutline.setAttribute('d','');veil.dataset.focus='vessel';}
  else if(focusKind==='control'&&focusTarget){controlGeometry=controlShape(focusTarget);focusBox=controlGeometry.visible;var preview=vesselPreview?vesselGeometry():null;previewBox=preview?preview.box:null;cut.setAttribute('d',preview?preview.path:'');outline.setAttribute('d','');control.setAttribute('d',controlGeometry.path);controlOutline.setAttribute('d',controlGeometry.outline);controlClip.setAttribute('x',focusBox.left);controlClip.setAttribute('y',focusBox.top);controlClip.setAttribute('width',focusBox.width);controlClip.setAttribute('height',focusBox.height);veil.dataset.focus=preview?'control-preview':'control';}
  else{cut.setAttribute('d','');outline.setAttribute('d','');control.setAttribute('d','');controlOutline.setAttribute('d','');veil.dataset.focus='none';}
 }
 var copy={
  shape:['옆면을 좌우로 끌어 보세요','끌면 굴곡이 생겨요.','↔ 끌기'],inside:['오른쪽 안쪽 벽을 끌어 보세요','벽 두께를 조절할 수 있어요.','↔ 끌기'],trim:['바깥 벽을 조금씩 깎아 보세요','도구를 안쪽으로 천천히 밀어요.','↔ 끌기'],smooth:['겉면을 가볍게 문질러 보세요','작은 굴곡과 물레 자국을 정리해요.','문지르기'],smoothInner:['오른쪽 안쪽 벽을 문질러 보세요','안쪽 표면을 매끈하게 다듬어요.','문지르기'],
  brush:['작품 위에 선을 그려 보세요','원하는 무늬를 자유롭게 그려요.','그리기'],brushRing:['작품 위에 띠를 그려 보세요','같은 높이로 한 바퀴 이어져요.','↔ 끌기'],stamp:['도자기를 눌러 도장을 찍어 보세요','고른 모양이 작품에 찍혀요.','누르기'],carve:['작품 위에 무늬를 새겨 보세요','문지른 자리에 홈이 생겨요.','↔ 끌기'],raised:['도자기에 선을 그려 보세요','흙 위로 솟은 무늬가 생겨요.','그리기'],carveRing:['작품 위를 끌어 띠를 새겨 보세요','둘레를 따라 홈이 이어져요.','↔ 끌기'],glazePaint:['원하는 부분에 유약을 칠해 보세요','원하는 만큼 더 칠할 수 있어요.','그리기'],load:['작품을 눌러 가마에 넣어 주세요','가마 문을 닫으면 굽기가 시작돼요.','누르기'],
  smoothSection:['단면을 눌러 보세요','안쪽 벽의 두께를 볼 수 있어요.'],solid:['전체를 눌러 보세요','다듬은 전체 모양을 확인해요.'],stampChoice:['도장을 골라 보세요','꽃·잎 등 원하는 모양을 찍을 수 있어요.'],rotate:['화살표를 눌러 돌려 보세요','반대편도 꾸밀 수 있어요.'],glazeBase:['바탕 유약을 선택해 주세요','작품 전체에 입힐 유약을 골라요.'],color:['원하는 유약 색을 골라 보세요','직접 색상과 코드를 고를 수도 있어요.'],finish:['반짝임을 골라 보세요','유광과 무광의 느낌을 비교해요.'],glazeBrush:['붓칠을 선택해 주세요','원하는 부분에 유약을 칠할 수 있어요.'],glazeOpacity:['불투명도를 움직여 보세요','낮출수록 바탕이 비쳐 보여요.'],glazeBaseReturn:['바탕 유약으로 돌아가 주세요','칠한 무늬는 그대로 유지돼요.'],dip:['담그는 깊이를 움직여 보세요','담그기를 켜고 슬라이더로 범위를 조절해요.'],effect:['표면 무늬를 골라 보세요','원하는 질감을 비교해 보세요.'],heat:['불 세기를 골라 보세요','선택한 불로 작품을 구워요.'],open:['가마 문을 열어 주세요','식은 작품을 꺼내 볼 수 있어요.'],photo:['완성된 작품을 살펴보세요','사진이 준비되면 작품을 직접 돌려볼 수 있어요.'],inspect360:['작품을 직접 돌려 보세요','끌거나 회전 화살표를 눌러요.'],size:['사진 속 작품 크기를 바꿔 보세요','− / 슬라이더 / ＋ 중 편한 방법을 사용해요.'],background:['완성 사진 배경을 골라 보세요','작품에 어울리는 배경을 찾아요.'],title:['작품 이름을 적어 주세요','이름을 적고 용도 칸으로 이동하거나 저장을 눌러요.'],purpose:['어디에 쓸 작품인가요?','찻잔·반지 보관함처럼 적어 보세요.'],save:['작품 카드를 저장해 보세요','이미지로 저장하거나 공유할 수 있어요.'],closeCard:['닫기를 눌러 작품으로 돌아가세요','작품은 내 진열장에도 남아 있어요.'],search:['내 작품 이미지로 찾기를 눌러 보세요','이때 작품 사진이 검색 서비스로 전송돼요.'],closeSearch:['닫기를 눌러 작품으로 돌아가세요','검색이 연결되지 않아도 이어갈 수 있어요.'],home:['홈으로 돌아가 볼까요?','홈에서 언제든 다시 연습할 수 있어요.']
 };
 function describe(target,clip){
  var step=current(),info=(copy[step.id]||[step.title.replace(/^\d+\.\s*/,''),'표시된 곳을 직접 조작해 보세요.']).slice();
  if(target===$('sheetToggle'))return['도구창을 열어 주세요','다음 도구를 여기서 골라요.','누르기'];
  if(target===$('openCard')&&!window.TodakTutorialLesson)return['카드로 저장·공유를 열어 주세요','작품 이름과 용도를 적을 수 있어요.','누르기'];
  if(clip){var detail=tutorialGuidance.describe&&tutorialGuidance.describe(target);return[detail?detail[0]:'표시된 곳을 찾아 주세요',(clip.direction==='up'?'창 안을 위로 스크롤해 주세요. ':'창 안을 아래로 스크롤해 주세요. ')+(detail?detail[1]:'표시된 도구나 입력칸을 찾아요.'),clip.direction==='up'?'↑ 스크롤':'↓ 스크롤'];}
  if(tutorialGuidance.describe){var overview=tutorialGuidance.describe(target);if(overview)return overview;}
  if(done&&lastInStage()&&['throw','deco','glaze'].indexOf(step.stage)>=0)return ['충분히 해본 뒤 다음 단계로 가세요',$('nextBtn').textContent.replace(/\s*→/,'')+' 버튼으로 이어가요.'];if(done)return tutorialGuidance.feedback();
  if(tutorialGuidance.status())return['닮은 물건을 찾는 중이에요','아래에 검색 결과나 연결 안내가 나타날 때까지 기다려 주세요.',''];
  if(step.id==='open'&&fstep!=='ready')return['가마가 식는 중이에요','100℃ 이하로 식으면 문을 열 수 있어요.',''];
  if(target!==cv){
   if(gestureReady())return info;
   var tools={shape:['모양 잡기를 골라 주세요','옆면을 밀고 당겨 모양을 바꿔요.'],inside:['속·두께를 골라 주세요','다음에는 오른쪽 안쪽 벽을 다듬어요.'],trim:['깎기를 골라 주세요','흙이 조금 마르면 깎을 수 있어요.'],smooth:['매끈하게를 골라 주세요','겉면의 작은 굴곡을 정리해요.'],smoothInner:['안쪽벽을 골라 주세요','오른쪽 단면의 안쪽을 다듬어요.'],brush:['붓을 골라 주세요','작품 위에 자유롭게 그릴 수 있어요.'],stamp:['도장을 골라 주세요','작품을 눌러 무늬를 찍어요.'],carve:['조각칼을 골라 주세요','작품에 홈을 새길 수 있어요.']};
   if(tools[step.id])info=tools[step.id].concat('누르기');
   if(step.id==='stampChoice')info=dTool==='stamp'?['찍을 모양을 골라 주세요','꽃·잎 등 원하는 도장을 골라요.','누르기']:['도장을 눌러 보세요','모양을 고른 뒤 작품에 찍을 수 있어요.','누르기'];
  }
  return info;
 }
var mobileText={
 shape:'컵 안내선을 보며 옆면을 좌우로 끌어 전체 모양을 잡아요.',height:'입구 옆 ↕ 손잡이를 위아래로 끌어 높이를 맞춰요.',
 zoom:'도자기 위에서 두 손가락을 벌리거나 모아요.',
 trimWidth:'날 두께를 움직이면 점선으로 깎이는 범위가 보여요.',trimStrength:'오른쪽으로 갈수록 더 깎여요. 조금씩 조절해 보세요.',trim:'옆면을 안쪽으로 조금 밀어 작은 굴곡을 깎아요.',
 depth:'속 깊이를 늘리면 깊어지고, 줄이면 바닥이 두꺼워져요.',inside:'단면의 안쪽 벽을 좌우로 끌어 두께를 바꿔요.',
 smoothOuter:'바깥벽을 가볍게 문질러 작은 굴곡을 정리해요.',smoothInner:'단면의 안쪽 벽을 문질러 매끈하게 다듬어요.',
 brushSize:'굵기를 움직여 붓이 닿는 범위를 확인해요.',brush:'누른 채 끌면 고른 색으로 그려져요.',
 stampChoice:'찍고 싶은 도장 모양을 골라요.',stamp:'도자기를 한 번 눌러 도장을 찍어요.',
 incised:'도자기 위를 끌어 들어간 무늬를 새겨요.',raised:'도자기 위를 끌어 솟은 무늬를 만들어요.',erase:'방금 그린 부분을 문질러 지워요.',
 rotate:'위쪽의 강조된 회전 버튼으로 뒷면을 봐요.',topView:'윗모습을 누르면 입구와 안쪽을 내려다봐요.',bottomView:'밑바닥을 눌러 작품 아래쪽도 봐요.',sideView:'옆모습을 눌러 원래 시점으로 돌아와요.',
 baseColor:'원하는 색을 누르면 작품 전체에 입혀져요.',finish:'빛이 반사되는 유광과 부드러운 무광 중 골라요.',
 dip:'위에서·아래에서 중 담글 방향도 고를 수 있어요.',dipColor:'담근 부분에 덧입힐 색을 골라요.',dipDepth:'깊이를 움직여 색이 입혀질 범위를 바꿔요.',dipAngle:'기울기를 움직이면 색의 경계가 비스듬해져요.',
 effect:'없음·점박이·잔금 중 원하는 무늬를 골라요.',brushColor:'원하는 부분에 칠할 붓 유약 색을 골라요.',glazeOpacity:'낮출수록 바탕색이 비쳐요.',glazeSize:'굵기를 움직여 붓이 닿는 범위를 확인해요.',glazePaint:'누른 채 끌어 원하는 곳에 유약을 칠해요.',
 photoSize:'−·슬라이더·＋로 사진 속 작품 크기를 바꿔요.',photoMove:'작품을 누른 채 끌어 사진 속 위치를 바꿔요.',background:'원하는 배경을 고르고 사용하기를 눌러요.',orbit:'작품을 끌어 위·아래·뒤쪽까지 돌려 봐요.',photoReturn:'같은 스위치를 눌러 사진으로 돌아와요.'
 };
 function mobileInstruction(info,target,clip){if(innerWidth>=960)return info;var lesson=window.TodakTutorialLesson?.state(),body=lesson&&mobileText[lesson.exercise];info=info.slice();if(body&&!clip&&target!==$('sheetToggle')&&!target.closest('#tools,#dtools,#rackGlaze,#carveMode'))info[1]=body;if(lesson?.exercise==='zoom'&&target===cv){var touch=navigator.maxTouchPoints>0;info[0]=touch?'두 손가락으로 확대해 보세요':'휠로 확대·축소해 보세요';info[1]=touch?'도자기 위에서 두 손가락을 벌리거나 모아요.':'도자기 위에서 마우스 휠을 움직여요.';}setText($('tutorialTitle'),info[0]);return info;}
 
 function updateProgress(){
  var step=current(),lesson=window.TodakTutorialLesson&&TodakTutorialLesson.state(),number=stages.indexOf(step.stage)+1;setText($('tutorialCount'),number+' / 5');setText($('tutorialTitle'),lesson?lesson.title:step.title.replace(/^\d+\.\s*/,''));setText($('tutorialStatus'),!done&&lesson&&lesson.exerciseTotal?lesson.exerciseNumber+' / '+lesson.exerciseTotal:done?'완료':step.id==='open'&&fstep!=='ready'?'기다리는 중':'진행 중');
  coach.dataset.stage=step.stage;coach.dataset.done=String(done);stageList.querySelectorAll('li').forEach(function(li){var list=steps.filter(function(s){return s.stage===li.dataset.stage;}),finished=steps.slice(0,index+(done?1:0)).filter(function(s){return s.stage===li.dataset.stage;}).length;li.querySelector('i').style.width=(Math.min(1,finished/list.length)*100)+'%';li.classList.toggle('is-current',step.stage===li.dataset.stage);li.classList.toggle('is-complete',finished>=list.length);if(step.stage===li.dataset.stage)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});
  
  if(tutorialGuidance.status())setText($('tutorialStatus'),tutorialGuidance.status());
 }

 var pulsingTarget=null;
 function pulseControl(target){if(target&&(engaged||ptr.down||heldPointers.size||heldRangeKeys.size))target=null;if(pulsingTarget===target)return;if(pulsingTarget)pulsingTarget.classList.remove('tutorialPulse');pulsingTarget=target;if(target)target.classList.add('tutorialPulse');}
 function positionProgress(target){
  var modal=!$('cardDlg').hidden,content=document.querySelector('#cardDlg .ui-card-content'),preview=document.querySelector('#cardDlg .ui-card-preview'),box=cv.getBoundingClientRect(),right=document.body.dataset.uiLayout==='sidebar'?Math.min(box.right,$('sheet').getBoundingClientRect().left):box.right,space=right-box.left,width=Math.min(380,Math.max(240,space-24)),left=box.left+(space-width)/2,top=guideTop();
  if(content)content.style.paddingTop='';coach.dataset.anchor='work';if(coach.hidden){coach.dataset.anchor='control';if(coach.parentNode!==document.body)document.body.appendChild(coach);return rect(0,0,0,0);}
  var headerTarget=focusTarget&&focusTarget.closest('#ui-work-views')&&focusKind==='control';var controlTarget=focusTarget&&focusTarget.closest('#sheet')&&focusKind==='control',sheet=$('sheet').getBoundingClientRect();
  if(controlTarget){var anchor=controlShape(focusTarget).visible;coach.dataset.anchor='control';if(document.body.dataset.uiLayout==='sidebar'){width=Math.min(340,Math.max(240,space-24));left=Math.max(12,anchor.left-width-22);top=clamp((anchor.top+anchor.bottom-coach.offsetHeight)/2,guideTop(),Math.max(guideTop(),innerHeight-coach.offsetHeight-16));}else{top=Math.max(guideTop(),sheet.top-coach.offsetHeight-12);}} 
  if(headerTarget){var hb=focusTarget.getBoundingClientRect();coach.dataset.anchor='control';width=Math.min(340,space-24);left=clamp(hb.right-width,box.left+12,Math.max(box.left+12,right-width-12));top=hb.bottom+30;}
  if(modal){var cb=content.getBoundingClientRect(),pb=preview.getBoundingClientRect();width=Math.min(350,(innerWidth<760?innerWidth:pb.width)-32);left=innerWidth<760?(innerWidth-width)/2:pb.left+(pb.width-width)/2;top=Math.max(76,cb.top+8);}
  coach.style.cssText='';coach.classList.remove('tutorialDocked','tutorialModal');if(coach.parentNode!==document.body)document.body.appendChild(coach);coach.style.width=width+'px';coach.style.left=clamp(left,12,Math.max(12,innerWidth-width-12))+'px';coach.style.top=Math.min(top,Math.max(8,innerHeight-coach.offsetHeight-12))+'px';
  if(modal&&innerWidth<760&&content)content.style.paddingTop=(coach.offsetHeight+20)+'px';
  return coach.getBoundingClientRect();
 }
 function positionAction(){action.style.cssText='';action.dataset.side='none';}
 function scrollControl(target,key){
  if(scrolledKey===key||ptr.down||heldPointers.size||heldRangeKeys.size||!$('sheet').classList.contains('open')||!target.closest('#sheetBody')||target.closest('#tools,#ui-touch-deco,#ui-touch-glaze'))return;
  var owner=$('sheetBody'),b=owner.getBoundingClientRect(),r=target.getBoundingClientRect();if(!r.width||!r.height)return;scrolledKey=key;var sticky=st.stage==='throw'?$('tools'):st.stage==='deco'?$('ui-touch-deco'):$('ui-touch-glaze'),sb=sticky?.getBoundingClientRect(),footer=$('ui-tool-footer').getBoundingClientRect(),top=Math.max(b.top+8,sb&&sb.height?sb.bottom+8:b.top+8),bottom=Math.min(innerHeight,b.bottom,footer.height?footer.top:b.bottom)-8,start=r.top;if(start<top||r.bottom>bottom){owner.scrollTop+=start-(top+Math.max(0,bottom-top-(r.bottom-start))*.25);var after=target.getBoundingClientRect();if(after.bottom>bottom)owner.scrollTop+=after.bottom-bottom;}
 }
 function linkControl(){leader.setAttribute('d','');}
 function positionHand(target,clip,info){
  if(innerWidth<960&&window.TodakTutorialLesson?.state().exercise==='zoom'){hand.hidden=true;return;}
  if(focusKind==='control'&&!clip){hand.hidden=true;return;}
  if(done||engaged||ptr.down||target===$('fireTitle')||current().id==='photo'){hand.hidden=true;return;}
  var r=target.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,kind='tap',gesture=window.TodakTutorialLesson&&TodakTutorialLesson.gesture();
  if(clip){r=clip.owner.getBoundingClientRect();x=r.right-38;y=(Math.max(r.top,0)+Math.min(r.bottom,innerHeight))/2;kind=clip.direction==='up'?'scrollUp':'scrollDown';hand.setAttribute('data-scroll-label',clip.direction==='up'?'↑ 위로 스크롤':'↓ 아래로 스크롤');}
  else if(target===cv){var t=.55,radius=['inside','smoothInner'].indexOf(current().id)>=0?innerAt(t):rAt(t)*.9,px=CX+radius*SV,py=BASE-st.height*t*SV,wheel=window.TodakWheel;
   if(['brush','brushRing','stamp','carve','raised','carveRing','glazePaint'].indexOf(current().id)>=0)px=CX+rAt(t)*SV*.15;
   if(wheel&&(wheel.top()||wheel.bottom())&&st.stage!=='throw'){var l=wheel.bottom()?wheel.bottomLayout():wheel.layout();px=l.x+l.r*.2;py=l.y+l.r*.15;}
   if(current().id==='load'){var pv=pieceView();px=CX+pv.x;py=BASE+pv.y-st.height*SV*pv.s*.5;}
   x=r.left+px*r.width/Math.max(1,W);y=r.top+py*r.height/Math.max(1,HC);kind=['stamp','load'].indexOf(current().id)>=0?'tap':['smooth','smoothInner'].indexOf(current().id)>=0?'rub':['brush','glazePaint','raised'].indexOf(current().id)>=0?'circle':current().id==='shape'?'shape':'drag';
  }
  if(!clip&&gesture&&target===intendedTarget()){kind=gesture.motion;if(target===cv&&Number.isFinite(gesture.x)){x=r.left+gesture.x*r.width/Math.max(1,W);y=r.top+gesture.y*r.height/Math.max(1,HC);}else if(kind==='range'){x=r.left+12+(r.width-24)*(Number(target.value)-Number(target.min))/(Number(target.max)-Number(target.min));y=r.top+r.height/2;}}
  hand.hidden=false;hand.dataset.motion=kind;hand.dataset.targetKind=clip?'scroll':target===cv?'vessel':'control';hand.dataset.action=info[2]||'누르기';
  if(hand.dataset.targetKind==='control'){hand.style.left=clamp(x-9,r.left+2,r.right-20)+'px';hand.style.top=clamp((kind==='range'?y:r.top+r.height*.3)-9,r.top+2,r.bottom-20)+'px';}else{hand.style.left=clamp(x-8,8,innerWidth-48)+'px';hand.style.top=clamp(y-8,8,innerHeight-84)+'px';}
 }
 function hidePresentation(){pulseControl(null);leader.setAttribute('d','');var cardContent=document.querySelector('#cardDlg .ui-card-content');if(cardContent)cardContent.style.paddingTop='';veil.style.display='none';action.hidden=true;focusKind='';focusTarget=null;focusBox=null;vesselPreview=false;previewBox=null;actionPlacementKey='';actionPlacementTarget=null;document.body.classList.remove('tutorial-guided','tutorial-sheet-focus');}
 positionHints=function(){};
 function present(){
  if(rendering)return;if(!active||!current()||!$('home').hidden){hidePresentation();return;}if(tutorialGuidance.waitingForPhoto()){hidePresentation();coach.hidden=true;hand.hidden=true;return;}rendering=true;
  try{
   var target=intendedTarget();if(!target)return;var nativeDialog=document.querySelector('dialog[open]');if(nativeDialog&&!nativeDialog.contains(target)){coach.hidden=true;hand.hidden=true;hidePresentation();return;}if(engaged&&gestureReady())target=cv;
   if(target.closest('#sheet')&&!$('sheet').classList.contains('open')&&target!==$('sheetToggle'))target=$('sheetToggle');
   var canvasTarget=target===cv,step=current(),lessonKey=step.id+':'+(window.TodakTutorialLesson?TodakTutorialLesson.state().key:'');
   scrollControl(target,lessonKey+':'+(target.id||target.dataset.t||target.dataset.d||''));var clip=clippedTarget(target);
   focusTarget=clip?null:target;focusKind=clip?'none':step.id==='photo'||target===$('finished360Canvas')?'none':canvasTarget?'vessel':target===$('fireTitle')?'none':'control';
   if(lessonKey!==lastLessonKey){lastLessonKey=lessonKey;}
   if(lessonKey!==lastFittedKey&&!ptr.down){lastFittedKey=lessonKey;if(!uiUsesSheet()||!$('sheet').classList.contains('open'))setTimeout(function(){if(active&&!ptr.down){resize();V=fitV();SV=S0*V*Z;dirty=true;}},0);}
   document.body.classList.toggle('tutorial-sheet-focus',!done&&!!target.closest('#sheet')&&['deco','glaze'].indexOf(st.stage)>=0);
   // The player keeps the drawer open while choosing tools and settings.
   var modalOpen=!$('cardDlg').hidden||!$('searchDlg').hidden;coach.hidden=focusKind==='control'||!!clip;coach.setAttribute('aria-label','처음 빚기 진행');document.body.classList.add('tutorial-guided');var header=document.querySelector('.ui-header');if(header)document.body.style.setProperty('--tutorial-header-bottom',(header.getBoundingClientRect().bottom-stageEl.getBoundingClientRect().top)+'px');updateProgress();var info=mobileInstruction(describe(target,clip),target,clip);setText(oldText,info[1]);var progress=positionProgress(target);$('tutorialActionContext').hidden=!modalOpen;if(modalOpen)setText($('tutorialActionProgress'),'처음 빚기 · '+(stages.indexOf(step.stage)+1)+' / 5');
   setText($('tutorialActionTitle'),info[0]);setText(oldText,info[1]);action.hidden=engaged||ptr.down||coach.hidden;
   focusTarget=clip?null:target;focusKind=clip?'none':step.id==='photo'||target===$('finished360Canvas')?'none':canvasTarget?'vessel':target===$('fireTitle')?'none':'control';if(focusKind==='none')focusBox=null;vesselPreview=focusKind==='control'&&['deco','glaze'].indexOf(st.stage)>=0;previewBox=null;sizeVeil();updateFocus();veil.querySelector('#tutorialDim').style.fillOpacity='0';pulseControl(focusKind==='control'&&!clip?target:null);veil.style.display=focusKind==='vessel'?'block':'none';
   var anchor=focusBox||limitedRect(target,0);if(!action.hidden)positionAction(anchor,progress,canvasTarget);positionHand(target,clip,info);linkControl(target,clip);
  }finally{rendering=false;}
 }
 var originalRoute=route;route=function(){if(rendering)return;originalRoute();present();};
 var originalTarget=intendedTarget;intendedTarget=function(){if(current()&&current().id==='home'&&!$('menuBtn').getClientRects().length)return $('homeBtn');return originalTarget();};
 $('homeBtn').addEventListener('click',function(){if(active&&current()&&current().id==='home')mark('home');});
 window.addEventListener('todak-tutorial-reset',function(){lastFittedKey='';scrolledKey='';});
 var originalHide=hideGuide;hideGuide=function(){originalHide();hidePresentation();};
 var originalFinish=finish;finish=function(skipped){hidePresentation();return originalFinish(skipped);};
 var originalDraw=draw;draw=function(){var result=originalDraw.apply(this,arguments);if(active&&(focusKind==='vessel'||vesselPreview)&&$('home').hidden)updateFocus();return result;};
 var originalFit=fitV;fitV=function(){var value=originalFit();if(!active||!$('home').hidden||!current()||st.stage==='done'||st.stage==='fire'||coach.dataset.anchor==='control'||uiUsesSheet()&&$('sheet').classList.contains('open'))return value;var box=cv.getBoundingClientRect();if(!box.width)return value;var unit=W/box.width,guideBottom=Math.max(guideTop()+100,coach.hidden?0:coach.getBoundingClientRect().bottom+12,action.hidden?0:action.getBoundingClientRect().bottom+12),safe=(guideBottom-box.top)*unit,radius=Math.max.apply(null,st.radii),room=Math.max(40,BASE0-safe);return Math.max(.08,Math.min(value,room/Math.max(1,(st.height+radius*TILT)*S0)));};
 window.TodakTutorialPresentation={refresh:function(){scrolledKey='';if(active)route();},state:function(){return{visible:veil.style.display!=='none',focus:focusKind,target:focusTarget?focusTarget.id||focusTarget.dataset.t||focusTarget.dataset.d:null,path:cut.getAttribute('d'),controlPath:control.getAttribute('d'),control:focusKind==='control'?controlGeometry:null,bounds:focusBox,preview:vesselPreview,previewBounds:previewBox,step:current()?current().id:null};}};
})();
