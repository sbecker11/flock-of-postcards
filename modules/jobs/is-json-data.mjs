export function isJsonData(input) {
    try {
        if (typeof input === 'string') {
            JSON.parse(input);
        } else if (typeof input === 'object' && input !== null) {
            JSON.stringify(input);
        } else {
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}