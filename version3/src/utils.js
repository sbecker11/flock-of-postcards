// Clamp a value between min and max
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// multiply each RGB color channel by the given brightness
export function adjustRgbBrightness(rgb, brightness) {
  const adjustedRgb = [];
  for (let i = 0; i < 3; i++) {
    adjustedRgb.push(Math.round(rgb[i] * brightness));
  }
  return adjustedRgb;
}

// multiply each rgb channel of the given Hex color by the given brightness
export function adjustHexBrightness(hex, brightness) {
  return getHexFromRGB(adjustRgbBrightness(getRGBfromHex(hex), brightness));
}

// Get HSV from RGB conversion
export function getHSVfromRGB(color) {
  var r = color[0];
  var g = color[1];
  var b = color[2];
  var min = Math.min(r, g, b);
  var max = Math.max(r, g, b);

  var v = max;
  var delta = max - min;
  var s = max !== 0 ? delta / max : 0;
  var h;

  if (max === min) {
    h = 0; // achromatic (gray)
  } else {
    if (r === max) {
      h = (g - b) / delta; // between yellow & magenta
    } else if (g === max) {
      h = 2 + (b - r) / delta; // between cyan & yellow
    } else {
      h = 4 + (r - g) / delta; // between magenta & cyan
    }
    h *= 60; // degrees
    if (h < 0) {
      h += 360;
    }
  }

  if (isNaN(h)) {
    h = 0;
  }

  return [h, s, v];
}

// Get Hex from RGB conversion
export function getHexFromRGB(color) {
  return "#" + color.map((c) => c.toString(16).padStart(2, "0")).join("");
}

// Get RGB from Hex color conversion
export function getRGBfromHex(hex) {
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
}

// Get RGB from HSV conversion
export function getRGBfromHSV(color) {
  var i = Math.floor(color[0] / 60);
  var f = color[0] / 60 - i;
  var p = color[2] * (1 - color[1]);
  var q = color[2] * (1 - f * color[1]);
  var t = color[2] * (1 - (1 - f) * color[1]);
  var rgb;

  switch (i) {
    case 0:
      rgb = [color[2], t, p];
      break;
    case 1:
      rgb = [q, color[2], p];
      break;
    case 2:
      rgb = [p, color[2], t];
      break;
    case 3:
      rgb = [p, q, color[2]];
      break;
    case 4:
      rgb = [t, p, color[2]];
      break;
    default:
      rgb = [color[2], p, q];
      break;
  }

  return rgb.map((c) => Math.round(c));
}

// Returns a given number with precision digits
export function toFixedPoint(value, precision) {
    if (value) value = parseFloat(value.toFixed(precision));
    return value;
  }
  
// Linear interpolation
export function linearInterp(x, x1, y1, x2, y2) {
  return y1 + ((x - x1) * (y2 - y1)) / (x2 - x1);
}

// Returns a random int between min and max inclusive
export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Zero pad a number
export function zeroPad(num, places) {
  return String(num).padStart(places, "0");
}

