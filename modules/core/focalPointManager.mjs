import * as mathUtils from '../utils/mathUtils.mjs';
import * as viewPort from './viewPortModule.mjs';
import * as bullsEyeModule from './bullsEye.mjs';

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
let _isInitialized = false;
let _initializationPromise = null;

// --- Private Logic ---

function updateBullsEyePosition() {
    // Use the centralized bullsEye module to handle positioning
    if (bullsEyeModule.isInitialized()) {
        bullsEyeModule.recenterBullsEye();
        const position = bullsEyeModule.getBullsEye();
        bullsEyePosition.x = position.x;
        bullsEyePosition.y = position.y;
    } else {
        // Fallback to viewport center
        bullsEyePosition.x = window.innerWidth / 2;
        bullsEyePosition.y = window.innerHeight / 2;
    }
    
    // Also recenter the aimPoint element directly to bullsEye position
    const aimPointElement = document.getElementById('aim-point');
    if (aimPointElement) {
        aimPointElement.style.left = `${bullsEyePosition.x}px`;
        aimPointElement.style.top = `${bullsEyePosition.y}px`;
    }
}

function animate() {
    window.CONSOLE_LOG_IGNORE('animate called, mode:', mode, 'current:', focalPoint.current, 'target:', focalPoint.target);
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

export async function initialize() {
    // If already initialized, return immediately
    if (_isInitialized) {
        window.CONSOLE_LOG_IGNORE("focalPointManager: Already initialized, ignoring duplicate call");
        return;
    }
    
    // If initialization is in progress, wait for it to complete
    if (_initializationPromise) {
        window.CONSOLE_LOG_IGNORE("focalPointManager: Initialization in progress, waiting...");
        await _initializationPromise;
        return;
    }
    
    // Start initialization and store the promise
    _initializationPromise = _performInitialization();
    
    try {
        await _initializationPromise;
    } finally {
        // Clear the promise after completion (success or failure)
        _initializationPromise = null;
    }
}

async function _performInitialization() {
    window.CONSOLE_LOG_IGNORE("focalPointManager: Starting initialization");
    
    window.CONSOLE_LOG_IGNORE("focalPointManager.initialize");
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

    // Initialize bullsEye module if not already initialized
    if (!bullsEyeModule.isInitialized()) {
        bullsEyeModule.initialize();
    }
    
    // Initialize to locked state at center
    updateBullsEyePosition();
    
    // Always use viewport center for focal point
    focalPoint.target.x = window.innerWidth / 2;
    focalPoint.current.x = window.innerWidth / 2;
    focalPoint.target.y = window.innerHeight / 2;
    focalPoint.current.y = window.innerHeight / 2;
    
    startAnimation();
    _isInitialized = true;
    
    window.CONSOLE_LOG_IGNORE("focalPointManager: Initialization complete");
}

/**
 * Checks if the focal point manager is initialized.
 */
export function isInitialized() {
    return _isInitialized;
}

function handleMouseMove(event) {
    window.CONSOLE_LOG_IGNORE('handleMouseMove', event.clientX, event.clientY, mode);
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
    window.CONSOLE_LOG_IGNORE('getPosition called, returning:', focalPoint.current);
    return focalPoint.current;
}

export function getMode() {
    return mode;
}

export function setMode(newMode) {
    window.CONSOLE_LOG_IGNORE('focalPointManager.setMode called with:', newMode, 'current mode was:', mode);
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
    window.CONSOLE_LOG_IGNORE('focalPointManager.cycleMode: current mode:', mode, 'next mode:', modes[nextIndex]);
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
    
    // Clean up bullsEye module
    bullsEyeModule.cleanup();
} 