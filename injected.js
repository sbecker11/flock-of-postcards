import { safeBrowserRuntimeSendMessage } from './utils/browserUtils.js';

function qx(e) {
    try {
        return e?.useChrome 
            ? async t => og(t) 
            : async t => safeBrowserRuntimeSendMessage(t);
    } catch {
        return async n => og(n);
    }
}
