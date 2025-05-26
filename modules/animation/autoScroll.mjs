// Auto-scroll constants
export const AUTOSCROLL_STOPS_ON_USER_SCROLL_OR_WHEEL = false;
export const AUTOSCROLL_ENABLED = true;
export const AUTOSCROLL_REPEAT_MILLIS = 10;
export const MAX_AUTOSCROLL_VELOCITY = 3.0;
export const MIN_AUTOSCROLL_VELOCITY = 2.0;
export const AUTOSCROLL_CHANGE_THRESHOLD = 2.0;
export const ALLOW_FOCAL_POINT_AIMING_IN_WHEEL_EVENT = false;

// Auto-scroll state
let autoScrollingInterval = null;
let autoScrollVelocity = 0;
let oldAutoScrollVelocity = 0;
let autoScrollEase = 0;

/**
 * Updates the auto-scroll velocity based on the focal point position
 * @param {number} focalPointY - The y-coordinate of the focal point
 * @param {HTMLElement} sceneContainer - The scene-plane container element
 */
export function updateAutoScrollVelocity(focalPointY, sceneContainer) {
    const topHeight = Math.floor(sceneContainer.offsetHeight / 4);
    const centerTop = topHeight;
    const centerHeight = topHeight * 2;
    const centerBottom = topHeight + centerHeight;
    const bottomHeight = topHeight;
    const scrollHeight = sceneContainer.scrollHeight;
    const scrollTop = sceneContainer.scrollTop;
    const windowHeight = sceneContainer.clientHeight;
    const scrollBottom = scrollHeight - scrollTop - windowHeight;

    if (focalPointY < centerTop) {
        autoScrollEase = (scrollTop < 150) ? 1 : 0;
        autoScrollVelocity = (focalPointY - centerTop) / topHeight * MAX_AUTOSCROLL_VELOCITY;
    } else if (focalPointY > centerBottom) {
        autoScrollEase = (scrollBottom < 150) ? 1 : 0;
        autoScrollVelocity = (focalPointY - centerBottom) / bottomHeight * MAX_AUTOSCROLL_VELOCITY;
    } else {
        autoScrollEase = 0;
        autoScrollVelocity = 0;
    }
}

/**
 * Handles wheel events on the scene-plane container
 * @param {WheelEvent} wheelEvent - The wheel event
 */
export function handlesceneContainerWheel(wheelEvent) {
    if (AUTOSCROLL_STOPS_ON_USER_SCROLL_OR_WHEEL) {
        if (autoScrollingInterval != null) {
            console.log("Scene-div container wheel detected, stopping autoscroll.");
            clearInterval(autoScrollingInterval);
            autoScrollingInterval = null;
            autoScrollVelocity = 0;
            oldAutoScrollVelocity = 0;
        }
    }

    const position = {
        x: wheelEvent.clientX,
        y: wheelEvent.clientY
    };
    
    if (ALLOW_FOCAL_POINT_AIMING_IN_WHEEL_EVENT) {
        focalPoint.setAimPoint(position);
    }
}

/**
 * Starts the auto-scroll animation
 * @param {HTMLElement} sceneContainer - The scene-plane container element
 */
export function startAutoScroll(sceneContainer) {
    if (!AUTOSCROLL_ENABLED || autoScrollingInterval != null) {
        return;
    }

    autoScrollingInterval = setInterval(() => {
        if (Math.abs(autoScrollVelocity) < 0.1) {
            clearInterval(autoScrollingInterval);
            autoScrollingInterval = null;
            return;
        }

        const currentScroll = sceneContainer.scrollTop;
        const newScroll = currentScroll + autoScrollVelocity;
        sceneContainer.scrollTop = newScroll;

        // Smoothly adjust velocity
        if (Math.abs(autoScrollVelocity - oldAutoScrollVelocity) > AUTOSCROLL_CHANGE_THRESHOLD) {
            autoScrollVelocity = oldAutoScrollVelocity + (autoScrollVelocity - oldAutoScrollVelocity) * 0.1;
        }
        oldAutoScrollVelocity = autoScrollVelocity;
    }, AUTOSCROLL_REPEAT_MILLIS);
}

/**
 * Stops the auto-scroll animation
 */
export function stopAutoScroll() {
    if (autoScrollingInterval != null) {
        clearInterval(autoScrollingInterval);
        autoScrollingInterval = null;
        autoScrollVelocity = 0;
        oldAutoScrollVelocity = 0;
    }
} 