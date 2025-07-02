// scene/CardsController.mjs

import { selectionManager } from '../core/selectionManager.mjs';
import * as scenePlane from './scenePlaneModule.mjs';
import * as utils from '../utils/utils.mjs';
import * as viewPort from '../core/viewPortModule.mjs';
import * as BizDetailsDivModule from './bizDetailsDivModule.mjs';
import { useTimeline } from '../composables/useTimeline.mjs';
import * as dateUtils from '../utils/dateUtils.mjs';
import * as mathUtils from '../utils/mathUtils.mjs';
import * as zUtils from '../utils/zUtils.mjs';
import * as filters from '../core/filters.mjs';
import { applyParallaxToBizCardDiv } from '../core/parallaxModule.mjs';
import { jobs } from '../../static_content/jobs/jobs.mjs';
import { applyPaletteToElement } from '../composables/useColorPalette.mjs';
// import { resumeListController } from '../resume/ResumeListController.mjs'; // No longer needed

const BIZCARD_MAX_X_OFFSET = 100;
const BIZCARD_MEAN_WIDTH = 200;
const BIZCARD_MAX_WIDTH_OFFSET = 40;
const BIZCARD_MIN_Z_DIFF = 2;
const MIN_HEIGHT = 200;

// Get the timeline functions once
const { getPositionForDate } = useTimeline();

class CardsController {
    constructor() {
        this.bizCardDivs = [];
        this.isInitialized = false;
        this._setupSelectionListeners();
        // The pointer events observer is set up in initialize now
    }

    async initialize(jobsData) {
        if (this.isInitialized) {
            console.warn("CardsController already initialized.");
            return;
        }
        this.bizCardDivs = await this._createAllBizCardDivs(jobsData);
        this.isInitialized = true;
        window.CONSOLE_LOG_IGNORE("CardsController initialized.");
    }

    async _createAllBizCardDivs(jobsData) {
        const divs = [];
        const scenePlaneEl = document.getElementById('scene-plane');
        if (!scenePlaneEl) {
            console.error("Scene plane element not found!");
            return divs;
        }

        // Clear existing business card divs to prevent duplication
        const existingCards = scenePlaneEl.querySelectorAll('.biz-card-div');
        existingCards.forEach(card => {
            if (!card.classList.contains('hasClone')) { // Don't remove clones
                card.remove();
            }
        });

        for (let index = 0; index < jobsData.length; index++) {
            const job = jobsData[index];
            const bizCardDiv = await this.createBizCardDiv(job, index, jobsData.length);
            divs.push(bizCardDiv);
        }
        
        divs.forEach(card => {
            if (card instanceof Node) {
                scenePlaneEl.appendChild(card);
            } else {
                console.warn('Skipped appending non-Node:', card);
            }
        });
        
        return divs;
    }

