import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import mocks
import * as utils from './mocks/utils.mjs';
import * as logger from './mocks/logger.mjs';
import * as timeline from './mocks/timeline.mjs';

// Override imports in cards.mjs
import { BizCard, SkillCard, CARD_SETTINGS } from '../_cards_.mjs';

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

describe('Card Tests', () => {
    describe('BizCard', () => {
        it('should create a BizCard with correct properties', () => {
            const job = {
                id: 'test-job-1',
                role: 'Software Engineer',
                employer: 'Test Company',
                startDate: '2023-01-01',
                endDate: '2023-12-31'
            };
            
            const bizCard = new BizCard(job);
            
            assert.strictEqual(bizCard.id, 'bizcard-div-test-job-1');
            assert.strictEqual(bizCard.type, 'bizcard');
            assert.strictEqual(bizCard.job, job);
            assert.ok(bizCard.skillCards instanceof Set);
            assert.ok(bizCard.element instanceof MockElement);
        });
    });

    describe('SkillCard', () => {
        it('should create a SkillCard with correct properties', () => {
            const skill = {
                id: 'test-skill-1',
                name: 'JavaScript'
            };
            
            const skillCard = new SkillCard(skill);
            
            assert.strictEqual(skillCard.id, 'skill-card-div-test-skill-1');
            assert.strictEqual(skillCard.type, 'skill');
            assert.strictEqual(skillCard.skill, skill);
            assert.ok(skillCard.bizCards instanceof Set);
            assert.ok(skillCard.element instanceof MockElement);
        });
    });

    describe('Card Settings', () => {
        it('should have correct z-index ranges', () => {
            assert.ok(CARD_SETTINGS.bizCard.minZ < CARD_SETTINGS.bizCard.maxZ);
            assert.ok(CARD_SETTINGS.skillCard.minZ < CARD_SETTINGS.skillCard.maxZ);
            assert.ok(CARD_SETTINGS.bizCard.maxZ < CARD_SETTINGS.skillCard.minZ);
        });
    });
}); 