// @version v0005 | 2026-11-04 | メモリード県央イベント申込
const ORIGIN='https://memolead-lp-665477084949.asia-northeast1.run.app';
const FORM_URL=ORIGIN+'/public/_form/sougi/kenou.html';
const EVENTS={'2026-11-13':'ききつメモリードホール','2026-11-19':'諫早メモリードホール','2026-11-25':'メモリードホール片町','2026-11-26':'メモリードホール片町','2026-11-27':'メモリードホール片町','2026-11-28':'メモリードホール片町','2026-11-29':'メモリードホール片町'};
const TIMES=['1部 10:00','2部 12:30','3部 15:00'];
export function validate(d){
 if(!d||typeof d!=='object'||Array.isArray(d))return false;
 if(d.email===undefined)d.email='';
 const fields={email:254,eventDate:10,timeSlot:20,fullName:80,kana:100,postalCode:8,address:250,birthYear:4,birthMonth:2,birthDay:2,notes:1000,requestId:36,token:2048};
 if(Object.keys(d).some(k=>!(k in fields)))return false;
 for(const [k,max] of Object.entries(fields))if(typeof d[k]!=='string'||d[k].length>max||(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(d[k])))return false;
 if(!EVENTS[d.eventDate]||!TIMES.includes(d.timeSlot)||!d.fullName.trim()||!d.address.trim()||!d.token||!/^[ァ-ヶー・\s]+$/.test(d.kana))return false;
 if(d.email&& !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email))return false;
 if(!/^\d{3}-?\d{4}$/.test(d.postalCode))return false;
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(d.requestId))return false;
 const now=new Date(Date.now()+9*3600000).toISOString().slice(0,10),y=Number(d.birthYear),m=Number(d.birthMonth),day=Number(d.birthDay);
 if(!d.birthYear&&!d.birthMonth&&!d.birthDay)return d.eventDate>=now;
 if(!/^\d{4}$/.test(d.birthYear)||!/^\d{1,2}$/.test(d.birthMonth)||!/^\d{1,2}$/.test(d.birthDay)||y<Number(now.slice(0,4))-120||m<1||m>12||day<1||day>new Date(Date.UTC(y,m,0)).getUTCDate())return false;
 const birthday=`${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
 return birthday<=now&&d.eventDate>=now;
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export default {async fetch(request,env){
 const origin=request.headers.get('Origin'),url=new URL(request.url);
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
 if(origin===ORIGIN)headers['Access-Control-Allow-Origin']=origin;
 const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers});
 if(url.pathname==='/health'&&request.method==='GET')return reply(200,{ok:true,version:'v0005'});
 if(origin!==ORIGIN)return reply(403,{error:'origin'});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'}});
 const ip=request.headers.get('CF-Connecting-IP')||'unknown';
 try{
 if(url.pathname==='/api/postcode'&&request.method==='GET'){
  if(!(await env.LOOKUP_LIMIT.limit({key:ip})).success)return reply(429,{error:'rate_limit'});
  const code=url.searchParams.get('code');if(!/^\d{7}$/.test(code||''))return reply(400,{addresses:[]});
  const r=await fetch('https://zipcloud.ibsnet.co.jp/api/search?zipcode='+code,{signal:AbortSignal.timeout(6000)});if(!r.ok)return reply(502,{addresses:[]});const data=await r.json();if(data.status!==200)return reply(502,{addresses:[]});return reply(200,{addresses:[...new Set((data.results||[]).filter(a=>a.zipcode===code).map(a=>a.address1+a.address2+a.address3))]});
 }
 if(url.pathname!=='/api/submit'||request.method!=='POST')return reply(404,{error:'not_found'});
 if(!env.BREVO_API_KEY||!env.TURNSTILE_SECRET||!env.NOTIFICATION_TO||!env.SENDER_EMAIL)return reply(503,{error:'unavailable'});
 if(!(await env.SUBMIT_LIMIT.limit({key:ip})).success)return reply(429,{error:'rate_limit'});
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return reply(415,{error:'content_type'});
 if(Number(request.headers.get('Content-Length'))>16384)return reply(413,{error:'too_large'});
 const reader=request.body?.getReader();if(!reader)return reply(400,{error:'invalid'});let bytes=0,chunks=[];while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>16384){await reader.cancel();return reply(413,{error:'too_large'});}chunks.push(value);}const all=new Uint8Array(bytes);let pos=0;for(const c of chunks){all.set(c,pos);pos+=c.length;}
 let d;try{d=JSON.parse(new TextDecoder().decode(all));}catch{return reply(400,{error:'invalid'});}if(!validate(d))return reply(400,{error:'invalid'});
 const verification=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.TURNSTILE_SECRET,response:d.token,remoteip:ip}),signal:AbortSignal.timeout(8000)});
 const v=await verification.json();if(!verification.ok||!v.success||v.hostname!==new URL(ORIGIN).hostname||v.action!=='kenou_event')return reply(403,{error:'verification'});
 const rows=[['受付番号',d.requestId],['日程',d.eventDate],['会場',EVENTS[d.eventDate]],['時間帯',d.timeSlot],['お名前',d.fullName],['カナ',d.kana],['郵便番号',d.postalCode||'記載なし'],['住所',d.address],['メールアドレス',d.email||'記載なし'],['生年月日',d.birthYear?`${d.birthYear}年${d.birthMonth}月${d.birthDay}日`:'記載なし'],['備考',d.notes||'記載なし']];
 const isTest=env.TEST_BCC==='true'&&d.fullName==='公開動作テスト（申込ではありません）';
 const payload={sender:{email:env.SENDER_EMAIL,name:'メモリード イベント受付'},to:env.NOTIFICATION_TO.split(',').map(email=>({email:email.trim()})),subject:`${isTest?'【公開動作テスト・申込ではありません】':'【イベント参加申込】'}${d.eventDate} ${EVENTS[d.eventDate]}`,textContent:rows.map(([k,v])=>`${k}：${v}`).join('\n')+'\n送信元フォーム：'+FORM_URL,htmlContent:`<h2>${isTest?'公開動作テスト（実際の申込ではありません）':'イベント参加申込を受け付けました'}</h2><table>${rows.map(([k,v])=>`<tr><th style="text-align:left;vertical-align:top">${esc(k)}</th><td style="white-space:pre-wrap">${esc(v)}</td></tr>`).join('')}</table><p><a href="${FORM_URL}">送信元フォーム</a></p>`,headers:{IdempotencyKey:d.requestId},tags:['kenou-event',isTest?'launch-test':'application']};
 if(isTest&&env.TEST_BCC_EMAIL)payload.bcc=[{email:env.TEST_BCC_EMAIL}];
 if(d.email){
  const confirmationRows=rows.filter(([label])=>['受付番号','日程','会場','時間帯','お名前'].includes(label));
  const intro=d.fullName+' 様\n\nメモリードのイベントにお申し込みいただき、ありがとうございます。\n以下の内容でお申し込みを受け付けました。';
  const closing='このメールはお申し込み受付時に自動送信しています。\nお心当たりのない場合は、このメールを破棄してください。';
  const applicant={to:[{email:d.email,name:d.fullName}],subject:'【メモリード】イベント参加申込を受け付けました',textContent:intro+'\n\n'+confirmationRows.map(([k,v])=>k+'：'+v).join('\n')+'\n\n'+closing+'\n申込フォーム：'+FORM_URL,htmlContent:'<p>'+esc(d.fullName)+' 様</p><p>メモリードのイベントにお申し込みいただき、ありがとうございます。<br>以下の内容でお申し込みを受け付けました。</p><table>'+confirmationRows.map(([k,v])=>'<tr><th style="text-align:left;vertical-align:top">'+esc(k)+'</th><td>'+esc(v)+'</td></tr>').join('')+'</table><p>このメールはお申し込み受付時に自動送信しています。<br>お心当たりのない場合は、このメールを破棄してください。</p><p><a href="'+FORM_URL+'">申込フォーム</a></p>'};
  const admin={to:payload.to};if(payload.bcc)admin.bcc=payload.bcc;
  payload.messageVersions=[admin,applicant];delete payload.to;delete payload.bcc;
 }
 const mail=await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'api-key':env.BREVO_API_KEY,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
 const result=await mail.json();if(!mail.ok&&!(result.code==='duplicate_parameter'&&/idempotency key.*already been processed/i.test(result.message||''))){console.error('mail_error',mail.status,result.code);return reply(502,{error:'mail'});}
 return reply(200,{ok:true,receipt:d.requestId});
 }catch{return reply(503,{error:'temporarily_unavailable'});}
}};
