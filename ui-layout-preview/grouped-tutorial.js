/* Seven brief checkpoints across the five existing production stages. */
(function(){
 var chosen={},decoVersion=null;
 steps=[
  {id:'shape',stage:'throw',title:'빚기 도구 익히기',target:'#tools',text:'모양 잡기는 넓게 밀고 당기고, 깎기는 좁은 곳을 얇게 덜어내요. 속·두께와 매끈하게도 자유롭게 사용해 보세요.'},
  {id:'decoGroup',stage:'deco',title:'자유롭게 꾸미기',target:'#dtools',text:'도구통에서 붓·도장·조각칼·지우개를 골라 자유롭게 꾸며 보세요. 색과 크기를 바꾸고, 옆면·위·밑바닥에도 꾸밀 수 있어요.'},
  {id:'glazeGroup',stage:'glaze',title:'유약과 색 입히기',target:'#rackGlaze',text:'바탕붓은 전체 색을, 붓칠은 원하는 부분의 색을 입혀요. 직접 색을 고르거나 담그기 깊이·표면 느낌도 바꿔 보세요.'},
  {id:'load',stage:'fire',title:'가마에 넣기',target:'#cv',text:'작품을 누르거나 가마에 넣고 굽기를 누르세요. 잠시 구운 뒤 식혀요.'},
  {id:'open',stage:'fire',title:'식힌 뒤 꺼내기',target:'#openKiln',text:'식히기가 끝나면 가마 문을 열어 완성작을 만나 보세요.'},
  {id:'finishGroup',stage:'done',title:'완성작 감상·저장',target:'#openCard',text:'완성작을 돌려 보거나 크기·배경을 바꿔 보세요. 카드로 저장·공유에서 이름을 적고 저장할 수 있어요.'},
  {id:'home',stage:'done',title:'튜토리얼 마치기',target:'#menuBtn',text:'원하는 만큼 감상한 뒤 홈으로 돌아가면 튜토리얼이 끝나요. 홈에서 언제든 다시 할 수 있어요.'}
 ];
 var ready=gestureReady;gestureReady=function(){if(current()&&current().id==='shape')return ['shape','thick','trim','sponge'].indexOf(tool)>=0;if(current()&&current().id==='decoGroup')return dTool!=='move';if(current()&&current().id==='glazeGroup')return !!(window.TodakWheel&&TodakWheel.brushing());return ready();};
 var target=intendedTarget;intendedTarget=function(){var step=current();if(!step)return target();if(done&&lastInStage()&&['throw','deco','glaze'].indexOf(step.stage)>=0)return $('nextBtn');if(step.id==='shape')return chosen.throw?cv:$('tools');if(step.id==='decoGroup')return chosen.deco?cv:$('dtools');if(step.id==='glazeGroup')return !chosen.glaze?$('rackGlaze'):gestureReady()?cv:$('swatches');if(step.id==='finishGroup'&&!$('cardDlg').hidden)return $('saveCard').closest('.ui-card-fields')||$('saveCard');return target();};
 var markAction=mark;mark=function(id){if(active&&current()&&current().id==='finishGroup'&&id==='save')id='finishGroup';return markAction(id);};
 var touch=touchClay;touchClay=function(dt){var result=touch(dt);if(active&&current()&&current().id==='shape'&&ptr.contact&&result>0)mark('shape');return result;};
 window.addEventListener('todak-trimmed',function(){if(active&&current()&&current().id==='shape')mark('shape');});
 var decorate=applyDeco;applyDeco=function(){var before=texVer,result=decorate.apply(this,arguments);if(texVer!==before)mark('decoGroup');return result;};
 window.addEventListener('todak-glaze-painted',function(){mark('glazeGroup');});
 cv.addEventListener('pointerdown',function(){if(active&&current()&&current().id==='decoGroup')decoVersion=texVer;},true);
 document.addEventListener('pointerup',function(){if(decoVersion!==null){var before=decoVersion;decoVersion=null;setTimeout(function(){if(texVer!==before)mark('decoGroup');},0);}},true);
 document.addEventListener('click',function(e){if(!active||!current()||!e.isTrusted)return;if(e.target.closest('#tools'))chosen.throw=true;if(e.target.closest('#dtools'))chosen.deco=true;if(e.target.closest('#rackGlaze'))chosen.glaze=true;if(current().id==='glazeGroup'&&e.target.closest('#swatches,#swatches2,#glazeBrushPalette,#dots,#finish,#dip,#fx'))mark('glazeGroup');route();});
 document.addEventListener('input',function(e){if(active&&current()&&current().id==='glazeGroup'&&e.isTrusted&&e.target.closest('#p-glaze'))mark('glazeGroup');});
 var fresh=freshClay;freshClay=function(){chosen={};decoVersion=null;return fresh.apply(this,arguments);};
 tutorialGuidance.describe=function(target){var step=current();if(!step||done||target===$('sheetToggle'))return null;if(step.id==='shape')return ['빚기 도구로 원하는 모양을 만들어 보세요',step.text];if(step.id==='decoGroup')return ['여기서 도구를 골라 자유롭게 꾸며 보세요',step.text];if(step.id==='glazeGroup')return ['도구를 골라 원하는 색을 입혀 보세요',step.text];if(step.id==='finishGroup')return !$('cardDlg').hidden?['작품 이름을 적고 카드로 저장해 보세요','용도는 선택이에요. 이미지로 저장하거나 공유할 수 있어요.']:['완성작을 감상하고 저장해 보세요',step.text];if(step.id==='home'&&!$('cardDlg').hidden)return ['저장 창을 닫고 완성작을 살펴보세요','준비되면 화면 위 홈으로 돌아가 튜토리얼을 마쳐요.'];return null;};
 var dim=tutorialGuidance.dim;tutorialGuidance.dim=function(){return current()&&['finishGroup','home'].indexOf(current().id)>=0?false:dim();};
})();
