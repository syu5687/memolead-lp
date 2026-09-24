/**
 * @version v0003 | 2026-09-24 | メモリード ブライダルリング 申込フォーム送信Worker | Cloudflare Workers
 *
 * フォーム(HTML)からのJSONを受け取り、Brevoで
 *   ①担当者へ通知 ②申込者へ受付確認(自動返信) ③任意でコンタクト登録。
 * さらに毎日1回、稼働確認メールを送る(Cron Trigger)。
 *
 * 秘密情報は BREVO_API_KEY のみ： npx wrangler secret put BREVO_API_KEY
 * 通知先・送信元・文言はこの CONFIG で管理（vars 不要）。
 */

var CONFIG = {
  TO: "mk@emanet.jp",                     // 担当者宛（★会場担当の宛先が決まったら差し替え）
  CC: [],                                 // CC（複数可）
  BCC: [],                                // BCC（複数可）
  FROM_NAME: "サロン・ド・ルシェル",
  FROM_EMAIL: "noreply@nfz33.com",        // ★ Brevo認証済みドメインのアドレス
  SUBJECT_PREFIX: "【ブライダルリング申込】",
  ALLOWED_ORIGINS: [                      // 受付を許可するオリジン（設置元のみ）
    "https://memolead-lp-665477084949.asia-northeast1.run.app"
  ],
  AUTO_REPLY: true,
  // 開催会場（担当者通知・自動返信に表示。住所はGoogleマップへのリンク）
  VENUE: { name: "サロン・ド・ルシェル", address: "佐賀県佐賀市多布施2丁目15-1", tel: "0952-20-1516" },                       // 申込者への受付確認メール
  AUTO_REPLY_SUBJECT: "【サロン・ド・ルシェル】ブライダルリングのお申し込みを承りました",
  AUTO_REPLY_NOTE: "※このメールは自動送信用メールアドレスです。返信はできません。",
  BREVO_LIST_ID: null,                    // コンタクト登録する場合のみリストID
  MONITOR_TO: "mk@emanet.jp",          // 毎日の稼働確認メール宛先
  MONITOR_SUBJECT: "【自動稼働確認】ブライダルリング申込フォーム 正常稼働中",
  FORM_NAME: "ブライダルリング 申込フォーム",              // 稼働確認メール等で表示するフォーム名
  FORM_URL: "https://memolead-lp-665477084949.asia-northeast1.run.app/public/bridal-ring/", // 対象フォームURL（稼働確認メールにリンク表示）
  // メール本文に必ず出す基本項目（キー: 表示ラベル）。フォームの name 属性に合わせる。
  FIELDS: { slots: "参加希望日時", name: "氏名", zip: "郵便番号", address: "住所", tel: "電話番号", email: "メール", weddingPlan: "結婚予定", referral: "申込のきっかけ" },
  REQUIRED: ["name", "tel", "email", "slots", "weddingPlan"]             // 最低限の必須チェック
};

