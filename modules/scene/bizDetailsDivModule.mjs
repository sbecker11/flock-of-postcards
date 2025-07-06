// scene/bizDetailsDivModule.mjs

// BizDetailsDiv is the div that contains the details of the job
// and will be added to the bizCard and will be added to the
// BizResumeDiv which will be added to the resume-content-div.
// BizDetailsDivs do not add themselves to a bizCardDiv or 
// a bizResumeDiv.

import * as utils from '../utils/utils.mjs';
import { formatDateRange } from '../utils/dateUtils.mjs';
import { BULLET } from '../constants/ui.mjs';

/**
 * Creates a business resume details div
 * @param {HTMLElement} bizResumeDiv - The business resume div
 * @param {HTMLElement} bizCardDiv - The business card div
 * @returns {HTMLElement} The created business resume details div
 */
export function createBizResumeDetailsDiv(bizResumeDiv, bizCardDiv) {
    if (!bizResumeDiv) throw new Error('createBizResumeDetailsDiv: given null bizResumeDiv');
    if (!bizCardDiv) throw new Error('createBizResumeDetailsDiv: given null bizCardDiv');
    
    const colorIndex = bizResumeDiv.getAttribute('data-color-index');
    if (!utils.isNumericString(colorIndex)) throw new Error('createBizResumeDetailsDiv: given non-numeric colorIndex string');
    
    const bizResumeDetailsDiv = document.createElement('div');
    const jobNumber = bizResumeDiv.getAttribute('data-job-number');
    if (!utils.isNumericString(jobNumber)) throw new Error('createBizResumeDetailsDiv: given non-numeric attriubute string jobNumber');
    bizResumeDetailsDiv.classList.add('biz-resume-details-div');
    bizResumeDetailsDiv.id = `biz-resume-details-div-${jobNumber}`;

    // Set pointer-events to none so clicks pass through to the parent bizResumeDiv
    bizResumeDetailsDiv.style.pointerEvents = 'none';
    bizResumeDetailsDiv.style.backgroundColor = 'transparent';

    const bizCardDetailsDiv = bizCardDiv.querySelector('.biz-card-details-div');
    if (!bizCardDetailsDiv) throw new Error('createBizResumeDetailsDiv: given null bizCardDetailsDiv');
    bizResumeDetailsDiv.innerHTML = bizCardDetailsDiv.innerHTML;

    // Remove the original Z-value element from the resume div clone
    const zValueElement = bizResumeDetailsDiv.querySelector('.biz-details-z-value');
    if (zValueElement) {
        zValueElement.remove();
    }
    
    // Add the resume div's own z-value element right after the dates
    const resumeSceneZ = bizCardDiv.getAttribute('data-sceneZ') || 'N/A';
    const resumeJobNumber = bizResumeDiv.getAttribute('data-job-number');
    const resumeZValueElement = document.createElement('p');
    resumeZValueElement.className = 'biz-details-z-value header-text';
    resumeZValueElement.textContent = `(z: ${resumeSceneZ}, #: ${resumeJobNumber})`;
    
    // Insert the z-value element right after the dates element
    const datesElement = bizResumeDetailsDiv.querySelector('.biz-details-dates');
    if (datesElement) {
        datesElement.insertAdjacentElement('afterend', resumeZValueElement);
    } else {
        // Fallback: append to the end if dates element not found
        bizResumeDetailsDiv.appendChild(resumeZValueElement);
    }
    
    return bizResumeDetailsDiv;
}

export function createBizCardDetailsDiv(bizCardDiv, job) {
    if (!bizCardDiv) throw new Error('createBizDetailsDiv: given null bizCardDiv');
    if (!job) throw new Error('createBizDetailsDiv: given null job');
    window.CONSOLE_LOG_IGNORE("createBizDetailsDiv: job:", job);
    const bizCardDetailsDiv = document.createElement('div');
    const jobNumber = bizCardDiv.getAttribute('data-job-number');
    if (!utils.isNumericString(jobNumber)) throw new Error(' createBizCardDetailsDiv: given non-numeric jobNumber attribute string');
    bizCardDetailsDiv.classList.add('biz-card-details-div');
    bizCardDetailsDiv.id = `biz-card-details-div-${jobNumber}`;
    bizCardDetailsDiv.style.backgroundColor = 'transparent';

    // see createBizDetailsDiv::34  colorIndex format <number>
    let colorIndex = bizCardDiv.getAttribute('data-color-index');
    
    if (!utils.isNumericString(colorIndex)) {
        throw new Error('createBizDetailsDiv: given non-numeric colorIndex');
    }
    
    bizCardDetailsDiv.setAttribute("data-color-index", colorIndex);
    bizCardDetailsDiv.classList.add('color-index-foreground-only');

    const employer = job.employer || 'Unknown Employer';
    const role = job.role || 'Unknown Role';
    const start = job.start || '1970-01-01';
    const end = job.end || '1970-02-01';
    const dates = formatDateRange(start, end);
    const sceneZ = bizCardDiv.getAttribute('data-sceneZ') || 'N/A';
    const description = job.Description  || 'No description provided';
    const descriptions = description ? description.split(BULLET).filter(d => d.trim()) : [];
    const jobSkills = job['job-skills'] || {};   
    const skills = (jobSkills && typeof jobSkills === 'object' && !Array.isArray(jobSkills))
    ? Object.values(jobSkills) || []
    : [];

    bizCardDetailsDiv.innerHTML = 
    `
    <h2 class="biz-details-employer header-text">${employer}</h2>
    <h3 class="biz-details-role header-text">${role}</h3>
    <p class="biz-details-dates header-text">${dates}</p>
    <p class="biz-details-z-value header-text">(z: ${sceneZ}, #: ${jobNumber})</p>

    <div class="job-description-items-container">
        ${descriptions.map(item => `<p class="job-description-item">&bull;&nbsp;${item.trim()}</p>`).join('')}
    </div>

    <p class="biz-details-skills">
        ${skills
            .map(skill => skill.trim()) // Remove whitespace around skills
            .filter(skill => skill)     // Remove empty skills
            .join(' &bull; ')}
    </p>
    <div class="scroll-caret">▼</div>
    `; 

    return bizCardDetailsDiv;
}


