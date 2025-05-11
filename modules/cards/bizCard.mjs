import * as typeValidators from '../utils/typeValidators.mjs';
import * as colorUtils from '../utils/colorUtils.mjs';
import * as domUtils from '../utils/domUtils.mjs';
import * as arrayUtils from '../utils/arrayUtils.mjs';
import * as typeConversions from '../utils/typeConversions.mjs';
import { get_z_from_z_index, MIN_BIZCARD_Z_INDEX, BIZCARD_MIN_Z, BIZCARD_MAX_Z } from '../layout/zIndex.mjs';
import { getTimelineYearMonthBottom } from '../timeline.mjs';
import { getViewport } from '../layout/viewport.mjs';
import { getPaletteSelectorInstance } from '../color_palettes.mjs';

// Business card constants
export const BIZCARD_MEAN_WIDTH = 200;
export const BIZCARD_INDENT = 29;
export const MIN_BIZCARD_HEIGHT = 200;
export const MIN_BRIGHTNESS_PERCENT = 70;
export const BLUR_Z_SCALE_FACTOR = 0.1;
export const MAX_WIDTH_OFFSET = 40; // Maximum random width offset in pixels
export const MAX_X_OFFSET = 100; // Maximum random horizontal offset in pixels

/**
 * Gets a random offset within a range
 * @param {number} maxOffset - Maximum offset in pixels
 * @returns {number} Random offset between -maxOffset and maxOffset
 */
function getRandomOffset(maxOffset) {
    return (Math.random() * 2 - 1) * maxOffset; // Random value between -maxOffset and maxOffset
}

/**
 * Gets a random number between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number between min and max
 */
function getRandomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Gets the vertical position for a date on the canvas
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {number} Vertical position in pixels from the top
 */
function getVerticalPositionForDate(date) {
    const [year, month] = date.split('-');
    return getTimelineYearMonthBottom(year, month);
}

/**
 * Positions a business card div based on its start and end dates
 * @param {HTMLElement} bizCardDiv - The business card div to position
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format or "CURRENT_DATE"
 */
function positionBizCardDiv(bizCardDiv, startDate, endDate) {
    // Get vertical positions
    const startPos = getVerticalPositionForDate(startDate);
    const endPos = endDate === "CURRENT_DATE" ? 
        getVerticalPositionForDate(new Date().toISOString().split('T')[0]) : 
        getVerticalPositionForDate(endDate);
    
    // Calculate height and position
    const height = Math.abs(endPos - startPos);
    const top = Math.min(startPos, endPos);
    
    // Calculate scene-relative properties
    const bizCardCenterX = getRandomOffset(MAX_X_OFFSET); // Random offset from scene origin
    const bizCardWidth = BIZCARD_MEAN_WIDTH + getRandomOffset(MAX_WIDTH_OFFSET);
    
    // Save scene-relative properties
    bizCardDiv.setAttribute("sceneCenterX", `${bizCardCenterX}`);
    bizCardDiv.setAttribute("sceneWidth", `${bizCardWidth}`);
    
    // Get viewport dimensions
    const viewport = getViewport();
    
    // Calculate canvas-relative position
    // left = (bullseyeX + sceneCenterX) - (width/2)
    const cardLeft = (viewport.bullseyeX + bizCardCenterX) - (bizCardWidth / 2);
    
    // Set dimensions and position
    bizCardDiv.style.height = `${height}px`;
    bizCardDiv.style.top = `${top}px`;
    bizCardDiv.style.width = `${bizCardWidth}px`;
    bizCardDiv.style.left = `${cardLeft}px`;
}

/**
 * Updates the position of a business card div to match the current bullseye center
 * @param {HTMLElement} bizCardDiv - The business card div to update
 */
