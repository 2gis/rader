Rader - range slider.

## Demo

http://diokuz.github.io/rader/

## Features

- 2, 3, 4... 10000000 runners per one slider
- Bumping, sticking, transitioning...
- Non-linear and exponent intervals support

## Init params

```js
{
    // Root dom node (most parent) for slider, also - statical part of track
    root: '.slider',

    // Active (movable) part of track
    trackActive: '.track-active',

    // Dom elements of points
    points: '.point',

    // Dom elements responsible for dragging (runners)
    runners: '.runner',

    // CSS modifier for points in range for now
    pointInRangeCls: '.point_active'

    // Relative linear point positions
    pointsPos: [ 0, 12, 33 ],

    // Values which will be linked to points
    values: [1, 10, 77, 10000],

    // Values on which runners will point on slider init
    runnersVal: [ 2, 600 ],

    // Sticky radius for runner (around each point) in px
    stickingRadius: 40,

    // Minimal distance between two runners in px
    bumpRadius: 22,

    // Use 'log' value if want logarithmic scale
    scale: 'log',

    // CSS class on root element when dragged runners goes to stick (with transition) on point
    transCls: '.rader_trans',

    // Event on drag end,
    change: function(e) {},

    // Event on drag,
    move: function(e) {}
}
```

## Methods

```js
var rader = $('.rader').rader(params);

/**
 * Emulation of drag of runner number num (0, 1, 2...) to defined position pos (px)
 * @return current position (px) of runner number num (0, 1, 2...)
 */
rader.pos(num, pos);

/**
 * Emulation of drag of runner number num (0, 1, 2...) to defined position of value val (user-defined dimension)
 * @return current value (user-defined dimension) of runner number num (0, 1, 2...)
 */
rader.val(num, val);

/**
 * Invalidating all positions of runners and track
 */
rader.invalidate();

/**
 * Killing the rader instance
 */
rader.invalidate();

```

## License

MIT.