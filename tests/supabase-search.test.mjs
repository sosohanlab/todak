import test from 'node:test';
import assert from 'node:assert/strict';
import {createHandler,decodeImage,normalizeMatches,searchQuery} from '../supabase/functions/image-search/index.ts';
const origin='https://sosohanlab.github.io';
const env={SERPAPI_API_KEY:'PRIVATE-provider-key',SUPABASE_URL:'https://test-project.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'PRIVATE-server-role'};
const photo='data:image/jpeg;base64,'+Buffer.from([255,216,255,224,0,1]).toString('base64');
const json=(value,status=200)=>new Response(JSON.stringify(value),{status});
const request=(image=photo,source=origin)=>new Request('https://test-project.supabase.co/functions/v1/image-search',{method:'POST',headers:{Origin:source,'Content-Type':'application/json','x-forwarded-for':'192.0.2.1'},body:JSON.stringify({image})});
function setup(override={}){
  const calls=[];
  const handler=createHandler({env:k=>env[k],now:()=>123456000,fetch:async(url,options={})=>{
    calls.push({url:String(url),options});
    if(String(url).includes('/rpc/todak_search_cache_get'))return json(override.cache??null);
    if(String(url).includes('/rpc/todak_search_reserve'))return override.reserveResponse||json(override.reserve||{allowed:true});
    if(String(url).includes('/rpc/todak_search_cache_put'))return json(null);
    if(String(url)==='https://encrypted-tbn0.gstatic.com/qa.jpg')return new Response(new Uint8Array([137,80,78,71]),{headers:{'Content-Type':'image/png'}});
    if(url==='https://serpapi.com/image')return override.uploadResponse||json({image_id:'uploaded-photo-id'});
    if(String(url).startsWith('https://serpapi.com/search.json?'))return json({visual_matches:[{title:'도자기 볼',link:'https://shop.example/bowl',thumbnail:'https://shop.example/photo.jpg',price:{value:'₩20,000'}}]});
    throw Error('unexpected call');
  }});
  return {handler,calls};
}
test('allowed CORS preflight needs no key and makes no upstream request',async()=>{
  const {handler,calls}=setup();const r=await handler(new Request('https://test-project.supabase.co/functions/v1/image-search',{method:'OPTIONS',headers:{Origin:origin}}));assert.equal(r.status,204);assert.equal(r.headers.get('Access-Control-Allow-Origin'),origin);assert.equal(calls.length,0);
});
test('unknown browser origins rejected before provider access',async()=>{
  const {handler,calls}=setup();const r=await handler(request(photo,'https://evil.example'));assert.equal(r.status,403);assert.equal(calls.length,0);
});
test('invalid images never reserve quota or reach the provider',async()=>{
  const {handler,calls}=setup();const r=await handler(request('data:image/jpeg;base64,aGVsbG8='));assert.equal(r.status,400);assert.equal(calls.length,0);assert.throws(()=>decodeImage('data:image/jpeg;base64,%%%%'));
});
test('oversize request rejected before JSON parsing or quota',async()=>{
  const {handler,calls}=setup();const r=await handler(request('x'.repeat(720001)));assert.equal(r.status,413);assert.equal(calls.length,0);
});
test('same-image DB cache avoids any paid API request',async()=>{
  const {handler,calls}=setup({cache:{matches:[],method:'image'}});const r=await handler(request());assert.equal(r.status,200);assert.equal(calls.length,1);
});
for(const reason of ['monthly_limit','daily_limit','client_limit'])test(reason+' prevents paid API calls',async()=>{
  const {handler,calls}=setup({reserve:{allowed:false,reason}});const r=await handler(request());assert.equal(r.status,429);assert.equal((await r.json()).error,reason);assert.equal(calls.length,2);
});
test('DB outage fails closed rather than using an unbounded memory counter',async()=>{
  const {handler,calls}=setup({reserveResponse:json({error:'db'},500)});const r=await handler(request());assert.equal(r.status,503);assert.equal(calls.length,2);
});
test('actual image upload ID drives search; keys and raw IP never returned',async()=>{
  const {handler,calls}=setup();const r=await handler(request());assert.equal(r.status,200);const body=await r.json();assert.equal(body.matches.length,1);assert.equal(body.method,'image');
  const upload=calls.find(c=>c.url==='https://serpapi.com/image');assert.equal(upload.options.body.get('api_key'),env.SERPAPI_API_KEY);assert.equal(upload.options.body.get('image').size,6);
  const search=calls.find(c=>c.url.startsWith('https://serpapi.com/search.json?'));const params=new URL(search.url).searchParams;assert.equal(params.get('image_id'),'uploaded-photo-id');assert.equal(params.get('q'),'도자기');
  const reserve=JSON.parse(calls[1].options.body);assert.match(reserve.p_client_hash,/^[a-f0-9]{64}$/);assert.equal(reserve.p_month_limit,200);assert.equal(reserve.p_day_limit,20);assert.equal(reserve.p_client_day_limit,5);
  assert(!JSON.stringify(body).includes('PRIVATE'));assert(!JSON.stringify(reserve).includes('192.0.2.1'));
});
test('upstream upload failure causes no second paid search or automatic retry',async()=>{
  const {handler,calls}=setup({uploadResponse:json({error:'SECRET-error'},500)});const r=await handler(request());assert.equal(r.status,502);assert.equal(calls.length,3);assert(!JSON.stringify(await r.json()).includes('SECRET-error'));
});
test('editorial and unsafe results never presented as products',()=>{
  assert.deepEqual(normalizeMatches({visual_matches:[{title:'blog',link:'https://example.com',thumbnail:'https://example.com/image'},{title:'unsafe',link:'javascript:alert(1)',thumbnail:'https://example.com/image',price:'10'}]}),[]);
});
test('unconfigured secrets return a clear status without upstream calls',async()=>{
  const handler=createHandler({env:()=>undefined,fetch:()=>{throw Error('must not call');},now:Date.now});const r=await handler(request());assert.equal(r.status,503);assert.equal((await r.json()).error,'search_not_configured');
});

test('image search context includes validated category and both dimensions',()=>{
  const q=searchQuery({category:'파스타볼',style:'분청',diameterCm:19,heightCm:8});assert(q.includes('파스타볼'));assert(q.includes('19cm'));assert(q.includes('높이 8cm'));assert.equal(searchQuery(null),'도자기');assert(!searchQuery({category:'<script>',diameterCm:-10,heightCm:Infinity}).includes('<'));
});
test('different context produces a different result cache key for the same image',async()=>{
 const a=setup(),b=setup();await a.handler(request());await b.handler(new Request('https://test-project.supabase.co/functions/v1/image-search',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({image:photo,context:{category:'파스타볼',diameterCm:19,heightCm:8}})}));assert.notEqual(JSON.parse(a.calls[0].options.body).p_digest,JSON.parse(b.calls[0].options.body).p_digest);assert(new URL(b.calls.find(c=>c.url.startsWith('https://serpapi.com/search.json?')).url).searchParams.get('q').includes('19cm'));
});
test('comparison image uses a cached provider thumbnail without a paid search',async()=>{
 const {handler,calls}=setup({cache:{matches:[{image:'https://encrypted-tbn0.gstatic.com/qa.jpg'}]}});const r=await handler(new Request('https://test-project.supabase.co/functions/v1/image-search',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({action:'comparison-image',cacheKey:'a'.repeat(64),index:0})}));assert.equal(r.status,200);assert((await r.json()).image.startsWith('data:image/png;base64,'));assert.equal(calls.length,2);assert(!calls.some(c=>c.url.includes('serpapi.com')));
});
test('comparison image cannot request arbitrary/private hosts',async()=>{
 const {handler,calls}=setup({cache:{matches:[{image:'https://127.0.0.1/private'}]}});const r=await handler(new Request('https://test-project.supabase.co/functions/v1/image-search',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({action:'comparison-image',cacheKey:'a'.repeat(64),index:0})}));assert.equal(r.status,422);assert.equal(calls.length,1);
});
