type Dependencies={env:(key:string)=>string|undefined;fetch:typeof fetch;now:()=>number};
const MAX_BODY=710_000;
const DEFAULT_ORIGINS=['https://todak.sosohanlab.com','https://sosohanlab.github.io','http://127.0.0.1:8770','http://localhost:8770'];
async function body(req:Request):Promise<Record<string,unknown>>{
 if(!req.headers.get('content-type')?.toLowerCase().startsWith('application/json'))throw Error('invalid');
 if(!req.body||Number(req.headers.get('content-length'))>MAX_BODY)throw Error('invalid');
 const reader=req.body.getReader(),parts:Uint8Array[]=[];let total=0;
 while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>MAX_BODY){await reader.cancel();throw Error('invalid');}parts.push(value);}
 const bytes=new Uint8Array(total);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
 const value=JSON.parse(new TextDecoder().decode(bytes));if(!value||typeof value!=='object'||Array.isArray(value))throw Error('invalid');return value;
}
async function fingerprint(ip:string,key:string):Promise<string>{
 const secret=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const result=await crypto.subtle.sign('HMAC',secret,new TextEncoder().encode(ip));return Array.from(new Uint8Array(result),v=>v.toString(16).padStart(2,'0')).join('');
}
export function createHandler(deps:Dependencies){return async(req:Request):Promise<Response>=>{
 const origin=req.headers.get('origin')||'',allowed=(deps.env('FEEDBACK_ALLOWED_ORIGINS')||DEFAULT_ORIGINS.join(',')).split(',').map(v=>v.trim());
 const headers:Record<string,string>={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
 const reply=(status:number,value:unknown)=>new Response(JSON.stringify(value),{status,headers});
 if(!allowed.includes(origin))return reply(403,{error:'not_allowed'});
 headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Methods']='POST, OPTIONS';headers['Access-Control-Allow-Headers']='content-type, authorization, apikey';
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply(405,{error:'method_not_allowed'});
 let value:Record<string,unknown>;try{value=await body(req);}catch{return reply(400,{error:'invalid_feedback'});}
 if(typeof value.website==='string'&&value.website.trim())return reply(200,{ok:true});
 const message=typeof value.message==='string'?value.message.trim():'',category=value.category,id=value.requestId,page=value.page;
 if(message.length<5||message.length>2000||!['bug','idea','other'].includes(String(category))||typeof id!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)||typeof page!=='string'||page.length>120||!page.startsWith('/'))return reply(400,{error:'invalid_feedback'});
 const width=Number(value.width),height=Number(value.height);if(!Number.isInteger(width)||!Number.isInteger(height)||width<0||height<0||width>10000||height>10000)return reply(400,{error:'invalid_feedback'});
 const attachment=value.attachment==null?null:value.attachment;
 if(attachment!==null){
  if(typeof attachment!=='string'||attachment.length>680000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(attachment))return reply(400,{error:'invalid_image'});
  try{const bytes=atob(attachment.slice(23));if(bytes.length<4||bytes.charCodeAt(0)!==255||bytes.charCodeAt(1)!==216||bytes.charCodeAt(2)!==255||bytes.charCodeAt(bytes.length-2)!==255||bytes.charCodeAt(bytes.length-1)!==217)throw Error();}catch{return reply(400,{error:'invalid_image'});}
 }
 const url=deps.env('SUPABASE_URL'),service=deps.env('SUPABASE_SERVICE_ROLE_KEY');if(!url||!service)return reply(503,{error:'unavailable'});
 try{
  const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||req.headers.get('x-real-ip')||'unknown';
  // Store only a short-lived HMAC for rate limiting; never save the raw address.
  const client=await fingerprint(ip,(deps.env('FEEDBACK_RATE_SALT')||service)+'|'+new Date(deps.now()).toISOString().slice(0,10));
  const rpc=(name:string,value:unknown)=>deps.fetch(url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:service,Authorization:'Bearer '+service,'Content-Type':'application/json'},body:JSON.stringify(value),signal:AbortSignal.timeout(8000)});
  const result=await rpc(attachment?'todak_feedback_submit_with_image':'todak_feedback_submit',{p_request_id:id,p_client_hash:client,p_category:category,p_message:message,p_page:page,p_width:width,p_height:height,...(attachment?{p_attachment:attachment}:{})});
  if(!result.ok)return reply(503,{error:'unavailable'});
  const saved=await result.json();if(saved?.accepted!==true){headers['Retry-After']='60';return reply(429,{error:'rate_limit'});}
  const claim=await rpc('todak_feedback_mail_claim',{p_request_id:id});if(!claim.ok)return reply(503,{error:'unavailable'});
  const mail=await claim.json();if(mail?.state==='sent')return reply(200,{ok:true});if(mail?.state!=='send')return reply(503,{error:'unavailable'});
  const kinds:Record<string,string>={bug:'불편·오류 제보',idea:'개선 제안',other:'기타 의견'};
  let sent=false,activation=false;
  try{
   const fields={_subject:'[토닥 피드백] '+(kinds[mail.category]||'의견'),_template:'table',_captcha:'false',_url:'https://todak.sosohanlab.com/',종류:kinds[mail.category]||'의견',내용:mail.message,페이지:mail.page,화면크기:mail.width+' × '+mail.height,접수번호:id};
   const mailHeaders:Record<string,string>={Accept:'application/json',Origin:'https://todak.sosohanlab.com',Referer:'https://todak.sosohanlab.com/'};
   let mailBody:BodyInit;
   if(typeof mail.attachment==='string'){
    const data=new FormData();for(const [key,val]of Object.entries(fields))data.append(key,String(val));
    const binary=atob(mail.attachment.slice(23)),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));data.append('attachment',new Blob([bytes],{type:'image/jpeg'}),'todak-feedback.jpg');mailBody=data;
   }else{mailHeaders['Content-Type']='application/json';mailBody=JSON.stringify(fields);}
   const delivery=await deps.fetch('https://formsubmit.co/ajax/sosohanlab08@gmail.com',{method:'POST',headers:mailHeaders,body:mailBody,signal:AbortSignal.timeout(8000)});
   const accepted=await delivery.json();sent=delivery.ok&&(accepted.success===true||accepted.success==='true');activation=!sent&&typeof accepted.message==='string'&&/activat/i.test(accepted.message);
  }catch{/* Keep the stored feedback private and allow the same request to retry. */}
  const recorded=await rpc('todak_feedback_mail_result',{p_request_id:id,p_sent:sent});if(!recorded.ok&&!sent)return reply(503,{error:'unavailable'});
  if(!sent)return reply(503,{error:activation?'setup_pending':'unavailable'});
  // No feedback text, list, author or database identifier is returned to visitors.
  return reply(200,{ok:true});
 }catch{return reply(503,{error:'unavailable'});}
};}
const runtime=(globalThis as unknown as {Deno?:{env:{get:(key:string)=>string|undefined};serve:(handler:(req:Request)=>Promise<Response>)=>void}}).Deno;
if(runtime)runtime.serve(createHandler({env:key=>runtime.env.get(key),fetch:globalThis.fetch,now:Date.now}));
