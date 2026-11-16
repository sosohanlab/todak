/* Fine exterior finishing only. Existing hand forming, smoothing and history stay in charge. */
(function(){
 'use strict';
 var stroke=null;
 TOOLS.trim={f:.25,sm:0};
 TIPS.trim='<b>날이 닿는 좁은 부분의 흙만 덜어내요.</b> 날 두께와 깎는 강도를 따로 조절해 홈·기둥·굽을 만들어요. 최대 강도는 같은 안쪽 이동의 약 1/3만 깎여요. 가만히 누르거나 바깥으로 빼면 깎이지 않아요. 기둥은 속·두께에서 속 깊이를 줄여 아래쪽 흙을 채운 뒤 깎아 보세요.';
 var button=document.createElement('button');button.type='button';button.className='chip';button.dataset.t='trim';button.setAttribute('aria-pressed','false');button.textContent='깎기';button.title='좁은 부분을 얇게 덜어내기';$('tools').insertBefore(button,document.querySelector('#tools [data-t="sponge"]'));
 var quick=document.createElement('button');quick.type='button';quick.dataset.quick='trim';quick.setAttribute('aria-pressed','false');quick.textContent='3 깎기';document.querySelector('.quick-tools').insertBefore(quick,document.querySelector('[data-quick="sponge"]'));quick.onclick=function(){button.click();};document.querySelector('[data-quick="sponge"]').textContent='4 매끈하게';
 var controls=document.createElement('div');controls.id='trimControls';controls.className='trim-controls';controls.hidden=true;
 controls.innerHTML='<div class="rangehead"><label class="label" for="trimWidth">날 두께</label><output id="trimWidthOut" for="trimWidth"></output></div><input type="range" id="trimWidth" min="2" max="14" step="0.5" value="5"><div class="rangehead"><label class="label" for="trimStrength">깎는 강도</label><output id="trimStrengthOut" for="trimStrength"></output></div><input type="range" id="trimStrength" min="5" max="100" step="5" value="40"><p class="tip" id="fineTrimHint">좁게 덜어내 홈·기둥·굽을 만들어요. 최대 강도도 모양 잡기의 약 1/3이에요.</p><p class="tip">기둥을 만들려면 속·두께에서 속 깊이를 줄여 아래쪽 흙을 채워 주세요.</p>';
 $('hsize').after(controls);$('hsize').previousElementSibling.classList.add('ui-hand-size-label');
 function settings(){return{widthMm:Number($('trimWidth').value),strength:Number($('trimStrength').value),gain:Number($('trimStrength').value)/300};}
 function sync(){var s=settings();TOOLS.trim.f=s.widthMm/20;$('trimWidthOut').textContent=s.widthMm.toFixed(1)+'mm';$('trimStrengthOut').textContent=s.strength+'%';controls.hidden=tool!=='trim';}
 ['trimWidth','trimStrength'].forEach(function(id){$(id).addEventListener('input',function(){stroke=null;sync();dirty=true;});});
 var oldTips=showTips;showTips=function(){oldTips();sync();if(tool==='trim'){var h=document.querySelector('.quick-tool-hint');if(h)h.textContent='날 두께·강도를 고르고 좁게 깎아요 · 가만히 누르면 깎이지 않아요.';}};
 function contact(x,y){var t=clayLevel(x,y);if(t<0||t>1)return null;if(secOn){if(Math.abs(Math.abs(x-CX)/SV-rAt(t))>Math.min(.25,Math.max(.10,6/SV)))return null;}else if(!hitSurface(x,y))return null;return clamp(t,0,1);}
 function begin(x,y){var t=contact(x,y);if(t===null)return false;stroke={x:x,y:y,t:t,side:x<CX?-1:1};if(ptr.surfaceAnchorT==null&&!secOn){ptr.surfaceAnchorT=t;ptr.surfaceAnchorY=y;}return true;}
 function trim(){
  ptr.contact=false;ptr.maxD=0;
  if(!stroke){if(!begin(ptr.sx,ptr.sy)){begin(ptr.x,ptr.y);return 0;}}
  var t=clayLevel(ptr.x,ptr.y),lastT=stroke.t,dx=(ptr.x-stroke.x)*stroke.side/SV,dy=(t-lastT)*st.height;
  stroke.x=ptr.x;stroke.y=ptr.y;stroke.t=clamp(t,0,1);
  if(t<0||t>1||dx>.001)return 0;
  if(!secOn&&!hitSurface(ptr.x,ptr.y))return 0;
  var travel=Math.max(0,-dx)+Math.abs(dy)*.3;if(travel<.00001)return 0;
  var setting=settings(),width=setting.widthMm/20,rowH=st.height/(N-1),samples=Math.max(1,Math.min(512,Math.ceil(Math.abs(dy)/Math.max(.025,width/4)))),beforeProfile=st.radii.slice(),moved=0;
  for(var j=0;j<N;j++){
   // Integrate the rounded edge over each profile row so a thin blade cannot fall between rows.
   var weight=0;for(var sample=0;sample<samples;sample++){var level=lastT+(t-lastT)*(sample+.5)/samples,offset=j*rowH-level*st.height,a=Math.max(-width,offset-rowH/2),b=Math.min(width,offset+rowH/2);if(b>a)weight+=((b-a)/2+width/(2*Math.PI)*(Math.sin(Math.PI*b/width)-Math.sin(Math.PI*a/width)))/Math.min(rowH,width)/samples;}if(!weight)continue;
   var before=beforeProfile[j],minimum=.12;
   if(j*rowH>=st.floor&&st.height-st.floor>.05){var a=Math.max(0,j-1),b=Math.min(N-1,j+1),slope=(beforeProfile[b]-beforeProfile[a])/Math.max(rowH,(b-a)*rowH);minimum=Math.max(minimum,st.inner[j]+.08*Math.sqrt(1+slope*slope));}
   var next=Math.min(before,Math.max(minimum,before-travel*setting.gain*weight)),cut=before-next;
   if(cut>1e-9){st.radii[j]=next;grooves[j]=Math.max(0,grooves[j]-cut);moved+=cut;ptr.maxD=Math.max(ptr.maxD,cut);}
  }
  if(moved>0){ptr.contact=true;ptr.changed=true;markPreset(null);updateReadout();dirty=true;window.dispatchEvent(new CustomEvent('todak-trimmed'));}
  return moved;
 }
 var touch=touchClay;touchClay=function(dt){return tool==='trim'?trim():touch(dt);};
 cv.addEventListener('pointerdown',function(){stroke=null;});
 // Commit even a quick movement before pointerup; frame ticks with no motion remove nothing.
 cv.addEventListener('pointermove',function(){if(st.stage==='throw'&&tool==='trim'&&ptr.down&&ptr.decided)trim();});
 ['pointerup','pointercancel','lostpointercapture'].forEach(function(event){cv.addEventListener(event,function(){stroke=null;});});
 $('tools').addEventListener('click',function(){stroke=null;});
 window.TodakFineTrimming={limits:function(){return{maximumGain:1/3,minimumRadiusCm:.12};},settings:settings};
 showTips();
})();
