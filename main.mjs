// @ts-nocheck
'use strict';

import * as typeValidators from './modules/utils/typeValidators.mjs';
import * as colorUtils from './modules/utils/colorUtils.mjs';
import * as domUtils from './modules/utils/domUtils.mjs';
import * as arrayUtils from './modules/utils/arrayUtils.mjs';
import * as typeConversions from './modules/utils/typeConversions.mjs';
import * as timeline from './modules/timeline.mjs';
import * as focalPoint from './modules/focal_point.mjs';
import * as alerts from './modules/alerts.mjs';
import { getPaletteSelectorInstance } from './modules/color_palettes.mjs';
import { Logger, LogLevel } from "./modules/logger.mjs";
import { jobs } from './static_content/jobs/jobs.mjs';

// Import new modules
import * as zIndex from './modules/layout/zIndex.mjs';
import * as parallax from './modules/layout/parallax.mjs';
import * as viewPort from './modules/layout/viewPort.mjs';
import * as filters from './modules/layout/filters.mjs';
import * as bizCard from './modules/cards/bizCardDiv.mjs';
// import * as skillCard from './modules/cards/skillCard.mjs';
import * as cardUtils from './modules/cards/cardUtils.mjs';
import * as cardConstants from './modules/cards/cardConstants.mjs';
import * as autoScroll from './modules/animation/autoScroll.mjs';
import { initResizeHandle } from './modules/layout/resizeHandle.mjs';
import { initScrollbarControls } from './modules/layout/viewPort.mjs';

const logger = new Logger("main", LogLevel.DEBUG);

// --------------------------------------
// Element reference globals

