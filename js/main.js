prayer.init();

// init douaa after prayer slider
$('.douaa-after-prayer').load('douaa-caroussel.html', function () {
    $(".douaa-slider").slick({
        infinite: true,
        autoplay: true,
        arrows: false,
        pauseOnHover: false,
        pauseOnFocus: false,
        autoplaySpeed: 15000
    });
});
		