// modules/utils/colorUtils.mjs

import { isString } from '../utils/utils.mjs';
import * as mathUtils from '../utils/mathUtils.mjs';
import { clampInt } from '../utils/utils.mjs';
import { isNonEmptyString } from '../utils/utils.mjs';
import { validateFloat, validateIntArrayLength, validateFloatInRange } from '../utils/utils.mjs';

import { Logger, LogLevel } from "../logger.mjs";
const logger = new Logger("colorUtils", LogLevel.DEBUG);


// --------------------------------------
// Utility export functions

const EPSILON = 1.0;

export function isHexColorString(hexColorStr) {
    return (isNonEmptyString(hexColorStr) && /^#[0-9A-F]{6}$/i.test(String(hexColorStr)));
}

export function validateHexColorString(hexColorStr) {
    if (!isHexColorString(hexColorStr) ) {
        throw new Error(`hexColorStr: '${hexColorStr}' is invalid.`);
    }
}

export function abs(val) {
    if ( typeof val !== 'number' ) {
        throw new Error(`abs: val:${val} is not a number`);
    }
    return val < 0 ? -val : val; 
}

export function abs_diff(val1, val2) {
    if ( typeof val1 !== 'number' || typeof val2 !== 'number' ) {
        throw new Error(`abs_diff: val1:${val1} or val2:${val2} is not a number`);
    }
    return val1 < val2 ? val2 - val1 : val1 - val2; 
}

export function min(val1, val2) {
    if ( typeof val1 !== 'number' || typeof val2 !== 'number' ) {
        throw new Error(`min: val1:${val1} or val2:${val2} is not a number`);
    }
    return val1 < val2 ? val1 : val2;
}

export function max(val1, val2) {
    if ( typeof val1 !== 'number' || typeof val2 !== 'number' ) {
        throw new Error(`max: val1:${val1} or val2:${val2} is not a number`);
    }
    return val1 > val2 ? val1 : val2;
}

export function max3(val1, val2, val3) {
    if ( typeof val1 !== 'number' || typeof val2 !== 'number' || typeof val3 !== 'number' ) {
        throw new Error(`max3: val1:${val1} or val2:${val2} or val3:${val3} is not a number`);
    }
    return max(max(val1, val2), val3);
}

export function getEuclideanDistance(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        throw new Error('Both arrays must have the same length');
    }
    let sum = 0;
    for (let i = 0; i < arr1.length; i++) {
        sum += Math.pow(arr1[i] - arr2[i], 2);
    }
    return Math.sqrt(sum);
}


// return the maximum rgb difference between the hex strings
export function getHexDifference(hexStr1, hexStr2) {
    const rgb1 = get_RGB_from_Hex(hexStr1);
    const rgb2 = get_RGB_from_Hex(hexStr2);
    const rDist = abs(rgb1[0] - rgb2[0]);
    const gDist = abs(rgb1[1] - rgb2[1]);
    const bDist = abs(rgb1[2] - rgb2[2]);
    return max3(rDist, gDist, bDist);
}

export function clampDegrees(value) {
    // guaranteed to return a value between 0 and 360.0 degrees
    while ( value < 0.0 ) {
        value += 360.0;
    }
    while ( value > 360.0 ) {
        value -= 360.0;
    }
    return clampInt(value, 0, 360);
}

export const adjustRgbBrightness = (rgb, brightness) => { validateIntArrayLength(rgb, 3); return rgb.map(channel => clampInt(Math.round(channel * brightness), 0, 255)); }; // 1.0 is normal brightness
export const adjustHexBrightness = (hexStr, brightness) => { validateHexColorString(hexStr); validateFloat(brightness); return get_Hex_from_RGB(adjustRgbBrightness(get_RGB_from_Hex(`${hexStr}`), brightness)); }; // 1.0 is normal brightness
export const get_RGB_from_Hex = hexStr => {
    validateHexColorString(hexStr);
    const r = parseInt(hexStr.slice(1, 3), 16);
    const g = parseInt(hexStr.slice(3, 5), 16);
    const b = parseInt(hexStr.slice(5, 7), 16);
    return [r, g, b];
};
export const get_RGBA_from_RGB = (RGB, alpha) => { validateIntArrayLength(RGB, 3); validateFloatInRange(alpha, 0.0, 1.0); return `rgba(${RGB[0]}, ${RGB[1]}, ${RGB[2]}, ${alpha})`; };

