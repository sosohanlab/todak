/** Public, login-free image search. Secrets stay inside Supabase Edge Functions.
 * Database-backed limits fail closed across Edge isolates. No uploaded images are persisted.
 */
type Match = {url:string;image:string;title:string;source:string;price:string};
type Json = Record<string, unknown>;
type Dependencies = {env:(key:string)=>string|undefined;fetch:typeof fetch;now:()=>number};
class SearchError extends Error {status:number;code:string;constructor(status:number,code:string){super(code);this.status=status;this.code=code;}}
const MAX_BODY = 720_000;

function safeUrl(value:unknown):string|null {
  if(typeof value!=='string')return null;
  try{const u=new URL(value);return u.protocol==='https:'&&u.hostname?u.href:null;}catch{return null;}
}
export function normalizeMatches(payload:Json):Match[]{
  const rows=Array.isArray(payload.visual_matches)?payload.visual_matches:[],seen=new Set<string>(),out:Match[]=[];
  for(const value of rows){
    if(!value||typeof value!=='object')continue;
    const row=value as Json,url=safeUrl(row.link),image=safeUrl(row.thumbnail);
    let price=row.price;
    if(price&&typeof price==='object')price=(price as Json).value??(price as Json).extracted_value;
    if(!url||!image||typeof row.title!=='string'||!row.title.trim()||!price||seen.has(url))continue;
    if(typeof price!=='string'&&typeof price!=='number')continue;
    seen.add(url);out.push({url,image,title:row.title.slice(0,250),source:String(row.source||new URL(url).hostname).slice(0,100),price:String(price).slice(0,80)});
    if(out.length===8)break;
  }
  return out;
}
export function decodeImage(value:unknown):Uint8Array {
  if(typeof value!=='string'||!value.startsWith('data:image/jpeg;base64,'))throw new SearchError(400,'invalid_image');
  const encoded=value.slice(23);
  if(encoded.length>666_668||!encoded.length||encoded.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded))throw new SearchError(400,'invalid_image');
  let binary:string;try{binary=atob(encoded);}catch{throw new SearchError(400,'invalid_image');}
  if(binary.length<4||binary.length>500_000||binary.charCodeAt(0)!==255||binary.charCodeAt(1)!==216||binary.charCodeAt(2)!==255)throw new SearchError(400,'invalid_image');
  return Uint8Array.from(binary,c=>c.charCodeAt(0));
}
async function boundedJson(req:Request):Promise<Json>{
  if(!req.headers.get('content-type')?.toLowerCase().startsWith('application/json'))throw new SearchError(415,'json_required');
  if(Number(req.headers.get('content-length'))>MAX_BODY)throw new SearchError(413,'image_too_large');
  if(!req.body)throw new SearchError(400,'invalid_request');
  const reader=req.body.getReader(),parts:Uint8Array[]=[];let total=0;
  while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>MAX_BODY){await reader.cancel();throw new SearchError(413,'image_too_large');}parts.push(value);}
  const bytes=new Uint8Array(total);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
  try{const parsed=JSON.parse(new TextDecoder().decode(bytes));if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error();return parsed;}catch{throw new SearchError(400,'invalid_request');}
}
async function digest(bytes:Uint8Array):Promise<string>{
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(bytes).buffer)),v=>v.toString(16).padStart(2,'0')).join('');
}
async function clientHash(ip:string,salt:string):Promise<string>{
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(salt),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(ip))),v=>v.toString(16).padStart(2,'0')).join('');
}
function limit(value:string|undefined,fallback:number,ceiling:number):number{const n=Number(value);return Number.isInteger(n)&&n>0?Math.min(n,ceiling):fallback;}

