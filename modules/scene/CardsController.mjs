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
import { applyPaletteToElement, applyStateStyling } from '../composables/useColorPalette.mjs';
import { AppState } from '../core/stateManager.mjs';
import { initializationManager } from '../core/initializationManager.mjs';
// import { resumeListController } from '../resume/ResumeListController.mjs'; // No longer needed

const BIZCARD_MAX_X_OFFSET = 100;
const BIZCARD_MEAN_WIDTH = 180; // Reduced from 200 for more square aspect
const BIZCARD_MAX_WIDTH_OFFSET = 30; // Reduced from 40
const BIZCARD_MIN_Z_DIFF = 2;
const MIN_HEIGHT = 180; // Reduced from 200 for more square aspect

// Get the timeline functions once
const { getPositionForDate } = useTimeline();

/**
 * CardsController - Manages the business card divs in the scene
 * 
 * KEY CONCEPT: This controller now applies the same sorting as ResumeListController
 * to ensure cDivs and rDivs show the same jobs in the same order.
 * 
 * The sorting is applied by:
 * 1. Listening to sort rule changes from ResumeListController
 * 2. Applying the same sort logic to the bizCardDivs array
 * 3. Updating the visual order of cards in the scene
 */
class CardsController {
    constructor() {
        // Singleton pattern: return existing instance if one exists
        if (CardsController.instance) {
    
            return CardsController.instance;
        }

        // Create new instance

        
        this.bizCardDivs = [];
        this.isInitialized = false;
        this.originalJobsData = null;
        this.currentSortRule = null;
        this.sortedIndices = []; // Maps sorted position to original index
        this._setupSelectionListeners();
        // The pointer events observer is set up in initialize now
        
        // Listen for sort rule changes from ResumeListController
        this._setupSortListener();
        
        // Store the singleton instance
        CardsController.instance = this;
        

    }

    async initialize(jobsData) {
        if (this.isInitialized) {
    
            return;
        }
        
        this.originalJobsData = jobsData;
        this.bizCardDivs = await this._createAllBizCardDivs(jobsData);
        
        // Apply the same sort rule as ResumeListController
        const initialSortRule = AppState.resume.sortRule || { field: 'startDate', direction: 'desc' };

        this.applySortRule(initialSortRule, true);
        
        this.isInitialized = true;

    }

    /**
     * Register this controller with the initialization manager
     * This allows other components to wait for CardsController to be ready
     */
    registerForInitialization() {
        initializationManager.register(
            'CardsController',
            async () => {
                // Wait for timeline to be ready
                await initializationManager.waitForComponent('Timeline');
                await this.initialize(jobs);
            },
            ['Timeline'], // Depends on timeline being initialized first
            { priority: 'high' }
        );
    }

