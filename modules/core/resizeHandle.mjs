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

console.log('****************** JS loaded: resizeHandle.mjs');

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

class ResizeManager {
    constructor(s, nIncrements = 3, hysteresisPixels = 2) {
        this.sceneContainer = document.getElementById('scene-container');
        this.resumeContainer = document.getElementById('resume-container');
        this.resumeContainerLeft = document.getElementById('resume-container-left');
        this.collapseLeftButton = document.getElementById('collapse-left');
        this.collapseRightButton = document.getElementById('collapse-right');
        if (!this.collapseLeftButton) {
            console.error('****************** collapseLeftButton not found in DOM!');
        }
        if (!this.collapseRightButton) {
            console.error('****************** collapseRightButton not found in DOM!');
        }
        this.isDragging = false;
        this.startX = 0;
        this.clientX = 0;
        this.resizeHandle = document.getElementById('resize-handle');
        this.sceneVizPercent = document.getElementById('scene-visible-percentage');
        this.newResumeLeft = 0;
        this.newResumeWidth = 0;
        this.newSceneWidth = 0;
        this.newClampedPercentage = 0;
        this.nIncrements = nIncrements;
        this.hysteresisPixels = hysteresisPixels;
        this.lastSnapIndex = null;
        // Bind drag handlers for document-level events
        this._boundHandleDrag = this.handleDrag.bind(this);
        this._boundStopDrag = this.stopDrag.bind(this);
        this._boundHandleMouseLeave = this.handleMouseLeave.bind(this);
    }

    get percentageIncrement() {
        return 100 / this.nIncrements;
    }

    initialize() {
        console.log("ResizeManager: initialize");
        // Initial update on load or hard refresh
        this.setupEventListeners();
        this.showContainers();
    }

    setupEventListeners() {
        console.log('****************** Attaching collapse button listeners');
        this.resumeContainerLeft.addEventListener('mousedown', (e) => this.startDrag(e));
        // Prevent drag when clicking collapse buttons
        this.collapseLeftButton.addEventListener('mousedown', (e) => e.stopPropagation());
        this.collapseRightButton.addEventListener('mousedown', (e) => e.stopPropagation());
        this.collapseLeftButton.addEventListener('click', () => this.collapseLeft());
        this.collapseRightButton.addEventListener('click', () => this.collapseRight());
        // Cursor style changes for buttons
        this.collapseLeftButton.style.cursor = 'w-resize'; // West for left collapse
        this.collapseRightButton.style.cursor = 'e-resize'; // East for right collapse
        // Add mousemove event to dynamically change cursor on left edge
        this.resumeContainerLeft.addEventListener('mousemove', (e) => this.handleCursorChange(e));
    }

    showContainers(label="") {
        const windowWidth = window.innerWidth;
        const resumeLeft = this.resumeContainer.getBoundingClientRect().left; // parseInt(window.getComputedStyle(this.resumeContainer).left);
        const maxSceneWidth = windowWidth - BUTTON_COLUMN_WIDTH;
        const sceneWidth = windowWidth - resumeLeft;
        const percent = (sceneWidth / maxSceneWidth) * 100;
        const prefix = label ? label + " showContainers: " : "showContainers: ";;
        console.log(prefix + "windowWidth:", windowWidth);
        console.log(prefix + "resumeLeft:", resumeLeft);
        console.log(prefix + "maxSceneWidth:", maxSceneWidth);
        console.log(prefix + "sceneWidth:", sceneWidth);
        console.log(prefix + "percent:", percent); 
    }

    // Utility: Calculate the left position for a given edge
    static getEdgeLeft(edge) {
        const windowWidth = window.innerWidth;
        if (edge === 'left') return 0;
        if (edge === 'right') return windowWidth - BUTTON_COLUMN_WIDTH;
        return null;
    }

