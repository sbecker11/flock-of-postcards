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
    // console.log(`Initializing module: ${moduleName}`);
    await modules.get(moduleName)();
    initializedModules.add(moduleName);
    // console.log(`Module initialized: ${moduleName}`);
}

/**
 * Initialize all registered modules in dependency order
 */
export async function initializeAllModules() {
    for (const moduleName of modules.keys()) {
        await initializeModule(moduleName);
    }
}