<template>
  <div 
    v-if="connections.length > 0"
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
        :stroke="lineColor"
        :stroke-width="connection.strokeWidth"
        stroke-opacity="0.8"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="connection-line"
      />
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

export default {
  name: 'NewConnectionLines',
  setup() {
    const connections = ref([]);
    const showDebugInfo = ref(false);
    const lineColor = ref('#9966cc');
    
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
    const createConnectionLine = (badgePos, cDivPos, badgeIndex, skillText, caseIndex, totalCaseCount) => {
      const badgeCenterY = badgePos.y + badgePos.height / 2;
      const cDivTop = cDivPos.y;
      const cDivBottom = cDivPos.y + cDivPos.height;
      const cDivLeft = cDivPos.x;
      const cDivRight = cDivPos.x + cDivPos.width;
      const cDivWidth = cDivPos.width;
      
      // Calculate the actual left edge of the badge for connection point
      // The badge left edge should be where the curve starts (left edge, center Y)
      const badgeLeftEdge = badgePos.x;
      
      console.log(`[DEBUG] Connection calculation for badge ${badgeIndex}:`, {
        badgePos,
        badgeCenterY,
        badgeLeftEdge,
        cDivPos,
        cDivTop,
        cDivBottom
      });
      
      let path;
      let pathCase;
      
      if (badgeCenterY < cDivTop) {
        // Case 1: Badge above cDiv - highest badges (lowest Y) get leftmost termination
        pathCase = 'ABOVE';
        const spacing = cDivWidth / totalCaseCount;
        // Direct index: highest badges (lowest Y, caseIndex=0) get leftmost, lowest badges (highest Y) get rightmost
        const terminationX = cDivLeft + (spacing * (caseIndex + 0.5)); // Center within each segment
        const pointA = { x: badgeLeftEdge, y: badgeCenterY };
        const pointB = { x: terminationX, y: badgeCenterY };
        const pointC = { x: terminationX, y: cDivTop };
        path = createLShapedCurve(pointA, pointB, pointC, 30);
        
      } else if (badgeCenterY > cDivBottom) {
        // Case 2: Badge below cDiv - distribute with lowest badges furthest left
        pathCase = 'BELOW';
        const spacing = cDivWidth / totalCaseCount;
        // Reverse the index: highest badges (lowest Y) get rightmost, lowest badges (highest Y) get leftmost
        const reversedIndex = totalCaseCount - 1 - caseIndex;
        const terminationX = cDivLeft + (spacing * (reversedIndex + 0.5)); // Center within each segment
        const pointA = { x: badgeLeftEdge, y: badgeCenterY };
        const pointB = { x: terminationX, y: badgeCenterY };
        const pointC = { x: terminationX, y: cDivBottom };
        path = createLShapedCurve(pointA, pointB, pointC, 30);
        
      } else {
        // Case 3: Badge at cDiv level - horizontal line to right edge at badge's Y level
        pathCase = 'LEVEL';
        const pointA = { x: badgeLeftEdge, y: badgeCenterY };
        const pointB = { x: cDivRight, y: badgeCenterY };
        path = createHorizontalLine(pointA, pointB);
        
      }
      
      return {
        id: `new-connection-${badgeIndex}`,
        path,
        case: pathCase,
        skillText,
        strokeWidth: 3
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

    // Update connections for any selected cDiv
    const updateConnections = async () => {
      connections.value = [];
      
      // Find the selected cDiv - any job number
      const selectedCDiv = document.querySelector('.biz-card-div.selected');
      
      if (!selectedCDiv) {
        console.log('[NewConnectionLines] No selected cDiv found');
        return;
      }
      
      // console.log('[NewConnectionLines] Waiting for badge positioning to complete...');
      const badgesReady = await waitForBadgePositioning();
      
      if (!badgesReady) {
        // console.log('[NewConnectionLines] Badge positioning not optimal, but proceeding');
      }
      
      const cDivPos = getElementPosition(selectedCDiv);
      if (!cDivPos) {
        // console.log('[NewConnectionLines] Could not get cDiv position');
        return;
      }
      
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
      
      // Second pass: create connections with proper case-specific indexing
      const newConnections = [];
      let actualAboveCount = 0;
      let actualBelowCount = 0;
      let actualBetweenCount = 0;
      
      // Process case1 badges (ABOVE) - these are above
      case1Badges.forEach((badgeInfo, caseIndex) => {
        const { badge, badgePos, index } = badgeInfo;
        const skillText = badge.textContent.trim();
        const connection = createConnectionLine(badgePos, cDivPos, index, skillText, caseIndex, case1Badges.length);
        newConnections.push(connection);
        actualAboveCount++; // Above cDiv
      });
      
      // Process case2 badges (BELOW) - these are below
      case2Badges.forEach((badgeInfo, caseIndex) => {
        const { badge, badgePos, index } = badgeInfo;
        const skillText = badge.textContent.trim();
        const connection = createConnectionLine(badgePos, cDivPos, index, skillText, caseIndex, case2Badges.length);
        newConnections.push(connection);
        actualBelowCount++; // Below cDiv
      });
      
      // Process case3 badges (LEVEL) - these are between
      case3Badges.forEach((badgeInfo, caseIndex) => {
        const { badge, badgePos, index } = badgeInfo;
        const skillText = badge.textContent.trim();
        const connection = createConnectionLine(badgePos, cDivPos, index, skillText, caseIndex, case3Badges.length);
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
    };

    // Event handlers
    const handleCardSelect = (event) => {
      const jobNumber = parseInt(event.detail.jobNumber);
      setTimeout(() => updateConnections(), 200);
    };

    const handleCardDeselect = () => {
      connections.value = [];
    };

    // Handle viewport resize - re-render curves when viewport changes
    const handleViewportResize = () => {
      // Only re-render if there are active connections
      if (connections.value.length > 0) {
        setTimeout(() => updateConnections(), 100); // Small delay to ensure cDiv repositioning is complete
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
      setTimeout(() => {
        console.log('[NewConnectionLines] Skill badges initialization ready, checking for selected cDiv');
        const selectedCDiv = document.querySelector('.biz-card-div.selected');
        if (selectedCDiv) {
          updateConnections();
        }
      }, 100);
    };
    
    const handleCloneCreated = () => {
      setTimeout(() => {
        console.log('[NewConnectionLines] Clone created, updating connections');
        updateConnections();
      }, 50);
    };
    
    const handleBadgesPositioned = (event) => {
      const jobNumber = event.detail?.jobNumber;
      console.log(`[NewConnectionLines] Badges positioned event received for job ${jobNumber}`);
      
      // Check if there's a selected cDiv and update connections immediately
      const selectedCDiv = document.querySelector('.biz-card-div.selected');
      if (selectedCDiv) {
        const selectedJobNumber = parseInt(selectedCDiv.getAttribute('data-job-number'));
        if (jobNumber === selectedJobNumber) {
          console.log('[NewConnectionLines] Updating connections for matching job number');
          setTimeout(() => updateConnections(), 50);
        }
      }
    };

    onMounted(() => {
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
      // Use multiple timeouts to ensure all components are properly initialized
      setTimeout(() => {
        const selectedCDiv = document.querySelector('.biz-card-div.selected');
        if (selectedCDiv) {
          console.log('[NewConnectionLines] Found selected cDiv on mount, updating connections');
          updateConnections();
        }
      }, 100);
      
      // Additional check after a longer delay to ensure everything is fully rendered
      setTimeout(() => {
        const selectedCDiv = document.querySelector('.biz-card-div.selected');
        if (selectedCDiv && connections.value.length === 0) {
          console.log('[NewConnectionLines] Re-checking selected cDiv after longer delay');
          updateConnections();
        }
      }, 500);
      
      // Final check after an even longer delay for hard page resets
      setTimeout(() => {
        const selectedCDiv = document.querySelector('.biz-card-div.selected');
        if (selectedCDiv && connections.value.length === 0) {
          console.log('[NewConnectionLines] Final check after page load - forcing connection update');
          updateConnections();
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
            updateConnections();
          }
        }
      }, 1500);
    });

    onUnmounted(() => {
      window.removeEventListener('card-select', handleCardSelect);
      window.removeEventListener('card-deselect', handleCardDeselect);
      window.removeEventListener('viewport-changed', handleViewportResize);
      window.removeEventListener('resize', handleViewportResize);
      window.removeEventListener('skill-badges-init-ready', handleSkillBadgesReady);
      window.removeEventListener('clone-created', handleCloneCreated);
      window.removeEventListener('badges-positioned', handleBadgesPositioned);
    });

    return {
      connections,
      showDebugInfo,
      lineColor,
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