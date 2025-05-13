import * as BizDetailsDiv from './bizDetailsDivModule.mjs';

// BizResumeDiv is the div that contains the resume of the job
// and will be added to the right-content-div. 
export function createBizResumeDiv(bizCardDiv) {
    const bizResumeDiv = document.createElement('div');
    bizResumeDiv.classList.add('biz-resume-div');
    bizResumeDiv.classList.add('card-div');
    bizResumeDiv.classList.add('resume-div');
    bizResumeDiv.bizCardDiv = bizCardDiv;
    bizResumeDiv.bizCardDivId = bizCardDiv.id;
    const bizCardDetailsDiv = BizDetailsDiv.createBizDetailsDiv(bizCardDiv);
    bizResumeDiv.appendChild(bizCardDetailsDiv);
    bizResumeDiv.setAttribute('data-color-index', bizCardDiv.getAttribute('data-color-index'));
    bizResumeDiv.style.color = bizCardDiv.style.color;
    return bizResumeDiv;
}

// addBizResumeDiv adds a biz resume div to the right content div
// and returns the biz resume div
export function addBizResumeDiv(rightContentDiv, bizCardDiv) {
    const bizResumeDiv = createBizResumeDiv(bizCardDiv);
    rightContentDiv.appendChild(bizResumeDiv); 
    return bizResumeDiv;
}

// findBizResumeDiv finds a biz resume div by biz card div id
// and returns the biz resume div or null if not found
export function findBizResumeDiv(rightContentDiv, bizCardDiv) {
    const bizResumeDivs = rightContentDiv.querySelectorAll('.biz-resume-div');
    console.log(`#bizResumeDiv: ${bizResumeDivs.length} in rightContentDiv: ${rightContentDiv.id}`);
    for (const bizResumeDiv of bizResumeDivs) {
        if (  bizResumeDiv.bizCardDivId === bizCardDiv.id  ) {
            console.log(`bizResumeDiv for ${bizCardDiv.id} found`);
            return bizResumeDiv;
        }
    }
    console.log(`bizResumeDiv for ${bizCardDiv.id} not found`);
    return null;
}


