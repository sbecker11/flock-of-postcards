// @ts-nocheck
import { createApp } from 'vue';
import App from '@/modules/components/App.vue';

// All legacy module imports are now handled within the components that need them,
// or in the App.vue component's onMounted hook.

// --- Vue App Initialization ---
const app = createApp(App);
app.mount('#app');
console.log('Vue root app mounted.');
