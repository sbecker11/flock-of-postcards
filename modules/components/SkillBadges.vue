<template>
  <div 
    id="skill-badges-container"
    :style="containerStyle"
  >
    <div
      v-for="skill in skillBadges"
      :key="skill.id"
      :id="skill.id"
      class="skill-badge"
      :class="skill.classes"
      :data-color-index="skill.colorIndex"
      :style="skill.style"
    >
      {{ skill.name }}
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useViewport } from '@/modules/composables/useViewport.mjs';
import { useColorPalette, applyPaletteToElement } from '@/modules/composables/useColorPalette.mjs';
import { jobs as jobsData } from '@/static_content/jobs/jobs.mjs';
import { AppState } from '@/modules/core/stateManager.mjs';
import { TARGET_CDIV_JOB_NUMBER } from "@/modules/constants/targetCDiv.mjs";

export default {
  name: 'SkillBadges',
  setup() {
    const viewport = useViewport('SkillBadges');
    const colorPalette = useColorPalette();
    
    const skillBadges = ref([]);
    const hoveredJobNumber = ref(null);
    const selectedJobNumber = ref(null);
    
    // Create skill badges from all jobs data with job associations
    const createSkillBadges = () => {
      const badges = [];
      const skillMap = new Map(); // Track which jobs use each skill
      
      // First pass: collect all unique skills and their job associations
      jobsData.forEach((job, jobIndex) => {
        const jobSkills = job['job-skills'] || {};
        const skillEntries = Object.entries(jobSkills);
        
        skillEntries.forEach(([skillId, skillName]) => {
          if (!skillMap.has(skillName)) {
            skillMap.set(skillName, {
              jobNumbers: [],
              primaryJobNumber: jobIndex, // First job that uses this skill
              colorIndex: jobIndex
            });
          }
          skillMap.get(skillName).jobNumbers.push(jobIndex);
        });
      });
      
      // Second pass: create badges for all unique skills
      let badgeIndex = 0;
      skillMap.forEach((skillInfo, skillName) => {
        const skillTextNoSpaces = skillName.replace(/\s+/g, '');
        
        badges.push({
          id: `badge-${skillTextNoSpaces}`,
          name: skillName,
          jobNumbers: skillInfo.jobNumbers, // All jobs that use this skill
          primaryJobNumber: skillInfo.primaryJobNumber,
          skillId: `skill-${skillName}`,
          colorIndex: skillInfo.colorIndex, // Initial color from first job
          classes: [],
          style: {
            top: '0px'
          }
        });
        badgeIndex++;
      });
      
      console.log(`[SkillBadges] Created ${badges.length} unique skill badges across ${jobsData.length} jobs`);
      
      // Apply vertical distribution
      distributeVertically(badges);
      
      skillBadges.value = badges;
    };
    
    // Distribute badges randomly across vertical range, but abutting
    const distributeVertically = (badges) => {
      const sceneHeight = 2000; // Total scene height
      const badgeHeight = 40; // Height of each badge
      const startY = 100; // Minimum Y position
      const endY = sceneHeight - 100; // Maximum Y position
      const totalRange = endY - startY;
      
      // Create array of available positions and shuffle them
      const positions = [];
      const numPositions = Math.floor(totalRange / badgeHeight);
      
      for (let i = 0; i < numPositions; i++) {
        positions.push(startY + (i * badgeHeight));
      }
      
      // Shuffle the positions array
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
      }
      
      // Assign shuffled positions to badges
      badges.forEach((badge, index) => {
        if (index < positions.length) {
          badge.style.top = `${positions[index]}px`;
        } else {
          // If more badges than positions, stack them
          badge.style.top = `${startY + (index * badgeHeight)}px`;
        }
      });
      
      console.log(`[SkillBadges] Randomly distributed ${badges.length} badges across ${totalRange}px range`);
    };
    
    
    // Update badge styles based on hover/selection state with multi-parent support
    const updateBadgeStyles = () => {
      skillBadges.value.forEach((badge, index) => {
        const classes = [];
        let targetJobNumber = badge.primaryJobNumber; // Default to primary job
        let belongsToActiveJob = false;
        
        // Check if any of this badge's parent jobs are hovered
        if (hoveredJobNumber.value !== null) {
          const isHovered = badge.jobNumbers.includes(hoveredJobNumber.value);
          if (isHovered) {
            classes.push('hovered');
            targetJobNumber = hoveredJobNumber.value; // Use hovered job's color
            belongsToActiveJob = true;
          }
        }
        
        // Check if any of this badge's parent jobs are selected
        if (selectedJobNumber.value !== null) {
          const isSelected = badge.jobNumbers.includes(selectedJobNumber.value);
          if (isSelected) {
            classes.push('selected');
            targetJobNumber = selectedJobNumber.value; // Use selected job's color
            belongsToActiveJob = true;
          }
        }
        
        // Add dimmed class if badge doesn't belong to active job
        if ((hoveredJobNumber.value !== null || selectedJobNumber.value !== null) && !belongsToActiveJob) {
          classes.push('dimmed');
        }
        
        // Update badge color index to match the target job
        const newColorIndex = targetJobNumber % 7;
        badge.colorIndex = newColorIndex;
        badge.classes = classes;
        
        // Apply color styling to DOM element
        const badgeElement = document.querySelector(`#skill-badges-container .skill-badge:nth-child(${index + 1})`);
        if (badgeElement) {
          badgeElement.setAttribute('data-color-index', newColorIndex);
          applyBadgeColorOnly(badgeElement, classes);
        }
      });
    };
    
    // Apply only color and border changes to badge elements
    const applyBadgeColorOnly = (element, classes) => {
      if (!element) return;
      
      // Store scene coordinates before applying palette
      const preservedSceneLeft = element.getAttribute('scene-left');
      const preservedSceneTop = element.getAttribute('scene-top');
      const preservedSceneZ = element.getAttribute('sceneZ');
      const preservedDataSceneLeft = element.getAttribute('data-sceneLeft');
      const preservedDataSceneTop = element.getAttribute('data-sceneTop');
      const preservedDataSceneZ = element.getAttribute('data-sceneZ');
      
      // Apply color palette but avoid filters
      applyPaletteToElement(element);
      
      // Restore scene coordinates after palette application
      if (preservedSceneLeft) element.setAttribute('scene-left', preservedSceneLeft);
      if (preservedSceneTop) element.setAttribute('scene-top', preservedSceneTop);
      if (preservedSceneZ) element.setAttribute('sceneZ', preservedSceneZ);
      if (preservedDataSceneLeft) element.setAttribute('data-sceneLeft', preservedDataSceneLeft);
      if (preservedDataSceneTop) element.setAttribute('data-sceneTop', preservedDataSceneTop);
      if (preservedDataSceneZ) element.setAttribute('data-sceneZ', preservedDataSceneZ);
      
      // Apply state-specific styling based on classes to match cDiv styling exactly
      if (classes.includes('selected')) {
        element.style.backgroundColor = `var(--data-background-color-selected)`;
        element.style.color = `var(--data-foreground-color-selected)`;
        
        // Use AppStatus configuration for thick purple border
        element.style.border = '7px solid purple'; // Use AppStatus borderSettings.selected values
        element.style.borderRight = 'none'; // Remove right border
        
        element.style.filter = 'none'; // Remove any dimming
        
        // Move selected badges to z-index 99 (same as selected card clone)
        element.style.zIndex = AppState.constants.zIndex.selectedCard;
      } else if (classes.includes('hovered')) {
        element.style.backgroundColor = `var(--data-background-color-hovered)`;
        element.style.color = `var(--data-foreground-color-hovered)`;
        
        // Try to match the actual hovered cDiv border
        const hoveredCDiv = document.querySelector('.biz-card-div.hovered');
        if (hoveredCDiv) {
          const computedStyle = window.getComputedStyle(hoveredCDiv);
          element.style.border = computedStyle.border; // Copy exact border from hovered cDiv
        } else {
          // Fallback to hardcoded values
          element.style.border = '3px solid rgba(255, 255, 255, 0.8)';
        }
        element.style.borderRight = 'none'; // Remove right border
        
        element.style.filter = 'none'; // Remove any dimming
        
        // Reset to standard badge z-index for hovered (not selected)
        element.style.zIndex = '';
      } else {
        element.style.backgroundColor = `var(--data-background-color)`;
        element.style.color = `var(--data-foreground-color)`;
        element.style.border = '1px solid var(--data-foreground-color)'; // Normal state
        element.style.borderRight = 'none'; // Remove right border
        element.style.filter = 'none'; // Remove any dimming
        
        // Reset to standard badge z-index for normal state
        element.style.zIndex = '';
      }
      
      // Apply dimming filter if badge doesn't belong to active job
      if (classes.includes('dimmed')) {
        element.style.filter = 'brightness(0.5)'; // Dim non-related badges
        
        // Reset to standard badge z-index for dimmed badges
        element.style.zIndex = '';
      }
    };
    
    // Handle cDiv hover events
    const handleCardHover = (event) => {
      const jobNumber = parseInt(event.detail.jobNumber);
      hoveredJobNumber.value = jobNumber;
      updateBadgeStyles();
    };
    
    const handleCardUnhover = () => {
      hoveredJobNumber.value = null;
      updateBadgeStyles();
    };
    
    // Handle cDiv selection events
    const handleCardSelect = (event) => {
      const jobNumber = parseInt(event.detail.jobNumber);
      console.log(`[SkillBadges] Card selected: job ${jobNumber}`);
      selectedJobNumber.value = jobNumber;
      hoveredJobNumber.value = null; // Remove hover when selected

      setTimeout(() => {
        console.log(`[SkillBadges] Repositioning badges for selected cDiv ${jobNumber}`);
        setBadgeSceneCoordinates();
      }, 50);

      updateBadgeStyles();
    };
    
    const handleCardDeselect = () => {
      selectedJobNumber.value = null;
      hoveredJobNumber.value = null;
      updateBadgeStyles();
    };
    
    // Container positioning within scene-content - spans full viewport height
    const containerStyle = computed(() => {
      const skillBadgesZIndex = AppState.constants.zIndex.badges; // Standard badges z-index, individual badges will override when selected
      
      return {
        position: 'absolute', // Position relative to scene-content
        right: '10px',
        top: '0px', // Start at view-plane top
        width: 'auto', // Auto width to fit content
        height: '100%', // Full height of scene-content (view-plane)
        pointerEvents: 'none',
        zIndex: skillBadgesZIndex, // Standard badges z-index
        overflow: 'visible'
      };
    });
    
    // Apply color palette to badges with performance optimization
    const applyColorsToBadges = () => {
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        // Process badges in batches to avoid blocking UI
        const batchSize = 50;
        let currentBatch = 0;
        
        const processBatch = () => {
          const start = currentBatch * batchSize;
          const end = Math.min(start + batchSize, skillBadges.value.length);
          
          for (let i = start; i < end; i++) {
            const badge = skillBadges.value[i];
            const badgeElement = document.querySelector(`#skill-badges-container .skill-badge:nth-child(${i + 1})`);
            if (badgeElement) {
              badgeElement.setAttribute('data-color-index', badge.colorIndex);
              applyBadgeColorOnly(badgeElement, badge.classes || []);
            }
          }
          
          currentBatch++;
          if (currentBatch * batchSize < skillBadges.value.length) {
            // Process next batch on next frame
            requestAnimationFrame(processBatch);
          }
        };
        
        processBatch();
      });
    };
    
    // Set scene coordinates on badge elements
    const setBadgeSceneCoordinates = () => {
      console.log(`[SkillBadges] setBadgeSceneCoordinates called for job ${selectedJobNumber.value}`);
      console.log(`[SkillBadges] TARGET_CDIV_JOB_NUMBER = ${TARGET_CDIV_JOB_NUMBER}`);
      if (selectedJobNumber.value === TARGET_CDIV_JOB_NUMBER) {
        const selectedCDiv = document.querySelector('.biz-card-div.selected') || 
                            document.querySelector(`[data-job-number="${TARGET_CDIV_JOB_NUMBER}"]`);
        console.log(`[SkillBadges] Looking for selected cDiv with job number ${TARGET_CDIV_JOB_NUMBER}`);
        console.log(`[SkillBadges] Found selected cDiv:`, selectedCDiv ? {
          'id': selectedCDiv.id,
          'className': selectedCDiv.className,
          'data-job-number': selectedCDiv.getAttribute('data-job-number'),
          'scene-left': selectedCDiv.getAttribute('scene-left'),
          'scene-top': selectedCDiv.getAttribute('scene-top'),
          'data-sceneLeft': selectedCDiv.getAttribute('data-sceneLeft'),
          'data-sceneTop': selectedCDiv.getAttribute('data-sceneTop'),
          'data-sceneleft': selectedCDiv.getAttribute('data-sceneleft'),
          'data-scenetop': selectedCDiv.getAttribute('data-scenetop')
        } : 'null');
        if (selectedCDiv) {
          
          // Get the selected cDiv's scene coordinates - try multiple attribute formats
          let cDivSceneLeft = parseFloat(selectedCDiv.getAttribute('scene-left') || '0');
          let cDivSceneTop = parseFloat(selectedCDiv.getAttribute('scene-top') || '0');
          let cDivSceneZ = parseFloat(selectedCDiv.getAttribute('sceneZ') || '0');
          
          // Fallback to data- attributes if scene-left/scene-top are not available
          if (isNaN(cDivSceneLeft) || isNaN(cDivSceneTop)) {
            // Try data-sceneLeft and data-sceneTop (camelCase)
            const dataSceneLeft = selectedCDiv.getAttribute('data-sceneLeft');
            const dataSceneTop = selectedCDiv.getAttribute('data-sceneTop');
            const dataSceneZ = selectedCDiv.getAttribute('data-sceneZ');
            
            if (dataSceneLeft && dataSceneTop) {
              console.log(`[SkillBadges] Using data- attributes as fallback: data-sceneLeft="${dataSceneLeft}", data-sceneTop="${dataSceneTop}"`);
              cDivSceneLeft = parseFloat(dataSceneLeft);
              cDivSceneTop = parseFloat(dataSceneTop);
              cDivSceneZ = parseFloat(dataSceneZ || '0');
            } else {
              // Try data-sceneleft and data-scenetop (lowercase)
              const dataSceneleft = selectedCDiv.getAttribute('data-sceneleft');
              const dataScenetop = selectedCDiv.getAttribute('data-scenetop');
              const dataScenez = selectedCDiv.getAttribute('data-scenez');
              
              if (dataSceneleft && dataScenetop) {
                console.log(`[SkillBadges] Using lowercase data- attributes: data-sceneleft="${dataSceneleft}", data-scenetop="${dataScenetop}"`);
                cDivSceneLeft = parseFloat(dataSceneleft);
                cDivSceneTop = parseFloat(dataScenetop);
                cDivSceneZ = parseFloat(dataScenez || '0');
              }
            }
          }
          
          console.log(`[SkillBadges] cDiv scene coords: left=${cDivSceneLeft}, top=${cDivSceneTop}, z=${cDivSceneZ}`);
          
          // Set scene coordinates on each badge element - use same scene coordinates as cDiv
          console.log(`[SkillBadges] Processing ${skillBadges.value.length} badges`);
          skillBadges.value.forEach((badge, index) => {
            console.log(`[SkillBadges] Looking for badge with id: ${badge.id}`);
            const badgeElement = document.getElementById(badge.id);
            if (badgeElement) {
              // Use the same scene coordinates as the selected cDiv
              const badgeSceneLeft = cDivSceneLeft;
              const badgeSceneTop = cDivSceneTop;
              const badgeSceneZ = 0; // Badges at sceneZ = 0 (no parallax)
              
              console.log(`[SkillBadges] Setting attributes on badge ${badge.id}: scene-left="${badgeSceneLeft}", scene-top="${badgeSceneTop}"`);
              badgeElement.setAttribute('scene-left', badgeSceneLeft.toString());
              badgeElement.setAttribute('scene-top', badgeSceneTop.toString());
              badgeElement.setAttribute('sceneZ', badgeSceneZ.toString());
              
              // Also set data- attributes as backup
              badgeElement.setAttribute('data-sceneLeft', badgeSceneLeft.toString());
              badgeElement.setAttribute('data-sceneTop', badgeSceneTop.toString());
              badgeElement.setAttribute('data-sceneZ', badgeSceneZ.toString());
              
              // Verify the attributes were set
              const verifySceneLeft = badgeElement.getAttribute('scene-left');
              const verifySceneTop = badgeElement.getAttribute('scene-top');
              console.log(`[SkillBadges] Verified attributes on badge ${badge.id}: scene-left="${verifySceneLeft}", scene-top="${verifySceneTop}"`);
            } else {
              console.log(`[SkillBadges] Could not find badge element with id: ${badge.id}`);
            }
          });
        } else {
          console.log(`[SkillBadges] No selected cDiv found`);
        }
      }
    };
    
    // Watch for color palette changes
    const handlePaletteChange = () => {
      applyColorsToBadges();
    };
    
    // Handle viewport resize - only update container position, not badge distribution
    const handleViewportResize = () => {
      // The container position will be updated automatically by the reactive containerStyle
      // No need to redistribute badges - they maintain their static positions within the container
    };
    
    onMounted(() => {
      // Wait for initialization signal from InitializationManager
      const handleInitReady = () => {
        console.log('[SkillBadges] Initialization ready signal received');
        createSkillBadges();
        
        // Listen for card hover/selection events
        window.addEventListener('card-hover', handleCardHover);
        window.addEventListener('card-unhover', handleCardUnhover);
        window.addEventListener('card-select', handleCardSelect);
        window.addEventListener('card-deselect', handleCardDeselect);
        
        // Listen for viewport resize events
        window.addEventListener('viewport-changed', handleViewportResize);
        window.addEventListener('resize', handleViewportResize);
        
        // Listen for color palette changes
        window.addEventListener('color-palette-changed', handlePaletteChange);
        
        // Apply colors after DOM update
        setTimeout(() => {
          applyColorsToBadges();
        }, 100);
        
        // Remove the init listener
        window.removeEventListener('skill-badges-init-ready', handleInitReady);
      };
      
      window.addEventListener('skill-badges-init-ready', handleInitReady);
    });
    
    onUnmounted(() => {
      window.removeEventListener('card-hover', handleCardHover);
      window.removeEventListener('card-unhover', handleCardUnhover);
      window.removeEventListener('card-select', handleCardSelect);
      window.removeEventListener('card-deselect', handleCardDeselect);
      window.removeEventListener('viewport-changed', handleViewportResize);
      window.removeEventListener('resize', handleViewportResize);
      window.removeEventListener('color-palette-changed', handlePaletteChange);
    });
    
    return {
      skillBadges,
      containerStyle
    };
  }
};
</script>

<style scoped>
#skill-badges-container {
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

#skill-badges-container::-webkit-scrollbar {
  display: none;
}

.skill-badge {
  position: absolute;
  height: 2.5em;
  min-width: 2.5em;
  padding: 0.5em 0.75em;
  margin-bottom: 0.1em;
  border-radius: 1.25em 0 0 1.25em;
  border-right: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5em;
  text-align: right;
  white-space: nowrap;
  cursor: default;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  box-sizing: border-box;
  
  /* Right-align badge to container and center text vertically */
  right: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  
  /* Use color palette variables */
  background-color: var(--data-background-color, #ffffff);
  color: var(--data-foreground-color, #000000);
  border-color: var(--data-foreground-color, #000000);
}

.skill-badge.hovered {
  background-color: var(--data-background-color-hovered, #f0f0f0);
  color: var(--data-foreground-color-hovered, #000000);
  border-color: white;
  border-width: 2px;
  transform: scale(1.05);
}

.skill-badge.selected {
  background-color: var(--data-background-color-selected, #e0e0e0);
  color: var(--data-foreground-color-selected, #000000);
  border-color: white;
  border-width: 2px;
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
</style>