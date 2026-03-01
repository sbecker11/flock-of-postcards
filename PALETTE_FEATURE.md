# Color Palette Selector Feature

## Overview

A dynamic color palette system that allows users to select different color schemes for bizcard divs through a dropdown menu.

## Implementation Details

### Files Created/Modified

#### New Files:
1. **`src/modules/color_palette.ts`** - Core palette management module
   - `fetchAvailablePalettes()` - Fetches list of available palettes from server
   - `loadPalette(url)` - Loads a palette from a URL
   - `loadPaletteByName(name)` - Loads a palette by name from palettes directory
   - `getColorByIndex(index)` - Gets color using modulo arithmetic
   - `getContrastTextColor(hex)` - Calculates optimal text color (black/white)
   - `recolorAllBizCardDivs()` - Applies current palette to all existing bizcards

2. **`static_content/palettes/`** - Palette directory
   - `palettes.json` - Master list of available palettes
   - `sweeps.json` - Warm gradient palette (default)
   - `ocean.json` - Cool blues to warm oranges
   - `forest.json` - Natural greens
   - `sunset.json` - Warm reds and oranges
   - `README.md` - Documentation for creating custom palettes

#### Modified Files:
1. **`src/modules/bizcard.ts`**
   - Added palette mode support
   - `setUsePaletteColors(enabled)` - Toggle palette vs job colors
   - Modified `createBizcardDiv()` to use palette colors when enabled

2. **`src/main.ts`**
   - Added `paletteSelector`, `paletteIcon`, and `paletteSelectorPopup` DOM references
   - `initializePaletteSelector()` - Populates dropdown with available palettes
   - `togglePaletteSelectorPopup()` - Shows/hides palette selector popup
   - `handlePaletteChange()` - Handles palette selection and closes popup
   - Modified `handleWindowLoad()` to initialize palette system
   - Added click handlers for icon toggle and outside-click dismissal

3. **`index.html`**
   - Added color palette icon in footer (replaces monoColor icon)
   - Added popup palette selector that appears when icon is clicked

4. **`README.md`**
   - Added Color Palettes section documenting the feature

## How It Works

### Color Assignment Algorithm
```typescript
const colorIndex = bizcardIndex % numberOfColorsInPalette;
const backgroundColor = palette.colors[colorIndex];
const textColor = getContrastTextColor(backgroundColor);
```

### Workflow
1. On page load:
   - Fetch list of available palettes from `static_content/palettes/palettes.json`
   - Populate dropdown with palette names
   - Load default palette (first in list)
   - Create bizcards with palette colors

2. On palette selection:
   - Load selected palette JSON
   - Call `recolorAllBizCardDivs()` to update all existing bizcards
   - Update both visual colors and saved color attributes

### Text Color Calculation
The system automatically calculates whether to use black or white text based on background luminance:
```typescript
luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
textColor = luminance > 0.5 ? '#000000' : '#FFFFFF'
```

## Usage

### For Users
1. Start the dev server: `npm run dev`
2. Open the application
3. Click the **color palette icon** (🎨) in the bottom-right footer
4. Select a palette from the popup dropdown
5. Colors are applied instantly to all bizcards
6. The popup automatically closes after selection

### Adding Custom Palettes

1. Create a new JSON file in `static_content/palettes/`:
```json
{
  "name": "mypalette",
  "colors": [
    "#color1",
    "#color2",
    "#color3"
  ]
}
```

2. Add the palette name to `static_content/palettes/palettes.json`:
```json
{
  "palettes": [
    "sweeps",
    "ocean",
    "forest",
    "sunset",
    "mypalette"
  ]
}
```

3. Reload the application - your palette will appear in the dropdown

## Features

✅ Dynamic palette loading from server  
✅ Dropdown UI for palette selection  
✅ Instant color application to all bizcards  
✅ Automatic text color calculation for readability  
✅ Support for unlimited palettes  
✅ Backward compatible (falls back to job-defined colors)  
✅ Modulo-based color distribution (cycles through palette colors)  
✅ Comprehensive error handling  

## Testing

1. **Test default palette loading:**
   - Start dev server
   - Verify "sweeps" palette is loaded by default
   - Check console for confirmation message

2. **Test palette switching:**
   - Select "ocean" from dropdown
   - Verify all bizcards change colors immediately
   - Try each palette

3. **Test custom palette:**
   - Create a new palette JSON file
   - Add it to palettes.json
   - Reload app and select your palette

4. **Test error handling:**
   - Temporarily rename palettes.json
   - Reload app - should fall back to job colors
   - Check console for error messages

## Future Enhancements

- Add palette preview thumbnails
- Support for gradient palettes
- User-created palettes saved in localStorage
- Palette editor UI
- Import/export palette functionality
- Theme presets (dark mode, light mode, high contrast)
