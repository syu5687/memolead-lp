/* Catalog prices and facilities are derived from the existing form master. */
const PRODUCT_INFO = {
  1:{size:'3〜4人前 / 全4品目',detail:'ローストビーフ約20枚、ローストチキン2本、自家製ポテトチップスとパルメザンチーズ、旬野菜のロースト。ソース5種付き。'},
  2:{size:'3〜4人前 / 全14品目',detail:'タコのマリネ、ポテトサラダ、紅茶鴨のスモーク、えびのガーリックソテー、チキントルティーヤ、プルドポーク、季節野菜のキッシュなど。'},
  3:{size:'3〜4人前 / 全15品目',detail:'モルタデッラハム、ミラノサラミ、カマンベールチーズ、ブルサンチーズ、ミモレット、フルーツ各種など。ガーデンテラス オリジナル赤ワイン付き。'},
  4:{size:'3〜4人前 / 全16品目',detail:'鶏モモグリル、サイコロステーキ、海鮮春巻き、鶏唐揚げ、エビマヨ炒め、エビフライ、季節のタルト、野菜のピクルスなど。'},
  5:{size:'クリスマスケーキ / 直径15cm',detail:'商品名：ホワイトノエル。ケーキのサイズは直径15cmです。'},
  6:{size:'ガトーケーキ / 13cm × 13cm',detail:'商品名：ノエル ショコラ ビジュー。ケーキのサイズは13cm × 13cmです。'},
  7:{size:'4人前 / 全39品目 / 和洋中',detail:'ロブスター明太ポテト焼き、海老芝煮、伊達巻、ローストビーフ、鮑のエスカルゴ風グラタン、海老チリソース煮、牛バラブレゼなど。三段のお重に和洋中の料理を詰め合わせました。'},
  8:{size:'2人前 / 全37品目 / 和洋中',detail:'ロブスター明太ポテト焼き、アワビの味噌焼き、蟹爪ボイル、ローストビーフ、海老チリソース、黒豆、数の子西京漬けなど。二段のお重に和洋中の料理を詰め合わせました。'},
  9:{size:'4人前 / 全29品目',detail:'伊勢海老のテルミドール、ガーリックシュリンプ、ローストビーフ、ジャーマンポテト、チキン八幡巻き、ミートローフ、数の子など。'},
  10:{size:'4人前 / 全30品目',detail:'伊勢海老のテルミドール、姫アワビのトマト煮込み、タラバガニのサラダ、牛ほほ肉の赤ワイン煮込み、キャビア、黒豆金箔など。'},
  11:{size:'全11品目 / 焼き菓子の詰め合わせ',detail:'フロランタン、ゴマフロランタン、ディアマン、抹茶サブレ、パイクラムクッキー、マーブルクッキー、ガレットブルトンヌ、グラノーラホワイト、クロッカンビター、カカオサブレ、サブレ。'},
  12:{size:'4〜5人前 / 全7品目',detail:'骨付き鶏もも、骨付き鶏むね身、手羽先、手羽元、鶏スープ、自家製ポン酢、冷凍うどん。'},
  13:{size:'4〜5人前 / 全7品目',detail:'和牛モツ、薄揚げ、ニンニクチップ、煎り胡麻、唐辛子、自家製もつ鍋スープ、ちゃんぽん麺。'}
};
const catalogProducts=Object.entries(FACILITIES).flatMap(([facilityId,f])=>f.categories.flatMap(c=>c.items.map(it=>({...it,facilityId,facility:f.name,category:c.key,...PRODUCT_INFO[it.no]})))).sort((a,b)=>a.no-b.no);
const productGrid=document.getElementById('product-grid');
catalogProducts.forEach(p=>{
  const article=document.createElement('article');
  article.className='product-card'; article.dataset.category=p.category; article.dataset.product=p.no;
  const prices=p.price!=null
    ? `<div><span>一般・会員共通</span><strong>${p.price.toLocaleString('ja-JP')}<small>円</small></strong></div><p class="shared">税込・共通価格</p>`
    : `<div><span>一般価格</span><strong>${p.g.toLocaleString('ja-JP')}<small>円</small></strong></div><div class="member"><span>会員特別価格</span><strong>${p.s.toLocaleString('ja-JP')}<small>円</small></strong></div>`;
  article.innerHTML=`<div class="product-visual"><img src="./_assets/img/product-${String(p.no).padStart(2,'0')}.webp" alt="${p.name}" width="600" height="450" loading="lazy"><span class="product-number">No. ${String(p.no).padStart(2,'0')}</span><span class="product-limit">限定 ${p.limit}${p.category==='nabe'?'セット':'個'}</span></div>
    <div class="product-body"><p class="product-size">${p.size}</p><h3>${p.name}</h3><div class="product-prices">${prices}</div>
    <p class="product-facility"><span>お申し込み施設</span>${p.facility}</p>
    <button type="button" class="product-order" data-order="${p.no}" aria-label="${p.name}の注文欄へ">この商品の注文欄へ <span aria-hidden="true">↓</span></button>
    <details class="product-details"><summary>献立・商品詳細を見る</summary><p>${p.detail}</p></details></div>`;
  productGrid.appendChild(article);
});
const categoryGuides={
  osechi:'おせち料理 5商品｜12月31日（木）10:00〜13:00のお受け取り。福岡県内配達も選べます。',
  xmas:'クリスマス 6商品｜12月23日（水）・24日（木）・25日（金）13:00〜18:00のお受け取り。一般・会員共通価格です。',
  nabe:'鍋セット 2商品｜12月23〜25日 13:00〜18:00、または12月31日 10:00〜13:00のお受け取り。',
  all:'全13商品｜お受け取り日・お申し込み施設は商品ごとに異なります。'
};
function filterCatalog(category){
  document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===category)));
  productGrid.querySelectorAll('.product-card').forEach(card=>card.hidden=category!=='all'&&card.dataset.category!==category);
  document.getElementById('category-guide').textContent=categoryGuides[category];
}
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>filterCatalog(b.dataset.filter)));
filterCatalog('osechi');
productGrid.addEventListener('click',e=>{
  const button=e.target.closest('[data-order]'); if(!button)return;
  const p=catalogProducts.find(p=>p.no===Number(button.dataset.order));
  const selected=document.querySelector('input[name="facility"]:checked');
  const hasOrders=[...menuArea.querySelectorAll('select[data-item]')].some(s=>Number(s.value)>0);
  if(selected&&selected.value!==p.facilityId&&hasOrders&&!window.confirm('この商品は別の施設のお取り扱いです。施設を切り替えると、入力中の数量・受け取り条件はクリアされます。切り替えますか？'))return;
  if(!selected||selected.value!==p.facilityId){
    const radio=document.querySelector(`input[name="facility"][value="${p.facilityId}"]`);
    radio.checked=true; radio.dispatchEvent(new Event('change',{bubbles:true}));
  }
  const quantity=menuArea.querySelector(`select[data-item="${p.no}"]`);
  document.getElementById('selection-notice').textContent=`No.${p.no} ${p.name} のお申し込み施設「${p.facility}」を選択しました。数量とお受け取り条件をご指定のうえ、お客様情報もご入力ください。`;
  quantity.focus({preventScroll:true});quantity.closest('.item').scrollIntoView({behavior:'smooth',block:'center'});
});
// A changed form invalidates an earlier local-only review.
form.addEventListener('input',()=>{document.getElementById('testReview').hidden=true;});
form.addEventListener('change',()=>{document.getElementById('testReview').hidden=true;});
