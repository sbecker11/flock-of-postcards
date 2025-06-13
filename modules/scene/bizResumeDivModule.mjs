// scene/bizResumeDivModule.mjs

import * as utils from '../utils/utils.mjs';
import * as BizDetailsDivModule from './bizDetailsDivModule.mjs';
import * as colorPalettes from '../colors/colorPalettes.mjs';
import * as bizCardDivModule from './bizCardDivModule.mjs';

import { Logger, LogLevel } from '../logger.mjs';
const logger = new Logger("bizResumeDivModule", LogLevel.INFO);

// BizResumeDiv is the div that contains the resume of the job
// it is created by resumeManager and is never appended to the DOM. 
export function createBizResumeDiv(bizCardDiv) {
    if (!bizCardDiv) throw new Error('createBizResumeDiv: given null bizCardDiv');
    const bizResumeDiv = document.createElement("div");
    bizResumeDiv.classList.add("biz-resume-div");
    bizResumeDiv.classList.add("resume-content-div-child"); // Add the required class for proper styling
    bizResumeDiv.id = createBizResumeDivId(bizCardDiv.id);
    const jobIndex = bizCardDiv.getAttribute('data-job-index');
    if (!utils.isNumericString(jobIndex)) throw new Error('createBizResumeDiv: given non-numeric attribute jobIndex');
    bizResumeDiv.setAttribute('data-job-index', jobIndex);

    // Set up paired relationship
    bizResumeDiv.setAttribute('data-paired-id', bizCardDiv.id);
    bizCardDiv.setAttribute('data-paired-id', bizResumeDiv.id);

    // Ensure pointer-events is set to auto
    bizResumeDiv.style.pointerEvents = 'auto';

    // Apply the same color palette as the biz card
    const colorIndex = bizCardDiv.getAttribute('data-color-index');
    if (!colorPalettes.isColorIndexString(colorIndex)) throw new Error('createBizResumeDiv: given non-colorIndexString colorIndex');
    bizResumeDiv.setAttribute('data-color-index', colorIndex);
    
    // create bizResumeDetails after setting data-color-index
    const bizResumeDetailsDiv = BizDetailsDivModule.createBizResumeDetailsDiv(bizResumeDiv, bizCardDiv);
    bizResumeDiv.appendChild(bizResumeDetailsDiv);

    // and apply the color set to bizResumeDiv and its after appending the bizResumeDetailsDiv
    colorPalettes.applyCurrentColorPaletteToElement(bizResumeDiv);

    return bizResumeDiv;
}

/**
 * Gets the ID of a business resume div
 * @param {string} bizCardDivId - The index of the business card div
 * @returns {string} The ID of the business resume div
 */
export function createBizResumeDivId(bizCardDivId) {
    const bizResumeDivId = bizCardDivId.replace("card", "resume");
    return bizResumeDivId;
}

/**
 * Handle click events on biz resume divs
 * @param {HTMLElement} element - The element that was clicked
 */
export function handleClickEvent(element) {
    if (!element) {
        throw new Error("bizResumeDivModule: handleClickEvent called with null element");
    }
    
    console.info(`bizResumeDivModule: handleClickEvent called for ${element.id}`);
    
    if (element.classList.contains("biz-resume-div")) {
        const bizResumeDiv = element;
        handleBizResumeDivClickEvent(bizResumeDiv);
    }
}

/**
 * Handle click events on bizResumeDivs
 * Similar to bizCardDivModule.handleBizCardDivClickEvent but for bizResumeDivs
 * @param {HTMLElement} bizResumeDiv - The biz resume div that was clicked
 */
