// Event handler functions for user interactions

import * as focalPoint from './focal_point.js';
import * as parallax from './parallax.js';
import * as autoscroll from './autoscroll.js';
import * as selection from './selection.js';
import * as alerts from './alerts.js';
import * as utils from './utils.js';
import * as lineItems from './line_items.js';
import { scrollElementIntoView } from './dom_helpers.js';
import type { CanvasContainerEventListener } from './types.js';

// Event listener registry
const canvasContainerEventListeners: CanvasContainerEventListener[] = [];

// Mouse tracking
let mouseX = 0;
let mouseY = 0;
let isMouseOverCanvasContainer = false;
let lastScrollTop: number | null = null;
let lastScrollTime: number | null = null;

/**
 * Handle canvas container mouse move
 */
export function handleCanvasContainerMouseMove(
  event: MouseEvent,
  canvasContainer: HTMLElement
): void {
  mouseX = event.clientX;
  mouseY = event.clientY;
  focalPoint.easeFocalPointTo(mouseX, mouseY);
}

/**
 * Handle focal point movement (triggers parallax and autoscroll)
 */
export function handleFocalPointMove(
  canvasContainer: HTMLElement,
  focalPointY: number
): void {
  autoscroll.updateAutoScrollVelocity(canvasContainer, focalPointY);
  autoscroll.manageAutoScrollInterval(canvasContainer);
  parallax.applyParallax(canvasContainer);
}

/**
 * Handle mouse enter canvas container
 */
export function handleMouseEnterCanvasContainer(
  event: MouseEvent,
  bullsEyeX: number,
  bullsEyeY: number
): void {
  isMouseOverCanvasContainer = true;
  focalPoint.easeFocalPointTo(event.clientX, event.clientY);
}

/**
 * Handle mouse leave canvas container
 */
export function handleMouseLeaveCanvasContainer(
  bullsEyeX: number,
  bullsEyeY: number
): void {
  isMouseOverCanvasContainer = false;
  focalPoint.easeFocalPointTo(bullsEyeX, bullsEyeY);
}

/**
 * Handle canvas container scroll
 */
export function handleCanvasContainerScroll(canvasContainer: HTMLElement): void {
  const thisTime = (new Date()).getTime();
  const thisScrollTop = canvasContainer.scrollTop;
  const deltaTime = (lastScrollTime !== null) ? (thisTime - lastScrollTime) : null;
  const deltaTop = (lastScrollTop !== null) ? (thisScrollTop - lastScrollTop) : null;
  
  lastScrollTime = thisTime;
  lastScrollTop = thisScrollTop;
}

/**
 * Handle canvas container wheel
 */
export function handleCanvasContainerWheel(wheelEvent: WheelEvent): void {
  focalPoint.easeFocalPointTo(wheelEvent.clientX, wheelEvent.clientY);
}

/**
 * Handle canvas container click
 */
export function handleCanvasContainerMouseClick(canvasContainer: HTMLElement): void {
  // Deselect any card that was selected via click
  selection.deselectTheSelectedCardDiv();
  
  // Deselect all selected bizcards
  const selectedBizcards = document.querySelectorAll('.bizcard-div.selected');
  selectedBizcards.forEach(card => {
    selection.restoreSavedStyle(card as HTMLElement);
  });
  
  // Deselect all selected skill cards
  const selectedCards = document.querySelectorAll('.card-div.selected');
  selectedCards.forEach(card => {
    selection.restoreSavedStyle(card as HTMLElement);
  });
  
  // Deselect all selected line items
  const selectedLineItems = document.querySelectorAll('.card-div-line-item.selected');
  selectedLineItems.forEach(lineItem => {
    selection.restoreSavedStyle(lineItem as HTMLElement);
  });
  
  handleFocalPointMove(canvasContainer, mouseY);
}

/**
 * Handle card div mouse enter
 */
export function handleCardDivMouseEnter(event: MouseEvent): void {
  // No hover-based selection - cards only select on click
  return;
}

/**
 * Handle card div mouse leave
 */
export function handleCardDivMouseLeave(event: MouseEvent): void {
  // No hover-based selection - cards only select on click
  return;
}

