// modules/colorPalettes.mjs

import * as colorUtils from './colorUtils.mjs';
import * as utils from '../utils/utils.mjs';

// Directory where palette files are stored
const PALETTE_DIR = './static_content/colorPalettes/';
const MANIFEST_ENDPOINT = '/api/palette-manifest';
const FALLBACK_LIGHT_RGBA = 'rgba(100,100,100,1.0)';
const FALLBACK_DARK_RGBA = 'rgba(64,64,64,1.0)';
const FALLBACK_LIGHT_HEX = '#CCCCCC';
const FALLBACK_DARK_HEX = '#666666';    
const FALLBACK_WHITE_HEX = '#FFFFFF';
const FALLBACK_GREY_HEX = '#888888';
const FALLBACK_BLACK_HEX = '#000000';

// Add localStorage key constant
const LOCAL_STORAGE_PALETTE_KEY = 'lastSelectedPalette';

// Add these constants at the top with other constants
const HOVER_CLASS = 'color-hover';
const SELECTED_CLASS = 'color-selected';

// Constants for CSS class names and selectors
const CSS_CLASS = {
    PALETTE_PREFIX: 'palette',
    COLOR_PREFIX: 'color',
    SELECTED: 'selected',
    BASE_STYLES: 'palette-styles',
    HOVER_STYLES: 'palette-hover-styles'
};

// Helper to generate sanitized class names
function generateClassName(paletteName, colorIndex, state = '') {
    const sanitizedName = paletteName.replace(/[^a-zA-Z0-9-]/g, '-');
    const base = `${CSS_CLASS.PALETTE_PREFIX}-${sanitizedName}-${CSS_CLASS.COLOR_PREFIX}-${colorIndex}`;
    return state ? `${base}-${state}` : base;
}

// Object to hold loaded palettes
let _color_palettes = {};
let _palettesLoadedPromise = null; // Promise to track loading state
let _orderedPaletteNames = []; // Store the ordered names here
let _filenameToNameMap = {}; // Store mapping from filename to internal name
let _selectorInstance = null; // Cache for the resolved selector instance

// Add a ColorSet class to manage the four colors for each palette entry
class ColorSet {
    constructor(normalBg, normalFg, selectedBg, selectedFg) {
        this.normalBg = normalBg;
        this.normalFg = normalFg;
        this.selectedBg = selectedBg;
        this.selectedFg = selectedFg;
    }
}

