#!/usr/bin/env node

/**
 * Design Token Extraction Script
 * Extracts design tokens from Vue components and CSS files for Figma integration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Design token structure
const designTokens = {
  colors: {
    base: {},
    palettes: {},
    semantic: {}
  },
  typography: {
    families: {},
    sizes: {},
    weights: {},
    lineHeights: {}
  },
  spacing: {
    padding: {},
    margin: {},
    gap: {}
  },
  borders: {
    radius: {},
    width: {},
    colors: {}
  },
  shadows: {
    box: {},
    text: {}
  },
  animation: {
    duration: {},
    easing: {}
  },
  layout: {
    zIndex: {}
  }
};

/**
 * Extract CSS custom properties from styles.css
 */
function extractCSSCustomProperties() {
  const stylesPath = path.join(projectRoot, 'styles.css');
  
  if (!fs.existsSync(stylesPath)) {
    console.log('Warning: styles.css not found');
    return;
  }
  
  const content = fs.readFileSync(stylesPath, 'utf8');
  const customProps = content.match(/--[^:]+:\s*[^;]+/g) || [];
  
  customProps.forEach(prop => {
    const [name, value] = prop.split(':').map(s => s.trim());
    const cleanName = name.replace('--', '');
    
    if (value.includes('rgba') || value.includes('rgb') || value.includes('#')) {
      designTokens.colors.base[cleanName] = value;
    } else if (cleanName.includes('font-family')) {
      designTokens.typography.families[cleanName] = value;
    } else if (cleanName.includes('font-weight')) {
      designTokens.typography.weights[cleanName] = value;
    }
  });
}

/**
 * Extract color palettes from composables
 */
async function extractColorPalettes() {
  const palettesDir = path.join(projectRoot, 'modules', 'palettes');
  
  if (!fs.existsSync(palettesDir)) {
    console.log('Warning: palettes directory not found');
    return;
  }
  
  const paletteFiles = fs.readdirSync(palettesDir).filter(file => file.endsWith('.json'));
  
  for (const file of paletteFiles) {
    const paletteName = path.basename(file, '.json');
    const palettePath = path.join(palettesDir, file);
    
    try {
      const paletteData = JSON.parse(fs.readFileSync(palettePath, 'utf8'));
      designTokens.colors.palettes[paletteName] = paletteData;
    } catch (error) {
      console.log(`Warning: Could not parse palette ${file}:`, error.message);
    }
  }
}

/**
 * Extract design tokens from Vue component styles
 */
