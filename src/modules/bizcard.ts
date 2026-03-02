// Bizcard div creation and management

import type { Job, DatedDivId } from './types.js';
import { getBizcardDivIdFromIndex } from './dom_helpers.js';
import * as utils from './utils.js';
import * as timeline from './timeline.js';
import * as zDepth from './z_depth.js';
import * as tagLinks from './tag_links.js';
import * as colorPalette from './color_palette.js';
import * as monoColor from './monoColor.js';
import { 
  BIZCARD_WIDTH, 
  BIZCARD_INDENT, 
  MIN_BIZCARD_HEIGHT 
} from './constants.js';
import { 
  getNextBizcardDivId,
  getBizcardDivIndex 
} from './dom_helpers.js';

let dateSortedBizcardIds: DatedDivId[] | null = null;
let usePaletteColors: boolean = false;

/**
 * Enable or disable palette-based colors
 */
export function setUsePaletteColors(enabled: boolean): void {
  usePaletteColors = enabled;
}

/**
 * Check if palette colors are enabled
 */
export function isUsingPaletteColors(): boolean {
  return usePaletteColors;
}

/**
 * Create all bizcard divs from the jobs array
 */
export function createBizcardDivs(canvas: HTMLElement): void {
  const sortedJobs = structuredClone(jobs);
  sortedJobs.sort((a, b) => new Date(b['end']).getTime() - new Date(a['end']).getTime());

  for (const job of sortedJobs) {
    createBizcardDiv(canvas, job);
  }
}

/**
 * Create a single bizcard div from a job
 */
