<template>
  <svg class="timeline-svg" :style="{ height: timelineHeight + 'px' }">
    <g v-for="item in years" :key="item.year" class="timeline-year">
      <!-- Year Label -->
      <text
        :x="alignment === 'left' ? 10 : '98%'"
        :y="item.y"
        class="year-label"
        :text-anchor="alignment === 'left' ? 'start' : 'end'"
      >
        {{ item.year }}
      </text>

      <!-- Main Year Tick Mark -->
      <line
        :x1="alignment === 'left' ? '50px' : 'calc(100% - 50px)'"
        :y1="item.y"
        :x2="alignment === 'left' ? '60px' : 'calc(100% - 60px)'"
        :y2="item.y"
        class="year-tick-line"
      />
      
      <!-- Month Ticks (could be added here if desired) -->
    </g>
  </svg>
</template>

<script setup>
import { useTimeline } from '@/modules/composables/useTimeline.mjs';

const props = defineProps({
  alignment: {
    type: String,
    default: 'left', // 'left' or 'right'
  },
});

const { timelineHeight, years } = useTimeline();
</script>

<style scoped>
.timeline-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  pointer-events: none; /* Allows clicks to pass through */
  z-index: 5; /* Ensure it's visible */
}

.year-label {
  fill: rgba(128, 128, 128, 0.8); /* White text */
  font-size: 48px;
  font-family: 'Arial', sans-serif;
  font-weight: bold;
  dominant-baseline: middle; /* Vertically center the text on the y-coordinate */
}

.year-tick-line {
  stroke: rgba(128, 128, 128, 0.8); /* Faint white line */
  stroke-width: 1;
}
</style> 