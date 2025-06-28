// @ts-nocheck
'use strict';

import { jobs } from './static_content/jobs/jobs.mjs';
import * as utils from './modules/utils/utils.mjs';
import * as colorPalettes from './modules/colors/colorPalettes.mjs';
import { resumeListController } from './modules/resume/ResumeListController.mjs';
import { cardsController } from './modules/scene/CardsController.mjs';
import { resumeItemsController } from './modules/scene/ResumeItemsController.mjs';
import * as scenePlane from './modules/scene/scenePlane.mjs';
import * as aimPoint from './modules/core/aimPoint.mjs';
import * as keyDown from './modules/core/keyDown.mjs';
import * as bizResumeDivSortingModule from './modules/scene/bizResumeDivSortingModule.mjs';
import * as bullsEye from './modules/core/bullsEye.mjs';
import * as focalPoint from './modules/core/focalPoint.mjs';
import * as parallax from './modules/core/parallax.mjs';
import * as resizeHandle from './modules/core/resizeHandle.mjs';
import * as resumeContainer from './modules/resume/resumeContainer.mjs';
import * as sceneContainer from './modules/scene/sceneContainer.mjs';
import * as timeline from './modules/timeline/timeline.mjs';
import * as viewPort from './modules/core/viewPort.mjs';
import * as tests from './modules/tests/tests.mjs';
import * as autoScroll from './modules/animation/autoScroll.mjs';
import * as dateUtils from './modules/utils/dateUtils.mjs';

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
    try {
        console.log("Initializing application");

        const sceneContainerEl = document.getElementById('scene-container');
        if (!sceneContainerEl) {
            console.error("main: scene-container element not found, cannot proceed.");
            return;
        }

        // Run sanity tests first
        tests.runSanityTests();

        // STEP 1: Initialize viewPort first as it's a fundamental dependency
        viewPort.initialize();
        // Make viewPort available globally
        window.viewPort = viewPort;
        console.log("ViewPort initialized and made available globally");

        // STEP 2: Initialize bullsEye which depends on viewPort
        bullsEye.initialize();
        console.log("BullsEye initialized");

        // STEP 3: Initialize aimPoint
        aimPoint.initialize();

        // STEP 4: Initialize the resize handle
        resizeHandle.initialize();
        console.log("ResizeHandle initialized");

        // STEP 5: Initialize focalPoint which depends on viewPort and bullsEye
        const focalPointElement = document.getElementById('focal-point');
        if (!focalPointElement) {
            throw new Error("Focal point element not found in the DOM");
        }
        focalPoint.initialize();
        console.log("FocalPoint initialized");
        focalPoint.startFocalPointAnimation();
        console.log("FocalPoint animation started");

        // STEP 6: Initialize the timeline
        const { minYear, maxYear } = dateUtils.getMinMaxYears(jobs);
        timeline.initialize(minYear, maxYear, maxYear);

        // Initialize the scene container now that timeline is ready
        sceneContainer.initialize();

        // Scroll to current year and month at startup
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // getMonth() is 0-based
        if (sceneContainerEl && typeof timeline.sceneContainerScrollToYearMonth === 'function') {
            timeline.sceneContainerScrollToYearMonth(sceneContainerEl, currentYear, currentMonth);
        }

        // STEP 7: Create and initialize resumeListController
        window.resumeListController = resumeListController;
        console.log("ResumeListController instance created");

        // Load color palettes
        paletteSelector = await colorPalettes.initializePaletteSelectorInstance();

        // Wait for jobs to be loaded
        const loadedJobs = await waitForJobs();
        console.log("Jobs loaded successfully:", loadedJobs.length);

        // Sort jobs by date
        const sortedJobs = [...loadedJobs].sort((a, b) => {
            return new Date(b.start) - new Date(a.start);
        });

        // STEP 8: Create all bizCards and bizResumeDivs
        const bizCardDivs = cardsController.createAllBizCardDivs(sortedJobs);
        const bizResumeDivs = resumeItemsController.createAllBizResumeDivs(bizCardDivs);

        // STEP 9: Initialize resumeListController with the created bizResumeDivs
        resumeListController.initialize(sortedJobs, bizResumeDivs);
        console.log("ResumeListController initialized with bizResumeDivs");

        // STEP 10: Initialize other modules
        if (scenePlane) {
            scenePlane.initialize();
        }
        
        // STEP 11: Activate mouse-based scrolling for the scene
        autoScroll.initialize();

        // STEP 12: Initialize CardsController (now that resumeListController is fully initialized)
        cardsController.initialize();
        console.log("CardsController initialized");

        // STEP 13: Set up a delegated event listener for bizResumeDivs
        const resumeContentDiv = document.getElementById('resume-content-div');
        if (resumeContentDiv) {
            resumeContentDiv.addEventListener('click', (event) => {
                const bizResumeDiv = event.target.closest('.biz-resume-div');
                if (bizResumeDiv) {
                    resumeItemsController.handleClickEvent(bizResumeDiv);
                }
            });
        }

        // STEP 14: Initialize sorting after all divs are created
        bizResumeDivSortingModule.initialize(sortedJobs, bizCardDivs);

        // STEP 15: Initialize parallax (depends on viewPort, focalPoint, and bizCardDivs)
        parallax.initialize();
        console.log("Parallax initialized");

        // STEP 16: Ensure bizCardDivs always have pointer events enabled
        cardsController.setupPointerEventsObserver();

        // Force an initial parallax update
        setTimeout(() => {
            parallax.updateParallax("initial-load", true);
        }, 100);

        // Initialize key down handlers
        keyDown.initialize();
        
        console.log("Application initialization complete");
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


