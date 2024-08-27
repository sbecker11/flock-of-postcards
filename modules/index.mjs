const POLLING_INTERVAL = 100; // Polling interval in milliseconds
const MAX_WAIT_TIME = 5000; // Maximum wait time in milliseconds

function runMain(resumeJobs) {
    import('./main.mjs')
        .then(main => 
            main.main(resumeJobs))
        .catch(err => {
            console.error('Failed to load main.mjs:', err);
        });
}

function loadResumeJobs() {
    import getResumeJobs from 'modules/jobs/json-utils.mjs';
    const resumeJobs = await getResumeJobs();
    if ( !resumeJobs ) {
        return Promise.reject('Failed to load resume jobs'); // throw new Error('Failed to load resume jobs'); => 
    }
    return resumeJobs;
}

(function checkDocumentAvailability(startTime) {
    if (typeof document !== 'undefined') {
        console.log('document object found');
        const resumeJobs = loadResumeJobs();
        runMain(resumeJobs);
    } else if (Date.now() - startTime < MAX_WAIT_TIME) {
        setTimeout(() => checkDocumentAvailability(startTime), POLLING_INTERVAL);
    } else {
        console.error(`browser's document object was not found within timeout of ${MAX_WAIT_TIME / 1000} sec. Exiting application.`);
    }
})(Date.now());