    computeContainers(forceEdge = null, increment=0) {
        const windowWidth = window.innerWidth;
        let maxSceneWidth = windowWidth - BUTTON_COLUMN_WIDTH;
        let newLeft;
        if (forceEdge === 'left' || forceEdge === 'right') {
            newLeft = ResizeManager.getEdgeLeft(forceEdge);
        } else {
            const dx = this.clientX - this.startX;
            newLeft = this.resumeLeft + dx;
        }
        if ((newLeft <= -1)) return;
        this.newResumeLeft = newLeft;
        this.newSceneWidth = utils.clampInt(0, this.newResumeLeft, maxSceneWidth);
        this.newResumeLeft = this.newSceneWidth;
        this.newResumeWidth = windowWidth - this.newResumeLeft;
        this.newResumeWidth = utils.clampInt(BUTTON_COLUMN_WIDTH, this.newResumeWidth, windowWidth);
        this.newClampedPercentage = Math.round(this.newSceneWidth / maxSceneWidth * 100);
        this.newClampedPercentage = utils.clampInt(0,this.newClampedPercentage,100);
        if (  increment == 0 ) return;
        const PERCENTAGE_INCREMENT = this.percentageIncrement;
        let percent = (maxSceneWidth > 0) ? (this.newSceneWidth / maxSceneWidth * 100) : 0;  
        let newPercent = percent;
        if ( increment === -1 ) {
            const fraction = Math.floor( (percent-PERCENTAGE_INCREMENT/2) / PERCENTAGE_INCREMENT);
            newPercent = fraction * PERCENTAGE_INCREMENT;
            console.log("=fraction:", fraction, "newPercent:", newPercent);
        }
        else if ( increment === +1 ) {
            const fraction = Math.ceil( (percent+PERCENTAGE_INCREMENT/2) / PERCENTAGE_INCREMENT);
            newPercent = fraction * PERCENTAGE_INCREMENT;
            console.log("+fraction:", fraction, "newPercent:", newPercent);
        }
        this.newClampedPercentage = utils.clampInt(0, Math.round(newPercent), 100);
        this.newSceneWidth = Math.round(this.newClampedPercentage * maxSceneWidth / 100);
        this.newResumeLeft = this.newSceneWidth;
        this.newResumeWidth = windowWidth - this.newResumeLeft;
    }

    updateContainers() {
        if ( !utils.isNumber(this.newClampedPercentage) ) throw new Error("this.newClampedPercentage:", this.newClampedPercentage, "is not a Number");
        if ( !utils.isNumber(this.newSceneWidth) ) throw new Error("this.newSceneWidth:", this.newSceneWidth, "is not a Number");
        if ( !utils.isNumber(this.newResumeLeft) ) throw new Error("this.newResumeLeft:", this.newResumeLeft, "is not a Number");
        if ( !utils.isNumber(this.newResumeWidth) ) throw new Error("this.newResumeWidth:", this.newResumeWidth, "is not a Number");
        
        console.log("update windowWidth;     ", window.innerWidth);
        console.log("update newSceneWidth:   ", this.newSceneWidth);
        console.log("update newResumeWidth:  ", this.newResumeWidth);
        console.log("update newClamped%:     ", this.newClampedPercentage);
        if ( (this.newResumeWidth < BUTTON_COLUMN_WIDTH) || this.newResumeWidth > (window.innerWidth - this.newSceneWidth) ) {
            return;
        }

        this.newResumeLeft = utils.clampInt(0, this.newResumeLeft, window.innerWidth);
        this.resumeContainer.style.left = `${this.newResumeLeft}px`;
        this.resumeContainer.style.width = `${this.newResumeWidth}px`;
        this.sceneContainer.style.width = `${this.newSceneWidth}px`;
        viewPort.setViewPortWidth(this.newSceneWidth);
        this.updateButtonStates(this.newClampedPercentage);
    }

