// modules/tests/circularDependencyTest.mjs

import { InitializationManager } from '../core/initializationManager.mjs';

/**
 * Test circular dependency detection
 */
export function testCircularDependencyDetection() {
  window.CONSOLE_LOG_IGNORE('🧪 Testing circular dependency detection...');
  
  // Create a fresh instance for testing
  const testManager = new InitializationManager();
  
  try {
    // Test 1: Valid dependencies (no circular)
    window.CONSOLE_LOG_IGNORE('\n📋 Test 1: Valid dependencies');
    testManager.register('A', async () => window.CONSOLE_LOG_IGNORE('A initialized'), []);
    testManager.register('B', async () => window.CONSOLE_LOG_IGNORE('B initialized'), ['A']);
    testManager.register('C', async () => window.CONSOLE_LOG_IGNORE('C initialized'), ['B']);
    
    const validation1 = testManager.validateDependencies();
    window.CONSOLE_LOG_IGNORE('Validation result:', validation1);
    
    // Test 2: Circular dependency (should throw error)
    window.CONSOLE_LOG_IGNORE('\n📋 Test 2: Circular dependency (should fail)');
    try {
      testManager.register('D', async () => window.CONSOLE_LOG_IGNORE('D initialized'), ['E']);
      testManager.register('E', async () => window.CONSOLE_LOG_IGNORE('E initialized'), ['D']);
      window.CONSOLE_LOG_IGNORE('❌ Test failed: Should have thrown circular dependency error');
    } catch (error) {
      window.CONSOLE_LOG_IGNORE('✅ Correctly caught circular dependency:', error.message);
    }
    
    // Test 3: Self-dependency (should throw error)
    window.CONSOLE_LOG_IGNORE('\n📋 Test 3: Self-dependency (should fail)');
    try {
      testManager.register('F', async () => window.CONSOLE_LOG_IGNORE('F initialized'), ['F']);
      window.CONSOLE_LOG_IGNORE('❌ Test failed: Should have thrown self-dependency error');
    } catch (error) {
      window.CONSOLE_LOG_IGNORE('✅ Correctly caught self-dependency:', error.message);
    }
    
    // Test 4: Complex circular dependency
    window.CONSOLE_LOG_IGNORE('\n📋 Test 4: Complex circular dependency (should fail)');
    try {
      testManager.register('G', async () => window.CONSOLE_LOG_IGNORE('G initialized'), ['H']);
      testManager.register('H', async () => window.CONSOLE_LOG_IGNORE('H initialized'), ['I']);
      testManager.register('I', async () => window.CONSOLE_LOG_IGNORE('I initialized'), ['G']);
      window.CONSOLE_LOG_IGNORE('❌ Test failed: Should have thrown complex circular dependency error');
    } catch (error) {
      window.CONSOLE_LOG_IGNORE('✅ Correctly caught complex circular dependency:', error.message);
    }
    
    window.CONSOLE_LOG_IGNORE('\n🎉 All circular dependency tests completed!');
    
  } catch (error) {
    window.CONSOLE_LOG_IGNORE('❌ Test suite failed:', error);
  } finally {
    // Clean up
    testManager.reset();
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCircularDependencyDetection();
} 