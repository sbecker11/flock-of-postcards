// @ts-nocheck
'use strict';

import { jobs } from './static_content/jobs/jobs.mjs';
import * as domUtils from './modules/utils/domUtils.mjs';
import * as mathUtils from './modules/utils/mathUtils.mjs';
import * as timeline from './modules/timeline/timeline.mjs';
import * as focalPoint from './modules/core/focalPoint.mjs';
import * as alerts from './modules/alerts/alerts.mjs';
import * as colorPalettes from './modules/color/colorPalettes.mjs';
import * as colorUtils from './modules/color/colorUtils.mjs';
import * as bizResumeDivSortingModule from './modules/cards/bizResumeDivSortingModule.mjs';
import * as bizCardDivModule from './modules/cards/bizCardDivModule.mjs';
import * as divSyncModule from './modules/cards/divSyncModule.mjs';
import * as bizResumeDivScrollingModule from './modules/cards/bizResumeDivScrollingModule.mjs';
import * as bizResumtDivSortingModule from './modules/cards/bizResumeDivSortingModule.mjs';
import * as zIndex from './modules/core/zIndex.mjs';
import * as parallax from './modules/core/parallax.mjs';
import * as viewPort from './modules/core/viewport.mjs';
import * as filters from './modules/core/filters.mjs';
import * as cardUtils from './modules/utils/cardUtils.mjs';
import * as cardConstants from './modules/cards/cardConstants.mjs';
import * as autoScroll from './modules/animation/autoScroll.mjs';
import * as resizeHandle from './modules/core/resizeHandle.mjs';
import * as bullsEye from './modules/core/bullsEye.mjs';
import * as aimPoint from './modules/core/aimPoint.mjs';

import { Logger, LogLevel } from "./modules/logger.mjs";
const logger = new Logger("main", LogLevel.DEBUG);


// --------------------------------------
// Element reference globals

const resumeContentDiv= document.getElementById("resume-content-div");
const resumeColumn = document.getElementById("resume-column");
const sceneContainer = document.getElementById("scene-container");
const scenePlane = document.getElementById("scene-plane");
const bottomGradient = document.getElementById("bottom-gradient");
const focalPointElement = document.getElementById("focal-point");

const timelineContainer = document.getElementById("timeline-container");
let paletteSelector = null;

// --------------------------------------
// Timeline constants
function getMinMaxTimelineYears(jobs) {
    var minYear = 10000;
    var maxYear = -10000;
    for (let i = 0; i < jobs.length; i++) {
        var job = jobs[i];
        var jobEnd = job["end"].trim().replace("-01", "");
        var endYearStr = jobEnd.split("-")[0];
        var endYear = parseInt(endYearStr);
        if (endYear > maxYear)
            maxYear = endYear;

        var jobStart = job["start"].trim().replace("-01", "");
        var startYearStr = jobStart.split("-")[0];
        var startYear = parseInt(startYearStr);
        if (startYear < minYear)
            minYear = startYear;
    }
    minYear -= 1;
    maxYear += 1;
    return [minYear, maxYear];
}

// --------------------------------------
// Miscellaneous globals

const BULLET_DELIMITER = "\u2022";
const BULLET_JOINER = ' ' + BULLET_DELIMITER + ' ';

// --------------------------------------
// Animation globals

const NUM_ANIMATION_FRAMES = 0;
const ANIMATION_DURATION_MILLIS = 0;
var ANIMATION_IN_PROGRESS = false;

// Default mouse behavior: prevent selections while mouse is down
document.addEventListener('mousedown', function() {
    document.body.classList.add('no-select');
    document.getElementById("scene-container").classList.add('no-select');
});

document.addEventListener('mouseup', function() {
    document.body.classList.remove('no-select');
    document.getElementById("scene-container").classList.remove('no-select');
});

