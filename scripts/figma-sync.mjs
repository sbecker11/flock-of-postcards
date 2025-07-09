#!/usr/bin/env node

/**
 * Figma Integration Script
 * Syncs design tokens with Figma using the Figma API
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractDesignTokens } from './extract-design-tokens.mjs';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Load environment variables
dotenv.config({ path: path.join(projectRoot, '.env') });

// Figma API configuration
const FIGMA_API_URL = 'https://api.figma.com/v1';
const CONFIG_FILE = path.join(projectRoot, 'figma-config.json');

/**
 * Configuration template for Figma integration
 */
const defaultConfig = {
  fileId: '', // Figma file ID where components will be created
  teamId: '', // Team ID for creating shared libraries
  libraryName: 'Flock of Postcards Design System',
  publishAsLibrary: false,
  syncOptions: {
    colors: true,
    typography: true,
    spacing: true,
    borders: true,
    shadows: true,
    components: true
  }
};

/**
 * Load or create Figma configuration
 */
function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    console.log('📋 Created figma-config.json - please fill in your Figma credentials');
    console.log('   Required fields:');
    console.log('   - FIGMA_TOKEN: Add your personal access token to .env file');
    console.log('   - fileId: The Figma file ID where components will be created');
    console.log('   - teamId: Your team ID (optional, for shared libraries)');
    return null;
  }
  
  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  
  // Get token from environment variable
  const figmaToken = process.env.FIGMA_TOKEN;
  
  if (!figmaToken || !config.fileId) {
    console.error('❌ Missing required Figma credentials');
    console.log('   Please add FIGMA_TOKEN to .env file and fileId to figma-config.json');
    return null;
  }
  
  // Add token to config
  config.figmaToken = figmaToken;
  
  return config;
}

/**
 * Make authenticated request to Figma API
 */
async function figmaRequest(endpoint, options = {}) {
  const config = loadConfig();
  if (!config) return null;
  
  const url = `${FIGMA_API_URL}${endpoint}`;
  const headers = {
    'X-Figma-Token': config.figmaToken,
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Figma API error: ${response.status} ${error}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ Figma API request failed:', error.message);
    throw error;
  }
}

/**
 * Convert hex color to RGB values for Figma
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  };
}

/**
 * Convert RGBA string to Figma color format
 */
function rgbaToFigma(rgba) {
  const match = rgba.match(/rgba?\(([^)]+)\)/);
  if (!match) return { r: 0, g: 0, b: 0, a: 1 };
  
  const values = match[1].split(',').map(v => parseFloat(v.trim()));
  return {
    r: values[0] / 255,
    g: values[1] / 255,
    b: values[2] / 255,
    a: values[3] || 1
  };
}

/**
 * Convert design token color to Figma format
 */
