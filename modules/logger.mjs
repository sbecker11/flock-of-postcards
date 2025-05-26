// modules/logger.mjs
// 
// Usage:
// import { Loggera, LogLevel } from "./logger.mjs";
// const logger = new Logger("focal_point", LogLevel.INFO);
// logger.log("This ia a trace");    // hidden
// logger.log("This ia a log");      // hidden
// logger.info("This is info");      // shown
// logger.warn("This is a warning"); // shown
// logger.error("This is an error"); // shown

export const LogLevel = {
    NONE: 0,
    LOG: 1,
    INFO: 2,
    WARN: 3,
    ERROR: 4,
    CRITICAL: 5,
    NO_TRACE_ON_FAILURE: 6,
    TRACE_ON_FAILURE: 7
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
    constructor(name="Logger", logLevel=LogLevel.LOG, traceOnFailure=LogLevel.NO_TRACE_ON_FAILURE) {
        this.name = name;
        this.logLevel = logLevel;
        this.levelName = LogLevelNames[logLevel];
        this.traceOnFailure = traceOnFailure;
    }

    trace(...args) {
        if ( this.logLevel <= LogLevel.NONE ) {
            console.log("TRACE:", this.name, ...args);
            if ( this.traceOnFailure == LogLevel.TRACE_ON_FAILURE) {
                const timestamp = new Date().toISOString();
                const title = `${timestamp} [${this.levelName}] [${this.name}] -`;
                console.trace(title, ...args);
            }
        }
    }
    log(...args) {
        if ( this.logLevel <= LogLevel.LOG  ) {
            console.log("LOG:", this.name, ...args);
            if ( this.traceOnFailure == LogLevel.TRACE_ON_FAILURE ) {
                const timestamp = new Date().toISOString();
                const title = `${timestamp} [${this.levelName}] [${this.name}] -`;
                console.trace(title, ...args);
            }
        }
    }
    info(...args) {
        if ( this.logLevel <= LogLevel.INFO ) {
            console.log("INFO:", this.name, ...args);
            if ( this.traceOnFailure == LogLevel.TRACE_ON_FAILURE ) {
                const timestamp = new Date().toISOString();
                const title = `${timestamp} [${this.levelName}] [${this.name}] -`;
                console.trace(title, ...args);
            }
        }
    }
    warn(...args) {
        if ( this.logLevel <= LogLevel.WARN ) {
            console.warn("WARN:", this.name, ...args);
            if ( this.traceOnFailure == LogLevel.TRACE_ON_FAILURE ) {
                const timestamp = new Date().toISOString();
                const title = `${timestamp} [${this.levelName}] [${this.name}] -`;
                console.trace(title, ...args);
            }
        }
    }
    error(...args) {
        if ( this.logLevel <= LogLevel.ERROR ) {
            console.error("ERROR:", this.name, ...args);
            if ( this.traceOnFailure == LogLevel.TRACE_ON_FAILURE ) {
                const timestamp = new Date().toISOString();
                const title = `${timestamp} [${this.levelName}] [${this.name}] -`;
                console.trace(title, ...args);
            }
        }
    }
    critical(...args) {
        if ( this.logLevel <= LogLevel.CRITICAL ) {
            console.error("CRITICAL:", this.name, ...args);
            if ( this.traceOnFailure == LogLevel.TRACE_ON_FAILURE ) {
                const timestamp = new Date().toISOString();
                const title = `${timestamp} [${this.levelName}] [${this.name}] -`;
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
