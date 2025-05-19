// modules/cards/bizResumeDivScrollingModule.mjs

import * as bizResumeDivSortingModule from './bizResumeDivSortingModule.mjs';

/**
 * Scrolls the top part of a business resume div into view with directional sliding
 * @param {HTMLElement} bizResumeDiv - The business resume div to scroll into view
 * @param {string} direction - The direction of navigation ('next' or 'prev')
 */
export function scrollBizResumeDivIntoView(bizResumeDiv, direction = 'next') {
    if (!bizResumeDiv) {
        throw new Error(`bizResumeDiv not provided`);
    }
    if (!bizResumeDiv.classList.contains('biz-resume-div')) {
        throw new Error(`Element ${bizResumeDiv.id} is not a biz-resume-div`);
    }
    
    // Ensure the element is visible before animation to prevent glitches
    bizResumeDiv.style.opacity = '1';
    bizResumeDiv.style.display = 'block';
    
    // Remove scrolled-into-view from all other resume divs to prevent duplicates
    document.querySelectorAll('.biz-resume-div.scrolled-into-view').forEach(div => {
        if (div !== bizResumeDiv) {
            div.classList.remove('scrolled-into-view');
        }
    });
    
    // Add a class for vertical animation based on direction after a small delay
    setTimeout(() => {
        if (direction === 'next') {
            bizResumeDiv.classList.add('slide-in-from-bottom');
        } else if (direction === 'prev') {
            bizResumeDiv.classList.add('slide-in-from-top');
        }
    }, 50); // Small delay to ensure element is ready
    
    // Calculate the exact position to scroll to
    const container = document.getElementById('resume-content-div') || bizResumeDiv.parentElement;
    const containerRect = container.getBoundingClientRect();
    const bizResumeRect = bizResumeDiv.getBoundingClientRect();
    const scrollTop = container.scrollTop + (bizResumeRect.top - containerRect.top);
    
    // Scroll directly to the calculated position with a longer delay to avoid any conflict
    setTimeout(() => {
        container.scrollTo({ top: scrollTop, behavior: 'smooth' });
        bizResumeDiv.classList.add('scrolled-into-view');
        // Check if this is the first or last element to log loop information
        const sortedBizResumeDivs = bizResumeDivSortingModule.getSortedBizResumeDivs();
        const selectedBizResumeDiv = bizResumeDiv['biz-card-div'];
        if (selectedBizResumeDiv) {
            const selectedIndex = sortedBizResumeDivs.indexOf(selectedBizResumeDiv);
            if (selectedIndex === 0 && direction === 'prev') {
                console.log('Looped from first to last bizResumeDiv');
            } else if (selectedIndex === sortedBizResumeDivs.length - 1 && direction === 'next') {
                console.log('Looped from last to first bizResumeDiv');
            }
        }
    }, 200); // Increased delay to ensure no interference
    
    // Remove the animation class after the animation completes
    setTimeout(() => {
        bizResumeDiv.classList.remove('slide-in-from-bottom');
        bizResumeDiv.classList.remove('slide-in-from-top');
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
            const bizResumeDivs = Array.from(container.querySelectorAll('.biz-resume-div'));
            if (bizResumeDivs.length > 0) {
                // Remove any existing clone first
                if (cloneDiv) {
                    cloneDiv.remove();
                    console.log('Removed existing clone div before creating new one');
                }
                const lastDiv = bizResumeDivs[bizResumeDivs.length - 1];
                cloneDiv = lastDiv.cloneNode(true);
                cloneDiv.id = 'cloned-last-div';
                cloneDiv.style.opacity = '1';
                cloneDiv.style.display = 'block';
                const firstDiv = bizResumeDivs[0];
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

