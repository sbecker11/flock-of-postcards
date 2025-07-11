// scene/bizDetailsDivModule.mjs

// BizDetailsDiv is the div that contains the details of the job
// and will be added to the bizCard and will be added to the
// BizResumeDiv which will be added to the resume-content-div.
// BizDetailsDivs do not add themselves to a bizCardDiv or 
// a bizResumeDiv.

import * as utils from '../utils/utils.mjs';
import { formatDateRange } from '../utils/dateUtils.mjs';
import { BULLET } from '../constants/ui.mjs';
import { jobs as jobsData } from '../../static_content/jobs/jobs.mjs';
import { 
    generateNormalDistributionArray, 
    calculateMean, 
    calculateMedian, 
    calculateStandardDeviation,
    calculatePearsonMedianSkewness,
    calculateStdDevRanges
} from '../utils/statUtils.mjs';

/**
 * Creates a business resume details div
 * @param {HTMLElement} bizResumeDiv - The business resume div
 * @param {HTMLElement} bizCardDiv - The business card div
 * @returns {HTMLElement} The created business resume details div
 */
export function createBizResumeDetailsDiv(bizResumeDiv, bizCardDiv) {
    if (!bizResumeDiv) throw new Error('createBizResumeDetailsDiv: given null bizResumeDiv');
    if (!bizCardDiv) throw new Error('createBizResumeDetailsDiv: given null bizCardDiv');
    
    const colorIndex = bizResumeDiv.getAttribute('data-color-index');
    if (!utils.isNumericString(colorIndex)) throw new Error('createBizResumeDetailsDiv: given non-numeric colorIndex string');
    
    const bizResumeDetailsDiv = document.createElement('div');
    const jobNumber = bizResumeDiv.getAttribute('data-job-number');
    if (!utils.isNumericString(jobNumber)) throw new Error('createBizResumeDetailsDiv: given non-numeric attriubute string jobNumber');
    bizResumeDetailsDiv.classList.add('biz-resume-details-div');
    bizResumeDetailsDiv.id = `biz-resume-details-div-${jobNumber}`;

    // Set pointer-events to none so clicks pass through to the parent bizResumeDiv
    bizResumeDetailsDiv.style.pointerEvents = 'none';
    bizResumeDetailsDiv.style.backgroundColor = 'transparent';

    const bizCardDetailsDiv = bizCardDiv.querySelector('.biz-card-details-div');
    if (!bizCardDetailsDiv) throw new Error('createBizResumeDetailsDiv: given null bizCardDetailsDiv');
    bizResumeDetailsDiv.innerHTML = bizCardDetailsDiv.innerHTML;

    // Remove the original Z-value element from the resume div clone
    const zValueElement = bizResumeDetailsDiv.querySelector('.biz-details-z-value');
    if (zValueElement) {
        zValueElement.remove();
    }
    
    // Add the resume div's own z-value element right after the dates
    const resumeSceneZ = bizCardDiv.getAttribute('data-sceneZ') || 'N/A';
    const resumeJobNumber = bizResumeDiv.getAttribute('data-job-number');
    const resumeZValueElement = document.createElement('p');
    resumeZValueElement.className = 'biz-details-z-value header-text';
    resumeZValueElement.textContent = `(z: ${resumeSceneZ}, #: ${resumeJobNumber})`;
    
    // Insert the z-value element right after the dates element
    const datesElement = bizResumeDetailsDiv.querySelector('.biz-details-dates');
    if (datesElement) {
        datesElement.insertAdjacentElement('afterend', resumeZValueElement);
    } else {
        // Fallback: append to the end if dates element not found
        bizResumeDetailsDiv.appendChild(resumeZValueElement);
    }
    
    // Add skill badge statistics to the end of the rDiv
    const jobNumberInt = parseInt(jobNumber, 10);
    const stats = calculateSkillBadgeStats(jobNumberInt);
    
    // Create and append stats HTML to the end
    const statsHtml = `
    <div class="skill-badge-stats resume-stats">
        <h4 class="stats-header">Skill Badge Statistics</h4>
        <div class="stats-content">
            <p><strong>Total Badges:</strong> ${stats.totalBadges}</p>
            <p><strong>cDiv Center Y:</strong> ${stats.cDivCenterY}</p>
            <p><strong>Mean Position:</strong> ${stats.mean}</p>
            <p><strong>Median Position:</strong> ${stats.median}</p>
            <p><strong>Standard Deviation:</strong> ${stats.stdDev}</p>
            <p><strong>Skewness:</strong> ${stats.skewness}</p>
            <p><strong>Within 1 σ:</strong> ${stats.within1StdDev}</p>
            <p><strong>Between 1-2 σ:</strong> ${stats.between1And2StdDev}</p>
            <p><strong>Between 2-3 σ:</strong> ${stats.between2And3StdDev}</p>
            <p><strong>Beyond 3 σ:</strong> ${stats.beyond3StdDev}</p>
            <p><strong># badges above cDiv:</strong> ${stats.aboveCount}</p>
            <p><strong># badges between cDiv:</strong> ${stats.betweenCount}</p>
            <p><strong># badges below cDiv:</strong> ${stats.belowCount}</p>
            <p><strong>Above/(Above+Below):</strong> ${stats.aboveRatio}</p>
            <p><strong>Below/(Above+Below):</strong> ${stats.belowRatio}</p>
            ${stats.biasWarning ? '<p class="bias-warning"><strong>⚠️ Bias Warning:</strong> Distribution shows significant bias or skewness</p>' : ''}
        </div>
    </div>`;
    
    bizResumeDetailsDiv.insertAdjacentHTML('beforeend', statsHtml);
    
    return bizResumeDetailsDiv;
}

