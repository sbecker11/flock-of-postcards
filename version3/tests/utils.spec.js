/***
 * run these unit tests using
 * `npx jest`
 */

import {
  adjustRgbBrightness,
  adjustHexBrightness,
  clamp,
  getHSVfromRGB,
  getHexFromRGB,
  getRGBfromHex,
  getRGBfromHSV,
  linearInterp,
  toFixedPoint,
  getRandomInt,
  zeroPad,
} from "../src/utils";

describe("adjustRgbBrightness", () => {
  test("adjusts the brightness of an RGB color", () => {
    const originalRGB = [128, 64, 0]; // Original RGB color
    const brightness = 0.5; // Brightness factor (0.0 to 1.0)
    const expectedRGB = [64, 32, 0]; // Expected adjusted RGB color
    const adjustedRGB = adjustRgbBrightness(originalRGB, brightness);
    expect(adjustedRGB).toEqual(expectedRGB);
  });
});

describe("adjustHexBrightness", () => {
  test("adjusts the brightness of a Hex color", () => {
    const originalHex = "#804000"; // Original Hex color
    const brightness = 0.5; // Brightness factor (0.0 to 1.0)
    const expectedHex = "#402000"; // Expected adjusted Hex color
    const adjustedHex = adjustHexBrightness(originalHex, brightness);
    expect(adjustedHex).toEqual(expectedHex);
  });
});

describe("clamp", () => {
  test("clamps a value between min and max", () => {
    expect(clamp(10, 5, 15)).toBe(10);
    expect(clamp(20, 5, 15)).toBe(15);
    expect(clamp(0, 5, 15)).toBe(5);
  });
});

describe("getHSVfromRGB", () => {
  test("converts RGB color to HSV color", () => {
    expect(getHSVfromRGB([255, 0, 0])).toEqual([0, 1, 255]);
    expect(getHSVfromRGB([0, 255, 0])).toEqual([120, 1, 255]);
    expect(getHSVfromRGB([0, 0, 255])).toEqual([240, 1, 255]);
  });
});

describe("getHexFromRGB", () => {
  test("converts RGB color to hex color", () => {
    expect(getHexFromRGB([255, 0, 0])).toBe("#ff0000");
    expect(getHexFromRGB([0, 255, 0])).toBe("#00ff00");
    expect(getHexFromRGB([0, 0, 255])).toBe("#0000ff");
  });
});

describe("getRGBfromHex", () => {
  test("converts hex color to RGB color", () => {
    expect(getRGBfromHex("#ff0000")).toEqual([255, 0, 0]);
    expect(getRGBfromHex("#00ff00")).toEqual([0, 255, 0]);
    expect(getRGBfromHex("#0000ff")).toEqual([0, 0, 255]);
  });
});

describe("getRGBfromHSV", () => {
  test("converts HSV color to RGB color", () => {
    expect(getRGBfromHSV([0, 1, 255])).toEqual([255, 0, 0]);
    expect(getRGBfromHSV([120, 1, 255])).toEqual([0, 255, 0]);
    expect(getRGBfromHSV([240, 1, 255])).toEqual([0, 0, 255]);
  });
});

describe("linearInterp", () => {
  test("performs linear interpolation between two points", () => {
    expect(linearInterp(0, 0, 0, 10, 100)).toBe(0);
    expect(linearInterp(5, 0, 0, 10, 100)).toBe(50);
    expect(linearInterp(10, 0, 0, 10, 100)).toBe(100);
  });
});

describe("toFixedPoint", () => {
  test("returns the given number with the specified precision", () => {
    expect(toFixedPoint(3.14159, 2)).toBe(3.14);
    expect(toFixedPoint(2.71828, 3)).toBe(2.718);
    expect(toFixedPoint(1.61803, 4)).toBe(1.618);
  });
});

describe("zeroPad", () => {
  test("pads a number with zeros to the specified length", () => {
    expect(zeroPad(5, 2)).toBe("05");
    expect(zeroPad(10, 3)).toBe("010");
    expect(zeroPad(7, 4)).toBe("0007");
  });
});

describe("getRandomInt", () => {
  test("generates a random integer between min and max (inclusive)", () => {
    const min = 5;
    const max = 10;
    const randomNumber = getRandomInt(min, max);
    expect(randomNumber).toBeGreaterThanOrEqual(min);
    expect(randomNumber).toBeLessThanOrEqual(max);
    expect(Number.isInteger(randomNumber)).toBe(true);
  });
});


describe("Color Conversion", () => {

  function getRGBtoHSVconversionErrors(inputRGB) {
    const outputRGB = getRGBfromHSV(getHSVfromRGB(inputRGB));
    const errorsRGB = inputRGB.map((num, index) => Math.abs(num - outputRGB[index]));
    return errorsRGB;
  }

  // Testing a variety of inputRGB values
  const cases = [
    [[255, 0, 0],[0,0,0]],   // Red
    [[0, 255, 0],[0,0,0]],   // Green
    [[0, 0, 255],[0,0,0]],   // Blue
    [[255, 255, 255],[0,0,0]], // White
    [[0, 0, 0],[0,0,0]]      // Black
  ];

  test.each(cases)(
    "given %p argument, returns %p",
    (arg, expected) => {
      const result = getRGBtoHSVconversionErrors(arg);
      for (let i = 0; i < 3; i++) {
        expect(result[i]).toBe(expected[i]);
      }
    }
  );
});
