const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),{review}=require('./serve-release-qa.cjs');
const root=path.resolve(__dirname,'..'),test=process.argv[2];if(!/^[a-z0-9-]+\.cjs$/.test(test||''))throw Error('Expected QA filename');
const sourcePath=path.join(root,'ui-layout-preview',test),previewIndex=path.join(root,'ui-layout-preview/index.html'),originalRead=fs.readFileSync;
fs.readFileSync=function(file,...rest){if(typeof file==='string'&&path.resolve(file)===previewIndex){const html=review(originalRead(path.join(root,'release-site/index.html'),'utf8'));return rest[0]==='utf8'?html:Buffer.from(html);}return originalRead.call(this,file,...rest);};
const source=originalRead(sourcePath,'utf8').replaceAll('http://127.0.0.1:8770','http://127.0.0.1:8771');
process.argv.splice(2,1);const testModule=new Module(sourcePath,module);testModule.filename=sourcePath;testModule.paths=Module._nodeModulePaths(path.dirname(sourcePath));testModule._compile(source,sourcePath);
