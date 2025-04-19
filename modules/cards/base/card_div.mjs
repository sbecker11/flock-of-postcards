// @ts-nocheck
'use strict';

import * as utils from '../../utils.mjs';

// Base card class with shared functionality
export class CardDiv {
    constructor(id, type) {
        this.id = id;
        this.type = type;
        this.element = null;
        this.clone = null;
        this.position = { x: 0, y: 0, z: 0 };
        this.dimensions = { width: 0, height: 0 };
        this.createElement();
    }

    createElement() {
        const div = document.createElement('div');
        div.id = this.id;
        div.classList.add(`${this.type}-div`);
        
        // Add event listeners
        div.addEventListener('mouseenter', () => this.handleMouseEnter());
        div.addEventListener('mouseleave', () => this.handleMouseLeave());
        div.addEventListener('click', () => this.handleClick());
        
        this.element = div;
        return div;
    }

    handleMouseEnter() {
        this.element.classList.add('card-hover');
    }

    handleMouseLeave() {
        this.element.classList.remove('card-hover');
    }

    handleClick() {
        this.select();
    }

    select() {
        // Deselect all other cards first
        CardDiv.deselectAll();
        
        // Create and position clone
        this.clone = this.element.cloneNode(true);
        this.clone.classList.add('-card-div-clone-');
        this.element.style.visibility = 'hidden';
        
        const canvas = document.getElementById('canvas');
        canvas.appendChild(this.clone);
        
        this.animateToCenter();
    }

    deselect() {
        if (this.clone) {
            this.animateToOriginal();
            this.element.style.visibility = 'visible';
            this.clone.remove();
            this.clone = null;
        }
    }

    animateToCenter() {
        const viewportCenter = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        };
        
        this.animate(viewportCenter, {
            duration: 500,
            easing: 'ease-out'
        });
    }

    animateToOriginal() {
        const originalPos = {
            x: this.position.x,
            y: this.position.y
        };
        
        this.animate(originalPos, {
            duration: 500,
            easing: 'ease-in'
        });
    }

    animate(targetPos, options) {
        if (!this.clone) return;
        
        this.clone.animate([
            {
                left: this.clone.style.left,
                top: this.clone.style.top
            },
            {
                left: `${targetPos.x}px`,
                top: `${targetPos.y}px`
            }
        ], options);
    }

    static deselectAll() {
        document.querySelectorAll('.card-div, .bizcard-div').forEach(div => {
            const card = div._cardInstance;
            if (card) card.deselect();
        });
    }
} 