    async createBizCardDiv(job, index, totalJobs) {
        try {
            const bizCardDiv = document.createElement('div');
            bizCardDiv.className = 'biz-card-div';
            bizCardDiv.id = this.createBizCardDivId(index);
            bizCardDiv.setAttribute('data-job-index', index.toString());
            
            this._setBizCardDivSceneGeometry(bizCardDiv, job);
            
            // --- Apply initial layout styles from the geometry attributes ---
            const sceneTop = parseFloat(bizCardDiv.getAttribute('data-sceneTop'));
            const sceneLeft = parseFloat(bizCardDiv.getAttribute('data-sceneLeft'));
            const sceneWidth = parseFloat(bizCardDiv.getAttribute('data-sceneWidth'));
            const sceneHeight = parseFloat(bizCardDiv.getAttribute('data-sceneHeight'));
            const { x: viewPortX } = viewPort.getViewPortOrigin();

            bizCardDiv.style.position = 'absolute';
            bizCardDiv.style.top = `${sceneTop}px`;
            bizCardDiv.style.left = `${sceneLeft}px`;
            bizCardDiv.style.width = `${sceneWidth}px`;
            bizCardDiv.style.height = `${sceneHeight}px`;

            // Assign a color index for styling. Using a prime number
            // helps distribute colors more interestingly.
            const colorIndex = index % 7;
            bizCardDiv.setAttribute('data-color-index', colorIndex);

            const bizCardDetailsDiv = BizDetailsDivModule.createBizCardDetailsDiv(bizCardDiv, job, colorIndex);
            bizCardDiv.appendChild(bizCardDetailsDiv);

            // Apply the current color palette
            await applyPaletteToElement(bizCardDiv);

            this._setupMouseListeners(bizCardDiv);

            return bizCardDiv;
        } catch (err) {
            console.error('createBizCardDiv error:', err);
            return null;
        }
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

        // Get the top and bottom positions from our new composable
        let sceneTop = getPositionForDate(endDate);
        let sceneBottom = getPositionForDate(startDate);

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

        // window.CONSOLE_LOG_IGNORE(`Card ID: ${bizCardDiv.id}, Filter: ${bizCardDiv.style.filter}`);
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
    _selectBizCardDiv(bizCardDiv, caller='') {
        if (!bizCardDiv) return;

        // --- Pre-calculate the centered geometry from the original card ---
        const originalSceneLeft = parseFloat(bizCardDiv.getAttribute("data-sceneLeft"));
        const sceneWidth = parseFloat(bizCardDiv.getAttribute("data-sceneWidth"));
        const sceneCenterX = 0;
        const newSceneLeft = sceneCenterX - (sceneWidth / 2);
        const sceneRight = sceneCenterX + (sceneWidth / 2);

        window.CONSOLE_LOG_IGNORE(`Centering card ${bizCardDiv.id}: original left=${originalSceneLeft.toFixed(2)}, new left=${newSceneLeft.toFixed(2)}, deltaX=${(newSceneLeft - originalSceneLeft).toFixed(2)}`);

        // Create a deep clone of the card
        const clone = bizCardDiv.cloneNode(true);
        clone.id = bizCardDiv.id + '-clone';
        bizCardDiv.classList.add('hasClone'); // marker for scenePlane.clearAllSelected to know to destroy the clone
        if ( !clone.classList.contains('biz-card-div') ) throw new Error('Clone is not a biz-card-div');
        clone.classList.remove('hovered')
        clone.classList.add('selected' );
        clone.setAttribute("data-sceneZ", zUtils.SELECTED_CARD_Z_VALUE); // marker for parallax to use SELECTED_CARD_Z_INDEX
        clone.style.zIndex = zUtils.SELECTED_CARD_Z_INDEX;

        window.CONSOLE_LOG_IGNORE(`cDiv-clone ${clone.id}: z-index=${clone.style.zIndex}, data-sceneZ=${clone.getAttribute('data-sceneZ')}`);

        // --- Apply the pre-calculated centered geometry to the clone ---
        clone.setAttribute("data-sceneCenterX", sceneCenterX.toString());
        clone.setAttribute("data-sceneLeft", newSceneLeft.toString());
        clone.setAttribute("data-sceneRight", sceneRight.toString());
        
        clone.style.left = `${newSceneLeft}px`;

        // The clone needs its own click listener to handle deselection
        clone.addEventListener('click', (e) => {
            // e.stopPropagation(); // DO NOT stop propagation here
            this.handleBizCardDivClickEvent(clone);
        });

        // Add click listener for the custom scroll caret on the CLONE
        const caret = clone.querySelector('.scroll-caret');
        const detailsDiv = clone.querySelector('.biz-card-details-div');
        if (caret && detailsDiv) {
            caret.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card from being deselected
                detailsDiv.scrollTo({ top: detailsDiv.scrollHeight, behavior: 'smooth' });
            });
        }

        // Handle scroll caret visibility on the CLONE
        if (detailsDiv && caret) {
            // Use a timeout to allow browser to render and calculate scrollHeight
            setTimeout(() => {
                const hasOverflow = detailsDiv.scrollHeight > detailsDiv.clientHeight;
                if (hasOverflow) {
                    caret.classList.add('show');
                }

                // Add a scroll listener to hide the caret when at the bottom
                detailsDiv.addEventListener('scroll', () => {
                    const isAtBottom = detailsDiv.scrollHeight - detailsDiv.scrollTop <= detailsDiv.clientHeight + 1; // +1 for pixel rounding
                    if (isAtBottom) {
                        caret.classList.remove('show');
                    } else {
                        caret.classList.add('show');
                    }
                }, { passive: true });
            }, 100);
        }

        // --- Add clone to the scene ---
        const scenePlaneEl = document.getElementById('scene-plane');
        scenePlaneEl.appendChild(clone);

        // Hide the original card now that the clone is in the DOM
        bizCardDiv.style.display = 'none';

