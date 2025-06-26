// modules/resume/resumeManager.mjs

import { InfiniteScrollingContainer } from './infiniteScrollingContainer.mjs';
import * as domUtils from '../utils/domUtils.mjs';
import { bizCardDivManager } from '../scene/bizCardDivManager.mjs';
import * as scenePlane from '../scene/scenePlane.mjs';
import { bizResumeDivManager } from '../scene/bizResumeDivManager.mjs';

import { Logger, LogLevel } from '../logger.mjs';
const log = new Logger("resumeManager", LogLevel.DEBUG);


class ResumeManager {
  constructor() {
    this.resumeContentDiv = document.getElementById('resume-content-div');
    if ( !this.resumeContentDiv ) throw new Error('ResumeManager: initialize: resume-content-div not found in DOM');
    this.infiniteScroller = null;
    this.bizResumeDivs = null;
    this.originalJobsData = null;
    this.currentSortRule = null;
    this.sortedIndices = []; // Maps sorted position to original index
    this._isInitialized = false; // Add initialization flag
    this.selectedJobIndex = null;
  }

  initialize(originalJobsData, bizResumeDivs) {
    this.originalJobsData = originalJobsData;
    this.bizResumeDivs = bizResumeDivs;
    
    // Initialize infinite scrolling container
    this.setupInfiniteScrolling();
    
    // Set default sort (maintain original order)
    this.currentSortRule = { field: 'original', direction: 'asc' };
    this.updateSortedIndices();
    
    // On page load the selectedJobIndex is set to the jobIndex
    // of the first bizResumeDiv in the sorted list of bizResumeDiv.
    if (this.sortedIndices.length > 0) {
      this.setSelectedJobIndex(this.sortedIndices[0]);
    }

    this._isInitialized = true; // Set initialization flag to true
    log.info("ResumeManager initialized successfully");
  }
  
  // Method to check if ResumeManager is initialized (renamed for consistency)
  isInitialized() {
    return this._isInitialized;
  }

  setupInfiniteScrolling() {
    // Initialize the infinite scrolling container
    this.infiniteScroller = new InfiniteScrollingContainer(this.resumeContentDiv, {
      cloneCount: 3, // Number of clones above/below
      transitionDuration: 300,
      onItemChange: (index, item) => {
        this.handleResumeItemChange(index, item);
      }
    });

    // Set the biz-resume-divs as items
    this.infiniteScroller.setItems(this.bizResumeDivs);
  }

  // selectedJobIndex : the jobIndex is used to calculate the 
  // first, previous, next and last jobIndex for the given sorted.
  // it is the jobIndex used when creating each bizResumeDiv element.
  //
  // On page load the selectedJobIndex is set to the jobIndex
  // of the first bizResumeDiv in the sorted list of bizResumeDiv.
  //
  // The selectedJobIndex is NOT changed when new sorting criteria
  // are applied.
  //
  
  getSelectedJobIndex() {
    log.log(`getSelectedJobIndex: selectedJobIndex: ${this.selectedJobIndex}`);
    return this.selectedJobIndex;
  }

  setSelectedJobIndex(jobIndex) {
    const jobIndexInt = parseInt(jobIndex, 10);
    if (isNaN(jobIndexInt)) {
        log.warn(`setSelectedJobIndex: Invalid jobIndex: ${jobIndex}`);
        return;
    }
    console.log(`[DEBUG] setSelectedJobIndex: New index is ${jobIndexInt}`);
    this.selectedJobIndex = jobIndexInt;
  }

  clearSelectedJobIndex() { 
    this.selectedJobIndex = null;
    log.log(`clearSelectedJobIndex: selectedJobIndex: ${this.selectedJobIndex}`);
  }

  handleResumeItemChange(index, resumeDiv) {
    // Convert sorted index back to original index for external systems
    const originalIndex = this.sortedIndices[index];
    
    // This is called when the active resume item changes
    // You can use this to sync with the scene view or update other UI elements
    // logger.info(`Active resume item changed to sorted index: ${index}, original index: ${originalIndex}`);
    
    // Example: Trigger selection in scene view using original index
    // this.selectBizCardInScene(originalIndex);
    
    // Example: Update navigation indicators
    // this.updateNavigationIndicators(index, originalIndex);
  }

