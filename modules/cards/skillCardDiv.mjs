import * as typeValidators from '../utils/typeValidators.mjs';
import * as colorUtils from '../utils/colorUtils.mjs';
import * as domUtils from '../utils/domUtils.mjs';
import * as arrayUtils from '../utils/arrayUtils.mjs';
import * as typeConversions from '../utils/typeConversions.mjs';
import { get_z_from_z_index, MIN_CARD_Z_INDEX } from '../layout/zIndex.mjs';

// Skill card constants
export const ESTIMATED_NUMBER_CARD_DIVS = 159;
export const MAX_CARD_POSITION_OFFSET = 200;
export const MEAN_CARD_LEFT = 0;
export const MEAN_CARD_HEIGHT = 75;
export const MEAN_CARD_WIDTH = 100;
export const MAX_CARD_SIZE_OFFSET = 20;
export const CARD_BORDER_WIDTH = 3;
export const SKILLCARD_WIDTH = 150;
export const SKILLCARD_INDENT = 20;
export const MIN_SKILLCARD_HEIGHT = 100;

/**
 * Creates a skill card div
 * @param {Object} skill - The skill object
 * @param {number} skillIndex - The index of the skill in the array
 * @param {HTMLElement} scene-div - The scene-div element
 * @returns {HTMLElement} The created skill card div
 */
export function createSkillCardDiv(skill, skillIndex, bizCardDiv) {
    const skillCardDiv = document.createElement("div");
    skillCardDiv.classList.add("skill-card-div");
    skillCardDiv.classList.add("card-div");
    skillCardDiv.id = `skill-card-div-${skillIndex}`;
    
    // Set z-index and z value
    const z_index = MIN_CARD_Z_INDEX + skillIndex;
    const z = get_z_from_z_index(z_index);
    skillCardDiv.style.zIndex = z_index;
    skillCardDiv.setAttribute("saved_z", z);
    
    // Set dimensions with random offset
    const width = MEAN_CARD_WIDTH + (Math.random() * 2 - 1) * MAX_CARD_SIZE_OFFSET;
    const height = MEAN_CARD_HEIGHT + (Math.random() * 2 - 1) * MAX_CARD_SIZE_OFFSET;
    skillCardDiv.style.width = `${width}px`;
    skillCardDiv.style.height = `${height}px`;
    
    // Set position with random offset
    const left = MEAN_CARD_LEFT + (Math.random() * 2 - 1) * MAX_CARD_POSITION_OFFSET;
    const top = (Math.random() * 2 - 1) * MAX_CARD_POSITION_OFFSET;
    skillCardDiv.style.left = `${left}px`;
    skillCardDiv.style.top = `${top}px`;
    
    // Set content
    skillCardDiv.innerHTML = `
        <div class="skill-card-content">
            <h4>${skill.name}</h4>
            ${skill.description ? `<p>${skill.description}</p>` : ''}
        </div>
    `;
    
    // Add click handler
    skillCardDiv.addEventListener("click", () => handleSkillCardClick(skillCardDiv, skill));
    
    // Append to scene-div
    scene-div.appendChild(skillCardDiv);
    
    return skillCardDiv;
}

/**
 * Handles click events on skill cards
 * @param {HTMLElement} skillCardDiv - The clicked skill card div
 * @param {Object} skill - The skill object associated with the card
 */
function handleSkillCardClick(skillCardDiv, skill) {
    // Remove selected class from all cards
    document.querySelectorAll('.skill-card-div').forEach(div => {
        div.classList.remove('selected');
    });
    
    // Add selected class to clicked card
    skillCardDiv.classList.add('selected');
    
    // Update right content with skill details
    const rightContentDiv = document.getElementById('right-content-div');
    rightContentDiv.innerHTML = `
        <div class="skill-details">
            <h2>${skill.name}</h2>
            ${skill.description ? `<p class="description">${skill.description}</p>` : ''}
            ${skill.examples ? `<div class="examples">${skill.examples.join('<br>')}</div>` : ''}
        </div>
    `;
}

/**
 * Gets all skill cards associated with a business card
 * @param {HTMLElement} bizCardDiv - The business card div
 * @returns {HTMLElement[]} Array of associated skill card divs
 */
export function getSkillCardsForBizCard(bizCardDiv) {
    const bizCardId = bizCardDiv.id;
    return Array.from(document.querySelectorAll('.skill-card-div')).filter(card => {
        return card.getAttribute('data-biz-card-id') === bizCardId;
    });
}

/**
 * Updates the position of a skill card
 * @param {HTMLElement} skillCardDiv - The skill card div to update
 * @param {number} x - The new x position
 * @param {number} y - The new y position
 */
export function updateSkillCardPosition(skillCardDiv, x, y) {
    skillCardDiv.style.left = `${x}px`;
    skillCardDiv.style.top = `${y}px`;
} 