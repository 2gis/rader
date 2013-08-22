function initTests(rader, params) {
    assert.ok(rader);
    assert.ok(rader.elements);
    assert(rader.elements.track.nodeType == 1);
    assert(rader.params === params, 'Параметры радера совпадают с переданными параметрами');
    assert(typeof rader.setPosition == 'function', 'Есть метод setPosition');
    assert(typeof rader.setValue == 'function', 'Есть метод setValue');
    assert(typeof rader.invalidate == 'function', 'Есть метод invalidate');
    if (params.root) assert($(params.root)[0] === rader.elements.track, 'Корневой элемент совпадает с треком');
}

// Тесты на установку позиции
function setPositionTests() {

}

// Тесты на изменение ширины контейнера, содержащего радер
function varWidth(rader, params) {
    $('.wrapper').css({width: '400px'});
    rader.invalidate();
    assert.equal(rader.elements.track.offsetWidth, 400);
    assert.equal(rader.elements.trackActive.offsetWidth, 400);
}

paramsList = [{

}];

describe('Два бегунка.', function() {
    var rader,
        params;

    before(function() {
        var twoRunners = '<div class="rader rader_2"><div class="rader__track"><div class="rader__track-active"></div><div class="rader__runner rader__runner_pos_left"></div><div class="rader__runner rader__runner_pos_left"></div></div></div>';
        $('.wrapper').html(twoRunners);

        params = {
            trackActive: $('.rader_2 .rader__track-active'),
            points: $('.rader_2 .rader__point'),
            runners: $('.rader_2 .rader__runner'),
            pointInRangeCls: 'rader__point_range_in',
            change: function(e) {
                console.log(e);
                $('.out__min').text(e.minVal);
                $('.out__max').text(e.maxVal);
            },
            move: function(e) {
                $('.out__min-move').text(e.minVal);
                $('.out__max-move').text(e.maxVal);
            }
        };

        rader = $('.rader_2').rader(params);
    });

    // for (var i = 0 ; i < 12 ; i++) {
        it('Тесты инициализации', function() {
            initTests(rader, params);
        });

        it('Тесты setPosition', function() {
            setPositionTests(rader, params);
        });

        /*it('Изменение ширины', function() {
            varWidth(rader, params);
        });*/
    // }
});