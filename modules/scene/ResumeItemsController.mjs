// scene/ResumeItemsController.mjs

import * as utils from '../utils/utils.mjs';
import * as BizDetailsDivModule from './bizDetailsDivModule.mjs';
import { selectionManager } from '../core/selectionManager.mjs';
import { cardsController } from './CardsController.mjs';
import { applyPaletteToElement, applyStateStyling } from '../composables/useColorPalette.mjs';
import { initializationManager } from '../core/initializationManager.mjs';
import { badgeManager } from '../core/badgeManager.mjs';
// No longer directly manipulating other managers
// import { bizCardDivManager } from './bizCardDivManager.mjs';
// import * as scenePlane from './scenePlane.mjs';
// import { resumeManager } from '../resume/resumeManager.mjs';

class ResumeItemsController {
    constructor() {
        // Singleton pattern: return existing instance if one exists
        if (ResumeItemsController.instance) {
            window.CONSOLE_LOG_IGNORE('[DEBUG] ResumeItemsController: Returning existing singleton instance');
            return ResumeItemsController.instance;
        }

        // Create new instance
        window.CONSOLE_LOG_IGNORE('[DEBUG] ResumeItemsController: Creating new singleton instance');
        
        this.bizResumeDivs = [];
        this.isInitialized = false;
        this._setupSelectionListeners();
        this._setupBadgeModeListener();
        this._setupColorPaletteListener();
        
        // Store the singleton instance
        ResumeItemsController.instance = this;
        
        window.CONSOLE_LOG_IGNORE('[DEBUG] ResumeItemsController: Singleton instance created and stored');
    }

    /**
     * Register this controller with the initialization manager
     * This allows other components to wait for ResumeItemsController to be ready
     */
    registerForInitialization() {
        initializationManager.register(
            'ResumeItemsController',
            async () => {
                // Wait for CardsController to be ready
                await initializationManager.waitForComponent('CardsController');
                this.initialize();
            },
            ['CardsController'], // Depends on CardsController being ready
            { priority: 'medium' }
        );
    }

    // This is now a separate function for the module manager to check.
    isInitialized() {
        return this.isInitialized;
    }

    initialize() {
        if (!cardsController.isInitialized) {
            throw new Error("ResumeItemsController requires cardsController to be initialized.");
        }
        if (this.isInitialized) {
            window.CONSOLE_LOG_IGNORE("ResumeItemsController already initialized.");
            return;
        }
        // This controller's main job is done in the moduleManager now,
        // so we just set the flag.
        this.isInitialized = true;

    }

    async createAllBizResumeDivs(bizCardDivs) {
        console.log('[ResumeItemsController] createAllBizResumeDivs called with:', bizCardDivs?.length || 0, 'cards');
        
        if (!bizCardDivs || bizCardDivs.length === 0) {
            console.warn("ResumeItemsController: Cannot create resume divs, no card divs provided.");
            return [];
        }
        
        this.bizResumeDivs = [];
        for (let i = 0; i < bizCardDivs.length; i++) {
            const cardDiv = bizCardDivs[i];
            // console.log(`[ResumeItemsController] Processing card ${i}:`, cardDiv);
            
            if (!cardDiv) {
                console.warn(`[ResumeItemsController] Card at index ${i} is null/undefined, skipping`);
                continue;
            }
            
            try {
                const resumeDiv = await this.createBizResumeDiv(cardDiv);
                this.bizResumeDivs.push(resumeDiv);
            } catch (error) {
                console.error(`[ResumeItemsController] Failed to create resume div for card ${i}:`, error);
                // Continue with other cards instead of failing completely
            }
        }
        return this.bizResumeDivs;
    }

    async createBizResumeDiv(bizCardDiv) {
        if (!bizCardDiv) throw new Error('createBizResumeDiv: bizCardDiv not found');

        const jobNumberStr = bizCardDiv.getAttribute('data-job-number');
        if (!utils.isNumericString(jobNumberStr)) {
            throw new Error('createBizResumeDiv: jobNumber is not a numeric string');
        }
        const jobNumber = parseInt(jobNumberStr, 10);
        
        const bizResumeDiv = document.createElement('div');
        bizResumeDiv.id = this.createBizResumeDivId(jobNumber);
        bizResumeDiv.className = 'biz-resume-div';
        bizResumeDiv.setAttribute('data-job-number', jobNumber);
        bizResumeDiv.setAttribute('data-color-index', bizCardDiv.getAttribute('data-color-index'));

        bizResumeDiv.style.pointerEvents = 'auto';

        const bizResumeDetailsDiv = BizDetailsDivModule.createBizResumeDetailsDiv(bizResumeDiv, bizCardDiv);
        bizResumeDiv.appendChild(bizResumeDetailsDiv);

        // Apply the current color palette
        await applyPaletteToElement(bizResumeDiv);

        // Apply normal state styling after palette application
        applyStateStyling(bizResumeDiv, 'normal');

        this._setupMouseListeners(bizResumeDiv);

        return bizResumeDiv;
    }

