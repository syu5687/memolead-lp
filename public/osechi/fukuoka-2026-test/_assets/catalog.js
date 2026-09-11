/* Catalog prices and facilities are derived from the existing form master. */
const PRODUCT_INFO = {
  "1": {
    "size": "3〜4人前 / 全4品目",
    "menus": [
      {
        "title": "商品内容",
        "text": "ローストビーフ約20枚／ローストチキン2本／自家製ポテトチップスとパルメザンチーズ／旬野菜のロースト（ポテト・パプリカ2種・ズッキーニ・ブロッコリー・芽キャベツetc）／ソース5種（ジャポネ・サワークリーム・スパイシーソース・粒マスタード・ケチャップ）"
      }
    ]
  },
  "2": {
    "size": "3〜4人前 / 全14品目",
    "menus": [
      {
        "title": "献立",
        "text": "タコのマリネ／ポテトサラダ／紅茶鴨のスモーク／えびのガーリックソテー／チキントルティーヤ／プルドポーク／季節野菜のキッシュ／コールスローサラダ／カレーサモサ／メルバトースト／ローストビーフと旬野菜／春巻きチーズフライ／ポテトフライとチーズ／フライドチキン"
      }
    ]
  },
  "3": {
    "size": "3〜4人前 / 全15品目",
    "menus": [
      {
        "title": "献立",
        "text": "モルタデッラハム／ポテトのブリニ／ミラノサラミ／全粒粉クラッカー／チョリソー／グリッシーニ／カマンベールチーズ／ブルサンチーズ／クリームチーズとピスタチオ／自家製トマトジャム／ミモレット／ミックスナッツ／スモークチーズ／ライブレッドレーズンクルミ／フルーツ各種"
      },
      {
        "title": "セット内容",
        "text": "ガーデンテラス オリジナル赤ワイン付き"
      }
    ]
  },
  "4": {
    "size": "3〜4人前 / 全16品目",
    "menus": [
      {
        "title": "献立",
        "text": "鶏モモグリル／サイコロステーキ／海鮮春巻き／鶏唐揚げ／レンコン薩摩揚げ／エビマヨ炒め／砂ずりのコンフィ／季節のタルト／エビフライ／ホワイトアスパラベーコン巻き／南瓜のキッシュ、蜜林檎、オリーブのピンチョス／鶏団子黒酢炒め／ミニトマトグリル／野菜のピクルス／チーズ、レモン／香草"
      }
    ]
  },
  "5": {
    "size": "クリスマスケーキ / 直径15cm",
    "menus": [
      {
        "title": "商品詳細",
        "text": "ホワイトノエル（クリスマスケーキ）／直径15cm"
      }
    ]
  },
  "6": {
    "size": "ガトーケーキ / 13cm × 13cm",
    "menus": [
      {
        "title": "商品詳細",
        "text": "ノエル ショコラ ビジュー（ガトーケーキ）／13cm×13cm"
      }
    ]
  },
  "7": {
    "size": "4人前 / 全39品目 / 和洋中",
    "menus": [
      {
        "title": "一の重",
        "text": "ロブスター明太ポテト焼き／紅白膾いくら添え／蛸軟らか煮／鮭昆布巻き佃煮／海老芝煮／伊達巻／黒豆蜜煮金箔添え／数の子松前漬け／金冠蜜煮／ズワイ爪／月光柿／公魚カリカリ／祝い奉書／紫芋栗羊羹／紅白ぼんぼり"
      },
      {
        "title": "二の重",
        "text": "ローストビーフ／インカポテトチーズ和え／鮑のエスカルゴ風グラタン／鰤の竜田揚げ／帆立のシーザーサラダ／合鴨ロースパストラミ／蕪のピクルス／チキンテリーヌ／ 南瓜タルト／イワシソティートマトソース／栗渋皮煮／季節の葛餅／林檎の蜜漬け／薩摩揚げ／パン・ド・フリュイ・ブール"
      },
      {
        "title": "三の重",
        "text": "海老チリソース煮／胡桃の飴煮と煎りカシュナッツ／揚げ里芋のそぼろ掛け／棒々鶏／カサゴの南蛮漬け／牛バラブレゼ／大学芋／豚肩ロース東坡煮／烏賊黒酢炒め"
      }
    ]
  },
  "8": {
    "size": "2人前 / 全37品目 / 和洋中",
    "menus": [
      {
        "title": "一の重",
        "text": "金冠蜜煮／月光柿／祝い奉書／胡桃飴煮／季節野菜のキッシュ／プチトマト杏子ゼリー寄せ／チキンガランティーヌパイ包み焼き／タコの照り焼き／ロブスター明太ポテト焼き／紅白膾いくら添え／海老芝煮／祝ぼんぼり／アワビの味噌焼き／蟹爪ボイル／鮭昆布巻き／伊達巻／松風焼き／カリカリ公魚／菊花かぶ／竹の子土佐まぶし"
      },
      {
        "title": "二の重",
        "text": "銀鱈竜田揚げ／松笠烏賊雲丹焼き／牛蒡胡麻酢和え／合鴨生ハムモッツァレラチェリー巻き／中華クラゲ／海老チリソース／ローストビーフ／黒豆／叉焼／花蓮根甘酢漬け／寒鰆の幽庵焼き／穴子の八幡巻き／羽子板蒲鉾／数の子西京漬け／かさご南蛮漬け／栗渋皮煮／フルーツ餅"
      }
    ]
  },
  "9": {
    "size": "4人前 / 全29品目",
    "menus": [
      {
        "title": "一の重",
        "text": "伊勢海老のテルミドール／ガーリックシュリンプ／鰤の照り焼き／蓮根甘酢の明太クリームチーズ和え／メカジキのトマト煮込み／サーモン南蛮漬け／秋刀魚のトマトハーブ焼き／蛸のフリット／芽キャベツと茸マリネ／ラディッシュ菊花甘酢漬け"
      },
      {
        "title": "二の重",
        "text": "ローストビーフ／ジャーマンポテト／蕪の甘酢漬け生ハム巻き／季節野菜のキッシュ／カボチャのマスカルポーネ和え／カリフラワーのスコーン／カマンベールチーズ／フロマージュブラン／メルバトースト／全粒粉クラッカー"
      },
      {
        "title": "三の重",
        "text": "チキン八幡巻き／牛蒡酢胡麻和え／金柑甘露煮／伊達焼き市松／ミートローフ／数の子／スモークサーモンとズッキーニロール／黒豆／里芋竜田揚げ"
      }
    ]
  },
  "10": {
    "size": "4人前 / 全30品目",
    "menus": [
      {
        "title": "一の重",
        "text": "伊勢海老のテルミドール／ガーリックシュリンプ／鰤の照り焼き／秋刀魚のトマトハーブ焼き／姫アワビのトマト煮込み／サーモンの南蛮漬け／蛸のマリネ／ラディッシュ菊花甘酢漬け／蓮根甘酢の明太クリームチーズ和え／タラバガニのサラダ"
      },
      {
        "title": "二の重",
        "text": "ローストビーフとジャーマンポテト／牛ほほ肉の赤ワイン煮込み／季節野菜のキッシュ／カリフラワーのスコーン／全粒粉クラッカーとメルバトースト／自家製トマトジャム／キャビア／さつま芋のナッツロール／フロマージュブラン"
      },
      {
        "title": "三の重",
        "text": "牛蒡酢の胡麻和え／蕪の甘酢漬け生ハム巻き／烏賊の黒オリーブマリネ／数の子ペペロンチーノ／黒豆金箔／金柑甘露煮／伊達焼き／チキン八幡巻き／ミートローフ／里芋竜田揚げ／スモークサーモンとズッキーニロール"
      }
    ]
  },
  "11": {
    "size": "全11品目 / 焼き菓子の詰め合わせ",
    "menus": [
      {
        "title": "献立",
        "text": "フロランタン／ゴマフロランタン／ディアマン／抹茶サブレ／パイクラムクッキー／マーブルクッキー／ガレットブルトンヌ／グラノーラホワイト／クロッカンビター／カカオサブレ／サブレ"
      }
    ]
  },
  "12": {
    "size": "4〜5人前 / 全7品目",
    "menus": [
      {
        "title": "セット内容",
        "text": "骨付き鶏もも／骨付き鶏むね身／手羽先／手羽元／鶏スープ／自家製ポン酢／冷凍うどん"
      }
    ]
  },
  "13": {
    "size": "4〜5人前 / 全7品目",
    "menus": [
      {
        "title": "セット内容",
        "text": "和牛モツ／薄揚げ／ニンニクチップ／煎り胡麻／唐辛子／自家製もつ鍋スープ／ちゃんぽん麺"
      }
    ]
  }
};
const catalogProducts=Object.entries(FACILITIES).flatMap(([facilityId,f])=>f.categories.flatMap(c=>c.items.map(it=>({...it,facilityId,facility:f.name,category:c.key,dates:c.dates,pickup:c.pickup,delivery:!!c.delivery,...PRODUCT_INFO[it.no]})))).sort((a,b)=>a.no-b.no);
const productGrid=document.getElementById('product-grid');
catalogProducts.forEach(p=>{
  const article=document.createElement('article');
  article.className='product-card'; article.dataset.category=p.category; article.dataset.product=p.no;
  const prices=p.price!=null
    ? `<div><span>一般・会員共通</span><strong>${p.price.toLocaleString('ja-JP')}<small>円</small></strong></div><p class="shared">税込・共通価格</p>`
    : `<div><span>一般価格</span><strong>${p.g.toLocaleString('ja-JP')}<small>円</small></strong></div><div class="member"><span>会員特別価格</span><strong>${p.s.toLocaleString('ja-JP')}<small>円</small></strong></div>`;
  article.innerHTML=`<div class="product-visual"><img src="./_assets/img/product-${String(p.no).padStart(2,'0')}.webp" alt="${p.name}" width="600" height="450" loading="lazy"><span class="product-number">No. ${String(p.no).padStart(2,'0')}</span><span class="product-limit">限定 ${p.limit}${p.category==='nabe'?'セット':'個'}</span></div>
    <div class="product-body"><p class="product-size">${p.size}</p><h3>${p.name}</h3><div class="product-prices">${prices}</div>
    <div class="add-to-cart"><label>数量<select data-addqty="${p.no}" aria-label="${p.name}を追加する数量">${Array.from({length:10},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}</select></label><button type="button" class="product-order" data-order="${p.no}" aria-label="${p.name}をカートに追加">カートに追加 ＋</button></div>
    <details class="product-details"><summary>献立・商品詳細を見る</summary>${p.menus.map(group=>`<div class="menu-group"><h5>${group.title}</h5><p>${group.text}</p></div>`).join('')}</details></div>`;
  productGrid.appendChild(article);
});
const categoryGuides={
  osechi:'おせち料理 5商品｜12月31日（木）10:00〜13:00のお受け取り。福岡県内配達も選べます。',
  xmas:'クリスマス 6商品｜12月23日（水）・24日（木）・25日（金）13:00〜18:00のお受け取り。一般・会員共通価格です。',
  nabe:'鍋セット 2商品｜12月23〜25日 13:00〜18:00、または12月31日 10:00〜13:00のお受け取り。',
  all:'全13商品｜お受け取り日・受け取り可能店舗はカテゴリごとに異なります。'
};
const categoryNames={osechi:'おせち料理',xmas:'クリスマス',nabe:'鍋セット'};
function pickupGuide(category){
  const categories=category==='all'?Object.keys(categoryNames):[category];
  return categories.map(key=>{
    const locations=[...new Set(catalogProducts.filter(p=>p.category===key).flatMap(p=>p.pickup))];
    return `<div class="pickup-location-group"><h3>${categoryNames[key]} 受け取り可能店舗 <span>${locations.length}店舗</span></h3><ul>${locations.map(name=>`<li>${name}</li>`).join('')}</ul></div>`;
  }).join('');
}
function filterCatalog(category){
  document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===category)));
  productGrid.querySelectorAll('.product-card').forEach(card=>card.hidden=category!=='all'&&card.dataset.category!==category);
  document.getElementById('category-guide').textContent=categoryGuides[category];
  document.getElementById('category-pickup').innerHTML=pickupGuide(category);
}
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>filterCatalog(b.dataset.filter)));
filterCatalog('all');
