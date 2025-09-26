/**
 * Validates a TSAuth key string
 * @param key The key to validate
 * @returns true if the key is valid, false otherwise
 */
export default function validateTsAuthKey(key: string): boolean {
    if (!key || typeof key !== 'string') {
        return false;
    }
    
    // Check if the key starts with "tskey-auth-"
    if (!key.startsWith('tskey-auth-')) {
        return false;
    }
    
    // Remove the prefix to check the remaining parts
    const remainingKey = key.substring('tskey-auth-'.length);
    
    // Check if there's enough characters remaining
    if (remainingKey.length < 38) { // 17 + 1 + 20
        return false;
    }
    
    // Check if there's a hyphen after exactly 17 characters
    if (remainingKey.charAt(17) !== '-') {
        return false;
    }
    
    // Check if there are at least 20 characters after the hyphen
    if (remainingKey.substring(18).length < 20) {
        return false;
    }
    
    return true;
}