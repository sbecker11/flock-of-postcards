<script setup>
import { ref, onMounted, watch } from 'vue';
import ResizeHandle from '@/modules/components/ResizeHandle.vue';
import { jobs } from '@/static_content/jobs/jobs.mjs';
import { selectionManager } from '@/modules/core/selectionManager.mjs';

const currentSortRule = ref({ field: 'startDate', direction: 'desc' });

// Watch for changes in the sort rule and apply them
watch(currentSortRule, (newSortRule) => {
  if (window.resumeListController) {
    window.resumeListController.applySortRule(newSortRule);
  }
});

const sortOptions = ref([
  { value: { field: 'startDate', direction: 'desc' }, text: 'Start Date (Newest First)' },
  { value: { field: 'startDate', direction: 'asc' }, text: 'Start Date (Oldest First)' },
  { value: { field: 'employer', direction: 'asc' }, text: 'Employer (A-Z)' },
  { value: { field: 'employer', direction: 'desc' }, text: 'Employer (Z-A)' },
  { value: { field: 'role', direction: 'asc' }, text: 'Role (A-Z)' },
  { value: { field: 'role', direction: 'desc' }, text: 'Role (Z-A)' },
]);

// Methods for buttons - these will now call the legacy controller
function selectFirst() {
  console.log("selectFirst button clicked");
  if (window.resumeListController) {
    window.resumeListController.goToFirstResumeItem();
  }
}
function selectLast() {
  console.log("selectLast button clicked");
  if (window.resumeListController) {
    window.resumeListController.goToLastResumeItem();
  }
}
function selectNext() {
  console.log("selectNext button clicked");
  if (window.resumeListController) {
    window.resumeListController.goToNextResumeItem();
  }
}
function selectPrevious() {
  console.log("selectPrevious button clicked");
  if (window.resumeListController) {
    window.resumeListController.goToPreviousResumeItem();
  }
}

</script>

<template>
    <div id="resume-container">
        <ResizeHandle />
        <div id="resume-content">
            <div id="resume-content-header">
                <p class="intro">Welcome to your flock-of-postcards!</p>
                <div id="color-palette-container" tabindex="-1">
                    <select id="color-palette-selector" tabindex="0"></select>
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
            <div id="resume-content-footer">
                <div>
                    <span class="viewer-label">Resume Viewer</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
#resume-container {
    flex: 1;
    display: flex;
    flex-direction: row; /* Horizontal columns */
    gap: 5px;
    overflow: hidden;
    width: 100%;
    background-color: var(--grey-darkest); /* Dark Grey */
    position: relative; /* Needed for positioning the absolute label */
}

#resume-content {
    flex: 1; /* This makes it resizable */
    display: flex;
    flex-direction: column; /* Vertical rows */
    gap: 5px;
    overflow: hidden; /* Prevent content from spilling out */
    background-color: var(--grey-darkest); /* Dark Grey */
}

#resume-content-header {
    background-color: var(--grey-dark);
    color: white;
    padding: 10px;
    flex-shrink: 0; /* Fits children */
    font-family: sans-serif;
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
    font-family: sans-serif;
}

#biz-card-controls {
    display: flex;
    gap: 5px;
    margin-top: 10px;
    width: 100%;
    position: relative; /* Needed for z-index to apply */
    z-index: 100; /* High z-index to ensure it's on top of other elements */
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
.biz-resume-div {
    position: relative !important; /* Force override of any absolute positioning */
    display: block !important; /* Ensure block-level behavior in the flex container */
    width: 100%;
    padding: 10px;
    border-bottom: 1px solid #eee;
    transition: background-color 0.2s;
    box-sizing: border-box;
    color: #333;
    flex-shrink: 0; /* Prevent items from shrinking, force stacking */
    border-radius: 25px !important;  /* Clip inner content */
}

/* 
  Force the biz-resume-details-div AND all of its children to have a transparent background.
  This is the definitive fix to ensure the parent's rounded corners and background are visible.
*/
.biz-resume-div > .biz-resume-details-div,
.biz-resume-div > .biz-resume-details-div * {
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
.biz-resume-div:hover {
    background-color: #f0f0f0;
}
.biz-resume-div.selected {
    background-color: #d8eaff;
    border-left: 4px solid #007bff;
    padding-left: 6px;
    border-radius: 25px !important;
}

.viewer-label {
    font-family: sans-serif;
    font-size: 14px;
    color: black;
    user-select: none;
    text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
}
</style> 