let timeoutId;
let isMouseMoving = false;
let canvasElement;
let yourMouseMoveHandler;
let callOnStart;
let callOnFinish;

export function startCapturingMouseMovement(canvas, yourHandler, signalStart, signalFinish) {
    if (!isMouseMoving) {
        isMouseMoving = true;
        console.assert(canvas != null);
        canvasElement = canvas;
        console.assert(yourHandler != null);
        yourMouseMoveHandler = yourHandler;
        callOnStart = signalStart;
        callOnFinish = signalFinish;

        callOnStart();
        canvasElement.addEventListener('mousemove', handleMouseMove);
    }

    clearTimeout(timeoutId);
    timeoutId = setTimeout(stopCapturingMouseMovement, 100); // Change the delay as per your requirement
}

function stopCapturingMouseMovement() {
    isMouseMoving = false;
    canvasElement.removeEventListener('mousemove', handleMouseMove);
    callOnFinish();
}

function handleMouseMove(event) {
    let mouseX = event.clientX;
    let mouseY = event.clientY;
    yourMouseMoveHandler(mouseX, mouseY);
    clearTimeout(timeoutId);
    timeoutId = setTimeout(stopCapturingMouseMovement, 100); // Change the delay as per your requirement
}
