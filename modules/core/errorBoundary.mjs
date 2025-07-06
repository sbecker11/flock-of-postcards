/**
 * Error boundary system for handling component relationship errors
 */

class ErrorBoundary {
    constructor() {
        this.errorCounts = new Map();
        this.recoveryStrategies = new Map();
        this.maxRetries = 3;
        this.isEnabled = true;
    }

    /**
     * Wrap a function with error handling
     * @param {Function} fn - Function to wrap
     * @param {string} context - Context for error reporting
     * @param {Function} recoveryFn - Optional recovery function
     * @returns {Function} - Wrapped function
     */
    wrap(fn, context, recoveryFn = null) {
        return async (...args) => {
            if (!this.isEnabled) {
                return fn(...args);
            }

            try {
                return await fn(...args);
            } catch (error) {
                this.handleError(error, context, recoveryFn, args);
                throw error; // Re-throw for caller to handle
            }
        };
    }

    /**
     * Handle an error with recovery strategies
     * @param {Error} error - The error that occurred
     * @param {string} context - Context where the error occurred
     * @param {Function} recoveryFn - Recovery function to try
     * @param {Array} args - Original arguments
     */
    async handleError(error, context, recoveryFn, args) {
        const errorKey = `${context}_${error.name}`;
        const currentCount = this.errorCounts.get(errorKey) || 0;
        
        window.CONSOLE_LOG_IGNORE(`[ERROR] ${context}:`, error);
        window.CONSOLE_LOG_IGNORE(`[ERROR] Error count for ${errorKey}: ${currentCount + 1}`);
        
        // Increment error count
        this.errorCounts.set(errorKey, currentCount + 1);
        
        // Try recovery if we haven't exceeded max retries
        if (currentCount < this.maxRetries && recoveryFn) {
            window.CONSOLE_LOG_IGNORE(`[ERROR] Attempting recovery for ${context} (attempt ${currentCount + 1})`);
            
            try {
                await recoveryFn(error, args);
                window.CONSOLE_LOG_IGNORE(`[ERROR] Recovery successful for ${context}`);
                
                // Reset error count on successful recovery
                this.errorCounts.set(errorKey, 0);
            } catch (recoveryError) {
                window.CONSOLE_LOG_IGNORE(`[ERROR] Recovery failed for ${context}:`, recoveryError);
            }
        } else if (currentCount >= this.maxRetries) {
            window.CONSOLE_LOG_IGNORE(`[ERROR] Max retries exceeded for ${context}, disabling component`);
            this.disableComponent(context);
        }
    }

    /**
     * Register a recovery strategy for a specific error type
     * @param {string} errorType - Type of error to handle
     * @param {Function} strategy - Recovery strategy function
     */
    registerRecoveryStrategy(errorType, strategy) {
        this.recoveryStrategies.set(errorType, strategy);
        window.CONSOLE_LOG_IGNORE(`[ERROR] Registered recovery strategy for ${errorType}`);
    }

    /**
     * Disable a component after too many errors
     * @param {string} componentName - Name of the component to disable
     */
    disableComponent(componentName) {
        window.CONSOLE_LOG_IGNORE(`[ERROR] Disabling component: ${componentName}`);
        
        // Dispatch event for other components to handle
        const event = new CustomEvent('component-disabled', {
            detail: { componentName, reason: 'max_errors_exceeded' }
        });
        window.dispatchEvent(event);
    }

    /**
     * Get error statistics
     * @returns {Object} - Error statistics
     */
    getErrorStats() {
        const stats = {};
        for (const [errorKey, count] of this.errorCounts) {
            const [context, errorType] = errorKey.split('_');
            if (!stats[context]) {
                stats[context] = {};
            }
            stats[context][errorType] = count;
        }
        return stats;
    }

    /**
     * Reset error counts for a specific context
     * @param {string} context - Context to reset
     */
    resetErrors(context) {
        for (const [errorKey] of this.errorCounts) {
            if (errorKey.startsWith(context)) {
                this.errorCounts.delete(errorKey);
            }
        }
        window.CONSOLE_LOG_IGNORE(`[ERROR] Reset error counts for ${context}`);
    }

    /**
     * Enable or disable error boundary
     * @param {boolean} enabled - Whether to enable error boundary
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        window.CONSOLE_LOG_IGNORE(`[ERROR] Error boundary ${enabled ? 'enabled' : 'disabled'}`);
    }
}

// Export singleton instance
export const errorBoundary = new ErrorBoundary();

// Common recovery strategies
export const recoveryStrategies = {
    // Retry with exponential backoff
    retryWithBackoff: (fn, maxRetries = 3) => {
        return async (...args) => {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    return await fn(...args);
                } catch (error) {
                    if (attempt === maxRetries) throw error;
                    
                    const delay = Math.pow(2, attempt) * 100; // 200ms, 400ms, 800ms
                    window.CONSOLE_LOG_IGNORE(`[ERROR] Retry attempt ${attempt} in ${delay}ms`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        };
    },

    // Fallback to default values
    fallbackToDefault: (defaultValue) => {
        return async (error, args) => {
            window.CONSOLE_LOG_IGNORE(`[ERROR] Using fallback value:`, defaultValue);
            return defaultValue;
        };
    },

    // Reinitialize component
    reinitialize: (initFn) => {
        return async (error, args) => {
            window.CONSOLE_LOG_IGNORE(`[ERROR] Reinitializing component`);
            await initFn();
        };
    }
}; 