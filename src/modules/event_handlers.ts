// Event handler functions for user interactions

import * as focalPoint from './focal_point.js';
import * as parallax from './parallax.js';
import * as autoscroll from './autoscroll.js';
import * as selection from './selection.js';
import * as alerts from './alerts.js';
import * as utils from './utils.js';
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
  selection.deselectTheSelectedCardDiv();
  // deselectTheSelectedCardDivLineItem would be called here
  handleFocalPointMove(canvasContainer, mouseY);
}

/**
 * Handle card div mouse enter
 */
export function handleCardDivMouseEnter(event: MouseEvent): void {
  const targetCardDiv = (event.target as HTMLElement).closest('.card-div, .bizcard-div');
  if (targetCardDiv) {
    selection.setSelectedStyle(targetCardDiv as HTMLElement);
  }
}

/**
 * Handle card div mouse leave
 */
export function handleCardDivMouseLeave(event: MouseEvent): void {
  const targetCardDiv = (event.target as HTMLElement).closest('.card-div, .bizcard-div');
  if (targetCardDiv) {
    selection.restoreSavedStyle(targetCardDiv as HTMLElement);
  }
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
    selection.selectTheCardDiv(cardDiv, true);
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
              selection.selectTheCardDiv(bizcardDiv, true);
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