  // Public methods for external control (e.g., from navigation buttons)
  goToResumeItem(index) {
    if (this.infiniteScroller && index >= 0 && index < this.bizResumeDivs.length) {
      this.infiniteScroller.scrollToIndex(index);
    }
  }

  goToNextResumeItem() {
    const selectedJobIndex = this.getSelectedJobIndex();

    if (!this.sortedIndices || this.sortedIndices.length === 0) {
      return; // No items to select
    }

    let currentSortedPosition = -1;
    if (selectedJobIndex !== null) {
      currentSortedPosition = this.sortedIndices.indexOf(selectedJobIndex);
    }

    // If nothing is selected or the selection is not in the current sorted list, start from the top.
    const nextSortedPosition = (currentSortedPosition + 1) % this.sortedIndices.length;
    const nextJobIndex = this.sortedIndices[nextSortedPosition];

    // Update the state
    this.setSelectedJobIndex(nextJobIndex);

    // Update the UI
    scenePlane.clearAllSelected();

    // Update the bizCardDiv in the 3D scene
    const bizCardDiv = bizCardDivManager.getBizCardDivByJobIndex(nextJobIndex);
    if (bizCardDiv) {
      bizResumeDivManager.styleBizCardDivAsSelectedAndScrollIntoView(bizCardDiv);
    }

    // Update the bizResumeDiv in the list
    this.styleBizResumeDivAsSelectedAndScrollIntoView(nextJobIndex);
  }

  goToPreviousResumeItem() {
    const selectedJobIndex = this.getSelectedJobIndex();

    if (!this.sortedIndices || this.sortedIndices.length === 0) {
      return; // No items to select
    }

    let currentSortedPosition = -1;
    if (selectedJobIndex !== null) {
      currentSortedPosition = this.sortedIndices.indexOf(selectedJobIndex);
    }

    let prevSortedPosition;
    if (currentSortedPosition === -1) {
      // If nothing is selected, start from the end
      prevSortedPosition = this.sortedIndices.length - 1;
    } else {
      prevSortedPosition = (currentSortedPosition - 1 + this.sortedIndices.length) % this.sortedIndices.length;
    }

    const prevJobIndex = this.sortedIndices[prevSortedPosition];

    // Update the state
    this.setSelectedJobIndex(prevJobIndex);

    // Update the UI
    scenePlane.clearAllSelected();

    // Update the bizCardDiv in the 3D scene
    const bizCardDiv = bizCardDivManager.getBizCardDivByJobIndex(prevJobIndex);
    if (bizCardDiv) {
      bizResumeDivManager.styleBizCardDivAsSelectedAndScrollIntoView(bizCardDiv);
    }

    // Update the bizResumeDiv in the list
    this.styleBizResumeDivAsSelectedAndScrollIntoView(prevJobIndex);
  }

  goToFirstResumeItem() {
    if (!this.sortedIndices || this.sortedIndices.length === 0) {
      return;
    }
    const firstJobIndex = this.sortedIndices[0];
    this.setSelectedJobIndex(firstJobIndex);
    scenePlane.clearAllSelected();
    const bizCardDiv = bizCardDivManager.getBizCardDivByJobIndex(firstJobIndex);
    if (bizCardDiv) {
      bizResumeDivManager.styleBizCardDivAsSelectedAndScrollIntoView(bizCardDiv);
    }
    this.styleBizResumeDivAsSelectedAndScrollIntoView(firstJobIndex);
  }

  goToLastResumeItem() {
    if (!this.sortedIndices || this.sortedIndices.length === 0) {
      return;
    }
    const lastJobIndex = this.sortedIndices[this.sortedIndices.length - 1];
    this.setSelectedJobIndex(lastJobIndex);
    scenePlane.clearAllSelected();
    const bizCardDiv = bizCardDivManager.getBizCardDivByJobIndex(lastJobIndex);
    if (bizCardDiv) {
      bizResumeDivManager.styleBizCardDivAsSelectedAndScrollIntoView(bizCardDiv);
    }
    this.styleBizResumeDivAsSelectedAndScrollIntoView(lastJobIndex);
  }

