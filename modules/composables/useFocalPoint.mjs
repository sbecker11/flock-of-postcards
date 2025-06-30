import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import { useEventListener } from '@vueuse/core';
import * as mathUtils from '@/modules/utils/mathUtils.mjs';
import * as viewPort from '@/modules/core/viewPort.mjs';

// --- Private State & Constants ---
const EASE_FACTOR = 0.05;
export const MODES = {
  LOCKED: 'locked',
  FOLLOWING: 'following',
  DRAGGING: 'dragging'
};

const focalPoint = reactive({
  current: { x: 0, y: 0 },
  target: { x: 0, y: 0 },
});

const mode = ref(MODES.LOCKED);
const bullsEyePosition = reactive({ x: 0, y: 0 });
let animationFrameId = null;

// --- Private Logic ---

function updateBullsEyePosition() {
    console.log('=== updateBullsEyePosition START ===');
    console.log('updateBullsEyePosition called, viewPort.isInitialized():', viewPort.isInitialized());
    console.log('window.innerWidth:', window.innerWidth, 'window.innerHeight:', window.innerHeight);
    
    if (!viewPort.isInitialized()) {
        // If viewport is not initialized yet, set default position to window center temporarily
        bullsEyePosition.x = window.innerWidth / 2;
        bullsEyePosition.y = window.innerHeight / 2;
        console.log('Viewport not initialized, using window center:', bullsEyePosition);
        return;
    }
    
    // Get the scene container to calculate the correct position
    const sceneContainer = document.getElementById('scene-container');
    if (sceneContainer) {
        const sceneRect = sceneContainer.getBoundingClientRect();
        const sceneCenterX = sceneRect.left + sceneRect.width / 2;
        const sceneCenterY = sceneRect.top + sceneRect.height / 2;
        
        bullsEyePosition.x = sceneCenterX;
        bullsEyePosition.y = sceneCenterY;
        console.log('Using scene container center:', bullsEyePosition);
        
        // Also recenter the bullsEye element directly
        const bullsEyeElement = document.getElementById('bulls-eye');
        if (bullsEyeElement) {
            console.log('Recentering bullsEye element to:', { x: sceneCenterX, y: sceneCenterY });
            bullsEyeElement.style.left = `${sceneCenterX}px`;
            bullsEyeElement.style.top = `${sceneCenterY}px`;
        } else {
            console.log('BullsEye element not found in DOM');
        }
        
        // Also recenter the aimPoint element directly
        const aimPointElement = document.getElementById('aim-point');
        if (aimPointElement) {
            console.log('Recentering aimPoint element to:', { x: sceneCenterX, y: sceneCenterY });
            aimPointElement.style.left = `${sceneCenterX}px`;
            aimPointElement.style.top = `${sceneCenterY}px`;
        } else {
            console.log('AimPoint element not found in DOM');
        }
    } else {
        // Fallback to viewport center
        const centerPosition = viewPort.getViewPortOrigin();
        console.log('viewPort.getViewPortOrigin() returned:', centerPosition);
        if (centerPosition) {
            bullsEyePosition.x = centerPosition.x;
            bullsEyePosition.y = centerPosition.y;
            console.log('Using viewport center as fallback:', bullsEyePosition);
        } else {
            console.log('centerPosition is null/undefined, using window center as fallback');
            bullsEyePosition.x = window.innerWidth / 2;
            bullsEyePosition.y = window.innerHeight / 2;
        }
    }
    console.log('=== updateBullsEyePosition END ===');
}