        // --- Explicitly update the clone's parallax to its centered state ---
        applyParallaxToBizCardDiv(clone, 0, 0);

        // --- Final check after adding to DOM ---
        const originalLeft = window.getComputedStyle(bizCardDiv).left;
        const cloneLeft = window.getComputedStyle(clone).left;
        const originalCenterX = parseFloat(bizCardDiv.getAttribute("data-sceneCenterX"));

        if (originalCenterX !== 0 && originalLeft === cloneLeft) {
            throw new Error(`Error: cDiv for job index ${bizCardDiv.dataset.jobIndex} has centerX of ${originalCenterX} but its left (${originalLeft}) is the same as its clone's left (${cloneLeft}).`);
        }
    }

    // This is now the primary method for removing a clone and showing the original card.
    // It's called by the selectionCleared event handler.
    _deselectBizCardDiv(bizCardDiv) {
        if (!bizCardDiv || !bizCardDiv.classList.contains('hasClone')) return;
        
        const cloneId = bizCardDiv.id + '-clone';
        const clone = document.getElementById(cloneId);
        if (clone) {
            clone.parentElement.removeChild(clone);
        }

        bizCardDiv.classList.remove('hasClone');
        bizCardDiv.style.display = 'block'; // Unhide the original card

        // We don't need to force a parallax update here, as the regular mouse-move based
        // parallax will take over naturally.
    }

    handleBizCardDivClickEvent(bizCardDiv) {
        if (!bizCardDiv) return;
        const jobIndex = parseInt(bizCardDiv.getAttribute('data-job-index'), 10);
        const isAlreadySelected = selectionManager.getSelectedJobIndex() === jobIndex;

        if (isAlreadySelected) {
            selectionManager.clearSelection('CardsController.handleBizCardDivClickEvent');
        } else {
            selectionManager.selectJobIndex(jobIndex, 'CardsController.handleBizCardDivClickEvent');
        }
    }

    handleMouseEnterEvent(element) {
        if (!element) return;
        const jobIndex = parseInt(element.getAttribute('data-job-index'), 10);
        if (selectionManager.getSelectedJobIndex() === jobIndex) return; // Ignore hover on selected item
        selectionManager.hoverJobIndex(jobIndex, 'CardsController.handleMouseEnterEvent');
    }

    handleMouseLeaveEvent(element) {
        if (!element) return;
        selectionManager.clearHover('CardsController.handleMouseLeaveEvent');
    }

    handleSelectionChanged(event) {
        const { selectedJobIndex, caller } = event.detail;

        // Clear previous selections first
        this.handleSelectionCleared({ detail: { caller: 'handleSelectionChanged' } });

        const bizCardDiv = this.getBizCardDivByJobIndex(selectedJobIndex);
        if (bizCardDiv) {
            this._selectBizCardDiv(bizCardDiv, `CardsController.handleSelectionChanged from ${caller}`);
            this.scrollBizCardDivIntoView(bizCardDiv, `CardsController.handleSelectionChanged from ${caller}`);
        }
    }

    handleSelectionCleared(event) {
        const { caller } = event.detail;
        // Find all original cards that have a clone and deselect them
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
        // window.CONSOLE_LOG_IGNORE(`CardsController.scrollBizCardDivIntoView: ${caller} scrolling ${bizCardDiv.id} into view`);
        const sceneContainer = document.getElementById('scene-container');
        if (!sceneContainer) throw new Error(`CardsController.scrollBizCardDivIntoView: ${caller} sceneContainer not found`);
    
        const cardTop = parseFloat(bizCardDiv.getAttribute('data-sceneTop'));
        // window.CONSOLE_LOG_IGNORE(`CardsController.scrollBizCardDivIntoView: ${caller} cardTop: ${cardTop}`);
        
        // Use a manual scroll calculation with an offset
        const scrollOffset = 20; // pixels
        sceneContainer.scrollTo({
            top: cardTop - scrollOffset,
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

    _updateHoveredCard(jobIndex, shouldHover) {
        const cardDiv = this.getBizCardDivByJobIndex(jobIndex);
        if (cardDiv) {
            cardDiv.classList.toggle('hovered', shouldHover);
        }
    }

    _highlightCard(bizCardDiv, shouldHighlight) {
        if (shouldHighlight) {
            // ... existing code ...
        }
    }
}

export const cardsController = new CardsController();