function createBizcardDiv(canvas: HTMLElement, job: Job): HTMLDivElement {
  const role = job["role"];
  const employer = job["employer"].trim();
  
  let css_hex_background_color_str: string;
  let css_hex_color_str: string;
  
  if (usePaletteColors) {
    // Use palette colors based on the bizcard index
    const bizcardDivs = document.getElementsByClassName("bizcard-div");
    const bizcardIndex = bizcardDivs.length;
    
    css_hex_background_color_str = colorPalette.getColorByIndex(bizcardIndex).toUpperCase();
    utils.validateHexColorString(css_hex_background_color_str);
    
    // Calculate appropriate text color based on background brightness
    css_hex_color_str = colorPalette.getContrastTextColor(css_hex_background_color_str);
  } else {
    // Use background from job data; always derive text color from contrast
    css_hex_background_color_str = job["css RGB"].trim().toUpperCase();
    utils.validateHexColorString(css_hex_background_color_str);

    css_hex_color_str = colorPalette.getContrastTextColor(css_hex_background_color_str);
  }

  // Parse end date
  const jobEndParts = job["end"].split("-");
  let endYearStr = jobEndParts[0];
  let endMonthStr = jobEndParts[1];

  const endYearStrIsCURRENT_DATE = (endYearStr === 'CURRENT_DATE');
  if (endYearStrIsCURRENT_DATE) {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    endYearStr = `${nextMonth.getFullYear()}`;
    endMonthStr = `${nextMonth.getMonth() + 1}`;
  }

  const endDate = new Date(`${endYearStr}-${endMonthStr}-01`);
  const jobEndStr = endYearStrIsCURRENT_DATE ? "current" : endDate.toISOString().slice(0, 7);
  const endBottomPx = timeline.getTimelineYearMonthBottom(endYearStr, endMonthStr);

  // Parse start date
  const jobStartParts = job["start"].split("-");
  const startYearStr = jobStartParts[0];
  const startMonthStr = jobStartParts[1];

  const startDate = new Date(`${startYearStr}-${startMonthStr}-01`);
  const jobStartStr = startDate.toISOString().slice(0, 7);
  const startBottomPx = timeline.getTimelineYearMonthBottom(startYearStr, startMonthStr);

  const heightPx = Math.max(startBottomPx - endBottomPx, MIN_BIZCARD_HEIGHT);
  const zIndexStr = job["z-index"];
  const zIndex = parseInt(zIndexStr);
  const z = zDepth.get_z_from_zIndexStr(zIndexStr);
  const indent = (zIndex - 1) * BIZCARD_INDENT;

  // Create the bizcard div
  const bizcardDiv = document.createElement("div");
  const top = endBottomPx;
  const height = heightPx;
  const left = indent;
  const width = BIZCARD_WIDTH;

  bizcardDiv.id = getNextBizcardDivId();
  bizcardDiv.classList.add("bizcard-div");
  bizcardDiv.style.top = `${top}px`;
  bizcardDiv.style.height = `${height}px`;
  bizcardDiv.style.left = `${left}px`;
  bizcardDiv.style.width = `${width}px`;
  bizcardDiv.style.zIndex = zIndexStr;

  canvas.appendChild(bizcardDiv);
  bizcardDiv.dataset.employer = employer;
  bizcardDiv.dataset.cardDivIds = "";

  try {
    bizcardDiv.setAttribute("endDate", utils.getIsoDateString(endDate));
  } catch (e) {
    console.error(e);
  }
  bizcardDiv.setAttribute("startDate", utils.getIsoDateString(startDate));

  // Save original position
  const originalCtrX = left + width / 2;
  const originalCtrY = top + height / 2;
  const originalZ = z;
  bizcardDiv.setAttribute("originalLeft", `${bizcardDiv.offsetLeft}`);
  bizcardDiv.setAttribute("originalTop", `${bizcardDiv.offsetTop}`);
  bizcardDiv.setAttribute("originalWidth", `${bizcardDiv.offsetWidth}`);
  bizcardDiv.setAttribute("originalHeight", `${bizcardDiv.offsetHeight}`);
  bizcardDiv.setAttribute("originalCtrX", `${originalCtrX}`);
  bizcardDiv.setAttribute("originalCtrY", `${originalCtrY}`);
  bizcardDiv.setAttribute("originalZ", `${originalZ}`);

  // Save colors
  bizcardDiv.setAttribute("saved-background-color", css_hex_background_color_str);
  bizcardDiv.setAttribute("saved-color", css_hex_color_str);
  const adjustedHexBackgroundColor = utils.lightenHexColor(css_hex_background_color_str, 0.35);
  utils.validateHexColorString(adjustedHexBackgroundColor);
  bizcardDiv.setAttribute("saved-selected-background-color", adjustedHexBackgroundColor);
  bizcardDiv.setAttribute("saved-selected-color", colorPalette.getContrastTextColor(adjustedHexBackgroundColor));

  bizcardDiv.setAttribute("saved-zIndexStr", zIndexStr);
  bizcardDiv.setAttribute("saved-filterStr", zDepth.get_filterStr_from_z(z));

  // Apply styles
  bizcardDiv.style.zIndex = bizcardDiv.getAttribute("saved-zIndexStr") || "";
  bizcardDiv.style.filter = bizcardDiv.getAttribute("saved-filterStr") || "";
  bizcardDiv.style.backgroundColor = bizcardDiv.getAttribute("saved-background-color") || "";
  bizcardDiv.style.color = bizcardDiv.getAttribute("saved-color") || "";

  // Process description
  const description_raw = job["Description"];
  if (description_raw && description_raw.length > 0) {
    const [description_HTML, bizcardTagLinks] = tagLinks.process_bizcard_description_HTML(
      bizcardDiv, 
      description_raw,
      canvas
    );
    bizcardDiv.setAttribute("Description", description_HTML);
    bizcardDiv.setAttribute("TagLinks", JSON.stringify(bizcardTagLinks));
  }

  // Set content
  let html = "";
  html += `<span class="bizcard-div-role">${role}</span><br/>`;
  html += `(${bizcardDiv.id})<br/>`;
  html += `<span class="bizcard-div-employer">${employer}</span><br/>`;
  html += `<span class="bizcard-div-dates">${jobStartStr} - ${jobEndStr}</span><br/>`;
  bizcardDiv.innerHTML = html;

  utils.validateIsCardDivOrBizcardDiv(bizcardDiv);
  
  return bizcardDiv;
}

/**
 * Add skill card list to a bizcard if there's sufficient space
 */
