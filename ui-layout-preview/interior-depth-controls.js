/* Interior depth remains available after retiring the trimming tool. */
(function(){
 var depth=document.createElement('div');depth.id='cavityDepthControls';depth.className='trim-controls';depth.hidden=true;depth.innerHTML='<label for="cavityDepth"><b>속 깊이</b> <output id="cavityDepthValue"></output></label><input id="cavityDepth" type="range" min="0" max="12" step="0.1"><p>깊이를 줄이면 아래부터 흙이 채워져요. 굽다리 잔은 윗잔만 비우고 기둥과 받침은 채워 두세요. 바깥 모양은 바뀌지 않아요.</p>';$('toolTip').after(depth);
 var depthGesture=false;
 $('cavityDepth').addEventListener('pointerdown',function(){pushHist();depthGesture=true;});
 $('cavityDepth').addEventListener('keydown',function(e){if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(e.key)&&!e.repeat){pushHist();depthGesture=true;}});
 $('cavityDepth').addEventListener('input',function(){if(!depthGesture){pushHist();depthGesture=true;}var wanted=clamp(Number(this.value),0,Math.max(0,st.height-.1));st.floor=st.height-wanted;markPreset(null);ptr.w0=null;dirty=true;updateReadout();syncDepth();});
 ['change','pointerup','pointercancel','keyup'].forEach(function(type){$('cavityDepth').addEventListener(type,function(){depthGesture=false;});});
 function syncDepth(){depth.hidden=tool!=='thick';$('cavityDepth').max=Math.max(0,st.height-.1).toFixed(1);$('cavityDepth').value=Math.max(0,st.height-st.floor).toFixed(1);$('cavityDepthValue').textContent=Math.max(0,st.height-st.floor).toFixed(1)+'cm · 아래 '+st.floor.toFixed(1)+'cm는 채운 흙';}
 var readout=updateReadout;updateReadout=function(){readout();syncDepth();};var tips=showTips;showTips=function(){tips();syncDepth();};var fresh=freshClay;freshClay=function(){fresh();syncDepth();};var stage=setStage;setStage=function(s){stage(s);syncDepth();};syncDepth();
})();