var BREVO_EMAIL = "https://api.brevo.com/v3/smtp/email";
var BREVO_CONTACT = "https://api.brevo.com/v3/contacts";

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowOrigin = CONFIG.ALLOWED_ORIGINS.includes(origin) ? origin : CONFIG.ALLOWED_ORIGINS[0];
    const cors = {
      "Access-Control-Allow-Origin": allowOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });
    const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json", ...cors } });

    try {
      if (!env.BREVO_API_KEY) return json({ ok: false, error: "BREVO_API_KEY 未設定" }, 500);
      const d = await request.json();
      for (const k of CONFIG.REQUIRED) if (!d[k]) return json({ ok: false, error: `missing ${k}` }, 400);

      const esc = (s) => String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
      const validEmail = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(e || ""));
      const emailOk = validEmail(d.email);   // 不正なメールでも担当者通知だけは必ず届くようにする
      const sender = { name: CONFIG.FROM_NAME, email: CONFIG.FROM_EMAIL };

      // 基本項目テーブル
      let rows = "";
      for (const [k, label] of Object.entries(CONFIG.FIELDS)) {
        if (d[k]) rows += `<tr><th style="text-align:left;padding:6px 12px;color:#888;width:32%;">${esc(label)}</th><td style="padding:6px 12px;${k === "name" ? "font-weight:bold;" : ""}">${esc(d[k]).replace(/\n/g, "<br>")}</td></tr>`;
      }
      // 明細（任意）：フォーム側が d.summary（テキスト）や d.orders（構造化）を送ってくる場合に整形
      const detail = d.summary
        ? `<div style="background:#f6f2ea;border:1px solid #d8cdb9;border-radius:8px;padding:14px;font-size:14px;white-space:pre-wrap;">${esc(d.summary).replace(/\n/g, "<br>")}</div>`
        : "";

      // 送信元フォーム（どのフォームからの申込かを判別）。生URLは出さずアンカー化。
      // フロントは d.source = location.href、任意で d.formName を送る。
      const srcAdmin = d.source
        ? `<p style="margin-top:22px;padding-top:12px;border-top:1px solid #e5ddcd;font-size:13px;color:#555;">送信元フォーム：<a href="${esc(d.source)}" style="color:#7c1f2a;">${esc(d.formName || d.source)}</a></p>`
        : "";
      const srcCust = d.source
        ? `<p style="margin-top:18px;font-size:13px;color:#777;">お申し込みページ：<a href="${esc(d.source)}" style="color:#7c1f2a;">${esc(d.formName || "こちら")}</a></p>`
        : "";

      const V = CONFIG.VENUE;
      const mapUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(V.name + " " + V.address);
      const venueHtml = `<div style="margin-top:18px;padding:14px;border:1px solid #d8cdb9;border-radius:8px;background:#f6f2ea;font-size:14px;line-height:1.8;">
        <div style="color:#7c1f2a;font-weight:bold;">会場</div>
        <div>${esc(V.name)}</div>
        <div><a href="${esc(mapUrl)}" style="color:#7c1f2a;">${esc(V.address)}</a></div>
        <div>TEL <a href="tel:${esc(V.tel.replace(/-/g, ""))}" style="color:#7c1f2a;">${esc(V.tel)}</a></div>
      </div>`;

      const adminHtml = `
        <div style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:20px;color:#222;">
          <h2 style="color:#7c1f2a;border-bottom:2px solid #7c1f2a;padding-bottom:8px;">お申し込みを受信しました</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:12px;">${rows}</table>
          ${detail ? `<h3 style="margin-top:18px;color:#7c1f2a;">内容</h3>${detail}` : ""}
          ${d.note ? `<h3 style="margin-top:18px;color:#7c1f2a;">特に当日相談したいこと</h3><div style="font-size:14px;">${esc(d.note).replace(/\n/g, "<br>")}</div>` : ""}
          ${venueHtml}
          ${srcAdmin}
        </div>`;

      const adminBody = {
        sender, to: [{ email: CONFIG.TO }],
        subject: `${CONFIG.SUBJECT_PREFIX}${esc(d.name || "")}様`,
        htmlContent: adminHtml,
        replyTo: emailOk ? { email: d.email, name: d.name } : undefined
      };
      if (CONFIG.CC.length) adminBody.cc = CONFIG.CC.map((e) => ({ email: e }));
      if (CONFIG.BCC.length) adminBody.bcc = CONFIG.BCC.map((e) => ({ email: e }));

      const adminRes = await fetch(BREVO_EMAIL, { method: "POST", headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", "accept": "application/json" }, body: JSON.stringify(adminBody) });
      const adminResult = await adminRes.json().catch(() => ({}));

      let autoReplyOk = null;
      if (CONFIG.AUTO_REPLY && emailOk) {
        const custHtml = `
          <div style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:20px;color:#222;line-height:1.8;">
            <p>${esc(d.name || "")} 様</p>
            <p>この度はブライダルリングにお申し込みいただき、ありがとうございます。<br>以下の内容で承りました。ご希望の日時につきましては、担当者より改めてご連絡いたします。</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}</table>
            ${detail}
            ${d.note ? `<p style="margin:14px 0 4px;color:#7c1f2a;font-weight:bold;">特に当日相談したいこと</p><div style="font-size:14px;">${esc(d.note).replace(/\n/g, "<br>")}</div>` : ""}
            ${venueHtml}
            <p style="margin-top:14px;font-size:14px;">ご不明な点や日時の変更は、上記お電話までご連絡ください。</p>
            ${srcCust}
            <p style="margin-top:16px;font-size:13px;color:#777;">${esc(CONFIG.AUTO_REPLY_NOTE)}</p>
          </div>`;
        const cr = await fetch(BREVO_EMAIL, { method: "POST", headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", "accept": "application/json" }, body: JSON.stringify({ sender, to: [{ email: d.email, name: d.name }], subject: CONFIG.AUTO_REPLY_SUBJECT, htmlContent: custHtml }) });
        autoReplyOk = cr.ok;
      }

      if (CONFIG.BREVO_LIST_ID && d.email) {
        await fetch(BREVO_CONTACT, { method: "POST", headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", "accept": "application/json" }, body: JSON.stringify({ email: d.email, attributes: { NOM: d.name, SMS: d.tel, ADDRESS: d.address, ZIP: d.zip }, listIds: [Number(CONFIG.BREVO_LIST_ID)], updateEnabled: true }) });
      }

      return json({ ok: adminRes.ok, autoReply: autoReplyOk, ...adminResult }, adminRes.ok ? 200 : 500);
    } catch (e) {
      return json({ ok: false, error: e.message }, 500);
    }
  },

  // 毎日の稼働確認（Cron Trigger）。届いていれば Worker＋Brevo は正常。
  async scheduled(event, env, ctx) {
    if (!env.BREVO_API_KEY) return;
    const now = new Date().toISOString();
    const escM = (s) => String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
    const formLink = CONFIG.FORM_URL
      ? `<p style="font-size:13px;color:#555;">対象フォーム：<a href="${escM(CONFIG.FORM_URL)}" style="color:#7c1f2a;">${escM(CONFIG.FORM_NAME || CONFIG.FORM_URL)}</a></p>`
      : "";
    const body = {
      sender: { name: CONFIG.FROM_NAME, email: CONFIG.FROM_EMAIL },
      to: [{ email: CONFIG.MONITOR_TO }],
      subject: CONFIG.MONITOR_SUBJECT,
      htmlContent: `<div style="font-family:sans-serif;line-height:1.8;color:#222;"><p>フォームのメール送信機能は<b>正常に稼働しています</b>。</p>${formLink}<p>この自動確認メールが毎日届いていれば正常です。届かない日があれば要確認。</p><p style="font-size:12px;color:#888;">自動送信／${now} UTC</p></div>`
    };
    ctx.waitUntil(fetch(BREVO_EMAIL, { method: "POST", headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", "accept": "application/json" }, body: JSON.stringify(body) }));
  }
};
