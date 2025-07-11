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
    
    // Create badges for unique skills across all jobs
    const createSkillBadges = () => {
      const skillMap = new Map();
      const badges = [];
      let badgeIndex = 0;
      
      // Collect all unique skills across all jobs
      jobsData.forEach((job, jobIndex) => {
        const jobSkills = job['job-skills'] || {};
        const skillEntries = Object.entries(jobSkills);
        
        skillEntries.forEach(([skillId, skillName]) => {
          const skillTextNoSpaces = skillName.replace(/\s+/g, '');
          
          if (!skillMap.has(skillName)) {
            skillMap.set(skillName, {
              id: `badge-${badgeIndex}-${skillTextNoSpaces}`,
              name: skillName,
              jobNumbers: [jobIndex],
              primaryJobNumber: jobIndex,
              skillId: `skill-${skillName}-${badgeIndex}`,
              colorIndex: jobIndex,
              classes: [],
              style: {
                top: '0px'
              }
            });
            badgeIndex++;
          } else {
            // Add this job to the existing skill's job numbers
            const existingSkill = skillMap.get(skillName);
            if (!existingSkill.jobNumbers.includes(jobIndex)) {
              existingSkill.jobNumbers.push(jobIndex);
            }
          }
        });
      });
      
      // Convert map to array
      skillMap.forEach((skill) => {
        badges.push(skill);
      });
      
      console.log(`[SkillBadges] Created ${badges.length} unique skill badges across ${jobsData.length} jobs`);
      
      // Apply vertical distribution to the badges
      distributeVertically(badges);
      
      skillBadges.value = badges;
    };
    
    // Get cDiv center Y position
    const getCDivCenterY = (selectedJobNumber) => {
      const selectedCDiv = document.querySelector('.biz-card-div.selected') || 
                          document.querySelector(`[data-job-number="${selectedJobNumber}"]`);
      if (!selectedCDiv) {
        console.log(`[SkillBadges] No cDiv found for job ${selectedJobNumber}, using scene center`);
        return 1000; // Default to scene center if cDiv not found
      }
      
      const sceneContent = document.getElementById('scene-content');
      if (!sceneContent) return 1000;
      
      const cDivRect = selectedCDiv.getBoundingClientRect();
      const sceneRect = sceneContent.getBoundingClientRect();
      const scrollTop = sceneContent.scrollTop;
      
      const centerY = (cDivRect.top + cDivRect.height / 2) - sceneRect.top + scrollTop;
      
      // Only log for debugging specific issues
      // console.log(`[SkillBadges] cDiv ${selectedJobNumber} center Y: ${centerY}px`);
      
      return centerY;
    };
    
    // Generate normal distribution around center Y
    const generateNormalDistribution = (centerY, count, spread = 300) => {
      const positions = [];
      const badgeHeight = 40;
      
      // console.log(`[SkillBadges] Generating normal distribution: center=${centerY}, count=${count}, spread=${spread}`);
      
      for (let i = 0; i < count; i++) {
        // Box-Muller transform for normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        
        // Scale and center the distribution
        const offset = z * (spread / 4); // spread/4 gives us ~95% within spread
        const y = centerY + offset;
        
        // Round to badge height grid
        const gridY = Math.round(y / badgeHeight) * badgeHeight;
        positions.push(gridY);
      }
      
      // const mean = positions.reduce((sum, p) => sum + p, 0) / positions.length;
      // console.log(`[SkillBadges] Generated positions mean: ${mean.toFixed(1)} (target: ${centerY})`);
      
      return positions;
    };
    
    // Distribute badges with special positioning for selected cDiv
    const distributeVertically = (badges, selectedJobNumber = null) => {
      const sceneHeight = 2000; // Total scene height
      const badgeHeight = 40; // Height of each badge
      const startY = 100; // Minimum Y position
      const endY = sceneHeight - 100; // Maximum Y position
      const totalRange = endY - startY;
      
      // Create array of all available positions across full scene height
      const allPositions = [];
      const fullScenePositions = Math.floor(sceneHeight / badgeHeight);
      
      for (let i = 0; i < fullScenePositions; i++) {
        allPositions.push(i * badgeHeight);
      }
      
      if (selectedJobNumber !== null) {
        // Special distribution for selected cDiv - arrange ALL badges in normal distribution
        const relatedBadges = badges.filter(badge => badge.jobNumbers.includes(selectedJobNumber));
        const unrelatedBadges = badges.filter(badge => !badge.jobNumbers.includes(selectedJobNumber));
        
        console.log(`[SkillBadges] Selected cDiv ${selectedJobNumber}: ${relatedBadges.length} related badges, ${unrelatedBadges.length} unrelated badges`);
        
        // Get cDiv center Y position
        const cDivCenterY = getCDivCenterY(selectedJobNumber);
        console.log(`[SkillBadges] cDiv center Y: ${cDivCenterY}`);
        
        // Calculate cDiv boundaries for precise positioning
        const selectedCDiv = document.querySelector('.biz-card-div.selected');
        let cDivTop = cDivCenterY - 50; // Default fallback
        let cDivBottom = cDivCenterY + 50;
        
        if (selectedCDiv) {
          const cDivRect = selectedCDiv.getBoundingClientRect();
          const sceneContent = document.getElementById('scene-content');
          if (sceneContent) {
            const sceneRect = sceneContent.getBoundingClientRect();
            const scrollTop = sceneContent.scrollTop;
            cDivTop = (cDivRect.top - sceneRect.top + scrollTop);
            cDivBottom = cDivTop + cDivRect.height;
          }
        }
        
        console.log(`[SkillBadges] cDiv boundaries: top=${cDivTop.toFixed(1)}, bottom=${cDivBottom.toFixed(1)}, height=${(cDivBottom - cDivTop).toFixed(1)}`);
        
        // Create N buckets for N badges (40px apart)
        const totalBadges = badges.length;
        const relatedCount = relatedBadges.length;
        const unrelatedCount = unrelatedBadges.length;
        
        // console.log(`[SkillBadges] Distributing ${relatedCount} related badges (normal) + ${unrelatedCount} unrelated badges (uniform)`);
        
        // Step 1: Create alternating fill pattern for related badges around cDiv center
        const relatedPositions = [];
        const centerBucket = Math.round(cDivCenterY / badgeHeight) * badgeHeight;
        
        // Start with center position
        relatedPositions.push(centerBucket);
        
        // Alternately fill above and below center
        let offset = 1;
        while (relatedPositions.length < relatedCount) {
          // Add position below center
          if (relatedPositions.length < relatedCount) {
            relatedPositions.push(centerBucket + (offset * badgeHeight));
          }
          // Add position above center
          if (relatedPositions.length < relatedCount) {
            relatedPositions.push(centerBucket - (offset * badgeHeight));
          }
          offset++;
        }
        
        // Sort positions for easier assignment
        const uniqueRelatedPositions = relatedPositions.sort((a, b) => a - b);
        
        // console.log(`[SkillBadges] Related badges positioned around cDiv center (${cDivCenterY.toFixed(1)}px)`);
        
        // Step 2: Create all possible bucket positions for the scene
        const allPossibleBuckets = [];
        const sceneHeight = 2000;
        for (let y = 0; y < sceneHeight; y += badgeHeight) {
          allPossibleBuckets.push(y);
        }
        
        // Step 3: Find available buckets (not used by related badges)
        const usedPositions = new Set(uniqueRelatedPositions);
        const availableBuckets = allPossibleBuckets.filter(pos => !usedPositions.has(pos));
        
        // Step 4: Uniformly distribute unrelated badges among available buckets
        const shuffledAvailableBuckets = [...availableBuckets];
        // Fisher-Yates shuffle for uniform distribution
        for (let i = shuffledAvailableBuckets.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledAvailableBuckets[i], shuffledAvailableBuckets[j]] = [shuffledAvailableBuckets[j], shuffledAvailableBuckets[i]];
        }
        
        // Take first N unrelated positions from shuffled available buckets
        const unrelatedPositions = shuffledAvailableBuckets.slice(0, unrelatedCount);
        
        // console.log(`[SkillBadges] Unrelated badges distributed uniformly among ${availableBuckets.length} available buckets`);
        
        // Step 5: Assign positions to badges
        relatedBadges.forEach((badge, index) => {
          badge.style.top = `${uniqueRelatedPositions[index]}px`;
          // console.log(`[SkillBadges] Badge "${badge.name}" assigned position ${uniqueRelatedPositions[index]}px (center Y: ${uniqueRelatedPositions[index] + 20}px)`);
        });
        
        unrelatedBadges.forEach((badge, index) => {
          if (index < unrelatedPositions.length) {
            badge.style.top = `${unrelatedPositions[index]}px`;
          } else {
            // Fallback: use remaining available buckets
            const fallbackPos = shuffledAvailableBuckets[unrelatedCount + index] || (sceneHeight - badgeHeight);
            badge.style.top = `${fallbackPos}px`;
          }
        });
        
        // console.log(`[SkillBadges] Final distribution: ${relatedCount} related (normal) + ${unrelatedCount} unrelated (uniform)`);
        
        // console.log(`[SkillBadges] Positioned ${relatedBadges.length} related badges with normal distribution around cDiv center (${cDivCenterY}px), shuffled ${unrelatedBadges.length} unrelated badges`);
        
        // Debug: Analyze the distribution of related badges
        // Use the already calculated cDivTop and cDivBottom from above
        
        let aboveCount = 0; // Above cDiv
        let betweenCount = 0; // Between/within cDiv
        let belowCount = 0; // Below cDiv
        
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
        
        // Calculate mean and standard deviation
        const mean = badgeCenterYs.reduce((sum, y) => sum + y, 0) / badgeCenterYs.length;
        const variance = badgeCenterYs.reduce((sum, y) => sum + Math.pow(y - mean, 2), 0) / badgeCenterYs.length;
        const stdDev = Math.sqrt(variance);
        
        // Sort for additional statistics
        const sortedYs = [...badgeCenterYs].sort((a, b) => a - b);
        const median = sortedYs[Math.floor(sortedYs.length / 2)];
        const min = sortedYs[0];
        const max = sortedYs[sortedYs.length - 1];
        
        // Calculate geometric ratios
        const aboveBelowTotal = aboveCount + belowCount;
        const aboveRatio = aboveBelowTotal > 0 ? (aboveCount / aboveBelowTotal) : 0;
        const belowRatio = aboveBelowTotal > 0 ? (belowCount / aboveBelowTotal) : 0;
        
        console.log(`[SkillBadges] === DISTRIBUTION ANALYSIS cDiv ${selectedJobNumber} ===`);
        console.log(`[SkillBadges] Target cDiv center: ${cDivCenterY}px, Actual mean: ${mean.toFixed(1)}px (offset: ${(mean - cDivCenterY).toFixed(1)}px)`);
        console.log(`[SkillBadges] Std dev: ${stdDev.toFixed(1)}px, Range: ${(max - min).toFixed(1)}px`);
        console.log(`[SkillBadges] Counts: Above=${aboveCount}, Between=${betweenCount}, Below=${belowCount}`);
        console.log(`[SkillBadges] Balance: Above/(Above+Below)=${aboveRatio.toFixed(2)}, Below/(Above+Below)=${belowRatio.toFixed(2)} (should be ~0.50 each)`);
        console.log(`[SkillBadges] ${aboveRatio.toFixed(2) === belowRatio.toFixed(2) ? '✓ BALANCED' : '✗ BIASED'} distribution`);
      } else {
        // Normal random distribution when no cDiv is selected
        
        // Shuffle all positions
        for (let i = allPositions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
        }
        
        // Assign shuffled positions to badges
        badges.forEach((badge, index) => {
          if (index < allPositions.length) {
            badge.style.top = `${allPositions[index]}px`;
          } else {
            // If more badges than positions, stack them
            badge.style.top = `${startY + (index * badgeHeight)}px`;
          }
        });
        
        console.log(`[SkillBadges] Randomly distributed ${badges.length} badges across ${totalRange}px range`);
      }
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

      // Reshuffle badges with special positioning for selected cDiv
      console.log(`[SkillBadges] Reshuffling badges for selected cDiv ${jobNumber}`);
      distributeVertically(skillBadges.value, jobNumber);

      setTimeout(() => {
        console.log(`[SkillBadges] Repositioning badges for selected cDiv ${jobNumber}`);
        setBadgeSceneCoordinates();
        updateBadgeStyles();
        
        // Dispatch event when badge positioning is complete
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('badges-positioned', {
            detail: { jobNumber }
          }));
          console.log(`[SkillBadges] Dispatched badges-positioned event for job ${jobNumber}`);
        }, 50);
      }, 50);
    };
    
    const handleCardDeselect = () => {
      selectedJobNumber.value = null;
      hoveredJobNumber.value = null;
      
      // Reshuffle badges randomly when no cDiv is selected
      console.log(`[SkillBadges] Reshuffling badges randomly (no cDiv selected)`);
      distributeVertically(skillBadges.value, null);
      
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
      if (selectedJobNumber.value !== null) {
        const selectedCDiv = document.querySelector('.biz-card-div.selected') || 
                            document.querySelector(`[data-job-number="${selectedJobNumber.value}"]`);
        // console.log(`[SkillBadges] Looking for selected cDiv with job number ${selectedJobNumber.value}`);
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
              // console.log(`[SkillBadges] Using data- attributes as fallback`);
              cDivSceneLeft = parseFloat(dataSceneLeft);
              cDivSceneTop = parseFloat(dataSceneTop);
              cDivSceneZ = parseFloat(dataSceneZ || '0');
            } else {
              // Try data-sceneleft and data-scenetop (lowercase)
              const dataSceneleft = selectedCDiv.getAttribute('data-sceneleft');
              const dataScenetop = selectedCDiv.getAttribute('data-scenetop');
              const dataScenez = selectedCDiv.getAttribute('data-scenez');
              
              if (dataSceneleft && dataScenetop) {
                // console.log(`[SkillBadges] Using lowercase data- attributes`);
                cDivSceneLeft = parseFloat(dataSceneleft);
                cDivSceneTop = parseFloat(dataScenetop);
                cDivSceneZ = parseFloat(dataScenez || '0');
              }
            }
          }
          
          // console.log(`[SkillBadges] cDiv scene coords: left=${cDivSceneLeft}, top=${cDivSceneTop}, z=${cDivSceneZ}`);
          
          // Set scene coordinates on each badge element - use same scene coordinates as cDiv
          // console.log(`[SkillBadges] Processing ${skillBadges.value.length} badges`);
          skillBadges.value.forEach((badge, index) => {
            // console.log(`[SkillBadges] Looking for badge with id: ${badge.id}`);
            const badgeElement = document.getElementById(badge.id);
            if (badgeElement) {
              // Use the same scene coordinates as the selected cDiv
              const badgeSceneLeft = cDivSceneLeft;
              const badgeSceneTop = cDivSceneTop;
              const badgeSceneZ = 0; // Badges at sceneZ = 0 (no parallax)
              
              // console.log(`[SkillBadges] Setting attributes on badge ${badge.id}`);
              badgeElement.setAttribute('scene-left', badgeSceneLeft.toString());
              badgeElement.setAttribute('scene-top', badgeSceneTop.toString());
              badgeElement.setAttribute('sceneZ', badgeSceneZ.toString());
              
              // Also set data- attributes as backup
              badgeElement.setAttribute('data-sceneLeft', badgeSceneLeft.toString());
              badgeElement.setAttribute('data-sceneTop', badgeSceneTop.toString());
              badgeElement.setAttribute('data-sceneZ', badgeSceneZ.toString());
            }
          });
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
        
        // Check if there's already a selected cDiv after initialization (for hard page refresh)
        setTimeout(() => {
          const selectedCDiv = document.querySelector('.biz-card-div.selected');
          if (selectedCDiv) {
            const jobNumber = parseInt(selectedCDiv.getAttribute('data-job-number'));
            console.log(`[SkillBadges] Found selected cDiv ${jobNumber} on initialization, distributing badges`);
            selectedJobNumber.value = jobNumber;
            distributeVertically(skillBadges.value, jobNumber);
            
            setTimeout(() => {
              setBadgeSceneCoordinates();
              updateBadgeStyles();
              
              // Dispatch event when badge positioning is complete
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('badges-positioned', {
                  detail: { jobNumber }
                }));
                console.log(`[SkillBadges] Dispatched badges-positioned event for job ${jobNumber}`);
              }, 100);
            }, 50);
          }
        }, 200);
        
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