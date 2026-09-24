# 2026-09-24 指輪＆結婚相談会フォーム 短縮URL

## 結論
Cloudflare Worker `ring` を1本作り、短いURL → 申込フォームへ転送する。
- https://ring.mk-cbe.workers.dev → フォーム
- 媒体別（GA4で流入元を区別）：`/sns`・`/line`・`/qr`
- 置き場所：`public/bridal-ring/shortlink/`（worker.js・wrangler.toml）

## 選択肢の比較
| 案 | URL例 | 長所 | 注意点 |
|---|---|---|---|
| A. Worker（workers.dev） | ring.mk-cbe.workers.dev | 今すぐ・無料・媒体別計測可 | 「workers.dev」は一般の方に見慣れない |
| B. Worker＋独自ドメイン | ring.〇〇.com | 信頼感が高い・短い | 対象ドメインが Cloudflare 管理下であることが必要（未確認） |
| C. bit.ly 等 | bit.ly/xxxx | 手軽 | 外部サービス依存・無料版は計測/編集に制限 |
→ A を今すぐ使い、独自ドメインが決まれば B に切り替え（同じ Worker に Custom Domain を追加するだけ）。

## デプロイ（PowerShell）
```powershell
cd D:\__github_win\memolead-lp\push\memolead-lp\public\bridal-ring\shortlink
npx.cmd wrangler deploy
```
`https://ring.mk-cbe.workers.dev` が表示されれば完了。

## 使い分け
| 用途 | URL | GA4での見え方 |
|---|---|---|
| 汎用（口頭・メール） | ring.mk-cbe.workers.dev | 参照元なし（direct） |
| Instagram等のSNS | ring.mk-cbe.workers.dev/sns | sns / social |
| LINE配信 | ring.mk-cbe.workers.dev/line | line / social |
| チラシ・POPのQR | ring.mk-cbe.workers.dev/qr | qr / offline |
- キャンペーン名は `ring_soudankai_2610`
- 投稿ごとに分けたい時は末尾に `?utm_content=投稿名` を付けると引き継ぐ
- 未定義のパスもフォームへ転送（打ち間違い対策）

## 検証
- 5パターン（/・/sns・/line/・/qr?utm_content=flyerA・/xyz）で 302 と転送先を確認済み

## 独自ドメインにする場合（B）
Cloudflare → Workers & Pages → ring → 設定 → ドメインとルート → カスタムドメインを追加（例 ring.〇〇.com）。DNS は自動作成。使うドメインの確認が必要。
