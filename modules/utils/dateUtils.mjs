// modules/utils/dateUtils.mjs

import * as utils from './utils.mjs';

 /**
 * Get start and end dates for a given month
 * @param {number} year - Full year (e.g., 2023)
 * @param {number} month - Month (1-12)
 * @returns {Object} - {start: Date, end: Date}
 */
export const getMonthDates = (year, month) => {
    if (!Number.isInteger(year) || year < 1000 || year > 9999) {
        throw new Error(`Invalid year: ${year}`);
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new Error(`Invalid month: ${month}. Must be 1-12`);
    }
    
    return {
        start: new Date(year, month - 1, 1),
        end: new Date(year, month, 0)
    };
};

/**
 * Usage Examples
 * const { start, end } = getMonthDates(2023, 6);
 * window.CONSOLE_LOG_IGNORE(start); // June 1, 2023
 * window.CONSOLE_LOG_IGNORE(end);   // June 30, 2023
 * 
 * const { start, end } = getMonthDates(2024, 2);
 * window.CONSOLE_LOG_IGNORE(end);   // February 29, 2024 (leap year!)
 */

/**
 * Get ISO date string from Date object
 * @deprecated since version 2.1.0. Use formatISO8601DateOnly() instead.
 * Will be removed in version 3.0.0.
 * @param {Date} date - Date object
 * @returns {string} - ISO date string (YYYY-MM-DD)
 */
export const getIsoDateString = (date) => date.toISOString().slice(0, 10);
/**
 * Parse date string in YYYY-MM or YYYY-MM-DD format
 * @param {string} dateStr - Date string
 * @returns {Date} - Date object
 */
export function parseFlexibleDateString(dateStr) {
    if (typeof dateStr !== 'string' || !dateStr.trim()) {
        throw new Error(`Invalid or empty date string provided: '${dateStr}'`);
    }

    const trimmedDateStr = dateStr.trim().toLowerCase();

    // Handle "Present" or "Current"
    if (trimmedDateStr === 'present' || trimmedDateStr === 'current' || trimmedDateStr === 'current_date') {
        return new Date();
    }
    
    // Try YYYY-MM-DD
    let match = trimmedDateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
        const [, year, month, day] = match;
        return new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10)));
    }
    
    // Try YYYY-MM
    match = trimmedDateStr.match(/^(\d{4})-(\d{2})$/);
    if (match) {
        const [, year, month] = match;
        return new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, 1));
    }

    // Try YYYY
    match = trimmedDateStr.match(/^(\d{4})$/);
    if (match) {
        const [, year] = match;
        return new Date(Date.UTC(parseInt(year, 10), 0, 1)); // January 1st of that year
    }

    // Fallback for other potential full date formats that new Date() can handle
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        // It's a valid date that new Date() could parse, so let's use it.
        // To avoid timezone issues, let's reconstruct it as UTC from its parts.
        return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    }
    
    throw new Error(`Invalid or unhandled date format: "${dateStr}".`);
}

/*
 * Parse a 4-digit year string
 * @param {*} yearStr 
 * @returns {number} - the parsed year number
 */
export function parseYearStr(yearStr) {
    utils.validateString(yearStr)
    const match = yearStr.match(/^(\d{4})$/);
    if ( match ) {
        const [,year] = match;
        const yearNum = parseInt(year,10);
        return yearNum;
    }
    throw new Error(`parseYearStr: yearStr:${yearStr} is not valid`);
}

/*
 * Parse a 2-digit month string
 * @param {*} monthStr 
 * @returns {number} - the parsed month number
 */
export function parseMonthStr(monthStr) {
    utils.validateString(monthStr)
    const match = monthStr.match(/^(\d{2})$/);
    if ( match ) {
        const [, month] = match;
        const monthNum = parseInt(month, 10);
        utils.validateNumberInRange(monthNum, 1, 12);
        return monthNum;
    }
    throw new Error(`parseMonthStr: monthStr:${monthStr} 
        is not a valid 2-digit month (01-12)`);
}

