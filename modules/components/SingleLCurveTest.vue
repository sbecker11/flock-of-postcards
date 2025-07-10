<template>
  <div 
    v-if="showConnection"
    id="single-l-curve-container"
    :style="containerStyle"
    class="single-l-curve-test"
  >
    <svg 
      id="single-l-curve-svg"
      :style="svgStyle"
    >
      <path
        :d="connectionPath"
        stroke="#9966cc"
        stroke-width="3"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="l-curve-path"
      />
    </svg>
    
    <!-- Debug info -->
    <div 
      v-if="showDebugInfo"
      :style="debugStyle"
      class="debug-info"
    >
      <div>Badge: ({{ badgeLeft }}, {{ badgeCenterY }})</div>
      <div>cDiv: ({{ cDivCenterX }}, {{ cDivTop }}-{{ cDivBottom }})</div>
      <div>Case: {{ pathCase }}</div>
      <div>Path: {{ connectionPath }}</div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { TARGET_CDIV_JOB_NUMBER } from "@/modules/constants/targetCDiv.mjs";

export default {
  name: 'SingleLCurveTest',
  setup() {
    const showConnection = ref(false);
    const showDebugInfo = ref(true);
    const badgeLeft = ref(0);
    const badgeCenterY = ref(0);
    const cDivCenterX = ref(0);
    const cDivTop = ref(0);
    const cDivBottom = ref(0);
    const pathCase = ref('');
    
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

    // Calculate the connection path
    const connectionPath = computed(() => {
      if (!showConnection.value) return '';

      const badgePoint = { x: badgeLeft.value, y: badgeCenterY.value };
      const cDivCenterPoint = { x: cDivCenterX.value, y: badgeCenterY.value };
      
      // Determine which case we're in
      if (badgeCenterY.value < cDivTop.value) {
        // Case 1: Badge above cDiv
        pathCase.value = 'ABOVE';
        const endPoint = { x: cDivCenterX.value, y: cDivTop.value };
        return createLShapedCurve(badgePoint, cDivCenterPoint, endPoint, 30);
      } else if (badgeCenterY.value > cDivBottom.value) {
        // Case 2: Badge below cDiv
        pathCase.value = 'BELOW';
        const endPoint = { x: cDivCenterX.value, y: cDivBottom.value };
        return createLShapedCurve(badgePoint, cDivCenterPoint, endPoint, 30);
      } else {
        // Case 3: Badge at cDiv level
        pathCase.value = 'LEVEL';
        const endPoint = { x: cDivCenterX.value, y: badgeCenterY.value };
        return createHorizontalLine(badgePoint, endPoint);
      }
    });

    // Get element positions
    const updatePositions = () => {
      // Find the first skill badge
      const firstBadge = document.querySelector('.skill-badge');
      if (!firstBadge) return;

      // Find the selected cDiv
      const selectedCDiv = document.querySelector('.biz-card-div.selected') || 
                          document.querySelector(`[data-job-number="${TARGET_CDIV_JOB_NUMBER}"]`);
      if (!selectedCDiv) return;

      // Get scene-content for coordinate reference
      const sceneContent = document.getElementById('scene-content');
      if (!sceneContent) return;

      const sceneRect = sceneContent.getBoundingClientRect();
      const badgeRect = firstBadge.getBoundingClientRect();
      const cDivRect = selectedCDiv.getBoundingClientRect();

      // Calculate positions relative to scene-content
      badgeLeft.value = badgeRect.left - sceneRect.left;
      badgeCenterY.value = badgeRect.top + badgeRect.height / 2 - sceneRect.top;
      
      cDivCenterX.value = cDivRect.left + cDivRect.width / 2 - sceneRect.left;
      cDivTop.value = cDivRect.top - sceneRect.top;
      cDivBottom.value = cDivRect.bottom - sceneRect.top;

      console.log(`[SingleLCurveTest] Badge: (${badgeLeft.value}, ${badgeCenterY.value})`);
      console.log(`[SingleLCurveTest] cDiv: center=(${cDivCenterX.value}, ${(cDivTop.value + cDivBottom.value) / 2}), top=${cDivTop.value}, bottom=${cDivBottom.value}`);
    };

    // Container style
    const containerStyle = computed(() => ({
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '100'
    }));

    // SVG style
    const svgStyle = computed(() => ({
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      overflow: 'visible'
    }));

    // Debug info style
    const debugStyle = computed(() => ({
      position: 'absolute',
      top: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      pointerEvents: 'auto',
      zIndex: '101'
    }));

    // Event handlers
    const handleCardSelect = (event) => {
      const jobNumber = parseInt(event.detail.jobNumber);
      if (jobNumber === TARGET_CDIV_JOB_NUMBER) {
        console.log('[SingleLCurveTest] Card selected, showing connection');
        showConnection.value = true;
        setTimeout(() => updatePositions(), 100);
      }
    };

    const handleCardDeselect = () => {
      console.log('[SingleLCurveTest] Card deselected, hiding connection');
      showConnection.value = false;
    };

    onMounted(() => {
      window.addEventListener('card-select', handleCardSelect);
      window.addEventListener('card-deselect', handleCardDeselect);
    });

    onUnmounted(() => {
      window.removeEventListener('card-select', handleCardSelect);
      window.removeEventListener('card-deselect', handleCardDeselect);
    });

    return {
      showConnection,
      showDebugInfo,
      badgeLeft,
      badgeCenterY,
      cDivCenterX,
      cDivTop,
      cDivBottom,
      pathCase,
      connectionPath,
      containerStyle,
      svgStyle,
      debugStyle
    };
  }
};
</script>

<style scoped>
.single-l-curve-test {
  pointer-events: none;
}

.l-curve-path {
  transition: stroke-width 0.2s ease;
}

.l-curve-path:hover {
  stroke-width: 4;
}

.debug-info {
  font-size: 12px;
  line-height: 1.4;
}

.debug-info div {
  margin-bottom: 2px;
}
</style>