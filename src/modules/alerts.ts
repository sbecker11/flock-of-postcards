// Type definitions
type FocusableElement = HTMLElement & {
  focus(): void;
};

/**
 * Trap focus within a modal element for accessibility
 * @param element - The modal element to trap focus within
 */
function trapFocus(element: HTMLElement): void {
  const focusableElements = element.querySelectorAll<FocusableElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusableElement = focusableElements[0];
  const lastFocusableElement = focusableElements[focusableElements.length - 1];

  // If there are no focusable elements, don't do anything
  if (!firstFocusableElement) {
    return;
  }

  element.addEventListener('keydown', function(event: KeyboardEvent) {
    const isTabPressed = (event.key === 'Tab' || event.keyCode === 9);

    if (!isTabPressed) {
      return;
    }

    if (event.shiftKey) {
      // If shift key pressed for shift + tab combination
      if (document.activeElement === firstFocusableElement) {
        event.preventDefault();
        lastFocusableElement.focus(); // Move focus to the last focusable element
      }
    } else {
      // If tab key is pressed
      if (document.activeElement === lastFocusableElement) {
        event.preventDefault();
        firstFocusableElement.focus(); // Move focus to the first focusable element
      }
    }
  });

  // Set initial focus to the first focusable element
  firstFocusableElement.focus();
}

// DOM element references
const confirmModal = document.getElementById("confirm-modal") as HTMLElement | null;
const confirmOpenBtn = document.getElementById("confirm-open-btn") as HTMLElement | null;
const confirmCancelBtn = document.getElementById("confirm-cancel-btn") as HTMLElement | null;
const confirmClose = document.getElementsByClassName("confirm-close")[0] as HTMLElement | undefined;
const confirmModalTitle = document.getElementById("confirm-modal-title") as HTMLElement | null;
const CONFIRM_PAUSE_SECONDS = 2;

/**
 * Show a confirmation modal before opening a URL in a new browser window
 * @param title - The title to display in the confirmation
 * @param url - The URL to open if confirmed
 */
export function confirmOpenNewBrowserWindow(title: string, url: string): void {
  if (!confirmModal || !confirmOpenBtn || !confirmCancelBtn || !confirmClose || !confirmModalTitle) {
    console.error('Required modal elements not found');
    return;
  }

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
    }, CONFIRM_PAUSE_SECONDS * 1000);
  };

  confirmCancelBtn.onclick = function() {
    confirmModal.style.display = "none";
  };

  confirmClose.onclick = function() {
    confirmModal.style.display = "none";
  };

  window.onclick = function(event: MouseEvent) {
    if (event.target == confirmModal) {
      confirmModal.style.display = "none";
    }
  };
}
