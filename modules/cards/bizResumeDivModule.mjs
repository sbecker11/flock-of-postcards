import * as BizDetailsDiv from './bizDetailsDivModule.mjs';
import { applyCurrentPaletteToElements } from '../color_palettes.mjs';

// BizResumeDiv is the div that contains the resume of the job
// and will be added to the resume-content-div. 
export function createBizResumeDiv(bizCardDiv) {
    const bizResumeDiv = document.createElement('div');
    bizResumeDiv.classList.add('biz-resume-div');
    bizResumeDiv.classList.add('card-div');
    bizResumeDiv.classList.add('resume-div');
    bizResumeDiv.bizCardDivId = bizCardDiv.id;
    
    // Add the job index for hover sync
    bizResumeDiv.setAttribute('sort-key-job-index', bizCardDiv.getAttribute('sort-key-job-index'));
    
    const bizDetailsDiv = BizDetailsDiv.createBizDetailsDiv(bizCardDiv);
    bizResumeDiv.appendChild(bizDetailsDiv);
    bizResumeDiv.setAttribute('data-color-index', bizCardDiv.getAttribute('data-color-index'));
    bizResumeDiv.style.color = bizCardDiv.style.color;
    // element's data-color-index to assign target
    //  element.style.backgroundColor and element.style.color
    applyCurrentPaletteToElements([bizResumeDiv]);

    // Add click handler
    bizResumeDiv.addEventListener("click", (event) => {
        try {
            handleBizResumeDivClick(event, bizResumeDiv);
        } catch (error) {
            console.error("Error handling resume card click:", error);
        }
    });
    
    return bizResumeDiv;
}

/**
 * Handles click events on resume divs
 * @param {HTMLElement} bizResumeDiv - The clicked business card div
 * @param {Event} event - The click event
 */
export function handleBizResumeDivClick(event, bizResumeDiv) {
    if (!bizResumeDiv) {
        throw new Error(`bizResumeDiv not found`);
    }
    if (!bizResumeDiv.classList.contains('biz-resume-div')) {
        throw new Error(`bizResumeDiv is not a biz-resume-div`);
    }

    // Remove selected class from all resume divs
    // bizResumeDivs and skillResumeDivs
    for (const resumeDiv of document.querySelectorAll('.resume-div')) {
        resumeDiv.classList.remove('selected');
    }
    
    // Add selected class to clicked biz resume div
    bizResumeDiv.classList.add('selected');

    // Find and select the corresponding bizCardDiv
    const bizCardDiv = document.getElementById(bizResumeDiv.bizCardDivId);
    if (bizCardDiv) {
        // Remove selected class from all card divs
        document.querySelectorAll('.card-div').forEach(card => {
            card.classList.remove('selected');
        });
        // Select the corresponding card
        bizCardDiv.classList.add('selected');
    }

    // Scroll resume into view
    bizResumeDiv.scrollIntoView({ behavior: 'smooth' });
}

// addBizResumeDiv adds a biz resume div to the right content div
// and returns the biz resume div
export function addBizResumeDiv(rightContentDiv, bizCardDiv) {
    const newBizResumeDiv = createBizResumeDiv(bizCardDiv);
    rightContentDiv.appendChild(newBizResumeDiv); 
    return newBizResumeDiv;
}

// findBizResumeDiv finds a biz resume div by biz card div id
// and returns the biz resume div or null if not found
export function findBizResumeDiv(rightContentDiv, bizCardDiv) {
    const bizResumeDivs = rightContentDiv.querySelectorAll('.biz-resume-div');
    console.log(`#bizResumeDiv: ${bizResumeDivs.length} in rightContentDiv: ${rightContentDiv.id}`);
    for (const resumeDiv of bizResumeDivs) {
        if (resumeDiv.bizCardDivId === bizCardDiv.id) {
            console.log(`bizResumeDiv for ${bizCardDiv.id} found`);
            return resumeDiv;
        }
    }
    console.log(`bizResumeDiv for ${bizCardDiv.id} not found`);
    return null;
}


