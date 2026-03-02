import * as utils from './utils.js';

// Type definitions
type IconType = 'back' | 'url' | 'img' | 'skill-back';
type IconColor = 'black' | 'white';

// Module state
let isMonoColor = false;
const monoColor = "black";
const monoBackgroundColor = "lightgrey";

// Constants
export const ICON_TYPES: readonly IconType[] = ['back', 'url', 'img', 'skill-back'] as const;
export const ICON_COLORS: readonly IconColor[] = ['black', 'white'] as const;

/**
 * Get the full URL for an icon file (handles base path correctly)
 */
export function getIconUrl(iconType: string, iconColor: string): string {
  return `${import.meta.env.BASE_URL}icons/icons8-${iconType}-16-${iconColor}.png`;
}

export function getIconColor(color: string): IconColor {
  if ((typeof color === "undefined") || (color == null) || (color == "")) {
    throw new Error(`getIconColor color:${color} is undefined`);
  }
  
  color = color.toUpperCase();
  const RGB = utils.get_RGB_from_AnyStr(color);
  
  if (!RGB) {
    throw new Error(`getIconColor could not parse color: ${color}`);
  }
  
  const iconColor: IconColor = (RGB[0] + RGB[1] + RGB[2] > 382) ? 'white' : 'black';
  
  if (!ICON_COLORS.includes(iconColor)) {
    throw new Error(`getIconColor color:${color} iconColor:${iconColor} not included by ${ICON_COLORS}\n`);
  }
  
  return iconColor;
}

export function toggleMonoColor(): boolean {
  const monoColorIcon = document.getElementById('monoColorIcon');
  const monoColorElements = document.getElementsByClassName("mono-color-sensitive");
  
  if (!monoColorIcon) {
    throw new Error('monoColorIcon element not found');
  }
  
  if (!isMonoColor) {
    isMonoColor = true;
    monoColorIcon.style.border = "2px solid white";
  } else {
    isMonoColor = false;
    monoColorIcon.style.border = "2px solid transparent";
  }
  
  Array.from(monoColorElements).forEach(element => {
    applyMonoColorToElement(element as HTMLElement);
  });

  return isMonoColor;
}

function getIconElementType(iconElement: HTMLElement): IconType {
  let iconType = iconElement.dataset.icontype || iconElement.getAttribute('icon-type');
  
  if (typeof iconType === 'undefined' || iconType === null || iconType === "") {
    if (iconElement.classList.contains('skill-back-icon')) {
      return 'skill-back';
    } else if (iconElement.classList.contains('back-icon')) {
      return 'back';
    } else if (iconElement.classList.contains('url-icon')) {
      return 'url';
    } else if (iconElement.classList.contains('img-icon')) {
      return 'img';
    } else {
      let err = `getIconElementType iconElement:${iconElement} has no icon-type dataset or attribute\n`;
      err += `getIconElementType iconElement.dataset:${utils.getDatasetAsString(iconElement)}\n`;
      err += `getIconElementType iconElement.attributes:${utils.getAttributesAsString(iconElement)}\n`;
      throw new Error(err);
    }
  }
  
  if (ICON_TYPES.includes(iconType as IconType)) {
    return iconType as IconType;
  } else {
    const err = `getIconElementType iconElement:${iconElement} iconType:${iconType} not included in ${ICON_TYPES}`;
    throw new Error(err);
  }
}

export function setIconToColor(iconElement: HTMLElement, theIconColor: string): void {
  const iconType = getIconElementType(iconElement);
  const iconColor = getIconColor(theIconColor);
  
  if (!ICON_TYPES.includes(iconType)) {
    let err = `setIconToColor iconElement:${iconElement} has illegal iconType:[${iconType}] not included by ${ICON_TYPES}\n`;
    err += `setIconToColor iconElement.dataset:${utils.getDatasetAsString(iconElement)}\n`;
    err += `setIconToColor iconElement.attributes:${utils.getAttributesAsString(iconElement)}\n`;
    throw new Error(err);
  }
  
  if (!ICON_COLORS.includes(iconColor)) {
    let err = `setIconToColor iconElement:${iconElement} has illegal iconColor:[${iconColor}] not included by ${ICON_COLORS}\n`;
    err += `setIconToColor iconElement.dataset:${utils.getDatasetAsString(iconElement)}\n`;
    err += `setIconToColor iconElement.attributes:${utils.getAttributesAsString(iconElement)}\n`;
    throw new Error(err);
  }
  
  if (!isMonoColor) {
    const savedColor = iconElement.dataset.savedColor;
    if (typeof savedColor === "undefined" || savedColor == null || savedColor === '') {
      const err = `setIconColor iconElement:${iconElement} savedColor is undefined`;
      throw new Error(err);
    }
    // Compare semantic color (black/white) - savedColor may be hex (#000000) or name (black)
    const savedIconColor = getIconColor(savedColor);
    if (savedIconColor !== iconColor) {
      const err = `setIconColor iconElement:${iconElement} in colorMode given iconColor:${iconColor} when savedColor:${savedColor}`;
      throw new Error(err);
    }
  }
  
  if (iconElement instanceof HTMLImageElement) {
    // skill-back icons use the same 'back' icon image as regular back icons
    const iconFileName = (iconType === 'skill-back') ? 'back' : iconType;
    iconElement.src = getIconUrl(iconFileName, iconColor);
  }
  
  const bizcardId = iconElement.dataset.bizcardId;
}

export function applyMonoColorToElement(monoColorElement: HTMLElement): void {
  if (isMonoColor) {
    monoColorElement.style.color = monoColor;
    monoColorElement.style.backgroundColor = monoBackgroundColor;
    if (monoColorElement.classList.contains("icon")) {
      setIconToColor(monoColorElement, monoColor);
    }
  } else {
    const savedColor = monoColorElement.dataset.savedColor;
    
    if (typeof savedColor === 'undefined' || savedColor === null || savedColor === "") {
      let err = `applyMonoColorToElement monoColorElement must have a saved-color data or attribute\n`;
      err += `applyMonoColorToElement savedColor:[${savedColor}]\n`;
      err += `applyMonoColorToElement isMonoColor:${isMonoColor}\n`;
      err += `applyMonoColorToElement monoColorElement.dataset.savedColor:${monoColorElement.dataset.savedColor}\n`;
      err += `applyMonoColorToElement monoColorElement.getAttribute('saved-color'):${monoColorElement.getAttribute('saved-color')}\n`;
      err += `applyMonoColorToElement monoColorElement.dataset:${utils.getDatasetAsString(monoColorElement)}\n`;
      err += `applyMonoColorToElement monoColorElement.attributes:${utils.getAttributesAsString(monoColorElement)}\n`;
      err += `applyMonoColorToElement monoColorElement.tagName:${monoColorElement.tagName}\n`;
      err += `applyMonoColorToElement monoColorElement.classList:${monoColorElement.classList}\n`;
      throw new Error(err);
    }
    
    monoColorElement.style.color = savedColor;
    monoColorElement.style.backgroundColor = 'transparent';
    if (monoColorElement.classList.contains("icon")) {
      setIconToColor(monoColorElement, savedColor);
    }
  }
}

declare global {
  interface Window {
    toggleMonoColor: typeof toggleMonoColor;
  }
}

window.toggleMonoColor = toggleMonoColor;
