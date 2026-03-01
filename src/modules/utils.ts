import * as css_colors from './css_colors.js';

// --------------------------------------
// Type Definitions

type RGB = [number, number, number];
type HSV = [number, number, number];
type Rect = { left: number; top: number; right: number; bottom: number };
type Offset = { top: number; left: number };

interface StyleProps {
  color?: string;
  backgroundColor?: string;
  left?: string;
  top?: string;
  zIndex?: string;
  filter?: string;
  translate?: string;
}

// --------------------------------------
// Constants

const EPSILON = 1.0;

const USABLE_STYLE_PROPS = [
  'color', 'background-color', 'left', 'top', 'z-index', 'filter', 'translate'
];

const STYLE_PROPS_MAP: Record<string, string> = {
  'z-index': 'zIndex',
  'background-color': 'backgroundColor'
};

const PROPS_STYLE_MAP: Record<string, string> = {
  'zIndex': 'z-index',
  'backgroundColor': 'background-color'
};

// --------------------------------------
// Validation Functions

export function isHexColorString(hexColorStr: unknown): hexColorStr is string {
  return isString(hexColorStr) && /^#[0-9A-F]{6}$/.test(String(hexColorStr));
}

export function validateHexColorString(hexColorStr: string): void {
  if (!isHexColorString(hexColorStr)) {
    throw new Error(`hexColorStr: '${hexColorStr}' is invalid.`);
  }
}

export const isString = (value: unknown): value is string => 
  (typeof value === 'string' || value instanceof String);

export const isNumber = (value: unknown): value is number => 
  typeof value === 'number' && !Number.isNaN(value);

export const validateKey = (obj: object, key: string): void => {
  if (!(key in obj)) throw new Error(`Key '${key}' not found in object`);
};

export const validateString = (str: unknown): void => {
  if (typeof str === 'undefined' || str === null || typeof str !== 'string' || str.trim().length === 0) {
    throw new Error(`Invalid string:[${str}]`);
  }
};

export const validateIntArrayLength = (arr: unknown, length?: number): void => {
  if (typeof arr === 'undefined' || arr === null || !Array.isArray(arr) || 
      arr.some(item => !Number.isInteger(item)) || 
      (typeof length !== 'undefined' && arr.length !== length)) {
    throw new Error('Invalid array of integers or length mismatch');
  }
};

export const validateFloat = (num: unknown): void => {
  if (typeof num === 'undefined' || num === null || typeof num !== 'number' || !Number.isFinite(num)) {
    throw new Error('Invalid floating-point number');
  }
};

export function isHSV(HSV: unknown): HSV is [number, number, number] {
  if (!Array.isArray(HSV) || HSV.length !== 3 || 
      HSV[0] < 0.0 || HSV[0] > 360.0 || 
      HSV[1] < 0.0 || HSV[1] > 1.0 || 
      HSV[2] < 0.0 || HSV[2] > 1.0) {
    return false;
  }
  return true;
}

export function validateHSV(HSV: unknown): asserts HSV is [number, number, number] {
  if (!isHSV(HSV)) {
    throw new Error(`HSV:[${HSV}] is invalid`);
  }
}

export function isRGB(RGB: unknown): RGB is [number, number, number] {
  if (!Array.isArray(RGB) || RGB.length !== 3) {
    return false;
  }
  if (RGB[0] < 0 || RGB[0] > 255 || RGB[1] < 0 || RGB[1] > 255 || RGB[2] < 0 || RGB[2] > 255) {
    return false;
  }
  return true;
}

export function validateRGB(RGB: unknown): asserts RGB is [number, number, number] {
  if (!isRGB(RGB)) {
    throw new Error(`RGB:[${RGB}] is invalid`);
  }
}

export const isNumeric = (obj: unknown): obj is number => 
  !Number.isNaN(parseFloat(obj as string)) && isFinite(obj as number);

export const validateIsNumeric = (obj: unknown): void => {
  if (!isNumeric(obj)) {
    throw new Error(`ValueError: Input is not a number, but it is a(n) ${typeof obj} with value ${obj}`);
  }
};

export const isNumericArray = (arr: unknown): arr is number[] => {
  if (!Array.isArray(arr)) {
    return false;
  }
  for (const element of arr) {
    if (!isNumeric(element)) {
      return false;
    }
  }
  return true;
};

export function validateIsNumericArray(arr: unknown): asserts arr is number[] {
  if (!isNumericArray(arr)) {
    throw new Error("ValueError: Array must contain only numeric values");
  }
}

