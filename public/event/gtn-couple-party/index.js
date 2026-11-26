// @version v0001 | 2026-11-26 | ガーデンテラス長崎 カップリングパーティー応募
const ORIGIN='https://memolead-lp-665477084949.asia-northeast1.run.app';
const FORM_URL=ORIGIN+'/public/event/gtn-couple-party/';
// 応募通知を受け取るアドレス（複数OK）
const TO=['tominaga-tatsu@memolead.co.jp','y.matsuda@memolead.co.jp','itai-ken@memolead.co.jp','emaweb@emanet.jp'];
// 送信元アドレス（Brevoで認証済みのもの・1つだけ）
const SENDER='sender@nfz33.com';
const HOTEL='ガーデンテラス長崎ホテル&リゾート';
const HOTEL_TEL='095-XXX-XXXX'; // ★要確認：お客様向けメールに載せる電話番号
const MIN_AGE=18; // 生年月日の下限年齢（フォームの CONFIG.minAge と合わせる）
const ageOf=(iso,today)=>{const [y,m,d]=iso.split('-').map(Number),[ty,tm,td]=today.split('-').map(Number);return ty-y-((tm<m||(tm===m&&td<d))?1:0);};
export function validate(d){
 if(!d||typeof d!=='object'||Array.isArray(d))return false;
 for(const k of ['notes','website'])if(d[k]===undefined)d[k]='';
 const fields={fullName:80,kana:100,email:254,phone:30,birthDate:10,notes:1000,website:200,requestId:36,token:2048};
 if(Object.keys(d).some(k=>!(k in fields)))return false;
 for(const [k,max] of Object.entries(fields))if(typeof d[k]!=='string'||d[k].length>max||(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(d[k])))return false;
 if(!d.fullName.trim()||!d.token||!/^[ァ-ヶー・\s]+$/.test(d.kana))return false;
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email))return false;
 d.phone=d.phone.normalize('NFKC').replace(/[\s()（）－‐‑‒–—―ー-]/g,'');
 if(!/^0\d{9,10}$/.test(d.phone))return false;
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(d.requestId))return false;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(d.birthDate))return false;
 const [y,mo,day]=d.birthDate.split('-').map(Number);if(y<1900||mo<1||mo>12||day<1||day>new Date(Date.UTC(y,mo,0)).getUTCDate())return false;
 const today=new Date(Date.now()+9*3600000).toISOString().slice(0,10);
 const age=ageOf(d.birthDate,today);if(age<MIN_AGE||age>120)return false;
 d.age=age;
 return true;
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const jpDate=s=>{const [y,m,d]=s.split('-').map(Number);return `${y}年${m}月${d}日`;};
export default {async fetch(request,env){
 const origin=request.headers.get('Origin'),url=new URL(request.url);
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
 if(origin===ORIGIN)headers['Access-Control-Allow-Origin']=origin;
 const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers});
 if(url.pathname==='/health'&&request.method==='GET')return reply(200,{ok:true,version:'v0001'});
 if(origin!==ORIGIN)return reply(403,{error:'origin'});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'}});
 const ip=request.headers.get('CF-Connecting-IP')||'unknown';
 try{
 if(url.pathname!=='/api/submit'||request.method!=='POST')return reply(404,{error:'not_found'});
 if(!env.BREVO_API_KEY||!env.TURNSTILE_SECRET)return reply(503,{error:'unavailable'});
 if(env.SUBMIT_LIMIT&&!(await env.SUBMIT_LIMIT.limit({key:ip})).success)return reply(429,{error:'rate_limit'});
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return reply(415,{error:'content_type'});
 if(Number(request.headers.get('Content-Length'))>16384)return reply(413,{error:'too_large'});
 const reader=request.body?.getReader();if(!reader)return reply(400,{error:'invalid'});let bytes=0,chunks=[];while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>16384){await reader.cancel();return reply(413,{error:'too_large'});}chunks.push(value);}const all=new Uint8Array(bytes);let pos=0;for(const c of chunks){all.set(c,pos);pos+=c.length;}
 let d;try{d=JSON.parse(new TextDecoder().decode(all));}catch{return reply(400,{error:'invalid'});}if(!validate(d))return reply(400,{error:'invalid'});
 if(d.website)return reply(200,{ok:true,receipt:d.requestId}); // ボット（見えない欄に入力あり）は送信せず成功を返す
 const verification=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.TURNSTILE_SECRET,response:d.token,remoteip:ip}),signal:AbortSignal.timeout(8000)});
 const v=await verification.json();if(!verification.ok||!v.success||v.hostname!==new URL(ORIGIN).hostname||v.action!=='couple_party')return reply(403,{error:'verification'});
 const rows=[['お名前',d.fullName],['フリガナ',d.kana],['電話番号',d.phone],['メールアドレス',d.email],['生年月日',`${jpDate(d.birthDate)}（${d.age}歳）`],['お問い合わせ',d.notes||'記載なし']];
 const table=rs=>'<table>'+rs.map(([k,v])=>`<tr><th style="text-align:left;vertical-align:top;white-space:nowrap;padding-right:12px">${esc(k)}</th><td style="white-space:pre-wrap">${esc(v)}</td></tr>`).join('')+'</table>';
 const admin={to:TO.map(email=>({email})),replyTo:{email:d.email,name:d.fullName}};
 const intro=d.fullName+' 様\n\nカップリングパーティーへお申し込みいただき、誠にありがとうございます。\n担当者が確認の上、確認完了メールをお送りいたしますので、暫くお待ちくださいませ。\n\n尚、数日経過後も確認完了メールが届かない場合は\n大変お手数ですが、下記電話番号に直接お問い合わせを\nお願いいたします。\n'+HOTEL+'\nTEL：'+HOTEL_TEL;
 const lead='以下送信内容です。\n※このメールは自動で送信されています。\n※このメールには返信できません。';
 const applicant={to:[{email:d.email,name:d.fullName}],subject:'【カップリングパーティー】お申し込みを受け付けました',textContent:intro+'\n\n'+lead+'\n\n'+rows.map(([k,v])=>k+'：'+v).join('\n'),htmlContent:'<p>'+esc(intro).replace(/\n/g,'<br>')+'</p><p>'+esc(lead).replace(/\n/g,'<br>')+'</p>'+table(rows)};
 const payload={sender:{email:SENDER,name:'ガーデンテラス長崎 カップリングパーティー受付'},subject:`【カップリングパーティー応募】${d.fullName} 様（${d.age}歳）${d.notes?' ※問い合わせあり':''}`,textContent:rows.map(([k,v])=>`${k}：${v}`).join('\n')+'\n送信元フォーム：'+FORM_URL,htmlContent:`<h2>カップリングパーティーの応募がありました</h2>${table(rows)}<p><a href="${FORM_URL}">送信元フォーム</a></p>`,headers:{IdempotencyKey:d.requestId},tags:['couple-party'],messageVersions:[admin,applicant]};
 const mail=await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'api-key':env.BREVO_API_KEY,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
 const result=await mail.json();if(!mail.ok&&!(result.code==='duplicate_parameter'&&/idempotency key.*already been processed/i.test(result.message||''))){console.error('mail_error',mail.status,result.code);return reply(502,{error:'mail'});}
 return reply(200,{ok:true,receipt:d.requestId});
 }catch{return reply(503,{error:'temporarily_unavailable'});}
}};