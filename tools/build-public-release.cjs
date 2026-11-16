const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'release-site');
const runtime=[];
// Only ship files already present on the public branch, plus the explicit additions below.
const tracked=execFileSync('git',['ls-tree','-r','--name-only','origin/main'],{cwd:root,encoding:'utf8'}).trim().split('\n');
for(const name of tracked){
 if(/^(assets|vendor|quality-samples|migration)\//.test(name)||(!name.includes('/')&&/\.(html|css|js|png|webmanifest)$/.test(name))||name==='CNAME')runtime.push(name);
}
runtime.push('channel-attribution.js');
for(const name of runtime){const dest=path.join(out,name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,name),dest);}
execFileSync(process.execPath,[path.join(root,'tools/build-studio-layout.cjs'),'--production'],{cwd:root,stdio:'inherit'});
for(const name of ['studio-layout.css','responsive-layout.css','experience-polish.css','site-feedback.css'])fs.copyFileSync(path.join(root,'ui-layout-preview',name),path.join(out,name));
for(const [slug,source] of [['threads','threads'],['insta','instagram']]){
 const target='/?utm_source='+source+'&utm_medium=social&utm_campaign=profile';
 const html='<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>토닥으로 이동</title><link rel="canonical" href="https://todak.sosohanlab.com/"><meta http-equiv="refresh" content="0;url='+target.replaceAll('&','&amp;')+'"><script>location.replace('+JSON.stringify(target)+');</script></head><body><p><a href="'+target.replaceAll('&','&amp;')+'">토닥 시작하기</a></p></body></html>\n';
 fs.mkdirSync(path.join(out,slug),{recursive:true});fs.writeFileSync(path.join(out,slug,'index.html'),html);
}
let html=fs.readFileSync(path.join(out,'index.html'),'utf8');
html=html.replace(/((?:src|href|content)=["'])([^"']+)(["'])/g,(whole,lead,url,tail)=>{
 if(/^(?:[a-z]+:|#|\/\/)/i.test(url))return whole;
 const local=url.split('?')[0],file=path.resolve(out,local);
 if(!file.startsWith(out+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()||! /\.(js|css|png|jpg|webp|webmanifest)$/.test(file))return whole;
 return lead+local+'?v='+crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,12)+tail;
});
if(html.includes('Local review scenes only')||html.includes('readyScene='))throw Error('Review scene leaked into release');
fs.writeFileSync(path.join(out,'index.html'),html);
fs.writeFileSync(path.join(out,'.nojekyll'),'');
console.log('Production assets assembled with hashed stylesheet/script URLs.');
