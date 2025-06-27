// modules/resume/resumeManager.mjs

import { InfiniteScrollingContainer } from './infiniteScrollingContainer.mjs';
import * as domUtils from '../utils/domUtils.mjs';
// No longer directly interacting with these for selection
// import { bizCardDivManager } from '../scene/bizCardDivManager.mjs';
// import * as scenePlane from '../scene/scenePlane.mjs';
import { bizResumeDivManager } from '../scene/bizResumeDivManager.mjs';
import { selectionManager } from '../core/selectionManager.mjs';

class ResumeManager {
  constructor() {
    this.resumeContentDiv = document.getElementById('resume-content-div');
    if ( !this.resumeContentDiv ) throw new Error('ResumeManager: initialize: resume-content-div not found in DOM');
    this.infiniteScroller = null;
    this.bizResumeDivs = null;
    this.originalJobsData = null;
    this.currentSortRule = null;
    this.sortedIndices = []; // Maps sorted position to original index
    this._isInitialized = false;
    
    // Listen ONLY for selection changes to trigger scrolling. Styling is handled by bizResumeDivManager.
    selectionManager.addEventListener('selectionChanged', this.handleSelectionChanged.bind(this));
  }

  initialize(originalJobsData, bizResumeDivs) {
    this.originalJobsData = originalJobsData;
    this.bizResumeDivs = bizResumeDivs;
    
    this.setupInfiniteScrolling();
    
    this.currentSortRule = { field: 'original', direction: 'asc' };
    this.updateSortedIndices();
    
    if (this.sortedIndices.length > 0) {
      selectionManager.selectJobIndex(this.sortedIndices[0], 'resumeManager.initialize');
    }

    this._isInitialized = true;
    console.info("ResumeManager initialized successfully");
  }
  
  isInitialized() {
    return this._isInitialized;
  }

  // region Event Handlers from SelectionManager
  handleSelectionChanged(event) {
    const { selectedJobIndex, caller } = event.detail;
    console.log(`ResumeManager: [Listener] Handling selectionChanged from ${caller} for index ${selectedJobIndex}`);
    this.scrollToJobIndex(selectedJobIndex, `resumeManager.handleSelectionChanged from ${caller}`);
  }
  // endregion

  setupInfiniteScrolling() {
    this.infiniteScroller = new InfiniteScrollingContainer(this.resumeContentDiv, {
      cloneCount: 3,
      transitionDuration: 300,
      onItemChange: (index, item) => {
        this.handleResumeItemChange(index, item);
      }
    });
    this.infiniteScroller.setItems(this.bizResumeDivs);
  }

  handleResumeItemChange(index, resumeDiv) {
    const originalIndex = this.sortedIndices[index];
    // This function can be used for future functionality if needed
  }

  goToNextResumeItem() {
    const selectedJobIndex = selectionManager.getSelectedJobIndex();

    if (!this.sortedIndices || this.sortedIndices.length === 0) return;

    let currentSortedPosition = -1;
    if (selectedJobIndex !== null) {
      currentSortedPosition = this.sortedIndices.indexOf(selectedJobIndex);
    }

    const nextSortedPosition = (currentSortedPosition + 1) % this.sortedIndices.length;
    const nextJobIndex = this.sortedIndices[nextSortedPosition];

    selectionManager.selectJobIndex(nextJobIndex, 'resumeManager.goToNextResumeItem');
  }

  goToPreviousResumeItem() {
    const selectedJobIndex = selectionManager.getSelectedJobIndex();

    if (!this.sortedIndices || this.sortedIndices.length === 0) return;

    let currentSortedPosition = -1;
    if (selectedJobIndex !== null) {
      currentSortedPosition = this.sortedIndices.indexOf(selectedJobIndex);
    }

    let prevSortedPosition;
    if (currentSortedPosition <= 0) {
      prevSortedPosition = this.sortedIndices.length - 1;
    } else {
      prevSortedPosition = currentSortedPosition - 1;
    }

    const prevJobIndex = this.sortedIndices[prevSortedPosition];
    selectionManager.selectJobIndex(prevJobIndex, 'resumeManager.goToPreviousResumeItem');
  }

  goToFirstResumeItem() {
    if (!this.sortedIndices || this.sortedIndices.length === 0) return;
    const firstJobIndex = this.sortedIndices[0];
    selectionManager.selectJobIndex(firstJobIndex, 'resumeManager.goToFirstResumeItem');
  }

  goToLastResumeItem() {
    if (!this.sortedIndices || this.sortedIndices.length === 0) return;
    const lastJobIndex = this.sortedIndices[this.sortedIndices.length - 1];
    selectionManager.selectJobIndex(lastJobIndex, 'resumeManager.goToLastResumeItem');
  }

  applySortRule(sortRule) {
    console.log('ResumeManager: Sorting started.');
    const previouslySelectedJobIndex = selectionManager.getSelectedJobIndex();
    console.log(`ResumeManager: Previously selected index was ${previouslySelectedJobIndex}`);

    this.currentSortRule = { ...sortRule };
    this.updateSortedIndices();
    this.applySortedOrder();

    if (previouslySelectedJobIndex !== null) {
      this.scrollToJobIndex(previouslySelectedJobIndex, 'applySortRule');
    }
    console.log('ResumeManager: Sorting finished.');
  }

  scrollToJobIndex(jobIndex, caller = '') {
    const newSortedIndex = this.sortedIndices.indexOf(jobIndex);
    if (newSortedIndex !== -1) {
      console.log(`ResumeManager: ${caller}: scrolling to sorted index ${newSortedIndex} for job index ${jobIndex}`);
      this.infiniteScroller.scrollToItem(newSortedIndex);
    } else {
      console.error(`ResumeManager: ${caller}: newSortedIndex not found for job index ${jobIndex}`);
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
}

const resumeManager = new ResumeManager();
export { resumeManager };
