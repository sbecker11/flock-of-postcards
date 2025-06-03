// modules/resume/resumeManager.mjs

import { InfiniteScrollingContainer } from './infiniteScrollingContainer.mjs';
import * as domUtils from '../utils/domUtils.mjs';

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
  }

  initialize(originalJobsData, bizResumeDivs) {
    this.originalJobsData = originalJobsData;
    this.bizResumeDivs = bizResumeDivs;
    
    // Initialize infinite scrolling container
    this.setupInfiniteScrolling();
    
    // Set default sort (maintain original order)
    this.currentSortRule = { field: 'original', direction: 'asc' };
    this.updateSortedIndices();
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

  handleResumeItemChange(index, resumeDiv) {
    // Convert sorted index back to original index for external systems
    const originalIndex = this.sortedIndices[index];
    
    // This is called when the active resume item changes
    // You can use this to sync with the scene view or update other UI elements
    log.info(`Active resume item changed to sorted index: ${index}, original index: ${originalIndex}`);
    
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
    if (this.infiniteScroller) {
      this.infiniteScroller.goToNext();
    }
  }

  goToPreviousResumeItem() {
    if (this.infiniteScroller) {
      this.infiniteScroller.goToPrevious();
    }
  }

  goToFirstResumeItem() {
    if (this.infiniteScroller) {
      this.infiniteScroller.goToFirst();
    }
  }

  goToLastResumeItem() {
    if (this.infiniteScroller) {
      this.infiniteScroller.goToLast();
    }
  }

  getCurrentResumeIndex() {
    return this.infiniteScroller ? this.infiniteScroller.getCurrentIndex() : 0;
  }

  // Method to sync with scene selection (expects original index)
  syncWithSceneSelection(originalIndex) {
    // Convert original index to current sorted position
    const sortedIndex = this.sortedIndices.indexOf(originalIndex);
    if (sortedIndex !== -1) {
      this.goToResumeItem(sortedIndex);
    }
  }

  // Sorting functionality
  applySortRule(sortRule) {
    // sortRule format: { field: 'employer'|'startDate'|'endDate'|'role'|'original', direction: 'asc'|'desc' }
    this.currentSortRule = { ...sortRule };
    this.updateSortedIndices();
    this.applySortedOrder();
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
    return this.sortedIndices[sortedIndex];
  }

  // Get sorted position from original index
  getSortedIndexFromOriginal(originalIndex) {
    return this.sortedIndices.indexOf(originalIndex);
  }

  destroy() {
    if (this.infiniteScroller) {
      this.infiniteScroller.destroy();
      this.infiniteScroller = null;
    }
  }

  addClassItem(jobIndex, className ) {
    const sortedIndex = this.getSortedIndexFromOriginal(jobIndex);
    const resumeDiv = this.infiniteScroller.getItemAtIndex(sortedIndex);
    if ( resumeDiv ) {
      domUtils.addClass(resumeDiv, className);
    }
  }

  removeClassItem(jobIndex, className ) {
    const sortedIndex = this.getSortedIndexFromOriginal(jobIndex);
    const resumeDiv = this.infiniteScroller.getItemAtIndex(sortedIndex);
    if ( resumeDiv ) {
      domUtils.removeClass(resumeDiv, className);
    }
  }
}

// Usage example:
// const resumeManager = new ResumeManager();
// resumeManager.initialize(jobsData, bizResumeDivs);

// Sorting examples:
// resumeManager.sortByEmployerAsc();
// resumeManager.sortByStartDateDesc();
// resumeManager.applySortRule({ field: 'endDate', direction: 'asc' });

// Integration with sorting dropdown:
// document.querySelector('.sort-dropdown').addEventListener('change', (e) => {
//   const [field, direction] = e.target.value.split('_');
//   resumeManager.applySortRule({ field, direction });
// });

// Integration with existing navigation buttons:
// document.querySelector('.nav-first').addEventListener('click', () => {
//   resumeManager.goToFirstResumeItem();
// });
// 
// document.querySelector('.nav-previous').addEventListener('click', () => {
//   resumeManager.goToPreviousResumeItem();
// });
// 
// document.querySelector('.nav-next').addEventListener('click', () => {
//   resumeManager.goToNextResumeItem();
// });
// 
// document.querySelector('.nav-last').addEventListener('click', () => {
//   resumeManager.goToLastResumeItem();
// });

// Example HTML for sort dropdown:
// <select class="sort-dropdown">
//   <option value="original_asc">Original Order</option>
//   <option value="employer_asc">Employer A-Z</option>
//   <option value="employer_desc">Employer Z-A</option>
//   <option value="startDate_desc">Start Date (Newest First)</option>
//   <option value="startDate_asc">Start Date (Oldest First)</option>
//   <option value="endDate_desc">End Date (Newest First)</option>
//   <option value="endDate_asc">End Date (Oldest First)</option>
//   <option value="role_asc">Role A-Z</option>
//   <option value="role_desc">Role Z-A</option>
// </select>

export { ResumeManager };