  getCurrentResumeIndex() {
    return this.infiniteScroller ? this.infiniteScroller.getCurrentIndex() : 0;
  }

  // Sync with a selection in the scene view
  syncWithSceneSelection(jobIndex) {
    console.log(`ResumeManager: Syncing with scene selection for job index ${jobIndex}`);
    
    // Find the sorted index for this job index
    const sortedIndex = this.sortedIndices.indexOf(jobIndex);
    if (sortedIndex === -1) {
      console.error(`ResumeManager: Job index ${jobIndex} not found in sortedIndices`);
      return false;
    }
    
    console.log(`ResumeManager: Found sorted index ${sortedIndex} for job index ${jobIndex}`);
    
    // use the infiniteScroller to scroll to the item
    if (this.infiniteScroller) {
      console.log(`ResumeManager: Using infiniteScroller to scroll to sorted index ${sortedIndex}`);
      this.infiniteScroller.scrollToItem(sortedIndex);
    } else {
      console.error("ResumeManager: infiniteScroller not available");
    }
  }

  // Sorting functionality
  applySortRule(sortRule) {
    console.log('[DEBUG] applySortRule: Sorting started.');
    // 1. Remember the currently selected job index
    const previouslySelectedJobIndex = this.getSelectedJobIndex();
    console.log(`[DEBUG] applySortRule: Previously selected index was ${previouslySelectedJobIndex}`);

    // 2. Apply the sort and re-render the scroller
    this.currentSortRule = { ...sortRule };
    this.updateSortedIndices();
    this.applySortedOrder();

    // 3. If an item was selected, restore its state directly
    if (previouslySelectedJobIndex !== null) {
      console.log(`[DEBUG] applySortRule: Restoring selection for job index ${previouslySelectedJobIndex}`);
      // a. Clear any stray selections
      scenePlane.clearAllSelected();

      // b. Re-select the bizCardDiv and scroll it into view
      const bizCardDiv = bizCardDivManager.getBizCardDivByJobIndex(previouslySelectedJobIndex);
      console.log(`[DEBUG] applySortRule: Found bizCardDiv to re-select: ${bizCardDiv?.id}`);
      if (bizCardDiv) {
        bizResumeDivManager.styleBizCardDivAsSelectedAndScrollIntoView(bizCardDiv);
      }

      // c. Re-select the bizResumeDiv and scroll it into view
      console.log(`[DEBUG] applySortRule: Styling and scrolling resume div for job index ${previouslySelectedJobIndex}`);
      this.styleBizResumeDivAsSelectedAndScrollIntoView(previouslySelectedJobIndex);
    } else {
      console.log('[DEBUG] applySortRule: No item was previously selected.');
    }
    console.log('[DEBUG] applySortRule: Sorting finished.');
  }

  /**
   * Finds a bizResumeDiv by its job index, styles it as selected, and scrolls it into view.
   * @param {number} jobIndex The job index to select and scroll to.
   */
  styleBizResumeDivAsSelectedAndScrollIntoView(jobIndex) {
    console.log(`[DEBUG] styleBizResumeDiv...: Looking for new sorted index for job index ${jobIndex}`);
    const newSortedIndex = this.sortedIndices.indexOf(jobIndex);
    console.log(`[DEBUG] styleBizResumeDiv...: New sorted index is ${newSortedIndex}`);
    if (newSortedIndex !== -1) {
      const bizResumeDiv = this.infiniteScroller.getItemAtIndex(newSortedIndex);
      console.log(`[DEBUG] styleBizResumeDiv...: Found resume div: ${bizResumeDiv?.id}`);
      if (bizResumeDiv) {
        bizResumeDiv.classList.add('selected');
      }
      this.infiniteScroller.scrollToItem(newSortedIndex);
    }
  }

