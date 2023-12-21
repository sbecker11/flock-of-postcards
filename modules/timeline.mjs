// @ts-check

import * as timeline from './timeline.js';
import * as utils from './utils.js';
  
// --------------------------------------
// TimeLine globals 

// @ts-ignore
var timelineContainer = null;


var TIMELINE_MAX_YEAR = 0;
var TIMELINE_MIN_YEAR = 0;

function initTimelineContainer(container, minYear, maxYear) {
    timelineContainer = container;
    TIMELINE_MIN_YEAR = minYear;
    TIMELINE_MAX_YEAR = maxYear;

}

// the global set of all yearDivBottoms created 
// from TIMELINE_MAX_YEAR down to TIMELINE_MIN_YEAR
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

// used to get canvas-relative top position for anything 
// take care to always append "px" for pixels
export function getTimelineYearMonthBottom(yearStr, monthStr) {
    var month = parseInt(monthStr, 10);
    return timelineYearDivBottoms[yearStr] - (month - 1) * YEAR_BOTTOM_TO_BOTTOM / 12;
}

// the total height of the timeline in pixels
// take care to always append "px" for pixels
export function getTimelineHeight() {
    return getTimelineYearMonthBottom(TIMELINE_MIN_YEAR, 1);
}

// append year-divs and year-dashes into timeline-container
export function createTimeline(container, canvasContainer, minYear, maxYear, defaultYear) {
    if ( container == null )
        container = document.getElementById("timeline-container");
    
    initTimelineContainer(container, minYear, maxYear);
    inittimelineYearDivBottoms();

    // console.assert(timelineContainer != null);
    var alignment = timelineContainer.classList.contains("timeline-container-left") ? "left" : "right";

    for (var year = TIMELINE_MAX_YEAR; year >= TIMELINE_MIN_YEAR; year--) {
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

        var row = TIMELINE_MAX_YEAR - year;
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
            var monthStr = utils.zeroPad(month, 2);
            var monthTickBottom = timeline.getTimelineYearMonthBottom(year, monthStr);
            var check = yearDivBottom - (month - 1) * YEAR_BOTTOM_TO_BOTTOM / 12;
            if (monthTickBottom != check) {
                // console.log(`WARNING: monthTickBottom:${monthTickBottom} != check:${check}`);
            }
            if (timeline.getTimelineYearMonthBottom(year, "01") != timelineYearDivBottoms[`${year}`]) {
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
    canvasContainerScrollToYear(canvasContainer, defaultYear);
}

export function canvasContainerScrollToYear(canvasContainer, year) {
    // @ts-ignore
    var totalYears = TIMELINE_MAX_YEAR - TIMELINE_MIN_YEAR + 1;
    // @ts-ignore
    var leftColumScrollPixelsPerYear = canvasContainer.scrollHeight / totalYears;

    // @ts-ignore
    var newScrollTop = (TIMELINE_MAX_YEAR - year) * leftColumScrollPixelsPerYear;
    // @ts-ignore
    newScrollTop = utils.clamp(newScrollTop, 0, canvasContainer.scrollHeight);

    // @ts-ignore
    canvasContainer.scrollTop = newScrollTop;
}