export const get_Hex_from_RGB = RGB => { validateIntArrayLength(RGB, 3); return "#" + RGB.map(c => c.toString(16).padStart(2, "0")).join("").toUpperCase(); };

export function isHSV(HSV) {
    if (!Array.isArray(HSV)) return false;
    if (HSV.length != 3) return false;
    if (HSV[0] < 0.0) return false;
    if (HSV[0] > 360.0) return false;
    if (HSV[1] < 0.0) return false;
    if (HSV[1] > 100.0) return false;
    if (HSV[2] < 0.0) return false;
    if (HSV[2] > 100.0) return false;
    return true;
}


export function validateHSV(HSV) {
    if ( !isHSV(HSV) ) {
        throw new Error(`HSV:[${HSV}] is invalid`);
    }
}

export function isRGB(RGB) {
    if (!Array.isArray(RGB) || RGB.length != 3 || RGB[0] < 0 || RGB[0] > 255 || RGB[1] < 0 || RGB[1] > 255 || RGB[2] < 0 || RGB[2] > 255) {
        return false;
    }
    return true;
}

export function validateRGB(RGB) {
    if ( !isRGB(RGB) ) {
        throw new Error(`RGB:[${RGB}] is invalid`);
    }
}

// given RGB (255,255,255) return HSV (360,100,100) 
export function get_HSV_from_RGB([R, G, B]) {
    const RGB = [R,G,B];
    validateRGB(RGB);
    const r = R/255.0;
    const g = G/255.0;
    const b = B/255.0;
  
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
  
    let h, s, v = max;
  
    if (delta === 0) {
      h = s = 0; // achromatic
    } else {
      s = delta / max;
  
      if (max === r) {
        h = (g - b) / delta + (g < b ? 6 : 0);
      } else if (max === g) {
        h = (b - r) / delta + 2;
      } else {
        h = (r - g) / delta + 4;
      }
  
      h /= 6;
    }
    const H = clampDegrees(h * 360);
    const S = clampInt(s * 100.0, 0, 100);
    const V = clampInt(v * 100.0, 0, 100);
    const HSV = [H,S,V];
    validateHSV(HSV);

    return HSV;
}

// given HSV array [h,s,v (360,100,100) return RGB array [r,g,b] [255,255,255]
export const get_RGB_from_HSV = (HSV) => {
    validateHSV(HSV);
    const h = HSV[0];
    const s = HSV[1] / 100.0;
    const v = HSV[2] / 100.0;
    function f(n) {
        const k = (n + h / 60) % 6;
        const factor = Math.max(Math.min(k, 4 - k, 1), 0);
        return v - v * s * factor;
    }
    const RGB = [ 255.0 * f(5), 255.0 * f(3),255.0 *  f(1) ].map(Math.round);
    validateRGB(RGB);
    return RGB;
}

export function get_HSV_from_Hex(hexStr) {
    validateHexColorString(hexStr);
    const RGB = get_RGB_from_Hex(hexStr);
    validateRGB(RGB);
    // @ts-ignore
    const HSV = get_HSV_from_RGB(RGB);
    validateHSV(HSV);
    return HSV;
}

export function get_Hex_from_HSV(HSV) {
    validateHSV(HSV);
    const RGB = get_RGB_from_HSV(HSV);
    validateRGB(RGB);
    const Hex = get_Hex_from_RGB(RGB);
    validateHexColorString(Hex);
    return Hex;
}


