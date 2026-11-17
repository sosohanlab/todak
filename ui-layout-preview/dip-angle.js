/* A tilted dipping plane; zero degrees preserves the existing horizontal dip. */
(function(){
 'use strict';
 var field=document.createElement('div');field.id='dipAngleControl';field.className='field';field.innerHTML='<div class="rangehead"><label class="label" for="dipAngle">담그는 기울기</label><output id="dipAngleOut" for="dipAngle">0°</output></div><input id="dipAngle" type="range" min="-60" max="60" step="1" value="0" aria-label="담그는 기울기">';$('dipDepth').closest('.dipControl').after(field);
 var direction=document.createElement('div');direction.className='field';direction.id='dipDirection';direction.innerHTML='<span class="label">담그는 방향</span><div class="chips"><button type="button" class="chip" data-dip-from="top">위에서</button><button type="button" class="chip" data-dip-from="bottom">아래에서</button></div>';$('dipDepth').closest('.dipControl').before(direction);direction.addEventListener('click',function(e){var b=e.target.closest('[data-dip-from]');if(!b)return;begin();st.dipFrom=b.dataset.dipFrom;if(!st.dip)st.dip='custom';dipKey=composeKey=pvKey=ovKey='';syncControls();dirty=cardDirty=true;finish();});
 var active=false;
 function begin(){if(active)return;active=true;window.TodakLayoutPreview.beginSetting();}
 function finish(){if(!active)return;active=false;window.TodakLayoutPreview.endSetting();}
 var input=$('dipAngle');input.addEventListener('pointerdown',begin);input.addEventListener('keydown',function(e){if(/^(Arrow|Page|Home|End)/.test(e.key))begin();});
 input.addEventListener('input',function(){begin();st.dipAngle=clamp(Number(this.value)||0,-60,60);if(!st.dip)st.dip='custom';$('dipAngleOut').textContent=st.dipAngle+'°';dipKey=composeKey=pvKey=ovKey='';dirty=cardDirty=true;});
 ['change','pointerup','pointercancel','keyup','blur'].forEach(function(type){input.addEventListener(type,function(){setTimeout(finish,0);});});
 var sync=syncControls;syncControls=function(){var result=sync.apply(this,arguments);direction.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.dipFrom===(st.dipFrom==='bottom'?'bottom':'top')));});input.value=Number(st.dipAngle)||0;$('dipAngleOut').textContent=input.value+'°';return result;};
 var dip=buildDip;buildDip=function(){if(st.dipFrom!=='bottom'||!st.dip)return dip();var depth=st.dipDepth,key=['below',depth,st.dipAngle||0,st.height,st.radii.join(',')].join('|');if(dipKey===key)return;try{st.dipDepth=1-depth;dip();}finally{st.dipDepth=depth;}var c=dipM.x;c.save();c.globalCompositeOperation='xor';c.fillStyle='#000';c.fillRect(0,0,TW,TH);c.restore();dipKey=key;};
 var photo=photoData;photoData=function(){var d=photo();d.dipFrom=st.dipFrom==='bottom'?'bottom':'top';d.key+='|dip-from:'+d.dipFrom;d.materialKey+='|dip-from:'+d.dipFrom;return d;};
 var fields=itemFields;itemFields=function(it){it=fields(it);if(it.communityVisual)it.communityVisual.dipFrom=st.dipFrom==='bottom'?'bottom':'top';return it;};
 syncControls();
})();
