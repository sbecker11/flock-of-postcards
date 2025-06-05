// @ts-nocheck
'use strict';

import { jobs } from './static_content/jobs/jobs.mjs';
import * as domUtils from './modules/utils/domUtils.mjs';
import * as mathUtils from './modules/utils/mathUtils.mjs';
import * as timeline from './modules/timeline/timeline.mjs';
import * as focalPoint from './modules/core/focalPoint.mjs';
import * as colorPalettes from './modules/color/colorPalettes.mjs';
import * as colorUtils from './modules/color/colorUtils.mjs';
import * as bizCardDivModule from './modules/scene/bizCardDivModule.mjs';
import * as bizResumeDivModule from './modules/scene/bizResumeDivModule.mjs';
// import * as divSyncModule from './modules/scene/divSyncModule.mjs';
import * as bizResumeDivSortingModule from './modules/scene/bizResumeDivSortingModule.mjs';
import * as zIndex from './modules/core/zIndex.mjs';
import * as parallax from './modules/core/parallax.mjs';
import * as viewPort from './modules/core/viewPort.mjs';
import * as filters from './modules/core/filters.mjs';
import * as resizeHandle from './modules/core/resizeHandle.mjs';
import * as bullsEye from './modules/core/bullsEye.mjs';
import * as aimPoint from './modules/core/aimPoint.mjs';
import * as resumeContainer from './modules/resume/resumeContainer.mjs';
import * as sceneContainer from './modules/scene/sceneContainer.mjs';
import { ResumeManager } from './modules/resume/resumeManager.mjs';

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


// Default mouse behavior: prevent selections while mouse is down
document.addEventListener('mousedown', function() {
    document.body.classList.add('no-select');
    document.getElementById("scene-container").classList.add('no-select');
});

document.addEventListener('mouseup', function() {
    document.body.classList.remove('no-select');
    document.getElementById("scene-container").classList.remove('no-select');
});

function runSanityTests() {
    // sanity check for z and z_index functions
    zIndex.test_z_functions();
    // sanity check for color utils
    colorUtils.testColorUtils();
    // sanity check for math utils
    mathUtils.testMathUtils();  
}

// Initialize the application
async function initialize() {

    runSanityTests();

    console.log("loaded job.length:", jobs.length);

    try {
        // load color palettes for the palette selector
        paletteSelector = await colorPalettes.initializePaletteSelectorInstance();

        // Initialize viewPort and getBullsEyeElement() first, now that containers are sized
        viewPort.initializeViewPort();

        bullsEye.initializeBullsEye();

        resizeHandle.initializeResizeHandle();

        resumeContainer.initializeResumeContainer();

        // Initialize timeline
        const [minTimelineYear, maxTimelineYear] = getMinMaxTimelineYears(jobs);
        const defaultTimelineYear = maxTimelineYear;
        timeline.initializeTimeline(minTimelineYear, maxTimelineYear, defaultTimelineYear);


    /**
        * Create bizCardDivs after the following
        * have been initialized:
        * viewPort, 
        * bullsEye
        * timeLine
        * resizeHandle 
        * colorPalettes 
        */
        if (!Array.isArray(jobs)) {
            const jobType = typeof jobs;
            ("jobType:", jobType);
            logger.error("jobType:", jobType);
        }
        const sortedJobs = [...jobs].sort((a, b) => new Date(b.start) - new Date(a.start));

        // Create all bizCards
        const bizResumeDivs = [];
        sortedJobs.forEach((job, index) => { // jobs loader
            // Create the bizCardDiv
            if ( !job ) throw new Error('createBizCardDiv: given null job');
            if ( !Number.isInteger(index) ) throw new Error('createBizCardDiv: given non-integer index');
            const bizCardDiv = bizCardDivModule.createBizCardDiv(job, index);
            const bizCardDivId = bizCardDiv.id;
            const checkBizCardDiv = document.getElementById(bizCardDivId);
            if (!checkBizCardDiv) throw new Error("bizCardDiv is not found for bizCardDivId:", bizCardDivId);

            const bizResumeDiv = bizResumeDivModule.createBizResumeDiv(bizCardDiv);
            if ( !bizResumeDiv ) throw new Error('createBizResumeDiv: given null bizResumeDiv');
            bizResumeDivs.push(bizResumeDiv);
        });

        // after bizResumeDivs are created
        bizResumeDivSortingModule.initialize(sortedJobs, bizResumeDivs);

        // Add event listeners
        sceneContainer.initializeSceneContainer();

        // Initialize parallax effects
        parallax.initializeParallax();

        // Initialize focal point after everything else is initialized
        focalPoint.initializeFocalPoint();

        // Start the focal point animation loop for parallax effects
        focalPoint.startFocalPointAnimation();

    } catch (error) {
        console.error('Failed to initialize application:', error);
    }
}

// Start the application
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await initialize();

    } catch (error) {
        console.error('Failed to initialize application:', error);
    }
});


