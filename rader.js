/**
 * There several dimensions in rader:
 * - x - pixels dimension
 * - pos - user defined linear scale, 0..10 by default
 * - % - percent linear scale, 0..100 all the time
 * - Value - user defined scale, can be linear, exponentional and linear on intervals, any values allowed
 * pixels are used only in the first place at the begining of the event, then px converted to %
 */

var count = 0;

/* jshint -W069 */
(function(window, $, undefined) {
    var DEBUG = false,
        stage;

    var rader = function(params) {
        params = params || {};
        params['root'] = params['root'] || this;

        return new init(params);
    };

    var directions = {
        '-': { // Direction: left-to-right
            start: 'left',
            offsetStart: 'offsetLeft',
            client: 'clientWidth',
            offset: 'offsetWidth',
            size: 'width',
            clientX: 'clientX',
            pageX: 'pageX'
        },

        '|': { // top-to-bottom
            start: 'top',
            offsetStart: 'offsetTop',
            client: 'clientHeight',
            offset: 'offsetHeight',
            size: 'height',
            clientX: 'clientY',
            pageX: 'pageY'
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
            direction = params.direction || '-',
            dir = directions[direction],
            defaultParams,
            dom,
            selector,
            x0drag,
            i,
            drag = -1, // Runner number dragger right now
            runnersInitialPos = [], // Current absolute runners position (before and after drag) in offsets!
            runnersCurrentPc = [], // Current (in drag mode) absolute (%) runners position
            runnersPrevPos = [], // Before tryMove current runners position
            pointsInRange = []; // Bool array

        stage = 'init';
        this.elements = elements;

        // DOM utility
        dom = params['dom'] || $;

        // Selector engine
        selector = params['selector'] || $;

        // Dom initialization
        var root = params['root'][0];
        var runners = $(params['runners']);

        // Params initialization
        defaultParams = { // Default input parameters
            'stickingRadius': 0,
            'bumpRadius': runners[0][dir.offset], // firstRunner.offsetWidth | Height
            'points': [], // Ссылки на дом-элементы, которые будут привязаны к значениям pointsPos
            'pointsPos': [0, 10], // Позиция виртуальных точек, линейно связанная с пикселями (например мы разбиваем равномерно интервал на N частей)
            'runnersPos': [] // Начальная позиция бегунков
        };

        for (var key in defaultParams) {
            if (params[key] == null) {
                params[key] = defaultParams[key];
            }
        }

        var track = params['track'],
            trackActive = params['trackActive'],
            points = params['points'],
            pointsPos = params['pointsPos'],
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
        // Когда позиций точек много, а значения заданы только крайние, добавляем промежуточные значения
        if (values.length == 2 && pointsPos.length > 2) {
            var k = (values[1] - values[0]) / (pointsPos[pointsPos.length - 1] - pointsPos[0]);

            for (i = 1 ; i < pointsPos.length ; i++) {
                values[i] = values[0] + (pointsPos[i] - pointsPos[0]) * k;
            }
        }
        if (runnersVal && !runnersPos.length) { // Задали положение бегунков по значениям шкалы, но не задали runnersPos
            for (i = 0 ; i < runnersVal.length ; i++) {
                runnersPos[i] = val2pos(runnersVal[i]);
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

        /**
         * @param {Object} event - native or jquery click-event object
         * @param {HTMLElement} relativeTo - element, top left corner of wich will be the coordinates origin (window by default)
         * @return {Number} - position in px of click, absolute by default
         */
        function getClientX(event, relativeTo) {
            var x = event[dir.clientX] || (((event['originalEvent'] || event)['touches'] || [])[0] || {})[dir.pageX]; // iOs support

            if (relativeTo) {
                var rect = relativeTo['getBoundingClientRect']();
                x -= rect[dir.start];
            }

            return x;
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

        // Limiting the % position of x by [0..100]
        function limitPos(x) {
            if (x > 100) {
                x = 100;
            }

            if (x < 0) {
                x = 0;
            }

            return x;
        }

        // Converting pos dimension to % dimension
        var posToPcMem = [];
        function posToPc(x) {
            if (posToPcMem[x] == null) {
                posToPcMem[x] = limitPos(((x - start) / delta) * 100);
            }

            return posToPcMem[x];
        }

        // Converting % dimension to pos dimension
        var pcToPosMem = [];
        function pcToPos(px) {
            if (pcToPosMem[px] == null) {
                pcToPosMem[px] = px / 100 * delta + start;
            }

            return pcToPosMem[px];
        }

        // Converting pos dimension to Value dimension
        function pos2val(x) {
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

        // Converting Value dimension to Pos dimension
        function val2pos(val) {
            if (!pointsPos) return val;

            var minX = pointsPos[0],
                maxX = pointsPos[pointsPos.length - 1];

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

        /**
         * Getting coordinate of closest to pc point
         *
         * @param {Number} pc - coordinate in %
         * @optional {Array} arr - array of X-coordinates, pointsPos by default
         * @optional {String} dimension - supported value: 'pc', otherwise it 'pos'
         * @return {Number} - closest static point coordinate in %
         */
        function getClosest(pc, arr, dimension) {
            var pcret = pc,
                delta,
                runnerPc,
                index = -1,
                minDelta = 1 / 0; // +Infinity

            arr = arr || pointsPos;
            for (var i = 0 ; i < arr.length ; i++) {
                runnerPc = dimension == 'pc' ? arr[i] : posToPc(arr[i]);

                delta = Math.abs(runnerPc - pc);

                if (delta < minDelta && (!params['runnersFreeze'] || !params['runnersFreeze'][i])) {
                    pcret = runnerPc;
                    minDelta = delta;
                    index = i;
                }
            }

            return {
                index: index,
                pc: pcret
            };
        }

        // Getting coordinate of closest to @x point from (sign > 0) right / bottom or (sign < 0) left / top
        function getNextStableX(x, sign) {
            var px, dx, dxCl, dxmin = 1 / 0, xret = x, xofClosestPoint = getClosest(x).pc;
            var stick = params['stickingRadius'] * 100 / deltaPx; // actual stick in px

            dxCl = Math.abs(xofClosestPoint - x);

            // No x correction needed (because x is outside of points gravity)
            if (dxCl > stick) { // 1
                return x;
            }

            for (var i = 0 ; i < pointsPos.length ; i++) { // 2
                px = posToPc(pointsPos[i]);
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
        /**
         * @param {Number} drag - index of initially moving runner
         * @param {Number} num - index of currently moving runner
         * @param {Number} x - %-coordinate of point, to where runner is pulled
         * @return {Number} - new %-coordinate of current (num) runner
         */
        function tryMoveRunner(drag, num, x) {
            var sign;

            if (params['runnersFreeze'] && params['runnersFreeze'][num]) return runnersCurrentPc[num];

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
            var xSticky = getClosest(x).pc;
            var stick = params['stickingRadius'] * 100 / deltaPx; // actual stick in px
            if (xSticky !== undefined && xSticky !== x && Math.abs(xSticky - x) < stick) {
                if (!stickTimeout && params['transCls']) {
                    dom(root)['addClass'](params['transCls']);
                    stickTimeout = setTimeout(function() {
                        dom(root)['removeClass'](params['transCls']);
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
                    if (posToPc(pointsPos[i]) >= runnersCurrentPc[0] && posToPc(pointsPos[i]) <= runnersCurrentPc[runnersCurrentPc.length - 1]) {
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
                    'minVal': pos2val(pcToPos(getMin(runnersCurrentPc))),
                    'maxVal': pos2val(pcToPos(getMax(runnersCurrentPc)))
                });
            }
        }

        function update(x, force) {
            if (x != null) {
                var pxperpc = 100 / deltaPx,
                    dx = (x - x0drag) * pxperpc;

                x = posToPc(runnersInitialPos[drag]) + dx;

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
                minVal = pos2val(pcToPos(minPos)), // val
                maxVal = pos2val(pcToPos(maxPos));

            // Слипание значений соседних бегунков
            if (params['collapseVals']) {
                var bump = params['bumpRadius'] * 100 / deltaPx; // actual bump in pc
                if (maxPos - minPos < bump + 1.e-5) { // Самые дальние бегунки на расстоянии слипания
                    // var stickX = getClosest(minPos); // Ближайшая точка прилипания

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
            deltaPx = root[dir.client]; // Размер трека нужен уже сейчас
            runnersInitialPos = runnersPos.slice();

            for (var i = 0 ; i < runnersPos.length ; i++) {
                runnersCurrentPc[i] = posToPc(runnersInitialPos[i]);
            }
            for (i = 0 ; i < runnersPos.length ; i++) {
                self['pos'](i, runnersInitialPos[i]); // Эмулируем действия юзера для бампинга
                runnersCurrentPc[i] = posToPc(runnersInitialPos[i]);
            }
        }

        // Обновляет все размеры при ресайзе контейнера
        function updateSizes() {
            deltaPx = root[dir.client];
            posToPcMem = [];
            pcToPosMem = [];

            var pos,
                i;
            // Coordinates initialization
            for (i = 0 ; i < pointsPos.length ; i++) {
                pos = {};
                pos[dir.start] = posToPc(pointsPos[i]) + '%';
                dom(points[i])['css'](pos);
            }

            // Runners position & drag initialization
            for (i = 0 ; i < runnersInitialPos.length ; i++) {
                pos = {};
                runnersCurrentPc[i] = posToPc(runnersInitialPos[i]);
                pos[dir.start] = runnersCurrentPc[i] + '%';
                dom(runners[i])['css'](pos);
            }

            // Active track position initialization
            var x1 = posToPc(runnersInitialPos[0]),
                x2 = posToPc(runnersInitialPos[runnersInitialPos.length - 1]);

            pos = {};
            pos[dir.start] = x1 + '%';
            pos[dir.size] = Math.abs(x2 - x1) + '%';
            dom(trackActive)['css'](pos);
        }

        function updateInitialRunnersPos() {
            for (var i = 0, len = runnersInitialPos.length; i < len; i++) {
                runnersInitialPos[i] = pcToPos(runnersCurrentPc[i]); // Updating initial pos at dragend
            }
        }

        // Dragend
        $(document)['on']('mouseup.rader blur.rader touchend.rader', function() {
            if (drag != -1) {
                updateInitialRunnersPos();

                onChange();

                selection(1); // Enable text selection
            }

            drag = -1;
        });

        // Dragstart
        $(document)['on']('mousedown.rader touchstart.rader', function(e) { // document, not window, for ie8
            deltaPx = root[dir.client]; // recalc for resize
            x0drag = getClientX(e);
        });

        $(document)['on']('mousemove.rader touchmove.rader', function(e) { // document, not window, for ie8
            if (drag != -1) {
                var clientX = getClientX(e);
                update(clientX, 0, 1);
                onMove();
            }
        });

        if (params['click']) {
            $(track || root)['on']('click.rader', function(e) {
                var isRunner;

                for (var i = 0 ; i < params['runners'].length ; i++) {
                    isRunner = isRunner || e.target == params['runners'][i];
                }

                if (!isRunner) { // if click was not inside one of the runners
                    var pc = getClientX(e, this) / this[dir.client] * 100; // to %
                    var closest = getClosest(pc, runnersCurrentPc, 'pc');

                    tryMoveRunner(closest.index, closest.index, pc);
                    var clientX = getClientX(e);
                    update(clientX, 1);
                    updateInitialRunnersPos();
                    onMove();
                    onChange();
                }
            });
        }

        this['pos'] = function(num, pos) { // Emulating drag and drop
            if (pos != null) { // setter mode
                var x = posToPc(pos);

                tryMoveRunner(num, num, x);
                updateInitialRunnersPos();
                updatePositions(1);

                return this;
            }

            return runnersInitialPos[num]; // Getter mode
        };

        this['val'] = function(num, val) { // Emulating drag and drop
            if (val != null) { // setter mode
                var pos = val2pos(val),
                    x = posToPc(pos);

                tryMoveRunner(num, num, x);
                for (var i = 0 ; i < runnersCurrentPc.length ; i++) {
                    runnersInitialPos[i] = pcToPos(runnersCurrentPc[i]);
                }
                updatePositions(1);

                return this;
            }

            return pos2val(runnersInitialPos[num]);
        };

        this['invalidate'] = function() {
            updateSizes();
            updatePositions(1);
            onMove();
        };

        this['dispose'] = function() {
            $(document)['off']('rader');
            $(runners)['off']('rader');
            $(track)['off']('rader');
            $(root)['off']('rader');
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

        update(null, 1);

        stage = 'ready';

        $(root)[0].setAttribute('data-rader-inited', direction);

        return this;
    };

    window['$']['fn']['rader'] = rader;
})(window, $);