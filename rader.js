(function(window, undefined) {
    var $ = window.jQuery;

    var rader = function(params) {
        params.root = params.root || this;

        return new init(params);
    };

    // rader object constructor
    var init = function(params) {
        var elements = {},
            delta,
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

        function limitPos(x) {
            if (x > elements.track[dir.client]) {
                x = elements.track[dir.client];
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
                xToPxMem[x] = ((x - params.start) / delta) * elements.track[dir.client];
            }

            return xToPxMem[x];
        }

        var pxToXMem = [];
        function pxToX(px) {
            if (pxToXMem[px] === undefined) {
                pxToXMem[px] = px / elements.track[dir.client] * delta + params.start;
            }

            return pxToXMem[px];
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
        function tryMoveRunner(num, x) {
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
                var xofNextRunner = tryMoveRunner(next(num), x + sign * params.bumpRadius);

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

        function update(e, force) {
            if (e) {
                var dx = e.clientX - x0drag,
                    pos = {},
                    x;

                x = runnersInitialPos[drag] + dx;
                tryMoveRunner(drag, limitPos(x));
            }

            // Updating activation state of all points
            updatePoints(force);

            // Positioning active track
            var pos = {};
            pos[dir.start] = getMin(runnersCurrentPos) + 'px';
            pos[dir.size] = (getMax(runnersCurrentPos) - getMin(runnersCurrentPos)) + 'px';
            dom(elements.trackActive).css(pos);

            if (typeof params.change === 'function') {
                params.change({
                    minPos: getMin(runnersCurrentPos),
                    maxPos: getMax(runnersCurrentPos),
                    minVal: pxToX(getMin(runnersCurrentPos)),
                    maxVal: pxToX(getMax(runnersCurrentPos))
                });
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
            for (var i = 0 ; i < runnersInitialPos.length ; i++) {
                runnersInitialPos[i] = runnersCurrentPos[i]; // Updating initial pos at dragend
            }
            
            selection(1); // Enable text selection
            drag = -1;
        });

        // Dragstart
        event(document, 'mousedown', function(e) { // document, not window, for ie8
            x0drag = e.clientX;
        });

        event(document, 'mousemove', function(e) { // document, not window, for ie8
            if (drag != -1) {
                update(e);
            }
        });
    }

    if ($ && $.fn) {
        $.fn.rader = rader;
    }

    window.rader = rader;
})(window);