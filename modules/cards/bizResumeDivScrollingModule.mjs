// modules/cards/bizResumeDivScrollingModule.mjs

import * as bizResumeDivSortingModule from './bizResumeDivSortingModule.mjs';
import { scrollBizCardDivIntoView } from './bizCardDivModule.mjs';
import * as divSyncModule from './divSyncModule.mjs';

function scrollDivPairIntoView(element) {
    if (!element) {
        console.warn('bizResumeDivScrollingModule: scrollDivPairIntoView: given null element');
        return
    }
    const bizCardDiv = divSyncModule.getBizCardDiv(element);
    const bizResumeDiv = divSyncModule.getBizResumeDiv(element);

    scrollBizCardDivIntoView(bizCardDiv);
    scrollBizResumeDivIntoView(bizResumeDiv);
}

const SCROLL_DIRECTIONS = {
    'up': "slide-in-from-bottom",
    'down': "slide-in-from-top",
}

/**
 * Scrolls the top part of a business resume div into view with directional sliding
 * @param {HTMLElement} bizResumeDiv - The business resume div to scroll into view
 * @param {string} direction - The direction of navigation null, 'up', or 'down')
 */
export function scrollBizResumeDivIntoView(scrollingBizResumeDiv, scrollDirection=null) {
    if (!scrollingBizResumeDiv) {
        console.warn(`scrollingBizResumeDiv given null element`);
        return;
    }
    // no scrolling/sliding so no animation
    const cssDirection = SCROLL_DIRECTIONS[scrollDirection] || null;
    if ( cssDirection == null ) {
        console.log('scrollBizResumeDivIntoView: null cssDirection -> no scrolling');
        return;
    }
    const scrollingDiv = scrollingBizResumeDiv;
    scrollingDiv.classList.add(cssDirection);
    console.log('scrollBizResumeDivIntoView scrollingDiv.id:', scrollingDiv.id, 'cssDirection:', cssDirection);
    
    // Ensure the element is visible before animation to prevent glitches
    scrollingDiv.style.opacity = '1';
    scrollingDiv.style.display = 'block';
    
    // Remove scrolled-into-view from all other resume divs to prevent duplicates
    document.querySelectorAll('.biz-resume-div.scrolled-into-view').forEach(div => {
        div.classList.remove('scrolled-into-view');
    });
    
    // Add a class for vertical animation based on direction after a small delay
    setTimeout(() => {
        if ( cssDirection === 'slide-in-from-bottom' ) {
            scrollingDiv.classList.add('slide-in-from-bottom');
        } else if (cssDirection === 'slide-in-from-top') {
            scrollingDiv.classList.add('slide-in-from-top');
        }
    }, 50); // Small delay to ensure element is ready
    
    // Calculate the exact position to scroll to
    const container = document.getElementById('resume-content-div');
    const containerRect = container.getBoundingClientRect();
    const bizResumeRect =  scrollingDiv.getBoundingClientRect();
    const scrollTop = container.scrollTop + (bizResumeRect.top - containerRect.top);
    
    // Scroll directly to the calculated position with a longer delay to avoid any conflict
    setTimeout(() => {
        container.scrollTo({ top: scrollTop, behavior: 'smooth' });
        // mark the div as scrolled into view
        scrollingDiv.classList.add('scrolled-into-view');
        // Check if this is the first or last element to log loop information
        const sortedDivs = bizResumeDivSortingModule.getSortedBizResumeDivs();
        const index = sortedDivs.indexOf(scrollingDiv);
        if (index == -1) {
            throw new Error('scrollBizResumeDivIntoView: scrollingDiv not found in sortedDivs');
        }
        const N = sortedDivs.length();
        const isFirst = (index == 0) ? true : false;
        const isLast = (index == (N - 1)) ? true : false;
       
        if (isFirst && (cssDirection === 'slide-in-from-bottom' || cssDirection === 'slide-in-from-bottom')) {
            console.log('Looped from first to last bizResumeDiv');
        } else if (isLast && (cssDirection === 'slide-in-from-top' || cssDirection === 'slide-in-from-top')) {
            console.log('Looped from last to first bizResumeDiv');
        }
    }, 200); // Increased delay to ensure no interference
    
    // Remove the animation class after the animation completes
    setTimeout(() => {
        scrollingDiv.classList.remove('slide-in-from-bottom');
        scrollingDiv.classList.remove('slide-in-from-top');
    }, 550); // Adjusted timing to account for initial delay
}

// Function to handle endless scrolling by adjusting scroll position
let scrollTimeout = null;
let lastResetTime = 0;
const resetCooldown = 500; // milliseconds before allowing another reset
let cloneDiv = null; // To track the cloned div for removal

