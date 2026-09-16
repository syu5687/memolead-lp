// @version v0002 | 2026-09-16 | メモリード佐賀 おせち・クリスマス
const SAGA_ORDER_READY=true;
const LOCATIONS = {"ガーデンテラス佐賀 ホテル＆リゾート": {"addr": "佐賀市新栄東3丁目7-8"}, "ロイヤルチェスター佐賀": {"addr": "佐賀市天神1-1-28"}, "アイランドヒルズ迎賓館": {"addr": "佐賀市兵庫北5-16-2"}};
function locMapUrl(name){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(name+' '+(LOCATIONS[name]?.addr||''));}
const DELIVERY_TIMES=[];
const PICKUP_OSECHI=["ガーデンテラス佐賀 ホテル＆リゾート"];
const PICKUP_XMAS=["ガーデンテラス佐賀 ホテル＆リゾート"];
const DATES_OSECHI=["12/31(木) 10:00〜13:00"];
const DATES_XMAS=["12/23(水) 11:00","12/23(水) 16:00","12/24(木) 11:00","12/24(木) 16:00","12/25(金) 11:00","12/25(金) 16:00"];
const FACILITIES={saga:{name:'メモリード佐賀',categories:[
 {key:'osechi',pickup:PICKUP_OSECHI,dates:DATES_OSECHI,items:[{no:1,name:'プレミアムおせち',g:37000,s:35000,gTax:2740,sTax:2592,limit:200},{no:2,name:'特選おせち',price:22000,tax:1629,limit:150}]},
 {key:'xmas',pickup:PICKUP_XMAS,dates:DATES_XMAS,items:[{no:3,name:'クリスマスホームパーティーセット',price:15000,tax:1111,limit:250,cakes:['チョコムース','いちごケーキ']},{no:4,name:'オードブル',price:12000,tax:888,limit:null}]}
]}};
