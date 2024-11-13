import * as utils from './utils.mjs';

var isMonoColor = false;
const monoColor = "black";
const monoBackgroundColor = "lightgrey";

export const ICON_TYPES = ['back', 'url', 'img'];
export const ICON_COLORS = ['black', 'white'];

export function getIconColor(color) {
    if ((typeof color === undefined) || (color == null) || (color == "")) {
        throw new Error(`getIconColor color:${color} is undefined`);
    }
    color = color.toUpperCase();
    let RGB = utils.get_RGB_from_AnyStr(color);
    let iconColor = (RGB[0] + RGB[1] + RGB[2] > 382) ? 'white' : 'black';
    if (!ICON_COLORS.includes(iconColor)) {
        throw new Error(`getIconColor color:${color} iconColor:${iconColor} not included by ${ICON_COLORS}\n`);
    }
    return iconColor;
}

// Directly export the function
export function toggleMonoColor() {
    let monoColorIcon = document.getElementById('monoColorIcon');
    let monoColorElements = document.getElementsByClassName("mono-color-sensitive");
    if (!isMonoColor) {
        isMonoColor = true;
        monoColorIcon.style.border = "2px solid white";
    } else {
        isMonoColor = false;
        monoColorIcon.style.border = "2px solid transparent";
    }
    Array.from(monoColorElements).forEach(monoColorElement => {
        applyMonoColorToElement(monoColorElement);
    });

    return isMonoColor;
}

function getIconElementType(iconElement) {
    let iconType = iconElement.dataset.icontype || iconElement.getAttribute('icon-type');
    if (typeof iconType === 'undefined' || iconType === null || iconType === "") {
        if (iconElement.classList.contains('back-icon')) {
            return 'back';
        } else if (iconElement.classList.contains('url-icon')) {
            return 'url';
        } else if (iconElement.classList.contains('img-icon')) {
            return 'img';
        } else {
            var err = `getIconElementType iconElement:${iconElement} has no icon-type dataset or attribute\n`;
            err += `getIconElementType iconElement.dataset:${utils.getDatasetAsString(iconElement)}\n`;
            err += `getIconElementType iconElement.attributes:${utils.getAttributesAsString(iconElement)}\n`;
            throw new Error(err);
        }
    }
    if (ICON_TYPES.includes(iconType)) {
        return iconType;
    } else {
        var err = `getIconElementType iconElement:${iconElement} iconType:${iconType} not included in ${ICON_TYPES}`;
        throw new Error(err);
    }
}

export function setIconToColor(iconElement, theIconColor) {
    let iconType = getIconElementType(iconElement);
    let iconColor = getIconColor(theIconColor);
    if (!ICON_TYPES.includes(iconType)) {
        var err = `setIconToColor iconElement:${iconElement} has illegal iconType:[${iconType}] not included by ${ICON_TYPES}\n`;
        err += `setIconToColor iconElement.dataset:${utils.getDatasetAsString(iconElement)}\n`;
        err += `setIconToColor iconElement.attributes:${utils.getAttributesAsString(iconElement)}\n`;
        throw new Error(err);
    }
    if (!ICON_COLORS.includes(iconColor)) {
        var err = `setIconToColor iconElement:${iconElement} has illegal iconColor:[${iconColor}] not included by ${ICON_COLORS}\n`;
        err += `setIconToColor iconElement.dataset:${utils.getDatasetAsString(iconElement)}\n`;
        err += `setIconToColor iconElement.attributes:${utils.getAttributesAsString(iconElement)}\n`;
        throw new Error(err);
    }
    // in colorMode 
    if (!isMonoColor) {
        let savedColor = iconElement.dataset.savedColor;
        if (typeof savedColor === undefined || savedColor == null || savedColor == '') {
            var err = `setIconColor iconElement:${iconElement} savedColor is undefined`;
            throw new Error(err);
        }
        if (savedColor != iconColor) {
            var err = `setIconColor iconElement:${iconElement} in colorMode given iconColor:${iconColor} when savedColor:${savedColor}`;
            throw new Error(err);
        }
    }
    iconElement.src = 'static_content/icons/icons8-' + iconType + '-16-' + iconColor + '.png';
    let bizcardId = iconElement.dataset.bizcardId;
}

export function applyMonoColorToElement(monoColorElement) {
    if (isMonoColor) {
        // set colors to mono
        monoColorElement.style.color = monoColor;
        monoColorElement.style.backgroundColor = monoBackgroundColor;
        if (monoColorElement.classList.contains("icon")) {
            setIconToColor(monoColorElement, monoColor);
        }
    } else {
        // in colorMode
        // retrieve the saved colors from the dataset
        let savedColor = monoColorElement.dataset.savedColor;
        if (typeof savedColor === 'undefined' || savedColor === null || savedColor === "") {
            var err = `applyMonoColorToElement monoColorElement must have a saved-color data or attribute\n`;
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
        // restore the saved colors
        monoColorElement.style.color = savedColor;
        monoColorElement.style.backgroundColor = 'transparent';
        if (monoColorElement.classList.contains("icon")) {
            setIconToColor(monoColorElement, savedColor);
        }
    }
}

// Function to check if monoColor can be applied
function canApplyMonoColor() {
    if (typeof window !== 'undefined') {
        let monoColorIcon = document.getElementById('monoColorIcon');
        if (monoColorIcon) {
            window.toggleMonoColor = toggleMonoColor;
            return true;
        }
    }
    return false;
}

function updateMonoColorOption() {
    let monoColorIcon = document.getElementById('monoColorIcon');
    if (!canApplyMonoColor()) {
        // Remove or disable the option
        monoColorIcon.disabled = true;
    }
}

// Call the function to update the option
updateMonoColorOption();