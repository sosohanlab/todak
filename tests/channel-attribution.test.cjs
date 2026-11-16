const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('channel-attribution.js','utf8');
function inspect(search,referrer='',enabled=true){const calls=[],window={};if(enabled)window.clarity=(...args)=>calls.push(args);vm.runInNewContext(source,{URL,URLSearchParams,location:{search},document:{referrer},window});return calls;}
test('campaign URLs label Threads and Instagram without changing the URL',()=>{
 for(const [src,channel] of [['threads','threads'],['instagram','instagram'],['insta','instagram']])assert.deepEqual(inspect('?utm_source='+src),[['set','promotion_channel',channel],['event','promotion_visit_'+channel]]);
});
test('referrer fallback only recognizes real channel domains',()=>{
 assert.equal(inspect('','https://l.instagram.com/')[0][2],'instagram');assert.equal(inspect('','https://www.threads.com/')[0][2],'threads');assert.equal(inspect('','https://instagram.com.example.org/')[0][2],'untagged');
});
test('unknown, untagged, and missing analytics do not break the app',()=>{
 assert.equal(inspect('?utm_source=newsletter','https://instagram.com/')[0][2],'other_campaign');assert.equal(inspect('')[0][2],'untagged');assert.deepEqual(inspect('?utm_source=threads','',false),[]);
});
