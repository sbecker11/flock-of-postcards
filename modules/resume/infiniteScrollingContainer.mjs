// modules/resume/infiniteScrollingContainer.mjs

import { applyPaletteToElement, applyStateStyling } from '../composables/useColorPalette.mjs';
import { selectionManager } from '../core/selectionManager.mjs';
import { AppState } from '../core/stateManager.mjs';

class InfiniteScrollingContainer {
  constructor(scrollportElement, contentElement, options = {}) {
    // Singleton pattern: return existing instance if one exists
    if (InfiniteScrollingContainer.instance) {
      // window.CONSOLE_LOG_IGNORE('[DEBUG] InfiniteScrollingContainer: Returning existing singleton instance');
      return InfiniteScrollingContainer.instance;
    }

    // Create new instance
    // window.CONSOLE_LOG_IGNORE('[DEBUG] InfiniteScrollingContainer: Creating new singleton instance');
    
    this.scrollport = scrollportElement;
    this.contentHolder = contentElement;
    this.options = {
      cloneCount: options.cloneCount || 3, // Number of clones above/below
      dragThreshold: options.dragThreshold || 5, // Minimum pixels to start drag
      transitionDuration: options.transitionDuration || 300, // ms for smooth transitions
      enableTouch: options.enableTouch !== false, // Enable touch events
      onItemChange: options.onItemChange || null, // Callback when active item changes
      itemSpacing: options.itemSpacing || 5, // Vertical gap/margin between adjacent rDivs
      ...options
    };

    this.originalItems = [];
    this.allItems = []; // Includes clones
    this.currentIndex = 0; // Index in original items
    this.isDragging = false;
    this.startY = 0;
    this.startScrollTop = 0;
    this.lastY = 0;
    this.velocity = 0;
    this.momentumAnimationId = null;
    this.resizeTimeoutId = null; // For debounced resize handling
    this.lastContentWidth = 0;
    this.lastContentHeight = 0;
    this._isInitialized = false;
    this._initializationPromise = null;
    this._lastTransitionTime = 0; // To prevent rapid transitions

    this.init();
    
    // Store the singleton instance
    InfiniteScrollingContainer.instance = this;
    
    // window.CONSOLE_LOG_IGNORE('[DEBUG] InfiniteScrollingContainer: Singleton instance created and stored');
  }

  reinitialize() {

    this.positionItems();
    this.scrollToIndex(this.currentIndex, false); // Force immediate scroll without animation
  }

  init() {
    this.setupContainer();
    this.bindEvents();
    this.setupResizeObserver();
    // window.CONSOLE_LOG_IGNORE('InfiniteScrollingContainer initialized');
  }

  setupContainer() {
    // The container passed in is the one we manipulate for scrolling
    this.scrollport.style.position = 'relative';
    this.scrollport.style.overflow = 'auto'; /* Changed to auto to enable scrolling */
    this.scrollport.style.userSelect = 'none';
    this.scrollport.style.cursor = 'ns-resize';
  }

  setItems(items, startingIndex = 0) {
    // window.CONSOLE_LOG_IGNORE(`[DEBUG] InfiniteScroller.setItems: Setting ${items.length} items, startingIndex=${startingIndex}`);
    
    // Store the original items array
    this.originalItems = [...items];
    
    // Debug: Check the order of items received
    // window.CONSOLE_LOG_IGNORE(`[DEBUG] InfiniteScroller.setItems: Items order check:`);
    // for (let i = 0; i < Math.min(10, items.length); i++) {
    //   const item = items[i];
    //   if (item) {
    //     const jobNumber = item.getAttribute('data-job-number');
    //     const roleElement = item.querySelector('.biz-details-role');
    //     const employerElement = item.querySelector('.biz-details-employer');
    //     const role = roleElement ? roleElement.textContent.trim() : 'N/A';
    //     const employer = employerElement ? employerElement.textContent.trim() : 'N/A';
    //     // window.CONSOLE_LOG_IGNORE(`  Item ${i}: Job ${jobNumber} -> "${role}" at "${employer}"`);
    //   }
    // }
    
    // Verify that the items array is in the correct order
    // window.CONSOLE_LOG_IGNORE(`[DEBUG] InfiniteScroller.setItems: Verifying item order:`);
    // for (let i = 0; i < Math.min(10, items.length); i++) {
    //   const item = items[i];
    //   if (item) {
    //     const jobNumber = parseInt(item.getAttribute('data-job-number'));
    //     if (jobNumber !== i) {
    //       // window.CONSOLE_LOG_IGNORE(`[DEBUG] InfiniteScroller.setItems: Item at index ${i} has jobNumber ${jobNumber} (expected ${i})`);
    //     } else {
    //       // window.CONSOLE_LOG_IGNORE(`  Item ${i} -> Job ${jobNumber} ✓`);
    //     }
    //   }
    // }
    
    // Create the cloned structure
    this.createClonedStructure();
    
    // Position all items
    this.positionItems();
    
    // Set the current index
    this.currentIndex = startingIndex;
    
    // window.CONSOLE_LOG_IGNORE(`[DEBUG] InfiniteScroller.setItems: Setup complete, currentIndex=${this.currentIndex}`);
    
    // Force a recalculation of heights after setup to ensure all content is properly contained
    setTimeout(() => {
      // window.CONSOLE_LOG_IGNORE('[DEBUG] InfiniteScroller.setItems: Forcing initial height recalculation');
      this.recalculateHeights();
    }, 50);
  }

  createClonedStructure() {
    // Clear existing items
    this.allItems = [];
    
    if (this.originalItems.length === 0) return;

    const itemCount = this.originalItems.length;
    const cloneCount = Math.min(this.options.cloneCount, itemCount);

    // window.CONSOLE_LOG_IGNORE(`[DEBUG] createClonedStructure: itemCount=${itemCount}, cloneCount=${cloneCount}`);

    // Create structure: [tail clones] [original items] [head clones]
    
    // Add tail clones (last N items cloned at the beginning)
    // window.CONSOLE_LOG_IGNORE(`[DEBUG] createClonedStructure: Creating tail clones (last ${cloneCount} items):`);
    for (let i = 0; i < cloneCount; i++) {
      const originalIndex = itemCount - cloneCount + i;
      const clone = this.cloneItem(this.originalItems[originalIndex], originalIndex, 'tail');
      const jobNumber = clone.getAttribute('data-job-number');
      // window.CONSOLE_LOG_IGNORE(`  Tail clone ${i}: originalIndex=${originalIndex}, jobNumber=${jobNumber}`);
      this.allItems.push({
        element: clone,
        originalIndex: originalIndex,
        type: 'tail-clone',
        cloneIndex: i
      });
    }

    // Add original items
    // window.CONSOLE_LOG_IGNORE(`[DEBUG] createClonedStructure: Adding original items:`);
    this.originalItems.forEach((item, index) => {
      const jobNumber = item.getAttribute('data-job-number');
      // window.CONSOLE_LOG_IGNORE(`  Original item ${index}: jobNumber=${jobNumber}`);
      this.allItems.push({
        element: item,
        originalIndex: index,
        type: 'original'
      });
    });

    // Add head clones (first N items cloned at the end)
    // window.CONSOLE_LOG_IGNORE(`[DEBUG] createClonedStructure: Creating head clones (first ${cloneCount} items):`);
    for (let i = 0; i < cloneCount; i++) {
      const originalIndex = i;
      const clone = this.cloneItem(this.originalItems[originalIndex], originalIndex, 'head');
      const jobNumber = clone.getAttribute('data-job-number');
      // window.CONSOLE_LOG_IGNORE(`  Head clone ${i}: originalIndex=${originalIndex}, jobNumber=${jobNumber}`);
      this.allItems.push({
        element: clone,
        originalIndex: originalIndex,
        type: 'head-clone',
        cloneIndex: i
      });
    }

    // window.CONSOLE_LOG_IGNORE(`[DEBUG] createClonedStructure: Final structure has ${this.allItems.length} total items`);
    // window.CONSOLE_LOG_IGNORE(`[DEBUG] createClonedStructure: Structure breakdown:`);
    // window.CONSOLE_LOG_IGNORE(`  Tail clones: ${cloneCount} items (indices 0-${cloneCount-1})`);
    // window.CONSOLE_LOG_IGNORE(`  Original items: ${itemCount} items (indices ${cloneCount}-${cloneCount+itemCount-1})`);
    // window.CONSOLE_LOG_IGNORE(`  Head clones: ${cloneCount} items (indices ${cloneCount+itemCount}-${cloneCount+itemCount+cloneCount-1})`);
    
    // Debug: Check the actual job numbers in the structure
    // window.CONSOLE_LOG_IGNORE(`[DEBUG] createClonedStructure: Job numbers in structure (first 10 items):`);
    // for (let i = 0; i < Math.min(10, this.allItems.length); i++) {
    //   const item = this.allItems[i];
    //   if (item && item.element) {
    //     const jobNumber = item.element.getAttribute('data-job-number');
    //     // window.CONSOLE_LOG_IGNORE(`  Item ${i} (${item.type}) -> Job ${jobNumber}`);
    //   }
    // }
    
    // Debug: Check what job numbers are in the original items array
    // window.CONSOLE_LOG_IGNORE(`[DEBUG] createClonedStructure: Original items job numbers (first 10):`);
    // for (let i = 0; i < Math.min(10, this.originalItems.length); i++) {
    //   const item = this.originalItems[i];
    //   if (item) {
    //     const jobNumber = item.getAttribute('data-job-number');
    //     // window.CONSOLE_LOG_IGNORE(`  Original item ${i} -> Job ${jobNumber}`);
    //   }
    // }
    
    // Add direct click handlers to all items
    this.addDirectClickHandlers();
  }

