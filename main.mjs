// @ts-nocheck
'use strict';

import { jobs } from './static_content/jobs/jobs.mjs';
import { resumeManager } from './modules/resume/resumeManager.mjs';
import { bizCardDivManager } from './modules/scene/bizCardDivManager.mjs';
import { bizResumeDivManager } from './modules/scene/bizResumeDivManager.mjs';
import * as bizResumeDivSortingModule from './modules/scene/bizResumeDivSortingModule.mjs';
import * as bullsEye from './modules/core/bullsEye.mjs';
import * as colorPalettes from './modules/colors/colorPalettes.mjs';
import * as focalPoint from './modules/core/focalPoint.mjs';
import * as parallax from './modules/core/parallax.mjs';
import { initializeResizeHandle } from './modules/core/resizeHandle.mjs';
import * as resumeContainer from './modules/resume/resumeContainer.mjs';
import * as sceneContainer from './modules/scene/sceneContainer.mjs';
import * as timeline from './modules/timeline/timeline.mjs';
import * as viewPort from './modules/core/viewPort.mjs';
import * as tests from './modules/tests/tests.mjs';
import * as scenePlane from './modules/scene/scenePlane.mjs';

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

// Add global key handler for focalPoint controls
function setupGlobalKeyHandlers() {
    // Import the keyDown module and initialize its handler
    import('./modules/core/keyDown.mjs').then(module => {
        // Initialize the key down handler
        module.initializeKeyDownHandler();
        console.log("Global key handlers set up - press 'b' to toggle focal point lock to bulls-eye");
        
        // Add a test to verify key handlers are working
        window.testKeyHandlers = () => {
            console.log("Testing key handlers...");
            module.checkKeyEventCapture();
        };
        console.log("Added window.testKeyHandlers() function for debugging");
    }).catch(error => {
        console.error('Failed to initialize key handlers:', error);
    });
}

// Add a direct key handler to the document for debugging
function setupDirectKeyHandler() {
    document.addEventListener('keydown', function(event) {
        console.log(`Direct key handler in main.mjs: Key pressed: ${event.key}`);
        
        // Check if the key is 'b'
        if (event.key.toLowerCase() === 'b') {
            console.log("Direct key handler in main.mjs: 'b' key pressed");
            
            // Import the focalPoint module and toggle the lock
            import('./modules/core/focalPoint.mjs').then(module => {
                if (typeof module.toggleLockedToBullsEye === 'function') {
                    const isLocked = module.toggleLockedToBullsEye();
                    console.log(`Direct key handler in main.mjs: Focal point lock toggled to: ${isLocked}`);
                    if (typeof module.logFocalPointState === 'function') {
                        module.logFocalPointState();
                    }
                } else {
                    console.error("Direct key handler in main.mjs: toggleLockedToBullsEye function not found");
                }
            }).catch(error => {
                console.error('Direct key handler in main.mjs: Failed to import focalPoint module:', error);
            });
        }
    });
    
    console.log("Direct key handler set up for debugging in main.mjs");
}

