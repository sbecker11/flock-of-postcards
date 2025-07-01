// modules/scene/infiniteScrollingContainer.mjs

class InfiniteScrollingContainer {
  constructor(scrollportElement, contentElement, options = {}) {
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

    this.init();
    
    // Make this instance available globally for debugging
    window.infiniteScrollingContainer = this;
  }

  reinitialize() {
    window.CONSOLE_LOG_IGNORE("Re-running positioning logic...");
    this.positionItems();
    this.scrollToItem(this.currentIndex, 'reinitialize', true); // Force immediate scroll without animation
  }

  init() {
    this.setupContainer();
    this.bindEvents();
    this.setupResizeObserver();
    CONSOLE_INFO_IGNORE('InfiniteScrollingContainer initialized');
  }

  setupContainer() {
    // The container passed in is the one we manipulate for scrolling
    this.scrollport.style.position = 'relative';
    this.scrollport.style.overflow = 'auto'; /* Changed to auto to enable scrolling */
    this.scrollport.style.userSelect = 'none';
    this.scrollport.style.cursor = 'ns-resize';
  }

  setItems(items, startingIndex = 0) {
    // Clear the container of any previous items and clones
    this.contentHolder.innerHTML = '';
    
    this.originalItems = [...items];
    this.createClonedStructure();
    this.positionItems();
    this.currentIndex = startingIndex; // Use the provided starting index
    CONSOLE_INFO_IGNORE(`InfiniteScrollingContainer: Set ${items.length} items, starting at index ${startingIndex}`);
    
    // Ensure click handlers are added
    this.addDirectClickHandlers();
  }

  createClonedStructure() {
    // Clear existing items
    this.allItems = [];
    
    if (this.originalItems.length === 0) return;

    const itemCount = this.originalItems.length;
    const cloneCount = Math.min(this.options.cloneCount, itemCount);

    // Create structure: [tail clones] [original items] [head clones]
    
    // Add tail clones (last N items cloned at the beginning)
    for (let i = 0; i < cloneCount; i++) {
      const originalIndex = itemCount - cloneCount + i;
      const clone = this.cloneItem(this.originalItems[originalIndex], originalIndex, 'tail');
      this.allItems.push({
        element: clone,
        originalIndex: originalIndex,
        type: 'tail-clone',
        cloneIndex: i
      });
    }

    // Add original items
    this.originalItems.forEach((item, index) => {
      this.allItems.push({
        element: item,
        originalIndex: index,
        type: 'original'
      });
    });

    // Add head clones (first N items cloned at the end)
    for (let i = 0; i < cloneCount; i++) {
      const clone = this.cloneItem(this.originalItems[i], i, 'head');
      this.allItems.push({
        element: clone,
        originalIndex: i,
        type: 'head-clone',
        cloneIndex: i
      });
    }
    
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

  positionItems() {
    // Minimal spacing between items (5px as requested)
    const spacing = 5;
    
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
      
      // Minimal padding and margins
      item.element.style.padding = '10px';
      item.element.style.margin = '0';
      item.element.style.borderWidth = '1px';
      
      // Fix the skills display
      const skillsList = item.element.querySelector('.bulleted-job-skills-ul');
      if (skillsList) {
        skillsList.style.display = 'flex';
        skillsList.style.flexWrap = 'wrap';
        skillsList.style.gap = '0.1rem';
        skillsList.style.listStyle = 'none';
        skillsList.style.padding = '0';
        skillsList.style.margin = '0.2rem 0';
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
        detailsDiv.style.padding = '5px';
        detailsDiv.style.margin = '0';
        detailsDiv.style.width = '100%';
        detailsDiv.style.minWidth = '0'; // Allow compression
        detailsDiv.style.wordWrap = 'break-word';
        detailsDiv.style.overflowWrap = 'break-word';
        detailsDiv.style.wordBreak = 'break-word';

        // Ensure headers are compact but readable
        const headers = detailsDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headers.forEach(header => {
          header.style.marginBottom = '0.2rem';
          header.style.marginTop = '0.2rem';
          header.style.minWidth = '0'; // Allow header compression
          header.style.wordWrap = 'break-word';
        });
      }
      
      // Append to container if needed
      if (!this.contentHolder.contains(item.element)) {
        this.contentHolder.appendChild(item.element);
      }
    });
    
    // Force layout calculation
    void this.contentHolder.offsetHeight;
    
    // Second pass: measure and position with proper heights
    let currentTop = 0;
    
