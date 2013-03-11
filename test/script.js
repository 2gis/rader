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
}