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
      const badgeLeftEdge = badgePos.x;
      
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
      
      
      return position;
    };

    // Update connections for any selected cDiv
    const updateConnections = () => {
      connections.value = [];
      
      // Find the selected cDiv - any job number
      const selectedCDiv = document.querySelector('.biz-card-div.selected');
      
      if (!selectedCDiv) return;
      
      const cDivPos = getElementPosition(selectedCDiv);
      if (!cDivPos) return;
      
      // Find all skill badges that are not dimmed (related to cDiv 5)
      const skillBadges = document.querySelectorAll('.skill-badge');
      const relevantBadges = [];
      
      skillBadges.forEach((badge, index) => {
        const badgePos = getElementPosition(badge);
        if (!badgePos) return;
        
        // Check if this badge is related to the active job (not dimmed)
        const isDimmed = badge.style.filter && badge.style.filter.includes('brightness(0.5)');
        if (isDimmed) return;
        
        relevantBadges.push({ badge, badgePos, index });
      });
      
      // First pass: categorize badges by case type
      const case1Badges = []; // ABOVE
      const case2Badges = []; // BELOW  
      const case3Badges = []; // LEVEL
      
      relevantBadges.forEach((badgeInfo) => {
        const { badgePos } = badgeInfo;
        const badgeCenterY = badgePos.y + badgePos.height / 2;
        const cDivTop = cDivPos.y;
        const cDivBottom = cDivPos.y + cDivPos.height;
        
        if (badgeCenterY < cDivTop) {
          case1Badges.push(badgeInfo);
        } else if (badgeCenterY > cDivBottom) {
          case2Badges.push(badgeInfo);
        } else {
          case3Badges.push(badgeInfo);
        }
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
      
      // Process case1 badges (ABOVE)
      case1Badges.forEach((badgeInfo, caseIndex) => {
        const { badge, badgePos, index } = badgeInfo;
        const skillText = badge.textContent.trim();
        const connection = createConnectionLine(badgePos, cDivPos, index, skillText, caseIndex, case1Badges.length);
        newConnections.push(connection);
      });
      
      // Process case2 badges (BELOW) - already sorted by Y position
      case2Badges.forEach((badgeInfo, caseIndex) => {
        const { badge, badgePos, index } = badgeInfo;
        const skillText = badge.textContent.trim();
        const connection = createConnectionLine(badgePos, cDivPos, index, skillText, caseIndex, case2Badges.length);
        newConnections.push(connection);
      });
      
      // Process case3 badges (LEVEL)
      case3Badges.forEach((badgeInfo, caseIndex) => {
        const { badge, badgePos, index } = badgeInfo;
        const skillText = badge.textContent.trim();
        const connection = createConnectionLine(badgePos, cDivPos, index, skillText, caseIndex, case3Badges.length);
        newConnections.push(connection);
      });
      
      connections.value = newConnections;
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

    onMounted(() => {
      window.addEventListener('card-select', handleCardSelect);
      window.addEventListener('card-deselect', handleCardDeselect);
      
      // Listen for viewport resize events to re-render curves
      window.addEventListener('viewport-changed', handleViewportResize);
      window.addEventListener('resize', handleViewportResize);
    });

    onUnmounted(() => {
      window.removeEventListener('card-select', handleCardSelect);
      window.removeEventListener('card-deselect', handleCardDeselect);
      window.removeEventListener('viewport-changed', handleViewportResize);
      window.removeEventListener('resize', handleViewportResize);
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