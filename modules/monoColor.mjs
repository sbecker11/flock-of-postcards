// @ts-nocheck

import * as utils from './utils.mjs';

var isMonoColor = false;
const monoColor = "black";
const monoBackgroundColor = "lightgrey";

export const ICON_TYPES = ['back', 'geometry', 'image'];
export const ICON_COLORS = ['black', 'white'];

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

export function setIconToColor(iconElement, iconColor) {
    let iconType = iconElement.dataset.iconType;
    if( !iconType in ICON_TYPES ) {
        throw new Error(`monoColorElement:${monoColorElement} has illegal data-iconType:${iconType}`);
    }
    if ( !iconColor in ICON_COLORS ) {
        throw new Error(`monoColorElement:${monoColorElement} has illegal data-iconColor:${iconColor}`);
    }
    iconElement.src = 'static_content/icons/icons8-' + iconType + '-16-' + iconColor + '.png';
}

export function applyMonoColorToElement(monoColorElement) {
    if (isMonoColor) {
        // set colors to mono
        monoColorElement.style.color = monoColor;
        monoColorElement.style.backgroundColor = monoBackgroundColor;
        if ( "icon" in monoColorElement.classList ) {
            setIconToColor(monoColorElement, monoColor);
        }
    } else {
        // retrieve the saved colors from the dataset
        let savedColor = monoColorElement.dataset.savedcolor;
        if( typeof savedColor ==='undefined' || savedColor === null || savedColor === "") {
            throw new Error(`monoColorElement:${monoColorElement} must have a data-saved-color attribute`);
        }
        let savedBackgroundColor = monoColorElement.dataset.savedbackgroundcolor;
        if( typeof savedBackgroundColor ==='undefined' || savedBackgroundColor === null || savedBackgroundColor === "") {
            throw new Error(`monoColorElement:${monoColorElement} must have a data-saved-background-color attribute`);
        }
        // restore the saved colors
        monoColorElement.style.color = savedColor;
        monoColorElement.style.backgroundColor = savedBackgroundColor;
        if ( "icon" in monoColorElement.classList ) {
            setIconToColor(monoColorElement, savedcolor);
        }   
    }
}

// Assign the function to window for global access
window.toggleMonoColor = toggleMonoColor;
