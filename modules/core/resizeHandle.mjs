/**
 * Module for handling the resize handle functionality
 */
import * as sceneContainer from '../scene/sceneContainer.mjs';
import * as resumeContainer from '../resume/resumeContainer.mjs';

import * as utils from '../utils/utils.mjs';
import * as viewPort from './viewPort.mjs';
import { targetEnabled, selectForDisabled, disableSelectedForDisabled, restoreSelectedForDisabled } from './exclusivePointerEvents.mjs';

// Constants
const BUTTON_COLUMN_WIDTH = 20; // Width of the button column
const MIN_WIDTH = BUTTON_COLUMN_WIDTH; // Minimum width (just the button column)
const DEFAULT_WIDTH_PERCENT = 50; // Default width as percentage of window width

let _resizeManager = null;

// console.log('****************** JS loaded: resizeHandle.mjs');

export function initializeViewPercent(viewPercent) {
    _sceneContainerElement.style.width = `${viewPercent}%`;
    const resumePercent = 100 - viewPercent;
    _resumeContainerElement.style.width = `${resumePercent}%`;
}

/**
 * Updates the percentage display to reflect the visible percentage of scene-plane
 * @param {number} left - The current left position of the resize handle
 */

// SCB: Consolidate Resize logic for hardPageRefresh, onLoad, and various events
// to handle collapse buttons, viewport resizing, and cascading updates.

