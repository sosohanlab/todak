/* Local review scenes only; never deployed or used with the public site's storage. */
(function(){
 var scene=new URLSearchParams(location.search).get('screen');
 if(!/^(0[1-9]|10|11|section)$/.test(scene||''))return;
 Array.from($('steps').children).forEach(function(li){li.tabIndex=0;li.setAttribute('role','button');li.setAttribute('aria-label',li.textContent+' 화면 보기');li.onclick=function(){if(li.dataset.s==='done'&&!st.kiln)st.kiln={type:'plain',seed:42,fire:'mid'};setStage(li.dataset.s);};li.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();li.click();}};});
 window.addEventListener('load',function(){setTimeout(function(){
  try{localStorage.setItem('todak.tutorial.v1','complete');}catch(_){}
  if(window.TodakTutorial?.state().active)$('tutorialSkip')?.click();
  startChallenge('moon');st.blind=false;st.height=scene==='01'?11:16;st.floor=1;
  st.radii=Array.from({length:N},function(_,i){var t=i/(N-1),r=3.3+6.5*Math.pow(Math.sin(Math.PI*t*.72),.82);if(['01','03'].includes(scene))r+=Math.sin(i*Math.PI*.94)*.045;return r;});st.inner=st.radii.map(function(r){return Math.max(.2,r-.8);});st.touches=scene==='01'?TARGETS.moon.n-4:TARGETS.moon.n;
  if(scene==='01'){freshClay();}
  if(Number(scene)>=4){paint.x.save();paint.x.translate(TW*.5,TH*.57);paint.x.scale(4,4);paint.x.strokeStyle='#356b54';paint.x.lineWidth=1.2;paint.x.stroke(new Path2D(STAMP_PATHS.sprig));paint.x.restore();hasPaint=true;texVer++;}
  if(['01','02','03'].includes(scene)){
   var selected=scene==='02'?'sponge':scene==='03'?'thick':'shape';document.querySelector('#tools [data-t="'+selected+'"]').click();if(selected==='trim')st.trimReady=true;
  }else if(['04','05','06'].includes(scene)){
   setStage('deco');var selected=scene==='05'?'carve':scene==='06'?'stamp':'brush';document.querySelector('#dtools [data-d="'+selected+'"]').click();if(scene==='05')$('wheelBottom-deco').click();if(scene==='06')$('wheelTop-deco').click();
  }else if(['07','08'].includes(scene)){
   st.glaze='baekja';setStage('glaze');if(scene==='08'){st.dip='custom';st.dipDepth=.03;st.glaze2='sky';var dipFold=$('dip').closest('details');if(dipFold)dipFold.open=true;syncControls();}
  }else if(['09','10'].includes(scene)){
   st.glaze='baekja';setStage('fire');if(scene==='10'){fstep='firing';fT=performance.now();fireUI();}
  }else if(scene==='11'){
   st.glaze='baekja';st.kiln={type:'plain',seed:42,fire:'mid',gold:false};setStage('done');
  }else if(scene==='section'){
   document.querySelector('#tools [data-t="thick"]').click();st.inner=st.radii.map(function(r,i){return innerLimitAt(i/(N-1),.8);});st.floor=.8;setSec(true,true);
  }
  closeOverlays();$('chRules').hidden=true;syncControls();updateReadout();window.TodakLayoutPreview.sync();resize();V=fitV();SV=S0*V*Z;dirty=true;window.TodakLayoutPreview.readyScene=scene;
 },100);});
})();