    createBizResumeDivId(jobNumber) {
        return `resume-${jobNumber}`;
    }

    getBizResumeDivByJobNumber(jobNumber) {
        return this.bizResumeDivs.find(div => parseInt(div.getAttribute('data-job-number'), 10) === jobNumber) || null;
    }

    _setupSelectionListeners() {
        selectionManager.addEventListener('selectionChanged', this.handleSelectionChanged.bind(this));
        selectionManager.addEventListener('selectionCleared', this.handleSelectionCleared.bind(this));
        selectionManager.addEventListener('hoverChanged', this.handleHoverChanged.bind(this));
        selectionManager.addEventListener('hoverCleared', this.handleHoverCleared.bind(this));
    }

    _setupBadgeModeListener() {
        badgeManager.addEventListener('badgeModeChanged', this.handleBadgeModeChanged.bind(this));
    }

    _setupColorPaletteListener() {
        window.addEventListener('color-palette-changed', this.handleColorPaletteChanged.bind(this));
    }

    _setupMouseListeners(bizResumeDiv) {
        if (!bizResumeDiv) return;
        bizResumeDiv.addEventListener('click', () => this.handleBizResumeDivClickEvent(bizResumeDiv));
        bizResumeDiv.addEventListener('mouseenter', () => this.handleMouseEnterEvent(bizResumeDiv));
        bizResumeDiv.addEventListener('mouseleave', () => this.handleMouseLeaveEvent(bizResumeDiv));
    }

    handleBizResumeDivClickEvent(bizResumeDiv) {
        if (!bizResumeDiv) return;
        const jobNumber = parseInt(bizResumeDiv.getAttribute('data-job-number'), 10);
        const isSelected = selectionManager.getSelectedJobNumber() === jobNumber;

        if (isSelected) {
            selectionManager.clearSelection('ResumeItemsController.handleBizResumeDivClickEvent');
        } else {
            selectionManager.selectJobNumber(jobNumber, 'ResumeItemsController.handleBizResumeDivClickEvent');
        }
    }

    handleMouseEnterEvent(bizResumeDiv) {
        if (!bizResumeDiv) return;
        const jobNumber = parseInt(bizResumeDiv.getAttribute('data-job-number'), 10);
        
        
        // Always trigger hover events for badge coordination, even for selected items
        selectionManager.hoverJobNumber(jobNumber, 'ResumeItemsController.handleMouseEnterEvent');
    }

    handleMouseLeaveEvent(bizResumeDiv) {
        if (!bizResumeDiv) return;
        selectionManager.clearHover('ResumeItemsController.handleMouseLeaveEvent');
    }

    handleHoverChanged(event) {
        const { hoveredJobNumber, caller } = event.detail;

        // Clear previous hovers first (always, even for selected items to maintain coordination)
        this.handleHoverCleared({ detail: { caller: 'handleHoverChanged' } });

        // Skip applying hover styling to selected items, but allow event coordination to proceed
        if (selectionManager.getSelectedJobNumber() === hoveredJobNumber) {
            console.log(`[DEBUG] ResumeItemsController: Skipping hover styling for selected item ${hoveredJobNumber}, but allowing coordination`);
            return;
        }

        const bizResumeDiv = this.getBizResumeDivByJobNumber(hoveredJobNumber);
        if (bizResumeDiv) {
            bizResumeDiv.classList.add('hovered');
            
            // Apply hover state styling using the new system
            applyStateStyling(bizResumeDiv, 'hovered');
            

        }
    }

    handleHoverCleared(event) {
        const { caller } = event.detail;
        this.bizResumeDivs.forEach(div => {
            div.classList.remove('hovered');
            // Reset to normal state (only if not selected)
            if (!div.classList.contains('selected')) {
                applyStateStyling(div, 'normal');
            }
        });
    }