export function test_HSV_RGB_Hex_functions() {
    function test_get_HSV_from_RGB() {
        const RGBIn = [64, 128, 255];
        const HSV = get_HSV_from_RGB([RGBIn[0],RGBIn[1],RGBIn[2]]);
        const RGBOut = get_RGB_from_HSV([HSV[0],HSV[1],HSV[2]]);
        const rgbDist = getEuclideanDistance(RGBOut, RGBIn);
        if ( rgbDist > EPSILON )
            logger.log(`ERROR: rgbDist:${rgbDist} exceeds ESPSILON:${EPSILON}`);
    }
    function test_get_RGB_from_HSV() {
        const HSVIn = [180, 75, 100]; // H in [0..360], S in [0..100], V in [0..100]
        const RGB = get_RGB_from_HSV([HSVIn[0],HSVIn[1],HSVIn[2]]);
        const HSVOut = get_HSV_from_RGB([RGB[0],RGB[1],RGB[2]]);
        const hsvDist = getEuclideanDistance(HSVOut, HSVIn);
        if (hsvDist > EPSILON ) 
            logger.log(`ERROR: hsvDist:${hsvDist} exceeds ESPSILON:${EPSILON}`);
    }
    function test_get_HSV_from_Hex() {
        const hexStr = "#66AAEE";
        const HSV = get_HSV_from_Hex(hexStr);
        const hexOut = get_Hex_from_HSV(HSV);
        const hexDiff = getHexDifference(hexStr, hexOut);
        if ( hexDiff > 1 ) {
            logger.log(`ERROR: hexDiff:${hexDiff} exceeds 1`);
        }
    }
    function test_get_Hex_from_HSV() {
        const HSVin = [45, 90, 80];
        const Hex = get_Hex_from_HSV(HSVin);
        const HSVout = get_HSV_from_Hex(Hex);
        const hsvDist = getEuclideanDistance(HSVout, HSVin);
        if ( hsvDist > EPSILON )
            logger.log(`ERROR: hsvDist:${hsvDist} exceeds ESPSILON:${EPSILON}`);
    }
    
    test_get_HSV_from_RGB();
    test_get_RGB_from_HSV();
    test_get_HSV_from_Hex();
    test_get_Hex_from_HSV();
}

export function get_RGB_from_RgbStr(rgbStr) {
    if ( isString(rgbStr) ) {
        rgbStr = rgbStr.replaceAll(" ","");
        const regex = /rgb\((\d+),(\d+),(\d+)\)/;
        const matches = rgbStr.match(regex);
        if (matches) {
            const [ , rStr, gStr, bStr ] = matches;
            const R = parseInt(rStr, 10);
            const G = parseInt(gStr, 10);
            const B = parseInt(bStr, 10);
            const RGB = [ R, G, B ];
            if( isRGB(RGB) )
                return RGB;
        }
    }
    return null;
}
export function get_RgbStr_from_RGB(RGB) {
    return `rgb(${RGB[0]}, ${RGB[1]}, ${RGB[2]})`;
}
export function test_RGB_RgbStr_functions() {
    function test_get_RGB_from_RgbStr() {
        const rgbStrIn = 'rgb(255, 64, 127)';
        const RGB = get_RGB_from_RgbStr(rgbStrIn);
        const rgbStrOut = get_RgbStr_from_RGB(RGB);
        const rgbDist = getEuclideanDistance(RGB, [255, 64, 127]);
        if ( rgbStrIn !== rgbStrOut )
            logger.log(`ERROR: rgbStrIn:${rgbStrIn} != rgbStrOut:${rgbStrOut}`);
    }
    function test_get_RgbStr_from_RGB() {
        const rgbIn = [255, 0, 0];
        const rgbStr = get_RgbStr_from_RGB(rgbIn);
        const rgbOut = get_RGB_from_RgbStr(rgbStr);
        if ( !mathUtils.arraysAreEqual(rgbOut, rgbIn) )
            logger.log(`ERROR: rgbOut:${rgbOut} != rgbIn:${rgbIn}`);
    }
    test_get_RGB_from_RgbStr();
    test_get_RgbStr_from_RGB();
}

export function get_RGB_from_ColorStr(colorStr) {
    if ( isString(colorStr) && colorStr.length > 6) {
        colorStr = colorStr.replaceAll(" ","");
        const regex = /color\((\d+),(\d+),(\d+)\)/;
        const matches = colorStr.match(regex);
        var RGB = [];
        if (matches) {
            const [ , rStr, gStr, bStr ] = matches;
            const R = parseInt(rStr, 10);
            const G = parseInt(gStr, 10);
            const B = parseInt(bStr, 10);
            RGB = [ R, G, B ];
        }
        return RGB;
    }
    return null;
}
    
export function get_ColorStr_from_RGB(RGB) {
    validateRGB(RGB);
    return `color(${RGB[0]}, ${RGB[1]}, ${RGB[2]})`;
}
// returns a 3-element array of integers or null
export function get_RGB_from_AnyStr(anyStr) {
    if ( isString(anyStr) ) {
        let hex = css_colors.get_HEX_from_CssColor(anyStr);
        if ( isHexColorString(hex) ) {
            return get_RGB_from_Hex(hex);
        } else if ( isHexColorString(anyStr) ) {
            return get_RGB_from_Hex(anyStr);
        } else if ( anyStr.startsWith('rgb') ) {
            return get_RGB_from_RgbStr(anyStr);
        } else if ( anyStr.startsWith('color') ) {
            return get_RGB_from_ColorStr(anyStr);
        } else {
            console.trace(`anyStr:[${anyStr}] unable to find matching RGB converter`);
            return null;
        }
    }
    console.trace(`anyStr:[${anyStr}] is undefined, null, or blank`);
    return null;
}