  updateSortedIndices() {
    // Create array of indices with their corresponding job data
    const indexedJobs = this.originalJobsData.map((job, index) => ({
      index,
      job
    }));

    // Sort based on the current rule
    indexedJobs.sort((a, b) => {
      let comparison = 0;
      
      switch (this.currentSortRule.field) {
        case 'employer':
          comparison = this.compareStrings(a.job.employer, b.job.employer);
          break;
        case 'startDate':
          comparison = this.compareDates(a.job.startDate, b.job.startDate);
          break;
        case 'endDate':
          comparison = this.compareDates(a.job.endDate, b.job.endDate);
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
  }

  compareStrings(a, b) {
    const stringA = (a || '').toString().toLowerCase();
    const stringB = (b || '').toString().toLowerCase();
    return stringA.localeCompare(stringB);
  }

  compareDates(a, b) {
    // Handle various date formats
    const dateA = this.parseDate(a);
    const dateB = this.parseDate(b);
    
    if (dateA === null && dateB === null) return 0;
    if (dateA === null) return -1;
    if (dateB === null) return 1;
    
    return dateA.getTime() - dateB.getTime();
  }

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

  applySortedOrder() {
    if (!this.infiniteScroller) return;
    
    // Create new array of divs in sorted order
    const sortedDivs = this.sortedIndices.map(originalIndex => this.bizResumeDivs[originalIndex]);
    
    // Update the infinite scroller with the new order
    this.infiniteScroller.setItems(sortedDivs);
  }

  // Convenience methods for common sorts
  sortByEmployerAsc() {
    this.applySortRule({ field: 'employer', direction: 'asc' });
  }

  sortByEmployerDesc() {
    this.applySortRule({ field: 'employer', direction: 'desc' });
  }

  sortByStartDateAsc() {
    this.applySortRule({ field: 'startDate', direction: 'asc' });
  }

  sortByStartDateDesc() {
    this.applySortRule({ field: 'startDate', direction: 'desc' });
  }

  sortByEndDateAsc() {
    this.applySortRule({ field: 'endDate', direction: 'asc' });
  }

  sortByEndDateDesc() {
    this.applySortRule({ field: 'endDate', direction: 'desc' });
  }

  sortByRoleAsc() {
    this.applySortRule({ field: 'role', direction: 'asc' });
  }

  sortByRoleDesc() {
    this.applySortRule({ field: 'role', direction: 'desc' });
  }

  sortByOriginalOrder() {
    this.applySortRule({ field: 'original', direction: 'asc' });
  }

  // Get current sort information
  getCurrentSortRule() {
    return { ...this.currentSortRule };
  }

  // Get original index from current sorted position
  getOriginalIndexFromSorted(sortedIndex) {
    // Validate input
    if (sortedIndex === null || sortedIndex === undefined) {
      console.error(`getOriginalIndexFromSorted: Invalid sorted index: ${sortedIndex}`);
      return -1;
    }
    
    // Convert to number if it's a string
    const numericIndex = parseInt(sortedIndex, 10);
    if (isNaN(numericIndex)) {
      console.error(`getOriginalIndexFromSorted: Sorted index is not a number: ${sortedIndex}`);
      return -1;
    }
    
    // Check if sortedIndices is initialized
    if (!this.sortedIndices || !Array.isArray(this.sortedIndices)) {
      console.error("getOriginalIndexFromSorted: sortedIndices is not properly initialized");
      return -1;
    }
    
    // Check if the index is in range
    if (numericIndex < 0 || numericIndex >= this.sortedIndices.length) {
      console.error(`getOriginalIndexFromSorted: Sorted index ${numericIndex} is out of range (0-${this.sortedIndices.length - 1})`);
      return -1;
    }
    
    // Get the original index
    const originalIndex = this.sortedIndices[numericIndex];
    
    // Log the result
    console.log(`getOriginalIndexFromSorted: Sorted index ${numericIndex} maps to original index ${originalIndex}`);
    
    return originalIndex;
  }

  // Get sorted position from original index
  getSortedIndexFromOriginal(originalIndex) {
    try {
        // Convert to number if it's a string
        const numericIndex = parseInt(originalIndex, 10);
        
        // Check if sortedIndices exists
        if (!this.sortedIndices || !Array.isArray(this.sortedIndices)) {
            console.error(`getSortedIndexFromOriginal: sortedIndices is not an array`);
            return -1;
        }
        
        // Find the index
        const sortedIndex = this.sortedIndices.indexOf(numericIndex);
        
        // Log the result
        if (sortedIndex === -1) {
            console.warn(`getSortedIndexFromOriginal: Original index ${numericIndex} not found in sortedIndices`);
        } else {
            console.log(`getSortedIndexFromOriginal: Original index ${numericIndex} maps to sorted index ${sortedIndex}`);
        }
        
        return sortedIndex;
    } catch (error) {
        console.error(`ResumeManager: Error in getSortedIndexFromOriginal:`, error);
        return -1;
    }
  }

  destroy() {
    if (this.infiniteScroller) {
      this.infiniteScroller.destroy();
      this.infiniteScroller = null;
    }
  }

  addClassItem(jobIndex, className) {
    try {
        const sortedIndex = this.getSortedIndexFromOriginal(jobIndex);
        if (sortedIndex === -1) {
            console.warn(`ResumeManager: Original index ${jobIndex} not found in sortedIndices`);
            return;
        }
        
        if (!this.infiniteScroller) {
            console.warn(`ResumeManager: infiniteScroller is not initialized`);
            return;
        }
        
        const resumeDiv = this.infiniteScroller.getItemAtIndex(sortedIndex);
        if (resumeDiv) {
            resumeDiv.classList.add(className);
            console.log(`ResumeManager: Added class ${className} to item at index ${sortedIndex}`);
        } else {
            console.warn(`ResumeManager: Could not find item at sorted index ${sortedIndex}`);
        }
    } catch (error) {
        console.error(`ResumeManager: Error in addClassItem:`, error);
    }
  }

  removeClassItem(jobIndex, className) {
    try {
        const sortedIndex = this.getSortedIndexFromOriginal(jobIndex);
        if (sortedIndex === -1) {
            console.warn(`ResumeManager: Original index ${jobIndex} not found in sortedIndices`);
            return;
        }
        
        if (!this.infiniteScroller) {
            console.warn(`ResumeManager: infiniteScroller is not initialized`);
            return;
        }
        
        const resumeDiv = this.infiniteScroller.getItemAtIndex(sortedIndex);
        if (resumeDiv) {
            resumeDiv.classList.remove(className);
            console.log(`ResumeManager: Removed class ${className} from item at index ${sortedIndex}`);
        } else {
            console.warn(`ResumeManager: Could not find item at sorted index ${sortedIndex}`);
        }
    } catch (error) {
        console.error(`ResumeManager: Error in removeClassItem:`, error);
    }
  }

  /**
   * Scroll a bizResumeDiv into view using the infiniteScroller
   * @param {HTMLElement} bizResumeDiv - The bizResumeDiv to scroll into view
   * @returns {boolean} - Whether the scroll was successful
   */
  scrollBizResumeDivIntoView(bizResumeDiv) {
    if (!bizResumeDiv) {
      console.error("ResumeManager: scrollBizResumeDivIntoView called with null bizResumeDiv");
      return false;
    }
    
    console.log(`ResumeManager: Scrolling bizResumeDiv ${bizResumeDiv.id} into view`);
    
    // If we have an infinite scroller, use it (most efficient)
    if (this.infiniteScroller) {
      console.log(`ResumeManager: Using infiniteScroller to scroll bizResumeDiv ${bizResumeDiv.id}`);
      return this.infiniteScroller.scrollToBizResumeDiv(bizResumeDiv, true);
    }
    
    // If we don't have an infinite scroller, use direct scrollIntoView
    console.log(`ResumeManager: No infiniteScroller available, using direct scrollIntoView for ${bizResumeDiv.id}`);
    try {
      bizResumeDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return true;
    } catch (error) {
      console.error(`ResumeManager: Error scrolling bizResumeDiv ${bizResumeDiv.id} into view:`, error);
      return false;
    }
  }

  /**
   * Scroll the bizResumeDiv into view without selecting it
   * This is used when a bizCardDiv is clicked and we want to show the corresponding bizResumeDiv
   * without triggering the selection logic in the bizResumeDiv
   * @param {HTMLElement} bizResumeDiv - The bizResumeDiv to scroll into view
   */
  scrollBizResumeDivIntoViewWithoutSelection(bizResumeDiv) {
    if (!bizResumeDiv) {
      console.error("ResumeManager: scrollBizResumeDivIntoViewWithoutSelection called with null bizResumeDiv");
      return false;
    }
    
    console.log(`ResumeManager: Scrolling bizResumeDiv ${bizResumeDiv.id} into view without selection`);
    
    // If we have an infinite scroller, use it to scroll to the item
    if (this.infiniteScroller) {
      const jobIndex = parseInt(bizResumeDiv.getAttribute('data-job-index'), 10);
      const sortedIndex = this.sortedIndices.indexOf(jobIndex);
      
      if (sortedIndex !== -1) {
        console.log(`ResumeManager: Using infiniteScroller to scroll to sorted index ${sortedIndex}`);
        this.infiniteScroller.scrollToItem(sortedIndex);
        return true;
      } else {
        console.error(`ResumeManager: Job index ${jobIndex} not found in sortedIndices`);
      }
    }
    
    // Fallback to direct scrollIntoView if infiniteScroller is not available
    // or if we couldn't find the sorted index
    console.log(`ResumeManager: Using direct scrollIntoView for ${bizResumeDiv.id}`);
    bizResumeDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return true;
  }

  /**
   * Scroll to a specific job index
   * @param {number} jobIndex - The job index to scroll to
   * @returns {boolean} - Whether the scroll was successful
   */
  scrollToJobIndex(jobIndex) {
    console.log(`ResumeManager: Scrolling to job index ${jobIndex}`);
    
    // Find the bizResumeDiv with this job index
    const bizResumeDiv = this.findBizResumeDivByJobIndex(jobIndex);
    if (bizResumeDiv) {
      return this.scrollBizResumeDivIntoView(bizResumeDiv);
    }
    
    // If we couldn't find the bizResumeDiv but have an infinite scroller,
    // try to find the sorted index and scroll to it
    if (this.infiniteScroller) {
      const sortedIndex = this.findSortedIndexForJobIndex(jobIndex);
      if (sortedIndex !== -1) {
        console.log(`ResumeManager: Using infiniteScroller to scroll to sorted index ${sortedIndex}`);
        return this.infiniteScroller.scrollToItem(sortedIndex, true);
      }
    }
    
    console.error(`ResumeManager: Could not find bizResumeDiv or sorted index for job index ${jobIndex}`);
    return false;
  }

  /**
   * Find a bizResumeDiv by job index
   * @param {number} jobIndex - The job index to find
   * @returns {HTMLElement|null} - The bizResumeDiv element, or null if not found
   */
  findBizResumeDivByJobIndex(jobIndex) {
    return document.querySelector(`.biz-resume-div[data-job-index="${jobIndex}"]`);
  }

  /**
   * Sync with a selection in the scene view without triggering a click
   * This is used when a bizCardDiv is clicked and we want to sync the resume view
   * without triggering the selection logic in the bizResumeDiv
   * @param {number} jobIndex - The job index to sync with
   * @returns {boolean} - Whether the sync was successful
   */
  syncWithSceneSelectionWithoutClick(jobIndex) {
    console.log(`ResumeManager: Syncing with scene selection for job index ${jobIndex} (without click)`);
    
    // Find the sorted index for this job index
    const sortedIndex = this.sortedIndices.indexOf(jobIndex);
    if (sortedIndex === -1) {
      console.error(`ResumeManager: Job index ${jobIndex} not found in sortedIndices`);
      return false;
    }
    
    console.log(`ResumeManager: Found sorted index ${sortedIndex} for job index ${jobIndex}`);
    
    // If we have an infinite scroller, use it to scroll to the item
    if (this.infiniteScroller) {
      console.log(`ResumeManager: Using infiniteScroller to scroll to sorted index ${sortedIndex}`);
      this.infiniteScroller.scrollToItem(sortedIndex);
      return true;
    }
    
    // If we don't have an infinite scroller, try to find the bizResumeDiv directly
    const bizResumeDivId = `biz-resume-div-${jobIndex}`;
    const bizResumeDiv = document.getElementById(bizResumeDivId);
    
    if (bizResumeDiv) {
      console.log(`ResumeManager: Found bizResumeDiv ${bizResumeDivId}, scrolling into view`);
      bizResumeDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return true;
    } else {
      console.error(`ResumeManager: Could not find bizResumeDiv with ID ${bizResumeDivId}`);
      return false;
    }
  }
}

const resumeManager = new ResumeManager();
export { resumeManager };
