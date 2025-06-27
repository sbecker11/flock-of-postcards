// scene/bizResumeDivSortingModule.mjs

import * as utils from '../utils/utils.mjs';
import { resumeListController } from '../resume/ResumeListController.mjs';

export function initialize(jobsData, bizResumeDivs) {

    if (!resumeListController) {
        console.error('bizResumeDivSortingModule: ResumeListController not found.');
        return;
    }

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
        sort(field, direction);
    });

    // Initialize navigation buttons
    const firstButton = document.getElementById('select-first-resume-div');
    const prevButton = document.getElementById('select-prev-resume-div');
    const nextButton = document.getElementById('select-next-resume-div');
    const lastButton = document.getElementById('select-last-resume-div');

    if (firstButton) firstButton.addEventListener('click', () => {
        resumeListController.goToFirstResumeItem();
    });
    if (prevButton) prevButton.addEventListener('click', () => {
        resumeListController.goToPreviousResumeItem();
    });
    if (nextButton) nextButton.addEventListener('click', () => {
        resumeListController.goToNextResumeItem();
    });
    if (lastButton) lastButton.addEventListener('click', () => {
        resumeListController.goToLastResumeItem();
    });
}

function sort(field, direction) {
    if (!resumeListController) {
        console.error('bizResumeDivSortingModule: ResumeListController not found.');
        return;
    }
    resumeListController.applySortRule({ field, direction });
}