  cloneItem(originalElement, originalIndex, cloneType) {
    const clone = originalElement.cloneNode(true);
    
    // Add clone identifier
    clone.classList.add('infinite-scroll-clone');
    clone.classList.add(`${cloneType}-clone`);
    clone.dataset.originalIndex = originalIndex;
    clone.dataset.cloneType = cloneType;
    
    // Remove any IDs to avoid duplicates
    this.removeIds(clone);
    
    // Ensure clones don't intercept mouse events - set pointer-events: none from creation
    clone.style.pointerEvents = 'none';
    
    // Event handlers will be managed by the selectionManager system
    
    // Apply palette styling to the clone if it has a data-color-index
    if (clone.hasAttribute('data-color-index')) {
      try {
        applyPaletteToElement(clone);
        applyStateStyling(clone, 'normal');
      } catch (error) {
        window.CONSOLE_LOG_IGNORE('Failed to apply palette to infinite scroll clone:', error);
      }
    }
    
    return clone;
  }

  removeIds(element) {
    if (element.id) {
      element.removeAttribute('id');
    }
    element.querySelectorAll('[id]').forEach(el => {
      el.removeAttribute('id');
    });
  }

  /**
   * Get the current marginTop value for rDivs from the styling system
   * @returns {number} marginTop value in pixels
   */
  getRDivMarginTop() {
    try {
      const marginTopStr = AppState?.theme?.rDivBorderOverrideSettings?.normal?.marginTop || '0px';
      // console.log('[DEBUG] getRDivMarginTop: marginTopStr =', marginTopStr);
      return parseInt(marginTopStr) || 0;
    } catch (error) {
      // console.log('[DEBUG] InfiniteScrollingContainer.getRDivMarginTop: Error getting marginTop, using 0:', error);
      return 0;
    }
  }

  /**
   * Get the current outerBorderWidth value for rDivs from the styling system
   * @returns {number} outerBorderWidth value in pixels
   */
  getRDivOuterBorderWidth() {
    try {
      // Check rDivBorderOverrideSettings first, fallback to default borderSettings
      const rDivSettings = AppState?.theme?.rDivBorderOverrideSettings?.normal;
      const defaultSettings = AppState?.theme?.borderSettings?.normal;
      
      const outerBorderWidthStr = rDivSettings?.outerBorderWidth || defaultSettings?.outerBorderWidth || '0px';
      return parseInt(outerBorderWidthStr) || 0;
    } catch (error) {
      window.CONSOLE_LOG_IGNORE('[DEBUG] InfiniteScrollingContainer.getRDivOuterBorderWidth: Error getting outerBorderWidth, using 0:', error);
      return 0;
    }
  }

  // Centralized positioning logic - single source of truth
  calculateItemPositions(measureHeights = true) {
    // Get spacing values from styling system for rDivs
    const rDivMarginTop = this.getRDivMarginTop();
    const rDivOuterBorderWidth = this.getRDivOuterBorderWidth();
    
    // Total spacing = marginTop + outerBorderWidth (top and bottom borders)
    const totalSpacing = rDivMarginTop + (rDivOuterBorderWidth * 2);
    
    // Always show debug for spacing coordination (regardless of measureHeights)
    // console.log(`[DEBUG] InfiniteScrollingContainer: Using marginTop=${rDivMarginTop}px + outerBorderWidth=${rDivOuterBorderWidth}px (x2) = totalSpacing=${totalSpacing}px`);
    // console.trace('[DEBUG] calculateItemPositions called from:');
    
    // Calculate tail clone heights first
    let tailClonesHeight = 0;
    const tailClones = this.allItems.filter(item => item.type === 'tail-clone');
    
    // Position items in three phases: tail clones (negative), originals (0+), head clones (after originals)
    let currentTop = 0;
    let minTop = 0; // Track the most negative position for content height calculation
    
    // Phase 1: Calculate and position tail clones at negative offsets
    for (let i = tailClones.length - 1; i >= 0; i--) {
      const item = tailClones[i];
      const itemIndex = this.allItems.indexOf(item);
      
      let contentHeight = this.measureItemHeight(item, measureHeights);
      
      // Position tail clones at negative offsets (they appear above original items)
      currentTop -= (contentHeight + totalSpacing);
      const topPosition = currentTop;
      minTop = Math.min(minTop, topPosition); // Track most negative position
      
      this.positionItem(item, topPosition, contentHeight);
      // console.log(`[DEBUG] Tail clone positioning: index=${itemIndex} originalIndex=${item.originalIndex} top=${topPosition}px height=${contentHeight}px`);
    }
    
    // Phase 2: Position original items starting from 0
    currentTop = 0;
    const originalItems = this.allItems.filter(item => item.type === 'original');
    originalItems.forEach((item, originalIndex) => {
      const itemIndex = this.allItems.indexOf(item);
      
      // Add spacing before all original items except the first
      if (originalIndex > 0) currentTop += totalSpacing;
      
      let contentHeight = this.measureItemHeight(item, measureHeights);
      this.positionItem(item, currentTop, contentHeight);
      
      // console.log(`[DEBUG] Original item positioning: index=${itemIndex} originalIndex=${originalIndex} top=${currentTop}px height=${contentHeight}px`);
      currentTop += contentHeight;
    });
    
    // Phase 3: Position head clones after original items
    const headClones = this.allItems.filter(item => item.type === 'head-clone');
    headClones.forEach((item) => {
      const itemIndex = this.allItems.indexOf(item);
      
      currentTop += totalSpacing;
      let contentHeight = this.measureItemHeight(item, measureHeights);
      this.positionItem(item, currentTop, contentHeight);
      
      // console.log(`[DEBUG] Head clone positioning: index=${itemIndex} top=${currentTop}px height=${contentHeight}px`);
      currentTop += contentHeight;
    });
    
    // Store the positioning info for content height calculation
    this._minTop = minTop;
    this._maxTop = currentTop;
    
    return { minTop, maxTop: currentTop };
  }

