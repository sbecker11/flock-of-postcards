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

// Handle click events on biz resume divs
export function handleClickEvent(element) {
    if (!element) {
        console.error("bizResumeDivModule: handleClickEvent called with null element");
        return;
    }
    
    console.log("bizResumeDivModule: handleClickEvent called for", element.id);
    
    try {
        // If the element is already selected, unselect it
        if (element.classList.contains('selected')) {
            console.log(`bizResumeDivModule: Unselecting element ${element.id}`);
            element.classList.remove('selected');
            
            // Extract job index from the ID
            const jobIndex = extractJobIndexFromId(element.id);
            if (jobIndex !== null) {
                const bizCardDivId = `biz-card-div-${jobIndex}`;
                const bizCardDiv = document.getElementById(bizCardDivId);
                
                if (bizCardDiv) {
                    console.log(`Found paired bizCardDiv: ${bizCardDiv.id}`);
                    bizCardDiv.classList.remove('selected');
                    
                    // Restore original filter if available
                    const originalFilter = bizCardDiv.getAttribute('data-original-filter');
                    if (originalFilter) {
                        bizCardDiv.style.filter = originalFilter;
                    } else {
                        bizCardDiv.style.filter = '';
                    }
                }
            }
            
            return;
        }

        // Otherwise, select the element
        console.log(`bizResumeDivModule: Selecting element ${element.id}`);
        
        // First, unselect any currently selected elements
        document.querySelectorAll('.biz-resume-div.selected, .biz-card-div.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Select this element
        element.classList.add('selected');
        
        // Extract job index from the ID
        const jobIndex = extractJobIndexFromId(element.id);
        if (jobIndex !== null) {
            console.log(`Extracted job index: ${jobIndex}`);
            const bizCardDivId = `biz-card-div-${jobIndex}`;
            console.log(`Looking for bizCardDiv with ID: ${bizCardDivId}`);
            
            const bizCardDiv = document.getElementById(bizCardDivId);
            
            if (bizCardDiv) {
                console.log(`bizResumeDivModule: Found paired bizCardDiv ${bizCardDiv.id}`);
                
                // Store the current filter as original filter
                const currentFilter = bizCardDiv.style.filter || '';
                bizCardDiv.setAttribute('data-original-filter', currentFilter);
                console.log(`Stored original filter for ${bizCardDiv.id}: ${currentFilter}`);
                
                // Apply the brightness filter for selected state
                bizCardDiv.style.filter = "brightness(1.5)";
                
                // Add selected class
                bizCardDiv.classList.add('selected');
                
                // Use the bizCardDivModule's scrollBizCardDivIntoView function
                bizCardDivModule.scrollBizCardDivIntoView(bizCardDiv);
                
                console.log(`bizResumeDivModule: Scrolled bizCardDiv ${bizCardDiv.id} into view`);
            } else {
                console.error(`bizResumeDivModule: Could not find bizCardDiv with ID ${bizCardDivId}`);
            }
        } else {
            console.error(`bizResumeDivModule: Could not extract job index from ID ${element.id}`);
        }
    } catch (error) {
        console.error("bizResumeDivModule: Error in handleClickEvent:", error);
    }
}

/**
 * Sets up click handlers for all biz resume divs
 */
export function setupEventListeners() {
    const bizResumeDivs = document.querySelectorAll('.biz-resume-div');
    
    console.log(`bizResumeDivModule: Setting up event listeners for ${bizResumeDivs.length} biz resume divs`);
    
    bizResumeDivs.forEach(div => {
        // Remove any existing handlers to avoid duplicates
        div.removeEventListener('click', bizResumeClickHandler);
        div.removeEventListener('mouseenter', bizResumeMouseEnterHandler);
        div.removeEventListener('mouseleave', bizResumeMouseLeaveHandler);
        
        // Add click handler
        div.addEventListener('click', bizResumeClickHandler);
        
        // Add hover handlers
        div.addEventListener('mouseenter', bizResumeMouseEnterHandler);
        div.addEventListener('mouseleave', bizResumeMouseLeaveHandler);
        
        // Add data attributes to confirm handlers were attached
        div.setAttribute('data-has-click-handler', 'true');
        div.setAttribute('data-has-hover-handlers', 'true');
        
        console.log(`bizResumeDivModule: Added event handlers to ${div.id}`);
    });
    
    console.log(`bizResumeDivModule: Set up event handlers for ${bizResumeDivs.length} biz resume divs`);
    
    // Also set up event listeners for all biz card divs
    import('./bizCardDivModule.mjs').then(module => {
        module.setupEventListeners();
    }).catch(error => {
        console.error("Error importing bizCardDivModule:", error);
    });
}

// Event handler functions
function bizResumeClickHandler(event) {
    console.log(`bizResumeDivModule: Click detected on ${event.currentTarget.id}`);
    handleClickEvent(event.currentTarget);
}

function bizResumeMouseEnterHandler(event) {
    console.log(`bizResumeDivModule: Mouse enter detected on ${event.currentTarget.id}`);
    handleMouseEnterEvent(event.currentTarget);
}

function bizResumeMouseLeaveHandler(event) {
    console.log(`bizResumeDivModule: Mouse leave detected on ${event.currentTarget.id}`);
    handleMouseLeaveEvent(event.currentTarget);
}

// Add a debug click handler to the document
export function setupDebugClickHandler() {
    document.addEventListener('click', function(event) {
        const target = event.target;
        const bizResumeDiv = target.closest('.biz-resume-div');
        
        if (bizResumeDiv) {
            console.log('Debug: Click detected on element:', target);
            console.log('Debug: Closest bizResumeDiv:', bizResumeDiv.id);
            console.log('Debug: Target pointer-events:', getComputedStyle(target).pointerEvents);
            console.log('Debug: BizResumeDiv pointer-events:', getComputedStyle(bizResumeDiv).pointerEvents);
            
            // Check if the click handler is attached
            const hasClickHandler = bizResumeDiv.getAttribute('data-has-click-handler');
            console.log('Debug: Has click handler attribute:', hasClickHandler);
            
            // Force handle the click event
            console.log('Debug: Forcing handleClickEvent...');
            handleClickEvent(bizResumeDiv);
        }
    });
    
    console.log('Set up debug click handler for diagnosing bizResumeDiv clicks');
}

// Add a simple diagnostic function
export function checkClickability() {
    console.log("Checking clickability of bizResumeDivs...");
    
    // Get all bizResumeDivs
    const bizResumeDivs = document.querySelectorAll('.biz-resume-div');
    console.log(`Found ${bizResumeDivs.length} bizResumeDivs`);
    
    if (bizResumeDivs.length === 0) {
        console.warn("No bizResumeDivs found!");
        return;
    }
    
    // Check the first bizResumeDiv
    const firstDiv = bizResumeDivs[0];
    console.log(`Checking first bizResumeDiv: ${firstDiv.id}`);
    
    // Check computed styles
    const style = getComputedStyle(firstDiv);
    console.log(`- pointer-events: ${style.pointerEvents}`);
    console.log(`- position: ${style.position}`);
    console.log(`- z-index: ${style.zIndex}`);
    console.log(`- display: ${style.display}`);
    console.log(`- visibility: ${style.visibility}`);
    console.log(`- opacity: ${style.opacity}`);
    
    // Check if it has the click handler
    const hasClickHandler = firstDiv.onclick || firstDiv._clickHandler;
    console.log(`- Has click handler: ${!!hasClickHandler}`);
    
    // Check its children
    const detailsDiv = firstDiv.querySelector('.biz-resume-details-div');
    if (detailsDiv) {
        const detailsStyle = getComputedStyle(detailsDiv);
        console.log(`Details div found: ${detailsDiv.className}`);
        console.log(`- pointer-events: ${detailsStyle.pointerEvents}`);
        console.log(`- position: ${detailsStyle.position}`);
        console.log(`- z-index: ${detailsStyle.zIndex}`);
    } else {
        console.warn("No details div found!");
    }
    
    // Add a temporary click handler for testing
    const oldHandler = firstDiv._tempHandler;
    if (oldHandler) {
        firstDiv.removeEventListener('click', oldHandler);
    }
    
    const tempHandler = (e) => {
        console.log(`TEST CLICK on ${firstDiv.id}`);
        console.log(`- Target: ${e.target.tagName} ${e.target.className}`);
        console.log(`- Current target: ${e.currentTarget.tagName} ${e.currentTarget.className}`);
        e.stopPropagation();
    };
    
    firstDiv._tempHandler = tempHandler;
    firstDiv.addEventListener('click', tempHandler);
    console.log("Added temporary test click handler to first bizResumeDiv");
    
    console.log("Click check complete. Try clicking the first bizResumeDiv now.");
}

// Check if the scene container exists and is scrollable
export function checkSceneContainer() {
    console.log("Checking scene container...");
    
    const sceneContainer = document.getElementById('scene-container');
    if (sceneContainer) {
        console.log("Scene container found");
        console.log("- offsetHeight:", sceneContainer.offsetHeight);
        console.log("- scrollHeight:", sceneContainer.scrollHeight);
        console.log("- clientHeight:", sceneContainer.clientHeight);
        console.log("- scrollTop:", sceneContainer.scrollTop);
        console.log("- style.overflow:", getComputedStyle(sceneContainer).overflow);
        console.log("- style.position:", getComputedStyle(sceneContainer).position);
        
        // Check if it's scrollable
        const isScrollable = sceneContainer.scrollHeight > sceneContainer.clientHeight;
        console.log("- Is scrollable:", isScrollable);
        
        // Try scrolling to a specific position
        const originalScrollTop = sceneContainer.scrollTop;
        const testScrollTop = Math.min(sceneContainer.scrollHeight - sceneContainer.clientHeight, 100);
        
        console.log(`- Testing scroll to ${testScrollTop}px...`);
        sceneContainer.scrollTo({
            top: testScrollTop,
            behavior: 'auto'
        });
        
        // Check if the scroll position changed
        setTimeout(() => {
            console.log(`- New scrollTop: ${sceneContainer.scrollTop}`);
            console.log(`- Scroll test ${sceneContainer.scrollTop === testScrollTop ? 'succeeded' : 'failed'}`);
            
            // Restore original scroll position
            sceneContainer.scrollTo({
                top: originalScrollTop,
                behavior: 'auto'
            });
        }, 100);
        
        // List all bizCardDivs in the scene container
        const bizCardDivs = sceneContainer.querySelectorAll('.biz-card-div');
        console.log(`- Contains ${bizCardDivs.length} bizCardDivs`);
        
        if (bizCardDivs.length > 0) {
            const firstBizCardDiv = bizCardDivs[0];
            console.log(`- First bizCardDiv: ${firstBizCardDiv.id}`);
            console.log(`- First bizCardDiv offsetTop: ${firstBizCardDiv.offsetTop}`);
            console.log(`- First bizCardDiv style.position: ${getComputedStyle(firstBizCardDiv).position}`);
        }
    } else {
        console.error("Scene container not found");
    }
}

// Make diagnostic functions available globally
export function exposeGlobalDiagnostics() {
    window.bizResumeDivCheck = {
        checkClickability: checkClickability,
        checkPairing: checkPairing,
        checkSceneContainer: checkSceneContainer
    };
    console.log("Global diagnostic functions exposed as window.bizResumeDivCheck");
    console.log("Usage: window.bizResumeDivCheck.checkClickability()");
    console.log("Usage: window.bizResumeDivCheck.checkPairing()");
    console.log("Usage: window.bizResumeDivCheck.checkSceneContainer()");
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
    
    console.log(`Attempting to scroll bizCardDiv ${bizCardDiv.id} into view`);
    
    // Try multiple scrolling approaches
    
    // Approach 1: Use the scene container directly
    const sceneContainer = document.getElementById('scene-container');
    if (sceneContainer) {
        console.log("Using scene container for scrolling");
        
        // Get the position of the bizCardDiv relative to the scene
        const bizCardRect = bizCardDiv.getBoundingClientRect();
        const sceneRect = sceneContainer.getBoundingClientRect();
        
        // Calculate the scroll position needed to center the bizCardDiv
        const relativeTop = bizCardDiv.offsetTop;
        const scrollTop = relativeTop - (sceneContainer.clientHeight / 2) + (bizCardDiv.clientHeight / 2);
        
        console.log(`bizCardDiv offsetTop: ${relativeTop}`);
        console.log(`Calculated scrollTop: ${scrollTop}`);
        
        // Scroll the scene container
        sceneContainer.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
        });
        
        console.log(`Scrolled scene container to ${scrollTop}px`);
        
        // Set a timeout to check if scrolling worked
        setTimeout(() => {
            console.log(`Current scene container scrollTop: ${sceneContainer.scrollTop}`);
            const newBizCardRect = bizCardDiv.getBoundingClientRect();
            console.log(`bizCardDiv position after scroll: top=${newBizCardRect.top}, bottom=${newBizCardRect.bottom}`);
            
            // If the bizCardDiv is not visible, try approach 2
            const isVisible = (newBizCardRect.top >= sceneRect.top && newBizCardRect.bottom <= sceneRect.bottom);
            console.log(`bizCardDiv is ${isVisible ? 'visible' : 'not visible'} in viewport`);
            
            if (!isVisible) {
                console.log("Trying fallback scrolling approach");
                // Approach 2: Use scrollIntoView
                bizCardDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 500);
    } else {
        console.log("Scene container not found, using standard scrollIntoView");
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
    
    console.log(`bizResumeDivModule: Mouse enter on ${element.id}`);
    
    // Always apply hover state regardless of focal point state
    if (!element.classList.contains("selected")) {
        element.classList.add("hovered");
        
        // Find and hover the paired card div
        const pairedId = element.getAttribute('data-paired-id');
        if (pairedId) {
            const bizCardDiv = document.getElementById(pairedId);
            if (bizCardDiv && !bizCardDiv.classList.contains("selected")) {
                bizCardDiv.classList.add("hovered");
                console.log(`bizResumeDivModule: Added hover to paired bizCardDiv ${pairedId}`);
            }
        }
        
        console.log(`bizResumeDivModule: Element ${element.id} hovered`);
    } else {
        console.log(`bizResumeDivModule: Element ${element.id} not hovered (already selected)`);
    }
}

// Enhanced mouse leave handler for bizResumeDivs
export function handleMouseLeaveEvent(element) {
    if (!element) return;
    
    console.log(`bizResumeDivModule: Mouse leave on ${element.id}`);
    
    // Always remove hover state regardless of focal point state
    if (!element.classList.contains("selected")) {
        element.classList.remove("hovered");
        
        // Find and unhover the paired card div
        const pairedId = element.getAttribute('data-paired-id');
        if (pairedId) {
            const bizCardDiv = document.getElementById(pairedId);
            if (bizCardDiv && !bizCardDiv.classList.contains("selected")) {
                bizCardDiv.classList.remove("hovered");
                console.log(`bizResumeDivModule: Removed hover from paired bizCardDiv ${pairedId}`);
            }
        }
        
        console.log(`bizResumeDivModule: Element ${element.id} unhovered`);
    } else {
        console.log(`bizResumeDivModule: Element ${element.id} not unhovered (selected)`);
    }
}
