import * as viewPort from '../core/viewPort.mjs';
import * as timeline from '../timeline/timeline.mjs';
import * as autoScroll from '../animation/autoScroll.mjs';
import * as focalPoint from '../core/focalPoint.mjs';
import * as dateUtils from '../utils/dateUtils.mjs';
import * as utils from '../utils/utils.mjs';

let _isInitialized = false;

/**
 * Initializes the scene container and its gradient overlays.
 */
export function initialize() {
    if (_isInitialized) {
        console.log("SceneContainer already initialized.");
        return;
    }

    const sceneContainer = document.getElementById('scene-container');
    if (!sceneContainer) {
        console.error("Scene container element not found!");
        return;
    }

    setupGradientOverlays();

    // Any other scene container setup...

    _isInitialized = true;
    console.log("SceneContainer initialized successfully.");
}

export function isInitialized() {
    return _isInitialized;
}

// called from updateResumeContainer
export function updateSceneContainer() {
    // console.log("updateSceneContainer");
    // viewPort updates interal properties and its chlldren
    // using the current sceneContainer.offsetWidth and resumeContainerw.offset
    viewPort.updateViewPort();
}

/**
 * Formats a date range for display
 * @param {string} start - Start date in YYYY-MM-DD format
 * @param {string} end - End date in YYYY-MM-DD format or "CURRENT_DATE"
 * @returns {string} Formatted date range
 */
export function formatDateRange(start, end) {
    const startDate = new Date(start);
    const endDate = end === "CURRENT_DATE" ? new Date() : new Date(end);
    
    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { 
            year: 'numeric',
            month: 'short'
        });
    };
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

/**
 * NOTE: in JavaScript, getFullYear() is a method of the 
 * Date object that returns the full year (a four-digit number) 
 * for the specified date according to local time. It 
 * should be used instead of the deprecated getYear() 
 * method. For example, if you call getFullYear() on a 
 * date object representing 2024-12-25, it will return 
 * 2024. 
 */

/**
 * Gets the vertical position for a given date string
 * @param {string} dateStr - Date in "YYYY-MM-DD" or "YYYY-MM" format, or "CURRENT_DATE"
 * @returns {number} Vertical position
 */
export function getSceneVerticalPositionForDateString(dateStr) {
    let date;
    
    // Validate that input is a string
    if (typeof dateStr !== 'string') {
        throw new Error(`getSceneVerticalPositionForDateString expects a date string, received ${typeof dateStr}: ${dateStr}`);
    }
    
    if (dateStr === "CURRENT_DATE") {
        date = new Date();
    } else if (/^\d{4}-\d{2}$/.test(dateStr)) {
        // If format is YYYY-MM, append -01 to make it YYYY-MM-01
        date = new Date(`${dateStr}-01`);
        if (isNaN(date.getTime())) {
            throw new Error(`Invalid date: ${dateStr}-01`);
        }
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        // If format is already YYYY-MM-DD
        date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            throw new Error(`Invalid date: ${dateStr}`);
        }
    } else {
        throw new Error(`Invalid date string format: ${dateStr}. Expected "CURRENT_DATE", "YYYY-MM-DD", or "YYYY-MM"`);
    }
    
    const yearString = date.getFullYear().toString();
    const monthString = (date.getMonth() + 1).toString().padStart(2, '0');
    // Get position from timeline
    const position = timeline.getTimelineYearMonthBottom(yearString, monthString);
    console.log(`******* yearString:${yearString} monthString:${monthString} -> position:${position}`);

    // Add debug logging
    //console.log(`Date: ${dateStr} -> Year: ${yearString}, Month: ${monthString} -> Position: ${position}`);
    
    return position;
}

/**
 * Formats returns top and bottom scene values 
 * for a given start and end date and a minimum height
 * @param {string} startDateString - Date in "YYYY-MM-DD" or "YYYY-MM" format
 * @param {string} endDateString - Date in "YYYY-MM-DD" or "YYYY-MM" format, or "CURRENT_DATE"
 * @param {number} minHeight - Minimum height if > 0
 * @returns {Object} Object containing sceneTop and sceneBottom values
 */
