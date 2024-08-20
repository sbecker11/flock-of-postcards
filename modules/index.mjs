const POLLING_INTERVAL = 100; // Polling interval in milliseconds
const MAX_WAIT_TIME = 5000; // Maximum wait time in milliseconds

function runMain() {
    import('./main.mjs')
        .catch(err => {
            console.error('Failed to load main.mjs:', err);
        });
}

(function checkDocumentAvailability(startTime) {
    if (typeof document !== 'undefined') {
        runMain();
    } else if (Date.now() - startTime < MAX_WAIT_TIME) {
        setTimeout(() => checkDocumentAvailability(startTime), POLLING_INTERVAL);
    } else {
        console.error(`browser's document object was not found within timeout of ${MAX_WAIT_TIME / 1000} sec. Exiting application.`);
    }
})(Date.now());