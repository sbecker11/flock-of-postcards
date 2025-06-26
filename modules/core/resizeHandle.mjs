// /modules/core/resizeHandle.mjs

import * as viewPort from './viewPort.mjs';
import * as focalPoint from '../core/focalPoint.mjs';
import { Logger, LogLevel } from '../logger.mjs';

const logger = new Logger("resizeHandle", LogLevel.INFO);
const BUTTON_COLUMN_WIDTH = 20;
const DEFAULT_WIDTH_PERCENT = 50;

let _resizeManager = null;

export function isResizeManagerInitialized() {
    return !!_resizeManager;
}

export function initializeResizeHandle() {
    if (_resizeManager) {
        logger.warn("ResizeManager already initialized.");
        return;
    }
    _resizeManager = new ResizeManager();
    _resizeManager._initialize();
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
    }

    _initialize(nIncrements = 3, hysteresisPixels = 2) {
        this.sceneContainer = document.getElementById('scene-container');
        this.resumeContainer = document.getElementById('resume-container');
        this.resumeContainerLeft = document.getElementById('resume-container-left');
        this.collapseLeftButton = document.getElementById('collapse-left');
        this.collapseRightButton = document.getElementById('collapse-right');
        this.focalLockButton = document.getElementById('focal-lock');
        this.resizeHandle = document.getElementById('resize-handle');
        this.sceneVizPercent = document.getElementById('scene-visible-percentage');

        if (!this.sceneContainer || !this.resumeContainer || !this.resumeContainerLeft || !this.collapseLeftButton || !this.collapseRightButton || !this.focalLockButton || !this.sceneVizPercent) {
            throw new Error('ResizeManager: One or more required DOM elements not found.');
        }

        this.nIncrements = nIncrements;
        this.hysteresisPixels = hysteresisPixels;
        this.isDragging = false;
        this.startX = 0;
        this.lastSnapIndex = null;
        this.percentage = DEFAULT_WIDTH_PERCENT;
        
        this.initializeFocalLockButton();

        this._boundHandleDrag = this.handleDrag.bind(this);
        this._boundStopDrag = this.stopDrag.bind(this);
        this._debouncedWindowResize = debounce(this.handleWindowResize.bind(this), 50);

        this.setupEventListeners();
        this.updateLayoutFromPercentage(this.percentage);
    }

    setupEventListeners() {
        this.resumeContainerLeft.addEventListener('mousedown', (e) => this.startDrag(e));
        this.collapseLeftButton.addEventListener('click', () => this.collapseLeft());
        this.collapseRightButton.addEventListener('click', () => this.collapseRight());
        window.addEventListener('resize', this._debouncedWindowResize);
    }

    initializeFocalLockButton() {
        if (!this.focalLockButton) return;
        
        const updateIcon = (isLocked) => {
            const icon = this.focalLockButton.querySelector('img');
            if (icon) {
                const iconName = isLocked ? 'Lock-Closed-white.png' : 'Lock-Open-white.png';
                icon.src = `static_content/icons/focal-lock/${iconName}`;
                icon.alt = isLocked ? 'Focal point locked' : 'Focal point unlocked';
            }
        };

        this.focalLockButton.addEventListener('click', () => {
            const isLocked = focalPoint.toggleLockedToBullsEye();
            updateIcon(isLocked);
        });

        updateIcon(focalPoint.isLockedToBullsEye());
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
        if (this.resumeContainer) {
            this.resumeContainer.style.left = `${this.resumeLeft}px`;
            this.resumeContainer.style.width = `${this.resumeWidth}px`;
        }
        if (this.sceneContainer) {
            this.sceneContainer.style.width = `${this.sceneWidth}px`;
        }
        viewPort.setViewPortWidth(this.sceneWidth);
        this.updateButtonStates(this.percentage);
        updatePercentageDisplay(this.percentage);
    }
    
    triggerParallaxUpdate() {
        if (window.parallax && typeof window.parallax.updateParallax === 'function') {
            window.parallax.updateParallax("resize", true);
        }
    }

    startDrag(e) {
        this.isDragging = true;
        this.startX = e.clientX;
        this.startResumeLeft = this.resumeContainer.getBoundingClientRect().left;
        document.body.style.userSelect = 'none';
        
        document.addEventListener('mousemove', this._boundHandleDrag);
        document.addEventListener('mouseup', this._boundStopDrag);
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
        this.updateLayoutFromPercentage(0);
    }

    collapseRight() {
        this.updateLayoutFromPercentage(100);
    }

    updateButtonStates(percentage) {
        if(this.collapseLeftButton) this.collapseLeftButton.disabled = percentage <= 0;
        if(this.collapseRightButton) this.collapseRightButton.disabled = percentage >= 100;
    }

    handleWindowResize() {
        this.updateLayoutFromPercentage(this.percentage);
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
