import * as viewPort from '../layout/viewPort.mjs';
import * as BizDetailsDivModule from './bizDetailsDivModule.mjs';
import * as cardUtils from './cardUtils.mjs';
import * as BizResumeDivModule from './bizResumeDivModule.mjs';
import * as bizCardSortingModule from './bizCardSortingModule.mjs';
import { assignColorIndex } from '../color_palettes.mjs';
// Business card constants
export const BIZCARD_MEAN_WIDTH = 200;
export const BIZCARD_INDENT = 29;
export const MIN_BIZCARD_HEIGHT = 200;
export const MIN_BRIGHTNESS_PERCENT = 70;
export const BLUR_Z_SCALE_FACTOR = 0.1;
export const MAX_WIDTH_OFFSET = 40; // Maximum random width offset in pixels
export const MAX_X_OFFSET = 100; // Maximum random horizontal offset in pixels
export const BIZCARD_MIN_Z = 0;
export const BIZCARD_MAX_Z = 10;

// Add at the top of the file, after imports
let currentlySelectedCardId = null;

// Reset state of all bizResumeDiv elements on page load to prevent duplication after refresh
function resetBizResumeDivState() {
    console.log('Resetting state of all bizResumeDiv elements');
    document.querySelectorAll('.biz-resume-div').forEach(div => {
        div.classList.remove('scrolled-into-view');
        div.classList.remove('selected');
        // Add a data attribute to track initial state for debugging
        div.setAttribute('data-initial-state', 'reset');
    });
    document.querySelectorAll('.biz-card-div').forEach(div => {
        div.classList.remove('selected');
    });
    currentlySelectedCardId = null;
    console.log('Reset complete, currentlySelectedCardId:', currentlySelectedCardId);
    // Reorder bizResumeDiv elements based on current sort order
    reorderBizResumeDivs();
    // After reordering, ensure the first bizResumeDiv is selected and all are visible for scrolling
    setTimeout(() => {
        document.querySelectorAll('.biz-resume-div').forEach(div => {
            div.style.opacity = '1';
            div.style.display = 'block';
        });
        console.log('All bizResumeDiv elements made visible for scrolling after reset');
        const firstBizResumeDiv = document.querySelector('.biz-resume-div');
        if (firstBizResumeDiv) {
            firstBizResumeDiv.classList.add('selected');
            firstBizResumeDiv.classList.add('scrolled-into-view');
            console.log('First bizResumeDiv selected after reset');
            // Also select the corresponding bizCardDiv
            const correspondingBizCardDiv = firstBizResumeDiv['biz-card-div'];
            if (correspondingBizCardDiv) {
                correspondingBizCardDiv.classList.add('selected');
                currentlySelectedCardId = correspondingBizCardDiv.id;
                console.log(`Corresponding bizCardDiv ${correspondingBizCardDiv.id} selected`);
            }
            // Scroll to the first bizResumeDiv
            const container = document.getElementById('resume-content-div') || firstBizResumeDiv.parentElement;
            const containerRect = container.getBoundingClientRect();
            const bizResumeRect = firstBizResumeDiv.getBoundingClientRect();
            const scrollTop = container.scrollTop + (bizResumeRect.top - containerRect.top);
            container.scrollTo({ top: scrollTop, behavior: 'smooth' });
            console.log('Scrolled to first bizResumeDiv');
        }
    }, 300); // Delay to ensure reordering is complete
}

// Call reset on DOMContentLoaded to ensure clean state after refresh
document.addEventListener('DOMContentLoaded', () => {
    resetBizResumeDivState();
    // Double-check reset after a small delay to catch any late DOM updates
    setTimeout(resetBizResumeDivState, 100);
    setTimeout(() => {
        console.log('Delayed check: Number of bizResumeDiv elements:', document.querySelectorAll('.biz-resume-div').length);
        console.log('Delayed check: Number of visible bizResumeDiv elements:', document.querySelectorAll('.biz-resume-div[style*="display: block"]').length);
        // Add scroll event listener for endless scrolling
        const container = document.getElementById('resume-content-div');
        if (container) {
            let lastScrollTop = container.scrollTop;
            container.addEventListener('scroll', () => {
                handleEndlessScroll(container, lastScrollTop);
                lastScrollTop = container.scrollTop;
            });
            console.log('Scroll event listener added for endless scrolling');
        } else {
            console.warn('resume-content-div not found for adding scroll event listener');
        }
    }, 200);
});

