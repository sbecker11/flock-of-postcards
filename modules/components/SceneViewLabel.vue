<template>
  <div id="scene-view-label" class="scene-viewer-label">
    Scene Viewer
  </div>
</template>

<style scoped>
#scene-view-label {
  position: fixed;
  color: white !important;
  font-family: sans-serif;
  font-size: 14px;
  background-color: transparent;
  padding: 10px 5px;
  border-radius: 5px;
  pointer-events: none;
  z-index: 9999;
  white-space: nowrap;
  writing-mode: horizontal-tb;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
  user-select: none;
}

.scene-viewer-label {
  color: white !important;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
}
</style> 