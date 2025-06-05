// scene/bizDetailsDivModule.mjs

import { Logger, LogLevel } from '../logger.mjs';
const logger = new Logger("bizDetailsDivModule", LogLevel.INFO);

// BizDetailsDiv is the div that contains the details of the job
// and will be added to the bizCard and will be added to the
// BizResumeDiv which will be added to the resume-content-div.
// BizDetailsDivs do not add themselves to a bizCardDiv or 
// a bizResumeDiv.

import * as colorPalettes from '../color/colorPalettes.mjs';
import * as utils from '../utils/utils.mjs';
import * as sceneContainer from './sceneContainer.mjs';
import { BULLET } from '../constants/ui.mjs';

export function createBizResumeDetailsDiv(bizResumeDiv, bizCardDiv) {
    if ( !bizResumeDiv ) throw new Error('createBizResumeDetailsDiv: given null bizResumeDiv');
    if ( !bizCardDiv ) throw new Error('createBizResumeDetailsDiv: given null bizCardDiv');
    let colorIndex = bizResumeDiv.getAttribute('data-color-index');
    if ( !colorPalettes.isColorIndexString(colorIndex) ) throw new Error('createBizResumeDetailsDiv: given non-colorIndexString colorIndex from bizResumeDiv:', bizResumeDiv.id);

    const bizResumeDetailsDiv = document.createElement('div');
    const jobIndex = bizResumeDiv.getAttribute('data-job-index');
    if ( !utils.isNumeric(jobIndex) ) throw new Error('createBizResumeDetailsDiv: given non-numeric attriubute string jobIndex');
    bizResumeDetailsDiv.classList.add('biz-resume-details-div');
    bizResumeDetailsDiv.id = `biz-resume-details-div-${jobIndex}`;

    // see createBizDetailsDiv::34  colorIndex format <number>
    console.log("createBizResumeDetailsDiv: colorIndex:", colorIndex);
    bizResumeDetailsDiv.setAttribute("data-color-index", colorIndex);
    bizResumeDetailsDiv.classList.add('color-index-foreground-only');

    const bizCardDetailsDiv = bizCardDiv.querySelector('.biz-card-details-div');
    if ( !bizCardDetailsDiv ) throw new Error('createBizResumeDetailsDiv: given null bizCardDetailsDiv');
    bizResumeDetailsDiv.innerHTML = bizCardDetailsDiv.innerHTML;
    return bizResumeDetailsDiv;
}

export function createBizCardDetailsDiv(bizCardDiv, job) {
    if ( !bizCardDiv ) throw new Error('createBizDetailsDiv: given null bizCardDiv');
    if ( !job ) throw new Error('createBizDetailsDiv: given null job');
    console.log("createBizDetailsDiv: job:", job);
    const bizCardDetailsDiv = document.createElement('div');
    const jobIndex = bizCardDiv.getAttribute('data-job-index');
    if ( !utils.isNumeric(jobIndex) ) throw new Error(' createBizCardDetailsDiv: given non-numeric jobIndex attribute string');
    bizCardDetailsDiv.classList.add('biz-card-details-div');
    bizCardDetailsDiv.id = `biz-card-details-div-${jobIndex}`;

    // see createBizDetailsDiv::34  colorIndex format <number>
    let colorIndex = bizCardDiv.getAttribute('data-color-index');
    if ( !colorPalettes.isColorIndexString(colorIndex) ) throw new Error('createBizDetailsDiv: given non-colorIndexString colorIndex');
    bizCardDetailsDiv.setAttribute("data-color-index", colorIndex);
    bizCardDetailsDiv.classList.add('color-index-foreground-only');

    const employer = job.employer || 'Unknown Employer';
    const role = job.role || 'Unknown Role';
    const start = job.start || '1970-01-01';
    const end = job.end || '1970-02-01';
    const dates = sceneContainer.formatDateRange(start, end);
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

    <ul class="bulleted-job-description-items-ul">
        ${descriptions.map(item => `<li class="bulleted-job-description-items-li">${item}</li>`).join('')}
    </ul>
    <ul class="bulleted-job-skills-ul">
    ${skills
        .map(skill => skill.trim()) // Remove whitespace around skills
        .filter(skill => skill)     // Remove empty skills
        .map(skill => `<li class="bulleted-job-skills-li">${skill}</li>`)
        .join('')}
    </ul>
    `; 

    return bizCardDetailsDiv;
}


