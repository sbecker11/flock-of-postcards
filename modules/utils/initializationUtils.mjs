/**
 * Utility functions for thread-safe initialization patterns
 * This provides JavaScript equivalents to Java's synchronized initialization
 */

/**
 * Creates a thread-safe initializer function that prevents race conditions
 * during concurrent initialization calls.
 * 
 * @param {Function} initFunction - The actual initialization function to execute
 * @param {string} moduleName - Name of the module for logging purposes
 * @returns {Function} A thread-safe initialize function
 */
export function createThreadSafeInitializer(initFunction, moduleName = 'unknown') {
    let isInitialized = false;
    let initializationPromise = null;
    
    return async function(...args) {
        // If already initialized, return immediately
        if (isInitialized) {
            window.CONSOLE_LOG_IGNORE(`${moduleName}: Already initialized, ignoring duplicate call`);
            return;
        }
        
        // If initialization is in progress, wait for it to complete
        if (initializationPromise) {
            window.CONSOLE_LOG_IGNORE(`${moduleName}: Initialization in progress, waiting...`);
            await initializationPromise;
            return;
        }
        
        // Start initialization and store the promise
        initializationPromise = _performInitialization(initFunction, moduleName, args);
        
        try {
            await initializationPromise;
        } finally {
            // Clear the promise after completion (success or failure)
            initializationPromise = null;
        }
    };
}

/**
 * Private function to perform the actual initialization
 */
async function _performInitialization(initFunction, moduleName, args) {
    window.CONSOLE_LOG_IGNORE(`${moduleName}: Starting initialization`);
    
    try {
        await initFunction(...args);
        isInitialized = true;
        window.CONSOLE_LOG_IGNORE(`${moduleName}: Initialization complete`);
    } catch (error) {
        window.CONSOLE_LOG_IGNORE(`${moduleName}: Initialization failed:`, error);
        throw error;
    }
}

/**
 * Creates a thread-safe initializer for class methods
 * This is useful for singleton classes that need thread-safe initialization
 * 
 * @param {Object} instance - The class instance
 * @param {string} methodName - Name of the initialization method
 * @param {string} moduleName - Name of the module for logging
 */
export function makeThreadSafe(instance, methodName, moduleName) {
    const originalMethod = instance[methodName];
    let isInitialized = false;
    let initializationPromise = null;
    
    instance[methodName] = async function(...args) {
        // If already initialized, return immediately
        if (isInitialized) {
            window.CONSOLE_LOG_IGNORE(`${moduleName}: Already initialized, ignoring duplicate call`);
            return;
        }
        
        // If initialization is in progress, wait for it to complete
        if (initializationPromise) {
            window.CONSOLE_LOG_IGNORE(`${moduleName}: Initialization in progress, waiting...`);
            await initializationPromise;
            return;
        }
        
        // Start initialization and store the promise
        initializationPromise = _performClassInitialization(originalMethod, moduleName, this, args);
        
        try {
            await initializationPromise;
        } finally {
            // Clear the promise after completion (success or failure)
            initializationPromise = null;
        }
    };
}

/**
 * Private function to perform class initialization
 */
async function _performClassInitialization(originalMethod, moduleName, instance, args) {
    window.CONSOLE_LOG_IGNORE(`${moduleName}: Starting initialization`);
    
    try {
        await originalMethod.apply(instance, args);
        instance._isInitialized = true;
        window.CONSOLE_LOG_IGNORE(`${moduleName}: Initialization complete`);
    } catch (error) {
        window.CONSOLE_LOG_IGNORE(`${moduleName}: Initialization failed:`, error);
        throw error;
    }
}

/**
 * Alternative approach using a mutex-like pattern
 * This is useful when you need more control over the locking mechanism
 */
export class InitializationMutex {
    constructor(moduleName = 'unknown') {
        this.moduleName = moduleName;
        this.isInitialized = false;
        this.initializationPromise = null;
    }
    
    async execute(initFunction, ...args) {
        // If already initialized, return immediately
        if (this.isInitialized) {
            window.CONSOLE_LOG_IGNORE(`${this.moduleName}: Already initialized, ignoring duplicate call`);
            return;
        }
        
        // If initialization is in progress, wait for it to complete
        if (this.initializationPromise) {
            window.CONSOLE_LOG_IGNORE(`${this.moduleName}: Initialization in progress, waiting...`);
            await this.initializationPromise;
            return;
        }
        
        // Start initialization and store the promise
        this.initializationPromise = this._performInitialization(initFunction, args);
        
        try {
            await this.initializationPromise;
        } finally {
            // Clear the promise after completion (success or failure)
            this.initializationPromise = null;
        }
    }
    
    async _performInitialization(initFunction, args) {
        window.CONSOLE_LOG_IGNORE(`${this.moduleName}: Starting initialization`);
        
        try {
            await initFunction(...args);
            this.isInitialized = true;
            window.CONSOLE_LOG_IGNORE(`${this.moduleName}: Initialization complete`);
        } catch (error) {
            window.CONSOLE_LOG_IGNORE(`${this.moduleName}: Initialization failed:`, error);
            throw error;
        }
    }
    
    reset() {
        this.isInitialized = false;
        this.initializationPromise = null;
    }
} 