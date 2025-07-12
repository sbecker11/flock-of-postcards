class SelectionManager extends EventTarget {
    constructor() {
        super();
        this.selectedJobNumber = null;
        this.hoveredJobNumber = null;
        
        // Smooth scrolling configuration
        this.smoothScrollConfig = {
            behavior: 'smooth',
            topMargin: 50, // Default margin from top of viewport
            tolerance: 20  // Pixel tolerance for "already positioned" checks
        };
    }

    selectJobNumber(jobNumber, caller = '') {
        if (this.selectedJobNumber === jobNumber) {
            // console.log(`[DEBUG] SelectionManager: Early return - same job already selected: ${jobNumber} from ${caller}`);
            return;
        }

        // Clear hover state before setting selection to prevent state conflicts
        if (this.hoveredJobNumber !== null) {
            this.clearHover(`${caller}-auto-clear-before-select`);
        }

        // console.log(`[DEBUG] SelectionManager: [${caller}] Selecting job number: ${jobNumber} (was: ${this.selectedJobNumber})`);
        this.selectedJobNumber = jobNumber;
        const event = new CustomEvent('selectionChanged', {
            detail: {
                selectedJobNumber: this.selectedJobNumber,
                caller: caller,
                isPaired: true // Flag to indicate both cDiv and rDiv should be selected
            }
        });
        // console.log(`[DEBUG] SelectionManager: Dispatching selectionChanged event:`, event.detail);
        this.dispatchEvent(event);
    }

    clearSelection(caller = '') {
        if (this.selectedJobNumber === null) return;
        
        window.CONSOLE_LOG_IGNORE(`SelectionManager: [${caller}] Clearing selection.`);
        this.selectedJobNumber = null;
        this.dispatchEvent(new CustomEvent('selectionCleared', {
            detail: {
                caller: caller,
                isPaired: true // Flag to indicate both cDiv and rDiv should be cleared
            }
        }));
    }

    hoverJobNumber(jobNumber, caller = '') {
        if (this.hoveredJobNumber === jobNumber) return;

        window.CONSOLE_LOG_IGNORE(`SelectionManager: [${caller}] Hovering job number: ${jobNumber}`);
        this.hoveredJobNumber = jobNumber;
        this.dispatchEvent(new CustomEvent('hoverChanged', {
            detail: {
                hoveredJobNumber: this.hoveredJobNumber,
                caller: caller,
                isPaired: true // Flag to indicate both cDiv and rDiv should be hovered
            }
        }));
    }

    clearHover(caller = '') {
        if (this.hoveredJobNumber === null) return;

        window.CONSOLE_LOG_IGNORE(`SelectionManager: [${caller}] Clearing hover.`);
        this.hoveredJobNumber = null;
        this.dispatchEvent(new CustomEvent('hoverCleared', {
            detail: {
                caller: caller,
                isPaired: true // Flag to indicate both cDiv and rDiv should clear hover
            }
        }));
    }

    getSelectedJobNumber() {
        return this.selectedJobNumber;
    }

    getHoveredJobNumber() {
        return this.hoveredJobNumber;
    }

    /**
     * Centralized smooth scrolling for elements with header positioning
     * @param {HTMLElement} element - The element to scroll into view
     * @param {HTMLElement} container - The scroll container
     * @param {string} headerSelector - CSS selector for header elements within the element
     * @param {string} caller - Caller identification for debugging
     * @returns {boolean} - Whether the scroll was performed
     */
    smoothScrollElementIntoView(element, container, headerSelector = '.biz-details-employer, .biz-details-role, .biz-details-dates, .biz-details-z-value', caller = '') {
        if (!element || !container) {
            window.CONSOLE_LOG_IGNORE(`[DEBUG] SelectionManager.smoothScrollElementIntoView: Missing element or container from ${caller}`);
            return false;
        }

        // Get element position
        let elementTop;
        if (element.getAttribute && element.getAttribute('data-sceneTop')) {
            // For cDivs with scene positioning
            elementTop = parseFloat(element.getAttribute('data-sceneTop'));
        } else {
            // For rDivs or other elements, use getBoundingClientRect
            const containerRect = container.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            elementTop = elementRect.top - containerRect.top + container.scrollTop;
        }

        // Find header offset within the element
        let headerOffset = 0;
        const headerElement = element.querySelector(headerSelector);
        if (headerElement) {
            const elementRect = element.getBoundingClientRect();
            const headerRect = headerElement.getBoundingClientRect();
            headerOffset = headerRect.top - elementRect.top;
        }

        // Calculate optimal scroll position
        const scrollTarget = Math.max(0, elementTop + headerOffset - this.smoothScrollConfig.topMargin);
        
        window.CONSOLE_LOG_IGNORE(`[DEBUG] SelectionManager.smoothScrollElementIntoView: ${caller} - Element top: ${elementTop}, Header offset: ${headerOffset}, Target: ${scrollTarget}`);

        // Check if already at correct position
        const currentScrollTop = container.scrollTop;
        const scrollDifference = Math.abs(currentScrollTop - scrollTarget);
        if (scrollDifference < this.smoothScrollConfig.tolerance) {
            window.CONSOLE_LOG_IGNORE(`[DEBUG] SelectionManager.smoothScrollElementIntoView: ${caller} - Already positioned (difference: ${scrollDifference}px)`);
            return false;
        }

        // Perform smooth scroll
        container.scrollTo({
            top: scrollTarget,
            behavior: this.smoothScrollConfig.behavior
        });

        window.CONSOLE_LOG_IGNORE(`[DEBUG] SelectionManager.smoothScrollElementIntoView: ${caller} - Smooth scroll initiated`);
        return true;
    }

    /**
     * Configure smooth scrolling behavior
     * @param {Object} config - Configuration object
     */
    configureSmoothScrolling(config = {}) {
        this.smoothScrollConfig = {
            ...this.smoothScrollConfig,
            ...config
        };
        window.CONSOLE_LOG_IGNORE(`[DEBUG] SelectionManager: Smooth scroll config updated:`, this.smoothScrollConfig);
    }
}

export const selectionManager = new SelectionManager(); 