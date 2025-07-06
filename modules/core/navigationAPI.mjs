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
    navigateToJobNumber(jobNumber, caller = 'unknown') {
        if (!this.isInitialized) {
            window.CONSOLE_LOG_IGNORE('NavigationAPI not initialized');
            return false;
        }

        if (jobNumber === null || jobNumber === undefined) {
            window.CONSOLE_LOG_IGNORE('NavigationAPI: Invalid job index:', jobNumber);
            return false;
        }

        window.CONSOLE_LOG_IGNORE(`NavigationAPI: Navigating to job index ${jobNumber} from ${caller}`);

        // Use selection manager as the single source of truth
        selectionManager.selectJobNumber(jobNumber, `NavigationAPI.${caller}`);
        return true;
    }

    /**
     * Navigate to next job
     */
    navigateToNext(caller = 'unknown') {
        if (!this.isInitialized) return false;

        const currentIndex = selectionManager.getSelectedJobNumber();
        if (currentIndex === null) {
            // If nothing selected, start with first job
            return this.navigateToJobNumber(0, caller);
        }

        const nextIndex = currentIndex + 1;
        const maxIndex = this.cardsController?.bizCardDivs?.length - 1 || 0;
        
        if (nextIndex <= maxIndex) {
            return this.navigateToJobNumber(nextIndex, caller);
        }
        
        return false; // Already at end
    }

    /**
     * Navigate to previous job
     */
    navigateToPrevious(caller = 'unknown') {
        if (!this.isInitialized) return false;

        const currentIndex = selectionManager.getSelectedJobNumber();
        if (currentIndex === null) {
            // If nothing selected, start with last job
            const maxIndex = this.cardsController?.bizCardDivs?.length - 1 || 0;
            return this.navigateToJobNumber(maxIndex, caller);
        }

        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
            return this.navigateToJobNumber(prevIndex, caller);
        }
        
        return false; // Already at beginning
    }

    /**
     * Get current job index
     */
    getCurrentJobNumber() {
        return selectionManager.getSelectedJobNumber();
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
        const currentIndex = this.getCurrentJobNumber();
        const totalCount = this.getTotalJobCount();
        return currentIndex !== null && currentIndex < totalCount - 1;
    }

    /**
     * Check if we can navigate to previous
     */
    canNavigateToPrevious() {
        const currentIndex = this.getCurrentJobNumber();
        return currentIndex !== null && currentIndex > 0;
    }

    /**
     * Get card div by job index
     */
    getCardDivByJobNumber(jobNumber) {
        return this.cardsController?.bizCardDivs?.[jobNumber] || null;
    }

    /**
     * Get resume div by job index
     */
    getResumeDivByJobNumber(jobNumber) {
        return this.resumeItemsController?.getBizResumeDivByJobNumber(jobNumber) || null;
    }

    /**
     * Scroll card into view with smooth animation
     */
    scrollCardIntoView(jobNumber, smooth = true) {
        const cardDiv = this.getCardDivByJobNumber(jobNumber);
        if (cardDiv && this.cardsController) {
            return this.cardsController.scrollBizCardDivIntoView(cardDiv, `NavigationAPI.scrollCardIntoView`);
        }
        return false;
    }

    /**
     * Scroll resume into view with smooth animation
     */
    scrollResumeIntoView(jobNumber, smooth = true) {
        const resumeDiv = this.getResumeDivByJobNumber(jobNumber);
        if (resumeDiv && this.resumeListController) {
            return this.resumeListController.scrollBizResumeDivIntoView(resumeDiv);
        }
        return false;
    }

    /**
     * Scroll both card and resume into view with smooth animation
     */
    scrollBothIntoView(jobNumber, smooth = true) {
        const cardSuccess = this.scrollCardIntoView(jobNumber, smooth);
        const resumeSuccess = this.scrollResumeIntoView(jobNumber, smooth);
        return cardSuccess && resumeSuccess;
    }

    /**
     * Get job data by index
     */
    getJobDataByIndex(jobNumber) {
        return this.cardsController?.jobsData?.[jobNumber] || null;
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
    setHover(jobNumber, caller = 'unknown') {
        selectionManager.setHover(jobNumber, `NavigationAPI.${caller}`);
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