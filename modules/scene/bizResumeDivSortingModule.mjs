// scene/bizResumeDivSortingModule.mjs

import * as resumeManager from '../resume/resumeManager.mjs';

import { Logger, LogLevel } from '../logger.mjs';
const log = new Logger("bizResumeDivSortingModule", LogLevel.DEBUG);

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

    if (firstButton) firstButton.addEventListener('click', {
        handleEvent: () => {
            logger.info('firstButton clicked');
            _resumeManager.goToFirstResumeItem();
        }
    });
    if (prevButton) prevButton.addEventListener('click', {
        handleEvent: () => {
            logger.info('prevButton clicked');
            _resumeManager.goToPreviousResumeItem();
        }
    });
    if (nextButton) nextButton.addEventListener('click', {
        handleEvent: () => {
            logger.info('nextButton clicked');
            _resumeManager.goToNextResumeItem();
        }
    });
    if (lastButton) lastButton.addEventListener('click', {
        handleEvent: () => {
            logger.info('lastButton clicked');
            _resumeManager.goToLastResumeItem();
        }
    });
}

