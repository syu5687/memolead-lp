/***************************************************************************
*
* SCRIPT JS
*
***************************************************************************/
//////////// 金額計算 ////////////
   document.addEventListener("DOMContentLoaded", function () {
     const memberSelect = document.querySelector('select[name="field_5226166"]'); // 会員・非会員
     const countSelect = document.querySelector('select[name="field_5226176"]');  // 個数
     const receiveSelect = document.querySelector('select[name="field_5226308"]'); // 受け取り方法
     const totalDisplay = document.querySelector('input[name="field_5225657_display"]'); // 表示用
     const totalHidden  = document.querySelector('input[name="field_5225657"]');        // 送信用

   
     function calcTotal() {
       // 会員・非会員
       let basePrice = 0;
       if (memberSelect.value === "0") {
         basePrice = 32000; // 会員
       } else if (memberSelect.value === "1") {
         basePrice = 33000; // 非会員
       } else {
         totalInput.value = "";
         return;
       }
   
       // 個数（value が 0〜14 なので +1 する）
       let count = parseInt(countSelect.value, 10);
       if (isNaN(count)) {
         totalInput.value = "";
         return;
       }
       count = count + 1;
   
       // 受け取り方法
       if (receiveSelect.value === "") {
         totalInput.value = "";
         return;
       }
   
       let total = basePrice * count;
       if (receiveSelect.value === "1") {
         total += 2000; // 郵送
       }
   
       // 表示はカンマ付き
       totalDisplay.value = total.toLocaleString();
       // 送信は数値のみ
       totalHidden.value = total;// 数値
       document.querySelector('input[name="field_5231284"]').value = total.toLocaleString(); // カンマ付き
     }
   
     // 変更時に計算を走らせる
     memberSelect.addEventListener("change", calcTotal);
     countSelect.addEventListener("change", calcTotal);
     receiveSelect.addEventListener("change", calcTotal);
   });
   
 //////////// エラーメッセージ //////////// 
   document.addEventListener("DOMContentLoaded", function () {
     const form = document.querySelector('form[name="form1"]');
   
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
         window.scrollTo({ top: 0, behavior: "smooth" }); // エラーが見えるようにスクロール
       }
     });
   });
   