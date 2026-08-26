/* =========================================================
   スクロールで
   1) チラシ画像が画面に入ったら一瞬光る（点滅）
   2) 少し遅れて「ご予約はこちら」ボタンがふわっと表示
   vanilla JS（jQuery不要）
   ========================================================= */
document.addEventListener('DOMContentLoaded', function () {
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
});