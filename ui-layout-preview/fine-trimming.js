/* Fine exterior finishing only. Existing hand forming, smoothing and history stay in charge. */
(function(){
 'use strict';
 var MAX_CUT=.035,GAIN=.06,stroke=null;
 TOOLS.trim={f:.16+Number($('hsize').value)/100*.32,sm:0};
 TIPS.trim='<b>좁은 부분의 흙을 얇게 덜어내요.</b> 안쪽으로 밀거나 위아래로 움직여 손질해요. 가만히 누르거나 바깥으로 빼면 깎이지 않아요. 한 손길로 한곳에서 최대 0.35mm만 깎고, 안쪽 공간·높이·바닥은 유지해요.';
 var button=document.createElement('button');button.type='button';button.className='chip';button.dataset.t='trim';button.setAttribute('aria-pressed','false');button.textContent='깎기';button.title='좁은 부분을 얇게 덜어내기';$('tools').insertBefore(button,document.querySelector('#tools [data-t="sponge"]'));
 var quick=document.createElement('button');quick.type='button';quick.dataset.quick='trim';quick.setAttribute('aria-pressed','false');quick.textContent='3 깎기';document.querySelector('.quick-tools').insertBefore(quick,document.querySelector('[data-quick="sponge"]'));quick.onclick=function(){button.click();};document.querySelector('[data-quick="sponge"]').textContent='4 매끈하게';
 var hint=document.createElement('p');hint.id='fineTrimHint';hint.className='tip';hint.hidden=true;hint.textContent='좁은 곳을 얇게 덜어내요 · 한 손길로 한곳에서 최대 0.35mm';$('hsize').closest('.field').appendChild(hint);
 var oldTips=showTips;showTips=function(){oldTips();hint.hidden=tool!=='trim';if(tool==='trim'){var h=document.querySelector('.quick-tool-hint');if(h)h.textContent='안쪽으로 조금 밀거나 위아래로 손질해요 · 가만히 누르면 깎이지 않아요.';}};
 function contact(x,y){var t=clayLevel(x,y);if(t<0||t>1)return null;if(secOn){if(Math.abs(Math.abs(x-CX)/SV-rAt(t))>Math.min(.25,Math.max(.10,6/SV)))return null;}else if(!hitSurface(x,y))return null;return clamp(t,0,1);}
 function begin(x,y){var t=contact(x,y);if(t===null)return false;stroke={base:st.radii.slice(),x:x,y:y,t:t,side:x<CX?-1:1};if(ptr.surfaceAnchorT==null&&!secOn){ptr.surfaceAnchorT=t;ptr.surfaceAnchorY=y;}return true;}
 function trim(){
  ptr.contact=false;ptr.maxD=0;
  if(!stroke){if(!begin(ptr.sx,ptr.sy)){begin(ptr.x,ptr.y);return 0;}}
  var t=clayLevel(ptr.x,ptr.y),lastT=stroke.t,dx=(ptr.x-stroke.x)*stroke.side/SV,dy=(t-lastT)*st.height;
  stroke.x=ptr.x;stroke.y=ptr.y;stroke.t=clamp(t,0,1);
  if(t<0||t>1||dx>.001)return 0;
  if(!secOn&&!hitSurface(ptr.x,ptr.y))return 0;
  var travel=Math.max(0,-dx)+Math.abs(dy)*.3;if(travel<.00001)return 0;
  var width=TOOLS.trim.f,rowH=st.height/(N-1),samples=Math.max(1,Math.min(512,Math.ceil(Math.abs(dy)/Math.max(.025,width/4)))),beforeProfile=st.radii.slice(),moved=0;
  for(var j=0;j<N;j++){
   var weight=0;for(var sample=0;sample<samples;sample++){var level=lastT+(t-lastT)*(sample+.5)/samples,distance=Math.abs(j*rowH-level*st.height);if(distance<width)weight+=Math.pow(1-distance/width,.7)/samples;}if(!weight)continue;
   var before=beforeProfile[j],minimum=Math.max(.025,stroke.base[j]-MAX_CUT);
   if(j*rowH>=st.floor&&st.height-st.floor>.05){var a=Math.max(0,j-1),b=Math.min(N-1,j+1),slope=(beforeProfile[b]-beforeProfile[a])/Math.max(rowH,(b-a)*rowH);minimum=Math.max(minimum,st.inner[j]+.08*Math.sqrt(1+slope*slope));}
   var next=Math.min(before,Math.max(minimum,before-travel*GAIN*weight)),cut=before-next;
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
 window.TodakFineTrimming={limits:function(){return{maximumPerPointMm:MAX_CUT*10,gain:GAIN};}};
 showTips();
})();
