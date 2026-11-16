const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('tools/studio-base.html','utf8'),context={Math,JSON,N:56,st:{},clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),rimInsetAt:()=>0};vm.createContext(context);
const block=html.slice(html.indexOf('function sstep(a,b,t)'),html.indexOf('var ghostUntil=0;'));
const radius=html.slice(html.indexOf('function rAt(t){'),html.indexOf('\nfor(var m=0;m<18;',html.indexOf('function rAt(t){')));
const masters=html.slice(html.indexOf('TARGETS.triple='),html.indexOf('CH_ORDER.push(',html.indexOf('TARGETS.triple=')));
vm.runInContext(block+'\n'+radius+'\n'+masters,context);
const rows=[];for(const [id,T]of Object.entries(context.TARGETS)){
 const st=context.st;Object.assign(st,{target:id,height:T.h,floor:id==='goblet'?T.h*.6:id==='highstem'?T.h*.72:id==='lamp'?T.h*.8:.5,touches:2,radii:Array.from({length:56},(_,i)=>T.f(i/55))});st.inner=st.radii.map(r=>Math.max(.05,r-.6));const ideal=context.scoreBreakdown();
 st.inner=st.inner.map(()=>0);const closedInterior=context.scoreBreakdown();st.inner=st.inner.map(()=>.1);const pinholeInterior=context.scoreBreakdown();st.inner=st.radii.map(r=>Math.max(.05,r-.6));st.touches=20;const allMoves=context.scoreBreakdown();
 rows.push({id,name:T.name,ideal,closedInterior,pinholeInterior,allMoves});
}fs.mkdirSync('output/scoring-review',{recursive:true});fs.writeFileSync('output/scoring-review/before.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(rows.map(r=>({id:r.id,ideal:r.ideal.total,closedInterior:r.closedInterior.total,pinholeInterior:r.pinholeInterior.total,used20Moves:r.allMoves.total})),null,2));
