// @ts-nocheck
'use strict';

import * as zIndex from './modules/layout/zIndex.mjs';
import * as parallax from './modules/layout/parallax.mjs';
import * as viewport from './modules/layout/viewport.mjs';
import * as filters from './modules/layout/filters.mjs';
import * as bizCard from './modules/cards/bizCard.mjs';
import * as skillCard from './modules/cards/skillCard.mjs';
import * as cardUtils from './modules/cards/cardUtils.mjs';
import * as cardConstants from './modules/cards/cardConstants.mjs';
import * as autoScroll from './modules/animation/autoScroll.mjs';

// Test z-index functions
console.log('Testing z-index functions...');
const testZ = 5;
const zIndexStr = zIndex.get_zIndexStr_from_z(testZ);
const z = zIndex.get_z_from_zIndexStr(zIndexStr);
console.assert(z === testZ, `Z-index conversion failed: ${testZ} -> ${zIndexStr} -> ${z}`);

// Test filter functions
console.log('Testing filter functions...');
const filterStr = filters.get_filterStr_from_z(testZ);
console.assert(filterStr.includes('brightness') && filterStr.includes('blur'), 
    `Filter string missing required components: ${filterStr}`);

// Test card constants
console.log('Testing card constants...');
console.assert(cardConstants.BIZCARD_WIDTH === 200, 'BIZCARD_WIDTH incorrect');
console.assert(cardConstants.MIN_BIZCARD_HEIGHT === 200, 'MIN_BIZCARD_HEIGHT incorrect');

// Test card utility functions
console.log('Testing card utility functions...');
const testDiv = document.createElement('div');
testDiv.className = 'bizcard-div';
testDiv.id = 'bizcard-div-1';
document.body.appendChild(testDiv);

console.assert(cardUtils.isBizcardDiv(testDiv), 'isBizcardDiv failed');
console.assert(cardUtils.getBizcardDivIndex(testDiv.id) === 1, 'getBizcardDivIndex failed');

// Test viewport functions
console.log('Testing viewport functions...');
const canvasContainer = document.getElementById('canvas-container');
if (canvasContainer) {
    viewport.updateViewport(canvasContainer);
    const viewportState = viewport.getViewport();
    console.assert(viewportState.padding === viewport.VIEWPORT_PADDING, 'Viewport padding incorrect');
}

// Test parallax functions
console.log('Testing parallax functions...');
const parallaxState = parallax.getParallax();
console.assert(typeof parallaxState.parallaxX === 'number', 'Parallax X not a number');
console.assert(typeof parallaxState.parallaxY === 'number', 'Parallax Y not a number');

// Test auto-scroll functions
console.log('Testing auto-scroll functions...');
console.assert(typeof autoScroll.AUTOSCROLL_ENABLED === 'boolean', 'AUTOSCROLL_ENABLED not a boolean');
console.assert(typeof autoScroll.MAX_AUTOSCROLL_VELOCITY === 'number', 'MAX_AUTOSCROLL_VELOCITY not a number');

console.log('All tests completed!'); 