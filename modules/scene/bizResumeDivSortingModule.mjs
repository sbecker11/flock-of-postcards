// scene/bizResumeDivSortingModule.mjs

import * as resumeManager from '../resume/resumeManager.mjs';
import * as bizCardDivModule from './bizCardDivModule.mjs';

import { Logger, LogLevel } from '../logger.mjs';
const logger = new Logger("bizResumeDivSortingModule", LogLevel.DEBUG);

export function initialize(jobsData, bizResumeDivs) {

    const _resumeManager = new resumeManager.ResumeManager();
    _resumeManager.initialize(jobsData, bizResumeDivs);

    // initialize the sorting selector
    const sortingSelector = document.getElementById('biz-resume-div-sorting-selector');
    
    if (!sortingSelector) {
        console.error('Sorting selector element not found');
        return;
    }

    // initalize its options
    sortingSelector.innerHTML = `
    <option value="original_asc">Original Order</option>
    <option value="employer_asc">Employer A-Z</option>
    <option value="employer_desc">Employer Z-A</option>
    <option value="startDate_desc">Start Date (Newest First)</option>
    <option value="startDate_asc">Start Date (Oldest First)</option>
    <option value="endDate_desc">End Date (Newest First)</option>
    <option value="endDate_asc">End Date (Oldest First)</option>
    <option value="role_asc">Role A-Z</option>
    <option value="role_desc">Role Z-A</option>
    `;

    sortingSelector.addEventListener('change', (e) => {
        const [field, direction] = e.target.value.split('_');
        _resumeManager.applySortRule({ field, direction });
    });

    // Initialize navigation buttons
    const firstButton = document.getElementById('select-first-resume-div');
    const prevButton = document.getElementById('select-prev-resume-div');
    const nextButton = document.getElementById('select-next-resume-div');
    const lastButton = document.getElementById('select-last-resume-div');

    if (firstButton) firstButton.addEventListener('click', () => {
        const bizResumeDiv = _resumeManager.goToFirstResumeItem();
        if (bizResumeDiv) {
            const bizCardDivId = bizResumeDiv.dataset.pairedId;
            const bizCardDiv = document.getElementById(bizCardDivId);
            bizCardDivModule.handleBizCardDivClickEvent(bizCardDiv, { syncResume: false });
        }
    });
    if (prevButton) prevButton.addEventListener('click', () => {
        const bizResumeDiv = _resumeManager.goToPreviousResumeItem();
        if (bizResumeDiv) {
            const bizCardDivId = bizResumeDiv.dataset.pairedId;
            const bizCardDiv = document.getElementById(bizCardDivId);
            bizCardDivModule.handleBizCardDivClickEvent(bizCardDiv, { syncResume: false });
        }
    });
    if (nextButton) nextButton.addEventListener('click', () => {
        const bizResumeDiv = _resumeManager.goToNextResumeItem();
        if (bizResumeDiv) {
            const bizCardDivId = bizResumeDiv.dataset.pairedId;
            const bizCardDiv = document.getElementById(bizCardDivId);
            bizCardDivModule.handleBizCardDivClickEvent(bizCardDiv, { syncResume: false });
        }
    });
    if (lastButton) lastButton.addEventListener('click', () => {
        const bizResumeDiv = _resumeManager.goToLastResumeItem();
        if (bizResumeDiv) {
            const bizCardDivId = bizResumeDiv.dataset.pairedId;
            const bizCardDiv = document.getElementById(bizCardDivId);
            bizCardDivModule.handleBizCardDivClickEvent(bizCardDiv, { syncResume: false });
        }
    });
}