async function loadOrRefreshPalettes(isRefresh = false) {
    const functionName = isRefresh ? "Refreshing" : "Loading";

    // Force clean state for refresh
    if (isRefresh) {
        _color_palettes = {};
        _orderedPaletteNames = [];
        _filenameToNameMap = {};
    }

    let newPaletteFiles = [];
    let attempt = 1;
    try {
        // --- Attempt 1 --- 
        const manifestResponse = await fetch(MANIFEST_ENDPOINT);
        if (!manifestResponse.ok) { throw new Error(`Manifest fetch failed: ${manifestResponse.status}`); }
        const manifestData = await manifestResponse.json();
        if (!Array.isArray(manifestData)) { throw new Error("Invalid manifest format"); }
        newPaletteFiles = manifestData;

    } catch (error1) {
        console.warn(`Manifest fetch attempt ${attempt} failed:`, error1.message);
        attempt++;
        // Wait 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000)); 
        try {
            // --- Attempt 2 --- 
            const manifestResponse = await fetch(MANIFEST_ENDPOINT);
            if (!manifestResponse.ok) { throw new Error(`Manifest fetch failed: ${manifestResponse.status}`); }
            const manifestData = await manifestResponse.json();
            if (!Array.isArray(manifestData)) { throw new Error("Invalid manifest format"); }
            newPaletteFiles = manifestData;
        } catch (error2) {
             // If second attempt also fails, log critical and apply fallBack/rethrow
            console.error(`CRITICAL: Manifest fetch attempt ${attempt} also failed:`, error2.message);
            console.error(`CRITICAL: Failed to load ${isRefresh ? 'refreshed ' : ''}palette manifest from ${MANIFEST_ENDPOINT}. Cannot proceed.`);
            if (!isRefresh) { // Only set fallBack on initial load fail
                _color_palettes = { "Error": ["#FF0000", "#000000"] };
                _orderedPaletteNames = ["Error"];
                _filenameToNameMap = {};
            }
            throw error2; // Re-throw the second error to be caught by caller
        }
    }

    // --- Optimization Check (only for refresh) ---
    if (isRefresh) {
        const currentFilenames = Object.keys(_filenameToNameMap); // Get current filenames
        currentFilenames.sort((a, b) => { /* Use same sort as server */ 
            const regex = /^(\d+)-/; const matchA = a.match(regex); const matchB = b.match(regex);
            const numA = matchA ? parseInt(matchA[1], 10) : -1; const numB = matchB ? parseInt(matchB[1], 10) : -1;
            if (numA !== -1 && numB !== -1) return numA - numB; if (numA !== -1) return -1; if (numB !== -1) return 1;
            return a.localeCompare(b);
        });
        
        let listsAreIdentical = currentFilenames.length === newPaletteFiles.length &&
                                currentFilenames.every((value, index) => value === newPaletteFiles[index]);
        
        if (listsAreIdentical) {
            return false; // Indicate no update occurred
        }
    }
    // --- End Optimization Check ---

    // --- Process palette files and generate CSS ---
    const tempLoadedPalettes = {};
    const tempFilenameToNameMap = {};
    const cssRules = [
        '/* Palette Styles - Dynamically updated by colorPalettes.mjs */',
        '',
        '/* Default fallback styles */',
        '.palette-default-color-0 {',
        '    background-color: #CCCCCC;',
        '    color: #000000;',
        '}',
        '',
        '.palette-default-color-0.selected {',
        '    background-color: #FFFFFF;',
        '    color: #000000;',
        '}',
        '',
        '.palette-default-color-0:hover:not(.selected) {',
        '    background-color: #FFFFFF;',
        '    color: #000000;',
        '}',
        '',
        '/* Dynamic palette styles */'
    ];

    for (const filename of newPaletteFiles) {
        if (typeof filename !== 'string' || !filename.endsWith('.json')) {
            console.warn(`Skipping invalid entry in manifest: ${filename}`);
            continue;
        }

        const filePath = PALETTE_DIR + filename;
        try {
            const response = await fetch(filePath);
            const rawText = await response.text();
            let paletteData = JSON.parse(rawText.trim());

            if (paletteData && paletteData.name && Array.isArray(paletteData.colors)) {
                const paletteName = paletteData.name;
                const colors = paletteData.colors;
                
                // Store palette data
                tempLoadedPalettes[paletteName] = colors;
                tempFilenameToNameMap[filename] = paletteName;

                // Generate CSS rules for this palette
                colors.forEach((color, index) => {
                    const baseClass = generateClassName(paletteName, index);
                    
                    // Calculate colors
                    const normalBg = color;
                    const normalFg = colorUtils.getContrastingColor(normalBg);
                    const selectedBg = colorUtils.adjustBrightness(normalBg, 1.5);
                    const selectedFg = colorUtils.getContrastingColor(selectedBg);

                    // Add CSS rules with proper formatting
                    cssRules.push(
                        `/* Palette: ${paletteName}, Color: ${index} */`,
                        `.${baseClass} {`,
                        `    background-color: ${normalBg};`,
                        `    color: ${normalFg};`,
                        `}`,
                        '',
                        `.${baseClass}.selected {`,
                        `    background-color: ${selectedBg};`,
                        `    color: ${selectedFg};`,
                        `}`,
                        '',
                        `.${baseClass}:hover:not(.selected) {`,
                        `    background-color: ${selectedBg};`,
                        `    color: ${selectedFg};`,
                        `}`,
                        ''
                    );
                });
            }
        } catch (error) {
            console.error(`Failed to process palette file: ${filePath}`, error);
        }
    }

    // --- Update module state ---
    _color_palettes = tempLoadedPalettes;
    _filenameToNameMap = tempFilenameToNameMap;
    _orderedPaletteNames = newPaletteFiles
        .map(filename => _filenameToNameMap[filename])
        .filter(name => name && _color_palettes.hasOwnProperty(name));

    // --- Write CSS file ---
    try {
        const cssContent = cssRules.join('\n');
        const response = await fetch('/api/write-css', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: cssContent
        });
        
        if (!response.ok) {
            throw new Error(`Failed to write CSS file: ${response.status}`);
        }
        
        // Force browser to reload CSS file by adding/updating query parameter
        const linkEl = document.querySelector('link[href*="palette-styles.css"]');
        if (linkEl) {
            const href = linkEl.href.split('?')[0];
            linkEl.href = `${href}?v=${Date.now()}`;
        }

        console.log(`${functionName} complete. Generated CSS rules for ${_orderedPaletteNames.length} palettes.`);
    } catch (error) {
        console.error('Failed to update CSS file:', error);
        // Fall back to injecting styles directly if file write fails
        const styleEl = document.getElementById(CSS_CLASS.BASE_STYLES) || document.createElement('style');
        styleEl.id = CSS_CLASS.BASE_STYLES;
        styleEl.textContent = cssRules.join('\n');
        if (!styleEl.parentNode) {
            document.head.appendChild(styleEl);
        }
    }

    if (_orderedPaletteNames.length === 0) {
        console.error("CRITICAL: No valid color palettes were loaded. Check manifest and JSON files.");
        // Set fallBack state with basic CSS
        _color_palettes = { "Default": ["#CCCCCC", "#AAAAAA", "#888888"] };
        _orderedPaletteNames = ["Default"];
        _filenameToNameMap = {};
        styleEl.textContent = `
            .${CSS_CLASS.PALETTE_PREFIX}-default-${CSS_CLASS.COLOR_PREFIX}-0 {
                background-color: #CCCCCC;
                color: #000000;
            }
        `;
        if (!isRefresh) throw new Error("Initial palette load resulted in zero palettes.");
    }
    
    return true;
}

