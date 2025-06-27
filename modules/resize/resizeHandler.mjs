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
    if (window.resumeManager && window.resumeManager.infiniteScroller) {
      window.resumeManager.infiniteScroller.recalculateHeightsOnResize(true);
    } else {
      // Fallback if resumeManager is not exposed globally
      const resumeContentDiv = document.getElementById('resume-content-div');
      if (resumeContentDiv) {
        document.querySelectorAll('.biz-resume-div').forEach(div => {
          // Reset for measurement
          div.style.height = '';
          div.style.minHeight = '';
          
          // Measure
          const rect = div.getBoundingClientRect();
          const contentHeight = Math.ceil(rect.height) + 5;
          
          // Set new height
          div.style.height = `${contentHeight}px`;
          div.style.minHeight = `${contentHeight}px`;
        });
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
  if (window.resumeManager && window.resumeManager.infiniteScroller) {
    window.resumeManager.infiniteScroller.recalculateHeightsOnResize(true);
  }
} 