export function validateIsStyleArray(arr: unknown): void {
  validateIsNumericArray(arr);
  if (arr.length !== 9) {
    throw new Error("ValueError: StyleArray must contain 9 numeric values");
  }
  if (arrayHasNaNs(arr)) {
    throw new Error("ValueError: StyleArray must not contain NaNs");
  }
}

export function validateIsArray(arr: unknown): asserts arr is unknown[] {
  if (!Array.isArray(arr)) {
    const inputType = typeof arr;
    throw new Error(`ValueError: Input is not an array, it is a(n) ${inputType} with value ${arr}`);
  }
  if (arr.length === 0) {
    throw new Error("ValueError: Array length must be greater than 0");
  }
}

export function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  if (typeof obj !== 'object' || obj === null) return false;
  if (Array.isArray(obj) || obj instanceof Date || obj instanceof RegExp) return false;
  return true;
}

export function validateIsPlainObject(obj: unknown): asserts obj is Record<string, unknown> {
  if (!isPlainObject(obj)) {
    throw new Error(`Error: argument is not a plain object, it is a(n) ${typeof obj} with value ${obj}`);
  }
}

export function isElement(obj: unknown): obj is HTMLElement {
  return (obj instanceof HTMLElement);
}

export function validateIsElement(obj: unknown): asserts obj is HTMLElement {
  if (!isElement(obj)) {
    throw new Error(`Argument is not an HTML element. but it is a(n) ${typeof obj} with value ${obj}`);
  }
}

export function validateIsStyleProps(obj: unknown): asserts obj is StyleProps {
  validateIsPlainObject(obj);
}

export function isDivElement(obj: unknown): obj is HTMLDivElement {
  return (obj instanceof HTMLElement) && (obj.tagName === 'DIV');
}

export function validateIsDivElement(obj: unknown): asserts obj is HTMLDivElement {
  if (!isDivElement(obj)) {
    throw new Error(`Argument is not an HTML DIV element. bit is a(n) ${typeof obj} with value ${obj}`);
  }
}

export function isLineItemElement(obj: unknown): obj is HTMLLIElement {
  return (obj instanceof HTMLElement) && (obj.tagName === 'LI');
}

export function validateIsLineItemElement(obj: unknown): asserts obj is HTMLLIElement {
  if (!isLineItemElement(obj)) {
    throw new Error(`Argument is not an HTML LI element, but is a(n) ${typeof obj} with value ${obj}`);
  }
}

export function isCardDiv(obj: unknown): obj is HTMLDivElement {
  return isDivElement(obj) && obj.classList.contains('card-div');
}

export function validateIsCardDiv(obj: unknown): asserts obj is HTMLDivElement {
  if (!isCardDiv(obj)) {
    const classList = (obj as HTMLElement)?.classList || 'none';
    throw new Error(`Argument does not have "card-div" class but does have ${classList}.`);
  }
}

export function isBizcardDiv(obj: unknown): obj is HTMLDivElement {
  return isDivElement(obj) && obj.classList.contains('bizcard-div');
}

export function validateIsBizcardDiv(obj: unknown): asserts obj is HTMLDivElement {
  if (!isBizcardDiv(obj)) {
    const classList = (obj as HTMLElement)?.classList || 'none';
    throw new Error(`Argument does not have "bizcard-div" class but does have ${classList}.`);
  }
}

export function isCardDivOrBizcardDiv(obj: unknown): obj is HTMLDivElement {
  return isCardDiv(obj) || isBizcardDiv(obj);
}

export function validateIsCardDivOrBizcardDiv(obj: unknown): asserts obj is HTMLDivElement {
  if (!isCardDivOrBizcardDiv(obj)) {
    const classList = (obj as HTMLElement)?.classList || 'none';
    throw new Error(`Argument does not have "card-div" or "bizcard-div" class but does have ${classList}.`);
  }
}

export function isCardDivLineItem(obj: unknown): obj is HTMLLIElement {
  return isLineItemElement(obj) && obj.classList.contains('card-div-line-item');
}

export function validateIsCardDivLineItem(obj: unknown): asserts obj is HTMLLIElement {
  if (!isCardDivLineItem(obj)) {
    const classList = (obj as HTMLElement)?.classList || 'none';
    throw new Error(`Argument does not have "card-div-line-item" class but does have ${classList}.`);
  }
}

// --------------------------------------
// Utility Functions

