// modules/utils/domUtils.mjs

import * as utils from './utils.mjs';
import * as colorUtils from '../color/colorUtils.mjs';

// // DOM Utilities
// export function createElement(tag, attributes = {}, children = []) {
//     const element = document.createElement(tag);
//     Object.entries(attributes).forEach(([key, value]) => {
//         element.setAttribute(key, value);
//     });
//     children.forEach(child => {
//         if (typeof child === 'string') {
//             element.appendChild(document.createTextNode(child));
//         } else {
//             element.appendChild(child);
//         }
//     });
//     return element;
// }

// /**
//  * Calculates half of a number
//  * @param {number} value - The number to halve
//  * @returns {number} Half of the input value
//  */
// export function half(value) {
//     return value / 2;
// }

export function hasClass(element, className) {
    return element && className && element.classList.contains(className);
}

export function addClass(element, className) {
    if (element && className && !hasClass(element, className)) {
       return element.classList.add(className);
    }
    return false;
}

export function removeClass(element, className) {
    if ( hasClass(element, className) ) {
        element.classList.remove(className);
        return true;
    }
    return false; 
}

// export function toggleClass(element, className) {
//     if (element && className) {
//         element.classList.toggle(className);
//     }
// }

// export function setStyle(element, styles) {
//     if (element && styles) {
//         Object.entries(styles).forEach(([property, value]) => {
//             element.style[property] = value;
//         });
//     }
// }

// export function getElementById(id) {
//     return document.getElementById(id);
// }

// export function querySelector(selector) {
//     return document.querySelector(selector);
// }

// export function querySelectorAll(selector) {
//     return Array.from(document.querySelectorAll(selector));
// } 

// /**
//  * Checks if an object is an HTMLElement
//  * @param {any} obj - The object to check
//  * @returns {boolean} True if the object is an HTMLElement
//  */

export function isHTMLElement(obj) {
    return ( obj instanceof HTMLElement );
}

// /**
//  * return true if element is a child or descendant of potentialParentElement
//  * @param {*|HTMLElement} element  // can't be an HTMLElement because it may be null
//  * @param {HTMLElement} potentialParentElement
//  */
// export function isChild(element, potentialParentElement) {
//     if (!element || !potentialParentElement) return false;
  
//     let current = element;
//     while (current) {
//       if (current === potentialParentElement ) {
//         return true;
//       }
//       current = current.parentElement;  // only returns an HTMLElement or null
//     }
  
//     return false;
//   }
  

//   export function isElement(obj) {
//     return (obj instanceof HTMLElement);
// }
// export function validateIsElement(obj) {
//     if (!isElement(obj)) {
//         throw new Error(`Argument is not an HTML element. but it is a(n) ${typeof obj} with value ${obj}`);
//     }
// }
// const USABLE_STYLE_PROPS = [
//     'color','background-color','left','top', 'z-index', 'filter','translate'
// ];

// // z-index and background-color are read-only from window.getComputedStyle(element).prop
// // let zIndex = element.getComputedStyle.getPropertyValue('z-index')
// const STYLE_PROPS_MAP = {
//     'z-index':'zIndex',
//     'background-color':'backgroundColor'
// };
// // zIndex and backgroundColor are used in element.style[prop] 
// // element.style.zIndex = styleProps.zIndex
// const PROPS_STYLE_MAP = {
//     'zIndex':'z-index',
//     'backgroundColor':'background-color'
// };

// // zIndex and backgroundColor are styleProps
// export function getStyleProps(element) {
//     validateIsElement(element);
//     let computedStyle = window.getComputedStyle(element);
//     let styleProps = {};
//     for (let prop of computedStyle) {
//         if ( USABLE_STYLE_PROPS.includes(prop) ) {
//             var dstProp = prop;
//             if (prop in STYLE_PROPS_MAP) {
//                 dstProp = STYLE_PROPS_MAP[prop];
//             }
//             styleProps[dstProp] = computedStyle.getPropertyValue(prop);
//         }
//     }
//     validateIsStyleProps(styleProps);
//     return styleProps;
// }

// export function getStylePropsString(styleProps) {
//     validateIsStyleProps(styleProps);
//     return JSON.stringify(styleProps,null,2);
// }

// // z-index and background-color are styleProps
// export function applyStyleProps(element, styleProps) {
//     validateIsStyleProps(styleProps);
//     for (let prop in styleProps) {
//         if (styleProps.hasOwnProperty(prop)) {
//             var dstProp = prop;
//             if (prop in PROPS_STYLE_MAP) {
//                 dstProp = PROPS_STYLE_MAP[prop];
//             }
//             element.style[dstProp] = styleProps[prop];
//         }
//     }
// } 
// export function validateIsStyleProps(obj) {
//     validateIsPlainObject(obj);
// }
// export function validateIsStylePropsArray(obj) {
//     validateIsArray(obj);
//     obj.forEach(element => {
//         validateIsStyleProps(element);
//     });
// }
export function isDivElement(obj) {
    return (obj instanceof HTMLElement) && (obj.tagName == 'DIV');
}
// export function validateIsDivElement(obj) {
//     if (!isDivElement(obj)) {
//         throw new Error(`Argument is not an HTML DIV element. bit is a(n) ${typeof obj} with value ${obj}`);
//     }
// }
// export function isLineItemElement(obj) {
//     return (obj instanceof HTMLElement) && (obj.tagName == 'LI')
// }

