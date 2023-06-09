const { getRGBfromHSV, getHSVfromRGB } = require('./utils');

function getRGBtoHSVconversionErrors(inputRGB) {
  const outputRGB = getRGBfromHSV(getHSVfromRGB(inputRGB));
  const errorsRGB = [0, 0, 0];

  for (let c = 0; c < inputRGB.length; c++) {
    errorsRGB[c] = Math.abs(inputRGB[c] - outputRGB[c]);
  }

  return errorsRGB;
}

// Testing a variety of inputRGB values
const inputRGBValues = [
  [255, 0, 0],   // Red
  [0, 255, 0],   // Green
  [0, 0, 255],   // Blue
  [255, 255, 255], // White
  [0, 0, 0]      // Black
];

for (const inputRGB of inputRGBValues) {
  const errorsRGB = getRGBtoHSVconversionErrors(inputRGB);
  console.log(`Input RGB: ${inputRGB}, Errors: ${errorsRGB}`);
}
