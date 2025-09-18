/***************************************************************************
*
* SCRIPT JS
*
***************************************************************************/
document.addEventListener('DOMContentLoaded', () => {

	// 1. スクロールで追従ナビゲーションを表示
	const stickyNav = document.getElementById('sticky-nav');
	const mainElement = document.querySelector('main');
	
	// mainタグの上端からナビゲーションまでの距離を計算
	const navOffsetTop = stickyNav.offsetTop;

	window.addEventListener('scroll', () => {
		// mainタグが画面の上端をどれだけ通り過ぎたか
		const mainScrollTop = mainElement.getBoundingClientRect().top * -1;

		if (mainScrollTop >= navOffsetTop) {
			stickyNav.classList.add('fixed');
		} else {
			stickyNav.classList.remove('fixed');
		}
	});

	// 2. Swiper.jsでスライダーを初期化
	// Hotelスライダー
	const hotelSwiper = new Swiper('.hotel-swiper', {
		loop: true,
		autoplay: { delay: 3000, disableOnInteraction: false },
		pagination: { el: '.swiper-pagination', clickable: true },
		navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
	});
	
	// Hotelスライダー
	const hotelSwiper = new Swiper('.hotel-content-swiper', {
		loop: true,
		autoplay: { delay: 3000, disableOnInteraction: false },
		pagination: { el: '.swiper-pagination', clickable: true },
		navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
	});

	// Restaurantスライダー
	const restaurantSwiper = new Swiper('.restaurant-swiper', {
		loop: true,
		autoplay: { delay: 3500, disableOnInteraction: false },
		pagination: { el: '.swiper-pagination', clickable: true },
		navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
	});

	// 3. 要素をフェードインさせる
	const fadeinTargets = document.querySelectorAll('.fade-in');
	const observer = new IntersectionObserver((entries, observer) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				entry.target.classList.add('visible');
				observer.unobserve(entry.target);
			}
		});
	}, { threshold: 0.1 });

	fadeinTargets.forEach(target => {
		observer.observe(target);
	});

});

