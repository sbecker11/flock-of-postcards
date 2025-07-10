<template>
  <svg 
    v-if="lines.length > 0"
    :style="svgStyle"
    class="badge-lines"
  >
    <!-- Simple lines for badges within cDiv height -->
    <line
      v-for="line in lines.filter(l => !l.isPath)"
      :key="line.id"
      :x1="line.x1"
      :y1="line.y1"
      :x2="line.x2"
      :y2="line.y2"
      stroke="#9966cc"
      stroke-width="3"
      class="badge-line"
    />
    
    <!-- SVG paths for badges above/below cDiv -->
    <path
      v-for="line in lines.filter(l => l.isPath)"
      :key="line.id"
      :d="line.path"
      stroke="#9966cc"
      stroke-width="3"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="badge-line"
    />
  </svg>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { TARGET_CDIV_JOB_NUMBER } from "@/modules/constants/targetCDiv.mjs";

export default {
  name: 'BadgeLines',
  setup() {
    const lines = ref([]);
    const activeJobNumber = ref(null);
    
    // SVG positioning - overlay the entire scene
    const svgStyle = computed(() => ({
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      overflow: 'visible',
      zIndex: '10'
    }));
    
    // Calculate smart-routed lines from badges to cDiv
    const updateLines = () => {
      lines.value = [];
      
      if (activeJobNumber.value !== TARGET_CDIV_JOB_NUMBER) return;
      
      // Find the selected cDiv clone
      const selectedCDiv = document.querySelector('.biz-card-div.selected');
      if (!selectedCDiv) return;
      
      // Find the first three badges
      const badges = document.querySelectorAll('#skill-badges-container .skill-badge');
      const firstThreeBadges = Array.from(badges).slice(0, 3);
      
      if (firstThreeBadges.length === 0) return;
      
      // Get scene-plane for coordinate reference
      const scenePlane = document.getElementById('scene-plane');
      if (!scenePlane) return;
      
      const sceneRect = scenePlane.getBoundingClientRect();
      const cDivRect = selectedCDiv.getBoundingClientRect();
      
      // Calculate cDiv boundaries relative to scene-plane
      const cDivLeft = cDivRect.left - sceneRect.left;
      const cDivRight = cDivRect.right - sceneRect.left;
      const cDivTop = cDivRect.top - sceneRect.top;
      const cDivBottom = cDivRect.bottom - sceneRect.top;
      
      // Create smart-routed lines
      firstThreeBadges.forEach((badge, index) => {
        const badgeRect = badge.getBoundingClientRect();
        const badgeLeft = badgeRect.left - sceneRect.left;
        const badgeY = badgeRect.top + badgeRect.height / 2 - sceneRect.top;
        
        // Determine routing based on badge position relative to cDiv
        if (badgeY >= cDivTop && badgeY <= cDivBottom) {
          // Badge within cDiv height - simple horizontal line
          lines.value.push({
            id: `badge-line-${index}`,
            x1: badgeLeft,
            y1: badgeY,
            x2: cDivRight,
            y2: badgeY
          });
        } else if (badgeY < cDivTop) {
          // Badge above cDiv - go left, turn down, connect to center of top edge
          const cDivCenterX = cDivLeft + (cDivRight - cDivLeft) / 2;
          const turnX = badgeLeft - 80 - (index * 60);
          const radius = 20;
          
          const pathData = `M ${badgeLeft} ${badgeY} 
                           L ${turnX + radius} ${badgeY}
                           Q ${turnX} ${badgeY} ${turnX} ${badgeY + radius}
                           L ${turnX} ${cDivTop - radius}
                           Q ${turnX} ${cDivTop} ${turnX + radius} ${cDivTop}
                           L ${cDivCenterX} ${cDivTop}`;
          
          lines.value.push({
            id: `badge-line-${index}`,
            path: pathData,
            isPath: true
          });
        } else {
          // Badge below cDiv - go left, turn up, connect to center of bottom edge
          const cDivCenterX = cDivLeft + (cDivRight - cDivLeft) / 2;
          const turnX = badgeLeft - 80 - (index * 60);
          const radius = 20;
          
          const pathData = `M ${badgeLeft} ${badgeY}
                           L ${turnX + radius} ${badgeY}
                           Q ${turnX} ${badgeY} ${turnX} ${badgeY - radius}
                           L ${turnX} ${cDivBottom + radius}
                           Q ${turnX} ${cDivBottom} ${turnX + radius} ${cDivBottom}
                           L ${cDivCenterX} ${cDivBottom}`;
          
          lines.value.push({
            id: `badge-line-${index}`,
            path: pathData,
            isPath: true
          });
        }
      });
    };
    
    // Event handlers
    const handleCardSelect = (event) => {
      const jobNumber = parseInt(event.detail.jobNumber);
      if (jobNumber === TARGET_CDIV_JOB_NUMBER) {
        console.log('[BadgeLines] Card selected, updating lines');
        activeJobNumber.value = jobNumber;
        setTimeout(() => updateLines(), 100); // Small delay to ensure badges are positioned
      }
    };
    
    const handleCardDeselect = () => {
      activeJobNumber.value = null;
      lines.value = [];
    };
    
    onMounted(() => {
      // Listen for card selection events
      window.addEventListener('card-select', handleCardSelect);
      window.addEventListener('card-deselect', handleCardDeselect);
    });
    
    onUnmounted(() => {
      window.removeEventListener('card-select', handleCardSelect);
      window.removeEventListener('card-deselect', handleCardDeselect);
    });
    
    return {
      lines,
      svgStyle
    };
  }
};
</script>

<style scoped>
.badge-lines {
  pointer-events: none;
}

.badge-line {
  transition: opacity 0.3s ease;
}

.badge-line:hover {
  opacity: 0.8;
}
</style> 