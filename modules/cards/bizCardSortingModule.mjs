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
    "by_end_date_asc": {
        "sort_key": "end",
        "sort_order": "asc",
        "display": "End Date ↑"
    },
    "by_start_date_desc": {
        "sort_key": "start",
        "sort_order": "desc",
        "display": "Start Date ↓"
    },
    "by_start_date_asc": {
        "sort_key": "start",
        "sort_order": "asc",
        "display": "Start Date ↑"
    },
    "by_employer_desc": {
        "sort_key": "employer",
        "sort_order": "desc",
        "display": "Employer ↓"
    },
    "by_employer_asc": {
        "sort_key": "employer",
        "sort_order": "asc",
        "display": "Employer ↑"
    },
    "by_title_desc": {
        "sort_key": "title",
        "sort_order": "desc",
        "display": "Title ↓"
    },
    "by_title_asc": {
        "sort_key": "title",
        "sort_order": "asc",
        "display": "Title ↑"
    },
    "by_job_index_desc": {
        "sort_key": "job_index",
        "sort_order": "desc",
        "display": "Job Index ↓"
    },
    "by_job_index_asc": {
        "sort_key": "job_index",
        "sort_order": "asc",
        "display": "Job Index ↑"
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
    if (!sortingRule) {
        console.log('No sorting rule found');
        return null;
    }
    const sortKey = sortingRule.sort_key;
    const sortOrder = sortingRule.sort_order;
    if (!sortKey) {
        console.log('No sort key found');
        return null;
    }
    const sortKeyAttribute = `sort-key-${sortKey}`;
    const sortedBizCardDivs = Array.from(bizCardDivs).sort((a, b) => {
        const aValue = a.getAttribute(sortKeyAttribute);
        const bValue = b.getAttribute(sortKeyAttribute);
        if (!aValue || !bValue) {
            console.log(`Missing sort value for ${sortKey}`);
            return 0;
        }
        if (sortOrder === 'asc') {
            return aValue.localeCompare(bValue);
        } else {
            return bValue.localeCompare(aValue);
        }
    });
    return sortedBizCardDivs;
}

export function reorderResumeDivs() {
    const sortedCardDivs = getSortedBizCardDivs();
    if (!sortedCardDivs) return;

    const resumeContentDiv = document.getElementById('resume-content-div');
    if (!resumeContentDiv) return;

    // Get all resume divs in their current order
    const resumeDivs = Array.from(resumeContentDiv.querySelectorAll('.biz-resume-div'));
    
    // Reorder them according to the sorted card divs
    sortedCardDivs.forEach(cardDiv => {
        const jobIndex = cardDiv.getAttribute('sort-key-job-index');
        const resumeDiv = resumeDivs.find(div => div.getAttribute('sort-key-job-index') === jobIndex);
        if (resumeDiv) {
            resumeContentDiv.appendChild(resumeDiv);
        }
    });
}

export function initializeBizCardSortingSelector(bizCardSortingSelector) {
    if (!bizCardSortingSelector) {
        bizCardSortingSelector = document.getElementById('biz-card-sorting-selector');
        if (!bizCardSortingSelector) {
            console.log('No bizCardSortingSelector found');
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
    bizCardSortingSelector.addEventListener('change', (event) => {
        const selectedValue = event.target.value;
        console.log('Selected sorting:', selectedValue);
        reorderResumeDivs();
    });

    // Initial sort
    reorderResumeDivs();
}