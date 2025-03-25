import * as utils from './utils.mjs';

// hard-coded color_palettes object
const _color_palettes = {
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
    "#EEEEEE"
  ],  
  "Light Grey Monotone": [
    "#BBBBBB"
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

export function createPaletteSelector() {
  // any other attempts to create a new instance will fail 
  const paletteSelector = new PaletteSelector();
  paletteSelector.selectPalette(paletteSelector.getFirstPalette());
  return paletteSelector;
}

export class PaletteSelector {
  #instance = null;

  constructor() {
    if ( this.#instance ) {
      console.error("Only one PaletteSelector allowed");
    }
    this.#instance = this;
    console.log("_color_palettes:", _color_palettes);
    console.log("_color_palettes.length:", Object.keys(_color_palettes).length);
    this.color_palettes = _color_palettes;
    console.log("this.color_palettes:", this.color_palettes);
    console.log("this.color_palettes.length:", Object.keys(this.color_palettes).length);
    this.current_value = Object.keys(this.color_palettes)[0];
    this.current_color_palette = this.color_palettes[this.current_value];
    console.log("this.current_color_palette:", this.current_color_palette);
    console.log("this.current_color_palette.length:", Object.keys(this.current_color_palette).length);

    this.current_num_colors = Object.keys(this.current_color_palette).length;
    console.log("this.current_color_num_colors:", this.current_num_colors);

    // Ensure the DOM element for the palette selector exists
    this.paletteSelector = document.getElementById('color-palette-selector');
    if (!this.paletteSelector) {
      throw new Error("color-palette-selector not found");
    }
  
    if (this.paletteSelector.childElementCount > 0) {
      throw new Error("paletteSelector has already been initialized");
    }

    // Clear any existing content in the palette selector
    this.paletteSelector.innerHTML = '';

    // Populate the palette selector with options for each color palette
    for ( let palette_name of Object.keys(this.color_palettes) ) {
      let option = document.createElement('option');
      option.value = palette_name;
      option.selected = (palette_name === this.current_value) ? true : false;
      option.textContent = palette_name;
      this.paletteSelector.appendChild(option);
    }

    // Verify the correct number of options were added
    if (this.paletteSelector.childElementCount !== Object.keys(this.color_palettes).length) {
      throw new Error("wrong number of palette choices in paletteSelector");
    }

    // Add an event listener to handle palette changes
    this.paletteSelector.addEventListener('change', (event) => {
      const selectedValue = event.target.value; // Get the value of the selected option
      console.log("selectedValue:", selectedValue);
      this.selectPalette(selectedValue);
    });
  } // constructor

  selectPalette(selected_value) {
    console.log("selectPallete selected_value:", selected_value);
    if ( selected_value === null || !Object.keys(this.color_palettes).includes(selected_value) ) {
      throw new Error("selected_value matches no color_palette");
    }
    this.current_value = selected_value;
    for( let option of this.paletteSelector.children ) {
      option.selected = (option.value === selected_value) ? true : false;
    }
    this.current_color_palette = this.color_palettes[this.current_value];
    this.current_num_colors = Object.keys(this.current_color_palette).length;

    this.initializePaletteDivColors();
    this.applyPaletteToElements();
    this.applyPaletteToDocument();
  }

  extractDigitsString(data_color_index) {
    return data_color_index.replace(/\D/g, '');
  }

  getFirstPalette() {
    return Object.keys(this.color_palettes)[0];
  }

  // this function is called whenever a palette is selected
  initializePaletteDivColors() {
    // create a map of color_index -> hex_color_strings
    this.bg_hex_colors = new Array(this.current_num_colors);
    this.fg_hex_colors = new Array(this.current_num_colors);
    for ( let index=0; index<this.current_num_colors; index++) {
      const bg_hex_color_string = this.current_color_palette[index];
      const fg_hex_color_string = utils.getHighContrastCssHexColorStr(bg_hex_color_string);
      this.bg_hex_colors[index] = bg_hex_color_string;
      this.fg_hex_colors[index] = fg_hex_color_string;
    }
    this.darker_bg_hex_color = this.findDarkestBgHexColor();
    this.darkest_bg_hex_color = '#000000';
  }

  // this function is called to set the bg and fg colors of the given element
  _applysCurrentPaletteToElement(element) {
    const data_color_index = element.getAttribute("data-color-index");
    if ( ! utils.isNonEmptyString(data_color_index) ) {
      throw new Error("element lacks 'data-color-index' attribute")
    }
    const number_string = this.extractDigitsString(data_color_index);
    const data_color_int = parseInt(number_string, 10);
    const color_index = data_color_int % this.current_num_colors;
    const bgHexColor = this.bg_hex_colors[color_index];
    const fgHexColor = this.fg_hex_colors[color_index];
    element.style.backgroundColor = bgHexColor;
    element.style.color = fgHexColor;
  }

  // called whenever a new palette is selected
  applyPaletteToElements( elements=null ) {
    const propStyleCounter = new utils.PropStyleCounter();
    // defaults to all elements with a "data-color-index" attribute
    if ( elements === null ) {
      elements = document.querySelectorAll("[data-color-index]");
    }
    console.log(`applyingPalleteTo elements.length:${elements.length}`)
    for (const element of elements) {
      if ( element ) {
        propStyleCounter.addProp(element.id);
        const data_color_index = element.getAttribute("data-color-index");
        if ( utils.isNonEmptyString(data_color_index) ) {
          this._applysCurrentPaletteToElement(element);
        }
      }
    }
    console.log("PropStyleCounter -----------------:")
    propStyleCounter.reportPropStyles();
    console.log("----------------------------------:")

  }

  findDarkestBgHexColor() {
    let darkest_value = 100;
    let darkest_bgHexColor = null;
    for (const bgHexColor of this.current_color_palette) {
      const RGB = utils.get_RGB_from_Hex(bgHexColor);
      const value = utils.get_HSV_from_RGB(RGB)[2];
      if (value < darkest_value) {
        darkest_bgHexColor = bgHexColor;
        darkest_value = value;
      }
    }
    return darkest_bgHexColor;
  }
  
  applyPaletteToDocument() {
    try {
      const root = document.documentElement;
      const lightColor = this.findDarkestBgHexColor();
      const darkColor = this.darkest_bg_hex_color;

      // Validate colors are not null/undefined
      if (!lightColor || !darkColor) {
        console.error('Invalid color values:', { light: lightColor, dark: darkColor });
        return false;
      }

      root.style.setProperty('--background-light', lightColor);
      root.style.setProperty('--background-dark', darkColor);
      
      // Verify the colors were set correctly
      const setLight = root.style.getPropertyValue('--background-light');
      const setDark = root.style.getPropertyValue('--background-dark');
      
      console.log(`root.style.[--background-light]: ${setLight}`);
      console.log(`root.style.[--background-dark]: ${setDark}`);

      return setLight && setDark;
    } catch (error) {
      console.error('Error applying color palette:', error);
      return false;
    }
  }
}

