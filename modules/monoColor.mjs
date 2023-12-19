// @ts-nocheck
var isMonoColor = false;
const monoColor = "black";
const monoBackgroundColor = "lightgrey";
const target_parent_id = "card-div-line-item-bizcard-div-0";
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
            let sideElement = element.parentElement.getElementsByClassName(target_side_class)[0];
            // save colors in dataset
            element.dataset.color = element.style.color;
            element.dataset.backgroundColor = element.style.backgroundColor;

            // set colors to mono
            element.style.color = monoColor;
            element.style.backgroundColor = monoBackgroundColor;
            sideElement.style.color = monoColor;
            sideElement.style.backgroundColor = monoBackgroundColor;
        });
    } else {
        isMonoColor = false;
        monoColorIcon.style.border = "2px solid transparent";
        Array.from(elements).forEach(element => {
            let sideElement = element.parentElement.getElementsByClassName(target_side_class)[0];
            // restore colors from dataset
            element.style.color = element.dataset.color;
            element.style.backgroundColor = element.dataset.backgroundColor;
            sideElement.style.color = element.dataset.color;
            sideElement.style.backgroundColor = element.dataset.backgroundColor;
        });
    }

    return isMonoColor;
}

// Assign the function to window for global access
window.toggleMonoColor = toggleMonoColor;
