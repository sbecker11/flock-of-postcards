// @ts-nocheck
'use strict';

// Constants for card settings
export const CARD_SETTINGS = {
    bizCard: {
        minZ: 4,
        maxZ: 10,
        maxCtrXOffset: 200,    // Wide horizontal spread
        maxCtrYOffset: 10,     // Minimal vertical jitter to prevent exact overlaps
        maxWidthOffset: 100,
        meanWidth: 300
    },
    skillCard: {
        minZ: 15,
        maxZ: 25,
        maxCtrXOffset: 50,     // Good horizontal spread around parent
        maxCtrYOffset: 20,     // Moderate vertical spread since skills can overlap in time
        maxWidthOffset: 40,
        meanWidth: 100,
        meanHeight: 100
    }
};

export const PROCESSING_RATES = {
    jobs: 1.0,
    skills: 1.0
}; 