export function getEuclideanDistance(arr1: number[], arr2: number[]): number {
  if (arr1.length !== arr2.length) {
    throw new Error('Both arrays must have the same length');
  }
  let sum = 0;
  for (let i = 0; i < arr1.length; i++) {
    sum += Math.pow(arr1[i] - arr2[i], 2);
  }
  return Math.sqrt(sum);
}

export const clamp = (value: number, min: number, max: number): number => 
  Math.max(min, Math.min(max, value));

export const adjustRgbBrightness = (rgb: RGB, brightness: number): RGB => {
  validateIntArrayLength(rgb, 3);
  return rgb.map(channel => clamp(Math.round(channel * brightness), 0, 255)) as RGB;
};

export const adjustHexBrightness = (hexStr: string, brightness: number): string => {
  validateHexColorString(hexStr);
  validateFloat(brightness);
  return get_Hex_from_RGB(adjustRgbBrightness(get_RGB_from_Hex(hexStr), brightness));
};

export const get_Hex_from_RGB = (RGB: RGB): string => {
  validateIntArrayLength(RGB, 3);
  return "#" + RGB.map(c => c.toString(16).padStart(2, "0")).join("").toUpperCase();
};

export const get_RGB_from_Hex = (hexStr: string): RGB => {
  validateHexColorString(hexStr);
  const match = hexStr.match(/^#?([A-F\d]{2})([A-F\d]{2})([A-F\d]{2})$/i);
  if (!match) throw new Error(`Invalid hex string: ${hexStr}`);
  return match.slice(1).map(c => parseInt(c, 16)) as RGB;
};

export const toFixedPoint = (value: number, precision: number): number => 
  +value.toFixed(precision);

export const linearInterp = (x: number, x1: number, y1: number, x2: number, y2: number): number => 
  y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);

export const getRandomInt = (min: number, max: number): number => 
  Math.floor(Math.random() * (max - min + 1)) + min;

export const zeroPad = (num: number, places: number): string => 
  num.toString().padStart(places, "0");

export const get_HSV_from_RGB = ([R, G, B]: RGB): HSV => {
  const RGB: RGB = [R, G, B];
  validateRGB(RGB);
  const min = Math.min(R, G, B);
  const max = Math.max(R, G, B);
  const delta = max - min;
  const s = max !== 0 ? delta / max : 0;
  let h = max === min ? 0 : (max === R ? (G - B) / delta + (G < B ? 6 : 0) : max === G ? (B - R) / delta + 2 : (R - G) / delta + 4) * 60;
  if (Number.isNaN(h)) h = 0;
  const v = max;
  const HSV: HSV = [h, s, v].map(Math.round) as HSV;
  validateHSV(HSV);
  return HSV;
};

