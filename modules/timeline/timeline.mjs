// @ts-check

import * as utils from '../utils/utils.mjs';
import * as mathUtils from '../utils/mathUtils.mjs';
  
import { Logger, LogLevel } from '../logger.mjs';
const logger = new Logger("timeline", LogLevel.INFO);

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

/**
 * initializes the timeLineContainer
 * @param {*} minYear : int
 * @param {*} maxYear : int
 * @param {*} defaultYear : any optional
 */
export function initializeTimeline(minYear, maxYear, defaultYear=null) {
    _initializeTimeline(minYear, maxYear, defaultYear);
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
 * Gets the bottom position of a year and month in the timeline
 * @param {string} yearStr - The year in YYYY format
 * @param {string} monthStr - The month in MM format
 * @returns {number} The bottom position in pixels
 */
export function getTimelineYearMonthBottom(yearStr, monthStr) {
    const yearBottomPx = timelineYearDivBottoms[yearStr];
    if ( yearBottomPx === undefined ) {
        throw new Error('yearBottomPx is undefined');
    }
    const month = parseInt(monthStr, 10);
    const monthBackupPx = (month - 1) * YEAR_BOTTOM_TO_BOTTOM / 12;
    const yearMonthBottomPx = yearBottomPx - monthBackupPx;
    return yearMonthBottomPx;
}

/**
 * Gets the height of the timeline in pixels
 * @returns {number} The height in pixels
 * take care to always append "px" for pixels
 */
export function getTimelineHeight() {
    return getTimelineYearMonthBottom(`${_timelineYearMin}`, "01");
}

/**
 * append year-divs and year-dashes into timeline-_timelineContainer
 * @param {number} minYear - The minimum year
 * @param {number} maxYear - The maximum year
 * @param {any} defaultYear - The optional default year
 */
function _initializeTimeline(minYear, maxYear, defaultYear=null) {
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
        timelineYearDivBottoms[`${year}`] = yearDivBottom;

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
            var check = yearDivBottom - (month - 1) * YEAR_BOTTOM_TO_BOTTOM / 12;
            if (monthTickBottom != check) {
                // console.log(`WARNING: monthTickBottom:${monthTickBottom} != check:${check}`);
            }
            if (getTimelineYearMonthBottom(year.toString(), "01") != timelineYearDivBottoms[`${year}`]) {
                // console.log("WARNING: year-01 != year");
            }

            monthTick.style.fontSize = `${MONTHTICK_FONTSIZE}px`;
            monthTick.style.height = `${MONTHTICK_FONTSIZE}px`;
            monthTick.style.bottom = `${monthTickBottom}px`;
            monthTick.style.top = `${monthTickBottom - MONTHTICK_FONTSIZE}px`;
            monthTick.innerHTML = `${year}-${monthStr}`;
            // // DEBUGGING
            // if ( monthStr === '01' ) {
            //     monthTick.innerHTML = `${year}-${monthStr}    (<span style="float: right;">${monthTickBottom}px</span>)`;
            //     monthTick.style.width = '300px'; // Temporary wider width for debugging
            //     monthTick.style.backgroundColor = 'rgba(0,255,0,1.0)'; // Green background to see bounds
            //     monthTick.style.textAlign = "right";
            //     monthTick.style.height = "30px";
            //     monthTick.style.fontSize = "20pt";
            // }
            _timelineContainer.appendChild(monthTick);
        }
    }
    sceneContainerScrollToYear(_sceneContainer, defaultYear);
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
    newScrollTop = mathUtils.clampInt(newScrollTop, 0, _sceneContainer.scrollHeight);

    _sceneContainer.scrollTop = newScrollTop;
}

