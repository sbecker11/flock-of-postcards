<template>
  <div 
    v-if="shouldShowContainer"
    id="new-connection-lines-container"
    :style="containerStyle"
    class="new-connection-lines"
  >
    <svg 
      id="new-connection-lines-svg"
      :style="svgStyle"
    >
      <path
        v-for="connection in connections"
        :key="connection.id"
        :d="connection.path"
        :stroke="connection.strokeColor"
        :stroke-width="connection.strokeWidth"
        stroke-opacity="0.8"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="connection-line"
      />
      <text
        v-for="connection in connections"
        :key="`text-${connection.id}`"
        :x="connection.textX"
        :y="connection.textY"
        :fill="connection.strokeColor"
        font-family="Arial, sans-serif"
        font-size="12"
        font-weight="bold"
        text-anchor="middle"
        class="connection-number"
      >
        {{ connection.lineNumber }}
      </text>
    </svg>
    
    <!-- Debug info -->
    <div 
      v-if="showDebugInfo"
      :style="debugStyle"
      class="debug-info"
    >
      <div><strong>New Connection Lines ({{ connections.length }})</strong></div>
      <div v-for="(conn, index) in connections" :key="conn.id">
        <div>Badge {{ index + 1 }}: {{ conn.case }} - {{ conn.skillText }}</div>
        <div style="font-size: 10px; color: #ccc;">{{ conn.path }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { TARGET_CDIV_JOB_NUMBER } from "@/modules/constants/targetCDiv.mjs";
import { applyPaletteToElement, applyStateStyling } from '../composables/useColorPalette.mjs';
import { badgeManager } from '@/modules/core/badgeManager.mjs';

export default {
  name: 'NewConnectionLines',
  setup() {
    const connections = ref([]);
    const showDebugInfo = ref(false);
    const lineColor = ref('#9966cc');
    // Reactive visibility state
    const isConnectionLinesVisible = ref(badgeManager.isConnectionLinesVisible());
    
    // Debug logging for visibility and connections
    console.log(`[NewConnectionLines] Initial state - connections: ${connections.value.length}, visible: ${isConnectionLinesVisible.value}`);
    
    // Computed property to track when container should be visible
    const shouldShowContainer = computed(() => {
      const result = connections.value.length > 0 && isConnectionLinesVisible.value;
      console.log(`[NewConnectionLines] Container visibility check - connections: ${connections.value.length}, visible: ${isConnectionLinesVisible.value}, result: ${result}`);
      
      // Additional debug when we expect to see lines but don't
      if (isConnectionLinesVisible.value && connections.value.length === 0) {
        console.warn(`[NewConnectionLines] Badge mode allows connection lines but connections array is empty. Badge mode should be 'show' or 'stats'`);
      }
      
      return result;
    });
    
    // Listen for badge mode changes
    const handleBadgeModeChange = (event) => {
      const shouldBeVisible = badgeManager.isConnectionLinesVisible();
      console.log(`[NewConnectionLines] Badge mode changed to: ${event.detail.mode}, connection lines should be visible: ${shouldBeVisible}`);
      isConnectionLinesVisible.value = shouldBeVisible;
      
      if (shouldBeVisible) {
        // BadgeManager says lines should be visible, trigger update
        console.log(`[NewConnectionLines] BadgeManager allows connection lines, triggering update`);
        debouncedUpdateConnections(200, 'badge-mode-change');
      } else {
        // BadgeManager says lines shouldn't be visible, let it clear them
        console.log(`[NewConnectionLines] BadgeManager doesn't allow connection lines, clearing if needed`);
        badgeManager.clearConnectionsIfNeeded(connections);
      }
    };
    
    badgeManager.addEventListener('badgeModeChanged', handleBadgeModeChange);
    
    // Debouncing mechanism to prevent rapid connection updates
    let updateConnectionsTimeoutId = null;
    let isUpdatingConnections = false;
    
    // Create L-shaped curve based on the specification
    const createLShapedCurve = (pointA, pointB, pointC, radius = 30) => {
      // Validate input constraints
      if (pointB.y !== pointA.y || pointC.x !== pointB.x) {
        throw new Error('Point B must have same y as Point A, and Point C must have same x as Point B');
      }

      // Determine direction of curve based on relative positions
      const isMovingRight = pointB.x > pointA.x;
      const isMovingDown = pointC.y > pointB.y;

      // Calculate control points for the arc
      const arcStartX = isMovingRight ? pointB.x - radius : pointB.x + radius;
      const arcStartY = pointB.y;
      const arcEndX = pointB.x;
      const arcEndY = isMovingDown ? pointB.y + radius : pointB.y - radius;

      // Build SVG path
      const path = [
        `M ${pointA.x} ${pointA.y}`, // Start at point A
        `H ${arcStartX}`, // Horizontal line to arc start
        `A ${radius} ${radius} 0 0 ${isMovingRight && isMovingDown || !isMovingRight && !isMovingDown ? 1 : 0} ${arcEndX} ${arcEndY}`, // 90-degree arc
        `V ${pointC.y}` // Vertical line to point C
      ];

      return path.join(' ');
    };

    // Create horizontal line
    const createHorizontalLine = (pointA, pointB) => {
      // Validate that points share the same y-coordinate
      if (pointA.y !== pointB.y) {
        throw new Error('Points A and B must have the same y-coordinate');
      }

      // Build SVG path
      return `M ${pointA.x} ${pointA.y} H ${pointB.x}`;
    };

    // Create connection line for a single badge to cDiv with proper termination points
    const createConnectionLine = (badgePos, cDivPos, badgeIndex, skillText, caseIndex, totalCaseCount, lineType, lineNumber, allBadgePositions) => {
      const badgeCenterY = badgePos.y + badgePos.height / 2;
      const cDivTop = cDivPos.y;
      const cDivBottom = cDivPos.y + cDivPos.height;
      const cDivLeft = cDivPos.x;
      const cDivRight = cDivPos.x + cDivPos.width;
      const cDivWidth = cDivPos.width;
      
      // Calculate the actual left edge of the badge for connection point
      // The badge left edge should be where the curve starts (left edge, center Y)
      // CONSTRAINT: Never allow connection lines to extend beyond cDiv's left edge
      const badgeLeftEdge = Math.max(badgePos.x, cDivLeft);
      
      console.log(`[DEBUG] Connection calculation for badge ${badgeIndex}:`, {
        badgePos,
        badgeCenterY,
        originalBadgeX: badgePos.x,
        constrainedBadgeLeftEdge: badgeLeftEdge,
        cDivLeft,
        cDivPos,
        cDivTop,
        cDivBottom,
        connectionConstraintApplied: badgePos.x < cDivLeft,
        cDivCornerRadius: 25
      });
      
      let path;
      let pathCase;
      
      if (badgeCenterY < cDivTop) {
        // Case 1: Badge above cDiv - highest badges (lowest Y) get leftmost termination
        pathCase = 'ABOVE';
        const spacing = cDivWidth / totalCaseCount;
        // Direct index: highest badges (lowest Y, caseIndex=0) get leftmost, lowest badges (highest Y) get rightmost
        const terminationX = cDivLeft + (spacing * (caseIndex + 0.5)); // Center within each segment
        // CONSTRAINT: Ensure termination doesn't go beyond cDiv left edge
        const constrainedTerminationX = Math.max(terminationX, cDivLeft);
        // CONSTRAINT: Ensure starting point doesn't go beyond cDiv left edge
        const constrainedBadgeLeftEdge = Math.max(badgeLeftEdge, cDivLeft);
        
        // FIX: Extend termination to account for cDiv corner radius (assume 25px based on CSS)
        const cornerRadius = 25;
        const terminationY = cDivTop + cornerRadius;
        
        const pointA = { x: constrainedBadgeLeftEdge, y: badgeCenterY };
        const pointB = { x: constrainedTerminationX, y: badgeCenterY };
        
        // FIX: Skip vertical segment if curve endpoint would be below cDiv top edge
        if (badgeCenterY > terminationY) {
          // Curve endpoint is below cDiv top + radius, so create horizontal line only
          console.log(`[DEBUG] Badge ${badgeIndex} ABOVE: Using horizontal line (badgeCenterY ${badgeCenterY} > terminationY ${terminationY})`);
          const pointBEnd = { x: constrainedTerminationX, y: badgeCenterY };
          path = createHorizontalLine(pointA, pointBEnd);
        } else {
          // Normal L-curve terminating at cDiv top + corner radius
          console.log(`[DEBUG] Badge ${badgeIndex} ABOVE: Using L-curve (badgeCenterY ${badgeCenterY} <= terminationY ${terminationY})`);
          const pointC = { x: constrainedTerminationX, y: terminationY };
          path = createLShapedCurve(pointA, pointB, pointC, 30);
        }
        
      } else if (badgeCenterY > cDivBottom) {
        // Case 2: Badge below cDiv - distribute with lowest badges furthest left
        pathCase = 'BELOW';
        const spacing = cDivWidth / totalCaseCount;
        // Reverse the index: highest badges (lowest Y) get rightmost, lowest badges (highest Y) get leftmost
        const reversedIndex = totalCaseCount - 1 - caseIndex;
        const terminationX = cDivLeft + (spacing * (reversedIndex + 0.5)); // Center within each segment
        // CONSTRAINT: Ensure termination doesn't go beyond cDiv left edge
        const constrainedTerminationX = Math.max(terminationX, cDivLeft);
        // CONSTRAINT: Ensure starting point doesn't go beyond cDiv left edge
        const constrainedBadgeLeftEdge = Math.max(badgeLeftEdge, cDivLeft);
        
        // FIX: Extend termination to account for cDiv corner radius (assume 25px based on CSS)
        const cornerRadius = 25;
        const terminationY = cDivBottom - cornerRadius;
        
        const pointA = { x: constrainedBadgeLeftEdge, y: badgeCenterY };
        const pointB = { x: constrainedTerminationX, y: badgeCenterY };
        
        // FIX: Skip vertical segment if curve endpoint would be above cDiv bottom edge
        if (badgeCenterY < terminationY) {
          // Curve endpoint is above cDiv bottom - radius, so create horizontal line only
          console.log(`[DEBUG] Badge ${badgeIndex} BELOW: Using horizontal line (badgeCenterY ${badgeCenterY} < terminationY ${terminationY})`);
          const pointBEnd = { x: constrainedTerminationX, y: badgeCenterY };
          path = createHorizontalLine(pointA, pointBEnd);
        } else {
          // Normal L-curve terminating at cDiv bottom - corner radius
          console.log(`[DEBUG] Badge ${badgeIndex} BELOW: Using L-curve (badgeCenterY ${badgeCenterY} >= terminationY ${terminationY})`);
          const pointC = { x: constrainedTerminationX, y: terminationY };
          path = createLShapedCurve(pointA, pointB, pointC, 30);
        }
        
      } else {
        // Case 3: Badge at cDiv level - horizontal line to right edge at badge's Y level
        pathCase = 'LEVEL';
        // CONSTRAINT: Ensure horizontal line doesn't extend beyond cDiv left edge
        const constrainedStartX = Math.max(badgeLeftEdge, cDivLeft);
        const pointA = { x: constrainedStartX, y: badgeCenterY };
        const pointB = { x: cDivRight, y: badgeCenterY };
        path = createHorizontalLine(pointA, pointB);
        
      }
      
      // Set color based on connection case
      let strokeColor;
      if (pathCase === 'ABOVE') {
        strokeColor = '#9966cc'; // Purple for above
      } else if (pathCase === 'BELOW') {
        strokeColor = '#9966cc'; // Purple for below
      } else if (pathCase === 'LEVEL') {
        strokeColor = '#ff8800'; // Orange for between/level
      }
      
      // Calculate optimal X position: halfway between cDiv right edge and leftmost edge of widest badge
      // Find the badge with the greatest width
      let maxBadgeWidth = 0;
      let leftmostBadgeX = Infinity;
      
      allBadgePositions.forEach(pos => {
        if (pos.width > maxBadgeWidth) {
          maxBadgeWidth = pos.width;
          leftmostBadgeX = pos.x; // Left edge of the widest badge
        }
      });
      
      // If no badges found, fallback to a reasonable position
      if (leftmostBadgeX === Infinity) {
        leftmostBadgeX = cDivRight + 100; // Fallback position
      }
      
      // Calculate halfway point between cDiv right edge and left edge of widest badge
      const fixedTextX = cDivRight + (leftmostBadgeX - cDivRight) / 2;
      let textX, textY;
      
      if (pathCase === 'ABOVE') {
        // Fixed X position for vertical alignment
        textX = fixedTextX;
        textY = badgeCenterY - 5; // Slightly above the horizontal line
      } else if (pathCase === 'BELOW') {
        // Fixed X position for vertical alignment
        textX = fixedTextX;
        textY = badgeCenterY - 5; // Slightly above the horizontal line
      } else {
        // LEVEL: Fixed X position for vertical alignment
        textX = fixedTextX;
        textY = badgeCenterY - 5; // Slightly above the horizontal line
      }
      
      return {
        id: `new-connection-${badgeIndex}`,
        path,
        case: pathCase,
        skillText,
        strokeWidth: 3,
        strokeColor,
        lineNumber,
        textX,
        textY
      };
    };

    // Get element position using viewport coordinates
    const getElementPosition = (element) => {
      if (!element) return null;
      
      const sceneContent = document.getElementById('scene-content');
      if (!sceneContent) return null;
      
      const elementRect = element.getBoundingClientRect();
      const sceneRect = sceneContent.getBoundingClientRect();
      
      // Account for scroll position within scene-content
      const scrollTop = sceneContent.scrollTop;
      const scrollLeft = sceneContent.scrollLeft;
      
      const position = {
        x: elementRect.left - sceneRect.left + scrollLeft,
        y: elementRect.top - sceneRect.top + scrollTop,
        width: elementRect.width,
        height: elementRect.height
      };
      
      // Debug logging disabled to reduce console spam
      // if (element.classList.contains('skill-badge')) {
      //   console.log(`[DEBUG] Badge position calculation:`, { badgeId: element.id, finalPosition: position });
      // }
      
      return position;
    };

    // Wait for badges-positioned event or fall back to stability checking
    const waitForBadgePositioning = () => {
      return new Promise((resolve) => {
        let eventReceived = false;
        
        // First try: listen for the badges-positioned event
        const handleBadgesPositioned = (event) => {
          if (eventReceived) return;
          eventReceived = true;
          console.log('[NewConnectionLines] Received badges-positioned event, proceeding with connections');
          window.removeEventListener('badges-positioned', handleBadgesPositioned);
          resolve(true);
        };
        
        window.addEventListener('badges-positioned', handleBadgesPositioned);
        
        // Fallback: use stability checking if event doesn't fire within reasonable time
        setTimeout(() => {
          if (eventReceived) return;
          
          console.log('[NewConnectionLines] No badges-positioned event received, falling back to stability checking');
          window.removeEventListener('badges-positioned', handleBadgesPositioned);
          
          const skillBadgesContainer = document.getElementById('skill-badges-container');
          if (!skillBadgesContainer) {
            console.log('[NewConnectionLines] Skill badges container not found');
            resolve(false);
            return;
          }

          let stabilityCheckCount = 0;
          const requiredStabilityChecks = 2; // Reduced from 3 for faster response
          let lastPositions = new Map();
          
          const checkBadgeStability = () => {
            if (eventReceived) return; // Stop if event was received
            
            const skillBadges = document.querySelectorAll('.skill-badge');
            const currentPositions = new Map();
            let relevantBadges = 0;
            let validPositions = 0;
            
            skillBadges.forEach((badge, index) => {
              // Skip dimmed badges
              if (badge.style.filter?.includes('brightness(0.5)')) return;
              
              relevantBadges++;
              const topValue = badge.style.top;
              const rect = badge.getBoundingClientRect();
              
              if (topValue && topValue !== '0px' && rect.width > 0 && rect.height > 0) {
                validPositions++;
                currentPositions.set(index, {
                  top: topValue,
                  x: rect.left,
                  y: rect.top
                });
              }
            });
            
            console.log(`[NewConnectionLines] Badge stability check: ${validPositions}/${relevantBadges} badges positioned`);
            
            // Check if we have enough valid badges and positions are stable
            if (validPositions > 0 && validPositions === relevantBadges) {
              // Compare with last positions to check stability
              let positionsStable = lastPositions.size > 0;
              if (positionsStable) {
                for (let [index, pos] of currentPositions) {
                  const lastPos = lastPositions.get(index);
                  if (!lastPos || lastPos.top !== pos.top || Math.abs(lastPos.x - pos.x) > 1 || Math.abs(lastPos.y - pos.y) > 1) {
                    positionsStable = false;
                    break;
                  }
                }
              }
              
              if (positionsStable) {
                stabilityCheckCount++;
                console.log(`[NewConnectionLines] Badge positions stable (${stabilityCheckCount}/${requiredStabilityChecks})`);
                
                if (stabilityCheckCount >= requiredStabilityChecks) {
                  console.log('[NewConnectionLines] Badge positioning completed and stable via fallback!');
                  resolve(true);
                  return;
                }
              } else {
                stabilityCheckCount = 0; // Reset counter if positions changed
              }
              
              lastPositions = new Map(currentPositions);
            } else {
              stabilityCheckCount = 0; // Reset counter if not all badges positioned
            }
            
            // Continue checking
            setTimeout(checkBadgeStability, 50); // Faster checking
          };
          
          // Start checking
          checkBadgeStability();
        }, 300); // Wait 300ms for the event before falling back
        
        // Absolute timeout after 3 seconds
        setTimeout(() => {
          if (eventReceived) return;
          eventReceived = true;
          window.removeEventListener('badges-positioned', handleBadgesPositioned);
          console.log('[NewConnectionLines] Badge positioning timeout - proceeding anyway');
          resolve(false);
        }, 3000);
      });
    };

    // Validate badge positioning - ensure badges have proper style.top values
    const validateBadgePositioning = () => {
      const skillBadges = document.querySelectorAll('.skill-badge');
      let validBadges = 0;
      let totalBadges = skillBadges.length;
      
      skillBadges.forEach(badge => {
        const topValue = badge.style.top;
        if (topValue && topValue !== '0px' && !badge.style.filter?.includes('brightness(0.5)')) {
          validBadges++;
        }
      });
      
      console.log(`[NewConnectionLines] Badge validation: ${validBadges}/${totalBadges} badges have valid positioning`);
      return validBadges > 0 && validBadges === totalBadges - document.querySelectorAll('.skill-badge[style*="brightness(0.5)"]').length;
    };

    // Debounced version of updateConnections to prevent flashing
    const debouncedUpdateConnections = (delay = 100, reason = 'unknown') => {
      // Don't update if BadgeManager doesn't allow connection updates
      if (!badgeManager.allowConnectionUpdates()) {
        console.log(`[NewConnectionLines] Skipping update (${reason}) - BadgeManager doesn't allow connection updates`);
        return;
      }
      
      // Clear any existing timeout
      if (updateConnectionsTimeoutId) {
        clearTimeout(updateConnectionsTimeoutId);
      }
      
      // If already updating, just schedule another update
      if (isUpdatingConnections) {
        console.log(`[NewConnectionLines] Delaying update (${reason}) - already updating`);
        updateConnectionsTimeoutId = setTimeout(() => {
          debouncedUpdateConnections(delay, `delayed-${reason}`);
        }, delay);
        return;
      }
      
      console.log(`[NewConnectionLines] Scheduling debounced update (${reason}) with ${delay}ms delay`);
      updateConnectionsTimeoutId = setTimeout(() => {
        updateConnections(reason);
      }, delay);
    };

    // Refresh the clone of the selected cDiv
    const refreshSelectedClone = async () => {
      try {
        // Find the selected cDiv clone
        const selectedClone = document.querySelector('.biz-card-div.selected[id*="-clone"]');
        if (selectedClone) {
          console.log(`[NewConnectionLines] Refreshing clone ${selectedClone.id}`);
          
          // Re-apply palette to ensure visual consistency
          await applyPaletteToElement(selectedClone);
          
          // Re-apply selected state styling
          applyStateStyling(selectedClone, 'selected');
          
          console.log(`[NewConnectionLines] Clone ${selectedClone.id} refreshed successfully`);
        } else {
          console.log('[NewConnectionLines] No selected clone found to refresh');
        }
      } catch (error) {
        console.error('[NewConnectionLines] Error refreshing selected clone:', error);
      }
    };

    // Update connections for any selected cDiv
    const updateConnections = async (reason = 'unknown') => {
      if (isUpdatingConnections) {
        console.log(`[NewConnectionLines] Skipping update (${reason}) - already in progress`);
        return;
      }
      
      // Double-check that BadgeManager allows connection updates
      if (!badgeManager.allowConnectionUpdates()) {
        console.log(`[NewConnectionLines] Aborting update (${reason}) - BadgeManager doesn't allow connection updates`);
        return;
      }
      
      isUpdatingConnections = true;
      console.log(`[NewConnectionLines] Starting connection update (${reason})`);
      
      try {
      // Clear connections array - this is necessary to rebuild them
      connections.value = [];
      
      // Find the selected cDiv - prefer original over clone
      let selectedCDiv = document.querySelector('.biz-card-div.selected:not([id*="-clone"])');
      if (!selectedCDiv) {
        // Fallback to any selected cDiv including clones
        selectedCDiv = document.querySelector('.biz-card-div.selected');
      }
      
      if (!selectedCDiv) {
        console.log('[NewConnectionLines] No selected cDiv found - clearing connections');
        connections.value = [];
        return;
      }
      
      // console.log('[NewConnectionLines] Waiting for badge positioning to complete...');
      const badgesReady = await waitForBadgePositioning();
      
      if (!badgesReady) {
        // console.log('[NewConnectionLines] Badge positioning not optimal, but proceeding');
      }
      
      const cDivPos = getElementPosition(selectedCDiv);
      if (!cDivPos) {
        console.log('[NewConnectionLines] Could not get cDiv position');
        return;
      }
      
      // Debug cDiv position calculation
      console.log('[NewConnectionLines] cDiv position details:', {
        selectedCDivId: selectedCDiv.id,
        selectedCDivClasses: selectedCDiv.className,
        cDivPos,
        elementRect: selectedCDiv.getBoundingClientRect(),
        sceneContentRect: document.getElementById('scene-content')?.getBoundingClientRect()
      });
      
      // Validate cDiv has reasonable dimensions
      if (cDivPos.width <= 0 || cDivPos.height <= 0) {
        console.warn('[NewConnectionLines] cDiv has invalid dimensions, skipping connection lines:', cDivPos);
        return;
      }
      
      // Validate cDiv position is reasonable (not negative coordinates unless intentional)
      if (cDivPos.x < -1000 || cDivPos.y < -1000) {
        console.warn('[NewConnectionLines] cDiv has suspicious coordinates, skipping connection lines:', cDivPos);
        return;
      }
      
      // Ensure cDiv has proper bounds defined
      const cDivLeft = cDivPos.x;
      const cDivTop = cDivPos.y;
      const cDivRight = cDivPos.x + cDivPos.width;
      const cDivBottom = cDivPos.y + cDivPos.height;
      const cDivWidth = cDivPos.width;
      const cDivHeight = cDivPos.height;
      
      // Validate all bounds are properly defined (not NaN or undefined)
      if (isNaN(cDivLeft) || isNaN(cDivTop) || isNaN(cDivRight) || isNaN(cDivBottom) || 
          isNaN(cDivWidth) || isNaN(cDivHeight)) {
        console.warn('[NewConnectionLines] cDiv bounds contain invalid values:', {
          left: cDivLeft, top: cDivTop, right: cDivRight, bottom: cDivBottom,
          width: cDivWidth, height: cDivHeight
        });
        return;
      }
      
      // Log validated cDiv bounds
      console.log('[NewConnectionLines] Validated cDiv bounds:', {
        left: cDivLeft, top: cDivTop, right: cDivRight, bottom: cDivBottom,
        width: cDivWidth, height: cDivHeight
      });
      
      // Find all skill badges that are not dimmed (related to cDiv 5)
      const skillBadges = document.querySelectorAll('.skill-badge');
      const relevantBadges = [];
      
      skillBadges.forEach((badge, index) => {
        const badgePos = getElementPosition(badge);
        if (!badgePos) {
          // console.log(`[NewConnectionLines] Could not get position for badge ${index}`);
          return;
        }
        
        // Validate badge has reasonable coordinates
        if (badgePos.x <= 0 || badgePos.y <= 0) {
          // console.log(`[NewConnectionLines] Badge ${index} has invalid coordinates:`, badgePos);
          return;
        }
        
        // Check if this badge is related to the active job (not dimmed)
        const isDimmed = badge.style.filter && badge.style.filter.includes('brightness(0.5)');
        if (isDimmed) {
          return;
        }
        relevantBadges.push({ badge, badgePos, index });
      });
      
      if (relevantBadges.length === 0) {
        return;
      }
      
      // First pass: categorize badges by case type
      const case1Badges = []; // ABOVE
      const case2Badges = []; // BELOW  
      const case3Badges = []; // LEVEL
      
      relevantBadges.forEach((badgeInfo) => {
        const { badgePos, badge } = badgeInfo;
        const badgeCenterY = badgePos.y + badgePos.height / 2;
        const cDivTop = cDivPos.y;
        const cDivBottom = cDivPos.y + cDivPos.height;
        
        let category;
        if (badgeCenterY < cDivTop) {
          case1Badges.push(badgeInfo);
          category = 'ABOVE';
        } else if (badgeCenterY > cDivBottom) {
          case2Badges.push(badgeInfo);
          category = 'BELOW';
        } else {
          case3Badges.push(badgeInfo);
          category = 'WITHIN';
        }
        
        // Debug individual badge categorization if needed
        // console.log(`[NewConnectionLines] Badge "${badge.textContent.trim()}" CenterY=${badgeCenterY.toFixed(1)} cDivTop=${cDivTop.toFixed(1)} cDivBottom=${cDivBottom.toFixed(1)} -> ${category}`);
      });
      
      // Sort case1 and case2 badges by Y position (lowest Y first, highest Y last)
      // This ensures proper ordering for the termination distribution
      case1Badges.sort((a, b) => {
        const aY = a.badgePos.y + a.badgePos.height / 2;
        const bY = b.badgePos.y + b.badgePos.height / 2;
        return aY - bY;
      });
      
      case2Badges.sort((a, b) => {
        const aY = a.badgePos.y + a.badgePos.height / 2;
        const bY = b.badgePos.y + b.badgePos.height / 2;
        return aY - bY;
      });
      
      // Sort case3 badges (LEVEL/between) by Y position (top to bottom)
      case3Badges.sort((a, b) => {
        const aY = a.badgePos.y + a.badgePos.height / 2;
        const bY = b.badgePos.y + b.badgePos.height / 2;
        return aY - bY;
      });
      
      // Second pass: create connections with proper case-specific indexing
      const newConnections = [];
      let actualAboveCount = 0;
      let actualBelowCount = 0;
      let actualBetweenCount = 0;
      
      // Extract all badge positions for optimal text positioning
      const allBadgePositions = relevantBadges.map(b => b.badgePos);
      
      // Process case1 badges (ABOVE) - these are above
      case1Badges.forEach((badgeInfo, caseIndex) => {
        const { badge, badgePos, index } = badgeInfo;
        const skillText = badge.textContent.trim();
        const connection = createConnectionLine(badgePos, { x: cDivLeft, y: cDivTop, width: cDivWidth, height: cDivHeight, right: cDivRight, bottom: cDivBottom }, index, skillText, caseIndex, case1Badges.length, 'ABOVE', caseIndex + 1, allBadgePositions);
        newConnections.push(connection);
        actualAboveCount++; // Above cDiv
      });
      
      // Process case2 badges (BELOW) - these are below
      case2Badges.forEach((badgeInfo, caseIndex) => {
        const { badge, badgePos, index } = badgeInfo;
        const skillText = badge.textContent.trim();
        const connection = createConnectionLine(badgePos, { x: cDivLeft, y: cDivTop, width: cDivWidth, height: cDivHeight, right: cDivRight, bottom: cDivBottom }, index, skillText, caseIndex, case2Badges.length, 'BELOW', caseIndex + 1, allBadgePositions);
        newConnections.push(connection);
        actualBelowCount++; // Below cDiv
      });
      
      // Process case3 badges (LEVEL) - these are between
      case3Badges.forEach((badgeInfo, caseIndex) => {
        const { badge, badgePos, index } = badgeInfo;
        const skillText = badge.textContent.trim();
        const connection = createConnectionLine(badgePos, { x: cDivLeft, y: cDivTop, width: cDivWidth, height: cDivHeight, right: cDivRight, bottom: cDivBottom }, index, skillText, caseIndex, case3Badges.length, 'LEVEL', caseIndex + 1, allBadgePositions);
        newConnections.push(connection);
        actualBetweenCount++; // Level with/between cDiv
      });
      
      connections.value = newConnections;
      
      // Summary comparison for debugging
      console.log(`[NewConnectionLines] cDiv boundaries: top=${cDivPos.y.toFixed(1)} bottom=${(cDivPos.y + cDivPos.height).toFixed(1)} height=${cDivPos.height.toFixed(1)}`);
      console.log(`[NewConnectionLines] Badge centers: ${relevantBadges.map(b => (b.badgePos.y + b.badgePos.height/2).toFixed(1)).join(', ')}`);
      
      // Dispatch event with actual type counts for statistics
      const currentSelectedCDiv = document.querySelector('.biz-card-div.selected');
      if (currentSelectedCDiv) {
        const jobNumber = parseInt(currentSelectedCDiv.getAttribute('data-job-number'));
        window.dispatchEvent(new CustomEvent('connection-types-counted', {
          detail: { 
            jobNumber,
            aboveCount: actualAboveCount,
            betweenCount: actualBetweenCount,
            belowCount: actualBelowCount,
            totalConnections: newConnections.length
          }
        }));
        console.log(`[NewConnectionLines] Final counts: ${actualAboveCount} above, ${actualBetweenCount} between, ${actualBelowCount} below (total: ${newConnections.length})`);
      }
      
      // Refresh the clone of the selected cDiv after rendering connector lines
      await refreshSelectedClone();
      
      } catch (error) {
        console.error(`[NewConnectionLines] Error during connection update (${reason}):`, error);
      } finally {
        isUpdatingConnections = false;
        console.log(`[NewConnectionLines] Completed connection update (${reason})`);
      }
    };

    // Event handlers
    const handleCardSelect = (event) => {
      const jobNumber = parseInt(event.detail.jobNumber);
      debouncedUpdateConnections(250, `card-select-${jobNumber}`);
    };

    const handleCardDeselect = () => {
      console.log('[NewConnectionLines] Card deselected - clearing connections');
      // Always clear connections when no card is selected
      connections.value = [];
      
      // Clear any pending updates since there's no selection
      if (updateConnectionsTimeoutId) {
        clearTimeout(updateConnectionsTimeoutId);
        updateConnectionsTimeoutId = null;
      }
    };

    // Handle viewport resize - re-render curves when viewport changes
    const handleViewportResize = () => {
      // Only re-render if there are active connections
      if (connections.value.length > 0) {
        debouncedUpdateConnections(150, 'viewport-resize');
      }
    };

    // Styles - position relative to scene-content (same as badges)
    const containerStyle = computed(() => ({
      position: 'absolute',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      pointerEvents: 'none',
      zIndex: '98'
    }));

    const svgStyle = computed(() => ({
      position: 'absolute',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      pointerEvents: 'none',
      overflow: 'visible',
      // Remove debug styling
    }));

    const debugStyle = computed(() => ({
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      pointerEvents: 'auto',
      zIndex: '101',
      minWidth: '200px'
    }));

    // Define event handlers outside onMounted for proper cleanup
    const handleSkillBadgesReady = () => {
      console.log('[NewConnectionLines] Skill badges initialization ready, checking for selected cDiv');
      const selectedCDiv = document.querySelector('.biz-card-div.selected');
      if (selectedCDiv) {
        debouncedUpdateConnections(150, 'skill-badges-ready');
      }
    };
    
    const handleCloneCreated = () => {
      console.log('[NewConnectionLines] Clone created');
      debouncedUpdateConnections(100, 'clone-created');
    };
    
    const handleBadgesPositioned = (event) => {
      const jobNumber = event.detail?.jobNumber;
      console.log(`[NewConnectionLines] Badges positioned event received for job ${jobNumber}`);
      
      // Check if there's a selected cDiv and update connections
      const selectedCDiv = document.querySelector('.biz-card-div.selected');
      if (selectedCDiv) {
        const selectedJobNumber = parseInt(selectedCDiv.getAttribute('data-job-number'));
        if (jobNumber === selectedJobNumber) {
          console.log('[NewConnectionLines] Scheduling update for matching job number');
          debouncedUpdateConnections(75, `badges-positioned-${jobNumber}`);
        }
      }
    };

    onMounted(() => {
      // Force refresh visibility state after mount to ensure proper initialization
      setTimeout(() => {
        isConnectionLinesVisible.value = badgeManager.isConnectionLinesVisible();
        console.log(`[NewConnectionLines] Force refreshed visibility state: ${isConnectionLinesVisible.value}`);
        console.log(`[NewConnectionLines] Badge mode: ${badgeManager.getMode()}`);
      }, 50);
      
      window.addEventListener('card-select', handleCardSelect);
      window.addEventListener('card-deselect', handleCardDeselect);
      
      // Listen for viewport resize events to re-render curves
      window.addEventListener('viewport-changed', handleViewportResize);
      window.addEventListener('resize', handleViewportResize);
      
      // Listen for initialization and clone creation events
      window.addEventListener('skill-badges-init-ready', handleSkillBadgesReady);
      window.addEventListener('clone-created', handleCloneCreated);
      
      // Listen for badges-positioned event
      window.addEventListener('badges-positioned', handleBadgesPositioned);
      
      // Handle post-load state - check if there's already a selected cDiv
      // Use debounced updates for initial checks
      setTimeout(() => {
        const selectedCDiv = document.querySelector('.biz-card-div.selected');
        if (selectedCDiv) {
          console.log('[NewConnectionLines] Found selected cDiv on mount');
          debouncedUpdateConnections(200, 'mount-initial');
        } else {
          console.log('[NewConnectionLines] No selected cDiv found on mount');
          // Check if there should be a selected job from app state
          const jobNumber = 3; // From app_state.json selectedJobNumber
          const jobCard = document.querySelector(`[data-job-number="${jobNumber}"]`);
          if (jobCard && !jobCard.classList.contains('selected')) {
            console.log(`[NewConnectionLines] Found job card ${jobNumber} but not selected, attempting selection`);
            jobCard.click();
          }
        }
      }, 100);
      
      // Additional check after a longer delay to ensure everything is fully rendered
      setTimeout(() => {
        const selectedCDiv = document.querySelector('.biz-card-div.selected');
        if (selectedCDiv && connections.value.length === 0) {
          console.log('[NewConnectionLines] Re-checking selected cDiv after longer delay');
          debouncedUpdateConnections(300, 'mount-delayed');
        }
      }, 500);
      
      // Final check after an even longer delay for hard page resets
      setTimeout(() => {
        const selectedCDiv = document.querySelector('.biz-card-div.selected');
        if (selectedCDiv && connections.value.length === 0) {
          console.log('[NewConnectionLines] Final check after page load');
          debouncedUpdateConnections(400, 'mount-final');
        }
      }, 1000);
      
      // Additional safety net specifically for hard page refresh badge positioning
      setTimeout(() => {
        const selectedCDiv = document.querySelector('.biz-card-div.selected');
        if (selectedCDiv && connections.value.length === 0) {
          console.log('[NewConnectionLines] Hard page refresh safety net - final attempt');
          // Force badge validation and retry
          const skillBadges = document.querySelectorAll('.skill-badge:not([style*="brightness(0.5)"])');
          console.log(`[NewConnectionLines] Found ${skillBadges.length} non-dimmed badges for final attempt`);
          if (skillBadges.length > 0) {
            debouncedUpdateConnections(500, 'mount-safety-net');
          }
        }
      }, 1500);
      
      // Add debug helper to window for troubleshooting
      window.debugConnectionLines = () => {
        console.log('[NewConnectionLines] Debug status:');
        console.log('- Badge mode:', badgeManager.getMode());
        console.log('- Connection lines visible:', badgeManager.isConnectionLinesVisible());
        console.log('- Component visibility state:', isConnectionLinesVisible.value);
        console.log('- Should show container:', shouldShowContainer.value);
        console.log('- Connections count:', connections.value.length);
        console.log('- Selected cDiv:', document.querySelector('.biz-card-div.selected'));
        console.log('- Skill badges count:', document.querySelectorAll('.skill-badge').length);
        console.log('- Non-dimmed badges:', document.querySelectorAll('.skill-badge:not([style*="brightness(0.5)"])').length);
        
        // Force update
        console.log('Forcing connection update...');
        debouncedUpdateConnections(100, 'debug-manual');
      };
    });

    onUnmounted(() => {
      window.removeEventListener('card-select', handleCardSelect);
      window.removeEventListener('card-deselect', handleCardDeselect);
      window.removeEventListener('viewport-changed', handleViewportResize);
      window.removeEventListener('resize', handleViewportResize);
      window.removeEventListener('skill-badges-init-ready', handleSkillBadgesReady);
      window.removeEventListener('clone-created', handleCloneCreated);
      window.removeEventListener('badges-positioned', handleBadgesPositioned);
      badgeManager.removeEventListener('badgeModeChanged', handleBadgeModeChange);
    });

    return {
      connections,
      showDebugInfo,
      lineColor,
      isConnectionLinesVisible,
      shouldShowContainer,
      containerStyle,
      svgStyle,
      debugStyle
    };
  }
};
</script>

<style scoped>
.new-connection-lines {
  pointer-events: none;
}

.connection-line {
  transition: stroke-width 0.2s ease, stroke-opacity 0.2s ease;
}

.connection-line:hover {
  stroke-width: 4;
  stroke-opacity: 1;
}

.debug-info {
  font-size: 12px;
  line-height: 1.4;
}

.debug-info div {
  margin-bottom: 2px;
}
</style>