// Function to select a random color from the color palette
function getRandomColor() {
  var colors = [
    "#f17ebb", // .color1
    "#ff9787", // .color2
    "#edc588", // .color3
    "#d3eab9", // .color4
    "#c8feed", // .color5
  ];
  var randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
}

// Credit: https://mybrandnewlogo.com/color-palette-generator

// Export the getRandomColor function
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  module.exports = {
    getRandomColor: getRandomColor,
  };
}
