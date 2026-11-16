(function(){
 'use strict';
 function go(stage){
  if(stage===st.stage)return;
  var guide=window.TodakTutorial&&TodakTutorial.state();
  if(guide&&guide.active){setStage(stage);return;}
  if(st.stage==='fire'){
   if(['loading','loaded','closing','firing','cooling'].includes(fstep)){toast('굽기를 마친 뒤 이동할 수 있어요.');return;}
   if(fstep==='ready'){if(stage==='done')openKilnNow();else toast('가마 문을 열어 완성 작품을 먼저 확인해 주세요.');return;}
  }
  if(stage==='done'){toast('가마에서 작품을 구운 뒤 완성 화면을 볼 수 있어요.');return;}
  if(st.stage==='done'){st.curId=null;st.kiln=null;fireDone=false;}
  setStage(stage);dirty=true;
 }
 document.querySelectorAll('#steps li[data-s]').forEach(function(li){
  li.tabIndex=0;li.setAttribute('role','button');li.title=li.getAttribute('aria-label')+' 단계로 이동';
  li.addEventListener('click',function(){go(li.dataset.s);});
  li.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();li.click();}});
 });
})();
