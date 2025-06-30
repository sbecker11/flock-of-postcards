export function safeBrowserRuntimeSendMessage(message) {
    try {
        if (typeof browser === 'undefined' || browser?.runtime === void 0) {
            return og(message);
        } else {
            return browser.runtime.sendMessage(message);
        }
    } catch {
        return og(message);
    }
}