    startDrag(e) {
        console.log("startDrag");
        this.showContainers("A");
        this.resumeContainer.style.cursor = 'w-resize'; // Adjust cursor during drag
        this.isDragging = true;
        this.resumeLeft = this.resumeContainer.getBoundingClientRect().left;
        this.startX = e.clientX;
        this.clientX = e.clientX;
        this.showContainers("B");
        this.computeContainers();
        this.startLeft = parseInt(window.getComputedStyle(this.resumeContainer).left, 10);
        document.body.style.userSelect = 'none';
        // Use exclusive pointer events utilities
        targetEnabled('.resume-container-left');
        this._disabledNodeList = selectForDisabled('.resume-container-left');
        disableSelectedForDisabled(this._disabledNodeList);
        // Attach document-level listeners for drag
        document.addEventListener('mousemove', this._boundHandleDrag);
        document.addEventListener('mouseup', this._boundStopDrag);
        document.addEventListener('mouseleave', this._boundHandleMouseLeave);
        // Set lastSnapIndex to the current snap at drag start
        const windowWidth = window.innerWidth;
        const maxSceneWidth = windowWidth - BUTTON_COLUMN_WIDTH;
        const sceneWidth = this.sceneContainer.offsetWidth;
        const percent = (maxSceneWidth > 0) ? (sceneWidth / maxSceneWidth * 100) : 0;
        const increment = this.percentageIncrement;
        this.lastSnapIndex = Math.round(percent / increment);
    }

    handleDrag(e) {
        if (!this.isDragging) return;
        let forceEdge = null;
        if (e.clientX < 0) {
            forceEdge = 'left';
            this.clientX = 0;
            this.lastClientX = 0;
        } else if (e.clientX > window.innerWidth) {
            forceEdge = 'right';
            this.clientX = window.innerWidth;
            this.lastClientX = window.innerWidth;
        } else {
            this.clientX = e.clientX;
            this.lastClientX = e.clientX;
        }
        // Pure smooth drag: always use mouse position
        this.computeContainers(forceEdge);
        this.updateContainers();
    }

    handleMouseLeave(e) {
        if (!this.isDragging) return;
        let forceEdge = null;
        if (this.lastClientX <= 0) {
            forceEdge = 'left';
        } else if (this.lastClientX >= window.innerWidth) {
            forceEdge = 'right';
        }
        this.computeContainers(forceEdge);
        this.updateContainers();
    }

    stopDrag(e) {
        console.log("stopDrag");
        this.resumeContainer.style.cursor = 'default';
        this.isDragging = false;
        this.clientX = e.clientX;
        this.computeContainers();
        this.updateContainers();
        document.body.style.userSelect = '';
        // Restore pointer events
        if (this._disabledNodeList) {
            restoreSelectedForDisabled(this._disabledNodeList);
            this._disabledNodeList = null;
        }
        // Remove document-level listeners
        document.removeEventListener('mousemove', this._boundHandleDrag);
        document.removeEventListener('mouseup', this._boundStopDrag);
        document.removeEventListener('mouseleave', this._boundHandleMouseLeave);
    }

    // Utility: Set containers to a specific snap index
    setToSnapIndex(snapIndex) {
        const windowWidth = window.innerWidth;
        const maxSceneWidth = windowWidth - BUTTON_COLUMN_WIDTH;
        const rawIndex = snapIndex;
        const clampedIndex = Math.max(0, Math.min(this.nIncrements, snapIndex));
        const percent = clampedIndex * this.percentageIncrement;
        this.newClampedPercentage = percent;
        this.newSceneWidth = Math.round(percent * maxSceneWidth / 100);
        this.newResumeLeft = this.newSceneWidth;
        this.newResumeWidth = windowWidth - this.newResumeLeft;
        this.updateContainers();
        // Log the actual width and percent after snapping
        const actualSceneWidth = this.sceneContainer.offsetWidth;
        const actualPercent = (maxSceneWidth > 0) ? (actualSceneWidth / maxSceneWidth * 100) : 0;
        console.log(`****************** [setToSnapIndex] rawIndex: ${rawIndex}, clampedIndex: ${clampedIndex}, percent: ${percent}, actualSceneWidth: ${actualSceneWidth}, actualPercent: ${actualPercent}`);
    }

    // Utility: Get current snap index based on DOM and direction
    getCurrentSnapIndex(direction = null) {
        const windowWidth = window.innerWidth;
        const maxSceneWidth = windowWidth - BUTTON_COLUMN_WIDTH;
        const sceneWidth = this.sceneContainer.offsetWidth;
        const percent = (maxSceneWidth > 0) ? (sceneWidth / maxSceneWidth * 100) : 0;
        let indexRaw = percent / this.percentageIncrement;
        let index;
        if (direction === 'left') {
            index = Math.floor(indexRaw);
        } else if (direction === 'right') {
            index = Math.ceil(indexRaw);
        } else {
            index = Math.round(indexRaw);
        }
        console.log(`****************** [getCurrentSnapIndex] sceneWidth: ${sceneWidth}, percent: ${percent}, increment: ${this.percentageIncrement}, indexRaw: ${indexRaw}, index: ${index}, direction: ${direction}`);
        return index;
    }