/**
 * Handle card div mouse move
 */
export function handleCardDivMouseMove(event: MouseEvent): void {
  // No hover-based selection - cards only select on click
  return;
}

/**
 * Handle card div click
 */
export function cardDivClickListener(event: MouseEvent): void {
  const element = event.target as HTMLElement;
  let cardDiv: HTMLElement | null = element;
  
  if (!utils.isCardDivOrBizcardDiv(cardDiv)) {
    cardDiv = cardDiv.closest('.card-div, .bizcard-div');
  }
  
  if (cardDiv && !element.classList.contains('icon')) {
    // Special handling for bizcards - toggle selection if already selected
    if (cardDiv.classList.contains('bizcard-div')) {
      if (cardDiv.classList.contains('selected')) {
        // Clicking on selected bizcard - deselect it
        selection.restoreSavedStyle(cardDiv as HTMLElement);
        
        // Also deselect its line item
        const lineItemId = 'card-div-line-item-' + cardDiv.id;
        const lineItem = document.getElementById(lineItemId);
        if (lineItem && lineItem.classList.contains('selected')) {
          selection.restoreSavedStyle(lineItem as HTMLElement);
        }
      } else {
        // Clicking on unselected bizcard - deselect ALL other selected cards first
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
        
        // Now select this bizcard
        selection.setSelectedStyle(cardDiv as HTMLElement);
        
        // Always scroll to position top edge at 20% from top
        scrollElementIntoView(cardDiv);
        
        // Add or get the line item
        const rightContentDiv = document.getElementById('right-content-div');
        if (rightContentDiv) {
          const lineItem = lineItems.addCardDivLineItem(rightContentDiv, cardDiv.id);
          if (lineItem) {
            // Ensure line item colors match card
            const bgColor = cardDiv.getAttribute('saved-background-color');
            const textColor = cardDiv.getAttribute('saved-color');
            const selectedBgColor = cardDiv.getAttribute('saved-selected-background-color');
            const selectedTextColor = cardDiv.getAttribute('saved-selected-color');
            
            if (bgColor) lineItem.setAttribute('saved-background-color', bgColor);
            if (textColor) lineItem.setAttribute('saved-color', textColor);
            if (selectedBgColor) lineItem.setAttribute('saved-selected-background-color', selectedBgColor);
            if (selectedTextColor) lineItem.setAttribute('saved-selected-color', selectedTextColor);
            
            lineItem.style.backgroundColor = bgColor || '';
            lineItem.style.color = textColor || '';
            
            selection.setSelectedStyle(lineItem as HTMLElement);
          }
        }
      }
    } else {
      // For skill cards, apply same toggle behavior as bizcards
      if (cardDiv.classList.contains('selected')) {
        // Clicking on selected skill card - deselect it
        selection.restoreSavedStyle(cardDiv as HTMLElement);
        
        // Also deselect its line item
        const lineItemId = 'card-div-line-item-' + cardDiv.id;
        const lineItem = document.getElementById(lineItemId);
        if (lineItem && lineItem.classList.contains('selected')) {
          selection.restoreSavedStyle(lineItem as HTMLElement);
        }
      } else {
        // Clicking on unselected skill card - deselect ALL other cards first
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
        
        // Now select this skill card
        selection.setSelectedStyle(cardDiv as HTMLElement);
        
        // Add or get the line item
        const rightContentDiv = document.getElementById('right-content-div');
        if (rightContentDiv) {
          const lineItem = lineItems.addCardDivLineItem(rightContentDiv, cardDiv.id);
          if (lineItem) {
            // Ensure line item colors match card
            const bgColor = cardDiv.getAttribute('saved-background-color');
            const textColor = cardDiv.getAttribute('saved-color');
            const selectedBgColor = cardDiv.getAttribute('saved-selected-background-color');
            const selectedTextColor = cardDiv.getAttribute('saved-selected-color');
            
            if (bgColor) lineItem.setAttribute('saved-background-color', bgColor);
            if (textColor) lineItem.setAttribute('saved-color', textColor);
            if (selectedBgColor) lineItem.setAttribute('saved-selected-background-color', selectedBgColor);
            if (selectedTextColor) lineItem.setAttribute('saved-selected-color', selectedTextColor);
            
            lineItem.style.backgroundColor = bgColor || '';
            lineItem.style.color = textColor || '';
            
            selection.setSelectedStyle(lineItem as HTMLElement);
          }
        }
      }
    }
    event.stopPropagation();
  }
}

