import { ref, onMounted, watch, computed } from 'vue';
import { AppState, saveState, initializeState } from '@/modules/core/stateManager.mjs';
import * as colorUtils from '@/modules/utils/colorUtils.mjs';

const PALETTE_DIR = './static_content/colorPalettes/';
const MANIFEST_ENDPOINT = '/api/palette-manifest';

// --- Reactive State ---
// This state is shared across all components that use this composable
const colorPalettes = ref({});
const orderedPaletteNames = ref([]);
const filenameToNameMap = ref({});
const isLoading = ref(true);
let resolveReady;
export const readyPromise = new Promise((resolve) => { resolveReady = resolve; });
// Initialize from the global state, but allow it to be updated locally
const currentPaletteFilename = ref(null);

// --- The Composable Function ---
export function useColorPalette() {

    async function loadPalettes() {
        if (!isLoading.value) return; // Don't reload if already loaded
        
        try {
            // First, ensure the application state is loaded.
            await initializeState();
            
            // Now it's safe to access AppState.
            currentPaletteFilename.value = AppState.colorPalette;

            const response = await fetch(MANIFEST_ENDPOINT);
            if (!response.ok) throw new Error('Failed to fetch palette manifest');
            const manifestData = await response.json();

            const tempLoadedColorPalettes = {};
            const tempFilenameToNameMap = {};
            const tempOrderedNames = [];

            for (const filename of manifestData) {
                const filePath = PALETTE_DIR + filename;
                const paletteResponse = await fetch(filePath);
                const paletteData = await paletteResponse.json();

                if (paletteData && paletteData.name && Array.isArray(paletteData.colors)) {
                    tempLoadedColorPalettes[paletteData.name] = paletteData.colors;
                    tempFilenameToNameMap[filename] = paletteData.name;
                    tempOrderedNames.push(paletteData.name);
                }
            }
            
            colorPalettes.value = tempLoadedColorPalettes;
            filenameToNameMap.value = tempFilenameToNameMap;
            orderedPaletteNames.value = tempOrderedNames;
            // Assign colorPalettes to AppState.color.palettes after loading
            if (!AppState.color) AppState.color = {};
            AppState.color.palettes = tempLoadedColorPalettes;
            
            if (!currentPaletteFilename.value && Object.keys(tempFilenameToNameMap).length > 0) {
                currentPaletteFilename.value = Object.keys(tempFilenameToNameMap)[0];
            }

        } catch (error) {
            window.CONSOLE_LOG_IGNORE("Failed to load color palettes:", error);
            // Handle error case, maybe set a default palette
        } finally {
            isLoading.value = false;
            if (resolveReady) resolveReady();
        }
    }

    // Load palettes only once when the app starts
    onMounted(loadPalettes);

    function setCurrentPalette(filename) {
        if (filename && filenameToNameMap.value[filename]) {
            currentPaletteFilename.value = filename;
            AppState.colorPalette = filename;
            saveState(AppState);
        }
    }

    const currentPaletteName = computed(() => {
        return filenameToNameMap.value[currentPaletteFilename.value] || null;
    });

    const currentPalette = computed(() => {
        const name = currentPaletteName.value;
        return name ? colorPalettes.value[name] : [];
    });
    
    // Function to update brightness factors
    function updateBrightnessFactors(selectedFactor, hoveredFactor) {
        if (selectedFactor !== undefined) {
            AppState.theme.brightnessFactorSelected = selectedFactor;
        }
        if (hoveredFactor !== undefined) {
            AppState.theme.brightnessFactorHovered = hoveredFactor;
        }
        saveState(AppState);
        
        // Reapply palette to all elements to update their data attributes
        const elements = document.querySelectorAll('[data-color-index]');
        elements.forEach(async element => {
            await applyPaletteToElement(element);
        });
    }

    // Function to update border settings
    function updateBorderSettings(newBorderSettings) {
        if (newBorderSettings) {
            AppState.theme.borderSettings = newBorderSettings;
            saveState(AppState);
        }
        
        // Reapply palette to all elements to update their data attributes
        const elements = document.querySelectorAll('[data-color-index]');
        elements.forEach(async element => {
            await applyPaletteToElement(element);
        });
    }

    // Return all the reactive state and methods
    return {
        colorPalettes,
        orderedPaletteNames,
        filenameToNameMap,
        isLoading,
        currentPaletteFilename,
        currentPaletteName,
        currentPalette,
        setCurrentPalette,
        loadPalettes,
        updateBrightnessFactors,
        updateBorderSettings,
    };
}

