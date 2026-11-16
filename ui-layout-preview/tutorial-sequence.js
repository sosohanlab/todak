/* Complete all base-glaze settings before selecting the brush once. */
(function(){
 steps=steps.filter(function(step){return step.id!=='trim';});
 var order=['glazeBase','color','finish','dip','effect','glazeBrush','glazeOpacity','glazePaint'];
 var glazing=steps.filter(function(step){return step.stage==='glaze';});
 var arranged=order.map(function(id){var step=glazing.find(function(item){return item.id===id;});if(!step)throw Error('Missing glaze tutorial step: '+id);return step;});
 var first=steps.findIndex(function(step){return step.stage==='glaze';});
 steps.splice.apply(steps,[first,glazing.length].concat(arranged));
 arranged[arranged.length-1].text='도자기 위에 원하는 선이나 무늬를 직접 칠해 보세요. 옆면과 위에서도 칠할 수 있어요. 붓질한 뒤 손을 떼면 굽기로 넘어갈 수 있어요. 불투명도가 0%라면 조금 올려 주세요.';
})();
