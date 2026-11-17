/* Read saved geometry without replacing the work currently on the wheel. */
(function(){
 function sample(values,t){var p=Math.max(0,Math.min(1,t))*(values.length-1),i=Math.min(values.length-2,Math.floor(p));return values[i]+(values[i+1]-values[i])*(p-i);}
 function image(url){return new Promise(function(resolve){if(!url){resolve(null);return;}var im=new Image();im.onload=function(){resolve(im);};im.onerror=function(){resolve(null);};im.src=url;});}
 window.TodakSavedWorkData=async function(item){
  var full=item.full2||{},shape=item.shape||{},r=full.radii||shape.r,h=shape.h||shape.height;
  if(!Array.isArray(r)||r.length<2||r.some(function(v){return !Number.isFinite(v)||v<0;})||!Number.isFinite(h)||h<=0)throw Error('missing_geometry');
  r=r.slice();var inner=Array.isArray(full.inner)&&full.inner.length===r.length?full.inner.slice():r.map(function(v){return Math.max(0,v-.5);}),floor=Number.isFinite(full.floor)?full.floor:.8,v=item.communityVisual||{},color=item.c||[230,225,214];
  var images=await Promise.all([v.overlay,v.carve,item.topPaint||v.topPaint,item.bottomPaint||v.bottomPaint,item.bottomCarve||v.bottomCarve,item.topCarve||v.topCarve].map(image));
  return {key:'saved-360-'+item.id+'-'+(item.revision||0),height:h,floor:floor,rAt:function(t){return sample(r,t);},innerAt:function(t){return Math.max(0,Math.min(sample(inner,t),sample(r,t)-.12));},bottomTrim:full.bottomTrim||item.bottomTrim||v.bottomTrim||null,profileRounded:true,rimSoftness:full.rimSoftness||0,color:color,inside:color,glazeId:v.glazeId||'custom',surface:v.surface||'none',finish:v.finish||'gloss',dipFrom:v.dipFrom||'top',dipAngle:v.dipAngle||0,dipDepth:v.dipDepth||0,dipColor:v.dipColor||color,overlay:images[0],carve:images[1],carveMode:v.carveMode,carveDepth:v.carveDepth,topOverlay:images[2],bottomOverlay:images[3],bottomCarve:images[4],topCarve:images[5],topRadius:Math.max.apply(null,r),rotation:v.rotation||0};
 };
})();
