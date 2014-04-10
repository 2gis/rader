
describe("Инвалидация радера", function() {

    var sliderElem,
        rader;

    before(function() {
        sliderElem = $('#invalidate_slider');
        sliderElem.css('display', 'none');

        window.invalidateRader = rader = sliderElem.rader({
            trackActive: sliderElem.find('.rader__track-active'),
            points: sliderElem.find('.rader__point'),
            runners: sliderElem.find('.rader__runner'),
            pointInRangeCls: 'rader__point_range_in',
            pointsPos: [1, 1.5, 2, 3, 4.3, 5],
            runnersPos: [2, 3, 5],
            stickingRadius: 20,
            bumpRadius: 44,
            transCls: 'rader__track_transition_on',
            change: function(e) {
                $('.out__min').text(e.minVal);
                $('.out__max').text(e.maxVal);
            },
            move: function(e) {
                $('.out__min-move').text(e.minVal);
                $('.out__max-move').text(e.maxVal);
            }
        });

        sliderElem.css('display', '');

        rader.invalidate();
    });

    it("инвалидация не сбрасывает значения", function() {
        assert.ok(rader);

        rader.val(0, 1);
        rader.invalidate();
        assert.equal(rader.val(0), 1);
    });

});