// @version v0003 | 2026-11-27 | アミュプラザくまもと リニューアルキャンペーン LP スクリプト（LP骨組み・追従ボタン・LINE・パネル式フォーム） | /public/ftk-amu/_assets/js/script.js

const CONFIG = {
  ENDPOINT: "https://memolead-ftk-amu.mk-cbe.workers.dev/submit",
  FORM_NAME: "アミュプラザくまもと リニューアルキャンペーン 応募フォーム",
  /* ★プライバシーポリシーのURL（決まったら差し替え） */
  PRIVACY_URL: "#",
  /* ★公式LINEの友だち追加URL（決まったら差し替え） */
  LINE_URL: "#",
  /* ★応募締切（決まったら差し替え。「応募の流れ」に表示される） */
  DEADLINE: "●●●●年●月●日"
};
// URLや締切はここ（CONFIG）だけで管理し、ページ内の該当箇所すべてに反映する（書き換え漏れを防ぐため）
document.querySelectorAll("#privacyLink, .js-privacy").forEach(a=>a.href=CONFIG.PRIVACY_URL);
document.querySelectorAll(".js-line").forEach(a=>{
  a.href=CONFIG.LINE_URL;
  a.addEventListener("click",()=>track({event:"amu_line_click"}));
});
document.querySelectorAll(".js-deadline").forEach(el=>el.textContent=CONFIG.DEADLINE);

// GTMにイベントを送る共通処理（名前・電話番号などの個人情報は送らない）
function track(obj){(window.dataLayer=window.dataLayer||[]).push(obj);}

// 応募ボタンのクリック計測。どの位置のボタン（FV／中間／追従）から押されたかを placement で区別する
document.querySelectorAll(".js-cta").forEach(a=>a.addEventListener("click",()=>track({event:"amu_cta_click",placement:a.dataset.placement})));

/* 追従ボタン：FVのボタンが画面から消えたら表示し、応募フォームが見えている間は隠す（フォームの送信ボタンと重ねないため） */
(()=>{
  const bar=document.getElementById("fixedCta"), fvCta=document.querySelector(".fv-cta"), formSec=document.getElementById("form");
  if(!bar||!fvCta||!formSec||!("IntersectionObserver" in window)) return;
  let pastFv=false, formVisible=false;
  const update=()=>{
    const show=pastFv&&!formVisible;
    bar.classList.toggle("is-show",show);
    bar.setAttribute("aria-hidden",String(!show));
    bar.querySelector("a").tabIndex=show?0:-1;
  };
  // FVのボタンが画面の上へ消えたら「通過した」とみなす（下にあるうちは表示しない）
  new IntersectionObserver(([e])=>{pastFv=!e.isIntersecting&&e.boundingClientRect.top<0;update();}).observe(fvCta);
  new IntersectionObserver(([e])=>{formVisible=e.isIntersecting;update();},{rootMargin:"0px 0px -15% 0px"}).observe(formSec);
})();

const form=document.getElementById("theForm"), msg=document.getElementById("formMsg"), submitBtn=document.getElementById("submitBtn");
const box=document.getElementById("form");

// 画像がまだ置かれていない場合、壊れた画像アイコンを出さずに灰色の枠だけ残す
document.querySelectorAll(".plan-img img").forEach(img=>img.addEventListener("error",()=>img.remove()));

// エラー文を出す。err のときは揺らして画面中央にスクロールし、見落としを防ぐ
function setMsg(t,cls){msg.textContent=t;msg.className="form-msg"+(cls?" "+cls:""); if(cls==="err"){msg.style.animation="none";void msg.offsetWidth;msg.style.animation="";msg.scrollIntoView({behavior:"smooth",block:"center"});}}

// 入力をやり直したら、前のエラー文は消す（直したのにエラーが残って見えるのを防ぐ）
form.addEventListener("change",()=>{ if(msg.classList.contains("err")) setMsg("",""); });
form.addEventListener("input",()=>{ if(msg.classList.contains("err")) setMsg("",""); });

/* パネル切り替え：STEP 1（プラン選択）⇔ STEP 2（お客様情報） */
function showStep(n){
  document.querySelectorAll("[data-panel]").forEach(p=>p.hidden = p.dataset.panel!==String(n));
  document.querySelectorAll("[data-step-no]").forEach(s=>s.classList.toggle("is-on", s.dataset.stepNo===String(n)));
  setMsg("","");
  // 切り替え後はフォームの先頭に戻す（スマホで下にスクロールしたまま次のパネルが始まらないように）
  box.scrollIntoView({behavior:"smooth",block:"start"});
  // STEP 2 ではすぐ入力できるよう、お名前欄にカーソルを置く
  if(n===2) setTimeout(()=>form.elements.name.focus({preventScroll:true}),300);
}

document.getElementById("nextBtn").addEventListener("click",()=>{
  const checked=form.querySelector("input[name=plan]:checked");
  if(!checked){setMsg("ご希望のプランをお選びください。","err");return;}
  // STEP 2 の上部に、選んだプランを表示して確認できるようにする
  document.getElementById("pickedPlan").textContent=checked.closest(".plan").querySelector(".plan-tt").textContent;
  showStep(2);
});
document.getElementById("backBtn").addEventListener("click",()=>showStep(1));

/* 送信 */
form.addEventListener("submit",async e=>{
  e.preventDefault(); setMsg("","");
  const fd=new FormData(form), g=k=>(fd.get(k)||"").toString().trim();
  // 全角数字を半角にし、ハイフン等を除いた数字だけにする（Workerでも同じ処理をする）
  const tel=g("tel").replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xfee0)).replace(/[^\d]/g,"");
  const d={plan:g("plan"),name:g("name"),tel,agree:document.getElementById("agree").checked,
    formName:CONFIG.FORM_NAME,source:location.href};
  if(!d.plan){showStep(1);setMsg("ご希望のプランをお選びください。","err");return;}
  if(!d.name){setMsg("お名前をご入力ください。","err");return;}
  if(!/^0\d{9,10}$/.test(tel)){setMsg("電話番号をご確認ください。","err");return;}
  if(!d.agree){setMsg("プライバシーポリシーへの同意にチェックを入れてください。","err");return;}
  // 二重送信を防ぐため、送信中はボタンを押せなくする
  submitBtn.disabled=true;submitBtn.textContent="送信中…";
  try{
    const r=await fetch(CONFIG.ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)});
    if(!r.ok)throw new Error("status "+r.status);
    // GTMで generate_lead／広告CVのトリガーにするカスタムイベント（名前・電話番号は送らない）
    track({event:"amu_campaign_submit",form_name:CONFIG.FORM_NAME,plan:d.plan});
    form.style.display="none";
    document.querySelector(".steps").style.display="none";
    const done=document.getElementById("done");done.style.display="block";done.focus();box.scrollIntoView({behavior:"smooth",block:"start"});
  }catch(_){setMsg("送信に失敗しました。時間をおいて再度お試しください。","err");submitBtn.disabled=false;submitBtn.textContent="送信";}
});