// Initialize the application
async function initialize() {
    tests.runSanityTests();

    try {
        // STEP 1: Initialize viewPort first as it's a fundamental dependency
        viewPort.initializeViewPort();
        // Make viewPort available globally
        window.viewPort = viewPort;
        console.log("ViewPort initialized and made available globally");

        // STEP 2: Initialize bullsEye which depends on viewPort
        bullsEye.initializeBullsEye();
        console.log("BullsEye initialized");

        // STEP 3: Initialize focalPoint which depends on viewPort and bullsEye
        const focalPointElement = document.getElementById('focal-point');
        if (!focalPointElement) {
            throw new Error("Focal point element not found in the DOM");
        }
        focalPoint.initializeFocalPoint(focalPointElement);
        console.log("FocalPoint initialized");

        // STEP 4: Initialize core components in the correct order
        // First sceneContainer (no dependencies)
        sceneContainer.initializeSceneContainer();
        console.log("SceneContainer initialized");

        scenePlane.initializeScenePlane();
        console.log("ScenePlane initialized");

        // Then resizeHandle (depends on sceneContainer)
        initializeResizeHandle();
        console.log("ResizeHandle initialized");

        // Finally resumeContainer (depends on both sceneContainer and resizeHandle)
        resumeContainer.initializeResumeContainer();
        console.log("ResumeContainer initialized");

        // STEP 5: Create and initialize resumeManager
        window.resumeManager = resumeManager;
        console.log("ResumeManager instance created");

        // Load color palettes
        paletteSelector = await colorPalettes.initializePaletteSelectorInstance();

        // Wait for jobs to be loaded
        const loadedJobs = await waitForJobs();
        console.log("Jobs loaded successfully:", loadedJobs.length);

        // Initialize timeline
        const [minTimelineYear, maxTimelineYear] = getMinMaxTimelineYears(loadedJobs);
        const defaultTimelineYear = maxTimelineYear;
        timeline.initializeTimeline(minTimelineYear, maxTimelineYear, defaultTimelineYear);

        // Now that the timeline is initialized, set up the gradient overlays
        sceneContainer.setupGradientOverlays();

        // Scroll to current year and month at startup
        const sceneContainerEl = document.getElementById('scene-container');
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // getMonth() is 0-based
        if (sceneContainerEl && typeof timeline.sceneContainerScrollToYearMonth === 'function') {
            timeline.sceneContainerScrollToYearMonth(sceneContainerEl, currentYear, currentMonth);
        }

        // Sort jobs by date
        const sortedJobs = [...loadedJobs].sort((a, b) => {
            return new Date(b.start) - new Date(a.start);
        });

        // STEP 6: Create all bizCards and bizResumeDivs
        const bizCardDivs = bizCardDivManager.createAllBizCardDivs(sortedJobs);
        const bizResumeDivs = bizResumeDivManager.createAllBizResumeDivs(bizCardDivs);

        // STEP 7: Initialize resumeManager with the created bizResumeDivs
        resumeManager.initialize(sortedJobs, bizResumeDivs);
        console.log("ResumeManager initialized with bizResumeDivs");

        // STEP 8: Initialize bizCardDivModule (now that resumeManager is fully initialized)
        bizCardDivManager.initialize();
        console.log("BizCardDivModule initialized");

        // STEP 9: Set up a delegated event listener for bizResumeDivs
        const resumeContentDiv = document.getElementById('resume-content-div');
        if (resumeContentDiv) {
            resumeContentDiv.addEventListener('click', (event) => {
                const bizResumeDiv = event.target.closest('.biz-resume-div');
                if (bizResumeDiv) {
                    bizResumeDivManager.handleClickEvent(bizResumeDiv);
                }
            });
        }

        // STEP 10: Initialize sorting after all divs are created
        bizResumeDivSortingModule.initialize(sortedJobs, bizCardDivs);

        // STEP 11: Initialize parallax (depends on viewPort, focalPoint, and bizCardDivs)
        parallax.initializeParallax();
        console.log("Parallax initialized");

        // STEP 12: Ensure bizCardDivs always have pointer events enabled
        bizCardDivManager.setupPointerEventsObserver();

        // Force an initial parallax update
        setTimeout(() => {
            parallax.updateParallax("initial-load", true);
        }, 100);

        // Start animation loop
        focalPoint.startFocalPointAnimation();

        // STEP 13: Set up global key handlers
        setupGlobalKeyHandlers();
        
        // STEP 14: Set up direct key handler for debugging
        setupDirectKeyHandler();
        
        // Focal lock button toggle logic
        const focalLockBtn = document.getElementById('focal-lock');
        if (focalLockBtn) {
            focalLockBtn.addEventListener('click', () => {
                if (focalLockBtn.classList.contains('locked')) {
                    focalLockBtn.classList.remove('locked');
                    focalLockBtn.classList.add('unlocked');
                } else {
                    focalLockBtn.classList.remove('unlocked');
                    focalLockBtn.classList.add('locked');
                }
            });
        }
        
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


