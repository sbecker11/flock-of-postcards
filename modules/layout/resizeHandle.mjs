/**
 * Module for handling the resize handle functionality
 */

import { clamp } from '../utils.mjs';
import * as viewPort from './viewPort.mjs';
import { getViewPort, updateViewPort } from './viewPort.mjs';
import * as cardUtils from '../cards/cardUtils.mjs';
// Removed import for parallax as the file does not exist: import * as parallax from '../animation/parallax.mjs';

// Constants
const BUTTON_COLUMN_WIDTH = 20; // Width of the button column
const MIN_WIDTH = BUTTON_COLUMN_WIDTH; // Minimum width (just the button column)
const DEFAULT_WIDTH_PERCENT = 50; // Default width as percentage of window width

/**
 * Updates the percentage display to reflect the visible percentage of scene-div
 * @param {number} left - The current left position of the resize handle
 */
function updatePercentageDisplay(left) {
    const percentageDisplay = document.querySelector('.percentage-display');
    if (percentageDisplay) {
        const windowWidth = window.innerWidth;
        // Calculate percentage of scene-div visibility (0% = handle at left edge, 100% = handle at right edge)
        const maxWidth = windowWidth - BUTTON_COLUMN_WIDTH;
        const percentage = (left / maxWidth) * 100;
        const clampedPercentage = clamp(Math.round(percentage), 0, 100);
        percentageDisplay.textContent = `${clampedPercentage}%`;
    }
}

// SCB: Consolidate Resize logic for hardPageRefresh, onLoad, and various events
// to handle collapse buttons, viewport resizing, and cascading updates.

class ResizeManager {
    constructor(sceneContainer, rightColumn, collapseLeftButton, collapseRightButton) {
        this.sceneContainer = sceneContainer;
        this.rightColumn = rightColumn;
        this.collapseLeftButton = collapseLeftButton;
        this.collapseRightButton = collapseRightButton;
        this.isDragging = false;
        this.startX = 0;
        this.startLeft = 0;
        this.resizeHandle = document.getElementById('resize-handle');
        this.resumeColumnLeft = document.querySelector('.resume-column-left');
    }

    initialize() {
        this.setupEventListeners();
        // Initial update on load or hard refresh
        this.updateLayout();
    }

    setupEventListeners() {
        // Mouse drag events for resume-column (left edge)
        this.rightColumn.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.handleDrag(e));
        document.addEventListener('mouseup', () => this.stopDrag());

        // Add mousemove event to dynamically change cursor on left edge
        this.rightColumn.addEventListener('mousemove', (e) => this.handleCursorChange(e));

        // Collapse button events
        this.collapseLeftButton.addEventListener('click', () => this.collapseLeft());
        this.collapseRightButton.addEventListener('click', () => this.collapseRight());

        // Window resize event
        window.addEventListener('resize', () => this.handleWindowResize());

