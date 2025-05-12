/**
 * Module for handling the resize handle functionality
 */

import { clamp } from '../utils.mjs';
import * as viewPort from './viewPort.mjs';
import { getViewPort, updateViewPort } from './viewPort.mjs';
import * as cardUtils from '../cards/cardUtils.mjs';

// Constants
const BUTTON_COLUMN_WIDTH = 20; // Width of the button column
const MIN_WIDTH = BUTTON_COLUMN_WIDTH; // Minimum width (just the button column)
const DEFAULT_WIDTH_PERCENT = 50; // Default width as percentage of window width

/**
 * Updates the percentage display
 * @param {number} left - The current left position of the right column
 */
function updatePercentageDisplay(left) {
    const percentageDisplay = document.querySelector('.percentage-display');
    if (percentageDisplay) {
        const windowWidth = window.innerWidth;
        const maxWidth = windowWidth - BUTTON_COLUMN_WIDTH;
        const percentage = 100 - (100 * (maxWidth - left) / maxWidth);
        const clampedPercentage = clamp(Math.round(percentage), 0, 100);
        percentageDisplay.textContent = `${clampedPercentage}%`;
    }
}

/**
 * Initializes the resize handle
 * @param {HTMLElement} sceneContainer - The scene-div container element
 * @param {HTMLElement} rightColumn - The right column element
 * @param {HTMLElement} resizeHandle - The resize handle element
 */
export function initResizeHandle(sceneContainer, rightColumn, resizeHandle) {
    let isResizing = false;
    let startX;
    let startWidth;

    // Initialize collapse buttons
    const collapseButtonsContainer = resizeHandle.querySelector('.collapse-buttons-container');
    const collapseLeftButton = document.getElementById('collapse-left');
    const collapseRightButton = document.getElementById('collapse-right');
    const percentageDisplay = resizeHandle.querySelector('.percentage-display');

    // Set initial position to 50% of window width
    const initialLeft = window.innerWidth / 2;
    resizeHandle.style.left = `${initialLeft}px`;
    rightColumn.style.left = `${initialLeft}px`;
    rightColumn.style.width = `${window.innerWidth - initialLeft}px`;
    
    // Set initial width
    const initialWidth = (window.innerWidth * DEFAULT_WIDTH_PERCENT) / 100;
    sceneContainer.style.width = `${initialWidth}px`;
    rightColumn.style.width = `${window.innerWidth - initialWidth}px`;
    rightColumn.style.left = `${initialWidth}px`;
    resizeHandle.style.left = `${initialWidth}px`;
    updatePercentageDisplay(initialWidth);

    // Add event listeners
    rightColumn.addEventListener('mousedown', (e) => {
        // Only start resize if we're near the left edge
        const rect = rightColumn.getBoundingClientRect();
        if (e.clientX - rect.left < 20) { // Within 20px of left edge
            isResizing = true;
            startX = e.clientX;
            startWidth = rightColumn.offsetLeft;
            document.body.classList.add('no-select');
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const deltaX = e.clientX - startX;
        const newLeft = startWidth + deltaX;
        const containerWidth = window.innerWidth;
        const maxWidth = containerWidth - BUTTON_COLUMN_WIDTH;
        
        if (newLeft >= MIN_WIDTH && newLeft <= maxWidth) {
            const newRightColumnWidth = containerWidth - newLeft;
            
            // Position right column based on mouse position
            rightColumn.style.left = `${newLeft}px`;
            rightColumn.style.width = `${newRightColumnWidth}px`;
            
            // Position handle at the right column's left edge
            resizeHandle.style.left = `${newLeft}px`;
            
            // Keep scene-div width fixed at window width
            sceneContainer.style.width = `${containerWidth}px`;
            
            // Update percentage display
            updatePercentageDisplay(newLeft);

            // Update viewPort to recalculate bullsEye position
            viewPort.updateViewPort(sceneContainer);

            // Update all bizCard positions to match new bullsEye center
            cardUtils.applyViewRelativeStylingToAllBizCardDivs(viewPort);

            // Log scene-div container position
            console.log(`Scene-div left: ${sceneContainer.offsetLeft}px, width: ${sceneContainer.offsetWidth}px`);
            
            // Log bullsEye calculations with all values
            console.log('BullsEye calculation values:', {
                windowWidth: containerWidth,
                rightColumnWidth: rightColumn.offsetWidth,
                calculatedCenter: (containerWidth - rightColumn.offsetWidth) / 2,
                bullsEyeX: viewPort.getBullsEyeCenterX()
            });
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.classList.remove('no-select');
        }
    });

    // Add window resize handler
    window.addEventListener('resize', () => {
        const currentLeft = rightColumn.offsetLeft;
        const containerWidth = window.innerWidth;
        
        // If right column is at left edge (collapsed left)
        if (currentLeft === 0) {
            rightColumn.style.width = `${containerWidth}px`;
            sceneContainer.style.width = `${containerWidth}px`;
        }
        // If right column is collapsed to right (width is button column width)
        else if (rightColumn.offsetWidth === BUTTON_COLUMN_WIDTH) {
            rightColumn.style.width = `${BUTTON_COLUMN_WIDTH}px`;
            rightColumn.style.left = `${containerWidth - BUTTON_COLUMN_WIDTH}px`;
            sceneContainer.style.width = `${containerWidth}px`;
        }
        // Otherwise, maintain proportional width
        else {
            rightColumn.style.width = `${containerWidth - currentLeft}px`;
            sceneContainer.style.width = `${containerWidth}px`;
        }
        
        resizeHandle.style.left = `${currentLeft}px`;
        updatePercentageDisplay(currentLeft);

        // Update viewPort to recalculate bullsEye position
        viewPort.updateViewPort(sceneContainer);

        // Log scene-div container position
        console.log(`Scene-div left: ${sceneContainer.offsetLeft}px, width: ${sceneContainer.offsetWidth}px`);
        
        // Log bullsEye calculations with all values
        console.log('BullsEye calculation values:', {
            windowWidth: containerWidth,
            rightColumnWidth: rightColumn.offsetWidth,
            calculatedCenter: (containerWidth - rightColumn.offsetWidth) / 2,
            bullsEyeX: viewPort.getBullsEyeCenterX()
        });
    });

    // Add event listeners for collapse buttons
    collapseLeftButton.addEventListener('click', () => {
        // Collapse to left edge with full window width
        rightColumn.style.width = `${window.innerWidth}px`;
        rightColumn.style.left = `0px`;
        resizeHandle.style.left = `0px`;
        sceneContainer.style.width = '0px';
        updatePercentageDisplay(0);
    });

    collapseRightButton.addEventListener('click', () => {
        // Collapse to right edge with button column width
        rightColumn.style.width = `${BUTTON_COLUMN_WIDTH}px`;
        rightColumn.style.left = `${window.innerWidth - BUTTON_COLUMN_WIDTH}px`;
        resizeHandle.style.left = `${window.innerWidth - BUTTON_COLUMN_WIDTH}px`;
        sceneContainer.style.width = `${window.innerWidth - BUTTON_COLUMN_WIDTH}px`;
        updatePercentageDisplay(window.innerWidth - BUTTON_COLUMN_WIDTH);
    });
} 