export function createBizCardDetailsDiv(bizCardDiv, job) {
    if (!bizCardDiv) throw new Error('createBizDetailsDiv: given null bizCardDiv');
    if (!job) throw new Error('createBizDetailsDiv: given null job');
    window.CONSOLE_LOG_IGNORE("createBizDetailsDiv: job:", job);
    const bizCardDetailsDiv = document.createElement('div');
    const jobNumber = bizCardDiv.getAttribute('data-job-number');
    if (!utils.isNumericString(jobNumber)) throw new Error(' createBizCardDetailsDiv: given non-numeric jobNumber attribute string');
    bizCardDetailsDiv.classList.add('biz-card-details-div');
    bizCardDetailsDiv.id = `biz-card-details-div-${jobNumber}`;
    
    // Set pointer-events to none so clicks pass through to the parent bizCardDiv
    bizCardDetailsDiv.style.pointerEvents = 'none';
    bizCardDetailsDiv.style.backgroundColor = 'transparent';

    // see createBizDetailsDiv::34  colorIndex format <number>
    let colorIndex = bizCardDiv.getAttribute('data-color-index');
    
    if (!utils.isNumericString(colorIndex)) {
        throw new Error('createBizDetailsDiv: given non-numeric colorIndex');
    }
    
    bizCardDetailsDiv.setAttribute("data-color-index", colorIndex);
    bizCardDetailsDiv.classList.add('color-index-foreground-only');

    const employer = job.employer || 'Unknown Employer';
    const role = job.role || 'Unknown Role';
    const start = job.start || '1970-01-01';
    const end = job.end || '1970-02-01';
    const dates = formatDateRange(start, end);
    const sceneZ = bizCardDiv.getAttribute('data-sceneZ') || 'N/A';
    const description = job.Description  || 'No description provided';
    const descriptions = description ? description.split(BULLET).filter(d => d.trim()) : [];
    const jobSkills = job['job-skills'] || {};   
    const skills = (jobSkills && typeof jobSkills === 'object' && !Array.isArray(jobSkills))
    ? Object.values(jobSkills) || []
    : [];

    bizCardDetailsDiv.innerHTML = 
    `
    <h2 class="biz-details-employer header-text">${employer}</h2>
    <h3 class="biz-details-role header-text">${role}</h3>
    <p class="biz-details-dates header-text">${dates}</p>
    <p class="biz-details-z-value header-text">(z: ${sceneZ}, #: ${jobNumber})</p>

    <div class="job-description-items-container">
        ${descriptions.map(item => `<p class="job-description-item">&bull;&nbsp;${item.trim()}</p>`).join('')}
    </div>

    <p class="biz-details-skills">
        ${skills
            .map(skill => skill.trim()) // Remove whitespace around skills
            .filter(skill => skill)     // Remove empty skills
            .join(' &bull; ')}
    </p>
    <div class="scroll-caret">▼</div>
    `; 

    return bizCardDetailsDiv;
}

