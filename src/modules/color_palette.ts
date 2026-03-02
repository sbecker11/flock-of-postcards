// Color palette management for bizcard divs

import * as utils from './utils.js';
import * as monoColor from './monoColor.js';

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
 * Calculate a suitable text color (black or white) for maximum contrast on the background.
 * Uses WCAG contrast ratio: pick whichever of black or white gives higher contrast.
 */
export function getContrastTextColor(hexBackgroundColor: string): string {
  // Remove # if present
  const hex = hexBackgroundColor.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // WCAG relative luminance (sRGB)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Contrast ratio: (L1 + 0.05) / (L2 + 0.05). Pick black or white by higher ratio.
  const contrastBlack = (luminance + 0.05) / 0.05;
  const contrastWhite = 1.05 / (luminance + 0.05);
  
  return contrastBlack > contrastWhite ? '#000000' : '#FFFFFF';
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
  const bizcardColors = new Map<string, {bg: string, text: string, selectedBg: string, selectedText: string}>();
  
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
    
    // Calculate lightened background color for selection (blend toward white)
    const adjustedBackgroundColor = utils.lightenHexColor(backgroundColor, 0.35);
    utils.validateHexColorString(adjustedBackgroundColor);
    const selectedTextColor = getContrastTextColor(adjustedBackgroundColor);

    // Store colors for skill cards
    bizcardColors.set(bizcardDiv.id, {
      bg: backgroundColor,
      text: textColor,
      selectedBg: adjustedBackgroundColor,
      selectedText: selectedTextColor
    });

    // Update saved attributes
    bizcardDiv.setAttribute('saved-background-color', backgroundColor);
    bizcardDiv.setAttribute('saved-color', textColor);
    bizcardDiv.setAttribute('saved-selected-background-color', adjustedBackgroundColor);
    bizcardDiv.setAttribute('saved-selected-color', selectedTextColor);

    // Apply styles (use selected colors if this bizcard is selected)
    const isSelected = bizcardDiv.classList.contains('selected');
    const applyBg = isSelected ? adjustedBackgroundColor : backgroundColor;
    const applyText = isSelected ? selectedTextColor : textColor;
    bizcardDiv.style.setProperty('background-color', applyBg, 'important');
    bizcardDiv.style.setProperty('color', applyText, 'important');
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
    cardDiv.setAttribute('saved-selected-color', colors.selectedText);

    // Apply styles (use selected colors if this skill card is selected)
    const isSelected = cardDiv.classList.contains('selected');
    const applyBg = isSelected ? colors.selectedBg : colors.bg;
    const applyText = isSelected ? colors.selectedText : colors.text;
    cardDiv.style.setProperty('background-color', applyBg, 'important');
    cardDiv.style.setProperty('color', applyText, 'important');

    // Update all mono-color-sensitive children (tag-link spans, icons)
    updateMonoColorSensitiveChildren(cardDiv, applyText);
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

    // Apply styles (use selected colors if this line item is selected)
    const isSelected = lineItem.classList.contains('selected');
    const applyBg = isSelected ? (selectedBgColor || bgColor) : bgColor;
    const applyText = isSelected ? (selectedTextColor || textColor) : textColor;
    lineItem.style.backgroundColor = applyBg || '';
    lineItem.style.color = applyText || '';

    // Update all mono-color-sensitive children and re-apply monoColor
    updateMonoColorSensitiveChildren(lineItem, applyText || textColor || '');

    recoloredLineItemCount++;
  }

  // Update mono-color-sensitive children in bizcards (e.g. icons in skill back links)
  for (let i = 0; i < bizcardDivs.length; i++) {
    const bizcardDiv = bizcardDivs[i] as HTMLDivElement;
    const isSelected = bizcardDiv.classList.contains('selected');
    const textColor = isSelected
      ? bizcardDiv.getAttribute('saved-selected-color')
      : bizcardDiv.getAttribute('saved-color');
    if (textColor) {
      updateMonoColorSensitiveChildren(bizcardDiv, textColor);
    }
  }

  console.log(`Recolored ${bizcardDivs.length} bizCardDivs, ${recoloredCardCount} skill cards, and ${recoloredLineItemCount} line items with palette: ${currentPalette.name}`);
}

/**
 * Update data-saved-color on all mono-color-sensitive children and re-apply monoColor
 */
function updateMonoColorSensitiveChildren(parent: HTMLElement, savedColor: string): void {
  const children = parent.getElementsByClassName('mono-color-sensitive');
  for (const el of Array.from(children)) {
    const elem = el as HTMLElement;
    elem.dataset.savedColor = savedColor;
    elem.setAttribute('data-saved-color', savedColor);
    try {
      monoColor.applyMonoColorToElement(elem);
    } catch {
      // Ignore if element doesn't support monoColor (e.g. missing icon type)
    }
  }
}
