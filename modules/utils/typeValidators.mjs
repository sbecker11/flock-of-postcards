// Type Validators
export const isString = (value) => (typeof value === 'string' || value instanceof String);
export const isNonEmptyString = (value) => (isString(value) && (value.length > 0));
export const isNumber = (value) => typeof value === 'number' && !Number.isNaN(value);

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

export function isRGB(RGB) {
    if (!Array.isArray(RGB) || RGB.length != 3 || RGB[0] < 0 || RGB[0] > 255 || RGB[1] < 0 || RGB[1] > 255 || RGB[2] < 0 || RGB[2] > 255) {
        return false;
    }
    return true;
} 