function colorToFigma(color) {
  if (color.startsWith('#')) {
    return { ...hexToRgb(color), a: 1 };
  } else if (color.startsWith('rgba') || color.startsWith('rgb')) {
    return rgbaToFigma(color);
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

/**
 * Create color styles in Figma
 */
async function syncColors(designTokens, config) {
  console.log('🎨 Syncing colors to Figma...');
  
  const colorStyles = [];
  
  // Base colors
  Object.entries(designTokens.colors.base).forEach(([name, value]) => {
    colorStyles.push({
      name: `Base/${name}`,
      color: colorToFigma(value),
      description: `Base color: ${value}`
    });
  });
  
  // Semantic colors
  Object.entries(designTokens.colors.semantic).forEach(([name, value]) => {
    colorStyles.push({
      name: `Semantic/${name}`,
      color: colorToFigma(value),
      description: `Semantic color: ${value}`
    });
  });
  
  // Color palettes
  Object.entries(designTokens.colors.palettes).forEach(([paletteName, colors]) => {
    if (Array.isArray(colors)) {
      colors.forEach((color, index) => {
        colorStyles.push({
          name: `Palettes/${paletteName}/${index + 1}`,
          color: colorToFigma(color),
          description: `${paletteName} palette color ${index + 1}: ${color}`
        });
      });
    }
  });
  
  // Create color styles via Figma API
  for (const style of colorStyles) {
    try {
      await figmaRequest(`/files/${config.fileId}/styles`, {
        method: 'POST',
        body: JSON.stringify({
          name: style.name,
          style_type: 'FILL',
          description: style.description,
          fills: [{
            type: 'SOLID',
            color: style.color
          }]
        })
      });
      
      console.log(`   ✅ Created color style: ${style.name}`);
    } catch (error) {
      console.log(`   ⚠️  Could not create color style ${style.name}: ${error.message}`);
    }
  }
}

/**
 * Create text styles in Figma
 */
async function syncTypography(designTokens, config) {
  console.log('📝 Syncing typography to Figma...');
  
  const textStyles = [];
  
  // Create combinations of font families, sizes, and weights
  Object.entries(designTokens.typography.families).forEach(([familyName, family]) => {
    Object.entries(designTokens.typography.sizes).forEach(([sizeName, size]) => {
      Object.entries(designTokens.typography.weights).forEach(([weightName, weight]) => {
        textStyles.push({
          name: `Typography/${familyName}/${sizeName}/${weightName}`,
          fontFamily: family.replace(/['"]/g, ''),
          fontSize: parseFloat(size),
          fontWeight: parseInt(weight),
          description: `${family} ${size} ${weight}`
        });
      });
    });
  });
  
  // Create text styles via Figma API
  for (const style of textStyles) {
    try {
      await figmaRequest(`/files/${config.fileId}/styles`, {
        method: 'POST',
        body: JSON.stringify({
          name: style.name,
          style_type: 'TEXT',
          description: style.description,
          text_styles: {
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight
          }
        })
      });
      
      console.log(`   ✅ Created text style: ${style.name}`);
    } catch (error) {
      console.log(`   ⚠️  Could not create text style ${style.name}: ${error.message}`);
    }
  }
}

/**
 * Create component frames in Figma
 */
async function syncComponents(designTokens, config) {
  console.log('🧩 Syncing components to Figma...');
  
  const components = [
    {
      name: 'Button/Primary',
      description: 'Primary button with standard styling',
      width: 120,
      height: 40,
      backgroundColor: colorToFigma('#4CAF50'),
      borderRadius: 4,
      textColor: colorToFigma('#FFFFFF')
    },
    {
      name: 'Button/Secondary',
      description: 'Secondary button with outline styling',
      width: 120,
      height: 40,
      backgroundColor: colorToFigma('transparent'),
      borderRadius: 4,
      borderColor: colorToFigma('#4CAF50'),
      textColor: colorToFigma('#4CAF50')
    },
    {
      name: 'Card/Business',
      description: 'Business card component',
      width: 300,
      height: 200,
      backgroundColor: colorToFigma('#333333'),
      borderRadius: 25,
      textColor: colorToFigma('#FFFFFF')
    },
    {
      name: 'Timeline/Marker',
      description: 'Timeline marker component',
      width: 60,
      height: 60,
      backgroundColor: colorToFigma('#FFFFFF'),
      borderRadius: 30,
      borderColor: colorToFigma('#333333')
    }
  ];
  
  // Note: Component creation via API is complex and requires detailed node structures
  // For now, we'll create a documentation page with component specifications
  
  console.log('   📋 Component specifications prepared for manual creation');
  console.log('   💡 Tip: Use these specifications to create components manually in Figma');
  
  // Save component specifications
  const specsPath = path.join(projectRoot, 'figma-component-specs.json');
  fs.writeFileSync(specsPath, JSON.stringify(components, null, 2));
  console.log(`   📁 Component specs saved to: ${specsPath}`);
}

/**
 * Generate Figma plugin code for advanced integration
 */
function generateFigmaPlugin() {
  const pluginCode = `
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
      style.name = \`\${category}/\${name}\`;
      style.paints = [{
        type: 'SOLID',
        color: hexToRgb(value)
      }];
    }
  }
}

async function importTypography(typography) {
  // Create text styles from tokens
  for (const [category, typeSet] of Object.entries(typography)) {
    for (const [name, value] of Object.entries(typeSet)) {
      const style = figma.createTextStyle();
      style.name = \`\${category}/\${name}\`;
      
      if (category === 'families') {
        style.fontName = { family: value.replace(/['"]/g, ''), style: 'Regular' };
      } else if (category === 'sizes') {
        style.fontSize = parseFloat(value);
      }
    }
  }
}

function hexToRgb(hex) {
  const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
}
`;
  
  const pluginPath = path.join(projectRoot, 'figma-plugin');
  if (!fs.existsSync(pluginPath)) {
    fs.mkdirSync(pluginPath);
  }
  
  fs.writeFileSync(path.join(pluginPath, 'code.js'), pluginCode);
  
  const manifest = {
    name: 'Flock of Postcards Design System',
    id: 'flock-postcards-design-system',
    api: '1.0.0',
    main: 'code.js',
    ui: 'ui.html',
    capabilities: [],
    enableProposedApi: false
  };
  
  fs.writeFileSync(path.join(pluginPath, 'manifest.json'), JSON.stringify(manifest, null, 2));
  
  const uiHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Flock of Postcards Design System</title>
  <style>
    body { font-family: Inter, sans-serif; padding: 20px; }
    button { background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
    button:hover { background: #45a049; }
    .section { margin: 20px 0; }
    .token-count { color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <h2>Design System Importer</h2>
  <div class="section">
    <h3>Import Design Tokens</h3>
    <p>Click below to import your design tokens into Figma:</p>
    <button onclick="importTokens()">Import All Tokens</button>
    <div class="token-count" id="tokenCount">Loading...</div>
  </div>
  
  <script>
    async function importTokens() {
      try {
        const response = await fetch('/design-tokens.json');
        const tokens = await response.json();
        
        parent.postMessage({
          pluginMessage: {
            type: 'import-tokens',
            tokens: tokens
          }
        }, '*');
        
      } catch (error) {
        console.error('Error importing tokens:', error);
        alert('Error importing tokens. Please check console for details.');
      }
    }
    
    // Display token count
    fetch('/design-tokens.json')
      .then(response => response.json())
      .then(tokens => {
        const colorCount = Object.keys(tokens.colors.base).length + Object.keys(tokens.colors.semantic).length;
        const typographyCount = Object.keys(tokens.typography.families).length + Object.keys(tokens.typography.sizes).length;
        document.getElementById('tokenCount').textContent = 
          \`Ready to import: \${colorCount} colors, \${typographyCount} typography tokens\`;
      });
  </script>
</body>
</html>
`;
  
  fs.writeFileSync(path.join(pluginPath, 'ui.html'), uiHtml);
  
  console.log('🔌 Generated Figma plugin files:');
  console.log(`   📁 ${path.join(pluginPath, 'manifest.json')}`);
  console.log(`   📁 ${path.join(pluginPath, 'code.js')}`);
  console.log(`   📁 ${path.join(pluginPath, 'ui.html')}`);
}

/**
 * Main sync function
 */
async function syncWithFigma() {
  console.log('🔄 Starting Figma synchronization...');
  
  const config = loadConfig();
  if (!config) {
    console.log('⚠️  Skipping Figma sync - configuration needed');
    return;
  }
  
  try {
    // Extract design tokens first
    await extractDesignTokens();
    
    // Load extracted tokens
    const tokensPath = path.join(projectRoot, 'design-tokens.json');
    const designTokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
    
    // Sync with Figma
    if (config.syncOptions.colors) {
      await syncColors(designTokens, config);
    }
    
    if (config.syncOptions.typography) {
      await syncTypography(designTokens, config);
    }
    
    if (config.syncOptions.components) {
      await syncComponents(designTokens, config);
    }
    
    // Generate Figma plugin
    generateFigmaPlugin();
    
    console.log('✅ Figma synchronization completed!');
    console.log('💡 Next steps:');
    console.log('   1. Open your Figma file to see the imported styles');
    console.log('   2. Install the generated plugin for advanced features');
    console.log('   3. Create components using the provided specifications');
    
  } catch (error) {
    console.error('❌ Figma sync failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  syncWithFigma();
}

export { syncWithFigma, loadConfig };