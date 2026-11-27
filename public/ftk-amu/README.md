# アミュプラザくまもと リニューアルキャンペーン LP（応募フォーム）

- @version v0003 | 2026-11-27（LP全体の骨組みを追加：画像＋HTML構成、ぼかし背景、追従ボタン、LINEボタン。画像は仮）
- 配置先：`/public/ftk-amu/`
- 公開URL（push後）：https://memolead-lp-665477084949.asia-northeast1.run.app/public/ftk-amu/
- 構成：Cloud Run（LP設置）＋ Cloudflare Worker `memolead-ftk-amu` ＋ Brevo（担当者通知＋任意でリスト登録）

## ファイル
| ファイル | 内容 |
|---|---|
| index.html | LP本体（noindex・GTM-KG9CZ8Q4）。画像主体＋読ませる文字・日付・条件・ボタン・フォームはHTML |
| _assets/img/ | 画像（下の「画像一覧」）。現在は仮画像。同じファイル名で上書きすれば差し替わる |
| _assets/index.css | LPのCSS。修正したら index.html の `index.css?v=` の値を上げる（キャッシュ対策） |
| _assets/js/script.js | LPのスクリプト（`CONFIG`：送信先・プライバシーポリシーURL・LINE URL・締切日／追従ボタン／計測／フォーム送信）。修正したら index.html の `script.js?v=` の値を上げる |
| worker.js | Brevo送信Worker（担当者通知・抽選用リスト登録・毎日の稼働確認メール） |
| wrangler.toml | Worker設定（Cron=毎日JST 9:00） |
| .htaccess | HTMLキャッシュ無効化 |

## 項目（パネル式：STEP 1 → 「進む」→ STEP 2 → 「送信」）
STEP 1
1. ご希望のプラン（必須・画像付きカードから1つ選択：結婚式／公開挙式／両方）… value は `wedding` `public` `both`。表示名は `worker.js` の `CONFIG.PLANS`

STEP 2（上部に選んだプランを表示。「戻る」でSTEP 1へ・選択は保持）
2. お名前（必須）
3. 電話番号（必須）… 全角・ハイフン入りでも数字だけに整えて受付（0から始まる10〜11桁）
4. プライバシーポリシーへの同意（必須）… URLは `_assets/js/script.js` の `CONFIG.PRIVACY_URL`

メールアドレスを聞かないため、お客様への自動返信はなし。当選者には担当者から電話。

## 画像一覧（_assets/img/）
幅は表示幅の2倍で書き出す。画像の中の文字は alt（index.html）にも入れてある。日付・条件・手順など変わる文字は画像に入れない（HTML側）。

| ファイル | サイズ(px) | 場所 | 画像に含めるもの |
|---|---|---|---|
| logo-collab.webp | 600×110 | ヘッダー・フッター | AMU × THE FOREST TERRACE ロゴ（背景透過推奨） |
| fv.webp | 750×1200 | FV | 写真・「結婚式をプレゼント」・キャッチ・プレゼント帯2つ・「さらに」帯。**応募ボタンは入れない**（HTMLで重ねる。下部約15%は空けておく） |
| intro.webp | 750×540 | コラボ紹介 | 写真のみ |
| wedding-head.webp | 700×300 | 結婚式プレゼント | 「抽選20組」＋リボン＋「結婚式プレゼント」 |
| wedding-photo1.webp / wedding-photo2.webp | 700×500 | 撮影2択 | 写真のみ（キャプションはHTML） |
| public-head.webp | 700×300 | 公開挙式プレゼント | 「抽選1組」＋リボン＋「公開挙式プレゼント」 |
| public-photo.webp | 700×500 | 公開挙式 | 写真のみ（挙式日はHTML） |
| ticket.webp | 750×640 | さらに | 「さらに」＋ショッピングチケット＋金額・組数 |
| venue.webp | 750×460 | 会場紹介 | 写真のみ |
| logo-ftk.webp | 300×120 | 会場紹介 | THE FOREST TERRACE ロゴ（背景透過推奨） |
| flow-photo.webp | 700×560 | 応募の流れ | 写真のみ |
| plan-wedding.jpg / plan-public.jpg | 600×400 | フォームSTEP 1 | 写真のみ |
| bg.jpg | 1920×1080 | PCの背景 | **ぼかし済み**の写真（ぼかし20〜30px・150KB前後）。LP内で使っていない写真推奨 |

サイズは目安（縦は多少前後してよい）。縦が変わる場合は index.html の該当 `<img>` の `width` `height` も合わせる（読み込み時のガタつき防止）。

