// Auto-scroll constants
export const AUTOSCROLL_STOPS_ON_USER_SCROLL_OR_WHEEL = false;
export const AUTOSCROLL_ENABLED = true;
export const AUTOSCROLL_REPEAT_MILLIS = 10;
export const MAX_AUTOSCROLL_VELOCITY = 3.0;
export const MIN_AUTOSCROLL_VELOCITY = 2.0;
export const AUTOSCROLL_CHANGE_THRESHOLD = 2.0;
export const ALLOW_FOCAL_POINT_AIMING_IN_WHEEL_EVENT = false;
const SCROLL_ZONE_PERCENTAGE = 0.20;  // Top and bottom 20% of the container

// Auto-scroll state
let animationFrameId = null;
let currentVelocity = 0;
let sceneContainerElement = null;

/**
 * Initializes the mouse-based auto-scrolling functionality.
 */
export function initialize() {
    const container = document.getElementById('scene-container');
    if (!container) {
        console.error("autoScroll: Could not find 'scene-container' element. Scrolling will not be enabled.");
        return;
    }
    enableMouseBasedScrolling(container);
}

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
        if (animationFrameId != null) {
            window.CONSOLE_LOG_IGNORE("Scene-div container wheel detected, stopping autoscroll.");
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            currentVelocity = 0;
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
 * Starts the scrolling animation with a given velocity.
 * @param {number} velocity - The speed and direction of the scroll. Positive for down, negative for up.
 */
function startScrolling(velocity) {
    currentVelocity = velocity;

    // If the animation loop is not already running, start it.
    if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(scrollLoop);
    }
}

/**
 * Stops the scrolling animation.
 */
function stopScrolling() {
    currentVelocity = 0;
    // The loop will stop itself when velocity is 0
}

/**
 * The core animation loop.
 */
function scrollLoop() {
    if (!sceneContainerElement) {
        animationFrameId = null;
        return;
    }

    if (Math.abs(currentVelocity) > 0) {
        sceneContainerElement.scrollTop += currentVelocity;
        animationFrameId = requestAnimationFrame(scrollLoop);
    } else {
        // Stop the loop if velocity is zero
        animationFrameId = null;
    }
}

/**
 * Enables mouse-based auto-scrolling on a given container element.
 * @param {HTMLElement} container - The container to enable scrolling on.
 */
function enableMouseBasedScrolling(container) {
    sceneContainerElement = container;

    container.addEventListener('mousemove', (event) => {
        const rect = container.getBoundingClientRect();
        const mouseY = event.clientY - rect.top;
        const containerHeight = container.clientHeight;
        const topScrollZone = containerHeight * SCROLL_ZONE_PERCENTAGE;
        const bottomScrollZone = containerHeight * (1 - SCROLL_ZONE_PERCENTAGE);

        if (mouseY < topScrollZone) {
            // Mouse is in the top zone, scroll up
            const intensity = 1 - (mouseY / topScrollZone);
            const velocity = -MAX_AUTOSCROLL_VELOCITY * intensity;
            startScrolling(velocity);
        } else if (mouseY > bottomScrollZone) {
            // Mouse is in the bottom zone, scroll down
            const intensity = (mouseY - bottomScrollZone) / (containerHeight - bottomScrollZone);
            const velocity = MAX_AUTOSCROLL_VELOCITY * intensity;
            startScrolling(velocity);
        } else {
            // Mouse is in the neutral middle zone
            stopScrolling();
        }
    });

    container.addEventListener('mouseleave', () => {
        stopScrolling();
    });
} 