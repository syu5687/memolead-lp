/* =========================================================
   script.js
   ガーデンテラス福岡 秋ビアフェス LP 用スクリプト（統合版）

   1) スクロール演出：チラシ画像が画面に入ったら一瞬光る（点滅）、
	  少し遅れて「ご予約はこちら」ボタンがふわっと表示
   2) 予約フォーム制御：
	  - 「ご予約はこちら」ボタンでフォーム表示 → ボタン自体は非表示に
	  - 大人・中高生・小学生・幼児 → 合計人数の自動計算
	  - 前売り／通常価格を日時で自動判定し、合計金額を自動計算
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

		/* 前売り締切：10月2日(金) 0:00 未満なら前売り価格を適用
		   ※年をまたいで使い回す場合は年数（2026）を毎年更新してください */
		var ADVANCE_DEADLINE = new Date(2026, 9, 2, 0, 0, 0); // 月は0始まりなので 9 = 10月

		/* 単価（円）※金額変更時はここだけ書き換え */
		var PRICE = {
			adultAdvance: 6000,  // 大人・前売り
			adultRegular: 6500,  // 大人・当日/通常
			teen: 3000,
			kid: 2000,
			infant: 500
		};

		function isAdvancePeriod() {
			return new Date() < ADVANCE_DEADLINE;
		}

		if (adult && teen && kid && infant && total) {
			function calcTotal() {
				var na = parseInt(adult.value, 10) || 0;
				var nt = parseInt(teen.value, 10) || 0;
				var nk = parseInt(kid.value, 10) || 0;
				var ni = parseInt(infant.value, 10) || 0;

				var sum = na + nt + nk + ni;
				total.value = sum;

				var advance = isAdvancePeriod();
				var adultPrice = advance ? PRICE.adultAdvance : PRICE.adultRegular;

				if (totalMoney) {
					var money = (na * adultPrice) + (nt * PRICE.teen) + (nk * PRICE.kid) + (ni * PRICE.infant);
					totalMoney.value = money.toLocaleString();
				}

				if (priceModeEl) {
					priceModeEl.textContent = advance
						? '※現在「前売り価格」が適用されています（大人 ¥' + PRICE.adultAdvance.toLocaleString() + '）'
						: '※現在「通常価格」が適用されています（大人 ¥' + PRICE.adultRegular.toLocaleString() + '）';
				}
			}

			[adult, teen, kid, infant].forEach(function (el) {
				el.addEventListener('input', calcTotal);
			});

			calcTotal(); // 初期表示時にも一度実行（価格区分の表示のため）
		}

	})();

});