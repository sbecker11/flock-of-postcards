// scene/bizCardDivManager.mjs

import * as colorPalettes from '../colors/colorPalettes.mjs';
import { resumeManager } from '../resume/resumeManager.mjs';
import * as scenePlane from './scenePlane.mjs';
import * as utils from '../utils/utils.mjs';
import * as viewPort from '../core/viewPort.mjs';
import * as BizDetailsDivModule from './bizDetailsDivModule.mjs';
import * as timeline from '../timeline/timeline.mjs';
import * as dateUtils from '../utils/dateUtils.mjs';
import * as mathUtils from '../utils/mathUtils.mjs';
import * as zUtils from '../utils/zUtils.mjs';

import { Logger, LogLevel } from '../logger.mjs';

const BIZCARD_MAX_X_OFFSET = 100;
const BIZCARD_MEAN_WIDTH = 200;
const BIZCARD_MAX_WIDTH_OFFSET = 40;
const BIZCARD_MIN_Z_DIFF = 2;
const MIN_HEIGHT = 200;

class BizCardDivManager {
    constructor() {
        this.logger = new Logger("BizCardDivManager", LogLevel.INFO);
        this.bizCardDivs = [];
        this.isInitialized = false;
    }

    initialize() {
        if (this.isInitialized) {
            this.logger.warn("BizCardDivManager already initialized");
            return;
        }

        if (!resumeManager || !resumeManager.isInitialized()) {
            this.logger.warn("Cannot initialize BizCardDivManager: resumeManager not found or not initialized");
            return;
        }
        if (!viewPort || !viewPort.isViewPortInitialized()) {
            this.logger.warn("Cannot initialize BizCardDivManager: viewPort not found or not initialized");
            return;
        }

        this._setupEventListeners();
        this.setupPointerEventsObserver();
        this.isInitialized = true;
        this.logger.info("BizCardDivManager initialized successfully");
    }

    createAllBizCardDivs(jobs) {
        const scenePlaneEl = document.getElementById('scene-plane');
        if (!scenePlaneEl) {
            this.logger.error("Scene plane element not found!");
            return [];
        }

        this.bizCardDivs = jobs.map((job, index) => this.createBizCardDiv(job, index, jobs.length));
        
        this.bizCardDivs.forEach(card => scenePlaneEl.appendChild(card));
        
        return this.bizCardDivs;
    }

    createBizCardDiv(job, index, totalJobs) {
        const bizCardDiv = document.createElement('div');
        bizCardDiv.className = 'biz-card-div';
        bizCardDiv.id = this.createBizCardDivId(index);
        bizCardDiv.setAttribute('data-job-index', index.toString());
        
        this._setBizCardDivSceneGeometry(bizCardDiv, job);
        
        const { colorIndex, groupIndex } = colorPalettes.assignColorIndex(bizCardDiv, index, totalJobs);
        bizCardDiv.setAttribute('data-color-index', colorIndex);

        const bizCardDetailsDiv = BizDetailsDivModule.createBizCardDetailsDiv(bizCardDiv, job, colorIndex);
        bizCardDiv.appendChild(bizCardDetailsDiv);

        colorPalettes.applyCurrentColorPaletteToElement(bizCardDiv, groupIndex);

        return bizCardDiv;
    }
    
    createBizCardDivId(jobIndex) {
        return `biz-card-div-${jobIndex}`;
    }

    getBizCardDivByJobIndex(jobIndex) {
        for (const bizCardDiv of this.bizCardDivs) {
            if (bizCardDiv.getAttribute('data-job-index') === jobIndex.toString()) {
                return bizCardDiv;
            }
        }
        return null;
    }

