(function(){
 'use strict';
 var home=document.querySelector('#home .homeBottom');if(!home)return;
 var entry=document.createElement('button');entry.id='homeFeedback';entry.type='button';entry.className='ghost';entry.textContent='피드백 남기기';
 var invitation=document.createElement('aside');invitation.id='feedbackInvitation';invitation.hidden=true;invitation.setAttribute('role','status');invitation.setAttribute('aria-live','polite');invitation.innerHTML='<p>개선했으면 하는 점이나 불편했던 부분이 있다면 피드백을 남겨 주세요.</p><button type="button" id="feedbackInvitationClose" aria-label="피드백 안내 닫기">×</button>';
 var entryGroup=document.createElement('div');entryGroup.className='feedback-home-entry';entryGroup.append(invitation,entry);home.prepend(entryGroup);
 var inviteKey='todak.feedback-invitation.v1',inviteState={completed:0,dismissed:false},reviewScene=/^(0[1-9]|10|11|section)$/.test(new URLSearchParams(location.search).get('screen')||'');
 try{var savedInvite=JSON.parse(localStorage.getItem(inviteKey)||'null');if(savedInvite){inviteState.completed=Math.max(0,Math.min(2,Number(savedInvite.completed)||0));inviteState.dismissed=savedInvite.dismissed===true;}}catch(_){}
 function saveInvite(){try{localStorage.setItem(inviteKey,JSON.stringify(inviteState));}catch(_){}}
 function syncInvite(){if(typeof document==='undefined'||!document)return;try{var latest=JSON.parse(localStorage.getItem(inviteKey)||'null');if(latest){inviteState.dismissed=inviteState.dismissed||latest.dismissed===true;inviteState.completed=Math.max(inviteState.completed,Math.min(2,Number(latest.completed)||0));}}catch(_){}if(!reviewScene&&typeof store!=='undefined'&&store.items){var completed=Math.min(2,store.items.length);if(completed>inviteState.completed){inviteState.completed=completed;saveInvite();}}invitation.hidden=document.getElementById('home').hidden||inviteState.completed<2||inviteState.dismissed;}
 function dismissInvite(){inviteState.dismissed=true;saveInvite();syncInvite();}
 document.getElementById('feedbackInvitationClose').onclick=dismissInvite;
 if(typeof shelfAddCurrent==='function'){var savedAddCurrent=shelfAddCurrent;shelfAddCurrent=function(){var before=store.items.length,beforeCount=inviteState.completed,result=savedAddCurrent.apply(this,arguments);if(!reviewScene&&store.items.length>before){inviteState.completed=Math.min(2,Math.max(inviteState.completed,beforeCount+1));saveInvite();}syncInvite();return result;};}
 new MutationObserver(syncInvite).observe(document.getElementById('home'),{attributes:true,attributeFilter:['hidden']});
 window.addEventListener('storage',function(e){if(e.key===inviteKey)syncInvite();});
 if(typeof renderShelf==='function'){var savedRenderShelf=renderShelf;renderShelf=function(){var result=savedRenderShelf.apply(this,arguments);syncInvite();return result;};}
 syncInvite();
 var dialog=document.createElement('dialog');dialog.id='siteFeedback';dialog.setAttribute('aria-labelledby','feedbackTitle');
 dialog.innerHTML='<div class="feedback-head"><h2 id="feedbackTitle">피드백 남기기</h2><button type="button" id="feedbackClose" class="ghost" aria-label="피드백 창 닫기">닫기</button></div><p class="feedback-private">남겨주신 의견은 공개되지 않으며 운영자만 확인할 수 있어요.</p><form id="feedbackForm"><label for="feedbackCategory">어떤 의견인가요?</label><select id="feedbackCategory"><option value="idea">개선 제안</option><option value="bug">불편·오류 제보</option><option value="other">기타 의견</option></select><label for="feedbackMessage">내용</label><textarea id="feedbackMessage" required minlength="5" maxlength="2000" rows="6" placeholder="사용하면서 느낀 점이나 바라는 점을 적어 주세요."></textarea><div class="feedback-count"><span>5자 이상 적어 주세요</span><output id="feedbackCount" for="feedbackMessage">0 / 2,000</output></div><div class="feedback-trap" aria-hidden="true"><label>Website<input id="feedbackWebsite" type="text" tabindex="-1" autocomplete="off"></label></div><button type="submit" id="feedbackSend" class="primary">의견 보내기</button></form><p id="feedbackStatus" role="status" aria-live="polite"></p>';
 document.body.appendChild(dialog);
 var imageField=document.createElement('div');imageField.className='feedback-image-field';imageField.innerHTML='<label for="feedbackImage">이미지 첨부 (선택 · 1장)</label><input id="feedbackImage" type="file" accept="image/png,image/jpeg,image/webp"><small>PNG·JPG·WebP, 10MB 이하. 전송할 때 크기를 줄여요.</small><div id="feedbackImagePreview" hidden><img alt="첨부할 이미지 미리보기"><button type="button" id="feedbackImageRemove" class="ghost">이미지 삭제</button></div><p id="feedbackImageStatus" role="status"></p>';document.getElementById('feedbackSend').before(imageField);
 var imageInput=document.getElementById('feedbackImage'),imagePreview=document.getElementById('feedbackImagePreview'),imageStatus=document.getElementById('feedbackImageStatus'),attachment=null,imageBusy=false,imageEpoch=0;
 function clearImage(){imageEpoch++;imageBusy=false;if(send)send.disabled=busy;attachment=null;imageInput.value='';imagePreview.hidden=true;imagePreview.querySelector('img').removeAttribute('src');imageStatus.textContent='';}
 document.getElementById('feedbackImageRemove').onclick=function(){if(!busy)clearImage();};
 imageInput.addEventListener('change',async function(){
  var file=this.files[0],epoch=++imageEpoch;if(!file){clearImage();return;}attachment=null;imagePreview.hidden=true;imageStatus.textContent='';
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){this.value='';imageStatus.textContent='10MB 이하의 PNG·JPG·WebP 이미지를 골라 주세요.';return;}
  imageBusy=true;send.disabled=true;var url=URL.createObjectURL(file);
  try{var image=await new Promise(function(resolve,reject){var im=new Image();im.onload=function(){resolve(im);};im.onerror=reject;im.src=url;});if(epoch!==imageEpoch)return;if(image.width*image.height>40000000||!image.width||!image.height)throw Error();var scale=Math.min(1,1600/Math.max(image.width,image.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));var x=canvas.getContext('2d');x.fillStyle='white';x.fillRect(0,0,canvas.width,canvas.height);x.drawImage(image,0,0,canvas.width,canvas.height);var data=canvas.toDataURL('image/jpeg',.85);if(data.length>680000)data=canvas.toDataURL('image/jpeg',.6);if(data.length>680000)throw Error();attachment=data;imagePreview.querySelector('img').src=data;imagePreview.hidden=false;imageStatus.textContent='이미지를 첨부했어요.';}
  catch(_){if(epoch===imageEpoch){this.value='';imageStatus.textContent='이미지를 읽지 못했어요. 다른 이미지를 골라 주세요.';}}
  finally{URL.revokeObjectURL(url);if(epoch===imageEpoch){imageBusy=false;send.disabled=busy;}}
 });
 var form=document.getElementById('feedbackForm'),message=document.getElementById('feedbackMessage'),category=document.getElementById('feedbackCategory'),status=document.getElementById('feedbackStatus'),send=document.getElementById('feedbackSend'),close=document.getElementById('feedbackClose'),count=document.getElementById('feedbackCount'),busy=false,requestId=null,lastDraft='';
 function uuid(){if(crypto.randomUUID)return crypto.randomUUID();var a=crypto.getRandomValues(new Uint8Array(16));a[6]=(a[6]&15)|64;a[8]=(a[8]&63)|128;var s=Array.from(a,v=>v.toString(16).padStart(2,'0')).join('');return s.slice(0,8)+'-'+s.slice(8,12)+'-'+s.slice(12,16)+'-'+s.slice(16,20)+'-'+s.slice(20);}
 entry.onclick=function(){if(form.hidden){form.hidden=false;form.reset();clearImage();count.value='0 / 2,000';requestId=null;lastDraft='';}status.textContent='';status.className='';if(!dialog.open)dialog.showModal();message.focus();};
 close.onclick=function(){if(!busy)dialog.close();};dialog.addEventListener('cancel',function(e){if(busy)e.preventDefault();});dialog.addEventListener('click',function(e){var r=dialog.getBoundingClientRect();if(!busy&&e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();});
 message.addEventListener('input',function(){message.setCustomValidity('');count.value=message.value.length.toLocaleString('ko-KR')+' / 2,000';});
 form.addEventListener('submit',async function(e){
  e.preventDefault();if(busy||imageBusy)return;var text=message.value.trim();if(text.length<5){message.setCustomValidity('의견을 5자 이상 적어 주세요.');message.reportValidity();return;}
  var config=window.TODAK_FEEDBACK_CONFIG;if(!config?.endpoint||!config.publicKey){status.textContent='지금은 보낼 수 없어요. 잠시 후 다시 시도해 주세요.';return;}
  var draft=JSON.stringify([category.value,text,attachment]);if(!requestId||draft!==lastDraft){requestId=uuid();lastDraft=draft;}
  busy=true;send.disabled=close.disabled=imageInput.disabled=document.getElementById('feedbackImageRemove').disabled=true;send.textContent='보내는 중…';status.textContent='';status.className='';
  var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},15000);
  try{
   var response=await fetch(config.endpoint,{method:'POST',headers:{'Content-Type':'application/json',apikey:config.publicKey,Authorization:'Bearer '+config.publicKey},credentials:'omit',referrerPolicy:'origin',cache:'no-store',signal:controller.signal,body:JSON.stringify({requestId:requestId,category:category.value,message:text,attachment:attachment,website:document.getElementById('feedbackWebsite').value,page:location.pathname.slice(0,120),width:Math.min(10000,innerWidth),height:Math.min(10000,innerHeight)})});
   if(!response.ok){if(response.status===429)throw Error('rate_limit');throw Error('unavailable');}
   var result=await response.json();if(result.ok!==true)throw Error('unavailable');
   form.hidden=true;dismissInvite();status.className='feedback-success';status.textContent='의견을 보내주셔서 고마워요. 더 나은 토닥을 만드는 데 참고할게요.';
  }catch(error){status.textContent=error.message==='rate_limit'?'잠시 후 다시 보내 주세요. 작성한 내용은 그대로 남아 있어요.':'보내지 못했어요. 잠시 후 다시 시도해 주세요. 작성한 내용은 그대로 남아 있어요.';}
  finally{clearTimeout(timer);busy=false;send.disabled=close.disabled=imageInput.disabled=document.getElementById('feedbackImageRemove').disabled=false;send.textContent='의견 보내기';}
 });
})();
