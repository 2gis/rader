function initTests(rader, params) {
    assert.ok(rader);
    assert(typeof rader.setPosition == 'function', 'Есть метод setPosition');
    assert(typeof rader.setValue == 'function', 'Есть метод setValue');
    assert(typeof rader.invalidate == 'function', 'Есть метод invalidate');
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
        params,
        twoRunners = '<div class="rader rader_2"><div class="rader__track"><div class="rader__track-active"></div><div class="rader__runner rader__runner_pos_left"></div><div class="rader__runner rader__runner_pos_right"></div></div></div>';

    before(function() {
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

    describe('. Слипание бегунков', function() {
        function reset() {
            $('.wrapper').html(twoRunners);
        }

        function init() {
            reset();

            params = {
                trackActive: $('.rader_2 .rader__track-active'),
                points: $('.rader_2 .rader__point'),
                runners: $('.rader_2 .rader__runner'),
                pointInRangeCls: 'rader__point_range_in',
                bumpRadius: '22',
                collapseVals: true,
                change: function(e) {
                    $('.out__min').text(e.minVal);
                    $('.out__max').text(e.maxVal);
                },
                move: function(e) {
                    $('.out__min-move').text(e.minVal);
                    $('.out__max-move').text(e.maxVal);
                }
            };

            rader = $('.rader_2').rader(params);
        }

        // it.only('. Перемещение бегунка в позицию на bump от второго приводит к слипанию значений', function() {
        //     rader.setPosition(1, 5);
        //     rader.setPosition(0, 5);

        //     rader.invalidate();

        //     var val0 = rader.getValue(0),
        //         val1 = rader.getValue(1);

        //     console.log('val0, val1', val0, val1);
        // });

        it('. Перемещение левого бегунка в позицию правого приводит к смещению правого', function() {
            init();

            rader.setPosition(1, 5);
            rader.setPosition(0, 5);
            rader.invalidate();

            var val0 = rader.getValue(0),
                val1 = rader.getValue(1),
                pos0 = rader.getPosition(0),
                pos1 = rader.getPosition(1);

            assert(val0 == 5, 'Значение для левого выставилось: ' + val0);
            assert(val0 != val1, 'Значение правого поменялось: ' + val1);
            assert(pos0 == 5, 'Позиция для левого выставилась: ' + pos0);
            assert(pos0 != pos1, 'Позиция правого поменялась: ' + pos1);
        });

        it('. Перемещение левого бегунка в крайне правую позицию приводит к правильному смещению обоих', function() {
            init();

            rader.setPosition(0, 10);
            rader.invalidate();

            var val0 = rader.getValue(0),
                val1 = rader.getValue(1),
                pos0 = rader.getPosition(0),
                pos1 = rader.getPosition(1);

            assert(val1 == 10, 'Значение правого бегунка - крайне правое');
            assert(val0 < val1, 'Значение левого бегунка левее крайне правого');
            assert(pos1 == 10, 'Позиция правого бегунка - крайне правоая');
            assert(pos0 < pos1, 'Позиция левого бегунка левее крайне правой');
        });

        it('. Перемещение правого бегунка в крайне левую позицию приводит к правильному смещению обоих', function() {
            init();

            rader.setPosition(1, 0);
            rader.invalidate();

            var val0 = rader.getValue(0),
                val1 = rader.getValue(1),
                pos0 = rader.getPosition(0),
                pos1 = rader.getPosition(1);

            assert(val0 == 0, 'Значение левого бегунка - крайне левое');
            assert(val1 > val0, 'Значение правого бегунка правее крайне левого');
            assert(pos0 == 0, 'Позиция левого бегунка - крайне левая');
            assert(pos1 > pos0, 'Позиция правого бегунка правее крайне левой');
        });

        describe('. setPosition', function() {
            it('. При помещении левого бегунка на правый, их значения в методе move слипаются по левому, но значения из getValue различаются', function(done) {
                reset();

                params = {
                    trackActive: $('.rader_2 .rader__track-active'),
                    points: $('.rader_2 .rader__point'),
                    runners: $('.rader_2 .rader__runner'),
                    pointInRangeCls: 'rader__point_range_in',
                    bumpRadius: '22',
                    collapseVals: true,
                    move: function(e) {
                        assert(e.minVal == e.maxVal, 'Значения слиплись');
                        assert(e.minVal == 5, 'Значения в событии равны выставленному');

                        var val0 = rader.getValue(0),
                            val1 = rader.getValue(1);

                        assert(val0 == 5, 'Левое значение равно выставленному');
                        assert(val1 > 5, 'Правое значение больше левого');

                        $(document).trigger('blur');

                        done();
                    }
                };

                rader = $('.rader_2').rader(params);

                rader.setPosition(1, 5);
                rader.setPosition(0, 5);
                $('.rader_2 .rader__runner_pos_left').trigger('mousedown');
                rader.invalidate();
            });

            it('. Аналогично, при помещении правого бегунка на левый, их значения в методе move слипаются по правому, но значения из getValue различаются', function(done) {
                reset();

                params = {
                    trackActive: $('.rader_2 .rader__track-active'),
                    points: $('.rader_2 .rader__point'),
                    runners: $('.rader_2 .rader__runner'),
                    pointInRangeCls: 'rader__point_range_in',
                    bumpRadius: '22',
                    collapseVals: true,
                    move: function(e) {
                        assert(e.maxVal == e.minVal, 'Значения слиплись');
                        assert(Math.abs(e.maxVal - 4.01) < 0.0001, 'Значения в событии равны выставленному');

                        var val0 = rader.getValue(0),
                            val1 = rader.getValue(1);

                        assert(Math.abs(val1 - 4.01) < 0.0001, 'Правое значение равно выставленному');
                        assert(val0 < 4.01, 'Левое значение меньше правого');

                        $(document).trigger('blur');

                        done();
                    }
                };

                rader = $('.rader_2').rader(params);

                rader.setPosition(0, 4);
                rader.setPosition(1, 4.01);
                $('.rader_2 .rader__runner_pos_right').trigger('mousedown');
                rader.invalidate();
            });

            it('. При угоне правого в крайне левое положение, значения слипаются в минимум диапазона (а не по правому)', function(done) {
                reset();

                params = {
                    trackActive: $('.rader_2 .rader__track-active'),
                    points: $('.rader_2 .rader__point'),
                    runners: $('.rader_2 .rader__runner'),
                    pointInRangeCls: 'rader__point_range_in',
                    bumpRadius: '22',
                    collapseVals: true,
                    move: function(e) {
                        assert(e.maxVal == e.minVal, 'Значения слиплись');
                        assert(e.maxVal == 0, 'Значения в событии на крайне левой границе');

                        var val0 = rader.getValue(0),
                            val1 = rader.getValue(1);

                        assert(val0 == 0, 'Левое значение на левой границе');
                        assert(val1 > 0, 'Правое значение больше левого');

                        $(document).trigger('blur');

                        done();
                    }
                };

                rader = $('.rader_2').rader(params);

                rader.setPosition(0, 4);
                rader.setPosition(1, 0);
                $('.rader_2 .rader__runner_pos_right').trigger('mousedown');
                rader.invalidate();
            });

            it('. При угоне левого в крайне правое положение, значения слипаются в максимуме диапазона (а не по левому)', function(done) {
                reset();

                params = {
                    trackActive: $('.rader_2 .rader__track-active'),
                    points: $('.rader_2 .rader__point'),
                    runners: $('.rader_2 .rader__runner'),
                    pointInRangeCls: 'rader__point_range_in',
                    bumpRadius: '22',
                    collapseVals: true,
                    move: function(e) {
                        assert(e.maxVal == e.minVal, 'Значения слиплись');
                        assert(e.minVal == 10, 'Значения в событии на крайне правой границе');

                        var val0 = rader.getValue(0),
                            val1 = rader.getValue(1);

                        assert(val1 == 10, 'Правое значение на правой границе');
                        assert(val0 < 10, 'Левое значение меньше правого');

                        // $(document).trigger('blur');

                        done();
                    }
                };

                rader = $('.rader_2').rader(params);

                rader.setPosition(1, 4);
                rader.setPosition(0, 10);
                done();
                // $('.rader_2 .rader__runner_pos_left').trigger('mousedown');
                // rader.invalidate();
            });
        });
        

        describe('. setValue', function() {
            it('. При помещении левого бегунка на правый, их значения в методе move слипаются по левому, но значения из getValue различаются', function(done) {
                reset();

                params = {
                    trackActive: $('.rader_2 .rader__track-active'),
                    points: $('.rader_2 .rader__point'),
                    runners: $('.rader_2 .rader__runner'),
                    pointInRangeCls: 'rader__point_range_in',
                    bumpRadius: '22',
                    collapseVals: true,
                    move: function(e) {
                        assert(e.minVal == e.maxVal, 'Значения слиплись');
                        assert(e.minVal == 5, 'Значения в событии равны выставленному');

                        var val0 = rader.getValue(0),
                            val1 = rader.getValue(1);

                        assert(val0 == 5, 'Левое значение равно выставленному');
                        assert(val1 > 5, 'Правое значение больше левого');

                        $(document).trigger('blur');

                        done();
                    }
                };

                rader = $('.rader_2').rader(params);

                rader.setValue(1, 5);
                rader.setValue(0, 5);
                $('.rader_2 .rader__runner_pos_left').trigger('mousedown');
                rader.invalidate();
            });
        });

    });
























});