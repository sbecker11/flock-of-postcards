/**
 * Performance monitoring utility for resize and scroll operations
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.thresholds = {
            resizeTime: 16, // 60fps = 16ms per frame
            scrollTime: 8,  // More strict for scroll
            memoryUsage: 50 * 1024 * 1024 // 50MB
        };
        this.isEnabled = true;
    }

    /**
     * Start timing an operation
     * @param {string} operation - Name of the operation
     * @returns {string} - Unique ID for the operation
     */
    startTiming(operation) {
        if (!this.isEnabled) return null;
        
        const id = `${operation}_${Date.now()}_${Math.random()}`;
        this.metrics.set(id, {
            operation,
            startTime: performance.now(),
            startMemory: performance.memory ? performance.memory.usedJSHeapSize : 0
        });
        
        return id;
    }

    /**
     * End timing an operation
     * @param {string} id - Operation ID from startTiming
     * @param {Object} additionalData - Additional data to record
     */
    endTiming(id, additionalData = {}) {
        if (!this.isEnabled || !id || !this.metrics.has(id)) return;
        
        const metric = this.metrics.get(id);
        const endTime = performance.now();
        const duration = endTime - metric.startTime;
        
        metric.duration = duration;
        metric.endTime = endTime;
        metric.additionalData = additionalData;
        
        if (performance.memory) {
            metric.endMemory = performance.memory.usedJSHeapSize;
            metric.memoryDelta = metric.endMemory - metric.startMemory;
        }
        
        // Check for performance issues
        this.checkPerformance(metric);
        
        // Clean up old metrics (keep last 100)
        this.cleanupOldMetrics();
    }

    /**
     * Check if performance is within acceptable thresholds
     * @param {Object} metric - Performance metric
     */
    checkPerformance(metric) {
        const { operation, duration, memoryDelta } = metric;
        
        if (operation.includes('resize') && duration > this.thresholds.resizeTime) {
            window.CONSOLE_LOG_IGNORE(`[PERF] Slow resize operation: ${duration.toFixed(2)}ms (threshold: ${this.thresholds.resizeTime}ms)`);
        }
        
        if (operation.includes('scroll') && duration > this.thresholds.scrollTime) {
            window.CONSOLE_LOG_IGNORE(`[PERF] Slow scroll operation: ${duration.toFixed(2)}ms (threshold: ${this.thresholds.scrollTime}ms)`);
        }
        
        if (memoryDelta > this.thresholds.memoryUsage) {
            window.CONSOLE_LOG_IGNORE(`[PERF] High memory usage: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
        }
    }

    /**
     * Clean up old metrics to prevent memory leaks
     */
    cleanupOldMetrics() {
        if (this.metrics.size > 100) {
            const entries = Array.from(this.metrics.entries());
            entries.sort((a, b) => b[1].endTime - a[1].endTime);
            
            // Keep only the 50 most recent
            const toDelete = entries.slice(50);
            for (const [id] of toDelete) {
                this.metrics.delete(id);
            }
        }
    }

    /**
     * Get performance statistics
     * @param {string} operation - Optional operation filter
     * @returns {Object} - Performance statistics
     */
    getStats(operation = null) {
        const relevantMetrics = Array.from(this.metrics.values())
            .filter(m => !operation || m.operation.includes(operation))
            .filter(m => m.duration !== undefined);
        
        if (relevantMetrics.length === 0) {
            return { count: 0, avgDuration: 0, maxDuration: 0, minDuration: 0 };
        }
        
        const durations = relevantMetrics.map(m => m.duration);
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const maxDuration = Math.max(...durations);
        const minDuration = Math.min(...durations);
        
        return {
            count: relevantMetrics.length,
            avgDuration: avgDuration.toFixed(2),
            maxDuration: maxDuration.toFixed(2),
            minDuration: minDuration.toFixed(2),
            recentMetrics: relevantMetrics.slice(-10) // Last 10 operations
        };
    }

    /**
     * Enable or disable performance monitoring
     * @param {boolean} enabled - Whether to enable monitoring
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        window.CONSOLE_LOG_IGNORE(`[PERF] Performance monitoring ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Reset all metrics
     */
    reset() {
        this.metrics.clear();
        window.CONSOLE_LOG_IGNORE('[PERF] Performance metrics reset');
    }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience functions for common operations
export const perf = {
    resize: (id) => performanceMonitor.startTiming('resize'),
    scroll: (id) => performanceMonitor.startTiming('scroll'),
    layout: (id) => performanceMonitor.startTiming('layout'),
    end: (id, data) => performanceMonitor.endTiming(id, data),
    stats: (operation) => performanceMonitor.getStats(operation)
}; 