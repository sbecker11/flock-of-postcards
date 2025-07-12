/**
 * BadgeManager - Centralized management for all badge-related functionality
 * Follows the SelectionManager pattern for consistency and maintainability
 * 
 * Manages:
 * - Badge visibility modes: 'none' | 'show' | 'stats'
 * - Statistics visibility for selected job elements
 * - Connection lines visibility
 * - State persistence
 * - Event coordination between components
 */

import { AppState, saveState } from './stateManager.mjs';

class BadgeManager extends EventTarget {
    constructor() {
        super();
        
        // Badge mode state: 'none' | 'show' | 'stats'
        this._mode = 'none';
        
        // Initialize from AppState if available
        if (AppState?.badgeToggle?.mode) {
            this._mode = AppState.badgeToggle.mode;
        }
        
        console.log(`[BadgeManager] Initialized with mode: ${this._mode}`);
        
        // Listen for clone creation to update new stats elements
        window.addEventListener('clone-created', this._handleCloneCreated.bind(this));
        
        // Initialize DOM elements on next tick
        setTimeout(() => {
            this._updateAllVisibility();
        }, 0);
    }
    
    /**
     * Get current badge mode
     * @returns {string} Current mode: 'none' | 'show' | 'stats'
     */
    getMode() {
        return this._mode;
    }
    
    /**
     * Set badge mode
     * @param {string} mode - New mode: 'none' | 'show' | 'stats'
     * @param {string} caller - Optional caller identification for debugging
     */
    setMode(mode, caller = '') {
        if (!['none', 'show', 'stats'].includes(mode)) {
            console.warn(`[BadgeManager] Invalid mode: ${mode}`);
            return;
        }
        
        if (this._mode === mode) {
            return; // No change needed
        }
        
        const previousMode = this._mode;
        this._mode = mode;
        
        console.log(`[BadgeManager] ${caller ? `[${caller}] ` : ''}Mode changed from ${previousMode} to ${mode}`);
        
        // Update AppState and persist
        this._saveToAppState();
        
        // Update all visibility states
        this._updateAllVisibility();
        
        // Dispatch event for components that need to react
        this.dispatchEvent(new CustomEvent('badgeModeChanged', {
            detail: {
                mode: this._mode,
                previousMode,
                caller
            }
        }));
    }
    
    /**
     * Toggle badge mode through the cycle: none -> show -> stats -> none
     * @param {string} caller - Optional caller identification for debugging
     */
    toggleMode(caller = 'toggleMode') {
        let nextMode;
        switch (this._mode) {
            case 'none':
                nextMode = 'show';
                break;
            case 'show':
                nextMode = 'stats';
                break;
            case 'stats':
                nextMode = 'none';
                break;
            default:
                nextMode = 'none';
        }
        
        this.setMode(nextMode, caller);
    }
    
    /**
     * Check if badges should be visible
     * @returns {boolean} True if badges should be shown
     */
    isBadgesVisible() {
        return this._mode === 'show' || this._mode === 'stats';
    }
    
    /**
     * Check if connection lines should be visible
     * @returns {boolean} True if connection lines should be shown
     */
    isConnectionLinesVisible() {
        return this._mode === 'show' || this._mode === 'stats';
    }
    
    /**
     * Check if statistics should be visible
     * @returns {boolean} True if statistics should be shown
     */
    isStatsVisible() {
        return this._mode === 'stats';
    }
    
    /**
     * Get the next mode in the cycle (for hover preview)
     * @returns {string} Next mode in cycle
     */
    getNextMode() {
        switch (this._mode) {
            case 'none': return 'show';
            case 'show': return 'stats';
            case 'stats': return 'none';
            default: return 'none';
        }
    }
    
    /**
     * Get display icon for current mode
     * @param {boolean} showNext - If true, return icon for next mode (hover state)
     * @returns {string} Display icon
     */
    getDisplayIcon(showNext = false) {
        const mode = showNext ? this.getNextMode() : this._mode;
        switch (mode) {
            case 'none': return 'B⁰'; // B with superscript zero
            case 'show': return 'B';  // B with no superscript
            case 'stats': return 'B⁺'; // B with superscript plus
            default: return 'B⁰';
        }
    }
    
    /**
     * Get tooltip text for current mode
     * @param {boolean} isHovering - If true, show next mode preview
     * @returns {string} Tooltip text
     */
    getTooltipText(isHovering = false) {
        const currentModeText = {
            'none': 'No badges shown',
            'show': 'Badges visible',
            'stats': 'Badges + statistics for selected job'
        }[this._mode] || 'Unknown mode';
        
        const nextModeText = {
            'none': 'Hide badges',
            'show': 'Show badges only',
            'stats': 'Show badges with statistics'
        }[this.getNextMode()] || 'Unknown mode';
        
        return isHovering 
            ? `Next: ${nextModeText} (click to switch)`
            : `Current: ${currentModeText} (hover to preview next)`;
    }
    
