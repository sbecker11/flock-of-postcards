// @ts-nocheck
'use strict';

import { logger } from '../../logger.mjs';

export class CardDiv {
    constructor(id, type) {
        this.id = id;
        this.type = type;
        this.element = null;
        this.selected = false;
    }

    createElement() {
        const div = document.createElement('div');
        div.id = this.id;
        div.className = `-${this.type}-card-div-`;
        return div;
    }

    handleMouseEnter() {
        this.element.classList.add('-card-div-hover-');
    }

    handleMouseLeave() {
        this.element.classList.remove('-card-div-hover-');
    }

    handleClick() {
        this.select();
    }

    select() {
        if (this.selected) return;
        
        // Deselect all other cards
        document.querySelectorAll(`.-${this.type}-card-div-`).forEach(card => {
            if (card !== this.element) {
                card.classList.remove('-card-selected-');
            }
        });

        this.selected = true;
        this.element.classList.add('-card-selected-');
    }

    deselect() {
        if (!this.selected) return;
        
        this.selected = false;
        this.element.classList.remove('-card-selected-');
    }

    setPosition(x, y, z) {
        if (!this.element) return;
        
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.element.style.zIndex = z;
        
        // Save original position for parallax
        this.element.setAttribute('saved_left', `${x}px`);
        this.element.setAttribute('saved_top', `${y}px`);
    }
} 