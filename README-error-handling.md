# Error Handling & Development Practices

This document outlines the error handling strategies and development practices used in the flock-of-postcards project, specifically focusing on the "fail fast during development, fail gracefully in production" approach.

## Overview

The project implements different error handling strategies for development and production environments to optimize both debugging efficiency and user experience.

## Development vs Production Error Handling

### Development Mode: Fail Fast
During development, the application is configured to fail immediately when errors occur, making debugging easier and preventing silent failures.

### Production Mode: Fail Gracefully  
In production, the application continues to function even when non-critical operations fail, ensuring a smooth user experience.

## Key Error Handling Patterns

### 1. State Persistence (`modules/core/stateManager.mjs`)

**Development Mode:**
- State saving is **blocking** - if the server is down, the app breaks immediately
- Errors are thrown with descriptive messages
- Immediate feedback when server issues occur

**Production Mode:**
- State saving is **non-blocking** - server issues don't break the UI
- Graceful degradation with retry logic
- User experience remains unaffected

```javascript
export function saveState(state) {
    const isDevelopment = import.meta.env?.DEV || process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
        // Development: fail fast and loudly
        return (async () => {
            try {
                const response = await postWithRetry('/api/state', state, { maxRetries: 3, baseDelay: 500 });
                if (!response.ok) {
                    throw new Error(`Failed to save state. Status: ${response.status}`);
                }
            } catch (e) {
                console.error('❌ STATE SAVE FAILED - This is blocking in development mode:', e);
                throw e; // Re-throw to make it fail fast
            }
        })();
    } else {
        // Production: non-blocking and graceful
        (async () => {
            try {
                const response = await postWithRetry('/api/state', state, { maxRetries: 3, baseDelay: 500 });
                if (!response.ok) {
                    console.error('Failed to save state to server');
                }
            } catch (e) {
                console.error('Failed to save state to server:', e);
            }
        })();
    }
}
```

### 2. API Operations (`modules/utils/apiUtils.mjs`)

**Universal Pattern:**
- Retry logic with exponential backoff
- Clear error logging with context
- Graceful fallback for network failures

```javascript
export async function fetchWithRetry(url, options = {}, retryConfig = {}) {
    const { maxRetries = 3, baseDelay = 1000 } = retryConfig;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);
            return response;
        } catch (error) {
            if (attempt === maxRetries) {
                throw error;
            }
            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.warn(`API request failed, retrying in ${delay}ms... (attempt ${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}
```

### 3. Critical Initialization Functions

**Development & Production:**
- All critical initialization functions throw errors immediately
- No silent failures for core functionality
- Clear error messages with context

**Examples:**
- `sceneContainer.initialize()` - Throws if `#scene-container` not found
- `ResumeListController.initialize()` - Throws if resume divs not found
- `App.vue` initialization - Throws if any critical module fails during setup

```javascript
// Example: Critical DOM element check
if (!resumeContentDiv) {
    throw new Error("App.vue: #resume-content-div not found! This is a critical DOM element.");
}
```

### 4. Data Validation Functions

**Development & Production:**
- All validation functions throw errors immediately
- No fallbacks for invalid data
- Clear error messages with context

**Examples:**
- `dateUtils` functions - Throw on invalid dates
- `colorUtils` functions - Throw on invalid colors  
- `mathUtils` functions - Throw on invalid math operations
- `utils` functions - Throw on invalid inputs

```javascript
// Example: Date validation
export function parseFlexibleDateString(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
        throw new Error(`Invalid or empty date string provided: '${dateStr}'`);
    }
    // ... validation logic
}
```

## Error Handling Categories

### ✅ Critical Operations (Always Fail Fast)
- **DOM Element Initialization**: Missing critical DOM elements
- **Data Validation**: Invalid dates, colors, math operations
- **Module Initialization**: Core module failures
- **Configuration**: Missing required configuration

### 🔄 Non-Critical Operations (Development vs Production)
- **State Persistence**: Development blocking, production graceful
- **API Calls**: Retry with exponential backoff
- **Event Handlers**: Development blocking, production graceful
- **Background Operations**: Non-blocking in both modes

### ❌ Never Silent Failures
- **Critical UI Elements**: Always throw if missing
- **Data Integrity**: Always throw on invalid data
- **Core Functionality**: Always throw on core failures

## Development Benefits

1. **Immediate Error Detection**: Issues are caught right away
2. **Clear Error Messages**: Descriptive errors with context
3. **No Silent Failures**: All problems are visible
4. **Faster Debugging**: Issues are obvious and traceable

## Production Benefits

1. **Graceful Degradation**: Non-critical failures don't break the app
2. **Retry Logic**: Automatic recovery from transient failures
3. **User Experience**: Smooth operation even with backend issues
4. **Resilience**: App continues to function with partial failures

## Implementation Guidelines

### When to Use Development Blocking:
- State persistence operations
- Event handler registration
- Background API calls
- Non-critical UI updates

### When to Use Production Graceful:
- State persistence operations
- Background API calls
- Non-critical UI updates
- Optional feature initialization

### When to Always Fail Fast:
- Critical DOM element checks
- Data validation
- Core module initialization
- Configuration validation

## Environment Detection

The application detects the environment using:

```javascript
const isDevelopment = import.meta.env?.DEV || process.env.NODE_ENV === 'development';
```

This works with:
- **Vite**: `import.meta.env.DEV`
- **Node.js**: `process.env.NODE_ENV === 'development'`

## Best Practices

1. **Fail Fast for Critical Operations**: Always throw errors for core functionality
2. **Graceful for Non-Critical**: Use retry logic and fallbacks for optional features
3. **Clear Error Messages**: Include context and actionable information
4. **Environment-Aware**: Different behavior for development vs production
5. **No Silent Failures**: All errors should be logged or thrown
6. **Retry with Backoff**: Use exponential backoff for transient failures

## Debugging Tips

### Development Mode:
- Errors will break the app immediately
- Check console for detailed error messages
- Use browser dev tools to inspect failed operations
- Server issues will be obvious and blocking

### Production Mode:
- Check console for non-blocking error logs
- Monitor network tab for failed API calls
- Use retry logic for transient failures
- App continues to function with partial failures

## Future Improvements

Potential areas for additional development vs production patterns:

1. **Layout/Resize Operations**: Fail fast if viewport calculations fail
2. **Event Handler Registration**: Throw if event listeners can't be attached
3. **Animation/Transition Operations**: Fail fast if animations can't be applied
4. **Local Storage Operations**: Development blocking, production graceful

## Related Files

- `modules/core/stateManager.mjs` - State persistence with dev/prod patterns
- `modules/utils/apiUtils.mjs` - API operations with retry logic
- `modules/components/AppContent.vue` - Critical initialization with fail-fast
- `modules/utils/dateUtils.mjs` - Data validation with immediate errors
- `modules/utils/colorUtils.mjs` - Color validation with immediate errors
- `modules/utils/mathUtils.mjs` - Math validation with immediate errors
- `modules/utils/utils.mjs` - General validation with immediate errors 