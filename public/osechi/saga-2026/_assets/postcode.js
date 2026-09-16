const zip=document.getElementById("zip");
const zipBtn=document.getElementById("zipBtn");
const addr=document.getElementById("address");

// zipcloud を JSONP で呼び出し（CORSの影響を受けない）
let zipReqId=0;
function lookupZip(){
  const code=zip.value.replace(/[^0-9]/g,"");
  if(code.length!==7){setMsg("郵便番号は7桁でご入力ください。","err");return;}
  zipBtn.disabled=true;zipBtn.textContent="検索中…";
  const cb="__zipcb"+(++zipReqId);
  let s=null;
  const cleanup=()=>{ try{delete window[cb];}catch(_){window[cb]=undefined;} if(s&&s.parentNode)s.parentNode.removeChild(s); zipBtn.disabled=false;zipBtn.textContent="住所を自動入力"; };
  const timer=setTimeout(()=>{ setMsg("住所の取得に失敗しました。番地とあわせて手入力でお願いします。","err"); cleanup(); },8000);
  window[cb]=function(res){
    clearTimeout(timer);
    if(res&&res.results&&res.results[0]){
      const a=res.results[0];
      invalidate();
      addr.value=`${a.address1}${a.address2}${a.address3}`;
      addr.focus();
      setMsg("住所を反映しました。番地・建物名をご入力ください。","ok");
    }else{
      setMsg("該当する住所が見つかりませんでした。手入力でお願いします。","err");
    }
    cleanup();
  };
  s=document.createElement("script");
  s.src=`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${code}&callback=${cb}`;
  s.onerror=()=>{ clearTimeout(timer); setMsg("住所の取得に失敗しました。番地とあわせて手入力でお願いします。","err"); cleanup(); };
  document.body.appendChild(s);
}
zipBtn.addEventListener("click",lookupZip);
// 7桁入力で自動反映
zip.addEventListener("input",()=>{ if(zip.value.replace(/[^0-9]/g,"").length===7) lookupZip(); });

