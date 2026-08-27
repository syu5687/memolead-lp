
document.addEventListener('DOMContentLoaded', function () {

	/* =========================================================
	   ① スクロール演出
	   ========================================================= */
	(function () {
		var flyer = document.querySelector('.main-ttl img');
		var footerBtn = document.querySelector('#footer .footer-btn');

		if (!flyer || !footerBtn) return;

		// 初期状態：ボタンは透明・少し下にずらしておく
		footerBtn.classList.add('fade-in-target');

		var flyerFlashed = false;
		var btnShown = false;

		var observer = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (!entry.isIntersecting) return;

				if (entry.target === flyer && !flyerFlashed) {
					flyerFlashed = true;
					flyer.classList.add('flash-once');
				}

				if (entry.target === footerBtn && !btnShown) {
					btnShown = true;
					// 少し遅らせてふわっと表示
					setTimeout(function () {
						footerBtn.classList.add('is-visible');
					}, 300);
				}
			});
		}, {
			threshold: 0.3
		});

		observer.observe(flyer);
		observer.observe(footerBtn);
	})();


	/* =========================================================
	   ② 予約人数の合計計算
	   ========================================================= */
	(function () {
		// form-mailer のフォームは id が無く name だけなので
		// 属性セレクタ [name="..."] で取得する
		var form = document.querySelector('form[name="form1"]');
		if (!form) return; // フォームが無いページでは何もしない
	
		// 各人数欄（name は HTML 側の入力欄と一致させる）
		var adult  = form.querySelector('[name="field_6301232"]'); // 大人
		var teen   = form.querySelector('[name="field_6301233"]'); // 中高生
		var kid    = form.querySelector('[name="field_6301234"]'); // 小学生
		var infant = form.querySelector('[name="field_6301235"]'); // 幼児
		var total  = form.querySelector('[name="field_6301236"]'); // ご予約人数合計
	
		var inputs = [adult, teen, kid, infant];
	
		// 1つでも取得できなければ処理しない（name 変更時の誤動作防止）
		if (!total || inputs.some(function (el) { return !el; })) return;
	
		// 合計欄は自動計算なので手入力させない
		total.readOnly = true;
	
		// 全角数字を半角に直してから数値化する
		function toNumber(value) {
			var half = String(value).replace(/[０-９]/g, function (s) {
				return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
			});
			var n = parseInt(half, 10);
			return isNaN(n) ? 0 : n; // 空欄・文字入力は 0 として扱う
		}
	
		function calcTotal() {
			var sum = 0;
			inputs.forEach(function (el) {
				sum += toNumber(el.value);
			});
			total.value = sum; // 合計欄へ反映
		}
	
		// 入力のたびに再計算
		inputs.forEach(function (el) {
			el.addEventListener('input', calcTotal);
		});
	
		calcTotal(); // 読み込み直後にも一度実行（ブラウザの入力復元対策）
	})();

});