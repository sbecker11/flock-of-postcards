// Define a global no-op function to easily disable console logs without removing the calls
// @ts-ignore
window.CONSOLE_LOG_IGNORE = () => {};
// @ts-ignore
window.CONSOLE_INFO_IGNORE = () => {};

import './modules/timeline/timeline.css';

// @ts-nocheck
import { createApp } from 'vue';
import App from '@/modules/components/App.vue';

console.log('main.ts: About to create Vue app');

// All legacy module imports are now handled within the components that need them,
// or in the App.vue component's onMounted hook.

// --- Vue App Initialization ---
const app = createApp(App);
console.log('main.ts: Vue app created, about to mount');
app.mount('#app');
console.log('main.ts: Vue app mounted');
CONSOLE_LOG_IGNORE('Vue root app mounted.');
