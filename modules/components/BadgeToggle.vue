<script setup>
import { ref, computed } from 'vue';
import { badgeManager } from '@/modules/core/badgeManager.mjs';

// --- Reactive refs for current mode ---
const badgeMode = ref(badgeManager.getMode());

// Listen for mode changes from BadgeManager
badgeManager.addEventListener('badgeModeChanged', (event) => {
  badgeMode.value = event.detail.mode;
});

const isHovering = ref(false);
const hasJustClicked = ref(false);

// Mode progression: none -> show -> stats -> none
const nextMode = computed(() => {
  return badgeManager.getNextMode();
});

// The mode whose icon we're currently displaying (for CSS class styling)
const displayedIconMode = computed(() => {
  return isHovering.value ? nextMode.value : badgeMode.value;
});

// The actual icon to show with superscripts
const displayIcon = computed(() => {
  return badgeManager.getDisplayIcon(isHovering.value);
});

// CSS classes for the button
const buttonClasses = computed(() => {
  return [
    displayedIconMode.value, // for mode-specific styling
    { hovering: isHovering.value } // for hover styling (colors)
  ];
});

// Tooltip text
const tooltipText = computed(() => {
  return badgeManager.getTooltipText(isHovering.value);
});

// --- Component Methods ---
function toggleBadges(event) {
  event.stopPropagation();
  badgeManager.toggleMode('BadgeToggle');
  // Mark that we just clicked (don't reset hover state yet)
  hasJustClicked.value = true;
  
  // Force a small delay to ensure the mode change has been processed
  setTimeout(() => {
    // This setTimeout ensures the DOM and computeds have updated
    // The isHovering state remains true, so we'll show the next mode of the NEW current mode
  }, 0);
}
</script>

<template>
  <button 
    id="badge-toggle" 
    class="toggle-circle"
    :class="buttonClasses"
    @click.stop="toggleBadges" 
    @mouseenter="isHovering = true; hasJustClicked = false"
    @mouseleave="isHovering = false; hasJustClicked = false"
    :title="tooltipText">{{ displayIcon }}</button>
</template>

<style scoped>
#badge-toggle {
  font-size: 10px;
  font-weight: 100;
}

/* Hover state: next mode with black icon on white background */
#badge-toggle.hovering {
  background-color: white;
  color: black;
  border-color: black;
}

/* Additional visual feedback for active modes */
#badge-toggle.show {
  background-color: rgba(0, 120, 0, 0.8); /* Green tint when badges showing */
}

#badge-toggle.stats {
  background-color: rgba(0, 100, 200, 0.8); /* Blue tint when stats showing */
}

/* Maintain hover effect precedence */
#badge-toggle.hovering {
  background-color: white !important;
}
</style>