/**
 * Applies the current color palette to a specific HTML element.
 * Calculates and sets data attributes for all color states (normal, selected, hovered).
 * @param {HTMLElement} element The element to apply the palette colors to.
 */
export async function applyPaletteToElement(element) {
    if (!element) return;

    // Use a data-attribute for the palette color index, assuming it's set on the element
    const paletteColorIndexAttr = element.getAttribute('data-color-index');

    // If the attribute is not set or is not a valid number,
    // this element has not been configured for color theming
    if (paletteColorIndexAttr === null || isNaN(parseInt(paletteColorIndexAttr, 10))) 
        return;
    const paletteColorIndex = parseInt(paletteColorIndexAttr, 10);

    // Get the palette name from the filename
    const paletteName = filenameToNameMap.value[currentPaletteFilename.value];
    if (!paletteName) {
        throw new Error(`Palette name not found for filename: ${currentPaletteFilename.value}`);
    }

    // If the palette is not found or is empty, throw an Error
    const colorPalette = AppState.color.palettes[paletteName];
    if (!colorPalette) throw new Error(`Color palette not found for name: ${paletteName}`);

    // Calculate base colors
    const backgroundColor = colorPalette[paletteColorIndex % colorPalette.length];
    const foregroundColor = colorUtils.getContrastingColor(backgroundColor);

    // Get brightness factors from global state
    const brightnessFactorSelected = AppState.theme.brightnessFactorSelected || 2.0;
    const brightnessFactorHovered = AppState.theme.brightnessFactorHovered || 1.75;

    // Calculate selected state colors (with brightness filter applied)
    const selectedBackgroundColor = colorUtils.adjustBrightness(backgroundColor, brightnessFactorSelected);
    const selectedForegroundColor = colorUtils.getContrastingColor(selectedBackgroundColor);

    // Calculate hovered state colors (with brightness filter applied)
    const hoveredBackgroundColor = colorUtils.adjustBrightness(backgroundColor, brightnessFactorHovered);
    const hoveredForegroundColor = colorUtils.getContrastingColor(hoveredBackgroundColor);

    const borderRadius = AppState.theme?.borderRadius || '25px';

    // Get global border and padding settings from AppState (with defaults)
    const borderSettings = AppState.theme?.borderSettings || {
        normal: {
            padding: '7px', // Match maximum padding for consistent visual spacing
            innerBorderWidth: '0px',
            innerBorderColor: 'transparent',
            outerBorderWidth: '1px',
            outerBorderColor: 'white',
            marginTop: '0px', // Top margin for vertical separation
            borderRadius: '25px'
        },
        hovered: {
            padding: '5px', // 5px padding + 2px inner border = 7px total (consistent with normal)
            innerBorderWidth: '2px',
            innerBorderColor: 'blue',
            outerBorderWidth: '0px',
            outerBorderColor: 'blue',
            marginTop: '0px', // Top margin for vertical separation
            borderRadius: '25px'
        },
        selected: {
            padding: '5px', // 5px padding + 2px for border = 7px total  
            innerBorderWidth: '2px',
            innerBorderColor: 'purple',
            outerBorderWidth: '7',
            outerBorderColor: 'purple',
            marginTop: '0px', // Top margin for vertical separation
            borderRadius: '25px'
        }
    };

    // apply resume div border override settings if the element is a resume div
    if ( element.classList.contains('biz-resume-div') ) {
        const rDivBorderOverrideSettings = AppState.theme?.rDivBorderOverrideSettings;
        if (rDivBorderOverrideSettings) {
            borderSettings.normal.padding = rDivBorderOverrideSettings.normal.padding;
            borderSettings.normal.innerBorderWidth = rDivBorderOverrideSettings.normal.innerBorderWidth;
            borderSettings.normal.marginTop = rDivBorderOverrideSettings.normal.marginTop;
            borderSettings.hovered.padding = rDivBorderOverrideSettings.hovered.padding;
            borderSettings.hovered.innerBorderWidth = rDivBorderOverrideSettings.hovered.innerBorderWidth;
            borderSettings.hovered.marginTop = rDivBorderOverrideSettings.hovered.marginTop;
            borderSettings.selected.padding = rDivBorderOverrideSettings.selected.padding;
            borderSettings.selected.innerBorderWidth = rDivBorderOverrideSettings.selected.innerBorderWidth;
            borderSettings.selected.marginTop = rDivBorderOverrideSettings.selected.marginTop;
        }
    }

    // Set data attributes for all color states
    element.setAttribute('data-background-color', backgroundColor);
    element.setAttribute('data-foreground-color', foregroundColor);
    element.setAttribute('data-background-color-selected', selectedBackgroundColor);
    element.setAttribute('data-foreground-color-selected', selectedForegroundColor);
    element.setAttribute('data-background-color-hovered', hoveredBackgroundColor);
    element.setAttribute('data-foreground-color-hovered', hoveredForegroundColor);
    element.setAttribute('data-background-border-radius', borderRadius);

    // Set border and padding attributes for all states
    element.setAttribute('data-normal-padding', borderSettings.normal.padding);
    element.setAttribute('data-normal-inner-border-width', borderSettings.normal.innerBorderWidth);
    element.setAttribute('data-normal-inner-border-color', borderSettings.normal.innerBorderColor);
    element.setAttribute('data-normal-outer-border-width', borderSettings.normal.outerBorderWidth);
    element.setAttribute('data-normal-outer-border-color', borderSettings.normal.outerBorderColor);
    element.setAttribute('data-normal-border-radius', borderSettings.normal.borderRadius);

    element.setAttribute('data-hovered-padding', borderSettings.hovered.padding);
    element.setAttribute('data-hovered-inner-border-width', borderSettings.hovered.innerBorderWidth);
    element.setAttribute('data-hovered-inner-border-color', borderSettings.hovered.innerBorderColor);
    element.setAttribute('data-hovered-outer-border-width', borderSettings.hovered.outerBorderWidth);
    element.setAttribute('data-hovered-outer-border-color', borderSettings.hovered.outerBorderColor);
    element.setAttribute('data-hovered-border-radius', borderSettings.hovered.borderRadius);

    element.setAttribute('data-selected-padding', borderSettings.selected.padding);
    element.setAttribute('data-selected-inner-border-width', borderSettings.selected.innerBorderWidth);
    element.setAttribute('data-selected-inner-border-color', borderSettings.selected.innerBorderColor);
    element.setAttribute('data-selected-outer-border-width', borderSettings.selected.outerBorderWidth);
    element.setAttribute('data-selected-outer-border-color', borderSettings.selected.outerBorderColor);

    // Set CSS custom properties for use in CSS
    element.style.setProperty('--data-background-color', backgroundColor);
    element.style.setProperty('--data-foreground-color', foregroundColor);
    element.style.setProperty('--data-background-color-selected', selectedBackgroundColor);
    element.style.setProperty('--data-foreground-color-selected', selectedForegroundColor);
    element.style.setProperty('--data-background-color-hovered', hoveredBackgroundColor);
    element.style.setProperty('--data-foreground-color-hovered', hoveredForegroundColor);
    element.style.setProperty('--data-background-border-radius', borderRadius);

    // Set CSS custom properties for border and padding
    element.style.setProperty('--data-normal-padding', borderSettings.normal.padding);
    element.style.setProperty('--data-normal-inner-border-width', borderSettings.normal.innerBorderWidth);
    element.style.setProperty('--data-normal-inner-border-color', borderSettings.normal.innerBorderColor);
    element.style.setProperty('--data-normal-outer-border-width', borderSettings.normal.outerBorderWidth);
    element.style.setProperty('--data-normal-outer-border-color', borderSettings.normal.outerBorderColor);
    element.style.setProperty('--data-normal-margin-top', borderSettings.normal.marginTop);
    element.style.setProperty('--data-normal-border-radius', borderSettings.normal.borderRadius);

    element.style.setProperty('--data-hovered-padding', borderSettings.hovered.padding);
    element.style.setProperty('--data-hovered-inner-border-width', borderSettings.hovered.innerBorderWidth);
    element.style.setProperty('--data-hovered-inner-border-color', borderSettings.hovered.innerBorderColor);
    element.style.setProperty('--data-hovered-outer-border-width', borderSettings.hovered.outerBorderWidth);
    element.style.setProperty('--data-hovered-outer-border-color', borderSettings.hovered.outerBorderColor);
    element.style.setProperty('--data-hovered-margin-top', borderSettings.hovered.marginTop);
    element.style.setProperty('--data-hovered-border-radius', borderSettings.hovered.borderRadius);

    element.style.setProperty('--data-selected-padding', borderSettings.selected.padding);
    element.style.setProperty('--data-selected-inner-border-width', borderSettings.selected.innerBorderWidth);
    element.style.setProperty('--data-selected-inner-border-color', borderSettings.selected.innerBorderColor);
    element.style.setProperty('--data-selected-outer-border-width', borderSettings.selected.outerBorderWidth);
    element.style.setProperty('--data-selected-outer-border-color', borderSettings.selected.outerBorderColor);
    element.style.setProperty('--data-selected-margin-top', borderSettings.selected.marginTop);
    element.style.setProperty('--data-selected-border-radius', borderSettings.selected.borderRadius);

    // Don't apply inline styles - let CSS variables handle the styling
    // The normal state will be applied when needed by the state system
}