export function handleBizResumeDivClickEvent(bizResumeDiv) {
    if (!bizResumeDiv) throw new Error("bizResumeDiv is required");

    console.info(`bizResumeDivModule: handleBizResumeDivClickEvent called for ${bizResumeDiv.id}`);
    
    // Check if the element is already selected
    const isSelected = bizResumeDiv.classList.contains("selected");
    console.info(`bizResumeDivModule: ${bizResumeDiv.id} isSelected before: ${isSelected}`);
    
    // Clear all selected elements
    bizCardDivModule.clearAllSelected();
    
    // If it was already selected, we're done (it's now unselected)
    if (isSelected) {
        console.info(`bizResumeDivModule: ${bizResumeDiv.id} was already selected, now unselected`);
        return;
    }
    
    // Add selected class to this element
    bizResumeDiv.classList.add("selected");
    bizResumeDiv.classList.remove("hovered");
    console.info(`bizResumeDivModule: Added selected class to ${bizResumeDiv.id}`);
    
    // Verify selection was applied
    console.info(`bizResumeDivModule: ${bizResumeDiv.id} isSelected after: ${bizResumeDiv.classList.contains("selected")}`);
    
    // Get the paired bizCardDiv
    const pairedId = bizResumeDiv.getAttribute('data-paired-id');
    const bizCardDiv = document.getElementById(pairedId);
    
    if (bizCardDiv) {
        // Select the paired bizCardDiv
        bizCardDiv.classList.add("selected");
        bizCardDiv.classList.remove("hovered");
        console.info(`bizResumeDivModule: Added selected class to paired bizCardDiv ${bizCardDiv.id}`);
        
        // Scroll it into view
        styleBizCardDivAsSelectdAndScrollIntoView(bizCardDiv);
    } else {
        console.info(`bizResumeDivModule: Could not find paired bizCardDiv with ID ${pairedId}`);
    }
}

/**
 * Select the given bizCardDiv and scroll it into view
 * @param {HTMLElement} bizCardDiv - The bizCardDiv to select and scroll into view
 */
export function styleBizCardDivAsSelectdAndScrollIntoView(bizCardDiv) {
    if (!bizCardDiv) throw new Error("bizCardDiv is required");
    
    console.info(`bizResumeDivModule: styleBizCardDivAsSelectdAndScrollIntoView ${bizCardDiv.id}`);
    
    // Ensure the element is selected
    bizCardDiv.classList.remove("hovered");
    bizCardDiv.classList.add('selected');
    
    // Verify selection was applied
    console.info(`bizResumeDivModule: ${bizCardDiv.id} isSelected: ${bizCardDiv.classList.contains("selected")}`);
    
    // Import bizCardDivModule to use its scrolling function
    bizCardDivModule.scrollBizCardDivIntoView(bizCardDiv);
}

/**
 * Sets up click handlers for all biz resume divs
 * Uses the shared mouse event handlers from bizCardDivModule
 */
export function setupEventListeners() {
    const bizResumeDivs = document.querySelectorAll('.biz-resume-div');
    
    console.info(`bizResumeDivModule: Setting up event listeners for ${bizResumeDivs.length} biz resume divs`);
    
    bizResumeDivs.forEach(div => {
        // Remove any existing handlers to avoid duplicates
        const oldClickHandler = div._clickHandler;
        const oldEnterHandler = div._enterHandler;
        const oldLeaveHandler = div._leaveHandler;
        
        if (oldClickHandler) {
            div.removeEventListener('click', oldClickHandler);
        }
        
        if (oldEnterHandler) div.removeEventListener('mouseenter', oldEnterHandler);
        if (oldLeaveHandler) div.removeEventListener('mouseleave', oldLeaveHandler);
        
        // Create new handlers with direct function calls
        const clickHandler = (e) => {
            // Log before doing anything else
            console.info(`bizResumeDivModule: Click detected on ${div.id}`);
            
            // Stop event propagation
            e.stopPropagation();
            e.preventDefault();
            
            // Call the handler directly
            console.info(`bizResumeDivModule: Calling handleBizResumeDivClickEvent directly for ${div.id}`);
            handleBizResumeDivClickEvent(div);
            
            return false;
        };
        
        const enterHandler = (e) => {
            if (div.classList.contains("selected")) return;
            bizCardDivModule.handleMouseEnterEvent(div);
        };
        
        const leaveHandler = (e) => {
            if (div.classList.contains("selected")) return;
            bizCardDivModule.handleMouseLeaveEvent(div);
        };
        
        // Store handlers on the element for later reference
        div._clickHandler = clickHandler;
        div._enterHandler = enterHandler;
        div._leaveHandler = leaveHandler;
        
        // Add the event listeners with capture phase to ensure they fire first
        div.addEventListener('click', clickHandler, true);
        div.addEventListener('mouseenter', enterHandler);
        div.addEventListener('mouseleave', leaveHandler);
        
        // Also set onclick directly as a fallback
        div.onclick = clickHandler;
        
        // Add data attributes to confirm handlers were attached
        div.setAttribute('data-has-click-handler', 'true');
        
        console.info(`bizResumeDivModule: Added event handlers to ${div.id}`);
    });
    
    // Add a global click handler to catch all clicks on bizResumeDivs
    document.addEventListener('click', function(event) {
        const bizResumeDiv = event.target.closest('.biz-resume-div');
        if (bizResumeDiv) {
            console.info(`bizResumeDivModule: Global handler caught click on ${bizResumeDiv.id}`);
            event.stopPropagation();
            console.info(`bizResumeDivModule: Calling handleBizResumeDivClickEvent from global handler for ${bizResumeDiv.id}`);
            handleBizResumeDivClickEvent(bizResumeDiv);
        }
    }, true);
    
    console.info(`bizResumeDivModule: Set up event handlers for ${bizResumeDivs.length} biz resume divs`);
}