// Initial load wrapper (kept separate for clarity)
async function initialPaletteLoad() {
    try {
        await loadOrRefreshPalettes(false);
        // Force an immediate refresh to ensure new contrast calculations
        if (_selectorInstance) {
            await _selectorInstance.refreshPalettes();
        }
    } catch (error) {
        console.error("Initial palette loading failed.");
        // Error already logged, fallbacks set in loadOrRefreshPalettes
        // We still need to resolve the promise, perhaps with null or a default selector?
    }
}

// Function to ensure palettes are loaded and get the selector
function getPaletteSelectorInstance() {
   if (_selectorInstance) {
       return _selectorInstance; // Return cached instance if available
   }
   
   if (!_palettesLoadedPromise) {
       _palettesLoadedPromise = initialPaletteLoad()
         .then(() => {
             // Create instance only after load attempt (even if failed, uses fallbacks)
             const selector = new PaletteSelector();
             _selectorInstance = selector; // Cache the instance
             return selector;
         });
         // No catch here, let errors propagate if initial load truly fails fatally
   }
   return _palettesLoadedPromise;
}

class PaletteSelector {
    #instance = null; // Keep singleton pattern if desired

    constructor() {
        if (this.#instance) {
            console.error("PaletteSelector instance already exists."); // Should ideally not happen with getPaletteSelectorInstance
            return this.#instance;
        }
        if (Object.keys(_color_palettes).length === 0) {
           throw new Error("Cannot instantiate PaletteSelector: _color_palettes is empty. Ensure palettes are loaded first.");
        }

        this.#instance = this;
        this.color_palettes = _color_palettes; // Use the loaded palettes

        // Try to get the last selected palette from localStorage
        const savedPalette = localStorage.getItem(LOCAL_STORAGE_PALETTE_KEY);
        // Use saved palette if it exists and is valid, otherwise use first palette
        this.current_value = (savedPalette && _color_palettes[savedPalette]) 
            ? savedPalette 
            : (_orderedPaletteNames.length > 0 ? _orderedPaletteNames[0] : null);

        if (!this.current_value) {
            throw new Error("Cannot initialize: No palettes available after loading.");
        }
        this.current_color_palette = this.color_palettes[this.current_value];
        this.current_num_colors = this.current_color_palette.length;

        // Initialize the color arrays before they can be used
        this.initializePaletteDivColors();

        this.paletteSelector = document.getElementById('color-palette-selector');
        if (!this.paletteSelector) {
            throw new Error("DOM Error: #color-palette-selector element not found.");
        }

        const container = document.getElementById('color-palette-container');
        if (!container) {
            throw new Error("DOM Error: #color-palette-container element not found.");
        }

        // Clear potentially old options before repopulating
        this.paletteSelector.innerHTML = '';

        // *** Populate the selector using the ORDERED names ***
        for (let palette_name of _orderedPaletteNames) {
            let option = document.createElement('option');
            option.value = palette_name;
            // Set selected based on the initial current_value determined from the ordered list
            option.selected = (palette_name === this.current_value);
            option.textContent = palette_name;
            this.paletteSelector.appendChild(option);
        }

        // *** Verify counts against the ORDERED list length ***
        if (this.paletteSelector.childElementCount !== _orderedPaletteNames.length) {
            console.warn("Mismatch in palette options count. Expected:", _orderedPaletteNames.length, "Got:", this.paletteSelector.childElementCount);
        }

        // Add event listeners (only once)
        if (!this.paletteSelector.dataset.listenerAdded) {
            // Change event for palette selection
            this.paletteSelector.addEventListener('change', (event) => {
                const selectedValue = event.target.value;
                console.log("Palette selected via UI:", selectedValue);
                this.selectPalette(selectedValue);
            });

            // Click event to handle focus
            container.addEventListener('click', () => {
                this.paletteSelector.focus();
            });

            // Prevent up/down keys from changing selection when not focused
            container.addEventListener('keydown', (event) => {
                if (!this.paletteSelector.matches(':focus')) {
                    event.stopPropagation();
                }
            });

            this.paletteSelector.dataset.listenerAdded = 'true';
        }

        // Apply the initial palette to both elements and document
        this.applyPaletteToElements();
        this.applyPaletteToDocument();

        // Initialize the CSS styles for the current palette
        this.updatePaletteStyles();
    }

