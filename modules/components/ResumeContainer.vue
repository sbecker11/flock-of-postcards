<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { jobs } from '@/static_content/jobs/jobs.mjs';
import { selectionManager } from '@/modules/core/selectionManager.mjs';
import { useColorPalette } from '@/modules/composables/useColorPalette.mjs';
import { useResizeHandle } from '@/modules/composables/useResizeHandle.mjs';

// Get the same percentage as the resize handle
const { percentage: scenePercentage } = useResizeHandle();

// Calculate resume percentage as 100 minus scene percentage
const resumePercentage = computed(() => {
  return 100 - Math.round(scenePercentage.value);
});

// Use the color palette composable
const {
  orderedPaletteNames,
  filenameToNameMap,
  currentPaletteFilename,
  setCurrentPalette
} = useColorPalette();

const currentSortRule = ref({ field: 'startDate', direction: 'desc' });

// Watch for changes in the sort rule and apply them
watch(currentSortRule, (newSortRule) => {
  if (window.resumeListController) {
    window.resumeListController.applySortRule(newSortRule);
  }
});

// Watch for changes in the color palette selection and save them
watch(currentPaletteFilename, (newFilename) => {
  if (newFilename) {
    setCurrentPalette(newFilename);
  }
});

const sortOptions = ref([
  { value: { field: 'startDate', direction: 'desc' }, text: 'Start Date (Newest First)' },
  { value: { field: 'startDate', direction: 'asc' }, text: 'Start Date (Oldest First)' },
  { value: { field: 'employer', direction: 'asc' }, text: 'Employer (A-Z)' },
  { value: { field: 'role', direction: 'asc' }, text: 'Role (A-Z)' },
]);

// Methods for buttons - these will now call the legacy controller
function selectFirst() {
  window.CONSOLE_LOG_IGNORE("selectFirst button clicked");
  if (window.resumeListController) {
    window.resumeListController.goToFirstResumeItem();
  }
}
function selectLast() {
  window.CONSOLE_LOG_IGNORE("selectLast button clicked");
  if (window.resumeListController) {
    window.resumeListController.goToLastResumeItem();
  }
}
function selectNext() {
  window.CONSOLE_LOG_IGNORE("selectNext button clicked");
  if (window.resumeListController) {
    window.resumeListController.goToNextResumeItem();
  }
}
function selectPrevious() {
  window.CONSOLE_LOG_IGNORE("selectPrevious button clicked");
  if (window.resumeListController) {
    window.resumeListController.goToPreviousResumeItem();
  }
}



</script>

<template>
    <div id="resume-content">
        <div id="resume-content-header">
            <p class="intro">Welcome to your flock-of-postcards!</p>
            <div id="color-palette-container" tabindex="-1">
                <select 
                    id="color-palette-selector" 
                    v-model="currentPaletteFilename"
                    tabindex="0"
                >
                    <option v-for="name in orderedPaletteNames" :key="name" :value="Object.keys(filenameToNameMap).find(key => filenameToNameMap[key] === name)">
                        {{ name }}
                    </option>
                </select>
            </div>
            <div id="biz-card-sorting-container" tabindex="-1">
                <select id="biz-resume-div-sorting-selector" v-model="currentSortRule" tabindex="0">
                    <option v-for="option in sortOptions" :key="option.text" :value="option.value">
                        {{ option.text }}
                    </option>
                </select>
            </div>
            <div id="biz-card-controls">
                <button @click="selectFirst" class="biz-card-control-button">First</button>
                <button @click="selectPrevious" class="biz-card-control-button">Prev</button>
                <button @click="selectNext" class="biz-card-control-button">Next</button>
                <button @click="selectLast" class="biz-card-control-button">Last</button>
            </div>
        </div>
        <div id="resume-content-div-wrapper" class="scrollable-container">
            <!-- The content of this div is now entirely managed by the legacy InfiniteScrollingContainer -->
            <div id="resume-content-div"></div>
        </div>
    </div>
</template>

<style scoped>
#resume-content {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 5px;
    overflow: hidden;
    background-color: var(--grey-darkest);
    font-family: sans-serif;
}

#resume-content-header {
    background-color: var(--grey-dark);
    color: white;
    padding: 10px;
    flex-shrink: 0; /* Fits children */
}

#resume-content-div-wrapper {
    flex-grow: 1;
    /* overflow-y is now controlled by the legacy scroller */
    background-color: var(--grey-medium);
    color: black;
    position: relative; /* Needed for the absolute positioning of items by the scroller */
    overflow: hidden; /* The scroller inside will handle overflow */
}

/* Custom scrollbar to match the cDiv scrollbar */
#resume-content-div-wrapper::-webkit-scrollbar {
    width: 5px;
}

#resume-content-div-wrapper::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    cursor: ns-resize;
}

#resume-content-div-wrapper::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
}

#resume-content-div-wrapper::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
}

#resume-content-footer {
    background-color: var(--grey-medium);
    padding: 10px;
    flex-shrink: 0; /* Fits children */
}

#biz-card-controls {
    display: flex;
    gap: 5px;
    margin-top: 10px;
    width: 100%;
    position: relative; /* Needed for z-index to apply */
    z-index: 100; /* High z-index to ensure it's on top of other elements */
    flex-wrap: wrap; /* Allow wrapping for the 2x2 layout */
}
.biz-card-control-button {
    flex: 1 1 auto;
    min-width: 60px;
    padding: 8px 12px;
    background-color: #2196F3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    transition: background-color 0.2s;
    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.8);
}

