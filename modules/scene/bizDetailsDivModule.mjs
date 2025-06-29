// scene/bizDetailsDivModule.mjs

// BizDetailsDiv is the div that contains the details of the job
// and will be added to the bizCard and will be added to the
// BizResumeDiv which will be added to the resume-content-div.
// BizDetailsDivs do not add themselves to a bizCardDiv or 
// a bizResumeDiv.

import * as colorPalettes from '../colors/colorPalettes.mjs';
import * as utils from '../utils/utils.mjs';
import * as sceneContainer from './sceneContainer.mjs';
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
    if (!colorPalettes.isColorIndexString(colorIndex)) throw new Error('createBizResumeDetailsDiv: given non-colorIndexString colorIndex');
    
    const bizResumeDetailsDiv = document.createElement('div');
    const jobIndex = bizResumeDiv.getAttribute('data-job-index');
    if (!utils.isNumericString(jobIndex)) throw new Error('createBizResumeDetailsDiv: given non-numeric attriubute string jobIndex');
    bizResumeDetailsDiv.classList.add('biz-resume-details-div');
    bizResumeDetailsDiv.id = `biz-resume-details-div-${jobIndex}`;

    // Set pointer-events to none so clicks pass through to the parent bizResumeDiv
    bizResumeDetailsDiv.style.pointerEvents = 'none';

    const bizCardDetailsDiv = bizCardDiv.querySelector('.biz-card-details-div');
    if (!bizCardDetailsDiv) throw new Error('createBizResumeDetailsDiv: given null bizCardDetailsDiv');
    bizResumeDetailsDiv.innerHTML = bizCardDetailsDiv.innerHTML;

    // Remove the Z-value element from the resume div clone
    const zValueElement = bizResumeDetailsDiv.querySelector('.biz-details-z-value');
    if (zValueElement) {
        zValueElement.remove();
    }
    
    return bizResumeDetailsDiv;
}

export function createBizCardDetailsDiv(bizCardDiv, job) {
    if (!bizCardDiv) throw new Error('createBizDetailsDiv: given null bizCardDiv');
    if (!job) throw new Error('createBizDetailsDiv: given null job');
    // console.log("createBizDetailsDiv: job:", job);
    const bizCardDetailsDiv = document.createElement('div');
    const jobIndex = bizCardDiv.getAttribute('data-job-index');
    if (!utils.isNumericString(jobIndex)) throw new Error(' createBizCardDetailsDiv: given non-numeric jobIndex attribute string');
    bizCardDetailsDiv.classList.add('biz-card-details-div');
    bizCardDetailsDiv.id = `biz-card-details-div-${jobIndex}`;
    bizCardDetailsDiv.style.backgroundColor = 'transparent';

    // see createBizDetailsDiv::34  colorIndex format <number>
    let colorIndex = bizCardDiv.getAttribute('data-color-index');
    
    // Use utils.isNumeric as a fallback if colorPalettes.isColorIndexString is not available
    if (!colorPalettes.isColorIndexString && utils.isNumeric) {
        if (!utils.isNumericString(colorIndex)) {
            throw new Error('createBizDetailsDiv: given non-numeric colorIndex');
        }
    } else if (!colorPalettes.isColorIndexString(colorIndex)) {
        throw new Error('createBizDetailsDiv: given non-colorIndexString colorIndex');
    }
    
    bizCardDetailsDiv.setAttribute("data-color-index", colorIndex);
    bizCardDetailsDiv.classList.add('color-index-foreground-only');

    const employer = job.employer || 'Unknown Employer';
    const role = job.role || 'Unknown Role';
    const start = job.start || '1970-01-01';
    const end = job.end || '1970-02-01';
    const dates = sceneContainer.formatDateRange(start, end);
    const sceneZ = bizCardDiv.getAttribute('data-sceneZ') || 'N/A';
    const description = job.Description  || 'No description provided';
    const descriptions = description ? description.split(BULLET) : [];  
    const jobSkills = job['job-skills'] || {};   
    const skills = (jobSkills && typeof jobSkills === 'object' && !Array.isArray(jobSkills))
    ? Object.values(jobSkills) || []
    : [];

    bizCardDetailsDiv.innerHTML = 
    `
    <h2 class="biz-details-employer header-text">${employer}</h2>
    <h3 class="biz-details-role header-text">${role}</h3>
    <p class="biz-details-dates header-text">${dates}</p>
    <p class="biz-details-z-value header-text">(z: ${sceneZ}, id: ${jobIndex})</p>

    <ul>
        ${descriptions.map(item => `<li>${item}</li>`).join('')}
    </ul>
    <ul style="list-style-type: circle; margin-left: 20px;">
    ${skills
        .map(skill => skill.trim()) // Remove whitespace around skills
        .filter(skill => skill)     // Remove empty skills
        .map(skill => `<li>${skill}</li>`)
        .join('')}
    </ul>
    <div class="scroll-caret">▼</div>
    `; 

    return bizCardDetailsDiv;
}


