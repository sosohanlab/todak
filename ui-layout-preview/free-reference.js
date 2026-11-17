/* Visual references for free play; st.target remains empty and has no move limit. */
var freeReferenceSaved,freeReferenceCached;
function freeReferenceTarget(){
 var p=st.freeReference;if(st.target||!p)return null;
 if(p!==freeReferenceSaved){freeReferenceSaved=p;freeReferenceCached=null;if(typeof p.name==='string'&&Number.isFinite(p.h)&&p.h>=1.2&&p.h<=HMAX&&Array.isArray(p.r)&&p.r.length===N&&p.r.every(function(v){return Number.isFinite(v)&&v>0&&v<=RMAX;}))freeReferenceCached={name:p.name,h:p.h,f:function(t){var x=clamp(t,0,1)*(N-1),i=Math.min(N-2,Math.floor(x));return p.r[i]+(p.r[i+1]-p.r[i])*(x-i);}};}
 return freeReferenceCached;
}
(function(){
 'use strict';
 var dialog=document.createElement('dialog');dialog.id='freeReferenceDialog';dialog.setAttribute('aria-labelledby','freeReferenceTitle');dialog.innerHTML='<header><h2 id="freeReferenceTitle">어떻게 빚을까요?</h2><button type="button" class="ghost" id="freeReferenceClose">닫기</button></header><p>본 없이 만들거나, 참고할 형태의 안내선을 보며 빚어요. 점수와 횟수 제한은 없어요.</p><button type="button" class="primary" id="freeReferenceNone">본 없이 자유롭게 빚기</button><h3>형태를 보며 빚기</h3><div id="freeReferenceBuiltins" class="free-reference-grid"></div><h3>내가 만든 형태</h3><div id="freeReferencePersonal" class="free-reference-grid"></div>';document.body.append(dialog);
 function refresh(){sync();window.TodakLayoutPreview?.sync();window.TodakResponsive?.refresh();updateReadout();dirty=true;window.TodakWorkInProgress?.flush();}
 function select(id){var T=TARGETS[id];if(!T)return;var reference={id:id,name:T.name,h:T.h,r:Array.from({length:N},function(_,i){return T.f(i/(N-1));})};startFree();st.freeReference=reference;st.freeReferenceVisible=true;dialog.close();refresh();}
 function card(host,id){var T=TARGETS[id];if(!T)return;var b=document.createElement('button');b.type='button';b.className='free-reference-card';b.dataset.reference=id;var canvas=document.createElement('canvas');canvas.width=168;canvas.height=180;canvas.setAttribute('aria-hidden','true');miniOutline(canvas,T);var name=document.createElement('b');name.textContent=T.name;var size=document.createElement('small');size.textContent='높이 '+T.h.toFixed(1)+'cm';b.append(canvas,name,size);b.onclick=function(){select(id);};host.append(b);}
 async function open(){await window.TodakPersonalChallenges?.ready;var basic=$('freeReferenceBuiltins'),own=$('freeReferencePersonal');basic.replaceChildren();own.replaceChildren();CH_ORDER.forEach(function(id){card(basic,id);});var list=window.TodakPersonalChallenges?.records()||[];list.forEach(function(t){card(own,t.id);});if(!list.length){var empty=document.createElement('p');empty.textContent='직접 등록하거나 공유받은 본이 여기에 모여요.';own.append(empty);}dialog.showModal();}
 $('goFree').addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();open();},true);
 $('freeReferenceClose').onclick=function(){dialog.close();};$('freeReferenceNone').onclick=function(){startFree();dialog.close();refresh();};
 var goal=$('ui-goal-switch').querySelector('input');goal.addEventListener('change',function(){if(freeReferenceTarget()){st.freeReferenceVisible=this.checked;dirty=true;window.TodakWorkInProgress?.flush();}});
 var oldGhost=ghostOn;ghostOn=function(){return freeReferenceTarget()?st.freeReferenceVisible!==false:oldGhost();};
 var fresh=freshClay;freshClay=function(){st.freeReference=null;st.freeReferenceVisible=true;return fresh.apply(this,arguments);};
 function sync(){if(!st.target&&freeReferenceTarget())goal.checked=st.freeReferenceVisible!==false;}
 window.TodakFreeReference={sync:sync,open:open,target:freeReferenceTarget,visible:function(){return !!freeReferenceTarget()&&st.freeReferenceVisible!==false;}};
})();