    /**
     * Updates the CSS styles for the current palette
     */
    updatePaletteStyles() {
        const cssRules = [
            '/* Palette Styles - Dynamically updated */',
            '',
            '/* Reset any existing styles */',
            '[data-color-index] {',
            '    background-color: inherit;',
            '    color: inherit;',
            '    transition: none !important;',
            '}',
            ''
        ];

        // Add rules for each color in the current palette
        for (let colorIndex = 0; colorIndex < this.current_num_colors; colorIndex++) {
            const baseClass = generateClassName(this.current_value, colorIndex);
            const normalBg = this.current_color_palette[colorIndex];
            const normalFg = this.getContrastingColor(normalBg);
            const selectedBg = this.adjustBrightness(normalBg, 1.5);
            const selectedFg = this.getContrastingColor(selectedBg);

            cssRules.push(
                `/* Color ${colorIndex} */`,
                `body [data-color-index].${baseClass} {`,
                `    background-color: ${normalBg} !important;`,
                `    color: ${normalFg} !important;`,
                `}`,
                '',
                `body [data-color-index].${baseClass}.selected {`,
                `    background-color: ${selectedBg} !important;`,
                `    color: ${selectedFg} !important;`,
                `}`,
                '',
                `body [data-color-index].${baseClass}:hover:not(.selected) {`,
                `    background-color: ${selectedBg} !important;`,
                `    color: ${selectedFg} !important;`,
                `}`,
                ''
            );
        }

        // Update the CSS file via the server endpoint
        fetch('/api/write-css', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: cssRules.join('\n')
        }).catch(error => {
            console.error('Failed to update CSS file:', error);
            // Fallback: inject styles directly if server update fails
            let styleEl = document.getElementById('dynamic-palette-styles');
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'dynamic-palette-styles';
                document.head.appendChild(styleEl);
            }
            styleEl.textContent = cssRules.join('\n');
        });
    }

    /**
     * Applies the appropriate CSS classes to an element
     * @param {HTMLElement} element - The element to update
     */
    applyPaletteToElement(element) {
        if (!element) return;

        const colorIndex = this.getColorIndex(element);
        if (colorIndex === null) return;

        // Get the colors for this index
        const normalBg = this.current_color_palette[colorIndex];
        const normalFg = this.getContrastingColor(normalBg);

        // Apply colors directly as inline styles
        element.style.setProperty('background-color', normalBg, 'important');
        element.style.setProperty('color', normalFg, 'important');

        // Remove any existing palette classes
        element.className = element.className
            .split(' ')
            .filter(cls => !cls.startsWith(CSS_CLASS.PALETTE_PREFIX))
            .join(' ');

        // Add new palette class
        const baseClass = generateClassName(this.current_value, colorIndex);
        element.classList.add(baseClass);

        // Log for debugging removed to reduce noise
        // console.log(`Applied colors to element:`, {
        //     element: element,
        //     colorIndex: colorIndex,
        //     backgroundColor: normalBg,
        //     color: normalFg,
        //     class: baseClass
        // });
    }

    /**
     * Gets the normalized color index for an element
     * @param {HTMLElement} element - The element to check
     * @returns {number|null} The normalized color index or null if invalid
     */
    getColorIndex(element) { 
        if ( !element || !(element instanceof HTMLElement) ) {
            console.warn("skipping element that is null or is not an instance of HTMLElement");
            return null;
        }
        const data_color_index = element.getAttribute("data-color-index");
        // Removed debug log to reduce noise
        // console.log('Getting color index for element:', {
        //     element: element,
        //     'data-color-index': data_color_index,
        //     'current_num_colors': this.current_num_colors
        // });

        if (!utils.isNonEmptyString(data_color_index)) {
            console.warn('Invalid data-color-index:', data_color_index);
            return null;
        }

        const number_string = this.extractDigitsString(data_color_index);
        const data_color_int = parseInt(number_string, 10);
        const final_index = data_color_int % this.current_num_colors;

        // Removed debug log to reduce noise
        // console.log('Color index calculation:', {
        //     number_string,
        //     data_color_int,
        //     final_index,
        //     'palette_colors': this.current_color_palette
        // });

        return final_index;
    }

    /**
     * Updates all elements when palette changes
     */
    async selectPalette(selected_value) {
        if (!_color_palettes[selected_value]) {
            console.error(`Invalid palette: ${selected_value}`);
            return;
        }

        this.current_value = selected_value;
        this.current_color_palette = _color_palettes[selected_value];
        this.current_num_colors = this.current_color_palette.length;

        // Update all elements with new palette classes and colors
        console.log(`Applying palette ${selected_value} to all elements...`);
        const elements = document.querySelectorAll('[data-color-index]');
        console.log(`Found ${elements.length} elements to update`);
        elements.forEach(element => this.applyPaletteToElement(element));

        // Save selection and notify
        try {
            localStorage.setItem(LOCAL_STORAGE_PALETTE_KEY, selected_value);
            window.dispatchEvent(new CustomEvent('paletteChangeComplete', {
                detail: { palette: selected_value }
            }));
        } catch (error) {
            console.warn('Failed to save palette selection:', error);
        }
    }

    /**
     * Toggles selection state of an element
     */
    toggleSelection(element, forceState) {
        if (!element) return false;
        
        const currentlySelected = element.classList.contains(CSS_CLASS.SELECTED);
        const newState = (forceState !== undefined) ? forceState : !currentlySelected;

        if (newState !== currentlySelected) {
            element.classList.toggle(CSS_CLASS.SELECTED, newState);
            element.dispatchEvent(new CustomEvent('selectionChanged', {
                detail: { isSelected: newState },
                bubbles: true
            }));
        }

        return newState;
    }

    getFirstPalette() {
        // Return the name of the first loaded palette from the ordered list
        return _orderedPaletteNames.length > 0 ? _orderedPaletteNames[0] : null;
    }

    extractDigitsString(data_color_index) {
       // Ensure input is a string before calling replace
       return String(data_color_index).replace(/\D/g, '');
    }

    /**
     * Gets a contrasting color (black or white) for text on the given background color
     * @param {string} backgroundColor - The background color in hex format
     * @returns {string} Either black or white hex color
     */
    getContrastingColor(backgroundColor) {
        return colorUtils.getContrastingColor(backgroundColor);
    }

    initializePaletteDivColors() {
        // Replace arrays with a single array of ColorSet objects
        this.colorSets = new Array(this.current_num_colors);

        let hasInvalidColors = false;
        for (let index = 0; index < this.current_num_colors; index++) {
            const bg_hex_color_string = this.current_color_palette[index];
            
            // Validate background color format and convert if needed
            let normalBg = null;
            if (typeof bg_hex_color_string === 'string' && colorUtils.isValidHexColor(bg_hex_color_string)) {
                normalBg = bg_hex_color_string;
            } else {
                console.warn(`Invalid color at index ${index} in palette ${this.current_value}:`, bg_hex_color_string);
                normalBg = FALLBACK_LIGHT_HEX;
                hasInvalidColors = true;
            }

            try {
                // Calculate normal colors
                const normalFg = this.getContrastingColor(normalBg);

                // Calculate selected colors
                const bgRGB = colorUtils.get_RGB_from_Hex(normalBg);
                const bgHSV = colorUtils.get_HSV_from_RGB(bgRGB);
                bgHSV[2] = Math.min(bgHSV[2] * 1.5, 1.0); // Brighten by 50%, cap at 100%
                const selectedBg = colorUtils.get_Hex_from_HSV(bgHSV);
                const selectedFg = this.getContrastingColor(selectedBg);

                // Store all four colors in a ColorSet
                this.colorSets[index] = new ColorSet(normalBg, normalFg, selectedBg, selectedFg);

            } catch (error) {
                console.warn(`Error calculating colors for index ${index}:`, error);
                this.colorSets[index] = new ColorSet(
                    FALLBACK_LIGHT_HEX,
                    FALLBACK_DARK_HEX,
                    FALLBACK_WHITE_HEX,
                    FALLBACK_BLACK_HEX
                );
                hasInvalidColors = true;
            }
        }

        if (hasInvalidColors) {
            console.warn(`Palette "${this.current_value}" had some invalid colors that were replaced with fallbacks`);
        }

        this.darker_bg_hex_color = this.findDarkestBgHexColor();
    }

    findDarkestBgHexColor() {
        if (!this.colorSets || this.colorSets.length === 0) {
            return FALLBACK_GREY_HEX;
        }

        let darkest_value = Infinity;
        let darkest_bgHexColor = this.colorSets[0].normalBg;

        for (const colorSet of this.colorSets) {
            try {
                const RGB = colorUtils.get_RGB_from_Hex(colorSet.normalBg);
                const value = colorUtils.getEuclideanDistance(RGB, [0, 0, 0]);
                if (value < darkest_value) {
                    darkest_bgHexColor = colorSet.normalBg;
                    darkest_value = value;
                }
            } catch (error) {
                console.warn(`Error processing color ${colorSet.normalBg} for darkest calculation:`, error);
            }
        }
        return darkest_bgHexColor;
    }

    applyPaletteToElements(elements = null, selectedElements = new Set()) {
        if (elements === null) {
            elements = document.querySelectorAll("[data-color-index]");
        }
        console.log("colorPalettes:applyPaletteToElements: elements:", elements.length);

        // Apply colors to all elements immediately
        for (const element of elements) {
            if (element) {
                try {
                    const isSelected = selectedElements.has(element);
                    this.applyPaletteToElement(element);
                } catch (error) {
                    console.error("Error applying palette to element:", element, error);
                }
            }
        }
    }

    applyPaletteToDocument() {
        const root = document.documentElement;
        const darkHex = this.findDarkestBgHexColor();
        const fallbackLightRGBA = FALLBACK_LIGHT_RGBA;
        const fallbackDarkRGBA = FALLBACK_DARK_RGBA;
        if (!darkHex) return; // Don't proceed if darkest couldn't be found

        try {
            let darkRGB = colorUtils.get_RGB_from_Hex(darkHex);
            let darkHSV = colorUtils.get_HSV_from_RGB(darkRGB);

            // Calculate darker
            let darkerHSV = [...darkHSV]; // Clone
            darkerHSV[2] *= 0.75; // Reduce brightness less drastically
            const darkerHex = colorUtils.get_Hex_from_HSV(darkerHSV);

            // Calculate darkest
            let darkestHSV = [...darkHSV]; // Clone
            darkestHSV[2] *= 0.35; // Reduce brightness more
            const darkestHex = colorUtils.get_Hex_from_HSV(darkestHSV);
            const darkerRGB = colorUtils.get_RGB_from_Hex(darkerHex);
            const darkestRGB = colorUtils.get_RGB_from_Hex(darkestHex);
            const darkerRGBA = colorUtils.get_RGBA_from_RGB(darkerRGB, 1.0);
            const darkestRGBA = colorUtils.get_RGBA_from_RGB(darkestRGB, 1.0);

            root.style.setProperty('--background-light', darkerRGBA || FALLBACK_LIGHT_RGBA);
            root.style.setProperty('--background-dark', darkestRGBA || FALLBACK_DARK_RGBA);

            console.log(`Applied document background: light=${darkerRGBA}, dark=${darkestRGBA}`);

        } catch (error) {
            console.error("Error applying palette to document background:", error);
            // Apply fallBack defaults directly
            root.style.setProperty('--background-light', FALLBACK_LIGHT_RGBA);
            root.style.setProperty('--background-dark', FALLBACK_DARK_RGBA);
        }
    }

    async refreshPalettes() {
        try {
            const updated = await loadOrRefreshPalettes(true); // Call shared logic
            if (updated) { 
                // If updates occurred, rebuild the dropdown and reapply selection
                this.rebuildDropdown(); 
                await this.selectPalette(this.paletteSelector.value || this.getFirstPalette()); // Reselect current or first
                
                // Force CSS regeneration
                this.updatePaletteStyles();
                
                // Force reload of CSS file with error handling
                const linkEl = document.querySelector('link[href*="palette-styles.css"]');
                if (linkEl) {
                    const originalHref = linkEl.href.split('?')[0];
                    const newHref = originalHref + '?v=' + Date.now();
                    linkEl.href = newHref;
                    // Add an error handler to catch loading issues
                    linkEl.onerror = (error) => {
                        console.error('Failed to load CSS file:', error);
                        console.error('CSS URL:', newHref);
                        // Retry loading once more after a delay
                        setTimeout(() => {
                            console.log('Retrying CSS file load...');
                            linkEl.href = originalHref + '?v=' + (Date.now() + 1);
                        }, 1000);
                    };
                } else {
                    console.warn('CSS link element for palette-styles.css not found.');
                }
                
                console.log("Palette dropdown and styles refreshed.");
            }
        } catch (error) {
             console.error("Error during palette refresh process:", error);
        }
    }

    // --- Helper to rebuild dropdown --- 
    rebuildDropdown() {
        const currentSelectedValue = this.paletteSelector.value; // Remember current selection
        this.paletteSelector.innerHTML = ''; // Clear existing options
        let selectionStillExists = false;

        for (const name of _orderedPaletteNames) {
            if (!_color_palettes[name]) continue; // Safety check
            
            let option = document.createElement('option');
            option.value = name;
            option.textContent = name; // Display the internal name
            if (name === currentSelectedValue) {
                option.selected = true;
                selectionStillExists = true;
            }
            this.paletteSelector.appendChild(option);
        }

        // If the previously selected palette is gone, select the first one
        if (!selectionStillExists && _orderedPaletteNames.length > 0) {
            this.paletteSelector.value = _orderedPaletteNames[0];
            console.log(`Previous selection "${currentSelectedValue}" removed, selecting "${_orderedPaletteNames[0]}".`);
        } else if (_orderedPaletteNames.length === 0) {
            // Handle case where NO palettes are left after refresh
            let option = document.createElement('option');
            option.textContent = "(No palettes loaded)";
            option.disabled = true;
            this.paletteSelector.appendChild(option);
        }
    }

    getCurrentPalette() {
        return this.current_color_palette;
    }

    // Method to add hover and selection handlers to an element
    addElementStateHandlers(element) {
        if (!element || !element.colorSet) return;

        // Remove existing listeners to prevent duplicates
        element.removeEventListener('mouseenter', element._hoverHandler);
        element.removeEventListener('mouseleave', element._hoverHandler);
        element.removeEventListener('click', element._clickHandler);

        // Create hover handler using new showHoverState method
        element._hoverHandler = (event) => {
            this.showHoverState(element, event.type === 'mouseenter');
        };

        // Create click handler using new toggleSelection method
        element._clickHandler = () => {
            this.toggleSelection(element);
        };

        // Add the listeners
        element.addEventListener('mouseenter', element._hoverHandler);
        element.addEventListener('mouseleave', element._hoverHandler);
        element.addEventListener('click', element._clickHandler);
    }

    // Method to set selection state without triggering events
    setElementSelected(element, isSelected) {
        if (!element || !element.colorSet) return;
        
        if (isSelected) {
            element.classList.remove(HOVER_CLASS);
            element.classList.add(SELECTED_CLASS);
        } else {
            element.classList.remove(SELECTED_CLASS);
            // Check if we should keep hover state
            if (element.matches(':hover')) {
                element.classList.add(HOVER_CLASS);
            }
        }
        this.toggleElementState(element, isSelected);
    }

    // Method to get all selected elements - now using classList
    getSelectedElements() {
        return document.getElementsByClassName(SELECTED_CLASS);
    }

    // // Method to clear all selections - now using classList
    // clearAllSelections() {
    //     const selectedElements = this.getSelectedElements();
    //     // Convert to array since we're modifying the live HTMLCollection
    //     Array.from(selectedElements).forEach(element => {
    //         this.setElementSelected(element, false);
    //     });
    // }

    // Method to get all hovered elements - if needed
    getHoveredElements() {
        return document.getElementsByClassName(HOVER_CLASS);
    }

    // Add these utility methods to the PaletteSelector class

    /**
     * Unselects all elements of a given class that are descendants of a container element
     * @param {HTMLElement} containerElement - The container to search within
     * @param {string} className - The class to search for
     */
    unselectDescendants(containerElement, className) {
        if (!containerElement) return;
        
        // Fast query for selected elements of the given class within the container
        const selector = `${className}.${SELECTED_CLASS}`;
        const selectedElements = containerElement.getElementsByClassName(SELECTED_CLASS);
        
        // Convert to array since we're modifying the live HTMLCollection
        Array.from(selectedElements).forEach(element => {
            if (element.classList.contains(className)) {
                this.setElementSelected(element, false);
            }
        });
    }

    /**
     * Shows/hides hover state without changing selection
     * @param {HTMLElement} element - The element to show/hide hover on
     * @param {boolean} showHover - Whether to show or hide hover state
     */
    showHoverState(element, showHover) {
        if (!element || !element.colorSet) return;

        // Don't modify actual selection state
        const isSelected = element.classList.contains(SELECTED_CLASS);
        
        if (showHover && !isSelected) {
            element.classList.add(HOVER_CLASS);
            this.toggleElementState(element, true);
        } else if (!showHover && !isSelected) {
            element.classList.remove(HOVER_CLASS);
            this.toggleElementState(element, false);
        }
        // If selected, do nothing to preserve selection state
    }

    /**
     * Toggles selection state of an element
     * @param {HTMLElement} element - The element to toggle
     * @param {boolean} [forceState] - Optional state to force (true=selected, false=unselected)
     * @returns {boolean} The new selection state
     */
    toggleSelection(element, forceState) {
        if (!element || !element.colorSet) return false;

        const currentlySelected = element.classList.contains(SELECTED_CLASS);
        const newState = (forceState !== undefined) ? forceState : !currentlySelected;

        if (newState !== currentlySelected) {
            this.setElementSelected(element, newState);
            
            // Dispatch event for other components
            element.dispatchEvent(new CustomEvent('selectionChanged', {
                detail: { 
                    isSelected: newState,
                    element: element
                },
                bubbles: true
            }));
        }

        return newState;
    }

    /**
     * Gets all selected elements of a given class within a container
     * @param {HTMLElement} containerElement - The container to search within
     * @param {string} className - The class to filter by
     * @returns {Array<HTMLElement>} Array of selected elements
     */
    getSelectedElementsByClass(containerElement, className) {
        if (!containerElement) return [];
        
        // Get all selected elements within container
        const selectedElements = containerElement.getElementsByClassName(SELECTED_CLASS);
        
        // Filter for those that also have the target class
        return Array.from(selectedElements).filter(el => el.classList.contains(className));
    }

    /**
     * Utility to check if an element is selected
     * @param {HTMLElement} element - The element to check
     * @returns {boolean} Whether the element is selected
     */
    isElementSelected(element) {
        return element && element.classList.contains(SELECTED_CLASS);
    }

    /**
     * Utility to check if an element is being hovered
     * @param {HTMLElement} element - The element to check
     * @returns {boolean} Whether the element is being hovered
     */
    isElementHovered(element) {
        return element && element.classList.contains(HOVER_CLASS);
    }

    /**
     * Creates a color manager for a new element
     */
    createElementColorManager(element) {
        const data_color_index = element.getAttribute("data-color-index");
        if (!utils.isNonEmptyString(data_color_index)) {
            return null;
        }

        const number_string = this.extractDigitsString(data_color_index);
        const data_color_int = parseInt(number_string, 10);
        
        if (!this.colorSets || this.current_num_colors === 0) {
            return null;
        }

        const color_index = data_color_int % this.current_num_colors;
        const colorSet = this.colorSets[color_index];
        const manager = new ElementColorManager(element, colorSet);
        
        // Apply initial colors immediately
        manager.applyInitialColors();
        
        return manager;
    }

    /**
     * Updates all element colors when palette changes
     */
    updateElementManagers(elementManagers) {
        for (const [element, manager] of elementManagers) {
            const data_color_index = element.getAttribute("data-color-index");
            if (!data_color_index) continue;

            const number_string = this.extractDigitsString(data_color_index);
            const data_color_int = parseInt(number_string, 10);
            const color_index = data_color_int % this.current_num_colors;
            
            manager.updateColorSet(this.colorSets[color_index]);
        }
    }

    /**
     * Gets the current palette's color set for an index
     * @param {number} index - The color index
     * @returns {ColorSet} The color set for this index
     */
    getColorSetForIndex(index) {
        if (!this.colorSets || this.current_num_colors === 0) return null;
        return this.colorSets[index % this.current_num_colors];
    }

    // Add these example methods to demonstrate hover usage

    /**
     * Example of how to add hover handlers to an element
     * @param {HTMLElement} element - The element to add hover to
     */
    addHoverHandlers(element) {
        // Removed - hover is now handled entirely by CSS
        console.warn('addHoverHandlers is deprecated - hover is now handled by CSS');
    }

    /**
     * Get the CSS rules needed for an element's hover state
     * @param {HTMLElement} element - The element to get hover colors for
     * @returns {string} CSS rules for the element
     */
    getElementHoverCSS(element) {
        if (!element || !element.colorSet) return '';
        
        const colorIndex = element.getAttribute('data-color-index');
        return `
            [data-color-index="${colorIndex}"]:not(.color-selected):hover {
                background-color: ${element.colorSet.selectedBg} !important;
                color: ${element.colorSet.selectedFg} !important;
            }
        `;
    }

    /**
     * Add hover styles to the document for all color-managed elements
     */
    addHoverStyles() {
        // Create or get the style element for our hover rules
        let styleEl = document.getElementById('color-hover-styles');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'color-hover-styles';
            document.head.appendChild(styleEl);
        }

        // Build all hover rules
        const rules = [];
        document.querySelectorAll('[data-color-index]').forEach(element => {
            if (element.colorSet) {
                rules.push(this.getElementHoverCSS(element));
            }
        });

        // Apply all hover rules at once
        styleEl.textContent = rules.join('\n');
    }

    /**
     * Adjusts the brightness of a hex color
     * @param {string} hexColor - The hex color to adjust
     * @param {number} factor - The brightness factor (1 = no change, >1 brighter, <1 darker)
     * @returns {string} The adjusted hex color
     */
    adjustBrightness(hexColor, factor) {
        if (!colorUtils.isHexColorString(hexColor)) {
            throw new Error('Invalid hex color format');
        }
        return colorUtils.adjustHexBrightness(hexColor, factor);
    }
}