export function createHandler(deps:Dependencies){
  return async (req:Request):Promise<Response>=>{
    const origin=req.headers.get('origin')||'';
    const allowed=(deps.env('ALLOWED_ORIGINS')||'https://sosohanlab.github.io').split(',').map(s=>s.trim()).filter(Boolean);
    const headers:Record<string,string>={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
    const reply=(status:number,body:Json)=>new Response(JSON.stringify(body),{status,headers});
    // Origin restricts browsers, not scripts. Shared global quotas below bound provider usage.
    if(!origin||!allowed.includes(origin))return reply(403,{error:'origin_not_allowed'});
    headers['Access-Control-Allow-Origin']=origin;
    headers['Access-Control-Allow-Methods']='POST, OPTIONS';
    headers['Access-Control-Allow-Headers']='content-type, apikey, authorization, x-client-info';
    if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
    if(req.method!=='POST')return reply(405,{error:'method_not_allowed'});
    const apiKey=deps.env('SERPAPI_API_KEY'),base=deps.env('SUPABASE_URL'),admin=deps.env('SUPABASE_SERVICE_ROLE_KEY');
    if(!apiKey||!base||!admin)return reply(503,{error:'search_not_configured'});
    const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),38_000);
    const rpc=async(name:string,args:Json):Promise<unknown>=>{
      try{
        const r=await deps.fetch(base.replace(/\/$/,'')+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:admin,Authorization:'Bearer '+admin,'Content-Type':'application/json'},body:JSON.stringify(args),signal:abort.signal});
        if(!r.ok)throw Error();return await r.json();
      }catch{throw new SearchError(503,'search_limits_unavailable');}
    };
    try{
      const input=await boundedJson(req),image=decodeImage(input.image),imageHash=await digest(image);
      const cached=await rpc('todak_search_cache_get',{p_digest:imageHash});
      if(cached&&typeof cached==='object'&&Array.isArray((cached as Json).matches))return reply(200,cached as Json);
      // IP is an extra throttle, not an identity. An unavailable IP falls into a shared bucket.
      const ip=(req.headers.get('x-forwarded-for')||'unknown').split(',')[0].trim().slice(0,128);
      const hash=await clientHash(ip,deps.env('SEARCH_RATE_SALT')||admin);
      const reservation=await rpc('todak_search_reserve',{p_client_hash:hash,p_month_limit:limit(deps.env('SEARCH_MONTHLY_LIMIT'),200,10_000),p_day_limit:limit(deps.env('SEARCH_DAILY_LIMIT'),20,1000),p_client_day_limit:limit(deps.env('SEARCH_CLIENT_DAILY_LIMIT'),5,50)}) as Json;
      if(!reservation||reservation.allowed!==true){
        const reasons=['monthly_limit','daily_limit','client_limit'];
        const reason=reasons.includes(String(reservation?.reason))?String(reservation.reason):'search_limits_unavailable';
        return reply(reason==='search_limits_unavailable'?503:429,{error:reason});
      }
      const form=new FormData();form.set('api_key',apiKey);form.set('image',new Blob([new Uint8Array(image).buffer],{type:'image/jpeg'}),'todak.jpg');
      const upload=await deps.fetch('https://serpapi.com/image',{method:'POST',body:form,signal:abort.signal});
      if(!upload.ok)throw new SearchError(502,'search_unavailable');
      const uploaded=await upload.json();if(typeof uploaded.image_id!=='string'||uploaded.error)throw new SearchError(502,'search_unavailable');
      const query=new URLSearchParams({engine:'google_lens',type:'visual_matches',image_id:uploaded.image_id,api_key:apiKey,hl:'ko',country:'kr'});
      const search=await deps.fetch('https://serpapi.com/search.json?'+query,{signal:abort.signal});
      if(!search.ok)throw new SearchError(502,'search_unavailable');
      const payload=await search.json();if(payload.error)throw new SearchError(502,'search_unavailable');
      const result={matches:normalizeMatches(payload),method:'image',checked_at:Math.floor(deps.now()/1000)};
      // A result is still usable if writing the cache fails. Never retry the paid search.
      try{await rpc('todak_search_cache_put',{p_digest:imageHash,p_result:result});}catch{/* quota already counted */}
      return reply(200,result);
    }catch(error){
      return error instanceof SearchError?reply(error.status,{error:error.code}):reply(502,{error:'search_unavailable'});
    }finally{clearTimeout(timer);}
  };
}

if(typeof Deno!=='undefined'){
  Deno.serve(createHandler({env:(name)=>Deno.env.get(name),fetch:globalThis.fetch.bind(globalThis),now:Date.now}));
}
