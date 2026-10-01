# imari-enkai（RCI宴会LP・法事ページ 確認用）
@version v0003 | 2026-10-01 | 設置先 https://memolead-lp-665477084949.asia-northeast1.run.app/public/imari-enkai/

## 配置
memolead-lp リポジトリの `public/imari-enkai/` にこのフォルダの中身をそのまま置く → GitHub Desktop で commit + push → Cloud Build 完了後に確認。
※この README.md も公開URLで読めるため、不要なら置かないこと。

| URL | 中身 |
|---|---|
| /public/imari-enkai/ | 宴会LP（本番予定 rc-imari.jp/party/） |
| /public/imari-enkai/houji/ | 法事・法要ページ（本番予定 rc-imari.jp/party/houji/） |

## 確認用の注意
- フォームは見た目の確認用。送信ボタンは無効（本番は rc-imari.jp の CF7 id=4304）
- noindex 指定。GTM は入れていない（確認時のアクセスを本番の計測に混ぜないため）
- 画像は rc-imari.jp の既存画像を直接読み込み
- 中身は WordPress 用ファイル（wp/theme/assets/party-lp/）と同じ v0003
