// @ts-nocheck

import * as utils from './utils.js';

var isMonoColor = false;
const monoColor = "black";
const monoBackgroundColor = "lightgrey";
const target_class = "card-div-line-item-content";
const target_side_class = "card-div-line-item-right-column";

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

export function applyMonoColorToElement(element) {
    let sideElement = element.parentElement.getElementsByClassName(target_side_class)[0];
    let tagLinkChildren = element.querySelectorAll('.tag-link');
    let geographyImgChildren = element.querySelectorAll('li.card-div-line-item-description-list-item img.geography-icon');
    let imageImgChildren = element.querySelectorAll('li.card-div-line-item-description-list-item img.image-icon');
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
        });
    } else {
        let sideElement = element.parentElement.getElementsByClassName(target_side_class)[0];
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
        });

    }
    utils.validateIsElement(element);
    let elementColor = element.style.color;
    let elementColorIsWhite = (elementColor == 'rgb(255, 255, 255)');
    geographyImgChildren.forEach(function(geographyImgElement) {
        geographyImgElement.src = elementColorIsWhite ? 
            'static_content/icons/icons8-geography-16-white.png' : 
            'static_content/icons/icons8-geography-16-black.png';
    }); 
    imageImgChildren.forEach(function(imageImgElement) {
        imageImgElement.src = elementColorIsWhite ? 
            'static_content/icons/icons8-image-16-white.png' : 
            'static_content/icons/icons8-image-16-black.png';
    }); 

}

// Assign the function to window for global access
window.toggleMonoColor = toggleMonoColor;