  // Helper method to measure item height
  measureItemHeight(item, measureHeights) {
    if (measureHeights) {
      // Temporarily reset all constraints to allow natural content measurement
      item.element.style.height = 'auto';
      item.element.style.minHeight = 'auto';
      item.element.style.overflow = 'visible';
      
      // Apply text formatting fixes FIRST before any measurements
      this.ensureProperTextFormatting(item.element);
      
      // Force a layout recalculation after formatting
      void item.element.offsetHeight;
      
      // Measure content height using multiple methods for reliability
      const rect = item.element.getBoundingClientRect();
      const scrollHeight = item.element.scrollHeight;
      const offsetHeight = item.element.offsetHeight;
      const clientHeight = item.element.clientHeight;
      
      // Use the largest value to ensure all content fits
      let contentHeight = Math.max(rect.height || 0, scrollHeight || 0, offsetHeight || 0, clientHeight || 0);
      
      // Sanity check: if height is unreasonably large, use a fallback
      if (contentHeight > 10000 || contentHeight === 0) {
        contentHeight = Math.max(scrollHeight || 300, offsetHeight || 300, clientHeight || 300, 300);
      }
      
      // Add padding to ensure content doesn't overflow
      contentHeight += 20; // Increased padding for better text spacing
      
      // Update item data
      item.height = contentHeight;
      return contentHeight;
    } else {
      // For existing height, still ensure formatting is applied
      this.ensureProperTextFormatting(item.element);
      return item.height || 0;
    }
  }
  
  // Helper method to ensure proper text formatting
  ensureProperTextFormatting(element) {
    // Ensure the main container has proper box model
    element.style.setProperty('box-sizing', 'border-box', 'important');
    
    // Fix skills list formatting
    const skillsList = element.querySelector('.bulleted-job-skills-ul');
    if (skillsList) {
      skillsList.style.setProperty('display', 'flex', 'important');
      skillsList.style.setProperty('flex-wrap', 'wrap', 'important');
      skillsList.style.setProperty('gap', '0.1rem', 'important');
      skillsList.style.setProperty('list-style', 'none', 'important');
      skillsList.style.setProperty('padding', '0', 'important');
      skillsList.style.setProperty('margin', '0', 'important');
      skillsList.style.setProperty('line-height', '1.2', 'important');
      skillsList.style.setProperty('width', '100%', 'important');
      
      // Fix each skill item
      const skillItems = skillsList.querySelectorAll('.bulleted-job-skills-li');
      skillItems.forEach(skill => {
        skill.style.setProperty('display', 'inline-block', 'important');
        skill.style.setProperty('margin', '0.1rem', 'important');
        skill.style.setProperty('white-space', 'nowrap', 'important');
      });
    }
    
    // Ensure all text containers have proper word wrapping and spacing
    const textContainers = element.querySelectorAll('.biz-details-employer, .biz-details-role, .biz-details-dates, .biz-details-description');
    textContainers.forEach(container => {
      container.style.setProperty('word-wrap', 'break-word', 'important');
      container.style.setProperty('overflow-wrap', 'break-word', 'important');
      container.style.setProperty('white-space', 'normal', 'important');
      container.style.setProperty('line-height', '1.4', 'important');
      container.style.setProperty('margin-bottom', '0.5rem', 'important');
    });
    
    // Ensure the details container has proper spacing
    const detailsDiv = element.querySelector('.biz-card-details-div, .biz-resume-details-div');
    if (detailsDiv) {
      detailsDiv.style.setProperty('padding', '10px', 'important');
      detailsDiv.style.setProperty('box-sizing', 'border-box', 'important');
    }
  }

  // Helper method to position an item
  positionItem(item, topPosition, contentHeight) {
    // Set positioning first
    item.element.style.setProperty('position', 'absolute', 'important');
    item.element.style.setProperty('top', `${topPosition}px`, 'important');
    item.element.style.setProperty('left', '10px', 'important');
    item.element.style.setProperty('right', '10px', 'important');
    item.element.style.setProperty('width', 'calc(100% - 20px)', 'important');
    
    // Apply text formatting before setting height constraints
    this.ensureProperTextFormatting(item.element);
    
    // Force layout after formatting
    void item.element.offsetHeight;
    
    // Now set height constraints AFTER formatting is applied
    item.element.style.setProperty('height', `${contentHeight}px`, 'important');
    item.element.style.setProperty('min-height', `${contentHeight}px`, 'important');
    item.element.style.setProperty('overflow', 'hidden', 'important');
    
    // Mouse event handlers are attached at creation for originals, and at cloning for clones
    
    // Update item data
    item.top = topPosition;
    item.height = contentHeight;
  }
  

  positionItems() {
    // Use the new calculateItemPositions method which handles proper clone positioning
    const { minTop, maxTop } = this.calculateItemPositions(true);
    
    // Set content holder height to span from most negative position to highest position
    // Add the absolute minTop to maxTop to get total height, then set transform to show negative content
    const totalHeight = maxTop - minTop;
    this.contentHolder.style.height = `${totalHeight}px`;
    // Temporarily disable transform to test positioning
    // this.contentHolder.style.transform = `translateY(${Math.abs(minTop)}px)`;
    
    // Apply additional styling for proper measurement and layout
    this.allItems.forEach(item => {
      // Set explicit width and positioning with proper gaps
      item.element.style.setProperty('position', 'absolute', 'important');
      item.element.style.setProperty('box-sizing', 'border-box', 'important');
      
      // Use left and right positioning to create gaps - force with setProperty
      item.element.style.setProperty('left', '10px', 'important');
      item.element.style.setProperty('width', 'calc(100% - 20px)', 'important');
      item.element.style.setProperty('min-width', '0', 'important'); // Allow compression below natural min-width
      item.element.style.setProperty('max-width', 'none', 'important'); // Remove any max-width constraints
      
      // Set controlled margins only - let color palette system handle padding
      item.element.style.setProperty('margin', '0', 'important');
      // Don't override padding/border - let the color palette system handle it
      
      // Fix the skills display
      const skillsList = item.element.querySelector('.bulleted-job-skills-ul');
      if (skillsList) {
        skillsList.style.setProperty('display', 'flex', 'important');
        skillsList.style.setProperty('flex-wrap', 'wrap', 'important');
        skillsList.style.setProperty('gap', '0.1rem', 'important');
        skillsList.style.setProperty('list-style', 'none', 'important');
        skillsList.style.setProperty('padding', '0', 'important');
        skillsList.style.setProperty('margin', '0', 'important');
        skillsList.style.setProperty('line-height', '1.2', 'important');
        skillsList.style.setProperty('width', '100%', 'important');
        
        // Fix each skill item
        const skillItems = skillsList.querySelectorAll('.bulleted-job-skills-li');
        skillItems.forEach(skill => {
          skill.style.display = 'inline-block';
          skill.style.position = 'relative';
          skill.style.padding = '0.05rem 0.25rem 0.05rem 0';
          skill.style.whiteSpace = 'nowrap';
          skill.style.fontSize = '0.85em';
          skill.style.lineHeight = '1.2';
          skill.style.marginRight = '0.1rem';
        });
      }
      
      // Make details div proper
      const detailsDiv = item.element.querySelector('.biz-resume-details-div');
      if (detailsDiv) {
        detailsDiv.style.height = 'auto';
        detailsDiv.style.overflow = 'visible';
        // Override both margin and padding to ensure no spacing interference
        detailsDiv.style.margin = '0';
        detailsDiv.style.padding = '0';
        detailsDiv.style.width = '100%';
        detailsDiv.style.minWidth = '0'; // Allow compression
        detailsDiv.style.wordWrap = 'break-word';
        detailsDiv.style.overflowWrap = 'break-word';
        detailsDiv.style.wordBreak = 'break-word';

        // Ensure headers are compact but readable
        const headers = detailsDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headers.forEach(header => {
          header.style.marginBottom = '0';
          header.style.marginTop = '0';
          header.style.minWidth = '0'; // Allow header compression
          header.style.wordWrap = 'break-word';
        });
      }
      
      // Reset all margins since we're using absolute positioning with calculated spacing
      item.element.style.margin = '0';
      item.element.style.marginTop = '0';
      item.element.style.marginBottom = '0';
      item.element.style.marginLeft = '0';
      item.element.style.marginRight = '0';
      item.element.style.padding = '0';
      item.element.style.paddingTop = '0';
      item.element.style.paddingBottom = '0';
      item.element.style.paddingLeft = '0';
      item.element.style.paddingRight = '0';
      
      // Remove only margins that could interfere with positioning
      // Keep padding for visual styling but ensure no external spacing
      const children = item.element.querySelectorAll('*');
      children.forEach(child => {
        // Only remove margin, not padding (padding is internal to elements)
        child.style.margin = '0';
        child.style.marginTop = '0';
        child.style.marginBottom = '0';
        child.style.marginLeft = '0';
        child.style.marginRight = '0';
      });
      
      // Append to container if needed
      if (!this.contentHolder.contains(item.element)) {
        this.contentHolder.appendChild(item.element);
      }
    });
    
    // Ensure container has no spacing that could interfere
    this.contentHolder.style.setProperty('padding', '0', 'important');
    this.contentHolder.style.setProperty('margin', '0', 'important');
    this.contentHolder.style.setProperty('position', 'relative', 'important');
    
    // Force layout calculation
    void this.contentHolder.offsetHeight;
    
    // Positioning already done by calculateItemPositions at top of method
    
    // window.CONSOLE_LOG_IGNORE(`[DEBUG] positionItems: Final currentTop=${currentTop}`);
    
    // Debug: Check actual positioning after layout
    setTimeout(() => {
      // window.CONSOLE_LOG_IGNORE(`[DEBUG] Post-layout positioning check:`);
      this.allItems.slice(0, 3).forEach((item, index) => {
        const rect = item.element.getBoundingClientRect();
        // window.CONSOLE_LOG_IGNORE(`  Item ${index}: top=${rect.top}, height=${rect.height}, computed top=${item.top}`);
      });
    }, 100);
    
    // Calculate the total height based on original items only (not clones)
    const originalItems = this.allItems.filter(item => item.type === 'original');
    const totalOriginalHeight = originalItems.reduce((sum, item) => sum + item.height, 0);
    const averageHeight = totalOriginalHeight / originalItems.length;
    const numDivs = originalItems.length;
    const gap = this.options.itemSpacing;
    const buffer = 6; // Buffer for smooth scrolling
    
    const calculatedHeight = (buffer + numDivs + gap) * averageHeight;
    const actualHeight = Math.max(calculatedHeight, totalOriginalHeight + 1000); // Ensure minimum height for scrolling
    
    // window.CONSOLE_LOG_IGNORE(`[DEBUG] positionItems: Height calculation:`);
    // window.CONSOLE_LOG_IGNORE(`  - Original items: ${originalItems.length}`);
    // window.CONSOLE_LOG_IGNORE(`  - Total original height: ${totalOriginalHeight}`);
    // window.CONSOLE_LOG_IGNORE(`  - Average height: ${averageHeight}`);
    // window.CONSOLE_LOG_IGNORE(`  - Calculated height: ${calculatedHeight}`);
    // window.CONSOLE_LOG_IGNORE(`  - Actual height: ${actualHeight}`);
    // window.CONSOLE_LOG_IGNORE(`  - Current positioning height: ${currentTop}`);
    
    // Set the total height of the content holder for proper scrolling
    this.contentHolder.style.height = `${actualHeight}px`;
    
    // Don't automatically scroll to index 0 - let the caller decide where to scroll
    // this.scrollToIndex(0, false);
  }

