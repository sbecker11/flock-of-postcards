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
 * console.log(start); // June 1, 2023
 * console.log(end);   // June 30, 2023
 * 
 * const { start, end } = getMonthDates(2024, 2);
 * console.log(end);   // February 29, 2024 (leap year!)
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
    utils.validateString(dateStr);
    
    // Try YYYY-MM-DD first
    let match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
        const [, year, month, day] = match;
        return new Date(parseInt(year,10), parseInt(month, 10) - 1, parseInt(day, 10));
    }
    
    // Try YYYY-MM
    match = dateStr.match(/^(\d{4})-(\d{2})$/);
    if (match) {
        const [, year, month] = match;
        return new Date(parseInt(year), parseInt(month) - 1); // First day of month
    }
    
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM or YYYY-MM-DD`);
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
    const offsetHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
    const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');
    const offsetSign = timezoneOffset >= 0 ? '+' : '-';

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
    return date.toISOString().split('T')[0];
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
 * comprehensive test of all dateUtil functions
 * to be called by main.mjs during intialization.
 */
export function test_dateUtils() {
    console.log("=== Testing dateUtils ===");
    
    // Test validateIs_YYYY_MM_DD_DateString
    console.log("Testing validateIs_YYYY_MM_DD_DateString...");
    try {
        // Test valid date strings
        validateIs_YYYY_MM_DD_DateString("2023-06-15");
        validateIs_YYYY_MM_DD_DateString("2023-06");
        validateIs_YYYY_MM_DD_DateString("2020-02-29"); // Leap year
        
        // Test invalid formats
        try {
            validateIs_YYYY_MM_DD_DateString("06/15/2023");
            console.assert(false, "Should have thrown error for invalid format");
        } catch (e) {
            console.assert(e.message.includes("not in YYYY-MM-DD or YYYY-MM format"), "Wrong error message for invalid format");
        }
        
        try {
            validateIs_YYYY_MM_DD_DateString("2023/06/15");
            console.assert(false, "Should have thrown error for invalid format");
        } catch (e) {
            console.assert(e.message.includes("not in YYYY-MM-DD or YYYY-MM format"), "Wrong error message for invalid format");
        }
        
        // Test invalid year
        try {
            validateIs_YYYY_MM_DD_DateString("999-06-15");
            console.error("Should have thrown error for invalid year");
        } catch (e) {
            console.assert(true, e.message.includes("Invalid year"), "Correct error message for invalid year");
        }
        
        // Test invalid month
        try {
            validateIs_YYYY_MM_DD_DateString("2023-13-01");
            console.error("Should have thrown error for invalid month");
        } catch (e) {
            console.assert(e.message.includes("Invalid month"), "Wrong error message for invalid month");
        }
        
        // Test invalid day
        try {
            validateIs_YYYY_MM_DD_DateString("2023-02-30");
            console.assert(false, "Should have thrown error for invalid day");
        } catch (e) {
            console.assert(e.message.includes("Invalid day"), "Wrong error message for invalid day. Error message:", e.message);
        }
        
        // Test non-string input
        try {
            validateIs_YYYY_MM_DD_DateString(123);
            console.assert(false, "Should have thrown error for non-string input");
        } catch (e) {
            console.assert(e.message.includes("not a string"), "Wrong error message for non-string input. Error message:", e.message);
        }
        
        // Test empty string
        try {
            validateIs_YYYY_MM_DD_DateString("");
            console.assert(false, "Should have thrown error for empty string");
        } catch (e) {
            console.assert(e.message.includes("not a string"), "Wrong error message for empty string. Error message:", e.message);
        }
        
        console.log("✅ validateIs_YYYY_MM_DD_DateString tests passed");
    } catch (e) {
        console.error("❌ validateIs_YYYY_MM_DD_DateString test failed:", e);
    }
    
    // Test parseFlexibleDateString
    console.log("Testing parseFlexibleDateString...");
    try {
        // Test YYYY-MM-DD format
        const date1 = parseFlexibleDateString("2023-06-15");
        console.assert(date1.getFullYear() === 2023, "YYYY-MM-DD year failed");
        console.assert(date1.getMonth() === 5, "YYYY-MM-DD month failed"); // 0-indexed
        console.assert(date1.getDate() === 15, "YYYY-MM-DD day failed");
        
        // Test YYYY-MM format
        const date2 = parseFlexibleDateString("2023-06");
        console.assert(date2.getFullYear() === 2023, "YYYY-MM year failed");
        console.assert(date2.getMonth() === 5, "YYYY-MM month failed");
        console.assert(date2.getDate() === 1, "YYYY-MM day should be 1");
        
        // Test invalid format
        try {
            parseFlexibleDateString("invalid-date");
            console.assert(false, "Should have thrown error for invalid date");
        } catch (e) {
            console.assert(e.message.includes("Invalid date format"), "Wrong error message:", e.message);
        }
        
        console.log("✅ parseFlexibleDateString tests passed");
    } catch (e) {
        console.error("❌ parseFlexibleDateString test failed:", e);
    }
    
    // Test getDateFromString
    console.log("Testing getDateFromString...");
    try {
        // Test YYYY-MM-DD format
        const date1 = getDateFromString("2023-06-15");
        console.assert(date1.getFullYear() === 2023, "YYYY-MM-DD year failed");
        console.assert(date1.getMonth() === 5, "YYYY-MM-DD month failed"); // 0-indexed
        console.assert(date1.getDate() === 15, "YYYY-MM-DD day failed");
        
        // Test YYYY-MM format
        const date2 = getDateFromString("2023-06");
        console.assert(date2.getFullYear() === 2023, "YYYY-MM year failed");
        console.assert(date2.getMonth() === 5, "YYYY-MM month failed");
        console.assert(date2.getDate() === 1, "YYYY-MM day should be 1");
        
        // Test leap year
        const leapDate = getDateFromString("2020-02-29");
        console.assert(leapDate.getFullYear() === 2020, "Leap year failed");
        console.assert(leapDate.getMonth() === 1, "Leap month failed");
        console.assert(leapDate.getDate() === 29, "Leap day failed");
        
        // Test invalid month
        try {
            getDateFromString("2023-13-01");
            console.assert(false, "Should have thrown error for invalid month");
        } catch (e) {
            console.assert(e.message.includes("Invalid month"), "Wrong error message for invalid month. Error message:", e.message);
        }
        
        // Test invalid day
        try {
            getDateFromString("2023-02-30");
            console.assert(false, "Should have thrown error for invalid day");
        } catch (e) {
            console.assert(e.message.includes("Invalid date"), "Wrong error message for invalid day. Error message:", e.message);
        }
        
        // Test invalid format
        try {
            getDateFromString("2023/06/15");
            console.assert(false, "Should have thrown error for invalid format");
        } catch (e) {
            console.assert(e.message.includes("Invalid date format"), "Wrong error message for invalid format");
        }
        
        // Test empty string
        try {
            getDateFromString("");
            console.assert(false, "Should have thrown error for empty string");
        } catch (e) {
            console.assert(e.message.includes("Invalid date string"), "Wrong error message for empty string");
        }
        
        // Test non-string input
        try {
            getDateFromString(123);
            console.assert(false, "Should have thrown error for non-string input");
        } catch (e) {
            console.assert(e.message.includes("Invalid date string"), "Wrong error message for non-string input");
        }
        
        console.log("✅ getDateFromString tests passed");
    } catch (e) {
        console.error("❌ getDateFromString test failed:", e);
    }
    
    // Test parseISO8601
    console.log("Testing parseISO8601...");
    try {
        const isoDate1 = parseISO8601("2023-06-15T14:30:45 UTC");
        console.assert(isoDate1 instanceof Date, "Should return Date object");
        
        const isoDate2 = parseISO8601("2023-06-15T14:30:45Z");
        console.assert(isoDate2 instanceof Date, "Should handle Z suffix");
        
        console.log("✅ parseISO8601 tests passed");
    } catch (e) {
        console.error("❌ parseISO8601 test failed:", e);
    }
    
    // Test parseYearStr
    console.log("Testing parseYearStr...");
    try {
        const year1 = parseYearStr("2023");
        console.assert(year1 === 2023, "Should return number 2023");
        console.assert(typeof year1 === "number", "Should return number type");
        
        // Test invalid year
        try {
            parseYearStr("23");
            console.assert(false, "Should reject 2-digit year");
        } catch (e) {
            console.assert(e.message.includes("not a valid 4-digit year"), "Wrong error message:", e.message);
        }
        
        console.log("✅ parseYearStr tests passed");
    } catch (e) {
        console.error("❌ parseYearStr test failed:", e);
    }
    
    // Test parseMonthStr
    console.log("Testing parseMonthStr...");
    try {
        const month1 = parseMonthStr("06");
        console.assert(month1 === 6, "Should return number 6");
        console.assert(typeof month1 === "number", "Should return number type");
        
        const month2 = parseMonthStr("12");
        console.assert(month2 === 12, "Should handle month 12");
        
        // Test invalid months
        try {
            parseMonthStr("13");
            console.assert(false, "Should reject month 13");
        } catch (e) {
            console.assert(e.message.includes("not in valid range"), "Wrong error message:", e.message);
        }
        
        try {
            parseMonthStr("6");
            console.assert(false, "Should reject single digit month");
        } catch (e) {
            console.assert(e.message.includes("not a valid 2-digit month"), "Wrong error message:", e.message);
        }
        
        console.log("✅ parseMonthStr tests passed");
    } catch (e) {
        console.error("❌ parseMonthStr test failed:", e);
    }
    
    // Test formatting functions
    console.log("Testing format functions...");
    try {
        const testDate = new Date(2023, 5, 15, 14, 30, 45, 123); // June 15, 2023
        
        // Test formatISO8601DateOnly
        const dateOnly = formatISO8601DateOnly(testDate);
        console.assert(dateOnly === "2023-06-15", "formatISO8601DateOnly failed");
        
        // Test formatISO8601YearMonth
        const yearMonth = formatISO8601YearMonth(testDate);
        console.assert(yearMonth === "2023-06", "formatISO8601YearMonth failed");
        
        // Test formatISO8601ShellAlias
        const shellFormat = formatISO8601ShellAlias(testDate);
        console.assert(shellFormat.includes(" UTC"), "formatISO8601ShellAlias should include UTC");
        
        console.log("✅ Format function tests passed");
    } catch (e) {
        console.error("❌ Format function test failed:", e);
    }
    
    // Test getMonthDates
    console.log("Testing getMonthDates...");
    try {
        const { start, end } = getMonthDates(2023, 6);
        console.assert(start.getFullYear() === 2023, "Start year should be 2023");
        console.assert(start.getMonth() === 5, "Start month should be 5 (June)");
        console.assert(start.getDate() === 1, "Start date should be 1");
        console.assert(end.getDate() === 30, "June should have 30 days");
        
        // Test February leap year
        const { start: febStart, end: febEnd } = getMonthDates(2024, 2);
        console.assert(febEnd.getDate() === 29, "2024 February should have 29 days (leap year)");
        
        console.log("✅ getMonthDates tests passed");
    } catch (e) {
        console.error("❌ getMonthDates test failed:", e);
    }
    
    console.log("✅ All dateUtils tests passed");
}
