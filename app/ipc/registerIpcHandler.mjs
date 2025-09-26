import { ipcMain } from 'electron';
import { getEnvConfig, setEnvConfig } from '../config/env-handler.mjs';
import { startTwgProcess } from '../subprocess/twg.mjs';
import { getExecutablePath } from '../utils/get-exe-path.mjs';
import chalk from 'chalk';


export const registerIpcHandler = (mainWindow) => {
    // async request TURN info
    ipcMain.handle('request-TURN-info', async () => {
        return global.TURNinfo;
    })

    // env config read & write
    ipcMain.handle('get-env-config', () => {
        return getEnvConfig();
    })

    ipcMain.handle('no-env-file', () => {
        return global.noEnvFile;
    })

    ipcMain.on('set-env-config', (event, config) => {
        setEnvConfig(config);
    })

    // restart turn-on-tailscale
    ipcMain.on('restart-twg', async () => {
        try {
            if (global.quitTwgProcess) {
                global.quitTwgProcess();
            }

            await new Promise(resolve => setTimeout(resolve, 500));

            console.log(chalk.yellow('restarting tailscale-webrtc-gateway...'));
            global.quitTurnTsProcess = startTwgProcess(mainWindow);

        } catch (error) {
            console.error(chalk.red('restart tailscale-webrtc-gateway failed:'), error);
        }
    })
}