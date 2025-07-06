import { ref, computed, onMounted, onUnmounted } from 'vue';

// --- Constants ---
const VIEWPORT_PADDING = 100;

// --- Singleton Pattern ---
let _instance = null;
let _instanceCount = 0;
let _instanceLabels = new Map();

// --- Reactive State ---
const viewportState = ref({
  padding: VIEWPORT_PADDING,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  centerX: 0,
  centerY: 0,
  width: 0,
  height: 0
});

// --- Private State ---
let _sceneContainer = null;
let _resizeObserver = null;

// --- Private Functions ---
function updateViewportProperties() {
  if (!_sceneContainer) return;

  const sceneContainerRect = _sceneContainer.getBoundingClientRect();
  const sceneWidth = _sceneContainer.offsetWidth;
  const viewPortWidth = sceneWidth;
  const viewPortLeft = 0;
  const viewPortHeight = sceneContainerRect.height;
  const viewPortTop = sceneContainerRect.top;

  const newCenterX = viewPortWidth / 2;
  const newCenterY = viewPortHeight / 2;
  
  window.CONSOLE_LOG_IGNORE('updateViewportProperties: viewPortWidth:', viewPortWidth, 'viewPortHeight:', viewPortHeight, 'centerX:', newCenterX, 'centerY:', newCenterY);
  
  viewportState.value = {
    padding: VIEWPORT_PADDING,
    top: viewPortTop - VIEWPORT_PADDING,
    left: viewPortLeft - VIEWPORT_PADDING,
    right: viewPortWidth + 2 * VIEWPORT_PADDING,
    bottom: viewPortHeight + 2 * VIEWPORT_PADDING,
    centerX: newCenterX,
    centerY: newCenterY,
    width: viewPortWidth,
    height: viewPortHeight
  };

  // Dispatch viewport-changed event for backward compatibility
  const event = new CustomEvent('viewport-changed', {
    detail: {
      centerX: viewportState.value.centerX,
      centerY: viewportState.value.centerY,
      width: viewPortWidth,
      height: viewPortHeight
    }
  });
  window.dispatchEvent(event);
}

// --- Composable ---
export function useViewport(label = 'unnamed') {
  // Singleton check - if instance exists, return it immediately
  if (_instance) {
    return _instance;
  }

  // Register cleanup on component unmount (only for the first instance)
  // This must be done immediately to avoid Vue lifecycle warnings
  onUnmounted(() => {
    cleanup();
  });

  // Increment count only for the first (and only) instance
  _instanceCount++;
  const instanceId = `viewport-${_instanceCount}-${label}`;
  
  window.CONSOLE_LOG_IGNORE(`RESIZE: Creating viewport instance: ${instanceId}`);
  // Reactive properties
  const padding = computed(() => viewportState.value.padding);
  const top = computed(() => viewportState.value.top);
  const left = computed(() => viewportState.value.left);
  const right = computed(() => viewportState.value.right);
  const bottom = computed(() => viewportState.value.bottom);
  const centerX = computed(() => viewportState.value.centerX);
  const centerY = computed(() => viewportState.value.centerY);
  const width = computed(() => viewportState.value.width);
  const height = computed(() => viewportState.value.height);

  // Computed properties
  const origin = computed(() => ({
    x: centerX.value,
    y: centerY.value
  }));

  const rect = computed(() => ({
    left: left.value,
    top: top.value,
    right: right.value,
    bottom: bottom.value
  }));

  const visualRect = computed(() => {
    if (!_sceneContainer) {
      return { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 };
    }
    return _sceneContainer.getBoundingClientRect();
  });

  // Public functions
  function initialize() {
    window.CONSOLE_LOG_IGNORE('Viewport initialize called, looking for scene-container...');
    _sceneContainer = document.getElementById('scene-container');
    window.CONSOLE_LOG_IGNORE('Scene container found:', _sceneContainer);
    if (!_sceneContainer) {
      throw new Error("Viewport element #scene-container not found");
    }

    // Initial calculation
    updateViewportProperties();

    // Listen for window resize
    window.addEventListener('resize', updateViewportProperties);

    // Add ResizeObserver for scene container
    if (typeof ResizeObserver !== 'undefined') {
      _resizeObserver = new ResizeObserver(() => {
        window.CONSOLE_LOG_IGNORE('Scene container resized, updating viewport...');
        updateViewportProperties();
      });
      _resizeObserver.observe(_sceneContainer);
    }
  }

  function isInitialized() {
    return _sceneContainer !== null;
  }

  function setViewPortWidth(newWidth) {
    if (!isInitialized()) {
      throw new Error("Viewport not yet initialized");
    }
    if (typeof newWidth !== 'number') {
      throw new Error(`Viewport.setViewPortWidth: ${newWidth} is not a Number`);
    }

    window.CONSOLE_LOG_IGNORE(`RESIZE: setViewPortWidth: ${newWidth}`);
    
    // Update the entire reactive state object to trigger reactivity
    viewportState.value = {
      ...viewportState.value,
      width: newWidth,
      centerX: newWidth / 2
    };

    // Dispatch viewport-changed event for backward compatibility
    const event = new CustomEvent('viewport-changed', {
      detail: {
        centerX: viewportState.value.centerX,
        centerY: viewportState.value.centerY,
        width: newWidth,
        height: viewportState.value.height
      }
    });
    window.dispatchEvent(event);
    
    // Dispatch a custom event for the scene container style
    const styleEvent = new CustomEvent('scene-width-changed', {
      detail: { width: newWidth }
    });
    window.dispatchEvent(styleEvent);
  }

  function isBizCardDivWithinViewPort(bizCardDiv) {
    if (!isInitialized()) {
      throw new Error("Viewport not yet initialized");
    }
    const rect = bizCardDiv.getBoundingClientRect();
    return (
      rect.right >= left.value &&
      rect.left <= right.value &&
      rect.bottom >= top.value &&
      rect.top <= bottom.value
    );
  }

  function cleanup() {
    if (_resizeObserver) {
      _resizeObserver.disconnect();
      _resizeObserver = null;
    }
    window.removeEventListener('resize', updateViewportProperties);
    _sceneContainer = null;
  }

  const viewportInstance = {
    // Reactive properties
    padding,
    top,
    left,
    right,
    bottom,
    centerX,
    centerY,
    width,
    height,
    
    // Computed properties
    origin,
    rect,
    visualRect,
    
    // Functions
    initialize,
    isInitialized,
    setViewPortWidth,
    isBizCardDivWithinViewPort,
    updateViewportProperties
  };

  // Store the instance and its label
  _instance = viewportInstance;
  _instanceLabels.set(viewportInstance, instanceId);
  
  // Add a reset function for testing
  viewportInstance.reset = () => {
    _instance = null;
    _instanceCount = 0;
    _instanceLabels.clear();
    window.CONSOLE_LOG_IGNORE('RESIZE: Viewport singleton reset');
  };
  
  return viewportInstance;
} 