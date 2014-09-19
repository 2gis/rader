var count = 0;

/* jshint -W069 */
(function(window, undefined) {
    var $ = window['$'],
        DEBUG = false,
        stage;

    var rader = function(params) {
        params = params || {};
        params['root'] = params['root'] || this;

        return new init(params);
    };

    var directions = {
        '-': { // Direction: left-to-right
            start: 'left',
            client: 'clientWidth',
            offset: 'offsetWidth',
            size: 'width',
            clientX: 'clientX'
        },

        '|': { // top-to-bottom
            start: 'top',
            client: 'clientHeight',
            offset: 'offsetHeight',
            size: 'height',
            clientX: 'clientY'
        }
    };

    if (DEBUG) {
        var error = function(msg) {
            throw new Error(msg);
        };
    }

    /**
     * rader object constructor
     *
     * @param [params['root']] - dom element of rader makeup
     * @param params.dom - dom utility, jQuery or bonzo for example
     * @param params.selector - css selector engine - native, sizzle or qwery
     */
    var init = function(params) {
        var self = this,
            elements = {},
            delta,
            deltaPx, // Ширина всего трека в пикселях
            dir = directions[params.direction || '-'],
            defaultParams,
            dom,
            selector,
            x0drag,
            i,
            drag = -1, // Runner number dragger right now
            runnersInitialPos = [], // Current absolute runners position (before and after drag) in offsets!
            runnersCurrentPc = [], // Current (in drag mode) absolute runners position
            runnersPrevPos = [], // Before tryMove current runners position
            pointsInRange = []; // Bool array

        stage = 'init';
        this.elements = elements;

        // DOM utility
        dom = params['dom'] || $;

        // Selector engine
        selector = params['selector'] || $;

        // Dom initialization
        var track = params['root'][0];
        var trackActive = params['trackActive'];
        var points = params['points'];
        var runners = params['runners'];

        // Params initialization
        defaultParams = { // Default input parameters
            'stickingRadius': 0,
            'bumpRadius': runners[0][dir.offset], // firstRunner.offsetWidth | Height
            'points': [], // Ссылки на дом-элементы, которые будут привязаны к значениям pointsPos
            'pointsPos': [0, 10], // Позиция виртуальных точек, линейно связанная с пикселями (например мы разбиваем равномерно интервал на N частей)
            'runnersPos': [] // Начальная позиция бегунков
        };

        for (var key in defaultParams) {
            if (params[key] === undefined) {
                params[key] = defaultParams[key];
            }
        }

        var pointsPos = params['pointsPos'],
            runnersPos = params['runnersPos'],
            runnersVal = params['runnersVal'],
            start,
            end,
            values = params['values'];

        start = pointsPos[0];
        end = pointsPos[pointsPos.length - 1];
        if (!values) {
            values = pointsPos;
        }
        for (i = 0 ; i < values.length ; i++) {
            values[i] = +values[i]; // str to float
        }
        if (runnersVal && !runnersPos.length) { // Задали положение бегунков по значениям шкалы, но не задали runnersPos
            for (i = 0 ; i < runnersVal.length ; i++) {
                runnersPos[i] = val2x(runnersVal[i]);
            }
        }
        if (!runnersPos.length) {
            runnersPos = [start, end];
        }

        delta = Math.abs(end - start);

        // Validation (dev mode)
        if (DEBUG) {
            // if (pointsPos && pointsPos.length !== points.length) {
            //     console.error('pointsPos.length !== points.length');
            // }
            if (runners.length != runners.length) {
                error('runners.length !== runners.length');
            }
            if (!selector) {
                error('No selector engine found');
            }
            if (!dom) {
                error('No dom utility found');
            }
        }

        // iOs support
        function getClientX(event) {
            return event[dir.clientX] || (((event['originalEvent'] || event)['touches'] || [])[0] || {})['pageX'];
        }

        // Text selection preventing on drag
        function selection(enable) {
            if (enable) {
                $(document)['on']('selectstart.rader', function() {
                    return false;
                });
            } else {
                $(document)['off']('selectstart.rader');
            }
        }

        function getMax(arr) {
            return Math.max.apply(Math, arr);
        }

        function getMin(arr) {
            return Math.min.apply(Math, arr);
        }

        // Returns true if two arrays is equal
        function isEqual(arr1, arr2) {
            if (arr1.length != arr2.length) {
                return false;
            }

            for (var i = 0 ; i < arr1.length ; i++) {
                if (arr1[i] !== arr2[i]) {
                    return false;
                }
            }

            return true;
        }

        function limitPos(x) {
            if (x > 100) {
                x = 100;
            }

            if (x < 0) {
                x = 0;
            }

            return x;
        }

        // Converting scale (user-defined) dimension to percent dimension
        var xToPcMem = [];
        function xToPc(x) {
            if (xToPcMem[x] === undefined) {
                xToPcMem[x] = limitPos(((x - start) / delta) * 100);
            }

            return xToPcMem[x];
        }

        var pcToXMem = [];
        function pcToX(px) {
            if (pcToXMem[px] === undefined) {
                pcToXMem[px] = px / 100 * delta + start;
            }

            return pcToXMem[px];
        }

        // Преобразуем значение слайдера в заданную шкалу значений
        function x2val(x) {
            var minVal = values[0],
                maxVal = values[values.length - 1];

            if (!values) return x;

            // Ищем индекс i где в интервале i, i + 1 находится x
            var i = 0;
            while (pointsPos[i + 1] && !(x >= pointsPos[i] && x <= pointsPos[i + 1])) {
                i++;
            }

            var x1 = pointsPos[i],
                x2 = pointsPos[i + 1] || x1,
                v1 = values[i],
                v2 = values[i + 1] || v1,
                val;

            if (x2 - x1 <= 0) {
                x2 = end;
                x1 = start;
            }

            if (params['scale'] == 'log') {
                val = Math.exp((x - x1) / (x2 - x1) * (Math.log(v2) - Math.log(v1)) + Math.log(v1));
            } else { // linear
                val = (x - x1) / (x2 - x1) * (v2 - v1) + v1;
            }

            // Fallbacks when not in range (299.99999995 instead of 300)
            if (val < minVal) return minVal;
            if (val > maxVal) return maxVal;

            return val;
        }

        // Обратное преобразование - значения со шкалы в относительную линейную координату
        function val2x(val) {
            var minX = pointsPos[0],
                maxX = pointsPos[pointsPos.length - 1];

            if (!pointsPos) return val;

            // Ищем индекс i где в интервале i, i + 1 находится val
            var i = 0;
            while (values[i + 1] && !(val >= values[i] && val <= values[i + 1])) {
                i++;
            }

            if (i == values.length - 1) {
                i--;
            }

            var val1 = values[i],
                val2 = values[i + 1],
                x1 = pointsPos[i],
                x2 = pointsPos[i + 1],
                x;

            if (params['scale'] == 'log') {
                //val = Math.exp((x - x1) / (x2 - x1) * (Math.log(v2) - Math.log(v1)) + Math.log(v1));
                x = (Math.log(val) - Math.log(val1)) / (Math.log(val2) - Math.log(val1)) * (x2 - x1) + x1;
            } else { // linear
                x = (val - val1) / (val2 - val1) * (x2 - x1) + x1;
            }

            // Fallbacks when not in range (299.99999995 instead of 300)
            if (x < minX) return minX;
            if (x > maxX) return maxX;

            return x;
        }

        // Getting coordinate of closest to @x point
        function getXofClosestPoint(x) {
            var xret = x,
                dx,
                px,
                dxmin = 9999;

            for (var i = 0 ; i < pointsPos.length ; i++) {
                px = xToPc(pointsPos[i]);

                dx = Math.abs(px - x);

                if (dx < dxmin) {
                    xret = px;
                    dxmin = dx;
                }
            }

            return xret;
        }

        // Getting coordinate of closest to @x point from (sign > 0) right / bottom or (sign < 0) left / top
        function getNextStableX(x, sign) {
            var px, dx, dxCl, dxmin = 1 / 0, xret = x, xofClosestPoint = getXofClosestPoint(x);
            var stick = params['stickingRadius'] * 100 / deltaPx; // actual stick in px

            dxCl = Math.abs(xofClosestPoint - x);

            // No x correction needed (because x is outside of points gravity)
            if (dxCl > stick) { // 1
                return x;
            }

            for (var i = 0 ; i < pointsPos.length ; i++) { // 2
                px = xToPc(pointsPos[i]);
                dx = Math.abs(px - x);

                if ((px * sign > x * sign) && dx < dxmin) {
                    dxmin = dx;
                    xret = px;
                }
            }

            if (dxmin < stick) { // 2, 4 (partially)
                return xret;
            }

            if (dxmin >= stick) { // 3, 4
                x = limitPos(x - dxCl * sign + stick * sign);

                if (Math.abs(xret - x) < stick) {
                    return xret;
                } else {
                    return x;
                }
            }
        }

        var stickTimeout;
        function tryMoveRunner(drag, num, x) {
            var sign;

            function next(num) {
                return num + 1 * sign;
            }

            // Moving direction
            if (stage == 'init') {
                sign = +1;
            } else {
                var x0 = runnersCurrentPc[drag] || 0;
                if (x > x0) {
                    sign = +1;
                } else if (x < x0) {
                    sign = -1;
                } else {
                    return false; // No main coordinate change
                }

                x = limitPos(x);

                if (drag != num) { // Bumping runner
                    x = getNextStableX(x, sign);
                }
            }

            // Sticking runner
            var xSticky = getXofClosestPoint(x);
            var stick = params['stickingRadius'] * 100 / deltaPx; // actual stick in px
            if (xSticky !== undefined && xSticky !== x && Math.abs(xSticky - x) < stick) {
                if (!stickTimeout && params['transCls']) {
                    dom(track)['addClass'](params['transCls']);
                    stickTimeout = setTimeout(function() {
                        dom(track)['removeClass'](params['transCls']);
                        stickTimeout = undefined;
                    }, 500);
                }
                x = xSticky;
            }

            // Bumping neighbour runners
            var bump = params['bumpRadius'] * 100 / deltaPx; // actual bump in pc
            if (runnersCurrentPc[next(num)] !== undefined &&
                (((runnersCurrentPc[next(num)] - x) < bump && sign > 0) ||
                ((x - runnersCurrentPc[next(num)]) < bump && sign < 0))) {
                var xofNextRunner = tryMoveRunner(drag, next(num), x + sign * bump);

                if (x * sign > (xofNextRunner - bump * sign) * sign) {
                    x = getNextStableX(xofNextRunner - bump * sign, -sign);
                }
            }

            // Positioning elements runner
            runnersCurrentPc[num] = x;
            var pos = {};
            pos[dir.start] = runnersCurrentPc[num] + '%';
            dom(runners[num])['css'](pos);

            return x;
        }

        // Updating points look (in range | not in range)
        function updatePoints(force) {
            if (params['pointInRangeCls']) {
                // Cloning pointsInRange to pointsWasInRange
                var pointsWasInRange = pointsInRange.slice(),
                    i;

                for (i = 0 ; i < points.length ; i++) {
                    if (xToPc(pointsPos[i]) >= runnersCurrentPc[0] && xToPc(pointsPos[i]) <= runnersCurrentPc[runnersCurrentPc.length - 1]) {
                        pointsInRange[i] = 1;
                    } else {
                        pointsInRange[i] = 0;
                    }
                }

                for (i = 0 ; i < pointsInRange.length ; i++) {
                    if (pointsInRange[i] != pointsWasInRange[i] || force) { // Mega profit (+few ms per point change)
                        if (pointsInRange[i]) {
                            dom(points[i])['addClass'](params['pointInRangeCls']);
                        } else {
                            dom(points[i])['removeClass'](params['pointInRangeCls']);
                        }
                    }
                }
            }
        }

        function updatePositions(force) {
            // Updating activation state of all points
            updatePoints(force);

            // Positioning active track
            var pos = {};
            pos[dir.start] = getMin(runnersCurrentPc) + '%';
            pos[dir.size] = (getMax(runnersCurrentPc) - getMin(runnersCurrentPc)) + '%';
            dom(trackActive)['css'](pos);

            if (params['onUpdate']) {
                params['onUpdate']({
                    'minPos': getMin(runnersCurrentPc),
                    'maxPos': getMax(runnersCurrentPc),
                    'minVal': pcToX(getMin(runnersCurrentPc)),
                    'maxVal': pcToX(getMax(runnersCurrentPc))
                });
            }
        }

        function update(event, force) {
            if (event) {
                var pxperpc = 100 / deltaPx,
                    clientX = getClientX(event),
                    dx = (clientX - x0drag) * pxperpc,
                    x;

                x = xToPc(runnersInitialPos[drag]) + dx;

                for (var i = 0 ; i < runnersCurrentPc.length ; i++) {
                    runnersPrevPos[i] = runnersCurrentPc[i];
                }

                tryMoveRunner(drag, drag, limitPos(x));
            }

            if (!isEqual(runnersCurrentPc, runnersPrevPos) || force) {
                updatePositions(force);
            }
        }

        // Возвращает объект с текущими параметрами для юзерских колбеков на события
        function getEvent() {
            var minPos = getMin(runnersCurrentPc), // pc
                maxPos = getMax(runnersCurrentPc),
                minVal = x2val(pcToX(minPos)), // val
                maxVal = x2val(pcToX(maxPos));

            // Слипание значений соседних бегунков
            if (params['collapseVals']) {
                var bump = params['bumpRadius'] * 100 / deltaPx; // actual bump in pc
                if (maxPos - minPos < bump + 1.e-5) { // Самые дальние бегунки на расстоянии слипания
                    // var stickX = getXofClosestPoint(minPos); // Ближайшая точка прилипания

                    // Сначала проверяем на попадание одной из точек на край диапазона
                    // console.log('end', end, maxVal);
                    if (maxPos == 100) {
                        minVal = maxVal;
                    } else if (minPos == 0) {
                        maxVal = minVal;
                    } else { // Если не на краю, выставляет оба значения активного бегунка
                        if (runnersCurrentPc[drag] === minPos) {
                            maxVal = minVal;
                        } else {
                            minVal = maxVal;
                        }
                    }
                }
            }

            return {
                'minPos': minPos,
                'maxPos': maxPos,
                'minVal': minVal,
                'maxVal': maxVal
            };
        }

        // Вызывается по moveEnd
        function onChange() {
            if (params['change']) {
                params['change'](getEvent());
            }
        }

        // Вызывается на событии move
        function onMove() {
            if (params['move']) {
                params['move'](getEvent());
            }
        }

        // подготавливает внутренние переменные для работы слайдера
        function setup() {
            deltaPx = track[dir.client]; // Размер трека нужен уже сейчас
            runnersInitialPos = runnersPos.slice();

            for (var i = 0 ; i < runnersPos.length ; i++) {
                runnersCurrentPc[i] = xToPc(runnersInitialPos[i]);
                // runnersCurrentPc[i] = i;
            }
            for (i = 0 ; i < runnersPos.length ; i++) {
                self['pos'](i, runnersInitialPos[i]); // Эмулируем действия юзера для бампинга
                runnersCurrentPc[i] = xToPc(runnersInitialPos[i]);
            }
        }

        // Обновляет все размеры при ресайзе контейнера
        function updateSizes() {
            deltaPx = track[dir.client];
            xToPcMem = [];
            pcToXMem = [];

            var pos,
                i;
            // Coordinates initialization
            for (i = 0 ; i < pointsPos.length ; i++) {
                pos = {};
                pos[dir.start] = xToPc(pointsPos[i]) + '%';
                dom(points[i])['css'](pos);
            }

            // Runners position & drag initialization
            for (i = 0 ; i < runnersInitialPos.length ; i++) {
                pos = {};
                runnersCurrentPc[i] = xToPc(runnersInitialPos[i]);
                pos[dir.start] = runnersCurrentPc[i] + '%';
                dom(runners[i])['css'](pos);
            }

            // Active track position initialization
            var x1 = xToPc(runnersInitialPos[0]),
                x2 = xToPc(runnersInitialPos[runnersInitialPos.length - 1]);

            pos = {};
            pos[dir.start] = x1 + '%';
            pos[dir.size] = Math.abs(x2 - x1) + '%';
            dom(trackActive)['css'](pos);
        }

        // Dragend
        $(document)['on']('mouseup.rader blur.rader touchend.rader', function() {
            if (drag != -1) {
                for (var i = 0, len = runnersInitialPos.length; i < len; i++) {
                    runnersInitialPos[i] = pcToX(runnersCurrentPc[i]); // Updating initial pos at dragend
                }

                onChange();

                selection(1); // Enable text selection
            }

            drag = -1;
        });

        // Dragstart
        $(document)['on']('mousedown.rader touchstart.rader', function(e) { // document, not window, for ie8
            x0drag = getClientX(e);
        });

        $(document)['on']('mousemove.rader touchmove.rader', function(e) { // document, not window, for ie8
            if (drag != -1) {
                update(e, 0, 1);
                onMove();
            }
        });

        this['pos'] = function(num, pos) { // Emulating drag and drop
            if (pos != null) { // setter mode
                var x = xToPc(pos);

                tryMoveRunner(num, num, x);
                for (var i = 0 ; i < runnersCurrentPc.length ; i++) {
                    runnersInitialPos[i] = pcToX(runnersCurrentPc[i]);
                }
                updatePositions(1);
            }

            return runnersInitialPos[num];
        };

        this['val'] = function(num, val) { // Emulating drag and drop
            if (val != null) { // setter mode
                var pos = val2x(val),
                    x = xToPc(pos);

                tryMoveRunner(num, num, x);
                for (var i = 0 ; i < runnersCurrentPc.length ; i++) {
                    runnersInitialPos[i] = pcToX(runnersCurrentPc[i]);
                }
                updatePositions(1);
            }

            return x2val(runnersInitialPos[num]);
        };

        this['invalidate'] = function() {
            updateSizes();
            updatePositions(1);
            onMove();
        };

        this['dispose'] = function() {
            $(document)['off']('rader');

            $(runners)['off']('rader');
        };

        // Методы выше уже нужны, поэтому код здесь
        for (i = 0 ; i < runnersPos.length ; i++) {
            $(runners[i])['on']('mousedown.rader touchstart.rader', (function(n) {
                return function(e) {
                    if (e.button != 2) {
                        e['preventDefault'](); // Text selection disabling in Opera... and all other browsers?
                        selection(); // Disable text selection in ie8
                        drag = n; // Runner number to be dragged
                    }
                };
            })(i));
        }

        setup();
        updateSizes();

        update(0, 1);

        stage = 'ready';

        return this;
    };

    window['$']['fn']['rader'] = rader;
})(window);