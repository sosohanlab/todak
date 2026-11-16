(function(){
 var dialog=$('cardDlg').querySelector('.drawerIn'),body=document.createElement('div'),preview=document.createElement('div'),settings=document.createElement('div');
 body.className='ui-card-content';preview.className='ui-card-preview';settings.className='ui-card-fields';
 preview.appendChild($('card'));['title','purpose'].forEach(function(id){settings.appendChild($(id).closest('.field'));});settings.appendChild(dialog.querySelector('.actions'));body.append(preview,settings);dialog.appendChild(body);
})();
