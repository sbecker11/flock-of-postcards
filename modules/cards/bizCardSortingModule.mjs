// Sorting rules
// sort_key is the attribute name to sort by
// sort_order is the order to sort by
// sort_order is either 'asc' or 'desc'
// sort_key is required
// sort_order is optional, default is 'asc'

const sortingRuleChoices = {
    "by_end_date_desc": {
        "sort_key": "end",
        "sort_order": "desc",
        "display": "End Date ↓"
    },
    // "by_end_date_asc": {
    //     "sort_key": "end",
    //     "sort_order": "asc",
    //     "display": "End Date ↑"
    // },
    // "by_start_date_desc": {
    //     "sort_key": "start",
    //     "sort_order": "desc",
    //     "display": "Start Date ↓"
    // },
    // "by_start_date_asc": {
    //     "sort_key": "start",
    //     "sort_order": "asc",
    //     "display": "Start Date ↑"
    // },
    // "by_employer_desc": {
    //     "sort_key": "employer",
    //     "sort_order": "desc",
    //     "display": "Employer ↓"
    // },
    // "by_employer_asc": {
    //     "sort_key": "employer",
    //     "sort_order": "asc",
    //     "display": "Employer ↑"
    // },
    // "by_title_desc": {
    //     "sort_key": "title",
    //     "sort_order": "desc",
    //     "display": "Title ↓"
    // },
    // "by_title_asc": {
    //     "sort_key": "title",
    //     "sort_order": "asc",
    //     "display": "Title ↑"
    // },
    // "by_job_index_asc": {
    //     "sort_key": "job_index",
    //     "sort_order": "asc",
    //     "display": "Job Index ↑"
    // },
    "by_job_index_desc": {
        "sort_key": "job_index",
        "sort_order": "desc",
        "display": "Job Index ↓"
    }
}

export const DEFAULT_SORT_KEY = "by_end_date_desc";
export const DEFAULT_SORT_ORDER = "desc";

export function getCurrentBizCardDivSortingRule() {
    const bizCardSortingSelector = document.getElementById("biz-card-sorting-selector");
    if (!bizCardSortingSelector) {
        console.log(`No sorting selector found, using default: ${DEFAULT_SORT_KEY}`);
        return sortingRuleChoices[DEFAULT_SORT_KEY];
    }
    const selectedValue = bizCardSortingSelector.value;
    if (!selectedValue || !sortingRuleChoices[selectedValue]) {
        console.log(`Invalid selection, using default: ${DEFAULT_SORT_KEY}`);
        return sortingRuleChoices[DEFAULT_SORT_KEY];
    }
    return sortingRuleChoices[selectedValue];
}

export function getSortedBizCardDivs() {
    const bizCardDivs = document.querySelectorAll('.biz-card-div');
    const sortingRule = getCurrentBizCardDivSortingRule();
    if (!sortingRule) return Array.from(bizCardDivs); // Fallback to unsorted

    return Array.from(bizCardDivs).sort((a, b) => {
        const aValue = a.getAttribute(`data-${sortingRule.sort_key}`);
        const bValue = b.getAttribute(`data-${sortingRule.sort_key}`);
        return sortingRule.sort_order === 'asc' 
            ? aValue?.localeCompare(bValue) 
            : bValue?.localeCompare(aValue);
    });
}

export function getSortedBizResumeDivs() {
    const sortedCards = getSortedBizCardDivs();
    return sortedCards.map(card => {
        const resumeId = card.getAttribute('data-linked-resume');
        return document.getElementById(resumeId);
    }).filter(Boolean); // Filter out nulls
}

export function reorderResumeDivs() {
    const resumeContainer = document.getElementById('resume-content-div');
    if (!resumeContainer) return;

    getSortedBizResumeDivs().forEach(resumeDiv => {
        resumeContainer.appendChild(resumeDiv); // Re-append to enforce order
    });
}

