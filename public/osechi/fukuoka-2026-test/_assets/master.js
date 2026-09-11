const LOCATIONS = {
  "ガーデンテラス福岡ホテル＆リゾート": { addr:"福岡県福岡市西区小戸2丁目3-55" },
  "ロイヤルチェスター福岡":            { addr:"福岡県大野城市雑餉隈町3丁目3-15" },
  "アルカーサル・アヴィオ":            { addr:"福岡県福岡市東区水谷2丁目52-8" },
  "グランドベルズ飯塚":                { addr:"福岡県飯塚市川津608-1" },
  "メモリードホール福岡":              { addr:"福岡県福岡市中央区警固3丁目1-7" }
};
function locMapUrl(name){
  const a=(LOCATIONS[name]||{}).addr;
  return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(a?`${name} ${a}`:name);
}
const PICK_3 = ["ガーデンテラス福岡ホテル＆リゾート","ロイヤルチェスター福岡","アルカーサル・アヴィオ"];
const PICK_5 = [...PICK_3, "グランドベルズ飯塚", "メモリードホール福岡"];
const DATES_XMAS   = ["12/23(水) 13:00〜18:00 CLOSE","12/24(木) 13:00〜18:00 CLOSE","12/25(金) 13:00〜18:00 CLOSE"];
const DATES_OSECHI = ["12/31(木) 10:00〜13:00 CLOSE"];
const DATES_NABE   = ["12/23(水) 13:00〜18:00 CLOSE","12/24(木) 13:00〜18:00 CLOSE","12/25(金) 13:00〜18:00 CLOSE","12/31(木) 10:00〜13:00 CLOSE"];
const DELIVERY_TIMES = ["12:00〜13:00","13:00〜14:00","14:00〜15:00","15:00〜16:00","16:00〜17:00"];

const FACILITIES = {
  garden: {
    name:"ガーデンテラス福岡ホテル＆リゾート",
    tel:"092-881-0007",
    fax:"092-881-0006",
    menu:"./_assets/img/menu_garden.webp",
    categories:[
      { key:"xmas", title:"クリスマス商品", tag:"12/23・24・25", time:"13:00〜18:00 CLOSE",
        dates:DATES_XMAS, pickup:PICK_3,
        items:[
          {no:1, name:"ローストビーフとローストチキンの盛り合わせ", price:11000, tax:814, limit:15},
          {no:2, name:"野菜ソムリエの星降るオードブル", price:11000, tax:814, limit:15},
          {no:3, name:"イタリアハムとチーズ盛り合わせ 乾杯セット", price:11000, tax:814, limit:15},
          {no:5, name:"ホワイトノエル（クリスマスケーキ）", price:5000, tax:370, limit:30},
          {no:6, name:"ノエル ショコラ ビジュー（ガトーケーキ）", price:5000, tax:370, limit:30}
        ]},
      { key:"osechi", title:"おせち料理", tag:"12/31", time:"10:00〜13:00 CLOSE",
        dates:DATES_OSECHI, pickup:PICK_5, delivery:true,
        items:[
          {no:9,  name:"和洋風おせち 3段重", s:28000, sTax:2074, g:29000, gTax:2148, limit:150},
          {no:10, name:"和洋風プレミアムおせち", s:48000, sTax:3555, g:50000, gTax:3703, limit:10},
          {no:11, name:"お菓子おせち", s:5000, sTax:370, g:6000, gTax:444, limit:30}
        ]}
    ]
  },
  royal: {
    name:"ロイヤルチェスター福岡",
    tel:"092-588-6688",
    fax:"092-588-6680",
    menu:"./_assets/img/menu_royal.webp",
    categories:[
      { key:"xmas", title:"クリスマス商品", tag:"12/23・24・25", time:"13:00〜18:00 CLOSE",
        dates:DATES_XMAS, pickup:PICK_3,
        items:[ {no:4, name:"クリスマスオードブル", price:11000, tax:814, limit:30} ]},
      { key:"osechi", title:"おせち料理", tag:"12/31", time:"10:00〜13:00 CLOSE",
        dates:DATES_OSECHI, pickup:PICK_5, delivery:true,
        items:[ {no:7, name:"和風おせち 3段重", s:28000, sTax:2074, g:29000, gTax:2148, limit:320} ]},
      { key:"nabe", title:"鍋セット", tag:"12/23・24・25 ／ 12/31", time:"クリスマス 13:00〜18:00／大晦日 10:00〜13:00",
        dates:DATES_NABE, pickup:PICK_3,
        items:[ {no:12, name:"博多水炊き", s:7000, sTax:518, g:8000, gTax:592, limit:30}, {no:13, name:"博多もつ鍋", s:7000, sTax:518, g:8000, gTax:592, limit:30} ]}
    ]
  },
  alcasal: {
    name:"アルカーサル・アヴィオ",
    tel:"092-665-0077",
    fax:"092-665-0088",
    menu:"./_assets/img/menu_alcasal.webp",
    categories:[
      { key:"osechi", title:"おせち料理", tag:"12/31", time:"10:00〜13:00 CLOSE",
        dates:DATES_OSECHI, pickup:PICK_5, delivery:true,
        items:[ {no:8, name:"和風おせち 2段重", s:21000, sTax:1555, g:22000, gTax:1629, limit:190} ]}
    ]
  }
};