export function test_RGB_ColorStr_functions() {
    function test_get_ColorStr_from_RGB() {
        const RGBin = [127, 64, 255];
        const ColorStr = get_ColorStr_from_RGB(RGBin);
        const RGBout = get_RGB_from_ColorStr(ColorStr);
        if ( !mathUtils.arraysAreEqual(RGBout, RGBin) )
            logger.log(`ERROR: RGBout:${RGBout} != RGBin:${RGBin}`);
    }
    function test_get_RGB_from_ColorStr() {
        const ColorStrIn = "color(127, 64, 255)";
        const RGB = get_RGB_from_ColorStr(ColorStrIn);
        const ColorStrOut = get_ColorStr_from_RGB(RGB);
        if ( ColorStrOut != ColorStrIn )
            logger.log(`ERROR: ColorStrOut:${ColorStrOut} != ColorStrIn:${ColorStrIn}`);
    }
    test_get_ColorStr_from_RGB();
    test_get_RGB_from_ColorStr();
}

export function get_Hex_from_ColorStr(colorStr) {
    var RGB = get_RGB_from_AnyStr(colorStr); 
    return get_Hex_from_RGB(RGB);
}

export function normalizeHexColorString(hexColorStr) {
    // Create a dummy element to leverage the browser's color parsing
    var dummy = document.createElement("div");
    dummy.style.color = hexColorStr;
    document.body.appendChild(dummy);

    // Get the computed style and extract the color
    var computedColor = getComputedStyle(dummy).color;

    // Remove the dummy element
    document.body.removeChild(dummy);

    // Convert to hex (if necessary) and return
    // This part may need to be extended based on the format
    var rgbMatch = /rgb\((\d+), (\d+), (\d+)\)/.exec(computedColor);
    if (rgbMatch) {
        var r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
        var g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
        var b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`.toUpperCase();
    }
    return hexColorStr; // Fallback if not RGB
}

export function clampHSV(colorHSV) {
    return [clampDegrees(colorHSV[0]), clampInt(colorHSV[1],0,100), clampInt(colorHSV[2],0,100)];
}


// return black if luminence/value > 0.5 otherwise return white
export function getHighContrastCssHexColorStr(bgHex) {
    validateHexColorString(bgHex);
    const bgRGB = get_RGB_from_Hex(bgHex);
    validateRGB(bgRGB);
    // @ts-ignore
    const bgHSV = get_HSV_from_RGB(bgRGB);
    validateHSV(bgHSV);
    const clampedHSV = clampHSV(bgHSV);
    validateHSV(clampedHSV);
    const value = clampedHSV[2];
    const fgHex = value < 65 ? "#FFFFFF" : "#000000";
    validateHexColorString(fgHex);
    return fgHex;
}

// This function tests the high/low contrast color generated 
// by comparing a low/high luminance colos
export function test_getHighContrastCssHexColorStr() {
    let lo_RGB = [26, 13, 46];
    validateRGB(lo_RGB)
    let lo_Hex = get_Hex_from_RGB( lo_RGB );
    let hi_Hex = getHighContrastCssHexColorStr(lo_Hex);
    let hi_RGB = get_RGB_from_Hex(hi_Hex);
    logger.log(`lo_RGB:${lo_RGB} lo_Hex:${lo_Hex} -> hi_Hex:${hi_Hex} hi_RGB:${hi_RGB}`);
    if ( hi_RGB[0] !== 0xff || hi_RGB[1] !== 0xff || hi_RGB[2] !== 0xff ) {
        logger.log("FAILURE expected white, not hi_RGB:", hi_RGB);
    } 

    hi_RGB = [222, 100, 150];
    validateRGB(lo_RGB)
    hi_Hex = get_Hex_from_RGB( hi_RGB );
    lo_Hex = getHighContrastCssHexColorStr(hi_Hex);
    lo_RGB = get_RGB_from_Hex(lo_Hex);
    logger.log(`hi_Hex:${hi_Hex} hi_RGB:${hi_RGB} -> lo_RGB:${lo_RGB} lo_Hex:${lo_Hex} `);
    if ( lo_RGB[0] !== 0 || lo_RGB[1] !== 0 || lo_RGB[2] !== 0 ) {
        logger.log("FAILURE expected black, not lo_RGB:", lo_RGB);
    } 
}

// Color Utilities


// export const adjustRgbBrightness = (rgb, brightness) => { validateIntArrayLength(rgb, 3); return rgb.map(channel => clampInt(Math.round(channel * brightness), 0, 255)); }; // 1.0 is normal brightness
// export const adjustHexBrightness = (hexStr, brightness) => { validateHexColorString(hexStr); validateFloat(brightness); return get_Hex_from_RGB(adjustRgbBrightness(get_RGB_from_Hex(`${hexStr}`), brightness)); }; // 1.0 is normal brightness

// export const get_RGB_from_Hex = hexStr => {
//     validateHexColorString(hexStr);
//     const r = parseInt(hexStr.slice(1, 3), 16);
//     const g = parseInt(hexStr.slice(3, 5), 16);
//     const b = parseInt(hexStr.slice(5, 7), 16);
//     return [r, g, b];
// };

// export const get_RGBA_from_RGB = (RGB, alpha) => { validateIntArrayLength(RGB, 3); validateFloatInRange(alpha, 0.0, 1.0); return `rgba(${RGB[0]}, ${RGB[1]}, ${RGB[2]}, ${alpha})`; };

// export const get_Hex_from_RGB = RGB => { validateIntArrayLength(RGB, 3); return "#" + RGB.map(c => c.toString(16).padStart(2, "0")).join("").toUpperCase(); };

// export function get_HSV_from_RGB([R, G, B]) {
//     const RGB = [R,G,B];
//     validateRGB(RGB);
//     const r = R/255.0;
//     const g = G/255.0;
//     const b = B/255.0;
  
//     const max = Math.max(r, g, b);
//     const min = Math.min(r, g, b);
//     const delta = max - min;
  
//     let h, s, v = max;
  
//     if (delta === 0) {
//       h = s = 0; // achromatic
//     } else {
//       s = delta / max;
  
//       if (max === r) {
//         h = (g - b) / delta + (g < b ? 6 : 0);
//       } else if (max === g) {
//         h = (b - r) / delta + 2;
//       } else {
//         h = (r - g) / delta + 4;
//       }
  
//       h /= 6;
//     }
//     const H = clampDegrees(h * 360);
//     const S = clampInt(s * 100.0, 0, 100);
//     const V = clampInt(v * 100.0, 0, 100);
//     const HSV = [H,S,V];
//     validateHSV(HSV);

//     return HSV;
// }

export function get_RGB_distance(RGB1, RGB2) {
    validateRGB(RGB1);
    validateRGB(RGB2);
    let dist = 0;
    for ( let i = 0; i < 3; i++ ) {
        const diff = RGB1[i] - RGB2[i];
        dist += diff * diff;
    }
    return Math.sqrt(dist);
}

// export function get_HSV_from_Hex(hexStr) {
//     validateHexColorString(hexStr);
//     const RGB = get_RGB_from_Hex(hexStr);
//     validateRGB(RGB);
//     const HSV = get_HSV_from_RGB(RGB);
//     validateHSV(HSV);
//     return HSV;
// }

// export function get_Hex_from_HSV(HSV) {
//     validateHSV(HSV);
//     const RGB = get_RGB_from_HSV(HSV);
//     validateRGB(RGB);
//     const Hex = get_Hex_from_RGB(RGB);
//     validateHexColorString(Hex);
//     return Hex;
// }

// export function getHexDifference(hexStr1, hexStr2) {
//     const rgb1 = get_RGB_from_Hex(hexStr1);
//     const rgb2 = get_RGB_from_Hex(hexStr2);
//     const rDist = abs(rgb1[0] - rgb2[0]);
//     const gDist = abs(rgb1[1] - rgb2[1]);
//     const bDist = abs(rgb1[2] - rgb2[2]);
//     return max3(rDist, gDist, bDist);
// }

// export function clampDegrees(value) {
//     // guaranteed to return a value between 0 and 360.0 degrees
//     while ( value < 0.0 ) {
//         value += 360.0;
//     }
//     while ( value > 360.0 ) {
//         value -= 360.0;
//     }
//     return clampInt(value, 0, 360);
// }

/**
 * Checks if an array is a valid HSV color array
 * @param {number[]} HSV - The HSV array to check
 * @returns {boolean} True if the array is a valid HSV color array
 */

// export function validateHSV(HSV) {
//     if (!isHSV(HSV)) {
//         throw new Error(`HSV:[${HSV}] is invalid`);
//     }
// }

// export function isHSV(HSV) {
//     if (!Array.isArray(HSV) || HSV.length !== 3) {
//         return false;
//     }
//     const [h, s, v] = HSV;
//     return (
//         typeof h === 'number' && !isNaN(h) && h >= 0 && h <= 360 &&
//         typeof s === 'number' && !isNaN(s) && s >= 0 && s <= 100 &&
//         typeof v === 'number' && !isNaN(v) && v >= 0 && v <= 100
//     );
// }

// export function (HSV) {
//     if (!Array.isArray(HSV)) return false;
//     if (HSV.length != 3) return false;
//     if (HSV[0] < 0.0) return false;
//     if (HSV[0] > 360.0) return false;
//     if (HSV[1] < 0.0) return false;
//     if (HSV[1] > 100.0) return false;
//     if (HSV[2] < 0.0) return false;
//     if (HSV[2] > 100.0) return false;
//     return true;
// }
    
// /**
//  * Checks if an array is a valid RGB color array
//  * @param {number[]} RGB - The RGB array to check
//  * @returns {boolean} True if the array is a valid RGB color array
//  */
// export function isRGB(RGB) {
//     if (!Array.isArray(RGB) || RGB.length !== 3) {
//         return false;
//     }
//     return RGB.every(channel => typeof channel === 'number' && !isNaN(channel) && channel >= 0 && channel <= 255);
// }

// export function validateRGB(RGB) {
//     if (!isRGB(RGB)) {
//         throw new Error(`RGB:[${RGB}] is invalid`);
//     }
// }

// export function test_HSV_RGB_Hex_functions() {
//     function test_get_HSV_from_RGB() {
//       !isNaN(RGB[channel]) && (0 <= RGB[channel] ) && (RGB[channel] <= 255);
//           const RGBIn = [64, 128, 255];
//         const HSV = get_HSV_from_RGB([RGBIn[0],RGBIn[1],RGBIn[2]]);
//         const RGBOut = get_RGB_from_HSV([HSV[0],HSV[1],HSV[2]]);
//         const rgbDist = getEuclideanDistance(RGBOut, RGBIn);
//         if ( rgbDist > EPSILON )
//             logger.log(`ERROR: rgbDist:${rgbDist} exceeds ESPSILON:${EPSILON}`);
//     }
//     function test_get_RGB_from_HSV() {
//         const HSVIn = [180, 75, 100]; // H in [0..360], S in [0..100], V in [0..100]
//         const RGB = get_RGB_from_HSV([HSVIn[0],HSVIn[1],HSVIn[2]]);
//         const HSVOut = get_HSV_from_RGB([RGB[0],RGB[1],RGB[2]]);
//         const hsvDist = getEuclideanDistance(HSVOut, HSVIn);
//         if (hsvDist > EPSILON ) 
//             logger.log(`ERROR: hsvDist:${hsvDist} exceeds ESPSILON:${EPSILON}`);
//     }
//     function test_get_HSV_from_Hex() {
//         const hexStr = "#66AAEE";
//         const HSV = get_HSV_from_Hex(hexStr);
//         const hexOut = get_Hex_from_HSV(HSV);
//         const hexDiff = getHexDifference(hexStr, hexOut);
//         if ( hexDiff > 1 ) {
//             logger.log(`ERROR: hexDiff:${hexDiff} exceeds 1`);
//         }
//     }
//     function test_get_Hex_from_HSV() {
//         const HSVin = [45, 90, 80];
//         const hexStr = get_Hex_from_HSV(HSVin);
//         const HSVout = get_HSV_from_Hex(hexStr);
//         const hsvDist = getEuclideanDistance(HSVout, HSVin);
//         if ( hsvDist > EPSILON ) {isHSV
//             logger.log(`ERROR: hsvDist:${hsvDist} exceeds ESPSILON:${EPSILON}`);
//         }
//     }
//     test_get_HSV_from_RGB();
//     test_get_RGB_from_HSV();
//     test_get_HSV_from_Hex();
//     test_get_Hex_from_HSV();
// }

// /**
//  * Gets a high contrast CSS hex color string for a given background color
//  * @param {string} backgroundColor - The background color in hex format
//  * @returns {string} A high contrast color in hex format
//  */
// export function getHighContrastCssHexColorStr(backgroundColor) {
//     validateHexColorString(backgroundColor);
//     const rgb = get_RGB_from_Hex(backgroundColor);
//     // Calculate relative luminance using the formula from WCAG 2.0
//     const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
//     // Return black for light backgrounds and white for dark backgrounds
//     return luminance > 0.5 ? '#000000' : '#FFFFFF';
// }

/**
 * Calculates the Euclidean distance between two RGB color arrays
 * @param {number[]} rgb1 - First RGB color array [r,g,b]
 * @param {number[]} rgb2 - Second RGB color array [r,g,b]
 * @returns {number} The Euclidean distance between the colors
 */

/**
 * Checks if a string is a valid hex color
 * @param {string} hexColor - The hex color string to validate
 * @returns {boolean} True if the string is a valid hex color
 */
export function isValidHexColor(hexColor) {
    return typeof hexColor === 'string' && /^#[0-9A-F]{6}$/i.test(hexColor);
}

/**
 * Gets a contrasting color (black or white) for text on the given background color
 * @param {string} backgroundColor - The background color in hex format
 * @returns {string} Either black or white hex color
 */
export function getContrastingColor(backgroundColor) {
    if (!isValidHexColor(backgroundColor)) {
        throw new Error('Invalid hex color format');
    }
    const rgb = get_RGB_from_Hex(backgroundColor);
    // Calculate relative luminance
    const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
    // Use white text for dark backgrounds (luminance < 0.4) and black text for light backgrounds
    return luminance > 0.4 ? '#000000' : '#FFFFFF';
}

/**
 * Adjusts the brightness of a hex color
 * @param {string} hexColor - The hex color to adjust
 * @param {number} factor - The brightness factor (1 = no change, >1 brighter, <1 darker)
 * @returns {string} The adjusted hex color
 */
export function adjustBrightness(hexColor, factor) {
    if (!isValidHexColor(hexColor)) {
        throw new Error('Invalid hex color format');
    }
    const rgb = get_RGB_from_Hex(hexColor);
    const adjustedRgb = rgb.map(channel => 
        clampInt(Math.round(channel * factor), 0, 255)
    );
    return get_Hex_from_RGB(adjustedRgb);
} 

// called from main.mjs
// TEST ALL
export function test_color_utils() {
    test_HSV_RGB_Hex_functions();
    test_RGB_RgbStr_functions();
    test_getHighContrastCssHexColorStr();
    let hexStr = "#66AAEE";
    let HSV = get_HSV_from_Hex(hexStr);
    let hexOut = get_Hex_from_HSV(HSV);
    let hexDiff = getHexDifference(hexStr, hexOut);
    if ( hexDiff > 1 ) {
        logger.log(`ERROR: hexDiff:${hexDiff} exceeds 1`);
    }

    let RGB = get_RGB_from_Hex(hexStr);
    HSV = get_HSV_from_RGB(RGB);
    let RGB_out = get_RGB_from_HSV(HSV);
    let rgbDiff = get_RGB_distance(RGB, RGB_out);
    if ( rgbDiff > 1.0 ) {
        logger.log(`ERROR: rgbDiff:${rgbDiff} exceeds 1.0`);
    }
}
    

// compute the best text color for a given background color
export function computeLuminance(backgroundHexColor) {
    // @ts-ignore
    const [r,g,b] = get_RGB_from_AnyStr(backgroundHexColor);
    return 0.299 * r + 0.587 * g + 0.114 * b;
}
export function computeTextColor(backgroundHexColor) {
    const luminance = computeLuminance(backgroundHexColor);
    return luminance > 75.0 ? '#000000' : '#FFFFFF';
}
export function testColorFunctions() {
    test_RGB_RgbStr_functions();
    test_RGB_ColorStr_functions();
}

export function testColorUtils() {
    logger.log("-------------------------------------");
    test_HSV_RGB_Hex_functions();
    test_RGB_RgbStr_functions();
    test_RGB_ColorStr_functions();
    test_getHighContrastCssHexColorStr();
    testColorFunctions();
    colorUtils.test_color_utils();
    logger.log("-------------------------------------");
}