export function initializeBizCardSortingSelector(bizCardSortingSelector) {
    console.log("[Debug] Initializing sorting selector with rules:", Object.keys(sortingRuleChoices));
    
    if (!bizCardSortingSelector) {
        bizCardSortingSelector = document.getElementById('biz-card-sorting-selector');
        if (!bizCardSortingSelector) {
            console.error('[Debug] Could not find biz-card-sorting-selector');
            return;
        }
    }
    if (bizCardSortingSelector.tagName.toLowerCase() !== 'select') {
        console.log('bizCardSortingSelector is not a select element');
        return;
    }

    // Clear existing options
    bizCardSortingSelector.innerHTML = '';

    // Add options for each sorting rule
    for (const key of Object.keys(sortingRuleChoices)) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = sortingRuleChoices[key].display;
        if (key === DEFAULT_SORT_KEY) {
            option.selected = true;
        }
        bizCardSortingSelector.appendChild(option);
    }

    // Set initial value
    bizCardSortingSelector.value = DEFAULT_SORT_KEY;

    // Add change event listener
    bizCardSortingSelector.addEventListener('change', () => {
        reorderResumeDivs();
    });

    // Initial sort
    reorderResumeDivs();
}

export function getSelectedBizCardDiv() {
    const selectedBizCardDiv = document.querySelector('.biz-card-div.selected');
    if (!selectedBizCardDiv) {
        console.log('No selected bizCardDiv found');
        return null;
    }
    return selectedBizCardDiv;
}

export function getNextBizCardDiv(selectedBizCardDiv) {
    const sortedBizCardDivs = getSortedBizCardDivs();
    const selectedIndex = sortedBizCardDivs.indexOf(selectedBizCardDiv);
    if (selectedIndex === -1) {
        console.log('Selected bizCardDiv not found in sortedBizCardDivs');
        return null;
    }
    const nextIndex = (selectedIndex + 1) % sortedBizCardDivs.length;
    return sortedBizCardDivs[nextIndex];
}

export function getPreviousBizCardDiv(selectedBizCardDiv) {
    const sortedBizCardDivs = getSortedBizCardDivs();
    const selectedIndex = sortedBizCardDivs.indexOf(selectedBizCardDiv);
    if (selectedIndex === -1) {
        console.log('Selected bizCardDiv not found in sortedBizCardDivs');
        return null;
    }
    const previousIndex = (selectedIndex - 1 + sortedBizCardDivs.length) % sortedBizCardDivs.length;
    return sortedBizCardDivs[previousIndex];
}

export function getFirstBizCardDiv() {
    const sortedBizCardDivs = getSortedBizCardDivs();
    return sortedBizCardDivs[0];
}

export function getLastBizCardDiv() {
    const sortedBizCardDivs = getSortedBizCardDivs();
    return sortedBizCardDivs[sortedBizCardDivs.length - 1];
}

// Initialize navigation buttons
export function initializeBizCardNavigationButtons() {
    const selectFirst = document.getElementById('select-first-biz-card');
    const selectPrev = document.getElementById('select-prev-bizCard');
    const selectNext = document.getElementById('select-next-bizCard');
    const selectLast = document.getElementById('select-last-biz-card');

    if (selectFirst) {
        selectFirst.addEventListener('click', () => {
            const firstCard = getFirstBizCardDiv();
            if (firstCard) firstCard.click();
        });
    }

    if (selectPrev) {
        selectPrev.addEventListener('click', () => {
            const selected = getSelectedBizCardDiv();
            if (selected) {
                const prevCard = getPreviousBizCardDiv(selected);
                if (prevCard) prevCard.click();
            }
        });
    }

    if (selectNext) {
        selectNext.addEventListener('click', () => {
            const selected = getSelectedBizCardDiv();
            if (selected) {
                const nextCard = getNextBizCardDiv(selected);
                if (nextCard) nextCard.click();
            }
        });
    }

    if (selectLast) {
        selectLast.addEventListener('click', () => {
            const lastCard = getLastBizCardDiv();
            if (lastCard) lastCard.click();
        });
    }
}