export function getSceneVerticalPositions(startDateStr, endDateStr, minHeight=0) {
    if (!_isInitialized) {
        console.warn("getSceneVerticalPositions called before initialization");
        initialize(); // Auto-initialize if needed
    }
    
    // Calculate vertical positions based on dates
    let sceneTop = getSceneVerticalPositionForDateString(startDateStr);
    let sceneBottom = getSceneVerticalPositionForDateString(endDateStr);
    let sceneHeight = sceneBottom - sceneTop;
    const centerY = (sceneTop + sceneBottom) / 2;
    if (minHeight > 0 && sceneHeight < minHeight) {
        sceneHeight = minHeight;
        console.warn(`getSceneVerticalPositions: sceneHeight:${sceneHeight} < minHeight:${minHeight}`);
    }
    const halfHeight = sceneHeight / 2;
    sceneTop = centerY - halfHeight;
    sceneBottom = centerY + halfHeight;

    // compare sceneHeight with expected pixels 
    // between startDate and endDate
    const startDate = dateUtils.parseFlexibleDateString(startDateStr);
    if (!(startDate instanceof Date)) {
        throw new Error(`getSceneVerticalPositions: startDate:${startDate} is not a valid Date`);
    }
    
    const today_YYYY_MM_DD = dateUtils.formatISO8601DateOnly(new Date());
    const endDate = endDateStr === "CURRENT_DATE" ? new Date() : 
        dateUtils.parseFlexibleDateString(endDateStr);
    
    if (!(endDate instanceof Date)) {
        throw new Error(`getSceneVerticalPositions: endDate:${endDate} is not a valid Date`);
    }
        
    // Get date difference as an object with years, months, days properties
    const dateDiff = dateUtils.getDateDifference(startDate, endDate);
    
    // Check if dateDiff is an object with the expected properties
    if (!dateDiff || typeof dateDiff !== 'object' || !('years' in dateDiff) || !('months' in dateDiff)) {
        throw new Error(`getDateDifference returned invalid result: ${JSON.stringify(dateDiff)}`);
    }
    
    // Extract years and months from the date difference object
    const { years, months } = dateDiff;
    
    // Calculate years as a fraction
    const years_fraction = years + months/12;
    
    // Calculate expected pixel height based on the date difference
    const expectedPixels = years_fraction * timeline.YEAR_BOTTOM_TO_BOTTOM;
    
    // Calculate the absolute difference between actual and expected pixel heights
    const pixelDiff = utils.abs_diff(expectedPixels, sceneHeight);
    
    // Calculate pixels per month for comparison
    const pixelsPerMonth = timeline.YEAR_BOTTOM_TO_BOTTOM/12;
    
    // Log an error if the difference is greater than one month's worth of pixels
    if (pixelDiff > pixelsPerMonth) {
        console.error(`Date range pixel mismatch: startDate:${startDate} endDate:${endDate} - Expected:${expectedPixels}px, Actual:${sceneHeight}px, Diff:${pixelDiff}px > pixelsPerMonth:${pixelsPerMonth}px`);
    } else {
        console.log(`Date range pixel match: startDate:${startDate} endDate:${endDate} - Expected:${expectedPixels}px, Actual:${sceneHeight}px, Diff:${pixelDiff}px`);
    }
    
    return { sceneTop, sceneBottom };
}

/**
 * Ensure the scene container and its children have proper pointer events
 * This is especially important when the focal point is locked
 */
export function ensurePointerEvents() {
    const sceneContainer = document.getElementById('scene-container');
    if (!sceneContainer) {
        console.error("Scene container not found");
        return;
    }
    
    // Ensure scene container has pointer events
    if (sceneContainer.style.pointerEvents !== 'auto') {
        console.log("Fixing scene container pointer-events");
        sceneContainer.style.pointerEvents = 'auto';
    }
    
    // Ensure all bizCardDivs have pointer events
    const bizCardDivs = sceneContainer.querySelectorAll('.biz-card-div');
    bizCardDivs.forEach(div => {
        if (div.style.pointerEvents !== 'auto') {
            console.log(`Fixing pointer-events for ${div.id}`);
            div.style.pointerEvents = 'auto';
        }
    });
    
    console.log("Scene container and bizCardDivs pointer events fixed");
}

/**
 * Ensures the gradient overlays are properly positioned within the scene container
 */
export function setupGradientOverlays() {
    const scenePlaneEl = document.getElementById('scene-plane');
    if (!scenePlaneEl) {
        console.error("setupGradientOverlays: scene-plane element not found");
        return;
    }

    let topGradient = document.getElementById('scene-plane-top-gradient');
    if (!topGradient) {
        topGradient = document.createElement('div');
        topGradient.id = 'scene-plane-top-gradient';
        scenePlaneEl.prepend(topGradient);
    }

    let btmGradient = document.getElementById('scene-plane-btm-gradient');
    if (!btmGradient) {
        btmGradient = document.createElement('div');
        btmGradient.id = 'scene-plane-btm-gradient';
        scenePlaneEl.prepend(btmGradient);
    }
    
    updateGradientHeights();
}

/**
 * Updates the heights of the gradient overlays based on the timeline's height.
 */
export function updateGradientHeights() {
    const scenePlaneEl = document.getElementById('scene-plane');
    const topGradient = document.getElementById('scene-plane-top-gradient');
    const btmGradient = document.getElementById('scene-plane-btm-gradient');
    const timelineContainer = document.getElementById('timeline-container');

    if (!scenePlaneEl || !topGradient || !btmGradient || !timelineContainer) {
        // This can happen on initial load before timeline is ready.
        // A mutation observer or a delayed call could handle this if needed.
        return;
    }

    const timelineHeight = timelineContainer.offsetHeight;

    if (timelineHeight === 0) {
        console.warn("Timeline not initialized yet, deferring gradient setup");
        setTimeout(updateGradientHeights, 500);
        return;
    }
    
    scenePlaneEl.style.height = `${timelineHeight}px`;

    const gradientHeight = Math.round(timelineHeight * 0.25);
    
    topGradient.style.height = `${gradientHeight}px`;
    btmGradient.style.height = `${gradientHeight}px`;

    console.log(`Updated scene plane height: ${timelineHeight}px, gradient height: ${gradientHeight}px`);
}

/**
 * Scrolls the scene so that the current year and month are at the top,
 * and all previous data is visible above.
 */
export function scrollSceneToCurrentYearMonthTop() {
    const sceneContainer = document.getElementById('scene-container');
    if (!sceneContainer) {
        console.error('scrollSceneToCurrentYearMonthTop: scene-container not found');
        return;
    }
    // Get current year and month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // JS months are 0-based
    // Use timeline util to scroll
    timeline.sceneContainerScrollToYearMonth(sceneContainer, year, month);
}
