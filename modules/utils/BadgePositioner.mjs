/**
 * BadgePositioner - Utility for positioning skill badges around cDivs
 * Extracted from SkillBadges.vue to reduce complexity and improve reusability
 */

export class BadgePositioner {
    constructor(badgeHeight = 40) {
        this.badgeHeight = badgeHeight;
    }

    /**
     * Position badges around a selected cDiv using staggered positioning
     * @param {Array} allBadges - All badge elements to position
     * @param {Array} relatedBadges - Badges related to selected job
     * @param {Array} unrelatedBadges - Badges not related to selected job  
     * @param {Object} cDivBounds - cDiv boundaries {top, bottom, centerY}
     * @param {Function} updateCallback - Callback to update Vue reactive data
     * @returns {Object} Statistics about badge distribution
     */
    positionBadges(allBadges, relatedBadges, unrelatedBadges, cDivBounds, updateCallback = null) {
        const { top: cDivTop, bottom: cDivBottom, centerY: cDivCenterY } = cDivBounds;
        const totalBadges = allBadges.length;
        
        // Validate cDiv bounds before positioning
        if (isNaN(cDivCenterY) || cDivCenterY < 0) {
            console.warn(`[BadgePositioner] Invalid cDivCenterY: ${cDivCenterY}, falling back to viewport positioning`);
            this.positionBadgesInViewport(allBadges, updateCallback);
            return { aboveCount: 0, betweenCount: 0, belowCount: 0, badgeCenterYs: [], totalRelated: 0 };
        }
        
        // Use cDiv center directly for all badges
        const centerY = Math.max(200, cDivCenterY); // Ensure minimum distance from top
        
        console.log(`[BadgePositioner] cDiv bounds: top=${cDivTop.toFixed(1)}px, bottom=${cDivBottom.toFixed(1)}px, centerY=${cDivCenterY.toFixed(1)}px`);
        console.log(`[BadgePositioner] Creating ordered list: ${relatedBadges.length} related badges first, then ${unrelatedBadges.length} unrelated badges`);
        
        // Create single ordered list: related badges first, then unrelated badges
        const orderedBadges = [...relatedBadges, ...unrelatedBadges];
        
        // Calculate staggered positions for all badges around center
        const staggeredPositions = this._calculateStaggeredPositions(orderedBadges.length, centerY);
        
        // Create position data mapping for the ordered list
        const positionData = orderedBadges.map((badge, index) => ({
            element: badge,
            position: staggeredPositions[index]
        }));
        
        // If callback provided, use it to update Vue reactive data
        if (updateCallback) {
            updateCallback(positionData);
        } else {
            // Fallback: apply directly to DOM (but this gets overridden by Vue)
            positionData.forEach(({ element, position }, index) => {
                element.style.top = `${position}px`;
                if (index < 3) {
                    console.log(`[BadgePositioner] Badge ${index} (${element.textContent}): positioned at ${position}px (DOM fallback)`);
                }
            });
        }
        
        // Calculate statistics for related badges only
        const stats = this._calculateBadgeStatistics(relatedBadges, cDivTop, cDivBottom);
        
        // Dispatch positioning complete event
        window.dispatchEvent(new CustomEvent('badges-positioned', {
            detail: { 
                selectedJobNumber: this._getSelectedJobNumber(),
                stats
            }
        }));
        
        return stats;
    }

    /**
     * Position badges in viewport when no cDiv is selected
     * @param {Array} allBadges - All badge elements to position
     * @param {Function} updateCallback - Callback to update Vue reactive data
     */
    positionBadgesInViewport(allBadges, updateCallback = null) {
        const sceneContent = document.getElementById('scene-content');
        if (!sceneContent) {
            console.warn('[BadgePositioner] scene-content not found, using viewport positioning');
            const startY = 100;
            const spacing = this.badgeHeight + 10;
            
            const positionData = allBadges.map((badge, index) => ({
                element: badge,
                position: startY + (index * spacing)
            }));
            
            if (updateCallback) {
                updateCallback(positionData);
            } else {
                positionData.forEach(({ element, position }) => {
                    element.style.top = `${position}px`;
                });
            }
            return;
        }
        
        // Get scene-content scroll position and visible area
        const scrollTop = sceneContent.scrollTop;
        const viewportHeight = sceneContent.clientHeight;
        
        // Position badges in the middle of the visible area
        const visibleCenterY = scrollTop + (viewportHeight / 2);
        const startY = Math.max(200, visibleCenterY - ((allBadges.length * this.badgeHeight) / 2));
        const spacing = this.badgeHeight + 10; // Spacing between badges
        
        const positionData = allBadges.map((badge, index) => ({
            element: badge,
            position: startY + (index * spacing)
        }));
        
        if (updateCallback) {
            updateCallback(positionData);
        } else {
            positionData.forEach(({ element, position }) => {
                element.style.top = `${position}px`;
            });
        }
        
        console.log(`[BadgePositioner] Positioned ${allBadges.length} badges in viewport mode (scrollTop=${scrollTop}, startY=${startY})`);
    }

    /**
     * Calculate staggered positions around a center point
     * @private
     */
    _calculateStaggeredPositions(totalBadges, centerBucket) {
        const positions = [];
        let offset = 0;
        
        console.log(`[BadgePositioner] Calculating staggered positions for ${totalBadges} badges around centerBucket=${centerBucket}px`);
        
        for (let i = 0; i < totalBadges; i++) {
            let targetY;
            
            if (i === 0) {
                // First badge goes at center
                targetY = centerBucket;
            } else if (i % 2 === 1) {
                // Odd badges go below center
                offset++;
                targetY = centerBucket + (offset * this.badgeHeight);
            } else {
                // Even badges go above center  
                targetY = centerBucket - (offset * this.badgeHeight);
            }
            
            positions.push(targetY);
            
            // Debug first few positions
            if (i < 5) {
                console.log(`[BadgePositioner] Badge ${i}: targetY=${targetY}px (center=${centerBucket}, offset=${offset})`);
            }
        }
        
        console.log(`[BadgePositioner] Generated ${positions.length} staggered positions:`, positions.slice(0, 5), '...');
        return positions;
    }


    /**
     * Calculate badge distribution statistics
     * @private
     */
    _calculateBadgeStatistics(relatedBadges, cDivTop, cDivBottom) {
        let aboveCount = 0;    // Above cDiv
        let betweenCount = 0;  // Between/within cDiv
        let belowCount = 0;    // Below cDiv
        
        const badgeCenterYs = [];
        
        relatedBadges.forEach(badge => {
            const badgeY = parseFloat(badge.style.top);
            const badgeCenterY = badgeY + 20; // badge height / 2
            
            badgeCenterYs.push(badgeCenterY);
            
            if (badgeCenterY < cDivTop) {
                aboveCount++;
            } else if (badgeCenterY > cDivBottom) {
                belowCount++;
            } else {
                betweenCount++;
            }
        });
        
        return {
            aboveCount,
            betweenCount, 
            belowCount,
            badgeCenterYs,
            totalRelated: relatedBadges.length
        };
    }

    /**
     * Get currently selected job number
     * @private
     */
    _getSelectedJobNumber() {
        const selectedCDiv = document.querySelector('.biz-card-div.selected');
        return selectedCDiv ? parseInt(selectedCDiv.getAttribute('data-job-number'), 10) : null;
    }
}

// Export singleton instance
export const badgePositioner = new BadgePositioner();