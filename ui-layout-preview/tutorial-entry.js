/* Optional home entry. Normal Free/Challenge play never starts or requires the guide. */
var stopOptionalTutorial;
(function(){
 var entry=document.createElement('div');entry.className='homeTutorialEntry';entry.innerHTML='<button type="button" id="goTutorial"><b id="tutorialEntryTitle">튜토리얼 <small>선택</small></b><span id="tutorialEntryDescription">빚기부터 완성까지 따라 배워요. 언제든 다시 볼 수 있어요.</span></button><button type="button" id="restartTutorial" class="textBtn" hidden>처음부터</button>';
 var menus=document.querySelector('#home .homeMenus')||$('homeClose').parentNode;menus.insertBefore(entry,$('goFree'));
 function updateEntry(){setEntryText($('tutorialEntryTitle'),active?'튜토리얼 이어하기':'튜토리얼');setEntryText($('tutorialEntryDescription'),active?'홈에 머무는 동안에는 안내가 잠시 쉬어요.':'빚기부터 완성까지 따라 배워요. 언제든 다시 볼 수 있어요.');$('goTutorial').setAttribute('aria-label',active?'튜토리얼 이어하기':'튜토리얼 시작');$('restartTutorial').hidden=!active;$('homeClose').textContent=active?'튜토리얼로 돌아가기':'하던 작업으로 돌아가기';}
 function setEntryText(element,text){if(element.textContent!==text)element.textContent=text;}
 function closeGuideWindows(){if(!$('cardDlg').hidden)$('cardClose').click();if(!$('searchDlg').hidden)$('closeSearch').click();if($('finished360')&&$('finished360').open)$('closeFinished360').click();}
 lockHome=function(){note.hidden=true;$('goFree').classList.remove('tutorialFirstStart');$('goFree').removeAttribute('aria-describedby');updateEntry();};
 stopOptionalTutorial=function(){cancelAdvance();if(routeTimer){clearInterval(routeTimer);routeTimer=null;}active=false;engaged=false;done=false;contactMs=0;closeGuideWindows();hideGuide();if(highlight)highlight.classList.remove('tutorialTarget');highlight=null;$('nextBtn').disabled=false;try{complete=localStorage.getItem(KEY)==='complete';}catch(_){}lockHome();};
 function begin(restart){
  if(active&&!restart){closeOverlays();focusStep();if(done)scheduleAdvance();return;}
  stopOptionalTutorial();startFree();active=true;complete=false;index=0;done=false;engaged=false;contactMs=0;if(!routeTimer)routeTimer=setInterval(route,160);focusStep();lockHome();
 }
 $('goTutorial').onclick=function(){begin(false);};$('restartTutorial').onclick=function(){begin(true);};
 ['goChallenge','goShelf','homeShop','openQuality'].forEach(function(id){var button=$(id);if(button)button.addEventListener('click',function(){if(active)stopOptionalTutorial();},true);});
 var finishGuide=finish;finish=function(skipped){if(skipped){stopOptionalTutorial();showHome(true);toast('튜토리얼을 나왔어요. 홈에서 언제든 다시 시작할 수 있어요.');return;}finishGuide(false);updateEntry();};
 var homeWithGuide=showHome;showHome=function(canClose){if(active)closeGuideWindows();var result=homeWithGuide(canClose);updateEntry();return result;};
 $('tutorialSkip').textContent='홈으로';$('tutorialSkip').setAttribute('aria-label','튜토리얼을 잠시 쉬고 홈으로 돌아가기');$('tutorialSkip').onclick=function(){showHome(true);};
})();
