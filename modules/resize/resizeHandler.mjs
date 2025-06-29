// modules/resize/resizeHandler.mjs

import { debounce } from '../utils/utils.mjs';

function handleResize() {
    console.log('Resize event triggered');

    // Add any logic that needs to run on resize here
}

// Debounce the handleResize function to prevent it from firing too frequently
const debouncedResize = debounce(handleResize, 100);

// Add event listener to the window
window.addEventListener('resize', debouncedResize);

console.log('Resize handler initialized');

export { debouncedResize as handleResize }; 