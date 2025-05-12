import * as typeValidators from './utils/typeValidators.mjs';
import * as colorUtils from './utils/colorUtils.mjs';
import * as domUtils from './utils/domUtils.mjs';
import * as arrayUtils from './utils/arrayUtils.mjs';
import * as typeConversions from './utils/typeConversions.mjs';

// Directory where palette files are stored
const PALETTE_DIR = './static_content/color_palettes/';
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

// Object to hold loaded palettes
let _color_palettes = {};
let _palettesLoadedPromise = null; // Promise to track loading state
let _orderedPaletteNames = []; // Store the ordered names here
let _filenameToNameMap = {}; // Store mapping from filename to internal name

// *** Helper to get clean palette name from filename ***
function getCleanPaletteName(filename) {
    if (typeof filename !== 'string') return null;
    // Remove .json extension
    let name = filename.replace(/\.json$/, '');
    // Remove optional NN- prefix
    name = name.replace(/^\d+-/, '');
    return name.trim(); // Trim any extra spaces
}

async function loadOrRefreshPalettes(isRefresh = false) {
    const functionName = isRefresh ? "Refreshing" : "Loading";
    console.log(`${functionName} color palettes using dynamic manifest from:`, MANIFEST_ENDPOINT);

    let newPaletteFiles = []; // Sorted filenames from server
    let attempt = 1;
    try {
        // --- Attempt 1 --- 
        console.log(`Manifest fetch attempt ${attempt}...`);
        const manifestResponse = await fetch(MANIFEST_ENDPOINT);
        if (!manifestResponse.ok) { throw new Error(`Manifest fetch failed: ${manifestResponse.status}`); }
        const manifestData = await manifestResponse.json();
        if (!Array.isArray(manifestData)) { throw new Error("Invalid manifest format"); }
        newPaletteFiles = manifestData; // Server sorted this list
        console.log(`Manifest fetch attempt ${attempt} successful.`);

    } catch (error1) {
        console.warn(`Manifest fetch attempt ${attempt} failed:`, error1.message);
        attempt++;
        // Wait 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000)); 
        console.log(`Manifest fetch attempt ${attempt}...`);
        try {
            // --- Attempt 2 --- 
            const manifestResponse = await fetch(MANIFEST_ENDPOINT);
            if (!manifestResponse.ok) { throw new Error(`Manifest fetch failed: ${manifestResponse.status}`); }
            const manifestData = await manifestResponse.json();
            if (!Array.isArray(manifestData)) { throw new Error("Invalid manifest format"); }
            newPaletteFiles = manifestData; // Server sorted this list
            console.log(`Manifest fetch attempt ${attempt} successful.`);
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

    console.log(`Final manifest list received: ${newPaletteFiles.length} files.`);
    
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
            console.log("Palette file list (names and order) hasn't changed. No refresh needed.");
            return false; // Indicate no update occurred
        }
        console.log("Palette file list has changed, proceeding with refresh...");
    }
    // --- End Optimization Check ---

    // --- Fetch all listed palette files --- 
    const tempLoadedPalettes = {};
    const tempFilenameToNameMap = {};
    const fetchPromises = [];

    for (const filename of newPaletteFiles) {
        if (typeof filename !== 'string' || !filename.endsWith('.json')) {
            console.warn(`Skipping invalid entry in manifest: ${filename}`);
            continue;
        }

        const filePath = PALETTE_DIR + filename;
        const promise = fetch(filePath)
            // *** Step 1: Fetch as text first ***
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status} for ${filename}`);
                }
                return response.text(); // Get raw text content
            })
            .then(rawText => {
                let paletteData = null;
                try {
                    // *** Step 2 & 3: Find boundaries and extract ***
                    // Trim whitespace first
                    const trimmedText = rawText.trim();
                    let jsonText = trimmedText;

                    // Basic attempt to handle trailing non-JSON characters after the main object/array
                    if (trimmedText.startsWith('{') && trimmedText.endsWith('}')) {
                         // Assume it's an object, find the matching closing brace
                         // This simple lastIndexOf is NOT robust for nested structures if junk is *inside*
                         const lastBraceIndex = trimmedText.lastIndexOf('}');
                         if (lastBraceIndex > 0) {
                             jsonText = trimmedText.substring(0, lastBraceIndex + 1);
                         }
                    } else if (trimmedText.startsWith('[') && trimmedText.endsWith(']')) {
                         // Handle if root is an array (though our format expects object)
                         const lastBracketIndex = trimmedText.lastIndexOf(']');
                         if (lastBracketIndex > 0) {
                              jsonText = trimmedText.substring(0, lastBracketIndex + 1);
                         }
                    }
                    // If jsonText still differs significantly from trimmedText after basic cleanup, log it
                    if (jsonText.length < trimmedText.length - 2) { // Allow for 1-2 trailing chars
                         console.warn(`Potentially cleaned trailing characters from ${filename}. Original length: ${trimmedText.length}, Cleaned length: ${jsonText.length}`);
                    }


                    // *** Step 4: Parse the potentially cleaned text ***
                    paletteData = JSON.parse(jsonText);

                } catch (parseError) {
                    // Throw error if parsing fails even after potential cleanup
                    console.error(`Failed to parse JSON from ${filename} even after potential cleanup. Content:\n${rawText.substring(0, 200)}...`); // Log snippet
                    throw parseError; // Re-throw to be caught by the outer .catch
                }

                // *** Step 5: Validate and store (same as before) ***
                if (paletteData && paletteData.name && Array.isArray(paletteData.colors)) {
                    // Use the name *from the file* as the key
                    tempLoadedPalettes[paletteData.name] = paletteData.colors;
                    tempFilenameToNameMap[filename] = paletteData.name;
                    // console.log(`  - Processed palette: ${paletteData.name} from ${filename}`);
                } else {
                    console.warn(`Skipping invalid/incomplete palette data structure in file: ${filename}.`);
                }
            })
            .catch(error => {
                // Log error but continue fetching others
                console.error(`Failed to load or parse palette file: ${filePath}`, error);
            });
        fetchPromises.push(promise);
    }

    await Promise.all(fetchPromises); // Wait for all fetches

    // --- Update module state --- 
    _color_palettes = tempLoadedPalettes;
    _filenameToNameMap = tempFilenameToNameMap;

    // Build the final ordered list of *internal names* based on the *server's file order*
    _orderedPaletteNames = newPaletteFiles
        .map(filename => _filenameToNameMap[filename]) // Map filename to internal name
        .filter(name => name && _color_palettes.hasOwnProperty(name)); // Filter out failures/missing

    console.log(`${functionName} complete. Final palette order:`, _orderedPaletteNames);

    if (_orderedPaletteNames.length === 0) {
         console.error("CRITICAL: No valid color palettes were loaded. Check manifest and JSON files.");
         // Set fallBack state
         _color_palettes = { "Default": ["#CCCCCC", "#AAAAAA", "#888888"] };
         _orderedPaletteNames = ["Default"];
         _filenameToNameMap = {};
         if (!isRefresh) throw new Error("Initial palette load resulted in zero palettes.");
    }
    
    return true; // Indicate an update occurred (or initial load completed)
}

// Initial load wrapper (kept separate for clarity)
async function initialPaletteLoad() {
    try {
        await loadOrRefreshPalettes(false);
    } catch (error) {
        console.error("Initial palette loading failed.");
        // Error already logged, fallbacks set in loadOrRefreshPalettes
        // We still need to resolve the promise, perhaps with null or a default selector?
    }
}

// Function to ensure palettes are loaded and get the selector
export function getPaletteSelectorInstance() {
   if (!_palettesLoadedPromise) {
       _palettesLoadedPromise = initialPaletteLoad()
         .then(() => {
             // Create instance only after load attempt (even if failed, uses fallbacks)
             const selector = new PaletteSelector();
             return selector;
         });
         // No catch here, let errors propagate if initial load truly fails fatally
   }
   return _palettesLoadedPromise;
}

export class PaletteSelector {
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
    }

    async selectPalette(selected_value) {
        console.log("selectPalette selected_value:", selected_value);
        // Ensure the selected value exists in the loaded palettes
        if (selected_value === null || !this.color_palettes[selected_value]) {
            console.error(`Selected palette "${selected_value}" not found in loaded palettes. Available:`, Object.keys(this.color_palettes));
            // fallBack to first available palette if selection is invalid
            selected_value = this.getFirstPalette();
            if (!selected_value) {
                 console.error("CRITICAL: No palettes available to select.");
                 return; // Cannot proceed
            }
            console.warn(`Falling back to first palette: ${selected_value}`);
        }

        this.current_value = selected_value;
        // Save the selected palette to localStorage
        try {
            localStorage.setItem(LOCAL_STORAGE_PALETTE_KEY, selected_value);
            // Also save to focal point state
            const focalPoint = await import('./focal_point.mjs');
            focalPoint.saveState();
        } catch (error) {
            console.warn('Failed to save palette selection:', error);
        }

        // Update the <select> element UI to match the programmatically selected value
        for( let option of this.paletteSelector.options ) { // Use .options collection
            option.selected = (option.value === this.current_value);
        }

        this.current_color_palette = this.color_palettes[this.current_value];
        this.current_num_colors = this.current_color_palette.length;

        this.initializePaletteDivColors();
        this.applyPaletteToElements(); // Apply immediately to all elements
        this.applyPaletteToDocument();
    }

    getFirstPalette() {
        // Return the name of the first loaded palette from the ordered list
        return _orderedPaletteNames.length > 0 ? _orderedPaletteNames[0] : null;
    }

    extractDigitsString(data_color_index) {
       // Ensure input is a string before calling replace
       return String(data_color_index).replace(/\D/g, '');
    }

    initializePaletteDivColors() {
       // Correctly size arrays based on current palette length
       this.bg_hex_colors = new Array(this.current_num_colors);
       this.fg_hex_colors = new Array(this.current_num_colors);

       for (let index = 0; index < this.current_num_colors; index++) {
           const bg_hex_color_string = this.current_color_palette[index];
           if (typeof bg_hex_color_string !== 'string') {
              console.warn(`Invalid color at index ${index} in palette ${this.current_value}:`, bg_hex_color_string);
              this.bg_hex_colors[index] = FALLBACK_LIGHT_HEX;
              this.fg_hex_colors[index] = FALLBACK_DARK_HEX;
              continue;
           }
           // Ensure utils functions handle potential errors gracefully
           // const fg_hex_color_string = utils.getHighContrastCssHexColorStrSafe(bg_hex_color_string); // Assume a safe version exists
           const fg_hex_color_string = colorUtils.getHighContrastCssHexColorStr(bg_hex_color_string); // Revert if safe version doesn't exist
           this.bg_hex_colors[index] = bg_hex_color_string || FALLBACK_WHITE_HEX;
           this.fg_hex_colors[index] = fg_hex_color_string || FALLBACK_BLACK_HEX;
       }
       this.darker_bg_hex_color = this.findDarkestBgHexColor();
       // this.darkest_bg_hex_color = '#000000'; // This line seems redundant if calculated below
}

     _applysCurrentPaletteToElement(element) {
       const data_color_index = element.getAttribute("data-color-index");
       if (!typeValidators.isNonEmptyString(data_color_index)) {
          // Don't throw, just warn and skip? Or maybe apply a default?
          // console.warn("Element lacks 'data-color-index' attribute:", element);
          return; // Skip elements without the attribute
       }

       // If color arrays are missing, use fallback colors instead of trying to reinitialize
       if (!this.bg_hex_colors || !this.fg_hex_colors) {
           console.warn('Color arrays not initialized, using fallback colors');
           element.style.backgroundColor = FALLBACK_GREY_HEX;
           element.style.color = FALLBACK_BLACK_HEX;
           return;
       }

       const number_string = this.extractDigitsString(data_color_index);
       const data_color_int = parseInt(number_string, 10);

       // Handle potential NaN from parseInt or invalid index
       if (isNaN(data_color_int) || this.current_num_colors === 0) {
           console.warn(`Invalid data-color-index value "${data_color_index}" or no colors in palette for element:`, element);
           element.style.backgroundColor = FALLBACK_GREY_HEX; 
           element.style.color = FALLBACK_BLACK_HEX;
           return;
       }

       const color_index = data_color_int % this.current_num_colors;
       const bgHexColor = this.bg_hex_colors[color_index];
       const fgHexColor = this.fg_hex_colors[color_index];

       // Ensure colors are valid before applying
       if (bgHexColor) element.style.backgroundColor = bgHexColor;
       if (fgHexColor) element.style.color = fgHexColor;
   }

   applyPaletteToElements( elements=null ) {
       if ( elements === null ) {
           elements = document.querySelectorAll("[data-color-index]");
        //    console.log("DEBUG: Found elements with data-color-index:", elements.length);
        //        elements.forEach(el => {
        //            console.log("DEBUG: Element:", el.id, "data-color-index:", el.getAttribute("data-color-index"));
        //        });
       }
       // console.log(`DEBUG: Applying palette "${this.current_value}" to ${elements.length} elements`);
       for (const element of elements) {
           if ( element ) {
               try {
                  this._applysCurrentPaletteToElement(element);
                //   console.log("DEBUG: Applied colors to element:", element.id, 
                //       "bg:", element.style.backgroundColor,
                //       "fg:", element.style.color);
               } catch (error) {
                  console.error("Error applying palette to element:", element, error);
               }
           }
       }
   }

    findDarkestBgHexColor() {
       if (!this.current_color_palette || this.current_color_palette.length === 0) {
          return FALLBACK_GREY_HEX; // Default dark if no palette
       }

       let darkest_value = Infinity; // Start high
       let darkest_bgHexColor = this.current_color_palette[0];

       for (const bgHexColor of this.current_color_palette) {
           if (typeof bgHexColor !== 'string') continue; // Skip invalid entries

           try {
                const RGB = colorUtils.get_RGB_from_Hex(bgHexColor); // Assumes this handles errors
                const value = colorUtils.getEuclideanDistance(RGB, [0, 0, 0]); // Assumes this handles errors
                if (value < darkest_value) {
                    darkest_bgHexColor = bgHexColor;
                    darkest_value = value;
                }
           } catch (error) {
               console.warn(`Error processing color ${bgHexColor} for darkest calculation:`, error);
           }
       }
       return darkest_bgHexColor || FALLBACK_DARKEST_HEX; // Return default if loop failed somehow
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
                this.selectPalette(this.paletteSelector.value || this.getFirstPalette()); // Reselect current or first
                console.log("Palette dropdown refreshed.");
            } // else: Optimization check determined no changes needed
        } catch (error) {
             console.error("Error during palette refresh process:", error);
             // Notify user?
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

} // End PaletteSelector class
