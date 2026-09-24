# 2026-09-24 ブライダルリング申込フォーム：Brevo APIキーの登録手順

対象Worker：`memolead-bridal-ring`（フォルダ `D:\__github_win\memolead-lp\push\memolead-lp\public\bridal-ring`）

## 方法A：PowerShell（推奨）
```powershell
cd D:\__github_win\memolead-lp\push\memolead-lp\public\bridal-ring
npx wrangler whoami          # 未ログインなら → npx wrangler login（ブラウザで許可）
npx wrangler deploy          # 初回：Worker を作成
npx wrangler secret put BREVO_API_KEY
```
- 最後のコマンドで `Enter a secret value:` と出たら、APIキーを貼り付けて Enter（画面には表示されない）
- `Success! Uploaded secret BREVO_API_KEY` が出れば完了
- deploy より先に secret put を実行すると「Worker を作成しますか」と聞かれる。その場合は y で進めてよい

## 方法B：Cloudflare 管理画面
1. dash.cloudflare.com → Workers & Pages → `memolead-bridal-ring`（先に方法Aの `npx wrangler deploy` が必要）
2. 設定（Settings）→ 変数とシークレット（Variables and Secrets）→ 追加
3. 種類：シークレット／名前：`BREVO_API_KEY`／値：APIキー → デプロイ

## APIキーの入手
- 既存フォーム（おせち等）と同じキーでよい
- Cloudflare に登録済みのシークレットは後から中身を見られない。手元に保存していない場合は Brevo で新しく発行する
  - Brevo → 右上アカウント → SMTP & API → API キー → 新しいAPIキーを作成（名前例：memolead-bridal-ring）→ 表示されたキーを控える
  - 新しく発行しても既存キーは無効にならない（既存フォームへの影響なし）
- Brevo の「承認済みIP」制限を有効にしている場合は送信が弾かれる。既存フォームが動いていれば設定は問題なし

## 登録後の確認（PowerShell）
```powershell
npx wrangler secret list      # BREVO_API_KEY が出ればOK
```
送信テスト（`curl.exe` を使用）：
```powershell
'{"name":"テスト 太郎","zip":"8400000","address":"佐賀市","tel":"0952-00-0000","email":"mk@emanet.jp","slots":"2026年10月4日（日） 13:00〜14:00","weddingPlan":"未定","note":"テスト","formName":"ブライダルリング 申込フォーム","source":"https://memolead-lp-665477084949.asia-northeast1.run.app/public/bridal-ring/"}' | Out-File -Encoding utf8NoBOM ring.json
curl.exe -i -X POST https://memolead-bridal-ring.mk-cbe.workers.dev/submit -H "Content-Type: application/json" -H "Origin: https://memolead-lp-665477084949.asia-northeast1.run.app" --data-binary "@ring.json"
```
- `{"ok":true,"autoReply":true,...}` → 通知メールと自動返信が mk@emanet.jp に届く（迷惑メールも確認）
- `BREVO_API_KEY 未設定` → secret が入っていない
- `401` / `unauthorized` → キーの貼り間違い。secret put をやり直す
- PowerShell 5.1 で `utf8NoBOM` がエラーになる場合は、メモ帳で ring.json を「UTF-8」で保存して代用
