// @ts-nocheck
// welcomeAlert.mjs
export function showWelcomeAlert() {
    let welcomeAlert = document.getElementById('welcomeAlert');
    welcomeAlert.style.display = 'block';

    // Stop propagation of all events when the modal is open, except for the close button
    welcomeAlert.addEventListener('click', function(event) {
        if (event.target.id !== 'close') {
            event.stopPropagation();
        }
    }, true); // Use capture phase to stop all events

    // Attach event listener to the close button
    document.getElementById('close').addEventListener('click', closeWelcomeAlert);
}

export function closeWelcomeAlert() {
    console.log('closeWelcomeAlert()');
    let welcomeAlert = document.getElementById('welcomeAlert');
    welcomeAlert.style.display = 'none';

    let selectAllBizcards = document.getElementById('select-all-bizcards');
    selectAllBizcards.click();
}