const rightContentDiv = document.getElementById("right-content-div");
const rightColumn = document.getElementById("right-column");
const sceneContainer = document.getElementById("scene-container");
const sceneDiv = document.getElementById("scene-div");
const bottomGradient = document.getElementById("bottom-gradient");
const focalPointElement = document.getElementById("focal-point");
const bullsEye = document.getElementById("bulls-eye");
const selectFirstBizCardButton = document.getElementById("select-first-bizCard");
const selectNextBizCardButton = document.getElementById("select-next-bizCard");
const selectAllBizCardsButton = document.getElementById("select-all-bizCards");
const clearAllLineItemsButton = document.getElementById("clear-all-line-items");
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
    try {
        // Initialize color palette selector and wait for it to be ready
        paletteSelector = await getPaletteSelectorInstance();
        
        // Ensure a palette is selected before proceeding
        if (!paletteSelector.current_value) {
            throw new Error("No palette selected. Cannot proceed with initialization.");
        }

        const [minTimelineYear, maxTimelineYear] = getMinMaxTimelineYears(jobs);
        const defaultTimelineYear = maxTimelineYear;

        // Initialize timeline
        timeline.createTimeline(timelineContainer, sceneContainer, minTimelineYear, maxTimelineYear, defaultTimelineYear);
        
        // Initialize viewPort and bullsEye first
        viewPort.createViewPort(sceneContainer);
        viewPort.updateViewPort(sceneContainer);
        viewPort.updateBullsEyeVerticalPosition();
        
        // Initialize resize handle
        const resizeHandle = document.getElementById('resize-handle');
        initResizeHandle(sceneContainer, rightColumn, resizeHandle);
        
        // sanity check for z and z_index functions
        zIndex.test_z_functions();

        // Create business cards after viewPort and bullsEye are initialized
        const sortedJobs = [...jobs].sort((a, b) => new Date(b.start) - new Date(a.start));
        // Create all bizCards
        sortedJobs.forEach((job, index) => {
            // Create the bizCard div
            const bizCardDiv = bizCard.createBizCardDiv(job, index);

            // Append the bizCard div to the sceneDiv
            sceneDiv.appendChild(bizCardDiv);
        });
        
        // Apply the current palette to all bizCards
        paletteSelector.applyPaletteToElements();
        
        // Initialize scrollbar controls
        initScrollbarControls(sceneContainer);
        
        // Add event listeners
        sceneContainer.addEventListener('wheel', autoScroll.handlesceneContainerWheel, { passive: true });
        sceneContainer.addEventListener('scroll', () => {
            // Update parallax effects when scrolling
            parallax.renderAllTranslateableDivsAtsceneContainerCenter(sceneContainer);
        });
        window.addEventListener('resize', () => {
            viewPort.updateViewPort(sceneContainer);
            viewPort.updateBullsEyeVerticalPosition();
            parallax.renderAllTranslateableDivsAtsceneContainerCenter(sceneContainer);
        });

        // Start auto-scroll
        autoScroll.startAutoScroll(sceneContainer);

        // Add button event listeners
        if (selectFirstBizCardButton) {
            selectFirstBizCardButton.addEventListener('click', () => {
                console.log('First button clicked');
                const firstCard = document.getElementById('biz-card-div-0');
                if (firstCard) {
                    firstCard.click();
                    console.log('First card selected:', firstCard.id);
                    selectNextBizCardButton.disabled = false;  // Enable Next button when first card is selected
                } else {
                    console.log('No cards available');
                }
            });
        }

        if (selectNextBizCardButton) {
            selectNextBizCardButton.addEventListener('click', () => {
                console.log('Next button clicked');
                const selectedCard = document.querySelector('.biz-card-div.selected');
                if (selectedCard) {
                    // Get the current card's index from its ID
                    const currentIndex = parseInt(selectedCard.id.replace('biz-card-div-', ''));
                    console.log('Current card index:', currentIndex);
                    
                    // Find the next card by its ID, or loop back to 0 if at the end
                    const nextIndex = currentIndex + 1;
                    const nextCard = document.getElementById(`biz-card-div-${nextIndex}`);
                    if (nextCard) {
                        nextCard.click();
                        console.log('Next card selected:', nextCard.id);
                    } else {
                        // If no next card exists, loop back to the first card (index 0)
                        const firstCard = document.getElementById('biz-card-div-0');
                        if (firstCard) {
                            firstCard.click();
                            console.log('Looped back to first card:', firstCard.id);
                        } else {
                            console.log('No cards available');
                        }
                    }
                } else {
                    // If no card is selected, select the first card
                    const firstCard = document.getElementById('biz-card-div-0');
                    if (firstCard) {
                        firstCard.click();
                        console.log('No card selected, selecting first card:', firstCard.id);
                    } else {
                        console.log('No cards available');
                    }
                }
            });
        }

        // Remove the click handler that manages Next button state since it's no longer needed
        document.removeEventListener('click', (e) => {
            if (e.target.classList.contains('biz-card-div')) {
                console.log('Card clicked:', e.target.id);
            }
        });

        if (selectAllBizCardsButton) {
            selectAllBizCardsButton.addEventListener('click', () => {
                document.querySelectorAll('.bizCard-div').forEach(card => {
                    card.classList.add('selected');
                });
            });
        }

        if (clearAllLineItemsButton) {
            clearAllLineItemsButton.addEventListener('click', () => {
                document.querySelectorAll('.card-div-line-item').forEach(item => {
                    item.remove();
                });
            });
        }

        let isDragging = false;
        let startX = 0;
        let startLeft = 0;

        resizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isDragging = true;
            startX = e.clientX;
            startLeft = parseInt(window.getComputedStyle(resizeHandle).left);
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const newLeft = Math.max(0, Math.min(window.innerWidth - resizeHandle.offsetWidth, startLeft + dx));
            resizeHandle.style.left = `${newLeft}px`;
            // Update viewPort and bullsEye position when handle is moved
            viewPort.updateViewPort(sceneContainer);
            viewPort.updateBullsEyeVerticalPosition();
            parallax.renderAllTranslateableDivsAtsceneContainerCenter(sceneContainer);
        });

    } catch (error) {
        console.error('Failed to initialize application:', error);
        alerts.showError('Failed to initialize application. Please refresh the page.');
    }
}

// Start the application
initialize().catch(error => {
    console.error('Failed to initialize application:', error);
    alerts.showError('Failed to initialize application. Please refresh the page.');
});