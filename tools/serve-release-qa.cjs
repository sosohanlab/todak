// Local QA only: review scenes are injected in responses and never written to the release.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..','release-site'),scenes=fs.readFileSync(path.resolve(__dirname,'../ui-layout-preview/preview-scenes.js'),'utf8');
function review(html){return html.replace('<head>','<head><script>if(/^(0[1-9]|10|11|section)$/.test(new URLSearchParams(location.search).get("screen")||"")){try{localStorage.setItem("todak.tutorial.v1","complete");}catch(_){}}</script>').replace('if(hot&&hot.ready){hot.ready(start);}',scenes+'\nif(hot&&hot.ready){hot.ready(start);}');}
module.exports={review};
if(require.main===module)http.createServer((req,res)=>{try{
 const url=new URL(req.url,'http://localhost'),name=decodeURIComponent(url.pathname),file=path.resolve(root,'.'+name+(name.endsWith('/')?'index.html':''));
 if(file!==root&&!file.startsWith(root+path.sep))throw Error('path');
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory()){res.writeHead(301,{Location:url.pathname+'/'+url.search});res.end();return;}
 let body=fs.readFileSync(file);if(file===path.join(root,'index.html')&&/^(0[1-9]|10|11|section)$/.test(url.searchParams.get('screen')||''))body=review(body.toString());
 res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.json':'application/json','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(body);
 }catch(_){res.writeHead(404);res.end('Not found');}}).listen(8771,'127.0.0.1',()=>console.log('Production QA at http://127.0.0.1:8771'));
