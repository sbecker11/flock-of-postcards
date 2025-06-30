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
    const rect = viewPort.getVisualRect();
    if (rect) {
        bullsEyePosition.x = rect.left + rect.width / 2;
        bullsEyePosition.y = rect.top + rect.height / 2;
    }
}

function animate() {
    if (mode.value === MODES.DRAGGING) {
        animationFrameId = null;
        return;
    }

    if (mode.value === MODES.LOCKED) {
        focalPoint.target.x = bullsEyePosition.x;
        focalPoint.target.y = bullsEyePosition.y;
    }

    const distanceSq = mathUtils.getPositionsSquaredDistance(focalPoint.current, focalPoint.target);

    if (distanceSq < 0.5) {
        focalPoint.current.x = focalPoint.target.x;
        focalPoint.current.y = focalPoint.target.y;
        // Keep animating if locked to always track the bullseye
        if (mode.value === MODES.LOCKED) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            animationFrameId = null; // Stop if not locked and at target
        }
    } else {
        focalPoint.current.x += (focalPoint.target.x - focalPoint.current.x) * EASE_FACTOR;
        focalPoint.current.y += (focalPoint.target.y - focalPoint.current.y) * EASE_FACTOR;
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
    focalPoint.target.x = bullsEyePosition.x;
    focalPoint.current.x = bullsEyePosition.x;
    focalPoint.target.y = bullsEyePosition.y;
    focalPoint.current.y = bullsEyePosition.y;
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