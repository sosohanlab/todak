const fs=require('fs'),path=require('path');
const root=path.dirname(__dirname),sourceDir=path.join(root,'ui-layout-preview');
const production=process.argv.includes('--production'),out=production?path.join(root,'release-site'):sourceDir;
fs.mkdirSync(out,{recursive:true});
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
if(html.includes('<!-- todak-public-build:'))html=fs.readFileSync(path.join(root,'tools/studio-base.html'),'utf8');
const marker='if(hot&&hot.ready){hot.ready(start);}';
if(!html.includes(marker))throw Error('Missing startup');
html=html.replace('if(throwing&&tool!=="thick"&&st.target&&TARGETS[st.target]&&ghostOn())','if(throwing&&st.target&&TARGETS[st.target]&&ghostOn())');
html=html.replace('ctx.moveTo(hp.x-17,hp.y); ctx.lineTo(CX+rAt(1)*SV,hp.y);', 'ctx.moveTo(hp.x+(hp.x<CX?17:-17),hp.y); ctx.lineTo(CX+(hp.x<CX?-1:1)*rAt(1)*SV,hp.y);');
html=html.replace('var compact=window.innerWidth<=1440,host=compact?', 'var compact=window.innerWidth<760,host=compact?');
// A stroke that starts just outside the clay can acquire contact on entry.
html=html.replace('if(ptr.trimInvalid)return 0;',`if(ptr.trimInvalid){var contact=hitSurface(ptr.x,ptr.y),distance=Math.abs(ptr.x-CX)/SV,edge=rAt(clamp(t,0,1));if(!contact&&Math.abs(distance-edge)>Math.max(.65,15/SV))return 0;ptr.trimInvalid=false;ptr.trimSide=ptr.x<CX?-1:1;ptr.trimOffset=Math.max(0,distance-edge);ptr.trimLastRow=clamp(t,0,1)*(N-1);ptr.w0=st.radii.slice();}`);
html=html.replace("if(!viewer.open||!window.TodakPhoto||savedOrbitEpoch", "if((!viewer.open&&orbitCanvas.dataset.inline!=='true')||!window.TodakPhoto||savedOrbitEpoch");
html=html.replace("viewer.showModal();yaw=rot;pitch=.32;zoom=1;renderOrbit();", "orbitCanvas.dataset.inline='true';orbitCanvas.hidden=false;stageEl.appendChild(orbitCanvas);document.body.classList.add('ui-inspecting');orbitCanvas.style.backgroundImage='url('+TodakBackgrounds.url(photoScene)+')';yaw=rot;pitch=.32;zoom=1;renderOrbit();");
html=html.replace("x.fillStyle='#e8e1d3';x.fillRect(0,0,600,540);x.drawImage(out,0,0,600,540);", "if(orbitCanvas.dataset.inline==='true'){x.clearRect(0,0,600,540);}else{x.fillStyle='#e8e1d3';x.fillRect(0,0,600,540);}x.drawImage(out,0,0,600,540);");
html=html.replace('openSaved:async function(item){var token=', "openSaved:async function(item){orbitCanvas.dataset.inline='false';document.body.classList.remove('ui-inspecting');viewer.appendChild(orbitCanvas);var token=");
html=html.replace("viewer.appendChild(orbitCanvas);var token=", "viewer.appendChild(orbitCanvas);orbitCanvas.hidden=false;fingers.clear();pinch=0;var token=");
html=html.replace("render:renderOrbit,state:function()", "render:renderOrbit,turn:function(delta){yaw+=delta;renderOrbit();window.dispatchEvent(new Event('todak-inspection-rotated'));},state:function()");
function required(before,after){if(!html.includes(before))throw Error('Missing integration hook: '+before.slice(0,80));html=html.replace(before,after);}
// Selecting an already hollow work must not silently reshape its inner wall.
required('if(st.height-st.floor>.05){constrainInterior();return;}','if(st.height-st.floor>.05)return;');
required('if(st.stage!=="deco"&&st.stage!=="done")return;','if(!["throw","deco","glaze","done"].includes(st.stage))return;');
// Untranslated attributes must not re-trigger their own translation observer.
required('if(v&&HAN.test(v)){n.setAttribute(a,T(v));}','if(v&&HAN.test(v)){var translated=T(v);if(translated!==v)n.setAttribute(a,translated);}');
required('m.target.setAttribute(m.attributeName,T(v));','var translated=T(v);if(translated!==v)m.target.setAttribute(m.attributeName,translated);');
required('  var RX=[','  Object.assign(D,{"원하는 색 고르기":"Choose a color","색상 코드 입력 (선택)":"Color code (optional)","물감 직접 고르기":"Custom paint color","바탕색 직접 고르기":"Custom base color","붓 유약 직접 고르기":"Custom brush glaze","덧입힐 색 직접 고르기":"Custom dip color"});\n  var RX=[');
// Opening or cancelling a native colour picker is not an edit.
required('$("pigColor").addEventListener("input",onPig); $("pigColor").addEventListener("click",onPig);','$("pigColor").addEventListener("input",onPig);');
required('$("glazeColor").addEventListener("input",onGlaze); $("glazeColor").addEventListener("click",onGlaze);','$("glazeColor").addEventListener("input",onGlaze);');
required("pitch=clamp(pitch+(e.clientY-previous.y)*.008,-1.45,1.5);}renderOrbit();});","pitch=clamp(pitch+(e.clientY-previous.y)*.008,-1.45,1.5);}renderOrbit();window.dispatchEvent(new Event('todak-inspection-rotated'));});");
required("target:'#openFinished360',text:'360° 감상을 눌러 작품을 좌우로 돌리고 위아래로 기울여 보세요. 안쪽과 바닥까지 확인한 뒤 닫기를 누르면 안내가 이어져요.'", "target:'#ui-result-360',text:'상단의 360° 감상 스위치를 켜고 작품을 끌거나 회전 화살표를 눌러 보세요. 직접 돌려 보면 다음 안내로 이어져요. 스위치를 끄면 완성 사진으로 돌아와요.'");
required("target:'#finishedPhoto',text:'완성 사진을 눌러 보세요. 360° 감상에서는 직접 돌려 안쪽과 바닥도 볼 수 있어요. 물레에서 보기와 전환할 수 있어요. 마우스나 한 손가락으로 끌면 도자기가 이동하고, 좌우 화살표는 도자기를 돌려요.'", "target:'#ui-result-360',text:'스위치가 꺼져 있으면 완성 사진이에요. 스위치를 켜면 같은 화면에서 작품을 돌려 안쪽과 바닥도 볼 수 있어요. 사진 크기와 배경은 완성창에서 바꿀 수 있어요.'");
required("var step=current();if(step.id==='inspect360')return $('finished360').open?$('closeFinished360'):$('openFinished360');", "var step=current();if(step.id==='inspect360')return document.body.classList.contains('ui-inspecting')?$('finished360Canvas'):$('ui-result-360');if(step.id==='photo')return $('ui-result-360');");
required("if(step.id==='sound')return $('sound');", "if(step.id==='sound'){var more=$('ui-more-button'),menu=$('ui-more-panel');if(more&&more.getClientRects().length&&menu.hidden)return more;if(!$('viewMenu').open)return $('viewMenu').querySelector('summary');return $('sound');}");
required("return document.querySelector(step.target);", "var matches=Array.from(document.querySelectorAll(step.target));return matches.find(function(e){return e.getClientRects().length;})||matches[0];");
required("afterClick('rackGlazeBrush',function(){mark('glazeBrush');});", "window.addEventListener('todak-inspection-rotated',function(){if(document.body.classList.contains('ui-inspecting'))mark('inspect360');});afterClick('rackGlazeBrush',function(){mark('glazeBrush');});");
required("function focusStep(){refresh();var id=current().id;", "function focusStep(){var id=current().id;if((id==='size'||id==='background')&&document.body.classList.contains('ui-inspecting'))$('finishedPhoto').click();refresh();");
required("$('swatches').addEventListener('click',function(e){if(e.target.closest('[data-g]'))mark('color');});", "$('glazeColor').addEventListener('input',function(){mark('color');});$('swatches').addEventListener('click',function(e){if(e.target.closest('[data-g]'))mark('color');});");
html=html.replaceAll('viewportW<760','uiUsesSheet()');
html=html.replaceAll('색 더 보기에서 더 많은 색과 직접 고르는 색을 사용할 수 있어요.','원하는 색이 없으면 색상 선택기나 색상 코드를 사용해 직접 고를 수 있어요.');
html=html.replaceAll('도자기 뒤쪽 도구통에서','화면의 도구 선택에서');
html=html.replaceAll(' 유약 변경으로 같은 모양에 다른 유약을 입힐 수도 있어요.','');
html=html.replaceAll('첫 작품 완성! 도전하기와 진열장도 이제 사용할 수 있어요.','튜토리얼을 마쳤어요. 홈에서 언제든 다시 볼 수 있어요.');
html=html.replaceAll('소리 옆의 좌우 화살표를','상단 보기 전환 옆의 좌우 화살표를');
html=html.replaceAll('입체 보기를','전체 보기를').replaceAll('입체 보기에서','전체 보기에서').replaceAll('단면·벽 두께 버튼을','단면 버튼을');
html=html.replaceAll('입체/단면 보기로 확인하세요.','전체/단면 보기로 확인하세요.');
html=html.replaceAll('도구통에서 바탕 유약·붓칠를 고르고','도구 선택에서 바탕 유약·붓칠을 고르고');
html=html.replaceAll('드래그로 도자기 이동, 좌우 화살표로 회전, 휠·두 손가락으로 배경 확대·축소. 도자기 크기와 배경은 따로 조절해요.', '상단 스위치로 완성 사진과 360도 감상을 전환해요. 360도에서는 드래그·화살표로 회전하고 휠·두 손가락으로 확대해요. 완성 사진의 도자기 크기와 배경은 따로 조절해요.');
html=html.replace('item.thumb=thumb();lsSave();renderShelf();','item.thumb=thumbNow();lsSave();dbPut(item);renderShelf();');
// Preview only: overhead artwork follows the central view controls.
html=html.replace('return {x:available/2,y:cy,r:r,cm:', 'return {x:wide?W/2:available/2,y:cy,r:r,cm:');
html=html.replace('return {x:wide?W/2:available/2,y:cy,r:r,cm:', "var center=wide?W/2:available/2;if(window.TodakResponsive&&innerWidth<1200){var box=cv.getBoundingClientRect(),safe=(Math.max($('ui-work-info').getBoundingClientRect().bottom,$('ui-work-views').getBoundingClientRect().bottom)-box.top+16)*unit,area=uiUsesSheet()?stageEl.clientWidth:Math.max(240,$('sheet').getBoundingClientRect().left-12);center=area*unit/2;r=Math.max(18*unit,Math.min((area-30)*unit/2,(HC-safe-16*unit)/2));cy=safe+r;}return {x:center,y:cy,r:r,cm:");
html=html.replace("ctx.fillText('내 도자기 · 위에서 꾸미기',l.x,Math.max(55,l.y-l.r-24));",'');
html=html.replace("ctx.fillText('내 도자기 · 밑바닥 '+(st.stage==='done'?'보기':'꾸미기'),l.x,Math.max(55,l.y-l.r-24));",'');
html=html.replace("ctx.fillText('안쪽 원이 실제 밑바닥이에요 · 지름 '+Math.round(l.cm*2)+'cm',l.x,l.y+l.r+19);",'');
// Share one layout rule between the canvas, tool sheet, and physical tool holder.
html=html.replaceAll('window.innerWidth<760','uiUsesSheet()').replaceAll('innerWidth<760','uiUsesSheet()').replaceAll('stageEl.clientWidth>=760','!uiUsesSheet()').replaceAll('stageEl.clientWidth<760','uiUsesSheet()').replaceAll('cw>=760','!uiUsesSheet()').replaceAll('cw<760','uiUsesSheet()');
html=html.replaceAll('innerHeight*.56','Math.min(Math.max(innerHeight*.43,300),Math.max(180,innerHeight-140))');
html=html.replace('innerHeight-100);}', 'innerHeight-(innerWidth<600&&innerHeight<=560?140:180));}');
html=html.replace('function minimum(){return head.getBoundingClientRect().height+26;}', 'function minimum(){return head.getBoundingClientRect().height+26;}');
const rule='function uiUsesSheet(){return innerWidth<960&&!(innerWidth>=600&&innerHeight<=560);}\n';
required("$('goFree').addEventListener('click',function(e){if(complete)return;if(active){e.preventDefault();e.stopImmediatePropagation();closeOverlays();focusStep();return;}active=true;index=0;done=false;contactMs=0;if(!routeTimer)routeTimer=setInterval(route,160);},true);", "$('goFree').addEventListener('click',function(){if(active)stopOptionalTutorial();},true);");
required("var challengeBase=startChallenge;startChallenge=function(id){if(!complete){toast('첫 자유롭게 빚기 안내를 먼저 마쳐 주세요.');return;}return challengeBase(id);};", "var challengeBase=startChallenge;startChallenge=function(id){if(active)stopOptionalTutorial();return challengeBase(id);};");
required('lockHome();window.TodakTutorial=',fs.readFileSync(path.join(sourceDir,'tutorial-presentation.js'),'utf8')+'\n'+fs.readFileSync(path.join(sourceDir,'tutorial-entry.js'),'utf8')+'\n lockHome();window.TodakTutorial=');
const modules=['history-tiles.js','studio-layout.js','responsive-layout.js','experience-polish.js','shelf-cutouts.js','site-feedback-config.js','site-feedback.js'];
if(!production)modules.push('preview-scenes.js');
const code=rule+modules.map(f=>fs.readFileSync(path.join(sourceDir,f),'utf8')).join('\n');
html=html.replace(marker,code+'\n'+marker);
html=html.replace('</head>','<link rel="stylesheet" href="studio-layout.css?v=20261115-layout-3"><link rel="stylesheet" href="responsive-layout.css?v=1"><link rel="stylesheet" href="experience-polish.css?v=1"><link rel="stylesheet" href="site-feedback.css?v=1"><link rel="stylesheet" href="tutorial-presentation.css?v=1">\n'+(production?'<script src="channel-attribution.js"></script>':'<script>if(/^(0[1-9]|10|11|section)$/.test(new URLSearchParams(location.search).get("screen")||"")){try{localStorage.setItem("todak.tutorial.v1","complete");}catch(_){}}</script>')+'\n</head>');
html=html.replace(/<title>[^<]*<\/title>/,production?'<title>토닥 · 온라인 도자기 공방</title>':'<title>토닥 · UI 레이아웃 미리보기</title>');
if(production)html=html.replace('<head>','<head>\n<!-- todak-public-build: 2026-11-16 -->');
if(production){
 required('if(location.hostname==="sosohanlab.github.io"){','if(["todak.sosohanlab.com","sosohanlab.github.io"].includes(location.hostname)){');
 html=html.replaceAll('content="https://sosohanlab.github.io/todak/','content="https://todak.sosohanlab.com/').replace('rel="canonical" href="https://sosohanlab.github.io/todak/"','rel="canonical" href="https://todak.sosohanlab.com/"');
}
fs.writeFileSync(path.join(out,'index.html'),html);
fs.mkdirSync(path.join(out,'migration'),{recursive:true});
for(const file of ['transfer-core.js','domain-transfer.js'])fs.copyFileSync(path.join(root,'migration',file),path.join(out,'migration',file));
console.log(production?'Built production layout without review scenes.':'Built isolated UI preview; public source untouched.');
