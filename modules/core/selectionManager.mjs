class SelectionManager extends EventTarget {
    constructor() {
        super();
        this.selectedJobIndex = null;
        this.hoveredJobIndex = null;
    }

    selectJobIndex(jobIndex, caller = '') {
        if (this.selectedJobIndex === jobIndex) {
            return;
        }

        CONSOLE_LOG_IGNORE(`SelectionManager: [${caller}] Selecting job index: ${jobIndex}`);
        this.selectedJobIndex = jobIndex;
        this.dispatchEvent(new CustomEvent('selectionChanged', {
            detail: {
                selectedJobIndex: this.selectedJobIndex,
                caller: caller
            }
        }));
    }

    clearSelection(caller = '') {
        if (this.selectedJobIndex === null) return;
        
        CONSOLE_LOG_IGNORE(`SelectionManager: [${caller}] Clearing selection.`);
        this.selectedJobIndex = null;
        this.dispatchEvent(new CustomEvent('selectionCleared', {
            detail: {
                caller: caller
            }
        }));
    }

    hoverJobIndex(jobIndex, caller = '') {
        if (this.hoveredJobIndex === jobIndex) return;

        CONSOLE_LOG_IGNORE(`SelectionManager: [${caller}] Hovering job index: ${jobIndex}`);
        this.hoveredJobIndex = jobIndex;
        this.dispatchEvent(new CustomEvent('hoverChanged', {
            detail: {
                hoveredJobIndex: this.hoveredJobIndex,
                caller: caller
            }
        }));
    }

    clearHover(caller = '') {
        if (this.hoveredJobIndex === null) return;

        CONSOLE_LOG_IGNORE(`SelectionManager: [${caller}] Clearing hover.`);
        this.hoveredJobIndex = null;
        this.dispatchEvent(new CustomEvent('hoverCleared', {
            detail: {
                caller: caller
            }
        }));
    }

    getSelectedJobIndex() {
        return this.selectedJobIndex;
    }

    getHoveredJobIndex() {
        return this.hoveredJobIndex;
    }
}

export const selectionManager = new SelectionManager(); 