/* Display saved pieces on the selected user-supplied cabinet. */
(function(){
 function type(){return window.TodakShop?TodakShop.wallet.shelf:'wood';}
 function slots(kind){
  if(kind==='wood')return [.17,.39,.61,.83].map(function(x){return {x:x,y:.87,h:.59,w:.19};});
  if(kind==='arched')return [{x:.23,y:.552,h:.19,w:.1},{x:.36,y:.633,h:.18,w:.1},{x:.47,y:.678,h:.18,w:.09},{x:.55,y:.53,h:.21,w:.09},{x:.66,y:.646,h:.18,w:.09},{x:.77,y:.548,h:.20,w:.10}];
  var levels=kind==='glass'?[.414,.551,.685]:[.43,.60,.77],out=[];
  levels.forEach(function(y,row){[.23,.41,.59,.77].forEach(function(x){out.push({x:x,y:y,h:row===0?.17:.115,w:.14});});});return out;
 }
 function cabinet(items,small){var kind=type(),layout=slots(kind),box=document.createElement('div');box.className='savedCabinet';box.dataset.shelf=kind;box.style.aspectRatio=kind==='wood'?'2048 / 682':'1671 / 941';var bg=document.createElement('img');bg.className='cabinetImage';bg.src=TodakDisplayAssets.shelf[kind]||TodakDisplayAssets.shelf.wood;bg.alt='';box.appendChild(bg);
  items.forEach(function(piece,i){var slot=layout[i%layout.length],node=piece;if(small){node=document.createElement('img');node.src=piece.thumb;node.alt='';node.className='miniPiece';}
   node.style.left=(slot.x*100)+'%';node.style.bottom=((1-slot.y)*100)+'%';node.style.width=(slot.w*100)+'%';node.style.height=(slot.h*100)+'%';box.appendChild(node);
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
