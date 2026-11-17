/* Five stages taught by real actions. No extra Next buttons. */
(function(){
 'use strict';
 var learned={},decoVersion=null,rubMs=0;
 steps=[
  {id:'shape',stage:'throw',title:'옆면과 속 다듬기',target:'#tools'},
  {id:'decoGroup',stage:'deco',title:'도구로 꾸미기',target:'#dtools'},
  {id:'glazeGroup',stage:'glaze',title:'유약 입히기',target:'#rackGlaze'},
  {id:'load',stage:'fire',title:'가마에 넣고 굽기',target:'#ui-fire-start'},
  {id:'open',stage:'fire',title:'식힌 뒤 꺼내기',target:'#openKiln'},
  {id:'finishGroup',stage:'done',title:'완성작 감상·저장',target:'#openCard'}
 ];

 function exercise(id,title,text,target,extra){return Object.assign({id:id,key:id,title:title,text:text,target:target},extra||{});}
 var courses={
 throw:[
  exercise('shape','모양 잡기 · 컵의 전체 모양을 잡아요','모양 잡기는 넓게 밀고 당겨 큰 곡선을 만들어요. 컵 안내선을 보며 옆면을 조절해 보세요. 손끝 크기로 한 번에 닿는 범위를 바꿔요.','#cv',{tool:'shape',motion:'shape'}),
  exercise('height','모양 잡기 · ↕ 손잡이로 키를 바꿔요','입구 옆 ↕ 손잡이를 위아래로 끌어 컵 안내선의 높이에 맞춰 보세요.','#cv',{tool:'shape',motion:'height'}),
  exercise('zoom','휠로 확대·축소해서 살펴봐요','마우스 휠을 움직이면 작품이 커지거나 작아져요. 휴대폰에서는 두 손가락을 벌리거나 모아요. 실제 도자기 크기는 바뀌지 않아요.','#cv',{motion:'tap'}),
  exercise('trimWidth','깎기 · 날 두께를 조절해요','깎기는 전체 모양을 잡은 뒤 작은 굴곡이나 굽을 세밀하게 다듬는 도구예요. 먼저 날 두께를 조절해 보세요.','#trimWidth',{tool:'trim',motion:'range'}),
  exercise('trimStrength','깎기 · 깎는 강도를 조절해요','오른쪽으로 갈수록 더 깎여요. 최대 강도도 모양 잡기보다 약하므로 조금씩 다듬을 수 있어요.','#trimStrength',{tool:'trim',motion:'range'}),
  exercise('trim','깎기 · 원하는 작은 모양을 다듬어요','날이 닿는 좁은 곳의 흙만 덜어내요. 가만히 누르거나 바깥으로 당기면 깎이지 않아요.','#cv',{tool:'trim',section:false,motion:'drag'}),
  exercise('depth','속·두께 · 속 깊이를 바꿔요','슬라이더를 왼쪽으로 줄이면 바닥이 두꺼워지고, 오른쪽으로 늘리면 깊어져요. 바깥 모양은 유지돼요.','#cavityDepth',{tool:'thick',motion:'range'}),
  exercise('inside','속·두께 · 안쪽 벽을 좌우로 끌어요','단면의 오른쪽 안쪽 벽을 잡아요. 바깥으로 벌리면 얇아지고 안으로 좁히면 두꺼워져요.','#cv',{tool:'thick',section:true,motion:'drag'}),
  exercise('smoothOuter','매끈하게 · 바깥벽을 문질러요','바깥벽을 고른 뒤 표시된 부분을 가볍게 문질러 작은 굴곡을 다듬어 보세요.','#cv',{tool:'sponge',section:false,motion:'rub'}),
  exercise('smoothInner','매끈하게 · 안쪽 벽도 다듬어요','안쪽벽을 고르면 단면으로 바뀌어요. 오른쪽 안쪽 벽을 문질러 표면을 정리해 보세요.','#cv',{tool:'sponge',section:true,motion:'rub'})
 ],
 deco:[
  exercise('brushSize','붓 · 굵기를 조절해요','붓 아래에서 색과 불투명도도 고를 수 있어요. 먼저 굵기 슬라이더를 움직여 보세요.','#dsize',{deco:'brush',motion:'range'}),
  exercise('brush','붓 · 작품 위에 선을 그려요','누른 채 끌어 자유롭게 그려 보세요. 한 바퀴 띠를 고르면 같은 높이로 둘레를 따라 이어져요.','#cv',{deco:'brush',motion:'circle'}),
  exercise('stampChoice','도장 · 찍을 모양을 골라요','꽃·잎·별 등 원하는 모양을 눌러 보세요. 크기와 색도 아래에서 바꿀 수 있어요.','#stamps',{deco:'stamp'}),
  exercise('stamp','도장 · 작품을 눌러 찍어요','선택한 도장 모양을 표시된 곳에 찍어 보세요.','#cv',{deco:'stamp',motion:'tap'}),
  exercise('incised','조각칼 · 음각으로 홈을 새겨요','음각·파내기를 고른 뒤 작품 위를 끌어요. 들어간 홈이 생겨요.','#cv',{deco:'carve',mode:'incised',motion:'circle'}),
  exercise('raised','조각칼 · 양각으로 무늬를 올려요','양각·돋우기를 고른 뒤 작품 위를 끌어요. 솟은 무늬가 생겨요.','#cv',{deco:'carve',mode:'raised',motion:'circle'}),
  exercise('erase','지우개 · 그린 무늬를 지워요','방금 꾸민 곳을 문질러 보세요. 굵기를 키우면 넓게 지울 수 있어요.','#cv',{deco:'erase',motion:'rub'}),
  exercise('rotate','오른쪽 돌리기 버튼을 눌러요','화면 위 오른쪽의 강조된 회전 버튼을 누르면 작품이 돌아가요. 뒷면도 보고 꾸밀 수 있어요.','#rotR'),
  exercise('topView','위에서 보고 꾸밀 수도 있어요','위를 누르면 입구와 안쪽을 내려다봐요. 윗면에서도 붓·도장·조각칼을 쓸 수 있어요.','#wheelTop-deco'),
  exercise('bottomView','밑바닥도 꾸밀 수 있어요','밑바닥을 눌러 보세요. 이름이나 표시를 넣을 때도 사용할 수 있어요.','#wheelBottom-deco'),
  exercise('sideView','옆면으로 돌아와요','옆면을 누르면 원래 시점으로 돌아와요. 실수하면 되돌리기·다시하기를 사용해요.','#wheelSide-deco')
 ],
 glaze:[
  exercise('baseColor','바탕 유약 · 전체 색을 골라요','바탕색 칠하기를 고른 뒤 색을 누르면 작품 전체에 입혀져요. 원하는 색을 직접 고를 수도 있어요.','#swatches',{glaze:'base'}),
  exercise('finish','표면 · 유광과 무광을 골라요','유광은 빛이 반사되고, 무광은 부드럽게 퍼져요. 원하는 느낌을 눌러 보세요.','#finish',{glaze:'base'}),
  exercise('dip','담그기 · 다른 색을 덧입혀요','담그기를 켜고 위에서·아래에서 중 방향을 골라요. 깊이와 기울기로 색이 입혀질 범위를 바꿀 수 있어요.','#dip [data-dip=custom]',{glaze:'base'}),
  exercise('dipColor','담그기 · 덧입힐 색을 골라요','고른 방향에서 담근 부분에 덧입힐 색이에요. 직접 색을 고를 수도 있어요.','#dots',{glaze:'base'}),
  exercise('dipDepth','담그기 · 깊이로 범위를 바꿔요','슬라이더를 움직여 색이 어디까지 입혀지는지 확인해 보세요.','#dipDepth',{glaze:'base',motion:'range'}),
  exercise('dipAngle','담그기 · 기울기도 바꿀 수 있어요','기울기 슬라이더를 움직여 경계선을 비스듬하게 만들어 보세요. 0°에서는 수평이에요.','#dipAngle',{glaze:'base',motion:'range'}),
  exercise('effect','표면 무늬 · 없음·점박이·잔금','점박이는 작은 점, 잔금은 유약의 가는 균열을 표현해요. 하나를 골라 보세요.','#fx',{glaze:'base'}),
  exercise('brushColor','붓 유약 · 부분에 칠할 색을 골라요','붓으로 유약 칠하기를 고르고 색을 골라요. 전체 색 위에 직접 칠한 부분만 더해져요.','#glazeBrushSwatches',{glaze:'brush'}),
  exercise('glazeOpacity','붓 유약 · 불투명도를 조절해요','낮출수록 바탕이 비쳐요. 0%에서는 칠해지지 않으니 조금 올려 두세요.','#glazeOpacity',{glaze:'brush',motion:'range'}),
  exercise('glazeSize','붓 유약 · 붓 굵기를 조절해요','가늘게 선을 그리거나 넓게 칠할 수 있어요. 슬라이더를 움직여 보세요.','#glazeBrushSize',{glaze:'brush',motion:'range'}),
  exercise('glazePaint','붓 유약 · 원하는 곳을 칠해요','작품 위를 누른 채 끌어 보세요. 붓이 닿은 부분에만 유약이 입혀져요.','#cv',{glaze:'brush',motion:'circle'})
 ],
 done:[
  exercise('photoSize','완성 사진 · 작품 크기를 바꿔요','−·슬라이더·＋ 모두 사용할 수 있어요. 작품 크기를 한 번 조절해 보세요.','#ui-photo-size-controls'),
  exercise('photoMove','완성 사진 · 작품을 옮겨요','작품을 누른 채 끌면 사진 안에서 위치가 바뀌어요. 보기 초기화로 원래대로 돌릴 수 있어요.','#cv',{motion:'drag'}),
  exercise('background','완성 사진 · 배경을 골라요','배경 창에서 보유한 배경을 고르고 사용하기를 눌러요. 다른 배경은 포인트로 구매할 수 있으며, 지금 배경을 다시 선택해도 돼요.','#ui-background-picker'),
  exercise('orbit','360° 감상 · 작품을 돌려 봐요','360° 감상을 켜고 작품을 끌어 보세요. 위·아래·뒤쪽까지 돌려 볼 수 있어요.','#finished360Canvas',{orbit:true,motion:'circle'}),
  exercise('photoReturn','완성 사진으로 돌아와요','같은 스위치를 다시 눌러 사진으로 돌아와요. 여기서 카드로 저장·공유를 열 수 있어요.','#ui-result-toggle')
 ]};
 function stageCourse(){return current()&&courses[current().stage]||[];}
 function pending(){return stageCourse().find(function(l){return !learned[l.id];});}
 function resolve(l){l=Object.assign({},l);l.target=document.querySelector(l.target);var button;
  if(l.tool&&tool!==l.tool){button=document.querySelector('#tools [data-t="'+l.tool+'"]');l.title=({shape:'모양 잡기',trim:'깎기',thick:'속·두께',sponge:'매끈하게'})[l.tool]+'를 골라 주세요';}
  else if(l.deco&&dTool!==l.deco){button=document.querySelector('#dtools [data-d="'+l.deco+'"]');l.title=({brush:'붓',stamp:'도장',carve:'조각칼',erase:'지우개'})[l.deco]+'를 골라 주세요';}
  else if(l.mode&&dCarveMode!==l.mode){button=document.querySelector('#carveMode [data-cm="'+l.mode+'"]');l.title=l.mode==='incised'?'음각·파내기를 골라 주세요':'양각·돋우기를 골라 주세요';}
  else if(l.glaze&&$(l.glaze==='brush'?'rackGlazeBrush':'rackGlazeBase').getAttribute('aria-pressed')!=='true'){button=$(l.glaze==='brush'?'rackGlazeBrush':'rackGlazeBase');l.title=l.glaze==='brush'?'붓으로 유약 칠하기를 골라 주세요':'바탕색 칠하기를 골라 주세요';}
  else if(['dipColor','dipDepth','dipAngle'].indexOf(l.id)>=0&&!st.dip){button=document.querySelector('#dip [data-dip=custom]');l.title='먼저 담그기를 켜 주세요';}
  else if(typeof l.section==='boolean'&&secOn!==l.section){button=l.tool==='sponge'?document.querySelector('#ui-smooth-surface [data-smooth="'+(l.section?'inner':'outer')+'"]'):$(l.section?'sectionView':'solidView');l.title=l.section?'안쪽 벽이 보이도록 단면을 골라 주세요':'바깥벽을 볼 수 있도록 전체를 골라 주세요';}
  else if(l.deco&&window.TodakWheel&&(TodakWheel.top()||TodakWheel.bottom())){button=$('wheelSide-deco');l.title='먼저 옆면으로 돌아와 주세요';}
  else if(l.orbit&&!document.body.classList.contains('ui-inspecting')){button=$('ui-result-toggle');l.title='360° 감상을 켜 주세요';}
  if(button){l.target=button;l.key+='-choose';l.motion='tap';l.preparing=true;}
  if(!l.preparing&&l.target===cv&&((l.deco==='brush'||l.deco==='stamp')&&dOpacity<=0||l.glaze==='brush'&&Number($('glazeOpacity').value)<=0)){l.target=$(l.glaze?'glazeOpacity':'paintOpacity');l.title='불투명도를 올려 주세요';l.text='0%에서는 색이 보이지 않아요. 오른쪽으로 올린 뒤 작품에 칠해 보세요.';l.key+='-opacity';l.motion='range';l.preparing=true;}
  return l;
 }
 function lesson(){
  var s=current();if(!s)return null;
  if(['throw','deco','glaze'].indexOf(s.stage)>=0){
   if(done)return {key:'practice',title:'충분히 연습한 뒤 다음 단계로 가요',text:({throw:'네 가지 도구를 더 써 보세요. 준비되면 꾸미러 가기를 눌러요.',deco:'원하는 무늬를 더 꾸며 보세요. 준비되면 유약 바르기를 눌러요.',glaze:'색과 표면을 더 바꿔 보세요. 준비되면 가마에 넣기를 눌러요.'})[s.stage],target:$('nextBtn')};
   var p=pending();return p&&resolve(p);
  }
  if(s.id==='load')return {key:fstep,title:fstep==='prep'?'가마에 넣고 굽기를 눌러 주세요':fstep==='loaded'?'문 닫고 굽기를 눌러 주세요':'작품을 가마에 넣는 중이에요',text:'굽기가 시작되면 온도가 올라갔다가 식어요. 이 과정에서는 기다리면 돼요.',target:fstep==='prep'||fstep==='loaded'?$('ui-fire-start'):$('fireTitle')};
  if(s.id==='open')return {key:fstep,title:fstep==='ready'?'가마 문을 열어 작품을 꺼내요':'굽고 식히는 중이에요',text:fstep==='ready'?'문 열기를 누르면 작품이 나와요. 완성 사진이 준비된 뒤 감상 안내가 이어져요.':'온도가 내려갈 때까지 기다려요. 식으면 열기 버튼이 나타나요.',target:fstep==='ready'?$('openKiln'):$('fireTitle')};
  if(s.id==='finishGroup'){
   var p=pending();if(p)return resolve(p);
   if($('cardDlg').hidden)return {key:'photo',title:'작품 카드를 열어 저장해요',text:'작품은 내 진열장에도 남아요. 카드로 저장·공유에서 이미지 파일을 만들 수 있어요.',target:$('openCard')};
   if(learned.saved)return {key:'saved',title:'저장 결과를 확인하고 닫아요',text:'저장 결과를 확인한 뒤 닫아요. 완성작의 ‘이 작품으로 도전 본 만들기’에서 어려운 모양도 본으로 등록하고, 내 도전 목록의 공유에서 코드·링크를 보낼 수 있어요.',target:$('cardClose')};
   return {key:'save',title:'이름·용도를 적고 저장해요',text:'이름과 용도는 선택이에요. 이미지로 저장 또는 공유 중 원하는 방법을 눌러요. 성공하면 닫기 안내가 나타나요.',target:$('saveCard')};
  }
 }
 function learn(id){var p=pending();if(!active||done||!p||p.id!==id)return;learned[id]=true;contactMs=0;rubMs=0;var stage=current().stage;if(!pending()&&stage!=='done')mark(stage==='throw'?'shape':stage==='deco'?'decoGroup':'glazeGroup');if(!ptr.down)engaged=false;update();}
 function state(){var l=lesson(),s=current();return {stage:s&&s.stage,step:s&&s.id,key:l&&l.key,title:l&&l.title,done:done,exercise:l&&l.id,exerciseNumber:Math.max(1,stageCourse().findIndex(function(p){return !learned[p.id];})+1),exerciseTotal:l&&l.id?stageCourse().length:0,learned:Object.assign({},learned)};}
 function update(){if(active)route();}
 var ready=gestureReady;gestureReady=function(){var l=active&&lesson();return l?l.target===cv:ready();};
 var target=intendedTarget;intendedTarget=function(){var l=active&&lesson();return l&&l.target||target();};
 var markAction=mark;mark=function(id){
  if(!active||!current())return;
  if(id==='save'&&current().id==='finishGroup'){learned.saved=true;engaged=false;update();return;}
  if(id==='shape'&&courses.throw.some(function(l){return !learned[l.id];}))return;
  if(id==='decoGroup'&&courses.deco.some(function(l){return !learned[l.id];}))return;
  if(id==='glazeGroup'&&courses.glaze.some(function(l){return !learned[l.id];}))return;
  if(id==='finishGroup')return;
  if(id==='load'&&['closing','firing','cooling','ready'].indexOf(fstep)<0)return;
  var wasDone=done,result=markAction(id);
  if(!wasDone&&done&&innerWidth<600&&['throw','deco','glaze'].indexOf(current().stage)>=0)setSheet(true);
  return result;
 };

 var touch=touchClay;touchClay=function(dt){var beforeR=active&&current()&&current().id==='shape'?st.radii.slice():null,beforeI=beforeR&&st.inner.slice(),beforeH=st.height,result=touch(dt);if(beforeR&&ptr.contact){if(tool==='shape'&&st.radii.some(function(v,i){return Math.abs(v-beforeR[i])>.0001;}))learn('shape');if(Math.abs(st.height-beforeH)>.001)learn('height');if(tool==='thick'&&st.inner.some(function(v,i){return Math.abs(v-beforeI[i])>.0001;}))learn('inside');if(tool==='sponge'){var p=pending();if(p&&(p.id==='smoothOuter'&&!secOn&&ptr.smoothSide==='outer'||p.id==='smoothInner'&&secOn&&ptr.smoothSide==='inner')){if(Math.hypot(ptr.x-ptr.sx,ptr.y-ptr.sy)>2)rubMs+=dt;if(rubMs>=220)learn(p.id);}}}return result;};
 var heightBefore=setHeight;setHeight=function(){var h=st.height,result=heightBefore.apply(this,arguments);if(ptr.down&&ptr.mode==='pull'&&Math.abs(h-st.height)>.001)learn('height');return result;};
 cv.addEventListener('pointerdown',function(){rubMs=0;},true);
 window.addEventListener('todak-trimmed',function(){learn('trim');});
 function inkSample(hit){if(!hit)return '';var x=Math.min(TW-3,Math.max(0,Math.floor(hit.u*TW))),y=Math.min(TH-3,Math.max(0,Math.floor((1-hit.v)*TH)));return Array.from(paint.x.getImageData(x,y,3,3).data).join(',')+'|'+Array.from(carve.x.getImageData(x,y,3,3).data).join(',');}
 var decorate=applyDeco;applyDeco=function(hit){var l=active&&lesson(),before=texVer,erasing=l&&l.id==='erase'&&dTool==='erase',ink=erasing?inkSample(hit):'',result=decorate.apply(this,arguments);if(active&&l&&!l.preparing&&texVer!==before){if(dTool==='brush'&&dOpacity>0)learn('brush');if(dTool==='stamp'&&dOpacity>0)learn('stamp');if(dTool==='carve')learn(dCarveMode==='raised'?'raised':'incised');if(erasing&&ink!==inkSample(hit))learn('erase');}return result;};
 window.addEventListener('todak-glaze-painted',function(){learn('glazePaint');});
 window.addEventListener('todak-inspection-rotated',function(){if(document.body.classList.contains('ui-inspecting'))learn('orbit');});
 var inputLessons={trimWidth:'trimWidth',trimStrength:'trimStrength',cavityDepth:'depth',dsize:'brushSize',dipDepth:'dipDepth',dipAngle:'dipAngle',glazeOpacity:'glazeOpacity',glazeBrushSize:'glazeSize',photoObjectSize:'photoSize'};
 document.addEventListener('input',function(e){if(!active||!current()||!e.isTrusted)return;var l=lesson();if(l&&!l.preparing){var id=inputLessons[e.target.id];if(id)learn(id);customColor(e);}});
 function colorApplied(brush){var l=lesson();if(l&&!l.preparing)learn(brush?'brushColor':'baseColor');}
 function customColor(e){var row=e.target.closest('.ui-direct-color'),color=row&&row.querySelector('input[type=color]');if(!color)return;if(e.target!==color&&!(e.type==='change'&&e.target.matches('.ui-color-code')&&/^#?[0-9a-f]{6}$/i.test(e.target.value.trim())))return;if(color.id==='glazeColor')colorApplied(false);if(color.id==='ui-brush-color')colorApplied(true);if(color.id==='ui-dip-color')learn('dipColor');}
 document.addEventListener('change',function(e){if(!active||!current())return;if(e.target.id==='realPhotoScene')learn('background');if(e.target.id==='ui-result-360'&&!e.target.checked)learn('photoReturn');if(e.isTrusted)customColor(e);});
 document.addEventListener('click',function(e){if(!active||!current()||!e.isTrusted)return;var l=lesson();if(!l)return;
  if(e.target.closest('#swatches [data-g]'))colorApplied(false);
  if(e.target.closest('#glazeBrushPalette [data-brush-glaze]'))colorApplied(true);
  var picks=[['#stamps [data-s]','stampChoice'],['#finish [data-f]','finish'],['#dip [data-dip=custom]','dip'],['#dots [data-g]','dipColor'],['#fx [data-x]','effect'],['#rotR','rotate'],['#wheelTop-deco','topView'],['#wheelBottom-deco','bottomView'],['#wheelSide-deco','sideView'],['#photoSizeLess,#photoSizeMore','photoSize']];
  picks.forEach(function(p){if(e.target.closest(p[0])&&!l.preparing)learn(p[1]);});update();
 });
 var zoomStart=null;cv.addEventListener('wheel',function(){var before=Z;setTimeout(function(){if(Math.abs(Z-before)>.0001)learn('zoom');},0);},true);cv.addEventListener('pointerdown',function(){if(active&&pending()?.id==='zoom')zoomStart=Z;},true);document.addEventListener('pointerup',function(){if(zoomStart!==null){var before=zoomStart;zoomStart=null;setTimeout(function(){if(Math.abs(Z-before)>.0001)learn('zoom');},0);}},true);
 var panStart=null;cv.addEventListener('pointerdown',function(){if(active&&lesson()&&lesson().id==='photoMove')panStart=TodakRealPhoto.renderPan();},true);
 document.addEventListener('pointerup',function(){if(panStart){var before=panStart;panStart=null;setTimeout(function(){var after=TodakRealPhoto.renderPan();if(Math.hypot(after.x-before.x,after.y-before.y)>.5)learn('photoMove');},0);}},true);
 $('cardClose').addEventListener('click',function(){if(active&&current().id==='finishGroup'&&learned.saved)finish(false);});
 var fresh=freshClay;freshClay=function(){learned={};decoVersion=null;window.dispatchEvent(new Event('todak-tutorial-reset'));return fresh.apply(this,arguments);};
 tutorialGuidance.describe=function(){var l=lesson();return l?[l.title,l.text,l.motion==='range'?'좌우로 조절':l.target===cv&&l.motion!=='tap'?'누른 채 끌기':'누르기']:null;};
 tutorialGuidance.dim=function(){return false;};
 var manual=tutorialGuidance.manual;tutorialGuidance.manual=function(){return current()&&current().id==='finishGroup'||manual();};
 var finishBefore=finish;finish=function(skipped){if(skipped)return finishBefore(skipped);cancelAdvance();if(routeTimer){clearInterval(routeTimer);routeTimer=null;}complete=true;active=false;engaged=false;try{localStorage.setItem(KEY,'complete');}catch(_){}hideGuide();$('nextBtn').disabled=false;lockHome();toast('첫 작품을 완성했어요. 홈에서 언제든 튜토리얼을 다시 볼 수 있어요.');};
 window.TodakTutorialLesson={state:state,gesture:function(){var l=lesson();if(!l)return null;if(l.target!==cv)return {motion:l.motion||'tap'};var t=.55,x,y,r=rAt(t),wheel=window.TodakWheel;
  if(l.id==='height'){var h=handlePos();return {x:h.x,y:h.y,motion:'height'};}
  if(l.id==='inside'||l.id==='smoothInner'){t=Math.max(.55,st.floor/st.height+(1-st.floor/st.height)*.4);x=CX+innerAt(t)*SV;y=BASE-st.height*t*SV;}
  else{x=CX+r*SV*(st.stage==='throw'?.82:.15);y=BASE-st.height*t*SV+TILT*r*SV*Math.sqrt(1-Math.pow(st.stage==='throw'?.82:.15,2));}
  if(wheel&&(wheel.top()||wheel.bottom())&&st.stage!=='throw'){var p=wheel.bottom()?wheel.bottomLayout():wheel.layout();x=p.x+p.r*.2;y=p.y+p.r*.15;}
  return {x:x,y:y,motion:l.motion||'tap'};
 }};
 window.TodakTutorialDraft={capture:function(){return active?{version:2,id:current().id,done:done,learned:Object.assign({},learned)}:null;},restore:function(saved){if(!saved)return;var at=steps.findIndex(function(s){return s.id===saved.id;});if(at<0)return;stopOptionalTutorial();active=true;complete=false;index=at;done=!!saved.done;engaged=false;contactMs=0;learned=Object.assign({},saved.learned||{});if(['throw','deco','glaze'].indexOf(current().stage)>=0)done=stageCourse().every(function(l){return !!learned[l.id];});if(saved.id==='finishGroup'){done=false;if(saved.done)learned.saved=true;}window.TodakTutorialCup?.ensure();if(!routeTimer)routeTimer=setInterval(route,160);focusStep();lockHome();}};
})();