    collapseLeft() {
        const windowWidth = window.innerWidth;
        const maxSceneWidth = windowWidth - BUTTON_COLUMN_WIDTH;
        const sceneWidth = this.sceneContainer.offsetWidth;
        const percent = (maxSceneWidth > 0) ? (sceneWidth / maxSceneWidth * 100) : 0;
        const increment = this.percentageIncrement;
        const epsilon = 0.5; // percent threshold for floating point errors
        // Find the closest snap point
        const snapIndex = Math.round(percent / increment);
        const snapPercent = snapIndex * increment;
        let nextIndex;
        if (Math.abs(percent - snapPercent) < epsilon) {
            // If at a snap point, move to the previous
            nextIndex = Math.max(0, snapIndex - 1);
        } else {
            // Otherwise, go to the highest snap point less than current
            nextIndex = Math.max(0, Math.floor((percent - 0.01) / increment));
        }
        console.log(`****************** [collapseLeft] percent: ${percent}, increment: ${increment}, snapIndex: ${snapIndex}, snapPercent: ${snapPercent}, nextIndex: ${nextIndex}`);
        this.setToSnapIndex(nextIndex);
    }

    collapseRight() {
        const windowWidth = window.innerWidth;
        const maxSceneWidth = windowWidth - BUTTON_COLUMN_WIDTH;
        const sceneWidth = this.sceneContainer.offsetWidth;
        const percent = (maxSceneWidth > 0) ? (sceneWidth / maxSceneWidth * 100) : 0;
        const increment = this.percentageIncrement;
        const epsilon = 0.5; // percent threshold for floating point errors
        // Find the closest snap point
        const snapIndex = Math.round(percent / increment);
        const snapPercent = snapIndex * increment;
        let nextIndex;
        if (Math.abs(percent - snapPercent) < epsilon) {
            // If at a snap point, move to the next
            nextIndex = Math.min(this.nIncrements, snapIndex + 1);
        } else {
            // Otherwise, go to the lowest snap point greater than current
            nextIndex = Math.min(this.nIncrements, Math.ceil((percent + 0.01) / increment));
        }
        console.log(`****************** [collapseRight] percent: ${percent}, increment: ${increment}, snapIndex: ${snapIndex}, snapPercent: ${snapPercent}, nextIndex: ${nextIndex}`);
        this.setToSnapIndex(nextIndex);
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
        this.sceneVizPercent.textContent = `${Math.round(percentage)}%`;
    }

    handleWindowResize() {
        // let newLeft = window.innerWidth - BUTTON_COLUMN_WIDTH;
        // if ( this.resumeLeft > newLeft ) {
        //     this.newResumeLeft = newLeft;
        //     this.newSceneWidth = this.newResumeLeft;
        //     this.newResumeWidth = window.innerWidth - this.newResumeLeft;
        // }
        // this.updateContainers();
    }

    // Method to handle cursor change on resume-container left edge
    handleCursorChange(e) {
        const rect = this.resumeContainer.getBoundingClientRect();
        if (e.clientX < rect.left + 20 && !this.isDragging) { // 20px threshold for left edge, not during drag
            this.resumeContainer.style.cursor = 'w-resize';
        } else {
            this.resumeContainer.style.cursor = 'default';
        }
    }
}


// this is called by sceneContainer.updateSceneContainer
export function initializeResizeHandle(nIncrements = 3, hysteresisPixels = 2) {
    console.log("initializeResizeHandle");

    if ( !_resizeManager ) {
        console.log("new ResizeManager created");
        _resizeManager = new ResizeManager(undefined, nIncrements, hysteresisPixels);
        _resizeManager.initialize();
    }
}

export function updateResizeHandle() {
    if ( !_resizeManager ) {
        throw new Error("resizeManager not initialized");
    }
    _resizeManager.computeContainers();
    _resizeManager.updateContainers();
}