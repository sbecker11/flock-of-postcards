// @ts-nocheck
'use strict';

import { BizCardDiv } from './bizcard_div.mjs';
import { logger } from '../../logger.mjs';

// Global map to store card instances
export const bizCards = new Map();

// Card settings
export const CARD_SETTINGS = {
    bizCard: {
        minZ: 4,
        maxZ: 10,
        maxCtrXOffset: 200,
        maxCtrYOffset: 10,
        maxWidthOffset: 100,
        meanWidth: 300
    }
};

// Processing rates
export const PROCESSING_RATES = {
    jobs: 1.0
};

// Initialize the card system
export function initialize(jobs) {
    logger.log("Initializing legacy card system...");
    
    // Clear existing cards
    bizCards.clear();
    
    // Process all jobs immediately
    jobs.forEach(job => processJob(job));
    
    logger.log("Legacy card system initialized with:", {
        bizCards: bizCards.size
    });
}

// Process a single job
export function processJob(job) {
    // Create biz card
    const bizCard = new BizCardDiv(job);
    bizCards.set(job.id, bizCard);
    return bizCard;
}

// Position cards on the canvas
export function positionCards() {
    const canvas = document.getElementById('canvas');
    if (!canvas) {
        logger.error("Canvas element not found");
        return;
    }
    
    // Position biz cards
    Array.from(bizCards.values()).forEach((bizCard, index) => {
        const x = Math.random() * (canvas.clientWidth - CARD_SETTINGS.bizCard.meanWidth);
        const y = Math.random() * (canvas.clientHeight - CARD_SETTINGS.bizCard.meanWidth);
        const z = CARD_SETTINGS.bizCard.minZ + 
                 Math.floor(Math.random() * (CARD_SETTINGS.bizCard.maxZ - CARD_SETTINGS.bizCard.minZ));
        
        bizCard.setPosition(x, y, z);
    });
}

// Clean up the card system
export function cleanup() {
    logger.log("Cleaning up legacy card system...");
    
    // Remove all cards from DOM
    bizCards.forEach(card => card.element.remove());
    
    // Clear maps
    bizCards.clear();
} 