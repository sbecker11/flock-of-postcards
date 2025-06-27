// scene/bizCardDivManager.mjs

import * as colorPalettes from '../colors/colorPalettes.mjs';
import { selectionManager } from '../core/selectionManager.mjs';
import * as scenePlane from './scenePlane.mjs';
import * as utils from '../utils/utils.mjs';
import * as viewPort from '../core/viewPort.mjs';
import * as BizDetailsDivModule from './bizDetailsDivModule.mjs';
import * as timeline from '../timeline/timeline.mjs';
import * as dateUtils from '../utils/dateUtils.mjs';
import * as mathUtils from '../utils/mathUtils.mjs';
import * as zUtils from '../utils/zUtils.mjs';
import * as filters from '../core/filters.mjs';

const BIZCARD_MAX_X_OFFSET = 100;
const BIZCARD_MEAN_WIDTH = 200;
const BIZCARD_MAX_WIDTH_OFFSET = 40;
const BIZCARD_MIN_Z_DIFF = 2;
const MIN_HEIGHT = 200;

class BizCardDivManager {
    constructor() {
        this.bizCardDivs = [];
        this.isInitialized = false;
        this._setupSelectionListeners();
        this.setupPointerEventsObserver();
    }

    initialize() {
        if (this.isInitialized) {
            console.warn("BizCardDivManager already initialized");
            return;
        }

        if (!resumeManager || !resumeManager.isInitialized()) {
            console.warn("Cannot initialize BizCardDivManager: resumeManager not found or not initialized");
            return;
        }
        if (!viewPort || !viewPort.isViewPortInitialized()) {
            console.warn("Cannot initialize BizCardDivManager: viewPort not found or not initialized");
            return;
        }

        this.isInitialized = true;
        console.info("BizCardDivManager initialized successfully");
    }

