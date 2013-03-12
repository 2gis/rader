window.onload = function() {
    $('.slider_1').slider({
        trackActive: '.slider__track-active',
        point: '.slider__point',
        runner: '.slider__runner',
        pointInRangeCls: 'slider__point_range_in'
    });

    $('.slider_2').slider({
        trackActive: '.slider__track-active',
        point: '.slider__point',
        runner: '.slider__runner',
        pointInRangeCls: 'slider__point_range_in',
        points: [0, 1, 2, 3, 4.3, 5],
        end: 5,
        runners: [2, 3, 5],
        stickingRadius: 20,
        bumpRadius: 44,
        transCls: 'slider__track_transition_on'
    });

    $('.slider_3').slider({
        trackActive: '.slider__track-active',
        point: '.slider__point',
        runner: '.slider__runner',
        pointInRangeCls: 'slider__point_range_in',
        points: [0, 1, 2, 3, 4.3, 5, 7, 9, 10],
        runners: [2, 3, 5, 9],
        stickingRadius: 99999,
        bumpRadius: 22
    });

    slider({
        root: ('.slider_4'),
        trackActive: '.slider__track-active',
        point: '.slider__point',
        runner: '.slider__runner',
        pointInRangeCls: 'slider__point_range_in',
        points: [0, 1, 2, 3, 4.3, 5, 7, 9, 10],
        runners: [2, 3, 5, 9],
        stickingRadius: 99999,
        bumpRadius: 22,
        selector: qwery, // Selector engine
        event: function(elem, event, func, mode) { // Events manager
            //if (Object.prototype.toString.call(elem) !== "[object Array]") {
            if (!elem.length) {
                elem = [elem]; // bean not supported arrays
            }
             for (var i = 0 ; i < elem.length ; i++) {
                bean[mode || 'on'](elem[i], event, func);
            }
        },
        dom: bonzo // DOM utility
    });
}