/**
 * Add card div click listener
 */
export function addCardDivClickListener(cardDiv: HTMLElement): void {
  cardDiv.addEventListener("click", cardDivClickListener);
}

/**
 * Handle icon click
 */
export function addIconClickListener(icon: HTMLElement): void {
  icon.addEventListener("click", (event: Event) => {
    const mouseEvent = event as MouseEvent;
    const iconElement = mouseEvent.target as HTMLElement;
    mouseEvent.stopPropagation();

    if (iconElement) {
      const iconType = iconElement.dataset.icontype;
      const tag_link = iconElement.closest('span.tag-link');
      let tag_link_text = (tag_link && tag_link.textContent) ? tag_link.textContent : null;
      
      if (tag_link_text) {
        tag_link_text = tag_link_text.replace(/\(.*?\)/, "");
        tag_link_text = tag_link_text.replace(/\.$/, "");
      }

      switch (iconType) {
        case 'url': {
          const url = iconElement.dataset.url;
          if (url) {
            const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
            const urlStr = (tag_link_text && tag_link_text.length + cleanUrl.length < 40) 
              ? ` at <u>${cleanUrl}</u>` 
              : '';
            const title = tag_link_text 
              ? `the webpage for <b>${tag_link_text}</b>${urlStr}` 
              : `the webpage at ${cleanUrl}`;
            alerts.confirmOpenNewBrowserWindow(title, cleanUrl);
          }
          break;
        }
        case 'img': {
          const img = iconElement.dataset.img;
          if (img) {
            const cleanImg = img.endsWith('/') ? img.slice(0, -1) : img;
            const title = tag_link_text 
              ? `the image for <b>${tag_link_text}</b>` 
              : `the image at <u>${cleanImg}</u>`;
            alerts.confirmOpenNewBrowserWindow(title, cleanImg);
          }
          break;
        }
        case 'back': {
          const bizcardId = iconElement.dataset.bizcardId;
          if (bizcardId) {
            const bizcardDiv = document.getElementById(bizcardId);
            if (bizcardDiv) {
              // Deselect ALL currently selected cards (including the current skill card)
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
              
              // Now select the bizcard
              selection.setSelectedStyle(bizcardDiv as HTMLElement);
              
              // Add or get the line item
              const rightContentDiv = document.getElementById('right-content-div');
              if (rightContentDiv) {
                const lineItem = lineItems.addCardDivLineItem(rightContentDiv, bizcardId);
                if (lineItem) {
                  // Ensure line item colors match card
                  const bgColor = bizcardDiv.getAttribute('saved-background-color');
                  const textColor = bizcardDiv.getAttribute('saved-color');
                  const selectedBgColor = bizcardDiv.getAttribute('saved-selected-background-color');
                  const selectedTextColor = bizcardDiv.getAttribute('saved-selected-color');
                  
                  if (bgColor) lineItem.setAttribute('saved-background-color', bgColor);
                  if (textColor) lineItem.setAttribute('saved-color', textColor);
                  if (selectedBgColor) lineItem.setAttribute('saved-selected-background-color', selectedBgColor);
                  if (selectedTextColor) lineItem.setAttribute('saved-selected-color', selectedTextColor);
                  
                  lineItem.style.backgroundColor = bgColor || '';
                  lineItem.style.color = textColor || '';
                  
                  selection.setSelectedStyle(lineItem as HTMLElement);
                }
              }
              
              // Scroll the bizcard into view with 20% top offset
              scrollElementIntoView(bizcardDiv);
            }
          }
          break;
        }
        case 'skill-back': {
          const cardId = iconElement.dataset.cardId;
          if (cardId) {
            const cardDiv = document.getElementById(cardId);
            if (cardDiv) {
              // Deselect ALL currently selected cards (including the selected bizcard)
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
              
              // Now select this skill card
              selection.setSelectedStyle(cardDiv as HTMLElement);
              
              // Add or get the line item
              const rightContentDiv = document.getElementById('right-content-div');
              if (rightContentDiv) {
                const lineItem = lineItems.addCardDivLineItem(rightContentDiv, cardId);
                if (lineItem) {
                  // Ensure line item colors match card
                  const bgColor = cardDiv.getAttribute('saved-background-color');
                  const textColor = cardDiv.getAttribute('saved-color');
                  const selectedBgColor = cardDiv.getAttribute('saved-selected-background-color');
                  const selectedTextColor = cardDiv.getAttribute('saved-selected-color');
                  
                  if (bgColor) lineItem.setAttribute('saved-background-color', bgColor);
                  if (textColor) lineItem.setAttribute('saved-color', textColor);
                  if (selectedBgColor) lineItem.setAttribute('saved-selected-background-color', selectedBgColor);
                  if (selectedTextColor) lineItem.setAttribute('saved-selected-color', selectedTextColor);
                  
                  lineItem.style.backgroundColor = bgColor || '';
                  lineItem.style.color = textColor || '';
                  
                  selection.setSelectedStyle(lineItem as HTMLElement);
                }
              }
              
              // Scroll the skill card into view
              scrollElementIntoView(cardDiv);
            }
          }
          break;
        }
        default:
          console.error(`Illegal iconType: ${iconType}`);
          break;
      }
    }
    
    mouseEvent.stopPropagation();
  });
}

