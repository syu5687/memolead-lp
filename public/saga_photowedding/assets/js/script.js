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
	const smoothScrollTriggers = document.querySelectorAll('a[href^="#"]:not([data-modal-target])');

	smoothScrollTriggers.forEach(anchor => {
		anchor.addEventListener('click', function (e) {
			e.preventDefault();
			const href = this.getAttribute('href');
			if (href === '#' || href === '') return;
			const targetElement = document.querySelector(href);
			if (targetElement) {
				const headerHeight = document.querySelector('.site-header').offsetHeight;
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
		slidesPerView: 1.2,
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
			768: {
				slidesPerView: 3,
				spaceBetween: 40,
				centeredSlides: false,
			}
		}
	});


	/* =========================================
	   4. Place Section (Grid Slideshows)
	   ========================================= */
	const placeItemSwipers = new Swiper(".placeItemSwiper", {
		loop: true,
		effect: "fade",
		fadeEffect: { crossFade: true },
		speed: 2000,
		autoplay: {
			delay: 4000,
			disableOnInteraction: false,
		},
		allowTouchMove: false,
	});


	/* =========================================
	   5. Dress Section Swiper (Auto Carousel)
	   ========================================= */
	const dressSwiper = new Swiper(".dressSwiper", {
		slidesPerView: 1.5,
		spaceBetween: 20,
		centeredSlides: true,
		loop: true,
		speed: 1000,
		autoplay: {
			delay: 2500,
			disableOnInteraction: false,
		},
		breakpoints: {
			768: {
				slidesPerView: 3,
				spaceBetween: 30,
			},
			1024: {
				slidesPerView: 5, // PC: 5枚表示
				spaceBetween: 40,
			}
		}
	});

	/* =========================================
	   6. Dress Modal Swiper (Linked)
	   ========================================= */
	// Initialize Modal Swiper
	const dressModalSwiper = new Swiper(".dressModalSwiper", {
		slidesPerView: 1,
		spaceBetween: 20,
		loop: true,
		navigation: {
			nextEl: ".swiper-button-next",
			prevEl: ".swiper-button-prev",
		},
	});

	// Link Main Dress Slides to Modal Swiper
	const dressSlides = document.querySelectorAll('.dress-slide');
	dressSlides.forEach(slide => {
		slide.addEventListener('click', () => {
			const index = slide.getAttribute('data-slide-index');
			// Wait for modal to open, then slide to specific index
			setTimeout(() => {
				dressModalSwiper.slideToLoop(parseInt(index), 0);
				dressModalSwiper.update();
			}, 50);
		});
	});
	
	/* =========================================
	   7. FormMailer + GAS Notification (埋め込み用)
	   ========================================= */
	// フォームメーラーから書き出したHTMLの<form>に id="contact-form" を付けてください
	const contactForm = document.querySelector('#contact-form'); 
	const gasUrl = "https://script.google.com/macros/s/AKfycbyHQ759W2YiNhWH4lCnLtfsZC4SssM_j5GKivZSoCWaPa4uRH7R7aJGIZjRuaE3LSrA/exec"; // /execで終わるURL
	
	if (contactForm) {
		contactForm.addEventListener('submit', function() {
			const formData = new FormData(this);
			
			fetch(gasUrl, {
				method: "POST",
				body: new URLSearchParams(formData),
				mode: "no-cors" 
			});
			// フォームメーラーへの送信はそのまま継続されます
		});
	}

});
