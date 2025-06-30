```javascript
export function applyPaletteToElement(element) {
    if (!element) return;

    if (!AppState.color || !AppState.color.palettes) {
        console.warn('applyPaletteToElement: AppState.color or AppState.color.palettes is undefined');
        return;
    }

    const palette = AppState.color.palettes[currentPaletteFilename.value];
    if (!palette) return;

    // ...existing code...
}
```