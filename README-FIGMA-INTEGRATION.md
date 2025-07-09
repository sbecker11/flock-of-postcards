# Figma Design System Integration

This document explains how to integrate your Flock of Postcards design system with Figma using the custom tooling we've built.

## 🚀 Quick Start

### 1. Extract Design Tokens
```bash
npm run extract-tokens
```
This will analyze your Vue components and CSS files to extract all design tokens (colors, typography, spacing, etc.) and save them to `design-tokens.json`.

### 2. Configure Figma Integration
```bash
npm run figma-sync
```
On first run, this will create a `figma-config.json` file. Fill in your Figma credentials:

```json
{
  "figmaToken": "your-figma-personal-access-token",
  "fileId": "your-figma-file-id",
  "teamId": "your-team-id",
  "libraryName": "Flock of Postcards Design System",
  "publishAsLibrary": false,
  "syncOptions": {
    "colors": true,
    "typography": true,
    "spacing": true,
    "borders": true,
    "shadows": true,
    "components": true
  }
}
```

### 3. Sync with Figma
```bash
npm run figma-sync
```
This will create color styles and text styles in your Figma file based on your design tokens.

### 4. Watch for Changes (Optional)
```bash
npm run watch-figma
```
This will watch your Vue components and CSS files for changes and automatically sync with Figma.

## 📋 Getting Figma Credentials

### Personal Access Token
1. Go to your Figma account settings
2. Navigate to "Personal Access Tokens"
3. Generate a new token
4. Copy the token to your `figma-config.json`

### File ID
1. Open your Figma file
2. Copy the file ID from the URL: `https://www.figma.com/file/FILE_ID/...`
3. Add it to your `figma-config.json`

### Team ID (Optional)
1. Go to your team page in Figma
2. Copy the team ID from the URL
3. Add it to your `figma-config.json`

## 🎨 Design Tokens Extracted

The integration extracts the following design tokens from your codebase:

### Colors
- **Base Colors**: CSS custom properties from `styles.css`
- **Semantic Colors**: All color values found in Vue components
- **Color Palettes**: Dynamic color palettes from your composables

### Typography
- **Font Families**: Roboto, Inter, monospace, fallback fonts
- **Font Sizes**: 8px to 48px (xs, sm, base, md, lg, xl, 2xl, 3xl)
- **Font Weights**: thin (100), normal (400), bold (700), black (900)
- **Line Heights**: none (1), tight (1.2), normal (1.3)

### Spacing
- **Padding**: 0px to 25px (none, xs, sm, base, md, lg, xl, 2xl)
- **Margin**: Similar scale to padding
- **Gap**: For flexbox and grid layouts

### Borders
- **Border Radius**: none (0px), sm (4px), base (25px), full (50%)
- **Border Widths**: 0px to 4px for different states
- **Border Colors**: White, blue, purple, gray variants

### Shadows
- **Box Shadows**: Dropdown shadows, blur effects
- **Text Shadows**: Button text, scene labels, resume labels

### Animations
- **Duration**: fast (0.2s), medium (0.3s), slow (0.5s)
- **Easing**: ease, ease-out, linear

## 🧩 Generated Files

The integration creates several files:

- `design-tokens.json` - Complete design token inventory
- `figma-config.json` - Figma API configuration
- `figma-component-specs.json` - Component specifications for manual creation
- `figma-plugin/` - Complete Figma plugin for advanced integration

## 🔌 Figma Plugin

A complete Figma plugin is generated that allows you to:
- Import design tokens directly into Figma
- Create color styles and text styles
- Sync changes from your codebase

To use the plugin:
1. Go to Figma > Plugins > Development
2. Import the plugin using the `figma-plugin/manifest.json` file
3. Run the plugin to import your design tokens

## 🎯 Component Creation

The system generates specifications for common components:

### Buttons
- **Primary**: Green (#4CAF50) with white text
- **Secondary**: Outline style with green border

### Cards
- **Business Cards**: 300x200px with 25px border radius
- **Dark background** with white text

### Interactive Elements
- **Timeline Markers**: Circular 60px components
- **Focal Points**: Crosshair icons with dynamic colors

## 🔄 Workflow Integration

### Development Workflow
1. Edit your Vue components or CSS
2. Run `npm run extract-tokens` to update tokens
3. Run `npm run figma-sync` to sync with Figma
4. Use the updated design system in Figma

### Automatic Sync
Use `npm run watch-figma` to automatically sync changes:
- Monitors Vue components, CSS files, and composables
- Debounces changes to prevent excessive syncing
- Minimum 5-second interval between syncs

## 💡 Best Practices

### Design Token Organization
- Keep colors organized by category (base, semantic, palettes)
- Use consistent naming conventions
- Document color meanings and use cases

### Component Design
- Create components in Figma that match your Vue components
- Use extracted design tokens for consistency
- Test components across different states (hover, selected, disabled)

### Sync Strategy
- Use manual sync during development
- Use automatic sync for team collaboration
- Review changes before publishing as a library

## 🛠 Troubleshooting

### Common Issues
1. **Token extraction fails**: Check that your Vue components have valid CSS
2. **Figma sync fails**: Verify your API credentials and file permissions
3. **Missing tokens**: Ensure your CSS uses consistent naming conventions

### Debug Mode
Add debug logging to see what tokens are being extracted:
```bash
DEBUG=true npm run extract-tokens
```

## 🚀 Next Steps

1. **Create Component Library**: Use the component specs to create a complete Figma library
2. **Team Collaboration**: Share the library with your team
3. **Automation**: Set up CI/CD to automatically sync changes
4. **Documentation**: Create usage guidelines for your design system

## 📞 Support

If you encounter issues:
1. Check the console output for error messages
2. Verify your Figma credentials and permissions
3. Ensure your Vue components use standard CSS properties
4. Review the generated `design-tokens.json` for completeness

Your design system is now ready for Figma integration! 🎉