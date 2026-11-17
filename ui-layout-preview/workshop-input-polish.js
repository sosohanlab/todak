(function(){
 'use strict';
 var lastTool=tool;
 function normalHand(){var input=$('hsize');input.value='60';input.dispatchEvent(new Event('input',{bubbles:true}));}
 $('tools').addEventListener('click',function(e){if(!e.target.closest('[data-t]'))return;if(tool==='shape'&&lastTool!=='shape')normalHand();lastTool=tool;});
 function resetNewSettings(){
  Object.assign(st,{glaze:'baekja',glaze2:'cobalt',dip:'',dipFrom:'top',dipDepth:.2,dipAngle:0,finish:'gloss',fx:'none',customC:null,topPaint:null,topCarve:null,bottomPaint:null,bottomCarve:null,used:{},fire:'mid',kilnType:'electric',kiln:null,name:'',purpose:'',curId:null,rimSoftness:0});if(!st.target)st.blind=false;
  dTool='brush';dPig='blue';dColor=[122,63,160];dStamp='flower';dRing=false;dOpacity=1;dCarveMode='incised';dSizeV={brush:.35,carve:.35,erase:.4,stamp:.4,move:.35};tool='shape';ptr.down=false;ptr.mode=null;ptr.w0=null;ptr.changed=false;
  var defaults={hsize:60,trimWidth:5,trimStrength:40,paintOpacity:100,glazeOpacity:100,glazeBrushSize:.45,glazeBrushColor:'cobalt',dipDepth:20,dipAngle:0,pigColor:'#7a3fa0',glazeColor:'#c8a2c8',title:'',purpose:''};Object.keys(defaults).forEach(function(id){var e=$(id);if(e)e.value=String(defaults[id]);});if($('glazeBrush'))$('glazeBrush').checked=false;
  window.TodakLayoutPreview?.resetCustomColors();window.TodakLayoutPreview?.resetHistory();$('glazeBrushColor').dispatchEvent(new Event('change',{bubbles:true}));['pigColor','glazeColor'].forEach(function(id){var input=$(id),hex=input?.parentElement.querySelector('input[type=text]');if(hex)hex.value=input.value.toUpperCase();});
  ['hsize','trimWidth','trimStrength'].forEach(function(id){var e=$(id);if(e)e.dispatchEvent(new Event('input',{bubbles:true}));});
  Z=1;CX=CX0;BASE=BASE0;rot=rotTarget=0;drops.length=0;wet=wob=inten=0;composeKey=ovKey=pvKey=dipKey=fxKey=kilnKey='';texVer++;if(window.TodakRealPhoto){$('resetPhoto').click();TodakRealPhoto.invalidate();}syncControls();dirty=cardDirty=true;
 }
 var previousFresh=freshClay;freshClay=function(){var result=previousFresh.apply(this,arguments);resetNewSettings();normalHand();lastTool=tool;return result;};
 var previousStage=setStage;setStage=function(stage){var returning=stage==='throw'&&st.stage!=='throw';var result=previousStage.apply(this,arguments);if(returning&&tool==='shape')normalHand();return result;};

 var style=document.createElement('style');style.textContent=`
 #ui-shape-range{position:absolute;pointer-events:none;z-index:16;border:2px solid #2546c7;border-radius:50%;background:radial-gradient(circle,#3159db16 0%,#3159db18 58%,#3159db06 100%);box-shadow:0 0 0 1px #ffffffc9;transform:translate(-50%,-50%)}
 #ui-shape-range[data-tool=thick],#ui-shape-range[data-tool=trim]{border-style:dashed;border-width:2px;background:radial-gradient(circle,#3159db1b 0%,#3159db0d 48%,#3159db00 100%)}
 #ui-shape-range[hidden]{display:none!important}#ui-shape-range span{position:absolute;left:50%;bottom:calc(100% + 7px);transform:translateX(-50%);white-space:nowrap;font:600 12px/1.4 system-ui,sans-serif;background:#fffdf6ed;color:#193eaa;border:1px solid #aab8d4;border-radius:6px;padding:3px 7px}

 `;document.head.appendChild(style);
 var range=document.createElement('div');range.id='ui-shape-range';range.hidden=true;range.setAttribute('aria-hidden','true');stageEl.appendChild(range);
 var widthGuide=document.createElement('div');widthGuide.id='ui-shape-width';widthGuide.setAttribute('aria-hidden','true');widthGuide.hidden=true;stageEl.appendChild(widthGuide);
 var guideStyle=document.createElement('style');guideStyle.textContent='#ui-shape-width{position:absolute;pointer-events:none;z-index:15;border:1px dashed #3155b6;border-radius:50%;transform:translate(-50%,-50%)}#ui-shape-width[hidden]{display:none!important}#ui-shape-width span{position:absolute;left:50%;top:100%;transform:translateX(-50%);white-space:nowrap;background:#fffdf5df;color:#284695;border-radius:5px;font:600 12px/1.4 system-ui;padding:2px 6px}';document.head.appendChild(guideStyle);
 var lastPoint=null,rangeTimer=0,rangeFrame=0,markerPointer=null;
 function isShaping(){return st.stage==='throw'&&(tool==='shape'&&!(ptr.down&&ptr.mode==='pull')||tool==='thick'&&secOn||tool==='trim'&&!window.TodakBottomTrim?.active());}
 function validInnerPoint(point){var b=cv.getBoundingClientRect(),x=(point.x-b.left)*W/b.width,y=(point.y-b.top)*HC/b.height,cm=(BASE-y)/SV,t=clamp(cm/st.height,0,1),pad=clamp(16/SV,.4,1);return st.height-st.floor>.05&&cm>=st.floor+.02&&cm<=st.height+.25&&Math.abs(Math.abs(x-CX)/SV-innerAt(t))<=Math.max(pad*2,24/SV);}
 function hideRange(){markerPointer=null;range.hidden=true;widthGuide.hidden=true;clearTimeout(rangeTimer);}
 function showRange(point,temporary){
  if(!isShaping()||!ptr.down||markerPointer===null){hideRange();return;}
  var box=cv.getBoundingClientRect(),host=stageEl.getBoundingClientRect();if(!box.width)return;
  if(!point){var t=.56,r=rAt(t)*SV,x=CX+r*.78,y=BASE-st.height*t*SV+TILT*r*Math.sqrt(1-.78*.78);point={x:box.left+x*box.width/W,y:box.top+y*box.height/HC};}
  range.dataset.tool=tool;var diameter=2*(tool==='trim'?Number($('trimWidth').value)/20:TOOLS[tool].f)*(tool==='thick'?2.2:1)*SV*box.height/HC;
  range.style.width=diameter+'px';range.style.height=diameter+'px';range.style.left=(point.x-host.left)+'px';range.style.top=(point.y-host.top)+'px';
  range.hidden=false;if(tool!=='shape'){widthGuide.hidden=true;return;}
  var px=(point.x-box.left)*W/box.width,py=(point.y-box.top)*HC/box.height,hit=hitSurface(px,py),level=ptr.down?clamp(clayLevel(px,py),0,1):secOn?clamp((BASE-py)/(st.height*SV),0,1):hit?hit.v:.56,radius=rAt(level)*SV;
  widthGuide.style.width=(2*radius*box.width/W)+'px';widthGuide.style.height=(secOn?1:2*TILT*radius*box.height/HC)+'px';widthGuide.style.left=(box.left-host.left+CX*box.width/W)+'px';widthGuide.style.top=(box.top-host.top+(BASE-st.height*level*SV)*box.height/HC)+'px';widthGuide.hidden=false;
  clearTimeout(rangeTimer);if(temporary)rangeTimer=setTimeout(hideRange,2200);
 }
 function queueRange(){if(!rangeFrame)rangeFrame=requestAnimationFrame(function(){rangeFrame=0;showRange(lastPoint,false);});}
 cv.addEventListener('pointermove',function(e){if(!isShaping()||!ptr.down||markerPointer!==e.pointerId||(e.pointerType!=='touch'&&!(e.buttons&1))){hideRange();return;}var b=cv.getBoundingClientRect(),x=(e.clientX-b.left)*W/b.width,y=(e.clientY-b.top)*HC/b.height;
  if(ptr.down||hitSurface(x,y)||secOn&&Math.abs(Math.abs(x-CX)/SV-rAt(clamp((BASE-y)/(st.height*SV),0,1)))<.8){lastPoint={x:e.clientX,y:e.clientY};queueRange();}else hideRange();});
 cv.addEventListener('pointerdown',function(e){if(isShaping()&&ptr.down){if(tool==='trim'){var box=cv.getBoundingClientRect(),x=(e.clientX-box.left)*W/box.width,y=(e.clientY-box.top)*HC/box.height,t=clayLevel(x,y);if(t<0||t>1||secOn&&Math.abs(Math.abs(x-CX)/SV-rAt(t))>Math.min(.25,Math.max(.10,6/SV))||!secOn&&!hitSurface(x,y)){hideRange();return;}}if(tool==='thick'&&!validInnerPoint({x:e.clientX,y:e.clientY})){hideRange();return;}markerPointer=e.pointerId;lastPoint={x:e.clientX,y:e.clientY};showRange(lastPoint,false);}});
 ['pointerup','pointercancel','lostpointercapture'].forEach(function(type){cv.addEventListener(type,hideRange);});cv.addEventListener('pointerleave',function(){if(!ptr.down)hideRange();});
 ['pointerup','pointercancel'].forEach(function(type){document.addEventListener(type,hideRange,true);});window.addEventListener('blur',hideRange);document.addEventListener('visibilitychange',function(){if(document.hidden)hideRange();});
 var hideForHome=showHome;showHome=function(){hideRange();return hideForHome.apply(this,arguments);};var hideForResume=closeOverlays;closeOverlays=function(){hideRange();return hideForResume.apply(this,arguments);};
 $('hsize').addEventListener('input',function(){lastPoint=null;hideRange();});$('tools').addEventListener('click',hideRange);
 window.addEventListener('resize',function(){if(!range.hidden)showRange(lastPoint,true);});
 var stageForRange=setStage;setStage=function(){var result=stageForRange.apply(this,arguments);if(st.stage!=='throw')hideRange();return result;};

 function inspectionBackground(){var orbit=$('finished360Canvas');if(!orbit||orbit.dataset.inline!=='true'||!document.body.classList.contains('ui-inspecting'))return;
  var id=TodakShop.wallet.background,scene=id==='gallery'?'dark':id==='warm'?'warm':'studio';orbit.style.backgroundImage='url('+JSON.stringify(TodakBackgrounds.url(scene))+')';orbit.dataset.background=scene;
  // The pottery layer is unchanged; CSS replaces only the backdrop.
 }
 $('realPhotoScene').addEventListener('change',inspectionBackground);
 if(window.TodakRealPhoto){var invalidate=TodakRealPhoto.invalidate;TodakRealPhoto.invalidate=function(){var result=invalidate.apply(this,arguments);inspectionBackground();return result;};}
 document.querySelector('#finish [data-f="gloss"]').textContent='유광';document.querySelector('#finish [data-f="matte"]').textContent='무광';
 window.TodakInputPolish={normalHand:normalHand,resetNewSettings:resetNewSettings,showRange:function(){showRange(null,true);},background:inspectionBackground};
})();
