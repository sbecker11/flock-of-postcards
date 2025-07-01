import { selectionManager } from './selectionManager.mjs';

/**
 * Unified Navigation API
 * 
 * This API provides a single point of communication between:
 * - CardsController (cDiv manager)
 * - ResumeItemsController (rDiv manager) 
 * - ResumeListController (resume list manager)
 * 
 * It eliminates circular dependencies and provides a clean interface
 * for all navigation operations.
 */

class NavigationAPI {
    constructor() {
        this.cardsController = null;
        this.resumeItemsController = null;
        this.resumeListController = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the API with references to all controllers
     */
    initialize(cardsController, resumeItemsController, resumeListController) {
        this.cardsController = cardsController;
        this.resumeItemsController = resumeItemsController;
        this.resumeListController = resumeListController;
        this.isInitialized = true;
        
        window.CONSOLE_LOG_IGNORE('NavigationAPI initialized with all controllers');
    }

    /**
     * Navigate to a specific job index
     * This is the main entry point for all navigation
     */
    navigateToJobIndex(jobIndex, caller = 'unknown') {
        if (!this.isInitialized) {
            console.error('NavigationAPI not initialized');
            return false;
        }

        if (jobIndex === null || jobIndex === undefined) {
            console.error('NavigationAPI: Invalid job index:', jobIndex);
            return false;
        }

        window.CONSOLE_LOG_IGNORE(`NavigationAPI: Navigating to job index ${jobIndex} from ${caller}`);

        // Use selection manager as the single source of truth
        selectionManager.selectJobIndex(jobIndex, `NavigationAPI.${caller}`);
        return true;
    }

    /**
     * Navigate to next job
     */
    navigateToNext(caller = 'unknown') {
        if (!this.isInitialized) return false;

        const currentIndex = selectionManager.getSelectedJobIndex();
        if (currentIndex === null) {
            // If nothing selected, start with first job
            return this.navigateToJobIndex(0, caller);
        }

        const nextIndex = currentIndex + 1;
        const maxIndex = this.cardsController?.bizCardDivs?.length - 1 || 0;
        
        if (nextIndex <= maxIndex) {
            return this.navigateToJobIndex(nextIndex, caller);
        }
        
        return false; // Already at end
    }

    /**
     * Navigate to previous job
     */
    navigateToPrevious(caller = 'unknown') {
        if (!this.isInitialized) return false;

        const currentIndex = selectionManager.getSelectedJobIndex();
        if (currentIndex === null) {
            // If nothing selected, start with last job
            const maxIndex = this.cardsController?.bizCardDivs?.length - 1 || 0;
            return this.navigateToJobIndex(maxIndex, caller);
        }

        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
            return this.navigateToJobIndex(prevIndex, caller);
        }
        
        return false; // Already at beginning
    }

    /**
     * Get current job index
     */
    getCurrentJobIndex() {
        return selectionManager.getSelectedJobIndex();
    }

    /**
     * Get total number of jobs
     */
    getTotalJobCount() {
        return this.cardsController?.bizCardDivs?.length || 0;
    }

    /**
     * Check if we can navigate to next
     */
    canNavigateToNext() {
        const currentIndex = this.getCurrentJobIndex();
        const totalCount = this.getTotalJobCount();
        return currentIndex !== null && currentIndex < totalCount - 1;
    }

    /**
     * Check if we can navigate to previous
     */
    canNavigateToPrevious() {
        const currentIndex = this.getCurrentJobIndex();
        return currentIndex !== null && currentIndex > 0;
    }

    /**
     * Get card div by job index
     */
    getCardDivByJobIndex(jobIndex) {
        return this.cardsController?.bizCardDivs?.[jobIndex] || null;
    }

    /**
     * Get resume div by job index
     */
    getResumeDivByJobIndex(jobIndex) {
        return this.resumeItemsController?.getBizResumeDivByJobIndex(jobIndex) || null;
    }

    /**
     * Scroll card into view
     */
    scrollCardIntoView(jobIndex, animate = true) {
        const cardDiv = this.getCardDivByJobIndex(jobIndex);
        if (cardDiv && this.cardsController) {
            return this.cardsController.scrollBizCardDivIntoView(cardDiv, animate);
        }
        return false;
    }

    /**
     * Scroll resume into view
     */
    scrollResumeIntoView(jobIndex, animate = true) {
        const resumeDiv = this.getResumeDivByJobIndex(jobIndex);
        if (resumeDiv && this.resumeListController) {
            return this.resumeListController.scrollToBizResumeDiv(resumeDiv, animate);
        }
        return false;
    }

    /**
     * Scroll both card and resume into view
     */
    scrollBothIntoView(jobIndex, animate = true) {
        const cardSuccess = this.scrollCardIntoView(jobIndex, animate);
        const resumeSuccess = this.scrollResumeIntoView(jobIndex, animate);
        return cardSuccess && resumeSuccess;
    }

    /**
     * Get job data by index
     */
    getJobDataByIndex(jobIndex) {
        return this.cardsController?.jobsData?.[jobIndex] || null;
    }

    /**
     * Get all job data
     */
    getAllJobData() {
        return this.cardsController?.jobsData || [];
    }

    /**
     * Clear current selection
     */
    clearSelection(caller = 'unknown') {
        selectionManager.clearSelection(`NavigationAPI.${caller}`);
    }

    /**
     * Set hover state
     */
    setHover(jobIndex, caller = 'unknown') {
        selectionManager.setHover(jobIndex, `NavigationAPI.${caller}`);
    }

    /**
     * Clear hover state
     */
    clearHover(caller = 'unknown') {
        selectionManager.clearHover(`NavigationAPI.${caller}`);
    }
}

// Create singleton instance
const navigationAPI = new NavigationAPI();

export { navigationAPI }; 