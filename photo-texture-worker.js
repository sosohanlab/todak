'use strict';self.window=self;self.document={createElement:function(){return canvas(1,1);}};importScripts('ceramic-surface.js?v=2002fd9c1ce6');function canvas(w,h){var c=new OffscreenCanvas(w,h);c.getContext('2d',{willReadFrequently:true});return c;}function noise(x,y){var n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);}var low=false;function maps(d){var size=low?512:1024,c=canvas(size,size),g=c.getContext('2d'),base=d.color;
  g.fillStyle='rgb('+base.join(',')+')';g.fillRect(0,0,size,size);
  var pix=g.getImageData(0,0,size,size);
  var angles=new Float64Array(size),sin2=new Float64Array(size),sin3=new Float64Array(size);for(var xx=0;xx<size;xx++){var a=xx/size*Math.PI*2;angles[xx]=a*3;sin2[xx]=Math.sin(a*2);sin3[xx]=Math.sin(a*3);}var depth=d.glazeId==='cobalt'?12:(d.glazeId==='cheongja'||d.glazeId==='mint'?5:1.8);
  for(var y=0;y<size;y++){var row23=Math.sin(y*.023)*2,fade=Math.max(0,Math.min(1,y/10,(size-1-y)/10));for(var x=0;x<size;x++){var i=(y*size+x)*4,n=noise(x,y),cloud=Math.sin(angles[x]+row23)*Math.sin(y*.017+sin2[x]*1.3),v=(n-.5)*3+Math.sin(y*.031+sin3[x])*.8+cloud*depth;v*=fade;if(n>.998)v-=15*fade;for(var k=0;k<3;k++)pix.data[i+k]=Math.max(0,Math.min(255,base[k]+v));}}
  g.putImageData(pix,0,0);
  var surface=d.surface==='crackle'&&window.TodakCeramicSurface?TodakCeramicSurface.create(low?512:1024,d.surface):null;
  if(surface){g.save();g.globalCompositeOperation='multiply';g.drawImage(surface.color,0,0,size,size);g.restore();}
  if(d.overlay)g.drawImage(d.overlay,0,0,size,size);
  // The underside receives the selected base glaze and the same finish as the outside.
  var bump=canvas(512,512),bg=bump.getContext('2d'),im=bg.createImageData(512,512);
  for(var j=0;j<512*512;j++){var xx=j%512,yy=j/512|0,edge=Math.max(0,Math.min(1,yy/12,(511-yy)/12)),vv=128+((noise(xx,yy)-.5)*12+Math.sin(yy*.65)*1.5)*edge;im.data[j*4]=im.data[j*4+1]=im.data[j*4+2]=vv;im.data[j*4+3]=255;}bg.putImageData(im,0,0);
  // Micro texture stays separate from the true carved geometry.
  if(surface){bg.globalAlpha=1;bg.drawImage(surface.height,0,0,512,512);}
  return {color:c,bump:bump,surface:surface};
}function pixels(c){var p=c.getContext('2d').getImageData(0,0,c.width,c.height);return{width:p.width,height:p.height,data:p.data.buffer};}self.onmessage=function(event){var d=event.data;try{low=d.low;if(d.overlayPixels){var p=d.overlayPixels;d.overlay=canvas(p.width,p.height);d.overlay.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(p.data),p.width,p.height),0,0);}var m=maps(d),out={id:d.id,color:pixels(m.color),bump:pixels(m.bump),surface:m.surface?{color:pixels(m.surface.color),height:pixels(m.surface.height),roughness:pixels(m.surface.roughness)}:null},transfer=[out.color.data,out.bump.data];if(out.surface)transfer.push(out.surface.color.data,out.surface.height.data,out.surface.roughness.data);self.postMessage(out,transfer);}catch(e){self.postMessage({id:d.id,error:String(e)});}};