/**
 * Initializes view-relative styling for a any card div
 * assuming that the focal point is locatedd at viewPort
 * center origin which is marked by the bullsEye, so 
 * motion parallax-derived offsets are not applied.
 * 
 * @param {Object} viewPort - The viewPort object
 * @param {HTMLElement} cardDiv - The skill or biz card div
 */


export function getBizCardDivId(bizCardDiv, jobIndex) {
    bizCardDiv.id = `biz-card-div-${jobIndex}`;
}

export function isBizCardDivId(id) {
    return id.startsWith("biz-card-div-");
}

/**
 * Creates a business card div for a job. Does NOT appends itself
 * to the sceneDiv. This is done in main.mjs
 * 
 * @param {Object} job - The job object
 * @param {number} jobIndex - The index of the job in the sorted array
 * @returns {HTMLElement} The created business card div
 */

export function createBizCardDiv(job, jobIndex) {
    const bizCardDiv = document.createElement("div");
    bizCardDiv.classList.add("biz-card-div");
    bizCardDiv.classList.add("card-div");
    bizCardDiv.id = cardUtils.getBizCardDivId(jobIndex);
    bizCardDiv.job = job;
    bizCardDiv.jobIndex = jobIndex;
    bizCardDiv.setAttribute('sort-key-start', job.start);
    bizCardDiv.setAttribute('sort-key-end', job.end);
    bizCardDiv.setAttribute('sort-key-employer', job.employer);
    bizCardDiv.setAttribute('sort-key-title', job.title);
    bizCardDiv.setAttribute('sort-key-job-index', jobIndex);
    
    // Assign color index and apply palette
    assignColorIndex(bizCardDiv, jobIndex);
    
    // Add click handler for selection
    bizCardDiv.addEventListener("click", (event) => {
        try {
            handleBizCardDivClick(event, bizCardDiv);
        } catch (error) {
            console.error("Error handling biz card click:", error);
        }
    });
    
    // Position the scene-relative geometry of the bizCard
    setBizCardDivSceneGeometry(bizCardDiv);

    // create the biz details div with text
    const bizDetailsDiv = BizDetailsDivModule.createBizDetailsDiv(bizCardDiv);
    bizDetailsDiv.id = `biz-details-div-card-${jobIndex}`;
    bizDetailsDiv.classList.add('biz-details-div');
    bizCardDiv['biz-details-div-id'] = bizDetailsDiv.id;
    bizCardDiv.appendChild(bizDetailsDiv);

    // Initialize view-relative styling based on 
    // the scene-relative geometry and focalPoint 
    // at viewPort center which is marked by the bullsEye
    if (!viewPort.viewPortIsInitialized()) {
        throw new Error("ViewPort not initialized");
    }
    cardUtils.applyViewRelativeStyling(viewPort, bizCardDiv);

    // Create and append the resume div immediately to ensure availability on hard refresh
    const bizResumeDiv = BizResumeDivModule.createBizResumeDiv(bizCardDiv);
    const resumeContentDiv = document.getElementById('resume-content-div');
    if (resumeContentDiv) {
        // Check if a bizResumeDiv for this bizCardDiv already exists
        let existingBizResumeDiv = BizResumeDivModule.findBizResumeDiv(resumeContentDiv, bizCardDiv);
        if (!existingBizResumeDiv) {
            resumeContentDiv.appendChild(bizResumeDiv);
            console.log(`bizResumeDiv for ${bizCardDiv.id} appended to DOM on creation.`);
        } else {
            console.log(`Existing bizResumeDiv found for ${bizCardDiv.id}, reusing it.`);
            bizResumeDiv = existingBizResumeDiv;
        }
    } else {
        console.warn(`resume-content-div not found during creation of bizCardDiv ${bizCardDiv.id}, appending later.`);
    }
    bizCardDiv['biz-resume-div'] = bizResumeDiv;
    bizResumeDiv['biz-card-div'] = bizCardDiv;
    bizResumeDiv['biz-details-div-id'] = bizDetailsDiv.id;
    bizResumeDiv.style.opacity = '0';
    bizResumeDiv.style.display = 'none';
    bizResumeDiv.setAttribute('data-initial-state', 'created-and-appended');
    return bizCardDiv;
}

