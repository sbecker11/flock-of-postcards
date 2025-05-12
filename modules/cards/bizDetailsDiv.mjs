import * as cardUtils from './cardUtils.mjs';

// BizDetailsDiv is the div that contains the details of the job
// and will be added to the bizCard and will be added to the
// BizResumeDiv which will be added to the right-content-div.
// BizDetailsDivs do not add themselves to a bizCardDiv or 
// a bizResumeDiv.
class BizDetailsDiv {
    constructor(bizCardDiv) {
        this.element = document.createElement('div');
        this.element.classList.add('bizCard-details-div');
        this.bizCardDiv = bizCardDiv;
        this.BULLET = "•";
        this.job = bizCardDiv.job;

        this.innerHTML = 
        `
        <h2>${this.job.employer}</h2>
        <h3>${this.job.role}</h3>
        <p class="date-range">${cardUtils.formatDateRange(this.job.start, this.job.end)}</p>
        <ul class="bulleted-job-description-items-ul">
            ${this.job.Description.split(this.BULLET).map(item => `<li class="bulleted-job-description-items-li">${item}</li>`).join('')}
        </ul>
        <ul class="bulleted-job-skills-ul">
            ${this.job.skills ? this.job.skills.map(skill => `<li class="bulleted-job-skills-li">${skill}</li>`).join('') : ''}
        </ul>
        `; 

        for (const element of this.element.children) {
            element.style.color = this.bizCardDiv.style.color;
        }
    }
}

export default BizDetailsDiv;