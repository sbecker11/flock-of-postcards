// /modules/core/resizeHandle.mjs

import * as viewPort from './viewPort.mjs';
import * as focalPoint from '../core/focalPoint.mjs';

const BUTTON_COLUMN_WIDTH = 20;
const DEFAULT_WIDTH_PERCENT = 50;

let _resizeManager = null;
let _isInitialized = false;

export function isInitialized() {
    return _isInitialized;
}

/**
 * Initializes the resize handle and attaches event listeners.
 */
export function initialize() {
    if (_isInitialized) {
        console.warn("resizeHandle.initialize: already initialized");
        return;
    }
    const handleElement = document.getElementById('resize-handle');
    if (!handleElement) {
        console.error("resizeHandle.initialize: #resize-handle element not found in DOM.");
        return;
    }
    resizeManager._initialize(handleElement);
    _isInitialized = true;
    console.log("resizeHandle initialized.");
}

export function setScenePercent(scenePercent) {
    if (!_resizeManager) {
        throw new Error("resizeManager not initialized");
    }
    _resizeManager.updateLayoutFromPercentage(scenePercent);
}

function updatePercentageDisplay(percentage) {
    const percentageElement = document.getElementById('scene-visible-percentage');
    if (percentageElement) {
        percentageElement.textContent = `${Math.round(percentage)}%`;
    }
}

