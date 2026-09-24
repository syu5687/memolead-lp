# 指輪＆結婚相談会 申込フォーム（旧：ブライダルリング申込フォーム）

- @version v0007 | 2026-09-24（名称変更・木曜店休・住所任意・前日までの予約）
- 配置先：`/public/bridal-ring/`
- 公開URL（push後）：https://memolead-lp-665477084949.asia-northeast1.run.app/public/bridal-ring/
- 構成：Cloud Run（フォーム設置）＋ Cloudflare Worker `memolead-bridal-ring` ＋ Brevo（担当者通知＋自動返信）

## ファイル
| ファイル | 内容 |
|---|---|
| index.html | フォーム本体（自己完結・noindex・GTM-KG9CZ8Q4） |
| worker.js | Brevo送信Worker（担当者通知・自動返信・毎日の稼働確認メール） |
| wrangler.toml | Worker設定（Cron=毎日JST 9:00） |
| .htaccess | HTMLキャッシュ無効化 |

## 会場
サロン・ド・ルシェル／佐賀県佐賀市多布施2丁目15-1／TEL 0952-20-1516（木曜日店休）（フォーム上部・フッター・通知メール・自動返信に表示。住所はGoogleマップへリンク）

## 項目
1. 参加希望日時（日付カードを選ぶ → その日の時間を選ぶ・1枠のみ・必須）… `index.html` の `CONFIG.SLOTS` で管理
2. 氏名（必須）
3. 郵便番号＋住所（任意・郵便番号7桁で自動入力）
4. 電話番号・メール（必須）
5. 結婚予定（ドロップダウン・必須）… 今月〜24か月先＋「◯年◯月以降」＋「未定」を自動生成
6. 特に当日相談したいこと（任意）
7. 申込のきっかけ（必須・1つ選択：SNS／式場の紹介／お友だちの紹介／お店からの紹介／その他。その他は内容を任意入力）

## 日程の差し替え（index.html の CONFIG.SLOTS）
```js
SLOTS: [
  { date: "2026-10-10", times: ["10:00〜", "13:00〜", "15:00〜"], full: [] },
  { date: "2026-10-11", times: ["10:00〜", "13:00〜", "15:00〜"], full: ["13:00〜"] } // full=満席表示
]
```
- 予約は参加日の前日まで：当日・過ぎた日付は自動で非表示。全日程が過ぎると「現在受付中の日程はありません。」を表示。
- 反映済み日程：2026年10月4日(日)・10日(土)・18日(日)・24日(土)／各日 13:00〜・15:00〜・17:00〜（所要約1時間）
- HTMLだけの変更なので Worker 再デプロイ不要。

## Worker デプロイ（初回のみ）
```bash
cd public/bridal-ring
npx wrangler deploy
npx wrangler secret put BREVO_API_KEY   # 既存フォームと同じキー
```
通知先 `CONFIG.TO`（現在 mk@emanet.jp）・CC・BCC を変えたら `npx wrangler deploy`。

## 送信テスト（ご自身のPCで）
```bash
cat > /tmp/ring.json <<'JSON'
{"name":"テスト 太郎","zip":"8100001","address":"福岡市中央区天神1-1","tel":"090-0000-0000","email":"mk@emanet.jp","slots":"2026年10月10日（土） 10:00〜","weddingPlan":"未定","note":"テスト送信","formName":"ブライダルリング 申込フォーム","source":"https://memolead-lp-665477084949.asia-northeast1.run.app/public/bridal-ring/"}
JSON
curl -i -X POST https://memolead-bridal-ring.mk-cbe.workers.dev/submit -H "Content-Type: application/json" -H "Origin: https://memolead-lp-665477084949.asia-northeast1.run.app" -d @/tmp/ring.json
```
Windows PowerShell の場合は `curl.exe` を使い、JSONはファイルに保存して `-d "@ring.json"`。

## 計測
送信成功時に `dataLayer.push({event:"bridal_ring_submit", form_name, wedding_plan})`。GTMでこのカスタムイベントをトリガーにGA4 `generate_lead`／Google広告CVを設定する。
