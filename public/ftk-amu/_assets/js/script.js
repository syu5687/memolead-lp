// @version v0001 | 2026-11-26 | アミュプラザくまもと リニューアルキャンペーン LP スクリプト | /public/ftk-amu/_assets/js/script.js

const CONFIG = {
  ENDPOINT: "https://memolead-ftk-amu.mk-cbe.workers.dev/submit",
  FORM_NAME: "アミュプラザくまもと リニューアルキャンペーン 応募フォーム",
  /* ★プライバシーポリシーのURL（決まったら差し替え） */
  PRIVACY_URL: "#"
};
document.getElementById("privacyLink").href = CONFIG.PRIVACY_URL;

/* 送信 */
const form=document.getElementById("theForm"), msg=document.getElementById("formMsg"), submitBtn=document.getElementById("submitBtn");
// エラー文を出す。err のときは揺らして画面中央にスクロールし、見落としを防ぐ
function setMsg(t,cls){msg.textContent=t;msg.className="form-msg"+(cls?" "+cls:""); if(cls==="err"){msg.style.animation="none";void msg.offsetWidth;msg.style.animation="";msg.scrollIntoView({behavior:"smooth",block:"center"});}}
form.addEventListener("submit",async e=>{
  e.preventDefault(); setMsg("","");
  const fd=new FormData(form), g=k=>(fd.get(k)||"").toString().trim();
  // 全角数字を半角にし、ハイフン等を除いた数字だけにする（Workerでも同じ処理をする）
  const tel=g("tel").replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xfee0)).replace(/[^\d]/g,"");
  const d={plan:g("plan"),name:g("name"),tel,agree:document.getElementById("agree").checked,
    formName:CONFIG.FORM_NAME,source:location.href};
  if(!d.plan){setMsg("応募するプレゼントをお選びください。","err");return;}
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
    form.style.display="none";const done=document.getElementById("done");done.style.display="block";done.focus();done.scrollIntoView({behavior:"smooth",block:"center"});
  }catch(_){setMsg("送信に失敗しました。時間をおいて再度お試しください。","err");submitBtn.disabled=false;submitBtn.textContent="この内容で応募する";}
});
