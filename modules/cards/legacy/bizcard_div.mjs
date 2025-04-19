// @ts-nocheck
'use strict';

import { CardDiv } from './card_div.mjs';
import { logger } from '../../logger.mjs';

export class BizCardDiv extends CardDiv {
    constructor(job) {
        super(`bizcard-div-${job.id}`, 'bizcard');
        this.job = job;
        this.element = this.createElement();
    }

    createElement() {
        const div = super.createElement();
        
        div.innerHTML = `
            <div class="bizcard-header">${this.job.role}</div>
            <div class="bizcard-employer">${this.job.employer}</div>
            <div class="bizcard-dates">${this.job.startDate} - ${this.job.endDate || 'Present'}</div>
            <div class="bizcard-description">${this.job.description || ''}</div>
        `;

        div.addEventListener('mouseenter', () => this.handleMouseEnter());
        div.addEventListener('mouseleave', () => this.handleMouseLeave());
        div.addEventListener('click', () => this.handleClick());

        return div;
    }
} 