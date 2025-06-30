// moduleManager.mjs - A simple dependency injection system

const modules = new Map();
const initializedModules = new Set();
const dependencies = new Map();

/**
 * Register a module with its dependencies
 * @param {string} moduleName - Name of the module
 * @param {Array<string>} moduleDependencies - Array of dependency module names
 * @param {Function} initFunction - Function to call to initialize the module
 */
export function registerModule(moduleName, moduleDependencies, initFunction) {
    modules.set(moduleName, initFunction);
    dependencies.set(moduleName, moduleDependencies);
}

/**
 * Initialize a module and all its dependencies
 * @param {string} moduleName - Name of the module to initialize
 * @returns {Promise} - Resolves when module and dependencies are initialized
 */
export async function initializeModule(moduleName) {
    // If already initialized, return immediately
    if (initializedModules.has(moduleName)) {
        return;
    }
    
    // Check if module exists
    if (!modules.has(moduleName)) {
        throw new Error(`Module ${moduleName} not registered`);
    }
    
    // Initialize dependencies first
    const moduleDependencies = dependencies.get(moduleName) || [];
    for (const dependency of moduleDependencies) {
        await initializeModule(dependency);
    }
    
    // Initialize the module
    CONSOLE_LOG_IGNORE(`Initializing module: ${moduleName}`);
    await modules.get(moduleName)();
    initializedModules.add(moduleName);
    CONSOLE_LOG_IGNORE(`Module initialized: ${moduleName}`);
}

/**
 * Initialize all registered modules in dependency order
 */
export async function initializeAllModules() {
    for (const moduleName of modules.keys()) {
        await initializeModule(moduleName);
    }
}

/**
 * This module is responsible for initializing all other modules in a specific,
 * ordered sequence to prevent race conditions and dependency errors.
 */

// Import all modules that need initialization
import * as viewPort from './viewPort.mjs';
import * as aimPoint from './aimPoint.mjs';
import * as bullsEye from './bullsEye.mjs';
import * as focalPoint from './focalPoint.mjs';
import * as parallax from './parallax.mjs';
import * as sceneViewLabel from './sceneViewLabel.mjs';
import * as sceneContainer from '../scene/sceneContainer.mjs';
import * as scenePlane from '../scene/scenePlane.mjs';
import * as resizeHandle from './resizeHandle.mjs';
import * as autoScroll from '../animation/autoScroll.mjs';
import * as colorPalettes from '../colors/colorPalettes.mjs';
import * as dateUtils from '../utils/dateUtils.mjs';
import * as timeline from '../timeline/timeline.mjs';
import { jobs as jobsData } from '@/static_content/jobs/jobs.mjs';
import { cardsController } from '../scene/CardsController.mjs';
import { resumeItemsController } from '../scene/ResumeItemsController.mjs';
import { resumeListController } from '../resume/ResumeListController.mjs';
import * as keyDown from './keyDown.mjs';

// Define the initialization stages
const STAGES = [
  {
    name: 'Core Services & UI Elements',
    modules: [
      { name: 'viewPort', init: viewPort.initialize },
      { name: 'aimPoint', init: aimPoint.initialize },
      { name: 'bullsEye', init: bullsEye.initialize },
      { name: 'sceneViewLabel', init: sceneViewLabel.initialize },
      { name: 'resizeHandle', init: resizeHandle.initialize },
      { name: 'autoScroll', init: autoScroll.initialize },
      { name: 'keyDown', init: keyDown.initialize },
      { name: 'sceneContainer', init: sceneContainer.initialize },
    ],
  },
  {
    name: 'Color Palettes & Timeline (Async)',
    modules: [
        { name: 'colorPalettes', init: colorPalettes.initialize },
        { name: 'timeline', init: () => {
            const { minYear, maxYear } = dateUtils.getMinMaxYears(jobsData);
            timeline.initialize(minYear, maxYear);
        }},
    ],
  },
  {
    name: 'Focal Point (depends on Core)',
    modules: [
      { name: 'focalPoint', init: focalPoint.initialize },
    ],
  },
  {
    name: 'Data Controllers (depends on data)',
    modules: [
        { name: 'cardsController', init: () => cardsController.initialize(jobsData) },
        { name: 'resumeItemsController', init: () => {
            // First, initialize the controller itself.
            resumeItemsController.initialize();
            // Then, create the divs which is its primary role in setup.
            const bizResumeDivs = resumeItemsController.createAllBizResumeDivs(cardsController.bizCardDivs);
            const resumeContentDiv = document.getElementById('resume-content-div');
            if (resumeContentDiv) {
              bizResumeDivs.forEach(div => resumeContentDiv.appendChild(div));
            } else {
              console.error("moduleManager: #resume-content-div not found!");
            }
            // Pass the created divs to the next controller in this stage.
            return bizResumeDivs; 
        }},
        { name: 'resumeListController', init: (bizResumeDivs) => {
            // This now receives the divs from the previous step.
            resumeListController.initialize(jobsData, bizResumeDivs);
            window.resumeListController = resumeListController; // Expose for legacy access
        }},
    ]
  },
  {
      name: 'Final Assembly & Rendering',
      modules: [
        { name: 'scenePlane', init: scenePlane.initialize },
        { name: 'parallax', init: () => {
            parallax.initialize();
            // Perform initial render now that cards exist
            const currentFocalPoint = focalPoint.getFocalPoint();
            const sceneRect = viewPort.getVisualRect();
            parallax.viewAllBizCardDivs(currentFocalPoint, "moduleManager-initial-render", sceneRect);
        }},
      ]
  }
];

/**
 * Initializes all application modules in their designated order.
 */
export async function initialize() {
  console.log('ModuleManager: Starting initialization...');
  let stageOutput = null; // To pass output from one module to the next within a stage

  for (const stage of STAGES) {
    console.log(`--- Initializing Stage: ${stage.name} ---`);
    for (const module of stage.modules) {
      try {
        console.log(`Initializing ${module.name}...`);
        // Await async initializers
        const result = await Promise.resolve(module.init(stageOutput));
        // If a module returns a result, pass it to the next module in the same stage
        if (result !== undefined) {
            stageOutput = result;
        }
      } catch (error) {
        console.error(`Failed to initialize module: ${module.name}`, error);
        // Stop initialization if a module fails
        throw new Error(`Initialization failed at module ${module.name}: ${error.message}`);
      }
    }
    stageOutput = null; // Reset for the next stage
  }

  console.log('ModuleManager: All modules initialized successfully.');
}