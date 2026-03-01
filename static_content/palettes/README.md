# Color Palettes

This directory contains color palette JSON files that can be applied to the bizcard divs in the flock-of-postcards application.

## Adding a New Palette

1. Create a new JSON file in this directory with your palette name (e.g., `mypalette.json`)

2. Format your JSON file like this:

```json
{
  "name": "mypalette",
  "colors": [
    "#color1",
    "#color2",
    "#color3",
    "#color4",
    "#color5",
    "#color6",
    "#color7",
    "#color8"
  ]
}
```

3. Add your palette name to the `palettes.json` file:

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

## Color Requirements

- Colors must be in hexadecimal format (e.g., `#RRGGBB`)
- You can have any number of colors (minimum 1)
- Colors are assigned to bizcard divs using modulo: `bizcardIndex % numColors`
- Text colors (black or white) are automatically calculated based on background brightness

## Available Palettes

- **sweeps**: Warm gradient from deep purples to bright yellows
- **ocean**: Cool blues to warm oranges
- **forest**: Natural greens from dark to light
- **sunset**: Warm reds and oranges to light cream

## Usage

Select a palette from the dropdown menu in the application header. The selected palette will be immediately applied to all bizcard divs.
