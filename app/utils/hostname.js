// app/utils/hostname.js
const os = require('os');

function getWindowsHostname() {
    try {
        const hostname = os.hostname();
        return hostname;
    } catch (error) {
        return `tailscale-embed-test-${Math.random().toString(36).substring(2, 8)}`;
    }
}

module.exports = getWindowsHostname;
