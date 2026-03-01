// Card div line item management for the right panel

import * as utils from './utils.js';
import * as monoColor from './monoColor.js';
import * as tagLinks from './tag_links.js';
import * as cardModule from './card.js';
import * as selection from './selection.js';
import { copyHexColorAttributes, isBizcardDivId, scrollElementIntoView } from './dom_helpers.js';
import { scrollElementToTop } from './dom_helpers.js';

/**
 * Add a card div line item to the right content div
 */
export function addCardDivLineItem(
  rightContentDiv: HTMLElement,
  targetCardDivId: string
): HTMLLIElement | null {
  if (!targetCardDivId) {
    return null;
  }

  const targetCardDiv = document.getElementById(targetCardDivId);
  if (!targetCardDiv) {
    return null;
  }

  // Check if line item already exists
  const existingLineItem = getCardDivLineItem(targetCardDivId);
  if (existingLineItem) {
    scrollElementToTop(existingLineItem);
    return existingLineItem;
  }

  // Create new line item
  const cardDivLineItem = document.createElement("li");
  cardDivLineItem.classList.add("card-div-line-item");
  cardDivLineItem.id = "card-div-line-item-" + targetCardDivId;
  cardDivLineItem.setAttribute("targetCardDivId", targetCardDivId);

  // Inherit colors
  copyHexColorAttributes(cardDivLineItem, targetCardDiv as HTMLElement, [
    "saved-background-color",
    "saved-color",
    "saved-selected-background-color",
    "saved-selected-color"
  ]);

  cardDivLineItem.style.backgroundColor = cardDivLineItem.getAttribute("saved-background-color") || "";
  cardDivLineItem.style.color = cardDivLineItem.getAttribute("saved-color") || "";

  // Create content div
  const cardDivLineItemContent = document.createElement("div");
  cardDivLineItemContent.classList.add("card-div-line-item-content");
  cardDivLineItemContent.classList.add("mono-color-sensitive");
  cardDivLineItemContent.style.backgroundColor = 'transparent';
  cardDivLineItemContent.style.color = targetCardDiv.getAttribute("saved-color") || "";
  cardDivLineItemContent.dataset.savedColor = targetCardDiv.getAttribute("saved-color") || "";

  // Create right column
  const cardDivLineItemRightColumn = document.createElement('div');
  cardDivLineItemRightColumn.classList.add("card-div-line-item-right-column");
  cardDivLineItemRightColumn.classList.add("mono-color-sensitive");
  cardDivLineItemRightColumn.style.backgroundColor = 'transparent';
  cardDivLineItemRightColumn.style.color = targetCardDiv.getAttribute("saved-color") || "";
  cardDivLineItemRightColumn.dataset.savedColor = targetCardDiv.getAttribute("saved-color") || "";

  // Set content from target card div
  let targetInnerHTML = targetCardDiv.innerHTML;
  if (targetInnerHTML && targetInnerHTML.length > 0) {
    cardDivLineItemContent.innerHTML = targetInnerHTML;
  }

  // Add description if available
  const description = targetCardDiv.getAttribute("Description");
  if (description && description.length > 0) {
    const line_items_HTML = tagLinks.convert_description_HTML_to_line_items_HTML(description);
    if (line_items_HTML && line_items_HTML.length > 0) {
      const cleanHTML = line_items_HTML.replace(/<br\/>/g, "");
      cardDivLineItemContent.innerHTML += cleanHTML;
    }
  }

  // Add delete button
  const deleteButton = document.createElement("button");
  deleteButton.classList.add("card-div-line-item-delete-button");
  deleteButton.addEventListener("click", function (event) {
    cardDivLineItem.remove();
    event.stopPropagation();
  });
  cardDivLineItemRightColumn.appendChild(deleteButton);

  // Add following button for bizcards
  if (isBizcardDivId(targetCardDivId)) {
    const followingButton = document.createElement("button");
    followingButton.classList.add("card-div-line-item-follow-button");
    cardDivLineItemRightColumn.appendChild(followingButton);
  }

  // Add experience months/years for cards
  if (targetCardDiv.classList.contains("card-div")) {
    cardModule.addCardDivMonths(targetCardDiv as HTMLDivElement, cardDivLineItemContent);
  }

  // Add click handler to toggle selection and scroll the associated card
  cardDivLineItem.addEventListener("click", function(event) {
    // Don't trigger if clicking on buttons (but allow icon clicks to propagate to their own handlers)
    if (event.target instanceof HTMLElement && 
        (event.target.classList.contains('card-div-line-item-delete-button') ||
         event.target.classList.contains('card-div-line-item-follow-button'))) {
      return;
    }
    
    // Toggle selection behavior for line items
    if (targetCardDiv && targetCardDiv.classList.contains('selected')) {
      // Clicking on selected card's line item - deselect both
      selection.restoreSavedStyle(targetCardDiv as HTMLElement);
      selection.restoreSavedStyle(cardDivLineItem);
    } else {
      // Deselect ALL other selected cards first
      const selectedCards = document.querySelectorAll('.bizcard-div.selected, .card-div.selected');
      selectedCards.forEach(card => {
        selection.restoreSavedStyle(card as HTMLElement);
        
        // Also deselect its line item
        const prevLineItemId = 'card-div-line-item-' + card.id;
        const prevLineItem = document.getElementById(prevLineItemId);
        if (prevLineItem && prevLineItem.classList.contains('selected')) {
          selection.restoreSavedStyle(prevLineItem as HTMLElement);
        }
      });
      
      // Now select the card and line item, ensuring colors match
      if (targetCardDiv) {
        // Update line item colors to match card before selecting
        const bgColor = targetCardDiv.getAttribute('saved-background-color');
        const textColor = targetCardDiv.getAttribute('saved-color');
        const selectedBgColor = targetCardDiv.getAttribute('saved-selected-background-color');
        const selectedTextColor = targetCardDiv.getAttribute('saved-selected-color');
        
        if (bgColor) cardDivLineItem.setAttribute('saved-background-color', bgColor);
        if (textColor) cardDivLineItem.setAttribute('saved-color', textColor);
        if (selectedBgColor) cardDivLineItem.setAttribute('saved-selected-background-color', selectedBgColor);
        if (selectedTextColor) cardDivLineItem.setAttribute('saved-selected-color', selectedTextColor);
        
        cardDivLineItem.style.backgroundColor = bgColor || '';
        cardDivLineItem.style.color = textColor || '';
        
        selection.setSelectedStyle(targetCardDiv as HTMLElement);
        selection.setSelectedStyle(cardDivLineItem);
        scrollElementIntoView(targetCardDiv as HTMLElement);
      }
    }
  });
  
  // No hover-based selection - line items only select on click

  // Assemble line item
  cardDivLineItem.appendChild(cardDivLineItemContent);
  cardDivLineItem.appendChild(cardDivLineItemRightColumn);
  rightContentDiv.appendChild(cardDivLineItem);

  // Make tag links mono-color-sensitive
  const tagLinkElements = cardDivLineItemContent.getElementsByClassName('tag-link');
  for (const element of Array.from(tagLinkElements)) {
    element.classList.add("mono-color-sensitive");
  }

  // Handle icons
  const deleteBackIcons = isBizcardDivId(targetCardDivId);
  const iconElements = cardDivLineItemContent.getElementsByClassName("icon");
  
  for (let i = iconElements.length - 1; i >= 0; i--) {
    const iconElement = iconElements[i] as HTMLElement;
    
    if (!iconElement.classList.contains('mono-color-sensitive')) {
      iconElement.classList.add('mono-color-sensitive');
    }
    
    const iconType = iconElement.dataset.icontype;
    if (deleteBackIcons && iconType === "back") {
      iconElement.parentNode?.removeChild(iconElement);
    }
  }

  // Apply mono-color to all sensitive elements
  for (const element of Array.from(cardDivLineItem.getElementsByClassName("mono-color-sensitive"))) {
    monoColor.applyMonoColorToElement(element as HTMLElement);
  }

  // Add click listeners to all icons, skill names, and bizcard links in the line item
  // Use dynamic import to avoid circular dependency
  import('./event_handlers.js').then(eventHandlers => {
    const icons = cardDivLineItemContent.querySelectorAll('.icon');
    icons.forEach(icon => {
      const iconType = (icon as HTMLElement).dataset.icontype;
      // Add listeners to all icon types (back, skill-back, url, img)
      if (iconType === 'back' || iconType === 'skill-back' || iconType === 'url' || iconType === 'img') {
        eventHandlers.addIconClickListener(icon as HTMLElement);
      }
    });
    
    // Add listeners to skill names
    const skillNames = cardDivLineItemContent.querySelectorAll('.skill-name');
    skillNames.forEach(skillName => {
      eventHandlers.addSkillNameClickListener(skillName as HTMLElement);
    });
    
    // Add listeners to bizcard links
    const bizcardLinks = cardDivLineItemContent.querySelectorAll('.bizcard-link');
    bizcardLinks.forEach(link => {
      eventHandlers.addBizcardLinkClickListener(link as HTMLElement);
    });
  });

  scrollElementToTop(cardDivLineItem);
  return cardDivLineItem;
}