export const get_RGB_from_HSV = ([h, s, v]: HSV): RGB => {
  const HSV: HSV = [h, s, v];
  validateHSV(HSV);
  const f = (n: number, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  const RGB: RGB = [f(5), f(3), f(1)].map(Math.round) as RGB;
  validateRGB(RGB);
  return RGB;
};

export function get_RGB_from_RgbStr(rgbStr: string): RGB | null {
  if (isString(rgbStr)) {
    rgbStr = rgbStr.replaceAll(" ", "");
    const regex = /rgb\((\d+),(\d+),(\d+)\)/;
    const matches = rgbStr.match(regex);
    if (matches) {
      const [, rStr, gStr, bStr] = matches;
      const R = parseInt(rStr, 10);
      const G = parseInt(gStr, 10);
      const B = parseInt(bStr, 10);
      const RGB: RGB = [R, G, B];
      if (isRGB(RGB)) return RGB;
    }
  }
  return null;
}

export function get_RgbStr_from_RGB(RGB: RGB): string {
  return `rgb(${RGB[0]}, ${RGB[1]}, ${RGB[2]})`;
}

export function get_RGB_from_ColorStr(colorStr: string): RGB | null {
  if (isString(colorStr) && colorStr.length > 6) {
    colorStr = colorStr.replaceAll(" ", "");
    const regex = /color\((\d+),(\d+),(\d+)\)/;
    const matches = colorStr.match(regex);
    if (matches) {
      const [, rStr, gStr, bStr] = matches;
      const R = parseInt(rStr, 10);
      const G = parseInt(gStr, 10);
      const B = parseInt(bStr, 10);
      return [R, G, B];
    }
  }
  return null;
}

export function get_ColorStr_from_RGB(RGB: RGB): string {
  validateRGB(RGB);
  return `color(${RGB[0]}, ${RGB[1]}, ${RGB[2]})`;
}

export function get_RGB_from_AnyStr(anyStr: string): RGB | null {
  if (!isString(anyStr) || anyStr.trim() === '') {
    console.trace(`anyStr:[${anyStr}] is undefined, null, or blank`);
    return null;
  }
  
  let hex = css_colors.get_HEX_from_CssColor(anyStr);
  if (hex && /^#[0-9A-F]{6}$/.test(hex)) {
    return get_RGB_from_Hex(hex);
  }
  if (/^#[0-9A-F]{6}$/.test(anyStr)) {
    return get_RGB_from_Hex(anyStr);
  }
  if ((anyStr as string).startsWith('rgb')) {
    return get_RGB_from_RgbStr(anyStr);
  }
  if ((anyStr as string).startsWith('color')) {
    return get_RGB_from_ColorStr(anyStr);
  }
  console.trace(`anyStr:[${anyStr}] unable to find matching RGB converter`);
  return null;
}

export function get_Hex_from_ColorStr(colorStr: string): string {
  const RGB = get_RGB_from_AnyStr(colorStr);
  if (!RGB) throw new Error(`Cannot convert colorStr: ${colorStr}`);
  return get_Hex_from_RGB(RGB);
}

export function normalizeHexColorString(hexColorStr: string): string {
  const dummy = document.createElement("div");
  dummy.style.color = hexColorStr;
  document.body.appendChild(dummy);
  const computedColor = getComputedStyle(dummy).color;
  document.body.removeChild(dummy);
  
  const rgbMatch = /rgb\((\d+), (\d+), (\d+)\)/.exec(computedColor);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
  }
  return hexColorStr;
}

export const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => 
  Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

export const isBetween = (value: number, min: number, max: number): boolean => 
  value >= min && value <= max;

export const createRect = (x1: number, y1: number, x2: number, y2: number): Rect => ({
  left: Math.min(x1, x2),
  top: Math.min(y1, y2),
  right: Math.max(x1, x2),
  bottom: Math.max(y1, y2)
});

export const isPointInsideRect = (x: number, y: number, rect: Rect): boolean => 
  x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

export const half = (value: number): number => {
  if (typeof value !== 'number') {
    throw new Error(`Value '${value}' is not a number`);
  }
  return Math.floor(value / 2);
};

export const getMonthDates = (year: number, month: number): { start: Date; end: Date } => ({
  start: new Date(year, month - 1, 1),
  end: new Date(year, month, 0)
});

export const getIsoDateString = (date: Date): string => 
  date.toISOString().slice(0, 10);

export const linearInterpArray = (t: number, array1: number[], array2: number[]): number[] => {
  validateIsNumericArray(array1);
  validateIsNumericArray(array2);
  if (array1.length !== array2.length) {
    throw new Error('linearInterpArray length not equal');
  }
  
  const interpolatedArray: number[] = [];
  for (let i = 0; i < array1.length; i++) {
    const channelInterpolation = linearInterp(t, 0, array1[i], 1, array2[i]);
    interpolatedArray.push(Math.round(channelInterpolation));
  }
  validateIsNumericArray(interpolatedArray);
  return interpolatedArray;
};

export const arrayHasNaNs = (array: number[]): boolean => 
  array.some(element => Number.isNaN(element));

export const arraysAreEqual = (arr1: unknown[], arr2: unknown[]): boolean => 
  arr1.length === arr2.length && arr1.every((element, index) => element === arr2[index]);

export function validateIsArrayOfArrays(obj: unknown): asserts obj is unknown[][] {
  if (!Array.isArray(obj)) {
    throw new Error(`ValueError: Input is not an array, but is a(n) ${typeof obj} with value ${obj}`);
  }
  if (obj.length === 0) {
    throw new Error("ValueError: Array must not be empty");
  }
  obj.forEach(element => {
    validateIsArray(element);
  });
}

export function validateIsStyleFrame(styleFrame: unknown): void {
  validateIsStyleArray(styleFrame);
}

export function validateIsStyleFrameArray(obj: unknown): void {
  validateIsArray(obj);
  obj.forEach(element => {
    validateIsStyleFrame(element);
  });
}

export function validateIsBoolean(arg: unknown): asserts arg is boolean {
  if (typeof arg !== 'boolean') {
    throw new Error(`Argument is not a boolean. but it is a(n) ${typeof arg} with value ${arg}`);
  }
}