/**
 * Applies the specified state styling to an element using the border/padding attributes.
 * @param {HTMLElement} element The element to style
 * @param {string} state The state to apply: 'normal', 'hovered', or 'selected'
 */
export function applyStateStyling(element, state) {
    if (!element) return;
    
    // Get the state-specific attributes
    const padding = element.getAttribute(`data-${state}-padding`);
    const innerBorderWidth = element.getAttribute(`data-${state}-inner-border-width`);
    const innerBorderColor = element.getAttribute(`data-${state}-inner-border-color`);
    const outerBorderWidth = element.getAttribute(`data-${state}-outer-border-width`);
    const outerBorderColor = element.getAttribute(`data-${state}-outer-border-color`);
    const marginTop = element.style.getPropertyValue(`--data-${state}-margin-top`);
    const borderRadius = element.getAttribute(`data-${state}-border-radius`);
    
    // Apply the styling with !important to override CSS rules
    if (padding) element.style.setProperty('padding', padding, 'important');
    if (innerBorderWidth && innerBorderColor) {
        element.style.setProperty('border', `${innerBorderWidth} solid ${innerBorderColor}`, 'important');
    } else if (innerBorderWidth === '0px' || innerBorderColor === 'transparent') {
        element.style.setProperty('border', '0px solid transparent', 'important');
    }
    if (outerBorderWidth && outerBorderColor) {
        element.style.setProperty('outline', `${outerBorderWidth} solid ${outerBorderColor}`, 'important');
    } else if (outerBorderWidth === '0px' || outerBorderColor === 'transparent') {
        element.style.setProperty('outline', '0px solid transparent', 'important');
    }
    
    // Apply margin-top for vertical separation (only for rDivs)
    if (marginTop && element.classList.contains('biz-resume-div')) {
        element.style.setProperty('margin-top', marginTop, 'important');
    }
    
    // Apply state-specific border radius from border settings
    if (borderRadius) {
        element.style.setProperty('border-radius', borderRadius, 'important');
    }
    
    // Apply background and foreground colors for different states
    if (state === 'normal') {
        const backgroundColor = element.getAttribute('data-background-color');
        const foregroundColor = element.getAttribute('data-foreground-color');
        if (backgroundColor) {
            element.style.setProperty('background-color', backgroundColor, 'important');
        }
        if (foregroundColor) {
            element.style.setProperty('color', foregroundColor, 'important');
        }
        // Restore the parallax depth filter for normal state
        const sceneZ = element.getAttribute('data-sceneZ');
        if (sceneZ) {
            // Apply the parallax depth effect based on z-value
            const zValue = parseInt(sceneZ);
            const brightness = Math.max(0.4, 1 - (zValue * 0.10));
            const blur = Math.max(0, zValue * 0.10);
            const contrast = Math.max(0.75, 1 - (zValue * 0.010));
            const saturate = Math.max(0.75, 1 - (zValue * 0.010));
            element.style.setProperty('filter', `brightness(${brightness}) blur(${blur}px) contrast(${contrast}) saturate(${saturate})`, 'important');
        }
    } else if (state === 'hovered') {
        const hoveredBackgroundColor = element.getAttribute('data-background-color-hovered');
        const hoveredForegroundColor = element.getAttribute('data-foreground-color-hovered');
        if (hoveredBackgroundColor) {
            element.style.setProperty('background-color', hoveredBackgroundColor, 'important');
        }
        if (hoveredForegroundColor) {
            element.style.setProperty('color', hoveredForegroundColor, 'important');
        }
        // Remove all filters for hovered state to show bright colors
        element.style.setProperty('filter', 'none', 'important');
    } else if (state === 'selected') {
        const selectedBackgroundColor = element.getAttribute('data-background-color-selected');
        const selectedForegroundColor = element.getAttribute('data-foreground-color-selected');
        if (selectedBackgroundColor) {
            element.style.setProperty('background-color', selectedBackgroundColor, 'important');
        }
        if (selectedForegroundColor) {
            element.style.setProperty('color', selectedForegroundColor, 'important');
        }
        // Remove all filters for selected state to show bright colors
        element.style.setProperty('filter', 'none', 'important');
    }
    
    // Only log styling for biz-card-div elements that are clones (have "-clone" in their ID)
    // COMMENTED OUT: Not needed for current rDiv spacing debug
    // if (element.classList.contains('biz-card-div') && element.id && element.id.includes('-clone')) {
    //     // Get computed styles to see what's actually being applied
    //     const computedStyle = window.getComputedStyle(element);
    //     console.log(`[DEBUG] applyStateStyling: Applied ${state} state to ${element.id || element.className}`, {
    //         padding,
    //         innerBorderWidth,
    //         innerBorderColor,
    //         outerBorderWidth,
    //         outerBorderColor,
    //         borderRadius: element.style.borderRadius,
    //         filter: element.style.filter,
    //         backgroundColor: element.style.backgroundColor,
    //         color: element.style.color
    //     });
    //     console.log(`[DEBUG] applyStateStyling: Computed styles for ${element.id}:`, {
    //         padding: computedStyle.padding,
    //         border: computedStyle.border,
    //         borderRadius: computedStyle.borderRadius,
    //         backgroundColor: computedStyle.backgroundColor,
    //         color: computedStyle.color,
    //         filter: computedStyle.filter
    //     });
    //     console.log(`[DEBUG] applyStateStyling: Inline styles for ${element.id}:`, {
    //         padding: element.style.padding,
    //         border: element.style.border,
    //         borderRadius: element.style.borderRadius,
    //         backgroundColor: element.style.backgroundColor,
    //         color: element.style.color,
    //         filter: element.style.filter
    //     });
    // }
}