  scrollToIndex(originalIndex, animate = true, _retry = false) {
    const cloneCount = Math.min(this.options.cloneCount, this.originalItems.length);
    const targetItemIndex = cloneCount + originalIndex; // Account for tail clones
    
    // console.log(`[DEBUG] scrollToIndex: originalIndex=${originalIndex}, cloneCount=${cloneCount}, targetItemIndex=${targetItemIndex}`);
    // console.log(`[DEBUG] scrollToIndex: allItems.length=${this.allItems.length}`);
    
    // Disable seamless transitions during targeted scrolling
    this._isTargetScrolling = true;
    
    // Debug: Check what items are at each position
    // window.CONSOLE_LOG_IGNORE(`[DEBUG] InfiniteScroller.scrollToIndex: Item mapping (first 10 items):`);
    // for (let i = 0; i < Math.min(10, this.allItems.length); i++) {
    //   const item = this.allItems[i];
    //   if (item && item.element) {
    //     const jobNumber = item.element.getAttribute('data-job-number');
    //     // window.CONSOLE_LOG_IGNORE(`  Item ${i} -> Job ${jobNumber} (${item.element.tagName})`);
    //   } else {
    //     // window.CONSOLE_LOG_IGNORE(`  Item ${i} -> No element or job number`);
    //   }
    // }
    
    // Debug: Check what job numbers are in the originalItems array
    // window.CONSOLE_LOG_IGNORE(`[DEBUG] InfiniteScroller.scrollToIndex: Original items job numbers (first 10):`);
    // for (let i = 0; i < Math.min(10, this.originalItems.length); i++) {
    //   const item = this.originalItems[i];
    //   if (item) {
    //     const jobNumber = item.getAttribute('data-job-number');
    //     // window.CONSOLE_LOG_IGNORE(`  Original item ${i} -> Job ${jobNumber}`);
    //   }
    // }
    
    // Debug: Check what job number we expect at the target index
    // if (originalIndex < this.originalItems.length) {
    //   const expectedItem = this.originalItems[originalIndex];
    //   if (expectedItem) {
    //     const expectedJobNumber = expectedItem.getAttribute('data-job-number');
    //     // window.CONSOLE_LOG_IGNORE(`[DEBUG] InfiniteScroller.scrollToIndex: Expected job number at index ${originalIndex}: ${expectedJobNumber}`);
    //   }
    // }
    
    if (targetItemIndex >= this.allItems.length) {
      // console.log(`[DEBUG] scrollToIndex: Invalid target index ${targetItemIndex}, max is ${this.allItems.length - 1}`);
      return;
    }
    
    const targetItem = this.allItems[targetItemIndex];
    if (!targetItem) {
      // console.log(`[DEBUG] scrollToIndex: targetItem is null for index ${targetItemIndex}`);
      return;
    }
    
    // const actualJobNumber = targetItem.element.getAttribute('data-job-number');
    // console.log(`[DEBUG] scrollToIndex: targetItem has jobNumber=${actualJobNumber}, type=${targetItem.type}`);
    
    // Debug: Check what job number the target item represents
    // if (targetItem.element) {
    //   const targetJobNumber = targetItem.element.getAttribute('data-job-number');
    //   // window.CONSOLE_LOG_IGNORE(`[DEBUG] InfiniteScroller.scrollToIndex: Target item job number: ${targetJobNumber}`);
    // }
    
    // Find the header elements within the resume div and calculate scroll position
    const detailsDiv = targetItem.element.querySelector('.biz-resume-details-div');
    let headerOffset = 0;
    
    if (detailsDiv) {
      // Find the first header element (employer, role, dates, or z-value)
      const firstHeader = detailsDiv.querySelector('.biz-details-employer, .biz-details-role, .biz-details-dates, .biz-details-z-value');
      if (firstHeader) {
        // Calculate the offset from the top of the resume div to the first header
        const resumeDivRect = targetItem.element.getBoundingClientRect();
        const headerRect = firstHeader.getBoundingClientRect();
        headerOffset = headerRect.top - resumeDivRect.top;
      }
    }
    
    // Calculate scroll position to ensure the target item is visible without clone overlap
    const topMargin = 10; // Small margin from the top for optimal positioning
    const tailCloneHeight = this.getTotalCloneHeight('tail');
    
    let targetScrollTop;
    
    // Account for negative tail clone positioning
    const tailCloneOffset = Math.abs(this._minTop || 0);
    
    if (targetItem.type === 'original') {
      // For original items, ensure we show them clearly without clone interference
      if (originalIndex === 0) {
        // Special case for first original item: scroll to show original content
        // Add tail clone offset to account for negative positioning
        targetScrollTop = Math.max(0, targetItem.top + tailCloneOffset - topMargin);
      } else {
        // For other original items, use normal positioning with offset
        const idealScrollTop = Math.max(0, targetItem.top + headerOffset + tailCloneOffset - topMargin);
        targetScrollTop = idealScrollTop;
      }
    } else {
      // For clones, use the standard calculation with offset
      targetScrollTop = Math.max(0, targetItem.top + headerOffset + tailCloneOffset - topMargin);
    }
    
    // if (originalIndex >= this.originalItems.length - 3) {
    //   console.log(`[DEBUG] scrollToIndex: LAST ITEMS - originalIndex=${originalIndex}, itemType=${targetItem.type}, targetItem.top=${targetItem.top}, final targetScrollTop=${targetScrollTop}, _minTop=${this._minTop}, _maxTop=${this._maxTop}`);
    // }
    
    // Positioning calculations completed
    
    // Always use smooth scrolling behavior
    this.scrollport.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });
    
    // Re-enable seamless transitions after scroll completes
    setTimeout(() => {
      this._isTargetScrolling = false;
    }, 2000); // Allow more time for smooth scroll to complete and prevent interference
    
    // Log the actual scroll position after setting it
    // setTimeout(() => {
    //   // window.CONSOLE_LOG_IGNORE(`[DEBUG] InfiniteScroller.scrollToIndex: Actual scrollTop after setting: ${this.scrollport.scrollTop}`);
    //   // window.CONSOLE_LOG_IGNORE(`[DEBUG] InfiniteScroller.scrollToIndex: Container height: ${this.scrollport.offsetHeight}`);
    //   // window.CONSOLE_LOG_IGNORE(`[DEBUG] InfiniteScroller.scrollToIndex: Content height: ${this.scrollport.scrollHeight}`);
    //   // window.CONSOLE_LOG_IGNORE(`[DEBUG] InfiniteScroller.scrollToIndex: Scrollport element:`, this.scrollport);
    //   // window.CONSOLE_LOG_IGNORE(`[DEBUG] InfiniteScroller.scrollToIndex: Scrollport parent:`, this.scrollport.parentElement);
    //   // window.CONSOLE_LOG_IGNORE(`[DEBUG] InfiniteScroller.scrollToIndex: Window height: ${window.innerHeight}`);
    //   // window.CONSOLE_LOG_IGNORE(`[DEBUG] InfiniteScroller.scrollToIndex: Document height: ${document.documentElement.clientHeight}`);
    // }, 100);

    this.currentIndex = originalIndex;
    const jumped = this.checkForSeamlessTransition();
    // Seamless transition check completed
    if (jumped && !_retry) {
      // Retrying scroll due to seamless transition
      setTimeout(() => {
        this.scrollToIndex(originalIndex, animate, true);
      }, 0);
    }

    if (this.options.onItemChange) {
      this.options.onItemChange(originalIndex, this.originalItems[originalIndex]);
    }
  }

  smoothScrollTo(targetScrollTop) {
    const startScrollTop = this.scrollport.scrollTop;
    const distance = targetScrollTop - startScrollTop;
    const duration = this.options.transitionDuration;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      this.scrollport.scrollTop = startScrollTop + (distance * easeOut);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  checkForSeamlessTransition() {
    // Skip seamless transitions during targeted scrolling
    if (this._isTargetScrolling) {
      // Skipping seamless transitions during targeted scrolling
      return false;
    }
    
    // Prevent rapid transitions (cooldown period)
    const now = Date.now();
    if (now - this._lastTransitionTime < 1000) {
      return false; // Skip if less than 1 second since last transition
    }
    
    const scrollTop = this.scrollport.scrollTop;
    const cloneCount = Math.min(this.options.cloneCount, this.originalItems.length);
    const containerHeight = this.scrollport.offsetHeight;

    // Calculate boundaries accounting for tail clone offset
    const tailCloneOffset = Math.abs(this._minTop || 0);
    const originalItemsHeight = this.getTotalOriginalItemsHeight();
    const headCloneHeight = this.getTotalCloneHeight('head');
    
    // Adjusted boundaries to account for the offset
    const originalContentStart = tailCloneOffset; // Original content starts after tail clone offset
    const originalContentEnd = originalContentStart + originalItemsHeight;
    const headCloneStart = originalContentEnd;
    const headCloneEnd = headCloneStart + headCloneHeight;
    
    // Calculate boundaries for smoother transitions
    const tailBoundary = originalContentStart - containerHeight * 0.7; // Allow some tail clone viewing
    const headBoundary = originalContentEnd + containerHeight * 0.5; // Allow some head clone viewing
    
    // If we're in the tail clone area, jump to the end of original items
    if (scrollTop < tailBoundary) {
      const jumpToPosition = originalContentEnd - containerHeight;
      this.scrollport.scrollTop = jumpToPosition;
      this._lastTransitionTime = now; // Record transition time
      
      // Trigger a re-selection to ensure CSS classes are reapplied after transition
      setTimeout(() => {
        const selectedJobNumber = selectionManager.getSelectedJobNumber();
        if (selectedJobNumber !== null) {
          // This will trigger selectionChanged event and reapply CSS classes
          selectionManager.selectJobNumber(selectedJobNumber, 'InfiniteScroller.seamlessTransition');
        }
      }, 50);
      
      return true; // Jumped
    }
    // If we're in the head clone area, jump seamlessly to the beginning
    else if (scrollTop > headBoundary) {
      // Calculate the seamless position: where rDiv 0 appears in the same visual position
      // Find how far into the head clone area we are
      const distanceIntoHeadClones = scrollTop - originalContentEnd;
      // Position rDiv 0 to appear at the same relative position
      const jumpToPosition = originalContentStart - distanceIntoHeadClones;
      this.scrollport.scrollTop = Math.max(originalContentStart, jumpToPosition);
      this._lastTransitionTime = now; // Record transition time
      
      // Trigger a re-selection to ensure CSS classes are reapplied after transition
      setTimeout(() => {
        const selectedJobNumber = selectionManager.getSelectedJobNumber();
        if (selectedJobNumber !== null) {
          // This will trigger selectionChanged event and reapply CSS classes
          selectionManager.selectJobNumber(selectedJobNumber, 'InfiniteScroller.seamlessTransition');
        }
      }, 50);
      
      return true; // Jumped
    }
    
    return false; // No jump
  }

  getTotalCloneHeight(type) {
    const height = this.allItems
      .filter(item => item.type === `${type}-clone`)
      .reduce((total, item) => total + item.height, 0);
    
    // window.CONSOLE_LOG_IGNORE(`[DEBUG] getTotalCloneHeight(${type}): ${height}px`);
    return height;
  }

  getTotalOriginalItemsHeight() {
    return this.allItems
      .filter(item => item.type === 'original')
      .reduce((total, item) => total + item.height, 0);
  }

  setupResizeObserver() {
    // Create a ResizeObserver to watch for container size changes
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Only trigger if the content size changed (not just scroll position)
        if (entry.contentRect.width !== this.lastContentWidth || 
            entry.contentRect.height !== this.lastContentHeight) {
          this.lastContentWidth = entry.contentRect.width;
          this.lastContentHeight = entry.contentRect.height;
          this.handleResize();
        }
      }
    });
    
    // Start observing both the content holder and the scrollport for size changes
    this.resizeObserver.observe(this.contentHolder);
    this.resizeObserver.observe(this.scrollport);
  }

  handleContainerResize() {
    // Batch DOM reads
    let currentScrollTop = 0;
    let needsUpdate = false;
    
    if (this.allItems && this.allItems.length > 0) {
      currentScrollTop = this.scrollport.scrollTop;
      needsUpdate = true;
    }
  }

  reapplyColorPalettes() {
    // This is now handled automatically by the useColorPalette composable
  }

  bindEvents() {
    // Mouse events
    this.scrollport.addEventListener('mousedown', this.handleStart.bind(this));
    document.addEventListener('mousemove', this.handleMove.bind(this));
    document.addEventListener('mouseup', this.handleEnd.bind(this));

    // Touch events
    if (this.options.enableTouch) {
      this.scrollport.addEventListener('touchstart', this.handleStart.bind(this), { passive: true });
      document.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
      document.addEventListener('touchend', this.handleEnd.bind(this), { passive: true });
    }

    // Mouse wheel events
    this.scrollport.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

    // Scroll events for seamless transitions
    this.scrollport.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });

    // Resize observer to handle container width changes
    this.setupResizeObserver();
  }

  handleStart(e) {
    // For non-touch events, we can still prevent default
    if (!e.type.includes('touch')) {
        e.preventDefault();
    }
    
    this.isDragging = true;
    this.startY = this.getEventY(e);
    this.startScrollTop = this.scrollport.scrollTop;
    this.lastY = this.startY;
    this.velocity = 0;
    this.scrollport.style.cursor = 'ns-resize';
    
    // Cancel any ongoing momentum
    if (this.momentumAnimationId) {
        cancelAnimationFrame(this.momentumAnimationId);
        this.momentumAnimationId = null;
    }
  }

  handleMove(e) {
    if (!this.isDragging) return;
    
    e.preventDefault();
    const currentY = this.getEventY(e);
    const deltaY = currentY - this.lastY;
    
    // Calculate velocity for momentum
    this.velocity = deltaY * 0.8 + this.velocity * 0.2;
    
    // Apply scroll
    this.scrollport.scrollTop -= deltaY;
    this.lastY = currentY;
  }

  handleEnd(e) {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.scrollport.style.cursor = 'ns-resize';
    
    // Apply momentum if velocity is significant
    if (Math.abs(this.velocity) > 1) {
      this.applyMomentum();
    }
  }

  applyMomentum() {
    const friction = 0.95;
    const minVelocity = 0.5;
    
    const animate = () => {
      this.velocity *= friction;
      
      if (Math.abs(this.velocity) < minVelocity) {
        this.momentumAnimationId = null;
        return;
      }
      
      this.scrollport.scrollTop -= this.velocity;
      this.momentumAnimationId = requestAnimationFrame(animate);
    };
    
    animate();
  }

  handleWheel(e) {
    e.preventDefault(); // Prevent default scroll behavior
    
    // Apply wheel delta to container scroll
    const delta = e.deltaY;
    this.scrollport.scrollTop += delta;
    
    // Trigger seamless transition check after a brief delay
    clearTimeout(this.wheelTimeout);
    this.wheelTimeout = setTimeout(() => {
      this.checkForSeamlessTransition();
    }, 100);
  }

  handleScroll() {
    if (!this.isDragging && !this._isTargetScrolling) {
      // Debounce the seamless transition check and only when not doing targeted scrolling
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        this.checkForSeamlessTransition();
        // Mouse events should handle styling, but ensure visible selected items have correct classes
        this.ensureVisibleItemStyling();
      }, 100); // Increased debounce to reduce transition frequency
    }
  }
  
  // Ensure selected styling is applied to visible selected items during scroll
  ensureVisibleItemStyling() {
    const selectedJobNumber = selectionManager.getSelectedJobNumber();
    if (selectedJobNumber === null) return;
    
    const scrollTop = this.scrollport.scrollTop;
    const containerHeight = this.scrollport.offsetHeight;
    const visibleTop = scrollTop;
    const visibleBottom = scrollTop + containerHeight;
    
    // Find all items (originals and clones) that match the selected job number
    this.allItems.forEach(item => {
      const jobNumber = parseInt(item.element.getAttribute('data-job-number'));
      if (jobNumber === selectedJobNumber) {
        const itemTop = item.top + Math.abs(this._minTop || 0); // Account for tail clone offset
        const itemBottom = itemTop + item.height;
        
        // If this selected item is visible, ensure it has the selected class
        if (itemBottom > visibleTop && itemTop < visibleBottom) {
          if (!item.element.classList.contains('selected')) {
            item.element.classList.add('selected');
            item.element.classList.remove('hovered');
            console.log(`[DEBUG] Applied selected class to visible jobNumber=${jobNumber}, type=${item.type}`);
          }
        }
      }
    });
  }

  getEventY(e) {
    return e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
  }

  // Public methods for external control
  goToNext() {
    const nextIndex = (this.currentIndex + 1) % this.originalItems.length;
    this.scrollToIndex(nextIndex);
    return this.originalItems[nextIndex];
  }

  goToPrevious() {
    const prevIndex = (this.currentIndex - 1 + this.originalItems.length) % this.originalItems.length;
    this.scrollToIndex(prevIndex);
    return this.originalItems[prevIndex];
  }

  goToFirst() {
    this.scrollToIndex(0);
    return this.originalItems[0];
  }

  goToLast() {
    this.scrollToIndex(this.originalItems.length - 1);
    return this.originalItems[this.originalItems.length - 1];
  }

  goTo(index, smooth = true) {
    if (this.originalItems.length === 0) return;
    
    if (index < 0 || index >= this.originalItems.length) {
      // window.CONSOLE_LOG_IGNORE(`InfiniteScrollingContainer: Invalid index: ${index}`);
      return;
    }
    

    
    // Find the item in allItems
    const item = this.allItems.find(item => 
      item.type === 'original' && item.originalIndex === index
    );
    
    if (!item || !item.element) {
      // window.CONSOLE_LOG_IGNORE(`InfiniteScrollingContainer: Item not found for index: ${index}`);
      return;
    }
    
    // Calculate the scroll position
    const scrollTop = item.top;
    
    // Always use smooth scrolling
    this.scrollport.scrollTo({
      top: scrollTop,
      behavior: 'smooth'
    });
    
    // Update the current index
    this.currentIndex = index;
    this.checkForSeamlessTransition();
    
    // Call the onItemChange callback
    if (this.options.onItemChange) {
      this.options.onItemChange(index, this.originalItems[index]);
    }
  }

  getCurrentIndex() {
    return this.currentIndex;
  }

  getCurrentItem() {
    if (this.originalItems.length === 0) return null;
    return this.allItems.find(item => item.type === 'original' && item.originalIndex === this.currentIndex);
  }

  getItemAtIndex(index) {
    if (index < 0 || index >= this.originalItems.length) {
      return null;
    }
    return this.originalItems[index];
  }

  destroy() {
    // window.CONSOLE_LOG_IGNORE('[DEBUG] InfiniteScrollingContainer: Destroying singleton instance');
    
    // Remove event listeners
    this.scrollport.removeEventListener('mousedown', this.handleStart.bind(this));
    document.removeEventListener('mousemove', this.handleMove.bind(this));
    document.removeEventListener('mouseup', this.handleEnd.bind(this));

    if (this.options.enableTouch) {
      this.scrollport.removeEventListener('touchstart', this.handleStart.bind(this));
      document.removeEventListener('touchmove', this.handleMove.bind(this));
      document.removeEventListener('touchend', this.handleEnd.bind(this));
    }

    this.scrollport.removeEventListener('wheel', this.handleWheel.bind(this));
    this.scrollport.removeEventListener('scroll', this.handleScroll.bind(this));

    // Clean up resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Clear timeouts
    if (this.resizeTimeoutId) {
      clearTimeout(this.resizeTimeoutId);
    }

    // Cancel animations
    if (this.momentumAnimationId) {
      cancelAnimationFrame(this.momentumAnimationId);
    }

    // Clear container
    this.contentHolder.innerHTML = '';

    // Clear the singleton instance
    InfiniteScrollingContainer.instance = null;

    // window.CONSOLE_LOG_IGNORE('InfiniteScrollingContainer destroyed');
  }

  // Static method to reset the singleton instance
  static reset() {
    // window.CONSOLE_LOG_IGNORE('[DEBUG] InfiniteScrollingContainer: Resetting singleton instance');
    if (InfiniteScrollingContainer.instance) {
      InfiniteScrollingContainer.instance.destroy();
      InfiniteScrollingContainer.instance._isInitialized = false;
    }
    InfiniteScrollingContainer.instance = null;
  }

  // Static method to get the current instance
  static getInstance() {
    return InfiniteScrollingContainer.instance;
  }

  // Method to check if the instance is initialized
  isInitialized() {
    return this._isInitialized;
  }

  addDirectClickHandlers() {
    this.allItems.forEach(item => {
      // Ensure clones don't intercept mouse events - let them pass through to originals
      if (item.type === 'tail-clone' || item.type === 'head-clone') {
        item.element.style.pointerEvents = 'none';
      }
      // Only add click handlers to original items
      if (item.type === 'original') {
        item.element.addEventListener('click', () => {
          // THIS IS INTENTIONALLY LEFT BLANK TO PREVENT A DEAD IMPORT
        });
      }
    });
  }

  // Public method to manually trigger a click on a bizResumeDiv
  triggerBizResumeDivClick(index) {
    // THIS IS INTENTIONALLY LEFT BLANK TO PREVENT A DEAD IMPORT
    return false;
  }

  /**
   * Scroll to a specific item by index with improved positioning
   * @param {number} index - The index of the item to scroll to
   * @param {string} caller - The caller's name for logging purposes
   * @param {boolean} force - Whether to force the scroll without animation
   * @returns {boolean} - Whether the scroll was successful
   */
  scrollToItem(index, caller = '', force = false) {
    const item = this.allItems[index];
    
    if (!item || !item.element) {
      // window.CONSOLE_LOG_IGNORE(`InfiniteScrollingContainer: Item not found for index: ${index}`);
      return false;
    }
    
    // Find the header elements within the resume div
    const detailsDiv = item.element.querySelector('.biz-resume-details-div');
    let headerOffset = 0;
    
    if (detailsDiv) {
      // Find the first header element (employer, role, dates, or z-value)
      const firstHeader = detailsDiv.querySelector('.biz-details-employer, .biz-details-role, .biz-details-dates, .biz-details-z-value');
      if (firstHeader) {
        // Calculate the offset from the top of the resume div to the first header
        const resumeDivRect = item.element.getBoundingClientRect();
        const headerRect = firstHeader.getBoundingClientRect();
        headerOffset = headerRect.top - resumeDivRect.top;
      }
    }
    
    // Calculate scroll position to ensure the header is visible at the top of the container
    const containerHeight = this.scrollport.offsetHeight;
    const itemTop = item.top;
    const itemHeight = item.height;
    
    // Scroll to position the header at the top of the container with a larger margin
    // This ensures the target job is more prominently visible and other jobs above it are less visible
    const topMargin = 50; // Larger margin from the top to make target job more prominent
    const targetScrollTop = Math.max(0, itemTop + headerOffset - topMargin);
    
    // window.CONSOLE_LOG_IGNORE(`[DEBUG] InfiniteScroller.scrollToItem: ${caller} - index=${index}, itemTop=${itemTop}, headerOffset=${headerOffset}, targetScrollTop=${targetScrollTop}, force=${force}`);

    // Always use smooth scrolling
    this.scrollport.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });
    
    // Update the current index after the scroll starts
    this.currentIndex = index;
    this.checkForSeamlessTransition();
    
    // Call the onItemChange callback
    if (this.options.onItemChange) {
      this.options.onItemChange(index, this.originalItems[index]);
    }
    
    return true;
  }

  /**
   * Scroll to a specific bizResumeDiv element
   * @param {HTMLElement} bizResumeDiv - The bizResumeDiv element to scroll to
   * @param {boolean} animate - Whether to animate the scroll
   * @returns {boolean} - Whether the scroll was successful
   */
  scrollToBizResumeDiv(bizResumeDiv, animate = true) {
    const index = this.originalItems.findIndex(item => item === bizResumeDiv);
    if (index !== -1) {
      // Use scrollToIndex instead of scrollToItem to properly handle the cloned structure
      this.scrollToIndex(index, animate);
      return true;
    }
    return false;
  }

  /**
   * Scroll to a specific job number
   * @param {number} jobNumber - The job number to scroll to
   * @param {boolean} animate - Whether to animate the scroll
   * @returns {boolean} - Whether the scroll was successful
   */
  scrollToJobNumber(jobNumber, animate = true) {
    // console.log(`[DEBUG] InfiniteScroller.scrollToJobNumber: jobNumber=${jobNumber}, animate=${animate}`);
    
    // Find the item with the specified job number
    const index = this.originalItems.findIndex(item => {
      const itemJobNumber = item.getAttribute('data-job-number');
      return parseInt(itemJobNumber) === jobNumber;
    });
    
    if (index === -1) {
      // window.CONSOLE_LOG_IGNORE(`[DEBUG] InfiniteScroller.scrollToJobNumber: Job number ${jobNumber} not found in originalItems`);
      return false;
    }
    
    // console.log(`[DEBUG] InfiniteScroller.scrollToJobNumber: Found job ${jobNumber} at index ${index}`);
    
    // Use scrollToIndex instead of scrollToItem to properly handle the cloned structure
    this.scrollToIndex(index, animate);
    return true;
  }

  /**
   * Find the index of a bizResumeDiv element
   * @param {HTMLElement} bizResumeDiv - The bizResumeDiv element to find
   * @returns {number} - The index of the bizResumeDiv, or -1 if not found
   */
  findBizResumeDivIndex(bizResumeDiv) {
    if (!bizResumeDiv) return -1;
    
    // Get the job index from the bizResumeDiv
            const jobNumber = parseInt(bizResumeDiv.getAttribute('data-job-number'), 10);
    if (isNaN(jobNumber)) return -1;
    
    // Find the item in allItems
    const item = this.allItems.find(item => 
      item.type === 'original' && 
      item.element && 
              parseInt(item.element.getAttribute('data-job-number'), 10) === jobNumber
    );
    
    return item ? item.originalIndex : -1;
  }

  // Method to recalculate heights when content changes
  recalculateHeights() {
    // window.CONSOLE_LOG_IGNORE('[DEBUG] InfiniteScroller.recalculateHeights: Recalculating all item heights');
    
    // Reset heights for measurement
    this.allItems.forEach(item => {
      item.element.style.height = 'auto';
      item.element.style.minHeight = 'auto';
    });
    
    // Force layout calculation
    void this.contentHolder.offsetHeight;
    
    // Use centralized positioning logic
    const { minTop, maxTop } = this.calculateItemPositions(true);
    
    // Set content holder height to span full range including negative positions
    const totalHeight = maxTop - minTop;
    this.contentHolder.style.height = `${totalHeight}px`;
    // Temporarily disable transform to test positioning
    // this.contentHolder.style.transform = `translateY(${Math.abs(minTop)}px)`;
    
    // window.CONSOLE_LOG_IGNORE(`[DEBUG] InfiniteScroller.recalculateHeights: Recalculation complete, total height: ${currentTop}px`);
  }

  // Method to recalculate heights after palette application
  recalculateHeightsAfterPalette() {
    // Wait a bit for palette application to complete
    setTimeout(() => {
      this.recalculateHeights();
    }, 100);
  }

  // Method to update a specific item's height and recalculate positions
  updateItemHeight(originalIndex) {
    const cloneCount = Math.min(this.options.cloneCount, this.originalItems.length);
    const itemIndex = cloneCount + originalIndex; // Account for tail clones
    
    if (itemIndex >= this.allItems.length) {
      return;
    }
    
    const item = this.allItems[itemIndex];
    
    // Temporarily set height to auto to measure actual content
    item.element.style.height = 'auto';
    item.element.style.minHeight = 'auto';
    
    // Force layout calculation
    void item.element.offsetHeight;
    
    // Measure the actual content height
    const scrollHeight = item.element.scrollHeight;
    const offsetHeight = item.element.offsetHeight;
    const newHeight = Math.min(scrollHeight, offsetHeight || scrollHeight);
    
    // Set the new height
    item.element.style.height = `${newHeight}px`;
    item.element.style.minHeight = `${newHeight}px`;
    
    // Update item data
    item.height = newHeight;
    
    // Recalculate positions for all items after this one
    this.recalculatePositionsFromIndex(itemIndex);
  }

  // Helper method to recalculate positions starting from a specific index
  recalculatePositionsFromIndex(startIndex) {
    // Use centralized positioning logic, but only reposition from startIndex onwards
    const spacing = this.options.itemSpacing;
    let currentTop = startIndex > 0 ? this.allItems[startIndex - 1].top + this.allItems[startIndex - 1].height + spacing : 0;
    
    for (let i = startIndex; i < this.allItems.length; i++) {
      const item = this.allItems[i];
      
      // Update position using consistent logic
      item.element.style.top = `${currentTop}px`;
      item.top = currentTop;
      
      // Calculate next position: current item bottom + spacing gap
      currentTop += item.height + spacing;
    }
    
    // Set content holder height to span full range including negative positions
    const totalHeight = currentTop - (this._minTop || 0);
    this.contentHolder.style.height = `${totalHeight}px`;
    this.contentHolder.style.transform = `translateY(${Math.abs(this._minTop || 0)}px)`;
  }



  // Method to trigger debounced resize handling
  handleResize() {
    // console.log('[DEBUG] handleResize: Container size changed, triggering recalculation');
    
    // Clear any existing timeout
    if (this.resizeTimeoutId) {
      clearTimeout(this.resizeTimeoutId);
    }
    
    // Set a new timeout to recalculate after resize stops
    this.resizeTimeoutId = setTimeout(() => {
      // window.CONSOLE_LOG_IGNORE('[DEBUG] InfiniteScroller.handleResize: Recalculating heights and positions');
      
      // CAPTURE CURRENT VISIBLE JOB BEFORE RESIZE
      const visibleJobBeforeResize = this.getCurrentlyVisibleJob();
      // window.CONSOLE_LOG_IGNORE(`[DEBUG] RESIZE: Job visible before resize: ${visibleJobBeforeResize}`);
      
      // First, reset all items to auto height to measure their natural content height
      this.allItems.forEach(item => {
        if (item.element) {
          item.element.style.height = 'auto';
          item.element.style.minHeight = 'auto';
        }
      });
      
      // Force layout calculation
      void this.contentHolder.offsetHeight;
      
      // Now recalculate heights and positions using centralized logic
      // console.log('[DEBUG] handleResize: About to call calculateItemPositions from resize handler');
      const { minTop, maxTop } = this.calculateItemPositions(true);
      const totalHeight = maxTop - minTop;
      this.contentHolder.style.height = `${totalHeight}px`;
      this.contentHolder.style.transform = `translateY(${Math.abs(minTop)}px)`;
      
      // VERIFY WHAT JOB IS VISIBLE AFTER POSITIONING
      const visibleJobAfterPositioning = this.getCurrentlyVisibleJob();
      // window.CONSOLE_LOG_IGNORE(`[DEBUG] RESIZE: Job visible after positioning: ${visibleJobAfterPositioning}`);
      
      // If the visible job changed, try to restore the original job
      if (visibleJobBeforeResize && visibleJobAfterPositioning !== visibleJobBeforeResize) {
        // window.CONSOLE_LOG_IGNORE(`[DEBUG] RESIZE: Visible job changed from ${visibleJobBeforeResize} to ${visibleJobAfterPositioning}! Attempting to restore...`);
        
        // Try to scroll back to the original job
        const success = this.scrollToJobNumber(visibleJobBeforeResize, false);
        if (success) {
          // window.CONSOLE_LOG_IGNORE(`[DEBUG] RESIZE: Successfully restored visibility to job ${visibleJobBeforeResize}`);
        } else {
          // window.CONSOLE_LOG_IGNORE(`[DEBUG] RESIZE: Failed to restore visibility to job ${visibleJobBeforeResize}`);
        }
        
        // Verify the final result
        setTimeout(() => {
          const finalVisibleJob = this.getCurrentlyVisibleJob();
          // window.CONSOLE_LOG_IGNORE(`[DEBUG] RESIZE: Final visible job after restoration attempt: ${finalVisibleJob}`);
        }, 50);
      } else {
        // window.CONSOLE_LOG_IGNORE(`[DEBUG] RESIZE: Job visibility maintained correctly`);
      }
      
      this.resizeTimeoutId = null;
    }, 300); // Wait 300ms after last resize event
  }

  // Helper method to determine which job is currently most visible in viewport
  getCurrentlyVisibleJob() {
    const viewportTop = this.scrollport.scrollTop;
    const viewportHeight = this.scrollport.offsetHeight;
    const viewportBottom = viewportTop + viewportHeight;
    const viewportCenter = viewportTop + (viewportHeight / 2);
    
    let closestJob = null;
    let closestDistance = Infinity;
    
    // Check all items to find which job is closest to viewport center
    this.allItems.forEach((item) => {
      if (item && item.element && item.type === 'original') {
        const itemTop = item.top;
        const itemBottom = itemTop + item.height;
        const itemCenter = itemTop + (item.height / 2);
        
        // Only consider items that are at least partially visible
        const isVisible = itemTop < viewportBottom && itemBottom > viewportTop;
        if (isVisible) {
          const distanceFromCenter = Math.abs(itemCenter - viewportCenter);
          if (distanceFromCenter < closestDistance) {
            closestDistance = distanceFromCenter;
            const jobNumber = item.element.getAttribute('data-job-number');
            closestJob = parseInt(jobNumber);
          }
        }
      }
    });
    
    return closestJob;
  }

  /**
   * Configure the vertical spacing between rDivs
   * @param {number} spacing - Vertical gap in pixels between adjacent rDivs
   */
  configureItemSpacing(spacing) {
    this.options.itemSpacing = spacing;
    window.CONSOLE_LOG_IGNORE(`[DEBUG] InfiniteScrollingContainer: Item spacing configured to ${spacing}px`);
    
    // Recalculate positions with new spacing
    if (this.allItems && this.allItems.length > 0) {
      this.positionItems();
    }
  }

  /**
   * Get current item spacing configuration
   * @returns {number} Current spacing in pixels
   */
  getItemSpacing() {
    return this.options.itemSpacing;
  }

  // Method to initialize the infinite scroller with DOM elements after creation
  async initializeWithElements(scrollportElement, contentElement, options = {}) {
    // If already initialized, return immediately
    if (this._isInitialized) {
      // window.CONSOLE_LOG_IGNORE('[DEBUG] InfiniteScrollingContainer.initializeWithElements: Already initialized, ignoring duplicate call');
      return;
    }
    
    // If initialization is in progress, wait for it to complete
    if (this._initializationPromise) {
      // window.CONSOLE_LOG_IGNORE('[DEBUG] InfiniteScrollingContainer.initializeWithElements: Initialization in progress, waiting...');
      await this._initializationPromise;
      return;
    }
    
    // Start initialization and store the promise
    this._initializationPromise = this._performInitialization(scrollportElement, contentElement, options);
    
    try {
      await this._initializationPromise;
    } finally {
      // Clear the promise after completion (success or failure)
      this._initializationPromise = null;
    }
  }

  // Private method to perform the actual initialization
  async _performInitialization(scrollportElement, contentElement, options = {}) {
    // window.CONSOLE_LOG_IGNORE('[DEBUG] InfiniteScrollingContainer._performInitialization: Starting initialization');
    
    this.scrollport = scrollportElement;
    this.contentHolder = contentElement;
    this.options = {
      cloneCount: options.cloneCount || 3,
      dragThreshold: options.dragThreshold || 5,
      transitionDuration: options.transitionDuration || 300,
      enableTouch: options.enableTouch !== false,
      onItemChange: options.onItemChange || null,
      ...options
    };

    this.init();
    this._isInitialized = true;
    
    // window.CONSOLE_LOG_IGNORE('[DEBUG] InfiniteScrollingContainer._performInitialization: Initialization complete');
  }
}

export { InfiniteScrollingContainer };
