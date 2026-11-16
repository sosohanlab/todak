(function(){
 // Preserve the original controls and listeners while giving touch tools usable space.
 var decoTouch=document.createElement('div'),glazeTouch=document.createElement('div');decoTouch.id='ui-touch-deco';glazeTouch.id='ui-touch-glaze';decoTouch.className=glazeTouch.className='ui-touch-tool-picker';$('p-deco').prepend(decoTouch);$('p-glaze').prepend(glazeTouch);
 $('dToolTip').closest('.field').hidden=true;
 $('ui-goal-info').hidden=true;$('ui-goal-dims').hidden=true;
 // Keep the completion panel in one continuous flow, without nested accordions.
 var result=document.createElement('section');result.id='ui-result-details';result.className='ui-completion-result';result.setAttribute('aria-label','도전 결과');$('scoreBox').before(result);result.append($('scoreBox'),$('scoreDetail'));
 var photoSettings=document.createElement('section');photoSettings.id='ui-photo-settings';photoSettings.className='ui-completion-settings';photoSettings.innerHTML='<h3>사진 설정</h3>';var sizeField=$('photoObjectSize').closest('.field'),backgroundField=$('realPhotoScene').closest('.field');sizeField.before(photoSettings);photoSettings.append(sizeField,backgroundField);var verdict=$('p-done').querySelector('.verdict');result.after(verdict);verdict.after($('kilnBox'));$('kilnBox').after(photoSettings);
 document.querySelector('.result-quick-actions').hidden=true;
 var resultToggle=document.createElement('label');resultToggle.id='ui-result-toggle';resultToggle.innerHTML='<span>완성 사진</span><input id="ui-result-360" type="checkbox" role="switch" aria-label="360도 감상"><span>360° 감상</span>';document.querySelector('.resultViewDock').insertBefore(resultToggle,$('resetPhoto'));
 $('ui-result-360').onchange=function(){(this.checked?$('openFinished360'):$('finishedPhoto')).click();};
 function updateMoves(){var badge=$('ui-moves'),count=touchLeft(),label=document.createElement('span'),line=document.createElement('span'),number=document.createElement('strong');label.className='ui-move-label';label.textContent='모양 잡기';line.className='ui-move-count';number.textContent=count;line.append(number,document.createTextNode('번'));badge.replaceChildren(label,line);badge.setAttribute('aria-label','모양 잡기 '+count+'번 남음');var points=$('ui-live-score'),value=points.textContent.replace(/점$/,''),pointNumber=document.createElement('strong'),unit=document.createElement('small');pointNumber.className='ui-point-number';pointNumber.textContent=value;unit.textContent='점';points.replaceChildren(pointNumber,unit);}
 var lastStage='';function sync(){updateMoves();var touch=uiUsesSheet()||innerHeight<560;document.body.classList.toggle('ui-touch-controls',touch);var decoHost=touch?decoTouch:$('rackDeco'),glazeHost=touch?glazeTouch:$('potteryToolRack');if($('dtools').parentNode!==decoHost)decoHost.appendChild($('dtools'));if($('rackGlaze').parentNode!==glazeHost)glazeHost.appendChild($('rackGlaze'));decoTouch.hidden=glazeTouch.hidden=!touch;
  var T=TARGETS[st.target];
  $('ui-goal-info').hidden=true;$('ui-goal-dims').hidden=true;
  $('modeChip').textContent=T?(T.master?'명장 도전 · ':'도전 · ')+T.name:'자유롭게 빚기';$('modeChip').title=$('modeChip').textContent;
  result.hidden=!T;
  $('ui-result-360').checked=document.body.classList.contains('ui-inspecting');
  if(lastStage!==st.stage){if(st.stage==='done'){if(uiUsesSheet())$('sheet').style.setProperty('--mobile-sheet-height',Math.min(innerHeight*.36,Math.max(250,innerHeight-310))+'px');$('sheetBody').scrollTop=0;}lastStage=st.stage;}
 }
 window.TodakPolish={sync:sync,updateMoves:updateMoves};sync();window.TodakResponsive.refresh();
})();

