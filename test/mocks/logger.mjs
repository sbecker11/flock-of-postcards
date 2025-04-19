export const LogLevel = {
    NONE: 0,
    LOG: 1,
    INFO: 2,
    WARN: 3,
    ERROR: 4,
    CRITICAL: 5
};

export class Logger {
    constructor(logLevel = LogLevel.LOG) {
        this.logLevel = logLevel;
    }

    log() {}
    info() {}
    warn() {}
    error() {}
    critical() {}
} 