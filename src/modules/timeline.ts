import * as utils from './utils.js';

// Type definitions
interface YearDivBottoms {
  [year: string]: number;
}

// Timeline globals
let timelineContainer: HTMLElement | null = null;
let TIMELINE_MAX_YEAR = 0;
let TIMELINE_MIN_YEAR = 0;

function initTimelineContainer(container: HTMLElement, minYear: number, maxYear: number): void {
  timelineContainer = container;
  TIMELINE_MIN_YEAR = minYear;
  TIMELINE_MAX_YEAR = maxYear;
}

// The global set of all yearDivBottoms created
// from TIMELINE_MAX_YEAR down to TIMELINE_MIN_YEAR
let timelineYearDivBottoms: YearDivBottoms = {};

function inittimelineYearDivBottoms(): void {
  timelineYearDivBottoms = {};
}

// YEAR dimensions are in px
const YEAR_BOTTOM_TO_BOTTOM = 162;
const YEARDIV_FONTSIZE = 48;
const MONTHTICK_FONTSIZE = 9;

// --------------------------------------
// Timeline functions
// --------------------------------------

/**
 * Get the bottom position for a specific year and month
 * @param yearStr - Year as string
 * @param monthStr - Month as string (01-12)
 * @returns Bottom position in pixels
 */
export function getTimelineYearMonthBottom(yearStr: string | number, monthStr: string | number): number {
  const month = parseInt(String(monthStr), 10);
  const year = String(yearStr);
  return timelineYearDivBottoms[year] - (month - 1) * YEAR_BOTTOM_TO_BOTTOM / 12;
}

/**
 * Get the total height of the timeline in pixels
 * @returns Timeline height in pixels
 */
export function getTimelineHeight(): number {
  return getTimelineYearMonthBottom(TIMELINE_MIN_YEAR, 1);
}

/**
 * Create the timeline with year divs and month ticks
 * @param container - The timeline container element
 * @param canvasContainer - The canvas container for scrolling
 * @param minYear - Minimum year to display
 * @param maxYear - Maximum year to display
 * @param defaultYear - Year to scroll to initially
 */
export function createTimeline(
  container: HTMLElement | null,
  canvasContainer: HTMLElement,
  minYear: number,
  maxYear: number,
  defaultYear: number
): void {
  if (container == null) {
    container = document.getElementById("timeline-container");
  }

  if (!container) {
    throw new Error('Timeline container not found');
  }

  initTimelineContainer(container, minYear, maxYear);
  inittimelineYearDivBottoms();

  const alignment = container.classList.contains("timeline-container-left") ? "left" : "right";

  for (let year = TIMELINE_MAX_YEAR; year >= TIMELINE_MIN_YEAR; year--) {
    const yearDiv = document.createElement("div");
    yearDiv.classList.add("year-div");

    if (alignment === "left") {
      yearDiv.classList.add("year-div-left");
      yearDiv.innerHTML = `&nbsp;${year}`;
    } else {
      yearDiv.classList.add("year-div-right");
      yearDiv.innerHTML = `${year}&nbsp;`;
    }

    const row = TIMELINE_MAX_YEAR - year;
    const yearDivBottom = (row + 1) * YEAR_BOTTOM_TO_BOTTOM;
    timelineYearDivBottoms[`${year}`] = yearDivBottom;

    yearDiv.style.fontSize = `${YEARDIV_FONTSIZE}px`;
    yearDiv.style.height = `${YEARDIV_FONTSIZE}px`;
    yearDiv.style.bottom = `${yearDivBottom}px`;
    yearDiv.style.top = `${yearDivBottom - YEARDIV_FONTSIZE}px`;
    container.appendChild(yearDiv);

    for (let month = 1; month <= 12; month++) {
      const monthTick = document.createElement("div");
      monthTick.classList.add("month-tick");
      
      if (alignment === "left") {
        monthTick.classList.add("month-tick-left");
      } else {
        monthTick.classList.add("month-tick-right");
      }
      
      const monthStr = utils.zeroPad(month, 2);
      const monthTickBottom = getTimelineYearMonthBottom(year, monthStr);
      const check = yearDivBottom - (month - 1) * YEAR_BOTTOM_TO_BOTTOM / 12;
      
      if (monthTickBottom !== check) {
        console.warn(`monthTickBottom:${monthTickBottom} !== check:${check}`);
      }
      
      if (getTimelineYearMonthBottom(year, "01") !== timelineYearDivBottoms[`${year}`]) {
        console.warn("year-01 !== year");
      }

      monthTick.style.fontSize = `${MONTHTICK_FONTSIZE}px`;
      monthTick.style.height = `${MONTHTICK_FONTSIZE}px`;
      monthTick.style.bottom = `${monthTickBottom}px`;
      monthTick.style.top = `${monthTickBottom - MONTHTICK_FONTSIZE}px`;
      monthTick.innerHTML = `${year}-${monthStr}`;
      container.appendChild(monthTick);
    }
  }
  
  canvasContainerScrollToYear(canvasContainer, defaultYear);
}

/**
 * Scroll the canvas container to show a specific year
 * @param canvasContainer - The scrollable container element
 * @param year - The year to scroll to
 */
export function canvasContainerScrollToYear(canvasContainer: HTMLElement, year: number): void {
  const totalYears = TIMELINE_MAX_YEAR - TIMELINE_MIN_YEAR + 1;
  const leftColumScrollPixelsPerYear = canvasContainer.scrollHeight / totalYears;

  let newScrollTop = (TIMELINE_MAX_YEAR - year) * leftColumScrollPixelsPerYear;
  newScrollTop = utils.clamp(newScrollTop, 0, canvasContainer.scrollHeight);

  canvasContainer.scrollTop = newScrollTop;
}

