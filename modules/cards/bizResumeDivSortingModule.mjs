// cards/bizResumeDivSortingModule.mjs

import * as divSyncModule from './divSyncModule.mjs';

// Sorting rules (simplified to your two active choices)
const sortingRuleChoices = {
    "by_end_date_desc": {
        sort_key: "end",
        sort_order: "desc",
        display: "End Date ↓"
    },
    "by_job_index_desc": {
        sort_key: "job_index",
        sort_order: "asc",
        display: "Job Index ↓"
    }
};

// DEFAULT SORTING RULE
let _currentSortingRule = sortingRuleChoices.by_end_date_desc;

function setCurrentSortingRule(rule) {
    _currentSortingRule = rule;
}

export function getCurrentSortingRule() {
    return _currentSortingRule;
}

// Navigation functions
export function getNextBizResumeDiv(currentBizResumeDiv) {
    const sortedBizResumeDivs = getSortedBizResumeDivs();
    const currentIndex = sortedBizResumeDivs.indexOf(currentBizResumeDiv);
    return sortedBizResumeDivs[(currentIndex + 1) % sortedBizResumeDivs.length];
}

export function getPreviousBizResumeDiv(currentBizResumeDiv) {
    const sortedBizResumeDivs = getSortedBizResumeDivs();
    const currentIndex = sortedBizResumeDivs.indexOf(currentBizResumeDiv);
    return currentIndex <= 0 ? null : sortedBizResumeDivs[currentIndex - 1];
}

export function getFirstBizResumeDiv() {
    const sortedBizResumeDivs = getSortedBizResumeDivs();
    return sortedBizResumeDivs[0];
} 

export function getLastBizResumeDiv() {
    const sortedBizResumeDivs = getSortedBizResumeDivs();
    return sortedBizResumeDivs[sortedBizResumeDivs.length - 1];
}

// UI-triggered navigation
export function showNextResumeDiv() {
    const currentBizResumeDiv = divSyncModule.getSelectedBizResumeDiv();
    const nextBizResumeDiv = getNextBizResumeDiv(currentBizResumeDiv);
    if (!nextBizResumeDiv) return;
    divSyncModule.addClass(nextBizResumeDiv,'slide-in-from-bottom');
    divSyncModule.setSelectedBizResumeDiv(nextBizResumeDiv);
}

export function showPreviousResumeDiv() {
    const currentBizResumeDiv = divSyncModule.getSelectedBizResumeDiv();
    const previousBizResumeDiv = getPreviousBizResumeDiv(currentBizResumeDiv);
    if (!previousBizResumeDiv) return;
    divSyncModule.addClass(previousBizResumeDiv,'slide-in-from-top');
    divSyncModule.setSelectedBizResumeDiv(previousBizResumeDiv);
}

export function showFirstResumeDiv() {
    const firstBizResumeDiv = getFirstBizResumeDiv();
    if (!firstBizResumeDiv) return;
    divSyncModule,setSelectedBizResumeDiv(firstBizResumeDiv);
}

export function showLastResumeDiv() {
    const lastBizResumeDiv = getLastBizResumeDiv();
    if (!lastBizResumeDiv) return;
    divSyncModule,setSelectedBizResumeDiv(lastBizResumeDiv);
}

// Initialize sorting UI
export function initializeSortingSelector() {
    const selectorElement = document.getElementById('biz-resume-div-sorting-selector');
    if (!selectorElement) {
        console.error('Sorting selector element not found');
        return;
    }

    // Populate dropdown options
    selectorElement.innerHTML = Object.entries(sortingRuleChoices)
        .map(([key, rule]) => `<option value="${key}">${rule.display}</option>`)
        .join('');

    // Handle selection changes
    selectorElement.addEventListener('change', (e) => {
        setCurrentSortingRule(sortingRuleChoices[e.target.value]);
    });
}

// Initialize navigation buttons
export function initializeNavigationButtons() {

    const firstButton = document.getElementById('select-first-resume-div');
    const prevButton = document.getElementById('select-prev-resume-div');
    const nextButton = document.getElementById('select-next-resume-div');
    const lastButton = document.getElementById('select-last-resume-div');

    if (firstButton) firstButton.addEventListener('click', showFirstResumeDiv);
    if (prevButton) prevButton.addEventListener('click', showPreviousResumeDiv);
    if (nextButton) nextButton.addEventListener('click', showNextResumeDiv);
    if (lastButton) lastButton.addEventListener('click', showLastResumeDiv);
}

// Function to get the new ordered list of the DOM's bizResumeDivs
// using the current sorting rule
export function getSortedBizResumeDivs() {
    const bizResumeDivs = Array.from(document.querySelectorAll('.biz-resume-div'));
    const currentSortingRule = getCurrentSortingRule();
    if ( !currentSortingRule ) {
        throw new Error('No sorting rule found');
    }

    return bizResumeDivs.sort((a, b) => {
        const aValue = a.getAttribute(`data-${currentSortingRule.sort_key}`);
        const bValue = b.getAttribute(`data-${currentSortingRule.sort_key}`);
        return currentSortingRule.sort_order === "asc" 
            ? aValue?.localeCompare(bValue) 
            : bValue?.localeCompare(aValue);
    });
}