import BizDetailsDiv from './bizDetailsDiv.mjs';

// BizResumeDiv is the div that contains the resume of the job
// and will be added to the right-content-div. 
class BizResumeDiv {
    constructor(bizCardDiv) {
        this.bizCardDiv = bizCardDiv;
        this.element = document.createElement('div');
        this.element.classList.add('bizCard-resume-div');
        this.element.classList.add('card-div');
        this.element.classList.add('resume-card-div');
        const bizCardDetailsDiv = new BizDetailsDiv(this.bizCardDiv);
        this.element.appendChild(bizCardDetailsDiv.element);
    }
}

export function findBizResumeDiv(rightContentDiv, bizCardDiv) {
    const bizResumeDivs = rightContentDiv.querySelectorAll('.bizCard-resume-div');
    for (const bizResumeDiv of bizResumeDivs) {
        if (bizResumeDiv.bizCardDiv === bizCardDiv) {
            return bizResumeDiv;
        }
    }
}
export default BizResumeDiv;

