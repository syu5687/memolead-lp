# アミュプラザくまもと リニューアルキャンペーン LP（応募フォーム）

- @version v0001 | 2026-11-26（応募フォームの仕組みを作成。LP本体のセクションは今後追加）
- 配置先：`/public/ftk-amu/`
- 公開URL（push後）：https://memolead-lp-665477084949.asia-northeast1.run.app/public/ftk-amu/
- 構成：Cloud Run（LP設置）＋ Cloudflare Worker `memolead-ftk-amu` ＋ Brevo（担当者通知＋任意でリスト登録）

## ファイル
| ファイル | 内容 |
|---|---|
| index.html | LP本体（noindex・GTM-KG9CZ8Q4）。現在は応募フォーム部分のみ |
| _assets/index.css | LPのCSS。修正したら index.html の `index.css?v=` の値を上げる（キャッシュ対策） |
| _assets/js/script.js | LPのスクリプト（送信先 `CONFIG.ENDPOINT`・`CONFIG.PRIVACY_URL`・送信処理）。修正したら index.html の `script.js?v=` の値を上げる |
| worker.js | Brevo送信Worker（担当者通知・抽選用リスト登録・毎日の稼働確認メール） |
| wrangler.toml | Worker設定（Cron=毎日JST 9:00） |
| .htaccess | HTMLキャッシュ無効化 |

## 項目
1. 応募するプレゼント（必須・1つ選択：結婚式／公開挙式／両方）… value は `wedding` `public` `both`。表示名は `worker.js` の `CONFIG.PLANS`
2. お名前（必須）
3. 電話番号（必須）… 全角・ハイフン入りでも数字だけに整えて受付（0から始まる10〜11桁）
4. プライバシーポリシーへの同意（必須）… URLは `_assets/js/script.js` の `CONFIG.PRIVACY_URL`

メールアドレスを聞かないため、お客様への自動返信はなし。当選者には担当者から電話。

## 抽選用リスト（任意）
`worker.js` の `CONFIG.BREVO_LISTS` にBrevoのリストID（数字）を入れると、応募者を電話番号（SMS属性）で登録する。
```js
BREVO_LISTS: { wedding: 11, public: 12 }   // 両方に応募＝両方のリストに入る。null=登録しない
```
- 同じ電話番号で再応募されると上書き（1組1件）。
- ショッピングチケットは全応募者が対象なので、2つのリストを合わせて抽選する。
- 登録に失敗しても担当者通知は届き、件名に「（※リスト登録失敗）」が付く。

## Worker デプロイ（初回のみ）
```bash
cd public/ftk-amu
npx wrangler deploy
npx wrangler secret put BREVO_API_KEY   # 既存フォームと同じキー
```
通知先 `CONFIG.TO`・CC・BCC・リストIDを変えたら `npx wrangler deploy`。

## 送信テスト（ご自身のPCで）
```bash
cat > /tmp/amu.json <<'JSON'
{"plan":"both","name":"テスト 太郎","tel":"090-0000-0000","agree":true,"formName":"アミュプラザくまもと リニューアルキャンペーン 応募フォーム","source":"https://memolead-lp-665477084949.asia-northeast1.run.app/public/ftk-amu/"}
JSON
curl -i -X POST https://memolead-ftk-amu.mk-cbe.workers.dev/submit -H "Content-Type: application/json" -H "Origin: https://memolead-lp-665477084949.asia-northeast1.run.app" -d @/tmp/amu.json
```

## 計測
送信成功時に `dataLayer.push({event:"amu_campaign_submit", form_name, plan})`。GTMでこのカスタムイベントをトリガーにGA4 `generate_lead`／Google広告CVを設定する。

## 確認待ち
- 通知先（会場の担当者アドレス）→ `worker.js` の `CONFIG.TO`
- プライバシーポリシーのURL → `_assets/js/script.js` の `CONFIG.PRIVACY_URL`
- 完了画面の〔連絡時期〕〔発信番号〕
- 独自ドメインで公開する場合 → `CONFIG.ALLOWED_ORIGINS` と `CONFIG.FORM_URL` に追記