## フェードスライダー（v0007〜）
TOP（FV）・撮影2択（2か所）・会場紹介の写真は、4秒ごとにフェードで切り替わる（前の写真の上に次の写真を重ねる方式）。公開挙式は1枚固定（_assets/img/public-photo.webp）。下部のライン（タップ）と左右スワイプでも操作可。
画像を **同じサイズ** で書き出し、次の名前で `_assets/img/slider/` に置くだけで自動的に追加される（ない番号は無視。1枚だけなら切り替えなし）。

| 場所 | 1枚目（既存） | 2〜4枚目 |
|---|---|---|
| TOP（FV）※ラインなし・3枚 | fv-photo-1.webp（写真のみ） | fv-photo-2.webp・fv-photo-3.webp（写真のみ・751×1199） |
| アミュプラザくまもとでの前撮り | wedding-photo1.webp | wedding-photo1-2.webp 〜 -4.webp |
| 熊本エリアでのロケーションフォト | wedding-photo2.webp | wedding-photo2-2.webp 〜 -4.webp |
| 会場紹介 | venue.webp | venue-2.webp 〜 -4.webp |

切り替え間隔は `_assets/js/script.js` の `SLIDE_MS`（ミリ秒）。

## TOP（FV）のレイヤー構成（v0010〜）
- 写真レイヤー：`_assets/img/slider/fv-photo-1〜3.webp`（写真のみ）がフェードで切り替わる。
- 装飾レイヤー：`_assets/img/fv-overlay.webp`（透過。緑の斜め影・キャッチ・プレゼント帯・さらに帯）を写真の上に固定で重ねる。751×1203。
- 文字・帯の修正は fv-overlay だけ書き出し直せばよい（イラレから透過PNGで書き出し → WebPに変換）。写真の追加・差し替えは写真だけ。
- 応募ボタンはHTMLで最前面。ボタン用の余白（さらに帯の下）は装飾レイヤーの位置で決まる。
- 旧ファイル（slider/fv.webp・fv-2.webp・fv-3.webp・fv-overlay.png）は未使用。

## サンクスページ（thanks/index.html）
- URL：/public/ftk-amu/thanks/ 。送信成功後に `./thanks/?plan=wedding|public|both` へ移動（noindex）。
- 応募内容（プラン）・公式LINE友だち追加ボタン（応募条件③）・当選連絡の案内を表示。〔○月○日〕〔発信番号〕は要差し替え。
- 計測：フォームから送信して来た場合だけ `amu_thanks_view`（plan）を送る（直接アクセス・再読み込みでは送らない）。
  広告のCVは `amu_thanks_view` か `amu_campaign_submit` の **どちらか一方** に設定する（両方だと二重計上）。
- CSS・JSはLP本体と共通（../_assets/）。

## 受付前ロック（worker.js の CONFIG.OPEN）
- `OPEN: false`（現在）：合言葉（Cloudflareのシークレット `TEST_KEY`）付きの送信だけ受け付ける。確認用に普通のURLで開いた人が送信しても「受付開始前のため送信できません」と表示され、メールもデータも残らない（判定はWorker側）。
- テスト送信：ページURLの末尾に `?test=合言葉` を付けて開き、送信する。通知メールの件名に【テスト送信】が付く。
- 受付開始日：`OPEN: true` に変更 → `CONFIG.TO` に担当者アドレスを追加 → `npx wrangler deploy`。HTML・JSの変更やpushは不要。
- 合言葉の登録・変更：`npx wrangler secret put TEST_KEY`

## CONFIG（_assets/js/script.js 冒頭）
| 項目 | 内容 |
|---|---|
| ENDPOINT | Worker の送信先 |
| PRIVACY_URL | プライバシーポリシー（フォーム・フッター両方に反映） |
| LINE_URL | 公式LINE友だち追加URL（応募条件・完了画面のボタンに反映） |
| DEADLINE | 応募締切（「応募の流れ」に反映） |

## 追従ボタン
FVの応募ボタンが画面上に消えたら下部に表示、応募フォームが見えている間は非表示。

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
送信成功時 `amu_campaign_submit`（form_name, plan）／応募ボタンクリック `amu_cta_click`（placement: fv・after_present・fixed）／LINEボタン `amu_line_click` を dataLayer に送る。GTMでこのカスタムイベントをトリガーにGA4 `generate_lead`／Google広告CVを設定する。

## 確認待ち
- 通知先（会場の担当者アドレス）→ `worker.js` の `CONFIG.TO`
- プライバシーポリシーのURL・LINE友だち追加URL・締切日 → `_assets/js/script.js` の `CONFIG`
- 完了画面の〔連絡時期〕〔発信番号〕
- 独自ドメインで公開する場合 → `CONFIG.ALLOWED_ORIGINS` と `CONFIG.FORM_URL` に追記
