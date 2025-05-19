// cards/bizResumeDivModule.mjs

import * as BizDetailsDiv from './bizDetailsDivModule.mjs';
import { applyCurrentPaletteToElements } from '../color_palettes.mjs';
import * as cardUtils from './cardUtils.mjs';
import * as divSyncModule from './divSyncModule.mjs';

// BizResumeDiv is the div that contains the resume of the job
// and will be added to the resume-content-div. 
export function createBizResumeDiv(bizCardDiv) {
    const bizResumeDiv = document.createElement("div");
    bizResumeDiv.classList.add("biz-resume-div");
    bizResumeDiv.id = cardUtils.getBizResumeDivId(bizCardDiv.jobIndex);
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

    // Add click handler for selection
    divSyncModule.handleClickEvent(event, bizResumeDiv);

    // Create and append the resume details div
    const resumeDetailsDiv = BizDetailsDiv.createBizDetailsDiv(bizCardDiv);
    bizResumeDiv.appendChild(resumeDetailsDiv);
    bizResumeDiv.resumeDetailsDiv = resumeDetailsDiv;

    // Apply the same color palette as the biz card
    bizResumeDiv.setAttribute('data-color-index', bizCardDiv.getAttribute('data-color-index'));
    applyCurrentPaletteToElements([bizResumeDiv]);

    // will be apppended to the resume-content-div
    return bizResumeDiv;
}