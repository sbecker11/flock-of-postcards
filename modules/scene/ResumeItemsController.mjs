// scene/ResumeItemsController.mjs

import * as utils from '../utils/utils.mjs';
import * as BizDetailsDivModule from './bizDetailsDivModule.mjs';
import { selectionManager } from '../core/selectionManager.mjs';
import { cardsController } from './CardsController.mjs';
import { applyPaletteToElement } from '../composables/useColorPalette.mjs';
// No longer directly manipulating other managers
// import { bizCardDivManager } from './bizCardDivManager.mjs';
// import * as scenePlane from './scenePlane.mjs';
// import { resumeManager } from '../resume/resumeManager.mjs';

class ResumeItemsController {
    constructor() {
        this.bizResumeDivs = [];
        this.isInitialized = false;
        this._setupSelectionListeners();
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
            console.warn("ResumeItemsController already initialized.");
            return;
        }
        // This controller's main job is done in the moduleManager now,
        // so we just set the flag.
        this.isInitialized = true;
        CONSOLE_LOG_IGNORE("ResumeItemsController initialized.");
    }

    async createAllBizResumeDivs(bizCardDivs) {
        if (!bizCardDivs || bizCardDivs.length === 0) {
            console.error("ResumeItemsController: Cannot create resume divs, no card divs provided.");
            return [];
        }
        this.bizResumeDivs = [];
        for (const cardDiv of bizCardDivs) {
            const resumeDiv = await this.createBizResumeDiv(cardDiv);
            this.bizResumeDivs.push(resumeDiv);
        }
        return this.bizResumeDivs;
    }

    async createBizResumeDiv(bizCardDiv) {
        if (!bizCardDiv) throw new Error('createBizResumeDiv: bizCardDiv not found');

        const jobIndexStr = bizCardDiv.getAttribute('data-job-index');
        if (!utils.isNumericString(jobIndexStr)) {
            throw new Error('createBizResumeDiv: jobIndex is not a numeric string');
        }
        const jobIndex = parseInt(jobIndexStr, 10);
        
        const bizResumeDiv = document.createElement('div');
        bizResumeDiv.id = this.createBizResumeDivId(jobIndex);
        bizResumeDiv.className = 'biz-resume-div';
        bizResumeDiv.setAttribute('data-job-index', jobIndex);
        bizResumeDiv.setAttribute('data-color-index', bizCardDiv.getAttribute('data-color-index'));

        bizResumeDiv.style.pointerEvents = 'auto';

        const bizResumeDetailsDiv = BizDetailsDivModule.createBizResumeDetailsDiv(bizResumeDiv, bizCardDiv);
        bizResumeDiv.appendChild(bizResumeDetailsDiv);

        // Apply the current color palette
        await applyPaletteToElement(bizResumeDiv);

        this._setupMouseListeners(bizResumeDiv);

        return bizResumeDiv;
    }

    createBizResumeDivId(jobIndex) {
        return `resume-${jobIndex}`;
    }

    getBizResumeDivByJobIndex(jobIndex) {
        return this.bizResumeDivs.find(div => parseInt(div.getAttribute('data-job-index'), 10) === jobIndex) || null;
    }

    _setupSelectionListeners() {
        selectionManager.addEventListener('selectionChanged', this.handleSelectionChanged.bind(this));
        selectionManager.addEventListener('selectionCleared', this.handleSelectionCleared.bind(this));
        selectionManager.addEventListener('hoverChanged', this.handleHoverChanged.bind(this));
        selectionManager.addEventListener('hoverCleared', this.handleHoverCleared.bind(this));
    }

    _setupMouseListeners(bizResumeDiv) {
        if (!bizResumeDiv) return;
        bizResumeDiv.addEventListener('click', () => this.handleBizResumeDivClickEvent(bizResumeDiv));
        bizResumeDiv.addEventListener('mouseenter', () => this.handleMouseEnterEvent(bizResumeDiv));
        bizResumeDiv.addEventListener('mouseleave', () => this.handleMouseLeaveEvent(bizResumeDiv));
    }

    handleBizResumeDivClickEvent(bizResumeDiv) {
        if (!bizResumeDiv) return;
        const jobIndex = parseInt(bizResumeDiv.getAttribute('data-job-index'), 10);
        const isSelected = selectionManager.getSelectedJobIndex() === jobIndex;

        if (isSelected) {
            selectionManager.clearSelection('ResumeItemsController.handleBizResumeDivClickEvent');
        } else {
            selectionManager.selectJobIndex(jobIndex, 'ResumeItemsController.handleBizResumeDivClickEvent');
        }
    }

    handleMouseEnterEvent(bizResumeDiv) {
        if (!bizResumeDiv) return;
        const jobIndex = parseInt(bizResumeDiv.getAttribute('data-job-index'), 10);
        if (selectionManager.getSelectedJobIndex() === jobIndex) return; // Ignore hover on selected item
        selectionManager.hoverJobIndex(jobIndex, 'ResumeItemsController.handleMouseEnterEvent');
    }

    handleMouseLeaveEvent(bizResumeDiv) {
        if (!bizResumeDiv) return;
        selectionManager.clearHover('ResumeItemsController.handleMouseLeaveEvent');
    }

    handleSelectionChanged(event) {
        const { selectedJobIndex, caller } = event.detail;
        
        // Clear previous selections first
        this.handleSelectionCleared({ detail: { caller: 'handleSelectionChanged' } });

        const bizResumeDiv = this.getBizResumeDivByJobIndex(selectedJobIndex);
        if (bizResumeDiv) {
            bizResumeDiv.classList.add('selected');
        }
    }

    handleSelectionCleared(event) {
        const { caller } = event.detail;
        this.bizResumeDivs.forEach(div => div.classList.remove('selected'));
    }

    handleHoverChanged(event) {
        const { hoveredJobIndex, caller } = event.detail;

        if (selectionManager.getSelectedJobIndex() === hoveredJobIndex) return;

        // Clear previous hovers first
        this.handleHoverCleared({ detail: { caller: 'handleHoverChanged' } });

        const bizResumeDiv = this.getBizResumeDivByJobIndex(hoveredJobIndex);
        if (bizResumeDiv) {
            bizResumeDiv.classList.add('hovered');
        }
    }

    handleHoverCleared(event) {
        const { caller } = event.detail;
        this.bizResumeDivs.forEach(div => div.classList.remove('hovered'));
    }

} // end class ResumeItemsController

const resumeItemsController = new ResumeItemsController();
export { resumeItemsController };

