/***************************************************************************
*
* SCRIPT JS
*
***************************************************************************/
//////////// 金額計算 ////////////
document.addEventListener("DOMContentLoaded", function () {
  const memberSelect  = document.querySelector('select[name="field_5226166"]'); // 会員・非会員
  const countSelect   = document.querySelector('select[name="field_5226176"]'); // 個数
  const receiveSelect = document.querySelector('select[name="field_5226308"]'); // 受け取り方法
  const totalDisplay  = document.querySelector('input[name="field_5225657_display"]'); // 表示用
  const totalHidden   = document.querySelector('input[name="field_5225657"]');         // 送信用（数値）
  const totalComma    = document.querySelector('input[name="field_5231284"]');         // 送信用（カンマ付き）

  if (!memberSelect || !countSelect || !receiveSelect || !totalDisplay || !totalHidden) {
    return; // フォームが無いページでは何もしない
  }

  const DELIVERY_FEE = 2000; // 配送料（税込・1注文につき）

  // 基本料金（送料別・税込）
  function getBasePrice(memberValue) {
    if (memberValue === "0") return 32000; // 会員
    if (memberValue === "1") return 33000; // 一般（非会員）
    return null;
  }

  function clearTotal() {
    totalDisplay.value = "";
    totalHidden.value = "";
    if (totalComma) totalComma.value = "";
  }

  function calcTotal() {
    const basePrice = getBasePrice(memberSelect.value);
    const countIndex = parseInt(countSelect.value, 10); // value は 0〜14
    const receive = receiveSelect.value;

    if (basePrice === null || isNaN(countIndex) || receive === "") {
      clearTotal();
      return;
    }

    const count = countIndex + 1;
    let total = basePrice * count;
    if (receive === "1") {
      total += DELIVERY_FEE; // 配送希望
    }

    totalDisplay.value = total.toLocaleString();
    totalHidden.value = total;
    if (totalComma) totalComma.value = total.toLocaleString();
  }

  memberSelect.addEventListener("change", calcTotal);
  countSelect.addEventListener("change", calcTotal);
  receiveSelect.addEventListener("change", calcTotal);

  // ページ表示時にも計算（ブラウザが選択値を復元した場合の対策）
  calcTotal();
  // 「戻る」でページが復元された場合にも再計算
  window.addEventListener("pageshow", calcTotal);
  // HTML側で配送オプションを削除した後にも念のため再計算
  setTimeout(calcTotal, 0);
});

//////////// エラーメッセージ ////////////
document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector('form[name="form1"]');
  if (!form) return;

  form.addEventListener("submit", function (e) {
    let isValid = true;

    // 既存のエラーメッセージを削除
    form.querySelectorAll(".error-msg").forEach(el => el.remove());

    // 必須チェック対象
    const requiredFields = [
      { selector: 'select[name="field_5226166"]', label: "会員・非会員" },
      { selector: 'select[name="field_5226176"]', label: "個数" },
      { selector: 'select[name="field_5226308"]', label: "受け取り方法" },
      { selector: 'input[name="field_5224304_sei"]', label: "姓" },
      { selector: 'input[name="field_5224304_mei"]', label: "名" },
      { selector: 'input[name="field_5227151"]', label: "郵便番号" },
      { selector: 'input[name="field_5227164"]', label: "都道府県" },
      { selector: 'input[name="field_5227165"]', label: "市町村区" },
      { selector: 'input[name="field_5227166"]', label: "番地" },
      { selector: 'input[name="field_5224307"]', label: "メールアドレス" },
      { selector: 'input[name="field_5224306"]', label: "電話番号" }
    ];

    requiredFields.forEach(f => {
      const field = form.querySelector(f.selector);
      if (field && !field.value.trim()) {
        isValid = false;
        const msg = document.createElement("div");
        msg.className = "error-msg";
        msg.textContent = "必須入力です";
        field.parentNode.appendChild(msg);
      }
    });

    if (!isValid) {
      e.preventDefault(); // サーバー送信を止める
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
});
