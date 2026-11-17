/* Keep tool choice next to its settings on every screen. Reuse the real controls. */
(function(){
 'use strict';
 document.body.classList.add('ui-tool-flow');
 ['deco','glaze'].forEach(function(stage){[['Side','옆모습'],['Top','윗모습'],['Bottom','밑바닥']].forEach(function(pair){var b=$('wheel'+pair[0]+'-'+stage);b.textContent=pair[1];b.title=pair[1]+'으로 보기';b.setAttribute('aria-label',b.title);});});
 ['shape','trim','thick','sponge'].forEach(function(key,i){var b=document.querySelector('#tools [data-t="'+key+'"]');if(b)$('tools').appendChild(b);var q=document.querySelector('.quick-tools [data-quick="'+key+'"]');if(q){q.textContent=(i+1)+' '+({shape:'모양 잡기',trim:'깎기',thick:'속·두께',sponge:'매끈하게'})[key];document.querySelector('.quick-tools').appendChild(q);}});
 var cue=document.createElement('p');cue.id='ui-tool-action';cue.setAttribute('aria-live','polite');cue.setAttribute('aria-atomic','true');
 var descriptions={shape:['모양 잡기','바깥 옆선을 잡고 좌우로 끌어요.'],thick:['속·두께','안쪽 벽을 좌우로 끌어요. 속 깊이는 아래에서 조절해요.'],trim:['깎기','옆선을 안쪽으로 조금 끌면 좁게 깎여요.'],sponge:['매끈하게','다듬을 곳을 고른 뒤 표면을 문질러요.'],brush:['붓','색과 굵기를 고르고 작품 위를 끌어 그려요.'],stamp:['도장','도장 모양을 고르고 작품을 눌러요.'],carve:['조각칼','음각·양각을 고른 뒤 작품 위에 선을 그어요.'],erase:['지우개','지울 곳을 문질러요.'],base:['바탕 유약','색을 고르면 작품 전체에 입혀져요.'],glazeBrush:['붓 유약','색과 굵기를 고르고 원하는 곳을 칠해요.']};
 ['rotL','rotR'].forEach(function(id,i){$(id).innerHTML=(i?'↷':'↶')+'<span class="rotation-name">'+(i?'오른쪽':'왼쪽')+'</span>';$(id).setAttribute('aria-label',i?'오른쪽으로 돌리기':'왼쪽으로 돌리기');$(id).title=$(id).getAttribute('aria-label');});
 var previousTips=showTips;showTips=function(){previousTips();var hint=document.querySelector('.quick-tool-hint');if(hint)hint.textContent=hint.textContent.replace('② 속·두께','③ 속·두께');};showTips();
 var last='',frame=0;
 function refresh(){
  frame=0;var editable=['throw','deco','glaze'].includes(st.stage),key=st.stage==='throw'?tool:st.stage==='deco'?dTool:$('rackGlazeBrush').getAttribute('aria-pressed')==='true'?'glazeBrush':'base';
  cue.hidden=!editable;if(!editable)return;var row=st.stage==='throw'?$('tools'):st.stage==='deco'?$('ui-touch-deco'):$('ui-touch-glaze');if(cue.previousElementSibling!==row)row.after(cue);
  var text=descriptions[key]||descriptions.shape;if(last!==key){cue.textContent=text[1];if(st.stage==='deco'){var orders={brush:['f-pig','f-size','f-opacity','f-ring','f-stamp','f-carve-mode'],stamp:['f-stamp','f-size','f-pig','f-opacity','f-ring','f-carve-mode'],carve:['f-carve-mode','f-size','f-ring','f-pig','f-opacity','f-stamp'],erase:['f-size','f-pig','f-opacity','f-ring','f-stamp','f-carve-mode']},anchor=cue;(orders[key]||orders.brush).forEach(function(id){var field=$(id);anchor.after(field);anchor=field;});}last=key;}$('sheetTitle').textContent=text[0];
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(refresh);}
 // A selected tool stays selected when pressed again; colour controls do not vanish.
 ['rackGlazeBase','rackGlazeBrush'].forEach(function(id){var b=$(id),action=b.onclick;b.onclick=function(e){if(this.getAttribute('aria-pressed')!=='true')action.call(this,e);schedule();};});
 var stage=setStage;setStage=function(){var result=stage.apply(this,arguments);schedule();return result;};
 document.addEventListener('click',function(e){if(e.target.closest('#tools,#dtools,#rackGlaze')){if(!window.TodakTutorial?.state().active)$('sheetBody').scrollTop=0;}schedule();if(window.TodakTutorial?.state().active)requestAnimationFrame(function(){window.TodakTutorialPresentation?.refresh();});});
 document.addEventListener('input',schedule);window.addEventListener('resize',schedule);
 window.TodakToolFlow={refresh:refresh};window.TodakPolish.sync();window.TodakResponsive.refresh();refresh();
 var style=document.createElement('style');style.textContent=`
 body.ui-tool-flow #ui-work-views #sheetViewBar::before{display:none}
 body.ui-tool-flow #ui-work-views .rotationControls::before{content:'돌리기';color:var(--ink);font-size:10px;font-weight:700;white-space:nowrap}
 body.ui-tool-flow #ui-work-views .rotationControls{gap:3px!important}
 body.ui-tool-flow #ui-work-views .rotationControls button{display:flex;align-items:center;justify-content:center;gap:4px;font-size:22px!important;line-height:1!important;width:74px!important;min-width:74px!important;height:36px!important;padding:0 4px!important;border:1px solid var(--cobalt)!important;background:#e8edff!important;color:var(--cobalt)!important}.rotation-name{font-size:11px;font-weight:700}@media(max-width:959px){body.ui-tool-flow #ui-work-views .rotationControls button{width:34px!important;min-width:34px!important}.rotation-name{display:none}}
 body.ui-tool-flow #ui-work-views #sheetViewBar button{height:34px!important;min-height:34px!important;padding:4px 6px!important;font-weight:700!important;border:1px solid var(--line)!important;font-size:11px!important}
 body.ui-tool-flow #ui-work-views #sheetViewBar button[aria-pressed=false]{background:#fffdf7!important}
 #ui-measurements,#dims,#f-presets{display:none!important}
 body.ui-tool-flow #potteryToolRack,body.ui-tool-flow #rackToolName{display:none!important}
 body.ui-tool-flow #ui-touch-deco,body.ui-tool-flow #ui-touch-glaze{display:block;position:sticky;top:0;z-index:3;background:var(--paper)!important;padding:0 0 7px;margin:0}
 body.ui-tool-flow #ui-touch-deco[hidden],body.ui-tool-flow #ui-touch-glaze[hidden]{display:none!important}
 body.ui-tool-flow #ui-touch-deco #dtools{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important}
 body.ui-tool-flow #ui-touch-glaze #rackGlaze{display:grid!important;position:static!important;inset:auto!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;pointer-events:auto}
 body.ui-tool-flow #ui-touch-glaze #rackGlaze[hidden]{display:none!important}
 body.ui-tool-flow #sheet #ui-touch-deco #dtools .rackTool,body.ui-tool-flow #sheet #ui-touch-glaze .rackTool{position:static!important;inset:auto!important;transform:none!important;display:flex!important;align-items:center;justify-content:center!important;flex-direction:column;gap:4px;min-height:62px!important;min-width:0!important;width:auto!important;height:auto!important;padding:7px 4px!important;border:1px solid var(--line)!important;border-radius:10px!important;background:transparent!important;color:var(--ink);font-size:12px!important;box-shadow:none!important;filter:none!important}
 body.ui-tool-flow #sheet #ui-touch-deco #dtools .rackTool[aria-pressed=true],body.ui-tool-flow #sheet #ui-touch-glaze .rackTool[aria-pressed=true]{background:var(--cobalt)!important;border-color:var(--cobalt)!important;color:white!important}
 body.ui-tool-flow #sheet #ui-touch-deco svg,body.ui-tool-flow #sheet #ui-touch-glaze svg{position:static!important;transform:none!important;width:24px!important;height:24px!important;object-fit:contain;filter:none!important;stroke:none;fill:none}
 body.ui-tool-flow #sheet #ui-touch-deco .rackTool span,body.ui-tool-flow #sheet #ui-touch-glaze .rackTool span{position:static!important;transform:none!important;display:block!important;background:none!important;padding:0!important;color:inherit;opacity:1!important;font-size:12px;white-space:nowrap}
 body.ui-tool-flow #sheet #tools{position:sticky;top:0;z-index:3;background:var(--paper)!important;box-shadow:0 6px 0 var(--paper)}
 #ui-tool-action{margin:7px 0 12px!important;padding:0!important;font-size:12px;line-height:1.55;color:var(--muted);word-break:keep-all;min-height:19px}
 body.ui-tool-flow .sheetHead h2{font-size:20px}
 body.ui-tool-flow #sheetBody{scroll-padding-top:76px}
 body.ui-tool-flow #sheetBody input,body.ui-tool-flow #sheetBody .rangehead{scroll-margin-top:76px}
 body.ui-tool-flow .ui-touch-tool-picker:empty{display:none}
 @media(max-width:599px){body.ui-tool-flow #sheet #ui-touch-deco #dtools .rackTool,body.ui-tool-flow #sheet #ui-touch-glaze .rackTool{min-height:52px!important;padding:4px!important;gap:3px}body.ui-tool-flow #sheet #ui-touch-deco svg,body.ui-tool-flow #sheet #ui-touch-glaze svg{width:20px!important;height:20px!important}#ui-tool-action{margin:6px 0 9px!important}}
 `;document.head.appendChild(style);
})();
