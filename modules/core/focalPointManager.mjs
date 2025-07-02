import * as mathUtils from '../utils/mathUtils.mjs';
import * as viewPort from './viewport.mjs';

// --- Private State & Constants ---
const EASE_FACTOR = 0.05;
export const MODES = {
  LOCKED: 'locked',
  FOLLOWING: 'following',
  DRAGGING: 'dragging'
};

const focalPoint = {
  current: { x: 0, y: 0 },
  target: { x: 0, y: 0 },
};

let mode = MODES.LOCKED;
const bullsEyePosition = { x: 0, y: 0 };
let animationFrameId = null;

// --- Private Logic ---

function updateBullsEyePosition() {
    if (!viewPort.isInitialized()) {
        // If viewport is not initialized yet, set default position to window center temporarily
        bullsEyePosition.x = window.innerWidth / 2;
        bullsEyePosition.y = window.innerHeight / 2;
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
        
        // Also recenter the bullsEye element directly
        const bullsEyeElement = document.getElementById('bulls-eye');
        if (bullsEyeElement) {
            bullsEyeElement.style.left = `${sceneCenterX}px`;
            bullsEyeElement.style.top = `${sceneCenterY}px`;
        }
        
        // Also recenter the aimPoint element directly to bullsEye position
        const aimPointElement = document.getElementById('aim-point');
        if (aimPointElement) {
            aimPointElement.style.left = `${sceneCenterX}px`;
            aimPointElement.style.top = `${sceneCenterY}px`;
        }
    } else {
        // Fallback to viewport center
        const centerPosition = viewPort.getViewPortOrigin();
        if (centerPosition) {
            bullsEyePosition.x = centerPosition.x;
            bullsEyePosition.y = centerPosition.y;
        } else {
            bullsEyePosition.x = window.innerWidth / 2;
            bullsEyePosition.y = window.innerHeight / 2;
        }
    }
}

function animate() {
    console.log('animate called, mode:', mode, 'current:', focalPoint.current, 'target:', focalPoint.target);
    if (mode === MODES.DRAGGING) {
        animationFrameId = null;
        return;
    }

    if (mode === MODES.LOCKED) {
        // Update bullsEye position to ensure it's current
        updateBullsEyePosition();
        
        // Get the aim-point position (which should be at bullsEye)
        const aimPointElement = document.getElementById('aim-point');
        if (aimPointElement) {
            const aimPointRect = aimPointElement.getBoundingClientRect();
            const aimPointCenter = {
                x: aimPointRect.left + aimPointRect.width / 2,
                y: aimPointRect.top + aimPointRect.height / 2
            };
            focalPoint.target.x = aimPointCenter.x;
            focalPoint.target.y = aimPointCenter.y;
        } else {
            // Fallback to bullsEye position
            focalPoint.target.x = bullsEyePosition.x;
            focalPoint.target.y = bullsEyePosition.y;
        }
    }

    const distanceSq = mathUtils.getPositionsSquaredDistance(focalPoint.current, focalPoint.target);

    if (distanceSq < 0.5) {
        focalPoint.current.x = focalPoint.target.x;
        focalPoint.current.y = focalPoint.target.y;
        // Keep animating if locked or following to always track the target
        if (mode === MODES.LOCKED || mode === MODES.FOLLOWING) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            animationFrameId = null; // Stop if not locked/following and at target
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

function handleFocalModeChange(event) {
    if (event.detail && event.detail.mode) {
        setMode(event.detail.mode);
    }
}

// --- Public API ---

export function initialize() {
    console.log("focalPointManager.initialize");
    // Set up event listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', updateBullsEyePosition);
    window.addEventListener('layout-changed', updateBullsEyePosition);
    
    // Listen for focal-point-update events from viewport resize
    window.addEventListener('focal-point-update', (event) => {
        if (event.detail && event.detail.position && mode === MODES.LOCKED) {
            focalPoint.target.x = event.detail.position.x;
            focalPoint.target.y = event.detail.position.y;
            startAnimation();
        }
    });
    
    // Listen for focal mode change events from keyboard
    window.addEventListener('focalModeChange', handleFocalModeChange);
    
    // Listen for viewport-changed events (when bullsEye position changes)
    window.addEventListener('viewport-changed', (event) => {
        if (mode === MODES.LOCKED) {
            // If focal point is locked to bullsEye, update aimPoint and ease focal point
            const bullsEyeCenter = { x: event.detail.centerX, y: event.detail.centerY };
            
            // Move aimPoint to bullsEye center
            const aimPointElement = document.getElementById('aim-point');
            if (aimPointElement) {
                aimPointElement.style.left = `${bullsEyeCenter.x}px`;
                aimPointElement.style.top = `${bullsEyeCenter.y}px`;
            }
            
            // Immediately update focal point position to trigger parallax
            focalPoint.current.x = bullsEyeCenter.x;
            focalPoint.current.y = bullsEyeCenter.y;
            focalPoint.target.x = bullsEyeCenter.x;
            focalPoint.target.y = bullsEyeCenter.y;
            
            // Start animation for smooth transitions
            startAnimation();
        }
    });

    // Initialize to locked state at center
    updateBullsEyePosition();
    
    // Use bullsEye position if viewport is available, otherwise use window center
    if (viewPort.isInitialized()) {
        focalPoint.target.x = bullsEyePosition.x;
        focalPoint.current.x = bullsEyePosition.x;
        focalPoint.target.y = bullsEyePosition.y;
        focalPoint.current.y = bullsEyePosition.y;
    } else {
        focalPoint.target.x = window.innerWidth / 2;
        focalPoint.current.x = window.innerWidth / 2;
        focalPoint.target.y = window.innerHeight / 2;
        focalPoint.current.y = window.innerHeight / 2;
        
        // Set up a check to update position when viewport becomes available
        const checkViewportInterval = setInterval(() => {
            if (viewPort.isInitialized()) {
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
}

function handleMouseMove(event) {
    // console.log('handleMouseMove', event.clientX, event.clientY, mode);
    if (mode === MODES.LOCKED) return;

    const newTarget = { x: event.clientX, y: event.clientY };

    if (mode === MODES.DRAGGING) {
        // If dragging, move immediately without easing
        //focalPoint.current.x = newTarget.x;
        focalPoint.target.x = newTarget.x;
        //focalPoint.current.y = newTarget.y;
        focalPoint.target.y = newTarget.y;
    } else { // FOLLOWING
        focalPoint.target.x = newTarget.x;
        focalPoint.target.y = newTarget.y;
        startAnimation();
    }
}

export function getPosition() {
    console.log('getPosition called, returning:', focalPoint.current);
    return focalPoint.current;
}

export function getMode() {
    return mode;
}

export function setMode(newMode) {
    console.log('focalPointManager.setMode called with:', newMode, 'current mode was:', mode);
    mode = newMode;
    
    // Dispatch an event to notify listeners that the mode changed
    window.dispatchEvent(new CustomEvent('focal-point-mode-changed', { 
        detail: { mode: newMode } 
    }));
    
    // If we enter a non-dragging mode, ensure animation is running
    if (mode !== MODES.DRAGGING) {
        startAnimation();
    }
}

export function cycleMode() {
    const modes = Object.values(MODES);
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    console.log('focalPointManager.cycleMode: current mode:', mode, 'next mode:', modes[nextIndex]);
    setMode(modes[nextIndex]);
}

export function cleanup() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    // Remove event listeners
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('resize', updateBullsEyePosition);
    window.removeEventListener('layout-changed', updateBullsEyePosition);
    window.removeEventListener('focalModeChange', handleFocalModeChange);
} 