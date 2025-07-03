import { jobs } from '../../static_content/jobs/jobs.mjs';
import { selectionManager } from '../core/selectionManager.mjs';

class SkillCloudModule {
    constructor() {
        this.isInitialized = false;
        // Remove all animation-related properties
    }

    initialize() {
        if (this.isInitialized) {
            console.log('SkillCloudModule: Already initialized, skipping');
            return;
        }
        console.log('SkillCloudModule: Initializing');
        
        // Listen for selection changes
        selectionManager.addEventListener('selectionChanged', (event) => {
            console.log('SkillCloudModule: Received selectionChanged event:', event.detail);
            this.handleSelectionChanged(event);
        });
        
        // Listen for selection cleared
        selectionManager.addEventListener('selectionCleared', (event) => {
            console.log('SkillCloudModule: Received selectionCleared event:', event.detail);
            this.handleSelectionCleared(event);
        });
        
        this.isInitialized = true;
        console.log('SkillCloudModule: Initialized successfully');
    }

    handleSelectionChanged(event) {
        const { jobIndex } = event.detail;
        console.log(`SkillCloudModule.handleSelectionChanged: jobIndex=${jobIndex}`);
        
        // Skill cloud functionality removed
        console.log(`SkillCloudModule: Skill clouds disabled for job ${jobIndex}`);
    }

    handleSelectionCleared(event) {
        console.log('SkillCloudModule.handleSelectionCleared: Selection cleared');
        
        // Skill cloud functionality removed
        console.log('SkillCloudModule: Skill clouds disabled - selection cleared');
    }
}

// Create and export the module instance
const skillCloudModule = new SkillCloudModule();

// Auto-initialize when the module is loaded
skillCloudModule.initialize();

export { skillCloudModule }; 