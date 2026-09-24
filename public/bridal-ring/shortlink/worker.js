/**
 * @version v0001 | 2026-09-24 | 指輪＆結婚相談会 短縮URL（リダイレクト）Worker | Cloudflare Workers
 *
 * 短いURL → 申込フォームへ 302 転送。
 *   https://ring.mk-cbe.workers.dev/       → フォーム
 *   https://ring.mk-cbe.workers.dev/sns    → フォーム（utm: SNS）
 *   https://ring.mk-cbe.workers.dev/line   → フォーム（utm: LINE）
 *   https://ring.mk-cbe.workers.dev/qr     → フォーム（utm: チラシ等のQR）
 * 独自ドメイン（例 ring.〇〇.com）を付けても同じ動きになる。
 * 302（一時転送）にしているので、転送先を後から変えてもブラウザに古い転送が残らない。
 */
const TARGET = "https://memolead-lp-665477084949.asia-northeast1.run.app/public/bridal-ring/";
const CAMPAIGN = "ring_soudankai_2610";
const ROUTES = {
  "/":     null,
  "/sns":  { utm_source: "sns",  utm_medium: "social" },
  "/line": { utm_source: "line", utm_medium: "social" },
  "/qr":   { utm_source: "qr",   utm_medium: "offline" }
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const dest = new URL(TARGET);
    const utm = ROUTES[path];
    if (utm) {
      for (const [k, v] of Object.entries(utm)) dest.searchParams.set(k, v);
      dest.searchParams.set("utm_campaign", CAMPAIGN);
    }
    // 元URLに付いたパラメータ（例 ?utm_content=post1）は引き継ぐ
    for (const [k, v] of url.searchParams) dest.searchParams.set(k, v);
    return Response.redirect(dest.toString(), 302);
  }
};
