// @ts-nocheck
'use strict';

import { getFilterForZ } from '../../z-utils.mjs';

export class BaseCard {
    constructor() {
        if (this.constructor === BaseCard) {
            throw new Error("Abstract class 'BaseCard' cannot be instantiated directly.");
        }
        this.clone = null;
    }

    // Common animation methods
    animateToCenter() {
        if (!this.clone) return;

        const canvas = document.getElementById('canvas');
        const canvasRect = canvas.getBoundingClientRect();
        const cardRect = this.element.getBoundingClientRect();

        const targetX = canvasRect.width / 2 - cardRect.width / 2;
        const targetY = canvasRect.height / 2 - cardRect.height / 2;

        this.clone.style.transition = 'all 0.3s ease-in-out';
        this.clone.style.left = `${targetX}px`;
        this.clone.style.top = `${targetY}px`;
        this.clone.style.zIndex = '1000';
        this.clone.style.transform = 'scale(1.5)';
    }

    animateToOriginal() {
        if (!this.clone) return;

        const originalLeft = this.element.style.left;
        const originalTop = this.element.style.top;
        const originalZ = this.element.style.zIndex;

        this.clone.style.transition = 'all 0.3s ease-in-out';
        this.clone.style.left = originalLeft;
        this.clone.style.top = originalTop;
        this.clone.style.zIndex = originalZ;
        this.clone.style.transform = 'scale(1)';

        // Remove clone after animation
        setTimeout(() => {
            if (this.clone && this.clone.parentNode) {
                this.clone.parentNode.removeChild(this.clone);
            }
            this.clone = null;
        }, 300);
    }

    // Common positioning methods
    setPosition(x, y, z) {
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.element.style.zIndex = z;
        this.element.style.filter = getFilterForZ(z);
        
        // Save original position for parallax
        this.element.setAttribute('saved_left', `${x}px`);
        this.element.setAttribute('saved_top', `${y}px`);
    }

    // Common event handlers
    handleMouseEnter() {
        this.element.classList.add('-card-hover-');
    }

    handleMouseLeave() {
        this.element.classList.remove('-card-hover-');
    }

    handleClick() {
        this.select();
    }

    // Abstract methods that must be implemented by child classes
    createElement() {
        throw new Error("Method 'createElement()' must be implemented.");
    }

    select() {
        throw new Error("Method 'select()' must be implemented.");
    }

    deselect() {
        throw new Error("Method 'deselect()' must be implemented.");
    }
} 