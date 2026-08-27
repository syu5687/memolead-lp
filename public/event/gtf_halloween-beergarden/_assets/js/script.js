/* =========================================================
   script.js
   ガーデンテラス福岡 秋ビアフェス LP 用スクリプト（統合版）

   1) スクロール演出：チラシ画像が画面に入ったら一瞬光る（点滅）、
	  少し遅れて「ご予約はこちら」ボタンがふわっと表示
   2) 予約フォーム制御：
	  - 「ご予約はこちら」ボタンでフォーム表示 → ボタン自体は非表示に
	  - 大人・中高生・小学生・幼児 → 合計人数の自動計算
	  - 選んだ「日程」が本日と一致する場合のみ当日料金、
		それ以外は前売り料金として合計金額を自動計算
   ========================================================= */
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
	   ② 予約フォーム制御
	   ========================================================= */
	(function () {

		/* ボタンを押すまでフォームを非表示、押したら表示してスクロール。
		   表示後はボタン（li）自体を非表示にする */
		var toggleBtn = document.getElementById('reserveToggleBtn');
		var reserveArea = document.getElementById('fm-reserve-area');

		if (toggleBtn && reserveArea) {
			toggleBtn.addEventListener('click', function (e) {
				e.preventDefault();
				reserveArea.classList.remove('is-hidden');
				toggleBtn.parentElement.style.display = 'none'; // ボタン（liごと）を非表示
				reserveArea.scrollIntoView({ behavior: 'smooth' });
			});
		}

		/* 人数の自動計算（合計人数・合計金額） */
		var adult = document.getElementById('fm-adult');
		var teen = document.getElementById('fm-teen');
		var kid = document.getElementById('fm-kid');
		var infant = document.getElementById('fm-infant');
		var total = document.getElementById('fm-total');
		var totalMoney = document.getElementById('fm-totalmoney');
		var priceModeEl = document.getElementById('fm-price-mode');
		var dateSelect = document.getElementById('fm-date');

		/* 単価（円）※金額変更時はここだけ書き換え */
		var PRICE = {
			adultAdvance: 6000,  // 大人・前売り（選んだ開催日が今日でない場合）
			adultRegular: 6500,  // 大人・当日（選んだ開催日がまさに今日の場合）
			teen: 3000,
			kid: 2000,
			infant: 500
		};

		/* 選んだ日程が「今日」と一致するかどうかを判定
		   ※日付は index.html の <option data-event-date="YYYY-MM-DD"> から取得。
			 日程を追加・変更する場合は HTML側だけ編集すればOK */
		function isSelectedDateToday() {
			if (!dateSelect || !dateSelect.value) return false;

			var selectedOption = dateSelect.options[dateSelect.selectedIndex];
			var dateStr = selectedOption ? selectedOption.getAttribute('data-event-date') : null;
			if (!dateStr) return false;

			var parts = dateStr.split('-'); // ["2026", "10", "02"]
			var eventDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));

			var today = new Date();
			return eventDate.getFullYear() === today.getFullYear()
				&& eventDate.getMonth() === today.getMonth()
				&& eventDate.getDate() === today.getDate();
		}

		if (adult && teen && kid && infant && total) {
			function calcTotal() {
				var na = parseInt(adult.value, 10) || 0;
				var nt = parseInt(teen.value, 10) || 0;
				var nk = parseInt(kid.value, 10) || 0;
				var ni = parseInt(infant.value, 10) || 0;

				var sum = na + nt + nk + ni;
				total.value = sum;

				var isToday = isSelectedDateToday();
				var adultPrice = isToday ? PRICE.adultRegular : PRICE.adultAdvance;

				if (totalMoney) {
					var money = (na * adultPrice) + (nt * PRICE.teen) + (nk * PRICE.kid) + (ni * PRICE.infant);
					totalMoney.value = money.toLocaleString();
				}

				if (priceModeEl) {
					if (!dateSelect || !dateSelect.value) {
						priceModeEl.textContent = '※日程を選択すると、価格区分が表示されます';
					} else if (isToday) {
						priceModeEl.textContent = '※本日開催日のため「当日価格」が適用されています（大人 ¥' + PRICE.adultRegular.toLocaleString() + '）';
					} else {
						priceModeEl.textContent = '※「前売り価格」が適用されています（大人 ¥' + PRICE.adultAdvance.toLocaleString() + '）';
					}
				}
			}

			[adult, teen, kid, infant].forEach(function (el) {
				el.addEventListener('input', calcTotal);
			});

			if (dateSelect) {
				dateSelect.addEventListener('change', calcTotal);
			}

			calcTotal(); // 初期表示時にも一度実行（価格区分の表示のため）
		}

	})();

});