/**
 * Get line item for a card div ID
 */
export function getCardDivLineItem(cardDivId: string): HTMLLIElement | null {
  if (!utils.isString(cardDivId)) return null;

  const cardDivLineItems = document.getElementsByClassName("card-div-line-item");
  const isABizcardDivId = isBizcardDivId(cardDivId);

  for (let i = 0; i < cardDivLineItems.length; i++) {
    const cardDivLineItem = cardDivLineItems[i] as HTMLLIElement;
    const isABizCardLineItemId = utils.isString(cardDivLineItem.id) && 
                                  cardDivLineItem.id.includes("bizcard-div-");

    if (String(cardDivLineItem.id).includes(cardDivId) && 
        isABizcardDivId === isABizCardLineItemId) {
      return cardDivLineItem;
    }
  }

  return null;
}

/**
 * Get the card div of a line item
 */
export function getCardDivOfCardDivLineItem(cardDivLineItem: HTMLLIElement): HTMLElement | null {
  const cardDivId = cardDivLineItem.id.replace("card-div-line-item-", "");
  return document.getElementById(cardDivId);
}

/**
 * Clear all card div line items
 */
export function clearAllDivCardLineItems(): void {
  const allCardDivLineItems = document.getElementsByClassName("card-div-line-item");
  for (let i = allCardDivLineItems.length - 1; i >= 0; i--) {
    allCardDivLineItems[i].remove();
  }
}
