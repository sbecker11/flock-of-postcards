<template>
  <!-- Bounding rect at z-index 99 -->
  <div
    v-if="connections.length > 0"
    id="connection-lines-container"
    :style="boundingRectStyle"
    class="connection-lines"
  >
    <!-- SVG for drawing connection paths -->
    <svg 
      id="connection-lines-svg"
      :style="svgStyle"
    >
      <!-- Connection paths only -->
      <path
        v-for="connection in connections"
        :key="connection.id"
        :d="connection.path"
        :stroke="lineColor"
        :stroke-width="connection.strokeWidth"
        stroke-opacity="0.6"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="connection-line"
      />
    </svg>
    
    <!-- Text labels as HTML divs for better positioning -->
    <div
      v-for="connection in connections"
      :key="`label-${connection.id}`"
      :style="{
        position: 'absolute',
        left: connection.labelX + 'px',
        top: connection.labelY + 'px',
        transform: 'translate(-50%, -50%)',
        color: lineColor,
        fontSize: '12px',
        fontFamily: `'Inter', sans-serif`,
        fontWeight: '500',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
        pointerEvents: 'auto',
        whiteSpace: 'nowrap'
      }"
      class="connection-label"
    >
      Job {{ connection.jobNumber }}: {{ connection.skillText }}
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { AppState } from '@/modules/core/stateManager.mjs';
import { TARGET_CDIV_JOB_NUMBER } from "@/modules/constants/targetCDiv.mjs";

