var challengeScoreCache={key:'',target:null,value:null};
function scoreBreakdown(){
 var T=TARGETS[st.target];if(!T)return null;
 var key=[st.target,st.height,st.floor,st.rimSoftness||0,st.touches||0,st.radii.join(','),st.inner.join(',')].join('|');
 if(challengeScoreCache.target!==T||challengeScoreCache.key!==key)challengeScoreCache={key:key,target:T,value:TodakChallengeScoring.evaluate(st,T)};
 return challengeScoreCache.value;
}
function roughPts(){var result=scoreBreakdown();return result?result.roughPenalty:0;}
function score(){var result=scoreBreakdown();return result?result.total:null;}
function renderChallengeScoreParts(parts){
 var host=$('scoreDetail');host.replaceChildren();
 [['outline','옆선',40],['height','높이',20],['depth','속 완성도',15],['surface','매끈함',15],['moves','횟수 점수',10]].forEach(function(part){var box=document.createElement('span'),name=document.createElement('small'),value=document.createElement('strong');box.className='ui-score-part';box.dataset.score=part[0];name.textContent=part[1];value.textContent=parts[part[0]]+'/'+part[2];if(part[0]==='moves')box.title=parts.limit+'번 중 '+parts.remaining+'번 남음';box.append(name,value);host.appendChild(box);});
 if(parts.solid){var note=document.createElement('span');note.className='ui-score-note';note.textContent='속이 막혔거나 너무 좁으면 최대 59점';host.appendChild(note);}
}
function challengeScoreVerdict(parts){return parts.solid?'속이 막혔거나 너무 좁아 최대 59점이에요.':parts.total>=90?'본과 거의 똑같아요.':parts.total>=75?'꽤 닮았어요.':parts.total>=50?'느낌은 살렸어요.':'자기만의 길을 갔네요.';}
function renderChallengeScoreSummary(parts,T,best){
 $('scoreHead').title=$('scoreHead').textContent;
 var lines=[challengeScoreVerdict(parts),'모양 잡기 '+parts.used+'/'+parts.limit+'번 · 내 최고 '+best+'점'];
 if(T.master&&!parts.solid)lines.push(parts.total>=85?'명장 도전 통과!':'85점 이상이면 통과예요.');
 $('scoreSub').textContent=lines.join('\n');
}
