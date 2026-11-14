/* Display saved pieces on the selected user-supplied cabinet. */
(function(){
 var trimmedThumbs=new Map();function trimMobileThumb(image){if(window.innerWidth>=760)return;var source=image.src;if(trimmedThumbs.has(source)){image.src=trimmedThumbs.get(source);return;}var original=new Image();original.onload=function(){try{var canvas=document.createElement('canvas');canvas.width=original.naturalWidth;canvas.height=original.naturalHeight;var c=canvas.getContext('2d');c.drawImage(original,0,0);var data=c.getImageData(0,0,canvas.width,canvas.height).data,x0=canvas.width,y0=canvas.height,x1=-1,y1=-1;for(var y=0;y<canvas.height;y++)for(var x=0;x<canvas.width;x++)if(data[(y*canvas.width+x)*4+3]>18){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}if(x1<x0)return;var pad=Math.max(2,Math.round(Math.max(x1-x0,y1-y0)*.025)),crop=document.createElement('canvas');crop.width=x1-x0+1+pad*2;crop.height=y1-y0+1+pad*2;crop.getContext('2d').drawImage(original,x0,y0,x1-x0+1,y1-y0+1,pad,pad,x1-x0+1,y1-y0+1);var url=crop.toDataURL('image/png');trimmedThumbs.set(source,url);image.src=url;}catch(_){}};original.src=source;}
 function type(){return window.TodakShop?TodakShop.wallet.shelf:'wood';}
 function slots(kind){
  if(kind==='wood')return [.17,.39,.61,.83].map(function(x){return {x:x,y:.87,h:.59,w:.19};});
  if(kind==='arched')return [{x:.23,y:.552,h:.19,w:.1},{x:.36,y:.633,h:.18,w:.1},{x:.47,y:.678,h:.18,w:.09},{x:.55,y:.53,h:.21,w:.09},{x:.66,y:.646,h:.18,w:.09},{x:.77,y:.548,h:.20,w:.10}];
  var levels=kind==='glass'?[.414,.551,.685]:[.43,.60,.77],out=[];
  levels.forEach(function(y,row){[.23,.41,.59,.77].forEach(function(x){out.push({x:x,y:y,h:row===0?.17:.115,w:.14});});});return out;
 }
 function cabinet(items,small){var kind=type(),layout=slots(kind),box=document.createElement('div');box.className='savedCabinet';box.dataset.shelf=kind;box.style.aspectRatio=kind==='wood'?'2048 / 682':'1671 / 941';var bg=document.createElement('img');bg.className='cabinetImage';bg.src=TodakDisplayAssets.shelf[kind]||TodakDisplayAssets.shelf.wood;bg.alt='';box.appendChild(bg);
  items.forEach(function(piece,i){var slot=layout[i%layout.length],node=piece;if(small){node=document.createElement('img');node.src=piece.thumb;node.alt='';node.className='miniPiece';}
   node.style.left=(slot.x*100)+'%';node.style.bottom=((1-slot.y)*100)+'%';node.style.width=(slot.w*100)+'%';node.style.height=(slot.h*100)+'%';if(!small&&node.querySelector('img'))trimMobileThumb(node.querySelector('img'));box.appendChild(node);
  });return box;
 }
 function paint(){var grid=$('shelfGrid'),pieces=Array.from(grid.querySelectorAll('.piece')),layout=slots(type());grid.textContent='';grid.dataset.shelf=type();for(var i=0;i<Math.max(1,pieces.length);i+=layout.length)grid.appendChild(cabinet(pieces.slice(i,i+layout.length),false));refreshMini();}
 function refreshMini(){dirty=true;}
 var base=renderShelf;renderShelf=function(){var result=base.apply(this,arguments);paint();return result;};
 $('shelfGrid').addEventListener('click',function(e){if(e.target.closest('.piece'))setTimeout(function(){if(!$('shelfDetail').hidden&&typeof $('shelfDetail').scrollIntoView==='function')$('shelfDetail').scrollIntoView({block:'nearest',behavior:'smooth'});},0);});
 var shopButton=document.createElement('button');shopButton.id='shelfShop';shopButton.type='button';shopButton.className='ghost';shopButton.textContent='포인트 상점 · 진열장 꾸미기';shopButton.onclick=function(){TodakShop.open('shelf');};$('drawer').querySelector('.shelfHead').after(shopButton);
 var toolbar=document.createElement('div');toolbar.className='shelfToolbar';$('drawer').querySelector('.shelfHead').after(toolbar);toolbar.append(shopButton);if($('shelfCommunity'))toolbar.append($('shelfCommunity'));
 var swipeHint=document.createElement('p');swipeHint.className='shelfSwipeHint';swipeHint.textContent='선반을 좌우로 밀어 작품을 크게 둘러보세요.';$('shelfGrid').before(swipeHint);$('shelfGrid').setAttribute('aria-label','완성한 작품 진열장 · 좌우로 스크롤');
 window.TodakShelfDisplay={refresh:function(){paint();},slots:slots};renderShelf();
})();
