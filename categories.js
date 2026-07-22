// ============================================================
//  ご希望の式場(ドロップダウン) と メール通知先の対応表
//  ―「婚礼カード配送先（確定）.xlsx」の内容を反映 ―
//  - key    : 内部キー(フォームからはこれだけを送る。宛先は送らない)
//  - label  : ドロップダウンに表示する式場名
//  - to      : 通知メールの送信先(複数可・全員に同時送信)
//  ここを書き換えるだけで項目・宛先を変更できます。
// ============================================================
export const CATEGORIES = [
  {
    key: "gt-nagasaki",
    label: "ガーデンテラス長崎ホテル＆リゾート",
    to: ["t-ura@memolead.co.jp", "n.ota@memolead.co.jp", "tominaga-tatsu@memolead.co.jp"],
  },
  {
    key: "flags-isahaya",
    label: "ホテルフラッグス諫早",
    to: ["koga-yuka@memolead.co.jp", "kazu.hasegawa@memolead.co.jp", "y.shiotsuka@memolead.co.jp"],
  },
  {
    key: "flags-sasebo",
    label: "ホテルフラッグス佐世保九十九島",
    to: ["yamasaki-taka0358@memolead.co.jp", "yamashita-dai@memolead.co.jp", "oozono-ruka@memolead.co.jp"],
  },
  {
    key: "gt-saga",
    label: "ガーデンテラス佐賀ホテル＆リゾート",
    to: ["doi-yuu@memolead.co.jp", "kawakami-toru@memolead.co.jp", "uchida-kou@memolead.co.jp"],
  },
  {
    key: "rc-imari",
    label: "ロイヤルチェスター伊万里",
    to: ["nishino-yuu@memolead.co.jp"],
  },
  {
    key: "gt-fukuoka",
    label: "ガーデンテラス福岡ホテル＆リゾート",
    to: ["hashiguchi-ken@memolead.co.jp", "motoyama-kana@memolead.co.jp", "yoshimura-jyun@memolead.co.jp", "sakakihara-yuu@memolead.co.jp"],
  },
  {
    key: "rc-fukuoka",
    label: "ロイヤルチェスター福岡",
    to: ["info-rcf@memolead.co.jp"],
  },
  {
    key: "grandbells-iizuka",
    label: "グランドベルズ飯塚",
    to: ["fukunaga-chihi@memolead.co.jp", "yamasaki-chiha@memolead.co.jp"],
  },
];

// key で対応表を引けるようにした Map
export const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.key, c]));