export function updateBizCardPosition(bizCardDiv) {
    const viewport = getViewport();
    const sceneCenterX = parseFloat(bizCardDiv.getAttribute("sceneCenterX"));
    const sceneWidth = parseFloat(bizCardDiv.getAttribute("sceneWidth"));
    
    // Calculate canvas-relative position
    // left = (bullseyeX + sceneCenterX) - (width/2)
    const cardLeft = (viewport.bullseyeX + sceneCenterX) - (sceneWidth / 2);
    bizCardDiv.style.left = `${cardLeft}px`;
}

/**
 * Updates all business card positions to match the current bullseye center
 */
export function updateAllBizCardPositions() {
    const bizCards = document.getElementsByClassName("biz-card-div");
    for (const bizCard of bizCards) {
        updateBizCardPosition(bizCard);
    }
}

/**
 * Creates a business card div for a job
 * @param {Object} job - The job object
 * @param {number} jobIndex - The index of the job in the sorted array
 * @param {HTMLElement} canvas - The canvas element
 * @returns {HTMLElement} The created business card div
 */
export function createBizCardDiv(job, jobIndex, canvas) {
    const bizCardDiv = document.createElement("div");
    bizCardDiv.className = "biz-card-div";
    bizCardDiv.id = `biz-card-div-${jobIndex}`;
    
    // Set a random Z value between BIZCARD_MIN_Z and BIZCARD_MAX_Z
    const z = getRandomBetween(BIZCARD_MIN_Z, BIZCARD_MAX_Z);
    const z_index = get_z_from_z_index(z);
    bizCardDiv.style.zIndex = z_index;
    bizCardDiv.setAttribute("saved_z", z);
    console.log(`Created bizcard ${jobIndex} with z=${z}, z_index=${z_index}`);
    
    // Set a fixed color index (0-4) for this bizcard
    const colorIndex = jobIndex % 5;  // Fixed to 5 colors
    bizCardDiv.setAttribute("data-color-index", colorIndex.toString());
    console.log(`Created bizcard ${jobIndex} with fixed data-color-index=${colorIndex}`);
    
    // Position the card based on dates
    positionBizCardDiv(bizCardDiv, job.start, job.end);
    
    // Set content
    bizCardDiv.innerHTML = `
        <div class="biz-card-content">
            <h3>${job.role}</h3>
            <h4>${job.employer}</h4>
            <p>${formatDateRange(job.start, job.end)}</p>
        </div>
    `;
    
    // Add click handler
    bizCardDiv.addEventListener("click", () => handleBizCardClick(bizCardDiv, job));
    
    // Append to canvas
    canvas.appendChild(bizCardDiv);
    
    // Debug: Check if attribute is set after appending
    console.log(`After append, bizcard ${jobIndex} has data-color-index=${bizCardDiv.getAttribute("data-color-index")}`);
    
    return bizCardDiv;
}

/**
 * Formats a date range for display
 * @param {string} start - Start date in YYYY-MM-DD format
 * @param {string} end - End date in YYYY-MM-DD format or "CURRENT_DATE"
 * @returns {string} Formatted date range
 */
function formatDateRange(start, end) {
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
 * Handles click events on business cards
 * @param {HTMLElement} bizCardDiv - The clicked business card div
 * @param {Object} job - The job object associated with the card
 */
function handleBizCardClick(bizCardDiv, job) {
    // Remove selected class from all cards
    document.querySelectorAll('.biz-card-div').forEach(div => {
        div.classList.remove('selected');
    });
    
    // Add selected class to clicked card
    bizCardDiv.classList.add('selected');
    
    // Update right content with job details
    const rightContentDiv = document.getElementById('right-content-div');
    rightContentDiv.innerHTML = `
        <div class="job-details">
            <h2>${job.role}</h2>
            <h3>${job.employer}</h3>
            <p class="date-range">${formatDateRange(job.start, job.end)}</p>
            <div class="description">${job.Description}</div>
            ${job.references ? `<div class="references">${job.references.join('')}</div>` : ''}
        </div>
    `;
} 