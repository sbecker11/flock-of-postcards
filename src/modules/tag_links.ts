// Tag link processing for skill references in job descriptions

import type { TagLink } from './types.js';
import * as monoColor from './monoColor.js';
import * as cardModule from './card.js';
import { BULLET_DELIMITER, BULLET_JOINER } from './constants.js';

// Global tag links registry
let allTagLinks: TagLink[] = [];

export function initAllTagLinks(): void {
  allTagLinks = [];
}

export function getAllTagLinks(): TagLink[] {
  return allTagLinks;
}

/**
 * Create HTML for a URL anchor icon
 */
export function createUrlAnchorTag(url: string, savedColor: string): string {
  const iconColor = monoColor.getIconColor(savedColor);
  const iconType = "url";
  return `<img class="icon ${iconType}-icon mono-color-sensitive" src="static_content/icons/icons8-${iconType}-16-${iconColor}.png" data-url="${url}" data-saved-color="${iconColor}" data-icontype="${iconType}"/>`;
}

/**
 * Create HTML for an image anchor icon
 */
export function createImgAnchorTag(img: string, savedColor: string): string {
  const iconColor = monoColor.getIconColor(savedColor);
  const iconType = "img";
  return `<img class="icon img-icon mono-color-sensitive" src="static_content/icons/icons8-${iconType}-16-${iconColor}.png" data-img="${img}" data-saved-color="${iconColor}" data-icontype="${iconType}"/>`;
}

/**
 * Create HTML for a back navigation icon
 */
export function createBackAnchorTag(
  bizcard_id: string,
  savedColor: string,
  isMonocolorSensitive: boolean = true
): string {
  const iconColor = monoColor.getIconColor(savedColor);
  const iconType = "back";
  const monoColorSensitiveClass = isMonocolorSensitive ? "mono-color-sensitive" : '';
  return `<img class="icon back-icon ${monoColorSensitiveClass}" src="static_content/icons/icons8-${iconType}-16-${iconColor}.png" data-bizcard-id="${bizcard_id}" data-saved-color="${iconColor}" data-icontype="${iconType}"/>`;
}

/**
 * Process bizcard description HTML to extract and format tag links
 */
export function process_bizcard_description_HTML(
  bizcardDiv: HTMLDivElement,
  description_HTML: string,
  canvas: HTMLElement
): [string, TagLink[]] {
  const processed_items: string[] = [];
  const bizcardTagLinks: TagLink[] = [];
  const description_items = description_HTML.split(BULLET_DELIMITER);

  if (description_items.length > 0) {
    for (let i = 0; i < description_items.length; i++) {
      const description_item = description_items[i].trim();
      if (description_item.length > 0) {
        const { newTagLinks, updatedString } = process_bizcard_description_item(bizcardDiv, description_item, canvas);
        if (updatedString && updatedString.length > 0) {
          processed_items.push(updatedString);
        }
        if (newTagLinks && newTagLinks.length > 0) {
          allTagLinks = allTagLinks.concat(newTagLinks);
          bizcardTagLinks.push(...newTagLinks);
        }
      }
    }
  }

  let processed_bizcard_description_HTML = description_HTML;
  if (processed_items.length > 0) {
    processed_bizcard_description_HTML = processed_items.join(BULLET_JOINER);
  }

  return [processed_bizcard_description_HTML, bizcardTagLinks];
}

/**
 * Process a single description item to extract tag links
 */
export function process_bizcard_description_item(
  bizcardDiv: HTMLDivElement,
  inputString: string,
  canvas: HTMLElement
): { newTagLinks: TagLink[]; updatedString: string } {
  if (!bizcardDiv.id) {
    throw new Error(`bizcardDiv must have an id attribute`);
  }
  if (!bizcardDiv.style.color) {
    throw new Error(`bizcardDiv:${bizcardDiv.id} must have a style.color attribute`);
  }

  // Remove ignorable placeholders
  inputString = inputString.replace(/\(url\)/g, '');
  inputString = inputString.replace(/\{img\}/g, '');

  // Pattern: [text]{img}(url) where img and url are optional
  const regex = /\[([^\]]+)\](?:\{([^\}]+)\})?(?:\(([^\)]+)\))?/;
  const matches = inputString.match(new RegExp(regex, 'g'));

  if (!matches) {
    return { newTagLinks: [], updatedString: inputString };
  }

  const newTagLinks: TagLink[] = matches.map(match => {
    const parsed = match.match(regex);
    return {
      text: parsed?.[1] || '',
      img: parsed?.[2] || '',
      url: parsed?.[3] || '',
      bizcardDivId: bizcardDiv.id
    };
  });

  let updatedString = inputString;

  newTagLinks.forEach(tag_link => {
    const { text, img, url } = tag_link;
    const savedColor = bizcardDiv.getAttribute('saved-color');

    if (!savedColor) {
      throw new Error(`bizcardDiv:${bizcardDiv.id} must have a saved-color attribute`);
    }

    let htmlElementStr = '';

    if (text) {
      htmlElementStr = `<u class="bizcard-link" data-bizcard-id="${bizcardDiv.id}" data-icontype="back" style="cursor: pointer;">${text}</u>`;
      let line2 = '';

      if (img) {
        line2 += createImgAnchorTag(img, savedColor);
      }

      if (url) {
        line2 += createUrlAnchorTag(url, savedColor);
      }

      line2 += createBackAnchorTag(bizcardDiv.id, savedColor);

      htmlElementStr += '<br/>' + line2;
      
      if (htmlElementStr.includes('undefined')) {
        throw new Error(`htmlElementStr must not have undefined values`);
      }
    }
    
    tag_link.html = htmlElementStr;

    // Create card div for this tag link
    cardModule.setCardDivIdOfTagLink(canvas, bizcardDiv, tag_link);

    const htmlSpanElementStr = `<span class="tag-link" data-saved-color="${savedColor}" targetCardDivId="${tag_link.cardDivId || ''}">${htmlElementStr}</span>`;

    let originalPattern = `[${text}]`;
    if (img) originalPattern += `{${img}}`;
    if (url) originalPattern += `(${url})`;

    updatedString = updatedString.replace(originalPattern, htmlSpanElementStr);
    
    if (updatedString.includes('undefined')) {
      throw new Error(`updatedString must not have undefined attribute`);
    }
  });

  return { newTagLinks, updatedString };
}

/**
 * Convert description HTML to line items HTML format
 */
export function convert_description_HTML_to_line_items_HTML(description_HTML: string): string {
  let HTML = '<p class="card-div-line-item-description">';
  const items = description_HTML.split(BULLET_DELIMITER);
  
  if (items.length > 0) {
    HTML += '<ul class="card-div-line-item-description-list">';
    for (const item of items) {
      const description_item = item.trim();
      if (description_item.length > 0) {
        HTML += `<li class='card-div-line-item-description-list-item'>${description_item}</li>`;
      }
    }
    HTML += "</ul>";
  } else {
    HTML += description_HTML;
  }
  
  HTML += "</p>";
  return HTML;
}