export function addSkillCardListToBizcard(bizcardDiv: HTMLDivElement): void {
  const cardDivIds = bizcardDiv.dataset.cardDivIds;
  console.log(`  ${bizcardDiv.id}: cardDivIds="${cardDivIds}"`);
  
  if (!cardDivIds || cardDivIds.length === 0) {
    console.log(`    → No cardDivIds, skipping`);
    return;
  }
  
  // Parse the comma-separated card IDs
  const cardIds = cardDivIds.split(',').filter(id => id.trim().length > 0);
  console.log(`    → Found ${cardIds.length} skill cards`);
  
  if (cardIds.length === 0) return;
  
  // Calculate how many skill items can fit based on bizcard height
  const bizcardHeight = parseInt(bizcardDiv.style.height) || 0;
  const PADDING_TOP = 20; // bizcard padding-top
  const PADDING_BOTTOM = 25; // bizcard padding-bottom
  const TITLE_HEIGHT = 80; // Approximate height for title, dates, etc. (increased)
  const ITEM_HEIGHT = 20; // Each skill item is ~20px (18px actual + safety margin)
  const LIST_MARGIN_TOP = 10; // margin-top for list
  const LIST_MARGIN_BOTTOM = 15; // margin-bottom for list
  const SAFETY_BUFFER = 30; // Extra buffer to prevent overflow (doubled)
  
  const availableHeight = bizcardHeight - PADDING_TOP - PADDING_BOTTOM - TITLE_HEIGHT - LIST_MARGIN_TOP - LIST_MARGIN_BOTTOM - SAFETY_BUFFER;
  const maxItems = Math.max(1, Math.floor(availableHeight / ITEM_HEIGHT));
  
  console.log(`    → Height: ${bizcardHeight}px, available: ${availableHeight}px, can fit ${maxItems} items`);
  
  // Limit card IDs to what will fit
  const displayCardIds = cardIds.slice(0, maxItems);
  
  // Get color for icons
  const savedColor = bizcardDiv.getAttribute('saved-color') || '#FFFFFF';
  const iconColor = monoColor.getIconColor(savedColor);
  
  // Build the skill card list HTML
  let listHTML = '<div class="bizcard-skill-list">';
  
  for (const cardId of displayCardIds) {
    const cardDiv = document.getElementById(cardId);
    if (!cardDiv) continue;
    
    // Get the skill name from the card's tag-link
    const tagLink = cardDiv.querySelector('.tag-link');
    const skillName = tagLink ? tagLink.textContent?.trim() : cardId;
    
    // Add list item with back icon as bullet pointing to the skill card
    listHTML += `<div class="bizcard-skill-item">`;
    listHTML += `<img class="icon back-icon skill-back-icon mono-color-sensitive" src="${monoColor.getIconUrl('back', iconColor)}" data-card-id="${cardId}" data-saved-color="${iconColor}" data-icontype="skill-back">`;
    listHTML += `<span class="skill-name" data-card-id="${cardId}" data-icontype="skill-back" style="cursor: pointer;">${skillName}</span>`;
    listHTML += `</div>`;
  }
  
  listHTML += '</div>';
  
  console.log(`    → Adding ${displayCardIds.length}/${cardIds.length} skills to list`);
  
  // Append to bizcard
  bizcardDiv.innerHTML += listHTML;
  
  console.log(`    ✓ Skill list added to ${bizcardDiv.id}`);
}

/**
 * Add click listeners to back icons in bizcard skill lists
 * Must be called after all skill lists are added
 */
export function addBackIconClickListeners(): void {
  // Import here to avoid circular dependency
  import('./event_handlers.js').then(eventHandlers => {
    const skillLists = document.querySelectorAll('.bizcard-skill-list');
    let iconCount = 0;
    let nameCount = 0;
    
    skillLists.forEach(skillList => {
      const backIcons = skillList.querySelectorAll('.back-icon');
      backIcons.forEach(icon => {
        eventHandlers.addIconClickListener(icon as HTMLElement);
        iconCount++;
      });
      
      const skillNames = skillList.querySelectorAll('.skill-name');
      skillNames.forEach(skillName => {
        console.log(`  Attaching listener to skill name: ${(skillName as HTMLElement).dataset.cardId}`);
        eventHandlers.addSkillNameClickListener(skillName as HTMLElement);
        nameCount++;
      });
    });
    
    console.log(`Added click listeners to ${iconCount} back icons and ${nameCount} skill names in skill lists`);
  });
}

/**
 * Add skill card lists to all bizcards
 * Should be called after all skill cards are created and associated
 */
export function addSkillCardListsToAllBizcards(): void {
  console.log('\nAdding skill card lists to bizcards...');
  const bizcardDivs = document.getElementsByClassName('bizcard-div');
  console.log(`Found ${bizcardDivs.length} bizcards`);
  
  let addedCount = 0;
  
  for (let i = 0; i < bizcardDivs.length; i++) {
    const bizcardDiv = bizcardDivs[i] as HTMLDivElement;
    const cardDivIds = bizcardDiv.dataset.cardDivIds;
    
    if (cardDivIds && cardDivIds.length > 0) {
      addSkillCardListToBizcard(bizcardDiv);
      addedCount++;
    }
  }
  
  console.log(`\n✓ Added skill card lists to ${addedCount}/${bizcardDivs.length} bizcards`);
}

/**
 * Get bizcard div end date
 */
export function getBizcardDivEndDate(bizcardDiv: HTMLDivElement): Date {
  const endDateStr = bizcardDiv.getAttribute("endDate");
  if (!endDateStr) throw new Error("Bizcard missing endDate");
  return new Date(endDateStr);
}

/**
 * Get bizcard div start date
 */
export function getBizcardDivStartDate(bizcardDiv: HTMLDivElement): Date {
  const startDateStr = bizcardDiv.getAttribute("startDate");
  if (!startDateStr) throw new Error("Bizcard missing startDate");
  return new Date(startDateStr);
}

/**
 * Get bizcard div duration in days
 */
