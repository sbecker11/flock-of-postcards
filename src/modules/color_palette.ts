// Color palette management for bizcard divs

import * as utils from './utils.js';

export interface ColorPalette {
  name: string;
  colors: string[];
}

export interface PaletteList {
  palettes: string[];
}

let currentPalette: ColorPalette | null = null;

/**
 * Fetch list of available palettes from the server
 */
export async function fetchAvailablePalettes(): Promise<string[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}palettes/palettes.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch palette list: ${response.statusText}`);
  }
  const data = await response.json() as PaletteList;
  return data.palettes || [];
}

/**
 * Load a color palette from a JSON file
 */
export async function loadPalette(url: string): Promise<ColorPalette> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load palette from ${url}: ${response.statusText}`);
  }
  const palette = await response.json() as ColorPalette;
  
  if (!palette.colors || !Array.isArray(palette.colors) || palette.colors.length === 0) {
    throw new Error(`Invalid palette format: colors array is missing or empty`);
  }
  
  currentPalette = palette;
  return palette;
}

/**
 * Load a palette by name (from the palettes directory)
 */
export async function loadPaletteByName(name: string): Promise<ColorPalette> {
  const url = `${import.meta.env.BASE_URL}palettes/${name}.json`;
  return loadPalette(url);
}

/**
 * Get color from palette by index (using modulo)
 */
export function getColorByIndex(index: number): string {
  if (!currentPalette) {
    throw new Error('No palette loaded. Call loadPalette() first.');
  }
  
  const colorIndex = index % currentPalette.colors.length;
  return currentPalette.colors[colorIndex];
}

/**
 * Get the number of colors in the current palette
 */
export function getNumColors(): number {
  return currentPalette?.colors.length || 0;
}

/**
 * Get the current palette
 */
export function getCurrentPalette(): ColorPalette | null {
  return currentPalette;
}

/**
 * Calculate a suitable text color (black or white) based on background brightness
 */
export function getContrastTextColor(hexBackgroundColor: string): string {
  // Remove # if present
  const hex = hexBackgroundColor.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate relative luminance using sRGB formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white text for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Recolor all existing bizCardDivs with the current palette
 */
export function recolorAllBizCardDivs(): void {
  if (!currentPalette) {
    throw new Error('No palette loaded. Call loadPalette() first.');
  }
  
  const bizcardDivs = document.getElementsByClassName('bizcard-div');
  
  // Map to store bizcard ID to colors for skill cards
  const bizcardColors = new Map<string, {bg: string, text: string, selectedBg: string}>();
  
  for (let i = 0; i < bizcardDivs.length; i++) {
    const bizcardDiv = bizcardDivs[i] as HTMLDivElement;
    
    // Get the bizcard index from its ID
    const idMatch = bizcardDiv.id.match(/bizcard-div-(\d+)/);
    if (!idMatch) continue;
    
    const index = parseInt(idMatch[1]);
    
    // Get colors from palette
    const backgroundColor = getColorByIndex(index).toUpperCase();
    const textColor = getContrastTextColor(backgroundColor);
    
    // Validate colors
    utils.validateHexColorString(backgroundColor);
    utils.validateHexColorString(textColor);
    
    // Calculate adjusted background color for selection
    const adjustedBackgroundColor = utils.adjustHexBrightness(backgroundColor, 1.7);
    utils.validateHexColorString(adjustedBackgroundColor);
    
    // Store colors for skill cards
    bizcardColors.set(bizcardDiv.id, {
      bg: backgroundColor,
      text: textColor,
      selectedBg: adjustedBackgroundColor
    });
    
    // Update saved attributes
    bizcardDiv.setAttribute('saved-background-color', backgroundColor);
    bizcardDiv.setAttribute('saved-color', textColor);
    bizcardDiv.setAttribute('saved-selected-background-color', adjustedBackgroundColor);
    bizcardDiv.setAttribute('saved-selected-color', textColor);
    
    // Apply styles
    bizcardDiv.style.backgroundColor = backgroundColor;
    bizcardDiv.style.color = textColor;
  }
  
  // Now recolor all skill cards based on their parent bizcard
  const cardDivs = document.getElementsByClassName('card-div');
  let recoloredCardCount = 0;
  
  for (let i = 0; i < cardDivs.length; i++) {
    const cardDiv = cardDivs[i] as HTMLDivElement;
    
    // Get parent bizcard ID
    const parentBizcardId = cardDiv.getAttribute('bizcardDivId');
    if (!parentBizcardId) continue;
    
    // Get colors from parent bizcard
    const colors = bizcardColors.get(parentBizcardId);
    if (!colors) continue;
    
    // Update saved attributes
    cardDiv.setAttribute('saved-background-color', colors.bg);
    cardDiv.setAttribute('saved-color', colors.text);
    cardDiv.setAttribute('saved-selected-background-color', colors.selectedBg);
    cardDiv.setAttribute('saved-selected-color', colors.text);
    
    // Apply styles
    cardDiv.style.backgroundColor = colors.bg;
    cardDiv.style.color = colors.text;
    
    // Update the span text color
    const spanElement = cardDiv.querySelector('.tag-link');
    if (spanElement instanceof HTMLElement) {
      spanElement.style.color = colors.text;
      spanElement.setAttribute('data-saved-color', colors.text);
    }
    
    recoloredCardCount++;
  }
  
  // Also update line items to match their partner cards
  const lineItems = document.getElementsByClassName('card-div-line-item');
  let recoloredLineItemCount = 0;
  
  for (let i = 0; i < lineItems.length; i++) {
    const lineItem = lineItems[i] as HTMLElement;
    
    // Get the target card ID from the line item
    const targetCardId = lineItem.getAttribute('targetCardDivId');
    if (!targetCardId) continue;
    
    // Get the target card
    const targetCard = document.getElementById(targetCardId);
    if (!targetCard) continue;
    
    // Copy colors from the card to the line item
    const bgColor = targetCard.getAttribute('saved-background-color');
    const textColor = targetCard.getAttribute('saved-color');
    const selectedBgColor = targetCard.getAttribute('saved-selected-background-color');
    const selectedTextColor = targetCard.getAttribute('saved-selected-color');
    
    if (bgColor) lineItem.setAttribute('saved-background-color', bgColor);
    if (textColor) lineItem.setAttribute('saved-color', textColor);
    if (selectedBgColor) lineItem.setAttribute('saved-selected-background-color', selectedBgColor);
    if (selectedTextColor) lineItem.setAttribute('saved-selected-color', selectedTextColor);
    
    // Apply the styles
    lineItem.style.backgroundColor = bgColor || '';
    lineItem.style.color = textColor || '';
    
    recoloredLineItemCount++;
  }
  
  console.log(`Recolored ${bizcardDivs.length} bizCardDivs, ${recoloredCardCount} skill cards, and ${recoloredLineItemCount} line items with palette: ${currentPalette.name}`);
}
