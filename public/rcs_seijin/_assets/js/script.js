/***************************************************************************
*
* SCRIPT JS
*
***************************************************************************/
document.addEventListener('DOMContentLoaded', () => {

  const targets = document.querySelectorAll('.move');

  const observer = new IntersectionObserver((entries, observer) => {
	entries.forEach(entry => {

	  if (entry.isIntersecting) {
		entry.target.classList.add('is-show');
		observer.unobserve(entry.target);
	  }

	});
  }, {
	threshold: 0.2
  });

  targets.forEach(target => observer.observe(target));

});
jQuery(document).ready(function($){
// ここから .chapel 用のSlick初期化コード
$('.thum').slick({
	// PC表示時の設定
	slidesToShow: 1,
	slidesToScroll: 1,
	centerMode: true,
	centerPadding: '60px', // PCでは60pxのパディング
	autoplay: true,
	autoplaySpeed: 2500,
	arrows: false,
	fade:true,
	
	// レスポンシブ設定（スマホ表示時の設定）
	responsive: [
		{
			breakpoint: 768, // 画面幅が768px以下の場合に適用
			settings: {
				slidesToShow: 1,      // スマホでは中央に1枚を大きく表示
				slidesToScroll: 1,
				centerMode: true,     // スマホでも中央モードを有効にする
				centerPadding: '20px' // スマホ向けにパディングを調整（例：20px）
			}
		},
		{
			breakpoint: 480, // 画面幅が480px以下の場合に適用
			settings: {
				slidesToShow: 1,
				slidesToScroll: 1,
				centerMode: true,
				centerPadding: '10px' // さらに小さい画面向けに調整
			}
		}
	]
});
});