function handleEndlessScroll(container, lastScrollTop) {
    if (scrollTimeout) {
        clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(() => {
        const currentTime = Date.now();
        if (currentTime - lastResetTime < resetCooldown) {
            console.log('Scroll reset skipped due to cooldown');
            return;
        }
        const currentScrollTop = container.scrollTop;
        const scrollingDown = currentScrollTop > lastScrollTop;
        const scrollHeight = container.scrollHeight;
        const visibleHeight = container.clientHeight;

        const sortedDivs = bizResumeDivSortingModule.getSortedBizResumeDivs();
        const index = sortedDivs.indexOf(scrollingBizResumeDiv);
        const N = sortedDivs.length();

        // Check if scrolled near the bottom (scrolling down)
        if (scrollingDown && currentScrollTop >= scrollHeight - visibleHeight - 50) {
            container.scrollTop = visibleHeight * 0.1; // Offset by 10% of visible height to show a fraction of the next div
            lastResetTime = currentTime;
            console.log('Instantly reset scroll near top for endless loop, showing fraction of next div');
            // Remove any existing clone if present
            if (cloneDiv) {
                cloneDiv.remove();
                cloneDiv = null;
                console.log('Removed clone div when resetting to top');
            }
        }
        // Check if scrolled very close to the top (scrolling up)
        else if (!scrollingDown && currentScrollTop <= 10) {
            // Get the last bizResumeDiv to clone
            if (N > 0) {
                // Remove any existing clone first
                if (cloneDiv) {
                    cloneDiv.remove();
                    console.log('Removed existing clone div before creating new one');
                }
                const lastDiv = sortedDivs[N - 1];
                cloneDiv = lastDiv.cloneNode(true);
                cloneDiv.id = 'cloned-last-div';
                cloneDiv.style.opacity = '1';
                cloneDiv.style.display = 'block';
                const firstDiv = sortedDivs[0];
                if (firstDiv && container.contains(firstDiv)) {
                    container.insertBefore(cloneDiv, firstDiv);
                    console.log('Cloned last div and placed above first div for transition');
                } else {
                    container.insertBefore(cloneDiv, container.firstChild);
                    console.log('Cloned last div and prepended to container as fallback for transition');
                }
                // Check if the current div is mostly out of view to complete the reset
                const firstDivRect = firstDiv.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                // If the first div is mostly out of view (less than 20% visible), reset scroll to bottom
                if (firstDivRect.bottom < containerRect.top + visibleHeight * 0.2) {
                    container.scrollTop = scrollHeight - visibleHeight * 0.9; // Offset to show 10% of the previous div
                    lastResetTime = currentTime;
                    console.log('Current div mostly out of view, reset scroll to bottom for endless loop');
                    // Remove the clone after reset
                    if (cloneDiv) {
                        cloneDiv.remove();
                        cloneDiv = null;
                        console.log('Removed clone div after reset to bottom');
                    }
                }
            }
        }
    }, 100); // Debounce to prevent rapid reordering
}

// call this function from main.mjs::initilization

export function initialization() {
    
    console.log('bizResumeDivScrollingModule: addDivSyncPairEventListener ->', divSyncPairEventHandler.name);

    // register a listener for the divSyncPair alerts
    divSyncModule.addDivSyncPairEventListener(divSyncPairEventHandler);

    console.log('bizResumeDivScrollingModule: initialization finished');
}

// notified when a new currentDiv is selected
function divSyncPairEventHandler(divSyncPairEvent) {

    if ( !divSyncPairEvent ) {
        console.warn('bizResumeDivSortingModule: divSyncPairEventHandler: ',
            'given null divSyncPairEvent');
        return;
    }

    if ( divSyncPairEvent.eventType === divSyncModule.DivSyncPairEventTypes.SELECTED ) {
        console.log('bizResumeDivSortingModule: divSyncPairEventHandler: ', divSyncPairEvent);
        scrollDivPairIntoView(divSyncPairEvent.element);
        return;
    }

    const eventDataString = divSyncModule.stringifyDivSyncObject(divSyncPairEvent);
    if ( divSyncPairEvent.eventType === divSyncModule.DivSyncPairEventTypes.SERVER_ERROR ) {
        console.warn('bizResumeDivSortingModule: divSyncPairEventHandler: SERVER_ERROR:',  eventDataString);
    } else {
        console.warn('bizResumeDivSortingModule: divSyncPairEventListener: ',
            'unhandled event type: ', divSyncPairEvent.eventType,
            'eventDataString:', eventDataString);
    }
}


