/**
 * Color palette management for bizcard divs - no build required
 */
import * as utils from './utils.mjs';
import * as monoColor from './monoColor.mjs';

let currentPalette = null;

export async function fetchAvailablePalettes() {
  const response = await fetch('static_content/palettes/palettes.json');
  if (!response.ok) throw new Error('Failed to fetch palette list: ' + response.statusText);
  const data = await response.json();
  return data.palettes || [];
}

export async function loadPaletteByName(name) {
  const response = await fetch('static_content/palettes/' + name + '.json');
  if (!response.ok) throw new Error('Failed to load palette: ' + response.statusText);
  const palette = await response.json();
  if (!palette.colors || !Array.isArray(palette.colors) || palette.colors.length === 0) {
    throw new Error('Invalid palette format');
  }
  currentPalette = palette;
  return palette;
}

export function getColorByIndex(index) {
  if (!currentPalette) throw new Error('No palette loaded');
  return currentPalette.colors[index % currentPalette.colors.length];
}

export function getContrastTextColor(hexBackgroundColor) {
  const hex = String(hexBackgroundColor).replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const contrastBlack = (luminance + 0.05) / 0.05;
  const contrastWhite = 1.05 / (luminance + 0.05);
  return contrastBlack > contrastWhite ? '#000000' : '#FFFFFF';
}

function lightenHex(hex, amount) {
  const hexStr = hex.startsWith('#') ? hex : '#' + hex;
  const rgb = utils.get_RGB_from_Hex(hexStr);
  const lightened = rgb.map(c => Math.round(c + (255 - c) * amount));
  return utils.get_Hex_from_RGB(lightened);
}

function updateMonoColorSensitiveChildren(parent, savedColor) {
  const children = parent.getElementsByClassName('mono-color-sensitive');
  for (const el of Array.from(children)) {
    el.dataset.savedColor = savedColor;
    el.setAttribute('data-saved-color', savedColor);
    try {
      monoColor.applyMonoColorToElement(el);
    } catch (_) {}
  }
}

export function recolorAllBizCardDivs() {
  if (!currentPalette) throw new Error('No palette loaded');
  const bizcardDivs = document.getElementsByClassName('bizcard-div');
  const bizcardColors = new Map();

  for (let i = 0; i < bizcardDivs.length; i++) {
    const bizcardDiv = bizcardDivs[i];
    const idMatch = bizcardDiv.id.match(/bizcard-div-(\d+)/);
    if (!idMatch) continue;
    const index = parseInt(idMatch[1]);
    let backgroundColor = getColorByIndex(index).toUpperCase();
    if (!backgroundColor.startsWith('#')) backgroundColor = '#' + backgroundColor;
    const textColor = getContrastTextColor(backgroundColor);
    const adjustedBg = lightenHex(backgroundColor, 0.35);
    const selectedTextColor = getContrastTextColor(adjustedBg);

    bizcardColors.set(bizcardDiv.id, { bg: backgroundColor, text: textColor, selectedBg: adjustedBg, selectedText: selectedTextColor });
    bizcardDiv.setAttribute('saved-background-color', backgroundColor);
    bizcardDiv.setAttribute('saved-color', textColor);
    bizcardDiv.setAttribute('saved-selected-background-color', adjustedBg);
    bizcardDiv.setAttribute('saved-selected-color', selectedTextColor);

    const isSelected = bizcardDiv.classList.contains('selected');
    bizcardDiv.style.setProperty('background-color', isSelected ? adjustedBg : backgroundColor, 'important');
    bizcardDiv.style.setProperty('color', isSelected ? selectedTextColor : textColor, 'important');
  }

  const cardDivs = document.getElementsByClassName('card-div');
  for (let i = 0; i < cardDivs.length; i++) {
    const cardDiv = cardDivs[i];
    const parentId = cardDiv.getAttribute('bizcardDivId');
    const colors = parentId ? bizcardColors.get(parentId) : null;
    if (!colors) continue;
    cardDiv.setAttribute('saved-background-color', colors.bg);
    cardDiv.setAttribute('saved-color', colors.text);
    cardDiv.setAttribute('saved-selected-background-color', colors.selectedBg);
    cardDiv.setAttribute('saved-selected-color', colors.selectedText);
    const isSelected = cardDiv.classList.contains('selected');
    cardDiv.style.setProperty('background-color', isSelected ? colors.selectedBg : colors.bg, 'important');
    cardDiv.style.setProperty('color', isSelected ? colors.selectedText : colors.text, 'important');
    updateMonoColorSensitiveChildren(cardDiv, isSelected ? colors.selectedText : colors.text);
  }

  const lineItems = document.getElementsByClassName('card-div-line-item');
  for (let i = 0; i < lineItems.length; i++) {
    const lineItem = lineItems[i];
    const targetId = lineItem.getAttribute('targetCardDivId');
    const targetCard = targetId ? document.getElementById(targetId) : null;
    if (!targetCard) continue;
    const bg = targetCard.getAttribute('saved-background-color');
    const text = targetCard.getAttribute('saved-color');
    const selBg = targetCard.getAttribute('saved-selected-background-color');
    const selText = targetCard.getAttribute('saved-selected-color');
    if (bg) lineItem.setAttribute('saved-background-color', bg);
    if (text) lineItem.setAttribute('saved-color', text);
    if (selBg) lineItem.setAttribute('saved-selected-background-color', selBg);
    if (selText) lineItem.setAttribute('saved-selected-color', selText);
    const isSelected = lineItem.classList.contains('selected');
    lineItem.style.backgroundColor = isSelected ? (selBg || bg) : bg;
    lineItem.style.color = isSelected ? (selText || text) : text;
    updateMonoColorSensitiveChildren(lineItem, isSelected ? (selText || text) : text);
  }

  for (let i = 0; i < bizcardDivs.length; i++) {
    const bizcardDiv = bizcardDivs[i];
    const textColor = bizcardDiv.classList.contains('selected')
      ? bizcardDiv.getAttribute('saved-selected-color')
      : bizcardDiv.getAttribute('saved-color');
    if (textColor) updateMonoColorSensitiveChildren(bizcardDiv, textColor);
  }
}
