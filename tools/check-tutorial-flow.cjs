/* Reuse the real-action curriculum tests against the production HTML. */
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=path.resolve(__dirname,'..'),test=process.argv[2]||'tutorial-first-visit.cjs';
if(!['tutorial-first-visit.cjs','tutorial-returning.cjs','tutorial-skip-help.cjs','tutorial-pause-home.cjs'].includes(test))throw Error('Unsupported curriculum test');
const originalRead=fs.readFileSync,html=originalRead(path.join(root,'release-site/index.html'),'utf8');
fs.readFileSync=function(file,...args){if(typeof file==='string'&&path.resolve(file)===path.join(root,'index.html'))return args[0]==='utf8'?html:Buffer.from(html);return originalRead.call(this,file,...args);};
let source=originalRead(path.join(root,'tests',test),'utf8');
// Inspection now runs inline and finishes on actual rotation; narrow headers use the logo for Home.
source=source.replace("assert(doc.getElementById('finished360').open);click('#closeFinished360');","assert(doc.body.classList.contains('ui-inspecting'));w.dispatchEvent(new w.Event('todak-inspection-rotated'));");
source=source.replace("assert.equal(t.state().target,'menuBtn');click('#menuBtn');","assert(['menuBtn','homeBtn'].includes(t.state().target));click('#'+t.state().target);");
source=source.replace("assert(doc.getElementById('tutorialCoach').hidden,'instruction disappears on actual press');","assert(doc.getElementById('tutorialAction').hidden,'instruction disappears on actual press');assert(!doc.getElementById('tutorialCoach').hidden,'progress remains visible during a gesture');");
source=source.replace('w.eval(main);',"w.eval(fs.readFileSync(root+'photo-backgrounds.js','utf8'));w.eval(main);");
// The home entry is now optional; replay/resume uses its own button.
if(test==='tutorial-first-visit.cjs'){
 const retired=source.indexOf("state('trim');"),nextSmooth=source.indexOf("state('smooth');",retired);if(retired>=0&&nextSmooth>retired)source=source.slice(0,retired)+source.slice(nextSmooth);
 source=source.replace("assert(!doc.getElementById('tutorialNext'));","assert(doc.getElementById('tutorialContinue'));");
 source=source.replace("else await new Promise(r=>setTimeout(r,550));", "else {const before=t.state().id;await new Promise(r=>setTimeout(r,650));assert.equal(t.state().id,before,'no timed advance while practising');if(t.state().active)click('#tutorialContinue');}");
 source=source.replace("['solid','rotate','effect']","['solid','rotate','glazePaint']");
 const brushStart=source.indexOf("state('glazeBrush');click('#rackGlazeBrush');");
 const obsoleteReturn=source.indexOf("state('glazeBaseReturn');",brushStart);
 const dipStart=source.indexOf("state('dip');",obsoleteReturn),fireStart=source.indexOf("state('heat');",dipStart);
 if(brushStart<0||obsoleteReturn<0||dipStart<0||fireStart<0)throw Error('Missing glaze flow test blocks');
 source=source.slice(0,brushStart)+source.slice(dipStart,fireStart)+source.slice(brushStart,obsoleteReturn)+source.slice(fireStart);
 source=source.replace("assert(doc.getElementById('goChallenge').disabled);","assert(!doc.getElementById('goChallenge').disabled);");
 source=source.replace("assert(!doc.getElementById('tutorialHomeNote').hidden);assert(doc.querySelector('#tutorialHomeNote strong').textContent.includes('자유롭게 빚기'));assert(doc.getElementById('goFree').classList.contains('tutorialFirstStart'));click('#goFree');state('shape');","assert(doc.getElementById('tutorialHomeNote').hidden);assert(!doc.getElementById('goFree').classList.contains('tutorialFirstStart'));click('#goTutorial');state('shape');");
 source=source.replace('first visit locks other modes; real actions gate all 31 guide steps','optional home entry; real actions gate the full guided sequence');
}
if(test==='tutorial-pause-home.cjs')source=source.replaceAll("d.getElementById('goFree').click();","d.getElementById('goTutorial').click();");
if(test==='tutorial-skip-help.cjs'){
 source=source.replace("doc.getElementById('goFree').click();","doc.getElementById('goTutorial').click();");
 source=source.replace("assert(w.TodakTutorial.state().complete);","assert(w.TodakTutorial.state().active);assert(!doc.getElementById('home').hidden);doc.getElementById('goFree').click();");
 source=source.replace("assert.equal(w.localStorage.getItem('todak.tutorial.v1'),'complete');","assert.equal(w.localStorage.getItem('todak.tutorial.v1'),null);");
 source=source.replace('skip exits and persists unlock','exit returns home without falsely recording completion');
}
const filename=path.join(root,'tests',test),m=new Module(filename,module);m.filename=filename;m.paths=[path.join(root,'ui-layout-preview/node_modules'),...Module._nodeModulePaths(path.dirname(filename))];m._compile(source,filename);
