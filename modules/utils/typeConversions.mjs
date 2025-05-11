// Type Conversions and Math Helpers
export const toFixedPoint = (value, precision) => +value.toFixed(precision);
export const linearInterp = (x, x1, y1, x2, y2) => y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
export const zeroPad = (num, places) => num.toString().padStart(places, "0"); 