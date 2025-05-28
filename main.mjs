// @ts-nocheck
'use strict';

import { jobs } from './static_content/jobs/jobs.mjs';
import * as domUtils from './modules/utils/domUtils.mjs';
import * as mathUtils from './modules/utils/mathUtils.mjs';
import * as timeline from './modules/timeline/timeline.mjs';
import * as focalPoint from './modules/core/focalPoint.mjs';
import * as colorPalettes from './modules/color/colorPalettes.mjs';
import * as colorUtils from './modules/color/colorUtils.mjs';
import * as bizResumeDivSortingModule from './modules/scene/bizResumeDivSortingModule.mjs';
import * as bizCardDivModule from './modules/scene/bizCardDivModule.mjs';
import * as divSyncModule from './modules/scene/divSyncModule.mjs';
import * as bizResumeDivScrollingModule from './modules/scene/bizResumeDivScrollingModule.mjs';
import * as bizResumtDivSortingModule from './modules/scene/bizResumeDivSortingModule.mjs';
import * as zIndex from './modules/core/zIndex.mjs';
import * as parallax from './modules/core/parallax.mjs';
import * as viewPort from './modules/core/viewPort.mjs';
import * as filters from './modules/core/filters.mjs';
import * as cardConstants from './modules/scene/cardConstants.mjs';
import * as autoScroll from './modules/animation/autoScroll.mjs';
import * as resizeHandle from './modules/core/resizeHandle.mjs';
import * as bullsEye from './modules/core/bullsEye.mjs';
import * as aimPoint from './modules/core/aimPoint.mjs';
import * as resumeContainer from './modules/resume/resumeContainer.mjs';
import * as sceneContainer from './modules/scene/sceneContainer.mjs';

import { Logger, LogLevel } from "./modules/logger.mjs";
const logger = new Logger("main", LogLevel.DEBUG);


// --------------------------------------
// Element reference globals

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
    console.log("loaded job.length:", jobs.length);

    try {
        // load color palettes for palette selector
        colorPalettes.initializeColorPalettes();
        paletteSelector = await colorPalettes.getPaletteSelectorInstance();

        // Get DOM elements for containers
        const resumeContainerElem = document.getElementById('resume-container');
        const sceneContainerElem = document.getElementById('scene-container');

        // Update resume container so it is sized before viewport logic
        resumeContainer.initializeResumeContainer();

        // Now containers should have correct sizes

        // Initialize viewPort and getBullsEyeElement() first, now that containers are sized
        viewPort.initializeViewPort();

        // Initialize timeline
        const [minTimelineYear, maxTimelineYear] = getMinMaxTimelineYears(jobs);
        const defaultTimelineYear = maxTimelineYear;
        const _timelineContainer = document.getElementById("timeline-container");
        timeline.createTimeline(_timelineContainer, sceneContainerElem, minTimelineYear, maxTimelineYear, defaultTimelineYear);

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
            const bizCardDiv = bizCardDivModule.createBizCardDiv(job, index);

            const bizCardDivId = bizCardDiv.id;
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
        //viewPort.initScrollbarControls(sceneContainer);

        // Add event listeners
        sceneContainerElem.addEventListener('wheel', autoScroll.handlesceneContainerWheel, { passive: true });
        sceneContainerElem.addEventListener('scroll', () => {
            // Update parallax effects when scrolling (commented out as parallax module is not available)
            // parallax.renderAllTranslateableDivsAtsceneContainerCenter(sceneContainerElem);
        });

        window.addEventListener('load', () => {
            resumeContainer.updateResumeContainer();
        });
        window.addEventListener('resize', () => {
            resumeContainer.updateResumeContainer();
        });

        // Start auto-scroll
        autoScroll.startAutoScroll(sceneContainerElem);

        bizResumeDivScrollingModule.initialization();

        // Now that everything is initialized, call focalPoint.handleOnWindowLoad()
        focalPoint.handleOnWindowLoad();
    } catch (error) {
        console.error('Failed to initialize application:', error);
    }
}

// Start the application
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await initialize();
        bizResumeDivSortingModule.initializeSortingSelector();
        bizResumeDivSortingModule.initializeNavigationButtons();

    } catch (error) {
        console.error('Failed to initialize application:', error);
    }
});


