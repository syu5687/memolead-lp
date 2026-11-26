// @version v0002 | 2026-11-26 | アミュプラザくまもと リニューアルキャンペーン LP スクリプト（パネル式フォーム） | /public/ftk-amu/_assets/js/script.js

const CONFIG = {
  ENDPOINT: "https://memolead-ftk-amu.mk-cbe.workers.dev/submit",
  FORM_NAME: "アミュプラザくまもと リニューアルキャンペーン 応募フォーム",
  /* ★プライバシーポリシーのURL（決まったら差し替え） */
  PRIVACY_URL: "#"
};
document.getElementById("privacyLink").href = CONFIG.PRIVACY_URL;

const form=document.getElementById("theForm"), msg=document.getElementById("formMsg"), submitBtn=document.getElementById("submitBtn");
const box=document.getElementById("form");

// 画像がまだ置かれていない場合、壊れた画像アイコンを出さずに灰色の枠だけ残す
document.querySelectorAll(".plan-img img").forEach(img=>img.addEventListener("error",()=>img.remove()));

// エラー文を出す。err のときは揺らして画面中央にスクロールし、見落としを防ぐ
function setMsg(t,cls){msg.textContent=t;msg.className="form-msg"+(cls?" "+cls:""); if(cls==="err"){msg.style.animation="none";void msg.offsetWidth;msg.style.animation="";msg.scrollIntoView({behavior:"smooth",block:"center"});}}

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
    (window.dataLayer=window.dataLayer||[]).push({event:"amu_campaign_submit",form_name:CONFIG.FORM_NAME,plan:d.plan});
    form.style.display="none";
    document.querySelector(".steps").style.display="none";
    const done=document.getElementById("done");done.style.display="block";done.focus();box.scrollIntoView({behavior:"smooth",block:"start"});
  }catch(_){setMsg("送信に失敗しました。時間をおいて再度お試しください。","err");submitBtn.disabled=false;submitBtn.textContent="送信";}
});