        // Cursor style changes for buttons
        this.collapseLeftButton.style.cursor = 'w-resize'; // West for left collapse
        this.collapseRightButton.style.cursor = 'e-resize'; // East for right collapse
    }

    startDrag(e) {
        // Only start dragging if the click is near the left edge of resume-column
        const rect = this.rightColumn.getBoundingClientRect();
        if (e.clientX < rect.left + 20) { // 20px threshold for left edge
            e.preventDefault();
            this.isDragging = true;
            this.startX = e.clientX;
            this.startLeft = parseInt(window.getComputedStyle(this.rightColumn).left);
            this.rightColumn.style.cursor = 'w-resize'; // Adjust cursor during drag
        }
    }

    handleDrag(e) {
        if (!this.isDragging) return;
        const dx = e.clientX - this.startX;
        // Ensure the left edge stays within bounds, keeping 20px visible at max
        const maxLeft = window.innerWidth - BUTTON_COLUMN_WIDTH;
        const newLeft = Math.max(0, Math.min(maxLeft, this.startLeft + dx));
        this.rightColumn.style.left = `${newLeft}px`;
        this.rightColumn.style.width = `${window.innerWidth - newLeft}px`;
        // Keep sceneContainer width aligned with window width
        this.sceneContainer.style.width = `${window.innerWidth}px`;
        // Update percentage display
        updatePercentageDisplay(newLeft);
        // Ensure resize-handle is repositioned with resume-column
        this.updateResizeHandlePosition(newLeft);
        this.updateLayout();
    }

    stopDrag() {
        this.isDragging = false;
        // Reset cursor after drag, will be updated by handleCursorChange on next mousemove
        this.rightColumn.style.cursor = 'default';
    }

    collapseLeft() {
        // Logic to collapse left by exactly 25% increment
        const currentLeft = parseInt(window.getComputedStyle(this.rightColumn).left);
        const windowWidth = window.innerWidth;
        const maxWidth = windowWidth - BUTTON_COLUMN_WIDTH;
        // Calculate current percentage of scene visibility
        const currentPercentage = (currentLeft / maxWidth) * 100;
        // Move to the next lower 25% increment by subtracting 25%
        const nextPercentage = currentPercentage - 25;
        // Ensure it doesn't go below 0%
        const clampedPercentage = Math.max(0, nextPercentage);
        // Calculate new left position based on percentage
        const newLeft = (clampedPercentage / 100) * maxWidth;
        // Apply new position
        this.rightColumn.style.left = `${newLeft}px`;
        this.rightColumn.style.width = `${windowWidth - newLeft}px`;
        // Keep sceneContainer width aligned with window width
        this.sceneContainer.style.width = `${window.innerWidth}px`;
        // Update percentage display
        updatePercentageDisplay(newLeft);
        // Enable/disable buttons based on new position
        this.updateButtonStates(clampedPercentage);
        // Update resize-handle position to match resume-column-left
        this.updateResizeHandlePosition();
        this.updateLayout();
    }

    collapseRight() {
        // Logic to collapse right by exactly 25% increment
        const currentLeft = parseInt(window.getComputedStyle(this.rightColumn).left);
        const windowWidth = window.innerWidth;
        const maxWidth = windowWidth - BUTTON_COLUMN_WIDTH;
        // Calculate current percentage of scene visibility
        const currentPercentage = (currentLeft / maxWidth) * 100;
        // Move to the next higher 25% increment by adding 25%
        const nextPercentage = currentPercentage + 25;
        // Ensure it doesn't exceed 100%
        const clampedPercentage = Math.min(100, nextPercentage);
        // Calculate new left position based on percentage
        const newLeft = (clampedPercentage / 100) * maxWidth;
        // Apply new position
        this.rightColumn.style.left = `${newLeft}px`;
        this.rightColumn.style.width = `${windowWidth - newLeft}px`;
        // Keep sceneContainer width aligned with window width
        this.sceneContainer.style.width = `${window.innerWidth}px`;
        // Update percentage display
        updatePercentageDisplay(newLeft);
        // Enable/disable buttons based on new position
        this.updateButtonStates(clampedPercentage);
        // Update resize-handle position to match resume-column-left
        this.updateResizeHandlePosition();
        this.updateLayout();
    }

    updateButtonStates(percentage) {
        // Disable right collapse button at 100%
        if (percentage >= 100) {
            this.collapseRightButton.disabled = true;
            this.collapseRightButton.style.opacity = '0.5';
            this.collapseRightButton.style.cursor = 'not-allowed';
        } else {
            this.collapseRightButton.disabled = false;
            this.collapseRightButton.style.opacity = '1';
            this.collapseRightButton.style.cursor = 'e-resize';
        }
        // Disable left collapse button at 0%
        if (percentage <= 0) {
            this.collapseLeftButton.disabled = true;
            this.collapseLeftButton.style.opacity = '0.5';
            this.collapseLeftButton.style.cursor = 'not-allowed';
        } else {
            this.collapseLeftButton.disabled = false;
            this.collapseLeftButton.style.opacity = '1';
            this.collapseLeftButton.style.cursor = 'w-resize';
        }
    }

    handleWindowResize() {
        // Adjust position if out of bounds
        const currentLeft = parseInt(window.getComputedStyle(this.rightColumn).left);
        const maxLeft = window.innerWidth - BUTTON_COLUMN_WIDTH;
        if (currentLeft > maxLeft) {
            this.rightColumn.style.left = `${maxLeft}px`;
        }
        this.updateLayout();
    }

    updateLayout() {
        // Unified update flow to avoid redundant calls
        // 1. Update viewport
        viewPort.updateViewPort(this.sceneContainer);

        // 2. Update bulls-eye position
        viewPort.updateBullsEyeVerticalPosition();

        // 3. Update parallax effects (commented out as parallax module is not available)
        // parallax.renderAllTranslateableDivsAtsceneContainerCenter(this.sceneContainer);

        // 4. Update all translatable divs in scene-div based on viewport changes
        cardUtils.applyViewRelativeStylingToAllBizCardDivs(viewPort);

        // 5. Trigger any necessary re-rendering or additional updates
        // (Add re-rendering logic if needed)
    }

    // Method to update resize-handle position
    updateResizeHandlePosition(newLeft) {
        // Update the position of resize-handle to match resume-column left
        const buttonsContainer = document.querySelector('.resize-handle');
        if (buttonsContainer) {
            buttonsContainer.style.left = `${newLeft}px`;
        }
        // Update button states based on the current percentage
        const windowWidth = window.innerWidth;
        const maxWidth = windowWidth - BUTTON_COLUMN_WIDTH;
        const percentage = (newLeft / maxWidth) * 100;
        this.updateButtonStates(percentage);
    }

    // Method to handle cursor change on resume-column left edge
    handleCursorChange(e) {
        const rect = this.rightColumn.getBoundingClientRect();
        if (e.clientX < rect.left + 20 && !this.isDragging) { // 20px threshold for left edge, not during drag
            this.rightColumn.style.cursor = 'w-resize';
        } else {
            this.rightColumn.style.cursor = 'default';
        }
    }

    updateResizeHandlePosition() {
        const rect = this.resumeColumnLeft.getBoundingClientRect();
        this.resizeHandle.style.left = `${rect.left}px`;
    }
}

// Function to initialize the resize manager
export function initResizeHandle(sceneContainer, rightColumn) {
    const collapseLeftButton = document.getElementById('collapse-left');
    const collapseRightButton = document.getElementById('collapse-right');
    const resizeManager = new ResizeManager(sceneContainer, rightColumn, collapseLeftButton, collapseRightButton);
    resizeManager.initialize();
    return resizeManager;
} 