// Event handler functions
function bizResumeClickHandler(event) {
    console.info(`bizResumeDivModule: Click detected on ${event.currentTarget?.id || 'unknown'}`);
    
    // Test the error condition (remove this after testing)
    // handleClickEvent(null);
    
    // Normal behavior
    handleClickEvent(event.currentTarget);
}

function bizResumeMouseEnterHandler(event) {
    console.info(`bizResumeDivModule: Mouse enter detected on ${event.currentTarget.id}`);
    handleMouseEnterEvent(event.currentTarget);
}

function bizResumeMouseLeaveHandler(event) {
    console.info(`bizResumeDivModule: Mouse leave detected on ${event.currentTarget.id}`);
    handleMouseLeaveEvent(event.currentTarget);
}

// Add a debug click handler to the document
export function setupDebugClickHandler() {
    document.addEventListener('click', function(event) {
        const target = event.target;
        const bizResumeDiv = target.closest('.biz-resume-div');
        
        if (bizResumeDiv) {
            console.info('Debug: Click detected on element:', target);
            console.info('Debug: Closest bizResumeDiv:', bizResumeDiv.id);
            console.info('Debug: Target pointer-events:', getComputedStyle(target).pointerEvents);
            console.info('Debug: BizResumeDiv pointer-events:', getComputedStyle(bizResumeDiv).pointerEvents);
            
            // Check if the click handler is attached
            const hasClickHandler = bizResumeDiv.getAttribute('data-has-click-handler');
            console.info('Debug: Has click handler attribute:', hasClickHandler);
            
            // Force handle the click event
            console.info('Debug: Forcing handleClickEvent...');
            handleClickEvent(bizResumeDiv);
        }
    });
    
    console.info('Set up debug click handler for diagnosing bizResumeDiv clicks');
}

// Add a function to check if click handlers are properly attached
export function checkClickability() {
    console.info("Checking clickability of bizResumeDivs...");
    
    // Get all bizResumeDivs
    const bizResumeDivs = document.querySelectorAll('.biz-resume-div');
    console.info(`Found ${bizResumeDivs.length} bizResumeDivs`);
    
    if (bizResumeDivs.length === 0) {
        console.warn("No bizResumeDivs found!");
        return;
    }
    
    // Check the first bizResumeDiv
    const firstDiv = bizResumeDivs[0];
    console.info(`Checking first bizResumeDiv: ${firstDiv.id}`);
    
    // Check computed styles
    const style = getComputedStyle(firstDiv);
    console.info(`- pointer-events: ${style.pointerEvents}`);
    console.info(`- position: ${style.position}`);
    console.info(`- z-index: ${style.zIndex}`);
    console.info(`- display: ${style.display}`);
    console.info(`- visibility: ${style.visibility}`);
    console.info(`- opacity: ${style.opacity}`);
    
    // Check if it has the click handler
    const hasClickHandler = firstDiv.onclick || firstDiv._clickHandler;
    console.info(`- Has click handler: ${!!hasClickHandler}`);
    
    // Check its children
    const detailsDiv = firstDiv.querySelector('.biz-resume-details-div');
    if (detailsDiv) {
        const detailsStyle = getComputedStyle(detailsDiv);
        console.info(`Details div found: ${detailsDiv.className}`);
        console.info(`- pointer-events: ${detailsStyle.pointerEvents}`);
        console.info(`- position: ${detailsStyle.position}`);
        console.info(`- z-index: ${detailsStyle.zIndex}`);
    } else {
        console.warn("No details div found!");
    }
    
    // Add a temporary click handler for testing
    const oldHandler = firstDiv._tempHandler;
    if (oldHandler) {
        firstDiv.removeEventListener('click', oldHandler);
    }
    
    const tempHandler = (e) => {
        console.info(`TEST CLICK on ${firstDiv.id}`);
        console.info(`- Target: ${e.target.tagName} ${e.target.className}`);
        console.info(`- Current target: ${e.currentTarget.tagName} ${e.currentTarget.className}`);
        e.stopPropagation();
    };
    
    firstDiv._tempHandler = tempHandler;
    firstDiv.addEventListener('click', tempHandler);
    console.info("Added temporary test click handler to first bizResumeDiv");
    
    console.info("Click check complete. Try clicking the first bizResumeDiv now.");
}

