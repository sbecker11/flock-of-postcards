// modules/colors/colorPalettes.mjs

import * as colorUtils from './colorUtils.mjs';
import * as utils from '../utils/utils.mjs';
import * as domUtils from '../utils/domUtils.mjs';

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

function getOrCreatePaletteSelectorSingletonInstance() {
   if (_selectorInstance) {
       return Promise.resolve(_selectorInstance); // Return cached instance if available
   }
   if (!_palettesLoadedPromise) {
       _palettesLoadedPromise = initialPaletteLoad()
         .then(() => {
             // Create instance only after load attempt (even if failed, uses fallbacks)
             const selector = new PaletteSelector();
             _selectorInstance = selector; // Cache the instance
             return selector;
         });
   }
   return _palettesLoadedPromise;
}

class PaletteSelector {
    #instance = null; // Keep singleton pattern if desired

    constructor() {
        if (this.#instance) {
            console.error("PaletteSelector instance already exists."); // Should ideally not happen with initializePaletteSelectorInstance
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

        // this.current_value is the name of the current selected color palette   
        if (!this.current_value) {
            throw new Error("Cannot initialize: No palettes available after loading.");
        }
        this.current_color_palette = this.color_palettes[this.current_value];
        this.current_palette_num_colors = this.current_color_palette.length;

        // initialize this.currentColorSets with colors from the 
        // this.current_color_palette with length this.current_palette_num_colors
        this.initializeColorSet();

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

        // Apply the initial palette to document and its elements
        this.applyCurrentPaletteToDocument();

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
        for (let colorIndex = 0; colorIndex < this.current_palette_num_colors; colorIndex++) {
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

        // all elements affected only by updatePaletteStyles
        const number_of_elements_without_data_color_index = Array.from(document.querySelectorAll(':not([data-color-index])')).length;
        console.log("number_of_elements_without_data_color_index:", number_of_elements_without_data_color_index);   

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
    async applyCurrentColorPaletteToElement(element) {
        if (!element || !(element instanceof HTMLElement)) {
            console.warn("skipping element that is null or is not an instance of HTMLElement");
            return;
        }

        const colorIndex = this.getColorIndex(element);
        if (colorIndex === null) {
            console.warn(`Invalid color index for element:`, element);
            return;
        }

        // Get the colorSet for this index
        const color_set_index = colorIndex % this.currentColorSetsLength;
        const colorSet = this.currentColorSets[color_set_index];
        if (!colorSet) {
            console.warn("colorPalettes:applyCurrentColorPaletteToElement: no colorSet for color_set_index:", color_set_index, "in currentColorSets");
            return;
        }   
        const normalBg = colorSet.normalBg;
        if (!normalBg) {
            console.warn("colorPalettes:applyCurrentColorPaletteToElement: no normalBg for colorSet:", colorSet);
            return;
        }
        
        const normalFg = this.getContrastingColor(normalBg);
        if (!normalFg) {
            console.warn("colorPalettes:applyCurrentColorPaletteToElement: no normalFg for colorSet:", colorSet);
            return;
        }
        const foreground_only = element.classList.contains('color-index-foreground-only');

        // Apply colors directly as inline styles with !important
        if (!foreground_only) {
            element.style.setProperty('background-color', normalBg, 'important');
        }
        element.style.setProperty('color', normalFg, 'important');

        // Remove any existing palette classes
        element.className = element.className
            .split(' ')
            .filter(cls => !cls.startsWith(CSS_CLASS.PALETTE_PREFIX))
            .join(' ');

        // Add new palette class
        const baseClass = generateClassName(this.current_value, colorIndex);
        element.classList.add(baseClass);

        // Force a repaint on this element
        void element.offsetHeight;
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
        const colorIndex = element.getAttribute("data-color-index");
        if ( !isColorIndexString(colorIndex) ) {
            console.warn('Invalid data-color-index:',colorIndex);
            return null;
        }
        return colorIndex;
    }

    /**
     * Updates all elements when palette changes
     */
    async selectPalette(selected_value) {
        if (!_color_palettes[selected_value]) {
            console.error(`Invalid palette: ${selected_value}`);
            return;
        }

        console.log(`Selecting palette: ${selected_value}`);
        
        // Store the selection in localStorage
        localStorage.setItem(LOCAL_STORAGE_PALETTE_KEY, selected_value);

        // Update palette properties
        this.current_value = selected_value;
        this.current_color_palette = _color_palettes[selected_value];
        this.current_palette_num_colors = this.current_color_palette.length;

        // Reinitialize color sets with the new palette
        this.initializeColorSet();
        
        // Update document background colors
        this.updateDocumentBackgroundColors();
        
        // Force repaint on background elements
        this.forceRepaintOnBackgroundElements();
        
        // Update all elements with data-color-index attribute
        this.updateAllColorIndexedElements();
        
        // Update palette styles
        this.updatePaletteStyles();
        
        // Dispatch an event to notify other components
        document.dispatchEvent(new CustomEvent('paletteChanged', {
            detail: { palette: selected_value }
        }));
        
        console.log(`Palette selection complete: ${selected_value}`);
        return true;
    }

    // Method to update document background colors
    updateDocumentBackgroundColors() {
        const root = document.documentElement;
        
        try {
            // Calculate background colors from the darkest color in the palette
            this.initializeDarkestBgHexColor();
            const darkHex = this.darkest_bgHexColor || "#333333";
            
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

            const darkerRGBA = `rgba(${darkerRGB[0]}, ${darkerRGB[1]}, ${darkerRGB[2]}, 1.0)`;
            const darkestRGBA = `rgba(${darkestRGB[0]}, ${darkestRGB[1]}, ${darkestRGB[2]}, 1.0)`;

            // Set CSS variables
            root.style.setProperty('--background-light', darkerRGBA);
            root.style.setProperty('--background-dark', darkestRGBA);
            
            console.log('colorPalettes:updateDocumentBackgroundColors: --background-light:', darkerRGBA);
            console.log('colorPalettes:updateDocumentBackgroundColors: --background-dark:', darkestRGBA);
        } catch (error) {
            console.error("Error updating document background colors:", error);
            // Apply fallback defaults
            root.style.setProperty('--background-light', 'rgba(40, 40, 40, 1.0)');
            root.style.setProperty('--background-dark', 'rgba(20, 20, 20, 1.0)');
        }
    }

    // Method to update all elements with data-color-index
    updateAllColorIndexedElements() {
        console.log(`Updating all elements with data-color-index...`);
        
        // Get ALL elements with data-color-index
        const elements = document.querySelectorAll('[data-color-index]');
        console.log(`Found ${elements.length} elements with data-color-index to update`);
        
        // Apply colors to all elements immediately
        for (const element of elements) {
            try {
                this.applyCurrentColorPaletteToElement(element);
            } catch (error) {
                console.error("Error applying currentColorSet to element:", element, error);
            }
        }
        
        console.log(`Finished updating all ${elements.length} elements with data-color-index`);
    }

    // Method to force repaint on background elements
    forceRepaintOnBackgroundElements() {
        // List of elements that use the CSS variables
        const elementsToRepaint = [
            document.getElementById('scene-container'),
            document.getElementById('scene-plane'),
            document.getElementById('scene-plane-top-gradient'),
            document.getElementById('scene-plane-btm-gradient'),
            document.body,
            document.documentElement
        ];
        
        // Optimize repainting of elements
        function optimizedRepaint(elementsToRepaint) {
            if (!elementsToRepaint || elementsToRepaint.length === 0) return;
            
            // Batch DOM reads
            const elementStates = elementsToRepaint.map(element => ({
                element,
                needsRepaint: !!element
            }));
            
            // Use requestAnimationFrame to batch DOM writes
            requestAnimationFrame(() => {
                // Method 3: Use a non-visual property change (least intrusive)
                elementStates.forEach(state => {
                    if (state.needsRepaint) {
                        state.element.dataset.repaintTimestamp = Date.now().toString();
                    }
                });
                
                console.log(`Repainted ${elementStates.filter(s => s.needsRepaint).length} elements`);
            });
        }

        // Replace the original repainting code with this optimized version
        optimizedRepaint(elementsToRepaint);
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
        if (!backgroundColor) throw new Error("getContrastingColor: backgroundColor is null");
        return colorUtils.getContrastingColor(backgroundColor);
    }

    // initialize this.currentColorSets with all colors from the current palette
    // with length this.current_palette_num_colors
    initializeColorSet() {
        // Replace arrays with a single array of ColorSet objects
        this.currentColorSets = new Array(this.current_palette_num_colors);
        this.currentColorSetsLength = this.currentColorSets.length;

        let hasInvalidColors = false;
        for (let index = 0; index < this.current_palette_num_colors; index++) {
            try {
                const bg_hex_color_string = this.current_color_palette[index];
                const normalBg = bg_hex_color_string;

                // Calculate normalFg color from normalBg
                const normalFg = this.getContrastingColor(normalBg);

                // Calculate selectedBg and selectedFg colors
                const bgRGB = colorUtils.get_RGB_from_Hex(normalBg);
                const bgHSV = colorUtils.get_HSV_from_RGB(bgRGB);
                bgHSV[2] = Math.min(bgHSV[2] * 1.5, 1.0); // Brighten by 50%, cap at 100%
                const selectedBg = colorUtils.get_Hex_from_HSV(bgHSV);

                // Calculate selectedFg color from selectedBg
                const selectedFg = this.getContrastingColor(selectedBg);

                // Store all four colors in a ColorSet
                this.currentColorSets[index] = new ColorSet(normalBg, normalFg, selectedBg, selectedFg);

            } catch (error) {
                console.warn(`Error calculating colors for index ${index}:`, error);
                this.currentColorSets[index] = new ColorSet(
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
    }

    // once this.currentColorSets array has been populated find the darkest
    // backgroundColor of this.currentColorSets and store it in this.darkest_bgHexColor
    initializeDarkestBgHexColor() {
        if (!this.currentColorSets || this.currentColorSets.length === 0) {
            this.darkest_bgHexColor = FALLBACK_GREY_HEX;
            return;
        }
        let darkest_value = Infinity;
        this.darkest_bgHexColor = this.currentColorSets[0].normalBg;

        for (const colorSet of this.currentColorSets) {
            try {
                const RGB = colorUtils.get_RGB_from_Hex(colorSet.normalBg);
                const value = colorUtils.get_RGB_distance(RGB, [0, 0, 0]);
                if (value < darkest_value) {
                    this.darkest_bgHexColor = colorSet.normalBg;
                    darkest_value = value;
                }
            } catch (error) {
                console.warn(`Error processing color ${colorSet.normalBg} for darkest calculation:`, error);
            }
        }
    }

    // apply this.currentColorSets to all elements with 
    // "data-color-index" attribute
    applyCurrentPaletteToElements(elements=null, selectedElements = new Set()) {
        if (elements === null) {
            // all elements with 'data-color-index' attribute
            elements = document.querySelectorAll("[data-color-index]");
        }
        console.log("colorPalettes:applyCurrentPaletteToElements: elements:", elements.length);

        // Apply colors to all elements immediately
        for (const element of elements) {
            try {
                this.applyCurrentColorPaletteToElement(element);
            } catch (error) {
                console.error("Error applying currentColorSet to element:", element, error);
            }
        } 
    }

    // use the darkest background color in this.currentColorSets array
    // to calculate and set the --background-light and --background-dark
    // colors for the document.
    //
    // then apply the current palette to all elements with the
    // "data-color-index" attribute
    async applyCurrentPaletteToDocument() {
        const root = document.documentElement;
        const fallbackLightRGBA = FALLBACK_LIGHT_RGBA;
        const fallbackDarkRGBA = FALLBACK_DARK_RGBA;

        // used for document background colors
        this.initializeDarkestBgHexColor();
        const darkHex = this.darkest_bgHexColor;

        if (!darkHex) {
            console.warn("colorPalettes:applyCurrentPaletteToDocument: darkHex is null");
            return; // Don't proceed if darkest couldn't be found
        }

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

            const darkerRGBA = colorUtils.get_RGBA_from_RGB(darkerRGB, 1.0) || fallbackLightRGBA;
            const darkestRGBA = colorUtils.get_RGBA_from_RGB(darkestRGB, 1.0) || fallbackDarkRGBA;

            root.style.setProperty('--background-light', darkerRGBA);
            root.style.setProperty('--background-dark', darkestRGBA);
            console.log('colorPalettes:applyCurrentPaletteToDocument: --background-light:', darkerRGBA);
            console.log('colorPalettes:applyCurrentPaletteToDocument: --background-dark:', darkestRGBA);

            // Force repaint on elements using these CSS variables
            this.forceRepaintOnBackgroundElements();

        } catch (error) {
            console.error("Error applying palette to document background:", error);
            // Apply fallBack defaults directly
            root.style.setProperty('--background-light', FALLBACK_LIGHT_RGBA);
            root.style.setProperty('--background-dark', FALLBACK_DARK_RGBA);
            
            // Still try to force repaint
            this.forceRepaintOnBackgroundElements();
        }

        this.applyCurrentPaletteToElements();
    }

    // Add this new method to force repaint on elements using CSS variables
    forceRepaintOnBackgroundElements() {
        // List of elements that use the CSS variables
        const elementsToRepaint = [
            document.getElementById('scene-container'),
            document.getElementById('scene-plane'),
            document.getElementById('scene-plane-top-gradient'),
            document.getElementById('scene-plane-btm-gradient'),
            document.body,
            document.documentElement
        ];
        
        // Optimize repainting of elements
        function optimizedRepaint(elementsToRepaint) {
            if (!elementsToRepaint || elementsToRepaint.length === 0) return;
            
            // Batch DOM reads
            const elementStates = elementsToRepaint.map(element => ({
                element,
                needsRepaint: !!element
            }));
            
            // Use requestAnimationFrame to batch DOM writes
            requestAnimationFrame(() => {
                // Method 3: Use a non-visual property change (least intrusive)
                elementStates.forEach(state => {
                    if (state.needsRepaint) {
                        state.element.dataset.repaintTimestamp = Date.now().toString();
                    }
                });
                
                console.log(`Repainted ${elementStates.filter(s => s.needsRepaint).length} elements`);
            });
        }

        // Replace the original repainting code with this optimized version
        optimizedRepaint(elementsToRepaint);
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


} // end of PaletteSelector class


// Force an immediate refresh when the module loads
export async function initializePaletteSelectorInstance() {
    return getOrCreatePaletteSelectorSingletonInstance();
}

/**
 * Assigns a color index to an element based on its jobIndex
 * @param {HTMLElement} element - The element to assign a color index to
 * @param {number} jobIndex - The index in the sequence (e.g. job index)
 * Then apply the color index to the HTML element and its children recursively
 */
export function assignColorIndex(element, jobIndex, totalJobs) {
    if (!_orderedPaletteNames.length) {
        console.error("No palettes loaded, cannot assign color index.");
        return { colorIndex: 0 };
    }

    const currentPaletteName = getCurrentPaletteName();
    const currentPalette = _color_palettes[currentPaletteName];
    if (!currentPalette || !currentPalette.length) {
        console.error(`Current palette '${currentPaletteName}' is invalid or empty.`);
        return { colorIndex: 0 };
    }

    const colorIndex = jobIndex % currentPalette.length;

    element.setAttribute('data-color-index', colorIndex);
    
    // Return both for other modules to use
    return { colorIndex };
}

// Function to safely get the current palette name
export function getCurrentPaletteName() {
    // Try to get from the selector first
    const selector = _selectorInstance;
    if (selector) {
        return selector.current_value;
    }
    // If selector is not available, use the first palette
    return _orderedPaletteNames.length > 0 ? _orderedPaletteNames[0] : null;
}

/**
 * Apply current color palette to an element
 * @param {HTMLElement} element - The element to apply colors to
 */
export function applyCurrentColorPaletteToElement(element) {
    try {
        const selector = _selectorInstance;
        if (selector) {
            selector.applyCurrentColorPaletteToElement(element);
        } else {
            console.warn("No palette selector instance available yet");
        }
    } catch (error) {
        console.error("Error applying color palette to element:", error);
    }
}

/**
 * Checks if a string is a valid color index
 * @param {string} colorIndex - The color index to check
 * @returns {boolean} True if the string is a valid color index
 */
export function isColorIndexString(colorIndex) {
    if (typeof colorIndex !== 'string') return false;
    
    // Check if it's a numeric string
    if (!/^\d+$/.test(colorIndex)) return false;
    
    // Convert to number and check if it's a valid integer
    const num = parseInt(colorIndex, 10);
    return Number.isInteger(num) && num >= 0;
}
