(function(window, undefined) {

    var slider = function(params) {
        params = params || {};
        params.root = this;

        return new init(params);
    };

    // slider object constructor
    var init = function(params) {
        var dom = {},
            //params = {},
            delta,
            dir = { // Direction: left-to-right | top-to-bottom
                start: 'left',
                client: 'clientWidth',
                offset: 'offsetWidth',
                size: 'width'
            },
            defaultParams,
            event,
            drag = -1, // No runner dragged
            runnersInitialPos = [], // Current absolute runners position (before and after drag)
            runnersCurrentPos = [], // Current (in drag mode) absolute runners position
            pointsInRagne = []; // Bool array

        // Event manager
        event = params.event || function(elem, event, func, mode) {
            $(elem)[mode || 'on'](event, func);
        };

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
            if (x > dom.track[dir.client]) {
                x = dom.track[dir.client];
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
                xToPxMem[x] = ((x - params.start) / delta + params.start) * dom.track[dir.client];
            }

            return xToPxMem[x];
        }

        // Getting coordinate of closest to @x point
        function getXofClosestPoint(x, sign) {
            var xret = x,
                dx,
                px,
                dxmin = 9999;

            for (var i = 0 ; i < params.points.length ; i++) {
                px = xToPx(params.points[i]);

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

            for (var i = 0 ; i < params.points.length ; i++) { // 2
                px = xToPx(params.points[i]);
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
                if (!stickTimeout) {
                    $(dom.track).addClass(params.transCls);
                    stickTimeout = setTimeout(function() {
                        $(dom.track).removeClass(params.transCls);
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

            // Positioning dom runner
            runnersCurrentPos[num] = x;
            var pos = {};
            pos[dir.start] = runnersCurrentPos[num] + 'px';
            $(dom.runners[num]).css(pos);

            return x;
        }

        // Updating points look (in range | not in range)
        function updatePoints() {
            if (params.pointInRangeCls) {
                // Cloning pointsInRagne to pointsWasInRagne
                var pointsWasInRagne = [];
                for (var i = 0 ; i < pointsInRagne.length ; i++) {
                    pointsWasInRagne[i] = pointsInRagne[i];
                }

                for (var i = 0 ; i < dom.points.length ; i++) {
                    if (xToPx(params.points[i]) >= runnersCurrentPos[0] && xToPx(params.points[i]) <= runnersCurrentPos[runnersCurrentPos.length - 1]) {
                        pointsInRagne[i] = 1;
                    } else {
                        pointsInRagne[i] = 0;
                    }
                }

                for (var i = 0 ; i < pointsInRagne.length ; i++) {
                    if (pointsInRagne[i] != pointsWasInRagne[i]) { // Mega profit (+few ms per point change)
                        if (pointsInRagne[i]) {
                            $(dom.points[i]).addClass(params.pointInRangeCls);
                        } else {
                            $(dom.points[i]).removeClass(params.pointInRangeCls);
                        }
                    }
                }
            }
        }

        // Dom initialization
        dom.track = params.root[0];
        dom.trackActive = $(dom.track).find(params.trackActive)[0];
        dom.points = $(dom.track).find(params.point);
        dom.runners = $(dom.track).find(params.runner);

        // Params initialization
        defaultParams = { // Default input parameters
            stickingRadius: 0,
            bumpRadius: dom.runners[0][dir.offset], // firstRunner.offsetWidth | Height
            points: [],
            start: 0,
            end: 10,
            runners: [0, 10]
        }
        for (var key in defaultParams) {
            if (params[key] === undefined) {
                params[key] = defaultParams[key];
            }
        }
        
        delta = Math.abs(params.end - params.start);

        // Validation (dev mode)
        if (params.points.length !== dom.points.length) {
            console.error('params.points.length !== dom.points.length');
        }
        if (params.runners.length !== dom.runners.length) {
            console.error('params.runners.length !== dom.runners.length');
        }

        // Coordinates initialization
        for (var i = 0 ; i < params.points.length ; i++) {
            var x = params.points[i] / delta * dom.track[dir.client],
                pos = {};

            pos[dir.start] = x + 'px';
            $(dom.points[i]).css(pos);
        }

        // Runners position & drag initialization
        for (var i = 0 ; i < params.runners.length ; i++) {
            var x = params.runners[i] / delta * dom.track[dir.client],
                pos = {};

            runnersCurrentPos[i] = runnersInitialPos[i] = x;
            pos[dir.start] = x + 'px';
            $(dom.runners[i]).css(pos);

            event(dom.runners[i], 'mousedown', (function(n) {
                return function(e) {
                    e.preventDefault(); // Text selection disabling in Opera... and all other browsers?
                    selection(); // Disable text selection in ie8
                    drag = n; // Runner number to be dragged
                }
            })(i));
        }

        updatePoints();

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
                var dx = e.clientX - x0drag,
                    pos = {},
                    xReal,
                    x;

                x = runnersInitialPos[drag] + dx;
                tryMoveRunner(drag, limitPos(x));

                // Updating activation state of all points
                updatePoints();

                // Positioning active track
                var pos = {};
                pos[dir.start] = getMin(runnersCurrentPos) + 'px';
                pos[dir.size] = (getMax(runnersCurrentPos) - getMin(runnersCurrentPos)) + 'px';
                $(dom.trackActive).css(pos);
            }
        });

        // Active track position initialization
        var x1 = params.runners[0] / delta * dom.track[dir.client],
            x2 = params.runners[params.runners.length - 1] / delta * dom.track[dir.client],
            pos = {};

        pos[dir.start] = x1 + 'px';
        pos[dir.size] = Math.abs(x2 - x1) + 'px';
        $(dom.trackActive).css(pos);

        
    }

    $.fn.slider = slider;
})( window );