// Export necessary classes and utilities
export {
    PaletteSelector,
    ColorSet,
    loadOrRefreshPalettes,
    getPaletteSelectorInstance
};

// Force an immediate refresh when the module loads
getPaletteSelectorInstance().then(selector => {
    selector.refreshPalettes();
    // Force a second refresh after a short delay to ensure styles are applied
    setTimeout(() => {
        selector.updatePaletteStyles();
        selector.applyPaletteToElements();
    }, 100);
});

/**
 * Assigns a color index to an element based on its position in the sequence
 * @param {HTMLElement} element - The element to assign a color index to
 * @param {number} sequenceIndex - The index in the sequence (e.g. job index)
 * Then apply the current palette to the elements children recursively
 */
export function assignColorIndex(element, sequenceIndex) {
    if (!element || !(element instanceof HTMLElement) ) {
        console.warn("skipping element that is null or is not an instance of HTMLElement");
        return;
    }
    element.setAttribute('data-color-index', sequenceIndex.toString());
    applyCurrentPaletteToElement(element);
    for ( const child of Array.from(element.children) ) {
        assignColorIndex(child, sequenceIndex);
    }
}

export function getCurrentPalette() {
    return getPaletteSelectorInstance().then(selector => {
        return selector.current_color_palette;
    });
}