/**
 * Parse ISO 8601 date string (e.g., "2023-06-15T14:30:45 UTC")
 * Handles various ISO 8601 formats including UTC suffix.
 * @deprecated since version 2.1.0. Use parseISO8601Strict() instead.
 * Will be removed in version 3.0.0.
 * @param {string} dateStr - ISO 8601 date string
 * @returns {Date} - Date object
 */
export function parseISO8601(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
        throw new Error('Invalid date string');
    }
    
    // Remove " UTC" suffix if present (from your shell alias format)
    const cleanDateStr = dateStr.replace(/ UTC$/, '');
    
    // Try parsing with native Date constructor (handles most ISO 8601 formats)
    const date = new Date(cleanDateStr);
    
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid ISO 8601 date format: ${dateStr}`);
    }
    return date;
}

/**
 * Parse ISO 8601 date string with more specific format validation
 * @param {string} dateStr - ISO 8601 date string
 * @returns {Date} - Date object
 */
export function parseISO8601Strict(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
        throw new Error('Invalid date string');
    }

    // Remove " UTC" suffix if present
    let cleanDateStr = dateStr.replace(/ UTC$/, '');

    // Add 'Z' for UTC if not present and no timezone info
    if (!cleanDateStr.includes('Z') && !cleanDateStr.includes('+') && !cleanDateStr.includes('-', 10)) {
        cleanDateStr += 'Z';
    }

    // Regex for ISO 8601 format validation
    const iso8601Regex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?(?:Z|[+-]\d{2}:\d{2})?$/;

    if (!iso8601Regex.test(cleanDateStr)) {
        throw new Error(`Invalid ISO 8601 format: ${dateStr}`);
    }

    const date = new Date(cleanDateStr);

    if (isNaN(date.getTime())) {
        throw new Error(`Invalid ISO 8601 date: ${dateStr}`);
    }

    return date;
}

/**
 * Format Date to ISO 8601 basic format (YYYY-MM-DDTHH:mm:ssZ)
 * @param {Date} date - Date object
 * @returns {string} - ISO 8601 formatted string
 */
export function formatISO8601Basic(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        throw new Error('Invalid Date object');
    }
    return date.toISOString();
}

/**
 * Format Date to ISO 8601 with milliseconds (YYYY-MM-DDTHH:mm:ss.sssZ)
 * @param {Date} date - Date object
 * @returns {string} - ISO 8601 formatted string with milliseconds
 */
export function formatISO8601WithMillis(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        throw new Error('Invalid Date object');
    }
    return date.toISOString();
}

/**
 * Format Date to ISO 8601 without milliseconds (YYYY-MM-DDTHH:mm:ssZ)
 * @param {Date} date - Date object
 * @returns {string} - ISO 8601 formatted string without milliseconds
 */
export function formatISO8601NoMillis(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        throw new Error('Invalid Date object');
    }
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Format Date to shell alias format (YYYY-MM-DDTHH:mm:ss UTC)
 * Matches your iso8601='date -u "+%FT%T UTC"' alias
 * @param {Date} date - Date object
 * @returns {string} - Shell alias formatted string
 */
export function formatISO8601ShellAlias(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        throw new Error('Invalid Date object');
    }
    return date.toISOString().replace(/\.\d{3}Z$/, ' UTC');
}

/**
 * Format Date to ISO 8601 with timezone offset (YYYY-MM-DDTHH:mm:ss±HH:mm)
 * @param {Date} date - Date object
 * @returns {string} - ISO 8601 formatted string with local timezone
 */
export function formatISO8601WithTimezone(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        throw new Error('Invalid Date object');
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    const timezoneOffset = -date.getTimezoneOffset();
    const offsetSign = timezoneOffset >= 0 ? '+' : '-';
    const offsetHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
    const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
}

/**
 * Format Date to ISO 8601 date only (YYYY-MM-DD)
 * @param {Date} date - Date object
 * @returns {string} - ISO 8601 date string
 */
export function formatISO8601DateOnly(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        throw new Error('Invalid Date object');
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format Date to ISO 8601 year-month only (YYYY-MM)
 * @param {Date} date - Date object
 * @returns {string} - ISO 8601 year-month string
 */
export function formatISO8601YearMonth(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        throw new Error('Invalid Date object');
    }
    return date.toISOString().substring(0, 7);
}

/**
 * Iterates over a list of jobs and finds the minimum and maximum year.
 * @param {Array<Object>} jobs - An array of job objects, where each object has 'start' and 'end' date strings.
 * @returns {{minYear: number, maxYear: number}} - An object containing the minimum and maximum year found.
 */
export function getMinMaxYears(jobs) {
    if (!jobs || jobs.length === 0) {
        const currentYear = new Date().getFullYear();
        return { minYear: currentYear, maxYear: currentYear };
    }

    let minYear = Infinity;
    let maxYear = -Infinity;

    jobs.forEach(job => {
        const startDate = parseFlexibleDateString(job.start);
        if (startDate) {
            const startYear = startDate.getFullYear();
            if (startYear < minYear) {
                minYear = startYear;
            }
            if (startYear > maxYear) {
                maxYear = startYear;
            }
        }

        const endDate = parseFlexibleDateString(job.end);
        if (endDate) {
            const endYear = endDate.getFullYear();
            if (endYear > maxYear) {
                maxYear = endYear;
            }
            if (endYear < minYear) {
              minYear = endYear;
            }
        }
    });

    // If no valid dates were found, default to the current year.
    if (minYear === Infinity || maxYear === -Infinity) {
        const currentYear = new Date().getFullYear();
        return { minYear: currentYear, maxYear: currentYear };
    }

    // After finding the maxYear from data, ensure it's at least the *next* year.
    const currentYear = new Date().getFullYear() + 1;
    maxYear = Math.max(maxYear, currentYear);

    return { minYear, maxYear };
}

/** EXAMPLES
 * 
 * Your shell alias format: date -u "+%FT%T UTC"
 * const date1 = parseISO8601("2023-06-15T14:30:45 UTC");
 * 
 * // Standard ISO 8601 formats
 * const date2 = parseISO8601("2023-06-15T14:30:45Z");
 * const date3 = parseISO8601("2023-06-15T14:30:45.123Z");
 * const date4 = parseISO8601("2023-06-15T14:30:45+02:00");
 * const date5 = parseISO8601("2023-06-15T14:30:45");
 * 
 * // Strict validation
 * const date6 = parseISO8601Strict("2023-06-15T14:30:45 UTC");
 */

/**
 * Parse a date string in YYYY-MM or YYYY-MM-DD format
 * @param {string} dateStr - Date string in YYYY-MM or YYYY-MM-DD format
 * @returns {Date} - Date object
 */
export function getDateFromString(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
        throw new Error(`Invalid date string: ${dateStr}`);
    }
    
    // Try YYYY-MM-DD format
    let match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
        const [, year, month, day] = match;
        const yearNum = parseInt(year, 10);
        const monthNum = parseInt(month, 10);
        const dayNum = parseInt(day, 10);
        
        // Validate month and day
        if (monthNum < 1 || monthNum > 12) {
            throw new Error(`Invalid month: ${month}. Must be 1-12`);
        }
        
        const date = new Date(yearNum, monthNum - 1, dayNum);
        
        // Check if the date is valid (e.g., not Feb 30)
        if (date.getFullYear() !== yearNum || 
            date.getMonth() !== monthNum - 1 || 
            date.getDate() !== dayNum) {
            throw new Error(`Invalid date: ${dateStr}`);
        }
        
        return date;
    }
    
    // Try YYYY-MM format
    match = dateStr.match(/^(\d{4})-(\d{2})$/);
    if (match) {
        const [, year, month] = match;
        const yearNum = parseInt(year, 10);
        const monthNum = parseInt(month, 10);
        
        // Validate month
        if (monthNum < 1 || monthNum > 12) {
            throw new Error(`Invalid month: ${month}. Must be 1-12`);
        }
        
        // Create date with first day of month
        return new Date(yearNum, monthNum - 1, 1);
    }
    
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM or YYYY-MM-DD`);
}

