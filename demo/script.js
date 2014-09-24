window.onload = function() {
    var runnersPos = [1, 3, 5];

    $('.rader_1').rader({
        trackActive: $('.rader_1').find('.rader__track-active'),
        points: $('.rader_1').find('.rader__point'),
        runners: $('.rader_1').find('.rader__runner'),
        pointInRangeCls: 'rader__point_range_in',
        change: function(e) {
            $('.out__min').text(e.minVal.toFixed(2));
            $('.out__max').text(e.maxVal.toFixed(2));
        },
        move: function(e) {
            $('.out__min-move').text(e.minVal.toFixed(2));
            $('.out__max-move').text(e.maxVal.toFixed(2));
        }
    });

    var rader2 = $('.rader_2').rader({
        trackActive: $('.rader_2').find('.rader__track-active'),
        points: $('.rader_2').find('.rader__point'),
        runners: $('.rader_2').find('.rader__runner'),
        pointInRangeCls: 'rader__point_range_in',
        pointsPos: [1, 1.5, 2, 3, 4.3, 5],
        runnersPos: [2, 3, 5],
        stickingRadius: 20,
        bumpRadius: 44,
        transCls: 'rader__track_transition_on',
        change: function(e) {
            $('.out__min').text(e.minVal.toFixed(2));
            $('.out__max').text(e.maxVal.toFixed(2));
        },
        move: function(e) {
            $('.out__min-move').text(e.minVal.toFixed(2));
            $('.out__max-move').text(e.maxVal.toFixed(2));
        }
    });

    rader2.pos(2, 4);

    $('.rader_3').rader({
        trackActive: $('.rader_3').find('.rader__track-active'),
        points: $('.rader_3').find('.rader__point'),
        runners: $('.rader_3').find('.rader__runner'),
        pointInRangeCls: 'rader__point_range_in',
        pointsPos: [0, 1, 2, 3, 4.3, 5, 7, 9, 10],
        runnersPos: [2, 3, 5, 9],
        stickingRadius: 99999,
        bumpRadius: 22,
        // selector: qwery, // Selector engine
        // event: function(elem, event, func, mode) { // Events manager
        //     if (!elem.length) {
        //         elem = [elem]; // bean not supported arrays
        //     }

        //     for (var i = 0 ; i < elem.length ; i++) {
        //         bean[mode || 'on'](elem[i], event, func);
        //     }
        // },
        // dom: bonzo, // DOM utility
        change: function(e) {
            $('.out__min').text(e.minVal.toFixed(2));
            $('.out__max').text(e.maxVal.toFixed(2));
        },
        move: function(e) {
            $('.out__min-move').text(e.minVal.toFixed(2));
            $('.out__max-move').text(e.maxVal.toFixed(2));
        }
    });

    $('.rader_4').rader({
        trackActive: $('.rader_4').find('.rader__track-active'),
        points: $('.rader_4').find('.rader__point'),
        runners: $('.rader_4').find('.rader__runner'),
        pointInRangeCls: 'rader__point_range_in',
        pointsPos: [0, 2.5, 5, 7.5, 10],
        values: [10, 20, 100, 10000, 1000000],
        runnersVal: [20, 20000],
        stickingRadius: 10,
        bumpRadius: 22,
        collapseVals: true,
        scale: 'log',
        transCls: 'rader__track_transition_on', // Not work when not set
        change: function(e) {
            $('.out__min').text(e.minVal.toFixed(2));
            $('.out__max').text(e.maxVal.toFixed(2));
        },
        move: function(e) {
            $('.out__min-move').text(e.minVal.toFixed(2));
            $('.out__max-move').text(e.maxVal.toFixed(2));
        }
    });

    // Вертикальный
    $('.rader_5').rader({
        trackActive: $('.rader_5').find('.rader__track-active'),
        points: $('.rader_5').find('.rader__point'),
        runners: $('.rader_5').find('.rader__runner'),
        pointInRangeCls: 'rader__point_range_in',
        bumpRadius: 200,
        direction: '|',
        change: function(e) {
            $('.out__min').text(e.minVal.toFixed(2));
            $('.out__max').text(e.maxVal.toFixed(2));
        },
        move: function(e) {
            $('.out__min-move').text(e.minVal.toFixed(2));
            $('.out__max-move').text(e.maxVal.toFixed(2));
            var top = e.minVal * 10;
            var height = (e.maxVal - e.minVal) * 10;

            $('.page__col1').css({
                top: top + '%',
                height: height + '%'
            });
        }
    }).pos(0, 4).pos(1, 7).invalidate();

    $('.rader_6').rader({
        track: $('.rader_6').find('.rader__track'),
        trackActive: $('.rader_6').find('.rader__track-active'),
        points: $('.rader_6').find('.rader__point'),
        runners: $('.rader_6').find('.rader__runner'),
        pointInRangeCls: 'rader__point_range_in',
        runnersVal: [ 2, 4, 6 ],
        runnersFreeze: [ 1, 0, 0 ],
        bumpRadius: 22,
        click: true,
        change: function(e) {
            $('.out__min').text(e.minVal.toFixed(2));
            $('.out__max').text(e.maxVal.toFixed(2));
        },
        move: function(e) {
            $('.out__min-move').text(e.minVal.toFixed(2));
            $('.out__max-move').text(e.maxVal.toFixed(2));
        }
    });

    // Horizontal
    $('.rader_7').rader({
        track: $('.rader_7').find('.rader__track'),
        trackActive: $('.rader_7').find('.rader__track-active'),
        points: $('.rader_7').find('.rader__point'),
        runners: $('.rader_7').find('.rader__runner'),
        pointInRangeCls: 'rader__point_range_in',
        bumpRadius: 22,
        click: true,
        runnersVal: [ 2, 7 ],
        change: function(e) {
            $('.out__min').text(e.minVal.toFixed(2));
            $('.out__max').text(e.maxVal.toFixed(2));
        },
        move: function(e) {
            $('.out__min-move').text(e.minVal.toFixed(2));
            $('.out__max-move').text(e.maxVal.toFixed(2));

            var left = e.minVal * 10;
            var width = (e.maxVal - e.minVal) * 10;

            $('.page__col1').css({
                left: left + '%',
                width: width + '%'
            })
        }
    }).pos(0, 2).pos(1, 8).invalidate();

    // @TODO: тест с выставлением значений за пределами диапазона
}