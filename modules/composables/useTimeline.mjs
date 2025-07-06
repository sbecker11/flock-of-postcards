import { ref, computed } from 'vue';
import * as dateUtils from '@/modules/utils/dateUtils.mjs';

// --- Constants ---
const YEAR_HEIGHT = 200; // The height in pixels for one year on the timeline
const TIMELINE_PADDING_TOP = 0; // No top padding - scene plane will handle alignment

// --- Reactive State (Singleton) ---
const isInitialized = ref(false);
const startYear = ref(0);
const endYear = ref(0);
const timelineHeight = ref(0);

// --- Initialization Function ---
function initialize(jobsData) {
    if (isInitialized.value) return; // Already initialized
    if (!jobsData) {
        window.CONSOLE_LOG_IGNORE("Timeline initialization failed: jobsData not provided.");
        return;
    }

    const { minYear, maxYear } = dateUtils.getMinMaxYears(jobsData);
    startYear.value = minYear;
    endYear.value = maxYear;

    const yearCount = maxYear - minYear + 1;
    timelineHeight.value = (yearCount * YEAR_HEIGHT) + TIMELINE_PADDING_TOP;
    isInitialized.value = true;
    window.CONSOLE_LOG_IGNORE(`Timeline initialized: ${startYear.value} - ${endYear.value}`);
}

// --- Composable ---
function useTimeline() {
    const years = computed(() => {
        if (!isInitialized.value) return [];
        const yearArray = [];
        for (let year = endYear.value; year >= startYear.value; year--) {
            yearArray.push({
                year: year,
                y: (endYear.value - year) * YEAR_HEIGHT + TIMELINE_PADDING_TOP + 50 // Add 50px to align with scene plane padding
            });
        }
        return yearArray;
    });

    function getPositionForDate(date) {
        if (!isInitialized.value) {
            window.CONSOLE_LOG_IGNORE("getPositionForDate called before timeline was initialized.");
            return 0;
        }
        if (!date) return 0;

        const year = date.getFullYear();
        const month = date.getMonth(); // 0-11
        const day = date.getDate();

        const yearFraction = month / 12 + day / 365.25 / 12; // Corrected day fraction
        const totalYearsFromStart = (year + yearFraction) - startYear.value;

        // The timeline's visual origin (y=0) is at the TOP.
        // The earliest year (startYear) will be at the bottom, and the latest year (endYear) will be at the top.
        // So, a later date should have a SMALLER y-value.
        // We calculate position from the end date downwards.
        const totalTimelineYears = endYear.value - startYear.value;
        const yearsFromEnd = totalTimelineYears - totalYearsFromStart;
        
        const yPosition = (yearsFromEnd * YEAR_HEIGHT) + TIMELINE_PADDING_TOP + 50; // Add 50px to align with scene plane padding

        return yPosition;
    }


    return {
        isInitialized: computed(() => isInitialized.value),
        startYear: computed(() => startYear.value),
        endYear: computed(() => endYear.value),
        timelineHeight: computed(() => timelineHeight.value),
        years,
        getPositionForDate,
    };
}

export { initialize, useTimeline }; 