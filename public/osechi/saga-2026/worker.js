/**
 * @version v0011 | 2026-09-16 | メモリード佐賀 おせち・クリスマス2026 申込フォーム送信Worker | Cloudflare Workers
 *
 * 既存フォームWorker（photo-wedding-form 等）と同じ構成。
 * 秘密情報は BREVO_API_KEY（Workerシークレット）のみ。通知先・送信元はこのCONFIGで管理。
 *   設定: npx wrangler secret put BREVO_API_KEY
 */

var CONFIG = {
  ACCEPTING_ORDERS: true,
  // 施設を判定できない注文の通知先（通知漏れ防止）
  TO: ["higashijima-masa@memolead.co.jp", "kawakami-toru@memolead.co.jp", "doi-yuu@memolead.co.jp"],
  // CC（管理者・複数可）
  CC: ["mk@emanet.jp"],
  // 施設ごとの注文通知先（該当施設の注文がある場合、その施設グループへ同じ内容を送信）
  FACILITY_EMAILS: { saga: ["higashijima-masa@memolead.co.jp", "kawakami-toru@memolead.co.jp", "doi-yuu@memolead.co.jp"] },
  // BCC（他の受信者に知られず通知・複数可）
  BCC: [],
  // 送信元（★ Brevoで nfz33.com を認証済み。他ドメインを使う場合は認証してから）
  FROM_NAME: "メモリード佐賀",
  FROM_EMAIL: "noreply@nfz33.com",
  // 件名の頭につける識別子
  SUBJECT_PREFIX: "【佐賀・おせち申込】",
  // 受付を許可するオリジン（このフォーム設置元のみ受付＝不正利用防止）
  ALLOWED_ORIGINS: [
    "https://memolead-lp-665477084949.asia-northeast1.run.app"
    // 独自ドメインで公開する場合はここに追記
  ],
  // お客様への自動返信（受付確認メール）を送る
  AUTO_REPLY: true,
  AUTO_REPLY_SUBJECT: "【メモリード佐賀】ご注文を承りました",
  // Brevoコンタクトへ登録する場合はリストIDを指定（不要なら null）
  BREVO_LIST_ID: null,
  // 毎日の稼働確認メール（Cron Trigger）の宛先・件名
  MONITOR_TO: "mk@emanet.jp",
  MONITOR_SUBJECT: "【自動稼働確認】おせち申込フォーム 正常稼働中",
  // 稼働確認メールに記載するフォームのURL
  FORM_URL: "https://memolead-lp-665477084949.asia-northeast1.run.app/public/osechi/saga-2026/"
};

