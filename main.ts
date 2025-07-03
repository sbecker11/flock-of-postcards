// Define a global no-op function to easily disable console logs without removing the calls
// @ts-ignore
window.CONSOLE_LOG_IGNORE = () => {};
// @ts-ignore
window.CONSOLE_INFO_IGNORE = () => {};

// import './modules/timeline/timeline.css'; // Removed - now using Vue component

// @ts-nocheck
import { createApp } from 'vue';
import App from './App.vue';

window.CONSOLE_LOG_IGNORE('main.ts: About to create Vue app');

// All legacy module imports are now handled within the components that need them,
// or in the App.vue component's onMounted hook.

// --- Vue App Initialization ---
const app = createApp(App);
window.CONSOLE_LOG_IGNORE('main.ts: Vue app created, about to mount');
app.mount('#app');
window.CONSOLE_LOG_IGNORE('main.ts: Vue app mounted');
window.CONSOLE_LOG_IGNORE('Vue root app mounted.');