// Check if the scene container exists and is scrollable
export function checkSceneContainer() {
    console.info("Checking scene container...");
    
    const sceneContainer = document.getElementById('scene-container');
    if (sceneContainer) {
        console.info("Scene container found");
        console.info("- offsetHeight:", sceneContainer.offsetHeight);
        console.info("- scrollHeight:", sceneContainer.scrollHeight);
        console.info("- clientHeight:", sceneContainer.clientHeight);
        console.info("- scrollTop:", sceneContainer.scrollTop);
        console.info("- style.overflow:", getComputedStyle(sceneContainer).overflow);
        console.info("- style.position:", getComputedStyle(sceneContainer).position);
        
        // Check if it's scrollable
        const isScrollable = sceneContainer.scrollHeight > sceneContainer.clientHeight;
        console.info("- Is scrollable:", isScrollable);
        
        // Try scrolling to a specific position
        const originalScrollTop = sceneContainer.scrollTop;
        const testScrollTop = Math.min(sceneContainer.scrollHeight - sceneContainer.clientHeight, 100);
        
        console.info(`- Testing scroll to ${testScrollTop}px...`);
        sceneContainer.scrollTo({
            top: testScrollTop,
            behavior: 'auto'
        });
        
        // Check if the scroll position changed
        setTimeout(() => {
            console.info(`- New scrollTop: ${sceneContainer.scrollTop}`);
            console.info(`- Scroll test ${sceneContainer.scrollTop === testScrollTop ? 'succeeded' : 'failed'}`);
            
            // Restore original scroll position
            sceneContainer.scrollTo({
                top: originalScrollTop,
                behavior: 'auto'
            });
        }, 100);
        
        // List all bizCardDivs in the scene container
        const bizCardDivs = sceneContainer.querySelectorAll('.biz-card-div');
        console.info(`- Contains ${bizCardDivs.length} bizCardDivs`);
        
        if (bizCardDivs.length > 0) {
            const firstBizCardDiv = bizCardDivs[0];
            console.info(`- First bizCardDiv: ${firstBizCardDiv.id}`);
            console.info(`- First bizCardDiv offsetTop: ${firstBizCardDiv.offsetTop}`);
            console.info(`- First bizCardDiv style.position: ${getComputedStyle(firstBizCardDiv).position}`);
        }
    } else {
        console.error("Scene container not found");
    }
}

// Add this function to the end of the file
export function checkPairing() {
    console.info("Checking pairing between bizCardDivs and bizResumeDivs...");
    
    // Get all bizCardDivs
    const bizCardDivs = document.querySelectorAll('.biz-card-div');
    console.info(`Found ${bizCardDivs.length} bizCardDivs`);
    
    // Get all bizResumeDivs
    const bizResumeDivs = document.querySelectorAll('.biz-resume-div');
    console.info(`Found ${bizResumeDivs.length} bizResumeDivs`);
    
    // Check pairing
    let pairedCount = 0;
    bizCardDivs.forEach(cardDiv => {
        const pairedId = cardDiv.getAttribute('data-paired-id');
        const resumeDiv = document.getElementById(pairedId);
        
        if (resumeDiv) {
            pairedCount++;
            console.info(`${cardDiv.id} is paired with ${resumeDiv.id}`);
            
            // Check if the resumeDiv has click handlers
            const hasClickHandler = resumeDiv.getAttribute('data-has-click-handler') === 'true';
            console.info(`${resumeDiv.id} has click handler: ${hasClickHandler}`);
            
            // Try to trigger a click on the resumeDiv
            console.info(`Attempting to trigger click on ${resumeDiv.id}...`);
            
            // Create and dispatch a click event
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            
            resumeDiv.dispatchEvent(clickEvent);
        } else {
            console.info(`${cardDiv.id} has no paired resumeDiv`);
        }
    });
    
    console.info(`${pairedCount} out of ${bizCardDivs.length} bizCardDivs are paired with bizResumeDivs`);
    
    // Make this function available globally
    window.checkPairing = checkPairing;
    console.info("This function is now available globally as window.checkPairing()");
}