function clampToRange(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

class ResizeManager {
    constructor() {
        this.nIncrements = 3;
        this.hysteresisPixels = 2;
        this.percentage = DEFAULT_WIDTH_PERCENT;
        this.isDragging = false;
        this.debug = false;

        this._boundHandleDrag = this.handleDrag.bind(this);
        this._boundStopDrag = this.stopDrag.bind(this);
        this._debouncedWindowResize = debounce(this.handleWindowResize.bind(this), 50);
    }

    _initialize(handleElement) {
        this.getDOMElements(handleElement);

        this.nIncrements = 3;
        this.hysteresisPixels = 2;
        this.isDragging = false;
        this.startX = 0;
        this.lastSnapIndex = null;
        this.percentage = DEFAULT_WIDTH_PERCENT;
        
        this.setupEventListeners();
        this.updateLayoutFromPercentage(this.percentage);
    }

    getDOMElements(handleElement) {
        if (!handleElement) throw new Error("handleElement is required");

        this.resizeHandle = handleElement;
        this.collapseLeftButton = this.resizeHandle.querySelector('#collapse-left');
        this.collapseRightButton = this.resizeHandle.querySelector('#collapse-right');
        this.sceneVizPercent = this.resizeHandle.querySelector('#scene-visible-percentage');

        // These are outside the component, so we still find them globally
        this.sceneContainer = document.getElementById('scene-container');
        this.resumeContainer = document.getElementById('resume-container');

        if (!this.sceneContainer || !this.resumeContainer || !this.collapseLeftButton || !this.collapseRightButton || !this.resizeHandle || !this.sceneVizPercent) {
            throw new Error('ResizeManager: One or more required DOM elements not found.');
        }
    }

    setupEventListeners() {
        this.resizeHandle.addEventListener('mousedown', (e) => this.startDrag(e));
        
        // Button click listeners are now handled by the Vue component's template
        // this.collapseLeftButton.addEventListener('click', () => this.collapseLeft());
        // this.collapseRightButton.addEventListener('click', () => this.collapseRight());
        
        window.addEventListener('resize', this._debouncedWindowResize);
    }

    updateLayoutFromPercentage(percentage) {
        const windowWidth = window.innerWidth;
        const maxSceneWidth = windowWidth - BUTTON_COLUMN_WIDTH;
        this.percentage = clampToRange(percentage, 0, 100);
        this.sceneWidth = Math.round(this.percentage * maxSceneWidth / 100);
        this.resumeLeft = this.sceneWidth;
        this.resumeWidth = windowWidth - this.resumeLeft;

        if (this.resumeWidth < BUTTON_COLUMN_WIDTH) {
            this.resumeWidth = BUTTON_COLUMN_WIDTH;
            this.sceneWidth = windowWidth - this.resumeWidth;
            this.resumeLeft = this.sceneWidth;
        }
        this.applyLayout();
        
        requestAnimationFrame(() => this.triggerParallaxUpdate());
    }

    applyLayout() {
        console.log(`[ResizeManager] Applying layout: sceneWidth=${this.sceneWidth}px, resumeWidth=${this.resumeWidth}px`);

        if (this.sceneContainer) {
            console.log('[ResizeManager] Found sceneContainer, setting flex-basis.');
            this.sceneContainer.style.flexBasis = `${this.sceneWidth}px`;
        } else {
            console.error('[ResizeManager] sceneContainer element not found!');
        }

        if (this.resumeContainer) {
            console.log('[ResizeManager] Found resumeContainer, setting flex-basis.');
            this.resumeContainer.style.flexBasis = `${this.resumeWidth}px`;
        } else {
            console.error('[ResizeManager] resumeContainer element not found!');
        }
        
        // This part is still needed to inform the viewport inside the scene
        // The container's width is now managed by flex-basis, so this direct style might be redundant
        // but let's keep it to ensure viewport calculations are correct.
        this.sceneContainer.style.width = `${this.sceneWidth}px`;

        viewPort.setViewPortWidth(this.sceneWidth);
        this.updateButtonStates(this.percentage);
        updatePercentageDisplay(this.percentage);
    }
    
    triggerParallaxUpdate() {
        if (window.parallax && typeof window.parallax.updateParallax === 'function') {
            window.parallax.updateParallax("resize", true);
        }
    }

    handleDrag(e) {
        if (!this.isDragging) return;
        const dx = e.clientX - this.startX;
        const newLeft = this.startResumeLeft + dx;
        const windowWidth = window.innerWidth;
        const maxSceneWidth = windowWidth - BUTTON_COLUMN_WIDTH;
        let newPercentage = (newLeft / maxSceneWidth) * 100;
        
        this.updateLayoutFromPercentage(newPercentage);
    }

    stopDrag() {
        if (!this.isDragging) return;
        this.isDragging = false;
        document.body.style.userSelect = 'auto';
        
        document.removeEventListener('mousemove', this._boundHandleDrag);
        document.removeEventListener('mouseup', this._boundStopDrag);
        
        this.snapToIncrement();
    }
    
    snapToIncrement() {
        const snapPercentage = 100 / this.nIncrements;
        const currentSnapIndex = Math.round(this.percentage / snapPercentage);
        const newPercentage = currentSnapIndex * snapPercentage;
        this.updateLayoutFromPercentage(newPercentage);
    }

    collapseLeft() {
        const snapPercentage = 100 / this.nIncrements;
        const currentSnapIndex = Math.round(this.percentage / snapPercentage);
        const newIndex = Math.max(0, currentSnapIndex - 1);
        const newPercentage = newIndex * snapPercentage;
        this.updateLayoutFromPercentage(newPercentage);
    }

    collapseRight() {
        const snapPercentage = 100 / this.nIncrements;
        const currentSnapIndex = Math.round(this.percentage / snapPercentage);
        const newIndex = Math.min(this.nIncrements, currentSnapIndex + 1);
        const newPercentage = newIndex * snapPercentage;
        this.updateLayoutFromPercentage(newPercentage);
    }

    updateButtonStates(percentage) {
        if(this.collapseLeftButton) this.collapseLeftButton.disabled = percentage <= 0;
        if(this.collapseRightButton) this.collapseRightButton.disabled = percentage >= 100;
    }

    handleWindowResize() {
        this.updateLayoutFromPercentage(this.percentage);
    }

    startDrag(e) {
        // Prevent drag from starting if the click is on a button inside the handle
        if (e.target.closest('button')) {
            return;
        }

        this.isDragging = true;
        this.startX = e.clientX;
        this.startResumeLeft = this.resumeContainer.getBoundingClientRect().left;
        document.body.style.userSelect = 'none';
        
        document.addEventListener('mousemove', this._boundHandleDrag);
        document.addEventListener('mouseup', this._boundStopDrag);
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// We still export a single instance for the app to use
export const resizeManager = new ResizeManager();
