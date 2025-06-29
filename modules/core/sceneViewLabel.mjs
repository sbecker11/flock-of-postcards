import * as viewPort from './viewport.mjs';

let sceneViewLabelElement = null;

export function initialize() {
    sceneViewLabelElement = document.getElementById('scene-view-label');
    if (!sceneViewLabelElement) {
        console.error('sceneViewLabel.initialize: #scene-view-label not found in DOM.');
        return;
    }
    console.log('SceneViewLabel initialized');
}

export function repositionLabel() {
    if (!sceneViewLabelElement) return;

    const visualRect = viewPort.getVisualRect();

    const top = visualRect.bottom - 20;
    const left = visualRect.right - 60;

    console.log(`Repositioning SceneViewLabel to: top=${top}px, left=${left}px`);

    sceneViewLabelElement.style.top = `${top}px`;
    sceneViewLabelElement.style.left = `${left}px`;
    sceneViewLabelElement.style.right = 'auto';
} 