// export function validateIsLineItemElement(obj) {
//     if ( !isLineItemElement(obj) ){
//         throw new Error(`Argument is not an HTML LI element, but is a(n) ${typeof obj} with value ${obj}`);
//     }
// }

// export function validateIsStyleArray(arr) {
//     validateIsNumericArray(arr);
//     if ( arr.length != 9 ) {
//         throw new Error("ValueError: StyleArray must contain 9 numeric values");
//     }
//     if ( arrayHasNaNs(arr) ) {
//         throw new Error("ValueError: StyleArray must not contain NaNs");
//     }
// }

// export function validateIsStyleFrame(styleFrame) {
//     validateIsStyleArray(styleFrame);
// }

// export function validateIsStyleFrameArray(obj) {
//     validateIsArray(obj);
//     obj.forEach(element => {
//         validateIsStyleFrame(element);
//     });
// }

// export function ensureHexColorStringAttribute(obj, attr) {
//     let val = null;
//     let hex = null;
//     if ( isElement(obj) ) {
//         if( typeof attr === 'string' ) {
//             val = obj.getAttribute(attr);
//             if( utils.isString(val) ) {
//                 if ( colorUtils.isHexColorString(val) ) {
//                     return;
//                 } 
//                 var RGB = get_RGB_from_AnyStr(val);
//                 if ( colorUtils.isRGB(RGB) ) {
//                     hex = colorUtils.get_Hex_from_RGB(RGB);
//                     if ( colorUtils.isHexColorString(hex) && hex != val) {
//                         obj.setAttribute(attr, hex);
//                         return;
//                     }
//                 }
//             }
//         }
//     }
//     throw new Error(`obj:[${obj}] attr:[${attr}] val:[${val}] hex:[${hex}] is not a valid hexColorString.`);
// }


// export function ensureHexColorStringStyle(obj, styleName) {
//     let color = obj.style['styleName'];
//     if( !utils.isNonEmptyString(color) ) {
//         throw new Error(`Style ${styleName} must be defined.`);
//     }
//     var hex = null;
//     if ( isHexColorString(color) ) {
//         hex = color;
//     } else if ((isNumericArray(color) && color.length === 3) || color.startsWith('color')) {
//         hex = get_Hex_from_ColorStr(color);
//     }
//     if (hex !== null) {
//         obj.style[styleName] = hex;
//     } else {
//         throw new Error(`Style ${styleName} is not a valid hex color string.`);
//     }
//     validateHexColorString(obj.style['styleName']);

// }

// // CPU Usage: O(n)
// // Memory Usage: O(depth)
// // Stack Overflow Risk: higher for deeply nested depth
// // Overhead: higher due to recursive call stack management
// // Ease of implementation: simpler and more intuitive

// export function findAllChildrenRecursively(parent, allChildren = []) {
//     /** @type {HTMLElement[]} */
//     allChildren = allChildren || [];
//     if (!allChildren) {
//         allChildren = [];
//     }
//     if (allChildren && !allChildren.includes(parent)) {
//         allChildren.push(parent);
//     }
//     if (parent.children.length > 0) {
//         for (let child of parent.children) {
//             findAllChildrenRecursively(child, allChildren);
//         }
//     }
//     return allChildren;
// }

// // CPU Usage: O(n)
// // Memory Usage: O(breadth)
// // Stack Overflow Risk: None
// // Overhead: Lower due to no stack mangements
// // Ease of implementation: medium
// export function findAllChildrenIteratively(parent) {
//     // Validate that the input is a valid DOM element
//     if (!(parent instanceof HTMLElement)) {
//         throw new Error("Invalid parent element");
//     }

//     // Initialize the stack with the parent element
//     const stack = [parent];
//     const allChildren = [];

//     // Process elements in the stack
//     while (stack.length > 0) {
//         const current = stack.pop();

//         // Add the current element to the result if not already included
//         if (!allChildren.includes(current)) {
//             allChildren.push(current);

//             // Add all children of the current element to the stack
//             if (current && current.children) {
//                 stack.push(...Array.from(current.children).filter(child => child instanceof HTMLElement));
//             }
//         }
//     }

//     return allChildren;
// }


// // returns true if addClass was added, otherwise false
// export function addClass(element, addClass) {
//     if ( ! element.classList.contains(addClass)) {
//         element.classList.add(addClass);
//         return true;
//     }
//     return false;
// }

// // returns true if removeClass was removed, otherwise false
// export function removeClass(element, removeClass) {
//     if ( element.classList.contains(removeClass)) {
//         element.classList.remove(removeClass);
//         return true;
//     }
//     return false;
// }

// // used to add or remove eventListener types from element
// export function updateEventListener(element, eventType, newListener, options = null) {
//     // Remove the existing event listener if it exists
//     if (newListener === null) {
//         element.removeEventListener(eventType, element[`__${eventType}Listener`]);
//         delete element[`__${eventType}Listener`]; // Clean up the reference
//     } else {
//         // Replace the existing listener with the new one
//         if (element[`__${eventType}Listener`]) {
//             element.removeEventListener(eventType, element[`__${eventType}Listener`]);
//         }
//         // Add the new listener with the optional options object
//         element.addEventListener(eventType, newListener, options);
//         element[`__${eventType}Listener`] = newListener; // Store the reference
//     }
// }
