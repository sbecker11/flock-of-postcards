// @ts-nocheck

import * as utils from './utils.mjs';

var isMonoColor = false;
const monoColor = "black";
const monoBackgroundColor = "lightgrey";
const target_class = "card-div-line-item-content";
const target_side_class = "card-div-line-item-right-column";

export const ICON_TYPES = ['geometry', 'image'];

// Directly export the function
export function toggleMonoColor() {
    let monoColorIcon = document.getElementById('monoColorIcon');
    let elements = document.getElementsByClassName(target_class);
    if (!isMonoColor) {
        isMonoColor = true;
        monoColorIcon.style.border = "2px solid white";
        Array.from(elements).forEach(element => {
            applyMonoColorToElement(element);
        });
    } else {
        isMonoColor = false;
        monoColorIcon.style.border = "2px solid transparent";
        Array.from(elements).forEach(element => {
            applyMonoColorToElement(element);
        });
    }

    return isMonoColor;
}

// set icon to color
export function setIconToColor(iconElement, iconType, color) {
    if ( !color in ['black', 'white'] ) {
        throw new Error(`color:${color} must be black or white`);
    }
    iconElement.src = 'static_content/icons/icons8-' + iconType + '-16-' + color + '.png';
}
// set all child icons to color
export function setIconsToColor(element, color) {
    if ( !color in ['black', 'white'] ) {
        throw new Error(`color:${color} must be black or white`);
    }
    for (let iconType of ICON_TYPES) {
        let iconElements = element.querySelector('.icon-' + iconType);
        for (let iconElement of iconElements) {
            setIconToColor(iconElement, iconType, color);
        }
    }
}

export function applyMonoColorToElement(element) {
    let sideElement = element.parentElement.getElementsByClassName(target_side_class)[0];
    let tagLinkChildren = element.querySelectorAll('.tag-link');
    if (isMonoColor) {
        // save colors in dataset
        element.dataset.color = element.style.color;
        element.dataset.backgroundColor = element.style.backgroundColor;

        // set colors to mono
        element.style.color = monoColor;
        element.style.backgroundColor = monoBackgroundColor;
        if ( sideElement !== null ) {
            sideElement.style.color = monoColor;
            sideElement.style.backgroundColor = monoBackgroundColor;
        }
        tagLinkChildren.forEach(function(tagLinkElement) {
            tagLinkElement.style.color = monoColor;
            tagLinkElement.style.backgroundColor = monoBackgroundColor;
            setIconsToColor(tagLinkElement, monoColor);
        });
    } else {
        if( element.dataset.color !== undefined ) {
            // restore colors from dataset
            element.style.color = element.dataset.color;
            element.style.backgroundColor = element.dataset.backgroundColor;
            if ( sideElement !== null ) {
                sideElement.style.color = element.dataset.color;
                sideElement.style.backgroundColor = element.dataset.backgroundColor;
            }
            tagLinkChildren.forEach(function(tagLinkElement) {
                tagLinkElement.style.color = element.dataset.color;
                tagLinkElement.style.backgroundColor = element.dataset.backgroundColor;
                setIconsToColor(tagLinkElement, element.dataset.color);
            });
        }
    }
}

// Assign the function to window for global access
window.toggleMonoColor = toggleMonoColor;
