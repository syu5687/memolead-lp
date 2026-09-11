'use strict';
const form=document.getElementById('orderForm'), msg=document.getElementById('formMsg');
const cartItems=document.getElementById('cartItems'), review=document.getElementById('testReview');
const yen=n=>n==null?'—':'¥'+Number(n).toLocaleString('ja-JP');
const byNo=no=>catalogProducts.find(p=>p.no===Number(no));
let cart=[],tier='',serial=0,toastTimer;
const storageKey='fukuoka-2026-cart-preview-v2';
try{
 const saved=JSON.parse(sessionStorage.getItem(storageKey)||'null');
 if(saved){tier=saved.tierConfirmed&&['general','special'].includes(saved.tier)?saved.tier:'';cart=(Array.isArray(saved.cart)?saved.cart:[]).slice(0,100).filter(r=>byNo(r.no)).map(r=>{const p=byNo(r.no);const deliveryDate=p.dates.map(v=>v.replace(/\s.*$/,''));return {id:++serial,no:p.no,qty:Math.min(10,Math.max(1,parseInt(r.qty)||1)),method:p.delivery&&['store','delivery'].includes(r.method)?r.method:'',pickup:p.pickup.includes(r.pickup)?r.pickup:'',date:(p.delivery&&r.method==='delivery'?deliveryDate:p.dates).includes(r.date)?r.date:'',time:DELIVERY_TIMES.includes(r.time)?r.time:''};});}
}catch(_){/* Session storage is optional. */}
function persist(){try{sessionStorage.setItem(storageKey,JSON.stringify({tier,cart,tierConfirmed:!!tier}));}catch(_){}}
function invalidate(){review.hidden=true;msg.textContent='';msg.className='form-msg';}
function unit(p){return p.price??(tier?(tier==='special'?p.s:p.g):null);}
function tax(p){return p.tax??(tier?(tier==='special'?p.sTax:p.gTax):null);}
function totals(){const fees=new Set();let subtotal=0,quantity=0,productTax=0;for(const r of cart){const p=byNo(r.no);subtotal+=unit(p)*r.qty;productTax+=tax(p)*r.qty;quantity+=r.qty;if(r.method==='delivery')fees.add(p.facilityId);}return {subtotal:cart.length&&!tier?null:subtotal,quantity,productTax:cart.length&&!tier?null:productTax,fees,total:cart.length&&!tier?null:subtotal+fees.size*1000};}
function options(values,selected){return '<option value="">選択してください</option>'+values.map(v=>`<option value="${v}"${v===selected?' selected':''}>${v}</option>`).join('');}
function deliveryDates(values,selected){return options(values.map(v=>v.replace(/\s.*$/,'')),selected);}
function renderCart(focus){
 cartItems.innerHTML=cart.length?cart.map((r,i)=>{const p=byNo(r.no);return `<article class="cart-row" data-row="${r.id}" aria-label="明細${i+1} ${p.name}">
 <div class="cart-product"><img src="./_assets/img/product-${String(p.no).padStart(2,'0')}.webp" alt="" width="92" height="75"><div><span class="cart-row-number">明細${i+1} · No.${p.no}</span><h3>${p.name}</h3></div></div>
 <div class="cart-quantity"><label>数量<select data-field="qty" aria-label="明細${i+1}の数量">${Array.from({length:10},(_,j)=>`<option${j+1===r.qty?' selected':''}>${j+1}</option>`).join('')}</select></label><span>${yen(unit(p))} × ${r.qty}</span><strong>${yen(unit(p)==null?null:unit(p)*r.qty)}</strong><button type="button" data-remove="${r.id}" aria-label="明細${i+1}を削除">削除</button></div>
 <div class="cart-pick">
 ${p.delivery?`<label>受け取り方法<select class="${r.method?'':'pickup-unselected'}" aria-required="true" data-field="method" aria-label="明細${i+1}の受け取り方法"><option value="">選択してください</option><option value="store"${r.method==='store'?' selected':''}>店頭受け取り</option><option value="delivery"${r.method==='delivery'?' selected':''}>福岡県内配達</option></select></label>`:''}
 ${r.method==='store'?`<label>受け取り場所<select class="${r.pickup?'':'pickup-unselected'}" aria-required="true" data-field="pickup" aria-label="明細${i+1}の受け取り場所">${options(p.pickup,r.pickup)}</select></label>`:r.method==='delivery'?'<p class="delivery-info">ご入力の住所へ配達します。<br>配達料：申込施設ごとに1,000円<br><small>※配達時間は前後する可能性があります。</small></p>':p.delivery?'<p class="delivery-info pickup-unselected-text">受け取り方法を選択してください。</p>':''}
 ${r.method==='delivery'?`<label>配達希望日<select class="${r.date?'':'pickup-unselected'}" aria-required="true" data-field="date" aria-label="明細${i+1}の配達希望日">${deliveryDates(p.dates,r.date)}</select></label><label>受け取り希望時間<select class="${r.time?'':'pickup-unselected'}" aria-required="true" data-field="time" aria-label="明細${i+1}の受け取り希望時間">${options(DELIVERY_TIMES,r.time)}</select></label>`:`<label>受け取り日時<select class="${r.date?'':'pickup-unselected'}" aria-required="true" data-field="date" aria-label="明細${i+1}の受け取り日時">${options(p.dates,r.date)}</select></label>`}
 </div>
 ${r.pickup&&r.method==='store'?`<p class="cart-address">${LOCATIONS[r.pickup]?.addr||''} <a href="${locMapUrl(r.pickup)}" target="_blank" rel="noopener">地図を見る ↗</a></p>`:''}
 <div class="cart-row-actions"><button type="button" data-copy="${r.id}">同じ商品を別の受け取り分として追加</button></div>
 </article>`;}).join(''):'<div class="cart-empty"><strong>カートに商品が入っていません</strong><p>商品一覧で数量を選び、「カートに追加」を押してください。</p><a href="#catalog">商品を見る →</a></div>';
 const t=totals();
 document.getElementById('cartTotals').innerHTML=`<div class="cart-total-lines"><span>商品小計（税込）</span><b>${yen(t.subtotal)}</b><span>配達料${t.fees.size?'（'+t.fees.size+'施設分）':''}</span><b>${yen(t.fees.size*1000)}</b></div><div class="totalbar"><span>合計 ${t.quantity}点（税込）</span><b>${yen(t.total)}</b></div><p class="hint">商品代金の内消費税：${yen(t.productTax)}／配達料は税込</p>`;
 document.getElementById('dockTotal').textContent=`カート ${t.quantity}点　${yen(t.total)}`;
 document.querySelector('.cart-dock')?.classList.toggle('has-items',cart.length>0);
 document.querySelectorAll('input[name="ptier"]').forEach(el=>el.checked=el.value===tier);
 document.querySelector('.tier-static').classList.toggle('tier-unselected',!tier);
 document.getElementById('tier-prompt').hidden=!!tier;
 persist();
 if(focus){const el=cartItems.querySelector(`[data-row="${focus.id}"] [data-field="${focus.field}"]`);el?.focus({preventScroll:true});}
}
function toast(text){const el=document.getElementById('cartToast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3500);}
function setMsg(text,cls){msg.textContent=text;msg.className='form-msg '+(cls||'');if(cls==='err')msg.scrollIntoView({behavior:'smooth',block:'center'});}
productGrid.addEventListener('click',e=>{
 const b=e.target.closest('[data-order]');if(!b)return;const p=byNo(b.dataset.order),qty=Number(document.querySelector(`[data-addqty="${p.no}"]`).value);
 const existing=cart.find(r=>r.no===p.no&&!r.pickup&&!r.date&&r.method==='store'&&r.qty+qty<=10);
 if(existing)existing.qty+=qty;else cart.push({id:++serial,no:p.no,qty,method:p.delivery?'':'store',pickup:'',date:'',time:''});
 invalidate();renderCart();toast(`${p.name} ${qty}点をカートに追加しました`);
});
cartItems.addEventListener('change',e=>{const field=e.target.dataset.field;if(!field)return;const r=cart.find(r=>r.id===Number(e.target.closest('[data-row]').dataset.row));r[field]=field==='qty'?Number(e.target.value):e.target.value;invalidate();renderCart({id:r.id,field});});
cartItems.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.remove){const index=cart.findIndex(r=>r.id===Number(b.dataset.remove));cart.splice(index,1);invalidate();renderCart();const next=cartItems.querySelector('select');(next||document.getElementById('cart')).focus({preventScroll:true});toast('商品をカートから削除しました');}
 if(b.dataset.copy){const r=cart.find(r=>r.id===Number(b.dataset.copy));const id=++serial;const p=byNo(r.no);cart.push({id,no:r.no,qty:1,method:p.delivery?'':'store',pickup:'',date:'',time:''});invalidate();renderCart({id,field:'qty'});cartItems.querySelector(`[data-row="${id}"]`).scrollIntoView({behavior:'smooth',block:'center'});toast('別の受け取り分を1点追加しました。場所と日時を指定してください。');}

});
document.querySelectorAll('[name="ptier"]').forEach(el=>el.addEventListener('change',()=>{tier=el.value;invalidate();renderCart();}));
document.querySelectorAll('.fs-ctrl button').forEach(b=>b.addEventListener('click',()=>{document.body.classList.remove('fs-1','fs-2');if(Number(b.dataset.fs))document.body.classList.add('fs-'+b.dataset.fs);document.querySelectorAll('.fs-ctrl button').forEach(x=>x.classList.toggle('active',x===b));}));
form.addEventListener('input',invalidate);
form.addEventListener('change',()=>{review.hidden=true;});
document.getElementById('backToCart').addEventListener('click',()=>{review.hidden=true;const el=document.getElementById('cart');el.focus({preventScroll:true});el.scrollIntoView({behavior:'smooth',block:'start'});});
form.addEventListener('submit',e=>{
 e.preventDefault();invalidate();if(!cart.length){setMsg('商品をカートに追加してください。','err');return;}
 if(!tier){setMsg('価格区分を選択してください。','err');document.querySelector('[name="ptier"]').focus();return;}
 const incomplete=cart.find(r=>!r.date||(r.method==='store'&&!r.pickup)||(byNo(r.no).delivery&&(!r.method||(r.method==='delivery'&&!r.time))));
 if(incomplete){setMsg('各商品の受け取り方法・場所・日時を選択してください。','err');const field=byNo(incomplete.no).delivery&&!incomplete.method?'method':incomplete.method==='delivery'&&!incomplete.time?'time':incomplete.method==='store'&&!incomplete.pickup?'pickup':'date';const el=cartItems.querySelector(`[data-row="${incomplete.id}"] [data-field="${field}"]`);el.focus();return;}
 const fd=new FormData(form);for(const name of ['name','zip','address','tel','email']){if(!String(fd.get(name)||'').trim()){setMsg('お客様情報の必須項目をご入力ください。','err');form.elements[name].focus();return;}}
 if(!/^\d{7}$/.test(String(fd.get('zip')).replace(/-/g,''))){setMsg('郵便番号は7桁でご入力ください。','err');return;}
 if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fd.get('email'))){setMsg('メールアドレスの形式をご確認ください。','err');return;}
 if(!document.getElementById('agree').checked){setMsg('テストページの確認にチェックを入れてください。','err');return;}
 const t=totals();let summary=`【価格区分】${tier==='special'?'特別価格（メモリード会員）':'一般価格'}\n`;
 Object.entries(FACILITIES).forEach(([id,f])=>{const rows=cart.filter(r=>byNo(r.no).facilityId===id);if(!rows.length)return;let subtotal=0;summary+=`\n■ ${f.name}\n`;rows.forEach(r=>{const p=byNo(r.no);subtotal+=unit(p)*r.qty;summary+=`No.${p.no} ${p.name}\n  ${r.qty}点 × ${yen(unit(p))} = ${yen(unit(p)==null?null:unit(p)*r.qty)}\n  ${r.method==='delivery'?'福岡県内配達（ご入力の住所へ）':'店頭受け取り：'+r.pickup}\n  ${r.date}${r.method==='delivery'?' '+r.time:''}\n`;});summary+=`施設別小計：${yen(subtotal+(t.fees.has(id)?1000:0))}${t.fees.has(id)?'（配達料1,000円を含む）':''}\n`;});
 summary+=`\n合計 ${t.quantity}点：${yen(t.total)}（税込）\n商品代金の内消費税：${yen(t.productTax)}\n配達料：${yen(t.fees.size*1000)}\n\n【お客様情報】\n${fd.get('name')}\n〒${fd.get('zip')} ${fd.get('address')}\n${fd.get('tel')}\n${fd.get('email')}\n【備考】${fd.get('note')||'なし'}`;
 document.getElementById('testSummary').textContent=summary;review.hidden=false;review.scrollIntoView({behavior:'smooth',block:'start'});
});
renderCart();
