// Sorting rules
// sort_key is the attribute name to sort by
// sort_order is the order to sort by
// sort_order is either 'asc' or 'desc'
// sort_key is required
// sort_order is optional, default is 'asc'

const sortingRuleChoices = {
    "by_start_date": {
        "sort_key": "start",
        "sort_order": "asc"
    },
    "by_end_date": {
        "sort_key": "end",
        "sort_order": "desc"
    },
    "by_employer": {
        "sort_key": "employer",
        "sort_order": "asc"
    },
    "by_title": {
        "sort_key": "title",
        "sort_order": "asc"
    },
    "by_jox_index": {
        "sort_key": "job_index",
        "sort_order": "asc"
    }
}

export const DEFAULT_SORT_KEY = "by_start_date";
export const DEFAULT_SORT_ORDER = "asc";

export function getCurrentBizCardDivSortingRule() {
    const currentSortingRuleSelector = document.getElementById("current-sorting-rule");

    if ( !currentSortingRuleSelector ) {
        console.log(`No current sorting rule selector found, so using default sorting rule: ${DEFAULT_SORT_KEY}`);
        return sortingRuleChoices[DEFAULT_SORT_KEY];
    }
    const currentSortingRule = currentSortingRuleSelector.value;
    if ( !currentSortingRule ) {
        console.log(`No current sorting rule selected, so using default sorting rule: ${DEFAULT_SORT_KEY}`);
        currentSortingRule = DEFAULT_SORT_KEY;
        currentSortingRuleSelector.value = currentSortingRule;
    }
    return sortingRuleChoices[currentSortingRule];
}

export function initializeBizCardSortingSelector(bizCardSortingSelector) {
    if ( !bizCardSortingSelector ) {
        bizCardSortingSelector = document.getElementById('biz-card-sorting-selector');
        if ( !bizCardSortingSelector ) {
            console.log('No bizCardSortingSelector found');
            return;
        }
    }
    if ( bizCardSortingSelector.tagName.toLowerCase() !== 'select' ) {
        console.log('bizCardSortingSelector is not a select element');
        return;
    }
    const sortingRules = sortingRuleChoices;
    if ( !sortingRules ) {
        console.log('No sorting rules found');
        return;
    }

    // use DEFAULT_SORT_KEY to find the default sorting rule
    const defaultSortingRule = sortingRules[DEFAULT_SORT_KEY];
    if ( !defaultSortingRule ) {
        console.log(`No default sorting rule found, so using first sorting rule: ${sortingRules[0].name}`);
        defaultSortingRule = sortingRules[0];
    }

    for (const key of Object.keys(sortingRules)) {
        const sortingRule = sortingRules[key];
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key.replace(/_/g, ' ');
        if ( sortingRule.sort_key == defaultSortingRule.sort_key ) {
            option.selected = true;
        }
        bizCardSortingSelector.appendChild(option);
    }
    var selectedValue = sortingRules.sort_key;
    if ( !selectedValue ) {
        selectedValue = DEFAULT_SORT_KEY;
    }
    bizCardSortingSelector.value = selectedValue;

    bizCardSortingSelector.addEventListener('change', (event) => {
        const selectedValue = event.target.value;
        console.log('Selected value:', selectedValue);
    });

    const bizCardDivs = document.querySelectorAll('.biz-card-div');
    const sortedBizCardDivs = Array.from(bizCardDivs).sort((a, b) => {
        const aValue = a[sortingRules.sort_key];
        const bValue = b[sortingRules.sort_key];
    });
}