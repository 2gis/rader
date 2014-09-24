Rader - range slider.

## Demo

http://diokuz.github.io/rader/simple.html

http://diokuz.github.io/rader/

## How to use rader

Make sure you have jQuery on your page.

Pick some js

```js
<script src="rader.min.js"></script>
```

Then add some html and css

```html
<div class="rader">
    <div class="rader__track">
        <!-- Runners -->
        <div class="rader__runner _left"></div>
        <div class="rader__runner _right"></div>
    </div>
</div>

<script src="rader.css"></script>
```

or make your own. If so, make sure you have a proper css.

Then just call rader:

```js
$('.rader').rader({
    runners: '.rader__runner'
});
```

Thats it!

For advanced usage see below.

## Features

- 2, 3, 4... 10000000 runners per one slider
- Bumping, sticking, transitioning...
- Non-linear and exponent intervals support

## API

```js
{
    // Root dom node (most parent) for slider, also - statical part of track
    root: '.slider',

    // Whole track
    track: '.track',

    // Active (between runners) part of track
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

    // Runners with 1 will be freezed (user will not be able to move them)
    runnersFreeze: [ 1, 0 ],

    // Sticky radius for runner (around each point) in px
    stickingRadius: 40,

    // Minimal distance between two runners in px
    bumpRadius: 22,

    // Use 'log' value if want logarithmic scale
    scale: 'log',

    // Which direction will be used (horizontal '-' by default or vertical '|') for slider
    direction: '-',

    // If true, click to track will move the closest non-freezed runner to click point
    click: false,

    // CSS class on root element when dragged runners goes to stick (with transition) on point
    transCls: '.rader_trans',

    // Event on drag end (mouseup, touchend, generating only by real user)
    change: function(e) {},

    // Event on drag (mousemove, touchmove)
    move: function(e) {},

    // Event on drag end (generating by real user or by methods like setters .pos and .val)
    onUpdate: function(e) {}
}
```

## Methods

```js
var rader = $('.rader').rader(params);

/**
 * Emulation of drag of runner number num (0, 1, 2...) to defined position pos (px)
 * @return current position (px) of runner number num (0, 1, 2...) in getter mode, and rader instance in setter mode
 */
rader.pos(num, pos);

/**
 * Emulation of drag of runner number num (0, 1, 2...) to defined position of value val (user-defined dimension)
 * @return current value (user-defined dimension) of runner number num (0, 1, 2...) in getter mode, and rader instance in setter mode
 */
rader.val(num, val);

/**
 * Invalidating all positions of runners and track
 */
rader.invalidate();

/**
 * Killing the rader instance
 */
rader.dispose();

```

## License

MIT.