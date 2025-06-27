// modules/resize/resizeHandler.mjs

// Add this in your resize handle logic where you handle the mousedown event
function onResizeHandleMouseDown(e) {
  // Your existing mousedown code...
  
  // Also add a mousemove handler that recalculates heights during dragging
  document.addEventListener('mousemove', onResizeDrag);
  document.addEventListener('mouseup', onResizeDragEnd);
}

// Add these functions
function onResizeDrag(e) {
  // Your existing drag code...
  
  // Throttle the recalculation
  if (!this.lastRecalcTime || Date.now() - this.lastRecalcTime > 100) {
    this.lastRecalcTime = Date.now();
    
    // Recalculate heights during drag
    if (window.resumeListController && window.resumeListController.infiniteScroller) {
      window.resumeListController.infiniteScroller.recalculateHeightsOnResize(true);
    } else {
      // Fallback if resumeListController is not exposed globally
      const resumeContentDiv = document.getElementById('resume-content-div');
      if (resumeContentDiv && resumeContentDiv.infiniteScroller) {
        resumeContentDiv.infiniteScroller.recalculateHeightsOnResize(true);
      }
    }
  }
}

function onResizeDragEnd(e) {
  // Your existing drag end code...
  
  // Remove the event listeners
  document.removeEventListener('mousemove', onResizeDrag);
  document.removeEventListener('mouseup', onResizeDragEnd);
  
  // Do a final recalculation
  if (window.resumeListController && window.resumeListController.infiniteScroller) {
    window.resumeListController.infiniteScroller.recalculateHeightsOnResize(true);
  }
}

let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Optionally, you can pass the new dimensions to a manager if needed
    // For example: sceneManager.updateDimensions(viewportWidth, viewportHeight);

    // If the infinite scroller is exposed on the window object, tell it to recalculate
    if (window.resumeListController && window.resumeListController.infiniteScroller) {
      window.resumeListController.infiniteScroller.recalculateHeightsOnResize(true);
    } else {
      // Fallback if resumeListController is not exposed globally
      const resumeContentDiv = document.getElementById('resume-content-div');
      if (resumeContentDiv && resumeContentDiv.infiniteScroller) {
        resumeContentDiv.infiniteScroller.recalculateHeightsOnResize(true);
      }
    }
  }, 100); // 100ms debounce
});

let resizeEndTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeEndTimeout);
  resizeEndTimeout = setTimeout(() => {
    console.log('Resize ended');
    if (window.resumeListController && window.resumeListController.infiniteScroller) {
      window.resumeListController.infiniteScroller.recalculateHeightsOnResize(true);
    }
  }, 250); // Assumes resize is over after 250ms of no new events
}); 