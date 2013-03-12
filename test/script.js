window.onload = function() {
    $('.rader_1').rader({
        trackActive: '.rader__track-active',
        point: '.rader__point',
        runner: '.rader__runner',
        pointInRangeCls: 'rader__point_range_in'
    });

    $('.rader_2').rader({
        trackActive: '.rader__track-active',
        point: '.rader__point',
        runner: '.rader__runner',
        pointInRangeCls: 'rader__point_range_in',
        points: [1, 1.5, 2, 3, 4.3, 5],
        runners: [2, 3, 5],
        stickingRadius: 20,
        bumpRadius: 44,
        transCls: 'rader__track_transition_on'
    });

    // $('.rader_3').rader({
    //     trackActive: '.rader__track-active',
    //     point: '.rader__point',
    //     runner: '.rader__runner',
    //     pointInRangeCls: 'rader__point_range_in',
    //     points: [0, 1, 2, 3, 4.3, 5, 7, 9, 10],
    //     runners: [2, 3, 5, 9],
    //     stickingRadius: 99999,
    //     bumpRadius: 22
    // });

    rader({
        root: $('.rader_3'),
        trackActive: '.rader__track-active',
        point: '.rader__point',
        runner: '.rader__runner',
        pointInRangeCls: 'rader__point_range_in',
        points: [0, 1, 2, 3, 4.3, 5, 7, 9, 10],
        runners: [2, 3, 5, 9],
        stickingRadius: 99999,
        bumpRadius: 22,
        selector: qwery, // Selector engine
        event: function(elem, event, func, mode) { // Events manager
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