/**
 * Add click listener to a bizcard-link inside a line item description.
 * Navigates to the skill card identified by cardDivId (from the parent tag-link span).
 */
export function addSkillCardLinkClickListener(linkElement: HTMLElement, cardDivId: string): void {
  linkElement.addEventListener("click", (event: Event) => {
    const mouseEvent = event as MouseEvent;
    mouseEvent.stopPropagation();

    const cardDiv = document.getElementById(cardDivId);
    if (cardDiv) {
      const selectedCards = document.querySelectorAll('.bizcard-div.selected, .card-div.selected');
      selectedCards.forEach(card => {
        selection.restoreSavedStyle(card as HTMLElement);
        const prevLineItemId = 'card-div-line-item-' + card.id;
        const prevLineItem = document.getElementById(prevLineItemId);
        if (prevLineItem?.classList.contains('selected')) {
          selection.restoreSavedStyle(prevLineItem as HTMLElement);
        }
      });

      selection.setSelectedStyle(cardDiv as HTMLElement);

      const rightContentDiv = document.getElementById('right-content-div');
      if (rightContentDiv) {
        const lineItem = lineItems.addCardDivLineItem(rightContentDiv, cardDivId);
        if (lineItem) {
          const bgColor = cardDiv.getAttribute('saved-background-color');
          const textColor = cardDiv.getAttribute('saved-color');
          const selectedBgColor = cardDiv.getAttribute('saved-selected-background-color');
          const selectedTextColor = cardDiv.getAttribute('saved-selected-color');

          if (bgColor) lineItem.setAttribute('saved-background-color', bgColor);
          if (textColor) lineItem.setAttribute('saved-color', textColor);
          if (selectedBgColor) lineItem.setAttribute('saved-selected-background-color', selectedBgColor);
          if (selectedTextColor) lineItem.setAttribute('saved-selected-color', selectedTextColor);

          lineItem.style.backgroundColor = bgColor || '';
          lineItem.style.color = textColor || '';

          selection.setSelectedStyle(lineItem as HTMLElement);
        }
      }

      scrollElementIntoView(cardDiv);
    }
  });
}

/**
 * Add click listener to bizcard link text (same behavior as back icon)
 */
