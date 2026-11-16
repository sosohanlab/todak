/* Keep photographs in the versioned runtime so separate requests cannot break the tool rack. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function buildToolImages(out){
 const source=fs.readFileSync(path.join(root,'ui-layout-preview/tool-images.js'),'utf8');
 let count=0;
 const runtime=source.replace(/"url":\s*"(assets\/tool-[^"/]+\.webp)"/g,(_,file)=>{
  const bytes=fs.readFileSync(path.join(root,file));
  if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')throw Error('Invalid tool photograph: '+file);
  count++;return '"url":"data:image/webp;base64,'+bytes.toString('base64')+'"';
 });
 if(count!==8)throw Error('Expected eight complete tool photographs, found '+count);
 fs.writeFileSync(path.join(out,'tool-images.js'),runtime);
}
module.exports=buildToolImages;
if(require.main===module)buildToolImages(path.resolve(process.argv[2]||'release-site'));
