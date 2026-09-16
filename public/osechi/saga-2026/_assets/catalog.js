// @version v0002 | 2026-09-16 | 佐賀 商品カタログ
const PRODUCT_INFO = {"1": {"size": "4名様向き / 3段重ね / 21cm × 21cm［3段］", "offer": "10月31日（土）までの早期ご購入（ご入金）で33,000円（税込）。3個以上ご購入でガーデンテラス佐賀のレストランチケット5,000円分をプレゼント。", "menus": [{"title": "一の重", "text": "蟹爪・花蓮根・羽二重奉書巻・ロブスター・鮑柔らか煮・海老芝煮・数の子・白身魚の南蛮漬け・蛸の酢の物"}, {"title": "二の重", "text": "焼き冬筍・海老芋・梅人参・牛肉八幡巻・田作り・鰤照り焼き・黒豆金箔・鮭昆布巻き・伊達巻・蛸旨煮・つくね・木の葉南京・チシャトウ"}, {"title": "三の重", "text": "ローストビーフ・イクラ醤油漬・バイ貝柔らか煮・鴨スモーク・ほうれん草とチーズの袱紗焼き・金柑蜜煮・大黒しめじ・鯛の雲丹焼・栗渋皮煮・きんとん・抹茶羊羹"}]}, "2": {"size": "2名様向き / 3段重ね / 12cm × 22cm［3段］", "menus": [{"title": "商品詳細", "text": "特選おせち 3段重ね。2名様向き。税込22,000円。限定150個。"}]}, "3": {"size": "4名様用 / オードブル ＋ クリスマスケーキ", "menus": [{"title": "セット内容", "text": "オードブル（34 × 43cm）とクリスマスケーキ（12cm）のセット。ケーキはチョコムース又はいちごケーキからお選びいただけます。"}, {"title": "お受け取り", "text": "2026年12月23日（水）・24日（木）・25日（金）。期間中は店頭でのお渡しのみとなります（配達はいたしかねます）。"}]}, "4": {"size": "4名様用 / 全18品", "menus": [{"title": "メニュー", "text": "ローストビーフ / アワビ / ロブスターネーズ焼き 他全18品"}, {"title": "商品詳細", "text": "オードブル（34 × 43cm）。4名様用。税込12,000円。"}, {"title": "お受け取り", "text": "2026年12月23日（水）・24日（木）・25日（金）。期間中は店頭でのお渡しのみとなります（配達はいたしかねます）。"}]}};
const catalogProducts=Object.entries(FACILITIES).flatMap(([facilityId,f])=>f.categories.flatMap(c=>c.items.map(it=>({...it,facilityId,facility:f.name,category:c.key,dates:c.dates,pickup:c.pickup,delivery:!!c.delivery,...PRODUCT_INFO[it.no]})))).sort((a,b)=>a.no-b.no);
const productGrid=document.getElementById('product-grid');
catalogProducts.forEach(p=>{
  const article=document.createElement('article');
  article.className='product-card'; article.dataset.category=p.category; article.dataset.product=p.no;
  const prices=p.price!=null
    ? `<div><span>一般・会員共通</span><strong>${p.price.toLocaleString('ja-JP')}<small>円</small></strong></div><p class="shared">税込・共通価格</p>`
    : `<div><span>一般価格</span><strong>${p.g.toLocaleString('ja-JP')}<small>円</small></strong></div><div class="member"><span>会員特別価格</span><strong>${p.s.toLocaleString('ja-JP')}<small>円</small></strong></div>`;
  article.innerHTML=`<button type="button" class="product-visual" data-enlarge="${p.no}" aria-label="${p.name}の画像を拡大"><img src="./_assets/img/product-${String(p.no).padStart(2,'0')}.webp?v=photos-20260914" alt="${p.name}" width="600" height="450" loading="lazy"><span class="product-number">No. ${String(p.no).padStart(2,'0')}</span>${p.limit?`<span class="product-limit">限定 ${p.limit}個</span>`:''}<span class="product-zoom-hint">画像を拡大 ＋</span></button>
    <div class="product-body"><p class="product-size">${p.size}</p><h3>${p.name}</h3><div class="product-prices">${prices}</div>${p.offer?`<p class="product-offer">${p.offer}</p>`:''}
    <div class="add-to-cart"><label>数量<select data-addqty="${p.no}" aria-label="${p.name}を追加する数量">${Array.from({length:10},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}</select></label><button type="button" class="product-order" data-order="${p.no}" aria-label="${p.name}をカートに追加">カートに追加 ＋</button></div>
    <details class="product-details"><summary>献立・商品詳細を見る</summary>${p.menus.map(group=>`<div class="menu-group"><h5>${group.title}</h5><p>${group.text}</p></div>`).join('')}</details></div>`;
  productGrid.appendChild(article);
});
const categoryGuides={osechi:'おせち料理 2商品',xmas:'クリスマス 2商品｜12月23日・24日・25日の店頭お渡し。',all:'全4商品｜おせち料理とクリスマス商品をご用意しています。'};
const categoryNames={osechi:'おせち料理',xmas:'クリスマス'};
const pickupSchedules={
  osechi:'12月31日（木）10:00〜13:00',
  xmas:'12月23日（水）・24日（木）・25日（金） 11:00／16:00'
};
function pickupGuide(category){
  const categories=category==='all'?Object.keys(categoryNames):[category];
  return categories.map(key=>{
    const locations=[...new Set(catalogProducts.filter(p=>p.category===key).flatMap(p=>p.pickup))];
    if(!locations.length)return '';
    return `<div class="pickup-location-group"><h3>${categoryNames[key]} 受け取り可能店舗 <span>${locations.length}店舗</span></h3><ul>${locations.map(name=>`<li>${name}</li>`).join('')}</ul><p class="pickup-schedule"><b>受取日時</b><strong>${pickupSchedules[key]}</strong></p></div>`;
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
const photoDialog=document.createElement('dialog');
photoDialog.className='product-photo-dialog';
photoDialog.setAttribute('aria-labelledby','product-photo-title');
photoDialog.innerHTML='<button type="button" class="photo-close" aria-label="拡大画像を閉じる" autofocus>閉じる ×</button><h2 id="product-photo-title"></h2><div class="photo-controls"><button type="button" data-photo-zoom="in" aria-label="写真をさらに拡大">＋ 拡大</button><button type="button" data-photo-zoom="out" aria-label="写真を縮小">− 縮小</button><button type="button" data-photo-zoom="reset">元に戻す</button><span class="photo-scale" aria-live="polite">100%</span></div><p class="photo-help">拡大後、写真を1本指でなぞると移動できます。</p><div class="photo-viewport"><img alt="" draggable="false"></div>';
document.body.appendChild(photoDialog);
let photoScroll='';
productGrid.addEventListener('click',event=>{
 const trigger=event.target.closest('[data-enlarge]');
 if(!trigger)return;
 const p=catalogProducts.find(p=>String(p.no)===trigger.dataset.enlarge);
 if(!p)return;
 photoDialog.querySelector('h2').textContent=p.name;
 const img=photoDialog.querySelector('img');
 img.alt=p.name;
 img.src=`./_assets/img/product-${String(p.no).padStart(2,'0')}-large.webp?v=photos-20260914`;
 photoScroll=document.body.style.overflow;
 document.body.style.overflow='hidden';
 resetPhoto();
 photoDialog.showModal();
});
photoDialog.querySelector('button').addEventListener('click',()=>photoDialog.close());
photoDialog.addEventListener('click',event=>{if(event.target===photoDialog){const r=photoDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)photoDialog.close();}});
photoDialog.addEventListener('close',()=>{document.body.style.overflow=photoScroll;resetPhoto();});

// 拡大した写真をPointer Eventsで移動（タッチ・マウス共通）。
const photoViewport=photoDialog.querySelector('.photo-viewport');
const zoomPhoto=photoViewport.querySelector('img');
let photoScale=1,photoX=0,photoY=0,photoPointer=null;
function paintPhoto(){
 const w=photoViewport.clientWidth,h=photoViewport.clientHeight;
 const ratio=zoomPhoto.naturalWidth&&zoomPhoto.naturalHeight?Math.min(w/zoomPhoto.naturalWidth,h/zoomPhoto.naturalHeight):0;
 const maxX=Math.max(0,(zoomPhoto.naturalWidth*ratio*photoScale-w)/2);
 const maxY=Math.max(0,(zoomPhoto.naturalHeight*ratio*photoScale-h)/2);
 photoX=Math.max(-maxX,Math.min(maxX,photoX));photoY=Math.max(-maxY,Math.min(maxY,photoY));
 zoomPhoto.style.transform=`translate(${photoX}px,${photoY}px) scale(${photoScale})`;
 photoViewport.classList.toggle('is-zoomed',photoScale>1);
 photoDialog.querySelector('.photo-scale').textContent=Math.round(photoScale*100)+'%';
 photoDialog.querySelector('[data-photo-zoom="in"]').disabled=photoScale>=4;
 photoDialog.querySelector('[data-photo-zoom="out"]').disabled=photoScale<=1;
}
function resetPhoto(){photoScale=1;photoX=0;photoY=0;photoPointer=null;paintPhoto();}
photoDialog.querySelector('.photo-controls').addEventListener('click',event=>{
 const button=event.target.closest('[data-photo-zoom]');if(!button)return;
 photoPointer=null;
 if(button.dataset.photoZoom==='reset'){resetPhoto();return;}
 photoScale=Math.max(1,Math.min(4,photoScale+(button.dataset.photoZoom==='in'?.5:-.5)));paintPhoto();
});
photoViewport.addEventListener('pointerdown',event=>{
 if(photoScale<=1||photoPointer||!event.isPrimary||(event.pointerType==='mouse'&&event.button!==0))return;
 photoPointer={id:event.pointerId,x:event.clientX,y:event.clientY};photoViewport.setPointerCapture(event.pointerId);
});
photoViewport.addEventListener('pointermove',event=>{
 if(!photoPointer||photoPointer.id!==event.pointerId)return;
 photoX+=event.clientX-photoPointer.x;photoY+=event.clientY-photoPointer.y;
 photoPointer.x=event.clientX;photoPointer.y=event.clientY;paintPhoto();
});
for(const type of ['pointerup','pointercancel','lostpointercapture'])photoViewport.addEventListener(type,event=>{
 if(photoPointer?.id!==event.pointerId)return;
 photoPointer=null;if(photoViewport.hasPointerCapture(event.pointerId))photoViewport.releasePointerCapture(event.pointerId);
});
zoomPhoto.addEventListener('load',()=>{photoX=0;photoY=0;paintPhoto();});
new ResizeObserver(()=>paintPhoto()).observe(photoViewport);
