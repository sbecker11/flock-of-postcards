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
    if ( !bizCardDiv ) throw new Error('createBizResumeDiv: given null bizCardDiv');
    const bizResumeDiv = document.createElement("div");
    bizResumeDiv.classList.add("biz-resume-div");
    bizResumeDiv.classList.add("resume-content-div-child"); // Add the required class for proper styling
    bizResumeDiv.id = createBizResumeDivId(bizCardDiv.id);
    const jobIndex = bizCardDiv.getAttribute('data-job-index');
    if ( !utils.isNumericString(jobIndex)) throw new Error('createBizResumeDiv: given non-numeric attribute jobIndex');
    bizResumeDiv.setAttribute('data-job-index', jobIndex);

    // Apply the same color palette as the biz card
    const colorIndex = bizCardDiv.getAttribute('data-color-index');
    if ( !colorPalettes.isColorIndexString(colorIndex) ) throw new Error('createBizResumeDiv: given non-colorIndexString colorIndex');
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
    if (!element) return;
    
    // If the element is already selected, unselect it
    if (element.classList.contains(bizCardDivModule.ELEMENT_STATE.SELECTED)) {
        console.log(`bizResumeDivModule: Unselecting element ${element.id}`);
        bizCardDivModule.clearSelected();
        return;
    }

    // Otherwise, select the element
    console.log(`bizResumeDivModule: Selecting element ${element.id}`);
    selectBizResumeDiv(element);
}

// Select a biz resume div and its paired card div
export function selectBizResumeDiv(bizResumeDiv) {
    if (!bizResumeDiv) return;
    
    // Clear any existing selection
    bizCardDivModule.clearSelected();
    
    // Set as selected
    bizResumeDiv.classList.add(bizCardDivModule.ELEMENT_STATE.SELECTED);
    
    // Find the corresponding biz card div
    const pairedId = bizResumeDiv.getAttribute('data-paired-id');
    if (pairedId) {
        const bizCardDiv = document.getElementById(pairedId);
        if (bizCardDiv) {
            bizCardDiv.classList.add(bizCardDivModule.ELEMENT_STATE.SELECTED);
            
            // Store the original Z-based filter for later restoration
            const sceneZ = parseFloat(bizCardDiv.getAttribute('data-sceneZ'));
            if (isNaN(sceneZ)) {
                console.error(`ERROR: No Z value found for ${bizCardDiv.id}. This is a critical error.`);
                // Set a red error filter to make the problem visible
                bizCardDiv.style.filter = "sepia(1) hue-rotate(300deg) saturate(3)";
                // Try to repair by setting a default Z value
                const defaultZ = zUtils.ALL_CARDS_Z_MIN;
                bizCardDiv.setAttribute('data-sceneZ', defaultZ);
                console.warn(`Attempted repair by setting default Z=${defaultZ} for ${bizCardDiv.id}`);
                // Store this as the original filter
                bizCardDiv.setAttribute('data-original-filter', filters.get_filterStr_from_z(defaultZ));
            } else {
                // Store the original filter in a data attribute
                const originalFilter = filters.get_filterStr_from_z(sceneZ);
                bizCardDiv.setAttribute('data-original-filter', originalFilter);
                console.log(`Stored original filter for ${bizCardDiv.id}: ${originalFilter}`);
            }
            
            // Apply the brightness filter for selected state
            bizCardDiv.style.filter = "brightness(1.5)";
            
            // Scroll the biz card div into view
            bizCardDivModule.scrollBizCardDivIntoView(bizCardDiv);
            console.log(`Scrolled card div ${bizCardDiv.id} into view from resume selection`);
        }
    }
}

/**
 * Sets up click handlers for all biz resume divs
 */
export function setupClickHandlers() {
    const bizResumeDivs = document.querySelectorAll('.biz-resume-div');
    console.log(`Found ${bizResumeDivs.length} biz resume divs for click handlers`);
    
    if (bizResumeDivs.length === 0) {
        console.warn("No bizResumeDivs found! Check if they've been created yet.");
        
        // Try to find the resume container
        const resumeContainer = document.getElementById('resume-container');
        if (resumeContainer) {
            console.log("Resume container found, but no bizResumeDivs inside it.");
            console.log("Resume container contents:", resumeContainer.innerHTML.substring(0, 200) + "...");
        } else {
            console.warn("Resume container not found!");
        }
        
        return;
    }
    
    bizResumeDivs.forEach(div => {
        // Remove any existing click handlers to avoid duplicates
        div.removeEventListener('click', bizResumeClickHandler);
        
        // Add click handler
        div.addEventListener('click', bizResumeClickHandler);
        
        // Add a data attribute to confirm handler was attached
        div.setAttribute('data-has-click-handler', 'true');
        
        console.log(`Added click handler to ${div.id}`);
    });
    
    // Add a test click handler to the document body for debugging
    document.body.addEventListener('click', function(event) {
        const target = event.target.closest('.biz-resume-div');
        if (target) {
            console.log(`Click detected on ${target.id} via document body handler`);
        }
    });
    
    console.log(`Set up click handlers for ${bizResumeDivs.length} biz resume divs`);
}

// Event handler function
function bizResumeClickHandler(event) {
    console.log("bizResumeClickHandler called for", event.currentTarget.id);
    event.stopPropagation(); // Prevent event from bubbling
    handleClickEvent(event.currentTarget);
}
