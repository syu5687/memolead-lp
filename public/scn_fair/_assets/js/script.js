/***************************************************************************
*
* SCRIPT JS
*
***************************************************************************/

$(document).ready(function(){
	var $slides = $('.slider img');
	  var current = 0;
	
	  $slides.eq(current).addClass('active');
	
	  setInterval(function(){
		$slides.eq(current).removeClass('active');
		current = (current + 1) % $slides.length;
		$slides.eq(current).addClass('active');
	  }, 3000); // 3秒ごとに切り替え

	
	// Hover Button for All Pages
	$('.hoverJS').hover(function(){
		$(this).stop().fadeTo(200,0.8);
	},function(){
		$(this).stop().fadeTo(200,1);
	});
	
	// FIXED HEADER
	var addClass = true;
	$(window).scroll(function () {
		var hHeader = $("#header").height();
		var header = $("#header");
		if ($(this).scrollTop() > hHeader) {
			if(addClass) {
				header.addClass('sticky');
				// header.css("top", -hHeader);
					// header.animate({top:'0', opacity:'1'}, 500, "swing"); // make effect
					addClass = false;
				}
			} else {
				if($(this).scrollTop() == 0) {
					header.removeClass('sticky');
					header.removeAttr("style");  
					addClass = true;
				}
			}
		});
	
	//Click event to scroll to top
	$('.scrollToTop').click(function(){
		$('html, body').animate({scrollTop : 0},800);
		return false;
	});
	//Click event to show menu
	$('#header .headContent .menuSP').click(function(){
		$(this).toggleClass('active');
		$('#header .headInfo').fadeToggle();
		$('body').toggleClass('lock');
		return false;
	});
	$('.slides').slick({
		dots: true,
		infinite: true,
		arrows: true,
		autoplay: true,
		speed: 1000,
		autoplaySpeed: 3000,
		slidesToShow: 1,
		slidesToScroll: 1,
		// fade: true,
	  });
	
});

