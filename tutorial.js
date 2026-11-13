/* First visit only. Existing pottery mechanics stay unchanged outside the guide. */
(function(){
 var KEY='todak.tutorial.v1',complete=false,active=false,index=0,done=false,contactMs=0,highlight=null,advanceTimer=null,routeTimer=null,routing=false,engaged=false;
 try{complete=localStorage.getItem(KEY)==='complete';}catch(e){}
 var steps=[
  {id:'shape',stage:'throw',title:'1. 바깥 모양 만들기',target:'[data-t="shape"]',text:'모양 잡기를 고르고 도자기 옆면을 좌우로 끌어 보세요. 위아래로 이동하며 여러 높이를 다듬고, ↕ 손잡이로 키도 바꿀 수 있어요.'},
  {id:'inside',stage:'throw',title:'2. 속과 두께 다듬기',target:'[data-t="thick"]',text:'속·두께 조절을 고른 뒤 오른쪽 안쪽 벽을 잡아 좌우로 움직여 보세요. 초록 점선은 권장 두께예요. 속 깊이 슬라이더를 줄이면 아래쪽이 채워져 와인잔의 기둥을 만들 수 있어요.'},
  {id:'trim',stage:'throw',title:'깎아 만들기',target:'[data-t="trim"]',text:'깎아 만들기를 고르면 흙을 잠깐 말려요. 준비가 되면 바깥 벽에 도구를 대고 안쪽으로 조금 밀거나 위아래로 움직여 깎아 보세요. 안쪽 공간과 바닥은 유지돼요.'},
  {id:'smooth',stage:'throw',title:'겉면 매끈하게',target:'[data-t="sponge"]',text:'매끈하게를 고르고 입체 보기에서 바깥쪽 벽을 잠시 문질러 보세요. 모양을 파내지 않고 작은 굴곡과 물레 자국만 정리해요. 강도를 조절할 수 있고, 입구 가장자리를 문지르면 살짝 둥글어져요. 실수했다면 되돌리기를 쓸 수 있어요.'},
  {id:'smoothSection',stage:'throw',title:'단면으로 안쪽 보기',target:'#sectionView',text:'단면·벽 두께 버튼을 눌러 안쪽 벽을 펼쳐 보세요.'},
  {id:'smoothInner',stage:'throw',title:'안쪽도 매끈하게',target:'[data-t="sponge"]',text:'오른쪽 단면의 안쪽 벽을 문질러 속도 매끈하게 다듬어 보세요.'},
  {id:'solid',stage:'throw',title:'4. 전체 모양 확인하기',target:'#solidView',text:'입체 보기를 눌러 다듬은 전체 모양을 확인하세요. 단면·벽 두께는 언제든 다시 켤 수 있어요.'},
  {id:'brush',stage:'deco',title:'5. 붓으로 그려 보기',target:'[data-d="brush"]',text:'도자기 뒤쪽 도구통에서 붓을 고르고 작품 위에 선을 그려 보세요. 색상, 붓 크기, 불투명도를 바꿀 수 있어요. 불투명도를 낮추면 색이 옅게 쌓여요.'},
  {id:'brushRing',stage:'deco',title:'붓으로 한 바퀴 띠 그리기',target:'[data-d="brush"]',text:'붓에서 한 바퀴 띠를 선택하고 도자기 위를 그려 보세요. 같은 높이에 둘러지는 띠 무늬를 만들어요.'},
  {id:'stampChoice',stage:'deco',title:'도장과 모양 고르기',target:'[data-d="stamp"]',text:'도자기 뒤쪽 도구통에서 도장을 선택한 뒤 아래 도장 모양에서 꽃·잎 등 원하는 모양을 직접 골라 주세요.'},
  {id:'stamp',stage:'deco',title:'6. 도장 찍기',target:'[data-d="stamp"]',text:'고른 모양으로 도자기에 한 번 찍어 보세요. 크기와 색상도 바꿀 수 있어요.'},
  {id:'carve',stage:'deco',title:'7. 새김 무늬 넣기',target:'[data-d="carve"]',text:'도자기 뒤쪽 도구통에서 조각칼을 고르고 작품 위를 문질러 무늬를 새겨 보세요. 지우개와 되돌리기로 장식을 수정할 수 있어요.'},
  {id:'carveRing',stage:'deco',title:'조각칼로 한 바퀴 띠 새기기',target:'[data-d="carve"]',text:'조각칼에서 한 바퀴 띠를 선택하고 도자기 위를 문질러 보세요. 둘레를 따라 홈이 이어져요.'},
  {id:'rotate',stage:'deco',title:'8. 반대쪽도 보기',target:'#rotR',text:'소리 옆의 좌우 화살표를 눌러 도자기를 돌려 보세요. 반대편에도 꾸밀 수 있어요. 휠이나 두 손가락으로 확대할 수 있고, 소리 버튼에서 작업음을 켤 수 있어요.'},
  {id:'color',stage:'glaze',title:'9. 유약 색 고르기',target:'#swatches',text:'유약 색을 하나 골라 보세요. 색 더 보기에서 더 많은 색과 직접 고르는 색을 사용할 수 있어요.'},
  {id:'finish',stage:'glaze',title:'10. 유광과 무광 고르기',target:'#finish',text:'반짝이게 또는 보송하게를 직접 골라 보세요. 굽기 전에는 물레 위에서, 완성 후에는 완성 사진에서 확인해요.'},
  {id:'glazeBrush',stage:'glaze',title:'도구통에서 유약 붓 고르기',target:'#rackGlazeBrush',text:'도자기 뒤쪽 도구통에서 붓칠을 눌러 보세요. 도구를 고른 뒤 옆면이나 위에서 꾸미기에서 원하는 부분에 유약을 칠할 수 있어요.'},
  {id:'glazeOpacity',stage:'glaze',title:'유약 투명도 조절하기',target:'#glazeOpacity',text:'유약 불투명도를 움직여 보세요. 낮추면 바탕이 비치고, 높이면 진하게 칠해져요. 붓 유약 색과 굵기도 고를 수 있어요.'},
  {id:'dip',stage:'glaze',title:'11. 담그는 깊이 정하기',target:'#dip',text:'담가서 덧입히기를 열고 입구만 또는 절반까지를 고른 뒤, 담그는 깊이를 움직여 보세요. 덧입힐 색도 고를 수 있어요.'},
  {id:'effect',stage:'glaze',title:'12. 표면 무늬 확인하기',target:'#fx',text:'없음·점박이·잔금 중 원하는 표면을 골라 보세요. 어떤 항목을 골라도 다음 안내로 이어져요.'},
  {id:'heat',stage:'glaze',title:'13. 불 세기 정하기',target:'#fire',text:'불 세기를 직접 골라 보세요. 약한 불은 안전하고, 센 불은 색 변화나 금이 생길 수 있어요. 고른 뒤 가마로 넘어가요.'},
  {id:'load',stage:'fire',title:'14. 가마에 넣기',target:'#cv',text:'작품을 누르거나 가마 안으로 끌어 넣으세요. 가마가 닫히면 굽기가 시작돼요.'},
  {id:'open',stage:'fire',title:'15. 식힌 뒤 꺼내기',target:'#openKiln',text:'굽기가 끝나면 온도가 내려가는 것을 지켜보세요. 100℃ 이하로 식은 뒤 가마 문 열기를 눌러야 안전해요.'},
  {id:'photo',stage:'done',title:'16. 완성 사진 확인하기',target:'#finishedPhoto',text:'완성 사진을 눌러 보세요. 360° 감상에서는 직접 돌려 안쪽과 바닥도 볼 수 있어요. 물레에서 보기와 전환할 수 있어요. 마우스나 한 손가락으로 끌면 도자기가 이동하고, 좌우 화살표는 도자기를 돌려요.'},
  {id:'inspect360',stage:'done',title:'완성 작품 360도로 보기',target:'#openFinished360',text:'360° 감상을 눌러 작품을 좌우로 돌리고 위아래로 기울여 보세요. 안쪽과 바닥까지 확인한 뒤 닫기를 누르면 안내가 이어져요.'},
  {id:'size',stage:'done',title:'17. 도자기 크기 바꾸기',target:'#photoObjectSize',text:'도구 열기 후 사진 속 도자기 크기의 − / ＋ 버튼을 누르거나 슬라이더를 좌우로 움직여 보세요. 도자기만 커지고 작아져요. 휠·두 손가락 확대와 축소는 배경에 적용돼요. 보기 초기화로 되돌릴 수 있어요.'},
  {id:'background',stage:'done',title:'18. 배경 바꾸기',target:'#realPhotoScene',text:'완성 사진 배경에서 다른 배경을 골라 보세요. 현재 배경은 모두 기본 제공이에요. 유약 변경으로 같은 모양에 다른 유약을 입힐 수도 있어요.'},
  {id:'title',stage:'done',title:'작품 이름 적기',target:'#openCard',text:'카드로 저장·공유를 열고 작품 제목을 적어 주세요. 입력을 마치고 잠시 기다리면 다음 안내로 넘어가요.'},
  {id:'purpose',stage:'done',title:'용도 적기',target:'#purpose',text:'어디에 쓸 작품인지 적어 보세요. 예: 찻잔, 반지 보관함. 입력 후 잠시 기다리면 이어집니다. 평소 용도 입력은 선택 사항이에요.'},
  {id:'save',stage:'done',title:'19. 작품 카드 저장하기',target:'#openCard',text:'적은 작품 이름과 용도를 카드에서 확인하고 이미지로 저장 또는 공유하기를 눌러 주세요. 완성 작품은 내 진열장에도 저장돼요.'},
  {id:'closeCard',stage:'done',title:'카드 창 닫기',target:'#cardClose',text:'저장이 끝났어요. 카드 창의 닫기를 눌러 작품으로 돌아가세요.'},
  {id:'search',stage:'done',title:'20. 닮은 물건 찾기',target:'#openSearch',text:'뭘 닮았을까?를 열고 내 작품 이미지로 찾기를 직접 눌러 보세요. 사진이 외부 검색 서비스로 전송돼요. 결과가 나오면 비교 카드를 만들 수 있어요. 연결이 안 되면 검색용 사진 저장과 Google Lens 안내를 확인하세요.'}
,{id:'closeSearch',stage:'done',title:'검색 창 닫기',target:'#closeSearch',text:'검색 결과나 연결 안내를 확인한 뒤 닫기를 눌러 주세요.'},
  {id:'home',stage:'done',title:'처음 화면으로 돌아가기',target:'#menuBtn',text:'처음 화면을 누르면 안내가 끝나요. 이제 도전하기·내 진열장도 사용할 수 있어요. 모두의 진열장은 준비 중이에요.'}
 ];
 var coach=document.createElement('section');coach.id='tutorialCoach';coach.hidden=true;coach.setAttribute('aria-label','처음 빚기 안내');coach.innerHTML='<div class="tutorialTop"><small id="tutorialCount"></small><button type="button" class="ghost" id="tutorialSkip">건너뛰기</button></div><b id="tutorialTitle"></b><p id="tutorialText"></p><span id="tutorialStatus" role="status"></span>';document.body.appendChild(coach);
 var hand=document.createElement('div');hand.id='tutorialHand';hand.hidden=true;hand.setAttribute('aria-hidden','true');hand.innerHTML='<svg viewBox="0 0 48 56" width="42" height="49"><path d="M17 31V10c0-5 7-5 7 0v15l2-5c2-4 7-2 7 2l1 1c4-3 8 0 7 4 5 0 6 4 4 9l-4 12c-1 4-4 6-8 6H23c-5 0-9-3-11-7L4 33c-3-5 3-9 7-5l6 6" fill="#fff9f0" stroke="#c84e43" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';document.body.appendChild(hand);
 var note=document.createElement('aside');note.id='tutorialHomeNote';note.setAttribute('role','status');note.innerHTML='<strong>처음이라면 <br>자유롭게 빚기부터 시작해 주세요!</strong><span>한 점을 완성하며 사용법을 익히면 <br>도전하기와 다른 메뉴도 열려요.</span>';$('goFree').setAttribute('aria-describedby','tutorialHomeNote');$('goFree').before(note);
 function lockHome(){['goChallenge','goShelf','homeShop','openQuality','shelfBtn'].forEach(function(id){var b=$(id);if(b){b.disabled=!complete;b.setAttribute('aria-disabled',String(!complete));if(!complete)b.title='첫 자유롭게 빚기 안내를 마치면 열려요';else b.removeAttribute('title');}});note.hidden=complete;$('goFree').classList.toggle('tutorialFirstStart',!complete);}
 function current(){return active?steps[index]:null;}
 function lastInStage(){return index===steps.length-1||steps[index+1].stage!==steps[index].stage;}
 function gestureReady(){var id=current().id;return (id==='trim'&&tool==='trim'&&st.trimReady)||(id==='shape'&&tool==='shape')||(id==='inside'&&tool==='thick')||(id==='smooth'&&tool==='sponge'&&!secOn)||(id==='smoothInner'&&tool==='sponge'&&secOn)||(id==='brush'&&dTool==='brush'&&!dRing)||(id==='brushRing'&&dTool==='brush'&&dRing)||(id==='stamp'&&dTool==='stamp')||(id==='carve'&&dTool==='carve'&&!dRing)||(id==='carveRing'&&dTool==='carve'&&dRing);}
 function intendedTarget(){
  var step=current();if(step.id==='inspect360')return $('finished360').open?$('closeFinished360'):$('openFinished360');if(step.id==='sound')return $('sound');
  if(step.id==='stampChoice')return dTool==='stamp'?document.querySelector('#stamps [data-s]'):document.querySelector('[data-d="stamp"]');
  if(done&&lastInStage()&&step.stage!=='done'&&step.stage!=='fire')return $('nextBtn');
  if(!$('cardDlg').hidden){if(step.id==='title')return $('title');if(step.id==='purpose')return $('purpose');if(step.id==='save'&&!done)return !$('saveCard').hidden?$('saveCard'):$('shareBtn');return $('cardClose');}
  if(!$('searchDlg').hidden)return step.id==='search'&&!done?$('searchImage'):$('closeSearch');
  if(step.id==='smooth'&&tool==='sponge'&&secOn)return $('solidView');
  if(step.id==='smoothInner'&&tool==='sponge'&&!secOn)return $('sectionView');
  if(!dRing&&((step.id==='brushRing'&&dTool==='brush')||(step.id==='carveRing'&&dTool==='carve')))return document.querySelector('#ring [data-r="1"]');
  if((step.id==='brush'&&dTool==='brush'&&dRing)||(step.id==='carve'&&dTool==='carve'&&dRing))return document.querySelector('#ring [data-r="0"]');
  if(gestureReady())return cv;
  if(step.id==='dip')return st.dip?$('dipDepth'):document.querySelector('#dip [data-dip="half"]');
  if(step.id==='title'||step.id==='purpose'||step.id==='save')return $('openCard');
  if(step.id==='closeCard')return $('openCard');
  if(step.id==='closeSearch')return $('openSearch');
  if(step.id==='size')return $('photoSizeMore');
  if(step.id==='open'&&($('openKiln').hidden||fstep!=='ready'))return $('fireTitle');
  return document.querySelector(step.target);
 }
 function positionHints(target){
  var viewportW=window.innerWidth||390,viewportH=window.innerHeight||800,toolbar=stageEl.querySelector('.stageToolbar').getBoundingClientRect(),sheet=$('sheet').getBoundingClientRect();
  var canvasBox=cv.getBoundingClientRect(),areaW=canvasBox.width||viewportW;coach.style.left=Math.max(12,canvasBox.left+(areaW-Math.min(360,areaW-24))*.5)+'px';coach.style.right='auto';coach.style.width=Math.min(360,areaW-24)+'px';
  var coachH=coach.getBoundingClientRect().height||115,top=Math.max(toolbar.bottom+12,(canvasBox.top||0)+(canvasBox.height||viewportH)*.32-coachH*.5);if(viewportW<760&&sheet.top>0)top=Math.max(8,Math.min(top,sheet.top-coachH-8));coach.style.top=Math.min(top,Math.max(8,viewportH-coachH-8))+'px';
  var modalNode=!$('cardDlg').hidden?$('cardDlg').querySelector('.drawerIn'):!$('searchDlg').hidden?$('searchDlg').querySelector('[role=dialog]'):null;
  coach.classList.toggle('tutorialModal',!!modalNode);
  if(modalNode){var mb=modalNode.getBoundingClientRect(),tr=target?target.getBoundingClientRect():{top:viewportH*.5,bottom:0};if(mb.left>=230){coach.style.left='12px';coach.style.width=Math.min(300,mb.left-24)+'px';coach.style.top=Math.max(12,(viewportH-(coach.getBoundingClientRect().height||100))*.5)+'px';}else{coach.style.left='12px';coach.style.width=Math.max(180,viewportW-24)+'px';coach.style.top=tr.top<viewportH*.5?Math.max(8,viewportH-(coach.getBoundingClientRect().height||100)-8)+'px':'8px';}}
  if(!modalNode){
   if(viewportW<760){if(!$('sheet').classList.contains('open'))setSheet(true);if(coach.parentNode!==$('sheetBody'))$('sheetBody').prepend(coach);coach.classList.add('tutorialDocked');coach.style.left='auto';coach.style.top='auto';coach.style.width='auto';}
   else{if(coach.parentNode!==document.body)document.body.appendChild(coach);coach.classList.remove('tutorialDocked');coach.style.left='12px';coach.style.width=Math.min(300,Math.max(220,canvasBox.width*.28))+'px';coach.style.top=(toolbar.bottom+16)+'px';}
  }else{if(coach.parentNode!==document.body)document.body.appendChild(coach);coach.classList.remove('tutorialDocked');}
  // Keep the full open sound menu visible, including its actual toggle button.
  if(current().id==='sound'&&$('viewMenu').open){
   var soundBox=$('viewMenu').querySelector('.viewMenuBody').getBoundingClientRect(),soundCoachH=coach.getBoundingClientRect().height||coachH;
   var below=soundBox.bottom+12,above=soundBox.top-soundCoachH-12;
   coach.style.top=(below+soundCoachH<=viewportH-8?below:above>=8?above:Math.max(8,viewportH-soundCoachH-8))+'px';
  }
  if(!target||target.hidden||target===$('fireTitle')){hand.hidden=true;return;}
  var rect=target.getBoundingClientRect(),x=rect.left+rect.width*.5,y=rect.top+rect.height*.5,kind='tap';
  if(target===cv){var t=.55,radius=['inside','smoothInner'].includes(current().id)?innerAt(t):rAt(t),px=CX+radius*SV,py=BASE-st.height*t*SV;if(['brush','brushRing','stamp','carve','carveRing'].includes(current().id))px=CX+rAt(t)*SV*.12;
    if(current().id==='load'&&typeof pieceView==='function'){var pv=pieceView();px=CX+pv.x;py=BASE+pv.y-st.height*SV*pv.s*.5;}
    x=rect.left+px*rect.width/Math.max(1,W);y=rect.top+py*rect.height/Math.max(1,HC);kind=['stamp','load'].includes(current().id)?'tap':['smooth','smoothInner'].includes(current().id)?'rub':current().id==='brush'?'circle':current().id==='shape'?'shape':'drag';
  }
  hand.hidden=false;hand.dataset.motion=kind;hand.style.left=Math.max(8,Math.min(viewportW-48,x-8))+'px';hand.style.top=Math.max(8,Math.min(viewportH-58,y-8))+'px';
 }
 function clippedTarget(target){
  if(!target||target===cv)return null;
  var owner=target.closest('#sheetBody,.drawerIn');
  if(!owner||owner.scrollHeight<=owner.clientHeight+2)return null;
  var r=target.getBoundingClientRect(),box=owner.getBoundingClientRect();
  if(!r.height||!box.height)return null;
  // Fixed headers, body wrappers and non-scrolling chip rows do not clip the target.
  var top=Math.max(0,box.top+owner.clientTop),bottom=Math.min(window.innerHeight||800,box.top+owner.clientTop+owner.clientHeight);
  if(r.bottom<=top+1)return {direction:'up',owner:owner};
  if(r.top>=bottom-1)return {direction:'down',owner:owner};
  return null;
 }
 function route(){
  if(!active||routing)return;if(engaged){coach.hidden=true;hand.hidden=true;if(highlight)highlight.classList.remove('tutorialTarget');return;}routing=true;coach.hidden=false;
  try{var target=intendedTarget(),message='';
   if(target&&target.closest('#sheet')&&!$('sheet').classList.contains('open')&&target!==$('sheetToggle')){target=$('sheetToggle');message='먼저 도구 열기를 눌러 주세요.';}
   if(target&&target.closest('#sheet')&&$('sheet').classList.contains('open')){var parent=target.parentElement;while(parent&&parent!==$('sheet')){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement;}}
   if(highlight!==target){if(highlight)highlight.classList.remove('tutorialTarget');highlight=target;if(highlight&&highlight!==cv&&highlight!==$('fireTitle'))highlight.classList.add('tutorialTarget');}
   if(!message&&done&&lastInStage()&&current().stage!=='done'&&current().stage!=='fire')message='빨간색으로 표시된 실제 '+$('nextBtn').textContent+' 버튼을 눌러 주세요.';
   if(!message)message=done?'잘했어요! 다음 안내로 이어집니다.':current().id==='open'&&fstep!=='ready'?'굽고 식히는 중이에요. 잠시 기다려 주세요.':'손가락 모션과 빨간 표시를 따라 직접 해보세요.';
   var clip=clippedTarget(target);if(clip)message=clip.direction==='up'?'창 안에서 위로 스크롤해 버튼이나 입력칸을 보이게 해주세요.':'창 안에서 아래로 스크롤해 버튼이나 입력칸을 보이게 해주세요.';
   $('tutorialStatus').textContent=message;if(current().id==='solid'&&!secOn)$('tutorialText').textContent='이미 입체 보기로 전체 모양을 보고 있어요. 확인했다면 꾸미러 가기 버튼으로 넘어가세요.';if(current().id==='photo'&&photoOn)$('tutorialText').textContent='이미 완성 사진으로 보고 있어요. 다음 안내로 이어집니다.';if(gestureReady())$('tutorialText').textContent=({trim:'깎을 준비가 됐어요. 바깥 벽에 도구를 대고 안쪽으로 조금 밀거나 위아래로 움직여 흙을 깎아 보세요.',shape:'선택된 모양 잡기로 옆면을 좌우로 끌어 굴곡을 만들고, 높이를 바꿔 가며 위아래도 다듬어 보세요. ↕ 손잡이로 키를 바꿀 수 있어요.',inside:'속·두께 조절이 선택되어 있어요. 오른쪽 안쪽 벽을 좌우로 끌어 두께를 조절하세요.',smooth:'매끈하게가 선택되어 있어요. 바깥쪽 벽을 문질러 겉면을 다듬어 보세요.',smoothInner:'매끈하게가 선택되어 있어요. 오른쪽 단면의 안쪽 벽을 문질러 보세요.',brushRing:'한 바퀴 띠가 선택되어 있어요. 도자기에 그려 둘레를 따라 띠를 만들어 보세요.',carveRing:'한 바퀴 띠가 선택되어 있어요. 도자기에 그려 둘레를 따라 홈을 새겨 보세요.',brush:'붓이 선택되어 있어요. 손가락 모션처럼 도자기 위에 동그라미나 원하는 무늬를 그려 보세요.',stamp:'도장이 선택되어 있어요. 도자기 위를 눌러 찍어 보세요.',carve:'새김 도구가 선택되어 있어요. 도자기 위를 문질러 보세요.'})[current().id];positionHints(target);if(done&&!lastInStage())hand.hidden=true;if(clip){if(highlight)highlight.classList.remove('tutorialTarget');var sb=clip.owner?clip.owner.getBoundingClientRect():{left:0,top:0,width:window.innerWidth,height:window.innerHeight};hand.hidden=false;hand.dataset.motion=clip.direction==='up'?'scrollUp':'scrollDown';hand.setAttribute('data-scroll-label',clip.direction==='up'?'↑ 위로 스크롤':'↓ 아래로 스크롤');hand.style.left=(sb.left+sb.width*.85)+'px';hand.style.top=Math.max(60,Math.min((window.innerHeight||800)-100,sb.top+sb.height*.5))+'px';}else if(highlight&&highlight!==cv&&highlight!==$('fireTitle'))highlight.classList.add('tutorialTarget');
  }finally{routing=false;}
 }
 function refresh(){if(!active){coach.hidden=true;hand.hidden=true;return;}coach.hidden=false;var step=current();$('tutorialCount').textContent='처음 빚기 · '+(index+1)+' / '+steps.length;$('tutorialTitle').textContent=(index+1)+'. '+step.title.replace(/^\d+\.\s*/, '');$('tutorialText').textContent=step.text;$('nextBtn').disabled=!(done&&lastInStage()&&step.stage!=='done');route();}
 function focusStep(){refresh();var id=current().id;if(id==='smooth'&&tool==='sponge'&&secOn)$('tutorialText').textContent='입체 보기를 눌러 겉면부터 다듬어 주세요.';if((id==='solid'&&!secOn)||(id==='photo'&&photoOn)||(id==='sound'&&soundOn)){$('tutorialText').textContent=id==='solid'?'이미 입체 보기로 전체 모양을 보고 있어요.':id==='photo'?'이미 완성 사진으로 보고 있어요. 다음 안내로 이어집니다.':'소리가 이미 켜져 있어요.';mark(id);}}
 function cancelAdvance(){if(advanceTimer){clearTimeout(advanceTimer);advanceTimer=null;}}
 function scheduleAdvance(){cancelAdvance();var at=index;function proceed(){advanceTimer=null;if(!active||index!==at)return;if(ptr.down){advanceTimer=setTimeout(proceed,100);return;}if(index===steps.length-1){finish();return;}if(!lastInStage()||current().stage==='done')advance();else refresh();}advanceTimer=setTimeout(proceed,450);}
 function mark(id){if(active&&current().id===id&&!done){done=true;refresh();scheduleAdvance();}}
 function advance(){cancelAdvance();done=false;contactMs=0;engaged=false;index++;focusStep();}
 function finish(skipped){cancelAdvance();if(routeTimer){clearInterval(routeTimer);routeTimer=null;}complete=true;active=false;if(coach.parentNode!==document.body)document.body.appendChild(coach);coach.classList.remove('tutorialDocked');try{localStorage.setItem(KEY,'complete');}catch(e){}if(highlight)highlight.classList.remove('tutorialTarget');coach.hidden=true;hand.hidden=true;$('nextBtn').disabled=false;lockHome();if(!skipped){showHome(true);coach.hidden=false;coach.classList.remove('tutorialModal');coach.style.cssText='left:50%;top:50%;transform:translate(-50%,-50%);width:min(360px,calc(100vw - 24px))';$('tutorialCount').textContent='처음 빚기 완료';$('tutorialTitle').textContent='이제 다른 메뉴도 즐겨 보세요';$('tutorialText').textContent='도전하기에서 본을 따라 빚고, 내 진열장에서 작품을 다시 볼 수 있어요. 모두의 진열장은 준비 중이에요. 단계마다 도움말로 짧게 다시 확인할 수 있어요.';$('tutorialStatus').textContent='';$('tutorialSkip').textContent='알겠어요';$('tutorialSkip').onclick=function(){coach.hidden=true;};}toast(skipped?'안내를 건너뛰었어요. 각 단계의 도움말에서 다시 확인할 수 있어요.':'첫 작품 완성! 도전하기와 진열장도 이제 사용할 수 있어요.');}
 window.addEventListener('todak-trimmed',function(){if(active)mark('trim');});
 $('tutorialSkip').onclick=function(){finish(true);};
 // Capture only the initial Free entry. Returning home resumes the current guide.
 $('goFree').addEventListener('click',function(e){if(complete)return;if(active){e.preventDefault();e.stopImmediatePropagation();closeOverlays();focusStep();return;}active=true;index=0;done=false;contactMs=0;if(!routeTimer)routeTimer=setInterval(route,160);},true);
 var stageBase=setStage;setStage=function(stage){
  if(active&&current()&&stage!==current().stage){var next=steps[index+1];if(done&&lastInStage()&&next&&next.stage===stage){cancelAdvance();index++;done=false;contactMs=0;engaged=false;}else{toast('먼저 '+current().title+' 안내를 직접 해보세요.');return;}}
  stageBase(stage);if(active){if(stage==='done')$('closeSearch').click();focusStep();}
 };
 var challengeBase=startChallenge;startChallenge=function(id){if(!complete){toast('첫 자유롭게 빚기 안내를 먼저 마쳐 주세요.');return;}return challengeBase(id);};
 var touchBase=touchClay;touchClay=function(dt){
  if(!active)return touchBase(dt);var beforeR=st.radii.slice(),beforeI=st.inner.slice(),beforeH=st.height,result=touchBase(dt);
  if(tool==='shape'&&(Math.abs(st.height-beforeH)>.005||st.radii.some(function(v,i){return Math.abs(v-beforeR[i])>.002;})))mark('shape');
  if(tool==='thick'&&st.inner.some(function(v,i){return Math.abs(v-beforeI[i])>.002;}))mark('inside');
  if(tool==='sponge'&&ptr.contact){var correct=(current().id==='smooth'&&ptr.smoothSide==='outer'&&!secOn)||(current().id==='smoothInner'&&ptr.smoothSide==='inner'&&secOn);if(correct){contactMs+=dt;if(contactMs>=200)mark(current().id);}else contactMs=0;}return result;
 };
 var decoBase=applyDeco;applyDeco=function(hit,first){var result=decoBase(hit,first);if(active&&hit){if(dTool==='brush'&&hasPaint&&dOpacity>0)mark(dRing?'brushRing':'brush');if(dTool==='stamp'&&hasPaint&&dOpacity>0)mark('stamp');if(dTool==='carve'&&hasCarve)mark(dRing?'carveRing':'carve');}return result;};
 var fireBase=fireTick;fireTick=function(){var result=fireBase.apply(this,arguments);if(active&&st.stage==='fire'&&fstep!=='prep')mark('load');return result;};
 var openBase=openKilnNow;openKilnNow=function(){if(active&&current().id==='load'){if(done)advance();else{toast('먼저 작품을 가마에 넣어 주세요.');return;}}if(active&&current().id==='open'){if(fstep!=='ready'||kilnTemp>100){toast('100℃ 이하로 식을 때까지 기다려 주세요.');return;}mark('open');}return openBase.apply(this,arguments);};
 $('stamps').addEventListener('click',function(e){if(e.target.closest('[data-s]'))mark('stampChoice');});
 function watchText(id){var input=$(id),timer=null,composing=false;
  function queue(){clearTimeout(timer);if(composing||!active||current().id!==id||!input.value.trim())return;timer=setTimeout(function(){if(active&&current().id===id&&input.value.trim()&&!composing)mark(id);},800);}
  input.addEventListener('input',queue);input.addEventListener('compositionstart',function(){composing=true;clearTimeout(timer);});input.addEventListener('compositionend',function(){composing=false;queue();});
  input.addEventListener('change',function(){clearTimeout(timer);if(!composing&&input.value.trim())mark(id);});
 }
 watchText('title');watchText('purpose');
 function afterClick(id,action){$(id).addEventListener('click',function(){if(active)setTimeout(action,0);});}
 afterClick('rackGlazeBrush',function(){mark('glazeBrush');});afterClick('closeFinished360',function(){mark('inspect360');});$('glazeOpacity').addEventListener('input',function(){mark('glazeOpacity');});
 afterClick('sound',function(){mark('sound');});afterClick('cardClose',function(){mark('closeCard');});afterClick('closeSearch',function(){mark('closeSearch');});afterClick('menuBtn',function(){mark('home');});
 afterClick('sectionView',function(){if(secOn)mark('smoothSection');});afterClick('solidView',function(){if(!secOn)mark('solid');});['rotL','rotR'].forEach(function(id){afterClick(id,function(){mark('rotate');});});afterClick('finishedPhoto',function(){if(photoOn)mark('photo');});
 $('openCard').addEventListener('click',function(){if(!active||!dl||dl.tutorialObserved)return;var save=dl.save;dl.save=function(){var result=save.apply(this,arguments);return Promise.resolve(result).then(function(value){mark('save');return value;},function(error){if(active&&current().id==='save')mark('save');throw error;});};dl.tutorialObserved=true;},true);
 if(typeof navigator.share==='function'){try{var share=navigator.share;navigator.share=function(){var cardOpen=!$('cardDlg').hidden;return Promise.resolve(share.apply(navigator,arguments)).then(function(result){if(cardOpen)mark('save');return result;});};}catch(e){}}

 // This is an explicit user request, never an automatic search. Network failure cannot lock the guide.
 $('searchImage').addEventListener('click',function(){if(active)mark('search');});
 $('swatches').addEventListener('click',function(e){if(e.target.closest('[data-g]'))mark('color');});$('finish').addEventListener('click',function(e){if(e.target.closest('[data-f]'))mark('finish');});$('fx').addEventListener('click',function(e){var b=e.target.closest('[data-x]');if(b)mark('effect');});$('fire').addEventListener('click',function(e){if(e.target.closest('[data-fr]'))mark('heat');});
 $('dipDepth').addEventListener('input',function(){if(st.dip)mark('dip');});var dipBefore=null;$('dipHandle').addEventListener('pointerdown',function(){dipBefore=$('dipDepth').value;});$('dipHandle').addEventListener('pointermove',function(){if(dipBefore!==null&&$('dipDepth').value!==dipBefore)mark('dip');});
 $('photoObjectSize').addEventListener('input',function(){mark('size');});$('realPhotoScene').addEventListener('change',function(){mark('background');});
 var sheetBase=setSheet;setSheet=function(open){var result=sheetBase(open);if(active)route();return result;};
 document.addEventListener('click',function(){if(active)route();});
 cv.addEventListener('pointerdown',function(){if(active&&(gestureReady()||current().id==='load')){engaged=true;route();}},true);
 cv.addEventListener('pointerup',function(){if(active&&!done){engaged=false;refresh();}});
 cv.addEventListener('pointercancel',function(){if(active){engaged=false;refresh();}});
 $('viewMenu').addEventListener('toggle',function(){if(active&&current().id==='sound')route();});
 document.addEventListener('scroll',function(){if(active)route();},true);
 window.addEventListener('resize',function(){if(active)route();});
 var helpText={throw:'모양 잡기: 바깥 옆면을 좌우로 끌어요. 속·두께: 오른쪽 안쪽 벽을 조절해요. 매끈하게: 벽을 문질러 굴곡을 다듬어요. 입체/단면 보기로 확인하세요.',deco:'붓·도장·조각칼로 작품 위에 꾸며요. 색·크기·불투명도를 바꿀 수 있어요. 지우개와 되돌리기로 고치고, 좌우 화살표로 돌려 반대편도 꾸미세요.',glaze:'도구통에서 바탕 유약·붓칠를 고르고 유약 색과 불투명도, 유광/무광을 조절해요. 담가서 덧입히기에서 색과 담그는 깊이를 조절하고, 표면 무늬와 불 세기를 정하세요.',fire:'작품을 누르거나 가마로 끌어 넣어요. 굽기가 끝나고 100℃ 이하로 식으면 가마 문을 열어 꺼내세요.',done:'드래그로 도자기 이동, 좌우 화살표로 회전, 휠·두 손가락으로 배경 확대·축소. 도자기 크기와 배경은 따로 조절해요. 카드 저장·공유, 닮은 물건 검색과 비교 카드도 사용할 수 있어요.'};
 var helpButton=document.createElement('button');helpButton.type='button';helpButton.id='stageHelpButton';helpButton.className='ghost';helpButton.textContent='도움말';helpButton.setAttribute('aria-expanded','false');helpButton.setAttribute('aria-controls','stageBriefHelp');$('sheetTitle').after(helpButton);
 var helpBox=document.createElement('aside');helpBox.id='stageBriefHelp';helpBox.hidden=true;helpBox.innerHTML='<b id="stageBriefTitle"></b><p id="stageBriefText"></p><button type="button" class="ghost" id="stageHelpClose">닫기</button>';$('sheetBody').prepend(helpBox);
 function closeHelp(){helpBox.hidden=true;helpButton.setAttribute('aria-expanded','false');}
 helpButton.onclick=function(){if(!helpBox.hidden){closeHelp();return;}$('stageBriefTitle').textContent=({throw:'빚기',deco:'꾸미기',glaze:'유약',fire:'굽기',done:'완성'})[st.stage]+' 도움말';$('stageBriefText').textContent=helpText[st.stage]||'';helpBox.hidden=false;helpButton.setAttribute('aria-expanded','true');setSheet(true);$('sheetBody').scrollTop=0;};$('stageHelpClose').onclick=closeHelp;
 var helpStage=setStage;setStage=function(stage){var before=st.stage,result=helpStage(stage);if(st.stage!==before)closeHelp();return result;};
 lockHome();window.TodakTutorial={state:function(){return {complete:complete,active:active,index:index,id:current()?current().id:null,done:done,target:highlight?highlight.id||highlight.dataset.t||highlight.dataset.d:null};}};
})();