// Utility: Clamp a value to a range
function clampToRange(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

class ResizeManager {
    /**
     * @param {any} s - Unused, kept for compatibility
     * @param {number} nIncrements - Number of snap increments
     * @param {number} hysteresisPixels - Hysteresis in pixels
     */
    constructor(s, nIncrements = 3, hysteresisPixels = 2) {
        this.sceneContainer = document.getElementById('scene-container');
        this.resumeContainer = document.getElementById('resume-container');
        this.resumeContainerLeft = document.getElementById('resume-container-left');
        this.collapseLeftButton = document.getElementById('collapse-left');
        this.collapseRightButton = document.getElementById('collapse-right');
        this.resizeHandle = document.getElementById('resize-handle');
        this.sceneVizPercent = document.getElementById('scene-visible-percentage');
        this.nIncrements = nIncrements;
        this.hysteresisPixels = hysteresisPixels;
        this.isDragging = false;
        this.startX = 0;
        this.clientX = 0;
        this.lastSnapIndex = null;
        this.percentage = 50; // Default to 50%
        this.debug = false; // Set to true for debug logs

        // Guard all DOM lookups
        if (!this.sceneContainer || !this.resumeContainer || !this.resumeContainerLeft || !this.collapseLeftButton || !this.collapseRightButton || !this.sceneVizPercent) {
            throw new Error('ResizeManager: One or more required DOM elements not found.');
        }

        // Bind drag handlers for document-level events
        this._boundHandleDrag = this.handleDrag.bind(this);
        this._boundStopDrag = this.stopDrag.bind(this);
        this._boundHandleMouseLeave = this.handleMouseLeave.bind(this);
        this._debouncedWindowResize = debounce(this.handleWindowResize.bind(this), 50);
    }

    /**
     * Returns the percentage increment for snapping
     */
    get percentageIncrement() {
        return 100 / this.nIncrements;
    }

    /**
     * Initializes event listeners and sets initial layout
     */
    initialize() {
        this.setupEventListeners();
        this.updateLayoutFromPercentage(this.percentage);
    }

    /**
     * Sets up all event listeners
     */
    setupEventListeners() {
        this.resumeContainerLeft.addEventListener('mousedown', (e) => this.startDrag(e));
        this.collapseLeftButton.addEventListener('mousedown', (e) => e.stopPropagation());
        this.collapseRightButton.addEventListener('mousedown', (e) => e.stopPropagation());
        this.collapseLeftButton.addEventListener('click', () => this.collapseLeft());
        this.collapseRightButton.addEventListener('click', () => this.collapseRight());
        this.resumeContainerLeft.addEventListener('mousemove', (e) => this.handleCursorChange(e));
        window.addEventListener('resize', this._debouncedWindowResize);
        // Use CSS for cursor where possible
        this.collapseLeftButton.classList.add('w-resize-cursor');
        this.collapseRightButton.classList.add('e-resize-cursor');
    }

    /**
     * Updates the layout based on the current percentage
     * @param {number} percentage - The percentage of scene width
     */
    updateLayoutFromPercentage(percentage) {
        const windowWidth = window.innerWidth;
        const maxSceneWidth = windowWidth - BUTTON_COLUMN_WIDTH;
        this.percentage = clampToRange(percentage, 0, 100);
        this.sceneWidth = Math.round(this.percentage * maxSceneWidth / 100);
        this.resumeLeft = this.sceneWidth;
        this.resumeWidth = windowWidth - this.resumeLeft;
        this.resumeWidth = clampToRange(this.resumeWidth, BUTTON_COLUMN_WIDTH, windowWidth);
        if (this.resumeWidth < BUTTON_COLUMN_WIDTH) {
            this.resumeWidth = BUTTON_COLUMN_WIDTH;
            this.sceneWidth = windowWidth - this.resumeWidth;
            this.resumeLeft = this.sceneWidth;
        }
        this.applyLayout();
    }

    /**
     * Applies the calculated layout to the DOM
     */
    applyLayout() {
        this.resumeContainer.style.left = `${this.resumeLeft}px`;
        this.resumeContainer.style.width = `${this.resumeWidth}px`;
        this.sceneContainer.style.width = `${this.sceneWidth}px`;
        viewPort.setViewPortWidth(this.sceneWidth);
        this.updateButtonStates(this.percentage);
        if (this.debug) {
            console.log('applyLayout:', {
                resumeLeft: this.resumeLeft,
                resumeWidth: this.resumeWidth,
                sceneWidth: this.sceneWidth,
                percentage: this.percentage
            });
        }
    }

    /**
     * Starts the drag operation
     * @param {MouseEvent} e
     */
    startDrag(e) {
        this.resumeContainer.style.cursor = 'w-resize';
        this.isDragging = true;
        this.startX = e.clientX;
        this.clientX = e.clientX;
        this.startResumeLeft = this.resumeContainer.getBoundingClientRect().left;
        document.body.style.userSelect = 'none';
        targetEnabled('.resume-container-left');
        this._disabledNodeList = selectForDisabled('.resume-container-left');
        disableSelectedForDisabled(this._disabledNodeList);
        document.addEventListener('mousemove', this._boundHandleDrag);
        document.addEventListener('mouseup', this._boundStopDrag);
        document.addEventListener('mouseleave', this._boundHandleMouseLeave);
    }

    /**
     * Handles the drag operation
     * @param {MouseEvent} e
     */
    handleDrag(e) {
        if (!this.isDragging) return;
        let newClientX = clampToRange(e.clientX, 0, window.innerWidth);
        let dx = newClientX - this.startX;
        let newResumeLeft = clampToRange(this.startResumeLeft + dx, 0, window.innerWidth - BUTTON_COLUMN_WIDTH);
        let newPercentage = Math.round(newResumeLeft / (window.innerWidth - BUTTON_COLUMN_WIDTH) * 100);
        this.updateLayoutFromPercentage(newPercentage);
    }

    /**
     * Handles mouse leaving the window during drag
     * @param {MouseEvent} e
     */
    handleMouseLeave(e) {
        if (!this.isDragging) return;
        this.stopDrag(e);
    }

    /**
     * Stops the drag operation
     * @param {MouseEvent} e
     */
    stopDrag(e) {
        this.resumeContainer.style.cursor = '';
        this.isDragging = false;
        document.body.style.userSelect = '';
        if (this._disabledNodeList) {
            restoreSelectedForDisabled(this._disabledNodeList);
            this._disabledNodeList = null;
        }
        document.removeEventListener('mousemove', this._boundHandleDrag);
        document.removeEventListener('mouseup', this._boundStopDrag);
        document.removeEventListener('mouseleave', this._boundHandleMouseLeave);
    }

    /**
     * Sets the layout to a specific snap index
     * @param {number} snapIndex
     */
    setToSnapIndex(snapIndex) {
        const clampedIndex = clampToRange(snapIndex, 0, this.nIncrements);
        const percent = clampedIndex * this.percentageIncrement;
        this.updateLayoutFromPercentage(percent);
    }

    /**
     * Gets the current snap index
     * @returns {number}
     */
    getCurrentSnapIndex() {
        return Math.round(this.percentage / this.percentageIncrement);
    }

    /**
     * Collapses the scene to the left (decreases scene width)
     */
    collapseLeft() {
        let currentIndex = this.getCurrentSnapIndex();
        let nextIndex = Math.max(0, currentIndex - 1);
        this.setToSnapIndex(nextIndex);
    }

    /**
     * Collapses the scene to the right (increases scene width)
     */
    collapseRight() {
        let currentIndex = this.getCurrentSnapIndex();
        let nextIndex = Math.min(this.nIncrements, currentIndex + 1);
        this.setToSnapIndex(nextIndex);
    }

    /**
     * Updates the state of the collapse buttons
     * @param {number} percentage
     */
    updateButtonStates(percentage) {
        this.collapseRightButton.disabled = percentage >= 100;
        this.collapseRightButton.style.opacity = percentage >= 100 ? '0.5' : '1';
        this.collapseLeftButton.disabled = percentage <= 0;
        this.collapseLeftButton.style.opacity = percentage <= 0 ? '0.5' : '1';
        this.sceneVizPercent.textContent = `${Math.round(percentage)}%`;
    }

    /**
     * Handles window resize events (debounced)
     */
    handleWindowResize() {
        this.updateLayoutFromPercentage(this.percentage);
    }

    /**
     * Handles cursor changes on the left edge
     * @param {MouseEvent} e
     */
    handleCursorChange(e) {
        const rect = this.resumeContainer.getBoundingClientRect();
        if (e.clientX < rect.left + 20 && !this.isDragging) {
            this.resumeContainer.classList.add('w-resize-cursor');
        } else {
            this.resumeContainer.classList.remove('w-resize-cursor');
        }
    }
}

// Debounce utility
function debounce(fn, delay) {
    let timer = null;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// this is called by sceneContainer.updateSceneContainer
export function initializeResizeHandle(nIncrements = 3, hysteresisPixels = 2) {
    // console.log("initializeResizeHandle");

    if ( !_resizeManager ) {
        // console.log("new ResizeManager created");
        _resizeManager = new ResizeManager(undefined, nIncrements, hysteresisPixels);
        _resizeManager.initialize();
    }
}

export function updateResizeHandle() {
    if ( !_resizeManager ) {
        throw new Error("resizeManager not initialized");
    }
    _resizeManager.updateLayoutFromPercentage(_resizeManager.percentage);
}