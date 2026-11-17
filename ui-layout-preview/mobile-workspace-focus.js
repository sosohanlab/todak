/* On phones the closed drawer is one entry point, rather than a second toolbar. */
(function(){
 'use strict';
 var frame=0;
 function refresh(){frame=0;if(innerWidth>=960||!['throw','deco','glaze'].includes(st.stage))return;var open=$('sheet').classList.contains('open');if(!open){var name=st.stage==='throw'?{shape:'모양 잡기',trim:'깎기',thick:'속·두께',sponge:'매끈하게'}[tool]:st.stage==='deco'?{brush:'붓',stamp:'도장',carve:'조각칼',erase:'지우개',move:'이동'}[dTool]:$('glazeBrush').checked?'유약 붓':'바탕 유약';if(name)$('sheetTitle').textContent=name;$('sheetToggle').textContent='도구 바꾸기';}}
 function schedule(){if(!frame)frame=requestAnimationFrame(refresh);}
 var sheet=setSheet;setSheet=function(){var result=sheet.apply(this,arguments);schedule();return result;};
 var stage=setStage;setStage=function(){var result=stage.apply(this,arguments);schedule();return result;};
 document.addEventListener('click',schedule);window.addEventListener('resize',schedule);schedule();
 var style=document.createElement('style');style.textContent=`
 @media(max-width:959px){
  body.tutorial-guided #ui-work-info #ui-piece-name{display:none!important}
  body.tutorial-guided.ui-throw-bar #ui-work-info{min-height:48px!important;padding-top:6px!important;padding-bottom:6px!important}
  body.tutorialPresentationReady #tutorialCoach{padding:11px 13px!important;border-color:#bdc8e2;border-left:3px solid var(--cobalt);border-radius:12px;box-shadow:0 3px 12px #141e3612}
  body.tutorialPresentationReady #tutorialCoach .tutorialTop,#tutorialCoach #tutorialStages,#tutorialCoach .tutorialTaskLabel,body.tutorialPresentationReady #tutorialCoach #tutorialStatus{display:none!important}
  #tutorialCoach .tutorialCurrent{display:block;padding:0;margin:0;background:transparent;color:var(--ink)}
  body.tutorialPresentationReady #tutorialCoach #tutorialTitle{font-size:14px;line-height:1.45;color:var(--ink)}
  #tutorialCoach>#tutorialAction{margin-top:5px!important}
  #tutorialCoach #tutorialAction #tutorialText{font-size:12px;line-height:1.5;color:var(--muted)}
  #tutorialVesselOutline{stroke:none}
  body.tutorialPresentationReady #tutorialHand[data-target-kind=vessel]{width:30px;height:30px}
  body.tutorialPresentationReady #tutorialHand[data-target-kind=vessel] svg{width:30px;height:30px}
  body.tutorialPresentationReady #tutorialHand[data-target-kind=vessel]::after{display:none!important}
  body[data-ui-layout=sheet]:is([data-ui-stage=throw],[data-ui-stage=deco],[data-ui-stage=glaze]) #sheet:not(.open){min-height:0!important}
  body[data-ui-layout=sheet] #sheet:not(.open) .quick-tools,body[data-ui-layout=sheet] #sheet:not(.open) .quick-tool-hint{display:none!important}
  body[data-ui-layout=sheet] #sheet:not(.open) #sheetGrab{height:14px;min-height:14px}
  body[data-ui-layout=sheet] #sheet:not(.open) .sheetHead{padding:2px 12px 10px;min-height:42px;gap:10px}
  body[data-ui-layout=sheet] #sheet:not(.open) .sheetHead h2{font:600 13px/1.4 var(--body);order:-1;margin-right:auto}
  body[data-ui-layout=sheet] #sheet:not(.open) #sheetToggle{min-height:38px;padding:6px 10px;font-size:12px}
  body[data-ui-layout=sheet] #sheet:not(.open) #stageHelpButton{min-height:38px;margin-left:0;padding:6px 10px;font-size:12px}
 }
 `;document.head.appendChild(style);
})();
