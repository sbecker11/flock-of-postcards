// Card div creation and management

import type { TagLink } from './types.js';
import * as utils from './utils.js';
import * as timeline from './timeline.js';
import * as zDepth from './z_depth.js';
import * as monoColor from './monoColor.js';
import * as bizcardModule from './bizcard.js';
import * as eventHandlers from './event_handlers.js';
import { copyHexColorAttributes } from './dom_helpers.js';
import {
  ESTIMATED_NUMBER_CARD_DIVS,
  MAX_CARD_POSITION_OFFSET,
  MEAN_CARD_LEFT,
  MEAN_CARD_HEIGHT,
  MEAN_CARD_WIDTH,
  CARD_BORDER_WIDTH,
  CARD_MIN_Z,
  CARD_MAX_Z
} from './constants.js';
import { getNextCardDivId } from './dom_helpers.js';

let prev_z: number | null = null;

/**
 * Create a card div from a tag link
 */
export function createCardDiv(
  canvas: HTMLElement,
  bizcardDiv: HTMLDivElement,
  tag_link: TagLink
): HTMLDivElement {
  const cardDivId = getNextCardDivId();
  const cardDiv = document.createElement('div');
  cardDiv.classList.add("card-div");
  utils.validateIsCardDivOrBizcardDiv(cardDiv);

  cardDiv.id = cardDivId;
  canvas.appendChild(cardDiv);
  cardDiv.dataset.bizcardDivDays = String(bizcardModule.getBizcardDivDays(bizcardDiv));

  // Position cardDiv near the center of its parent bizcardDiv
  const bizcardTop = parseInt(bizcardDiv.style.top) || 0;
  const bizcardHeight = parseInt(bizcardDiv.style.height) || 0;
  const bizcardLeft = parseInt(bizcardDiv.style.left) || 0;
  const bizcardWidth = parseInt(bizcardDiv.style.width) || 0;
  
  // Calculate center of bizcardDiv
  const bizcardCenterY = bizcardTop + bizcardHeight / 2;
  const bizcardCenterX = bizcardLeft + bizcardWidth / 2;
  
  // Add random offset around the center
  const verticalOffset = utils.getRandomInt(-MAX_CARD_POSITION_OFFSET, MAX_CARD_POSITION_OFFSET);
  const horizontalOffset = utils.getRandomInt(-MAX_CARD_POSITION_OFFSET, MAX_CARD_POSITION_OFFSET);
  
  const top = bizcardCenterY + verticalOffset;
  const left = bizcardCenterX + horizontalOffset;
  
  cardDiv.style.top = `${top}px`;
  cardDiv.style.left = `${left}px`;

  // Random z-depth (avoid consecutive duplicates)
  let z = utils.getRandomInt(CARD_MIN_Z, CARD_MAX_Z);
  while (z === prev_z) {
    z = utils.getRandomInt(CARD_MIN_Z, CARD_MAX_Z);
  }
  prev_z = z;

  const zIndexStr = zDepth.get_zIndexStr_from_z(z);

  // Inherit colors from bizcard
  cardDiv.setAttribute("bizcardDivId", bizcardDiv.id);
  copyHexColorAttributes(cardDiv, bizcardDiv, [
    'saved-background-color',
    'saved-color',
    'saved-selected-background-color',
    'saved-selected-color'
  ]);

  cardDiv.setAttribute("saved-zIndexStr", zIndexStr);
  cardDiv.setAttribute("saved-filterStr", zDepth.get_filterStr_from_z(z));

  cardDiv.style.zIndex = cardDiv.getAttribute("saved-zIndexStr") || "";
  cardDiv.style.filter = cardDiv.getAttribute("saved-filterStr") || "";
  cardDiv.style.backgroundColor = cardDiv.getAttribute("saved-background-color") || "";
  cardDiv.style.color = cardDiv.getAttribute("saved-color") || "";

  // Set dimensions
  const width = MEAN_CARD_WIDTH + 2 * CARD_BORDER_WIDTH;
  const height = MEAN_CARD_HEIGHT + 2 * CARD_BORDER_WIDTH;
  cardDiv.style.borderWidth = `${CARD_BORDER_WIDTH}px`;
  cardDiv.style.borderStyle = "solid";
  cardDiv.style.borderColor = "white";
  cardDiv.style.width = `${width}px`;
  cardDiv.style.height = `${height}px`;

  // Save original position
  const originalCtrX = left + width / 2;
  const originalCtrY = top + height / 2;
  const originalZ = z;
  cardDiv.setAttribute("originalLeft", `${cardDiv.offsetLeft}`);
  cardDiv.setAttribute("originalTop", `${cardDiv.offsetTop}`);
  cardDiv.setAttribute("originalWidth", `${cardDiv.offsetWidth}`);
  cardDiv.setAttribute("originalHeight", `${cardDiv.offsetHeight}`);
  cardDiv.setAttribute("originalCtrX", `${originalCtrX}`);
  cardDiv.setAttribute("originalCtrY", `${originalCtrY}`);
  cardDiv.setAttribute("originalZ", `${originalZ}`);

  // Set content from tag link
  const spanId = `tag_link-${cardDivId}`;
  const savedColor = cardDiv.getAttribute("saved-color");
  cardDiv.innerHTML = `<span id="${spanId}" data-saved-color="${savedColor}" class="tag-link" targetCardDivId="${cardDivId}">${tag_link.html}</span>`;

  const spanElement = document.getElementById(spanId);
  if (spanElement) {
    spanElement.style.color = cardDiv.style.color;
  }

  // Store tag link properties
  cardDiv.setAttribute("tagLinkText", tag_link["text"]);
  cardDiv.setAttribute("tagLinkUrl", tag_link["url"]);
  cardDiv.setAttribute("tagLinkImg", tag_link["img"]);

  // Remove mono-color-sensitive class from children
  const monocolorElements = Array.from(cardDiv.getElementsByClassName("mono-color-sensitive"));
  for (const element of monocolorElements) {
    element.classList.remove("mono-color-sensitive");
  }

  // Add event listeners
  cardDiv.addEventListener("mouseenter", eventHandlers.handleCardDivMouseEnter);
  cardDiv.addEventListener("mouseleave", eventHandlers.handleCardDivMouseLeave);
  eventHandlers.addCardDivClickListener(cardDiv);

  return cardDiv;
}