    async _createAllBizCardDivs(jobsData) {
        const divs = [];
        const scenePlaneEl = document.getElementById('scene-plane');
        if (!scenePlaneEl) {

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
    
            }
        });
        
        return divs;
    }

    async createBizCardDiv(job, index, totalJobs) {
        try {
            const bizCardDiv = document.createElement('div');
            bizCardDiv.className = 'biz-card-div';
            bizCardDiv.id = this.createBizCardDivId(index);
            bizCardDiv.setAttribute('data-job-number', index.toString());
            
            this._setBizCardDivSceneGeometry(bizCardDiv, job);
            
            // --- Apply initial layout styles from the geometry attributes ---
            const sceneTop = parseFloat(bizCardDiv.getAttribute('data-sceneTop'));
            const sceneLeft = parseFloat(bizCardDiv.getAttribute('data-sceneLeft'));
            const sceneWidth = parseFloat(bizCardDiv.getAttribute('data-sceneWidth'));
            const sceneHeight = parseFloat(bizCardDiv.getAttribute('data-sceneHeight'));

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

            // Apply normal state styling after palette application
            applyStateStyling(bizCardDiv, 'normal');

            this._setupMouseListeners(bizCardDiv);

            return bizCardDiv;
        } catch (err) {

            return null;
        }
    }
    
    createBizCardDivId(jobNumber) {
        return `biz-card-div-${jobNumber}`;
    }

    getBizCardDivByJobNumber(jobNumber) {
        for (const bizCardDiv of this.bizCardDivs) {
            if (bizCardDiv.getAttribute('data-job-number') === jobNumber.toString()) {
                return bizCardDiv;
            }
        }
        return null;
    }

    _setBizCardDivSceneGeometry(bizCardDiv, job) {
        if (!job.start) {

            return;
        }

        const startDate = dateUtils.parseFlexibleDateString(job.start);
        const endDate = (job.end && job.end === "CURRENT_DATE")
            ? new Date()
            : dateUtils.parseFlexibleDateString(job.end || job.start);

        if (!startDate || !endDate) {

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

        // Check if this card already has a clone
        const existingCloneId = bizCardDiv.id + '-clone';
        const existingClone = document.getElementById(existingCloneId);
        if (existingClone) {
            window.CONSOLE_LOG_IGNORE(`CardsController._selectBizCardDiv: Clone already exists for ${bizCardDiv.id}, skipping creation`);
            return;
        }

        // --- Pre-calculate the centered geometry from the original card ---
        const originalSceneLeft = parseFloat(bizCardDiv.getAttribute("data-sceneLeft"));
        const sceneWidth = parseFloat(bizCardDiv.getAttribute("data-sceneWidth"));
        const sceneCenterX = 0;
        const newSceneLeft = sceneCenterX - (sceneWidth / 2);
        const sceneRight = sceneCenterX + (sceneWidth / 2);



        // Create a deep clone of the card
        const clone = bizCardDiv.cloneNode(true);
        clone.id = bizCardDiv.id + '-clone';
        bizCardDiv.classList.add('hasClone'); // marker for scenePlane.clearAllSelected to know to destroy the clone
        if ( !clone.classList.contains('biz-card-div') ) throw new Error('Clone is not a biz-card-div');
        clone.classList.remove('hovered')
        clone.classList.add('selected' );
        clone.setAttribute("data-sceneZ", zUtils.SELECTED_CARD_Z_VALUE); // marker for parallax to use SELECTED_CARD_Z_INDEX
        clone.style.zIndex = zUtils.SELECTED_CARD_Z_INDEX;

        // Debug: Check if data-color-index is properly copied
        const originalColorIndex = bizCardDiv.getAttribute('data-color-index');
        const cloneColorIndex = clone.getAttribute('data-color-index');
        window.CONSOLE_LOG_IGNORE(`[DEBUG] CardsController._selectBizCardDiv: Original ${bizCardDiv.id} data-color-index: ${originalColorIndex}`);
        window.CONSOLE_LOG_IGNORE(`[DEBUG] CardsController._selectBizCardDiv: Clone ${clone.id} data-color-index: ${cloneColorIndex}`);
        
        // Ensure the clone has the data-color-index attribute
        if (originalColorIndex && !cloneColorIndex) {
            window.CONSOLE_LOG_IGNORE(`[DEBUG] CardsController._selectBizCardDiv: Fixing missing data-color-index on clone`);
            clone.setAttribute('data-color-index', originalColorIndex);
        }



        // --- Apply the pre-calculated centered geometry to the clone ---
        clone.setAttribute("data-sceneCenterX", sceneCenterX.toString());
        clone.setAttribute("data-sceneLeft", newSceneLeft.toString());
        clone.setAttribute("data-sceneRight", sceneRight.toString());
        
        // Copy the vertical position from the original card
        const originalSceneTop = bizCardDiv.getAttribute("data-sceneTop");
        if (originalSceneTop) {
            clone.setAttribute("data-sceneTop", originalSceneTop);
            clone.style.top = `${originalSceneTop}px`; // Set the CSS top style for proper positioning
        } else {
            window.CONSOLE_LOG_IGNORE(`CardsController._selectBizCardDiv: original card ${bizCardDiv.id} has no data-sceneTop attribute`);
        }
        
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
        if (!scenePlaneEl) {
            window.CONSOLE_LOG_IGNORE(`CardsController._selectBizCardDiv: scene-plane element not found!`);
            return;
        }
        

        
        scenePlaneEl.appendChild(clone);

        // Apply palette colors to the clone after it's in the DOM
        applyPaletteToElement(clone);

        // Apply selected state styling to the clone
        applyStateStyling(clone, 'selected');

        // Hide the original card now that the clone is in the DOM
        bizCardDiv.style.display = 'none';

        // --- Explicitly update the clone's parallax to its centered state ---
        applyParallaxToBizCardDiv(clone, 0, 0);

        // --- Final check after adding to DOM ---
        const originalLeft = window.getComputedStyle(bizCardDiv).left;
        const cloneLeft = window.getComputedStyle(clone).left;
        const originalCenterX = parseFloat(bizCardDiv.getAttribute("data-sceneCenterX"));

        if (originalCenterX !== 0 && originalLeft === cloneLeft) {
            throw new Error(`Error: cDiv for job number ${bizCardDiv.dataset.jobNumber} has centerX of ${originalCenterX} but its left (${originalLeft}) is the same as its clone's left (${cloneLeft}).`);
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
        const jobNumber = parseInt(bizCardDiv.getAttribute('data-job-number'), 10);
        const isAlreadySelected = selectionManager.getSelectedJobNumber() === jobNumber;

        if (isAlreadySelected) {
            selectionManager.clearSelection('CardsController.handleBizCardDivClickEvent');
        } else {
            selectionManager.selectJobNumber(jobNumber, 'CardsController.handleBizCardDivClickEvent');
        }
    }

    handleMouseEnterEvent(element) {
        if (!element) return;
        const jobNumber = parseInt(element.getAttribute('data-job-number'), 10);
        if (selectionManager.getSelectedJobNumber() === jobNumber) return; // Ignore hover on selected item
        selectionManager.hoverJobNumber(jobNumber, 'CardsController.handleMouseEnterEvent');
    }

    handleMouseLeaveEvent(element) {
        if (!element) return;
        selectionManager.clearHover('CardsController.handleMouseLeaveEvent');
    }

    handleSelectionChanged(event) {
        const { selectedJobNumber, caller } = event.detail;

        // Clear previous selections first
        this.handleSelectionCleared({ detail: { caller: 'handleSelectionChanged' } });

        const bizCardDiv = this.getBizCardDivByJobNumber(selectedJobNumber);
        
        if (bizCardDiv) {
            // Check if we already have a clone for this card
            const existingCloneId = bizCardDiv.id + '-clone';
            const existingClone = document.getElementById(existingCloneId);
            if (existingClone) {
                // Still scroll to the existing clone
                this.scrollBizCardDivIntoView(existingClone, `CardsController.handleSelectionChanged from ${caller}`);
                return;
            }
            
            this._selectBizCardDiv(bizCardDiv, `CardsController.handleSelectionChanged from ${caller}`);
            // Scroll to the clone instead of the hidden original card
            const clone = document.getElementById(bizCardDiv.id + '-clone');
            if (clone) {
                this.scrollBizCardDivIntoView(clone, `CardsController.handleSelectionChanged from ${caller}`);
            }
        }
    }

    handleSelectionCleared(event) {
        const { caller } = event.detail;
        // Find all original cards that have a clone and deselect them
        const cardsWithClones = document.querySelectorAll('.biz-card-div.hasClone');
        cardsWithClones.forEach(card => this._deselectBizCardDiv(card));
    }

    handleHoverChanged(event) {
        const { hoveredJobNumber, caller } = event.detail;

        if (selectionManager.getSelectedJobNumber() === hoveredJobNumber) return;

        // Clear previous hovers first
        this.handleHoverCleared({ detail: { caller: 'handleHoverChanged' } });

        const bizCardDiv = this.getBizCardDivByJobNumber(hoveredJobNumber);
        if (bizCardDiv) {
            bizCardDiv.classList.add('hovered');
            applyStateStyling(bizCardDiv, 'hovered');
        }
    }

    handleHoverCleared(event) {
        const { caller } = event.detail;
        this.bizCardDivs.forEach(div => {
            const wasHovered = div.classList.contains('hovered');
            const isSelected = div.classList.contains('selected');
            
            // Only process cards that were actually hovered
            if (wasHovered) {
                div.classList.remove('hovered');
                
                // Reset to normal state (only if not selected)
                if (!isSelected) {
                    applyStateStyling(div, 'normal');
                }
            }
        });
    }

    isJobNumberSelected(jobNumber) {
        return selectionManager.getSelectedJobNumber() === jobNumber;
    }
    
    scrollBizCardDivIntoView(bizCardDiv, caller='') {
        const sceneContent = document.getElementById('scene-content');
        if (!sceneContent) throw new Error(`CardsController.scrollBizCardDivIntoView: ${caller} scene-content not found`);
    
        const cardTop = parseFloat(bizCardDiv.getAttribute('data-sceneTop'));
        
        if (isNaN(cardTop)) {
            window.CONSOLE_LOG_IGNORE(`CardsController.scrollBizCardDivIntoView: ${caller} cardTop is NaN for ${bizCardDiv.id}`);
            return;
        }
        
        // Use a manual scroll calculation with an offset
        const scrollOffset = 100; // Increased offset to ensure card is visible
        const scrollTarget = cardTop - scrollOffset;
        
        window.CONSOLE_LOG_IGNORE(`[DEBUG] CardsController.scrollBizCardDivIntoView: ${caller} - Current scroll position: ${sceneContent.scrollTop}, Target: ${scrollTarget}, Card top: ${cardTop}`);
        
        // Check if we're already at the correct position (within 10px tolerance)
        const currentScrollTop = sceneContent.scrollTop;
        const scrollDifference = Math.abs(currentScrollTop - scrollTarget);
        if (scrollDifference < 10) {
            window.CONSOLE_LOG_IGNORE(`[DEBUG] CardsController.scrollBizCardDivIntoView: ${caller} - Already at correct position (difference: ${scrollDifference}px), skipping scroll`);
            return;
        }
        
        // Use instant scrolling during initialization to avoid the delay
        const isInitializing = caller.includes('initialize') || caller.includes('ResumeListController');
        const scrollBehavior = isInitializing ? 'auto' : 'smooth';
        
        window.CONSOLE_LOG_IGNORE(`[DEBUG] CardsController.scrollBizCardDivIntoView: ${caller} - Using scroll behavior: ${scrollBehavior}`);
        
        sceneContent.scrollTo({
            top: scrollTarget,
            behavior: scrollBehavior
        });
        
        window.CONSOLE_LOG_IGNORE(`[DEBUG] CardsController.scrollBizCardDivIntoView: ${caller} - Scroll command sent`);
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

    _updateHoveredCard(jobNumber, shouldHover) {
        const cardDiv = this.getBizCardDivByJobNumber(jobNumber);
        if (cardDiv) {
            cardDiv.classList.toggle('hovered', shouldHover);
        }
    }

    _highlightCard(bizCardDiv, shouldHighlight) {
        if (shouldHighlight) {
            // ... existing code ...
        }
    }

    // Static method to reset the singleton instance
    static reset() {
        window.CONSOLE_LOG_IGNORE('[DEBUG] CardsController: Resetting singleton instance');
        if (CardsController.instance) {
            // Clean up any resources if needed
            CardsController.instance.bizCardDivs = [];
            CardsController.instance.isInitialized = false;
        }
        CardsController.instance = null;
    }

    // Static method to get the current instance
    static getInstance() {
        return CardsController.instance;
    }

    /**
     * Apply the same sort rule as ResumeListController to ensure consistency
     * Note: This does NOT change the visual positioning of cards - they maintain their timeline positions
     * This only updates the internal sorting state for coordination with ResumeListController
     */
    applySortRule(sortRule, isInitializing = false) {
        window.CONSOLE_LOG_IGNORE(`[DEBUG] CardsController.applySortRule: Called with sortRule=`, sortRule, `isInitializing=`, isInitializing);
        
        if (!this.originalJobsData) {
            window.CONSOLE_LOG_IGNORE('[DEBUG] CardsController.applySortRule: originalJobsData is null, cannot sort');
            return;
        }
        
        this.currentSortRule = { ...sortRule };

        window.CONSOLE_LOG_IGNORE(`[DEBUG] CardsController.applySortRule: Applying sort rule:`, this.currentSortRule);

        this.updateSortedIndices();
        
        // Don't automatically scroll to first card - let ResumeListController control selection
        window.CONSOLE_LOG_IGNORE(`[DEBUG] CardsController.applySortRule: Sort state updated (no visual changes)`);
        window.CONSOLE_LOG_IGNORE(`[DEBUG] CardsController.applySortRule: Sort completed`);
    }

    /**
     * Update the sorted indices based on the current sort rule
     */
    updateSortedIndices() {
        // Create array of indices with their corresponding job data
        const indexedJobs = this.originalJobsData.map((job, index) => ({
            index,
            job
        }));

        window.CONSOLE_LOG_IGNORE(`[DEBUG] CardsController.updateSortedIndices: Sorting by ${this.currentSortRule.field} ${this.currentSortRule.direction}`);

        // Sort based on the current rule
        indexedJobs.sort((a, b) => {
            let comparison = 0;
            
            switch (this.currentSortRule.field) {
                case 'employer':
                    comparison = this.compareStrings(a.job.employer, b.job.employer);
                    break;
                case 'startDate':
                    comparison = this.compareDates(a.job.start, b.job.start);
                    break;
                case 'role':
                    comparison = this.compareStrings(a.job.role, b.job.role);
                    break;
                case 'original':
                default:
                    comparison = a.index - b.index;
                    break;
            }
            
            // Apply direction
            return this.currentSortRule.direction === 'desc' ? -comparison : comparison;
        });

        // Extract the sorted indices
        this.sortedIndices = indexedJobs.map(item => item.index);
        window.CONSOLE_LOG_IGNORE(`[DEBUG] CardsController.updateSortedIndices: Final sortedIndices=`, this.sortedIndices);
    }

    /**
     * Compare strings for sorting
     */
    compareStrings(a, b) {
        const stringA = (a || '').toString().toLowerCase();
        const stringB = (b || '').toString().toLowerCase();
        return stringA.localeCompare(stringB);
    }

    /**
     * Compare dates for sorting
     */
    compareDates(a, b) {
        // Handle various date formats
        const dateA = this.parseDate(a);
        const dateB = this.parseDate(b);
        
        if (dateA === null && dateB === null) return 0;
        if (dateA === null) return -1;
        if (dateB === null) return 1;
        
        return dateA.getTime() - dateB.getTime();
    }

    /**
     * Parse date from various formats
     */
    parseDate(dateValue) {
        if (!dateValue) return null;
        
        // Handle "Present" or "Current" for end dates
        if (typeof dateValue === 'string' && 
            (dateValue.toLowerCase().includes('present') || 
             dateValue.toLowerCase().includes('current'))) {
            return new Date(); // Current date for "Present"
        }
        
        // Try to parse as date
        const parsed = new Date(dateValue);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    /**
     * Scroll to the first card in the sorted order
     * This uses the sorted indices to find the first job, then scrolls to that card's timeline position
     */
    scrollToFirstCard() {
        if (this.sortedIndices.length > 0) {
            const firstJobNumber = this.sortedIndices[0];
            const firstCard = this.getBizCardDivByJobNumber(firstJobNumber);
            if (firstCard) {
                window.CONSOLE_LOG_IGNORE(`[DEBUG] CardsController.scrollToFirstCard: Scrolling to first card (job ${firstJobNumber}) at timeline position`);
                this.scrollBizCardDivIntoView(firstCard, 'CardsController.scrollToFirstCard');
            } else {
                window.CONSOLE_LOG_IGNORE(`[DEBUG] CardsController.scrollToFirstCard: Could not find card for job ${firstJobNumber}`);
            }
        } else {
            window.CONSOLE_LOG_IGNORE('[DEBUG] CardsController.scrollToFirstCard: No sorted indices available');
        }
    }

    /**
     * Get the job number at a specific sorted index
     * This helps coordinate with ResumeListController
     */
    getJobNumberAtSortedIndex(sortedIndex) {
        if (this.sortedIndices && this.sortedIndices[sortedIndex] !== undefined) {
            return this.sortedIndices[sortedIndex];
        }
        return -1;
    }

    /**
     * Get the sorted index for a specific job number
     * This helps coordinate with ResumeListController
     */
    getSortedIndexForJobNumber(jobNumber) {
        if (this.sortedIndices) {
            return this.sortedIndices.indexOf(jobNumber);
        }
        return -1;
    }

    /**
     * Get the current sort rule for coordination with ResumeListController
     */
    getCurrentSortRule() {
        return { ...this.currentSortRule };
    }

    /**
     * Get the sorted indices array for coordination with ResumeListController
     */
    getSortedIndices() {
        return [...this.sortedIndices];
    }

    /**
     * Scroll to a specific job number (called by ResumeListController for coordination)
     */
    scrollToJobNumber(jobNumber) {
        window.CONSOLE_LOG_IGNORE(`[DEBUG] CardsController.scrollToJobNumber: Scrolling to job ${jobNumber}`);
        const card = this.getBizCardDivByJobNumber(jobNumber);
        if (card) {
            window.CONSOLE_LOG_IGNORE(`[DEBUG] CardsController.scrollToJobNumber: Found card for job ${jobNumber}, scrolling to timeline position`);
            this.scrollBizCardDivIntoView(card, 'CardsController.scrollToJobNumber');
        } else {
            window.CONSOLE_LOG_IGNORE(`[DEBUG] CardsController.scrollToJobNumber: Could not find card for job ${jobNumber}`);
        }
    }

    // Listen for sort rule changes from ResumeListController
    _setupSortListener() {
        window.CONSOLE_LOG_IGNORE('[DEBUG] CardsController._setupSortListener: Setting up sort listener');
        
        // Listen for custom events when sort rules change
        window.addEventListener('sort-rule-changed', (event) => {
            const { sortRule } = event.detail;
            window.CONSOLE_LOG_IGNORE(`[DEBUG] CardsController: Received sort rule change event:`, sortRule);
            this.applySortRule(sortRule);
        });

        // Check for ResumeListController sort rule after initialization
        // We'll retry a few times since ResumeListController might not be ready yet
        let retryCount = 0;
        const maxRetries = 10;
        
        const checkForResumeListController = () => {
            window.CONSOLE_LOG_IGNORE(`[DEBUG] CardsController._setupSortListener: Checking for ResumeListController (attempt ${retryCount + 1})`);
            
            if (window.resumeListController && window.resumeListController.getCurrentSortRule) {
                const resumeSortRule = window.resumeListController.getCurrentSortRule();
                window.CONSOLE_LOG_IGNORE('[DEBUG] CardsController._setupSortListener: Found ResumeListController sort rule:', resumeSortRule);
                if (resumeSortRule && resumeSortRule.field) {
                    window.CONSOLE_LOG_IGNORE(`[DEBUG] CardsController: Applying initial sort rule from ResumeListController:`, resumeSortRule);
                    this.applySortRule(resumeSortRule);
                }
            } else {
                retryCount++;
                if (retryCount < maxRetries) {
                    window.CONSOLE_LOG_IGNORE(`[DEBUG] CardsController._setupSortListener: ResumeListController not ready, retrying in 500ms (${retryCount}/${maxRetries})`);
                    setTimeout(checkForResumeListController, 500);
                } else {
                    window.CONSOLE_LOG_IGNORE('[DEBUG] CardsController._setupSortListener: ResumeListController not found after max retries, using default sort');
                    // Apply default sort rule if ResumeListController never becomes available
                    this.applySortRule({ field: 'startDate', direction: 'desc' }, true);
                }
            }
        };
        
        // Start checking after a short delay
        setTimeout(checkForResumeListController, 100);
    }
}

export const cardsController = new CardsController();

// Global function for testing sorting
window.testCardsSorting = function() {
    window.CONSOLE_LOG_IGNORE('[DEBUG] testCardsSorting: Manual test function called');
    if (window.cardsController) {
        window.CONSOLE_LOG_IGNORE('[DEBUG] testCardsSorting: Triggering sort by employer ascending');
        window.cardsController.applySortRule({ field: 'employer', direction: 'asc' });
    } else {
        window.CONSOLE_LOG_IGNORE('[DEBUG] testCardsSorting: CardsController not found');
    }
};

// Global function for debugging card state
window.debugCardsState = function() {
    window.CONSOLE_LOG_IGNORE('[DEBUG] debugCardsState: Current cards state');
    if (window.cardsController) {
        window.CONSOLE_LOG_IGNORE('[DEBUG] debugCardsState: CardsController found');
        window.CONSOLE_LOG_IGNORE('[DEBUG] debugCardsState: bizCardDivs length:', window.cardsController.bizCardDivs.length);
        window.CONSOLE_LOG_IGNORE('[DEBUG] debugCardsState: sortedIndices:', window.cardsController.sortedIndices);
        window.CONSOLE_LOG_IGNORE('[DEBUG] debugCardsState: currentSortRule:', window.cardsController.currentSortRule);
        
        // Show all cards in DOM order (timeline positioning)
        const scenePlaneEl = document.getElementById('scene-plane');
        if (scenePlaneEl) {
            const cards = scenePlaneEl.querySelectorAll('.biz-card-div:not(.hasClone)');
            window.CONSOLE_LOG_IGNORE('[DEBUG] debugCardsState: Cards in DOM (timeline order):');
            cards.forEach((card, index) => {
                const jobNumber = card.getAttribute('data-job-number');
                const sceneTop = card.getAttribute('data-sceneTop');
                const roleElement = card.querySelector('.biz-details-role');
                const employerElement = card.querySelector('.biz-details-employer');
                const role = roleElement ? roleElement.textContent.trim() : 'N/A';
                const employer = employerElement ? employerElement.textContent.trim() : 'N/A';
                window.CONSOLE_LOG_IGNORE(`  DOM Index ${index}: Job ${jobNumber} (top: ${sceneTop}px) -> "${role}" at "${employer}"`);
            });
        }
        
        // Show sorted order (for coordination with ResumeListController)
        window.CONSOLE_LOG_IGNORE('[DEBUG] debugCardsState: Sorted order (for coordination):');
        if (window.cardsController.sortedIndices) {
            window.cardsController.sortedIndices.forEach((jobNumber, sortedIndex) => {
                const card = window.cardsController.getBizCardDivByJobNumber(jobNumber);
                if (card) {
                    const roleElement = card.querySelector('.biz-details-role');
                    const employerElement = card.querySelector('.biz-details-employer');
                    const role = roleElement ? roleElement.textContent.trim() : 'N/A';
                    const employer = employerElement ? employerElement.textContent.trim() : 'N/A';
                    window.CONSOLE_LOG_IGNORE(`  Sorted Index ${sortedIndex}: Job ${jobNumber} -> "${role}" at "${employer}"`);
                }
            });
        }
        
        window.CONSOLE_LOG_IGNORE('[DEBUG] debugCardsState: Note: Cards maintain timeline positioning, sorting only affects coordination with resume items');
    } else {
        window.CONSOLE_LOG_IGNORE('[DEBUG] debugCardsState: CardsController not found');
    }
};