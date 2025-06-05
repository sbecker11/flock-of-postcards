// scene/bizResumeDivModule.mjs

import * as utils from '../utils/utils.mjs';
import * as BizDetailsDivModule from './bizDetailsDivModule.mjs';
import * as colorPalettes from '../color/colorPalettes.mjs';

import { Logger, LogLevel } from '../logger.mjs';
const logger = new Logger("bizResumeDivModule", LogLevel.INFO);

// BizResumeDiv is the div that contains the resume of the job
// it is created by resumeManager and is never appended to the DOM. 
export function createBizResumeDiv(bizCardDiv) {
    if ( !bizCardDiv ) throw new Error('createBizResumeDiv: given null bizCardDiv');
    const bizResumeDiv = document.createElement("div");
    bizResumeDiv.classList.add("biz-resume-div");
    bizResumeDiv.classList.add("resume-content-div-child"); // Add the required class for proper styling
    bizResumeDiv.id = createBizResumeDivId(bizCardDiv.id);
    const jobIndex = bizCardDiv.getAttribute('data-job-index');
    if ( !utils.isNumeric(jobIndex)) throw new Error('createBizResumeDiv: given non-numeric attribute jobIndex');
    bizResumeDiv.setAttribute('data-job-index', jobIndex);

    // Apply the same color palette as the biz card
    const colorIndex = bizCardDiv.getAttribute('data-color-index');
    if ( !colorPalettes.isColorIndexString(colorIndex) ) throw new Error('createBizResumeDiv: given non-colorIndexString colorIndex');
    bizResumeDiv.setAttribute('data-color-index', colorIndex);
    
    // create bizResumeDetails after setting data-color-index
    const bizResumeDetailsDiv = BizDetailsDivModule.createBizResumeDetailsDiv(bizResumeDiv, bizCardDiv);
    bizResumeDiv.appendChild(bizResumeDetailsDiv);

    // and apply the color set to bizResumeDiv and its after appending the bizResumeDetailsDiv
    colorPalettes.applyCurrentColorPaletteToElement(bizResumeDiv);

    return bizResumeDiv;
}

/**
 * Gets the ID of a business resume div
 * @param {string} bizCardDivId - The index of the business card div
 * @returns {string} The ID of the business resume div
 */
export function createBizResumeDivId(bizCardDivId) {
    const bizResumeDivId = bizCardDivId.replace("card", "resume");
    return bizResumeDivId;
}
