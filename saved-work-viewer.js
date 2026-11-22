/* Read saved geometry without replacing the work currently on the wheel. */
(function(){
 var workTextures=new WeakMap();
 function sample(values,t){var p=Math.max(0,Math.min(1,t))*(values.length-1),i=Math.min(values.length-2,Math.floor(p));return values[i]+(values[i+1]-values[i])*(p-i);}
 function image(url){return new Promise(function(resolve){if(!url){resolve(null);return;}var im=new Image();im.onload=function(){resolve(im);};im.onerror=function(){resolve(null);};im.src=url;});}
 function textures(item,urls){
  var entry=workTextures.get(item);
  if(entry&&urls.every(function(url,i){return url===entry.urls[i];}))return entry.images;
  var images=Promise.all(urls.map(image));
  workTextures.set(item,{urls:urls,images:images});
  return images;
 }
 window.TodakSavedWorkData=async function(item){
  var full=item.full2||{},shape=item.shape||{},r=full.radii||shape.r,h=full.height||shape.h||shape.height;
  if(!Array.isArray(r)||r.length<2||r.some(function(v){return !Number.isFinite(v)||v<0;})||!Number.isFinite(h)||h<=0)throw Error('missing_geometry');
  r=r.slice();var inner=Array.isArray(full.inner)&&full.inner.length===r.length?full.inner.slice():r.map(function(v){return Math.max(0,v-.5);}),floor=Number.isFinite(full.floor)?full.floor:.8,v=item.communityVisual||{},color=item.c||[230,225,214];
  var images=await textures(item,[v.overlay,v.carve,item.topPaint||v.topPaint,item.bottomPaint||v.bottomPaint,item.bottomCarve||v.bottomCarve,item.topCarve||v.topCarve]);
  var softness=full.rimSoftness||0,outerRim=r[r.length-1];
  var innerRim=h-floor>.05?Math.min(inner[inner.length-1],outerRim-.12):0;
  var bevel=Math.max(0,Math.min(.34*softness,(outerRim-innerRim)*.45,h*.035));
  function innerAt(t){
   var depth=h*(1-Math.max(0,Math.min(1,t)));
   var rim=depth<bevel?bevel-Math.sqrt(Math.max(0,bevel*bevel-(bevel-depth)*(bevel-depth))):0;
   return Math.max(0,Math.min(sample(inner,t)+rim,sample(r,t)-.02));
  }
  return {key:'saved-360-'+item.id+'-'+(item.revision||0),height:h,floor:floor,rAt:function(t){return sample(r,t);},innerAt:innerAt,bottomTrim:full.bottomTrim||item.bottomTrim||v.bottomTrim||null,profileRounded:true,rimSoftness:softness,color:color,inside:color,glazeId:v.glazeId||item.glaze||'custom',surface:v.surface||item.fx||'none',finish:v.finish||item.finish||'gloss',dipFrom:v.dipFrom||'top',dipAngle:v.dipAngle||0,dipDepth:v.dipDepth||0,dipColor:v.dipColor||color,overlay:images[0],carve:images[1],carveMode:v.carveMode,carveDepth:v.carveDepth,topOverlay:images[2],topOpacity:v.topOpacity??.64,bottomOverlay:images[3],bottomOpacity:v.bottomOpacity??.64,bottomCarve:images[4],topCarve:images[5],topRadius:Math.max.apply(null,r),rotation:v.rotation||0};
 };
})();
