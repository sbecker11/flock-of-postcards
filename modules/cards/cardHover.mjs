/**
 * Sets up hover synchronization between card and resume divs
 */

// Function to apply hover effect
function applyHoverEffect(element) {
    if (!element) return;
    element.style.filter = 'brightness(120%)';
    element.style.transform = 'scale(1.02)';
    element.style.zIndex = '5';
}

// Function to remove hover effect
function removeHoverEffect(element) {
    if (!element) return;
    element.style.filter = '';
    element.style.transform = '';
    element.style.zIndex = '4';
}

// Function to find matching resume div
function findMatchingResumeDiv(cardDiv) {
    const jobIndex = cardDiv.getAttribute('sort-key-job-index');
    if (!jobIndex) {
        // console.log('No job index found on card div:', cardDiv);
        return null;
    }
    
    const resumeDiv = Array.from(document.querySelectorAll('.biz-resume-div')).find(
        resumeDiv => resumeDiv.getAttribute('sort-key-job-index') === jobIndex
    );
    
    // if (!resumeDiv) {
    //     console.log('No matching resume found for job index:', jobIndex);
    // } else {
    //     console.log('Found matching resume for job index:', jobIndex);
    // }
    
    return resumeDiv;
}

// Function to find matching card div
function findMatchingCardDiv(resumeDiv) {
    const jobIndex = resumeDiv.getAttribute('sort-key-job-index');
    if (!jobIndex) {
        // console.log('No job index found on resume div:', resumeDiv);
        return null;
    }
    
    const cardDiv = Array.from(document.querySelectorAll('.biz-card-div')).find(
        cardDiv => cardDiv.getAttribute('sort-key-job-index') === jobIndex
    );
    
    // if (!cardDiv) {
    //     console.log('No matching card found for job index:', jobIndex);
    // } else {
    //     console.log('Found matching card for job index:', jobIndex);
    // }
    
    return cardDiv;
}

// Function to setup hover handlers for a card div
function setupCardHover(cardDiv) {
    cardDiv.addEventListener('mouseenter', () => {
        // console.log('Card mouseenter:', cardDiv.getAttribute('sort-key-job-index'));
        applyHoverEffect(cardDiv);
        const matchingResume = findMatchingResumeDiv(cardDiv);
        if (matchingResume) {
            applyHoverEffect(matchingResume);
        }
    });

    cardDiv.addEventListener('mouseleave', () => {
        // console.log('Card mouseleave:', cardDiv.getAttribute('sort-key-job-index'));
        removeHoverEffect(cardDiv);
        const matchingResume = findMatchingResumeDiv(cardDiv);
        if (matchingResume) {
            removeHoverEffect(matchingResume);
        }
    });
}

// Function to setup hover handlers for a resume div
function setupResumeHover(resumeDiv) {
    resumeDiv.addEventListener('mouseenter', () => {
        // console.log('Resume mouseenter:', resumeDiv.getAttribute('sort-key-job-index'));
        applyHoverEffect(resumeDiv);
        const matchingCard = findMatchingCardDiv(resumeDiv);
        if (matchingCard) {
            applyHoverEffect(matchingCard);
        }
    });

    resumeDiv.addEventListener('mouseleave', () => {
        // console.log('Resume mouseleave:', resumeDiv.getAttribute('sort-key-job-index'));
        removeHoverEffect(resumeDiv);
        const matchingCard = findMatchingCardDiv(resumeDiv);
        if (matchingCard) {
            removeHoverEffect(matchingCard);
        }
    });
}

export function setupHoverSync() {
    // Setup hover for existing cards
    const cards = document.querySelectorAll('.biz-card-div');
    // console.log('Setting up hover for', cards.length, 'cards');
    cards.forEach(setupCardHover);

    // Setup hover for existing resumes
    const resumes = document.querySelectorAll('.biz-resume-div');
    // console.log('Setting up hover for', resumes.length, 'resumes');
    resumes.forEach(setupResumeHover);

    // Setup mutation observer to handle dynamically added resume divs
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.classList && node.classList.contains('biz-resume-div')) {
                    // console.log('New resume div added:', node.getAttribute('sort-key-job-index'));
                    setupResumeHover(node);
                }
            });
        });
    });

    // Start observing the resume content div for added resume divs
    const resumeContentDiv = document.getElementById('resume-content-div');
    if (resumeContentDiv) {
        observer.observe(resumeContentDiv, { childList: true });
        // console.log('Observing resume-content-div for new resumes');
    }

    // Handle skill cards hover effects
    const skillCards = document.querySelectorAll('.skill-card-div');
    skillCards.forEach(skillCard => {
        skillCard.addEventListener('mouseenter', () => {
            skillCard.style.filter = 'brightness(150%)';
        });

        skillCard.addEventListener('mouseleave', () => {
            skillCard.style.filter = '';
        });
    });
} 