/* 2x2 layout for medium widths */
@container (max-width: 320px) {
    #biz-card-controls .biz-card-control-button {
        flex-basis: calc(50% - 2.5px); /* 2 buttons per row, accounting for gap */
    }
}

/* 1x4 (single column) layout for narrow widths */
@container (max-width: 160px) {
    #biz-card-controls {
        flex-direction: column;
    }
}

.biz-card-control-button:hover {
    background-color: #1976D2;
}
#color-palette-container,
#biz-card-sorting-container {
    position: relative;
    display: flex;
    padding: 5px 0;
    width: 100%;
}
#color-palette-selector,
#biz-resume-div-sorting-selector {
    flex: 1 1 auto;
    padding: 8px 12px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.8);
}
#color-palette-selector:hover,
#biz-resume-div-sorting-selector:hover {
    background-color: #45a049;
}
/* rDiv styles moved to global styles section below */

.viewer-label {
    font-family: sans-serif;
    font-size: 14px;
    color: black;
    user-select: none;
    text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
    white-space: nowrap;
}
</style>

<style>
/* Global styles for rDivs - not scoped to ensure they apply to dynamically created elements */

/* Base rDiv styling with maximum specificity */
#resume-content-div .biz-resume-div,
#resume-content-div-wrapper .biz-resume-div,
#resume-content .biz-resume-div,
body #resume-content-div .biz-resume-div,
body #resume-content-div-wrapper .biz-resume-div,
body #resume-content .biz-resume-div,
.biz-resume-div {
    position: relative !important; /* Force override of any absolute positioning */
    display: flex !important; /* Use flexbox to allow height adjustment */
    flex-direction: column; /* Stack children vertically */
    width: 100%;
    /* Padding, border, and outline are handled by applyPaletteToElement function */
    border-bottom: 1px solid #eee;
    box-sizing: border-box;
    color: #333;
    flex-shrink: 0; /* Prevent items from shrinking, force stacking */
    border-radius: 25px !important;  /* Clip inner content */
    min-height: fit-content; /* Allow height to fit content */
}

/* 
  Force the biz-resume-details-div AND all of its children to have a transparent background.
  This is the definitive fix to ensure the parent's rounded corners and background are visible.
*/
#resume-content-div .biz-resume-div .biz-resume-details-div,
#resume-content-div-wrapper .biz-resume-div .biz-resume-details-div,
#resume-content .biz-resume-div .biz-resume-details-div,
body #resume-content-div .biz-resume-div .biz-resume-details-div,
body #resume-content-div-wrapper .biz-resume-div .biz-resume-details-div,
body #resume-content .biz-resume-div .biz-resume-details-div,
.biz-resume-div .biz-resume-details-div,
.biz-resume-div .biz-resume-details-div * {
    background-color: transparent !important;
    border-radius: 25px !important;
}

.job-description-item {
    margin: 0;
    padding: 0;
}

.biz-resume-div h4, .biz-resume-div p {
    /* Let text wrap naturally */
    margin: 0;
    padding: 2px 0;
    white-space: normal; /* Allow wrapping */
    overflow: visible; /* Show all content */
}

/* Hovered state: colors only - padding/border/outline handled by applyPaletteToElement */
#resume-content-div .biz-resume-div:hover,
#resume-content-div-wrapper .biz-resume-div:hover,
#resume-content .biz-resume-div:hover,
body #resume-content-div .biz-resume-div:hover,
body #resume-content-div-wrapper .biz-resume-div:hover,
body #resume-content .biz-resume-div:hover,
.biz-resume-div:hover,
#resume-content-div .biz-resume-div.hovered,
#resume-content-div-wrapper .biz-resume-div.hovered,
#resume-content .biz-resume-div.hovered,
body #resume-content-div .biz-resume-div.hovered,
body #resume-content-div-wrapper .biz-resume-div.hovered,
body #resume-content .biz-resume-div.hovered,
.biz-resume-div.hovered {
    background-color: var(--data-background-color-hovered, #e3f2fd) !important;
    color: var(--data-foreground-color-hovered, #1976d2) !important;
    /* Padding, border, and outline are handled by applyPaletteToElement function */
}

/* Selected state: colors only - padding/border/outline handled by applyPaletteToElement */
#resume-content-div .biz-resume-div.selected,
#resume-content-div-wrapper .biz-resume-div.selected,
#resume-content .biz-resume-div.selected,
body #resume-content-div .biz-resume-div.selected,
body #resume-content-div-wrapper .biz-resume-div.selected,
body #resume-content .biz-resume-div.selected,
html body #resume-content-div .biz-resume-div.selected,
html body #resume-content-div-wrapper .biz-resume-div.selected,
html body #resume-content .biz-resume-div.selected,
.biz-resume-div.selected {
    background-color: var(--data-background-color-selected, #f3e5f5) !important;
    color: var(--data-foreground-color-selected, #7b1fa2) !important;
    /* Padding, border, and outline are handled by applyPaletteToElement function */
    border-radius: 25px !important;
}
</style> 