/**
 * @version v0001 | 2026-08-07 | メモリード福岡 おせち・クリスマス2026 申込フォーム送信Worker | Cloudflare Workers
 *
 * 役割：フォーム(index.html)からのJSONを受け取り、Brevo経由で
 *   ① 担当者へ注文内容メールを送信
 *   ② お客様へ受付確認メールを自動返信
 *   ③ Brevoコンタクトへ登録（任意・BREVO_LIST_ID設定時）
 *
 * 必要なシークレット / 変数（wrangler secret put もしくはダッシュボードで設定）：
 *   BREVO_API_KEY   … Brevoの APIキー（v3）           ★シークレット
 *   FROM_EMAIL      … 送信元メール（Brevoで認証済ドメイン）例: info@memolead.co.jp
 *   FROM_NAME       … 送信元表示名   例: メモリード福岡
 *   TO_EMAILS       … 担当者宛先（カンマ区切り）例: mk@emanet.jp,staff1@memolead.co.jp
 *   BREVO_LIST_ID   … （任意）登録先リストID。未設定ならコンタクト登録はスキップ
 *   ALLOW_ORIGIN    … 許可オリジン 例: https://memolead-lp-665477084949.asia-northeast1.run.app
 */

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOW_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST")
      return json({ ok: false, error: "method not allowed" }, 405, cors);

    let d;
    try { d = await request.json(); } catch { return json({ ok:false, error:"bad json" }, 400, cors); }

    // 最低限のバリデーション
    for (const k of ["name","email","tel","address","facility"]) {
      if (!d[k]) return json({ ok:false, error:`missing ${k}` }, 400, cors);
    }

    const esc = (s)=>String(s??"").replace(/[<>&]/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;"}[c]));
    const summaryHtml = esc(d.summary || "").replace(/\n/g, "<br>");

    const staffHtml = `
      <div style="font-family:sans-serif;line-height:1.7;color:#222">
        <h2 style="border-bottom:2px solid #7c1f2a;padding-bottom:6px">おせち／クリスマス ご注文が届きました</h2>
        <table style="border-collapse:collapse;font-size:14px">
          <tr><td style="padding:4px 12px 4px 0;color:#777">お名前</td><td><b>${esc(d.name)}</b></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#777">郵便番号</td><td>${esc(d.zip)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#777">ご住所</td><td>${esc(d.address)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#777">電話</td><td>${esc(d.tel)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#777">メール</td><td>${esc(d.email)}</td></tr>
        </table>
        <h3 style="margin-top:20px;color:#7c1f2a">ご注文内容</h3>
        <div style="background:#f6f2ea;border:1px solid #d8cdb9;border-radius:8px;padding:14px;font-size:14px">${summaryHtml}</div>
        ${d.note ? `<h3 style="margin-top:18px;color:#7c1f2a">ご要望・備考</h3><div style="font-size:14px">${esc(d.note).replace(/\n/g,"<br>")}</div>` : ""}
      </div>`;

    const customerHtml = `
      <div style="font-family:sans-serif;line-height:1.8;color:#222">
        <p>${esc(d.name)} 様</p>
        <p>この度はご注文いただきありがとうございます。<br>以下の内容でお申し込みを承りました。担当者より改めてご連絡いたします。</p>
        <div style="background:#f6f2ea;border:1px solid #d8cdb9;border-radius:8px;padding:14px;font-size:14px;white-space:pre-wrap">${summaryHtml}</div>
        <p style="margin-top:18px;font-size:13px;color:#777">※本メールは送信専用です。ご不明点は各施設までお問い合わせください。<br>株式会社メモリード ／ 福岡</p>
      </div>`;

    const toStaff = (env.TO_EMAILS || "").split(",").map(s=>s.trim()).filter(Boolean).map(e=>({ email:e }));
    const sender = { email: env.FROM_EMAIL, name: env.FROM_NAME || "メモリード福岡" };

    try {
      // ① 担当者へ
      if (toStaff.length) {
        await sendBrevo(env, {
          sender, to: toStaff, replyTo: { email: d.email, name: d.name },
          subject: `【おせち注文】${d.facility}／${d.name}様`,
          htmlContent: staffHtml,
        });
      }
      // ② お客様へ受付確認
      await sendBrevo(env, {
        sender, to: [{ email: d.email, name: d.name }],
        subject: `【メモリード福岡】ご注文を承りました`,
        htmlContent: customerHtml,
      });
      // ③ コンタクト登録（任意）
      if (env.BREVO_LIST_ID) {
        await fetch("https://api.brevo.com/v3/contacts", {
          method: "POST",
          headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", "accept": "application/json" },
          body: JSON.stringify({
            email: d.email,
            attributes: { NOM: d.name, SMS: d.tel, ADDRESS: d.address, ZIP: d.zip, FACILITY: d.facility },
            listIds: [Number(env.BREVO_LIST_ID)],
            updateEnabled: true,
          }),
        });
      }
    } catch (err) {
      return json({ ok:false, error:"send failed", detail:String(err) }, 502, cors);
    }

    return json({ ok:true }, 200, cors);
  },
};

async function sendBrevo(env, payload) {
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", "accept": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("brevo " + r.status + " " + (await r.text()));
  return r.json();
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status, headers: { "Content-Type": "application/json", ...cors },
  });
}
