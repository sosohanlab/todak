/* Compact palettes and predictable firing; saved legacy pieces keep their existing material. */
(function(){
 var primary=['baekja','ivory','cheongja','cobalt','mustard','coral','brown','heugyu'];
 primary.forEach(function(id){var b=document.querySelector('#swatches [data-g="'+id+'"],#swatches2 [data-g="'+id+'"]');if(b)$('swatches').appendChild(b);});
 primary.forEach(function(id){var b=document.querySelector('#glazeBrushPalette [data-brush-glaze="'+id+'"]');if(b)$('glazeBrushSwatches').appendChild(b);});
 document.querySelectorAll('#swatches [data-g],#swatches2 [data-g],#dots [data-g],#glazeBrushPalette [data-brush-glaze]').forEach(function(b){if(primary.indexOf(b.dataset.g||b.dataset.brushGlaze)<0)b.remove();});
 var handle=$('dipHandle');if(handle)handle.remove();var privacy=$('dipDepth').parentElement.querySelector('p');if(privacy)privacy.textContent='슬라이더나 작품을 위아래로 끌어 색이 입혀지는 깊이를 조절해요.';
 $('fire').closest('.field').classList.add('ui-retired-fire');
 var beginFire=fireBegin;fireBegin=function(){st.fire='mid';beginFire();$('fireCaption').textContent='작품을 고르게 굽고 있어요.';};
 rollKiln=function(){st.kiln={type:'plain',seed:0,gold:false,fire:'mid',kt:'electric',thin:false,cause:'',openT:40,preserveChosenColor:true};};
 var previousGlaze=glaze;glaze=function(){return st.kiln&&st.kiln.preserveChosenColor?glazeBase():previousGlaze();};
 var previousText=kilnText;kilnText=function(){return st.kiln&&st.kiln.preserveChosenColor?{t:'곱게 잘 구워졌어요',l:'고른 색과 직접 꾸민 무늬 그대로 완성됐어요.'}:previousText();};
 window.TodakWorkshopSimplification={palette:primary.slice(),firingMs:6100,revealMs:1900};
})();