/**
 * Sets the scene-relative geometry of a business card div
 * @param {HTMLElement} bizCardDiv - The business card div
 */
function setBizCardDivSceneGeometry(bizCardDiv) {

    const job = bizCardDiv.job;
    if ( !job ) {
        throw new Error(`job not found for bizCardDiv ${bizCardDiv.id}`);
    }

    // Get vertical positions - based on job start and end dates
    const { sceneTop, sceneBottom } = cardUtils.getSceneVerticalPositions(job.start, job.end, MIN_BIZCARD_HEIGHT);
    bizCardDiv.setAttribute("sceneTop", `${sceneTop}`);
    const sceneHeight = sceneBottom - sceneTop;
    bizCardDiv.setAttribute("sceneHeight", `${sceneHeight}`);

    const sceneCenterX = cardUtils.getRandomSignedOffset(MAX_X_OFFSET); // Random offset from scene origin
    const sceneWidth = BIZCARD_MEAN_WIDTH + cardUtils.getRandomSignedOffset(MAX_WIDTH_OFFSET);
    const sceneLeft = sceneCenterX - sceneWidth / 2;
    bizCardDiv.setAttribute("sceneLeft", `${sceneLeft}`);
    bizCardDiv.setAttribute("sceneWidth", `${sceneWidth}`);

    const sceneZ = cardUtils.getRandomBetween(BIZCARD_MIN_Z, BIZCARD_MAX_Z);
    bizCardDiv.setAttribute("sceneZ", sceneZ);
}

/**
 * Handles click events on business cards
 * @param {HTMLElement} bizCardDiv - The clicked business card div
 * @param {Event} event - The click event
 * @param {Object} job - The job object associated with the card
 */
export function handleBizCardDivClick(event, bizCardDiv) {
    if (!bizCardDiv) {
        throw new Error(`bizCardDiv not found`);
    }
    if (!bizCardDiv.classList.contains('biz-card-div')) {
        throw new Error(`bizCardDiv is not a biz-card-div`);
    }

    // Find or add the bizResumeDiv in the right content div
    const rightContentDiv = document.getElementById('resume-content-div');
    var bizResumeDiv = BizResumeDivModule.findBizResumeDiv(rightContentDiv, bizCardDiv);
    if (!bizResumeDiv) {
        console.log(`bizResumeDiv for ${bizCardDiv.id} not found`);
        bizResumeDiv = bizCardDiv['biz-resume-div'];
        if (bizResumeDiv) {
            rightContentDiv.appendChild(bizResumeDiv);
            console.log(`bizResumeDiv for ${bizCardDiv.id} appended from reference`);
        } else {
            bizResumeDiv = BizResumeDivModule.addBizResumeDiv(rightContentDiv, bizCardDiv);
            console.log(`bizResumeDiv for ${bizCardDiv.id} added anew`);
        }
    }
    if (!bizResumeDiv) {
        throw new Error(`bizResumeDiv for ${bizCardDiv.id} not found`);
    }

    // Check if this card is already selected
    const wasSelected = currentlySelectedCardId === bizCardDiv.id;
    console.log(`Card ${bizCardDiv.id} was selected: ${wasSelected}`);

    // If it was selected, just deselect it
    if (wasSelected) {
        console.log(`Deselecting card ${bizCardDiv.id}`);
        bizCardDiv.classList.remove('selected');
        bizResumeDiv.classList.remove('selected');
        currentlySelectedCardId = null;
        return;
    }

    // Otherwise, deselect all others and select this one
    console.log(`Selecting card ${bizCardDiv.id}`);
    document.querySelectorAll('.biz-card-div.selected').forEach(div => {
        console.log(`Deselecting other card ${div.id}`);
        div.classList.remove('selected');
    });
    document.querySelectorAll('.biz-resume-div.selected').forEach(div => {
        console.log(`Deselecting other resume ${div.id}`);
        div.classList.remove('selected');
    });

    // Remove scrolled-into-view from all resumes
    document.querySelectorAll('.biz-resume-div.scrolled-into-view').forEach(div => {
        div.classList.remove('scrolled-into-view');
    });

    // Select both the biz resume card and the biz card
    bizResumeDiv.classList.add('selected');
    bizCardDiv.classList.add('selected');
    currentlySelectedCardId = bizCardDiv.id;

    // Scroll to the resume div, let scrollBizResumeDivIntoView handle the scrolled-into-view class
    scrollBizResumeDivIntoView(bizResumeDiv, 'next');
}

