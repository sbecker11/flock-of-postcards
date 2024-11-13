function checkBrowserSupport() {
    // Check if necessary features are supported by the browser
    const supportCanvas = !!document.createElement('canvas').getContext;
    const supportWebGL = !!window.WebGLRenderingContext;
    const supportES6 = (function(){ try { return !!eval('class Foo {}'); } catch(e) { return false; } })();
    const supportAsyncAwait = (async function(){})().constructor.name === 'AsyncFunction';
    // Add more feature checks as needed

    // If any critical feature is not supported, show a warning
    if (!supportCanvas || !supportWebGL || !supportES6 || !supportAsyncAwait) {
        const warning = `
            <div style="position:fixed; top:0; left:0; right:0; background-color:#ffcccc; color:#000; padding:10px; z-index:9999;">
                <strong>Warning:</strong> This website uses features that your browser might not fully support. For the best experience, consider using a more recent version of Chrome, Firefox, Safari, or Edge.
                <button id="dismissWarning" style="margin-left:10px;">Dismiss</button>
            </div>
        `;
        document.body.insertAdjacentHTML('afterbegin', warning);
        
        document.getElementById('dismissWarning').addEventListener('click', function() {
            this.parentElement.style.display = 'none';
        });
    }
}

document.addEventListener('DOMContentLoaded', checkBrowserSupport);