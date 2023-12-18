// @ts-nocheck
export function textListAlert(newlineDelimitedString) {
    const alertBox = document.getElementById('textListAlert');
    const overlay = document.getElementById('overlay');

    // Clear previous content
    alertBox.innerHTML = '';

    // Create and append the textarea
    const textarea = document.createElement('textarea');
    textarea.classList.add('textarea-alert');
    textarea.readOnly = false;
    textarea.disabled = false;
    textarea.value = newlineDelimitedString;
    alertBox.appendChild(textarea);

    // Show the alert box and overlay
    alertBox.style.display = 'block';
    overlay.style.display = 'block';

    // Hide on overlay click
    overlay.onclick = function() {
        alertBox.style.display = 'none';
        overlay.style.display = 'none';
    };

    // Add hover and mouse enter event listeners
    alertBox.onmouseenter = alertBox.onmouseover = function(event) {
        event.stopPropagation();
        event.preventDefault();
        // Additional logic for hover or mouse enter can be added here
    };
}
