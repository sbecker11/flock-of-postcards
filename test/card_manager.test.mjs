import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import mocks
import * as utils from './mocks/utils.mjs';
import * as logger from './mocks/logger.mjs';
import * as timeline from './mocks/timeline.mjs';

// Import after mocking
import { cardManager } from '../modules/card_manager.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock DOM environment
class MockElement {
    constructor() {
        this.style = {};
        this.classList = new Set();
        this.attributes = new Map();
        this.children = [];
        this.innerHTML = '';
        this._eventListeners = {};
        this._cardInstance = null;
        this.id = '';
        this.offsetWidth = 1000;
    }

    setAttribute(name, value) {
        this.attributes.set(name, value);
    }

    getAttribute(name) {
        return this.attributes.get(name);
    }

    appendChild(child) {
        this.children.push(child);
        return child;
    }

    querySelector(selector) {
        return new MockElement();
    }

    querySelectorAll(selector) {
        return [];
    }

    addEventListener(event, handler) {
        if (!this._eventListeners[event]) {
            this._eventListeners[event] = [];
        }
        this._eventListeners[event].push(handler);
    }

    cloneNode(deep) {
        const clone = new MockElement();
        clone.innerHTML = this.innerHTML;
        clone.style = { ...this.style };
        return clone;
    }

    remove() {
        // Mock remove
    }

    animate() {
        // Mock animate
        return { finished: Promise.resolve() };
    }

    classList = {
        add: (className) => this.classList.add(className),
        remove: (className) => this.classList.delete(className)
    };
}

// Mock document object
global.document = {
    createElement: () => new MockElement(),
    getElementById: () => new MockElement(),
    querySelectorAll: () => []
};

// Mock window object
global.window = {
    innerWidth: 1024,
    innerHeight: 768
};

// Mock HTMLElement
global.HTMLElement = MockElement;

describe('CardManager Tests', () => {
    beforeEach(() => {
        // Reset the card manager state before each test
        cardManager.bizCards.clear();
        cardManager.skillCards.clear();
        // Reset the canvas element
        cardManager.canvas = new MockElement();
    });

    describe('Job Processing', () => {
        it('should process jobs correctly', () => {
            const testJobs = [
                {
                    id: 'job-1',
                    role: 'Developer',
                    employer: 'Company A',
                    startDate: '2023-01-01',
                    endDate: '2023-12-31',
                    job_skills: ['JavaScript', 'React']
                },
                {
                    id: 'job-2',
                    role: 'Designer',
                    employer: 'Company B',
                    startDate: '2023-02-01',
                    endDate: '2023-11-30',
                    job_skills: ['Figma', 'UI/UX']
                }
            ];

            cardManager.initialize(testJobs);

            // Check if jobs were processed
            assert.ok(cardManager.bizCards.size > 0);
            assert.ok(cardManager.skillCards.size > 0);
        });
    });

    describe('Card Creation', () => {
        it('should create skill cards with proper relationships', () => {
            const job = {
                id: 'job-1',
                role: 'Developer',
                employer: 'Company A',
                startDate: '2023-01-01',
                endDate: '2023-12-31',
                job_skills: ['JavaScript']
            };

            cardManager.processJob(job);

            const bizCard = cardManager.bizCards.get('job-1');
            assert.ok(bizCard);

            const skillCard = cardManager.skillCards.get('JavaScript');
            assert.ok(skillCard);

            // Check relationships
            assert.ok(bizCard.skillCards.has(skillCard));
            assert.ok(skillCard.bizCards.has(bizCard));
        });
    });

    describe('Card Positioning', () => {
        it('should position cards with correct z-index ranges', () => {
            const job = {
                id: 'job-1',
                role: 'Developer',
                employer: 'Company A',
                startDate: '2023-01-01',
                endDate: '2023-12-31',
                job_skills: ['JavaScript']
            };

            cardManager.processJob(job);

            const bizCard = cardManager.bizCards.get('job-1');
            const skillCard = cardManager.skillCards.get('JavaScript');

            // Check z-index ranges
            const bizCardZ = parseInt(bizCard.element.style.zIndex);
            const skillCardZ = parseInt(skillCard.element.style.zIndex);

            assert.ok(bizCardZ >= 4 && bizCardZ <= 10);
            assert.ok(skillCardZ >= 15 && skillCardZ <= 25);
        });
    });
}); 