    /**
     * Force refresh of all badge-related visibility
     * Useful when DOM structure changes or elements are added/removed
     */
    refreshVisibility() {
        console.log(`[BadgeManager] Force refreshing visibility for mode: ${this._mode}`);
        this._updateAllVisibility();
    }
    
    /**
     * Check if connection line updates should be allowed
     * This provides centralized control over when connections can be updated
     * @returns {boolean} True if connection updates are allowed
     */
    allowConnectionUpdates() {
        return this.isConnectionLinesVisible();
    }
    
    /**
     * Clear connections if they shouldn't be visible
     * This provides centralized control over connection clearing
     * @param {Array} connectionsRef - Vue ref to the connections array
     */
    clearConnectionsIfNeeded(connectionsRef) {
        if (!this.isConnectionLinesVisible() && connectionsRef.value.length > 0) {
            console.log(`[BadgeManager] Clearing connections - not visible in mode: ${this._mode}`);
            connectionsRef.value = [];
        }
    }
    
    /**
     * Update a specific stats element immediately (for newly created elements)
     * @param {HTMLElement} element - The stats element to update
     */
    updateStatsElement(element) {
        if (!element) return;
        
        const shouldShowStats = this.isStatsVisible();
        
        if (shouldShowStats) {
            element.classList.remove('hidden-by-mode');
            if (element.classList.contains('biz-card-stats-div')) {
                element.style.display = 'block';
            }
        } else {
            element.classList.add('hidden-by-mode');
            if (element.classList.contains('biz-card-stats-div')) {
                element.style.display = 'none';
            }
        }
        
        console.log(`[BadgeManager] Updated individual stats element. Stats visible: ${shouldShowStats}`);
    }
    
    /**
     * Calculate skill badge statistics for a given job
     * Centralized from bizDetailsDivModule.mjs
     * @param {number} jobNumber - The job number to calculate stats for
     * @returns {Object} Statistics object
     */
    calculateSkillBadgeStats(jobNumber) {
        const skillBadges = document.querySelectorAll('.skill-badge');
        const relatedBadges = [];
        
        // Find badges related to this job
        skillBadges.forEach(badge => {
            if (!badge.style.filter || !badge.style.filter.includes('brightness(0.5)')) {
                const badgeY = parseFloat(badge.style.top);
                if (badgeY && badgeY !== 0) {
                    relatedBadges.push(badgeY + 20); // badge center Y
                }
            }
        });
        
        const totalBadges = relatedBadges.length;
        if (totalBadges === 0) {
            return this._getEmptyStats();
        }
        
        // Calculate basic statistics
        const mean = this._calculateMean(relatedBadges);
        const median = this._calculateMedian(relatedBadges);
        const stdDev = this._calculateStdDev(relatedBadges, mean);
        const skewness = this._calculateSkewness(relatedBadges, mean, stdDev);
        
        // Get cDiv bounds for distribution analysis
        const selectedCDiv = document.querySelector('.biz-card-div.selected');
        let cDivTop = 500, cDivBottom = 550, cDivCenterY = 525;
        
        if (selectedCDiv) {
            const rect = selectedCDiv.getBoundingClientRect();
            const container = document.getElementById('scene-content');
            const containerRect = container.getBoundingClientRect();
            const scrollTop = container.scrollTop;
            
            cDivTop = rect.top - containerRect.top + scrollTop;
            cDivBottom = rect.bottom - containerRect.top + scrollTop;
            cDivCenterY = (cDivTop + cDivBottom) / 2;
        }
        
        // Calculate distribution
        const distribution = this._calculateDistribution(relatedBadges, cDivTop, cDivBottom);
        const standardDeviationBuckets = this._calculateStdDevBuckets(relatedBadges, mean, stdDev);
        
        return {
            totalBadges,
            cDivCenterY: cDivCenterY.toFixed(1),
            mean: mean.toFixed(1),
            median: median.toFixed(1),
            stdDev: stdDev.toFixed(1),
            skewness: skewness.toFixed(3),
            ...standardDeviationBuckets,
            ...distribution,
            aboveRatio: distribution.aboveCount > 0 ? (distribution.aboveCount / (distribution.aboveCount + distribution.belowCount)).toFixed(3) : '0.000',
            belowRatio: distribution.belowCount > 0 ? (distribution.belowCount / (distribution.aboveCount + distribution.belowCount)).toFixed(3) : '0.000',
            biasWarning: Math.abs(skewness) > 0.5
        };
    }
    
