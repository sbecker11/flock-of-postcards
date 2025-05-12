// DOM Utilities
export function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else {
            element.appendChild(child);
        }
    });
    return element;
}

/**
 * Calculates half of a number
 * @param {number} value - The number to halve
 * @returns {number} Half of the input value
 */
export function half(value) {
    return value / 2;
}

export function addClass(element, className) {
    if (element && className) {
        element.classList.add(className);
    }
}

export function removeClass(element, className) {
    if (element && className) {
        element.classList.remove(className);
    }
}

export function toggleClass(element, className) {
    if (element && className) {
        element.classList.toggle(className);
    }
}

export function setStyle(element, styles) {
    if (element && styles) {
        Object.entries(styles).forEach(([property, value]) => {
            element.style[property] = value;
        });
    }
}

export function getElementById(id) {
    return document.getElementById(id);
}

export function querySelector(selector) {
    return document.querySelector(selector);
}

export function querySelectorAll(selector) {
    return Array.from(document.querySelectorAll(selector));
} 

/**
 * Checks if an object is an HTMLElement
 * @param {any} obj - The object to check
 * @returns {boolean} True if the object is an HTMLElement
 */
export function isHTMLElement(obj) {
    return obj instanceof HTMLElement;
}