// --- Global Watcher ---
// This watcher runs once and handles applying the color theme to the document
watch(currentPaletteFilename, (newFilename) => {
    if (!newFilename) return;
    
    const paletteName = filenameToNameMap.value[newFilename];
    const colorPalette = colorPalettes.value[paletteName];

    // Wait for both filename mapping and palette data to be loaded
    if (!paletteName || !colorPalette || colorPalette.length === 0) return;

    // Apply document-level styles
    const root = document.documentElement;
    let darkestColor = colorPalette.reduce((darkest, current) => {
        return colorUtils.getPerceivedBrightness(current) < colorUtils.getPerceivedBrightness(darkest) ? current : darkest;
    }, colorPalette[0]);

    const darkHex = darkestColor || "#333333";
    let rgb = colorUtils.get_RGB_from_Hex(darkHex);
    let hsv = colorUtils.get_HSV_from_RGB(rgb);

    let darkerHsv = {...hsv};
    darkerHsv.v *= 0.45; // Much darker for more dramatic contrast
    darkerHsv.s *= 0.3; // Much less saturated for less vibrant look
    const darkerRgb = colorUtils.get_RGB_from_HSV(darkerHsv);

    let darkestHsv = {...hsv};
    darkestHsv.v *= 0.15; // Much darker for more dramatic atmospheric perspective
    darkestHsv.s *= 0.2; // Much less saturated for less vibrant look
    const darkestRgb = colorUtils.get_RGB_from_HSV(darkestHsv);

    const darkerRgba = `rgba(${darkerRgb.r}, ${darkerRgb.g}, ${darkerRgb.b}, 1.0)`;
    const darkestRgba = `rgba(${darkestRgb.r}, ${darkestRgb.g}, ${darkestRgb.b}, 1.0)`;

    root.style.setProperty('--background-light', darkerRgba);
    root.style.setProperty('--background-dark', darkestRgba);

    // Update elements with data-color-index
    const elements = document.querySelectorAll('[data-color-index]');
    elements.forEach(async element => {
        const paletteColorIndexAttr = element.getAttribute("data-color-index");
        if (paletteColorIndexAttr === null || isNaN(parseInt(paletteColorIndexAttr, 10))) return;
        
        // Use the applyPaletteToElement function to set all data attributes
        await applyPaletteToElement(element);
    });

}, { immediate: true }); // Run this watcher as soon as the composable is used

// Additional watcher to trigger palette application when colorPalettes are loaded
watch(colorPalettes, () => {
    // Trigger palette application when palettes are loaded and we have a current filename
    if (currentPaletteFilename.value) {
        // Re-trigger the main watcher by setting the filename again
        const filename = currentPaletteFilename.value;
        currentPaletteFilename.value = null;
        currentPaletteFilename.value = filename;
    }
}, { deep: true });