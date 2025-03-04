// @ts-nocheck

// Function to trap focus within the modal
function trapFocus(element) {
    const focusableElements = element.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];

    // If there are no focusable elements, don't do anything
    if (!firstFocusableElement) {
        return;
    }

    element.addEventListener('keydown', function(event) {
        const isTabPressed = (event.key === 'Tab' || event.keyCode === 9);

        if (!isTabPressed) {
            return;
        }

        if (event.shiftKey) { // if shift key pressed for shift + tab combination
            if (document.activeElement === firstFocusableElement) {
                event.preventDefault();
                lastFocusableElement.focus(); // move focus to the last focusable element
            }
        } else { // if tab key is pressed
            if (document.activeElement === lastFocusableElement) { // if focused has reached to last focusable element
                event.preventDefault();
                firstFocusableElement.focus(); // move focus to the first focusable element
            }
        }
    });

    // Set initial focus to the first focusable element
    firstFocusableElement.focus();
}

let confirmModal = document.getElementById("confirm-modal");
let confirmOpenBtn = document.getElementById("confirm-open-btn");
let confirmCancelBtn = document.getElementById("confirm-cancel-btn");
let confirmClose = document.getElementsByClassName("confirm-close")[0];
let confirmModalTitle = document.getElementById("confirm-modal-title");
let CONFIRM_PAUSE_SECONDS = 2;

export function confirmOpenNewBrowserWindow(title, url) {

    confirmModalTitle.innerHTML = `Do you want to open ${title} in a new window?`;
    confirmModal.style.display = "block";
    confirmOpenBtn.style.display = "block";
    confirmCancelBtn.style.display = "block";

    confirmOpenBtn.onclick = function() {
        confirmOpenBtn.style.display = "none";
        confirmCancelBtn.style.display = "none";
        confirmModalTitle.innerHTML = `Opening ${title} in a new window...`;

        setTimeout(function() {
            window.open(url, '_blank');
            confirmModal.style.display = "none";
        }, CONFIRM_PAUSE_SECONDS * 1000); // replace N with the number of seconds you want to pause
    }

    confirmCancelBtn.onclick = function() {
        confirmModal.style.display = "none";
    }

    confirmClose.onclick = function() {
        confirmModal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == confirmModal) {
            confirmModal.style.display = "none";
        }
    }
}