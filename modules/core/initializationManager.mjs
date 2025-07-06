/**
 * Event-driven initialization manager that removes tight coupling between components
 * Components register their dependencies and initialize when all dependencies are ready
 */

class InitializationManager {
  constructor() {
    this.components = new Map();
    this.dependencies = new Map();
    this.readyComponents = new Set();
    this.initializationPromises = new Map();
    this.eventTarget = new EventTarget();
    
    // Singleton pattern
    if (InitializationManager.instance) {
      return InitializationManager.instance;
    }
    InitializationManager.instance = this;
  }

  /**
   * Register a component with its dependencies
   * @param {string} componentName - Name of the component
   * @param {Function} initFunction - Async function to initialize the component
   * @param {Array<string>} dependencies - Array of component names this depends on
   * @param {Object} options - Additional options
   */
  register(componentName, initFunction, dependencies = [], options = {}) {
    window.CONSOLE_LOG_IGNORE(`[INIT] Registering component: ${componentName} with dependencies: [${dependencies.join(', ')}]`);
    
    // Check for circular dependencies before registering
    if (this.wouldCreateCircularDependency(componentName, dependencies)) {
      const cycle = this.findCircularDependency(componentName, dependencies);
      throw new Error(`[INIT] Circular dependency detected: ${cycle.join(' -> ')} -> ${componentName}`);
    }
    
    this.components.set(componentName, {
      initFunction,
      dependencies: new Set(dependencies),
      options,
      status: 'pending'
    });
    
    this.dependencies.set(componentName, new Set(dependencies));
    
    // If no dependencies, mark as ready to initialize
    if (dependencies.length === 0) {
      this.markComponentReady(componentName);
    }
  }

  /**
   * Check if adding a new dependency would create a circular dependency
   * @param {string} componentName - Name of the component being registered
   * @param {Array<string>} newDependencies - New dependencies to add
   * @returns {boolean} - Whether this would create a circular dependency
   */
  wouldCreateCircularDependency(componentName, newDependencies) {
    // Create a temporary graph to test
    const tempDependencies = new Map(this.dependencies);
    tempDependencies.set(componentName, new Set(newDependencies));
    
    return this.hasCircularDependency(tempDependencies);
  }

