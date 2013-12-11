(function(window, undefined) {
    var $ = window.jQuery,
        DEBUG = window.DEBUG;

    var rader = function(params) {
        params = params || {};
        params.root = params.root || this;

        $ = params.$ || $;

        return new init(params);
    };

    if (DEBUG) {
        var error = function(msg) {
            throw new Error(msg);
        };
    }

    /**
     * rader object constructor
     *
     * @param [params.root] - dom element of rader makeup
     * @param params.dom - dom utility, jQuery or bonzo for example
     * @param params.selector - css selector engine - native, sizzle or qwery
     */
    var init = function(params) {
        var self = this,
            elements = {},
            delta,
            deltaPx, // Ширина всего трека в пикселях
            dir = { // Direction: left-to-right | top-to-bottom
                start: 'left',
                client: 'clientWidth',
                offset: 'offsetWidth',
                size: 'width'
            },
            defaultParams,
            event,
            dom,
            selector,
            x0drag,
            i,
            drag = -1, // Runner number dragger right now
            runnersInitialPos = [], // Current absolute runners position (before and after drag) in offsets!
            runnersCurrentPc = [], // Current (in drag mode) absolute runners position
            runnersPrevPos = [], // Before tryMove current runners position
            pointsInRange = []; // Bool array

        this.elements = elements;
        this.params = params;

        // Event manager
        event = params.event || function(elem, event, func, mode) {
            $(elem)[mode || 'on'](event, func);
        };

        // DOM utility
        dom = params.dom || $;

        // Selector engine
        selector = params.selector || $;

        // Dom initialization
        elements.track = params.root[0];
        elements.trackActive = params.trackActive;
        elements.points = params.points;
        elements.runners = params.runners;

        // Params initialization
        defaultParams = { // Default input parameters
            stickingRadius: 0,
            bumpRadius: elements.runners[0][dir.offset], // firstRunner.offsetWidth | Height
            points: [],
            pointsPos: [0, 10], // Позиция точек, линейно связанная с пикселями (например мы разбиваем равномерно интервал на N частей)
            runnersPos: []
        };

        for (var key in defaultParams) {
            if (params[key] === undefined) {
                params[key] = defaultParams[key];
            }
        }
        params.start = params.pointsPos[0];
        params.end = params.pointsPos[params.pointsPos.length - 1];
        if (!params.values) {
            params.values = params.pointsPos;
        }
        if (params.runnersVal && !params.runnersPos.length) { // Задали положение бегунков по значениям шкалы, но не задали runnersPos
            for (i = 0 ; i < params.runnersVal.length ; i++) {
                params.runnersPos[i] = val2x(params.runnersVal[i]);
            }
        }
        if (!params.runnersPos.length) {
            params.runnersPos = [params.start, params.end];
        }

        delta = Math.abs(params.end - params.start);

        // Validation (dev mode)
        if (DEBUG) {
            // if (params.pointsPos && params.pointsPos.length !== elements.points.length) {
            //     console.error('params.pointsPos.length !== elements.points.length');
            // }
            if (params.runners.length != elements.runners.length) {
                error('params.runners.length !== elements.runners.length');
            }
            if (!selector) {
                error('No selector engine found');
            }
            if (!dom) {
                error('No dom utility found');
            }
            if (!event) {
                error('No event manager found');
            }
        }

        // Text selection start preventing
        function dontStartSelect() {
            return false;
        }

        // Text selection preventing on drag
        function selection(enable) {
            event(document, 'selectstart', dontStartSelect, enable ? 'off' : 'on');
        }

        function getMax(arr) {
            var max = -Infinity;

            for (var i = 0, len = arr.length ; i < len ; i++) {
                if (max < arr[i]) {
                    max = arr[i];
                }
            }

            return max;
        }

        function getMin(arr) {
            var min = Infinity;
            
            for (var i = 0, len = arr.length ; i < len ; i++) {
                if (min > arr[i]) {
                    min = arr[i];
                }
            }

            return min;
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
                xToPcMem[x] = limitPos(((x - params.start) / delta) * 100);
            }

            return xToPcMem[x];
        }

        var pcToXMem = [];
        function pcToX(px) {
            if (pcToXMem[px] === undefined) {
                pcToXMem[px] = px / 100 * delta + params.start;
            }

            return pcToXMem[px];
        }

        // Преобразуем значение слайдера в заданную шкалу значений
        function x2val(x) {
            var minVal = params.values[0],
                maxVal = params.values[params.values.length - 1];

            if (!params.values) return x;

            // Ищем индекс i где в интервале i, i+1 находится x
            var i = 0;
            while (params.pointsPos[i+1] && !(x >= params.pointsPos[i] && x <= params.pointsPos[i+1])) {
                i++;
            }

            var x1 = params.pointsPos[i],
                x2 = params.pointsPos[i + 1] || x1,
                v1 = params.values[i],
                v2 = params.values[i + 1] || v1,
                val;

            if (x2 - x1 <= 0) {
                x2 = params.end;
                x1 = params.start;
            }

            if (params.scale == 'log') {
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
            var minX = params.pointsPos[0],
                maxX = params.pointsPos[params.pointsPos.length - 1];

            if (!params.pointsPos) return val;

            // Ищем индекс i где в интервале i, i+1 находится val
            var i = 0;
            while (params.values[i+1] && !(val >= params.values[i] && val <= params.values[i+1])) {
                i++;
            }

            if (i == params.values.length - 1) {
                i--;
            }

            var val1 = params.values[i],
                val2 = params.values[i + 1],
                x1 = params.pointsPos[i],
                x2 = params.pointsPos[i + 1],
                x;

            if (params.scale == 'log') {
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

            for (var i = 0 ; i < params.pointsPos.length ; i++) {
                px = xToPc(params.pointsPos[i]);

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
            var px, dx, dxCl, dxmin = Infinity, xret = x, xofClosestPoint = getXofClosestPoint(x);
            var stick = params.stickingRadius * 100 / deltaPx; // actual stick in px

            dxCl = Math.abs(xofClosestPoint - x);

            // No x correction needed (because x is outside of points gravity)
            if (dxCl > stick) { // 1
                return x;
            }

            for (var i = 0 ; i < params.pointsPos.length ; i++) { // 2
                px = xToPc(params.pointsPos[i]);
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
            if (x > runnersCurrentPc[drag]) {
                sign = +1;
            } else if (x < runnersCurrentPc[drag]) {
                sign = -1;
            } else {
                return false; // No main coordinate change
            }

            x = limitPos(x);

            if (drag != num) { // Bumping runner
                x = getNextStableX(x, sign);
            }

            // Sticking runner
            var xSticky = getXofClosestPoint(x);
            var stick = params.stickingRadius * 100 / deltaPx; // actual stick in px
            if (xSticky !== undefined && xSticky !== x && Math.abs(xSticky - x) < stick) {
                if (!stickTimeout && params.transCls) {
                    dom(elements.track).addClass(params.transCls);
                    stickTimeout = setTimeout(function() {
                        dom(elements.track).removeClass(params.transCls);
                        stickTimeout = undefined;
                    }, 500);
                }
                x = xSticky;
            }

            // Bumping neighbour runners
            var bump = params.bumpRadius * 100 / deltaPx; // actual bump in pc
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
            dom(elements.runners[num]).css(pos);

            return x;
        }

        // Updating points look (in range | not in range)
        function updatePoints(force) {
            if (params.pointInRangeCls) {
                // Cloning pointsInRange to pointsWasInRange
                var pointsWasInRange = pointsInRange.slice(),
                    i;

                for (i = 0 ; i < elements.points.length ; i++) {
                    if (xToPc(params.pointsPos[i]) >= runnersCurrentPc[0] && xToPc(params.pointsPos[i]) <= runnersCurrentPc[runnersCurrentPc.length - 1]) {
                        pointsInRange[i] = 1;
                    } else {
                        pointsInRange[i] = 0;
                    }
                }

                for (i = 0 ; i < pointsInRange.length ; i++) {
                    if (pointsInRange[i] != pointsWasInRange[i] || force) { // Mega profit (+few ms per point change)
                        if (pointsInRange[i]) {
                            dom(elements.points[i]).addClass(params.pointInRangeCls);
                        } else {
                            dom(elements.points[i]).removeClass(params.pointInRangeCls);
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
            dom(elements.trackActive).css(pos);

            if (params.onUpdate) {
                params.onUpdate({
                    minPos: getMin(runnersCurrentPc),
                    maxPos: getMax(runnersCurrentPc),
                    minVal: pcToX(getMin(runnersCurrentPc)),
                    maxVal: pcToX(getMax(runnersCurrentPc))
                });
            }
        }

        function update(event, force) {
            if (event) {
                var pxperpc = 100 / deltaPx,
                    dx = (event.clientX - x0drag) * pxperpc,
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
            if (params.collapseVals) {
                var bump = params.bumpRadius * 100 / deltaPx; // actual bump in pc
                if (maxPos - minPos < bump + 1.e-5) { // Самые дальние бегунки на расстоянии слипания
                    // var stickX = getXofClosestPoint(minPos); // Ближайшая точка прилипания

                    // Сначала проверяем на попадание одной из точек на край диапазона
                    // console.log('params.end', params.end, maxVal);
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
                minPos: minPos,
                maxPos: maxPos,
                minVal: minVal,
                maxVal: maxVal
            };
        }

        // Вызывается по moveEnd
        function onChange() {
            if (params.change) {
                params.change(getEvent());
            }
        }

        // Вызывается на событии move
        function onMove() {
            if (params.move) {
                params.move(getEvent());
            }
        }

        // подготавливает внутренние переменные для работы слайдера
        function setup() {
            runnersInitialPos = params.runnersPos.slice();
            for (var i = 0 ; i < params.runnersPos.length ; i++) {
                runnersCurrentPc[i] = xToPc(runnersInitialPos[i]);
            }
        }

        // Обновляет все размеры при ресайзе контейнера
        function updateSizes() {
            deltaPx = elements.track[dir.client];
            xToPcMem = [];
            pcToXMem = [];

            var pos,
                i;
            // Coordinates initialization
            for (i = 0 ; i < params.pointsPos.length ; i++) {
                pos = {};
                pos[dir.start] = xToPc(params.pointsPos[i]) + '%';
                dom(elements.points[i]).css(pos);
            }

            // Runners position & drag initialization
            for (i = 0 ; i < runnersInitialPos.length ; i++) {
                pos = {};
                runnersCurrentPc[i] = xToPc(runnersInitialPos[i]);
                pos[dir.start] = runnersCurrentPc[i] + '%';
                dom(elements.runners[i]).css(pos);
            }

            // Active track position initialization
            var x1 = xToPc(runnersInitialPos[0]),
                x2 = xToPc(runnersInitialPos[runnersInitialPos.length - 1]);

            pos = {};
            pos[dir.start] = x1 + '%';
            pos[dir.size] = Math.abs(x2 - x1) + '%';
            dom(elements.trackActive).css(pos);
        }

        for (i = 0 ; i < params.runnersPos.length ; i++) {
            event(elements.runners[i], 'mousedown', (function(n) {
                return function(e) {
                    if (e.button != 2) {
                        e.preventDefault(); // Text selection disabling in Opera... and all other browsers?
                        selection(); // Disable text selection in ie8
                        drag = n; // Runner number to be dragged
                    }
                };
            })(i));
        }

        setup();
        updateSizes();

        update(0, 1);

        // Dragend
        event(document, 'mouseup blur', function() {
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
        event(document, 'mousedown', function(e) { // document, not window, for ie8
            x0drag = e.clientX;
        });

        event(document, 'mousemove', function(e) { // document, not window, for ie8
            if (drag != -1) {
                update(e, 0, 1);
                onMove();
            }
        });

        this.setPosition = function(num, pos) { // Emulating drag and drop
            var x = xToPc(pos);

            tryMoveRunner(num, num, x);
            for (var i = 0 ; i < runnersCurrentPc.length ; i++) {
                runnersInitialPos[i] = pcToX(runnersCurrentPc[i]);
            }
            updatePositions(1);
        };

        this.setValue = function(num, val) { // Emulating drag and drop
            var pos = val2x(val),
                x = xToPc(pos);

            tryMoveRunner(num, num, x);
            for (var i = 0 ; i < runnersCurrentPc.length ; i++) {
                runnersInitialPos[i] = pcToX(runnersCurrentPc[i]);
            }
            updatePositions(1);
        };

        this.getPosition = function(num) {
            return runnersInitialPos[num];
        };

        this.getValue = function(num) {
            return x2val(runnersInitialPos[num]);
        };

        this.invalidate = function() {
            updateSizes();
            updatePositions(1);
            onMove();
        };

        return this;
    };

    if ($ && $.fn) {
        $.fn.rader = rader;
    }

    window.rader = rader;
})(window);