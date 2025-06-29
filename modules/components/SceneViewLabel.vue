<template>
  <div id="scene-view-label" class="viewer-label">
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
  z-index: 100;
  white-space: nowrap;
  writing-mode: horizontal-tb;
  transform: translate(-50%, -50%);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
}
</style> 