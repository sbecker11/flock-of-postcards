import { setupHoverSync } from './cardHover.mjs';

// Initialize hover sync when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupHoverSync();
});

// Export the setup function in case it needs to be called manually
export { setupHoverSync }; 