    this.allItems.forEach((item, index) => {
      // Add minimal spacing between items (not before first)
      if (index > 0) {
        currentTop += spacing;
      }
      
      // Measure content more precisely
      const scrollHeight = item.element.scrollHeight;
      const offsetHeight = item.element.offsetHeight;
      const clientHeight = item.element.clientHeight;

      // Use the smallest reasonable height to minimize gaps
      const contentHeight = Math.min(scrollHeight, offsetHeight || scrollHeight);

      // Set height based on actual content
      item.element.style.height = `${contentHeight}px`;
      item.element.style.minHeight = `${contentHeight}px`;

      // Position
      item.element.style.top = `${currentTop}px`;

      // Force remove any margins that might cause visual gaps
      item.element.style.margin = '0 !important';
      item.element.style.marginTop = '0 !important';
      item.element.style.marginBottom = '0 !important';

      // Update item data
      item.top = currentTop;
      item.height = contentHeight;

      // Move to next position
      currentTop += contentHeight;
    });
    
    // Set the total height of the content holder for proper scrolling
    this.contentHolder.style.height = `${currentTop}px`;

    // Position at start
    this.scrollToIndex(0, false);
  }

  scrollToIndex(originalIndex, animate = true) {
    const cloneCount = Math.min(this.options.cloneCount, this.originalItems.length);
    const targetItemIndex = cloneCount + originalIndex; // Account for tail clones
    
    if (targetItemIndex >= this.allItems.length) return;
    
    const targetItem = this.allItems[targetItemIndex];
    const targetScrollTop = targetItem.top;
    
    if (animate) {
      this.smoothScrollTo(targetScrollTop);
    } else {
      this.scrollport.scrollTop = targetScrollTop;
    }
    
    this.currentIndex = originalIndex;
    this.checkForSeamlessTransition();
    
    if (this.options.onItemChange) {
      this.options.onItemChange(originalIndex, this.originalItems[originalIndex]);
    }

    // Resize observer to handle container width changes
    this.setupResizeObserver();
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
    
    // If we're in the tail clone area, jump to the end of original items
    if (scrollTop < tailCloneHeight - containerHeight / 2) {
      const jumpToPosition = tailCloneHeight + originalItemsHeight - containerHeight;
      this.scrollport.scrollTop = jumpToPosition;
      // logger.info('Seamless transition: tail to end');
    }
    
    // If we're in the head clone area, jump to the beginning of original items
    else if (scrollTop > tailCloneHeight + originalItemsHeight - containerHeight / 2) {
      const jumpToPosition = tailCloneHeight;
      this.scrollport.scrollTop = jumpToPosition;
      // logger.info('Seamless transition: head to beginning');
    }
  }

  getTotalCloneHeight(type) {
    return this.allItems
      .filter(item => item.type === `${type}-clone`)
      .reduce((total, item) => total + item.height, 0);
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
    
    // Start observing the content holder
    this.resizeObserver.observe(this.contentHolder);
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
      console.error(`InfiniteScrollingContainer: Invalid index: ${index}`);
      return;
    }
    
    window.CONSOLE_LOG_IGNORE(`InfiniteScrollingContainer: Scrolling to item at index ${index}`);
    
    // Find the item in allItems
    const item = this.allItems.find(item => 
      item.type === 'original' && item.originalIndex === index
    );
    
    if (!item || !item.element) {
      console.error(`InfiniteScrollingContainer: Item not found for index: ${index}`);
      return;
    }
    
    window.CONSOLE_LOG_IGNORE(`InfiniteScrollingContainer: Found item: ${item.element.id}`);
    
    // Calculate the scroll position
    const scrollTop = item.top;
    
    window.CONSOLE_LOG_IGNORE(`InfiniteScrollingContainer: Scrolling to position: ${scrollTop}`);
    
    // Scroll to the item
    if (smooth) {
      this.smoothScrollTo(scrollTop);
    } else {
      this.scrollport.scrollTop = scrollTop;
    }
    
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
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    // Cancel animations
    if (this.momentumAnimationId) {
      cancelAnimationFrame(this.momentumAnimationId);
    }

    // Clear container
    this.contentHolder.innerHTML = '';

    CONSOLE_INFO_IGNORE('InfiniteScrollingContainer destroyed');
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
    if (this.originalItems.length === 0 || index < 0 || index >= this.originalItems.length) {
      console.error(`InfiniteScrollingContainer: Invalid index ${index} from ${caller}`);
      return false;
    }
    
    window.CONSOLE_LOG_IGNORE(`InfiniteScrollingContainer: Scrolling to item at index ${index}`);
    
    // Find the item in allItems
    const item = this.allItems.find(item => 
      item.type === 'original' && item.originalIndex === index
    );
    
    if (!item || !item.element) {
      console.error(`InfiniteScrollingContainer: Item not found for index: ${index}`);
      return false;
    }
    
    window.CONSOLE_LOG_IGNORE(`InfiniteScrollingContainer: Found item: ${item.element.id}`);
    
    // Calculate the scroll position
    const scrollTop = item.top;
    
    window.CONSOLE_LOG_IGNORE(`InfiniteScrollingContainer: Scrolling to position: ${scrollTop}`);

    // Calculate final scroll position with an offset to ensure the header is visible
    const scrollOffset = 20; // pixels
    const finalScrollTop = Math.max(0, scrollTop - scrollOffset);

    // Apply scroll immediately or smoothly
    if (force) {
      this.scrollport.scrollTop = finalScrollTop;
    } else {
      this.smoothScrollTo(finalScrollTop);
    }
    
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
      return this.scrollToItem(index, 'scrollToBizResumeDiv', !animate);
    }
    return false;
  }

  /**
   * Find the index of a bizResumeDiv element
   * @param {HTMLElement} bizResumeDiv - The bizResumeDiv element to find
   * @returns {number} - The index of the bizResumeDiv, or -1 if not found
   */
  findBizResumeDivIndex(bizResumeDiv) {
    if (!bizResumeDiv) return -1;
    
    // Get the job index from the bizResumeDiv
    const jobIndex = parseInt(bizResumeDiv.getAttribute('data-job-index'), 10);
    if (isNaN(jobIndex)) return -1;
    
    // Find the item in allItems
    const item = this.allItems.find(item => 
      item.type === 'original' && 
      item.element && 
      parseInt(item.element.getAttribute('data-job-index'), 10) === jobIndex
    );
    
    return item ? item.originalIndex : -1;
  }

  // Method to recalculate heights when content changes
  recalculateHeights() {
    window.CONSOLE_LOG_IGNORE('Recalculating heights for all items...');
    
    const spacing = 5;
    let currentTop = 0;
    
    this.allItems.forEach((item, index) => {
      // Add minimal spacing between items (not before first)
      if (index > 0) {
        currentTop += spacing;
      }
      
      // Temporarily set height to auto to measure actual content
      item.element.style.height = 'auto';
      item.element.style.minHeight = 'auto';
      
      // Force layout calculation
      void item.element.offsetHeight;
      
      // Measure the actual content height
      const scrollHeight = item.element.scrollHeight;
      const offsetHeight = item.element.offsetHeight;
      const contentHeight = Math.min(scrollHeight, offsetHeight || scrollHeight);
      
      // Set the new height
      item.element.style.height = `${contentHeight}px`;
      item.element.style.minHeight = `${contentHeight}px`;
      
      // Update position
      item.element.style.top = `${currentTop}px`;
      
      // Update item data
      item.top = currentTop;
      item.height = contentHeight;
      
      // Move to next position
      currentTop += contentHeight;
    });
    
    // Update total content height
    this.contentHolder.style.height = `${currentTop}px`;
    
    window.CONSOLE_LOG_IGNORE('Height recalculation complete. Total height:', currentTop);
  }

  // Method to update a specific item's height and recalculate positions
  updateItemHeight(originalIndex) {
    window.CONSOLE_LOG_IGNORE(`Updating height for item at original index: ${originalIndex}`);
    
    const cloneCount = Math.min(this.options.cloneCount, this.originalItems.length);
    const itemIndex = cloneCount + originalIndex; // Account for tail clones
    
    if (itemIndex >= this.allItems.length) {
      window.CONSOLE_LOG_IGNORE(`Item index ${itemIndex} out of bounds`);
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
    
    window.CONSOLE_LOG_IGNORE(`Updated item ${originalIndex} height to ${newHeight}px`);
  }

  // Helper method to recalculate positions starting from a specific index
  recalculatePositionsFromIndex(startIndex) {
    const spacing = 5;
    let currentTop = startIndex > 0 ? this.allItems[startIndex - 1].top + this.allItems[startIndex - 1].height + spacing : 0;
    
    for (let i = startIndex; i < this.allItems.length; i++) {
      const item = this.allItems[i];
      
      // Update position
      item.element.style.top = `${currentTop}px`;
      item.top = currentTop;
      
      // Move to next position
      currentTop += item.height + spacing;
    }
    
    // Update total content height
    this.contentHolder.style.height = `${currentTop}px`;
  }

  // Debounced resize observer to wait until container stops resizing
  setupDebouncedResizeObserver() {
    // Clear any existing timeout
    if (this.resizeTimeoutId) {
      clearTimeout(this.resizeTimeoutId);
    }
    
    // Set a new timeout to recalculate after resize stops
    this.resizeTimeoutId = setTimeout(() => {
      window.CONSOLE_LOG_IGNORE('Resize stopped, recalculating heights...');
      this.recalculateHeights();
      this.resizeTimeoutId = null;
    }, 300); // Wait 300ms after last resize event
  }

  // Method to trigger debounced resize handling
  handleResize() {
    window.CONSOLE_LOG_IGNORE('Resize detected, starting debounced recalculation...');
    this.setupDebouncedResizeObserver();
  }
}

export { InfiniteScrollingContainer };
