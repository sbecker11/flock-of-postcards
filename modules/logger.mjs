// Usage:
// import { Logger, LogLevel } from "./logger.mjs";
// const logger = new Logger(LogLevel.INFO); // name is now optional
// logger.log("This ia a trace");    // hidden
// logger.log("This ia a log");      // hidden
// logger.info("This is info");      // shown
// logger.warn("This is a warning"); // shown
// logger.error("This is an error"); // shown

// @ts-nocheck
'use strict';

export const LogLevel = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    TRACE_ON_FAILURE: 'TRACE_ON_FAILURE'
};

export const LogLevelNames = {
    [LogLevel.NONE]: "NONE",
    [LogLevel.LOG]: "LOG",
    [LogLevel.INFO]: "INFO",
    [LogLevel.WARN]: "WARN",
    [LogLevel.ERROR]: "ERROR",
    [LogLevel.CRITICAL]: "CRITICAL",
    [LogLevel.NO_TRACE_ON_FAILURE]: "NO_TRACE_ON_FAILURE",
    [LogLevel.TRACE_ON_FAILURE]: "TRACE_ON_FAILURE"
};

export class Logger {
    constructor(level = LogLevel.INFO, traceLevel = null) {
        this.level = level;
        this.traceLevel = traceLevel;
    }

    // Get the calling module's name from the stack trace
    getCallerInfo() {
        const error = new Error();
        const stack = error.stack.split('\n');
        // Find the first line that's not from logger.mjs
        for (let i = 1; i < stack.length; i++) {
            const line = stack[i];
            if (!line.includes('logger.mjs')) {
                // Extract filename from the line
                const match = line.match(/\/([^\/]+\.m?js)/);
                if (match) {
                    return match[1];
                }
                break;
            }
        }
        return 'unknown';
    }

    trace(...args) {
        if (this.level <= LogLevel.NONE) {
            const caller = this.getCallerInfo();
            console.log("TRACE:", caller, ...args);
            if (this.traceLevel == LogLevel.TRACE_ON_FAILURE) {
                const timestamp = new Date().toISOString();
                const title = `${timestamp} [${this.levelName}] [${caller}] -`;
                console.trace(title, ...args);
            }
        }
    }

    log(...args) {
        if (this.level <= LogLevel.LOG) {
            const caller = this.getCallerInfo();
            console.log("LOG:", caller, ...args);
            if (this.traceLevel == LogLevel.TRACE_ON_FAILURE) {
                const timestamp = new Date().toISOString();
                const title = `${timestamp} [${this.levelName}] [${caller}] -`;
                console.trace(title, ...args);
            }
        }
    }

    info(...args) {
        if (this.level <= LogLevel.INFO) {
            const caller = this.getCallerInfo();
            console.log("INFO:", caller, ...args);
            if (this.traceLevel == LogLevel.TRACE_ON_FAILURE) {
                const timestamp = new Date().toISOString();
                const title = `${timestamp} [${this.levelName}] [${caller}] -`;
                console.trace(title, ...args);
            }
        }
    }

    warn(...args) {
        if (this.level <= LogLevel.WARN) {
            const caller = this.getCallerInfo();
            console.warn("WARN:", caller, ...args);
            if (this.traceLevel == LogLevel.TRACE_ON_FAILURE) {
                const timestamp = new Date().toISOString();
                const title = `${timestamp} [${this.levelName}] [${caller}] -`;
                console.trace(title, ...args);
            }
        }
    }

    error(...args) {
        if (this.level <= LogLevel.ERROR) {
            const caller = this.getCallerInfo();
            console.error("ERROR:", caller, ...args);
            if (this.traceLevel == LogLevel.TRACE_ON_FAILURE) {
                const timestamp = new Date().toISOString();
                const title = `${timestamp} [${this.levelName}] [${caller}] -`;
                console.trace(title, ...args);
            }
        }
    }

    critical(...args) {
        if (this.level <= LogLevel.CRITICAL) {
            const caller = this.getCallerInfo();
            console.error("CRITICAL:", caller, ...args);
            if (this.traceLevel == LogLevel.TRACE_ON_FAILURE) {
                const timestamp = new Date().toISOString();
                const title = `${timestamp} [${this.levelName}] [${caller}] -`;
                console.trace(title, ...args);
            }
        }
    }

    // log the message with the given log level
    logWithLevel(message, logLevel=LogLevel.LOG) {
        switch(logLevel) {
            case LogLevel.DEBUG:
                this.debug(message);
                break;
            case LogLevel.INFO:
                this.info(message);
                break;
            case LogLevel.WARN:
                this.warn(message);
                break;
            case LogLevel.ERROR:
                this.error(message);
                break;
            default:
                this.log(message);
        }
    }
}

// Create and export a singleton instance
export const logger = new Logger(LogLevel.INFO);
