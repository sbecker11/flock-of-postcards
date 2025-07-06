// modules/resume/infiniteScrollingContainer.mjs

import { applyPaletteToElement, applyStateStyling } from '../composables/useColorPalette.mjs';
import { selectionManager } from '../core/selectionManager.mjs';

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

  // Centralized positioning logic - single source of truth
  calculateItemPositions(measureHeights = true) {
    // Simple 5px spacing between positioned elements
    const spacing = 5;
    
    // Reset currentTop to 0 to ensure clean positioning
    let currentTop = 0;
    
    if (measureHeights) {
      // window.CONSOLE_LOG_IGNORE(`[DEBUG] calculateItemPositions: Measuring and positioning ${this.allItems.length} items`);
      // window.CONSOLE_LOG_IGNORE(`[DEBUG] calculateItemPositions: Starting currentTop=${currentTop}`);
    }
    
    this.allItems.forEach((item, index) => {
      // Position item at currentTop with explicit positioning using !important
      item.element.style.setProperty('position', 'absolute', 'important');
      item.element.style.setProperty('top', `${currentTop}px`, 'important');
      item.element.style.setProperty('left', '10px', 'important');
      item.element.style.setProperty('right', '10px', 'important');
      item.element.style.setProperty('width', 'calc(100% - 20px)', 'important');
      
      let contentHeight;
      if (measureHeights) {
        // Force a layout recalculation before measuring
        void item.element.offsetHeight;
        
        // Measure content height using multiple methods for reliability
        const rect = item.element.getBoundingClientRect();
        const scrollHeight = item.element.scrollHeight;
        const offsetHeight = item.element.offsetHeight;
        const clientHeight = item.element.clientHeight;
        
        // Use the largest non-zero value, prioritizing getBoundingClientRect
        contentHeight = rect.height || scrollHeight || offsetHeight || clientHeight || 0;
        
        // Sanity check: if height is unreasonably large, use a fallback
        if (contentHeight > 10000) {
          // window.CONSOLE_LOG_IGNORE(`[DEBUG] Unreasonably large height detected for item ${index}: ${contentHeight}px, using fallback`);
          contentHeight = Math.min(scrollHeight || 300, offsetHeight || 300, clientHeight || 300, 300);
        }
        
        // Debug logging for height measurement
        // if (index < 3) {
        //   // window.CONSOLE_LOG_IGNORE(`[DEBUG] Height measurement for item ${index}:`, {
        //     rectHeight: rect.height,
        //     scrollHeight: scrollHeight,
        //     offsetHeight: offsetHeight,
        //     clientHeight: clientHeight,
        //     finalHeight: contentHeight,
        //     currentTop: currentTop
        //   });
        // }
        
        // Set height based on actual content
        item.element.style.height = `${contentHeight}px`;
        item.element.style.minHeight = `${contentHeight}px`;
      } else {
        // Use existing height data
        contentHeight = item.height;
      }
      
      // Update item data
      item.top = currentTop;
      item.height = contentHeight;

      // Debug logging for first few items
      // if (index < 5 && measureHeights) {
      //   const prevItem = index > 0 ? this.allItems[index - 1] : null;
      //   const actualGap = prevItem ? currentTop - (prevItem.top + prevItem.height) : 0;
      //   const rect = item.element.getBoundingClientRect();
      //   // window.CONSOLE_LOG_IGNORE(`[DEBUG] calculateItemPositions: Item ${index} (${item.type}) - top=${currentTop}, height=${contentHeight}, rect.height=${rect.height}, actualGap=${actualGap}px`);
      // }

      // Calculate next position: current item bottom + spacing gap
      const previousTop = currentTop;
      currentTop += contentHeight + spacing;
      
      // Debug logging for positioning
      // if (index < 3) {
      //   // window.CONSOLE_LOG_IGNORE(`[DEBUG] Positioning for item ${index}: previousTop=${previousTop}, contentHeight=${contentHeight}, spacing=${spacing}, new currentTop=${currentTop}`);
      // }
    });
    
    return currentTop;
  }

  positionItems() {
    // Minimal spacing between items (5px as requested)
    
    // First pass: reset styling for proper measurement
    this.allItems.forEach(item => {
      // Set explicit width and positioning with proper gaps
      item.element.style.position = 'absolute';
      item.element.style.height = 'auto';
      item.element.style.minHeight = 'auto';
      item.element.style.overflow = 'visible';
      item.element.style.boxSizing = 'border-box';

      // Use left and right positioning to create gaps - force with setProperty
      item.element.style.setProperty('left', '10px', 'important');
      item.element.style.setProperty('width', 'calc(100% - 20px)', 'important');
      item.element.style.setProperty('min-width', '0', 'important'); // Allow compression below natural min-width
      item.element.style.setProperty('max-width', 'none', 'important'); // Remove any max-width constraints
      
      // Set controlled margins only - let color palette system handle padding
      item.element.style.margin = '0';
      // Don't override padding/border - let the color palette system handle it
      
      // Fix the skills display
      const skillsList = item.element.querySelector('.bulleted-job-skills-ul');
      if (skillsList) {
        skillsList.style.display = 'flex';
        skillsList.style.flexWrap = 'wrap';
        skillsList.style.gap = '0.1rem';
        skillsList.style.listStyle = 'none';
        skillsList.style.padding = '0';
        skillsList.style.margin = '0';
        skillsList.style.lineHeight = '1.2';
        skillsList.style.width = '100%';
        
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
      
      // Ensure all margins and padding are controlled by positioning, not CSS
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
    
    // Use centralized positioning logic
    const currentTop = this.calculateItemPositions(true);
    
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
    const gap = 5;
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
    
    // window.CONSOLE_LOG_IGNORE(`[DEBUG] SCROLL_TO_INDEX: originalIndex=${originalIndex}, targetItemIndex=${targetItemIndex}`);
    // window.CONSOLE_LOG_IGNORE(`[DEBUG] SCROLL_TO_INDEX: allItems.length=${this.allItems.length}`);
    
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
      // window.CONSOLE_LOG_IGNORE(`[DEBUG] InfiniteScroller.scrollToIndex: targetItemIndex ${targetItemIndex} >= allItems.length ${this.allItems.length}`);
      return;
    }
    
    const targetItem = this.allItems[targetItemIndex];
    if (!targetItem) {
      // window.CONSOLE_LOG_IGNORE(`[DEBUG] InfiniteScroller.scrollToIndex: targetItem is null for index ${targetItemIndex}`);
      return;
    }
    
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
    
    // Calculate scroll position to ensure the header is visible at the top of the container
    const topMargin = 50; // Margin from the top to make target job more prominent
    const targetScrollTop = Math.max(0, targetItem.top + headerOffset - topMargin);
    
    // Always use smooth scrolling behavior
    this.scrollport.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });
    
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
    if (jumped && !_retry) {
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
    const scrollTop = this.scrollport.scrollTop;
    const cloneCount = Math.min(this.options.cloneCount, this.originalItems.length);
    const containerHeight = this.scrollport.offsetHeight;

    // Calculate boundaries
    const tailCloneHeight = this.getTotalCloneHeight('tail');
    const originalItemsHeight = this.getTotalOriginalItemsHeight();

    // window.CONSOLE_LOG_IGNORE(`[DEBUG] checkForSeamlessTransition: scrollTop=${scrollTop}, tailCloneHeight=${tailCloneHeight}, originalItemsHeight=${originalItemsHeight}, containerHeight=${containerHeight}`);
    // window.CONSOLE_LOG_IGNORE(`[DEBUG] checkForSeamlessTransition: tail boundary=${tailCloneHeight - containerHeight / 2}, head boundary=${tailCloneHeight + originalItemsHeight - containerHeight / 2}`);

    // If we're in the tail clone area, jump to the end of original items
    if (scrollTop < tailCloneHeight - containerHeight / 2) {
      const jumpToPosition = tailCloneHeight + originalItemsHeight - containerHeight;
      // window.CONSOLE_LOG_IGNORE(`[DEBUG] checkForSeamlessTransition: JUMPING from tail clone area: ${scrollTop} -> ${jumpToPosition}`);
      this.scrollport.scrollTop = jumpToPosition;
      return true; // Jumped
    }
    // If we're in the head clone area, jump to the beginning of original items
    else if (scrollTop > tailCloneHeight + originalItemsHeight - containerHeight / 2) {
      const jumpToPosition = tailCloneHeight;
      // window.CONSOLE_LOG_IGNORE(`[DEBUG] checkForSeamlessTransition: JUMPING from head clone area: ${scrollTop} -> ${jumpToPosition}`);
      this.scrollport.scrollTop = jumpToPosition;
      return true; // Jumped
    }
    else {
      // window.CONSOLE_LOG_IGNORE(`[DEBUG] checkForSeamlessTransition: No transition needed, staying at ${scrollTop}`);
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
    if (!this.isDragging) {
      // Debounce the seamless transition check
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        this.checkForSeamlessTransition();
      }, 50);
    }
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
      // Add direct click handlers to all items
      item.element.addEventListener('click', () => {
        // THIS IS INTENTIONALLY LEFT BLANK TO PREVENT A DEAD IMPORT
      });
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
    // window.CONSOLE_LOG_IGNORE(`[DEBUG] InfiniteScroller.scrollToJobNumber: jobNumber=${jobNumber}, animate=${animate}`);
    
    // Find the item with the specified job number
    const index = this.originalItems.findIndex(item => {
      const itemJobNumber = item.getAttribute('data-job-number');
      return parseInt(itemJobNumber) === jobNumber;
    });
    
    if (index === -1) {
      // window.CONSOLE_LOG_IGNORE(`[DEBUG] InfiniteScroller.scrollToJobNumber: Job number ${jobNumber} not found in originalItems`);
      return false;
    }
    
    // window.CONSOLE_LOG_IGNORE(`[DEBUG] InfiniteScroller.scrollToJobNumber: Found job ${jobNumber} at index ${index}`);
    
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
    const currentTop = this.calculateItemPositions(true);
    
    // Update total content height
    this.contentHolder.style.height = `${currentTop}px`;
    
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
    const spacing = 5;
    let currentTop = startIndex > 0 ? this.allItems[startIndex - 1].top + this.allItems[startIndex - 1].height + spacing : 0;
    
    for (let i = startIndex; i < this.allItems.length; i++) {
      const item = this.allItems[i];
      
      // Update position using consistent logic
      item.element.style.top = `${currentTop}px`;
      item.top = currentTop;
      
      // Calculate next position: current item bottom + spacing gap
      currentTop += item.height + spacing;
    }
    
    // Update total content height
    this.contentHolder.style.height = `${currentTop}px`;
  }



  // Method to trigger debounced resize handling
  handleResize() {
    // window.CONSOLE_LOG_IGNORE('[DEBUG] InfiniteScroller.handleResize: Container size changed, recalculating layout');
    
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
      const currentTop = this.calculateItemPositions(true);
      this.contentHolder.style.height = `${currentTop}px`;
      
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
