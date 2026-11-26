/**
 * カップリングパーティー 応募フォーム受付 Worker
 *
 * POST /api/submit
 *   1. Origin チェック / レート制限 / ハニーポット
 *   2. 入力値検証（フロントと同じルール + サーバー側の上限）
 *   3. Cloudflare Turnstile 検証
 *   4. Brevo で管理者通知（失敗したらエラーを返し、お客様に再送してもらう）
 *   5. Brevo で受付完了メール（自動返信）
 *
 * 通知先・差出人などは Cloudflare の環境変数で管理（README 参照）
 * 秘密情報（BREVO_API_KEY / TURNSTILE_SECRET）は Secret として登録し、コードやフロントには置かない
 */

const KANA = /^[ァ-ヶー・\s]+$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default {
  async fetch(request, env, ctx) {
	const url = new URL(request.url);
	const origin = request.headers.get('Origin') || '';
	const allowed = list(env.ALLOWED_ORIGINS);
	const cors = {
	  'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : (allowed[0] || '*'),
	  'Access-Control-Allow-Methods': 'POST, OPTIONS',
	  'Access-Control-Allow-Headers': 'Content-Type',
	  'Access-Control-Max-Age': '86400',
	  Vary: 'Origin',
	};

	if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
	if (url.pathname !== '/api/submit') return json({ ok: false, error: 'not_found' }, 404, cors);
	if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405, cors);
	if (allowed.length && !allowed.includes(origin)) return json({ ok: false, error: 'forbidden' }, 403, cors);

	const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

	// レート制限（wrangler.toml の ratelimits バインディング。未設定なら素通し）
	if (env.RATE_LIMITER) {
	  const { success } = await env.RATE_LIMITER.limit({ key: ip });
	  if (!success) return json({ ok: false, error: 'rate_limit' }, 429, cors);
	}

	if ((request.headers.get('Content-Length') | 0) > 20000) return json({ ok: false, error: 'invalid' }, 413, cors);
	let raw;
	try { raw = await request.json(); } catch { return json({ ok: false, error: 'invalid' }, 400, cors); }
	if (!raw || typeof raw !== 'object') return json({ ok: false, error: 'invalid' }, 400, cors);

	// ハニーポットに入力があればボットとみなし、成功を装って何もしない
	if (raw.website) return json({ ok: true }, 200, cors);

	const d = normalize(raw);
	const errors = validate(d, env);
	if (errors.length) {
	  console.log('invalid', errors.join(','));
	  return json({ ok: false, error: 'invalid', fields: errors }, 400, cors);
	}

	// 二重送信防止（KV を設定した場合のみ）
	const dupKey = 'req:' + d.requestId;
	if (env.SUBMISSIONS && d.requestId && (await env.SUBMISSIONS.get(dupKey))) {
	  return json({ ok: true, duplicate: true }, 200, cors);
	}

	if (!(await verifyTurnstile(raw.token, ip, env))) {
	  return json({ ok: false, error: 'verification' }, 400, cors);
	}

	const receivedAt = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

	try {
	  await sendAdmin(d, env, receivedAt);
	} catch (e) {
	  console.error('admin mail failed:', e.message);
	  return json({ ok: false, error: 'mail' }, 502, cors);
	}

	// ここから先は失敗してもお客様には成功を返す（管理者には届いているため）
	ctx.waitUntil(Promise.allSettled([
	  sendAutoReply(d, env).catch((e) => console.error('auto reply failed:', e.message)),
	  env.SUBMISSIONS && d.requestId ? env.SUBMISSIONS.put(dupKey, '1', { expirationTtl: 86400 }) : null,
	]));

	return json({ ok: true }, 200, cors);
  },
};

/* ---------------- 入力値 ---------------- */

function line(v, max) {
  // 改行・制御文字を除去（件名や1行項目用）
  return String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}
function multi(v, max) {
  return String(v ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').trim().slice(0, max);
}

function normalize(r) {
  return {
	fullName: line(r.fullName, 50),
	kana: line(r.kana, 50),
	phone: line(r.phone, 20),
	email: line(r.email, 254),
	birthDate: line(r.birthDate, 10),
	notes: multi(r.notes, 1000),
	requestId: /^[0-9a-f-]{36}$/i.test(r.requestId || '') ? r.requestId : '',
  };
}

function ageOf(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const now = new Date(Date.now() + 9 * 3600 * 1000); // 日本時間
  let a = now.getUTCFullYear() - y;
  if (now.getUTCMonth() + 1 < m || (now.getUTCMonth() + 1 === m && now.getUTCDate() < d)) a--;
  return a;
}
function validBirth(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d && y >= 1900;
}

function validate(d, env) {
  const e = [];
  if (!d.fullName) e.push('name');
  if (!d.kana || !KANA.test(d.kana)) e.push('kana');
  const tel = d.phone.normalize('NFKC').replace(/[\s()（）－‐‑‒–—―ー-]/g, '');
  if (!/^0\d{9,10}$/.test(tel)) e.push('tel');
  if (!EMAIL.test(d.email)) e.push('email');
  const minAge = env.MIN_AGE === undefined ? 18 : parseInt(env.MIN_AGE, 10) || 0;
  if (!validBirth(d.birthDate) || ageOf(d.birthDate) < minAge || ageOf(d.birthDate) > 120) e.push('birth');
  return e;
}

/* ---------------- Turnstile ---------------- */

async function verifyTurnstile(token, ip, env) {
  if (!env.TURNSTILE_SECRET) { console.error('TURNSTILE_SECRET not set'); return false; }
  if (!token || typeof token !== 'string' || token.length > 2048) return false;
  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET);
  body.append('response', token);
  if (ip !== 'unknown') body.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const out = await res.json().catch(() => ({}));
  if (!out.success) { console.log('turnstile failed', JSON.stringify(out['error-codes'] || [])); return false; }
  if (env.TURNSTILE_ACTION && out.action !== env.TURNSTILE_ACTION) { console.log('turnstile action mismatch', out.action); return false; }
  return true;
}