    createAllBizCardDivs(jobs) {
        const scenePlaneEl = document.getElementById('scene-plane');
        if (!scenePlaneEl) {
            console.error("Scene plane element not found!");
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

        this._setupMouseListeners(bizCardDiv);

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
            console.warn(`Job ${job.role || bizCardDiv.id} is missing a start date. Skipping geometry calculation.`);
            return;
        }

        const startDate = dateUtils.parseFlexibleDateString(job.start);
        const endDate = (job.end && job.end === "CURRENT_DATE")
            ? new Date()
            : dateUtils.parseFlexibleDateString(job.end || job.start);

        if (!startDate || !endDate) {
            console.warn(`Could not parse dates for job ${job.role || bizCardDiv.id}. Skipping geometry calculation.`);
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
        
        // set the z-relative style properties
        bizCardDiv.style.setProperty("z-index", zUtils.get_zIndexStr_from_z(sceneZ));
        bizCardDiv.style.filter = filters.get_filterStr_from_z(sceneZ);

        // console.log(`Card ID: ${bizCardDiv.id}, Filter: ${bizCardDiv.style.filter}`);
    }

    _setupSelectionListeners() {
        selectionManager.addEventListener('selectionChanged', this.handleSelectionChanged.bind(this));
        selectionManager.addEventListener('selectionCleared', this.handleSelectionCleared.bind(this));
        selectionManager.addEventListener('hoverChanged', this.handleHoverChanged.bind(this));
        selectionManager.addEventListener('hoverCleared', this.handleHoverCleared.bind(this));
    }

    _setupMouseListeners(bizCardDiv) {
        if (!bizCardDiv) return;
        bizCardDiv.addEventListener('click', (e) => {
            // Stop propagation to prevent scenePlane from immediately clearing the selection
            e.stopPropagation(); 
            this.handleBizCardDivClickEvent(bizCardDiv);
        });
        bizCardDiv.addEventListener('mouseenter', () => this.handleMouseEnterEvent(bizCardDiv));
        bizCardDiv.addEventListener('mouseleave', () => this.handleMouseLeaveEvent(bizCardDiv));
    }

    // called by handleBizCardDivClickEvent
    // handles creation of clone
    // does not sync with resumeDiv
    _selectBizCardDiv(bizCardDiv, caller='') {
        if (!bizCardDiv) return;

        // Create a deep clone of the card
        const clone = bizCardDiv.cloneNode(true);
        clone.id = bizCardDiv.id + '-clone';
        bizCardDiv.classList.add('hasClone'); // marker for scenePlane.clearAllSelected to know to destroy the clone
        if ( !clone.classList.contains('biz-card-div') ) throw new Error('Clone is not a biz-card-div');
        clone.classList.remove('hovered')
        clone.classList.add('selected' );
        clone.setAttribute("data-sceneZ", "0"); // marker for parallax to use SELECTED_CARD_Z_INDEX

        // The parallax engine will style this, we just need to add it to the DOM
        bizCardDiv.parentElement.appendChild(clone);
        // hide the original
        bizCardDiv.style.display = 'none';
    }

    // This is now the primary method for removing a clone and showing the original card.
    // It's called by the selectionCleared event handler.
    _deselectBizCardDiv(bizCardDiv) {
        if ( !bizCardDiv ||!bizCardDiv.classList.contains('hasClone') ) return;
        const cloneId = bizCardDiv.id + '-clone';
        const clone = document.getElementById(cloneId);
        if (clone) {
            clone.parentElement.removeChild(clone);
        }

        bizCardDiv.classList.remove('hasClone');
        bizCardDiv.style.display = 'block';
    }

    handleBizCardDivClickEvent(bizCardDiv) {
        if (!bizCardDiv) return;
        const jobIndex = parseInt(bizCardDiv.getAttribute('data-job-index'), 10);
        const isAlreadySelected = selectionManager.getSelectedJobIndex() === jobIndex;

        if (isAlreadySelected) {
            selectionManager.clearSelection('bizCardDivManager.handleBizCardDivClickEvent');
        } else {
            selectionManager.selectJobIndex(jobIndex, 'bizCardDivManager.handleBizCardDivClickEvent');
        }
    }

    handleMouseEnterEvent(element) {
        if (!element) return;
        const jobIndex = parseInt(element.getAttribute('data-job-index'), 10);
        if (selectionManager.getSelectedJobIndex() === jobIndex) return; // Ignore hover on selected item
        selectionManager.hoverJobIndex(jobIndex, 'bizCardDivManager.handleMouseEnterEvent');
    }

    handleMouseLeaveEvent(element) {
        if (!element) return;
        const jobIndex = parseInt(element.getAttribute('data-job-index'), 10);
        selectionManager.clearHover('bizCardDivManager.handleMouseLeaveEvent');
    }

    handleSelectionChanged(event) {
        const { selectedJobIndex, caller } = event.detail;
        
        // First, ensure any existing selections are cleared, but prevent re-entry
        if (caller !== 'handleSelectionChanged') {
            this.handleSelectionCleared({ detail: { caller: 'handleSelectionChanged' } });
        }

        const bizCardDiv = this.getBizCardDivByJobIndex(selectedJobIndex);
        if (bizCardDiv) {
            this._selectBizCardDiv(bizCardDiv, `bizCardDivManager.handleSelectionChanged from ${caller}`);
            this.scrollBizCardDivIntoView(bizCardDiv, `bizCardDivManager.handleSelectionChanged from ${caller}`);
        }
    }

    handleSelectionCleared(event) {
        const { caller } = event.detail;
        const cardsWithClones = document.querySelectorAll('.biz-card-div.hasClone');
        cardsWithClones.forEach(card => this._deselectBizCardDiv(card));
    }

    handleHoverChanged(event) {
        const { hoveredJobIndex, caller } = event.detail;
        if (selectionManager.getSelectedJobIndex() === hoveredJobIndex) return;

        // Clear any existing hover first
        this.handleHoverCleared({ detail: { caller: 'handleHoverChanged' } });

        const bizCardDiv = this.getBizCardDivByJobIndex(hoveredJobIndex);
        if (bizCardDiv) {
            bizCardDiv.classList.add('hovered');
        }
    }

    handleHoverCleared(event) {
        const { caller } = event.detail;
        this.bizCardDivs.forEach(div => div.classList.remove('hovered'));
    }

    isJobIndexSelected(jobIndex) {
        return selectionManager.getSelectedJobIndex() === jobIndex;
    }
    
    scrollBizCardDivIntoView(bizCardDiv, caller='') {
        if (!bizCardDiv) return;
        console.log(`bizCardDivManager.scrollBizCardDivIntoView: ${caller} scrolling ${bizCardDiv.id} into view`);
        const sceneContainer = document.getElementById('scene-container');
        if (!sceneContainer) throw new Error(`bizCardDivManager.scrollBizCardDivIntoView: ${caller} sceneContainer not found`);
    
        const cardTop = parseInt(bizCardDiv.style.getPropertyValue('top'), 10);
        console.log(`bizCardDivManager.scrollBizCardDivIntoView: ${caller} cardTop: ${cardTop}`);
        sceneContainer.scrollTo({
            top: cardTop,
            behavior: 'smooth'
        });
    }

    setupPointerEventsObserver() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === 'style') {
                    const el = mutation.target;
                    const pointerEvents = window.getComputedStyle(el).pointerEvents;
                    if (pointerEvents === 'none') {
                        el.classList.add('pointer-events-none');
                    } else {
                        el.classList.remove('pointer-events-none');
                    }
                }
            });
        });

        this.bizCardDivs.forEach(bizCardDiv => {
            observer.observe(bizCardDiv, { attributes: true, attributeFilter: ['style'] });
        });
    }
}

export const bizCardDivManager = new BizCardDivManager();
