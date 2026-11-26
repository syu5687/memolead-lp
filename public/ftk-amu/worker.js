/**
 * @version v0001 | 2026-11-26 | アミュプラザくまもと リニューアルキャンペーン 応募フォーム送信Worker | Cloudflare Workers
 *
 * 既存フォームWorker（bridal-ring 等）と同じ構成。
 * フォーム(HTML)からのJSONを受け取り、Brevoで
 *   ①（任意）応募者リストへ登録 ②担当者へ通知。
 * 応募フォームでメールアドレスを聞かないため、自動返信は送らない。
 * さらに毎日1回、稼働確認メールを送る(Cron Trigger)。
 *
 * 秘密情報は BREVO_API_KEY のみ： npx wrangler secret put BREVO_API_KEY
 * 通知先・送信元・文言はこの CONFIG で管理（vars 不要）。
 */

var CONFIG = {
  // 管理者への通知先（全員に同じ通知が届く。互いのアドレスが見える宛先=To）
  TO: [
    "mk@emanet.jp"                        // ★ 会場の担当者アドレスを追記
  ],
  CC: [],                                 // CC（複数可）
  BCC: [],                                // BCC（複数可）
  FROM_NAME: "ザ・フォレストテラス熊本",
  FROM_EMAIL: "noreply@nfz33.com",        // ★ Brevo認証済みドメインのアドレス
  SUBJECT_PREFIX: "【AMUキャンペーン応募】",
  ALLOWED_ORIGINS: [                      // 受付を許可するオリジン（設置元のみ）
    "https://memolead-lp-665477084949.asia-northeast1.run.app"
    // 独自ドメインで公開する場合はここに追記
  ],
  // 応募プレゼント（フォームの value → メール・リストに出す表示名）。ここにない value は受け付けない。
  PLANS: {
    wedding: "前撮り or ロケーションフォト付き 結婚式プレゼント",
    public: "アミュひろばでの公開挙式プレゼント（1組限定）",
    both: "両方に応募する"
  },
  // 抽選用にBrevoのリストへ貯める場合のみ、プレゼントごとのリストID（数字）を指定（不要なら null）
  // 「両方に応募する」は両方のリストに入る。ショッピングチケットは全応募者が対象なので2つのリストの合算で抽選する。
  BREVO_LISTS: { wedding: null, public: null },
  MONITOR_TO: "mk@emanet.jp",          // 毎日の稼働確認メール宛先（管理側のみ。お店には送らない）
  MONITOR_SUBJECT: "【自動稼働確認】AMUキャンペーン 応募フォーム 正常稼働中",
  FORM_NAME: "アミュプラザくまもと リニューアルキャンペーン 応募フォーム",
  FORM_URL: "https://memolead-lp-665477084949.asia-northeast1.run.app/public/ftk-amu/",
  // メール本文に必ず出す基本項目（キー: 表示ラベル）。フォームから送る JSON のキーに合わせる。
  FIELDS: { entryAt: "応募日時", planLabel: "応募プレゼント", name: "お名前", tel: "電話番号" },
  REQUIRED: ["plan", "name", "tel", "agree"]                      // 最低限の必須チェック
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

      // 画面のチェックを通らずに直接送られる場合に備え、サーバー側でも値を確かめる
      const planLabel = CONFIG.PLANS[d.plan];
      if (!planLabel) return json({ ok: false, error: "invalid plan" }, 400);
      // 全角数字→半角、ハイフン等を除去（例：「０９０-１２３４-５６７８」→「09012345678」）
      const tel = String(d.tel).replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/[^\d]/g, "");
      if (!/^0\d{9,10}$/.test(tel)) return json({ ok: false, error: "invalid tel" }, 400);
      const name = String(d.name).trim().slice(0, 50);
      const entryAt = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
      const v = { entryAt, planLabel, name, tel };

      const esc = (s) => String(s ?? "").replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));
      const sender = { name: CONFIG.FROM_NAME, email: CONFIG.FROM_EMAIL };
      const headers = { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", "accept": "application/json" };

      // ① 抽選用リストへ登録（リストIDを設定したときだけ）。
      //    メールアドレスがないので、電話番号（SMS属性・国番号付き）で登録する。同じ番号の再応募は上書き＝1組1件。
      const listIds = (d.plan === "both" ? ["wedding", "public"] : [d.plan])
        .map((p) => CONFIG.BREVO_LISTS[p]).filter(Boolean).map(Number);
      let listOk = null;
      if (listIds.length) {
        const cr = await fetch(BREVO_CONTACT, { method: "POST", headers, body: JSON.stringify({ attributes: { NOM: name, SMS: "+81" + tel.slice(1) }, listIds, updateEnabled: true }) });
        listOk = cr.ok;
        if (!cr.ok) console.error("Brevo contact error", cr.status, await cr.text());
      }

      // ② 担当者へ通知。リスト登録に失敗したときは件名と本文で分かるようにする（通知メールが応募の控えになる）
      let rows = "";
      for (const [k, label] of Object.entries(CONFIG.FIELDS)) {
        if (v[k]) rows += `<tr><th style="text-align:left;padding:6px 12px;color:#888;width:32%;">${esc(label)}</th><td style="padding:6px 12px;${k === "name" ? "font-weight:bold;" : ""}">${k === "tel" ? `<a href="tel:${esc(tel)}">${esc(tel)}</a>` : esc(v[k])}</td></tr>`;
      }
      const listNote = listOk === false
        ? `<p style="margin-top:14px;padding:10px 14px;background:#fbeaea;color:#a11;font-size:14px;">※Brevoリストへの登録に失敗しました。この応募は手動で控えてください。</p>`
        : "";
      // 送信元フォーム（どのフォームからの申込かを判別）。生URLは出さずアンカー化。
      const srcAdmin = d.source
        ? `<p style="margin-top:22px;padding-top:12px;border-top:1px solid #e5ddcd;font-size:13px;color:#555;">送信元フォーム：<a href="${esc(d.source)}" style="color:#b5121b;">${esc(d.formName || d.source)}</a></p>`
        : "";

      const adminHtml = `
        <div style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:20px;color:#222;">
          <h2 style="color:#b5121b;border-bottom:2px solid #b5121b;padding-bottom:8px;">キャンペーン応募を受信しました</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:12px;">${rows}</table>
          ${listNote}
          <p style="margin-top:14px;font-size:13px;color:#555;">当選のご連絡は、上記の電話番号へお願いします。</p>
          ${srcAdmin}
        </div>`;

      const adminBody = {
        sender, to: [].concat(CONFIG.TO).map((e) => ({ email: e })),
        // 件名はテキストなのでエスケープ不要。改行だけ取り除いて件名崩れを防ぐ
        subject: `${CONFIG.SUBJECT_PREFIX}${name.replace(/[\r\n]/g, " ")}様／${planLabel}${listOk === false ? "（※リスト登録失敗）" : ""}`,
        htmlContent: adminHtml
      };
      if (CONFIG.CC.length) adminBody.cc = CONFIG.CC.map((e) => ({ email: e }));
      if (CONFIG.BCC.length) adminBody.bcc = CONFIG.BCC.map((e) => ({ email: e }));

      const adminRes = await fetch(BREVO_EMAIL, { method: "POST", headers, body: JSON.stringify(adminBody) });
      const adminResult = await adminRes.json().catch(() => ({}));

      // 通知メールかリスト登録のどちらかが成功していれば、応募は受け付けられている
      const ok = adminRes.ok || listOk === true;
      return json({ ok, list: listOk, ...adminResult }, ok ? 200 : 500);
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
      ? `<p style="font-size:13px;color:#555;">対象フォーム：<a href="${escM(CONFIG.FORM_URL)}" style="color:#b5121b;">${escM(CONFIG.FORM_NAME || CONFIG.FORM_URL)}</a></p>`
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