export function addBizcardLinkClickListener(bizcardLinkElement: HTMLElement): void {
  bizcardLinkElement.addEventListener("click", (event: Event) => {
    const mouseEvent = event as MouseEvent;
    mouseEvent.stopPropagation();
    
    const bizcardId = bizcardLinkElement.dataset.bizcardId;
    if (bizcardId) {
      const bizcardDiv = document.getElementById(bizcardId);
      if (bizcardDiv) {
        // Deselect ALL currently selected cards (including the current skill card)
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
        
        // Now select the bizcard
        selection.setSelectedStyle(bizcardDiv as HTMLElement);
        
        // Always scroll to position top edge at 20% from top
        scrollElementIntoView(bizcardDiv);
        
        // Add or get the line item
        const rightContentDiv = document.getElementById('right-content-div');
        if (rightContentDiv) {
          const lineItem = lineItems.addCardDivLineItem(rightContentDiv, bizcardId);
          if (lineItem) {
            // Ensure line item colors match card
            const bgColor = bizcardDiv.getAttribute('saved-background-color');
            const textColor = bizcardDiv.getAttribute('saved-color');
            const selectedBgColor = bizcardDiv.getAttribute('saved-selected-background-color');
            const selectedTextColor = bizcardDiv.getAttribute('saved-selected-color');
            
            if (bgColor) lineItem.setAttribute('saved-background-color', bgColor);
            if (textColor) lineItem.setAttribute('saved-color', textColor);
            if (selectedBgColor) lineItem.setAttribute('saved-selected-background-color', selectedBgColor);
            if (selectedTextColor) lineItem.setAttribute('saved-selected-color', selectedTextColor);
            
            lineItem.style.backgroundColor = bgColor || '';
            lineItem.style.color = textColor || '';
            
            selection.setSelectedStyle(lineItem as HTMLElement);
          }
        }
      }
    }
  });
}

/**
 * Add click listener to skill name span (same behavior as skill-back icon)
 */
export function addSkillNameClickListener(skillNameElement: HTMLElement): void {
  skillNameElement.addEventListener("click", (event: Event) => {
    const mouseEvent = event as MouseEvent;
    mouseEvent.stopPropagation();
    
    const cardId = skillNameElement.dataset.cardId;
    console.log(`Skill name clicked, cardId: ${cardId}`);
    if (cardId) {
      const cardDiv = document.getElementById(cardId);
      console.log(`  Found skill card: ${cardDiv ? 'yes' : 'no'}`);
      if (cardDiv) {
        // Deselect ALL currently selected cards (including the selected bizcard)
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
        
        // Now select this skill card
        selection.setSelectedStyle(cardDiv as HTMLElement);
        
        // Add or get the line item
        const rightContentDiv = document.getElementById('right-content-div');
        console.log(`  Right content div: ${rightContentDiv ? 'found' : 'not found'}`);
        if (rightContentDiv) {
          const lineItem = lineItems.addCardDivLineItem(rightContentDiv, cardId);
          console.log(`  Line item: ${lineItem ? 'created/found' : 'failed'}`);
          if (lineItem) {
            // Ensure line item colors match card
            const bgColor = cardDiv.getAttribute('saved-background-color');
            const textColor = cardDiv.getAttribute('saved-color');
            const selectedBgColor = cardDiv.getAttribute('saved-selected-background-color');
            const selectedTextColor = cardDiv.getAttribute('saved-selected-color');
            
            if (bgColor) lineItem.setAttribute('saved-background-color', bgColor);
            if (textColor) lineItem.setAttribute('saved-color', textColor);
            if (selectedBgColor) lineItem.setAttribute('saved-selected-background-color', selectedBgColor);
            if (selectedTextColor) lineItem.setAttribute('saved-selected-color', selectedTextColor);
            
            lineItem.style.backgroundColor = bgColor || '';
            lineItem.style.color = textColor || '';
            
            selection.setSelectedStyle(lineItem as HTMLElement);
          }
        }
        
        // Scroll the skill card into view
        scrollElementIntoView(cardDiv);
      }
    }
  });
}

/**
 * Add canvas container event listener
 */
export function addCanvasContainerEventListener(
  canvasContainer: HTMLElement,
  eventType: string,
  listener: EventListener,
  options?: AddEventListenerOptions
): void {
  canvasContainerEventListeners.push({ eventType, listener, options });
  canvasContainer.addEventListener(eventType, listener, options);
}

/**
 * Get current mouse position
 */
export function getMousePosition(): { x: number; y: number } {
  return { x: mouseX, y: mouseY };
}
