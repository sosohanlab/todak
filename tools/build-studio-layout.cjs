const fs=require('fs'),path=require('path');
const root=path.dirname(__dirname),sourceDir=path.join(root,'ui-layout-preview');
const production=process.argv.includes('--production'),out=production?path.join(root,'release-site'):sourceDir;
fs.mkdirSync(out,{recursive:true});
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
if(html.includes('<!-- todak-public-build:'))html=fs.readFileSync(path.join(root,'tools/studio-base.html'),'utf8');
const marker='if(hot&&hot.ready){hot.ready(start);}';
if(!html.includes(marker))throw Error('Missing startup');
const shopAt=html.indexOf('var catalog={background:'),shopStart=html.lastIndexOf('(function(){',shopAt),shopEnd=html.indexOf('})();',html.indexOf('window.TodakShop={',shopAt));
if(shopAt<0||shopStart<0||shopEnd<0)throw Error('Missing shop integration');
html=html.slice(0,shopStart)+fs.readFileSync(path.join(root,'shop.js'),'utf8')+html.slice(shopEnd+5);
// Keep depth controls, replacing the former large-cut blade with a bounded finishing tool.
const trimStart=html.indexOf('/* Optional leather-hard trimming.'),trimEnd=html.indexOf('/* A continuously resizable mobile tool sheet.',trimStart);
if(trimStart<0||trimEnd<0)throw Error('Missing retired-tool boundaries');
html=html.slice(0,trimStart)+fs.readFileSync(path.join(sourceDir,'interior-depth-controls.js'),'utf8')+'\n'+fs.readFileSync(path.join(sourceDir,'fine-trimming.js'),'utf8')+'\n'+html.slice(trimEnd);
html=html.replaceAll("['trim','sponge']","['sponge']");
html=html.replace("shapeTool('trim','깎아 만들기');",'');
const scoreStart=html.indexOf('function roughnessSignal('),scoreEnd=html.indexOf('var ghostUntil=0;',scoreStart);
if(scoreStart<0||scoreEnd<0)throw Error('Missing scoring boundaries');
html=html.slice(0,scoreStart)+fs.readFileSync(path.join(sourceDir,'challenge-scoring.js'),'utf8')+'\n'+fs.readFileSync(path.join(sourceDir,'challenge-score-integration.js'),'utf8')+'\n'+html.slice(scoreEnd);
html=html.replace('if(throwing&&tool!=="thick"&&st.target&&TARGETS[st.target]&&ghostOn())','if(throwing&&st.target&&TARGETS[st.target]&&ghostOn())');
html=html.replace('ctx.moveTo(hp.x-17,hp.y); ctx.lineTo(CX+rAt(1)*SV,hp.y);', 'ctx.moveTo(hp.x+(hp.x<CX?17:-17),hp.y); ctx.lineTo(CX+(hp.x<CX?-1:1)*rAt(1)*SV,hp.y);');
html=html.replace('var compact=window.innerWidth<=1440,host=compact?', 'var compact=window.innerWidth<760,host=compact?');
html=html.replace("if(!viewer.open||!window.TodakPhoto||savedOrbitEpoch", "if((!viewer.open&&orbitCanvas.dataset.inline!=='true')||!window.TodakPhoto||savedOrbitEpoch");
html=html.replace("viewer.showModal();yaw=rot;pitch=.32;zoom=1;renderOrbit();", "orbitCanvas.dataset.inline='true';orbitCanvas.hidden=false;stageEl.appendChild(orbitCanvas);document.body.classList.add('ui-inspecting');orbitCanvas.style.backgroundImage='url('+TodakBackgrounds.url(photoScene)+')';yaw=rot;pitch=.32;zoom=1;renderOrbit();");
html=html.replace("x.fillStyle='#e8e1d3';x.fillRect(0,0,600,540);x.drawImage(out,0,0,600,540);", "if(orbitCanvas.dataset.inline==='true'){x.clearRect(0,0,600,540);}else{x.fillStyle='#e8e1d3';x.fillRect(0,0,600,540);}x.drawImage(out,0,0,600,540);");
html=html.replace('openSaved:async function(item){var token=', "openSaved:async function(item){orbitCanvas.dataset.inline='false';document.body.classList.remove('ui-inspecting');viewer.appendChild(orbitCanvas);var token=");
html=html.replace("viewer.appendChild(orbitCanvas);var token=", "viewer.appendChild(orbitCanvas);orbitCanvas.hidden=false;fingers.clear();pinch=0;var token=");
html=html.replace("render:renderOrbit,state:function()", "render:renderOrbit,turn:function(delta){yaw+=delta;renderOrbit();window.dispatchEvent(new Event('todak-inspection-rotated'));},state:function()");
function required(before,after){if(!html.includes(before))throw Error('Missing integration hook: '+before.slice(0,80));html=html.replace(before,after);}
required('window.TodakWheel={forms:forms,','window.TodakWheel={exportDraft:function(){return {top:top,bottom:bottom,glazeBrush:glazeBrush,glazeMode:glazeMode,checks:checks};},restoreDraft:function(s){s=s||{};active=null;last=null;pendingTop=null;bottomActive=null;bottomPending=null;history=[];bottomHistory=[];loaded=st.topPaint||null;bottomLoaded={bottomPaint:st.bottomPaint||null,bottomCarve:st.bottomCarve||null};topVersion++;bottomVersion++;bottomReliefVersion++;topSurfaceKey=topBaseKey=bottomKey="";top=!!s.top;bottom=!top&&!!s.bottom;glazeBrush=!!s.glazeBrush;glazeMode=s.glazeMode==="brush"?"brush":s.glazeMode==="base"?"base":null;checks=!!s.checks;$("glazeBrush").checked=glazeBrush;refresh();},forms:forms,');
// Coalesce breakage dragging into one draw per display frame; show the dialog before preparation.
required("function sample(a,t){var p=Math.max(0,Math.min(1,t))*(a.length-1)","var pointerFrame=0,wholeImage=null;function queueBreakDraw(){if(!pointerFrame)pointerFrame=requestAnimationFrame(function(){pointerFrame=0;if(dlg.open)draw();});}\n function sample(a,t){var p=Math.max(0,Math.min(1,t))*(a.length-1)");
required("if(view){var rendered=view.render(640,450,progress);", "if(view){var rendered=progress==null&&wholeImage?wholeImage:view.render(640,450,progress);");
required("async function open(item){epoch++;var token=epoch;", "async function open(item){epoch++;wholeImage=null;var token=epoch;");
required("view=made;pileThumb=view.pileImage();ready=true;", "view=made;wholeImage=document.createElement('canvas');wholeImage.width=640;wholeImage.height=450;wholeImage.getContext('2d').drawImage(view.render(640,450,null),0,0,640,450);pileThumb=view.pileImage();ready=true;");
required("dlg.showModal();queuePile();draw();try{if(!window.TodakPhoto", "dlg.showModal();queuePile();draw();await new Promise(function(resolve){requestAnimationFrame(function(){setTimeout(resolve,0);});});try{if(!window.TodakPhoto");
required("object.y=Math.max(110,Math.min(310,p.y+swing.oy));draw();e.preventDefault();", "object.y=Math.max(110,Math.min(310,p.y+swing.oy));queueBreakDraw();e.preventDefault();");
required("flight.z+=dt*1.65;object.x+=flight.vx*dt;", "flight.z=(now-flight.start)/1000*1.65;object.x+=flight.vx*dt;");
required("y:(e.clientY-b.top)*450/b.height,t:performance.now()", "y:(e.clientY-b.top)*450/b.height,t:Number.isFinite(e.timeStamp)&&e.timeStamp>0&&e.timeStamp<1e12?e.timeStamp:performance.now()");
required("var p=point(e);swing.last=p;swing.samples.push(p);swing.samples=swing.samples.filter(function(a){return p.t-a.t<110;});object.x=", "var p=point(e),previous=swing.last;swing.last=p;swing.samples.push(p);swing.samples=swing.samples.filter(function(a){return p.t-a.t<110;});if(swing.samples.length<2)swing.samples.unshift(previous);object.x=");
required("dlg.addEventListener('close',function(){epoch++;cancelAnimationFrame(raf);swing=null;flight=null;work=null;ready=false;", "dlg.addEventListener('close',function(){if(dlg.open)return;epoch++;cancelAnimationFrame(raf);cancelAnimationFrame(pointerFrame);pointerFrame=0;swing=null;flight=null;work=null;ready=false;");
// Setting an unchanged canvas width or height clears its bitmap on every UI click.
required('cv.width=Math.round(W*dpr); cv.height=Math.round(HC*dpr);','var bitmapWidth=Math.round(W*dpr),bitmapHeight=Math.round(HC*dpr);if(cv.width!==bitmapWidth)cv.width=bitmapWidth;if(cv.height!==bitmapHeight)cv.height=bitmapHeight;');
// The kiln already has a temperature on its control panel.
required('$("temp").hidden=(s!=="fire");','$("temp").hidden=true;');
required('$("temp").hidden=fstep!=="firing";','$("temp").hidden=true;');
// Card/search exports must include the same object pan and size as the live photo.
required('var image=TodakPhoto.export(photoData(),Math.min(2048,Math.max(dw,dh)),dw/dh);','var image=TodakPhoto.export(window.TodakRealPhoto?TodakRealPhoto.exportData():photoData(),Math.min(2048,Math.max(dw,dh)),dw/dh);');
required('function imageCanvas(size,neutral){\n    var d=photoData();', 'function imageCanvas(size,neutral){\n    var d=window.TodakRealPhoto?TodakRealPhoto.exportData():photoData();');
required('window.TodakRealPhoto={drawBackground:drawBackground,','window.TodakRealPhoto={exportData:function(){var data=photoData();data.zoom=1;data.panX=objectPan.x;data.panY=objectPan.y;data.objectScale=photoObjectScale;return data;},drawBackground:drawBackground,');
required('dlg.hidden=false; cardDirty=true; dirty=true;','dlg.hidden=false; renderCard(); cardDirty=false; dirty=true;');
required("target:'#realPhotoScene'","target:'#ui-background-picker'");
// Search remains an explicit action; a delayed modal must not interrupt photo editing.
required('autoTimer=setTimeout(prompt,12000);','');
required("#sheet,[role=dialog],.drawer,.modal,.overlay","#sheet,dialog,[role=dialog],.drawer,.modal,.overlay");
// Shorter, readable kiln loading/firing/cooling and reveal animations.
required('loadA=clamp((now-fT)/1300','loadA=clamp((now-fT)/950');
required('fT=now+250; fireUI();','fT=now+150; fireUI();');
required('doorA=1-clamp((now-fT)/900','doorA=1-clamp((now-fT)/650');
required('(st.kilnType==="wood"?6400:5200)','3400');
required('c=clamp((now-fT)/1400','c=clamp((now-fT)/950');
required('(performance.now()-revealStart)/2600','(performance.now()-revealStart)/1900');
// Tool selection is a radio choice, including when the same tool is chosen again.
required("glazeMode=glazeMode==='base'?null:'base';", "glazeMode='base';");
required("glazeMode=glazeMode==='brush'?null:'brush';", "glazeMode='brush';");
// Dip is one continuous operation; the slider owns its depth in every play mode.
required('<button type="button" class="chip" data-dip="rim" aria-pressed="false">입구만</button>','<button type="button" class="chip" data-dip="custom" aria-pressed="false">담그기</button>');
required('<button type="button" class="chip" data-dip="half" aria-pressed="false">절반까지</button>','');
required('pick("dip",function(d){st.dip=d.dip;st.dipDepth=st.dip==="half"?.5:.2;', 'pick("dip",function(d){st.dip=d.dip;st.dipDepth=clamp(typeof st.dipDepth==="number"?st.dipDepth:.2,.01,1);');
required('press("dip","dip",st.dip);','press("dip","dip",st.dip?"custom":"");');
html=html.replaceAll('입구만 또는 절반까지를 고른 뒤','담그기를 켠 뒤');
html=html.replaceAll('잘했어요! 다음 안내로 이어집니다.','이 단계를 확인했어요.');
required("document.querySelector('#dip [data-dip=\"half\"]')","document.querySelector('#dip [data-dip=\"custom\"]')");
required("function(error){if(active&&current().id==='save')mark('save');throw error;}","function(error){throw error;}");
required('finally{clearTimeout(timeout);if(epoch===searchEpoch){btn.disabled=false;controller=null;}}',"finally{clearTimeout(timeout);if(epoch===searchEpoch){btn.disabled=false;controller=null;window.dispatchEvent(new CustomEvent('todak-image-search-finished',{detail:{matches:$('imageMatches').children.length,status:$('searchStatus').textContent}}));}}");
required('return (id||st.target)+((blind==null?st.blind:blind)?"_b":"")+"_v2";', 'return (id||st.target)+((blind==null?st.blind:blind)?"_b":"")+"_v3";');
required('var oldBest=store.best[id+(st.blind?"_b":"")];', 'var previousKey=id+(st.blind?"_b":"");var oldBest=store.best[previousKey+"_v2"]!=null?store.best[previousKey+"_v2"]:store.best[previousKey];');
required('var previous=store.best[CH_ORDER[i]+"_b"];', 'var previous=store.best[CH_ORDER[i]+"_b_v2"]!=null?store.best[CH_ORDER[i]+"_b_v2"]:store.best[CH_ORDER[i]+"_b"];');
required('옆선 45점 · 높이 25점 · 속 깊이 10점 · 안팎 매끈함 20점으로 평가해요.', '옆선 40점 · 높이 20점 · 속 완성도 15점 · 안팎 매끈함 15점 · 남은 횟수 10점으로 평가해요. 모양 잡기 2번까지는 횟수 점수 10점, 이후에는 남은 비율로 계산해요. 속이 막혔거나 너무 좁으면 최대 59점이에요.');
required('$("scoreDetail").textContent="옆선 "+parts.outline+"/45 · 높이 "+parts.height+"/25 · 속 깊이 "+parts.depth+"/10 · 매끈함 "+parts.surface+"/20"+(parts.solid?" · 속을 파지 않은 작품은 최대 59점":"");', 'renderChallengeScoreParts(parts);');
required('(sc>=90?"본과 거의 똑같아요.":(sc>=75?"꽤 닮았어요.":(sc>=50?"느낌은 살렸어요.":"자기만의 길을 갔네요.")))', 'challengeScoreVerdict(parts)');
required('" 모양 잡기 "+(st.touches||0)+"번"', '" 모양 잡기 "+(st.touches||0)+"/"+parts.limit+"번"');
const oldScoreSummary=html.match(/^\s*\$\("scoreSub"\)\.innerHTML=.*$/m);if(!oldScoreSummary)throw Error('Missing score summary');required(oldScoreSummary[0],'    renderChallengeScoreSummary(parts,TT,best);');
required('it.creationMode=st.target?"challenge":"free";', 'it.constructionMethod="wheel";it.creationMode=st.target?"challenge":"free";if(st.target&&TARGETS[st.target]){var scored=scoreBreakdown();it.challengeScoring={version:3,method:"wheel",targetId:st.target,mode:TARGETS[st.target].master?"master":st.blind?"blind":"guided",group:st.target+"|wheel|"+(st.blind?"blind":"guided")+"|v3",used:scored.used,limit:scored.limit,remaining:scored.remaining,verification:"local",geometry:{height:st.height,floor:st.floor,rimSoftness:st.rimSoftness||0,radii:st.radii.slice(),inner:st.inner.slice()},parts:{outline:scored.outline,height:scored.height,depth:scored.depth,surface:scored.surface,moves:scored.moves},total:scored.total};}else{delete it.challengeScoring;}');
required('depthNeed:Math.max(.01,(work.profile.h-work.profile.floor)/work.profile.h),communityId:', 'depthNeed:Math.max(0,(work.profile.h-work.profile.floor)/work.profile.h),scoreProfile:{inner:work.profile.inner.slice(),floor:work.profile.floor,rimSoftness:work.visual&&work.visual.rimSoftness||0},communityId:');
required('refresh:refresh,surface:function(){return topSurface(topLayout());}', 'refresh:refresh,cancelGesture:function(commit){if(commit){var event={preventDefault:function(){},stopImmediatePropagation:function(){}};if(active!==null){event.pointerId=active;end(event);}if(bottomActive!==null){event.pointerId=bottomActive;bottomEnd(event);}return;}if(active!==null&&top)history.pop();if(bottomActive!==null)bottomHistory.pop();active=bottomActive=null;pendingTop=bottomPending=null;last=bottomLast=null;changed=bottomChanged=false;activeCursor.hidden=true;},surface:function(){return topSurface(topLayout());}');
// Selecting an already hollow work must not silently reshape its inner wall.
required('if(st.height-st.floor>.05){constrainInterior();return;}','if(st.height-st.floor>.05)return;');
required('if(st.stage!=="deco"&&st.stage!=="done")return;','if(!["throw","deco","glaze","done"].includes(st.stage))return;');
// Untranslated attributes must not re-trigger their own translation observer.
required('if(v&&HAN.test(v)){n.setAttribute(a,T(v));}','if(v&&HAN.test(v)){var translated=T(v);if(translated!==v)n.setAttribute(a,translated);}');
required('m.target.setAttribute(m.attributeName,T(v));','var translated=T(v);if(translated!==v)m.target.setAttribute(m.attributeName,translated);');
required('  var RX=[','  Object.assign(D,{"원하는 색 고르기":"Choose a color","색상 코드 입력 (선택)":"Color code (optional)","물감 직접 고르기":"Custom paint color","바탕색 직접 고르기":"Custom base color","붓 유약 직접 고르기":"Custom brush glaze","덧입힐 색 직접 고르기":"Custom dip color","속 완성도":"Interior quality","횟수 점수":"Moves","남은 횟수":"Moves left","속이 막혔거나 너무 좁으면 최대 59점":"Closed or nearly closed interiors are capped at 59"});\n  var RX=[');
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
required('lockHome();window.TodakTutorial=',fs.readFileSync(path.join(sourceDir,'tutorial-sequence.js'),'utf8')+'\n'+fs.readFileSync(path.join(sourceDir,'tutorial-behavior.js'),'utf8')+'\n'+fs.readFileSync(path.join(sourceDir,'tutorial-presentation.js'),'utf8')+'\n'+fs.readFileSync(path.join(sourceDir,'tutorial-entry.js'),'utf8')+'\n'+fs.readFileSync(path.join(sourceDir,'grouped-tutorial.js'),'utf8')+'\n lockHome();window.TodakTutorial=');
const modules=['history-tiles.js','studio-layout.js','responsive-layout.js','experience-polish.js','stage-navigation.js','card-dialog-layout.js','appearance-picker.js','workshop-simplification.js','shelf-cutouts.js','site-feedback-config.js','site-feedback.js'];
modules.push('work-in-progress.js');
if(!production)modules.push('preview-scenes.js');
const code=rule+modules.map(f=>fs.readFileSync(path.join(sourceDir,f),'utf8')).join('\n');
html=html.replace(marker,code+'\n'+marker);
html=html.replace('</head>','<link rel="stylesheet" href="studio-layout.css?v=20261115-layout-3"><link rel="stylesheet" href="responsive-layout.css?v=1"><link rel="stylesheet" href="experience-polish.css?v=1"><link rel="stylesheet" href="site-feedback.css?v=1"><link rel="stylesheet" href="tutorial-presentation.css?v=1">\n'+(production?'<script src="channel-attribution.js"></script>':'<script>if(/^(0[1-9]|10|11|section)$/.test(new URLSearchParams(location.search).get("screen")||"")){try{localStorage.setItem("todak.tutorial.v1","complete");}catch(_){}}</script>')+'\n</head>');
html=html.replace(/<title>[^<]*<\/title>/,production?'<title>토닥 · 온라인 도자기 공방</title>':'<title>토닥 · UI 레이아웃 미리보기</title>');
if(production)html=html.replace('<head>','<head>\n<!-- todak-public-build: 2026-11-16 -->');
html=require('./integrate-search-speed.cjs')(html);
if(production){
 required('if(location.hostname==="sosohanlab.github.io"){','if(["todak.sosohanlab.com","sosohanlab.github.io"].includes(location.hostname)){');
 html=html.replaceAll('content="https://sosohanlab.github.io/todak/','content="https://todak.sosohanlab.com/').replace('rel="canonical" href="https://sosohanlab.github.io/todak/"','rel="canonical" href="https://todak.sosohanlab.com/"');
}
fs.writeFileSync(path.join(out,'index.html'),html);
fs.mkdirSync(path.join(out,'migration'),{recursive:true});
for(const file of ['transfer-core.js','domain-transfer.js'])fs.copyFileSync(path.join(root,'migration',file),path.join(out,'migration',file));
console.log(production?'Built production layout without review scenes.':'Built isolated UI preview; public source untouched.');
