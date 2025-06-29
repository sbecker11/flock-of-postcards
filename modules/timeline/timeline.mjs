// @ts-check

import * as utils from '../utils/utils.mjs';
import * as mathUtils from '../utils/mathUtils.mjs';
import * as sceneContainer from '../scene/sceneContainer.mjs';
  
//---------------------------------
// TimeLine globals 

// @ts-ignore
var _timelineContainer = null;
// @ts-ignore
var _sceneContainer = null;

// initizlized in initializeTimeline
var _timelineYearMin = 0;
var _timelineYearMax = 0;
var _defaultYear = null;

let _timelineIsInitialized = false;

export function isTimelineInitialized() {
    return _timelineIsInitialized;
}

/**
 * initializes the timeLineContainer
 * @param {*} minYear : int
 * @param {*} maxYear : int
 * @param {*} defaultYear : any optional
 */
export function initialize(minYear, maxYear, defaultYear=null) {
    if (isTimelineInitialized()) {
        console.log("initializeTimeline: Timeline already initialized, ignoring duplicate initialization request");
        return;
    }
    _timelineContainer = document.getElementById("timeline-container");
    if ( !_timelineContainer ) throw new Error("timeline-container not found");
    _sceneContainer = document.getElementById("scene-container");
    if ( !_sceneContainer ) throw new Error("sceneContainer not found");
    _timelineYearMin = minYear;
    if ( _timelineYearMin === undefined ) throw new Error("_timelineYearMin is undefined"); 
    _timelineYearMax = maxYear;
    if ( _timelineYearMax === undefined ) throw new Error("_timelineYearMax is undefined");
    if ( _timelineYearMin > _timelineYearMax ) throw new Error("_timelineYearMin > _timelineYearMax");  
    if ( defaultYear === null ) {
        defaultYear = _timelineYearMax;
    }
    if ( defaultYear < _timelineYearMin || defaultYear > _timelineYearMax ) throw new Error("defaultYear out of range"); 
    _defaultYear = defaultYear;
    
    inittimelineYearDivBottoms();

    var alignment = _timelineContainer.classList.contains("timeline-timelineContainer-left") ? "left" : "right";

    // year starts at the top at the maxYear
    for (var year = _timelineYearMax; year >= _timelineYearMin; year--) {
        var yearDiv = document.createElement("div");
        yearDiv.classList.add("year-div");

        if (alignment == "left") {
            yearDiv.classList.add("year-div-left");
            yearDiv.innerHTML = `&nbsp;${year}`;
        }
        else {
            yearDiv.classList.add("year-div-right");
            yearDiv.innerHTML = `${year}&nbsp;`;
        }

        var row = _timelineYearMax - year;
        var yearDivBottom = (row + 1) * YEAR_BOTTOM_TO_BOTTOM;
        const yearStr = `${year}`;
        timelineYearDivBottoms[yearStr] = yearDivBottom;
        const checkYearDivBottom = getTimelineYearBottom(yearStr);
        if ( checkYearDivBottom != yearDivBottom ) {
            console.error(`checkYearBtm:${checkYearDivBottom} != calcYearBtm:${yearDivBottom} `);
        }
        console.assert(checkYearDivBottom == yearDivBottom);

        yearDiv.style.fontSize = `${YEARDIV_FONTSIZE}px`;
        yearDiv.style.height = `${YEARDIV_FONTSIZE}px`;
        yearDiv.style.bottom = `${yearDivBottom}px`;
        yearDiv.style.top = `${yearDivBottom - YEARDIV_FONTSIZE}px`;
        _timelineContainer.appendChild(yearDiv);

        for (var month = 1; month <= 12; month++) {
            var monthTick = document.createElement("div");
            monthTick.classList.add("month-tick");
            if (alignment == "left")
                monthTick.classList.add("month-tick-left");
            else
                monthTick.classList.add("month-tick-right");
            var monthStr = utils.zeroPad(month, 2);
            var monthTickBottom = getTimelineYearMonthBottom(year.toString(), monthStr);
            var checkYearMonthTick = yearDivBottom - (month - 1) * YEAR_BOTTOM_TO_BOTTOM / 12;
            console.assert(checkYearMonthTick == monthTickBottom);

            monthTick.style.fontSize = `${MONTHTICK_FONTSIZE}px`;
            monthTick.style.height = `${MONTHTICK_FONTSIZE}px`;
            monthTick.style.bottom = `${monthTickBottom}px`;
            monthTick.style.top = `${monthTickBottom - MONTHTICK_FONTSIZE}px`;
            monthTick.innerHTML = `${year}-${monthStr}`;
            _timelineContainer.appendChild(monthTick);
        } // month
    } // year
    _timelineIsInitialized = true;
    sceneContainer.scrollSceneToCurrentYearMonthTop();
}

// the global set of all yearDivBottoms created 
// from _timelineYearMax down to _timelineYearMin
var timelineYearDivBottoms = {};

function inittimelineYearDivBottoms() {
    timelineYearDivBottoms = {}
}

// YEAR dimensions are in px
const YEAR_BOTTOM_TO_BOTTOM = 162;
const YEARDIV_FONTSIZE = 48;
const MONTHTICK_FONTSIZE = 9;

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
    const yearOffset = (_timelineYearMax - (yearNum-1)) * YEAR_BOTTOM_TO_BOTTOM;
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
/**
 * Gets the height of the timeline in pixels
 * @returns {number} The height in pixels
 * take care to always append "px" for pixels
 */
export function getTimelineHeight() {
    return getTimelineYearMonthBottom(`${_timelineYearMin}`, "01");
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

