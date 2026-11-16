/* A completed action, an observation and an asynchronous result are different states. */
var tutorialGuidance;
(function(){
 'use strict';
 var context=null,photoFrame=false,photoLoadSettled=false,photoTimer=null,photoEpoch=0;
 var practice=['shape','inside','smooth','smoothInner','brush','brushRing','stamp','carve','raised','carveRing','glazePaint'];
 var feedback={
  shape:['모양이 바뀌었어요','원하는 만큼 더 빚어 보세요. 준비되면 계속 자유롭게 연습할 수 있어요.'],
  inside:['속과 두께를 다듬었어요','안쪽 벽과 바닥을 더 살펴본 뒤 계속 자유롭게 연습할 수 있어요.'],
  smooth:['겉면을 다듬었어요','더 문질러 보거나 다음 안내로 이어갈 수 있어요.'],
  smoothSection:['단면으로 전환했어요','안쪽 벽과 바닥의 두께를 살펴본 뒤 계속 자유롭게 연습할 수 있어요.'],
  smoothInner:['안쪽 표면을 다듬었어요','원하는 만큼 더 다듬은 뒤 계속 자유롭게 연습할 수 있어요.'],
  solid:['전체 모양으로 전환했어요','전체 모양을 살펴보세요. 준비되면 꾸미러 가기를 눌러요.'],
  brush:['붓으로 선을 그렸어요','원하는 무늬를 더 그려 본 뒤 계속 자유롭게 연습할 수 있어요.'],
  brushRing:['한 바퀴 띠를 그렸어요','다른 높이에도 그려 보거나 다른 도구도 이어서 사용해 봐요.'],
  stampChoice:['도장 모양을 선택했어요','다음 안내에서 선택한 모양을 작품에 찍어 봐요.'],
  stamp:['작품에 도장을 찍었어요','크기와 색상을 바꿔 더 찍어 볼 수 있어요.'],
  carve:['음각 무늬를 새겼어요','원하는 무늬를 더 새겨 본 뒤 계속 자유롭게 연습할 수 있어요.'],
  raised:['양각 무늬를 만들었어요','솟은 무늬를 더 그려 본 뒤 계속 자유롭게 연습할 수 있어요.'],
  carveRing:['둘레에 띠를 새겼어요','더 꾸며 보거나 다른 도구도 이어서 사용해 봐요.'],
  rotate:['반대쪽으로 돌렸어요','다른 면도 꾸며 보세요. 준비되면 유약 바르기를 눌러요.'],
  glazeBase:['바탕 유약 도구를 선택했어요','다음 안내에서 작품 전체에 입힐 색을 골라요.'],
  color:['바탕 유약 색을 선택했어요','도자기의 색을 살펴보고 계속 자유롭게 연습할 수 있어요.'],
  finish:['표면의 반짝임을 선택했어요','유광과 무광을 비교해 본 뒤 계속 자유롭게 연습할 수 있어요.'],
  dip:['담그는 깊이를 조절했어요','색이 입혀지는 범위를 살펴보고 계속 자유롭게 연습할 수 있어요.'],
  effect:['표면 무늬를 선택했어요','원하는 질감을 비교해 본 뒤 계속 자유롭게 연습할 수 있어요.'],
  glazeBrush:['유약 붓칠 도구를 선택했어요','다음 안내에서 붓의 불투명도를 조절해요.'],
  glazeOpacity:['붓 유약의 불투명도를 바꿨어요','다음 안내에서 작품 위에 직접 칠해 봐요.'],
  glazePaint:['작품에 유약을 칠했어요','원하는 만큼 더 칠해 보세요. 준비되면 굽기를 눌러요.'],
  heat:['불 세기를 선택했어요','다음 안내에서 작품을 가마에 넣고 구워요.'],
  load:['작품을 가마에 넣었어요','문이 닫히고 굽고 식히는 과정을 확인해요.'],
  open:['가마 문을 열었어요','완성된 작품을 꺼내고 있어요.'],
  photo:['완성 사진을 확인했어요','다음 안내에서 작품을 직접 돌려 봐요.'],
  inspect360:['작품을 돌려 보았어요','다음 안내에서 사진 속 작품 크기를 조절해요.'],
  size:['사진 속 작품 크기를 바꿨어요','− / 슬라이더 / ＋로 더 조절한 뒤 계속 자유롭게 연습할 수 있어요.'],
  background:['사진 배경을 선택했어요','작품과 배경을 함께 살펴보고 계속 자유롭게 연습할 수 있어요.'],
  title:['작품 이름을 입력했어요','다음 안내에서 용도를 적을 수 있어요.'],
  purpose:['용도를 입력했어요','다음 안내에서 작품 카드를 저장하거나 공유해요.'],
  save:['카드 저장·공유를 요청했어요','저장된 파일이나 공유 결과를 확인한 뒤 계속 자유롭게 연습할 수 있어요.'],
  closeCard:['작품 화면으로 돌아왔어요','다음 안내에서 작품과 닮은 물건을 찾아봐요.'],
  closeSearch:['검색 창을 닫았어요','다음 안내에서 홈으로 돌아가요.'],
  sound:['소리 설정을 바꿨어요','다음 안내로 이어갈 수 있어요.']
 };
 function resetContext(){var previous=context,same=previous&&previous.step===current();context={step:current(),events:{},size:$('photoObjectSize').value,opacity:$('glazeOpacity').value,searchPending:!!(same&&previous.searchPending),searchReady:!!(same&&previous.searchReady),searchMatches:same?previous.searchMatches:0,photoConfirmed:false};}
 function ensureContext(){if(!context||context.step!==current())resetContext();return context;}
 var focusBefore=focusStep;focusStep=function(){resetContext();return focusBefore.apply(this,arguments);};
 document.addEventListener('click',function(e){if(!active||!current())return;var c=ensureContext(),id=current().id;
  if(id==='solid'&&e.target.closest('#solidView'))c.events.solid=true;
  if(id==='sound'&&e.target.closest('#sound'))c.events.sound=true;
  if(id==='search'&&e.target.closest('#searchImage')&&!$('searchImage').disabled){c.searchPending=true;c.searchReady=false;}
  if(id==='search'&&e.target.closest('#openSearch'))setTimeout(function(){if(active&&current()&&current().id==='search'&&!$('searchDlg').hidden&&ensureContext().searchReady)mark('search');},0);
 },true);
 var markBefore=mark;mark=function(id){
  if(!active||!current()||current().id!==id)return;var c=ensureContext();
  if(id==='photo'&&(!photoFrame||revealing))return;
  if((id==='glazeBase'||id==='glazeBrush')&&!c.events[id])return;
  if((id==='title'||id==='purpose')&&!c.events.textCommit)return;
  if((id==='solid'||id==='sound')&&!c.events[id])return;
  if(id==='size'&&$('photoObjectSize').value===c.size)return;
  if(id==='glazeOpacity'&&$('glazeOpacity').value===c.opacity)return;
  if(id==='search'&&!c.searchReady)return;
  if(id==='load'&&['loaded','closing','firing','cooling','ready'].indexOf(fstep)<0)return;
  return markBefore.apply(this,arguments);
 };
 window.addEventListener('todak-image-search-finished',function(e){if(!active||!current()||current().id!=='search')return;var c=ensureContext();if(!c.searchPending)return;c.searchPending=false;c.searchReady=true;c.searchMatches=Number(e.detail&&e.detail.matches)||0;if(!$('searchDlg').hidden)mark('search');});
 document.addEventListener('click',function(e){if(!active||!current())return;var c=ensureContext();['glazeBase','glazeBrush'].forEach(function(id){if(e.target.closest(id==='glazeBase'?'#rackGlazeBase':'#rackGlazeBrush'))c.events[id]=true;});
  if(e.target.closest('#saveCard,#shareBtn')){while(current()&&['title','purpose'].indexOf(current().id)>=0){if(current().id==='title'&&!$('title').value.trim())break;ensureContext().events.textCommit=true;mark(current().id);if(done)advance();else break;}}
  if(e.target.closest('#closeSearch')&&current().id==='search'){advance();mark('closeSearch');}
 },true);
 ['title','purpose'].forEach(function(id){$(id).addEventListener('blur',function(){if(active&&current()&&current().id===id&&(id==='purpose'||this.value.trim())){ensureContext().events.textCommit=true;mark(id);}});$(id).addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.isComposing){e.preventDefault();$(id==='title'?'purpose':'saveCard').focus();}});});
 function beginPhoto(){photoEpoch++;var epoch=photoEpoch;photoFrame=false;photoLoadSettled=!(window.TodakLoad3D);clearTimeout(photoTimer);
  if(window.TodakLoad3D){Promise.resolve(TodakLoad3D()).then(function(){if(epoch===photoEpoch){photoLoadSettled=true;dirty=true;}},function(){if(epoch===photoEpoch){photoLoadSettled=true;dirty=true;}});}
  // A failed/slow optional renderer can still show the finished piece in the existing fallback.
  photoTimer=setTimeout(function(){if(epoch===photoEpoch&&st.stage==='done'){photoLoadSettled=true;dirty=true;}},12000);
 }
 function resultReady(){var ready=photoFrame&&!revealing,control=$('ui-result-360');if(control)control.disabled=!!(active&&current()&&current().stage==='done'&&!ready);if(ready&&active&&current()&&current().id==='photo'&&!done)setTimeout(function(){if(active&&current()&&current().id==='photo')mark('photo');},0);return ready;}
 var stageBefore=setStage;setStage=function(stage){var entering=stage==='done'&&st.stage!=='done';if(entering)beginPhoto();var result=stageBefore.apply(this,arguments);resultReady();return result;};
 var photoBefore=drawPhoto;drawPhoto=function(){var result=photoBefore.apply(this,arguments);if(st.stage==='done'&&photoOn&&photoLoadSettled&&!photoFrame){photoFrame=true;setTimeout(function(){if(active)route();},0);}return result;};
 var sizeRow=$('photoSizeMore').parentElement;sizeRow.id='ui-photo-size-controls';sizeRow.style.borderRadius='12px';sizeRow.setAttribute('role','group');sizeRow.setAttribute('aria-label','사진 속 도자기 크기: 줄이기, 슬라이더, 늘리기');
 var targetBefore=intendedTarget;intendedTarget=function(){
  if(current()){
   if(current().id==='size')return sizeRow;
   if(current().id==='search'&&!$('searchDlg').hidden){var c=ensureContext();if(c.searchReady)return c.searchMatches?$('imageMatches'):$('searchStatus');if(c.searchPending)return $('searchStatus');}
  }
  return targetBefore.apply(this,arguments);
 };
 tutorialGuidance={
  waitingForPhoto:function(){var ready=resultReady();return active&&current()&&((current().id==='open'&&done)||(current().stage==='done'&&!ready));},
  photoConfirmable:function(){return current()&&current().id==='photo'&&photoFrame&&!revealing&&!done;},
  confirmPhoto:function(){if(!this.photoConfirmable())return false;ensureContext().photoConfirmed=true;mark('photo');if(done)advance();return true;},
  dim:function(){return !done&&!engaged&&!ptr.down&&!(current()&&(current().id==='photo'||current().id==='search'&&ensureContext().searchPending));},
  feedback:function(){var id=current().id;if(id==='search'){var c=ensureContext();return c.searchMatches?['검색 결과가 준비됐어요','아래 결과를 둘러본 뒤 닫기를 눌러요.']:['검색 안내가 준비됐어요','아래 결과나 연결 안내를 확인한 뒤 닫기를 눌러요.'];}return feedback[id]||['이 단계를 확인했어요','준비되면 계속 자유롭게 연습할 수 있어요.'];},
  status:function(){return current()&&current().id==='search'&&ensureContext().searchPending?'검색 중':null;},
  practice:function(){return current()&&practice.indexOf(current().id)>=0;}
 };
 // Reading search results ends with the real Close control; no separate tutorial button.
 tutorialGuidance.manual=function(){return current()&&current().id==='search';};
 window.TodakTutorialGuidance={state:function(){return{photoReady:photoFrame&&!revealing,photoLoading:!photoFrame||revealing,searchPending:!!(context&&context.searchPending),searchReady:!!(context&&context.searchReady),step:current()&&current().id,confirmation:!!tutorialGuidance.manual()};}};
})();