export function validateIsStylePropsArray(obj: unknown): void {
  validateIsArray(obj);
  obj.forEach(element => {
    validateIsStyleProps(element);
  });
}

export function getStyleProps(element: HTMLElement): StyleProps {
  validateIsElement(element);
  const computedStyle = window.getComputedStyle(element);
  const styleProps: StyleProps = {};
  
  for (const prop of Array.from(computedStyle)) {
    if (USABLE_STYLE_PROPS.includes(prop)) {
      let dstProp = prop;
      if (prop in STYLE_PROPS_MAP) {
        dstProp = STYLE_PROPS_MAP[prop];
      }
      styleProps[dstProp as keyof StyleProps] = computedStyle.getPropertyValue(prop);
    }
  }
  validateIsStyleProps(styleProps);
  return styleProps;
}

export function getStylePropsString(styleProps: StyleProps): string {
  validateIsStyleProps(styleProps);
  return JSON.stringify(styleProps, null, 2);
}

export function applyStyleProps(element: HTMLElement, styleProps: StyleProps): void {
  validateIsStyleProps(styleProps);
  for (const prop in styleProps) {
    if (styleProps.hasOwnProperty(prop)) {
      let dstProp = prop;
      if (prop in PROPS_STYLE_MAP) {
        dstProp = PROPS_STYLE_MAP[prop];
      }
      (element.style as any)[dstProp] = styleProps[prop as keyof StyleProps];
    }
  }
}

export function getOffset(el: HTMLElement): Offset {
  let _x = 0;
  let _y = 0;
  let element: HTMLElement | null = el;
  
  while (element && !Number.isNaN(element.offsetLeft) && !Number.isNaN(element.offsetTop)) {
    _x += element.offsetLeft - element.scrollLeft;
    _y += element.offsetTop - element.scrollTop;
    element = element.offsetParent as HTMLElement | null;
  }
  return { top: _y, left: _x };
}

export function acronym(text: string): string {
  let acro = "";
  text = text.replace(/[.,\/#!@$%\^&\*;:{}=\-_`~()]/g, "").toUpperCase();
  const parts = text.trim().split(" ");
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (part.length > 0) {
      acro += part[0];
    }
  }
  if (acro.length === 0) {
    acro = text.slice(0, Math.min(3, text.length));
  }
  return acro;
}

export function formatNumber(num: number, format: string): string {
  const [wholeDigits, decimalDigits] = format.split('.').map(Number);
  
  let wholePart = Math.floor(num);
  let decimalPart = num % 1;
  
  let wholePartStr = wholePart.toString();
  let lengthToCheck = num < 0 ? wholePartStr.length - 1 : wholePartStr.length;
  
  if (lengthToCheck > wholeDigits) {
    throw new Error(`Format error: the number ${num} has a whole part larger than ${wholeDigits} digits.`);
  }
  
  let formattedWhole = wholePartStr.padStart(wholeDigits, '0');
  let formattedDecimal = decimalPart.toFixed(decimalDigits).substring(2);
  
  return `${formattedWhole}.${formattedDecimal}`;
}

export function findScrollableAncestor(element: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = element;
  
  while (current && current.parentNode) {
    current = current.parentNode as HTMLElement;
    if (current === document.body) {
      return document.body;
    }
    const overflowY = window.getComputedStyle(current).overflowY;
    const isScrollable = overflowY === 'auto' || overflowY === 'scroll';
    const canScroll = current.scrollHeight > current.clientHeight;

    if (isScrollable && canScroll) {
      return current;
    }
  }
  return null;
}

export function ensureHexColorStringAttribute(obj: HTMLElement, attr: string): void {
  let val: string | null = null;
  let hex: string | null = null;
  
  if (isElement(obj)) {
    if (typeof attr === 'string') {
      val = obj.getAttribute(attr);
      if (isString(val)) {
        if (isHexColorString(val)) {
          return;
        }
        const RGB = get_RGB_from_AnyStr(val);
        if (isRGB(RGB)) {
          hex = get_Hex_from_RGB(RGB);
          if (isHexColorString(hex) && hex !== val) {
            obj.setAttribute(attr, hex);
            return;
          }
        }
      }
    }
  }
  throw new Error(`obj:[${obj}] attr:[${attr}] val:[${val}] hex:[${hex}] is not a valid hexColorString.`);
}

export function ensureHexColorStringStyle(obj: HTMLElement, styleName: string): void {
  const color = (obj.style as any)[styleName];
  if (typeof color === 'undefined' || color === null || color === "") {
    throw new Error(`Style ${styleName} must be defined.`);
  }
  let hex: string | null = null;
  if (isHexColorString(color)) {
    hex = color;
  } else if ((isNumericArray(color) && color.length === 3) || color.startsWith('color')) {
    hex = get_Hex_from_ColorStr(color);
  }
  if (hex !== null) {
    (obj.style as any)[styleName] = hex;
  } else {
    throw new Error(`Style ${styleName} is not a valid hex color string.`);
  }
  validateHexColorString((obj.style as any)[styleName]);
}

export function getObjectAsString(obj: Record<string, unknown>): string {
  let str = "";
  for (const key in obj) {
    const comma = (str === "") ? "" : ", ";
    str += `${comma}${key}:${obj[key]}`;
  }
  return str;
}

export function getAttributesAsObject(element: HTMLElement): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const attribute of Array.from(element.attributes)) {
    attributes[attribute.name] = attribute.value;
  }
  return attributes;
}

