(function(){
 'use strict';
 var native=$('realPhotoScene'),button=document.createElement('button');button.id='ui-background-picker';button.type='button';button.className='ui-appearance-open';button.setAttribute('aria-haspopup','dialog');native.hidden=true;native.after(button);
 var shelfButton=document.createElement('button');shelfButton.id='ui-shelf-picker';shelfButton.type='button';shelfButton.className='ghost';shelfButton.textContent='진열장 선택';$('drawer').querySelector('.shelfHead').after(shelfButton);
 var dialog=document.createElement('dialog');dialog.id='ui-appearance-dialog';dialog.setAttribute('aria-labelledby','ui-appearance-title');dialog.innerHTML='<div class="ui-appearance-head"><h2 id="ui-appearance-title"></h2><button type="button" class="ghost" id="ui-appearance-close">닫기</button></div><p id="ui-appearance-balance"></p><div id="ui-appearance-options" role="group"></div><p id="ui-appearance-status" role="status"></p><button type="button" class="primary" id="ui-appearance-apply"></button>';document.body.append(dialog);
 var type='background',choice='',opener=null;
 function picture(kind,id){return kind==='background'?TodakBackgrounds.url(id==='gallery'?'dark':id):TodakDisplayAssets.shelf[id];}
 function owned(item){return TodakShop.wallet.owned.includes(type+':'+item.id);}
 function sync(){var item=TodakShop.catalog.background.find(function(x){return x.id===TodakShop.wallet.background;})||TodakShop.catalog.background[0];button.replaceChildren();var image=document.createElement('img');image.alt='';image.src=picture('background',item.id);var text=document.createElement('span');text.textContent=item.name;button.append(image,text,document.createTextNode('⌄'));button.setAttribute('aria-label','완성 사진 배경 선택 · '+item.name);}
 function render(){
  $('ui-appearance-title').textContent=type==='background'?'완성 사진 배경 선택':'내 진열장 선택';$('ui-appearance-balance').textContent='보유 포인트 '+TodakShop.wallet.points+'P';var grid=$('ui-appearance-options');grid.replaceChildren();
  TodakShop.catalog[type].forEach(function(item){var b=document.createElement('button');b.type='button';b.className='ui-appearance-option';b.dataset.choice=item.id;b.setAttribute('aria-pressed',String(choice===item.id));var im=document.createElement('img');im.src=picture(type,item.id);im.alt='';var name=document.createElement('strong');name.textContent=item.name;var state=document.createElement('span');state.textContent=owned(item)?'보유 중':item.price===0?'무료':item.price+'P';b.append(im,name,state);b.onclick=function(){choice=item.id;$('ui-appearance-status').textContent='';render();};grid.append(b);});
  var item=TodakShop.catalog[type].find(function(x){return x.id===choice;}),apply=$('ui-appearance-apply');apply.textContent=owned(item)?'선택한 '+(type==='background'?'배경':'진열장')+' 사용하기':item.price===0?'무료로 받고 사용하기':item.price+'P로 구매하고 사용하기';apply.disabled=!owned(item)&&TodakShop.wallet.points<item.price;
  if(apply.disabled)$('ui-appearance-status').textContent=(item.price-TodakShop.wallet.points)+'P가 더 필요해요.';
 }
 function open(kind,source){type=kind;choice=TodakShop.wallet[type];opener=source;$('ui-appearance-status').textContent='';render();dialog.showModal();}
 function close(){dialog.close();if(opener)opener.focus();}
 button.onclick=function(){open('background',button);};shelfButton.onclick=function(){open('shelf',shelfButton);};$('ui-appearance-close').onclick=close;
 $('ui-appearance-apply').onclick=function(){var result=TodakShop.purchase(type,choice);if(!result.ok){$('ui-appearance-status').textContent=result.reason;return;}if(type==='background'){native.value=choice;native.dispatchEvent(new Event('change',{bubbles:true}));}sync();close();};
 dialog.addEventListener('click',function(e){var r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))close();});dialog.addEventListener('close',sync);
 var previous=setStage;setStage=function(){var result=previous.apply(this,arguments);sync();return result;};sync();
})();
