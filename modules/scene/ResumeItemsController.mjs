// scene/ResumeItemsController.mjs

import * as utils from '../utils/utils.mjs';
import * as BizDetailsDivModule from './bizDetailsDivModule.mjs';
import * as colorPalettes from '../colors/colorPalettes.mjs';
import { selectionManager } from '../core/selectionManager.mjs';
// No longer directly manipulating other managers
// import { bizCardDivManager } from './bizCardDivManager.mjs';
// import * as scenePlane from './scenePlane.mjs';
// import { resumeManager } from '../resume/resumeManager.mjs';

class ResumeItemsController {
    constructor() {
        this.bizResumeDivs = [];
        this._setupSelectionListeners();
    }

    createAllBizResumeDivs(bizCardDivs) {
        if (!bizCardDivs || !Array.isArray(bizCardDivs)) {
            console.error("createAllBizResumeDivs requires an array of bizCardDivs");
            return [];
        }
        this.bizResumeDivs = bizCardDivs.map(cardDiv => this.createBizResumeDiv(cardDiv));
        return this.bizResumeDivs;
    }

    createBizResumeDiv(bizCardDiv) {
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
        bizResumeDiv.setAttribute('data-color-group-index', bizCardDiv.getAttribute('data-color-group-index'));

        bizResumeDiv.style.pointerEvents = 'auto';

        const bizResumeDetailsDiv = BizDetailsDivModule.createBizResumeDetailsDiv(bizResumeDiv, bizCardDiv);
        bizResumeDiv.appendChild(bizResumeDetailsDiv);

        colorPalettes.applyCurrentColorPaletteToElement(bizResumeDiv);
        
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

