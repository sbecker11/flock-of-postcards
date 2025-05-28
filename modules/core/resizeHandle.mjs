/**
 * Module for handling the resize handle functionality
 */
import * as sceneContainer from '../scene/sceneContainer.mjs';
import * as resumeContainer from '../resume/resumeContainer.mjs';

import * as utils from '../utils/utils.mjs';
import * as viewPort from './viewPort.mjs';

// Constants
const BUTTON_COLUMN_WIDTH = 20; // Width of the button column
const MIN_WIDTH = BUTTON_COLUMN_WIDTH; // Minimum width (just the button column)
const DEFAULT_WIDTH_PERCENT = 50; // Default width as percentage of window width
const PERCENTAGE_INCREMENT = 100 / 3;

let _resizeManager = null;

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
    constructor(s) {
        this.sceneContainer = document.getElementById('scene-container');;
        this.resumeContainer = document.getElementById('resume-container');
        this.resumeContainerLeft = document.getElementById('resume-container-left');
        this.collapseLeftButton = document.getElementById('collapse-left');
        this.collapseRightButton = document.getElementById('collapse-right'); 
        this.isDragging = false;
        this.startX = 0;
        this.clientX = 0;
        this.resizeHandle = document.getElementById('resize-handle');
        this.sceneVizPercent = document.getElementById('scene-visible-percentage');
        this.newResumeLeft = 0;
        this.newResumeWidth = 0;
        this.newSceneWidth = 0;
        this.newClampedPercentage = 0;
    }

    initialize() {
        console.log("ResizeManager: initialize");
        // Initial update on load or hard refresh
        this.setupEventListeners();
        this.showContainers();
    }

    setupEventListeners() {
        console.log('setupEventListeners');
        this.resumeContainerLeft.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.handleDrag(e));
        document.addEventListener('mouseup', (e) => this.stopDrag(e));

        // Add mousemove event to dynamically change cursor on left edge
        this.resumeContainerLeft.addEventListener('mousemove', (e) => this.handleCursorChange(e));

        // Collapse button events
        this.collapseLeftButton.addEventListener('click', () => this.collapseLeft());
        this.collapseRightButton.addEventListener('click', () => this.collapseRight());

        // Cursor style changes for buttons
        this.collapseLeftButton.style.cursor = 'w-resize'; // West for left collapse
        this.collapseRightButton.style.cursor = 'e-resize'; // East for right collapse
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

    computeContainers(increment=0) {
        const windowWidth = window.innerWidth;
        const maxSceneWidth = windowWidth - BUTTON_COLUMN_WIDTH;
        const dx = this.clientX - this.startX;
        const newLeft = this.resumeLeft + dx;
        if ((newLeft <= -1) || (newLeft >= windowWidth)) return;
        this.newResumeLeft = newLeft;
        this.newSceneWidth = utils.clampInt(0, this.newResumeLeft, maxSceneWidth);
        this.newResumeLeft = this.newSceneWidth;
        this.newResumeWidth = windowWidth - this.newResumeLeft;
        this.newResumeWidth = utils.clampInt(BUTTON_COLUMN_WIDTH, this.newResumeWidth, windowWidth);
        this.newClampedPercentage = Math.round(this.newSceneWidth / maxSceneWidth * 100);
        this.newClampedPercentage = utils.clampInt(0,this.newClampedPercentage,100);
        if (  increment == 0 ) return;
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
    }

    handleDrag(e) {
        if (!this.isDragging) return;
        console.log("handleDrag");
        this.clientX = e.clientX;
        this.computeContainers();
        this.updateContainers();
    }

    stopDrag(e) {
        console.log("stopDrag");
        this.resumeContainer.style.cursor = 'default';
        this.isDragging = false;
        this.clientX = e.clientX;
        this.computeContainers();
        this.updateContainers();

        // Reset cursor after drag, will be updated by handleCursorChange on next mousemove
    }

    collapseLeft() {
        console.log("collapseLeft");
        this.computeContainers(-1);
        this.updateContainers();
    }

    collapseRight() {
        console.log("collapseRight");
        this.computeContainers(+1);
        this.updateContainers();

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
        // Adjust position if out of bounds
        this.computeContainers();
        this.updateContainers();
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
export function initializeResizeHandle() {
    console.log("initializeResizeHandle");

    if ( !_resizeManager ) {
        console.log("new ResizeManager created");
        _resizeManager = new ResizeManager();
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