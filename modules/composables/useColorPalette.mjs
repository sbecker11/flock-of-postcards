import { ref, onMounted, watch, computed } from 'vue';
import { AppState, saveState, initializeState } from '@/modules/core/stateManager.mjs';
import * as colorUtils from '@/modules/utils/colorUtils.mjs';

const PALETTE_DIR = './static_content/colorPalettes/';
const MANIFEST_ENDPOINT = '/api/palette-manifest';

// --- Reactive State ---
// This state is shared across all components that use this composable
const palettes = ref({});
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

            const tempLoadedPalettes = {};
            const tempFilenameToNameMap = {};
            const tempOrderedNames = [];

            for (const filename of manifestData) {
                const filePath = PALETTE_DIR + filename;
                const paletteResponse = await fetch(filePath);
                const paletteData = await paletteResponse.json();

                if (paletteData && paletteData.name && Array.isArray(paletteData.colors)) {
                    tempLoadedPalettes[paletteData.name] = paletteData.colors;
                    tempFilenameToNameMap[filename] = paletteData.name;
                    tempOrderedNames.push(paletteData.name);
                }
            }
            
            palettes.value = tempLoadedPalettes;
            filenameToNameMap.value = tempFilenameToNameMap;
            orderedPaletteNames.value = tempOrderedNames;
            // Assign palettes to AppState.color.palettes after loading
            if (!AppState.color) AppState.color = {};
            AppState.color.palettes = tempLoadedPalettes;
            
            if (!currentPaletteFilename.value && Object.keys(tempFilenameToNameMap).length > 0) {
                currentPaletteFilename.value = Object.keys(tempFilenameToNameMap)[0];
            }

        } catch (error) {
            console.error("Failed to load color palettes:", error);
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
        return name ? palettes.value[name] : [];
    });
    
    // Return all the reactive state and methods
    return {
        palettes,
        orderedPaletteNames,
        filenameToNameMap,
        isLoading,
        currentPaletteFilename,
        currentPaletteName,
        currentPalette,
        setCurrentPalette,
        loadPalettes,
    };
}

/**
 * Applies the current color palette to a specific HTML element.
 * @param {HTMLElement} element The element to apply the palette to.
 */
export async function applyPaletteToElement(element) {
    if (!element) return;

    // Use a data-attribute for the color index, assuming it's set on the element
    const colorIndexAttr = element.getAttribute('data-color-index');

    // If the attribute is not set or is not a valid number,
    // this element has not been configured for color theming
    if (colorIndexAttr === null || isNaN(parseInt(colorIndexAttr,   10))) 
        return;
    const colorIndex = parseInt(colorIndexAttr, 10);

    // Get the palette name from the filename
    const paletteName = filenameToNameMap.value[currentPaletteFilename.value];
    if (!paletteName) {
        throw new Error(`Palette name not found for filename: ${currentPaletteFilename.value}`);
    }

    // If the palette is not found or is empty, throw an Error
    const palette = AppState.color.palettes[paletteName];
    if (!palette) throw new Error(`Palette not found for name: ${paletteName}`);

    const bg = palette[colorIndex % palette.length];
    const fg = colorUtils.getContrastingColor(bg);

    element.style.backgroundColor = bg;
    element.style.color = fg;
}

// --- Global Watcher ---
// This watcher runs once and handles applying the color theme to the document
watch(currentPaletteFilename, (newFilename) => {
    if (!newFilename) return;
    
    const paletteName = filenameToNameMap.value[newFilename];
    const palette = palettes.value[paletteName];

    if (!palette || palette.length === 0) return;

    // Apply document-level styles
    const root = document.documentElement;
    let darkestColor = palette.reduce((darkest, current) => {
        return colorUtils.getPerceivedBrightness(current) < colorUtils.getPerceivedBrightness(darkest) ? current : darkest;
    }, palette[0]);

    const darkHex = darkestColor || "#333333";
    let rgb = colorUtils.get_RGB_from_Hex(darkHex);
    let hsv = colorUtils.get_HSV_from_RGB(rgb);

    let darkerHsv = {...hsv};
    darkerHsv.v *= 0.75;
    const darkerRgb = colorUtils.get_RGB_from_HSV(darkerHsv);

    let darkestHsv = {...hsv};
    darkestHsv.v *= 0.35;
    const darkestRgb = colorUtils.get_RGB_from_HSV(darkestHsv);

    const darkerRgba = `rgba(${darkerRgb.r}, ${darkerRgb.g}, ${darkerRgb.b}, 1.0)`;
    const darkestRgba = `rgba(${darkestRgb.r}, ${darkestRgb.g}, ${darkestRgb.b}, 1.0)`;

    root.style.setProperty('--background-light', darkerRgba);
    root.style.setProperty('--background-dark', darkestRgba);

    // Update elements with data-color-index
    const elements = document.querySelectorAll('[data-color-index]');
    elements.forEach(element => {
        const colorIndexAttr = element.getAttribute("data-color-index");
        if (colorIndexAttr === null || isNaN(parseInt(colorIndexAttr, 10))) return;
        
        const colorIndex = parseInt(colorIndexAttr, 10);
        const color = palette[colorIndex % palette.length];

        if (color) {
            const foregroundColor = colorUtils.getContrastingColor(color);
            element.style.backgroundColor = color;
            element.style.color = foregroundColor;
        }
    });

}, { immediate: true }); // Run this watcher as soon as the composable is used