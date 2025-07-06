import { CustomDropdown } from './customDropdown.mjs';

export class CustomDropdownManager {
    constructor() {
        this.dropdowns = new Map();
    }
    
    createDropdown(containerId, options, initialValue = null) {
        const container = document.getElementById(containerId);
        if (!container) {
            window.CONSOLE_LOG_IGNORE(`Container with id "${containerId}" not found`);
            return null;
        }
        
        const dropdown = new CustomDropdown(container, options, initialValue);
        this.dropdowns.set(containerId, dropdown);
        
        return dropdown;
    }
    
    getDropdown(containerId) {
        return this.dropdowns.get(containerId);
    }
    
    removeDropdown(containerId) {
        const dropdown = this.dropdowns.get(containerId);
        if (dropdown) {
            dropdown.container.innerHTML = '';
            this.dropdowns.delete(containerId);
        }
    }
    
    // Helper method to convert sorting rules to dropdown options
    static convertSortingRulesToOptions(sortingRules) {
        return Object.entries(sortingRules).map(([value, rule]) => ({
            value,
            text: rule.display
        }));
    }
    
    // Helper method to convert palette names to dropdown options
    static convertPaletteNamesToOptions(paletteNames) {
        return paletteNames.map(name => ({
            value: name,
            text: name
        }));
    }
} 