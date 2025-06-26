import { throttle } from 'lodash-es';
import psList from 'ps-list';

let cachedElectronPids = [];
let lastUpdateTime = 0;
const UPDATE_INTERVAL = 10000; // 10 seconds

async function getElectronProcessIds() {
    const currentTime = Date.now();
    if (currentTime - lastUpdateTime < UPDATE_INTERVAL) {
        return cachedElectronPids;
    }

    try {
        const processes = await psList();
        const normalizedExecPath = process.execPath.replace(/\\/g, '/').toLowerCase();

        const electronPids = processes
            .filter(p => {
                if (!p.cmd) {
                    return false;
                }
                let normalizedCmd = p.cmd.replace(/\\/g, '/').toLowerCase();
                // Handle potential leading quote in the command
                if (normalizedCmd.startsWith('"')) {
                    const closingQuoteIndex = normalizedCmd.indexOf('"', 1);
                    if (closingQuoteIndex !== -1) {
                        normalizedCmd = normalizedCmd.substring(1, closingQuoteIndex);
                    }
                }
                return normalizedCmd.startsWith(normalizedExecPath);
            })
            .map(p => p.pid);

        cachedElectronPids = electronPids;
        lastUpdateTime = currentTime;
        // console.log('electronPids:', electronPids);
        return electronPids;
    } catch (error) {
        console.error('Error getting process list:', error);
        // Return cached pids or an empty array on error
        return cachedElectronPids;
    }
}

export const getThrottledElectronProcessIds = throttle(getElectronProcessIds, UPDATE_INTERVAL, { 'trailing': false });