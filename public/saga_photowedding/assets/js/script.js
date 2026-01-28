document.addEventListener('DOMContentLoaded', () => {

	/* =========================================
	   1. モーダルウィンドウの制御
	   ========================================= */
	const openTriggers = document.querySelectorAll('[data-modal-target]');
	const closeButtons = document.querySelectorAll('.modal-close-btn');
	const overlays = document.querySelectorAll('.modal-overlay');

	const openModal = (trigger) => {
		const targetSelector = trigger.getAttribute('data-modal-target');
		const targetModal = document.querySelector(targetSelector);
		if (targetModal) {
			targetModal.classList.add('is-active');
			document.body.style.overflow = 'hidden'; // 背景固定
		}
	};

	const closeModal = (modal) => {
		modal.classList.remove('is-active');
		document.body.style.overflow = ''; // 背景固定解除
	};

	openTriggers.forEach(trigger => {
		trigger.addEventListener('click', (e) => {
			e.preventDefault();
			openModal(trigger);
		});
	});

	closeButtons.forEach(button => {
		button.addEventListener('click', () => {
			const modal = button.closest('.modal');
			closeModal(modal);
		});
	});

	overlays.forEach(overlay => {
		overlay.addEventListener('click', () => {
			const modal = overlay.closest('.modal');
			closeModal(modal);
		});
	});


	/* =========================================
	   2. ヘッダーリンクのスムーススクロール
	   ========================================= */
	// data-modal-target属性を持たないページ内リンクのみ対象にする
	const smoothScrollTriggers = document.querySelectorAll('a[href^="#"]:not([data-modal-target])');

	smoothScrollTriggers.forEach(anchor => {
		anchor.addEventListener('click', function (e) {
			e.preventDefault();

			const href = this.getAttribute('href');
			if (href === '#' || href === '') return;

			const targetElement = document.querySelector(href);
			
			if (targetElement) {
				// 固定ヘッダーの高さを取得
				const headerHeight = document.querySelector('.site-header').offsetHeight;
				
				// 要素の位置 - ヘッダーの高さ = 停止位置
				const elementPosition = targetElement.getBoundingClientRect().top;
				const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

				window.scrollTo({
					top: offsetPosition,
					behavior: "smooth"
				});
			}
		});
	});


	/* =========================================
	   3. Main Plan Swiper（プランのスライダー）
	   ========================================= */
	const swiper = new Swiper(".mySwiper", {
		slidesPerView: 1.2,      // スマホ: 端が見えるように
		spaceBetween: 20,
		centeredSlides: true,
		loop: true,
		speed: 1000,
		autoplay: {
			delay: 3000,
			disableOnInteraction: false,
		},
		pagination: {
			el: ".swiper-pagination",
			clickable: true,
		},
		breakpoints: {
			768: {               // PC以上
				slidesPerView: 3,
				spaceBetween: 40,
				centeredSlides: false,
			}
		}
	});


	/* =========================================
	   4. Place Section (Grid Slideshows)
	   ========================================= */
	// グリッド内の各カード画像をフェード切り替えする設定
	const placeItemSwipers = new Swiper(".placeItemSwiper", {
		loop: true,
		effect: "fade",          // フェード切り替え
		fadeEffect: { crossFade: true },
		speed: 2000,             // ゆっくりフェード
		autoplay: {
			delay: 4000,         // 4秒ごとに切り替え
			disableOnInteraction: false,
		},
		allowTouchMove: false,   // ユーザーのスワイプ操作を無効化（自動再生のみ）
	});

});