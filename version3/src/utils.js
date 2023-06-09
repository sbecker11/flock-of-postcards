export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const adjustRgbBrightness = (rgb, brightness) => rgb.map(channel => clamp(Math.round(channel * brightness),0,255));
export const adjustHexBrightness = (hex, brightness) => getHexFromRGB(adjustRgbBrightness(getRGBfromHex(hex), brightness));
export const getHexFromRGB = color => "#" + color.map(c => c.toString(16).padStart(2, "0")).join("").toLowerCase();
export const getRGBfromHex = hex => hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)?.slice(1).map(c => parseInt(c, 16));
export const toFixedPoint = (value, precision) => +value.toFixed(precision);
export const linearInterp = (x, x1, y1, x2, y2) => y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
export const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const zeroPad = (num, places) => num.toString().padStart(places, "0");
export const getHSVfromRGB = ([r, g, b]) => {
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  const delta = max - min;
  const s = max !== 0 ? delta / max : 0;
  let h = max === min ? 0 : (max === r ? (g - b) / delta + (g < b ? 6 : 0) : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4) * 60;
  if (isNaN(h)) h = 0;
  return [h, s, max];
};
export const getRGBfromHSV = ([h, s, v]) => {
  const f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return [f(5), f(3), f(1)].map(Math.round);
};
