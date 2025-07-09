
// Figma Plugin for Flock of Postcards Design System
// This plugin can be used to import design tokens directly into Figma

figma.showUI(__html__, { width: 400, height: 600 });

// Listen for messages from the plugin UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'import-tokens') {
    const tokens = msg.tokens;
    
    // Import color styles
    if (tokens.colors) {
      await importColors(tokens.colors);
    }
    
    // Import text styles
    if (tokens.typography) {
      await importTypography(tokens.typography);
    }
    
    figma.notify('Design tokens imported successfully!');
  }
};

async function importColors(colors) {
  // Create color styles from tokens
  for (const [category, colorSet] of Object.entries(colors)) {
    for (const [name, value] of Object.entries(colorSet)) {
      const style = figma.createPaintStyle();
      style.name = `${category}/${name}`;
      style.paints = [{
        type: 'SOLID',
        color: parseColor(value)
      }];
    }
  }
}

async function importTypography(typography) {
  // Create comprehensive text styles combining family, size, and weight
  const families = typography.families || {};
  const sizes = typography.sizes || {};
  const weights = typography.weights || {};
  
  // Create text styles for key combinations
  const keyStyles = [
    { family: 'primary', size: 'base', weight: 'normal', name: 'Body/Regular' },
    { family: 'primary', size: 'lg', weight: 'bold', name: 'Heading/H3' },
    { family: 'primary', size: 'xl', weight: 'bold', name: 'Heading/H2' },
    { family: 'primary', size: '2xl', weight: 'bold', name: 'Heading/H1' },
    { family: 'secondary', size: 'sm', weight: 'normal', name: 'Caption/Regular' },
    { family: 'monospace', size: 'base', weight: 'normal', name: 'Code/Regular' }
  ];
  
  for (const styleConfig of keyStyles) {
    try {
      const style = figma.createTextStyle();
      style.name = styleConfig.name;
      
      // Set font family and weight
      const fontFamily = families[styleConfig.family] || 'Inter';
      const fontWeight = getWeightName(weights[styleConfig.weight] || '400');
      
      style.fontName = { 
        family: fontFamily.replace(/[\"']/g, ''), 
        style: fontWeight 
      };
      
      // Set font size
      if (sizes[styleConfig.size]) {
        style.fontSize = parseFloat(sizes[styleConfig.size]);
      }
      
    } catch (error) {
      console.log(`Could not create text style ${styleConfig.name}:`, error);
    }
  }
}

function parseColor(colorValue) {
  // Handle hex colors
  if (colorValue.startsWith('#')) {
    return hexToRgb(colorValue);
  }
  
  // Handle rgba colors
  if (colorValue.startsWith('rgba')) {
    return rgbaToRgb(colorValue);
  }
  
  // Default fallback
  return { r: 0, g: 0, b: 0 };
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
}

function rgbaToRgb(rgba) {
  const match = rgba.match(/rgba?\(([^)]+)\)/);
  if (!match) return { r: 0, g: 0, b: 0 };
  
  const values = match[1].split(',').map(v => parseFloat(v.trim()));
  return {
    r: values[0] / 255,
    g: values[1] / 255,
    b: values[2] / 255
  };
}

function getWeightName(weight) {
  const weightMap = {
    '100': 'Thin',
    '200': 'ExtraLight',
    '300': 'Light',
    '400': 'Regular',
    '500': 'Medium',
    '600': 'SemiBold',
    '700': 'Bold',
    '800': 'ExtraBold',
    '900': 'Black'
  };
  return weightMap[weight] || 'Regular';
}
