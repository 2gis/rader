window.onload = function() {
	$('.slider__track').rader({
		trackActive: $('.slider__track-active'),
        points: $('.slider__point'),
        runners: $('.slider__runner'),
        pointInRangeCls: 'filters__rader-point_range_in'
	});
}