// Initialize the application
async function initialize() {

    const job0 = jobs[0];
    console.log("job0:", job0.employer, job0.start, job0.end, job0.role, job0.Description, job0.jobSkills);
    
    try {
        // load color palettes for palette selector
        colorPalettes.initializeColorPalettes();
        paletteSelector = await colorPalettes.getPaletteSelectorInstance();

        const [minTimelineYear, maxTimelineYear] = getMinMaxTimelineYears(jobs);
        const defaultTimelineYear = maxTimelineYear;

        // Initialize timeline
        timeline.createTimeline(timelineContainer, sceneContainer, minTimelineYear, maxTimelineYear, defaultTimelineYear);
        
        // Initialize viewPort and getBullsEyeElement() first
        viewPort.initializeViewPort(sceneContainer);
        viewPort.updateViewPort(sceneContainer);

        bullsEye.initializeBullsEye();
        
        resizeHandle.initializeResizeHandle();
        
        // sanity check for z and z_index functions
        zIndex.test_z_functions();

        // sanity check for color utils
        colorUtils.test_color_utils();

        // Create business cards after viewPort, getBullsEyeElement(), and resizeHandle  and color palette are initialized
        if (!Array.isArray(jobs)) {
            const jobType = typeof jobs;
            ("jobType:", jobType);
            logger.error("jobType:", jobType);
        }        
        const sortedJobs = [...jobs].sort((a, b) => new Date(b.start) - new Date(a.start));

        // Create all bizCards
        sortedJobs.forEach((job, index) => { // jobs loader
            // Create the bizCardDiv
            console.log("creating bizCardDiv for jobIndex:", index);
            const bizCardDiv = bizCardDivModule.createBizCardDiv(job, index);

            const bizCardDivId = bizCardDiv.id;
            console.log("bizCardDivId:id:", bizCardDivId);
            const checkBizCarDiv = document.getElementById(bizCardDivId);
            if (!checkBizCarDiv) throw new Error("bizCardDiv is not found for bizCardDivId:", bizCardDivId);

            const bizResumeDivId = bizCardDivId.replace("card", "resume");
            const bizResumeDiv = document.getElementById(bizResumeDivId);
            if (!bizResumeDiv) throw new Error("bizResumeDiv is not found for bizResumeDivId:", bizResumeDivId);

            divSyncModule.verifySyncedPair(bizCardDiv, bizResumeDiv);
        });

        // initbiResumeDivIdializations after bizCards and bizResumeDivs are created
        divSyncModule.initializeDivSync();
        bizResumtDivSortingModule.initializeSortingSelector();
        bizResumtDivSortingModule.initializeNavigationButtons();
        
        // Apply the current palette to all bizCards - color palette
        paletteSelector.applyPaletteToElements();
        
        // Initialize scrollbar controls - cards vertical scrolling
        viewPort.initScrollbarControls(sceneContainer);
                
        // Add event listeners
        sceneContainer.addEventListener('wheel', autoScroll.handlesceneContainerWheel, { passive: true });
        sceneContainer.addEventListener('scroll', () => {
            // Update parallax effects when scrolling (commented out as parallax module is not available)
            // parallax.renderAllTranslateableDivsAtsceneContainerCenter(sceneContainer);
        });
        window.addEventListener('resize', () => {
            viewPort.updateViewPort(sceneContainer);
            viewPort.updateBullsEyeVerticalPosition();
            // parallax.renderAllTranslateableDivsAtsceneContainerCenter(sceneContainer); (commented out as parallax module is not available)
        });

        // Start auto-scroll
        autoScroll.startAutoScroll(sceneContainer); 

        bizResumeDivScrollingModule.initialization();

    } catch (error) {
        console.error('Failed to initialize application:', error);
        alerts.showError('Failed to initialize application. Please refresh the page.');
    }
}

// Start the application
document.addEventListener('DOMContentLoaded', function() {
    initialize().catch(error => {
        console.error('Failed to initialize application:', error);
        alerts.showError('Failed to initialize application. Please refresh the page.');
    });
});

// Add after DOMContentLoaded event
document.addEventListener('DOMContentLoaded', () => {
    console.log("[Debug] DOM loaded - initializing sorting selector");
    bizResumeDivSortingModule.initializeSortingSelector();
    bizResumeDivSortingModule.initializeNavigationButtons();
});


