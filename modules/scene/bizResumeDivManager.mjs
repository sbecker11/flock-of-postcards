// scene/bizResumeDivManager.mjs

import * as utils from '../utils/utils.mjs';
import * as BizDetailsDivModule from './bizDetailsDivModule.mjs';
import * as colorPalettes from '../colors/colorPalettes.mjs';
import { bizCardDivManager } from './bizCardDivManager.mjs';
import * as scenePlane from './scenePlane.mjs';
import { resumeManager } from '../resume/resumeManager.mjs';

import { Logger, LogLevel } from '../logger.mjs';

class BizResumeDivManager {
    constructor() {
        this.logger = new Logger("BizResumeDivManager", LogLevel.INFO);
        this.bizResumeDivs = [];
    }

    createAllBizResumeDivs(bizCardDivs) {
        if (!bizCardDivs || !Array.isArray(bizCardDivs)) {
            this.logger.error("createAllBizResumeDivs requires an array of bizCardDivs");
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

        return bizResumeDiv;
    }

    createBizResumeDivId(jobIndex) {
        return `resume-${jobIndex}`;
    }

    handleClickEvent(element) {
        if (!element) {
            this.logger.error("handleClickEvent called with null element");
            return;
        }
        
        if (element.classList.contains("biz-resume-div")) {
            this.handleBizResumeDivClickEvent(element);
        }
    }

    handleBizResumeDivClickEvent(bizResumeDiv, options = {}) {
        const { syncScene = true } = options;

        if (!bizResumeDiv) throw new Error("bizResumeDiv is required");

        const isSelected = bizResumeDiv.classList.contains("selected");

        scenePlane.clearAllSelected();

        if (isSelected) {
            resumeManager.clearSelectedJobIndex();
            return;
        }

        bizResumeDiv.classList.add("selected");
        bizResumeDiv.classList.remove("hovered");

        resumeManager.setSelectedJobIndex(bizResumeDiv.getAttribute("data-job-index"));

        if (syncScene) {
            const pairedId = bizResumeDiv.getAttribute('data-paired-id');
            const bizCardDiv = document.getElementById(pairedId);

            if (bizCardDiv) {
                this.styleBizCardDivAsSelectedAndScrollIntoView(bizCardDiv);
            } else {
                this.logger.info(`Could not find paired bizCardDiv with ID ${pairedId}`);
            }
        }
    }

    styleBizCardDivAsSelectedAndScrollIntoView(bizCardDiv) {
        if (!bizCardDiv) throw new Error("bizCardDiv is required");
        
        bizCardDiv.classList.remove("hovered");
        bizCardDiv.classList.add('selected');
        
        bizCardDivManager.scrollBizCardDivIntoView(bizCardDiv);
    }
}

const bizResumeDivManager = new BizResumeDivManager();
export { bizResumeDivManager };
