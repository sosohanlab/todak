/* Lossless edit snapshots: reuse unchanged tiles and compress uniform/running pixels. */
(function(){
 'use strict';
 var SIZE=128;
 function equal(a,b){if(!a||a.kind!==b.kind)return false;if(a.kind==='solid')return a.value===b.value;if(a.data.length!==b.data.length)return false;for(var i=0;i<a.data.length;i++)if(a.data[i]!==b.data[i])return false;return true;}
 function pack(raw){
  var first=raw[0],uniform=true,i;for(i=1;i<raw.length;i++)if(raw[i]!==first){uniform=false;break;}
  if(uniform)return {kind:'solid',value:first};
  var runs=[],value=first,count=1;
  for(i=1;i<raw.length;i++){if(raw[i]===value)count++;else{runs.push(value,count);if(runs.length>=raw.length)return {kind:'raw',data:raw};value=raw[i];count=1;}}
  runs.push(value,count);return runs.length<raw.length?{kind:'runs',data:new Uint32Array(runs)}:{kind:'raw',data:raw};
 }
 function create(){
  var cache=new WeakMap();
  function read(layer,version){
   if(!layer)return null;var width=layer.c.width,height=layer.c.height,previous=cache.get(layer);
   if(previous&&previous.version===version&&previous.frame.width===width&&previous.frame.height===height)return previous.frame;
   var image=layer.x.getImageData(0,0,width,height),pixels=new Uint32Array(image.data.buffer,image.data.byteOffset,image.data.byteLength/4),tiles=[],index=0;
   for(var y=0;y<height;y+=SIZE)for(var x=0;x<width;x+=SIZE){
    var w=Math.min(SIZE,width-x),h=Math.min(SIZE,height-y),raw=new Uint32Array(w*h);
    for(var row=0;row<h;row++)raw.set(pixels.subarray((y+row)*width+x,(y+row)*width+x+w),row*w);
    var tile=pack(raw),old=previous&&previous.frame.width===width&&previous.frame.height===height?previous.frame.tiles[index]:null;
    tiles.push(equal(old,tile)?old:tile);index++;
   }
   var frame={width:width,height:height,tiles:tiles};cache.set(layer,{version:version,frame:frame});return frame;
  }
  function write(layer,frame){
   if(!layer||!frame)return;var image=layer.x.createImageData(frame.width,frame.height),pixels=new Uint32Array(image.data.buffer,image.data.byteOffset,image.data.byteLength/4),index=0;
   for(var y=0;y<frame.height;y+=SIZE)for(var x=0;x<frame.width;x+=SIZE){
    var w=Math.min(SIZE,frame.width-x),h=Math.min(SIZE,frame.height-y),tile=frame.tiles[index++],raw=null;
    if(tile.kind==='runs'){raw=new Uint32Array(w*h);var at=0;for(var i=0;i<tile.data.length;i+=2){raw.fill(tile.data[i],at,at+tile.data[i+1]);at+=tile.data[i+1];}}
    else if(tile.kind==='raw')raw=tile.data;
    for(var row=0;row<h;row++){var start=(y+row)*frame.width+x;if(raw)pixels.set(raw.subarray(row*w,row*w+w),start);else pixels.fill(tile.value,start,start+w);}
   }
   layer.x.putImageData(image,0,0);
  }
  return {read:read,write:write};
 }
 function bytes(frames){var seen=new Set(),total=0;frames.forEach(function(frame){if(!frame)return;frame.tiles.forEach(function(tile){if(seen.has(tile))return;seen.add(tile);total+=tile.kind==='solid'?4:tile.data.byteLength;});});return total;}
 window.TodakHistoryTiles={create:create,bytes:bytes};
})();
