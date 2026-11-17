const test=require('node:test'),assert=require('node:assert/strict'),S=require('../ui-layout-preview/challenge-scoring.js');
function fixture(kind){
 const n=56,h=kind==='plate'?1.4:kind==='stem'?14:12,floor=kind==='solid'?h:kind==='plate'?.08:kind==='stem'?10.5:.6;
 const radii=Array.from({length:n},(_,i)=>kind==='stem'?(i<36?1.1+.75*Math.sin(i/4)**2:1.1+3*(i-36)/19):kind==='plate'?2+1.2*i/55:4+.35*Math.sin(i/10));
 const inner=radii.map(v=>kind==='solid'?0:Math.max(0,v-(kind==='plate'?.1:kind==='stem'?.12:.65)));
 const f=t=>{const x=t*55,i=Math.min(54,Math.floor(x));return radii[i]+(radii[i+1]-radii[i])*(x-i);};
 return {s:{target:'personal:test',height:h,floor,radii,inner,rimSoftness:.2,touches:2},T:{h,n:20,f,personal:true,depthNeed:kind==='solid'?0:(h-floor)/h,scoreProfile:{inner:inner.slice(),floor,rimSoftness:.2}}};
}
test('personal hollow cups, thin plates, beaded stems and solid forms can all match their own reference',()=>{
 for(const kind of ['cup','plate','stem','solid']){const {s,T}=fixture(kind),r=S.evaluate(s,T);assert.equal(r.total,100,kind);assert.equal(r.quality,90,kind);assert.equal(r.solid,false,kind);s.touches=20;assert.equal(S.evaluate(s,T).total,90,kind);}
});
test('a hollow personal reference cannot be replaced with a solid copy for full points',()=>{
 for(const kind of ['cup','plate','stem']){const {s,T}=fixture(kind);s.floor=s.height;s.inner.fill(0);const r=S.evaluate(s,T);assert.equal(r.solid,true,kind);assert(r.total<=59,kind);}
});
test('personal inside, outline, height and finish each respond to the relevant mismatch',()=>{
 const {s,T}=fixture('cup');
 for(const [component,edit]of [['depth',v=>v.inner=v.inner.map(x=>x*.5)],['outline',v=>v.radii=v.radii.map(x=>x*1.2)],['height',v=>v.height*=1.15],['surface',v=>v.radii=v.radii.map((x,i)=>x+(i%2?.15:-.15))]]){const changed=structuredClone(s);edit(changed);assert(S.evaluate(changed,T)[component]<S.evaluate(s,T)[component],component);}
});