    _setBizCardDivSceneGeometry(bizCardDiv, job) {
        if (!job.start) {
            this.logger.warn(`Job ${job.role || bizCardDiv.id} is missing a start date. Skipping geometry calculation.`);
            return;
        }

        const startDate = dateUtils.parseFlexibleDateString(job.start);
        const endDate = (job.end && job.end === "CURRENT_DATE")
            ? new Date()
            : dateUtils.parseFlexibleDateString(job.end || job.start);

        if (!startDate || !endDate) {
            this.logger.warn(`Could not parse dates for job ${job.role || bizCardDiv.id}. Skipping geometry calculation.`);
            return;
        }

        const start_year_str = startDate.getFullYear().toString();
        const start_month_str = (startDate.getMonth() + 1).toString();
        let sceneBottom = timeline.getTimelineYearMonthBottom(start_year_str, start_month_str);

        const end_year_str = endDate.getFullYear().toString();
        const end_month_str = (endDate.getMonth() + 1).toString();
        let sceneTop = timeline.getTimelineYearMonthBottom(end_year_str, end_month_str);

        let sceneHeight = sceneBottom - sceneTop;
        const sceneCenterY = sceneTop + sceneHeight / 2;

        if (sceneHeight < MIN_HEIGHT) {
            sceneHeight = MIN_HEIGHT;
            sceneTop = sceneCenterY - MIN_HEIGHT / 2;
            sceneBottom = sceneCenterY + MIN_HEIGHT / 2;
        }
        
        bizCardDiv.setAttribute("data-sceneTop", sceneTop);
        bizCardDiv.setAttribute("data-sceneBottom", sceneBottom);
        bizCardDiv.setAttribute("data-sceneHeight", sceneHeight);
        bizCardDiv.setAttribute("data-sceneCenterY", sceneCenterY);
        
        const sceneCenterX = mathUtils.getRandomSignedOffset(BIZCARD_MAX_X_OFFSET);
        const sceneWidth = BIZCARD_MEAN_WIDTH + mathUtils.getRandomSignedOffset(BIZCARD_MAX_WIDTH_OFFSET);
        const sceneLeft = sceneCenterX - sceneWidth / 2;
        const sceneRight = sceneCenterX + sceneWidth / 2;
        
        bizCardDiv.setAttribute("data-sceneLeft", sceneLeft);
        bizCardDiv.setAttribute("data-sceneRight", sceneRight);
        bizCardDiv.setAttribute("data-sceneWidth", sceneWidth);
        bizCardDiv.setAttribute("data-sceneCenterX", sceneCenterX);
        
        let sceneZ = 0;
        let lastSceneZ = -1;
        while (true) {
            sceneZ = mathUtils.getRandomInt(zUtils.ALL_CARDS_Z_MIN, zUtils.ALL_CARDS_Z_MAX);
            if (utils.abs_diff(sceneZ, lastSceneZ) >= BIZCARD_MIN_Z_DIFF) {
                lastSceneZ = sceneZ;
                break;
            }
        }
        utils.validateNumberInRange(sceneZ, zUtils.ALL_CARDS_Z_MIN, zUtils.ALL_CARDS_Z_MAX);
        bizCardDiv.setAttribute("data-sceneZ", sceneZ);
    }


    handleBizCardDivClickEvent(bizCardDiv, options = {}) {
        const { syncResume = true } = options;
        if (!bizCardDiv) return;

        const isSelected = bizCardDiv.classList.contains('selected');
        
        scenePlane.clearAllSelected();

        if (isSelected) {
            resumeManager.clearSelectedJobIndex();
            return;
        }

        bizCardDiv.classList.add('selected');
        bizCardDiv.classList.remove('hovered');

        const jobIndex = parseInt(bizCardDiv.getAttribute('data-job-index'), 10);
        resumeManager.setSelectedJobIndex(jobIndex);

        if (syncResume) {
            resumeManager.syncWithSceneSelection(jobIndex);
        }
    }

    handleMouseEnterEvent(element) {
        if (!element || element.classList.contains('selected')) return;
        element.classList.add("hovered");
        const pairedId = element.getAttribute('data-paired-id');
        if (pairedId) {
            const pairedElement = document.getElementById(pairedId);
            if (pairedElement && !pairedElement.classList.contains('selected')) {
                pairedElement.classList.add("hovered");
            }
        }
    }

    handleMouseLeaveEvent(element) {
        if (!element || element.classList.contains('selected')) return;
        element.classList.remove("hovered");
        const pairedId = element.getAttribute('data-paired-id');
        if (pairedId) {
            const pairedElement = document.getElementById(pairedId);
            if (pairedElement && !pairedElement.classList.contains('selected')) {
                pairedElement.classList.remove("hovered");
            }
        }
    }
    
    scrollBizCardDivIntoView(bizCardDiv) {
        if (!bizCardDiv) return;
        const sceneContainer = document.getElementById('scene-container');
        if (!sceneContainer) return;
    
        const cardTop = bizCardDiv.offsetTop;
        
        sceneContainer.scrollTo({
            top: cardTop,
            behavior: 'smooth'
        });
    }

    _setupEventListeners() {
        const scenePlaneDiv = document.getElementById('scene-plane');
        if (!scenePlaneDiv) return;

        scenePlaneDiv.addEventListener('click', (event) => {
            const bizCardDiv = event.target.closest('.biz-card-div');
            if (bizCardDiv) {
                this.handleBizCardDivClickEvent(bizCardDiv);
            }
        });

        scenePlaneDiv.addEventListener('mouseover', (event) => {
            const bizCardDiv = event.target.closest('.biz-card-div');
            if (bizCardDiv) {
                this.handleMouseEnterEvent(bizCardDiv);
            }
        });

        scenePlaneDiv.addEventListener('mouseout', (event) => {
            const bizCardDiv = event.target.closest('.biz-card-div');
            if (bizCardDiv) {
                this.handleMouseLeaveEvent(bizCardDiv);
            }
        });
    }

    setupPointerEventsObserver() {
        const scenePlaneDiv = document.getElementById('scene-plane');
        if (!scenePlaneDiv) return;

        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && node.classList.contains('biz-card-div')) {
                            node.style.pointerEvents = 'auto';
                        }
                    });
                }
            });
        });

        observer.observe(scenePlaneDiv, { childList: true, subtree: true });

        // Also ensure existing ones have it
        document.querySelectorAll('.biz-card-div').forEach(div => {
            div.style.pointerEvents = 'auto';
        });
    }
}

const bizCardDivManager = new BizCardDivManager();
export { bizCardDivManager };
