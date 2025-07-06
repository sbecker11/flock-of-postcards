/**
 * Makes an API request with retry logic and exponential backoff
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options (method, headers, body, etc.)
 * @param {Object} retryOptions - Retry configuration
 * @param {number} retryOptions.maxRetries - Maximum number of retry attempts (default: 5)
 * @param {number} retryOptions.baseDelay - Base delay in milliseconds (default: 1000)
 * @param {boolean} retryOptions.retryOn404 - Whether to retry on 404 errors (default: false)
 * @returns {Promise<Response>} The fetch response
 */
export async function fetchWithRetry(url, options = {}, retryOptions = {}) {
    const {
        maxRetries = 5,
        baseDelay = 1000,
        retryOn404 = false
    } = retryOptions;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);
            
            // Don't retry on 404 unless specifically requested
            if (response.status === 404 && !retryOn404) {
                return response;
            }
            
            // Don't retry on successful responses
            if (response.ok) {
                return response;
            }
            
            // Retry on server errors (5xx) and other errors if we have attempts left
            if (attempt < maxRetries - 1) {
                const delay = baseDelay * Math.pow(2, attempt);
                window.CONSOLE_LOG_IGNORE(`API request failed (${response.status}), retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            
            // Last attempt failed
            return response;
            
        } catch (error) {
            window.CONSOLE_LOG_IGNORE(`API request error (attempt ${attempt + 1}/${maxRetries}):`, error);
            
            if (attempt < maxRetries - 1) {
                const delay = baseDelay * Math.pow(2, attempt);
                window.CONSOLE_LOG_IGNORE(`Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // Re-throw the error on the last attempt
                throw error;
            }
        }
    }
}

/**
 * Makes a GET request with retry logic
 * @param {string} url - The API endpoint URL
 * @param {Object} retryOptions - Retry configuration
 * @returns {Promise<Response>} The fetch response
 */
export async function getWithRetry(url, retryOptions = {}) {
    return fetchWithRetry(url, { method: 'GET' }, retryOptions);
}

/**
 * Makes a POST request with retry logic
 * @param {string} url - The API endpoint URL
 * @param {Object} data - The data to send
 * @param {Object} retryOptions - Retry configuration
 * @returns {Promise<Response>} The fetch response
 */
export async function postWithRetry(url, data, retryOptions = {}) {
    return fetchWithRetry(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    }, retryOptions);
}

/**
 * Makes a PUT request with retry logic
 * @param {string} url - The API endpoint URL
 * @param {Object} data - The data to send
 * @param {Object} retryOptions - Retry configuration
 * @returns {Promise<Response>} The fetch response
 */
export async function putWithRetry(url, data, retryOptions = {}) {
    return fetchWithRetry(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    }, retryOptions);
}

/**
 * Makes a DELETE request with retry logic
 * @param {string} url - The API endpoint URL
 * @param {Object} retryOptions - Retry configuration
 * @returns {Promise<Response>} The fetch response
 */
export async function deleteWithRetry(url, retryOptions = {}) {
    return fetchWithRetry(url, { method: 'DELETE' }, retryOptions);
} 