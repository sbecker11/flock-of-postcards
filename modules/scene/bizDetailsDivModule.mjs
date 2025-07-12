// scene/bizDetailsDivModule.mjs

// BizDetailsDiv is the div that contains the details of the job
// and will be added to the bizCard and will be added to the
// BizResumeDiv which will be added to the resume-content-div.
// BizDetailsDivs do not add themselves to a bizCardDiv or 
// a bizResumeDiv.

import * as utils from '../utils/utils.mjs';
import { formatDateRange } from '../utils/dateUtils.mjs';
import { badgeManager } from '../core/badgeManager.mjs';
import { BULLET } from '../constants/ui.mjs';
import { jobs as jobsData } from '../../static_content/jobs/jobs.mjs';

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
    const stats = badgeManager.calculateSkillBadgeStats(jobNumberInt);
    
    // Create and append stats HTML to the end
    const statsHtml = `
    <div class="skill-badge-stats resume-stats hidden-by-mode">
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
    
    // Apply BadgeManager state to the newly created stats element
    const newStatsElement = bizResumeDetailsDiv.querySelector('.skill-badge-stats.resume-stats:last-child');
    if (newStatsElement) {
        badgeManager.updateStatsElement(newStatsElement);
    }
    
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
    const newStats = badgeManager.calculateSkillBadgeStats(jobNumber);
    
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
 * Create and position a separate bizCardStatsDiv with skill badge statistics
 * @param {HTMLElement} bizCardDiv - The main bizCard div
 * @param {number} jobNumber - The job number for statistics
 * @returns {HTMLElement} The created bizCardStatsDiv
 */
export function createBizCardStatsDiv(bizCardDiv, jobNumber) {
    if (!bizCardDiv) return null;
    
    const stats = badgeManager.calculateSkillBadgeStats(jobNumber);
    
    // Create the stats div container
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
    <div class="skill-badge-stats hidden-by-mode">
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
    
    // Apply initial visibility state based on BadgeManager
    badgeManager.updateStatsElement(bizCardStatsDiv);
    
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


