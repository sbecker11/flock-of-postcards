// cards/bizResumeDivModule.mjs

import * as BizDetailsDiv from './bizDetailsDivModule.mjs'
import * as colorPalettes from '../color/colorPalettes.mjs';


// BizResumeDiv is the div that contains the resume of the job
// each instance will apppend itself to the resume-content-div. 
export function createBizResumeDiv(bizCardDiv) {
    const bizResumeDiv = document.createElement("div");
    bizResumeDiv.classList.add("biz-resume-div");
    bizResumeDiv.id = createBizResumeDivId(bizCardDiv.id);
    bizResumeDiv.job = bizCardDiv.job;
    bizResumeDiv.jobIndex = bizCardDiv.jobIndex;
    bizResumeDiv.setAttribute('sort-key-start', bizCardDiv.job.start);
    bizResumeDiv.setAttribute('sort-key-end', bizCardDiv.job.end);
    bizResumeDiv.setAttribute('sort-key-employer', bizCardDiv.job.employer);
    bizResumeDiv.setAttribute('sort-key-title', bizCardDiv.job.title);
    bizResumeDiv.setAttribute('sort-key-job-index', bizCardDiv.jobIndex);

    bizResumeDiv.pairedElement = bizCardDiv;
    bizCardDiv.pairedElement = bizResumeDiv;

    if (!bizResumeDiv.pairedElement) {
        throw new Error(`bizResumeDiv.pairedElement not found for ${bizResumeDiv.id}`);
    }
    if (!bizCardDiv.pairedElement) {
        throw new Error(`bizCardDiv.pairedElement not found for ${bizCardDiv.id}`);
    }

    // Create and append the new resume details div
    const divDetailsDiv = BizDetailsDiv.createBizDetailsDiv(bizCardDiv);
    bizResumeDiv.appendChild(divDetailsDiv);
    bizResumeDiv.divDetailsDiv = divDetailsDiv;

    // Apply the same color palette as the biz card
    bizResumeDiv.setAttribute('data-color-index', bizCardDiv.getAttribute('data-color-index'));

    const resumeContentDiv= document.getElementById("resume-content-div");   
    resumeContentDiv.appendChild(bizResumeDiv);

    // will be appended to the resume-content-div
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