var BREVO_EMAIL = "https://api.brevo.com/v3/smtp/email";
var BREVO_CONTACT = "https://api.brevo.com/v3/contacts";

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowOrigin = CONFIG.ALLOWED_ORIGINS.includes(origin) ? origin : CONFIG.ALLOWED_ORIGINS[0];
    const cors = {
      "Access-Control-Allow-Origin": allowOrigin,
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Vary": "Origin"
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    const url = new URL(request.url);
    if (url.pathname.startsWith("/admin/")) return handleAdmin(request, env, cors, url);
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...cors } });

    if (!CONFIG.ACCEPTING_ORDERS) return json({ok:false,error:"佐賀版は受付準備中です"},503);
    try {
      if (!env.BREVO_API_KEY) return json({ ok: false, error: "BREVO_API_KEY 未設定" }, 500);
      const d = await request.json();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email || '')) return json({ok:false,error:'メールアドレスをご確認ください'},400);
      if (!Array.isArray(d.orders) || !d.orders.length || d.orders.some(o=>o.facilityId!=='saga')) return json({ok:false,error:'佐賀版の注文内容をご確認ください'},400);
      for (const k of ["name", "email", "tel", "address", "facility"]) {
        if (!d[k]) return json({ ok: false, error: `missing ${k}` }, 400);
      }

      // 価格は送信値を信用せず、佐賀版の受付時刻と商品番号から再計算する。
      const earlyOrder = Date.now() < Date.parse("2026-10-31T20:01:00+09:00");
      const requestedTier = d.tier === "special" ? "special" : "general";
      const priceOf = (no) => {
        if (Number(no) === 1) return earlyOrder ? { unit: 33000, tax: 2444 } : requestedTier === "special" ? { unit: 35000, tax: 2592 } : { unit: 37000, tax: 2740 };
        return ({ 2: { unit: 22000, tax: 1629 }, 3: { unit: 15000, tax: 1111 }, 4: { unit: 12000, tax: 888 } })[Number(no)];
      };
      d.tier = earlyOrder ? "early" : requestedTier;
      d.tierLabel = earlyOrder ? "早期購入価格（一般・会員共通）" : requestedTier === "special" ? "特別価格（メモリード会員）" : "一般価格";
      let checkedTotal = 0, checkedTax = 0;
      for (const order of d.orders) {
        order.subtotal = 0; order.subtax = 0; order.fee = 0;
        for (const item of order.items || []) {
          const price = priceOf(item.no);
          if (!price) return json({ ok: false, error: "商品内容をご確認ください" }, 400);
          item.qty = Math.max(1, Math.min(10, Number(item.qty) || 1));
          item.unit = price.unit; item.tax = price.tax;
          item.line = price.unit * item.qty; item.lineTax = price.tax * item.qty;
          order.subtotal += item.line; order.subtax += item.lineTax;
        }
        checkedTotal += order.subtotal; checkedTax += order.subtax;
      }
      d.total = checkedTotal; d.totalTax = checkedTax;

      const esc = (s) => String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
      const escUrl = (u) => String(u ?? "").replace(/&/g, "&amp;").replace(/"/g, "%22");
      const yen = (n) => "¥" + Number(n || 0).toLocaleString("ja-JP");
      const orderId = crypto.randomUUID();
      if (env.DB) {
        await env.DB.prepare(`INSERT INTO saga_orders (id, created_at, name, zip, address, tel, email, facility_id, facility, tier, total, total_tax, note, orders_json, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(orderId, new Date().toISOString(), d.name, d.zip || "", d.address, d.tel, d.email, d.facilityId || "", d.facility, d.tierLabel || "", Number(d.total || 0), Number(d.totalTax || 0), d.note || "", JSON.stringify(d.orders || []), "未対応")
          .run();
      }
      // 申込データ（明細）から整形。受取場所の住所テキスト自体をGoogleマップのリンクにする
      const summaryHtml = esc(d.summary || "").replace(/\n/g, "<br>");
      const orderBlock = renderOrders(d, esc, escUrl, yen)
        || `<div style="background:#f6f2ea;border:1px solid #d8cdb9;border-radius:8px;padding:14px;font-size:14px;white-space:pre-wrap;">${summaryHtml}</div>`;
      const sender = { name: CONFIG.FROM_NAME, email: CONFIG.FROM_EMAIL };

      // 担当者宛
      const adminHtml = `
        <div style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:20px;color:#222;">
          <h2 style="color:#7c1f2a;border-bottom:2px solid #7c1f2a;padding-bottom:8px;">おせち／クリスマス ご注文</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:12px;">
            <tr><th style="text-align:left;padding:6px 12px;color:#888;width:32%;">お名前</th><td style="padding:6px 12px;font-weight:bold;">${esc(d.name)}</td></tr>
            <tr><th style="text-align:left;padding:6px 12px;color:#888;">郵便番号</th><td style="padding:6px 12px;">${esc(d.zip)}</td></tr>
            <tr><th style="text-align:left;padding:6px 12px;color:#888;">ご住所</th><td style="padding:6px 12px;">${esc(d.address)}</td></tr>
            <tr><th style="text-align:left;padding:6px 12px;color:#888;">電話</th><td style="padding:6px 12px;">${esc(d.tel)}</td></tr>
            <tr><th style="text-align:left;padding:6px 12px;color:#888;">メール</th><td style="padding:6px 12px;">${esc(d.email)}</td></tr>
          </table>
          <h3 style="margin-top:20px;color:#7c1f2a;">ご注文内容</h3>
          ${orderBlock}
          ${d.note ? `<h3 style="margin-top:18px;color:#7c1f2a;">ご要望・備考</h3><div style="font-size:14px;">${esc(d.note).replace(/\n/g, "<br>")}</div>` : ""}
          <p style="margin-top:20px;font-size:12px;color:#aaa;">送信元：<a href="${CONFIG.FORM_URL}">佐賀 おせち・クリスマス2026 ご注文フォーム</a></p>
        </div>`;

      const facilityIds = [...new Set((d.orders || []).map(o => o.facilityId).filter(Boolean))];
      const facilityTargets = facilityIds.flatMap(id => CONFIG.FACILITY_EMAILS[id] || []);
      const targets = [...new Set(facilityTargets.length ? facilityTargets : CONFIG.TO)];
      // 一括送信にして、管理者へのCCが担当者の人数分重複しないようにする。
      const adminResults = [await (async () => {
        const adminBody = {
          sender,
          to: targets.map(email => ({ email })),
          subject: `${CONFIG.SUBJECT_PREFIX}${esc(d.facility)}／${esc(d.name)}様${d.total ? `（¥${Number(d.total).toLocaleString("ja-JP")}）` : ""}`,
          htmlContent: adminHtml,
          replyTo: { email: d.email, name: d.name }
        };
        const cc = [...new Set(CONFIG.CC)].filter(email => !targets.includes(email));
        if (cc.length) adminBody.cc = cc.map(email => ({ email }));
        if (CONFIG.BCC.length) adminBody.bcc = CONFIG.BCC.map((e) => ({ email: e }));
        const res = await fetch(BREVO_EMAIL, { method: "POST", headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", "accept": "application/json" }, body: JSON.stringify(adminBody) });
        return { ok: res.ok, result: await res.json().catch(() => ({})) };
      })()];
      const adminOk = adminResults.every(r => r.ok);
      const adminResult = adminResults.find(r => !r.ok)?.result || adminResults[0]?.result || {};

      // お客様への受付確認（自動返信）
      let autoReplyOk = null;
      if (CONFIG.AUTO_REPLY) {
        const custHtml = `
          <div style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:20px;color:#222;line-height:1.8;">
            <p>${esc(d.name)} 様</p>
            <p>この度はご注文いただきありがとうございます。<br>以下の内容でお申し込みを承りました。担当者より改めてご連絡いたします。</p>
            ${orderBlock}
            <p style="margin-top:16px;font-size:13px;color:#777;">※このメールは自動送信用メールアドレスです。返信はできません。<br>ご不明点は各施設までお問い合わせください。<br>株式会社メモリード ／ 佐賀<br><a href="${CONFIG.FORM_URL}">送信元フォーム</a></p>
          </div>`;
        const crRes = await fetch(BREVO_EMAIL, {
          method: "POST",
          headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", "accept": "application/json" },
          body: JSON.stringify({ sender, to: [{ email: d.email, name: d.name }], subject: CONFIG.AUTO_REPLY_SUBJECT, htmlContent: custHtml })
        });
        autoReplyOk = crRes.ok;
      }

      // Brevoコンタクト登録（任意）
      if (CONFIG.BREVO_LIST_ID) {
        await fetch(BREVO_CONTACT, {
          method: "POST",
          headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", "accept": "application/json" },
          body: JSON.stringify({
            email: d.email,
            attributes: { NOM: d.name, SMS: d.tel, ADDRESS: d.address, ZIP: d.zip, FACILITY: d.facility },
            listIds: [Number(CONFIG.BREVO_LIST_ID)],
            updateEnabled: true
          })
        });
      }

      return json({ ok: adminOk, orderId, autoReply: autoReplyOk, ...adminResult }, adminOk ? 200 : 500);
    } catch (e) {
      return json({ ok: false, error: e.message }, 500);
    }
  },


};

// 申込データ(d.orders)から注文明細HTMLを生成。受取場所の住所を地図リンクにする。
// d.orders が無い場合は null を返す（呼び出し側で summary テキストにフォールバック）。
function renderOrders(d, esc, escUrl, yen) {
  if (!Array.isArray(d.orders) || !d.orders.length) return null;
  let h = `<div style="font-size:13px;color:#666;margin:0 0 10px;">価格区分：${esc(d.tierLabel || "")}</div>`;
  d.orders.forEach((o) => {
    h += `<div style="margin:0 0 14px;padding:12px 14px;background:#f6f2ea;border:1px solid #d8cdb9;border-radius:8px;">`;
    h += `<div style="font-weight:bold;color:#7c1f2a;margin-bottom:6px;">■ ${esc(o.category)}</div>`;
    (o.items || []).forEach((it) => {
      h += `<div style="font-size:14px;padding:2px 0;">${esc(it.no)}. ${esc(it.name)} … ${it.qty}個 × ${yen(it.unit)} = <b>${yen(it.line)}</b> <span style="color:#999;font-size:12px;">（内消費税 ${yen(it.lineTax)}）</span></div>`;
    });
    h += `<div style="font-size:13px;margin-top:8px;">受け取り方法：${esc(o.method || "")}</div>`;
    const isDelivery = o.method === "佐賀県内配達" || o.pickup === "（ご住所へ配達）";
    if (isDelivery) {
      h += `<div style="font-size:13px;">受取場所：ご住所へ配達</div>`;
    } else {
      const label = `${esc(o.pickup)}${o.pickupAddr ? `（${esc(o.pickupAddr)}）` : ""}`;
      h += o.pickupMap
        ? `<div style="font-size:13px;">受取場所：<a href="${escUrl(o.pickupMap)}" target="_blank" rel="noopener" style="color:#7c1f2a;font-weight:bold;text-decoration:underline;">${label}</a></div>`
        : `<div style="font-size:13px;">受取場所：${label}</div>`;
    }
    h += `<div style="font-size:13px;">受取希望日：${esc(o.pickdate || "")}</div>`;
    if (o.fee > 0) h += `<div style="font-size:13px;">配達料：${yen(o.fee)}</div>`;
    h += `<div style="font-size:13px;margin-top:4px;">小計：<b>${yen((o.subtotal || 0) + (o.fee || 0))}</b> <span style="color:#999;font-size:12px;">（内消費税 ${yen(o.subtax || 0)}）</span></div>`;
    h += `</div>`;
  });
  h += `<div style="text-align:right;font-size:16px;font-weight:bold;color:#7c1f2a;margin-top:8px;">合計金額（税込）：${yen(d.total)} <span style="font-size:12px;color:#999;font-weight:normal;">（内消費税 ${yen(d.totalTax)}）</span></div>`;
  return h;
}

async function handleAdmin(request, env, cors, url) {
  const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...cors } });
  if (!env.ADMIN_PASSWORD || !isAdminAuthorized(request, env.ADMIN_PASSWORD)) return json({ ok: false, error: "管理画面の認証が必要です" }, 401);
  if (!env.DB) return json({ ok: false, error: "管理画面のデータベースが未設定です" }, 503);
  try {
    if (request.method === "GET" && url.pathname === "/admin/orders") {
      const result = await env.DB.prepare("SELECT id, created_at, name, zip, address, tel, email, facility_id, facility, tier, total, total_tax, note, orders_json, status FROM saga_orders ORDER BY created_at DESC LIMIT 1000").all();
      const orders = (result.results || []).map(row => ({ ...row, orders: JSON.parse(row.orders_json || "[]") }));
      return json({ ok: true, orders });
    }
    const match = url.pathname.match(/^\/admin\/orders\/([^/]+)\/status$/);
    if (request.method === "POST" && match) {
      const body = await request.json();
      if (!["未対応", "確認済み", "完了"].includes(body.status)) return json({ ok: false, error: "不正な対応状況です" }, 400);
      await env.DB.prepare("UPDATE saga_orders SET status = ? WHERE id = ?").bind(body.status, decodeURIComponent(match[1])).run();
      return json({ ok: true });
    }
    const deleteMatch = url.pathname.match(/^\/admin\/orders\/([^/]+)$/);
    if (request.method === "DELETE" && deleteMatch) {
      await env.DB.prepare("DELETE FROM saga_orders WHERE id = ?").bind(decodeURIComponent(deleteMatch[1])).run();
      return json({ ok: true });
    }
    return json({ ok: false, error: "Not found" }, 404);
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}

function isAdminAuthorized(request, password) {
  const header = request.headers.get("Authorization") || "";
  if (!header.startsWith("Basic ")) return false;
  try {
    const decoded = atob(header.slice(6));
    const separator = decoded.indexOf(":");
    return separator >= 0 && decoded.slice(0, separator) === "admin" && decoded.slice(separator + 1) === password;
  } catch (_) {
    return false;
  }
}