// Store actual counts from connection lines
let actualCounts = {
    aboveCount: 0,
    betweenCount: 0,
    belowCount: 0
};

// Listen for actual counts from connection lines
if (typeof window !== 'undefined') {
    window.addEventListener('connection-types-counted', (event) => {
        const { jobNumber: eventJobNumber, aboveCount, betweenCount, belowCount } = event.detail;
        actualCounts = { aboveCount, betweenCount, belowCount };
        console.log(`[Stats] Received actual counts for job ${eventJobNumber}: Above=${aboveCount}, Between=${betweenCount}, Below=${belowCount}`);
        
        // Trigger unified stats recalculation for this job when we receive updated counts
        const currentSelectedCDiv = document.querySelector('.biz-card-div.selected');
        if (currentSelectedCDiv) {
            const selectedJobNumber = parseInt(currentSelectedCDiv.getAttribute('data-job-number'));
            if (selectedJobNumber === eventJobNumber) {
                console.log(`[Stats] Recalculating and updating all statistics displays for job ${eventJobNumber}`);
                recalculateAndUpdateAllStatistics(selectedJobNumber);
            }
        }
    });
}

/**
 * Recalculate statistics and update both cDiv and rDiv displays simultaneously
 * @param {number} jobNumber - The job number to recalculate and update statistics for
 */
function recalculateAndUpdateAllStatistics(jobNumber) {
    console.log(`[Stats] Recalculating all statistics for job ${jobNumber}`);
    
    // Calculate fresh statistics with the latest actual counts
    const newStats = calculateSkillBadgeStats(jobNumber);
    
    // Generate the stats HTML content
    const statsHtml = `
        <p><strong>Total Badges:</strong> ${newStats.totalBadges}</p>
        <p><strong>cDiv Center Y:</strong> ${newStats.cDivCenterY}</p>
        <p><strong>Mean Position:</strong> ${newStats.mean}</p>
        <p><strong>Median Position:</strong> ${newStats.median}</p>
        <p><strong>Standard Deviation:</strong> ${newStats.stdDev}</p>
        <p><strong>Skewness:</strong> ${newStats.skewness}</p>
        <p><strong>Within 1 σ:</strong> ${newStats.within1StdDev}</p>
        <p><strong>Between 1-2 σ:</strong> ${newStats.between1And2StdDev}</p>
        <p><strong>Between 2-3 σ:</strong> ${newStats.between2And3StdDev}</p>
        <p><strong>Beyond 3 σ:</strong> ${newStats.beyond3StdDev}</p>
        <p><strong># badges above cDiv:</strong> ${newStats.aboveCount}</p>
        <p><strong># badges between cDiv:</strong> ${newStats.betweenCount}</p>
        <p><strong># badges below cDiv:</strong> ${newStats.belowCount}</p>
        <p><strong>Above/(Above+Below):</strong> ${newStats.aboveRatio}</p>
        <p><strong>Below/(Above+Below):</strong> ${newStats.belowRatio}</p>
        ${newStats.biasWarning ? '<p class="bias-warning"><strong>⚠️ Bias Warning:</strong> Distribution shows significant bias or skewness</p>' : ''}
    `;
    
    let updateCount = 0;
    
    // Update rDiv statistics
    const rDiv = document.querySelector(`.biz-resume-div[data-job-number="${jobNumber}"]`);
    if (rDiv) {
        const rDivStatsContent = rDiv.querySelector('.skill-badge-stats.resume-stats .stats-content');
        if (rDivStatsContent) {
            rDivStatsContent.innerHTML = statsHtml;
            updateCount++;
            console.log(`[Stats] Updated rDiv statistics for job ${jobNumber}`);
        }
    }
    
    // Update cDiv statistics (could be original or clone)
    const cDiv = document.querySelector(`.biz-card-div.selected[data-job-number="${jobNumber}"]`) ||
                 document.querySelector(`.biz-card-div[data-job-number="${jobNumber}"]`);
    if (cDiv) {
        const cDivStatsContent = cDiv.querySelector('.biz-card-stats-div .skill-badge-stats .stats-content');
        if (cDivStatsContent) {
            cDivStatsContent.innerHTML = statsHtml;
            updateCount++;
            console.log(`[Stats] Updated cDiv statistics for job ${jobNumber}`);
        }
    }
    
    console.log(`[Stats] Completed unified statistics update for job ${jobNumber} - updated ${updateCount} displays`);
    console.log(`[Stats] Final counts: Above=${newStats.aboveCount}, Between=${newStats.betweenCount}, Below=${newStats.belowCount}`);
}

