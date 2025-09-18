/***************************************************************************
*
* SCRIPT JS
*
***************************************************************************/
$(document).ready(function(){
	
	// フェードインさせたい要素をすべて取得
	const fadeinTargets = document.querySelectorAll('.fade-in');
	
	// Intersection Observer のオプション設定
	const options = {
  	root: null, // ビューポートを基準にする
  	rootMargin: '0px',
  	threshold: 0.1 // 要素が10%見えたらトリガー
	};
	
	// 要素が画面内に入ったときの処理
	const callback = (entries, observer) => {
  	entries.forEach(entry => {
		// isIntersectingがtrue = 画面内に入った
		if (entry.isIntersecting) {
	  	// 'visible'クラスを追加してアニメーションを発火
	  	entry.target.classList.add('visible');
	  	
	  	// 一度表示されたら、もう監視する必要はないので監視を停止
	  	observer.unobserve(entry.target);
		}
  	});
	};
	
	// Intersection Observer のインスタンスを作成
	const observer = new IntersectionObserver(callback, options);
	
	// 各要素を監視対象に追加
	fadeinTargets.forEach(target => {
  	observer.observe(target);
	});
});