/**
 * Find an existing card div that matches a tag link
 */
export function findCardDiv(bizcardDiv: HTMLDivElement, tag_link: TagLink): HTMLDivElement | null {
  const cardDivs = document.getElementsByClassName("card-div");
  
  for (const cardDiv of cardDivs) {
    if (cardDivMatchesTagLink(cardDiv as HTMLDivElement, tag_link)) {
      // Add back icon if needed
      const backIcons = cardDiv.getElementsByClassName("back-icon");
      let numFound = 0;
      
      for (let i = 0; i < backIcons.length; i++) {
        const backIcon = backIcons[i] as HTMLElement;
        if (backIcon.dataset.bizcardId === bizcardDiv.id) {
          numFound++;
        }
      }
      
      // Add back icon if not found
      if (numFound === 0) {
        const savedColor = cardDiv.getAttribute('saved-color') || '';
        const newBackAnchorTag = createBackAnchorTag(bizcardDiv.id, savedColor, false);
        const spanTagLink = cardDiv.querySelector('span.tag-link');
        
        if (spanTagLink) {
          spanTagLink.innerHTML += newBackAnchorTag;
        } else {
          throw new Error(`cardDiv:${cardDiv.id} must have a span.tag-link element`);
        }
        
        const days = parseInt((cardDiv as HTMLDivElement).dataset.bizcardDivDays || "0");
        (cardDiv as HTMLDivElement).dataset.bizcardDivDays = String(days + bizcardModule.getBizcardDivDays(bizcardDiv));
      }
      
      return cardDiv as HTMLDivElement;
    }
  }
  
  return null;
}

/**
 * Check if a card div matches a tag link
 */
export function cardDivMatchesTagLink(cardDiv: HTMLDivElement, tag_link: TagLink): boolean {
  // Check text attribute
  if (tag_link.text !== cardDiv.getAttribute("tagLinkText")) {
    return false;
  }

  // Check optional img attribute
  const cardImg = cardDiv.getAttribute("tagLinkImg");
  if (tag_link.img !== cardImg) {
    if (tag_link.img && cardImg) {
      return false;
    }
  }

  // Check optional url attribute
  const cardUrl = cardDiv.getAttribute("tagLinkUrl");
  if (tag_link.url !== cardUrl) {
    if (tag_link.url && cardUrl) {
      return false;
    }
  }

  return true;
}

/**
 * Set the card div ID for a tag link (find or create)
 */
export function setCardDivIdOfTagLink(
  canvas: HTMLElement,
  bizcardDiv: HTMLDivElement,
  tag_link: TagLink
): void {
  let cardDiv = findCardDiv(bizcardDiv, tag_link);
  
  if (!cardDiv) {
    cardDiv = createCardDiv(canvas, bizcardDiv, tag_link);
  }
  
  tag_link.cardDivId = cardDiv.id;
  
  const comma = (bizcardDiv.dataset.cardDivIds && bizcardDiv.dataset.cardDivIds.length > 0) ? ',' : '';
  bizcardDiv.dataset.cardDivIds = (bizcardDiv.dataset.cardDivIds || "") + comma + cardDiv.id;
}

/**
 * Get card div index from ID
 */
function getCardDivIndex(cardDivId: string): number | null {
  if (cardDivId.startsWith("card-div-")) {
    const index = parseInt(cardDivId.replace("card-div-", ""));
    return Number.isNaN(index) ? null : index;
  }
  return null;
}

/**
 * Create back anchor tag helper
 */
function createBackAnchorTag(bizcard_id: string, savedColor: string, isMonocolorSensitive: boolean): string {
  const iconColor = monoColor.getIconColor(savedColor);
  const iconType = "back";
  const monoColorSensitiveClass = isMonocolorSensitive ? "mono-color-sensitive" : '';
  return `<img class="icon back-icon ${monoColorSensitiveClass}" src="static_content/icons/icons8-${iconType}-16-${iconColor}.png" data-bizcard-id="${bizcard_id}" data-saved-color="${iconColor}" data-icontype="${iconType}"/>`;
}

/**
 * Add months/years experience display to card
 */
export function addCardDivMonths(cardDiv: HTMLDivElement, cardDivLineItemContent: HTMLElement): void {
  const days = parseInt(cardDiv.dataset.bizcardDivDays || "0");
  const months = Math.round(days * 12.0 / 365.25);
  cardDiv.dataset.bizcardDivMonths = String(months);
  cardDiv.dataset.bizcardDivYears = "0";
  
  const spanElement = cardDivLineItemContent.querySelector("span.tag-link");
  if (spanElement) {
    if (months <= 12) {
      const units = months === 1 ? "month" : "months";
      spanElement.innerHTML += `<br/>(${months} ${units} experience)`;
    } else {
      const years = Math.round(months / 12.0);
      const units = years === 1 ? "year" : "years";
      spanElement.innerHTML += `<br/>(${years} ${units} experience)`;
      cardDiv.dataset.bizcardDivYears = String(years);
    }
  } else {
    console.error(`no spanElement found for cardDiv:${cardDiv.id}`);
  }
}
