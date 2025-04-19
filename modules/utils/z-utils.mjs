// @ts-nocheck
'use strict';

// Z-index ranges for different depth layers
export const Z_RANGES = {
    BACKGROUND: { min: 1, max: 3 },
    MIDDLE: { min: 4, max: 10 },
    FOREGROUND: { min: 11, max: 20 }
};

/**
 * Get a random integer between min and max (inclusive)
 */
export function getRandomZ(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Linear interpolation between two values
 */
export function linearInterp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Calculate blur amount based on z-index
 * Higher z-index = less blur
 */
export function getBlurForZ(z) {
    // Map z-index to blur range (0px to 5px)
    const maxZ = Math.max(...Object.values(Z_RANGES).map(r => r.max));
    const blurAmount = 5 * (1 - (z / maxZ));
    return `${blurAmount}px`;
}

/**
 * Get complete filter string for a z-index
 * Combines blur and other effects
 */
export function getFilterForZ(z) {
    const blur = getBlurForZ(z);
    const brightness = linearInterp(0.7, 1, z / Z_RANGES.FOREGROUND.max);
    return `blur(${blur}) brightness(${brightness})`;
}

/**
 * Calculate opacity based on z-index
 * Higher z-index = more opaque
 */
export function getOpacityForZ(z) {
    return linearInterp(0.5, 1, z / Z_RANGES.FOREGROUND.max);
}

/**
 * Get z-index for parallax effect
 * Higher z-index elements move less
 */
export function getParallaxFactorForZ(z) {
    return 1 / Math.pow(z + 1, 1.5);
}

/**
 * Check if an element is at a specific depth layer
 */
export function isInZRange(z, range) {
    return z >= range.min && z <= range.max;
} 