function animate() {
    if (mode.value === MODES.DRAGGING) {
        animationFrameId = null;
        return;
    }

    if (mode.value === MODES.LOCKED) {
        // Update bullsEye position to ensure it's current
        updateBullsEyePosition();
        focalPoint.target.x = bullsEyePosition.x;
        focalPoint.target.y = bullsEyePosition.y;
        console.log('LOCKED mode - target position:', focalPoint.target, 'bullsEyePosition:', bullsEyePosition);
    }

    const distanceSq = mathUtils.getPositionsSquaredDistance(focalPoint.current, focalPoint.target);

    if (distanceSq < 0.5) {
        focalPoint.current.x = focalPoint.target.x;
        focalPoint.current.y = focalPoint.target.y;
        console.log('At target - current position:', focalPoint.current);
        // Keep animating if locked to always track the bullseye
        if (mode.value === MODES.LOCKED) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            animationFrameId = null; // Stop if not locked and at target
        }
    } else {
        focalPoint.current.x += (focalPoint.target.x - focalPoint.current.x) * EASE_FACTOR;
        focalPoint.current.y += (focalPoint.target.y - focalPoint.current.y) * EASE_FACTOR;
        console.log('Animating - current position:', focalPoint.current, 'target:', focalPoint.target);
        animationFrameId = requestAnimationFrame(animate);
    }
}

function startAnimation() {
  if (!animationFrameId) {
    animationFrameId = requestAnimationFrame(animate);
  }
}

// --- Composable ---

let instance = null;

export function useFocalPoint() {
  if (instance) {
    return instance;
  }

  function handleMouseMove(event) {
    if (mode.value === MODES.LOCKED) return;

    const newTarget = { x: event.clientX, y: event.clientY };

    if (mode.value === MODES.DRAGGING) {
      // If dragging, move immediately without easing
      focalPoint.current.x = newTarget.x;
      focalPoint.target.x = newTarget.x;
      focalPoint.current.y = newTarget.y;
      focalPoint.target.y = newTarget.y;
    } else { // FOLLOWING
      focalPoint.target.x = newTarget.x;
      focalPoint.target.y = newTarget.y;
      startAnimation();
    }
  }

  function cycleMode() {
    const modes = Object.values(MODES);
    const currentIndex = modes.indexOf(mode.value);
    const nextIndex = (currentIndex + 1) % modes.length;
    mode.value = modes[nextIndex];

    // If we enter a non-dragging mode, ensure animation is running
    if (mode.value !== MODES.DRAGGING) {
        startAnimation();
    }
  }

  onMounted(() => {
    useEventListener(window, 'mousemove', handleMouseMove);
    useEventListener(window, 'resize', updateBullsEyePosition);
    useEventListener(window, 'layout-changed', updateBullsEyePosition);

    // Initialize to locked state at center
    updateBullsEyePosition();
    
    // Use bullsEye position if viewport is available, otherwise use window center
    if (viewPort.isInitialized()) {
      focalPoint.target.x = bullsEyePosition.x;
      focalPoint.current.x = bullsEyePosition.x;
      focalPoint.target.y = bullsEyePosition.y;
      focalPoint.current.y = bullsEyePosition.y;
      console.log('Viewport initialized, using bullsEye position:', { x: focalPoint.current.x, y: focalPoint.current.y });
    } else {
      focalPoint.target.x = window.innerWidth / 2;
      focalPoint.current.x = window.innerWidth / 2;
      focalPoint.target.y = window.innerHeight / 2;
      focalPoint.current.y = window.innerHeight / 2;
      console.log('Viewport not initialized, using window center:', { x: focalPoint.current.x, y: focalPoint.current.y });
      
      // Set up a check to update position when viewport becomes available
      const checkViewportInterval = setInterval(() => {
        if (viewPort.isInitialized()) {
          console.log('Viewport now initialized, updating focal point position');
          updateBullsEyePosition();
          focalPoint.target.x = bullsEyePosition.x;
          focalPoint.current.x = bullsEyePosition.x;
          focalPoint.target.y = bullsEyePosition.y;
          focalPoint.current.y = bullsEyePosition.y;
          clearInterval(checkViewportInterval);
        }
      }, 100);
    }
    
    startAnimation();
  });

  onUnmounted(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  });

  instance = {
    position: computed(() => focalPoint.current),
    mode: computed(() => mode.value),
    cycleMode,
  };

  return instance;
} 