// Make diagnostic functions available globally
export function exposeGlobalDiagnostics() {
    window.bizResumeDivCheck = {
        checkClickability: checkClickability,
        checkPairing: checkPairing,
        checkSceneContainer: checkSceneContainer
    };
    console.info("Global diagnostic functions exposed as window.bizResumeDivCheck");
    console.info("Usage: window.bizResumeDivCheck.checkClickability()");
    console.info("Usage: window.bizResumeDivCheck.checkPairing()");
    console.info("Usage: window.bizResumeDivCheck.checkSceneContainer()");
}

// Initialize function to set up everything
export function initialize() {
    setupEventListeners();
    setupDebugClickHandler();
    exposeGlobalDiagnostics();
}

// Enhanced function to scroll a bizCardDiv into view
function scrollBizCardDivIntoView(bizCardDiv) {
    if (!bizCardDiv) {
        console.error("scrollBizCardDivIntoView: bizCardDiv is null");
        return;
    }
    
    console.info(`Attempting to scroll bizCardDiv ${bizCardDiv.id} into view`);
    
    // Try multiple scrolling approaches
    
    // Approach 1: Use the scene container directly
    const sceneContainer = document.getElementById('scene-container');
    if (sceneContainer) {
        console.info("Using scene container for scrolling");
        
        // Get the position of the bizCardDiv relative to the scene
        const bizCardRect = bizCardDiv.getBoundingClientRect();
        const sceneRect = sceneContainer.getBoundingClientRect();
        
        // Calculate the scroll position needed to center the bizCardDiv
        const relativeTop = bizCardDiv.offsetTop;
        const scrollTop = relativeTop - (sceneContainer.clientHeight / 2) + (bizCardDiv.clientHeight / 2);
        
        console.info(`bizCardDiv offsetTop: ${relativeTop}`);
        console.info(`Calculated scrollTop: ${scrollTop}`);
        
        // Scroll the scene container
        sceneContainer.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
        });
        
        console.info(`Scrolled scene container to ${scrollTop}px`);
        
        // Set a timeout to check if scrolling worked
        setTimeout(() => {
            console.info(`Current scene container scrollTop: ${sceneContainer.scrollTop}`);
            const newBizCardRect = bizCardDiv.getBoundingClientRect();
            console.info(`bizCardDiv position after scroll: top=${newBizCardRect.top}, bottom=${newBizCardRect.bottom}`);
            
            // If the bizCardDiv is not visible, try approach 2
            const isVisible = (newBizCardRect.top >= sceneRect.top && newBizCardRect.bottom <= sceneRect.bottom);
            console.info(`bizCardDiv is ${isVisible ? 'visible' : 'not visible'} in viewport`);
            
            if (!isVisible) {
                console.info("Trying fallback scrolling approach");
                // Approach 2: Use scrollIntoView
                bizCardDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 500);
    } else {
        console.info("Scene container not found, using standard scrollIntoView");
        // Fallback to standard scrollIntoView
        bizCardDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Helper function to extract job index from an element ID
function extractJobIndexFromId(id) {
    // Match patterns like "biz-resume-div-17" or "biz-card-div-17"
    const match = id.match(/-(div-|resume-div-|card-div-)(\d+)$/);
    if (match && match[2]) {
        return match[2];
    }
    return null;
}

// Enhanced mouse enter handler for bizResumeDivs
export function handleMouseEnterEvent(element) {
    if (!element) return;
    
    console.info(`bizResumeDivModule: Mouse enter on ${element.id}`);
    
    // Always apply hover state regardless of focal point state
    if (!element.classList.contains("selected")) {
        element.classList.add("hovered");
        
        // Find and hover the paired card div
        const pairedId = element.getAttribute('data-paired-id');
        if (pairedId) {
            const bizCardDiv = document.getElementById(pairedId);
            if (bizCardDiv && !bizCardDiv.classList.contains("selected")) {
                bizCardDiv.classList.add("hovered");
                console.info(`bizResumeDivModule: Added hover to paired bizCardDiv ${pairedId}`);
            }
        }
        
        console.info(`bizResumeDivModule: Element ${element.id} hovered`);
    } else {
        console.info(`bizResumeDivModule: Element ${element.id} not hovered (already selected)`);
    }
}

// Enhanced mouse leave handler for bizResumeDivs
export function handleMouseLeaveEvent(element) {
    if (!element) return;
    
    console.info(`bizResumeDivModule: Mouse leave on ${element.id}`);
    
    // Always remove hover state regardless of focal point state
    if (!element.classList.contains("selected")) {
        element.classList.remove("hovered");
        
        // Find and unhover the paired card div
        const pairedId = element.getAttribute('data-paired-id');
        if (pairedId) {
            const bizCardDiv = document.getElementById(pairedId);
            if (bizCardDiv && !bizCardDiv.classList.contains("selected")) {
                bizCardDiv.classList.remove("hovered");
                console.info(`bizResumeDivModule: Removed hover from paired bizCardDiv ${pairedId}`);
            }
        }
        
        console.info(`bizResumeDivModule: Element ${element.id} unhovered`);
    } else {
        console.info(`bizResumeDivModule: Element ${element.id} not unhovered (selected)`);
    }
}

/**
 * Scroll a bizResumeDiv into view
 * @param {HTMLElement} bizResumeDiv - The bizResumeDiv to scroll into view
 */
export function scrollBizResumeDivIntoView(bizResumeDiv) {
    if (!bizResumeDiv) {
        console.error("bizResumeDivModule: scrollBizResumeDivIntoView called with null bizResumeDiv");
        return;
    }
    
    console.info(`bizResumeDivModule: Scrolling bizResumeDiv ${bizResumeDiv.id} into view`);
    
    // Get the resumeManager
    const resumeManager = window.resumeManager;
    if (resumeManager && typeof resumeManager.scrollBizResumeDivIntoView === 'function') {
        // Use the resumeManager to scroll the bizResumeDiv into view
        resumeManager.scrollBizResumeDivIntoView(bizResumeDiv);
        return;
    }
    
    // If resumeManager is not available, try to use the infiniteScroller directly
    if (window.infiniteScroller) {
        console.info(`bizResumeDivModule: Using infiniteScroller directly to scroll ${bizResumeDiv.id}`);
        window.infiniteScroller.scrollToBizResumeDiv(bizResumeDiv, true);
        return;
    }
    
    // Last resort: use direct scrollIntoView
    console.info(`bizResumeDivModule: Using direct scrollIntoView for ${bizResumeDiv.id}`);
    bizResumeDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Debug function to check if elements are properly selected
 * Call this from the console to see which elements are selected
 */
export function checkSelectedElements() {
    console.info("Checking selected elements...");
    
    // Check bizResumeDivs
    const bizResumeDivs = document.querySelectorAll('.biz-resume-div');
    console.info(`Found ${bizResumeDivs.length} bizResumeDivs`);
    
    let selectedCount = 0;
    bizResumeDivs.forEach(div => {
        const isSelected = div.classList.contains("selected");
        if (isSelected) {
            selectedCount++;
            console.info(`${div.id} is selected`);
        }
    });
    
    console.info(`${selectedCount} bizResumeDivs are selected`);
    
    // Check bizCardDivs
    const bizCardDivs = document.querySelectorAll('.biz-card-div');
    console.info(`Found ${bizCardDivs.length} bizCardDivs`);
    
    selectedCount = 0;
    bizCardDivs.forEach(div => {
        const isSelected = div.classList.contains("selected");
        if (isSelected) {
            selectedCount++;
            console.info(`${div.id} is selected`);
        }
    });
    
    console.info(`${selectedCount} bizCardDivs are selected`);
    
    // Make this function available globally
    window.checkSelectedElements = checkSelectedElements;
    console.info("This function is now available globally as window.checkSelectedElements()");
    
    return selectedCount > 0;
}
