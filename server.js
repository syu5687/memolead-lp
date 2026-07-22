import express from "express";
import { CATEGORIES, CATEGORY_MAP } from "./categories.js";

const app = express();
app.use(express.json());
app.use(express.static("public"));

// CORS: LPを別ドメイン(Firebase Hosting等)に置いてもフォーム送信できるようにする
app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// --- フォームがドロップダウンを組み立てるための一覧(keyとlabelだけ返す。宛先は返さない) ---
app.get("/api/categories", (req, res) => {
  res.json(CATEGORIES.map(({ key, label }) => ({ key, label })));
});

// --- フォーム送信の受け口 ---
app.post("/api/notify", async (req, res) => {
  const { category, name, email, phone, message } = req.body ?? {};

  // 入力チェック
  const target = CATEGORY_MAP.get(category);
  if (!target) {
    return res.status(400).json({ ok: false, error: "カテゴリの選択が不正です。" });
  }
  if (!name || !email || !phone || !message) {
    return res.status(400).json({ ok: false, error: "お名前・メール・連絡先・本文は必須です。" });
  }

  // Brevo(トランザクションメール)へ送信
  try {
    const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          email: process.env.SENDER_EMAIL,
          name: process.env.SENDER_NAME || "お問い合わせフォーム",
        },
        // ★ ここが肝: 選択された式場に応じて宛先が変わる(複数宛先は全員に同時送信)
        to: (Array.isArray(target.to) ? target.to : [target.to]).map((email) => ({ email })),
        replyTo: { email, name },
        subject: `【${target.label}】${name} 様からのお問い合わせ`,
        htmlContent: `
          <h2>フォームからのお問い合わせ</h2>
          <p><strong>カテゴリ:</strong> ${escapeHtml(target.label)}</p>
          <p><strong>お名前:</strong> ${escapeHtml(name)}</p>
          <p><strong>メール:</strong> ${escapeHtml(email)}</p>
          <p><strong>連絡先:</strong> ${escapeHtml(phone)}</p>
          <p><strong>本文:</strong></p>
          <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
        `,
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      console.error("Brevo error:", resp.status, detail);
      return res.status(502).json({ ok: false, error: "メール送信に失敗しました。" });
    }

    return res.json({ ok: true, sentTo: target.label });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "サーバーエラーが発生しました。" });
  }
});

// HTMLインジェクション対策
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`listening on :${port}`));
