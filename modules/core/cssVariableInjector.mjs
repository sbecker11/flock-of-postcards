// modules/core/cssVariableInjector.mjs

import { AppState } from './stateManager.mjs';

/**
 * Injects AppState constants as CSS custom properties
 * This allows real-time updates to styling values from the token editor
 */
export class CSSVariableInjector {
    constructor() {
        this.root = document.documentElement;
        this.initialized = false;
    }

    /**
     * Initialize and inject all CSS variables from AppState
     */
    init() {
        if (this.initialized) return;
        
        this.injectConstants();
        this.initialized = true;
        
        // Watch for AppState changes and re-inject
        this.watchAppStateChanges();
    }

    /**
     * Inject all constants from AppState.constants as CSS custom properties
     */
    injectConstants() {
        const constants = AppState.constants;
        
        // Resize Handle
        this.root.style.setProperty('--resize-handle-width', `${constants.resizeHandle.width}px`);
        this.root.style.setProperty('--resize-handle-shadow-width', `${constants.resizeHandle.shadowWidth}px`);
        this.root.style.setProperty('--resize-handle-shadow-blur', `${constants.resizeHandle.shadowBlur}px`);
        
        // Timeline
        this.root.style.setProperty('--timeline-gradient-height', constants.timeline.gradientLength);
        this.root.style.setProperty('--timeline-pixels-per-year', `${constants.timeline.pixelsPerYear}px`);
        this.root.style.setProperty('--timeline-padding-top', `${constants.timeline.paddingTop}px`);
        
        // Animation
        this.root.style.setProperty('--animation-fast', constants.animation.durations.fast);
        this.root.style.setProperty('--animation-medium', constants.animation.durations.medium);
        this.root.style.setProperty('--animation-slow', constants.animation.durations.slow);
        this.root.style.setProperty('--animation-spinner', constants.animation.durations.spinner);
        
        // Typography
        this.root.style.setProperty('--font-size-small', constants.typography.fontSizes.small);
        this.root.style.setProperty('--font-size-medium', constants.typography.fontSizes.medium);
        this.root.style.setProperty('--font-size-large', constants.typography.fontSizes.large);
        this.root.style.setProperty('--font-size-xlarge', constants.typography.fontSizes.xlarge);
        this.root.style.setProperty('--font-size-xxlarge', constants.typography.fontSizes.xxlarge);
        this.root.style.setProperty('--font-size-timeline', constants.typography.fontSizes.timeline);
        this.root.style.setProperty('--font-family', constants.typography.fontFamily);
        
        // Cards
        this.root.style.setProperty('--card-mean-width', `${constants.cards.meanWidth}px`);
        this.root.style.setProperty('--card-min-height', `${constants.cards.minHeight}px`);
        this.root.style.setProperty('--card-max-x-offset', `${constants.cards.maxXOffset}px`);
        this.root.style.setProperty('--card-max-width-offset', `${constants.cards.maxWidthOffset}px`);
        this.root.style.setProperty('--card-min-z-diff', constants.cards.minZDiff);
        
        // Z-Index
        this.root.style.setProperty('--z-index-root', constants.zIndex.root);
        this.root.style.setProperty('--z-index-scene', constants.zIndex.scene);
        this.root.style.setProperty('--z-index-scene-gradients', constants.zIndex.sceneGradients);
        this.root.style.setProperty('--z-index-timeline', constants.zIndex.timeline);
        this.root.style.setProperty('--z-index-cards-min', constants.zIndex.cardsMin);
        this.root.style.setProperty('--z-index-cards-max', constants.zIndex.cardsMax);
        this.root.style.setProperty('--z-index-bullseye', constants.zIndex.bullsEye);
        this.root.style.setProperty('--z-index-selected-card', constants.zIndex.selectedCard);
        this.root.style.setProperty('--z-index-focal-point', constants.zIndex.focalPoint);
        this.root.style.setProperty('--z-index-aim-point', constants.zIndex.aimPoint);
        
        // Visual Effects
        this.root.style.setProperty('--parallax-x-factor', constants.visualEffects.parallax.xExaggerationFactor);
        this.root.style.setProperty('--parallax-y-factor', constants.visualEffects.parallax.yExaggerationFactor);
        this.root.style.setProperty('--depth-blur-scale', constants.visualEffects.depthEffects.blurScaleFactor);
        this.root.style.setProperty('--depth-min-brightness', `${constants.visualEffects.depthEffects.minBrightnessPercent}%`);
        
        console.log('[CSSVariableInjector] Injected constants as CSS custom properties');
    }

    /**
     * Watch for AppState changes and re-inject variables
     */
    watchAppStateChanges() {
        // This will be enhanced when we add WebSocket support
        // For now, we can manually trigger re-injection
        window.updateCSSVariables = () => {
            this.injectConstants();
        };
    }

    /**
     * Update a specific CSS variable
     */
    updateVariable(property, value) {
        this.root.style.setProperty(property, value);
    }

    /**
     * Get current value of a CSS variable
     */
    getVariable(property) {
        return getComputedStyle(this.root).getPropertyValue(property);
    }
}

// Create singleton instance
export const cssVariableInjector = new CSSVariableInjector();