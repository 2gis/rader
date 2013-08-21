(function(window, undefined) {
    var $ = window.jQuery;

    var rader = function(params) {
        params = params || {};
        params.root = params.root || this;

        $ = params.$ || $;

        return new init(params);
    };

    function error(msg) {
        throw new Error(msg);
    }

    /**
     * rader object constructor
     *
     * @param [params.root] - dom element of rader makeup
     * @param params.dom - dom utility, jQuery or bonzo for example
     * @param params.selector - css selector engine - native, sizzle or qwery
     */
    var init = function(params) {
        var elements = {},
            delta,
            deltaPx,
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
            drag = -1, // No runner dragged
            runnersInitialPos = [], // Current absolute runners position (before and after drag)
            runnersCurrentPos = [], // Current (in drag mode) absolute runners position
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
            for (var i = 0 ; i < params.runnersVal.length ; i++) {
                params.runnersPos[i] = val2x(params.runnersVal[i]);
            }
        }
        if (!params.runnersPos.length) {
            params.runnersPos = [params.start, params.end];
        }

        delta = Math.abs(params.end - params.start);

        // Validation (dev mode)
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
            if (x > deltaPx) {
                x = deltaPx;
            }

            if (x < 0) {
                x = 0;
            }

            return x;
        }

        // Converting scale (user-defined) dimension to pixel dimension
        var xToPxMem = [];
        function xToPx(x) {
            if (xToPxMem[x] === undefined) {
                xToPxMem[x] = limitPos(((x - params.start) / delta) * deltaPx);
            }

            return xToPxMem[x];
        }

        var pxToXMem = [];
        function pxToX(px) {
            if (pxToXMem[px] === undefined) {
                pxToXMem[px] = px / deltaPx * delta + params.start;
            }

            return pxToXMem[px];
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
                px = xToPx(params.pointsPos[i]);

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

            dxCl = Math.abs(xofClosestPoint - x);

            // No x correction needed (because x is outside of points gravity)
            if (dxCl > params.stickingRadius) { // 1
                return x;
            }

            for (var i = 0 ; i < params.pointsPos.length ; i++) { // 2
                px = xToPx(params.pointsPos[i]);
                dx = Math.abs(px - x);

                if ((px * sign > x * sign) && dx < dxmin) {
                    dxmin = dx;
                    xret = px;
                }
            }

            if (dxmin < params.stickingRadius) { // 2, 4 (partially)
                return xret;
            }

            if (dxmin >= params.stickingRadius) { // 3, 4
                x = limitPos(x - dxCl * sign + params.stickingRadius * sign);

                if (Math.abs(xret - x) < params.stickingRadius) {
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
            if (x > runnersCurrentPos[drag]) {
                sign = +1;
            } else if (x < runnersCurrentPos[drag]) {
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
            if (xSticky !== undefined && xSticky !== x && Math.abs(xSticky - x) < params.stickingRadius) {
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
            if (runnersCurrentPos[next(num)] !== undefined &&
                (((runnersCurrentPos[next(num)] - x) < params.bumpRadius && sign > 0) ||
                ((x - runnersCurrentPos[next(num)]) < params.bumpRadius && sign < 0))) {
                var xofNextRunner = tryMoveRunner(drag, next(num), x + sign * params.bumpRadius);

                if (x * sign > (xofNextRunner - params.bumpRadius * sign) * sign) {
                    x = getNextStableX(xofNextRunner - params.bumpRadius * sign, -sign);
                }
            }

            // Positioning elements runner
            runnersCurrentPos[num] = x;
            var pos = {};
            pos[dir.start] = runnersCurrentPos[num] + 'px';
            dom(elements.runners[num]).css(pos);

            return x;
        }

        // Updating points look (in range | not in range)
        function updatePoints(force) {
            if (params.pointInRangeCls) {
                // Cloning pointsInRange to pointsWasInRange
                var pointsWasInRange = pointsInRange.slice();

                for (var i = 0 ; i < elements.points.length ; i++) {
                    if (xToPx(params.pointsPos[i]) >= runnersCurrentPos[0] && xToPx(params.pointsPos[i]) <= runnersCurrentPos[runnersCurrentPos.length - 1]) {
                        pointsInRange[i] = 1;
                    } else {
                        pointsInRange[i] = 0;
                    }
                }

                for (var i = 0 ; i < pointsInRange.length ; i++) {
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
            pos[dir.start] = getMin(runnersCurrentPos) + 'px';
            pos[dir.size] = (getMax(runnersCurrentPos) - getMin(runnersCurrentPos)) + 'px';
            dom(elements.trackActive).css(pos);


            // if (params.onUpdate) {
            //     params.onUpdate({
            //         minPos: getMin(runnersCurrentPos),
            //         maxPos: getMax(runnersCurrentPos),
            //         minVal: pxToX(getMin(runnersCurrentPos)),
            //         maxVal: pxToX(getMax(runnersCurrentPos))
            //     });
            // }
        }

        function update(event, force) {
            if (event) {
                var dx = event.clientX - x0drag,
                    x;

                x = runnersInitialPos[drag] + dx;

                for (var i = 0 ; i < runnersCurrentPos.length ; i++) {
                    runnersPrevPos[i] = runnersCurrentPos[i];
                }

                tryMoveRunner(drag, drag, limitPos(x));
            }

            if (!isEqual(runnersCurrentPos, runnersPrevPos) || force) {
                updatePositions(force);
            }
        }

        function getEvent() {
            var minPos = getMin(runnersCurrentPos), // px
                maxPos = getMax(runnersCurrentPos),
                minVal = x2val(pxToX(minPos)), // val
                maxVal = x2val(pxToX(maxPos));

            // Слипание значений соседних бегунков
            if (params.collapseVals) {
                if (maxPos - minPos <= params.bumpRadius + 1) {
                    var x1 = getXofClosestPoint(minPos);
                        // x2 = getXofClosestPoint(maxPos);

                    if (x1 - minPos == 0) {
                        maxVal = minVal;
                    } else {
                        minVal = maxVal;
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

        // Обновляет все размеры при ресайзе контейнера
        function updateSizes() {
            deltaPx = elements.track[dir.client];
            xToPxMem = [];
            pxToXMem = [];

            var pos;
            // Coordinates initialization
            for (var i = 0 ; i < params.pointsPos.length ; i++) {
                pos = {};
                pos[dir.start] = xToPx(params.pointsPos[i]) + 'px';
                dom(elements.points[i]).css(pos);
            }

            // Runners position & drag initialization
            for (var i = 0 ; i < params.runnersPos.length ; i++) {
                pos = {};
                runnersCurrentPos[i] = runnersInitialPos[i] = xToPx(params.runnersPos[i]);
                pos[dir.start] = runnersCurrentPos[i] + 'px';
                dom(elements.runners[i]).css(pos);
            }

            // Active track position initialization
            var x1 = xToPx(params.runnersPos[0]),
                x2 = xToPx(params.runnersPos[params.runnersPos.length - 1]);

            pos = {};
            pos[dir.start] = x1 + 'px';
            pos[dir.size] = Math.abs(x2 - x1) + 'px';
            dom(elements.trackActive).css(pos);
        }

        for (var i = 0 ; i < params.runnersPos.length ; i++) {
            event(elements.runners[i], 'mousedown', (function(n) {
                return function(e) {
                    if (e.button != 2) {
                        e.preventDefault(); // Text selection disabling in Opera... and all other browsers?
                        selection(); // Disable text selection in ie8
                        drag = n; // Runner number to be dragged
                        console.log('n', n);
                    }
                };
            })(i));
        }

        updateSizes();

        update(0, 1);

        // Dragend
        event(document, 'mouseup blur', function() {
            if (drag != -1) {
                for (var i = 0 ; i < runnersInitialPos.length ; i++) {
                    runnersInitialPos[i] = runnersCurrentPos[i]; // Updating initial pos at dragend
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
            var x = xToPx(pos);
            
            tryMoveRunner(num, num, x);
            runnersInitialPos[num] = runnersCurrentPos[num] = x;
            updatePositions(1);
        };

        this.setValue = function(num, val) { // Emulating drag and drop
            var x = xToPx(val2x(val));

            tryMoveRunner(num, num, x);
            runnersInitialPos[num] = runnersCurrentPos[num] = x;
            updatePositions(1);
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