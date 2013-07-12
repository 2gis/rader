(function(window, undefined) {
    var $ = window.jQuery;

    var rader = function(params) {
        params = params || {};
        params.root = params.root || this;

        $ = params.$ || $;

        return new init(params);
    };

    // rader object constructor
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
            drag = -1, // No runner dragged
            runnersInitialPos = [], // Current absolute runners position (before and after drag)
            runnersCurrentPos = [], // Current (in drag mode) absolute runners position
            runnersPrevPos = [], // Before tryMove current runners position
            pointsInRagne = []; // Bool array

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
        elements.trackActive = params.trackActive[0] || params.trackActive;
        elements.points = params.points;
        elements.runners = params.runners;

        // Params initialization
        defaultParams = { // Default input parameters
            stickingRadius: 0,
            bumpRadius: elements.runners[0][dir.offset], // firstRunner.offsetWidth | Height
            points: [],
            start: 0,
            end: 10,
            pointsPos: []
        }
        if (params.pointsPos && params.pointsPos.length) {
            defaultParams.start = params.pointsPos[0];
            defaultParams.end = params.pointsPos[params.pointsPos.length - 1];
        }
        defaultParams.runnersPos = [defaultParams.start, defaultParams.end];
        for (var key in defaultParams) {
            if (params[key] === undefined) {
                params[key] = defaultParams[key];
            }
        }
        
        delta = Math.abs(params.end - params.start);
        deltaPx = elements.track[dir.client];

        // Validation (dev mode)
        if (params.pointsPos && params.pointsPos.length !== elements.points.length) {
            console.error('params.pointsPos.length !== elements.points.length');
        }
        if (params.runners.length !== elements.runners.length) {
            console.error('params.runners.length !== elements.runners.length');
        }
        if (!selector) {
            console.error('No selector engine found');
        }
        if (!dom) {
            console.error('No dom utility found');
        }
        if (!event) {
            console.error('No event manager found');
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
            var max = -10000;

            for (var i = 0 ; i < arr.length ; i++) {
                if (max < arr[i]) {
                    max = arr[i];
                }
            }

            return max;
        }

        function getMin(arr) {
            var min = 10000;
            
            for (var i = 0 ; i < arr.length ; i++) {
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

            for (i = 0 ; i < arr1.length ; i++) {
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
                xToPxMem[x] = ((x - params.start) / delta) * deltaPx;
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

        // Преобразуем значение слайдена в заданную шкалу значений
        function x2val(x) {
            if (!params.values) return x;

            // Ищем индекс i где в интервале i, i+1 находится x
            var i = 0;
            while (params.pointsPos[i+1] && !(x >= params.pointsPos[i] && x <= params.pointsPos[i+1])) {
                i++;
            }

            // fallbacks when not in range
            if (x < params.pointsPos[0]) return params.values[0];
            if (x > params.pointsPos[params.pointsPos.length - 1]) return params.values[params.values.length - 1];

            var x1 = params.pointsPos[i],
                x2 = params.pointsPos[i + 1],
                v1 = params.values[i],
                v2 = params.values[i + 1],
                val;

                //debugger;

            if (params.scale == 'log') {
                val = Math.exp((x - x1) / (x2 - x1) * (Math.log(v2) - Math.log(v1)) + Math.log(v1));
            } else { // linear
                val = (x - x1) / (x2 - x1) * (v2 - v1) + v1;
            }

            return val;
        }

        // Getting coordinate of closest to @x point
        function getXofClosestPoint(x, sign) {
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
            var px, dx, dxCl, dxmin = 9999, xret = x, xofClosestPoint = getXofClosestPoint(x);

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

            if (dxmin < params.stickingRadius) { // 2, 4(partially)
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
            xSticky = getXofClosestPoint(x, sign);
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
                // Cloning pointsInRagne to pointsWasInRagne
                var pointsWasInRagne = [];
                for (var i = 0 ; i < pointsInRagne.length ; i++) {
                    pointsWasInRagne[i] = pointsInRagne[i];
                }

                for (var i = 0 ; i < elements.points.length ; i++) {
                    if (xToPx(params.pointsPos[i]) >= runnersCurrentPos[0] && xToPx(params.pointsPos[i]) <= runnersCurrentPos[runnersCurrentPos.length - 1]) {
                        pointsInRagne[i] = 1;
                    } else {
                        pointsInRagne[i] = 0;
                    }
                }

                for (var i = 0 ; i < pointsInRagne.length ; i++) {
                    if (pointsInRagne[i] != pointsWasInRagne[i] || force) { // Mega profit (+few ms per point change)
                        if (pointsInRagne[i]) {
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

            if (params.onUpdate) {
                params.onUpdate({
                    minPos: getMin(runnersCurrentPos),
                    maxPos: getMax(runnersCurrentPos),
                    minVal: pxToX(getMin(runnersCurrentPos)),
                    maxVal: pxToX(getMax(runnersCurrentPos))
                });
            }
        }

        function update(event, force) {
            if (event) {
                var dx = event.clientX - x0drag,
                    pos = {},
                    x;

                x = runnersInitialPos[drag] + dx;

                for (i = 0 ; i < runnersCurrentPos.length ; i++) {
                    runnersPrevPos[i] = runnersCurrentPos[i];
                }

                tryMoveRunner(drag, drag, limitPos(x));
            }

            if (!isEqual(runnersCurrentPos, runnersPrevPos) || force) {
                updatePositions(force);
            }
        }

        // Coordinates initialization
        for (var i = 0 ; i < params.pointsPos.length ; i++) {
            var pos = {};

            pos[dir.start] = xToPx(params.pointsPos[i]) + 'px';
            dom(elements.points[i]).css(pos);
        }

        // Runners position & drag initialization
        for (var i = 0 ; i < params.runnersPos.length ; i++) {
            var pos = {};

            runnersCurrentPos[i] = runnersInitialPos[i] = xToPx(params.runnersPos[i]);
            pos[dir.start] = runnersCurrentPos[i] + 'px';
            dom(elements.runners[i]).css(pos);

            event(elements.runners[i], 'mousedown', (function(n) {
                return function(e) {
                    if (e.button != 2) {
                        e.preventDefault(); // Text selection disabling in Opera... and all other browsers?
                        selection(); // Disable text selection in ie8
                        drag = n; // Runner number to be dragged
                    }
                }
            })(i));
        }

        // Active track position initialization
        var x1 = xToPx(params.runnersPos[0]),
            x2 = xToPx(params.runnersPos[params.runnersPos.length - 1]),
            pos = {};

        pos[dir.start] = x1 + 'px';
        pos[dir.size] = Math.abs(x2 - x1) + 'px';
        dom(elements.trackActive).css(pos);

        update(0, 1);

        // Dragend
        event(document, 'mouseup blur', function() {
            if (drag != -1) {
                for (var i = 0 ; i < runnersInitialPos.length ; i++) {
                    runnersInitialPos[i] = runnersCurrentPos[i]; // Updating initial pos at dragend
                }

                if (params.change) {
                    params.change({
                        minPos: getMin(runnersCurrentPos),
                        maxPos: getMax(runnersCurrentPos),
                        minVal: x2val(pxToX(getMin(runnersCurrentPos))),
                        maxVal: x2val(pxToX(getMax(runnersCurrentPos))),

                    });
                }
                
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
            }
        });

        this.posRunner = function(num, val) { // Emulating drag and drop
            var x = xToPx(val);
            tryMoveRunner(num, num, x);
            runnersInitialPos[num] = runnersCurrentPos[num] = x;
            updatePositions(1);
        };

        this.invalidate = function() {
            updatePositions(1);
        }

        return this;
    }

    if ($ && $.fn) {
        $.fn.rader = rader;
    }

    window.rader = rader;
})(window);