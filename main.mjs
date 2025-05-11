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
import * as viewport from './modules/layout/viewport.mjs';
import * as filters from './modules/layout/filters.mjs';
import * as bizCard from './modules/cards/bizCard.mjs';
import * as skillCard from './modules/cards/skillCard.mjs';
import * as cardUtils from './modules/cards/cardUtils.mjs';
import * as cardConstants from './modules/cards/cardConstants.mjs';
import * as autoScroll from './modules/animation/autoScroll.mjs';
import { initResizeHandle } from './modules/layout/resizeHandle.mjs';
import { initScrollbarControls } from './modules/layout/viewport.mjs';

const logger = new Logger("main", LogLevel.DEBUG);

// --------------------------------------
// Element reference globals

const rightContentDiv = document.getElementById("right-content-div");
const rightColumn = document.getElementById("right-column");
const canvasContainer = document.getElementById("canvas-container");
const canvas = document.getElementById("canvas");
const bottomGradient = document.getElementById("bottom-gradient");
const focalPointElement = document.getElementById("focal-point");
const bullsEye = document.getElementById("bulls-eye");
const selectFirstBizcardButton = document.getElementById("select-first-bizcard");
const selectNextBizcardButton = document.getElementById("select-next-bizcard");
const selectAllBizcardsButton = document.getElementById("select-all-bizcards");
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

const [MIN_TIMELINE_YEAR, MAX_TIMELINE_YEAR] = getMinMaxTimelineYears(jobs);
const DEFAULT_TIMELINE_YEAR = MAX_TIMELINE_YEAR;

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
    document.getElementById("canvas-container").classList.add('no-select');
});

document.addEventListener('mouseup', function() {
    document.body.classList.remove('no-select');
    document.getElementById("canvas-container").classList.remove('no-select');
});

// Initialize the application
async function initialize() {
    try {
        // Initialize color palette selector
        paletteSelector = await getPaletteSelectorInstance();
        
        // Initialize timeline
        timeline.createTimeline(timelineContainer, canvasContainer, MIN_TIMELINE_YEAR, MAX_TIMELINE_YEAR, DEFAULT_TIMELINE_YEAR);
        
        // Create business cards
        const sortedJobs = [...jobs].sort((a, b) => new Date(b.start) - new Date(a.start));
        sortedJobs.forEach((job, index) => {
            const bizCardDiv = bizCard.createBizCardDiv(job, index, canvas);
            
            // Create skill cards for this job
            if (job['job-skills']) {
                Object.entries(job['job-skills']).forEach(([skillId, skillName], skillIndex) => {
                    const skill = { id: skillId, name: skillName };
                    const skillCardDiv = skillCard.createSkillCardDiv(skill, skillIndex, canvas);
                    skillCardDiv.setAttribute('data-biz-card-id', bizCardDiv.id);
                });
            }
        });
        
        // Initialize viewport
        viewport.updateViewport(canvasContainer);
        
        // Initialize scrollbar controls
        initScrollbarControls(canvasContainer);
        
        // Add event listeners
        canvasContainer.addEventListener('wheel', autoScroll.handleCanvasContainerWheel, { passive: true });
        canvasContainer.addEventListener('scroll', () => {
            // Update parallax effects when scrolling
            parallax.renderAllTranslateableDivsAtCanvasContainerCenter(canvasContainer);
        });
        window.addEventListener('resize', () => {
            viewport.updateViewport(canvasContainer);
            viewport.updateBullseyeVerticalPosition();
            parallax.renderAllTranslateableDivsAtCanvasContainerCenter(canvasContainer);
        });
        
        // Initialize resize handle
        const resizeHandle = document.getElementById('resize-handle');
        initResizeHandle(canvasContainer, rightColumn, resizeHandle);

        // Start auto-scroll
        autoScroll.startAutoScroll(canvasContainer);

        // Add button event listeners
        if (selectFirstBizcardButton) {
            selectFirstBizcardButton.addEventListener('click', () => {
                console.log('First button clicked');
                const firstCard = document.getElementById('biz-card-div-0');
                if (firstCard) {
                    firstCard.click();
                    console.log('First card selected:', firstCard.id);
                    selectNextBizcardButton.disabled = false;  // Enable Next button when first card is selected
    } else {
                    console.log('No cards available');
                }
            });
        }

        if (selectNextBizcardButton) {
            selectNextBizcardButton.addEventListener('click', () => {
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

        if (selectAllBizcardsButton) {
            selectAllBizcardsButton.addEventListener('click', () => {
                document.querySelectorAll('.bizcard-div').forEach(card => {
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
            // Update viewport and bullseye position when handle is moved
            viewport.updateViewport(canvasContainer);
            viewport.updateBullseyeVerticalPosition();
            parallax.renderAllTranslateableDivsAtCanvasContainerCenter(canvasContainer);
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