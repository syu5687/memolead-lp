/**
 * @version v0002 | 2026-08-07 | メモリード福岡 おせち・クリスマス2026 申込フォーム送信Worker | Cloudflare Workers
 *
 * 既存フォームWorker（photo-wedding-form 等）と同じ構成。
 * 秘密情報は BREVO_API_KEY（Workerシークレット）のみ。通知先・送信元はこのCONFIGで管理。
 *   設定: npx wrangler secret put BREVO_API_KEY
 */

var CONFIG = {
  // 注文通知の宛先（担当者）。全施設まとめてこちらに届きます
  TO: "mk@emanet.jp",
  // CC（管理者・複数可）
  CC: [],
  // 送信元（★ Brevoで nfz33.com を認証済み。他ドメインを使う場合は認証してから）
  FROM_NAME: "メモリード福岡",
  FROM_EMAIL: "noreply@nfz33.com",
  // 件名の頭につける識別子
  SUBJECT_PREFIX: "【おせち申込】",
  // 受付を許可するオリジン（このフォーム設置元のみ受付＝不正利用防止）
  ALLOWED_ORIGINS: [
    "https://memolead-lp-665477084949.asia-northeast1.run.app"
    // 独自ドメインで公開する場合はここに追記
  ],
  // お客様への自動返信（受付確認メール）を送る
  AUTO_REPLY: true,
  AUTO_REPLY_SUBJECT: "【メモリード福岡】ご注文を承りました",
  // Brevoコンタクトへ登録する場合はリストIDを指定（不要なら null）
  BREVO_LIST_ID: null
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

    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...cors } });

    try {
      if (!env.BREVO_API_KEY) return json({ ok: false, error: "BREVO_API_KEY 未設定" }, 500);
      const d = await request.json();
      for (const k of ["name", "email", "tel", "address", "facility"]) {
        if (!d[k]) return json({ ok: false, error: `missing ${k}` }, 400);
      }

      const esc = (s) => String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
      const summaryHtml = esc(d.summary || "").replace(/\n/g, "<br>");
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
          <div style="background:#f6f2ea;border:1px solid #d8cdb9;border-radius:8px;padding:14px;font-size:14px;white-space:pre-wrap;">${summaryHtml}</div>
          ${d.note ? `<h3 style="margin-top:18px;color:#7c1f2a;">ご要望・備考</h3><div style="font-size:14px;">${esc(d.note).replace(/\n/g, "<br>")}</div>` : ""}
          <p style="margin-top:20px;font-size:12px;color:#aaa;">送信元：おせち・クリスマス2026 ご注文フォーム</p>
        </div>`;

      const adminBody = {
        sender,
        to: [{ email: CONFIG.TO }],
        subject: `${CONFIG.SUBJECT_PREFIX}${esc(d.facility)}／${esc(d.name)}様${d.total ? `（¥${Number(d.total).toLocaleString("ja-JP")}）` : ""}`,
        htmlContent: adminHtml,
        replyTo: { email: d.email, name: d.name }
      };
      if (CONFIG.CC.length) adminBody.cc = CONFIG.CC.map((e) => ({ email: e }));

      const adminRes = await fetch(BREVO_EMAIL, {
        method: "POST",
        headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", "accept": "application/json" },
        body: JSON.stringify(adminBody)
      });
      const adminResult = await adminRes.json().catch(() => ({}));

      // お客様への受付確認（自動返信）
      let autoReplyOk = null;
      if (CONFIG.AUTO_REPLY) {
        const custHtml = `
          <div style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:20px;color:#222;line-height:1.8;">
            <p>${esc(d.name)} 様</p>
            <p>この度はご注文いただきありがとうございます。<br>以下の内容でお申し込みを承りました。担当者より改めてご連絡いたします。</p>
            <div style="background:#f6f2ea;border:1px solid #d8cdb9;border-radius:8px;padding:14px;font-size:14px;white-space:pre-wrap;">${summaryHtml}</div>
            <p style="margin-top:16px;font-size:13px;color:#777;">※本メールは送信専用です。ご不明点は各施設までお問い合わせください。<br>株式会社メモリード ／ 福岡</p>
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

      return json({ ok: adminRes.ok, autoReply: autoReplyOk, ...adminResult }, adminRes.ok ? 200 : 500);
    } catch (e) {
      return json({ ok: false, error: e.message }, 500);
    }
  }
};
