const fs=require('node:fs'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
// Release each browser between widths so a long review cannot exhaust GPU memory.
const widths=[280,320,344,360,390,430,540,667,690,717,768,820,844,884,912,1024,1114,1180,1280,1366,1440,1536,1920],report=[],failures=[],errors=[];
fs.mkdirSync('output/full-review',{recursive:true});
for(const width of widths){const r=spawnSync(process.execPath,['tools/run-release-qa.cjs','check-responsive-final.cjs','--width='+width],{encoding:'utf8',windowsHide:true,timeout:180000});process.stdout.write(r.stdout||'');if(r.status!==0){process.stderr.write(r.stderr||String(r.error));process.exit(1);}const part=JSON.parse(fs.readFileSync('ui-layout-preview/responsive-final-checks.json','utf8'));report.push(...part.report);failures.push(...part.failures);errors.push(...part.errors);}
fs.writeFileSync('output/full-review/responsive-matrix.json',JSON.stringify({report,failures,errors},null,2));assert.equal(report.length,312);assert.deepEqual(failures,[]);assert.deepEqual(errors,[]);console.log('PASS all 312 responsive states across 26 viewport sizes');