/**
 * Calculate skill badge statistics for a given job using statUtils
 * @param {number} jobNumber - The job number to analyze
 * @returns {Object} Statistics object with badge counts and metrics
 */
function calculateSkillBadgeStats(jobNumber) {
    // Get all skill badges for this job
    const skillMap = new Map();
    const relatedBadges = [];
    
    // Collect all unique skills across all jobs (similar to SkillBadges.vue logic)
    jobsData.forEach((job, jobIndex) => {
        const jobSkills = job['job-skills'] || {};
        const skillEntries = Object.entries(jobSkills);
        
        skillEntries.forEach(([, skillName]) => {
            if (!skillMap.has(skillName)) {
                skillMap.set(skillName, {
                    name: skillName,
                    jobNumbers: [jobIndex],
                    primaryJobNumber: jobIndex
                });
            } else {
                const existingSkill = skillMap.get(skillName);
                if (!existingSkill.jobNumbers.includes(jobIndex)) {
                    existingSkill.jobNumbers.push(jobIndex);
                }
            }
        });
    });
    
    // Filter badges related to the selected job
    skillMap.forEach((skill) => {
        if (skill.jobNumbers.includes(jobNumber)) {
            relatedBadges.push(skill);
        }
    });
    
    const totalBadges = relatedBadges.length;
    if (totalBadges === 0) {
        return {
            totalBadges: 0,
            mean: '0.0',
            median: '0.0',
            stdDev: '0.0',
            skewness: '0.000',
            within1StdDev: 0,
            between1And2StdDev: 0,
            between2And3StdDev: 0,
            beyond3StdDev: 0,
            aboveRatio: '0.000',
            belowRatio: '0.000',
            biasWarning: false
        };
    }
    
    // Get actual badge positions from the DOM for badges related to this job only
    const badgePositions = [];
    const skillBadges = document.querySelectorAll('.skill-badge');
    
    // Filter for badges related to this job and get their actual positions
    skillBadges.forEach((badge) => {
        // Check if this badge is related to the job (not dimmed)
        const isDimmed = badge.style.filter && badge.style.filter.includes('brightness(0.5)');
        if (!isDimmed) {
            // Additional check: verify this badge belongs to the selected job
            const badgeText = badge.textContent.trim();
            const isRelatedToJob = relatedBadges.some(relatedBadge => relatedBadge.name === badgeText);
            
            if (isRelatedToJob) {
                const topValue = badge.style.top;
                if (topValue && topValue !== '0px') {
                    const yPosition = parseFloat(topValue);
                    const badgeCenterY = yPosition + 20; // Add half badge height (40px / 2)
                    badgePositions.push(badgeCenterY);
                }
            }
        }
    });
    
    // Validate actual positions
    if (!badgePositions || badgePositions.length === 0) {
        console.warn(`No actual badge positions found for job ${jobNumber}, using simulated data`);
        // Fallback to simulated data if DOM positions not available
        const simulatedPositions = generateNormalDistributionArray(totalBadges, 500, 100);
        badgePositions.push(...simulatedPositions);
    }
    
    // Calculate comprehensive statistics using statUtils with proper null checks
    const mean = calculateMean(badgePositions) || 0;
    const median = calculateMedian(badgePositions) || 0;
    const stdDev = calculateStandardDeviation(badgePositions) || 0;
    const skewness = calculatePearsonMedianSkewness(badgePositions) || 0;
    const ranges = calculateStdDevRanges(badgePositions, mean, stdDev);
    
    // Get actual cDiv position using the same logic as NewConnectionLines.vue
    let cDivTop = 500; // Default fallback
    let cDivBottom = 550;
    let cDivCenter = 525;
    
    // Try to get the actual selected cDiv position using same method as connection lines
    const selectedCDiv = document.querySelector('.biz-card-div.selected') || 
                         document.querySelector(`[data-job-number="${jobNumber}"]`);
    if (selectedCDiv) {
        const sceneContent = document.getElementById('scene-content');
        if (sceneContent) {
            const cDivRect = selectedCDiv.getBoundingClientRect();
            const sceneRect = sceneContent.getBoundingClientRect();
            const scrollTop = sceneContent.scrollTop;
            const scrollLeft = sceneContent.scrollLeft;
            
            // Use same calculation as NewConnectionLines.vue getElementPosition()
            const cDivPosY = (cDivRect.top - sceneRect.top + scrollTop);
            cDivTop = cDivPosY;
            cDivBottom = cDivPosY + cDivRect.height;
            cDivCenter = cDivTop + (cDivRect.height / 2);
        }
    }
    
    // Use actual counts from connection lines if available, otherwise calculate
    let aboveCount = actualCounts.aboveCount; // Above cDiv
    let betweenCount = actualCounts.betweenCount; // Between/within cDiv
    let belowCount = actualCounts.belowCount; // Below cDiv
    
    // If no actual counts available, fall back to calculation (shouldn't happen with connections)
    if (aboveCount === 0 && betweenCount === 0 && belowCount === 0 && badgePositions.length > 0) {
        console.log(`[Stats] No actual counts available, calculating from positions`);
        badgePositions.forEach(pos => {
            if (pos < cDivTop) {
                aboveCount++;
            } else if (pos > cDivBottom) {
                belowCount++;
            } else {
                betweenCount++;
            }
        });
    }
    
    // Debug logging for distribution
    console.log(`[Stats Debug] Job ${jobNumber}: Using counts - Above:${aboveCount}, Between:${betweenCount}, Below:${belowCount} (from ${actualCounts.aboveCount || actualCounts.betweenCount || actualCounts.belowCount ? 'connection lines' : 'calculation'})`);
    
    // Calculate geometric ratios with safety checks
    const aboveBelowSum = aboveCount + belowCount;
    // If no Above or Below badges exist, both ratios should be 0
    const geometricAbove = (aboveBelowSum > 0) ? (aboveCount / aboveBelowSum) : 0;
    const geometricBelow = (aboveBelowSum > 0) ? (belowCount / aboveBelowSum) : 0;
    
    console.log(`[Stats Debug] Job ${jobNumber}: aboveBelowSum=${aboveBelowSum}, geometricAbove=${geometricAbove.toFixed(3)}, geometricBelow=${geometricBelow.toFixed(3)}`);
    
    // Bias warning based on skewness and distribution with safety checks
    const biasWarning = (Math.abs(skewness) > 0.5) || (Math.abs(geometricAbove - 0.5) > 0.3);
    
    // Safe formatting with null checks
    const formatSafe = (value, decimals = 1) => {
        if (value === null || value === undefined || isNaN(value)) {
            return '0.'.padEnd(decimals + 2, '0');
        }
        return Number(value).toFixed(decimals);
    };
    
    return {
        totalBadges,
        cDivCenterY: formatSafe(cDivCenter, 1),
        mean: formatSafe(mean, 1),
        median: formatSafe(median, 1),
        stdDev: formatSafe(stdDev, 1),
        skewness: formatSafe(skewness, 3),
        within1StdDev: ranges.within1StdDev || 0,
        between1And2StdDev: ranges.between1And2StdDev || 0,
        between2And3StdDev: ranges.between2And3StdDev || 0,
        beyond3StdDev: ranges.beyond3StdDev || 0,
        aboveCount,
        betweenCount,
        belowCount,
        aboveRatio: formatSafe(geometricAbove, 3),
        belowRatio: formatSafe(geometricBelow, 3),
        biasWarning
    };
}

