// @ts-check

import * as typeValidators from './utils/typeValidators.mjs';
import * as colorUtils from './utils/colorUtils.mjs';
import * as domUtils from './utils/domUtils.mjs';
import * as arrayUtils from './utils/arrayUtils.mjs';
import * as typeConversions from './utils/typeConversions.mjs';
  
// --------------------------------------
// TimeLine globals 

// @ts-ignore
var timelineContainer = null;

// initizlized in createTimeline
var _timelineYearMin = 0;
var _timelineYearMax = 0;

function initTimelineContainer(timelineContainer, minYear, maxYear) {
    timelineContainer = timelineContainer;
    _timelineYearMin = minYear;
    _timelineYearMax = maxYear;
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

// used to get scene-div-relative top position for anything 
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

// append year-divs and year-dashes into timeline-timelineContainer
export function createTimeline(timelineContainer, sceneContainer, minYear, maxYear, defaultYear) {
    if ( timelineContainer == null )
        timelineContainer = document.getElementById("timeline-timelineContainer");
    
    initTimelineContainer(timelineContainer, minYear, maxYear);
    inittimelineYearDivBottoms();

    var alignment = timelineContainer.classList.contains("timeline-timelineContainer-left") ? "left" : "right";

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
        timelineContainer.appendChild(yearDiv);

        for (var month = 1; month <= 12; month++) {
            var monthTick = document.createElement("div");
            monthTick.classList.add("month-tick");
            if (alignment == "left")
                monthTick.classList.add("month-tick-left");
            else
                monthTick.classList.add("month-tick-right");
            var monthStr = typeConversions.zeroPad(month, 2);
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
            timelineContainer.appendChild(monthTick);
        }
    }
    sceneContainerScrollToYear(sceneContainer, defaultYear);
}

export function sceneContainerScrollToYear(sceneContainer, year) {
    var totalYears = _timelineYearMax - _timelineYearMin + 1;
    var leftColumScrollPixelsPerYear = sceneContainer.scrollHeight / totalYears;

    var newScrollTop = (_timelineYearMax - year) * leftColumScrollPixelsPerYear;
    newScrollTop = arrayUtils.clampInt(newScrollTop, 0, sceneContainer.scrollHeight);

    sceneContainer.scrollTop = newScrollTop;
}