export function applyInternalCurrentPalette(palette) {
    if (!palette || !Array.isArray(palette?.colors)) {
        console.warn("Invalid palette. Using fallback colors.");
        palette = { 
            name: "fallback",
            colors: ['#FFFFFF', '#000000']  // Default colors
        };
    }

    // Safely convert colors to an array
    const colorList = Array.from(palette.colors);
    colorList.forEach((color, index) => {
        // Apply colors to UI elements
        console.log(`Applying color ${index}: ${color}`);
    });
}

/**
 * Uses the current palette to set the background-color
 * and foreground-color (color) of given element of it 
 * has a 'data-color-index' attibute.
 * Recursivley apply this update to all descendants of the 
 * given element.
 */
export function applyCurrentPaletteToElement(element) {
    const selector = getPaletteSelectorInstance();
    if (selector instanceof PaletteSelector) {
        // If we have the cached instance, use it directly
        selector.applyPaletteToElement(element);
    } else {
        // If we got a promise, wait for it
        selector.then(selector => {
            const colorSet = selector.colorSets[element.getAttribute('data-color-index') % selector.current_num_colors];
            element.style.backgroundColor = colorSet.backgroundColor;
            element.style.color = colorSet.foregroundColor;
        });
    }
}

export function initializeColorPalettes() {
    // Ensure palettes are loaded and PaletteSelector is initialized
    getPaletteSelectorInstance().then(selector => {
        // Apply the current palette to all elements
        selector.applyPaletteToElements();
        selector.applyPaletteToDocument();
        selector.updatePaletteStyles();

        // Optionally, set up a listener for palette changes
        window.addEventListener('paletteChangeComplete', (event) => {
            selector.applyPaletteToElements();
            selector.applyPaletteToDocument();
            selector.updatePaletteStyles();
        });

        console.log('Color palettes initialized and applied.');
    }).catch(error => {
        console.error('Failed to initialize color palettes:', error);
    });
}