export default {
  name: 'ConnectionLines',
  setup() {
    const connections = ref([]);
    const activeJobNumber = ref(null);
    const lineColor = ref('#ffffff');
    
    // SVG positioning within the bounding rect
    const svgStyle = computed(() => ({
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'auto',
      overflow: 'visible'
    }));
    
    // Create connection path based on badge position relative to cDiv
    const createConnectionPath = (badgePos, cDivPos) => {
      const badgeCenterY = badgePos.y + badgePos.height / 2;
      const cDivTop = cDivPos.y;
      const cDivBottom = cDivPos.y + cDivPos.height;
      const cDivCenterX = cDivPos.x + cDivPos.width / 2;
      // Badges are right-aligned, so start from their left edge (which is where the connection should start)
      const badgeLeftEdge = badgePos.x;
      
      let path;
      let pathType;
      
      // Calculate cDiv center Y for all cases
      const cDivCenterY = cDivPos.y + cDivPos.height / 2;
      
      // Correct L-shaped paths with exactly 1 turn each
      if (badgeCenterY < cDivTop) {
        // Top badge: D->E->F (3 points, 1 turn)
        // D = top.badge.leftX, top.badge.centerY
        // E = cDiv.centerX, top.badge.centerY
        // F = cDiv.centerX, cDiv.topY
        path = `M ${badgeLeftEdge} ${badgeCenterY} L ${cDivCenterX} ${badgeCenterY} L ${cDivCenterX} ${cDivTop}`;
        pathType = 'ABOVE';
      } else if (badgeCenterY > cDivBottom) {
        // Bottom badge: A->B->C (3 points, 1 turn)
        // A = bottom.badge.leftX, bottom.badge.centerY
        // B = cDiv.centerX, bottom.badge.centerY
        // C = cDiv.centerX, cDiv.bottomY
        path = `M ${badgeLeftEdge} ${badgeCenterY} L ${cDivCenterX} ${badgeCenterY} L ${cDivCenterX} ${cDivBottom}`;
        pathType = 'BELOW';
      } else {
        // Badge at cDiv level: simple horizontal line
        path = `M ${badgeLeftEdge} ${badgeCenterY} L ${cDivCenterX} ${cDivCenterY}`;
        pathType = 'LEVEL';
      }
      
      // Essential debugging only
      if (activeJobNumber.value === TARGET_CDIV_JOB_NUMBER) {
        if (pathType === 'ABOVE') {
          console.log(`TOP BADGE POINTS:`);
          console.log(`  D (start): (${badgeLeftEdge}, ${badgeCenterY})`);
          console.log(`  E (corner): (${cDivCenterX}, ${badgeCenterY})`);
          console.log(`  F (cDiv top): (${cDivCenterX}, ${cDivTop})`);
          console.log(`  SVG: ${path}`);
        } else if (pathType === 'BELOW') {
          console.log(`BOTTOM BADGE POINTS:`);
          console.log(`  A (start): (${badgeLeftEdge}, ${badgeCenterY})`);
          console.log(`  B (corner): (${cDivCenterX}, ${badgeCenterY})`);
          console.log(`  C (cDiv bottom): (${cDivCenterX}, ${cDivBottom})`);
          console.log(`  SVG: ${path}`);
        } else {
          console.log(`LEVEL BADGE: (${badgeLeftEdge}, ${badgeCenterY}) -> (${cDivCenterX}, ${cDivCenterY})`);
          console.log(`  SVG: ${path}`);
        }
      }
      
      return path;
    };
    
    // Get element position using parallax-corrected coordinates
    const getElementPosition = (element) => {
      if (!element) return null;
      
      // Check if parallax is available
      if (!window.applyParallaxToScenePoint) {
        // Fallback to original method if parallax not available
        const sceneContent = document.getElementById('scene-content');
        if (!sceneContent) return null;
        
        const elementRect = element.getBoundingClientRect();
        const sceneRect = sceneContent.getBoundingClientRect();
        
        return {
          x: elementRect.left - sceneRect.left,
          y: elementRect.top - sceneRect.top,
          width: elementRect.width,
          height: elementRect.height
        };
      }
      
      // For selected cDiv clone, use sceneZ = 0 (no parallax)
      // For original cDivs and badges, use their scene coordinates with parallax
      let sceneZ = 0;
      if (element.classList.contains('biz-card-div') && !element.classList.contains('selected')) {
        // Original cDiv - use its sceneZ
        sceneZ = parseFloat(element.getAttribute('sceneZ') || '0');
      }
      
      // Get scene coordinates
      const sceneLeftAttr = element.getAttribute('scene-left');
      const sceneTopAttr = element.getAttribute('scene-top');
      
      // Simple test: log what we're getting
      if (activeJobNumber.value === TARGET_CDIV_JOB_NUMBER) {
        console.log(`[SIMPLE TEST] ConnectionLines getting scene coords from element:`, {
          'tagName': element.tagName,
          'id': element.id,
          'className': element.className,
          'scene-left': sceneLeftAttr,
          'scene-top': sceneTopAttr,
          'isSelected': element.classList.contains('selected'),
          'isHovered': element.classList.contains('hovered'),
          'isBadge': element.classList.contains('skill-badge'),
          'isCDiv': element.classList.contains('biz-card-div')
        });
      }
      
      // Debug: Log all attributes for the element
      if (activeJobNumber.value === TARGET_CDIV_JOB_NUMBER) {
        console.log(`[ConnectionLines] Element ${element.id} all attributes:`, {
          'scene-left': sceneLeftAttr,
          'scene-top': sceneTopAttr,
          'data-sceneLeft': element.getAttribute('data-sceneLeft'),
          'data-sceneTop': element.getAttribute('data-sceneTop'),
          'data-sceneCenterX': element.getAttribute('data-sceneCenterX'),
          'data-sceneZ': element.getAttribute('data-sceneZ'),
          'classList': Array.from(element.classList),
          'tagName': element.tagName,
          'id': element.id
        });
      }
      
      // Check for null attributes
      if (sceneLeftAttr === null || sceneTopAttr === null) {
        if (activeJobNumber.value === TARGET_CDIV_JOB_NUMBER) {
          console.log(`[ConnectionLines] Null attributes detected: scene-left="${sceneLeftAttr}", scene-top="${sceneTopAttr}"`);
          console.log(`[ConnectionLines] Element attributes:`, {
            'data-sceneLeft': element.getAttribute('data-sceneLeft'),
            'data-sceneTop': element.getAttribute('data-sceneTop'),
            'scene-left': element.getAttribute('scene-left'),
            'scene-top': element.getAttribute('scene-top')
          });
        }
        
        // Try to get from data- attributes as fallback for other elements
        const dataSceneLeft = element.getAttribute('data-sceneLeft');
        const dataSceneTop = element.getAttribute('data-sceneTop');
        
        if (dataSceneLeft && dataSceneTop) {
          if (activeJobNumber.value === TARGET_CDIV_JOB_NUMBER) {
            console.log(`[ConnectionLines] Using data- attributes as fallback: data-sceneLeft="${dataSceneLeft}", data-sceneTop="${dataSceneTop}"`);
          }
          
          // Use the data- attributes instead
          const sceneLeft = parseFloat(dataSceneLeft);
          const sceneTop = parseFloat(dataSceneTop);
          
          if (!isNaN(sceneLeft) && !isNaN(sceneTop)) {
            const transformedPos = window.applyParallaxToScenePoint(sceneLeft, sceneTop, sceneZ);
            if (transformedPos) {
              const sceneContent = document.getElementById('scene-content');
              if (sceneContent) {
                const sceneRect = sceneContent.getBoundingClientRect();
                
                const position = {
                  x: transformedPos.x - sceneRect.left,
                  y: transformedPos.y - sceneRect.top,
                  width: element.offsetWidth,
                  height: element.offsetHeight
                };
                
                if (activeJobNumber.value === TARGET_CDIV_JOB_NUMBER) {
                  console.log(`[ConnectionLines] Calculated position from data- attributes:`, position);
                }
                
                return position;
              }
            }
          }
        }
        
        // If we're dealing with a badge and it's the target cDiv, retry after a delay
        if (element.classList.contains('skill-badge') && activeJobNumber.value === TARGET_CDIV_JOB_NUMBER) {
          console.log(`[ConnectionLines] Badge scene coordinates not ready, retrying in 300ms...`);
          setTimeout(() => updateConnections(), 300);
          return null; // Return null to skip this badge for now
        }
        
        const elementType = element.classList.contains('biz-card-div') ? 'cDiv' : 
                           element.classList.contains('skill-badge') ? 'badge' : 
                           'unknown';
        throw new Error(`Missing scene coordinates: scene-left="${sceneLeftAttr}", scene-top="${sceneTopAttr}", element: ${elementType} ${element.tagName}${element.id ? '#' + element.id : ''}`);
      }
      
      const sceneLeft = parseFloat(sceneLeftAttr || '0');
      const sceneTop = parseFloat(sceneTopAttr || '0');
      
      // Check for NaN values
      if (isNaN(sceneLeft) || isNaN(sceneTop)) {
        if (activeJobNumber.value === TARGET_CDIV_JOB_NUMBER) {
          console.log(`[ConnectionLines] NaN detected: sceneLeft=${sceneLeft}, sceneTop=${sceneTop}`);
          console.log(`[ConnectionLines] Raw attributes: scene-left="${sceneLeftAttr}", scene-top="${sceneTopAttr}"`);
        }
        throw new Error(`Invalid scene coordinates: sceneLeft=${sceneLeft}, sceneTop=${sceneTop}, element: ${element.tagName}${element.id ? '#' + element.id : ''}`);
      }
      
      // Debug logging for cDiv 5
      if (activeJobNumber.value === TARGET_CDIV_JOB_NUMBER) {
        console.log(`[ConnectionLines] Element scene coords: left=${sceneLeft}, top=${sceneTop}, z=${sceneZ}`);
        console.log(`[ConnectionLines] Raw attributes: scene-left="${sceneLeftAttr}", scene-top="${sceneTopAttr}"`);
        console.log(`[ConnectionLines] Parsed values: left=${sceneLeft}, top=${sceneTop}, isNaN(left)=${isNaN(sceneLeft)}, isNaN(top)=${isNaN(sceneTop)}`);
      }
      
      // HACK: Use viewport-relative coordinates directly instead of scene coordinates
      // Get the element's current viewport position relative to scene-content
      const elementRect = element.getBoundingClientRect();
      const sceneContent = document.getElementById('scene-content');
      if (!sceneContent) return null;
      
      const sceneRect = sceneContent.getBoundingClientRect();
      
      const position = {
        x: elementRect.left - sceneRect.left,
        y: elementRect.top - sceneRect.top,
        width: elementRect.width,
        height: elementRect.height
      };
      
      if (activeJobNumber.value === TARGET_CDIV_JOB_NUMBER) {
        console.log(`[ConnectionLines] Using viewport coordinates for ${element.id}: x=${position.x}, y=${position.y}`);
      }
      
      return position;
    };
    
    // Update connections based on active job
    const updateConnections = () => {
      console.log(`[ConnectionLines] updateConnections called for job ${activeJobNumber.value}`);
      connections.value = [];
      
      if (activeJobNumber.value === null) return;
      
      // Debug: Check if we're waiting for a clone to be created
      if (activeJobNumber.value === TARGET_CDIV_JOB_NUMBER) {
        const selectedClone = document.querySelector('.biz-card-div.selected');
        if (selectedClone) {
          console.log(`[ConnectionLines] Selected clone found:`, selectedClone.id);
        } else {
          console.log(`[ConnectionLines] No selected clone found yet, may be in creation`);
        }
      }
      
      // Find the active cDiv (could be original or clone)
      const activeCDiv = document.querySelector('.biz-card-div.selected') || 
                        document.querySelector('.biz-card-div.hovered') ||
                        document.querySelector(`[data-job-number="${activeJobNumber.value}"]`);
      
      if (!activeCDiv) return;
      
      // Debug: Log which cDiv was found
      if (activeJobNumber.value === TARGET_CDIV_JOB_NUMBER) {
        console.log(`[ConnectionLines] Found active cDiv:`, {
          'id': activeCDiv.id,
          'isSelected': activeCDiv.classList.contains('selected'),
          'isHovered': activeCDiv.classList.contains('hovered'),
          'hasClone': activeCDiv.classList.contains('hasClone'),
          'jobNumber': activeCDiv.getAttribute('data-job-number')
        });
      }
      
      // Only log for cDiv job 5
      if (activeJobNumber.value === TARGET_CDIV_JOB_NUMBER) {
        // Log viewport-relative top and bottom of selected cDiv's clone
        const sceneContainer = document.getElementById('scene-container');
        if (sceneContainer && activeCDiv) {
          const containerRect = sceneContainer.getBoundingClientRect();
          const cDivRect = activeCDiv.getBoundingClientRect();
          
          const viewportRelativeTop = cDivRect.top - containerRect.top;
          const viewportRelativeBottom = cDivRect.bottom - containerRect.top;
          
          console.log(`[ConnectionLines] cDiv:${TARGET_CDIV_JOB_NUMBER} viewport-relative top: ${viewportRelativeTop}, bottom: ${viewportRelativeBottom}`);
        }
      }
      
      const cDivPos = getElementPosition(activeCDiv);
      if (!cDivPos) {
        if (activeJobNumber.value === TARGET_CDIV_JOB_NUMBER) {
          console.log(`[ConnectionLines] Could not get position for activeCDiv:`, {
            'tagName': activeCDiv.tagName,
            'id': activeCDiv.id,
            'className': activeCDiv.className,
            'isSelected': activeCDiv.classList.contains('selected'),
            'isHovered': activeCDiv.classList.contains('hovered')
          });
          console.log(`[ConnectionLines] Retrying in 100ms...`);
          
          // Retry after a short delay in case the clone is still being created
          setTimeout(() => {
            updateConnections();
          }, 100);
        }
        return;
      }
      
      // Find all skill badges that belong to this job
      const skillBadges = document.querySelectorAll('.skill-badge');
      const connectedBadges = [];
      
      // First pass: identify which badges should be connected (only non-dimmed)
      skillBadges.forEach((badge, index) => {
        const badgePos = getElementPosition(badge);
        if (!badgePos) {
          return; // Skip this badge
        }
        
        // Check if this badge is related to the active job by checking if it's NOT dimmed
        const isDimmed = badge.style.filter && badge.style.filter.includes('brightness(0.5)');
        const isRelated = !isDimmed;
        
        if (isRelated) {
          const strokeWidth = 3; // Standard stroke width
          connectedBadges.push({
            badge,
            badgePos,
            strokeWidth,
            index,
            y: badgePos.y
          });
        }
      });
      
      // Process all badges (removed top-two filtering to see bottom badge A,B,C points)
      if (activeJobNumber.value === TARGET_CDIV_JOB_NUMBER) {
        console.log(`[ConnectionLines] cDiv:${TARGET_CDIV_JOB_NUMBER} - Processing all ${connectedBadges.length} badges`);
      }
      
      // Second pass: create connections with proper indices
      const newConnections = [];
      
      connectedBadges.forEach((connectionInfo, connectionIndex) => {
        const { badgePos, strokeWidth, index, badge } = connectionInfo;
        
        // Get skill text from badge
        const skillText = badge.textContent.trim();
        
        // Create connection path based on badge position relative to cDiv
        const connectionPath = createConnectionPath(badgePos, cDivPos);
        
        // Debug logging for cDiv 5
        if (activeJobNumber.value === TARGET_CDIV_JOB_NUMBER) {
          const badgeCenterY = badgePos.y + badgePos.height / 2;
          const cDivTop = cDivPos.y;
          const cDivBottom = cDivPos.y + cDivPos.height;
          console.log(`[ConnectionLines] Badge ${connectionIndex}: centerY=${badgeCenterY}, cDivTop=${cDivTop}, cDivBottom=${cDivBottom}`);
          console.log(`[ConnectionLines] Generated path: ${connectionPath}`);
        }
        
        // Calculate label position (midpoint between badge and cDiv center X)
        const badgeCenterY = badgePos.y + badgePos.height / 2;
        const cDivCenterX = cDivPos.x + cDivPos.width / 2;
        const badgeLeftEdge = badgePos.x;
        const labelX = (badgeLeftEdge + cDivCenterX) / 2;
        const labelY = badgeCenterY;
        
        // Calculate bounds for bounding rect - include all path points
        const cDivTop = cDivPos.y;
        const cDivBottom = cDivPos.y + cDivPos.height;
        
        let minX = Math.min(badgeLeftEdge, cDivCenterX);
        let maxX = Math.max(badgeLeftEdge, cDivCenterX);
        let minY, maxY;
        
        if (badgeCenterY < cDivTop) {
          // Badge above cDiv - path goes from badge to cDiv center X to cDiv top
          minY = Math.min(badgeCenterY, cDivTop) - 10;
          maxY = Math.max(badgeCenterY, cDivTop) + 10;
        } else if (badgeCenterY > cDivBottom) {
          // Badge below cDiv - path goes from badge to cDiv center X to cDiv bottom
          minY = Math.min(badgeCenterY, cDivBottom) - 10;
          maxY = Math.max(badgeCenterY, cDivBottom) + 10;
        } else {
          // Badge at cDiv level - horizontal line only
          minY = badgeCenterY - 10;
          maxY = badgeCenterY + 10;
        }
        
        newConnections.push({
          id: `connection-${activeJobNumber.value}-${index}`,
          path: connectionPath,
          strokeWidth,
          jobNumber: activeJobNumber.value,
          skillText,
          labelX,
          labelY,
          // Store bounds for bounding rect calculation
          minX,
          maxX,
          minY,
          maxY
        });
        
        if (activeJobNumber.value === TARGET_CDIV_JOB_NUMBER) {
          console.log(`[ConnectionLines] cDiv:${TARGET_CDIV_JOB_NUMBER} Connection ${connectionIndex + 1}: "${skillText}"`);
        }
      });
      
      connections.value = newConnections;
      
      if (activeJobNumber.value === TARGET_CDIV_JOB_NUMBER) {
        console.log(`[ConnectionLines] cDiv:${TARGET_CDIV_JOB_NUMBER} - Created ${newConnections.length} connection lines with labels`);
        
        // Log bounding rect coordinates for both connector lines
        if (newConnections.length > 0) {
          const bounds = newConnections.reduce((acc, conn) => {
            return {
              minX: Math.min(acc.minX, conn.minX),
              maxX: Math.max(acc.maxX, conn.maxX),
              minY: Math.min(acc.minY, conn.minY),
              maxY: Math.max(acc.maxY, conn.maxY)
            };
          }, {
            minX: Infinity,
            maxX: -Infinity,
            minY: Infinity,
            maxY: -Infinity
          });
          
          console.log(`[ConnectionLines] cDiv:${TARGET_CDIV_JOB_NUMBER} - Bounding rect coordinates: left=${bounds.minX}, top=${bounds.minY}, width=${bounds.maxX - bounds.minX}, height=${bounds.maxY - bounds.minY}`);
        }
      }
    };
    
    // Event handlers for cDiv interactions - ONLY show connections for selected cDivs
    const handleCardHover = () => {
      // Do nothing for hover - only show connections for selected cards
    };
    
    const handleCardUnhover = () => {
      // Do nothing for unhover
    };
    
    const handleCardSelect = (event) => {
      const jobNumber = parseInt(event.detail.jobNumber);
      console.log(`[ConnectionLines] Card selected: job ${jobNumber}`);
      if (jobNumber === TARGET_CDIV_JOB_NUMBER) {
        console.log(`[ConnectionLines] cDiv:${TARGET_CDIV_JOB_NUMBER} selected`);
      }
      activeJobNumber.value = jobNumber;
      lineColor.value = '#9966cc'; // Purple for selection
      // Add longer delay to ensure SkillBadges has finished setting scene coordinates
      setTimeout(() => updateConnections(), 200);
    };
    
    const handleCardDeselect = () => {
      if (activeJobNumber.value === TARGET_CDIV_JOB_NUMBER) {
        console.log('[ConnectionLines] cDiv:${TARGET_CDIV_JOB_NUMBER} deselected');
      }
      activeJobNumber.value = null;
      connections.value = [];
    };
    
    // Handle scroll and resize updates
    const handleUpdate = () => {
      if (activeJobNumber.value !== null) {
        nextTick(() => updateConnections());
      }
    };
    
    onMounted(() => {
      // Wait for initialization signal from InitializationManager
      const handleInitReady = () => {
        // Listen for card events
        window.addEventListener('card-hover', handleCardHover);
        window.addEventListener('card-unhover', handleCardUnhover);
        window.addEventListener('card-select', handleCardSelect);
        window.addEventListener('card-deselect', handleCardDeselect);
        
        // Listen for clone creation events
        window.addEventListener('clone-created', () => {
          if (activeJobNumber.value !== null) {
            console.log(`[ConnectionLines] Clone created, updating connections`);
            setTimeout(() => updateConnections(), 50);
          }
        });
        
        // Listen for updates that might change positions
        window.addEventListener('scroll', handleUpdate, true);
        window.addEventListener('resize', handleUpdate);
        
        // Listen for skill badge updates
        const observer = new MutationObserver(handleUpdate);
        const skillBadgesContainer = document.getElementById('skill-badges-container');
        if (skillBadgesContainer) {
          observer.observe(skillBadgesContainer, { 
            childList: true, 
            attributes: true, 
            subtree: true 
          });
        }
        
        // Remove the init listener
        window.removeEventListener('connection-lines-init-ready', handleInitReady);
      };
      
      window.addEventListener('connection-lines-init-ready', handleInitReady);
    });
    
    onUnmounted(() => {
      window.removeEventListener('card-hover', handleCardHover);
      window.removeEventListener('card-unhover', handleCardUnhover);
      window.removeEventListener('card-select', handleCardSelect);
      window.removeEventListener('card-deselect', handleCardDeselect);
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    });
    
    // Bounding rect style calculated from actual connection bounds
    const boundingRectStyle = computed(() => {
      if (connections.value.length === 0) {
        return { display: 'none' };
      }
      
      // Calculate tight bounds around all connections and labels
      const bounds = connections.value.reduce((acc, conn) => {
        return {
          minX: Math.min(acc.minX, conn.minX),
          maxX: Math.max(acc.maxX, conn.maxX),
          minY: Math.min(acc.minY, conn.minY),
          maxY: Math.max(acc.maxY, conn.maxY)
        };
      }, {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity
      });
      
      return {
        position: 'absolute',
        left: bounds.minX + 'px',
        top: bounds.minY + 'px',
        width: (bounds.maxX - bounds.minX) + 'px',
        height: (bounds.maxY - bounds.minY) + 'px',
        border: '2px dashed rgba(255, 255, 255, 0.3)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        pointerEvents: 'auto',
        zIndex: AppState.constants.zIndex.selectedCard, // z-index 99 - same as selected card clone
        overflow: 'visible'
      };
    });

    return {
      connections,
      svgStyle,
      boundingRectStyle,
      lineColor
    };
  }
};
</script>

<style scoped>
.connection-lines {
  transition: opacity 0.3s ease;
}

.connection-line {
  transition: stroke-width 0.2s ease, stroke-opacity 0.2s ease;
}

.connection-line:hover {
  stroke-opacity: 0.8;
}

.connection-label {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  opacity: 0.9;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.connection-label:hover {
  opacity: 1;
}
</style>