<!-- from https://stackoverflow.com/a/33861363/4607079 -->

//Mousewheel plugin
(function (d) {
  "function" === typeof define && define.amd
    ? define(["jquery"], d)
    : "object" === typeof exports
    ? (module.exports = d)
    : d(jQuery);
})(function (d) {
  function l(a) {
    var b = a || window.event,
      k = r.call(arguments, 1),
      f = 0,
      e = 0,
      c = 0,
      g = 0,
      l = 0,
      n = 0;
    a = d.event.fix(b);
    a.type = "mousewheel";
    "detail" in b && (c = -1 * b.detail);
    "wheelDelta" in b && (c = b.wheelDelta);
    "wheelDeltaY" in b && (c = b.wheelDeltaY);
    "wheelDeltaX" in b && (e = -1 * b.wheelDeltaX);
    "axis" in b &&
      b.axis === b.HORIZONTAL_AXIS &&
      ((e = -1 * c), (c = 0));
    f = 0 === c ? e : c;
    "deltaY" in b && (f = c = -1 * b.deltaY);
    "deltaX" in b && ((e = b.deltaX), 0 === c && (f = -1 * e));
    if (0 !== c || 0 !== e) {
      1 === b.deltaMode
        ? ((g = d.data(this, "mousewheel-line-height")),
          (f *= g),
          (c *= g),
          (e *= g))
        : 2 === b.deltaMode &&
          ((g = d.data(this, "mousewheel-page-height")),
          (f *= g),
          (c *= g),
          (e *= g));
      g = Math.max(Math.abs(c), Math.abs(e));
      if (!h || g < h)
        (h = g),
          m.settings.adjustOldDeltas &&
            "mousewheel" === b.type &&
            0 === g % 120 &&
            (h /= 40);
      m.settings.adjustOldDeltas &&
        "mousewheel" === b.type &&
        0 === g % 120 &&
        ((f /= 40), (e /= 40), (c /= 40));
      f = Math[1 <= f ? "floor" : "ceil"](f / h);
      e = Math[1 <= e ? "floor" : "ceil"](e / h);
      c = Math[1 <= c ? "floor" : "ceil"](c / h);
      m.settings.normalizeOffset &&
        this.getBoundingClientRect &&
        ((b = this.getBoundingClientRect()),
        (l = a.clientX - b.left),
        (n = a.clientY - b.top));
      a.deltaX = e;
      a.deltaY = c;
      a.deltaFactor = h;
      a.offsetX = l;
      a.offsetY = n;
      a.deltaMode = 0;
      k.unshift(a, f, e, c);
      p && clearTimeout(p);
      p = setTimeout(t, 200);
      return (d.event.dispatch || d.event.handle).apply(this, k);
    }
  }

  function t() {
    h = null;
  }
  var n = [
      "wheel",
      "mousewheel",
      "DOMMouseScroll",
      "MozMousePixelScroll",
    ],
    k =
      "onwheel" in document || 9 <= document.documentMode
        ? ["wheel"]
        : ["mousewheel", "DomMouseScroll", "MozMousePixelScroll"],
    r = Array.prototype.slice,
    p,
    h;
  if (d.event.fixHooks)
    for (var q = n.length; q; )
      d.event.fixHooks[n[--q]] = d.event.mouseHooks;
  var m = (d.event.special.mousewheel = {
    version: "3.1.12",
    setup: function () {
      console.log("setup mousewheel");
      if (this.addEventListener)
        for (var a = k.length; a; ) this.addEventListener(k[--a], l, !1);
      else this.onmousewheel = l;
      d.data(this, "mousewheel-line-height", m.getLineHeight(this));
      d.data(this, "mousewheel-page-height", m.getPageHeight(this));
    },
    teardown: function () {
      if (this.removeEventListener)
        for (var a = k.length; a; )
          this.removeEventListener(k[--a], l, !1);
      else this.onmousewheel = null;
      d.removeData(this, "mousewheel-line-height");
      d.removeData(this, "mousewheel-page-height");
    },
    getLineHeight: function (a) {
      return 16;
    },
    getPageHeight: function (a) {
      return a.offsetHeight;
    },
    settings: {
      adjustOldDeltas: !0,
      normalizeOffset: !0,
    },
  });
  d.fn.extend({
    mousewheel: function (a) {
      return a ? this.bind("mousewheel", a) : this.trigger("mousewheel");
    },
    unmousewheel: function (a) {
      return this.unbind("mousewheel", a);
    },
  });
});

//Animation helper
(function (r, a, t) {
  var b = b || {};
  b.now = (function () {
    return (
      b.now ||
      b.mozNow ||
      b.msNow ||
      b.oNow ||
      b.webkitNow ||
      function () {
        return new Date().getTime();
      }
    );
  })();
  a.EasyAnimationFrame = a.EAF = function (l, m, n) {
    var c = n || 0,
      g = 0,
      e = !0,
      h,
      f,
      d;
    this.startAnimation = function () {
      e && ((d = b.now()), (f = d + c), (e = !1), k());
    };
    this.clearAnimation = function () {
      p(h);
      e = !0;
    };
    this.updateFrameDelay = function (a) {
      c = Number(a);
      f = b.now() + c;
    };
    this.getFrameDelay = function () {
      return c;
    };
    this.getFramerate = function () {
      return g;
    };
    var k = function () {
        if (!e) {
          var a = b.now();
          0 >= f - a &&
            ((f = a + c),
            d < a + 1e3 &&
              ((g = Math.round(1e3 / (a - d))), (d = a), l()));
          h = q(k, m);
        }
      },
      q = (function () {
        return (
          a.requestAnimationFrame ||
          a.webkitRequestAnimationFrame ||
          a.mozRequestAnimationFrame ||
          a.oRequestAnimationFrame ||
          a.msRequestAnimationFrame ||
          function (b, d) {
            return a.setTimeout(b, 1e3 / 60 + c);
          }
        );
      })(),
      p =
        a.cancelAnimationFrame ||
        a.webkitCancelRequestAnimationFrame ||
        clearTimeout;
    return this;
  };
})(document, window);