// Function to reorder bizResumeDiv elements based on the current sort order of bizCardDivs
function reorderBizResumeDivs() {
    console.log('Reordering bizResumeDiv elements based on bizCardDiv sort order');
    const sortedBizCardDivs = bizCardSortingModule.getSortedBizCardDivs();
    const resumeContentDiv = document.getElementById('resume-content-div');
    if (!resumeContentDiv) {
        console.warn('resume-content-div not found during reordering');
        return;
    }
    sortedBizCardDivs.forEach(bizCardDiv => {
        let bizResumeDiv = BizResumeDivModule.findBizResumeDiv(resumeContentDiv, bizCardDiv);
        if (!bizResumeDiv) {
            bizResumeDiv = bizCardDiv['biz-resume-div'];
            if (bizResumeDiv) {
                resumeContentDiv.appendChild(bizResumeDiv);
                console.log(`bizResumeDiv for ${bizCardDiv.id} appended during reordering`);
            } else {
                bizResumeDiv = BizResumeDivModule.addBizResumeDiv(resumeContentDiv, bizCardDiv);
                console.log(`bizResumeDiv for ${bizCardDiv.id} created during reordering`);
            }
        } else {
            // Move existing bizResumeDiv to the end to maintain order
            resumeContentDiv.appendChild(bizResumeDiv);
            console.log(`bizResumeDiv for ${bizCardDiv.id} moved to maintain order`);
        }
    });
    console.log('Reordering complete');
}

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
        const sortedBizCardDivs = bizCardSortingModule.getSortedBizCardDivs();
        const selectedBizCardDiv = bizResumeDiv['biz-card-div'];
        if (selectedBizCardDiv) {
            const selectedIndex = sortedBizCardDivs.indexOf(selectedBizCardDiv);
            if (selectedIndex === 0 && direction === 'prev') {
                console.log('Looped from first to last bizResumeDiv');
            } else if (selectedIndex === sortedBizCardDivs.length - 1 && direction === 'next') {
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

export function addBizCardDivManagementButtonEventListeners(
    selectFirstBizCardButton,
    selectNextBizCardButton,
    selectPrevBizCardButton,
    selectLastBizCardButton) {

    // Add bizCardDiv management button event listeners
    if (selectFirstBizCardButton) {
        selectFirstBizCardButton.addEventListener('click', () => {
            console.log('First button clicked');
            try {
                const sortedBizCardDivs = bizCardSortingModule.getSortedBizCardDivs();
                if (!sortedBizCardDivs || sortedBizCardDivs.length === 0) {
                    console.log('No bizCardDivs available');
                    return;
                }
                console.log(`Total sorted bizCardDivs: ${sortedBizCardDivs.length}`);
                const firstBizCardDiv = sortedBizCardDivs[0];
                if (firstBizCardDiv) {
                    console.log(`Selecting first bizCardDiv: ${firstBizCardDiv.id}`);
                    // Call handler directly instead of click() to ensure state consistency
                    handleBizCardDivClick(null, firstBizCardDiv);
                } else {
                    console.error('First bizCardDiv is undefined');
                }
            } catch (error) {
                console.error('Error selecting first bizCardDiv:', error);
            }
        });
    }

    if (selectNextBizCardButton) {
        selectNextBizCardButton.addEventListener('click', () => {
            console.log('Next button clicked');
            try {
                const sortedBizCardDivs = bizCardSortingModule.getSortedBizCardDivs();
                if (!sortedBizCardDivs || sortedBizCardDivs.length === 0) {
                    console.log('No bizCardDivs available');
                    return;
                }
                console.log(`Total sorted bizCardDivs: ${sortedBizCardDivs.length}`);
                const selectedBizCardDiv = document.querySelector('.biz-card-div.selected');
                console.log('Currently selected card ID:', currentlySelectedCardId);
                console.log('DOM selected bizCardDiv:', selectedBizCardDiv ? selectedBizCardDiv.id : 'none');
                let nextIndex = 0;
                if (selectedBizCardDiv && currentlySelectedCardId === selectedBizCardDiv.id) {
                    const selectedIndex = sortedBizCardDivs.indexOf(selectedBizCardDiv);
                    if (selectedIndex >= 0) {
                        nextIndex = (selectedIndex + 1) % sortedBizCardDivs.length;
                        console.log(`Current index: ${selectedIndex}, Next index: ${nextIndex}`);
                    } else {
                        console.log('Selected bizCardDiv not found in sorted list, defaulting to first');
                    }
                } else {
                    console.log('No bizCardDiv currently selected or mismatch, defaulting to first');
                }
                const nextBizCardDiv = sortedBizCardDivs[nextIndex];
                if (nextBizCardDiv) {
                    console.log(`Selecting next bizCardDiv: ${nextBizCardDiv.id}`);
                    // Call handler directly instead of click() to ensure state consistency
                    handleBizCardDivClick(null, nextBizCardDiv);
                    // No need to call scrollBizResumeDivIntoView separately, handled in handleBizCardDivClick
                } else {
                    console.error('Next bizCardDiv is undefined');
                }
            } catch (error) {
                console.error('Error selecting next bizCardDiv:', error);
            }
        });
    }

    if (selectPrevBizCardButton) {
        selectPrevBizCardButton.addEventListener('click', () => {
            console.log('Prev button clicked');
            try {
                const sortedBizCardDivs = bizCardSortingModule.getSortedBizCardDivs();
                if (!sortedBizCardDivs || sortedBizCardDivs.length === 0) {
                    console.log('No bizCardDivs available');
                    return;
                }
                console.log(`Total sorted bizCardDivs: ${sortedBizCardDivs.length}`);
                const selectedBizCardDiv = document.querySelector('.biz-card-div.selected');
                console.log('Currently selected card ID:', currentlySelectedCardId);
                console.log('DOM selected bizCardDiv:', selectedBizCardDiv ? selectedBizCardDiv.id : 'none');
                let prevIndex = 0;
                if (selectedBizCardDiv && currentlySelectedCardId === selectedBizCardDiv.id) {
                    const selectedIndex = sortedBizCardDivs.indexOf(selectedBizCardDiv);
                    if (selectedIndex >= 0) {
                        prevIndex = (selectedIndex - 1 + sortedBizCardDivs.length) % sortedBizCardDivs.length;
                        console.log(`Current index: ${selectedIndex}, Previous index: ${prevIndex}`);
                    } else {
                        console.log('Selected bizCardDiv not found in sorted list, defaulting to first');
                    }
                } else {
                    console.log('No bizCardDiv currently selected or mismatch, defaulting to first');
                }
                const prevBizCardDiv = sortedBizCardDivs[prevIndex];
                if (prevBizCardDiv) {
                    console.log(`Selecting previous bizCardDiv: ${prevBizCardDiv.id}`);
                    // Call handler directly instead of click() to ensure state consistency
                    handleBizCardDivClick(null, prevBizCardDiv);
                    // No need to call scrollBizResumeDivIntoView separately, handled in handleBizCardDivClick
                } else {
                    console.error('Previous bizCardDiv is undefined');
                }
            } catch (error) {
                console.error('Error selecting previous bizCardDiv:', error);
            }
        });
    }

    if (selectLastBizCardButton) {
        selectLastBizCardButton.addEventListener('click', () => {
            console.log('Last button clicked');
            try {
                const sortedBizCardDivs = bizCardSortingModule.getSortedBizCardDivs();
                if (!sortedBizCardDivs || sortedBizCardDivs.length === 0) {
                    console.log('No bizCardDivs available');
                    return;
                }
                console.log(`Total sorted bizCardDivs: ${sortedBizCardDivs.length}`);
                const lastBizCardDiv = sortedBizCardDivs[sortedBizCardDivs.length - 1];
                if (lastBizCardDiv) {
                    console.log(`Selecting last bizCardDiv: ${lastBizCardDiv.id}`);
                    // Call handler directly instead of click() to ensure state consistency
                    handleBizCardDivClick(null, lastBizCardDiv);
                } else {
                    console.error('Last bizCardDiv is undefined');
                }
            } catch (error) {
                console.error('Error selecting last bizCardDiv:', error);
            }
        });
    }
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