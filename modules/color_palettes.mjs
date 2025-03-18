import * as utils from './utils.mjs';

// modules/color_palettes.mjs
export const color_palettes = {
  "Hyperpop": [
    "#FF007A", "#00FFCC", "#FFCC00", "#9900FF", "#FF3366",
    "#33FF99", "#FF6600", "#CC00FF", "#66FFCC", "#FF9933",
    "#FF00CC", "#00CCFF"
  ],
  "Canyon": [
    "#8C5523", "#D9A566", "#BF6F4A", "#4A2C1F", "#E8C8A3",
    "#6B4E31", "#A67B5B", "#F2D2A9", "#5C4033", "#C68E67"
  ],
  "Oceanic": [
    "#003087", "#005B96", "#0077B6", "#0096C7", "#00B4D8",
    "#48CAE4", "#90E0EF", "#006D77", "#83C5BE", "#EDF6F9",
    "#023047"
  ],
  "Retro": [
    "#FF6F61", "#FFB400", "#2A4D69", "#4B86B4", "#F4A261",
    "#E76F51", "#D9BF77", "#264653", "#9B5DE5", "#F15BB5"
  ],
  "Cosmic": [
    "#1A0D2E", "#2E1A47", "#4B286D", "#6A3594", "#8A42B8",
    "#A66EBF", "#C49AD6", "#3F8CFF", "#66A3FF", "#99C2FF",
    "#FFD700", "#FFEA80"
  ],
  "White Monotone": [
    "#eeeeee"
  ],  
  "Light Grey Monotone": [
    "#bbbbbb"
  ],
  "Medium Grey Monotone": [
    "#888888"
  ],
  "Dark Grey Monotone": [
    "#555555"
  ],
  "Black Monotone": [
    "#222222"
  ]
};

export var currently_selected_palette_index = 0;
export var selected_color_palette = Object.values(color_palettes)[currently_selected_palette_index];
export var selected_color_palette_num_colors = selected_color_palette.length;

// Initialize the color palette selector
// example invocation; call this function after the DOM is loaded
// color_palettes.initPaletteSelector();
export function initPaletteSelector() {
  const paletteSelector = document.getElementById('color-palette-selector');
  if (!paletteSelector) {
    console.error("Element with id 'color-palette-selector' not found.");
    return;
  }
  paletteSelector.innerHTML = '';

  Object.keys(color_palettes).forEach((palette_name, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = palette_name;
    if (index === currently_selected_palette_index) {
      option.selected = true;
    }
    paletteSelector.appendChild(option);
  });

  // this is called at document load and 
  // when the user changes the palette
  paletteSelector.addEventListener('change', (event) => {
    console.log("paletteSelector change event:", event);
    let palette_name = event.target.options[event.target.selectedIndex].text;
    console.log("palette_name:", palette_name);
    
    currently_selected_palette_index = parseInt(event.target.value, 10);
    console.log("currently_selected_palette_index:", currently_selected_palette_index);

    selected_color_palette = Object.values(color_palettes)[currently_selected_palette_index];
    console.log("selected_color_palette:", selected_color_palette);

    selected_color_palette_num_colors = selected_color_palette.length;
    console.log("selected_color_palette_num_colors:", selected_color_palette_num_colors);
    
    updatePalette();
  });
}

// let on_palette_change = (palette, numColors) => {};
/**
 * Updates the current color palette and reinitializes the div colors.
 * This function should be called whenever the selected color palette changes.
 */
function updatePalette() {
  console.log("updatePalette calling divColorsUtility.initDivColors()");
  divColorsUtility.initDivColors(); // Reinitialize the divColorsUtility instance
}

// export function setOnPaletteChange(callback) {
//   on_palette_change = callback;
// }

export function updateColorPalette(new_palette) {
  console.log("updateColorPalette called with new_palette:", new_palette);
  selected_color_palette = new_palette;
  selected_color_palette_num_colors = selected_color_palette.length;
  updatePalette();
}

// This class is used for high-performance color updates
class DivColorsUtility {
    constructor() {
        // Singleton pattern to ensure only one instance
        // which is a static property of the class
        // that is undefined at class creation time.
        if (DivColorsUtility.instance) {
            return DivColorsUtility.instance;
        }
        initPaletteSelector();
        this.div_bg_colors = null;
        this.div_fg_colors = null;
        this.div_num_colors = 0;
        this.initDivColors();
        DivColorsUtility.instance = this;
    }

    initDivColors() {
        console.log("initDivColors called");
        console.log("currently_selected_palette_index:", currently_selected_palette_index);

        // Initialize the div colors based on the selected color palette
        this.div_num_colors = selected_color_palette_num_colors;
  
        let bg_color = 0;
        let fg_color = 0;
        this.div_bg_colors = new Array(this.div_num_colors);
        this.div_fg_colors = new Array(this.div_num_colors);
        if ( this.div_num_colors !== selected_color_palette.length ) {
            console.error("this.div_num_colors !== selected_color_palette.length");
        }
        for (let i = 0; i < this.div_num_colors; i++) {
            console.log("i:", i);
            console.log("selected_color_palette:", selected_color_palette);
            console.log("selected_color_palette.length:", selected_color_palette.length);
            console.log("selected_color_palette[i]:", selected_color_palette[i]);
            bg_color = selected_color_palette[i];
            console.log("bg_color:", bg_color);
            fg_color = utils.getHighContrastCssHexColorStr(bg_color);
            this.div_fg_colors[i] = fg_color;
        }
    }

    applyDivColors() {
        // Select all elements with the data-color-index attribute
        const elementsWithColorIndex = document.querySelectorAll('[data-color-index]');
        if (elementsWithColorIndex.length === 0) {
            console.warn("No elements found with data-color-index attribute.");
            return;
        }
        // Initialize the div colors based on the selected color palette
        this.initDivColors();

        // Iterate over the selected elements and set their style.colors
        elementsWithColorIndex.forEach((element) => {
            let color_idx = element.getAttribute('data-color-index');
            if (color_idx == null) {
                console.error(`element:${element} must have a data-color-index attribute`);
                color_idx = 0;
            }
            const index = color_idx % this.div_num_colors;
            element.style.backgroundColor = this.div_bg_colors[index];
            element.style.color = this.div_fg_colors[index];
        });
    }
}

// Create and export a singleton instance of DivColorsUtility
export const divColorsUtility = new DivColorsUtility();

// Example of setting the data-color-index attribute
// const newDiv = document.createElement('div');
// newDiv.setAttribute('data-color-index', '2');
// newDiv.textContent = 'This is a colored div';
// document.body.appendChild(newDiv);

// Example usage of the singleton:
// import { divColorsUtility } from './modules/color_palettes.mjs';
// divColorsUtility.applyDivColors();