  /**
   * Check if a dependency graph has circular dependencies using DFS
   * @param {Map} dependencies - The dependency graph to check
   * @returns {boolean} - Whether there are circular dependencies
   */
  hasCircularDependency(dependencies) {
    const visited = new Set();
    const recursionStack = new Set();
    
    const dfs = (component) => {
      if (recursionStack.has(component)) {
        return true; // Found a cycle
      }
      
      if (visited.has(component)) {
        return false; // Already processed
      }
      
      visited.add(component);
      recursionStack.add(component);
      
      const componentDeps = dependencies.get(component);
      if (componentDeps) {
        for (const dep of componentDeps) {
          if (dfs(dep)) {
            return true;
          }
        }
      }
      
      recursionStack.delete(component);
      return false;
    };
    
    // Check all components
    for (const component of dependencies.keys()) {
      if (!visited.has(component)) {
        if (dfs(component)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Find the circular dependency path
   * @param {string} componentName - Name of the component being registered
   * @param {Array<string>} newDependencies - New dependencies to add
   * @returns {Array<string>} - The circular dependency path
   */
  findCircularDependency(componentName, newDependencies) {
    // Create a temporary graph to test
    const tempDependencies = new Map(this.dependencies);
    tempDependencies.set(componentName, new Set(newDependencies));
    
    const visited = new Set();
    const recursionStack = new Set();
    const path = [];
    
    const dfs = (component, currentPath) => {
      if (recursionStack.has(component)) {
        // Found a cycle, return the path
        const cycleStart = currentPath.indexOf(component);
        return currentPath.slice(cycleStart).concat([component]);
      }
      
      if (visited.has(component)) {
        return null; // Already processed
      }
      
      visited.add(component);
      recursionStack.add(component);
      currentPath.push(component);
      
      const componentDeps = tempDependencies.get(component);
      if (componentDeps) {
        for (const dep of componentDeps) {
          const cycle = dfs(dep, [...currentPath]);
          if (cycle) {
            return cycle;
          }
        }
      }
      
      recursionStack.delete(component);
      currentPath.pop();
      return null;
    };
    
    // Check all components
    for (const component of tempDependencies.keys()) {
      if (!visited.has(component)) {
        const cycle = dfs(component, []);
        if (cycle) {
          return cycle;
        }
      }
    }
    
    return [];
  }

  /**
   * Mark a component as ready (dependencies satisfied)
   * @param {string} componentName - Name of the component
   */
  markComponentReady(componentName) {
    window.CONSOLE_LOG_IGNORE(`[INIT] Component ready: ${componentName}`);
    this.readyComponents.add(componentName);
    this.eventTarget.dispatchEvent(new CustomEvent('component-ready', { 
      detail: { componentName } 
    }));
    
    // Try to initialize components that depend on this one
    this.checkDependencies();
  }

  /**
   * Check if any components can now be initialized
   */
  async checkDependencies() {
    for (const [componentName, component] of this.components) {
      if (component.status === 'pending' && this.canInitialize(componentName)) {
        await this.initializeComponent(componentName);
      }
    }
  }

  /**
   * Check if a component can be initialized (all dependencies ready)
   * @param {string} componentName - Name of the component
   * @returns {boolean} - Whether the component can be initialized
   */
  canInitialize(componentName) {
    const component = this.components.get(componentName);
    if (!component) return false;
    
    for (const dependency of component.dependencies) {
      if (!this.readyComponents.has(dependency)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Initialize a specific component
   * @param {string} componentName - Name of the component
   */
  async initializeComponent(componentName) {
    const component = this.components.get(componentName);
    if (!component || component.status !== 'pending') {
      return;
    }

    window.CONSOLE_LOG_IGNORE(`[INIT] Initializing component: ${componentName}`);
    component.status = 'initializing';

    try {
      // Create initialization promise if it doesn't exist
      if (!this.initializationPromises.has(componentName)) {
        const initPromise = component.initFunction();
        this.initializationPromises.set(componentName, initPromise);
      }

      await this.initializationPromises.get(componentName);
      
      component.status = 'ready';
      window.CONSOLE_LOG_IGNORE(`[INIT] Component initialized successfully: ${componentName}`);
      
      // Mark as ready for other components that depend on this one
      this.markComponentReady(componentName);
      
    } catch (error) {
      component.status = 'error';
      window.CONSOLE_LOG_IGNORE(`[INIT] Failed to initialize component ${componentName}:`, error);
      throw error;
    }
  }

  /**
   * Wait for a specific component to be ready
   * @param {string} componentName - Name of the component
   * @returns {Promise} - Promise that resolves when component is ready
   */
  waitForComponent(componentName) {
    return new Promise((resolve, reject) => {
      if (this.readyComponents.has(componentName)) {
        resolve();
        return;
      }

      const handleReady = (event) => {
        if (event.detail.componentName === componentName) {
          this.eventTarget.removeEventListener('component-ready', handleReady);
          resolve();
        }
      };

      this.eventTarget.addEventListener('component-ready', handleReady);
      
      // Also check if it's already ready (race condition)
      if (this.readyComponents.has(componentName)) {
        this.eventTarget.removeEventListener('component-ready', handleReady);
        resolve();
      }
    });
  }

  /**
   * Wait for multiple components to be ready
   * @param {Array<string>} componentNames - Array of component names
   * @returns {Promise} - Promise that resolves when all components are ready
   */
  async waitForComponents(componentNames) {
    const promises = componentNames.map(name => this.waitForComponent(name));
    await Promise.all(promises);
  }

  /**
   * Get the status of all components
   * @returns {Object} - Status of all components
   */
  getStatus() {
    const status = {};
    for (const [name, component] of this.components) {
      status[name] = {
        status: component.status,
        dependencies: Array.from(component.dependencies),
        ready: this.readyComponents.has(name)
      };
    }
    return status;
  }

  /**
   * Get a visual representation of the dependency graph
   * @returns {string} - ASCII representation of the dependency graph
   */
  getDependencyGraph() {
    const lines = ['Dependency Graph:'];
    const visited = new Set();
    
    const visit = (component, depth = 0) => {
      if (visited.has(component)) {
        return;
      }
      visited.add(component);
      
      const indent = '  '.repeat(depth);
      const status = this.readyComponents.has(component) ? '✓' : '⏳';
      lines.push(`${indent}${status} ${component}`);
      
      const deps = this.dependencies.get(component);
      if (deps) {
        for (const dep of deps) {
          visit(dep, depth + 1);
        }
      }
    };
    
    // Start with components that have no dependencies
    for (const [component, deps] of this.dependencies) {
      if (deps.size === 0) {
        visit(component);
      }
    }
    
    // Then visit any remaining components
    for (const component of this.dependencies.keys()) {
      if (!visited.has(component)) {
        visit(component);
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Validate the current dependency graph
   * @returns {Object} - Validation result
   */
  validateDependencies() {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };
    
    // Check for circular dependencies
    if (this.hasCircularDependency(this.dependencies)) {
      result.isValid = false;
      result.errors.push('Circular dependency detected in the graph');
    }
    
    // Check for missing dependencies
    for (const [component, deps] of this.dependencies) {
      for (const dep of deps) {
        if (!this.components.has(dep)) {
          result.warnings.push(`Component '${component}' depends on '${dep}' which is not registered`);
        }
      }
    }
    
    // Check for orphaned components (no dependencies and no dependents)
    const dependents = new Map();
    for (const [component, deps] of this.dependencies) {
      for (const dep of deps) {
        if (!dependents.has(dep)) {
          dependents.set(dep, new Set());
        }
        dependents.get(dep).add(component);
      }
    }
    
    for (const [component, deps] of this.dependencies) {
      if (deps.size === 0 && !dependents.has(component)) {
        result.warnings.push(`Component '${component}' has no dependencies and no dependents (orphaned)`);
      }
    }
    
    return result;
  }

  /**
   * Reset the initialization manager (for testing)
   */
  reset() {
    this.components.clear();
    this.dependencies.clear();
    this.readyComponents.clear();
    this.initializationPromises.clear();
    InitializationManager.instance = null;
  }
}

// Create and export singleton instance
export const initializationManager = new InitializationManager();

// Export the class for testing
export { InitializationManager }; 