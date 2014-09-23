// Возвращает jQueryEvent событие типа mousedown для радера с координатами x, y
function getMouseDown(x, y) {
    var mousedown = new jQuery.Event('mousedown');

    mousedown.clientX = x;
    mousedown.clientY = y;

    return mousedown;
}

// Возвращает jQueryEvent событие типа mousemove для радера с координатами x, y
function getMouseMove(x, y) {
    var mousemove = new jQuery.Event('mousemove');

    mousemove.clientX = x;
    mousemove.clientY = y;

    return mousemove;
}

// Возвращает jQueryEvent событие типа mouseup для радера с координатами x, y
function getMouseUp(x, y) {
    var mouseup = new jQuery.Event('mouseup');

    mouseup.clientX = x;
    mouseup.clientY = y;

    return mouseup;
}

function getClick(x) {
    var click = new jQuery.Event('click');

    click.clientX = x;

    return click;
}

// Вырабатывает и триггерит события, эмулирующие драг рунера
function dragRunner(root, num, pc) {
    var track = $(root).find('.rader__track');
    var runner = $(root).find('.rader__runner').eq(num);
    var x1 = runner.offset().left;
    var x2 = track.offset().left + track.width() / 100 * pc;

    var md = getMouseDown(x1, 0);
    runner.trigger(md);

    var mm = getMouseMove(x2, 0);
    runner.trigger(mm);

    var mu = getMouseUp(x2, 0);
    runner.trigger(mu);
}

function clickTrack(root, pc) {
    var track = $(root).find('.rader__track');
    var x = track.offset().left + track.width() / 100 * pc;

    var c = getClick(x, 0);
    track.trigger(c);
}