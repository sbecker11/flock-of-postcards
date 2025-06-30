// @ts-check

import * as utils from '../utils/utils.mjs';
import * as mathUtils from '../utils/mathUtils.mjs';
import * as sceneContainer from '../scene/sceneContainer.mjs';
import * as dateUtils from '../utils/dateUtils.mjs';
  
//---------------------------------
// TimeLine globals 

const TIMELINE_CONTAINER_ID = 'timeline-container';

let _timelineContainer = null;
let _isInitialized = false;
let _sceneContainer = null;
let _yearMonths = [];

// initizlized in initializeTimeline
var _timelineYearMin = 0;
var _timelineYearMax = 0;
var _defaultYear = null;

export function isInitialized() {
    return _isInitialized;
}

/**
 * Initializes the timeline module.
 * @param {number} startYear - The first year to display on the timeline.
 * @param {number} endYear - The last year to display on the timeline.
 */
export function initialize(startYear, endYear) {
    if (_isInitialized) {
        console.warn("Timeline already initialized.");
        return;
    }
    _timelineYearMin = startYear;
    _timelineYearMax = endYear;
    _timelineContainer = document.getElementById(TIMELINE_CONTAINER_ID);
    if (!_timelineContainer) {
        throw new Error(`Timeline container #${TIMELINE_CONTAINER_ID} not found`);
    }
    _sceneContainer = document.getElementById("scene-container");
    if (!_sceneContainer) {
        throw new Error("Scene container not found for timeline");
    }

    const years = createYears(startYear, endYear);
    renderTimeline(years);
    _isInitialized = true;
    CONSOLE_LOG_IGNORE('Timeline initialized');

    // After the timeline is fully rendered, set the explicit height of the scene plane
    // so that the bottom gradient can correctly position itself.
    const scenePlane = document.getElementById('scene-plane');
    if (scenePlane) {
        const timelineHeight = getTimelineHeight();
        scenePlane.style.height = `${timelineHeight}px`;
    }
}

/**
 * Creates the year elements for the timeline.
 * @param {number} startYear - The first year to create.
 * @param {number} endYear - The last year to create.
 * @returns {Array<Object>} An array of year objects.
 */
function createYears(startYear, endYear) {
    const years = [];
    for (let year = endYear; year >= startYear; year--) {
        const yearData = {
            year: year,
            months: []
        };
        for (let month = 1; month <= 12; month++) {
            yearData.months.push({ month: month });
        }
        years.push(yearData);
    }
    return years;
}

/**
 * Renders the full timeline based on the years data.
 * @param {Array<Object>} years - The array of year objects to render.
 */
function renderTimeline(years) {
    _timelineContainer.innerHTML = ''; // Clear existing timeline
    const alignment = _timelineContainer.classList.contains("timeline-container-left") ? "left" : "right";
    const yearCount = _timelineYearMax - _timelineYearMin + 1;

    years.forEach((yearData, yearIndex) => {
        const yearDiv = document.createElement("div");
        yearDiv.classList.add("year-div", `year-div-${alignment}`);
        yearDiv.innerHTML = alignment === 'left' ? `&nbsp;${yearData.year}` : `${yearData.year}&nbsp;`;

        const yearDivBottom = (yearCount - yearIndex) * YEAR_BOTTOM_TO_BOTTOM;
        yearDiv.style.fontSize = `${YEARDIV_FONTSIZE}px`;
        yearDiv.style.bottom = `${yearDivBottom}px`;
        _timelineContainer.appendChild(yearDiv);

        yearData.months.forEach((monthData, monthIndex) => {
            const monthTick = document.createElement("div");
            monthTick.classList.add("month-tick", `month-tick-${alignment}`);
            const monthStr = utils.zeroPad(monthData.month, 2);
            const monthTickBottom = yearDivBottom - (monthIndex) * YEAR_BOTTOM_TO_BOTTOM / 12;
            
            monthTick.style.fontSize = `${MONTHTICK_FONTSIZE}px`;
            monthTick.style.bottom = `${monthTickBottom}px`;
            monthTick.innerHTML = `${yearData.year}-${monthStr}`;
            _timelineContainer.appendChild(monthTick);
        });
    });
}

/**
 * @returns {number} The total height of the timeline content.
 */
export function getTimelineHeight() {
    if (!_isInitialized) return 0;
    const yearCount = _timelineContainer.querySelectorAll('.year-div').length;
    return (yearCount + 1) * YEAR_BOTTOM_TO_BOTTOM;
}

