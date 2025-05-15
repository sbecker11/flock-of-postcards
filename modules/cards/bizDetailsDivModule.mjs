import * as cardUtils from './cardUtils.mjs';

// BizDetailsDiv is the div that contains the details of the job
// and will be added to the bizCard and will be added to the
// BizResumeDiv which will be added to the resume-content-div.
// BizDetailsDivs do not add themselves to a bizCardDiv or 
// a bizResumeDiv.

export function createBizDetailsDiv(bizCardDiv) {
    const bizDetailsDiv = document.createElement('div');
    bizDetailsDiv.classList.add('biz-details-div');
    bizDetailsDiv.bizCardDiv = bizCardDiv;
    bizDetailsDiv.bizCardDivId = bizCardDiv.id;
    bizDetailsDiv.BULLET = "•";
    const job = bizCardDiv.job;
    bizDetailsDiv.job = job;
    bizDetailsDiv.innerHTML = 
    `
    <h2 class="biz-details-employer header-text">${job.employer}</h2>
    <h3 class="biz-details-role header-text">${job.role}</h3>
    <p class="biz-defails-dates header-text">${cardUtils.formatDateRange(job.start, job.end)}</p>
    <ul class="bulleted-job-description-items-ul">
        ${job.Description.split(bizDetailsDiv.BULLET).map(item => `<li class="bulleted-job-description-items-li">${item}</li>`).join('')}
    </ul>
    <ul class="bulleted-job-skills-ul">
        ${job.skills ? bizDetailsDiv.job.skills.map(skill => `<li class="bulleted-job-skills-li">${skill}</li>`).join('') : ''}
    </ul>
    `; 

    const color = bizCardDiv.style.color;
    // console.log(`bizDetailsDiv: ${bizDetailsDiv.id} color: ${color} `);

    return bizDetailsDiv;
}


