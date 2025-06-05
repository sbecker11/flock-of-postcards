import * as viewPort from '../core/viewPort.mjs';
import * as timeline from '../timeline/timeline.mjs';
import * as autoScroll from '../animation/autoScroll.mjs';
import * as focalPoint from '../core/focalPoint.mjs';

import { Logger, LogLevel } from '../logger.mjs';
const logger = new Logger("sceneContainer", LogLevel.INFO);

export function initializeSceneContainer() {
    console.log("initializeSceneContainer");
    const sceneContainer = document.getElementById("scene-container");
    console.log("initializeSceneContainer: sceneContainer:", sceneContainer);
    const rect = sceneContainer.getBoundingClientRect();
    console.log("initializeSceneContainer: sceneContainerRect:", rect);

    // Initialize scrollbar controls - cards vertical scrolling
    // viewPort.initScrollbarControls(sceneContainer);

    // Start auto-scroll
    autoScroll.startAutoScroll(sceneContainer);
    console.log("initializeSceneContainer: autoScroll started");

    sceneContainer.addEventListener('wheel', autoScroll.handlesceneContainerWheel, { passive: true });
    sceneContainer.addEventListener('scroll', () => {
        // Notify focalPoint of scroll changes for scene-relative viewport calculations
        focalPoint.scrollTopUpdated(sceneContainer.scrollTop);
    });
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
 * Gets the vertical position for a given date
 * @param {Date} date - Date in YYYY-MM-DD format
 * @returns {number} Vertical position
 */
export function getSceneVerticalPositionForDate(date) {
    const yearString = date.getFullYear().toString();
    const monthString = (date.getMonth() + 1).toString();
    return timeline.getTimelineYearMonthBottom(yearString, monthString);
}

/**
 * Formats returns top and bottom scene values 
 * for a given start and end date and a minimum height
 * @param {string} startDateString - Start date in YYYY-MM-DD format
 * @param {string} endDateString - End date in YYYY-MM-DD format or "CURRENT_DATE"
 * @param {number} minHeight - Minimum height if > 0
 * @returns {Object} Object containing sceneTop and sceneBottom  values
 */
export function getSceneVerticalPositions(startDateString, endDateString,  minHeight=100) {
    const startDate = new Date(startDateString);
    const endDate = endDateString === "CURRENT_DATE" ? 
        new Date(): 
        new Date(endDateString); 
    const sceneTop = getSceneVerticalPositionForDate(endDate);
    const sceneBottom = getSceneVerticalPositionForDate(startDate);
    const sceneHeight = sceneBottom - sceneTop;
    // Apply minHeight rule if needed
    if (minHeight > 0) {
        if (sceneHeight < minHeight) {
            const diff = minHeight - sceneHeight;
            const adjustedSceneTop = sceneTop - diff / 2;
            const adjustedSceneHeight = sceneHeight + diff;
            const adjustedSceneBottom = adjustedSceneTop + adjustedSceneHeight;
            return { sceneTop: adjustedSceneTop, sceneBottom: adjustedSceneBottom };
        }
    }
    console.log(`**** getSceneVerticalPositions: endDate:${endDate}, startDate:${startDate}`);
    console.log(`****getSceneVerticalPositions: sceneTop:${sceneTop}, sceneBottom:${sceneBottom}`);
    return { sceneTop: sceneTop, sceneBottom: sceneBottom };
}
