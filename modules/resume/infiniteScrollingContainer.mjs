// modules/scene/infiniteScrollingContainer.mjs

import * as colorPalettes from '../colors/colorPalettes.mjs';

class InfiniteScrollingContainer {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
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

    this.init();
    
    // Make this instance available globally for debugging
    window.infiniteScrollingContainer = this;
  }

  init() {
    this.setupContainer();
    this.bindEvents();
    console.info('InfiniteScrollingContainer initialized');
  }

  setupContainer() {
    // Ensure container has proper styling
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';
    this.container.style.userSelect = 'none';
    this.container.style.cursor = 'grab';
  }

  setItems(items) {
    // Clear the container of any previous items and clones
    this.container.innerHTML = '';
    
    this.originalItems = [...items];
    this.createClonedStructure();
    this.positionItems();
    this.currentIndex = 0;
    console.info(`InfiniteScrollingContainer: Set ${items.length} items`);
    
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
      item.element.style.setProperty('right', '10px', 'important');
      item.element.style.setProperty('width', 'auto', 'important');
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
      
      // Fix the description list
      const descList = item.element.querySelector('.bulleted-job-description-items-ul');
      if (descList) {
        descList.style.display = 'block';
        descList.style.listStyle = 'none';
        descList.style.padding = '0 0 0 1.5rem';
        descList.style.margin = '0.3rem 0';
        descList.style.width = '100%';
        
        // Make description items compact but readable
        const descItems = descList.querySelectorAll('.bulleted-job-description-items-li');
        descItems.forEach(desc => {
          desc.style.display = 'block';
          desc.style.position = 'relative';
          desc.style.marginBottom = '0.2rem';
          desc.style.lineHeight = '1.25';
          desc.style.width = '100%';
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
      if (!this.container.contains(item.element)) {
        this.container.appendChild(item.element);
      }
    });
    
    // Force layout calculation
    void this.container.offsetHeight;
    
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
    
    // Set container height
    this.container.style.height = `${currentTop}px`;

    // Reapply color palettes after positioning (colors get lost during style manipulation)
    this.reapplyColorPalettes();

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
      this.container.scrollTop = targetScrollTop;
    }
    
    this.currentIndex = originalIndex;
    this.checkForSeamlessTransition();
    
    if (this.options.onItemChange) {
      this.options.onItemChange(originalIndex, this.originalItems[originalIndex]);
    }
  }

  smoothScrollTo(targetScrollTop) {
    const startScrollTop = this.container.scrollTop;
    const distance = targetScrollTop - startScrollTop;
    const duration = this.options.transitionDuration;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      this.container.scrollTop = startScrollTop + (distance * easeOut);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  checkForSeamlessTransition() {
    const scrollTop = this.container.scrollTop;
    const cloneCount = Math.min(this.options.cloneCount, this.originalItems.length);
    const containerHeight = this.container.offsetHeight;
    
    // Calculate boundaries
    const tailCloneHeight = this.getTotalCloneHeight('tail');
    const originalItemsHeight = this.getTotalOriginalItemsHeight();
    
    // If we're in the tail clone area, jump to the end of original items
    if (scrollTop < tailCloneHeight - containerHeight / 2) {
      const jumpToPosition = tailCloneHeight + originalItemsHeight - containerHeight;
      this.container.scrollTop = jumpToPosition;
      // logger.info('Seamless transition: tail to end');
    }
    
    // If we're in the head clone area, jump to the beginning of original items
    else if (scrollTop > tailCloneHeight + originalItemsHeight - containerHeight / 2) {
      const jumpToPosition = tailCloneHeight;
      this.container.scrollTop = jumpToPosition;
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
    // Use ResizeObserver to detect when container width changes
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        // Use requestAnimationFrame to batch DOM operations
        requestAnimationFrame(() => {
          // Debounce the repositioning to avoid excessive calls
          clearTimeout(this.resizeTimeout);
          this.resizeTimeout = setTimeout(() => {
            this.handleContainerResize();
          }, 200);
        });
      });

      this.resizeObserver.observe(this.container);
    } else {
      // Fallback for browsers without ResizeObserver
      window.addEventListener('resize', () => {
        requestAnimationFrame(() => {
          clearTimeout(this.resizeTimeout);
          this.resizeTimeout = setTimeout(() => {
            this.handleContainerResize();
          }, 200);
        });
      });
    }
  }

  handleContainerResize() {
    // Batch DOM reads
    let currentScrollTop = 0;
    let needsUpdate = false;
    
    if (this.allItems && this.allItems.length > 0) {
      currentScrollTop = this.container.scrollTop;
      needsUpdate = true;
    }
    
    // Batch DOM writes
    if (needsUpdate) {
      requestAnimationFrame(() => {
        this.positionItems();
        // Restore scroll position
        this.container.scrollTop = currentScrollTop;
        // Reapply colors after resize
        this.reapplyColorPalettes();
      });
    }
  }

  reapplyColorPalettes() {
    // Reapply color palettes to all resume divs after style manipulation
    this.allItems.forEach(item => {
      if (item.element && item.element.classList.contains('biz-resume-div')) {
        colorPalettes.applyCurrentColorPaletteToElement(item.element);
      }
    });
  }

  bindEvents() {
    // Mouse events
    this.container.addEventListener('mousedown', this.handleStart.bind(this));
    document.addEventListener('mousemove', this.handleMove.bind(this));
    document.addEventListener('mouseup', this.handleEnd.bind(this));

    // Touch events
    if (this.options.enableTouch) {
      this.container.addEventListener('touchstart', this.handleStart.bind(this), { passive: true });
      document.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
      document.addEventListener('touchend', this.handleEnd.bind(this), { passive: true });
    }

    // Mouse wheel events
    this.container.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

    // Scroll events for seamless transitions
    this.container.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });

    // Resize observer to handle container width changes
    this.setupResizeObserver();

    // Add event listener for click
    this.container.addEventListener('click', (e) => {
      const itemElement = e.target.closest('.biz-resume-div');
      if (itemElement) {
        const item = this.allItems.find(i => i.element === itemElement);
        if (item) {
          // Dynamically import the new controller and call the click handler
          import('../scene/ResumeItemsController.mjs').then(module => {
            console.log(`Calling ResumeItemsController.handleBizResumeDivClickEvent for ${item.element.id}`);
            module.resumeItemsController.handleBizResumeDivClickEvent(item.element);
          }).catch(error => {
            console.error("Error importing ResumeItemsController:", error);
          });
        }
      }
    });

    // Add event listener for hover
    this.container.addEventListener('mouseenter', (e) => {
      const itemElement = e.target.closest('.biz-resume-div');
      if (itemElement) {
        const item = this.allItems.find(i => i.element === itemElement);
        if (item) {
          console.log(`Hovering over ${item.element.id}`);
          // Dynamically import the new controller and call the hover handler
          import('../scene/ResumeItemsController.mjs').then(module => {
            console.log(`Calling ResumeItemsController.handleMouseEnterEvent for ${item.element.id}`);
            module.resumeItemsController.handleMouseEnterEvent(item.element);
          }).catch(error => {
            console.error("Error importing ResumeItemsController:", error);
          });
        }
      }
    });
  }

  handleStart(e) {
    // Special handling for clicks on bizResumeDivs
    const bizResumeDiv = e.target.closest('.biz-resume-div');
    if (bizResumeDiv) {
        console.log("InfiniteScrollingContainer: Click on bizResumeDiv detected:", bizResumeDiv.id);
        console.log("- Target:", e.target.tagName, e.target.className);
        console.log("- Has direct click handler:", !!bizResumeDiv._directClickHandler);
        console.log("- Has data-has-direct-click-handler:", bizResumeDiv.getAttribute('data-has-direct-click-handler'));
        
        // Don't try to prevent default for touchstart events when using passive listeners
        return;
    }
    
    // For non-touch events, we can still prevent default
    if (!e.type.includes('touch')) {
        e.preventDefault();
    }
    
    this.isDragging = true;
    this.startY = this.getEventY(e);
    this.startScrollTop = this.container.scrollTop;
    this.lastY = this.startY;
    this.velocity = 0;
    this.container.style.cursor = 'grabbing';
    
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
    this.container.scrollTop -= deltaY;
    this.lastY = currentY;
  }

  handleEnd(e) {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.container.style.cursor = 'grab';
    
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
      
      this.container.scrollTop -= this.velocity;
      this.momentumAnimationId = requestAnimationFrame(animate);
    };
    
    animate();
  }

  handleWheel(e) {
    e.preventDefault(); // Prevent default scroll behavior
    
    // Apply wheel delta to container scroll
    const delta = e.deltaY;
    this.container.scrollTop += delta;
    
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
    
    console.log(`InfiniteScrollingContainer: Scrolling to item at index ${index}`);
    
    // Find the item in allItems
    const item = this.allItems.find(item => 
      item.type === 'original' && item.originalIndex === index
    );
    
    if (!item || !item.element) {
      console.error(`InfiniteScrollingContainer: Item not found for index: ${index}`);
      return;
    }
    
    console.log(`InfiniteScrollingContainer: Found item: ${item.element.id}`);
    
    // Calculate the scroll position
    const scrollTop = item.top;
    
    console.log(`InfiniteScrollingContainer: Scrolling to position: ${scrollTop}`);
    
    // Scroll to the item
    if (smooth) {
      this.smoothScrollTo(scrollTop);
    } else {
      this.container.scrollTop = scrollTop;
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
    this.container.removeEventListener('mousedown', this.handleStart.bind(this));
    document.removeEventListener('mousemove', this.handleMove.bind(this));
    document.removeEventListener('mouseup', this.handleEnd.bind(this));

    if (this.options.enableTouch) {
      this.container.removeEventListener('touchstart', this.handleStart.bind(this));
      document.removeEventListener('touchmove', this.handleMove.bind(this));
      document.removeEventListener('touchend', this.handleEnd.bind(this));
    }

    this.container.removeEventListener('wheel', this.handleWheel.bind(this));
    this.container.removeEventListener('scroll', this.handleScroll.bind(this));

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
    this.container.innerHTML = '';

    console.info('InfiniteScrollingContainer destroyed');
  }

  addDirectClickHandlers() {
    // Add direct click handlers to all bizResumeDivs
    this.allItems.forEach(item => {
      if (item.element && item.element.classList.contains('biz-resume-div')) {
        // Remove any existing click handlers to avoid duplicates
        if (item.element._directClickHandler) {
          item.element.removeEventListener('click', item.element._directClickHandler);
        }
        
        // Create a new click handler
        const clickHandler = (e) => {
          console.log(`Direct click on ${item.element.id}`);
          e.stopPropagation(); // Prevent event from bubbling
          
          // Import bizResumeDivModule and call handleClickEvent
          import('../scene/bizResumeDivManager.mjs').then(module => {
            console.log(`Calling bizResumeDivManager.handleClickEvent for ${item.element.id}`);
            module.bizResumeDivManager.handleClickEvent(item.element);
          }).catch(error => {
            console.error("Error importing bizResumeDivManager:", error);
          });
        };
        
        // Store the handler for later removal
        item.element._directClickHandler = clickHandler;
        
        // Add the click handler
        item.element.addEventListener('click', clickHandler);
        
        // Add a data attribute to confirm handler was attached
        item.element.setAttribute('data-has-direct-click-handler', 'true');
        
        console.log(`Added direct click handler to ${item.element.id}`);
      }
    });
  }

  // Public method to manually trigger a click on a bizResumeDiv
  triggerBizResumeDivClick(index) {
    if (index < 0 || index >= this.originalItems.length) {
        console.error(`Invalid index: ${index}`);
        return false;
    }
    
    // Find the item in allItems
    const item = this.allItems.find(item => 
        item.type === 'original' && item.originalIndex === index
    );
    
    if (!item || !item.element) {
        console.error(`Item not found for index: ${index}`);
        return false;
    }
    
    console.log(`Manually triggering click on ${item.element.id}`);
    
    // Import bizResumeDivModule and call handleClickEvent
    import('../scene/bizResumeDivManager.mjs').then(module => {
        console.log(`Calling bizResumeDivManager.handleClickEvent for ${item.element.id}`);
        module.bizResumeDivManager.handleClickEvent(item.element);
        return true;
    }).catch(error => {
        console.error("Error importing bizResumeDivManager:", error);
        return false;
    });
  }

  /**
   * Scroll to a specific item by index with improved positioning
   * @param {number} index - The index of the item to scroll to
   * @param {boolean} animate - Whether to animate the scroll
   * @returns {boolean} - Whether the scroll was successful
   */
  scrollToItem(index, animate = true) {
    if (index < 0 || index >= this.originalItems.length) {
      console.error(`InfiniteScrollingContainer: Invalid index: ${index}`);
      return false;
    }
    
    console.log(`InfiniteScrollingContainer: Scrolling to item at index ${index}`);
    
    // Find the item in allItems
    const item = this.allItems.find(item => 
      item.type === 'original' && item.originalIndex === index
    );
    
    if (!item || !item.element) {
      console.error(`InfiniteScrollingContainer: Item not found for index: ${index}`);
      return false;
    }
    
    console.log(`InfiniteScrollingContainer: Found item: ${item.element.id}`);
    
    // Calculate the scroll position
    const scrollTop = item.top;
    
    console.log(`InfiniteScrollingContainer: Scrolling to position: ${scrollTop}`);
    
    // Scroll to the item
    if (animate) {
      this.smoothScrollTo(scrollTop);
    } else {
      this.container.scrollTop = scrollTop;
    }
    
    // Update the current index
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
    if (!bizResumeDiv) {
      console.error("InfiniteScrollingContainer: Cannot scroll to null bizResumeDiv");
      return false;
    }
    
    console.log(`InfiniteScrollingContainer: Scrolling to bizResumeDiv ${bizResumeDiv.id}`);
    
    // Get the job index from the bizResumeDiv
    const jobIndex = parseInt(bizResumeDiv.getAttribute('data-job-index'), 10);
    if (isNaN(jobIndex)) {
      console.error(`InfiniteScrollingContainer: Could not get job index from bizResumeDiv ${bizResumeDiv.id}`);
      return false;
    }
    
    // Find the item in allItems
    const item = this.allItems.find(item => 
      item.type === 'original' && 
      item.element && 
      parseInt(item.element.getAttribute('data-job-index'), 10) === jobIndex
    );
    
    if (!item) {
      console.error(`InfiniteScrollingContainer: Item not found for job index: ${jobIndex}`);
      return false;
    }
    
    // Get the original index
    const index = item.originalIndex;
    
    // Scroll to the item
    return this.scrollToItem(index, animate);
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
}

export { InfiniteScrollingContainer };
