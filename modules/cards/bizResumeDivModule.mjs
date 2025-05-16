import * as BizDetailsDiv from './bizDetailsDivModule.mjs';
import { applyCurrentPaletteToElements } from '../color_palettes.mjs';
import * as cardUtils from './cardUtils.mjs';

// BizResumeDiv is the div that contains the resume of the job
// and will be added to the resume-content-div. 
export function createBizResumeDiv(bizCardDiv) {
    const bizResumeDiv = document.createElement("div");
    bizResumeDiv.classList.add("biz-resume-div");
    bizResumeDiv.classList.add("resume-div");
    bizResumeDiv.id = cardUtils.getBizResumeDivId(bizCardDiv.jobIndex);
    bizResumeDiv.job = bizCardDiv.job;
    bizResumeDiv.jobIndex = bizCardDiv.jobIndex;
    bizResumeDiv.setAttribute('sort-key-start', bizCardDiv.job.start);
    bizResumeDiv.setAttribute('sort-key-end', bizCardDiv.job.end);
    bizResumeDiv.setAttribute('sort-key-employer', bizCardDiv.job.employer);
    bizResumeDiv.setAttribute('sort-key-title', bizCardDiv.job.title);
    bizResumeDiv.setAttribute('sort-key-job-index', bizCardDiv.jobIndex);

    // Add click handler for selection
    bizResumeDiv.addEventListener("click", (event) => {
        try {
            handleBizResumeDivClick(event, bizResumeDiv);
        } catch (error) {
            console.error("Error handling biz resume click:", error);
        }
    });

    // Create and append the resume details div
    const resumeDetailsDiv = BizDetailsDiv.createBizDetailsDiv(bizCardDiv);
    bizResumeDiv.appendChild(resumeDetailsDiv);

    // Apply the same color palette as the biz card
    bizResumeDiv.setAttribute('data-color-index', bizCardDiv.getAttribute('data-color-index'));
    applyCurrentPaletteToElements([bizResumeDiv]);

    return bizResumeDiv;
}

function handleBizResumeDivClick(event, bizResumeDiv) {
    if (!bizResumeDiv) {
        throw new Error(`bizResumeDiv not found`);
    }
    if (!bizResumeDiv.classList.contains('biz-resume-div')) {
        throw new Error(`bizResumeDiv is not a biz-resume-div`);
    }

    // Find the corresponding biz card div
    const jobIndex = bizResumeDiv.getAttribute('sort-key-job-index');
    const bizCardDiv = document.querySelector(`.biz-card-div[sort-key-job-index="${jobIndex}"]`);
    if (!bizCardDiv) {
        throw new Error(`bizCardDiv for ${bizResumeDiv.id} not found`);
    }

    // Remove selected class from all cards and resumes
    document.querySelectorAll('.biz-card-div.selected').forEach(div => div.classList.remove('selected'));
    document.querySelectorAll('.biz-resume-div.selected').forEach(div => div.classList.remove('selected'));

    // Select both the biz resume card and the biz card
    bizResumeDiv.classList.add('selected');
    bizCardDiv.classList.add('selected');

    // Scroll both into view
    bizResumeDiv.scrollIntoView({ behavior: 'smooth' });
    bizCardDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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


