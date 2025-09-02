/***************************************************************************
*
* SCRIPT JS
*
***************************************************************************/

$(document).ready(function(){

    
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
});