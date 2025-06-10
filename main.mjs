// @ts-nocheck
'use strict';

import { jobs } from './static_content/jobs/jobs.mjs';
import { ResumeManager } from './modules/resume/resumeManager.mjs';
import * as bizCardDivModule from './modules/scene/bizCardDivModule.mjs';
import * as bizResumeDivModule from './modules/scene/bizResumeDivModule.mjs';
import * as bizResumeDivSortingModule from './modules/scene/bizResumeDivSortingModule.mjs';
import * as bullsEye from './modules/core/bullsEye.mjs';
import * as colorPalettes from './modules/colors/colorPalettes.mjs';
import * as focalPoint from './modules/core/focalPoint.mjs';
import * as parallax from './modules/core/parallax.mjs';
import * as resizeHandle from './modules/core/resizeHandle.mjs';
import * as resumeContainer from './modules/resume/resumeContainer.mjs';
import * as sceneContainer from './modules/scene/sceneContainer.mjs';
import * as timeline from './modules/timeline/timeline.mjs';
import * as viewPort from './modules/core/viewPort.mjs';
import * as tests from './modules/tests/tests.mjs';

import { Logger, LogLevel } from "./modules/logger.mjs";
const logger = new Logger("main", LogLevel.DEBUG);

// --------------------------------------
// Constants

// Job loading constants
const MAX_JOB_LOADING_ATTEMPTS = 10;
const JOB_LOADING_DELAY_MS = 300;

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

/**
 * Wait for jobs to be fully loaded
 * @returns {Promise<Array>} - The loaded jobs array
 */
async function waitForJobs() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        
        const checkJobs = () => {
            attempts++;
            console.log(`Checking for jobs (attempt ${attempts}/${MAX_JOB_LOADING_ATTEMPTS})...`);
            
            if (jobs && jobs.length > 0) {
                console.log(`Jobs loaded successfully: ${jobs.length} jobs found`);
                resolve(jobs);
                return;
            }
            
            if (attempts >= MAX_JOB_LOADING_ATTEMPTS) {
                reject(new Error(`Failed to load jobs after ${MAX_JOB_LOADING_ATTEMPTS} attempts`));
                return;
            }
            
            console.log(`Jobs not loaded yet, waiting ${JOB_LOADING_DELAY_MS}ms...`);
            setTimeout(checkJobs, JOB_LOADING_DELAY_MS);
        };
        
        checkJobs();
    });
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

// Initialize the application
async function initialize() {
    tests.runSanityTests();

    try {
        // STEP 1: Initialize viewPort first as it's a fundamental dependency
        viewPort.initializeViewPort();
        console.log("ViewPort initialized");
        
        // STEP 2: Initialize bullsEye which depends on viewPort
        bullsEye.initializeBullsEye();
        console.log("BullsEye initialized");
        
        // STEP 3: Initialize other core components
        resizeHandle.initializeResizeHandle();
        resumeContainer.initializeResumeContainer();
        sceneContainer.initializeSceneContainer();
        
        // STEP 4: Initialize bizCardDivModule
        bizCardDivModule.initializeBizCardDivModule();
        console.log("BizCardDivModule initialized");
        
        // Load color palettes
        paletteSelector = await colorPalettes.initializePaletteSelectorInstance();
        
        // Wait for jobs to be loaded
        const loadedJobs = await waitForJobs();
        console.log("Jobs loaded successfully:", loadedJobs.length);
        
        // Initialize timeline
        const [minTimelineYear, maxTimelineYear] = getMinMaxTimelineYears(loadedJobs);
        const defaultTimelineYear = maxTimelineYear;
        timeline.initializeTimeline(minTimelineYear, maxTimelineYear, defaultTimelineYear);
        
        // Sort jobs by date
        const sortedJobs = [...loadedJobs].sort((a, b) => {
            return new Date(b.start) - new Date(a.start);
        });
        
        // STEP 5: Initialize focal point (depends on viewPort and bullsEye)
        focalPoint.initializeFocalPoint();
        console.log("Focal point initialized");
        
        // STEP 6: Create all bizCards (depends on viewPort for positioning)
        const bizResumeDivs = [];
        sortedJobs.forEach((job, index) => {
            if (!job) throw new Error('createBizCardDiv: given null job');
            if (!Number.isInteger(index)) throw new Error('createBizCardDiv: given non-integer index');
            
            const bizCardDiv = bizCardDivModule.createBizCardDiv(job, index);
            const bizCardDivId = bizCardDiv.id;
            const checkBizCardDiv = document.getElementById(bizCardDivId);
            if (!checkBizCardDiv) throw new Error(`bizCardDiv is not found for bizCardDivId: ${bizCardDivId}`);

            const bizResumeDiv = bizResumeDivModule.createBizResumeDiv(bizCardDiv);
            if (!bizResumeDiv) throw new Error('createBizResumeDiv: given null bizResumeDiv');
            bizResumeDivs.push(bizResumeDiv);
        });
        
        // STEP 7: Set up event listeners for bizResumeDivs
        bizResumeDivModule.setupEventListeners();
        console.log("Set up event listeners for all bizResumeDivs");

        // STEP 8: Initialize sorting after all divs are created
        bizResumeDivSortingModule.initialize(sortedJobs, bizResumeDivs);

        // STEP 9: Set geometry for all bizCardDivs
        bizCardDivModule.setGeometryForAllBizCardDivs(sortedJobs);
        console.log("Verified geometry for all bizCardDivs");

        // STEP 10: Initialize parallax (depends on viewPort, focalPoint, and bizCardDivs)
        parallax.initializeParallax();
        console.log("Parallax initialized");

        // STEP 11: Ensure bizCardDivs always have pointer events enabled
        bizCardDivModule.setupPointerEventsObserver();

        // Force an initial parallax update
        setTimeout(() => {
            parallax.updateParallax("initial-load", true);
        }, 100);

        // Start animation loop
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