// the global set of all yearDivBottoms created 
// from _timelineYearMax down to _timelineYearMin
var timelineYearDivBottoms = {};

function inittimelineYearDivBottoms() {
    timelineYearDivBottoms = {}
}

// YEAR dimensions are in px
const YEAR_BOTTOM_TO_BOTTOM = 200;
const YEARDIV_FONTSIZE = 60;
const MONTHTICK_FONTSIZE = 8;

// --------------------------------------
// Timeline functions 
// --------------------------------------

// used to get scene-plane-relative top position for anything 
// take care to always append "px" for pixels

/**
 * Used to initialize timelineYearDivBottoms
 * @param {string} yearStr 
 * @return {number} - pixels from sceneTop
 */
export function getTimelineYearBottom(yearStr) {
    const yearNum = parseInt(yearStr, 10);
    utils.validateFloat(yearNum);
    utils.validateFloat(_timelineYearMin);
    utils.validateFloat(_timelineYearMax);
    const yearOffset = (yearNum - _timelineYearMin + 1) * YEAR_BOTTOM_TO_BOTTOM;
    return yearOffset;
}

/**
 * Used to initialize timelineYearMonthDivBottoms
 * @param {string} yearStr 
 * @param {string} monthStr
 * @return {number} - pixels from sceneTop for given year and month
 */
export function getTimelineYearMonthBottom(yearStr, monthStr) {
    const yearOffset = getTimelineYearBottom(yearStr);
    const monthNum = parseInt(monthStr,10);
    const monthOffset = (monthNum-1) * YEAR_BOTTOM_TO_BOTTOM/12;
    const yearMonthOffset = yearOffset - monthOffset;
    return yearMonthOffset;
}


/**
 * Return the height in pixels for a given span of years
 * @param {number} numYears 
 * @returns {number} pixels used for numYears
 */
export function getTimelineYearsHeight(numYears) {
    return numYears * YEAR_BOTTOM_TO_BOTTOM;
}

export function sceneContainerScrollToYear(_sceneContainer, year) {
    var totalYears = _timelineYearMax - _timelineYearMin + 1;
    if (!Number.isFinite(totalYears) || totalYears <= 0) {
        console.error("Invalid totalYears:", totalYears, _timelineYearMax, _timelineYearMin);
        return;
    }
    if (!_sceneContainer || typeof _sceneContainer.scrollHeight !== 'number' || _sceneContainer.scrollHeight <= 0) {
        console.error("Invalid _sceneContainer or scrollHeight:", _sceneContainer, _sceneContainer && _sceneContainer.scrollHeight);
        return;
    }
    if (!Number.isFinite(year)) {
        console.error("Invalid year:", year);
        return;
    }

    var leftColumScrollPixelsPerYear = _sceneContainer.scrollHeight / totalYears;
    var newScrollTop = (_timelineYearMax - year) * leftColumScrollPixelsPerYear;
    newScrollTop = utils.clampInt(newScrollTop, 0, _sceneContainer.scrollHeight);

    _sceneContainer.scrollTop = newScrollTop;
}

/**
 * Scrolls the scene container so that the given year and month is at the top
 * @param {HTMLElement} sceneContainer - The scene container element
 * @param {number} year - The year to scroll to
 * @param {number} month - The month to scroll to (1-12)
 */
export function sceneContainerScrollToYearMonth(sceneContainer, year, month) {
    if (!sceneContainer || typeof sceneContainer.scrollHeight !== 'number' || sceneContainer.scrollHeight <= 0) {
        console.error("Invalid sceneContainer or scrollHeight:", sceneContainer, sceneContainer && sceneContainer.scrollHeight);
        return;
    }
    if (!Number.isFinite(year) || !Number.isFinite(month)) {
        console.error("Invalid year or month:", year, month);
        return;
    }
    // Clamp month to 1-12
    month = Math.max(1, Math.min(12, month));
    const yearStr = String(year);
    const monthStr = month.toString().padStart(2, '0');
    const yearMonthBottom = getTimelineYearMonthBottom(yearStr, monthStr);
    // Align the TOP of the requested year/month to the top of the container
    const yearMonthTop = yearMonthBottom - (YEAR_BOTTOM_TO_BOTTOM / 12);
    sceneContainer.scrollTop = Math.max(0, yearMonthTop);
}

// Add public getters for timeline year min and max
export function getTimelineYearMin() {
    return _timelineYearMin;
}

export function getTimelineYearMax() {
    return _timelineYearMax;
}

