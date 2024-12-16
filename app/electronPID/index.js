const { throttle, debounce } = require('lodash');
const { exec } = require('child_process')


let cachedElectronPids = [];
let lastUpdateTime = 0;
const UPDATE_INTERVAL = 10000; // 10 seconds
function getElectronProcessIds() {
    return new Promise((resolve, reject) => {
        const currentTime = Date.now();
        if (currentTime - lastUpdateTime < UPDATE_INTERVAL) {
            resolve(cachedElectronPids);
            return;
        }

        const command = process.platform === 'win32'
            ? `wmic process where "CommandLine like '%${process.execPath.replace(/\\/g, '\\\\')}%'" get ProcessId`
            : `pgrep -f "${process.execPath}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            const pids = stdout.split('\n')
                .map(line => parseInt(line.trim()))
                .filter(pid => !isNaN(pid));

            cachedElectronPids = pids;
            lastUpdateTime = currentTime;
            resolve(pids);
        });
    });
}

const throttledGetElectronProcessIds = throttle(getElectronProcessIds, UPDATE_INTERVAL);


module.exports = {
    electronPID: throttledGetElectronProcessIds()
}