/**
 * Create and position a separate bizCardStatsDiv with skill badge statistics
 * @param {HTMLElement} bizCardDiv - The main bizCard div
 * @param {number} jobNumber - The job number for statistics
 * @returns {HTMLElement} The created bizCardStatsDiv
 */
export function createBizCardStatsDiv(bizCardDiv, jobNumber) {
    if (!bizCardDiv) return null;
    
    const stats = calculateSkillBadgeStats(jobNumber);
    
    // Create the stats div
    const bizCardStatsDiv = document.createElement('div');
    bizCardStatsDiv.classList.add('biz-card-stats-div');
    bizCardStatsDiv.id = `biz-card-stats-div-${jobNumber}`;
    
    // Set positioning and styling
    bizCardStatsDiv.style.position = 'absolute';
    bizCardStatsDiv.style.width = 'calc(100% - 20px)'; // Full width minus padding
    bizCardStatsDiv.style.left = '10px';
    bizCardStatsDiv.style.padding = '10px';
    bizCardStatsDiv.style.pointerEvents = 'none'; // Allow clicks to pass through
    
    // Position below the header elements (employer, role, dates, z-value)
    // Since we know the structure, we can use a fixed offset
    bizCardStatsDiv.style.top = '110px'; // Position after the header elements
    
    // Create statistics HTML
    bizCardStatsDiv.innerHTML = `
    <div class="skill-badge-stats">
        <h4 class="stats-header">Skill Badge Statistics</h4>
        <div class="stats-content">
            <p><strong>Total Badges:</strong> ${stats.totalBadges}</p>
            <p><strong>cDiv Center Y:</strong> ${stats.cDivCenterY}</p>
            <p><strong>Mean Position:</strong> ${stats.mean}</p>
            <p><strong>Median Position:</strong> ${stats.median}</p>
            <p><strong>Standard Deviation:</strong> ${stats.stdDev}</p>
            <p><strong>Skewness:</strong> ${stats.skewness}</p>
            <p><strong>Within 1 σ:</strong> ${stats.within1StdDev}</p>
            <p><strong>Between 1-2 σ:</strong> ${stats.between1And2StdDev}</p>
            <p><strong>Between 2-3 σ:</strong> ${stats.between2And3StdDev}</p>
            <p><strong>Beyond 3 σ:</strong> ${stats.beyond3StdDev}</p>
            <p><strong># badges above cDiv:</strong> ${stats.aboveCount}</p>
            <p><strong># badges between cDiv:</strong> ${stats.betweenCount}</p>
            <p><strong># badges below cDiv:</strong> ${stats.belowCount}</p>
            <p><strong>Above/(Above+Below):</strong> ${stats.aboveRatio}</p>
            <p><strong>Below/(Above+Below):</strong> ${stats.belowRatio}</p>
            ${stats.biasWarning ? '<p class="bias-warning"><strong>⚠️ Bias Warning:</strong> Distribution shows significant bias or skewness</p>' : ''}
        </div>
    </div>`;
    
    return bizCardStatsDiv;
}

/**
 * Update bizCardDetailsDiv with skill badge statistics (legacy function - now creates separate div)
 * @param {HTMLElement} bizCardDetailsDiv - The details div to update
 * @param {number} jobNumber - The job number for statistics
 */
export function appendSkillBadgeStats(bizCardDetailsDiv, jobNumber) {
    if (!bizCardDetailsDiv) return;
    
    // Get the parent bizCardDiv
    const bizCardDiv = bizCardDetailsDiv.closest('.biz-card-div');
    if (!bizCardDiv) return;
    
    // Remove existing stats div if it exists
    const existingStatsDiv = bizCardDiv.querySelector('.biz-card-stats-div');
    if (existingStatsDiv) {
        existingStatsDiv.remove();
    }
    
    // Create new stats div
    const bizCardStatsDiv = createBizCardStatsDiv(bizCardDiv, jobNumber);
    if (bizCardStatsDiv) {
        bizCardDiv.appendChild(bizCardStatsDiv);
    }
}