export function getAttributesAsString(element: HTMLElement): string {
  const attributes = getAttributesAsObject(element);
  return getObjectAsString(attributes);
}

export function getDatasetAsString(element: HTMLElement): string {
  const dataset = element.dataset;
  return getObjectAsString(dataset as Record<string, unknown>);
}

// Test functions
function test_HSV_RGB_functions(): void {
  function test_get_HSV_from_RGB(): void {
    const RGBIn: RGB = [64, 128, 255];
    const HSV = get_HSV_from_RGB([RGBIn[0], RGBIn[1], RGBIn[2]]);
    const RGBOut = get_RGB_from_HSV([HSV[0], HSV[1], HSV[2]]);
    console.assert(getEuclideanDistance(RGBOut, RGBIn) < EPSILON);
  }
  function test_get_RGB_from_HSV(): void {
    const HSVIn: HSV = [180, 0, 1];
    const RGB = get_RGB_from_HSV([HSVIn[0], HSVIn[1], HSVIn[2]]);
    const HSVOut = get_HSV_from_RGB([RGB[0], RGB[1], RGB[2]]);
    console.assert(getEuclideanDistance(HSVOut, HSVIn) < EPSILON);
  }
  test_get_HSV_from_RGB();
  test_get_RGB_from_HSV();
}

export function test_RGB_RgbStr_functions(): void {
  function test_get_RGB_from_RgbStr(): void {
    const rgbStrIn = 'rgb(255, 64, 127)';
    const RGB = get_RGB_from_RgbStr(rgbStrIn);
    if (!RGB) throw new Error('RGB is null');
    const rgbStrOut = get_RgbStr_from_RGB(RGB);
    console.assert(rgbStrIn === rgbStrOut);
  }
  function test_get_RgbStr_from_RGB(): void {
    const rgbIn: RGB = [255, 0, 0];
    const rgbStr = get_RgbStr_from_RGB(rgbIn);
    const rgbOut = get_RGB_from_RgbStr(rgbStr);
    if (!rgbOut) throw new Error('rgbOut is null');
    console.assert(arraysAreEqual(rgbOut, rgbIn));
  }
  test_get_RGB_from_RgbStr();
  test_get_RgbStr_from_RGB();
}

function test_RGB_ColorStr_functions(): void {
  function test_get_ColorStr_from_RGB(): void {
    const RGBin: RGB = [127, 64, 255];
    const ColorStr = get_ColorStr_from_RGB(RGBin);
    const RGBout = get_RGB_from_ColorStr(ColorStr);
    if (!RGBout) throw new Error('RGBout is null');
    console.assert(arraysAreEqual(RGBout, RGBin));
  }
  function test_get_RGB_from_ColorStr(): void {
    const ColorStrIn = "color(127, 64, 255)";
    const RGB = get_RGB_from_ColorStr(ColorStrIn);
    if (!RGB) throw new Error('RGB is null');
    const ColorStrOut = get_ColorStr_from_RGB(RGB);
    console.assert(ColorStrOut === ColorStrIn);
  }
  test_get_ColorStr_from_RGB();
  test_get_RGB_from_ColorStr();
}

export function testColorFunctions(): void {
  test_RGB_RgbStr_functions();
  test_RGB_ColorStr_functions();
  test_HSV_RGB_functions();
}