/* ---------------- メール ---------------- */

function jpBirth(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${y}年${m}月${d}日（${ageOf(iso)}歳）`;
}

function rows(d) {
  return [
	['お名前', d.fullName],
	['フリガナ', d.kana],
	['電話番号', d.phone],
	['メールアドレス', d.email],
	['生年月日', jpBirth(d.birthDate)],
	['お問い合わせ', d.notes || '—'],
  ];
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function toHtmlTable(r) {
  return '<table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;border-color:#ddd;font-size:14px">' +
	r.map(([k, v]) => `<tr><th align="left" style="background:#f6f4f0;white-space:nowrap">${esc(k)}</th><td>${esc(v).replace(/\n/g, '<br>')}</td></tr>`).join('') +
	'</table>';
}
function toText(r) { return r.map(([k, v]) => `■${k}\n${v}`).join('\n\n'); }
function nl2br(s) { return esc(s).replace(/\\n|\n/g, '<br>'); }
function textNl(s) { return String(s || '').replace(/\\n/g, '\n'); }

async function brevo(path, payload, env) {
  if (!env.BREVO_API_KEY) throw new Error('BREVO_API_KEY not set');
  const res = await fetch('https://api.brevo.com/v3' + path, {
	method: 'POST',
	headers: { 'api-key': env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
	body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Brevo ${path} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res;
}

function sender(env) {
  return { email: env.MAIL_FROM, name: env.MAIL_FROM_NAME || 'ガーデンテラス長崎ホテル&リゾート' };
}

async function sendAdmin(d, env, receivedAt) {
  const to = list(env.NOTIFY_TO).map((email) => ({ email }));
  if (!to.length) throw new Error('NOTIFY_TO not set');
  const r = rows(d);
  const eventName = env.EVENT_NAME || 'カップリングパーティー';
  const payload = {
	sender: sender(env),
	to,
	replyTo: { email: d.email, name: d.fullName },
	subject: `【${eventName}】新規申込 ${d.fullName}様（${ageOf(d.birthDate)}歳）${d.notes ? ' ※問い合わせあり' : ''}`,
	htmlContent: `<p>${esc(eventName)}のお申し込みがありました。<br>受付日時：${esc(receivedAt)}</p>${toHtmlTable(r)}<p style="color:#888;font-size:12px">このメールに返信すると、お申し込み者に直接届きます。<br>受付ID：${esc(d.requestId)}</p>`,
	textContent: `${eventName}のお申し込みがありました。\n受付日時：${receivedAt}\n\n${toText(r)}\n\n受付ID：${d.requestId}`,
	tags: ['couple-party', 'admin'],
  };
  const bcc = list(env.NOTIFY_BCC).map((email) => ({ email }));
  if (bcc.length) payload.bcc = bcc;
  await brevo('/smtp/email', payload, env);
}

async function sendAutoReply(d, env) {
  const r = rows(d);
  const eventName = env.EVENT_NAME || 'カップリングパーティー';
  const note = textNl(env.AUTO_REPLY_NOTE || '参加確定のご案内は、担当者より改めてご連絡いたします。');
  const contact = textNl(env.CONTACT_INFO || '');
  const replyTo = env.REPLY_TO || list(env.NOTIFY_TO)[0];
  await brevo('/smtp/email', {
	sender: sender(env),
	to: [{ email: d.email, name: d.fullName }],
	...(replyTo ? { replyTo: { email: replyTo } } : {}),
	subject: `【${eventName}】お申し込みを受け付けました`,
	htmlContent:
	  `<p>${esc(d.fullName)} 様</p>` +
	  `<p>このたびは${esc(eventName)}にお申し込みいただき、ありがとうございます。<br>以下の内容で受け付けました。</p>` +
	  toHtmlTable(r) +
	  `<p>${nl2br(note)}</p>` +
	  `<p>当日は、年齢が確認できる本人確認書類をお持ちください。</p>` +
	  (contact ? `<hr><p style="font-size:13px">${nl2br(contact)}</p>` : '') +
	  `<p style="color:#888;font-size:12px">本メールは送信専用アドレスから自動でお送りしています。お心当たりのない場合はお手数ですが破棄してください。</p>`,
	textContent:
	  `${d.fullName} 様\n\nこのたびは${eventName}にお申し込みいただき、ありがとうございます。\n以下の内容で受け付けました。\n\n${toText(r)}\n\n${note}\n当日は、年齢が確認できる本人確認書類をお持ちください。\n\n${contact ? '――――――――――\n' + contact + '\n\n' : ''}本メールは自動でお送りしています。お心当たりのない場合は破棄してください。`,
	tags: ['couple-party', 'auto-reply'],
  }, env);
}

/* ---------------- util ---------------- */

function list(s) {
  return String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
}
function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' } });
}
