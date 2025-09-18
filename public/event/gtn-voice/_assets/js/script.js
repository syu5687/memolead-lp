/***************************************************************************
*
* SCRIPT JS
*
***************************************************************************/
document.addEventListener('DOMContentLoaded', () => {

	// 1. スクロールで追従ナビゲーションを表示
	const stickyNav = document.getElementById('sticky-nav');
	// 最初のセクションの高さを取得し、それを超えたらnavを表示
	const firstSection = document.querySelector('.content-section');
	
	window.addEventListener('scroll', () => {
		if (window.scrollY > firstSection.offsetTop) {
			stickyNav.classList.add('visible');
		} else {
			stickyNav.classList.remove('visible');
		}
	});

	// 2. Swiper.jsでスライダーを初期化
	// Hotelスライダー
	const hotelSwiper = new Swiper('.hotel-swiper', {
		loop: true,
		pagination: {
			el: '.swiper-pagination',
			clickable: true,
		},
		navigation: {
			nextEl: '.swiper-button-next',
			prevEl: '.swiper-button-prev',
		},
	});

	// Restaurantスライダー
	const restaurantSwiper = new Swiper('.restaurant-swiper', {
		loop: true,
		pagination: {
			el: '.swiper-pagination',
			clickable: true,
		},
		navigation: {
			nextEl: '.swiper-button-next',
			prevEl: '.swiper-button-prev',
		},
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

