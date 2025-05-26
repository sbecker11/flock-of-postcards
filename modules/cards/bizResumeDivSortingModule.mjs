// cards/bizResumeDivSortingModule.mjs

import * as divSyncModule from './divSyncModule.mjs';
import { getCurrentPalette, applyCurrentPaletteToElement } from '../color/colorPalettes.mjs';

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
export function getNextBizResumeDiv(fromBizResumeDiv) {
    if (!fromBizResumeDiv) {
        console.log("getNextBizResumeDiv: fromBizResumeDiv is null so defaulting to last");
        return getLastBizResumeDiv();
    } else if ( !divSyncModule.matchesCurrentSelected(fromBizResumeDiv) ) {
        console.log("getNextBizResumeDiv: fromBizResumeDiv is not the currentselected");
    }
    const sortedBizResumeDivs = getSortedBizResumeDivs();
    const fromIndex = sortedBizResumeDivs.indexOf(fromBizResumeDiv);
    const N = sortedBizResumeDivs.length;
    const nextIndex = (fromIndex + 1) % N;
    console.log("getNextBizResumeDiv: fromIndex:", fromIndex, "nextIndex:", nextIndex);
    const nextResumeDiv = sortedBizResumeDivs[nextIndex];
    console.log("getNextBizResumeDiv: nextResumeDiv:", nextResumeDiv.id);
    return nextResumeDiv;
}

export function getPreviousBizResumeDiv(fromBizResumeDiv) {
    if (!fromBizResumeDiv) {
        console.log("getPreviousBizResumeDiv: fromBizResumeDiv is null so defaulting to first");
        return getFirstBizResumeDiv();
    } else if ( !divSyncModule.matchesCurrentSelected(fromBizResumeDiv) ) {
        console.log("getPreviousBizResumeDiv: fromBizResumeDiv is not the currentselected");
    }
    const sortedBizResumeDivs = getSortedBizResumeDivs();
    const fromIndex = sortedBizResumeDivs.indexOf(fromBizResumeDiv);
    const N = sortedBizResumeDivs.length;
    const prevIndex = (fromIndex - 1 + N) % N;
    console.log("getPreviousBizResumeDiv: fromIndex:", fromIndex, "prevIndex:", prevIndex);
    const previousResumeDiv = sortedBizResumeDivs[prevIndex];
    console.log("getPreviousBizResumeDiv: previousResumeDiv:", previousResumeDiv.id);
    return previousResumeDiv;
}

export function getFirstBizResumeDiv() {
    console.log('getFirstBizResumeDiv()');
    const bizResumeDivs = document.getElementsByClassName('biz-resume-div');
    const sortedBizResumeDivs = getSortedBizResumeDivs();
    if (sortedBizResumeDivs.length === 0) {
        throw new Error('getFirstBizResumeDiv() No biz-resume-divs found');
    }
    return sortedBizResumeDivs[0];
} 

export function getLastBizResumeDiv() {
    console.log('getLastBizResumeDiv()');
    const sortedBizResumeDivs = getSortedBizResumeDivs();
    if (sortedBizResumeDivs.length === 0) {
        throw new Error('getLastBizResumeDiv() No biz-resume-divs found');
    }
    return sortedBizResumeDivs[sortedBizResumeDivs.length - 1];
}

// UI-triggered navigation
export function showNextResumeDiv() {
    console.log('showNextResumeDiv');
    const fromBizResumeDiv = divSyncModule.getSelectedBizResumeDiv();
    const nextBizResumeDiv = getNextBizResumeDiv(fromBizResumeDiv);
    if (!nextBizResumeDiv) {
        log.warn(`showNextResumeDiv: undefined nextBizResumeDiv`);
        return;
    }
    divSyncModule.addClass(nextBizResumeDiv,'slide-in-from-bottom');
    divSyncModule.setSelected(nextBizResumeDiv);
}

export function showPreviousResumeDiv() {
    console.log('showPreviousResumeDiv');
    const fromBizResumeDiv = divSyncModule.getSelectedBizResumeDiv();
    const previousBizResumeDiv = getPreviousBizResumeDiv(fromBizResumeDiv);
    if (!previousBizResumeDiv) {
        log.warn(`showPreviousResumeDiv: undefined previousBizResumeDiv`);
        return;
    }
    divSyncModule.addClass(previousBizResumeDiv,'slide-in-from-top');
    divSyncModule.setSelected(previousBizResumeDiv);
}

export function showFirstResumeDiv() {
    console.log('showFirstResumeDiv');
    const firstBizResumeDiv = getFirstBizResumeDiv();
    if (!firstBizResumeDiv) {
        log.warn(`showFirstResumeDiv: undefined firstResumeDiv`);
        return;
    }
    divSyncModule.addClass(firstBizResumeDiv,'no-slide');
    divSyncModule.setSelected(firstBizResumeDiv);
}

export function showLastResumeDiv() {
    console.log('showLastResumeDiv');
    const lastBizResumeDiv = getLastBizResumeDiv();
    if (!lastBizResumeDiv) {
        log.warn('showLastResumeDiv: undefined lastResumeDiv');
        return;
    }
    divSyncModule.addClass(lastBizResumeDiv,'no-slide');
    divSyncModule.setSelected(lastBizResumeDiv);
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

export function createBizResumeDiv() {
    const palette = getCurrentPalette();

    // Verify the palette before applying it
    if (!palette?.colors) {
        console.error("No palette loaded. Using fallback.");
        palette = { colors: ['#FF0000', '#00FF00'] };  // Emergency fallback
    }

    applyCurrentPaletteToElement(palette);
}