/**
 * Converts a string in YYYY-MM-DD or YYYY-MM format to a Date object
 * @param {string} dateStr - Date string in YYYY-MM-DD or YYYY-MM format
 * @returns {Date} - Date object
 * @throws {Error} If the date string is invalid
 */
export function get_YYYY_MM_DD_DateFromString(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
        throw new Error(`get_YYYY_MM_DD_DateFromString: Invalid date string: ${dateStr}`);
    }
    
    // Try YYYY-MM-DD format
    let match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
        const [, year, month, day] = match;
        const yearNum = parseInt(year, 10);
        const monthNum = parseInt(month, 10);
        const dayNum = parseInt(day, 10);
        
        // Validate month and day
        if (monthNum < 1 || monthNum > 12) {
            throw new Error(`get_YYYY_MM_DD_DateFromString: Invalid month: ${month}. Must be 1-12`);
        }
        
        const date = new Date(yearNum, monthNum - 1, dayNum);
        
        // Check if the date is valid (e.g., not Feb 30)
        if (date.getFullYear() !== yearNum || 
            date.getMonth() !== monthNum - 1 || 
            date.getDate() !== dayNum) {
            throw new Error(`get_YYYY_MM_DD_DateFromString: Invalid date: ${dateStr}`);
        }
        
        return date;
    }
    
    // Try YYYY-MM format
    match = dateStr.match(/^(\d{4})-(\d{2})$/);
    if (match) {
        const [, year, month] = match;
        const yearNum = parseInt(year, 10);
        const monthNum = parseInt(month, 10);
        
        // Validate month
        if (monthNum < 1 || monthNum > 12) {
            throw new Error(`get_YYYY_MM_DD_DateFromString: Invalid month: ${month}. Must be 1-12`);
        }
        
        // Create date with first day of month
        return new Date(yearNum, monthNum - 1, 1);
    }
    
    throw new Error(`get_YYYY_MM_DD_DateFromString: Invalid date format: ${dateStr}. Expected YYYY-MM or YYYY-MM-DD`);
}