    handleSelectionChanged(event) {
        const { selectedJobNumber, caller } = event.detail;
        
        window.CONSOLE_LOG_IGNORE(`[DEBUG] ResumeItemsController.handleSelectionChanged: selectedJobNumber=${selectedJobNumber}, caller=${caller}`);
        
        // Clear previous selections first
        this.handleSelectionCleared({ detail: { caller: 'handleSelectionChanged' } });

        const bizResumeDiv = this.getBizResumeDivByJobNumber(selectedJobNumber);
        
        if (bizResumeDiv) {
            window.CONSOLE_LOG_IGNORE(`[DEBUG] ResumeItemsController.handleSelectionChanged: Found resume div for job ${selectedJobNumber}`);
            bizResumeDiv.classList.add('selected');
            
            // Apply selected state styling using the new system
            applyStateStyling(bizResumeDiv, 'selected');
            
            // Force browser repaint to ensure stats div visibility updates immediately
            bizResumeDiv.offsetHeight; // Reading offsetHeight forces a reflow
            
            // Trigger height recalculation to accommodate visible stats div
            if (window.resumeListController && window.resumeListController.infiniteScroller) {
                window.resumeListController.infiniteScroller.recalculateHeights();
                window.CONSOLE_LOG_IGNORE(`[DEBUG] ResumeItemsController.handleSelectionChanged: Triggered height recalculation`);
            }
            
            window.CONSOLE_LOG_IGNORE(`[DEBUG] ResumeItemsController.handleSelectionChanged: Applied 'selected' class to resume div`);
        } else {
            window.CONSOLE_LOG_IGNORE(`ResumeItemsController: No resume div found for job number ${selectedJobNumber}`);
        }
    }

    handleSelectionCleared(event) {
        const { caller } = event.detail;
        this.bizResumeDivs.forEach(div => {
            div.classList.remove('selected');
            // Reset to normal state
            applyStateStyling(div, 'normal');
            // Force browser repaint to ensure stats div visibility updates immediately
            div.offsetHeight; // Reading offsetHeight forces a reflow
        });
        
        // Trigger height recalculation to accommodate hidden stats divs
        if (window.resumeListController && window.resumeListController.infiniteScroller) {
            window.resumeListController.infiniteScroller.recalculateHeights();
            window.CONSOLE_LOG_IGNORE(`[DEBUG] ResumeItemsController.handleSelectionCleared: Triggered height recalculation`);
        }
    }

    handleBadgeModeChanged(event) {
        const { mode, previousMode, caller } = event.detail;
        
        window.CONSOLE_LOG_IGNORE(`[DEBUG] ResumeItemsController.handleBadgeModeChanged: Mode changed from ${previousMode} to ${mode} (caller: ${caller})`);
        
        // Force browser repaint to ensure stats visibility updates are applied immediately
        this.bizResumeDivs.forEach(div => {
            if (div) {
                div.offsetHeight; // Reading offsetHeight forces a reflow
            }
        });
        
        // Trigger height recalculation to accommodate visible/hidden stats divs
        if (window.resumeListController && window.resumeListController.infiniteScroller) {
            window.resumeListController.infiniteScroller.recalculateHeights();
            window.CONSOLE_LOG_IGNORE(`[DEBUG] ResumeItemsController.handleBadgeModeChanged: Triggered height recalculation for badge mode change`);
        }
    }

    handleColorPaletteChanged(event) {
        const { filename, paletteName, previousFilename } = event.detail;
        
        window.CONSOLE_LOG_IGNORE(`[DEBUG] ResumeItemsController.handleColorPaletteChanged: Palette changed from ${previousFilename} to ${filename} (${paletteName})`);
        
        // Apply new palette to all resume divs and their children
        this.bizResumeDivs.forEach(div => {
            if (div) {
                // Apply palette to the div itself and all elements with data-color-index within it
                applyPaletteToElement(div);
                const colorElements = div.querySelectorAll('[data-color-index]');
                colorElements.forEach(applyPaletteToElement);
            }
        });
        
        window.CONSOLE_LOG_IGNORE(`[DEBUG] ResumeItemsController.handleColorPaletteChanged: Applied new palette to ${this.bizResumeDivs.length} resume divs`);
    }

    // Static method to reset the singleton instance
    static reset() {
        window.CONSOLE_LOG_IGNORE('[DEBUG] ResumeItemsController: Resetting singleton instance');
        if (ResumeItemsController.instance) {
            // Clean up event listeners
            const instance = ResumeItemsController.instance;
            selectionManager.removeEventListener('selectionChanged', instance.handleSelectionChanged.bind(instance));
            selectionManager.removeEventListener('selectionCleared', instance.handleSelectionCleared.bind(instance));
            selectionManager.removeEventListener('hoverChanged', instance.handleHoverChanged.bind(instance));
            selectionManager.removeEventListener('hoverCleared', instance.handleHoverCleared.bind(instance));
            badgeManager.removeEventListener('badgeModeChanged', instance.handleBadgeModeChanged.bind(instance));
            window.removeEventListener('color-palette-changed', instance.handleColorPaletteChanged.bind(instance));
            
            // Clean up other resources
            instance.bizResumeDivs = [];
            instance.isInitialized = false;
        }
        ResumeItemsController.instance = null;
    }

    // Static method to get the current instance
    static getInstance() {
        return ResumeItemsController.instance;
    }

} // end class ResumeItemsController

const resumeItemsController = new ResumeItemsController();
export { resumeItemsController };