    // Private statistics calculation methods
    _getEmptyStats() {
        return {
            totalBadges: 0, mean: '0.0', median: '0.0', stdDev: '0.0', skewness: '0.000',
            within1StdDev: 0, between1And2StdDev: 0, between2And3StdDev: 0, beyond3StdDev: 0,
            aboveCount: 0, betweenCount: 0, belowCount: 0,
            aboveRatio: '0.000', belowRatio: '0.000', biasWarning: false
        };
    }
    
    _calculateMean(values) {
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    _calculateMedian(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    }
    
    _calculateStdDev(values, mean) {
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }
    
    _calculateSkewness(values, mean, stdDev) {
        if (stdDev === 0) return 0;
        const n = values.length;
        const sum = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0);
        return (n / ((n - 1) * (n - 2))) * sum;
    }
    
    _calculateDistribution(positions, cDivTop, cDivBottom) {
        let aboveCount = 0, betweenCount = 0, belowCount = 0;
        
        positions.forEach(pos => {
            if (pos < cDivTop) aboveCount++;
            else if (pos > cDivBottom) belowCount++;
            else betweenCount++;
        });
        
        return { aboveCount, betweenCount, belowCount };
    }
    
    _calculateStdDevBuckets(values, mean, stdDev) {
        let within1StdDev = 0, between1And2StdDev = 0, between2And3StdDev = 0, beyond3StdDev = 0;
        
        values.forEach(val => {
            const deviation = Math.abs(val - mean) / stdDev;
            if (deviation <= 1) within1StdDev++;
            else if (deviation <= 2) between1And2StdDev++;
            else if (deviation <= 3) between2And3StdDev++;
            else beyond3StdDev++;
        });
        
        return { within1StdDev, between1And2StdDev, between2And3StdDev, beyond3StdDev };
    }
    
    // Private methods
    
    /**
     * Save current state to AppState and persist
     * @private
     */
    _saveToAppState() {
        if (AppState) {
            if (!AppState.badgeToggle) {
                AppState.badgeToggle = {};
            }
            AppState.badgeToggle.mode = this._mode;
            saveState(AppState);
        }
    }
    
    /**
     * Update all visibility states based on current mode
     * @private
     */
    _updateAllVisibility() {
        this._updateStatsVisibility();
        this._updateBadgeContainerVisibility();
        // Connection lines visibility is handled by components listening to events
    }
    
    /**
     * Update statistics visibility based on current mode
     * @private
     */
    _updateStatsVisibility() {
        const shouldShowStats = this.isStatsVisible();
        
        // Find all skill badge stats elements including those in biz-card-stats-div containers
        const allStatsElements = document.querySelectorAll('.skill-badge-stats, .skill-badge-stats.resume-stats, .biz-card-stats-div .skill-badge-stats, .biz-card-stats-div');
        
        allStatsElements.forEach(statsEl => {
            if (shouldShowStats) {
                statsEl.classList.remove('hidden-by-mode');
            } else {
                statsEl.classList.add('hidden-by-mode');
            }
        });
        
        // Also handle biz-card-stats-div containers specifically
        const bizCardStatsDivs = document.querySelectorAll('.biz-card-stats-div');
        bizCardStatsDivs.forEach(statsDiv => {
            if (shouldShowStats) {
                statsDiv.style.display = 'block';
                statsDiv.classList.remove('hidden-by-mode');
            } else {
                statsDiv.style.display = 'none';
                statsDiv.classList.add('hidden-by-mode');
            }
        });
        
        console.log(`[BadgeManager] Updated ${allStatsElements.length} stats elements and ${bizCardStatsDivs.length} biz-card-stats-divs. Stats visible: ${shouldShowStats}`);
    }
    
    /**
     * Update badge container visibility based on current mode
     * @private
     */
    _updateBadgeContainerVisibility() {
        const shouldShowBadges = this.isBadgesVisible();
        
        // Find skill badge containers
        const badgeContainers = document.querySelectorAll('#skill-badges-container, .skill-badges-container');
        
        badgeContainers.forEach(container => {
            if (shouldShowBadges) {
                container.style.display = 'block';
            } else {
                container.style.display = 'none';
            }
        });
        
        console.log(`[BadgeManager] Updated ${badgeContainers.length} badge containers. Badges visible: ${shouldShowBadges}`);
    }
    
    /**
     * Handle clone creation events
     * @private
     */
    _handleCloneCreated(event) {
        console.log(`[BadgeManager] Clone created, updating stats visibility for new elements`);
        // Small delay to ensure the stats div is added to the clone
        setTimeout(() => {
            this._updateStatsVisibility();
        }, 10);
        
        // Also update immediately in case the delay isn't needed
        this._updateStatsVisibility();
    }
}

// Singleton instance
export const badgeManager = new BadgeManager();