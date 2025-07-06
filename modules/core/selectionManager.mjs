class SelectionManager extends EventTarget {
    constructor() {
        super();
            this.selectedJobNumber = null;
    this.hoveredJobNumber = null;
    }

    selectJobNumber(jobNumber, caller = '') {
        if (this.selectedJobNumber === jobNumber) {
            window.CONSOLE_LOG_IGNORE(`[DEBUG] SelectionManager: Early return - same job already selected: ${jobNumber} from ${caller}`);
            return;
        }

        window.CONSOLE_LOG_IGNORE(`[DEBUG] SelectionManager: [${caller}] Selecting job number: ${jobNumber} (was: ${this.selectedJobNumber})`);
        this.selectedJobNumber = jobNumber;
        const event = new CustomEvent('selectionChanged', {
            detail: {
                selectedJobNumber: this.selectedJobNumber,
                caller: caller
            }
        });
        window.CONSOLE_LOG_IGNORE(`[DEBUG] SelectionManager: Dispatching selectionChanged event:`, event.detail);
        this.dispatchEvent(event);
    }

    clearSelection(caller = '') {
        if (this.selectedJobNumber === null) return;
        
        window.CONSOLE_LOG_IGNORE(`SelectionManager: [${caller}] Clearing selection.`);
        this.selectedJobNumber = null;
        this.dispatchEvent(new CustomEvent('selectionCleared', {
            detail: {
                caller: caller
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
                caller: caller
            }
        }));
    }

    clearHover(caller = '') {
        if (this.hoveredJobNumber === null) return;

        window.CONSOLE_LOG_IGNORE(`SelectionManager: [${caller}] Clearing hover.`);
        this.hoveredJobNumber = null;
        this.dispatchEvent(new CustomEvent('hoverCleared', {
            detail: {
                caller: caller
            }
        }));
    }

    getSelectedJobNumber() {
        return this.selectedJobNumber;
    }

    getHoveredJobNumber() {
        return this.hoveredJobNumber;
    }
}

export const selectionManager = new SelectionManager(); 