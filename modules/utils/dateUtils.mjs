// modules/utils/dateUtils.mjs

import { Logger, LogLevel } from '../logger.mjs';
const logger = new Logger("dateUtils", LogLevel.INFO);

export const getMonthDates = (year, month) => ({ start: new Date(year, month - 1, 1), end: new Date(year, month, 0) });
export const getIsoDateString = (date) => date.toISOString().slice(0, 10);