export function getBizcardDivDays(bizcardDiv: HTMLDivElement): number {
  const endMillis = getBizcardDivEndDate(bizcardDiv).getTime();
  const startMillis = getBizcardDivStartDate(bizcardDiv).getTime();
  const bizcardMillis = endMillis - startMillis;
  return Math.floor(bizcardMillis / (1000 * 60 * 60 * 24));
}

/**
 * Get date-sorted bizcard IDs (cached)
 */
export function getDateSortedBizcardIds(): DatedDivId[] {
  if (dateSortedBizcardIds === null) {
    dateSortedBizcardIds = [];
    const bizcardDivs = document.getElementsByClassName("bizcard-div");
    
    for (let i = 0; i < bizcardDivs.length; i++) {
      const bizcardDiv = bizcardDivs[i] as HTMLDivElement;
      const datedDivId: DatedDivId = {
        id: bizcardDiv.id,
        endDate: getBizcardDivEndDate(bizcardDiv)
      };
      dateSortedBizcardIds.push(datedDivId);
    }
    
    // Sort in descending order (newest first)
    dateSortedBizcardIds.sort((a, b) => b.endDate.getTime() - a.endDate.getTime());
  }
  
  return dateSortedBizcardIds;
}

/**
 * Get date-sorted bizcard elements
 */
export function getDateSortedBizcards(): HTMLDivElement[] {
  const dateSortedBizcards: HTMLDivElement[] = [];
  const dateSortedIds = getDateSortedBizcardIds();
  
  for (const bizcardId of dateSortedIds) {
    const bizcardDiv = document.getElementById(bizcardId.id) as HTMLDivElement;
    if (bizcardDiv) {
      dateSortedBizcards.push(bizcardDiv);
    }
  }
  
  return dateSortedBizcards;
}

/**
 * Get first (newest) bizcard div ID
 */
export function getFirstBizcardDivId(): string | null {
  const sorted = getDateSortedBizcardIds();
  return sorted.length > 0 ? sorted[0].id : null;
}

/**
 * Get the ID of the bizcard that follows the given one
 */
export function getFollowingBizcardDivId(bizcardDivId?: string): string {
  if (!bizcardDivId) {
    const bizcardDiv = getLastBizcardDivWithLineItem();
    if (!bizcardDiv) {
      const allBizcardDivs = document.getElementsByClassName("bizcard-div");
      return allBizcardDivs.length > 0 ? (allBizcardDivs[0] as HTMLDivElement).id : "";
    }
    bizcardDivId = bizcardDiv.id;
  }

  const index = getBizcardDivIndex(bizcardDivId);
  if (index === null) return "";

  const followingBizcardDivId = getBizcardDivIdFromIndex(index + 1);
  return followingBizcardDivId || getBizcardDivIdFromIndex(0) || "";
}

/**
 * Get the last bizcard that has a line item
 */
export function getLastBizcardDivWithLineItem(): HTMLDivElement | null {
  const allBizcardDivLineItems = getAllBizcardDivLineItems();
  if (allBizcardDivLineItems && allBizcardDivLineItems.length > 0) {
    const lastLineItem = allBizcardDivLineItems[allBizcardDivLineItems.length - 1];
    const lastBizcardDivId = lastLineItem.getAttribute("targetCardDivId");
    if (lastBizcardDivId) {
      return document.getElementById(lastBizcardDivId) as HTMLDivElement;
    }
  }
  return null;
}

/**
 * Get all bizcard div line items
 */
function getAllBizcardDivLineItems(): HTMLLIElement[] {
  const allCardDivLineItems = Array.from(document.getElementsByClassName("card-div-line-item")) as HTMLLIElement[];
  return allCardDivLineItems.filter(item => item.id.includes("bizcard-div"));
}

/**
 * Get latest (newest) bizcard div ID
 */
export function getLatestBizcardDivId(): string | null {
  const dateSortedIds = getDateSortedBizcardIds();
  return dateSortedIds.length > 0 ? dateSortedIds[0].id : null;
}

/**
 * Get min and max years from jobs array
 */
export function getMinMaxTimelineYears(jobs: Job[]): [number, number] {
  let minYear = 10000;
  let maxYear = -10000;
  
  for (const job of jobs) {
    const jobEnd = job["end"].trim().replace("-01", "");
    const endYearStr = jobEnd.split("-")[0];
    const endYear = parseInt(endYearStr);
    if (endYear > maxYear) maxYear = endYear;

    const jobStart = job["start"].trim().replace("-01", "");
    const startYearStr = jobStart.split("-")[0];
    const startYear = parseInt(startYearStr);
    if (startYear < minYear) minYear = startYear;
  }
  
  minYear -= 1;
  maxYear += 1;
  
  return [minYear, maxYear];
}
