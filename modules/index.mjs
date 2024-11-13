const POLLING_INTERVAL = 100; // Polling interval in milliseconds
const MAX_WAIT_TIME = 5000; // Maximum wait time in milliseconds

import { loadResumeJobs } from './jobs/json_utils.mjs'

function runMain(resumeJobs) {
    import('./main.mjs')
        .then(main => 
            main.main(resumeJobs))
        .catch(err => {
            console.error('Failed to load main.mjs:', err);
        });
}

async function loadJsonUtilsResumeJobs() {
    const resumeJobs = await loadResumeJobs();
    if ( !resumeJobs ) {
        return Promise.reject('Failed to load resume jobs'); // throw new Error('Failed to load resume jobs'); => 
    }
    return resumeJobs;
}

(function checkDocumentAvailability(startTime) {
    if (typeof document !== 'undefined') {
        console.log('document object found');
        loadJsonUtilsResumeJobs()
            .then(resumeJobs => {
                runMain(resumeJobs);
            })
            .catch(err => {
                console.error('Error loading resume jobs:', err);
            });
    } else {
        console.log('document object not found, so handling non-browser environment');
        // Handle non-browser environment
        loadJsonUtilsResumeJobs()
            .then(resumeJobs => {
                console.log('Resume Jobs:', resumeJobs);
            })
            .catch(err => {
                console.error('Error loading resume jobs:', err);
            });
    }
})(Date.now());