//SETUP

var scroller = null;

// provide your scroller already setup with content
function mousewheel_setScrollerWithOwnContent(scrollerElement) {
    scroller = scrollerElement;
    console.log("mousewheel scroller now has id:", scroller.id);
}

// provide your scroller without content
function mousewheel_setScroller_withDemoContent(scrollerElement, length) {
    scroller = scrollerElement;

    var frag = document.createDocumentFragment();
    for (var i = 0, len = itemLength; i < len; i++) {
    var item = document.createElement("div");
    item.appendChild(
        document.createTextNode("This is item number: " + (i + 1))
    );
    item.classList.add("item");
    frag.appendChild(item);
    }
    scroller.appendChild(frag);
}

var Inertial = function () {

  if ( !scroller ) 
    return;

  var _this = this;

  this.atStart = false;
  this.atEnd = false;
  this.running = false;
  this.scrolldir = 0;
  this.dir = 0;
  this.fricton = 0.85; // higher value for slower deceleration
  this.vy = 0;
  this.stepAmt = 10;
  this.minMovement = 0.1;
  this.ts = 0.1;
  this.scrollerPos = 0;
  this.prevScrollerPos = null;
  this.currentY = 0;
  this.targetY = 0;
  this.oldY = 0;
  this.wheelSpeed = 3.5;

  this.contentHeight = scroller.scrollHeight;
  this.scrollerHeight = scroller.offsetHeight;

  this.animator = EasyAnimationFrame(
    function () {
      _this.render();
    },
    scroller,
    0
  );

  this._Init();
};

Inertial.prototype._Init = function () {
  var _this = this;

  $(scroller).on("mousewheel", function (event, delta, deltaX, deltaY) {
    event.preventDefault();
    _this.performScroll(event);
  });
};

Inertial.prototype.performScroll = function (event, delta) {
  this.onWheel(delta || event.deltaY);

  //if animation loop is not running and we are not
  //scrolled to the top or the bottom. start the loop.
  if (
    this.running ||
    (this.atStart && this.scrolldir > 0) ||
    (this.atEnd && this.scrolldir < 0)
  ) {
    return;
  }

  //reset internal scroll pos when loop starts
  this.scrollerPos = scroller.scrollTop;
  this.running = true;
  this.atEnd = false;
  this.atStart = false;
  this.animator.startAnimation();
};

Inertial.prototype.onWheel = function (delta) {
  //set the scroll direction
  this.dir = delta * this.wheelSpeed < 0 ? -1 : 1;
  if (this.dir !== this.scrolldir) {
    //reset accel
    this.vy = 0;
    this.scrolldir = this.dir;
  }
  //begin smoothing algorithm
  this.smoothWheel(-(delta * this.wheelSpeed));
};

Inertial.prototype.smoothWheel = function (amt) {
  this.targetY += amt;

  //uncomment this line to see the decelleration almost work against the top edge of the container
  //this.targetY = Math.max(0, this.targetY);

  this.vy += (this.targetY - this.oldY) * this.stepAmt;
  this.oldY = this.targetY;

  this.boundVelocity();
};

Inertial.prototype.boundVelocity = function () {
  var dist = 0;

  if (this.dir == 1) dist = this.scrollerPos;
  else if (this.dir == -1)
    dist = this.contentHeight - this.scrollerHeight - this.scrollerPos;

  var maxv = dist * (1 - this.fricton) + 1;

  if (Math.abs(this.vy) > maxv) {
    console.log(
      "reduce velocity " +
        this.vy +
        " to " +
        -maxv * this.dir +
        ", dist: " +
        dist
    );
    this.vy = -maxv * this.dir;
  }
};

Inertial.prototype.render = function () {
  if (this.vy >= -this.minMovement && this.vy <= this.minMovement) {
    return;
  }

  this.scrollerPos += this.vy;

  if (this.scrollerPos <= 0) {
    this.reset(0);
    this.atStart = true;
  } else if (
    this.scrollerPos >=
    this.contentHeight - this.scrollerHeight
  ) {
    this.reset(this.contentHeight - this.scrollerHeight);
    this.atEnd = true;
  } else {
    this.atStart = false;
    this.atEnd = false;
  }

  if (this.prevScrollerPos !== this.scrollerPos) {
    //physically set the scroll position
    scroller.scrollTop = this.scrollerPos;
    this.prevScrollerPos = this.scrollerPos;
  }

  //console.log(this);
  this.vy *= this.fricton;
  console.log("friction vy: " + this.vy);
  this.boundVelocity();

  //Stop the animation loop if we are no longer scrolling
  if (Math.abs(this.vy) < 0.1 || this.atStart || this.atEnd) {
    this.running = false;
    this.animator.clearAnimation();
    this.vy = 0;
  }
};

Inertial.prototype.reset = function (y) {
  this.scrolldir = 0;
  this.dir = 0;
  this.scrollerPos = y;
  this.currentY = y;
  this.targetY = y;
  this.oldY = y;
  this.vy = 0;
};

var smoothScroller = new Inertial();

