import * as viewPort from '../core/viewPort.mjs';
import * as timeline from '../timeline/timeline.mjs';
import * as autoScroll from '../animation/autoScroll.mjs';
import * as focalPoint from '../core/focalPoint.mjs';
import * as dateUtils from '../utils/dateUtils.mjs';
import * as utils from '../utils/utils.mjs';

let isInitialized = false;

export function initializeSceneContainer() {
    if (isSceneContainerInitialized()) {
        console.log("initializeSceneContainer: Scene container already initialized, ignoring duplicate initialization request");
        return;
    }
    
    // Set up the scene container
    const sceneContainer = document.getElementById('scene-container');
    if (!sceneContainer) {
        throw new Error('Scene container element not found');
    }
    
    // Initialize any scene-related properties
    // ...
    
    isInitialized = true;
    console.log("Scene container initialized");
}

export function isSceneContainerInitialized() {
    return isInitialized;
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
    if (!isInitialized) {
        console.warn("getSceneVerticalPositions called before initialization");
        initializeSceneContainer(); // Auto-initialize if needed
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
    const sceneContainer = document.getElementById('scene-container');
    const scenePlane = document.getElementById('scene-plane');
    const topGradient = document.getElementById('scene-plane-top-gradient');
    const btmGradient = document.getElementById('scene-plane-btm-gradient');
    const timelineContainer = document.getElementById('timeline-container');
    
    if (!sceneContainer || !scenePlane || !topGradient || !btmGradient || !timelineContainer) {
        console.error("Missing elements for gradient setup");
        return;
    }
    
    // Check if timeline is initialized
    if (!timeline.isTimelineInitialized()) {
        console.warn("Timeline not initialized yet, deferring gradient setup");
        // Set up a retry mechanism
        setTimeout(setupGradientOverlays, 500);
        return;
    }
    
    // Remove gradients from current parent
    if (topGradient.parentNode) {
        topGradient.parentNode.removeChild(topGradient);
    }
    
    if (btmGradient.parentNode) {
        btmGradient.parentNode.removeChild(btmGradient);
    }
    
    // Add gradients to scene plane
    scenePlane.appendChild(topGradient);
    scenePlane.appendChild(btmGradient);
    
    // Calculate the total height of the timeline
    const timelineHeight = timeline.getTimelineHeight();
    
    // Calculate gradient height as 25% of the timeline height
    // This means each gradient will cover about 10 years (25% of 40 years)
    const gradientHeight = Math.round(timelineHeight * 0.25);
    
    // Set the scene plane height to match the timeline height
    scenePlane.style.height = `${timelineHeight}px`;
    
    // Set up styles for top gradient
    topGradient.style.position = 'absolute';
    topGradient.style.top = '0';
    topGradient.style.left = '0';
    topGradient.style.right = '0';
    topGradient.style.height = `${gradientHeight}px`;
    topGradient.style.zIndex = '2';

    // Position the bottom gradient at the bottom of the timeline
    btmGradient.style.position = 'absolute';
    btmGradient.style.bottom = '0';
    btmGradient.style.left = '0';
    btmGradient.style.right = '0';
    btmGradient.style.height = `${gradientHeight}px`;
    btmGradient.style.zIndex = '2';
    
    console.log(`Gradient overlays set up with timeline height: ${timelineHeight}px, gradient height: ${gradientHeight}px`);
    
    // Ensure the scene plane and gradients update when the timeline changes
    const resizeObserver = new ResizeObserver(() => {
        const updatedTimelineHeight = timeline.getTimelineHeight();
        scenePlane.style.height = `${updatedTimelineHeight}px`;
        const updatedGradientHeight = Math.round(updatedTimelineHeight * 0.25);
        topGradient.style.height = `${updatedGradientHeight}px`;
        btmGradient.style.height = `${updatedGradientHeight}px`;
        console.log(`Updated scene plane height: ${updatedTimelineHeight}px, gradient height: ${updatedGradientHeight}px`);
    });
    
    resizeObserver.observe(timelineContainer);
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