/**
 * Calculate the difference between two dates in years, months, and days
 * @param {Date} startDate - Start date as Date object
 * @param {Date} endDate - End date as Date object
 * @returns {Object} Object containing years, months, and days difference
 */
export function getDateDifference(startDate, endDate) {
    // Validate inputs are Date objects
    if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
        throw new Error('Both startDate and endDate must be Date objects');
    }
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid Date objects provided');
    }
    
    // Ensure end date is after start date
    if (endDate < startDate) {
        throw new Error("End date must be after start date");
    }
    
    // Get years difference
    let years = endDate.getFullYear() - startDate.getFullYear();
    
    // Get months difference
    let months = endDate.getMonth() - startDate.getMonth();
    if (months < 0) {
        years--;
        months += 12;
    }
    
    // Get days difference
    let days = endDate.getDate() - startDate.getDate();
    if (days < 0) {
        // Borrow from months
        months--;
        if (months < 0) {
            years--;
            months += 12;
        }
        
        // Get days in previous month
        const prevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
        days += prevMonth.getDate();
    }
    
    return { years, months, days };
}

/**
 * Validates that a date string is in YYYY-MM-DD or YYYY-MM format
 * @param {string} dateStr - The date string to validate
 * @throws {Error} If the date string is not in a valid format
 */
export function validateIs_YYYY_MM_DD_DateString(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
        throw new Error(`validateIs_YYYY_MM_DD_DateString: ${dateStr} is not a string`);
    }
    
    // Check for YYYY-MM-DD format
    const fullDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    // Check for YYYY-MM format
    const yearMonthRegex = /^\d{4}-\d{2}$/;
    
    if (!fullDateRegex.test(dateStr) && !yearMonthRegex.test(dateStr)) {
        throw new Error(`validateIs_YYYY_MM_DD_DateString: ${dateStr} is not in YYYY-MM-DD or YYYY-MM format`);
    }
    
    // Further validate the date components
    let year, month, day;
    
    if (fullDateRegex.test(dateStr)) {
        [year, month, day] = dateStr.split('-').map(part => parseInt(part, 10));
    } else {
        [year, month] = dateStr.split('-').map(part => parseInt(part, 10));
        day = 1; // Default day for YYYY-MM format
    }
    
    // Validate year
    if (year < 1000 || year > 9999) {
        throw new Error(`validateIs_YYYY_MM_DD_DateString: Invalid year: ${year}`);
    }
    
    // Validate month
    if (month < 1 || month > 12) {
        throw new Error(`validateIs_YYYY_MM_DD_DateString: Invalid month: ${month}. Must be 1-12`);
    }
    
    // Validate day if in YYYY-MM-DD format
    if (fullDateRegex.test(dateStr)) {
        // Get the last day of the month
        const lastDay = new Date(year, month, 0).getDate();
        
        if (day < 1 || day > lastDay) {
            throw new Error(`validateIs_YYYY_MM_DD_DateString: Invalid day: ${day}. Must be 1-${lastDay} for month ${month}`);
        }
    }
}