function extractFromVueComponents() {
  const componentsDir = path.join(projectRoot, 'modules', 'components');
  
  if (!fs.existsSync(componentsDir)) {
    console.log('Warning: components directory not found');
    return;
  }
  
  const vueFiles = fs.readdirSync(componentsDir).filter(file => file.endsWith('.vue'));
  
  vueFiles.forEach(file => {
    const filePath = path.join(componentsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract style section
    const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    if (!styleMatch) return;
    
    const styles = styleMatch[1];
    
    // Extract colors
    const colors = styles.match(/#[0-9a-fA-F]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)/g) || [];
    colors.forEach(color => {
      const key = `color-${color.replace(/[^a-zA-Z0-9]/g, '-')}`;
      designTokens.colors.semantic[key] = color;
    });
    
    // Extract font sizes
    const fontSizes = styles.match(/font-size:\s*([^;]+)/g) || [];
    fontSizes.forEach(match => {
      const size = match.replace('font-size:', '').trim();
      const key = `size-${size.replace(/[^a-zA-Z0-9]/g, '-')}`;
      designTokens.typography.sizes[key] = size;
    });
    
    // Extract font weights
    const fontWeights = styles.match(/font-weight:\s*([^;]+)/g) || [];
    fontWeights.forEach(match => {
      const weight = match.replace('font-weight:', '').trim();
      const key = `weight-${weight.replace(/[^a-zA-Z0-9]/g, '-')}`;
      designTokens.typography.weights[key] = weight;
    });
    
    // Extract spacing values
    const spacing = styles.match(/(?:padding|margin|gap):\s*([^;]+)/g) || [];
    spacing.forEach(match => {
      const [property, value] = match.split(':').map(s => s.trim());
      const key = `${property}-${value.replace(/[^a-zA-Z0-9]/g, '-')}`;
      
      if (property === 'padding') {
        designTokens.spacing.padding[key] = value;
      } else if (property === 'margin') {
        designTokens.spacing.margin[key] = value;
      } else if (property === 'gap') {
        designTokens.spacing.gap[key] = value;
      }
    });
    
    // Extract border radius
    const borderRadius = styles.match(/border-radius:\s*([^;]+)/g) || [];
    borderRadius.forEach(match => {
      const radius = match.replace('border-radius:', '').trim();
      const key = `radius-${radius.replace(/[^a-zA-Z0-9]/g, '-')}`;
      designTokens.borders.radius[key] = radius;
    });
    
    // Extract z-index values
    const zIndex = styles.match(/z-index:\s*([^;]+)/g) || [];
    zIndex.forEach(match => {
      const index = match.replace('z-index:', '').trim();
      const key = `z-${index}`;
      designTokens.layout.zIndex[key] = index;
    });
  });
}

/**
 * Add predefined design tokens based on audit
 */
function addPredefinedTokens() {
  // Typography families
  designTokens.typography.families = {
    'primary': '"Roboto", sans-serif',
    'secondary': '"Inter", sans-serif',
    'monospace': 'monospace',
    'fallback': 'Arial, Helvetica, sans-serif'
  };
  
  // Common font sizes
  designTokens.typography.sizes = {
    'xs': '8px',
    'sm': '10px',
    'base': '12px',
    'md': '14px',
    'lg': '16px',
    'xl': '20px',
    '2xl': '24px',
    '3xl': '48px'
  };
  
  // Font weights
  designTokens.typography.weights = {
    'thin': '100',
    'normal': '400',
    'bold': '700',
    'black': '900'
  };
  
  // Line heights
  designTokens.typography.lineHeights = {
    'none': '1',
    'tight': '1.2',
    'normal': '1.3'
  };
  
  // Spacing scale
  designTokens.spacing.padding = {
    'none': '0px',
    'xs': '2px',
    'sm': '5px',
    'base': '8px',
    'md': '10px',
    'lg': '15px',
    'xl': '20px',
    '2xl': '25px'
  };
  
  // Border radius
  designTokens.borders.radius = {
    'none': '0px',
    'sm': '4px',
    'base': '25px',
    'full': '50%'
  };
  
  // Shadows
  designTokens.shadows.box = {
    'dropdown': '0 2px 8px rgba(0, 0, 0, 0.2)'
  };
  
  designTokens.shadows.text = {
    'button': '1px 1px 1px rgba(0, 0, 0, 0.8)',
    'scene-label': '2px 2px 4px rgba(0, 0, 0, 0.7)',
    'resume-label': '1px 1px 2px rgba(255, 255, 255, 0.5)'
  };
  
  // Animation
  designTokens.animation.duration = {
    'fast': '0.2s',
    'medium': '0.3s',
    'slow': '0.5s',
    'spinner': '1s'
  };
  
  designTokens.animation.easing = {
    'ease': 'ease',
    'ease-out': 'ease-out',
    'linear': 'linear'
  };
}

/**
 * Clean up and deduplicate tokens
 */
function cleanupTokens() {
  // Remove duplicate colors
  const allColors = new Set();
  Object.keys(designTokens.colors.semantic).forEach(key => {
    const value = designTokens.colors.semantic[key];
    if (allColors.has(value)) {
      delete designTokens.colors.semantic[key];
    } else {
      allColors.add(value);
    }
  });
  
  // Sort tokens alphabetically
  Object.keys(designTokens).forEach(category => {
    if (typeof designTokens[category] === 'object') {
      Object.keys(designTokens[category]).forEach(subcategory => {
        if (typeof designTokens[category][subcategory] === 'object') {
          const sorted = {};
          Object.keys(designTokens[category][subcategory])
            .sort()
            .forEach(key => {
              sorted[key] = designTokens[category][subcategory][key];
            });
          designTokens[category][subcategory] = sorted;
        }
      });
    }
  });
}

/**
 * Main extraction function
 */
async function extractDesignTokens() {
  console.log('🎨 Extracting design tokens from flock-of-postcards...');
  
  try {
    extractCSSCustomProperties();
    await extractColorPalettes();
    extractFromVueComponents();
    addPredefinedTokens();
    cleanupTokens();
    
    // Save tokens to file
    const outputPath = path.join(projectRoot, 'design-tokens.json');
    fs.writeFileSync(outputPath, JSON.stringify(designTokens, null, 2));
    
    console.log('✅ Design tokens extracted successfully!');
    console.log(`📁 Saved to: ${outputPath}`);
    console.log('\n📊 Token Summary:');
    console.log(`   Colors: ${Object.keys(designTokens.colors.base).length + Object.keys(designTokens.colors.palettes).length + Object.keys(designTokens.colors.semantic).length}`);
    console.log(`   Typography: ${Object.keys(designTokens.typography.families).length + Object.keys(designTokens.typography.sizes).length + Object.keys(designTokens.typography.weights).length}`);
    console.log(`   Spacing: ${Object.keys(designTokens.spacing.padding).length + Object.keys(designTokens.spacing.margin).length}`);
    console.log(`   Borders: ${Object.keys(designTokens.borders.radius).length}`);
    console.log(`   Shadows: ${Object.keys(designTokens.shadows.box).length + Object.keys(designTokens.shadows.text).length}`);
    
  } catch (error) {
    console.error('❌ Error extracting design tokens:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  extractDesignTokens();
}

export { extractDesignTokens, designTokens };