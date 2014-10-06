function initTests(rader, params) {
    assert.ok(rader);
    assert(typeof rader.pos == 'function', 'Есть метод pos');
    assert(typeof rader.val == 'function', 'Есть метод val');
    assert(typeof rader.invalidate == 'function', 'Есть метод invalidate');
}

// Тесты на установку позиции
function posTests() {

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
        twoRunners = '<div class="rader rader_2"><div class="rader__track"><div class="rader__track-active"></div><div class="rader__runner rader__runner_pos_left"></div><div class="rader__runner rader__runner_pos_right"></div></div></div>',
        oneRunner = '<div class="rader rader_2"><div class="rader__track"><div class="rader__track-active"></div><div class="rader__runner"></div></div></div>';

    function init() {
        $('.wrapper').html(twoRunners);

        params = {
            trackActive: $('.rader_2 .rader__track-active'),
            points: $('.rader_2 .rader__point'),
            runners: $('.rader_2 .rader__runner'),
            pointInRangeCls: 'rader__point_range_in',
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

    // for (var i = 0 ; i < 12 ; i++) {
        it('Тесты инициализации', function() {
            init();
            initTests(rader, params);
        });

        it('Тесты pos', function() {
            init();
            posTests(rader, params);
        });

        /*it('Изменение ширины', function() {
            varWidth(rader, params);
        });*/
    // }

    it('. Установка начальных значений', function() {
        $('.wrapper').html(twoRunners);
        params = {
            trackActive: $('.rader_2 .rader__track-active'),
            points: $('.rader_2 .rader__point'),
            runners: $('.rader_2 .rader__runner'),
            pointInRangeCls: 'rader__point_range_in',
            values: [1, 1000],
            runnersVal: [100, 500]
        };

        rader = $('.rader_2').rader(params);

        var val0 = rader.val(0),
            val1 = rader.val(1);

        assert.equal(val0, 100, 'Левое значение выставлено правильно');
        assert.equal(val1, 500, 'Правое значение выставлено правильно');

        rader.invalidate();
    });

    it('. Доразбиение values', function() {
        $('.wrapper').html(twoRunners);
        params = {
            trackActive: $('.rader_2 .rader__track-active'),
            points: $('.rader_2 .rader__point'),
            runners: $('.rader_2 .rader__runner'),
            pointInRangeCls: 'rader__point_range_in',
            pointsPos: [0, 100, 200, 300, 400],
            values: [0, 400],
            runnersVal: [0, 200]
        };

        rader = $('.rader_2').rader(params);

        var pos1 = params.runners[0].offsetLeft / $('.rader_2 .rader__track').width() * 100,
            pos2 = params.runners[1].offsetLeft / $('.rader_2 .rader__track').width() * 100;

        assert.equal(pos1, 0, 'Левое значение выставлено правильно');
        assert(Math.abs(pos2 - 50) < 0.1, 'Правое значение выставлено правильно ' + pos2);

        rader.invalidate();
    });

    it('. Выставление значений только через values', function() {
        var maxVal;
        $('.wrapper').html(twoRunners);
        params = {
            trackActive: $('.rader_2 .rader__track-active'),
            points: $('.rader_2 .rader__point'),
            runners: $('.rader_2 .rader__runner'),
            values: [1, 4],
            onUpdate: function(e) {
                maxVal = e.maxVal;
            }
        };

        rader = $('.rader_2').rader(params);

        assert.equal(maxVal, 4, 'Значение совпадает с values[1]');
    });

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
        //     rader.pos(1, 5);
        //     rader.pos(0, 5);

        //     rader.invalidate();

        //     var val0 = rader.val(0),
        //         val1 = rader.val(1);

        //     console.log('val0, val1', val0, val1);
        // });

        it('. Перемещение левого бегунка в позицию правого приводит к смещению правого', function() {
            init();

            rader.pos(1, 5);
            rader.pos(0, 5);
            rader.invalidate();

            var val0 = rader.val(0),
                val1 = rader.val(1),
                pos0 = rader.pos(0),
                pos1 = rader.pos(1);

            assert(val0 == 5, 'Значение для левого выставилось: ' + val0);
            assert(val0 != val1, 'Значение правого поменялось: ' + val1);
            assert(pos0 == 5, 'Позиция для левого выставилась: ' + pos0);
            assert(pos0 != pos1, 'Позиция правого поменялась: ' + pos1);
        });

        it('. Перемещение левого бегунка в крайне правую позицию приводит к правильному смещению обоих', function() {
            init();

            rader.pos(0, 10);
            rader.invalidate();

            var val0 = rader.val(0),
                val1 = rader.val(1),
                pos0 = rader.pos(0),
                pos1 = rader.pos(1);

            assert(val1 == 10, 'Значение правого бегунка - крайне правое');
            assert(val0 < val1, 'Значение левого бегунка левее крайне правого');
            assert(pos1 == 10, 'Позиция правого бегунка - крайне правоая');
            assert(pos0 < pos1, 'Позиция левого бегунка левее крайне правой');
        });

        it('. Перемещение правого бегунка в крайне левую позицию приводит к правильному смещению обоих', function() {
            init();

            rader.pos(1, 0);
            rader.invalidate();

            var val0 = rader.val(0),
                val1 = rader.val(1),
                pos0 = rader.pos(0),
                pos1 = rader.pos(1);

            assert(val0 == 0, 'Значение левого бегунка - крайне левое');
            assert(val1 > val0, 'Значение правого бегунка правее крайне левого');
            assert(pos0 == 0, 'Позиция левого бегунка - крайне левая');
            assert(pos1 > pos0, 'Позиция правого бегунка правее крайне левой');
        });

        describe('. pos', function() {
            it('. При помещении левого бегунка на правый, их значения в методе move слипаются по левому, но значения из val различаются', function(done) {
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

                        var val0 = rader.val(0),
                            val1 = rader.val(1);

                        assert(val0 == 5, 'Левое значение равно выставленному');
                        assert(val1 > 5, 'Правое значение больше левого');

                        $(document).trigger('blur');

                        done();
                    }
                };

                rader = $('.rader_2').rader(params);

                rader.pos(1, 5);
                rader.pos(0, 5);
                $('.rader_2 .rader__runner_pos_left').trigger('mousedown');
                rader.invalidate();
            });

            it('. Аналогично, при помещении правого бегунка на левый, их значения в методе move слипаются по правому, но значения из val различаются', function(done) {
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

                        var val0 = rader.val(0),
                            val1 = rader.val(1);

                        assert(Math.abs(val1 - 4.01) < 0.0001, 'Правое значение равно выставленному');
                        assert(val0 < 4.01, 'Левое значение меньше правого');

                        $(document).trigger('blur');

                        done();
                    }
                };

                rader = $('.rader_2').rader(params);

                rader.pos(0, 4);
                rader.pos(1, 4.01);
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

                        var val0 = rader.val(0),
                            val1 = rader.val(1);

                        assert(val0 == 0, 'Левое значение на левой границе');
                        assert(val1 > 0, 'Правое значение больше левого');

                        $(document).trigger('blur');

                        done();
                    }
                };

                rader = $('.rader_2').rader(params);

                rader.pos(0, 4);
                rader.pos(1, 0);
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

                        var val0 = rader.val(0),
                            val1 = rader.val(1);

                        assert(val1 == 10, 'Правое значение на правой границе');
                        assert(val0 < 10, 'Левое значение меньше правого');

                        // $(document).trigger('blur');

                        done();
                    }
                };

                rader = $('.rader_2').rader(params);

                rader.pos(1, 4);
                rader.pos(0, 10);
                done();
                // $('.rader_2 .rader__runner_pos_left').trigger('mousedown');
                // rader.invalidate();
            });

            it('. Выставление двух бегунков в одну позицию в момент инициализации не приводит к визуальному слипанию', function() {
                reset();

                params = {
                    trackActive: $('.rader_2 .rader__track-active'),
                    points: $('.rader_2 .rader__point'),
                    runners: $('.rader_2 .rader__runner'),
                    pointInRangeCls: 'rader__point_range_in',
                    bumpRadius: '22',
                    collapseVals: true,
                    runnersVal: [5, 5]
                };

                rader = $('.rader_2').rader(params);

                var pos1 = $('.rader_2 .rader__runner_pos_left').offset().left,
                    pos2 = $('.rader_2 .rader__runner_pos_right').offset().left;
                
                assert(Math.abs(pos2 - pos1) >= 22, 'Позиции должны быть разлеплены: ' + pos1 + ' ' + pos2);
            });

            it('. Выставление трёх бегунков в одну позицию в момент инициализации не приводит к визуальному слипанию', function() {
                reset();

                params = {
                    trackActive: $('#invalidate_slider .rader__track-active'),
                    points: $('#invalidate_slider .rader__point'),
                    runners: $('#invalidate_slider .rader__runner'),
                    pointInRangeCls: 'rader__point_range_in',
                    bumpRadius: '22',
                    collapseVals: true,
                    runnersVal: [5, 5, 5]
                };

                rader = $('#invalidate_slider').rader(params);

                var pos1 = $('#invalidate_slider .rader__runner_pos_left').offset().left,
                    pos2 = $('#invalidate_slider .rader__runner').eq(1).offset().left,
                    pos3 = $('#invalidate_slider .rader__runner_pos_right').offset().left;
                
                var dx = Math.max(Math.abs(pos2 - pos1), Math.abs(pos3 - pos1), Math.abs(pos2 - pos3));
                assert(dx >= 22, 'Позиции должны быть разлеплены: ' + pos1 + ' ' + pos2 + ' ' + pos3);
            });
        });
        

        describe('. val', function() {
            it('. При помещении левого бегунка на правый, их значения в методе move слипаются по левому, но значения из val различаются', function(done) {
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

                        var val0 = rader.val(0),
                            val1 = rader.val(1);

                        assert(val0 == 5, 'Левое значение равно выставленному');
                        assert(val1 > 5, 'Правое значение больше левого');

                        $(document).trigger('blur');

                        done();
                    }
                };

                rader = $('.rader_2').rader(params);

                rader.val(1, 5);
                rader.val(0, 5);
                $('.rader_2 .rader__runner_pos_left').trigger('mousedown');
                rader.invalidate();
            });
        });

        describe('. onUpdate', function() {
            it('. Аргумент-объект имеет правильный формат', function() {
                var event;

                reset();

                params = {
                    trackActive: $('.rader_2 .rader__track-active'),
                    points: $('.rader_2 .rader__point'),
                    runners: $('.rader_2 .rader__runner'),
                    pointInRangeCls: 'rader__point_range_in',
                    bumpRadius: '22',
                    collapseVals: true,
                    onUpdate: function(e) {
                        event = e;
                    }
                };

                rader = $('.rader_2').rader(params);

                event = {};
                rader.val(0, 3);

                assert.equal(event.minVal, 3, 'Значение выставилось');
                assert.equal(event.maxVal, 10);
                assert(event.minPos, 'Поле minPos undefinded');
                assert(event.maxPos, 'Поле maxPos undefinded');
            });
        });
    });

    describe('. Числа передаются в строках', function() {
        function reset() {
            $('.wrapper').html(twoRunners);
        }

        it('. values', function() {
            var event;

            reset();

            params = {
                trackActive: $('.rader_2 .rader__track-active'),
                points: $('.rader_2 .rader__point'),
                runners: $('.rader_2 .rader__runner'),
                values: ['33', '67'],
                move: function(e) {
                    event = e;
                }
            };

            rader = $('.rader_2').rader(params);
            rader.invalidate();

            assert.equal(event.minVal, 33, 'Начальное значение должно выставиться числом');
            assert.equal(event.maxVal, 67, 'Конечное значение должно выставиться числом');
        });

        it('. pointsPos', function() {
            var event;

            reset();

            params = {
                trackActive: $('.rader_2 .rader__track-active'),
                points: $('.rader_2 .rader__point'),
                runners: $('.rader_2 .rader__runner'),
                pointsPos: ['123', '456'],
                move: function(e) {
                    event = e;
                }
            };

            rader = $('.rader_2').rader(params);
            rader.invalidate();

            assert.equal(event.minVal, 123, 'Начальное значение должно выставиться числом');
            assert.equal(event.maxVal, 456, 'Конечное значение должно выставиться числом');
        });
    });

    describe('. Параметр click', function() {
        function reset() {
            $('.wrapper').html(twoRunners);
        }

        it('. false', function() {
            var event;

            reset();

            params = {
                track: $('.rader_2 .rader__track'),
                trackActive: $('.rader_2 .rader__track-active'),
                points: $('.rader_2 .rader__point'),
                runners: $('.rader_2 .rader__runner'),
                click: false,
                move: function(e) {
                    event = e;
                }
            };

            rader = $('.rader_2').rader(params);

            var e = new jQuery.Event("click");
            e.clientX = 400;
            $(params.trackActive).trigger(e);

            rader.invalidate();

            assert.equal(event.minVal, 0, 'Начальное значение не должно измениться');
            assert.equal(event.maxVal, 10, 'Конечное значение не должно измениться');
        });

        it('. true', function() {
            var event;

            reset();

            params = {
                track: $('.rader_2 .rader__track'),
                trackActive: $('.rader_2 .rader__track-active'),
                points: $('.rader_2 .rader__point'),
                runners: $('.rader_2 .rader__runner'),
                click: true,
                move: function(e) {
                    event = e;
                }
            };

            rader = $('.rader_2').rader(params);

            var e = new jQuery.Event("click");
            e.clientX = 400;
            $(params.trackActive).trigger(e);

            rader.invalidate();

            assert.notEqual(event.minVal, 0, 'Начальное значение должно измениться');
            assert.equal(event.maxVal, 10, 'Конечное значение не должно измениться');
        });

        it('. Клик в runner не должен приводить к его перемещению', function() {
            var event;

            reset();

            params = {
                track: $('.rader_2 .rader__track'),
                trackActive: $('.rader_2 .rader__track-active'),
                points: $('.rader_2 .rader__point'),
                runners: $('.rader_2 .rader__runner'),
                click: true,
                move: function(e) {
                    event = e;
                }
            };

            rader = $('.rader_2').rader(params);

            var e = new jQuery.Event("click");
            e.clientX = 400;
            $(params.runners).eq(1).trigger(e);

            rader.invalidate();

            assert.equal(event.minVal, 0, 'Начальное значение не должно измениться');
            assert.equal(event.maxVal, 10, 'Конечное значение не должно измениться');
        });
    });

    describe('. Параметр runnersFreeze', function() {
        function reset() {
            $('.wrapper').html(twoRunners);
        }

        it('. Runner не двигается драгом ни бампингом', function() {
            var event;

            reset();

            params = {
                track: $('.rader_2 .rader__track'),
                trackActive: $('.rader_2 .rader__track-active'),
                points: $('.rader_2 .rader__point'),
                runners: $('.rader_2 .rader__runner'),
                runnersVal: [5, 9],
                runnersFreeze: [1, 0],
                move: function(e) {
                    event = e;
                }
            };

            rader = $('.rader_2').rader(params);

            dragRunner($('.rader_2'), 0, 20);
            rader.invalidate();

            assert.equal(event.minVal, 5, 'Начальное значение не должно измениться');
            assert.equal(event.maxVal, 9, 'Конечное значение не должно измениться');

            dragRunner($('.rader_2'), 1, 80);
            rader.invalidate();

            assert(Math.abs(event.minVal - 5) < 0.01, 'Начальное значение не должно измениться');
            assert(Math.abs(event.maxVal - 8) < 0.01, 'Конечное значение должно измениться, ведь оно не заморожено');



            dragRunner($('.rader_2'), 1, 20);
            rader.invalidate();

            assert(Math.abs(event.minVal - 5) < 0.01, 'Начальное значение не должно измениться');
            assert(Math.abs(event.maxVal - 5) < 0.01, 'Конечное значение должно измениться, но должно блокироваться замороженным ранером');
        });

        it('. Клик около замороженного ранера приводит к смещению соседнего, хоть и более дальнего', function() {
            var event;

            reset();

            params = {
                track: $('.rader_2 .rader__track'),
                trackActive: $('.rader_2 .rader__track-active'),
                points: $('.rader_2 .rader__point'),
                runners: $('.rader_2 .rader__runner'),
                runnersVal: [5, 9],
                runnersFreeze: [1, 0],
                click: true,
                move: function(e) {
                    event = e;
                }
            };

            rader = $('.rader_2').rader(params);

            clickTrack($('.rader_2'), 60);
            rader.invalidate();

            assert.equal(event.minVal, 5, 'Начальное значение не должно измениться');
            assert(Math.abs(event.maxVal - 6) < 0.01, 'Конечное значение должно измениться ' + event.maxVal);
        });

        it('. Клик в трек вызывает change', function() {
            var changeEvent,
                moveEvent;

            reset();

            params = {
                track: $('.rader_2 .rader__track'),
                trackActive: $('.rader_2 .rader__track-active'),
                points: $('.rader_2 .rader__point'),
                runners: $('.rader_2 .rader__runner'),
                runnersVal: [5, 9],
                runnersFreeze: [1, 0],
                click: true,
                move: function(e) {
                    moveEvent = e;
                },
                change: function(e) {
                    changeEvent = e;
                }
            };

            rader = $('.rader_2').rader(params);

            clickTrack($('.rader_2'), 60);
            rader.invalidate();

            assert(Math.abs(moveEvent.minPos - 50) < 0.01);
            assert(Math.abs(moveEvent.maxPos - 60) < 0.01);

            assert(Math.abs(changeEvent.minPos - 50) < 0.01);
            assert(Math.abs(changeEvent.maxPos - 60) < 0.01);
        });
    });

    describe('. Одиночка', function() {
        function reset() {
            $('.wrapper').html(oneRunner);
        }

        it('. Работает', function() {
            var event;

            reset();

            params = {
                runners: $('.rader_2 .rader__runner'),
                runnersVal: [5],
                values: [0, 1439],
                move: function(e) {
                    event = e;
                }
            };

            rader = $('.rader_2').rader(params);

            dragRunner($('.rader_2'), 0, 20);
            rader.invalidate();

            assert(Math.abs(event.minPos - 20) < 0.01, 'Начальное значение не должно измениться ' + event.minPos);
            // assert.equal(event.maxVal, 9, 'Конечное значение не должно измениться');
            assert(true);
        });
    });
});