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

/*
SCB
onsolidateResizeHendle logic workf ro
hardPageRefresh and onLoad
mouseDrag (change cursor to left/right arrow)  w-resize, e-resize
collapseLeftButtons (use left pointing cursor or finger) col-resize
collapseRightButton (use right pointing cursor or finger)
viewPortResiizing
resizeHandle by mouseDrag
window.resizing 
viewPort should trigger bullsEye
viewport and/or bullseye should trigger parallax 
parallax change should trigger view re-rendering
*/

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
            // console.log(`onMouseMove:Scene-div left: ${sceneContainer.offsetLeft}px, width: ${sceneContainer.offsetWidth}px`);
            
            // // Log bullsEye calculations with all values
            // console.log('BullsEye calculation values:', {
            //     windowWidth: containerWidth,
            //     rightColumnWidth: rightColumn.offsetWidth,
            //     calculatedCenter: (containerWidth - rightColumn.offsetWidth) / 2,
            //     bullsEyeX: viewPort.getBullsEyeCenterX()
            // });
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
        // console.log(`onWindowResize: scene-div left: ${sceneContainer.offsetLeft}px, width: ${sceneContainer.offsetWidth}px`);
        
        // Log bullsEye calculations with all values
        // console.log('BullsEye calculation values:', {
        //     windowWidth: containerWidth,
        //     rightColumnWidth: rightColumn.offsetWidth,
        //     calculatedCenter: (containerWidth - rightColumn.offsetWidth) / 2,
        //     bullsEyeX: viewPort.getBullsEyeCenterX()
        // });
    });

    // Add event listeners for collapse buttons
    collapseLeftButton.addEventListener('click', () => {
        const currentLeft = rightColumn.offsetLeft;
        const windowWidth = window.innerWidth;
        const maxWidth = windowWidth - BUTTON_COLUMN_WIDTH;
        
        // Calculate current percentage and round to nearest 25%
        const currentPercentage = Math.round(100 * (maxWidth - currentLeft) / maxWidth);
        const currentIncrement = Math.round(currentPercentage / 25) * 25;
        
        // Find next higher 25% increment
        const nextPercentage = Math.min(100, currentIncrement + 25);
        
        // Calculate new left position
        const newLeft = Math.round(maxWidth - (maxWidth * nextPercentage / 100));
        
        // Apply new position
        rightColumn.style.width = `${windowWidth - newLeft}px`;
        rightColumn.style.left = `${newLeft}px`;
        resizeHandle.style.left = `${newLeft}px`;
        sceneContainer.style.width = `${newLeft}px`;
        updatePercentageDisplay(newLeft);
        
        // Update button states
        updateButtonStates(nextPercentage);
        updateViewPort(sceneContainer);
        updateBullsEyePosition(sceneContainer);
        cardUtils.applyViewRelativeStylingToAllBizCardDivs(viewPort);
        parallax.updateParallax(sceneContainer);
    });

    collapseRightButton.addEventListener('click', () => {
        const currentLeft = rightColumn.offsetLeft;
        const windowWidth = window.innerWidth;
        const maxWidth = windowWidth - BUTTON_COLUMN_WIDTH;
        
        // Calculate current percentage and round to nearest 25%
        const currentPercentage = Math.round(100 * (maxWidth - currentLeft) / maxWidth);
        const currentIncrement = Math.round(currentPercentage / 25) * 25;
        
        // Find next lower 25% increment
        const nextPercentage = Math.max(0, currentIncrement - 25);
        
        // Calculate new left position
        const newLeft = Math.round(maxWidth - (maxWidth * nextPercentage / 100));
        
        // Apply new position
        rightColumn.style.width = `${windowWidth - newLeft}px`;
        rightColumn.style.left = `${newLeft}px`;
        resizeHandle.style.left = `${newLeft}px`;
        sceneContainer.style.width = `${newLeft}px`;
        updatePercentageDisplay(newLeft);
        
        // Update button states
        updateButtonStates(nextPercentage);
    });

    // Function to update button states based on current percentage
    function updateButtonStates(percentage) {
        // Disable left button at 100%
        if (percentage >= 100) {
            collapseLeftButton.disabled = true;
            collapseLeftButton.style.opacity = '0.5';
            collapseLeftButton.style.cursor = 'not-allowed';
        } else {
            collapseLeftButton.disabled = false;
            collapseLeftButton.style.opacity = '1';
            collapseLeftButton.style.cursor = 'pointer';
        }

        // Disable right button at 0%
        if (percentage <= 0) {
            collapseRightButton.disabled = true;
            collapseRightButton.style.opacity = '0.5';
            collapseRightButton.style.cursor = 'not-allowed';
        } else {
            collapseRightButton.disabled = false;
            collapseRightButton.style.opacity = '1';
            collapseRightButton.style.cursor = 'pointer';
        }
    }

    // Initial button state update
    updateButtonStates(DEFAULT_WIDTH_PERCENT);
} 