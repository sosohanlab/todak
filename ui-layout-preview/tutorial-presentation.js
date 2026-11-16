/* Runs inside the existing tutorial: action validation and saved progress remain authoritative. */
(function(){
 'use strict';
 var stages=['throw','deco','glaze','fire','done'],names=['빚기','꾸미기','유약','굽기','완성'];
 var ns='http://www.w3.org/2000/svg',rendering=false,lastCanvasStep='',focusKind='',focusTarget=null,focusBox=null,geometryKey='',lastGeometry=null,vesselPreview=false,previewBox=null;
 var top=coach.querySelector('.tutorialTop'),badge=document.createElement('span');badge.className='tutorialBadge';badge.textContent='처음 빚기';top.prepend(badge);
 var stageList=document.createElement('ol');stageList.id='tutorialStages';stageList.setAttribute('aria-label','튜토리얼 진행');
 stages.forEach(function(stage,i){var li=document.createElement('li');li.dataset.stage=stage;li.innerHTML='<span class="tutorialMeter"><i></i></span><span>'+names[i]+'</span>';stageList.appendChild(li);});
 var footer=document.createElement('div');footer.className='tutorialCurrent';var taskLabel=document.createElement('span');taskLabel.className='tutorialTaskLabel';taskLabel.textContent='지금 할 일';footer.append(taskLabel,$('tutorialTitle'),$('tutorialStatus'));
 var oldText=$('tutorialText');coach.append(stageList,footer);oldText.remove();
 var nextGuide=document.createElement('button');nextGuide.id='tutorialContinue';nextGuide.type='button';nextGuide.textContent='다음 안내 →';nextGuide.hidden=true;coach.appendChild(nextGuide);
 // Completion unlocks the next instruction; it never starts a countdown.
 scheduleAdvance=function(){cancelAdvance();if(active&&current()&&current().id==='home'&&done){finish();return;}if(!ptr.down)engaged=false;route();};
 nextGuide.onclick=function(){if(!active||!done||ptr.down)return;if(index===steps.length-1)finish();else advance();};
 ['pointerup','pointercancel'].forEach(function(type){document.addEventListener(type,function(){setTimeout(function(){if(active&&!ptr.down){engaged=false;route();}},0);},true);});
 $('tutorialStatus').removeAttribute('role');$('tutorialStatus').setAttribute('aria-hidden','true');
 var action=document.createElement('aside');action.id='tutorialAction';action.hidden=true;action.setAttribute('aria-live','polite');action.setAttribute('aria-atomic','true');action.innerHTML='<b id="tutorialActionTitle"></b>';action.append(oldText,nextGuide);document.body.appendChild(action);
 var veil=document.createElementNS(ns,'svg');veil.id='tutorialVeil';veil.setAttribute('aria-hidden','true');veil.setAttribute('focusable','false');veil.style.display='none';
 veil.innerHTML='<defs><clipPath id="tutorialControlClip" clipPathUnits="userSpaceOnUse"><rect id="tutorialControlClipBox"/></clipPath><mask id="tutorialFocusMask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" style="mask-type:luminance"><rect id="tutorialMaskBase" fill="white"/><path id="tutorialVesselCutout" fill="black"/><path id="tutorialControlCutout" fill="black" clip-path="url(#tutorialControlClip)"/></mask></defs><rect id="tutorialDim" width="100%" height="100%" mask="url(#tutorialFocusMask)"/><path id="tutorialVesselOutline" fill="none"/><path id="tutorialControlOutline" fill="none" clip-path="url(#tutorialControlClip)"/>';
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
  var box=target.getBoundingClientRect(),style=getComputedStyle(target),sx=box.width/(target.offsetWidth||box.width||1),sy=box.height/(target.offsetHeight||box.height||1);
  var radii=['borderTopLeftRadius','borderTopRightRadius','borderBottomRightRadius','borderBottomLeftRadius'].map(function(key){var p=style[key].trim().split(/\s+/),a=p[0]||'0',b=p[1]||a;return[a.indexOf('%')>=0?parseFloat(a)*box.width/100:(parseFloat(a)||0)*sx,b.indexOf('%')>=0?parseFloat(b)*box.height/100:(parseFloat(b)||0)*sy];});
  var factor=Math.min(1,box.width/Math.max(1,radii[0][0]+radii[1][0]),box.width/Math.max(1,radii[3][0]+radii[2][0]),box.height/Math.max(1,radii[0][1]+radii[3][1]),box.height/Math.max(1,radii[1][1]+radii[2][1]));radii=radii.map(function(p){return[p[0]*factor,p[1]*factor];});
  return{box:rect(box.left,box.top,box.width,box.height),visible:limitedRect(target,0),radii:radii,path:roundedPath(box,radii,0),outline:roundedPath(box,radii,1)};
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
  smoothSection:['단면을 눌러 보세요','안쪽 벽의 두께를 볼 수 있어요.'],solid:['전체를 눌러 보세요','다듬은 전체 모양을 확인해요.'],stampChoice:['도장을 골라 보세요','꽃·잎 등 원하는 모양을 찍을 수 있어요.'],rotate:['화살표를 눌러 돌려 보세요','반대편도 꾸밀 수 있어요.'],glazeBase:['바탕 유약을 선택해 주세요','작품 전체에 입힐 유약을 골라요.'],color:['원하는 유약 색을 골라 보세요','직접 색상과 코드를 고를 수도 있어요.'],finish:['반짝임을 골라 보세요','유광과 무광의 느낌을 비교해요.'],glazeBrush:['붓칠을 선택해 주세요','원하는 부분에 유약을 칠할 수 있어요.'],glazeOpacity:['불투명도를 움직여 보세요','낮출수록 바탕이 비쳐 보여요.'],glazeBaseReturn:['바탕 유약으로 돌아가 주세요','칠한 무늬는 그대로 유지돼요.'],dip:['담그는 깊이를 움직여 보세요','입구만 또는 절반까지 덧입혀요.'],effect:['표면 무늬를 골라 보세요','원하는 질감을 비교해 보세요.'],heat:['불 세기를 골라 보세요','선택한 불로 작품을 구워요.'],open:['가마 문을 열어 주세요','식은 작품을 꺼내 볼 수 있어요.'],photo:['완성 사진을 확인해 보세요','스위치를 켜면 360도로 감상할 수 있어요.'],inspect360:['작품을 직접 돌려 보세요','끌거나 회전 화살표를 눌러요.'],size:['사진 속 작품 크기를 바꿔 보세요','슬라이더나 − / ＋ 버튼을 사용해요.'],background:['완성 사진 배경을 골라 보세요','작품에 어울리는 배경을 찾아요.'],title:['작품 이름을 적어 주세요','한글 입력을 마치면 이어집니다.'],purpose:['어디에 쓸 작품인가요?','찻잔·반지 보관함처럼 적어 보세요.'],save:['작품 카드를 저장해 보세요','이미지로 저장하거나 공유할 수 있어요.'],closeCard:['닫기를 눌러 작품으로 돌아가세요','작품은 내 진열장에도 남아 있어요.'],search:['내 작품 이미지로 찾기를 눌러 보세요','이때 작품 사진이 검색 서비스로 전송돼요.'],closeSearch:['닫기를 눌러 작품으로 돌아가세요','검색이 연결되지 않아도 이어갈 수 있어요.'],home:['홈으로 돌아가 볼까요?','홈에서 언제든 다시 연습할 수 있어요.']
 };
 function describe(target,clip){
  var step=current(),info=(copy[step.id]||[step.title.replace(/^\d+\.\s*/,''),'표시된 곳을 직접 조작해 보세요.']).slice();
  if(target===$('sheetToggle'))return['도구창을 열어 주세요','다음 도구를 여기서 골라요.','누르기'];
  if(target===$('openCard'))return['카드로 저장·공유를 열어 주세요','작품 이름과 용도를 적을 수 있어요.','누르기'];
  if(clip)return[clip.direction==='up'?'도구창을 위로 스크롤해 주세요':'도구창을 아래로 스크롤해 주세요','표시된 도구나 입력칸을 찾아요.',clip.direction==='up'?'↑ 스크롤':'↓ 스크롤'];
  if(done){if(lastInStage()&&['done','fire'].indexOf(step.stage)<0)return['충분히 해본 뒤 다음 단계로 가세요',$('nextBtn').textContent.replace(/\s*→/, '')+' 버튼으로 이어가요.','누르기'];return['잘했어요! 더 연습해도 좋아요','준비되면 아래의 다음 안내를 눌러요.',''];}
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
  coach.dataset.stage=step.stage;coach.dataset.done=String(done);nextGuide.hidden=!done||lastInStage()&&['throw','deco','glaze'].indexOf(step.stage)>=0;stageList.querySelectorAll('li').forEach(function(li){var list=steps.filter(function(s){return s.stage===li.dataset.stage;}),finished=steps.slice(0,index+(done?1:0)).filter(function(s){return s.stage===li.dataset.stage;}).length;li.querySelector('i').style.width=(Math.min(1,finished/list.length)*100)+'%';li.classList.toggle('is-current',step.stage===li.dataset.stage);li.classList.toggle('is-complete',finished>=list.length);if(step.stage===li.dataset.stage)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});
 }
 function positionProgress(){var mobile=innerWidth<600,short=innerHeight<560,width=mobile?Math.min(180,Math.floor((innerWidth-36)*.48)):short?180:220;coach.style.cssText='';coach.classList.remove('tutorialDocked','tutorialModal');if(coach.parentNode!==document.body)document.body.appendChild(coach);coach.style.width=width+'px';coach.style.left='12px';coach.style.top=Math.min(guideTop(),Math.max(8,innerHeight-110))+'px';return coach.getBoundingClientRect();}
 function positionAction(anchor,progress,canvasTarget){
  var mobile=innerWidth<600,width=mobile?Math.min(230,innerWidth-24):226;action.dataset.side='none';
  if(mobile||vesselPreview&&innerHeight<560){var x=progress.right+10;width=mobile?Math.max(128,innerWidth-12-x):226;action.style.width=width+'px';action.style.left=x+'px';action.style.top=progress.top+'px';action.dataset.side=canvasTarget?'bottom':'none';action.style.setProperty('--tutorial-arrow','24px');return;}
  action.style.width=width+'px';var h=action.getBoundingClientRect().height||76,gap=16,header=document.querySelector('.ui-header'),headerBox=header&&header.getBoundingClientRect(),infoBox=$('ui-work-info').getBoundingClientRect();
  var candidates=[{left:anchor.left-gap-width,top:anchor.top+(anchor.height-h)/2,side:'right'},{left:anchor.right+gap,top:anchor.top+(anchor.height-h)/2,side:'left'},{left:anchor.left+(anchor.width-width)/2,top:anchor.top-gap-h,side:'bottom'},{left:anchor.left+(anchor.width-width)/2,top:anchor.bottom+gap,side:'top'}];
  var sheetTarget=focusKind==='control'&&focusTarget&&focusTarget.closest('#sheet'),sheetBox=sheetTarget&&$('sheet').getBoundingClientRect();
  if(sheetBox){if(document.body.dataset.uiLayout==='sheet')candidates.unshift({left:anchor.left+(anchor.width-width)/2,top:sheetBox.top-gap-h,side:'bottom'});else candidates.unshift({left:sheetBox.left-gap-width,top:anchor.top+(anchor.height-h)/2,side:'right'});}
  if(sheetBox&&document.body.dataset.uiLayout!=='sheet'){var rack=document.querySelector('#potteryToolRack'),rackBox=rack&&rack.getClientRects().length?rack.getBoundingClientRect():null;if(rackBox)candidates.push({left:sheetBox.left-gap-width,top:Math.max(anchor.top+(anchor.height-h)/2,rackBox.bottom+gap),side:'right'});}
  if(vesselPreview&&previewBox){candidates.unshift({left:previewBox.left-gap-width,top:anchor.top+(anchor.height-h)/2,side:'right'},{left:previewBox.left+(previewBox.width-width)/2,top:previewBox.top-gap-h,side:'bottom'},{left:progress.right+12,top:progress.top,side:'bottom'});}
  var controls=Array.from(document.querySelectorAll('button,input,select,summary,a')).filter(function(node){return node!==focusTarget&&!node.contains(focusTarget)&&!focusTarget.contains(node)&&!coach.contains(node)&&node.getClientRects().length;}).map(function(node){return node.getBoundingClientRect();});
  if(mobile)candidates.push({left:12,top:progress.bottom+8,side:'bottom'});
  var sidebar=$('sheet').getBoundingClientRect(),rightLimit=!sheetTarget&&document.body.dataset.uiLayout==='sidebar'&&focusTarget.closest('#stage')?sidebar.left-gap:innerWidth-12;
  // Prefer the nearest clear position. Equal overlap scores used to send a
  // colour callout above the pot, with its arrow pointing at the wrong object.
  var best=null,bestScore=Infinity;candidates.forEach(function(c){var l=clamp(c.left,12,Math.max(12,rightLimit-width)),t=clamp(c.top,8,Math.max(8,innerHeight-h-8)),r=rect(l,t,width,h),dx=Math.max(0,anchor.left-r.right,r.left-anchor.right),dy=Math.max(0,anchor.top-r.bottom,r.top-anchor.bottom),distance=Math.hypot(dx,dy),aligned=c.side==='left'||c.side==='right'?Math.min(r.bottom,anchor.bottom)-Math.max(r.top,anchor.top)>0:Math.min(r.right,anchor.right)-Math.max(r.left,anchor.left)>0,score=intersection(r,anchor)*20+intersection(r,progress)*30+intersection(r,infoBox)*8+(headerBox?intersection(r,headerBox)*8:0)+(sheetBox?intersection(r,sheetBox)*8:0)+(vesselPreview&&previewBox?intersection(r,previewBox)*20:0)+controls.reduce(function(sum,box){return sum+intersection(r,box)*8;},0)+Math.abs(l-c.left)*10+Math.abs(t-c.top)*5+distance*4+(aligned?0:2000);if(score<bestScore){bestScore=score;best={left:l,top:t,side:aligned&&distance<80?c.side:'none'};}});
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
  hand.hidden=false;hand.dataset.motion=kind;hand.dataset.targetKind=clip?'scroll':target===cv?'vessel':'control';hand.dataset.action=info[2]||'누르기';
  if(hand.dataset.targetKind==='control'){hand.style.left=clamp(x-9,r.left+2,r.right-20)+'px';hand.style.top=clamp(r.top+r.height*.3-9,r.top+2,r.bottom-20)+'px';}else{hand.style.left=clamp(x-8,8,innerWidth-48)+'px';hand.style.top=clamp(y-8,8,innerHeight-84)+'px';}
 }
 function hidePresentation(){veil.style.display='none';action.hidden=true;focusKind='';focusTarget=null;focusBox=null;vesselPreview=false;previewBox=null;document.body.classList.remove('tutorial-guided','tutorial-sheet-focus');}
 positionHints=function(){};
 function present(){
  if(rendering)return;if(!active||!current()||!$('home').hidden){hidePresentation();return;}rendering=true;
  try{
   var target=intendedTarget();if(!target)return;if(engaged&&gestureReady())target=cv;
   if(target.closest('#sheet')&&!$('sheet').classList.contains('open')&&target!==$('sheetToggle'))target=$('sheetToggle');
   var clip=clippedTarget(target),canvasTarget=target===cv,step=current();
   document.body.classList.toggle('tutorial-sheet-focus',!!target.closest('#sheet')&&['deco','glaze'].indexOf(st.stage)>=0);
   // Free the mobile workspace once per hands-on step, before the gesture begins.
   if(canvasTarget&&innerWidth<600&&lastCanvasStep!==step.id&&!ptr.down){lastCanvasStep=step.id;var closingStep=step.id;setTimeout(function(){if(active&&current()&&current().id===closingStep&&gestureReady()&&!ptr.down){setSheet(false);resize();V=fitV();SV=S0*V*Z;dirty=true;route();}},0);}
   coach.hidden=false;coach.setAttribute('aria-label','처음 빚기 진행');document.body.classList.add('tutorial-guided');var header=document.querySelector('.ui-header');if(header)document.body.style.setProperty('--tutorial-header-bottom',(header.getBoundingClientRect().bottom-stageEl.getBoundingClientRect().top)+'px');updateProgress();var progress=positionProgress(),info=describe(target,clip);
   setText($('tutorialActionTitle'),info[0]);setText(oldText,info[1]);action.hidden=engaged||ptr.down;
   focusTarget=clip?clip.owner:target;focusKind=canvasTarget?'vessel':target===$('fireTitle')?'none':'control';vesselPreview=focusKind==='control'&&['deco','glaze'].indexOf(st.stage)>=0;previewBox=null;sizeVeil();updateFocus();veil.style.display=focusKind==='none'?'none':'block';
   var anchor=focusBox||limitedRect(target,0);if(!action.hidden)positionAction(anchor,progress,canvasTarget);positionHand(target,clip,info);
  }finally{rendering=false;}
 }
 var originalRoute=route;route=function(){if(rendering)return;originalRoute();present();};
 var originalTarget=intendedTarget;intendedTarget=function(){if(current()&&current().id==='home'&&!$('menuBtn').getClientRects().length)return $('homeBtn');return originalTarget();};
 $('homeBtn').addEventListener('click',function(){if(active&&current()&&current().id==='home')mark('home');});
 var originalHide=hideGuide;hideGuide=function(){originalHide();hidePresentation();};
 var originalFinish=finish;finish=function(skipped){hidePresentation();return originalFinish(skipped);};
 var originalDraw=draw;draw=function(){var result=originalDraw.apply(this,arguments);if(active&&(focusKind==='vessel'||vesselPreview)&&$('home').hidden)updateFocus();return result;};
 var originalFit=fitV;fitV=function(){var value=originalFit();if(!active||!$('home').hidden||innerWidth>=600&&innerHeight>=560||!current()||st.stage==='done'||st.stage==='fire')return value;var box=cv.getBoundingClientRect();if(!box.width)return value;var unit=W/box.width,guideBottom=Math.max(guideTop()+100,coach.hidden?0:coach.getBoundingClientRect().bottom+12,action.hidden?0:action.getBoundingClientRect().bottom+12),safe=(guideBottom-box.top)*unit,radius=Math.max.apply(null,st.radii),room=Math.max(40,BASE0-safe);return Math.max(.08,Math.min(value,room/Math.max(1,(st.height+radius*TILT)*S0)));};
 window.TodakTutorialPresentation={state:function(){return{visible:veil.style.display!=='none',focus:focusKind,target:focusTarget?focusTarget.id||focusTarget.dataset.t||focusTarget.dataset.d:null,path:cut.getAttribute('d'),controlPath:control.getAttribute('d'),control:focusKind==='control'?controlGeometry:null,bounds:focusBox,preview:vesselPreview,previewBounds:previewBox,step:current()?current().id:null};}};
})();