/**
 * Custom assertion function for clearer test feedback.
 * @param {*} actual - The actual value produced by the test.
 * @param {*} expected - The expected value.
 * @param {string} message - The message to display on failure.
 */
function assertEqual(actual, expected, message) {
    // Use a loose equality for Date objects which are often tricky
    if (String(actual) != String(expected)) {
        window.CONSOLE_LOG_IGNORE(`Assertion Failed: ${message}`);
        window.CONSOLE_LOG_IGNORE(`  Expected: ${expected} (type: ${typeof expected})`);
        window.CONSOLE_LOG_IGNORE(`  Actual:   ${actual} (type: ${typeof actual})`);
    }
}

/**
 * Tests for the parseFlexibleDateString function.
 */
export function test_dateUtils() {
    window.CONSOLE_LOG_IGNORE("Running dateUtils tests...");

    // Test case 1: YYYY-MM-DD
    let d1 = parseFlexibleDateString("2023-01-15");
    assertEqual(d1.getUTCFullYear(), 2023, "YYYY-MM-DD year failed");
    assertEqual(d1.getUTCMonth(), 0, "YYYY-MM-DD month failed"); // Month is 0-indexed
    assertEqual(d1.getUTCDate(), 15, "YYYY-MM-DD day failed");

    // Test case 2: YYYY-MM
    let d2 = parseFlexibleDateString("2023-02");
    assertEqual(d2.getUTCFullYear(), 2023, "YYYY-MM year failed");
    assertEqual(d2.getUTCMonth(), 1, "YYYY-MM month failed");
    assertEqual(d2.getUTCDate(), 1, "YYYY-MM day should be 1");

    // Test case 3: YYYY
    let d3 = parseFlexibleDateString("2024");
    assertEqual(d3.getUTCFullYear(), 2024, "YYYY year failed");
    assertEqual(d3.getUTCMonth(), 0, "YYYY month should be 0 (Jan)");
    assertEqual(d3.getUTCDate(), 1, "YYYY day should be 1");

    // Test case 4: "Present"
    let d4 = parseFlexibleDateString("Present");
    let now = new Date();
    assertEqual(d4.getFullYear(), now.getFullYear(), "'Present' year failed");
    assertEqual(d4.getMonth(), now.getMonth(), "'Present' month failed");

    // Test case 5: Invalid date string
    let errorThrown = false;
    try {
        parseFlexibleDateString("invalid-date");
    } catch (e) {
        errorThrown = true;
    }
    assertEqual(errorThrown, true, "Should have thrown error for invalid date");
    
    // Test case 6: Empty or whitespace string
    errorThrown = false;
    try {
        parseFlexibleDateString("   ");
    } catch (e) {
        errorThrown = true;
    }
    assertEqual(errorThrown, true, "Should have thrown error for whitespace string");

    window.CONSOLE_LOG_IGNORE("dateUtils tests finished.");
}

/**
 * Formats a date range for display, e.g., "Jan 2022 - Mar 2023".
 * @param {string | Date} start - Start date string or Date object.
 * @param {string | Date} end - End date string or Date object, can be "CURRENT_DATE".
 * @returns {string} Formatted date range string.
 */
export function formatDateRange(start, end) {
    const startDate = parseFlexibleDateString(start);
    const endDate = (end === "CURRENT_DATE" || end === "Present")
        ? new Date()
        : parseFlexibleDateString(end);

    if (!startDate) return "Invalid start date";
    if (!endDate) return "Invalid end date";

    const formatDate = (date) => {
        if ((end === "CURRENT_DATE" || end === "Present") && date.getTime() === endDate.getTime()) {
            return "Present";
        }
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short'
        });
    };

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}
